"use client";

import React, { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { CommandPalette } from "../ui/CommandPalette";

import { useDataCache } from "@/lib/hooks/useDataCache";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const fetchMe = React.useCallback(async () => {
    const res = await fetch("/api/auth/me");
    if (!res.ok) throw new Error("Failed to fetch me");
    const data = await res.json();
    return data.user;
  }, []);

  const { data: user } = useDataCache("/api/auth/me", fetchMe, { ttlMs: 300000 });

  return (
    <div className="min-h-screen flex bg-[#F8FAF9] dark:bg-gray-950 text-gray-900 dark:text-gray-100 transition-colors duration-200">
      {/* Global Command Palette (Cmd+K) */}
      <CommandPalette />

      {/* Sidebar (Desktop persistent + Mobile drawer) */}
      <Sidebar
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <TopHeader
          user={user}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
