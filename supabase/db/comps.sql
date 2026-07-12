-- LIVN FORGE — lifetime / complimentary memberships, granted by email.
-- Replaces the hardcoded COMP_EMAILS list in index.html: the admin grants
-- access from inside the app, it works the moment the person signs up with
-- that email, and nothing is exposed in the page source. No Apple offer
-- codes, no redemption step, nothing to expire.
--
-- TRUST MODEL: the table has RLS with NO policies (unreadable/unwritable by
-- clients). Access flows only through SECURITY DEFINER functions: the
-- signed-in user can ask "am I comped?"; only the admin email can add,
-- remove, or list.
--
-- Run in Supabase Dashboard -> SQL Editor.

create table if not exists public.comp_members (
  email      text primary key,          -- lowercased
  note       text,                      -- e.g. 'lifetime — friend of Mark'
  added_by   text,
  created_at timestamptz default now()
);

alter table public.comp_members enable row level security;
-- Intentionally NO policies — service role and SECURITY DEFINER functions only.

-- Is the signed-in user comped?
create or replace function public.has_comp_access()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select exists (
    select 1 from public.comp_members
    where email = lower(auth.jwt() ->> 'email')
  );
$$;
grant execute on function public.has_comp_access() to authenticated;

-- Admin: grant lifetime access to an email.
create or replace function public.admin_add_comp(p_email text, p_note text default null)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(auth.jwt() ->> 'email') <> 'markbailey1@me.com' then
    raise exception 'Admin only.';
  end if;
  insert into public.comp_members (email, note, added_by)
  values (lower(trim(p_email)), p_note, lower(auth.jwt() ->> 'email'))
  on conflict (email) do update set note = coalesce(excluded.note, comp_members.note);
  return true;
end;
$$;
grant execute on function public.admin_add_comp(text, text) to authenticated;

-- Admin: revoke.
create or replace function public.admin_remove_comp(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(auth.jwt() ->> 'email') <> 'markbailey1@me.com' then
    raise exception 'Admin only.';
  end if;
  delete from public.comp_members where email = lower(trim(p_email));
  return true;
end;
$$;
grant execute on function public.admin_remove_comp(text) to authenticated;

-- Admin: list everyone comped.
create or replace function public.admin_list_comps()
returns table (email text, note text, created_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
begin
  if lower(auth.jwt() ->> 'email') <> 'markbailey1@me.com' then
    raise exception 'Admin only.';
  end if;
  return query select c.email, c.note, c.created_at from public.comp_members c order by c.created_at desc;
end;
$$;
grant execute on function public.admin_list_comps() to authenticated;

-- One-time: migrate the emails currently hardcoded in COMP_EMAILS (index.html)
-- so nothing breaks when the hardcoded list is eventually removed:
insert into public.comp_members (email, note, added_by) values
  ('amessier11@mac.com',      'migrated from COMP_EMAILS', 'markbailey1@me.com'),
  ('mjennings2@gmail.com',    'migrated from COMP_EMAILS', 'markbailey1@me.com'),
  ('crinnina1@gmail.com',     'migrated from COMP_EMAILS', 'markbailey1@me.com'),
  ('jordanbickner@gmail.com', 'migrated from COMP_EMAILS', 'markbailey1@me.com'),
  ('greysonbailey@icloud.com','migrated from COMP_EMAILS', 'markbailey1@me.com')
on conflict (email) do nothing;
