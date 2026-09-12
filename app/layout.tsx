import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "HabitTrack — Build Habits That Shape Your Future",
  description:
    "A modern, productivity-focused habit tracking application designed for students to build streaks, schedule habits, focus, and achieve goals.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full font-sans bg-[#F8FAF9] text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
