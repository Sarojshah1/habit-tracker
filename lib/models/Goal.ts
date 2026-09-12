import mongoose, { Schema, Document, Model } from "mongoose";

export type GoalStatus = "active" | "completed" | "paused" | "cancelled";

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: GoalStatus;
  associatedHabitIds: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const GoalSchema = new Schema<IGoal>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Goal title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    targetValue: {
      type: Number,
      required: [true, "Target value is required"],
      min: [1, "Target value must be at least 1"],
    },
    currentValue: {
      type: Number,
      default: 0,
      min: [0, "Current value cannot be negative"],
    },
    unit: {
      type: String,
      default: "days",
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    endDate: {
      type: String,
      required: [true, "End date is required"],
    },
    status: {
      type: String,
      enum: ["active", "completed", "paused", "cancelled"],
      default: "active",
    },
    associatedHabitIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Habit",
      },
    ],
  },
  {
    timestamps: true,
  }
);

GoalSchema.index({ userId: 1, status: 1 });

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
