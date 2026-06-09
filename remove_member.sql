-- LIVN FORGE: circle creator can remove a member.
-- Security-definer RPC so only the circle's creator may remove someone; it
-- cleans up that member's membership and leaderboard row for the circle.
-- Run this in Supabase Dashboard -> SQL Editor.

create or replace function public.remove_member(p_code text, p_email text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.prayer_circles c
    where c.code = p_code
      and lower(c.created_by) = lower(auth.jwt() ->> 'email')
  ) then
    raise exception 'Only the circle creator can remove members';
  end if;

  delete from public.prayer_circle_members
    where code = p_code and lower(email) = lower(p_email);
  delete from public.scores
    where group_code = p_code and lower(email) = lower(p_email);
end;
$$;
