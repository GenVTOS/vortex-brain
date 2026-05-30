import {
  CONTRACTUAL_LANGUAGE,
  type HardCeiling,
} from "./constants";

// Detects whether a proposed action/message trips a hard ceiling. Used twice in
// the twin pipeline: once on intent, once on the generated output text.
// (spec §6.1 steps 6–7, hardening V-1.1/V-1.2)

export type ContactClassification =
  | "internal_team"
  | "external_trusted"
  | "external_new";

export interface CeilingCheckResult {
  passed: boolean; // true = safe to consider auto-send
  violations: HardCeiling[];
  contractualWords: string[];
  requiresOwnerApproval: boolean;
}

export function checkHardCeilings(opts: {
  recipientType: ContactClassification;
  messageText: string;
  actionType?: string; // 'hire' | 'terminate' | 'regulatory' | ...
}): CeilingCheckResult {
  const violations: HardCeiling[] = [];
  const contractualWords: string[] = [];

  // External recipient = always EXTERNAL_COMMUNICATION ceiling. Never auto-send.
  if (opts.recipientType !== "internal_team") {
    violations.push("EXTERNAL_COMMUNICATION");
  }

  // Scan for contractual / binding language.
  const lower = opts.messageText.toLowerCase();
  for (const word of CONTRACTUAL_LANGUAGE) {
    if (lower.includes(word)) contractualWords.push(word);
  }
  if (contractualWords.length > 0) violations.push("CONTRACT_APPROVAL");

  // Explicit action-type checks.
  if (opts.actionType === "hire" || opts.actionType === "terminate") {
    violations.push("HIRE_OR_TERMINATE");
  }
  if (opts.actionType === "regulatory") {
    violations.push("REGULATORY_DECISION");
  }

  return {
    passed: violations.length === 0,
    violations,
    contractualWords,
    requiresOwnerApproval: violations.length > 0,
  };
}
