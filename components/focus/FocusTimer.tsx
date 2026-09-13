"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Target,
  Clock,
  ListTodo,
  CheckCircle2,
} from "lucide-react";
import { formatTime } from "@/lib/utils";

interface HabitOption {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface TaskOption {
  _id: string;
  title: string;
  priority: string;
  dueDate: string;
  estimatedMinutes: number;
  actualMinutes: number;
  habitId?: any;
  goalId?: any;
  status: string;
}

interface FocusTimerProps {
  habits?: HabitOption[];
  tasks?: TaskOption[];
  initialTaskId?: string;
  onSessionComplete?: (session: any) => void;
  onTaskCompleted?: (taskId: string) => void;
}

const TIMER_MODES = [
  { id: "pomodoro", name: "Pomodoro", minutes: 25 },
  { id: "short", name: "Short Focus", minutes: 10 },
  { id: "long", name: "Long Focus", minutes: 50 },
  { id: "custom", name: "Custom", minutes: 30 },
];

export function FocusTimer({
  habits = [],
  tasks = [],
  initialTaskId,
  onSessionComplete,
  onTaskCompleted,
}: FocusTimerProps) {
  const [activeMode, setActiveMode] = useState("pomodoro");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);

  // Selected work items
  const [selectedTaskId, setSelectedTaskId] = useState<string>(initialTaskId || "");
  const [selectedHabitId, setSelectedHabitId] = useState<string>("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Post session states
  const [sessionSaved, setSessionSaved] = useState(false);
  const [lastCompletedSession, setLastCompletedSession] = useState<any>(null);
  const [showTaskCompletionPrompt, setShowTaskCompletionPrompt] = useState(false);
  const [taskMarkedComplete, setTaskMarkedComplete] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

  // Synchronize initialTaskId if provided
  useEffect(() => {
    if (initialTaskId && tasks.length > 0) {
      const matched = tasks.find((t) => t._id === initialTaskId);
      if (matched) {
        setSelectedTaskId(matched._id);
        setSessionNotes(`Focus on: ${matched.title}`);
        if (matched.habitId?._id || matched.habitId) {
          setSelectedHabitId(matched.habitId._id || matched.habitId);
        }
        if (matched.estimatedMinutes) {
          setDurationMinutes(matched.estimatedMinutes);
          setSecondsRemaining(matched.estimatedMinutes * 60);
          setActiveMode("custom");
        }
      }
    }
  }, [initialTaskId, tasks]);

  // Handle task selection
  const handleSelectTask = (tId: string) => {
    setSelectedTaskId(tId);
    if (!tId) {
      setSessionNotes("");
      return;
    }

    const t = tasks.find((task) => task._id === tId);
    if (t) {
      setSessionNotes(`Focus on: ${t.title}`);
      if (t.habitId) {
        setSelectedHabitId(typeof t.habitId === "object" ? t.habitId._id : t.habitId);
      }
      if (t.estimatedMinutes && !isRunning) {
        setDurationMinutes(t.estimatedMinutes);
        setSecondsRemaining(t.estimatedMinutes * 60);
        setActiveMode("custom");
      }
    }
  };

  // Play soothing bell tone via Web Audio API
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5 note
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.8); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 2.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 2.5);
    } catch (e) {
      console.warn("Audio chime error:", e);
    }
  };

  const handleModeChange = (modeId: string, minutes: number) => {
    setIsRunning(false);
    setActiveMode(modeId);
    setDurationMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setSessionSaved(false);
    setShowTaskCompletionPrompt(false);
  };

  const toggleTimer = () => {
    if (!isRunning && !startTimeRef.current) {
      startTimeRef.current = new Date();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setSecondsRemaining(durationMinutes * 60);
    startTimeRef.current = null;
    setSessionSaved(false);
    setShowTaskCompletionPrompt(false);
  };

  const handleCompleteSession = React.useCallback(async () => {
    try {
      const selectedTask = tasks.find((t) => t._id === selectedTaskId);

      const res = await fetch("/api/focus/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: durationMinutes,
          status: "completed",
          taskId: selectedTaskId || undefined,
          habitId: selectedHabitId || undefined,
          goalId: selectedTask?.goalId?._id || selectedTask?.goalId || undefined,
          notes: sessionNotes || "Productive deep work session",
          startedAt:
            startTimeRef.current?.toISOString() ||
            new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionSaved(true);
        setLastCompletedSession(data.session);
        if (selectedTaskId) {
          setShowTaskCompletionPrompt(true);
        }
        if (onSessionComplete) onSessionComplete(data.session);
      }
    } catch (err) {
      console.error("Failed to save focus session:", err);
    }
  }, [durationMinutes, onSessionComplete, selectedHabitId, selectedTaskId, sessionNotes, tasks]);

  const chimeRef = useRef(playChime);
  chimeRef.current = playChime;
  const completeRef = useRef(handleCompleteSession);
  completeRef.current = handleCompleteSession;

  // Timer Tick
  useEffect(() => {
    if (isRunning) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            chimeRef.current();
            completeRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRunning]);

  // Mark task completed response
  const handleTaskCompletionAnswer = async (completed: boolean) => {
    if (completed && selectedTaskId) {
      try {
        await fetch(`/api/tasks/${selectedTaskId}/complete`, { method: "POST" });
        setTaskMarkedComplete(true);
        if (onTaskCompleted) onTaskCompleted(selectedTaskId);
      } catch (err) {
        console.error("Failed to complete task:", err);
      }
    }
    setShowTaskCompletionPrompt(false);
  };

  const totalSeconds = durationMinutes * 60;
  const progressPercent = Math.max(
    0,
    Math.min(100, ((totalSeconds - secondsRemaining) / totalSeconds) * 100)
  );

  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  const currentTask = tasks.find((t) => t._id === selectedTaskId);

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      {/* What are you working on? Task Selector Banner */}
      <div className="w-full max-w-lg mb-6 bg-white border border-gray-100 rounded-3xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-forest-700" />
            What are you working on?
          </label>
          {currentTask && (
            <span className="text-[11px] font-bold text-forest-800 bg-forest-50 px-2 py-0.5 rounded-full">
              {currentTask.priority} priority • {currentTask.estimatedMinutes}m est
            </span>
          )}
        </div>

        <select
          value={selectedTaskId}
          onChange={(e) => handleSelectTask(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-2xl text-sm font-semibold text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
        >
          <option value="">General Study / Standalone Focus</option>
          {tasks
            .filter((t) => t.status !== "completed" && t.status !== "cancelled")
            .map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.estimatedMinutes} min)
              </option>
            ))}
        </select>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl mb-6 select-none">
        {TIMER_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id, mode.minutes)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeMode === mode.id
                ? "bg-white text-forest-900 shadow-sm"
                : "text-gray-500 hover:text-gray-900"
            }`}
          >
            {mode.name}
          </button>
        ))}
      </div>

      {/* Custom minutes selector if in custom mode */}
      {activeMode === "custom" && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500">Duration:</label>
          <input
            type="number"
            min={1}
            max={180}
            value={durationMinutes}
            onChange={(e) => {
              const val = Math.max(1, Math.min(180, Number(e.target.value)));
              setDurationMinutes(val);
              setSecondsRemaining(val * 60);
            }}
            className="w-20 px-3 py-1.5 text-center text-sm font-bold bg-white border border-gray-200 rounded-xl outline-none focus:border-forest-600"
          />
          <span className="text-xs font-semibold text-gray-500">minutes</span>
        </div>
      )}

      {/* Circular Timer Visual */}
      <div className="relative w-80 h-80 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="text-gray-100"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="text-forest-700 transition-all duration-500 ease-linear"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none px-6">
          <span className="text-6xl font-black text-gray-900 tracking-tight font-mono">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-xs font-semibold text-forest-700 uppercase tracking-widest mt-2 truncate max-w-[200px]">
            {isRunning
              ? currentTask
                ? currentTask.title
                : "Deep Focus In Progress"
              : secondsRemaining === 0
              ? "Session Complete!"
              : currentTask
              ? `Ready: ${currentTask.title}`
              : "Ready To Focus"}
          </span>
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-4 mt-6">
        <button
          type="button"
          onClick={resetTimer}
          className="p-3.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-600 transition-colors"
          title="Reset timer"
          aria-label="Reset timer"
        >
          <RotateCcw className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={toggleTimer}
          className={`flex items-center gap-2.5 px-8 py-4 rounded-2xl text-base font-extrabold text-white shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5 ${
            isRunning
              ? "bg-amber-600 hover:bg-amber-700"
              : "bg-forest-700 hover:bg-forest-800"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-5 h-5" /> Pause
            </>
          ) : (
            <>
              <Play className="w-5 h-5 fill-current" /> Start Focus
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3.5 rounded-2xl transition-colors ${
            soundEnabled
              ? "bg-forest-50 text-forest-800 hover:bg-forest-100"
              : "bg-gray-100 text-gray-400 hover:bg-gray-200"
          }`}
          title={soundEnabled ? "Sound enabled" : "Sound muted"}
          aria-label="Toggle chime sound"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Post-Session Prompt: Did you finish this task? */}
      {showTaskCompletionPrompt && currentTask && (
        <div className="w-full max-w-md bg-gradient-to-br from-forest-50 to-emerald-50 border-2 border-forest-600 rounded-3xl p-6 mt-8 shadow-elevated animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-forest-900 font-black text-sm uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-forest-700" />
            Focus Session Complete ({durationMinutes}m)
          </div>
          <p className="text-sm font-bold text-gray-900 mt-1">
            Did you finish &ldquo;{currentTask.title}&rdquo;?
          </p>
          <p className="text-xs text-forest-700 mt-0.5">
            Your focus duration has been added to the task&apos;s tracked time.
          </p>

          <div className="grid grid-cols-3 gap-2.5 mt-4">
            <button
              type="button"
              onClick={() => handleTaskCompletionAnswer(true)}
              className="px-3 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition-all text-center"
            >
              Yes, Done! 🎉
            </button>
            <button
              type="button"
              onClick={() => handleTaskCompletionAnswer(false)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs transition-all text-center"
            >
              Partially
            </button>
            <button
              type="button"
              onClick={() => handleTaskCompletionAnswer(false)}
              className="px-3 py-2 rounded-xl bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs transition-all text-center"
            >
              No, More Work
            </button>
          </div>
        </div>
      )}

      {taskMarkedComplete && (
        <div className="w-full max-w-md p-3.5 mt-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs font-bold text-emerald-900 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700" />
          Task successfully marked as completed! Great job.
        </div>
      )}

      {/* Habit Linkage & Notes */}
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl p-5 mt-8 shadow-xs space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Associate with Habit (Optional)
          </label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
          >
            <option value="">General Study / Focus Task</option>
            {habits.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Session Goal / Notes
          </label>
          <input
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="e.g. Solve physics problem set, read chapter 4..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
          />
        </div>

        {sessionSaved && !showTaskCompletionPrompt && (
          <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl text-xs font-bold text-forest-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-700" />
            Focus session successfully recorded in your history!
          </div>
        )}
      </div>
    </div>
  );
}
