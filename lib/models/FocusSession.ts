import mongoose, { Schema, Document, Model } from "mongoose";

export type FocusSessionStatus = "completed" | "abandoned";

export interface IFocusSession extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  duration: number; // Duration in minutes
  startedAt: Date;
  completedAt: Date;
  status: FocusSessionStatus;
  habitId?: mongoose.Types.ObjectId;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const FocusSessionSchema = new Schema<IFocusSession>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    duration: {
      type: Number,
      required: [true, "Duration is required"],
      min: [1, "Duration must be at least 1 minute"],
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: {
      type: Date,
      default: Date.now,
    },
    status: {
      type: String,
      enum: ["completed", "abandoned"],
      default: "completed",
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
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

FocusSessionSchema.index({ userId: 1, startedAt: -1 });

export const FocusSession: Model<IFocusSession> =
  mongoose.models.FocusSession ||
  mongoose.model<IFocusSession>("FocusSession", FocusSessionSchema);
