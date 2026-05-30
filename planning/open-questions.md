# Open Questions & Inputs Needed From Michael

Status legend: ⏳ waiting on Michael · ✅ resolved · 🔧 has a working default

---

## 1. ⏳ Real venture roster (gates real seed data)

You chose **real ventures**, so I need your actual org structure. The system is built
to hold up to 6 companies + 2 cross-company roles. Fill this in (delete/add rows as
needed). `id` is a short lowercase code I'll use everywhere (data walls key off it).

| id | Company name | Core person (name) | Their role | Preferred channel |
|----|--------------|--------------------|-----------|-------------------|
| `c1` |  |  |  | chat / email / WhatsApp / Slack / Telegram |
| `c2` |  |  |  |  |
| `c3` |  |  |  |  |
| `c4` |  |  |  |  |
| `c5` |  |  |  |  |
| `c6` |  |  |  |  |

**Cross-company roles**

| role | Name | Notes |
|------|------|-------|
| EA / Chief of Staff |  | Sees all companies' business data, NOT personal/health. Can "Send as Michael". |
| CFO (Group) |  | Read-only financials across companies. Cannot send as you. |

**You (owner):** confirm the email you'll log in with (default: michael@vortexventuresgroup.com).

> Until this arrives I'll build against a thin placeholder seed so the app runs; swapping
> in the real roster is a one-file change (`supabase/seed.sql`) + setting each person's role
> in Supabase Auth `app_metadata`.

---

## 2. ⏳ API keys (paste into `C:\Projects\vortex-brain\.env.local`)

| Var | Where to get it | Needed for |
|-----|-----------------|-----------|
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys | The twin, extraction, wisdom — everything AI |
| `VOYAGE_API_KEY` | dashboard.voyageai.com (free tier) | Brain Search embeddings + company-wall vector test |

Supabase project + keys I provision myself via the Management API (your `SUPABASE_ACCESS_TOKEN`
is already in your environment). Vercel deploys via the GitHub App — no key needed.

---

## 3. ⏳ Consent + delegation gate (before any REAL auto-send, not before building)

Because auto-send is ON and the people are real, before the bot ever messages a real
teammate as you, two things must exist (I'll draft both for your signature):
- **Recording / AI-communication acknowledgment** per team member (PH RA 10173). Stored in `consent_records`.
- **Delegation-of-authority note** — you authorizing the bot to communicate within the hard ceilings.

Nothing auto-sends on day one regardless: every domain starts at 0% confidence and must
earn ≥85% (20+ logged samples) before Tier-1 auto-send unlocks. This gate is the second lock.

---

## 4. 🔧 Defaults I've chosen (override anytime)

- **Twin model:** `claude-opus-4-8` (highest-fidelity impersonation + ceiling adherence). Cheaper toggle: `claude-sonnet-4-6`.
- **Repo/dir:** `C:\Projects\vortex-brain` (lowercase — npm rejects capitals; matches GitHub `GenVTOS/vortex-brain`).
- **App URL:** Vercel default `vortex-brain-*.vercel.app` until you want a custom domain.
- **Obsidian vault:** materialized to a separate `vortex-vault` git repo by a sync job; an in-app read-only Vault browser lets you read the graph from your thin client (no local Obsidian needed).

---

## 5. ⏳ Later-phase inputs (not blocking now)

- **Garmin** Developer Program approval + OAuth creds → Phase 4 (health).
- **Plaud** Developer Platform webhook secret → Phase 1 testing uses a mock payload until you have it.
- **Wife's name + consent level** (`dates_only` default) → Phase 6 (personal layer).
