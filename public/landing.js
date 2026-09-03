/* PLINTH marketing site — scroll reveal, parallax orbs, progress bar.
   Landing pages only. Bails out under prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- scroll progress bar ---- */
  var prog = document.createElement("div");
  prog.className = "scroll-prog";
  document.body.appendChild(prog);

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    prog.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";

    if (!reduce) {
      var y = h.scrollTop;
      orbs.forEach(function (o, i) {
        o.el.style.transform = "translate3d(0," + (y * o.rate).toFixed(1) + "px,0)";
      });
    }
  }

  /* ---- parallax orbs ---- */
  var orbs = [];
  document.querySelectorAll(".orb").forEach(function (el, i) {
    orbs.push({ el: el, rate: [-0.06, 0.09, -0.04][i % 3] });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  /* ---- reveal on scroll ---- */
  var SEL = ".section > .wrap > *, .feature-row, .card, .plan, .person, .stats, .cta-band, .faq details, .hero__art";
  var targets = [];
  document.querySelectorAll(SEL).forEach(function (el) {
    // don't double-wrap nested matches
    if (el.closest(".reveal") && el.classList.contains("reveal") === false && el.parentElement.classList.contains("reveal")) return;
    el.classList.add("reveal");
    targets.push(el);
  });

  // stagger siblings inside a grid
  document.querySelectorAll(".grid, .price-grid, .stats").forEach(function (grid) {
    Array.prototype.forEach.call(grid.children, function (child, i) {
      if (child.classList.contains("reveal")) child.classList.add("d" + Math.min(i + 1, 4));
    });
  });

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
  );
  targets.forEach(function (t) { io.observe(t); });

  /* ---- number count-up in the stat band ---- */
  var stats = document.querySelector(".stats");
  if (stats) {
    var run = false;
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || run) return;
        run = true;
        sio.disconnect();
        stats.querySelectorAll(".n").forEach(function (nEl) {
          var target = parseInt(nEl.textContent, 10);
          if (isNaN(target)) return;
          var start = performance.now(), dur = 900;
          (function tick(now) {
            var p = Math.min(1, (now - start) / dur);
            var eased = 1 - Math.pow(1 - p, 3);
            nEl.textContent = Math.round(target * eased).toString();
            if (p < 1) requestAnimationFrame(tick);
            else nEl.textContent = target.toString();
          })(start);
        });
      });
    }, { threshold: 0.4 });
    sio.observe(stats);
  }
})();
