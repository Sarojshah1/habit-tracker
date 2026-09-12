"use client";

import React, { useState, useEffect, useRef } from "react";
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
  X,
} from "lucide-react";

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
  } | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

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
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-gray-100/90 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Menu Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Search Field */}
        <div ref={searchRef} className="relative flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchResults) setShowSearchDropdown(true);
              }}
              placeholder="Search habits, notes, goals..."
              className="w-full pl-9 pr-8 py-2 text-sm bg-gray-50/80 border border-gray-200/80 rounded-xl focus:bg-white focus:border-forest-500 focus:ring-2 focus:ring-forest-500/20 transition-all outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setShowSearchDropdown(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Results Dropdown */}
          {showSearchDropdown && searchResults && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-white rounded-2xl shadow-elevated border border-gray-100 p-2 z-50 max-h-96 overflow-y-auto">
              {isSearching ? (
                <div className="p-4 text-center text-xs text-gray-400">Searching...</div>
              ) : searchResults.habits.length === 0 &&
                searchResults.notes.length === 0 &&
                searchResults.goals.length === 0 ? (
                <div className="p-4 text-center text-xs text-gray-400">
                  No matching habits, notes, or goals found.
                </div>
              ) : (
                <div className="space-y-3 p-1">
                  {searchResults.habits.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1">
                        Habits
                      </p>
                      {searchResults.habits.map((item) => (
                        <Link
                          key={item.id}
                          href={`/habits`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 text-gray-800 hover:text-forest-900 transition-colors text-sm"
                        >
                          <CheckCircle2 className="w-4 h-4 text-forest-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.notes.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1">
                        Notes
                      </p>
                      {searchResults.notes.map((item) => (
                        <Link
                          key={item.id}
                          href={`/notes`}
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 text-gray-800 hover:text-forest-900 transition-colors text-sm"
                        >
                          <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {searchResults.goals.length > 0 && (
                    <div>
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2.5 py-1">
                        Goals
                      </p>
                      {searchResults.goals.map((item) => (
                        <Link
                          key={item.id}
                          href="/dashboard"
                          onClick={() => setShowSearchDropdown(false)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-forest-50 text-gray-800 hover:text-forest-900 transition-colors text-sm"
                        >
                          <Flame className="w-4 h-4 text-orange-500 shrink-0" />
                          <div className="truncate">
                            <p className="font-semibold truncate">{item.title}</p>
                            <p className="text-xs text-gray-400 truncate">{item.subtitle}</p>
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

        {/* Right Actions: Notifications & Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Notifications Dropdown */}
          <div ref={notifRef} className="relative">
            <button
              type="button"
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-xl text-gray-500 hover:text-gray-800 hover:bg-gray-100 transition-colors"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-forest-600 ring-2 ring-white" />
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-elevated border border-gray-100 p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="text-sm font-bold text-gray-900">Notifications</h4>
                  <span className="text-[11px] font-semibold text-forest-700 bg-forest-50 px-2 py-0.5 rounded-full">
                    3 new
                  </span>
                </div>
                <div className="divide-y divide-gray-50 max-h-64 overflow-y-auto">
                  <div className="py-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-forest-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">12-Day Streak Milestone!</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          You’ve maintained consistency for 12 straight days. Keep it up!
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Study Reminder</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          Scheduled for today: Study for 2 hours.
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="py-2.5">
                    <div className="flex items-start gap-2.5">
                      <div className="w-2 h-2 rounded-full bg-orange-500 mt-1.5 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-gray-800">Focus Session Logged</p>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                          50-minute deep work session successfully completed.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div ref={profileRef} className="relative">
            <button
              type="button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2.5 p-1 sm:px-2 sm:py-1.5 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                {initials}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs text-gray-400 font-medium leading-none">Hello,</p>
                <p className="text-sm font-bold text-gray-900 leading-tight truncate max-w-[120px]">
                  {displayName}
                </p>
              </div>
              <ChevronDown className="hidden sm:block w-4 h-4 text-gray-400" />
            </button>

            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-elevated border border-gray-100 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2 border-b border-gray-100 mb-1">
                  <p className="text-sm font-bold text-gray-900 truncate">{displayName}</p>
                  <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                </div>
                <div className="space-y-0.5">
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400" />
                    Profile & Preferences
                  </Link>
                  <Link
                    href="/settings"
                    onClick={() => setShowProfileMenu(false)}
                    className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-gray-700 hover:text-forest-900 hover:bg-forest-50 rounded-xl transition-colors"
                  >
                    <Settings className="w-4 h-4 text-gray-400" />
                    Account Settings
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors text-left"
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
