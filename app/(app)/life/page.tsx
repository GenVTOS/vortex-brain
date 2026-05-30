import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

// Inner Circle (L3, owner-only). Personal data is walled at RLS + API; this screen
// renders for the owner. Sentiment depth is gated by partner_consent (Phase 6).
export default function InnerCirclePage() {
  const dims = [
    { l: "Quality Time", v: 58, t: 80 },
    { l: "Communication", v: 82, t: 85 },
    { l: "Date Nights", v: 45, t: 75 },
    { l: "Thoughtfulness", v: 30, t: 60 },
    { l: "Support", v: 91, t: 85 },
  ];
  const actions = [
    { act: "Send midday check-in", detail: "Only 1 text today", urg: "now" },
    { act: "Book Siargao anniversary trip", detail: "She saved a reel. Apr 12-14 works.", urg: "week" },
    { act: "Schedule recurring date night", detail: "45 days since last. Block Fridays.", urg: "week" },
  ];
  const dimColor = (v: number, t: number) => (v >= t ? T.green : v >= t - 20 ? T.amber : T.red);
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Inner Circle</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>The companies can wait. This can&apos;t.</div>

      <Glass style={{ marginBottom: 10, background: T.rose + "05", borderColor: T.rose + "10" } as React.CSSProperties} shimmer={T.rose}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 18 }}>❤️</span>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.rose }}>Your Wife</div>
              <div style={{ fontSize: 9, color: T.sub }}>Anniversary in 6 days</div>
            </div>
          </div>
          <div style={{ fontSize: 20, fontWeight: 700, color: T.rose }}>74%</div>
        </div>
        {dims.map((d, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
            <span style={{ fontSize: 8, color: T.sub, width: 75, textAlign: "right" }}>{d.l}</span>
            <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2, overflow: "hidden", position: "relative" }}>
              <div style={{ width: `${d.v}%`, height: "100%", background: dimColor(d.v, d.t), borderRadius: 2 }} />
              <div style={{ position: "absolute", left: `${d.t}%`, top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.15)" }} />
            </div>
            <span style={{ fontSize: 8, color: dimColor(d.v, d.t), fontWeight: 600, width: 20, textAlign: "right" }}>{d.v}</span>
          </div>
        ))}
      </Glass>

      <Sec color={T.rose}>Actions</Sec>
      {actions.map((a, i) => (
        <Glass key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 500, color: T.white }}>{a.act}</div>
              <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{a.detail}</div>
            </div>
            <Tag color={a.urg === "now" ? T.red : T.amber}>{a.urg}</Tag>
          </div>
        </Glass>
      ))}
    </>
  );
}
