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
} from "lucide-react";

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
      <div className="h-full flex flex-col items-center justify-center p-8 text-center text-gray-400 bg-white rounded-2xl border border-gray-100">
        <p className="text-base font-semibold text-gray-700">Select a note from the sidebar</p>
        <p className="text-xs text-gray-400 mt-1">Or click &quot;New Note&quot; to write down your study plans.</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Note Header Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-gray-50/50">
        <div className="flex items-center gap-1 sm:gap-2">
          {/* Formatting Controls */}
          <button
            type="button"
            onClick={() => insertFormatting("**", "**", "bold text")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Bold"
            aria-label="Bold text"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("*", "*", "italic text")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Italic"
            aria-label="Italic text"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("<u>", "</u>", "underlined text")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Underline"
            aria-label="Underline text"
          >
            <Underline className="w-4 h-4" />
          </button>
          <div className="w-px h-4 bg-gray-200 mx-1" />
          <button
            type="button"
            onClick={() => insertFormatting("## ", "", "Heading")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Heading"
            aria-label="Heading"
          >
            <Heading className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- ", "", "List item")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Bullet List"
            aria-label="Bullet List"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("- [ ] ", "", "Checklist item")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
            title="Checklist"
            aria-label="Checklist item"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => insertFormatting("[", "](https://example.com)", "Link text")}
            className="p-1.5 rounded-lg text-gray-500 hover:text-gray-900 hover:bg-gray-200/60 transition-colors"
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
              <span className="flex items-center gap-1 text-amber-600 font-medium animate-pulse">
                <Clock className="w-3.5 h-3.5" /> Saving...
              </span>
            )}
            {saveStatus === "saved" && (
              <span className="flex items-center gap-1 text-forest-700 font-medium">
                <Check className="w-3.5 h-3.5" /> Saved
              </span>
            )}
            {saveStatus === "error" && (
              <span className="flex items-center gap-1 text-red-600 font-medium">
                <AlertCircle className="w-3.5 h-3.5" /> Error saving
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={() => onTogglePin(note._id, note.pinned)}
            className={`p-1.5 rounded-lg transition-colors ${
              note.pinned
                ? "bg-forest-100 text-forest-800"
                : "text-gray-400 hover:text-gray-700 hover:bg-gray-100"
            }`}
            title={note.pinned ? "Unpin note" : "Pin note to top"}
            aria-label={note.pinned ? "Unpin note" : "Pin note"}
          >
            <Pin className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => onDeleteNote(note._id)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
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
          className="w-full text-xl font-bold text-gray-900 border-none outline-none focus:ring-0 placeholder:text-gray-300"
        />
      </div>

      {/* Editor Body */}
      <div className="flex-1 px-6 pb-6 overflow-y-auto">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Write your study plans, goals, checklist, or reflections here..."
          className="w-full h-full min-h-[400px] text-sm text-gray-800 leading-relaxed border-none outline-none resize-none focus:ring-0 placeholder:text-gray-300 font-sans"
        />
      </div>
    </div>
  );
}
