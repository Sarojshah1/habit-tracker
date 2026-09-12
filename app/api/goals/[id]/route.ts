import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Activity } from "@/lib/models/Activity";
import { goalUpdateSchema } from "@/lib/validations/goal";
import { logActivity } from "@/lib/services/activity";
import {
  calculateGoalProgress,
  calculateGoalHistory,
  syncGoalCompletionIfTargetReached,
} from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";

    const goal = await Goal.findOne({ _id: params.id, userId: user._id })
      .populate("habitIds", "name icon color frequency schedule")
      .populate("associatedHabitIds", "name icon color frequency schedule");

    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    // Fetch user completions for linked habits
    const populatedHabits =
      goal.habitIds && goal.habitIds.length > 0
        ? goal.habitIds
        : goal.associatedHabitIds || [];

    const linkedHabitIds = populatedHabits.map((h: any) => h._id);

    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: { $in: linkedHabitIds },
      status: "completed",
    }).select("habitId date status");

    const progress = calculateGoalProgress(goal, completions, timezone);

    // Sync goal completion if target reached
    if (progress.effectiveStatus === "completed" && goal.status === "active") {
      await syncGoalCompletionIfTargetReached(goal, progress.currentValue, user._id);
      goal.status = "completed";
    }

    // Calculate historical progress points for the chart
    const history = calculateGoalHistory(goal, completions, timezone);

    // Fetch activities related to this goal
    const activities = await Activity.find({
      userId: user._id,
      entityId: goal._id,
    })
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      goal: {
        ...goal.toObject(),
        habitIds: populatedHabits,
        progress,
        history,
        activities,
      },
    });
  } catch (error) {
    console.error("GET /api/goals/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch goal" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const body = await req.json();
    const parsed = goalUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const updateData: any = { ...parsed.data };

    // If habitIds or associatedHabitIds are provided, verify ownership
    const rawHabitIds =
      updateData.habitIds || updateData.associatedHabitIds;

    if (rawHabitIds !== undefined) {
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
      updateData.habitIds = rawHabitIds;
      updateData.associatedHabitIds = rawHabitIds;
    }

    const goal = await Goal.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: updateData },
      { new: true }
    )
      .populate("habitIds", "name icon color frequency schedule")
      .populate("associatedHabitIds", "name icon color frequency schedule");

    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    // Recalculate progress after update
    const populatedHabits =
      goal.habitIds && goal.habitIds.length > 0
        ? goal.habitIds
        : goal.associatedHabitIds || [];

    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: { $in: populatedHabits.map((h: any) => h._id) },
      status: "completed",
    }).select("habitId date status");

    const progress = calculateGoalProgress(goal, completions, timezone);

    if (progress.effectiveStatus === "completed" && goal.status === "active") {
      await syncGoalCompletionIfTargetReached(goal, progress.currentValue, user._id);
      goal.status = "completed";
    }

    return NextResponse.json({
      success: true,
      goal: {
        ...goal.toObject(),
        habitIds: populatedHabits,
        progress,
      },
    });
  } catch (error) {
    console.error("PATCH /api/goals/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update goal" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const goal = await Goal.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    // Deleting goal does NOT touch habit or completion records as per prompt requirement
    return NextResponse.json({ success: true, message: "Goal deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/goals/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete goal" },
      { status: 500 }
    );
  }
}
