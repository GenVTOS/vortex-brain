-- ─────────────────────────────────────────────────────────────────────────
-- 003_integrated_systems.sql — Obsidian, Health, Books, Facebook Intel (spec §3.2)
-- (These four systems were dropped by the earlier lean plan; restored here.)
-- RLS for the L3 (health) tables is applied in 005 alongside personal tables.
-- ─────────────────────────────────────────────────────────────────────────

-- Obsidian vault sync tracking.
create table obsidian_files (
  id uuid primary key default gen_random_uuid(),
  file_path text not null unique, -- e.g. 'people/james-lim.md'
  file_type text not null, -- person | company | decision | meeting | pattern | expert | daily
  company_id text references companies(id),
  source_ids uuid[] default '{}',
  last_synced_at timestamptz default now(),
  content_hash text, -- detect manual edits in Obsidian
  created_at timestamptz default now()
);

-- Health & wellness (L3 — owner only). Garmin auto + manual check-in.
create table health_daily (
  id uuid primary key default gen_random_uuid(),
  date date not null unique,
  -- Garmin
  sleep_duration_minutes int,
  sleep_score int,
  sleep_stages jsonb,
  resting_hr int,
  stress_avg int,
  stress_max int,
  steps int,
  body_battery_high int,
  body_battery_low int,
  active_calories int,
  pulse_ox_avg int,
  respiration_avg int,
  garmin_raw jsonb,
  -- Manual check-in
  water_glasses int default 0,
  meals jsonb default '[]',
  bible_reading boolean default false,
  bible_passage text,
  bible_reflection text,
  mood int,
  mood_note text,
  energy int,
  exercise_type text,
  exercise_minutes int,
  -- AI
  daily_insight text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table health_correlations (
  id uuid primary key default gen_random_uuid(),
  correlation text not null,
  metric_a text not null,
  metric_b text not null,
  strength float,
  sample_count int default 0,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Books & reading.
create table books (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  author text,
  genre text,
  themes text[],
  status text default 'suggested', -- suggested | reading | finished | abandoned
  rating int,
  suggestion_reason text,
  relevance_to_company text,
  key_insights jsonb default '[]',
  wisdom_frameworks_extracted jsonb default '[]',
  progress_pct int default 0,
  started_at timestamptz,
  finished_at timestamptz,
  created_at timestamptz default now()
);

create table reading_profile (
  id uuid primary key default gen_random_uuid(),
  preferred_genres text[] default '{"adventure_nonfiction","investigative","biography"}',
  preferred_themes text[] default '{"true_stories","high_stakes","persistence","ocean"}',
  disliked_genres text[] default '{}',
  favorite_books jsonb default '[]',
  updated_at timestamptz default now()
);

-- Facebook algorithm intelligence.
create table algorithm_intel (
  id uuid primary key default gen_random_uuid(),
  source text default 'facebook', -- expandable: youtube | twitter | linkedin
  capture_date date not null,
  items jsonb not null,
  digest_summary text,
  trend_detection jsonb default '[]',
  created_at timestamptz default now()
);
