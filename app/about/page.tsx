import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { GraduationCap, Heart, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "About HabitTrack — Our Student Productivity Mission",
  description:
    "Learn about HabitTrack, our student-first mission to provide 100% free productivity tools, Pomodoro timers, and streak systems to learners worldwide.",
  alternates: {
    canonical: `${siteUrl}/about`,
  },
};

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col selection:bg-forest-100 selection:text-forest-900">
      <header className="border-b border-gray-100/90 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link href="/" className="hover:text-forest-700">Home</Link>
            <Link href="/features/study-habit-tracker" className="hover:text-forest-700">Features</Link>
            <Link href="/guides/how-to-build-study-habits" className="hover:text-forest-700">Guide</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-700">Log In</Link>
            <Link href="/register" className="px-4 py-2 text-sm font-semibold text-white bg-forest-700 rounded-xl">Get Started Free</Link>
          </div>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold uppercase mb-4">
            <GraduationCap className="w-3.5 h-3.5 text-forest-600" />
            Our Mission
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
            Built by students, for students.
          </h1>
          <p className="mt-4 text-gray-600 max-w-xl mx-auto text-base">
            We believe high-quality productivity tools should not be locked behind expensive student subscription paywalls.
          </p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-2xl font-bold text-gray-900">Why HabitTrack Exists</h2>
          <p>
            In university and high school, students are constantly pushed to perform at their intellectual peak, yet they are rarely taught how to build reliable daily habits. Commercial habit trackers frequently charge $5 to $15 per month — a cost that strains student budgets already burdened by textbooks and tuition.
          </p>
          <p>
            HabitTrack was created as a free, full-stack, distraction-free productivity platform tailored specifically to academic learning. We combine habit formation science, Pomodoro deep focus timers, exam preparation schedules, and streak incentives into a single unified workspace.
          </p>

          <h2 className="text-2xl font-bold text-gray-900 pt-4">Our Core Principles</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-forest-50/50 border border-forest-100">
              <h3 className="font-bold text-forest-900 text-base">100% Free Forever</h3>
              <p className="text-xs text-gray-600 mt-1">No trial periods, no hidden fees, and no feature gating for students.</p>
            </div>
            <div className="p-4 rounded-2xl bg-forest-50/50 border border-forest-100">
              <h3 className="font-bold text-forest-900 text-base">Zero Data Selling</h3>
              <p className="text-xs text-gray-600 mt-1">Your habits and study data are private, encrypted, and exportable anytime.</p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 px-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <p>© {new Date().getFullYear()} HabitTrack. Free productivity for students.</p>
          <div className="flex gap-4">
            <Link href="/privacy" className="hover:text-forest-700">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-forest-700">Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
