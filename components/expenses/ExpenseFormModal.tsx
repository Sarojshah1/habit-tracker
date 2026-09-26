"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Save,
  Utensils,
  ShoppingBag,
  Home,
  Zap,
  GraduationCap,
  Bus,
  Tv,
  HeartPulse,
  Receipt,
  Tag,
  Users,
  Calendar,
  CreditCard,
  CheckCircle2,
} from "lucide-react";
import { format } from "date-fns";

export interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  defaultDate?: string;
  habits?: Array<{ _id: string; name: string; icon?: string }>;
}

export const CATEGORIES = [
  { id: "food_khaja", label: "Food & Khaja", icon: Utensils, color: "text-amber-500 bg-amber-500/10" },
  { id: "groceries", label: "Groceries", icon: ShoppingBag, color: "text-emerald-500 bg-emerald-500/10" },
  { id: "rent", label: "Room Rent", icon: Home, color: "text-rose-500 bg-rose-500/10" },
  { id: "utilities", label: "Utilities (Water/Elec)", icon: Zap, color: "text-cyan-500 bg-cyan-500/10" },
  { id: "college_books", label: "College & Books", icon: GraduationCap, color: "text-indigo-500 bg-indigo-500/10" },
  { id: "transport", label: "Transport", icon: Bus, color: "text-blue-500 bg-blue-500/10" },
  { id: "entertainment", label: "Entertainment", icon: Tv, color: "text-purple-500 bg-purple-500/10" },
  { id: "health", label: "Health & Care", icon: HeartPulse, color: "text-pink-500 bg-pink-500/10" },
  { id: "bills", label: "Bills & Recharge", icon: Receipt, color: "text-orange-500 bg-orange-500/10" },
  { id: "other", label: "Other", icon: Tag, color: "text-gray-500 bg-gray-500/10" },
];

export const PAYMENT_METHODS = [
  { id: "fonepay_esewa", label: "eSewa / Fonepay / QR" },
  { id: "cash", label: "Cash" },
  { id: "bank", label: "Bank Transfer" },
  { id: "card", label: "Card / ATM" },
  { id: "other", label: "Other" },
];

export function ExpenseFormModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  defaultDate,
  habits = [],
}: ExpenseFormModalProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"expense" | "income">("expense");
  const [category, setCategory] = useState("food_khaja");
  const [date, setDate] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("fonepay_esewa");
  const [isEssential, setIsEssential] = useState(false);
  const [habitId, setHabitId] = useState("");

  // Roommate split
  const [hasSplit, setHasSplit] = useState(false);
  const [splitWith, setSplitWith] = useState("");
  const [splitAmount, setSplitAmount] = useState("");
  const [splitStatus, setSplitStatus] = useState<"pending" | "settled">("pending");

  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setTitle(initialData.title || "");
        setAmount(initialData.amount ? String(initialData.amount) : "");
        setType(initialData.type || "expense");
        setCategory(initialData.category || "food_khaja");
        setDate(initialData.date || format(new Date(), "yyyy-MM-dd"));
        setPaymentMethod(initialData.paymentMethod || "fonepay_esewa");
        setIsEssential(Boolean(initialData.isEssential));
        setHabitId(
          typeof initialData.habitId === "object"
            ? initialData.habitId?._id || ""
            : initialData.habitId || ""
        );
        setHasSplit(Boolean(initialData.splitWith));
        setSplitWith(initialData.splitWith || "");
        setSplitAmount(initialData.splitAmount ? String(initialData.splitAmount) : "");
        setSplitStatus(initialData.splitStatus || "pending");
        setNotes(initialData.notes || "");
      } else {
        setTitle("");
        setAmount("");
        setType("expense");
        setCategory("food_khaja");
        setDate(defaultDate || format(new Date(), "yyyy-MM-dd"));
        setPaymentMethod("fonepay_esewa");
        setIsEssential(false);
        setHabitId("");
        setHasSplit(false);
        setSplitWith("");
        setSplitAmount("");
        setSplitStatus("pending");
        setNotes("");
      }
      setError(null);
    }
  }, [isOpen, initialData, defaultDate]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please enter a title");
      return;
    }
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid amount in Rs.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title: title.trim(),
        amount: numAmount,
        type,
        category,
        date,
        paymentMethod,
        isEssential,
        habitId: habitId || null,
        splitWith: hasSplit ? splitWith.trim() : "",
        splitAmount: hasSplit && splitAmount ? parseFloat(splitAmount) : 0,
        splitStatus: hasSplit ? splitStatus : "pending",
        notes: notes.trim(),
      };

      const endpoint = initialData ? `/api/expenses/${initialData._id}` : "/api/expenses";
      const method = initialData ? "PATCH" : "POST";

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to save transaction");
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              {initialData ? "Edit Transaction" : "Log Expense or Income"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Record expenses in Nepali Rupees (Rs.)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-xs font-bold text-rose-600 dark:text-rose-400">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          {/* Type Toggle: Expense vs Income */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-2xl">
            <button
              type="button"
              onClick={() => setType("expense")}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                type === "expense"
                  ? "bg-rose-600 text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              💸 Expense
            </button>
            <button
              type="button"
              onClick={() => setType("income")}
              className={`py-2 text-xs font-extrabold rounded-xl transition-all ${
                type === "income"
                  ? "bg-emerald-600 text-white shadow-xs"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
              }`}
            >
              💰 Income
            </button>
          </div>

          {/* Amount in Rs. */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Amount (Rs.) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-gray-500 dark:text-gray-400 text-base">
                Rs.
              </span>
              <input
                type="number"
                step="any"
                required
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-lg font-black text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-forest-500"
              />
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Description / Title *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Lunch with friends, Water Jar, Textbook..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-2xl text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-forest-500"
            />
          </div>

          {/* Category Picker */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
              Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-40 overflow-y-auto p-1">
              {CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex items-center gap-2 p-2.5 rounded-xl text-left text-xs font-bold transition-all border ${
                      isSelected
                        ? "border-forest-600 bg-forest-50 dark:bg-forest-950/40 text-forest-900 dark:text-forest-200"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/40 text-gray-600 dark:text-gray-400 hover:border-gray-300"
                    }`}
                  >
                    <span className={`p-1 rounded-lg ${cat.color}`}>
                      <IconComponent className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate">{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Date & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Date
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
              >
                {PAYMENT_METHODS.map((pm) => (
                  <option key={pm.id} value={pm.id}>
                    {pm.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Need vs Want / Essential Checkbox */}
          {type === "expense" && (
            <label className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={isEssential}
                onChange={(e) => setIsEssential(e.target.checked)}
                className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500"
              />
              <div>
                <p className="text-xs font-bold text-gray-900 dark:text-gray-100">
                  Essential Expense (Need vs Want)
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500">
                  Checking this marks it as a basic need, keeping your &quot;No-Spend Days&quot; streak safe!
                </p>
              </div>
            </label>
          )}

          {/* Roommate / Shared Split Hisaab */}
          <div className="p-3.5 bg-gray-50/80 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <label className="flex items-center justify-between cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-extrabold text-gray-900 dark:text-gray-100">
                <Users className="w-4 h-4 text-forest-600" />
                Split Hisaab with Roommate / Friend
              </span>
              <input
                type="checkbox"
                checked={hasSplit}
                onChange={(e) => {
                  setHasSplit(e.target.checked);
                  if (e.target.checked && amount && !splitAmount) {
                    const half = (parseFloat(amount) / 2).toFixed(0);
                    setSplitAmount(half);
                  }
                }}
                className="w-4 h-4 rounded text-forest-600 focus:ring-forest-500"
              />
            </label>

            {hasSplit && (
              <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    Roommate Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rohan"
                    value={splitWith}
                    onChange={(e) => setSplitWith(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                    They Owe You (Rs.)
                  </label>
                  <input
                    type="number"
                    step="any"
                    placeholder="0"
                    value={splitAmount}
                    onChange={(e) => setSplitAmount(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Optional Habit Link */}
          {habits.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
                Link to Habit (Optional)
              </label>
              <select
                value={habitId}
                onChange={(e) => setHabitId(e.target.value)}
                className="w-full px-3.5 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
              >
                <option value="">None (General Expense)</option>
                {habits.map((h) => (
                  <option key={h._id} value={h._id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1.5">
              Notes (Optional)
            </label>
            <input
              type="text"
              placeholder="Any details or shop name..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-extrabold shadow-sm transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSubmitting ? "Saving..." : initialData ? "Update Transaction" : "Save Transaction"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
