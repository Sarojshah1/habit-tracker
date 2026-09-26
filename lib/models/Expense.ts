import mongoose, { Schema, Document, Model } from "mongoose";

export type ExpenseType = "expense" | "income";
export type ExpenseCategory =
  | "food_khaja"
  | "groceries"
  | "rent"
  | "utilities"
  | "college_books"
  | "transport"
  | "entertainment"
  | "shopping"
  | "health"
  | "bills"
  | "other";

export type PaymentMethod = "fonepay_esewa" | "cash" | "bank" | "card" | "other";

export interface IExpense extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  title: string;
  amount: number; // in Nepali Rupees (Rs.)
  type: ExpenseType;
  category: ExpenseCategory;
  isEssential: boolean; // true = needs, false = wants/discretionary
  date: string; // YYYY-MM-DD
  paymentMethod: PaymentMethod;
  habitId?: mongoose.Types.ObjectId;
  splitWith?: string; // Roommate or friend's name
  splitAmount?: number; // Amount owed/split in Rs.
  splitStatus?: "pending" | "settled";
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ExpenseSchema = new Schema<IExpense>(
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
      maxlength: [150, "Title cannot exceed 150 characters"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0.01, "Amount must be greater than zero"],
    },
    type: {
      type: String,
      enum: ["expense", "income"],
      default: "expense",
      index: true,
    },
    category: {
      type: String,
      enum: [
        "food_khaja",
        "groceries",
        "rent",
        "utilities",
        "college_books",
        "transport",
        "entertainment",
        "shopping",
        "health",
        "bills",
        "other",
      ],
      default: "food_khaja",
      index: true,
    },
    isEssential: {
      type: Boolean,
      default: false,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      index: true,
    },
    paymentMethod: {
      type: String,
      enum: ["fonepay_esewa", "cash", "bank", "card", "other"],
      default: "fonepay_esewa",
    },
    habitId: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: false,
    },
    splitWith: {
      type: String,
      trim: true,
      default: "",
    },
    splitAmount: {
      type: Number,
      default: 0,
      min: [0, "Split amount cannot be negative"],
    },
    splitStatus: {
      type: String,
      enum: ["pending", "settled"],
      default: "pending",
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [500, "Notes cannot exceed 500 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying user expenses by date range efficiently
ExpenseSchema.index({ userId: 1, date: -1 });
ExpenseSchema.index({ userId: 1, category: 1 });

export const Expense: Model<IExpense> =
  mongoose.models.Expense || mongoose.model<IExpense>("Expense", ExpenseSchema);
