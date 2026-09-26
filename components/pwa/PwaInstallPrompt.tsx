"use client";

import React, { useState, useEffect } from "react";
import { Download, X, Smartphone, Sparkles } from "lucide-react";

export function PwaInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if already running in standalone mode (installed app)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as any).standalone === true;

    if (isStandalone) {
      return;
    }

    const dismissed = localStorage.getItem("habittrack_pwa_dismissed");
    if (dismissed && Date.now() - parseInt(dismissed, 10) < 1000 * 60 * 60 * 24 * 7) {
      // Dismissed within past 7 days
      setIsDismissed(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowPrompt(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setIsDismissed(true);
    localStorage.setItem("habittrack_pwa_dismissed", Date.now().toString());
  };

  if (!showPrompt || isDismissed) {
    return null;
  }

  return (
    <div className="fixed top-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 bg-white dark:bg-gray-900 rounded-3xl p-4 shadow-2xl border border-gray-200 dark:border-gray-800 animate-in slide-in-from-top-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-md shadow-forest-900/10">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-gray-900 dark:text-gray-100 flex items-center gap-1.5">
              Install HabitTrack App
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            </h4>
            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
              Add to Home Screen for 1-tap offline habit checking and water jar tracking.
            </p>
          </div>
        </div>
        <button
          onClick={handleDismiss}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          title="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3.5 pt-3 border-t border-gray-100 dark:border-gray-800 flex items-center justify-end gap-2">
        <button
          onClick={handleDismiss}
          className="px-3 py-1.5 text-[11px] font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400"
        >
          Maybe Later
        </button>
        <button
          onClick={handleInstallClick}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-bold shadow-xs transition-all hover:scale-[1.02]"
        >
          <Download className="w-3.5 h-3.5" />
          Install App
        </button>
      </div>
    </div>
  );
}
