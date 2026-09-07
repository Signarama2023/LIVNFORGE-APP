# Stretch illustrations

Generator for the cartoon stretch illustrations shown in the guided-stretch
panel (Steward your body → Stretching). Each move's demo image is a self-hosted
inline SVG under `assets/stretches/<slug>.svg`, mapped in `index.html` by the
`STRETCH_IMAGES` object (keyed by the exercise base name).

- `kit.mjs` — shared character kit (figure parts, palette, arrow helper).
- `poses.mjs` — one skeleton spec per stretch (joint coordinates in a 200x196 canvas).
- `build.mjs` — writes `out/<slug>.svg` for every pose and a `contact.html` review sheet.

## Regenerate
    node tools/stretch-illustrations/build.mjs
Then copy `tools/stretch-illustrations/out/*.svg` into `assets/stretches/`.

To tweak one pose, edit its joint coordinates in `poses.mjs` and regenerate.
