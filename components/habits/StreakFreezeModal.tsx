"use client";

import React, { useState, useEffect } from "react";
import { Shield, Sparkles, AlertCircle, CheckCircle2, X } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface StreakFreezeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultHabitId?: string;
  defaultDate?: string;
}

export function StreakFreezeModal({
  isOpen,
  onClose,
  onSuccess,
  defaultHabitId,
  defaultDate,
}: StreakFreezeModalProps) {
  const [available, setAvailable] = useState<number>(3);
  const [targetDate, setTargetDate] = useState<string>(
    defaultDate || new Date().toISOString().split("T")[0]
  );
  const [reason, setReason] = useState("Exam prep & mock test study");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setMessage(null);
      fetch("/api/habits/freeze")
        .then((res) => res.json())
        .then((data) => {
          if (data.success && typeof data.available === "number") {
            setAvailable(data.available);
          }
        })
        .catch((err) => console.error("Error loading freeze tokens:", err));
    }
  }, [isOpen]);

  const handleApplyFreeze = async () => {
    if (available <= 0) return;
    setLoading(true);
    setMessage(null);

    try {
      const res = await fetch("/api/habits/freeze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: targetDate,
          habitId: defaultHabitId,
          reason,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setAvailable(data.available);
        setMessage({ text: data.message || "Streak protected successfully!", type: "success" });
        if (onSuccess) onSuccess();
        setTimeout(() => {
          onClose();
        }, 1500);
      } else {
        setMessage({ text: data.message || "Failed to activate streak freeze", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Network error", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Streak Freeze Shield">
      <div className="space-y-5">
        {/* Token Balance Card */}
        <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500/10 via-sky-500/5 to-transparent border border-cyan-200/50 dark:border-cyan-800/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-100 dark:bg-cyan-950/70 border border-cyan-200 dark:border-cyan-800 flex items-center justify-center text-cyan-600 dark:text-cyan-400">
              <Shield className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-semibold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider">
                Exam Protection Tokens
              </p>
              <h4 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {available} {available === 1 ? "Token" : "Tokens"} Available
              </h4>
            </div>
          </div>
          <span className="text-2xl">❄️</span>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
          Going to be occupied with mock tests or revision? Activate a Streak Freeze to safeguard
          your habit streaks on any given day without breaking your active consistency records!
        </p>

        {/* Date Selector */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Shield Date
          </label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Reason / Exam Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
            Reason / Exam Name
          </label>
          <input
            type="text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Physics Mock Exam #2 or All-night cram session"
            className="w-full px-3.5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        {/* Status / Feedback message */}
        {message && (
          <div
            className={`p-3 rounded-xl flex items-center gap-2.5 text-xs font-medium ${
              message.type === "success"
                ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                : "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{message.text}</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleApplyFreeze}
            disabled={loading || available <= 0}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Shield className="w-4 h-4" />
            {loading ? "Protecting..." : "Activate Freeze Shield"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
