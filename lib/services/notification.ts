import mongoose from "mongoose";
import { Notification, NotificationType } from "@/lib/models/Notification";
import { User } from "@/lib/models/User";

export async function createNotification({
  userId,
  type,
  title,
  message,
  entityId,
  entityType,
}: {
  userId: string | mongoose.Types.ObjectId;
  type: NotificationType;
  title: string;
  message: string;
  entityId?: string | mongoose.Types.ObjectId;
  entityType?: string;
}) {
  try {
    // Check user preference
    const user = await User.findById(userId).select("preferences");
    if (user?.preferences?.notifications) {
      const notifs = user.preferences.notifications;
      if (type === "habit_reminder" && notifs.habitReminders === false) return null;
      if (type === "task_due" && notifs.taskReminders === false) return null;
      if (type === "goal_deadline" && notifs.goalReminders === false) return null;
      if (type === "goal_completed" && notifs.goalReminders === false) return null;
      if (type === "focus_completed" && notifs.focusNotifications === false) return null;
      if (type === "daily_review" && notifs.dailyReview === false) return null;
      if (type === "weekly_review" && notifs.weeklyReview === false) return null;
    }

    // Check if duplicate notification already created today
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const existing = await Notification.findOne({
      userId,
      type,
      title,
      createdAt: { $gte: oneDayAgo },
    });

    if (existing) {
      return existing; // Prevent spamming same alert in 24h
    }

    return await Notification.create({
      userId,
      type,
      title,
      message,
      entityId,
      entityType,
      read: false,
      createdAt: new Date(),
    });
  } catch (err) {
    console.error("Failed to create notification:", err);
    return null;
  }
}

export async function syncUserNotifications(user: any) {
  try {
    const { Habit } = await import("@/lib/models/Habit");
    const { HabitCompletion } = await import("@/lib/models/HabitCompletion");
    const { Task } = await import("@/lib/models/Task");
    const { DailyReview } = await import("@/lib/models/DailyReview");
    const { getUserTodayDateString } = await import("@/lib/utils/date");
    const { isHabitScheduledForDate } = await import("@/lib/services/streak");

    const timezone = user.timezone || "UTC";
    const todayDateStr = getUserTodayDateString(timezone);

    const notifs = user.preferences?.notifications || {};

    // 1. Check pending habits for today
    if (notifs.habitReminders !== false) {
      const activeHabits = await Habit.find({ userId: user._id, status: "active" });
      const scheduledHabits = activeHabits.filter((h) =>
        isHabitScheduledForDate(h, todayDateStr, timezone)
      );

      if (scheduledHabits.length > 0) {
        const completedCount = await HabitCompletion.countDocuments({
          userId: user._id,
          date: todayDateStr,
          status: "completed",
        });

        const pendingCount = scheduledHabits.length - completedCount;
        if (pendingCount > 0) {
          await createNotification({
            userId: user._id,
            type: "habit_reminder",
            title: "Daily Habit Reminder",
            message: `You have ${pendingCount} habit${pendingCount > 1 ? "s" : ""} scheduled for today waiting for completion.`,
          });
        }
      }
    }

    // 2. Check tasks due today
    if (notifs.taskReminders !== false) {
      const dueTasksCount = await Task.countDocuments({
        userId: user._id,
        dueDate: todayDateStr,
        status: { $in: ["todo", "in_progress"] },
      });

      if (dueTasksCount > 0) {
        await createNotification({
          userId: user._id,
          type: "task_due",
          title: "Tasks Due Today",
          message: `You have ${dueTasksCount} task${dueTasksCount > 1 ? "s" : ""} scheduled for today. Check your plan!`,
        });
      }
    }

    // 3. Evening daily review reminder (after 18:00 user local time)
    if (notifs.dailyReview !== false) {
      try {
        const now = new Date();
        const localHour = parseInt(
          new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hour12: false,
            timeZone: timezone,
          }).format(now),
          10
        );

        if (localHour >= 18) {
          const review = await DailyReview.findOne({ userId: user._id, date: todayDateStr });
          if (!review) {
            await createNotification({
              userId: user._id,
              type: "daily_review",
              title: "🌙 Evening Daily Review",
              message: "It's time to log your evening reflection, review your wins, and plan ahead.",
            });
          }
        }
      } catch (e) {
        // Fallback or ignore timezone formatting errors
      }
    }
  } catch (err) {
    console.error("Error in syncUserNotifications:", err);
  }
}
