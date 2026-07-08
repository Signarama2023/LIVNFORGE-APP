# North Coast — Live Demo (loggable)

Same as [`../north-coast-church/`](../north-coast-church/) (North Coast branding,
teal theme, real logo, Osborne/Brown/Jenkins speakers) **but wired to the working
LIVN FORGE backend** so you can actually **sign in and try the full app**.

**View:** https://www.livnforge.com/north-coast-demo/

## Important
- This is a **preview only.** It uses the live app's client-side keys (which are
  already public in the shipped app), so accounts and journal data created here go
  into the **LIVN FORGE** database — it is **not** isolated North Coast data.
- The real, production-bound build is [`../north-coast-church/`](../north-coast-church/),
  which points at placeholder backend values until North Coast stands up their own
  Supabase project.
- Devotional "speaker" cards show North Coast's pastors only after the
  `bible-questions` edge function is redeployed (it now honors the `teachers` list);
  until then they fall back to the built-in defaults.

Delete this folder once North Coast has their own backend and a real demo.
