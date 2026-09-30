import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Goal } from "@/lib/models/Goal";
import { ExamTarget } from "@/lib/models/ExamTarget";
import { MockExam } from "@/lib/models/MockExam";
import { Expense } from "@/lib/models/Expense";
import { UtilityLog } from "@/lib/models/UtilityLog";
import { Budget } from "@/lib/models/Budget";
import { getUserTodayDateString, getUserDayOfWeek } from "@/lib/utils/date";
import { isHabitScheduledForDate } from "@/lib/services/streak";
import { syncRecurringItemsForUser } from "@/lib/services/recurring";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const timezone = user.timezone || "Asia/Kathmandu";
    const todayDateStr = getUserTodayDateString(timezone);

    // Auto-sync daily recurring transactions (like milk or subscriptions)
    await syncRecurringItemsForUser(user._id, timezone);

    const url = new URL(req.url);
    const yearParam = url.searchParams.get("year");
    const monthParam = url.searchParams.get("month");

    const [todayYear, todayMonth] = todayDateStr.split("-").map(Number);
    const year = yearParam ? parseInt(yearParam, 10) : todayYear;
    const month = monthParam ? parseInt(monthParam, 10) : todayMonth; // 1-12

    const monthStr = String(month).padStart(2, "0");
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${String(daysInMonth).padStart(2, "0")}`;

    // Fetch calendar data concurrently with lean()
    const [
      habits,
      completions,
      examTargets,
      mockExams,
      activeGoals,
      expenses,
      utilityLogs,
      budget,
    ] = await Promise.all([
      Habit.find({
        userId: user._id,
        startDate: { $lte: endDate },
      }).lean(),
      HabitCompletion.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      })
        .select("habitId date status notes completionType")
        .lean(),
      ExamTarget.find({
        userId: user._id,
        examDate: { $gte: startDate, $lte: endDate },
      }).lean(),
      MockExam.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean(),
      Goal.find({
        userId: user._id,
        status: { $in: ["active", "completed"] },
        startDate: { $lte: endDate },
        endDate: { $gte: startDate },
      })
        .select("title icon color habitIds associatedHabitIds startDate endDate")
        .lean(),
      Expense.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean(),
      UtilityLog.find({
        userId: user._id,
        date: { $gte: startDate, $lte: endDate },
      }).lean(),
      Budget.findOne({
        userId: user._id,
        month: `${year}-${monthStr}`,
      }).lean(),
    ]);

    // Map completions by date -> habitId -> status
    const completionByDateAndHabit = new Map<
      string,
      Map<string, { status: string; notes?: string; completionType?: string }>
    >();
    completions.forEach((c: any) => {
      if (!completionByDateAndHabit.has(c.date)) {
        completionByDateAndHabit.set(c.date, new Map());
      }
      completionByDateAndHabit.get(c.date)!.set(c.habitId.toString(), {
        status: c.status,
        notes: c.notes,
        completionType: c.completionType,
      });
    });

    // Map expenses by date
    const expensesByDate = new Map<string, any[]>();
    expenses.forEach((e: any) => {
      const arr = expensesByDate.get(e.date) || [];
      arr.push(e);
      expensesByDate.set(e.date, arr);
    });

    // Map utilities by date
    const utilitiesByDate = new Map<string, any>();
    utilityLogs.forEach((u: any) => {
      utilitiesByDate.set(u.date, u);
    });

    // Generate days data
    const days = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${monthStr}-${String(d).padStart(2, "0")}`;
      const dayHabitMap = completionByDateAndHabit.get(dateStr) || new Map();

      // Find all habits scheduled for this day
      const scheduledHabits = habits
        .filter((h) => !h.archived && isHabitScheduledForDate(h, dateStr, timezone))
        .map((h) => {
          const completionInfo = dayHabitMap.get(h._id.toString());
          const status = completionInfo
            ? completionInfo.status
            : dateStr < todayDateStr
            ? "missed"
            : "pending";

          // Find active goals that this habit contributes to on this date
          const contributingGoals = activeGoals
            .filter((g) => {
              const ids = (
                g.habitIds && g.habitIds.length > 0 ? g.habitIds : g.associatedHabitIds || []
              ).map((id: any) => id.toString());
              return ids.includes(h._id.toString()) && dateStr >= g.startDate && dateStr <= g.endDate;
            })
            .map((g) => ({
              id: g._id.toString(),
              title: g.title,
              icon: g.icon,
              color: g.color,
            }));

          return {
            _id: h._id,
            name: h.name,
            icon: h.icon,
            color: h.color,
            schedule: h.schedule,
            frequency: h.frequency,
            status,
            notes: completionInfo ? completionInfo.notes : "",
            completionType: completionInfo ? completionInfo.completionType : undefined,
            contributingGoals,
          };
        });

      const totalScheduled = scheduledHabits.length;
      const completedCount = scheduledHabits.filter((h) => h.status === "completed").length;
      const frozenCount = scheduledHabits.filter((h) => h.status === "frozen").length;
      const isDayFrozen = frozenCount > 0 || (user.streakFreezes?.usedDates || []).includes(dateStr);
      const skippedCount = scheduledHabits.filter((h) => h.status === "skipped").length;
      const missedCount = scheduledHabits.filter((h) => h.status === "missed").length;
      const pendingCount = scheduledHabits.filter((h) => h.status === "pending").length;

      let indicator: "completed" | "partial" | "missed" | "no_activity" = "no_activity";
      if (totalScheduled > 0) {
        if (completedCount === totalScheduled) {
          indicator = "completed";
        } else if (completedCount > 0) {
          indicator = "partial";
        } else if (isDayFrozen) {
          indicator = "partial"; // Protected by streak freeze
        } else if (dateStr < todayDateStr) {
          indicator = "missed";
        }
      }

      const completionPercentage =
        totalScheduled > 0
          ? Math.min(100, Math.round(((completedCount + (isDayFrozen ? totalScheduled : 0)) / totalScheduled) * 100))
          : 0;
      const dayExams = examTargets.filter((t) => t.examDate === dateStr);
      const dayMockExams = mockExams.filter((m) => m.date === dateStr);

      // Financial & Household Utility metrics for this day
      const dayExpenses = expensesByDate.get(dateStr) || [];
      const dayUtility = utilitiesByDate.get(dateStr);

      const totalExpense = dayExpenses
        .filter((e) => e.type === "expense")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const totalIncome = dayExpenses
        .filter((e) => e.type === "income")
        .reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const waterJars = dayUtility ? Number(dayUtility.waterJars || 0) : 0;
      const electricityUnits = dayUtility ? Number(dayUtility.electricityUnits || 0) : 0;
      const milkPackets = dayUtility ? Number(dayUtility.milkPackets || 0) : 0;
      const gasCylinderReplaced = dayUtility ? Boolean(dayUtility.gasCylinderReplaced) : false;

      const isRentDue = budget?.rentDueDate === d && (budget?.rentAmount || 0) > 0;
      const isWifiDue = budget?.wifiDueDate === d && (budget?.wifiAmount || 0) > 0;
      const isNoSpendDay = dateStr <= todayDateStr && totalExpense === 0;

      days.push({
        date: dateStr,
        dayNumber: d,
        dayOfWeek: getUserDayOfWeek(dateStr, timezone),
        isToday: dateStr === todayDateStr,
        isPast: dateStr < todayDateStr,
        isFuture: dateStr > todayDateStr,
        indicator,
        completionPercentage,
        totalScheduled,
        completedCount,
        skippedCount,
        missedCount,
        pendingCount,
        habits: scheduledHabits,
        exams: dayExams,
        mockExams: dayMockExams,
        // New Household & Expense Fields
        totalExpense,
        totalIncome,
        isNoSpendDay,
        waterJars,
        electricityUnits,
        milkPackets,
        gasCylinderReplaced,
        isRentDue,
        rentAmount: isRentDue ? budget?.rentAmount : 0,
        isWifiDue,
        wifiAmount: isWifiDue ? budget?.wifiAmount : 0,
        expenses: dayExpenses,
      });
    }

    const totalExpenseMonth = expenses
      .filter((e) => e.type === "expense")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalIncomeMonth = expenses
      .filter((e) => e.type === "income")
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const totalWaterJars = utilityLogs.reduce(
      (sum, u) => sum + Number(u.waterJars || 0),
      0
    );

    const totalElectricityUnits = utilityLogs.reduce(
      (sum, u) => sum + Number(u.electricityUnits || 0),
      0
    );

    const totalMilkPackets = utilityLogs.reduce(
      (sum, u) => sum + Number(u.milkPackets || 0),
      0
    );

    return NextResponse.json({
      success: true,
      calendar: {
        year,
        month,
        todayDate: todayDateStr,
        days,
        householdSummary: {
          totalExpenseMonth,
          totalIncomeMonth,
          totalWaterJars,
          totalElectricityUnits,
          totalMilkPackets,
          rentAmount: budget?.rentAmount || 0,
          rentDueDate: budget?.rentDueDate || 1,
          wifiAmount: budget?.wifiAmount || 0,
          wifiDueDate: budget?.wifiDueDate || 15,
          monthlyLimit: budget?.monthlyLimit || 20000,
        },
      },
    });
  } catch (error) {
    console.error("GET /api/calendar error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load calendar data" },
      { status: 500 }
    );
  }
}
