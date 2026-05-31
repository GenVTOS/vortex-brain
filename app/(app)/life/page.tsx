"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

interface PData {
  consentLevel: string;
  wifeName: string | null;
  dates: { id: string; title: string; date: string; type: string }[];
  suggestions: { act: string; detail: string; urg: string }[];
  dimensions: { label: string; value: number; target: number }[] | null;
  overall: number | null;
}

export default function InnerCirclePage() {
  const [data, setData] = useState<PData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const r = await fetch("/api/personal");
    if (r.ok) setData(await r.json());
    setLoading(false);
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function setConsent(level: string) {
    await fetch("/api/personal", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ consentLevel: level }) });
    load();
  }

  const dimColor = (v: number, t: number) => (v >= t ? T.green : v >= t - 20 ? T.amber : T.red);

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Inner Circle</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>The companies can wait. This can&apos;t.</div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}

      {data && (
        <>
          {/* Consent control (spec §8.7) */}
          <Glass style={{ marginBottom: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.white }}>Tracking level</div>
                <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{data.consentLevel === "full" ? "Full — sentiment + relationship health" : "Dates only — reminders, no analysis"}</div>
              </div>
              <div style={{ display: "flex", gap: 4 }}>
                <button onClick={() => setConsent("dates_only")} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: data.consentLevel !== "full" ? T.rose : T.glass, color: data.consentLevel !== "full" ? T.bg : T.sub, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Dates</button>
                <button onClick={() => setConsent("full")} style={{ padding: "5px 10px", borderRadius: 6, border: "none", background: data.consentLevel === "full" ? T.rose : T.glass, color: data.consentLevel === "full" ? T.bg : T.sub, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>Full</button>
              </div>
            </div>
            <div style={{ fontSize: 9, color: T.sub, marginTop: 6, lineHeight: 1.4 }}>Talk to her before turning on Full — it analyzes message sentiment. The bot never messages family; suggestions are yours to act on.</div>
          </Glass>

          {/* Health (full mode only) */}
          {data.dimensions && (
            <Glass style={{ marginBottom: 10, background: T.rose + "05", borderColor: T.rose + "10" } as React.CSSProperties} shimmer={T.rose}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 18 }}>❤️</span>
                  <div style={{ fontSize: 14, fontWeight: 600, color: T.rose }}>{data.wifeName ?? "Your Wife"}</div>
                </div>
                <div style={{ fontSize: 20, fontWeight: 700, color: T.rose }}>{data.overall}%</div>
              </div>
              {data.dimensions.map((d, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, padding: "2px 0" }}>
                  <span style={{ fontSize: 8, color: T.sub, width: 80, textAlign: "right" }}>{d.label}</span>
                  <div style={{ flex: 1, height: 3, background: T.border, borderRadius: 2, overflow: "hidden", position: "relative" }}>
                    <div style={{ width: `${d.value}%`, height: "100%", background: dimColor(d.value, d.target), borderRadius: 2 }} />
                    <div style={{ position: "absolute", left: `${d.target}%`, top: 0, width: 1, height: "100%", background: "rgba(255,255,255,0.15)" }} />
                  </div>
                  <span style={{ fontSize: 8, color: dimColor(d.value, d.target), fontWeight: 600, width: 20, textAlign: "right" }}>{d.value}</span>
                </div>
              ))}
            </Glass>
          )}

          {/* Upcoming dates */}
          <Sec color={T.rose}>Upcoming</Sec>
          {data.dates.length === 0 && <Glass style={{ marginBottom: 8 }}><div style={{ fontSize: 10, color: T.muted }}>No dates yet.</div></Glass>}
          {data.dates.map((d) => {
            const days = Math.round((new Date(d.date).getTime() - Date.now()) / 86_400_000);
            return (
              <Glass key={d.id} style={{ marginBottom: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 500, color: T.white }}>{d.title}</div>
                    <div style={{ fontSize: 9, color: T.sub, marginTop: 1 }}>{new Date(d.date).toLocaleDateString()} · in {days}d</div>
                  </div>
                  <Tag color={T.rose}>{d.type}</Tag>
                </div>
              </Glass>
            );
          })}

          {/* Suggestions */}
          <Sec color={T.rose}>Suggestions</Sec>
          {data.suggestions.map((a, i) => (
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
      )}
    </>
  );
}
