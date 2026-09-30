"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Brain,
  TrendingUp,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Flame,
  ShieldCheck,
  Zap,
} from "lucide-react";
import type { CoachDebrief } from "@/lib/services/aiCoach";

export function AiStudyCoachWidget() {
  const [debrief, setDebrief] = useState<CoachDebrief | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const fetchDebrief = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/coach");
      const json = await res.json();
      if (json.success && json.data) {
        setDebrief(json.data);
      }
    } catch (err) {
      console.error("Failed to load AI coach debrief:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDebrief();
  }, []);

  if (isLoading && !debrief) {
    return (
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-md w-1/3" />
            <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-md w-1/2" />
          </div>
        </div>
      </div>
    );
  }

  if (!debrief) return null;

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-5 sm:p-6 transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-forest-600 to-emerald-700 text-white flex items-center justify-center shadow-md shadow-forest-600/20 shrink-0">
            <Brain className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black uppercase tracking-wider text-forest-700 dark:text-emerald-400 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5" />
                AI Study Coach
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-950/80 text-forest-800 dark:text-emerald-300 border border-forest-200/50 dark:border-forest-800/60">
                {debrief.tierEmoji} {debrief.tierName}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight mt-0.5">
              {debrief.headline}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={fetchDebrief}
            disabled={isLoading}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title="Refresh AI Coach Debrief"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            title={isCollapsed ? "Expand Debrief" : "Collapse Debrief"}
          >
            {isCollapsed ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {!isCollapsed && (
        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800/80 space-y-4 animate-in fade-in duration-200">
          {/* Summary */}
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed font-normal">
            {debrief.summary}
          </p>

          {/* Momentum Score Bar */}
          <div className="bg-gray-50 dark:bg-gray-800/60 rounded-2xl p-3.5 border border-gray-100 dark:border-gray-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 fill-current" />
              <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Cognitive Momentum Score
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-28 sm:w-44 bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-forest-500 to-emerald-400 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${debrief.momentumScore}%` }}
                />
              </div>
              <span className="text-xs font-black text-gray-900 dark:text-gray-100">
                {debrief.momentumScore}/100
              </span>
            </div>
          </div>

          {/* Actionable Recommendations */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {debrief.recommendations.map((rec) => (
              <div
                key={rec.id}
                className="p-4 rounded-2xl bg-gray-50/90 dark:bg-gray-800/80 border border-gray-200/70 dark:border-gray-750 flex flex-col justify-between space-y-3 hover:border-forest-500/50 dark:hover:border-forest-500/50 transition-all shadow-xs"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="w-7 h-7 rounded-xl bg-forest-100/80 dark:bg-forest-950/80 text-forest-800 dark:text-forest-300 flex items-center justify-center shrink-0 text-sm">
                      {rec.icon}
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 line-clamp-1">
                      {rec.title}
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed line-clamp-3">
                    {rec.description}
                  </p>
                </div>

                {rec.actionLabel && rec.actionUrl && (
                  <Link
                    href={rec.actionUrl}
                    className="inline-flex items-center gap-1.5 text-[11px] font-bold text-forest-600 dark:text-emerald-400 hover:text-forest-700 dark:hover:text-emerald-300 pt-1 group"
                  >
                    <span>{rec.actionLabel}</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Key Insights Row */}
          {debrief.keyInsights && debrief.keyInsights.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
              {debrief.keyInsights.map((insight, idx) => (
                <div
                  key={idx}
                  className="px-3.5 py-2.5 rounded-xl bg-gray-50/80 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-750 text-left"
                >
                  <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider">
                    {insight.title}
                  </p>
                  <p className="text-xs font-black text-gray-900 dark:text-gray-100 mt-0.5">
                    {insight.value}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
