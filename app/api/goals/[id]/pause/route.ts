import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const goal = await Goal.findOne({ _id: params.id, userId: user._id });
    if (!goal) {
      return NextResponse.json({ success: false, message: "Goal not found" }, { status: 404 });
    }

    goal.status = "paused";
    await goal.save();

    return NextResponse.json({
      success: true,
      message: "Goal paused successfully",
      goal,
    });
  } catch (error) {
    console.error("POST /api/goals/[id]/pause error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to pause goal" },
      { status: 500 }
    );
  }
}
