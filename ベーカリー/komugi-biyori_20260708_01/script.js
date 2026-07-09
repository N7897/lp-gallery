(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };

  /* header state */
  var head = document.getElementById("siteHead");
  var onScrollHead = function () {
    if (window.scrollY > 24) head.classList.add("is-solid");
    else head.classList.remove("is-solid");
  };
  onScrollHead();
  window.addEventListener("scroll", onScrollHead, { passive: true });

  /* reveal on enter */
  var revealSel = ".section-index,.story__title,.story__body,.breads__head,.tile,.mat,.materials__lede,.timetable li,.hours__head,.visit__card,.bake__caption";
  var revealEls = Array.prototype.slice.call(document.querySelectorAll(revealSel));
  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in"); });
  } else {
    revealEls.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (Math.min(i % 6, 5) * 60) + "ms";
    });
    var ro = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); ro.unobserve(e.target); }
      });
    }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(function (el) { ro.observe(el); });
  }

  /* ---- bake scrub (signature) ---- */
  var bake = document.getElementById("bake");
  var cs = [document.getElementById("cs0"), document.getElementById("cs1"), document.getElementById("cs2")];
  var glowStop = document.getElementById("glowStop");
  var scores = [document.getElementById("score1"), document.getElementById("score2"), document.getElementById("score3")];
  var steam = document.getElementById("steam");
  var fermVal = document.getElementById("fermVal");
  var tempVal = document.getElementById("tempVal");
  var bakeVal = document.getElementById("bakeVal");
  var phases = Array.prototype.slice.call(document.querySelectorAll(".bake__phases li"));

  var pale = [[242,226,198],[236,216,180],[226,201,159]];
  var gold = [[230,184,119],[217,159,82],[200,135,58]];
  var deep = [[185,119,46],[156,90,31],[124,65,20]];
  var rgb = function (a) { return "rgb(" + a[0] + "," + a[1] + "," + a[2] + ")"; };
  var mix = function (a, b, t) { return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))]; };

  var scoreLen = [];
  if (scores[0]) {
    scores.forEach(function (s) {
      var L = 100;
      try { L = s.getTotalLength(); } catch (e) {}
      scoreLen.push(L);
      s.style.strokeDasharray = L;
      s.style.strokeDashoffset = L;
    });
  }

  var pad = function (n, w) { n = String(Math.round(n)); while (n.length < w) n = "0" + n; return n; };

  var applyBake = function (p) {
    var t = p < 0.5 ? p / 0.5 : 1;
    var t2 = p < 0.5 ? 0 : (p - 0.5) / 0.5;
    for (var i = 0; i < 3; i++) {
      var base = [pale, gold, deep];
      var c = t2 > 0 ? mix(gold[i], deep[i], t2) : mix(pale[i], gold[i], t);
      if (cs[i]) cs[i].setAttribute("stop-color", rgb(c));
    }
    if (bake) bake.style.setProperty("--bake", (clamp((p - 0.25) / 0.75, 0, 1) * 0.9).toFixed(3));
    if (glowStop) glowStop.setAttribute("stop-opacity", (clamp((p - 0.3) / 0.7, 0, 1) * 0.5).toFixed(3));

    var sp = clamp((p - 0.15) / 0.4, 0, 1);
    for (var j = 0; j < scores.length; j++) {
      if (scores[j]) scores[j].style.strokeDashoffset = (scoreLen[j] * (1 - sp)).toFixed(1);
    }

    var st = clamp((p - 0.55) / 0.45, 0, 1);
    if (steam) {
      steam.style.opacity = st;
      steam.style.transform = "translateY(" + lerp(14, -6, st).toFixed(1) + "px)";
    }

    if (fermVal) fermVal.textContent = pad(lerp(0, 18, clamp(p / 0.5, 0, 1)), 2);
    if (tempVal) tempVal.textContent = pad(lerp(20, 250, p), 3);
    if (bakeVal) bakeVal.textContent = pad(lerp(0, 100, p), 2);

    var idx = p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.7 ? 2 : p < 0.9 ? 3 : 4;
    for (var k = 0; k < phases.length; k++) phases[k].classList.toggle("on", k === idx);
  };

  var bakeTicking = false;
  var updateBake = function () {
    if (!bake) return;
    var total = bake.offsetHeight - window.innerHeight;
    if (total <= 0) { applyBake(0); return; }
    var p = clamp(-bake.getBoundingClientRect().top / total, 0, 1);
    applyBake(p);
    bakeTicking = false;
  };
  var reqBake = function () {
    if (!bakeTicking) { bakeTicking = true; requestAnimationFrame(updateBake); }
  };
  window.addEventListener("scroll", reqBake, { passive: true });
  window.addEventListener("resize", reqBake, { passive: true });
  applyBake(0);
  requestAnimationFrame(updateBake);

  /* ---- hero flour dust ---- */
  var canvas = document.getElementById("dust");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var hero = canvas.parentElement;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var W = 0, H = 0, motes = [], running = false, raf = 0;
    var resize = function () {
      W = hero.clientWidth; H = hero.clientHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(70, Math.round(W * H / 26000));
      motes = [];
      for (var i = 0; i < n; i++) {
        motes.push({
          x: Math.random() * W, y: Math.random() * H,
          r: Math.random() * 1.6 + 0.4,
          vy: -(Math.random() * 0.22 + 0.06),
          vx: (Math.random() - 0.5) * 0.16,
          a: Math.random() * 0.4 + 0.15,
          ph: Math.random() * Math.PI * 2
        });
      }
    };
    var draw = function (ts) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < motes.length; i++) {
        var m = motes[i];
        m.y += m.vy; m.x += m.vx + Math.sin(ts / 1400 + m.ph) * 0.12;
        if (m.y < -6) { m.y = H + 6; m.x = Math.random() * W; }
        if (m.x < -6) m.x = W + 6; if (m.x > W + 6) m.x = -6;
        ctx.beginPath();
        ctx.arc(m.x, m.y, m.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(150,70,15," + m.a * 0.5 + ")";
        ctx.fill();
      }
      raf = requestAnimationFrame(draw);
    };
    var start = function () { if (!running) { running = true; raf = requestAnimationFrame(draw); } };
    var stop = function () { running = false; cancelAnimationFrame(raf); };
    resize();
    window.addEventListener("resize", resize, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (en) {
        en.forEach(function (e) { if (e.isIntersecting) start(); else stop(); });
      }, { threshold: 0 }).observe(hero);
    } else { start(); }
  }

  /* year-safe: nothing else */
})();
