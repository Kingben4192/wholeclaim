import { describe, it, expect } from "vitest";
import {
  autoChecklistLabel,
  buildEvidenceStoragePath,
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
