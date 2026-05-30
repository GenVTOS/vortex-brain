"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T } from "@/lib/design/tokens";

interface Book {
  id: string;
  title: string;
  author: string | null;
  genre: string | null;
  status: string;
  suggestion_reason: string | null;
  relevance_to_company: string | null;
}

const STATUS_COLOR: Record<string, string> = { suggested: T.blue, reading: T.amber, finished: T.green, abandoned: T.muted };

export function BooksList() {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/books");
      const d = await r.json();
      setBooks(d.books ?? []);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  async function suggest() {
    setSuggesting(true);
    try {
      await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "suggest" }) });
      await load();
    } finally {
      setSuggesting(false);
    }
  }

  return (
    <>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.white }}>Reading</div>
          <div style={{ fontSize: 10, color: T.sub }}>Picks for your taste + what you&apos;re building</div>
        </div>
        <button onClick={suggest} disabled={suggesting} style={{ padding: "8px 12px", borderRadius: 8, border: "none", background: T.plum, color: T.bg, fontSize: 10, fontWeight: 700, cursor: "pointer" }}>
          {suggesting ? "Thinking…" : "Suggest more"}
        </button>
      </div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}
      {!loading && books.length === 0 && (
        <Glass><div style={{ fontSize: 11, color: T.sub }}>No books yet. Tap &quot;Suggest more&quot; for picks based on your reading profile + current business battles.</div></Glass>
      )}

      {books.map((b) => (
        <Glass key={b.id} style={{ marginBottom: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
            <Tag color={STATUS_COLOR[b.status] ?? T.sub}>{b.status}</Tag>
            {b.genre && <Tag color={T.sub}>{b.genre}</Tag>}
            {b.relevance_to_company && <Tag color={T.green}>{b.relevance_to_company}</Tag>}
          </div>
          <div style={{ fontSize: 12, fontWeight: 600, color: T.white }}>{b.title}</div>
          {b.author && <div style={{ fontSize: 10, color: T.muted, marginTop: 1 }}>{b.author}</div>}
          {b.suggestion_reason && <div style={{ fontSize: 10, color: T.sub, marginTop: 4, lineHeight: 1.4 }}>{b.suggestion_reason}</div>}
        </Glass>
      ))}
    </>
  );
}
