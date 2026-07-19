/*
  SIGNATURE — "The Frame Rises"
  A procedural hyperboloid timber lattice: two woven families of straight
  members spanning a bottom and top ring with opposite twist. Scroll drives
  assembly (members fly in bottom-first along a spiral stagger), the cursor
  tilts the camera and stirs a sway spring, and pulse() sends a light wave
  up the structure. Everything is generated in code — no models, no textures.
*/

import * as THREE from "three";

const COUNT_PER_FAMILY = 32;
const RADIUS = 9.0;
const HEIGHT = 15.0;
const TWIST = Math.PI * 0.52; // twist between foot and head of each member
const RING_LEVELS = [0.0, 0.5, 1.0];

const WOOD_BASE = new THREE.Color("#a67c52");
const WOOD_VARIANTS = [
  new THREE.Color("#a67c52"),
  new THREE.Color("#8f6844"),
  new THREE.Color("#b98d5f"),
  new THREE.Color("#7c5a3c"),
];
const EMBER = new THREE.Color("#c96f4a");

function easeOutCubic(t) {
  return 1 - Math.pow(1 - t, 3);
}

function memberEndpoints(i, count, sign) {
  const theta = (i / count) * Math.PI * 2;
  const a = new THREE.Vector3(
    RADIUS * Math.cos(theta),
    0,
    RADIUS * Math.sin(theta)
  );
  const b = new THREE.Vector3(
    RADIUS * Math.cos(theta + sign * TWIST),
    HEIGHT,
    RADIUS * Math.sin(theta + sign * TWIST)
  );
  return { a, b };
}

// radius of the lattice envelope at height fraction t (used for ring beams)
function envelopeRadius(t) {
  const c = Math.cos(TWIST);
  return RADIUS * Math.sqrt((1 - t) * (1 - t) + t * t + 2 * t * (1 - t) * c);
}

export function createSignature(canvas, opts = {}) {
  const reduced =
    window.matchMedia("(prefers-reduced-motion: reduce)").matches ||
    opts.forceStatic === true;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(new THREE.Color(opts.fog ?? "#1a1714"), 30, 78);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 200);

  // ---- lights -------------------------------------------------------------
  const hemi = new THREE.HemisphereLight("#f3e3c8", "#171310", 0.85);
  scene.add(hemi);
  const key = new THREE.DirectionalLight("#ffd9a8", 1.6);
  key.position.set(18, 26, 10);
  scene.add(key);
  const rim = new THREE.DirectionalLight("#c96f4a", 0.7);
  rim.position.set(-20, 8, -16);
  scene.add(rim);

  const group = new THREE.Group();
  scene.add(group);

  // ---- members (two instanced families) -----------------------------------
  const memberGeo = new THREE.BoxGeometry(0.2, 1, 0.42);
  const memberMat = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    roughness: 0.62,
    metalness: 0.04,
  });

  const families = [];
  const up = new THREE.Vector3(0, 1, 0);
  const tmpM = new THREE.Matrix4();
  const tmpQ = new THREE.Quaternion();
  const tmpQ2 = new THREE.Quaternion();
  const tmpV = new THREE.Vector3();
  const tmpS = new THREE.Vector3();

  [1, -1].forEach((sign, f) => {
    const mesh = new THREE.InstancedMesh(
      memberGeo,
      memberMat.clone(),
      COUNT_PER_FAMILY
    );
    mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const members = [];
    for (let i = 0; i < COUNT_PER_FAMILY; i++) {
      const { a, b } = memberEndpoints(i, COUNT_PER_FAMILY, sign);
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const dir = b.clone().sub(a);
      const len = dir.length();
      const quat = new THREE.Quaternion().setFromUnitVectors(
        up,
        dir.clone().normalize()
      );

      // scattered start state: pushed radially out, dropped, tumbled
      const outward = mid
        .clone()
        .setY(0)
        .normalize()
        .multiplyScalar(RADIUS * (1.7 + Math.random() * 1.4));
      const startPos = new THREE.Vector3(
        outward.x,
        -4 - Math.random() * 7,
        outward.z
      );
      const startQuat = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(
          Math.random() * Math.PI,
          Math.random() * Math.PI,
          Math.random() * Math.PI
        )
      );

      // spiral stagger: lower feet & spiral order arrive first
      const delay =
        0.62 * ((i / COUNT_PER_FAMILY + f * 0.5) % 1) * 0.9 +
        0.06 * Math.random();

      const color = WOOD_VARIANTS[(i + f) % WOOD_VARIANTS.length]
        .clone()
        .offsetHSL(0, 0, (Math.random() - 0.5) * 0.05);
      mesh.setColorAt(i, color);

      members.push({
        endPos: mid,
        endQuat: quat,
        len,
        startPos,
        startQuat,
        delay,
        baseColor: color,
        midY: mid.y,
      });
    }
    mesh.instanceColor.needsUpdate = true;
    group.add(mesh);
    families.push({ mesh, members });
  });

  // ---- ring beams ---------------------------------------------------------
  const ringMat = new THREE.MeshStandardMaterial({
    color: "#6e5138",
    roughness: 0.7,
    metalness: 0.05,
    transparent: true,
    opacity: 0,
  });
  const rings = RING_LEVELS.map((t) => {
    const r = envelopeRadius(t);
    const geo = new THREE.TorusGeometry(r, 0.16, 10, 90);
    const ring = new THREE.Mesh(geo, ringMat.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.y = t * HEIGHT;
    group.add(ring);
    return { mesh: ring, t };
  });

  // ---- roof ring + ground slab -------------------------------------------
  const roof = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS + 1.1, RADIUS + 1.1, 0.34, 72),
    new THREE.MeshStandardMaterial({
      color: "#3d3227",
      roughness: 0.55,
      metalness: 0.15,
      transparent: true,
      opacity: 0,
    })
  );
  roof.position.y = HEIGHT + 0.45;
  group.add(roof);

  const slab = new THREE.Mesh(
    new THREE.CylinderGeometry(RADIUS + 2.6, RADIUS + 3.0, 0.5, 80),
    new THREE.MeshStandardMaterial({
      color: "#26211b",
      roughness: 0.92,
      metalness: 0,
    })
  );
  slab.position.y = -0.3;
  group.add(slab);

  // faint ground disc shadow-catcher feel
  const halo = new THREE.Mesh(
    new THREE.RingGeometry(RADIUS + 3.2, RADIUS + 11, 64),
    new THREE.MeshBasicMaterial({
      color: "#0f0d0b",
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide,
    })
  );
  halo.rotation.x = -Math.PI / 2;
  halo.position.y = -0.04;
  group.add(halo);

  // ---- state --------------------------------------------------------------
  const state = {
    progress: reduced ? 1 : 0,
    shownProgress: reduced ? 1 : 0,
    pointer: new THREE.Vector2(0, 0),
    pointerSmooth: new THREE.Vector2(0, 0),
    sway: 0,
    swayVel: 0,
    pulses: [],
    idle: 0,
    disposed: false,
  };

  function applyMembers() {
    const p = state.shownProgress;
    for (const family of families) {
      const { mesh, members } = family;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        const span = 1 - 0.62;
        const lp = easeOutCubic(
          Math.min(1, Math.max(0, (p - m.delay) / span))
        );
        tmpV.lerpVectors(m.startPos, m.endPos, lp);
        tmpQ.slerpQuaternions(m.startQuat, m.endQuat, lp);
        const wobble = state.sway * (m.midY / HEIGHT) * 0.05;
        tmpQ2.setFromAxisAngle(up, wobble);
        tmpQ.premultiply(tmpQ2);
        tmpS.set(1, m.len * (0.35 + 0.65 * lp), 1);
        tmpM.compose(tmpV, tmpQ, tmpS);
        mesh.setMatrixAt(i, tmpM);
      }
      mesh.instanceMatrix.needsUpdate = true;
    }
    for (const r of rings) {
      const lp = Math.min(1, Math.max(0, (p - 0.55 - r.t * 0.25) / 0.2));
      r.mesh.material.opacity = lp;
      r.mesh.scale.setScalar(0.92 + 0.08 * easeOutCubic(lp));
    }
    const roofP = Math.min(1, Math.max(0, (p - 0.86) / 0.14));
    roof.material.opacity = roofP;
    roof.position.y = HEIGHT + 0.45 + (1 - easeOutCubic(roofP)) * 5;
  }

  function applyPulses(now) {
    let any = false;
    for (const family of families) {
      const { mesh, members } = family;
      for (let i = 0; i < members.length; i++) {
        const m = members[i];
        let boost = 0;
        for (const pulse of state.pulses) {
          const age = (now - pulse.t0) / 1000;
          const waveY = age * 14 - 2;
          const d = Math.abs(m.midY - waveY);
          boost += Math.exp(-d * d * 0.35) * Math.max(0, 1 - age / 1.6);
        }
        if (boost > 0.01) any = true;
        tmpColor.copy(m.baseColor).lerp(EMBER, Math.min(1, boost));
        mesh.setColorAt(i, tmpColor);
      }
      mesh.instanceColor.needsUpdate = true;
    }
    state.pulses = state.pulses.filter((pl) => (now - pl.t0) / 1000 < 1.8);
    return any;
  }
  const tmpColor = new THREE.Color();

  function layoutCamera() {
    const p = state.shownProgress;
    const px = state.pointerSmooth.x;
    const py = state.pointerSmooth.y;
    const angle = state.idle * 0.06 + px * 0.42 + p * 1.2;
    const camR = 40 - p * 4;
    const camY = 3.5 + p * 8 + py * -2.4;
    camera.position.set(
      Math.sin(angle) * camR,
      camY,
      Math.cos(angle) * camR
    );
    camera.lookAt(0, 3.0 + p * 4.5, 0);
  }

  function resize() {
    const w = canvas.clientWidth || canvas.parentElement.clientWidth;
    const h = canvas.clientHeight || canvas.parentElement.clientHeight;
    if (w === 0 || h === 0) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();
  window.addEventListener("resize", resize);

  let lastFrame = performance.now();
  function frame(now) {
    if (state.disposed) return;
    requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - lastFrame) / 1000);
    lastFrame = now;

    state.idle += dt * (reduced ? 0.15 : 1);
    state.shownProgress +=
      (state.progress - state.shownProgress) * Math.min(1, dt * 6);
    state.pointerSmooth.lerp(state.pointer, Math.min(1, dt * 4));

    // sway spring (stirred by cursor movement)
    const springK = 14;
    const damping = 3.4;
    state.swayVel += -state.sway * springK * dt - state.swayVel * damping * dt;
    state.sway += state.swayVel * dt;

    applyMembers();
    applyPulses(now);
    layoutCamera();
    renderer.render(scene, camera);
  }
  requestAnimationFrame(frame);

  let lastPX = 0;
  return {
    reduced,
    setProgress(p) {
      state.progress = reduced ? 1 : Math.min(1, Math.max(0, p));
    },
    setPointer(nx, ny) {
      state.pointer.set(nx, ny);
      state.swayVel += (nx - lastPX) * 2.2;
      lastPX = nx;
    },
    pulse() {
      state.pulses.push({ t0: performance.now() });
    },
    resize,
    dispose() {
      state.disposed = true;
      window.removeEventListener("resize", resize);
      renderer.dispose();
    },
  };
}
