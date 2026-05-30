import { createAdminClient } from "@/lib/supabase/admin";

// Records that a vault file should exist for a given Supabase source. The sync job
// reads obsidian_files + the source rows to materialize/commit the markdown.
export async function trackObsidianFile(opts: {
  filePath: string;
  fileType: string; // meeting | person | company | decision | pattern | expert | daily
  companyId: string | null;
  sourceId: string;
  contentHash?: string;
}): Promise<void> {
  const supabase = createAdminClient();
  await supabase.from("obsidian_files").upsert(
    {
      file_path: opts.filePath,
      file_type: opts.fileType,
      company_id: opts.companyId,
      source_ids: [opts.sourceId],
      content_hash: opts.contentHash ?? null,
      last_synced_at: new Date().toISOString(),
    },
    { onConflict: "file_path" },
  );
}
