// Server-side upload validation (security review, 2026-07-24): the
// `accept=""` attribute on the upload <input> is a client-side hint only
// and doesn't stop a crafted request from reaching claim/actions.ts's
// uploadFile server action, so the allow/deny decision has to be made
// here, not just in the browser. Checked two ways: the reported MIME type
// must match a known-safe type, AND the filename's extension must not be
// one of the block-listed executable/script types — either the MIME type
// or a client-controlled filename alone could be spoofed, so both are
// checked. Split into its own module (matching uploadGate.ts/
// uploadLimits.ts) so it's testable without the Next.js server-action
// request context.
export const ALLOWED_DOC_MIME_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // .docx
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", // .xlsx
  "text/plain",
  "text/csv",
]);

export const BLOCKED_UPLOAD_EXTENSIONS = [
  ".exe", ".sh", ".bat", ".cmd", ".com", ".msi", ".scr", ".ps1", ".vbs", ".js", ".jar", ".dll", ".apk",
];

export function isAllowedUpload(file: { name: string; type: string }): boolean {
  const name = file.name.toLowerCase();
  if (BLOCKED_UPLOAD_EXTENSIONS.some((ext) => name.endsWith(ext))) return false;
  const type = file.type || "";
  return type.startsWith("image/") || ALLOWED_DOC_MIME_TYPES.has(type);
}
