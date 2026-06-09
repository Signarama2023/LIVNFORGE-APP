-- LIVN FORGE — push notifications: device tokens + per-user preferences.
-- Run this in Supabase Dashboard -> SQL Editor.

-- One row per device. Keyed by token (a device re-registers with the same token).
create table if not exists public.device_tokens (
  token       text primary key,
  user_id     uuid references auth.users(id) on delete cascade,
  email       text,
  platform    text not null default 'ios',
  updated_at  timestamptz not null default now()
);
alter table public.device_tokens enable row level security;
-- A signed-in user manages only their own device rows.
drop policy if exists "dt_select" on public.device_tokens;
drop policy if exists "dt_insert" on public.device_tokens;
drop policy if exists "dt_update" on public.device_tokens;
drop policy if exists "dt_delete" on public.device_tokens;
create policy "dt_select" on public.device_tokens for select using (auth.uid() = user_id);
create policy "dt_insert" on public.device_tokens for insert with check (auth.uid() = user_id);
create policy "dt_update" on public.device_tokens for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "dt_delete" on public.device_tokens for delete using (auth.uid() = user_id);
create index if not exists device_tokens_email_idx on public.device_tokens (email);

-- Per-user notification preferences (keyed by email, since circle membership is by email).
create table if not exists public.notification_prefs (
  email           text primary key,
  circle_messages boolean not null default true,
  prayer_requests boolean not null default true,
  member_joins    boolean not null default true,
  updated_at      timestamptz not null default now()
);
alter table public.notification_prefs enable row level security;
drop policy if exists "np_select" on public.notification_prefs;
drop policy if exists "np_upsert" on public.notification_prefs;
drop policy if exists "np_update" on public.notification_prefs;
create policy "np_select" on public.notification_prefs for select using ((auth.jwt() ->> 'email') = email);
create policy "np_upsert" on public.notification_prefs for insert with check ((auth.jwt() ->> 'email') = email);
create policy "np_update" on public.notification_prefs for update using ((auth.jwt() ->> 'email') = email) with check ((auth.jwt() ->> 'email') = email);
