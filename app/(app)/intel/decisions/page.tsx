import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T } from "@/lib/design/tokens";

export default function DecisionsPage() {
  const stats = [
    { l: "Total", v: "317" },
    { l: "Accuracy", v: "84%" },
    { l: "Gut Win", v: "71%" },
  ];
  const decisions = [
    { date: "Apr 5", co: "ISP", title: "Approved Laguna tower", by: "🤖", oc: "pending", reason: "ROI 14mo payback" },
    { date: "Apr 3", co: "MP1", title: "Held pricing at 8%", by: "🤖", oc: "won", reason: "Vista accepted. ₱1.2M signed." },
    { date: "Mar 28", co: "VB", title: "Passed on Meridian", by: "🤖", oc: "tracking", reason: "Raised 2x but no CM data." },
    { date: "Mar 20", co: "BIO", title: "Hired Dr. Reyes", by: "🤖", oc: "positive", reason: "Found shortcut saving 4 months." },
  ];
  const ocColor: Record<string, string> = { pending: T.sub, won: T.green, tracking: T.amber, positive: T.green };
  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
        <div style={{ fontSize: 18, fontWeight: 600, color: T.white }}>Decisions</div>
        <div style={{ display: "flex", gap: 10 }}>
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.white }}>{s.v}</div>
              <div style={{ fontSize: 7, color: T.muted }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>
      {decisions.map((d, i) => {
        const ocC = ocColor[d.oc];
        return (
          <Glass key={i} style={{ marginBottom: 6 }} shimmer={ocC}>
            <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2, flexWrap: "wrap" }}>
              <Tag color={T.sub}>{d.co}</Tag>
              <Tag color={ocC}>{d.oc}</Tag>
              <span style={{ fontSize: 8, color: T.muted }}>{d.by} · {d.date}</span>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{d.title}</div>
            <div style={{ fontSize: 10, color: T.sub, marginTop: 2 }}>{d.reason}</div>
          </Glass>
        );
      })}
    </>
  );
}
