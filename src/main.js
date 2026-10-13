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
import { buildTimeline, createState, ScrollTrigger, TOTAL, gsap } from './animations.js';
import { initUI } from './ui.js';

const $ = (s) => document.querySelector(s);
const body = document.body;
const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
const autoplayButton = $('#autoplay-toggle');

let loaded = null;
let session = null;
let autoplayActive = false;
let autoplayTimeline = null;

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

// Key reading positions in the existing scroll-driven timeline. Dwell times are intentionally
// independent of scroll distance so longer, text-heavy panels stay on screen long enough to read.
const AUTO_STOPS = [
  { at: 0, hold: 8.5 },
  { at: 10, move: 2.6 },
  { at: 36, move: 6.0, hold: 3.0 },
  { at: 42, move: 2.5, hold: 8.5 },
  { at: 49, move: 2.5, hold: 9.0 },
  { at: 56, move: 2.5, hold: 8.0 },
  { at: 62, move: 7.5 },
  { at: 86, move: 5.8 },
  { at: 98, move: 3.0 },
  { at: 106, move: 2.4, hold: 2.5 },
  { at: 109, move: 1.8, hold: 9.0 },
  { at: 115, move: 2.5, hold: 9.0 },
  { at: 128, move: 3.6 },
  { at: 139, move: 2.8 },
  { at: TOTAL, move: 2.4, hold: 9.0 },
];

function webglAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    return false;
  }
}

function setAutoplayButton(playing) {
  autoplayButton.textContent = playing ? '⏸ Pause Animations' : '▶ Play Animations';
  autoplayButton.setAttribute('aria-pressed', String(playing));
}

function showWebGLFallback() {
  body.classList.add('webgl-unavailable');
  $('#webgl-fallback').hidden = false;
  $('#stage').hidden = true;
  $('#spacer').hidden = true;
  autoplayButton.disabled = true;
  autoplayButton.hidden = true;
}

/* ------------------------------------------------------------------ 3D */
function start3D() {
  const stage = $('#stage');
  stage.innerHTML = '';
  stage.hidden = false;
  const canvas = document.createElement('canvas');
  canvas.id = 'gl';
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Interactive 3D tri-fold brochure for the ICPC OUST Community. Scroll to unfold it or use the animation toggle to play the presentation.');
  stage.appendChild(canvas);

  const low = window.innerWidth < 1100 || (navigator.hardwareConcurrency || 8) <= 4;
  const panels = generatePanels(loaded, { scale: low ? 0.75 : 1 });
  let scene;
  try {
    scene = createScene({ canvas, panels, quality: low ? 'low' : 'high' });
  } catch (error) {
    console.error('[3d] WebGL initialisation failed', error);
    return false;
  }

  const S = createState();
  scene.apply(S);

  // Event-driven render loop: runs while the timeline is moving, the pointer is settling, or in the hero/finale.
  let raf = 0, until = 0, lastT = 0;
  const frame = (now) => {
    raf = 0;
    const dt = Math.min(0.05, (now - lastT) / 1000) || 0;
    lastT = now;
    scene.render(dt);
    if (S.ambient > 0.01 || now < until || !scene.settled()) raf = requestAnimationFrame(frame);
  };
  const invalidate = (ms = 600) => {
    until = performance.now() + ms;
    if (!raf && !document.hidden) {
      lastT = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  const ui = initUI({
    onJump: (t) => {
      stopAutoplay();
      const trigger = session?.tl?.scrollTrigger;
      const top = trigger ? trigger.start + (t / TOTAL) * (trigger.end - trigger.start) : 0;
      window.scrollTo({ top, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    },
    onReplay: () => {
      stopAutoplay();
      window.scrollTo({ top: 0, behavior: reduceMQ.matches ? 'auto' : 'smooth' });
    },
  });

  const tl = buildTimeline({ S, scene, trigger: '#spacer', onProgress: (t) => ui.update(t), onTick: () => invalidate(350) });

  function scrollAt(time) {
    const trigger = tl.scrollTrigger;
    if (!trigger) return;
    const y = trigger.start + (clamp(time, 0, TOTAL) / TOTAL) * (trigger.end - trigger.start);
    window.scrollTo(0, y);
  }

  function stopAutoplay() {
    autoplayActive = false;
    if (autoplayTimeline) {
      autoplayTimeline.kill();
      autoplayTimeline = null;
    }
    body.classList.remove('autoplay-reset');
    setAutoplayButton(false);
  }

  function playAutoplayRound(fromCurrent = true) {
    if (!autoplayActive || !tl.scrollTrigger) return;

    const trigger = tl.scrollTrigger;
    const progress = clamp((window.scrollY - trigger.start) / Math.max(1, trigger.end - trigger.start), 0, 1);
    const initialTime = fromCurrent ? progress * TOTAL : 0;
    const driver = { time: initialTime };

    if (!fromCurrent) driver.time = 0;

    // Each round owns exactly one GSAP timeline. Killing it on pause prevents orphaned timers/tweens.
    let round;
    round = gsap.timeline({
      onComplete: () => {
        if (autoplayTimeline !== round) return;
        autoplayTimeline = null;
        if (autoplayActive) playAutoplayRound(false);
      },
    });

    round.to({}, { duration: fromCurrent ? 8.0 : 8.5 });

    AUTO_STOPS.filter((stop) => stop.at > initialTime + 0.2).forEach((stop) => {
      round.to(driver, {
        time: stop.at,
        duration: stop.move ?? 2.5,
        ease: 'sine.inOut',
        onUpdate: () => scrollAt(driver.time),
      });
      if (stop.hold) round.to({}, { duration: stop.hold });
    });

    // Fade through the existing ink background for a calm loop reset instead of flashing or
    // rapidly scrubbing every section backwards. The regular timeline is still the only animation system.
    round.to({}, { duration: 0.35, onStart: () => body.classList.add('autoplay-reset') });
    round.to(driver, { time: 0, duration: 0.01, ease: 'none', onUpdate: () => scrollAt(driver.time) });
    round.to({}, { duration: 0.55, onComplete: () => body.classList.remove('autoplay-reset') });
    autoplayTimeline = round;
  }

  function startAutoplay() {
    if (autoplayActive || !tl.scrollTrigger) return;
    autoplayActive = true;
    setAutoplayButton(true);
    playAutoplayRound(true);
  }

  function toggleAutoplay() {
    if (autoplayActive) stopAutoplay();
    else startAutoplay();
  }

  const onResize = () => { scene.resize(); scene.apply(S); ScrollTrigger.refresh(); invalidate(400); };
  let rz;
  const onResizeDebounced = () => {
    clearTimeout(rz);
    scene.resize(); scene.apply(S); invalidate(300);
    rz = setTimeout(onResize, 180);
  };
  const onMove = (event) => {
    if (event.pointerType === 'touch') return;
    scene.setPointer((event.clientX / window.innerWidth - 0.5) * 2, (event.clientY / window.innerHeight - 0.5) * 2);
    invalidate(1400);
  };
  const onVisibilityChange = () => {
    if (document.hidden) autoplayTimeline?.pause();
    else {
      autoplayTimeline?.resume();
      invalidate(500);
    }
  };
  window.addEventListener('resize', onResizeDebounced);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', onVisibilityChange);
  canvas.addEventListener('webglcontextlost', (event) => { event.preventDefault(); }, false);
  canvas.addEventListener('webglcontextrestored', () => invalidate(800), false);

  ScrollTrigger.refresh();
  ui.update(tl.scrollTrigger ? tl.scrollTrigger.progress * TOTAL : 0);
  invalidate(1200);

  session = {
    scene, tl, canvas,
    toggleAutoplay,
    stopAutoplay,
    stop() {
      stopAutoplay();
      cancelAnimationFrame(raf); raf = 0;
      window.removeEventListener('resize', onResizeDebounced);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      tl.scrollTrigger?.kill();
      tl.kill();
      scene.dispose();
      canvas.remove();
    },
  };
  window.__brochure = { scene, S, tl, TOTAL }; // Handy for debugging in devtools.
  autoplayButton.disabled = false;
  return true;
}

// Manual input takes precedence over autoplay, so users can pause on any panel and explore freely.
function pauseForManualInput(event) {
  if (!autoplayActive) return;
  if (event.type === 'pointerdown' && autoplayButton.contains(event.target)) return;
  if (event.type === 'keydown') {
    const scrollKeys = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'];
    if (!scrollKeys.includes(event.key) && !(event.key === ' ' && !event.target.closest('button, a, input, textarea, select'))) return;
  }
  session?.stopAutoplay();
}

autoplayButton.addEventListener('click', () => session?.toggleAutoplay());
document.querySelector('.social-link.is-placeholder')?.addEventListener('click', (event) => event.preventDefault());
window.addEventListener('wheel', pauseForManualInput, { passive: true });
window.addEventListener('touchstart', pauseForManualInput, { passive: true });
window.addEventListener('pointerdown', pauseForManualInput, { passive: true });
window.addEventListener('keydown', pauseForManualInput);

/* ------------------------------------------------------------------- boot */
(async function boot() {
  const fill = $('#loader-fill');
  try {
    loaded = await loadAll((progress) => { fill.style.transform = `scaleX(${progress})`; });
    if (!webglAvailable() || !start3D()) showWebGLFallback();
  } catch (error) {
    console.error(error);
    showWebGLFallback();
    $('#webgl-fallback p').textContent = 'The interactive brochure could not be loaded. Please try an updated browser with hardware acceleration enabled.';
  }
  body.classList.remove('is-loading');
  setTimeout(() => $('#loader')?.remove(), 700);
})();
