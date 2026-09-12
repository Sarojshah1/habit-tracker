import { IHabit } from "@/lib/models/Habit";
import { IHabitCompletion } from "@/lib/models/HabitCompletion";
import { getDateDaysAgoFrom, getUserDayOfWeek, getUserTodayDateString } from "@/lib/utils/date";

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
}

export function isHabitScheduledForDate(habit: IHabit, dateStr: string, timezone: string = "UTC"): boolean {
  // If habit started after this date, it is not scheduled
  if (habit.startDate && habit.startDate > dateStr) {
    return false;
  }

  // If archived, only consider if start date is valid
  if (habit.archived) {
    return false;
  }

  if (habit.frequency === "daily") {
    return true;
  }

  const dayOfWeek = getUserDayOfWeek(dateStr, timezone);

  if (habit.frequency === "specific_days") {
    const days = habit.schedule?.daysOfWeek || [];
    return days.includes(dayOfWeek);
  }

  if (habit.frequency === "weekly" || habit.frequency === "times_per_week") {
    return true;
  }

  return true;
}

/**
 * Calculates user overall current streak and longest streak based on completion history.
 * Rule: A day is considered completed if the user completed at least one habit on that date.
 * If today has not been completed yet, the streak from yesterday is preserved as active.
 */
export function calculateOverallStreaks(
  completionDates: string[], // Unique dates (YYYY-MM-DD) with at least 1 completed habit
  todayDateStr: string
): StreakStats {
  if (!completionDates || completionDates.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const completedSet = new Set(completionDates);

  // 1. Calculate Current Streak
  let currentStreak = 0;
  let checkDate = todayDateStr;

  const todayCompleted = completedSet.has(todayDateStr);

  if (todayCompleted) {
    currentStreak = 1;
    let daysAgo = 1;
    while (true) {
      const prevDate = getDateDaysAgoFrom(todayDateStr, daysAgo);
      if (completedSet.has(prevDate)) {
        currentStreak++;
        daysAgo++;
      } else {
        break;
      }
    }
  } else {
    // Today not completed yet - check if yesterday was completed
    const yesterday = getDateDaysAgoFrom(todayDateStr, 1);
    if (completedSet.has(yesterday)) {
      currentStreak = 1;
      let daysAgo = 2;
      while (true) {
        const prevDate = getDateDaysAgoFrom(todayDateStr, daysAgo);
        if (completedSet.has(prevDate)) {
          currentStreak++;
          daysAgo++;
        } else {
          break;
        }
      }
    } else {
      currentStreak = 0;
    }
  }

  // 2. Calculate Longest Streak in history
  const sortedDates = Array.from(completedSet).sort();
  let longestStreak = 0;
  let currentRun = 0;
  let prevDateVal: Date | null = null;

  for (const dStr of sortedDates) {
    const [y, m, d] = dStr.split("-").map(Number);
    const currentDateVal = new Date(Date.UTC(y, m - 1, d));

    if (!prevDateVal) {
      currentRun = 1;
    } else {
      const diffTime = currentDateVal.getTime() - prevDateVal.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentRun++;
      } else if (diffDays > 1) {
        currentRun = 1;
      }
    }

    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
    prevDateVal = currentDateVal;
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return { currentStreak, longestStreak };
}

/**
 * Calculates streak and completion stats for an individual habit
 */
export function calculateHabitStats(
  habit: IHabit,
  completions: IHabitCompletion[],
  todayDateStr: string,
  timezone: string = "UTC"
) {
  const completedRecords = completions.filter(
    (c) => c.habitId.toString() === habit._id.toString() && c.status === "completed"
  );
  const completedDateStrings = completedRecords.map((c) => c.date);
  const completedDateSet = new Set(completedDateStrings);

  // Calculate habit specific streak
  let currentStreak = 0;
  let daysAgo = 0;

  if (completedDateSet.has(todayDateStr)) {
    currentStreak = 1;
    daysAgo = 1;
    while (true) {
      const prevDate = getDateDaysAgoFrom(todayDateStr, daysAgo);
      if (isHabitScheduledForDate(habit, prevDate, timezone)) {
        if (completedDateSet.has(prevDate)) {
          currentStreak++;
        } else {
          break;
        }
      }
      daysAgo++;
      if (daysAgo > 365) break;
    }
  } else {
    // Check from yesterday
    const yesterday = getDateDaysAgoFrom(todayDateStr, 1);
    let checkDate = yesterday;
    daysAgo = 1;

    // Find the last scheduled day
    while (!isHabitScheduledForDate(habit, checkDate, timezone) && daysAgo <= 7) {
      daysAgo++;
      checkDate = getDateDaysAgoFrom(todayDateStr, daysAgo);
    }

    if (completedDateSet.has(checkDate)) {
      currentStreak = 1;
      daysAgo++;
      while (true) {
        const prevDate = getDateDaysAgoFrom(todayDateStr, daysAgo);
        if (isHabitScheduledForDate(habit, prevDate, timezone)) {
          if (completedDateSet.has(prevDate)) {
            currentStreak++;
          } else {
            break;
          }
        }
        daysAgo++;
        if (daysAgo > 365) break;
      }
    }
  }

  // Calculate best streak
  const sortedDates = Array.from(completedDateSet).sort();
  let bestStreak = currentStreak;
  let run = 0;
  let prevDateVal: Date | null = null;

  for (const dStr of sortedDates) {
    const [y, m, d] = dStr.split("-").map(Number);
    const dateVal = new Date(Date.UTC(y, m - 1, d));

    if (!prevDateVal) {
      run = 1;
    } else {
      const diffDays = Math.round((dateVal.getTime() - prevDateVal.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        run++;
      } else {
        run = 1;
      }
    }
    if (run > bestStreak) {
      bestStreak = run;
    }
    prevDateVal = dateVal;
  }

  // Completion rate calculation
  const totalCompletions = completedRecords.length;

  // Expected occurrences since startDate (up to today, max 30 days for recent rolling rate)
  let expectedDays = 0;
  const daysToInspect = Math.min(30, Math.max(1, Math.round((new Date(todayDateStr).getTime() - new Date(habit.startDate).getTime()) / (1000 * 60 * 60 * 24)) + 1));

  for (let i = 0; i < daysToInspect; i++) {
    const checkDate = getDateDaysAgoFrom(todayDateStr, i);
    if (checkDate >= habit.startDate && isHabitScheduledForDate(habit, checkDate, timezone)) {
      expectedDays++;
    }
  }

  const recentCompletions = completedRecords.filter(
    (c) => c.date >= getDateDaysAgoFrom(todayDateStr, daysToInspect - 1) && c.date <= todayDateStr
  ).length;

  const completionRate = expectedDays > 0 ? Math.min(100, Math.round((recentCompletions / expectedDays) * 100)) : 0;

  return {
    currentStreak,
    bestStreak,
    totalCompletions,
    completionRate,
  };
}
