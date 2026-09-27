"use client";

import React, { useState } from "react";
import {
  GraduationCap,
  Calendar,
  Clock,
  Plus,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Tag,
  Check,
  X,
  Target,
  Layers,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ExamTargetModal } from "./ExamTargetModal";

export interface SyllabusTopic {
  _id: string;
  name: string;
  completed: boolean;
  confidence?: "low" | "medium" | "high";
  notes?: string;
}

export interface SyllabusChapter {
  _id: string;
  title: string;
  topics: SyllabusTopic[];
}

export interface ExamTargetItem {
  _id: string;
  title: string;
  subject: string;
  examDate: string;
  targetScore: number;
  color: string;
  daysLeft: number;
  isUpcoming: boolean;
  totalTopics: number;
  completedTopics: number;
  syllabusProgress: number;
  latestMockScore?: number | null;
  avgMockScore?: number | null;
  mockCount?: number;
  notes?: string;
  syllabus: SyllabusChapter[];
}

interface ExamSyllabusManagerProps {
  targets: ExamTargetItem[];
  onRefresh: () => void;
  onOpenNewExamModal: () => void;
}

// Recommended starter templates
const BANKING_TEMPLATE_CHAPTERS = [
  {
    title: "Unit 1: Banking Fundamentals & Financial Systems",
    topics: [
      { name: "Structure of Banking & Financial Institutions", completed: false, confidence: "medium" },
      { name: "Central Banking Roles & Monetary Policy Operations", completed: false, confidence: "medium" },
      { name: "Commercial Banking Operations & Deposit Products", completed: false, confidence: "medium" },
      { name: "Credit Creation, Reserve Ratios (CRR, SLR)", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 2: Credit, Lending & Risk Management",
    topics: [
      { name: "Retail & Corporate Lending Principles", completed: false, confidence: "medium" },
      { name: "Non-Performing Assets (NPA) Management & Recovery", completed: false, confidence: "medium" },
      { name: "Collateral Valuation & Loan Documentation", completed: false, confidence: "medium" },
      { name: "Credit Appraisal & Basel III Capital Norms", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 3: Digital Banking, Payments & Technology",
    topics: [
      { name: "Core Banking Systems (CBS) Architecture", completed: false, confidence: "medium" },
      { name: "Payment Gateways, RTGS, NEFT & Electronic Clearing", completed: false, confidence: "medium" },
      { name: "Cybersecurity, Fraud Prevention & Data Privacy", completed: false, confidence: "medium" },
      { name: "FinTech Innovations & Digital Banking Channels", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 4: Banking Regulations, AML & Compliance",
    topics: [
      { name: "Banking Regulation Acts & Statutory Frameworks", completed: false, confidence: "medium" },
      { name: "Anti-Money Laundering (AML) & KYC Directives", completed: false, confidence: "medium" },
      { name: "Consumer Protection, Ombudsman & Ethics", completed: false, confidence: "medium" },
      { name: "Corporate Governance & Internal Audit Controls", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 5: Financial Mathematics & Quantitative Aptitude",
    topics: [
      { name: "Ratio Analysis & Financial Statements Interpretation", completed: false, confidence: "medium" },
      { name: "Simple & Compound Interest, Annuities & Depreciation", completed: false, confidence: "medium" },
      { name: "Time Value of Money & Bond Yield Valuation", completed: false, confidence: "medium" },
      { name: "Data Interpretation & Numerical Problem Solving", completed: false, confidence: "medium" },
    ],
  },
];

const GENERAL_TEMPLATE_CHAPTERS = [
  {
    title: "Unit 1: Core Concepts & Principles",
    topics: [
      { name: "Fundamental Definitions & Theoretical Framework", completed: false, confidence: "medium" },
      { name: "Historical Development & Evolution", completed: false, confidence: "medium" },
      { name: "Essential Theorems & Models", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 2: Advanced Topics & Applications",
    topics: [
      { name: "Advanced Analytical Techniques", completed: false, confidence: "medium" },
      { name: "Practical Case Studies & Problem Solving", completed: false, confidence: "medium" },
      { name: "Cross-Disciplinary Integration", completed: false, confidence: "medium" },
    ],
  },
  {
    title: "Unit 3: Revision, Past Papers & Mock Drills",
    topics: [
      { name: "Formulas & Key Formula Memorization", completed: false, confidence: "medium" },
      { name: "High-Frequency Exam Question Review", completed: false, confidence: "medium" },
      { name: "Timed Past Papers & Error Log Remediation", completed: false, confidence: "medium" },
    ],
  },
];

export function ExamSyllabusManager({
  targets,
  onRefresh,
  onOpenNewExamModal,
}: ExamSyllabusManagerProps) {
  const [selectedTargetId, setSelectedTargetId] = useState<string>(
    targets[0]?._id || ""
  );

  // Sync selected target when targets list changes
  React.useEffect(() => {
    if (targets.length > 0) {
      if (!selectedTargetId || !targets.find((t) => t._id === selectedTargetId)) {
        setSelectedTargetId(targets[0]._id);
      }
    }
  }, [targets, selectedTargetId]);

  const activeTarget = targets.find((t) => t._id === selectedTargetId) || targets[0];

  // Local state for actions
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editSubject, setEditSubject] = useState("");
  const [editExamDate, setEditExamDate] = useState("");
  const [editTargetScore, setEditTargetScore] = useState(90);
  const [editNotes, setEditNotes] = useState("");

  // New chapter inline state
  const [isAddingChapter, setIsAddingChapter] = useState(false);
  const [newChapterTitle, setNewChapterTitle] = useState("");

  // Chapter renaming
  const [renamingChapterId, setRenamingChapterId] = useState<string | null>(null);
  const [renamingTitle, setRenamingTitle] = useState("");

  // New topic inline state (keyed by chapterId)
  const [newTopicByChapter, setNewTopicByChapter] = useState<Record<string, string>>({});

  // Loading indicator for async topic toggles
  const [busyTopicId, setBusyTopicId] = useState<string | null>(null);

  // Deletion confirm
  const [deletingChapterId, setDeletingChapterId] = useState<string | null>(null);
  const [deletingExamId, setDeletingExamId] = useState<string | null>(null);

  if (!targets || targets.length === 0) {
    return (
      <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs text-center space-y-4">
        <div className="w-16 h-16 rounded-3xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 flex items-center justify-center mx-auto shadow-inner">
          <GraduationCap className="w-8 h-8" />
        </div>
        <div className="max-w-md mx-auto">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
            No Target Exams Set Yet
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set your target exam date and syllabus to track countdown days, organize revision chapters, and boost your study readiness matrix.
          </p>
        </div>
        <button
          type="button"
          onClick={onOpenNewExamModal}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-md transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          Set Target Exam &amp; Syllabus
        </button>
      </div>
    );
  }

  // Handle Toggle Topic Completion
  const handleToggleTopic = async (chapterId: string, topicId: string, currentCompleted: boolean) => {
    if (!activeTarget) return;
    setBusyTopicId(topicId);
    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_topic",
          chapterId,
          topicId,
          completed: !currentCompleted,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to toggle topic:", err);
    } finally {
      setBusyTopicId(null);
    }
  };

  // Handle Toggle Topic Confidence (cycles: low -> medium -> high -> low)
  const handleCycleConfidence = async (
    chapterId: string,
    topicId: string,
    currentConfidence: "low" | "medium" | "high" = "medium"
  ) => {
    if (!activeTarget) return;
    const nextConfidence =
      currentConfidence === "low" ? "medium" : currentConfidence === "medium" ? "high" : "low";

    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_topic",
          chapterId,
          topicId,
          confidence: nextConfidence,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to update confidence:", err);
    }
  };

  // Handle Add Chapter
  const handleAddChapter = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!activeTarget || !newChapterTitle.trim()) return;

    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_chapter",
          title: newChapterTitle.trim(),
          topics: [],
        }),
      });
      setNewChapterTitle("");
      setIsAddingChapter(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to add chapter:", err);
    }
  };

  // Handle Rename Chapter
  const handleSaveRenameChapter = async (chapterId: string) => {
    if (!activeTarget || !renamingTitle.trim()) {
      setRenamingChapterId(null);
      return;
    }
    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update_chapter",
          chapterId,
          chapterTitle: renamingTitle.trim(),
        }),
      });
      setRenamingChapterId(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to rename chapter:", err);
    }
  };

  // Handle Delete Chapter
  const handleDeleteChapter = async () => {
    if (!activeTarget || !deletingChapterId) return;
    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_chapter",
          chapterId: deletingChapterId,
        }),
      });
      setDeletingChapterId(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete chapter:", err);
    }
  };

  // Handle Add Topic to Chapter
  const handleAddTopic = async (chapterId: string) => {
    if (!activeTarget) return;
    const name = (newTopicByChapter[chapterId] || "").trim();
    if (!name) return;

    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "add_topic",
          chapterId,
          name,
          confidence: "medium",
        }),
      });
      setNewTopicByChapter({ ...newTopicByChapter, [chapterId]: "" });
      onRefresh();
    } catch (err) {
      console.error("Failed to add topic:", err);
    }
  };

  // Handle Delete Topic
  const handleDeleteTopic = async (chapterId: string, topicId: string) => {
    if (!activeTarget) return;
    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_topic",
          chapterId,
          topicId,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to delete topic:", err);
    }
  };

  // Handle Apply Starter Template
  const handleApplyTemplate = async (templateType: "banking" | "general") => {
    if (!activeTarget) return;
    const templateData =
      templateType === "banking" ? BANKING_TEMPLATE_CHAPTERS : GENERAL_TEMPLATE_CHAPTERS;

    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          syllabus: templateData,
        }),
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to apply template:", err);
    }
  };

  // Open Edit Exam Modal
  const openEditModal = () => {
    if (!activeTarget) return;
    setEditTitle(activeTarget.title);
    setEditSubject(activeTarget.subject);
    setEditExamDate(activeTarget.examDate);
    setEditTargetScore(activeTarget.targetScore || 90);
    setEditNotes(activeTarget.notes || "");
    setIsEditModalOpen(true);
  };

  // Save Exam Metadata Edit
  const handleSaveExamDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTarget) return;

    try {
      await fetch(`/api/exam-targets/${activeTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: editTitle,
          subject: editSubject,
          examDate: editExamDate,
          targetScore: Number(editTargetScore),
          notes: editNotes,
        }),
      });
      setIsEditModalOpen(false);
      onRefresh();
    } catch (err) {
      console.error("Failed to update exam details:", err);
    }
  };

  // Handle Delete Exam
  const handleDeleteExam = async () => {
    if (!deletingExamId) return;
    try {
      await fetch(`/api/exam-targets/${deletingExamId}`, { method: "DELETE" });
      setDeletingExamId(null);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete exam:", err);
    }
  };

  const isBankingExam =
    (activeTarget.subject || "").toLowerCase().includes("bank") ||
    (activeTarget.title || "").toLowerCase().includes("bank");

  const totalChapters = activeTarget.syllabus?.length || 0;

  return (
    <div className="space-y-6">
      {/* Exam Switcher Tabs (if multiple targets exist) */}
      {targets.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider shrink-0 mr-1">
            Target Exams:
          </span>
          {targets.map((tgt) => (
            <button
              key={tgt._id}
              type="button"
              onClick={() => setSelectedTargetId(tgt._id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
                selectedTargetId === tgt._id
                  ? "bg-forest-700 text-white shadow-xs"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              <span>{tgt.title}</span>
              <span className="px-1.5 py-0.2 text-[10px] rounded-md bg-white/20">
                {Math.max(0, tgt.daysLeft)}d left
              </span>
            </button>
          ))}
          <button
            type="button"
            onClick={onOpenNewExamModal}
            className="p-1.5 rounded-xl text-gray-400 hover:text-forest-700 dark:hover:text-forest-400 border border-dashed border-gray-300 dark:border-gray-700 shrink-0"
            title="Add another target exam"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Target Exam Banner & Syllabus Progress */}
      <div className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs relative overflow-hidden">
        {/* Subtle Decorative Background Watermark */}
        <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none text-forest-700 dark:text-forest-400">
          <GraduationCap className="w-56 h-56" />
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          {/* Left: Exam Info & Countdown */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-wider bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 border border-forest-100 dark:border-forest-900/40">
                {activeTarget.subject}
              </span>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 text-xs font-bold border border-amber-200 dark:border-amber-800/40">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {activeTarget.daysLeft === 0
                    ? "Exam is Today!"
                    : activeTarget.daysLeft < 0
                    ? "Completed"
                    : `${activeTarget.daysLeft} Days Remaining`}
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-2xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
                {activeTarget.title}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-medium flex items-center gap-3">
                <span>
                  Target Date: <strong className="text-gray-700 dark:text-gray-300">{activeTarget.examDate}</strong>
                </span>
                <span>•</span>
                <span>
                  Target Score: <strong className="text-forest-700 dark:text-forest-400">{activeTarget.targetScore}%</strong>
                </span>
              </p>
            </div>

            {/* Action Buttons: Edit & Delete */}
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={openEditModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Edit Exam Target
              </button>
              <button
                type="button"
                onClick={() => setDeletingExamId(activeTarget._id)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete
              </button>
            </div>
          </div>

          {/* Right: Real-time Syllabus Progress Ring/Bar */}
          <div className="p-5 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 lg:min-w-[280px]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-blue-500" />
                Syllabus Progress
              </span>
              <span className="text-sm font-black text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/60 px-2 py-0.5 rounded-md">
                {activeTarget.syllabusProgress}%
              </span>
            </div>

            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-forest-600 h-full rounded-full transition-all duration-500 ease-out"
                style={{ width: `${Math.min(100, activeTarget.syllabusProgress)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mt-2 font-medium">
              <span>
                {activeTarget.completedTopics} of {activeTarget.totalTopics} topics mastered
              </span>
              <span>{totalChapters} units</span>
            </div>
          </div>
        </div>
      </div>

      {/* Chapters & Syllabus Breakdown Section */}
      <div className="space-y-4">
        {/* Section Header & Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <Layers className="w-5 h-5 text-forest-700 dark:text-forest-400" />
              Syllabus Chapters &amp; Topics
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Break down your exam preparation into units. Check off topics as you study to drive your Readiness Matrix.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Quick Templates Button */}
            {isBankingExam && totalChapters === 0 && (
              <button
                type="button"
                onClick={() => handleApplyTemplate("banking")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-900/50 border border-amber-200 dark:border-amber-800 transition-all"
                title="Populate 5 standard units for banking exam preparation"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Banking Syllabus
              </button>
            )}

            {totalChapters === 0 && (
              <button
                type="button"
                onClick={() => handleApplyTemplate("general")}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800 transition-all"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Load Standard Template
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsAddingChapter(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition-all hover:scale-[1.01]"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Chapter / Unit
            </button>
          </div>
        </div>

        {/* Inline Add Chapter Form */}
        {isAddingChapter && (
          <form
            onSubmit={handleAddChapter}
            className="p-4 rounded-2xl bg-forest-50/50 dark:bg-forest-950/30 border border-forest-200 dark:border-forest-800 flex flex-col sm:flex-row items-center gap-3 animate-in fade-in duration-150"
          >
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Unit 1: Monetary Policy & Central Banking"
              value={newChapterTitle}
              onChange={(e) => setNewChapterTitle(e.target.value)}
              className="flex-1 w-full px-3 py-2 text-xs rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
              <button
                type="button"
                onClick={() => {
                  setIsAddingChapter(false);
                  setNewChapterTitle("");
                }}
                className="px-3 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-xs"
              >
                Save Chapter
              </button>
            </div>
          </form>
        )}

        {/* Empty State for Chapters */}
        {totalChapters === 0 ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-dashed border-gray-200 dark:border-gray-800 text-center space-y-3">
            <BookOpen className="w-8 h-8 text-gray-400 mx-auto" />
            <h4 className="text-sm font-bold text-gray-800 dark:text-gray-200">
              No Syllabus Chapters Added
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Add your syllabus chapters to begin checking off topics, or use one of the quick starter templates above!
            </p>
            <div className="flex items-center justify-center gap-3 pt-2">
              {isBankingExam && (
                <button
                  type="button"
                  onClick={() => handleApplyTemplate("banking")}
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-xs"
                >
                  ⚡ Auto-Populate Banking Syllabus
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsAddingChapter(true)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white shadow-xs"
              >
                + Add Custom Chapter
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {activeTarget.syllabus.map((chapter, cIdx) => {
              const chapterTotal = chapter.topics?.length || 0;
              const chapterCompleted = chapter.topics?.filter((t) => t.completed).length || 0;
              const chapterPct =
                chapterTotal > 0 ? Math.round((chapterCompleted / chapterTotal) * 100) : 0;

              const isRenaming = renamingChapterId === chapter._id;

              return (
                <div
                  key={chapter._id || cIdx}
                  className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs space-y-3.5"
                >
                  {/* Chapter Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-gray-100 dark:border-gray-800/80">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-6 h-6 rounded-lg bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 text-xs font-black flex items-center justify-center shrink-0">
                        {cIdx + 1}
                      </span>

                      {isRenaming ? (
                        <div className="flex items-center gap-2 flex-1 max-w-md">
                          <input
                            type="text"
                            value={renamingTitle}
                            onChange={(e) => setRenamingTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleSaveRenameChapter(chapter._id);
                            }}
                            className="flex-1 px-2.5 py-1 text-xs font-bold rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                            autoFocus
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameChapter(chapter._id)}
                            className="p-1 rounded-md text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/50"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setRenamingChapterId(null)}
                            className="p-1 rounded-md text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <h4 className="font-bold text-sm text-gray-900 dark:text-gray-100">
                          {chapter.title}
                        </h4>
                      )}
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
                      {/* Chapter Progress Counter */}
                      <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                        <strong className="text-forest-700 dark:text-forest-400">
                          {chapterCompleted}/{chapterTotal}
                        </strong>{" "}
                        completed ({chapterPct}%)
                      </span>

                      {/* Rename Chapter */}
                      {!isRenaming && (
                        <button
                          type="button"
                          onClick={() => {
                            setRenamingChapterId(chapter._id);
                            setRenamingTitle(chapter.title);
                          }}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          title="Rename chapter"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Delete Chapter */}
                      <button
                        type="button"
                        onClick={() => setDeletingChapterId(chapter._id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                        title="Delete unit"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Topics List */}
                  <div className="space-y-2">
                    {chapter.topics && chapter.topics.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {chapter.topics.map((topic) => {
                          const isTopicBusy = busyTopicId === topic._id;
                          const confidence = topic.confidence || "medium";

                          return (
                            <div
                              key={topic._id}
                              className={`p-2.5 rounded-2xl border transition-all flex items-center gap-2.5 ${
                                topic.completed
                                  ? "bg-forest-50/40 dark:bg-forest-950/20 border-forest-100 dark:border-forest-900/40"
                                  : "bg-gray-50 dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60 hover:border-gray-200"
                              }`}
                            >
                              {/* Checkbox */}
                              <button
                                type="button"
                                disabled={isTopicBusy}
                                onClick={() =>
                                  handleToggleTopic(chapter._id, topic._id, topic.completed)
                                }
                                className="shrink-0 p-0.5 text-forest-700 dark:text-forest-400 hover:scale-110 transition-transform disabled:opacity-50"
                              >
                                {topic.completed ? (
                                  <CheckCircle2 className="w-5 h-5 fill-forest-700 dark:fill-forest-400 text-white dark:text-gray-900" />
                                ) : (
                                  <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 hover:text-forest-600" />
                                )}
                              </button>

                              {/* Topic Name */}
                              <span
                                className={`text-xs font-medium flex-1 ${
                                  topic.completed
                                    ? "line-through text-gray-400 dark:text-gray-500"
                                    : "text-gray-800 dark:text-gray-200"
                                }`}
                              >
                                {topic.name}
                              </span>

                              {/* Confidence Badge (Clickable to cycle) */}
                              <button
                                type="button"
                                onClick={() =>
                                  handleCycleConfidence(chapter._id, topic._id, topic.confidence)
                                }
                                title="Click to cycle confidence (Low / Medium / High)"
                                className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider shrink-0 transition-all ${
                                  confidence === "high"
                                    ? "bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                    : confidence === "low"
                                    ? "bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                    : "bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                                }`}
                              >
                                {confidence}
                              </button>

                              {/* Delete Topic */}
                              <button
                                type="button"
                                onClick={() => handleDeleteTopic(chapter._id, topic._id)}
                                className="p-1 text-gray-300 dark:text-gray-600 hover:text-red-500 shrink-0"
                                title="Remove topic"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-400 italic py-1">
                        No topics in this chapter yet. Add one below:
                      </p>
                    )}

                    {/* Inline Add Topic to this Chapter */}
                    <div className="flex items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Add topic (e.g. Basel III Accords)..."
                        value={newTopicByChapter[chapter._id] || ""}
                        onChange={(e) =>
                          setNewTopicByChapter({
                            ...newTopicByChapter,
                            [chapter._id]: e.target.value,
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddTopic(chapter._id);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddTopic(chapter._id)}
                        className="px-3 py-1.5 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shrink-0 transition-colors"
                      >
                        + Add Topic
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit Exam Details Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Target Exam Details"
      >
        <form onSubmit={handleSaveExamDetails} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Exam Title *
              </label>
              <input
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Subject *
              </label>
              <input
                type="text"
                required
                value={editSubject}
                onChange={(e) => setEditSubject(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Exam Date *
              </label>
              <input
                type="date"
                required
                value={editExamDate}
                onChange={(e) => setEditExamDate(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Target Score (%)
              </label>
              <input
                type="number"
                min={1}
                max={100}
                value={editTargetScore}
                onChange={(e) => setEditTargetScore(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Exam Notes / Strategy
            </label>
            <textarea
              rows={2}
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder="e.g. Focus on quantitative and credit calculation questions..."
              className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-xs"
            >
              Save Changes
            </button>
          </div>
        </form>
      </Modal>

      {/* Chapter Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingChapterId)}
        onClose={() => setDeletingChapterId(null)}
        onConfirm={handleDeleteChapter}
        title="Delete Chapter"
        message="Are you sure you want to delete this chapter and all of its topics? This will adjust your syllabus completion percentage."
        isDestructive={true}
        confirmText="Delete Chapter"
      />

      {/* Exam Deletion Confirmation Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingExamId)}
        onClose={() => setDeletingExamId(null)}
        onConfirm={handleDeleteExam}
        title="Delete Exam Target"
        message="Are you sure you want to remove this target exam? Your study readiness matrix will recompute without it."
        isDestructive={true}
        confirmText="Delete Exam"
      />
    </div>
  );
}
