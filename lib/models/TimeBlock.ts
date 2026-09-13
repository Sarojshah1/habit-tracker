import mongoose, { Schema, Document, Model } from "mongoose";

export type TimeBlockType = "task" | "habit" | "focus" | "break" | "personal";

export interface ITimeBlock extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  start: Date;
  end: Date;
  type: TimeBlockType;
  taskId?: mongoose.Types.ObjectId;
  habitId?: mongoose.Types.ObjectId;
  goalId?: mongoose.Types.ObjectId;
  notes?: string;
  color?: string;
  createdAt: Date;
  updatedAt: Date;
}

const TimeBlockSchema = new Schema<ITimeBlock>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    start: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end: {
      type: Date,
      required: [true, "End time is required"],
    },
    type: {
      type: String,
      enum: ["task", "habit", "focus", "break", "personal"],
      default: "task",
    },
    taskId: {
      type: Schema.Types.ObjectId,
      ref: "Task",
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
    },
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    color: {
      type: String,
      default: "#2D6A4F",
    },
  },
  {
    timestamps: true,
  }
);

TimeBlockSchema.index({ userId: 1, start: 1 });

export const TimeBlock: Model<ITimeBlock> =
  mongoose.models.TimeBlock ||
  mongoose.model<ITimeBlock>("TimeBlock", TimeBlockSchema);
