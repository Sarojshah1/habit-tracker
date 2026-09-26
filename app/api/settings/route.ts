import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { updateSettingsSchema } from "@/lib/validations/settings";
import { User } from "@/lib/models/User";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    return NextResponse.json({
      success: true,
      profile: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        timezone: user.timezone,
        language: user.language,
      },
      preferences: user.preferences,
    });
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = updateSettingsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const { profile, preferences } = parsed.data;

    // Fetch the Mongoose document to ensure full document instance and validation integrity
    const dbUser = await User.findById(user._id);
    if (!dbUser) return unauthorizedResponse();

    if (profile) {
      if (profile.name) dbUser.name = profile.name.trim();
      if (profile.timezone) dbUser.timezone = profile.timezone;
      if (profile.language) dbUser.language = profile.language;
      if (profile.avatar !== undefined) dbUser.avatar = profile.avatar;
    }

    if (preferences) {
      if (!dbUser.preferences) {
        dbUser.preferences = {
          notifications: {
            habitReminders: true,
            dailySummary: true,
            streakReminders: true,
            goalReminders: true,
            focusNotifications: true,
            taskReminders: true,
            dailyReview: true,
            weeklyReview: true,
          },
          appearance: "light",
          habitPreferences: {
            defaultReminderTime: "08:00",
            weekStartsOn: "monday",
            defaultHabitView: "list",
          },
          dashboardPreferences: {
            widgets: ["priorities", "tasks", "habits", "schedule", "focus", "goals", "weekly", "activity", "insights"],
          },
          taskDefaults: {
            defaultDurationMinutes: 30,
          },
          productivityScoreWeights: {
            habits: 40,
            tasks: 40,
            focus: 20,
          },
        };
      }

      if (preferences.notifications) {
        dbUser.preferences.notifications = {
          ...(dbUser.preferences.notifications || {}),
          ...preferences.notifications,
        };
      }
      if (preferences.appearance) {
        dbUser.preferences.appearance = preferences.appearance;
      }
      if (preferences.habitPreferences) {
        dbUser.preferences.habitPreferences = {
          ...(dbUser.preferences.habitPreferences || {}),
          ...preferences.habitPreferences,
        };
      }
      if (preferences.taskDefaults) {
        dbUser.preferences.taskDefaults = {
          defaultDurationMinutes:
            preferences.taskDefaults.defaultDurationMinutes ??
            dbUser.preferences.taskDefaults?.defaultDurationMinutes ??
            30,
        };
      }
      if (preferences.productivityScoreWeights) {
        dbUser.preferences.productivityScoreWeights = {
          habits:
            preferences.productivityScoreWeights.habits ??
            dbUser.preferences.productivityScoreWeights?.habits ??
            40,
          tasks:
            preferences.productivityScoreWeights.tasks ??
            dbUser.preferences.productivityScoreWeights?.tasks ??
            40,
          focus:
            preferences.productivityScoreWeights.focus ??
            dbUser.preferences.productivityScoreWeights?.focus ??
            20,
        };
      }
      if (preferences.dashboardPreferences) {
        dbUser.preferences.dashboardPreferences = {
          widgets:
            preferences.dashboardPreferences.widgets ??
            dbUser.preferences.dashboardPreferences?.widgets ??
            ["priorities", "tasks", "habits", "schedule", "focus", "goals", "weekly", "activity", "insights"],
        };
      }
    }

    dbUser.markModified("preferences");
    await dbUser.save();

    return NextResponse.json({
      success: true,
      profile: {
        id: dbUser._id.toString(),
        name: dbUser.name,
        email: dbUser.email,
        avatar: dbUser.avatar,
        timezone: dbUser.timezone,
        language: dbUser.language,
      },
      preferences: dbUser.preferences,
      message: "Settings saved successfully",
    });
  } catch (error) {
    console.error("PATCH /api/settings error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update settings" },
      { status: 500 }
    );
  }
}
