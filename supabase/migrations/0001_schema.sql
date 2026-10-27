-- 0001_schema.sql : core tables

create table public.sites (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name        text not null check (char_length(name) between 1 and 100),
  base_url    text not null check (base_url ~* '^https?://'),
  created_at  timestamptz not null default now()
);

create table public.endpoints (
  id                   uuid primary key default gen_random_uuid(),
  site_id              uuid not null references public.sites (id) on delete cascade,
  path                 text not null default '/' check (path like '/%'),
  method               text not null default 'GET' check (method in ('GET', 'HEAD')),
  interval_minutes     integer not null default 5 check (interval_minutes between 1 and 1440),
  timeout_seconds      integer not null default 10 check (timeout_seconds between 1 and 30),
  expected_status      integer not null default 200 check (expected_status between 100 and 599),
  keyword              text,                      -- optional: response body must contain this
  failure_threshold    integer not null default 2 check (failure_threshold between 1 and 10),
  is_active            boolean not null default true,

  -- state, written only by the checker (service role)
  current_status       text not null default 'unknown' check (current_status in ('unknown', 'up', 'down')),
  consecutive_failures integer not null default 0,
  last_checked_at      timestamptz,

  created_at           timestamptz not null default now(),
  unique (site_id, method, path)
);

create table public.check_results (
  id          bigint generated always as identity primary key,
  endpoint_id uuid not null references public.endpoints (id) on delete cascade,
  checked_at  timestamptz not null default now(),
  ok          boolean not null,
  status_code integer,
  response_ms integer,
  error       text
);

create table public.incidents (
  id          uuid primary key default gen_random_uuid(),
  endpoint_id uuid not null references public.endpoints (id) on delete cascade,
  started_at  timestamptz not null default now(),
  resolved_at timestamptz,
  last_error  text
);
