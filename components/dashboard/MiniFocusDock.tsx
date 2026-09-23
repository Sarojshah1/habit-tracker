"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Waves,
  Wind,
  CloudRain,
  Headphones,
  CheckCircle2,
  Sparkles,
  Maximize2,
} from "lucide-react";
import { formatTime } from "@/lib/utils";
import {
  AmbientSoundManager,
  AmbientSoundType,
} from "@/lib/focus/ambientSound";

interface MiniFocusDockProps {
  initialTaskTitle?: string;
  onSessionComplete?: () => void;
}

export function MiniFocusDock({ initialTaskTitle, onSessionComplete }: MiniFocusDockProps) {
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [activeSound, setActiveSound] = useState<AmbientSoundType>("none");
  const [volume, setVolume] = useState(0.4);
  const [sessionCompleted, setSessionCompleted] = useState(false);

  const ambientRef = useRef<AmbientSoundManager | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    ambientRef.current = new AmbientSoundManager();
    return () => {
      ambientRef.current?.stop();
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const toggleSound = (sound: AmbientSoundType) => {
    if (!ambientRef.current) return;
    if (activeSound === sound) {
      ambientRef.current.stop();
      setActiveSound("none");
    } else {
      ambientRef.current.setVolume(volume);
      ambientRef.current.play(sound);
      setActiveSound(sound);
    }
  };

  const handleToggleTimer = () => {
    if (isRunning) {
      if (timerRef.current) clearInterval(timerRef.current);
      ambientRef.current?.stop();
      setIsRunning(false);
    } else {
      setIsRunning(true);
      setSessionCompleted(false);
      if (activeSound !== "none") {
        ambientRef.current?.play(activeSound);
      }

      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setIsRunning(false);
            ambientRef.current?.stop();
            setSessionCompleted(true);
            // Save focus session
            fetch("/api/focus/sessions", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                duration: 25,
                status: "completed",
                notes: initialTaskTitle || "Dashboard Mini Focus Session",
              }),
            })
              .then(() => {
                if (onSessionComplete) onSessionComplete();
              })
              .catch(console.error);
            return 25 * 60;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleReset = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    ambientRef.current?.stop();
    setIsRunning(false);
    setSecondsRemaining(25 * 60);
  };

  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

  return (
    <div className="p-5 rounded-3xl bg-gradient-to-br from-forest-900 via-forest-950 to-gray-950 text-white shadow-md border border-forest-800/50 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${isRunning ? "bg-emerald-400 animate-ping" : "bg-gray-400"}`} />
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-400">
              Live Focus Dock
            </span>
          </div>

          <span className="text-[10px] font-bold text-gray-400">
            {isRunning ? "25m Deep Work Running" : "25m Pomodoro"}
          </span>
        </div>

        {/* Big Time Display */}
        <div className="py-4 text-center">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight font-mono text-white">
            {timeFormatted}
          </h2>
          <p className="text-xs text-emerald-200/70 font-semibold truncate max-w-xs mx-auto mt-1">
            {initialTaskTitle || "Focus on Priority"}
          </p>
        </div>

        {/* Ambient Sound Quick Buttons */}
        <div className="flex items-center justify-center gap-2 py-2">
          <button
            type="button"
            onClick={() => toggleSound("brown")}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
              activeSound === "brown"
                ? "bg-amber-500 text-gray-950 font-bold shadow-xs scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Brown Noise (Deep focus)"
          >
            <Waves className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Brown</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSound("rain")}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
              activeSound === "rain"
                ? "bg-sky-400 text-gray-950 font-bold shadow-xs scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="Rain Audio"
          >
            <CloudRain className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">Rain</span>
          </button>

          <button
            type="button"
            onClick={() => toggleSound("binaural")}
            className={`p-2 rounded-xl text-xs flex items-center gap-1 transition-all ${
              activeSound === "binaural"
                ? "bg-purple-400 text-gray-950 font-bold shadow-xs scale-105"
                : "bg-white/10 text-gray-300 hover:bg-white/20"
            }`}
            title="40Hz Binaural Waves"
          >
            <Headphones className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">40Hz</span>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="pt-3 border-t border-white/10 flex items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleTimer}
          className={`flex-1 py-2.5 px-4 rounded-xl font-black text-xs shadow-sm flex items-center justify-center gap-2 transition-all ${
            isRunning
              ? "bg-amber-500 hover:bg-amber-400 text-gray-950"
              : "bg-emerald-500 hover:bg-emerald-400 text-gray-950"
          }`}
        >
          {isRunning ? (
            <>
              <Pause className="w-3.5 h-3.5 fill-current" /> Pause
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" /> Start 25m
            </>
          )}
        </button>

        <button
          type="button"
          onClick={handleReset}
          className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          title="Reset 25m"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
