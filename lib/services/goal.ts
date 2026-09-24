import mongoose from "mongoose";
import { IGoal, Goal } from "@/lib/models/Goal";
import { IHabitCompletion, HabitCompletion } from "@/lib/models/HabitCompletion";
import { Habit } from "@/lib/models/Habit";
import { Activity } from "@/lib/models/Activity";
import { logActivity } from "@/lib/services/activity";
import { getUserTodayDateString, getDatesBetween } from "@/lib/utils/date";

export interface GoalProgressResult {
  currentValue: number;
  targetValue: number;
  percentage: number;
  remainingValue: number;
  daysRemaining: number;
  deadlineText: string;
  isOverdue: boolean;
  status: "active" | "completed" | "paused" | "archived" | "cancelled" | "overdue";
  effectiveStatus: "active" | "completed" | "paused" | "archived" | "cancelled" | "overdue";
  isAtRisk: boolean;
  weeklyBreakdown?: Array<{
    weekNumber: number;
    startDate: string;
    endDate: string;
    completed: number;
    target: number;
  }>;
}

export interface GoalHistoryPoint {
  date: string;
  value: number;
  percentage: number;
}

/**
 * Calculates days remaining and formatted deadline string based on user's timezone.
 */
export function formatDaysRemaining(
  endDate: string,
  timezone: string = "UTC",
  referenceDateStr?: string
): { daysRemaining: number; deadlineText: string; isOverdue: boolean } {
  const todayStr = referenceDateStr || getUserTodayDateString(timezone);

  if (todayStr === endDate) {
    return {
      daysRemaining: 0,
      deadlineText: "Due today",
      isOverdue: false,
    };
  }

  if (todayStr > endDate) {
    return {
      daysRemaining: 0,
      deadlineText: "Overdue",
      isOverdue: true,
    };
  }

  // Calculate day difference using UTC midnights
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const [eY, eM, eD] = endDate.split("-").map(Number);
  const tDate = new Date(Date.UTC(tY, tM - 1, tD));
  const eDate = new Date(Date.UTC(eY, eM - 1, eD));

  const diffMs = eDate.getTime() - tDate.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

  return {
    daysRemaining: diffDays,
    deadlineText: `${diffDays} day${diffDays === 1 ? "" : "s"} remaining`,
    isOverdue: false,
  };
}

/**
 * Reusable server-side goal progress calculation.
 * Derives current value from HabitCompletion records for automatic goals.
 */
export function calculateGoalProgress(
  goal: any,
  completions: Array<{ habitId: any; date: string; status: string }>,
  timezone: string = "UTC",
  referenceDateStr?: string
): GoalProgressResult {
  const todayStr = referenceDateStr || getUserTodayDateString(timezone);
  const { daysRemaining, deadlineText, isOverdue } = formatDaysRemaining(
    goal.endDate,
    timezone,
    todayStr
  );

  const targetValue = Math.max(1, goal.targetValue || 1);
  let currentValue = 0;
  let weeklyBreakdown: GoalProgressResult["weeklyBreakdown"] = undefined;

  // Extract linked habit IDs safely
  const rawHabits = goal.habitIds && goal.habitIds.length > 0 ? goal.habitIds : goal.associatedHabitIds || [];
  const linkedHabitIdStrings = rawHabits.map((id: any) =>
    typeof id === "object" && id._id ? id._id.toString() : id.toString()
  );

  if (goal.trackingMode === "manual") {
    currentValue = Number(goal.currentValue) || 0;
  } else {
    // Automatic tracking derived from habit completions
    // Filter completions within the goal's date range and for linked habits
    const qualifyingCompletions = completions.filter((c) => {
      if (c.status !== "completed") return false;
      if (!linkedHabitIdStrings.includes(c.habitId.toString())) return false;
      if (c.date < goal.startDate || c.date > goal.endDate) return false;
      return true;
    });

    const goalType = goal.type || "habit_completion";

    if (goalType === "consistency") {
      // Consistency: distinct calendar days with qualifying completions
      // Crucial: Multiple habits on the same date count as 1 day
      const distinctDates = new Set(qualifyingCompletions.map((c) => c.date));
      currentValue = distinctDates.size;
    } else if (goalType === "weekly_frequency") {
      // Weekly Frequency: count completions grouped by week
      // Calculate 7-day windows starting from goal.startDate
      const allDates = getDatesBetween(goal.startDate, goal.endDate);
      const weeks: Array<{
        weekNumber: number;
        startDate: string;
        endDate: string;
        completed: number;
        target: number;
      }> = [];

      const weeklyTarget = goal.targetValue <= 7 ? goal.targetValue : Math.ceil(goal.targetValue / Math.max(1, Math.ceil(allDates.length / 7)));

      for (let i = 0; i < allDates.length; i += 7) {
        const weekDates = allDates.slice(i, i + 7);
        const wStart = weekDates[0];
        const wEnd = weekDates[weekDates.length - 1];
        const weekNum = Math.floor(i / 7) + 1;

        const completionsInWeek = qualifyingCompletions.filter(
          (c) => c.date >= wStart && c.date <= wEnd
        ).length;

        weeks.push({
          weekNumber: weekNum,
          startDate: wStart,
          endDate: wEnd,
          completed: completionsInWeek,
          target: weeklyTarget,
        });
      }

      weeklyBreakdown = weeks;

      // Current value: sum of qualifying completions (capped per week if targetValue is weekly frequency)
      if (goal.targetValue <= 7) {
        // e.g. "3 times per week": sum capped at weeklyTarget per week
        currentValue = weeks.reduce((sum, w) => sum + Math.min(w.completed, w.target), 0);
      } else {
        // Total completions target
        currentValue = qualifyingCompletions.length;
      }
    } else if (goalType === "habit_completion") {
      // Habit Completion: total count of qualifying habit completions
      currentValue = qualifyingCompletions.length;
    } else {
      // Custom automatic fallback
      currentValue = qualifyingCompletions.length;
    }
  }

  const percentage = Math.min(100, Math.round((currentValue / targetValue) * 100));
  const remainingValue = Math.max(0, targetValue - currentValue);

  // Determine effective status
  let effectiveStatus: GoalProgressResult["effectiveStatus"] = goal.status || "active";

  if (goal.status === "paused") {
    effectiveStatus = "paused";
  } else if (goal.status === "archived") {
    effectiveStatus = "archived";
  } else if (goal.status === "cancelled") {
    effectiveStatus = "cancelled";
  } else if (currentValue >= targetValue || goal.status === "completed") {
    effectiveStatus = "completed";
  } else if (isOverdue) {
    effectiveStatus = "overdue";
  } else {
    effectiveStatus = "active";
  }

  // Determine if goal is at risk:
  // 1. Overdue and not completed
  // 2. Active, deadline is within 3 days, and progress is below 75%
  // 3. Active, halfway past duration and progress is less than 30%
  const [sY, sM, sD] = goal.startDate.split("-").map(Number);
  const [eY, eM, eD] = goal.endDate.split("-").map(Number);
  const [tY, tM, tD] = todayStr.split("-").map(Number);
  const totalDurationDays = Math.max(1, Math.round((new Date(Date.UTC(eY, eM - 1, eD)).getTime() - new Date(Date.UTC(sY, sM - 1, sD)).getTime()) / (1000 * 60 * 60 * 24)));
  const elapsedDays = Math.max(0, Math.round((new Date(Date.UTC(tY, tM - 1, tD)).getTime() - new Date(Date.UTC(sY, sM - 1, sD)).getTime()) / (1000 * 60 * 60 * 24)));

  const isAtRisk =
    effectiveStatus === "active" &&
    ((daysRemaining <= 3 && percentage < 75) ||
      (elapsedDays > totalDurationDays / 2 && percentage < 30) ||
      (daysRemaining === 0 && percentage < 100));

  return {
    currentValue,
    targetValue,
    percentage,
    remainingValue,
    daysRemaining,
    deadlineText,
    isOverdue,
    status: goal.status || "active",
    effectiveStatus,
    isAtRisk,
    weeklyBreakdown,
  };
}

/**
 * Calculates historical progress points over time for rendering progress charts.
 */
export function calculateGoalHistory(
  goal: any,
  completions: Array<{ habitId: any; date: string; status: string }>,
  timezone: string = "UTC"
): GoalHistoryPoint[] {
  const todayStr = getUserTodayDateString(timezone);
  const endDateToUse = goal.endDate < todayStr ? goal.endDate : todayStr;
  const dates = getDatesBetween(goal.startDate, endDateToUse);

  if (dates.length === 0) {
    return [{ date: goal.startDate, value: 0, percentage: 0 }];
  }

  const rawHabits = goal.habitIds && goal.habitIds.length > 0 ? goal.habitIds : goal.associatedHabitIds || [];
  const linkedHabitIdStrings = rawHabits.map((id: any) =>
    typeof id === "object" && id._id ? id._id.toString() : id.toString()
  );

  const goalType = goal.type || "habit_completion";
  const targetValue = Math.max(1, goal.targetValue || 1);

  // If manual tracking mode, return start and current
  if (goal.trackingMode === "manual") {
    return [
      { date: goal.startDate, value: 0, percentage: 0 },
      {
        date: todayStr,
        value: goal.currentValue || 0,
        percentage: Math.min(100, Math.round(((goal.currentValue || 0) / targetValue) * 100)),
      },
    ];
  }

  // Filter qualifying completions
  const qualifying = completions.filter(
    (c) =>
      c.status === "completed" &&
      linkedHabitIdStrings.includes(c.habitId.toString()) &&
      c.date >= goal.startDate &&
      c.date <= goal.endDate
  );

  // Sample points (up to 30 points to avoid overflowing chart)
  const step = Math.max(1, Math.floor(dates.length / 25));
  const sampledDates = dates.filter((_, idx) => idx % step === 0 || idx === dates.length - 1);

  const history: GoalHistoryPoint[] = [];

  for (const d of sampledDates) {
    let runningVal = 0;
    const upToDateCompletions = qualifying.filter((c) => c.date <= d);

    if (goalType === "consistency") {
      const distinct = new Set(upToDateCompletions.map((c) => c.date));
      runningVal = distinct.size;
    } else {
      runningVal = upToDateCompletions.length;
    }

    history.push({
      date: d,
      value: runningVal,
      percentage: Math.min(100, Math.round((runningVal / targetValue) * 100)),
    });
  }

  return history;
}

/**
 * Calculates top-level summary statistics across user's goals.
 */
export function calculateGoalStats(goalsWithProgress: Array<{ goal: any; progress: GoalProgressResult }>) {
  let activeGoals = 0;
  let completedGoals = 0;
  let atRiskGoals = 0;
  let totalActiveProgressSum = 0;

  for (const item of goalsWithProgress) {
    const { effectiveStatus, isAtRisk, percentage } = item.progress;

    if (effectiveStatus === "completed" || item.goal.status === "completed") {
      completedGoals++;
    } else if (effectiveStatus === "active" || effectiveStatus === "overdue") {
      activeGoals++;
      totalActiveProgressSum += percentage;
      if (isAtRisk || effectiveStatus === "overdue") {
        atRiskGoals++;
      }
    }
  }

  const overallProgress = activeGoals > 0 ? Math.round(totalActiveProgressSum / activeGoals) : 0;

  return {
    activeGoals,
    completedGoals,
    atRiskGoals,
    overallProgress,
  };
}

/**
 * Checks and marks goal as completed if target reached, idempotently logging activity.
 */
export async function syncGoalCompletionIfTargetReached(
  goal: IGoal,
  calculatedCurrentValue: number,
  userId: string | mongoose.Types.ObjectId
) {
  if (calculatedCurrentValue >= goal.targetValue && goal.status === "active") {
    goal.status = "completed";
    goal.currentValue = calculatedCurrentValue;
    goal.completedAt = new Date();
    await goal.save();

    // Check if goal_completed activity already exists to avoid duplication
    const existingActivity = await Activity.findOne({
      userId,
      type: "goal_completed",
      entityId: goal._id,
    });

    if (!existingActivity) {
      await logActivity({
        userId,
        type: "goal_completed",
        entityId: goal._id,
        entityType: "goal",
        metadata: {
          goalTitle: goal.title,
          targetValue: goal.targetValue,
          unit: goal.unit,
        },
      });
    }
  }
}

export const completeGoalIfTargetReached = syncGoalCompletionIfTargetReached;

export async function createGoal(userId: string | mongoose.Types.ObjectId, data: any) {
  const rawHabitIds = data.habitIds && data.habitIds.length > 0 ? data.habitIds : data.associatedHabitIds || [];
  
  if (rawHabitIds.length > 0) {
    const userHabits = await Habit.find({ _id: { $in: rawHabitIds }, userId });
    if (userHabits.length !== rawHabitIds.length) {
      throw new Error("Unauthorized: One or more selected habits do not belong to you");
    }
  }

  const goal = await Goal.create({
    ...data,
    userId,
    habitIds: rawHabitIds,
    associatedHabitIds: rawHabitIds,
  });

  await logActivity({
    userId,
    type: "goal_created",
    entityId: goal._id,
    entityType: "goal",
    metadata: { goalTitle: goal.title, goalType: goal.type },
  });

  return goal;
}

export async function getUserGoals(
  userId: string | mongoose.Types.ObjectId,
  filter: string = "all",
  timezone: string = "UTC"
) {
  const [allGoals, completions] = await Promise.all([
    Goal.find({ userId })
      .populate("habitIds", "name icon color frequency schedule")
      .populate("associatedHabitIds", "name icon color frequency schedule")
      .populate("taskIds", "title status priority dueDate estimatedMinutes actualMinutes")
      .sort({ createdAt: -1 }),
    HabitCompletion.find({
      userId,
      status: "completed",
    })
      .select("habitId date status")
      .lean(),
  ]);

  const goalsWithProgress = [];
  for (const goal of allGoals) {
    const progress = calculateGoalProgress(goal, completions, timezone);

    if (progress.effectiveStatus === "completed" && goal.status === "active") {
      await syncGoalCompletionIfTargetReached(goal, progress.currentValue, userId);
      goal.status = "completed";
    }

    const populatedHabits =
      goal.habitIds && goal.habitIds.length > 0 ? goal.habitIds : goal.associatedHabitIds || [];

    goalsWithProgress.push({
      ...goal.toObject(),
      habitIds: populatedHabits,
      progress,
    });
  }

  const stats = calculateGoalStats(
    goalsWithProgress.map((g) => ({ goal: g, progress: g.progress }))
  );

  let filteredGoals = goalsWithProgress;
  if (filter === "active") {
    filteredGoals = goalsWithProgress.filter(
      (g) =>
        g.status !== "archived" &&
        (g.progress.effectiveStatus === "active" || g.progress.effectiveStatus === "overdue")
    );
  } else if (filter === "completed") {
    filteredGoals = goalsWithProgress.filter(
      (g) => g.progress.effectiveStatus === "completed" && g.status !== "archived"
    );
  } else if (filter === "paused") {
    filteredGoals = goalsWithProgress.filter((g) => g.status === "paused");
  } else if (filter === "archived") {
    filteredGoals = goalsWithProgress.filter((g) => g.status === "archived");
  }

  return { goals: filteredGoals, stats, allGoalsWithProgress: goalsWithProgress };
}

export async function getGoal(
  userId: string | mongoose.Types.ObjectId,
  goalId: string,
  timezone: string = "UTC"
) {
  const goal = await Goal.findOne({ _id: goalId, userId })
    .populate("habitIds", "name icon color frequency schedule")
    .populate("associatedHabitIds", "name icon color frequency schedule")
    .populate("taskIds", "title status priority dueDate estimatedMinutes actualMinutes");

  if (!goal) return null;

  const populatedHabits =
    goal.habitIds && goal.habitIds.length > 0 ? goal.habitIds : goal.associatedHabitIds || [];

  const completions = await HabitCompletion.find({
    userId,
    habitId: { $in: populatedHabits.map((h: any) => h._id) },
    status: "completed",
  }).select("habitId date status");

  const progress = calculateGoalProgress(goal, completions, timezone);

  if (progress.effectiveStatus === "completed" && goal.status === "active") {
    await syncGoalCompletionIfTargetReached(goal, progress.currentValue, userId);
    goal.status = "completed";
  }

  const history = calculateGoalHistory(goal, completions, timezone);

  const activities = await Activity.find({
    userId,
    entityId: goal._id,
  })
    .sort({ createdAt: -1 })
    .limit(10);

  return {
    ...goal.toObject(),
    habitIds: populatedHabits,
    progress,
    history,
    activities,
  };
}

export async function updateGoal(
  userId: string | mongoose.Types.ObjectId,
  goalId: string,
  data: any,
  timezone: string = "UTC"
) {
  const rawHabitIds = data.habitIds || data.associatedHabitIds;

  if (rawHabitIds !== undefined && rawHabitIds.length > 0) {
    const userHabits = await Habit.find({ _id: { $in: rawHabitIds }, userId });
    if (userHabits.length !== rawHabitIds.length) {
      throw new Error("Unauthorized: One or more selected habits do not belong to you");
    }
    data.habitIds = rawHabitIds;
    data.associatedHabitIds = rawHabitIds;
  }

  const goal = await Goal.findOneAndUpdate(
    { _id: goalId, userId },
    { $set: data },
    { new: true }
  )
    .populate("habitIds", "name icon color frequency schedule")
    .populate("associatedHabitIds", "name icon color frequency schedule")
    .populate("taskIds", "title status priority dueDate estimatedMinutes actualMinutes");

  if (!goal) return null;

  const populatedHabits =
    goal.habitIds && goal.habitIds.length > 0 ? goal.habitIds : goal.associatedHabitIds || [];

  const completions = await HabitCompletion.find({
    userId,
    habitId: { $in: populatedHabits.map((h: any) => h._id) },
    status: "completed",
  }).select("habitId date status");

  const progress = calculateGoalProgress(goal, completions, timezone);

  if (progress.effectiveStatus === "completed" && goal.status === "active") {
    await syncGoalCompletionIfTargetReached(goal, progress.currentValue, userId);
    goal.status = "completed";
  }

  return {
    ...goal.toObject(),
    habitIds: populatedHabits,
    progress,
  };
}

export async function deleteGoal(userId: string | mongoose.Types.ObjectId, goalId: string) {
  return await Goal.findOneAndDelete({ _id: goalId, userId });
}

