import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Flashcard } from "@/lib/models/Flashcard";
import { getDateDaysAgoFrom } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

// PATCH /api/flashcards/[id] - Grade recall (Again = 1, Hard = 2, Good = 3, Easy = 4) and update SM-2 spaced repetition interval
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const { rating } = body; // 1 = Again, 2 = Hard, 3 = Good, 4 = Easy

    const card = await Flashcard.findOne({ _id: id, userId: user._id });
    if (!card) {
      return NextResponse.json({ success: false, message: "Flashcard not found" }, { status: 404 });
    }

    let interval = card.intervalDays || 1;
    let repetition = card.repetition || 0;
    let easeFactor = card.easeFactor || 2.5;

    // SuperMemo-2 Spaced Repetition calculation
    if (rating === 1) {
      // Again: Reset to 1 day
      interval = 1;
      repetition = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 2) {
      // Hard: Slight progression (e.g. 1 -> 2, or * 1.2)
      interval = repetition === 0 ? 1 : Math.round(interval * 1.2);
      easeFactor = Math.max(1.3, easeFactor - 0.15);
      repetition += 1;
    } else if (rating === 3) {
      // Good: Standard spaced progression: 1 day -> 3 days -> 7 days -> interval * easeFactor
      if (repetition === 0) interval = 1;
      else if (repetition === 1) interval = 3;
      else if (repetition === 2) interval = 7;
      else interval = Math.round(interval * easeFactor);
      repetition += 1;
    } else if (rating === 4) {
      // Easy: Accelerated progression: 3 days -> 7 days -> 14 days -> interval * (easeFactor + 0.3)
      if (repetition === 0) interval = 3;
      else if (repetition === 1) interval = 7;
      else interval = Math.round(interval * (easeFactor + 0.3));
      easeFactor += 0.15;
      repetition += 1;
    }

    // Calculate new dueDate (today + interval days)
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Math.max(1, interval));
    const nextDueDate = nextDate.toISOString().split("T")[0];

    card.intervalDays = interval;
    card.repetition = repetition;
    card.easeFactor = easeFactor;
    card.dueDate = nextDueDate;
    card.lastReviewedAt = new Date();
    await card.save();

    return NextResponse.json({
      success: true,
      message: `Card updated. Next review in ${interval} day${interval > 1 ? "s" : ""} (${nextDueDate}).`,
      card,
    });
  } catch (error) {
    console.error("PATCH /api/flashcards/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update review status" },
      { status: 500 }
    );
  }
}

// DELETE /api/flashcards/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await Flashcard.findOneAndDelete({ _id: id, userId: user._id });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Card not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Flashcard deleted" });
  } catch (error) {
    console.error("DELETE /api/flashcards/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete card" },
      { status: 500 }
    );
  }
}
