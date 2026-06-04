// One-off admin function: create a "friends & family" promo code in Stripe.
// Coupon = 100% off for N months (repeating), then normal price. Returns the
// shareable code. Safe to delete after running. Uses STRIPE_SECRET_KEY (live).

import Stripe from "npm:stripe@^16";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2024-06-20" });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const body = await req.json().catch(() => ({}));
    const code = (body.code || "FRIENDS").toString().toUpperCase();
    const months = Number(body.months) || 3;
    const maxRedemptions = Number(body.maxRedemptions) || 50;
    const MONTHLY_PRODUCT = "prod_UdXCGKzOWjvnGK"; // restrict so it can't give a free year on annual

    // Deactivate any existing code with this string so we can recreate it cleanly.
    const existing = await stripe.promotionCodes.list({ code, limit: 100 });
    for (const p of existing.data) {
      if (p.active) { try { await stripe.promotionCodes.update(p.id, { active: false }); } catch (_e) { /* ignore */ } }
    }

    const coupon = await stripe.coupons.create({
      percent_off: 100,
      duration: "repeating",
      duration_in_months: months,
      name: `Friends & Family ${months}mo free`,
      applies_to: { products: [MONTHLY_PRODUCT] },
    });
    const promo = await stripe.promotionCodes.create({
      coupon: coupon.id,
      code,
      max_redemptions: maxRedemptions,
    });

    return json({ code: promo.code, id: promo.id, coupon: coupon.id, months, maxRedemptions, active: promo.active });
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

function json(b: unknown, status = 200) {
  return new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
