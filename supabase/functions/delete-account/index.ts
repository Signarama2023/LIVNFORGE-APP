// Supabase Edge Function: delete-account
// Permanently deletes the signed-in user's account and all of their data.
// Required by App Store Review Guideline 5.1.1(v) (apps with account creation
// must offer in-app account deletion). Deploy with verify_jwt = TRUE.
//
// Deploy:  supabase functions deploy delete-account --project-ref ihhctwmgfleihlnfnfsv
// SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are injected automatically — no secret to add.

import { createClient } from "npm:@supabase/supabase-js@2";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  try {
    const token = (req.headers.get("Authorization") || "").replace("Bearer ", "");
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Identify the caller from their JWT — they can only delete themselves.
    const { data: { user } } = await admin.auth.getUser(token);
    if (!user) return json({ error: "Not signed in." }, 401);
    const uid = user.id;
    const email = (user.email || "").toLowerCase();

    // Delete the auth account FIRST — this is the authoritative "account is gone"
    // action. If it fails, nothing has been destroyed yet, so the user can safely
    // retry. (Doing the row cleanup first risked a half-deleted state: data gone
    // but login still working if this call then failed.)
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: "Could not delete the account: " + delErr.message }, 500);

    // Account is now deleted (and any ON DELETE CASCADE tables — subscriptions,
    // redemptions, device_tokens — went with it). Best-effort cleanup of the
    // remaining rows; each delete is wrapped so one failure can't abort the rest.
    // We already captured uid + email above, so these still work post-deletion.
    const del = async (table: string, col: string, val: string) => {
      try { await admin.from(table).delete().eq(col, val); } catch (_e) { /* ignore */ }
    };

    // Tables keyed by user_id (deleted explicitly in case they lack a cascade FK).
    await del("entries", "user_id", uid);
    await del("redemptions", "user_id", uid);
    await del("subscriptions", "user_id", uid);
    await del("device_tokens", "user_id", uid);

    // Tables keyed by email (no FK cascade — must be removed explicitly).
    if (email) {
      await del("scores", "email", email);
      await del("device_tokens", "email", email);
      await del("notification_prefs", "email", email);
      await del("prayer_circle_members", "email", email);
      await del("prayer_requests", "email", email);
      await del("prayer_request_prayers", "email", email);
      await del("prayer_logs", "email", email);
      await del("circle_messages", "email", email);
      await del("content_reports", "reporter_email", email);
      await del("user_blocks", "blocker_email", email);
      await del("user_blocks", "blocked_email", email);
    }

    return json({ ok: true });
  } catch (err) {
    return json({ error: String((err as { message?: string })?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
