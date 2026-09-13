import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Notification } from "@/lib/models/Notification";
import { syncUserNotifications, createNotification } from "@/lib/services/notification";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    // Dynamically evaluate and sync notifications based on habits, tasks, and reviews
    await syncUserNotifications(user);

    const notifications = await Notification.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(30);

    const unreadCount = await Notification.countDocuments({
      userId: user._id,
      read: false,
    });

    return NextResponse.json({
      success: true,
      notifications,
      unreadCount,
    });
  } catch (error) {
    console.error("GET /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const { title, message, type = "system" } = body;

    if (!title || !message) {
      return NextResponse.json(
        { success: false, message: "Title and message are required" },
        { status: 400 }
      );
    }

    const notif = await createNotification({
      userId: user._id,
      type: type || "system",
      title: title.trim(),
      message: message.trim(),
    });

    return NextResponse.json({
      success: true,
      notification: notif,
      message: "Notification created",
    });
  } catch (error) {
    console.error("POST /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create notification" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    await Notification.deleteMany({ userId: user._id });

    return NextResponse.json({
      success: true,
      message: "All notifications cleared",
    });
  } catch (error) {
    console.error("DELETE /api/notifications error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to clear notifications" },
      { status: 500 }
    );
  }
}
