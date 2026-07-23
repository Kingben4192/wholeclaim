"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";

// Decision #42 (2026-07-23). Only fires for errors in the root layout
// itself (rare) -- ordinary page/component errors are caught by Next's
// normal error boundaries and never reach here. Must render its own
// <html>/<body>: this file replaces the root layout entirely when it's
// invoked, so it can't rely on src/app/layout.tsx still being mounted.
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <main
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            fontFamily: "sans-serif",
            textAlign: "center",
          }}
        >
          <div>
            <p style={{ marginBottom: "12px" }}>
              Something went wrong. Please refresh the page.
            </p>
            {/* Plain <a>, not next/link: this file is the fallback for a
                failure in the root layout itself, so it deliberately
                avoids depending on Next's client-side router, which could
                be implicated in whatever just broke. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" style={{ color: "#1E4B3C", fontWeight: 600 }}>
              Back to WholeClaim
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
