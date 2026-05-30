"use client";

import { useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { T } from "@/lib/design/tokens";

export default function CouncilPage() {
  const [mode, setMode] = useState<"grid" | "roundtable">("grid");
  const experts = [
    { name: "Jeff Bezos", dom: "Infrastructure, long-term", av: "JB" },
    { name: "Warren Buffett", dom: "Capital allocation", av: "WB" },
    { name: "Peter Thiel", dom: "Contrarian, monopoly", av: "PT" },
    { name: "Alex Hormozi", dom: "Scaling services", av: "AH" },
    { name: "Andy Grove", dom: "Operations, OKRs", av: "AG" },
    { name: "Charlie Munger", dom: "Mental models", av: "CM" },
    { name: "Ray Dalio", dom: "Principles, systems", av: "RD" },
    { name: "Henry Sy", dom: "PH conglomerate", av: "HS" },
  ];

  if (mode === "roundtable") {
    const msgs = [
      { av: "WB", name: "Buffett", text: "Hold firm. Discounting below 10% trains clients to negotiate." },
      { av: "AH", name: "Hormozi", text: "Don't discount — add value. Onboarding support costs 3-4%, not 15%." },
      { av: "HS", name: "Henry Sy", text: "Ayala is an ecosystem. Give 10%, negotiate preferred vendor across subsidiaries. 5% 'loss' buys ₱50M lifetime." },
      { av: "WB", name: "Buffett", text: "Henry's point is excellent. If preferred status is contractual, the math changes entirely." },
    ];
    return (
      <>
        <button onClick={() => setMode("grid")} style={{ background: "none", border: "none", color: T.sub, fontSize: 10, cursor: "pointer", marginBottom: 10 }}>
          ← Back
        </button>
        <Glass style={{ marginBottom: 10 }} shimmer={T.plum}>
          <div style={{ fontSize: 8, color: T.muted, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>Roundtable</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: T.white }}>Should I give Ayala 15% or hold firm?</div>
        </Glass>
        {msgs.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
            <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.plum + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: T.plum, flexShrink: 0 }}>
              {m.av}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 9, fontWeight: 600, color: T.plum, marginBottom: 2 }}>{m.name}</div>
              <div style={{ fontSize: 11, color: T.white, lineHeight: 1.55, padding: "8px 10px", background: T.glass, borderRadius: "2px 10px 10px 10px", border: `1px solid ${T.border}` }}>
                {m.text}
              </div>
            </div>
          </div>
        ))}
        <Glass style={{ background: T.plum + "05", borderColor: T.plum + "12" } as React.CSSProperties} shimmer={T.plum}>
          <div style={{ fontSize: 8, color: T.plum, fontWeight: 700, marginBottom: 3 }}>🧠 SYNTHESIS</div>
          <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
            Don&apos;t give 15%. Buffett/Hormozi: value-adds at 10%. Sy: ecosystem play. Your pattern aligns with Sy — you&apos;ve traded margin for relationships 4/5 times.
          </div>
        </Glass>
      </>
    );
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Wisdom Council</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Consult experts or convene a roundtable</div>
      <Glass
        onClick={() => setMode("roundtable")}
        style={{ marginBottom: 14, background: T.plum + "05", borderColor: T.plum + "12" } as React.CSSProperties}
        shimmer={T.plum}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: T.plum }}>Start Roundtable ›</div>
        <div style={{ fontSize: 9, color: T.sub, marginTop: 2 }}>Multiple experts debate your decisions</div>
      </Glass>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6 }}>
        {experts.map((e, i) => (
          <Glass key={i} style={{ padding: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.plum + "15", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: T.plum }}>
                {e.av}
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>{e.name}</div>
                <div style={{ fontSize: 8, color: T.muted }}>{e.dom}</div>
              </div>
            </div>
          </Glass>
        ))}
      </div>
    </>
  );
}
