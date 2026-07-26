"use client";

import { useState } from "react";
import { Download, Loader2, Check } from "lucide-react";

// Bug fix (2026-07-25): the plain <a href="/api/account/export"> this
// replaces triggers a real download correctly (confirmed: the file lands
// in iOS Downloads), but a navigation-triggered download gives the page
// zero visibility into the download's lifecycle -- there is no event to
// hook to show "it worked." On mobile Safari especially, nothing on
// screen changes, so a user has no way to tell whether the tap did
// anything at all. Switched to a fetch + blob download instead: the page
// now genuinely knows when the export finished (or failed) and can say
// so, not just fire-and-forget a browser-native download.
export function ExportDataButton() {
  const [status, setStatus] = useState<"idle" | "downloading" | "done" | "error">("idle");

  async function download() {
    setStatus("downloading");
    try {
      const res = await fetch("/api/account/export");
      if (!res.ok) {
        setStatus("error");
        return;
      }
      const blob = await res.blob();
      const filenameMatch = res.headers.get("content-disposition")?.match(/filename="([^"]+)"/);
      const filename = filenameMatch?.[1] ?? "wholeclaim-export.zip";

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
        className="inline-flex items-center gap-2 bg-ledger text-paper px-4 py-2 rounded-sm font-semibold text-sm disabled:opacity-50"
      >
        {status === "downloading" ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {status === "downloading" ? "Preparing your download…" : "Download my data"}
      </button>
      {status === "done" && (
        <p className="text-sm text-ledger font-semibold flex items-center gap-1.5">
          <Check size={15} /> Downloaded — check your device&apos;s Downloads folder.
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-700">Could not download your data. Try again.</p>
      )}
    </div>
  );
}
