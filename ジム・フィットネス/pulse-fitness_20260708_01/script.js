(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- NAV stuck ---- */
  var nav = document.getElementById("nav");
  function onScrollNav() {
    if (window.scrollY > 40) nav.classList.add("is-stuck");
    else nav.classList.remove("is-stuck");
  }
  onScrollNav();
  window.addEventListener("scroll", onScrollNav, { passive: true });

  /* ---- Reveal (with line stagger) ---- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  var lineGroups = document.querySelectorAll(".mani__h");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });

    var lio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var lines = e.target.querySelectorAll("[data-line]");
        lines.forEach(function (l, i) {
          setTimeout(function () { l.classList.add("in"); }, i * 140);
        });
        lio.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    lineGroups.forEach(function (g) { lio.observe(g); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-line]").forEach(function (l) { l.classList.add("in"); });
  }

  /* ---- Count up ---- */
  var counters = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var start = performance.now(), dur = 1400;
    function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCount(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (c) { cio.observe(c); });
  } else {
    counters.forEach(function (c) { c.textContent = c.getAttribute("data-count") + (c.getAttribute("data-suffix") || ""); });
  }

  /* ---- Program tab filter ---- */
  var tabs = document.querySelectorAll(".tab");
  var cards = document.querySelectorAll(".prog__grid .card");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active"); tab.setAttribute("aria-selected", "true");
      var f = tab.getAttribute("data-filter");
      cards.forEach(function (card) {
        var cats = card.getAttribute("data-cat") || "";
        var show = f === "all" || cats.indexOf(f) !== -1;
        card.classList.toggle("is-hidden", !show);
      });
    });
  });

  /* ---- Magnetic buttons ---- */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      var rect;
      el.addEventListener("mouseenter", function () { rect = el.getBoundingClientRect(); });
      el.addEventListener("mousemove", function (ev) {
        if (!rect) rect = el.getBoundingClientRect();
        var mx = ev.clientX - (rect.left + rect.width / 2);
        var my = ev.clientY - (rect.top + rect.height / 2);
        el.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---- SIGNATURE: scroll-velocity kinetic type + band ---- */
  var kine = document.querySelector("[data-kine]");
  var kineEcho = kine ? kine.querySelector(".kine__echo") : null;
  var bands = document.querySelectorAll("[data-band]");
  var lastY = window.scrollY, velocity = 0, smooth = 0, bandBase = 0;

  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    velocity += (y - lastY);
    lastY = y;
  }, { passive: true });

  function loop() {
    // decay raw velocity, smooth follow
    velocity *= 0.82;
    smooth += (velocity - smooth) * 0.18;
    var v = Math.max(-90, Math.min(90, smooth));

    if (kine) {
      var skew = v * 0.16;                 // deg
      var shift = -v * 0.9;                // px
      kine.style.transform = "translateX(" + shift + "px) skewX(" + skew + "deg)";
      if (kineEcho) {
        var mag = Math.min(Math.abs(v) / 90, 1);
        kineEcho.style.opacity = (mag * 0.7).toFixed(3);
        kineEcho.style.transform = "translateX(" + (v * 0.55) + "px)";
      }
    }
    // kinetic band: continuous drift + velocity boost
    bandBase -= (0.6 + Math.abs(v) * 0.05);
    bands.forEach(function (b) {
      var w = b.scrollWidth / 2 || 1;
      var x = bandBase % w;
      b.style.transform = "translateX(" + x + "px)";
    });
    requestAnimationFrame(loop);
  }
  if (!reduce) requestAnimationFrame(loop);

  /* ---- Smooth anchor focus for a11y ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      t.setAttribute("tabindex", "-1");
      setTimeout(function () { t.focus({ preventScroll: true }); }, reduce ? 0 : 480);
    });
  });
})();
