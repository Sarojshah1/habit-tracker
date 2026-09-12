import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { goalSchema } from "@/lib/validations/goal";
import { logActivity } from "@/lib/services/activity";
import {
  calculateGoalProgress,
  calculateGoalStats,
  syncGoalCompletionIfTargetReached,
} from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "all"; // all, active, completed, paused, archived

    // Fetch all goals for this user
    const allGoals = await Goal.find({ userId: user._id })
      .populate("habitIds", "name icon color frequency schedule")
      .populate("associatedHabitIds", "name icon color frequency schedule")
      .sort({ createdAt: -1 });

    // Fetch all user completions to calculate dynamic progress
    const completions = await HabitCompletion.find({
      userId: user._id,
      status: "completed",
    }).select("habitId date status");

    // Calculate progress for each goal and sync auto-completions
    const goalsWithProgress = [];
    for (const goal of allGoals) {
      const progress = calculateGoalProgress(goal, completions, timezone);

      // If progress reached target and it's active, update status to completed idempotently
      if (progress.effectiveStatus === "completed" && goal.status === "active") {
        await syncGoalCompletionIfTargetReached(goal, progress.currentValue, user._id);
        goal.status = "completed";
      }

      // Consolidate populated habits
      const populatedHabits =
        goal.habitIds && goal.habitIds.length > 0
          ? goal.habitIds
          : goal.associatedHabitIds || [];

      goalsWithProgress.push({
        ...goal.toObject(),
        habitIds: populatedHabits,
        progress,
      });
    }

    // Calculate dynamic stats across all goals
    const stats = calculateGoalStats(
      goalsWithProgress.map((g) => ({ goal: g, progress: g.progress }))
    );

    // Filter counts
    const counts = {
      all: goalsWithProgress.length,
      active: goalsWithProgress.filter(
        (g) => g.progress.effectiveStatus === "active" || g.progress.effectiveStatus === "overdue"
      ).length,
      completed: goalsWithProgress.filter((g) => g.progress.effectiveStatus === "completed").length,
      paused: goalsWithProgress.filter((g) => g.status === "paused").length,
      archived: goalsWithProgress.filter((g) => g.status === "archived").length,
    };

    // Apply filter to returned list
    let filteredGoals = goalsWithProgress;
    if (filter === "active") {
      filteredGoals = goalsWithProgress.filter(
        (g) =>
          g.status !== "archived" &&
          (g.progress.effectiveStatus === "active" || g.progress.effectiveStatus === "overdue")
      );
    } else if (filter === "completed") {
      filteredGoals = goalsWithProgress.filter(
        (g) => g.progress.effectiveStatus === "completed" && g.status !== "archived"
      );
    } else if (filter === "paused") {
      filteredGoals = goalsWithProgress.filter((g) => g.status === "paused");
    } else if (filter === "archived") {
      filteredGoals = goalsWithProgress.filter((g) => g.status === "archived");
    }

    return NextResponse.json({
      success: true,
      goals: filteredGoals,
      stats,
      counts,
    });
  } catch (error) {
    console.error("GET /api/goals error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch goals" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = goalSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const goalData = parsed.data;

    // Normalizing habit IDs from habitIds or associatedHabitIds
    const rawHabitIds = goalData.habitIds && goalData.habitIds.length > 0
      ? goalData.habitIds
      : goalData.associatedHabitIds || [];

    // Security check: Verify that every habitId belongs to the authenticated user
    if (rawHabitIds.length > 0) {
      const userHabits = await Habit.find({
        _id: { $in: rawHabitIds },
        userId: user._id,
      });

      if (userHabits.length !== rawHabitIds.length) {
        return NextResponse.json(
          {
            success: false,
            message: "Unauthorized: One or more selected habits do not belong to you",
          },
          { status: 403 }
        );
      }
    }

    const goal = await Goal.create({
      ...goalData,
      habitIds: rawHabitIds,
      associatedHabitIds: rawHabitIds,
      userId: user._id,
    });

    await logActivity({
      userId: user._id,
      type: "goal_created",
      entityId: goal._id,
      entityType: "goal",
      metadata: { goalTitle: goal.title, goalType: goal.type },
    });

    return NextResponse.json({ success: true, goal }, { status: 201 });
  } catch (error) {
    console.error("POST /api/goals error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create goal" },
      { status: 500 }
    );
  }
}
