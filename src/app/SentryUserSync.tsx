"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

// Every Sentry event has shown "Users: 0" since Sentry was adopted
// (Decision #42) -- nothing ever called Sentry.setUser(). Wired via
// Supabase's own onAuthStateChange rather than a one-time check on mount,
// so sign-in/sign-out/token-refresh during the same page session all keep
// Sentry's user context accurate without a page reload.
//
// id only, not email (security/PII audit, 2026-08-01) -- this runs on
// every page for every signed-in user, so it's a much larger exposure
// surface than a single error path: every Sentry event for the rest of
// that session would have carried the person's actual email address to a
// third-party service. The user ID alone is enough to correlate events to
// an account without that.
export function SentryUserSync() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      Sentry.setUser(user ? { id: user.id } : null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      Sentry.setUser(session?.user ? { id: session.user.id } : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return null;
}
