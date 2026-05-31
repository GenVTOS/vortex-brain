import { redirect } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { TrainConsole } from "@/components/train/TrainConsole";

export default async function TrainPage() {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const role = (user?.app_metadata as { role?: string } | undefined)?.role ?? "team";
  if (role !== "owner") redirect("/command");
  return <TrainConsole />;
}
