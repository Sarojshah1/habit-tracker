import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Flashcard } from "@/lib/models/Flashcard";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

// GET /api/flashcards - Fetch flashcards with deck filter and due status
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const deck = searchParams.get("deck");
    const dueOnly = searchParams.get("dueOnly") === "true";
    const today = new Date().toISOString().split("T")[0];

    const query: any = { userId: user._id };
    if (deck && deck !== "all") {
      query.deck = deck;
    }
    if (dueOnly) {
      query.dueDate = { $lte: today };
    }

    const cards = await Flashcard.find(query).sort({ dueDate: 1, createdAt: -1 });
    const decks = await Flashcard.distinct("deck", { userId: user._id });

    // Aggregate stats
    const totalCards = await Flashcard.countDocuments({ userId: user._id });
    const dueCardsCount = await Flashcard.countDocuments({
      userId: user._id,
      dueDate: { $lte: today },
    });
    const masteredCardsCount = await Flashcard.countDocuments({
      userId: user._id,
      intervalDays: { $gte: 14 },
    });

    return NextResponse.json({
      success: true,
      cards,
      decks,
      stats: {
        totalCards,
        dueCardsCount,
        masteredCardsCount,
      },
    });
  } catch (error) {
    console.error("GET /api/flashcards error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

// POST /api/flashcards - Create a single flashcard or batch from notes
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const today = new Date().toISOString().split("T")[0];

    // Check if batch creation
    if (Array.isArray(body.cards)) {
      const cardsToCreate = body.cards.map((c: any) => ({
        userId: user._id,
        deck: c.deck?.trim() || body.deck?.trim() || "General Review",
        front: c.front.trim(),
        back: c.back.trim(),
        noteId: body.noteId || undefined,
        dueDate: today,
        intervalDays: 1,
        repetition: 0,
        easeFactor: 2.5,
      }));

      const created = await Flashcard.insertMany(cardsToCreate);
      return NextResponse.json({
        success: true,
        message: `${created.length} flashcards created successfully`,
        cards: created,
      });
    }

    const { front, back, deck = "General Review", noteId } = body;
    if (!front?.trim() || !back?.trim()) {
      return NextResponse.json(
        { success: false, message: "Front and back content are required" },
        { status: 400 }
      );
    }

    const card = await Flashcard.create({
      userId: user._id,
      deck: deck.trim(),
      front: front.trim(),
      back: back.trim(),
      noteId: noteId || undefined,
      dueDate: today,
      intervalDays: 1,
      repetition: 0,
      easeFactor: 2.5,
    });

    await logActivity({
      userId: user._id.toString(),
      type: "focus_session_completed",
      entityId: card._id.toString(),
      entityType: "Flashcard",
      metadata: {
        title: "🧠 Flashcard Created",
        description: `Created new recall card for "${deck}".`,
        cardId: card._id.toString(),
        deck,
      },
    });

    return NextResponse.json(
      { success: true, message: "Flashcard created", card },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/flashcards error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create flashcard" },
      { status: 500 }
    );
  }
}
