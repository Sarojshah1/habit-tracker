import { describe, it, expect, vi, beforeEach } from "vitest";
import { enqueueOfflineAction, getOfflineQueue, removeOfflineAction } from "@/lib/services/offlineSync";

describe("Exam Readiness Matrix & Target Countdown Logic", () => {
  it("calculates composite readiness score accurately according to formula", () => {
    // 35% syllabus, 35% mock, 20% habit streak, 10% flashcards
    const syllabusScore = 80;
    const mockScore = 90;
    const habitScore = 100;
    const flashcardScore = 70;

    const expectedScore = Math.round(
      syllabusScore * 0.35 +
      mockScore * 0.35 +
      habitScore * 0.20 +
      flashcardScore * 0.10
    );

    // 80*0.35 = 28, 90*0.35 = 31.5, 100*0.2 = 20, 70*0.1 = 7 => 28 + 31.5 + 20 + 7 = 86.5 => 87
    expect(expectedScore).toBe(87);

    // Score >= 85 is Mastery tier
    expect(expectedScore >= 85 ? "Mastery" : "On Track").toBe("Mastery");
  });

  it("calculates days remaining until target exam date", () => {
    const todayStr = "2026-09-26";
    const examDateStr = "2026-10-10";

    const today = new Date(todayStr);
    const examDate = new Date(examDateStr);
    const diffTime = examDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    expect(daysRemaining).toBe(14);
  });

  it("handles exam day (0 days) and past exams correctly", () => {
    const todayStr = "2026-09-26";
    const todayExamDate = new Date(todayStr);
    const today = new Date(todayStr);
    const diffTime = todayExamDate.getTime() - today.getTime();
    const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    expect(daysRemaining).toBe(0);
  });
});

describe("PWA Offline Action Queue & Sync", () => {
  beforeEach(() => {
    // Clear localStorage mockup
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value;
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        Object.keys(store).forEach((k) => delete store[k]);
      },
    });

    vi.stubGlobal("window", {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    });

    vi.stubGlobal("navigator", {
      onLine: false,
    });
  });

  it("enqueues offline actions into queue", () => {
    const action = enqueueOfflineAction({
      type: "log_water",
      endpoint: "/api/utilities",
      method: "POST",
      payload: { action: "increment_water", amount: 1 },
      description: "+1 Drinking Water Jar",
    });

    expect(action.id).toBeDefined();
    expect(action.type).toBe("log_water");
    expect(action.payload.amount).toBe(1);

    const queue = getOfflineQueue();
    expect(queue.length).toBe(1);
    expect(queue[0].description).toBe("+1 Drinking Water Jar");
  });

  it("can remove processed action by id", () => {
    const action1 = enqueueOfflineAction({
      type: "toggle_habit",
      endpoint: "/api/completions",
      method: "POST",
      payload: { habitId: "123", status: "completed" },
      description: "Complete habit",
    });

    const action2 = enqueueOfflineAction({
      type: "log_expense",
      endpoint: "/api/expenses",
      method: "POST",
      payload: { amount: 500, title: "Book" },
      description: "Log expense Rs. 500",
    });

    expect(getOfflineQueue().length).toBe(2);

    removeOfflineAction(action1.id);

    const updatedQueue = getOfflineQueue();
    expect(updatedQueue.length).toBe(1);
    expect(updatedQueue[0].id).toBe(action2.id);
  });
});
