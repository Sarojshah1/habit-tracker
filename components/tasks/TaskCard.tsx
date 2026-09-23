"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Check,
  Clock,
  Target,
  MoreVertical,
  Edit,
  Trash2,
  XCircle,
  Play,
  Calendar,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { HabitIcon } from "@/components/ui/HabitIcon";

interface TaskCardProps {
  task: any;
  onToggleComplete: (task: any) => void;
  onEdit: (task: any) => void;
  onDelete: (task: any) => void;
  onCancel?: (task: any) => void;
  onStartFocus?: (task: any) => void;
  todayDateStr: string;
}

export function TaskCard({
  task,
  onToggleComplete,
  onEdit,
  onDelete,
  onCancel,
  onStartFocus,
  todayDateStr,
}: TaskCardProps) {
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

  const isCompleted = task.status === "completed";
  const isCancelled = task.status === "cancelled";
  const isDueToday = task.dueDate === todayDateStr;
  const isOverdue = !isCompleted && !isCancelled && task.dueDate < todayDateStr;

  // Priority styling
  let priorityBadge = "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700";
  if (task.priority === "high") {
    priorityBadge = "bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 border-red-200/80 dark:border-red-900/60";
  } else if (task.priority === "medium") {
    priorityBadge = "bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200/80 dark:border-amber-900/60";
  } else if (task.priority === "low") {
    priorityBadge = "bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200/80 dark:border-blue-900/60";
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all duration-150 flex flex-col justify-between gap-3 ${
        isCompleted
          ? "bg-forest-50/40 dark:bg-forest-950/20 border-forest-100 dark:border-forest-900/40 opacity-80"
          : isCancelled
          ? "bg-gray-50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60 line-through"
          : isOverdue
          ? "bg-red-50/30 dark:bg-red-950/20 border-red-100 dark:border-red-900/40 hover:border-red-200 dark:hover:border-red-800 shadow-xs"
          : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700 shadow-xs hover:shadow-sm"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Left: Checkbox + Title + Meta */}
        <div className="flex items-start gap-3.5 min-w-0 flex-1">
          {/* Custom Toggle Checkbox */}
          <button
            type="button"
            onClick={() => onToggleComplete(task)}
            disabled={isCancelled}
            className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 mt-0.5 ${
              isCompleted
                ? "bg-forest-700 text-white shadow-xs"
                : "border-2 border-gray-300 dark:border-gray-600 hover:border-forest-600 bg-white dark:bg-gray-800"
            }`}
            aria-label={`Mark task ${task.title} as ${isCompleted ? "incomplete" : "complete"}`}
          >
            {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
          </button>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h4
                className={`text-sm font-bold truncate transition-colors ${
                  isCompleted ? "line-through text-gray-400 dark:text-gray-500 font-medium" : "text-gray-900 dark:text-gray-100"
                }`}
              >
                {task.title}
              </h4>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${priorityBadge}`}
              >
                {task.priority}
              </span>
            </div>

            {task.description && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2 font-medium">
                {task.description}
              </p>
            )}

            {/* Time & Due Meta */}
            <div className="flex items-center gap-3 mt-2 text-xs font-medium flex-wrap">
              <span
                className={`flex items-center gap-1 ${
                  isOverdue
                    ? "text-red-600 dark:text-red-400 font-bold"
                    : isDueToday
                    ? "text-forest-700 dark:text-forest-400 font-bold"
                    : "text-gray-500 dark:text-gray-400"
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                {isDueToday ? "Due Today" : isOverdue ? `Overdue (${task.dueDate})` : `Due ${task.dueDate}`}
              </span>

              <span className="text-gray-300 dark:text-gray-700">•</span>

              <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                {task.estimatedMinutes} min
                {task.actualMinutes > 0 && (
                  <span className="text-forest-700 dark:text-forest-400 font-semibold ml-1">
                    ({task.actualMinutes}m spent)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Right Menu & Quick Focus */}
        <div className="flex items-center gap-1.5 shrink-0">
          {!isCompleted && !isCancelled && onStartFocus && (
            <button
              type="button"
              onClick={() => onStartFocus(task)}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-forest-50 dark:bg-forest-950/40 hover:bg-forest-100 dark:hover:bg-forest-900/60 text-forest-800 dark:text-forest-300 text-xs font-bold transition-colors"
              title="Start focus session on this task"
            >
              <Play className="w-3 h-3 fill-current" />
              Focus
            </button>
          )}

          <div ref={menuRef} className="relative">
            <button
              type="button"
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Task options"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-elevated border border-gray-100 dark:border-gray-700 p-1.5 z-20 animate-in fade-in zoom-in-95 duration-150">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onEdit(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors text-left"
                >
                  <Edit className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500" />
                  Edit Task
                </button>

                {!isCompleted && onCancel && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowMenu(false);
                      onCancel(task);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/30 rounded-lg transition-colors text-left"
                  >
                    <XCircle className="w-3.5 h-3.5 text-amber-500" />
                    Cancel Task
                  </button>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700 my-1" />

                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onDelete(task);
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors text-left"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Task
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Linked Goal & Habit Chips */}
      {(task.goalId || task.habitId) && (
        <div className="pt-2 border-t border-gray-100/80 dark:border-gray-800 flex flex-wrap gap-2 items-center text-[11px]">
          {task.goalId && (
            <Link
              href={`/goals/${task.goalId._id || task.goalId}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-800 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors font-semibold truncate max-w-xs"
            >
              <Target className="w-3 h-3 text-blue-600 dark:text-blue-400 shrink-0" />
              <span className="truncate">Goal: {task.goalId.title || "Linked Goal"}</span>
            </Link>
          )}

          {task.habitId && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-forest-50 dark:bg-forest-950/30 text-forest-800 dark:text-forest-300 font-semibold truncate max-w-xs">
              <HabitIcon
                name={task.habitId.icon || "check-circle"}
                color={task.habitId.color || "#2D6A4F"}
                size="sm"
              />
              <span className="truncate">Habit: {task.habitId.name || "Linked Habit"}</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
