# Vortex Brain — Architecture

Condensed from the approved plan (`~/.claude/plans/vortex-brain-kind-stallman.md`).
This is the durable architecture record; that plan is the canonical source.

## Layers

1. **Capture** — Plaud webhook, Computer Observer (Tauri, Phase 5), Calendar/Email, Garmin (Phase 4), Facebook intel (Phase 5). Each posts only sanitized/structured data — never raw content.
2. **Ingestion** — transcribe → speaker-ID → **company router** → entity-extract → Voyage embed. Dual-writes to **Supabase (source of truth)** and the **Obsidian vault (projection)**.
3. **Brain** — the twin pipeline (see below) + Michael Core identity + Wisdom Layer + Relationship Layer.
4. **Action** — send-queue processor (pg_cron, per-minute), proactive engine (pg_cron, hourly), delegation engine.
5. **Interface** — Briefing (role-filtered) + 11 screens across Command/Intel/Life/Wisdom/System + EA dashboard + seamless team chat.

## Twin pipeline (per inbound team message)

```
identify person + company
  → assemble system prompt  [michael_core scope='all'  +  THIS company only]
  → company-scoped vector search (filter company_id BEFORE rank) + Obsidian lookup
  → domain confidence (autonomy_domains)
  → RISK MATRIX (confidence × impact)
  → hard-ceiling check + injection guard + contractual-language detector
  → generate (Opus 4.8, cached prompt prefix)
  → output contractual-language re-check
  → send_queue (60s cancel window)  OR  EA escalate
  → audit_log (append-only)
```

## Company walls = 4 surfaces (all must agree)

RLS · vector search (filter before rank) · Obsidian search (company-scoped) · system-prompt
assembly (only this company + `'all'`). A leak in any one breaks the wall. One integration
test spans all four.

## Source of truth & the Obsidian projection

Supabase is authoritative. Vercel functions cannot persist files (ephemeral FS), so the
Obsidian vault is **generated** from Supabase by a sync job (GitHub Action / worker) that
commits markdown to a `vortex-vault` git repo. An in-app **read-only Vault browser** renders
the same content so Michael (thin client) reads the graph without local Obsidian.

## Data classification

- **L1** public · **L2** business (RLS, company-scoped) · **L3** personal + health (owner only — Rica blocked at RLS + API + component tree) · **L4** banking/passwords (never stored; Observer auto-pauses).

## Security invariants (hardcoded, non-configurable — `lib/security/constants.ts`)

Hard ceilings (external comms, contracts, hires, regulatory → always owner) · authorization
tiers (₱100K / ₱500K) · risk matrix · 60s send delay · injection patterns · corroboration
threshold (3) · dead-man's switch (48h) · session timeouts. The bot cannot learn past these.

## Tech stack

Next.js 14 (App Router, PWA) · Supabase (Postgres + pgvector + Auth/TOTP + Storage + pg_cron) ·
Claude API (`@anthropic-ai/sdk`, provider-abstracted) · Voyage `voyage-3.5` embeddings ·
Vercel hosting · GitHub Actions (vault sync, CI) · Resend (notifications, later) · Sentry (later).
