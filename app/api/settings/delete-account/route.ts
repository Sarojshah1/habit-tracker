import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { clearAuthCookie } from "@/lib/auth/jwt";
import { User } from "@/lib/models/User";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { FocusSession } from "@/lib/models/FocusSession";
import { Note } from "@/lib/models/Note";
import { Activity } from "@/lib/models/Activity";

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const userId = user._id;

    // Purge all records associated with this user
    await Promise.all([
      Habit.deleteMany({ userId }),
      HabitCompletion.deleteMany({ userId }),
      Goal.deleteMany({ userId }),
      FocusSession.deleteMany({ userId }),
      Note.deleteMany({ userId }),
      Activity.deleteMany({ userId }),
      User.deleteOne({ _id: userId }),
    ]);

    await clearAuthCookie();

    return NextResponse.json({
      success: true,
      message: "Account and all associated personal data have been completely deleted.",
    });
  } catch (error) {
    console.error("DELETE /api/settings/delete-account error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete account" },
      { status: 500 }
    );
  }
}
