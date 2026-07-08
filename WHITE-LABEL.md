# 🏷️ White-Label Runbook

How to stand up the LIVN FORGE framework as a **new branded app for another
faith organization**. The framework (journaling, prayer circles, devotionals,
fitness, scoring, rewards, weekly AI review) stays the same — you swap the
brand, theme, backend, content, and App Store listing.

**Model:** one repo per organization. Copy the repo, edit one config block,
point it at that org's own Supabase project, and ship it under its own App
Store listing. Each org has fully separate users and data.

---

## The config block (the only code you edit)

Everything org-specific lives in one place: the **`WHITELABEL`** object near the
top of `index.html`'s main `<script>` (search for `const WHITELABEL`).

```js
const WHITELABEL = {
  // Brand
  name, tagline, logo, logoWomen, supportEmail,
  // Backend — this org's OWN Supabase project
  supabaseUrl, supabaseKey,
  // App Store
  appStoreId,
  // Integration keys (per org)
  bibleApiKey, revenueCatKey, revenueCatEntitlement,
  // Theme accent colors (painted over the CSS :root at load)
  theme: { gold, goldLight, goldHover, accentStart, accentEnd },
  // Devotional "speakers" — whose teaching STYLE the insight cards emulate.
  // label = heading shown in the app; style = whose style to write in. 2–4 entries.
  teachers: [ { label, style }, ... ],
};
```

**Speakers / `teachers`:** the devotional "teacher insight" cards are written in
the *style* of the pastors you list here (style impressions only — never quotes).
The app passes this list to the `bible-questions` edge function; if omitted, the
function falls back to its built-in defaults. Example:

```js
teachers: [
  { label: "Larry Osborne", style: "Larry Osborne" },
  { label: "Chris Brown",   style: "Chris Brown"   },
  { label: "Ricky Jenkins", style: "Ricky Jenkins" },
]
```

## Ready-made builds in this repo
- **`white-label-template/`** — neutral placeholder copy; the starting point for a new org.
- **`north-coast-church/`** — a worked example (North Coast Church) showing brand,
  theme, and speakers swapped. See each folder's `README.md`.

Everything else in the app reads from this — the Supabase client, edge-function
calls, App Store links (download + review), RevenueCat, the Bible API, the page
title, and the accent colors.

---

## Step-by-step

### 1. Copy the repo
Duplicate this repository to a new repo for the new org (e.g. `acme-journal`).

### 2. Stand up the org's Supabase project  ← the real work
Each org gets its **own** database so data is never shared.

1. Create a new project at **supabase.com** → note its **Project URL** and
   **publishable (anon) key** (Project Settings → API).
2. **Run the schema.** In the Supabase SQL editor, run each file in
   `supabase/db/` (order: `prayer_circles.sql` → `circle_messages.sql` →
   `delete_circle.sql` → `remove_member.sql`, then the rest:
   `circle_attachments.sql`, `moderation.sql`, `subscriptions.sql`,
   `redemptions.sql`, `push_notifications.sql`, `push_triggers.sql`).
   *(You'll also need the core tables for entries/scores/users — keep a
   `schema.sql` of those alongside these if not already captured.)*
3. **Deploy the edge functions** in `supabase/functions/` to the new project:
   ```
   supabase functions deploy <name> --project-ref <NEW_PROJECT_REF>
   ```
   Functions: `bible-questions`, `weekly-ai-summary`, `drift-coach`,
   `check-subscription`, `create-checkout-session`, `create-promo`,
   `customer-portal`, `stripe-webhook`, `send-push`, `delete-account`.
4. **Set the function secrets** (Supabase → Edge Functions → Secrets):
   - `ANTHROPIC_API_KEY` — required for the AI features (devotional questions,
     weekly review, drift coach).
   - Stripe keys (`STRIPE_SECRET_KEY`, webhook signing secret, price IDs) — only
     if the org uses web billing.
   - Push credentials (APNs/FCM) for `send-push`.

### 3. Edit the `WHITELABEL` config
Set `name`, `tagline`, `supportEmail`, the two `logo` filenames, the new
`supabaseUrl` + `supabaseKey`, the new `bibleApiKey` (get one free at
**scripture.api.bible**), the org's `revenueCatKey` + `revenueCatEntitlement`,
and the `theme` accent colors. Leave `appStoreId` until step 7.

### 4. Drop in the logos
Add the org's logo PNG(s) to the repo root and update `logo` / `logoWomen` in
the config to match the filenames (URL-encode spaces as `%20`). Also replace the
favicon/app icons.

### 5. Rebrand the content
- **Per-build content** lives in `BUILDS` (men / women) right below the config:
  `heroDesc`, `verseText`, `verseRef`, the workout `presets`, and women's
  `reflections`. Swap these for the org's voice/verses/workouts.
- **Remaining copy:** the brand name still appears in some UI/marketing strings.
  Do a find-and-replace of **`LIVN FORGE`** → the new name across `index.html`
  (and the journal-type prompts in `QUESTIONS` if the org wants different
  wording). *(Phase 2: these can be moved into the config so no find/replace is
  needed — ask and I'll abstract them.)*

### 6. Update the static files
- `privacy.html` and `terms.html` — brand name + `supportEmail`.
- `manifest.json` — app name, short name, theme color, icons.
- `CNAME` — the org's domain (if hosting on GitHub Pages).

### 7. App Store listing
1. Create a **new app** in App Store Connect (new bundle ID, new listing).
2. Copy its numeric **Apple ID** into `WHITELABEL.appStoreId`.
3. Build the native wrapper (this is a **Capacitor** app) and submit.
4. Reuse the App Store listing copy from your launch assets, rebranded.

### 8. Hosting & domain
Deploy the web build (GitHub Pages or any static host) and point the org's
domain at it. Ideally make that domain redirect to its App Store page too.

---

## Per-org checklist (what changes for every new org)

- [ ] New repo
- [ ] New Supabase project (URL + key) + schema + functions + secrets
- [ ] `WHITELABEL` config edited (brand, backend, integrations, theme)
- [ ] Logos + app icons + favicon
- [ ] `BUILDS` content (verses, workouts, reflections) rebranded
- [ ] `LIVN FORGE` strings replaced in copy
- [ ] `privacy.html`, `terms.html`, `manifest.json`, `CNAME`
- [ ] New App Store listing → `appStoreId` set
- [ ] RevenueCat app + entitlement (and/or Stripe) for that org
- [ ] Bible API key for that org
- [ ] Hosting + domain

---

## What's NOT yet config-driven (Phase 2, optional)
The framework's **content** (journal prompts, pillar names, "sons/daughters of
the King" language, fixed UI brand strings) is still inline. For a faith-org
rebrand that's usually fine (find/replace + edit `BUILDS`). If you want a new
org to be reconfigurable **without touching code**, the next step is to lift all
of that into the `WHITELABEL` config too. Say the word and I'll do it.
