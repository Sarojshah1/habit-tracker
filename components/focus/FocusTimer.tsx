"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Check,
  Volume2,
  VolumeX,
  ListTodo,
  CheckCircle2,
  PictureInPicture2,
  ExternalLink,
  GraduationCap,
  Sparkles,
  Headphones,
  Waves,
  Wind,
  CloudRain,
  Sliders,
  Award,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import { PipTimerManager } from "@/lib/focus/pipTimer";
import {
  AmbientSoundManager,
  AmbientSoundType,
  AMBIENT_SOUND_OPTIONS,
} from "@/lib/focus/ambientSound";
import { MockExamModal } from "@/components/exams/MockExamModal";

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
  { id: "short", name: "Short", minutes: 10 },
  { id: "long", name: "Long Focus", minutes: 50 },
  { id: "exam", name: "Exam (60m)", minutes: 60 },
  { id: "mock", name: "Mock Test (120m)", minutes: 120 },
  { id: "custom", name: "Custom", minutes: 30 },
];

const STORAGE_KEY = "habittrack_focus_timer_v2";

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

  // Floating Mini Window (Picture-in-Picture)
  const [autoPipOnStart, setAutoPipOnStart] = useState(true);
  const [isPipOpen, setIsPipOpen] = useState(false);
  const pipManagerRef = useRef<PipTimerManager | null>(null);

  // Ambient Focus Sound State
  const [ambientSound, setAmbientSound] = useState<AmbientSoundType>("none");
  const [ambientVolume, setAmbientVolume] = useState(0.4);
  const ambientManagerRef = useRef<AmbientSoundManager | null>(null);

  // Post session states
  const [sessionSaved, setSessionSaved] = useState(false);
  const [lastCompletedSession, setLastCompletedSession] = useState<any>(null);
  const [showTaskCompletionPrompt, setShowTaskCompletionPrompt] = useState(false);
  const [showMockExamPrompt, setShowMockExamPrompt] = useState(false);
  const [isMockExamModalOpen, setIsMockExamModalOpen] = useState(false);
  const [taskMarkedComplete, setTaskMarkedComplete] = useState(false);

  // Accurate timing refs (immune to tab throttling)
  const targetEndTimeRef = useRef<number | null>(null);
  const startTimeRef = useRef<Date | null>(null);
  const workerRef = useRef<Worker | null>(null);
  const isRunningRef = useRef(isRunning);
  isRunningRef.current = isRunning;
  const secondsRemainingRef = useRef(secondsRemaining);
  secondsRemainingRef.current = secondsRemaining;
  const currentTaskTitleRef = useRef("");

  // Initialize PiP and Ambient Sound Managers
  useEffect(() => {
    pipManagerRef.current = new PipTimerManager();
    ambientManagerRef.current = new AmbientSoundManager();

    return () => {
      pipManagerRef.current?.close();
      ambientManagerRef.current?.stop();
    };
  }, []);

  // Update current task title ref
  const currentTask = tasks.find((t) => t._id === selectedTaskId);
  currentTaskTitleRef.current = currentTask?.title || sessionNotes || "Deep Focus";

  const handleTickRef = useRef<() => void>(() => {});

  // Web Worker Initialization (runs unthrottled in background tabs)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const workerBlob = new Blob(
        [
          `
          let intervalId = null;
          self.onmessage = function(e) {
            if (e.data === 'START') {
              if (intervalId) clearInterval(intervalId);
              intervalId = setInterval(function() {
                self.postMessage('TICK');
              }, 1000);
            } else if (e.data === 'STOP') {
              if (intervalId) clearInterval(intervalId);
              intervalId = null;
            }
          };
        `,
        ],
        { type: "application/javascript" }
      );

      const worker = new Worker(URL.createObjectURL(workerBlob));
      workerRef.current = worker;

      worker.onmessage = (e) => {
        if (e.data === "TICK") {
          handleTickRef.current();
        }
      };

      return () => {
        worker.postMessage("STOP");
        worker.terminate();
        workerRef.current = null;
      };
    } catch (err) {
      console.warn("Worker creation failed, falling back to interval:", err);
    }
  }, []);

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
  const playChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (ctx.state === "suspended") {
        ctx.resume();
      }

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
  }, [soundEnabled]);

  // Session completion API call
  const handleCompleteSession = useCallback(async () => {
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
        if (activeMode === "exam" || activeMode === "mock" || sessionNotes.toLowerCase().includes("exam") || sessionNotes.toLowerCase().includes("mock")) {
          setShowMockExamPrompt(true);
        }
        if (onSessionComplete) onSessionComplete(data.session);
      }
    } catch (err) {
      console.error("Failed to save focus session:", err);
    }
  }, [activeMode, durationMinutes, onSessionComplete, selectedHabitId, selectedTaskId, sessionNotes, tasks]);

  const chimeRef = useRef(playChime);
  chimeRef.current = playChime;
  const completeRef = useRef(handleCompleteSession);
  completeRef.current = handleCompleteSession;

  // Trigger completion sequence (sound, notification, PiP update, database save)
  const triggerTimerExpired = useCallback(() => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    workerRef.current?.postMessage("STOP");

    // Stop ambient noise
    ambientManagerRef.current?.stop();

    // Clear local storage session
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }

    // Play chime
    chimeRef.current();

    // Desktop Notification if authorized
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted"
    ) {
      try {
        new Notification("Focus Session Complete! 🎉", {
          body: currentTaskTitleRef.current
            ? `Finished: ${currentTaskTitleRef.current}`
            : "Great job completing your focus session!",
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.warn("Notification trigger failed:", err);
      }
    }

    // Update document title
    if (typeof document !== "undefined") {
      document.title = "🎉 (Done!) Focus Complete! | HabitTrack";
    }

    // Update floating PiP window
    pipManagerRef.current?.update({
      timeFormatted: "00:00",
      taskTitle: currentTaskTitleRef.current,
      progressPercent: 100,
      isRunning: false,
      isComplete: true,
      durationMinutes,
    });

    // Save to database
    completeRef.current();
  }, [durationMinutes]);

  // Synchronous tick based on real wall-clock delta (immune to tab throttling)
  const handleTick = useCallback(() => {
    if (!isRunningRef.current || !targetEndTimeRef.current) return;

    const now = Date.now();
    const diffSeconds = Math.ceil((targetEndTimeRef.current - now) / 1000);

    if (diffSeconds <= 0) {
      setSecondsRemaining(0);
      triggerTimerExpired();
    } else {
      setSecondsRemaining(diffSeconds);

      // Update Floating Mini Window
      const totalSec = durationMinutes * 60;
      const progress = Math.max(0, Math.min(100, ((totalSec - diffSeconds) / totalSec) * 100));
      pipManagerRef.current?.update({
        timeFormatted: formatTime(diffSeconds),
        taskTitle: currentTaskTitleRef.current,
        progressPercent: progress,
        isRunning: true,
        isComplete: false,
        durationMinutes,
      });

      // Update Browser Tab Title
      if (typeof document !== "undefined") {
        document.title = `(${formatTime(diffSeconds)}) ${currentTaskTitleRef.current || "Focus"} | HabitTrack`;
      }
    }
  }, [durationMinutes, triggerTimerExpired]);
  handleTickRef.current = handleTick;

  // Re-synchronize instantly on tab focus and visibilitychange
  useEffect(() => {
    const handleVisibilityOrFocus = () => {
      if (isRunningRef.current && targetEndTimeRef.current) {
        const now = Date.now();
        const diffSeconds = Math.ceil((targetEndTimeRef.current - now) / 1000);
        if (diffSeconds <= 0) {
          setSecondsRemaining(0);
          triggerTimerExpired();
        } else {
          setSecondsRemaining(diffSeconds);
        }
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityOrFocus);
    window.addEventListener("focus", handleVisibilityOrFocus);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityOrFocus);
      window.removeEventListener("focus", handleVisibilityOrFocus);
    };
  }, [triggerTimerExpired]);

  // Fallback setInterval in case Web Worker is unavailable in environment
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        handleTick();
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, handleTick]);

  // Restore session from localStorage on mount (e.g. if tab was accidentally refreshed/reopened)
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (!saved) return;

      const parsed = JSON.parse(saved);
      if (parsed && parsed.targetEndTime && parsed.isRunning) {
        const now = Date.now();
        const remaining = Math.ceil((parsed.targetEndTime - now) / 1000);

        if (remaining > 0) {
          targetEndTimeRef.current = parsed.targetEndTime;
          startTimeRef.current = parsed.startedAt ? new Date(parsed.startedAt) : new Date();
          setDurationMinutes(parsed.durationMinutes || 25);
          setActiveMode(parsed.activeMode || "pomodoro");
          setSelectedTaskId(parsed.selectedTaskId || "");
          setSelectedHabitId(parsed.selectedHabitId || "");
          setSessionNotes(parsed.sessionNotes || "");
          setSecondsRemaining(remaining);
          setIsRunning(true);
          workerRef.current?.postMessage("START");
        } else {
          localStorage.removeItem(STORAGE_KEY);
        }
      }
    } catch (e) {
      console.warn("Failed to restore timer state:", e);
    }
  }, []);

  // Sync to LocalStorage when running state changes
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (isRunning && targetEndTimeRef.current) {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            targetEndTime: targetEndTimeRef.current,
            durationMinutes,
            activeMode,
            selectedTaskId,
            selectedHabitId,
            sessionNotes,
            startedAt: startTimeRef.current?.toISOString(),
            isRunning: true,
          })
        );
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {}
  }, [isRunning, durationMinutes, activeMode, selectedTaskId, selectedHabitId, sessionNotes]);

  // Document Title reset when paused or stopped
  useEffect(() => {
    if (!isRunning && secondsRemaining > 0) {
      document.title = "Focus Mode | HabitTrack";
    }
  }, [isRunning, secondsRemaining]);

  // Ambient sound selector handler
  const handleAmbientSoundChange = (type: AmbientSoundType) => {
    setAmbientSound(type);
    if (type === "none") {
      ambientManagerRef.current?.stop();
    } else if (isRunning) {
      ambientManagerRef.current?.play(type);
    }
  };

  const handleAmbientVolumeChange = (newVol: number) => {
    setAmbientVolume(newVol);
    ambientManagerRef.current?.setVolume(newVol);
  };

  // Open / Toggle Picture-in-Picture Mini Window
  const handleOpenPip = async () => {
    if (!pipManagerRef.current) return;

    const totalSec = durationMinutes * 60;
    const progress = Math.max(0, Math.min(100, ((totalSec - secondsRemaining) / totalSec) * 100));

    const opened = await pipManagerRef.current.open(
      {
        timeFormatted: formatTime(secondsRemaining),
        taskTitle: currentTaskTitleRef.current,
        progressPercent: progress,
        isRunning,
        isComplete: secondsRemaining === 0,
        durationMinutes,
      },
      {
        onTogglePlay: () => toggleTimer(),
        onReset: () => resetTimer(),
        onClose: () => setIsPipOpen(false),
      }
    );

    if (opened) {
      setIsPipOpen(true);
    }
  };

  const handleModeChange = (modeId: string, minutes: number) => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    workerRef.current?.postMessage("STOP");
    ambientManagerRef.current?.stop();
    setActiveMode(modeId);
    setDurationMinutes(minutes);
    setSecondsRemaining(minutes * 60);
    setSessionSaved(false);
    setShowTaskCompletionPrompt(false);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      // Starting
      if (!startTimeRef.current) {
        startTimeRef.current = new Date();
      }
      targetEndTimeRef.current = Date.now() + secondsRemaining * 1000;
      setIsRunning(true);
      workerRef.current?.postMessage("START");

      // Play ambient sound if selected
      if (ambientSound !== "none") {
        ambientManagerRef.current?.play(ambientSound);
      }

      // Request notification permission if not yet decided
      if (
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "default"
      ) {
        Notification.requestPermission().catch(() => {});
      }

      // Auto-open floating mini window if enabled and not already open
      if (autoPipOnStart && pipManagerRef.current && !pipManagerRef.current.getIsOpen()) {
        setTimeout(() => {
          handleOpenPip();
        }, 100);
      }
    } else {
      // Pausing
      if (targetEndTimeRef.current) {
        const remaining = Math.max(0, Math.ceil((targetEndTimeRef.current - Date.now()) / 1000));
        setSecondsRemaining(remaining);
      }
      targetEndTimeRef.current = null;
      setIsRunning(false);
      workerRef.current?.postMessage("STOP");

      // Pause ambient sound
      ambientManagerRef.current?.stop();

      // Update PiP window if open
      pipManagerRef.current?.update({
        timeFormatted: formatTime(secondsRemaining),
        taskTitle: currentTaskTitleRef.current,
        progressPercent: Math.max(
          0,
          Math.min(
            100,
            ((durationMinutes * 60 - secondsRemaining) / (durationMinutes * 60)) * 100
          )
        ),
        isRunning: false,
        isComplete: false,
        durationMinutes,
      });
    }
  };

  const resetTimer = () => {
    setIsRunning(false);
    targetEndTimeRef.current = null;
    workerRef.current?.postMessage("STOP");
    ambientManagerRef.current?.stop();
    setSecondsRemaining(durationMinutes * 60);
    startTimeRef.current = null;
    setSessionSaved(false);
    setShowTaskCompletionPrompt(false);

    if (typeof document !== "undefined") {
      document.title = "Focus Mode | HabitTrack";
    }

    pipManagerRef.current?.update({
      timeFormatted: formatTime(durationMinutes * 60),
      taskTitle: currentTaskTitleRef.current,
      progressPercent: 0,
      isRunning: false,
      isComplete: false,
      durationMinutes,
    });
  };

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

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      {/* What are you working on? Task Selector Banner */}
      <div className="w-full max-w-lg mb-6 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-xs transition-colors duration-200">
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
            <ListTodo className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            What are you working on?
          </label>
          {currentTask && (
            <span className="text-[11px] font-bold text-forest-800 dark:text-forest-300 bg-forest-50 dark:bg-forest-950/60 px-2 py-0.5 rounded-full">
              {currentTask.priority} priority • {currentTask.estimatedMinutes}m est
            </span>
          )}
        </div>

        <select
          value={selectedTaskId}
          onChange={(e) => handleSelectTask(e.target.value)}
          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-colors"
        >
          <option value="">General Study / Standalone Focus / Mock Exam</option>
          {tasks
            .filter((t) => t.status !== "completed" && t.status !== "cancelled")
            .map((t) => (
              <option key={t._id} value={t._id}>
                {t.title} ({t.estimatedMinutes} min)
              </option>
            ))}
        </select>
      </div>

      {/* Mode Selector Tabs (Including Exam & Mock Test presets) */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 p-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-2xl mb-6 select-none max-w-lg transition-colors">
        {TIMER_MODES.map((mode) => (
          <button
            key={mode.id}
            type="button"
            onClick={() => handleModeChange(mode.id, mode.minutes)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeMode === mode.id
                ? "bg-white dark:bg-gray-900 text-forest-900 dark:text-forest-200 shadow-sm"
                : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
            }`}
          >
            {(mode.id === "exam" || mode.id === "mock") && (
              <GraduationCap className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400" />
            )}
            {mode.name}
          </button>
        ))}
      </div>

      {/* Custom minutes selector if in custom mode */}
      {activeMode === "custom" && (
        <div className="mb-4 flex items-center gap-3">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Duration:</label>
          <input
            type="number"
            min={1}
            max={240}
            value={durationMinutes}
            onChange={(e) => {
              const val = Math.max(1, Math.min(240, Number(e.target.value)));
              setDurationMinutes(val);
              setSecondsRemaining(val * 60);
            }}
            className="w-20 px-3 py-1.5 text-center text-sm font-bold bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100 rounded-xl outline-none focus:border-forest-600"
          />
          <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">minutes</span>
        </div>
      )}

      {/* Circular Timer Visual */}
      <div className="relative w-80 h-80 flex items-center justify-center my-2">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 300 300">
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="text-gray-100 dark:text-gray-800"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="text-forest-700 dark:text-forest-500 transition-all duration-500 ease-linear"
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none px-6">
          <span className="text-6xl font-black text-gray-900 dark:text-gray-100 tracking-tight font-mono">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-xs font-semibold text-forest-700 dark:text-forest-400 uppercase tracking-widest mt-2 truncate max-w-[200px]">
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

          {isRunning && (
            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full mt-2 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              Live Sync Across Tabs
            </span>
          )}
        </div>
      </div>

      {/* Timer Controls */}
      <div className="flex items-center gap-3.5 mt-6">
        <button
          type="button"
          onClick={resetTimer}
          className="p-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 transition-colors"
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

        {/* Floating Mini Window (Teams-Style) Button */}
        <button
          type="button"
          onClick={handleOpenPip}
          className={`p-3.5 rounded-2xl transition-all ${
            isPipOpen
              ? "bg-forest-700 text-white shadow-xs"
              : "bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/60"
          }`}
          title="Open Floating Mini Timer (Teams style) - stays on top of other tabs & apps"
          aria-label="Open Floating Mini Timer"
        >
          <PictureInPicture2 className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => setSoundEnabled(!soundEnabled)}
          className={`p-3.5 rounded-2xl transition-colors ${
            soundEnabled
              ? "bg-forest-50 dark:bg-forest-950/60 text-forest-800 dark:text-forest-300 hover:bg-forest-100 dark:hover:bg-forest-900/60"
              : "bg-gray-100 dark:bg-gray-800 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
          title={soundEnabled ? "Sound enabled" : "Sound muted"}
          aria-label="Toggle chime sound"
        >
          {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
        </button>
      </div>

      {/* Floating Mini Window Options */}
      <div className="mt-5 flex flex-col sm:flex-row items-center gap-3 text-xs text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 px-4 py-2.5 rounded-2xl transition-colors">
        <label className="flex items-center gap-2 cursor-pointer font-medium select-none">
          <input
            type="checkbox"
            checked={autoPipOnStart}
            onChange={(e) => setAutoPipOnStart(e.target.checked)}
            className="rounded border-gray-300 dark:border-gray-700 text-forest-600 focus:ring-forest-500 w-4 h-4 cursor-pointer"
          />
          <span>Auto-open floating mini-window on start (like Teams / Meet call)</span>
        </label>
        <button
          type="button"
          onClick={handleOpenPip}
          className="text-forest-700 dark:text-forest-400 font-bold hover:underline inline-flex items-center gap-1"
        >
          <span>Pop out now</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Ambient Focus Sound Player Card */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 mt-6 shadow-xs transition-colors">
        <div className="flex items-center justify-between mb-3">
          <label className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider flex items-center gap-1.5">
            <Headphones className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            Ambient Focus Audio (Web Audio)
          </label>
          {ambientSound !== "none" && isRunning && (
            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Audio Active
            </span>
          )}
        </div>

        {/* Sound Selection Pills */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5 mb-3">
          {AMBIENT_SOUND_OPTIONS.map((opt) => {
            const isSelected = ambientSound === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => handleAmbientSoundChange(opt.id)}
                className={`px-2 py-2 rounded-xl text-[11px] font-bold transition-all text-center truncate ${
                  isSelected
                    ? "bg-forest-700 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
                title={opt.description}
              >
                {opt.name}
              </button>
            );
          })}
        </div>

        {/* Ambient Volume Slider if sound is enabled */}
        {ambientSound !== "none" && (
          <div className="flex items-center gap-3 pt-2 border-t border-gray-100 dark:border-gray-800">
            <Sliders className="w-3.5 h-3.5 text-gray-400" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={ambientVolume}
              onChange={(e) => handleAmbientVolumeChange(Number(e.target.value))}
              className="w-full accent-forest-600 dark:accent-forest-400 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-lg cursor-pointer"
            />
            <span className="text-[11px] font-mono text-gray-400 min-w-[32px] text-right">
              {Math.round(ambientVolume * 100)}%
            </span>
          </div>
        )}
      </div>

      {/* Post-Session Prompt: Did you finish this task? */}
      {showTaskCompletionPrompt && currentTask && (
        <div className="w-full max-w-md bg-gradient-to-br from-forest-50 to-emerald-50 dark:from-gray-900 dark:to-gray-950 border-2 border-forest-600 dark:border-forest-500 rounded-3xl p-6 mt-8 shadow-elevated animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center gap-2 text-forest-900 dark:text-forest-200 font-black text-sm uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            Focus Session Complete ({durationMinutes}m)
          </div>
          <p className="text-sm font-bold text-gray-900 dark:text-gray-100 mt-1">
            Did you finish &ldquo;{currentTask.title}&rdquo;?
          </p>
          <p className="text-xs text-forest-700 dark:text-forest-400 mt-0.5">
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
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all text-center"
            >
              Partially
            </button>
            <button
              type="button"
              onClick={() => handleTaskCompletionAnswer(false)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 font-bold text-xs transition-all text-center"
            >
              No, More Work
            </button>
          </div>
        </div>
      )}

      {showMockExamPrompt && (
        <div className="w-full max-w-md p-4 mt-4 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-2xl space-y-3">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-amber-100 dark:bg-amber-900/60 text-amber-700 dark:text-amber-300">
              <Award className="w-4 h-4" />
            </div>
            <div>
              <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                Exam Session Finished!
              </p>
              <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Would you like to log your score for this mock test?
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setShowMockExamPrompt(false);
                setIsMockExamModalOpen(true);
              }}
              className="flex-1 py-2 px-3 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition-colors text-center"
            >
              Log Score (e.g. 84/100)
            </button>
            <button
              type="button"
              onClick={() => setShowMockExamPrompt(false)}
              className="py-2 px-3 rounded-xl bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-medium text-xs transition-colors"
            >
              Later
            </button>
          </div>
        </div>
      )}

      {/* Mock Exam Score Modal */}
      <MockExamModal
        isOpen={isMockExamModalOpen}
        onClose={() => setIsMockExamModalOpen(false)}
        initialTitle={sessionNotes || "Mock Exam"}
        defaultDurationMinutes={durationMinutes}
        focusSessionId={lastCompletedSession?._id}
      />

      {taskMarkedComplete && (
        <div className="w-full max-w-md p-3.5 mt-4 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl text-xs font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          Task successfully marked as completed! Great job.
        </div>
      )}

      {/* Habit Linkage & Notes */}
      <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-3xl p-5 mt-6 shadow-xs space-y-4 transition-colors">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Associate with Habit (Optional)
          </label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:border-forest-600 outline-none transition-colors"
          >
            <option value="">General Study / Exam / Focus Task</option>
            {habits.map((h) => (
              <option key={h._id} value={h._id}>
                {h.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Session Goal / Notes / Mock Exam Name
          </label>
          <input
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="e.g. Full Chemistry Mock Test #2, Physics Problem Set..."
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-900 focus:border-forest-600 outline-none transition-colors"
          />
        </div>

        {sessionSaved && !showTaskCompletionPrompt && (
          <div className="p-3 bg-forest-50 dark:bg-forest-950/60 border border-forest-200 dark:border-forest-800 rounded-xl text-xs font-bold text-forest-800 dark:text-forest-300 flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-700 dark:text-forest-400" />
            Focus session successfully recorded in your history!
          </div>
        )}
      </div>
    </div>
  );
}
