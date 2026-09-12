import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { logActivity } from "@/lib/services/activity";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const habit = await Habit.findOne({ _id: params.id, userId: user._id });
    if (!habit) {
      return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
    }

    habit.archived = !habit.archived;
    await habit.save();

    await logActivity({
      userId: user._id,
      type: "habit_archived",
      entityId: habit._id,
      entityType: "habit",
      metadata: { habitName: habit.name, archived: habit.archived },
    });

    return NextResponse.json({
      success: true,
      habit,
      message: habit.archived ? "Habit archived" : "Habit restored",
    });
  } catch (error) {
    console.error("POST /api/habits/[id]/archive error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update archive status" },
      { status: 500 }
    );
  }
}
