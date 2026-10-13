// HUD: chapter navigation, captions, hero / cue / replay visibility, progress fill.
import { CHAPTERS, TOTAL } from './animations.js';

const clamp = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x));

export function initUI({ onJump, onReplay }) {
  const $ = (s) => document.querySelector(s);
  const hero = $('#hero'), cue = $('#cue'), cap = $('#caption'), fill = $('#progress-fill'), replay = $('#replay'), list = $('#chapters');
  list.innerHTML = '';
  const buttons = CHAPTERS.map((c) => {
    const li = document.createElement('li'); const b = document.createElement('button');
    b.type = 'button'; b.className = 'dot'; b.setAttribute('aria-label', `Go to: ${c.label}`); b.dataset.label = c.label;
    b.style.setProperty('--y', `${(c.start / TOTAL) * 100}%`);
    b.addEventListener('click', () => onJump(c.start + 0.4));
    li.appendChild(b); list.appendChild(li); return b;
  });
  replay.addEventListener('click', onReplay);

  let capKey = '';
  const captionFor = (t) => {
    for (const c of CHAPTERS) {
      if (c.captions) { const hit = c.captions.find((x) => t >= x.from && t < x.to); if (hit) return hit.c; }
      else if (c.caption && t >= c.start + 1.5 && t < c.end - 1) return c.caption;
    }
    return null;
  };

  function update(t) {
    const heroA = 1 - clamp((t - 3) / 5);
    hero.style.opacity = heroA; hero.style.transform = `translateY(${(1 - heroA) * -24}px)`; hero.style.visibility = heroA < 0.01 ? 'hidden' : 'visible';
    cue.style.opacity = 1 - clamp(t / 3);
    fill.style.transform = `scaleY(${clamp(t / TOTAL)})`;
    const idx = CHAPTERS.findIndex((c) => t >= c.start && t < c.end); const cur = idx < 0 ? CHAPTERS.length - 1 : idx;
    buttons.forEach((b, i) => b.classList.toggle('on', i === cur)); buttons.forEach((b, i) => { if (i === cur) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    const c = captionFor(t); const key = c ? c.join('|') : '';
    if (key !== capKey) {
      capKey = key; cap.classList.remove('show');
      if (c) { setTimeout(() => { if (capKey === key) { cap.querySelector('.k').textContent = c[0]; cap.querySelector('.t').textContent = c[1]; cap.classList.add('show'); } }, 140); }
    }
    const showReplay = t > TOTAL - 12; replay.classList.toggle('show', showReplay); replay.tabIndex = showReplay ? 0 : -1;
  }
  update(0);
  return { update };
}
