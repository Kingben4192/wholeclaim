import { daysUntil } from "@/lib/deadlineMath";

// Shared between the claim list card (a footer band, one soonest deadline
// per claim) and the claim detail page's Deadline Tracker (one badge per
// row) -- same three states, same day-count math, styled by the caller via
// className rather than baked-in size/case so each surface's layout stays
// its own concern.
export function DeadlineBadge({
  dueDate,
  now,
  className,
}: {
  dueDate: string | null;
  now?: Date;
  className?: string;
}) {
  if (!dueDate) {
    return <span className={`text-ink/40 ${className ?? ""}`}>No deadline tracked</span>;
  }

  const days = daysUntil(dueDate, now);

  if (days < 0) {
    const n = Math.abs(days);
    return (
      <span className={`text-red-700 font-semibold ${className ?? ""}`}>
        Overdue — {n} day{n === 1 ? "" : "s"}
      </span>
    );
  }

  if (days === 0) {
    return <span className={`text-red-700 font-semibold ${className ?? ""}`}>Due today</span>;
  }

  return (
    <span className={`text-ledger font-semibold ${className ?? ""}`}>
      Next deadline — {days} day{days === 1 ? "" : "s"}
    </span>
  );
}
