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

    // Best-effort row cleanup. Each delete is wrapped so a missing table/column
    // can never block the actual account deletion below.
    const del = async (table: string, col: string, val: string) => {
      try { await admin.from(table).delete().eq(col, val); } catch (_e) { /* ignore */ }
    };

    // Tables keyed by user_id (some cascade on auth-user delete; delete anyway to be safe).
    await del("entries", "user_id", uid);
    await del("scores", "user_id", uid);
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

    // Finally, delete the auth account itself. This also cascades any tables
    // with an ON DELETE CASCADE foreign key to auth.users.
    const { error: delErr } = await admin.auth.admin.deleteUser(uid);
    if (delErr) return json({ error: "Could not delete the account: " + delErr.message }, 500);

    return json({ ok: true });
  } catch (err) {
    return json({ error: String((err as { message?: string })?.message || err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });
}
