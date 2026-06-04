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
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ entitled: false, error: "Not signed in." }, 401);

    const { data: row } = await admin.from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    // Candidate customers: the linked one + any with this email (covers duplicates
    // created before the DB link was saved). Search each for a subscription.
    const candidates: string[] = [];
    if (row?.stripe_customer_id) candidates.push(row.stripe_customer_id);
    if (user.email) {
      const found = await stripe.customers.list({ email: user.email, limit: 20 });
      for (const c of found.data) if (!candidates.includes(c.id)) candidates.push(c.id);
    }
    if (candidates.length === 0) return json({ entitled: false, status: "none" });

    let customerId = candidates[0];
    let sub: Stripe.Subscription | null = null;
    for (const cid of candidates) {
      const subs = await stripe.subscriptions.list({ customer: cid, status: "all", limit: 10 });
      const s = subs.data.find((x) => ENTITLED.includes(x.status)) || subs.data[0] || null;
      if (s) { customerId = cid; sub = s; break; }
    }
    if (!sub) return json({ entitled: false, status: "no_subscription" });

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
