"use client";

import React, { useState, useEffect } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { HabitDetailModal } from "@/components/habits/HabitDetailModal";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function CalendarPage() {
  const [calendarData, setCalendarData] = useState<any>(null);
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);

  const fetchCalendarData = async (yr: number, mo: number) => {
    try {
      setError(false);
      const res = await fetch(`/api/calendar?year=${yr}&month=${mo}`);
      if (!res.ok) throw new Error("Failed to load calendar");
      const data = await res.json();
      if (data.success) {
        setCalendarData(data.calendar);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Calendar fetch error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCalendarData(currentYear, currentMonth);
  }, [currentYear, currentMonth]);

  const handleMonthChange = (yr: number, mo: number) => {
    setCurrentYear(yr);
    setCurrentMonth(mo);
  };

  const handleToggleHabit = async (habitId: string, date: string, status: string) => {
    try {
      await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date,
          status: status === "pending" ? "uncompleted" : status,
          action: status === "pending" ? "remove" : "save",
        }),
      });
      // Refresh calendar
      fetchCalendarData(currentYear, currentMonth);
    } catch (err) {
      console.error("Toggle habit error:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    try {
      await fetch(`/api/habits/${deletingHabit._id}`, { method: "DELETE" });
      setDeletingHabit(null);
      fetchCalendarData(currentYear, currentMonth);
    } catch (err) {
      console.error("Delete habit error:", err);
    }
  };

  const handleArchive = async (habit: any) => {
    try {
      await fetch(`/api/habits/${habit._id}/archive`, { method: "POST" });
      fetchCalendarData(currentYear, currentMonth);
    } catch (err) {
      console.error("Archive habit error:", err);
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
          Calendar
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
          View, organize, and manage your daily habit completion history by date.
        </p>
      </div>

      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : error || !calendarData ? (
        <ErrorState onRetry={() => fetchCalendarData(currentYear, currentMonth)} />
      ) : (
        <MonthCalendar
          year={calendarData.year}
          month={calendarData.month}
          todayDate={calendarData.todayDate}
          days={calendarData.days}
          onMonthChange={handleMonthChange}
          onToggleHabit={handleToggleHabit}
          onOpenHabitDetail={(h) => setSelectedHabitDetail(h)}
        />
      )}

      {/* Habit Details Modal */}
      <HabitDetailModal
        isOpen={!!selectedHabitDetail}
        onClose={() => setSelectedHabitDetail(null)}
        habit={selectedHabitDetail}
        onEdit={(h) => {
          setSelectedHabitDetail(null);
          setEditingHabit(h);
        }}
        onArchive={handleArchive}
        onDelete={(h) => {
          setSelectedHabitDetail(null);
          setDeletingHabit(h);
        }}
      />

      {/* Edit Form Modal */}
      <HabitFormModal
        isOpen={!!editingHabit}
        onClose={() => setEditingHabit(null)}
        onSuccess={() => fetchCalendarData(currentYear, currentMonth)}
        initialData={editingHabit}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingHabit}
        onClose={() => setDeletingHabit(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Habit"
        message={`Are you sure you want to delete "${deletingHabit?.name}"?`}
        isDestructive={true}
      />
    </div>
  );
}
