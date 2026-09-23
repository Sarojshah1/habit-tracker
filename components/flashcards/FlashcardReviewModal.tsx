"use client";

import React, { useState, useEffect } from "react";
import {
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Sparkles,
  ArrowRight,
  Flame,
  X,
  Volume2,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface Card {
  _id: string;
  deck: string;
  front: string;
  back: string;
  intervalDays: number;
  repetition: number;
}

interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Card[];
  onReviewCompleted: () => void;
}

export function FlashcardReviewModal({
  isOpen,
  onClose,
  cards,
  onReviewCompleted,
}: FlashcardReviewModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewedCount(0);
    }
  }, [isOpen]);

  const currentCard = cards[currentIndex];
  const isFinished = currentIndex >= cards.length;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleGrade = async (rating: number) => {
    if (!currentCard || isSubmitting) return;

    try {
      setIsSubmitting(true);
      await fetch(`/api/flashcards/${currentCard._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating }),
      });

      setReviewedCount((prev) => prev + 1);
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } catch (err) {
      console.error("Failed to grade flashcard:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (reviewedCount > 0) onReviewCompleted();
        onClose();
      }}
      title={isFinished ? "Review Complete!" : `Reviewing Deck: ${currentCard?.deck || "Flashcards"}`}
    >
      <div className="space-y-6">
        {isFinished ? (
          <div className="text-center py-8 space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100">
              All Caught Up!
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              You reviewed {reviewedCount} flashcard{reviewedCount !== 1 ? "s" : ""}. Spaced
              repetition intervals have been updated for your next review cycle.
            </p>
            <button
              type="button"
              onClick={() => {
                onReviewCompleted();
                onClose();
              }}
              className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition-all"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            {/* Progress counter */}
            <div className="flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
              <span>
                Card {currentIndex + 1} of {cards.length}
              </span>
              <span className="font-semibold text-forest-700 dark:text-forest-400">
                Interval: {currentCard.intervalDays}d
              </span>
            </div>

            {/* Flashcard Flip Card Container */}
            <div
              onClick={handleFlip}
              className="relative min-h-[220px] p-6 rounded-3xl bg-gray-50 dark:bg-gray-800 border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col justify-between cursor-pointer select-none transition-all hover:border-forest-500/50 group"
            >
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                <span>{isFlipped ? "Back (Answer)" : "Front (Question)"}</span>
                <span className="text-[10px] text-gray-400 group-hover:text-forest-600 transition-colors">
                  Tap to flip 🔄
                </span>
              </div>

              <div className="py-4 text-center">
                <p className="text-base sm:text-lg font-bold text-gray-900 dark:text-gray-100 whitespace-pre-wrap leading-relaxed">
                  {isFlipped ? currentCard.back : currentCard.front}
                </p>
              </div>

              <div className="text-center text-[10px] text-gray-400 dark:text-gray-500 italic">
                {isFlipped
                  ? "Rate how well you recalled this card below"
                  : "Try to answer mentally before flipping"}
              </div>
            </div>

            {/* Response Grading Buttons */}
            {isFlipped ? (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-center text-gray-500 dark:text-gray-400">
                  How easy was it to recall?
                </p>
                <div className="grid grid-cols-4 gap-2">
                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGrade(1)}
                    className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 border border-red-200 dark:border-red-800 text-center transition-all disabled:opacity-50"
                  >
                    <p className="text-xs font-black text-red-600 dark:text-red-300">Again</p>
                    <p className="text-[10px] text-red-500/80 mt-0.5">1 day</p>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGrade(2)}
                    className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/60 border border-amber-200 dark:border-amber-800 text-center transition-all disabled:opacity-50"
                  >
                    <p className="text-xs font-black text-amber-600 dark:text-amber-300">Hard</p>
                    <p className="text-[10px] text-amber-500/80 mt-0.5">2 days</p>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGrade(3)}
                    className="p-3 rounded-2xl bg-sky-50 dark:bg-sky-950/40 hover:bg-sky-100 dark:hover:bg-sky-900/60 border border-sky-200 dark:border-sky-800 text-center transition-all disabled:opacity-50"
                  >
                    <p className="text-xs font-black text-sky-600 dark:text-sky-300">Good</p>
                    <p className="text-[10px] text-sky-500/80 mt-0.5">3-7 days</p>
                  </button>

                  <button
                    type="button"
                    disabled={isSubmitting}
                    onClick={() => handleGrade(4)}
                    className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 border border-emerald-200 dark:border-emerald-800 text-center transition-all disabled:opacity-50"
                  >
                    <p className="text-xs font-black text-emerald-600 dark:text-emerald-300">Easy</p>
                    <p className="text-[10px] text-emerald-500/80 mt-0.5">14+ days</p>
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={handleFlip}
                className="w-full py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-xs transition-all text-center"
              >
                Reveal Answer (Spacebar or Click)
              </button>
            )}
          </>
        )}
      </div>
    </Modal>
  );
}
