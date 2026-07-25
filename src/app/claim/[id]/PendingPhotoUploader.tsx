"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { readPendingPhoto, clearPendingPhoto } from "@/lib/pendingPhoto";
import { uploadFile } from "../actions";

// Completes the invisible-signup hand-off: picks up a photo captured on the
// free grader results page (held in localStorage across the magic-link
// redirect, see src/lib/pendingPhoto.ts) and uploads it into the claim that
// was just created for this user. No-op if nothing is pending.
//
// Whether a matching pending photo exists is read via useSyncExternalStore,
// not a useEffect + setState("uploading") (2026-07-25, CI lint fix):
// localStorage doesn't exist during Next's server render, so this can only
// be read safely after mount — useSyncExternalStore resolves the real
// value as part of the hydration commit itself (no lint violation, no
// extra render pass). "Uploading" is then a value DERIVED from that at
// render time, not a separately stored state, so there's nothing left to
// set synchronously. The actual upload is real async work (fetch, a
// server action, clearing localStorage) and stays in a useEffect — its
// own setState calls are already inside .then()/.catch() callbacks, which
// this lint rule has never flagged.
function subscribe() {
  return () => {};
}

function getServerSnapshot() {
  return false;
}

export function PendingPhotoUploader({
  claimId,
  userEmail,
}: {
  claimId: string;
  userEmail: string | null;
}) {
  const getSnapshot = useCallback(() => {
    const pending = readPendingPhoto();
    if (!pending) return false;
    // Different account/browser than the one that captured it — leave it in
    // place rather than silently attach it to the wrong claim or discard it.
    if (!userEmail || pending.email !== userEmail.toLowerCase()) return false;
    return true;
  }, [userEmail]);

  const hasPendingPhoto = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [outcome, setOutcome] = useState<"pending" | "done" | "error">("pending");
  const attempted = useRef(false);

  useEffect(() => {
    if (!hasPendingPhoto || attempted.current) return;
    attempted.current = true;

    const pending = readPendingPhoto();
    if (!pending) return;
    if (!userEmail || pending.email !== userEmail.toLowerCase()) return;

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
        setOutcome("done");
      })
      .catch(() => {
        setOutcome("error");
      });
  }, [claimId, userEmail, hasPendingPhoto]);

  if (hasPendingPhoto && outcome === "pending") {
    return (
      <div className="border-2 border-ledger bg-ledger/10 rounded-sm px-4 py-3 text-sm text-ledger font-semibold mb-6">
        Adding the photo you captured…
      </div>
    );
  }
  if (hasPendingPhoto && outcome === "error") {
    return (
      <div className="border-2 border-red-700 bg-red-50 rounded-sm px-4 py-3 text-sm text-red-700 mb-6">
        Couldn&apos;t add your captured photo automatically — upload it again
        below.
      </div>
    );
  }
  return null;
}
