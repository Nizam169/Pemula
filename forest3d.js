/* ==========================================================================
   zamm.my.id - forest3d.js
   Enchanted 3D Low-Poly Forest & Game Animals with Dynamic Jakarta Time
   Animals: Fox (Rubah), Deer (Rusa), Owl (Burung Hantu), Rabbit (Kelinci)
   Lighting: Pagi (Morning), Siang (Noon), Sore (Sunset), Malam (Starry Night)
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene, camera, renderer, clock;
let ambientLight, dirLight, bounceLight;
let celestialMesh, celestialGlow;
let fox, deer, owl, rabbit;
let fireflies;
let terrainMesh;
let isAnimating = true;
let currentFocus = 'forest';
let currentTimePhase = 'malam';

// Base coordinates for animals in the clearing
const homePositions = {
  fox:    { x: -2.8, y: 0, z: 0.5, rotY: 0.45 },
  deer:   { x: 2.8,  y: 0, z: 0.0, rotY: -0.55 },
  owl:    { x: 0.0,  y: 0, z: -1.2, rotY: 0 },
  rabbit: { x: 0.0,  y: 0, z: 1.8, rotY: 0.15 }
};

// Camera Targets for Smooth Focus Interpolation
const cameraTargets = {
  forest: { pos: new THREE.Vector3(0, 4.0, 13.5), look: new THREE.Vector3(0, 1.2, 0) },
  fox:    { pos: new THREE.Vector3(-3.2, 2.0, 5.5), look: new THREE.Vector3(-2.8, 0.8, 0.5) },
  deer:   { pos: new THREE.Vector3(3.4, 2.4, 6.2),  look: new THREE.Vector3(2.8, 1.3, 0) },
  owl:    { pos: new THREE.Vector3(0, 3.2, 5.8),   look: new THREE.Vector3(0, 2.1, -1.2) },
  rabbit: { pos: new THREE.Vector3(0, 1.8, 5.0),   look: new THREE.Vector3(0, 0.6, 1.8) }
};

const currentCamPos = new THREE.Vector3(0, 4.0, 13.5);
const currentLookAt = new THREE.Vector3(0, 1.2, 0);

// Mouse parallax & Raycaster
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);

// Autonomous navigation target for active animal
const navTarget = { active: false, x: 0, z: 0 };

// Helper Toon / Low-Poly Shaded Material
const createMat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

/* ==========================================================================
   Initialization
   ========================================================================== */
function init() {
  const canvas = document.getElementById('forestCanvas');
  const container = document.getElementById('webglContainer');
  if (!canvas || !container) return;

  // WebGL Renderer Setup
  renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance'
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(window.innerWidth, window.innerHeight);

  // Scene & Fog
  scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x070e17, 0.038);

  // Perspective Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(currentCamPos);
  camera.lookAt(currentLookAt);

  clock = new THREE.Clock();

  // Lighting & Celestial Setup
  setupLighting();
  setupCelestialBody();

  // Environment Construction
  buildTerrain();
  buildTrees();
  buildRocksAndMushrooms();
  buildFireflies();

  // Animal Models Construction
  fox = createFox();
  fox.position.set(homePositions.fox.x, homePositions.fox.y, homePositions.fox.z);
  fox.rotation.y = homePositions.fox.rotY;
  scene.add(fox);

  deer = createDeer();
  deer.position.set(homePositions.deer.x, homePositions.deer.y, homePositions.deer.z);
  deer.rotation.y = homePositions.deer.rotY;
  scene.add(deer);

  owl = createOwl();
  owl.position.set(homePositions.owl.x, homePositions.owl.y, homePositions.owl.z);
  owl.rotation.y = homePositions.owl.rotY;
  scene.add(owl);

  rabbit = createRabbit();
  rabbit.position.set(homePositions.rabbit.x, homePositions.rabbit.y, homePositions.rabbit.z);
  rabbit.rotation.y = homePositions.rabbit.rotY;
  scene.add(rabbit);

  // Event Listeners
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onCanvasClick);

  // Keyboard navigation for active animal (WASD / Arrow Keys)
  window.addEventListener('keydown', onKeyDown);

  // Page visibility pause to save battery
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clock.stop();
    else clock.start();
  });

  // Start Animation Loop
  animate();
}

/* ==========================================================================
   Lighting & Celestial Setup (Time of Day Dependent)
   ========================================================================== */
function setupLighting() {
  // Ambient Soft Tone
  ambientLight = new THREE.AmbientLight(0x152538, 1.3);
  scene.add(ambientLight);

  // Main Key Light (Moonlight or Sunlight)
  dirLight = new THREE.DirectionalLight(0xd1e8ff, 1.8);
  dirLight.position.set(10, 15, 8);
  scene.add(dirLight);

  // Forest Floor Bounce Light
  bounceLight = new THREE.DirectionalLight(0x10b981, 0.4);
  bounceLight.position.set(-8, -2, -5);
  scene.add(bounceLight);
}

function setupCelestialBody() {
  const celestialGroup = new THREE.Group();
  celestialGroup.name = 'celestial';

  // Core Sphere (Sun or Moon)
  const sphereGeo = new THREE.SphereGeometry(1.6, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  celestialMesh = new THREE.Mesh(sphereGeo, sphereMat);
  celestialGroup.add(celestialMesh);

  // Soft Aura Glow Ring
  const ringGeo = new THREE.RingGeometry(1.7, 2.5, 24);
  const ringMat = new THREE.MeshBasicMaterial({
    color: 0x93c5fd,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.35
  });
  celestialGlow = new THREE.Mesh(ringGeo, ringMat);
  celestialGroup.add(celestialGlow);

  celestialGroup.position.set(18, 22, -30);
  scene.add(celestialGroup);
}

/* ==========================================================================
   Dynamic Time of Day Mode (Pagi, Siang, Sore, Malam)
   ========================================================================== */
const timePhaseConfigs = {
  pagi: {
    fogColor: 0x223a48,
    fogDensity: 0.030,
    ambientColor: 0x485a6a,
    ambientIntensity: 1.3,
    dirColor: 0xffd8b2,
    dirIntensity: 2.1,
    dirPos: [14, 9, 6],
    bounceColor: 0x2a9d8f,
    bounceIntensity: 0.5,
    fireflyOpacity: 0.15,
    fireflyColor: 0xa7f3d0,
    celestialColor: 0xffe8d6,
    celestialPos: [22, 12, -32],
    celestialGlowColor: 0xfbbf24,
    skyBg: 'linear-gradient(180deg, #18283b 0%, #29435c 40%, #c47c5d 85%, #f4a261 100%)'
  },
  siang: {
    fogColor: 0x2d5a7b,
    fogDensity: 0.022,
    ambientColor: 0x82b9d6,
    ambientIntensity: 1.6,
    dirColor: 0xfffaed,
    dirIntensity: 2.5,
    dirPos: [4, 22, 5],
    bounceColor: 0x38b000,
    bounceIntensity: 0.65,
    fireflyOpacity: 0.0,
    fireflyColor: 0x34d399,
    celestialColor: 0xffffff,
    celestialPos: [6, 26, -26],
    celestialGlowColor: 0xfef08a,
    skyBg: 'linear-gradient(180deg, #1b4965 0%, #2b6f93 45%, #62b6cb 80%, #bee9e8 100%)'
  },
  sore: {
    fogColor: 0x38203d,
    fogDensity: 0.034,
    ambientColor: 0x5a354c,
    ambientIntensity: 1.25,
    dirColor: 0xf59e0b,
    dirIntensity: 2.3,
    dirPos: [-16, 7, 4],
    bounceColor: 0xe76f51,
    bounceIntensity: 0.6,
    fireflyOpacity: 0.55,
    fireflyColor: 0xfbbf24,
    celestialColor: 0xf97316,
    celestialPos: [-24, 9, -32],
    celestialGlowColor: 0xf43f5e,
    skyBg: 'linear-gradient(180deg, #1d1a36 0%, #3a224a 40%, #a44a3f 75%, #f39237 100%)'
  },
  malam: {
    fogColor: 0x070e17,
    fogDensity: 0.038,
    ambientColor: 0x152538,
    ambientIntensity: 1.3,
    dirColor: 0xd1e8ff,
    dirIntensity: 1.8,
    dirPos: [10, 15, 8],
    bounceColor: 0x10b981,
    bounceIntensity: 0.4,
    fireflyOpacity: 0.9,
    fireflyColor: 0x34d399,
    celestialColor: 0xe2e8f0,
    celestialPos: [18, 22, -30],
    celestialGlowColor: 0x93c5fd,
    skyBg: 'radial-gradient(circle at 50% 25%, #0e2033 0%, #070e17 80%)'
  }
};

function setTimePhase(phase) {
  if (!timePhaseConfigs[phase]) phase = 'malam';
  currentTimePhase = phase;
  const cfg = timePhaseConfigs[phase];

  if (!scene) return;

  // Scene Fog
  scene.fog.color.setHex(cfg.fogColor);
  scene.fog.density = cfg.fogDensity;

  // Ambient & Directional Lights
  if (ambientLight) {
    ambientLight.color.setHex(cfg.ambientColor);
    ambientLight.intensity = cfg.ambientIntensity;
  }
  if (dirLight) {
    dirLight.color.setHex(cfg.dirColor);
    dirLight.intensity = cfg.dirIntensity;
    dirLight.position.set(...cfg.dirPos);
  }
  if (bounceLight) {
    bounceLight.color.setHex(cfg.bounceColor);
    bounceLight.intensity = cfg.bounceIntensity;
  }

  // Celestial Body
  const celestial = scene.getObjectByName('celestial');
  if (celestial && celestialMesh && celestialGlow) {
    celestial.position.set(...cfg.celestialPos);
    celestialMesh.material.color.setHex(cfg.celestialColor);
    celestialGlow.material.color.setHex(cfg.celestialGlowColor);
  }

  // Fireflies
  if (fireflies) {
    fireflies.material.opacity = cfg.fireflyOpacity;
    fireflies.material.color.setHex(cfg.fireflyColor);
  }

  // Update background container gradient
  const webglContainer = document.getElementById('webglContainer');
  if (webglContainer) {
    webglContainer.style.background = cfg.skyBg;
  }
}

/* ==========================================================================
   Terrain & Forest Floor
   ========================================================================== */
function buildTerrain() {
  const geo = new THREE.PlaneGeometry(65, 65, 30, 30);
  const pos = geo.attributes.position;

  for (let i = 0; i < pos.count; i++) {
    const vx = pos.getX(i);
    const vy = pos.getY(i);
    const dist = Math.sqrt(vx * vx + vy * vy);
    let elevation = Math.sin(vx * 0.14) * Math.cos(vy * 0.14) * 0.9;
    if (dist < 8) elevation *= (dist / 8); // Flatter central clearing for animal motion
    pos.setZ(i, elevation);
  }
  geo.computeVertexNormals();

  const terrainMat = createMat(0x112419);
  terrainMesh = new THREE.Mesh(geo, terrainMat);
  terrainMesh.name = 'terrain';
  terrainMesh.rotation.x = -Math.PI / 2;
  terrainMesh.position.y = -0.05;
  scene.add(terrainMesh);
}

/* ==========================================================================
   Pine Trees
   ========================================================================== */
function buildTrees() {
  const treeCount = 28;
  const shades = [0x153b24, 0x1e4f32, 0x27633f, 0x2f7a4e];

  for (let i = 0; i < treeCount; i++) {
    const angle = (i / treeCount) * Math.PI * 2 + (Math.random() * 0.2);
    const radius = 5.5 + Math.random() * 14;
    const x = Math.cos(angle) * radius;
    const z = Math.sin(angle) * radius - 2;

    const scale = 0.75 + Math.random() * 0.6;
    const tree = new THREE.Group();

    // Trunk
    const trunkMat = createMat(0x3d271d);
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16 * scale, 0.24 * scale, 1.4 * scale, 5), trunkMat);
    trunk.position.y = 0.7 * scale;
    tree.add(trunk);

    // Foliage Cones
    const foliageMat = createMat(shades[i % shades.length]);
    for (let j = 0; j < 3; j++) {
      const coneRadius = (1.0 - j * 0.22) * scale;
      const coneHeight = (1.3 - j * 0.18) * scale;
      const cone = new THREE.Mesh(new THREE.ConeGeometry(coneRadius, coneHeight, 5), foliageMat);
      cone.position.y = (1.5 + j * 0.7) * scale;
      tree.add(cone);
    }

    tree.position.set(x, 0, z);
    tree.rotation.y = Math.random() * Math.PI * 2;
    scene.add(tree);
  }
}

/* ==========================================================================
   Rocks & Game Mushrooms
   ========================================================================== */
function buildRocksAndMushrooms() {
  const rockMat = createMat(0x475569);
  const rockPositions = [
    [-1.8, 0, -0.6, 0.6],
    [1.8, 0, -0.8, 0.8],
    [-4.2, 0, 1.5, 1.1],
    [4.0, 0, 1.2, 0.9],
    [-0.5, 0, 2.0, 0.5]
  ];

  rockPositions.forEach(([x, y, z, s]) => {
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(s, 0), rockMat);
    rock.position.set(x, y + s * 0.35, z);
    rock.rotation.set(Math.random(), Math.random(), Math.random());
    scene.add(rock);
  });

  // Stylized Game Mushrooms
  const shroomRed = createMat(0xe11d48);
  const shroomStalk = createMat(0xf8fafc);
  const shroomSpots = [
    [-2.2, 0, 0.9],
    [-2.4, 0, 1.1],
    [2.2, 0, 0.8],
    [0.6, 0, -1.0],
    [-0.8, 0, -0.8],
    [0.9, 0, 1.6]
  ];

  shroomSpots.forEach(([x, y, z]) => {
    const shroom = new THREE.Group();
    const stalk = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.06, 0.22, 5), shroomStalk);
    stalk.position.y = 0.11;
    shroom.add(stalk);

    const cap = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.15, 6), shroomRed);
    cap.position.y = 0.25;
    shroom.add(cap);

    shroom.position.set(x, y, z);
    scene.add(shroom);
  });
}

/* ==========================================================================
   Glowing Forest Fireflies (Kunang-Kunang)
   ========================================================================== */
function buildFireflies() {
  const count = 80;
  const geometry = new THREE.BufferGeometry();
  const positions = new Float32Array(count * 3);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = (Math.random() - 0.5) * 24;
    positions[i * 3 + 1] = 0.4 + Math.random() * 4.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 20;
    phases[i] = Math.random() * Math.PI * 2;
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('phase', new THREE.BufferAttribute(phases, 1));

  const material = new THREE.PointsMaterial({
    color: 0x34d399,
    size: 0.14,
    transparent: true,
    opacity: 0.85,
    blending: THREE.AdditiveBlending
  });

  fireflies = new THREE.Points(geometry, material);
  scene.add(fireflies);
}

/* ==========================================================================
   Model 1: Low-Poly Fox (Rubah Game)
   ========================================================================== */
function createFox() {
  const foxGroup = new THREE.Group();
  foxGroup.name = 'fox';

  const orange = createMat(0xe65c00);
  const white = createMat(0xf8fafc);
  const dark = createMat(0x0f172a);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.68, 0.52, 1.15), orange);
  body.position.y = 0.55;
  foxGroup.add(body);

  // Chest white patch
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.69, 0.36, 0.45), white);
  chest.position.set(0, 0.48, 0.35);
  foxGroup.add(chest);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.78, 0.55);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.45), orange);
  headGroup.add(head);

  // Snout
  const muzzle = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.35, 4), white);
  muzzle.rotation.x = Math.PI / 2;
  muzzle.position.set(0, -0.06, 0.35);
  headGroup.add(muzzle);

  // Nose tip
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.05, 4, 4), dark);
  nose.position.set(0, -0.05, 0.53);
  headGroup.add(nose);

  // Ears
  const ear1 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 4), orange);
  ear1.position.set(0.16, 0.28, 0);
  const ear2 = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.24, 4), orange);
  ear2.position.set(-0.16, 0.28, 0);
  headGroup.add(ear1, ear2);

  foxGroup.add(headGroup);

  // 4 Legs
  const legs = [];
  const legCoords = [
    [0.22, 0.24, 0.35],
    [-0.22, 0.24, 0.35],
    [0.22, 0.24, -0.35],
    [-0.22, 0.24, -0.35]
  ];
  legCoords.forEach(pos => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.48, 0.14), dark);
    leg.position.set(...pos);
    foxGroup.add(leg);
    legs.push(leg);
  });

  // Tail
  const tailGroup = new THREE.Group();
  tailGroup.position.set(0, 0.65, -0.55);

  const tailMain = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.08, 0.65, 5), orange);
  tailMain.rotation.x = -Math.PI / 3;
  tailMain.position.set(0, 0.16, -0.25);
  tailGroup.add(tailMain);

  const tailTip = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.35, 5), white);
  tailTip.rotation.x = -Math.PI / 3;
  tailTip.position.set(0, 0.34, -0.52);
  tailGroup.add(tailTip);

  foxGroup.add(tailGroup);

  foxGroup.userData = {
    headGroup,
    tailGroup,
    legs,
    baseY: 0,
    jumpTimer: 0,
    spinTimer: 0,
    stepCycle: 0
  };

  return foxGroup;
}

/* ==========================================================================
   Model 2: Low-Poly Deer (Rusa Bertanduk)
   ========================================================================== */
function createDeer() {
  const deerGroup = new THREE.Group();
  deerGroup.name = 'deer';

  const brown = createMat(0x9a6b47);
  const cream = createMat(0xfefae0);
  const dark = createMat(0x3e2723);
  const antlerMat = createMat(0xd4a373);

  // Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.68, 1.35), brown);
  body.position.y = 1.08;
  deerGroup.add(body);

  // Neck
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.25, 0.95, 5), brown);
  neck.position.set(0, 1.55, 0.52);
  neck.rotation.x = 0.35;
  deerGroup.add(neck);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.95, 0.8);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.36, 0.52), brown);
  headGroup.add(head);

  // Muzzle
  const muzzle = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.2, 0.28), cream);
  muzzle.position.set(0, -0.06, 0.34);
  headGroup.add(muzzle);

  // Antlers
  const antlerL = new THREE.Group();
  antlerL.position.set(0.14, 0.26, -0.05);

  const antlerBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.04, 0.65, 4), antlerMat);
  antlerBeam.rotation.z = -0.32;
  antlerBeam.rotation.x = -0.22;
  antlerL.add(antlerBeam);

  const antlerBranch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.03, 0.32, 4), antlerMat);
  antlerBranch.position.set(0.14, 0.16, 0.06);
  antlerBranch.rotation.z = -0.85;
  antlerL.add(antlerBranch);

  const antlerR = antlerL.clone();
  antlerR.position.x = -0.14;
  antlerR.scale.x = -1;

  headGroup.add(antlerL, antlerR);
  deerGroup.add(headGroup);

  // 4 Slender Legs
  const legs = [];
  const legCoords = [
    [0.25, 0.48, 0.48],
    [-0.25, 0.48, 0.48],
    [0.25, 0.48, -0.48],
    [-0.25, 0.48, -0.48]
  ];
  legCoords.forEach(pos => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.05, 0.96, 4), dark);
    leg.position.set(...pos);
    deerGroup.add(leg);
    legs.push(leg);
  });

  deerGroup.userData = {
    headGroup,
    legs,
    baseY: 0,
    jumpTimer: 0,
    bowTimer: 0,
    stepCycle: 0
  };

  return deerGroup;
}

/* ==========================================================================
   Model 3: Low-Poly Owl (Burung Hantu)
   ========================================================================== */
function createOwl() {
  const owlGroup = new THREE.Group();
  owlGroup.name = 'owl';

  const brown = createMat(0x5c4d3c);
  const darkBrown = createMat(0x382c22);
  const gold = createMat(0xfbbf24);
  const darkEye = createMat(0x0f172a);
  const beakColor = createMat(0xf59e0b);
  const cream = createMat(0xf8fafc);

  // Mossy Log Perch
  const perch = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.42, 1.45, 6), darkBrown);
  perch.position.y = 0.72;
  owlGroup.add(perch);

  // Body
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.32, 0.68, 6), brown);
  body.position.y = 1.68;
  owlGroup.add(body);

  // Chest cream patch
  const chest = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.46, 0.22), cream);
  chest.position.set(0, 1.65, 0.2);
  owlGroup.add(chest);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 2.1, 0);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.29, 6, 6), brown);
  headGroup.add(head);

  // Two Golden Eyes
  [-0.1, 0.1].forEach(x => {
    const eye = new THREE.Mesh(new THREE.CircleGeometry(0.09, 6), gold);
    eye.position.set(x, 0.02, 0.27);
    headGroup.add(eye);

    const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.045, 6), darkEye);
    pupil.position.set(x, 0.02, 0.28);
    headGroup.add(pupil);
  });

  // Beak
  const beak = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.14, 4), beakColor);
  beak.rotation.x = Math.PI / 2;
  beak.position.set(0, -0.06, 0.3);
  headGroup.add(beak);

  // Ear Tuft Feathers
  const tuftL = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.16, 4), darkBrown);
  tuftL.position.set(0.14, 0.28, 0);
  const tuftR = tuftL.clone();
  tuftR.position.x = -0.14;
  headGroup.add(tuftL, tuftR);

  owlGroup.add(headGroup);

  // Wings
  const wingL = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.48, 0.32), darkBrown);
  wingL.position.set(0.33, 1.68, 0);
  const wingR = wingL.clone();
  wingR.position.x = -0.33;
  owlGroup.add(wingL, wingR);

  owlGroup.userData = {
    headGroup,
    wingL,
    wingR,
    baseY: 0,
    jumpTimer: 0,
    flutterTimer: 0,
    stepCycle: 0
  };

  return owlGroup;
}

/* ==========================================================================
   Model 4: Low-Poly Rabbit (Kelinci Hutan)
   ========================================================================== */
function createRabbit() {
  const rabbitGroup = new THREE.Group();
  rabbitGroup.name = 'rabbit';

  const furWhite = createMat(0xf8fafc);
  const earPink = createMat(0xfecdd3);
  const nosePink = createMat(0xf43f5e);
  const eyeDark = createMat(0x0f172a);

  // Rounded Body
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.42, 0.65), furWhite);
  body.position.y = 0.32;
  rabbitGroup.add(body);

  // Head
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.52, 0.32);
  const head = new THREE.Mesh(new THREE.BoxGeometry(0.36, 0.32, 0.36), furWhite);
  headGroup.add(head);

  // Nose
  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), nosePink);
  nose.position.set(0, -0.04, 0.2);
  headGroup.add(nose);

  // Two Cute Dark Eyes
  [-0.14, 0.14].forEach(x => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.04, 4, 4), eyeDark);
    eye.position.set(x, 0.05, 0.14);
    headGroup.add(eye);
  });

  // Long Twitching Ears
  const earL = new THREE.Group();
  earL.position.set(0.11, 0.22, -0.04);
  const earLMesh = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.42, 0.08), furWhite);
  earLMesh.position.y = 0.2;
  earL.add(earLMesh);
  const innerL = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.32, 0.03), earPink);
  innerL.position.set(0, 0.2, 0.035);
  earL.add(innerL);

  const earR = earL.clone();
  earR.position.x = -0.11;

  headGroup.add(earL, earR);
  rabbitGroup.add(headGroup);

  // Front Paws
  const pawL = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.2, 0.12), furWhite);
  pawL.position.set(0.14, 0.1, 0.22);
  const pawR = pawL.clone();
  pawR.position.x = -0.14;
  rabbitGroup.add(pawL, pawR);

  // Back Hopping Thighs & Feet
  const thighL = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.26, 0.28), furWhite);
  thighL.position.set(0.22, 0.16, -0.16);
  const thighR = thighL.clone();
  thighR.position.x = -0.22;
  rabbitGroup.add(thighL, thighR);

  // Fluffy Tail
  const tail = new THREE.Mesh(new THREE.SphereGeometry(0.1, 5, 5), furWhite);
  tail.position.set(0, 0.32, -0.38);
  rabbitGroup.add(tail);

  rabbitGroup.userData = {
    headGroup,
    earL,
    earR,
    pawL,
    pawR,
    baseY: 0,
    jumpTimer: 0,
    hopTimer: 0,
    stepCycle: 0
  };

  return rabbitGroup;
}

/* ==========================================================================
   Animation Loop & Interactions
   ========================================================================== */
function animate() {
  requestAnimationFrame(animate);

  const delta = clock.getDelta();
  const time = clock.getElapsedTime();

  // Smooth Camera Lerp towards Target Focus
  const target = cameraTargets[currentFocus] || cameraTargets.forest;
  currentCamPos.lerp(target.pos, 0.05);
  currentLookAt.lerp(target.look, 0.05);

  // Mouse Parallax with Smooth Damping
  mouse.x += (mouse.targetX - mouse.x) * 0.06;
  mouse.y += (mouse.targetY - mouse.y) * 0.06;

  camera.position.x = currentCamPos.x + mouse.x * 0.45;
  camera.position.y = currentCamPos.y + mouse.y * 0.3;
  camera.lookAt(currentLookAt);

  // Autonomous navigation toward click target
  if (navTarget.active) {
    navigateActiveAnimalStep(delta);
  }

  if (isAnimating) {
    // 1. Fox Idle & Jump Animation
    if (fox) {
      const u = fox.userData;
      u.tailGroup.rotation.y = Math.sin(time * 3.5) * 0.35;
      u.headGroup.rotation.y = Math.sin(time * 1.5) * 0.15 + (mouse.x * 0.2);

      if (u.jumpTimer > 0) {
        u.jumpTimer -= delta * 3;
        fox.position.y = Math.max(0, Math.sin(u.jumpTimer * Math.PI) * 0.7);
        if (u.spinTimer > 0) {
          fox.rotation.y += delta * 7;
        }
      } else {
        fox.position.y = Math.sin(time * 2) * 0.03;
      }
    }

    // 2. Deer Idle & Hop Animation
    if (deer) {
      const u = deer.userData;
      u.headGroup.rotation.y = Math.sin(time * 0.8) * 0.25 + (mouse.x * 0.15);
      u.headGroup.rotation.x = Math.sin(time * 1.2) * 0.08;

      if (u.jumpTimer > 0) {
        u.jumpTimer -= delta * 2.5;
        deer.position.y = Math.max(0, Math.sin(u.jumpTimer * Math.PI) * 0.5);
      } else if (u.bowTimer > 0) {
        u.bowTimer -= delta * 2;
        u.headGroup.rotation.x = Math.sin(u.bowTimer * Math.PI) * 0.45;
      } else {
        deer.position.y = Math.sin(time * 1.5) * 0.025;
      }
    }

    // 3. Owl Head 180° Turn & Wing Flutter
    if (owl) {
      const u = owl.userData;
      u.headGroup.rotation.y = Math.sin(time * 0.9) * 1.35;

      if (u.flutterTimer > 0 || u.jumpTimer > 0) {
        if (u.flutterTimer > 0) u.flutterTimer -= delta * 2.5;
        if (u.jumpTimer > 0) u.jumpTimer -= delta * 2.5;
        u.wingL.rotation.z = Math.sin(time * 28) * 0.6;
        u.wingR.rotation.z = -Math.sin(time * 28) * 0.6;
      } else {
        u.wingL.rotation.z = 0;
        u.wingR.rotation.z = 0;
      }
    }

    // 4. Rabbit Cute Idle & Hop
    if (rabbit) {
      const u = rabbit.userData;
      u.headGroup.rotation.y = Math.sin(time * 2.2) * 0.18 + (mouse.x * 0.15);
      u.earL.rotation.z = Math.sin(time * 4) * 0.12;
      u.earR.rotation.z = -Math.sin(time * 4.5) * 0.12;

      if (u.jumpTimer > 0) {
        u.jumpTimer -= delta * 3.5;
        rabbit.position.y = Math.max(0, Math.sin(u.jumpTimer * Math.PI) * 0.6);
      } else {
        // Natural small rabbit hop cycle
        rabbit.position.y = Math.max(0, Math.sin(time * 3) * 0.06);
      }
    }

    // 5. Fireflies Twinkle & Drift (active in Malam & Sore)
    if (fireflies && fireflies.material.opacity > 0.05) {
      const pos = fireflies.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(time * 2 + i) * 0.0035;
        pos[i * 3]     += Math.cos(time + i) * 0.0025;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}

/* ==========================================================================
   Navigation & Movement Physics
   ========================================================================== */
function getActiveAnimalObject() {
  if (currentFocus === 'fox') return fox;
  if (currentFocus === 'deer') return deer;
  if (currentFocus === 'owl') return owl;
  if (currentFocus === 'rabbit') return rabbit;
  return null;
}

function moveActiveAnimal(forwardSteps) {
  const animal = getActiveAnimalObject();
  if (!animal) return;

  const stepSize = forwardSteps * 0.45;
  const targetX = animal.position.x + Math.sin(animal.rotation.y) * stepSize;
  const targetZ = animal.position.z + Math.cos(animal.rotation.y) * stepSize;

  // Boundary check: stay within 7.5 radius of clearing
  const dist = Math.sqrt(targetX * targetX + targetZ * targetZ);
  if (dist < 7.5) {
    animal.position.x = targetX;
    animal.position.z = targetZ;
  }

  // Leg / hop animation
  if (animal.userData) {
    animal.userData.stepCycle = (animal.userData.stepCycle || 0) + 1;
    animal.position.y = Math.abs(Math.sin(animal.userData.stepCycle * 0.8)) * 0.15;
  }

  updateCameraForAnimal(animal);
}

function rotateActiveAnimal(angleChange) {
  const animal = getActiveAnimalObject();
  if (!animal) return;
  animal.rotation.y += angleChange;
}

function jumpActiveAnimal() {
  const animal = getActiveAnimalObject();
  if (!animal || !animal.userData) return;
  animal.userData.jumpTimer = 1.0;
}

function performSpecialAction() {
  const animal = getActiveAnimalObject();
  if (!animal || !animal.userData) return;

  if (currentFocus === 'fox') {
    animal.userData.jumpTimer = 1.0;
    animal.userData.spinTimer = 1.0;
  } else if (currentFocus === 'deer') {
    animal.userData.bowTimer = 1.0;
    animal.userData.jumpTimer = 0.6;
  } else if (currentFocus === 'owl') {
    animal.userData.flutterTimer = 1.5;
  } else if (currentFocus === 'rabbit') {
    animal.userData.jumpTimer = 1.2;
  }
}

function resetActiveAnimal() {
  const animal = getActiveAnimalObject();
  if (!animal) return;
  const base = homePositions[currentFocus];
  if (base) {
    animal.position.set(base.x, base.y, base.z);
    animal.rotation.y = base.rotY;
  }
  navTarget.active = false;
  updateCameraForAnimal(animal);
}

function updateCameraForAnimal(animal) {
  if (cameraTargets[currentFocus]) {
    cameraTargets[currentFocus].look.set(animal.position.x, animal.position.y + 0.8, animal.position.z);
    cameraTargets[currentFocus].pos.set(
      animal.position.x - Math.sin(animal.rotation.y) * 4.2,
      animal.position.y + 2.0,
      animal.position.z - Math.cos(animal.rotation.y) * 4.2
    );
  }
}

function navigateActiveAnimalStep(delta) {
  const animal = getActiveAnimalObject();
  if (!animal) {
    navTarget.active = false;
    return;
  }

  const dx = navTarget.x - animal.position.x;
  const dz = navTarget.z - animal.position.z;
  const dist = Math.sqrt(dx * dx + dz * dz);

  if (dist < 0.2) {
    navTarget.active = false;
    animal.position.y = 0;
    return;
  }

  // Turn toward target
  const targetAngle = Math.atan2(dx, dz);
  let diff = targetAngle - animal.rotation.y;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;
  animal.rotation.y += diff * 0.15;

  // Move forward
  const speed = Math.min(dist, delta * 3.5);
  animal.position.x += Math.sin(animal.rotation.y) * speed;
  animal.position.z += Math.cos(animal.rotation.y) * speed;
  animal.position.y = Math.abs(Math.sin(clock.getElapsedTime() * 12)) * 0.12;

  updateCameraForAnimal(animal);
}

/* ==========================================================================
   Event Handlers
   ========================================================================== */
function onWindowResize() {
  if (!camera || !renderer) return;
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onMouseMove(e) {
  mouse.targetX = (e.clientX / window.innerWidth) * 2 - 1;
  mouse.targetY = -(e.clientY / window.innerHeight) * 2 + 1;
}

function onKeyDown(e) {
  // Ignore if user is currently typing in an input or textarea
  if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

  const validKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyS', 'KeyA', 'KeyD', 'Space'];
  if (!validKeys.includes(e.code)) return;

  if (currentFocus === 'forest') {
    // If viewing panorama, automatically switch to Fox when user starts walking
    setCameraFocus('fox');
  }

  if (e.code === 'ArrowUp' || e.code === 'KeyW') {
    e.preventDefault();
    moveActiveAnimal(1);
  } else if (e.code === 'ArrowDown' || e.code === 'KeyS') {
    e.preventDefault();
    moveActiveAnimal(-1);
  } else if (e.code === 'ArrowLeft' || e.code === 'KeyA') {
    e.preventDefault();
    rotateActiveAnimal(0.25);
  } else if (e.code === 'ArrowRight' || e.code === 'KeyD') {
    e.preventDefault();
    rotateActiveAnimal(-0.25);
  } else if (e.code === 'Space') {
    e.preventDefault();
    jumpActiveAnimal();
  }
}

function onCanvasClick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);

  // Check animal click first
  const animalMeshes = [fox, deer, owl, rabbit].filter(Boolean);
  const animalHits = raycaster.intersectObjects(animalMeshes, true);

  if (animalHits.length > 0) {
    let obj = animalHits[0].object;
    while (obj && !['fox', 'deer', 'owl', 'rabbit'].includes(obj.name)) {
      obj = obj.parent;
    }
    if (obj) {
      setCameraFocus(obj.name);
      triggerAnimalJump(obj.name);
      return;
    }
  }

  // Check terrain click for animal click-to-move
  if (terrainMesh && currentFocus !== 'forest') {
    const terrainHits = raycaster.intersectObject(terrainMesh, false);
    if (terrainHits.length > 0) {
      const hitPoint = terrainHits[0].point;
      const dist = Math.sqrt(hitPoint.x * hitPoint.x + hitPoint.z * hitPoint.z);
      if (dist < 7.5) {
        navTarget.x = hitPoint.x;
        navTarget.z = hitPoint.z;
        navTarget.active = true;
      }
    }
  }
}

function triggerAnimalJump(animalName) {
  const animal = animalName === 'fox' ? fox : animalName === 'deer' ? deer : animalName === 'owl' ? owl : rabbit;
  if (animal && animal.userData) {
    animal.userData.jumpTimer = 1.0;
  }
}

function setCameraFocus(targetName) {
  if (cameraTargets[targetName]) {
    currentFocus = targetName;
    navTarget.active = false;
    triggerAnimalJump(targetName);

    // Update active animal button across the UI
    document.querySelectorAll('.animal-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.animal === targetName);
    });

    // Update active animal status label
    const animalNameLabel = document.getElementById('activeAnimalName');
    if (animalNameLabel) {
      const names = {
        forest: 'Panorama Hutan',
        fox: 'Rubah Game',
        deer: 'Rusa Bertanduk',
        owl: 'Burung Hantu',
        rabbit: 'Kelinci Hutan'
      };
      animalNameLabel.textContent = names[targetName] || targetName;
    }
  }
}

function toggleAnimation() {
  isAnimating = !isAnimating;
  return isAnimating;
}

// Public API for app.js and HTML UI
window.forest3D = {
  setFocus: setCameraFocus,
  triggerJump: triggerAnimalJump,
  toggleAnimation: toggleAnimation,
  setTimePhase: setTimePhase,
  moveForward: () => moveActiveAnimal(1),
  moveBackward: () => moveActiveAnimal(-1),
  rotateLeft: () => rotateActiveAnimal(0.3),
  rotateRight: () => rotateActiveAnimal(-0.3),
  jump: jumpActiveAnimal,
  specialAction: performSpecialAction,
  resetPosition: resetActiveAnimal
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
