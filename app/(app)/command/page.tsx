import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T, healthColor, confColor } from "@/lib/design/tokens";
import { CO } from "@/components/screens/data";

// Briefing (spec §7.1). Presentational; financial/calendar/health values are
// illustrative until the Phase 3/4 integrations + briefing API land.
export default function BriefingPage() {
  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: 12,
        }}
      >
        <div>
          <div style={{ fontSize: 8, color: T.muted, letterSpacing: "0.1em", textTransform: "uppercase" }}>
            Morning Brief
          </div>
          <div style={{ fontSize: 18, fontWeight: 600, color: T.white, letterSpacing: "-0.02em" }}>
            Good morning, Michael.
          </div>
        </div>
        <div style={{ display: "flex", gap: 12, alignItems: "baseline" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: T.green }}>₱48.2M</div>
            <div style={{ fontSize: 7, color: T.muted }}>CASH</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.sub }}>₱12.4M</div>
            <div style={{ fontSize: 7, color: T.muted }}>BURN</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, color: T.red }}>₱5.8M</div>
            <div style={{ fontSize: 7, color: T.muted }}>OVERDUE</div>
          </div>
        </div>
      </div>

      {/* Company health strip + home + sleep */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10 }}>
        <Glass style={{ flex: 3, padding: "8px 10px" }}>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            {CO.map((c, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: healthColor(c.health) }}>
                  {c.health}
                </div>
                <div style={{ fontSize: 7, color: T.sub, marginTop: 1 }}>{c.abbr}</div>
              </div>
            ))}
          </div>
        </Glass>
        <Glass style={{ width: 52, padding: "8px 4px", textAlign: "center" }} shimmer={T.rose}>
          <div style={{ fontSize: 13, fontWeight: 700, color: T.rose }}>74</div>
          <div style={{ fontSize: 6, color: T.rose + "88" }}>HOME</div>
        </Glass>
        <Glass style={{ width: 52, padding: "8px 4px", textAlign: "center" }} shimmer={T.red}>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.red }}>5h12</div>
          <div style={{ fontSize: 6, color: T.muted }}>SLEEP</div>
        </Glass>
      </div>

      {/* Today */}
      <Glass style={{ marginBottom: 10, padding: "8px 12px" }}>
        <Sec color={T.blue}>📅 Today</Sec>
        {[
          { time: "9:00", event: "BioTech FDA call — Ana, Dr. Lim", co: "BIO", dur: 45, next: true },
          { time: "10:30", event: "MP1 weekly sync — Marco", co: "MP1", dur: 30 },
          { time: "13:00", event: "Lunch", co: null, dur: 60 },
          { time: "14:30", event: "ISP tower survey review — David", co: "ISP", dur: 45 },
          { time: "16:00", event: "VB portfolio call — James", co: "VB", dur: 60 },
        ].map((e, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 0",
              borderLeft: e.next ? `2px solid ${T.green}` : `2px solid ${T.border}`,
              paddingLeft: 8,
              marginLeft: 2,
            }}
          >
            <span style={{ fontSize: 10, color: e.next ? T.green : T.muted, fontWeight: 600, width: 32, flexShrink: 0 }}>
              {e.time}
            </span>
            <span style={{ fontSize: 10, color: e.next ? T.white : T.sub, flex: 1 }}>{e.event}</span>
            {e.co && <Tag color={healthColor(CO.find((c) => c.abbr === e.co)?.health || 50)}>{e.co}</Tag>}
            <span style={{ fontSize: 8, color: T.muted }}>{e.dur}m</span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: T.plum, marginTop: 6 }}>
          💡 Bot suggestion: Move 4pm VB call to Thursday — you&apos;ll be fatigued after 3 back-to-backs on 5h sleep.
        </div>
      </Glass>

      {/* Bot acted */}
      <Glass style={{ marginBottom: 10, padding: "8px 12px" }}>
        <Sec color={T.blue}>⚡ Bot acted</Sec>
        {[
          { co: "MP1", act: "Followed up Ayala Corp HR", conf: 93 },
          { co: "ISP", act: "Rescheduled vendor call", conf: 96 },
          { co: "ALL", act: "Blocked Friday PM for strategy", conf: 94 },
        ].map((a, i) => (
          <div
            key={i}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "4px 0",
              borderBottom: i < 2 ? `1px solid ${T.border}` : "none",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
              <Tag color={T.blue}>{a.co}</Tag>
              <span style={{ fontSize: 10, color: T.white }}>{a.act}</span>
            </div>
            <span style={{ fontSize: 9, fontWeight: 600, color: confColor(a.conf) }}>{a.conf}%</span>
          </div>
        ))}
      </Glass>

      {/* Decisions */}
      <Sec>◆ Decisions</Sec>
      {[
        { co: "BIO", title: "FDA Pre-Submission: Q2 or Q3?", ctx: "₱180K delta. CompetitorX filing risk.", expert: "A. Grove", wisdom: "First-mover in regulatory compounds.", urg: T.red },
        { co: "VB", title: "Apex Fund — Take Meeting?", ctx: "$35M AUM. 3 LPs overlap ISP clients.", expert: "P. Thiel", wisdom: "Evaluate for strategic asymmetry.", urg: T.amber },
        { co: "MP1", title: "200-Head Pricing — 10% Counter?", ctx: "Bot drafted 10% + 6mo lock. 91% confident.", expert: null, wisdom: null, urg: T.green },
      ].map((d, i) => (
        <Glass key={i} style={{ marginBottom: 8 }} shimmer={d.urg}>
          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 2 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                <Tag color={T.sub}>{d.co}</Tag>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.white, lineHeight: 1.2 }}>{d.title}</span>
              </div>
              <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.4 }}>{d.ctx}</div>
            </div>
            {d.wisdom && (
              <div
                style={{
                  flex: 1,
                  padding: "6px 8px",
                  borderRadius: 8,
                  background: T.plum + "08",
                  borderLeft: `2px solid ${T.plum}25`,
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                }}
              >
                <div style={{ fontSize: 8, color: T.plum, fontWeight: 600 }}>{d.expert}</div>
                <div style={{ fontSize: 9, color: T.sub, fontStyle: "italic", lineHeight: 1.3, marginTop: 2 }}>
                  {d.wisdom}
                </div>
              </div>
            )}
          </div>
        </Glass>
      ))}

      {/* Vitals */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: 6, marginTop: 6 }}>
        {[
          { l: "Mood", v: "3/5", c: T.amber },
          { l: "Energy", v: "Low", c: T.red },
          { l: "Water", v: "2/8", c: T.amber },
          { l: "Bible", v: "✓", c: T.green },
        ].map((h, i) => (
          <Glass key={i} style={{ textAlign: "center", padding: "6px 4px" }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: h.c }}>{h.v}</div>
            <div style={{ fontSize: 7, color: T.muted, marginTop: 1 }}>{h.l}</div>
          </Glass>
        ))}
      </div>

      {/* Pattern */}
      <Glass style={{ marginTop: 10, background: T.plum + "05", borderColor: T.plum + "12" } as React.CSSProperties} shimmer={T.plum}>
        <div style={{ fontSize: 9, color: T.plum, fontWeight: 600, marginBottom: 3 }}>🧠 Pattern detected</div>
        <div style={{ fontSize: 10, color: T.sub, lineHeight: 1.5 }}>
          14 meetings, 2 decisions in 3 days. Your decision accuracy drops 15% on &lt;6h sleep. Consider clearing
          decisions before 2pm while body battery is still usable.
        </div>
      </Glass>
    </>
  );
}
