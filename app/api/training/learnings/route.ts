import { NextRequest, NextResponse } from "next/server";
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

// Pending learned traits awaiting Michael's review (poisoning defense, V-2.3).
export async function GET() {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const { data } = await admin
    .from("michael_core")
    .select("id, content, source, company_scope, corroboration_count, created_at")
    .eq("is_active", false)
    .in("source", ["extracted_from_meeting", "extracted_from_email", "correction"])
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ learnings: data ?? [] });
}

export async function PATCH(req: NextRequest) {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const { id, action } = body as { id?: string; action?: string };
  if (!id || (action !== "accept" && action !== "reject")) {
    return NextResponse.json({ error: "id and action (accept|reject) required" }, { status: 400 });
  }
  const admin = createAdminClient();
  if (action === "accept") {
    await admin.from("michael_core").update({ is_active: true, confidence: 0.75 }).eq("id", id);
  } else {
    await admin.from("michael_core").delete().eq("id", id);
  }
  return NextResponse.json({ ok: true });
}
