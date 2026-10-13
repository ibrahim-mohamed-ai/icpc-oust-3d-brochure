# Asset manifest

## Supplied files → use

| Supplied file | Derived file | Used for |
|---|---|---|
| `…906224_image.png` (3555×5040 RGBA logo) | `public/assets/brand/logo-mark.png` | Header mark |
| same | `public/assets/brand/logo-lockup-light.png` | Panels 1 and 4. Only the dark teal/navy wordmark pixels are lightened for legibility on navy; artwork otherwise untouched |
| `…888826_image.png` (2050×780 banner) | `public/assets/photos/icpc-oust-team.jpg` | Panel 6, second photo |
| same | `public/assets/brand/oust-university-lockup.png` (crop) | Panel 4 sponsor lockup (sits on its own dark plate) |
| `…868547_image.png` | `public/assets/photos/community-lawn.jpg` | Panel 2 photo |
| `…876645_image.png` | `public/assets/photos/oust-flag-finalists.jpg` | Panel 6, first photo |
| `…849930_image.png` (Canva screenshot) | `public/assets/reference/canva-layout-reference.png` | Copy/layout reference ONLY, never a texture |
| `…913243_image.png` (AI mockup) | not used | Its text is garbled and mislabels the brand |

## Panel mapping

| # | Panel | Contents |
|---|---|---|
| 1 | Spread 1 · cover | Logo lockup, "Same Dream / Bigger Together" |
| 2 | Spread 1 · inner left | Who We Are?, What We Do?, lawn photo |
| 3 | Spread 1 · inner right | What Is ICPC?, The Journey, what you get at each stage |
| 4 | Spread 2 · branding | Logo lockup, OUST sponsor lockup |
| 5 | Spread 2 · inner left | Our Vision This Season |
| 6 | Spread 2 · inner right | What We Did, Our Teams, two photos |

## Missing or approximated (need supplying)

1. Clean exports of the six panels (the only source is a 542px screenshot). Panels are rebuilt from real assets + transcribed copy.
2. Cover illustration (person at laptop) and the crown / "Think… Solve…" doodles. Omitted, not invented.
3. High-resolution OUST pyramid logo (a small banner crop is used).
4. Panel back-face artwork (backs are plain navy).
5. The small icons and the mountain/flag doodle are approximations drawn in code, not the original illustrations.

## Copy notes

* Corrected source typos: "Univeristy", "Builed", "Competetive" (marked `// FIX` in `src/content.js`).
* The first Journey row's subtitle is reproduced exactly as in the screenshot; it may be a source slip.
