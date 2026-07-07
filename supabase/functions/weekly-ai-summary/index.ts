// Supabase Edge Function: weekly-ai-summary
// Generates an AI weekly review of the user's Daily Forge journal entries.
// Requires a project secret named ANTHROPIC_API_KEY.
//
// Deploy: Supabase Dashboard -> Edge Functions -> (this function) -> paste this code -> Deploy.
// Secret: Edge Functions -> Secrets -> ANTHROPIC_API_KEY = <your key>.
//
// The client sends { name, rangeLabel, stats, entriesText, build } where build is
// "men" or "women" — the tone/framing of the review is chosen from that, and name
// is the journaler's first name (may be blank).

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
// Sonnet (not Haiku) — the weekly review is a once-a-week keepsake; it's worth the
// extra quality for richer, less formulaic, more specific writing.
const MODEL = "claude-sonnet-4-6";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Shared writing philosophy — a short, positive, shareable weekly recap: a general
// summary plus a few key points, addressed to the journaler by name.
const CORE_GUIDANCE =
  "You are given the journaler's ACTUAL entries and workouts from one week. Write a SHORT, positive, shareable " +
  "weekly review — the kind of upbeat recap they'd be glad to read and comfortable screenshotting to share with " +
  "family or their circle. Their first name is given below as 'Name'; address them by it. If Name is blank, " +
  "address them warmly (brother, sister, or friend) without inventing a name.\n\n" +
  "PRODUCE EXACTLY THIS SHAPE:\n" +
  "1. A brief opening SUMMARY — 2 to 4 sentences, addressed to them by name, capturing the overall shape and " +
  "spirit of their week with a genuinely positive slant. Give the big picture, not a play-by-play.\n" +
  "2. Then a short list of 2 to 4 KEY POINTS, each on its own line beginning with the bullet character '• ' — " +
  "concrete highlights pulled from their REAL entries (a workout, a gratitude, a prayer, a consistent habit, a " +
  "small win or breakthrough, a theme that recurred). Specific enough to feel like THEIR week, but keep each to " +
  "one short, upbeat line.\n" +
  "3. A one-sentence closing encouragement, using their name, that leaves them proud and hopeful.\n\n" +
  "RULES:\n" +
  "- POSITIVE and shareable throughout: celebrate that they showed up. This is a highlight reel, not a deep " +
  "audit — do NOT dwell on gaps or failures, and do NOT expose raw private struggles; if a hard thing comes up, " +
  "touch it briefly and frame it as growth. Nothing they'd be embarrassed to share.\n" +
  "- Use their name naturally (in the opening and the close), not in every sentence.\n" +
  "- Be strictly true to the entries — never invent facts. Keep it general enough to read as a clean recap.\n" +
  "- FAITH-ROOTED and encouraging; you may weave in ONE brief, accurate scripture ONLY if it lands naturally — " +
  "never forced, never misquoted.\n" +
  "- Vary your wording week to week; avoid stock opening lines and formulaic phrasing.\n" +
  "- Keep it concise: about 120-170 words total.\n" +
  "- Plain text only. Use real line breaks, and '• ' for the key points. No markdown, no headings, no " +
  "asterisks, no numbered lists.";

const MEN_PROMPT =
  "You are a wise, warm mentor and brother in Christ writing a weekly review for a man using LIVN FORGE, a " +
  "faith + fitness discipleship journal for men who want to live on purpose as sons of the King. Speak directly " +
  "to him as 'you', brother to brother. If he is being hard on himself, remind him gently of who he is in " +
  "Christ.\n\n" + CORE_GUIDANCE;

const WOMEN_PROMPT =
  "You are a wise, warm mentor and older sister in Christ writing a weekly review for a woman using LIVN FORGE, " +
  "a faith + fitness discipleship journal for women who want to live on purpose as daughters of the King. Speak " +
  "directly to her as 'you', sister to sister. If she is being hard on herself, gently remind her of her worth " +
  "in Christ. You may write in the encouraging spirit of women of faith, but never fabricate or attribute " +
  "quotes to any real person.\n\n" + CORE_GUIDANCE;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "Missing ANTHROPIC_API_KEY secret on the function." }, 500);
    }

    const { name = "", rangeLabel = "", stats = "", entriesText = "", build = "men" } = await req.json();

    if (!entriesText || !entriesText.trim()) {
      return json({ summary: "No journal entries for this week yet — log a few and try again." });
    }

    const systemPrompt = build === "women" ? WOMEN_PROMPT : MEN_PROMPT;

    const cleanName = String(name || "").trim().slice(0, 40);
    const userContent =
      "Name: " + (cleanName || "(not provided)") + "\n" +
      "Week: " + rangeLabel + "\n" +
      "Totals: " + stats + "\n\n" +
      "Journal entries and workouts:\n" + entriesText;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 800,
        temperature: 0.8, // some variety week-to-week, but steady enough to keep the summary + key-points shape
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return json({ error: (data && data.error && data.error.message) || "AI request failed." }, 502);
    }

    const summary = (data.content || [])
      .map((b: { text?: string }) => b.text || "")
      .join("")
      .trim();

    return json({ summary });
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
