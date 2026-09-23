"use client";

import React, { useState } from "react";
import { Brain, CheckCircle2, RotateCcw, ArrowRight, Sparkles } from "lucide-react";
import Link from "next/link";

interface FlashcardItem {
  _id: string;
  deck: string;
  front: string;
  back: string;
  intervalDays: number;
}

interface FlashcardMicroDrillProps {
  cards: FlashcardItem[];
  onReviewDone: () => void;
}

export function FlashcardMicroDrill({ cards, onReviewDone }: FlashcardMicroDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [grading, setGrading] = useState(false);

  if (!cards || cards.length === 0) {
    return (
      <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Flashcard Micro-Drill
            </span>
          </div>
          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
            All Caught Up
          </span>
        </div>

        <div className="py-6 text-center text-xs text-gray-400 dark:text-gray-500 space-y-2">
          <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
          <p className="font-bold text-gray-700 dark:text-gray-300">No cards due for review right now!</p>
          <p className="text-[11px]">All spaced repetition intervals are fresh.</p>
        </div>

        <div className="pt-3 border-t border-gray-100 dark:border-gray-800 text-center">
          <Link
            href="/flashcards"
            className="text-xs font-bold text-forest-700 dark:text-forest-400 hover:underline inline-flex items-center gap-1"
          >
            Open Flashcard Decks
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  const handleGrade = async (rating: number) => {
    if (!currentCard || grading) return;
    setGrading(true);
    try {
      await fetch(`/api/flashcards/${currentCard._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
      if (currentIndex + 1 >= cards.length) {
        onReviewDone();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGrading(false);
    }
  };

  return (
    <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span className="text-xs font-bold text-gray-900 dark:text-gray-100 uppercase tracking-wider">
              Quick Micro-Drill
            </span>
          </div>
          <span className="text-[10px] font-bold text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-full">
            Card {currentIndex + 1} of {cards.length}
          </span>
        </div>

        {/* Flip Card Box */}
        {isFinished ? (
          <div className="py-6 text-center space-y-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
            <p className="font-bold text-xs text-gray-900 dark:text-gray-100">Micro-drill complete!</p>
            <p className="text-[10px] text-gray-400">Great recall session.</p>
          </div>
        ) : (
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="my-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 min-h-[110px] flex flex-col justify-between cursor-pointer select-none hover:border-purple-400/50 transition-all"
          >
            <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-gray-400">
              <span>{currentCard.deck}</span>
              <span className="text-purple-600 dark:text-purple-400">
                {isFlipped ? "Answer" : "Tap to reveal 🔄"}
              </span>
            </div>

            <p className="text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 text-center py-2 line-clamp-3">
              {isFlipped ? currentCard.back : currentCard.front}
            </p>

            <span className="text-[9px] text-gray-400 text-center italic">
              {isFlipped ? "Rate your recall below" : "Active recall check"}
            </span>
          </div>
        )}
      </div>

      {/* Buttons */}
      {!isFinished && (
        <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
          {isFlipped ? (
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                disabled={grading}
                onClick={() => handleGrade(1)}
                className="py-1.5 px-2 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 text-red-600 text-[10px] font-bold border border-red-200 dark:border-red-900"
              >
                Again (1d)
              </button>
              <button
                type="button"
                disabled={grading}
                onClick={() => handleGrade(3)}
                className="py-1.5 px-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 text-sky-600 text-[10px] font-bold border border-sky-200 dark:border-sky-900"
              >
                Good (3d)
              </button>
              <button
                type="button"
                disabled={grading}
                onClick={() => handleGrade(4)}
                className="py-1.5 px-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-600 text-[10px] font-bold border border-emerald-200 dark:border-emerald-900"
              >
                Easy (7d)
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsFlipped(true)}
              className="w-full py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-xs"
            >
              Reveal Answer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
