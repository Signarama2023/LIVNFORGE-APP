-- LIVN FORGE — gifter allowlist.
-- Emails the admin has approved to gift a free year even if they aren't paying
-- members (e.g. ambassadors who received a free year). Eligibility to gift =
-- admin OR paying annual member OR email in this list. One gift each (enforced
-- by the claim-gift-code function). Service-role only — no client access.
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.gift_allowlist (
  email    text primary key,
  added_at timestamptz default now()
);
alter table public.gift_allowlist enable row level security;
-- Intentionally no policies: only the service-role (claim-gift-code) reads/writes.

-- Bulk-add existing ambassadors here if you want them to be able to gift, e.g.:
-- insert into public.gift_allowlist (email) values
--   ('deborah@inspired-bp.com'),
--   ('someone@example.com')
-- on conflict (email) do nothing;
