import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { UtilityLog } from "@/lib/models/UtilityLog";
import { Expense } from "@/lib/models/Expense";
import { Budget } from "@/lib/models/Budget";
import { utilityLogSchema } from "@/lib/validations/expense";
import { getUserTodayDateString } from "@/lib/utils/date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date");
    const monthParam = url.searchParams.get("month"); // YYYY-MM
    const startDateParam = url.searchParams.get("startDate");
    const endDateParam = url.searchParams.get("endDate");

    let query: any = { userId: user._id };

    if (dateParam) {
      query.date = dateParam;
      const log = await UtilityLog.findOne(query).lean();
      return NextResponse.json({ success: true, log: log || null });
    }

    let startDate = startDateParam;
    let endDate = endDateParam;

    if (!startDate && !endDate) {
      const targetMonth = monthParam || todayDateStr.substring(0, 7);
      const [yr, mo] = targetMonth.split("-").map(Number);
      const daysInMonth = new Date(yr, mo, 0).getDate();
      startDate = `${targetMonth}-01`;
      endDate = `${targetMonth}-${String(daysInMonth).padStart(2, "0")}`;
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    }

    const logs = await UtilityLog.find(query).sort({ date: 1 }).lean();

    // Calculate month totals
    let totalWaterJars = 0;
    let totalElectricityUnits = 0;
    let totalMilkPackets = 0;
    let lpgReplacementDates: string[] = [];

    logs.forEach((log: any) => {
      totalWaterJars += Number(log.waterJars) || 0;
      totalElectricityUnits += Number(log.electricityUnits) || 0;
      totalMilkPackets += Number(log.milkPackets) || 0;
      if (log.gasCylinderReplaced) {
        lpgReplacementDates.push(log.date);
      }
    });

    return NextResponse.json({
      success: true,
      logs,
      summary: {
        totalWaterJars,
        totalElectricityUnits,
        totalMilkPackets,
        lpgReplacementDates,
      },
    });
  } catch (error: any) {
    console.error("Utilities GET error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch utilities" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();

    // Check for quick action (e.g. increment jar / milk)
    const { action, date, amount, autoAddExpense } = body;

    if (action === "increment_water" && date) {
      const inc = typeof amount === "number" ? amount : 1;
      const updated = await UtilityLog.findOneAndUpdate(
        { userId: user._id, date },
        { $inc: { waterJars: inc } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      // If user opted to auto-add expense for the jar
      if (autoAddExpense && inc > 0) {
        const budget = await Budget.findOne({
          userId: user._id,
          month: date.substring(0, 7),
        }).lean();
        const jarPrice = budget?.waterJarPrice || 50;
        await Expense.create({
          userId: user._id,
          title: `Drinking Water Jar (${inc}x)`,
          amount: jarPrice * inc,
          type: "expense",
          category: "utilities",
          isEssential: true,
          date,
          paymentMethod: "cash",
          notes: "Auto-logged from water jar tracker",
        });
      }

      return NextResponse.json({
        success: true,
        log: updated,
        message: `Water jar count updated`,
      });
    }

    if (action === "increment_milk" && date) {
      const inc = typeof amount === "number" ? amount : 1;
      const updated = await UtilityLog.findOneAndUpdate(
        { userId: user._id, date },
        { $inc: { milkPackets: inc } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      return NextResponse.json({
        success: true,
        log: updated,
        message: `Milk packet count updated`,
      });
    }

    // Standard upsert with full payload validation
    const parsed = utilityLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: parsed.error.issues[0]?.message || "Validation failed",
        },
        { status: 400 }
      );
    }

    const { date: logDate, ...data } = parsed.data;

    const log = await UtilityLog.findOneAndUpdate(
      { userId: user._id, date: logDate },
      { $set: { ...data, userId: user._id, date: logDate } },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
    );

    // If gas cylinder replaced was checked, also update lastLpgDate in Budget
    if (data.gasCylinderReplaced) {
      await Budget.findOneAndUpdate(
        { userId: user._id, month: logDate.substring(0, 7) },
        { $set: { lastLpgDate: logDate } },
        { upsert: true }
      );
    }

    return NextResponse.json({
      success: true,
      log,
      message: "Daily utility log updated successfully",
    });
  } catch (error: any) {
    console.error("Utilities POST error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update utilities" },
      { status: 500 }
    );
  }
}
