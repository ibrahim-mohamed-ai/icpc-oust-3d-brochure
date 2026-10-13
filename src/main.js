import '@fontsource/poppins/400.css';
import '@fontsource/poppins/500.css';
import '@fontsource/poppins/600.css';
import '@fontsource/poppins/700.css';
import '@fontsource/permanent-marker/400.css';
import '@fontsource/caveat/400.css';
import '@fontsource/caveat/700.css';
import './style.css';

import { loadAll } from './assets.js';
import { generatePanels } from './panels.js';
import { createScene } from './scene.js';
import { buildTimeline, createState, ScrollTrigger, TOTAL } from './animations.js';
import { initUI } from './ui.js';

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const isNarrow = () => window.innerWidth < 700;

let loaded = null;
let forced = null;          // 'static' | '3d' — set by the visitor via the toggle
let mode = null;            // 'static' | '3d'
let session = null;         // live 3D session (for clean teardown)

function webglAvailable() {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}
const GL_OK = webglAvailable();
const wantedMode = () => forced || (!GL_OK || reduceMQ.matches || isNarrow() ? 'static' : '3d');

/* ------------------------------------------------------------------ 3D */
function start3D() {
  const stage = $('#stage');
  stage.innerHTML = '';
  const canvas = document.createElement('canvas');
  canvas.id = 'gl'; canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D tri-fold brochure for the ICPC OUST Community. Scroll to unfold it, or switch to Simple view for the full text.');
  stage.appendChild(canvas);

  const low = window.innerWidth < 1100 || (navigator.hardwareConcurrency || 8) <= 4;
  const panels = generatePanels(loaded, { scale: low ? 0.75 : 1, bake: false });
  let scene;
  try { scene = createScene({ canvas, panels, quality: low ? 'low' : 'high' }); }
  catch (e) { console.error('[3d] WebGL init failed — falling back to simple view', e); forced = 'static'; return switchMode(true); }

  const S = createState();
  scene.apply(S);

  // event-driven render loop: runs while the timeline is moving, the pointer is settling, or in the hero/finale
  let raf = 0, until = 0, lastT = 0;
  const frame = (now) => {
    raf = 0; const dt = Math.min(0.05, (now - lastT) / 1000) || 0; lastT = now;
    scene.render(dt);
    if (S.ambient > 0.01 || now < until || !scene.settled()) raf = requestAnimationFrame(frame);
  };
  const invalidate = (ms = 600) => { until = performance.now() + ms; if (!raf && !document.hidden) { lastT = performance.now(); raf = requestAnimationFrame(frame); } };

  const ui = initUI({
    onJump: (t) => window.scrollTo({ top: (t / TOTAL) * (document.documentElement.scrollHeight - window.innerHeight), behavior: reduceMQ.matches ? 'auto' : 'smooth' }),
    onReplay: () => window.scrollTo({ top: 0, behavior: 'smooth' }),
  });

  const tl = buildTimeline({ S, scene, trigger: '#spacer', onProgress: (t) => ui.update(t), onTick: () => invalidate(350) });

  const onResize = () => { scene.resize(); scene.apply(S); ScrollTrigger.refresh(); invalidate(400); };
  let rz; const onResizeDebounced = () => { clearTimeout(rz); scene.resize(); scene.apply(S); invalidate(300); rz = setTimeout(onResize, 180); };
  const onMove = (e) => { if (e.pointerType === 'touch') return; scene.setPointer((e.clientX / window.innerWidth - 0.5) * 2, (e.clientY / window.innerHeight - 0.5) * 2); invalidate(1400); };
  const onVis = () => { if (!document.hidden) invalidate(500); };
  window.addEventListener('resize', onResizeDebounced);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVis);
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); }, false);
  canvas.addEventListener('webglcontextrestored', () => invalidate(800), false);

  ScrollTrigger.refresh();
  ui.update(tl.scrollTrigger ? tl.scrollTrigger.progress * TOTAL : 0);
  invalidate(1200);

  session = {
    scene, tl, canvas,
    stop() {
      cancelAnimationFrame(raf); raf = 0;
      window.removeEventListener('resize', onResizeDebounced); window.removeEventListener('pointermove', onMove); document.removeEventListener('visibilitychange', onVis);
      tl.scrollTrigger?.kill(); tl.kill(); scene.dispose(); canvas.remove();
    },
  };
  window.__brochure = { scene, S, tl, TOTAL }; // handy for debugging in devtools
}

/* ------------------------------------------------------------- simple view */
async function startStatic() {
  const host = $('#static-view');
  host.hidden = false;
  if (host.dataset.ready) return;
  const panels = generatePanels(loaded, { scale: 0.75, bake: true });
  const urls = await Promise.all(panels.map((p) => new Promise((res) => p.canvas.toBlob((b) => res(URL.createObjectURL(b)), 'image/png'))));
  host.innerHTML = `
    <div class="static-intro"><p class="eyebrow">ICPC OUST Community</p><h1>Same Dream. Bigger Together.</h1></div>
    ${[0, 1].map((s) => `
      <section class="spread" aria-labelledby="sp${s}"><h2 id="sp${s}">Spread 0${s + 1}</h2>
        <div class="panels">${panels.slice(s * 3, s * 3 + 3).map((p, i) => `
          <figure class="panel-fig"><img src="${urls[s * 3 + i]}" alt="${p.alt.replace(/"/g, '&quot;')}" width="768" height="1500" loading="lazy" decoding="async" /></figure>`).join('')}
        </div></section>`).join('')}`;
  host.dataset.ready = '1';
}

/* ------------------------------------------------------------------ modes */
async function switchMode(initial = false) {
  const next = wantedMode();
  if (!initial && next === mode) return;
  if (session) { session.stop(); session = null; }
  mode = next;
  body.classList.toggle('mode-3d', mode === '3d'); body.classList.toggle('mode-static', mode === 'static');
  const t = $('#view-toggle');
  t.textContent = mode === '3d' ? 'Simple view' : '3D experience'; t.setAttribute('aria-pressed', String(mode === 'static'));
  $('#static-view').hidden = mode === '3d';
  if (mode === '3d') { window.scrollTo(0, 0); start3D(); } else { $('#stage').innerHTML = ''; await startStatic(); window.scrollTo(0, 0); }
}

$('#view-toggle').addEventListener('click', () => { forced = mode === '3d' ? 'static' : (GL_OK ? '3d' : 'static'); switchMode(); });
reduceMQ.addEventListener?.('change', () => { forced = null; switchMode(); });
let wr; window.addEventListener('resize', () => { clearTimeout(wr); wr = setTimeout(() => { if (!forced) switchMode(); }, 300); });

/* ------------------------------------------------------------------- boot */
(async function boot() {
  const fill = $('#loader-fill');
  try {
    loaded = await loadAll((p) => { fill.style.transform = `scaleX(${p})`; });
    await switchMode(true);
  } catch (e) {
    console.error(e); $('#loader p').textContent = 'Something went wrong loading the brochure. Please refresh.'; return;
  }
  body.classList.remove('is-loading');
  setTimeout(() => $('#loader')?.remove(), 700);
})();
