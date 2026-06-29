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
  "You are a Bible-study guide for LIVN FORGE, a Christian journaling app. The reader tells you the verses they have " +
  "just read (assume the NIV translation) and you help them DIVE IN and UNDERSTAND the passage — what it means, the " +
  "key points, and how trusted pastors would teach it. Be warm, clear, faithful, and reverent, with a high view of " +
  "Scripture.\n\n" +
  "You are given a Bible passage and its reference. Respond with ONLY a single valid JSON object (no markdown, no " +
  "code fences, no commentary) with exactly these keys:\n" +
  '- "key_verse": the single most central verse of the passage, quoted EXACTLY from the provided passage text (do ' +
  "not paraphrase).\n" +
  '- "key_verse_reference": its reference (e.g. "John 3:16").\n' +
  '- "summary": a clear, general summary of the passage in 3-5 sentences — what is happening, the main idea, and ' +
  "where it points. Plain and faithful to the text.\n" +
  '- "key_points": an array of 3 to 5 short strings, each a key takeaway or important truth drawn directly from ' +
  "THIS passage — the things worth understanding and remembering.\n" +
  '- "teacher_insights": an array of EXACTLY 3 objects capturing the TEACHING STYLE of pastors Joby Martin, Matt ' +
  'Chandler, and Chris Brown, in that order. Each object has keys "teacher" (set to EXACTLY "Joby Style", "Matt ' +
  'Style", and "Chris Style" respectively) and "insight" (2-3 sentences written as how that teacher MIGHT talk ' +
  "about THIS passage in their characteristic style — gospel-centered, grace-filled, application-driven — e.g. " +
  '"Joby might put it like this: ...", "Matt would probably land on ...". This is a STYLE IMPRESSION, not a quote: ' +
  "NEVER present anything as a verbatim quotation, NEVER claim they actually said a specific thing, and NEVER " +
  "invent quotes, sermons, or biographical facts.\n" +
  '- "reflection": an array of EXACTLY 2 open-ended reflection questions (plain strings) that move the reader ' +
  "toward Jesus and honest, personal response — grace-filled, practical, never mere self-improvement.\n\n" +
  "The summary and key points must stay anchored to the plain meaning of the provided passage in its context. " +
  "NEVER TAKE LIBERTIES WITH SCRIPTURE: do not invent or misquote verses, do not add doctrine the text does not " +
  "teach, do not put words in God's mouth, do not speculate beyond what is written, and do not push contested " +
  "sectarian positions. When unsure, stay with the plain meaning of the passage.\n\n" +
  "Output JSON only.";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "Missing ANTHROPIC_API_KEY secret on the function." }, 500);
    }

    const { passage = "", reference = "", debug = false } = await req.json();
    if (!passage || !passage.trim()) {
      return json({ error: "No passage provided." }, 400);
    }

    const userContent =
      "Reference: " + reference + "\n\n" +
      "Passage:\n" + passage + "\n\n" +
      "Return the JSON object now.";

    // Parse the model's text into the JSON object we expect, tolerating stray
    // prose or code fences around it. Returns null if it can't be parsed.
    const tryParse = (raw: string): Record<string, unknown> | null => {
      const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();
      try { return JSON.parse(cleaned); } catch (_e) { /* fall through */ }
      const s = cleaned.indexOf("{"), e = cleaned.lastIndexOf("}");
      if (s === -1 || e === -1 || e <= s) return null;
      try { return JSON.parse(cleaned.slice(s, e + 1)); } catch (_e2) { return null; }
    };

    // The model is non-deterministic and occasionally emits malformed JSON (a
    // dropped comma, an unescaped quote), independent of passage length. A fresh
    // generation almost always parses, so retry a couple of times before failing.
    let parsed: Record<string, unknown> | null = null;
    let lastDebug: Record<string, unknown> | null = null;
    let sawMaxTokens = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      const resp = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": ANTHROPIC_API_KEY,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: MODEL,
          // Headroom: the richer output (3 MCQs with explanations + 3 reflection
          // prompts + key verse) ran past the old 1800 ceiling on longer/denser
          // passages, truncating the JSON mid-array. 4096 comfortably fits it.
          max_tokens: 4096,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });

      const data = await resp.json();
      if (!resp.ok) {
        // Overloaded / rate-limited: worth another attempt. Hard errors: stop.
        if ((resp.status === 429 || resp.status >= 500) && attempt < 2) continue;
        return json({ error: (data && data.error && data.error.message) || "AI request failed." }, 502);
      }

      const raw = (data.content || []).map((b: { text?: string }) => b.text || "").join("").trim();
      if (data.stop_reason === "max_tokens") sawMaxTokens = true;
      if (debug) lastDebug = { stop_reason: data.stop_reason, usage: data.usage, length: raw.length, raw };

      parsed = tryParse(raw);
      if (parsed) break; // got valid JSON — done
      // else loop and try again with a fresh generation
    }

    if (debug) return json({ debug: true, parsedOk: !!parsed, ...(lastDebug || {}) });

    if (!parsed) {
      // Truncation can't be salvaged by a retry at the same ceiling, so name it.
      if (sawMaxTokens) {
        return json({ error: "That passage was a bit long for the study to finish — try a shorter passage or a few verses." }, 502);
      }
      return json({ error: "The study couldn't be generated just now. Please try again." }, 502);
    }

    // light validation / normalization for the understanding-focused output
    const summary = String(parsed.summary || "").trim();
    const key_points = Array.isArray(parsed.key_points)
      ? (parsed.key_points as unknown[]).slice(0, 6).map(String).map((s) => s.trim()).filter(Boolean)
      : [];
    const teacher_insights = Array.isArray(parsed.teacher_insights)
      ? (parsed.teacher_insights as Array<Record<string, unknown>>).slice(0, 3)
          .map((t) => ({ teacher: String(t.teacher || "").trim(), insight: String(t.insight || "").trim() }))
          .filter((t) => t.teacher && t.insight)
      : [];
    const reflection = Array.isArray(parsed.reflection)
      ? (parsed.reflection as unknown[]).slice(0, 3).map(String).map((s) => s.trim()).filter(Boolean)
      : [];

    return json({
      key_verse: String(parsed.key_verse || ""),
      key_verse_reference: String(parsed.key_verse_reference || reference || ""),
      summary,
      key_points,
      teacher_insights,
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
