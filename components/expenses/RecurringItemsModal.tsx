"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Plus,
  Milk,
  RotateCw,
  Check,
  Trash2,
  Calendar,
  AlertCircle,
  Tag,
  Power,
} from "lucide-react";
import { format } from "date-fns";

interface RecurringItemsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RecurringItemsModal({
  isOpen,
  onClose,
  onSuccess,
}: RecurringItemsModalProps) {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // New Item Form state
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"milk" | "expense">("expense");
  const [amount, setAmount] = useState("");
  const [unitCount, setUnitCount] = useState("1");
  const [category, setCategory] = useState("groceries");
  const [frequency, setFrequency] = useState<"daily" | "weekdays">("daily");
  const [autoAddExpense, setAutoAddExpense] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/expenses/recurring");
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error("Failed to load recurring items:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchItems();
      setShowAddForm(false);
      setError(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleActive = async (item: any) => {
    try {
      await fetch("/api/expenses/recurring", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, active: !item.active }),
      });
      fetchItems();
      onSuccess();
    } catch (err) {
      console.error("Failed to toggle:", err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Remove this automatic daily rule?")) return;
    try {
      await fetch(`/api/expenses/recurring?id=${id}`, { method: "DELETE" });
      fetchItems();
      onSuccess();
    } catch (err) {
      console.error("Failed to delete:", err);
    }
  };

  const handleQuickAddMilk = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "Daily Milk Packet",
          type: "milk",
          amount: 55,
          unitCount: 1,
          category: "groceries",
          frequency: "daily",
          autoAddExpense: true,
          startDate: format(new Date(), "yyyy-MM-dd"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      fetchItems();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to add milk subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError("Please provide a title");
      return;
    }
    const numAmount = parseFloat(amount) || 0;

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/expenses/recurring", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          type,
          amount: numAmount,
          unitCount: parseInt(unitCount, 10) || 1,
          category,
          frequency,
          autoAddExpense,
          startDate: format(new Date(), "yyyy-MM-dd"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error);

      setTitle("");
      setAmount("");
      setShowAddForm(false);
      fetchItems();
      onSuccess();
    } catch (err: any) {
      setError(err.message || "Failed to create subscription");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Check if milk subscription already exists
  const hasMilkSubscription = items.some((i) => i.type === "milk");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-2xl p-6 sm:p-8 my-8 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <RotateCw className="w-5 h-5 text-forest-600" />
              Automatic Daily Subscriptions
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Automatically log recurring items like daily milk packets and commute expenses every day.
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

        {/* Quick Setup Banner for Milk */}
        {!hasMilkSubscription && (
          <div className="mt-4 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-orange-500 text-white">
                <Milk className="w-4 h-4" />
              </span>
              <div>
                <p className="text-xs font-black text-orange-950 dark:text-orange-200">
                  Daily Milk Delivery (1 Packet / day)
                </p>
                <p className="text-[11px] text-orange-800/80 dark:text-orange-400">
                  Auto-logs 1 packet &amp; Rs. 55 every morning automatically!
                </p>
              </div>
            </div>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleQuickAddMilk}
              className="px-3 py-1.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold transition-all shrink-0"
            >
              + Enable Milk
            </button>
          </div>
        )}

        {/* Existing Subscriptions List */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-extrabold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Active Daily Rules ({items.length})
            </h4>
            <button
              type="button"
              onClick={() => setShowAddForm(!showAddForm)}
              className="text-xs font-bold text-forest-700 dark:text-forest-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              {showAddForm ? "Cancel" : "Add Custom Daily Item"}
            </button>
          </div>

          {items.length === 0 && !showAddForm ? (
            <div className="p-6 text-center text-gray-400 text-xs font-medium border border-dashed border-gray-200 dark:border-gray-800 rounded-2xl">
              No automatic daily subscriptions active yet. Click above to add milk or commute expenses!
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item._id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                  item.active
                    ? "bg-forest-50/40 dark:bg-forest-950/20 border-forest-200 dark:border-forest-900/40"
                    : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-800 opacity-60"
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span
                    className={`p-2 rounded-xl text-white ${
                      item.type === "milk" ? "bg-orange-500" : "bg-forest-700"
                    }`}
                  >
                    {item.type === "milk" ? <Milk className="w-4 h-4" /> : <RotateCw className="w-4 h-4" />}
                  </span>
                  <div className="truncate">
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium">
                      {item.type === "milk"
                        ? `${item.unitCount} packet/day • Rs. ${item.amount}/day`
                        : `Rs. ${item.amount} • ${item.frequency === "weekdays" ? "Mon-Fri" : "Daily"}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(item)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-extrabold transition-all ${
                      item.active
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                        : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {item.active ? "Active" : "Paused"}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item._id)}
                    className="p-1.5 text-gray-400 hover:text-rose-500 transition-colors"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Custom Form */}
        {showAddForm && (
          <form
            onSubmit={handleCreateCustom}
            className="mt-5 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-3.5"
          >
            <h4 className="text-xs font-black text-gray-900 dark:text-gray-100">
              New Daily Auto-Subscription
            </h4>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                Rule Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Daily Newspaper, Bus Fare, Mess Food..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Type
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                >
                  <option value="expense">Custom Expense</option>
                  <option value="milk">Milk Delivery</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Daily Amount (Rs.)
                </label>
                <input
                  type="number"
                  step="any"
                  placeholder="0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Frequency
                </label>
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                >
                  <option value="daily">Every Day</option>
                  <option value="weekdays">Weekdays Only (Mon-Fri)</option>
                </select>
              </div>

              {type === "milk" ? (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Packets per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={unitCount}
                    onChange={(e) => setUnitCount(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-[11px] font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                  >
                    <option value="groceries">Groceries</option>
                    <option value="transport">Transport / Commute</option>
                    <option value="food_khaja">Food &amp; Khaja</option>
                    <option value="bills">Bills &amp; Recharge</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-3 py-1.5 text-xs text-gray-500 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-extrabold transition-all"
              >
                {isSubmitting ? "Saving..." : "Save Rule"}
              </button>
            </div>
          </form>
        )}

        <div className="flex justify-end pt-5 border-t border-gray-100 dark:border-gray-800 mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-forest-700 text-white text-xs font-extrabold shadow-sm"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
