"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  BarChart3,
  Target,
  Plus,
  Calendar as CalendarIcon,
  ArrowRight,
  MoreVertical,
  Clock,
  Sparkles,
  Check,
  XCircle,
  TrendingUp,
  Award,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { EmptyState } from "@/components/ui/EmptyState";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { HabitDetailModal } from "@/components/habits/HabitDetailModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { getGreeting } from "@/lib/utils/date";

export default function DashboardPage() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);

  const fetchDashboardData = async () => {
    try {
      setError(false);
      const res = await fetch("/api/dashboard");
      if (!res.ok) throw new Error("Failed to load");
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Dashboard load error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Optimistic toggle habit completion
  const handleToggleHabit = async (habitId: string, currentStatus: string) => {
    if (!data) return;

    const newStatus = currentStatus === "completed" ? "pending" : "completed";

    // 1. Optimistic UI update
    setData((prev: any) => {
      if (!prev) return prev;
      const updatedTodayHabits = prev.todayHabits.map((h: any) => {
        if (h._id === habitId) {
          return { ...h, todayStatus: newStatus };
        }
        return h;
      });

      const completedCount = updatedTodayHabits.filter((h: any) => h.todayStatus === "completed").length;
      const totalCount = updatedTodayHabits.length;

      return {
        ...prev,
        todayHabits: updatedTodayHabits,
        stats: {
          ...prev.stats,
          habitsCompleted: {
            ...prev.stats.habitsCompleted,
            completed: completedCount,
            label: `${completedCount}/${totalCount}`,
          },
        },
      };
    });

    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: data.today.date,
          status: newStatus === "completed" ? "completed" : "pending",
          action: newStatus === "completed" ? "save" : "remove",
        }),
      });

      if (!res.ok) {
        // Revert on failure
        fetchDashboardData();
      } else {
        // Silently refresh stats & streaks in background
        fetchDashboardData();
      }
    } catch (err) {
      console.error("Failed to toggle habit:", err);
      fetchDashboardData();
    }
  };

  const handleSkipHabit = async (habitId: string) => {
    try {
      await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: data.today.date,
          status: "skipped",
        }),
      });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to skip habit:", err);
    }
  };

  const handleDeleteHabitConfirm = async () => {
    if (!deletingHabit) return;
    try {
      await fetch(`/api/habits/${deletingHabit._id}`, { method: "DELETE" });
      setDeletingHabit(null);
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to delete habit:", err);
    }
  };

  const handleArchiveHabit = async (habit: any) => {
    try {
      await fetch(`/api/habits/${habit._id}/archive`, { method: "POST" });
      fetchDashboardData();
    } catch (err) {
      console.error("Failed to archive habit:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-gray-200 rounded-2xl w-1/3 animate-pulse" />
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton count={3} type="row" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <ErrorState
        title="Unable to load dashboard"
        message="Could not load your habit statistics right now. Please refresh or try again."
        onRetry={fetchDashboardData}
      />
    );
  }

  const greeting = getGreeting();
  const studentName = data.user?.name || "Student";

  return (
    <div className="space-y-8">
      {/* Dashboard Greeting Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            {greeting}, {studentName}! 👋
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium flex items-center gap-2">
            <span>{data.today.friendlyDate}</span>
            <span>•</span>
            <span className="text-forest-700 font-semibold">Keep going — consistency builds progress.</span>
          </p>
        </div>

        {/* Motivational Quote pill */}
        {data.today?.quote && (
          <div className="bg-white rounded-2xl border border-gray-100/90 px-4 py-2.5 shadow-xs max-w-sm">
            <p className="text-xs text-gray-700 italic font-medium">
              &ldquo;{data.today.quote.text}&rdquo;
            </p>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider text-right mt-1">
              — {data.today.quote.author}
            </p>
          </div>
        )}
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Habits Completed"
          value={data.stats.habitsCompleted.label}
          subtitle="Scheduled for today"
          icon={CheckCircle2}
          colorClass="text-forest-700 bg-forest-50"
          badgeText="Today"
        />

        <StatCard
          title="Day Streak"
          value={data.stats.currentStreak.label}
          subtitle={`Best: ${data.stats.currentStreak.longest} days`}
          icon={Flame}
          colorClass="text-orange-600 bg-orange-50"
          badgeText="Active 🔥"
        />

        <StatCard
          title="Weekly Completion"
          value={data.stats.weeklyCompletion.label}
          subtitle="Past 7 days performance"
          icon={BarChart3}
          colorClass="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          title="Goals in Progress"
          value={data.stats.goalsInProgress.label}
          subtitle="Active milestones"
          icon={Target}
          colorClass="text-blue-600 bg-blue-50"
        />
      </div>

      {/* Main Grid: Today's Habits (7 cols) & Weekly Progress / Mini Calendar (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Today's Habits Card (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div>
                <h2 className="text-lg font-bold text-gray-900 tracking-tight">Today&apos;s Habits</h2>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Check off items as you complete them to build your streak.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingHabit(null);
                  setIsCreateModalOpen(true);
                }}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all hover:shadow"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Habit
              </button>
            </div>

            {data.todayHabits.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="No habits scheduled for today"
                description="Start building your productive routine by creating your first daily habit."
                actionText="Create Habit"
                onAction={() => {
                  setEditingHabit(null);
                  setIsCreateModalOpen(true);
                }}
              />
            ) : (
              <div className="space-y-3">
                {data.todayHabits.map((habit: any) => {
                  const isCompleted = habit.todayStatus === "completed";
                  const isSkipped = habit.todayStatus === "skipped";

                  return (
                    <div
                      key={habit._id}
                      className={`group p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3.5 ${
                        isCompleted
                          ? "bg-forest-50/40 border-forest-100"
                          : isSkipped
                          ? "bg-orange-50/30 border-orange-100 opacity-60"
                          : "bg-white border-gray-100 hover:border-gray-200 hover:shadow-xs"
                      }`}
                    >
                      {/* Left: Checkbox + Icon + Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Custom Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleHabit(habit._id, habit.todayStatus)}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ${
                            isCompleted
                              ? "bg-forest-700 text-white shadow-xs"
                              : "border-2 border-gray-300 hover:border-forest-600 bg-white"
                          }`}
                          aria-label={`Mark ${habit.name} ${isCompleted ? "incomplete" : "complete"}`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </button>

                        <div
                          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                          onClick={() => setSelectedHabitDetail(habit)}
                        >
                          <HabitIcon name={habit.icon} color={habit.color} size="md" />
                          <div className="min-w-0">
                            <p
                              className={`text-sm font-bold truncate transition-colors ${
                                isCompleted ? "line-through text-gray-400 font-medium" : "text-gray-900"
                              }`}
                            >
                              {habit.name}
                            </p>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {habit.schedule?.time || "Anytime"}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{habit.frequency.replace("_", " ")}</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Menu */}
                      <div className="flex items-center gap-1">
                        {!isCompleted && !isSkipped && (
                          <button
                            type="button"
                            onClick={() => handleSkipHabit(habit._id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                            title="Skip this habit for today"
                          >
                            Skip
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedHabitDetail(habit)}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          aria-label="Habit details"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Quick Action Footer */}
          <div className="pt-4 mt-6 border-t border-gray-100 flex items-center justify-between text-xs">
            <Link
              href="/habits"
              className="font-bold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1 group"
            >
              View All Habits
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-gray-400 font-medium">
              {data.stats.habitsCompleted.completed} of {data.stats.habitsCompleted.total} completed today
            </span>
          </div>
        </div>

        {/* Weekly Progress & Mini Calendar (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Weekly Progress Bar Chart */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Weekly Progress</h3>
                <p className="text-xs text-gray-400 font-medium">Daily completion percentage</p>
              </div>
              <span className="text-xs font-bold text-forest-700 bg-forest-50 px-2.5 py-1 rounded-full">
                {data.stats.weeklyCompletion.label} Avg
              </span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.weeklyProgress} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                  <XAxis
                    dataKey="day"
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#94a3b8"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    domain={[0, 100]}
                    ticks={[0, 50, 100]}
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const pt = payload[0].payload;
                        return (
                          <div className="bg-gray-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                            <p className="font-bold">{pt.date}</p>
                            <p className="text-forest-300">Completion: {pt.completionPercentage}%</p>
                            <p className="text-gray-300">
                              {pt.completedCount} of {pt.totalCount} habits
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="completionPercentage" radius={[6, 6, 0, 0]}>
                    {data.weeklyProgress.map((entry: any, index: number) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.isToday ? "#1B4332" : entry.completionPercentage > 0 ? "#52B788" : "#E2E8F0"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Mini Monthly Calendar Preview */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-gray-100">
              <div>
                <h3 className="text-base font-bold text-gray-900 tracking-tight">Month Overview</h3>
                <p className="text-xs text-gray-400 font-medium">Monthly consistency grid</p>
              </div>
              <Link
                href="/calendar"
                className="text-xs font-bold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1 group"
              >
                Full Calendar
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            <div className="grid grid-cols-7 gap-1.5 text-center">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="text-[10px] font-bold text-gray-400">
                  {d}
                </span>
              ))}

              {data.monthCalendar.days.map((day: any) => {
                let dotColor = "bg-gray-100 text-gray-500";
                if (day.status === "completed") dotColor = "bg-forest-600 text-white font-bold";
                else if (day.status === "partial") dotColor = "bg-orange-500 text-white font-bold";
                else if (day.status === "missed") dotColor = "bg-red-200 text-red-800";

                return (
                  <div
                    key={day.date}
                    className={`h-7 rounded-lg flex items-center justify-center text-[10px] transition-all ${dotColor} ${
                      day.isToday ? "ring-2 ring-forest-700 font-black" : ""
                    }`}
                    title={`${day.date}: ${day.status}`}
                  >
                    {day.day}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Row: Active Goals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Goals (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">Active Goals</h3>
              <p className="text-xs text-gray-400 font-medium">Your ongoing milestones and targets</p>
            </div>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
              {data.goals.length} in progress
            </span>
          </div>

          {data.goals.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium">
              No active goals yet. Create targets like reading 5 books or a 30-day study streak!
            </div>
          ) : (
            <div className="space-y-4">
              {data.goals.map((goal: any) => {
                const pct = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                return (
                  <div key={goal._id} className="p-4 rounded-2xl bg-gray-50/70 border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-bold text-gray-900">{goal.title}</p>
                      <span className="text-xs font-extrabold text-forest-700">
                        {goal.currentValue} / {goal.targetValue} {goal.unit}
                      </span>
                    </div>
                    {goal.description && (
                      <p className="text-xs text-gray-500 mb-3 font-medium">{goal.description}</p>
                    )}
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-forest-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Recent Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-100 mb-4">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-gray-400 font-medium">Your latest productivity logs</p>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium">
              No recent actions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {data.recentActivity.map((act: any) => {
                const timeAgo = new Date(act.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={act._id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-forest-600 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800 capitalize">
                          {act.type.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-gray-600">
                          {act.metadata?.habitName || act.metadata?.goalTitle || act.metadata?.title || act.metadata?.message || "Action"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 shrink-0 font-medium">{timeAgo}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Action Navigation Bar */}
      <div className="bg-forest-900 text-white rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-elevated">
        <div>
          <div className="flex items-center gap-2 text-forest-300 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-4 h-4" />
            Quick Productivity Actions
          </div>
          <h3 className="text-xl font-black tracking-tight">Ready for your next study milestone?</h3>
          <p className="text-xs text-forest-200 mt-1 max-w-md font-medium">
            Jump directly into deep work with the Pomodoro focus timer or inspect detailed consistency analytics.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/focus"
            className="px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-xs transition-colors shadow-xs"
          >
            Start Focus Timer
          </Link>
          <Link
            href="/calendar"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            View Calendar
          </Link>
          <Link
            href="/analytics"
            className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition-colors"
          >
            Analytics
          </Link>
        </div>
      </div>

      {/* Add / Edit Habit Modal */}
      <HabitFormModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingHabit(null);
        }}
        onSuccess={fetchDashboardData}
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
          setIsCreateModalOpen(true);
        }}
        onArchive={handleArchiveHabit}
        onDelete={(h) => {
          setSelectedHabitDetail(null);
          setDeletingHabit(h);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleDeleteHabitConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deletingHabit?.name}"? All historical completion logs for this habit will also be permanently removed.`}
        isDestructive={true}
        confirmText="Delete Habit"
      />
    </div>
  );
}
