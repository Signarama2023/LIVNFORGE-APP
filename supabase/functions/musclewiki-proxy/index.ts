// Supabase Edge Function: musclewiki-proxy
// Transparent streaming proxy for MuscleWiki exercise videos. The MuscleWiki API
// key stays server-side (a project secret); the app plays videos from this
// endpoint instead of ever seeing the key. This satisfies MuscleWiki's terms,
// which permit "server-side proxying ... as a transparent pass-through without
// storing video data to disk or cache" — we stream bytes straight through and
// forward Range requests so the <video> element can seek/buffer normally.
//
// Requires a project secret named MUSCLEWIKI_API_KEY.
//
// POC scope: serves the "branded" demo MP4s by filename, e.g.
//   /musclewiki-proxy?file=male-yoga-downward-dog-front.mp4
//
// Deploy (public, so a <video src> can load it without an auth header):
//   supabase functions deploy musclewiki-proxy --no-verify-jwt --project-ref <ref>
//
// PRODUCTION HARDENING (not done here — this is a proof-of-concept):
//   - lock to your own origins (Referer/Origin allowlist) or a short-lived signed
//     token so the endpoint can't be used as a free open proxy against your quota;
//   - rate-limit; consider caching only the small metadata, never the video.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const MUSCLEWIKI_API_KEY = Deno.env.get("MUSCLEWIKI_API_KEY");
const UPSTREAM_BASE = "https://api.musclewiki.com/stream/videos/branded/";

// Only allow the branded demo MP4 filenames — never an arbitrary upstream path.
// Some segments are capitalized upstream (e.g. "...-Recovery-...").
const FILE_RE = /^[A-Za-z0-9][A-Za-z0-9-]{0,120}\.mp4$/;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "range, content-type",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Expose-Headers": "content-range, accept-ranges, content-length, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "GET" && req.method !== "HEAD") {
    return json({ error: "Method not allowed." }, 405);
  }
  if (!MUSCLEWIKI_API_KEY) {
    return json({ error: "Missing MUSCLEWIKI_API_KEY secret on the function." }, 500);
  }

  const url = new URL(req.url);
  const file = (url.searchParams.get("file") || "").trim();
  if (!FILE_RE.test(file)) {
    return json({ error: "Invalid or missing 'file' parameter." }, 400);
  }

  // Forward the browser's Range header so seeking/partial buffering works.
  const upstreamHeaders: Record<string, string> = { "X-API-Key": MUSCLEWIKI_API_KEY };
  const range = req.headers.get("range");
  if (range) upstreamHeaders["Range"] = range;

  let upstream: Response;
  try {
    upstream = await fetch(UPSTREAM_BASE + file, { method: req.method, headers: upstreamHeaders });
  } catch (_e) {
    return json({ error: "Upstream video request failed." }, 502);
  }

  if (upstream.status === 401 || upstream.status === 403) {
    return json({ error: "MuscleWiki rejected the request (key or plan)." }, 502);
  }
  if (upstream.status === 404) return json({ error: "Video not found." }, 404);

  // Pass the bytes straight through — no disk, no cache — preserving the streaming
  // headers the <video> element needs (206 partials, content-range, etc.).
  const headers = new Headers(cors);
  const pass = ["content-type", "content-length", "content-range", "accept-ranges"];
  for (const h of pass) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  headers.set("Cache-Control", "no-store");
  return new Response(req.method === "HEAD" ? null : upstream.body, {
    status: upstream.status, // 200 or 206
    headers,
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "Content-Type": "application/json" },
  });
}
