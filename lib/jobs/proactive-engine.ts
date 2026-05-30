import { createAdminClient } from "@/lib/supabase/admin";
import { complete, MODELS, hasAnthropicKey, stripFences } from "@/lib/ai/provider";

export interface ProactiveResult {
  followups: number;
  outreach: number;
  synergy: number;
}

const FREQ_DAYS: Record<string, number> = { daily: 1, weekly: 7, biweekly: 14, monthly: 30 };

// Hourly background pass (spec §6.2). Generates proactive_actions; deduped so it's
// safe to run repeatedly. NEVER sends anything — only surfaces drafts/suggestions.
export async function runProactiveEngine(): Promise<ProactiveResult> {
  const supabase = createAdminClient();
  let followups = 0,
    outreach = 0,
    synergy = 0;

  // 1. Overdue commitments → follow-up actions.
  const { data: overdue } = await supabase
    .from("commitments")
    .select("id, description, company_id")
    .eq("status", "pending")
    .lt("due_date", new Date().toISOString());

  for (const c of overdue ?? []) {
    const title = `Follow up: ${c.description}`;
    const { data: exists } = await supabase
      .from("proactive_actions")
      .select("id")
      .eq("type", "followup")
      .eq("title", title)
      .eq("status", "pending")
      .maybeSingle();
    if (exists) continue;
    await supabase.from("proactive_actions").insert({
      company_id: c.company_id,
      type: "followup",
      title,
      detail: "Commitment is past due — draft a nudge.",
      confidence: 88,
      urgency: "today",
      impact: "low",
    });
    followups++;
  }

  // 2. Relationship radar → outreach when contact gap exceeds target.
  const { data: people } = await supabase
    .from("people")
    .select("id, name, company_id, last_contact_at, contact_frequency_target")
    .eq("type", "core_team");

  for (const p of people ?? []) {
    if (!p.contact_frequency_target || !p.last_contact_at) continue;
    const days = (Date.now() - new Date(p.last_contact_at).getTime()) / 86_400_000;
    const target = FREQ_DAYS[p.contact_frequency_target] ?? 7;
    if (days <= target * 1.5) continue;

    const title = `Check in with ${p.name}`;
    const { data: exists } = await supabase
      .from("proactive_actions")
      .select("id")
      .eq("type", "outreach")
      .eq("title", title)
      .eq("status", "pending")
      .maybeSingle();
    if (exists) continue;
    await supabase.from("proactive_actions").insert({
      company_id: p.company_id,
      type: "outreach",
      title,
      detail: `Last contact ${Math.round(days)}d ago (target every ${target}d).`,
      confidence: 90,
      urgency: days > target * 2 ? "today" : "this_week",
      impact: "low",
    });
    outreach++;
  }

  // 3. Cross-company synergy (the moat) — a cheap Haiku pass over recent decisions
  // across companies. Spots opportunities only a brain spanning all 6 would see.
  if (hasAnthropicKey()) {
    const { data: recent } = await supabase
      .from("decisions")
      .select("company_id, title, context")
      .gte("created_at", new Date(Date.now() - 14 * 86_400_000).toISOString())
      .limit(30);
    const companies = new Set((recent ?? []).map((r) => r.company_id));
    if ((recent?.length ?? 0) >= 2 && companies.size >= 2) {
      const list = (recent ?? [])
        .map((r) => `[${r.company_id}] ${r.title}: ${r.context ?? ""}`)
        .join("\n");
      try {
        const out = await complete({
          model: MODELS.extract,
          maxTokens: 300,
          messages: [
            {
              role: "user",
              content: `These decisions come from different companies owned by the same person. Identify AT MOST ONE concrete cross-company synergy (e.g. a client/asset of one company could use another's service). Return ONLY JSON: {"synergy":{"title":"","detail":"","companyId":""}} or {"synergy":null}.\n\n${list}`,
            },
          ],
        });
        const j = JSON.parse(stripFences(out));
        if (j.synergy && j.synergy.title) {
          const title = String(j.synergy.title).slice(0, 120);
          const { data: exists } = await supabase
            .from("proactive_actions")
            .select("id")
            .eq("type", "synergy")
            .eq("title", title)
            .eq("status", "pending")
            .maybeSingle();
          if (!exists) {
            await supabase.from("proactive_actions").insert({
              company_id: j.synergy.companyId || null,
              type: "synergy",
              title,
              detail: String(j.synergy.detail ?? "").slice(0, 300),
              confidence: 80,
              urgency: "this_week",
              impact: "medium",
            });
            synergy++;
          }
        }
      } catch {
        /* synergy is best-effort */
      }
    }
  }

  return { followups, outreach, synergy };
}
