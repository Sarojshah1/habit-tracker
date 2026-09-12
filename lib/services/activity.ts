import { Activity, ActivityType } from "@/lib/models/Activity";
import mongoose from "mongoose";

export async function logActivity({
  userId,
  type,
  entityId,
  entityType,
  metadata = {},
}: {
  userId: string | mongoose.Types.ObjectId;
  type: ActivityType;
  entityId?: string | mongoose.Types.ObjectId;
  entityType?: string;
  metadata?: Record<string, any>;
}) {
  try {
    await Activity.create({
      userId,
      type,
      entityId,
      entityType,
      metadata,
      createdAt: new Date(),
    });
  } catch (error) {
    console.error("Failed to log activity:", error);
  }
}
