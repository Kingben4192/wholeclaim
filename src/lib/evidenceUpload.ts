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
export const FILE_TOO_LARGE_MESSAGE = "That file is larger than 15MB.";
export const FILE_TYPE_MESSAGE =
  "That file type isn't supported. Upload a photo, PDF, or common document file.";
export const EMPTY_FILE_MESSAGE = "Choose a photo or document to upload.";

export type UploadResult = { ok: true } | { ok: false; error: string };

export type EvidenceKind = "photo" | "pdf" | "doc";

export function kindForType(type: string): EvidenceKind {
  if (type === "application/pdf") return "pdf";
  if (type.startsWith("image/")) return "photo";
  return "doc";
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
