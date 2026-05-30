import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { writeAudit } from "@/lib/security/audit";

export const runtime = "nodejs";

const URGENCY_RANK: Record<string, number> = { now: 0, today: 1, this_week: 2, next_week: 3 };

// GET: pending proactive actions (RLS-scoped), sorted by urgency.
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("proactive_actions")
    .select("*")
    .eq("status", "pending")
    .limit(50);
  const actions = (data ?? []).sort(
    (a, b) => (URGENCY_RANK[a.urgency] ?? 9) - (URGENCY_RANK[b.urgency] ?? 9),
  );
  return NextResponse.json({ actions });
}

// PATCH: execute or dismiss (owner/EA). "Execute" only marks intent — it never
// sends to a real person here; real delivery still routes through the twin/queue.
export async function PATCH(req: NextRequest) {
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
  const { id, op } = body as { id?: string; op?: string };
  if (!id || (op !== "execute" && op !== "dismiss")) {
    return NextResponse.json({ error: "id and op (execute|dismiss) required" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { data: row } = await admin
    .from("proactive_actions")
    .update({
      status: op === "execute" ? "executed" : "dismissed",
      executed_at: op === "execute" ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .select()
    .maybeSingle();

  if (row) {
    await writeAudit({
      actor: role === "owner" ? "michael" : "rica",
      actionType: "action_executed",
      companyId: row.company_id,
      detail: { op, title: row.title },
    });
  }
  return NextResponse.json({ ok: true });
}
