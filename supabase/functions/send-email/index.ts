// Supabase Edge Function: send-email
// Sends a custom email via Resend. The API key is a project SECRET — never put it
// in the app/client code, where anyone could read it.
//
// One-time setup (replace re_xxx with your real key and <ref> with the project ref):
//   supabase secrets set RESEND_API_KEY=re_xxxxxxxxx --project-ref <ref>
//   supabase functions deploy send-email --project-ref <ref>
//
// Call it from the app:
//   await sb.functions.invoke("send-email", { body: { to, subject, html } });

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
// From must be on your Resend-verified domain (after DNS verifies). Until then you
// can only send from onboarding@resend.dev to your own address for testing.
const FROM = "LIVN FORGE <noreply@livnforge.com>";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    if (!RESEND_API_KEY) return json({ error: "Missing RESEND_API_KEY secret." }, 500);

    const { to, subject, html } = await req.json();
    if (!to || !subject || !html) {
      return json({ error: "to, subject and html are required." }, 400);
    }

    // NOTE: this runs with JWT verification on, so only signed-in users can call it.
    // To avoid becoming a spam relay, restrict `to` for your use case (e.g. force it to
    // the caller's own email) rather than trusting an arbitrary recipient from the client.

    const resp = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": "Bearer " + RESEND_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });

    const data = await resp.json();
    if (!resp.ok) return json({ error: (data && data.message) || "Resend send failed." }, 502);
    return json({ ok: true, id: data.id });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
