"use client";

import React from "react";
import { Target, CheckCircle2, AlertTriangle, TrendingUp } from "lucide-react";
import { StatCard } from "@/components/ui/StatCard";

interface GoalSummaryCardsProps {
  stats: {
    activeGoals: number;
    completedGoals: number;
    atRiskGoals: number;
    overallProgress: number;
  };
}

export function GoalSummaryCards({ stats }: GoalSummaryCardsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Active Goals"
        value={String(stats.activeGoals)}
        subtitle="Currently in progress"
        icon={Target}
        colorClass="text-forest-700 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/40"
        badgeText="Active"
      />

      <StatCard
        title="Completed Goals"
        value={String(stats.completedGoals)}
        subtitle="Targets achieved"
        icon={CheckCircle2}
        colorClass="text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40"
        badgeText="Success"
      />

      <StatCard
        title="Goals At Risk"
        value={String(stats.atRiskGoals)}
        subtitle="Behind pace or overdue"
        icon={AlertTriangle}
        colorClass={stats.atRiskGoals > 0 ? "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40" : "text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800"}
        badgeText={stats.atRiskGoals > 0 ? "Attention" : undefined}
      />

      <StatCard
        title="Overall Progress"
        value={`${stats.overallProgress}%`}
        subtitle="Average active goal completion"
        icon={TrendingUp}
        colorClass="text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40"
      />
    </div>
  );
}
