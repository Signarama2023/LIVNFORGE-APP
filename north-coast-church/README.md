# North Coast Church — Example Build

A white-label instance of the app, reskinned as an example for **North Coast
Church**. Generated from the white-label template.

## What's already set (in `index.html` → `WHITELABEL`)
- **Name:** North Coast Church
- **Devotional speakers:** Larry Osborne, Chris Brown, Ricky Jenkins — the
  devotional "teacher insight" cards are written in these pastors' teaching *style*
  (style impressions, never quotes)
- **Theme:** an ocean-blue accent palette (see note below)
- **Men's & women's builds:** both kept

## ⚠️ Placeholders to finish before it's live
1. **Brand colors** — the blue palette (`theme.gold` etc.) is a *placeholder*
   approximation. Replace with North Coast's exact brand hex codes.
2. **Logos & icon** — drop in `north-coast-logo.png`, `north-coast-logo-women.png`,
   `north-coast-icon.png` (the config already points at these filenames).
3. **Backend** — `supabaseUrl` / `supabaseKey` / `bibleApiKey` / `revenueCatKey`
   are placeholders. North Coast needs their **own** Supabase project with the edge
   functions in [`../supabase/functions/`](../supabase/functions/) deployed and an
   `ANTHROPIC_API_KEY` secret set.
4. **App Store** — `appStoreId` + `productAnnual` are placeholders; set when their
   listing exists.
5. **Static pages** — rebrand `privacy.html`, `terms.html`, `manifest.json`.

## Known follow-up
- The **women's build** still uses the template's light (cream/terracotta) theme.
  Once North Coast's exact palette is set, its light theme can be tuned to match.
- Deeper content (pillar language, "sons/daughters of the King" phrasing, workouts)
  is unchanged from the framework — adjust if North Coast wants different wording.

Full setup steps: [`../WHITE-LABEL.md`](../WHITE-LABEL.md).
