import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Task } from "@/lib/models/Task";
import { FocusSession } from "@/lib/models/FocusSession";
import { Habit } from "@/lib/models/Habit";
import { isHabitScheduledForDate } from "@/lib/services/streak";
import { getUserTodayDateString, getDateDaysAgoFrom, getDatesBetween } from "@/lib/utils/date";
import mongoose from "mongoose";

export interface DailyProductivityScore {
  date: string;
  overallScore: number; // 0-100
  habitScore: number; // 0-100
  taskScore: number; // 0-100
  focusScore: number; // 0-100
  weights: { habits: number; tasks: number; focus: number };
  explanation: string;
}

export interface HeatmapDay {
  date: string;
  score: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = none, 1 = low, 2 = medium, 3 = high, 4 = max
  habitsCompleted: number;
  tasksCompleted: number;
  focusMinutes: number;
}

/**
 * Calculates transparent daily productivity score for a specific date:
 * Habits: completed vs scheduled (normalized 0-100)
 * Tasks: completed vs total due on date (normalized 0-100)
 * Focus: actual focus minutes vs daily target (default 120 mins) (normalized 0-100)
 * Weight: default 40% habits, 40% tasks, 20% focus
 */
export function calculateDailyScore(
  habitsCompleted: number,
  habitsScheduled: number,
  tasksCompleted: number,
  tasksDue: number,
  focusMinutes: number,
  focusTargetMinutes: number = 120,
  weights = { habits: 0.4, tasks: 0.4, focus: 0.2 }
): DailyProductivityScore {
  // Habit component
  const habitScore =
    habitsScheduled > 0
      ? Math.min(100, Math.round((habitsCompleted / habitsScheduled) * 100))
      : habitsCompleted > 0
      ? 100
      : 0;

  // Task component
  const taskScore =
    tasksDue > 0
      ? Math.min(100, Math.round((tasksCompleted / tasksDue) * 100))
      : tasksCompleted > 0
      ? 100
      : 100; // If no tasks were due today, default to 100 so user isn't penalized

  // Focus component
  const focusScore = Math.min(
    100,
    Math.round((focusMinutes / Math.max(1, focusTargetMinutes)) * 100)
  );

  // Normalize weights whether passed as percentages (e.g. 40) or decimals (0.4)
  const normHabits = weights.habits > 1 ? weights.habits / 100 : weights.habits;
  const normTasks = weights.tasks > 1 ? weights.tasks / 100 : weights.tasks;
  const normFocus = weights.focus > 1 ? weights.focus / 100 : weights.focus;

  const overallScore = Math.min(
    100,
    Math.round(normHabits * habitScore + normTasks * taskScore + normFocus * focusScore)
  );

  const pctHabits = Math.round(normHabits * 100);
  const pctTasks = Math.round(normTasks * 100);
  const pctFocus = Math.round(normFocus * 100);

  return {
    date: "",
    overallScore,
    habitScore,
    taskScore,
    focusScore,
    weights: {
      habits: pctHabits,
      tasks: pctTasks,
      focus: pctFocus,
    },
    explanation: `Calculated from ${pctHabits}% Habit Consistency (${habitScore}%), ${pctTasks}% Task Completion (${taskScore}%), and ${pctFocus}% Focus Target (${focusScore}%).`,
  };
}

/**
 * Aggregates productivity heatmap data for the past N days.
 */
export async function getProductivityHeatmap(
  userId: string | mongoose.Types.ObjectId,
  daysBack: number = 120,
  timezone: string = "UTC"
): Promise<{ heatmap: HeatmapDay[]; averageScore: number }> {
  const todayStr = getUserTodayDateString(timezone);
  const startDateStr = getDateDaysAgoFrom(todayStr, daysBack - 1);
  const dates = getDatesBetween(startDateStr, todayStr);

  const [activeHabits, habitCompletions, tasks, focusSessions] = await Promise.all([
    Habit.find({ userId, archived: false }),
    HabitCompletion.find({
      userId,
      date: { $gte: startDateStr, $lte: todayStr },
      status: "completed",
    }).select("date"),
    Task.find({
      userId,
      dueDate: { $gte: startDateStr, $lte: todayStr },
    }).select("dueDate status"),
    FocusSession.find({
      userId,
      startedAt: { $gte: new Date(startDateStr) },
      status: "completed",
    }).select("duration startedAt"),
  ]);

  // Group completions by date
  const completionsByDate = new Map<string, number>();
  habitCompletions.forEach((c) => {
    completionsByDate.set(c.date, (completionsByDate.get(c.date) || 0) + 1);
  });

  // Group tasks by date
  const tasksDueByDate = new Map<string, { total: number; completed: number }>();
  tasks.forEach((t) => {
    const curr = tasksDueByDate.get(t.dueDate) || { total: 0, completed: 0 };
    curr.total++;
    if (t.status === "completed") curr.completed++;
    tasksDueByDate.set(t.dueDate, curr);
  });

  // Group focus minutes by date in user's timezone
  const focusByDate = new Map<string, number>();
  focusSessions.forEach((s) => {
    const sDate = getUserTodayDateString(timezone, new Date(s.startedAt));
    if (sDate >= startDateStr && sDate <= todayStr) {
      focusByDate.set(sDate, (focusByDate.get(sDate) || 0) + (s.duration || 0));
    }
  });

  let totalScoreSum = 0;
  const heatmap: HeatmapDay[] = [];

  for (const date of dates) {
    const scheduledHabits = activeHabits.filter((h) =>
      isHabitScheduledForDate(h, date, timezone)
    ).length;
    const completedHabits = completionsByDate.get(date) || 0;
    const taskInfo = tasksDueByDate.get(date) || { total: 0, completed: 0 };
    const focusMins = focusByDate.get(date) || 0;

    const scoreResult = calculateDailyScore(
      completedHabits,
      scheduledHabits,
      taskInfo.completed,
      taskInfo.total,
      focusMins,
      120
    );

    const score = scoreResult.overallScore;
    totalScoreSum += score;

    let level: HeatmapDay["level"] = 0;
    if (score >= 80) level = 4;
    else if (score >= 60) level = 3;
    else if (score >= 40) level = 2;
    else if (score > 0) level = 1;

    heatmap.push({
      date,
      score,
      level,
      habitsCompleted: completedHabits,
      tasksCompleted: taskInfo.completed,
      focusMinutes: focusMins,
    });
  }

  const averageScore = dates.length > 0 ? Math.round(totalScoreSum / dates.length) : 0;

  return { heatmap, averageScore };
}
