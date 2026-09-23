"use client";

import React, { useState } from "react";
import {
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Sparkles,
  TrendingUp,
  BookOpen,
  Plus,
  Trash2,
} from "lucide-react";
import { ExamTargetModal } from "./ExamTargetModal";

interface SyllabusTopic {
  _id: string;
  name: string;
  completed: boolean;
  confidence?: "low" | "medium" | "high";
}

interface SyllabusChapter {
  _id: string;
  title: string;
  topics: SyllabusTopic[];
}

interface ExamTargetItem {
  _id: string;
  title: string;
  subject: string;
  examDate: string;
  daysLeft: number;
  isUpcoming: boolean;
  targetScore: number;
  totalTopics: number;
  completedTopics: number;
  syllabusProgress: number;
  latestMockScore?: number | null;
  avgMockScore?: number | null;
  mockCount?: number;
  syllabus: SyllabusChapter[];
}

interface ExamCountdownBannerProps {
  targets: ExamTargetItem[];
  onRefresh: () => void;
}

export function ExamCountdownBanner({ targets, onRefresh }: ExamCountdownBannerProps) {
  const [expandedTargetId, setExpandedTargetId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updatingTopicId, setUpdatingTopicId] = useState<string | null>(null);

  if (!targets || targets.length === 0) {
    return (
      <div className="p-4 rounded-3xl bg-gradient-to-r from-forest-50 via-emerald-50/50 to-transparent dark:from-forest-950/40 dark:via-emerald-950/20 dark:to-transparent border border-forest-100 dark:border-forest-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
              Exam Countdown & Syllabus Tracker
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Add your upcoming final or competitive exams to track days left, syllabus completion, and mock scores.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all self-start sm:self-auto shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          Set Target Exam
        </button>

        <ExamTargetModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={onRefresh}
        />
      </div>
    );
  }

  // Focus on the closest upcoming exam
  const activeTarget = targets[0];
  const isExpanded = expandedTargetId === activeTarget._id;

  const handleToggleTopic = async (chapterId: string, topicId: string, currentCompleted: boolean) => {
    setUpdatingTopicId(topicId);
    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chapterId,
          topicId,
          completed: !currentCompleted,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle syllabus topic:", err);
    } finally {
      setUpdatingTopicId(null);
    }
  };

  const handleDeleteTarget = async (id: string) => {
    try {
      await fetch(`/api/exam-targets/${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error("Failed to delete exam target:", err);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-xs space-y-4">
      {/* Top Banner Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Exam Title & Countdown Counter */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-forest-700 text-white flex flex-col items-center justify-center shrink-0 shadow-sm">
            <span className="text-lg font-black leading-none">
              {Math.max(0, activeTarget.daysLeft)}
            </span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5 opacity-80">
              {activeTarget.daysLeft === 1 ? "Day" : "Days"}
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400">
                {activeTarget.subject}
              </span>
              <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                {activeTarget.examDate}
              </span>
            </div>
            <h3 className="text-base font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {activeTarget.title}
            </h3>
          </div>
        </div>

        {/* Syllabus & Mock Exam Stats */}
        <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
          {/* Syllabus Progress */}
          <div className="min-w-[140px]">
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-500 dark:text-gray-400">Syllabus</span>
              <span className="font-bold text-forest-700 dark:text-forest-400">
                {activeTarget.completedTopics}/{activeTarget.totalTopics} (
                {activeTarget.syllabusProgress}%)
              </span>
            </div>
            <div className="w-full h-2 rounded-full bg-gray-100 dark:bg-gray-800 overflow-hidden">
              <div
                className="h-full rounded-full bg-forest-600 transition-all duration-300"
                style={{ width: `${Math.min(100, activeTarget.syllabusProgress)}%` }}
              />
            </div>
          </div>

          {/* Connected Mock Exam Score */}
          {activeTarget.latestMockScore !== null && activeTarget.latestMockScore !== undefined && (
            <div className="p-2.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-center min-w-[100px]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 block">
                Latest Mock
              </span>
              <span className="text-sm font-black text-forest-800 dark:text-forest-300">
                {activeTarget.latestMockScore}%
              </span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpandedTargetId(isExpanded ? null : activeTarget._id)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-xs font-bold transition-all"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Syllabus</span>
              {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="p-2 rounded-xl text-gray-400 hover:text-forest-700 dark:hover:text-forest-400 transition-colors"
              title="Add another target exam"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Expanded Syllabus Breakdown Drawer */}
      {isExpanded && activeTarget.syllabus && (
        <div className="pt-4 border-t border-gray-100 dark:border-gray-800 space-y-4 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-xs">
            <h4 className="font-bold text-gray-900 dark:text-gray-100">
              Interactive Syllabus Check-off
            </h4>
            <button
              type="button"
              onClick={() => handleDeleteTarget(activeTarget._id)}
              className="text-red-500 hover:text-red-700 font-semibold flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Exam
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeTarget.syllabus.map((chapter) => (
              <div
                key={chapter._id}
                className="p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-2.5"
              >
                <h5 className="font-bold text-xs text-gray-800 dark:text-gray-200">
                  {chapter.title}
                </h5>

                <div className="space-y-1.5">
                  {chapter.topics.map((topic) => (
                    <label
                      key={topic._id}
                      className="flex items-center gap-2.5 p-2 rounded-xl bg-white dark:bg-gray-900/90 border border-gray-100 dark:border-gray-800 cursor-pointer hover:border-forest-500/40 transition-colors select-none"
                    >
                      <input
                        type="checkbox"
                        checked={topic.completed}
                        disabled={updatingTopicId === topic._id}
                        onChange={() => handleToggleTopic(chapter._id, topic._id, topic.completed)}
                        className="rounded border-gray-300 dark:border-gray-700 text-forest-700 focus:ring-forest-500 w-4 h-4 cursor-pointer"
                      />
                      <span
                        className={`text-xs font-medium flex-1 truncate ${
                          topic.completed
                            ? "line-through text-gray-400 dark:text-gray-500"
                            : "text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {topic.name}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* New Exam Modal */}
      <ExamTargetModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={onRefresh}
      />
    </div>
  );
}
