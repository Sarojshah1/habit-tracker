import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { ExamTarget } from "@/lib/models/ExamTarget";
import { MockExam } from "@/lib/models/MockExam";

export const dynamic = "force-dynamic";

// Helper to compute progress
function computeSyllabusProgress(syllabus: any[]) {
  let totalTopics = 0;
  let completedTopics = 0;

  for (const chapter of syllabus || []) {
    for (const topic of chapter.topics || []) {
      totalTopics++;
      if (topic.completed) completedTopics++;
    }
  }

  const syllabusProgress =
    totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;

  return { totalTopics, completedTopics, syllabusProgress };
}

// GET /api/exam-targets - List exam countdown targets with mock exam linkage
export async function GET(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const targets = await ExamTarget.find({ userId: user._id }).sort({ examDate: 1 });
    const today = new Date().toISOString().split("T")[0];

    // Enrich with days left and linked mock exams stats
    const enriched = await Promise.all(
      targets.map(async (target) => {
        const examDateObj = new Date(target.examDate);
        const todayObj = new Date(today);
        const diffTime = examDateObj.getTime() - todayObj.getTime();
        const daysLeft = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        // Find recent mock exams for this subject
        const mockExams = await MockExam.find({
          userId: user._id,
          subject: new RegExp(`^${target.subject}$`, "i"),
        })
          .sort({ date: -1 })
          .limit(5);

        let latestMockScore: number | null = null;
        let avgMockScore: number | null = null;
        if (mockExams.length > 0) {
          latestMockScore = mockExams[0].percentage;
          const sum = mockExams.reduce((acc, curr) => acc + curr.percentage, 0);
          avgMockScore = Math.round((sum / mockExams.length) * 10) / 10;
        }

        return {
          ...target.toObject(),
          daysLeft,
          isUpcoming: daysLeft >= 0,
          latestMockScore,
          avgMockScore,
          mockCount: mockExams.length,
        };
      })
    );

    return NextResponse.json({ success: true, targets: enriched });
  } catch (error) {
    console.error("GET /api/exam-targets error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch exam targets" },
      { status: 500 }
    );
  }
}

// POST /api/exam-targets - Create a new Exam Countdown & Syllabus
export async function POST(req: NextRequest) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const body = await req.json();
    const {
      title,
      subject,
      examDate,
      targetScore = 90,
      color = "#1B4332",
      syllabus = [],
      notes = "",
    } = body;

    if (!title?.trim() || !subject?.trim() || !examDate) {
      return NextResponse.json(
        { success: false, message: "Title, Subject, and Exam Date are required" },
        { status: 400 }
      );
    }

    const { totalTopics, completedTopics, syllabusProgress } = computeSyllabusProgress(syllabus);

    const examTarget = await ExamTarget.create({
      userId: user._id,
      title: title.trim(),
      subject: subject.trim(),
      examDate,
      targetScore: Number(targetScore) || 90,
      color,
      syllabus,
      totalTopics,
      completedTopics,
      syllabusProgress,
      notes: notes.trim(),
    });

    return NextResponse.json(
      { success: true, message: "Exam countdown target created", target: examTarget },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/exam-targets error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to create exam target" },
      { status: 500 }
    );
  }
}
