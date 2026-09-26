import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBudget extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  month: string; // YYYY-MM
  monthlyLimit: number; // in Rs.
  dailyLimit?: number; // in Rs.
  rentAmount?: number; // in Rs.
  rentDueDate?: number; // Day of month (1-31)
  wifiAmount?: number; // in Rs.
  wifiDueDate?: number; // Day of month (1-31)
  waterJarPrice?: number; // in Rs. (default e.g. 50)
  milkPacketPrice?: number; // in Rs. (default e.g. 55)
  lastLpgDate?: string; // YYYY-MM-DD
  categoryLimits?: Map<string, number>;
  createdAt: Date;
  updatedAt: Date;
}

const BudgetSchema = new Schema<IBudget>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    month: {
      type: String,
      required: [true, "Month is required"],
      match: [/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format"],
      index: true,
    },
    monthlyLimit: {
      type: Number,
      required: [true, "Monthly limit is required"],
      min: [0, "Monthly limit cannot be negative"],
      default: 20000, // default Rs. 20,000
    },
    dailyLimit: {
      type: Number,
      default: 0,
      min: [0, "Daily limit cannot be negative"],
    },
    rentAmount: {
      type: Number,
      default: 0,
      min: [0, "Rent cannot be negative"],
    },
    rentDueDate: {
      type: Number,
      default: 1, // 1st of the month
      min: 1,
      max: 31,
    },
    wifiAmount: {
      type: Number,
      default: 0,
      min: [0, "WiFi amount cannot be negative"],
    },
    wifiDueDate: {
      type: Number,
      default: 15, // 15th of the month
      min: 1,
      max: 31,
    },
    waterJarPrice: {
      type: Number,
      default: 50, // Rs. 50 per jar
      min: 0,
    },
    milkPacketPrice: {
      type: Number,
      default: 55, // Rs. 55 per packet
      min: 0,
    },
    lastLpgDate: {
      type: String,
      default: "",
    },
    categoryLimits: {
      type: Map,
      of: Number,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

BudgetSchema.index({ userId: 1, month: 1 }, { unique: true });

export const Budget: Model<IBudget> =
  mongoose.models.Budget || mongoose.model<IBudget>("Budget", BudgetSchema);
