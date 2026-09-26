import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { RecurringItem } from "@/lib/models/RecurringItem";
import { syncRecurringItemsForUser } from "@/lib/services/recurring";
import { getUserTodayDateString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "Asia/Kathmandu";

    // Auto-sync pending days first
    await syncRecurringItemsForUser(user._id, timezone);

    const items = await RecurringItem.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, items });
  } catch (error: any) {
    console.error("Recurring items GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch recurring items" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "Asia/Kathmandu";
    const todayDateStr = getUserTodayDateString(timezone);

    const body = await req.json();
    const {
      title,
      type = "expense",
      amount = 0,
      unitCount = 1,
      category = "groceries",
      frequency = "daily",
      autoAddExpense = true,
      startDate = todayDateStr,
      notes = "",
    } = body;

    if (!title || !title.trim()) {
      return NextResponse.json(
        { success: false, error: "Title is required" },
        { status: 400 }
      );
    }

    const item = await RecurringItem.create({
      userId: user._id,
      title: title.trim(),
      type,
      amount: Number(amount) || 0,
      unitCount: Number(unitCount) || 1,
      category,
      frequency,
      active: true,
      autoAddExpense: Boolean(autoAddExpense),
      startDate: startDate || todayDateStr,
      notes: notes.trim(),
    });

    // Run sync immediately for today
    await syncRecurringItemsForUser(user._id, timezone);

    return NextResponse.json({
      success: true,
      item,
      message: "Automatic daily subscription created and synced",
    });
  } catch (error: any) {
    console.error("Recurring item POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create recurring item" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "Asia/Kathmandu";
    const body = await req.json();
    const { id, active, amount, unitCount } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    const update: any = {};
    if (typeof active === "boolean") update.active = active;
    if (typeof amount === "number") update.amount = amount;
    if (typeof unitCount === "number") update.unitCount = unitCount;

    const updated = await RecurringItem.findOneAndUpdate(
      { _id: id, userId: user._id },
      { $set: update },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Recurring item not found" },
        { status: 404 }
      );
    }

    if (updated.active) {
      await syncRecurringItemsForUser(user._id, timezone);
    }

    return NextResponse.json({
      success: true,
      item: updated,
      message: "Subscription updated successfully",
    });
  } catch (error: any) {
    console.error("Recurring item PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update recurring item" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "Item ID is required" },
        { status: 400 }
      );
    }

    const deleted = await RecurringItem.findOneAndDelete({
      _id: id,
      userId: user._id,
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Recurring item not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription deleted successfully",
    });
  } catch (error: any) {
    console.error("Recurring item DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete recurring item" },
      { status: 500 }
    );
  }
}
