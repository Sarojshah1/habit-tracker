import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { updateSettingsSchema } from "@/lib/validations/settings";

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

    if (profile) {
      if (profile.name) user.name = profile.name.trim();
      if (profile.timezone) user.timezone = profile.timezone;
      if (profile.language) user.language = profile.language;
      if (profile.avatar !== undefined) user.avatar = profile.avatar;
    }

    if (preferences) {
      if (preferences.notifications) {
        user.preferences.notifications = {
          ...user.preferences.notifications,
          ...preferences.notifications,
        };
      }
      if (preferences.appearance) {
        user.preferences.appearance = preferences.appearance;
      }
      if (preferences.habitPreferences) {
        user.preferences.habitPreferences = {
          ...user.preferences.habitPreferences,
          ...preferences.habitPreferences,
        };
      }
    }

    await user.save();

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
