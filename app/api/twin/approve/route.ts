import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/security/audit";

export const runtime = "nodejs";

// "Send as Michael" — owner/EA approves a queued draft (or sends an edited one now).
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  if (role !== "owner" && role !== "ea") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const queueId = body.queueId as string | undefined;
  const editedText = body.editedText as string | undefined;
  if (!queueId) return NextResponse.json({ error: "queueId required" }, { status: 400 });

  const admin = createAdminClient();
  const update: Record<string, unknown> = { status: "sent", sent_at: new Date().toISOString() };
  if (editedText) update.message_content = editedText;
  const { data: row } = await admin
    .from("send_queue")
    .update(update)
    .eq("id", queueId)
    .in("status", ["queued", "edited"])
    .select()
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Not found or already processed" }, { status: 404 });

  await writeAudit({
    actor: role === "owner" ? "michael" : "rica",
    actionType: "send_as_michael",
    companyId: row.company_id,
    targetPersonId: row.recipient_person_id,
    detail: { queueId, edited: !!editedText, preview: String(row.message_content).slice(0, 200) },
    wasAuto: false,
  });

  return NextResponse.json({ sent: true });
}
