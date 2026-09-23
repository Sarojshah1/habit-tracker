"use client";

import React, { useState } from "react";
import { Plus, Trash2, Calendar, Target, BookOpen, Layers } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface ExamTargetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ExamTargetModal({ isOpen, onClose, onSuccess }: ExamTargetModalProps) {
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [examDate, setExamDate] = useState("");
  const [targetScore, setTargetScore] = useState(90);
  const [color, setColor] = useState("#1B4332");
  const [notes, setNotes] = useState("");

  // Syllabus Chapters & Topics builder
  const [chapters, setChapters] = useState<
    { title: string; topics: { name: string; completed: boolean }[] }[]
  >([
    {
      title: "Unit 1: Fundamentals",
      topics: [
        { name: "Core Principles & Definitions", completed: false },
        { name: "Essential Formulas / Theorems", completed: false },
      ],
    },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddChapter = () => {
    setChapters([
      ...chapters,
      {
        title: `Unit ${chapters.length + 1}: Key Topics`,
        topics: [{ name: "Topic Overview", completed: false }],
      },
    ]);
  };

  const handleAddTopic = (chapterIndex: number) => {
    const updated = [...chapters];
    updated[chapterIndex].topics.push({ name: "", completed: false });
    setChapters(updated);
  };

  const handleRemoveChapter = (chapterIndex: number) => {
    setChapters(chapters.filter((_, idx) => idx !== chapterIndex));
  };

  const handleRemoveTopic = (chapterIndex: number, topicIndex: number) => {
    const updated = [...chapters];
    updated[chapterIndex].topics = updated[chapterIndex].topics.filter((_, idx) => idx !== topicIndex);
    setChapters(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || !examDate) {
      setError("Please fill in Exam Title, Subject, and Exam Date.");
      return;
    }

    setLoading(true);
    setError(null);

    // Clean up empty topic names
    const cleanedSyllabus = chapters
      .map((c) => ({
        title: c.title.trim() || "Untitled Unit",
        topics: c.topics
          .filter((t) => t.name.trim().length > 0)
          .map((t) => ({ name: t.name.trim(), completed: false })),
      }))
      .filter((c) => c.topics.length > 0);

    try {
      const res = await fetch("/api/exam-targets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          examDate,
          targetScore: Number(targetScore),
          color,
          syllabus: cleanedSyllabus,
          notes,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to create exam target");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Set Target Exam & Syllabus">
      <form onSubmit={handleSubmit} className="space-y-4 max-h-[75vh] overflow-y-auto pr-1">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Exam Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. AP Physics Final, MCAT, Midterms"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Subject *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Physics, Math, Chemistry"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
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
              value={examDate}
              onChange={(e) => setExamDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
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
              value={targetScore}
              onChange={(e) => setTargetScore(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        {/* Syllabus Breakdown Section */}
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
                Syllabus Chapters & Topics
              </h4>
              <p className="text-[11px] text-gray-400 dark:text-gray-500">
                Organize your study units to track preparation progress.
              </p>
            </div>
            <button
              type="button"
              onClick={handleAddChapter}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 hover:bg-forest-100 dark:hover:bg-forest-900/60 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Unit
            </button>
          </div>

          {chapters.map((chapter, cIdx) => (
            <div
              key={cIdx}
              className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-2.5"
            >
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Chapter / Unit Title"
                  value={chapter.title}
                  onChange={(e) => {
                    const updated = [...chapters];
                    updated[cIdx].title = e.target.value;
                    setChapters(updated);
                  }}
                  className="flex-1 px-3 py-1.5 text-xs font-bold rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveChapter(cIdx)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500"
                  title="Remove Unit"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1.5 pl-2 border-l-2 border-forest-500/30">
                {chapter.topics.map((topic, tIdx) => (
                  <div key={tIdx} className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Topic name (e.g. Newton's 3 Laws)"
                      value={topic.name}
                      onChange={(e) => {
                        const updated = [...chapters];
                        updated[cIdx].topics[tIdx].name = e.target.value;
                        setChapters(updated);
                      }}
                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(cIdx, tIdx)}
                      className="p-1 text-gray-400 hover:text-red-500"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => handleAddTopic(cIdx)}
                  className="text-[11px] font-bold text-forest-700 dark:text-forest-400 hover:underline flex items-center gap-1 pt-1"
                >
                  <Plus className="w-3 h-3" />
                  Add Topic
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-xs disabled:opacity-50"
          >
            {loading ? "Creating..." : "Save Exam Countdown"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
