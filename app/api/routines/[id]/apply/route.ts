import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Routine } from "@/lib/models/Routine";
import { Habit } from "@/lib/models/Habit";
import { Task } from "@/lib/models/Task";
import { getUserTodayDateString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayStr = getUserTodayDateString(timezone);

    const routine = await Routine.findById(params.id);
    if (!routine) {
      return NextResponse.json({ success: false, message: "Routine not found" }, { status: 404 });
    }

    const createdHabits = [];
    const createdTasks = [];

    // If routine has template items
    if (routine.items && routine.items.length > 0) {
      for (const item of routine.items) {
        if (item.type === "habit") {
          // Check if habit with same name already exists to avoid duplication
          let habit = await Habit.findOne({
            userId: user._id,
            name: item.name,
            archived: false,
          });

          if (!habit) {
            habit = await Habit.create({
              userId: user._id,
              name: item.name,
              description: item.description || "",
              icon: item.icon || "check-circle",
              color: item.color || "#2D6A4F",
              frequency: "daily",
              startDate: todayStr,
            });
            createdHabits.push(habit);
          }
        } else if (item.type === "task") {
          const task = await Task.create({
            userId: user._id,
            title: item.name,
            description: item.description || "",
            dueDate: todayStr,
            priority: item.priority || "medium",
            estimatedMinutes: item.estimatedMinutes || 30,
            status: "todo",
          });
          createdTasks.push(task);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Routine applied successfully. Created ${createdHabits.length} habits and ${createdTasks.length} tasks for today.`,
      createdHabits,
      createdTasks,
    });
  } catch (error) {
    console.error("POST /api/routines/[id]/apply error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to apply routine" },
      { status: 500 }
    );
  }
}
