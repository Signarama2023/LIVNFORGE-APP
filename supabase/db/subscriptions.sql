-- Daily Forge — subscription state, written ONLY by the stripe-webhook edge
-- function (service role). Each user can read their own row to gate the app.
-- Run this in Supabase Dashboard -> SQL Editor.

create table if not exists public.subscriptions (
  user_id               uuid primary key references auth.users(id) on delete cascade,
  stripe_customer_id    text unique,
  stripe_subscription_id text,
  status                text,            -- trialing | active | past_due | canceled | incomplete | unpaid
  price_id              text,
  current_period_end    timestamptz,
  cancel_at_period_end  boolean default false,
  updated_at            timestamptz default now()
);

alter table public.subscriptions enable row level security;

-- Users may READ their own subscription (to know whether to unlock the app).
drop policy if exists "read own subscription" on public.subscriptions;
create policy "read own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- No insert/update/delete policies: only the service-role key (used by the
-- stripe-webhook + create-checkout-session functions) can write. This is what
-- makes the paywall tamper-proof — a user cannot grant themselves access.

-- Convenience: is the signed-in user entitled right now? (trial or active)
create or replace function public.has_active_subscription()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.subscriptions s
    where s.user_id = auth.uid()
      and s.status in ('trialing', 'active')
      and (s.current_period_end is null or s.current_period_end > now())
  );
$$;
