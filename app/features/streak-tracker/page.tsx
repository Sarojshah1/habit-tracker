import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Flame,
  Shield,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Award,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Habit Streak Tracker & Consistency Engine for Students",
  description:
    "Track daily habit streaks with real-time streak engines, 90-day consistency heatmaps, and smart streak freezes to protect your momentum during busy exam periods.",
  keywords: [
    "habit streak tracker",
    "consistency tracker",
    "streak freeze for students",
    "daily habit streaks",
    "habit consistency calendar",
    "study streak engine",
  ],
  alternates: {
    canonical: `${siteUrl}/features/streak-tracker`,
  },
  openGraph: {
    title: "Habit Streak Tracker & Consistency Engine | HabitTrack",
    description:
      "Build unstoppable momentum with real-time streak engines, 90-day heatmaps, and streak protection.",
    url: `${siteUrl}/features/streak-tracker`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "HabitTrack Streak Tracker",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "All",
      url: `${siteUrl}/features/streak-tracker`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Real-time streak calculation engine with 90-day GitHub-style discipline matrix and streak freeze protection.",
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Home",
          item: siteUrl,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Features",
          item: `${siteUrl}#features`,
        },
        {
          "@type": "ListItem",
          position: 3,
          name: "Streak Tracker",
          item: `${siteUrl}/features/streak-tracker`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "What happens if I get sick or have an intense exam day?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "HabitTrack features Streak Freezes. You can freeze your streak for up to 3 days to protect your historical momentum when life happens.",
          },
        },
        {
          "@type": "Question",
          name: "How is my streak calculated?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Streaks are computed dynamically from completion records in your local timezone. When you complete all scheduled habits for a day, your streak increment. If today is still active, your streak is preserved.",
          },
        },
      ],
    },
  ],
};

export default function StreakTrackerPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col selection:bg-forest-100 selection:text-forest-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="border-b border-gray-100/90 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link href="/" className="hover:text-forest-700 transition-colors">
              Home
            </Link>
            <Link href="/features/study-habit-tracker" className="hover:text-forest-700 transition-colors">
              Habit Tracker
            </Link>
            <Link href="/features/pomodoro-timer" className="hover:text-forest-700 transition-colors">
              Pomodoro Timer
            </Link>
            <Link href="/guides/how-to-build-study-habits" className="hover:text-forest-700 transition-colors">
              Student Guide
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-gray-900 rounded-xl"
            >
              Log In
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 text-sm font-semibold text-white bg-forest-700 hover:bg-forest-800 rounded-xl shadow-xs"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="py-20 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 border border-orange-100 text-orange-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Flame className="w-3.5 h-3.5 text-orange-600 fill-current" />
            Consistency Psychology
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Build Unstoppable Streaks. <br />
            <span className="text-forest-700">Never Break the Chain</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Harness the psychological power of loss aversion. Track consecutive days of learning,
            visualize your discipline in a 90-day matrix, and share milestones with peers.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated"
            >
              Start Your First Streak
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5 fill-current" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Live Dynamic Engine</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Real-time streak calculation derived mathematically from your historical completion database in your timezone.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 text-cyan-600 flex items-center justify-center mb-4">
                  <Shield className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Streak Freeze Protection</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Studying for finals or feeling unwell? Activate a Streak Freeze to safeguard your hard-earned streak without guilt.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">90-Day Heatmap Matrix</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  See your habits come alive in a GitHub-style 90-day consistency heatmap showing your intensity over time.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-forest-900 text-white px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black">
              Start building your streak today.
            </h2>
            <p className="mt-3 text-forest-200 text-sm">
              Free forever for students. Join thousands staying consistent every day.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm"
            >
              Start Free Account
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-8 px-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <p>© {new Date().getFullYear()} HabitTrack. Free productivity for students.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-forest-700">About</Link>
            <Link href="/privacy" className="hover:text-forest-700">Privacy</Link>
            <Link href="/terms" className="hover:text-forest-700">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
