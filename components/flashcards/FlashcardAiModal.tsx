"use client";

import React, { useState } from "react";
import {
  Sparkles,
  Brain,
  Layers,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  BookOpen,
} from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { triggerConfetti } from "@/components/ui/Confetti";
import { playHabitCompleteSound } from "@/lib/utils/sound";

interface GeneratedCard {
  front: string;
  back: string;
}

interface FlashcardAiModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingDecks?: string[];
  onCardsCreated: () => void;
}

export function FlashcardAiModal({
  isOpen,
  onClose,
  existingDecks = [],
  onCardsCreated,
}: FlashcardAiModalProps) {
  const [topic, setTopic] = useState("");
  const [deck, setDeck] = useState("");
  const [notes, setNotes] = useState("");
  const [count, setCount] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GeneratedCard[]>([]);
  const [errorMsg, setErrorMsg] = useState("");

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim() && !notes.trim()) {
      setErrorMsg("Please enter a study topic or paste lecture notes.");
      return;
    }

    try {
      setIsGenerating(true);
      setErrorMsg("");
      const resolvedDeck = deck.trim() || topic.trim() || "AI Review Deck";

      const res = await fetch("/api/flashcards/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: topic.trim(),
          deck: resolvedDeck,
          notes: notes.trim(),
          count,
        }),
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.cards) && json.cards.length > 0) {
        setGeneratedCards(json.cards);
        if (!deck.trim()) {
          setDeck(json.deck || resolvedDeck);
        }
      } else {
        setErrorMsg(json.message || "Failed to generate cards. Try again.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to connect to flashcard generation service.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveToDeck = async () => {
    if (generatedCards.length === 0) return;
    const finalDeck = deck.trim() || topic.trim() || "AI Review Deck";

    try {
      setIsSaving(true);
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: finalDeck,
          cards: generatedCards,
        }),
      });

      const json = await res.json();
      if (json.success) {
        playHabitCompleteSound();
        triggerConfetti();
        onCardsCreated();
        handleClose();
      } else {
        setErrorMsg(json.message || "Failed to save flashcards to deck.");
      }
    } catch (err: any) {
      setErrorMsg(err.message || "Error saving cards.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCardChange = (index: number, field: "front" | "back", value: string) => {
    setGeneratedCards((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c))
    );
  };

  const handleDeleteCard = (index: number) => {
    setGeneratedCards((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddBlankCard = () => {
    setGeneratedCards((prev) => [
      ...prev,
      { front: "New Question...", back: "Key Concept / Answer..." },
    ]);
  };

  const handleClose = () => {
    setTopic("");
    setDeck("");
    setNotes("");
    setGeneratedCards([]);
    setErrorMsg("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="AI Flashcard Deck Generator">
      <div className="space-y-5">
        {/* Intro */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-forest-50 to-emerald-50 dark:from-forest-950/40 dark:to-emerald-950/20 border border-forest-100 dark:border-forest-900/40 flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-forest-600 text-white flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-black text-forest-900 dark:text-forest-200 uppercase tracking-wider">
              Instant Spaced-Repetition Cards
            </h4>
            <p className="text-xs text-forest-700/90 dark:text-forest-400 mt-0.5 leading-relaxed">
              Enter any syllabus topic or paste lecture notes. Our engine converts them into active-recall question & answer pairs with SM-2 intervals.
            </p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {generatedCards.length === 0 ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Study Topic / Concept <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => {
                  setTopic(e.target.value);
                  if (!deck) setDeck(e.target.value);
                }}
                placeholder="e.g. Data Structures: Balanced BSTs, Photosynthesis, Microeconomics"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-forest-500"
                required
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Target Deck Name
                </label>
                <input
                  type="text"
                  value={deck}
                  onChange={(e) => setDeck(e.target.value)}
                  placeholder="e.g. Computer Science Midterm"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-forest-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                  Number of Cards
                </label>
                <select
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-hidden focus:ring-2 focus:ring-forest-500"
                >
                  <option value={5}>5 Cards (Quick Review)</option>
                  <option value={8}>8 Cards (Deep Dive)</option>
                  <option value={10}>10 Cards (Exam Comprehensive)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Optional: Paste Lecture Notes, Text, or Definitions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Paste class notes, bullet points, or chapter summaries here for hyper-targeted questions..."
                rows={4}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs focus:outline-hidden focus:ring-2 focus:ring-forest-500 resize-none font-mono"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isGenerating}
                className="w-full py-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>Synthesizing Cards...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Active Recall Deck</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-gray-100">
                  Generated {generatedCards.length} Cards for &ldquo;{deck}&rdquo;
                </h4>
                <p className="text-xs text-gray-400">
                  Review and edit prompts below before saving to your deck.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddBlankCard}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Card
              </button>
            </div>

            <div className="max-h-[380px] overflow-y-auto space-y-3 pr-1">
              {generatedCards.map((card, idx) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700/80 space-y-2 relative group"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-forest-700 dark:text-forest-400 uppercase tracking-wider">
                      Card #{idx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCard(idx)}
                      className="p-1 rounded-md text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Remove card"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                      Front (Question)
                    </label>
                    <input
                      type="text"
                      value={card.front}
                      onChange={(e) => handleCardChange(idx, "front", e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 font-medium focus:ring-1 focus:ring-forest-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-semibold text-gray-500 dark:text-gray-400 mb-0.5">
                      Back (Answer)
                    </label>
                    <textarea
                      value={card.back}
                      onChange={(e) => handleCardChange(idx, "back", e.target.value)}
                      rows={2}
                      className="w-full px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-gray-100 focus:ring-1 focus:ring-forest-500 resize-none leading-relaxed"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
              <button
                type="button"
                onClick={() => setGeneratedCards([])}
                className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                Regenerate / Back
              </button>

              <button
                type="button"
                onClick={handleSaveToDeck}
                disabled={isSaving || generatedCards.length === 0}
                className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isSaving ? (
                  <>
                    <Brain className="w-4 h-4 animate-spin" />
                    <span>Saving Deck...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Save {generatedCards.length} Cards to &ldquo;{deck}&rdquo;</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
