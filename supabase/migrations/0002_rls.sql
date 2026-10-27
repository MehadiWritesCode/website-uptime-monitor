-- 0002_rls.sql : Row Level Security + explicit grants

alter table public.sites         enable row level security;
alter table public.endpoints     enable row level security;
alter table public.check_results enable row level security;
alter table public.incidents     enable row level security;

-- sites: owner has full access
create policy "sites: owner full access" on public.sites
  for all to authenticated
  using      (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- endpoints: allowed when the parent site belongs to the user
create policy "endpoints: owner full access" on public.endpoints
  for all to authenticated
  using (exists (
    select 1 from public.sites s
    where s.id = endpoints.site_id and s.user_id = (select auth.uid())
  ))
  with check (exists (
    select 1 from public.sites s
    where s.id = endpoints.site_id and s.user_id = (select auth.uid())
  ));

-- check_results / incidents: owner can read; only the service role writes
create policy "check_results: owner read" on public.check_results
  for select to authenticated
  using (exists (
    select 1
    from public.endpoints e
    join public.sites s on s.id = e.site_id
    where e.id = check_results.endpoint_id and s.user_id = (select auth.uid())
  ));

create policy "incidents: owner read" on public.incidents
  for select to authenticated
  using (exists (
    select 1
    from public.endpoints e
    join public.sites s on s.id = e.site_id
    where e.id = incidents.endpoint_id and s.user_id = (select auth.uid())
  ));

-- grants (RLS is evaluated only after table grants)
grant select, insert, update, delete on public.sites to authenticated;

grant select, insert, delete on public.endpoints to authenticated;
-- users may edit settings only, never the checker-owned state columns
grant update (path, method, interval_minutes, timeout_seconds, expected_status,
              keyword, failure_threshold, is_active)
  on public.endpoints to authenticated;

grant select on public.check_results to authenticated;
grant select on public.incidents     to authenticated;

-- the checker (secret key -> service_role)
grant all on public.sites, public.endpoints, public.check_results, public.incidents to service_role;
grant usage, select on all sequences in schema public to service_role;
