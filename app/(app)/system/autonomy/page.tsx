import { createServerSupabase } from "@/lib/supabase/server";
import { Glass } from "@/components/ui/Glass";
import { T } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

const band = (a: number) => (a >= 60 ? T.green : a >= 40 ? T.amber : T.red);

export default async function AutonomyPage() {
  const supabase = createServerSupabase();
  const [{ data: companies }, { data: domains }] = await Promise.all([
    supabase.from("companies").select("id, name"),
    supabase.from("autonomy_domains").select("company_id, domain, confidence, sample_count"),
  ]);

  const byCompany = (companies ?? []).map((c) => {
    const ds = (domains ?? []).filter((d) => d.company_id === c.id);
    const avg = ds.length ? Math.round(ds.reduce((s, d) => s + (d.confidence ?? 0), 0) / ds.length) : 0;
    return { ...c, avg, domains: ds.sort((a, b) => (b.confidence ?? 0) - (a.confidence ?? 0)) };
  });

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Autonomy</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Earned per company per domain — grows as the bot observes you</div>
      {byCompany.map((c) => (
        <Glass key={c.id} style={{ marginBottom: 8 }} shimmer={band(c.avg)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{c.name}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>{c.avg}%</span>
          </div>
          <div style={{ width: "100%", height: 4, background: T.border, borderRadius: 2, overflow: "hidden", marginBottom: 8 }}>
            <div style={{ width: `${c.avg}%`, height: "100%", background: band(c.avg), borderRadius: 2, opacity: 0.7 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
            {c.domains.map((d) => (
              <div key={d.domain} style={{ display: "flex", justifyContent: "space-between", fontSize: 9, color: T.sub }}>
                <span>{d.domain.replace("_", " ")}</span>
                <span style={{ color: band(d.confidence ?? 0) }}>{Math.round(d.confidence ?? 0)}% · {d.sample_count}</span>
              </div>
            ))}
          </div>
        </Glass>
      ))}
    </>
  );
}
