// Free-tier AI analysis counter. count is the real value
// getFreeAiUsageCount() read server-side in claim/[id]/page.tsx -- the
// same query checkUsageGate enforces against, not a second count that
// could drift. null means Pro (no counter shown at all). Server-rendered,
// no client state: AIToolCard's router.refresh() after a successful run
// re-runs the page's server-side count and this re-renders with it.
export function FreeAiUsageBadge({ count, max }: { count: number | null; max: number }) {
  if (count === null) return null;

  return (
    <p className="text-xs font-mono text-ink/50 mb-3">
      {count} of {max} free AI analyses used
    </p>
  );
}
