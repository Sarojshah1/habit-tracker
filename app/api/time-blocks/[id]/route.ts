import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { TimeBlock } from "@/lib/models/TimeBlock";
import { timeBlockUpdateSchema } from "@/lib/validations/timeblock";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = timeBlockUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, message: parsed.error.errors[0]?.message || "Invalid update data" },
        { status: 400 }
      );
    }

    const updateData: any = { ...parsed.data };
    if (parsed.data.start) updateData.start = new Date(parsed.data.start);
    if (parsed.data.end) updateData.end = new Date(parsed.data.end);

    const block = await TimeBlock.findOneAndUpdate(
      { _id: params.id, userId: user._id },
      { $set: updateData },
      { new: true }
    );

    if (!block) {
      return NextResponse.json({ success: false, message: "Time block not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, block });
  } catch (error) {
    console.error("PATCH /api/time-blocks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update time block" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const block = await TimeBlock.findOneAndDelete({ _id: params.id, userId: user._id });
    if (!block) {
      return NextResponse.json({ success: false, message: "Time block not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Time block deleted" });
  } catch (error) {
    console.error("DELETE /api/time-blocks/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete time block" },
      { status: 500 }
    );
  }
}
