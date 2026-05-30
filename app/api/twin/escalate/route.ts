import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/security/audit";

export const runtime = "nodejs";

// Cancel a queued draft within the 60s window ("I'll handle this").
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
  if (!queueId) return NextResponse.json({ error: "queueId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: row } = await admin
    .from("send_queue")
    .update({
      status: "cancelled",
      cancelled_by: role === "owner" ? "michael" : "rica",
      cancel_reason: String(body.reason ?? "handled manually"),
    })
    .eq("id", queueId)
    .eq("status", "queued")
    .select()
    .maybeSingle();

  if (!row) return NextResponse.json({ error: "Not found or already sent" }, { status: 404 });

  await writeAudit({
    actor: role === "owner" ? "michael" : "rica",
    actionType: "message_cancelled",
    companyId: row.company_id,
    targetPersonId: row.recipient_person_id,
    detail: { queueId, reason: body.reason ?? "handled manually" },
  });

  return NextResponse.json({ cancelled: true });
}
