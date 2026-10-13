"""Derive the web-ready assets in public/assets from the supplied originals.
Usage: python3 scripts/prepare_assets.py /path/to/uploads
The originals are never modified. Everything produced here is a crop / resize /
(light-on-dark recolour of the wordmark only) of the supplied files."""
import sys, numpy as np
from PIL import Image
src = sys.argv[1] if len(sys.argv) > 1 else '/mnt/user-data/uploads'
out = 'public/assets'
P = lambda n: f'{src}/{n}'

# --- logo (3555x5040 RGBA) -------------------------------------------------
logo = Image.open(P('1791845906224_image.png')).convert('RGBA')
stone = logo.crop((0, 0, 3555, 3776))
stone.resize((1200, round(3776 * 1200 / 3555)), Image.LANCZOS).save(f'{out}/brand/logo-mark.png', optimize=True)

# light-on-dark lockup: same artwork; only the dark teal/navy wordmark pixels are
# lightened so they stay legible on the navy brochure (as in the supplied banner).
a = np.array(logo)
w = a[4000:4800].copy()
r, g, b, al = [w[..., i].astype(int) for i in range(4)]
dark = (r < 45) & (g < 105) & (b < 115) & (al > 0)
w[dark, 0:3] = (244, 246, 250)
word = Image.fromarray(w)
canvas = Image.new('RGBA', (3555, 4800), (0, 0, 0, 0))
canvas.paste(stone, (0, 0)); canvas.paste(word, (0, 4000), word)
canvas = canvas.crop(canvas.getbbox())
canvas.resize((1200, round(canvas.height * 1200 / canvas.width)), Image.LANCZOS).save(f'{out}/brand/logo-lockup-light.png', optimize=True)

# --- university lockup (crop of the supplied banner; already light-on-dark) -------
ban = Image.open(P('1791845888826_image.png')).convert('RGB')
ban.crop((70, 582, 470, 716)).save(f'{out}/brand/oust-university-lockup.png', optimize=True)

# --- photographs -------------------------------------------------------------
def photo(name, dst, maxw=1600):
    im = Image.open(P(name)).convert('RGB')
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(f'{out}/photos/{dst}', quality=86, optimize=True, progressive=True)
photo('1791845868547_image.png', 'community-lawn.jpg')
photo('1791845876645_image.png', 'oust-flag-finalists.jpg')
photo('1791845888826_image.png', 'icpc-oust-team.jpg', 2050)

# --- reference only (never used as textures) ------------------------------------
Image.open(P('1791845849930_image.png')).save(f'{out}/reference/canva-layout-reference.png')
print('ok')
