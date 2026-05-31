import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { renderMeetingMarkdown } from "@/lib/obsidian/render";

export const runtime = "nodejs";

// In-app Vault browser backend. Supabase is the source of truth; this renders the
// markdown PROJECTION on demand (resolves the serverless-write + thin-client
// constraint — no local Obsidian needed). ?path= renders one file.
export async function GET(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  if (role !== "owner" && role !== "ea") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const admin = createAdminClient();
  const path = req.nextUrl.searchParams.get("path");

  if (!path) {
    const { data } = await admin
      .from("obsidian_files")
      .select("file_path, file_type, company_id, last_synced_at")
      .order("last_synced_at", { ascending: false })
      .limit(200);
    return NextResponse.json({ files: data ?? [] });
  }

  const { data: file } = await admin.from("obsidian_files").select("*").eq("file_path", path).maybeSingle();
  if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 });

  let markdown = `# ${path}\n\n(no renderer for type "${file.file_type}" yet)`;
  if (file.file_type === "meeting" && file.source_ids?.[0]) {
    const { data: conv } = await admin.from("conversations").select("*").eq("id", file.source_ids[0]).maybeSingle();
    if (conv) {
      const company = conv.company_id
        ? (await admin.from("companies").select("name").eq("id", conv.company_id).maybeSingle()).data
        : null;
      markdown = renderMeetingMarkdown({
        title: (path.split("/").pop() ?? path).replace(".md", ""),
        date: (conv.recorded_at ?? "").slice(0, 10),
        companyName: company?.name ?? null,
        companyId: conv.company_id,
        summary: conv.summary,
        participants: [],
        decisions: (conv.decisions_extracted ?? []).map((d: { title: string; context?: string }) => ({ title: d.title, context: d.context })),
        commitments: (conv.commitments_extracted ?? []).map((c: { description: string }) => ({ description: c.description })),
      });
    }
  }
  return NextResponse.json({ path, markdown });
}
