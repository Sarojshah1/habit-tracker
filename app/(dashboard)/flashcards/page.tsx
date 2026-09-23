"use client";

import React, { useState, useEffect } from "react";
import {
  Brain,
  Plus,
  Play,
  Calendar,
  Layers,
  Sparkles,
  Trash2,
  CheckCircle2,
  Clock,
  BookOpen,
} from "lucide-react";
import { FlashcardReviewModal } from "@/components/flashcards/FlashcardReviewModal";
import { FlashcardFormModal } from "@/components/flashcards/FlashcardFormModal";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function FlashcardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [decks, setDecks] = useState<string[]>([]);
  const [selectedDeck, setSelectedDeck] = useState<string>("all");
  const [stats, setStats] = useState({ totalCards: 0, dueCardsCount: 0, masteredCardsCount: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchCards = React.useCallback(async () => {
    try {
      setIsLoading(true);
      const url =
        selectedDeck === "all"
          ? "/api/flashcards"
          : `/api/flashcards?deck=${encodeURIComponent(selectedDeck)}`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success) {
        setCards(data.cards);
        setDecks(data.decks || []);
        setStats(data.stats || { totalCards: 0, dueCardsCount: 0, masteredCardsCount: 0 });
      }
    } catch (err) {
      console.error("Failed to load flashcards:", err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedDeck]);

  useEffect(() => {
    fetchCards();
  }, [fetchCards]);

  const handleDelete = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`/api/flashcards/${deletingId}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        setCards((prev) => prev.filter((c) => c._id !== deletingId));
        setDeletingId(null);
        fetchCards();
      }
    } catch (err) {
      console.error("Failed to delete flashcard:", err);
    }
  };

  const todayStr = new Date().toISOString().split("T")[0];
  const dueCards = cards.filter((c) => c.dueDate <= todayStr);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Spaced Repetition Flashcards
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Active recall intervals (1d, 3d, 7d, 14d) designed for long-term retention and exam mastery.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {dueCards.length > 0 && (
            <button
              type="button"
              onClick={() => setIsReviewModalOpen(true)}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              Review Due ({dueCards.length})
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsFormModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-800 dark:text-gray-200 font-bold text-sm shadow-xs transition-all hover:-translate-y-0.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add Card
          </button>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-400 flex items-center justify-center">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Due For Review Today
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.dueCardsCount}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Total Flashcards
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.totalCards}
            </h3>
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Mastered (14d+ Interval)
            </p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-gray-100 mt-0.5">
              {stats.masteredCardsCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Deck Selector Tabs */}
      {decks.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSelectedDeck("all")}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedDeck === "all"
                ? "bg-forest-700 text-white shadow-xs"
                : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
            }`}
          >
            All Decks ({stats.totalCards})
          </button>
          {decks.map((deck) => (
            <button
              key={deck}
              type="button"
              onClick={() => setSelectedDeck(deck)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                selectedDeck === deck
                  ? "bg-forest-700 text-white shadow-xs"
                  : "bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:bg-gray-50"
              }`}
            >
              {deck}
            </button>
          ))}
        </div>
      )}

      {/* Cards Grid */}
      {isLoading ? (
        <LoadingSkeleton count={3} />
      ) : cards.length === 0 ? (
        <EmptyState
          icon={Brain}
          title="No Flashcards Created Yet"
          description="Create your first active recall card or generate them from your study notes."
          actionText="Create Flashcard"
          onAction={() => setIsFormModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {cards.map((card) => {
            const isDue = card.dueDate <= todayStr;
            return (
              <div
                key={card._id}
                className="p-5 rounded-3xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-0.5 text-[11px] font-bold rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {card.deck}
                    </span>
                    <button
                      type="button"
                      onClick={() => setDeletingId(card._id)}
                      className="p-1 rounded-lg text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      Front
                    </p>
                    <p className="font-bold text-gray-900 dark:text-gray-100 text-sm mt-1 line-clamp-3">
                      {card.front}
                    </p>
                  </div>

                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-forest-700 dark:text-forest-400">
                      Back / Answer
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 line-clamp-3">
                      {card.back}
                    </p>
                  </div>
                </div>

                {/* Footer status */}
                <div className="flex items-center justify-between text-[11px] pt-4 mt-4 border-t border-gray-100 dark:border-gray-800">
                  <span
                    className={`font-bold px-2 py-0.5 rounded-md ${
                      isDue
                        ? "bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                    }`}
                  >
                    {isDue ? "Due Today" : `Due ${card.dueDate}`}
                  </span>
                  <span className="text-gray-400 dark:text-gray-500 font-medium">
                    Interval: {card.intervalDays}d
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Review Modal */}
      <FlashcardReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        cards={dueCards.length > 0 ? dueCards : cards}
        onReviewCompleted={fetchCards}
      />

      {/* Create Modal */}
      <FlashcardFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchCards}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={!!deletingId}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        title="Delete Flashcard"
        message="Are you sure you want to delete this flashcard? Spaced repetition progress will be lost."
        isDestructive={true}
        confirmText="Delete"
      />
    </div>
  );
}
