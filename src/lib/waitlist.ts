// "Coming soon" plans on /pricing (Decision #133). Prices are planned, not
// offered: none of these can be bought, and the copy says so. Pro stays the
// only buyable plan.

export type WaitlistPlanId = "portfolio" | "property_record_plus" | "property_vault" | "contractor_pro";

export const WAITLIST_PLANS: {
  id: WaitlistPlanId;
  name: string;
  price: string;
  description: string;
  asksUnits: boolean;
}[] = [
  {
    id: "portfolio",
    name: "WholeClaim Portfolio",
    price: "From $99/month for up to 50 units",
    description:
      "For landlords, apartment owners, and property managers. Every building and unit in one place, move-in, move-out, and annual condition records with dated photos, and one claim file that can cover several units.",
    asksUnits: true,
  },
  {
    id: "property_record_plus",
    name: "Property Record+",
    price: "$29/year",
    description:
      "Document your home room by room before anything goes wrong, and keep it current as you repair and improve it.",
    asksUnits: false,
  },
  {
    id: "property_vault",
    name: "Property Vault",
    price: "$5/month",
    description: "Keep your claim file and property record organized after your claim closes.",
    asksUnits: false,
  },
  {
    id: "contractor_pro",
    name: "Contractor Pro",
    price: "$79/month",
    description:
      "Client folders, photo, estimate, and invoice uploads, and documentation requests, so everyone on the project works from the same records.",
    asksUnits: false,
  },
];

export const MAX_WAITLIST_UNITS = 100000;

export type WaitlistInput = { email: string; plan: string; units?: string | number | null };

export function validateWaitlistInput(
  input: WaitlistInput,
): { ok: true; email: string; plan: WaitlistPlanId; unitCount: number | null } | { ok: false; error: string } {
  const plan = WAITLIST_PLANS.find((p) => p.id === input.plan);
  if (!plan) return { ok: false, error: "Couldn't save that. Check the email and try again." };

  const email = String(input.email ?? "").trim().toLowerCase();
  if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  if (!plan.asksUnits) return { ok: true, email, plan: plan.id, unitCount: null };

  const raw = String(input.units ?? "").trim();
  const units = Number(raw);
  if (!raw || !Number.isInteger(units) || units < 1 || units > MAX_WAITLIST_UNITS) {
    return { ok: false, error: "Enter the number of units, as a whole number." };
  }
  return { ok: true, email, plan: plan.id, unitCount: units };
}
