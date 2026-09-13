import { z } from "zod";

export const dailyPlanSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  priorityTaskIds: z.array(z.string()).max(10).default([]),
  focusTargetMinutes: z.number().min(1).max(1440).default(120),
  notes: z.string().max(500).optional().default(""),
});

export const dailyReviewSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format (YYYY-MM-DD)"),
  wins: z.string().max(2000).default(""),
  improvements: z.string().max(2000).default(""),
  saveToNotes: z.boolean().default(false),
});

export type DailyPlanInput = z.infer<typeof dailyPlanSchema>;
export type DailyReviewInput = z.infer<typeof dailyReviewSchema>;
