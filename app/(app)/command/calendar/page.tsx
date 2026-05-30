import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { Sec } from "@/components/ui/Sec";
import { T } from "@/lib/design/tokens";

export default function CalendarPage() {
  const days = [
    { day: "Mon", date: "7", events: 4, hl: false },
    { day: "Tue", date: "8", events: 5, hl: true },
    { day: "Wed", date: "9", events: 3, hl: false },
    { day: "Thu", date: "10", events: 2, hl: false },
    { day: "Fri", date: "11", events: 1, hl: false },
  ];
  const schedule = [
    { time: "9:00", end: "9:45", event: "BioTech FDA strategy", co: "BIO", people: "Ana, Dr. Lim", type: "decision" },
    { time: "10:30", end: "11:00", event: "MP1 weekly sync", co: "MP1", people: "Marco", type: "routine" },
    { time: "13:00", end: "14:00", event: "Lunch", co: null, people: null, type: "personal" },
    { time: "14:30", end: "15:15", event: "ISP tower survey review", co: "ISP", people: "David", type: "review" },
    { time: "16:00", end: "17:00", event: "VB portfolio call", co: "VB", people: "James", type: "routine" },
    { time: "19:00", end: "20:00", event: "Dinner with wife", co: null, people: null, type: "personal" },
  ];
  const allocation = [
    { co: "MP1", hours: 8.5, pct: 34 },
    { co: "BIO", hours: 5.2, pct: 21 },
    { co: "ISP", hours: 4.0, pct: 16 },
    { co: "VB", hours: 3.5, pct: 14 },
    { co: "MP2", hours: 2.0, pct: 8 },
    { co: "NGO", hours: 1.8, pct: 7 },
  ];
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 10 }}>Calendar</div>
      <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
        {days.map((d, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "8px 4px",
              borderRadius: 10,
              background: d.hl ? T.glass : "transparent",
              border: d.hl ? `1px solid ${T.border}` : "1px solid transparent",
            }}
          >
            <div style={{ fontSize: 9, color: d.hl ? T.white : T.muted }}>{d.day}</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: d.hl ? T.white : T.sub, marginTop: 2 }}>{d.date}</div>
            <div style={{ display: "flex", justifyContent: "center", gap: 2, marginTop: 4 }}>
              {[...Array(Math.min(d.events, 4))].map((_, j) => (
                <div key={j} style={{ width: 4, height: 4, borderRadius: "50%", background: d.hl ? T.green : T.muted }} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <Glass style={{ marginBottom: 12, padding: "10px 14px" }}>
        <Sec color={T.blue}>Today — Tuesday</Sec>
        {schedule.map((e, i) => {
          const typeColor = e.type === "decision" ? T.red : e.type === "personal" ? T.rose : T.sub;
          const isNow = i === 0;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                gap: 10,
                padding: "6px 0",
                borderBottom: i < schedule.length - 1 ? `1px solid ${T.border}` : "none",
              }}
            >
              <div style={{ width: 44, flexShrink: 0 }}>
                <div style={{ fontSize: 10, fontWeight: 600, color: isNow ? T.green : T.sub }}>{e.time}</div>
                <div style={{ fontSize: 8, color: T.muted }}>{e.end}</div>
              </div>
              <div style={{ borderLeft: `2px solid ${isNow ? T.green : typeColor}`, paddingLeft: 8, flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 500, color: isNow ? T.white : T.sub }}>{e.event}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  {e.co && <Tag color={T.sub}>{e.co}</Tag>}
                  {e.people && <span style={{ fontSize: 8, color: T.muted }}>{e.people}</span>}
                  {e.type === "decision" && <Tag color={T.red}>decision</Tag>}
                </div>
              </div>
            </div>
          );
        })}
      </Glass>

      <Glass style={{ padding: "10px 14px" }}>
        <Sec>Time allocation this week</Sec>
        {allocation.map((a, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "3px 0" }}>
            <span style={{ fontSize: 9, color: T.sub, width: 28 }}>{a.co}</span>
            <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: `${a.pct}%`, height: "100%", background: T.blue, borderRadius: 3, opacity: 0.5 }} />
            </div>
            <span style={{ fontSize: 9, color: T.sub, width: 36, textAlign: "right" }}>{a.hours}h</span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: T.plum, marginTop: 6 }}>
          💡 MP1 is 34% of your time but 68% autonomous. Shift routine items to the bot.
        </div>
      </Glass>
    </>
  );
}
