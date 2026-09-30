import mongoose from "mongoose";
import { ExamTarget, IExamTarget } from "@/lib/models/ExamTarget";
import { MockExam } from "@/lib/models/MockExam";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { Flashcard } from "@/lib/models/Flashcard";
import { getUserTodayDateString } from "@/lib/utils/date";

export interface ReadinessResult {
  hasUpcomingExam: boolean;
  nearestExam?: {
    _id: string;
    title: string;
    subject: string;
    examDate: string;
    targetScore: number;
    color: string;
    daysRemaining: number;
    isPast: boolean;
    isToday: boolean;
    syllabusProgress: number;
    completedTopics: number;
    totalTopics: number;
  };
  metrics: {
    syllabusCoverageScore: number; // 0-100
    mockExamScore: number; // 0-100
    studyHabitConsistency: number; // 0-100
    flashcardMasteryScore: number; // 0-100
    compositeScore: number; // 0-100
    tier: "Mastery" | "On Track" | "Needs Focus" | "High Alert";
    tierColor: string;
  };
  stats: {
    totalMockExamsTaken: number;
    bestMockScore: number;
    studyHabitStreak: number;
    flashcardsReviewed: number;
  };
}

export async function calculateStudyReadiness(
  userId: mongoose.Types.ObjectId | string,
  timezone: string = "Asia/Kathmandu"
): Promise<ReadinessResult> {
  const todayDateStr = getUserTodayDateString(timezone);

  // 1. Fetch nearest upcoming target exam
  const examTargets = await ExamTarget.find({
    userId,
    examDate: { $gte: todayDateStr },
  })
    .sort({ examDate: 1 })
    .lean();

  const targetExam = examTargets[0] || null;

  // Also fetch recent target exam if no upcoming (for testing / review)
  let latestExam: any = targetExam;
  if (!latestExam) {
    latestExam = await ExamTarget.findOne({ userId })
      .sort({ examDate: -1 })
      .lean();
  }

  // 2. Fetch mock exams for this subject / user
  const mockExams = await MockExam.find({
    userId,
    ...(latestExam?.subject ? { subject: latestExam.subject } : {}),
  })
    .sort({ date: -1 })
    .limit(10)
    .lean();

  // 3. Fetch study/focus habits
  const studyHabits = await Habit.find({
    userId,
    archived: false,
    $or: [
      { category: { $in: ["study", "focus", "college", "academic", "exam"] } },
      { name: { $regex: /study|revision|exam|book|mcq|practice|class/i } },
    ],
  }).lean();

  const studyHabitIds = studyHabits.map((h) => h._id);

  // Last 14 days completions for study habits
  const past14DaysDate = new Date();
  past14DaysDate.setDate(past14DaysDate.getDate() - 14);
  const past14Str = past14DaysDate.toISOString().split("T")[0];

  const completions = await HabitCompletion.find({
    userId,
    habitId: { $in: studyHabitIds },
    date: { $gte: past14Str, $lte: todayDateStr },
  }).lean();

  // 4. Flashcards mastery
  const flashcards = await Flashcard.find({
    userId,
    ...(latestExam?.subject ? { subject: latestExam.subject } : {}),
  }).lean();

  // --- CALCULATE COMPONENT SCORES ---

  // A. Syllabus Coverage Score (35% weight)
  let syllabusCoverageScore = 0;
  let completedTopics = 0;
  let totalTopics = 0;
  if (latestExam) {
    syllabusCoverageScore = Math.min(100, Math.max(0, latestExam.syllabusProgress || 0));
    completedTopics = latestExam.completedTopics || 0;
    totalTopics = latestExam.totalTopics || 0;
  }

  // B. Mock Exam Score (35% weight)
  let mockExamScore = 0;
  let totalMockExamsTaken = mockExams.length;
  let bestMockScore = 0;
  if (mockExams.length > 0) {
    const sum = mockExams.reduce((acc, m) => {
      if (m.percentage > bestMockScore) bestMockScore = m.percentage;
      return acc + m.percentage;
    }, 0);
    mockExamScore = Math.min(100, Math.round(sum / mockExams.length));
  } else {
    // Baseline if no mock exams taken yet
    mockExamScore = 50;
  }

  // C. Study Habit Consistency (20% weight)
  let studyHabitConsistency = 0;
  let studyHabitStreak = 0;
  if (studyHabits.length > 0) {
    studyHabitStreak = Math.max(...studyHabits.map((h: any) => h.currentStreak || 0), 0);
    const expected = studyHabits.length * 14;
    const completedCount = completions.filter((c) => c.status === "completed" || c.status === "frozen").length;
    studyHabitConsistency = Math.min(
      100,
      Math.round((completedCount / Math.max(1, expected)) * 100)
    );
  } else {
    studyHabitConsistency = 70; // default if no specific study habit
  }

  // D. Flashcard Mastery Score (10% weight)
  let flashcardMasteryScore = 0;
  let flashcardsReviewed = flashcards.length;
  if (flashcards.length > 0) {
    const mastered = flashcards.filter(
      (f: any) => f.repetitions && f.repetitions >= 3
    ).length;
    flashcardMasteryScore = Math.min(100, Math.round((mastered / flashcards.length) * 100));
  } else {
    flashcardMasteryScore = 60; // neutral fallback
  }

  // --- COMPOSITE READINESS SCORE ---
  const compositeScore = Math.min(
    100,
    Math.round(
      syllabusCoverageScore * 0.35 +
        mockExamScore * 0.35 +
        studyHabitConsistency * 0.2 +
        flashcardMasteryScore * 0.1
    )
  );

  let tier: "Mastery" | "On Track" | "Needs Focus" | "High Alert" = "On Track";
  let tierColor = "#10b981"; // Emerald

  if (compositeScore >= 85) {
    tier = "Mastery";
    tierColor = "#06b6d4"; // Cyan
  } else if (compositeScore >= 70) {
    tier = "On Track";
    tierColor = "#10b981"; // Emerald
  } else if (compositeScore >= 50) {
    tier = "Needs Focus";
    tierColor = "#f59e0b"; // Amber
  } else {
    tier = "High Alert";
    tierColor = "#ef4444"; // Rose
  }

  // Days remaining calculation
  let daysRemaining = 0;
  let isPast = false;
  let isToday = false;

  if (latestExam?.examDate) {
    const targetDate = new Date(latestExam.examDate);
    const today = new Date(todayDateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    isToday = daysRemaining === 0;
    isPast = daysRemaining < 0;
  }

  return {
    hasUpcomingExam: Boolean(latestExam),
    nearestExam: latestExam
      ? {
          _id: latestExam._id.toString(),
          title: latestExam.title,
          subject: latestExam.subject,
          examDate: latestExam.examDate,
          targetScore: latestExam.targetScore || 90,
          color: latestExam.color || "#1B4332",
          daysRemaining: Math.max(0, daysRemaining),
          isPast,
          isToday,
          syllabusProgress: syllabusCoverageScore,
          completedTopics,
          totalTopics,
        }
      : undefined,
    metrics: {
      syllabusCoverageScore,
      mockExamScore,
      studyHabitConsistency,
      flashcardMasteryScore,
      compositeScore,
      tier,
      tierColor,
    },
    stats: {
      totalMockExamsTaken,
      bestMockScore,
      studyHabitStreak,
      flashcardsReviewed,
    },
  };
}
