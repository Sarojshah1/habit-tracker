import mongoose from "mongoose";
import { Habit } from "@/lib/models/Habit";
import { HabitCompletion } from "@/lib/models/HabitCompletion";
import { FocusSession } from "@/lib/models/FocusSession";
import { User } from "@/lib/models/User";
import { calculateOverallStreaks, calculateHabitStats } from "./streak";
import { getUserTodayDateString } from "@/lib/utils/date";

export interface BadgeDefinition {
  id: string;
  title: string;
  description: string;
  category: "consistency" | "behavior" | "focus" | "resilience";
  tier: "bronze" | "silver" | "gold" | "diamond";
  icon: string; // emoji or icon name
  maxProgress: number;
}

export interface UserBadgeProgress extends BadgeDefinition {
  unlocked: boolean;
  currentProgress: number;
  unlockedAt?: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "Build an active 7-day streak on any habit.",
    category: "consistency",
    tier: "bronze",
    icon: "🔥",
    maxProgress: 7,
  },
  {
    id: "fortnight_focus",
    title: "Fortnight Focus",
    description: "Maintain a consistent 14-day streak.",
    category: "consistency",
    tier: "silver",
    icon: "⚡",
    maxProgress: 14,
  },
  {
    id: "monthly_master",
    title: "Monthly Master",
    description: "Achieve a formidable 30-day streak on any habit.",
    category: "consistency",
    tier: "gold",
    icon: "👑",
    maxProgress: 30,
  },
  {
    id: "micro_momentum",
    title: "2-Minute Rule Savior",
    description: "Saved a streak by logging a 2-minute micro version on a tough day.",
    category: "behavior",
    tier: "bronze",
    icon: "⚡",
    maxProgress: 1,
  },
  {
    id: "chain_builder",
    title: "Chain Builder",
    description: "Create and complete a stacked anchor habit sequence.",
    category: "behavior",
    tier: "silver",
    icon: "🔗",
    maxProgress: 1,
  },
  {
    id: "ice_age",
    title: "Frost Shield",
    description: "Use a streak freeze to shield your momentum from zero-days.",
    category: "resilience",
    tier: "bronze",
    icon: "🧊",
    maxProgress: 1,
  },
  {
    id: "half_centurion",
    title: "Half Centurion",
    description: "Log 50 total habit completions.",
    category: "consistency",
    tier: "silver",
    icon: "🥉",
    maxProgress: 50,
  },
  {
    id: "centurion",
    title: "Centurion Legend",
    description: "Log 100 total habit completions across all habits.",
    category: "consistency",
    tier: "diamond",
    icon: "🏆",
    maxProgress: 100,
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Complete any habit before 8:00 AM local time.",
    category: "behavior",
    tier: "bronze",
    icon: "🌅",
    maxProgress: 1,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete a habit after 10:00 PM to finish strong.",
    category: "behavior",
    tier: "bronze",
    icon: "🦉",
    maxProgress: 1,
  },
  {
    id: "focus_scholar",
    title: "Focus Scholar",
    description: "Complete 10 deep focus study sessions.",
    category: "focus",
    tier: "gold",
    icon: "🧠",
    maxProgress: 10,
  },
];

export async function getUserBadges(userId: string | mongoose.Types.ObjectId, timezone: string = "UTC"): Promise<{
  badges: UserBadgeProgress[];
  unlockedCount: number;
  totalCount: number;
  level: number;
  xp: number;
  nextLevelXp: number;
}> {
  const userObjId = typeof userId === "string" ? new mongoose.Types.ObjectId(userId) : userId;
  const todayStr = getUserTodayDateString(timezone);

  const [habits, completions, focusSessions, user] = await Promise.all([
    Habit.find({ userId: userObjId }).lean(),
    HabitCompletion.find({ userId: userObjId }).sort({ completedAt: -1 }).lean(),
    FocusSession.find({ userId: userObjId, status: "completed" }).lean(),
    User.findById(userObjId).select("streakFreezes").lean(),
  ]);

  // Overall streak metrics
  const completedCompletions = completions.filter((c: any) => c.status === "completed");
  const completedDates = Array.from(new Set(completedCompletions.map((c: any) => c.date)));
  const frozenDates = Array.from(
    new Set([
      ...completions.filter((c: any) => c.status === "frozen").map((c: any) => c.date),
      ...(user?.streakFreezes?.usedDates || []),
    ])
  );
  const overallStreaks = calculateOverallStreaks(completedDates, todayStr, frozenDates);

  // Highest streak on any individual habit
  let bestHabitStreak = 0;
  for (const h of habits) {
    const stats = calculateHabitStats(h, completions as any, todayStr, timezone);
    if (stats.currentStreak > bestHabitStreak) bestHabitStreak = stats.currentStreak;
    if (stats.bestStreak > bestHabitStreak) bestHabitStreak = stats.bestStreak;
  }
  const maxStreak = Math.max(bestHabitStreak, overallStreaks.longestStreak);

  // Total completions count
  const totalCompletions = completedCompletions.length;

  // Micro habits logged
  const microCompletions = completions.filter(
    (c: any) => c.status === "completed" && (c.completionType === "micro" || c.notes?.includes("[micro]"))
  );

  // Stacked habits completed
  const stackedHabitIds = new Set(
    habits.filter((h: any) => h.habitStackAfterHabitId).map((h: any) => h._id.toString())
  );
  const stackedCompletions = completions.filter(
    (c: any) => c.status === "completed" && stackedHabitIds.has(c.habitId.toString())
  );

  // Frozen used
  const usedFreezeCount = user?.streakFreezes?.usedDates?.length ?? 0;
  const frozenCompletions = completions.filter((c: any) => c.status === "frozen");
  const totalFreezesUsed = Math.max(usedFreezeCount, frozenCompletions.length);

  // Time-based completions
  let hasEarlyBird = false;
  let hasNightOwl = false;

  for (const c of completedCompletions) {
    if (c.completedAt) {
      try {
        const localTimeStr = new Date(c.completedAt).toLocaleTimeString("en-US", {
          timeZone: timezone,
          hour12: false,
          hour: "2-digit",
        });
        const hour = parseInt(localTimeStr, 10);
        if (!isNaN(hour)) {
          if (hour < 8) hasEarlyBird = true;
          if (hour >= 22) hasNightOwl = true;
        }
      } catch (e) {
        // Fallback to UTC
        const hour = new Date(c.completedAt).getUTCHours();
        if (hour < 8) hasEarlyBird = true;
        if (hour >= 22) hasNightOwl = true;
      }
    }
  }

  // Calculate Badges Progress
  const badges: UserBadgeProgress[] = BADGE_DEFINITIONS.map((b) => {
    let currentProgress = 0;
    let unlocked = false;

    switch (b.id) {
      case "week_warrior":
        currentProgress = Math.min(b.maxProgress, maxStreak);
        unlocked = maxStreak >= 7;
        break;
      case "fortnight_focus":
        currentProgress = Math.min(b.maxProgress, maxStreak);
        unlocked = maxStreak >= 14;
        break;
      case "monthly_master":
        currentProgress = Math.min(b.maxProgress, maxStreak);
        unlocked = maxStreak >= 30;
        break;
      case "micro_momentum":
        currentProgress = Math.min(b.maxProgress, microCompletions.length);
        unlocked = microCompletions.length >= 1;
        break;
      case "chain_builder":
        currentProgress = Math.min(b.maxProgress, stackedCompletions.length);
        unlocked = stackedCompletions.length >= 1;
        break;
      case "ice_age":
        currentProgress = Math.min(b.maxProgress, totalFreezesUsed);
        unlocked = totalFreezesUsed >= 1;
        break;
      case "half_centurion":
        currentProgress = Math.min(b.maxProgress, totalCompletions);
        unlocked = totalCompletions >= 50;
        break;
      case "centurion":
        currentProgress = Math.min(b.maxProgress, totalCompletions);
        unlocked = totalCompletions >= 100;
        break;
      case "early_bird":
        currentProgress = hasEarlyBird ? 1 : 0;
        unlocked = hasEarlyBird;
        break;
      case "night_owl":
        currentProgress = hasNightOwl ? 1 : 0;
        unlocked = hasNightOwl;
        break;
      case "focus_scholar":
        currentProgress = Math.min(b.maxProgress, focusSessions.length);
        unlocked = focusSessions.length >= 10;
        break;
      default:
        currentProgress = 0;
        unlocked = false;
    }

    return {
      ...b,
      currentProgress,
      unlocked,
    };
  });

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  // XP & Level calculation:
  // Each completion = 15 XP
  // Each focus session = 25 XP
  // Each unlocked badge = 100 XP
  const xp = totalCompletions * 15 + focusSessions.length * 25 + unlockedCount * 100;
  // Level curve: 200 XP per level
  const level = Math.floor(xp / 200) + 1;
  const nextLevelXp = level * 200;

  return {
    badges,
    unlockedCount,
    totalCount: BADGE_DEFINITIONS.length,
    level,
    xp,
    nextLevelXp,
  };
}
