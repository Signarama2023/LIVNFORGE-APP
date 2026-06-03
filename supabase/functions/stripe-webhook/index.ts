// Supabase Edge Function: stripe-webhook
// Stripe calls this on subscription lifecycle events; it syncs the user's
// status into public.subscriptions (the source of truth for the paywall).
//
// Secrets required:
//   STRIPE_SECRET_KEY       = sk_test_... / sk_live_...
//   STRIPE_WEBHOOK_SECRET   = whsec_...  (from the Stripe webhook endpoint you create)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// IMPORTANT: deploy this function with verify_jwt = FALSE — Stripe does not send
// a Supabase JWT. (Dashboard: function -> Details -> "Verify JWT" off, or
// `supabase functions deploy stripe-webhook --no-verify-jwt`.)

import Stripe from "npm:stripe@^16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET")!;
const cryptoProvider = Stripe.createSubtleCryptoProvider();

const admin = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);

Deno.serve(async (req) => {
  const sig = req.headers.get("stripe-signature");
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(body, sig!, WEBHOOK_SECRET, undefined, cryptoProvider);
  } catch (err) {
    return new Response("Bad signature: " + String((err as Error)?.message || err), { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object as Stripe.Checkout.Session;
      if (s.subscription) {
        const sub = await stripe.subscriptions.retrieve(s.subscription as string);
        await upsertFromSubscription(sub);
      }
    } else if (event.type.startsWith("customer.subscription.")) {
      await upsertFromSubscription(event.data.object as Stripe.Subscription);
    }
    return new Response(JSON.stringify({ received: true }), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (err) {
    return new Response("Handler error: " + String((err as Error)?.message || err), { status: 500 });
  }
});

async function upsertFromSubscription(sub: Stripe.Subscription) {
  const customerId = sub.customer as string;
  // Map the Stripe customer back to a Supabase user.
  let userId: string | null = null;
  const { data: row } = await admin.from("subscriptions").select("user_id").eq("stripe_customer_id", customerId).maybeSingle();
  if (row?.user_id) {
    userId = row.user_id;
  } else {
    const customer = await stripe.customers.retrieve(customerId);
    userId = (customer as Stripe.Customer)?.metadata?.supabase_user_id || null;
  }
  if (!userId) return;

  await admin.from("subscriptions").upsert({
    user_id: userId,
    stripe_customer_id: customerId,
    stripe_subscription_id: sub.id,
    status: sub.status, // trialing | active | past_due | canceled | unpaid | incomplete
    price_id: sub.items.data[0]?.price?.id || null,
    current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
    cancel_at_period_end: sub.cancel_at_period_end,
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
}
