"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionForPath } from "@/lib/nav";
import { T } from "@/lib/design/tokens";

export function SubTabs() {
  const pathname = usePathname();
  const section = sectionForPath(pathname);
  if (section.tabs.length <= 1) return null;
  return (
    <div
      style={{
        padding: "0 16px",
        borderBottom: `1px solid ${T.border}`,
        display: "flex",
        position: "relative",
        zIndex: 2,
      }}
    >
      {section.tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.id}
            href={t.href}
            style={{
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 600,
              textDecoration: "none",
              color: active ? section.color : T.muted,
              borderBottom: active
                ? `2px solid ${section.color}`
                : "2px solid transparent",
            }}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
