import mongoose, { Schema, Document, Model } from "mongoose";

export type GoalStatus = "active" | "completed" | "paused" | "archived" | "cancelled";
export type GoalType = "habit_completion" | "consistency" | "weekly_frequency" | "custom";
export type GoalTrackingMode = "automatic" | "manual";

export interface IGoal extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  description?: string;
  type: GoalType;
  trackingMode: GoalTrackingMode;
  targetValue: number;
  currentValue: number;
  unit: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  status: GoalStatus;
  habitIds: mongoose.Types.ObjectId[];
  associatedHabitIds?: mongoose.Types.ObjectId[]; // Backward compatibility
  taskIds?: mongoose.Types.ObjectId[];
  icon: string;
  color: string;
  completedAt?: Date;
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
    type: {
      type: String,
      enum: ["habit_completion", "consistency", "weekly_frequency", "custom"],
      default: "habit_completion",
    },
    trackingMode: {
      type: String,
      enum: ["automatic", "manual"],
      default: "automatic",
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
      default: "completions",
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
      enum: ["active", "completed", "paused", "archived", "cancelled"],
      default: "active",
    },
    habitIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Habit",
      },
    ],
    associatedHabitIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Habit",
      },
    ],
    taskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    icon: {
      type: String,
      default: "target",
    },
    color: {
      type: String,
      default: "#1B4332",
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Pre-save hook to ensure habitIds and associatedHabitIds stay synchronized
GoalSchema.pre("save", function (next) {
  if (this.habitIds && this.habitIds.length > 0 && (!this.associatedHabitIds || this.associatedHabitIds.length === 0)) {
    this.associatedHabitIds = this.habitIds;
  } else if (this.associatedHabitIds && this.associatedHabitIds.length > 0 && (!this.habitIds || this.habitIds.length === 0)) {
    this.habitIds = this.associatedHabitIds;
  }
  next();
});

GoalSchema.index({ userId: 1, status: 1 });
GoalSchema.index({ userId: 1, endDate: 1 });
GoalSchema.index({ userId: 1, habitIds: 1 });

export const Goal: Model<IGoal> =
  mongoose.models.Goal || mongoose.model<IGoal>("Goal", GoalSchema);
