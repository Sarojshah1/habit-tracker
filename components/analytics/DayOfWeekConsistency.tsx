"use client";

import React from "react";
import { Calendar, TrendingUp, AlertCircle, Sparkles } from "lucide-react";

interface DayStat {
  day: string;
  scheduled: number;
  completed: number;
  rate: number;
}

interface DayOfWeekConsistencyProps {
  stats?: DayStat[];
}

export function DayOfWeekConsistency({ stats = [] }: DayOfWeekConsistencyProps) {
  if (!stats || stats.length === 0) return null;

  // Find best and lowest day
  const activeDays = stats.filter((s) => s.scheduled > 0);
  const bestDay = [...activeDays].sort((a, b) => b.rate - a.rate)[0];
  const lowestDay = [...activeDays].sort((a, b) => a.rate - b.rate)[0];

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400">
              <Calendar className="w-5 h-5" />
            </span>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Weekday Consistency Pattern
            </h3>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            See which days of the week your discipline peaks and where consistency dips.
          </p>
        </div>

        {bestDay && bestDay.rate > 0 && (
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs font-bold text-emerald-700 dark:text-emerald-300">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Peak Day: {bestDay.day} ({bestDay.rate}%)</span>
          </div>
        )}
      </div>

      {/* Weekday Bars */}
      <div className="grid grid-cols-7 gap-2 sm:gap-3 pt-2">
        {stats.map((item) => {
          const isBest = bestDay && bestDay.day === item.day && bestDay.rate > 0;
          const isLowest = lowestDay && lowestDay.day === item.day && lowestDay.rate < 50;

          return (
            <div
              key={item.day}
              className={`p-3 rounded-2xl flex flex-col items-center justify-between text-center transition-all ${
                isBest
                  ? "bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 shadow-xs"
                  : isLowest
                  ? "bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40"
                  : "bg-gray-50/60 dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800"
              }`}
            >
              <span className="text-xs font-bold text-gray-600 dark:text-gray-400">
                {item.day}
              </span>

              {/* Visual Mini Vertical Bar */}
              <div className="w-full max-w-[28px] h-20 bg-gray-200 dark:bg-gray-700/60 rounded-full my-2.5 relative flex flex-col justify-end p-0.5 overflow-hidden">
                <div
                  className={`w-full rounded-full transition-all duration-500 ${
                    item.rate >= 80
                      ? "bg-emerald-500"
                      : item.rate >= 50
                      ? "bg-forest-600 dark:bg-forest-400"
                      : item.rate > 0
                      ? "bg-amber-500"
                      : "bg-transparent"
                  }`}
                  style={{ height: `${Math.max(item.rate, 6)}%` }}
                />
              </div>

              <div>
                <p className="text-xs font-black text-gray-900 dark:text-gray-100">
                  {item.rate}%
                </p>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">
                  {item.completed}/{item.scheduled}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Behavioral Insights Hint */}
      {lowestDay && lowestDay.scheduled > 0 && lowestDay.rate < 60 && (
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-xs text-amber-900 dark:text-amber-200">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p>
            <span className="font-bold">Atomic Habits Tip: </span>
            Your completion drops to <span className="font-bold">{lowestDay.rate}% on {lowestDay.day}s</span>. Try using the <span className="font-semibold underline">2-Minute Rule</span> or scheduling lighter versions on {lowestDay.day} to keep momentum flowing without burnout.
          </p>
        </div>
      )}
    </div>
  );
}
