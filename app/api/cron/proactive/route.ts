import { NextResponse } from "next/server";
import { runProactiveEngine } from "@/lib/jobs/proactive-engine";

export const runtime = "nodejs";
export const maxDuration = 60;

// Hourly proactive engine. Called by pg_cron via pg_net (migration 009) with the
// CRON_SECRET bearer. Also callable manually for verification.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await runProactiveEngine();
  return NextResponse.json({ ok: true, ...result });
}
