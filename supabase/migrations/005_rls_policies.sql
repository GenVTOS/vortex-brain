-- ─────────────────────────────────────────────────────────────────────────
-- 005_rls_policies.sql — Row Level Security (spec §3.3, hardening V-3.1/V-3.3/V-7.1)
--
-- Role + company_id live in app_metadata (admin-set, NOT user-editable). Policies
-- read them via helper fns below. The service-role admin client bypasses RLS, so
-- ingestion / twin / cron still work; the company wall on those paths is enforced
-- explicitly in code + the company-scoped vector query.
--
-- Access summary:
--   owner (Michael) → everything
--   ea (Rica)       → business data across companies; NO michael_core, NO personal/health
--   team            → their single company only
-- ─────────────────────────────────────────────────────────────────────────

create or replace function public.vb_role() returns text
  language sql stable as $$ select auth.jwt() -> 'app_metadata' ->> 'role' $$;

create or replace function public.vb_company() returns text
  language sql stable as $$ select auth.jwt() -> 'app_metadata' ->> 'company_id' $$;

-- Enable RLS on every table (deny-by-default).
alter table companies            enable row level security;
alter table people               enable row level security;
alter table michael_core         enable row level security;
alter table michael_core_versions enable row level security;
alter table conversations        enable row level security;
alter table decisions            enable row level security;
alter table commitments          enable row level security;
alter table proactive_actions    enable row level security;
alter table autonomy_domains     enable row level security;
alter table training_sessions    enable row level security;
alter table observer_learnings   enable row level security;
alter table observer_blocklist   enable row level security;
alter table observer_blackout_log enable row level security;
alter table wisdom_experts       enable row level security;
alter table roundtable_sessions  enable row level security;
alter table embeddings           enable row level security;
alter table emergency_config     enable row level security;
alter table audit_log            enable row level security;
alter table trusted_devices      enable row level security;
alter table consent_records      enable row level security;
alter table send_queue           enable row level security;
alter table dead_mans_switch     enable row level security;
alter table obsidian_files       enable row level security;
alter table health_daily         enable row level security;
alter table health_correlations  enable row level security;
alter table books                enable row level security;
alter table reading_profile      enable row level security;
alter table algorithm_intel      enable row level security;
alter table personal_dates       enable row level security;
alter table personal_moments     enable row level security;
alter table partner_consent      enable row level security;

-- ── Company-walled business tables: owner-all, ea-all/select, team-company ──
create policy companies_owner on companies for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy companies_ea on companies for select using (public.vb_role() = 'ea');
create policy companies_team on companies for select
  using (public.vb_role() = 'team' and id = public.vb_company());

create policy people_owner on people for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy people_ea on people for select using (public.vb_role() = 'ea');
create policy people_team on people for select
  using (public.vb_role() = 'team' and company_id = public.vb_company());

create policy conversations_owner on conversations for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy conversations_ea on conversations for select using (public.vb_role() = 'ea');
create policy conversations_team on conversations for select
  using (public.vb_role() = 'team' and company_id = public.vb_company());

create policy decisions_owner on decisions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy decisions_ea on decisions for all
  using (public.vb_role() = 'ea') with check (public.vb_role() = 'ea');
create policy decisions_team on decisions for select
  using (public.vb_role() = 'team' and company_id = public.vb_company());

create policy commitments_owner on commitments for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy commitments_ea on commitments for all
  using (public.vb_role() = 'ea') with check (public.vb_role() = 'ea');
create policy commitments_team on commitments for select
  using (public.vb_role() = 'team' and company_id = public.vb_company());

-- ── Bot-facing business tables: owner-all, ea-all (no team) ──
create policy proactive_owner on proactive_actions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy proactive_ea on proactive_actions for all
  using (public.vb_role() = 'ea') with check (public.vb_role() = 'ea');

create policy send_queue_owner on send_queue for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy send_queue_ea on send_queue for all
  using (public.vb_role() = 'ea') with check (public.vb_role() = 'ea');

-- ── Owner-all, ea-select ──
create policy autonomy_owner on autonomy_domains for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy autonomy_ea on autonomy_domains for select using (public.vb_role() = 'ea');

create policy wisdom_owner on wisdom_experts for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy wisdom_ea on wisdom_experts for select using (public.vb_role() = 'ea');

create policy roundtable_owner on roundtable_sessions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy roundtable_ea on roundtable_sessions for select using (public.vb_role() = 'ea');

create policy consent_owner on consent_records for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy consent_ea on consent_records for select using (public.vb_role() = 'ea');

create policy deadman_owner on dead_mans_switch for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy deadman_ea on dead_mans_switch for select using (public.vb_role() = 'ea');

-- obsidian_files: owner-all; ea sees business files only (company-tagged).
create policy obsidian_owner on obsidian_files for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy obsidian_ea on obsidian_files for select
  using (public.vb_role() = 'ea' and company_id is not null);

-- ── Embeddings: owner-all, ea-select, team-company (NOT 'all' scope) ──
create policy embeddings_owner on embeddings for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy embeddings_ea on embeddings for select using (public.vb_role() = 'ea');
create policy embeddings_team on embeddings for select
  using (public.vb_role() = 'team' and company_id = public.vb_company());

-- ── Audit log: owner select only (writes via service role; UPDATE/DELETE revoked) ──
create policy audit_owner on audit_log for select using (public.vb_role() = 'owner');

-- ── Owner-ONLY tables (identity, observer, emergency, L3 personal/health) ──
create policy core_owner on michael_core for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy core_versions_owner on michael_core_versions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy training_owner on training_sessions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy obs_learn_owner on observer_learnings for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy obs_block_owner on observer_blocklist for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy obs_blackout_owner on observer_blackout_log for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy emergency_owner on emergency_config for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy devices_owner on trusted_devices for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');

-- L3 personal
create policy pdates_owner on personal_dates for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy pmoments_owner on personal_moments for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy pconsent_owner on partner_consent for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');

-- L3 health (same wall as personal)
create policy health_owner on health_daily for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy health_corr_owner on health_correlations for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');

-- L3 reading / algorithm intel (Michael's personal feeds)
create policy books_owner on books for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy reading_owner on reading_profile for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
create policy intel_owner on algorithm_intel for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
