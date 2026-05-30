import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { IntelDigest } from "@/components/intel/IntelDigest";

export default async function IntelPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner") redirect("/command");
  return <IntelDigest />;
}
