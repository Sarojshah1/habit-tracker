"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  Wallet,
  Plus,
  Settings2,
  FileText,
  TrendingDown,
  TrendingUp,
  Flame,
  Droplets,
  Zap,
  Milk,
  Home,
  Wifi,
  Search,
  CheckCircle2,
  AlertCircle,
  Users,
  Edit2,
  Trash2,
  ShieldCheck,
  Calendar as CalendarIcon,
  RotateCw,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { format } from "date-fns";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { ErrorState } from "@/components/ui/ErrorState";
import { ExpenseFormModal, CATEGORIES } from "@/components/expenses/ExpenseFormModal";
import { BudgetModal } from "@/components/expenses/BudgetModal";
import { HisaabExportModal } from "@/components/expenses/HisaabExportModal";
import { RecurringItemsModal } from "@/components/expenses/RecurringItemsModal";
import { enqueueOfflineAction } from "@/lib/services/offlineSync";

const CATEGORY_COLORS: Record<string, string> = {
  food_khaja: "#f59e0b",
  groceries: "#10b981",
  rent: "#ef4444",
  utilities: "#06b6d4",
  college_books: "#6366f1",
  transport: "#3b82f6",
  entertainment: "#a855f7",
  health: "#ec4899",
  bills: "#f97316",
  other: "#64748b",
};

export default function ExpensesPage() {
  const [currentMonth, setCurrentMonth] = useState<string>(
    format(new Date(), "yyyy-MM")
  );
  const [expenses, setExpenses] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>({
    totalExpense: 0,
    totalIncome: 0,
    netSavings: 0,
    noSpendDaysCount: 0,
    unsettledSplitTotal: 0,
    categoryBreakdown: {},
    dailySpending: {},
  });
  const [utilitiesSummary, setUtilitiesSummary] = useState<any>({
    totalWaterJars: 0,
    totalElectricityUnits: 0,
    totalMilkPackets: 0,
    lpgReplacementDates: [],
  });
  const [budget, setBudget] = useState<any>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedType, setSelectedType] = useState("all");

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setError(false);
      const [expRes, utilRes, budRes] = await Promise.all([
        fetch(`/api/expenses?month=${currentMonth}`),
        fetch(`/api/utilities?month=${currentMonth}`),
        fetch(`/api/expenses/budget?month=${currentMonth}`),
      ]);

      if (!expRes.ok || !utilRes.ok || !budRes.ok) {
        throw new Error("Failed to load expense and utility data");
      }

      const expData = await expRes.json();
      const utilData = await utilRes.json();
      const budData = await budRes.json();

      if (expData.success) {
        setExpenses(expData.expenses || []);
        if (expData.summary) setSummary(expData.summary);
      }
      if (utilData.success) {
        setUtilitiesSummary(utilData.summary || {});
      }
      if (budData.success) {
        setBudget(budData.budget || null);
      }
    } catch (err) {
      console.error("Expenses page fetch error:", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchData();

    const handleSyncComplete = () => {
      fetchData();
    };

    if (typeof window !== "undefined") {
      window.addEventListener("habittrack_sync_completed", handleSyncComplete);
    }
    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("habittrack_sync_completed", handleSyncComplete);
      }
    };
  }, [fetchData]);

  // Quick Action for Water Jar / Milk (with offline queueing support)
  const handleQuickAdd = async (action: "increment_water" | "increment_milk") => {
    const todayStr = format(new Date(), "yyyy-MM-dd");
    const payload = {
      action,
      date: todayStr,
      amount: 1,
      autoAddExpense: action === "increment_water",
    };

    // If offline, queue and optimistically update counters
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      enqueueOfflineAction({
        type: "log_water",
        endpoint: "/api/utilities",
        method: "POST",
        payload,
        description: action === "increment_water" ? "+1 Drinking Water Jar" : "+1 Dairy Milk Packet",
      });

      setUtilitiesSummary((prev: any) => ({
        ...prev,
        totalWaterJars:
          action === "increment_water" ? (prev.totalWaterJars || 0) + 1 : prev.totalWaterJars,
        totalMilkPackets:
          action === "increment_milk" ? (prev.totalMilkPackets || 0) + 1 : prev.totalMilkPackets,
      }));
      return;
    }

    try {
      await fetch("/api/utilities", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      fetchData();
    } catch (err) {
      console.warn("Network error during quick add, queuing offline:", err);
      enqueueOfflineAction({
        type: "log_water",
        endpoint: "/api/utilities",
        method: "POST",
        payload,
        description: action === "increment_water" ? "+1 Drinking Water Jar" : "+1 Dairy Milk Packet",
      });
    }
  };

  const handleDeleteExpense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this transaction?")) return;
    try {
      const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
      if (res.ok) fetchData();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const handleMarkSettled = async (expense: any) => {
    try {
      await fetch(`/api/expenses/${expense._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ splitStatus: "settled" }),
      });
      fetchData();
    } catch (err) {
      console.error("Settlement failed:", err);
    }
  };

  // Filtered transactions
  const filteredExpenses = expenses.filter((item) => {
    const matchesSearch = item.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || item.category === selectedCategory;
    const matchesType =
      selectedType === "all" || item.type === selectedType;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Budget calculations
  const monthlyLimit = budget?.monthlyLimit || 20000;
  const budgetPercentage = Math.min(
    100,
    Math.round((summary.totalExpense / (monthlyLimit || 1)) * 100)
  );

  // Category breakdown for Pie Chart
  const pieData = Object.entries(summary.categoryBreakdown || {}).map(
    ([cat, val]) => {
      const found = CATEGORIES.find((c) => c.id === cat);
      return {
        name: found ? found.label : cat,
        value: val as number,
        color: CATEGORY_COLORS[cat] || "#64748b",
      };
    }
  );

  // Daily spending timeline for Bar Chart
  const barData = Object.entries(summary.dailySpending || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, val]) => ({
      date: date.substring(8), // day number
      amount: val as number,
    }));

  // Days since last LPG
  let lpgDaysAgo: number | null = null;
  if (budget?.lastLpgDate) {
    const diff =
      new Date().getTime() - new Date(budget.lastLpgDate).getTime();
    lpgDaysAgo = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));
  }

  if (isLoading) {
    return <LoadingSkeleton count={3} type="card" />;
  }

  if (error) {
    return <ErrorState onRetry={fetchData} />;
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-2xl bg-forest-700 text-white shadow-xs">
              <Wallet className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-gray-100 tracking-tight">
              Expenses &amp; Household Hisaab
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
            Manage spending in Nepali Rupees (Rs.), daily water jars, electricity units, and room split hisaab.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Month Selector */}
          <input
            type="month"
            value={currentMonth}
            onChange={(e) => setCurrentMonth(e.target.value)}
            className="px-3 py-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl text-xs font-bold text-gray-900 dark:text-gray-100 shadow-xs"
          />

          {/* Budget & Household Settings Button */}
          <button
            type="button"
            onClick={() => setIsBudgetModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-2xl text-xs font-bold transition-all shadow-xs"
          >
            <Settings2 className="w-4 h-4 text-forest-600" />
            Budget &amp; Settings
          </button>

          {/* Export Hisaab Button */}
          <button
            type="button"
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-400 rounded-2xl text-xs font-bold transition-all border border-amber-500/20 shadow-xs"
          >
            <FileText className="w-4 h-4" />
            Export Hisaab
          </button>

          {/* Auto-Daily Subscriptions Button */}
          <button
            type="button"
            onClick={() => setIsRecurringModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-2xl text-xs font-bold transition-all border border-orange-500/20 shadow-xs"
          >
            <RotateCw className="w-4 h-4 text-orange-600" />
            Auto-Daily
          </button>

          {/* Log Expense Button */}
          <button
            type="button"
            onClick={() => {
              setEditingExpense(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-1.5 px-4 py-2 bg-forest-700 hover:bg-forest-800 text-white rounded-2xl text-xs font-extrabold transition-all shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Log Transaction
          </button>
        </div>
      </div>

      {/* 4 Main Financial Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Spent & Budget Bar */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Total Spent ({currentMonth})
            </span>
            <span className="p-2 rounded-xl bg-rose-500/10 text-rose-500">
              <TrendingDown className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              Rs. {summary.totalExpense.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Budget: Rs. {monthlyLimit.toLocaleString()} ({budgetPercentage}%)
            </p>
          </div>
          <div className="w-full bg-gray-100 dark:bg-gray-800 h-2 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                budgetPercentage >= 100
                  ? "bg-rose-500"
                  : budgetPercentage >= 75
                  ? "bg-amber-500"
                  : "bg-forest-600"
              }`}
              style={{ width: `${budgetPercentage}%` }}
            />
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Total Income
            </span>
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
              Rs. {summary.totalIncome.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Allowances, salary &amp; earnings
            </p>
          </div>
        </div>

        {/* Net Savings */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Net Savings / Balance
            </span>
            <span className="p-2 rounded-xl bg-blue-500/10 text-blue-500">
              <Wallet className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p
              className={`text-2xl font-black ${
                summary.netSavings >= 0
                  ? "text-blue-600 dark:text-blue-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              Rs. {summary.netSavings.toLocaleString()}
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              Income minus total expenses
            </p>
          </div>
        </div>

        {/* No-Spend Days Streak */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400">
              Financial Discipline
            </span>
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div>
            <p className="text-2xl font-black text-gray-900 dark:text-gray-100">
              {summary.noSpendDaysCount} Days
            </p>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium mt-0.5">
              🛡️ Zero non-essential spending
            </p>
          </div>
        </div>
      </div>

      {/* 💧 Household Utilities & Living Hub */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Daily Household Utilities &amp; Living Counters
            </h3>
            <p className="text-xs text-gray-400 dark:text-gray-500 font-medium">
              Track drinking water jars, electricity units, dairy milk, and cooking gas for {currentMonth}.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleQuickAdd("increment_water")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 rounded-xl text-xs font-bold transition-all border border-blue-500/20"
            >
              <Droplets className="w-3.5 h-3.5 text-blue-500" />
              +1 Water Jar Today
            </button>
            <button
              type="button"
              onClick={() => handleQuickAdd("increment_milk")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-700 dark:text-orange-300 rounded-xl text-xs font-bold transition-all border border-orange-500/20"
            >
              <Milk className="w-3.5 h-3.5 text-orange-500" />
              +1 Milk Packet Today
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Water Jars */}
          <div className="p-4 bg-blue-50/50 dark:bg-blue-950/20 rounded-2xl border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 dark:text-blue-200">Drinking Water</span>
              <Droplets className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-blue-950 dark:text-blue-100 mt-2">
              {utilitiesSummary.totalWaterJars || 0} Jars
            </p>
            <p className="text-[11px] text-blue-700/80 dark:text-blue-400 font-medium mt-0.5">
              ~Rs. {((utilitiesSummary.totalWaterJars || 0) * (budget?.waterJarPrice || 50)).toLocaleString()} total
            </p>
          </div>

          {/* Electricity Units */}
          <div className="p-4 bg-amber-50/50 dark:bg-amber-950/20 rounded-2xl border border-amber-100 dark:border-amber-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-900 dark:text-amber-200">Electricity</span>
              <Zap className="w-4 h-4 text-amber-600" />
            </div>
            <p className="text-2xl font-black text-amber-950 dark:text-amber-100 mt-2">
              {utilitiesSummary.totalElectricityUnits || 0} Units
            </p>
            <p className="text-[11px] text-amber-700/80 dark:text-amber-400 font-medium mt-0.5">
              Meter (kWh) consumed this month
            </p>
          </div>

          {/* Dairy Milk Packets */}
          <div className="p-4 bg-orange-50/50 dark:bg-orange-950/20 rounded-2xl border border-orange-100 dark:border-orange-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-orange-900 dark:text-orange-200">Milk Packets</span>
              <Milk className="w-4 h-4 text-orange-600" />
            </div>
            <p className="text-2xl font-black text-orange-950 dark:text-orange-100 mt-2">
              {utilitiesSummary.totalMilkPackets || 0} Packets
            </p>
            <p className="text-[11px] text-orange-700/80 dark:text-orange-400 font-medium mt-0.5">
              ~Rs. {((utilitiesSummary.totalMilkPackets || 0) * (budget?.milkPacketPrice || 55)).toLocaleString()} total
            </p>
          </div>

          {/* Cooking Gas (LPG) */}
          <div className="p-4 bg-rose-50/50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-900/40">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-rose-900 dark:text-rose-200">Cooking Gas (LPG)</span>
              <Flame className="w-4 h-4 text-rose-600" />
            </div>
            <p className="text-2xl font-black text-rose-950 dark:text-rose-100 mt-2">
              {lpgDaysAgo !== null ? `Day ${lpgDaysAgo}` : "Not set"}
            </p>
            <p className="text-[11px] text-rose-700/80 dark:text-rose-400 font-medium mt-0.5">
              {budget?.lastLpgDate ? `Installed ${budget.lastLpgDate}` : "Set date in Settings"}
            </p>
          </div>
        </div>

        {/* Room Rent & WiFi Alerts */}
        {(budget?.rentAmount > 0 || budget?.wifiAmount > 0) && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {budget?.rentAmount > 0 && (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
                    <Home className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-gray-900 dark:text-gray-100">
                      Room Rent: Rs. {budget.rentAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400">Due on {budget.rentDueDate}th of every month</p>
                  </div>
                </div>
              </div>
            )}

            {budget?.wifiAmount > 0 && (
              <div className="p-3.5 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600">
                    <Wifi className="w-4 h-4" />
                  </span>
                  <div>
                    <p className="text-xs font-black text-gray-900 dark:text-gray-100">
                      WiFi Recharge: Rs. {budget.wifiAmount.toLocaleString()}
                    </p>
                    <p className="text-[11px] text-gray-400">Due on {budget.wifiDueDate}th of every month</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Roommate Split Hisaab-Kitaab Alert */}
      {summary.unsettledSplitTotal > 0 && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-3xl flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-700 dark:text-amber-400">
              <Users className="w-5 h-5" />
            </span>
            <div>
              <p className="text-sm font-black text-amber-950 dark:text-amber-200">
                Roommate Hisaab: Rs. {summary.unsettledSplitTotal.toLocaleString()} Owed to You
              </p>
              <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
                You have unsettled shared expenses from grocery or room purchases.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Charts Section: Category Donut & Daily Spending Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Category Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Spending by Category
          </h3>

          {pieData.length > 0 ? (
            <>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(val: any) => [`Rs. ${Number(val).toLocaleString()}`, "Amount"]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {pieData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 truncate">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="truncate text-gray-600 dark:text-gray-300 font-medium">
                      {item.name}: Rs.{item.value.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-xs text-gray-400">No expenses recorded yet.</div>
          )}
        </div>

        {/* Daily Spending Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
          <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 tracking-tight">
            Daily Spending Timeline
          </h3>

          {barData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-gray-900 text-white p-2.5 rounded-xl text-xs space-y-1">
                            <p className="font-bold">Day {payload[0].payload.date}</p>
                            <p className="text-forest-400 font-black">
                              Rs. {Number(payload[0].value).toLocaleString()}
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-16 text-center text-xs text-gray-400">No daily spending recorded yet.</div>
          )}
        </div>
      </div>

      {/* Transaction History & Filterable Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-black text-gray-900 dark:text-gray-100 tracking-tight">
            Transaction History
          </h3>

          {/* Search & Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search transactions..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-gray-100"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300"
            >
              <option value="all">All Types</option>
              <option value="expense">Expenses Only</option>
              <option value="income">Income Only</option>
            </select>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs font-medium">
            No transactions found matching your criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-800 text-gray-400 uppercase tracking-wider text-[10px]">
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Description</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Payment</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredExpenses.map((item) => {
                  const cat = CATEGORIES.find((c) => c.id === item.category);
                  const isExp = item.type === "expense";
                  return (
                    <tr key={item._id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors">
                      <td className="py-3 px-3 text-gray-500 dark:text-gray-400 font-mono text-[11px]">
                        {item.date}
                      </td>
                      <td className="py-3 px-3">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 dark:text-gray-100">{item.title}</span>
                          {item.splitWith && (
                            <span className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3" />
                              Split with {item.splitWith}: Rs. {item.splitAmount} (
                              {item.splitStatus === "settled" ? "Settled" : "Owed"}
                              )
                            </span>
                          )}
                          {item.habitId && (
                            <span className="text-[10px] text-forest-700 dark:text-forest-400 font-medium">
                              🔗 Linked: {item.habitId.name}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium text-[11px]">
                          {cat ? cat.label : item.category}
                        </span>
                      </td>
                      <td className="py-3 px-3">
                        <span className="text-[11px] text-gray-500 capitalize">
                          {item.paymentMethod?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-black text-sm">
                        <span className={isExp ? "text-rose-600 dark:text-rose-400" : "text-emerald-600 dark:text-emerald-400"}>
                          {isExp ? "- " : "+ "}Rs. {item.amount.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right space-x-2">
                        {item.splitWith && item.splitStatus === "pending" && (
                          <button
                            type="button"
                            onClick={() => handleMarkSettled(item)}
                            className="px-2 py-1 rounded-md bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-bold"
                            title="Mark as paid by roommate"
                          >
                            Settle
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingExpense(item);
                            setIsFormModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                        >
                          <Edit2 className="w-3.5 h-3.5 inline" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteExpense(item._id)}
                          className="text-gray-400 hover:text-rose-500"
                        >
                          <Trash2 className="w-3.5 h-3.5 inline" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Form Modal */}
      <ExpenseFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingExpense(null);
        }}
        onSuccess={fetchData}
        initialData={editingExpense}
      />

      {/* Budget Modal */}
      <BudgetModal
        isOpen={isBudgetModalOpen}
        onClose={() => setIsBudgetModalOpen(false)}
        onSuccess={fetchData}
        currentMonth={currentMonth}
        initialData={budget}
      />

      {/* Export Hisaab Modal */}
      <HisaabExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        month={currentMonth}
        summary={{
          ...summary,
          totalWaterJars: utilitiesSummary.totalWaterJars,
          totalElectricityUnits: utilitiesSummary.totalElectricityUnits,
          totalMilkPackets: utilitiesSummary.totalMilkPackets,
          waterJarPrice: budget?.waterJarPrice,
          milkPacketPrice: budget?.milkPacketPrice,
          rentAmount: budget?.rentAmount,
          wifiAmount: budget?.wifiAmount,
        }}
      />

      {/* Auto-Daily Subscriptions Modal */}
      <RecurringItemsModal
        isOpen={isRecurringModalOpen}
        onClose={() => setIsRecurringModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
