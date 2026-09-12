import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUserPreferences {
  notifications: {
    habitReminders: boolean;
    dailySummary: boolean;
    streakReminders: boolean;
    goalReminders: boolean;
    focusNotifications: boolean;
  };
  appearance: "light" | "dark" | "system";
  habitPreferences: {
    defaultReminderTime: string;
    weekStartsOn: "monday" | "sunday";
    defaultHabitView: "grid" | "list";
  };
}

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  avatar?: string;
  timezone: string;
  language: string;
  preferences: IUserPreferences;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      maxlength: [100, "Name cannot exceed 100 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,})+$/,
        "Please provide a valid email address",
      ],
    },
    passwordHash: {
      type: String,
      required: [true, "Password hash is required"],
    },
    avatar: {
      type: String,
      default: "",
    },
    timezone: {
      type: String,
      default: "UTC",
    },
    language: {
      type: String,
      default: "en",
    },
    preferences: {
      notifications: {
        habitReminders: { type: Boolean, default: true },
        dailySummary: { type: Boolean, default: true },
        streakReminders: { type: Boolean, default: true },
        goalReminders: { type: Boolean, default: true },
        focusNotifications: { type: Boolean, default: true },
      },
      appearance: {
        type: String,
        enum: ["light", "dark", "system"],
        default: "light",
      },
      habitPreferences: {
        defaultReminderTime: { type: String, default: "08:00" },
        weekStartsOn: { type: String, enum: ["monday", "sunday"], default: "monday" },
        defaultHabitView: { type: String, enum: ["grid", "list"], default: "list" },
      },
    },
    resetPasswordToken: {
      type: String,
    },
    resetPasswordExpires: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent re-compilation in development
export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);
