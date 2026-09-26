import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import {
  Timer,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  Zap,
  Volume2,
  Maximize2,
  Flame,
  Brain,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Free Pomodoro Timer for Students with Streak Tracking",
  description:
    "Free online Pomodoro timer designed for focused study sessions. Features 25/5 intervals, ambient audio chimes, full-screen mode, and automated daily study streak tracking.",
  keywords: [
    "pomodoro timer for students",
    "study timer with streaks",
    "pomodoro study timer",
    "25 5 timer",
    "pomodoro technique app",
    "deep study timer",
    "free student focus timer",
  ],
  alternates: {
    canonical: `${siteUrl}/features/pomodoro-timer`,
  },
  openGraph: {
    title: "Pomodoro Study Timer with Streak Tracking | HabitTrack",
    description:
      "Enter deep study flow with synthesized audio chimes, customizable intervals, and streak rewards.",
    url: `${siteUrl}/features/pomodoro-timer`,
  },
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "HabitTrack Pomodoro Focus Timer",
      applicationCategory: "ProductivityApplication",
      operatingSystem: "All",
      url: `${siteUrl}/features/pomodoro-timer`,
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "USD",
      },
      description:
        "High-performance study focus timer for students with synthesized Web Audio bells and task linking.",
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
          name: "Pomodoro Timer",
          item: `${siteUrl}/features/pomodoro-timer`,
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "How does the Pomodoro Technique help student learning?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "The Pomodoro Technique breaks long study marathons into 25-minute sprints followed by 5-minute cognitive breaks. This prevents mental fatigue and maximizes working memory retention during exam prep.",
          },
        },
        {
          "@type": "Question",
          name: "Does the timer record my daily focus hours automatically?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Yes. Completed focus sessions automatically log into your HabitTrack analytics, updating your daily productivity score and streak metrics.",
          },
        },
      ],
    },
  ],
};

export default function PomodoroTimerPage() {
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
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Brain className="w-3.5 h-3.5 text-emerald-600" />
            Distraction-Free Deep Work
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight">
            The Ultimate Pomodoro Timer <br />
            <span className="text-forest-700">for Deep Student Focus</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
            Eliminate phone distractions and study fatigue. Enjoy crisp Web Audio completion bells,
            customizable interval modes, and automatic session recording into your academic habits.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated"
            >
              Try Pomodoro Mode Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </section>

        {/* Feature Grid */}
        <section className="py-16 bg-white border-y border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-700 flex items-center justify-center mb-4">
                  <Volume2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Synthesized Audio Bell</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Gentle, synthesized meditation chime created with the native Web Audio API. No annoying loud buzzers.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <Maximize2 className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Immersive Full-Screen</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Enter full-screen study mode to hide open tabs and social media notifications while you study.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-900">Automatic Streak Sync</h3>
                <p className="text-xs sm:text-sm text-gray-600 mt-2 leading-relaxed">
                  Completing your target focus minutes marks related study habits as complete and powers your streak.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 bg-forest-900 text-white px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-black">
              Ready to enter your highest focus state?
            </h2>
            <p className="mt-3 text-forest-200 text-sm">
              Free forever for students. Join thousands mastering deep work.
            </p>
            <Link
              href="/register"
              className="mt-6 inline-flex items-center gap-2 px-8 py-3.5 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-sm"
            >
              Start Free Focus Session
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
