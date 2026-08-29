-- LIVN FORGE — circle invitations.
-- The circle creator (or any member) invites someone by email. The invited
-- person gets a popup in the app asking to accept; on accept they add themselves
-- to prayer_circle_members (self-insert, same as a code join) and the invite is
-- marked accepted.
--
-- TRUST MODEL: the invite row is readable/updatable by the two parties (invitee
-- and inviter), matched case-insensitively on their JWT email. Joining the
-- circle itself still goes through the existing prayer_circle_members self-insert
-- (the invitee adds their own row).
--
-- Run in Supabase Dashboard -> SQL Editor.

create table if not exists public.circle_invites (
  id               uuid primary key default gen_random_uuid(),
  code             text not null,           -- the circle code
  circle_name      text,
  invited_email    text not null,           -- lowercased by the app
  invited_by_email text not null,
  invited_by_name  text,
  status           text not null default 'pending' check (status in ('pending','accepted','declined')),
  created_at       timestamptz default now()
);

create index if not exists circle_invites_invitee_idx
  on public.circle_invites (lower(invited_email), status);
create index if not exists circle_invites_code_idx on public.circle_invites (code);

alter table public.circle_invites enable row level security;

-- The inviter creates invites they are sending (as themselves).
drop policy if exists "circle invite insert" on public.circle_invites;
create policy "circle invite insert" on public.circle_invites
  for insert with check (lower(invited_by_email) = lower(auth.jwt() ->> 'email'));

-- Both parties can read the invite (invitee to act on it; inviter to track it).
drop policy if exists "circle invite select" on public.circle_invites;
create policy "circle invite select" on public.circle_invites
  for select using (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or lower(invited_by_email) = lower(auth.jwt() ->> 'email')
  );

-- Invitee accepts/declines; inviter may also update (e.g. cancel).
drop policy if exists "circle invite update" on public.circle_invites;
create policy "circle invite update" on public.circle_invites
  for update using (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or lower(invited_by_email) = lower(auth.jwt() ->> 'email')
  ) with check (
    lower(invited_email) = lower(auth.jwt() ->> 'email')
    or lower(invited_by_email) = lower(auth.jwt() ->> 'email')
  );

-- The inviter may delete an invite they sent.
drop policy if exists "circle invite delete" on public.circle_invites;
create policy "circle invite delete" on public.circle_invites
  for delete using (lower(invited_by_email) = lower(auth.jwt() ->> 'email'));
