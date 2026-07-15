"use client";

import { useActionState } from "react";
import { sendMagicLink } from "./actions";

type State = { error?: string; sent?: boolean };

const initialState: State = {};

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(
    async (_prev: State, formData: FormData) => sendMagicLink(formData),
    initialState,
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

        {state.sent ? (
          <p className="text-sm text-center border border-ledger/30 bg-ledger/10 text-ink rounded-sm px-4 py-3">
            Check your email for a sign-in link.
          </p>
        ) : (
          <form action={formAction} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              required
              placeholder="you@example.com"
              className="w-full text-sm px-3 py-2 rounded-sm border border-ink/20 bg-white focus:outline-none focus:ring-2 focus:ring-ledger"
            />
            <button
              type="submit"
              disabled={pending}
              className="bg-ledger text-paper px-6 py-3 rounded-sm font-semibold text-sm disabled:opacity-50"
            >
              {pending ? "Sending..." : "Email me a sign-in link"}
            </button>
            {state.error && (
              <p className="text-sm text-center text-ink/70">
                {state.error}
              </p>
            )}
          </form>
        )}
      </div>
    </main>
  );
}
