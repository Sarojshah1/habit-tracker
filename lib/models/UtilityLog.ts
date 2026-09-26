import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUtilityLog extends Document {
  _id: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  waterJars: number; // 20L drinking water jars count brought on this day (e.g. 1, 2)
  electricityUnits: number; // Daily electricity meter units (kWh) consumed
  milkPackets: number; // Daily dairy milk packets taken (e.g. 1, 2)
  gasCylinderReplaced: boolean; // True if LPG cylinder was changed on this date
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UtilityLogSchema = new Schema<IUtilityLog>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    date: {
      type: String,
      required: [true, "Date is required"],
      match: [/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"],
      index: true,
    },
    waterJars: {
      type: Number,
      default: 0,
      min: [0, "Water jars cannot be negative"],
    },
    electricityUnits: {
      type: Number,
      default: 0,
      min: [0, "Electricity units cannot be negative"],
    },
    milkPackets: {
      type: Number,
      default: 0,
      min: [0, "Milk packets cannot be negative"],
    },
    gasCylinderReplaced: {
      type: Boolean,
      default: false,
    },
    notes: {
      type: String,
      trim: true,
      default: "",
      maxlength: [300, "Notes cannot exceed 300 characters"],
    },
  },
  {
    timestamps: true,
  }
);

// One utility log record per user per day
UtilityLogSchema.index({ userId: 1, date: 1 }, { unique: true });

export const UtilityLog: Model<IUtilityLog> =
  mongoose.models.UtilityLog || mongoose.model<IUtilityLog>("UtilityLog", UtilityLogSchema);
