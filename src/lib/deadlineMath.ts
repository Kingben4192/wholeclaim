// Shared day-count math for deadlines -- pure function, no formatting/copy
// baked in, so the claim card strip and the claim detail page's Deadline
// Tracker (previously showing a bare date with no urgency signal at all)
// compute the exact same number rather than two independent
// implementations drifting apart. All dates here are user-entered
// (`deadlines.due_date`), so this is plain arithmetic on a stored fact,
// not a derived/inferred value -- no DerivedValueNote labeling applies
// (same reasoning as Decision #56's surface 8, the deadline push
// notification, which was excluded for the identical reason).

const MS_PER_DAY = 1000 * 60 * 60 * 24;

// Positive = days remaining, 0 = due today, negative = days overdue.
export function daysUntil(dueDate: string, now: Date = new Date()): number {
  return Math.ceil((new Date(dueDate).getTime() - now.getTime()) / MS_PER_DAY);
}
