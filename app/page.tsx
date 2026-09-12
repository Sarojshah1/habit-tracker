import React from "react";
import Link from "next/link";
import {
  CheckCircle2,
  Flame,
  BarChart3,
  Timer,
  FileText,
  Calendar as CalendarIcon,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col selection:bg-forest-100 selection:text-forest-900">
      {/* Top Navbar */}
      <header className="border-b border-gray-100/90 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-xs transition-all hover:shadow hover:-translate-y-0.5"
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-28 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-100/80 text-forest-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            Designed For Students &amp; Focused Achievers
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight sm:leading-none">
            Build habits that <br className="hidden sm:inline" />
            <span className="text-forest-700">shape your future</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            HabitTrack helps students schedule daily routines, maintain streaks,
            stay immersed in distraction-free focus sessions, and track real academic and personal growth.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated transition-all hover:-translate-y-0.5"
            >
              Start Free Today
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 transition-colors shadow-xs"
            >
              Log In to Dashboard
            </Link>
          </div>

          {/* Interactive Demo Card Preview */}
          <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-elevated p-6 sm:p-8 max-w-3xl mx-auto text-left">
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs font-bold text-gray-400 ml-2">HabitTrack Dashboard Preview</span>
              </div>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-forest-50 text-forest-700">
                12-Day Active Streak 🔥
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-5 border-b border-gray-100">
              <div className="p-3 bg-gray-50/80 rounded-2xl">
                <p className="text-xs text-gray-400 font-semibold">Today&apos;s Habits</p>
                <p className="text-xl font-black text-gray-900 mt-1">4/5 Done</p>
              </div>
              <div className="p-3 bg-orange-50/60 rounded-2xl">
                <p className="text-xs text-orange-600 font-semibold">Day Streak</p>
                <p className="text-xl font-black text-gray-900 mt-1">12 Days</p>
              </div>
              <div className="p-3 bg-emerald-50/60 rounded-2xl">
                <p className="text-xs text-emerald-600 font-semibold">Weekly Rate</p>
                <p className="text-xl font-black text-gray-900 mt-1">85%</p>
              </div>
              <div className="p-3 bg-blue-50/60 rounded-2xl">
                <p className="text-xs text-blue-600 font-semibold">Active Goals</p>
                <p className="text-xl font-black text-gray-900 mt-1">3 Goals</p>
              </div>
            </div>

            <div className="pt-5 space-y-2.5">
              <div className="p-3 rounded-xl bg-forest-50/50 border border-forest-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md bg-forest-700 text-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900 line-through text-gray-400">Study for 2 hours</p>
                    <p className="text-[10px] text-gray-400 font-medium">Daily • 08:00 AM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-forest-700">Completed</span>
              </div>

              <div className="p-3 rounded-xl bg-white border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-md border border-gray-300 flex items-center justify-center" />
                  <div>
                    <p className="text-xs font-bold text-gray-900">Meditate before sleep</p>
                    <p className="text-[10px] text-gray-400 font-medium">Daily • 09:00 PM</p>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-gray-400">Scheduled for tonight</span>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
                Everything you need to master your daily momentum
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Built from the ground up for clarity, simplicity, and sustainable student habits.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-[#F8FAF9] rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Streak Engine</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">
                  Track consecutive days of progress with real database history. Never break the chain.
                </p>
              </div>

              <div className="bg-[#F8FAF9] rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                  <Timer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pomodoro Focus Mode</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">
                  Immerse yourself in 25-min, 50-min, or custom study sessions with ambient chimes and session logs.
                </p>
              </div>

              <div className="bg-[#F8FAF9] rounded-2xl p-6 border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Visual Analytics</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed font-medium">
                  Line charts, consistency breakdowns, and weekday performance heatmaps derived from real data.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6 text-center text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <p>© {new Date().getFullYear()} HabitTrack. Built for students who strive for excellence.</p>
          <div className="flex items-center gap-4 font-semibold text-gray-600">
            <Link href="/login" className="hover:text-forest-700">Login</Link>
            <Link href="/register" className="hover:text-forest-700">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
