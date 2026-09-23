"use client";

import React, { useState } from "react";
import { Plus, Zap, CheckCircle2 } from "lucide-react";

interface QuickCaptureBarProps {
  onSuccess: () => void;
}

export function QuickCaptureBar({ onSuccess }: QuickCaptureBarProps) {
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    setLoading(true);
    setFeedback(null);

    const text = input.trim();
    const today = new Date().toISOString().split("T")[0];

    try {
      if (text.startsWith("#habit ") || text.endsWith(" #habit")) {
        // Quick habit creation
        const habitName = text.replace(/#habit/gi, "").trim();
        await fetch("/api/habits", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: habitName,
            frequency: "daily",
            startDate: today,
            icon: "check-circle",
            color: "#1B4332",
          }),
        });
        setFeedback(`Habit "${habitName}" created!`);
      } else if (text.startsWith("#exam ") || text.endsWith(" #exam")) {
        // Quick exam score log: e.g. "84/100 Physics #exam"
        const clean = text.replace(/#exam/gi, "").trim();
        const scoreMatch = clean.match(/(\d+)\s*\/\s*(\d+)/);
        const score = scoreMatch ? Number(scoreMatch[1]) : 80;
        const totalMarks = scoreMatch ? Number(scoreMatch[2]) : 100;
        const subject = clean.replace(/(\d+)\s*\/\s*(\d+)/, "").trim() || "General Paper";

        await fetch("/api/exams", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: `Quick Log: ${subject}`,
            subject,
            score,
            totalMarks,
            date: today,
          }),
        });
        setFeedback(`Mock Exam "${subject}: ${score}/${totalMarks}" logged!`);
      } else {
        // Default: Create Task
        await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: text,
            priority: "medium",
            dueDate: today,
          }),
        });
        setFeedback(`Task "${text}" added to today's schedule!`);
      }

      setInput("");
      onSuccess();
      setTimeout(() => setFeedback(null), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleCapture} className="relative flex items-center">
        <div className="absolute left-4 text-emerald-600 dark:text-emerald-400">
          <Zap className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="⚡ Lightning capture: Type anything to add a task, or end with #habit or #exam (e.g. 'Read DBMS 30m' or 'Solve 84/100 Math #exam')..."
          className="w-full pl-11 pr-24 py-3 text-xs sm:text-sm rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-forest-500 shadow-xs transition-all"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="absolute right-2 px-3.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs disabled:opacity-40 transition-all flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {feedback && (
        <div className="mt-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5 animate-in fade-in">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
