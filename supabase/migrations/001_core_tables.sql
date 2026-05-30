-- ─────────────────────────────────────────────────────────────────────────
-- 001_core_tables.sql — Vortex Brain core schema (spec §3.1)
-- pgvector enabled; embeddings use Voyage voyage-3.5 → vector(1024).
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists vector;

-- Companies (data-wall key). id is a short lowercase code.
create table companies (
  id text primary key,
  name text not null,
  color text,
  icon text,
  autonomy_score float default 0,
  autonomy_trend text,
  created_at timestamptz default now()
);

-- People — core team + external contacts.
create table people (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company_id text references companies(id),
  type text not null, -- core_team | external_client | external_vendor | external_investor | family | wife
  contact_classification text not null default 'internal_team', -- internal_team | external_trusted | external_new
  communication_profile jsonb default '{}',
  relationship_health int default 80,
  last_contact_at timestamptz,
  contact_frequency_target text, -- daily | weekly | biweekly | monthly
  sentiment_trend text default 'neutral',
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Michael Core identity — cross-company traits travel; company-specific stay walled.
create table michael_core (
  id uuid primary key default gen_random_uuid(),
  trait_type text not null, -- decision_pattern | communication_style | value | explicit_rule | learned_trait
  content text not null,
  source text, -- manual | learned | extracted_from_meeting | extracted_from_email | correction
  company_scope text default 'all', -- 'all' | company id
  source_company_ids text[] default '{}',
  confidence float default 0.5,
  sample_count int default 0,
  corroboration_count int default 0, -- must reach 3 (distinct companies) before 'all' promotion
  is_frozen boolean default false, -- frozen → only Michael changes manually
  version int default 1,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  is_active boolean default true
);

create table michael_core_versions (
  id uuid primary key default gen_random_uuid(),
  trait_id uuid references michael_core(id),
  version int not null,
  content text not null,
  changed_by text not null, -- michael_manual | automated_learning | correction
  change_reason text,
  snapshot_at timestamptz default now()
);

-- Conversations (Plaud, observer, meetings, training).
create table conversations (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  company_id text references companies(id),
  raw_transcript text,
  summary text,
  participants uuid[] default '{}',
  decisions_extracted jsonb default '[]',
  commitments_extracted jsonb default '[]',
  patterns_extracted jsonb default '[]',
  sentiment_data jsonb default '{}',
  plaud_recording_id text,
  duration_seconds int,
  recorded_at timestamptz,
  processed_at timestamptz,
  created_at timestamptz default now()
);

-- Decisions (auto-logged + manual).
create table decisions (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id),
  title text not null,
  context text,
  reasoning text,
  made_by text not null, -- michael | bot
  bot_confidence float,
  outcome text default 'pending', -- pending | won | lost | positive | negative | tracking
  outcome_notes text,
  wisdom_expert_id text,
  wisdom_applied text,
  domain text, -- pricing | hiring | regulatory | strategy | operational | client_comms
  source_conversation_id uuid references conversations(id),
  revisit_date date,
  was_override boolean default false,
  override_was_correct boolean,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Commitments (extracted, tracked).
create table commitments (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id),
  assigned_to uuid references people(id),
  assigned_by text default 'michael',
  description text not null,
  due_date timestamptz,
  status text default 'pending', -- pending | in_progress | completed | overdue | cancelled
  source_conversation_id uuid references conversations(id),
  follow_up_count int default 0,
  last_follow_up_at timestamptz,
  created_at timestamptz default now()
);

-- Proactive actions (bot-initiated).
create table proactive_actions (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id),
  type text not null, -- outreach | followup | synergy | defend | optimize | calendar | financial | learning | delegate | market | collect | personal
  title text not null,
  detail text,
  draft_content text,
  confidence float,
  impact text default 'medium', -- low | medium | high
  urgency text default 'this_week', -- now | today | this_week | next_week
  status text default 'pending', -- pending | approved | executed | dismissed | undone
  executed_at timestamptz,
  michael_feedback text, -- good_call | wrong | edited
  created_at timestamptz default now()
);

-- Autonomy scores (per company per domain).
create table autonomy_domains (
  id uuid primary key default gen_random_uuid(),
  company_id text references companies(id),
  domain text not null,
  confidence float default 0,
  sample_count int default 0,
  trend text,
  bottleneck text,
  updated_at timestamptz default now(),
  unique (company_id, domain)
);

-- Training sessions (Michael actively teaching).
create table training_sessions (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- monologue | rule | correction
  company_id text references companies(id),
  raw_audio_url text,
  transcript text,
  extracted_rules jsonb default '[]',
  bot_said text,
  michael_corrected text,
  learning_extracted text,
  created_at timestamptz default now()
);

-- Observer.
create table observer_learnings (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  company_id text references companies(id),
  insight text not null,
  raw_context text,
  is_correct boolean default true,
  created_at timestamptz default now()
);

create table observer_blocklist (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  label text,
  is_auto_detected boolean default false,
  created_at timestamptz default now()
);

create table observer_blackout_log (
  id uuid primary key default gen_random_uuid(),
  reason text not null, -- manual | auto_blocklist
  trigger_detail text,
  prev_hash text,         -- hash-chaining (hardening V-4.3)
  entry_hash text,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds int
);

-- Wisdom.
create table wisdom_experts (
  id text primary key,
  name text not null,
  domain text not null,
  bio text,
  color text,
  avatar text,
  knowledge_base jsonb default '{}',
  system_prompt text
);

create table roundtable_sessions (
  id uuid primary key default gen_random_uuid(),
  topic text not null,
  company_id text references companies(id),
  expert_ids text[] not null,
  messages jsonb default '[]',
  synthesis text,
  applied_to_decision_id uuid references decisions(id),
  created_at timestamptz default now()
);

-- Embeddings — Voyage voyage-3.5 (1024-dim). Company-scoped vector search.
create table embeddings (
  id uuid primary key default gen_random_uuid(),
  source_type text not null, -- conversation | decision | commitment | observer_learning | training_session | personal_moment
  source_id uuid not null,
  company_id text, -- target company, or 'all' for Michael Core
  content text not null,
  embedding vector(1024),
  created_at timestamptz default now()
);
create index embeddings_company_idx on embeddings (company_id);
create index embeddings_vector_idx on embeddings using hnsw (embedding vector_cosine_ops);
create index embeddings_fts_idx on embeddings using gin (to_tsvector('english', content));

-- Emergency thresholds.
create table emergency_config (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- financial | legal | safety | relationship
  threshold_description text not null,
  threshold_value jsonb,
  action text not null, -- wake_michael | alert_ea | auto_handle
  is_active boolean default true
);
