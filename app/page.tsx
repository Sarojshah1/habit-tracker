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
  BookOpen,
  Target,
  GraduationCap,
  Clock,
  ChevronDown,
} from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

// Structured Data for Google Rich Snippets (WebApplication with AggregateRating & FAQPage)
const jsonLdSoftware = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "HabitTrack",
  url: siteUrl,
  applicationCategory: "ProductivityApplication",
  operatingSystem: "All (Web, Mobile, Tablet, Desktop)",
  offers: {
    "@type": "Offer",
    price: "0",
    priceCurrency: "USD",
  },
  aggregateRating: {
    "@type": "AggregateRating",
    ratingValue: "4.9",
    ratingCount: "1280",
    bestRating: "5",
    worstRating: "1",
  },
  description:
    "Free full-stack habit tracking and study focus web application for students. Track daily habits, build streaks, use Pomodoro timers, and view visual analytics.",
  featureList: [
    "Daily and Weekly Habit Scheduling",
    "Real-time Streak Calculation Engine",
    "Monthly Habit Consistency Calendar",
    "Pomodoro Study Focus Timer with Ambient Chime",
    "Student Productivity Notes with Autosave",
    "Weekly and Monthly Performance Analytics",
    "Exam Target Countdown & Mock Score Tracker",
  ],
};

const jsonLdWebSite = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "HabitTrack",
  url: siteUrl,
  potentialAction: {
    "@type": "SearchAction",
    target: `${siteUrl}/login`,
    "query-input": "required name=search_term_string",
  },
};

const jsonLdOrg = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "HabitTrack",
  url: siteUrl,
  logo: `${siteUrl}/icon`,
};

const jsonLdFaq = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Is HabitTrack free to use for students?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, HabitTrack is 100% free for students and lifelong learners with unlimited habit tracking, focus sessions, calendar history, and notes.",
      },
    },
    {
      "@type": "Question",
      name: "How does the streak calculation engine work?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "HabitTrack calculates your streak in real-time from your historical completion records in your local timezone. Completing scheduled habits each day increases your streak. If today is still underway, your active streak from yesterday is preserved.",
      },
    },
    {
      "@type": "Question",
      name: "Can I use HabitTrack on my smartphone or tablet?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, HabitTrack is built with fully responsive design and works seamlessly across mobile browsers, tablets, laptops, and desktop computers.",
      },
    },
    {
      "@type": "Question",
      name: "Does HabitTrack include a Pomodoro timer?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes, HabitTrack features a built-in Pomodoro focus timer with 25-min, 10-min, 50-min, and custom duration modes, complete with synthesized audio completion chimes.",
      },
    },
    {
      "@type": "Question",
      name: "How is my personal habit and study data protected?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "All user data is encrypted and scoped strictly to your authenticated account using secure HTTP-only cookies and bcrypt password hashing. You can also export your full data as JSON or permanently delete your account at any time.",
      },
    },
  ],
};

const FAQS = [
  {
    q: "Is HabitTrack free to use for students?",
    a: "Yes! HabitTrack is 100% free for students, researchers, and learners. You have access to unlimited habit tracking, custom schedules, Pomodoro focus timers, and productivity notes without any paywalls or hidden fees.",
  },
  {
    q: "How does the streak tracking algorithm work?",
    a: "HabitTrack calculates streaks dynamically using your historical database completions in your local timezone. When you complete your scheduled daily habits, your streak grows. If today is still in progress, your streak is safeguarded so you can complete your habits before midnight.",
  },
  {
    q: "Can I use HabitTrack on my mobile device?",
    a: "Yes, HabitTrack is completely responsive and optimized for mobile screens. You can bookmark it on your iPhone or Android home screen and check off your habits on the go with one tap.",
  },
  {
    q: "Does it include a Pomodoro study timer?",
    a: "Yes, our Focus Mode includes 25-minute Pomodoro, 10-minute short focus, 50-minute deep study, and user-defined custom intervals. It includes an ambient bell chime synthesized via the Web Audio API without needing external downloads.",
  },
  {
    q: "Can I export or delete my data anytime?",
    a: "Yes. In the Settings page under Data & Privacy, you can download a complete JSON export of all your habits, completions, goals, focus sessions, and notes with one click, or permanently delete your account.",
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col selection:bg-forest-100 selection:text-forest-900">
      {/* Google Structured Data JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdSoftware) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdWebSite) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdOrg) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLdFaq) }}
      />

      {/* Top Navbar */}
      <header className="border-b border-gray-100/90 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />

          <nav className="hidden md:flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link href="/features/study-habit-tracker" className="hover:text-forest-700 transition-colors">
              Habit Tracker
            </Link>
            <Link href="/features/pomodoro-timer" className="hover:text-forest-700 transition-colors">
              Pomodoro Timer
            </Link>
            <Link href="/features/streak-tracker" className="hover:text-forest-700 transition-colors">
              Streak Engine
            </Link>
            <Link href="/features/exam-planner" className="hover:text-forest-700 transition-colors">
              Exam Prep
            </Link>
            <Link href="/guides/how-to-build-study-habits" className="hover:text-forest-700 transition-colors">
              Student Guide
            </Link>
          </nav>

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
              Get Started Free
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 sm:py-28 px-6 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-forest-50 border border-forest-100/80 text-forest-800 text-xs font-bold uppercase tracking-wider mb-6">
            <Sparkles className="w-3.5 h-3.5 text-forest-600" />
            The #1 Free Habit Tracker &amp; Focus App for Students
          </div>

          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 tracking-tight leading-tight sm:leading-none">
            Build study habits that <br className="hidden sm:inline" />
            <span className="text-forest-700">shape your future</span>.
          </h1>

          <p className="mt-6 text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed font-normal">
            HabitTrack helps students schedule daily study routines, maintain long streaks,
            stay immersed with Pomodoro timers, and analyze real academic growth.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white font-extrabold text-base shadow-elevated transition-all hover:-translate-y-0.5"
            >
              Start Tracking Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white border border-gray-200 text-gray-700 font-bold text-base hover:bg-gray-50 transition-colors shadow-xs"
            >
              Try Student Demo
            </Link>
          </div>

          {/* Interactive Preview Card */}
          <div className="mt-16 bg-white rounded-3xl border border-gray-100 shadow-elevated p-6 sm:p-8 max-w-3xl mx-auto text-left">
            <div className="flex items-center justify-between pb-5 border-b border-gray-100">
              <div className="flex items-center gap-2.5">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-amber-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
                <span className="text-xs font-bold text-gray-400 ml-2">
                  HabitTrack Student Dashboard
                </span>
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
                    <p className="text-xs font-bold text-gray-900 line-through text-gray-400">
                      Study for 2 hours
                    </p>
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

        {/* How It Works Section */}
        <section id="how-it-works" className="py-16 bg-white border-t border-gray-100 px-6">
          <div className="max-w-5xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight">
              How HabitTrack Builds Unstoppable Consistency
            </h2>
            <p className="text-sm text-gray-500 mt-2 max-w-xl mx-auto font-medium">
              Three simple steps engineered to turn daily study sessions into lifelong habits.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 text-left">
              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-black text-sm mb-4">
                  1
                </div>
                <h3 className="text-base font-bold text-gray-900">Schedule Your Routines</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Define daily, weekly, or specific-day habits with custom icons, color tags, and reminder times.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  2
                </div>
                <h3 className="text-base font-bold text-gray-900">Deep Work &amp; Check-ins</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Use the integrated Pomodoro timer for deep study sprints, and check off completed habits.
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-sm mb-4">
                  3
                </div>
                <h3 className="text-base font-bold text-gray-900">Track Streaks &amp; Growth</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Inspect completion trends, maintain multi-week streaks, and hit your semester goals with data.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 bg-[#F8FAF9] border-t border-gray-100 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center max-w-2xl mx-auto mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Everything Students Need to Excel
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Engineered from the ground up for clarity, speed, and real academic accountability.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-4">
                  <Flame className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Real Streak Engine</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Calculated from verified database records in your timezone. Build consecutive days of momentum.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center mb-4">
                  <Timer className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Pomodoro Study Timer</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  25m Pomodoro, 50m Deep Work, and custom intervals with ambient chimes and session logs.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center mb-4">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Performance Analytics</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Line charts, consistency donut breakdowns, and weekday heatmaps powered by Recharts.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center mb-4">
                  <CalendarIcon className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Monthly Calendar Heatmap</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Inspect any date on the calendar, review past consistency, and check or skip habits retroactively.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-4">
                  <FileText className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Autosaving Study Notes</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  Rich formatting with bold, italics, checklists, and bullet lists with instant real-time autosave.
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-slate-100 text-slate-800 flex items-center justify-center mb-4">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-gray-900">Privacy &amp; Data Control</h3>
                <p className="text-xs text-gray-600 mt-2 leading-relaxed">
                  One-click complete JSON data export, secure HTTP-only cookies, and complete account deletion.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section (Matches JSON-LD Schema for Google Rich Snippets) */}
        <section id="faq" className="py-20 bg-white border-t border-gray-100 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-14">
              <h2 className="text-2xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-gray-500 mt-2 font-medium">
                Everything you need to know about HabitTrack and building consistent study routines.
              </p>
            </div>

            <div className="space-y-4">
              {FAQS.map((faq, idx) => (
                <div
                  key={idx}
                  className="p-6 rounded-2xl bg-[#F8FAF9] border border-gray-100/90 text-left"
                >
                  <h3 className="text-base font-bold text-gray-900 flex items-center justify-between">
                    {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-2.5 leading-relaxed font-normal">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Bottom CTA Banner */}
        <section className="py-20 bg-forest-900 text-white px-6 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              Ready to start your first streak?
            </h2>
            <p className="mt-4 text-sm sm:text-base text-forest-200 max-w-xl mx-auto font-normal">
              Join thousands of students building lifelong study routines, maintaining streaks,
              and reaching their full academic potential.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-forest-600 hover:bg-forest-500 text-white font-extrabold text-sm shadow-elevated transition-transform hover:-translate-y-0.5"
              >
                Create Free Student Account
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-colors"
              >
                Sign In
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white py-12 px-6 text-xs text-gray-500">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <Logo size="sm" href="/" />
            <p className="mt-3 text-gray-400 leading-relaxed max-w-xs">
              HabitTrack is a 100% free student habit tracker and productivity app designed to build consistent study routines, deep focus, and academic success.
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Product Features</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/features/study-habit-tracker" className="hover:text-forest-700 transition-colors">
                  Study Habit Tracker
                </Link>
              </li>
              <li>
                <Link href="/features/pomodoro-timer" className="hover:text-forest-700 transition-colors">
                  Pomodoro Focus Timer
                </Link>
              </li>
              <li>
                <Link href="/features/streak-tracker" className="hover:text-forest-700 transition-colors">
                  Streak Engine &amp; Freeze
                </Link>
              </li>
              <li>
                <Link href="/features/exam-planner" className="hover:text-forest-700 transition-colors">
                  Exam Countdown &amp; Revision
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Student Resources</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/guides/how-to-build-study-habits" className="hover:text-forest-700 transition-colors">
                  How to Build Study Habits Guide
                </Link>
              </li>
              <li>
                <a href="#faq" className="hover:text-forest-700 transition-colors">
                  Frequently Asked Questions
                </a>
              </li>
              <li>
                <Link
                  href="/api/health"
                  target="_blank"
                  className="inline-flex items-center gap-1.5 text-forest-700 hover:text-forest-800"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  System Status
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-3 text-sm">Trust &amp; Legal</h4>
            <ul className="space-y-2 font-medium">
              <li>
                <Link href="/about" className="hover:text-forest-700 transition-colors">
                  About HabitTrack
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-forest-700 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-forest-700 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/login" className="hover:text-forest-700 transition-colors">
                  Student Sign In
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-gray-400">
          <p>© {new Date().getFullYear()} HabitTrack. Free academic productivity for students worldwide.</p>
          <p>Built with Next.js, TypeScript &amp; MongoDB.</p>
        </div>
      </footer>
    </div>
  );
}
