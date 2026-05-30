"use client";

import { useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T } from "@/lib/design/tokens";

interface Result {
  source_type?: string;
  company_id?: string | null;
  content: string;
}

export default function BrainSearchPage() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<Result[] | null>(null);
  const [loading, setLoading] = useState(false);

  async function run(query: string) {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 10 }}>Brain Search</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run(q)}
          placeholder="What did I say about..."
          style={{
            flex: 1,
            padding: "10px 12px",
            borderRadius: 10,
            border: `1px solid ${T.border}`,
            background: T.glass,
            color: T.white,
            fontSize: 11,
            outline: "none",
          }}
        />
        <button
          onClick={() => run(q)}
          style={{ padding: "10px 14px", borderRadius: 10, border: "none", background: T.blue, color: T.bg, fontSize: 10, fontWeight: 700, cursor: "pointer" }}
        >
          {loading ? "..." : "Search"}
        </button>
      </div>
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 10 }}>
        {["Pricing rules MP1", "Apex conversations", "Last talk with David", "My hiring criteria"].map((s, i) => (
          <button
            key={i}
            onClick={() => { setQ(s); run(s); }}
            style={{ padding: "3px 8px", borderRadius: 8, background: T.glass, border: `1px solid ${T.border}`, color: T.sub, fontSize: 8, cursor: "pointer" }}
          >
            {s}
          </button>
        ))}
      </div>

      {results === null && (
        <div style={{ fontSize: 10, color: T.muted, lineHeight: 1.6 }}>
          Searches your conversations, decisions, patterns, and the Obsidian vault — semantically (Voyage
          embeddings) and full-text, scoped to the right company wall. Results appear as your brain fills with data.
        </div>
      )}
      {results !== null && results.length === 0 && !loading && (
        <div style={{ fontSize: 10, color: T.muted }}>No results yet — the brain has no ingested memory for this query.</div>
      )}
      {results?.map((r, i) => (
        <Glass key={i} style={{ marginBottom: 6 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 2 }}>
            {r.source_type && <Tag color={T.blue}>{r.source_type}</Tag>}
            {r.company_id && <Tag color={T.sub}>{r.company_id}</Tag>}
          </div>
          <div style={{ fontSize: 10, color: T.sub, padding: "4px 8px", background: T.glass, borderRadius: 6, borderLeft: `2px solid ${T.border}` }}>
            {r.content.slice(0, 240)}
          </div>
        </Glass>
      ))}
    </>
  );
}
