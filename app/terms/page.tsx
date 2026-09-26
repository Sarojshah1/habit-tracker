import React from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { Logo } from "@/components/ui/Logo";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const metadata: Metadata = {
  title: "Terms of Service | HabitTrack",
  description: "Terms of Service for HabitTrack student productivity application.",
  alternates: {
    canonical: `${siteUrl}/terms`,
  },
};

export default function TermsPage() {
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
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900">Terms of Service</h1>
          <p className="mt-2 text-sm text-gray-500 font-medium">Last updated: September 2026</p>
        </div>

        <div className="bg-white border border-gray-100 rounded-3xl p-8 sm:p-12 shadow-xs space-y-6 text-gray-700 leading-relaxed text-sm sm:text-base">
          <h2 className="text-xl font-bold text-gray-900">1. Acceptance of Terms</h2>
          <p>
            By using HabitTrack, you agree to these terms. HabitTrack is provided as a free productivity tool for students, researchers, and lifelong learners to track personal habits and manage academic schedules.
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-3">2. Acceptable Use</h2>
          <p>
            You agree not to abuse or attempt unauthorized access to the application, disrupt serverless operations, or deploy automated scraping bots against our API endpoints.
          </p>

          <h2 className="text-xl font-bold text-gray-900 pt-3">3. Service Availability</h2>
          <p>
            We strive for 99.9% uptime. While we provide automated database backups and data export tools, HabitTrack is provided on an &ldquo;as is&rdquo; basis for personal study and habit organization.
          </p>
        </div>
      </main>

      <footer className="border-t border-gray-100 bg-white py-8 px-6 text-xs text-gray-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <Logo size="sm" href="/" />
          <p>© {new Date().getFullYear()} HabitTrack. Free productivity for students.</p>
          <div className="flex gap-4">
            <Link href="/about" className="hover:text-forest-700">About</Link>
            <Link href="/privacy" className="hover:text-forest-700">Privacy</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
