import {
  ANOMALY_MSG_THRESHOLD,
  ANOMALY_WINDOW_SECONDS,
} from "./constants";
import { writeAudit } from "./audit";

// In-memory sliding-window message-rate detector. If a person sends
// ANOMALY_MSG_THRESHOLD messages within ANOMALY_WINDOW_SECONDS, lock the session
// and alert. Catches compromised accounts / social-engineering probing.
// (spec §6.1, hardening V-5.2)
//
// NOTE: in-process state — fine for a single serverless region. If horizontally
// scaled, move the counter to Postgres or Redis. Tracked in risk register.

const messageCounts = new Map<string, { count: number; windowStart: number }>();

export async function checkMessageAnomaly(
  personId: string,
  personName: string,
): Promise<boolean> {
  const now = Date.now();
  const entry = messageCounts.get(personId);

  if (!entry || now - entry.windowStart > ANOMALY_WINDOW_SECONDS * 1000) {
    messageCounts.set(personId, { count: 1, windowStart: now });
    return false;
  }

  entry.count += 1;

  if (entry.count >= ANOMALY_MSG_THRESHOLD) {
    await writeAudit({
      actor: personName,
      actionType: "anomaly_detected",
      detail: {
        count: entry.count,
        windowSeconds: ANOMALY_WINDOW_SECONDS,
        personId,
      },
    });
    messageCounts.delete(personId);
    return true; // caller should lock session + alert Rica/Michael
  }

  return false;
}
