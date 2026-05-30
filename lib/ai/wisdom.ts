import { anthropic, MODELS, hasAnthropicKey } from "./provider";
import { createAdminClient } from "@/lib/supabase/admin";

function textOf(msg: { content: Array<{ type: string; text?: string }> }): string {
  const b = msg.content.find((x) => x.type === "text");
  return b && b.type === "text" ? (b.text ?? "") : "";
}
function avatar(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

// Brief business context the experts reason over (scoped to a company if given).
async function companyContext(companyId?: string | null): Promise<string> {
  const supabase = createAdminClient();
  let dq = supabase
    .from("decisions")
    .select("company_id, title, context")
    .order("created_at", { ascending: false })
    .limit(8);
  if (companyId) dq = dq.eq("company_id", companyId);
  const [{ data: decisions }, { data: companies }] = await Promise.all([
    dq,
    supabase.from("companies").select("id, name"),
  ]);
  return `Companies: ${(companies ?? []).map((c) => `${c.id}=${c.name}`).join(", ")}
Recent decisions:
${(decisions ?? []).map((d) => `[${d.company_id}] ${d.title}: ${d.context ?? ""}`).join("\n") || "none yet"}`;
}

export async function consultExpert(
  expertId: string,
  topic: string,
  companyId?: string | null,
): Promise<string> {
  if (!hasAnthropicKey()) return "AI offline — try later.";
  const supabase = createAdminClient();
  const { data: expert } = await supabase
    .from("wisdom_experts")
    .select("system_prompt, name")
    .eq("id", expertId)
    .maybeSingle();
  if (!expert?.system_prompt) return "Expert not configured.";
  const ctx = await companyContext(companyId);
  const msg = await anthropic().messages.create({
    model: MODELS.roundtable,
    max_tokens: 500,
    system: `${expert.system_prompt}\n\nMichael's context:\n${ctx}`,
    messages: [{ role: "user", content: topic }],
  });
  return textOf(msg);
}

export interface RoundtableTurn {
  expertId: string;
  name: string;
  av: string;
  text: string;
}

export async function runRoundtable(
  expertIds: string[],
  topic: string,
  companyId?: string | null,
): Promise<{ messages: RoundtableTurn[]; synthesis: string }> {
  if (!hasAnthropicKey()) return { messages: [], synthesis: "AI offline — try later." };
  const supabase = createAdminClient();
  const { data: experts } = await supabase
    .from("wisdom_experts")
    .select("id, name, system_prompt")
    .in("id", expertIds);
  if (!experts?.length) return { messages: [], synthesis: "" };

  // Preserve requested order.
  const ordered = expertIds
    .map((id) => experts.find((e) => e.id === id))
    .filter(Boolean) as typeof experts;

  const ctx = await companyContext(companyId);
  const messages: RoundtableTurn[] = [];
  for (const e of ordered) {
    const prior = messages.map((m) => `${m.name}: ${m.text}`).join("\n");
    const msg = await anthropic().messages.create({
      model: MODELS.roundtable,
      max_tokens: 280,
      system: `${e.system_prompt ?? ""}\n\nContext:\n${ctx}${prior ? `\n\nOther advisors so far:\n${prior}` : ""}`,
      messages: [
        {
          role: "user",
          content: `Weigh in on: ${topic}. Be direct, 2-3 sentences. Build on or push back against prior points if any.`,
        },
      ],
    });
    messages.push({ expertId: e.id, name: e.name, av: avatar(e.name), text: textOf(msg) });
  }

  let synthesis = "";
  const s = await anthropic().messages.create({
    model: MODELS.roundtable,
    max_tokens: 220,
    system:
      "You synthesize an advisory roundtable for Michael. In 2-3 sentences: the consensus, the key disagreement, and which option aligns with a pragmatic owner-operator. Be decisive.",
    messages: [
      {
        role: "user",
        content: `Topic: ${topic}\n\n${messages.map((m) => `${m.name}: ${m.text}`).join("\n")}`,
      },
    ],
  });
  synthesis = textOf(s);

  // Persist the session (best-effort).
  await supabase.from("roundtable_sessions").insert({
    topic,
    company_id: companyId ?? null,
    expert_ids: ordered.map((e) => e.id),
    messages: messages,
    synthesis,
  });

  return { messages, synthesis };
}
