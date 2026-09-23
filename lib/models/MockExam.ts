import mongoose, { Schema, Document, Model } from "mongoose";

export interface IMockExam extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string; // e.g. "Physics Paper 1 (Mechanics)"
  subject: string; // e.g. "Physics", "Mathematics", "Chemistry"
  score: number; // e.g. 84
  totalMarks: number; // e.g. 100
  percentage: number; // e.g. 84.0
  date: string; // YYYY-MM-DD
  durationMinutes?: number; // e.g. 120
  weakTopics?: string[]; // e.g. ["Rotational Dynamics", "Fluids"]
  notes?: string;
  focusSessionId?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const MockExamSchema = new Schema<IMockExam>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Exam title is required"],
      trim: true,
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    subject: {
      type: String,
      required: [true, "Subject is required"],
      trim: true,
      maxlength: [100, "Subject cannot exceed 100 characters"],
      index: true,
    },
    score: {
      type: Number,
      required: [true, "Score is required"],
      min: [0, "Score cannot be negative"],
    },
    totalMarks: {
      type: Number,
      required: [true, "Total marks is required"],
      min: [1, "Total marks must be at least 1"],
      default: 100,
    },
    percentage: {
      type: Number,
      required: true,
    },
    date: {
      type: String,
      required: [true, "Exam date is required"],
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 60,
    },
    weakTopics: {
      type: [String],
      default: [],
    },
    notes: {
      type: String,
      trim: true,
      default: "",
    },
    focusSessionId: {
      type: Schema.Types.ObjectId,
      ref: "FocusSession",
    },
  },
  {
    timestamps: true,
  }
);

MockExamSchema.index({ userId: 1, date: -1 });
MockExamSchema.index({ userId: 1, subject: 1 });

export const MockExam: Model<IMockExam> =
  mongoose.models.MockExam || mongoose.model<IMockExam>("MockExam", MockExamSchema);
