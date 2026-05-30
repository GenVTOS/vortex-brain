# Phase 1 — Foundation + Obsidian + Ingestion + Briefing + Search

Exit criteria: a Plaud recording → Supabase rows **and** a wikilinked `.md` in the vault **and**
it shows in the Briefing; Brain Search returns from both; cross-company vector test returns 0.

## UI shell & auth
- [ ] `components/ui/{Glass,Tag,Sec,Confidence}.tsx` (from prototype, Tailwind-converted)
- [ ] `components/layout/{TopBar,BottomNav,SubTabs}.tsx` — 5 sections (Command/Intel/Life/Wisdom/System)
- [ ] `app/(app)/layout.tsx` — shell (max-w app, TopBar, scroll area, BottomNav)
- [ ] `app/(auth)/login/page.tsx` + `app/(auth)/mfa/page.tsx` — password + TOTP MFA (`supabase.auth.mfa`)

## AI plumbing
- [ ] `lib/ai/provider.ts` — swappable LLM interface (spec V-10.2); model map (twin=Opus 4.8, extract=Haiku 4.5)
- [ ] `lib/ai/embeddings.ts` — **real Voyage `voyage-3.5`** embed + store `vector(1024)`; company-scoped similarity query
- [ ] `lib/ingestion/{company-router,entity-extractor,plaud}.ts` — route → extract → store (Supabase + queue vault write)
- [ ] `lib/obsidian/{writer,sync}.ts` + `vortex-vault` repo + GitHub Action — generate wikilinked markdown from Supabase
- [ ] `app/api/ingest/plaud/route.ts` — webhook (secret-verified), async process

## Screens
- [ ] `app/api/briefing/route.ts` (role-filtered: owner full, EA business-only) + `app/(app)/command/page.tsx` + `components/briefing/*`
- [ ] `app/api/search/route.ts` (vector + full-text + Obsidian, company-scoped) + `app/(app)/wisdom/search/page.tsx`

## Verify
- [ ] Mock Plaud payload → ingest → Supabase + vault + Briefing + Search all show it
- [ ] Cross-company vector search returns 0 from the other company
- [ ] Deploy to Vercel; hand Michael the live URL

Reuse: `robust-wren` Tasks 8, 9, 11, 12, 13 — with embeddings swapped to real Voyage and the
Obsidian dual-write added (both absent from robust-wren).
