import { describe, it, expect } from "vitest";
import { habitSchema, completionSchema } from "../lib/validations/habit";
import { BADGE_DEFINITIONS } from "../lib/services/badges";

describe("Advanced Habit Validation (Habit Stacking & 2-Minute Rule)", () => {
  it("validates a habit with stacking and 2-minute micro version", () => {
    const input = {
      name: "Study Physics Chapters",
      description: "Review optics and mechanics",
      icon: "book-open",
      color: "#2D6A4F",
      frequency: "daily" as const,
      startDate: "2026-09-01",
      habitStackAfterHabitId: "64e0a1b2c3d4e5f6a7b8c9d0",
      twoMinuteVersion: "Read 1 page or review 5 formula flashcards",
    };

    const result = habitSchema.safeParse(input);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.habitStackAfterHabitId).toBe("64e0a1b2c3d4e5f6a7b8c9d0");
      expect(result.data.twoMinuteVersion).toBe("Read 1 page or review 5 formula flashcards");
    }
  });

  it("validates full vs micro completion types", () => {
    const fullCompletion = {
      habitId: "64e0a1b2c3d4e5f6a7b8c9d0",
      date: "2026-09-26",
      status: "completed" as const,
      completionType: "full" as const,
    };

    const microCompletion = {
      habitId: "64e0a1b2c3d4e5f6a7b8c9d0",
      date: "2026-09-26",
      status: "completed" as const,
      completionType: "micro" as const,
      notes: "Exhausted day, completed 2-minute fallback",
    };

    expect(completionSchema.safeParse(fullCompletion).success).toBe(true);
    expect(completionSchema.safeParse(microCompletion).success).toBe(true);
  });

  it("rejects 2-minute version exceeding 120 characters", () => {
    const input = {
      name: "Short Habit",
      startDate: "2026-09-01",
      twoMinuteVersion: "A".repeat(125),
    };

    const result = habitSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});

describe("Gamification & Badges Engine", () => {
  it("has all expected badge definitions configured", () => {
    const badgeIds = BADGE_DEFINITIONS.map((b) => b.id);
    expect(badgeIds).toContain("week_warrior");
    expect(badgeIds).toContain("fortnight_focus");
    expect(badgeIds).toContain("monthly_master");
    expect(badgeIds).toContain("micro_momentum");
    expect(badgeIds).toContain("chain_builder");
    expect(badgeIds).toContain("ice_age");
    expect(badgeIds).toContain("centurion");
  });

  it("has valid progress thresholds for every badge", () => {
    for (const b of BADGE_DEFINITIONS) {
      expect(b.maxProgress).toBeGreaterThan(0);
      expect(b.title.length).toBeGreaterThan(2);
      expect(b.description.length).toBeGreaterThan(10);
    }
  });
});
