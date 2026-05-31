import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const admin = createAdminClient();
  const { data } = await admin.from("system_config").select("transparency_mode").eq("id", 1).maybeSingle();
  return NextResponse.json({ transparencyMode: data?.transparency_mode ?? false });
}

export async function PATCH(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  const admin = createAdminClient();
  await admin
    .from("system_config")
    .update({ transparency_mode: !!body.transparencyMode, updated_at: new Date().toISOString() })
    .eq("id", 1);
  return NextResponse.json({ ok: true, transparencyMode: !!body.transparencyMode });
}
