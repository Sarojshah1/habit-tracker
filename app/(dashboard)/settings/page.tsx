"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Bell,
  Sun,
  Sliders,
  ShieldAlert,
  Download,
  Trash2,
  Check,
  Globe,
  Clock,
  LogOut,
} from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "appearance" | "habits" | "privacy"
  >("profile");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Notifications
  const [notifications, setNotifications] = useState({
    habitReminders: true,
    dailySummary: true,
    streakReminders: true,
    goalReminders: true,
    focusNotifications: true,
  });

  // Appearance
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("light");

  // Habit Preferences
  const [habitPreferences, setHabitPreferences] = useState({
    defaultReminderTime: "08:00",
    weekStartsOn: "monday",
    defaultHabitView: "list",
  });

  // Account deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      if (data.success) {
        setName(data.profile.name || "");
        setEmail(data.profile.email || "");
        setTimezone(data.profile.timezone || "UTC");
        setLanguage(data.profile.language || "en");
        if (data.preferences) {
          if (data.preferences.notifications) setNotifications(data.preferences.notifications);
          if (data.preferences.appearance) setAppearance(data.preferences.appearance);
          if (data.preferences.habitPreferences) setHabitPreferences(data.preferences.habitPreferences);
        }
      }
    } catch (err) {
      console.error("Settings load error:", err);
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name: name.trim(),
            timezone,
            language,
          },
          preferences: {
            notifications,
            appearance,
            habitPreferences,
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || "Failed to save settings");
      } else {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setError("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = () => {
    window.open("/api/settings/export", "_blank");
  };

  const handleDeleteAccountConfirm = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch("/api/settings/delete-account", {
        method: "DELETE",
      });
      if (res.ok) {
        router.push("/login");
        router.refresh();
      }
    } catch (err) {
      console.error("Delete account error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <LoadingSkeleton count={3} />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Manage your account profile, study preferences, and data privacy.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl text-xs font-bold text-forest-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-forest-700" />
          Settings successfully saved!
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-700">
          {error}
        </div>
      )}

      {/* Main Settings Grid: Navigation (3 cols) & Tab Contents (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Settings Navigation Sidebar (3 cols) */}
        <div className="lg:col-span-3 space-y-1">
          <button
            type="button"
            onClick={() => setActiveTab("profile")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "profile"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <User className="w-4 h-4" />
            Profile Information
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "notifications"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <Bell className="w-4 h-4" />
            Notification Alerts
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "appearance"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <Sun className="w-4 h-4" />
            Appearance &amp; Theme
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("habits")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "habits"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <Sliders className="w-4 h-4" />
            Habit Preferences
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("privacy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "privacy"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <ShieldAlert className="w-4 h-4" />
            Data &amp; Privacy
          </button>
        </div>

        {/* Tab Content Panels (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Profile Information</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Update your display name, timezone, and language.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email cannot be changed directly for account security.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Timezone (Used for daily streaks &amp; calendar boundaries)
                  </label>
                  <input
                    type="text"
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">
                    Standard IANA format (e.g. UTC, America/New_York, Asia/Kathmandu).
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Language
                  </label>
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Español</option>
                    <option value="fr">Français</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Notification Alerts</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Configure when and how HabitTrack nudges your daily routines.
                </p>
              </div>

              <div className="space-y-4 pt-2 divide-y divide-gray-100">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Habit Reminders</p>
                    <p className="text-xs text-gray-500">Get scheduled alerts for pending habits.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.habitReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, habitReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Daily Summary</p>
                    <p className="text-xs text-gray-500">Morning and evening completion briefings.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.dailySummary}
                    onChange={(e) =>
                      setNotifications({ ...notifications, dailySummary: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Streak Milestones</p>
                    <p className="text-xs text-gray-500">Alerts when hitting 7, 14, or 30-day streaks.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.streakReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, streakReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Focus Session Alerts</p>
                    <p className="text-xs text-gray-500">Notifications when Pomodoro timers finish.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.focusNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, focusNotifications: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700"
                  />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Appearance</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  HabitTrack uses a sophisticated forest green light theme designed for calm productivity.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => setAppearance("light")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    appearance === "light"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-3">
                    <Sun className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">Light Forest (Default)</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Clean, bright, calm study interface.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setAppearance("dark")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all opacity-80 ${
                    appearance === "dark"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-200 text-gray-800 flex items-center justify-center mb-3">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">Dark Accent</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">High-contrast night study mode.</p>
                </button>

                <button
                  type="button"
                  onClick={() => setAppearance("system")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    appearance === "system"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-3">
                    <Globe className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">System Sync</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Matches your OS theme preferences.</p>
                </button>
              </div>
            </div>
          )}

          {/* HABIT PREFERENCES TAB */}
          {activeTab === "habits" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Habit Preferences</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Configure default schedules and display settings.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Default Reminder Time
                  </label>
                  <input
                    type="time"
                    value={habitPreferences.defaultReminderTime}
                    onChange={(e) =>
                      setHabitPreferences({
                        ...habitPreferences,
                        defaultReminderTime: e.target.value,
                      })
                    }
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-forest-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Week Starts On
                  </label>
                  <select
                    value={habitPreferences.weekStartsOn}
                    onChange={(e) =>
                      setHabitPreferences({
                        ...habitPreferences,
                        weekStartsOn: e.target.value,
                      })
                    }
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-forest-600"
                  >
                    <option value="monday">Monday</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PRIVACY & DATA TAB */}
          {activeTab === "privacy" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Data &amp; Privacy</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Export all your historical data or permanently remove your account.
                </p>
              </div>

              <div className="space-y-6 pt-2">
                {/* Export Data */}
                <div className="p-5 rounded-2xl bg-gray-50 border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-gray-900">Export Personal Data</h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Download a complete JSON export of all your habits, completions, goals, focus sessions, and notes.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-xs font-bold text-gray-700 shadow-xs transition-colors shrink-0"
                  >
                    <Download className="w-4 h-4" />
                    Export Data (JSON)
                  </button>
                </div>

                {/* Delete Account */}
                <div className="p-5 rounded-2xl bg-red-50/50 border border-red-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h4 className="text-sm font-bold text-red-900">Delete Account</h4>
                    <p className="text-xs text-red-700/80 mt-0.5">
                      Permanently delete your profile, all habits, streaks, focus history, and notes. This cannot be undone.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-xs font-bold text-white shadow-xs transition-colors shrink-0"
                  >
                    <Trash2 className="w-4 h-4" />
                    Delete Account
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Save Button Bar */}
          {activeTab !== "privacy" && (
            <div className="pt-6 mt-8 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Dialog */}
      <ConfirmDialog
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccountConfirm}
        title="Permanently Delete Account"
        message="Are you completely sure? This will immediately purge all your habits, streaks, focus logs, and notes from our database. You will be signed out immediately."
        confirmText="Yes, Permanently Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
