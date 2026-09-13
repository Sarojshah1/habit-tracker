import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDailyPlan extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  priorityTaskIds: mongoose.Types.ObjectId[];
  focusTargetMinutes: number;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const DailyPlanSchema = new Schema<IDailyPlan>(
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
    priorityTaskIds: [
      {
        type: Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
    focusTargetMinutes: {
      type: Number,
      default: 120,
      min: [1, "Focus target must be at least 1 minute"],
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

DailyPlanSchema.index({ userId: 1, date: 1 }, { unique: true });

export const DailyPlan: Model<IDailyPlan> =
  mongoose.models.DailyPlan ||
  mongoose.model<IDailyPlan>("DailyPlan", DailyPlanSchema);
