// Supabase Edge Function: drift-coach
// Powers the "Drift Fix" journal tool. The client sends honest reflections for
// one area of life and this returns personalized Scripture + action steps + a prayer.
// Requires a project secret named ANTHROPIC_API_KEY.
//
// Deploy:  supabase functions deploy drift-coach --project-ref ihhctwmgfleihlnfnfsv
// Secret:  ANTHROPIC_API_KEY = <your key>   (already set for the other AI functions)
//
// Request body:
//   {
//     phase: "guidance" | "actions",
//     area: "marriage" | ... ,
//     areaLabel: "Marriage",
//     slider: 5,                       // 1-10, how far off they feel
//     questions: ["q1 text", "q2 text", "q3 text"],
//     reflections: { q1: "...", q2: "...", q3: "..." },
//     pickedScripture: { ref, text } | null,   // only for phase "actions"
//     build: "men" | "women"
//   }
//
// Responses:
//   phase "guidance" -> { scriptures: [{ref,text,why}], insight }
//   phase "actions"  -> { actions: [{icon,action,detail}], prayer }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function persona(build: string) {
  return build === "women"
    ? {
        who: "a woman who recognizes she's drifting",
        rel: "her husband",
        identity: "a daughter of the King",
        pronoun: "her",
        subj: "she",
      }
    : {
        who: "a man who recognizes he's drifting",
        rel: "his wife",
        identity: "a son of the King",
        pronoun: "him",
        subj: "he",
      };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });

  try {
    if (!ANTHROPIC_API_KEY) {
      return json({ error: "Missing ANTHROPIC_API_KEY secret on the function." }, 500);
    }

    const {
      phase = "guidance",
      areaLabel = "this area",
      slider = 5,
      questions = [],
      reflections = {},
      pickedScripture = null,
      build = "men",
    } = await req.json();

    const p = persona(build);

    const reflectionText = (questions as string[])
      .map((q, i) => `Q: "${q}"\nA: "${(reflections as Record<string, string>)["q" + (i + 1)] || "(no answer)"}"`)
      .join("\n\n");

    const driftDepth = slider <= 3 ? "deep in drift" : slider <= 6 ? "struggling" : "slightly off";

    let system: string;
    let userPrompt: string;

    if (phase === "actions") {
      system =
        `You are a Christian life coach and accountability partner for ${p.who}. ` +
        `You give specific, practical, doable action steps — not vague advice. Your tone is direct ` +
        `and encouraging, never shaming. Respond ONLY with valid JSON, no markdown, no preamble.`;

      userPrompt =
        `${p.subj[0].toUpperCase() + p.subj.slice(1)} is doing a drift check. Based on what ${p.subj} shared, give ${p.pronoun} 2-3 concrete first steps.\n\n` +
        `Drift area: ${areaLabel} (rated ${slider}/10)\n\n` +
        `Honest reflections:\n${reflectionText}\n\n` +
        `Scripture ${p.subj} chose: "${pickedScripture ? (pickedScripture.ref || "") + " — " + (pickedScripture.text || "") : "not selected yet"}"\n\n` +
        `Return JSON with this exact structure:\n` +
        `{\n` +
        `  "actions": [\n` +
        `    {\n` +
        `      "icon": "single emoji",\n` +
        `      "action": "One clear, specific thing ${p.subj} can do TODAY or this week — grounded in what ${p.subj} actually shared, not generic advice",\n` +
        `      "detail": "1 sentence of personal encouragement that references what ${p.subj} wrote, not platitudes"\n` +
        `    }\n` +
        `  ],\n` +
        `  "prayer": "A 2-3 sentence prayer written in first person (I/my). It should sound like ${p.pronoun.toUpperCase()} praying based on what ${p.subj} just shared — naming the specific wound, fear, or failure, and turning it toward God. Raw and honest, not polished and religious."\n` +
        `}`;
    } else {
      system =
        `You are a spiritually mature Christian mentor helping ${p.who}. You write with warmth, ` +
        `directness, and biblical depth — like a trusted pastor or accountability partner. You never ` +
        `shame. You always point toward grace and action. Respond ONLY with valid JSON, no markdown, no preamble.`;

      userPrompt =
        `${p.subj[0].toUpperCase() + p.subj.slice(1)} is doing a drift check. Here is the situation:\n\n` +
        `Drift area: ${areaLabel} (self-rated ${slider}/10 — ${driftDepth})\n\n` +
        `Honest reflections to these questions:\n${reflectionText}\n\n` +
        `Based on what ${p.subj} specifically wrote — the exact words, the emotional state, what ${p.subj} is admitting — ` +
        `return a JSON object with this exact structure:\n` +
        `{\n` +
        `  "scriptures": [\n` +
        `    {\n` +
        `      "ref": "Book Chapter:Verse",\n` +
        `      "text": "The actual scripture text (ESV preferred)",\n` +
        `      "why": "2-3 sentences explaining why THIS verse speaks directly to what ${p.subj} shared. Reference ${p.pronoun} actual words. Don't be generic."\n` +
        `    }\n` +
        `  ],\n` +
        `  "insight": "2-3 sentences of direct, honest, compassionate pastoral insight addressed to ${p.pronoun} personally. Acknowledge what ${p.subj} is actually feeling, name what ${p.subj} may not have named, and point toward grace — not guilt."\n` +
        `}\n\n` +
        `Return 2-3 scriptures. Match the emotional and spiritual weight of what ${p.subj} shared. ` +
        `If ${p.subj} expressed shame, speak to shame. If anger at God, speak to that. If fear, speak to that. ` +
        `Never fabricate or misquote scripture.`;
    }

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        system,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await resp.json();
    if (!resp.ok) {
      return json({ error: (data && data.error && data.error.message) || "AI request failed." }, 502);
    }

    const raw = (data.content || [])
      .map((b: { text?: string }) => b.text || "")
      .join("")
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (_e) {
      return json({ error: "Could not parse the AI response. Try again." }, 502);
    }

    return json(parsed);
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors, "content-type": "application/json" },
  });
}
