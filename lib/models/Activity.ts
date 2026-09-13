import mongoose, { Schema, Document, Model } from "mongoose";

export type ActivityType =
  | "habit_completed"
  | "habit_skipped"
  | "habit_created"
  | "habit_updated"
  | "habit_archived"
  | "goal_created"
  | "goal_completed"
  | "goal_paused"
  | "task_created"
  | "task_completed"
  | "task_cancelled"
  | "focus_session_completed"
  | "focus_completed"
  | "daily_plan_created"
  | "daily_review_completed"
  | "note_created"
  | "note_updated";

export interface IActivity extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: ActivityType;
  entityId?: mongoose.Types.ObjectId;
  entityType?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    type: {
      type: String,
      required: [true, "Activity type is required"],
    },
    entityId: {
      type: Schema.Types.ObjectId,
    },
    entityType: {
      type: String,
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    createdAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
  }
);

ActivitySchema.index({ userId: 1, createdAt: -1 });

export const Activity: Model<IActivity> =
  mongoose.models.Activity ||
  mongoose.model<IActivity>("Activity", ActivitySchema);
