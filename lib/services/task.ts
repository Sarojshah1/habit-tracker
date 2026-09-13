import mongoose from "mongoose";
import { Task, ITask, TaskStatus, TaskPriority } from "@/lib/models/Task";
import { Goal } from "@/lib/models/Goal";
import { Habit } from "@/lib/models/Habit";
import { Activity } from "@/lib/models/Activity";
import { logActivity } from "@/lib/services/activity";
import { getUserTodayDateString } from "@/lib/utils/date";

export interface TaskFilterOptions {
  status?: string; // "all", "today", "upcoming", "completed", "todo", "in_progress", "high_priority"
  priority?: string;
  goalId?: string;
  habitId?: string;
  search?: string;
}

export async function createTask(
  userId: string | mongoose.Types.ObjectId,
  data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate: string;
    estimatedMinutes?: number;
    goalId?: string | null;
    habitId?: string | null;
    scheduledStart?: Date | string | null;
    scheduledEnd?: Date | string | null;
  }
) {
  // Validate ownership of linked goal if present
  if (data.goalId) {
    const goal = await Goal.findOne({ _id: data.goalId, userId });
    if (!goal) {
      throw new Error("Unauthorized: The linked goal does not exist or does not belong to you");
    }
  }

  // Validate ownership of linked habit if present
  if (data.habitId) {
    const habit = await Habit.findOne({ _id: data.habitId, userId });
    if (!habit) {
      throw new Error("Unauthorized: The linked habit does not exist or does not belong to you");
    }
  }

  const task = await Task.create({
    ...data,
    userId,
    actualMinutes: 0,
    status: data.status || "todo",
    priority: data.priority || "medium",
    goalId: data.goalId || undefined,
    habitId: data.habitId || undefined,
    scheduledStart: data.scheduledStart ? new Date(data.scheduledStart) : undefined,
    scheduledEnd: data.scheduledEnd ? new Date(data.scheduledEnd) : undefined,
  });

  // If linked to goal, ensure task is registered in goal.taskIds
  if (data.goalId) {
    await Goal.updateOne(
      { _id: data.goalId, userId },
      { $addToSet: { taskIds: task._id } }
    );
  }

  await logActivity({
    userId,
    type: "task_created",
    entityId: task._id,
    entityType: "task",
    metadata: {
      taskTitle: task.title,
      priority: task.priority,
      dueDate: task.dueDate,
    },
  });

  return task;
}

export async function getUserTasks(
  userId: string | mongoose.Types.ObjectId,
  filters: TaskFilterOptions = {},
  timezone: string = "UTC"
) {
  const todayStr = getUserTodayDateString(timezone);
  const query: any = { userId };

  if (filters.goalId) query.goalId = filters.goalId;
  if (filters.habitId) query.habitId = filters.habitId;
  if (filters.priority) query.priority = filters.priority;

  if (filters.status === "today") {
    query.dueDate = todayStr;
    query.status = { $ne: "cancelled" };
  } else if (filters.status === "upcoming") {
    query.dueDate = { $gt: todayStr };
    query.status = { $ne: "cancelled" };
  } else if (filters.status === "completed") {
    query.status = "completed";
  } else if (filters.status === "high_priority") {
    query.priority = "high";
    query.status = { $ne: "completed" };
  } else if (filters.status && filters.status !== "all") {
    query.status = filters.status;
  }

  if (filters.search) {
    const regex = new RegExp(filters.search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
    query.$or = [{ title: regex }, { description: regex }];
  }

  const tasks = await Task.find(query)
    .populate("goalId", "title icon color status")
    .populate("habitId", "name icon color frequency")
    .sort({ dueDate: 1, priority: -1, createdAt: -1 });

  // Counts for UI filters
  const allUserTasks = await Task.find({ userId });
  const counts = {
    all: allUserTasks.filter((t) => t.status !== "cancelled").length,
    today: allUserTasks.filter((t) => t.dueDate === todayStr && t.status !== "cancelled").length,
    upcoming: allUserTasks.filter((t) => t.dueDate > todayStr && t.status !== "cancelled").length,
    completed: allUserTasks.filter((t) => t.status === "completed").length,
    high_priority: allUserTasks.filter((t) => t.priority === "high" && t.status !== "completed").length,
  };

  return { tasks, counts, todayDate: todayStr };
}

export async function getTask(
  userId: string | mongoose.Types.ObjectId,
  taskId: string
) {
  return await Task.findOne({ _id: taskId, userId })
    .populate("goalId", "title icon color status targetValue currentValue unit")
    .populate("habitId", "name icon color frequency");
}

export async function updateTask(
  userId: string | mongoose.Types.ObjectId,
  taskId: string,
  data: any
) {
  if (data.goalId) {
    const goal = await Goal.findOne({ _id: data.goalId, userId });
    if (!goal) throw new Error("Unauthorized: Goal does not belong to you");
  }

  if (data.habitId) {
    const habit = await Habit.findOne({ _id: data.habitId, userId });
    if (!habit) throw new Error("Unauthorized: Habit does not belong to you");
  }

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $set: data },
    { new: true }
  )
    .populate("goalId", "title icon color status")
    .populate("habitId", "name icon color frequency");

  return task;
}

export async function deleteTask(
  userId: string | mongoose.Types.ObjectId,
  taskId: string
) {
  const task = await Task.findOneAndDelete({ _id: taskId, userId });
  if (task && task.goalId) {
    await Goal.updateOne(
      { _id: task.goalId, userId },
      { $pull: { taskIds: task._id } }
    );
  }
  return task;
}

export async function completeTask(
  userId: string | mongoose.Types.ObjectId,
  taskId: string
) {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) return null;

  if (task.status === "completed") {
    return task;
  }

  task.status = "completed";
  task.completedAt = new Date();
  await task.save();

  await logActivity({
    userId,
    type: "task_completed",
    entityId: task._id,
    entityType: "task",
    metadata: {
      taskTitle: task.title,
      actualMinutes: task.actualMinutes,
    },
  });

  return task;
}

export async function cancelTask(
  userId: string | mongoose.Types.ObjectId,
  taskId: string
) {
  const task = await Task.findOne({ _id: taskId, userId });
  if (!task) return null;

  task.status = "cancelled";
  await task.save();

  await logActivity({
    userId,
    type: "task_cancelled",
    entityId: task._id,
    entityType: "task",
    metadata: { taskTitle: task.title },
  });

  return task;
}

/**
 * Idempotently records focus minutes onto task.actualMinutes.
 */
export async function recordTaskFocusMinutes(
  userId: string | mongoose.Types.ObjectId,
  taskId: string,
  minutes: number
) {
  if (minutes <= 0) return;

  const task = await Task.findOneAndUpdate(
    { _id: taskId, userId },
    { $inc: { actualMinutes: minutes } },
    { new: true }
  );

  return task;
}
