"use client";

import { useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { T } from "@/lib/design/tokens";

const EXPERTS = [
  { id: "bezos", name: "Jeff Bezos", dom: "Infrastructure, long-term", av: "JB" },
  { id: "buffett", name: "Warren Buffett", dom: "Capital allocation", av: "WB" },
  { id: "thiel", name: "Peter Thiel", dom: "Contrarian, monopoly", av: "PT" },
  { id: "hormozi", name: "Alex Hormozi", dom: "Scaling services", av: "AH" },
  { id: "grove", name: "Andy Grove", dom: "Operations, OKRs", av: "AG" },
  { id: "munger", name: "Charlie Munger", dom: "Mental models", av: "CM" },
  { id: "dalio", name: "Ray Dalio", dom: "Principles, systems", av: "RD" },
  { id: "sy", name: "Henry Sy", dom: "PH conglomerate", av: "HS" },
];

interface Turn {
  name: string;
  av: string;
  text: string;
}

export default function CouncilPage() {
  const [topic, setTopic] = useState("");
  const [selected, setSelected] = useState<string[]>(["buffett", "hormozi", "sy"]);
  const [turns, setTurns] = useState<Turn[] | null>(null);
  const [synthesis, setSynthesis] = useState("");
  const [loading, setLoading] = useState(false);

  function toggle(id: string) {
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : s.length < 4 ? [...s, id] : s));
  }

  async function run() {
    if (!topic.trim() || selected.length === 0) return;
    setLoading(true);
    setTurns(null);
    setSynthesis("");
    try {
      const r = await fetch("/api/wisdom/roundtable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic, expertIds: selected }),
      });
      const d = await r.json();
      setTurns(d.messages ?? []);
      setSynthesis(d.synthesis ?? "");
    } catch {
      setSynthesis("Something went wrong — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Wisdom Council</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Pick up to 4 advisors, pose a decision, let them debate</div>

      <input
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && run()}
        placeholder="e.g. Should I give Ayala 15% or hold firm?"
        style={{ width: "100%", padding: "10px 12px", borderRadius: 10, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 12, outline: "none", marginBottom: 10 }}
      />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 6, marginBottom: 12 }}>
        {EXPERTS.map((e) => {
          const on = selected.includes(e.id);
          return (
            <Glass key={e.id} onClick={() => toggle(e.id)} style={{ padding: 10, borderColor: on ? T.plum + "55" : T.border, background: on ? T.plum + "10" : T.glass } as React.CSSProperties}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 26, height: 26, borderRadius: "50%", background: T.plum + (on ? "33" : "15"), display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: T.plum }}>{e.av}</div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: on ? T.white : T.sub }}>{e.name}</div>
                  <div style={{ fontSize: 8, color: T.muted }}>{e.dom}</div>
                </div>
              </div>
            </Glass>
          );
        })}
      </div>

      <button
        onClick={run}
        disabled={loading || !topic.trim() || selected.length === 0}
        style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: T.plum, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: loading || !topic.trim() ? 0.6 : 1, marginBottom: 14 }}
      >
        {loading ? "The council is deliberating…" : `Convene Roundtable (${selected.length})`}
      </button>

      {turns?.map((m, i) => (
        <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: T.plum + "18", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 8, fontWeight: 700, color: T.plum, flexShrink: 0 }}>{m.av}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: T.plum, marginBottom: 2 }}>{m.name}</div>
            <div style={{ fontSize: 11, color: T.white, lineHeight: 1.55, padding: "8px 10px", background: T.glass, borderRadius: "2px 10px 10px 10px", border: `1px solid ${T.border}` }}>{m.text}</div>
          </div>
        </div>
      ))}

      {synthesis && (
        <Glass style={{ background: T.plum + "05", borderColor: T.plum + "12" } as React.CSSProperties} shimmer={T.plum}>
          <div style={{ fontSize: 8, color: T.plum, fontWeight: 700, marginBottom: 3 }}>🧠 SYNTHESIS</div>
          <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>{synthesis}</div>
        </Glass>
      )}
    </>
  );
}
