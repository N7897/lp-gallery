/* ============ 光房 KŌBŌ — interactions ============ */
(function () {
  "use strict";
  var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;

  /* ---- header solidify ---- */
  var header = document.getElementById("siteHeader");
  var onScrollHeader = function () {
    if (window.scrollY > 40) header.classList.add("is-solid");
    else header.classList.remove("is-solid");
  };
  window.addEventListener("scroll", onScrollHeader, { passive: true });
  onScrollHeader();

  /* ---- reveal on scroll ---- */
  var revealEls = document.querySelectorAll("[data-reveal], .study, .step");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---- HERO: cursor = key light ---- */
  var stage = document.getElementById("heroStage");
  var lit = document.getElementById("heroLit");
  var light = document.getElementById("heroLight");
  var hint = document.getElementById("heroHint");
  if (stage && lit && light && !reduce) {
    var tx = 60, ty = 42, cx = 60, cy = 42, raf = null, moved = false;
    var render = function () {
      cx += (tx - cx) * 0.14;
      cy += (ty - cy) * 0.14;
      lit.style.setProperty("--mx", cx.toFixed(2) + "%");
      lit.style.setProperty("--my", cy.toFixed(2) + "%");
      var w = stage.clientWidth, h = stage.clientHeight;
      light.style.transform = "translate3d(" + (cx / 100 * w - light.offsetWidth / 2).toFixed(1) +
        "px," + (cy / 100 * h - light.offsetHeight / 2).toFixed(1) + "px,0)";
      if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf = requestAnimationFrame(render);
      else raf = null;
    };
    var kick = function () { if (raf == null) raf = requestAnimationFrame(render); };
    var setFromEvent = function (clientX, clientY) {
      var r = stage.getBoundingClientRect();
      tx = Math.max(0, Math.min(100, (clientX - r.left) / r.width * 100));
      ty = Math.max(0, Math.min(100, (clientY - r.top) / r.height * 100));
      kick();
      if (!moved) { moved = true; if (hint) hint.style.opacity = "0.35"; }
    };
    stage.addEventListener("pointermove", function (e) { setFromEvent(e.clientX, e.clientY); }, { passive: true });
    stage.addEventListener("touchmove", function (e) {
      if (e.touches && e.touches[0]) setFromEvent(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });
    stage.addEventListener("pointerleave", function () { tx = 60; ty = 42; kick(); });
    // gentle idle drift so the light feels alive before interaction
    if (!coarse) {
      var t0 = performance.now();
      var drift = function (now) {
        if (moved) return;
        var p = (now - t0) / 1000;
        tx = 58 + Math.sin(p * 0.6) * 10;
        ty = 42 + Math.cos(p * 0.45) * 6;
        kick();
        requestAnimationFrame(drift);
      };
      requestAnimationFrame(drift);
    }
  }

  /* ---- APERTURE intro (progressive enhancement) ---- */
  if (!reduce) {
    var ap = document.createElement("div");
    ap.className = "kobo-aperture";
    ap.setAttribute("aria-hidden", "true");
    ap.innerHTML =
      '<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">' +
      '<defs><mask id="kbIris"><rect width="100" height="100" fill="#fff"/>' +
      '<polygon id="kbHole" points="50,36 62.12,43 62.12,57 50,64 37.88,57 37.88,43" fill="#000"/></mask></defs>' +
      '<rect width="100" height="100" fill="#0B0C10" mask="url(#kbIris)"/>' +
      '<g id="kbBlades" stroke="rgba(247,238,221,0.5)" stroke-width="0.4">' +
      '<line x1="50" y1="50" x2="50" y2="36"/><line x1="50" y1="50" x2="62.12" y2="43"/>' +
      '<line x1="50" y1="50" x2="62.12" y2="57"/><line x1="50" y1="50" x2="50" y2="64"/>' +
      '<line x1="50" y1="50" x2="37.88" y2="57"/><line x1="50" y1="50" x2="37.88" y2="43"/></g></svg>';
    var css = document.createElement("style");
    css.textContent =
      ".kobo-aperture{position:fixed;inset:0;z-index:300;pointer-events:none}" +
      ".kobo-aperture svg{width:100%;height:100%}" +
      "#kbBlades{transform-origin:50px 50px;transform-box:fill-box;opacity:.9}";
    document.head.appendChild(css);
    document.body.appendChild(ap);
    document.body.style.overflow = "hidden";
    var hole = ap.querySelector("#kbHole");
    var blades = ap.querySelector("#kbBlades");
    var start = null, DUR = 950;
    var ease = function (t) { return 1 - Math.pow(1 - t, 3); };
    var open = function (now) {
      if (start == null) start = now;
      var p = Math.min(1, (now - start) / DUR);
      var e = ease(p);
      var s = 0.02 + e * 2.6;
      hole.setAttribute("transform", "translate(50 50) scale(" + s.toFixed(3) + ") translate(-50 -50) rotate(" + (e * 22).toFixed(2) + " 50 50)");
      if (blades) { blades.style.transform = "rotate(" + (e * 26) + "deg)"; blades.style.opacity = String(0.9 * (1 - e)); }
      if (p < 1) requestAnimationFrame(open);
      else {
        ap.style.transition = "opacity .35s ease";
        ap.style.opacity = "0";
        document.body.style.overflow = "";
        setTimeout(function () { if (ap.parentNode) ap.parentNode.removeChild(ap); }, 400);
      }
    };
    requestAnimationFrame(function (t) { requestAnimationFrame(open); });
    // safety: never leave the page covered
    setTimeout(function () {
      document.body.style.overflow = "";
      if (ap.parentNode) ap.parentNode.removeChild(ap);
    }, 2600);
  }

  /* ---- STUDIES strip: drag to scroll + traveling spotlight ---- */
  var strip = document.getElementById("strip");
  var stripLight = document.getElementById("stripLight");
  if (strip) {
    var down = false, startX = 0, startScroll = 0, moved2 = false;
    strip.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return; // let native momentum scroll handle touch
      down = true; moved2 = false; startX = e.clientX; startScroll = strip.scrollLeft;
      strip.classList.add("is-dragging");
      strip.setPointerCapture && strip.setPointerCapture(e.pointerId);
    });
    strip.addEventListener("pointermove", function (e) {
      if (stripLight && !reduce) {
        var r = strip.getBoundingClientRect();
        stripLight.style.transform = "translate3d(" + (e.clientX - r.left) + "px," + (e.clientY - r.top) + "px,0) translate(-50%,-50%)";
      }
      if (!down) return;
      var dx = e.clientX - startX;
      if (Math.abs(dx) > 4) moved2 = true;
      strip.scrollLeft = startScroll - dx;
    });
    var up = function (e) {
      down = false; strip.classList.remove("is-dragging");
      if (e && e.pointerId != null && strip.releasePointerCapture) {
        try { strip.releasePointerCapture(e.pointerId); } catch (err) {}
      }
    };
    strip.addEventListener("pointerup", up);
    strip.addEventListener("pointercancel", up);
    // prevent click-through after a drag
    strip.addEventListener("click", function (e) { if (moved2) { e.preventDefault(); } }, true);
    // keyboard scroll
    strip.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") { strip.scrollLeft += 260; e.preventDefault(); }
      if (e.key === "ArrowLeft") { strip.scrollLeft -= 260; e.preventDefault(); }
    });
  }

  /* ---- smooth anchor + close mobile nav offset ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var y = target.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
