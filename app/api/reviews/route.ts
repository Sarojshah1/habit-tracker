import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { DailyReview } from "@/lib/models/DailyReview";
import { Note } from "@/lib/models/Note";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Task } from "@/lib/models/Task";
import { FocusSession } from "@/lib/models/FocusSession";
import { dailyReviewSchema } from "@/lib/validations/plan-review";
import { isHabitScheduledForDate } from "@/lib/services/streak";
import { getUserTodayDateString } from "@/lib/utils/date";
import { calculateDailyScore } from "@/lib/services/productivity";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const timezone = user.timezone || "UTC";
    const date = url.searchParams.get("date") || getUserTodayDateString(timezone);

    // Fetch existing review
    const review = await DailyReview.findOne({ userId: user._id, date });

    // Calculate real stats for this date
    const [activeHabits, habitCompletions, tasks, focusSessions] = await Promise.all([
      Habit.find({ userId: user._id, archived: false }),
      HabitCompletion.find({ userId: user._id, date, status: "completed" }),
      Task.find({ userId: user._id, dueDate: date }),
      FocusSession.find({
        userId: user._id,
        status: "completed",
        startedAt: {
          $gte: new Date(`${date}T00:00:00.000Z`),
          $lte: new Date(`${date}T23:59:59.999Z`),
        },
      }),
    ]);

    const scheduledHabits = activeHabits.filter((h) =>
      isHabitScheduledForDate(h, date, timezone)
    ).length;
    const completedHabits = habitCompletions.length;

    const totalTasks = tasks.filter((t) => t.status !== "cancelled").length;
    const completedTasks = tasks.filter((t) => t.status === "completed").length;

    const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

    const productivityScore = calculateDailyScore(
      completedHabits,
      scheduledHabits,
      completedTasks,
      totalTasks,
      totalFocusMinutes,
      120
    );

    const metrics = {
      habitsCompleted: completedHabits,
      habitsTotal: scheduledHabits,
      tasksCompleted: completedTasks,
      tasksTotal: totalTasks,
      focusMinutes: totalFocusMinutes,
      productivityScore: productivityScore.overallScore,
    };

    return NextResponse.json({
      success: true,
      review,
      metrics,
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch review data" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = dailyReviewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid review input" },
        { status: 400 }
      );
    }

    const { date, wins, improvements, saveToNotes } = parsed.data;

    let noteId: any = undefined;

    // Optional Note Creation
    if (saveToNotes) {
      const noteTitle = `Daily Review — ${date}`;
      const noteContent = `## Daily Review (${date})

### What went well?
${wins || "No wins recorded."}

### What should improve tomorrow?
${improvements || "No improvements recorded."}`;

      // Update or create Note
      let note = await Note.findOne({ userId: user._id, title: noteTitle });
      if (note) {
        note.content = noteContent;
        await note.save();
      } else {
        note = await Note.create({
          userId: user._id,
          title: noteTitle,
          content: noteContent,
          tags: ["Daily Review"],
        });
      }
      noteId = note._id;
    }

    const review = await DailyReview.findOneAndUpdate(
      { userId: user._id, date },
      {
        $set: {
          wins,
          improvements,
          ...(noteId && { noteId }),
        },
      },
      { upsert: true, new: true }
    );

    await logActivity({
      userId: user._id,
      type: "daily_review_completed",
      entityId: review._id,
      entityType: "daily_review",
      metadata: { date },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save daily review" },
      { status: 500 }
    );
  }
}
