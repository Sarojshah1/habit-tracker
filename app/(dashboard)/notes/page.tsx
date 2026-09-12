"use client";

import React, { useState, useEffect } from "react";
import { Plus, Search, Pin, FileText, Trash2, Calendar } from "lucide-react";
import { NoteEditor } from "@/components/notes/NoteEditor";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function NotesPage() {
  const [notes, setNotes] = useState<any[]>([]);
  const [selectedNote, setSelectedNote] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const fetchNotes = React.useCallback(async () => {
    try {
      setError(false);
      const res = await fetch("/api/notes");
      if (!res.ok) throw new Error("Failed to fetch notes");
      const data = await res.json();
      if (data.success) {
        setNotes(data.notes);
        if (data.notes.length > 0 && !selectedNote) {
          setSelectedNote(data.notes[0]);
        }
      }
    } catch (err) {
      console.error("Notes error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [selectedNote]);

  useEffect(() => {
    fetchNotes();
  }, [fetchNotes]);

  const handleCreateNote = async () => {
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New Study Note",
          content: "",
        }),
      });

      const data = await res.json();
      if (data.success && data.note) {
        setNotes((prev) => [data.note, ...prev]);
        setSelectedNote(data.note);
      }
    } catch (err) {
      console.error("Failed to create note:", err);
    }
  };

  const handleUpdateNote = (updated: any) => {
    setNotes((prev) =>
      prev.map((n) => (n._id === updated._id ? updated : n))
    );
    if (selectedNote?._id === updated._id) {
      setSelectedNote(updated);
    }
  };

  const handleTogglePin = async (id: string, currentPin: boolean) => {
    try {
      const res = await fetch(`/api/notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pinned: !currentPin }),
      });
      const data = await res.json();
      if (data.success) {
        fetchNotes();
      }
    } catch (err) {
      console.error("Failed to toggle pin:", err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingNoteId) return;
    try {
      await fetch(`/api/notes/${deletingNoteId}`, { method: "DELETE" });
      setNotes((prev) => prev.filter((n) => n._id !== deletingNoteId));
      if (selectedNote?._id === deletingNoteId) {
        const remaining = notes.filter((n) => n._id !== deletingNoteId);
        setSelectedNote(remaining.length > 0 ? remaining[0] : null);
      }
      setDeletingNoteId(null);
    } catch (err) {
      console.error("Failed to delete note:", err);
    }
  };

  const filteredNotes = notes.filter(
    (n) =>
      n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Notes</h1>
          <p className="text-sm text-gray-500 mt-1 font-medium">
            Write, plan, and organize your thoughts, study schedules, and reflections.
          </p>
        </div>

        <button
          type="button"
          onClick={handleCreateNote}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-sm shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          New Note
        </button>
      </div>

      {/* Main Split Layout: Notes List (4 cols) & Editor (8 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[600px]">
        {/* Sidebar Notes List (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm flex flex-col">
          {/* Search Box */}
          <div className="relative mb-3">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl outline-none focus:bg-white focus:border-forest-600 transition-all"
            />
          </div>

          {/* Notes Item List */}
          {isLoading ? (
            <div className="space-y-3 py-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
              ))}
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-400 font-medium my-auto">
              No notes found. Click &quot;New Note&quot; to start.
            </div>
          ) : (
            <div className="flex-1 space-y-2 overflow-y-auto max-h-[600px] pr-1">
              {filteredNotes.map((n) => {
                const isSelected = selectedNote?._id === n._id;
                const preview =
                  n.content.replace(/[#*`\-_]/g, "").slice(0, 65) || "Empty note...";
                const dateStr = new Date(n.updatedAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <div
                    key={n._id}
                    onClick={() => setSelectedNote(n)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer select-none ${
                      isSelected
                        ? "bg-forest-50/60 border-forest-200 shadow-xs"
                        : "bg-white border-gray-100/80 hover:bg-gray-50/80"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4
                        className={`text-xs font-bold truncate ${
                          isSelected ? "text-forest-900" : "text-gray-900"
                        }`}
                      >
                        {n.title || "Untitled Note"}
                      </h4>
                      {n.pinned && (
                        <Pin className="w-3.5 h-3.5 text-forest-700 shrink-0 fill-current" />
                      )}
                    </div>

                    <p className="text-[11px] text-gray-500 mt-1 line-clamp-2 leading-relaxed font-normal">
                      {preview}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100/60 text-[10px] text-gray-400">
                      <span>{dateStr}</span>
                      {n.tags?.length > 0 && (
                        <span className="font-semibold text-forest-700 bg-forest-100 px-1.5 py-0.5 rounded">
                          #{n.tags[0]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Note Editor Pane (8 cols) */}
        <div className="lg:col-span-8 min-h-[600px]">
          <NoteEditor
            note={selectedNote}
            onUpdateNote={handleUpdateNote}
            onDeleteNote={(id) => setDeletingNoteId(id)}
            onTogglePin={handleTogglePin}
          />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={!!deletingNoteId}
        onClose={() => setDeletingNoteId(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Note"
        message="Are you sure you want to delete this note? This action cannot be undone."
        isDestructive={true}
        confirmText="Delete Note"
      />
    </div>
  );
}
