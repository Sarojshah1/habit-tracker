import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await Notification.updateMany({ userId: user._id, read: false }, { $set: { read: true } });

    return NextResponse.json({ success: true, message: "All notifications marked as read" });
  } catch (error) {
    console.error("PATCH /api/notifications/read-all error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to mark all as read" },
      { status: 500 }
    );
  }
}
