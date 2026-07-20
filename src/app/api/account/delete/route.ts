import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isServiceRoleConfigured, getAdminClient } from "@/lib/supabase/admin";
import { listAllObjects } from "@/lib/supabase/storage";

// Product Bible, Account & Billing: "Always self-serve export and deletion.
// Never a support ticket required to leave." Every table with a user_id FK
// to auth.users is ON DELETE CASCADE (0001/0002/0005 migrations), so
// deleting the auth user cleans the database. Storage isn't covered by that
// cascade, so files are removed first. `leads` isn't FK'd to auth.users
// either (it exists before any account does — Decision #29), so a grader
// lead matching this user's email is deleted explicitly, or it would
// silently survive "permanent" deletion.
export async function POST(request: NextRequest) {
  const { origin } = new URL(request.url);
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  if (!isServiceRoleConfigured()) {
    return NextResponse.json(
      { error: "This service isn't configured yet." },
      { status: 503 },
    );
  }

  const admin = getAdminClient();

  const filePaths = await listAllObjects(admin, "evidence", user.id);
  if (filePaths.length > 0) {
    await admin.storage.from("evidence").remove(filePaths);
  }

  if (user.email) {
    await admin.from("leads").delete().ilike("email", user.email);
  }

  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) {
    console.error("Account deletion failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // The user row is already gone; the local session cookie is stale
    // either way and the client will treat it as signed out.
  }

  return NextResponse.redirect(`${origin}/?deleted=1`);
}
