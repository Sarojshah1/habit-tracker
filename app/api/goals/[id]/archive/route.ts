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

    // Toggle or set archived
    const isCurrentlyArchived = goal.status === "archived";
    goal.status = isCurrentlyArchived ? "active" : "archived";
    await goal.save();

    return NextResponse.json({
      success: true,
      message: isCurrentlyArchived ? "Goal unarchived" : "Goal archived",
      goal,
    });
  } catch (error) {
    console.error("POST /api/goals/[id]/archive error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to archive/unarchive goal" },
      { status: 500 }
    );
  }
}
