# ICPC OUST — Cinematic 3D Scrolling Brochure

A scroll-driven Three.js experience: two tri-fold brochure spreads (six real 3D panels with hinge pivots),
a scrubbed GSAP ScrollTrigger timeline, deliberate lighting, and a simple-view fallback.

## Run

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build -> dist/
npm run preview      # serve the build -> http://localhost:4173
```
Requires Node 18+. Regenerating the derived images is optional (needs Python + Pillow):
`python3 scripts/prepare_assets.py /path/to/original/uploads`

## Structure

```
index.html            HUD markup
src/main.js           boot, mode switching (3D / simple view), render loop, resize
src/scene.js          Three.js scene: hinged sheets, lights, atmosphere, camera rig
src/animations.js     single scrubbed GSAP timeline -> state object S (fully reversible)
src/panels.js         panel artwork (canvas textures built from the real assets + original copy)
src/content.js        all brochure copy + alt text (edit spelling here)
src/assets.js         asset registry, tolerant loaders, fonts
src/ui.js             chapter dots, captions, replay
scripts/prepare_assets.py   crops/resizes the supplied originals into public/assets
public/assets/        brand/, photos/, reference/ (reference is never used as a texture)
```

## How it works

* Each sheet is an accordion Z-fold: `pivot2` hinges panel 2 on panel 1 (+π folds it behind), `pivot3` hinges
  panel 3 on panel 2 (−π). A folded flap lies on its neighbour's front face, so panel 3's back shows while it swings out.
* Spread 2 is the reverse side of the same card. The "page turn" refolds spread 1 and rotates the card about its
  vertical axis while the camera arcs round the edge. The finale lifts spread 1 above spread 2 and reopens it.
* Every tween is a `fromTo`, so the state at any scroll position is a pure function of the timeline:
  reversible and jump-safe. The render loop is event-driven (it idles when nothing moves, except for a tiny
  ambient drift in the hero and finale).
* Photographs are separate meshes lifted off the paper; the simple view bakes them into the panels.

## Responsive / accessibility

* Desktop and tablet: full 3D (lower texture/shadow quality under 1100px or on ≤4 cores).
* Phones (<700px), `prefers-reduced-motion`, or no WebGL: the stacked **Simple view** with alt text.
  The header toggle switches modes at any time.
* Chapter dots are buttons; focus rings are visible; native scrolling is never hijacked.

## Overriding panel artwork

Export clean 1024×2000 PNGs of the six panels to `public/assets/panels/panel-1.png … panel-6.png`
and set `USE_PANEL_OVERRIDES = true` in `src/assets.js`. They replace the generated textures.

## Known limitations

See `ASSET_MANIFEST.md` (missing/approximated assets). The six-panel finale is an overview;
read panel text in the focus scenes or the Simple view. Performance was only tested with a software renderer.
