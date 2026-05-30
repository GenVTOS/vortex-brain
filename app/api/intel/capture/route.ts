import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Facebook algorithm-intel capture. The live capture agent (Claude-in-Chrome,
// read-only) is DEFERRED — Michael is on a thin client, so daily on-device
// observation needs his machine. This endpoint accepts a posted day's items (for
// testing / a future agent) and stores them; with no items it reports deferred.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  if (!Array.isArray(body.items) || body.items.length === 0) {
    return NextResponse.json({ deferred: true, note: "Live capture agent deferred (thin client). POST {items:[...]} to store a day." });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("algorithm_intel").insert({
    source: body.source ?? "facebook",
    capture_date: new Date().toISOString().slice(0, 10),
    items: body.items,
    digest_summary: body.digest_summary ?? null,
    trend_detection: body.trend_detection ?? [],
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, stored: body.items.length });
}
