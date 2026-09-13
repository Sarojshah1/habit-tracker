import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { Routine } from "@/lib/models/Routine";

export const dynamic = "force-dynamic";

const SYSTEM_ROUTINE_PRESETS = [
  {
    name: "Morning Study Routine",
    description: "Start the day with deep focus, revision, and clear planning.",
    isTemplate: true,
    items: [
      { name: "Review flashcards & key concepts", type: "task", estimatedMinutes: 20, priority: "high" },
      { name: "Deep work study session", type: "habit", icon: "book-open", color: "#1B4332" },
      { name: "Plan top 3 daily priorities", type: "task", estimatedMinutes: 10, priority: "medium" },
    ],
  },
  {
    name: "Exam Preparation Routine",
    description: "Intensive exam mastery cycle with spaced repetition and practice sets.",
    isTemplate: true,
    items: [
      { name: "Solve past paper questions", type: "task", estimatedMinutes: 60, priority: "high" },
      { name: "Read syllabus summary chapter", type: "habit", icon: "book", color: "#2563EB" },
      { name: "Review erroneous question log", type: "task", estimatedMinutes: 30, priority: "medium" },
    ],
  },
  {
    name: "Evening Wind-Down & Review",
    description: "Consolidate today's learnings, complete review, and prepare for tomorrow.",
    isTemplate: true,
    items: [
      { name: "Complete end-of-day review", type: "habit", icon: "check-circle", color: "#7C3AED" },
      { name: "Tidy study desk & organize notes", type: "task", estimatedMinutes: 15, priority: "low" },
    ],
  },
];

export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const userRoutines = await Routine.find({ userId: user._id })
      .populate("habitIds", "name icon color frequency")
      .populate("taskIds", "title priority status dueDate");

    return NextResponse.json({
      success: true,
      routines: userRoutines,
      presets: SYSTEM_ROUTINE_PRESETS,
    });
  } catch (error) {
    console.error("GET /api/routines error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch routines" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { success: false, message: "Routine name is required" },
        { status: 400 }
      );
    }

    const routine = await Routine.create({
      userId: user._id,
      name: body.name.trim(),
      description: body.description || "",
      habitIds: body.habitIds || [],
      taskIds: body.taskIds || [],
      items: body.items || [],
      isTemplate: false,
    });

    return NextResponse.json({ success: true, routine }, { status: 201 });
  } catch (error) {
    console.error("POST /api/routines error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create routine" },
      { status: 500 }
    );
  }
}
