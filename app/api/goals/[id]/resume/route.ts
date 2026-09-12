import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { calculateGoalProgress } from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const goal = await Goal.findOne({ _id: params.id, userId: user._id });
    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    // Recalculate progress to decide if resuming active or already completed
    const timezone = user.timezone || "UTC";
    const populatedHabitIds =
      goal.habitIds && goal.habitIds.length > 0
        ? goal.habitIds
        : goal.associatedHabitIds || [];

    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: { $in: populatedHabitIds },
      status: "completed",
    }).select("habitId date status");

    const progress = calculateGoalProgress(goal, completions, timezone);

    goal.status = progress.percentage >= 100 ? "completed" : "active";
    await goal.save();

    return NextResponse.json({
      success: true,
      message: `Goal resumed as ${goal.status}`,
      goal,
    });
  } catch (error) {
    console.error("POST /api/goals/[id]/resume error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to resume goal" },
      { status: 500 }
    );
  }
}
