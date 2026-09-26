"use client";

import React, { useState, useEffect } from "react";
import { X, Save, Home, Wifi, Flame, Droplets, Milk, Target } from "lucide-react";

interface BudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentMonth: string; // YYYY-MM
  initialData?: any;
}

export function BudgetModal({
  isOpen,
  onClose,
  onSuccess,
  currentMonth,
  initialData,
}: BudgetModalProps) {
  const [monthlyLimit, setMonthlyLimit] = useState("20000");
  const [rentAmount, setRentAmount] = useState("0");
  const [rentDueDate, setRentDueDate] = useState("1");
  const [wifiAmount, setWifiAmount] = useState("0");
  const [wifiDueDate, setWifiDueDate] = useState("15");
  const [waterJarPrice, setWaterJarPrice] = useState("50");
  const [milkPacketPrice, setMilkPacketPrice] = useState("55");
  const [lastLpgDate, setLastLpgDate] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setMonthlyLimit(String(initialData.monthlyLimit || 20000));
        setRentAmount(String(initialData.rentAmount || 0));
        setRentDueDate(String(initialData.rentDueDate || 1));
        setWifiAmount(String(initialData.wifiAmount || 0));
        setWifiDueDate(String(initialData.wifiDueDate || 15));
        setWaterJarPrice(String(initialData.waterJarPrice || 50));
        setMilkPacketPrice(String(initialData.milkPacketPrice || 55));
        setLastLpgDate(initialData.lastLpgDate || "");
      }
      setError(null);
    }
  }, [isOpen, initialData]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        month: currentMonth,
        monthlyLimit: parseFloat(monthlyLimit) || 0,
        rentAmount: parseFloat(rentAmount) || 0,
        rentDueDate: parseInt(rentDueDate, 10) || 1,
        wifiAmount: parseFloat(wifiAmount) || 0,
        wifiDueDate: parseInt(wifiDueDate, 10) || 15,
        waterJarPrice: parseFloat(waterJarPrice) || 50,
        milkPacketPrice: parseFloat(milkPacketPrice) || 55,
        lastLpgDate: lastLpgDate.trim(),
      };

      const res = await fetch("/api/expenses/budget", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to update budget");
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
              Monthly Budget &amp; Household Settings
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Target for {currentMonth} in Nepali Rupees (Rs.)
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
          {/* Monthly Budget Target */}
          <div className="p-4 bg-forest-50/60 dark:bg-forest-950/30 rounded-2xl border border-forest-100 dark:border-forest-900/40">
            <label className="flex items-center gap-2 text-xs font-black text-forest-900 dark:text-forest-200 mb-1.5">
              <Target className="w-4 h-4 text-forest-600" />
              Monthly Spending Target (Rs.) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-forest-700 dark:text-forest-400 text-base">
                Rs.
              </span>
              <input
                type="number"
                required
                min="0"
                value={monthlyLimit}
                onChange={(e) => setMonthlyLimit(e.target.value)}
                className="w-full pl-12 pr-4 py-2.5 bg-white dark:bg-gray-900 border border-forest-200 dark:border-forest-800 rounded-xl text-lg font-black text-gray-900 dark:text-gray-100 focus:outline-hidden focus:ring-2 focus:ring-forest-500"
              />
            </div>
            <p className="text-[11px] text-forest-700/70 dark:text-forest-400/80 mt-1">
              Used to calculate your monthly budget progress bar and alert warnings.
            </p>
          </div>

          {/* Room Rent Settings */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-900 dark:text-gray-100">
              <Home className="w-4 h-4 text-rose-500" />
              Room Rent Alert
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Monthly Rent (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 8000"
                  value={rentAmount}
                  onChange={(e) => setRentAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Due Day of Month (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="1"
                  value={rentDueDate}
                  onChange={(e) => setRentDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* WiFi Settings */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="flex items-center gap-2 text-xs font-extrabold text-gray-900 dark:text-gray-100">
              <Wifi className="w-4 h-4 text-cyan-500" />
              WiFi / Internet Recharge Alert
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  WiFi Bill (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1200"
                  value={wifiAmount}
                  onChange={(e) => setWifiAmount(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  Due Day of Month (1-31)
                </label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="15"
                  value={wifiDueDate}
                  onChange={(e) => setWifiDueDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* Unit Prices: Water Jar & Milk */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-3">
            <div className="text-xs font-extrabold text-gray-900 dark:text-gray-100">
              Standard Daily Prices
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" />
                  Water Jar Price (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={waterJarPrice}
                  onChange={(e) => setWaterJarPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 dark:text-gray-400 mb-1">
                  <Milk className="w-3.5 h-3.5 text-amber-500" />
                  Milk Packet Price (Rs.)
                </label>
                <input
                  type="number"
                  min="0"
                  value={milkPacketPrice}
                  onChange={(e) => setMilkPacketPrice(e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
          </div>

          {/* LPG Gas Cylinder */}
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-800 space-y-2">
            <label className="flex items-center gap-1.5 text-xs font-extrabold text-gray-900 dark:text-gray-100">
              <Flame className="w-4 h-4 text-orange-500" />
              Last LPG Cylinder Installed Date
            </label>
            <input
              type="date"
              value={lastLpgDate}
              onChange={(e) => setLastLpgDate(e.target.value)}
              className="w-full px-3.5 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-900 dark:text-gray-100"
            />
            <p className="text-[11px] text-gray-400 dark:text-gray-500">
              Used to calculate active days of your cooking gas cylinder and alert you before it finishes.
            </p>
          </div>

          {/* Submit */}
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
              {isSubmitting ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
