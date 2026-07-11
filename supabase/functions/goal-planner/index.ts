// Supabase Edge Function: goal-planner
// Powers the Goals feature. The client sends a goal (title, optional why,
// timeframe, start date) and this returns an AI-drafted plan: milestones
// matched to the timeframe plus a few small recurring daily actions.
// Requires a project secret named ANTHROPIC_API_KEY (already set for the
// other AI functions).
//
// Deploy:  supabase functions deploy goal-planner --project-ref ihhctwmgfleihlnfnfsv
//
// Request body:
//   {
//     title: "Run a half marathon",
//     why: "..." | "",
//     timeframe: "weekly" | "monthly" | "yearly",
//     startDate: "2026-07-10",          // user's local date
//     name: "Mark" | "",
//     build: "men" | "women"
//   }
//
// Response:
//   {
//     milestones: [{ key, label, title, detail }],  // 7 days / 4 weeks / 12 months
//     daily: [{ id, title }],                        // [] for weekly goals
//     note: "one short encouraging line"
//   }

import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
const MODEL = "claude-sonnet-4-6";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Slot = { key: string; label: string };

// Build the exact milestone slots for the timeframe so the model fills a fixed
// skeleton — keys and labels are OURS, only titles/details come from the model.
function slotsFor(timeframe: string, startDate: string): Slot[] {
  const start = new Date(startDate + "T12:00:00Z"); // noon UTC dodges DST edges
  const out: Slot[] = [];
  if (timeframe === "weekly") {
    for (let i = 0; i < 7; i++) {
      const d = new Date(start.getTime() + i * 86400000);
      const key = d.toISOString().slice(0, 10);
      out.push({
        key,
        label: d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" }),
      });
    }
  } else if (timeframe === "monthly") {
    for (let i = 0; i < 4; i++) {
      const a = new Date(start.getTime() + i * 7 * 86400000);
      const b = new Date(a.getTime() + 6 * 86400000);
      const f = (d: Date) => d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
      out.push({ key: "W" + (i + 1), label: "Week " + (i + 1) + " · " + f(a) + "–" + f(b) });
    }
  } else {
    for (let i = 0; i < 12; i++) {
      const d = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + i, 1));
      out.push({
        key: d.toISOString().slice(0, 7),
        label: d.toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" }),
      });
    }
  }
  return out;
}

function persona(build: string) {
  return build === "women"
    ? { addr: "a daughter of the King", voice: "warm, encouraging, sisterly" }
    : { addr: "a son of the King", voice: "direct, encouraging, brotherly" };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    if (!ANTHROPIC_API_KEY) return json({ error: "AI is not configured." }, 500);

    const body = await req.json();
    const title = String(body.title || "").slice(0, 200).trim();
    const why = String(body.why || "").slice(0, 500).trim();
    const timeframe = ["weekly", "monthly", "yearly"].includes(body.timeframe) ? body.timeframe : "weekly";
    const startDate = /^\d{4}-\d{2}-\d{2}$/.test(String(body.startDate || "")) ? body.startDate : new Date().toISOString().slice(0, 10);
    const name = String(body.name || "").slice(0, 60).trim();
    const build = body.build === "women" ? "women" : "men";
    if (!title) return json({ error: "Missing goal title." }, 400);

    const slots = slotsFor(timeframe, startDate);
    const p = persona(build);
    const wantsDaily = timeframe !== "weekly";

    const unitWord = timeframe === "weekly" ? "day" : timeframe === "monthly" ? "week" : "month";
    const system =
      `You are a practical, faith-friendly goal coach inside LIVN FORGE, a daily journal app. ` +
      `You are helping ${name || "someone"}, ${p.addr}, break a real goal into an achievable plan. ` +
      `Your tone is ${p.voice} — concrete and actionable, never fluffy or generic. ` +
      `You respond with ONLY valid JSON. No markdown fences, no commentary.`;

    const userPrompt =
      `THE GOAL (${timeframe}): ${title}\n` +
      (why ? `WHY IT MATTERS TO THEM: ${why}\n` : "") +
      `START DATE: ${startDate}\n\n` +
      `Fill in this exact plan skeleton. There are ${slots.length} ${unitWord} milestones; keep the keys and order EXACTLY as given:\n` +
      slots.map((s) => `  ${s.key}  (${s.label})`).join("\n") + "\n\n" +
      `Respond with ONLY this JSON shape:\n` +
      `{\n` +
      `  "milestones": [\n` +
      `    { "key": "<exact key from the skeleton>",\n` +
      `      "title": "<the ONE concrete, measurable thing to accomplish that ${unitWord} — specific to THIS goal, building progressively toward it>",\n` +
      `      "detail": "<one short sentence of how/why, practical>" }\n` +
      `  ],\n` +
      (wantsDaily
        ? `  "daily": [ { "id": "d1", "title": "<small daily action, 5-20 min>" }, { "id": "d2", "title": "..." } ],\n`
        : `  "daily": [],\n`) +
      `  "note": "<ONE short encouraging sentence${name ? " addressed to " + name : ""} about this plan>"\n` +
      `}\n\n` +
      `RULES:\n` +
      `- One milestone object per skeleton key, all ${slots.length} of them, in order.\n` +
      `- Milestones must build progressively: early ones easier/foundational, later ones closer to the finished goal, the last one IS achieving the goal.\n` +
      `- Titles under 12 words, measurable where possible (numbers, distances, counts).\n` +
      (wantsDaily
        ? `- Give 2 or 3 daily actions: small recurring habits that compound toward the goal (each 5-20 minutes).\n`
        : `- "daily" must be an empty array for a weekly goal — the 7 day milestones ARE the daily plan.\n`) +
      `- Stay practical and specific to the goal. If the goal is spiritual, scripture references are welcome; otherwise don't force faith language.`;

    const resp = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 2500,
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

    let parsed: {
      milestones?: { key?: string; title?: string; detail?: string }[];
      daily?: { id?: string; title?: string }[];
      note?: string;
    };
    try {
      parsed = JSON.parse(raw.replace(/```json|```/g, "").trim());
    } catch (_e) {
      return json({ error: "Could not parse the AI response. Try again." }, 502);
    }

    // Snap the response onto our skeleton: every slot gets a milestone (by key,
    // falling back to position), so the client can rely on shape and order.
    const byKey = new Map<string, { title?: string; detail?: string }>();
    (parsed.milestones || []).forEach((m) => { if (m && m.key) byKey.set(String(m.key), m); });
    const milestones = slots.map((s, i) => {
      const m = byKey.get(s.key) || (parsed.milestones || [])[i] || {};
      return {
        key: s.key,
        label: s.label,
        title: String(m.title || "Make progress on: " + title).slice(0, 140),
        detail: String(m.detail || "").slice(0, 200),
      };
    });
    const daily = wantsDaily
      ? (parsed.daily || []).slice(0, 3).map((d, i) => ({
          id: "d" + (i + 1),
          title: String((d && d.title) || "").slice(0, 120),
        })).filter((d) => d.title)
      : [];

    return json({ milestones, daily, note: String(parsed.note || "").slice(0, 240) });
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
