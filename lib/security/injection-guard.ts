import { INJECTION_PATTERNS } from "./constants";

// Scans inbound text (team messages, forwarded content) for prompt-injection
// patterns before it ever reaches the twin's LLM context. (hardening V-2.2)

export interface GuardResult {
  clean: boolean;
  detectedPatterns: string[];
}

export function scanForInjection(text: string): GuardResult {
  const lower = text.toLowerCase();
  const detected = INJECTION_PATTERNS.filter((p) => lower.includes(p));
  return { clean: detected.length === 0, detectedPatterns: [...detected] };
}
