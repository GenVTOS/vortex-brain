import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

async function ownerGate() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  if ((user.app_metadata as { role?: string })?.role !== "owner") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function GET() {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const [{ data: thresholds }, { data: dms }] = await Promise.all([
    admin.from("emergency_config").select("type, threshold_description, action").eq("is_active", true),
    admin.from("dead_mans_switch").select("is_triggered").limit(1).maybeSingle(),
  ]);
  return NextResponse.json({ thresholds: thresholds ?? [], deadManTriggered: dms?.is_triggered ?? false });
}

// Acknowledge — clears the dead-man trigger and records the interaction.
export async function POST() {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const { data: row } = await admin.from("dead_mans_switch").select("id").limit(1).maybeSingle();
  if (row) {
    await admin
      .from("dead_mans_switch")
      .update({ last_michael_interaction: new Date().toISOString(), is_triggered: false, acknowledged_at: new Date().toISOString() })
      .eq("id", row.id);
  }
  return NextResponse.json({ ok: true });
}
