import { createServerSupabase } from "@/lib/supabase/server";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T, healthColor, confColor } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

export default async function BriefingPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  const isOwner = role === "owner";

  const today = new Date().toISOString().slice(0, 10);
  const [{ data: companies }, { data: people }, { data: decisions }, { data: actions }, healthRes, intelRes] =
    await Promise.all([
      supabase.from("companies").select("id, name, icon"),
      supabase.from("people").select("company_id, relationship_health"),
      supabase.from("decisions").select("id, company_id, title, context, outcome").eq("outcome", "pending").limit(4),
      supabase.from("proactive_actions").select("company_id, title, confidence, type").eq("status", "pending").limit(4),
      isOwner ? supabase.from("health_daily").select("*").eq("date", today).maybeSingle() : Promise.resolve({ data: null }),
      isOwner ? supabase.from("algorithm_intel").select("digest_summary, capture_date").order("capture_date", { ascending: false }).limit(1).maybeSingle() : Promise.resolve({ data: null }),
    ]);

  // Company "health" = avg relationship_health of its people (a real proxy until
  // financial/ops metrics are integrated).
  const coHealth = (companies ?? []).map((c) => {
    const ppl = (people ?? []).filter((p) => p.company_id === c.id);
    const h = ppl.length ? Math.round(ppl.reduce((s, p) => s + (p.relationship_health ?? 0), 0) / ppl.length) : 50;
    return { abbr: c.id.toUpperCase(), health: h };
  });

  const health = healthRes.data as Record<string, unknown> | null;
  const intel = intelRes.data as { digest_summary?: string; capture_date?: string } | null;

  return (
    <>
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 8, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>Morning Brief</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.white }}>Good morning, Michael.</div>
      </div>

      {/* Company health strip */}
      <Glass style={{ marginBottom: 10, padding: "8px 10px" }}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          {coHealth.map((c, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: healthColor(c.health) }}>{c.health}</div>
              <div style={{ fontSize: 7, color: T.sub, marginTop: 1 }}>{c.abbr}</div>
            </div>
          ))}
        </div>
      </Glass>

      {/* Financials placeholder (needs accounting integration) */}
      <Glass style={{ marginBottom: 10, padding: "8px 12px" }}>
        <Sec color={T.muted}>💰 Financial pulse</Sec>
        <div style={{ fontSize: 10, color: T.sub }}>Connect your accounting source to see cash, burn & receivables here.</div>
      </Glass>

      {/* Bot actions (real) */}
      <Glass style={{ marginBottom: 10, padding: "8px 12px" }}>
        <Sec color={T.blue}>⚡ Bot surfaced</Sec>
        {(actions ?? []).length === 0 && <div style={{ fontSize: 10, color: T.muted }}>Nothing pending. The hourly engine adds items here.</div>}
        {(actions ?? []).map((a, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0", borderBottom: i < (actions?.length ?? 0) - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              {a.company_id && <Tag color={T.blue}>{a.company_id.toUpperCase()}</Tag>}
              <span style={{ fontSize: 10, color: T.white }}>{a.title}</span>
            </div>
            {typeof a.confidence === "number" && <span style={{ fontSize: 9, fontWeight: 600, color: confColor(a.confidence) }}>{a.confidence}%</span>}
          </div>
        ))}
      </Glass>

      {/* Decisions (real) */}
      <Sec>◆ Decisions needing you</Sec>
      {(decisions ?? []).length === 0 && <Glass style={{ marginBottom: 8 }}><div style={{ fontSize: 10, color: T.muted }}>No open decisions.</div></Glass>}
      {(decisions ?? []).map((d, i) => (
        <Glass key={i} style={{ marginBottom: 8 }} shimmer={T.amber}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            {d.company_id && <Tag color={T.sub}>{d.company_id.toUpperCase()}</Tag>}
            <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{d.title}</span>
          </div>
          {d.context && <div style={{ fontSize: 10, color: T.sub }}>{d.context}</div>}
        </Glass>
      ))}

      {/* Algorithm intel (owner) */}
      {isOwner && intel?.digest_summary && (
        <Glass style={{ marginTop: 6, marginBottom: 6, background: T.plum + "05", borderColor: T.plum + "12" } as React.CSSProperties} shimmer={T.plum}>
          <div style={{ fontSize: 9, color: T.plum, fontWeight: 600, marginBottom: 3 }}>📡 Algorithm Intel · {intel.capture_date}</div>
          <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>{intel.digest_summary}</div>
        </Glass>
      )}

      {/* Vitals (owner, real from today's check-in) */}
      {isOwner && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
          {[
            { l: "Mood", v: health?.mood ? `${health.mood}/5` : "—", c: T.amber },
            { l: "Energy", v: health?.energy ? `${health.energy}/5` : "—", c: T.amber },
            { l: "Water", v: `${(health?.water_glasses as number) ?? 0}/8`, c: T.blue },
            { l: "Bible", v: health?.bible_reading ? "✓" : "—", c: health?.bible_reading ? T.green : T.muted },
          ].map((h, i) => (
            <Glass key={i} style={{ textAlign: "center", padding: "6px 4px" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: h.c }}>{h.v as string}</div>
              <div style={{ fontSize: 7, color: T.muted, marginTop: 1 }}>{h.l}</div>
            </Glass>
          ))}
        </div>
      )}
    </>
  );
}
