"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { HabitIcon, ICON_MAP } from "../ui/HabitIcon";

interface HabitFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  availableHabits?: any[];
}

const PRESET_COLORS = [
  "#1B4332", // Forest Green (Primary)
  "#2D6A4F", // Dark Green
  "#40916C", // Soft Green
  "#2563EB", // Blue
  "#7C3AED", // Purple
  "#EA580C", // Orange
  "#0D9488", // Teal
  "#DC2626", // Red
];

const PRESET_ICONS = [
  "check-circle",
  "book-open",
  "book",
  "activity",
  "droplet",
  "moon",
  "brain",
  "dumbbell",
  "laptop",
  "code",
  "target",
  "sparkles",
  "coffee",
  "clock",
];

const DAYS_OF_WEEK = [
  { label: "S", value: 0, full: "Sunday" },
  { label: "M", value: 1, full: "Monday" },
  { label: "T", value: 2, full: "Tuesday" },
  { label: "W", value: 3, full: "Wednesday" },
  { label: "T", value: 4, full: "Thursday" },
  { label: "F", value: 5, full: "Friday" },
  { label: "S", value: 6, full: "Saturday" },
];

export function HabitFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  availableHabits = [],
}: HabitFormModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [icon, setIcon] = useState("check-circle");
  const [color, setColor] = useState("#1B4332");
  const [frequency, setFrequency] = useState<string>("daily");
  const [time, setTime] = useState("08:00");
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timesPerWeek, setTimesPerWeek] = useState(7);
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [reminder, setReminder] = useState("");
  const [habitStackAfterHabitId, setHabitStackAfterHabitId] = useState("");
  const [twoMinuteVersion, setTwoMinuteVersion] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setDescription(initialData.description || "");
      setIcon(initialData.icon || "check-circle");
      setColor(initialData.color || "#1B4332");
      setFrequency(initialData.frequency || "daily");
      setTime(initialData.schedule?.time || "08:00");
      setSelectedDays(initialData.schedule?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6]);
      setTimesPerWeek(initialData.schedule?.timesPerWeek || 7);
      setStartDate(initialData.startDate || new Date().toISOString().split("T")[0]);
      setReminder(initialData.reminder || "");
      setHabitStackAfterHabitId(
        initialData.habitStackAfterHabitId?._id ||
        initialData.habitStackAfterHabitId ||
        ""
      );
      setTwoMinuteVersion(initialData.twoMinuteVersion || "");
    } else {
      setName("");
      setDescription("");
      setIcon("check-circle");
      setColor("#1B4332");
      setFrequency("daily");
      setTime("08:00");
      setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
      setTimesPerWeek(7);
      setStartDate(new Date().toISOString().split("T")[0]);
      setReminder("");
      setHabitStackAfterHabitId("");
      setTwoMinuteVersion("");
    }
    setErrors({});
  }, [initialData, isOpen]);

  const toggleDay = (dayVal: number) => {
    if (selectedDays.includes(dayVal)) {
      if (selectedDays.length > 1) {
        setSelectedDays(selectedDays.filter((d) => d !== dayVal));
      }
    } else {
      setSelectedDays([...selectedDays, dayVal].sort());
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!name.trim()) {
      setErrors({ name: "Habit name is required" });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        icon,
        color,
        frequency,
        schedule: {
          time,
          daysOfWeek: frequency === "specific_days" ? selectedDays : [0, 1, 2, 3, 4, 5, 6],
          timesPerWeek: frequency === "times_per_week" ? timesPerWeek : 7,
        },
        startDate,
        reminder,
        habitStackAfterHabitId: habitStackAfterHabitId || null,
        twoMinuteVersion: twoMinuteVersion.trim(),
      };

      const url = initialData ? `/api/habits/${initialData._id}` : "/api/habits";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ form: data.message || "Failed to save habit" });
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ form: "An unexpected error occurred" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Habit" : "Create New Habit"}
      description={
        initialData
          ? "Update the parameters and schedule of this habit."
          : "Define a consistent daily or weekly routine to boost your productivity."
      }
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {errors.form}
          </div>
        )}

        {/* Habit Name */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Habit Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Study for 2 hours, Read a book..."
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
            required
          />
          {errors.name && <p className="text-xs text-red-600 dark:text-red-400 mt-1">{errors.name}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Why is this habit important to you? What is your routine?"
            className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all resize-none"
          />
        </div>

        {/* Icon & Color Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Icon
            </label>
            <div className="grid grid-cols-7 gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
              {PRESET_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? "bg-white dark:bg-gray-700 shadow-sm ring-2 ring-forest-700 text-forest-700"
                      : "text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100"
                  }`}
                >
                  <HabitIcon name={ic} size="sm" color={icon === ic ? color : "#64748B"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 dark:bg-gray-800/80 rounded-xl border border-gray-200 dark:border-gray-700">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-offset-2 ring-gray-900 dark:ring-gray-100 dark:ring-offset-gray-900"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Frequency & Schedule */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Frequency
            </label>
            <select
              value={frequency}
              onChange={(e) => setFrequency(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
            >
              <option value="daily">Every Day (Daily)</option>
              <option value="specific_days">Specific Days of the Week</option>
              <option value="weekly">Weekly</option>
              <option value="times_per_week">X Times per Week</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Scheduled Time
            </label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
            />
          </div>
        </div>

        {/* Specific Days Picker */}
        {frequency === "specific_days" && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Days of the Week
            </label>
            <div className="flex gap-1.5">
              {DAYS_OF_WEEK.map((d) => {
                const isSelected = selectedDays.includes(d.value);
                return (
                  <button
                    type="button"
                    key={d.value}
                    onClick={() => toggleDay(d.value)}
                    className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all ${
                      isSelected
                        ? "bg-forest-700 text-white shadow-xs"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Times per week */}
        {frequency === "times_per_week" && (
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Target Times per Week: {timesPerWeek}
            </label>
            <input
              type="range"
              min={1}
              max={7}
              value={timesPerWeek}
              onChange={(e) => setTimesPerWeek(Number(e.target.value))}
              className="w-full accent-forest-700"
            />
          </div>
        )}

        {/* Atomic Habits Superpowers */}
        <div className="p-3.5 bg-forest-50/60 dark:bg-forest-950/30 border border-forest-100 dark:border-forest-900/60 rounded-2xl space-y-3.5">
          <div className="flex items-center gap-2">
            <span className="text-sm">⚡</span>
            <span className="text-xs font-bold uppercase tracking-wider text-forest-900 dark:text-forest-200">
              Atomic Habits Enhancements
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Habit Stacking */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                🔗 Stack After Habit (Anchor)
              </label>
              <select
                value={habitStackAfterHabitId}
                onChange={(e) => setHabitStackAfterHabitId(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:border-forest-600 outline-none"
              >
                <option value="">None (Independent)</option>
                {availableHabits
                  .filter((h) => !initialData || h._id !== initialData._id)
                  .map((h) => (
                    <option key={h._id} value={h._id}>
                      After: {h.name}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Trigger this habit immediately after completing the anchor.
              </p>
            </div>

            {/* 2-Minute Rule */}
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                ⚡ 2-Minute / Bad-Day Version
              </label>
              <input
                type="text"
                value={twoMinuteVersion}
                onChange={(e) => setTwoMinuteVersion(e.target.value)}
                placeholder="e.g. Read 1 page, 5 pushups"
                maxLength={120}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100 focus:border-forest-600 outline-none"
              />
              <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                Quick fallback to save your streak on exhausted days.
              </p>
            </div>
          </div>
        </div>

        {/* Start Date & Reminder */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
              Reminder Note (Optional)
            </label>
            <input
              type="text"
              value={reminder}
              onChange={(e) => setReminder(e.target.value)}
              placeholder="e.g. Set alarm, prep desk"
              className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-900 dark:text-gray-100 focus:bg-white dark:focus:bg-gray-800 focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-sm font-semibold text-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : initialData ? "Update Habit" : "Create Habit"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
