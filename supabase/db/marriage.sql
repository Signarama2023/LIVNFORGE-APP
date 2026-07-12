-- Daily Forge / LIVN FORGE — Forge Your Marriage.
-- A covenant with room for one or two: the creator's forge starts immediately —
-- solo if they choose (b_email null) — and the spouse can be invited and join
-- at ANY time (committed_at marks when they accepted). While active, the 40-Day
-- Marriage Forge takes over the daily experience: each day the member checks
-- off the dare and may leave a note to their spouse (saved even before the
-- spouse joins).
--
-- PRIVACY MODEL: dare check-offs and notes-to-spouse are visible to BOTH
-- members. Private reflections are NOT here — they are saved as normal journal
-- entries (type 'marriage') in the user's own entries table, never shared.
--
-- TRUST MODEL: rows are readable/writable only by the two members (email match
-- against the JWT, case-insensitive — same pattern as prayer circles). Each
-- member can only write their OWN day rows.
--
-- Run in Supabase Dashboard -> SQL Editor (after subscriptions.sql).

create table if not exists public.marriages (
  id           uuid primary key default gen_random_uuid(),
  a_email      text not null,   -- inviter (lowercased by the app)
  b_email      text,            -- invited spouse (lowercased by the app; null = forging solo)
  a_name       text,
  b_name       text,
  status       text not null default 'pending' check (status in ('pending','active')),
  invited_at   timestamptz default now(),
  committed_at timestamptz,     -- when the invited spouse accepted
  start_date   date             -- Day 1 of the Marriage Forge (set on accept)
);

create index if not exists marriages_a_idx on public.marriages (lower(a_email));
create index if not exists marriages_b_idx on public.marriages (lower(b_email));

-- One row per member per completed forge day. The note_to_spouse is the shared
-- half of the day's writing; the private half lives in the user's journal.
create table if not exists public.marriage_days (
  marriage_id  uuid not null references public.marriages(id) on delete cascade,
  email        text not null,
  day_number   int  not null check (day_number between 1 and 40),
  dare_done    boolean not null default true,
  note_to_spouse text,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now(),
  primary key (marriage_id, email, day_number)
);

-- ---------- Membership helper ----------
-- SECURITY DEFINER so policies can ask "is the caller a member?" without
-- recursing into marriages' own RLS (same pattern as is_circle_member).
create or replace function public.is_marriage_member(p_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.marriages
    where id = p_id
      and lower(auth.jwt() ->> 'email') in (lower(a_email), lower(b_email))
  );
$$;
grant execute on function public.is_marriage_member(uuid) to authenticated;

-- ---------- Spouse rides free ----------
-- True when the caller's ACTIVE marriage partner has a live Stripe subscription
-- (trialing/active). One paid subscription unlocks both spouses. Note: partners
-- who subscribed through Apple in-app purchase are tracked in RevenueCat, not
-- this table — IAP spouse-sharing can be added later via a RevenueCat lookup.
create or replace function public.has_marriage_entitlement()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.marriages m
    join auth.users u
      on lower(u.email) in (lower(m.a_email), lower(m.b_email))
     and u.id <> auth.uid()
    join public.subscriptions s on s.user_id = u.id
    where m.status = 'active'
      and lower(auth.jwt() ->> 'email') in (lower(m.a_email), lower(m.b_email))
      and s.status in ('trialing','active')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;
grant execute on function public.has_marriage_entitlement() to authenticated;

-- ---------- Decline an invitation ----------
-- The invited spouse can't null their own b_email through the member UPDATE
-- policy (the new row would no longer include them, failing WITH CHECK), so
-- this SECURITY DEFINER function frees their slot — only before they've
-- joined, and only their own slot. The inviter's forge is untouched.
create or replace function public.marriage_decline(p_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.marriages
     set b_email = null, b_name = null, committed_at = null
   where id = p_id
     and committed_at is null
     and lower(b_email) = lower(auth.jwt() ->> 'email');
$$;
grant execute on function public.marriage_decline(uuid) to authenticated;

-- ---------- RLS: marriages ----------
alter table public.marriages enable row level security;

drop policy if exists "marriage member select" on public.marriages;
create policy "marriage member select" on public.marriages
  for select using (
    lower(auth.jwt() ->> 'email') in (lower(a_email), lower(b_email))
  );

-- Only the creator may insert, only as themselves. 'active' from day one — the
-- creator's forge doesn't wait on the spouse.
drop policy if exists "marriage inviter insert" on public.marriages;
create policy "marriage inviter insert" on public.marriages
  for insert with check (
    lower(a_email) = lower(auth.jwt() ->> 'email')
    and status in ('pending','active')
  );

-- Either member may update (the invited spouse accepts; either can update names).
drop policy if exists "marriage member update" on public.marriages;
create policy "marriage member update" on public.marriages
  for update
  using (lower(auth.jwt() ->> 'email') in (lower(a_email), lower(b_email)))
  with check (lower(auth.jwt() ->> 'email') in (lower(a_email), lower(b_email)));

-- Either member may end it (cancel an invite or dissolve the link).
drop policy if exists "marriage member delete" on public.marriages;
create policy "marriage member delete" on public.marriages
  for delete using (
    lower(auth.jwt() ->> 'email') in (lower(a_email), lower(b_email))
  );

-- ---------- RLS: marriage_days ----------
alter table public.marriage_days enable row level security;

-- Both spouses can read each other's check-offs and notes.
drop policy if exists "marriage days member select" on public.marriage_days;
create policy "marriage days member select" on public.marriage_days
  for select using (public.is_marriage_member(marriage_id));

-- Each member writes only their own rows.
drop policy if exists "marriage days own insert" on public.marriage_days;
create policy "marriage days own insert" on public.marriage_days
  for insert with check (
    public.is_marriage_member(marriage_id)
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

drop policy if exists "marriage days own update" on public.marriage_days;
create policy "marriage days own update" on public.marriage_days
  for update
  using (public.is_marriage_member(marriage_id) and lower(email) = lower(auth.jwt() ->> 'email'))
  with check (public.is_marriage_member(marriage_id) and lower(email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "marriage days own delete" on public.marriage_days;
create policy "marriage days own delete" on public.marriage_days
  for delete using (
    public.is_marriage_member(marriage_id) and lower(email) = lower(auth.jwt() ->> 'email')
  );
