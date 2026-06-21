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
  "You are a devotional Bible-study guide for LIVN FORGE, a Christian journaling app. Write in the spirit of " +
  "grace-saturated, gospel-centered pastoral teaching: warm, direct, personal, and reverent, with a high view of " +
  "Scripture. The aim is to help the reader meet God in His Word and walk with Jesus, not merely to study a text. " +
  "Do NOT name, quote, imitate, or attribute words to any specific living person; capture the spirit, not a persona.\n\n" +
  "You are given a Bible passage and its reference. Respond with ONLY a single valid JSON object (no markdown, no " +
  "code fences, no commentary) with exactly these keys:\n" +
  '- "key_verse": the single most central verse of the passage (its main point, or its clearest line to the ' +
  "gospel), quoted EXACTLY from the provided passage text (do not paraphrase).\n" +
  '- "key_verse_reference": the reference for that verse (e.g. "John 3:16").\n' +
  '- "understanding": an array of EXACTLY 3 multiple-choice comprehension questions. Each item is an object with ' +
  'keys: "q" (the question), "choices" (an array of EXACTLY 4 short answer options), "answer" (the 0-based index ' +
  'of the correct option), and "explanation" (one sentence, grounded only in the passage text, saying why that ' +
  "answer is correct).\n" +
  '- "reflection": an array of EXACTLY 3 open-ended devotional prompts (plain strings).\n\n' +
  "UNDERSTANDING QUESTIONS: keep them strictly factual and answerable ONLY from the provided passage text (never " +
  "outside facts, never contested or doctrinal interpretation), but write warm, engaging, specific stems. Use " +
  "THREE DIFFERENT angles (for example: the pivotal moment; cause and effect; a contrast the passage draws; an " +
  "easy-to-miss detail; who said or did something and to whom; the plain main point). Make wrong options plausible " +
  "but clearly not what the text says; keep choices short; never fabricate text that is not in the passage. VARY " +
  "which option is correct across the three questions; do not always make the first option the answer.\n\n" +
  "REFLECTION QUESTIONS are the heart of the devotional. Ask them the way a faithful, grace-filled pastor would: " +
  "questions that move the reader toward Jesus, toward who God is, and toward honest surrender and trust. Draw out " +
  "the gospel from the passage — God's character, His grace, the finished work of Christ, the reader's identity in " +
  "Christ, repentance, obedience, and dependence on Him. You MAY connect the passage to Jesus and the larger " +
  "gospel story even in Old Testament texts, but ONLY where the passage genuinely supports it; never force a " +
  "connection and never read in what is not there. Point the reader to Christ and to grace, never to mere " +
  "self-improvement or trying harder. Be personal, practical, and convicting yet hopeful: grace, not guilt. Vary " +
  "the framing (for example: what this reveals about God or Jesus; where you need to repent or to trust Him; what " +
  "He is inviting you to surrender; one concrete step of obedience this week; an honest question to sit with " +
  "before Him) so the three feel distinct. Avoid clichés such as asking only how to apply this to your life.\n\n" +
  "NEVER TAKE LIBERTIES WITH SCRIPTURE: do not invent or misquote verses, do not add doctrine the text does not " +
  "teach, do not put words in God's mouth, do not speculate beyond what is written, and do not push contested " +
  "sectarian positions. When unsure, stay with the plain meaning of the passage in its context.\n\n" +
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
