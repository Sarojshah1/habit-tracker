import { z } from "zod";

export const timeBlockSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(150),
    start: z.string().datetime("Invalid start timestamp"),
    end: z.string().datetime("Invalid end timestamp"),
    type: z.enum(["task", "habit", "focus", "break", "personal"]).default("task"),
    taskId: z.string().optional().nullable(),
    habitId: z.string().optional().nullable(),
    goalId: z.string().optional().nullable(),
    notes: z.string().max(500).optional().default(""),
    color: z.string().optional().default("#2D6A4F"),
  })
  .refine((data) => new Date(data.end) > new Date(data.start), {
    message: "End time must be after start time",
    path: ["end"],
  });

export const timeBlockUpdateSchema = z
  .object({
    title: z.string().min(1).max(150).optional(),
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
    type: z.enum(["task", "habit", "focus", "break", "personal"]).optional(),
    taskId: z.string().optional().nullable(),
    habitId: z.string().optional().nullable(),
    goalId: z.string().optional().nullable(),
    notes: z.string().max(500).optional(),
    color: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.start && data.end) {
        return new Date(data.end) > new Date(data.start);
      }
      return true;
    },
    {
      message: "End time must be after start time",
      path: ["end"],
    }
  );

export type TimeBlockInput = z.infer<typeof timeBlockSchema>;
export type TimeBlockUpdateInput = z.infer<typeof timeBlockUpdateSchema>;
