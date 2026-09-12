"use client";

import React from "react";
import { Modal } from "../ui/Modal";
import { HabitIcon } from "../ui/HabitIcon";
import {
  Flame,
  Trophy,
  CheckCircle2,
  Calendar as CalendarIcon,
  Archive,
  Trash2,
  Edit,
  Clock,
} from "lucide-react";

interface HabitDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: any;
  onEdit: (habit: any) => void;
  onArchive: (habit: any) => void;
  onDelete: (habit: any) => void;
}

export function HabitDetailModal({
  isOpen,
  onClose,
  habit,
  onEdit,
  onArchive,
  onDelete,
}: HabitDetailModalProps) {
  if (!habit) return null;

  const stats = habit.stats || {
    currentStreak: 0,
    bestStreak: 0,
    completionRate: 0,
    totalCompletions: 0,
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={habit.name}
      description={habit.description || "Habit Overview & Historical Performance"}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Habit Header & Badge */}
        <div className="flex items-center gap-4 p-4 rounded-2xl bg-gray-50/80 border border-gray-100">
          <HabitIcon name={habit.icon} color={habit.color} size="lg" />
          <div className="flex-1 min-w-0">
            <h4 className="text-base font-bold text-gray-900 truncate">{habit.name}</h4>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span className="capitalize font-medium">{habit.frequency?.replace("_", " ")}</span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                {habit.schedule?.time || "Anytime"}
              </span>
              <span>•</span>
              <span>Started {habit.startDate}</span>
            </div>
          </div>
          {habit.archived && (
            <span className="px-2.5 py-1 text-xs font-bold rounded-full bg-gray-200 text-gray-700">
              Archived
            </span>
          )}
        </div>

        {/* 4 Performance Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-orange-50/60 border border-orange-100 rounded-2xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-2">
              <Flame className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Current Streak</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{stats.currentStreak} d</p>
          </div>

          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
              <Trophy className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Best Streak</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{stats.bestStreak} d</p>
          </div>

          <div className="bg-forest-50/60 border border-forest-100 rounded-2xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mx-auto mb-2">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Completion Rate</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{stats.completionRate}%</p>
          </div>

          <div className="bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5 text-center">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-2">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <p className="text-xs text-gray-500 font-medium">Total Done</p>
            <p className="text-xl font-black text-gray-900 mt-0.5">{stats.totalCompletions}</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-semibold text-gray-600">
            <span>Overall Consistency</span>
            <span>{stats.completionRate}%</span>
          </div>
          <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 bg-forest-600"
              style={{ width: `${stats.completionRate}%` }}
            />
          </div>
        </div>

        {/* Reminder note if present */}
        {habit.reminder && (
          <div className="p-3 bg-gray-50 rounded-xl text-xs text-gray-600 border border-gray-200">
            <span className="font-bold text-gray-800">Reminder Note: </span>
            {habit.reminder}
          </div>
        )}

        {/* Actions Bar */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              onClose();
              onDelete(habit);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete Habit
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onArchive(habit);
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-gray-200 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              <Archive className="w-4 h-4" />
              {habit.archived ? "Restore" : "Archive"}
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onEdit(habit);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-forest-700 hover:bg-forest-800 text-xs font-semibold text-white shadow-sm transition-all hover:shadow"
            >
              <Edit className="w-4 h-4" />
              Edit Habit
            </button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
