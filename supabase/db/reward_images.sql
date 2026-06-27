-- LIVN FORGE — owner-editable reward photos.
-- Lets the app owner upload/swap the photo for each reward tier from inside the
-- app. Photos live in the public "reward-photos" storage bucket; this table maps
-- each reward tier to its current photo URL. Anyone can READ (so the app shows
-- the right photo); only the owner can WRITE. Run in Supabase Dashboard -> SQL Editor.

-- ---------- table ----------
create table if not exists public.reward_images (
  tier       text primary key,         -- 'keychain' | 'shirt' | 'hat' ...
  image_url  text not null,
  updated_at timestamptz default now()
);
alter table public.reward_images enable row level security;

drop policy if exists "reward_images read"  on public.reward_images;
drop policy if exists "reward_images write" on public.reward_images;
drop policy if exists "reward_images upd"   on public.reward_images;
create policy "reward_images read"  on public.reward_images for select using (true);
create policy "reward_images write" on public.reward_images for insert
  with check (lower(auth.jwt() ->> 'email') = 'markbailey1@me.com');
create policy "reward_images upd"   on public.reward_images for update
  using      (lower(auth.jwt() ->> 'email') = 'markbailey1@me.com')
  with check (lower(auth.jwt() ->> 'email') = 'markbailey1@me.com');

-- ---------- public storage bucket for the photos ----------
insert into storage.buckets (id, name, public)
  values ('reward-photos', 'reward-photos', true)
  on conflict (id) do nothing;

-- Public read (so the photos display); only the owner may upload/replace/delete.
drop policy if exists "reward photos read"   on storage.objects;
drop policy if exists "reward photos write"  on storage.objects;
drop policy if exists "reward photos update" on storage.objects;
drop policy if exists "reward photos delete" on storage.objects;
create policy "reward photos read"   on storage.objects for select
  using (bucket_id = 'reward-photos');
create policy "reward photos write"  on storage.objects for insert
  with check (bucket_id = 'reward-photos' and lower(auth.jwt() ->> 'email') = 'markbailey1@me.com');
create policy "reward photos update" on storage.objects for update
  using (bucket_id = 'reward-photos' and lower(auth.jwt() ->> 'email') = 'markbailey1@me.com');
create policy "reward photos delete" on storage.objects for delete
  using (bucket_id = 'reward-photos' and lower(auth.jwt() ->> 'email') = 'markbailey1@me.com');
