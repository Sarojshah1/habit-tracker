import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, unauthorizedResponse } from "@/lib/auth/middleware";
import { ExamTarget } from "@/lib/models/ExamTarget";

export const dynamic = "force-dynamic";

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

// GET /api/exam-targets/[id]
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const target = await ExamTarget.findOne({ _id: id, userId: user._id });

    if (!target) {
      return NextResponse.json({ success: false, message: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, target });
  } catch (error) {
    console.error("GET /api/exam-targets/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to load exam target" },
      { status: 500 }
    );
  }
}

// PATCH /api/exam-targets/[id] - Update syllabus topics (toggle completed), chapters, or details
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const body = await req.json();

    const target = await ExamTarget.findOne({ _id: id, userId: user._id });
    if (!target) {
      return NextResponse.json({ success: false, message: "Target not found" }, { status: 404 });
    }

    if (body.title !== undefined) target.title = body.title.trim();
    if (body.subject !== undefined) target.subject = body.subject.trim();
    if (body.examDate !== undefined) target.examDate = body.examDate;
    if (body.targetScore !== undefined) target.targetScore = Number(body.targetScore);
    if (body.color !== undefined) target.color = body.color;
    if (body.notes !== undefined) target.notes = body.notes;

    // Handle topic toggle or chapter update
    if (body.chapterId && body.topicId) {
      const chapter = target.syllabus.find((c: any) => c._id?.toString() === body.chapterId.toString());
      if (chapter) {
        const topic = chapter.topics.find((t: any) => t._id?.toString() === body.topicId.toString());
        if (topic) {
          if (body.completed !== undefined) topic.completed = body.completed;
          if (body.confidence !== undefined) topic.confidence = body.confidence;
        }
      }
    } else if (body.syllabus !== undefined) {
      target.syllabus = body.syllabus;
    }

    const { totalTopics, completedTopics, syllabusProgress } = computeSyllabusProgress(
      target.syllabus
    );
    target.totalTopics = totalTopics;
    target.completedTopics = completedTopics;
    target.syllabusProgress = syllabusProgress;

    await target.save();

    return NextResponse.json({
      success: true,
      message: "Exam target updated",
      target,
    });
  } catch (error) {
    console.error("PATCH /api/exam-targets/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update exam target" },
      { status: 500 }
    );
  }
}

// DELETE /api/exam-targets/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthenticatedUser(req);
    if (!user) return unauthorizedResponse();

    const { id } = await params;
    const deleted = await ExamTarget.findOneAndDelete({ _id: id, userId: user._id });

    if (!deleted) {
      return NextResponse.json({ success: false, message: "Target not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Exam target deleted" });
  } catch (error) {
    console.error("DELETE /api/exam-targets/[id] error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete exam target" },
      { status: 500 }
    );
  }
}
