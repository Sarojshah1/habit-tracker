import { NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectToDatabase } from "@/lib/db/mongodb";

export const dynamic = "force-dynamic";

export async function GET() {
  const hasMongoUri = Boolean(process.env.MONGODB_URI);
  const hasAuthSecret = Boolean(process.env.AUTH_SECRET);

  let dbStatus = "disconnected";
  let dbError: string | null = null;

  if (hasMongoUri) {
    try {
      await connectToDatabase();
      dbStatus = mongoose.connection.readyState === 1 ? "connected" : "connecting";
    } catch (err: any) {
      dbStatus = "error";
      dbError = err?.message || String(err);
    }
  }

  const isHealthy = hasMongoUri && hasAuthSecret && dbStatus === "connected";

  return NextResponse.json(
    {
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: {
        hasMongoUri,
        hasAuthSecret,
        nodeEnv: process.env.NODE_ENV,
      },
      database: {
        status: dbStatus,
        error: dbError,
        hint:
          dbStatus !== "connected"
            ? "Ensure MONGODB_URI and AUTH_SECRET are set in Vercel settings, and MongoDB Atlas Network Access allows 0.0.0.0/0."
            : undefined,
      },
    },
    { status: isHealthy ? 200 : 503 }
  );
}
