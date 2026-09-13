import { describe, it, expect } from "vitest";
import { updateSettingsSchema, userPreferencesSchema } from "../lib/validations/settings";
import { calculateDailyScore } from "../lib/services/productivity";

describe("Settings Validation & Preferences", () => {
  it("validates full user preferences including new notification options", () => {
    const validPrefs = {
      notifications: {
        habitReminders: true,
        taskReminders: true,
        dailySummary: true,
        streakReminders: true,
        goalReminders: true,
        focusNotifications: true,
        dailyReview: true,
        weeklyReview: true,
      },
      appearance: "dark" as const,
      habitPreferences: {
        defaultReminderTime: "07:30",
        weekStartsOn: "monday" as const,
        defaultHabitView: "list" as const,
      },
      taskDefaults: {
        defaultDurationMinutes: 45,
      },
      productivityScoreWeights: {
        habits: 50,
        tasks: 30,
        focus: 20,
      },
    };

    const result = userPreferencesSchema.safeParse(validPrefs);
    expect(result.success).toBe(true);
  });

  it("validates profile settings update with name, timezone, and avatar", () => {
    const updateInput = {
      profile: {
        name: "Student Prodigy",
        timezone: "Asia/Kathmandu",
        avatar: "🎓",
        language: "en",
      },
    };

    const result = updateSettingsSchema.safeParse(updateInput);
    expect(result.success).toBe(true);
  });

  it("rejects invalid appearance or duration out of range", () => {
    const invalidPrefs = {
      appearance: "neon_blue",
      taskDefaults: {
        defaultDurationMinutes: 1, // min is 5
      },
    };

    const result = userPreferencesSchema.safeParse(invalidPrefs);
    expect(result.success).toBe(false);
  });
});

describe("Productivity Score Custom Weights Calculation", () => {
  it("calculates balanced score using custom weights", () => {
    // 100% habits, 50% tasks, 100% focus
    // custom weights: 50% habits, 30% tasks, 20% focus
    const scoreResult = calculateDailyScore(
      4, // completed habits
      4, // total habits
      1, // completed tasks
      2, // total tasks
      120, // completed focus mins
      120, // target focus mins
      { habits: 50, tasks: 30, focus: 20 }
    );

    // Overall: 100% * 0.50 + 50% * 0.30 + 100% * 0.20 = 50 + 15 + 20 = 85%
    expect(scoreResult.overallScore).toBe(85);
    expect(scoreResult.habitScore).toBe(100);
    expect(scoreResult.taskScore).toBe(50);
    expect(scoreResult.focusScore).toBe(100);
    expect(scoreResult.weights.habits).toBe(50);
    expect(scoreResult.weights.tasks).toBe(30);
    expect(scoreResult.weights.focus).toBe(20);
  });
});
