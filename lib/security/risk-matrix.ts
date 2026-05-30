import {
  TIERS,
  FINANCIAL_THRESHOLDS,
  type HardCeiling,
} from "./constants";

// Confidence × impact risk matrix (spec §1.4, hardening V-6.1).
// Auto-execution requires BOTH high confidence AND low impact. High-impact
// decisions always require human review regardless of confidence.

export type RiskTier = 1 | 2 | 3;

export interface RiskInput {
  confidencePercent: number; // 0–100
  impactAmountPhp: number; // estimated financial impact
  hardCeilingFlags: HardCeiling[]; // which hard ceilings are triggered
}

export interface RiskResult {
  tier: RiskTier;
  reason: string;
  canAutoExecute: boolean;
}

export function evaluateRisk(input: RiskInput): RiskResult {
  // Hard ceilings always win — regardless of confidence or amount.
  if (input.hardCeilingFlags.length > 0) {
    return {
      tier: TIERS.OWNER,
      reason: `Hard ceiling triggered: ${input.hardCeilingFlags.join(", ")}`,
      canAutoExecute: false,
    };
  }

  const { confidencePercent: conf, impactAmountPhp: impact } = input;

  // High impact (> ₱1M) — always Michael.
  if (impact > FINANCIAL_THRESHOLDS.HIGH_IMPACT) {
    return {
      tier: TIERS.OWNER,
      reason: "High-impact decision (> ₱1M)",
      canAutoExecute: false,
    };
  }

  // Medium impact (₱100K–₱1M).
  if (impact > FINANCIAL_THRESHOLDS.TIER1_MAX) {
    if (conf >= 85) {
      return {
        tier: TIERS.EA,
        reason: "High confidence, medium impact → EA review",
        canAutoExecute: false,
      };
    }
    return {
      tier: TIERS.OWNER,
      reason: "Med/low confidence + medium impact → Michael",
      canAutoExecute: false,
    };
  }

  // Low impact (< ₱100K).
  if (conf >= 85) {
    return {
      tier: TIERS.AUTO,
      reason: "High confidence, low impact → auto",
      canAutoExecute: true,
    };
  }
  if (conf >= 60) {
    return {
      tier: TIERS.EA,
      reason: "Medium confidence, low impact → EA review",
      canAutoExecute: false,
    };
  }
  return {
    tier: TIERS.OWNER,
    reason: "Low confidence → escalate",
    canAutoExecute: false,
  };
}
