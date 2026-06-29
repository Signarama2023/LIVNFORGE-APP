-- LIVN FORGE — circle photos.
-- Each circle can have a photo (set by its creator). Stored in a public
-- "circle-photos" bucket; the URL is saved on the circle row. Members of a circle
-- can upload to that circle's folder; only the creator can set it on the circle
-- (existing "pc update" policy). Run in Supabase Dashboard -> SQL Editor.

alter table public.prayer_circles add column if not exists image_url text;

insert into storage.buckets (id, name, public)
  values ('circle-photos', 'circle-photos', true)
  on conflict (id) do nothing;

drop policy if exists "circle photos read"   on storage.objects;
drop policy if exists "circle photos write"  on storage.objects;
drop policy if exists "circle photos update" on storage.objects;
drop policy if exists "circle photos delete" on storage.objects;

create policy "circle photos read" on storage.objects for select
  using (bucket_id = 'circle-photos');
create policy "circle photos write" on storage.objects for insert
  with check (bucket_id = 'circle-photos' and (storage.foldername(name))[1] in (
    select code from public.prayer_circle_members where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "circle photos update" on storage.objects for update
  using (bucket_id = 'circle-photos' and (storage.foldername(name))[1] in (
    select code from public.prayer_circle_members where lower(email) = lower(auth.jwt() ->> 'email')));
create policy "circle photos delete" on storage.objects for delete
  using (bucket_id = 'circle-photos' and (storage.foldername(name))[1] in (
    select code from public.prayer_circle_members where lower(email) = lower(auth.jwt() ->> 'email')));
