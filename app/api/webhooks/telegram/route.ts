import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Telegram team-chat bridge (Phase 8 scaffold). Needs Michael's BotFather token +
// webhook secret before it does anything. When TELEGRAM_BOT_TOKEN is unset, it
// reports deferred. Once configured, this would resolve the sender → person and
// route to /api/twin/respond (escalations queue for the EA, exactly like web chat).
export async function POST(req: NextRequest) {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ ok: true, configured: false, note: "Telegram bridge not configured (needs BotFather token + webhook secret)." });
  }
  const secret = req.headers.get("x-telegram-bot-api-secret-token");
  if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  // TODO: map Telegram sender → people row, call runTwinPipeline, reply on send.
  return NextResponse.json({ ok: true, received: true });
}
