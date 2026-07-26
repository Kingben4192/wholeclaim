"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/nextjs";
import { createClient } from "@/lib/supabase/client";

// Every Sentry event has shown "Users: 0" since Sentry was adopted
// (Decision #42) -- nothing ever called Sentry.setUser(). Wired via
// Supabase's own onAuthStateChange rather than a one-time check on mount,
// so sign-in/sign-out/token-refresh during the same page session all keep
// Sentry's user context accurate without a page reload. Only id and email
// are attached -- no other profile data -- matching Sentry's own
// data-minimization guidance for user context.
export function SentryUserSync() {
  useEffect(() => {
    const supabase = createClient();

    supabase.auth.getUser().then(({ data: { user } }) => {
      Sentry.setUser(user ? { id: user.id, email: user.email } : null);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      Sentry.setUser(session?.user ? { id: session.user.id, email: session.user.email } : null);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  return null;
}
