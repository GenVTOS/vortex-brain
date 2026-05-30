import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Request-scoped server client (anon key, RLS applies). Next 14 sync cookies().
// The setAll try/catch swallows the "cannot set cookies in a Server Component"
// error — middleware refreshes the session cookie on the next request.
export function createServerSupabase() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Called from a Server Component — safe to ignore.
          }
        },
      },
    },
  );
}
