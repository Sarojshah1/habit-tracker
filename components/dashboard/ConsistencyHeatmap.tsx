"use client";

import React from "react";
import { Flame, Calendar, Award } from "lucide-react";

interface MatrixDay {
  date: string;
  count: number;
  level: number; // 0 to 4
}

interface ConsistencyHeatmapProps {
  matrix: MatrixDay[];
  currentStreak: number;
  longestStreak: number;
}

export function ConsistencyHeatmap({
  matrix = [],
  currentStreak = 0,
  longestStreak = 0,
}: ConsistencyHeatmapProps) {
  const getLevelColor = (level: number) => {
    switch (level) {
      case 1:
        return "bg-emerald-200 dark:bg-emerald-950 text-emerald-800 border-emerald-300 dark:border-emerald-800";
      case 2:
        return "bg-emerald-400 dark:bg-emerald-800 text-white border-emerald-500";
      case 3:
        return "bg-emerald-500 dark:bg-emerald-600 text-white border-emerald-600";
      case 4:
        return "bg-forest-700 dark:bg-emerald-500 text-white border-forest-800";
      default:
        return "bg-gray-100 dark:bg-gray-800/80 border-gray-200 dark:border-gray-800";
    }
  };

  const totalActions = matrix.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <div className="p-6 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">
              90-Day Discipline Heatmap
            </h3>
            <span className="text-[10px] font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/60 px-2 py-0.5 rounded-full">
              {totalActions} completions logged
            </span>
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
            Daily consistency record across habits and mock tests.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
            <Flame className="w-3.5 h-3.5 fill-current" />
            {currentStreak}d Active
          </span>
          <span className="text-gray-300 dark:text-gray-700">•</span>
          <span className="flex items-center gap-1 font-bold text-forest-700 dark:text-forest-400">
            <Award className="w-3.5 h-3.5" />
            {longestStreak}d Best
          </span>
        </div>
      </div>

      {/* Grid of 90 days */}
      <div className="overflow-x-auto pb-1">
        <div className="inline-grid grid-rows-7 grid-flow-col gap-1.5 min-w-[500px]">
          {matrix.map((cell) => (
            <div
              key={cell.date}
              title={`${cell.date}: ${cell.count} completions`}
              className={`w-3.5 h-3.5 rounded-[4px] border transition-all hover:scale-125 cursor-pointer ${getLevelColor(
                cell.level
              )}`}
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center justify-between text-[11px] text-gray-400 pt-3 mt-3 border-t border-gray-100 dark:border-gray-800">
        <span>90 days ago</span>
        <div className="flex items-center gap-1">
          <span>Less</span>
          <div className="w-2.5 h-2.5 rounded-[3px] bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-200 dark:bg-emerald-950 border border-emerald-300" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-emerald-400 dark:bg-emerald-800" />
          <div className="w-2.5 h-2.5 rounded-[3px] bg-forest-700 dark:bg-emerald-500" />
          <span>More</span>
        </div>
        <span>Today</span>
      </div>
    </div>
  );
}
