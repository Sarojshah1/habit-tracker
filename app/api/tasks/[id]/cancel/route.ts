import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { cancelTask } from "@/lib/services/task";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const task = await cancelTask(user._id, params.id);
    if (!task) {
      return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task });
  } catch (error) {
    console.error("POST /api/tasks/[id]/cancel error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to cancel task" },
      { status: 500 }
    );
  }
}
