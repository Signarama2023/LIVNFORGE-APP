// Supabase Edge Function: check-subscription
// Source of truth for "is this user entitled" — asks Stripe directly for the
// signed-in user's subscription, syncs it into public.subscriptions, and returns
// { entitled, status }. The app calls this on load (and after checkout) so the
// paywall unlocks without depending on a webhook. Deploy with verify_jwt = TRUE.
//
// Secret required: STRIPE_SECRET_KEY. SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY injected.

import Stripe from "npm:stripe@^16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const ENTITLED = ["trialing", "active"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user } } = await admin.auth.getUser();
    if (!user) return json({ entitled: false, error: "Not signed in." }, 401);

    const { data: row } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    const customerId = row?.stripe_customer_id as string | undefined;
    if (!customerId) return json({ entitled: false, status: "none" });

    const subs = await stripe.subscriptions.list({ customer: customerId, status: "all", limit: 10 });
    // pick the most useful subscription: an entitled one if present, else the latest
    const sub = subs.data.find((s) => ENTITLED.includes(s.status)) || subs.data[0];
    if (!sub) return json({ entitled: false, status: "none" });

    const entitled = ENTITLED.includes(sub.status) &&
      (!sub.current_period_end || sub.current_period_end * 1000 > Date.now());

    await admin.from("subscriptions").upsert({
      user_id: user.id,
      stripe_customer_id: customerId,
      stripe_subscription_id: sub.id,
      status: sub.status,
      price_id: sub.items.data[0]?.price?.id || null,
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      cancel_at_period_end: sub.cancel_at_period_end,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" });

    return json({ entitled, status: sub.status });
  } catch (err) {
    return json({ entitled: false, error: String((err as Error)?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
