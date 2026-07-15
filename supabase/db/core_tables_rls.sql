-- LIVN FORGE — row-level security for the original core tables.
--
-- Why this file exists:
-- The app's entries and scores tables predate the other source-controlled
-- migrations. Their security must be reproducible and reviewable alongside the
-- application. Run this in Supabase Dashboard -> SQL Editor after confirming
-- the existing column names match the app.

-- ---------------------------------------------------------------------------
-- Private journal entries: only the authenticated owner may read or mutate.
-- ---------------------------------------------------------------------------
alter table public.entries enable row level security;

drop policy if exists "entries owner select" on public.entries;
drop policy if exists "entries owner insert" on public.entries;
drop policy if exists "entries owner update" on public.entries;
drop policy if exists "entries owner delete" on public.entries;

create policy "entries owner select" on public.entries
  for select using (auth.uid() = user_id);

create policy "entries owner insert" on public.entries
  for insert with check (
    auth.uid() = user_id
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

create policy "entries owner update" on public.entries
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

create policy "entries owner delete" on public.entries
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Leaderboards: users can write only their own score and can read a board only
-- after joining it (represented by their own row in that group). The helper is
-- SECURITY DEFINER to avoid recursive RLS when the scores SELECT policy checks
-- membership in the scores table itself.
-- ---------------------------------------------------------------------------
create or replace function public.is_score_group_member(p_group_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.scores
    where group_code = p_group_code
      and lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;

revoke all on function public.is_score_group_member(text) from public, anon;
grant execute on function public.is_score_group_member(text) to authenticated;

alter table public.scores enable row level security;

drop policy if exists "scores member select" on public.scores;
drop policy if exists "scores own insert" on public.scores;
drop policy if exists "scores own update" on public.scores;
drop policy if exists "scores own delete" on public.scores;

create policy "scores member select" on public.scores
  for select using (public.is_score_group_member(group_code));

create policy "scores own insert" on public.scores
  for insert with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "scores own update" on public.scores
  for update
  using (lower(email) = lower(auth.jwt() ->> 'email'))
  with check (lower(email) = lower(auth.jwt() ->> 'email'));

create policy "scores own delete" on public.scores
  for delete using (lower(email) = lower(auth.jwt() ->> 'email'));
