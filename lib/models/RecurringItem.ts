import mongoose, { Schema, Document, Model } from "mongoose";

export interface IRecurringItem extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  type: "milk" | "expense";
  amount: number; // in Nepali Rupees (Rs.)
  unitCount: number; // e.g. 1 packet, 2 packets
  category: string;
  frequency: "daily" | "weekdays";
  active: boolean;
  autoAddExpense: boolean; // whether to create expense record in Rs.
  lastProcessedDate: string; // YYYY-MM-DD
  startDate: string; // YYYY-MM-DD
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RecurringItemSchema = new Schema<IRecurringItem>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [100, "Title cannot exceed 100 characters"],
    },
    type: {
      type: String,
      enum: ["milk", "expense"],
      default: "expense",
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount cannot be negative"],
      default: 0,
    },
    unitCount: {
      type: Number,
      default: 1,
      min: [0, "Unit count cannot be negative"],
    },
    category: {
      type: String,
      default: "groceries",
    },
    frequency: {
      type: String,
      enum: ["daily", "weekdays"],
      default: "daily",
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    autoAddExpense: {
      type: Boolean,
      default: true,
    },
    lastProcessedDate: {
      type: String,
      default: "",
    },
    startDate: {
      type: String,
      required: [true, "Start date is required"],
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

RecurringItemSchema.index({ userId: 1, active: 1 });

export const RecurringItem: Model<IRecurringItem> =
  mongoose.models.RecurringItem ||
  mongoose.model<IRecurringItem>("RecurringItem", RecurringItemSchema);
