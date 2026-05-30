import { createServerSupabase } from "@/lib/supabase/server";
import { Tag } from "@/components/ui/Tag";
import { T, healthColor } from "@/lib/design/tokens";

export const dynamic = "force-dynamic";

const FREQ_DAYS: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };

export default async function RadarPage() {
  const supabase = createServerSupabase();
  const { data } = await supabase
    .from("people")
    .select("*")
    .eq("is_active", true)
    .order("relationship_health", { ascending: true })
    .limit(50);
  const people = data ?? [];

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Radar</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Based on YOUR contact patterns</div>
      {people.map((p, i) => {
        const days = p.last_contact_at
          ? Math.round((Date.now() - new Date(p.last_contact_at).getTime()) / 86_400_000)
          : null;
        const target = FREQ_DAYS[p.contact_frequency_target ?? ""] ?? null;
        const overdue = days !== null && target !== null && days > target;
        const last = days === null ? "—" : days === 0 ? "Today" : `${days}d`;
        const flag =
          p.sentiment_trend === "negative"
            ? "⚠ sentiment dropping"
            : overdue
              ? `No contact ${days}d`
              : p.sentiment_trend === "watch"
                ? "watch"
                : null;
        const co = p.company_id ? p.company_id.toUpperCase() : p.role?.includes("CFO") ? "CFO" : "EA";
        return (
          <div
            key={p.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 0",
              borderBottom: i < people.length - 1 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div
              style={{
                width: 26,
                height: 26,
                borderRadius: "50%",
                background: `conic-gradient(${healthColor(p.relationship_health)} ${p.relationship_health}%, ${T.border} ${p.relationship_health}%)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  background: T.bg,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 7,
                  fontWeight: 700,
                  color: T.sub,
                }}
              >
                {p.name.split(" ").map((n: string) => n[0]).join("")}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: T.white }}>{p.name}</span>
                <Tag color={T.sub}>{co}</Tag>
                <span style={{ fontSize: 8, color: T.muted, marginLeft: "auto" }}>{last}</span>
              </div>
              {flag && (
                <div style={{ fontSize: 9, color: p.relationship_health < 50 ? T.red : T.amber, marginTop: 1 }}>
                  {flag}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}
