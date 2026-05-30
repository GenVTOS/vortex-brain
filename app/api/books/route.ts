import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, MODELS, hasAnthropicKey, stripFences } from "@/lib/ai/provider";

export const runtime = "nodejs";
export const maxDuration = 60;

// Reading list (L3, owner only).
export async function GET() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const admin = createAdminClient();
  const { data } = await admin
    .from("books")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return NextResponse.json({ books: data ?? [] });
}

// Generate fresh suggestions from the reading profile + current business context.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if ((user.app_metadata as { role?: string })?.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const body = await req.json().catch(() => ({}));
  if (body.op !== "suggest") return NextResponse.json({ error: "unknown op" }, { status: 400 });
  if (!hasAnthropicKey()) return NextResponse.json({ error: "AI offline" }, { status: 503 });

  const admin = createAdminClient();
  const [{ data: profile }, { data: decisions }] = await Promise.all([
    admin.from("reading_profile").select("*").limit(1).maybeSingle(),
    admin.from("decisions").select("company_id, title").order("created_at", { ascending: false }).limit(6),
  ]);

  const out = await complete({
    model: MODELS.extract,
    maxTokens: 700,
    messages: [
      {
        role: "user",
        content: `Suggest 3 books for Michael. He likes: ${JSON.stringify(profile?.preferred_genres ?? [])} / themes ${JSON.stringify(profile?.preferred_themes ?? [])} (loved "Catching Thunder"). His current business context: ${(decisions ?? []).map((d) => `[${d.company_id}] ${d.title}`).join("; ") || "n/a"}.
Mix adventure-nonfiction he'd enjoy + at least one business-relevant pick tied to his context. Return ONLY JSON: {"books":[{"title":"","author":"","genre":"","suggestion_reason":"","relevance_to_company":""}]}`,
      },
    ],
  });
  let inserted = 0;
  try {
    const j = JSON.parse(stripFences(out));
    for (const b of (j.books ?? []).slice(0, 3)) {
      if (!b.title) continue;
      await admin.from("books").insert({
        title: String(b.title).slice(0, 200),
        author: b.author ?? null,
        genre: b.genre ?? null,
        status: "suggested",
        suggestion_reason: b.suggestion_reason ?? null,
        relevance_to_company: b.relevance_to_company ?? null,
      });
      inserted++;
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ inserted });
}
