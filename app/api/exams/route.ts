import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { MockExam } from "@/lib/models/MockExam";
import { logActivity } from "@/lib/services/activity";

export const dynamic = "force-dynamic";

// GET /api/exams - List user's mock exams with optional subject filter
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { searchParams } = new URL(req.url);
    const subject = searchParams.get("subject");
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const query: any = { userId: user._id };
    if (subject && subject !== "all") {
      query.subject = subject;
    }

    const [exams, subjects] = await Promise.all([
      MockExam.find(query).sort({ date: -1, createdAt: -1 }).limit(limit).lean(),
      MockExam.distinct("subject", { userId: user._id }),
    ]);

    // Calculate aggregated metrics
    const totalExams = exams.length;
    let avgScore = 0;
    let highestScore = 0;

    if (totalExams > 0) {
      const sum = exams.reduce((acc, curr) => acc + curr.percentage, 0);
      avgScore = Math.round((sum / totalExams) * 10) / 10;
      highestScore = Math.max(...exams.map((e) => e.percentage));
    }

    return NextResponse.json({
      success: true,
      exams,
      subjects,
      stats: {
        totalExams,
        avgScore,
        highestScore,
      },
    });
  } catch (error) {
    console.error("GET /api/exams error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch mock exams" },
      { status: 500 }
    );
  }
}

// POST /api/exams - Create new mock exam entry
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const {
      title,
      subject,
      score,
      totalMarks = 100,
      date = new Date().toISOString().split("T")[0],
      durationMinutes = 60,
      weakTopics = [],
      notes = "",
      focusSessionId,
    } = body;

    if (!title || !subject || score === undefined || score === null) {
      return NextResponse.json(
        { success: false, message: "Title, subject, and score are required" },
        { status: 400 }
      );
    }

    const numScore = Number(score);
    const numTotal = Number(totalMarks) || 100;
    const percentage = Math.round((numScore / numTotal) * 1000) / 10;

    const exam = await MockExam.create({
      userId: user._id,
      title: title.trim(),
      subject: subject.trim(),
      score: numScore,
      totalMarks: numTotal,
      percentage,
      date,
      durationMinutes: Number(durationMinutes) || 60,
      weakTopics: Array.isArray(weakTopics) ? weakTopics.filter(Boolean) : [],
      notes: notes.trim(),
      focusSessionId: focusSessionId || undefined,
    });

    await logActivity({
      userId: user._id.toString(),
      type: "focus_session_completed",
      entityId: exam._id.toString(),
      entityType: "MockExam",
      metadata: {
        title: `📝 Mock Exam Logged: ${subject}`,
        description: `Scored ${numScore}/${numTotal} (${percentage}%) on "${title}".`,
        examId: exam._id.toString(),
        subject,
        score: numScore,
        totalMarks: numTotal,
      },
    });

    return NextResponse.json(
      { success: true, message: "Mock exam logged successfully", exam },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/exams error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create mock exam" },
      { status: 500 }
    );
  }
}
