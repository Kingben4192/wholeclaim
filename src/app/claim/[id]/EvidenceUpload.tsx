"use client";

import { useCallback, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { uploadFile } from "../actions";

interface EvidenceUploadProps {
  claimId: string;
  evidenceItemId?: string;
  onUploadComplete?: () => void;
  // "inline" is the small per-row "Attach" pill; "block" is the larger
  // file picker used by the general (not linked to a checklist item) vault
  // upload section.
  variant?: "inline" | "block";
}

// Matches the server action's own cap (src/app/claim/actions.ts) — checked
// here too so oversized files fail fast without a round trip.
const MAX_FILE_BYTES = 15 * 1024 * 1024;

export function EvidenceUpload({
  claimId,
  evidenceItemId,
  onUploadComplete,
  variant = "inline",
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);

      if (file.size > MAX_FILE_BYTES) {
        setError("File is larger than 15MB.");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);
        await uploadFile(claimId, evidenceItemId ?? null, formData);
        onUploadComplete?.();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [claimId, evidenceItemId, onUploadComplete],
  );

  const inputProps = {
    type: "file" as const,
    disabled: uploading,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      e.target.value = "";
    },
  };

  if (variant === "block") {
    return (
      <div className="flex gap-2 items-start">
        <label className="flex-1 text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white file:mr-3 file:px-2 file:py-1 file:rounded-sm file:border-0 file:bg-ledger file:text-paper file:text-xs file:font-semibold cursor-pointer flex items-center gap-2">
          <input {...inputProps} accept="image/*,application/pdf" className="text-sm" />
        </label>
        {uploading && (
          <span className="inline-flex items-center gap-1 text-xs text-ink/50 shrink-0 py-2">
            <Loader2 size={13} className="animate-spin" /> Uploading…
          </span>
        )}
        {error && (
          <span className="text-xs text-red-700 shrink-0 py-2">{error}</span>
        )}
      </div>
    );
  }

  return (
    <label className="inline-flex items-center gap-1 text-xs font-semibold text-ledger cursor-pointer shrink-0">
      <input {...inputProps} className="hidden" />
      {uploading ? (
        <Loader2 size={13} className="animate-spin" />
      ) : (
        <Paperclip size={13} />
      )}
      {uploading ? "Uploading…" : "Attach"}
      {error && <span className="text-red-700 font-normal">{error}</span>}
    </label>
  );
}
