import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { habitSchema } from "@/lib/validations/habit";
import { getUserTodayDateString } from "@/lib/utils/date";
import { calculateHabitStats } from "@/lib/services/streak";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const filter = url.searchParams.get("filter") || "active"; // "all" | "active" | "archived"

    const query: any = { userId: user._id };
    if (filter === "active") {
      query.archived = false;
      query.active = true;
    } else if (filter === "archived") {
      query.archived = true;
    }

    const [habits, totalCount, activeCount, archivedCount] = await Promise.all([
      Habit.find(query).sort({ createdAt: -1 }).lean(),
      Habit.countDocuments({ userId: user._id }),
      Habit.countDocuments({ userId: user._id, archived: false, active: true }),
      Habit.countDocuments({ userId: user._id, archived: true }),
    ]);

    const todayDateStr = getUserTodayDateString(user.timezone || "UTC");

    // Fetch completions with projection and lean()
    const habitIds = habits.map((h: any) => h._id);
    const completions = await HabitCompletion.find({
      userId: user._id,
      habitId: { $in: habitIds },
    })
      .select("habitId date status")
      .lean();

    const enrichedHabits = habits.map((h: any) => {
      const stats = calculateHabitStats(h, completions, todayDateStr, user.timezone);
      const todayRecord = completions.find(
        (c: any) => c.habitId.toString() === h._id.toString() && c.date === todayDateStr
      );

      return {
        ...h,
        stats,
        todayStatus: todayRecord ? todayRecord.status : "pending",
      };
    });

    return NextResponse.json({
      success: true,
      habits: enrichedHabits,
      counts: {
        all: totalCount,
        active: activeCount,
        archived: archivedCount,
      },
    });
  } catch (error) {
    console.error("GET /api/habits error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch habits" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = habitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { name, description, icon, color, frequency, schedule, reminder, startDate, goalId } = parsed.data;

    const habit = await Habit.create({
      userId: user._id,
      name,
      description,
      icon,
      color,
      frequency,
      schedule,
      reminder,
      startDate,
      active: true,
      archived: false,
    });

    if (goalId) {
      await Goal.findOneAndUpdate(
        { _id: goalId, userId: user._id },
        { $addToSet: { associatedHabitIds: habit._id } }
      );
    }

    await logActivity({
      userId: user._id,
      type: "habit_created",
      entityId: habit._id,
      entityType: "habit",
      metadata: { habitName: habit.name },
    });

    return NextResponse.json({ success: true, habit }, { status: 201 });
  } catch (error) {
    console.error("POST /api/habits error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create habit" },
      { status: 500 }
    );
  }
}
