"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  CheckSquare,
  ListTodo,
  Calendar,
  BarChart3,
  Timer,
  FileText,
  Settings,
  GraduationCap,
  Sun,
  Moon,
  Laptop,
  ArrowRight,
  Target,
  Sparkles,
  Command,
} from "lucide-react";
import { useTheme } from "@/lib/context/ThemeContext";

interface SearchResultItem {
  id: string;
  title: string;
  type: "habit" | "task" | "goal" | "note";
  href: string;
  subtitle?: string;
}

interface CommandItem {
  id: string;
  title: string;
  category: "Navigation" | "Focus & Exams" | "Appearance" | "Search Results";
  icon: React.ElementType;
  shortcut?: string;
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { setTheme } = useTheme();

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Global toggle listener (Cmd+K / Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Listen to custom open event (e.g. from header search button)
  useEffect(() => {
    const handleCustomOpen = () => {
      setIsOpen(true);
    };
    window.addEventListener("open-command-palette", handleCustomOpen);
    return () => window.removeEventListener("open-command-palette", handleCustomOpen);
  }, []);

  // Auto focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      setSelectedIndex(0);
      setQuery("");
      setSearchResults([]);
    }
  }, [isOpen]);

  // Debounced search for database items
  useEffect(() => {
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setIsSearching(true);
        const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.success && data.results) {
          const formatted: SearchResultItem[] = [];

          (data.results.habits || []).slice(0, 3).forEach((h: any) => {
            formatted.push({
              id: `habit-${h._id}`,
              title: h.name,
              type: "habit",
              href: "/habits",
              subtitle: "Habit",
            });
          });

          (data.results.tasks || []).slice(0, 3).forEach((t: any) => {
            formatted.push({
              id: `task-${t._id}`,
              title: t.title,
              type: "task",
              href: "/tasks",
              subtitle: `Task • ${t.priority || "normal"}`,
            });
          });

          (data.results.goals || []).slice(0, 3).forEach((g: any) => {
            formatted.push({
              id: `goal-${g._id}`,
              title: g.title,
              type: "goal",
              href: `/goals/${g._id}`,
              subtitle: "Goal",
            });
          });

          (data.results.notes || []).slice(0, 3).forEach((n: any) => {
            formatted.push({
              id: `note-${n._id}`,
              title: n.title,
              type: "note",
              href: "/notes",
              subtitle: "Note",
            });
          });

          setSearchResults(formatted);
        }
      } catch (err) {
        console.error("Command palette search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Built-in Static Commands
  const staticCommands: CommandItem[] = [
    // Navigation
    {
      id: "nav-dashboard",
      title: "Go to Dashboard",
      category: "Navigation",
      icon: LayoutDashboard,
      shortcut: "G D",
      action: () => router.push("/dashboard"),
      keywords: ["home", "main", "overview", "habits"],
    },
    {
      id: "nav-habits",
      title: "Go to My Habits",
      category: "Navigation",
      icon: CheckSquare,
      shortcut: "G H",
      action: () => router.push("/habits"),
      keywords: ["streaks", "track", "daily"],
    },
    {
      id: "nav-tasks",
      title: "Go to Tasks",
      category: "Navigation",
      icon: ListTodo,
      shortcut: "G T",
      action: () => router.push("/tasks"),
      keywords: ["todo", "work", "items"],
    },
    {
      id: "nav-focus",
      title: "Go to Focus Mode",
      category: "Navigation",
      icon: Timer,
      shortcut: "G F",
      action: () => router.push("/focus"),
      keywords: ["timer", "pomodoro", "study", "exam", "clock"],
    },
    {
      id: "nav-calendar",
      title: "Go to Calendar",
      category: "Navigation",
      icon: Calendar,
      shortcut: "G C",
      action: () => router.push("/calendar"),
      keywords: ["schedule", "timeblocks", "week", "month"],
    },
    {
      id: "nav-goals",
      title: "Go to Goals",
      category: "Navigation",
      icon: Target,
      shortcut: "G G",
      action: () => router.push("/goals"),
      keywords: ["targets", "milestones", "vision"],
    },
    {
      id: "nav-analytics",
      title: "Go to Analytics",
      category: "Navigation",
      icon: BarChart3,
      shortcut: "G A",
      action: () => router.push("/analytics"),
      keywords: ["stats", "charts", "graphs", "progress"],
    },
    {
      id: "nav-notes",
      title: "Go to Notes",
      category: "Navigation",
      icon: FileText,
      shortcut: "G N",
      action: () => router.push("/notes"),
      keywords: ["memo", "study notes", "docs", "review"],
    },
    {
      id: "nav-settings",
      title: "Go to Settings",
      category: "Navigation",
      icon: Settings,
      shortcut: "G S",
      action: () => router.push("/settings"),
      keywords: ["preferences", "theme", "account", "profile"],
    },

    // Focus & Exam Actions
    {
      id: "focus-pomodoro",
      title: "Start 25m Pomodoro Focus",
      category: "Focus & Exams",
      icon: Timer,
      action: () => router.push("/focus"),
      keywords: ["study", "deep work", "25", "timer"],
    },
    {
      id: "focus-exam-60",
      title: "Start 60m Exam Sprint",
      category: "Focus & Exams",
      icon: GraduationCap,
      action: () => router.push("/focus"),
      keywords: ["exam", "test", "sprint", "60", "study"],
    },
    {
      id: "focus-mock-120",
      title: "Start 120m Mock Test",
      category: "Focus & Exams",
      icon: GraduationCap,
      action: () => router.push("/focus"),
      keywords: ["mock", "test", "exam", "120", "study"],
    },

    // Appearance Actions
    {
      id: "theme-dark",
      title: "Switch to Dark Mode",
      category: "Appearance",
      icon: Moon,
      action: () => setTheme("dark"),
      keywords: ["night", "black", "dark theme"],
    },
    {
      id: "theme-light",
      title: "Switch to Light Mode",
      category: "Appearance",
      icon: Sun,
      action: () => setTheme("light"),
      keywords: ["day", "white", "light theme"],
    },
    {
      id: "theme-system",
      title: "Sync with System Theme",
      category: "Appearance",
      icon: Laptop,
      action: () => setTheme("system"),
      keywords: ["auto", "os", "match"],
    },
  ];

  // Filter commands by query
  const filteredCommands = staticCommands.filter((cmd) => {
    if (!query.trim()) return true;
    const lowerQuery = query.toLowerCase();
    const titleMatch = cmd.title.toLowerCase().includes(lowerQuery);
    const categoryMatch = cmd.category.toLowerCase().includes(lowerQuery);
    const keywordMatch = cmd.keywords?.some((k) => k.toLowerCase().includes(lowerQuery));
    return titleMatch || categoryMatch || keywordMatch;
  });

  // Convert Search Results to Command format
  const searchCommands: CommandItem[] = searchResults.map((item) => ({
    id: item.id,
    title: item.title,
    category: "Search Results",
    icon:
      item.type === "habit"
        ? CheckSquare
        : item.type === "task"
        ? ListTodo
        : item.type === "goal"
        ? Target
        : FileText,
    action: () => router.push(item.href),
    keywords: [item.type],
  }));

  const allItems = [...searchCommands, ...filteredCommands];
  const allItemsRef = useRef(allItems);
  allItemsRef.current = allItems;

  // Keyboard navigation inside list
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = allItemsRef.current;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (items[selectedIndex]) {
        items[selectedIndex].action();
        setIsOpen(false);
      }
    }
  };

  // Group items by category for rendering
  const groupedCategories = Array.from(new Set(allItems.map((item) => item.category)));

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-gray-900/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={() => setIsOpen(false)}
    >
      <div
        className="w-full max-w-2xl bg-white dark:bg-gray-900 rounded-3xl shadow-2xl border border-gray-100 dark:border-gray-800 overflow-hidden flex flex-col max-h-[80vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100 dark:border-gray-800">
          <Search className="w-5 h-5 text-gray-400 dark:text-gray-500" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            placeholder="Type a command, habit, task, or page..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm font-medium outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              Clear
            </button>
          )}
          <kbd className="px-2 py-1 text-[10px] font-bold text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-lg select-none">
            ESC
          </kbd>
        </div>

        {/* Results List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-3 divide-y divide-transparent space-y-4">
          {allItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-gray-400 dark:text-gray-500">
              No matching commands or results found for &ldquo;{query}&rdquo;.
            </div>
          ) : (
            groupedCategories.map((category) => {
              const categoryItems = allItems.filter((i) => i.category === category);
              return (
                <div key={category} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider flex items-center justify-between">
                    <span>{category}</span>
                    {category === "Search Results" && isSearching && (
                      <span className="text-[10px] text-forest-600 dark:text-forest-400 animate-pulse">
                        Searching...
                      </span>
                    )}
                  </div>
                  {categoryItems.map((item) => {
                    const globalIdx = allItems.indexOf(item);
                    const isSelected = globalIdx === selectedIndex;
                    const Icon = item.icon;

                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => {
                          item.action();
                          setIsOpen(false);
                        }}
                        onMouseEnter={() => setSelectedIndex(globalIdx)}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs font-semibold transition-colors ${
                          isSelected
                            ? "bg-forest-50 dark:bg-forest-950/70 text-forest-900 dark:text-forest-200 shadow-xs"
                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-xl ${
                              isSelected
                                ? "bg-forest-100/80 dark:bg-forest-900/60 text-forest-800 dark:text-forest-300"
                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="truncate">{item.title}</span>
                        </div>

                        <div className="flex items-center gap-2">
                          {item.shortcut && (
                            <span className="text-[10px] font-mono text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">
                              {item.shortcut}
                            </span>
                          )}
                          {isSelected && (
                            <ArrowRight className="w-3.5 h-3.5 text-forest-600 dark:text-forest-400 animate-in slide-in-from-left-1 duration-150" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts helper */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-gray-100 dark:border-gray-800 bg-gray-50/60 dark:bg-gray-900/60 text-[11px] text-gray-400 dark:text-gray-500 select-none">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xs text-[10px]">
                ↑
              </kbd>
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xs text-[10px]">
                ↓
              </kbd>
              to navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded shadow-xs text-[10px]">
                ↵
              </kbd>
              to select
            </span>
          </div>
          <div className="flex items-center gap-1 font-semibold text-forest-700 dark:text-forest-400">
            <Command className="w-3.5 h-3.5" />
            <span>HabitTrack Spotlight</span>
          </div>
        </div>
      </div>
    </div>
  );
}
