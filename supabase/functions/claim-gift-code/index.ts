// Supabase Edge Function: claim-gift-code
// Hands out one "gift a free year" code from public.gift_codes.
//
// Phase 1: ADMIN ONLY (the app owner). Phase 2 will also allow active ANNUAL
// members (verified via RevenueCat) to claim exactly one.
//
// Uses the injected SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY. Deploy with verify_jwt = TRUE.
//   supabase functions deploy claim-gift-code --project-ref ihhctwmgfleihlnfnfsv

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const ADMIN_EMAIL = "markbailey1@me.com";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Not signed in." }, 401);

    const email = (user.email || "").toLowerCase();
    const isAdmin = email === ADMIN_EMAIL;

    // Phase 1: only the admin can give out codes.
    // (Phase 2 adds: else if active annual member && hasn't already gifted -> allow once.)
    if (!isAdmin) {
      return json({ error: "Not eligible to give codes." }, 403);
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
