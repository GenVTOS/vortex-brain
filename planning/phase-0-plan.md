# Phase 0 — Security Foundation (task breakdown)

Exit criteria: cross-company query as a team user returns **0 rows**; `audit_log` has no
UPDATE/DELETE grant; hard-ceiling constants live only in code (no config table).

- [x] Repo scaffold (Next.js 14, TS, Tailwind, App Router, `@/*` alias)
- [x] Vortex design tokens + Tailwind palette + Lexend + global base
- [ ] `lib/security/constants.ts` — TIERS, FINANCIAL_THRESHOLDS, HARD_CEILINGS, CONTRACTUAL_LANGUAGE, INJECTION_PATTERNS, CORROBORATION_THRESHOLD, DEAD_MANS_SWITCH_HOURS, SEND_QUEUE_DELAY_SECONDS, SESSION_TIMEOUT, ANOMALY thresholds
- [ ] `lib/security/risk-matrix.ts` — `evaluateRisk(confidence × impact + hard ceilings)`
- [ ] `lib/security/ceiling-checker.ts` — external-recipient + contractual-language + hire/terminate/regulatory detection
- [ ] `lib/security/injection-guard.ts` — scan inbound text for injection patterns
- [ ] `lib/security/audit.ts` — append-only writer via admin client (never throws)
- [ ] `lib/security/anomaly-detector.ts` — per-person message-rate lock
- [ ] `lib/supabase/{client,server,admin}.ts` — `@supabase/ssr` browser/server + service-role admin
- [ ] `middleware.ts` — auth gate (bounce unauth → /login; skip /api/ingest)
- [ ] Migrations `001_core` · `002_security` · `003_rls` (app_metadata claims) · `004_integrated_systems` · `005_personal` · `006_pg_cron`
- [ ] `.env.local` + `.env.example` + CI build placeholders
- [ ] Provision Supabase project via Management API; apply migrations 001→006; enable pgvector + pg_cron + pg_net
- [ ] Set Michael's user `app_metadata.role = 'owner'`
- [ ] Verify: cross-company SELECT as team → 0 rows; `\dp audit_log` shows no UPDATE/DELETE; personal_/health_ → 403 for non-owner

Reuse: security modules are correct as written in `robust-wren` Tasks 2–5, 25. RLS (Task 6's
migration 003) is **rewritten** to read `app_metadata` claims.
