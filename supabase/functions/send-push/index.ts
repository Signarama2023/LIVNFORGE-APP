// LIVN FORGE — send APNs push notifications for circle activity.
//
// Triggered by Supabase Database Webhooks on INSERT into:
//   circle_messages, prayer_requests, prayer_circle_members
//
// Deploy:
//   supabase functions deploy send-push --no-verify-jwt
//
// Secrets (set once):
//   supabase secrets set APNS_KEY_ID=T2ZPLDMXHB APNS_TEAM_ID=UP8B2BTR9L \
//     APNS_BUNDLE=app.thedailyforge WEBHOOK_SECRET=<pick-a-long-random-string>
//   supabase secrets set APNS_PRIVATE_KEY="$(cat /path/to/AuthKey_T2ZPLDMXHB.p8)"
//
// Each Database Webhook must send header:  x-webhook-secret: <same WEBHOOK_SECRET>
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const KEY_ID = Deno.env.get("APNS_KEY_ID")!;
const TEAM_ID = Deno.env.get("APNS_TEAM_ID")!;
const BUNDLE = Deno.env.get("APNS_BUNDLE") || "app.thedailyforge";
const PRIVATE_KEY = Deno.env.get("APNS_PRIVATE_KEY")!;
const WEBHOOK_SECRET = Deno.env.get("WEBHOOK_SECRET") || "";
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function b64url(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlStr(s: string): string {
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function pemToDer(pem: string): Uint8Array {
  const body = pem.replace(/-----BEGIN [^-]+-----/, "").replace(/-----END [^-]+-----/, "").replace(/\s+/g, "");
  const bin = atob(body);
  const der = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) der[i] = bin.charCodeAt(i);
  return der;
}

let cachedJwt: { token: string; iat: number } | null = null;
async function apnsJwt(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedJwt && now - cachedJwt.iat < 2400) return cachedJwt.token; // reuse < 40 min
  const key = await crypto.subtle.importKey(
    "pkcs8", pemToDer(PRIVATE_KEY), { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"],
  );
  const header = b64urlStr(JSON.stringify({ alg: "ES256", kid: KEY_ID }));
  const payload = b64urlStr(JSON.stringify({ iss: TEAM_ID, iat: now }));
  const input = `${header}.${payload}`;
  const sig = await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(input));
  const token = `${input}.${b64url(sig)}`;
  cachedJwt = { token, iat: now };
  return token;
}

// TestFlight + App Store builds use the production APNs host; Xcode dev builds use
// sandbox. We try production first and fall back to sandbox on BadDeviceToken.
async function sendApns(token: string, title: string, body: string, data: Record<string, unknown>): Promise<void> {
  const jwt = await apnsJwt();
  const payload = JSON.stringify({ aps: { alert: { title, body }, sound: "default" }, ...data });
  for (const host of ["https://api.push.apple.com", "https://api.sandbox.push.apple.com"]) {
    try {
      const res = await fetch(`${host}/3/device/${token}`, {
        method: "POST",
        headers: {
          authorization: `bearer ${jwt}`,
          "apns-topic": BUNDLE,
          "apns-push-type": "alert",
          "apns-priority": "10",
        },
        body: payload,
      });
      if (res.status === 200) return;
      const txt = await res.text();
      if (!(res.status === 400 && /BadDeviceToken/.test(txt))) { console.warn("apns", host, res.status, txt); return; }
    } catch (e) { console.warn("apns fetch error", host, String(e)); return; }
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") return new Response("ok");
  if (WEBHOOK_SECRET && req.headers.get("x-webhook-secret") !== WEBHOOK_SECRET) {
    return new Response("unauthorized", { status: 401 });
  }
  let payload: any;
  try { payload = await req.json(); } catch { return new Response("bad json", { status: 400 }); }

  const table: string = payload.table;
  const rec: any = payload.record || {};
  const code: string | undefined = rec.code;
  if (!code) return new Response("no code");

  const sb = createClient(SB_URL, SERVICE_KEY);
  const { data: circle } = await sb.from("prayer_circles").select("name").eq("code", code).maybeSingle();
  const circleName = (circle && (circle as any).name) || "Your circle";

  const actorEmail = (rec.email || "").toLowerCase();
  const actorName = rec.name || "Someone";

  let title = circleName, body = "", prefKey = "circle_messages";
  if (table === "circle_messages") {
    prefKey = "circle_messages";
    const msg = (rec.body || "").trim();
    body = `${actorName}: ${msg ? (msg.length > 120 ? msg.slice(0, 117) + "…" : msg) : "sent a photo"}`;
  } else if (table === "prayer_requests") {
    prefKey = "prayer_requests";
    body = `${actorName} shared a prayer request`;
  } else if (table === "prayer_circle_members") {
    prefKey = "member_joins";
    body = `${actorName} joined ${circleName}`;
  } else {
    return new Response("ignored");
  }

  const { data: members } = await sb.from("prayer_circle_members").select("email").eq("code", code);
  const emails: string[] = (members || [])
    .map((m: any) => (m.email || "").toLowerCase())
    .filter((e: string) => e && e !== actorEmail);
  if (!emails.length) return new Response("no recipients");

  const { data: prefRows } = await sb.from("notification_prefs").select(`email,${prefKey}`).in("email", emails);
  const muted = new Set<string>();
  (prefRows || []).forEach((r: any) => { if (r[prefKey] === false) muted.add((r.email || "").toLowerCase()); });
  const wanted = emails.filter((e) => !muted.has(e)); // default ON when no row
  if (!wanted.length) return new Response("muted");

  const { data: tokens } = await sb.from("device_tokens").select("token").in("email", wanted);
  const list = (tokens || []).map((t: any) => t.token).filter(Boolean);
  await Promise.all(list.map((tk: string) => sendApns(tk, title, body, { code }).catch(() => {})));
  return new Response(`sent:${list.length}`);
});
