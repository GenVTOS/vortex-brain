"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

interface Learning {
  id: string;
  content: string;
  source: string;
  company_scope: string;
}

export function TrainConsole() {
  const [rule, setRule] = useState("");
  const [botSaid, setBotSaid] = useState("");
  const [corrected, setCorrected] = useState("");
  const [learnings, setLearnings] = useState<Learning[]>([]);
  const [dead, setDead] = useState<{ isTriggered: boolean; hoursSince: number; thresholdHours: number } | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(async () => {
    const [l, d] = await Promise.all([fetch("/api/training/learnings").then((r) => r.json()), fetch("/api/dead-man").then((r) => r.json())]);
    setLearnings(l.learnings ?? []);
    setDead(d);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function saveRule() {
    if (!rule.trim()) return;
    await fetch("/api/training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "rule", content: rule }) });
    setRule("");
    setMsg("Rule saved (frozen — only you can change it).");
    setTimeout(() => setMsg(""), 2500);
  }
  async function saveCorrection() {
    if (!corrected.trim()) return;
    const r = await fetch("/api/training", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "correction", botSaid, corrected }) });
    const d = await r.json();
    setBotSaid("");
    setCorrected("");
    setMsg(`Learned: ${d.learning ?? "saved"}`);
    setTimeout(() => setMsg(""), 3500);
    load();
  }
  async function review(id: string, action: "accept" | "reject") {
    await fetch("/api/training/learnings", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
    setLearnings((ls) => ls.filter((l) => l.id !== id));
  }
  async function imHere() {
    await fetch("/api/dead-man", { method: "POST" });
    load();
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Train</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Teach the twin directly — rules it can&apos;t learn its way past, and corrections.</div>

      {msg && <div style={{ fontSize: 10, color: T.green, marginBottom: 10 }}>{msg}</div>}

      {/* Dead man */}
      {dead && (
        <Glass style={{ marginBottom: 12, borderColor: dead.isTriggered ? T.red + "44" : T.border, background: dead.isTriggered ? T.red + "08" : T.glass } as React.CSSProperties}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, color: dead.isTriggered ? T.red : T.white }}>{dead.isTriggered ? "Dead-man switch TRIGGERED" : "Dead-man switch armed"}</div>
              <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{dead.hoursSince}h since you last checked in (limit {dead.thresholdHours}h → everything escalates).</div>
            </div>
            <button onClick={imHere} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: T.green, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>I&apos;m here</button>
          </div>
        </Glass>
      )}

      {/* Write rule */}
      <Sec color={T.plum}>Write a rule</Sec>
      <Glass style={{ marginBottom: 12 }}>
        <textarea value={rule} onChange={(e) => setRule(e.target.value)} placeholder="e.g. Never give discounts above 10% for MP1 contracts under 500 heads." rows={2} style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: T.bg, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none", resize: "vertical" }} />
        <button onClick={saveRule} style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, border: "none", background: T.plum, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Save frozen rule</button>
      </Glass>

      {/* Correction */}
      <Sec color={T.amber}>Correct the bot</Sec>
      <Glass style={{ marginBottom: 12 }}>
        <input value={botSaid} onChange={(e) => setBotSaid(e.target.value)} placeholder="What the bot said (optional)" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: T.bg, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none", marginBottom: 6 }} />
        <input value={corrected} onChange={(e) => setCorrected(e.target.value)} placeholder="What you'd have said instead" style={{ width: "100%", padding: "8px 10px", borderRadius: 8, background: T.bg, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none" }} />
        <button onClick={saveCorrection} style={{ marginTop: 8, padding: "8px 14px", borderRadius: 8, border: "none", background: T.amber, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Teach the correction</button>
      </Glass>

      {/* New learnings digest */}
      <Sec color={T.blue}>New learnings to review ({learnings.length})</Sec>
      {learnings.length === 0 && <Glass><div style={{ fontSize: 10, color: T.muted }}>Nothing pending. Patterns the bot extracts from meetings land here for your approval before they ever influence it.</div></Glass>}
      {learnings.map((l) => (
        <Glass key={l.id} style={{ marginBottom: 6 }}>
          <div style={{ fontSize: 11, color: T.white, lineHeight: 1.4 }}>{l.content}</div>
          <div style={{ fontSize: 9, color: T.muted, margin: "3px 0 8px" }}>{l.source} · scope {l.company_scope}</div>
          <div style={{ display: "flex", gap: 6 }}>
            <button onClick={() => review(l.id, "accept")} style={{ padding: "5px 12px", borderRadius: 6, border: "none", background: T.green, color: T.bg, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>✓ Accept</button>
            <button onClick={() => review(l.id, "reject")} style={{ padding: "5px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.red, fontSize: 9, cursor: "pointer" }}>✗ Reject</button>
          </div>
        </Glass>
      ))}
    </>
  );
}
