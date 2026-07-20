"use client";

import { useEffect, useRef, useState } from "react";
import { readPendingPhoto, clearPendingPhoto } from "@/lib/pendingPhoto";
import { uploadFile } from "../actions";

// Completes the invisible-signup hand-off: picks up a photo captured on the
// free grader results page (held in localStorage across the magic-link
// redirect, see src/lib/pendingPhoto.ts) and uploads it into the claim that
// was just created for this user. No-op if nothing is pending.
export function PendingPhotoUploader({
  claimId,
  userEmail,
}: {
  claimId: string;
  userEmail: string | null;
}) {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) return;
    attempted.current = true;

    const pending = readPendingPhoto();
    if (!pending) return;
    // Different account/browser than the one that captured it — leave it in
    // place rather than silently attach it to the wrong claim or discard it.
    if (!userEmail || pending.email !== userEmail.toLowerCase()) return;

    setStatus("uploading");
    fetch(pending.dataUrl)
      .then((r) => r.blob())
      .then((blob) => {
        const file = new File([blob], pending.fileName, { type: pending.mimeType });
        const formData = new FormData();
        formData.append("file", file);
        return uploadFile(claimId, null, formData);
      })
      .then(() => {
        clearPendingPhoto();
        setStatus("done");
      })
      .catch(() => {
        setStatus("error");
      });
  }, [claimId, userEmail]);

  if (status === "uploading") {
    return (
      <div className="border-2 border-ledger bg-ledger/10 rounded-sm px-4 py-3 text-sm text-ledger font-semibold mb-6">
        Adding the photo you captured…
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="border-2 border-red-700 bg-red-50 rounded-sm px-4 py-3 text-sm text-red-700 mb-6">
        Couldn&apos;t add your captured photo automatically — upload it again
        below.
      </div>
    );
  }
  return null;
}
