import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { DailyPlan } from "@/lib/models/DailyPlan";
import { Task } from "@/lib/models/Task";
import { dailyPlanSchema } from "@/lib/validations/plan-review";
import { getUserTodayDateString } from "@/lib/utils/date";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const date = url.searchParams.get("date") || getUserTodayDateString(user.timezone || "UTC");

    const plan = await DailyPlan.findOne({ userId: user._id, date }).populate({
      path: "priorityTaskIds",
      select: "title priority status dueDate estimatedMinutes actualMinutes",
    });

    return NextResponse.json({ success: true, plan });
  } catch (error) {
    console.error("GET /api/daily-plan error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch daily plan" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = dailyPlanSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { date, priorityTaskIds, focusTargetMinutes, notes } = parsed.data;

    // Verify ownership of priority tasks
    if (priorityTaskIds.length > 0) {
      const tasks = await Task.find({ _id: { $in: priorityTaskIds }, userId: user._id });
      if (tasks.length !== priorityTaskIds.length) {
        return NextResponse.json(
          { success: false, message: "Unauthorized: Some tasks do not belong to you" },
          { status: 403 }
        );
      }
    }

    const plan = await DailyPlan.findOneAndUpdate(
      { userId: user._id, date },
      {
        $set: {
          priorityTaskIds,
          focusTargetMinutes,
          notes,
        },
      },
      { upsert: true, new: true }
    ).populate({
      path: "priorityTaskIds",
      select: "title priority status dueDate estimatedMinutes actualMinutes",
    });

    await logActivity({
      userId: user._id,
      type: "daily_plan_created",
      entityId: plan._id,
      entityType: "daily_plan",
      metadata: { date, priorityCount: priorityTaskIds.length },
    });

    return NextResponse.json({ success: true, plan }, { status: 200 });
  } catch (error) {
    console.error("POST /api/daily-plan error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to save daily plan" },
      { status: 500 }
    );
  }
}
