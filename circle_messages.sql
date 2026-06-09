-- Daily Forge / LIVN FORGE — Circle group chat.
-- A simple message thread scoped to a prayer circle. Unlike prayer_requests,
-- reads are restricted to ACTUAL members of the circle (not just any signed-in
-- user), so circle conversations stay inside the circle.
-- Run this in Supabase Dashboard -> SQL Editor.

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
  using (
    exists (
      select 1 from public.prayer_circle_members m
      where m.code = circle_messages.code
        and m.email = (auth.jwt() ->> 'email')
    )
  );

-- INSERT: a member may post, only as themselves.
drop policy if exists "cm insert" on public.circle_messages;
create policy "cm insert" on public.circle_messages for insert
  with check (
    (auth.jwt() ->> 'email') = email
    and exists (
      select 1 from public.prayer_circle_members m
      where m.code = circle_messages.code
        and m.email = (auth.jwt() ->> 'email')
    )
  );

-- DELETE: authors can delete their own messages.
drop policy if exists "cm delete" on public.circle_messages;
create policy "cm delete" on public.circle_messages for delete
  using ((auth.jwt() ->> 'email') = email);
