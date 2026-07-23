"use client";

import { useActionState, useState } from "react";
import { sendMagicLink, verifyCode } from "./actions";

type SendState = { error?: string; sent?: boolean };
type VerifyState = { error?: string };

const initialSendState: SendState = {};
const initialVerifyState: VerifyState = {};

// Decision #41 (reopened 2026-07-23) -- magic link stays the one-tap
// primary; code entry is reachable two ways, both clearly secondary to the
// link: (1) a low-key toggle on the very first screen, for someone who
// landed here from a failed-link error page but still has a working code
// sitting in that same original email -- resending isn't required to use
// it; (2) auto-shown (email pre-filled) right after a fresh send, for
// convenience.
export default function LoginPage() {
  const [submittedEmail, setSubmittedEmail] = useState("");
  const [showCodeEntry, setShowCodeEntry] = useState(false);
  const [sendState, sendAction, sendPending] = useActionState(
    async (_prev: SendState, formData: FormData) => {
      setSubmittedEmail(String(formData.get("email") ?? "").trim());
      return sendMagicLink(formData);
    },
    initialSendState,
  );
  const [verifyState, verifyAction, verifyPending] = useActionState(
    async (_prev: VerifyState, formData: FormData) => verifyCode(formData),
    initialVerifyState,
  );

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="font-display text-2xl font-extrabold mb-2 text-center">
          Back to the file
        </h1>
        <p className="text-sm text-ink/60 mb-8 text-center">
          Email me a sign-in link
        </p>

        {sendState.sent ? (
          <div className="flex flex-col gap-5">
            <p className="text-sm text-center border border-ledger/30 bg-ledger/10 text-ink rounded-sm px-4 py-3">
              Check your email for a sign-in link.
            </p>

            <div className="border-t border-ink/10 pt-5">
              <p className="text-xs text-ink/50 mb-3 text-center">
                Having trouble with the link? Enter the code from the same
                email instead.
              </p>
              <form action={verifyAction} className="flex flex-col gap-3">
                <input type="hidden" name="email" value={submittedEmail} />
                <input
                  type="text"
                  name="token"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Code from your email"
                  className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-ledger"
                />
                <button
                  type="submit"
                  disabled={verifyPending}
                  className="border-2 border-ledger text-ledger px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
                >
                  {verifyPending ? "Verifying…" : "Enter code"}
                </button>
                {verifyState.error && (
                  <p className="text-sm text-center text-red-700">{verifyState.error}</p>
                )}
              </form>

              <form action={sendAction} className="mt-3 text-center">
                <input type="hidden" name="email" value={submittedEmail} />
                <button
                  type="submit"
                  disabled={sendPending}
                  className="text-xs font-semibold text-ledger underline disabled:opacity-50"
                >
                  {sendPending ? "Resending…" : "Resend the email"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <>
            <form action={sendAction} className="flex flex-col gap-3">
              <input
                type="email"
                name="email"
                required
                placeholder="you@example.com"
                className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-ledger"
              />
              <button
                type="submit"
                disabled={sendPending}
                className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
              >
                {sendPending ? "Sending..." : "Email me a sign-in link"}
              </button>
              {sendState.error && (
                <p className="text-sm text-center text-ink/70">
                  {sendState.error}
                </p>
              )}
            </form>

            {showCodeEntry ? (
              <form action={verifyAction} className="flex flex-col gap-3 mt-5 pt-5 border-t border-ink/10">
                <p className="text-xs text-ink/50 text-center">
                  Enter the email and code from a sign-in email you already
                  received.
                </p>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@example.com"
                  className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-ledger"
                />
                <input
                  type="text"
                  name="token"
                  required
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="Code from your email"
                  className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white text-center tracking-widest font-mono focus:outline-none focus:ring-2 focus:ring-ledger"
                />
                <button
                  type="submit"
                  disabled={verifyPending}
                  className="border-2 border-ledger text-ledger px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
                >
                  {verifyPending ? "Verifying…" : "Enter code"}
                </button>
                {verifyState.error && (
                  <p className="text-sm text-center text-red-700">{verifyState.error}</p>
                )}
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setShowCodeEntry(true)}
                className="block w-full text-center text-xs font-semibold text-ledger underline mt-5"
              >
                Already have a code? Enter it instead
              </button>
            )}
          </>
        )}
      </div>
    </main>
  );
}
