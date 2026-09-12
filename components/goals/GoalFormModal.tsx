"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../ui/Modal";
import { HabitIcon, ICON_MAP } from "../ui/HabitIcon";
import { Check, Info, Sparkles } from "lucide-react";

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  initialHabitId?: string;
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
  "target",
  "flame",
  "book-open",
  "book",
  "activity",
  "droplet",
  "moon",
  "brain",
  "dumbbell",
  "laptop",
  "code",
  "sparkles",
  "coffee",
  "clock",
  "heart",
];

export function GoalFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  initialHabitId,
}: GoalFormModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<string>("habit_completion");
  const [trackingMode, setTrackingMode] = useState<"automatic" | "manual">("automatic");
  const [targetValue, setTargetValue] = useState<number>(30);
  const [unit, setUnit] = useState("completions");
  const [startDate, setStartDate] = useState(new Date().toISOString().split("T")[0]);
  const [endDate, setEndDate] = useState("");
  const [selectedHabitIds, setSelectedHabitIds] = useState<string[]>([]);
  const [icon, setIcon] = useState("target");
  const [color, setColor] = useState("#1B4332");
  const [userHabits, setUserHabits] = useState<any[]>([]);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Fetch user habits when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch("/api/habits?filter=active")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setUserHabits(data.habits || []);
          }
        })
        .catch((err) => console.error("Failed to load habits for goal form:", err));
    }
  }, [isOpen]);

  // Set default end date (30 days from today) if not set
  const getDefaultEndDate = (start: string) => {
    const d = new Date(start);
    d.setDate(d.getDate() + 30);
    return d.toISOString().split("T")[0];
  };

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setType(initialData.type || "habit_completion");
      setTrackingMode(initialData.trackingMode || "automatic");
      setTargetValue(initialData.targetValue || 30);
      setUnit(initialData.unit || "completions");
      setStartDate(initialData.startDate || new Date().toISOString().split("T")[0]);
      setEndDate(initialData.endDate || getDefaultEndDate(new Date().toISOString().split("T")[0]));
      setIcon(initialData.icon || "target");
      setColor(initialData.color || "#1B4332");

      const habitIds =
        initialData.habitIds && initialData.habitIds.length > 0
          ? initialData.habitIds.map((h: any) => (typeof h === "object" ? h._id : h))
          : initialData.associatedHabitIds && initialData.associatedHabitIds.length > 0
          ? initialData.associatedHabitIds.map((h: any) => (typeof h === "object" ? h._id : h))
          : [];
      setSelectedHabitIds(habitIds);
    } else {
      const today = new Date().toISOString().split("T")[0];
      setTitle("");
      setDescription("");
      setType("habit_completion");
      setTrackingMode("automatic");
      setTargetValue(30);
      setUnit("completions");
      setStartDate(today);
      setEndDate(getDefaultEndDate(today));
      setIcon("target");
      setColor("#1B4332");
      setSelectedHabitIds(initialHabitId ? [initialHabitId] : []);
    }
    setErrors({});
  }, [initialData, initialHabitId, isOpen]);

  // Smart defaults when changing goal type
  const handleTypeChange = (newType: string) => {
    setType(newType);

    if (newType === "consistency") {
      setTargetValue(30);
      setUnit("days");
      setTrackingMode("automatic");
    } else if (newType === "weekly_frequency") {
      setTargetValue(3);
      setUnit("times/week");
      setTrackingMode("automatic");
    } else if (newType === "habit_completion") {
      setTargetValue(30);
      setUnit("completions");
      setTrackingMode("automatic");
    } else if (newType === "custom") {
      setTargetValue(5);
      setUnit("books");
      // If user has no habits linked, default to manual
      if (selectedHabitIds.length === 0) {
        setTrackingMode("manual");
      }
    }
  };

  const toggleHabitSelection = (habitId: string) => {
    if (selectedHabitIds.includes(habitId)) {
      setSelectedHabitIds(selectedHabitIds.filter((id) => id !== habitId));
    } else {
      setSelectedHabitIds([...selectedHabitIds, habitId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const newErrors: Record<string, string> = {};
    if (!title.trim()) {
      newErrors.title = "Goal title is required";
    }
    if (!targetValue || targetValue <= 0) {
      newErrors.targetValue = "Target value must be greater than 0";
    }
    if (!startDate) {
      newErrors.startDate = "Start date is required";
    }
    if (!endDate) {
      newErrors.endDate = "End date is required";
    } else if (endDate < startDate) {
      newErrors.endDate = "End date cannot be before start date";
    }

    if (type !== "custom" && selectedHabitIds.length === 0) {
      newErrors.habits = "Please connect at least one habit to this goal";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        type,
        trackingMode: type === "custom" && selectedHabitIds.length === 0 ? "manual" : trackingMode,
        targetValue: Number(targetValue),
        unit: unit.trim() || "completions",
        startDate,
        endDate,
        habitIds: selectedHabitIds,
        associatedHabitIds: selectedHabitIds,
        icon,
        color,
      };

      const url = initialData ? `/api/goals/${initialData._id}` : "/api/goals";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setErrors({ form: data.message || "Failed to save goal" });
        setIsLoading(false);
        return;
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrors({ form: "An unexpected error occurred while saving the goal" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={initialData ? "Edit Goal" : "Create New Goal"}
      description={
        initialData
          ? "Update your goal targets, deadline, or linked habits."
          : "Turn your daily routines into measurable milestones and track automatic progress."
      }
      maxWidth="xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {errors.form && (
          <div className="p-3 bg-red-50 text-red-700 text-xs font-semibold rounded-xl border border-red-200">
            {errors.form}
          </div>
        )}

        {/* Goal Title */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Goal Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g., Maintain a 30-day study streak, Read 5 books..."
            className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all"
            required
          />
          {errors.title && <p className="text-xs text-red-600 mt-1">{errors.title}</p>}
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
            Description (Optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Why is this goal important? What is your strategy?"
            className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none transition-all resize-none"
          />
        </div>

        {/* Goal Type Selector */}
        <div>
          <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
            Goal Type
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {[
              {
                id: "habit_completion",
                label: "Habit Completion",
                desc: "Total completion count",
              },
              {
                id: "consistency",
                label: "Consistency",
                desc: "Distinct streak days",
              },
              {
                id: "weekly_frequency",
                label: "Weekly Frequency",
                desc: "Target times / week",
              },
              {
                id: "custom",
                label: "Custom Goal",
                desc: "Flexible or manual",
              },
            ].map((t) => {
              const isSelected = type === t.id;
              return (
                <button
                  type="button"
                  key={t.id}
                  onClick={() => handleTypeChange(t.id)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-forest-600 bg-forest-50/60 ring-2 ring-forest-600/20"
                      : "border-gray-200 bg-white hover:bg-gray-50/80"
                  }`}
                >
                  <p
                    className={`text-xs font-bold ${
                      isSelected ? "text-forest-900" : "text-gray-800"
                    }`}
                  >
                    {t.label}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Habit Linking Section */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider">
              Link Habits {type !== "custom" && "*"}
            </label>
            <span className="text-[11px] text-gray-400 font-medium">
              {selectedHabitIds.length} habit{selectedHabitIds.length === 1 ? "" : "s"} linked
            </span>
          </div>

          {userHabits.length === 0 ? (
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 text-xs text-gray-500 flex items-center gap-2">
              <Info className="w-4 h-4 text-gray-400 shrink-0" />
              <span>
                No active habits found. You can create a habit first or track this goal manually.
              </span>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1 bg-gray-50/50 rounded-xl border border-gray-200">
              {userHabits.map((h) => {
                const isChecked = selectedHabitIds.includes(h._id);
                return (
                  <button
                    type="button"
                    key={h._id}
                    onClick={() => toggleHabitSelection(h._id)}
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-left transition-all ${
                      isChecked
                        ? "bg-forest-50/80 border-forest-300 ring-1 ring-forest-600/30 shadow-xs"
                        : "bg-white border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <HabitIcon name={h.icon} color={h.color} size="sm" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{h.name}</p>
                        <p className="text-[10px] text-gray-400 capitalize truncate">
                          {h.frequency?.replace("_", " ")}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center border transition-all ${
                        isChecked
                          ? "bg-forest-700 border-forest-700 text-white"
                          : "border-gray-300 bg-white"
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          {errors.habits && <p className="text-xs text-red-600 mt-1">{errors.habits}</p>}
        </div>

        {/* Tracking Mode Notice (if custom) */}
        {type === "custom" && (
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-blue-600 shrink-0" />
              <span className="text-blue-900 font-medium">
                {selectedHabitIds.length > 0
                  ? "Automatically tracked using linked habits."
                  : "Manually tracked goal (update progress directly on the goal page)."}
              </span>
            </div>
            {selectedHabitIds.length === 0 && (
              <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full uppercase">
                Manual Mode
              </span>
            )}
          </div>
        )}

        {/* Target and Unit */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Target Value *
            </label>
            <input
              type="number"
              min={1}
              value={targetValue}
              onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
              required
            />
            {errors.targetValue && <p className="text-xs text-red-600 mt-1">{errors.targetValue}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Unit *
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. days, times, books, hours"
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
              required
            />
          </div>
        </div>

        {/* Start Date & End Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Start Date *
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
              required
            />
            {errors.startDate && <p className="text-xs text-red-600 mt-1">{errors.startDate}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              End Date / Deadline *
            </label>
            <input
              type="date"
              value={endDate}
              min={startDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 focus:bg-white focus:border-forest-600 focus:ring-2 focus:ring-forest-600/20 outline-none"
              required
            />
            {errors.endDate && <p className="text-xs text-red-600 mt-1">{errors.endDate}</p>}
          </div>
        </div>

        {/* Icon & Color Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Goal Icon
            </label>
            <div className="grid grid-cols-7 gap-1.5 max-h-28 overflow-y-auto p-1.5 bg-gray-50 rounded-xl border border-gray-200">
              {PRESET_ICONS.map((ic) => (
                <button
                  type="button"
                  key={ic}
                  onClick={() => setIcon(ic)}
                  className={`p-1.5 rounded-lg flex items-center justify-center transition-all ${
                    icon === ic
                      ? "bg-white shadow-sm ring-2 ring-forest-700 text-forest-700"
                      : "text-gray-500 hover:bg-white hover:text-gray-900"
                  }`}
                >
                  <HabitIcon name={ic} size="sm" color={icon === ic ? color : "#64748B"} />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
              Color Accent
            </label>
            <div className="flex flex-wrap gap-2 p-2 bg-gray-50 rounded-xl border border-gray-200">
              {PRESET_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full transition-transform ${
                    color === c
                      ? "scale-110 ring-2 ring-offset-2 ring-gray-900"
                      : "hover:scale-105"
                  }`}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-sm font-semibold text-white shadow-sm transition-all hover:shadow hover:-translate-y-0.5 disabled:opacity-50"
          >
            {isLoading ? "Saving..." : initialData ? "Update Goal" : "Create Goal"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
