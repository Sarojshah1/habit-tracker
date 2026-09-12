import { z } from "zod";

export const goalSchema = z.object({
  title: z.string().min(1, "Goal title is required").max(150, "Title is too long"),
  description: z.string().max(500).optional().default(""),
  targetValue: z.number().min(1, "Target value must be at least 1"),
  currentValue: z.number().min(0).default(0),
  unit: z.string().default("days"),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format"),
  status: z.enum(["active", "completed", "paused", "cancelled"]).default("active"),
  associatedHabitIds: z.array(z.string()).optional().default([]),
});

export const goalUpdateSchema = goalSchema.partial();

export type GoalInput = z.infer<typeof goalSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
