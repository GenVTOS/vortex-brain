import { createClient } from "@supabase/supabase-js";

// Service-role client — bypasses RLS. SERVER-ONLY. Never import into a client
// component. Used by ingestion, audit, cron jobs, and any flow that legitimately
// needs cross-row access. All company-wall enforcement for these paths must be
// applied explicitly in code (RLS does not protect the service role).
export const createAdminClient = () =>
  createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
