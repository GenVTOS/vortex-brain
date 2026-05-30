"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Confidence } from "@/components/ui/Confidence";
import { T } from "@/lib/design/tokens";

interface QueueItem {
  id: string;
  message_content: string;
  company_id: string | null;
  risk_tier: string;
  confidence: number | null;
  status: string;
  person: { name: string; role: string } | null;
}

export function EADashboard() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [handledToday, setHandledToday] = useState(0);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/ea/queue");
      const d = await r.json();
      setItems(d.pending ?? []);
      setHandledToday(d.handledToday ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, kind: "approve" | "escalate") {
    setBusy(id);
    try {
      const url = kind === "approve" ? "/api/twin/approve" : "/api/twin/escalate";
      const body = kind === "approve" ? { queueId: id } : { queueId: id, reason: "EA handling" };
      await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      await load();
    } finally {
      setBusy(null);
    }
  }

  const reviewable = items.filter((i) => i.status === "pending_review");
  const inWindow = items.filter((i) => i.status === "queued");

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>EA Command</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Drafts awaiting you · auto-sends in their cancel window</div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 6, marginBottom: 14 }}>
        {[
          { l: "Needs Review", v: reviewable.length, c: T.red },
          { l: "In 60s Window", v: inWindow.length, c: T.amber },
          { l: "Handled Today", v: handledToday, c: T.green },
        ].map((s, i) => (
          <Glass key={i} style={{ textAlign: "center", padding: "10px 4px" }}>
            <div style={{ fontSize: 20, fontWeight: 700, color: s.c }}>{s.v}</div>
            <div style={{ fontSize: 8, color: T.muted, marginTop: 2 }}>{s.l}</div>
          </Glass>
        ))}
      </div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}
      {!loading && items.length === 0 && (
        <Glass><div style={{ fontSize: 11, color: T.sub }}>Nothing in the queue. The twin escalates here whenever it isn&apos;t confident enough to auto-send.</div></Glass>
      )}

      {items.map((it) => {
        const open = expanded === it.id;
        const tierColor = it.risk_tier === "tier1" ? T.green : it.risk_tier === "tier2" ? T.amber : T.red;
        return (
          <Glass key={it.id} style={{ marginBottom: 8 }} shimmer={it.status === "queued" ? T.amber : tierColor}>
            <div onClick={() => setExpanded(open ? null : it.id)} style={{ cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                  {it.company_id && <Tag color={T.sub}>{it.company_id.toUpperCase()}</Tag>}
                  <Tag color={tierColor}>{it.risk_tier}</Tag>
                  <Tag color={it.status === "queued" ? T.amber : T.red}>{it.status === "queued" ? "auto · 60s" : "review"}</Tag>
                  <span style={{ fontSize: 10, color: T.sub }}>{it.person?.name ?? "—"}</span>
                </div>
                <div style={{ fontSize: 11, color: T.white, lineHeight: 1.4 }}>{it.message_content.slice(0, open ? 1000 : 120)}{!open && it.message_content.length > 120 ? "…" : ""}</div>
              </div>
              {typeof it.confidence === "number" && <Confidence value={Math.round(it.confidence)} />}
            </div>
            {open && (
              <div style={{ display: "flex", gap: 6, marginTop: 10 }}>
                <button disabled={busy === it.id} onClick={() => act(it.id, "approve")} style={{ padding: "6px 14px", borderRadius: 6, border: "none", background: T.green, color: T.bg, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Send as Michael
                </button>
                <button disabled={busy === it.id} onClick={() => act(it.id, "escalate")} style={{ padding: "6px 14px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.red, fontSize: 10, cursor: "pointer" }}>
                  ✗ {it.status === "queued" ? "Cancel" : "I'll handle this"}
                </button>
              </div>
            )}
          </Glass>
        );
      })}
    </>
  );
}
