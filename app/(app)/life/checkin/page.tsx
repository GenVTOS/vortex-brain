import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { HealthCheckin } from "@/components/health/HealthCheckin";

// L3 — owner only.
export default async function CheckinPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner") redirect("/command");
  return <HealthCheckin />;
}
