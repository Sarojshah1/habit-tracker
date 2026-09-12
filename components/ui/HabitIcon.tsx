import React from "react";
import {
  Book,
  BookOpen,
  Droplet,
  Activity,
  Moon,
  CheckCircle,
  Brain,
  Flame,
  Heart,
  Laptop,
  Code,
  Dumbbell,
  Coffee,
  Sparkles,
  Target,
  Sun,
  Pencil,
  Clock,
  Compass,
  Smile,
  LucideIcon,
} from "lucide-react";

export const ICON_MAP: Record<string, LucideIcon> = {
  "book-open": BookOpen,
  book: Book,
  droplet: Droplet,
  activity: Activity,
  moon: Moon,
  "check-circle": CheckCircle,
  brain: Brain,
  flame: Flame,
  heart: Heart,
  laptop: Laptop,
  code: Code,
  dumbbell: Dumbbell,
  coffee: Coffee,
  sparkles: Sparkles,
  target: Target,
  sun: Sun,
  pencil: Pencil,
  clock: Clock,
  compass: Compass,
  smile: Smile,
};

interface HabitIconProps {
  name?: string;
  color?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function HabitIcon({
  name = "check-circle",
  color = "#2D6A4F",
  size = "md",
  className = "",
}: HabitIconProps) {
  const IconComponent = ICON_MAP[name] || CheckCircle;

  const sizeClasses = {
    sm: "w-8 h-8 rounded-lg p-1.5",
    md: "w-10 h-10 rounded-xl p-2",
    lg: "w-12 h-12 rounded-2xl p-2.5",
  };

  const iconSizes = {
    sm: "w-5 h-5",
    md: "w-6 h-6",
    lg: "w-7 h-7",
  };

  return (
    <div
      className={`flex items-center justify-center transition-transform ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: `${color}18`, // 10% opacity tint
        color: color,
      }}
    >
      <IconComponent className={iconSizes[size]} strokeWidth={2.2} />
    </div>
  );
}
