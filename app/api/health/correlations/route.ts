import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Health → decision correlations (L3, owner). Computes a simple sleep↔decision-
// accuracy correlation when there's enough data (needs Garmin sleep + settled
// decisions on matching dates); otherwise returns what exists + a note.
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();

  const [{ data: health }, { data: decisions }] = await Promise.all([
    admin.from("health_daily").select("date, sleep_duration_minutes").not("sleep_duration_minutes", "is", null),
    admin.from("decisions").select("created_at, outcome").neq("outcome", "pending"),
  ]);

  const sleepByDate = new Map<string, number>();
  for (const h of health ?? []) sleepByDate.set(h.date, h.sleep_duration_minutes);

  let lowN = 0, lowWin = 0, highN = 0, highWin = 0;
  for (const d of decisions ?? []) {
    const date = (d.created_at ?? "").slice(0, 10);
    const sleep = sleepByDate.get(date);
    if (sleep == null) continue;
    const win = d.outcome === "won" || d.outcome === "positive" ? 1 : 0;
    if (sleep < 360) { lowN++; lowWin += win; } else { highN++; highWin += win; }
  }

  const correlations: { correlation: string; strength: number; sampleCount: number }[] = [];
  if (lowN >= 3 && highN >= 3) {
    const lowAcc = Math.round((lowWin / lowN) * 100);
    const highAcc = Math.round((highWin / highN) * 100);
    correlations.push({
      correlation: `Decision accuracy ${highAcc - lowAcc >= 0 ? "drops" : "rises"} ${Math.abs(highAcc - lowAcc)}% on <6h sleep (${lowAcc}% vs ${highAcc}%).`,
      strength: Math.min(1, Math.abs(highAcc - lowAcc) / 100),
      sampleCount: lowN + highN,
    });
  }

  const { data: stored } = await admin.from("health_correlations").select("correlation, strength, sample_count").eq("is_active", true);
  return NextResponse.json({
    correlations: correlations.length ? correlations : (stored ?? []),
    note: correlations.length ? null : "Not enough matched sleep + decision data yet — connect Garmin and log decisions over time.",
  });
}
