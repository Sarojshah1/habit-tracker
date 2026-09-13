import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyReview extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  wins: string;
  improvements: string;
  noteId?: mongoose.Types.ObjectId;
  metrics?: {
    habitsCompleted?: number;
    habitsTotal?: number;
    tasksCompleted?: number;
    tasksTotal?: number;
    focusMinutes?: number;
    productivityScore?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const DailyReviewSchema = new Schema<IDailyReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    date: {
      type: String,
      required: [true, "Date is required"],
    },
    wins: {
      type: String,
      trim: true,
      default: "",
    },
    improvements: {
      type: String,
      trim: true,
      default: "",
    },
    noteId: {
      type: Schema.Types.ObjectId,
      ref: "Note",
    },
    metrics: {
      type: Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

DailyReviewSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyReview: Model<IDailyReview> =
  mongoose.models.DailyReview ||
  mongoose.model<IDailyReview>("DailyReview", DailyReviewSchema);
