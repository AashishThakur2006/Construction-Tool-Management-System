/* PLINTH marketing site — scroll reveal, sticky-header shadow, parallax orbs,
   stat count-up. Landing pages only. Bails out under prefers-reduced-motion. */
(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* scroll progress bar */
  var prog = document.createElement("div");
  prog.className = "scroll-prog";
  document.body.appendChild(prog);

  var header = document.querySelector(".site-header");
  var orbs = [];
  document.querySelectorAll(".orb").forEach(function (el, i) {
    orbs.push({ el: el, rate: [-0.05, 0.08, -0.035][i % 3] });
  });

  function onScroll() {
    var h = document.documentElement;
    var max = h.scrollHeight - h.clientHeight;
    var y = h.scrollTop;
    prog.style.width = (max > 0 ? (y / max) * 100 : 0) + "%";
    if (header) header.classList.toggle("is-stuck", y > 8);
    if (!reduce) {
      for (var i = 0; i < orbs.length; i++) {
        orbs[i].el.style.transform = "translate3d(0," + (y * orbs[i].rate).toFixed(1) + "px,0)";
      }
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (reduce) return;

  /* reveal on scroll — stagger siblings within a container */
  var groups = {};
  document.querySelectorAll(".reveal").forEach(function (el) {
    var parent = el.parentElement;
    (groups[parentKey(parent)] = groups[parentKey(parent)] || []).push(el);
  });
  function parentKey(p) {
    if (!p.__k) p.__k = "g" + Math.random().toString(36).slice(2);
    return p.__k;
  }
  Object.keys(groups).forEach(function (k) {
    groups[k].forEach(function (el, i) {
      if (!/\bd[1-4]\b/.test(el.className) && i > 0 && i < 5) {
        el.classList.add("d" + Math.min(i, 4));
      }
    });
  });

  // Last-resort: if anything is still hidden after 4s (observer never fired,
  // e.g. tab was backgrounded), just show it.
  setTimeout(function () {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      if (el.getBoundingClientRect().top < window.innerHeight) el.classList.add("in");
    });
  }, 4000);

  var io = new IntersectionObserver(
    function (entries) {
      entries.forEach(function (e) {
        // reveal when intersecting, or if we've already scrolled past it
        if (e.isIntersecting || e.boundingClientRect.top < window.innerHeight) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: "0px 0px -5% 0px" }
  );
  var pending = [];
  document.querySelectorAll(".reveal").forEach(function (el) {
    // anything already at/above the fold on load: show immediately
    if (el.getBoundingClientRect().top < window.innerHeight * 0.92) el.classList.add("in");
    else { io.observe(el); pending.push(el); }
  });

  // Safety sweep on scroll — guarantees nothing stays stuck if the observer
  // misses a fast scroll past a section.
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      ticking = false;
      var vh = window.innerHeight;
      pending = pending.filter(function (el) {
        if (el.getBoundingClientRect().top < vh * 0.95) {
          el.classList.add("in");
          io.unobserve(el);
          return false;
        }
        return true;
      });
    });
  }, { passive: true });

  /* number count-up in the stat band */
  var stats = document.querySelector(".stats");
  if (stats) {
    var run = false;
    var sio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting || run) return;
        run = true;
        sio.disconnect();
        stats.querySelectorAll(".n").forEach(function (nEl) {
          var target = parseInt(nEl.textContent.replace(/[^\d]/g, ""), 10);
          if (isNaN(target)) return;
          var start = performance.now(), dur = 950;
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
