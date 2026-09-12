import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { goalProgressSchema } from "@/lib/validations/goal";
import { calculateGoalProgress, syncGoalCompletionIfTargetReached } from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";

    const goal = await Goal.findOne({ _id: params.id, userId: user._id });
    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    const rawHabitIds =
      goal.habitIds && goal.habitIds.length > 0
        ? goal.habitIds
        : goal.associatedHabitIds || [];

    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: { $in: rawHabitIds },
      status: "completed",
    }).select("habitId date status");

    const progress = calculateGoalProgress(goal, completions, timezone);

    return NextResponse.json({
      success: true,
      progress,
    });
  } catch (error) {
    console.error("GET /api/goals/[id]/progress error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to calculate goal progress" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const goal = await Goal.findOne({ _id: params.id, userId: user._id });
    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    // Explicit check: Only allow manual progress update when trackingMode === "manual"
    if (goal.trackingMode !== "manual") {
      return NextResponse.json(
        {
          success: false,
          message: "Cannot manually update progress for an automatically tracked goal. Progress is derived from habit completions.",
        },
        { status: 400 }
      );
    }

    const body = await req.json();
    const parsed = goalProgressSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid progress value" },
        { status: 400 }
      );
    }

    const { value } = parsed.data;
    goal.currentValue = value;

    if (goal.currentValue >= goal.targetValue && goal.status === "active") {
      goal.status = "completed";
      goal.completedAt = new Date();
      await syncGoalCompletionIfTargetReached(goal, goal.currentValue, user._id);
    }

    await goal.save();

    const timezone = user.timezone || "UTC";
    const progress = calculateGoalProgress(goal, [], timezone);

    return NextResponse.json({
      success: true,
      message: "Goal progress updated",
      goal,
      progress,
    });
  } catch (error) {
    console.error("POST /api/goals/[id]/progress error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update progress" },
      { status: 500 }
    );
  }
}
