"use client";

import React, { useRef, useState } from "react";
import { Flame, Award, CheckCircle2, Download, Copy, Check, Share2, Sparkles } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { triggerConfetti } from "@/components/ui/Confetti";
import { playStreakMilestoneSound } from "@/lib/utils/sound";

interface StreakCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  currentStreak: number;
  longestStreak: number;
  totalCompletions: number;
  consistencyMatrix?: Array<{ count: number; level: number; date: string }>;
}

export function StreakCardModal({
  isOpen,
  onClose,
  userName = "Student",
  currentStreak = 0,
  longestStreak = 0,
  totalCompletions = 0,
  consistencyMatrix = [],
}: StreakCardModalProps) {
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      triggerConfetti();
      playStreakMilestoneSound();
    }
  }, [isOpen]);

  const handleCopyText = async () => {
    const text = `🔥 ${userName}'s HabitTrack Streak: ${currentStreak} Days Active!\n🏆 Longest Streak: ${longestStreak} days\n✅ Total Completions: ${totalCompletions}\nKeep building discipline one day at a time! 🚀`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleDownloadCard = () => {
    if (!cardRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 360;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Draw card background gradient
    const grad = ctx.createLinearGradient(0, 0, 600, 360);
    grad.addColorStop(0, "#064E3B"); // deep forest
    grad.addColorStop(0.5, "#065F46");
    grad.addColorStop(1, "#022C22");
    ctx.fillStyle = grad;
    ctx.roundRect ? ctx.roundRect(0, 0, 600, 360, 24) : ctx.fillRect(0, 0, 600, 360);
    ctx.fill();

    // Border
    ctx.strokeStyle = "rgba(52, 211, 153, 0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();

    // App Title
    ctx.fillStyle = "#A7F3D0";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("HABITTRACK DISCIPLINE MATRIX", 36, 48);

    // User Name
    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 26px sans-serif";
    ctx.fillText(userName, 36, 86);

    // Streak flame & count
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 56px sans-serif";
    ctx.fillText(`${currentStreak}`, 36, 175);

    ctx.fillStyle = "#FDE68A";
    ctx.font = "bold 22px sans-serif";
    ctx.fillText("Days Streak Active 🔥", 115, 170);

    // Metrics Row
    ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
    ctx.fillRect(36, 215, 528, 70);

    ctx.fillStyle = "#E5E7EB";
    ctx.font = "14px sans-serif";
    ctx.fillText("Longest Record", 56, 242);
    ctx.fillText("Total Completions", 230, 242);
    ctx.fillText("Momentum Level", 420, 242);

    ctx.fillStyle = "#FFFFFF";
    ctx.font = "bold 20px sans-serif";
    ctx.fillText(`${longestStreak} Days`, 56, 270);
    ctx.fillText(`${totalCompletions}`, 230, 270);
    ctx.fillStyle = "#34D399";
    ctx.fillText("Mastery ⚡", 420, 270);

    // Footer
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "12px sans-serif";
    ctx.fillText("habittrack.app • Built for disciplined students", 36, 325);

    const a = document.createElement("a");
    a.download = `${userName.toLowerCase().replace(/\s+/g, "-")}-streak-${currentStreak}d.png`;
    a.href = canvas.toDataURL("image/png");
    a.click();
  };

  if (!isOpen) return null;

  const recentMatrix = (consistencyMatrix || []).slice(-28);

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Share Your Momentum">
      <div className="space-y-6">
        {/* Visual Card Preview */}
        <div
          ref={cardRef}
          className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-br from-forest-800 via-forest-900 to-gray-950 text-white shadow-xl border border-forest-500/30"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Top Brand & Name */}
          <div className="flex items-center justify-between relative z-10 mb-4">
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400">
                HabitTrack Discipline
              </span>
              <h3 className="text-xl font-black text-white tracking-tight">{userName}</h3>
            </div>
            <span className="text-2xl">🌱</span>
          </div>

          {/* Main Streak Display */}
          <div className="flex items-baseline gap-3 my-4 relative z-10">
            <span className="text-5xl font-black text-amber-400 tracking-tight">
              {currentStreak}
            </span>
            <div>
              <p className="text-base font-bold text-amber-200 flex items-center gap-1.5">
                <Flame className="w-5 h-5 fill-current text-amber-400 animate-bounce" />
                Days Active Streak
              </p>
              <p className="text-xs text-forest-300 font-medium">Unbroken momentum</p>
            </div>
          </div>

          {/* Mini Discipline Heatmap Grid (Last 28 days) */}
          {recentMatrix.length > 0 && (
            <div className="my-4 pt-3 border-t border-forest-700/50">
              <p className="text-[10px] uppercase font-bold text-forest-300 tracking-wider mb-2">
                Last 4 Weeks Consistency
              </p>
              <div className="grid grid-cols-7 gap-1.5 max-w-xs">
                {recentMatrix.map((c, i) => (
                  <div
                    key={i}
                    className={`w-4 h-4 rounded-[4px] border ${
                      c.level === 0
                        ? "bg-forest-950/60 border-forest-800"
                        : c.level <= 2
                        ? "bg-emerald-500/70 border-emerald-400"
                        : "bg-emerald-400 border-emerald-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Metrics Pill Grid */}
          <div className="grid grid-cols-2 gap-3 mt-4 pt-3 border-t border-forest-700/50 relative z-10 text-xs">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-forest-800/80 text-emerald-300">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-forest-300 font-semibold">Best Record</p>
                <p className="text-sm font-bold text-white">{longestStreak} Days</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="p-2 rounded-xl bg-forest-800/80 text-emerald-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] text-forest-300 font-semibold">Total Completed</p>
                <p className="text-sm font-bold text-white">{totalCompletions} Habits</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleCopyText}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 font-bold text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copied to Clipboard!" : "Copy Streak Summary"}
          </button>

          <button
            type="button"
            onClick={handleDownloadCard}
            className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-sm transition-all hover:-translate-y-0.5"
          >
            <Download className="w-4 h-4" />
            Download Streak Card
          </button>
        </div>
      </div>
    </Modal>
  );
}
