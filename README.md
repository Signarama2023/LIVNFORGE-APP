# Daily Forge (reframe-journal)

A faith-and-discipline journaling app for men — "Rise Up Kings." Users log entries across
seven journal types (Free Flow, Guided, Re-Frame, Devotional, Prayer Requests, Fitness
Routine, Gratitude), earn points and streaks, compete on a group leaderboard, and get an
AI-written weekly review.

**Live site:** https://signarama2023.github.io/reframe-journal/

## How it's built

- **`index.html`** — the entire app. One self-contained file: HTML + CSS + JavaScript.
  No build step.
- **Hosting** — GitHub Pages, served from the `main` branch of this repo. Every commit to
  `main` auto-deploys in about a minute (see the repo's Deployments panel).
- **Backend** — Supabase project `ihhctwmgfleihlnfnfsv` ("Signarama2023's Project"):
  - **Auth**: Supabase email/password accounts (with password reset).
  - **`entries` table**: all journal entries, per user. The app keeps an in-memory cache
    and refreshes from the cloud on sign-in and after writes.
  - **`scores` table**: group leaderboard totals (points/entries/streak per group code).
  - **Edge Function `weekly-ai-summary`**: generates the AI weekly review. Source lives in
    `supabase/functions/weekly-ai-summary/index.ts` in this repo; the deployed copy is
    managed in the Supabase dashboard (Edge Functions → weekly-ai-summary → Code →
    Deploy updates). It calls Anthropic's Claude Haiku and requires a project secret named
    `ANTHROPIC_API_KEY` (Edge Functions → Secrets).

## Features added June 2026

- **Weekly summary view** — "View Weekly Summary" button on the landing page (and a text
  link at the bottom). Shows entries, points, days journaled, breakdown by journal type,
  and the week's entries, with Prev/Next week navigation.
- **AI weekly review** — "Generate AI summary" inside the weekly summary. Sends the week's
  full entry text to the Edge Function; Claude writes a faith-focused, Rise Up Kings-toned
  review (four pillars: Faith, Family, Fitness, Finances). Cached per week in localStorage,
  so it only costs an API call when generated/regenerated (a fraction of a cent each).
- **Email / Download / Save** — email the stats summary to yourself, download it as text,
  or archive snapshots in the app.
- **Weekend banner** — on Saturday/Sunday the landing page nudges you to review and send
  your weekly summary.

## Working across two computers — read this first

**GitHub `main` is the single source of truth.** The live site always serves what's on
`main`, so:

1. **Before editing on any machine, get the latest from GitHub first.** Don't trust a
   local copy that's been sitting around — it may be behind.
2. **Push/commit as soon as a change is done.** Never leave finished work undeployed on
   one machine.
3. Local working copies (including the OneDrive folder) are scratch space, not backups.
   GitHub is the backup.
4. The Supabase function is deployed separately in the Supabase dashboard. If you change
   `supabase/functions/weekly-ai-summary/index.ts`, also paste/deploy it in the dashboard,
   and keep this repo copy in sync so both computers can see it.

## Costs

- GitHub Pages: free. Supabase: free tier. Anthropic API: pay-as-you-go; weekly summaries
  use Claude Haiku at well under a cent per generation.
