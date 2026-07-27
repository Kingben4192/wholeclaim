// Decision #75. The one place that decides what a claim is called on
// screen. Every surface that renders a claim's name calls this — do not
// reimplement the label/fallback branch locally; that duplication is
// exactly what let #70's context bar and the /claim list page drift out
// of sync with each other in the first place.
export function getClaimDisplayTitle(claim: { label: string | null; created_at: string }): string {
  if (claim.label) return claim.label;
  return `Claim created ${new Date(claim.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}`;
}
