-- 0004_stats.sql : read-only stats helpers.
-- security invoker => the caller's RLS applies, users only see their own data.

create or replace function public.endpoint_uptime(p_endpoint_id uuid)
returns table (
  window_label text,
  total        bigint,
  ok_count     bigint,
  uptime_pct   numeric,
  avg_ms       numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    w.label,
    count(r.id),
    count(r.id) filter (where r.ok),
    round(100.0 * count(r.id) filter (where r.ok) / nullif(count(r.id), 0), 2),
    round(avg(r.response_ms) filter (where r.ok))
  from (values
    ('24h', interval '24 hours'),
    ('7d',  interval '7 days'),
    ('30d', interval '30 days')
  ) as w(label, span)
  left join public.check_results r
    on r.endpoint_id = p_endpoint_id
   and r.checked_at >= now() - w.span
  group by w.label, w.span
  order by w.span;
$$;

-- response time grouped into buckets (keeps chart payloads small)
create or replace function public.endpoint_response_series(
  p_endpoint_id    uuid,
  p_hours          integer default 24,
  p_bucket_minutes integer default 15
)
returns table (
  bucket   timestamptz,
  avg_ms   numeric,
  max_ms   integer,
  checks   bigint,
  failures bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    date_bin(make_interval(mins => p_bucket_minutes), r.checked_at, timestamptz '2000-01-01 00:00:00+00'),
    round(avg(r.response_ms) filter (where r.ok)),
    max(r.response_ms),
    count(*),
    count(*) filter (where not r.ok)
  from public.check_results r
  where r.endpoint_id = p_endpoint_id
    and r.checked_at >= now() - make_interval(hours => p_hours)
  group by 1
  order by 1;
$$;

revoke execute on function public.endpoint_uptime(uuid) from public, anon;
revoke execute on function public.endpoint_response_series(uuid, integer, integer) from public, anon;
grant  execute on function public.endpoint_uptime(uuid) to authenticated, service_role;
grant  execute on function public.endpoint_response_series(uuid, integer, integer) to authenticated, service_role;
