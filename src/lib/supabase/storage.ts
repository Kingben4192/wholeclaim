import type { SupabaseClient } from "@supabase/supabase-js";

// Recursively lists every object under a Storage prefix. Supabase's list()
// only returns one level at a time, and the evidence bucket nests
// {user_id}/{claim_id}/{file}, so this needs to walk each claim "folder."
export async function listAllObjects(
  supabase: SupabaseClient,
  bucket: string,
  prefix: string,
): Promise<string[]> {
  const { data: entries, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
  });
  if (error || !entries) return [];

  const paths: string[] = [];
  for (const entry of entries) {
    const path = `${prefix}/${entry.name}`;
    if (entry.id === null) {
      // No file id means this is a "folder" — recurse into it.
      paths.push(...(await listAllObjects(supabase, bucket, path)));
    } else {
      paths.push(path);
    }
  }
  return paths;
}
