// Decision #70 — persistent (sticky) claim-context bar. Shows only the
// three fields the page's own existing <header> already displays (carrier,
// claim number, damage category) -- no address field exists anywhere in
// the claims schema, so the spec's own example ("Claim: 123 Main St —
// Water Damage") isn't literally buildable from real data, and the
// decision's guardrail ("only display user-entered claim information, no
// external claim interpretation") rules out inventing or summarizing
// anything beyond what's already stored. The new capability here is the
// stickiness itself -- the existing header is plain in-flow content and
// scrolls away on this long page; this bar stays visible throughout.
export function ClaimContextBar({
  carrier,
  claimNumber,
  damageCategory,
}: {
  carrier: string | null;
  claimNumber: string | null;
  damageCategory: string | null;
}) {
  return (
    <div className="sticky top-0 z-10 -mx-6 sm:mx-0 px-6 sm:px-3 py-2 bg-paper/95 backdrop-blur-sm border-b border-ink/10 sm:rounded-sm sm:border">
      <p className="text-xs font-mono text-ink/60 truncate">
        Claim: {carrier || "Unnamed carrier"} — {damageCategory || "damage type not set"}
        {claimNumber && <span className="text-ink/40"> · {claimNumber}</span>}
      </p>
    </div>
  );
}
