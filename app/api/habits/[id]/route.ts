import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { habitUpdateSchema } from "@/lib/validations/habit";
import { getUserTodayDateString } from "@/lib/utils/date";
import { calculateHabitStats } from "@/lib/services/streak";
import { logActivity } from "@/lib/services/activity";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const habit = await Habit.findOne({ _id: params.id, userId: user._id });
    if (!habit) {
      return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
    }

    const todayDateStr = getUserTodayDateString(user.timezone || "UTC");
    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: habit._id,
    }).sort({ date: -1 });

    const stats = calculateHabitStats(habit, completions, todayDateStr, user.timezone);

    return NextResponse.json({
      success: true,
      habit,
      stats,
      completions,
    });
  } catch (error) {
    console.error("GET /api/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch habit" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = habitUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const habit = await Habit.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: parsed.data },
      { new: true }
    );

    if (!habit) {
      return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
    }

    await logActivity({
      userId: user._id,
      type: "habit_updated",
      entityId: habit._id,
      entityType: "habit",
      metadata: { habitName: habit.name },
    });

    return NextResponse.json({ success: true, habit });
  } catch (error) {
    console.error("PATCH /api/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update habit" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const habit = await Habit.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!habit) {
      return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
    }

    // Cascade delete completion records for this habit
    await HabitCompletion.deleteMany({ habitId: habit._id, userId: user._id });

    return NextResponse.json({ success: true, message: "Habit deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/habits/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete habit" },
      { status: 500 }
    );
  }
}
