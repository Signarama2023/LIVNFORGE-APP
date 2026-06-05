-- Daily Forge — merch reward redemptions (loyalty ladder).
-- A member who reaches a points tier can claim merch; the row records the
-- claim + shipping info so the owner can fulfill it.
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.redemptions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users(id) on delete cascade,
  email           text,
  tier            text not null,          -- coin | shirt | hat
  item_name       text not null,
  points_at_claim integer not null,       -- lifetime points when claimed (audit)
  threshold       integer not null,       -- tier threshold at claim time
  size            text,                   -- shirt/hat size; null for coin
  ship_name       text,
  ship_address1   text,
  ship_address2   text,
  ship_city       text,
  ship_state      text,
  ship_zip        text,
  ship_country    text default 'USA',
  status          text not null default 'pending',  -- pending | fulfilled
  created_at      timestamptz default now()
);

-- One claim per tier per member (prevents double-claiming a level).
create unique index if not exists redemptions_user_tier_unique
  on public.redemptions (user_id, tier);

alter table public.redemptions enable row level security;

-- Members can read their own claims (to show "claimed" state).
drop policy if exists "read own redemptions" on public.redemptions;
create policy "read own redemptions"
  on public.redemptions for select
  using (auth.uid() = user_id or (auth.jwt() ->> 'email') = 'markbailey1@me.com');

-- Members can create their own claims.
drop policy if exists "insert own redemptions" on public.redemptions;
create policy "insert own redemptions"
  on public.redemptions for insert
  with check (auth.uid() = user_id);

-- Owner can update status (mark fulfilled). Members cannot edit claims.
drop policy if exists "owner update redemptions" on public.redemptions;
create policy "owner update redemptions"
  on public.redemptions for update
  using ((auth.jwt() ->> 'email') = 'markbailey1@me.com');
