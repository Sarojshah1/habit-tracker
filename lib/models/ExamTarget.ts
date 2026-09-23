import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISyllabusTopic {
  _id?: mongoose.Types.ObjectId;
  name: string; // e.g. "Thermodynamics & Heat Transfer"
  completed: boolean;
  confidence?: "low" | "medium" | "high";
  notes?: string;
}

export interface ISyllabusChapter {
  _id?: mongoose.Types.ObjectId;
  title: string; // e.g. "Unit 1: Classical Mechanics"
  topics: ISyllabusTopic[];
}

export interface IExamTarget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string; // e.g. "AP Physics 1 Final Exam" or "USMLE Step 1"
  subject: string; // e.g. "Physics"
  examDate: string; // YYYY-MM-DD
  targetScore?: number; // e.g. 90
  color: string; // e.g. "#1B4332"
  syllabus: ISyllabusChapter[];
  totalTopics: number;
  completedTopics: number;
  syllabusProgress: number; // 0 to 100%
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const SyllabusTopicSchema = new Schema<ISyllabusTopic>({
  name: { type: String, required: true, trim: true },
  completed: { type: Boolean, default: false },
  confidence: { type: String, enum: ["low", "medium", "high"], default: "medium" },
  notes: { type: String, default: "" },
});

const SyllabusChapterSchema = new Schema<ISyllabusChapter>({
  title: { type: String, required: true, trim: true },
  topics: [SyllabusTopicSchema],
});

const ExamTargetSchema = new Schema<IExamTarget>(
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
    examDate: {
      type: String,
      required: [true, "Exam date is required"],
      index: true,
    },
    targetScore: {
      type: Number,
      default: 90,
    },
    color: {
      type: String,
      default: "#1B4332",
    },
    syllabus: [SyllabusChapterSchema],
    totalTopics: {
      type: Number,
      default: 0,
    },
    completedTopics: {
      type: Number,
      default: 0,
    },
    syllabusProgress: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  {
    timestamps: true,
  }
);

ExamTargetSchema.index({ userId: 1, examDate: 1 });

export const ExamTarget: Model<IExamTarget> =
  mongoose.models.ExamTarget || mongoose.model<IExamTarget>("ExamTarget", ExamTargetSchema);
