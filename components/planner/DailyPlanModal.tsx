"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { Sun, Check, Target, Clock, Plus, Sparkles } from "lucide-react";

interface DailyPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  todayDateStr: string;
  tasks: any[];
  initialPlan?: any;
}

export function DailyPlanModal({
  isOpen,
  onClose,
  onSuccess,
  todayDateStr,
  tasks,
  initialPlan,
}: DailyPlanModalProps) {
  const [selectedTaskIds, setSelectedTaskIds] = useState<string[]>([]);
  const [focusTargetHours, setFocusTargetHours] = useState<number>(2);
  const [notes, setNotes] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (initialPlan) {
      const ids = (initialPlan.priorityTaskIds || []).map((t: any) =>
        typeof t === "object" ? t._id : t
      );
      setSelectedTaskIds(ids);
      setFocusTargetHours(Math.max(1, Math.round((initialPlan.focusTargetMinutes || 120) / 60)));
      setNotes(initialPlan.notes || "");
    } else {
      // Default: select up to 3 highest priority tasks due today
      const topIds = tasks
        .filter((t) => t.status !== "completed" && t.status !== "cancelled")
        .slice(0, 3)
        .map((t) => t._id);
      setSelectedTaskIds(topIds);
      setFocusTargetHours(2);
      setNotes("");
    }
  }, [initialPlan, tasks, isOpen]);

  const toggleTask = (taskId: string) => {
    if (selectedTaskIds.includes(taskId)) {
      setSelectedTaskIds(selectedTaskIds.filter((id) => id !== taskId));
    } else {
      if (selectedTaskIds.length >= 5) {
        setError("We recommend keeping daily priorities to at most 3–5 items.");
        return;
      }
      setSelectedTaskIds([...selectedTaskIds, taskId]);
      setError("");
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError("");

    try {
      const res = await fetch("/api/daily-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: todayDateStr,
          priorityTaskIds: selectedTaskIds,
          focusTargetMinutes: focusTargetHours * 60,
          notes,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save daily plan");
        setIsSaving(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError("An unexpected error occurred while saving your plan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Morning Planning — Set Today's Priorities"
      description="What are the most impactful things you need to accomplish today?"
      maxWidth="lg"
    >
      <form onSubmit={handleSave} className="space-y-5">
        {error && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {error}
          </div>
        )}

        {/* Priority Tasks Selection */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              Select Top Priorities ({selectedTaskIds.length}/3 recommended)
            </label>
            <span className="text-xs text-gray-400 font-medium">Click to select or unselect</span>
          </div>

          {tasks.length === 0 ? (
            <p className="p-4 bg-gray-50 rounded-2xl text-xs text-gray-500 text-center font-medium border border-gray-100">
              No tasks scheduled for today. You can create tasks on the Tasks page.
            </p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto p-1">
              {tasks.map((task) => {
                const isSelected = selectedTaskIds.includes(task._id);
                return (
                  <div
                    key={task._id}
                    onClick={() => toggleTask(task._id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? "bg-forest-50/70 border-forest-600 shadow-xs"
                        : "bg-white border-gray-200/80 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? "bg-forest-700 border-forest-700 text-white"
                            : "border-gray-300 bg-white"
                        }`}
                      >
                        {isSelected && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </div>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 truncate">{task.title}</p>
                        <p className="text-[10px] text-gray-400 capitalize">
                          {task.priority} priority • {task.estimatedMinutes} min
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="text-[10px] font-extrabold text-forest-700 uppercase tracking-wider bg-forest-100/80 px-2 py-0.5 rounded-full shrink-0">
                        Priority
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Daily Focus Target (Hours) */}
        <div className="pt-2 border-t border-gray-100">
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-forest-700" />
            Today&apos;s Deep Work Target
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[1, 2, 3, 4].map((hours) => (
              <button
                key={hours}
                type="button"
                onClick={() => setFocusTargetHours(hours)}
                className={`py-2 rounded-xl text-xs font-bold transition-all border ${
                  focusTargetHours === hours
                    ? "bg-forest-700 text-white border-forest-700 shadow-xs"
                    : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100"
                }`}
              >
                {hours} {hours === 1 ? "Hour" : "Hours"}
              </button>
            ))}
          </div>
        </div>

        {/* Daily Intention / Notes */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Daily Intention / Mindset
          </label>
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g. Focus deeply on accounting; avoid afternoon phone distractions."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
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
            <Sparkles className="w-3.5 h-3.5" />
            {isSaving ? "Saving..." : "Start My Day"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
