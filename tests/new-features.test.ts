import { describe, it, expect, beforeEach } from "vitest";
import { generateLocalCoachDebrief } from "../lib/services/aiCoach";
import { isSoundEnabled, setSoundEnabled } from "../lib/utils/sound";
import { calculateOverallStreaks } from "../lib/services/streak";

describe("AI Study Coach Engine", () => {
  it("assigns Diamond Momentum tier for streaks >= 21 days", () => {
    const debrief = generateLocalCoachDebrief({
      userName: "Saroj",
      currentStreak: 25,
      longestStreak: 25,
      todayCompletedCount: 3,
      todayTotalCount: 3,
      weeklyCompletionRate: 95,
      activeHabits: [
        { _id: "1", name: "Read 1 Chapter Operating Systems", category: "study" },
      ],
      availableFreezes: 3,
    });

    expect(debrief.tierName).toBe("Diamond Momentum");
    expect(debrief.tierEmoji).toBe("💎");
    expect(debrief.momentumScore).toBeGreaterThanOrEqual(90);
    expect(debrief.recommendations.length).toBeGreaterThan(0);
  });

  it("assigns Platinum tier for streaks 14-20 days", () => {
    const debrief = generateLocalCoachDebrief({
      userName: "Alex",
      currentStreak: 18,
      longestStreak: 20,
      todayCompletedCount: 2,
      todayTotalCount: 4,
      weeklyCompletionRate: 85,
      activeHabits: [
        { _id: "1", name: "Algorithm Practice", category: "study" },
        { _id: "2", name: "Sleep 8 hours", category: "wellness" },
        { _id: "3", name: "Late Night Review", schedule: { time: "21:30" } },
      ],
      availableFreezes: 2,
    });

    expect(debrief.tierName).toBe("Platinum Consistency");
    expect(debrief.tierEmoji).toBe("🛡️");
  });

  it("detects evening drop-off vulnerability when evening habits are scheduled", () => {
    const debrief = generateLocalCoachDebrief({
      userName: "Student",
      currentStreak: 10,
      longestStreak: 12,
      todayCompletedCount: 1,
      todayTotalCount: 3,
      weeklyCompletionRate: 70,
      activeHabits: [
        { _id: "1", name: "Physics Problem Set", schedule: { time: "22:00" } },
      ],
      availableFreezes: 2,
    });

    const eveningRec = debrief.recommendations.find((r) => r.id === "rec-circadian");
    expect(eveningRec).toBeDefined();
    expect(eveningRec?.title).toContain("Late-Night");
  });

  it("warns when streak freezes are critically low", () => {
    const debrief = generateLocalCoachDebrief({
      userName: "Student",
      currentStreak: 8,
      longestStreak: 8,
      todayCompletedCount: 1,
      todayTotalCount: 2,
      weeklyCompletionRate: 60,
      activeHabits: [{ _id: "1", name: "Study biology" }],
      availableFreezes: 1,
    });

    const freezeWarning = debrief.recommendations.find((r) => r.id === "rec-freeze-alert");
    expect(freezeWarning).toBeDefined();
    expect(freezeWarning?.type).toBe("warning");
  });
});

describe("Web Audio Preference Engine", () => {
  const store = new Map<string, string>();
  const mockLocalStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, val: string) => store.set(key, val),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
  };

  beforeEach(() => {
    store.clear();
    (globalThis as any).window = {
      localStorage: mockLocalStorage,
    };
    (globalThis as any).localStorage = mockLocalStorage;
  });

  it("defaults sound to enabled when localStorage is empty", () => {
    expect(isSoundEnabled()).toBe(true);
  });

  it("toggles sound preference and persists", () => {
    setSoundEnabled(false);
    expect(isSoundEnabled()).toBe(false);

    setSoundEnabled(true);
    expect(isSoundEnabled()).toBe(true);
  });
});

describe("Auto-Freeze Streak Preservation Logic", () => {
  it("preserves an active streak when yesterday is shielded", () => {
    const today = "2026-09-30";
    const yesterday = "2026-09-29";
    const daysBefore = ["2026-09-28", "2026-09-27", "2026-09-26"];

    // Without yesterday frozen, today pending -> streak drops to 0
    const withoutFreeze = calculateOverallStreaks(daysBefore, today, []);
    expect(withoutFreeze.currentStreak).toBe(0);

    // With yesterday auto-frozen -> streak continues across yesterday!
    const withFreeze = calculateOverallStreaks(daysBefore, today, [yesterday]);
    expect(withFreeze.currentStreak).toBe(3);
  });
});
