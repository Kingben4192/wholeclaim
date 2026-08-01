# Security Checklist

Standing record of security/PII verifications, distinct from
`Launch-Validation-Checklist.md` (a one-time per-deploy smoke-test
scaffold). Entries here persist across deploys — this is where future
audits check first instead of re-verifying from scratch.

## Encryption at rest

- [x] **Confirmed 2026-08-01, Benjamin Hammonds.** Supabase's managed
  Postgres and Storage use AES-256 encryption at rest and TLS in transit,
  per Supabase's public security documentation (supabase.com/security).
  Keys are platform-managed, not user-configurable — nothing in this
  project's own configuration affects this either way.
- [ ] **Not done, not urgent.** File a Supabase support ticket requesting
  written confirmation specific to the `wholeclaim` project (ref:
  `hkjqyjhunfbdcnwyjaqd`), for future formal record — e.g. partner or
  insurer due-diligence requests that won't accept general platform
  documentation as project-specific proof. Draft prepared, not sent
  (drafts-only standing rule); see the audit conversation this entry
  came from for the draft text.

## Uploaded-document content — standing design assumption

**WholeClaim does not ask for SSNs, driver's license numbers, or bank
account numbers as structured fields anywhere in the product** (verified
by code search across every form, schema column, and evidence-checklist
label — 2026-08-01 security/PII audit, zero hits).

That does not mean uploaded files are free of this data. Carrier
correspondence, estimates, and claim forms a user uploads as evidence
absolutely can contain:
- Social Security numbers
- Driver's license numbers
- Bank account / routing numbers
- Policy numbers
- Home addresses
- Phone numbers

**Every part of this product's security model — storage, retention,
access controls, logging, and any future AI/OCR processing — must be
designed assuming uploaded files may contain this data, even though the
app never explicitly asks for it.** Concretely, as of 2026-08-01, this is
already true in the following ways, confirmed directly rather than
assumed:

- File content is never sent to the AI tools — `buildClaimContext`
  passes only labels/metadata (evidence item labels, checked status,
  entry summaries the user typed), never file bytes. No OCR or
  document-parsing library exists anywhere in this codebase.
- The only code path that reads actual file bytes is the account export
  route, and it only ever returns a user's own files back to that same
  authenticated user (RLS-scoped).
- No upload content or freeform user text is ever written to
  `console.log`/`console.error` — every log call in the upload/AI
  pipeline logs error messages only.
- Storage bucket RLS (`storage.objects`) is scoped to
  `auth.uid() = (storage.foldername(name))[1]` — live-verified with a
  real cross-user download/signed-URL/delete attempt, all correctly
  denied.

If OCR, vision, or any form of automated document content extraction is
ever added to this product, this assumption is the reason that work needs
its own explicit security review before shipping — not an afterthought
bolted onto an existing AI tool.
