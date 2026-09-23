"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Timer, Sparkles, Clock, CheckCircle2 } from "lucide-react";
import { FocusTimer } from "@/components/focus/FocusTimer";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";

function FocusContent() {
  const searchParams = useSearchParams();
  const initialTaskId = searchParams.get("taskId") || undefined;

  const [habits, setHabits] = useState<any[]>([]);
  const [tasks, setTasks] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [totalMinutes, setTotalMinutes] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchData = async () => {
    try {
      setError(false);
      const [habitsRes, sessionsRes, tasksRes] = await Promise.all([
        fetch("/api/habits?filter=active"),
        fetch("/api/focus/sessions"),
        fetch("/api/tasks?status=all"),
      ]);

      if (!habitsRes.ok || !sessionsRes.ok) throw new Error("Failed to load data");

      const habitsJson = await habitsRes.json();
      const sessionsJson = await sessionsRes.json();
      const tasksJson = tasksRes.ok ? await tasksRes.json() : { success: false };

      if (habitsJson.success) setHabits(habitsJson.habits);
      if (tasksJson.success) setTasks(tasksJson.tasks || []);
      if (sessionsJson.success) {
        setSessions(sessionsJson.sessions);
        setTotalMinutes(sessionsJson.totalMinutes);
        setTotalSessions(sessionsJson.totalSessions);
      }
    } catch (err) {
      console.error("Focus mode error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSessionComplete = (newSession: any) => {
    setSessions((prev) => [newSession, ...prev]);
    setTotalMinutes((prev) => prev + (newSession.duration || 0));
    setTotalSessions((prev) => prev + 1);
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-2xl mx-auto py-8">
        <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-1/3 animate-pulse mx-auto" />
        <div className="w-80 h-80 rounded-full bg-gray-100 dark:bg-gray-800 animate-pulse mx-auto" />
      </div>
    );
  }

  if (error) {
    return <ErrorState onRetry={fetchData} />;
  }

  const focusHours = Math.floor(totalMinutes / 60);
  const remainingMins = totalMinutes % 60;

  return (
    <div className="space-y-10 py-2">
      {/* Header */}
      <div className="text-center max-w-lg mx-auto">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-2">
          <Sparkles className="w-3.5 h-3.5 text-forest-600" />
          Distraction-Free Mode
        </div>
        <h1 className="text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">Focus Mode</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Eliminate distractions. Set your timer and immerse yourself in your work.
        </p>
      </div>

      {/* Focus Timer */}
      <FocusTimer
        habits={habits}
        tasks={tasks}
        initialTaskId={initialTaskId}
        onSessionComplete={handleSessionComplete}
        onTaskCompleted={() => fetchData()}
      />

      {/* Focus Stats & Recent History */}
      <div className="max-w-2xl mx-auto pt-8 border-t border-gray-100 dark:border-gray-800">
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-xs">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Total Focus Time</p>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">
              {focusHours > 0 ? `${focusHours}h ${remainingMins}m` : `${remainingMins}m`}
            </p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 text-center shadow-xs">
            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500">Completed Sessions</p>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-1">{totalSessions}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 shadow-xs">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-4 pb-3 border-b border-gray-100 dark:border-gray-800">
            Recent Focus Sessions
          </h3>

          {sessions.length === 0 ? (
            <p className="text-center text-xs text-gray-400 dark:text-gray-500 py-6 font-medium">
              No sessions completed yet. Start your first focus timer above!
            </p>
          ) : (
            <div className="divide-y divide-gray-50 dark:divide-gray-800">
              {sessions.slice(0, 5).map((s) => {
                const dateStr = new Date(s.completedAt || s.startedAt).toLocaleDateString(
                  "en-US",
                  { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }
                );

                return (
                  <div key={s._id} className="py-3 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 flex items-center justify-center font-bold">
                        <Clock className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 dark:text-gray-100">
                          {s.habitId?.name || "General Deep Work"}
                        </p>
                        <p className="text-gray-400 dark:text-gray-500 text-[11px] font-medium">{dateStr}</p>
                      </div>
                    </div>

                    <span className="font-bold text-forest-800 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/60 px-2.5 py-1 rounded-full">
                      {s.duration} min
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<LoadingSkeleton count={3} />}>
      <FocusContent />
    </Suspense>
  );
}
