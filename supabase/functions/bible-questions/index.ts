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
  "the passage and apply it to their own life.\n\n" +
  "MAKE THE QUESTIONS CREATIVE AND VARIED — not three flat 'What did X do?' questions.\n" +
  "For the 3 understanding questions, use THREE DIFFERENT angles (pick from): the turning point or pivotal " +
  "moment; cause and effect ('what led to…' / 'what was the result of…'); a contrast or comparison the passage " +
  "draws; an easy-to-miss detail; who said or did something and to whom; the immediate context or what comes " +
  "right before/after; the plain main point. Write engaging, specific question stems (not generic). Every " +
  "question and its correct answer must be answerable STRICTLY from the provided passage text — never outside " +
  "facts, never contested or doctrinal interpretation. Make the wrong options plausible but clearly not what " +
  "the text says. Keep choices short. Never fabricate text that is not in the passage.\n" +
  "VARY WHICH OPTION IS CORRECT across the three questions — do NOT always make the first option the answer; " +
  "spread the correct answer across different positions.\n" +
  "For the 3 reflection prompts, be creative and evocative — vary the framing (e.g. imagine yourself in the " +
  "scene; a specific challenge for this week; what this reveals about God; a habit or relationship to examine; " +
  "an honest question to sit with). Make them personal, practical, and encouraging — avoid clichés like " +
  "'How can you apply this to your life?'. Each of the three should feel distinct.\n\n" +
  "Output JSON only.";

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

    // Shuffle a question's choices so the correct answer's POSITION is randomized,
    // independent of any model bias toward putting it first. Recomputes the answer index.
    const shuffleMcq = (q: string, choices: string[], answer: number, explanation: string) => {
      const n = choices.length;
      if (n < 2) return { q, choices, answer: 0, explanation };
      const order = Array.from({ length: n }, (_, i) => i);
      for (let i = n - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [order[i], order[j]] = [order[j], order[i]];
      }
      const shuffled = order.map((i) => choices[i]);
      const newAnswer = order.indexOf(answer); // where the original correct choice now sits
      return { q, choices: shuffled, answer: newAnswer < 0 ? 0 : newAnswer, explanation };
    };

    // light validation / normalization (+ shuffle correct-answer position)
    const understanding = Array.isArray(parsed.understanding)
      ? (parsed.understanding as Array<Record<string, unknown>>).slice(0, 3).map((u) =>
          shuffleMcq(
            String(u.q || ""),
            Array.isArray(u.choices) ? (u.choices as unknown[]).slice(0, 4).map(String) : [],
            Number.isInteger(u.answer) ? (u.answer as number) : 0,
            String(u.explanation || ""),
          ))
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
