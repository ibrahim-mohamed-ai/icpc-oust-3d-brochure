// Scroll choreography. One scrubbed GSAP timeline mutates a single state object `S`;
// scene.apply(S) turns that state into transforms. Because every tween is a fromTo with explicit
// start values, any scroll position maps to exactly one state (fully reversible, jump-safe).
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { PANEL_H } from './scene.js';

gsap.registerPlugin(ScrollTrigger);

export const TOTAL = 146; // timeline units (≈ one unit per 5.5vh of scroll on desktop)

// Chapters for the HUD (labels use the brochure's own headings only).
export const CHAPTERS = [
  { id: 'A', start: 0, end: 10, label: 'Cover' },
  { id: 'B', start: 10, end: 36, label: 'Unfolding', caption: ['Spread 01', 'Opening the brochure'] },
  { id: 'C', start: 36, end: 62, label: 'Who we are', captions: [{ from: 38, to: 49, c: ['Spread 01', 'Who We Are? · What We Do?'] }, { from: 49, to: 61, c: ['Spread 01', 'What Is ICPC? · The Journey'] }] },
  { id: 'D', start: 62, end: 86, label: 'Turn the page', caption: ['Spread 01 → 02', 'Turning the page'] },
  { id: 'E', start: 86, end: 118, label: 'This season', captions: [{ from: 106, to: 111.5, c: ['Spread 02', 'Our Vision This Season'] }, { from: 111.5, to: 120, c: ['Spread 02', 'What We Did · Our Teams'] }] },
  { id: 'F', start: 118, end: TOTAL, label: 'Finale', caption: ['ICPC OUST Community', 'Same Dream. Bigger Together.'] },
];

export function createState() {
  return {
    f1_2: 1, f1_3: 1, f2_2: 1, f2_3: 1, flip: 0, bookYaw: -0.62, bookPitch: 0.0, rise: 0, spin: 0,
    tx: -0.42, ty: 0.0, vw: 1.9, vh: PANEL_H * 1.32, yaw: 0.0, pitch: 0.09,
    spot: 0, warm: 0.5, rim: 0.4, ambient: 1,
  };
}

export function buildTimeline({ S, scene, trigger, onProgress, onTick }) {
  const tl = gsap.timeline({
    defaults: { ease: 'power2.inOut' },
    scrollTrigger: {
      trigger, start: 'top top', end: 'bottom bottom', scrub: 0.7, invalidateOnRefresh: true,
      onUpdate: (self) => onProgress?.(self.progress * TOTAL, self.progress),
    },
    onUpdate: () => { scene.apply(S); onTick?.(); },
  });
  const tw = (props, t0, t1, from, ease) => {
    const to = { ...props, duration: t1 - t0, immediateRender: false };
    if (ease) to.ease = ease;
    tl.fromTo(S, { ...from }, to, t0);
  };
  const cam = (t0, t1, from, to, ease) => tw(to, t0, t1, from, ease);

  const H = PANEL_H;
  // camera presets  (tx: look-at x · vw/vh: world box that must fit · yaw/pitch: orbit)
  const HERO = { tx: -0.42, ty: 0, vw: 1.9, vh: H * 1.32, yaw: 0, pitch: 0.09 };
  const CLOSED = { tx: 0, ty: 0, vw: 1.5, vh: H * 1.3, yaw: 0, pitch: 0.05 };
  const WIDE = { tx: 0, ty: 0, vw: 3.5, vh: H * 1.32, yaw: 0, pitch: 0.04 };
  const focus = (x) => ({ tx: x, ty: 0, vw: 1.22, vh: H * 1.32, yaw: 0, pitch: 0.0 });
  const FINAL = { tx: 0, ty: 0, vw: 3.5, vh: H * 2.3, yaw: 0.0, pitch: 0.03 };

  /* A — entrance: slow drift + tilt, brochure sits right of centre beside the intro copy */
  cam(0, 10, HERO, { ...HERO, yaw: 0.05, pitch: 0.12, tx: -0.38 }, 'sine.inOut');
  tw({ bookYaw: -0.5 }, 0, 10, { bookYaw: -0.62 }, 'sine.inOut');
  tw({ ambient: 0 }, 8, 12, { ambient: 1 }, 'none');

  /* B — first spread unfolds panel by panel */
  cam(10, 22, { ...HERO, yaw: 0.05, pitch: 0.12, tx: -0.38 }, { ...CLOSED, tx: 0, yaw: -0.04, pitch: 0.06 });
  tw({ f1_2: 0 }, 10, 21, { f1_2: 1 }, 'power2.inOut');
  tw({ f1_3: 0 }, 21, 32, { f1_3: 1 }, 'power2.inOut');
  tw({ bookYaw: -0.1 }, 10, 22, { bookYaw: -0.5 }, 'power2.inOut');
  tw({ bookYaw: 0 }, 22, 34, { bookYaw: -0.1 }, 'power1.inOut');
  cam(22, 36, { ...CLOSED, tx: 0, yaw: -0.04, pitch: 0.06 }, { ...WIDE, yaw: 0, pitch: 0.04 });
  tw({ rim: 1, warm: 0.9 }, 10, 34, { rim: 0.4, warm: 0.5 }, 'none');

  /* C — editorial exploration: focus panel 2, then panel 3 (spotlight follows) */
  cam(36, 42, { ...WIDE }, { ...focus(0), yaw: 0.0 });
  tw({ spot: 1 }, 36, 42, { spot: 0 }, 'none');
  cam(42, 46, { ...focus(0), yaw: 0 }, { ...focus(0), yaw: 0.02, pitch: 0.01 }, 'sine.inOut'); // gentle breathing while reading
  cam(46, 50, { ...focus(0), yaw: 0.02, pitch: 0.01 }, { ...focus(1), yaw: -0.02 });
  cam(50, 56, { ...focus(1), yaw: -0.02 }, { ...focus(1), yaw: 0, pitch: 0.0 }, 'sine.inOut');
  cam(56, 62, { ...focus(1), yaw: 0 }, { ...WIDE });
  tw({ spot: 0 }, 57, 62, { spot: 1 }, 'none');

  /* D — page turn: the sheet refolds, then the whole card swings around its vertical axis */
  tw({ f1_3: 1 }, 62, 68, { f1_3: 0 }, 'power2.inOut');
  tw({ f1_2: 1 }, 68, 74, { f1_2: 0 }, 'power2.inOut');
  cam(62, 74, { ...WIDE }, { ...CLOSED, vw: 1.6, yaw: 0.0, pitch: 0.05 });
  tw({ flip: 1 }, 74, 86, { flip: 0 }, 'power3.inOut');
  cam(74, 80, { ...CLOSED, vw: 1.6, yaw: 0, pitch: 0.05 }, { ...CLOSED, vw: 2.2, yaw: 0.32, pitch: 0.12 }, 'power1.inOut'); // camera arcs round the edge…
  cam(80, 86, { ...CLOSED, vw: 2.2, yaw: 0.32, pitch: 0.12 }, { ...CLOSED, vw: 1.5, yaw: 0, pitch: 0.05 }, 'power1.inOut'); // …and settles square on the new face
  tw({ bookYaw: 0 }, 74, 86, { bookYaw: 0 }, 'none');
  tw({ warm: 0.5 }, 74, 86, { warm: 0.9 }, 'none');

  /* E — second spread */
  tw({ f2_2: 0 }, 87, 96, { f2_2: 1 }, 'power2.inOut');
  tw({ f2_3: 0 }, 96, 105, { f2_3: 1 }, 'power2.inOut');
  cam(86, 98, { ...CLOSED, vw: 1.5 }, { ...CLOSED, vw: 2.2, yaw: -0.03, pitch: 0.05 });
  cam(98, 106, { ...CLOSED, vw: 2.2, yaw: -0.03, pitch: 0.05 }, { ...WIDE });
  tw({ spot: 1 }, 104, 108, { spot: 0 }, 'none');
  cam(106, 109, { ...WIDE }, { ...focus(0), yaw: 0 });
  cam(109, 111.5, { ...focus(0), yaw: 0 }, { ...focus(0), yaw: 0.02 }, 'sine.inOut');
  cam(111.5, 115, { ...focus(0), yaw: 0.02 }, { ...focus(1), yaw: -0.02 });
  cam(115, 119, { ...focus(1), yaw: -0.02 }, { ...focus(1), yaw: 0.0, pitch: 0.0 }, 'sine.inOut');

  /* F — finale: pull back, bring spread 01 back above spread 02 and open it → six panels */
  cam(119, 128, { ...focus(1), yaw: 0 }, { ...FINAL, yaw: -0.05, pitch: 0.05 }); // frame both rows before the sheet starts rising
  tw({ rise: 1 }, 123, 128, { rise: 0 }, 'power2.inOut');
  tw({ spin: 1 }, 128, 133, { spin: 0 }, 'power2.inOut');
  tw({ f1_2: 0 }, 133, 139, { f1_2: 1 }, 'power2.inOut');
  tw({ f1_3: 0 }, 139, 144, { f1_3: 1 }, 'power2.inOut');
  cam(128, TOTAL, { ...FINAL, yaw: -0.05, pitch: 0.05 }, { ...FINAL, yaw: 0.05, pitch: 0.07 }, 'sine.inOut'); // slow settle while the finale holds
  tw({ spot: 0, rim: 1.0 }, 119, 126, { spot: 1, rim: 1 }, 'none');
  tw({ ambient: 1 }, TOTAL - 14, TOTAL - 8, { ambient: 0 }, 'none');
  tl.to({}, { duration: 0.001 }, TOTAL); // pin the timeline length

  return tl;
}

export { ScrollTrigger, gsap };
