import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// People list — company-scoped for team; sorted by health asc (most urgent first,
// which is what the Radar wants).
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  const company = (user.app_metadata as { company_id?: string })?.company_id;

  const admin = createAdminClient();
  let q = admin
    .from("people")
    .select(
      "id, name, role, company_id, type, contact_classification, relationship_health, last_contact_at, sentiment_trend, communication_profile",
    )
    .eq("is_active", true)
    .order("relationship_health", { ascending: true });
  if (role === "team" && company) q = q.eq("company_id", company);

  const { data } = await q;
  return NextResponse.json({ people: data ?? [] });
}
