/**
 * Timezone-aware date utilities for HabitTrack
 */

export function getUserTodayDateString(timezone: string = "UTC", dateInput: Date = new Date()): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone || "UTC",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(dateInput); // Returns YYYY-MM-DD
  } catch (e) {
    // Fallback if timezone string is invalid
    return dateInput.toISOString().split("T")[0];
  }
}

export function getUserDayOfWeek(dateStr: string, timezone: string = "UTC"): number {
  // Parse dateStr (YYYY-MM-DD) safely
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return date.getUTCDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
}

export function formatFriendlyDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}

export function getDaysAgo(days: number, timezone: string = "UTC"): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return getUserTodayDateString(timezone, date);
}

export function getDateDaysAgoFrom(baseDateStr: string, days: number): string {
  const [year, month, day] = baseDateStr.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day - days, 12, 0, 0));
  return date.toISOString().split("T")[0];
}

export function getDatesBetween(startDateStr: string, endDateStr: string): string[] {
  const dates: string[] = [];
  let curr = new Date(startDateStr + "T00:00:00Z");
  const end = new Date(endDateStr + "T00:00:00Z");

  while (curr <= end) {
    dates.push(curr.toISOString().split("T")[0]);
    curr = new Date(curr.getTime() + 24 * 60 * 60 * 1000);
  }

  return dates;
}

export function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good Morning";
  if (hour < 18) return "Good Afternoon";
  return "Good Evening";
}
