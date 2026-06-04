// Supabase Edge Function: create-checkout-session
// Creates a Stripe Checkout session (subscription mode, 7-day trial) for the
// signed-in user and returns its URL. The client redirects there.
//
// Secrets required (Edge Functions -> Secrets):
//   STRIPE_SECRET_KEY   = sk_test_... (then sk_live_... when you go live)
//   APP_URL             = https://signarama2023.github.io/reframe-journal  (or your domain)
// SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.
//
// Deploy with verify_jwt = TRUE (the default) — only signed-in users may call it.

import Stripe from "npm:stripe@^16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const APP_URL = Deno.env.get("APP_URL") || "https://signarama2023.github.io/reframe-journal";
const TRIAL_DAYS = 7;

// Daily Forge Stripe products (test mode). The active recurring price for each
// is resolved at request time, so we never hard-code price IDs.
const PRODUCTS: Record<string, string> = {
  monthly: "prod_UdXCGKzOWjvnGK",
  annual: "prod_UdXDMJEQIrVxaH",
};

async function priceForPlan(plan: string): Promise<string | null> {
  const productId = PRODUCTS[plan];
  if (!productId) return null;
  const prices = await stripe.prices.list({ product: productId, active: true, limit: 10 });
  const recurring = prices.data.find((p) => p.recurring) || prices.data[0];
  return recurring ? recurring.id : null;
}

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    // Service-role client (NO user auth header → DB ops bypass RLS). Identify the
    // caller by validating their JWT explicitly via getUser(token).
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !user) return json({ error: "Not signed in." }, 401);

    const { plan } = await req.json();
    const priceId = await priceForPlan(plan);
    if (!priceId) return json({ error: "Unknown or unpriced plan: " + plan }, 400);

    // Find this user's Stripe customer: DB row, then Stripe-by-email, else create one.
    const { data: existing } = await admin
      .from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    let customerId = existing?.stripe_customer_id as string | undefined;
    if (!customerId && user.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 1 });
      customerId = found.data[0]?.id;
    }
    if (!customerId) {
      const customer = await stripe.customers.create({ email: user.email, metadata: { supabase_user_id: user.id } });
      customerId = customer.id;
    }
    // Always record the link (service role → write succeeds).
    await admin.from("subscriptions").upsert({ user_id: user.id, stripe_customer_id: customerId });

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: TRIAL_DAYS },
      allow_promotion_codes: true,
      success_url: APP_URL + "?checkout=success",
      cancel_url: APP_URL + "?checkout=cancel",
    });

    return json({ url: session.url });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
