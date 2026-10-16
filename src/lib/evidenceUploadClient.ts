import { createClient } from "@/lib/supabase/client";
import { prepareEvidenceUpload, finalizeEvidenceUpload, linkExistingEvidenceFile } from "@/app/claim/actions";
import {
  DUPLICATE_SKIPPED_MESSAGE,
  messageForStorageUploadError,
  validateEvidenceFile,
  withTimeout,
  SERVER_STEP_TIMEOUT_MS,
  STORAGE_UPLOAD_TIMEOUT_MS,
  UPLOAD_FAILED_MESSAGE,
  UPLOAD_TIMEOUT_MESSAGE,
  UploadTimeoutError,
  type DuplicateChoice,
  type UploadResult,
} from "@/lib/evidenceUpload";

// Browser side of an Evidence Vault upload, shared by CameraCapture,
// EvidenceUpload and PendingPhotoUploader. Only the file's name, type and
// size go through Server Actions; the bytes go straight to Supabase
// Storage on the signed URL prepareEvidenceUpload returns, so the 15MB
// limit isn't capped by Next's 1MB Server Action body limit or Vercel's
// ~4.5MB function request limit. Every step has a time limit, and the
// function always resolves to a result with a message a customer can read
// -- it never throws and never leaves the caller waiting indefinitely.
export async function uploadEvidenceFile(
  file: File,
  options: {
    claimId: string;
    evidenceItemId?: string | null;
    promisedItemId?: string | null;
    evidenceStage?: string | null;
    // Asked when this claim's Vault already has a file with the same name:
    // "link" reuses that file for this item (no new upload), "upload" sends a
    // separate copy, "skip" does nothing. Omit it to upload without asking
    // (PendingPhotoUploader runs with no one to answer). Not time-limited:
    // it waits for the person to choose.
    onDuplicate?: (fileName: string) => DuplicateChoice | Promise<DuplicateChoice>;
  },
): Promise<UploadResult> {
  const invalid = validateEvidenceFile(file);
  if (invalid) return { ok: false, error: invalid };

  try {
    const prepared = await withTimeout(
      prepareEvidenceUpload(options.claimId, { name: file.name, type: file.type, size: file.size }),
      SERVER_STEP_TIMEOUT_MS,
      "prepare",
    );
    if (!prepared.ok) return prepared;

    if (prepared.duplicateName && options.onDuplicate) {
      const choice = await options.onDuplicate(file.name);
      if (choice === "skip") return { ok: false, error: DUPLICATE_SKIPPED_MESSAGE };
      if (choice === "link") {
        return await withTimeout(
          linkExistingEvidenceFile(options.claimId, {
            fileName: file.name,
            evidenceItemId: options.evidenceItemId ?? null,
            promisedItemId: options.promisedItemId ?? null,
          }),
          SERVER_STEP_TIMEOUT_MS,
          "link",
        );
      }
    }

    const { error: uploadError } = await withTimeout(
      createClient()
        .storage.from("evidence")
        .uploadToSignedUrl(prepared.path, prepared.token, file, { contentType: file.type || undefined }),
      STORAGE_UPLOAD_TIMEOUT_MS,
      "storage",
    );
    if (uploadError) {
      console.error("Evidence upload to storage failed:", uploadError);
      return { ok: false, error: messageForStorageUploadError(uploadError) };
    }

    return await withTimeout(
      finalizeEvidenceUpload(options.claimId, {
        path: prepared.path,
        originalName: file.name,
        evidenceItemId: options.evidenceItemId ?? null,
        promisedItemId: options.promisedItemId ?? null,
        evidenceStage: options.evidenceStage || null,
      }),
      SERVER_STEP_TIMEOUT_MS,
      "finalize",
    );
  } catch (err) {
    console.error("Evidence upload failed:", err);
    if (err instanceof UploadTimeoutError) return { ok: false, error: UPLOAD_TIMEOUT_MESSAGE };
    return { ok: false, error: UPLOAD_FAILED_MESSAGE };
  }
}
