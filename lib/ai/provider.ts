import Anthropic from "@anthropic-ai/sdk";

// Single seam for the LLM vendor (spec V-10.2 "build for swap"). Change models or
// provider here without touching call sites.
export const MODELS = {
  twin: "claude-opus-4-8", // highest-fidelity impersonation + ceiling adherence
  extract: "claude-haiku-4-5-20251001", // cheap, high-volume classification/extraction
  roundtable: "claude-sonnet-4-6", // balanced multi-turn debate
} as const;

let _client: Anthropic | null = null;
export function anthropic(): Anthropic {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export function hasAnthropicKey(): boolean {
  return !!process.env.ANTHROPIC_API_KEY;
}

// Text completion. `cacheSystem` prompt-caches the (stable) system prefix to cut
// cost/latency on the twin's repeated hard-ceiling/injection preamble.
export async function complete(opts: {
  model: string;
  system?: string;
  messages: Anthropic.MessageParam[];
  maxTokens?: number;
  cacheSystem?: boolean;
}): Promise<string> {
  const client = anthropic();
  const systemParam =
    opts.cacheSystem && opts.system
      ? [
          {
            type: "text" as const,
            text: opts.system,
            cache_control: { type: "ephemeral" as const },
          },
        ]
      : opts.system;

  const msg = await client.messages.create({
    model: opts.model,
    max_tokens: opts.maxTokens ?? 600,
    ...(systemParam ? { system: systemParam } : {}),
    messages: opts.messages,
  });
  const block = msg.content.find((b) => b.type === "text");
  return block && block.type === "text" ? block.text : "";
}

// Strip ```json fences some models wrap JSON in.
export function stripFences(s: string): string {
  return s
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .trim();
}
