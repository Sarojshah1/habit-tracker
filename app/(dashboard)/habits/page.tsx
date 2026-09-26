"use client";

import React, { useState, useEffect } from "react";
import {
  Plus,
  Filter,
  CheckCircle2,
  Flame,
  Clock,
  MoreVertical,
  Archive,
  Trash2,
  Edit,
  TrendingUp,
  RotateCcw,
  Shield,
  Zap,
  Check,
} from "lucide-react";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { HabitDetailModal } from "@/components/habits/HabitDetailModal";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { StreakFreezeModal } from "@/components/habits/StreakFreezeModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDataCache } from "@/lib/hooks/useDataCache";

export default function HabitsPage() {
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [goalPreselectedHabitId, setGoalPreselectedHabitId] = useState<string | undefined>(undefined);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);
  const [stackedPrompt, setStackedPrompt] = useState<{
    id: string;
    name: string;
    icon: string;
    color: string;
    twoMinuteVersion?: string;
  } | null>(null);

  const fetchHabits = React.useCallback(async () => {
    const res = await fetch(`/api/habits?filter=${filter}`);
    if (!res.ok) throw new Error("Failed to fetch habits");
    const data = await res.json();
    if (!data.success) throw new Error("Unsuccessful habits response");
    return data;
  }, [filter]);

  const {
    data,
    isLoading,
    error,
    mutate,
    revalidate,
  } = useDataCache(`/api/habits?filter=${filter}`, fetchHabits, { ttlMs: 60000 });

  const habits: any[] = data?.habits || [];
  const counts = data?.counts || { all: 0, active: 0, archived: 0 };

  const handleLogCompletion = async (habit: any, completionType: "full" | "micro" = "full") => {
    const todayStr = new Date().toISOString().split("T")[0];
    const isCompleted = habit.todayStatus === "completed";
    const nextStatus = isCompleted ? "pending" : "completed";

    // Instant optimistic update
    mutate((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        habits: (prev.habits || []).map((h: any) =>
          h._id === habit._id
            ? {
                ...h,
                todayStatus: nextStatus,
                todayCompletionType: nextStatus === "completed" ? completionType : "full",
                stats: {
                  ...h.stats,
                  currentStreak:
                    nextStatus === "completed"
                      ? (h.stats?.currentStreak || 0) + 1
                      : Math.max(0, (h.stats?.currentStreak || 1) - 1),
                  totalCompletions:
                    nextStatus === "completed"
                      ? (h.stats?.totalCompletions || 0) + 1
                      : Math.max(0, (h.stats?.totalCompletions || 1) - 1),
                },
              }
            : h
        ),
      };
    });

    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId: habit._id,
          date: todayStr,
          status: nextStatus === "completed" ? "completed" : "pending",
          action: nextStatus === "completed" ? "save" : "remove",
          completionType,
        }),
      });

      if (!res.ok) {
        revalidate(true);
      } else {
        const json = await res.json();
        if (json.nextStackedHabit) {
          setStackedPrompt(json.nextStackedHabit);
        }
      }
    } catch (err) {
      console.error("Failed to log completion:", err);
      revalidate(true);
    }
  };

  const handleToggleActive = async (habit: any) => {
    const newActive = !habit.active;

    // Instant optimistic toggle
    mutate((prev: any) => {
      if (!prev) return prev;
      let updatedHabits = (prev.habits || []).map((h: any) =>
        h._id === habit._id ? { ...h, active: newActive } : h
      );
      if (filter === "active" && !newActive) {
        updatedHabits = updatedHabits.filter((h: any) => h._id !== habit._id);
      }
      return {
        ...prev,
        habits: updatedHabits,
        counts: {
          ...prev.counts,
          active: Math.max(0, (prev.counts?.active || 0) + (newActive ? 1 : -1)),
        },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newActive }),
      });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to toggle active:", err);
      revalidate(true);
    }
  };

  const handleArchive = async (habit: any) => {
    const newArchived = !habit.archived;

    // Instant optimistic archive
    mutate((prev: any) => {
      if (!prev) return prev;
      let updatedHabits = (prev.habits || []).map((h: any) =>
        h._id === habit._id ? { ...h, archived: newArchived } : h
      );
      if (filter === "active" && newArchived) {
        updatedHabits = updatedHabits.filter((h: any) => h._id !== habit._id);
      } else if (filter === "archived" && !newArchived) {
        updatedHabits = updatedHabits.filter((h: any) => h._id !== habit._id);
      }
      return {
        ...prev,
        habits: updatedHabits,
        counts: {
          ...prev.counts,
          archived: Math.max(0, (prev.counts?.archived || 0) + (newArchived ? 1 : -1)),
          active: Math.max(0, (prev.counts?.active || 0) + (newArchived ? -1 : 1)),
        },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habit._id}/archive`, { method: "POST" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to toggle archive:", err);
      revalidate(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    const habitId = deletingHabit._id;
    setDeletingHabit(null);

    // Instant optimistic deletion
    mutate((prev: any) => {
      if (!prev) return prev;
      const updatedHabits = (prev.habits || []).filter((h: any) => h._id !== habitId);
      return {
        ...prev,
        habits: updatedHabits,
        counts: {
          ...prev.counts,
          all: Math.max(0, (prev.counts?.all || 0) - 1),
          active: Math.max(0, (prev.counts?.active || 0) - 1),
        },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to delete habit:", err);
      revalidate(true);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            My Habits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Build habits that create the life and academic success you want.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsFreezeModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-cyan-50 dark:bg-cyan-950/50 hover:bg-cyan-100 dark:hover:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300 font-bold text-sm border border-cyan-200 dark:border-cyan-800 shadow-xs transition-all hover:-translate-y-0.5"
            title="Protect streak during busy exam days"
          >
            <Shield className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            Streak Freeze
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingHabit(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Habit
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "active"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Active ({counts.active})
        </button>

        <button
          type="button"
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "all"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          All Habits ({counts.all})
        </button>

        <button
          type="button"
          onClick={() => setFilter("archived")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "archived"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          }`}
        >
          Archived ({counts.archived})
        </button>
      </div>

      {/* Stacked Habit Follow-up Banner */}
      {stackedPrompt && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔗</span>
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300 uppercase tracking-wider">
                Habit Stack Triggered!
              </p>
              <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 mt-0.5">
                Next up in your stack: <span className="font-bold text-forest-700 dark:text-forest-400">{stackedPrompt.name}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                const targetHabit = habits.find((h: any) => h._id === stackedPrompt.id);
                if (targetHabit) handleLogCompletion(targetHabit, "full");
                setStackedPrompt(null);
              }}
              className="px-3.5 py-1.5 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-xs transition-colors shadow-xs"
            >
              Complete Now
            </button>
            <button
              type="button"
              onClick={() => setStackedPrompt(null)}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xs font-bold"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Habit Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState onRetry={() => revalidate(false)} />
      ) : habits.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title={filter === "archived" ? "No archived habits" : "No habits found"}
          description={
            filter === "archived"
              ? "You haven't archived any habits yet."
              : "Create your first habit to start building consistency and tracking streaks."
          }
          actionText={filter !== "archived" ? "Add First Habit" : undefined}
          onAction={() => {
            setEditingHabit(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {habits.map((habit: any) => {
            const stats = habit.stats || {
              currentStreak: 0,
              bestStreak: 0,
              completionRate: 0,
              totalCompletions: 0,
            };

            return (
              <div
                key={habit._id}
                className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar: Icon + Title + Menu */}
                  <div className="flex items-start justify-between gap-3">
                    <div
                      className="flex items-center gap-3.5 cursor-pointer min-w-0 flex-1"
                      onClick={() => setSelectedHabitDetail(habit)}
                    >
                      <HabitIcon name={habit.icon} color={habit.color} size="md" />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 truncate hover:text-forest-700 dark:hover:text-forest-400 transition-colors">
                          {habit.name}
                        </h3>
                        <p className="text-xs text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{habit.schedule?.time || "Anytime"}</span>
                          <span>•</span>
                          <span className="capitalize">{habit.frequency?.replace("_", " ")}</span>
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setSelectedHabitDetail(habit)}
                      className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stacked Anchor Habit Badge */}
                  {habit.habitStackAfterHabitId && (
                    <div className="mt-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-forest-50 dark:bg-forest-950/40 border border-forest-100 dark:border-forest-900/40 text-[11px] font-semibold text-forest-700 dark:text-forest-300">
                      <span>🔗</span>
                      <span>Stacked after: {habit.habitStackAfterHabitId.name || "Anchor"}</span>
                    </div>
                  )}

                  {habit.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2.5 line-clamp-2 leading-relaxed font-medium">
                      {habit.description}
                    </p>
                  )}

                  {/* Daily Check-in & Micro Fallback Action */}
                  <div className="mt-3.5 pt-3 border-t border-dashed border-gray-100 dark:border-gray-800">
                    {habit.todayStatus === "completed" ? (
                      <div className="flex items-center justify-between">
                        <button
                          type="button"
                          onClick={() => handleLogCompletion(habit)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-forest-100/80 dark:bg-forest-900/40 text-forest-800 dark:text-forest-200 font-bold text-xs border border-forest-200/80 dark:border-forest-800 hover:opacity-80 transition-opacity"
                        >
                          <Check className="w-3.5 h-3.5" strokeWidth={3} />
                          <span>{habit.todayCompletionType === "micro" ? "2-Min Done" : "Done Today"}</span>
                        </button>
                        {habit.todayCompletionType === "micro" && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/40">
                            ⚡ 2-Min Micro
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleLogCompletion(habit, "full")}
                          className="flex-1 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 dark:bg-forest-950/40 dark:hover:bg-forest-900/50 text-forest-700 dark:text-forest-300 font-bold text-xs border border-forest-200/60 dark:border-forest-800/40 transition-colors flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Check In</span>
                        </button>

                        {habit.twoMinuteVersion && (
                          <button
                            type="button"
                            onClick={() => handleLogCompletion(habit, "micro")}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 font-bold text-xs border border-amber-200 dark:border-amber-800/40 transition-colors flex items-center gap-1"
                            title={`Bad-Day Fallback: ${habit.twoMinuteVersion}`}
                          >
                            <Zap className="w-3 h-3" />
                            <span>2-Min</span>
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Streak & Completion Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs">
                    <div className="p-2.5 rounded-xl bg-orange-50/60 dark:bg-orange-950/20 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-none">Streak</p>
                        <p className="text-sm font-black text-gray-900 dark:text-gray-100 mt-0.5">
                          {stats.currentStreak} Days
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-forest-50/60 dark:bg-forest-950/20 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-forest-700 dark:text-forest-400 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-none">Rate</p>
                        <p className="text-sm font-black text-forest-900 dark:text-forest-200 mt-0.5">
                          {stats.completionRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-600 dark:bg-forest-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Active Switch & Details */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(habit)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        habit.active ? "bg-forest-700" : "bg-gray-200 dark:bg-gray-700"
                      }`}
                      aria-label="Toggle active"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          habit.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-gray-500 dark:text-gray-400 font-medium">
                      {habit.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedHabitDetail(habit)}
                    className="font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 hover:underline"
                  >
                    View Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Form Modal */}
      <HabitFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingHabit(null);
        }}
        onSuccess={() => revalidate(true)}
        initialData={editingHabit}
        availableHabits={habits}
      />

      {/* Habit Detail Modal */}
      <HabitDetailModal
        isOpen={!!selectedHabitDetail}
        onClose={() => setSelectedHabitDetail(null)}
        habit={selectedHabitDetail}
        onEdit={(h) => {
          setSelectedHabitDetail(null);
          setEditingHabit(h);
          setIsFormModalOpen(true);
        }}
        onArchive={handleArchive}
        onDelete={(h) => {
          setSelectedHabitDetail(null);
          setDeletingHabit(h);
        }}
        onCreateGoal={(h) => {
          setGoalPreselectedHabitId(h._id);
          setIsGoalModalOpen(true);
        }}
      />

      {/* Goal Form Modal preselected with habit */}
      <GoalFormModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setGoalPreselectedHabitId(undefined);
        }}
        onSuccess={() => revalidate(true)}
        initialHabitId={goalPreselectedHabitId}
      />

      {/* Streak Freeze Modal */}
      <StreakFreezeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        onSuccess={() => revalidate(true)}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deletingHabit?.name}"? All associated completion data will be permanently removed.`}
        isDestructive={true}
        confirmText="Delete Habit"
      />
    </div>
  );
}
