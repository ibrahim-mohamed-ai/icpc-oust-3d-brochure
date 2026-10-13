// Procedural panel artwork. Each panel is composed from the supplied logos / photographs plus the
// original brochure copy, drawn as sharp vector text on a 1024×2000 canvas (panel aspect ≈ 0.512,
// matching the supplied layout). Photographs are returned separately so the 3D scene can lift
// them off the paper; the simple view bakes them in.
import { CONTENT as C, PANEL_ALT } from './content.js';

export const PW = 1024;
export const PH = 2000;
export const ASPECT = PH / PW;

const NAVY = '#0a1d4d', NAVY_D = '#050f2e', GOLD = '#f4b73a', INK = '#14224a', PAPER = '#e9e9ec';
const RED = '#c0392b', BLUE = '#4a7dc2', MUTE = '#aeb7c9';
const F = {
  head: '"Permanent Marker", "Comic Sans MS", cursive',
  body: 'Poppins, system-ui, -apple-system, "Segoe UI", sans-serif',
  hand: 'Caveat, "Segoe Script", cursive',
};

/* ---------- helpers ---------- */
function rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
}

let noiseTile;
function grain(ctx, alpha = 0.05) {
  if (!noiseTile) {
    noiseTile = document.createElement('canvas'); noiseTile.width = noiseTile.height = 256;
    const n = noiseTile.getContext('2d'); const d = n.createImageData(256, 256);
    for (let i = 0; i < d.data.length; i += 4) { const v = 90 + Math.random() * 120; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
    n.putImageData(d, 0, 0);
  }
  ctx.save(); ctx.globalAlpha = alpha; ctx.globalCompositeOperation = 'overlay';
  ctx.fillStyle = ctx.createPattern(noiseTile, 'repeat'); ctx.fillRect(0, 0, PW, PH); ctx.restore();
}

function bgNavy(ctx) {
  const g = ctx.createLinearGradient(0, 0, PW * 0.4, PH);
  g.addColorStop(0, '#0d2765'); g.addColorStop(0.55, NAVY); g.addColorStop(1, NAVY_D);
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
  // soft blue glow + the thin sweeping lines used in the brochure corners
  const r = ctx.createRadialGradient(PW * 0.2, PH * 0.12, 10, PW * 0.2, PH * 0.12, 700);
  r.addColorStop(0, 'rgba(58,110,255,0.28)'); r.addColorStop(1, 'rgba(58,110,255,0)');
  ctx.fillStyle = r; ctx.fillRect(0, 0, PW, PH);
  ctx.save(); ctx.strokeStyle = 'rgba(70,125,255,0.38)'; ctx.lineWidth = 3;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath(); ctx.moveTo(-20, 80 + i * 26); ctx.bezierCurveTo(260, 20 + i * 30, 360, 200 - i * 20, 640, 90 + i * 14); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(PW + 20, PH - 90 - i * 26); ctx.bezierCurveTo(PW - 260, PH - 20 - i * 30, PW - 380, PH - 220, PW - 650, PH - 100 - i * 14); ctx.stroke();
  }
  ctx.restore();
  grain(ctx, 0.05);
}

function bgPaper(ctx) {
  const g = ctx.createLinearGradient(0, 0, 0, PH);
  g.addColorStop(0, '#efeff1'); g.addColorStop(1, '#e2e2e6');
  ctx.fillStyle = g; ctx.fillRect(0, 0, PW, PH);
  grain(ctx, 0.07);
}

function underline(ctx, x, y, w, color = GOLD, lw = 10) {
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = lw; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x, y + 4); ctx.bezierCurveTo(x + w * 0.3, y - 4, x + w * 0.65, y + 8, x + w, y - 3); ctx.stroke(); ctx.restore();
}

function text(ctx, str, x, y, { font, size, color = '#fff', weight = 400, align = 'left', family = F.body, base = 'alphabetic' } = {}) {
  ctx.font = `${weight} ${size}px ${family}`; ctx.fillStyle = color; ctx.textAlign = align; ctx.textBaseline = base;
  ctx.fillText(str, x, y);
}

// word-wrapped runs: [{t, color, weight}] → returns y after the last line
function runs(ctx, parts, x, y, maxW, lh, size, { family = F.body, align = 'left', color = '#fff', weight = 400 } = {}) {
  const words = [];
  parts.forEach((p) => p.t.split(/(\s+)/).forEach((w) => { if (w) words.push({ w, color: p.color || color, weight: p.weight || weight }); }));
  const lines = [[]]; let cur = 0;
  words.forEach((wd) => {
    ctx.font = `${wd.weight} ${size}px ${family}`;
    const wW = ctx.measureText(wd.w).width;
    if (cur + wW > maxW && !/^\s+$/.test(wd.w) && lines[lines.length - 1].length) { lines.push([]); cur = 0; }
    if (/^\s+$/.test(wd.w) && !lines[lines.length - 1].length) return;
    lines[lines.length - 1].push({ ...wd, width: wW }); cur += wW;
  });
  ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left';
  lines.forEach((ln, i) => {
    while (ln.length && /^\s+$/.test(ln[ln.length - 1].w)) ln.pop();
    const total = ln.reduce((a, b) => a + b.width, 0);
    let cx = align === 'center' ? x + (maxW - total) / 2 : x;
    ln.forEach((wd) => { ctx.font = `${wd.weight} ${size}px ${family}`; ctx.fillStyle = wd.color; ctx.fillText(wd.w, cx, y + i * lh); cx += wd.width; });
  });
  return y + lines.length * lh;
}

function fitImage(ctx, img, x, y, w, h) { // contain
  const s = Math.min(w / img.width, h / img.height); const dw = img.width * s, dh = img.height * s;
  ctx.drawImage(img, x + (w - dw) / 2, y + (h - dh) / 2, dw, dh);
}

/* ---------- simple line icons (unit box −1…1) ---------- */
const ICONS = {
  people(c) { [[0, -0.45, 0.3], [-0.68, -0.3, 0.2], [0.68, -0.3, 0.2]].forEach(([x, y, r]) => { c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); });
    c.beginPath(); c.moveTo(-0.5, 0.78); c.quadraticCurveTo(0, -0.1, 0.5, 0.78); c.stroke();
    c.beginPath(); c.moveTo(-0.98, 0.5); c.quadraticCurveTo(-0.9, 0.05, -0.55, 0.05); c.moveTo(0.98, 0.5); c.quadraticCurveTo(0.9, 0.05, 0.55, 0.05); c.stroke(); },
  trophy(c) { c.beginPath(); c.moveTo(-0.5, -0.75); c.lineTo(0.5, -0.75); c.lineTo(0.5, -0.2); c.bezierCurveTo(0.5, 0.15, 0.25, 0.3, 0, 0.3); c.bezierCurveTo(-0.25, 0.3, -0.5, 0.15, -0.5, -0.2); c.closePath(); c.stroke();
    c.beginPath(); c.arc(-0.62, -0.42, 0.2, Math.PI * 0.5, Math.PI * 1.5); c.stroke(); c.beginPath(); c.arc(0.62, -0.42, 0.2, -Math.PI * 0.5, Math.PI * 0.5); c.stroke();
    c.beginPath(); c.moveTo(0, 0.3); c.lineTo(0, 0.62); c.moveTo(-0.32, 0.78); c.lineTo(0.32, 0.78); c.stroke(); },
  rocket(c) { c.beginPath(); c.moveTo(0, -0.92); c.bezierCurveTo(0.5, -0.45, 0.46, 0.3, 0.26, 0.55); c.lineTo(-0.26, 0.55); c.bezierCurveTo(-0.46, 0.3, -0.5, -0.45, 0, -0.92); c.stroke();
    c.beginPath(); c.arc(0, -0.2, 0.15, 0, 7); c.stroke(); c.beginPath(); c.moveTo(-0.3, 0.2); c.lineTo(-0.62, 0.62); c.lineTo(-0.26, 0.5); c.moveTo(0.3, 0.2); c.lineTo(0.62, 0.62); c.lineTo(0.26, 0.5); c.moveTo(0, 0.68); c.lineTo(0, 0.95); c.stroke(); },
  bulb(c) { c.beginPath(); c.arc(0, -0.2, 0.55, Math.PI * 0.78, Math.PI * 0.22, false); c.lineTo(0.22, 0.52); c.lineTo(-0.22, 0.52); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-0.2, 0.72); c.lineTo(0.2, 0.72); c.moveTo(-0.12, 0.9); c.lineTo(0.12, 0.9); c.stroke();
    [[-1, -0.9], [0, -1.15], [1, -0.9]].forEach(([a, b]) => { c.beginPath(); c.moveTo(a * 0.85, b * 0.8 - 0.1); c.lineTo(a * 1.05, b * 0.95 - 0.1); c.stroke(); }); },
  target(c) { [0.85, 0.55, 0.22].forEach((r) => { c.beginPath(); c.arc(-0.05, 0.05, r, 0, 7); c.stroke(); }); c.beginPath(); c.moveTo(0, 0); c.lineTo(0.85, -0.85); c.moveTo(0.55, -0.85); c.lineTo(0.85, -0.85); c.lineTo(0.85, -0.55); c.stroke(); },
  monitor(c) { c.beginPath(); c.rect(-0.85, -0.65, 1.7, 1.15); c.stroke(); c.beginPath(); c.moveTo(-0.3, 0.85); c.lineTo(0.3, 0.85); c.moveTo(0, 0.5); c.lineTo(0, 0.85); c.stroke();
    c.beginPath(); c.moveTo(-0.3, -0.3); c.lineTo(-0.55, -0.07); c.lineTo(-0.3, 0.16); c.moveTo(0.3, -0.3); c.lineTo(0.55, -0.07); c.lineTo(0.3, 0.16); c.moveTo(0.08, -0.32); c.lineTo(-0.08, 0.2); c.stroke(); },
  link(c) { [[-0.6, 0.45], [0.6, 0.45], [0, -0.6]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 0.25, 0, 7); c.stroke(); });
    c.beginPath(); c.moveTo(-0.35, 0.45); c.lineTo(0.35, 0.45); c.moveTo(-0.45, 0.25); c.lineTo(-0.15, -0.4); c.moveTo(0.45, 0.25); c.lineTo(0.15, -0.4); c.stroke(); },
  group(c) { c.beginPath(); c.arc(-0.4, -0.4, 0.3, 0, 7); c.stroke(); c.beginPath(); c.arc(0.45, -0.3, 0.24, 0, 7); c.stroke();
    c.beginPath(); c.moveTo(-0.95, 0.75); c.quadraticCurveTo(-0.4, -0.1, 0.15, 0.75); c.moveTo(0.2, 0.2); c.quadraticCurveTo(0.8, 0, 1, 0.75); c.stroke(); },
  grad(c) { c.beginPath(); c.moveTo(-1, -0.2); c.lineTo(0, -0.7); c.lineTo(1, -0.2); c.lineTo(0, 0.3); c.closePath(); c.stroke();
    c.beginPath(); c.moveTo(-0.55, 0.05); c.lineTo(-0.55, 0.5); c.quadraticCurveTo(0, 0.95, 0.55, 0.5); c.lineTo(0.55, 0.05); c.stroke(); },
};
function icon(ctx, name, cx, cy, s, color, lw = 5) {
  ctx.save(); ctx.translate(cx, cy); ctx.scale(s, s); ctx.strokeStyle = color; ctx.fillStyle = color;
  ctx.lineWidth = lw / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; (ICONS[name] || ICONS.link)(ctx); ctx.restore();
}

function mountains(ctx, x, y, s, color = '#fff') { // simple line doodle with flag
  ctx.save(); ctx.translate(x, y); ctx.scale(s, s); ctx.strokeStyle = color; ctx.lineWidth = 4 / s; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(0, 120); ctx.lineTo(70, 50); ctx.lineTo(95, 75); ctx.lineTo(160, 0); ctx.lineTo(240, 120); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(160, 0); ctx.lineTo(160, -50); ctx.stroke();
  ctx.fillStyle = GOLD; ctx.beginPath(); ctx.moveTo(160, -50); ctx.lineTo(198, -38); ctx.lineTo(160, -26); ctx.closePath(); ctx.fill(); ctx.restore();
}

/* ---------- panels ---------- */
// Each painter returns a list of photo descriptors: { id, rect:{x,y,w,h}, radius, img, focus, alt, overlay }
function p1(ctx, A) {
  bgNavy(ctx);
  // faint code-line motif echoing the logo (brand colours only)
  ctx.save(); ctx.globalAlpha = 0.16;
  const rows = [[RED, 1500], [GOLD, 1546], [BLUE, 1592]]; let seed = 7; const rnd = () => (seed = (seed * 9301 + 49297) % 233280) / 233280;
  rows.forEach(([col, y]) => { let x = 60; ctx.fillStyle = col; while (x < PW - 80) { const w = 40 + rnd() * 160; ctx.fillRect(x, y, Math.min(w, PW - 60 - x), 16); x += w + 24 + rnd() * 30; } });
  ctx.restore();
  if (A.logoLockup) { const w = 640; const h = A.logoLockup.height * w / A.logoLockup.width; ctx.drawImage(A.logoLockup, (PW - w) / 2, 170, w, h); }
  text(ctx, C.cover.sign[0], 80, 1740, { size: 96, family: F.hand, weight: 700, color: '#fff' });
  text(ctx, C.cover.sign[1], 80, 1840, { size: 96, family: F.hand, weight: 700, color: '#fff' });
  underline(ctx, 80, 1862, 520, GOLD, 9);
  return [];
}

function p2(ctx, A) {
  bgPaper(ctx);
  text(ctx, C.who.title, 70, 150, { size: 92, family: F.head, color: INK });
  underline(ctx, 70, 176, 520);
  let y = runs(ctx, [{ t: C.who.body }], 70, 270, PW - 140, 48, 33, { color: INK, weight: 500 });
  // pillars
  const py = 600; const names = ['Learn Together', 'Compete Together', 'Grow Together']; const ic = ['grad', 'trophy', 'rocket'];
  names.forEach((n, i) => {
    const cx = 70 + (PW - 140) * (i + 0.5) / 3;
    icon(ctx, ic[i], cx, py, 46, INK, 5);
    const [a, b] = n.split(' '); text(ctx, a, cx, py + 92, { size: 29, weight: 700, color: INK, align: 'center' }); text(ctx, b, cx, py + 126, { size: 29, weight: 700, color: INK, align: 'center' });
    if (i) { ctx.fillStyle = '#9aa3b2'; ctx.fillRect(70 + (PW - 140) * i / 3 - 1, py - 50, 3, 190); }
  });
  const photo = { id: 'lawn', rect: { x: 62, y: 790, w: PW - 124, h: 410 }, radius: 44, img: A.lawn, focus: [0.42, 0.62], alt: 'ICPC OUST Community members seated in a circle on a lawn during an evening event.' };
  text(ctx, C.what.title, 70, 1310, { size: 78, family: F.head, color: INK });
  underline(ctx, 70, 1334, 440);
  C.what.items.forEach((t, i) => {
    const by = 1400 + i * 112;
    ctx.fillStyle = INK; ctx.beginPath(); ctx.arc(116, by + 26, 38, 0, 7); ctx.fill();
    icon(ctx, ['monitor', 'group', 'people', 'link'][i], 116, by + 26, 21, GOLD, 4);
    runs(ctx, [{ t }], 180, by + 14, PW - 250, 38, 30, { color: INK, weight: 500 });
  });
  C.what.sign.forEach((l, i) => text(ctx, l, PW / 2, 1860 + i * 56, { size: 54, family: F.hand, weight: 700, color: INK, align: 'center' }));
  underline(ctx, 330, 1962, 360, GOLD, 8);
  return [photo];
}

function p3(ctx) {
  bgNavy(ctx);
  text(ctx, C.icpc.title, 70, 160, { size: 88, family: F.head, color: '#fff' });
  underline(ctx, 70, 186, 560);
  icon(ctx, 'bulb', 880, 130, 62, GOLD, 6);
  runs(ctx, [{ t: C.icpc.lead, color: GOLD, weight: 700 }, { t: C.icpc.rest, color: '#fff' }], 70, 280, PW - 140, 44, 31, { weight: 500 });
  text(ctx, C.icpc.journeyTitle, 70, 600, { size: 72, family: F.head, color: '#fff' });
  underline(ctx, 70, 624, 420, GOLD, 9);
  const y0 = 720, step = 138;
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(98, y0); ctx.lineTo(98, y0 + step * 4); ctx.stroke();
  C.icpc.journey.forEach((r, i) => {
    const y = y0 + i * step;
    ctx.fillStyle = NAVY_D; ctx.strokeStyle = r.c; ctx.lineWidth = 8; ctx.beginPath(); ctx.arc(98, y, 25, 0, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = r.c; ctx.beginPath(); ctx.arc(98, y, 9, 0, 7); ctx.fill();
    text(ctx, r.t, 160, y - 6, { size: 34, weight: 700, color: '#fff' });
    runs(ctx, [{ t: r.s }], 160, y + 24, 420, 28, 22, { color: MUTE });
    runs(ctx, [{ t: r.d }], 610, y - 4, 350, 32, 25, { color: '#e6ebf5', weight: 500 });
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(160, y + 62); ctx.lineTo(960, y + 62); ctx.stroke();
  });
  // "what you get" box
  const bx = 60, by = 1450, bw = PW - 120, bh = 450;
  ctx.save(); rr(ctx, bx, by, bw, bh, 36); ctx.fillStyle = 'rgba(8,20,58,0.65)'; ctx.fill(); ctx.strokeStyle = GOLD; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
  icon(ctx, 'trophy', bx + 80, by + 78, 38, GOLD, 5);
  text(ctx, C.icpc.getTitle, bx + 150, by + 92, { size: 31, weight: 700, color: '#fff' });
  C.icpc.get.forEach((t, i) => {
    const yy = by + 175 + i * 62; ctx.fillStyle = GOLD; ctx.beginPath(); ctx.arc(bx + 62, yy - 9, 8, 0, 7); ctx.fill();
    runs(ctx, [{ t }], bx + 96, yy, bw - 360, 32, 28, { color: '#fff', weight: 500 });
  });
  mountains(ctx, bx + bw - 290, by + bh - 150, 1, '#fff');
  return [];
}

function p4(ctx, A) {
  bgNavy(ctx);
  if (A.logoLockup) { const w = 560; const h = A.logoLockup.height * w / A.logoLockup.width; ctx.drawImage(A.logoLockup, (PW - w) / 2, 150, w, h); }
  // sponsor lockup (crop of the supplied banner) on its own dark plate
  if (A.uni) {
    const w = 760, h = A.uni.height * w / A.uni.width, x = (PW - w) / 2, y = 1280;
    ctx.save(); rr(ctx, x - 24, y - 20, w + 48, h + 40, 28); ctx.fillStyle = '#080c16'; ctx.fill(); ctx.strokeStyle = 'rgba(244,183,58,0.55)'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    ctx.drawImage(A.uni, x, y, w, h);
  }
  ctx.fillStyle = GOLD; ctx.fillRect(PW / 2 - 110, 1780, 220, 6);
  return [];
}

function p5(ctx) {
  bgPaper(ctx);
  C.vision.title.forEach((l, i) => text(ctx, l, 70, 150 + i * 96, { size: 84, family: F.head, color: INK }));
  underline(ctx, 70, 274, 500);
  icon(ctx, 'target', 880, 150, 68, INK, 7);
  text(ctx, C.vision.tag, 70, 390, { size: 50, weight: 700, color: INK });
  runs(ctx, [{ t: C.vision.body }], 70, 456, PW - 200, 46, 33, { color: '#3a4766', weight: 500 });
  C.vision.stats.forEach((s, i) => {
    const x = 60 + i * 472, y = 620, w = 440, h = 200;
    ctx.save(); rr(ctx, x, y, w, h, 28); ctx.fillStyle = '#f7f7f9'; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.stroke(); ctx.restore();
    icon(ctx, s.i, x + 70, y + 100, 38, INK, 5);
    text(ctx, s.n, x + 130, y + 138, { size: 124, family: F.head, color: '#e4a21a' });
    text(ctx, s.l, x + 130 + (s.n.length === 2 ? 150 : 74) + 18, y + 138, { size: 34, weight: 600, color: INK });
  });
  C.vision.items.forEach((it, i) => {
    const x = 60, y = 900 + i * 190, w = PW - 120, h = 160;
    ctx.save(); rr(ctx, x, y, w, h, 28); ctx.fillStyle = '#f7f7f9'; ctx.fill(); ctx.strokeStyle = '#c2c7d4'; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    ctx.fillStyle = INK; rr(ctx, x + 28, y + 36, 88, 88, 20); ctx.fill();
    icon(ctx, it.i, x + 72, y + 80, 28, GOLD, 4);
    text(ctx, it.t, x + 150, y + 74, { size: 33, weight: 700, color: INK });
    runs(ctx, [{ t: it.s }], x + 150, y + 114, w - 190, 32, 27, { color: '#3a4766', weight: 500 });
  });
  C.vision.sign.forEach((l, i) => text(ctx, l, 80, 1560 + 120 + i * 68, { size: 62, family: F.hand, weight: 700, color: INK }));
  underline(ctx, 80, 1852, 380, GOLD, 8);
  mountains(ctx, 700, 1690, 1.0, INK);
  return [];
}

function p6(ctx, A) {
  bgNavy(ctx);
  text(ctx, C.did.title, 70, 150, { size: 84, family: F.head, color: '#fff' });
  underline(ctx, 70, 176, 470);
  text(ctx, C.did.season, 70, 250, { size: 44, weight: 700, color: GOLD });
  runs(ctx, [{ t: C.did.body }], 70, 306, PW - 140, 42, 30, { weight: 500 });
  const badge = (c, w, h) => { // "ECPC Finalists" tag, as in the original layout
    c.save(); c.translate(w - 150, 70); c.rotate(-0.14); rr(c, -110, -42, 220, 94, 18); c.fillStyle = '#0b0f1c'; c.fill(); c.strokeStyle = 'rgba(255,255,255,0.7)'; c.lineWidth = 2; c.stroke();
    text(c, C.did.badge[0], 0, -4, { size: 32, weight: 700, color: '#fff', align: 'center' }); text(c, C.did.badge[1], 0, 34, { size: 32, weight: 700, color: '#fff', align: 'center' }); c.restore();
  };
  const ph1 = { id: 'flag', rect: { x: 62, y: 540, w: PW - 124, h: 560 }, radius: 40, img: A.flag, focus: [0.5, 0.55], alt: 'Four ICPC OUST students holding a white OUST flag outdoors.', overlay: badge };
  const ph2 = { id: 'team', rect: { x: 62, y: 1130, w: PW - 124, h: 340 }, radius: 40, img: A.team, focus: [0.62, 0.7], alt: 'The ICPC OUST community team photographed together at night.' };
  text(ctx, C.did.teamsTitle, 70, 1560, { size: 44, weight: 700, color: '#fff' });
  C.did.stats.forEach((s, i) => {
    const x = 70 + i * 480;
    text(ctx, s.n, x, 1700, { size: 150, family: F.head, color: '#fff' });
    const nx = x + (s.n.length === 2 ? 190 : 100);
    text(ctx, s.l[0], nx, 1650, { size: 30, weight: 600, color: '#fff' }); text(ctx, s.l[1], nx, 1688, { size: 30, weight: 500, color: MUTE });
  });
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(PW / 2 - 24, 1590, 3, 120);
  C.did.sign.forEach((l, i) => text(ctx, l, 70, 1820 + i * 66, { size: 62, family: F.hand, weight: 700, color: '#fff' }));
  underline(ctx, 70, 1912, 400, GOLD, 8);
  return [ph1, ph2];
}

const PAINTERS = [p1, p2, p3, p4, p5, p6];

/* ---------- photo composition (cover-fit, rounded corners, optional overlay) ---------- */
export function composePhoto(def, scale = 1) {
  const w = Math.round(def.rect.w * scale), h = Math.round(def.rect.h * scale);
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const c = cv.getContext('2d');
  c.save(); rr(c, 0, 0, w, h, def.radius * scale); c.clip();
  if (def.img) {
    const s = Math.max(w / def.img.width, h / def.img.height); const dw = def.img.width * s, dh = def.img.height * s;
    const fx = def.focus?.[0] ?? 0.5, fy = def.focus?.[1] ?? 0.5;
    c.drawImage(def.img, -(dw - w) * fx, -(dh - h) * fy, dw, dh);
  } else { c.fillStyle = '#10234f'; c.fillRect(0, 0, w, h); c.fillStyle = MUTE; c.font = `${28 * scale}px ${F.body}`; c.textAlign = 'center'; c.fillText('Photograph unavailable', w / 2, h / 2); }
  c.restore();
  if (def.overlay) { c.save(); c.scale(scale, scale); def.overlay(c, def.rect.w, def.rect.h); c.restore(); }
  return cv;
}

/**
 * @param {{images:Record<string,HTMLImageElement|null>, overrides:(HTMLImageElement|null)[]}} loaded
 * @param {{scale?:number, bake?:boolean}} opts  scale: texture resolution factor; bake: paint photos into the panel
 */
export function generatePanels(loaded, { scale = 1, bake = false } = {}) {
  const A = { logoMark: loaded.images.logoMark, logoLockup: loaded.images.logoLockup, uni: loaded.images.uni, lawn: loaded.images.lawn, flag: loaded.images.flag, team: loaded.images.team };
  return PAINTERS.map((paint, i) => {
    const cv = document.createElement('canvas'); cv.width = Math.round(PW * scale); cv.height = Math.round(PH * scale);
    const ctx = cv.getContext('2d'); ctx.imageSmoothingQuality = 'high'; ctx.scale(scale, scale);
    const override = loaded.overrides?.[i];
    let photos = [];
    if (override) { ctx.drawImage(override, 0, 0, PW, PH); }
    else {
      photos = paint(ctx, A);
      photos.forEach((p) => { // soft contact shadow + (when baked) the photo itself
        ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 10; rr(ctx, p.rect.x, p.rect.y, p.rect.w, p.rect.h, p.radius); ctx.fillStyle = '#0b1530'; ctx.fill(); ctx.restore();
        if (bake) ctx.drawImage(composePhoto(p, 1), p.rect.x, p.rect.y, p.rect.w, p.rect.h);
      });
      if (bake) photos = [];
    }
    return { canvas: cv, photos: photos.map((p) => ({ ...p, canvas: composePhoto(p, scale) })), alt: PANEL_ALT[i], index: i };
  });
}
