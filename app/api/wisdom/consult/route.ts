import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { consultExpert } from "@/lib/ai/wisdom";

export const runtime = "nodejs";
export const maxDuration = 60;

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
  const expertId = String(body.expertId ?? "");
  const topic = String(body.topic ?? "").trim();
  if (!expertId || !topic) {
    return NextResponse.json({ error: "expertId and topic required" }, { status: 400 });
  }
  const text = await consultExpert(expertId, topic, body.companyId ?? null);
  return NextResponse.json({ text });
}
