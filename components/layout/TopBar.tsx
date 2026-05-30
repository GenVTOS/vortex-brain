import { T } from "@/lib/design/tokens";

export function TopBar() {
  return (
    <div
      style={{
        padding: "10px 16px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: `1px solid ${T.border}`,
        position: "relative",
        zIndex: 2,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 6,
            background: T.blue,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 11,
            fontWeight: 800,
            color: T.bg,
          }}
        >
          V
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color: T.white }}>
          VORTEX
        </span>
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 5,
          padding: "3px 8px",
          borderRadius: 12,
          background: T.green + "10",
          border: `1px solid ${T.green}18`,
        }}
      >
        <div
          className="animate-pulse-slow"
          style={{ width: 4, height: 4, borderRadius: "50%", background: T.green }}
        />
        <span style={{ fontSize: 8, color: T.green, fontWeight: 600 }}>REC</span>
      </div>
    </div>
  );
}
