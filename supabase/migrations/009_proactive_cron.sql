-- ─────────────────────────────────────────────────────────────────────────
-- 009_proactive_cron.sql — hourly proactive engine via pg_net → deployed route.
-- The CRON_SECRET is read from a database setting applied out-of-band (NEVER
-- committed):   alter database postgres set app.cron_secret = '<secret>';
-- ─────────────────────────────────────────────────────────────────────────

do $$
begin
  perform cron.unschedule('vb-proactive');
exception when others then null;
end $$;

select cron.schedule('vb-proactive', '0 * * * *', $job$
  select net.http_get(
    url := 'https://vortex-brain.vercel.app/api/cron/proactive',
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || coalesce(current_setting('app.cron_secret', true), '')
    ),
    timeout_milliseconds := 60000
  );
$job$);
