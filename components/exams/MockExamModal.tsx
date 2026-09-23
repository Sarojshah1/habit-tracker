"use client";

import React, { useState } from "react";
import { Award, BookOpen, Clock, Calendar, Check, X, Tag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface MockExamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialSubject?: string;
  initialTitle?: string;
  focusSessionId?: string;
  defaultDurationMinutes?: number;
}

export function MockExamModal({
  isOpen,
  onClose,
  onSuccess,
  initialSubject = "",
  initialTitle = "",
  focusSessionId,
  defaultDurationMinutes = 60,
}: MockExamModalProps) {
  const [title, setTitle] = useState(initialTitle || "");
  const [subject, setSubject] = useState(initialSubject || "");
  const [score, setScore] = useState<number | "">("");
  const [totalMarks, setTotalMarks] = useState<number>(100);
  const [date, setDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [durationMinutes, setDurationMinutes] = useState<number>(defaultDurationMinutes);
  const [weakTopicInput, setWeakTopicInput] = useState("");
  const [weakTopics, setWeakTopics] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const percentage =
    typeof score === "number" && totalMarks > 0
      ? Math.round((score / totalMarks) * 1000) / 10
      : 0;

  const handleAddTopic = () => {
    if (weakTopicInput.trim() && !weakTopics.includes(weakTopicInput.trim())) {
      setWeakTopics([...weakTopics, weakTopicInput.trim()]);
      setWeakTopicInput("");
    }
  };

  const handleRemoveTopic = (t: string) => {
    setWeakTopics(weakTopics.filter((item) => item !== t));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject.trim() || score === "") {
      setError("Please fill in Exam Title, Subject, and Score.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/exams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          subject,
          score: Number(score),
          totalMarks: Number(totalMarks),
          date,
          durationMinutes: Number(durationMinutes),
          weakTopics,
          notes,
          focusSessionId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to log mock exam");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Log Mock Exam Score">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        {/* Title & Subject */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Exam / Paper Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Physics Mock Test #2"
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
              placeholder="e.g. Physics, Math, Biology"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        {/* Score & Total Marks */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Your Score *
            </label>
            <input
              type="number"
              required
              min={0}
              step="any"
              placeholder="84"
              value={score}
              onChange={(e) => setScore(e.target.value === "" ? "" : Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-bold focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Out of (Max Marks)
            </label>
            <input
              type="number"
              required
              min={1}
              value={totalMarks}
              onChange={(e) => setTotalMarks(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div className="col-span-2 sm:col-span-1 p-2 rounded-xl bg-forest-50 dark:bg-forest-950/40 border border-forest-100 dark:border-forest-800 text-center">
            <span className="text-[10px] uppercase font-bold text-forest-700 dark:text-forest-400">
              Percentage
            </span>
            <p className="text-lg font-black text-forest-800 dark:text-forest-200">
              {percentage}%
            </p>
          </div>
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Date Completed
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
              Time Taken (Minutes)
            </label>
            <input
              type="number"
              min={1}
              value={durationMinutes}
              onChange={(e) => setDurationMinutes(Number(e.target.value))}
              className="w-full px-3 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
          </div>
        </div>

        {/* Weak Topics to Review */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Weak Topics to Review
          </label>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              placeholder="e.g. Thermodynamics, Integral Calculus"
              value={weakTopicInput}
              onChange={(e) => setWeakTopicInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddTopic();
                }
              }}
              className="flex-1 px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
            />
            <button
              type="button"
              onClick={handleAddTopic}
              className="px-3 py-2 text-xs font-bold rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
            >
              Add
            </button>
          </div>

          {weakTopics.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {weakTopics.map((topic) => (
                <span
                  key={topic}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800"
                >
                  <Tag className="w-3 h-3" />
                  {topic}
                  <button
                    type="button"
                    onClick={() => handleRemoveTopic(topic)}
                    className="hover:text-amber-900 dark:hover:text-amber-100 ml-0.5"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Exam Reflections / Notes
          </label>
          <textarea
            rows={2}
            placeholder="Pacing was good, made silly calculation errors on question 4..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
          />
        </div>

        {/* Buttons */}
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
            {loading ? "Saving..." : "Save Mock Exam"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
