import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Goal } from "@/lib/models/Goal";
import { goalSchema } from "@/lib/validations/goal";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const goals = await Goal.find({ userId: user._id })
      .populate("associatedHabitIds", "name icon color")
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, goals });
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

    const goal = await Goal.create({
      ...parsed.data,
      userId: user._id,
    });

    await logActivity({
      userId: user._id,
      type: "goal_created",
      entityId: goal._id,
      entityType: "goal",
      metadata: { goalTitle: goal.title },
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
