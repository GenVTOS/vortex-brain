import { T } from "@/lib/design/tokens";

export function Tag({ children, color }: { children: string; color?: string }) {
  return (
    <span
      style={{
        fontSize: 8,
        padding: "2px 7px",
        borderRadius: 6,
        background: (color || T.sub) + "15",
        color: color || T.sub,
        fontWeight: 600,
        letterSpacing: "0.02em",
      }}
    >
      {children}
    </span>
  );
}
