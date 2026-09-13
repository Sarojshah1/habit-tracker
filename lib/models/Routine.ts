import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRoutineTemplateItem {
  name: string;
  type: "habit" | "task";
  description?: string;
  icon?: string;
  color?: string;
  estimatedMinutes?: number;
  priority?: "high" | "medium" | "low";
}

export interface IRoutine extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  habitIds: mongoose.Types.ObjectId[];
  taskIds: mongoose.Types.ObjectId[];
  items?: IRoutineTemplateItem[];
  isTemplate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema = new Schema<IRoutine>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    name: {
      type: String,
      required: [true, "Routine name is required"],
      trim: true,
      maxlength: [120, "Routine name cannot exceed 120 characters"],
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    habitIds: [
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
    items: [
      {
        name: { type: String, required: true },
        type: { type: String, enum: ["habit", "task"], required: true },
        description: { type: String, default: "" },
        icon: { type: String, default: "check-circle" },
        color: { type: String, default: "#2D6A4F" },
        estimatedMinutes: { type: Number, default: 30 },
        priority: { type: String, enum: ["high", "medium", "low"], default: "medium" },
      },
    ],
    isTemplate: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

RoutineSchema.index({ userId: 1 });

export const Routine: Model<IRoutine> =
  mongoose.models.Routine || mongoose.model<IRoutine>("Routine", RoutineSchema);
