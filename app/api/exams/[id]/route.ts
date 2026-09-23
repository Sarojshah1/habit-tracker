import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { MockExam } from "@/lib/models/MockExam";

export const dynamic = "force-dynamic";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await MockExam.findOneAndDelete({ _id: id, userId: user._id });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Exam log not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Mock exam deleted" });
  } catch (error) {
    console.error("DELETE /api/exams/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete exam" },
      { status: 500 }
    );
  }
}
