import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Note } from "@/lib/models/Note";
import { noteUpdateSchema } from "@/lib/validations/note";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const note = await Note.findOne({ _id: params.id, userId: user._id });
    if (!note) {
      return NextResponse.json({ success: false, message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("GET /api/notes/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch note" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = noteUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid input" },
        { status: 400 }
      );
    }

    const note = await Note.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: parsed.data },
      { new: true }
    );

    if (!note) {
      return NextResponse.json({ success: false, message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, note });
  } catch (error) {
    console.error("PATCH /api/notes/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update note" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const note = await Note.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!note) {
      return NextResponse.json({ success: false, message: "Note not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Note deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/notes/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete note" },
      { status: 500 }
    );
  }
}
