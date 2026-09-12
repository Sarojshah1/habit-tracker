import { z } from "zod";

export const profileSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().default("en"),
  avatar: z.string().optional(),
});

export const userPreferencesSchema = z.object({
  notifications: z.object({
    habitReminders: z.boolean(),
    dailySummary: z.boolean(),
    streakReminders: z.boolean(),
    goalReminders: z.boolean(),
    focusNotifications: z.boolean(),
  }),
  appearance: z.enum(["light", "dark", "system"]),
  habitPreferences: z.object({
    defaultReminderTime: z.string(),
    weekStartsOn: z.enum(["monday", "sunday"]),
    defaultHabitView: z.enum(["grid", "list"]),
  }),
});

export const updateSettingsSchema = z.object({
  profile: profileSettingsSchema.optional(),
  preferences: userPreferencesSchema.optional(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
