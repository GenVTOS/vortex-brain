import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { SecurityConsole } from "@/components/security/SecurityConsole";

export default async function SecurityPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner") redirect("/command");
  return <SecurityConsole />;
}
