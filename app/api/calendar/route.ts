import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { getUserTodayDateString, getUserDayOfWeek } from "@/lib/utils/date";
import { isHabitScheduledForDate } from "@/lib/services/streak";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    const [todayYear, todayMonth] = todayDateStr.split("-").map(Number);
    const year = yearParam ? parseInt(yearParam, 10) : todayYear;
    const month = monthParam ? parseInt(monthParam, 10) : todayMonth; // 1-12

    const monthStr = String(month).padStart(2, "0");
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

    // Active & archived habits that existed during or before this month
    const habits = await Habit.find({
      userId: user._id,
      startDate: { $lte: endDate },
    });

    const completions = await HabitCompletion.find({
      userId: user._id,
      date: { $gte: startDate, $lte: endDate },
    });

    // Active goals that overlap with this month
    const activeGoals = await Goal.find({
      userId: user._id,
      status: { $in: ["active", "completed"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    }).select("title icon color habitIds associatedHabitIds startDate endDate");

    // Map completions by date -> habitId -> status
    const completionByDateAndHabit = new Map<string, Map<string, { status: string; notes?: string }>>();
    completions.forEach((c) => {
      if (!completionByDateAndHabit.has(c.date)) {
        completionByDateAndHabit.set(c.date, new Map());
      }
      completionByDateAndHabit.get(c.date)!.set(c.habitId.toString(), {
        status: c.status,
        notes: c.notes,
      });
    });

    // Generate days data
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
      const dayHabitMap = completionByDateAndHabit.get(dateStr) || new Map();

      // Find all habits scheduled for this day
      const scheduledHabits = habits
        .filter((h) => !h.archived && isHabitScheduledForDate(h, dateStr, timezone))
        .map((h) => {
          const completionInfo = dayHabitMap.get(h._id.toString());
          const status = completionInfo ? completionInfo.status : dateStr < todayDateStr ? "missed" : "pending";

          // Find active goals that this habit contributes to on this date
          const contributingGoals = activeGoals
            .filter((g) => {
              const ids = (g.habitIds && g.habitIds.length > 0 ? g.habitIds : g.associatedHabitIds || []).map(
                (id: any) => id.toString()
              );
              return ids.includes(h._id.toString()) && dateStr >= g.startDate && dateStr <= g.endDate;
            })
            .map((g) => ({
              id: g._id.toString(),
              title: g.title,
              icon: g.icon,
              color: g.color,
            }));

          return {
            _id: h._id,
            name: h.name,
            icon: h.icon,
            color: h.color,
            schedule: h.schedule,
            frequency: h.frequency,
            status,
            notes: completionInfo ? completionInfo.notes : "",
            contributingGoals,
          };
        });

      const totalScheduled = scheduledHabits.length;
      const completedCount = scheduledHabits.filter((h) => h.status === "completed").length;
      const skippedCount = scheduledHabits.filter((h) => h.status === "skipped").length;
      const missedCount = scheduledHabits.filter((h) => h.status === "missed").length;
      const pendingCount = scheduledHabits.filter((h) => h.status === "pending").length;

      let indicator: "completed" | "partial" | "missed" | "no_activity" = "no_activity";
      if (totalScheduled > 0) {
        if (completedCount === totalScheduled) {
          indicator = "completed";
        } else if (completedCount > 0) {
          indicator = "partial";
        } else if (dateStr < todayDateStr) {
          indicator = "missed";
        }
      }

      const completionPercentage = totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0;

      days.push({
        date: dateStr,
        dayNumber: d,
        dayOfWeek: getUserDayOfWeek(dateStr, timezone),
        isToday: dateStr === todayDateStr,
        isPast: dateStr < todayDateStr,
        isFuture: dateStr > todayDateStr,
        indicator,
        completionPercentage,
        totalScheduled,
        completedCount,
        skippedCount,
        missedCount,
        pendingCount,
        habits: scheduledHabits,
      });
    }

    return NextResponse.json({
      success: true,
      calendar: {
        year,
        month,
        todayDate: todayDateStr,
        days,
      },
    });
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load calendar data" },
      { status: 500 }
    );
  }
}
