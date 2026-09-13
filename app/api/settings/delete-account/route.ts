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
import { Task } from "@/lib/models/Task";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { DailyPlan } from "@/lib/models/DailyPlan";
import { DailyReview } from "@/lib/models/DailyReview";
import { Routine } from "@/lib/models/Routine";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

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
      Task.deleteMany({ userId }),
      TimeBlock.deleteMany({ userId }),
      DailyPlan.deleteMany({ userId }),
      DailyReview.deleteMany({ userId }),
      Routine.deleteMany({ userId }),
      Notification.deleteMany({ userId }),
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
