/*
  PLINTH — signature: the allocation field.
  A canvas-2D particle field that encodes the product's core logic:
    · every particle is one asset from the live dataset
    · idle assets drift loose and dim across the field
    · allocated assets lock into slow orbit around their job's node
    · workshop assets gather, amber, along the lower edge
    · job nodes gain visual mass as they absorb assets (radius ∝ √count)
    · every few seconds one real transaction plays: an allocation,
      a return, or a job-to-job transfer, traced as a comet arc
  Scoped by design to the shell only: login backdrop, loader, the dashboard
  hero panel, and empty states. Never behind tables, forms, or modals.
  prefers-reduced-motion: renders one static, truthful frame — no loop.
*/

const COLORS = {
  field: "#f0f2f4",
  grid: "rgba(29, 29, 31, 0.06)",
  idle: "rgba(29, 29, 31, 0.32)",
  allocated: "#0f68ea",
  workshop: "#e0a800",
  node: "rgba(15, 104, 234, 0.1)",
  nodeRing: "rgba(15, 104, 234, 0.55)",
  comet: "#1d1d1f",
  label: "rgba(29, 29, 31, 0.6)",
};

function mulberry32(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function createField(canvas, opts = {}) {
  const reduced =
    opts.forceStatic === true ||
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mode = opts.mode || "full"; // full | hero | empty
  const rand = mulberry32(opts.seed || 7);
  const ctx = canvas.getContext("2d");

  let W = 0, H = 0, dpr = 1;
  let nodes = [], particles = [], comet = null;
  let nextEventAt = 2000;
  let disposed = false;
  let t0 = performance.now();

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = rect.width; H = rect.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    layout();
    if (reduced) drawFrame(0);
  }

  function layout() {
    const jobs = (opts.data && opts.data.jobs) || [];
    const pad = mode === "hero" ? 46 : 80;
    nodes = jobs.map((job, i) => {
      // golden-angle placement keeps nodes spread at any count
      const a = i * 2.399963 + 0.9;
      const rr = 0.3 + 0.62 * ((i + 0.7) / (jobs.length + 0.7));
      const cx = W / 2 + Math.cos(a) * (W / 2 - pad) * rr;
      const cy = H / 2 + Math.sin(a) * (H / 2 - pad) * rr * 0.92;
      return {
        job,
        x: cx, y: cy,
        r: nodeRadius(job.allocated),
        shownR: nodeRadius(job.allocated),
        pulse: rand() * Math.PI * 2,
      };
    });

    particles = [];
    nodes.forEach((n, ni) => {
      for (let k = 0; k < n.job.allocated; k++) {
        particles.push(makeOrbiter(ni));
      }
    });
    const idleCount = (opts.data && opts.data.idle) || 0;
    for (let k = 0; k < idleCount; k++) particles.push(makeDrifter());
    const shopCount = (opts.data && opts.data.workshop) || 0;
    for (let k = 0; k < shopCount; k++) particles.push(makeWorkshop(k, shopCount));
  }

  function nodeRadius(count) {
    return (mode === "hero" ? 7 : 9) + Math.sqrt(count + 1) * (mode === "hero" ? 3.2 : 4.2);
  }

  function makeOrbiter(nodeIndex) {
    return {
      kind: "allocated",
      node: nodeIndex,
      ang: rand() * Math.PI * 2,
      dist: 7 + rand() * 13,
      speed: (0.12 + rand() * 0.2) * (rand() > 0.5 ? 1 : -1),
      size: 1.4 + rand() * 1.2,
    };
  }
  function makeDrifter() {
    return {
      kind: "idle",
      x: rand() * W, y: rand() * H,
      p1: rand() * 10, p2: rand() * 10,
      s1: 0.15 + rand() * 0.3, s2: 0.1 + rand() * 0.25,
      size: 1.2 + rand() * 1.1,
    };
  }
  function makeWorkshop(k, total) {
    const span = Math.min(W * 0.5, total * 16 + 24);
    return {
      kind: "workshop",
      x: W / 2 - span / 2 + (k + 0.5) * (span / total),
      y: H - (mode === "hero" ? 18 : 30),
      p1: rand() * 10,
      size: 1.6 + rand() * 0.8,
    };
  }

  function drawFrame(t) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = COLORS.field;
    ctx.fillRect(0, 0, W, H);

    // survey grid
    ctx.strokeStyle = COLORS.grid;
    ctx.lineWidth = 1;
    const step = mode === "hero" ? 36 : 52;
    ctx.beginPath();
    for (let x = step; x < W; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
    for (let y = step; y < H; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
    ctx.stroke();

    if (mode === "empty") {
      // real emptiness: a single slow scan line, nothing else
      const sx = ((t * 0.02) % (W + 200)) - 100;
      ctx.fillStyle = "rgba(15, 104, 234, 0.07)";
      ctx.fillRect(sx - 60, 0, 120, H);
      return;
    }

    // nodes
    nodes.forEach((n) => {
      n.shownR += (n.r - n.shownR) * 0.06;
      const pulse = reduced ? 0.5 : (Math.sin(t * 0.0011 + n.pulse) + 1) / 2;
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.shownR + pulse * 3, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.node;
      ctx.fill();
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.shownR, 0, Math.PI * 2);
      ctx.strokeStyle = COLORS.nodeRing;
      ctx.lineWidth = 1.25;
      ctx.stroke();
      if (opts.labels && mode !== "hero") {
        ctx.fillStyle = COLORS.label;
        ctx.font = "10px ui-monospace, Consolas, monospace";
        ctx.textAlign = "center";
        ctx.fillText(n.job.code || n.job.name, n.x, n.y + n.shownR + 14);
      }
    });

    // particles
    particles.forEach((p) => {
      let x, y, color, alpha;
      if (p.kind === "allocated") {
        const n = nodes[p.node];
        if (!n) return;
        p.ang += reduced ? 0 : p.speed * 0.016;
        x = n.x + Math.cos(p.ang) * (n.shownR + p.dist);
        y = n.y + Math.sin(p.ang) * (n.shownR + p.dist) * 0.9;
        color = COLORS.allocated; alpha = 0.9;
      } else if (p.kind === "idle") {
        if (!reduced) {
          p.x += Math.sin(t * 0.0004 * p.s1 * 10 + p.p1) * 0.35;
          p.y += Math.cos(t * 0.0004 * p.s2 * 10 + p.p2) * 0.3;
          if (p.x < -6) p.x = W + 6; if (p.x > W + 6) p.x = -6;
          if (p.y < -6) p.y = H + 6; if (p.y > H + 6) p.y = -6;
        }
        x = p.x; y = p.y; color = COLORS.idle; alpha = 1;
      } else {
        x = p.x + (reduced ? 0 : Math.sin(t * 0.002 + p.p1) * 1.6);
        y = p.y; color = COLORS.workshop; alpha = 0.85;
      }
      ctx.globalAlpha = alpha;
      ctx.beginPath();
      ctx.arc(x, y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // transaction comet
    if (comet) {
      const k = Math.min(1, (t - comet.t0) / comet.dur);
      const e = 1 - Math.pow(1 - k, 3);
      const x = (1 - e) * (1 - e) * comet.x0 + 2 * (1 - e) * e * comet.cx + e * e * comet.x1;
      const y = (1 - e) * (1 - e) * comet.y0 + 2 * (1 - e) * e * comet.cy + e * e * comet.y1;
      comet.trail.push([x, y]);
      if (comet.trail.length > 14) comet.trail.shift();
      comet.trail.forEach(([tx, ty], i) => {
        ctx.globalAlpha = (i / comet.trail.length) * 0.6;
        ctx.beginPath();
        ctx.arc(tx, ty, 1.6, 0, Math.PI * 2);
        ctx.fillStyle = COLORS.comet;
        ctx.fill();
      });
      ctx.globalAlpha = 1;
      ctx.beginPath();
      ctx.arc(x, y, 2.4, 0, Math.PI * 2);
      ctx.fillStyle = COLORS.comet;
      ctx.fill();
      if (k >= 1) { comet.done(); comet = null; }
    }
  }

  function startEvent(t) {
    if (nodes.length === 0) return;
    const idlers = particles.filter((p) => p.kind === "idle");
    const roll = rand();
    let from, to, particle;

    if (roll < 0.45 && idlers.length > 0) {
      // allocation: idle asset joins a job
      particle = idlers[Math.floor(rand() * idlers.length)];
      const ni = Math.floor(rand() * nodes.length);
      from = { x: particle.x, y: particle.y };
      to = nodes[ni];
      launch(from, to, () => {
        Object.assign(particle, makeOrbiter(ni));
        nodes[ni].r = nodeRadius(++nodes[ni].job.allocated);
      });
    } else if (roll < 0.75 && nodes.length > 1) {
      // transfer between jobs
      const a = Math.floor(rand() * nodes.length);
      let b = Math.floor(rand() * nodes.length);
      if (b === a) b = (b + 1) % nodes.length;
      const movers = particles.filter((p) => p.kind === "allocated" && p.node === a);
      if (movers.length === 0) return;
      particle = movers[0];
      launch(nodes[a], nodes[b], () => {
        nodes[a].r = nodeRadius(--nodes[a].job.allocated);
        Object.assign(particle, makeOrbiter(b));
        nodes[b].r = nodeRadius(++nodes[b].job.allocated);
      });
    } else {
      // return: allocated asset released back to the yard
      const movers = particles.filter((p) => p.kind === "allocated");
      if (movers.length === 0) return;
      particle = movers[Math.floor(rand() * movers.length)];
      const n = nodes[particle.node];
      launch(n, { x: rand() * W, y: rand() * H * 0.5 }, () => {
        n.r = nodeRadius(--n.job.allocated);
        Object.assign(particle, makeDrifter(), { x: comet ? comet.x1 : rand() * W });
      });
    }

    function launch(a, b, done) {
      const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
      const dx = b.x - a.x, dy = b.y - a.y;
      const len = Math.hypot(dx, dy) || 1;
      comet = {
        x0: a.x, y0: a.y, x1: b.x, y1: b.y,
        cx: mx - (dy / len) * len * 0.25,
        cy: my + (dx / len) * len * 0.25,
        t0: t, dur: 1100 + len * 1.2, trail: [], done,
      };
    }
  }

  let started = false;
  function frame(now) {
    if (disposed) return;
    if (started && !canvas.isConnected) { dispose(); return; }
    started = true;
    requestAnimationFrame(frame);
    const t = now - t0;
    if (mode !== "empty" && !comet && t > nextEventAt) {
      startEvent(t);
      nextEventAt = t + 2600 + rand() * 2800;
    }
    drawFrame(t);
  }

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();
  if (!reduced) requestAnimationFrame(frame);
  else drawFrame(0);

  function dispose() { disposed = true; ro.disconnect(); }

  return {
    reduced,
    setData(data) { opts.data = data; layout(); if (reduced) drawFrame(0); },
    dispose,
  };
}
