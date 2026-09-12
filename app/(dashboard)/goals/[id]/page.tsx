"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Pause,
  Play,
  Archive,
  Trash2,
  Clock,
  CheckCircle2,
  Calendar as CalendarIcon,
  Sparkles,
  ExternalLink,
  Plus,
  Minus,
  AlertTriangle,
} from "lucide-react";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { GoalProgressChart } from "@/components/goals/GoalProgressChart";

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [goal, setGoal] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Manual Progress State
  const [manualValue, setManualValue] = useState<number>(0);
  const [isUpdatingProgress, setIsUpdatingProgress] = useState(false);

  // Modals & Dialogs
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const fetchGoal = useCallback(async () => {
    if (!id) return;
    try {
      setError(false);
      const res = await fetch(`/api/goals/${id}`);
      if (!res.ok) throw new Error("Failed to load goal");
      const data = await res.json();

      if (data.success && data.goal) {
        setGoal(data.goal);
        setManualValue(data.goal.currentValue || 0);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Goal detail error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchGoal();
  }, [fetchGoal]);

  const handlePauseToggle = async () => {
    if (!goal) return;
    try {
      const endpoint = goal.status === "paused" ? `/api/goals/${goal._id}/resume` : `/api/goals/${goal._id}/pause`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) fetchGoal();
    } catch (err) {
      console.error("Failed to toggle pause:", err);
    }
  };

  const handleArchiveToggle = async () => {
    if (!goal) return;
    try {
      const res = await fetch(`/api/goals/${goal._id}/archive`, { method: "POST" });
      if (res.ok) fetchGoal();
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!goal) return;
    try {
      const res = await fetch(`/api/goals/${goal._id}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/goals");
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  const handleManualProgressSave = async (newValue: number) => {
    if (!goal || goal.trackingMode !== "manual") return;
    setIsUpdatingProgress(true);
    try {
      const res = await fetch(`/api/goals/${goal._id}/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: newValue }),
      });
      if (res.ok) {
        setManualValue(newValue);
        fetchGoal();
      }
    } catch (err) {
      console.error("Failed to update manual progress:", err);
    } finally {
      setIsUpdatingProgress(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/4 animate-pulse" />
        <LoadingSkeleton count={3} />
      </div>
    );
  }

  if (error || !goal) {
    return (
      <ErrorState
        title="Goal not found"
        message="The goal you are trying to view does not exist or you do not have permission to view it."
        onRetry={fetchGoal}
      />
    );
  }

  const progress = goal.progress || {
    currentValue: goal.currentValue || 0,
    targetValue: goal.targetValue || 1,
    percentage: 0,
    daysRemaining: 0,
    deadlineText: "Due soon",
    isOverdue: false,
    effectiveStatus: goal.status || "active",
    isAtRisk: false,
  };

  const isCompleted = progress.effectiveStatus === "completed" || goal.status === "completed";
  const isPaused = goal.status === "paused";
  const isArchived = goal.status === "archived";
  const isOverdue = progress.effectiveStatus === "overdue" && !isCompleted;
  const isAtRisk = progress.isAtRisk && !isCompleted && !isPaused && !isArchived;

  let badgeColor = "bg-forest-50 text-forest-700 border-forest-200";
  let badgeLabel = "Active";

  if (isCompleted) {
    badgeColor = "bg-emerald-100 text-emerald-800 border-emerald-300";
    badgeLabel = "Completed";
  } else if (isPaused) {
    badgeColor = "bg-amber-100 text-amber-800 border-amber-200";
    badgeLabel = "Paused";
  } else if (isArchived) {
    badgeColor = "bg-gray-100 text-gray-700 border-gray-200";
    badgeLabel = "Archived";
  } else if (isOverdue) {
    badgeColor = "bg-red-100 text-red-800 border-red-200";
    badgeLabel = "Overdue";
  } else if (isAtRisk) {
    badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
    badgeLabel = "At Risk";
  }

  const linkedHabits =
    goal.habitIds && goal.habitIds.length > 0
      ? goal.habitIds
      : goal.associatedHabitIds || [];

  return (
    <div className="space-y-8">
      {/* Back Link */}
      <div>
        <Link
          href="/goals"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-forest-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Goals
        </Link>
      </div>

      {/* Main Goal Hero Card */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 pb-6 border-b border-gray-100">
          <div className="flex items-start gap-4 min-w-0">
            <HabitIcon name={goal.icon || "target"} color={goal.color || "#1B4332"} size="lg" />

            <div className="min-w-0">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  {goal.title}
                </h1>
                <span
                  className={`text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border ${badgeColor}`}
                >
                  {badgeLabel}
                </span>
              </div>

              {goal.description && (
                <p className="text-sm text-gray-600 mt-2 leading-relaxed font-medium max-w-2xl">
                  {goal.description}
                </p>
              )}

              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400 font-medium flex-wrap">
                <span className="capitalize">
                  Type: <strong>{goal.type?.replace("_", " ")}</strong>
                </span>
                <span>•</span>
                <span>
                  Tracking: <strong>{goal.trackingMode}</strong>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <CalendarIcon className="w-3.5 h-3.5" />
                  {goal.startDate} to {goal.endDate}
                </span>
              </div>
            </div>
          </div>

          {/* Actions Bar */}
          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              Edit Goal
            </button>

            <button
              type="button"
              onClick={handlePauseToggle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {isPaused ? (
                <>
                  <Play className="w-3.5 h-3.5 text-forest-600" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="w-3.5 h-3.5 text-amber-600" />
                  Pause
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleArchiveToggle}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-3.5 h-3.5" />
              {isArchived ? "Restore" : "Archive"}
            </button>

            <button
              type="button"
              onClick={() => setIsDeleteDialogOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-100 text-xs font-bold text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete
            </button>
          </div>
        </div>

        {/* Large Progress Hero Section */}
        <div className="pt-6 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <div className="flex items-baseline justify-between gap-4">
              <div>
                <span className="text-3xl sm:text-4xl font-black text-gray-900">
                  {progress.currentValue}
                </span>
                <span className="text-xl font-bold text-gray-400 ml-1">
                  / {progress.targetValue} {goal.unit}
                </span>
              </div>
              <span
                className={`text-2xl font-black ${
                  isCompleted ? "text-emerald-600" : "text-forest-700"
                }`}
              >
                {progress.percentage}%
              </span>
            </div>

            {/* Large Progress Bar */}
            <div
              className="w-full bg-gray-100 h-4 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={progress.percentage}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  isCompleted
                    ? "bg-emerald-600"
                    : isPaused
                    ? "bg-amber-500"
                    : isOverdue
                    ? "bg-red-500"
                    : "bg-forest-600"
                }`}
                style={{ width: `${progress.percentage}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs text-gray-500 font-medium pt-1">
              <span className="flex items-center gap-1.5">
                <Clock className={`w-4 h-4 ${isOverdue ? "text-red-500" : "text-gray-400"}`} />
                <span className={isOverdue ? "text-red-600 font-bold" : ""}>
                  {progress.deadlineText}
                </span>
              </span>
              <span>
                {progress.remainingValue} {goal.unit} remaining
              </span>
            </div>
          </div>

          {/* Quick Stats Pill or Manual Control */}
          <div className="md:col-span-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100 flex flex-col justify-center">
            {goal.trackingMode === "manual" ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Update Progress (Manual)
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleManualProgressSave(Math.max(0, manualValue - 1))}
                    disabled={isUpdatingProgress || manualValue <= 0}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={manualValue}
                    onChange={(e) => setManualValue(parseInt(e.target.value, 10) || 0)}
                    onBlur={() => handleManualProgressSave(manualValue)}
                    className="w-full text-center py-2 px-3 bg-white border border-gray-200 rounded-xl text-sm font-bold text-gray-900 focus:outline-none focus:border-forest-600"
                  />
                  <button
                    type="button"
                    onClick={() => handleManualProgressSave(manualValue + 1)}
                    disabled={isUpdatingProgress}
                    className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-[11px] text-gray-400 text-center font-medium">
                  Directly adjust value or type in new number
                </p>
              </div>
            ) : (
              <div className="space-y-2 text-center">
                <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto">
                  <Sparkles className="w-4 h-4" />
                </div>
                <p className="text-xs font-bold text-gray-900">Automatic Habit Tracking</p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Progress is automatically computed from your habit check-ins. No manual entry needed.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Habits Grid */}
      <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div>
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Connected Habits</h2>
            <p className="text-xs text-gray-400 font-medium">
              Every completion of these habits contributes directly to this goal.
            </p>
          </div>
          <Link
            href="/habits"
            className="text-xs font-bold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1"
          >
            Manage Habits
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>

        {linkedHabits.length === 0 ? (
          <div className="p-8 text-center text-xs text-gray-400 font-medium">
            No habits linked to this goal. You can edit this goal to connect existing habits.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedHabits.map((habit: any) => {
              const hName = typeof habit === "object" ? habit.name : "Habit";
              const hIcon = typeof habit === "object" ? habit.icon : "check-circle";
              const hColor = typeof habit === "object" ? habit.color : "#1B4332";
              const hFreq = typeof habit === "object" ? habit.frequency : "daily";
              const hTime = typeof habit === "object" ? habit.schedule?.time || "Anytime" : "Anytime";

              return (
                <div
                  key={typeof habit === "object" ? habit._id : habit}
                  className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <HabitIcon name={hIcon} color={hColor} size="md" />
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-900 truncate">{hName}</p>
                      <p className="text-xs text-gray-400 font-medium mt-0.5 flex items-center gap-1.5">
                        <span className="capitalize">{hFreq?.replace("_", " ")}</span>
                        <span>•</span>
                        <span>{hTime}</span>
                      </p>
                    </div>
                  </div>

                  <Link
                    href="/habits"
                    className="p-2 rounded-xl text-gray-400 hover:text-forest-700 hover:bg-white transition-colors shrink-0"
                    title="View in Habits"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Progress History Chart & Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 tracking-tight">Progress Trajectory</h2>
            <p className="text-xs text-gray-400 font-medium">Cumulative progress recorded over time</p>
          </div>

          <GoalProgressChart
            history={goal.history || []}
            targetValue={goal.targetValue}
            unit={goal.unit}
            color={goal.color || "#1B4332"}
          />
        </div>

        {/* Weekly Breakdown / Milestones (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-4">
          <div className="pb-3 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Milestones</h3>
            <p className="text-xs text-gray-400 font-medium">Progress timeline points</p>
          </div>

          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {goal.history && goal.history.length > 0 ? (
              goal.history.slice(-8).reverse().map((pt: any) => (
                <div
                  key={pt.date}
                  className="p-3 rounded-xl bg-gray-50/70 border border-gray-100 flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-gray-700">{pt.date}</span>
                  <span className="font-black text-forest-800">
                    {pt.value} / {goal.targetValue} ({pt.percentage}%)
                  </span>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-400 text-center py-6">No milestone points yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <GoalFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={fetchGoal}
        initialData={goal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete this goal?"
        message={`Are you sure you want to delete "${goal.title}"? Your habits and their completion histories will NOT be deleted.`}
        isDestructive={true}
        confirmText="Delete Goal"
      />
    </div>
  );
}
