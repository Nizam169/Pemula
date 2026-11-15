/* ==========================================================================
   zamm.my.id - forest3d.js
   Enchanted 3D Low-Poly Forest & Game Animals (Three.js WebGL)
   Animals: Fox (Rubah), Deer (Rusa), Owl (Burung Hantu)
   ========================================================================== */

import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';

let scene, camera, renderer, clock;
let fox, deer, owl;
let fireflies;
let isAnimating = true;
let currentFocus = 'forest';

// Camera Targets for Smooth Interpolation
const cameraTargets = {
  forest: { pos: new THREE.Vector3(0, 3.8, 12.5), look: new THREE.Vector3(0, 1.2, 0) },
  fox:    { pos: new THREE.Vector3(-3.2, 1.8, 5.2), look: new THREE.Vector3(-2.8, 0.7, 0.5) },
  deer:   { pos: new THREE.Vector3(3.4, 2.2, 6.0), look: new THREE.Vector3(2.8, 1.3, 0) },
  owl:    { pos: new THREE.Vector3(0, 3.0, 5.8), look: new THREE.Vector3(0, 2.1, -1.2) }
};

const currentCamPos = new THREE.Vector3(0, 3.8, 12.5);
const currentLookAt = new THREE.Vector3(0, 1.2, 0);

// Mouse parallax
const mouse = { x: 0, y: 0, targetX: 0, targetY: 0 };
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2(-10, -10);

// Helper Toon / Low-Poly Shaded Material
const createMat = (color) => new THREE.MeshLambertMaterial({ color, flatShading: true });

function init() {
  const canvas = document.getElementById('forestCanvas');
  const container = document.getElementById('webglContainer');
  if (!canvas || !container) return;

  // Renderer Setup
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

  // Camera
  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.copy(currentCamPos);
  camera.lookAt(currentLookAt);

  clock = new THREE.Clock();

  // Lighting
  setupLighting();

  // Build Environment
  buildTerrain();
  buildTrees();
  buildRocksAndMushrooms();
  buildFireflies();

  // Build Animals
  fox = createFox();
  fox.position.set(-2.8, 0, 0.5);
  fox.rotation.y = 0.45;
  scene.add(fox);

  deer = createDeer();
  deer.position.set(2.8, 0, 0);
  deer.rotation.y = -0.55;
  scene.add(deer);

  owl = createOwl();
  owl.position.set(0, 0, -1.2);
  scene.add(owl);

  // Events
  window.addEventListener('resize', onWindowResize);
  window.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('click', onCanvasClick);

  // Visibility state
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) clock.stop();
    else clock.start();
  });

  // Start Animation Loop
  animate();
}

/* ==========================================================================
   Lighting Setup
   ========================================================================== */
function setupLighting() {
  // Ambient Soft Night Tone
  const ambient = new THREE.AmbientLight(0x1a334d, 1.4);
  scene.add(ambient);

  // Moonlight / Sunbeam Key Light
  const moonLight = new THREE.DirectionalLight(0xd1e8ff, 1.8);
  moonLight.position.set(10, 15, 8);
  scene.add(moonLight);

  // Warm Forest Floor Bounce Light
  const warmLight = new THREE.DirectionalLight(0xf59e0b, 0.6);
  warmLight.position.set(-8, -2, -5);
  scene.add(warmLight);
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
    if (dist < 8) elevation *= (dist / 8); // Flatter center clearing for animals
    pos.setZ(i, elevation);
  }
  geo.computeVertexNormals();

  const terrainMat = createMat(0x112419);
  const terrain = new THREE.Mesh(geo, terrainMat);
  terrain.rotation.x = -Math.PI / 2;
  terrain.position.y = -0.05;
  scene.add(terrain);
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
    [-0.8, 0, -0.8]
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
  const count = 75;
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
    baseY: 0,
    jumpTimer: 0
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
  });

  deerGroup.userData = {
    headGroup,
    baseY: 0,
    jumpTimer: 0
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
    jumpTimer: 0
  };

  return owlGroup;
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

  // Gentle Mouse Parallax
  mouse.x += (mouse.targetX - mouse.x) * 0.06;
  mouse.y += (mouse.targetY - mouse.y) * 0.06;

  camera.position.x = currentCamPos.x + mouse.x * 0.4;
  camera.position.y = currentCamPos.y + mouse.y * 0.25;
  camera.lookAt(currentLookAt);

  if (isAnimating) {
    // 1. Fox Idle & Jump Animation
    if (fox) {
      const u = fox.userData;
      u.tailGroup.rotation.y = Math.sin(time * 3.5) * 0.35;
      u.headGroup.rotation.y = Math.sin(time * 1.5) * 0.15 + (mouse.x * 0.2);

      if (u.jumpTimer > 0) {
        u.jumpTimer -= delta * 3;
        fox.position.y = Math.sin(u.jumpTimer * Math.PI) * 0.6;
        fox.rotation.y += delta * 4;
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
        deer.position.y = Math.sin(u.jumpTimer * Math.PI) * 0.4;
      } else {
        deer.position.y = Math.sin(time * 1.5) * 0.025;
      }
    }

    // 3. Owl Head 180° Turn & Wing Flutter
    if (owl) {
      const u = owl.userData;
      u.headGroup.rotation.y = Math.sin(time * 0.9) * 1.2;

      if (u.jumpTimer > 0) {
        u.jumpTimer -= delta * 3;
        u.wingL.rotation.z = Math.sin(time * 25) * 0.5;
        u.wingR.rotation.z = -Math.sin(time * 25) * 0.5;
      } else {
        u.wingL.rotation.z = 0;
        u.wingR.rotation.z = 0;
      }
    }

    // 4. Fireflies Twinkle & Drift
    if (fireflies) {
      const pos = fireflies.geometry.attributes.position.array;
      const count = pos.length / 3;
      for (let i = 0; i < count; i++) {
        pos[i * 3 + 1] += Math.sin(time * 2 + i) * 0.003;
        pos[i * 3]     += Math.cos(time + i) * 0.002;
      }
      fireflies.geometry.attributes.position.needsUpdate = true;
    }
  }

  renderer.render(scene, camera);
}

/* ==========================================================================
   Event Handlers & Public API
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

function onCanvasClick(e) {
  const rect = renderer.domElement.getBoundingClientRect();
  pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects([fox, deer, owl], true);

  if (intersects.length > 0) {
    let obj = intersects[0].object;
    while (obj && !['fox', 'deer', 'owl'].includes(obj.name)) {
      obj = obj.parent;
    }
    if (obj) {
      triggerAnimalJump(obj.name);
      setCameraFocus(obj.name);
    }
  }
}

function triggerAnimalJump(animalName) {
  const animal = animalName === 'fox' ? fox : animalName === 'deer' ? deer : owl;
  if (animal && animal.userData) {
    animal.userData.jumpTimer = 1;
  }
}

function setCameraFocus(targetName) {
  if (cameraTargets[targetName]) {
    currentFocus = targetName;
    triggerAnimalJump(targetName);

    // Update UI active button
    document.querySelectorAll('.animal-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.animal === targetName);
    });
  }
}

function toggleAnimation() {
  isAnimating = !isAnimating;
  return isAnimating;
}

// Expose API for app.js
window.forest3D = {
  setFocus: setCameraFocus,
  triggerJump: triggerAnimalJump,
  toggleAnimation: toggleAnimation
};

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
