"use client";

import { useEffect, useState } from "react";
import { T } from "@/lib/design/tokens";

interface Person {
  id: string;
  name: string;
  role: string;
  company_id: string | null;
}
interface Msg {
  from: "them" | "bot";
  text: string;
  pending?: boolean;
}

// Seamless chat. A team member messages "Michael" and the twin answers. For the
// owner/EA this doubles as a test harness with a person selector. The pipeline
// escalates (no instant reply) until confidence is earned.
export function TeamChat() {
  const [people, setPeople] = useState<Person[]>([]);
  const [personId, setPersonId] = useState<string>("");
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    fetch("/api/people")
      .then((r) => r.json())
      .then((d) => {
        const list: Person[] = (d.people ?? []).filter((p: Person) => p.company_id);
        setPeople(list);
        if (list[0]) setPersonId(list[0].id);
      });
  }, []);

  async function send() {
    const text = input.trim();
    if (!text || !personId) return;
    setInput("");
    setMsgs((m) => [...m, { from: "them", text }]);
    setSending(true);
    try {
      const r = await fetch("/api/twin/respond", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, personId }),
      });
      const d = await r.json();
      if (d.text) setMsgs((m) => [...m, { from: "bot", text: d.text }]);
      else setMsgs((m) => [...m, { from: "bot", text: "…", pending: true }]);
    } catch {
      setMsgs((m) => [...m, { from: "bot", text: "(offline)", pending: true }]);
    } finally {
      setSending(false);
    }
  }

  const person = people.find((p) => p.id === personId);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 180px)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 10, color: T.muted }}>Messaging as</span>
        <select
          value={personId}
          onChange={(e) => { setPersonId(e.target.value); setMsgs([]); }}
          style={{ flex: 1, padding: "6px 8px", borderRadius: 8, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none" }}
        >
          {people.map((p) => (
            <option key={p.id} value={p.id} style={{ background: T.bg }}>
              {p.name} — {p.role}
            </option>
          ))}
        </select>
      </div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>
        Chatting with Michael {person ? `(${person.company_id?.toUpperCase()})` : ""} · feels like a normal DM
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8, paddingBottom: 8 }}>
        {msgs.map((m, i) => (
          <div key={i} style={{ alignSelf: m.from === "bot" ? "flex-end" : "flex-start", maxWidth: "82%" }}>
            <div
              style={{
                padding: "8px 12px",
                borderRadius: 12,
                fontSize: 12,
                lineHeight: 1.4,
                color: m.pending ? T.muted : T.white,
                background: m.from === "bot" ? T.blue + "1a" : T.glass,
                border: `1px solid ${m.from === "bot" ? T.blue + "33" : T.border}`,
                fontStyle: m.pending ? "italic" : "normal",
              }}
            >
              {m.pending ? "Michael will get back to you on this." : m.text}
            </div>
          </div>
        ))}
        {sending && <div style={{ alignSelf: "flex-end", fontSize: 10, color: T.muted }}>Michael is typing…</div>}
      </div>

      <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="Message Michael…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 10, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 12, outline: "none" }}
        />
        <button onClick={send} disabled={sending} style={{ padding: "10px 16px", borderRadius: 10, border: "none", background: T.blue, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
          Send
        </button>
      </div>
    </div>
  );
}
