// Supabase Edge Function: customer-portal
// Returns a Stripe Billing Portal URL so the signed-in user can update their
// card, switch plan, or cancel — no billing UI to build.
//
// Secrets: STRIPE_SECRET_KEY, APP_URL. Deploy with verify_jwt = TRUE.

import Stripe from "npm:stripe@^16";
import { createClient } from "npm:@supabase/supabase-js@2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });
const APP_URL = Deno.env.get("APP_URL") || "https://signarama2023.github.io/reframe-journal";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return json({ error: "Not signed in." }, 401);

    const { data: row } = await supabase
      .from("subscriptions").select("stripe_customer_id").eq("user_id", user.id).maybeSingle();
    if (!row?.stripe_customer_id) return json({ error: "No billing account yet." }, 400);

    const session = await stripe.billingPortal.sessions.create({
      customer: row.stripe_customer_id,
      return_url: APP_URL,
    });
    return json({ url: session.url });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
