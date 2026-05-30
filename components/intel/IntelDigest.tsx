"use client";

import { useEffect, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

interface Item {
  title: string;
  creator?: string;
  category?: string;
  relevance_score?: number;
  company_applications?: { company: string; application: string }[];
}
interface Digest {
  capture_date: string;
  digest_summary: string | null;
  items: Item[];
  trend_detection: { trend: string; frequency: number; direction: string }[];
}

export function IntelDigest() {
  const [digest, setDigest] = useState<Digest | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/intel/digest")
      .then((r) => r.json())
      .then((d) => setDigest(d.digest))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>📡 Algorithm Intel</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12, lineHeight: 1.5 }}>
        Turns what your Facebook algorithm surfaces into a business-relevant daily digest. Read-only, no interaction. (Live capture agent runs on your machine — deferred for now.)
      </div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}
      {!loading && !digest && (
        <Glass><div style={{ fontSize: 11, color: T.sub }}>No digest yet. Once the on-device capture agent runs, your daily AI/business feed lands here, cross-referenced against your companies.</div></Glass>
      )}

      {digest && (
        <>
          <Glass style={{ marginBottom: 10 }} shimmer={T.plum}>
            <Sec color={T.plum}>{digest.capture_date}</Sec>
            <div style={{ fontSize: 11, color: T.white, lineHeight: 1.5 }}>{digest.digest_summary ?? "—"}</div>
          </Glass>

          {(digest.trend_detection ?? []).length > 0 && (
            <Glass style={{ marginBottom: 10 }}>
              <Sec>Trends</Sec>
              {digest.trend_detection.map((t, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: T.sub, padding: "3px 0" }}>
                  <span>{t.trend}</span>
                  <span style={{ color: t.direction === "accelerating" ? T.green : T.muted }}>{t.frequency}× · {t.direction}</span>
                </div>
              ))}
            </Glass>
          )}

          {(digest.items ?? []).map((it, i) => (
            <Glass key={i} style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                {it.category && <Tag color={T.blue}>{it.category}</Tag>}
                {typeof it.relevance_score === "number" && <Tag color={T.green}>{`${it.relevance_score}%`}</Tag>}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{it.title}</div>
              {it.creator && <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{it.creator}</div>}
              {(it.company_applications ?? []).map((a, j) => (
                <div key={j} style={{ fontSize: 10, color: T.plum, marginTop: 4 }}>→ {a.company.toUpperCase()}: {a.application}</div>
              ))}
            </Glass>
          ))}
        </>
      )}
    </>
  );
}
