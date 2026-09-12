import { describe, it, expect } from "vitest";
import {
  calculateGoalProgress,
  calculateGoalStats,
  formatDaysRemaining,
  calculateGoalHistory,
} from "../lib/services/goal";
import {
  goalSchema,
  goalUpdateSchema,
  goalProgressSchema,
} from "../lib/validations/goal";

describe("Goal Progress Calculation Engine", () => {
  const studyHabitId = "64f1a2b3c4d5e6f7a8b90001";
  const exerciseHabitId = "64f1a2b3c4d5e6f7a8b90002";
  const waterHabitId = "64f1a2b3c4d5e6f7a8b90003";

  it("calculates Habit Completion goal progress accurately", () => {
    const goal: any = {
      title: "Complete 10 study sessions",
      type: "habit_completion",
      targetValue: 10,
      unit: "completions",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      habitIds: [studyHabitId],
      status: "active",
      trackingMode: "automatic",
    };

    const completions = [
      { habitId: studyHabitId, date: "2026-09-01", status: "completed" },
      { habitId: studyHabitId, date: "2026-09-02", status: "completed" },
      { habitId: studyHabitId, date: "2026-09-03", status: "completed" },
      { habitId: studyHabitId, date: "2026-09-04", status: "skipped" }, // skipped should not count
      { habitId: exerciseHabitId, date: "2026-09-05", status: "completed" }, // unrelated habit
      { habitId: studyHabitId, date: "2026-08-31", status: "completed" }, // before startDate
      { habitId: studyHabitId, date: "2026-10-01", status: "completed" }, // after endDate
    ];

    const result = calculateGoalProgress(goal, completions, "UTC", "2026-09-12");
    expect(result.currentValue).toBe(3);
    expect(result.targetValue).toBe(10);
    expect(result.percentage).toBe(30);
    expect(result.remainingValue).toBe(7);
    expect(result.effectiveStatus).toBe("active");
  });

  it("calculates Consistency goal by counting distinct calendar dates without double-counting", () => {
    const goal: any = {
      title: "Maintain a 30-day study & wellness streak",
      type: "consistency",
      targetValue: 30,
      unit: "days",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      habitIds: [studyHabitId, exerciseHabitId, waterHabitId],
      status: "active",
      trackingMode: "automatic",
    };

    // On Sept 1: all 3 habits completed (must only count as 1 day!)
    // On Sept 2: study and water completed (must count as 1 day)
    // On Sept 3: only water completed (must count as 1 day)
    // On Sept 5: study completed (must count as 1 day)
    // Total qualifying distinct dates: 4 days (Sept 1, 2, 3, 5)
    const completions = [
      { habitId: studyHabitId, date: "2026-09-01", status: "completed" },
      { habitId: exerciseHabitId, date: "2026-09-01", status: "completed" },
      { habitId: waterHabitId, date: "2026-09-01", status: "completed" },

      { habitId: studyHabitId, date: "2026-09-02", status: "completed" },
      { habitId: waterHabitId, date: "2026-09-02", status: "completed" },

      { habitId: waterHabitId, date: "2026-09-03", status: "completed" },

      { habitId: studyHabitId, date: "2026-09-05", status: "completed" },
    ];

    const result = calculateGoalProgress(goal, completions, "UTC", "2026-09-12");
    expect(result.currentValue).toBe(4);
    expect(result.percentage).toBe(Math.round((4 / 30) * 100)); // 13%
    expect(result.remainingValue).toBe(26);
  });

  it("calculates Weekly Frequency goal performance", () => {
    const goal: any = {
      title: "Exercise 3 times per week",
      type: "weekly_frequency",
      targetValue: 3, // 3 times per week
      unit: "times/week",
      startDate: "2026-09-01",
      endDate: "2026-09-28", // 4 weeks
      habitIds: [exerciseHabitId],
      status: "active",
      trackingMode: "automatic",
    };

    // Week 1 (Sept 1-7): 3 completions -> 3/3
    // Week 2 (Sept 8-14): 2 completions -> 2/3
    const completions = [
      { habitId: exerciseHabitId, date: "2026-09-01", status: "completed" },
      { habitId: exerciseHabitId, date: "2026-09-03", status: "completed" },
      { habitId: exerciseHabitId, date: "2026-09-05", status: "completed" },

      { habitId: exerciseHabitId, date: "2026-09-09", status: "completed" },
      { habitId: exerciseHabitId, date: "2026-09-11", status: "completed" },
    ];

    const result = calculateGoalProgress(goal, completions, "UTC", "2026-09-12");
    expect(result.weeklyBreakdown).toBeDefined();
    expect(result.weeklyBreakdown?.length).toBe(4);
    expect(result.weeklyBreakdown?.[0].completed).toBe(3);
    expect(result.weeklyBreakdown?.[1].completed).toBe(2);
    expect(result.currentValue).toBe(5); // 3 + 2
  });

  it("handles Custom Goal in manual tracking mode", () => {
    const goal: any = {
      title: "Read 5 books",
      type: "custom",
      trackingMode: "manual",
      targetValue: 5,
      currentValue: 3,
      unit: "books",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      status: "active",
      habitIds: [],
    };

    const result = calculateGoalProgress(goal, [], "UTC", "2026-09-12");
    expect(result.currentValue).toBe(3);
    expect(result.percentage).toBe(60);
    expect(result.remainingValue).toBe(2);
  });

  it("automatically marks effective status as completed when target is reached", () => {
    const goal: any = {
      title: "10 study sessions",
      type: "habit_completion",
      targetValue: 3,
      unit: "sessions",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      habitIds: [studyHabitId],
      status: "active",
      trackingMode: "automatic",
    };

    const completions = [
      { habitId: studyHabitId, date: "2026-09-01", status: "completed" },
      { habitId: studyHabitId, date: "2026-09-02", status: "completed" },
      { habitId: studyHabitId, date: "2026-09-03", status: "completed" },
    ];

    const result = calculateGoalProgress(goal, completions, "UTC", "2026-09-12");
    expect(result.currentValue).toBe(3);
    expect(result.percentage).toBe(100);
    expect(result.effectiveStatus).toBe("completed");
  });
});

describe("Goal Deadline & Days Remaining Calculations", () => {
  it("formats future days remaining correctly", () => {
    const result = formatDaysRemaining("2026-09-30", "UTC", "2026-09-12");
    expect(result.daysRemaining).toBe(18);
    expect(result.deadlineText).toBe("18 days remaining");
    expect(result.isOverdue).toBe(false);
  });

  it("formats single day remaining properly", () => {
    const result = formatDaysRemaining("2026-09-13", "UTC", "2026-09-12");
    expect(result.daysRemaining).toBe(1);
    expect(result.deadlineText).toBe("1 day remaining");
    expect(result.isOverdue).toBe(false);
  });

  it("formats due today correctly", () => {
    const result = formatDaysRemaining("2026-09-12", "UTC", "2026-09-12");
    expect(result.daysRemaining).toBe(0);
    expect(result.deadlineText).toBe("Due today");
    expect(result.isOverdue).toBe(false);
  });

  it("identifies overdue goals and avoids negative values", () => {
    const result = formatDaysRemaining("2026-09-08", "UTC", "2026-09-12");
    expect(result.daysRemaining).toBe(0);
    expect(result.deadlineText).toBe("Overdue");
    expect(result.isOverdue).toBe(true);
  });
});

describe("Goal Summary Statistics Aggregator", () => {
  it("calculates active, completed, and at-risk goals accurately", () => {
    const items = [
      {
        goal: { status: "active" },
        progress: {
          effectiveStatus: "active" as const,
          percentage: 40,
          isAtRisk: false,
        } as any,
      },
      {
        goal: { status: "active" },
        progress: {
          effectiveStatus: "active" as const,
          percentage: 60,
          isAtRisk: true,
        } as any,
      },
      {
        goal: { status: "completed" },
        progress: {
          effectiveStatus: "completed" as const,
          percentage: 100,
          isAtRisk: false,
        } as any,
      },
      {
        goal: { status: "active" },
        progress: {
          effectiveStatus: "overdue" as const,
          percentage: 50,
          isAtRisk: true,
        } as any,
      },
    ];

    const stats = calculateGoalStats(items);
    // Active goals: items 0, 1, 3 (effectiveStatus "active" or "overdue") = 3
    expect(stats.activeGoals).toBe(3);
    // Completed goals: item 2 = 1
    expect(stats.completedGoals).toBe(1);
    // At risk: item 1 (isAtRisk: true) and item 3 (effectiveStatus: "overdue") = 2
    expect(stats.atRiskGoals).toBe(2);
    // Average active progress: (40 + 60 + 50) / 3 = 50%
    expect(stats.overallProgress).toBe(50);
  });
});

describe("Goal Input Validations (Zod Schema)", () => {
  it("validates valid goal creation inputs", () => {
    const payload = {
      title: "Maintain a 30-day study streak",
      type: "consistency",
      trackingMode: "automatic",
      targetValue: 30,
      unit: "days",
      startDate: "2026-09-01",
      endDate: "2026-09-30",
      habitIds: ["64f1a2b3c4d5e6f7a8b90001"],
      icon: "target",
      color: "#1B4332",
    };

    const parsed = goalSchema.safeParse(payload);
    expect(parsed.success).toBe(true);
  });

  it("rejects goal if endDate is before startDate", () => {
    const payload = {
      title: "Backwards goal",
      type: "habit_completion",
      targetValue: 10,
      unit: "times",
      startDate: "2026-09-30",
      endDate: "2026-09-01", // Invalid: before start
    };

    const parsed = goalSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("rejects goal with non-positive targetValue", () => {
    const payload = {
      title: "Zero target goal",
      type: "habit_completion",
      targetValue: 0, // Must be >= 1
      startDate: "2026-09-01",
      endDate: "2026-09-30",
    };

    const parsed = goalSchema.safeParse(payload);
    expect(parsed.success).toBe(false);
  });

  it("validates manual progress update payload", () => {
    expect(goalProgressSchema.safeParse({ value: 5 }).success).toBe(true);
    expect(goalProgressSchema.safeParse({ value: 0 }).success).toBe(true);
    expect(goalProgressSchema.safeParse({ value: -1 }).success).toBe(false);
  });
});
