"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { T } from "@/lib/design/tokens";

// Verifies an existing TOTP factor. Enrollment of new factors happens in Settings
// (Phase 7). If no factor exists, we let the owner proceed (MFA is opt-in for v1).
export default function MfaPage() {
  const router = useRouter();
  const supabase = createClient();
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.mfa.listFactors();
      const totp = data?.totp?.[0];
      if (!totp) {
        router.push("/command");
        return;
      }
      setFactorId(totp.id);
      setChecking(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      setError(error.message);
      return;
    }
    router.push("/command");
    router.refresh();
  }

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: T.bg, padding: 20 }}>
      <form onSubmit={verify} style={{ width: "100%", maxWidth: 320, background: T.glass, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24, backdropFilter: "blur(20px)" }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.white, marginBottom: 4 }}>Two-factor</div>
        <div style={{ fontSize: 11, color: T.sub, marginBottom: 16 }}>Enter the 6-digit code from your authenticator.</div>
        {checking ? (
          <div style={{ fontSize: 11, color: T.muted }}>Checking…</div>
        ) : (
          <>
            <input
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              placeholder="000000"
              style={{ width: "100%", padding: "12px", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)", background: "rgba(255,255,255,0.03)", color: T.white, fontSize: 20, letterSpacing: "0.3em", textAlign: "center", outline: "none", marginBottom: 14 }}
            />
            {error && <div style={{ fontSize: 11, color: T.red, marginBottom: 10 }}>{error}</div>}
            <button type="submit" style={{ width: "100%", padding: "11px", borderRadius: 10, border: "none", background: T.blue, color: T.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
              Verify
            </button>
          </>
        )}
      </form>
    </div>
  );
}
