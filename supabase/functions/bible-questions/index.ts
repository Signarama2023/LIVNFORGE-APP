// Supabase Edge Function: bible-questions
// Given a Bible passage + reference, returns a key verse plus two question groups:
//   - understanding: 3 multiple-choice comprehension questions (plain reading of the text)
//   - reflection: 3 open-ended reflect-and-apply prompts
// Requires a project secret named ANTHROPIC_API_KEY.
//
// Deploy: Supabase Dashboard -> Edge Functions -> bible-questions -> paste this code -> Deploy.

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-haiku-4-5-20251001";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const SYSTEM_PROMPT =
  "You are a devotional Bible-study assistant for Daily Forge, a Christian journaling app. " +
  "You are given a Bible passage and its reference. Respond with ONLY a single valid JSON object " +
  "(no markdown, no code fences, no commentary) with exactly these keys:\n" +
  '- "key_verse": the single most central verse of the passage, quoted EXACTLY from the provided passage text (do not paraphrase).\n' +
  '- "key_verse_reference": the reference for that verse (e.g. "John 3:16").\n' +
  '- "understanding": an array of EXACTLY 3 multiple-choice comprehension questions. Each item is an object ' +
  'with keys: "q" (the question), "choices" (an array of EXACTLY 4 short answer options), "answer" (the ' +
  '0-based index of the correct option), and "explanation" (one sentence, grounded only in the passage text, ' +
  "saying why that answer is correct).\n" +
  '- "reflection": an array of EXACTLY 3 open-ended prompts (plain strings) that help the reader reflect on ' +
  "the passage and apply it to their own life — personal, practical, and encouraging.\n\n" +
  "Rules for the understanding questions: test plain reading comprehension of what the passage actually says " +
  "(who is speaking or acting, what happens, the immediate context, the plain main point). Base every question " +
  "and its correct answer STRICTLY on the provided passage text — never on outside facts, and never on " +
  "contested or doctrinal interpretation. Make the wrong options plausible but clearly not what the text says. " +
  "Keep choices short. Never fabricate text that is not in the passage. Output JSON only.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "Missing ANTHROPIC_API_KEY secret on the function." }, 500);
    }

    const { passage = "", reference = "" } = await req.json();
    if (!passage || !passage.trim()) {
      return json({ error: "No passage provided." }, 400);
    }

    const userContent =
      "Reference: " + reference + "\n\n" +
      "Passage:\n" + passage + "\n\n" +
      "Return the JSON object now.";

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1400,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: userContent }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return json({ error: (data && data.error && data.error.message) || "AI request failed." }, 502);
    }

    let raw = (data.content || []).map((b: { text?: string }) => b.text || "").join("").trim();
    // strip any accidental code fences
    raw = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(raw);
    } catch (_e) {
      const s = raw.indexOf("{"), e = raw.lastIndexOf("}");
      if (s === -1 || e === -1) return json({ error: "Model did not return valid JSON." }, 502);
      parsed = JSON.parse(raw.slice(s, e + 1));
    }

    // light validation / normalization
    const understanding = Array.isArray(parsed.understanding)
      ? (parsed.understanding as Array<Record<string, unknown>>).slice(0, 3).map((u) => ({
          q: String(u.q || ""),
          choices: Array.isArray(u.choices) ? (u.choices as unknown[]).slice(0, 4).map(String) : [],
          answer: Number.isInteger(u.answer) ? (u.answer as number) : 0,
          explanation: String(u.explanation || ""),
        }))
      : [];
    const reflection = Array.isArray(parsed.reflection)
      ? (parsed.reflection as unknown[]).slice(0, 3).map(String)
      : [];

    return json({
      key_verse: String(parsed.key_verse || ""),
      key_verse_reference: String(parsed.key_verse_reference || reference || ""),
      understanding,
      reflection,
    });
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
