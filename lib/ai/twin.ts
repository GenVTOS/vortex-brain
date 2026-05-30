import { anthropic, MODELS, hasAnthropicKey } from "./provider";
import { assembleSystemPrompt } from "./system-prompt";
import { getDomainConfidence, incrementDomainSample, isDeadManTriggered } from "./confidence";
import { evaluateRisk, type RiskTier } from "@/lib/security/risk-matrix";
import { checkHardCeilings, type ContactClassification } from "@/lib/security/ceiling-checker";
import { scanForInjection } from "@/lib/security/injection-guard";
import { writeAudit } from "@/lib/security/audit";
import { createAdminClient } from "@/lib/supabase/admin";
import { SEND_QUEUE_DELAY_SECONDS } from "@/lib/security/constants";

export interface TwinRequest {
  message: string;
  person: {
    id: string;
    name: string;
    role: string;
    contactClassification: ContactClassification;
    communicationProfile: Record<string, unknown>;
  };
  companyId: string;
  domain?: string;
  estimatedImpactPhp?: number;
}

export interface TwinResponse {
  text: string;
  confidence: number;
  tier: RiskTier;
  canAutoSend: boolean;
  escalationReason?: string;
  queueId?: string;
}

const ESCALATE = "Let me check on this and get back to you.";

// Lightweight pre-filter for human-only territory (the model is also instructed
// to escalate these; this is belt-and-suspenders). (hardening V-1.3)
const HUMAN_ONLY_PATTERNS = [
  "how was", "how's your", "how are you feeling", "i'm struggling",
  "weekend", "your wife", "family", "are you ok", "between us",
];
function isHumanOnly(msg: string): boolean {
  const m = msg.toLowerCase();
  return HUMAN_ONLY_PATTERNS.some((p) => m.includes(p));
}

export async function runTwinPipeline(req: TwinRequest): Promise<TwinResponse> {
  const supabase = createAdminClient();
  const domain = req.domain ?? "operational";

  const escalate = async (reason: string, audit = true): Promise<TwinResponse> => {
    if (audit) {
      await writeAudit({
        actor: "bot",
        actionType: "escalated",
        companyId: req.companyId,
        targetPersonId: req.person.id,
        detail: { reason, message: req.message.slice(0, 200) },
        confidence: 0,
        riskTier: 3,
        wasAuto: false,
      });
    }
    return { text: ESCALATE, confidence: 0, tier: 3, canAutoSend: false, escalationReason: reason };
  };

  // 1. Injection scan on inbound.
  const injection = scanForInjection(req.message);
  if (!injection.clean) {
    await writeAudit({
      actor: req.person.name,
      actionType: "injection_detected",
      companyId: req.companyId,
      detail: { patterns: injection.detectedPatterns, message: req.message.slice(0, 200) },
    });
    return escalate("Injection pattern detected", false);
  }

  // 2. Human-only pre-filter.
  if (isHumanOnly(req.message)) return escalate("Human-only query");

  // 3. No key → can't generate; escalate gracefully.
  if (!hasAnthropicKey()) return escalate("AI offline — queued for Michael");

  // 4. Confidence + dead-man.
  const confidence = await getDomainConfidence(req.companyId, domain);
  const deadMan = await isDeadManTriggered();

  // 5. Hard ceilings on the request intent (recipient classification).
  const intentCeiling = checkHardCeilings({
    recipientType: req.person.contactClassification,
    messageText: req.message,
  });

  // 6. Risk matrix.
  const risk = evaluateRisk({
    confidencePercent: confidence,
    impactAmountPhp: req.estimatedImpactPhp ?? 0,
    hardCeilingFlags: intentCeiling.violations,
  });

  // 7. Assemble prompt + generate (Opus, cached stable preamble).
  const { stable, dynamic } = await assembleSystemPrompt({
    personName: req.person.name,
    personRole: req.person.role,
    contactClassification: req.person.contactClassification,
    communicationProfile: req.person.communicationProfile,
    companyId: req.companyId,
    domain,
    domainConfidence: confidence,
  });

  const client = anthropic();
  const msg = await client.messages.create({
    model: MODELS.twin,
    max_tokens: 600,
    system: [
      { type: "text", text: stable, cache_control: { type: "ephemeral" } },
      { type: "text", text: dynamic },
    ],
    messages: [{ role: "user", content: req.message }],
  });
  const block = msg.content.find((b) => b.type === "text");
  const responseText = block && block.type === "text" ? block.text : ESCALATE;

  // 8. Post-generation ceiling check (contractual language in the OUTPUT).
  const outputCeiling = checkHardCeilings({
    recipientType: req.person.contactClassification,
    messageText: responseText,
  });

  // 9. Auto-send decision: Tier-1 AND risk allows AND output clean AND not dead-man.
  const finalTier: RiskTier = outputCeiling.passed ? risk.tier : 3;
  const canAutoSend =
    finalTier === 1 && risk.canAutoExecute && outputCeiling.passed && !deadMan;

  // 10. Always persist the draft to send_queue. Auto-sends get status 'queued'
  // (the per-minute cron delivers after the 60s window). Everything else gets
  // 'pending_review' so it surfaces in the EA dashboard — the cron never touches
  // those (it only processes status='queued').
  const status = canAutoSend ? "queued" : "pending_review";
  const sendAt = new Date(
    Date.now() + (canAutoSend ? SEND_QUEUE_DELAY_SECONDS * 1000 : 0),
  ).toISOString();
  const { data: queued } = await supabase
    .from("send_queue")
    .insert({
      message_content: responseText,
      recipient_person_id: req.person.id,
      company_id: req.companyId,
      channel: "chat",
      risk_tier: `tier${finalTier}`,
      confidence,
      status,
      send_at: sendAt,
    })
    .select()
    .single();
  const queueId: string | undefined = queued?.id;

  // 11. Audit + learn.
  await writeAudit({
    actor: "bot",
    actionType: canAutoSend ? "message_queued" : "escalated",
    companyId: req.companyId,
    targetPersonId: req.person.id,
    detail: {
      response: responseText.slice(0, 300),
      original: req.message.slice(0, 200),
      deadMan,
      ceilings: finalTier === 3 ? [...intentCeiling.violations, ...outputCeiling.violations] : [],
    },
    confidence,
    riskTier: finalTier,
    wasAuto: canAutoSend,
  });
  await incrementDomainSample(req.companyId, domain);

  return {
    text: responseText,
    confidence,
    tier: finalTier,
    canAutoSend,
    escalationReason: canAutoSend ? undefined : (deadMan ? "Dead man's switch active" : risk.reason),
    queueId,
  };
}
