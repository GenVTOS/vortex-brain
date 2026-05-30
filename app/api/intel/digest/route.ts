import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { data } = await supabase
    .from("algorithm_intel")
    .select("*")
    .order("capture_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return NextResponse.json({ digest: data ?? null });
}
