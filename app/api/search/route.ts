import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { semanticSearch } from "@/lib/ai/embeddings";

export const runtime = "nodejs";

// Brain Search — company-scoped (the wall is enforced in the RPC, BEFORE ranking).
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  const userCompany = (user.app_metadata as { company_id?: string })?.company_id ?? null;

  const body = await req.json().catch(() => ({}));
  const query = String(body.query ?? "").trim();
  if (!query) return NextResponse.json({ results: [] });

  // Scope: team → their company only; owner/EA → all companies. Only owner sees
  // Michael Core ('all').
  const companyId = role === "team" ? userCompany : (body.companyId ?? null);
  const includeCore = role === "owner";

  const results = await semanticSearch({ query, companyId, includeCore, limit: 10 });
  return NextResponse.json({ results });
}
