-- LIVN FORGE — "gift a free year" code pool.
-- Holds App Store codes that the app hands out (admin now; annual members later).
-- Codes are NEVER readable by the client — only the service-role claim-gift-code
-- edge function touches this table. Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.gift_codes (
  code          text primary key,
  redeem_url    text,
  claimed_by    uuid references auth.users(id) on delete set null,
  claimed_email text,
  claimed_at    timestamptz,
  created_at    timestamptz default now()
);
create index if not exists gift_codes_unclaimed_idx
  on public.gift_codes (created_at, code) where claimed_by is null;

alter table public.gift_codes enable row level security;
-- Intentionally NO policies: with RLS on and no policy, regular users can't read
-- or write the pool at all. Only the service-role key (claim-gift-code) bypasses RLS.

-- Atomically hand out ONE unused code and mark it claimed. FOR UPDATE SKIP LOCKED
-- guarantees two simultaneous callers never get the same code. SECURITY DEFINER so
-- it works under the service role; locked down to service_role only (below).
create or replace function public.claim_one_gift_code(p_user uuid, p_email text)
returns table (code text, redeem_url text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code text;
  v_url  text;
begin
  select g.code, g.redeem_url into v_code, v_url
  from public.gift_codes g
  where g.claimed_by is null
  order by g.created_at, g.code
  for update skip locked
  limit 1;

  if v_code is null then
    return;  -- pool empty
  end if;

  update public.gift_codes
  set claimed_by = p_user, claimed_email = p_email, claimed_at = now()
  where public.gift_codes.code = v_code;

  code := v_code; redeem_url := v_url;
  return next;
end;
$$;

revoke all on function public.claim_one_gift_code(uuid, text) from public, anon, authenticated;
grant execute on function public.claim_one_gift_code(uuid, text) to service_role;

-- Convenience: how many codes are left (run anytime to check the pool).
--   select count(*) filter (where claimed_by is null) as available,
--          count(*) filter (where claimed_by is not null) as given,
--          count(*) as total
--   from public.gift_codes;

-- ============================================================================
-- LOAD CODES — paste a SEPARATE batch here (NOT the codes already in your emails).
-- Replace the example rows with your codes (code, redeem-url), then run.
-- Re-runnable: on conflict do nothing skips codes already loaded.
-- ============================================================================
-- insert into public.gift_codes (code, redeem_url) values
--   ('ABCD1234EFGH', 'https://apps.apple.com/redeem?code=ABCD1234EFGH'),
--   ('WXYZ5678IJKL', 'https://apps.apple.com/redeem?code=WXYZ5678IJKL')
-- on conflict (code) do nothing;
