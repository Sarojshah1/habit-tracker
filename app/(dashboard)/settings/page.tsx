"use client";

import React, { useState, useEffect, useCallback } from "react";
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
  KeyRound,
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  Smartphone,
  Send,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

const PRESET_AVATARS = [
  "🎓", "📚", "🚀", "⚡", "🎯", "🌿", "🧠", "💻", "🎨", "🔬", "🏆", "⭐", "☕", "🦉", "💡", "🔥"
];

const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Toronto",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Karachi",
  "Asia/Kolkata",
  "Asia/Kathmandu",
  "Asia/Dhaka",
  "Asia/Bangkok",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export default function SettingsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<
    "profile" | "notifications" | "appearance" | "habits" | "productivity" | "security" | "privacy"
  >("profile");

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState("");

  // Profile fields
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [avatar, setAvatar] = useState("");
  const [timezone, setTimezone] = useState("UTC");
  const [language, setLanguage] = useState("en");

  // Notifications
  const [notifications, setNotifications] = useState({
    habitReminders: true,
    taskReminders: true,
    dailySummary: true,
    streakReminders: true,
    goalReminders: true,
    focusNotifications: true,
    dailyReview: true,
    weeklyReview: true,
  });

  // Browser Notifications State
  const [browserNotifPermission, setBrowserNotifPermission] = useState<string>("default");
  const [testNotifSent, setTestNotifSent] = useState(false);

  // Appearance
  const [appearance, setAppearance] = useState<"light" | "dark" | "system">("light");

  // Habit & Task Preferences
  const [habitPreferences, setHabitPreferences] = useState({
    defaultReminderTime: "08:00",
    weekStartsOn: "monday" as "monday" | "sunday",
    defaultHabitView: "list" as "grid" | "list",
  });
  const [defaultDurationMinutes, setDefaultDurationMinutes] = useState(30);

  // Productivity Score Weights
  const [scoreWeights, setScoreWeights] = useState({
    habits: 40,
    tasks: 40,
    focus: 20,
  });

  // Security / Password Change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Account deletion dialog
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Apply theme to DOM
  const applyThemeToDOM = (theme: "light" | "dark" | "system") => {
    if (typeof window === "undefined") return;
    const isDark =
      theme === "dark" ||
      (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (isDark) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("habittrack_theme", theme);
  };

  const fetchSettings = useCallback(async () => {
    try {
      if (typeof window !== "undefined" && "Notification" in window) {
        setBrowserNotifPermission(Notification.permission);
      }

      const res = await fetch("/api/settings");
      if (!res.ok) throw new Error("Failed to load settings");
      const data = await res.json();
      if (data.success) {
        setName(data.profile.name || "");
        setEmail(data.profile.email || "");
        setAvatar(data.profile.avatar || "");
        setTimezone(data.profile.timezone || "UTC");
        setLanguage(data.profile.language || "en");

        if (data.preferences) {
          if (data.preferences.notifications) {
            setNotifications((prev) => ({
              ...prev,
              ...data.preferences.notifications,
            }));
          }
          if (data.preferences.appearance) {
            setAppearance(data.preferences.appearance);
            applyThemeToDOM(data.preferences.appearance);
          }
          if (data.preferences.habitPreferences) {
            setHabitPreferences((prev) => ({
              ...prev,
              ...data.preferences.habitPreferences,
            }));
          }
          if (data.preferences.taskDefaults?.defaultDurationMinutes) {
            setDefaultDurationMinutes(data.preferences.taskDefaults.defaultDurationMinutes);
          }
          if (data.preferences.productivityScoreWeights) {
            setScoreWeights(data.preferences.productivityScoreWeights);
          }
        }
      }
    } catch (err) {
      console.error("Settings load error:", err);
      setError("Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const handleAppearanceChange = (newTheme: "light" | "dark" | "system") => {
    setAppearance(newTheme);
    applyThemeToDOM(newTheme);
  };

  const handleDetectTimezone = () => {
    try {
      const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (detected) {
        setTimezone(detected);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 2000);
      }
    } catch (err) {
      console.error("Timezone detect error:", err);
    }
  };

  const handleRequestBrowserNotifications = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      alert("Browser notifications are not supported by your current browser.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserNotifPermission(permission);
      if (permission === "granted") {
        new Notification("HabitTrack Alerts Enabled! 🎉", {
          body: "You will now receive alerts for study habits, task deadlines, and focus sessions.",
          icon: "/favicon.ico",
        });
      }
    } catch (err) {
      console.error("Notification permission error:", err);
    }
  };

  const handleSendTestNotification = async () => {
    try {
      setTestNotifSent(true);

      // 1. Browser Native Notification if allowed
      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification("HabitTrack Test Notification", {
          body: "Your study alerts and habit streaks are active and working smoothly!",
          icon: "/favicon.ico",
        });
      }

      // 2. In-App Notification record
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "🔔 Test Notification Received",
          message: "All notification systems are working properly on your HabitTrack account.",
          type: "system",
        }),
      });

      setTimeout(() => setTestNotifSent(false), 3000);
    } catch (err) {
      console.error("Test notification error:", err);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);
    setError("");

    // Validate weights sum
    const totalWeights = (scoreWeights.habits || 0) + (scoreWeights.tasks || 0) + (scoreWeights.focus || 0);
    if (totalWeights !== 100) {
      setError(`Productivity weights must total exactly 100% (currently ${totalWeights}%).`);
      setIsSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          profile: {
            name: name.trim(),
            avatar,
            timezone,
            language,
          },
          preferences: {
            notifications,
            appearance,
            habitPreferences,
            taskDefaults: {
              defaultDurationMinutes: Number(defaultDurationMinutes) || 30,
            },
            productivityScoreWeights: scoreWeights,
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({ type: "error", text: "Please fill in all password fields." });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: "error", text: "New password must be at least 8 characters long." });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: "error", text: "New passwords do not match." });
      return;
    }

    setIsChangingPassword(true);
    try {
      const res = await fetch("/api/settings/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword, confirmPassword }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setPasswordMessage({ type: "success", text: "Password changed successfully!" });
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
      } else {
        setPasswordMessage({ type: "error", text: data.message || "Failed to change password." });
      }
    } catch (err) {
      setPasswordMessage({ type: "error", text: "A network error occurred. Please try again." });
    } finally {
      setIsChangingPassword(false);
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

  const totalWeights = (scoreWeights.habits || 0) + (scoreWeights.tasks || 0) + (scoreWeights.focus || 0);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">Settings</h1>
        <p className="text-sm text-gray-500 mt-1 font-medium">
          Customize your student profile, alerts, study preferences, and privacy controls.
        </p>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-forest-50 border border-forest-200 rounded-2xl text-xs font-bold text-forest-800 flex items-center gap-2 animate-in fade-in duration-200">
          <Check className="w-4 h-4 text-forest-700" />
          Settings successfully saved and synchronized!
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
            Profile & Avatar
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
            Notifications & Alerts
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
            Appearance & Theme
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
            Habits & Study Defaults
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("productivity")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "productivity"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <Zap className="w-4 h-4" />
            Productivity Weights
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all text-left ${
              activeTab === "security"
                ? "bg-forest-700 text-white shadow-xs"
                : "text-gray-600 hover:bg-white hover:text-gray-900"
            }`}
          >
            <KeyRound className="w-4 h-4" />
            Account Security
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
            Data & Privacy
          </button>
        </div>

        {/* Tab Content Panels (9 cols) */}
        <div className="lg:col-span-9 bg-white rounded-3xl border border-gray-100 p-6 sm:p-8 shadow-sm">
          {/* PROFILE TAB */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Student Profile</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Update your display name, personalized avatar, timezone, and language.
                </p>
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Choose Your Student Avatar
                </label>
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  {PRESET_AVATARS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setAvatar(emoji)}
                      className={`w-11 h-11 text-xl rounded-2xl flex items-center justify-center transition-all ${
                        avatar === emoji
                          ? "bg-forest-100 border-2 border-forest-600 shadow-xs scale-105"
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                  {avatar && (
                    <button
                      type="button"
                      onClick={() => setAvatar("")}
                      className="px-3 py-2 text-xs font-semibold text-gray-400 hover:text-gray-700 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                      Use Initials
                    </button>
                  )}
                </div>
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
                    placeholder="e.g. Alex Morgan"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Email Address
                  </label>
                  <div className="flex items-center gap-2 max-w-md">
                    <input
                      type="email"
                      value={email}
                      disabled
                      className="flex-1 px-3.5 py-2.5 bg-gray-100 border border-gray-200 rounded-xl text-sm text-gray-500 cursor-not-allowed outline-none"
                    />
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-[11px] font-bold rounded-lg shrink-0">
                      Verified
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Email cannot be changed directly to prevent unauthorized access.
                  </p>
                </div>

                <div>
                  <div className="flex items-center justify-between max-w-md mb-1.5">
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Timezone
                    </label>
                    <button
                      type="button"
                      onClick={handleDetectTimezone}
                      className="text-[11px] font-bold text-forest-700 hover:text-forest-800 hover:underline inline-flex items-center gap-1"
                    >
                      <Globe className="w-3 h-3" />
                      Auto-detect My Timezone
                    </button>
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 outline-none"
                  >
                    {!COMMON_TIMEZONES.includes(timezone) && (
                      <option value={timezone}>{timezone} (Custom)</option>
                    )}
                    {COMMON_TIMEZONES.map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-gray-400 mt-1">
                    Controls midnight habit resets, streak boundaries, and day schedule views.
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
                    <option value="de">Deutsch</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* NOTIFICATIONS TAB */}
          {activeTab === "notifications" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Notifications &amp; Alerts</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Configure real-time push and in-app alerts so you never break a study routine.
                </p>
              </div>

              {/* Native Browser Notification Banner */}
              <div className="p-5 rounded-2xl bg-forest-50/60 border border-forest-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-forest-700" />
                    <h4 className="text-sm font-bold text-forest-900">Browser Desktop Notifications</h4>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                        browserNotifPermission === "granted"
                          ? "bg-emerald-100 text-emerald-800"
                          : browserNotifPermission === "denied"
                          ? "bg-red-100 text-red-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {browserNotifPermission}
                    </span>
                  </div>
                  <p className="text-xs text-forest-700 mt-1">
                    Receive background alerts when Pomodoro timers finish or when tasks are due.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {browserNotifPermission !== "granted" ? (
                    <button
                      type="button"
                      onClick={handleRequestBrowserNotifications}
                      className="px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-colors shrink-0 shadow-xs"
                    >
                      Enable Browser Alerts
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSendTestNotification}
                      disabled={testNotifSent}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-forest-300 hover:bg-forest-100 text-forest-800 text-xs font-bold transition-colors shrink-0 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      {testNotifSent ? "Sent!" : "Send Test Alert"}
                    </button>
                  )}
                </div>
              </div>

              {/* In-app Notification Toggles */}
              <div className="space-y-4 pt-2 divide-y divide-gray-100">
                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Habit Reminders</p>
                    <p className="text-xs text-gray-500">Scheduled reminders for pending daily habits.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.habitReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, habitReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Task Due Alerts</p>
                    <p className="text-xs text-gray-500">Nudges when priority study tasks are scheduled for today.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.taskReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, taskReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Streak Milestones</p>
                    <p className="text-xs text-gray-500">Celebrations when hitting 3, 7, 14, 21, and 30-day streaks.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.streakReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, streakReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Focus Session Completion</p>
                    <p className="text-xs text-gray-500">Audio and notification alerts when Pomodoro focus rounds end.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.focusNotifications}
                    onChange={(e) =>
                      setNotifications({ ...notifications, focusNotifications: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Goal Milestone Alerts</p>
                    <p className="text-xs text-gray-500">Notifications when you reach goal targets and milestones.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.goalReminders}
                    onChange={(e) =>
                      setNotifications({ ...notifications, goalReminders: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Daily Review Evening Nudge</p>
                    <p className="text-xs text-gray-500">Gentle evening prompt (after 6 PM) to reflect on your daily wins.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.dailyReview}
                    onChange={(e) =>
                      setNotifications({ ...notifications, dailyReview: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-4">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Weekly Planning &amp; Review</p>
                    <p className="text-xs text-gray-500">End-of-week summary and Sunday/Monday planning reminders.</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={notifications.weeklyReview}
                    onChange={(e) =>
                      setNotifications({ ...notifications, weeklyReview: e.target.checked })
                    }
                    className="w-5 h-5 rounded-md accent-forest-700 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}

          {/* APPEARANCE TAB */}
          {activeTab === "appearance" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Appearance &amp; Theme</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Select your interface theme. Updates are applied instantly and persisted to your account.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => handleAppearanceChange("light")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    appearance === "light"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs ring-2 ring-forest-700/20"
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
                  onClick={() => handleAppearanceChange("dark")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    appearance === "dark"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs ring-2 ring-forest-700/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-900 text-gray-100 flex items-center justify-center mb-3">
                    <Clock className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">Dark Accent</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">High-contrast night study mode.</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleAppearanceChange("system")}
                  className={`p-4 rounded-2xl border-2 text-left transition-all ${
                    appearance === "system"
                      ? "border-forest-700 bg-forest-50/40 shadow-xs ring-2 ring-forest-700/20"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-600 flex items-center justify-center mb-3">
                    <Globe className="w-4 h-4" />
                  </div>
                  <p className="text-xs font-bold text-gray-900">System Sync</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">Automatically mirrors your OS theme.</p>
                </button>
              </div>
            </div>
          )}

          {/* HABITS & STUDY DEFAULTS TAB */}
          {activeTab === "habits" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Habit &amp; Task Preferences</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Configure default study schedules, calendar week starts, and focus duration.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Default Habit Reminder Time
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
                  <p className="text-[11px] text-gray-400 mt-1">
                    Pre-filled time when scheduling new daily habits.
                  </p>
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
                        weekStartsOn: e.target.value as "monday" | "sunday",
                      })
                    }
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-forest-600"
                  >
                    <option value="monday">Monday (Academic standard)</option>
                    <option value="sunday">Sunday</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Default Habit View
                  </label>
                  <select
                    value={habitPreferences.defaultHabitView}
                    onChange={(e) =>
                      setHabitPreferences({
                        ...habitPreferences,
                        defaultHabitView: e.target.value as "grid" | "list",
                      })
                    }
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-forest-600"
                  >
                    <option value="list">List View (Compact checklist)</option>
                    <option value="grid">Grid Cards</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Default Focus Block Duration (Minutes)
                  </label>
                  <select
                    value={defaultDurationMinutes}
                    onChange={(e) => setDefaultDurationMinutes(Number(e.target.value))}
                    className="w-full max-w-xs px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:border-forest-600"
                  >
                    <option value={15}>15 minutes (Quick sprint)</option>
                    <option value={25}>25 minutes (Classic Pomodoro)</option>
                    <option value={45}>45 minutes (Lecture block)</option>
                    <option value={50}>50 minutes (Deep study)</option>
                    <option value={60}>60 minutes (1 Hour block)</option>
                    <option value={90}>90 minutes (Ultradian cycle)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* PRODUCTIVITY WEIGHTS TAB */}
          {activeTab === "productivity" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Productivity Score Customization</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  HabitTrack computes your daily productivity score transparently using a weighted formula. Adjust the percentages to fit your personal workflow.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-gray-700">Formula Weights Total</p>
                  <p className="text-[11px] text-gray-400">Sum must equal 100%</p>
                </div>
                <span
                  className={`text-sm font-black px-3 py-1 rounded-xl ${
                    totalWeights === 100
                      ? "bg-forest-100 text-forest-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
                  {totalWeights}%
                </span>
              </div>

              <div className="space-y-4 pt-2">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Daily Habits Weight</span>
                    <span className="text-forest-700">{scoreWeights.habits}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={scoreWeights.habits}
                    onChange={(e) =>
                      setScoreWeights({ ...scoreWeights, habits: Number(e.target.value) })
                    }
                    className="w-full accent-forest-700 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Task Completion Weight</span>
                    <span className="text-forest-700">{scoreWeights.tasks}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={scoreWeights.tasks}
                    onChange={(e) =>
                      setScoreWeights({ ...scoreWeights, tasks: Number(e.target.value) })
                    }
                    className="w-full accent-forest-700 cursor-pointer"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-gray-700 mb-1">
                    <span>Focus Time Target Weight</span>
                    <span className="text-forest-700">{scoreWeights.focus}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={scoreWeights.focus}
                    onChange={(e) =>
                      setScoreWeights({ ...scoreWeights, focus: Number(e.target.value) })
                    }
                    className="w-full accent-forest-700 cursor-pointer"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setScoreWeights({ habits: 40, tasks: 40, focus: 20 })}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-xs font-semibold text-gray-600 transition-colors"
                  >
                    Reset to Recommended (40% / 40% / 20%)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* SECURITY TAB */}
          {activeTab === "security" && (
            <form onSubmit={handleChangePassword} className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Account Security</h3>
                <p className="text-xs text-gray-400 font-medium mt-0.5">
                  Update your password to keep your account and study logs secure.
                </p>
              </div>

              {passwordMessage && (
                <div
                  className={`p-4 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    passwordMessage.type === "success"
                      ? "bg-forest-50 border border-forest-200 text-forest-800"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}
                >
                  {passwordMessage.type === "success" ? (
                    <Check className="w-4 h-4 text-forest-700" />
                  ) : (
                    <Lock className="w-4 h-4 text-red-600" />
                  )}
                  {passwordMessage.text}
                </div>
              )}

              <div className="space-y-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Current Password
                  </label>
                  <div className="relative max-w-md">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-forest-600 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={8}
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-forest-600"
                  />
                  <p className="text-[11px] text-gray-400 mt-1">Minimum 8 characters required.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full max-w-md px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:bg-white focus:border-forest-600"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword}
                    className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                  >
                    {isChangingPassword ? "Changing..." : "Update Password"}
                  </button>
                </div>
              </div>
            </form>
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
                      Download a complete JSON export of all your habits, completions, tasks, goals, focus sessions, time blocks, and notes.
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
                      Permanently delete your profile, all habits, streaks, tasks, schedule blocks, focus history, and notes. This cannot be undone.
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

          {/* Global Save Button Bar (Hidden on Security & Privacy tabs) */}
          {activeTab !== "privacy" && activeTab !== "security" && (
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
        message="Are you completely sure? This will immediately purge all your habits, streaks, focus logs, tasks, and notes from our database. You will be signed out immediately."
        confirmText="Yes, Permanently Delete"
        isDestructive={true}
        isLoading={isDeleting}
      />
    </div>
  );
}
