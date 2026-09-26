import mongoose from "mongoose";
import { RecurringItem, IRecurringItem } from "@/lib/models/RecurringItem";
import { UtilityLog } from "@/lib/models/UtilityLog";
import { Expense } from "@/lib/models/Expense";
import { getUserTodayDateString, getUserDayOfWeek } from "@/lib/utils/date";

/**
 * Synchronizes and auto-logs all active daily recurring items (e.g. Milk, Subscriptions)
 * for a user up to today's date.
 */
export async function syncRecurringItemsForUser(
  userId: mongoose.Types.ObjectId | string,
  timezone: string = "Asia/Kathmandu"
): Promise<{ processedCount: number }> {
  try {
    const todayDateStr = getUserTodayDateString(timezone);

    const activeItems = await RecurringItem.find({
      userId,
      active: true,
    });

    if (!activeItems || activeItems.length === 0) {
      return { processedCount: 0 };
    }

    let processedCount = 0;

    for (const item of activeItems) {
      // Determine the start date for this processing run
      let runFromDateStr = item.lastProcessedDate;

      if (!runFromDateStr) {
        runFromDateStr = item.startDate || todayDateStr;
      } else {
        // Increment by 1 day from lastProcessedDate
        const lastDate = new Date(runFromDateStr);
        lastDate.setDate(lastDate.getDate() + 1);
        runFromDateStr = lastDate.toISOString().split("T")[0];
      }

      // If runFromDateStr is already past today, nothing to do
      if (runFromDateStr > todayDateStr) {
        continue;
      }

      // Limit backfilling to at most 31 days to keep queries fast and bounded
      const startDateObj = new Date(runFromDateStr);
      const todayDateObj = new Date(todayDateStr);
      const diffTime = todayDateObj.getTime() - startDateObj.getTime();
      const diffDays = Math.min(31, Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1);

      for (let i = 0; i < diffDays; i++) {
        const curDate = new Date(startDateObj);
        curDate.setDate(curDate.getDate() + i);
        const curDateStr = curDate.toISOString().split("T")[0];

        if (curDateStr > todayDateStr) break;

        // Check frequency: weekdays only
        if (item.frequency === "weekdays") {
          const dow = getUserDayOfWeek(curDateStr, timezone); // 0 = Sunday, 6 = Saturday
          if (dow === 0 || dow === 6) {
            continue; // Skip weekends
          }
        }

        // Process Milk
        if (item.type === "milk") {
          // 1. Ensure UtilityLog has milkPackets
          const existingUtil = await UtilityLog.findOne({ userId, date: curDateStr });
          if (!existingUtil || !existingUtil.milkPackets) {
            await UtilityLog.findOneAndUpdate(
              { userId, date: curDateStr },
              { $set: { milkPackets: item.unitCount || 1, userId, date: curDateStr } },
              { upsert: true, setDefaultsOnInsert: true }
            );
          }

          // 2. If autoAddExpense, ensure Expense record exists
          if (item.autoAddExpense && item.amount > 0) {
            const existingExp = await Expense.findOne({
              userId,
              date: curDateStr,
              title: item.title,
            });

            if (!existingExp) {
              await Expense.create({
                userId,
                title: item.title,
                amount: item.amount,
                type: "expense",
                category: "groceries",
                isEssential: true,
                date: curDateStr,
                paymentMethod: "cash",
                notes: "Auto-logged daily milk subscription",
              });
              processedCount++;
            }
          }
        }

        // Process generic daily expense (e.g. Newspaper, Commute, Mess)
        if (item.type === "expense" && item.amount > 0) {
          const existingExp = await Expense.findOne({
            userId,
            date: curDateStr,
            title: item.title,
          });

          if (!existingExp) {
            await Expense.create({
              userId,
              title: item.title,
              amount: item.amount,
              type: "expense",
              category: item.category || "other",
              isEssential: true,
              date: curDateStr,
              paymentMethod: "cash",
              notes: "Auto-logged daily subscription",
            });
            processedCount++;
          }
        }
      }

      // Update last processed date
      item.lastProcessedDate = todayDateStr;
      await item.save();
    }

    return { processedCount };
  } catch (error) {
    console.error("syncRecurringItemsForUser error:", error);
    return { processedCount: 0 };
  }
}
