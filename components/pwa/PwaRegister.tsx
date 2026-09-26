"use client";

import React, { useEffect } from "react";
import { WifiOff, Wifi, RefreshCw, CheckCircle2 } from "lucide-react";
import { useOfflineSync } from "@/lib/services/offlineSync";

export function PwaRegister() {
  const { isOnline, pendingCount, isSyncing, lastSyncResult, triggerSync } = useOfflineSync();

  // Register service worker on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      window.addEventListener("load", () => {
        navigator.serviceWorker
          .register("/sw.js")
          .then((registration) => {
            console.log("HabitTrack Service Worker registered with scope:", registration.scope);
          })
          .catch((err) => {
            console.warn("HabitTrack Service Worker registration failed:", err);
          });
      });
    }
  }, []);

  return (
    <>
      {/* Offline Status Pill / Banner */}
      {!isOnline && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-gray-900/95 dark:bg-gray-800/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-gray-700 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-400 shrink-0 animate-pulse">
              <WifiOff className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-bold">Offline Mode Active</p>
              <p className="text-[11px] text-gray-300">
                Habits, jars &amp; hisaab will auto-sync on reconnect.
              </p>
            </div>
          </div>
          {pendingCount > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500 text-gray-950 font-black text-[10px] shrink-0">
              {pendingCount} queued
            </span>
          )}
        </div>
      )}

      {/* Syncing or Synced Reconnection Notification */}
      {isOnline && (isSyncing || lastSyncResult) && (
        <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-emerald-950/95 dark:bg-emerald-900/95 backdrop-blur-md text-white px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700/50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom-5">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 shrink-0">
              {isSyncing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <CheckCircle2 className="w-4 h-4" />
              )}
            </span>
            <div>
              <p className="text-xs font-bold">
                {isSyncing ? "Syncing Offline Actions..." : "Back Online!"}
              </p>
              <p className="text-[11px] text-emerald-200">
                {lastSyncResult || "Updating your server records..."}
              </p>
            </div>
          </div>
          {isOnline && pendingCount > 0 && !isSyncing && (
            <button
              onClick={triggerSync}
              className="px-2.5 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-gray-950 text-[10px] font-black shrink-0 transition-all"
            >
              Sync Now
            </button>
          )}
        </div>
      )}
    </>
  );
}
