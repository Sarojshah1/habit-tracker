"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  Sun,
  Moon,
  CheckSquare,
  Play,
  Zap,
  ChevronRight,
  ListTodo,
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
import { GoalFormModal } from "@/components/goals/GoalFormModal";
import { TaskFormModal } from "@/components/tasks/TaskFormModal";
import { DailyPlanModal } from "@/components/planner/DailyPlanModal";
import { DailyReviewModal } from "@/components/planner/DailyReviewModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { ConsistencyHeatmap } from "@/components/dashboard/ConsistencyHeatmap";
import { ShareStreakModal } from "@/components/dashboard/ShareStreakModal";
import { ExamCountdownWidget } from "@/components/dashboard/ExamCountdownWidget";
import { enqueueOfflineAction } from "@/lib/services/offlineSync";
import { useDataCache } from "@/lib/hooks/useDataCache";
import { getGreeting } from "@/lib/utils/date";

export default function DashboardPage() {
  const router = useRouter();

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreateGoalModalOpen, setIsCreateGoalModalOpen] = useState(false);
  const [goalPreselectedHabitId, setGoalPreselectedHabitId] = useState<string | undefined>(undefined);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);

  // Planner, Task & Share Modals
  const [isDailyPlanModalOpen, setIsDailyPlanModalOpen] = useState(false);
  const [isDailyReviewModalOpen, setIsDailyReviewModalOpen] = useState(false);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [stackedPrompt, setStackedPrompt] = useState<{
    id: string;
    name: string;
    icon: string;
    color: string;
    twoMinuteVersion?: string;
  } | null>(null);

  const fetchDashboardData = React.useCallback(async () => {
    const res = await fetch("/api/dashboard");
    if (!res.ok) throw new Error("Failed to load dashboard data");
    const json = await res.json();
    if (!json.success) throw new Error("Unsuccessful dashboard response");
    return json.data;
  }, []);

  const {
    data,
    isLoading,
    error,
    mutate,
    revalidate,
  } = useDataCache("/api/dashboard", fetchDashboardData, { ttlMs: 60000 });

  useEffect(() => {
    const handleSyncComplete = () => {
      revalidate(true);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("habittrack_sync_completed", handleSyncComplete);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("habittrack_sync_completed", handleSyncComplete);
      }
    };
  }, [revalidate]);

  // Instant optimistic toggle habit completion (with offline queueing support)
  const handleToggleHabit = async (
    habitId: string,
    currentStatus: string,
    completionType: "full" | "micro" = "full"
  ) => {
    if (!data) return;

    const newStatus = currentStatus === "completed" ? "pending" : "completed";
    const delta = newStatus === "completed" ? 1 : -1;

    // 1. Instant 0ms Optimistic UI update
    mutate((prev: any) => {
      if (!prev) return prev;
      const updatedTodayHabits = (prev.todayHabits || []).map((h: any) => {
        if (h._id === habitId) {
          return {
            ...h,
            todayStatus: newStatus,
            todayCompletionType: newStatus === "completed" ? completionType : "full",
          };
        }
        return h;
      });

      const completedCount = updatedTodayHabits.filter((h: any) => h.todayStatus === "completed").length;
      const totalCount = updatedTodayHabits.length;
      const prevStreak = prev.stats?.currentStreak?.count || 0;
      const newStreak = Math.max(0, prevStreak + delta);

      return {
        ...prev,
        todayHabits: updatedTodayHabits,
        stats: {
          ...prev.stats,
          habitsCompleted: {
            ...prev.stats?.habitsCompleted,
            completed: completedCount,
            label: `${completedCount}/${totalCount}`,
          },
          currentStreak: {
            ...prev.stats?.currentStreak,
            count: newStreak,
            label: `${newStreak} Days`,
          },
        },
      };
    });

    const completionPayload = {
      habitId,
      date: data.today.date,
      status: newStatus === "completed" ? "completed" : "pending",
      action: newStatus === "completed" ? "save" : "remove",
      completionType,
    };

    // If offline, queue for replay when reconnected
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction({
        type: "toggle_habit",
        endpoint: "/api/completions",
        method: "POST",
        payload: completionPayload,
        description: `Habit completion: ${habitId}`,
      });
      return;
    }

    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(completionPayload),
      });

      if (!res.ok) {
        // Revert on server error
        revalidate(true);
      } else {
        const json = await res.json();
        if (json.nextStackedHabit) {
          setStackedPrompt(json.nextStackedHabit);
        }
      }
    } catch (err) {
      console.warn("Network error during toggle, queuing offline:", err);
      enqueueOfflineAction({
        type: "toggle_habit",
        endpoint: "/api/completions",
        method: "POST",
        payload: completionPayload,
        description: `Habit completion: ${habitId}`,
      });
    }
  };

  const handleSkipHabit = async (habitId: string) => {
    if (!data) return;

    // Instant optimistic skip
    mutate((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        todayHabits: (prev.todayHabits || []).map((h: any) =>
          h._id === habitId ? { ...h, todayStatus: "skipped" } : h
        ),
      };
    });

    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date: data.today.date,
          status: "skipped",
        }),
      });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to skip habit:", err);
      revalidate(true);
    }
  };

  const handleDeleteHabitConfirm = async () => {
    if (!deletingHabit || !data) return;
    const habitId = deletingHabit._id;
    setDeletingHabit(null);

    // Instant optimistic removal
    mutate((prev: any) => {
      if (!prev) return prev;
      const updated = (prev.todayHabits || []).filter((h: any) => h._id !== habitId);
      const completedCount = updated.filter((h: any) => h.todayStatus === "completed").length;
      return {
        ...prev,
        todayHabits: updated,
        stats: {
          ...prev.stats,
          habitsCompleted: {
            ...prev.stats?.habitsCompleted,
            completed: completedCount,
            total: updated.length,
            label: `${completedCount}/${updated.length}`,
          },
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

  const handleArchiveHabit = async (habit: any) => {
    if (!data) return;
    const habitId = habit._id;

    // Instant optimistic archive
    mutate((prev: any) => {
      if (!prev) return prev;
      const updated = (prev.todayHabits || []).filter((h: any) => h._id !== habitId);
      const completedCount = updated.filter((h: any) => h.todayStatus === "completed").length;
      return {
        ...prev,
        todayHabits: updated,
        stats: {
          ...prev.stats,
          habitsCompleted: {
            ...prev.stats?.habitsCompleted,
            completed: completedCount,
            total: updated.length,
            label: `${completedCount}/${updated.length}`,
          },
        },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habitId}/archive`, { method: "POST" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to archive habit:", err);
      revalidate(true);
    }
  };

  const handleToggleTask = async (task: any) => {
    if (!data) return;
    const isCompleted = task.status === "completed";
    const newStatus = isCompleted ? "todo" : "completed";
    const endpoint = isCompleted ? `/api/tasks/${task._id}` : `/api/tasks/${task._id}/complete`;
    const method = isCompleted ? "PATCH" : "POST";
    const body = isCompleted ? JSON.stringify({ status: "todo" }) : JSON.stringify({});

    // Instant optimistic task toggle
    mutate((prev: any) => {
      if (!prev) return prev;
      const updatedTasks = (prev.todayTasks || []).map((t: any) =>
        t._id === task._id ? { ...t, status: newStatus } : t
      );
      const updatedPriorities = (prev.todayPriorities || []).map((t: any) =>
        t._id === task._id ? { ...t, status: newStatus } : t
      );
      const completedTasksCount = updatedTasks.filter((t: any) => t.status === "completed").length;

      return {
        ...prev,
        todayTasks: updatedTasks,
        todayPriorities: updatedPriorities,
        stats: {
          ...prev.stats,
          tasksCompleted: {
            ...prev.stats?.tasksCompleted,
            completed: completedTasksCount,
            total: updatedTasks.length,
            label: `${completedTasksCount}/${updatedTasks.length}`,
          },
        },
      };
    });

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body,
      });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Failed to toggle task:", err);
      revalidate(true);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl w-1/3 animate-pulse" />
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
        onRetry={() => revalidate(false)}
      />
    );
  }

  const greeting = getGreeting();
  const studentName = data.user?.name || "Student";

  return (
    <div className="space-y-8">
      {/* Dashboard Greeting Header & Planner Triggers */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            {greeting}, {studentName}! 👋
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium flex items-center gap-2">
            <span>{data.today.friendlyDate}</span>
            <span>•</span>
            <span className="text-forest-700 dark:text-forest-400 font-semibold">Keep going — consistency builds progress.</span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => setIsShareModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-50 dark:bg-orange-950/40 border border-orange-200 dark:border-orange-800/60 hover:bg-orange-100 dark:hover:bg-orange-900/50 text-orange-700 dark:text-orange-400 text-xs font-bold transition-all shadow-xs"
            title="Share your study streak with classmates"
          >
            <Flame className="w-3.5 h-3.5 fill-current" />
            Share Streak
          </button>

          <button
            type="button"
            onClick={() => setIsDailyPlanModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all hover:shadow"
          >
            <Sun className="w-3.5 h-3.5" />
            {data.todayPlan ? "Edit Morning Plan" : "Plan Your Day"}
          </button>

          <button
            type="button"
            onClick={() => setIsDailyReviewModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-forest-600 dark:hover:border-forest-500 text-gray-700 dark:text-gray-200 hover:text-forest-700 dark:hover:text-forest-400 text-xs font-bold transition-all shadow-xs"
          >
            <Moon className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            {data.todayReview ? "Review Completed" : "Daily Review"}
          </button>

          {/* Motivational Quote pill */}
          {data.today?.quote && (
            <div className="hidden lg:block bg-white dark:bg-gray-900 rounded-2xl border border-gray-100/90 dark:border-gray-800 px-4 py-2 shadow-xs max-w-xs">
              <p className="text-[11px] text-gray-700 dark:text-gray-300 italic font-medium line-clamp-1">
                &ldquo;{data.today.quote.text}&rdquo;
              </p>
              <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold uppercase tracking-wider text-right">
                — {data.today.quote.author}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Target Exam Countdown & Study Readiness Matrix */}
      <ExamCountdownWidget />

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Habits Completed"
          value={data.stats.habitsCompleted.label}
          subtitle="Scheduled for today"
          icon={CheckCircle2}
          colorClass="text-forest-700 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/40"
          badgeText="Today"
        />

        <StatCard
          title="Day Streak"
          value={data.stats.currentStreak.label}
          subtitle={`Best: ${data.stats.currentStreak.longest} days`}
          icon={Flame}
          colorClass="text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/40"
          badgeText="Active 🔥"
        />

        <StatCard
          title="Weekly Completion"
          value={data.stats.weeklyCompletion.label}
          subtitle="Past 7 days performance"
          icon={BarChart3}
          colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        />

        <StatCard
          title="Goals in Progress"
          value={data.stats.goalsInProgress.label}
          subtitle="Active milestones"
          icon={Target}
          colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
        />
      </div>

      {/* Today's Priorities & Deep Work Focus Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Top 3 Priorities (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Today&apos;s Priorities</h2>
                  <span className="text-[10px] font-bold text-forest-700 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/40 px-2 py-0.5 rounded-full">
                    Focus Targets
                  </span>
                </div>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                  Complete your essential student milestones for today.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateTaskModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 dark:bg-forest-950/40 hover:bg-forest-100 dark:hover:bg-forest-900/60 text-forest-800 dark:text-forest-300 text-xs font-bold transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Task
                </button>
                <Link
                  href="/tasks"
                  className="text-xs font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 hover:underline"
                >
                  View All
                </Link>
              </div>
            </div>

            {(!data.todayPriorities || data.todayPriorities.length === 0) ? (
              <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                <CheckSquare className="w-8 h-8 text-forest-200 dark:text-forest-800 mx-auto mb-2" />
                <p className="font-semibold text-gray-700 dark:text-gray-300">No priority tasks selected</p>
                <p className="text-[11px] mt-0.5 mb-3">Set your top 3 daily priorities in morning planning.</p>
                <button
                  type="button"
                  onClick={() => setIsDailyPlanModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-all"
                >
                  Set Daily Priorities
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.todayPriorities.map((task: any) => {
                  const isCompleted = task.status === "completed";
                  return (
                    <div
                      key={task._id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? "bg-forest-50/40 dark:bg-forest-950/20 border-forest-100 dark:border-forest-900/40"
                          : "bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => handleToggleTask(task)}
                          className={`w-5 h-5 rounded-lg flex items-center justify-center transition-all shrink-0 ${
                            isCompleted
                              ? "bg-forest-700 text-white shadow-xs"
                              : "border-2 border-gray-300 dark:border-gray-600 hover:border-forest-600 bg-white dark:bg-gray-800"
                          }`}
                        >
                          {isCompleted && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                        </button>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isCompleted ? "line-through text-gray-400 dark:text-gray-500 font-medium" : "text-gray-900 dark:text-gray-100"}`}>
                            {task.title}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-400 dark:text-gray-500">
                            <span className="capitalize text-forest-700 dark:text-forest-400 font-semibold">{task.priority} Priority</span>
                            {task.estimatedMinutes && (
                              <>
                                <span>•</span>
                                <span>{task.estimatedMinutes} min</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => router.push(`/focus?taskId=${task._id}`)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-[11px] font-bold transition-all shrink-0 shadow-xs"
                        >
                          <Play className="w-3 h-3 fill-current" />
                          Focus
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Daily Focus & Productivity Target (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 mb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Focus &amp; Productivity</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Daily study target &amp; score</p>
              </div>
              <span className="text-xs font-black text-forest-800 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/40 px-3 py-1 rounded-xl">
                Score: {data.productivityScore?.overallScore ?? 0}%
              </span>
            </div>

            <div className="space-y-4 pt-1">
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-forest-700 dark:text-forest-400" />
                    Deep Work Completed
                  </span>
                  <span className="text-forest-700 dark:text-forest-400">
                    {data.focusStatus?.completedMinutes ?? 0} / {data.focusStatus?.targetMinutes ?? 120} min
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-forest-700 dark:bg-forest-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(
                          ((data.focusStatus?.completedMinutes ?? 0) /
                            Math.max(1, data.focusStatus?.targetMinutes ?? 120)) *
                            100
                        )
                      )}%`,
                    }}
                  />
                </div>
              </div>

              {/* Today's Schedule Snapshot */}
              <div>
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  <span>Today&apos;s Schedule</span>
                  <Link href="/calendar" className="text-[11px] text-forest-700 dark:text-forest-400 hover:underline">
                    Full Calendar
                  </Link>
                </div>
                {(!data.todaySchedule || data.todaySchedule.length === 0) ? (
                  <p className="text-[11px] text-gray-400 dark:text-gray-500 py-2">No time blocks scheduled for today.</p>
                ) : (
                  <div className="space-y-2">
                    {data.todaySchedule.slice(0, 2).map((b: any) => {
                      const startTime = new Date(b.start).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
                      return (
                        <div key={b._id} className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 flex items-center justify-between text-xs">
                          <span className="font-semibold text-gray-800 dark:text-gray-200 truncate">{b.title}</span>
                          <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 font-medium">{startTime}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <Link
              href="/focus"
              className="w-full py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold text-center transition-colors shadow-xs"
            >
              Start Focus Timer
            </Link>
          </div>
        </div>
      </div>

      {/* Main Grid: Today's Habits (7 cols) & Weekly Progress / Discipline Heatmap (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Today's Habits Card (7 cols) - scrollable with fixed max height matching right column */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between h-full max-h-[640px]">
          <div className="flex flex-col min-h-0 flex-1">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 tracking-tight">Today&apos;s Habits</h2>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
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

            {/* Stacked Habit Prompt Banner */}
            {stackedPrompt && (
              <div className="mb-3 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center justify-between gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">🔗</span>
                  <div className="text-xs">
                    <p className="font-bold text-emerald-800 dark:text-emerald-300">
                      Next in your stack: <span className="text-forest-700 dark:text-forest-400 underline">{stackedPrompt.name}</span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      handleToggleHabit(stackedPrompt.id, "pending", "full");
                      setStackedPrompt(null);
                    }}
                    className="px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-xl font-bold text-xs transition-colors shadow-2xs"
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
              <div className="space-y-3 overflow-y-auto pr-1 flex-1 min-h-0">
                {data.todayHabits.map((habit: any) => {
                  const isCompleted = habit.todayStatus === "completed";
                  const isSkipped = habit.todayStatus === "skipped";

                  return (
                    <div
                      key={habit._id}
                      className={`group p-3.5 rounded-2xl border transition-all duration-150 flex items-center justify-between gap-3.5 ${
                        isCompleted
                          ? "bg-forest-50/40 dark:bg-forest-950/20 border-forest-100 dark:border-forest-900/40"
                          : isSkipped
                          ? "bg-orange-50/30 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40 opacity-60"
                          : "bg-white dark:bg-gray-800/60 border-gray-100 dark:border-gray-700/60 hover:border-gray-200 dark:hover:border-gray-600 hover:shadow-xs"
                      }`}
                    >
                      {/* Left: Checkbox + Icon + Info */}
                      <div className="flex items-center gap-3.5 min-w-0 flex-1">
                        {/* Custom Checkbox */}
                        <button
                          type="button"
                          onClick={() => handleToggleHabit(habit._id, habit.todayStatus, "full")}
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-150 shrink-0 ${
                            isCompleted
                              ? "bg-forest-700 text-white shadow-xs"
                              : "border-2 border-gray-300 dark:border-gray-600 hover:border-forest-600 bg-white dark:bg-gray-800"
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
                            <div className="flex items-center gap-2">
                              <p
                                className={`text-sm font-bold truncate transition-colors ${
                                  isCompleted ? "line-through text-gray-400 dark:text-gray-500 font-medium" : "text-gray-900 dark:text-gray-100"
                                }`}
                              >
                                {habit.name}
                              </p>
                              {habit.todayCompletionType === "micro" && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300">
                                  ⚡ Micro
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-medium">
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {habit.schedule?.time || "Anytime"}
                              </span>
                              <span>•</span>
                              <span className="capitalize">{habit.frequency?.replace("_", " ")}</span>
                              {habit.habitStackAfterHabitId && (
                                <>
                                  <span>•</span>
                                  <span className="text-forest-700 dark:text-forest-400 font-semibold">
                                    🔗 Stacked
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Right Action Menu */}
                      <div className="flex items-center gap-1.5">
                        {!isCompleted && !isSkipped && habit.twoMinuteVersion && (
                          <button
                            type="button"
                            onClick={() => handleToggleHabit(habit._id, habit.todayStatus, "micro")}
                            className="px-2 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors flex items-center gap-1 border border-amber-200 dark:border-amber-800/40"
                            title={`2-Minute version: ${habit.twoMinuteVersion}`}
                          >
                            <Zap className="w-3 h-3" />
                            <span>2-Min</span>
                          </button>
                        )}
                        {!isCompleted && !isSkipped && (
                          <button
                            type="button"
                            onClick={() => handleSkipHabit(habit._id)}
                            className="px-2.5 py-1 text-[11px] font-semibold text-gray-400 dark:text-gray-500 hover:text-orange-600 dark:hover:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-950/30 rounded-lg transition-colors"
                            title="Skip this habit for today"
                          >
                            Skip
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setSelectedHabitDetail(habit)}
                          className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
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
          <div className="pt-4 mt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs shrink-0">
            <Link
              href="/habits"
              className="font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 inline-flex items-center gap-1 group"
            >
              View All Habits
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-gray-400 dark:text-gray-500 font-medium">
              {data.stats.habitsCompleted.completed} of {data.stats.habitsCompleted.total} completed today
            </span>
          </div>
        </div>

        {/* Weekly Progress & Discipline Heatmap (5 cols) */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          {/* Weekly Progress Bar Chart */}
          <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Weekly Progress</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Daily completion percentage</p>
              </div>
              <span className="text-xs font-bold text-forest-700 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/40 px-2.5 py-1 rounded-full">
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
                          <div className="bg-gray-900 dark:bg-gray-800 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1 border border-gray-800 dark:border-gray-700">
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
                        fill={entry.isToday ? "#10b981" : entry.completionPercentage > 0 ? "#34d399" : "#334155"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Discipline Heatmap (replaces Month Overview) */}
          <ConsistencyHeatmap
            matrix={data.consistencyMatrix || []}
            currentStreak={data.stats?.currentStreak?.count || 0}
            longestStreak={data.stats?.currentStreak?.longest || 0}
          />
        </div>
      </div>

      {/* Secondary Row: Active Goals & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Active Goals (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800 mb-4 gap-2 flex-wrap">
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Active Goals</h3>
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Your ongoing milestones and targets</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateGoalModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Goal
                </button>
                <span className="text-xs font-bold text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-1 rounded-full">
                  {data.goals.length} active
                </span>
              </div>
            </div>

            {data.goals.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium space-y-3">
                <p>No active goals yet. Create targets like reading 5 books or a 30-day study streak!</p>
                <button
                  type="button"
                  onClick={() => setIsCreateGoalModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-forest-600 text-forest-700 dark:text-forest-400 hover:bg-forest-50 dark:hover:bg-forest-950/40 text-xs font-bold transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Your First Goal
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {data.goals.map((goal: any) => {
                  const pct = Math.min(
                    100,
                    Math.round(((goal.currentValue || 0) / (goal.targetValue || 1)) * 100)
                  );
                  const deadlineText = goal.progress?.deadlineText || "In progress";

                  return (
                    <Link
                      key={goal._id}
                      href={`/goals/${goal._id}`}
                      className="block p-4 rounded-2xl bg-gray-50/70 dark:bg-gray-800/50 hover:bg-gray-100/70 dark:hover:bg-gray-800 border border-gray-100 dark:border-gray-800 transition-all hover:shadow-xs group"
                    >
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <HabitIcon name={goal.icon || "target"} color={goal.color || "#1B4332"} size="sm" />
                          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 group-hover:text-forest-700 dark:group-hover:text-forest-400 transition-colors truncate">
                            {goal.title}
                          </p>
                        </div>
                        <span className="text-xs font-extrabold text-forest-700 dark:text-forest-400 shrink-0">
                          {goal.currentValue} / {goal.targetValue} {goal.unit}
                        </span>
                      </div>

                      {goal.description && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2.5 font-medium line-clamp-1">
                          {goal.description}
                        </p>
                      )}

                      <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden mb-2">
                        <div
                          className="bg-forest-600 dark:bg-forest-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>

                      <div className="flex items-center justify-between text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {deadlineText}
                        </span>
                        <span className="font-bold text-gray-600 dark:text-gray-300">{pct}%</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-xs">
            <Link
              href="/goals"
              className="font-bold text-forest-700 dark:text-forest-400 hover:text-forest-800 dark:hover:text-forest-300 inline-flex items-center gap-1 group"
            >
              View All Goals
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <span className="text-gray-400 dark:text-gray-500 font-medium">
              {data.goals.length} tracked milestone{data.goals.length === 1 ? "" : "s"}
            </span>
          </div>
        </div>

        {/* Recent Activity Feed (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          <div className="pb-4 border-b border-gray-100 dark:border-gray-800 mb-4">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">Recent Activity</h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">Your latest productivity logs</p>
          </div>

          {data.recentActivity.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 dark:text-gray-500 font-medium">
              No recent actions recorded yet.
            </div>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {data.recentActivity.map((act: any) => {
                const timeAgo = new Date(act.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                });

                return (
                  <div key={act._id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-forest-600 dark:bg-forest-500 shrink-0" />
                      <div>
                        <span className="font-semibold text-gray-800 dark:text-gray-200 capitalize">
                          {act.type.replace(/_/g, " ")}:
                        </span>{" "}
                        <span className="text-gray-600 dark:text-gray-400">
                          {act.metadata?.habitName || act.metadata?.goalTitle || act.metadata?.title || act.metadata?.message || "Action"}
                        </span>
                      </div>
                    </div>
                    <span className="text-[11px] text-gray-400 dark:text-gray-500 shrink-0 font-medium">{timeAgo}</span>
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
        availableHabits={data?.todayHabits || []}
      />

      {/* Add Goal Modal */}
      <GoalFormModal
        isOpen={isCreateGoalModalOpen}
        onClose={() => {
          setIsCreateGoalModalOpen(false);
          setGoalPreselectedHabitId(undefined);
        }}
        onSuccess={fetchDashboardData}
        initialHabitId={goalPreselectedHabitId}
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
        onCreateGoal={(h) => {
          setGoalPreselectedHabitId(h._id);
          setIsCreateGoalModalOpen(true);
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

      {/* Morning Plan Modal */}
      <DailyPlanModal
        isOpen={isDailyPlanModalOpen}
        onClose={() => setIsDailyPlanModalOpen(false)}
        onSuccess={() => revalidate(true)}
        todayDateStr={data.today?.date || new Date().toISOString().split("T")[0]}
        tasks={data.todayTasks || []}
        initialPlan={data.todayPlan}
      />

      {/* Evening Review Modal */}
      <DailyReviewModal
        isOpen={isDailyReviewModalOpen}
        onClose={() => setIsDailyReviewModalOpen(false)}
        onSuccess={() => revalidate(true)}
        todayDateStr={data.today?.date || new Date().toISOString().split("T")[0]}
        metrics={{
          habitsCompleted: data.stats?.habitsCompleted?.completed ?? 0,
          habitsTotal: data.stats?.habitsCompleted?.total ?? 0,
          tasksCompleted: data.stats?.tasksCompleted?.completed ?? 0,
          tasksTotal: data.stats?.tasksCompleted?.total ?? 0,
          focusMinutes: data.focusStatus?.completedMinutes ?? 0,
          productivityScore: data.productivityScore?.overallScore ?? 0,
        }}
        initialReview={data.todayReview}
      />

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isCreateTaskModalOpen}
        onClose={() => setIsCreateTaskModalOpen(false)}
        onSuccess={revalidate}
      />

      {/* Share Streak Viral Modal */}
      <ShareStreakModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        streakCount={data?.stats?.currentStreak?.count || 0}
        userName={data?.user?.name || "Student"}
      />
    </div>
  );
}
