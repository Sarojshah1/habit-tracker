import { IHabit } from "@/lib/models/Habit";
import { ITask } from "@/lib/models/Task";
import { IFocusSession } from "@/lib/models/FocusSession";
import { ITimeBlock } from "@/lib/models/TimeBlock";
import { GoalProgressResult } from "@/lib/services/goal";
import { getUserDayOfWeek, getDateDaysAgoFrom } from "@/lib/utils/date";

export type InsightType = "positive" | "warning" | "neutral" | "actionable";
export type InsightSeverity = "low" | "medium" | "high";

export interface ProductivityInsight {
  id: string;
  type: InsightType;
  title: string;
  description: string;
  severity: InsightSeverity;
  metric?: string;
  category: "habit" | "task" | "focus" | "goal" | "schedule" | "weekly";
  createdAt: string;
}

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function generateHabitInsights(
  habits: any[],
  completions: Array<{ habitId: any; date: string; status: string }>,
  todayDateStr: string,
  timezone: string = "UTC"
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  if (!habits || habits.length === 0 || !completions || completions.length === 0) {
    return insights;
  }

  // 1. Day of week completion pattern
  const dayCompletions = [0, 0, 0, 0, 0, 0, 0];
  completions.forEach((c) => {
    if (c.status === "completed") {
      const dayIdx = getUserDayOfWeek(c.date, timezone);
      dayCompletions[dayIdx]++;
    }
  });

  const maxCompletions = Math.max(...dayCompletions);
  if (maxCompletions >= 4) {
    const bestDayIdx = dayCompletions.indexOf(maxCompletions);
    insights.push({
      id: "habit-best-day",
      type: "positive",
      title: "Peak Consistency Day",
      description: `Your habits show their highest completion frequency on ${DAY_NAMES[bestDayIdx]}s (${maxCompletions} completions recorded).`,
      severity: "low",
      metric: `${DAY_NAMES[bestDayIdx]}s`,
      category: "habit",
      createdAt: todayDateStr,
    });
  }

  // 2. Weekly habit completion rate comparison
  const past7Days = Array.from({ length: 7 }, (_, i) => getDateDaysAgoFrom(todayDateStr, i));
  const prev7Days = Array.from({ length: 7 }, (_, i) => getDateDaysAgoFrom(todayDateStr, i + 7));

  const thisWeekCompletions = completions.filter(
    (c) => c.status === "completed" && past7Days.includes(c.date)
  ).length;
  const lastWeekCompletions = completions.filter(
    (c) => c.status === "completed" && prev7Days.includes(c.date)
  ).length;

  if (lastWeekCompletions > 0 && thisWeekCompletions > lastWeekCompletions) {
    const diffPct = Math.round(((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100);
    insights.push({
      id: "habit-weekly-growth",
      type: "positive",
      title: "Consistency Improvement",
      description: `You completed ${thisWeekCompletions} habit milestones over the past 7 days, up ${diffPct}% compared with the prior week.`,
      severity: "medium",
      metric: `+${diffPct}%`,
      category: "habit",
      createdAt: todayDateStr,
    });
  }

  // 3. Habit missed pattern alert
  const activeHabitIds = habits.filter((h) => !h.archived).map((h) => h._id.toString());
  for (const habit of habits) {
    if (habit.archived) continue;
    const hCompletionsThisWeek = completions.filter(
      (c) =>
        c.habitId.toString() === habit._id.toString() &&
        c.status === "completed" &&
        past7Days.includes(c.date)
    ).length;

    if (habit.frequency === "daily" && hCompletionsThisWeek <= 2 && past7Days.length === 7) {
      insights.push({
        id: `habit-missed-${habit._id}`,
        type: "warning",
        title: "Habit Needs Attention",
        description: `"${habit.name}" was completed only ${hCompletionsThisWeek} times in the last 7 days. Consider stacking it after an established routine.`,
        severity: "medium",
        metric: `${hCompletionsThisWeek}/7 days`,
        category: "habit",
        createdAt: todayDateStr,
      });
      break; // Keep to 1 warning to prevent notification spam
    }
  }

  return insights;
}

export function generateTaskInsights(
  tasks: any[],
  todayDateStr: string
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  if (!tasks || tasks.length === 0) return insights;

  // 1. Overdue tasks check
  const overdueTasks = tasks.filter(
    (t) => t.status !== "completed" && t.status !== "cancelled" && t.dueDate < todayDateStr
  );

  if (overdueTasks.length > 0) {
    insights.push({
      id: "tasks-overdue",
      type: "warning",
      title: `${overdueTasks.length} Overdue Task${overdueTasks.length === 1 ? "" : "s"}`,
      description: `You have ${overdueTasks.length} pending task${
        overdueTasks.length === 1 ? "" : "s"
      } with past due dates. Reschedule or tackle them to keep your plan clean.`,
      severity: "high",
      metric: `${overdueTasks.length} overdue`,
      category: "task",
      createdAt: todayDateStr,
    });
  }

  // 2. High priority task load for today
  const highPriorityToday = tasks.filter(
    (t) => t.dueDate === todayDateStr && t.priority === "high" && t.status !== "completed"
  );

  if (highPriorityToday.length >= 2) {
    insights.push({
      id: "tasks-high-priority-today",
      type: "actionable",
      title: "High-Priority Focus Required",
      description: `You have ${highPriorityToday.length} high-priority tasks scheduled for today. Consider using Focus Mode on them early.`,
      severity: "medium",
      metric: `${highPriorityToday.length} urgent`,
      category: "task",
      createdAt: todayDateStr,
    });
  }

  // 3. Task completion rate
  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const totalActionableTasks = tasks.filter((t) => t.status !== "cancelled").length;

  if (totalActionableTasks >= 5) {
    const rate = Math.round((completedTasks / totalActionableTasks) * 100);
    if (rate >= 75) {
      insights.push({
        id: "tasks-high-completion-rate",
        type: "positive",
        title: "Strong Execution Rate",
        description: `You have completed ${rate}% of all scheduled tasks (${completedTasks}/${totalActionableTasks}).`,
        severity: "low",
        metric: `${rate}% completion`,
        category: "task",
        createdAt: todayDateStr,
      });
    }
  }

  return insights;
}

export function generateFocusInsights(
  sessions: any[],
  todayDateStr: string
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  if (!sessions || sessions.length === 0) return insights;

  const completedSessions = sessions.filter((s) => s.status === "completed");
  const totalMinutes = completedSessions.reduce((acc, s) => acc + (s.duration || 0), 0);

  if (completedSessions.length >= 3) {
    const avgDuration = Math.round(totalMinutes / completedSessions.length);
    insights.push({
      id: "focus-avg-duration",
      type: "neutral",
      title: "Average Focus Rhythm",
      description: `Your average completed focus session lasts ${avgDuration} minutes across ${completedSessions.length} sessions.`,
      severity: "low",
      metric: `${avgDuration} min/session`,
      category: "focus",
      createdAt: todayDateStr,
    });
  }

  if (totalMinutes >= 300) {
    const hours = (totalMinutes / 60).toFixed(1);
    insights.push({
      id: "focus-milestone",
      type: "positive",
      title: "Deep Work Dedication",
      description: `You have logged over ${hours} hours of distraction-free focus time.`,
      severity: "low",
      metric: `${hours} hours`,
      category: "focus",
      createdAt: todayDateStr,
    });
  }

  return insights;
}

export function generateGoalInsights(
  goalsWithProgress: Array<{ goal: any; progress: GoalProgressResult }>,
  todayDateStr: string
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  if (!goalsWithProgress || goalsWithProgress.length === 0) return insights;

  // Goals approaching completion (>= 80% and active)
  for (const item of goalsWithProgress) {
    const { progress, goal } = item;
    if (progress.effectiveStatus === "active" && progress.percentage >= 80 && progress.percentage < 100) {
      insights.push({
        id: `goal-near-completion-${goal._id}`,
        type: "actionable",
        title: `Goal Almost Reached: "${goal.title}"`,
        description: `This goal is ${progress.percentage}% complete (${progress.currentValue}/${progress.targetValue} ${goal.unit}). A few more sessions will finish it!`,
        severity: "medium",
        metric: `${progress.percentage}%`,
        category: "goal",
        createdAt: todayDateStr,
      });
    }

    if (progress.isAtRisk && progress.effectiveStatus !== "completed") {
      insights.push({
        id: `goal-at-risk-${goal._id}`,
        type: "warning",
        title: `Goal At Risk: "${goal.title}"`,
        description: `Only ${progress.daysRemaining} day${
          progress.daysRemaining === 1 ? "" : "s"
        } remaining before deadline, and progress stands at ${progress.percentage}%.`,
        severity: "high",
        metric: progress.deadlineText,
        category: "goal",
        createdAt: todayDateStr,
      });
    }
  }

  return insights;
}

export function generateScheduleInsights(
  timeBlocks: any[],
  todayDateStr: string
): ProductivityInsight[] {
  const insights: ProductivityInsight[] = [];
  if (!timeBlocks || timeBlocks.length === 0) return insights;

  const todayBlocks = timeBlocks.filter((b) => {
    const bDate = new Date(b.start).toISOString().split("T")[0];
    return bDate === todayDateStr;
  });

  if (todayBlocks.length >= 4) {
    insights.push({
      id: "schedule-well-planned",
      type: "neutral",
      title: "Structured Day Ahead",
      description: `You have ${todayBlocks.length} time blocks scheduled for today. Follow your blocks to preserve cognitive energy.`,
      severity: "low",
      metric: `${todayBlocks.length} blocks`,
      category: "schedule",
      createdAt: todayDateStr,
    });
  }

  return insights;
}

/**
 * Combines insights from all areas and returns deduplicated list sorted by severity.
 */
export function getAllProductivityInsights({
  habits = [],
  completions = [],
  tasks = [],
  focusSessions = [],
  goalsWithProgress = [],
  timeBlocks = [],
  todayDateStr,
  timezone = "UTC",
}: {
  habits?: any[];
  completions?: any[];
  tasks?: any[];
  focusSessions?: any[];
  goalsWithProgress?: any[];
  timeBlocks?: any[];
  todayDateStr: string;
  timezone?: string;
}): ProductivityInsight[] {
  const all: ProductivityInsight[] = [
    ...generateHabitInsights(habits, completions, todayDateStr, timezone),
    ...generateTaskInsights(tasks, todayDateStr),
    ...generateFocusInsights(focusSessions, todayDateStr),
    ...generateGoalInsights(goalsWithProgress, todayDateStr),
    ...generateScheduleInsights(timeBlocks, todayDateStr),
  ];

  // Sort by priority: high -> medium -> low
  const severityRank: Record<InsightSeverity, number> = { high: 3, medium: 2, low: 1 };
  return all.sort((a, b) => severityRank[b.severity] - severityRank[a.severity]);
}
