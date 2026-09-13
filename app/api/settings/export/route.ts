import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { FocusSession } from "@/lib/models/FocusSession";
import { Note } from "@/lib/models/Note";
import { Activity } from "@/lib/models/Activity";
import { Task } from "@/lib/models/Task";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { DailyPlan } from "@/lib/models/DailyPlan";
import { DailyReview } from "@/lib/models/DailyReview";
import { Routine } from "@/lib/models/Routine";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const [
      habits,
      completions,
      goals,
      focusSessions,
      notes,
      activities,
      tasks,
      timeBlocks,
      dailyPlans,
      dailyReviews,
      routines,
      notifications,
    ] = await Promise.all([
      Habit.find({ userId: user._id }),
      HabitCompletion.find({ userId: user._id }),
      Goal.find({ userId: user._id }),
      FocusSession.find({ userId: user._id }),
      Note.find({ userId: user._id }),
      Activity.find({ userId: user._id }),
      Task.find({ userId: user._id }),
      TimeBlock.find({ userId: user._id }),
      DailyPlan.find({ userId: user._id }),
      DailyReview.find({ userId: user._id }),
      Routine.find({ userId: user._id }),
      Notification.find({ userId: user._id }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        language: user.language,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      habits,
      completions,
      goals,
      tasks,
      focusSessions,
      timeBlocks,
      dailyPlans,
      dailyReviews,
      routines,
      notes,
      activities,
      notifications,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="habittrack-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export data" },
      { status: 500 }
    );
  }
}
