"use client";

import { useEffect, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T } from "@/lib/design/tokens";

interface VFile {
  file_path: string;
  file_type: string;
  company_id: string | null;
}

export function VaultBrowser() {
  const [files, setFiles] = useState<VFile[]>([]);
  const [open, setOpen] = useState<string | null>(null);
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/obsidian")
      .then((r) => r.json())
      .then((d) => setFiles(d.files ?? []))
      .finally(() => setLoading(false));
  }, []);

  async function openFile(path: string) {
    if (open === path) {
      setOpen(null);
      return;
    }
    setOpen(path);
    setMarkdown("Loading…");
    const r = await fetch(`/api/obsidian?path=${encodeURIComponent(path)}`);
    const d = await r.json();
    setMarkdown(d.markdown ?? "(empty)");
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Vault</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12, lineHeight: 1.5 }}>
        Your knowledge as cross-linked notes, generated from the brain. Every ingested meeting, decision, and person becomes a file here.
      </div>

      {loading && <div style={{ fontSize: 11, color: T.muted }}>Loading…</div>}
      {!loading && files.length === 0 && (
        <Glass><div style={{ fontSize: 11, color: T.sub }}>The vault fills as recordings come in. Ingest a Plaud meeting and its note appears here.</div></Glass>
      )}

      {files.map((f) => (
        <Glass key={f.file_path} style={{ marginBottom: 6 }}>
          <div onClick={() => openFile(f.file_path)} style={{ cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
            <Tag color={T.plum}>{f.file_type}</Tag>
            {f.company_id && <Tag color={T.sub}>{f.company_id.toUpperCase()}</Tag>}
            <span style={{ fontSize: 11, color: T.white, fontFamily: "monospace" }}>{f.file_path}</span>
          </div>
          {open === f.file_path && (
            <pre style={{ marginTop: 10, padding: 12, background: T.bg, borderRadius: 8, border: `1px solid ${T.border}`, fontSize: 10, color: T.sub, whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: 1.5, fontFamily: "monospace" }}>
              {markdown}
            </pre>
          )}
        </Glass>
      ))}
    </>
  );
}
