"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  MoreVertical,
  Clock,
  CheckCircle2,
  Pause,
  Play,
  Archive,
  Trash2,
  Edit,
  ArrowRight,
  Sparkles,
  AlertTriangle,
} from "lucide-react";
import { HabitIcon } from "@/components/ui/HabitIcon";

interface GoalCardProps {
  goal: any;
  onEdit: (goal: any) => void;
  onPauseToggle: (goal: any) => void;
  onArchiveToggle: (goal: any) => void;
  onDelete: (goal: any) => void;
}

export function GoalCard({
  goal,
  onEdit,
  onPauseToggle,
  onArchiveToggle,
  onDelete,
}: GoalCardProps) {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const progress = goal.progress || {
    currentValue: goal.currentValue || 0,
    targetValue: goal.targetValue || 1,
    percentage: Math.min(100, Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100)),
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

  // Status badge styling
  let badgeColor = "bg-forest-50 dark:bg-forest-950/40 text-forest-700 dark:text-forest-300 border-forest-100 dark:border-forest-900/60";
  let badgeLabel = "Active";

  if (isCompleted) {
    badgeColor = "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/60";
    badgeLabel = "Completed";
  } else if (isPaused) {
    badgeColor = "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-900/60";
    badgeLabel = "Paused";
  } else if (isArchived) {
    badgeColor = "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700";
    badgeLabel = "Archived";
  } else if (isOverdue) {
    badgeColor = "bg-red-100 dark:bg-red-950/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-900/60";
    badgeLabel = "Overdue";
  } else if (isAtRisk) {
    badgeColor = "bg-orange-100 dark:bg-orange-950/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-900/60";
    badgeLabel = "At Risk";
  }

  const linkedHabits =
    goal.habitIds && goal.habitIds.length > 0
      ? goal.habitIds
      : goal.associatedHabitIds || [];

  return (
    <div
      className={`rounded-2xl border transition-all duration-200 p-5 sm:p-6 flex flex-col justify-between relative group ${
        isCompleted
          ? "bg-gradient-to-br from-white dark:from-gray-900 to-emerald-50/30 dark:to-emerald-950/20 border-emerald-200 dark:border-emerald-900/40 shadow-sm"
          : isPaused
          ? "bg-gray-50/60 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-80"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-sm hover:shadow-md"
      }`}
    >
      <div>
        {/* Top bar: Icon + Title + Status + Action Menu */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            <Link href={`/goals/${goal._id}`} className="shrink-0">
              <HabitIcon name={goal.icon || "target"} color={goal.color || "#1B4332"} size="md" />
            </Link>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <Link
                  href={`/goals/${goal._id}`}
                  className="text-base font-bold text-gray-900 dark:text-gray-100 hover:text-forest-700 dark:hover:text-forest-400 transition-colors truncate block"
                >
                  {goal.title}
                </Link>
                <span
                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${badgeColor}`}
                >
                  {badgeLabel}
                </span>
              </div>

              {goal.description && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 font-medium">
                  {goal.description}
                </p>
              )}
            </div>
          </div>

          {/* Action Menu */}
          <div ref={menuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Goal options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-44 bg-white dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 p-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                <Link
                  href={`/goals/${goal._id}`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-forest-50 dark:hover:bg-forest-950/40 hover:text-forest-900 dark:hover:text-forest-300 rounded-lg transition-colors"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  View Goal
                </Link>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(goal);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  Edit Goal
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onPauseToggle(goal);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  {isPaused ? (
                    <>
                      <Play className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
                      Resume Goal
                    </>
                  ) : (
                    <>
                      <Pause className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                      Pause Goal
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onArchiveToggle(goal);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <Archive className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  {isArchived ? "Restore Goal" : "Archive Goal"}
                </button>

                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(goal);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Goal
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Progress Display */}
        <div className="mt-5 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              <span>
                {progress.currentValue} / {progress.targetValue} {goal.unit}
              </span>
              {goal.trackingMode === "manual" && (
                <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">(manual)</span>
              )}
            </span>
            <span className={isCompleted ? "text-emerald-700 dark:text-emerald-400" : "text-forest-800 dark:text-forest-300"}>
              {progress.percentage}%
            </span>
          </div>

          {/* Accessible Progress Bar */}
          <div
            className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden"
            role="progressbar"
            aria-valuenow={progress.percentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`Goal progress for ${goal.title}`}
          >
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isCompleted
                  ? "bg-emerald-600 dark:bg-emerald-500"
                  : isPaused
                  ? "bg-amber-500 dark:bg-amber-400"
                  : isOverdue
                  ? "bg-red-500 dark:bg-red-400"
                  : "bg-forest-600 dark:bg-forest-500"
              }`}
              style={{ width: `${progress.percentage}%` }}
            />
          </div>
        </div>

        {/* Linked Habits Chips */}
        {linkedHabits.length > 0 && (
          <div className="mt-4 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex flex-wrap gap-1.5 items-center">
            <span className="text-[11px] text-gray-400 dark:text-gray-500 font-semibold mr-1">Habits:</span>
            {linkedHabits.map((h: any) => {
              const hName = typeof h === "object" ? h.name : "Habit";
              const hColor = typeof h === "object" ? h.color : "#2D6A4F";
              const hId = typeof h === "object" ? h._id : h;

              return (
                <Link
                  key={hId}
                  href="/habits"
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-gray-50 dark:bg-gray-800 hover:bg-forest-50 dark:hover:bg-forest-950/40 hover:text-forest-900 dark:hover:text-forest-300 text-gray-700 dark:text-gray-300 border border-gray-200/80 dark:border-gray-700 transition-colors"
                >
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: hColor }}
                  />
                  <span className="truncate max-w-[120px]">{hName}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer: Deadline & Quick View Link */}
      <div className="mt-5 pt-3.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 font-medium">
          <Clock className={`w-3.5 h-3.5 ${isOverdue ? "text-red-500 dark:text-red-400" : "text-gray-400 dark:text-gray-500"}`} />
          <span
            className={
              isOverdue
                ? "text-red-600 dark:text-red-400 font-bold"
                : isCompleted
                ? "text-emerald-700 dark:text-emerald-400 font-semibold"
                : "text-gray-500 dark:text-gray-400"
            }
          >
            {isCompleted ? "Goal Completed 🎉" : progress.deadlineText}
          </span>
        </div>

        <Link
          href={`/goals/${goal._id}`}
          className="font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 inline-flex items-center gap-1 group"
        >
          View Goal
          <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}
