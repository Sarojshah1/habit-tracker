"use client";

import React, { useState, useEffect, useRef } from "react";
import { Play, Pause, RotateCcw, Check, Sparkles, Volume2, VolumeX, Flame } from "lucide-react";
import { formatTime } from "@/lib/utils";

interface HabitOption {
  _id: string;
  name: string;
  icon: string;
  color: string;
}

interface FocusTimerProps {
  habits?: HabitOption[];
  onSessionComplete?: (session: any) => void;
}

const TIMER_MODES = [
  { id: "pomodoro", name: "Pomodoro", minutes: 25 },
  { id: "short", name: "Short Focus", minutes: 10 },
  { id: "long", name: "Long Focus", minutes: 50 },
  { id: "custom", name: "Custom", minutes: 30 },
];

export function FocusTimer({ habits = [], onSessionComplete }: FocusTimerProps) {
  const [activeMode, setActiveMode] = useState("pomodoro");
  const [durationMinutes, setDurationMinutes] = useState(25);
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedHabitId, setSelectedHabitId] = useState("");
  const [sessionNotes, setSessionNotes] = useState("");
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [sessionSaved, setSessionSaved] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const startTimeRef = useRef<Date | null>(null);

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
  };

  const handleCompleteSession = React.useCallback(async () => {
    try {
      const res = await fetch("/api/focus/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          duration: durationMinutes,
          status: "completed",
          habitId: selectedHabitId || undefined,
          notes: sessionNotes || "Productive focus session",
          startedAt: startTimeRef.current?.toISOString() || new Date(Date.now() - durationMinutes * 60 * 1000).toISOString(),
          completedAt: new Date().toISOString(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        setSessionSaved(true);
        if (onSessionComplete) onSessionComplete(data.session);
      }
    } catch (err) {
      console.error("Failed to save focus session:", err);
    }
  }, [durationMinutes, onSessionComplete, selectedHabitId, sessionNotes]);

  // Keep callbacks fresh in refs
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

  const totalSeconds = durationMinutes * 60;
  const progressPercent = Math.max(0, Math.min(100, ((totalSeconds - secondsRemaining) / totalSeconds) * 100));

  // Circular progress calculation
  const radius = 130;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercent / 100) * circumference;

  return (
    <div className="max-w-2xl mx-auto flex flex-col items-center">
      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-gray-100/80 rounded-2xl mb-8 select-none">
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
        <div className="mb-6 flex items-center gap-3">
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
          {/* Background Track */}
          <circle
            cx="150"
            cy="150"
            r={radius}
            className="text-gray-100"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
          />
          {/* Progress Ring */}
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

        {/* Center Timer Display */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center select-none">
          <span className="text-6xl font-black text-gray-900 tracking-tight font-mono">
            {formatTime(secondsRemaining)}
          </span>
          <span className="text-xs font-semibold text-forest-700 uppercase tracking-widest mt-2">
            {isRunning ? "Deep Focus In Progress" : secondsRemaining === 0 ? "Session Complete!" : "Ready To Focus"}
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

      {/* Habit Linkage & Notes */}
      <div className="w-full max-w-md bg-white border border-gray-100 rounded-2xl p-5 mt-10 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Associate with Habit (Optional)
          </label>
          <select
            value={selectedHabitId}
            onChange={(e) => setSelectedHabitId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
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
            Session Goal / Note
          </label>
          <input
            type="text"
            value={sessionNotes}
            onChange={(e) => setSessionNotes(e.target.value)}
            placeholder="e.g. Solve physics problem set, read chapter 4..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
          />
        </div>

        {sessionSaved && (
          <div className="p-3 bg-forest-50 border border-forest-200 rounded-xl text-xs font-bold text-forest-800 flex items-center gap-2">
            <Check className="w-4 h-4 text-forest-700" />
            Focus session successfully recorded in your history!
          </div>
        )}
      </div>
    </div>
  );
}
