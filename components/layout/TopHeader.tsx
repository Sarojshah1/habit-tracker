"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Bell,
  Menu,
  User,
  Settings,
  LogOut,
  ChevronDown,
  CheckCircle2,
  BookOpen,
  Calendar,
  Flame,
  Target,
  X,
  Clock,
  Moon,
  Trash2,
  Check,
  ListTodo,
  Command,
} from "lucide-react";
import { ThemeToggle } from "../ui/ThemeToggle";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

interface TopHeaderProps {
  user: UserProfile | null;
  onOpenMobileMenu?: () => void;
}

export function TopHeader({ user, onOpenMobileMenu }: TopHeaderProps) {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{
    habits: any[];
    notes: any[];
    goals: any[];
    tasks?: any[];
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  // Live Notifications
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 45000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  const handleNotificationClick = async (notif: any) => {
    if (!notif.read) {
      setNotifications((prev) =>
        prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
      fetch(`/api/notifications/${notif._id}`, { method: "PATCH" });
    }
    setShowNotifications(false);

    if (notif.entityType === "task" || notif.type === "task_due") {
      router.push("/tasks");
    } else if (notif.entityType === "habit" || notif.type === "habit_reminder" || notif.type === "streak_milestone") {
      router.push("/habits");
    } else if (notif.entityType === "goal" || notif.type === "goal_completed" || notif.type === "goal_deadline") {
      router.push(notif.entityId ? `/goals/${notif.entityId}` : "/goals");
    } else if (notif.entityType === "focus" || notif.type === "focus_completed") {
      router.push("/focus");
    } else if (notif.type === "daily_review") {
      router.push("/dashboard");
    }
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
  };

  const handleClearAll = async () => {
    setNotifications([]);
    setUnreadCount(0);
    await fetch("/api/notifications", { method: "DELETE" });
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const wasUnread = notifications.find((n) => n._id === id && !n.read);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
    if (wasUnread) setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "DELETE" });
  };

  const formatTimeAgo = (dateInput: string | Date) => {
    try {
      const diffMs = Date.now() - new Date(dateInput).getTime();
      const mins = Math.floor(diffMs / 60000);
      if (mins < 1) return "Just now";
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      const days = Math.floor(hours / 24);
      if (days < 7) return `${days}d ago`;
      return new Date(dateInput).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch {
      return "";
    }
  };

  const getNotifIcon = (type: string) => {
    switch (type) {
      case "streak_milestone":
        return <Flame className="w-4 h-4 text-orange-600" />;
      case "habit_reminder":
        return <CheckCircle2 className="w-4 h-4 text-forest-600" />;
      case "task_due":
        return <ListTodo className="w-4 h-4 text-blue-600" />;
      case "focus_completed":
        return <Clock className="w-4 h-4 text-emerald-600" />;
      case "goal_completed":
      case "goal_deadline":
        return <Target className="w-4 h-4 text-amber-600" />;
      case "daily_review":
        return <Moon className="w-4 h-4 text-indigo-600" />;
      case "weekly_review":
        return <Calendar className="w-4 h-4 text-teal-600" />;
      default:
        return <Bell className="w-4 h-4 text-forest-700" />;
    }
  };

  // Close dropdowns on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        const data = await res.json();
        if (data.success) {
          setSearchResults(data.results);
          setShowSearchDropdown(true);
        }
      } catch (err) {
        console.error("Search error:", err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/login");
      router.refresh();
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const displayName = user?.name || "Student";
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <header className="sticky top-0 z-30 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-gray-100/90 dark:border-gray-800 px-4 sm:px-6 py-3 transition-colors duration-200">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Search Field & Command Palette Trigger */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div
            onClick={() => window.dispatchEvent(new Event("open-command-palette"))}
            className="relative flex items-center cursor-pointer group"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" />
            <input
              type="text"
              readOnly
              placeholder="Search or press Cmd+K..."
              className="w-full pl-9 pr-14 py-2 text-sm bg-gray-50/80 dark:bg-gray-800/80 border border-gray-200/80 dark:border-gray-700/80 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 cursor-pointer group-hover:bg-white dark:group-hover:bg-gray-800 group-hover:border-forest-500/50 transition-all outline-none"
            />
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-gray-200/70 dark:bg-gray-700 text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 select-none">
              <Command className="w-3 h-3" />
              <span>K</span>
            </div>
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white dark:bg-gray-900 rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-800 p-2 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">Searching...</div>
              ) : searchResults.habits.length === 0 &&
                searchResults.notes.length === 0 &&
                searchResults.goals.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400 dark:text-gray-500">
                  No matching habits, notes, or goals found.
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {searchResults.habits.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2.5 py-1">
                        Habits
                      </p>
                      {searchResults.habits.map((item) => (
                        <Link
                          key={item.id}
                          href={`/habits`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-900/30 text-gray-800 dark:text-gray-200 hover:text-forest-900 dark:hover:text-forest-300 transition-colors text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.notes.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2.5 py-1">
                        Notes
                      </p>
                      {searchResults.notes.map((item) => (
                        <Link
                          key={item.id}
                          href={`/notes`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-900/30 text-gray-800 dark:text-gray-200 hover:text-forest-900 dark:hover:text-forest-300 transition-colors text-sm"
                        >
                          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.goals.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2.5 py-1">
                        Goals
                      </p>
                      {searchResults.goals.map((item) => (
                        <Link
                          key={item.id}
                          href={`/goals/${item.id}`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-900/30 text-gray-800 dark:text-gray-200 hover:text-forest-900 dark:hover:text-forest-300 transition-colors text-sm"
                        >
                          <Target className="w-4 h-4 text-forest-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.tasks && searchResults.tasks.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-2.5 py-1">
                        Tasks
                      </p>
                      {searchResults.tasks.map((item) => (
                        <Link
                          key={item.id}
                          href="/tasks"
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 dark:hover:bg-forest-900/30 text-gray-800 dark:text-gray-200 hover:text-forest-900 dark:hover:text-forest-300 transition-colors text-sm"
                        >
                          <ListTodo className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Actions: Theme, Notifications & Profile */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          {/* Light / Dark Mode Toggle */}
          <ThemeToggle />

          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-forest-700 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white dark:ring-gray-900">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-gray-900 rounded-3xl shadow-elevated border border-gray-100 dark:border-gray-800 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-gray-100">Notifications</h4>
                    {unreadCount > 0 ? (
                      <span className="text-[11px] font-bold text-forest-700 dark:text-forest-400 bg-forest-50 dark:bg-forest-950/60 px-2 py-0.5 rounded-full">
                        {unreadCount} new
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500">All read</span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={handleMarkAllRead}
                      className="text-[11px] font-bold text-forest-700 dark:text-forest-400 hover:underline"
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div className="divide-y divide-gray-50 dark:divide-gray-800 max-h-80 overflow-y-auto my-1">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-gray-400 dark:text-gray-500">
                      <CheckCircle2 className="w-8 h-8 text-forest-200 dark:text-forest-800 mx-auto mb-2" />
                      <p className="font-semibold text-gray-700 dark:text-gray-300">All caught up!</p>
                      <p className="text-[11px] mt-0.5">No notifications right now.</p>
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleNotificationClick(n)}
                        className={`py-3 px-2 rounded-xl transition-all cursor-pointer flex items-start justify-between gap-3 group ${
                          n.read
                            ? "opacity-75 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                            : "bg-forest-50/30 dark:bg-forest-950/30 hover:bg-forest-50/70 dark:hover:bg-forest-950/60"
                        }`}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className="mt-0.5 p-1.5 rounded-xl bg-white dark:bg-gray-800 shadow-xs border border-gray-100 dark:border-gray-700 shrink-0">
                            {getNotifIcon(n.type)}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <p className={`text-xs font-bold truncate ${n.read ? "text-gray-700 dark:text-gray-300" : "text-gray-900 dark:text-gray-100"}`}>
                                {n.title}
                              </p>
                              {!n.read && (
                                <span className="w-1.5 h-1.5 rounded-full bg-forest-600 dark:bg-forest-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium mt-1 inline-block">
                              {formatTimeAgo(n.createdAt)}
                            </span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteNotification(e, n._id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-500 rounded-lg transition-all"
                          title="Dismiss notification"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                {notifications.length > 0 && (
                  <div className="pt-2.5 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between text-[11px]">
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="font-medium text-gray-400 hover:text-red-600 transition-colors"
                    >
                      Clear all
                    </button>
                    <Link
                      href="/settings"
                      onClick={() => setShowNotifications(false)}
                      className="font-bold text-forest-700 dark:text-forest-400 hover:underline"
                    >
                      Notification Settings
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {user?.avatar ? (
                  <span className="text-base leading-none select-none">{user.avatar}</span>
                ) : (
                  initials
                )}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-gray-400 dark:text-gray-500 font-medium leading-none">Hello,</p>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
              </div>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-elevated border border-gray-100 dark:border-gray-800 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-800 mb-1">
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-forest-900 dark:hover:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950/60 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile & Preferences
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-forest-900 dark:hover:text-forest-300 hover:bg-forest-50 dark:hover:bg-forest-950/60 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
