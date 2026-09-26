import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { ShieldCheck } from "lucide-react";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Privacy Policy | HabitTrack",
  description:
    "HabitTrack student privacy policy. Transparent explanations of data protection, cookie security, zero third-party ads, and your right to export or delete data.",
  alternates: {
    canonical: `${siteUrl}/privacy`,
  },
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#F8FAF9] flex flex-col selection:bg-forest-100 selection:text-forest-900">
      <header className="border-b border-gray-100/90 bg-white/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <Logo size="md" href="/" />
          <nav className="flex items-center gap-6 text-sm font-semibold text-gray-600">
            <Link href="/" className="hover:text-forest-700">Home</Link>
            <Link href="/about" className="hover:text-forest-700">About</Link>
            <Link href="/login" className="hover:text-forest-700">Log In</Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 py-16 px-6 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-50 border border-forest-100 text-forest-800 text-xs font-bold uppercase mb-3">
            <ShieldCheck className="w-3.5 h-3.5 text-forest-600" />
            Student Data Protection
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Privacy Policy</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">Last updated: September 2026</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-bold text-gray-900">1. Information We Collect</h2>
          <p>
            We collect only the essential information needed to operate your habit tracking account:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>Account credentials (name, email address, salted bcrypt password hash).</li>
            <li>User-generated content: habits, completion logs, notes, exam schedules, and focus sessions.</li>
            <li>Technical preferences such as timezone and dark/light display mode.</li>
          </ul>

          <h2 className="text-xl font-bold text-gray-900 pt-3">2. How Your Data is Protected</h2>
          <p>
            Your habit and study data is strictly isolated to your authenticated account ID using cryptographic JSON Web Tokens stored in secure HTTP-only cookies. We do not use third-party tracking pixels, advertising networks, or sale of user data.
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-3">3. Your Right to Export and Delete</h2>
          <p>
            You have complete ownership of your academic records. Under your account Settings, you can download a full JSON export of all your habits, notes, and completions at any time, or permanently delete your account and all associated data with one click.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 px-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <p>© {new Date().getFullYear()} HabitTrack. Free productivity for students.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-forest-700">About</Link>
            <Link href="/terms" className="hover:text-forest-700">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
