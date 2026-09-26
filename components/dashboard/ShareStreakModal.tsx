"use client";

import React, { useState } from "react";
import { X, Flame, Share2, Copy, Check, Twitter, MessageCircle } from "lucide-react";

interface ShareStreakModalProps {
  isOpen: boolean;
  onClose: () => void;
  streakCount: number;
  userName: string;
}

export function ShareStreakModal({
  isOpen,
  onClose,
  streakCount,
  userName,
}: ShareStreakModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const siteUrl = "https://habit-tracker-seven-gold-53.vercel.app";
  const shareText = `🔥 I'm on a ${streakCount}-day study streak on HabitTrack! Building consistent study routines and crushing my academic goals. Join me for free:`;
  const fullShareMessage = `${shareText} ${siteUrl}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullShareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(false);
    }
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(siteUrl)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const shareToWhatsApp = () => {
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(fullShareMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-md w-full border border-gray-100 dark:border-gray-800 shadow-2xl p-6 sm:p-7 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-orange-400/20 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-40 h-40 bg-forest-600/20 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/60 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <Flame className="w-5 h-5 fill-current" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100">
              Share Your Streak
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual Achievement Card */}
        <div className="my-5 p-6 rounded-2xl bg-gradient-to-br from-forest-800 via-forest-900 to-gray-950 text-white relative shadow-lg text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-500/20 border border-orange-400/30 text-orange-300 text-xs font-bold mb-3">
            <Flame className="w-3.5 h-3.5 fill-current" />
            STREAK MILESTONE
          </div>
          <div className="text-5xl font-black tracking-tight text-white mb-1">
            {streakCount} <span className="text-2xl font-bold text-orange-400">DAYS</span>
          </div>
          <p className="text-xs text-forest-200 font-medium">
            {userName} is staying consistent on HabitTrack
          </p>
          <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between text-[11px] text-forest-300 font-semibold">
            <span>Free Student Habit Tracker</span>
            <span className="text-white">habittrack.vercel.app</span>
          </div>
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400 mb-4 font-medium text-center">
          Inspire your study group and classmates to stay consistent with you.
        </p>

        {/* Share Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <button
            onClick={shareToTwitter}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#1DA1F2]/10 hover:bg-[#1DA1F2]/20 text-[#1DA1F2] text-xs font-bold transition-colors"
          >
            <Twitter className="w-4 h-4 fill-current" />
            Twitter / X
          </button>
          <button
            onClick={shareToWhatsApp}
            className="flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] text-xs font-bold transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            WhatsApp
          </button>
        </div>

        <button
          onClick={handleCopy}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all hover:shadow"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-emerald-300" />
              <span>Copied share link to clipboard!</span>
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              <span>Copy Streak Link & Message</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
