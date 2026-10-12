"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, FolderOpen, X, Loader2, FileText, File as FileIcon } from "lucide-react";
import { uploadEvidenceFile } from "@/lib/evidenceUploadClient";
import {
  duplicateNamePrompt,
  isPermanentUploadError,
  uploadButtonLabel,
  validateEvidenceFile,
} from "@/lib/evidenceUpload";
import { EVIDENCE_STAGES } from "@/lib/evidenceStage";

interface PendingCapture {
  id: string;
  file: File;
  // Only photos get a preview; PDFs and documents show an icon and their name.
  previewUrl: string | null;
}

interface CameraCaptureProps {
  claimId: string;
  evidenceItemId?: string;
  onUploadComplete?: () => void;
}

// notAdded: refused at selection, before any upload was attempted.
type BatchSummary = { succeeded: number; failed: number; failedMessages: string[]; notAdded?: boolean };

export default function CameraCapture({ claimId, evidenceItemId, onUploadComplete }: CameraCaptureProps) {
  const [pending, setPending] = useState<PendingCapture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [evidenceStage, setEvidenceStage] = useState("");
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // A success note ("1 photo added.") clears itself; it otherwise stayed on
  // screen after the file was deleted. Failures stay until the next batch so
  // the reasons aren't missed.
  useEffect(() => {
    if (!summary || summary.failed > 0) return;
    const timer = setTimeout(() => setSummary(null), 5000);
    return () => clearTimeout(timer);
  }, [summary]);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    // Files that can never upload (over 15MB, unsupported type, empty) are
    // refused here, at selection, instead of after the user clicks Upload.
    const rejected: string[] = [];
    const newItems: PendingCapture[] = [];
    for (const file of Array.from(fileList)) {
      const problem = validateEvidenceFile(file);
      if (problem) {
        rejected.push(`${file.name}: ${problem}`);
        continue;
      }
      newItems.push({
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null,
      });
    }
    // A fresh batch is being staged -- the last summary described an older,
    // already-cleared batch. Show only what this selection refused, if any.
    setSummary(rejected.length > 0 ? { succeeded: 0, failed: rejected.length, failedMessages: rejected, notAdded: true } : null);
    setPending((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  // Fix (2026-08-04): the previous version wrapped the whole loop in one
  // try/catch -- a single failure (wrong file type, oversized, storage
  // limit reached, all of which uploadEvidenceFile already reports with a real,
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
    // Failed for a reason retrying can't fix (too large, wrong type, a
    // skipped duplicate, a plan limit): dropped from the staged list. Other
    // failures stay staged so they can be retried without re-picking.
    const droppedIds: string[] = [];
    const failedMessages: string[] = [];

    for (const item of pending) {
      const result = await uploadEvidenceFile(item.file, {
        claimId,
        evidenceItemId,
        evidenceStage,
        onDuplicate: (name) => (window.confirm(duplicateNamePrompt(name)) ? "upload" : "skip"),
      });
      if (result.ok) {
        succeededIds.push(item.id);
      } else {
        failedMessages.push(`${item.file.name}: ${result.error}`);
        if (isPermanentUploadError(result.error)) droppedIds.push(item.id);
      }
    }

    const clearedIds = [...succeededIds, ...droppedIds];
    setPending((prev) => {
      prev
        .filter((p) => clearedIds.includes(p.id))
        .forEach((p) => p.previewUrl && URL.revokeObjectURL(p.previewUrl));
      return prev.filter((p) => !clearedIds.includes(p.id));
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
                {item.previewUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview, not an optimizable remote image
                  <img
                    src={item.previewUrl}
                    alt={`Pending upload: ${item.file.name}`}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2 bg-ink/5 text-ink/70">
                    {item.file.type === "application/pdf" ? <FileText size={28} /> : <FileIcon size={28} />}
                    <span className="text-[11px] text-center leading-tight break-all line-clamp-3">
                      {item.file.name}
                    </span>
                  </div>
                )}
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
            {uploading ? `Uploading ${pending.length}…` : uploadButtonLabel(pending.map((p) => p.file))}
          </button>
        </div>
      )}
      {summary && (
        <div
          className={`relative rounded-sm px-3 py-2 pr-9 text-sm ${
            summary.failed === 0
              ? "border-2 border-ledger bg-ledger/10 text-ledger"
              : "border-2 border-amber-700 bg-amber-50 text-amber-800"
          }`}
          role={summary.failed === 0 ? "status" : "alert"}
        >
          <button
            type="button"
            onClick={() => setSummary(null)}
            className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full hover:bg-ink/10"
            aria-label="Dismiss"
          >
            <X size={13} />
          </button>
          {summary.failed === 0 ? (
            <p>
              {summary.succeeded} {summary.succeeded === 1 ? "file" : "files"} added.
            </p>
          ) : (
            <>
              <p>
                {summary.notAdded
                  ? `${summary.failed} ${summary.failed === 1 ? "file wasn't" : "files weren't"} added.`
                  : `${summary.succeeded} of ${summary.succeeded + summary.failed} uploaded.`}
                {!summary.notAdded && pending.length > 0 ? " Files that can be retried are still staged above." : ""}
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
