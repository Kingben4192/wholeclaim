// Shared relative-time formatting -- pure functions, no React/DOM
// dependency, so this is importable server-side later by the notification
// email system as well as client components. Operates on plain stored
// timestamps (entry dates, upload dates); this is reformatting, not
// inference, so no derivation labeling applies.

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Compact inline form: "today", "2d", "3mo", "1y".
export function relativeAge(date: string, now: Date = new Date()): string {
  const days = Math.max(0, Math.floor((now.getTime() - new Date(date).getTime()) / MS_PER_DAY));
  if (days === 0) return "today";
  if (days < 30) return `${days}d`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo`;
  return `${Math.floor(months / 12)}y`;
}

export type DateBucket = "Today" | "Past 7 Days" | "Past 30 Days" | "Older";

export const BUCKET_ORDER: DateBucket[] = ["Today", "Past 7 Days", "Past 30 Days", "Older"];

export function bucketLabel(date: string, now: Date = new Date()): DateBucket {
  const days = Math.floor((now.getTime() - new Date(date).getTime()) / MS_PER_DAY);
  if (days <= 0) return "Today";
  if (days <= 7) return "Past 7 Days";
  if (days <= 30) return "Past 30 Days";
  return "Older";
}
