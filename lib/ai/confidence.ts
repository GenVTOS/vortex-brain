import { createAdminClient } from "@/lib/supabase/admin";
import { REQUIRED_SAMPLES } from "@/lib/security/constants";

// Per-company-per-domain confidence (spec §5.3). Confidence is earned from sample
// counts and is the throttle on auto-send — it starts at 0 for every domain.
export async function getDomainConfidence(
  companyId: string,
  domain: string,
): Promise<number> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("autonomy_domains")
    .select("confidence")
    .eq("company_id", companyId)
    .eq("domain", domain)
    .maybeSingle();
  return data?.confidence ?? 0;
}

export async function incrementDomainSample(
  companyId: string,
  domain: string,
): Promise<void> {
  const supabase = createAdminClient();
  const required = REQUIRED_SAMPLES[domain] ?? 50;
  const { data: existing } = await supabase
    .from("autonomy_domains")
    .select("id, sample_count")
    .eq("company_id", companyId)
    .eq("domain", domain)
    .maybeSingle();

  if (existing) {
    const newCount = existing.sample_count + 1;
    await supabase
      .from("autonomy_domains")
      .update({
        sample_count: newCount,
        confidence: Math.min((newCount / required) * 100, 100),
        updated_at: new Date().toISOString(),
      })
      .eq("id", existing.id);
  } else {
    await supabase.from("autonomy_domains").insert({
      company_id: companyId,
      domain,
      sample_count: 1,
      confidence: Math.min((1 / required) * 100, 100),
    });
  }
}

// Dead man's switch (spec §8.8): if Michael has been silent past threshold, all
// auto-execution is forced to zero — everything escalates.
export async function isDeadManTriggered(): Promise<boolean> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("dead_mans_switch")
    .select("is_triggered")
    .limit(1)
    .maybeSingle();
  return data?.is_triggered ?? false;
}
