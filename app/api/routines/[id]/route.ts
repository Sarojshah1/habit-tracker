import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Routine } from "@/lib/models/Routine";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const routine = await Routine.findOne({ _id: params.id, userId: user._id })
      .populate("habitIds", "name icon color frequency")
      .populate("taskIds", "title priority status dueDate");

    if (!routine) {
      return NextResponse.json({ success: false, message: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error("GET /api/routines/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch routine" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();

    const routine = await Routine.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: body },
      { new: true }
    );

    if (!routine) {
      return NextResponse.json({ success: false, message: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, routine });
  } catch (error) {
    console.error("PATCH /api/routines/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update routine" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const routine = await Routine.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!routine) {
      return NextResponse.json({ success: false, message: "Routine not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Routine deleted" });
  } catch (error) {
    console.error("DELETE /api/routines/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete routine" },
      { status: 500 }
    );
  }
}
