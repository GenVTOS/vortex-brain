"use client";

import { useEffect, useState, useCallback } from "react";
import { Glass } from "@/components/ui/Glass";
import { Sec } from "@/components/ui/Sec";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/design/tokens";

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function SecurityConsole() {
  const supabase = createClient();
  const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
  const [enroll, setEnroll] = useState<{ id: string; qr: string } | null>(null);
  const [code, setCode] = useState("");
  const [transparency, setTransparency] = useState(false);
  const [pushState, setPushState] = useState<"idle" | "on" | "blocked">("idle");
  const [msg, setMsg] = useState("");

  const refresh = useCallback(async () => {
    const { data } = await supabase.auth.mfa.listFactors();
    setFactors((data?.totp ?? []).map((f) => ({ id: f.id, status: f.status })));
    const cfg = await fetch("/api/system/config").then((r) => r.json());
    setTransparency(!!cfg.transparencyMode);
  }, [supabase]);
  useEffect(() => {
    refresh();
  }, [refresh]);

  async function startEnroll() {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error) return setMsg(error.message);
    setEnroll({ id: data.id, qr: data.totp.qr_code });
  }
  async function verifyEnroll() {
    if (!enroll) return;
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enroll.id, code });
    if (error) return setMsg(error.message);
    setEnroll(null);
    setCode("");
    setMsg("2FA enabled ✓");
    refresh();
  }
  async function unenroll(id: string) {
    await supabase.auth.mfa.unenroll({ factorId: id });
    refresh();
  }
  async function toggleTransparency() {
    const next = !transparency;
    setTransparency(next);
    await fetch("/api/system/config", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ transparencyMode: next }) });
  }
  async function enablePush() {
    try {
      const reg = await navigator.serviceWorker.register("/sw.js");
      const perm = await Notification.requestPermission();
      if (perm !== "granted") return setPushState("blocked");
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!) as BufferSource,
      });
      await fetch("/api/push/subscribe", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ subscription: sub }) });
      setPushState("on");
    } catch {
      setPushState("blocked");
    }
  }

  return (
    <>
      <div style={{ fontSize: 18, fontWeight: 600, color: T.white, marginBottom: 3 }}>Security & Settings</div>
      {msg && <div style={{ fontSize: 10, color: T.green, margin: "6px 0" }}>{msg}</div>}

      {/* MFA */}
      <Sec color={T.green}>Two-factor authentication</Sec>
      <Glass style={{ marginBottom: 12 }}>
        {factors.filter((f) => f.status === "verified").length > 0 ? (
          factors.map((f) => (
            <div key={f.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
              <span style={{ fontSize: 11, color: T.green }}>✓ Authenticator app enrolled</span>
              <button onClick={() => unenroll(f.id)} style={{ fontSize: 9, color: T.red, background: "none", border: "none", cursor: "pointer" }}>remove</button>
            </div>
          ))
        ) : enroll ? (
          <div>
            <div style={{ fontSize: 10, color: T.sub, marginBottom: 8 }}>Scan with Google Authenticator / Authy, then enter the 6-digit code.</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={enroll.qr} alt="2FA QR" style={{ width: 160, height: 160, background: "#fff", borderRadius: 8, padding: 6 }} />
            <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
              <input value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" style={{ flex: 1, padding: "8px 10px", borderRadius: 8, background: T.bg, color: T.white, border: `1px solid ${T.border}`, fontSize: 14, letterSpacing: "0.2em", textAlign: "center", outline: "none" }} />
              <button onClick={verifyEnroll} style={{ padding: "8px 14px", borderRadius: 8, border: "none", background: T.green, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Verify</button>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: 11, color: T.sub }}>Not enabled — add an authenticator app.</span>
            <button onClick={startEnroll} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: T.green, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Enable 2FA</button>
          </div>
        )}
      </Glass>

      {/* Transparency */}
      <Sec color={T.blue}>Transparency mode</Sec>
      <Glass style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <div style={{ fontSize: 11, color: T.white }}>Mark assistant-sent messages</div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>Adds a subtle &quot;via assistant&quot; note to bot replies. (The bot never lies if asked directly either way.)</div>
          </div>
          <button onClick={toggleTransparency} style={{ width: 44, height: 24, borderRadius: 12, border: "none", background: transparency ? T.blue : T.border, cursor: "pointer", position: "relative" }}>
            <span style={{ position: "absolute", top: 2, left: transparency ? 22 : 2, width: 20, height: 20, borderRadius: "50%", background: "#fff", transition: "left .15s" }} />
          </button>
        </div>
      </Glass>

      {/* Push */}
      <Sec color={T.amber}>Push notifications</Sec>
      <Glass>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ flex: 1, paddingRight: 10 }}>
            <div style={{ fontSize: 11, color: T.white }}>Emergency alerts on this device</div>
            <div style={{ fontSize: 9, color: T.muted, marginTop: 1 }}>{pushState === "on" ? "Enabled on this device ✓" : pushState === "blocked" ? "Blocked — allow notifications in your browser." : "Get woken for financial/legal/safety emergencies."}</div>
          </div>
          {pushState !== "on" && (
            <button onClick={enablePush} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: T.amber, color: T.bg, fontSize: 11, fontWeight: 700, cursor: "pointer" }}>Enable</button>
          )}
        </div>
      </Glass>
    </>
  );
}
