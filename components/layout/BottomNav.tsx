"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV, sectionForPath } from "@/lib/nav";
import { T } from "@/lib/design/tokens";

export function BottomNav() {
  const pathname = usePathname();
  const active = sectionForPath(pathname);
  return (
    <div
      style={{
        position: "sticky",
        bottom: 0,
        background: T.bg + "EE",
        borderTop: `1px solid ${T.border}`,
        display: "flex",
        justifyContent: "space-around",
        padding: "6px 0 10px",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
        zIndex: 10,
      }}
    >
      {NAV.map((n) => {
        const isActive = n.id === active.id;
        const col = isActive ? n.color : T.muted;
        return (
          <Link
            key={n.id}
            href={n.tabs[0].href}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              textDecoration: "none",
              padding: "4px 10px",
              position: "relative",
            }}
          >
            {isActive && (
              <div
                style={{
                  position: "absolute",
                  top: -7,
                  width: 14,
                  height: 2,
                  borderRadius: 1,
                  background: col,
                }}
              />
            )}
            <span style={{ fontSize: 13, color: col, opacity: isActive ? 1 : 0.35 }}>
              {n.icon}
            </span>
            <span style={{ fontSize: 8, fontWeight: 600, color: col }}>
              {n.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
