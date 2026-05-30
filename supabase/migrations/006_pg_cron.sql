-- ─────────────────────────────────────────────────────────────────────────
-- 006_pg_cron.sql — scheduled jobs INSIDE Postgres (Hobby-plan independent).
-- Vercel Hobby cron is daily-only/2-max, so the per-minute send-queue tick lives
-- here instead. HTTP-based jobs (proactive engine, Claude calls) get scheduled in
-- Phase 3 via pg_net once the deployed URL + CRON_SECRET exist.
-- ─────────────────────────────────────────────────────────────────────────

create extension if not exists pg_cron;
create extension if not exists pg_net;

-- Send-queue tick: deliver internal messages whose 60s cancel window has elapsed.
-- Internal "delivery" = a status flip the chat UI reads. External-channel delivery
-- (WhatsApp/Slack/etc.) is handled by app logic in a later phase.
create or replace function public.tick_send_queue()
returns void
language sql
security definer
set search_path = public
as $$
  update send_queue
     set status = 'sent', sent_at = now()
   where status = 'queued'
     and send_at <= now()
     and channel = 'chat';
$$;

-- Dead man's switch tick: trip the flag if Michael has been silent past threshold.
-- The app reads is_triggered and zeroes all auto-execution; alerting is app-side.
create or replace function public.tick_dead_man()
returns void
language sql
security definer
set search_path = public
as $$
  update dead_mans_switch
     set is_triggered = true, triggered_at = now()
   where is_triggered = false
     and last_michael_interaction < now() - make_interval(hours => threshold_hours);
$$;

-- (Re)schedule idempotently.
do $$
begin
  perform cron.unschedule('vb-send-queue');
exception when others then null;
end $$;
do $$
begin
  perform cron.unschedule('vb-dead-man');
exception when others then null;
end $$;

select cron.schedule('vb-send-queue', '* * * * *', $$ select public.tick_send_queue(); $$);
select cron.schedule('vb-dead-man', '0 */6 * * *', $$ select public.tick_dead_man(); $$);
