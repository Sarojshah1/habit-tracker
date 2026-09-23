import React from "react";
import { LucideIcon, Plus } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 p-10 text-center flex flex-col items-center justify-center my-4">
      <div className="w-14 h-14 rounded-2xl bg-forest-50 dark:bg-forest-950/60 text-forest-700 dark:text-forest-400 flex items-center justify-center mb-4">
        <Icon className="w-7 h-7" strokeWidth={1.8} />
      </div>
      <h3 className="text-base font-bold text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mt-1 mb-6 leading-relaxed">
        {description}
      </p>
      {actionText && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-sm font-semibold shadow-sm transition-all hover:shadow hover:-translate-y-0.5"
        >
          <Plus className="w-4 h-4" strokeWidth={2.5} />
          {actionText}
        </button>
      )}
    </div>
  );
}
