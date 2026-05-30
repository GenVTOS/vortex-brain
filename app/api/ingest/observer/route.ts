import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { z } from "zod";

export const runtime = "nodejs";

// Receives ONLY pre-classified, sanitized insights from the on-device observer
// agent — never raw screen/email content (spec §4.2, hardening V-4.2). Secret-
// guarded. The desktop agent itself (Tauri) is a separate, deferred build.
const schema = z.object({
  source: z.enum(["email", "browser", "calendar", "messaging", "docs", "screen"]),
  insight: z.string().min(1).max(1000),
  companyId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-observer-secret");
  if (!process.env.OBSERVER_WEBHOOK_SECRET || secret !== process.env.OBSERVER_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const parsed = schema.safeParse(await req.json().catch(() => ({})));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const admin = createAdminClient();
  const { error } = await admin.from("observer_learnings").insert({
    source: parsed.data.source,
    insight: parsed.data.insight,
    company_id: parsed.data.companyId ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
