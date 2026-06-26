-- LIVN FORGE — delete an entire circle (creator only).
-- A circle's data lives across several tables keyed by `code` (no FK cascade),
-- so deletion is done in one SECURITY DEFINER function that first verifies the
-- caller is the circle's creator, then removes all related rows. This keeps it
-- secure (only the creator can delete) without opening broad delete RLS.
-- Run this in Supabase Dashboard -> SQL Editor.

create or replace function public.delete_circle(p_code text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(auth.jwt() ->> 'email');
begin
  -- The circle's creator may delete it (case-insensitive email match), and so
  -- may the app admin — a safety valve for orphaned circles whose created_by no
  -- longer matches anyone (e.g. left over from earlier data migrations).
  if v_email is null
     or ( v_email <> 'markbailey1@me.com'
          and not exists (
            select 1 from public.prayer_circles
            where code = p_code and lower(created_by) = v_email
          ) ) then
    raise exception 'Only the circle creator can delete this circle';
  end if;

  delete from public.prayer_request_prayers
    where request_id in (select id from public.prayer_requests where code = p_code);
  delete from public.prayer_requests        where code = p_code;
  delete from public.prayer_logs            where code = p_code;
  delete from public.circle_messages        where code = p_code;
  delete from public.prayer_circle_members  where code = p_code;
  delete from public.scores                 where group_code = p_code;
  delete from public.prayer_circles         where code = p_code;

  -- NOTE: we do NOT delete from storage.objects here. Supabase forbids direct
  -- deletes on storage tables ("Use the Storage API instead"), and doing so threw
  -- and rolled back the whole deletion. The client already removes this circle's
  -- files via the Storage API before calling delete_circle, and the attachment
  -- references (columns on circle_messages) are gone with the rows above.
end;
$$;

grant execute on function public.delete_circle(text) to authenticated;
