"use client";

import React from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface HistoryPoint {
  date: string;
  value: number;
  percentage: number;
}

interface GoalProgressChartProps {
  history: HistoryPoint[];
  targetValue: number;
  unit: string;
  color?: string;
}

export function GoalProgressChart({
  history,
  targetValue,
  unit,
  color = "#1B4332",
}: GoalProgressChartProps) {
  if (!history || history.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-xs text-gray-400 dark:text-gray-500 font-medium">
        No progress history recorded yet.
      </div>
    );
  }

  // Format data for chart
  const data = history.map((pt) => {
    const [, month, day] = pt.date.split("-");
    return {
      date: pt.date,
      displayDate: `${month}/${day}`,
      value: pt.value,
      percentage: pt.percentage,
    };
  });

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 15, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="goalGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={color} stopOpacity={0.25} />
              <stop offset="95%" stopColor={color} stopOpacity={0.0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-100 dark:text-gray-800" vertical={false} />
          <XAxis
            dataKey="displayDate"
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
            domain={[0, targetValue]}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const pt = payload[0].payload;
                return (
                  <div className="bg-gray-900 dark:bg-gray-800 text-white p-3 rounded-xl text-xs shadow-lg space-y-1 border border-gray-800 dark:border-gray-700">
                    <p className="font-bold">{pt.date}</p>
                    <p className="text-forest-300">
                      Progress: {pt.value} / {targetValue} {unit}
                    </p>
                    <p className="text-gray-300">Completion: {pt.percentage}%</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2.5}
            fillOpacity={1}
            fill="url(#goalGradient)"
            dot={{ r: 3, fill: color, strokeWidth: 1, stroke: "#ffffff" }}
            activeDot={{ r: 5, fill: color }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
