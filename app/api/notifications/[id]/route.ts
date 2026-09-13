import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Notification } from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const notif = await Notification.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: { read: true } },
      { new: true }
    );

    if (!notif) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, notification: notif });
  } catch (error) {
    console.error("PATCH /api/notifications/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const notif = await Notification.findOneAndDelete({
      _id: params.id,
      userId: user._id,
    });

    if (!notif) {
      return NextResponse.json({ success: false, message: "Notification not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Notification removed" });
  } catch (error) {
    console.error("DELETE /api/notifications/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete notification" },
      { status: 500 }
    );
  }
}
