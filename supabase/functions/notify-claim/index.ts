// Supabase Edge Function: notify-claim
// Emails the shop owner when a member claims a reward, so claims don't just sit
// silently in the redemptions table. The client calls this right after inserting
// a redemption, passing only the row id; this function looks the row up with the
// service role (authoritative data) and emails a FIXED owner address — so it can
// never be used to send arbitrary email to arbitrary recipients.
//
// One-time setup (replace re_xxx with your real Resend key):
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx --project-ref ihhctwmgfleihlnfnfsv
//   supabase functions deploy notify-claim --project-ref ihhctwmgfleihlnfnfsv
//
// FROM must be on a Resend-verified domain (the same one your Supabase auth
// emails send from). If yours isn't livnforge.com, change FROM below.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const FROM = "LIVN FORGE <noreply@livnforge.com>";
const OWNER_TO = ["mark.bailey@signarama.com", "markbailey1@me.com"]; // who gets notified

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"]/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c] as string));
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!RESEND_API_KEY) return json({ error: "Missing RESEND_API_KEY secret." }, 500);

    const body = await req.json().catch(() => ({}));
    const id = body && body.id;
    if (!id) return json({ error: "id required" }, 400);

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: r, error } = await admin.from("redemptions").select("*").eq("id", id).maybeSingle();
    if (error) return json({ error: error.message }, 500);
    if (!r) return json({ error: "Redemption not found." }, 404);

    const addr = [r.ship_address1, r.ship_address2].filter(Boolean).join(", ");
    const cityLine = [r.ship_city, r.ship_state].filter(Boolean).join(", ") + " " + (r.ship_zip || "");
    const subject = "🔨 New reward claim: " + (r.item_name || "reward") + (r.size ? " (" + r.size + ")" : "");

    const html =
      '<div style="font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#15161a;color:#e8e6e3;padding:24px;">' +
      '<div style="max-width:520px;margin:0 auto;background:#1c1e24;border:1px solid #2a2c32;border-radius:14px;overflow:hidden;">' +
      '<div style="background:#f0b66a;height:4px;"></div>' +
      '<div style="padding:22px 24px;">' +
      '<h2 style="margin:0 0 4px;color:#f0b66a;font-size:18px;">New reward claim</h2>' +
      '<p style="margin:0 0 16px;color:#9a978f;font-size:13px;">Someone reached a tier and claimed their reward.</p>' +
      '<table style="width:100%;border-collapse:collapse;font-size:14px;color:#e8e6e3;">' +
      row("Reward", esc(r.item_name) + (r.size ? " &middot; size " + esc(r.size) : "")) +
      row("Member email", esc(r.email)) +
      row("Ship to", esc(r.ship_name)) +
      row("Address", esc(addr) + "<br>" + esc(cityLine)) +
      row("Points at claim", esc(r.points_at_claim) + " (tier: " + esc(r.threshold) + ")") +
      row("Status", esc(r.status || "pending")) +
      '</table>' +
      '<p style="margin:18px 0 0;color:#9a978f;font-size:12px;">Mark it fulfilled in the app: Rewards &rarr; View all claims (admin).</p>' +
      '</div></div></div>';

    return await sendEmail(subject, html);
  } catch (err) {
    return json({ error: String((err as Error)?.message || err) }, 500);
  }
});

async function sendEmail(subject: string, html: string): Promise<Response> {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { "Authorization": "Bearer " + RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: FROM, to: OWNER_TO, subject, html }),
  });
  const data = await resp.json();
  if (!resp.ok) return json({ error: (data && data.message) || "Resend send failed." }, 502);
  return json({ ok: true, id: data.id });
}

function row(label: string, value: string): string {
  return '<tr>' +
    '<td style="padding:7px 0;color:#9a978f;vertical-align:top;width:130px;border-top:1px solid #2a2c32;">' + label + '</td>' +
    '<td style="padding:7px 0;border-top:1px solid #2a2c32;"><b>' + value + '</b></td></tr>';
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
