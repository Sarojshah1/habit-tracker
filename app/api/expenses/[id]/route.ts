import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Expense } from "@/lib/models/Expense";
import { updateExpenseSchema } from "@/lib/validations/expense";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const expense = await Expense.findOne({ _id: id, userId: user._id })
      .populate("habitId", "name icon color")
      .lean();

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error("Expense GET [id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expense" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();
    const parsed = updateExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const updateData: any = { ...parsed.data };
    if (updateData.habitId === "") {
      updateData.$unset = { habitId: 1 };
      delete updateData.habitId;
    }

    const expense = await Expense.findOneAndUpdate(
      { _id: id, userId: user._id },
      updateData,
      { new: true, runValidators: true }
    );

    if (!expense) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      expense,
      message: "Expense updated successfully",
    });
  } catch (error: any) {
    console.error("Expense PATCH error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update expense" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await Expense.findOneAndDelete({ _id: id, userId: user._id });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Expense not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error: any) {
    console.error("Expense DELETE error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete expense" },
      { status: 500 }
    );
  }
}
