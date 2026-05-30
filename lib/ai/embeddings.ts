import { createAdminClient } from "@/lib/supabase/admin";

// Voyage voyage-3.5 embeddings (1024-dim) via stable REST. Returns null if no key
// (search then falls back to full-text). (plan: Voyage decision)
export async function embed(
  text: string,
  inputType: "document" | "query" = "document",
): Promise<number[] | null> {
  const key = process.env.VOYAGE_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: [text.slice(0, 8000)],
        model: "voyage-3.5",
        input_type: inputType,
      }),
    });
    if (!res.ok) {
      console.error("[voyage]", res.status, (await res.text()).slice(0, 200));
      return null;
    }
    const data = await res.json();
    return data?.data?.[0]?.embedding ?? null;
  } catch (e) {
    console.error("[voyage] threw", e);
    return null;
  }
}

// Embed + persist. pgvector accepts the array as a '[...]' string literal.
export async function generateAndStoreEmbedding(opts: {
  sourceType: string;
  sourceId: string;
  companyId: string | null;
  content: string;
}): Promise<void> {
  const supabase = createAdminClient();
  const vec = await embed(opts.content, "document");
  await supabase.from("embeddings").insert({
    source_type: opts.sourceType,
    source_id: opts.sourceId,
    company_id: opts.companyId,
    content: opts.content,
    embedding: vec ? JSON.stringify(vec) : null,
  });
}

// Company-scoped semantic search. CRITICAL: company_id is filtered BEFORE ranking
// (hardening V-3.1). `includeCore` gates Michael Core ('all') — owner/twin only.
// Falls back to full-text if no embedding available.
export async function semanticSearch(opts: {
  query: string;
  companyId: string | null; // null = all companies (owner/EA); else single company
  includeCore?: boolean; // surface 'all'-scoped Michael Core
  limit?: number;
}): Promise<Array<{ source_type: string; company_id: string | null; content: string; similarity?: number }>> {
  const supabase = createAdminClient();
  const limit = opts.limit ?? 10;
  const includeCore = opts.includeCore ?? false;
  const vec = await embed(opts.query, "query");

  if (vec) {
    const { data, error } = await supabase.rpc("match_embeddings", {
      query_embedding: JSON.stringify(vec),
      match_company: opts.companyId,
      include_core: includeCore,
      match_count: limit,
    });
    if (!error && data) return data;
    if (error) console.error("[match_embeddings]", error.message);
  }

  // Full-text fallback (no key / rpc error). Mirror the same scope rules.
  let q = supabase
    .from("embeddings")
    .select("source_type, company_id, content")
    .textSearch("content", opts.query, { type: "websearch" })
    .limit(limit);
  if (opts.companyId) {
    q = includeCore
      ? q.or(`company_id.eq.${opts.companyId},company_id.eq.all`)
      : q.eq("company_id", opts.companyId);
  } else if (!includeCore) {
    q = q.neq("company_id", "all");
  }
  const { data } = await q;
  return data ?? [];
}
