-- LIVN FORGE: photos & files in circle chat.
-- Private bucket; only members of a circle can upload to / read its folder.
-- Files live at  circle-attachments/<CIRCLE_CODE>/<uuid>.<ext>
-- The app reads them via short-lived signed URLs.
-- Run this in Supabase Dashboard -> SQL Editor.

-- Private storage bucket (10 MB per-file limit is enforced client-side too).
insert into storage.buckets (id, name, public)
  values ('circle-attachments', 'circle-attachments', false)
  on conflict (id) do nothing;

-- Attachment columns on the chat message row.
alter table public.circle_messages add column if not exists attachment_path text;
alter table public.circle_messages add column if not exists attachment_type text;
alter table public.circle_messages add column if not exists attachment_name text;

-- Storage access: a member of the circle (first folder segment = circle code)
-- may upload to and read that circle's folder; uploaders can delete their own.
drop policy if exists "circle attach read" on storage.objects;
create policy "circle attach read" on storage.objects for select
  using (
    bucket_id = 'circle-attachments'
    and (storage.foldername(name))[1] in (
      select code from public.prayer_circle_members
      where email = (auth.jwt() ->> 'email')
    )
  );

drop policy if exists "circle attach insert" on storage.objects;
create policy "circle attach insert" on storage.objects for insert
  with check (
    bucket_id = 'circle-attachments'
    and (storage.foldername(name))[1] in (
      select code from public.prayer_circle_members
      where email = (auth.jwt() ->> 'email')
    )
  );

drop policy if exists "circle attach delete" on storage.objects;
create policy "circle attach delete" on storage.objects for delete
  using (bucket_id = 'circle-attachments' and owner = auth.uid());
