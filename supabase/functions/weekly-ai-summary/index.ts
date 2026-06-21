// Supabase Edge Function: weekly-ai-summary
// Generates an AI weekly review of the user's Daily Forge journal entries.
// Requires a project secret named ANTHROPIC_API_KEY.
//
// Deploy: Supabase Dashboard -> Edge Functions -> (this function) -> paste this code -> Deploy.
// Secret: Edge Functions -> Secrets -> ANTHROPIC_API_KEY = <your key>.
//
// The client sends { rangeLabel, stats, entriesText, build } where build is
// "men" or "women" — the tone/framing of the review is chosen from that.

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

// Shared writing philosophy — keeps the review specific, varied, and keepsake-worthy.
const CORE_GUIDANCE =
  "You are given his/her ACTUAL journal entries and workouts from one week. Your job is to write a weekly " +
  "review that feels personally written for THIS person and THIS week — something they're glad to read now " +
  "and meaningful to look back on years from now, like a faithful snapshot of where they were.\n\n" +
  "HOW TO WRITE IT:\n" +
  "1. ACTUALLY READ the entries and reflect what was specifically said and done. Name the real moments — the " +
  "particular workouts logged, the specific struggles and wins they wrote about, the prayers, the reframes, " +
  "the things they were grateful for, the threads that recurred across the week. Reference their own words and " +
  "details so they know you read THEIR week, not a template. Generic encouragement that could apply to anyone " +
  "is a failure.\n" +
  "2. FIND THE STORY of the week — what it was really about, what they wrestled with, where they grew, what " +
  "was tender or hard, what they can be genuinely proud of. Surface a pattern or insight they might not have " +
  "noticed themselves.\n" +
  "3. POSITIVE SLANT, always: lead them to see the good and the effort; celebrate that they showed up. Name " +
  "struggles or gaps honestly but briefly and with grace — as the next step of growth, never scolding, " +
  "guilt-tripping, or heavy. They should finish hopeful and proud.\n" +
  "4. DO NOT use a fixed template or formula. Let the SHAPE of the review follow the shape of this week — vary " +
  "your opening, your structure, and your emphasis. Two different weeks must produce two clearly different " +
  "reviews. Never march through a set checklist (do NOT mechanically cover Faith/Family/Fitness/Finances every " +
  "time, and do NOT always end with 'here are two goals'). Avoid stock opening lines.\n" +
  "5. FAITH-ROOTED: point them toward Christ and living on purpose. Where it genuinely fits, you may weave in " +
  "ONE brief, accurate scripture — but only when it lands naturally, never as a checkbox, and never fabricate " +
  "or misquote.\n" +
  "6. Close in a way that fits THIS week — a word to carry forward, and if it's earned, one gentle specific " +
  "nudge. Let it feel natural, not formulaic.\n\n" +
  "Be specific and strictly true to the entries — never invent facts that aren't there. Warm and real, not " +
  "preachy. About 220-320 words. Plain text only — no markdown, headings, or bullet lists.";

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

    const { rangeLabel = "", stats = "", entriesText = "", build = "men" } = await req.json();

    if (!entriesText || !entriesText.trim()) {
      return json({ summary: "No journal entries for this week yet — log a few and try again." });
    }

    const systemPrompt = build === "women" ? WOMEN_PROMPT : MEN_PROMPT;

    const userContent =
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
        temperature: 0.9, // higher variety so week-to-week reviews don't feel templated
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
