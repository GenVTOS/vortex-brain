// ─────────────────────────────────────────────────────────────────────────
// IMMUTABLE SECURITY CONSTANTS
// These are NOT configurable. They cannot be changed via DB rows or env vars.
// The bot cannot learn its way past them. Any PR that makes these conditional,
// reads them from a table, or weakens a hard ceiling must be rejected.
// (spec §1.4, security-hardening V-6.1)
// ─────────────────────────────────────────────────────────────────────────

export const TIERS = {
  AUTO: 1, // < ₱100K with precedent → bot handles
  EA: 2, //   ₱100K–₱500K or non-routine → Rica approves
  OWNER: 3, // > ₱500K, contracts, external comms, hires → Michael only
} as const;

export const FINANCIAL_THRESHOLDS = {
  TIER1_MAX: 100_000, // PHP
  TIER2_MAX: 500_000, // PHP
  HIGH_IMPACT: 1_000_000, // PHP — always Michael
} as const;

// Actions that ALWAYS require OWNER review, regardless of confidence score.
// Adding to this list requires Michael's explicit approval.
export const HARD_CEILINGS = [
  "EXTERNAL_COMMUNICATION", // any message to clients, investors, government, partners
  "CONTRACT_APPROVAL", // any document with binding language
  "HIRE_OR_TERMINATE", // any staffing decision
  "REGULATORY_DECISION", // compliance, permits, legal filings
] as const;

export type HardCeiling = (typeof HARD_CEILINGS)[number];

// Contractual words the bot must NEVER use without Tier 3 approval.
export const CONTRACTUAL_LANGUAGE = [
  "we agree",
  "agreed",
  "confirmed",
  "it's a deal",
  "it is a deal",
  "we commit",
  "committed",
  "approved",
  "you're hired",
  "you are hired",
  "you're terminated",
  "you are terminated",
] as const;

// Injection-attack patterns to detect in incoming messages (case-insensitive).
export const INJECTION_PATTERNS = [
  "ignore previous instructions",
  "ignore your instructions",
  "ignore all previous",
  "system prompt",
  "you are now",
  "forget your instructions",
  "disregard the above",
  "disregard previous",
  "new instructions:",
  "override:",
  "reveal your",
] as const;

// How many DISTINCT-company corroborations a learned trait needs before it can
// be promoted to company_scope = 'all'. (spec §3.1, §8.4)
export const CORROBORATION_THRESHOLD = 3;

// Dead man's switch — no Michael interaction for this long → all auto-exec → 0.
export const DEAD_MANS_SWITCH_HOURS = 48;

// Send queue delay (seconds) — cancel window before an auto-message delivers.
export const SEND_QUEUE_DELAY_SECONDS = 60;

// Session timeouts (seconds).
export const SESSION_TIMEOUT = {
  OWNER: 4 * 60 * 60,
  EA: 2 * 60 * 60,
  TEAM: 8 * 60 * 60,
} as const;

// Staleness: if the freshest relevant data is older than this, drop confidence.
export const STALENESS_DAYS = 7;
export const STALENESS_CONFIDENCE_PENALTY = 20; // percentage points

// Anomaly detection: this many messages within the window → lock + alert.
export const ANOMALY_MSG_THRESHOLD = 10;
export const ANOMALY_WINDOW_SECONDS = 300;

// Required sample counts per domain before the bot can act autonomously. (spec §5.3)
export const REQUIRED_SAMPLES: Record<string, number> = {
  operational: 20,
  pricing: 50,
  hiring: 30,
  client_comms: 40,
  strategy: 100,
  regulatory: 200,
};
