import type { StorageStatus } from "@/lib/storageStatus";

// Reads the exact same usedBytes/limitBytes/status the upload gate
// (checkUploadAccess -> computeFreeStorageStatus/computeProStorageStatus)
// computed server-side for this request -- same discipline as
// FreeAiUsageBadge's relationship to checkUsageGate, one source, not a
// UI-side estimate (Decision #88 / STORAGE_ENFORCEMENT_BRIEF.md step 5).

function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) return `${gb.toFixed(gb >= 10 ? 0 : 1)}GB`;
  const mb = bytes / (1024 * 1024);
  return `${Math.max(1, Math.round(mb))}MB`;
}

// StorageStatus (normal/warning/over_limit/blocked) is the enforcement
// source of truth -- coarse by design, since it drives what the gate
// allows. The 80%/95% visual staging the brief asks for is a presentation
// nuance layered on top here, not a second enforcement concept.
type Urgency = "normal" | "warning" | "critical" | "blocked";

function urgencyFor(status: StorageStatus, percent: number): Urgency {
  if (status === "blocked") return "blocked";
  if (status === "over_limit") return "critical";
  if (percent >= 95) return "critical";
  if (percent >= 80) return "warning";
  return "normal";
}

const BAR_COLOR: Record<Urgency, string> = {
  normal: "bg-ledger",
  warning: "bg-amber-500",
  critical: "bg-orange-600",
  blocked: "bg-red-600",
};

const MESSAGE: Record<StorageStatus, string | null> = {
  normal: null,
  warning: "Approaching your storage limit.",
  over_limit: "Over your storage limit — using emergency buffer space.",
  blocked: "Storage limit reached. Delete files or upgrade to free up space.",
};

export function StorageUsageBar({
  usedBytes,
  limitBytes,
  status,
  bindingLimit,
}: {
  usedBytes: number;
  limitBytes: number;
  status: StorageStatus;
  bindingLimit: "claim" | "account";
}) {
  const percent = Math.min(100, Math.round((usedBytes / limitBytes) * 100));
  const urgency = urgencyFor(status, percent);
  const message = MESSAGE[status];

  return (
    <div className="mb-3">
      <div className="flex items-center justify-between text-xs font-mono text-ink/50 mb-1">
        <span>
          {formatBytes(usedBytes)} / {formatBytes(limitBytes)} used
          {" — "}
          {bindingLimit === "claim" ? "this claim" : "account total"}
        </span>
        <span>{percent}%</span>
      </div>
      <div className="h-1.5 w-full bg-ink/10 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-[width] ${BAR_COLOR[urgency]}`}
          style={{ width: `${percent}%` }}
        />
      </div>
      {message && <p className="text-xs text-ink/60 mt-1">{message}</p>}
    </div>
  );
}
