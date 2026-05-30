import { Tag } from "@/components/ui/Tag";
import { T, healthColor } from "@/lib/design/tokens";

export default function RadarPage() {
  const people = [
    { name: "Sarah Valdez", co: "MP2", h: 45, flag: "⚠ No contact 14d", last: "14d" },
    { name: "David Cruz", co: "ISP", h: 68, flag: "2 unanswered", last: "8d" },
    { name: "Marco Tan", co: "MP1", h: 74, flag: "Stress signals", last: "5d" },
    { name: "Elena Torres", co: "NGO", h: 88, flag: null, last: "3d" },
    { name: "Kevin Park", co: "CFO", h: 90, flag: null, last: "1d" },
    { name: "Ana Reyes", co: "BIO", h: 92, flag: null, last: "2d" },
    { name: "James Lim", co: "VB", h: 95, flag: null, last: "Today" },
    { name: "Rica Santos", co: "EA", h: 99, flag: null, last: "Today" },
  ];
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Radar</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Based on YOUR contact patterns</div>
      {people.map((p, i) => (
        <div
          key={i}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "6px 0",
            borderBottom: i < people.length - 1 ? `1px solid ${T.border}` : "none",
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: "50%",
              background: `conic-gradient(${healthColor(p.h)} ${p.h}%, ${T.border} ${p.h}%)`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: "50%",
                background: T.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 7,
                fontWeight: 700,
                color: T.sub,
              }}
            >
              {p.name.split(" ").map((n) => n[0]).join("")}
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 500, color: T.white }}>{p.name}</span>
              <Tag color={T.sub}>{p.co}</Tag>
              <span style={{ fontSize: 8, color: T.muted, marginLeft: "auto" }}>{p.last}</span>
            </div>
            {p.flag && (
              <div style={{ fontSize: 9, color: p.h < 50 ? T.red : T.amber, marginTop: 1 }}>{p.flag}</div>
            )}
          </div>
        </div>
      ))}
    </>
  );
}
