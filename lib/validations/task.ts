import { z } from "zod";

export const taskSchema = z
  .object({
    title: z.string().min(1, "Task title is required").max(150, "Title is too long"),
    description: z.string().max(1000).optional().default(""),
    status: z.enum(["todo", "in_progress", "completed", "cancelled"]).default("todo"),
    priority: z.enum(["high", "medium", "low"]).default("medium"),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid due date format (YYYY-MM-DD)"),
    estimatedMinutes: z.number().min(1, "Estimated duration must be at least 1 minute").default(30),
    actualMinutes: z.number().min(0).default(0),
    goalId: z.string().optional().nullable(),
    habitId: z.string().optional().nullable(),
    scheduledStart: z.string().datetime().optional().nullable(),
    scheduledEnd: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.scheduledStart && data.scheduledEnd) {
        return new Date(data.scheduledEnd) >= new Date(data.scheduledStart);
      }
      return true;
    },
    {
      message: "Scheduled end time cannot be before start time",
      path: ["scheduledEnd"],
    }
  );

export const taskUpdateSchema = z
  .object({
    title: z.string().min(1, "Task title is required").max(150).optional(),
    description: z.string().max(1000).optional(),
    status: z.enum(["todo", "in_progress", "completed", "cancelled"]).optional(),
    priority: z.enum(["high", "medium", "low"]).optional(),
    dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    estimatedMinutes: z.number().min(1).optional(),
    actualMinutes: z.number().min(0).optional(),
    goalId: z.string().optional().nullable(),
    habitId: z.string().optional().nullable(),
    scheduledStart: z.string().datetime().optional().nullable(),
    scheduledEnd: z.string().datetime().optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.scheduledStart && data.scheduledEnd) {
        return new Date(data.scheduledEnd) >= new Date(data.scheduledStart);
      }
      return true;
    },
    {
      message: "Scheduled end time cannot be before start time",
      path: ["scheduledEnd"],
    }
  );

export type TaskInput = z.infer<typeof taskSchema>;
export type TaskUpdateInput = z.infer<typeof taskUpdateSchema>;
