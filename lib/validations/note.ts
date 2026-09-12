import { z } from "zod";

export const noteSchema = z.object({
  title: z.string().min(1, "Title cannot be empty").max(200, "Title is too long").default("Untitled Note"),
  content: z.string().default(""),
  tags: z.array(z.string()).optional().default([]),
  pinned: z.boolean().optional().default(false),
  archived: z.boolean().optional().default(false),
});

export const noteUpdateSchema = noteSchema.partial();

export type NoteInput = z.infer<typeof noteSchema>;
export type NoteUpdateInput = z.infer<typeof noteUpdateSchema>;
