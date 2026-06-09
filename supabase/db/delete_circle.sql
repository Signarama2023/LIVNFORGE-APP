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
begin
  -- Only the circle's creator may delete it.
  if (auth.jwt() ->> 'email') is null
     or not exists (
       select 1 from public.prayer_circles
       where code = p_code and created_by = (auth.jwt() ->> 'email')
     ) then
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
end;
$$;

grant execute on function public.delete_circle(text) to authenticated;
