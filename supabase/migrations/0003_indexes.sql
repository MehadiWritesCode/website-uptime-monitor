-- 0003_indexes.sql

-- "which endpoints are due?" runs every minute
create index endpoints_due_idx
  on public.endpoints (last_checked_at)
  where is_active;

create index endpoints_site_idx on public.endpoints (site_id);

-- history per endpoint (charts, uptime %)
create index check_results_endpoint_time_idx
  on public.check_results (endpoint_id, checked_at desc);

-- retention cleanup (delete where checked_at < now() - interval '30 days')
create index check_results_checked_at_idx
  on public.check_results (checked_at);

create index incidents_endpoint_idx
  on public.incidents (endpoint_id, started_at desc);

-- at most one open incident per endpoint
create unique index incidents_one_open_per_endpoint
  on public.incidents (endpoint_id)
  where resolved_at is null;
