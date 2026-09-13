import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Task } from "@/lib/models/Task";
import { FocusSession } from "@/lib/models/FocusSession";
import { Goal } from "@/lib/models/Goal";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { calculateGoalProgress } from "@/lib/services/goal";
import { getAllProductivityInsights } from "@/lib/services/insights";
import { getUserTodayDateString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    // Fetch user's real records
    const [habits, completions, tasks, focusSessions, goals, timeBlocks] = await Promise.all([
      Habit.find({ userId: user._id }),
      HabitCompletion.find({ userId: user._id }),
      Task.find({ userId: user._id }),
      FocusSession.find({ userId: user._id }),
      Goal.find({ userId: user._id }),
      TimeBlock.find({ userId: user._id }),
    ]);

    // Calculate goal progress for real insight evaluation
    const goalsWithProgress = goals.map((g) => ({
      goal: g,
      progress: calculateGoalProgress(g, completions, timezone, todayDateStr),
    }));

    const insights = getAllProductivityInsights({
      habits,
      completions,
      tasks,
      focusSessions,
      goalsWithProgress,
      timeBlocks,
      todayDateStr,
      timezone,
    });

    return NextResponse.json({
      success: true,
      insights,
      count: insights.length,
    });
  } catch (error) {
    console.error("GET /api/insights error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate insights" },
      { status: 500 }
    );
  }
}
