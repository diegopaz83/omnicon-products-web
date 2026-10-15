import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// Machine ids from product.json demo.machines, mapped to equipment in the scene
export type TwinMachine = 'm1' | 'm2' | 'm3';

export interface Twin {
  update(state: { machines: Record<TwinMachine, 'running' | 'faulted'>; running: boolean }): void;
  project(id: TwinMachine): { x: number; y: number; visible: boolean };
  dispose(): void;
}

// Return null when WebGL is unavailable so the HUD still works
export function mountTwin(container: HTMLElement): Twin | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch {
    return null;
  }

  const width = () => Math.max(container.clientWidth, 1);
  const height = () => Math.max(container.clientHeight, 1);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#071a2d');
  scene.fog = new THREE.FogExp2('#071a2d', 0.019);
  const camera = new THREE.PerspectiveCamera(42, width() / height(), 0.1, 150);

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.7));
  renderer.setSize(width(), height());
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.5;
  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.065;
  controls.minDistance = 6;
  controls.maxDistance = 42;
  controls.maxPolarAngle = Math.PI * 0.49;
  controls.target.set(0, 2, 0);
  camera.position.set(16, 10, 18);

  // Materials
  const mat = (color: string, metalness = 0, roughness = 0.55) =>
    new THREE.MeshStandardMaterial({ color, metalness, roughness });
  const steel = mat('#a9bdcb', 0.88, 0.24);
  const chrome = mat('#d7e5f0', 0.92, 0.16);
  const dark = mat('#1b354b', 0.72, 0.35);
  const black = mat('#081521', 0.45, 0.44);
  const blue = mat('#0a58eb', 0.32, 0.31);
  const yellow = mat('#e9b34d', 0.45, 0.35);
  const glass = new THREE.MeshPhysicalMaterial({
    color: '#a8e8ff', transparent: true, opacity: 0.56, metalness: 0.06, roughness: 0.1, depthWrite: false,
  });
  const liquid = mat('#0a58eb', 0.18, 0.22);
  const glow = (color: string, intensity = 2) =>
    new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: intensity, roughness: 0.24 });
  const lit = glow('#00dcfa', 1.5);
  const green = glow('#37edab', 1.7);
  const amber = glow('#ffb547', 2.2);
  const purple = glow('#7543ff', 1.2);

  const root = new THREE.Group();
  scene.add(root);

  function box(w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root) {
    const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }

  function cyl(r: number, h: number, material: THREE.Material, x: number, y: number, z: number, parent: THREE.Object3D = root, seg = 24) {
    const o = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg), material);
    o.position.set(x, y, z);
    o.castShadow = true;
    o.receiveShadow = true;
    parent.add(o);
    return o;
  }

  function pipe(points: [number, number, number][], r = 0.07, material: THREE.Material = chrome) {
    const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)), false, 'centripetal', 0.05);
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24, points.length * 10), r, 9, false), material);
    root.add(mesh);
    return mesh;
  }

  function ring(r: number, t: number, material: THREE.Material, x: number, y: number, z: number) {
    const o = new THREE.Mesh(new THREE.TorusGeometry(r, t, 9, 48), material);
    o.rotation.x = Math.PI / 2;
    o.position.set(x, y, z);
    root.add(o);
    return o;
  }

  // Lights and floor
  scene.add(new THREE.HemisphereLight(0x9ddcff, 0x0b1d30, 2.5));
  const sun = new THREE.DirectionalLight(0xe7f4ff, 3.8);
  sun.position.set(-8, 17, 12);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -19;
  sun.shadow.camera.right = 19;
  sun.shadow.camera.top = 19;
  sun.shadow.camera.bottom = -19;
  scene.add(sun);
  const accent = new THREE.PointLight(0x00dcfa, 110, 25);
  accent.position.set(1, 7, -5);
  scene.add(accent);
  const warm = new THREE.PointLight(0xffb75c, 50, 16);
  warm.position.set(-7, 8, 5);
  scene.add(warm);

  box(34, 0.3, 22, mat('#273c4e', 0.16, 0.78), 0, -0.22, 0);
  const grid = new THREE.GridHelper(34, 34, 0x284d68, 0x1d3c54);
  grid.position.y = -0.052;
  root.add(grid);
  for (const z of [-2.5, 2.5]) {
    box(27, 0.035, 0.07, yellow, 0, -0.01, z);
    for (let x = -12; x < 13; x += 1.2) box(0.55, 0.04, 0.06, yellow, x, -0.008, z + (z > 0 ? 0.27 : -0.27));
  }
  for (let x = -14; x <= 14; x += 7) {
    for (const z of [-9, 9]) {
      box(0.36, 10, 0.36, dark, x, 5, z);
      box(0.55, 0.1, 0.55, steel, x, 10, z);
    }
  }
  for (let x = -14; x <= 14; x += 7) box(0.12, 0.15, 18, dark, x, 10, 0);
  for (const z of [-8, 8]) box(29, 0.16, 0.15, dark, 0, 10, z);
  for (let x = -10; x <= 10; x += 5) box(1.9, 0.09, 0.65, glow('#c9f4ff', 0.65), x, 9.75, 0);

  // Machine 1: infeed conveyor
  const conveyor = new THREE.Group();
  root.add(conveyor);
  box(23, 0.38, 1.95, dark, 0, 1.12, 0, conveyor);
  box(22.6, 0.07, 1.44, black, 0, 1.35, 0, conveyor);
  for (let x = -11.1; x < 11.3; x += 0.4) {
    const r = cyl(0.065, 1.53, steel, x, 1.42, 0, conveyor, 10);
    r.rotation.x = Math.PI / 2;
  }
  for (const z of [-1.01, 1.01]) {
    box(23, 0.18, 0.11, chrome, 0, 1.53, z, conveyor);
    box(23, 0.035, 0.035, lit, 0, 1.64, z, conveyor);
  }
  for (let x = -10.5; x < 11; x += 2.7)
    for (const z of [-0.85, 0.85]) {
      box(0.14, 1, 0.15, steel, x, 0.51, z, conveyor);
      box(0.29, 0.1, 0.28, dark, x, 0.06, z, conveyor);
    }
  const lampM1 = cyl(0.14, 0.2, green, -11.4, 1.9, 0, conveyor, 12);

  // Tank and piping
  const tank = new THREE.Group();
  root.add(tank);
  cyl(1.36, 4.15, steel, -7, 3.06, -4.6, tank, 48);
  cyl(1.41, 0.24, chrome, -7, 5.26, -4.6, tank, 48);
  cyl(1.38, 0.22, dark, -7, 0.9, -4.6, tank, 48);
  for (const y of [1.25, 2.55, 4.4]) ring(1.365, 0.045, chrome, -7, y, -4.6);
  pipe([[-6, 5.3, -4.6], [-4.6, 5.3, -4.6], [-4.2, 5.3, -3.1], [-2, 5.3, -3.1], [-2, 4.8, -2.4]], 0.12);
  pipe([[-7, 1.3, -3.2], [-7, 1.3, -2.4], [-5, 1.3, -2.4]], 0.1);

  // Machine 2: filler carousel, the bottleneck
  const filler = new THREE.Group();
  root.add(filler);
  for (const x of [-2.2, 2.2]) for (const z of [-1.65, 1.65]) box(0.19, 3.5, 0.19, chrome, x, 3.18, z, filler);
  box(5, 0.46, 3.7, dark, 0, 5.05, 0, filler);
  box(4.8, 0.075, 3.5, lit, 0, 4.79, 0, filler);
  cyl(1.38, 0.22, chrome, 0, 4.43, 0, filler, 48);
  cyl(1.31, 0.23, dark, 0, 3.7, 0, filler, 48);
  cyl(1.16, 0.13, chrome, 0, 3.6, 0, filler, 48);
  const heads: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const x = Math.cos(a) * 1.06;
    const z = Math.sin(a) * 1.06;
    heads.push(cyl(0.08, 0.72, chrome, x, 4.02, z, filler, 12));
    cyl(0.15, 0.11, lit, x, 3.61, z, filler, 12);
  }
  for (const x of [-2.4, 2.4]) for (const z of [-1.84, 1.84]) box(0.07, 2.7, 0.06, glass, x, 3.1, z, filler);
  for (const z of [-1.8, 1.8]) box(4.8, 2.45, 0.045, glass, 0, 3.08, z, filler);
  cyl(0.24, 0.45, dark, 0, 5.55, 0, filler);
  const lampM2 = cyl(0.14, 0.2, green, 0, 5.9, 0, filler);

  // Machine 3: capper, last machine
  const capper = new THREE.Group();
  root.add(capper);
  for (const x of [4.05, 6.6]) for (const z of [-1.35, 1.35]) box(0.16, 2.6, 0.16, chrome, x, 2.65, z, capper);
  box(3.1, 0.55, 3, dark, 5.35, 4.2, 0, capper);
  box(2.8, 0.1, 2.8, blue, 5.35, 3.89, 0, capper);
  for (const x of [4.6, 5.35, 6.1]) cyl(0.14, 1.25, chrome, x, 3.12, 0, capper);
  box(2.7, 1.6, 0.06, glass, 5.35, 2.85, 1.48, capper);
  const lampM3 = cyl(0.14, 0.2, green, 5.35, 4.7, 0, capper);

  // Inspection and control cabinet (visual only)
  const inspect = new THREE.Group();
  root.add(inspect);
  for (const z of [-1.4, 1.4]) box(0.13, 2.5, 0.13, steel, 8.9, 2.55, z, inspect);
  box(1.6, 0.35, 3.2, dark, 8.9, 3.9, 0, inspect);
  box(0.9, 0.58, 0.14, lit, 8.9, 2.8, 1.46, inspect);
  const cabinet = new THREE.Group();
  root.add(cabinet);
  box(1.55, 2.55, 0.9, steel, 6.4, 1.38, -4.6, cabinet);
  box(1.18, 1.2, 0.08, dark, 6.4, 1.67, -4.11, cabinet);
  box(0.96, 0.82, 0.09, glow('#0a58eb', 0.65), 6.4, 1.72, -4.04, cabinet);
  for (let i = 0; i < 3; i++) {
    const dot = cyl(0.09, 0.09, i === 0 ? green : i === 1 ? lit : purple, 5.98 + i * 0.39, 0.8, -4.01, cabinet, 16);
    dot.rotation.x = Math.PI / 2;
  }

  // Bottles moving on the conveyor, filled by the filler
  const bottleMaterial = new THREE.MeshPhysicalMaterial({
    color: '#b6edff', metalness: 0.03, roughness: 0.13, transparent: true, opacity: 0.72, depthWrite: false,
  });
  const bottles = Array.from({ length: 24 }, () => {
    const g = new THREE.Group();
    cyl(0.19, 0.58, bottleMaterial, 0, 0.34, 0, g, 14);
    cyl(0.13, 0.15, bottleMaterial, 0, 0.7, 0, g, 14);
    cyl(0.13, 0.13, blue, 0, 0.83, 0, g, 14);
    const fluid = cyl(0.175, 0.35, liquid, 0, 0.23, 0, g, 14);
    box(0.385, 0.17, 0.012, mat('#e8f5fc'), 0, 0.36, 0.185, g);
    root.add(g);
    return { g, fluid };
  });

  // Ambient machinery
  for (let i = 0; i < 5; i++) {
    const x = -11 + i * 2.3;
    box(0.65, 0.8, 0.65, dark, x, 0.43, -6.7);
    cyl(0.26, 0.22, blue, x, 0.96, -6.7);
  }
  for (const x of [-11, 11]) {
    box(0.14, 2, 0.14, yellow, x, 1, 2.9);
    cyl(0.13, 0.1, yellow, x, 2.05, 2.9);
  }

  // Status lamps follow machine state: running green, faulted amber
  const lamps: Record<TwinMachine, THREE.Mesh> = { m1: lampM1, m2: lampM2, m3: lampM3 };
  const faultedMaterial = amber;
  const runningMaterial = green;

  let flowing = true;
  let travel = 0;
  let elapsed = 0;
  let last = performance.now();
  let frameId = 0;

  const state = {
    machines: { m1: 'running', m2: 'running', m3: 'running' } as Record<TwinMachine, 'running' | 'faulted'>,
  };

  function update(next: { machines: Record<TwinMachine, 'running' | 'faulted'>; running: boolean }) {
    state.machines = next.machines;
    flowing = next.running && next.machines.m2 === 'running';
    (Object.keys(lamps) as TwinMachine[]).forEach((id) => {
      lamps[id].material = next.machines[id] === 'faulted' ? faultedMaterial : runningMaterial;
    });
  }

  const resize = () => {
    renderer.setSize(width(), height());
    camera.aspect = width() / height();
    camera.updateProjectionMatrix();
  };
  const observer = new ResizeObserver(resize);
  observer.observe(container);

  function frame(now: number) {
    frameId = requestAnimationFrame(frame);
    const dt = Math.min((now - last) / 1000, 0.06);
    last = now;
    elapsed += dt;

    // Bottles stop when the bottleneck is faulted, so the queue visibly backs up
    if (flowing) travel += dt * 0.85;
    for (let i = 0; i < bottles.length; i++) {
      const x = -11.5 + ((i * 0.96 + travel) % 23);
      bottles[i].g.position.set(x, 1.51, 0);
      const f = x > -1.6 && x < 1.8 ? Math.min(1, Math.max(0.15, (x + 1.6) / 3.4)) : 0.8;
      bottles[i].fluid.scale.y = f;
      bottles[i].fluid.position.y = 0.05 + 0.18 * f;
    }
    if (flowing) heads.forEach((h, i) => (h.position.y = 4.02 + Math.sin(elapsed * 3 + i * 0.8) * 0.07));

    controls.update();
    renderer.render(scene, camera);
  }
  frameId = requestAnimationFrame(frame);

  // Label anchors above each machine, in world units
  const anchors: Record<TwinMachine, THREE.Vector3> = {
    m1: new THREE.Vector3(-11.4, 2.6, 0),
    m2: new THREE.Vector3(0, 6.6, 0),
    m3: new THREE.Vector3(5.35, 5.6, 0),
  };

  function project(id: TwinMachine) {
    const v = anchors[id].clone().project(camera);
    return {
      x: ((v.x + 1) / 2) * width(),
      y: ((1 - v.y) / 2) * height(),
      visible: v.z < 1,
    };
  }

  return {
    update,
    project,
    dispose() {
      cancelAnimationFrame(frameId);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
