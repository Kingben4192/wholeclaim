// Single-email admin allowlist, matching the check already used by
// /admin (admin/page.tsx), /library (library/page.tsx) and the library
// server actions (library/actions.ts).
//
// Extracted here so API routes can enforce the same rule. Those three
// existing copies are left untouched deliberately — migrating them is a
// separate refactor, not part of a security fix pass.
export function isAdminEmail(email: string | null | undefined): boolean {
  const allowed = process.env.ADMIN_EMAIL?.toLowerCase();
  return Boolean(allowed && email && email.toLowerCase() === allowed);
}
