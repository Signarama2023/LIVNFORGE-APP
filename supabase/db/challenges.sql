-- Daily Forge / LIVN FORGE — 21-Day Challenge.
-- A fixed 21-day, tap-to-check-in challenge. One shared PUBLIC challenge anyone can
-- join, plus per-circle challenges only that circle's members can see/join.
--
-- TRUST MODEL: a public challenge is readable/joinable by any signed-in user. A
-- circle challenge is readable/joinable only by members of its circle (reuses
-- is_circle_member() from prayer_circles.sql — RUN THAT FILE FIRST).
--
-- Run in Supabase Dashboard -> SQL Editor, AFTER prayer_circles.sql.

create table if not exists public.challenges (
  id          uuid primary key default gen_random_uuid(),
  title       text default '21-Day Challenge',
  days        int  default 21,
  scope       text not null check (scope in ('public','circle')),
  circle_code text,                       -- null when scope='public'
  created_by  text,
  created_at  timestamptz default now()
);
-- At most one public challenge, and at most one challenge per circle.
create unique index if not exists challenges_one_public
  on public.challenges ((scope)) where scope = 'public';
create unique index if not exists challenges_one_per_circle
  on public.challenges (circle_code) where scope = 'circle';

create table if not exists public.challenge_participants (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  email        text not null,
  name         text,
  joined_at    timestamptz default now(),
  primary key (challenge_id, email)
);

-- One row per completed ITEM (workout/reading/gratitude/prayer) on a given plan
-- day. Pre-launch schema change: drop the old day-level table if it exists.
drop table if exists public.challenge_checkins cascade;
create table if not exists public.challenge_checkins (
  challenge_id uuid not null references public.challenges(id) on delete cascade,
  email        text not null,
  day_number   int  not null,                       -- 1..21
  item         text not null,                        -- 'workout' | 'reading' | 'gratitude' | 'prayer'
  points       int  default 0,
  created_at   timestamptz default now(),
  primary key (challenge_id, email, day_number, item)
);

-- ---------- Visibility helper ----------
-- SECURITY DEFINER so the lookup bypasses RLS (and avoids recursion). True when the
-- caller may see the challenge: it's public, or they belong to its circle.
create or replace function public.is_challenge_visible(p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.challenges c
    where c.id = p_id
      and (
        c.scope = 'public'
        or exists (
          select 1 from public.prayer_circle_members m
          where m.code = c.circle_code
            and lower(m.email) = lower(auth.jwt() ->> 'email')
        )
      )
  );
$$;
grant execute on function public.is_challenge_visible(uuid) to authenticated;

alter table public.challenges             enable row level security;
alter table public.challenge_participants enable row level security;
alter table public.challenge_checkins     enable row level security;

-- ---------- challenges ----------
drop policy if exists "ch read"   on public.challenges;
drop policy if exists "ch insert" on public.challenges;
-- Public challenges are visible to everyone signed in; circle challenges to members.
create policy "ch read" on public.challenges for select using (
  scope = 'public' or public.is_circle_member(circle_code)
);
-- Create only as yourself; circle challenges only for a circle you belong to.
create policy "ch insert" on public.challenges for insert with check (
  lower(created_by) = lower(auth.jwt() ->> 'email')
  and (scope = 'public' or public.is_circle_member(circle_code))
);

-- ---------- challenge_participants ----------
drop policy if exists "chp read"   on public.challenge_participants;
drop policy if exists "chp insert" on public.challenge_participants;
drop policy if exists "chp delete" on public.challenge_participants;
-- See the roster of any challenge you can see.
create policy "chp read" on public.challenge_participants for select using (
  public.is_challenge_visible(challenge_id)
);
-- Join only as yourself, and only a challenge you can see.
create policy "chp insert" on public.challenge_participants for insert with check (
  lower(email) = lower(auth.jwt() ->> 'email') and public.is_challenge_visible(challenge_id)
);
-- Leave: remove only your own row.
create policy "chp delete" on public.challenge_participants for delete using (
  lower(email) = lower(auth.jwt() ->> 'email')
);

-- ---------- challenge_checkins ----------
drop policy if exists "chc read"   on public.challenge_checkins;
drop policy if exists "chc insert" on public.challenge_checkins;
-- See check-ins for any challenge you can see (for progress / counts).
create policy "chc read" on public.challenge_checkins for select using (
  public.is_challenge_visible(challenge_id)
);
-- Check in only as yourself, only into a challenge you can see.
create policy "chc insert" on public.challenge_checkins for insert with check (
  lower(email) = lower(auth.jwt() ->> 'email') and public.is_challenge_visible(challenge_id)
);

-- ---------- Seed the one shared public challenge ----------
insert into public.challenges (title, days, scope, created_by)
select '21-Day Challenge', 21, 'public', 'system'
where not exists (select 1 from public.challenges where scope = 'public');
