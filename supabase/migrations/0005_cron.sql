-- 0004_cron.sql
-- Calls the Next.js route every minute and cleans up old history.
--
-- PREREQUISITE: store the two secrets in Supabase Vault ONCE, from the
-- SQL Editor (never put them in this file / git):
--   select vault.create_secret('https://YOUR-APP.vercel.app', 'app_url');
--   select vault.create_secret('YOUR_CRON_SECRET',            'cron_secret');

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net  with schema extensions;

-- remove old jobs with the same names so this migration can be re-run safely
select cron.unschedule(jobname)
from cron.job
where jobname in ('uptime-check', 'purge-old-check-results');

-- 1) every minute: ask the app to run the due checks
select cron.schedule(
  'uptime-check',
  '* * * * *',
  $$
  select net.http_post(
    url     := (select decrypted_secret from vault.decrypted_secrets where name = 'app_url') || '/api/cron/check',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    body    := '{}'::jsonb,
    timeout_milliseconds := 55000
  );
  $$
);

-- 2) daily at 03:00 UTC: keep 30 days of check history
select cron.schedule(
  'purge-old-check-results',
  '0 3 * * *',
  $$ delete from public.check_results where checked_at < now() - interval '30 days'; $$
);
