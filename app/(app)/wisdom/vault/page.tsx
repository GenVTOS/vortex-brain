import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { VaultBrowser } from "@/components/vault/VaultBrowser";

export default async function VaultPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner" && role !== "ea") redirect("/command");
  return <VaultBrowser />;
}
