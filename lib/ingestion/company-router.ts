import { complete, MODELS, hasAnthropicKey } from "@/lib/ai/provider";
import { createAdminClient } from "@/lib/supabase/admin";

// Classifies a conversation into one of Michael's real companies (reads the roster
// from the DB so it works once real companies are seeded). Returns null if unsure.
export async function routeToCompany(summary: string): Promise<string | null> {
  if (!hasAnthropicKey()) return null;
  const supabase = createAdminClient();
  const { data: companies } = await supabase.from("companies").select("id,name");
  if (!companies?.length) return null;

  const list = companies.map((c) => `${c.id}=${c.name}`).join(", ");
  const ids = companies.map((c) => c.id);
  const text = await complete({
    model: MODELS.extract,
    maxTokens: 16,
    messages: [
      {
        role: "user",
        content: `Which company does this belong to? Reply with ONLY one id, or "unknown".\nCompanies: ${list}.\nSummary: ${summary.slice(0, 800)}`,
      },
    ],
  });
  const r = text.trim().toLowerCase().replace(/[^a-z0-9_]/g, "");
  return ids.includes(r) ? r : null;
}
