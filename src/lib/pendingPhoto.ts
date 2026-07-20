// Bridges a captured photo across the magic-link auth redirect. A File
// object can't survive navigating away to click an email link — the page
// (and all its React state) is gone by the time the user lands back
// authenticated. localStorage is origin-scoped and does survive that
// round trip, so the photo is base64-encoded and held here until a claim
// exists to actually upload it into. Scoped to exactly one pending photo —
// this is the free-quiz "first photo" hook, not a general offline queue.

const STORAGE_KEY = "wc_pending_photo";

export type PendingPhoto = {
  email: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  capturedAt: string;
};

export function savePendingPhoto(photo: PendingPhoto) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(photo));
}

export function readPendingPhoto(): PendingPhoto | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as PendingPhoto;
  } catch {
    return null;
  }
}

export function clearPendingPhoto() {
  localStorage.removeItem(STORAGE_KEY);
}
