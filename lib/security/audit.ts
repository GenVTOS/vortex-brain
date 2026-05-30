import { createAdminClient } from "@/lib/supabase/admin";
import type { RiskTier } from "./risk-matrix";

// Append-only audit writer. The audit_log table has UPDATE/DELETE revoked at the
// DB level (migration 002); this is the only sanctioned way to write to it.
// Audit failures are logged but NEVER thrown — they must not break a user flow.
// (spec §3.1 audit_log, §8.6)

export type AuditAction =
  | "message_sent"
  | "message_queued"
  | "message_cancelled"
  | "decision_made"
  | "task_delegated"
  | "action_executed"
  | "escalated"
  | "rule_changed"
  | "login"
  | "send_as_michael"
  | "ceiling_blocked"
  | "injection_detected"
  | "anomaly_detected";

export interface AuditEntry {
  actor: string; // 'bot', 'michael', 'rica', or a team member's name
  actionType: AuditAction;
  companyId?: string;
  targetPersonId?: string;
  detail: Record<string, unknown>;
  confidence?: number;
  riskTier?: RiskTier;
  wasAuto?: boolean;
  ipAddress?: string;
  deviceId?: string;
}

export async function writeAudit(entry: AuditEntry): Promise<void> {
  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from("audit_log").insert({
      actor: entry.actor,
      action_type: entry.actionType,
      company_id: entry.companyId ?? null,
      target_person_id: entry.targetPersonId ?? null,
      detail: entry.detail,
      confidence: entry.confidence ?? null,
      risk_tier: entry.riskTier ? `tier${entry.riskTier}` : null,
      was_auto: entry.wasAuto ?? false,
      ip_address: entry.ipAddress ?? null,
      device_id: entry.deviceId ?? null,
    });
    if (error) {
      console.error("[AUDIT] write failed:", error.message, entry.actionType);
    }
  } catch (err) {
    console.error("[AUDIT] write threw:", err);
  }
}
