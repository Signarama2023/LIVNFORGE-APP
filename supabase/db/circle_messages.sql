-- Daily Forge / LIVN FORGE — Circle group chat.
-- A simple message thread scoped to a prayer circle. Reads and writes are
-- restricted to ACTUAL members of the circle (not just any signed-in user), so
-- circle conversations stay inside the circle. Email checks are case-insensitive.
--
-- Run order: run prayer_circles.sql FIRST — this file uses the is_circle_member()
-- helper defined there. Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.circle_messages (
  id         uuid primary key default gen_random_uuid(),
  code       text not null,
  email      text,
  name       text,
  body       text not null,
  created_at timestamptz default now()
);

create index if not exists circle_messages_code_created_idx
  on public.circle_messages (code, created_at);

alter table public.circle_messages enable row level security;

-- READ: only members of the circle may read its messages.
drop policy if exists "cm read" on public.circle_messages;
create policy "cm read" on public.circle_messages for select
  using (public.is_circle_member(code));

-- INSERT: a member may post, only as themselves.
drop policy if exists "cm insert" on public.circle_messages;
create policy "cm insert" on public.circle_messages for insert
  with check (
    lower(email) = lower(auth.jwt() ->> 'email')
    and public.is_circle_member(code)
  );

-- DELETE: authors can delete their own messages.
drop policy if exists "cm delete" on public.circle_messages;
create policy "cm delete" on public.circle_messages for delete
  using (lower(email) = lower(auth.jwt() ->> 'email'));
