"use client";

import React, { useState, useEffect } from "react";
import { MonthCalendar } from "@/components/calendar/MonthCalendar";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { HabitDetailModal } from "@/components/habits/HabitDetailModal";
import { HabitFormModal } from "@/components/habits/HabitFormModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useDataCache } from "@/lib/hooks/useDataCache";

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState<number>(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState<number>(new Date().getMonth() + 1);

  const [selectedHabitDetail, setSelectedHabitDetail] = useState<any>(null);
  const [editingHabit, setEditingHabit] = useState<any>(null);
  const [deletingHabit, setDeletingHabit] = useState<any>(null);

  const fetchCalendar = React.useCallback(async () => {
    const res = await fetch(`/api/calendar?year=${currentYear}&month=${currentMonth}`);
    if (!res.ok) throw new Error("Failed to load calendar");
    const data = await res.json();
    if (!data.success) throw new Error("Unsuccessful calendar response");
    return data;
  }, [currentYear, currentMonth]);

  const {
    data,
    isLoading,
    error,
    mutate,
    revalidate,
  } = useDataCache(
    `/api/calendar?year=${currentYear}&month=${currentMonth}`,
    fetchCalendar,
    { ttlMs: 60000 }
  );

  const calendarData = data?.calendar;

  const handleMonthChange = (yr: number, mo: number) => {
    setCurrentYear(yr);
    setCurrentMonth(mo);
  };

  const handleToggleHabit = async (habitId: string, date: string, status: string) => {
    // Instant optimistic update on calendar
    mutate((prev: any) => {
      if (!prev?.calendar?.days) return prev;
      const updatedDays = prev.calendar.days.map((day: any) => {
        if (day.date !== date) return day;
        const updatedHabits = (day.habits || []).map((h: any) =>
          h._id === habitId ? { ...h, status } : h
        );
        const completedCount = updatedHabits.filter((h: any) => h.status === "completed").length;
        const totalScheduled = updatedHabits.length;
        let indicator = "no_activity";
        if (totalScheduled > 0) {
          if (completedCount === totalScheduled) indicator = "completed";
          else if (completedCount > 0) indicator = "partial";
          else if (date < prev.calendar.todayDate) indicator = "missed";
        }
        return {
          ...day,
          habits: updatedHabits,
          completedCount,
          indicator,
          completionPercentage:
            totalScheduled > 0 ? Math.round((completedCount / totalScheduled) * 100) : 0,
        };
      });

      return {
        ...prev,
        calendar: {
          ...prev.calendar,
          days: updatedDays,
        },
      };
    });

    try {
      const res = await fetch("/api/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          habitId,
          date,
          status: status === "pending" ? "uncompleted" : status,
          action: status === "pending" ? "remove" : "save",
        }),
      });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Toggle habit error:", err);
      revalidate(true);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingHabit) return;
    const habitId = deletingHabit._id;
    setDeletingHabit(null);

    // Instant optimistic removal from days
    mutate((prev: any) => {
      if (!prev?.calendar?.days) return prev;
      const updatedDays = prev.calendar.days.map((day: any) => ({
        ...day,
        habits: (day.habits || []).filter((h: any) => h._id !== habitId),
      }));
      return {
        ...prev,
        calendar: { ...prev.calendar, days: updatedDays },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habitId}`, { method: "DELETE" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Delete habit error:", err);
      revalidate(true);
    }
  };

  const handleArchive = async (habit: any) => {
    const habitId = habit._id;
    // Instant optimistic removal
    mutate((prev: any) => {
      if (!prev?.calendar?.days) return prev;
      const updatedDays = prev.calendar.days.map((day: any) => ({
        ...day,
        habits: (day.habits || []).filter((h: any) => h._id !== habitId),
      }));
      return {
        ...prev,
        calendar: { ...prev.calendar, days: updatedDays },
      };
    });

    try {
      const res = await fetch(`/api/habits/${habitId}/archive`, { method: "POST" });
      if (!res.ok) revalidate(true);
    } catch (err) {
      console.error("Archive habit error:", err);
      revalidate(true);
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
        <ErrorState onRetry={() => revalidate(false)} />
      ) : (
        <MonthCalendar
          year={calendarData.year}
          month={calendarData.month}
          todayDate={calendarData.todayDate}
          days={calendarData.days}
          onMonthChange={handleMonthChange}
          onToggleHabit={handleToggleHabit}
          onOpenHabitDetail={(h) => setSelectedHabitDetail(h)}
          onRefresh={() => revalidate(true)}
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
        onSuccess={() => revalidate(true)}
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
