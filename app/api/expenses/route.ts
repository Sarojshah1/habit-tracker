import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Expense } from "@/lib/models/Expense";
import { expenseSchema } from "@/lib/validations/expense";
import { getUserTodayDateString } from "@/lib/utils/date";
import { syncRecurringItemsForUser } from "@/lib/services/recurring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "Asia/Kathmandu";
    const todayDateStr = getUserTodayDateString(timezone);

    // Auto-sync pending recurring items up to today
    await syncRecurringItemsForUser(user._id, timezone);

    const url = new URL(req.url);
    const monthParam = url.searchParams.get("month"); // YYYY-MM
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");
    const categoryParam = url.searchParams.get("category");
    const typeParam = url.searchParams.get("type"); // expense | income
    const searchParam = url.searchParams.get("search");

    let startDate = startDateParam;
    let endDate = endDateParam;

    if (!startDate && !endDate) {
      const targetMonth = monthParam || todayDateStr.substring(0, 7);
      const [yr, mo] = targetMonth.split("-").map(Number);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      startDate = `${targetMonth}-01`;
      endDate = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;
    }

    const query: any = {
      userId: user._id,
    };

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (categoryParam && categoryParam !== "all") {
      query.category = categoryParam;
    }

    if (typeParam && typeParam !== "all") {
      query.type = typeParam;
    }

    if (searchParam) {
      query.title = { $regex: searchParam, $options: "i" };
    }

    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .populate("habitId", "name icon color")
      .lean();

    // Calculate aggregated metrics
    let totalExpense = 0;
    let totalIncome = 0;
    let essentialExpense = 0;
    let discretionaryExpense = 0;
    let unsettledSplitTotal = 0;

    const categoryBreakdown: Record<string, number> = {};
    const dailySpending: Record<string, number> = {};
    const daysWithDiscretionarySpending = new Set<string>();

    expenses.forEach((item: any) => {
      const amount = Number(item.amount) || 0;
      if (item.type === "expense") {
        totalExpense += amount;
        if (item.isEssential) {
          essentialExpense += amount;
        } else {
          discretionaryExpense += amount;
          daysWithDiscretionarySpending.add(item.date);
        }

        categoryBreakdown[item.category] =
          (categoryBreakdown[item.category] || 0) + amount;

        dailySpending[item.date] = (dailySpending[item.date] || 0) + amount;

        if (item.splitWith && item.splitStatus === "pending") {
          unsettledSplitTotal += Number(item.splitAmount) || 0;
        }
      } else if (item.type === "income") {
        totalIncome += amount;
      }
    });

    // Calculate No-Spend days
    // Count days in date range where discretionary expense = 0
    let noSpendDaysCount = 0;
    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const diffDays = Math.round(
        (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;

      for (let i = 0; i < diffDays; i++) {
        const curDate = new Date(start);
        curDate.setDate(curDate.getDate() + i);
        const curStr = curDate.toISOString().split("T")[0];
        if (curStr <= todayDateStr && !daysWithDiscretionarySpending.has(curStr)) {
          noSpendDaysCount++;
        }
      }
    }

    return NextResponse.json({
      success: true,
      expenses,
      summary: {
        totalExpense,
        totalIncome,
        netSavings: totalIncome - totalExpense,
        essentialExpense,
        discretionaryExpense,
        noSpendDaysCount,
        unsettledSplitTotal,
        categoryBreakdown,
        dailySpending,
        count: expenses.length,
      },
    });
  } catch (error: any) {
    console.error("Expenses GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch expenses" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const parsed = expenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const expense = await Expense.create({
      ...parsed.data,
      userId: user._id,
      habitId: parsed.data.habitId ? parsed.data.habitId : undefined,
    });

    return NextResponse.json(
      {
        success: true,
        expense,
        message: "Transaction logged successfully",
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Expenses POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create expense" },
      { status: 500 }
    );
  }
}
