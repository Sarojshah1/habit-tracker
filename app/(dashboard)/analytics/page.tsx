"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Flame,
  CheckCircle2,
  Clock,
  Filter,
  Award,
  Target,
  ArrowRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";
import { StatCard } from "@/components/ui/StatCard";
import { HabitIcon } from "@/components/ui/HabitIcon";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [range, setRange] = useState<"7days" | "4weeks" | "3months">("4weeks");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchAnalytics = React.useCallback(async () => {
    try {
      setError(false);
      const res = await fetch(`/api/analytics?range=${range}`);
      if (!res.ok) throw new Error("Failed to load analytics");
      const json = await res.json();
      if (json.success) {
        setData(json);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Analytics fetch error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [range]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 bg-gray-200 rounded-xl w-1/4 animate-pulse" />
        <LoadingSkeleton type="stats" />
        <LoadingSkeleton count={2} />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorState onRetry={fetchAnalytics} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
            Analytics
          </h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Track your progress, understand behavior, and see how far you&apos;ve come.
          </p>
        </div>

        {/* Date Range Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-white border border-gray-100 rounded-2xl shadow-xs">
          <button
            type="button"
            onClick={() => setRange("7days")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              range === "7days"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Last 7 Days
          </button>
          <button
            type="button"
            onClick={() => setRange("4weeks")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              range === "4weeks"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Last 4 Weeks
          </button>
          <button
            type="button"
            onClick={() => setRange("3months")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              range === "3months"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            Last 3 Months
          </button>
        </div>
      </div>

      {/* 4 Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Average Completion"
          value={data.summary.averageCompletion}
          subtitle={`Across selected ${range}`}
          icon={TrendingUp}
          colorClass="text-forest-700 bg-forest-50"
        />

        <StatCard
          title="Longest Streak"
          value={data.summary.longestStreak}
          subtitle={`Current: ${data.summary.currentStreak}`}
          icon={Flame}
          colorClass="text-orange-600 bg-orange-50"
        />

        <StatCard
          title="Habits Completed"
          value={data.summary.totalHabitsCompleted}
          subtitle="All-time check-ins"
          icon={CheckCircle2}
          colorClass="text-emerald-600 bg-emerald-50"
        />

        <StatCard
          title="Time Spent in Focus"
          value={data.summary.timeSpent}
          subtitle="Deep work sessions"
          icon={Clock}
          colorClass="text-blue-600 bg-blue-50"
        />
      </div>

      {/* Charts Row: Line Trend (8 cols) & Breakdown Donut (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Completion Rate Trend Chart (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="pb-4 mb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Completion Rate Trend
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Consistency trajectory over time
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-forest-50 text-forest-700">
              {range === "7days" ? "Daily" : "Weekly"} Rate
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="label"
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
                  ticks={[0, 25, 50, 75, 100]}
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-3 rounded-xl text-xs shadow-lg space-y-1">
                          <p className="font-bold">{pt.label}</p>
                          <p className="text-forest-300">Completion: {pt.rate}%</p>
                          <p className="text-gray-300">
                            {pt.completed} of {pt.scheduled} habits
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#1B4332"
                  strokeWidth={3}
                  dot={{ r: 4, fill: "#1B4332", strokeWidth: 2, stroke: "#ffffff" }}
                  activeDot={{ r: 6, fill: "#2D6A4F" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Habit Breakdown Donut Chart (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="pb-4 mb-2 border-b border-gray-100">
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Habit Breakdown
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Completed vs partial vs missed days
              </p>
            </div>

            <div className="h-52 w-full relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.breakdown}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {data.breakdown.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>

              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                <span className="text-xs text-gray-400 font-semibold">Total Days</span>
                <span className="text-2xl font-black text-gray-900">
                  {data.breakdown.reduce((acc: number, item: any) => acc + item.value, 0)}
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="pt-4 border-t border-gray-100 grid grid-cols-3 gap-2 text-center text-xs">
            {data.breakdown.map((item: any) => (
              <div key={item.name} className="p-2 rounded-xl bg-gray-50/70">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-gray-500 font-medium">{item.name}</span>
                </div>
                <p className="font-extrabold text-gray-900">{item.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lower Row: Most Consistent Habits (7 cols) & Weekly Activity (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Most Consistent Habits Ranking (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="pb-4 mb-4 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900 tracking-tight">
                Most Consistent Habits
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Ranked by lifetime &amp; rolling completion rates
              </p>
            </div>
            <Award className="w-5 h-5 text-amber-500" />
          </div>

          <div className="space-y-4">
            {data.rankedHabits.map((habit: any, index: number) => (
              <div key={habit.id} className="p-3.5 rounded-2xl bg-gray-50/60 border border-gray-100">
                <div className="flex items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="w-5 text-xs font-extrabold text-gray-400">#{index + 1}</span>
                    <HabitIcon name={habit.icon} color={habit.color} size="sm" />
                    <div className="truncate">
                      <p className="text-sm font-bold text-gray-900 truncate">{habit.name}</p>
                      <p className="text-[11px] text-gray-400 font-medium">
                        {habit.totalCompletions} total completions • {habit.currentStreak}d streak
                      </p>
                    </div>
                  </div>

                  <span className="text-sm font-black text-forest-800">
                    {habit.completionRate}%
                  </span>
                </div>

                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-forest-600 h-full rounded-full transition-all duration-500"
                    style={{ width: `${habit.completionRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Day-of-Week Activity (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
          <div className="pb-4 mb-4 border-b border-gray-100">
            <h3 className="text-base font-bold text-gray-900 tracking-tight">
              Weekly Activity by Day
            </h3>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Average completion rate from Monday to Sunday
            </p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.weeklyActivity} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
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
                  unit="%"
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const pt = payload[0].payload;
                      return (
                        <div className="bg-gray-900 text-white p-2.5 rounded-xl text-xs shadow-lg space-y-1">
                          <p className="font-bold">{pt.day}</p>
                          <p className="text-forest-300">Rate: {pt.completionRate}%</p>
                          <p className="text-gray-300">
                            {pt.completed} of {pt.scheduled} habits completed
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="completionRate" fill="#2D6A4F" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Goal Performance Analytics Section */}
      {data.goalMetrics && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-gray-100 flex-wrap gap-2">
            <div>
              <h3 className="text-lg font-bold text-gray-900 tracking-tight flex items-center gap-2">
                <Target className="w-5 h-5 text-forest-700" />
                Goal Performance &amp; Milestones
              </h3>
              <p className="text-xs text-gray-400 font-medium mt-0.5">
                Target tracking derived directly from habit completion milestones
              </p>
            </div>
            <Link
              href="/goals"
              className="text-xs font-bold text-forest-700 hover:text-forest-800 inline-flex items-center gap-1 group"
            >
              View All Goals
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>

          {/* Goal Summary Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-2xl bg-forest-50/60 border border-forest-100 text-center">
              <p className="text-xs text-gray-500 font-semibold">Active Goals</p>
              <p className="text-2xl font-black text-forest-900 mt-1">
                {data.goalMetrics.activeGoals}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100 text-center">
              <p className="text-xs text-gray-500 font-semibold">Completed Goals</p>
              <p className="text-2xl font-black text-emerald-700 mt-1">
                {data.goalMetrics.completedGoals}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-blue-50/60 border border-blue-100 text-center">
              <p className="text-xs text-gray-500 font-semibold">Average Progress</p>
              <p className="text-2xl font-black text-blue-900 mt-1">
                {data.goalMetrics.averageProgress}
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-gray-50/60 border border-gray-100 text-center">
              <p className="text-xs text-gray-500 font-semibold">Total Tracked</p>
              <p className="text-2xl font-black text-gray-900 mt-1">
                {data.goalMetrics.totalGoals}
              </p>
            </div>
          </div>

          {/* Goals Progress Breakdown List */}
          {data.goalMetrics.goals && data.goalMetrics.goals.length > 0 && (
            <div className="space-y-3 pt-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Ongoing Milestones
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {data.goalMetrics.goals.map((g: any) => (
                  <Link
                    key={g.id}
                    href={`/goals/${g.id}`}
                    className="p-3.5 rounded-2xl bg-gray-50/60 hover:bg-gray-50 border border-gray-100 transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5 gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <HabitIcon name={g.icon || "target"} color={g.color || "#1B4332"} size="sm" />
                          <p className="text-sm font-bold text-gray-900 group-hover:text-forest-700 truncate">
                            {g.title}
                          </p>
                        </div>
                        <span className="text-xs font-black text-forest-800 shrink-0">
                          {g.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                        <div
                          className="bg-forest-600 h-full rounded-full transition-all duration-500"
                          style={{ width: `${g.percentage}%` }}
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-medium mt-2 pt-1 border-t border-gray-100/60">
                      <span>
                        {g.currentValue} / {g.targetValue} {g.unit}
                      </span>
                      <span className="capitalize">{g.effectiveStatus}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
