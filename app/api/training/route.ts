import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { complete, MODELS, hasAnthropicKey, stripFences } from "@/lib/ai/provider";
import { writeAudit } from "@/lib/security/audit";

export const runtime = "nodejs";
export const maxDuration = 60;

async function ownerGate() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, status: 401 };
  if ((user.app_metadata as { role?: string })?.role !== "owner") return { ok: false as const, status: 403 };
  return { ok: true as const };
}

export async function POST(req: NextRequest) {
  const gate = await ownerGate();
  if (!gate.ok) return NextResponse.json({ error: "Forbidden" }, { status: gate.status });
  const admin = createAdminClient();
  const body = await req.json().catch(() => ({}));

  // Explicit rule — frozen, active immediately. Snapshots prior content for rollback.
  if (body.type === "rule") {
    const content = String(body.content ?? "").trim();
    if (!content) return NextResponse.json({ error: "content required" }, { status: 400 });
    const scope = body.companyScope || "all";

    // If an explicit rule with the same scope+content prefix exists, version it.
    const { data: existing } = await admin
      .from("michael_core")
      .select("id, content, version")
      .eq("trait_type", "explicit_rule")
      .eq("company_scope", scope)
      .eq("content", content)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ ok: true, id: existing.id, note: "already exists" });
    }

    const { data: inserted } = await admin
      .from("michael_core")
      .insert({
        trait_type: "explicit_rule",
        content,
        source: "manual",
        company_scope: scope,
        confidence: 1.0,
        sample_count: 1,
        is_frozen: true,
        is_active: true,
      })
      .select()
      .single();

    if (inserted) {
      await admin.from("michael_core_versions").insert({
        trait_id: inserted.id,
        version: 1,
        content,
        changed_by: "michael_manual",
        change_reason: "rule created",
      });
    }
    await writeAudit({ actor: "michael", actionType: "rule_changed", detail: { kind: "rule", scope, content: content.slice(0, 200) } });
    return NextResponse.json({ ok: true, id: inserted?.id });
  }

  // Correction — store the session, extract a learning (inactive until reviewed).
  if (body.type === "correction") {
    const botSaid = String(body.botSaid ?? "").trim();
    const corrected = String(body.corrected ?? "").trim();
    if (!corrected) return NextResponse.json({ error: "corrected required" }, { status: 400 });

    let learning = "";
    if (hasAnthropicKey()) {
      learning = (
        await complete({
          model: MODELS.extract,
          maxTokens: 120,
          messages: [
            {
              role: "user",
              content: `The bot said: "${botSaid}"\nMichael corrected it to: "${corrected}"\nIn ONE sentence, state the general rule/preference Michael is teaching (no preamble).`,
            },
          ],
        })
      ).trim();
    }
    learning = stripFences(learning) || corrected;

    await admin.from("training_sessions").insert({
      type: "correction",
      bot_said: botSaid,
      michael_corrected: corrected,
      learning_extracted: learning,
    });
    await admin.from("michael_core").insert({
      trait_type: "learned_trait",
      content: learning,
      source: "correction",
      company_scope: body.companyScope || "all",
      confidence: 0.5,
      corroboration_count: 1,
      is_active: false,
    });
    await writeAudit({ actor: "michael", actionType: "rule_changed", detail: { kind: "correction", learning: learning.slice(0, 200) } });
    return NextResponse.json({ ok: true, learning });
  }

  return NextResponse.json({ error: "unknown type" }, { status: 400 });
}
