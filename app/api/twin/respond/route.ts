import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { runTwinPipeline } from "@/lib/ai/twin";
import { checkMessageAnomaly } from "@/lib/security/anomaly-detector";
import type { ContactClassification } from "@/lib/security/ceiling-checker";

export const runtime = "nodejs";
export const maxDuration = 60;

// Generate a response as Michael. Team members see only the message (no internal
// metadata); owner/EA see the full pipeline result.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  const userCompany = (user.app_metadata as { company_id?: string })?.company_id;

  const body = await req.json().catch(() => ({}));
  const message = String(body.message ?? "").trim();
  const personId = body.personId as string | undefined;
  if (!message || !personId) {
    return NextResponse.json({ error: "message and personId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: person } = await admin.from("people").select("*").eq("id", personId).maybeSingle();
  if (!person) return NextResponse.json({ error: "person not found" }, { status: 404 });

  const companyId = (body.companyId as string) || person.company_id;
  if (role === "team" && companyId !== userCompany) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (await checkMessageAnomaly(person.id, person.name)) {
    return NextResponse.json(
      { error: "Unusual activity — session locked, Michael alerted" },
      { status: 429 },
    );
  }

  const result = await runTwinPipeline({
    message,
    person: {
      id: person.id,
      name: person.name,
      role: person.role ?? "",
      contactClassification: (person.contact_classification ?? "internal_team") as ContactClassification,
      communicationProfile: person.communication_profile ?? {},
    },
    companyId,
    domain: body.domain,
    estimatedImpactPhp: body.estimatedImpactPhp,
  });

  if (role === "team") {
    // Seamless: deliver text only if auto-sent; otherwise it's silently pending Michael.
    return NextResponse.json(
      result.canAutoSend ? { text: result.text } : { pending: true },
    );
  }
  return NextResponse.json(result);
}
