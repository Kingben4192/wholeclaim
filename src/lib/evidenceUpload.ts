// Shared rules for Evidence Vault uploads, used by both the browser helper
// (evidenceUploadClient.ts) and the prepare/finalize server actions
// (src/app/claim/actions.ts). File bytes go from the browser straight to
// Supabase Storage on a signed upload URL, so they never pass through a
// Server Action -- Next's 1MB Server Action body limit and Vercel's ~4.5MB
// function request limit made anything bigger fail before uploadFile ran.
// No server or browser imports here, so it's directly unit-testable.

import { isAllowedUpload } from "./uploadValidation";

export const MAX_EVIDENCE_FILE_BYTES = 15 * 1024 * 1024; // 15MB — plenty for phone photos and scanned PDFs.

export const UPLOAD_FAILED_MESSAGE = "Upload failed. Try again.";
export const UPLOAD_TIMEOUT_MESSAGE = "The upload took too long. Check your connection and try again.";
export const FILE_TOO_LARGE_MESSAGE = "That file is larger than 15MB.";
export const FILE_TYPE_MESSAGE =
  "That file type isn't supported. Upload a photo, PDF, or common document file.";
export const EMPTY_FILE_MESSAGE = "Choose a photo or document to upload.";

export type UploadResult = { ok: true } | { ok: false; error: string };

export const DUPLICATE_SKIPPED_MESSAGE = "Skipped — a file with this name is already in this claim.";

export type DuplicateChoice = "link" | "upload" | "skip";

export const DUPLICATE_DIALOG_TITLE = "Already in your Evidence Vault";

export function duplicateNamePrompt(fileName: string): string {
  return `"${fileName}" is already in this claim's Evidence Vault.`;
}

// Time limits for each step of an upload. Without them, a stalled request
// (most often the direct transfer to Storage) left the spinner running
// forever with no message.
export const SERVER_STEP_TIMEOUT_MS = 20_000;
export const STORAGE_UPLOAD_TIMEOUT_MS = 60_000;

export class UploadTimeoutError extends Error {
  constructor(step: string) {
    super(`Upload step timed out: ${step}`);
    this.name = "UploadTimeoutError";
  }
}

// Rejects with UploadTimeoutError if `promise` hasn't settled within `ms`.
// The underlying request isn't cancelled -- it just stops being waited on,
// so the uploader can tell the user and let them retry.
export function withTimeout<T>(promise: Promise<T>, ms: number, step: string): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new UploadTimeoutError(step)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

// Failures that retrying the same file can't fix. The batch uploader drops
// these files from its staged list; anything else (network, server) stays
// staged so it can be retried without picking the file again.
export function isPermanentUploadError(message: string): boolean {
  return (
    message === FILE_TOO_LARGE_MESSAGE ||
    message === FILE_TYPE_MESSAGE ||
    message === EMPTY_FILE_MESSAGE ||
    message === DUPLICATE_SKIPPED_MESSAGE ||
    message.startsWith("You've reached") ||
    message.startsWith("Free plan includes")
  );
}

export function uploadButtonLabel(files: { type: string }[]): string {
  const n = files.length;
  const allPhotos = n > 0 && files.every((f) => f.type.startsWith("image/"));
  const noun = allPhotos ? "photo" : "file";
  return `Upload ${n} ${noun}${n === 1 ? "" : "s"}`;
}

export const MAX_CHECKLIST_LABEL_LENGTH = 200;

export function validateChecklistLabel(label: string): string | null {
  const trimmed = label.trim();
  if (!trimmed) return "Enter a name for this item.";
  if (trimmed.length > MAX_CHECKLIST_LABEL_LENGTH) return "That name is too long. Keep it under 200 characters.";
  return null;
}

export type EvidenceKind = "photo" | "pdf" | "doc";

export function kindForType(type: string): EvidenceKind {
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "photo";
  return "doc";
}

const KIND_LABEL: Record<EvidenceKind, string> = {
  photo: "Photo",
  pdf: "PDF",
  doc: "Document",
};

// Label of the checklist row a general Vault upload creates for its file.
// deleteFile uses the same function to recognize that row: a row whose label
// still matches was created by the upload and goes away with the file; a
// renamed row is the user's own and is kept.
export function autoChecklistLabel(kind: string, originalName: string): string | null {
  const prefix = KIND_LABEL[kind as EvidenceKind];
  return prefix ? `${prefix} — ${originalName}` : null;
}

// Returns the message to show, or null if the file can be uploaded. Run in
// the browser before anything is sent, and again on the server against the
// size and type Storage actually recorded.
export function validateEvidenceFile(file: { name: string; type: string; size: number }): string | null {
  if (!file.size) return EMPTY_FILE_MESSAGE;
  if (file.size > MAX_EVIDENCE_FILE_BYTES) return FILE_TOO_LARGE_MESSAGE;
  if (!isAllowedUpload(file)) return FILE_TYPE_MESSAGE;
  return null;
}

// Storage object keys reject some characters a phone or desktop file name
// can contain. The original name is still kept in files.original_name.
export function storageSafeName(name: string): string {
  const cleaned = name.normalize("NFKD").replace(/[^A-Za-z0-9._-]+/g, "_").replace(/^[._]+/, "");
  return (cleaned || "file").slice(-120);
}

export function buildEvidenceStoragePath(userId: string, claimId: string, id: string, fileName: string): string {
  return `${userId}/${claimId}/${id}-${storageSafeName(fileName)}`;
}

// finalize only accepts a path directly inside this user's folder for this
// claim -- the same {user_id}/{claim_id}/... shape the bucket policies and
// buildEvidenceStoragePath use, with no deeper folders or traversal.
export function isEvidencePathForClaim(path: string, userId: string, claimId: string): boolean {
  const prefix = `${userId}/${claimId}/`;
  if (!path.startsWith(prefix)) return false;
  const rest = path.slice(prefix.length);
  return rest.length > 0 && !rest.includes("/") && !rest.includes("..");
}

// Supabase Storage's own rejections (bucket file_size_limit,
// allowed_mime_types) come back as a StorageError on the browser upload.
export function messageForStorageUploadError(error: { message?: string; statusCode?: string | number }): string {
  const status = String(error.statusCode ?? "");
  const message = (error.message ?? "").toLowerCase();
  if (status === "413" || message.includes("maximum allowed size") || message.includes("too large")) {
    return FILE_TOO_LARGE_MESSAGE;
  }
  if (status === "415" || message.includes("mime type") || message.includes("invalid_mime_type")) {
    return FILE_TYPE_MESSAGE;
  }
  return UPLOAD_FAILED_MESSAGE;
}
