import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ObserverSettings } from "@/components/observer/ObserverSettings";

export default async function ObserverPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner") redirect("/command");
  return <ObserverSettings />;
}
