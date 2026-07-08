# White-Label Template

A **branding-neutral copy** of the app, ready to turn into a new org's build. All
placeholders are obvious (`Your Brand`, `YOUR_SUPABASE_URL`, `#c99a3b`, etc.).

This is the starting point — copy this folder, rename it, and fill it in. Full
process: [`../WHITE-LABEL.md`](../WHITE-LABEL.md).

## What to edit in `index.html`
Everything org-specific is in the **`WHITELABEL`** config block near the top of the
main `<script>` (search `const WHITELABEL`):

- **Brand:** `name`, `tagline`, `logo`, `logoWomen`, `supportEmail`
- **Backend:** `supabaseUrl`, `supabaseKey` — the org's **own** Supabase project
- **Integrations:** `bibleApiKey`, `revenueCatKey`, `revenueCatEntitlement`, `appStoreId`
- **Theme:** `theme` accent colors (painted over the CSS at load)
- **Speakers:** `teachers` — whose teaching *style* the devotional insight cards emulate
  (`label` = heading shown; `style` = whose style to write in; 2–4 entries)

Also swap the brand wordmark in the hero `<h1>` and drop in the real assets:
`logo.png`, `logo-women.png`, `icon.png`, plus `privacy.html` / `terms.html` /
`manifest.json` for the org.

## Backend (required to actually run)
Stand up the org's own Supabase project and deploy the edge functions in
[`../supabase/functions/`](../supabase/functions/) to it (`bible-questions`,
`weekly-ai-summary`, `drift-coach`, billing/push/account functions). Set the
`ANTHROPIC_API_KEY` secret. See `../WHITE-LABEL.md` for the full checklist.

> Until a real Supabase project + keys are in place, sign-in and cloud sync won't
> work — but the UI renders so you can preview branding and theme.
