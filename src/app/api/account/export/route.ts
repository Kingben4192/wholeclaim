import { NextResponse } from "next/server";
import JSZip from "jszip";
import { createClient } from "@/lib/supabase/server";

// Product Bible, Account & Billing: "Always self-serve export (JSON + files)."
// Reads only through the user's own RLS-scoped session — no service role
// needed, since every table here already restricts to auth.uid() = user_id.
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  }

  const [profile, claims, entries, deadlines, evidenceItems, files, leads] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("claims").select("*").eq("user_id", user.id),
    supabase.from("entries").select("*").eq("user_id", user.id),
    supabase.from("deadlines").select("*").eq("user_id", user.id),
    supabase.from("evidence_items").select("*").eq("user_id", user.id),
    supabase.from("files").select("*").eq("user_id", user.id),
    user.email
      ? supabase.from("leads").select("*").ilike("email", user.email)
      : Promise.resolve({ data: [] as unknown[] }),
  ]);

  const zip = new JSZip();
  zip.file(
    "data.json",
    JSON.stringify(
      {
        exported_at: new Date().toISOString(),
        profile: profile.data,
        claims: claims.data,
        entries: entries.data,
        deadlines: deadlines.data,
        evidence_items: evidenceItems.data,
        files: files.data,
        grader_leads: leads.data,
      },
      null,
      2,
    ),
  );

  const filesFolder = zip.folder("files");
  for (const file of files.data ?? []) {
    const { data: blob } = await supabase.storage
      .from("evidence")
      .download(file.storage_path);
    if (blob) {
      filesFolder?.file(file.original_name, await blob.arrayBuffer());
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(new Uint8Array(zipBuffer), {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="wholeclaim-export-${user.id}.zip"`,
    },
  });
}
