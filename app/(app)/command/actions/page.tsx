import { Glass } from "@/components/ui/Glass";
import { Tag } from "@/components/ui/Tag";
import { T, confColor } from "@/lib/design/tokens";

export default function ActionsPage() {
  const items = [
    { co: "ISP", title: "Cross-sell ISP to MP1 BPO client", detail: "Cebu site not on your network. ₱400K/yr.", conf: 87, urg: "high" },
    { co: "VB", title: "Competitor in Nexora's space", detail: "YC startup launched. Analysis ready.", conf: 78, urg: "high" },
    { co: "MP1", title: "₱2.8M receivables past 60d", detail: "3 clients overdue. Collection drafts ready.", conf: 91, urg: "high" },
    { co: "BIO", title: "Delegated CRO pricing to Ana", detail: "Sent as you: 'Pull quotes by Thursday.'", conf: 92, urg: "medium" },
    { co: "MP2", title: "Cold email to Jollibee HR", detail: "Adapted Ayala pitch for food service.", conf: 82, urg: "medium" },
    { co: "ISP", title: "DICT tower sharing policy", detail: "New reg could reduce CapEx 20-30%.", conf: 85, urg: "low" },
  ];
  const urgColor: Record<string, string> = { high: T.red, medium: T.amber, low: T.green };
  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Actions</div>
      <div style={{ fontSize: 10, color: T.sub, marginBottom: 12 }}>Bot-initiated — sorted by urgency</div>
      {items.map((a, i) => {
        const urg = urgColor[a.urg];
        return (
          <Glass key={i} style={{ marginBottom: 8 }} shimmer={urg}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 3 }}>
                  <Tag color={T.sub}>{a.co}</Tag>
                  <Tag color={urg}>{a.urg}</Tag>
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.white, marginBottom: 2 }}>{a.title}</div>
                <div style={{ fontSize: 10, color: T.sub }}>{a.detail}</div>
              </div>
              <span style={{ fontSize: 9, fontWeight: 600, color: confColor(a.conf) }}>{a.conf}%</span>
            </div>
            <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
              <button style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: T.green, color: T.bg, fontSize: 9, fontWeight: 700, cursor: "pointer" }}>
                Execute
              </button>
              <button style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.sub, fontSize: 9, cursor: "pointer" }}>
                Edit
              </button>
              <button style={{ padding: "4px 12px", borderRadius: 6, border: `1px solid ${T.border}`, background: "transparent", color: T.muted, fontSize: 9, cursor: "pointer" }}>
                Dismiss
              </button>
            </div>
          </Glass>
        );
      })}
    </>
  );
}
