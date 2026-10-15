import { describe, it, expect, vi, afterEach } from "vitest";
import {
  autoChecklistLabel,
  buildEvidenceStoragePath,
  duplicateNamePrompt,
  isPermanentUploadError,
  uploadButtonLabel,
  validateChecklistLabel,
  withTimeout,
  UploadTimeoutError,
  UPLOAD_TIMEOUT_MESSAGE,
  DUPLICATE_SKIPPED_MESSAGE,
  isEvidencePathForClaim,
  kindForType,
  messageForStorageUploadError,
  storageSafeName,
  validateEvidenceFile,
  EMPTY_FILE_MESSAGE,
  FILE_TOO_LARGE_MESSAGE,
  FILE_TYPE_MESSAGE,
  MAX_EVIDENCE_FILE_BYTES,
  UPLOAD_FAILED_MESSAGE,
} from "./evidenceUpload";

const USER = "11111111-1111-1111-1111-111111111111";
const CLAIM = "22222222-2222-2222-2222-222222222222";

describe("validateEvidenceFile", () => {
  it("accepts a photo exactly at the 15MB limit", () => {
    expect(validateEvidenceFile({ name: "roof.jpg", type: "image/jpeg", size: MAX_EVIDENCE_FILE_BYTES })).toBeNull();
  });

  it("accepts a multi-megabyte phone photo that the old Server Action path rejected", () => {
    expect(validateEvidenceFile({ name: "IMG_0412.HEIC", type: "image/heic", size: 6 * 1024 * 1024 })).toBeNull();
  });

  it("rejects one byte over 15MB with the plain size message", () => {
    expect(
      validateEvidenceFile({ name: "roof.jpg", type: "image/jpeg", size: MAX_EVIDENCE_FILE_BYTES + 1 }),
    ).toBe(FILE_TOO_LARGE_MESSAGE);
  });

  it("rejects an empty file", () => {
    expect(validateEvidenceFile({ name: "roof.jpg", type: "image/jpeg", size: 0 })).toBe(EMPTY_FILE_MESSAGE);
  });

  it("rejects disallowed types with the plain type message", () => {
    expect(validateEvidenceFile({ name: "clip.mp4", type: "video/mp4", size: 1024 })).toBe(FILE_TYPE_MESSAGE);
    expect(validateEvidenceFile({ name: "run.exe", type: "application/pdf", size: 1024 })).toBe(FILE_TYPE_MESSAGE);
  });

  it("accepts the document types the picker offers", () => {
    expect(
      validateEvidenceFile({
        name: "estimate.docx",
        type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        size: 1024,
      }),
    ).toBeNull();
    expect(validateEvidenceFile({ name: "notes.csv", type: "text/csv", size: 1024 })).toBeNull();
  });
});

describe("storage paths", () => {
  it("builds {user}/{claim}/{id}-{safe name}", () => {
    expect(buildEvidenceStoragePath(USER, CLAIM, "abc", "roof.jpg")).toBe(`${USER}/${CLAIM}/abc-roof.jpg`);
  });

  it("replaces characters Storage keys reject but keeps the extension", () => {
    expect(storageSafeName("Kitchen photo #2 (final).jpg")).toBe("Kitchen_photo_2_final_.jpg");
    expect(storageSafeName("../../etc.png")).toBe("etc.png");
    expect(storageSafeName("???")).toBe("file");
  });

  it("only accepts paths directly inside this user's folder for this claim", () => {
    expect(isEvidencePathForClaim(`${USER}/${CLAIM}/abc-roof.jpg`, USER, CLAIM)).toBe(true);
    expect(isEvidencePathForClaim(`${USER}/other-claim/abc-roof.jpg`, USER, CLAIM)).toBe(false);
    expect(isEvidencePathForClaim(`someone-else/${CLAIM}/abc-roof.jpg`, USER, CLAIM)).toBe(false);
    expect(isEvidencePathForClaim(`${USER}/${CLAIM}/`, USER, CLAIM)).toBe(false);
    expect(isEvidencePathForClaim(`${USER}/${CLAIM}/nested/abc.jpg`, USER, CLAIM)).toBe(false);
    expect(isEvidencePathForClaim(`${USER}/${CLAIM}/..`, USER, CLAIM)).toBe(false);
  });
});

describe("kindForType", () => {
  it("maps content types to file kinds", () => {
    expect(kindForType("image/png")).toBe("photo");
    expect(kindForType("application/pdf")).toBe("pdf");
    expect(kindForType("text/csv")).toBe("doc");
  });
});

describe("autoChecklistLabel", () => {
  it("builds the label a Vault upload gives its checklist row", () => {
    expect(autoChecklistLabel("photo", "133798837418027976.jpg")).toBe("Photo — 133798837418027976.jpg");
    expect(autoChecklistLabel("pdf", "estimate.pdf")).toBe("PDF — estimate.pdf");
    expect(autoChecklistLabel("doc", "notes.csv")).toBe("Document — notes.csv");
  });

  it("returns null for an unknown kind, so no user row is mistaken for an upload row", () => {
    expect(autoChecklistLabel("video", "clip.mp4")).toBeNull();
  });
});

describe("duplicate file names", () => {
  it("asks in plain words, naming the file", () => {
    expect(duplicateNamePrompt("IMG_0412.jpg")).toBe('"IMG_0412.jpg" is already in this claim\'s Evidence Vault.');
  });

  it("explains a skipped upload without calling it an error", () => {
    expect(DUPLICATE_SKIPPED_MESSAGE).toBe("Skipped — a file with this name is already in this claim.");
  });
});

describe("isPermanentUploadError", () => {
  it("treats size, type, empty, skipped-duplicate and plan-limit failures as permanent", () => {
    for (const m of [
      FILE_TOO_LARGE_MESSAGE,
      FILE_TYPE_MESSAGE,
      EMPTY_FILE_MESSAGE,
      DUPLICATE_SKIPPED_MESSAGE,
      "You've reached this claim's storage limit on the free plan. Upgrade to Pro for more space.",
      "Free plan includes 25 uploads per claim. Upgrade to Pro for unlimited uploads.",
    ]) {
      expect(isPermanentUploadError(m)).toBe(true);
    }
  });

  it("keeps network and server failures retryable", () => {
    expect(isPermanentUploadError(UPLOAD_FAILED_MESSAGE)).toBe(false);
    expect(isPermanentUploadError("Could not verify this claim. Try again.")).toBe(false);
  });
});

describe("uploadButtonLabel", () => {
  it("says photo only when every staged file is an image", () => {
    expect(uploadButtonLabel([{ type: "image/jpeg" }])).toBe("Upload 1 photo");
    expect(uploadButtonLabel([{ type: "image/jpeg" }, { type: "image/png" }])).toBe("Upload 2 photos");
    expect(uploadButtonLabel([{ type: "application/pdf" }])).toBe("Upload 1 file");
    expect(uploadButtonLabel([{ type: "image/jpeg" }, { type: "application/pdf" }])).toBe("Upload 2 files");
  });
});

describe("validateChecklistLabel", () => {
  it("requires a name and caps its length", () => {
    expect(validateChecklistLabel("Contractor estimate")).toBeNull();
    expect(validateChecklistLabel("   ")).toBe("Enter a name for this item.");
    expect(validateChecklistLabel("x".repeat(201))).toMatch(/too long/);
  });
});

describe("withTimeout", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("passes through a result that arrives in time", async () => {
    await expect(withTimeout(Promise.resolve("done"), 1000, "prepare")).resolves.toBe("done");
  });

  it("rejects with UploadTimeoutError when the step stalls", async () => {
    vi.useFakeTimers();
    const stalled = new Promise<string>(() => {});
    const result = withTimeout(stalled, 60_000, "storage");
    const assertion = expect(result).rejects.toBeInstanceOf(UploadTimeoutError);
    await vi.advanceTimersByTimeAsync(60_000);
    await assertion;
  });

  it("keeps a timed-out upload retryable, with a plain message", () => {
    expect(isPermanentUploadError(UPLOAD_TIMEOUT_MESSAGE)).toBe(false);
    expect(UPLOAD_TIMEOUT_MESSAGE).toBe("The upload took too long. Check your connection and try again.");
  });
});

describe("messageForStorageUploadError", () => {
  it("turns Storage's size rejection into the plain size message", () => {
    expect(messageForStorageUploadError({ statusCode: "413", message: "Payload too large" })).toBe(
      FILE_TOO_LARGE_MESSAGE,
    );
    expect(
      messageForStorageUploadError({ message: "The object exceeded the maximum allowed size" }),
    ).toBe(FILE_TOO_LARGE_MESSAGE);
  });

  it("turns Storage's type rejection into the plain type message", () => {
    expect(messageForStorageUploadError({ statusCode: "415", message: "mime type video/mp4 is not supported" })).toBe(
      FILE_TYPE_MESSAGE,
    );
  });

  it("falls back to a generic retry message, never a raw error", () => {
    expect(messageForStorageUploadError({ statusCode: "500", message: "Internal" })).toBe(UPLOAD_FAILED_MESSAGE);
    expect(messageForStorageUploadError({})).toBe(UPLOAD_FAILED_MESSAGE);
  });
});
