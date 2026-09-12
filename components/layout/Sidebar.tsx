"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CheckSquare,
  Calendar,
  BarChart3,
  Timer,
  FileText,
  Settings,
  Sparkles,
  Target,
  X,
} from "lucide-react";
import { Logo } from "../ui/Logo";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "My Habits", href: "/habits", icon: CheckSquare },
  { name: "Calendar", href: "/calendar", icon: Calendar },
  { name: "Goals", href: "/goals", icon: Target },
  { name: "Analytics", href: "/analytics", icon: BarChart3 },
  { name: "Focus Mode", href: "/focus", icon: Timer },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Settings", href: "/settings", icon: Settings },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <div className="flex flex-col h-full bg-white border-r border-gray-100/90 w-64 p-5 select-none">
      {/* Brand Header */}
      <div className="flex items-center justify-between pb-6 mb-2 border-b border-gray-100">
        <Logo size="md" href="/dashboard" />
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1.5 py-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const isActive =
            pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          const Icon = item.icon;

          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all duration-150 group ${
                isActive
                  ? "bg-forest-50 text-forest-800 font-semibold shadow-xs"
                  : "text-gray-600 hover:text-gray-900 hover:bg-gray-50/80"
              }`}
            >
              <Icon
                className={`w-5 h-5 transition-colors ${
                  isActive
                    ? "text-forest-700"
                    : "text-gray-400 group-hover:text-gray-600"
                }`}
                strokeWidth={isActive ? 2.3 : 2}
              />
              <span>{item.name}</span>

              {isActive && (
                <div className="ml-auto w-1.5 h-4 rounded-full bg-forest-700" />
              )}
            </Link>
          );
        })}
      </nav>

      {/* Motivational Card at Bottom */}
      <div className="pt-4 border-t border-gray-100">
        <div className="bg-gradient-to-br from-forest-50/90 to-emerald-50/50 border border-forest-100/80 rounded-2xl p-4 relative overflow-hidden">
          <div className="absolute top-2 right-2 text-forest-300">
            <Sparkles className="w-4 h-4" />
          </div>
          <p className="text-xs font-bold text-forest-900 uppercase tracking-wider mb-1">
            Small Steps, Brighter Future
          </p>
          <p className="text-xs text-forest-700 leading-relaxed font-medium">
            Stay consistent. Keep growing every single day.
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Persistent Sidebar */}
      <aside className="hidden lg:block h-screen sticky top-0 shrink-0">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer */}
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-gray-900/40 backdrop-blur-xs transition-opacity"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="fixed inset-y-0 left-0 max-w-xs w-full bg-white shadow-xl z-10 animate-in slide-in-from-left duration-200">
            {sidebarContent}
          </div>
        </div>
      )}
    </>
  );
}
