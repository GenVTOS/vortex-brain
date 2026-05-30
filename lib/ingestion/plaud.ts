import { createAdminClient } from "@/lib/supabase/admin";
import { routeToCompany } from "./company-router";
import { extractEntities } from "./entity-extractor";
import { generateAndStoreEmbedding } from "@/lib/ai/embeddings";
import { trackObsidianFile } from "@/lib/obsidian/writer";
import { slugify } from "@/lib/obsidian/render";
import { CORROBORATION_THRESHOLD } from "@/lib/security/constants";

export interface PlaudPayload {
  recording_id: string;
  transcript: string;
  summary?: string;
  duration_seconds?: number;
  recorded_at?: string;
}

// Dual-write ingestion: Supabase (truth) + Obsidian projection tracking.
export async function processPlaudRecording(p: PlaudPayload): Promise<{
  conversationId: string | null;
  companyId: string | null;
  vaultPath: string | null;
  extracted: { decisions: number; commitments: number; patterns: number };
}> {
  const supabase = createAdminClient();
  const summary = p.summary ?? p.transcript.slice(0, 400);

  const companyId = await routeToCompany(summary);
  const entities = await extractEntities(p.transcript);

  const { data: conv } = await supabase
    .from("conversations")
    .insert({
      source: "plaud",
      company_id: companyId,
      raw_transcript: p.transcript,
      summary,
      decisions_extracted: entities.decisions,
      commitments_extracted: entities.commitments,
      patterns_extracted: entities.patterns,
      plaud_recording_id: p.recording_id,
      duration_seconds: p.duration_seconds ?? null,
      recorded_at: p.recorded_at ?? new Date().toISOString(),
      processed_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (!conv) {
    return {
      conversationId: null,
      companyId,
      vaultPath: null,
      extracted: { decisions: 0, commitments: 0, patterns: 0 },
    };
  }

  for (const d of entities.decisions) {
    await supabase.from("decisions").insert({
      company_id: companyId,
      title: d.title,
      context: d.context,
      domain: d.domain,
      made_by: "michael",
      source_conversation_id: conv.id,
    });
  }
  for (const c of entities.commitments) {
    await supabase.from("commitments").insert({
      company_id: companyId,
      description: c.description,
      assigned_by: "bot",
      source_conversation_id: conv.id,
    });
  }
  // Learned traits start INACTIVE — corroboration must reach the threshold before
  // they influence the twin (training-data-poisoning defense, hardening V-2.3).
  for (const pat of entities.patterns) {
    await supabase.from("michael_core").insert({
      trait_type: "learned_trait",
      content: pat.trait,
      source: "extracted_from_meeting",
      company_scope: companyId ?? "all",
      source_company_ids: companyId ? [companyId] : [],
      confidence: 0.4,
      corroboration_count: 1, // needs CORROBORATION_THRESHOLD to activate
      is_active: false,
    });
  }
  void CORROBORATION_THRESHOLD; // referenced by the activation job (Phase 7)

  await generateAndStoreEmbedding({
    sourceType: "conversation",
    sourceId: conv.id,
    companyId,
    content: `${summary}\n\n${p.transcript.slice(0, 2000)}`,
  });

  const date = (p.recorded_at ?? new Date().toISOString()).slice(0, 10);
  const vaultPath = `meetings/${date}-${slugify(companyId ?? "general")}-${conv.id.slice(0, 8)}.md`;
  await trackObsidianFile({
    filePath: vaultPath,
    fileType: "meeting",
    companyId,
    sourceId: conv.id,
  });

  return {
    conversationId: conv.id,
    companyId,
    vaultPath,
    extracted: {
      decisions: entities.decisions.length,
      commitments: entities.commitments.length,
      patterns: entities.patterns.length,
    },
  };
}
