import mongoose, { Schema, Document, Model } from "mongoose";

export type CompletionStatus = "completed" | "skipped" | "missed" | "frozen";

export interface IHabitCompletion extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  habitId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  completedAt: Date;
  status: CompletionStatus;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const HabitCompletionSchema = new Schema<IHabitCompletion>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: [true, "Habit ID is required"],
      index: true,
    },
    date: {
      type: String, // Stored as YYYY-MM-DD in user's timezone
      required: [true, "Date is required"],
      index: true,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["completed", "skipped", "missed", "frozen"],
      default: "completed",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index to guarantee no duplicate completions for the same habit on the same date
HabitCompletionSchema.index({ userId: 1, habitId: 1, date: 1 }, { unique: true });
HabitCompletionSchema.index({ userId: 1, date: 1 });

export const HabitCompletion: Model<IHabitCompletion> =
  mongoose.models.HabitCompletion ||
  mongoose.model<IHabitCompletion>("HabitCompletion", HabitCompletionSchema);
