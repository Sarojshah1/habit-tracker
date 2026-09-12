import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Note } from "@/lib/models/Note";
import { noteSchema } from "@/lib/validations/note";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const notes = await Note.find({ userId: user._id, archived: false }).sort({
      pinned: -1,
      updatedAt: -1,
    });

    return NextResponse.json({ success: true, notes });
  } catch (error) {
    console.error("GET /api/notes error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch notes" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = noteSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const note = await Note.create({
      ...parsed.data,
      userId: user._id,
    });

    await logActivity({
      userId: user._id,
      type: "note_created",
      entityId: note._id,
      entityType: "note",
      metadata: { title: note.title },
    });

    return NextResponse.json({ success: true, note }, { status: 201 });
  } catch (error) {
    console.error("POST /api/notes error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create note" },
      { status: 500 }
    );
  }
}
