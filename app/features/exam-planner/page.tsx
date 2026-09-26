import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Calendar,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  GraduationCap,
  Clock,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Exam Preparation Planner & Revision Tracker for Students",
  description:
    "Organize your exam preparation with automated countdowns, mock exam score analytics, daily revision time-blocking, and exam-focused study habits.",
  keywords: [
    "exam countdown planner",
    "student revision schedule",
    "mock exam score tracker",
    "exam preparation planner",
    "study routine for exams",
    "free finals prep app",
  ],
  alternates: {
    canonical: `${siteUrl}/features/exam-planner`,
  },
  openGraph: {
    title: "Exam Preparation Planner & Revision Tracker | HabitTrack",
    description:
      "Countdown to finals, track mock test scores, and schedule revision habits with HabitTrack.",
    url: `${siteUrl}/features/exam-planner`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "HabitTrack Exam Planner",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "All",
      url: `${siteUrl}/features/exam-planner`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "Student exam preparation suite with live countdowns, mock exam tracking, and habit integration.",
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
          name: "Exam Planner",
          item: `${siteUrl}/features/exam-planner`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Can I log multiple exam targets across different courses?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can add exam targets for all your semester courses with target scores, study schedules, and live countdowns.",
          },
        },
        {
          "@type": "Question",
          name: "Does HabitTrack track mock exam performance?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. You can record past paper and mock exam test scores, track score improvements over time, and adjust your revision priorities accordingly.",
          },
        },
      ],
    },
  ],
};

export default function ExamPlannerPage() {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider mb-6">
            <GraduationCap className="w-3.5 h-3.5 text-blue-600" />
            Finals &amp; Midterm Preparation
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            Conquer Your Exams with <br />
            <span className="text-forest-700">Structured Daily Revision</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate exam panic. Set target grades, track countdown days, schedule revision habits,
            and monitor your mock test scores all in one place.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated"
            >
              Start Free Exam Prep
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
                  <Clock className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Live Exam Countdown</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Keep your focus sharp with persistent countdown widgets showing exact days, hours, and revision windows.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <TrendingUp className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Mock Exam Analytics</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Log scores on practice tests and visualize your trajectory towards your target grade.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Revision Habit Stacks</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Pair exam goals directly with daily recall habits (e.g. 50 flashcards reviewed per day).
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-forest-900 text-white px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black">
              Ace your upcoming exams with confidence.
            </h2>
            <p className="mt-3 text-forest-200 text-sm">
              Free forever for students. No subscription, no paywalls.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm"
            >
              Plan Your Exam Prep Free
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
