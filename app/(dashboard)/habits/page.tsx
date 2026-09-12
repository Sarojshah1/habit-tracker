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
} from "lucide-react";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { HabitDetailModal } from "@/components/habits/HabitDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function HabitsPage() {
  const [habits, setHabits] = useState<any[]>([]);
  const [counts, setCounts] = useState({ all: 0, active: 0, archived: 0 });
  const [filter, setFilter] = useState<"all" | "active" | "archived">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);

  const fetchHabits = React.useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(`/api/habits?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch habits");
      const data = await res.json();
      if (data.success) {
        setHabits(data.habits);
        setCounts(data.counts);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Habits error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchHabits();
  }, [fetchHabits]);

  const handleToggleActive = async (habit: any) => {
    try {
      const res = await fetch(`/api/habits/${habit._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !habit.active }),
      });
      if (res.ok) {
        fetchHabits();
      }
    } catch (err) {
      console.error("Failed to toggle active:", err);
    }
  };

  const handleArchive = async (habit: any) => {
    try {
      await fetch(`/api/habits/${habit._id}/archive`, { method: "POST" });
      fetchHabits();
    } catch (err) {
      console.error("Failed to toggle archive:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    try {
      await fetch(`/api/habits/${deletingHabit._id}`, { method: "DELETE" });
      setDeletingHabit(null);
      fetchHabits();
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            My Habits
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Build habits that create the life and academic success you want.
          </p>
        </div>

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl w-fit shadow-xs">
        <button
          type="button"
          onClick={() => setFilter("active")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            filter === "active"
              ? "bg-forest-700 text-white shadow-xs"
              : "text-gray-500 hover:text-gray-900"
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
              : "text-gray-500 hover:text-gray-900"
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
              : "text-gray-500 hover:text-gray-900"
          }`}
        >
          Archived ({counts.archived})
        </button>
      </div>

      {/* Habit Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState onRetry={fetchHabits} />
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
          {habits.map((habit) => {
            const stats = habit.stats || {
              currentStreak: 0,
              bestStreak: 0,
              completionRate: 0,
              totalCompletions: 0,
            };

            return (
              <div
                key={habit._id}
                className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between"
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
                        <h3 className="text-base font-bold text-gray-900 truncate hover:text-forest-700 transition-colors">
                          {habit.name}
                        </h3>
                        <p className="text-xs text-gray-400 font-medium flex items-center gap-1.5 mt-0.5">
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
                      className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      aria-label="Options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>

                  {habit.description && (
                    <p className="text-xs text-gray-500 mt-3 line-clamp-2 leading-relaxed font-medium">
                      {habit.description}
                    </p>
                  )}

                  {/* Streak & Completion Stats */}
                  <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100 text-xs">
                    <div className="p-2.5 rounded-xl bg-orange-50/60 flex items-center gap-2">
                      <Flame className="w-4 h-4 text-orange-600 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold leading-none">Streak</p>
                        <p className="text-sm font-black text-gray-900 mt-0.5">
                          {stats.currentStreak} Days
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-forest-50/60 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-forest-700 shrink-0" />
                      <div>
                        <p className="text-[10px] text-gray-400 font-semibold leading-none">Rate</p>
                        <p className="text-sm font-black text-forest-900 mt-0.5">
                          {stats.completionRate}%
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${stats.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Footer Controls: Active Switch & Details */}
                <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100 text-xs">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleActive(habit)}
                      className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        habit.active ? "bg-forest-700" : "bg-gray-200"
                      }`}
                      aria-label="Toggle active"
                    >
                      <span
                        className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                          habit.active ? "translate-x-4" : "translate-x-0"
                        }`}
                      />
                    </button>
                    <span className="text-gray-500 font-medium">
                      {habit.active ? "Active" : "Paused"}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedHabitDetail(habit)}
                    className="font-bold text-forest-700 hover:text-forest-800 hover:underline"
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
        onSuccess={fetchHabits}
        initialData={editingHabit}
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
