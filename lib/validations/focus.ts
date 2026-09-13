import { z } from "zod";

export const focusSessionSchema = z.object({
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  startedAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  status: z.enum(["completed", "interrupted", "abandoned", "cancelled"]).default("completed"),
  habitId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
  goalId: z.string().optional().nullable(),
  notes: z.string().max(500).optional().default(""),
});

export type FocusSessionInput = z.infer<typeof focusSessionSchema>;
