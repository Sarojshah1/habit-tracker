import React from "react";
import Link from "next/link";

interface LogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

export function Logo({ size = "md", href = "/dashboard" }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-lg",
    md: "text-xl",
    lg: "text-2xl",
  };

  const content = (
    <div className="flex items-center gap-2.5 font-bold tracking-tight select-none">
      <div
        className={`${iconSizes[size]} rounded-xl bg-forest-700 flex items-center justify-center text-white shadow-sm ring-2 ring-forest-600/20`}
      >
        {/* Leaf & Checkmark SVG */}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-4/5 h-4/5"
        >
          {/* Leaf outline with embedded check */}
          <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="m7.5 12.5 3 3 6-6" />
        </svg>
      </div>
      <span className={`${textSizes[size]} text-gray-900 font-extrabold flex items-center`}>
        Habit<span className="text-forest-700 font-black">Track</span>
      </span>
    </div>
  );

  if (href) {
    return <Link href={href} className="inline-block transition-opacity hover:opacity-90">{content}</Link>;
  }

  return content;
}
