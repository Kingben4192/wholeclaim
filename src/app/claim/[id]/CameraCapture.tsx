"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, FolderOpen, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/app/claim/actions";
import { EVIDENCE_STAGES } from "@/lib/evidenceStage";

interface PendingCapture {
  id: string;
  file: File;
  previewUrl: string;
}

interface CameraCaptureProps {
  claimId: string;
  evidenceItemId?: string;
  onUploadComplete?: () => void;
}

type BatchSummary = { succeeded: number; failed: number; failedMessages: string[] };

export default function CameraCapture({ claimId, evidenceItemId, onUploadComplete }: CameraCaptureProps) {
  const [pending, setPending] = useState<PendingCapture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [evidenceStage, setEvidenceStage] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: PendingCapture[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    // A fresh batch is being staged -- the last summary now describes an
    // older, already-cleared batch, not what's about to be uploaded.
    setSummary(null);
    setPending((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Fix (2026-08-04): the previous version wrapped the whole loop in one
  // try/catch -- a single failure (wrong file type, oversized, storage
  // limit reached, all of which uploadFile already reports with a real,
  // specific message) stopped the loop immediately, silently abandoning
  // every file after it, and collapsed whatever happened into one generic
  // "Some photos failed to upload." It also never cleared already-
  // succeeded items from `pending` on a partial failure, risking a
  // duplicate upload if the user just hit "Upload" again. Each file is
  // now attempted independently; only the ones that actually succeeded
  // are cleared, failed ones stay staged for a retry without re-picking
  // or re-shooting them, and the real per-file error is surfaced instead
  // of a generic line.
  const uploadAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setSummary(null);

    const succeededIds: string[] = [];
    const failedMessages: string[] = [];

    for (const item of pending) {
      try {
        const formData = new FormData();
        formData.append("file", item.file);
        if (evidenceStage) formData.append("evidence_stage", evidenceStage);
        await uploadFile(claimId, evidenceItemId ?? null, formData);
        succeededIds.push(item.id);
      } catch (err) {
        console.error("Photo upload failed:", err);
        failedMessages.push(err instanceof Error ? err.message : "Upload failed.");
      }
    }

    setPending((prev) => {
      prev
        .filter((p) => succeededIds.includes(p.id))
        .forEach((p) => URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => !succeededIds.includes(p.id));
    });
    setUploading(false);
    setSummary({ succeeded: succeededIds.length, failed: failedMessages.length, failedMessages });
    if (succeededIds.length > 0) onUploadComplete?.();
  };

  return (
    <div className="flex flex-col gap-3">
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={(e) => addFiles(e.target.files)}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,application/pdf"
        multiple
        onChange={(e) => addFiles(e.target.files)}
        className="hidden"
      />
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex-1 inline-flex items-center justify-center gap-2 rounded-sm bg-ledger px-4 py-3 text-sm font-semibold text-paper"
        >
          <Camera size={16} /> Take Photo
        </button>
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="inline-flex items-center gap-2 rounded-sm border border-ink/20 px-4 py-3 text-sm font-semibold text-ink"
        >
          <FolderOpen size={16} /> Choose Files
        </button>
      </div>
      {pending.length > 0 && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-3 gap-2">
            {pending.map((item) => (
              <div
                key={item.id}
                className="relative aspect-square rounded-sm overflow-hidden border border-ink/15"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote image */}
                <img
                  src={item.previewUrl}
                  alt="Pending upload"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.id)}
                  className="absolute top-1 right-1 w-6 h-6 flex items-center justify-center rounded-full bg-ink/60 text-paper"
                  aria-label="Remove"
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-semibold text-ink/60">
              Evidence stage (optional)
            </span>
            <select
              value={evidenceStage}
              onChange={(e) => setEvidenceStage(e.target.value)}
              className="text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white"
            >
              <option value="">Not tagged</option>
              {EVIDENCE_STAGES.map((stage) => (
                <option key={stage} value={stage}>
                  {stage}
                </option>
              ))}
            </select>
          </label>
          <button
            type="button"
            onClick={uploadAll}
            disabled={uploading}
            className="w-full inline-flex items-center justify-center gap-2 rounded-sm bg-ledger px-4 py-3 text-sm font-semibold text-paper disabled:opacity-50"
          >
            {uploading && <Loader2 size={14} className="animate-spin" />}
            {uploading
              ? `Uploading ${pending.length}…`
              : `Upload ${pending.length} photo${pending.length > 1 ? "s" : ""}`}
          </button>
        </div>
      )}
      {summary && (
        <div
          className={`rounded-sm px-3 py-2 text-sm ${
            summary.failed === 0
              ? "border-2 border-ledger bg-ledger/10 text-ledger"
              : "border-2 border-amber-700 bg-amber-50 text-amber-800"
          }`}
        >
          {summary.failed === 0 ? (
            <p>
              {summary.succeeded} photo{summary.succeeded > 1 ? "s" : ""} added.
            </p>
          ) : (
            <>
              <p>
                {summary.succeeded} of {summary.succeeded + summary.failed} uploaded
                {summary.succeeded > 0 ? " — the rest are still staged above, ready to retry." : "."}
              </p>
              <ul className="mt-1 list-disc list-inside">
                {summary.failedMessages.map((m, i) => (
                  <li key={i}>{m}</li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
}
