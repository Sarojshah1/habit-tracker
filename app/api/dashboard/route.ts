import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { Activity } from "@/lib/models/Activity";
import { Task } from "@/lib/models/Task";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { DailyPlan } from "@/lib/models/DailyPlan";
import { DailyReview } from "@/lib/models/DailyReview";
import { FocusSession } from "@/lib/models/FocusSession";
import { getUserTodayDateString, getDateDaysAgoFrom, formatFriendlyDate, getUserDayOfWeek } from "@/lib/utils/date";
import { calculateOverallStreaks, isHabitScheduledForDate, calculateHabitStats } from "@/lib/services/streak";
import { calculateGoalProgress } from "@/lib/services/goal";
import { calculateDailyScore } from "@/lib/services/productivity";

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

    // Compute date ranges beforehand for concurrent queries
    const weekStartDate = getDateDaysAgoFrom(todayDateStr, 6);
    const [currYear, currMonth] = todayDateStr.split("-").map(Number);
    const daysInMonth = new Date(currYear, currMonth, 0).getDate();
    const monthPrefix = `${currYear}-${String(currMonth).padStart(2, "0")}`;
    const ninetyDaysAgo = getDateDaysAgoFrom(todayDateStr, 89);

    const oneYearAgo = getDateDaysAgoFrom(todayDateStr, 365);

    // Fetch all independent collections concurrently with lean() for fast serverless execution
    const [
      activeHabits,
      todayCompletions,
      completedDates,
      rawGoals,
      recentActivity,
      todayTasksRaw,
      todayPlan,
      todayReview,
      todayTimeBlocks,
      todayFocusSessions,
      ninetyDayCompletions,
    ] = await Promise.all([
      // 1. Fetch active habits
      Habit.find({
        userId: user._id,
        archived: false,
        active: true,
      })
        .populate("habitStackAfterHabitId", "name icon color")
        .sort({ "schedule.time": 1, createdAt: 1 })
        .lean(),

      // 2. Fetch today's completions
      HabitCompletion.find({
        userId: user._id,
        date: todayDateStr,
      })
        .select("habitId status notes completionType")
        .lean(),

      // 3. Completed dates for overall streaks (last 365 days)
      HabitCompletion.distinct("date", {
        userId: user._id,
        status: "completed",
        date: { $gte: oneYearAgo },
      }),

      // 4. Active goals
      Goal.find({
        userId: user._id,
        status: "active",
      })
        .populate("habitIds", "name icon color")
        .populate("associatedHabitIds", "name icon color")
        .sort({ createdAt: -1 })
        .lean(),

      // 5. Recent activity (capped to 8)
      Activity.find({
        userId: user._id,
      })
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),

      // 6. Today's tasks
      Task.find({ userId: user._id, dueDate: todayDateStr })
        .populate("goalId", "title icon color")
        .populate("habitId", "name icon color")
        .sort({ priority: -1, createdAt: 1 })
        .lean(),

      // 7. Today's daily plan
      DailyPlan.findOne({ userId: user._id, date: todayDateStr })
        .populate({
          path: "priorityTaskIds",
          select: "title priority status dueDate estimatedMinutes actualMinutes",
        })
        .lean(),

      // 8. Today's daily review
      DailyReview.findOne({ userId: user._id, date: todayDateStr }).lean(),

      // 9. Today's time blocks
      TimeBlock.find({
        userId: user._id,
        start: {
          $gte: new Date(`${todayDateStr}T00:00:00.000Z`),
          $lte: new Date(`${todayDateStr}T23:59:59.999Z`),
        },
      })
        .sort({ start: 1 })
        .lean(),

      // 10. Today's focus sessions
      FocusSession.find({
        userId: user._id,
        status: "completed",
        startedAt: {
          $gte: new Date(`${todayDateStr}T00:00:00.000Z`),
          $lte: new Date(`${todayDateStr}T23:59:59.999Z`),
        },
      })
        .select("duration")
        .lean(),

      // 11. 90-day heatmap completions (also provides week and month completions)
      HabitCompletion.find({
        userId: user._id,
        date: { $gte: ninetyDaysAgo, $lte: todayDateStr },
        status: { $in: ["completed", "skipped", "frozen"] },
      })
        .select("habitId date status")
        .lean(),
    ]);

    // Derive week and month completions from ninetyDayCompletions in memory without extra DB queries
    const weekCompletions = ninetyDayCompletions.filter(
      (c: any) => c.date >= weekStartDate && c.date <= todayDateStr && c.status === "completed"
    );
    const monthCompletions = ninetyDayCompletions.filter(
      (c: any) => c.date >= `${monthPrefix}-01` && c.date <= `${monthPrefix}-${daysInMonth}`
    );
    const allUserCompletions = ninetyDayCompletions.filter((c: any) => c.status === "completed");

    const completionMap = new Map<string, { status: string; notes?: string; completionType?: string }>();
    todayCompletions.forEach((c: any) => {
      completionMap.set(c.habitId.toString(), {
        status: c.status,
        notes: c.notes,
        completionType: c.completionType || "full",
      });
    });

    // 3. Today's scheduled habits
    const todayHabits = activeHabits
      .filter((h: any) => isHabitScheduledForDate(h, todayDateStr, timezone))
      .map((h: any) => {
        const record = completionMap.get(h._id.toString());
        return {
          ...h,
          todayStatus: record ? record.status : "pending",
          todayCompletionType: record?.completionType || "full",
          todayNotes: record ? record.notes : "",
        };
      });

    const completedTodayCount = todayHabits.filter((h: any) => h.todayStatus === "completed").length;
    const totalTodayHabits = todayHabits.length;

    // 4. Streaks (calculated from all historical completed dates)
    const { currentStreak, longestStreak } = calculateOverallStreaks(completedDates, todayDateStr);

    // 5. Weekly Progress (last 7 days: 6 days ago up to today)
    const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const weeklyProgress = [];
    let totalWeeklyExpected = 0;
    let totalWeeklyCompleted = 0;

    const weekCompletionCountsByDate = new Map<string, number>();
    weekCompletions.forEach((c: any) => {
      weekCompletionCountsByDate.set(c.date, (weekCompletionCountsByDate.get(c.date) || 0) + 1);
    });

    for (let i = 6; i >= 0; i--) {
      const dateStr = getDateDaysAgoFrom(todayDateStr, i);
      const scheduledCount = activeHabits.filter((h: any) => isHabitScheduledForDate(h, dateStr, timezone)).length;
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
    const activeGoals = rawGoals.map((g: any) => {
      const progress = calculateGoalProgress(g, allUserCompletions, timezone, todayDateStr);
      const habits =
        g.habitIds && g.habitIds.length > 0
          ? g.habitIds
          : g.associatedHabitIds || [];
      return {
        ...g,
        habitIds: habits,
        currentValue: progress.currentValue,
        progress,
      };
    });

    // 8. Mini monthly calendar data (current month)
    const monthCompletionsByDate = new Map<string, { completed: number; skipped: number }>();
    monthCompletions.forEach((c: any) => {
      const current = monthCompletionsByDate.get(c.date) || { completed: 0, skipped: 0 };
      if (c.status === "completed") current.completed++;
      if (c.status === "skipped") current.skipped++;
      monthCompletionsByDate.set(c.date, current);
    });

    const monthCalendarDays = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${monthPrefix}-${String(day).padStart(2, "0")}`;
      const scheduledCount = activeHabits.filter((h: any) => isHabitScheduledForDate(h, dateStr, timezone)).length;
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

    // 9. Today's Tasks & Priorities
    const todayTasks = todayTasksRaw.filter((t: any) => t.status !== "cancelled");
    const completedTasksCount = todayTasks.filter((t: any) => t.status === "completed").length;

    // Top priorities: From dailyPlan if exists, or top high/medium priority tasks
    let todayPriorities: any[] = [];
    if (todayPlan?.priorityTaskIds && todayPlan.priorityTaskIds.length > 0) {
      const priorityIds = new Set(todayPlan.priorityTaskIds.map((item: any) => (item._id || item).toString()));
      todayPriorities = todayTasks.filter((t: any) => priorityIds.has(t._id.toString()));
    }
    if (todayPriorities.length === 0) {
      todayPriorities = todayTasks.slice(0, 3);
    }

    // Today's schedule: Combine user TimeBlocks + tasks that have scheduledStart/End
    const scheduledTasksAsBlocks = todayTasks
      .filter((t: any) => t.scheduledStart && t.scheduledEnd)
      .map((t: any) => ({
        _id: `task-sched-${t._id}`,
        title: t.title,
        start: t.scheduledStart!,
        end: t.scheduledEnd!,
        type: "task",
        taskId: t,
        color: "#2563EB",
      }));

    const todaySchedule = [...todayTimeBlocks, ...scheduledTasksAsBlocks].sort(
      (a: any, b: any) => new Date(a.start || 0).getTime() - new Date(b.start || 0).getTime()
    );

    // Focus Target & Completed Focus Time
    const focusTargetMinutes = todayPlan?.focusTargetMinutes || 120;
    const focusCompletedMinutes = todayFocusSessions.reduce(
      (acc: number, s: any) => acc + (s.duration || 0),
      0
    );

    // Daily Productivity Score
    const productivityScore = calculateDailyScore(
      completedTodayCount,
      totalTodayHabits,
      completedTasksCount,
      todayTasks.length,
      focusCompletedMinutes,
      focusTargetMinutes
    );

    // 90-Day Discipline Matrix for Habit Heatmap
    const countByDateMap = new Map<string, number>();
    ninetyDayCompletions.forEach((c: any) => {
      countByDateMap.set(c.date, (countByDateMap.get(c.date) || 0) + 1);
    });

    const consistencyMatrix = [];
    for (let i = 89; i >= 0; i--) {
      const dStr = getDateDaysAgoFrom(todayDateStr, i);
      const count = countByDateMap.get(dStr) || 0;
      consistencyMatrix.push({
        date: dStr,
        count,
        level: count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4,
      });
    }

    // Random quote based on day of month
    const quoteIndex = (new Date(todayDateStr).getDate() || 0) % MOTIVATIONAL_QUOTES.length;
    const motivationalQuote = MOTIVATIONAL_QUOTES[quoteIndex];

    const dashboardWidgets =
      user.preferences?.dashboardPreferences?.widgets || [
        "priorities",
        "tasks",
        "habits",
        "schedule",
        "focus",
        "goals",
        "weekly",
        "activity",
        "insights",
      ];

    return NextResponse.json({
      success: true,
      data: {
        user: {
          id: user._id.toString(),
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          timezone: user.timezone,
          widgets: dashboardWidgets,
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
          tasksCompleted: {
            completed: completedTasksCount,
            total: todayTasks.length,
            label: `${completedTasksCount}/${todayTasks.length}`,
          },
          focusTime: {
            completedMinutes: focusCompletedMinutes,
            targetMinutes: focusTargetMinutes,
            label: `${Math.floor(focusCompletedMinutes / 60)}h ${focusCompletedMinutes % 60}m`,
          },
          productivityScore: productivityScore.overallScore,
        },
        todayHabits,
        todayTasks,
        todayPriorities,
        todaySchedule,
        todayPlan,
        todayReview,
        focusStatus: {
          targetMinutes: focusTargetMinutes,
          completedMinutes: focusCompletedMinutes,
        },
        productivityScore,
        weeklyProgress,
        monthCalendar: {
          year: currYear,
          month: currMonth,
          days: monthCalendarDays,
        },
        goals: activeGoals,
        recentActivity,
        consistencyMatrix,
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
