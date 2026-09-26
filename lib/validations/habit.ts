import { z } from "zod";

export const habitSchema = z.object({
  name: z.string().min(1, "Habit name is required").max(100, "Name is too long"),
  description: z.string().max(500, "Description is too long").optional().default(""),
  icon: z.string().default("check-circle"),
  color: z.string().default("#2D6A4F"),
  frequency: z.enum(["daily", "weekly", "specific_days", "times_per_week", "custom"]).default("daily"),
  schedule: z
    .object({
      time: z.string().optional().default("08:00"),
      daysOfWeek: z.array(z.number().min(0).max(6)).optional().default([0, 1, 2, 3, 4, 5, 6]),
      timesPerWeek: z.number().min(1).max(7).optional().default(7),
    })
    .optional()
    .default({}),
  reminder: z.string().optional().default(""),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)"),
  goalId: z.string().optional(),
  habitStackAfterHabitId: z.string().optional().nullable(),
  twoMinuteVersion: z.string().max(120, "2-minute version is too long").optional().default(""),
});

export const habitUpdateSchema = habitSchema.partial().extend({
  archived: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const completionSchema = z.object({
  habitId: z.string().min(1, "Habit ID is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  status: z.enum(["completed", "skipped", "missed"]).default("completed"),
  completionType: z.enum(["full", "micro"]).optional().default("full"),
  notes: z.string().max(500).optional().default(""),
});

export type HabitInput = z.infer<typeof habitSchema>;
export type HabitUpdateInput = z.infer<typeof habitUpdateSchema>;
export type CompletionInput = z.infer<typeof completionSchema>;
