-- Daily Forge / LIVN FORGE — Prayer Circles: join a circle by code around a shared
-- prayer focus, mark "I prayed today," and post/pray-for prayer requests.
--
-- TRUST MODEL: code-based to JOIN, but member-scoped to READ. Knowing a circle's
-- code lets you join it; it does NOT let you read its prayer requests, roster, or
-- logs. Only actual members (rows in prayer_circle_members) can read a circle's
-- content. Email comparisons are case-insensitive everywhere.
--
-- Run order: run THIS file before circle_messages.sql (which uses the helper
-- functions defined here). Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.prayer_circles (
  code        text primary key,
  name        text,
  focus       text,
  type        text,
  created_by  text,
  created_at  timestamptz default now()
);
-- For databases created before `type` existed (the app reads/writes it).
alter table public.prayer_circles add column if not exists type text;

create table if not exists public.prayer_circle_members (
  code      text not null,
  email     text not null,
  name      text,
  joined_at timestamptz default now(),
  primary key (code, email)
);
create table if not exists public.prayer_requests (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  email      text,
  name       text,
  body       text not null,
  created_at timestamptz default now()
);
create table if not exists public.prayer_request_prayers (
  request_id uuid not null references public.prayer_requests(id) on delete cascade,
  email      text not null,
  created_at timestamptz default now(),
  primary key (request_id, email)
);
create table if not exists public.prayer_logs (
  code       text not null,
  email      text not null,
  day        date not null,
  created_at timestamptz default now(),
  primary key (code, email, day)
);

-- ---------- Membership helpers ----------
-- SECURITY DEFINER so the membership lookup inside a policy bypasses RLS on
-- prayer_circle_members — this is what avoids infinite recursion when that same
-- table's own SELECT policy needs to ask "is the caller a member?".
create or replace function public.is_circle_member(p_code text)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.prayer_circle_members
    where code = p_code
      and lower(email) = lower(auth.jwt() ->> 'email')
  );
$$;
grant execute on function public.is_circle_member(text) to authenticated;

-- True when the caller is a member of the circle that owns the given request.
create or replace function public.is_request_member(p_request_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1
    from public.prayer_requests r
    join public.prayer_circle_members m on m.code = r.code
    where r.id = p_request_id
      and lower(m.email) = lower(auth.jwt() ->> 'email')
  );
$$;
grant execute on function public.is_request_member(uuid) to authenticated;

alter table public.prayer_circles          enable row level security;
alter table public.prayer_circle_members   enable row level security;
alter table public.prayer_requests         enable row level security;
alter table public.prayer_request_prayers  enable row level security;
alter table public.prayer_logs             enable row level security;

-- ---------- prayer_circles ----------
-- READ stays open to any signed-in user so a non-member can look a circle up by
-- code in order to join it. NOTE: this exposes circle name/focus/type and the
-- creator's email to all authenticated users. To fully close that, restrict this
-- to is_circle_member(code) and add a SECURITY DEFINER "look up by code" RPC for
-- the pre-join check in joinCircle()/migrateGroupsToCircles().
drop policy if exists "pc read"    on public.prayer_circles;
drop policy if exists "pc insert"  on public.prayer_circles;
drop policy if exists "pc update"  on public.prayer_circles;
create policy "pc read"   on public.prayer_circles for select using (auth.uid() is not null);
-- Insert only as yourself: created_by must be the caller (stops creator spoofing).
create policy "pc insert" on public.prayer_circles for insert
  with check (lower(created_by) = lower(auth.jwt() ->> 'email'));
-- Only the creator may update, and may not hand the circle to someone else.
create policy "pc update" on public.prayer_circles for update
  using      (lower(created_by) = lower(auth.jwt() ->> 'email'))
  with check (lower(created_by) = lower(auth.jwt() ->> 'email'));

-- ---------- prayer_circle_members ----------
drop policy if exists "pcm read"   on public.prayer_circle_members;
drop policy if exists "pcm insert" on public.prayer_circle_members;
drop policy if exists "pcm delete" on public.prayer_circle_members;
-- Only members of a circle can see its roster.
create policy "pcm read"   on public.prayer_circle_members for select using (public.is_circle_member(code));
-- You may add / remove only your own membership row.
create policy "pcm insert" on public.prayer_circle_members for insert with check (lower(email) = lower(auth.jwt() ->> 'email'));
create policy "pcm delete" on public.prayer_circle_members for delete using  (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------- prayer_requests ----------
drop policy if exists "pr read"   on public.prayer_requests;
drop policy if exists "pr insert" on public.prayer_requests;
drop policy if exists "pr delete" on public.prayer_requests;
-- Only members can read a circle's requests.
create policy "pr read"   on public.prayer_requests for select using (public.is_circle_member(code));
-- Post only as yourself, and only into a circle you belong to.
create policy "pr insert" on public.prayer_requests for insert
  with check (lower(email) = lower(auth.jwt() ->> 'email') and public.is_circle_member(code));
create policy "pr delete" on public.prayer_requests for delete using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------- prayer_request_prayers ----------
drop policy if exists "prp read"   on public.prayer_request_prayers;
drop policy if exists "prp insert" on public.prayer_request_prayers;
drop policy if exists "prp delete" on public.prayer_request_prayers;
-- Visible to / writable by members of the circle that owns the parent request.
create policy "prp read"   on public.prayer_request_prayers for select using (public.is_request_member(request_id));
create policy "prp insert" on public.prayer_request_prayers for insert
  with check (lower(email) = lower(auth.jwt() ->> 'email') and public.is_request_member(request_id));
create policy "prp delete" on public.prayer_request_prayers for delete using (lower(email) = lower(auth.jwt() ->> 'email'));

-- ---------- prayer_logs ----------
drop policy if exists "plog read"   on public.prayer_logs;
drop policy if exists "plog insert" on public.prayer_logs;
-- Only members can read the log, and you log only yourself into your own circles.
create policy "plog read"   on public.prayer_logs for select using (public.is_circle_member(code));
create policy "plog insert" on public.prayer_logs for insert
  with check (lower(email) = lower(auth.jwt() ->> 'email') and public.is_circle_member(code));
