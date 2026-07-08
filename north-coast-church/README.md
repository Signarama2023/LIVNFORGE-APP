# North Coast Church — Example Build

A white-label instance of the app, reskinned as an example for **North Coast
Church**. Generated from the white-label template.

## What's already set (in `index.html` → `WHITELABEL`)
- **Name:** North Coast Church
- **Devotional speakers:** Larry Osborne, Chris Brown, Ricky Jenkins — the
  devotional "teacher insight" cards are written in these pastors' teaching *style*
  (style impressions, never quotes)
- **Theme:** North Coast's brand palette from their logo — deep teal ground
  (`#173a36`), cream text (`#f1e9db`), dusty-blue accent (`#8fb8c4`)
- **Men's & women's builds:** both kept

## ⚠️ Placeholders to finish before it's live
1. **Logos & icon** — drop in `north-coast-logo.png`, `north-coast-logo-women.png`,
   `north-coast-icon.png` (the config already points at these filenames). A
   transparent-background PNG works best on the teal surfaces.
2. **Backend** — `supabaseUrl` / `supabaseKey` / `bibleApiKey` / `revenueCatKey`
   are placeholders. North Coast needs their **own** Supabase project with the edge
   functions in [`../supabase/functions/`](../supabase/functions/) deployed and an
   `ANTHROPIC_API_KEY` secret set.
3. **App Store** — `appStoreId` + `productAnnual` are placeholders; set when their
   listing exists.
4. **Static pages** — rebrand `privacy.html`, `terms.html`, `manifest.json`.

## Known follow-up
- The **women's build** still uses the light (cream/terracotta) theme. Its light
  palette can be re-tuned to North Coast's cream + teal if you want it to match.
- The sign-in **hero band** at the very top still uses the default dark gradient
  (literal CSS, not theme-driven) — can be tealed if desired.
- Deeper content (pillar language, "sons/daughters of the King" phrasing, workouts)
  is unchanged from the framework — adjust if North Coast wants different wording.

Full setup steps: [`../WHITE-LABEL.md`](../WHITE-LABEL.md).
