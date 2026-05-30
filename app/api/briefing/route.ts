import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Role-filtered briefing (hardening V-7.1): owner gets the full payload incl. L3
// personal/health; EA/team get business-only — personal fields are simply absent.
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata as { role?: string })?.role ?? "team";

  const [{ data: companies }, { data: actions }, { data: decisions }] = await Promise.all([
    supabase.from("companies").select("id,name,icon,autonomy_score"),
    supabase
      .from("proactive_actions")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(10),
    supabase
      .from("decisions")
      .select("*")
      .eq("outcome", "pending")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const business = { role, companies, actions, decisions };

  // Personal + health ONLY for the owner.
  if (role !== "owner") return NextResponse.json(business);

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: personalDates }, { data: health }, { data: consent }] = await Promise.all([
    supabase.from("personal_dates").select("*").gte("date", today).order("date").limit(5),
    supabase.from("health_daily").select("*").eq("date", today).maybeSingle(),
    supabase.from("partner_consent").select("*").limit(1).maybeSingle(),
  ]);

  return NextResponse.json({ ...business, personalDates, health, partnerConsent: consent });
}
