# Daily Forge — Stripe subscription setup

Model: **subscription** (monthly + annual), **7-day free trial**, **whole app** gated
behind an active trial/subscription. Do everything in **Stripe TEST mode** first.

## 1. Create the product + prices (Stripe Dashboard, test mode)
- Products → **Add product** → name "Daily Forge".
- Add two recurring prices:
  - Monthly — e.g. **$5.99 / month**
  - Annual — e.g. **$49.99 / year**
- Copy both **Price IDs** (`price_...`). Send them to me — they go in the app's subscribe screen.

## 2. Set Supabase secrets (Dashboard → Edge Functions → Secrets)
- `STRIPE_SECRET_KEY` = your **test** secret key (`sk_test_...`)
- `APP_URL` = `https://signarama2023.github.io/reframe-journal` (or your custom domain)
- `STRIPE_WEBHOOK_SECRET` = (added in step 4)
> You paste these — I never handle your secret keys.

## 3. Deploy the functions + run the SQL
- SQL Editor → run `supabase/db/subscriptions.sql`.
- Deploy three Edge Functions (paste each file, Deploy):
  - `create-checkout-session` — Verify JWT **ON**
  - `customer-portal` — Verify JWT **ON**
  - `stripe-webhook` — Verify JWT **OFF**  ← important (Stripe sends no Supabase JWT)

## 4. Create the webhook endpoint (Stripe Dashboard → Developers → Webhooks)
- Endpoint URL: `https://ihhctwmgfleihlnfnfsv.supabase.co/functions/v1/stripe-webhook`
- Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `customer.subscription.created`
- Copy the **Signing secret** (`whsec_...`) → set it as the `STRIPE_WEBHOOK_SECRET` Supabase secret → redeploy `stripe-webhook`.

## 5. Test (test mode)
- Open the app, start the trial, use Stripe test card `4242 4242 4242 4242` (any future date / CVC).
- Confirm a row appears in `public.subscriptions` with status `trialing`, and the app unlocks.

## 6. Go live
- Repeat with **live** keys/prices/webhook; swap the secrets to `sk_live_...` / live `whsec_...`; update the app's live Price IDs.

## Still required before charging (non-code)
- Terms of Service + Privacy Policy (you store personal journal + faith data — get reviewed).
- Refund / cancellation policy; tax (Stripe Tax).
- **Bible content commercial licensing** check (api.scripture.api.bible + NIV/NLT terms).
