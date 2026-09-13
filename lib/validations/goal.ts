import { z } from "zod";

export const goalSchema = z
  .object({
    title: z.string().min(1, "Goal title is required").max(150, "Title is too long"),
    description: z.string().max(500).optional().default(""),
    type: z
      .enum(["habit_completion", "consistency", "weekly_frequency", "custom"])
      .default("habit_completion"),
    trackingMode: z.enum(["automatic", "manual"]).default("automatic"),
    targetValue: z.number().min(1, "Target value must be at least 1"),
    currentValue: z.number().min(0).default(0),
    unit: z.string().min(1, "Unit is required").default("completions"),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid start date format (YYYY-MM-DD)"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid end date format (YYYY-MM-DD)"),
    status: z
      .enum(["active", "completed", "paused", "archived", "cancelled"])
      .default("active"),
    habitIds: z.array(z.string()).optional().default([]),
    associatedHabitIds: z.array(z.string()).optional().default([]),
    taskIds: z.array(z.string()).optional().default([]),
    icon: z.string().default("target"),
    color: z.string().default("#1B4332"),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );

export const goalUpdateSchema = z
  .object({
    title: z.string().min(1, "Goal title is required").max(150, "Title is too long").optional(),
    description: z.string().max(500).optional(),
    type: z.enum(["habit_completion", "consistency", "weekly_frequency", "custom"]).optional(),
    trackingMode: z.enum(["automatic", "manual"]).optional(),
    targetValue: z.number().min(1, "Target value must be at least 1").optional(),
    currentValue: z.number().min(0).optional(),
    unit: z.string().min(1).optional(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    status: z.enum(["active", "completed", "paused", "archived", "cancelled"]).optional(),
    habitIds: z.array(z.string()).optional(),
    associatedHabitIds: z.array(z.string()).optional(),
    taskIds: z.array(z.string()).optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.startDate && data.endDate) {
        return data.endDate >= data.startDate;
      }
      return true;
    },
    {
      message: "End date cannot be before start date",
      path: ["endDate"],
    }
  );

export const goalProgressSchema = z.object({
  value: z.number().min(0, "Progress value cannot be negative"),
});

export type GoalInput = z.infer<typeof goalSchema>;
export type GoalUpdateInput = z.infer<typeof goalUpdateSchema>;
export type GoalProgressInput = z.infer<typeof goalProgressSchema>;
