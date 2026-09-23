import React from "react";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  colorClass?: string; // e.g. "text-forest-700 bg-forest-50"
  iconColor?: string;
  badgeText?: string;
}

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  colorClass = "text-forest-700 bg-forest-50",
  badgeText,
}: StatCardProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col justify-between">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</span>
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${colorClass}`}>
          <Icon className="w-5 h-5" strokeWidth={2.2} />
        </div>
      </div>

      <div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">{value}</span>
          {badgeText && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-forest-100 dark:bg-forest-950/70 text-forest-800 dark:text-forest-300">
              {badgeText}
            </span>
          )}
        </div>
        {subtitle && <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 font-medium">{subtitle}</p>}
      </div>
    </div>
  );
}
