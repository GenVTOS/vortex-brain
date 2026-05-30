import { NextRequest, NextResponse } from "next/server";
import { processPlaudRecording } from "@/lib/ingestion/plaud";

export const runtime = "nodejs";
export const maxDuration = 60;

// Plaud webhook receiver. Verifies a shared secret, then runs the ingestion
// pipeline. Processes synchronously so the response reports what was stored
// (useful for the smoke test); for production volume, move to a background job.
export async function POST(req: NextRequest) {
  const secret = req.headers.get("x-plaud-secret");
  if (!process.env.PLAUD_WEBHOOK_SECRET || secret !== process.env.PLAUD_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: { recording_id?: string; transcript?: string };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  if (!payload?.transcript || !payload?.recording_id) {
    return NextResponse.json({ error: "Missing transcript or recording_id" }, { status: 400 });
  }

  try {
    const result = await processPlaudRecording(payload as Required<typeof payload>);
    return NextResponse.json({ received: true, ...result });
  } catch (e) {
    console.error("[plaud ingest]", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
