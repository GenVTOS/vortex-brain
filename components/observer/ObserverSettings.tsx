"use client";

import { useEffect, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

interface Block { domain: string; label: string | null; is_auto_detected: boolean }
interface Learning { id: string; source: string; insight: string; created_at: string }
interface Blackout { reason: string; trigger_detail: string | null; started_at: string; duration_seconds: number | null }

const CHANNELS = [
  { id: "emails", label: "Email Patterns", desc: "Tone, response priorities, drafting style" },
  { id: "browser", label: "Search & Browse", desc: "Research interests graph" },
  { id: "calendar", label: "Calendar", desc: "Time allocation across companies" },
  { id: "messaging", label: "Messaging Apps", desc: "Per-person tone & formality" },
  { id: "docs", label: "Document Editing", desc: "Revision patterns" },
  { id: "screen", label: "Full Screen Context", desc: "Periodic screenshots (most invasive)" },
];

export function ObserverSettings() {
  const [paused, setPaused] = useState(false);
  const [toggles, setToggles] = useState<Record<string, boolean>>({ emails: true, browser: true, calendar: true, messaging: true, docs: false, screen: false });
  const [blocklist, setBlocklist] = useState<Block[]>([]);
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [blackouts, setBlackouts] = useState<Blackout[]>([]);
  const [newDomain, setNewDomain] = useState("");

  async function load() {
    const r = await fetch("/api/observer");
    const d = await r.json();
    setBlocklist(d.blocklist ?? []);
    setLearnings(d.learnings ?? []);
    setBlackouts(d.blackouts ?? []);
  }
  useEffect(() => {
    load();
  }, []);

  async function addDomain() {
    if (!newDomain.trim()) return;
    await fetch("/api/observer", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ domain: newDomain.trim() }) });
    setNewDomain("");
    load();
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Computer Observer</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12, lineHeight: 1.5 }}>
        Learns from your computer activity. All processing is on-device first — only structured insights reach the brain, never raw screens or email bodies. (Desktop agent install is separate.)
      </div>

      {/* Privacy pause */}
      <Glass style={{ marginBottom: 12, borderColor: paused ? T.red + "44" : T.green + "33", background: paused ? T.red + "08" : T.glass } as React.CSSProperties}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: paused ? T.red : T.green }}>{paused ? "OBSERVER PAUSED" : "Observer Active"}</div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{paused ? "Nothing is being captured" : "Enabled channels recording"}</div>
          </div>
          <button onClick={() => setPaused((p) => !p)} style={{ padding: "8px 16px", borderRadius: 8, border: paused ? "none" : `1px solid ${T.red}44`, background: paused ? T.green : T.red + "12", color: paused ? T.bg : T.red, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            {paused ? "▶ Resume" : "⏸ Pause"}
          </button>
        </div>
      </Glass>

      {/* Channels */}
      <Sec>Data Channels</Sec>
      <Glass style={{ marginBottom: 12, opacity: paused ? 0.4 : 1 }}>
        {CHANNELS.map((c, i) => (
          <div key={c.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: i < CHANNELS.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 12, color: T.white }}>{c.label}</div>
              <div style={{ fontSize: 9, color: T.muted }}>{c.desc}</div>
            </div>
            <button onClick={() => !paused && setToggles((t) => ({ ...t, [c.id]: !t[c.id] }))} style={{ width: 40, height: 22, borderRadius: 11, border: "none", background: toggles[c.id] && !paused ? T.green : T.border, cursor: paused ? "not-allowed" : "pointer", position: "relative" }}>
              <span style={{ position: "absolute", top: 2, left: toggles[c.id] && !paused ? 20 : 2, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
            </button>
          </div>
        ))}
      </Glass>

      {/* Blocklist */}
      <Sec color={T.red}>🛡 Auto-Blackout Sites ({blocklist.length})</Sec>
      <Glass style={{ marginBottom: 12 }}>
        {blocklist.map((b, i) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0", borderBottom: i < blocklist.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div>
              <div style={{ fontSize: 11, color: T.white }}>{b.label}</div>
              <div style={{ fontSize: 9, color: T.muted, fontFamily: "monospace" }}>{b.domain}</div>
            </div>
            {b.is_auto_detected && <span style={{ fontSize: 8, color: T.muted, background: T.border, padding: "2px 6px", borderRadius: 4 }}>auto</span>}
          </div>
        ))}
        <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
          <input value={newDomain} onChange={(e) => setNewDomain(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addDomain()} placeholder="Add domain (e.g. paypal.com)" style={{ flex: 1, padding: "7px 10px", borderRadius: 6, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none", fontFamily: "monospace" }} />
          <button onClick={addDomain} style={{ padding: "7px 14px", borderRadius: 6, border: "none", background: T.border, color: T.sub, fontSize: 11, cursor: "pointer" }}>+ Add</button>
        </div>
      </Glass>

      {/* Blackout log */}
      <Sec>Blackout Log</Sec>
      <Glass style={{ marginBottom: 12 }}>
        {blackouts.length === 0 && <div style={{ fontSize: 10, color: T.muted }}>No blackouts logged yet.</div>}
        {blackouts.map((b, i) => (
          <div key={i} style={{ display: "flex", gap: 8, padding: "5px 0", borderBottom: i < blackouts.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: b.reason.startsWith("auto") ? T.amber : T.red, marginTop: 4, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 10, color: T.sub }}>{b.trigger_detail ?? b.reason}</div>
              <div style={{ fontSize: 9, color: T.muted }}>{new Date(b.started_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
      </Glass>

      {/* Learnings */}
      <Sec color={T.blue}>Recent Learnings</Sec>
      <Glass>
        {learnings.length === 0 && <div style={{ fontSize: 10, color: T.muted }}>No observer learnings yet. The desktop agent feeds structured insights here.</div>}
        {learnings.map((l, i) => (
          <div key={l.id} style={{ padding: "7px 0", borderBottom: i < learnings.length - 1 ? `1px solid ${T.border}` : "none" }}>
            <div style={{ fontSize: 11, color: T.sub, lineHeight: 1.4 }}>{l.insight}</div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 2 }}>{l.source} · {new Date(l.created_at).toLocaleDateString()}</div>
          </div>
        ))}
      </Glass>
    </>
  );
}
