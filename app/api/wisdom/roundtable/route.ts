import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { runRoundtable } from "@/lib/ai/wisdom";

export const runtime = "nodejs";
export const maxDuration = 60;

const DEFAULT_PANEL = ["buffett", "hormozi", "sy"];

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
  const topic = String(body.topic ?? "").trim();
  if (!topic) return NextResponse.json({ error: "topic required" }, { status: 400 });
  const expertIds: string[] = Array.isArray(body.expertIds) && body.expertIds.length
    ? body.expertIds.slice(0, 4)
    : DEFAULT_PANEL;

  const result = await runRoundtable(expertIds, topic, body.companyId ?? null);
  return NextResponse.json(result);
}
