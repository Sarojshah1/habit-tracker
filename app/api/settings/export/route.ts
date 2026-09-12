import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { FocusSession } from "@/lib/models/FocusSession";
import { Note } from "@/lib/models/Note";
import { Activity } from "@/lib/models/Activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const [habits, completions, goals, focusSessions, notes, activities] = await Promise.all([
      Habit.find({ userId: user._id }),
      HabitCompletion.find({ userId: user._id }),
      Goal.find({ userId: user._id }),
      FocusSession.find({ userId: user._id }),
      Note.find({ userId: user._id }),
      Activity.find({ userId: user._id }),
    ]);

    const exportData = {
      exportedAt: new Date().toISOString(),
      user: {
        name: user.name,
        email: user.email,
        timezone: user.timezone,
        language: user.language,
        preferences: user.preferences,
        createdAt: user.createdAt,
      },
      habits,
      completions,
      goals,
      focusSessions,
      notes,
      activities,
    };

    return new NextResponse(JSON.stringify(exportData, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="habittrack-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (error) {
    console.error("GET /api/settings/export error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to export data" },
      { status: 500 }
    );
  }
}
