import mongoose from "mongoose";

// Import all models to guarantee Mongoose schema registration in serverless lambdas
import "@/lib/models/User";
import "@/lib/models/Habit";
import "@/lib/models/HabitCompletion";
import "@/lib/models/Goal";
import "@/lib/models/FocusSession";
import "@/lib/models/Note";
import "@/lib/models/Activity";
import "@/lib/models/Task";
import "@/lib/models/TimeBlock";
import "@/lib/models/DailyPlan";
import "@/lib/models/DailyReview";
import "@/lib/models/Routine";
import "@/lib/models/Notification";
import "@/lib/models/ExamTarget";
import "@/lib/models/MockExam";
import "@/lib/models/Flashcard";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

let cached = global.mongooseCache;

if (!cached) {
  cached = global.mongooseCache = { conn: null, promise: null };
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached!.conn && mongoose.connection.readyState === 1) {
    return cached!.conn;
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("CRITICAL: MONGODB_URI is not defined in environment variables");
    throw new Error("MONGODB_URI environment variable is missing. Please configure it in Vercel Project Settings.");
  }

  if (!cached!.promise || mongoose.connection.readyState === 0) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 20,
      minPoolSize: 2,
      serverSelectionTimeoutMS: 5000,
    };

    cached!.promise = mongoose.connect(uri, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached!.conn = await cached!.promise;
  } catch (e: any) {
    cached!.promise = null;
    console.error("MongoDB Connection Failed:", e.message || e);
    throw e;
  }

  return cached!.conn;
}
