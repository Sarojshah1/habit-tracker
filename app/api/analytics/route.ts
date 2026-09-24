import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { FocusSession } from "@/lib/models/FocusSession";
import { Goal } from "@/lib/models/Goal";
import { getUserTodayDateString, getDateDaysAgoFrom, getUserDayOfWeek } from "@/lib/utils/date";
import { calculateOverallStreaks, isHabitScheduledForDate, calculateHabitStats } from "@/lib/services/streak";
import { calculateGoalProgress } from "@/lib/services/goal";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    const url = new URL(req.url);
    const range = url.searchParams.get("range") || "4weeks"; // "7days", "4weeks", "3months"

    let daysCount = 28;
    if (range === "7days") daysCount = 7;
    else if (range === "3months") daysCount = 90;

    const startDate = getDateDaysAgoFrom(todayDateStr, daysCount - 1);

    // 1. Fetch habits, completions, focus sessions, and goals concurrently with lean()
    const [habits, allCompletions, focusSessions, userGoals] = await Promise.all([
      Habit.find({ userId: user._id, archived: false, active: true }).lean(),
      HabitCompletion.find({ userId: user._id })
        .select("habitId date status")
        .lean(),
      FocusSession.find({ userId: user._id, status: "completed" })
        .select("duration")
        .lean(),
      Goal.find({
        userId: user._id,
        status: { $ne: "archived" },
      })
        .populate("habitIds", "name icon color")
        .populate("associatedHabitIds", "name icon color")
        .lean(),
    ]);

    const rangeCompletions = allCompletions.filter((c: any) => c.date >= startDate && c.date <= todayDateStr);

    // 2. Summary stats
    const totalHabitsCompleted = allCompletions.filter((c: any) => c.status === "completed").length;

    // Time spent in focus sessions
    const totalFocusMinutes = focusSessions.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
    const focusHours = Math.floor(totalFocusMinutes / 60);
    const focusRemainingMins = totalFocusMinutes % 60;
    const focusTimeString = focusHours > 0 ? `${focusHours}h ${focusRemainingMins}m` : `${focusRemainingMins}m`;

    // Longest streak
    const completedDates = Array.from(
      new Set(allCompletions.filter((c) => c.status === "completed").map((c) => c.date))
    );
    const { currentStreak, longestStreak } = calculateOverallStreaks(completedDates, todayDateStr);

    // 3. Line chart trend (daily or weekly buckets)
    const trendData = [];
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

    if (range === "7days") {
      for (let i = daysCount - 1; i >= 0; i--) {
        const dStr = getDateDaysAgoFrom(todayDateStr, i);
        const scheduled = habits.filter((h) => isHabitScheduledForDate(h, dStr, timezone)).length;
        const comp = rangeCompletions.filter((c) => c.date === dStr && c.status === "completed").length;
        const rate = scheduled > 0 ? Math.round((comp / scheduled) * 100) : 0;
        const dayIdx = getUserDayOfWeek(dStr, timezone);
        trendData.push({
          label: `${dayNames[dayIdx]} ${dStr.slice(8)}`,
          rate: Math.min(rate, 100),
          completed: comp,
          scheduled,
        });
      }
    } else {
      // Group by weeks
      const numWeeks = Math.ceil(daysCount / 7);
      for (let w = numWeeks - 1; w >= 0; w--) {
        const weekEndOffset = w * 7;
        const weekStartOffset = (w + 1) * 7 - 1;
        const wStart = getDateDaysAgoFrom(todayDateStr, weekStartOffset);
        const wEnd = getDateDaysAgoFrom(todayDateStr, weekEndOffset);

        let wScheduled = 0;
        let wCompleted = 0;

        for (let i = weekStartOffset; i >= weekEndOffset; i--) {
          const dStr = getDateDaysAgoFrom(todayDateStr, i);
          wScheduled += habits.filter((h) => isHabitScheduledForDate(h, dStr, timezone)).length;
          wCompleted += rangeCompletions.filter((c) => c.date === dStr && c.status === "completed").length;
        }

        const rate = wScheduled > 0 ? Math.round((wCompleted / wScheduled) * 100) : 0;
        trendData.push({
          label: `Week ${numWeeks - w}`,
          range: `${wStart.slice(5)} - ${wEnd.slice(5)}`,
          rate: Math.min(rate, 100),
          completed: wCompleted,
          scheduled: wScheduled,
        });
      }
    }

    // Average completion rate across inspected range
    let totalScheduledInRange = 0;
    let totalCompletedInRange = 0;
    for (let i = daysCount - 1; i >= 0; i--) {
      const dStr = getDateDaysAgoFrom(todayDateStr, i);
      totalScheduledInRange += habits.filter((h) => isHabitScheduledForDate(h, dStr, timezone)).length;
      totalCompletedInRange += rangeCompletions.filter((c) => c.date === dStr && c.status === "completed").length;
    }
    const averageCompletion =
      totalScheduledInRange > 0 ? Math.min(100, Math.round((totalCompletedInRange / totalScheduledInRange) * 100)) : 0;

    // 4. Breakdown Donut Chart (Completed vs Skipped vs Missed days in range)
    let fullDaysCompleted = 0;
    let partialDays = 0;
    let missedDays = 0;

    for (let i = daysCount - 1; i >= 0; i--) {
      const dStr = getDateDaysAgoFrom(todayDateStr, i);
      const scheduled = habits.filter((h) => isHabitScheduledForDate(h, dStr, timezone)).length;
      if (scheduled > 0) {
        const comp = rangeCompletions.filter((c) => c.date === dStr && c.status === "completed").length;
        if (comp >= scheduled) {
          fullDaysCompleted++;
        } else if (comp > 0) {
          partialDays++;
        } else if (dStr < todayDateStr) {
          missedDays++;
        }
      }
    }

    const breakdownData = [
      { name: "Completed", value: fullDaysCompleted, color: "#16A34A" },
      { name: "Partial", value: partialDays, color: "#F97316" },
      { name: "Missed", value: missedDays, color: "#EF4444" },
    ];

    // 5. Most consistent habits ranked by completion rate
    const habitStatsList = habits.map((h) => {
      const stats = calculateHabitStats(h, allCompletions, todayDateStr, timezone);
      return {
        id: h._id.toString(),
        name: h.name,
        icon: h.icon,
        color: h.color,
        frequency: h.frequency,
        completionRate: stats.completionRate,
        currentStreak: stats.currentStreak,
        totalCompletions: stats.totalCompletions,
      };
    });

    habitStatsList.sort((a, b) => b.completionRate - a.completionRate);

    // 6. Weekly day-of-week breakdown (Mon - Sun averages)
    const dayTotals = [
      { name: "Mon", dayIdx: 1, completed: 0, scheduled: 0 },
      { name: "Tue", dayIdx: 2, completed: 0, scheduled: 0 },
      { name: "Wed", dayIdx: 3, completed: 0, scheduled: 0 },
      { name: "Thu", dayIdx: 4, completed: 0, scheduled: 0 },
      { name: "Fri", dayIdx: 5, completed: 0, scheduled: 0 },
      { name: "Sat", dayIdx: 6, completed: 0, scheduled: 0 },
      { name: "Sun", dayIdx: 0, completed: 0, scheduled: 0 },
    ];

    for (let i = daysCount - 1; i >= 0; i--) {
      const dStr = getDateDaysAgoFrom(todayDateStr, i);
      const dIdx = getUserDayOfWeek(dStr, timezone);
      const targetDay = dayTotals.find((d) => d.dayIdx === dIdx);
      if (targetDay) {
        targetDay.scheduled += habits.filter((h) => isHabitScheduledForDate(h, dStr, timezone)).length;
        targetDay.completed += rangeCompletions.filter((c) => c.date === dStr && c.status === "completed").length;
      }
    }

    const weeklyActivity = dayTotals.map((d) => ({
      day: d.name,
      completionRate: d.scheduled > 0 ? Math.min(100, Math.round((d.completed / d.scheduled) * 100)) : 0,
      completed: d.completed,
      scheduled: d.scheduled,
    }));

    // 7. Goal Performance Analytics
    const goalsWithProgress = userGoals.map((g: any) => {
      const progress = calculateGoalProgress(g, allCompletions, timezone, todayDateStr);
      return {
        id: g._id.toString(),
        title: g.title,
        icon: g.icon,
        color: g.color,
        type: g.type,
        currentValue: progress.currentValue,
        targetValue: progress.targetValue,
        unit: g.unit,
        percentage: progress.percentage,
        effectiveStatus: progress.effectiveStatus,
        status: g.status,
      };
    });

    const activeGoalsCount = goalsWithProgress.filter(
      (g) => g.effectiveStatus === "active" || g.effectiveStatus === "overdue"
    ).length;
    const completedGoalsCount = goalsWithProgress.filter(
      (g) => g.effectiveStatus === "completed"
    ).length;
    const activeProgressAvg =
      activeGoalsCount > 0
        ? Math.round(
            goalsWithProgress
              .filter((g) => g.effectiveStatus === "active" || g.effectiveStatus === "overdue")
              .reduce((sum, g) => sum + g.percentage, 0) / activeGoalsCount
          )
        : 0;

    const goalMetrics = {
      activeGoals: activeGoalsCount,
      completedGoals: completedGoalsCount,
      totalGoals: goalsWithProgress.length,
      averageProgress: `${activeProgressAvg}%`,
      averageProgressNum: activeProgressAvg,
      goals: goalsWithProgress,
    };

    return NextResponse.json({
      success: true,
      summary: {
        averageCompletion: `${averageCompletion}%`,
        longestStreak: `${longestStreak} Days`,
        currentStreak: `${currentStreak} Days`,
        totalHabitsCompleted,
        timeSpent: focusTimeString,
      },
      trend: trendData,
      breakdown: breakdownData,
      rankedHabits: habitStatsList,
      weeklyActivity,
      goalMetrics,
    });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load analytics" },
      { status: 500 }
    );
  }
}
