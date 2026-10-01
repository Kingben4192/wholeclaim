import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // The callback page exchanges the PKCE code itself. Leaving this on
        // makes the client exchange that same code during construction, delete
        // the one-time verifier, and then the page's own exchange fails.
        detectSessionInUrl: false,
      },
    },
  );
}
