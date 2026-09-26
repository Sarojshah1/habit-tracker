"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ListTodo,
  Plus,
  Calendar,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { TaskCard } from "@/components/tasks/TaskCard";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDataCache } from "@/lib/hooks/useDataCache";

export default function TasksPage() {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<
    "all" | "today" | "upcoming" | "completed" | "high_priority"
  >("today");

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [deletingTask, setDeletingTask] = useState<any>(null);

  const fetchTasks = useCallback(async () => {
    const res = await fetch(`/api/tasks?status=${activeFilter}`);
    if (!res.ok) throw new Error("Failed to load tasks");
    const data = await res.json();
    if (!data.success) throw new Error("Unsuccessful tasks response");
    return data;
  }, [activeFilter]);

  const {
    data,
    isLoading,
    error,
    mutate,
    revalidate,
  } = useDataCache(`/api/tasks?status=${activeFilter}`, fetchTasks, { ttlMs: 60000 });

  const tasks: any[] = data?.tasks || [];
  const counts = data?.counts || { all: 0, today: 0, upcoming: 0, completed: 0, high_priority: 0 };
  const todayDateStr = data?.todayDate || new Date().toISOString().split("T")[0];

  const handleToggleComplete = async (task: any) => {
    const isNowCompleted = task.status !== "completed";
    const newStatus = isNowCompleted ? "completed" : "todo";

    // Instant optimistic update
    mutate((prev: any) => {
      if (!prev) return prev;
      let updatedTasks = (prev.tasks || []).map((t: any) =>
        t._id === task._id
          ? {
              ...t,
              status: newStatus,
              completedAt: isNowCompleted ? new Date().toISOString() : null,
            }
          : t
      );
      if (activeFilter === "completed" && !isNowCompleted) {
        updatedTasks = updatedTasks.filter((t: any) => t._id !== task._id);
      }

      return {
        ...prev,
        tasks: updatedTasks,
        counts: {
          ...prev.counts,
          completed: Math.max(0, (prev.counts?.completed || 0) + (isNowCompleted ? 1 : -1)),
        },
      };
    });

    try {
      if (isNowCompleted) {
        await fetch(`/api/tasks/${task._id}/complete`, { method: "POST" });
      } else {
        await fetch(`/api/tasks/${task._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "todo", completedAt: null }),
        });
      }
      revalidate(true);
    } catch (err) {
      console.error("Failed to toggle task completion:", err);
      revalidate(true);
    }
  };

  const handleCancelTask = async (task: any) => {
    // Instant optimistic removal from view
    mutate((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: (prev.tasks || []).filter((t: any) => t._id !== task._id),
        counts: {
          ...prev.counts,
          all: Math.max(0, (prev.counts?.all || 0) - 1),
          today: task.dueDate === todayDateStr ? Math.max(0, (prev.counts?.today || 0) - 1) : prev.counts?.today,
        },
      };
    });

    try {
      const res = await fetch(`/api/tasks/${task._id}/cancel`, { method: "POST" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to cancel task:", err);
      revalidate(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingTask) return;
    const taskId = deletingTask._id;
    const deletedTask = deletingTask;
    setDeletingTask(null);

    // Instant optimistic removal
    mutate((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        tasks: (prev.tasks || []).filter((t: any) => t._id !== taskId),
        counts: {
          ...prev.counts,
          all: Math.max(0, (prev.counts?.all || 0) - 1),
          today: deletedTask.dueDate === todayDateStr ? Math.max(0, (prev.counts?.today || 0) - 1) : prev.counts?.today,
        },
      };
    });

    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to delete task:", err);
      revalidate(true);
    }
  };

  const handleStartFocus = (task: any) => {
    // Navigate to focus mode with this task pre-selected via query param
    router.push(`/focus?taskId=${task._id}`);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Tasks</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Turn your plans into completed work.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Add Task
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl shadow-xs overflow-x-auto select-none">
        <button
          type="button"
          onClick={() => setActiveFilter("today")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === "today"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span>Today</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeFilter === "today" ? "bg-forest-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {counts.today}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("upcoming")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === "upcoming"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span>Upcoming</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeFilter === "upcoming" ? "bg-forest-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {counts.upcoming}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("high_priority")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === "high_priority"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span>High Priority</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeFilter === "high_priority" ? "bg-forest-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {counts.high_priority}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("completed")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === "completed"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span>Completed</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeFilter === "completed" ? "bg-forest-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {counts.completed}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-2 ${
            activeFilter === "all"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          <span>All Tasks</span>
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full ${
              activeFilter === "all" ? "bg-forest-600 text-white" : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
            }`}
          >
            {counts.all}
          </span>
        </button>
      </div>

      {/* Main Task List */}
      {isLoading ? (
        <div className="space-y-3">
          <LoadingSkeleton count={4} type="row" />
        </div>
      ) : error ? (
        <ErrorState
          title="Unable to load your tasks."
          message="Could not load your task list right now. Please try again."
          onRetry={() => revalidate(false)}
        />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks yet"
          description="Add your first task to start planning your day."
          actionText="Add Task"
          onAction={() => {
            setEditingTask(null);
            setIsCreateModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any) => (
            <TaskCard
              key={task._id}
              task={task}
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => {
                setEditingTask(t);
                setIsCreateModalOpen(true);
              }}
              onDelete={(t) => setDeletingTask(t)}
              onCancel={handleCancelTask}
              onStartFocus={handleStartFocus}
              todayDateStr={todayDateStr}
            />
          ))}
        </div>
      )}

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        onSuccess={() => revalidate(true)}
        initialData={editingTask}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingTask}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Task"
        message={`Are you sure you want to delete "${deletingTask?.title}"?`}
        isDestructive={true}
        confirmText="Delete Task"
      />
    </div>
  );
}
