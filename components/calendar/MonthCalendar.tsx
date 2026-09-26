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
  Droplets,
  Zap,
  Milk,
  Home,
  Wifi,
  Plus,
  Trash2,
  ShieldCheck,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import { HabitIcon } from "../ui/HabitIcon";
import { ExpenseFormModal } from "../expenses/ExpenseFormModal";

export interface CalendarDayData {
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
  exams?: any[];
  mockExams?: any[];
  // Household & Financial Metrics
  totalExpense?: number;
  totalIncome?: number;
  isNoSpendDay?: boolean;
  waterJars?: number;
  electricityUnits?: number;
  milkPackets?: number;
  gasCylinderReplaced?: boolean;
  isRentDue?: boolean;
  rentAmount?: number;
  isWifiDue?: boolean;
  wifiAmount?: number;
  expenses?: any[];
}

export interface MonthCalendarProps {
  year: number;
  month: number;
  todayDate: string;
  days: CalendarDayData[];
  onMonthChange: (year: number, month: number) => void;
  onToggleHabit: (habitId: string, date: string, status: string) => Promise<void>;
  onOpenHabitDetail: (habit: any) => void;
  onRefresh?: () => void;
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
  onRefresh,
}: MonthCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isUpdatingUtility, setIsUpdatingUtility] = useState(false);

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

  // Quick Utility increment helpers
  const handleQuickUtility = async (action: "increment_water" | "increment_milk", amount: number) => {
    if (!selectedDayData) return;
    setIsUpdatingUtility(true);
    try {
      await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          date: selectedDayData.date,
          amount,
        }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Utility update failed:", err);
    } finally {
      setIsUpdatingUtility(false);
    }
  };

  const handleSaveElectricityUnits = async (units: number) => {
    if (!selectedDayData) return;
    setIsUpdatingUtility(true);
    try {
      await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDayData.date,
          waterJars: selectedDayData.waterJars || 0,
          electricityUnits: units,
          milkPackets: selectedDayData.milkPackets || 0,
          gasCylinderReplaced: Boolean(selectedDayData.gasCylinderReplaced),
        }),
      });
      if (onRefresh) onRefresh();
    } catch (err) {
      console.error("Electricity update failed:", err);
    } finally {
      setIsUpdatingUtility(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm("Are you sure you want to delete this expense?")) return;
    try {
      const res = await fetch(`/api/expenses/${expenseId}`, { method: "DELETE" });
      if (res.ok && onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error("Delete expense error:", err);
    }
  };

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Calendar Grid Container (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm">
          {/* Calendar Navigation Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                {MONTH_NAMES[month - 1]} {year}
              </h2>
              <p className="text-xs text-gray-400 dark:text-gray-500 font-medium mt-0.5">
                Select any date to view habits, mock exams, household utilities (Water/Units/Milk), and expenses.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleTodayClick}
                className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center gap-1.5"
              >
                <CalendarIcon className="w-3.5 h-3.5 text-forest-600" />
                Today
              </button>

              <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800">
                <button
                  type="button"
                  onClick={handlePrevMonth}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-200 dark:bg-gray-700" />
                <button
                  type="button"
                  onClick={handleNextMonth}
                  className="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
                  aria-label="Next month"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Indicator Legend */}
          <div className="flex items-center gap-4 py-3 text-[11px] font-medium text-gray-500 dark:text-gray-400 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-forest-600" />
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
              <span>Partial</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white">TEST</span>
              <span>Mock Exam</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-blue-500 font-bold">💧 Jar</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-500 font-bold">⚡ Units</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-rose-500 font-bold">💰 Rs.</span>
            </div>
          </div>

          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 dark:text-gray-500 py-2">
            {WEEKDAY_NAMES.map((name) => (
              <div key={name}>{name}</div>
            ))}
          </div>

          {/* Month Days Grid */}
          <div className="grid grid-cols-7 gap-2 mt-1">
            {/* Padding blanks for previous month */}
            {paddingDays.map((_, i) => (
              <div
                key={`pad-${i}`}
                className="h-24 sm:h-28 rounded-xl bg-gray-50/40 dark:bg-gray-800/40 opacity-40"
              />
            ))}

            {/* Actual days */}
            {days.map((day) => {
              const isSelected = day.date === selectedDate;

              let badgeColor = "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 border-gray-200 dark:border-gray-700";
              if (day.indicator === "completed") {
                badgeColor = "bg-forest-100 dark:bg-forest-900/40 text-forest-800 dark:text-forest-300 border-forest-200 dark:border-forest-800";
              } else if (day.indicator === "partial") {
                badgeColor = "bg-orange-100 dark:bg-orange-900/40 text-orange-800 dark:text-orange-300 border-orange-200 dark:border-orange-800";
              } else if (day.indicator === "missed") {
                badgeColor = "bg-red-100 dark:bg-red-900/40 text-red-800 dark:text-red-300 border-red-200 dark:border-red-800";
              }

              return (
                <button
                  type="button"
                  key={day.date}
                  onClick={() => setSelectedDate(day.date)}
                  className={`min-h-[5.5rem] sm:min-h-[6rem] p-2 rounded-xl text-left flex flex-col justify-between transition-all duration-150 relative ${
                    isSelected
                      ? "ring-2 ring-forest-700 bg-forest-50/40 dark:bg-forest-900/20 shadow-xs"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800 border border-gray-100/70 dark:border-gray-800"
                  } ${day.isToday ? "bg-forest-50/20 dark:bg-forest-900/10" : "bg-white dark:bg-gray-900"}`}
                >
                  {/* Top Day Header: Number + Exam / Test badges + Scheduled fraction */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full ${
                        day.isToday
                          ? "bg-forest-700 text-white shadow-xs"
                          : isSelected
                          ? "text-forest-900 dark:text-forest-300 font-extrabold"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      {day.dayNumber}
                    </span>
                    <div className="flex items-center gap-1">
                      {day.exams && day.exams.length > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-rose-500 text-white shadow-xs" title="Target Exam Day">
                          EXAM
                        </span>
                      )}
                      {day.mockExams && day.mockExams.length > 0 && (
                        <span className="text-[9px] font-black px-1.5 py-0.2 rounded bg-amber-500 text-white shadow-xs" title="Mock Exam Taken">
                          TEST
                        </span>
                      )}
                      {day.isRentDue && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-rose-500 text-white shadow-xs" title="Rent Due">
                          RENT
                        </span>
                      )}
                      {day.isWifiDue && (
                        <span className="text-[8px] font-black px-1 py-0.2 rounded bg-cyan-600 text-white shadow-xs" title="WiFi Due">
                          WIFI
                        </span>
                      )}
                      {day.totalScheduled > 0 && (
                        <span className="text-[10px] font-semibold text-gray-400 dark:text-gray-500">
                          {day.completedCount}/{day.totalScheduled}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Micro-Pills: Water Jars, Electricity, Milk, LPG */}
                  {(day.waterJars || day.electricityUnits || day.milkPackets || day.gasCylinderReplaced || day.totalExpense) ? (
                    <div className="flex items-center gap-1 flex-wrap my-0.5">
                      {day.waterJars && day.waterJars > 0 ? (
                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400">
                          💧{day.waterJars}
                        </span>
                      ) : null}
                      {day.electricityUnits && day.electricityUnits > 0 ? (
                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400">
                          ⚡{day.electricityUnits}u
                        </span>
                      ) : null}
                      {day.milkPackets && day.milkPackets > 0 ? (
                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400">
                          🥛{day.milkPackets}p
                        </span>
                      ) : null}
                      {day.gasCylinderReplaced ? (
                        <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-red-500/10 text-red-600 dark:text-red-400">
                          🔥LPG
                        </span>
                      ) : null}
                      {day.totalExpense && day.totalExpense > 0 ? (
                        <span className="text-[8px] font-black text-rose-600 dark:text-rose-400">
                          Rs.{day.totalExpense}
                        </span>
                      ) : null}
                    </div>
                  ) : null}

                  {/* Status Indicator Bar / Pill */}
                  {day.totalScheduled > 0 ? (
                    <div className="mt-auto w-full">
                      <div className="w-full bg-gray-100 dark:bg-gray-800 h-1.5 rounded-full overflow-hidden mb-1">
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
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${badgeColor} block truncate text-center`}>
                        {day.completionPercentage}%
                      </span>
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-300 dark:text-gray-600 font-medium mt-auto block">—</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector Panel (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm flex flex-col space-y-4">
          {selectedDayData ? (
            <>
              {/* Header */}
              <div className="pb-3 border-b border-gray-100 dark:border-gray-800">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-forest-700 dark:text-forest-400">
                    Day Inspector
                  </span>
                  {selectedDayData.isToday && (
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-900/40 text-forest-800 dark:text-forest-300">
                      Today
                    </span>
                  )}
                </div>
                <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 mt-1">
                  {selectedDayData.date}
                </h3>

                {/* Day stats card */}
                <div className="grid grid-cols-2 gap-2 mt-3">
                  <div className="p-2.5 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold">Scheduled</p>
                    <p className="text-sm font-black text-gray-900 dark:text-gray-100">
                      {selectedDayData.totalScheduled} Habits
                    </p>
                  </div>
                  <div className="p-2.5 bg-forest-50/60 dark:bg-forest-900/20 rounded-xl border border-forest-100 dark:border-forest-800">
                    <p className="text-[10px] text-forest-600 dark:text-forest-400 font-semibold">Completed</p>
                    <p className="text-sm font-black text-forest-900 dark:text-forest-300">
                      {selectedDayData.completedCount} ({selectedDayData.completionPercentage}%)
                    </p>
                  </div>
                </div>

                {/* 🎯 Target Exams on this Day */}
                {selectedDayData.exams && selectedDayData.exams.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400 flex items-center gap-1">
                      <GraduationCap className="w-3.5 h-3.5" />
                      Target Exam Scheduled:
                    </span>
                    {selectedDayData.exams.map((ex: any) => (
                      <div key={ex._id} className="text-xs font-bold text-rose-900 dark:text-rose-200 flex justify-between">
                        <span>{ex.title} ({ex.subject})</span>
                        <span>Target: {ex.targetScore}%</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* 📝 Mock Exams Logged on this Day */}
                {selectedDayData.mockExams && selectedDayData.mockExams.length > 0 && (
                  <div className="mt-3 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-amber-400 flex items-center gap-1">
                      <BookOpen className="w-3.5 h-3.5" />
                      Mock Exam Completed:
                    </span>
                    {selectedDayData.mockExams.map((mx: any) => (
                      <div key={mx._id} className="text-xs font-bold text-amber-900 dark:text-amber-200 flex justify-between">
                        <span>{mx.title}</span>
                        <span className="font-extrabold text-amber-700 dark:text-amber-300">
                          Score: {mx.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 💧 Household Utilities Quick Counters for this Date */}
              <div className="p-3 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40 space-y-2.5">
                <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-600" />
                  Daily Utilities ({selectedDayData.date.substring(5)})
                </span>

                <div className="grid grid-cols-2 gap-2">
                  {/* Water Jar Counter */}
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">💧 Water Jars</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-black text-gray-900 dark:text-gray-100">
                        {selectedDayData.waterJars || 0}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isUpdatingUtility || (selectedDayData.waterJars || 0) <= 0}
                          onClick={() => handleQuickUtility("increment_water", -1)}
                          className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center hover:bg-gray-200 disabled:opacity-30"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingUtility}
                          onClick={() => handleQuickUtility("increment_water", 1)}
                          className="w-6 h-6 rounded-lg bg-blue-600 text-white font-bold flex items-center justify-center hover:bg-blue-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Milk Packet Counter */}
                  <div className="p-2 bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40 flex flex-col justify-between">
                    <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400">🥛 Milk Packets</p>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-base font-black text-gray-900 dark:text-gray-100">
                        {selectedDayData.milkPackets || 0}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          disabled={isUpdatingUtility || (selectedDayData.milkPackets || 0) <= 0}
                          onClick={() => handleQuickUtility("increment_milk", -1)}
                          className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold flex items-center justify-center hover:bg-gray-200 disabled:opacity-30"
                        >
                          -
                        </button>
                        <button
                          type="button"
                          disabled={isUpdatingUtility}
                          onClick={() => handleQuickUtility("increment_milk", 1)}
                          className="w-6 h-6 rounded-lg bg-orange-600 text-white font-bold flex items-center justify-center hover:bg-orange-700"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Electricity Units Input */}
                <div className="flex items-center justify-between gap-2 p-2 bg-white dark:bg-gray-900 rounded-xl border border-blue-100 dark:border-blue-900/40">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-gray-700 dark:text-gray-300">
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    Electricity Units (kWh):
                  </div>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    defaultValue={selectedDayData.electricityUnits || ""}
                    key={selectedDayData.date + (selectedDayData.electricityUnits || 0)}
                    onBlur={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      if (val !== (selectedDayData.electricityUnits || 0)) {
                        handleSaveElectricityUnits(val);
                      }
                    }}
                    className="w-16 px-2 py-1 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-black text-right text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>

              {/* 💰 Daily Expenses for this Day */}
              <div className="p-3 bg-gray-50/80 dark:bg-gray-800/40 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
                      Daily Expenses
                    </span>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500">
                      Total: Rs. {selectedDayData.totalExpense?.toLocaleString() || 0}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsExpenseModalOpen(true)}
                    className="flex items-center gap-1 px-2.5 py-1 bg-forest-700 hover:bg-forest-800 text-white rounded-lg text-xs font-bold transition-all shadow-xs"
                  >
                    <Plus className="w-3 h-3" />
                    Log Expense
                  </button>
                </div>

                {selectedDayData.expenses && selectedDayData.expenses.length > 0 ? (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto">
                    {selectedDayData.expenses.map((exp: any) => (
                      <div
                        key={exp._id}
                        className="flex items-center justify-between p-2 bg-white dark:bg-gray-900 rounded-xl border border-gray-100 dark:border-gray-800 text-xs"
                      >
                        <div className="truncate min-w-0 pr-2">
                          <p className="font-bold text-gray-900 dark:text-gray-100 truncate">
                            {exp.title}
                          </p>
                          <span className="text-[10px] text-gray-400 capitalize">
                            {exp.category?.replace("_", " ")}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-black text-gray-900 dark:text-gray-100">
                            Rs. {exp.amount?.toLocaleString()}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteExpense(exp._id)}
                            className="text-gray-400 hover:text-rose-500"
                            title="Delete expense"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-[11px] text-gray-400 italic">No expenses logged for this date.</p>
                )}
              </div>

              {/* Scheduled Habits List */}
              <div className="flex-1 py-2 space-y-2 overflow-y-auto max-h-[300px]">
                <h4 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                  Habits for this date
                </h4>

                {selectedDayData.habits.length === 0 ? (
                  <div className="p-4 text-center text-gray-400 dark:text-gray-500 text-xs font-medium">
                    No habits scheduled for this day.
                  </div>
                ) : (
                  selectedDayData.habits.map((h: any) => {
                    const isCompleted = h.status === "completed";
                    const isSkipped = h.status === "skipped";

                    return (
                      <div
                        key={h._id}
                        className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                          isCompleted
                            ? "bg-forest-50/50 dark:bg-forest-900/20 border-forest-200 dark:border-forest-800"
                            : isSkipped
                            ? "bg-orange-50/40 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800"
                            : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"
                        }`}
                      >
                        <div
                          className="flex items-center gap-2.5 cursor-pointer min-w-0"
                          onClick={() => onOpenHabitDetail(h)}
                        >
                          <HabitIcon name={h.icon} color={h.color} size="sm" />
                          <div className="truncate">
                            <p
                              className={`text-xs font-bold truncate ${
                                isCompleted
                                  ? "line-through text-gray-400 dark:text-gray-500"
                                  : "text-gray-900 dark:text-gray-100"
                              }`}
                            >
                              {h.name}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium flex items-center gap-1">
                              <Clock className="w-2.5 h-2.5" />
                              {h.schedule?.time || "Anytime"}
                            </span>

                            {/* Contributing goal badge */}
                            {h.contributingGoals && h.contributingGoals.length > 0 && isCompleted && (
                              <div className="mt-0.5 flex items-center gap-1 flex-wrap">
                                {h.contributingGoals.map((cg: any) => (
                                  <span
                                    key={cg.id}
                                    className="inline-flex items-center gap-1 text-[9px] font-bold text-forest-800 dark:text-forest-300 bg-forest-100/90 dark:bg-forest-900/50 px-1 py-0.2 rounded"
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
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                              isCompleted
                                ? "bg-forest-700 text-white shadow-xs"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-forest-100 hover:text-forest-700"
                            }`}
                            title={isCompleted ? "Mark incomplete" : "Mark completed"}
                          >
                            <Check className="w-3.5 h-3.5" strokeWidth={3} />
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
                            className={`w-7 h-7 rounded-xl flex items-center justify-center transition-all ${
                              isSkipped
                                ? "bg-orange-600 text-white shadow-xs"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-orange-100 hover:text-orange-600"
                            }`}
                            title={isSkipped ? "Undo skip" : "Skip habit"}
                          >
                            <XCircle className="w-3.5 h-3.5" />
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

      {/* Log Expense Modal from Calendar */}
      <ExpenseFormModal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        defaultDate={selectedDate}
        onSuccess={() => {
          if (onRefresh) onRefresh();
        }}
        habits={selectedDayData?.habits || []}
      />
    </>
  );
}
