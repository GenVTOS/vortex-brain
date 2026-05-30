import { ReactNode } from "react";
import { T } from "@/lib/design/tokens";

// Section label — uppercase tracked micro-header.
export function Sec({
  children,
  color = T.muted,
}: {
  children: ReactNode;
  color?: string;
}) {
  return (
    <div
      style={{
        fontSize: 8,
        color,
        textTransform: "uppercase",
        letterSpacing: "0.12em",
        fontWeight: 600,
        marginBottom: 6,
      }}
    >
      {children}
    </div>
  );
}
