import { createClient } from "@/lib/supabase/client";
import { prepareEvidenceUpload, finalizeEvidenceUpload } from "@/app/claim/actions";
import {
  messageForStorageUploadError,
  validateEvidenceFile,
  UPLOAD_FAILED_MESSAGE,
  type UploadResult,
} from "@/lib/evidenceUpload";

// Browser side of an Evidence Vault upload, shared by CameraCapture,
// EvidenceUpload and PendingPhotoUploader. Only the file's name, type and
// size go through Server Actions; the bytes go straight to Supabase
// Storage on the signed URL prepareEvidenceUpload returns, so the 15MB
// limit isn't capped by Next's 1MB Server Action body limit or Vercel's
// ~4.5MB function request limit. Always resolves to a result with a
// message a customer can read -- never throws.
export async function uploadEvidenceFile(
  file: File,
  options: {
    claimId: string;
    evidenceItemId?: string | null;
    promisedItemId?: string | null;
    evidenceStage?: string | null;
  },
): Promise<UploadResult> {
  const invalid = validateEvidenceFile(file);
  if (invalid) return { ok: false, error: invalid };

  try {
    const prepared = await prepareEvidenceUpload(options.claimId, {
      name: file.name,
      type: file.type,
      size: file.size,
    });
    if (!prepared.ok) return prepared;

    const { error: uploadError } = await createClient()
      .storage.from("evidence")
      .uploadToSignedUrl(prepared.path, prepared.token, file, {
        contentType: file.type || undefined,
      });
    if (uploadError) {
      console.error("Evidence upload to storage failed:", uploadError);
      return { ok: false, error: messageForStorageUploadError(uploadError) };
    }

    return await finalizeEvidenceUpload(options.claimId, {
      path: prepared.path,
      originalName: file.name,
      evidenceItemId: options.evidenceItemId ?? null,
      promisedItemId: options.promisedItemId ?? null,
      evidenceStage: options.evidenceStage || null,
    });
  } catch (err) {
    console.error("Evidence upload failed:", err);
    return { ok: false, error: UPLOAD_FAILED_MESSAGE };
  }
}
