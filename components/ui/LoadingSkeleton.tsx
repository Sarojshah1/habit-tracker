import React from "react";

export function LoadingSkeleton({ count = 3, type = "card" }: { count?: number; type?: "card" | "row" | "stats" }) {
  if (type === "stats") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-5 h-28 flex flex-col justify-between">
            <div className="flex justify-between items-center">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-24"></div>
              <div className="w-8 h-8 rounded-lg bg-gray-200 dark:bg-gray-800"></div>
            </div>
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
          </div>
        ))}
      </div>
    );
  }

  if (type === "row") {
    return (
      <div className="space-y-3 animate-pulse">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className="w-6 h-6 rounded-lg bg-gray-200 dark:bg-gray-800"></div>
              <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800"></div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-36"></div>
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-24"></div>
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-800"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gray-200 dark:bg-gray-800"></div>
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"></div>
              <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/2"></div>
            </div>
          </div>
          <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full"></div>
          <div className="flex justify-between pt-2">
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-16"></div>
            <div className="h-3 bg-gray-200 dark:bg-gray-800 rounded w-12"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
