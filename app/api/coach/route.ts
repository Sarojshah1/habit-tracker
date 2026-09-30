import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { getUserTodayDateString, getDateDaysAgoFrom } from "@/lib/utils/date";
import { calculateOverallStreaks, isHabitScheduledForDate } from "@/lib/services/streak";
import { getAiCoachDebrief } from "@/lib/services/aiCoach";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);
    const oneYearAgo = getDateDaysAgoFrom(todayDateStr, 365);
    const weekAgo = getDateDaysAgoFrom(todayDateStr, 6);

    const [activeHabits, todayCompletions, completedDates, frozenDatesDistinct, weekCompletions] =
      await Promise.all([
        Habit.find({
          userId: user._id,
          archived: false,
          active: true,
        }).lean(),

        HabitCompletion.find({
          userId: user._id,
          date: todayDateStr,
        }).select("habitId status").lean(),

        HabitCompletion.distinct("date", {
          userId: user._id,
          status: "completed",
          date: { $gte: oneYearAgo },
        }),

        HabitCompletion.distinct("date", {
          userId: user._id,
          status: "frozen",
          date: { $gte: oneYearAgo },
        }),

        HabitCompletion.find({
          userId: user._id,
          date: { $gte: weekAgo, $lte: todayDateStr },
          status: { $in: ["completed", "frozen"] },
        }).select("date status").lean(),
      ]);

    const userFreezeDates = (user.streakFreezes?.usedDates || []).filter((d: string) => d >= oneYearAgo);
    const allFrozenDates = Array.from(new Set([...frozenDatesDistinct, ...userFreezeDates]));

    const { currentStreak, longestStreak } = calculateOverallStreaks(
      completedDates,
      todayDateStr,
      allFrozenDates
    );

    const todayCompletedSet = new Set(
      todayCompletions.filter((c: any) => c.status === "completed").map((c: any) => c.habitId.toString())
    );

    const scheduledTodayHabits = activeHabits.filter((h: any) =>
      isHabitScheduledForDate(h, todayDateStr, timezone)
    );

    const enrichedHabits = scheduledTodayHabits.map((h: any) => ({
      _id: h._id.toString(),
      name: h.name,
      category: h.category,
      schedule: h.schedule,
      twoMinuteVersion: h.twoMinuteVersion,
      todayStatus: todayCompletedSet.has(h._id.toString()) ? "completed" : "pending",
    }));

    const todayCompletedCount = enrichedHabits.filter((h) => h.todayStatus === "completed").length;
    const todayTotalCount = enrichedHabits.length;

    // Approximate weekly completion rate
    const scheduledWeekCount = activeHabits.length * 7;
    const completedWeekCount = weekCompletions.length;
    const weeklyCompletionRate =
      scheduledWeekCount > 0
        ? Math.min(100, Math.round((completedWeekCount / scheduledWeekCount) * 100))
        : 0;

    const debrief = await getAiCoachDebrief({
      userName: user.name || "Student",
      currentStreak,
      longestStreak,
      todayCompletedCount,
      todayTotalCount,
      weeklyCompletionRate,
      activeHabits: enrichedHabits,
      availableFreezes: user.streakFreezes?.available ?? 3,
    });

    return NextResponse.json({
      success: true,
      data: debrief,
    });
  } catch (error) {
    console.error("GET /api/coach error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to generate coaching debrief" },
      { status: 500 }
    );
  }
}
