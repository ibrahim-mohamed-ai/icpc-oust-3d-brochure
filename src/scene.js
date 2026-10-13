// Three.js scene: physically hinged tri-fold sheets, lighting, atmosphere, camera rig.
import * as THREE from 'three';
import { PW, ASPECT } from './panels.js';

export const PANEL_W = 1;
export const PANEL_H = ASPECT;      // ≈ 1.953 world units (texture aspect is preserved exactly)
const T = 0.008;                    // paper thickness
const GAP = 0.011;                  // spacing between stacked folded panels (prevents z-fighting)
const FLAP = 0.022;                 // a folded flap lies on its neighbour's front, clear of the lifted photographs
const FOV = 30;
const PI = Math.PI;

const smooth = (x) => x * x * (3 - 2 * x);

function radialTexture(stops, size = 256) {
  const c = document.createElement('canvas'); c.width = c.height = size; const g = c.getContext('2d');
  const r = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  stops.forEach(([o, col]) => r.addColorStop(o, col)); g.fillStyle = r; g.fillRect(0, 0, size, size);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}

export function createScene({ canvas, panels, quality = 'high' }) {
  const isHigh = quality === 'high';
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: isHigh, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isHigh ? 2 : 1.5));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;       // keeps the brochure artwork colour-true
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setClearColor(0x040916, 1);

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x040916, 7, 20);
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.5, 45);
  const maxAniso = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const disposables = [];
  const track = (o) => { disposables.push(o); return o; };

  /* ---------- lights ---------- */
  scene.add(track(new THREE.AmbientLight(0x8aa2ff, 0.55)));
  const key = new THREE.DirectionalLight(0xffecd0, 1.0);
  key.position.set(-2.5, 3.5, 5); key.castShadow = true;
  key.shadow.mapSize.set(isHigh ? 2048 : 1024, isHigh ? 2048 : 1024);
  Object.assign(key.shadow.camera, { left: -5, right: 5, top: 4, bottom: -4, near: 1, far: 16 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.01; key.shadow.radius = 4;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x3b78ff, 1.5); rim.position.set(4, 2, -4); scene.add(rim);
  const warm = new THREE.PointLight(0xf4b73a, 0, 7, 1.6); warm.position.set(2, 0.5, 2.2); scene.add(warm);
  const spot = new THREE.SpotLight(0xfff0cf, 0, 14, 0.42, 0.9, 1.2); spot.position.set(0, 2.5, 4.5); scene.add(spot, spot.target);

  /* ---------- atmosphere ---------- */
  const glowTex = track(radialTexture([[0, 'rgba(40,90,220,0.55)'], [0.5, 'rgba(20,45,130,0.22)'], [1, 'rgba(4,9,22,0)']]));
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(26, 16), new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, fog: false }));
  glow.position.set(0, 0.3, -7); scene.add(glow);
  const goldTex = track(radialTexture([[0, 'rgba(244,183,58,0.22)'], [1, 'rgba(244,183,58,0)']]));
  const goldGlow = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: goldTex, transparent: true, depthWrite: false, fog: false }));
  goldGlow.position.set(3.2, -1.2, -5.5); scene.add(goldGlow);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.38 }));
  floor.rotation.x = -PI / 2; floor.position.y = -PANEL_H / 2 - 0.42; floor.receiveShadow = true; scene.add(floor);
  const ringTex = track(radialTexture([[0, 'rgba(60,110,255,0.20)'], [0.6, 'rgba(60,110,255,0.06)'], [1, 'rgba(60,110,255,0)']]));
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.MeshBasicMaterial({ map: ringTex, transparent: true, depthWrite: false, fog: false }));
  pool.rotation.x = -PI / 2; pool.position.y = floor.position.y + 0.002; scene.add(pool);

  const N = isHigh ? 260 : 120; const pos = new Float32Array(N * 3); const col = new Float32Array(N * 3);
  const c1 = new THREE.Color(0x4f86ff), c2 = new THREE.Color(0xf4b73a);
  for (let i = 0; i < N; i++) {
    pos.set([(Math.random() - 0.5) * 13, (Math.random() - 0.5) * 7, -5 + Math.random() * 7.5], i * 3);
    (Math.random() < 0.82 ? c1 : c2).toArray(col, i * 3);
  }
  const pg = track(new THREE.BufferGeometry()); pg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); pg.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const particles = new THREE.Points(pg, track(new THREE.PointsMaterial({ size: 0.028, vertexColors: true, transparent: true, opacity: 0.55, depthWrite: false, sizeAttenuation: true })));
  scene.add(particles);

  /* ---------- brochure ---------- */
  const edgeMat = track(new THREE.MeshStandardMaterial({ color: 0xcfd4e0, roughness: 0.9 }));
  const backMat = track(new THREE.MeshStandardMaterial({ color: 0x0b1633, roughness: 0.8, emissive: 0x0b1633, emissiveIntensity: 0.4 }));
  const boxGeo = track(new THREE.BoxGeometry(PANEL_W, PANEL_H, T));
  const photoGeo = track(new THREE.PlaneGeometry(1, 1));

  function makePanel(data, glossy) {
    const map = track(new THREE.CanvasTexture(data.canvas));
    map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = maxAniso; map.generateMipmaps = true; map.minFilter = THREE.LinearMipmapLinearFilter;
    const Mat = glossy ? THREE.MeshPhysicalMaterial : THREE.MeshStandardMaterial;
    const front = track(new Mat({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.36, roughness: glossy ? 0.38 : 0.7, metalness: 0, ...(glossy ? { clearcoat: 0.5, clearcoatRoughness: 0.35 } : {}) }));
    // BoxGeometry face order: +x, −x, +y, −y, +z (front artwork), −z (back)
    const mesh = new THREE.Mesh(boxGeo, [edgeMat, edgeMat, edgeMat, edgeMat, front, backMat]);
    mesh.castShadow = true; mesh.receiveShadow = true;
    data.photos.forEach((p, i) => {
      const pt = track(new THREE.CanvasTexture(p.canvas)); pt.colorSpace = THREE.SRGBColorSpace; pt.anisotropy = maxAniso;
      const pm = track(new THREE.MeshStandardMaterial({ map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.55, transparent: true, alphaTest: 0.5 }));
      const ph = new THREE.Mesh(photoGeo, pm);
      ph.scale.set(p.rect.w / PW, p.rect.h / PW, 1);
      ph.position.set((p.rect.x + p.rect.w / 2) / PW - 0.5, PANEL_H / 2 - (p.rect.y + p.rect.h / 2) / PW, T / 2 + 0.006 + i * 0.004); // lifted off the paper for real depth
      ph.castShadow = true; ph.receiveShadow = false; ph.name = p.id; mesh.add(ph);
    });
    return mesh;
  }

  // Accordion tri-fold. Panels run left→right at x∈[0,1],[1,2],[2,3].
  // pivot2 hinges panel 2 on panel 1's right edge (+π folds it behind); pivot3 hinges panel 3 on panel 2's far edge (−π).
  function buildSheet(data, glossyIdx) {
    const outer = new THREE.Group(); const rig = new THREE.Group(); outer.add(rig);
    const m1 = makePanel(data[0], glossyIdx === 0); m1.position.x = 0.5; rig.add(m1);
    const pivot2 = new THREE.Group(); pivot2.position.x = 1; rig.add(pivot2);
    const m2 = makePanel(data[1], false); m2.position.x = 0.5; pivot2.add(m2);
    const pivot3 = new THREE.Group(); pivot3.position.x = 1; pivot2.add(pivot3);
    const m3 = makePanel(data[2], false); m3.position.x = 0.5; pivot3.add(m3);
    function setFold(f2, f3) { // 0 = flat/open, 1 = folded shut
      pivot2.rotation.y = PI * f2; pivot3.rotation.y = -PI * f3;
      pivot2.position.z = -GAP * f2;
      pivot3.position.z = FLAP * f3; // valley fold: lies on panel 2's front face (world −z once panel 2 is flipped)
      const center = 0.5 + 0.5 * (1 - f2) + 0.5 * (1 - f3); // keep the sheet centred while it opens
      rig.position.x = -center * PANEL_W;
    }
    setFold(1, 1);
    return { outer, setFold, panels: [m1, m2, m3] };
  }

  const sheet1 = buildSheet(panels.slice(0, 3), 0);
  const sheet2 = buildSheet(panels.slice(3, 6), 0);
  // ±0.045 leaves room for each sheet's folded stack (≈0.026) so the two cards never intersect
  sheet1.outer.position.z = 0.045;
  sheet2.outer.position.z = -0.045; sheet2.outer.rotation.y = PI;   // back of the same card
  const book = new THREE.Group(); book.add(sheet1.outer, sheet2.outer); scene.add(book);

  /* ---------- state → scene ---------- */
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
  let last = null; let ambientTime = 0;
  const tmpDir = new THREE.Vector3();

  function size() {
    const w = canvas.clientWidth || window.innerWidth, h = canvas.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  }

  function apply(S) {
    last = S;
    sheet1.setFold(S.f1_2, S.f1_3); sheet2.setFold(S.f2_2, S.f2_3);
    book.rotation.y = PI * S.flip + S.bookYaw; book.rotation.x = S.bookPitch;
    const lift = (PANEL_H / 2 + 0.08) * S.rise;
    sheet1.outer.position.y = lift; sheet1.outer.rotation.y = PI * S.spin;
    sheet2.outer.position.y = -lift;
    floor.position.y = pool.position.y = -(lift + PANEL_H / 2) - 0.42; pool.position.y += 0.002; // floor stays beneath whatever is lowest
    sheet2.outer.visible = S.flip > 0.001;
    sheet1.outer.visible = !(S.flip >= 0.999 && S.rise <= 0.001);

    // lights follow the focus
    key.position.set(S.tx - 2.5, 3.5, 5); key.target.position.set(S.tx, 0, 0);
    warm.intensity = S.warm * 9; warm.position.set(S.tx + 1.8, 0.4, 2.4);
    spot.intensity = S.spot * 28; spot.position.set(S.tx + 0.9, 2.6, 4.6); spot.target.position.set(S.tx, S.ty, 0);
    rim.intensity = 1.2 + S.rim * 1.2;

    // camera: orbit around target, distance derived so the requested world box (vw × vh) always fits
    const aspect = camera.aspect, tf = Math.tan((FOV * PI) / 360);
    const dist = Math.max(S.vh / (2 * tf), S.vw / (2 * tf * aspect));
    const yaw = S.yaw + pointer.x * 0.05, pitch = S.pitch + pointer.y * 0.03;
    camera.position.set(S.tx + dist * Math.sin(yaw) * Math.cos(pitch), S.ty + dist * Math.sin(pitch), dist * Math.cos(yaw) * Math.cos(pitch));
    camera.lookAt(S.tx, S.ty, 0);
    scene.fog.near = dist + 1.5; scene.fog.far = dist + 13;
    glow.position.set(S.tx * 0.6, 0.3, -7);
  }

  function render(dt = 0) {
    ambientTime += dt;
    particles.rotation.y = ambientTime * 0.012; particles.position.y = Math.sin(ambientTime * 0.2) * 0.12;
    pointer.x += (pointer.tx - pointer.x) * 0.08; pointer.y += (pointer.ty - pointer.y) * 0.08;
    if (last) {
      const idle = last.ambient || 0; // very small float, only in the hero / finale
      const prevYaw = last.yaw; last.yaw = prevYaw + Math.sin(ambientTime * 0.35) * 0.018 * idle;
      apply(last); last.yaw = prevYaw;
    }
    renderer.render(scene, camera);
  }

  function setPointer(nx, ny) { pointer.tx = nx; pointer.ty = ny; }
  const settled = () => Math.abs(pointer.tx - pointer.x) < 0.002 && Math.abs(pointer.ty - pointer.y) < 0.002;

  function dispose() {
    scene.traverse((o) => { if (o.geometry) o.geometry.dispose?.(); });
    disposables.forEach((d) => d.dispose?.());
    renderer.dispose(); renderer.forceContextLoss();
  }

  size();
  return { renderer, camera, scene, apply, render, resize: size, setPointer, settled, dispose, sheets: [sheet1, sheet2], book };
}
