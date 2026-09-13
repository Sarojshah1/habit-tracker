import mongoose, { Schema, Document, Model } from "mongoose";

export type HabitFrequency = "daily" | "weekly" | "specific_days" | "times_per_week" | "custom";

export interface IHabitSchedule {
  time?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  timesPerWeek?: number;
}

export interface IHabit extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  icon: string;
  color: string;
  frequency: HabitFrequency;
  schedule: IHabitSchedule;
  reminder?: string;
  startDate: string; // YYYY-MM-DD
  habitStackAfterHabitId?: mongoose.Types.ObjectId;
  archived: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const HabitSchema = new Schema<IHabit>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    name: {
      type: String,
      required: [true, "Habit name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      default: "check-circle",
    },
    color: {
      type: String,
      default: "#2D6A4F",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "specific_days", "times_per_week", "custom"],
      default: "daily",
    },
    schedule: {
      time: { type: String, default: "08:00" },
      daysOfWeek: { type: [Number], default: [0, 1, 2, 3, 4, 5, 6] },
      timesPerWeek: { type: Number, default: 7 },
    },
    reminder: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
    },
    habitStackAfterHabitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
    },
    archived: {
      type: Boolean,
      default: false,
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

HabitSchema.index({ userId: 1, active: 1 });
HabitSchema.index({ userId: 1, archived: 1 });

export const Habit: Model<IHabit> =
  mongoose.models.Habit || mongoose.model<IHabit>("Habit", HabitSchema);
