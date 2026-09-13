import { z } from "zod";

export const profileSettingsSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100),
  timezone: z.string().min(1, "Timezone is required"),
  language: z.string().default("en"),
  avatar: z.string().optional(),
});

export const userPreferencesSchema = z.object({
  notifications: z.object({
    habitReminders: z.boolean().optional(),
    dailySummary: z.boolean().optional(),
    streakReminders: z.boolean().optional(),
    goalReminders: z.boolean().optional(),
    focusNotifications: z.boolean().optional(),
    taskReminders: z.boolean().optional(),
    dailyReview: z.boolean().optional(),
    weeklyReview: z.boolean().optional(),
  }).optional(),
  appearance: z.enum(["light", "dark", "system"]).optional(),
  habitPreferences: z.object({
    defaultReminderTime: z.string().optional(),
    weekStartsOn: z.enum(["monday", "sunday"]).optional(),
    defaultHabitView: z.enum(["grid", "list"]).optional(),
  }).optional(),
  dashboardPreferences: z.object({
    widgets: z.array(z.string()).optional(),
  }).optional(),
  taskDefaults: z.object({
    defaultDurationMinutes: z.number().min(5).max(480).optional(),
  }).optional(),
  productivityScoreWeights: z.object({
    habits: z.number().min(0).max(100).optional(),
    tasks: z.number().min(0).max(100).optional(),
    focus: z.number().min(0).max(100).optional(),
  }).optional(),
});

export const updateSettingsSchema = z.object({
  profile: profileSettingsSchema.optional(),
  preferences: userPreferencesSchema.optional(),
});

export type ProfileSettingsInput = z.infer<typeof profileSettingsSchema>;
export type UserPreferencesInput = z.infer<typeof userPreferencesSchema>;
export type UpdateSettingsInput = z.infer<typeof updateSettingsSchema>;
