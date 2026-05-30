import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// EA queue: drafts awaiting review ('pending_review') + auto-sends still in their
// 60s window ('queued'), plus a count of what was handled today.
export async function GET() {
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
  const { data: pending } = await admin
    .from("send_queue")
    .select(
      "id, message_content, company_id, risk_tier, confidence, status, send_at, queued_at, person:recipient_person_id(name, role)",
    )
    .in("status", ["queued", "pending_review"])
    .order("queued_at", { ascending: false })
    .limit(50);

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const { count: handledToday } = await admin
    .from("send_queue")
    .select("id", { count: "exact", head: true })
    .eq("status", "sent")
    .gte("sent_at", todayStart.toISOString());

  return NextResponse.json({ pending: pending ?? [], handledToday: handledToday ?? 0 });
}
