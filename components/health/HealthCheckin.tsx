"use client";

import { useEffect, useState } from "react";
import { Glass } from "@/components/ui/Glass";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

export function HealthCheckin() {
  const [water, setWater] = useState(0);
  const [mood, setMood] = useState(0);
  const [energy, setEnergy] = useState(0);
  const [bible, setBible] = useState(false);
  const [passage, setPassage] = useState("");
  const [meal, setMeal] = useState("");
  const [meals, setMeals] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/health/today")
      .then((r) => r.json())
      .then((d) => {
        const t = d.today;
        if (!t) return;
        setWater(t.water_glasses ?? 0);
        setMood(t.mood ?? 0);
        setEnergy(t.energy ?? 0);
        setBible(t.bible_reading ?? false);
        setPassage(t.bible_passage ?? "");
        setMeals((t.meals ?? []).map((m: { description?: string } | string) => (typeof m === "string" ? m : m.description ?? "")));
      });
  }, []);

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      await fetch("/api/health/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          water_glasses: water,
          mood: mood || null,
          energy: energy || null,
          bible_reading: bible,
          bible_passage: passage || null,
          meals: meals.map((m) => ({ description: m })),
        }),
      });
      setSaved(true);
    } finally {
      setSaving(false);
    }
  }

  const Scale = ({ value, set }: { value: number; set: (n: number) => void }) => (
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} onClick={() => set(n)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${value === n ? T.green : T.border}`, background: value === n ? T.green + "22" : T.glass, color: value === n ? T.green : T.sub, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>{n}</button>
      ))}
    </div>
  );

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Daily Check-in</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 14 }}>Garmin auto-fills sleep/HR/stress once connected. This is the rest.</div>

      <Glass style={{ marginBottom: 10 }}>
        <Sec color={T.blue}>💧 Water ({water}/8)</Sec>
        <div style={{ display: "flex", gap: 5 }}>
          {[...Array(8)].map((_, i) => (
            <button key={i} onClick={() => setWater(i + 1 === water ? i : i + 1)} style={{ flex: 1, height: 26, borderRadius: 6, border: "none", background: i < water ? T.blue : T.border, cursor: "pointer" }} />
          ))}
        </div>
      </Glass>

      <Glass style={{ marginBottom: 10 }}>
        <Sec color={T.amber}>😊 Mood</Sec>
        <Scale value={mood} set={setMood} />
        <div style={{ height: 10 }} />
        <Sec color={T.amber}>⚡ Energy</Sec>
        <Scale value={energy} set={setEnergy} />
      </Glass>

      <Glass style={{ marginBottom: 10 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Sec color={T.green}>📖 Bible reading</Sec>
          <button onClick={() => setBible((b) => !b)} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: bible ? T.green : T.border, cursor: "pointer", position: "relative" }}>
            <span style={{ position: "absolute", top: 2, left: bible ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
          </button>
        </div>
        {bible && (
          <input value={passage} onChange={(e) => setPassage(e.target.value)} placeholder="Passage (e.g. Proverbs 3:5-6)" style={{ width: "100%", marginTop: 8, padding: "8px 10px", borderRadius: 8, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none" }} />
        )}
      </Glass>

      <Glass style={{ marginBottom: 14 }}>
        <Sec color={T.sub}>🍽 Meals</Sec>
        <div style={{ display: "flex", gap: 6 }}>
          <input value={meal} onChange={(e) => setMeal(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && meal.trim()) { setMeals((m) => [...m, meal.trim()]); setMeal(""); } }} placeholder="What did you eat?" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: T.glass, color: T.white, border: `1px solid ${T.border}`, fontSize: 11, outline: "none" }} />
          <button onClick={() => { if (meal.trim()) { setMeals((m) => [...m, meal.trim()]); setMeal(""); } }} style={{ padding: "0 14px", borderRadius: 8, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, fontSize: 11, cursor: "pointer" }}>+</button>
        </div>
        {meals.map((m, i) => (
          <div key={i} style={{ fontSize: 11, color: T.sub, padding: "4px 0", borderBottom: i < meals.length - 1 ? `1px solid ${T.border}` : "none" }}>• {m}</div>
        ))}
      </Glass>

      <button onClick={save} disabled={saving} style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: saved ? T.green : T.blue, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
        {saving ? "Saving…" : saved ? "✓ Saved" : "Save check-in"}
      </button>
    </>
  );
}
