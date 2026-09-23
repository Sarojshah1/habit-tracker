import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { User } from "@/lib/models/User";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

// GET /api/habits/freeze - Get user's available streak freeze tokens and recent freeze records
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const dbUser = await User.findById(user._id);
    const available = dbUser?.streakFreezes?.available ?? 3;
    const usedDates = dbUser?.streakFreezes?.usedDates ?? [];

    // Find all habits currently frozen for today or past days
    const frozenCompletions = await HabitCompletion.find({
      userId: user._id,
      status: "frozen",
    }).sort({ date: -1 }).limit(20);

    return NextResponse.json({
      success: true,
      available,
      usedDates,
      frozenCompletions,
    });
  } catch (error) {
    console.error("GET /api/habits/freeze error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch streak freeze status" },
      { status: 500 }
    );
  }
}

// POST /api/habits/freeze - Apply a streak freeze for a given date
// If habitId is provided, freezes that specific habit. If not, freezes all active habits for that date.
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { date, habitId, reason = "Exam day protection" } = body;

    if (!date) {
      return NextResponse.json(
        { success: false, message: "Date is required" },
        { status: 400 }
      );
    }

    const dbUser = await User.findById(user._id);
    if (!dbUser) return unauthorizedResponse();

    const available = dbUser.streakFreezes?.available ?? 3;
    if (available <= 0) {
      return NextResponse.json(
        {
          success: false,
          message: "No streak freeze tokens available. Tokens refresh each month or through study milestones!",
        },
        { status: 400 }
      );
    }

    // Determine habits to freeze
    let habitsToFreeze: any[] = [];
    if (habitId) {
      const h = await Habit.findOne({ _id: habitId, userId: user._id });
      if (!h) {
        return NextResponse.json({ success: false, message: "Habit not found" }, { status: 404 });
      }
      habitsToFreeze = [h];
    } else {
      habitsToFreeze = await Habit.find({ userId: user._id, active: true, archived: false });
    }

    if (habitsToFreeze.length === 0) {
      return NextResponse.json(
        { success: false, message: "No active habits to freeze" },
        { status: 400 }
      );
    }

    // Create or update completions with status "frozen"
    const frozenResults = [];
    for (const h of habitsToFreeze) {
      const completion = await HabitCompletion.findOneAndUpdate(
        { userId: user._id, habitId: h._id, date },
        {
          userId: user._id,
          habitId: h._id,
          date,
          status: "frozen",
          notes: `❄️ Protected with Streak Freeze: ${reason}`,
          completedAt: new Date(),
        },
        { upsert: true, new: true }
      );
      frozenResults.push(completion);
    }

    // Deduct 1 streak freeze token
    if (!dbUser.streakFreezes) {
      dbUser.streakFreezes = { available: 3, usedDates: [] };
    }
    dbUser.streakFreezes.available = Math.max(0, dbUser.streakFreezes.available - 1);
    if (!dbUser.streakFreezes.usedDates.includes(date)) {
      dbUser.streakFreezes.usedDates.push(date);
    }
    await dbUser.save();

    await logActivity({
      userId: user._id.toString(),
      type: "habit_completed",
      entityType: "StreakFreeze",
      metadata: {
        title: "❄️ Streak Freeze Activated",
        description: `Protected habit streak for ${date} (${habitsToFreeze.length} habits shielded).`,
        date,
        reason,
        frozenCount: habitsToFreeze.length,
      },
    });

    return NextResponse.json({
      success: true,
      message: `Streak freeze applied for ${date}. Your streak is protected!`,
      available: dbUser.streakFreezes.available,
      frozenCount: habitsToFreeze.length,
      completions: frozenResults,
    });
  } catch (error) {
    console.error("POST /api/habits/freeze error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to apply streak freeze" },
      { status: 500 }
    );
  }
}
