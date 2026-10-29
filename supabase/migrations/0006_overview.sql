-- 0006_overview.sql : data for the Sites overview (all endpoints in 2 calls).
-- security invoker => RLS applies, each user only sees their own data.

-- 24h uptime + avg response for every endpoint
create or replace function public.endpoints_overview()
returns table (
  endpoint_id uuid,
  checks      bigint,
  ok_count    bigint,
  uptime_pct  numeric,
  avg_ms      numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    r.endpoint_id,
    count(*),
    count(*) filter (where r.ok),
    round(100.0 * count(*) filter (where r.ok) / nullif(count(*), 0), 2),
    round(avg(r.response_ms) filter (where r.ok))
  from public.check_results r
  where r.checked_at >= now() - interval '24 hours'
  group by r.endpoint_id;
$$;

-- the latest N results per endpoint (for the status bars)
create or replace function public.endpoints_recent_results(p_limit integer default 30)
returns table (
  endpoint_id uuid,
  ok          boolean,
  response_ms integer,
  checked_at  timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select e.id, r.ok, r.response_ms, r.checked_at
  from public.endpoints e
  cross join lateral (
    select c.ok, c.response_ms, c.checked_at
    from public.check_results c
    where c.endpoint_id = e.id
    order by c.checked_at desc
    limit p_limit
  ) r
  order by e.id, r.checked_at desc;
$$;

revoke execute on function public.endpoints_overview() from public, anon;
revoke execute on function public.endpoints_recent_results(integer) from public, anon;
grant  execute on function public.endpoints_overview() to authenticated, service_role;
grant  execute on function public.endpoints_recent_results(integer) to authenticated, service_role;
