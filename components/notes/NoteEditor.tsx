"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Bold,
  Italic,
  Underline,
  List,
  CheckSquare,
  Link as LinkIcon,
  Heading,
  Check,
  AlertCircle,
  Clock,
  Pin,
  Trash2,
  Brain,
} from "lucide-react";
import { FlashcardFormModal } from "@/components/flashcards/FlashcardFormModal";

interface Note {
  _id: string;
  title: string;
  content: string;
  pinned: boolean;
  archived: boolean;
  tags: string[];
  updatedAt: string;
}

interface NoteEditorProps {
  note: Note | null;
  onUpdateNote: (updated: Note) => void;
  onDeleteNote: (id: string) => void;
  onTogglePin: (id: string, currentPin: boolean) => void;
}

export function NoteEditor({
  note,
  onUpdateNote,
  onDeleteNote,
  onTogglePin,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "error">("saved");
  const [isFlashcardModalOpen, setIsFlashcardModalOpen] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (note) {
      setTitle(note.title || "Untitled Note");
      setContent(note.content || "");
      setSaveStatus("saved");
    }
  }, [note]);

  // Autosave when title or content changes
  const triggerAutosave = (newTitle: string, newContent: string) => {
    if (!note) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    setSaveStatus("saving");

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/notes/${note._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: newTitle.trim() || "Untitled Note",
            content: newContent,
          }),
        });

        const data = await res.json();
        if (data.success && data.note) {
          setSaveStatus("saved");
          onUpdateNote(data.note);
        } else {
          setSaveStatus("error");
        }
      } catch (err) {
        console.error("Autosave error:", err);
        setSaveStatus("error");
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    triggerAutosave(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    triggerAutosave(title, val);
  };

  // Helper to insert markdown formatting around selected text
  const insertFormatting = (prefix: string, suffix: string = prefix, defaultPlaceholder: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end) || defaultPlaceholder;
    const replacement = `${prefix}${selectedText}${suffix}`;

    const newContent = content.substring(0, start) + replacement + content.substring(end);
    setContent(newContent);
    triggerAutosave(title, newContent);

    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 0);
  };

  if (!note) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 dark:text-gray-500 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800">
        <p className="text-base font-semibold text-gray-700 dark:text-gray-300">Select a note from the sidebar</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Or click &quot;New Note&quot; to write down your study plans.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
      {/* Note Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Formatting Controls */}
          <button
            type="button"
            onClick={() => insertFormatting("**", "**", "bold text")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Bold"
            aria-label="Bold text"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("*", "*", "italic text")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Italic"
            aria-label="Italic text"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Underline"
            aria-label="Underline text"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting("## ", "", "Heading")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Heading"
            aria-label="Heading"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- ", "", "List item")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- [ ] ", "", "Checklist item")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Checklist"
            aria-label="Checklist item"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("[", "](https://example.com)", "Link text")}
            className="p-1.5 rounded-lg text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-200/60 dark:hover:bg-gray-700 transition-colors"
            title="Link"
            aria-label="Insert Link"
          >
            <LinkIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Right Status & Actions */}
        <div className="flex items-center gap-3">
          {/* Autosave Status Indicator */}
          <div className="flex items-center gap-1.5 text-xs">
            {saveStatus === "saving" && (
              <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-medium animate-pulse">
                <Clock className="w-3.5 h-3.5" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-forest-700 dark:text-forest-400 font-medium">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Error saving
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsFlashcardModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-forest-50 dark:bg-forest-950/60 hover:bg-forest-100 dark:hover:bg-forest-900/60 text-forest-700 dark:text-forest-400 font-semibold text-xs border border-forest-200 dark:border-forest-800 transition-colors"
            title="Convert note or selection into a Spaced Repetition Flashcard"
          >
            <Brain className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Make Flashcard</span>
          </button>

          <button
            type="button"
            onClick={() => onTogglePin(note._id, note.pinned)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.pinned
                ? "bg-forest-100 dark:bg-forest-900/40 text-forest-800 dark:text-forest-300"
                : "text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
            title={note.pinned ? "Unpin note" : "Pin note to top"}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteNote(note._id)}
            className="p-1.5 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
            title="Delete note"
            aria-label="Delete note"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Title Input */}
      <div className="px-6 pt-5 pb-2">
        <input
          type="text"
          value={title}
          onChange={handleTitleChange}
          placeholder="Note Title"
          className="w-full text-xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-none outline-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600"
        />
      </div>

      {/* Editor Body */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Write your study plans, goals, checklist, or reflections here..."
          className="w-full h-full min-h-[400px] text-sm text-gray-800 dark:text-gray-200 bg-transparent leading-relaxed border-none outline-none resize-none focus:ring-0 placeholder:text-gray-300 dark:placeholder:text-gray-600 font-sans"
        />
      </div>

      {/* Convert Note to Flashcard Modal */}
      <FlashcardFormModal
        isOpen={isFlashcardModalOpen}
        onClose={() => setIsFlashcardModalOpen(false)}
        defaultDeck={note.tags && note.tags.length > 0 ? note.tags[0] : "Study Notes"}
        defaultFront={title || "Key Concept"}
        defaultBack={content || ""}
        noteId={note._id}
      />
    </div>
  );
}
