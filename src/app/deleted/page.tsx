import Link from "next/link";

// Delete-account confirmation (2026-07-26) -- previously the success
// redirect landed on the plain marketing homepage (/?deleted=1) with zero
// acknowledgment that anything happened. A destructive, irreversible
// action needs its own dedicated screen, not a banner easily missed on a
// page that's otherwise selling the product to someone who no longer has
// an account.
export default function AccountDeletedPage() {
  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm text-center flex flex-col gap-5">
        <h1 className="font-display text-2xl font-extrabold">
          Your account has been deleted
        </h1>
        <p className="text-sm text-ink/70">
          Every claim, entry, deadline, and uploaded file tied to your
          account has been permanently removed. This can&apos;t be undone.
        </p>
        <p className="text-sm text-ink/70">
          Nothing was retained — WholeClaim does not keep a copy of deleted
          claims, files, or account data.
        </p>
        <Link
          href="/login"
          className="inline-block bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm"
        >
          Sign in to start over
        </Link>
      </div>
    </main>
  );
}
