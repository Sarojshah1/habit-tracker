"use client";

import React, { useState } from "react";
import { Award, Flame, Zap, Shield, Sparkles, Lock, CheckCircle2 } from "lucide-react";
import { useDataCache } from "@/lib/hooks/useDataCache";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { UserBadgeProgress } from "@/lib/services/badges";

export function BadgeShowcase() {
  const [filter, setFilter] = useState<string>("all");

  const fetchBadges = React.useCallback(async () => {
    const res = await fetch("/api/badges");
    if (!res.ok) throw new Error("Failed to load badges");
    const json = await res.json();
    return json;
  }, []);

  const { data, isLoading } = useDataCache("/api/badges", fetchBadges, { ttlMs: 60000 });

  const badges: UserBadgeProgress[] = data?.badges || [];
  const level = data?.level || 1;
  const xp = data?.xp || 0;
  const nextLevelXp = data?.nextLevelXp || 200;
  const unlockedCount = data?.unlockedCount || 0;
  const totalCount = data?.totalCount || 0;

  const currentLevelProgress = Math.min(
    100,
    Math.round(((xp % 200) / 200) * 100)
  );

  const filteredBadges =
    filter === "all"
      ? badges
      : filter === "unlocked"
      ? badges.filter((b) => b.unlocked)
      : badges.filter((b) => b.category === filter);

  if (isLoading) {
    return <LoadingSkeleton count={3} type="card" />;
  }

  const getTierColors = (tier: string, unlocked: boolean) => {
    if (!unlocked) {
      return "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/40 opacity-70";
    }
    switch (tier) {
      case "diamond":
        return "border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-transparent to-blue-500/10 shadow-xs";
      case "gold":
        return "border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/10 shadow-xs";
      case "silver":
        return "border-slate-400/40 bg-gradient-to-br from-slate-400/10 via-transparent to-gray-500/10 shadow-xs";
      default:
        return "border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-transparent to-forest-500/10 shadow-xs";
    }
  };

  return (
    <div
      id="discipline-achievements"
      className="scroll-mt-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6"
    >
      {/* Header & Level Progress */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-gray-100 dark:border-gray-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 dark:text-amber-400">
              <Award className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Discipline & Achievements
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Unlock achievements through streak consistency, 2-minute fallbacks, and deep focus.
          </p>
        </div>

        {/* Level & XP Card */}
        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-100 dark:border-gray-700/80 flex items-center gap-4 min-w-[260px]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-forest-700 to-emerald-500 text-white font-black text-lg flex items-center justify-center shadow-sm">
            Lv.{level}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between text-xs font-bold mb-1">
              <span className="text-gray-900 dark:text-gray-100">Discipline Level {level}</span>
              <span className="text-forest-700 dark:text-forest-400">{xp} XP</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full overflow-hidden">
              <div
                className="bg-forest-600 dark:bg-forest-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${currentLevelProgress}%` }}
              />
            </div>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1">
              {nextLevelXp - xp} XP to Level {level + 1}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { key: "all", label: `All (${totalCount})` },
          { key: "unlocked", label: `Unlocked (${unlockedCount})` },
          { key: "consistency", label: "Consistency" },
          { key: "behavior", label: "Atomic Habits" },
          { key: "focus", label: "Focus" },
          { key: "resilience", label: "Resilience" },
        ].map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setFilter(tab.key)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filter === tab.key
                ? "bg-forest-700 text-white shadow-xs"
                : "bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBadges.map((badge) => {
          const progressPercent = Math.min(
            100,
            Math.round((badge.currentProgress / badge.maxProgress) * 100)
          );

          return (
            <div
              key={badge.id}
              className={`p-4 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${getTierColors(
                badge.tier,
                badge.unlocked
              )}`}
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div className="w-11 h-11 rounded-2xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 flex items-center justify-center text-2xl shadow-2xs">
                    {badge.icon}
                  </div>
                  {badge.unlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Unlocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">
                    {badge.title}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                    {badge.description}
                  </p>
                </div>
              </div>

              {/* Progress Bar for Locked Badges */}
              <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-800/60 text-xs">
                <div className="flex items-center justify-between text-[11px] font-semibold text-gray-500 dark:text-gray-400 mb-1">
                  <span>Progress</span>
                  <span>
                    {badge.unlocked
                      ? "100%"
                      : `${badge.currentProgress} / ${badge.maxProgress}`}
                  </span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      badge.unlocked
                        ? "bg-emerald-500"
                        : "bg-forest-600 dark:bg-forest-400"
                    }`}
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
