"use client";

import { useCallback, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { uploadEvidenceFile } from "@/lib/evidenceUploadClient";
import { EVIDENCE_STAGES } from "@/lib/evidenceStage";

interface EvidenceUploadProps {
  claimId: string;
  evidenceItemId?: string;
  // Promised-Document Tracker (2026-07-26) -- mutually exclusive with
  // evidenceItemId; marks a promised item received on successful upload.
  promisedItemId?: string;
  onUploadComplete?: () => void;
  // "inline" is the small per-row "Attach" pill; "block" is the larger
  // file picker used by the general (not linked to a checklist item) vault
  // upload section.
  variant?: "inline" | "block";
}

export function EvidenceUpload({
  claimId,
  evidenceItemId,
  promisedItemId,
  onUploadComplete,
  variant = "inline",
}: EvidenceUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evidenceStage, setEvidenceStage] = useState("");

  const handleFile = useCallback(
    async (file: File) => {
      setError(null);
      setUploading(true);
      // Size, type and limit checks (and their plain messages) live in
      // uploadEvidenceFile; an oversized file fails there before any upload.
      const result = await uploadEvidenceFile(file, {
        claimId,
        evidenceItemId,
        promisedItemId,
        evidenceStage,
      });
      setUploading(false);
      if (result.ok) {
        onUploadComplete?.();
      } else {
        setError(result.error);
      }
    },
    [claimId, evidenceItemId, promisedItemId, evidenceStage, onUploadComplete],
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
          <input
            {...inputProps}
            accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
            className="text-sm"
          />
        </label>
        <select
          value={evidenceStage}
          onChange={(e) => setEvidenceStage(e.target.value)}
          disabled={uploading}
          className="text-sm px-2 py-2 rounded-sm border border-ink/20 bg-white shrink-0"
          aria-label="Evidence stage (optional)"
        >
          <option value="">Not tagged</option>
          {EVIDENCE_STAGES.map((stage) => (
            <option key={stage} value={stage}>
              {stage}
            </option>
          ))}
        </select>
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
      <input
        {...inputProps}
        accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
        className="hidden"
      />
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
