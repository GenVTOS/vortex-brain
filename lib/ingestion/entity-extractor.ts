import { complete, MODELS, hasAnthropicKey, stripFences } from "@/lib/ai/provider";

export interface ExtractedEntities {
  decisions: { title: string; context: string; domain: string }[];
  commitments: { description: string; assignedTo?: string; dueDate?: string }[];
  patterns: { trait: string; evidence: string }[];
}

const EMPTY: ExtractedEntities = { decisions: [], commitments: [], patterns: [] };

export async function extractEntities(transcript: string): Promise<ExtractedEntities> {
  if (!hasAnthropicKey()) return EMPTY;
  const text = await complete({
    model: MODELS.extract,
    maxTokens: 1200,
    messages: [
      {
        role: "user",
        content: `Extract structured data from this meeting transcript. Return ONLY JSON, no prose:
{"decisions":[{"title":"","context":"","domain":"pricing|hiring|regulatory|strategy|operational|client_comms"}],
"commitments":[{"description":"","assignedTo":"","dueDate":""}],
"patterns":[{"trait":"how Michael communicated or decided","evidence":""}]}

Transcript:
${transcript.slice(0, 4000)}`,
      },
    ],
  });
  try {
    const p = JSON.parse(stripFences(text));
    return {
      decisions: Array.isArray(p.decisions) ? p.decisions : [],
      commitments: Array.isArray(p.commitments) ? p.commitments : [],
      patterns: Array.isArray(p.patterns) ? p.patterns : [],
    };
  } catch {
    return EMPTY;
  }
}
