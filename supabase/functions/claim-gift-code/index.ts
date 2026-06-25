// Supabase Edge Function: claim-gift-code
// Hands out one "gift a free year" code from public.gift_codes, and manages the
// gifter allowlist.
//
//   - ADMIN (app owner): unlimited gives; can add emails to the allowlist.
//   - Paying ANNUAL member (RevenueCat, "normal" period): one gift, ever.
//   - Email on the gift_allowlist (admin-approved ambassador): one gift, ever.
//   - Everyone else: denied.
//
// Request body modes:
//   {}                      -> claim/share a code (or return your already-claimed one)
//   { check: true }         -> returns { eligible } without claiming (for the UI)
//   { allowEmail: "a@b.c" } -> ADMIN only: add an email to the gifter allowlist
//
// Secret: REVENUECAT_SECRET_KEY (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY injected).
//   supabase functions deploy claim-gift-code --project-ref ihhctwmgfleihlnfnfsv

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "markbailey1@me.com";
const ANNUAL_PRODUCT = "app.thedailyforge.annual";
const RC_ENTITLEMENT = "The Daily Forge Pro";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// PAYING annual member right now (active annual entitlement + a "normal" paid period).
// Free-year recipients are in an intro/trial/promotional period, so they're excluded here.
async function isPaidAnnual(appUserId: string): Promise<boolean> {
  const key = Deno.env.get("REVENUECAT_SECRET_KEY");
  if (!key) return false;
  try {
    const r = await fetch("https://api.revenuecat.com/v1/subscribers/" + encodeURIComponent(appUserId), {
      headers: { "Authorization": "Bearer " + key },
    });
    if (!r.ok) return false;
    const d = await r.json();
    const ent = d?.subscriber?.entitlements?.[RC_ENTITLEMENT];
    const sub = d?.subscriber?.subscriptions?.[ANNUAL_PRODUCT];
    if (!ent || !sub) return false;
    const isAnnual = ent.product_identifier === ANNUAL_PRODUCT;
    const active = !ent.expires_date || new Date(ent.expires_date).getTime() > Date.now();
    const paid = sub.period_type === "normal" && sub.store !== "promotional";
    return isAnnual && active && paid;
  } catch (_e) {
    return false;
  }
}

// deno-lint-ignore no-explicit-any
async function isAllowlisted(adminClient: any, email: string): Promise<boolean> {
  if (!email) return false;
  const { data } = await adminClient.from("gift_allowlist").select("email").eq("email", email).maybeSingle();
  return !!data;
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
    const body = await req.json().catch(() => ({}));

    // --- Admin: add an email to the gifter allowlist ---
    if (body && body.allowEmail) {
      if (!isAdmin) return json({ error: "Admin only." }, 403);
      const e = String(body.allowEmail).trim().toLowerCase();
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) return json({ error: "Enter a valid email." }, 400);
      const { error } = await admin.from("gift_allowlist").upsert({ email: e }, { onConflict: "email" });
      if (error) return json({ error: error.message }, 500);
      return json({ ok: true, allowed: e });
    }

    // Whether THIS user may gift (admin, paying annual, or allowlisted).
    const eligible = isAdmin || (await isPaidAnnual(user.id)) || (await isAllowlisted(admin, email));

    // --- Eligibility check only (for the UI) ---
    if (body && body.check) return json({ eligible, admin: isAdmin });

    // --- Claim / share a code ---
    if (!isAdmin) {
      // Members & allowlisted get exactly one; return their existing code if already claimed.
      const { data: existing } = await admin
        .from("gift_codes").select("code, redeem_url").eq("claimed_by", user.id).limit(1).maybeSingle();
      if (existing?.code) return json({ code: existing.code, redeemUrl: existing.redeem_url || null, alreadyClaimed: true });

      if (!eligible) return json({ error: "You're not eligible to gift a free year." }, 403);
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
