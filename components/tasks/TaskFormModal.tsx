"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Clock, Calendar, Target, CheckCircle2, Flag } from "lucide-react";

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  initialGoalId?: string;
  initialHabitId?: string;
}

export function TaskFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  initialGoalId,
  initialHabitId,
}: TaskFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"high" | "medium" | "low">("medium");
  const [dueDate, setDueDate] = useState(new Date().toISOString().split("T")[0]);
  const [estimatedMinutes, setEstimatedMinutes] = useState(30);
  const [goalId, setGoalId] = useState<string>("");
  const [habitId, setHabitId] = useState<string>("");

  // Scheduling options
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledStartTime, setScheduledStartTime] = useState("09:00");
  const [scheduledEndTime, setScheduledEndTime] = useState("10:00");

  const [availableGoals, setAvailableGoals] = useState<any[]>([]);
  const [availableHabits, setAvailableHabits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Fetch goals & habits for selection
      Promise.all([
        fetch("/api/goals?filter=active").then((r) => r.json()),
        fetch("/api/habits?filter=active").then((r) => r.json()),
      ])
        .then(([goalsData, habitsData]) => {
          if (goalsData.success) setAvailableGoals(goalsData.goals || []);
          if (habitsData.success) setAvailableHabits(habitsData.habits || []);
        })
        .catch((err) => console.error("Failed to fetch goals/habits for task form:", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setPriority(initialData.priority || "medium");
      setDueDate(initialData.dueDate || new Date().toISOString().split("T")[0]);
      setEstimatedMinutes(initialData.estimatedMinutes || 30);
      setGoalId(initialData.goalId?._id || initialData.goalId || "");
      setHabitId(initialData.habitId?._id || initialData.habitId || "");

      if (initialData.scheduledStart && initialData.scheduledEnd) {
        setIsScheduled(true);
        const sTime = new Date(initialData.scheduledStart).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        const eTime = new Date(initialData.scheduledEnd).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });
        setScheduledStartTime(sTime);
        setScheduledEndTime(eTime);
      } else {
        setIsScheduled(false);
      }
    } else {
      setTitle("");
      setDescription("");
      setPriority("medium");
      setDueDate(new Date().toISOString().split("T")[0]);
      setEstimatedMinutes(30);
      setGoalId(initialGoalId || "");
      setHabitId(initialHabitId || "");
      setIsScheduled(false);
      setScheduledStartTime("09:00");
      setScheduledEndTime("10:00");
    }
    setError("");
  }, [initialData, initialGoalId, initialHabitId, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsLoading(true);

    try {
      let scheduledStart: string | null = null;
      let scheduledEnd: string | null = null;

      if (isScheduled && scheduledStartTime && scheduledEndTime) {
        scheduledStart = new Date(`${dueDate}T${scheduledStartTime}:00`).toISOString();
        scheduledEnd = new Date(`${dueDate}T${scheduledEndTime}:00`).toISOString();
      }

      const payload = {
        title: title.trim(),
        description: description.trim(),
        priority,
        dueDate,
        estimatedMinutes: Number(estimatedMinutes) || 30,
        goalId: goalId || null,
        habitId: habitId || null,
        scheduledStart,
        scheduledEnd,
      };

      const url = initialData ? `/api/tasks/${initialData._id}` : "/api/tasks";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save task");
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Task" : "Create New Task"}
      description="Turn your goals and plans into actionable, completed deliverables."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Task Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Task Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Complete Chapter 5 practice questions..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
            required
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Description / Notes (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="What needs to be accomplished? Key requirements..."
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none resize-none"
          />
        </div>

        {/* Priority & Due Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["low", "medium", "high"] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                    priority === p
                      ? p === "high"
                        ? "bg-red-50 border-red-500 text-red-800 shadow-xs"
                        : p === "medium"
                        ? "bg-amber-50 border-amber-500 text-amber-800 shadow-xs"
                        : "bg-blue-50 border-blue-500 text-blue-800 shadow-xs"
                      : "bg-white border-gray-200 text-gray-500 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
              required
            />
          </div>
        </div>

        {/* Duration */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Estimated Duration (Minutes)
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              min={5}
              max={720}
              step={5}
              value={estimatedMinutes}
              onChange={(e) => setEstimatedMinutes(Number(e.target.value))}
              className="w-28 px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none font-bold text-center"
            />
            <span className="text-xs text-gray-500 font-medium">
              ({Math.floor(estimatedMinutes / 60) > 0 ? `${Math.floor(estimatedMinutes / 60)}h ` : ""}
              {estimatedMinutes % 60}m)
            </span>
          </div>
        </div>

        {/* Linked Goal & Linked Habit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-forest-700" />
              Link to Goal (Optional)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
            >
              <option value="">No linked goal</option>
              {availableGoals.map((g) => (
                <option key={g._id} value={g._id}>
                  {g.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-forest-700" />
              Link to Habit (Optional)
            </label>
            <select
              value={habitId}
              onChange={(e) => setHabitId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
            >
              <option value="">No linked habit</option>
              {availableHabits.map((h) => (
                <option key={h._id} value={h._id}>
                  {h.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Schedule Time Blocking Toggle */}
        <div className="pt-3 border-t border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-800 uppercase tracking-wider">
                Schedule in Calendar Timeline
              </p>
              <p className="text-[11px] text-gray-400">
                Block dedicated time on your daily schedule
              </p>
            </div>
            <input
              type="checkbox"
              checked={isScheduled}
              onChange={(e) => setIsScheduled(e.target.checked)}
              className="w-4 h-4 rounded-md accent-forest-700"
            />
          </div>

          {isScheduled && (
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50 rounded-xl border border-gray-200/80 animate-in fade-in duration-150">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">Start Time</label>
                <input
                  type="time"
                  value={scheduledStartTime}
                  onChange={(e) => setScheduledStartTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-forest-600"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-600 mb-1">End Time</label>
                <input
                  type="time"
                  value={scheduledEndTime}
                  onChange={(e) => setScheduledEndTime(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:border-forest-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-sm font-semibold text-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : initialData ? "Update Task" : "Create Task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
