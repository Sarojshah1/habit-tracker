import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { FocusSession } from "@/lib/models/FocusSession";
import { Habit } from "@/lib/models/Habit";
import { Task } from "@/lib/models/Task";
import { focusSessionSchema } from "@/lib/validations/focus";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const sessions = await FocusSession.find({ userId: user._id })
      .populate("habitId", "name icon color")
      .populate("taskId", "title priority dueDate estimatedMinutes actualMinutes")
      .sort({ startedAt: -1 })
      .limit(30)
      .lean();

    const totalMinutes = sessions
      .filter((s) => s.status === "completed")
      .reduce((acc, s) => acc + s.duration, 0);

    return NextResponse.json({
      success: true,
      sessions,
      totalMinutes,
      totalSessions: sessions.filter((s) => s.status === "completed").length,
    });
  } catch (error) {
    console.error("GET /api/focus/sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch focus sessions" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = focusSessionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { duration, status, habitId, taskId, goalId, notes, startedAt, completedAt } = parsed.data;

    let habitName = "";
    if (habitId) {
      const habit = await Habit.findOne({ _id: habitId, userId: user._id });
      if (habit) habitName = habit.name;
    }

    let taskTitle = "";
    if (taskId) {
      const task = await Task.findOne({ _id: taskId, userId: user._id });
      if (task) {
        taskTitle = task.title;
        // Update task's actual minutes idempotently if session is completed
        if (status === "completed") {
          task.actualMinutes = (task.actualMinutes || 0) + duration;
          await task.save();
        }
      }
    }

    const session = await FocusSession.create({
      userId: user._id,
      duration,
      status,
      habitId: habitId || undefined,
      taskId: taskId || undefined,
      goalId: goalId || undefined,
      notes,
      startedAt: startedAt ? new Date(startedAt) : new Date(Date.now() - duration * 60 * 1000),
      completedAt: completedAt ? new Date(completedAt) : new Date(),
    });

    if (status === "completed") {
      await logActivity({
        userId: user._id,
        type: "focus_session_completed",
        entityId: session._id,
        entityType: "focus",
        metadata: {
          duration,
          habitName: habitName || undefined,
          taskTitle: taskTitle || undefined,
          description: taskTitle ? `Focus on: ${taskTitle}` : habitName ? `Habit: ${habitName}` : "General Focus",
        },
      });
    }

    return NextResponse.json({ success: true, session }, { status: 201 });
  } catch (error) {
    console.error("POST /api/focus/sessions error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save focus session" },
      { status: 500 }
    );
  }
}
