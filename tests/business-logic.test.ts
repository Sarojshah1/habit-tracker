import { describe, it, expect } from "vitest";
import {
  calculateOverallStreaks,
  isHabitScheduledForDate,
  calculateHabitStats,
} from "../lib/services/streak";
import {
  getUserTodayDateString,
  getUserDayOfWeek,
  getDateDaysAgoFrom,
  getDatesBetween,
} from "../lib/utils/date";

describe("Timezone and Date Utilities", () => {
  it("formats date strings in specified timezone", () => {
    const fixedDate = new Date("2026-09-12T02:00:00Z");
    const nyDate = getUserTodayDateString("America/New_York", fixedDate);
    const tokyoDate = getUserTodayDateString("Asia/Tokyo", fixedDate);

    // In NY (UTC-4), it was Sept 11, 10 PM. In Tokyo (UTC+9), it was Sept 12, 11 AM.
    expect(nyDate).toBe("2026-09-11");
    expect(tokyoDate).toBe("2026-09-12");
  });

  it("calculates correct day of week", () => {
    // 2026-09-12 is Saturday (day 6)
    const day = getUserDayOfWeek("2026-09-12");
    expect(day).toBe(6);

    // 2026-09-13 is Sunday (day 0)
    expect(getUserDayOfWeek("2026-09-13")).toBe(0);

    // 2026-09-14 is Monday (day 1)
    expect(getUserDayOfWeek("2026-09-14")).toBe(1);
  });

  it("calculates past date offsets correctly", () => {
    const base = "2026-09-12";
    expect(getDateDaysAgoFrom(base, 1)).toBe("2026-09-11");
    expect(getDateDaysAgoFrom(base, 7)).toBe("2026-09-05");
  });
});

describe("Streak Calculation Engine", () => {
  const today = "2026-09-12";

  it("returns 0 streaks when there are no completion records", () => {
    const result = calculateOverallStreaks([], today);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(0);
  });

  it("counts today completion as streak of 1 if previous days are missing", () => {
    const result = calculateOverallStreaks([today], today);
    expect(result.currentStreak).toBe(1);
    expect(result.longestStreak).toBe(1);
  });

  it("maintains current streak if today is not completed yet but yesterday was completed", () => {
    // Today: 2026-09-12 (pending)
    // Yesterday: 2026-09-11 (completed)
    // Day before: 2026-09-10 (completed)
    const dates = ["2026-09-10", "2026-09-11"];
    const result = calculateOverallStreaks(dates, today);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });

  it("resets current streak to 0 if both today and yesterday were missed", () => {
    // Missed yesterday (2026-09-11) and today (2026-09-12)
    const dates = ["2026-09-08", "2026-09-09", "2026-09-10"];
    const result = calculateOverallStreaks(dates, today);
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it("calculates historical longest streak independently from current streak", () => {
    // Longest streak was 5 days in August, current streak is 2 days in Sept
    const dates = [
      "2026-08-01",
      "2026-08-02",
      "2026-08-03",
      "2026-08-04",
      "2026-08-05", // 5 days
      // Gap
      "2026-09-11",
      "2026-09-12", // 2 days
    ];
    const result = calculateOverallStreaks(dates, today);
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(5);
  });
});

describe("Habit Scheduling & Completion Rates", () => {
  it("determines if a daily habit is scheduled", () => {
    const habit: any = {
      startDate: "2026-09-01",
      frequency: "daily",
      archived: false,
    };
    expect(isHabitScheduledForDate(habit, "2026-09-12")).toBe(true);
    // Before start date:
    expect(isHabitScheduledForDate(habit, "2026-08-31")).toBe(false);
  });

  it("determines if a specific_days habit is scheduled", () => {
    // 2026-09-12 is Saturday (day 6)
    // 2026-09-15 is Tuesday (day 2)
    const habit: any = {
      startDate: "2026-09-01",
      frequency: "specific_days",
      schedule: { daysOfWeek: [1, 3, 5] }, // Mon, Wed, Fri
      archived: false,
    };
    expect(isHabitScheduledForDate(habit, "2026-09-12")).toBe(false); // Saturday
    // 2026-09-11 is Friday (day 5)
    expect(isHabitScheduledForDate(habit, "2026-09-11")).toBe(true); // Friday
  });

  it("calculates individual habit stats accurately", () => {
    const habit: any = {
      _id: "habit123",
      name: "Drink water",
      frequency: "daily",
      startDate: "2026-09-01",
      schedule: { daysOfWeek: [0, 1, 2, 3, 4, 5, 6] },
    };

    const completions: any = [
      { habitId: "habit123", date: "2026-09-10", status: "completed" },
      { habitId: "habit123", date: "2026-09-11", status: "completed" },
      { habitId: "habit123", date: "2026-09-12", status: "completed" },
    ];

    const stats = calculateHabitStats(habit, completions, "2026-09-12", "UTC");
    expect(stats.currentStreak).toBe(3);
    expect(stats.totalCompletions).toBe(3);
  });
});
