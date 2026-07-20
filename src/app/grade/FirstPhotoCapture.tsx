"use client";

import { useRef, useState } from "react";
import { Camera, Check } from "lucide-react";
import { savePendingPhoto } from "@/lib/pendingPhoto";

// The 60-second hook (Decision: invisible signup). The magic link was
// already sent when the grade was shown — no second send here, since
// Supabase's per-address send cooldown would collide with one this soon
// after. This just captures the photo instantly and holds it locally
// until the user clicks that already-sent link and a real claim exists.
export function FirstPhotoCapture({ email }: { email: string }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [captured, setCaptured] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleFile(file: File) {
    setError(null);
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      savePendingPhoto({
        email: email.toLowerCase(),
        dataUrl,
        fileName: file.name,
        mimeType: file.type,
        capturedAt: new Date().toISOString(),
      });
      setPreviewUrl(dataUrl);
      setCaptured(true);
    };
    reader.onerror = () => setError("Could not read that photo — try again.");
    reader.readAsDataURL(file);
  }

  if (captured) {
    return (
      <div className="border-2 border-ledger bg-ledger/10 rounded-sm p-4">
        <div className="flex items-center gap-3">
          {previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- local data: URL preview, not an optimizable remote image
            <img
              src={previewUrl}
              alt="Captured evidence"
              className="w-14 h-14 rounded-sm object-cover border border-ledger/30 shrink-0"
            />
          )}
          <div>
            <div className="font-display text-sm font-bold uppercase tracking-wide text-ledger flex items-center gap-1">
              <Check size={14} /> Photo captured
            </div>
            <p className="text-xs text-ink/60">
              Tap the link in your email to add it to your claim file — your
              Claim Health Score updates the moment it lands.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="border border-ink/15 rounded-sm p-4">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 bg-ledger text-paper px-4 py-3 rounded-sm font-semibold text-sm"
      >
        <Camera size={16} /> Take your first photo
      </button>
      <p className="text-xs text-ink/40 mt-2 text-center">
        Snap it now — it&apos;ll be waiting in your claim file the moment you
        confirm your email.
      </p>
      {error && <p className="text-xs text-red-700 mt-2 text-center">{error}</p>}
    </div>
  );
}
