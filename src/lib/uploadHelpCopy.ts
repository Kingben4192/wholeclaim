// Upload/storage limit help copy -- single source, imported by both the
// inline accordion on the claim detail page's Evidence Vault section
// (UploadHelp.tsx) and /help's FAQ list, so the two surfaces can't drift
// out of sync.
//
// File-count and byte limits below match src/lib/uploadLimits.ts and the
// upload gate in src/lib/uploadGate.ts. Deleting a file is a hard delete
// (src/app/claim/actions.ts deleteFile) and frees both a count slot and
// the stored bytes.

export const UPLOAD_HELP_ITEMS: { q: string; a: string }[] = [
  {
    q: "Why can't I upload?",
    a: "Free accounts include 25 uploaded files per claim, 500MB of storage per claim, and 2GB per account. Each file also has to be 15MB or smaller, and it has to be a photo or a supported document (PDF, Word, Excel, text, or CSV). Videos are not accepted. Upgrade to Pro for unlimited file count and 10GB of storage per account, or delete a file you no longer need.",
  },
  {
    q: "Does deleting a file free up space?",
    a: "Yes — deleting a file removes it permanently and immediately frees a slot in your 25-file limit for this claim.",
  },
  {
    q: "Why does the limit apply even though my other claims have room?",
    a: "The 25-file limit is per claim, not shared across your account — each claim gets its own 25 free uploads.",
  },
];
