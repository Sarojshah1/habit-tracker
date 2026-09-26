import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_APP_URL || "https://habit-tracker-seven-gold-53.vercel.app";

export const viewport: Viewport = {
  themeColor: "#1B4332",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "HabitTrack — Free Habit Tracker & Study Focus for Students",
    template: "%s | HabitTrack",
  },
  description:
    "HabitTrack is a free full-stack productivity web application designed for students. Schedule study routines, build streaks, focus with Pomodoro timers, and track performance analytics.",
  keywords: [
    "habit tracker",
    "habit tracker for students",
    "student habit tracking app",
    "study habit tracker",
    "daily routine tracker",
    "pomodoro timer for students",
    "study streak tracker",
    "academic habit planner",
    "student productivity dashboard",
    "free habit tracker web app",
    "habit calendar",
    "consistency tracker",
    "college productivity tool",
    "study notes and habits",
    "exam prep routine planner",
  ],
  authors: [{ name: "HabitTrack Team", url: siteUrl }],
  creator: "HabitTrack",
  publisher: "HabitTrack",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "HabitTrack — Free Habit Tracker & Study Focus for Students",
    description:
      "Build habits that shape your future. HabitTrack helps students maintain streaks, manage study schedules, and achieve academic goals with Pomodoro timers.",
    url: siteUrl,
    siteName: "HabitTrack",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "HabitTrack — Free Habit Tracker & Study Focus for Students",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HabitTrack — Student Habit Tracker & Study Focus",
    description:
      "Build habits that shape your future. Schedule routines, track streaks, and master deep focus for academic success.",
    images: ["/twitter-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  manifest: "/manifest.webmanifest",
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || undefined,
  },
};

import { ThemeProvider } from "@/lib/context/ThemeContext";
import { PwaRegister } from "@/components/pwa/PwaRegister";
import { PwaInstallPrompt } from "@/components/pwa/PwaInstallPrompt";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full scroll-smooth" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var t = localStorage.getItem('habittrack_theme') || 'system';
                  var isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
                  if (isDark) document.documentElement.classList.add('dark');
                  else document.documentElement.classList.remove('dark');
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="h-full font-sans bg-[#F8FAF9] dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased transition-colors duration-200">
        <ThemeProvider>
          {children}
          <PwaRegister />
          <PwaInstallPrompt />
        </ThemeProvider>
      </body>
    </html>
  );
}
