-- LIVN FORGE — devotional reading history.
-- One row per distinct passage a user has read in the Devotional. Loading a
-- passage upserts (user_id, reference) and bumps read_at, so the table stays a
-- clean "what I've read, and when last" list — newest first is the reading
-- history; the top row is "last read". Syncs across the user's devices.
--
-- TRUST MODEL: owner-only (auth.uid()), same as goals/entries.
--
-- Run in Supabase Dashboard -> SQL Editor.

create table if not exists public.devotional_reads (
  user_id     uuid not null references auth.users(id) on delete cascade,
  reference   text not null,
  translation text,
  email       text,
  read_at     timestamptz not null default now(),
  primary key (user_id, reference)
);

create index if not exists devotional_reads_recent_idx
  on public.devotional_reads (user_id, read_at desc);

alter table public.devotional_reads enable row level security;

drop policy if exists "devo reads owner select" on public.devotional_reads;
create policy "devo reads owner select" on public.devotional_reads
  for select using (auth.uid() = user_id);

drop policy if exists "devo reads owner insert" on public.devotional_reads;
create policy "devo reads owner insert" on public.devotional_reads
  for insert with check (auth.uid() = user_id);

drop policy if exists "devo reads owner update" on public.devotional_reads;
create policy "devo reads owner update" on public.devotional_reads
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "devo reads owner delete" on public.devotional_reads;
create policy "devo reads owner delete" on public.devotional_reads
  for delete using (auth.uid() = user_id);
