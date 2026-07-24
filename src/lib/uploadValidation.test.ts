import { describe, it, expect } from "vitest";
import { isAllowedUpload } from "./uploadValidation";

describe("isAllowedUpload", () => {
  it("rejects .exe regardless of claimed MIME type", () => {
    expect(isAllowedUpload({ name: "invoice.exe", type: "application/pdf" })).toBe(false);
    expect(isAllowedUpload({ name: "invoice.exe", type: "" })).toBe(false);
  });

  it("rejects .sh regardless of claimed MIME type", () => {
    expect(isAllowedUpload({ name: "setup.sh", type: "text/plain" })).toBe(false);
  });

  it("rejects other executable/script extensions", () => {
    for (const name of ["a.bat", "a.cmd", "a.com", "a.msi", "a.scr", "a.ps1", "a.vbs", "a.js", "a.jar", "a.dll", "a.apk"]) {
      expect(isAllowedUpload({ name, type: "application/octet-stream" })).toBe(false);
    }
  });

  it("rejects unrecognized MIME types with no blocked extension", () => {
    expect(isAllowedUpload({ name: "mystery.bin", type: "application/octet-stream" })).toBe(false);
  });

  it("allows PDFs", () => {
    expect(isAllowedUpload({ name: "policy.pdf", type: "application/pdf" })).toBe(true);
  });

  it("allows images", () => {
    expect(isAllowedUpload({ name: "damage.jpg", type: "image/jpeg" })).toBe(true);
    expect(isAllowedUpload({ name: "damage.png", type: "image/png" })).toBe(true);
    expect(isAllowedUpload({ name: "damage.heic", type: "image/heic" })).toBe(true);
  });

  it("allows common document types", () => {
    expect(isAllowedUpload({ name: "estimate.docx", type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" })).toBe(true);
    expect(isAllowedUpload({ name: "estimate.xlsx", type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })).toBe(true);
    expect(isAllowedUpload({ name: "notes.txt", type: "text/plain" })).toBe(true);
    expect(isAllowedUpload({ name: "notes.csv", type: "text/csv" })).toBe(true);
  });
});
