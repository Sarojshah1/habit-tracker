import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { Activity } from "@/lib/models/Activity";
import { getUserTodayDateString, getDateDaysAgoFrom, formatFriendlyDate, getUserDayOfWeek } from "@/lib/utils/date";
import { calculateOverallStreaks, isHabitScheduledForDate, calculateHabitStats } from "@/lib/services/streak";
import { calculateGoalProgress } from "@/lib/services/goal";

export const dynamic = "force-dynamic";

const MOTIVATIONAL_QUOTES = [
  { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  { text: "We are what we repeatedly do. Excellence, then, is not an act, but a habit.", author: "Will Durant" },
  { text: "You do not rise to the level of your goals. You fall to the level of your systems.", author: "James Clear" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
  { text: "Focus on the process, not the outcome. Consistency builds progress.", author: "HabitTrack Wisdom" },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    // 1. Fetch active habits
    const activeHabits = await Habit.find({
      userId: user._id,
      archived: false,
      active: true,
    }).sort({ "schedule.time": 1, createdAt: 1 });

    // 2. Fetch today's completions
    const todayCompletions = await HabitCompletion.find({
      userId: user._id,
      date: todayDateStr,
    });

    const completionMap = new Map<string, { status: string; notes?: string }>();
    todayCompletions.forEach((c) => {
      completionMap.set(c.habitId.toString(), { status: c.status, notes: c.notes });
    });

    // 3. Today's scheduled habits
    const todayHabits = activeHabits
      .filter((h) => isHabitScheduledForDate(h, todayDateStr, timezone))
      .map((h) => {
        const record = completionMap.get(h._id.toString());
        return {
          ...h.toObject(),
          todayStatus: record ? record.status : "pending",
          todayNotes: record ? record.notes : "",
        };
      });

    const completedTodayCount = todayHabits.filter((h) => h.todayStatus === "completed").length;
    const totalTodayHabits = todayHabits.length;

    // 4. Streaks (calculated from all historical completed dates)
    const completedDates = await HabitCompletion.distinct("date", {
      userId: user._id,
      status: "completed",
    });

    const { currentStreak, longestStreak } = calculateOverallStreaks(completedDates, todayDateStr);

    // 5. Weekly Progress (last 7 days: 6 days ago up to today)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyProgress = [];
    let totalWeeklyExpected = 0;
    let totalWeeklyCompleted = 0;

    // Find completions in the last 7 days
    const weekStartDate = getDateDaysAgoFrom(todayDateStr, 6);
    const weekCompletions = await HabitCompletion.find({
      userId: user._id,
      date: { $gte: weekStartDate, $lte: todayDateStr },
      status: "completed",
    });

    const weekCompletionCountsByDate = new Map<string, number>();
    weekCompletions.forEach((c) => {
      weekCompletionCountsByDate.set(c.date, (weekCompletionCountsByDate.get(c.date) || 0) + 1);
    });

    for (let i = 6; i >= 0; i--) {
      const dateStr = getDateDaysAgoFrom(todayDateStr, i);
      const scheduledCount = activeHabits.filter((h) => isHabitScheduledForDate(h, dateStr, timezone)).length;
      const completedCount = weekCompletionCountsByDate.get(dateStr) || 0;
      const pct = scheduledCount > 0 ? Math.round((completedCount / scheduledCount) * 100) : 0;

      totalWeeklyExpected += scheduledCount;
      totalWeeklyCompleted += Math.min(completedCount, scheduledCount);

      const dayIdx = getUserDayOfWeek(dateStr, timezone);
      weeklyProgress.push({
        day: dayNames[dayIdx],
        date: dateStr,
        isToday: dateStr === todayDateStr,
        completionPercentage: Math.min(pct, 100),
        completedCount,
        totalCount: scheduledCount,
      });
    }

    const weeklyCompletionRate =
      totalWeeklyExpected > 0 ? Math.min(100, Math.round((totalWeeklyCompleted / totalWeeklyExpected) * 100)) : 0;

    // 6. Active Goals with dynamic progress
    const allUserCompletions = await HabitCompletion.find({
       userId: user._id,
       status: "completed",
    }).select("habitId date status");

    const rawGoals = await Goal.find({
      userId: user._id,
      status: "active",
    })
      .populate("habitIds", "name icon color")
      .populate("associatedHabitIds", "name icon color")
      .sort({ createdAt: -1 });

    const activeGoals = rawGoals.map((g) => {
      const progress = calculateGoalProgress(g, allUserCompletions, timezone, todayDateStr);
      const habits =
        g.habitIds && g.habitIds.length > 0
          ? g.habitIds
          : g.associatedHabitIds || [];
      return {
        ...g.toObject(),
        habitIds: habits,
        currentValue: progress.currentValue,
        progress,
      };
    });

    // 7. Recent Activity
    const recentActivity = await Activity.find({
      userId: user._id,
    })
      .sort({ createdAt: -1 })
      .limit(8);

    // 8. Mini monthly calendar data (current month)
    const [currYear, currMonth] = todayDateStr.split("-").map(Number);
    const daysInMonth = new Date(currYear, currMonth, 0).getDate();
    const monthPrefix = `${currYear}-${String(currMonth).padStart(2, "0")}`;

    const monthCompletions = await HabitCompletion.find({
      userId: user._id,
      date: { $gte: `${monthPrefix}-01`, $lte: `${monthPrefix}-${daysInMonth}` },
    });

    const monthCompletionsByDate = new Map<string, { completed: number; skipped: number }>();
    monthCompletions.forEach((c) => {
      const current = monthCompletionsByDate.get(c.date) || { completed: 0, skipped: 0 };
      if (c.status === "completed") current.completed++;
      if (c.status === "skipped") current.skipped++;
      monthCompletionsByDate.set(c.date, current);
    });

    const monthCalendarDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
      const scheduledCount = activeHabits.filter((h) => isHabitScheduledForDate(h, dateStr, timezone)).length;
      const rec = monthCompletionsByDate.get(dateStr) || { completed: 0, skipped: 0 };

      let status = "none";
      if (scheduledCount > 0) {
        if (rec.completed >= scheduledCount) {
          status = "completed";
        } else if (rec.completed > 0) {
          status = "partial";
        } else if (dateStr < todayDateStr) {
          status = "missed";
        } else {
          status = "pending";
        }
      }

      monthCalendarDays.push({
        date: dateStr,
        day,
        status,
        completedCount: rec.completed,
        scheduledCount,
        isToday: dateStr === todayDateStr,
      });
    }

    // Random quote based on day of month
    const quoteIndex = (new Date(todayDateStr).getDate() || 0) % MOTIVATIONAL_QUOTES.length;
    const motivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          timezone: user.timezone,
        },
        today: {
          date: todayDateStr,
          friendlyDate: formatFriendlyDate(todayDateStr),
          quote: motivationalQuote,
        },
        stats: {
          habitsCompleted: {
            completed: completedTodayCount,
            total: totalTodayHabits,
            label: `${completedTodayCount}/${totalTodayHabits}`,
          },
          currentStreak: {
            count: currentStreak,
            longest: longestStreak,
            label: `${currentStreak} Days`,
          },
          weeklyCompletion: {
            percentage: weeklyCompletionRate,
            label: `${weeklyCompletionRate}%`,
          },
          goalsInProgress: {
            count: activeGoals.length,
            label: `${activeGoals.length}`,
          },
        },
        todayHabits,
        weeklyProgress,
        monthCalendar: {
          year: currYear,
          month: currMonth,
          days: monthCalendarDays,
        },
        goals: activeGoals,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("GET /api/dashboard error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load dashboard data" },
      { status: 500 }
    );
  }
}
