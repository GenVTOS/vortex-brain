"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T, confColor } from "@/lib/design/tokens";

interface Action {
  id: string;
  company_id: string | null;
  type: string;
  title: string;
  detail: string | null;
  confidence: number | null;
  urgency: string;
}

const URG_COLOR: Record<string, string> = { now: T.red, today: T.red, this_week: T.amber, next_week: T.green };

export default function ActionsPage() {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/actions");
      const d = await r.json();
      setActions(d.actions ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function act(id: string, op: "execute" | "dismiss") {
    setBusy(id);
    try {
      await fetch("/api/actions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, op }),
      });
      setActions((a) => a.filter((x) => x.id !== id));
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Actions</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Bot-initiated — sorted by urgency</div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}
      {!loading && actions.length === 0 && (
        <Glass><div style={{ fontSize: 11, color: T.sub }}>No pending actions. The hourly engine surfaces follow-ups, check-ins, and cross-company synergies here.</div></Glass>
      )}

      {actions.map((a) => {
        const urg = URG_COLOR[a.urgency] ?? T.amber;
        return (
          <Glass key={a.id} style={{ marginBottom: 8 }} shimmer={urg}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  {a.company_id && <Tag color={T.sub}>{a.company_id.toUpperCase()}</Tag>}
                  <Tag color={urg}>{a.urgency.replace("_", " ")}</Tag>
                  <Tag color={T.blue}>{a.type}</Tag>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2 }}>{a.title}</div>
                {a.detail && <div style={{ fontSize: 10, color: T.sub }}>{a.detail}</div>}
              </div>
              {typeof a.confidence === "number" && (
                <span style={{ fontSize: 9, fontWeight: 600, color: confColor(a.confidence) }}>{a.confidence}%</span>
              )}
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <button disabled={busy === a.id} onClick={() => act(a.id, "execute")} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: T.green, color: T.bg, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                Execute
              </button>
              <button disabled={busy === a.id} onClick={() => act(a.id, "dismiss")} style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 9, cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
          </Glass>
        );
      })}
    </>
  );
}
