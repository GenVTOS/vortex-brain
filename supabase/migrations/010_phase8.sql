-- ─────────────────────────────────────────────────────────────────────────
-- 010_phase8.sql — system config (transparency mode) + web-push subscriptions.
-- ─────────────────────────────────────────────────────────────────────────

create table system_config (
  id int primary key default 1,
  transparency_mode boolean default false,
  updated_at timestamptz default now(),
  constraint single_row check (id = 1)
);
insert into system_config (id) values (1) on conflict do nothing;

alter table system_config enable row level security;
create policy sysconfig_owner on system_config for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');

create table push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz default now()
);
alter table push_subscriptions enable row level security;
create policy push_owner on push_subscriptions for all
  using (public.vb_role() = 'owner') with check (public.vb_role() = 'owner');
