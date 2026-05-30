import { NextRequest, NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

// Daily wellness check-in (L3, owner only). Upserts today's health_daily row.
export async function POST(req: NextRequest) {
  const supabase = createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (user.app_metadata as { role?: string })?.role ?? "team";
  if (role !== "owner") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const b = await req.json().catch(() => ({}));
  const today = new Date().toISOString().slice(0, 10);
  const admin = createAdminClient();
  const { error } = await admin.from("health_daily").upsert(
    {
      date: today,
      water_glasses: b.water_glasses ?? 0,
      meals: b.meals ?? [],
      bible_reading: b.bible_reading ?? false,
      bible_passage: b.bible_passage ?? null,
      bible_reflection: b.bible_reflection ?? null,
      mood: b.mood ?? null,
      mood_note: b.mood_note ?? null,
      energy: b.energy ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "date" },
  );
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
