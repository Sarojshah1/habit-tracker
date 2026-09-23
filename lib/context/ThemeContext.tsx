"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const STORAGE_KEY = "habittrack_theme";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Apply class to html element
  const applyTheme = useCallback((newTheme: Theme) => {
    if (typeof window === "undefined") return;

    const isSystemDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const isDark = newTheme === "dark" || (newTheme === "system" && isSystemDark);

    if (isDark) {
      document.documentElement.classList.add("dark");
      setResolvedTheme("dark");
    } else {
      document.documentElement.classList.remove("dark");
      setResolvedTheme("light");
    }

    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {}
  }, []);

  // Initialize from localStorage or default on mount
  useEffect(() => {
    setMounted(true);
    let savedTheme: Theme = "system";
    try {
      const stored = localStorage.getItem(STORAGE_KEY) as Theme;
      if (stored === "light" || stored === "dark" || stored === "system") {
        savedTheme = stored;
      }
    } catch {}

    setThemeState(savedTheme);
    applyTheme(savedTheme);

    // Listen for OS theme changes when in 'system' mode
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleSystemChange = (e: MediaQueryListEvent) => {
      const current = localStorage.getItem(STORAGE_KEY);
      if (current === "system" || !current) {
        if (e.matches) {
          document.documentElement.classList.add("dark");
          setResolvedTheme("dark");
        } else {
          document.documentElement.classList.remove("dark");
          setResolvedTheme("light");
        }
      }
    };

    mediaQuery.addEventListener("change", handleSystemChange);
    return () => mediaQuery.removeEventListener("change", handleSystemChange);
  }, [applyTheme]);

  const setTheme = useCallback(
    (newTheme: Theme) => {
      setThemeState(newTheme);
      applyTheme(newTheme);

      // Optionally sync to user settings API in background
      fetch("/api/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { appearance: newTheme },
        }),
      }).catch(() => {});
    },
    [applyTheme]
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }, [resolvedTheme, setTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme: mounted ? theme : "system",
        resolvedTheme: mounted ? resolvedTheme : "light",
        setTheme,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
