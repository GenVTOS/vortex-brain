import { TopBar } from "@/components/layout/TopBar";
import { BottomNav } from "@/components/layout/BottomNav";
import { SubTabs } from "@/components/layout/SubTabs";
import { T } from "@/lib/design/tokens";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        maxWidth: 500,
        margin: "0 auto",
        minHeight: "100vh",
        background: T.bg,
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <TopBar />
      <SubTabs />
      <main
        style={{
          flex: 1,
          overflowY: "auto",
          padding: 16,
          paddingBottom: 72,
          position: "relative",
          zIndex: 1,
        }}
      >
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
