import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function requireOwner() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  if ((user.app_metadata as { role?: string })?.role !== "owner") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

// GET: blocklist + recent learnings + recent blackout log (owner only).
export async function GET() {
  const gate = await requireOwner();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const [{ data: blocklist }, { data: learnings }, { data: blackouts }] = await Promise.all([
    admin.from("observer_blocklist").select("*").order("created_at", { ascending: true }),
    admin.from("observer_learnings").select("*").order("created_at", { ascending: false }).limit(20),
    admin.from("observer_blackout_log").select("*").order("started_at", { ascending: false }).limit(10),
  ]);
  return NextResponse.json({ blocklist: blocklist ?? [], learnings: learnings ?? [], blackouts: blackouts ?? [] });
}

// POST: add a blocklist domain (owner only).
export async function POST(req: NextRequest) {
  const gate = await requireOwner();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const domain = String(body.domain ?? "").trim().toLowerCase();
  if (!domain) return NextResponse.json({ error: "domain required" }, { status: 400 });
  const admin = createAdminClient();
  await admin.from("observer_blocklist").upsert({ domain, label: body.label ?? domain, is_auto_detected: false }, { onConflict: "domain" });
  return NextResponse.json({ ok: true });
}
