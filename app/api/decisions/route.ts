import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// GET: RLS-scoped decision list (team sees only their company).
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ decisions: data ?? [] });
}

// POST: log an outcome (owner/EA).
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
  if (!body.id || !body.outcome) {
    return NextResponse.json({ error: "id and outcome required" }, { status: 400 });
  }
  const admin = createAdminClient();
  await admin
    .from("decisions")
    .update({ outcome: body.outcome, outcome_notes: body.outcomeNotes ?? null, updated_at: new Date().toISOString() })
    .eq("id", body.id);
  return NextResponse.json({ ok: true });
}
