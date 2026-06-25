// Supabase Edge Function: claim-gift-code
// Hands out one "gift a free year" code from public.gift_codes.
//
//   - ADMIN (app owner): unlimited.
//   - Active ANNUAL member (verified via RevenueCat): exactly one, ever.
//   - Everyone else: denied.
//
// Secret needed for member verification:
//   supabase secrets set REVENUECAT_SECRET_KEY=sk_xxx --project-ref ihhctwmgfleihlnfnfsv
// (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are injected automatically.)
//   supabase functions deploy claim-gift-code --project-ref ihhctwmgfleihlnfnfsv

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "markbailey1@me.com";
const ANNUAL_PRODUCT = "app.thedailyforge.annual";   // App Store annual product id
const RC_ENTITLEMENT = "The Daily Forge Pro";          // RevenueCat entitlement name

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// True only if RevenueCat says this user has an ACTIVE entitlement whose product is the ANNUAL one.
async function isActiveAnnual(appUserId: string): Promise<boolean> {
  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) return false; // not configured yet -> nobody qualifies
  try {
    const r = await fetch("https://api.revenuecat.com/v1/subscribers/" + encodeURIComponent(appUserId), {
      headers: { "Authorization": "Bearer " + key },
    });
    if (!r.ok) return false;
    const d = await r.json();
    const ent = d?.subscriber?.entitlements?.[RC_ENTITLEMENT];
    if (!ent) return false;
    const isAnnual = ent.product_identifier === ANNUAL_PRODUCT;
    const active = !ent.expires_date || new Date(ent.expires_date).getTime() > Date.now();
    return isAnnual && active;
  } catch (_e) {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Not signed in." }, 401);

    const email = (user.email || "").toLowerCase();
    const isAdmin = email === ADMIN_EMAIL;

    if (!isAdmin) {
      // Members get exactly one. If they already claimed, return that same code (don't burn another).
      const { data: existing } = await admin
        .from("gift_codes").select("code, redeem_url").eq("claimed_by", user.id).limit(1).maybeSingle();
      if (existing?.code) return json({ code: existing.code, redeemUrl: existing.redeem_url || null, alreadyClaimed: true });

      const ok = await isActiveAnnual(user.id);
      if (!ok) return json({ error: "Only active annual members can gift a free year." }, 403);
    }

    const { data, error } = await admin.rpc("claim_one_gift_code", { p_user: user.id, p_email: email });
    if (error) return json({ error: error.message }, 500);

    const row = Array.isArray(data) ? data[0] : data;
    if (!row || !row.code) return json({ soldOut: true });

    return json({ code: row.code, redeemUrl: row.redeem_url || null });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
