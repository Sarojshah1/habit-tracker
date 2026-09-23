"use client";

import React, { useState } from "react";
import { Plus, Tag } from "lucide-react";
import { Modal } from "@/components/ui/Modal";

interface FlashcardFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultDeck?: string;
  defaultFront?: string;
  defaultBack?: string;
  noteId?: string;
}

export function FlashcardFormModal({
  isOpen,
  onClose,
  onSuccess,
  defaultDeck = "",
  defaultFront = "",
  defaultBack = "",
  noteId,
}: FlashcardFormModalProps) {
  const [deck, setDeck] = useState(defaultDeck || "General Review");
  const [front, setFront] = useState(defaultFront || "");
  const [back, setBack] = useState(defaultBack || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      if (defaultDeck) setDeck(defaultDeck);
      if (defaultFront) setFront(defaultFront);
      if (defaultBack) setBack(defaultBack);
    }
  }, [isOpen, defaultDeck, defaultFront, defaultBack]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!front.trim() || !back.trim()) {
      setError("Both Front (Question) and Back (Answer) are required.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/flashcards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deck: deck.trim() || "General Review",
          front: front.trim(),
          back: back.trim(),
          noteId,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setFront("");
        setBack("");
        if (onSuccess) onSuccess();
        onClose();
      } else {
        setError(data.message || "Failed to create flashcard");
      }
    } catch (err: any) {
      setError(err.message || "Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="New Spaced Repetition Card">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Deck / Subject
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Biology, System Design, Organic Chemistry"
            value={deck}
            onChange={(e) => setDeck(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Front (Prompt / Question / Term) *
          </label>
          <textarea
            rows={3}
            required
            placeholder="e.g. What is the function of Mitochondria in eukaryotic cells?"
            value={front}
            onChange={(e) => setFront(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Back (Answer / Explanation / Key Formula) *
          </label>
          <textarea
            rows={4}
            required
            placeholder="e.g. Mitochondria generate most of the chemical energy needed to power the cell's biochemical reactions through ATP production."
            value={back}
            onChange={(e) => setBack(e.target.value)}
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-forest-500 resize-none"
          />
        </div>

        <p className="text-[11px] text-gray-400 dark:text-gray-500">
          💡 Review intervals will automatically adapt (1-day, 3-day, 7-day, 14-day) based on your recall accuracy when testing.
        </p>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-xs disabled:opacity-50"
          >
            {loading ? "Creating..." : "Create Flashcard"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
