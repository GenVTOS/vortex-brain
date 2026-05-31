import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// L3 — owner ONLY. Personal suggestions are computed HERE (not in proactive_actions,
// which the EA can see) so personal life never leaks into a business queue.

async function ownerGate() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  if ((user.app_metadata as { role?: string })?.role !== "owner") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

const DIMS = [
  { key: "qualityTime", label: "Quality Time", target: 80, momentTypes: ["quality_time"], window: 14, per: 4 },
  { key: "communication", label: "Communication", target: 85, momentTypes: ["message", "positive"], window: 7, per: 10 },
  { key: "dateNights", label: "Date Nights", target: 75, momentTypes: ["quality_time"], window: 30, per: 3 },
  { key: "thoughtfulness", label: "Thoughtfulness", target: 60, momentTypes: ["positive"], window: 14, per: 4 },
  { key: "support", label: "Support", target: 85, momentTypes: ["positive", "quality_time"], window: 14, per: 3 },
];

export async function GET() {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const [{ data: consent }, { data: dates }, { data: wife }, { data: moments }] = await Promise.all([
    admin.from("partner_consent").select("*").limit(1).maybeSingle(),
    admin.from("personal_dates").select("*").gte("date", today).order("date").limit(10),
    admin.from("people").select("*").eq("type", "wife").limit(1).maybeSingle(),
    admin.from("personal_moments").select("*").order("occurred_at", { ascending: false }).limit(60),
  ]);

  const level = consent?.consent_level ?? "dates_only";

  // Suggestions from upcoming dates (always available — these are dates, not sentiment).
  const suggestions: { act: string; detail: string; urg: string }[] = [];
  for (const d of dates ?? []) {
    const days = Math.round((new Date(d.date).getTime() - Date.now()) / 86_400_000);
    if (days <= 14) suggestions.push({ act: `Plan for ${d.title}`, detail: `In ${days} day${days === 1 ? "" : "s"}.`, urg: days <= 3 ? "now" : "week" });
  }
  suggestions.push({ act: "Send a midday check-in", detail: "A small touch goes a long way.", urg: "now" });

  // Sentiment dimensions ONLY if consent is 'full' (spec §8.7).
  let dimensions: { label: string; value: number; target: number }[] | null = null;
  let overall: number | null = null;
  if (level === "full") {
    const now = Date.now();
    dimensions = DIMS.map((d) => {
      const count = (moments ?? []).filter(
        (m) => d.momentTypes.includes(m.type) && now - new Date(m.occurred_at).getTime() <= d.window * 86_400_000,
      ).length;
      return { label: d.label, value: Math.min(100, Math.round((count / d.per) * 100)), target: d.target };
    });
    overall = Math.round(dimensions.reduce((s, x) => s + x.value, 0) / dimensions.length);
  }

  return NextResponse.json({
    consentLevel: level,
    wifeName: wife?.name ?? null,
    dates: dates ?? [],
    suggestions,
    dimensions,
    overall,
  });
}

// Update consent level.
export async function PATCH(req: NextRequest) {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const body = await req.json().catch(() => ({}));
  const level = body.consentLevel === "full" ? "full" : "dates_only";
  const admin = createAdminClient();
  const { data: existing } = await admin.from("partner_consent").select("id").limit(1).maybeSingle();
  if (existing) {
    await admin.from("partner_consent").update({ consent_level: level, consented_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq("id", existing.id);
  } else {
    await admin.from("partner_consent").insert({ consent_level: level, consented_at: new Date().toISOString() });
  }
  return NextResponse.json({ ok: true, consentLevel: level });
}
