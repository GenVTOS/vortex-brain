import { ReactNode, CSSProperties } from "react";
import { T } from "@/lib/design/tokens";

interface GlassProps {
  children: ReactNode;
  shimmer?: string; // top accent bar — color = urgency (only where attention is needed)
  style?: CSSProperties;
  onClick?: () => void;
  className?: string;
}

// Prism glass card (spec §7.4). Padding defaults to 12 and is overridable via
// `style` to stay faithful to the prototype's per-card spacing.
export function Glass({ children, shimmer, style, onClick, className }: GlassProps) {
  return (
    <div
      onClick={onClick}
      className={onClick ? "cursor-pointer " + (className ?? "") : className}
      style={{
        background: T.glass,
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        borderRadius: 12,
        border: `1px solid ${T.border}`,
        padding: 12,
        position: "relative",
        overflow: "hidden",
        ...style,
      }}
    >
      {shimmer && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 2,
            background: shimmer,
            opacity: 0.6,
            borderRadius: "12px 12px 0 0",
          }}
        />
      )}
      <div style={{ position: "relative" }}>{children}</div>
    </div>
  );
}
