-- Daily Forge — Prayer Circles: join a circle by code around a shared prayer
-- focus, mark "I prayed today," and post/pray-for prayer requests.
-- Code-based trust model (mirrors the groups/scores design): any signed-in
-- member can read; users may only write rows as themselves.
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.prayer_circles (
  code        text primary key,
  name        text,
  focus       text,
  created_by  text,
  created_at  timestamptz default now()
);
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

alter table public.prayer_circles          enable row level security;
alter table public.prayer_circle_members   enable row level security;
alter table public.prayer_requests         enable row level security;
alter table public.prayer_request_prayers  enable row level security;
alter table public.prayer_logs             enable row level security;

drop policy if exists "pc read"    on public.prayer_circles;
drop policy if exists "pc insert"  on public.prayer_circles;
drop policy if exists "pc update"  on public.prayer_circles;
create policy "pc read"   on public.prayer_circles for select using (auth.uid() is not null);
create policy "pc insert" on public.prayer_circles for insert with check (auth.uid() is not null);
create policy "pc update" on public.prayer_circles for update using ((auth.jwt() ->> 'email') = created_by);

drop policy if exists "pcm read"   on public.prayer_circle_members;
drop policy if exists "pcm insert" on public.prayer_circle_members;
drop policy if exists "pcm delete" on public.prayer_circle_members;
create policy "pcm read"   on public.prayer_circle_members for select using (auth.uid() is not null);
create policy "pcm insert" on public.prayer_circle_members for insert with check ((auth.jwt() ->> 'email') = email);
create policy "pcm delete" on public.prayer_circle_members for delete using ((auth.jwt() ->> 'email') = email);

drop policy if exists "pr read"   on public.prayer_requests;
drop policy if exists "pr insert" on public.prayer_requests;
drop policy if exists "pr delete" on public.prayer_requests;
create policy "pr read"   on public.prayer_requests for select using (auth.uid() is not null);
create policy "pr insert" on public.prayer_requests for insert with check ((auth.jwt() ->> 'email') = email);
create policy "pr delete" on public.prayer_requests for delete using ((auth.jwt() ->> 'email') = email);

drop policy if exists "prp read"   on public.prayer_request_prayers;
drop policy if exists "prp insert" on public.prayer_request_prayers;
drop policy if exists "prp delete" on public.prayer_request_prayers;
create policy "prp read"   on public.prayer_request_prayers for select using (auth.uid() is not null);
create policy "prp insert" on public.prayer_request_prayers for insert with check ((auth.jwt() ->> 'email') = email);
create policy "prp delete" on public.prayer_request_prayers for delete using ((auth.jwt() ->> 'email') = email);

drop policy if exists "plog read"   on public.prayer_logs;
drop policy if exists "plog insert" on public.prayer_logs;
create policy "plog read"   on public.prayer_logs for select using (auth.uid() is not null);
create policy "plog insert" on public.prayer_logs for insert with check ((auth.jwt() ->> 'email') = email);
