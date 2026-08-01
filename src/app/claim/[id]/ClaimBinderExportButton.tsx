"use client";

import { useState } from "react";
import { FileDown, Loader2, Check } from "lucide-react";

// Claim Grade A-Action-Center (approved 2026-08-01). Same fetch + blob
// download pattern as ExportDataButton.tsx -- a plain <a href> gives the
// page no visibility into whether the download actually happened.
export function ClaimBinderExportButton({ claimId }: { claimId: string }) {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "error">("idle");

  async function download() {
    setStatus("downloading");
    try {
      const res = await fetch(`/api/claim/${claimId}/export-pdf`);
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      const filenameMatch = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "claim-binder.pdf";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setStatus("done");
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="flex flex-col gap-2 items-start">
      <button
        type="button"
        onClick={download}
        disabled={status === "downloading"}
        className="inline-flex items-center gap-2 border border-ink/20 px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
      >
        {status === "downloading" ? <Loader2 size={16} className="animate-spin" /> : <FileDown size={16} />}
        {status === "downloading" ? "Preparing your binder…" : "Download claim binder (PDF)"}
      </button>
      {status === "done" && (
        <p className="text-sm text-ledger font-semibold flex items-center gap-1.5">
          <Check size={15} /> Downloaded — check your device&apos;s Downloads folder.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700">Could not build your binder. Try again.</p>
      )}
    </div>
  );
}
