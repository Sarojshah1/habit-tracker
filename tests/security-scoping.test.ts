import { describe, it, expect } from "vitest";
import { habitSchema, completionSchema } from "../lib/validations/habit";
import { registerSchema, loginSchema } from "../lib/validations/auth";
import { signToken, verifyToken } from "../lib/auth/jwt";

describe("Authentication & Input Validation Security", () => {
  it("validates registration email and password requirements", () => {
    const invalidEmail = registerSchema.safeParse({
      name: "Student",
      email: "invalid-email",
      password: "123", // too short
    });
    expect(invalidEmail.success).toBe(false);

    const validUser = registerSchema.safeParse({
      name: "Student",
      email: "student@example.com",
      password: "password123",
      timezone: "UTC",
    });
    expect(validUser.success).toBe(true);
  });

  it("safely generates and verifies JWT payloads", () => {
    const payload = { userId: "user-abc-123", email: "student@example.com" };
    const token = signToken(payload);
    expect(typeof token).toBe("string");

    const decoded = verifyToken(token);
    expect(decoded?.userId).toBe(payload.userId);
    expect(decoded?.email).toBe(payload.email);
  });

  it("rejects tampered or forged JWT tokens", () => {
    const fakeToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.fakePayload.fakeSignature";
    const decoded = verifyToken(fakeToken);
    expect(decoded).toBeNull();
  });

  it("validates habit creation schema strictly", () => {
    const badHabit = habitSchema.safeParse({
      name: "", // empty name
      startDate: "invalid-date",
    });
    expect(badHabit.success).toBe(false);

    const goodHabit = habitSchema.safeParse({
      name: "Study for 2 hours",
      startDate: "2026-09-12",
      frequency: "daily",
      color: "#1B4332",
      icon: "book-open",
    });
    expect(goodHabit.success).toBe(true);
  });

  it("validates completion payload structure", () => {
    const validCompletion = completionSchema.safeParse({
      habitId: "64f1a2b3c4d5e6f7a8b9c0d1",
      date: "2026-09-12",
      status: "completed",
    });
    expect(validCompletion.success).toBe(true);
  });
});
