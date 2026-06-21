-- LIVN FORGE: user-generated content moderation (Apple Guideline 1.2).
-- Two tables:
--   content_reports — any signed-in user can flag a message or prayer request.
--                     Only the project owner reads these (via the dashboard).
--   user_blocks     — a user blocks another; the app hides the blocked user's
--                     messages and requests. Each user manages only their own.
-- Run this in Supabase Dashboard -> SQL Editor.

-- ---------- Reports ----------
create table if not exists public.content_reports (
  id            uuid primary key default gen_random_uuid(),
  reporter_email text not null,
  content_type  text not null,            -- 'message' | 'request'
  content_id    text not null,
  circle_code   text,
  author_email  text,
  reason        text,
  status        text not null default 'open',  -- 'open' | 'actioned' | 'dismissed'
  created_at    timestamptz not null default now()
);
alter table public.content_reports enable row level security;

-- A signed-in user may file a report as themselves; nobody reads via the client
-- (the owner reviews reports in the Supabase dashboard, which bypasses RLS).
drop policy if exists "reports insert own" on public.content_reports;
create policy "reports insert own" on public.content_reports for insert
  with check (lower(reporter_email) = lower(auth.jwt() ->> 'email'));

-- ---------- Blocks ----------
create table if not exists public.user_blocks (
  blocker_email text not null,
  blocked_email text not null,
  created_at    timestamptz not null default now(),
  primary key (blocker_email, blocked_email)
);
alter table public.user_blocks enable row level security;

drop policy if exists "blocks select own" on public.user_blocks;
create policy "blocks select own" on public.user_blocks for select
  using (lower(blocker_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "blocks insert own" on public.user_blocks;
create policy "blocks insert own" on public.user_blocks for insert
  with check (lower(blocker_email) = lower(auth.jwt() ->> 'email'));

drop policy if exists "blocks delete own" on public.user_blocks;
create policy "blocks delete own" on public.user_blocks for delete
  using (lower(blocker_email) = lower(auth.jwt() ->> 'email'));
