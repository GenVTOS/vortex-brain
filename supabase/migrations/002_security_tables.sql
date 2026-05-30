-- ─────────────────────────────────────────────────────────────────────────
-- 002_security_tables.sql — audit, devices, consent, send queue, dead man's switch
-- ─────────────────────────────────────────────────────────────────────────

-- Immutable audit log. UPDATE/DELETE revoked below — append-only. (spec §3.1)
create table audit_log (
  id uuid primary key default gen_random_uuid(),
  actor text not null, -- bot | michael | rica | team member name
  action_type text not null,
  company_id text,
  target_person_id uuid,
  detail jsonb not null,
  confidence float,
  risk_tier text, -- tier1 | tier2 | tier3
  was_auto boolean default false,
  ip_address text,
  device_id text,
  created_at timestamptz default now()
);

-- Hard append-only guarantee — no UPDATE/DELETE for any non-superuser role.
revoke update, delete on audit_log from public;
revoke update, delete on audit_log from authenticated;
revoke update, delete on audit_log from anon;
revoke update, delete on audit_log from service_role;

-- Trusted devices (Michael + Rica anomaly detection).
create table trusted_devices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  device_fingerprint text not null,
  device_name text,
  ip_range text,
  last_used_at timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- Recording / AI-communication consent (PH RA 10173).
create table consent_records (
  id uuid primary key default gen_random_uuid(),
  person_id uuid references people(id),
  consent_type text not null, -- recording_acknowledgment | ai_communication | data_processing
  document_url text,
  consented_at timestamptz not null,
  expires_at timestamptz,
  is_active boolean default true
);

-- Send queue — 60-second delay + cancel window before delivery.
create table send_queue (
  id uuid primary key default gen_random_uuid(),
  message_content text not null,
  recipient_person_id uuid references people(id),
  company_id text references companies(id),
  channel text not null, -- chat | slack | email | whatsapp | telegram
  risk_tier text not null,
  confidence float,
  status text default 'queued', -- queued | sent | cancelled | edited
  queued_at timestamptz default now(),
  send_at timestamptz not null,
  sent_at timestamptz,
  cancelled_by text, -- michael | rica | system
  cancel_reason text
);

-- Dead man's switch.
create table dead_mans_switch (
  id uuid primary key default gen_random_uuid(),
  last_michael_interaction timestamptz default now(),
  threshold_hours int default 48,
  is_triggered boolean default false,
  triggered_at timestamptz,
  acknowledged_at timestamptz
);
insert into dead_mans_switch (last_michael_interaction) values (now());
