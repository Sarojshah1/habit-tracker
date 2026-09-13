"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { CheckCircle2, Trophy, Clock, Sparkles, BookOpen, ArrowRight } from "lucide-react";

interface DailyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  todayDateStr: string;
  metrics: {
    habitsCompleted: number;
    habitsTotal: number;
    tasksCompleted: number;
    tasksTotal: number;
    focusMinutes: number;
    productivityScore: number;
  };
  initialReview?: any;
}

export function DailyReviewModal({
  isOpen,
  onClose,
  onSuccess,
  todayDateStr,
  metrics,
  initialReview,
}: DailyReviewModalProps) {
  const [wins, setWins] = useState("");
  const [improvements, setImprovements] = useState("");
  const [saveToNotes, setSaveToNotes] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialReview) {
      setWins(initialReview.wins || "");
      setImprovements(initialReview.improvements || "");
      setSaveToNotes(false);
    } else {
      setWins("");
      setImprovements("");
      setSaveToNotes(true);
    }
  }, [initialReview, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayDateStr,
          wins: wins.trim(),
          improvements: improvements.trim(),
          saveToNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save daily review");
        setIsSaving(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred while saving your review.");
    } finally {
      setIsSaving(false);
    }
  };

  const focusHours = Math.floor(metrics.focusMinutes / 60);
  const focusRem = metrics.focusMinutes % 60;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="End-of-Day Review"
      description="Reflect on today's progress, celebrate wins, and calibrate for tomorrow."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* 4 Summary Stat Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-3 rounded-2xl bg-forest-50/70 border border-forest-100 text-center">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Habits</p>
            <p className="text-lg font-black text-forest-900 mt-0.5">
              {metrics.habitsCompleted} / {metrics.habitsTotal}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-100 text-center">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Tasks</p>
            <p className="text-lg font-black text-blue-900 mt-0.5">
              {metrics.tasksCompleted} / {metrics.tasksTotal}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-center">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Focus</p>
            <p className="text-lg font-black text-amber-900 mt-0.5">
              {focusHours > 0 ? `${focusHours}h ${focusRem}m` : `${focusRem}m`}
            </p>
          </div>

          <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Score</p>
            <p className="text-lg font-black text-emerald-800 mt-0.5">
              {metrics.productivityScore}%
            </p>
          </div>
        </div>

        {/* What went well? */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            What went well today?
          </label>
          <textarea
            value={wins}
            onChange={(e) => setWins(e.target.value)}
            rows={3}
            placeholder="e.g. Cleared chapter 4 practice set without getting distracted, stuck to morning study habit..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-forest-600 outline-none resize-none"
          />
        </div>

        {/* What should improve tomorrow? */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-forest-700" />
            What could be improved tomorrow?
          </label>
          <textarea
            value={improvements}
            onChange={(e) => setImprovements(e.target.value)}
            rows={3}
            placeholder="e.g. Start study session 30 minutes earlier, prepare notebook before starting timer..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-forest-600 outline-none resize-none"
          />
        </div>

        {/* Save to Notes toggle */}
        <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-forest-700" />
            <div>
              <p className="text-xs font-bold text-gray-800">Save Copy to Notes</p>
              <p className="text-[11px] text-gray-400">
                Automatically create a note titled &ldquo;Daily Review — {todayDateStr}&rdquo;
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={saveToNotes}
            onChange={(e) => setSaveToNotes(e.target.checked)}
            className="w-4 h-4 rounded-md accent-forest-700"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Submit Review"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
