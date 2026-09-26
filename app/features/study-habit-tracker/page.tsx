import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  CheckCircle2,
  Flame,
  BarChart3,
  Calendar,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Target,
  BookOpen,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Study Habit Tracker for Students — Build Consistent Academic Routines",
  description:
    "Free online study habit tracker designed for high school and college students. Schedule daily study sessions, track streaks, organize subjects, and build lifelong academic habits.",
  keywords: [
    "study habit tracker",
    "habit tracker for students",
    "college routine planner",
    "academic habit tracker",
    "study streak tracker",
    "student productivity app",
    "free student habit tracker",
  ],
  alternates: {
    canonical: `${siteUrl}/features/study-habit-tracker`,
  },
  openGraph: {
    title: "Study Habit Tracker for Students | HabitTrack",
    description:
      "Schedule study sessions, build unstoppable streaks, and boost your GPA with HabitTrack.",
    url: `${siteUrl}/features/study-habit-tracker`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "HabitTrack Study Habit Tracker",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "All",
      url: `${siteUrl}/features/study-habit-tracker`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "The #1 habit tracking tool engineered for students. Build routines, eliminate procrastination, and maintain study streaks.",
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
          name: "Study Habit Tracker",
          item: `${siteUrl}/features/study-habit-tracker`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Why do students need a dedicated habit tracker instead of a regular todo list?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Todo lists focus on one-off chores. Academic excellence requires repeated systems. HabitTrack provides streak psychology, habit stacking, and consistency calendars that build automatic study routines.",
          },
        },
        {
          "@type": "Question",
          name: "Can I customize the frequency of my study habits?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can schedule daily study habits, specific days of the week (e.g., Monday-Wednesday-Friday physics prep), times per week, or custom intervals.",
          },
        },
      ],
    },
  ],
};

export default function StudyHabitTrackerPage() {
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
            <Link href="/features/pomodoro-timer" className="hover:text-forest-700 transition-colors">
              Pomodoro Timer
            </Link>
            <Link href="/features/streak-tracker" className="hover:text-forest-700 transition-colors">
              Streak Engine
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold uppercase tracking-wider mb-6">
            <GraduationCap className="w-3.5 h-3.5 text-forest-600" />
            Designed For Academic Excellence
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            The Study Habit Tracker <br />
            <span className="text-forest-700">Built for Serious Students</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Stop cramming at 2:00 AM. HabitTrack helps you structure recurring study blocks,
            monitor subject consistency, and achieve top grades with effortless daily habits.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated"
            >
              Start Free Student Account
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-black text-gray-900">
                Why Students Achieve More With HabitTrack
              </h2>
              <p className="text-gray-500 mt-2 text-sm">
                Built specifically around the cognitive science of student learning.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Flexible Study Schedules</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Schedule habits for specific lecture days, lab days, or weekend deep revision sessions.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Psychological Streak Momentum</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Watching your study streak count reach 7, 30, and 100 days turns studying into a rewarding compulsion.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Direct Academic Goal Alignment</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Link daily habits directly to semester milestones like &ldquo;Score 90% in Organic Chemistry&rdquo; or &ldquo;Finish Thesis&rdquo;.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-forest-900 text-white px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black">
              Ready to revolutionize your study habits?
            </h2>
            <p className="mt-3 text-forest-200 text-sm">
              Free forever for students. No subscription, no credit card required.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm"
            >
              Create Free Account
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
