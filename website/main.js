/*
  ATELIER TERRANE — main.js
  Wires the signature (js/signature.js) into the whole page:
    · overall scroll progress = assembly height of the 15 m frame
    · nav shows the live datum readout (+00.00 M → +15.00 M)
    · cursor stirs the lattice; hovers on [data-pulse] send a light wave up it
    · GSAP reveals set their own initial states (page is complete without JS)
    · Lenis smooth scroll; everything respects prefers-reduced-motion
*/

import { createSignature } from "./js/signature.js";

const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const FRAME_HEIGHT_M = 15;

// ---- signature ------------------------------------------------------------

let sig = null;
try {
  sig = createSignature(document.getElementById("stage-canvas"));
} catch (err) {
  // WebGL unavailable — the page remains fully readable without the stage.
  console.warn("Signature disabled:", err);
}

// ---- loader (only shown when JS runs; ≤ 2 s) ------------------------------

const loader = document.getElementById("loader");
if (loader && !reduced) {
  loader.classList.add("is-active");
  const datum = document.getElementById("loaderDatum");
  const t0 = performance.now();
  const D = 1500;
  (function tick(now) {
    const p = Math.min(1, (now - t0) / D);
    const eased = 1 - Math.pow(1 - p, 3);
    datum.textContent = `+${(eased * FRAME_HEIGHT_M).toFixed(2).padStart(5, "0")} M`;
    if (p < 1) requestAnimationFrame(tick);
    else {
      loader.style.transition = "opacity 0.4s ease";
      loader.style.opacity = "0";
      setTimeout(() => loader.remove(), 450);
    }
  })(t0);
} else if (loader) {
  loader.remove();
}

// ---- smooth scroll --------------------------------------------------------

let lenis = null;
if (!reduced && typeof Lenis !== "undefined") {
  lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  }
  requestAnimationFrame(raf);

  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const target = document.querySelector(a.getAttribute("href"));
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      }
    });
  });
}

// ---- scroll progress → assembly + datum readout ---------------------------

const navDatum = document.getElementById("navDatum");
function onScroll() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const p = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
  if (sig) sig.setProgress(p);
  if (navDatum) {
    navDatum.textContent = `+${(p * FRAME_HEIGHT_M).toFixed(2).padStart(5, "0")} M`;
  }
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---- cursor stirs the frame ----------------------------------------------

if (sig && !reduced) {
  window.addEventListener(
    "pointermove",
    (e) => {
      sig.setPointer(
        (e.clientX / window.innerWidth) * 2 - 1,
        (e.clientY / window.innerHeight) * 2 - 1
      );
    },
    { passive: true }
  );
}

// ---- hovers feed the signature -------------------------------------------

document.querySelectorAll("[data-pulse]").forEach((el) => {
  el.addEventListener("pointerenter", () => sig && sig.pulse());
  el.addEventListener("focus", () => sig && sig.pulse());
});

// ---- GSAP choreography ----------------------------------------------------

if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined" && !reduced) {
  gsap.registerPlugin(ScrollTrigger);
  if (lenis) {
    lenis.on("scroll", ScrollTrigger.update);
  }

  // reveals: initial state is set here, from JS — no CSS-hidden content
  document.querySelectorAll("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 44,
      opacity: 0,
      duration: 0.9,
      ease: "power3.out",
      scrollTrigger: { trigger: el, start: "top 88%" },
    });
  });

  // section entries pulse the frame
  document.querySelectorAll("main > section").forEach((sec) => {
    ScrollTrigger.create({
      trigger: sec,
      start: "top 60%",
      onEnter: () => sig && sig.pulse(),
    });
  });

  // showpiece: crossfade the three captions while the frame stays pinned
  const captions = gsap.utils.toArray(".showpiece-caption");
  if (captions.length) {
    gsap.set(captions, { opacity: 0, y: 24 });
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: ".showpiece",
        start: "top top",
        end: "bottom bottom",
        scrub: 0.4,
      },
    });
    captions.forEach((cap, i) => {
      tl.to(cap, { opacity: 1, y: 0, duration: 0.18 }, i * 0.32 + 0.04);
      // every caption exits — the last one leaves just before the pin releases
      const exitAt = i < captions.length - 1 ? i * 0.32 + 0.26 : 0.92;
      tl.to(cap, { opacity: 0, y: -20, duration: 0.14 }, exitAt);
    });
  }
} else {
  // reduced motion or GSAP failed: everything stays visible; captions stack
  document.querySelectorAll(".showpiece-caption").forEach((cap, i) => {
    cap.style.position = "relative";
    cap.style.bottom = "auto";
    cap.style.left = "auto";
    cap.style.right = "auto";
    cap.style.marginBottom = "32px";
  });
}
