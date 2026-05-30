import { confColor } from "@/lib/design/tokens";

export function Confidence({ value }: { value: number }) {
  const color = confColor(value);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 9 }}>
      <div
        style={{
          width: 40,
          height: 4,
          background: "#1a1a2e",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${value}%`,
            height: "100%",
            background: color,
            borderRadius: 2,
          }}
        />
      </div>
      <span style={{ color, fontWeight: 600 }}>{value}%</span>
    </div>
  );
}
