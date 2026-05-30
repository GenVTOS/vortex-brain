# Risk Register

| # | Risk | Severity | Mitigation | Phase |
|---|------|----------|-----------|-------|
| R1 | Real auto-send to a real person goes wrong | 🔴 | Confidence self-gate (0% day one) + per-person consent gate + 60s cancel + EA queue + Opus 4.8 + dead-man switch. External always escalates. | 2 |
| R2 | Cross-company leak via any of the 4 wall surfaces | 🔴 | One integration test spanning RLS + vector + Obsidian + prompt; `michael_core 'all'` only after 3-company corroboration; quarterly leak audit. | 0–1 |
| R3 | Obsidian dual-write impossible on serverless | 🟠 | Supabase = truth; vault = sync-job git projection + in-app Vault browser. | 1 |
| R4 | pg_cron / pg_net not available on the Supabase plan | 🟠 | Verify extensions in Phase 0; fallback = external pinger (cron-job.org) hitting routes with `CRON_SECRET`. | 0 |
| R5 | L3 personal/health leak to Rica | 🔴 | Owner-only at RLS + API + component tree; two Briefing variants; integration test. | 1, 6 |
| R6 | Legal — PH RA 10173 consent / AI-impersonation liability | 🔴 | Consent records + delegation doc as hard gate before real use; invisible audit metadata. | 2 |
| R7 | Voyage / Anthropic outage or model drift | 🟡 | `lib/ai/provider.ts` swappable interface; health-check endpoint; "in a meeting" fallback reply. | 1 |
| R8 | RLS custom-claims misconfigured (role not in JWT) | 🟠 | Role/company in **`app_metadata`** (not user-editable `user_metadata`); policies read `auth.jwt()->'app_metadata'`. Verified by cross-company test. | 0 |
| R9 | Scope (8 phases) overruns | 🟡 | Full architecture designed up front; built phase-by-phase with exit gates + daily debriefs. | all |
| R10 | Thin client can't see local artifacts | 🟡 | Everything delivered via deployed URL; vault readable in-app; no localhost dependencies for Michael. | all |
