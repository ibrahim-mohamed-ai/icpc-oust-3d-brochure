// Asset registry, tolerant loaders and font loading.
const BASE = import.meta.env.BASE_URL;
const url = (p) => `${BASE}assets/${p}`;

export const ASSETS = {
  logoMark: url('brand/logo-mark.png'),
  logoLockup: url('brand/logo-lockup-light.png'),
  uni: url('brand/oust-university-lockup.png'),
  lawn: url('photos/community-lawn.jpg'),
  flag: url('photos/oust-flag-finalists.jpg'),
  team: url('photos/icpc-oust-team.jpg'),
};

// Optional drop-in: if clean exported panel artwork is supplied as
// public/assets/panels/panel-1.png … panel-6.png it replaces the generated texture.
// Set USE_PANEL_OVERRIDES to true once those files exist (avoids pointless 404 requests otherwise).
export const USE_PANEL_OVERRIDES = false;
export const PANEL_OVERRIDES = [1, 2, 3, 4, 5, 6].map((i) => url(`panels/panel-${i}.png`));

const warned = new Set();
export function loadImage(src) {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => {
      if (!warned.has(src)) { warned.add(src); console.warn(`[assets] could not load ${src}`); }
      resolve(null);
    };
    img.src = src;
  });
}

export async function loadFonts() {
  const specs = ['400 32px Poppins', '600 32px Poppins', '700 32px Poppins', '400 32px "Permanent Marker"', '700 32px Caveat', '400 32px Caveat'];
  try { await Promise.all(specs.map((s) => document.fonts.load(s))); } catch (e) { console.warn('[assets] font loading failed, using fallbacks', e); }
}

export async function loadAll(onProgress = () => {}) {
  const keys = Object.keys(ASSETS);
  let done = 0;
  const tick = () => onProgress(++done / (keys.length + 2));
  const entries = await Promise.all(keys.map(async (k) => { const img = await loadImage(ASSETS[k]); tick(); return [k, img]; }));
  const overrides = USE_PANEL_OVERRIDES ? await Promise.all(PANEL_OVERRIDES.map((u) => loadImage(u))) : PANEL_OVERRIDES.map(() => null);
  tick();
  await loadFonts();
  tick();
  return { images: Object.fromEntries(entries), overrides };
}
