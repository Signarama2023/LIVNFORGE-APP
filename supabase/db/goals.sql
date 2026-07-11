-- Daily Forge / LIVN FORGE — Goals.
-- Personal goals with an AI-generated plan. A goal has a timeframe:
--   weekly  -> 7 day-specific steps (one per date)
--   monthly -> 4 weekly milestones + small recurring daily actions
--   yearly  -> 12 monthly milestones + small recurring daily actions
-- The plan (milestones + daily actions) and the user's check-offs are stored
-- as JSONB on the row — goals are private, single-writer data, so row-level
-- JSONB updates are safe and keep the client code simple.
--
-- plan   = { "milestones":[{ "key","label","title","detail" }], "daily":[{ "id","title" }] }
-- checks = { "milestones": { "<key>": "<ISO date checked>" },
--            "daily": { "<YYYY-MM-DD>": ["<daily id>", ...] } }
--
-- TRUST MODEL: a goal is readable/writable ONLY by its owner (auth.uid()).
--
-- Run in Supabase Dashboard -> SQL Editor.

create table if not exists public.goals (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  email        text,
  title        text not null,
  why          text,
  timeframe    text not null check (timeframe in ('weekly','monthly','yearly')),
  start_date   date not null,
  target_date  date not null,
  plan         jsonb not null default '{}'::jsonb,
  checks       jsonb not null default '{}'::jsonb,
  status       text not null default 'active' check (status in ('active','completed','archived')),
  created_at   timestamptz default now(),
  completed_at timestamptz
);

create index if not exists goals_user_idx on public.goals (user_id, status);

alter table public.goals enable row level security;

drop policy if exists "goals owner select" on public.goals;
create policy "goals owner select" on public.goals
  for select using (auth.uid() = user_id);

drop policy if exists "goals owner insert" on public.goals;
create policy "goals owner insert" on public.goals
  for insert with check (auth.uid() = user_id);

drop policy if exists "goals owner update" on public.goals;
create policy "goals owner update" on public.goals
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "goals owner delete" on public.goals;
create policy "goals owner delete" on public.goals
  for delete using (auth.uid() = user_id);
