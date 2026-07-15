# LIVN FORGE Security Audit

Last reviewed: July 15, 2026

## Fixed in the current review branch

- Added source-controlled owner-only RLS policies for private `entries`.
- Added member-scoped read and owner-only write policies for leaderboard `scores`.
- Changed the unauthenticated `send-push` webhook to fail closed when
  `WEBHOOK_SECRET` is missing.
- Updated public privacy and membership disclosures for Supabase, Stripe, Apple,
  RevenueCat, and Anthropic.

## Required deployment checks

1. Review and run `supabase/db/core_tables_rls.sql` in the production Supabase
   SQL Editor. Confirm the existing `entries.user_id`, `entries.email`,
   `scores.group_code`, and `scores.email` columns before running it.
2. Confirm `WEBHOOK_SECRET` is set for the `send-push` Edge Function and that
   all three database webhooks send the same value in `x-webhook-secret`.
3. Deploy the updated `send-push` function after the secret is confirmed.
4. Test with two normal accounts:
   - Account A cannot read, update, or delete Account B's journal entries.
   - Account A cannot write a leaderboard row using Account B's email.
   - A user cannot read a leaderboard until they have joined/synced that group.

## High-priority follow-up

- **Bible API key:** `BIBLE_API_KEY` is embedded in `index.html` and this
  repository is public. Treat it as exposed. Restrict it to the production
  domain if the provider supports restrictions, then rotate it. Prefer moving
  Bible API requests behind a rate-limited Edge Function.
- **Complimentary member emails:** `COMP_EMAILS` is embedded in the public
  front-end. Verify `supabase/db/comps.sql` has been deployed and all intended
  members exist in `comp_members`; then remove the hardcoded list and rely only
  on `has_comp_access()`.
- **Circle discovery:** authenticated users can currently read metadata for all
  prayer circles so the app can join by code. Replace broad table reads with a
  narrowly scoped `lookup_circle_by_code` RPC, then restrict the table SELECT
  policy to actual circle members.
- **Rate limiting:** add per-user limits to AI, email, and account-sensitive Edge
  Functions to control abuse and unexpected API costs.
- **Production verification:** repository SQL documents intended policies but
  does not prove the live Supabase project matches them. Export and diff the
  production schema/policies before calling the audit complete.

## Keys that may remain public

Supabase publishable/anonymous keys and the RevenueCat public SDK key are client
identifiers, not service-role secrets. Their safety still depends on correct
Supabase RLS and server-side entitlement validation. Never place a Supabase
service-role key, Stripe secret key, Anthropic key, APNs private key, Resend key,
or RevenueCat secret key in this repository or browser code.
