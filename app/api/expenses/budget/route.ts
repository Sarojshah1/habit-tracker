import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Budget } from "@/lib/models/Budget";
import { budgetSchema } from "@/lib/validations/expense";
import { getUserTodayDateString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    const url = new URL(req.url);
    const month = url.searchParams.get("month") || todayDateStr.substring(0, 7);

    let budget = await Budget.findOne({ userId: user._id, month }).lean();

    if (!budget) {
      // Find latest previous budget to copy defaults from
      const prevBudget = await Budget.findOne({ userId: user._id })
        .sort({ month: -1 })
        .lean();

      budget = {
        userId: user._id,
        month,
        monthlyLimit: prevBudget ? prevBudget.monthlyLimit : 20000,
        dailyLimit: prevBudget ? prevBudget.dailyLimit : 0,
        rentAmount: prevBudget ? prevBudget.rentAmount : 0,
        rentDueDate: prevBudget ? prevBudget.rentDueDate : 1,
        wifiAmount: prevBudget ? prevBudget.wifiAmount : 0,
        wifiDueDate: prevBudget ? prevBudget.wifiDueDate : 15,
        waterJarPrice: prevBudget ? prevBudget.waterJarPrice : 50,
        milkPacketPrice: prevBudget ? prevBudget.milkPacketPrice : 55,
        lastLpgDate: prevBudget ? prevBudget.lastLpgDate : "",
        categoryLimits: prevBudget ? prevBudget.categoryLimits : {},
      } as any;
    }

    return NextResponse.json({ success: true, budget });
  } catch (error: any) {
    console.error("Budget GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch budget" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = budgetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { month, ...updateFields } = parsed.data;

    const budget = await Budget.findOneAndUpdate(
      { userId: user._id, month },
      {
        $set: {
          ...updateFields,
          userId: user._id,
          month,
        },
      },
      { upsert: true, new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      budget,
      message: "Budget & household settings updated successfully",
    });
  } catch (error: any) {
    console.error("Budget POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update budget" },
      { status: 500 }
    );
  }
}
