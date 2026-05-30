import { createServerSupabase } from "@/lib/supabase/server";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

const OC_COLOR: Record<string, string> = {
  pending: T.sub,
  won: T.green,
  positive: T.green,
  tracking: T.amber,
  lost: T.red,
  negative: T.red,
};

export default async function DecisionsPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("decisions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  const list = data ?? [];
  const settled = list.filter((d) => d.outcome !== "pending");
  const wins = list.filter((d) => d.outcome === "won" || d.outcome === "positive").length;
  const accuracy = settled.length ? Math.round((wins / settled.length) * 100) : 0;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.white }}>Decisions</div>
        <div style={{ display: "flex", gap: 10 }}>
          {[
            { l: "Total", v: String(list.length) },
            { l: "Settled", v: String(settled.length) },
            { l: "Accuracy", v: `${accuracy}%` },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{s.v}</div>
              <div style={{ fontSize: 7, color: T.muted }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {list.length === 0 && <Glass><div style={{ fontSize: 11, color: T.sub }}>No decisions logged yet.</div></Glass>}

      {list.map((d) => {
        const ocC = OC_COLOR[d.outcome] ?? T.sub;
        const date = d.created_at ? new Date(d.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "";
        return (
          <Glass key={d.id} style={{ marginBottom: 6 }} shimmer={ocC}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
              {d.company_id && <Tag color={T.sub}>{d.company_id.toUpperCase()}</Tag>}
              <Tag color={ocC}>{d.outcome}</Tag>
              <span style={{ fontSize: 8, color: T.muted }}>{d.made_by === "bot" ? "🤖" : "M"} · {date}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{d.title}</div>
            {(d.reasoning || d.context) && (
              <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{d.reasoning ?? d.context}</div>
            )}
          </Glass>
        );
      })}
    </>
  );
}
