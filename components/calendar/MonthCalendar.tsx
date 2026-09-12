"use client";

import React, { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Flame,
  Calendar as CalendarIcon,
  Check,
  Target,
} from "lucide-react";
import { HabitIcon } from "../ui/HabitIcon";

interface CalendarDayData {
  date: string;
  dayNumber: number;
  dayOfWeek: number;
  isToday: boolean;
  isPast: boolean;
  isFuture: boolean;
  indicator: "completed" | "partial" | "missed" | "no_activity";
  completionPercentage: number;
  totalScheduled: number;
  completedCount: number;
  skippedCount: number;
  missedCount: number;
  pendingCount: number;
  habits: any[];
}

interface MonthCalendarProps {
  year: number;
  month: number;
  todayDate: string;
  days: CalendarDayData[];
  onMonthChange: (year: number, month: number) => void;
  onToggleHabit: (habitId: string, date: string, status: string) => Promise<void>;
  onOpenHabitDetail: (habit: any) => void;
}

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function MonthCalendar({
  year,
  month,
  todayDate,
  days,
  onMonthChange,
  onToggleHabit,
  onOpenHabitDetail,
}: MonthCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);

  const handlePrevMonth = () => {
    if (month === 1) {
      onMonthChange(year - 1, 12);
    } else {
      onMonthChange(year, month - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 12) {
      onMonthChange(year + 1, 1);
    } else {
      onMonthChange(year, month + 1);
    }
  };

  const handleTodayClick = () => {
    const [tYear, tMonth] = todayDate.split("-").map(Number);
    setSelectedDate(todayDate);
    onMonthChange(tYear, tMonth);
  };

  // Find selected day data
  const selectedDayData = days.find((d) => d.date === selectedDate) || days[0];

  // Calculate padding days for start of month
  const firstDayOfWeek = days.length > 0 ? days[0].dayOfWeek : 0;
  const paddingDays = Array.from({ length: firstDayOfWeek });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Calendar Grid Container (8 cols) */}
      <div className="lg:col-span-8 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        {/* Calendar Navigation Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-extrabold text-gray-900 tracking-tight">
              {MONTH_NAMES[month - 1]} {year}
            </h2>
            <p className="text-xs text-gray-400 font-medium mt-0.5">
              Select any date to view and track scheduled habits.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTodayClick}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Today
            </button>
            <div className="flex items-center gap-1 border border-gray-200 rounded-xl p-0.5">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Previous Month"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-100 transition-colors"
                aria-label="Next Month"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-gray-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-forest-600" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span>Partial</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span>Missed</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-200" />
            <span>No Activity</span>
          </div>
        </div>

        {/* Days of week header */}
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 py-2">
          {WEEKDAY_NAMES.map((name) => (
            <div key={name}>{name}</div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div className="grid grid-cols-7 gap-2 mt-1">
          {/* Padding blanks for previous month */}
          {paddingDays.map((_, i) => (
            <div key={`pad-${i}`} className="h-20 sm:h-24 rounded-xl bg-gray-50/40 opacity-40" />
          ))}

          {/* Actual days */}
          {days.map((day) => {
            const isSelected = day.date === selectedDate;

            let badgeColor = "bg-gray-100 text-gray-400";
            if (day.indicator === "completed") {
              badgeColor = "bg-forest-100 text-forest-800 border-forest-200";
            } else if (day.indicator === "partial") {
              badgeColor = "bg-orange-100 text-orange-800 border-orange-200";
            } else if (day.indicator === "missed") {
              badgeColor = "bg-red-100 text-red-800 border-red-200";
            }

            return (
              <button
                type="button"
                key={day.date}
                onClick={() => setSelectedDate(day.date)}
                className={`h-20 sm:h-24 p-2 rounded-xl text-left flex flex-col justify-between transition-all duration-150 relative ${
                  isSelected
                    ? "ring-2 ring-forest-700 bg-forest-50/40 shadow-xs"
                    : "hover:bg-gray-50 border border-gray-100/70"
                } ${day.isToday ? "bg-forest-50/20" : "bg-white"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                      day.isToday
                        ? "bg-forest-700 text-white shadow-xs"
                        : isSelected
                        ? "text-forest-900 font-extrabold"
                        : "text-gray-700"
                    }`}
                  >
                    {day.dayNumber}
                  </span>
                  {day.totalScheduled > 0 && (
                    <span className="text-[10px] font-semibold text-gray-400">
                      {day.completedCount}/{day.totalScheduled}
                    </span>
                  )}
                </div>

                {/* Status Indicator Bar / Pill */}
                {day.totalScheduled > 0 ? (
                  <div className="mt-auto">
                    <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mb-1">
                      <div
                        className={`h-full rounded-full transition-all ${
                          day.completionPercentage === 100
                            ? "bg-forest-600"
                            : day.completionPercentage > 0
                            ? "bg-orange-500"
                            : "bg-red-400"
                        }`}
                        style={{ width: `${day.completionPercentage}%` }}
                      />
                    </div>
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColor} block truncate`}>
                      {day.completionPercentage}%
                    </span>
                  </div>
                ) : (
                  <span className="text-[10px] text-gray-300 font-medium mt-auto block">—</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Day Inspector Panel (4 cols) */}
      <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-6 shadow-sm flex flex-col">
        {selectedDayData ? (
          <>
            <div className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-forest-700">
                  Day Inspector
                </span>
                {selectedDayData.isToday && (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 text-forest-800">
                    Today
                  </span>
                )}
              </div>
              <h3 className="text-lg font-black text-gray-900 mt-1">
                {selectedDayData.date}
              </h3>

              {/* Day stats card */}
              <div className="grid grid-cols-2 gap-2 mt-4">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[11px] text-gray-400 font-semibold">Scheduled</p>
                  <p className="text-base font-black text-gray-900 mt-0.5">
                    {selectedDayData.totalScheduled} Habits
                  </p>
                </div>
                <div className="p-3 bg-forest-50/60 rounded-xl border border-forest-100">
                  <p className="text-[11px] text-forest-600 font-semibold">Completed</p>
                  <p className="text-base font-black text-forest-900 mt-0.5">
                    {selectedDayData.completedCount} ({selectedDayData.completionPercentage}%)
                  </p>
                </div>
              </div>
            </div>

            {/* Scheduled Habits List */}
            <div className="flex-1 py-4 space-y-2.5 overflow-y-auto max-h-[450px]">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Habits for this date
              </h4>

              {selectedDayData.habits.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-xs font-medium">
                  No habits scheduled for this day.
                </div>
              ) : (
                selectedDayData.habits.map((h: any) => {
                  const isCompleted = h.status === "completed";
                  const isSkipped = h.status === "skipped";

                  return (
                    <div
                      key={h._id}
                      className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                        isCompleted
                          ? "bg-forest-50/50 border-forest-200"
                          : isSkipped
                          ? "bg-orange-50/40 border-orange-200"
                          : "bg-white border-gray-100 hover:border-gray-200"
                      }`}
                    >
                      <div
                        className="flex items-center gap-3 cursor-pointer min-w-0"
                        onClick={() => onOpenHabitDetail(h)}
                      >
                        <HabitIcon name={h.icon} color={h.color} size="sm" />
                        <div className="truncate">
                          <p
                            className={`text-sm font-bold truncate ${
                              isCompleted ? "line-through text-gray-400" : "text-gray-900"
                            }`}
                          >
                            {h.name}
                          </p>
                          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {h.schedule?.time || "Anytime"}
                          </span>

                          {/* Contributing goal badge */}
                          {h.contributingGoals && h.contributingGoals.length > 0 && isCompleted && (
                            <div className="mt-1 flex items-center gap-1 flex-wrap">
                              {h.contributingGoals.map((cg: any) => (
                                <span
                                  key={cg.id}
                                  className="inline-flex items-center gap-1 text-[10px] font-bold text-forest-800 bg-forest-100/90 px-1.5 py-0.5 rounded-md"
                                  title={`Contributes to: ${cg.title}`}
                                >
                                  🎯 {cg.title} +1
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Complete / Skip Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() =>
                            onToggleHabit(
                              h._id,
                              selectedDayData.date,
                              isCompleted ? "pending" : "completed"
                            )
                          }
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isCompleted
                              ? "bg-forest-700 text-white shadow-xs"
                              : "bg-gray-100 text-gray-400 hover:bg-forest-100 hover:text-forest-700"
                          }`}
                          title={isCompleted ? "Mark incomplete" : "Mark completed"}
                        >
                          <Check className="w-4 h-4" strokeWidth={3} />
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            onToggleHabit(
                              h._id,
                              selectedDayData.date,
                              isSkipped ? "pending" : "skipped"
                            )
                          }
                          className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                            isSkipped
                              ? "bg-orange-600 text-white shadow-xs"
                              : "bg-gray-100 text-gray-400 hover:bg-orange-100 hover:text-orange-600"
                          }`}
                          title={isSkipped ? "Undo skip" : "Skip habit"}
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
