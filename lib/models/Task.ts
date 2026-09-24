import mongoose, { Schema, Document, Model } from "mongoose";

export type TaskStatus = "todo" | "in_progress" | "completed" | "cancelled";
export type TaskPriority = "high" | "medium" | "low";

export interface ITask extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string; // YYYY-MM-DD
  estimatedMinutes: number;
  actualMinutes: number;
  goalId?: mongoose.Types.ObjectId;
  habitId?: mongoose.Types.ObjectId;
  scheduledStart?: Date;
  scheduledEnd?: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Task title is required"],
      trim: true,
      maxlength: [150, "Task title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["todo", "in_progress", "completed", "cancelled"],
      default: "todo",
      index: true,
    },
    priority: {
      type: String,
      enum: ["high", "medium", "low"],
      default: "medium",
      index: true,
    },
    dueDate: {
      type: String,
      required: [true, "Due date is required"],
      index: true,
    },
    estimatedMinutes: {
      type: Number,
      default: 30,
      min: [1, "Estimated minutes must be at least 1"],
    },
    actualMinutes: {
      type: Number,
      default: 0,
      min: [0, "Actual minutes cannot be negative"],
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      index: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      index: true,
    },
    scheduledStart: {
      type: Date,
    },
    scheduledEnd: {
      type: Date,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

TaskSchema.index({ userId: 1, status: 1 });
TaskSchema.index({ userId: 1, dueDate: 1 });
TaskSchema.index({ userId: 1, dueDate: 1, priority: -1 });
TaskSchema.index({ userId: 1, priority: 1 });
TaskSchema.index({ userId: 1, goalId: 1 });
TaskSchema.index({ userId: 1, habitId: 1 });

export const Task: Model<ITask> =
  mongoose.models.Task || mongoose.model<ITask>("Task", TaskSchema);
