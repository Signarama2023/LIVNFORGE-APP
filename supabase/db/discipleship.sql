-- LIVN FORGE — opt-in Level 1 discipleship progress ("Rooted and Ready").
--
-- NOT APPLIED by the app change that added this file. Do not run it until you
-- intend to store course progress in this project. It seeds nothing and does
-- not enroll existing members.
--
-- What it stores, per signed-in user, only after that person opts in:
--   steps        non-sensitive check-ins (read / reflect / pray / practice)
--   reflections  optional private notes. There is no group, leader, or
--                leaderboard policy on this table. Do not add one.
--
-- TRUST MODEL: owner-only, auth.uid() = user_id, same shape as goals/entries.
-- The account-deletion function also deletes this table by user_id. The foreign
-- key cascades when the auth user is removed.
--
-- Run in Supabase Dashboard -> SQL Editor, after reviewing the policies.
-- The app keeps working without this table: check-ins stay on the device, and
-- reflection text is encrypted locally or not stored. It is never written into
-- journal entries, circles, scores, or the AI review.

create table if not exists public.discipleship_progress (
  user_id      uuid primary key references auth.users(id) on delete cascade,
  email        text,
  program_id   text not null default 'rooted-l1',
  opted_in     boolean not null default false,
  steps        jsonb not null default '{}'::jsonb,
  reflections  jsonb not null default '{}'::jsonb,
  updated_at   timestamptz not null default now(),
  constraint discipleship_progress_program_check check (program_id = 'rooted-l1'),
  constraint discipleship_steps_object check (jsonb_typeof(steps) = 'object'),
  constraint discipleship_reflections_object check (jsonb_typeof(reflections) = 'object')
);

alter table public.discipleship_progress enable row level security;
alter table public.discipleship_progress force row level security;

revoke all on table public.discipleship_progress from public, anon;
grant select, insert, update, delete on table public.discipleship_progress to authenticated;

drop policy if exists "discipleship owner select" on public.discipleship_progress;
create policy "discipleship owner select" on public.discipleship_progress
  for select using (auth.uid() = user_id);

drop policy if exists "discipleship owner insert" on public.discipleship_progress;
create policy "discipleship owner insert" on public.discipleship_progress
  for insert with check (
    auth.uid() = user_id
    and (email is null or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

drop policy if exists "discipleship owner update" on public.discipleship_progress;
create policy "discipleship owner update" on public.discipleship_progress
  for update
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and (email is null or lower(email) = lower(coalesce(auth.jwt() ->> 'email', '')))
  );

drop policy if exists "discipleship owner delete" on public.discipleship_progress;
create policy "discipleship owner delete" on public.discipleship_progress
  for delete using (auth.uid() = user_id);
