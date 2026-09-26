"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  GraduationCap,
  Clock,
  Sparkles,
  BookOpen,
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  CheckCircle2,
  AlertCircle,
  Plus,
} from "lucide-react";
import { ReadinessResult } from "@/lib/services/readiness";

export function ExamCountdownWidget() {
  const [readiness, setReadiness] = useState<ReadinessResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadReadiness() {
      try {
        const res = await fetch("/api/exams/readiness");
        if (!res.ok) return;
        const json = await res.json();
        if (isMounted && json.success && json.data) {
          setReadiness(json.data);
        }
      } catch (err) {
        console.error("Error loading readiness data:", err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadReadiness();
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-5 shadow-xs animate-pulse">
        <div className="flex items-center justify-between gap-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-48" />
          <div className="h-6 bg-gray-200 dark:bg-gray-800 rounded-md w-24" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
          <div className="h-16 bg-gray-100 dark:bg-gray-800/60 rounded-xl" />
        </div>
      </div>
    );
  }

  // If no upcoming exam is configured
  if (!readiness || !readiness.hasUpcomingExam || !readiness.nearestExam) {
    return (
      <div className="bg-gradient-to-r from-forest-50 via-emerald-50/40 to-teal-50/50 dark:from-forest-950/20 dark:via-gray-900 dark:to-gray-900 border border-forest-200/60 dark:border-forest-800/40 rounded-3xl p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-forest-900/10">
            <GraduationCap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              Target Exam Countdown & Readiness Matrix
            </h3>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Set your target exam date to unlock an automated countdown and composite readiness score.
            </p>
          </div>
        </div>
        <Link
          href="/exams"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all shrink-0 hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Set Target Exam
        </Link>
      </div>
    );
  }

  const { nearestExam, metrics, stats } = readiness;
  const days = nearestExam.daysRemaining;

  return (
    <div className="bg-gradient-to-br from-white via-forest-50/20 to-emerald-50/30 dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 rounded-3xl border border-gray-200/90 dark:border-gray-800 p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all">
      {/* Decorative subtle background icon */}
      <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-forest-700">
        <GraduationCap className="w-48 h-48" />
      </div>

      {/* Top Bar: Exam Title, Countdown badge, and View All link */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-forest-900/20">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black tracking-wider uppercase text-forest-700 dark:text-forest-400 bg-forest-100/70 dark:bg-forest-950/60 px-2 py-0.5 rounded-md">
                {nearestExam.subject}
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
                {nearestExam.title}
              </h3>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mt-0.5">
              Target: <span className="font-bold text-gray-700 dark:text-gray-300">{nearestExam.examDate}</span> (Aiming for {nearestExam.targetScore}%)
            </p>
          </div>
        </div>

        {/* Live Countdown Badge */}
        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-2xl bg-forest-700 text-white shadow-sm">
            <Clock className="w-4 h-4 animate-pulse" />
            <span className="text-xs font-bold tracking-wide">
              {nearestExam.isToday
                ? "🔥 EXAM IS TODAY!"
                : nearestExam.isPast
                ? "Exam completed"
                : `⏳ ${days} ${days === 1 ? "Day" : "Days"} Remaining`}
            </span>
          </div>

          <Link
            href="/exams"
            className="inline-flex items-center text-xs font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 hover:underline gap-1"
          >
            All Exams
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Main Readiness Score Banner & 4-Pillar Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 mt-5">
        {/* Composite Readiness Card */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-800/80 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-4 flex flex-col justify-between shadow-xs">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Study Readiness Matrix
              </span>
              <span
                className="text-[11px] font-black px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: `${metrics.tierColor}18`,
                  color: metrics.tierColor,
                  border: `1px solid ${metrics.tierColor}35`,
                }}
              >
                {metrics.tier}
              </span>
            </div>

            <div className="flex items-baseline gap-2 mt-3">
              <span className="text-4xl font-black text-gray-900 dark:text-gray-50 tracking-tight">
                {metrics.compositeScore}%
              </span>
              <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
                overall preparation
              </span>
            </div>

            {/* Overall Progress Bar */}
            <div className="w-full bg-gray-100 dark:bg-gray-700 h-2.5 rounded-full mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${metrics.compositeScore}%`,
                  backgroundColor: metrics.tierColor,
                }}
              />
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
            <span className="text-gray-500 dark:text-gray-400">Best Mock Score:</span>
            <span className="font-extrabold text-gray-900 dark:text-gray-100">
              {stats.bestMockScore > 0 ? `${stats.bestMockScore}%` : "No tests yet"}
            </span>
          </div>
        </div>

        {/* 4 Pillars Breakdown Grid */}
        <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Pillar 1: Syllabus Coverage */}
          <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Syllabus
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                {metrics.syllabusCoverageScore}%
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {nearestExam.totalTopics > 0
                  ? `${nearestExam.completedTopics}/${nearestExam.totalTopics} topics`
                  : "Tracked"}
              </p>
            </div>
            <div className="w-full bg-blue-100 dark:bg-blue-950 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-blue-600 h-full rounded-full"
                style={{ width: `${metrics.syllabusCoverageScore}%` }}
              />
            </div>
          </div>

          {/* Pillar 2: Mock Tests */}
          <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Award className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Mock Exams
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                {metrics.mockExamScore}%
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {stats.totalMockExamsTaken} taken
              </p>
            </div>
            <div className="w-full bg-emerald-100 dark:bg-emerald-950 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-600 h-full rounded-full"
                style={{ width: `${metrics.mockExamScore}%` }}
              />
            </div>
          </div>

          {/* Pillar 3: Study Habits */}
          <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Study Habits
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                {metrics.studyHabitConsistency}%
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {stats.studyHabitStreak} day streak
              </p>
            </div>
            <div className="w-full bg-amber-100 dark:bg-amber-950 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-600 h-full rounded-full"
                style={{ width: `${metrics.studyHabitConsistency}%` }}
              />
            </div>
          </div>

          {/* Pillar 4: Flashcards */}
          <div className="bg-white/80 dark:bg-gray-800/60 rounded-2xl border border-gray-200/80 dark:border-gray-700/60 p-3.5 flex flex-col justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <Brain className="w-3.5 h-3.5" />
              </div>
              <span className="text-[11px] font-bold text-gray-600 dark:text-gray-300">
                Flashcards
              </span>
            </div>
            <div className="mt-2.5">
              <div className="text-xl font-black text-gray-900 dark:text-gray-100">
                {metrics.flashcardMasteryScore}%
              </div>
              <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {stats.flashcardsReviewed} reviewed
              </p>
            </div>
            <div className="w-full bg-purple-100 dark:bg-purple-950 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-purple-600 h-full rounded-full"
                style={{ width: `${metrics.flashcardMasteryScore}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
