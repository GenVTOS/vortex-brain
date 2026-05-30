import { Glass } from "@/components/ui/Glass";
import { T } from "@/lib/design/tokens";
import { CO } from "@/components/screens/data";

export default function AutonomyPage() {
  const band = (a: number) => (a >= 60 ? T.green : a >= 40 ? T.amber : T.red);
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Autonomy</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Path to company #6</div>
      {CO.map((c, i) => (
        <Glass key={i} style={{ marginBottom: 6 }} shimmer={band(c.auto)}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
            <span style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{c.name}</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.white }}>{c.auto}%</span>
          </div>
          <div style={{ width: "100%", height: 4, background: T.border, borderRadius: 2, overflow: "hidden" }}>
            <div style={{ width: `${c.auto}%`, height: "100%", background: band(c.auto), borderRadius: 2, opacity: 0.7 }} />
          </div>
        </Glass>
      ))}
    </>
  );
}
