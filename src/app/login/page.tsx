import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LoginForm } from "./LoginForm";

// Homepage/login auth-blindness fix (2026-07-29) -- an already-signed-in
// user landing here previously saw the full sign-in form with no
// indication they didn't need it, and could unnecessarily request a new
// magic-link code. This mirrors /account's own auth-check pattern
// (src/app/account/page.tsx) rather than checking client-side, so a
// signed-in visitor never sees the form render at all.
export default async function LoginPage() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      redirect("/account");
    }
  }

  return <LoginForm />;
}
