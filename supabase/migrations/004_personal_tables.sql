-- ─────────────────────────────────────────────────────────────────────────
-- 004_personal_tables.sql — L3 personal / inner-circle (spec §3.1)
-- Owner-only. RLS for these + the health tables is set in 005.
-- ─────────────────────────────────────────────────────────────────────────

create table personal_dates (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  date date not null,
  type text not null, -- anniversary | birthday | date_night | family_event | holiday
  related_person_id uuid references people(id),
  notes text,
  bot_action text,
  is_recurring boolean default false,
  recurrence_rule text, -- yearly | monthly | biweekly
  created_at timestamptz default now()
);

create table personal_moments (
  id uuid primary key default gen_random_uuid(),
  type text not null, -- message | quality_time | missed | positive | negative
  detail text not null,
  sentiment text, -- positive | watch | negative | neutral
  related_person_id uuid references people(id),
  occurred_at timestamptz default now()
);

create table partner_consent (
  id uuid primary key default gen_random_uuid(),
  consent_level text not null default 'dates_only', -- dates_only | full
  consented_at timestamptz,
  updated_at timestamptz default now()
);
insert into partner_consent (consent_level) values ('dates_only');
