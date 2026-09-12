"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Target, CheckCircle2 } from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { GoalCard } from "@/components/goals/GoalCard";
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { GoalSummaryCards } from "@/components/goals/GoalSummaryCards";

export default function GoalsPage() {
  const [goals, setGoals] = useState<any[]>([]);
  const [stats, setStats] = useState({
    activeGoals: 0,
    completedGoals: 0,
    atRiskGoals: 0,
    overallProgress: 0,
  });
  const [counts, setCounts] = useState({
    all: 0,
    active: 0,
    completed: 0,
    paused: 0,
    archived: 0,
  });
  const [filter, setFilter] = useState<"all" | "active" | "completed" | "paused" | "archived">("active");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modals & Dialogs
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<any>(null);
  const [deletingGoal, setDeletingGoal] = useState<any>(null);

  const fetchGoals = useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(`/api/goals?filter=${filter}`);
      if (!res.ok) throw new Error("Failed to fetch goals");
      const data = await res.json();

      if (data.success) {
        setGoals(data.goals || []);
        if (data.stats) setStats(data.stats);
        if (data.counts) setCounts(data.counts);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Goals fetch error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  const handlePauseToggle = async (goal: any) => {
    try {
      const endpoint = goal.status === "paused" ? `/api/goals/${goal._id}/resume` : `/api/goals/${goal._id}/pause`;
      const res = await fetch(endpoint, { method: "POST" });
      if (res.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to toggle pause on goal:", err);
    }
  };

  const handleArchiveToggle = async (goal: any) => {
    try {
      const res = await fetch(`/api/goals/${goal._id}/archive`, { method: "POST" });
      if (res.ok) {
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to toggle archive on goal:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGoal) return;
    try {
      const res = await fetch(`/api/goals/${deletingGoal._id}`, { method: "DELETE" });
      if (res.ok) {
        setDeletingGoal(null);
        fetchGoals();
      }
    } catch (err) {
      console.error("Failed to delete goal:", err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Goals
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Turn your habits into measurable progress.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingGoal(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          Add Goal
        </button>
      </div>

      {/* Top 4 Dynamic Summary Cards */}
      <GoalSummaryCards stats={stats} />

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 p-1.5 bg-white border border-gray-100 rounded-2xl w-fit shadow-xs flex-wrap">
        {[
          { id: "active", label: `Active (${counts.active})` },
          { id: "all", label: `All (${counts.all})` },
          { id: "completed", label: `Completed (${counts.completed})` },
          { id: "paused", label: `Paused (${counts.paused})` },
          { id: "archived", label: `Archived (${counts.archived})` },
        ].map((tab) => {
          const isSelected = filter === tab.id;
          return (
            <button
              type="button"
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                isSelected
                  ? "bg-forest-700 text-white shadow-xs"
                  : "text-gray-500 hover:text-gray-900"
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Main Grid of Goal Cards */}
      {isLoading ? (
        <LoadingSkeleton count={4} />
      ) : error ? (
        <ErrorState onRetry={fetchGoals} />
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title={
            filter === "archived"
              ? "No archived goals"
              : filter === "completed"
              ? "No completed goals yet"
              : "No goals yet"
          }
          description={
            filter === "archived"
              ? "You haven't archived any goals."
              : filter === "completed"
              ? "Keep tracking your habits to complete your first goal milestone."
              : "Create a goal and connect it to your habits to start tracking progress."
          }
          actionText={filter !== "archived" ? "Create Your First Goal" : undefined}
          onAction={() => {
            setEditingGoal(null);
            setIsFormModalOpen(true);
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((goal) => (
            <GoalCard
              key={goal._id}
              goal={goal}
              onEdit={(g) => {
                setEditingGoal(g);
                setIsFormModalOpen(true);
              }}
              onPauseToggle={handlePauseToggle}
              onArchiveToggle={handleArchiveToggle}
              onDelete={(g) => setDeletingGoal(g)}
            />
          ))}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <GoalFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingGoal(null);
        }}
        onSuccess={fetchGoals}
        initialData={editingGoal}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingGoal}
        onClose={() => setDeletingGoal(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete this goal?"
        message="This action cannot be undone. Deleting this goal will remove its target and progress milestone, but your connected habits and history records will NOT be deleted."
        isDestructive={true}
        confirmText="Delete Goal"
      />
    </div>
  );
}
