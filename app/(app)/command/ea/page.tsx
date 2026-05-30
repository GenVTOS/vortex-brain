import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { EADashboard } from "@/components/ea/EADashboard";

// Owner + EA only. Team members are bounced even if they reach the route.
export default async function EAPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner" && role !== "ea") redirect("/command");
  return <EADashboard />;
}
