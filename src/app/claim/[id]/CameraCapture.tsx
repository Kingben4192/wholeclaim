"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, FolderOpen, X, Loader2 } from "lucide-react";
import { uploadFile } from "@/app/claim/actions";

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

export default function CameraCapture({ claimId, evidenceItemId, onUploadComplete }: CameraCaptureProps) {
  const [pending, setPending] = useState<PendingCapture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((fileList: FileList | null) => {
    if (!fileList) return;
    const newItems: PendingCapture[] = Array.from(fileList).map((file) => ({
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      file,
      previewUrl: URL.createObjectURL(file),
    }));
    setPending((prev) => [...prev, ...newItems]);
  }, []);

  const removeItem = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item) URL.revokeObjectURL(item.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const uploadAll = async () => {
    if (pending.length === 0) return;
    setUploading(true);
    setError(null);
    try {
      for (const item of pending) {
        const formData = new FormData();
        formData.append("file", item.file);
        await uploadFile(claimId, evidenceItemId ?? null, formData);
      }
      pending.forEach((p) => URL.revokeObjectURL(p.previewUrl));
      setPending([]);
      onUploadComplete?.();
    } catch (err) {
      console.error("Batch upload failed:", err);
      setError("Some photos failed to upload. Please try again.");
    } finally {
      setUploading(false);
    }
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
      {error && <p className="text-sm text-red-700">{error}</p>}
    </div>
  );
}
