// Loss-of-Use Tracker (Roadmap Phase 1, Pro). Pure deterministic summary —
// same discipline as claimHealth.ts (Decision #9): the tracker logs real
// entries a user typed in, and this only ever sums numbers already on
// file. No AI, no invented mileage rates or per-diems (Decision #26/27) —
// the user enters a dollar amount for every category, including mileage,
// themselves.

export const LOSS_OF_USE_CATEGORIES = [
  { value: "hotel", label: "Hotel / temporary housing" },
  { value: "meals", label: "Meals" },
  { value: "laundry", label: "Laundry" },
  { value: "storage", label: "Storage" },
  { value: "mileage", label: "Mileage" },
  { value: "pet_boarding", label: "Pet boarding" },
  { value: "other", label: "Other" },
] as const;

export type LossOfUseCategory = (typeof LOSS_OF_USE_CATEGORIES)[number]["value"];

export function categoryLabel(value: string): string {
  return LOSS_OF_USE_CATEGORIES.find((c) => c.value === value)?.label ?? value;
}

export type LossOfUseExpense = {
  id: string;
  date: string;
  category: string;
  amount: number;
  description: string | null;
};

export type LossOfUseSummary = {
  total: number;
  byCategory: { category: string; label: string; total: number; count: number }[];
};

export function computeLossOfUseSummary(expenses: LossOfUseExpense[]): LossOfUseSummary {
  const totals = new Map<string, { total: number; count: number }>();

  for (const e of expenses) {
    const existing = totals.get(e.category) ?? { total: 0, count: 0 };
    existing.total += e.amount;
    existing.count += 1;
    totals.set(e.category, existing);
  }

  const byCategory = Array.from(totals.entries())
    .map(([category, { total, count }]) => ({
      category,
      label: categoryLabel(category),
      total,
      count,
    }))
    .sort((a, b) => b.total - a.total);

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  return { total, byCategory };
}
