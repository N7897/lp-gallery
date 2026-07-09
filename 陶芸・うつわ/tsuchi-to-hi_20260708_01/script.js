/* ================================================================
   土と火 TSUCHI TO HI — interactions
   主役：轆轤スクラブ（土 → 器 → 釉 → 火）
   支援：ヘッダー地色反転 / セクション・リビール
   ================================================================ */
(function () {
  "use strict";

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp  = function (a, b, t) { return a + (b - a) * t; };
  var norm  = function (p, a, b) { return clamp((p - a) / (b - a), 0, 1); };

  /* ---------- element refs ---------- */
  var hero        = document.getElementById("hero");
  var header      = document.getElementById("siteHeader");
  var wheelHead   = document.getElementById("wheelHead");
  var marksGroup  = document.getElementById("wheelMarks");
  var clayBody    = document.getElementById("clayBody");
  var clayGlaze   = document.getElementById("clayGlaze");
  var clipPath    = document.getElementById("clayClipPath");
  var throwLines  = document.getElementById("throwLines");
  var core        = document.getElementById("core");
  var ember       = document.getElementById("ember");
  var stageNum    = document.getElementById("stageNum");
  var stageName   = document.getElementById("stageName");
  var stageLabel  = document.getElementById("stageLabel");

  var CX = 300, BASE_Y = 470;

  /* ---------- vessel keyframes ---------- */
  var K0 = { footR: 118, bellyR: 150, rimR: 120, topY: 392, bellyY: 436 }; // 土のかたまり
  var K1 = { footR: 96,  bellyR: 118, rimR: 110, topY: 300, bellyY: 418 }; // 立ち上げ
  var K2 = { footR: 60,  bellyR: 158, rimR: 150, topY: 320, bellyY: 402 }; // 開いた碗

  function mix(a, b, t) {
    return {
      footR:  lerp(a.footR,  b.footR,  t),
      bellyR: lerp(a.bellyR, b.bellyR, t),
      rimR:   lerp(a.rimR,   b.rimR,   t),
      topY:   lerp(a.topY,   b.topY,   t),
      bellyY: lerp(a.bellyY, b.bellyY, t)
    };
  }
  function paramsAt(p) {
    if (p < 0.42) return mix(K0, K1, norm(p, 0, 0.42));
    if (p < 0.62) return mix(K1, K2, norm(p, 0.42, 0.62));
    return K2;
  }
  function vesselPath(P) {
    var fR = P.footR, bR = P.bellyR, rR = P.rimR, tY = P.topY, bY = P.bellyY;
    var lip = rR * 0.15;
    return "M " + (CX - fR) + " " + BASE_Y +
      " C " + (CX - fR - 6) + " " + lerp(BASE_Y, bY, .45) + " " + (CX - bR) + " " + lerp(bY, BASE_Y, .35) + " " + (CX - bR) + " " + bY +
      " C " + (CX - bR) + " " + lerp(bY, tY, .5)  + " " + (CX - rR) + " " + lerp(tY, bY, .35) + " " + (CX - rR) + " " + tY +
      " C " + (CX - rR * .5) + " " + (tY - lip) + " " + (CX + rR * .5) + " " + (tY - lip) + " " + (CX + rR) + " " + tY +
      " C " + (CX + rR) + " " + lerp(tY, bY, .35) + " " + (CX + bR) + " " + lerp(bY, tY, .5)  + " " + (CX + bR) + " " + bY +
      " C " + (CX + bR) + " " + lerp(bY, BASE_Y, .35) + " " + (CX + fR + 6) + " " + lerp(BASE_Y, bY, .45) + " " + (CX + fR) + " " + BASE_Y +
      " Z";
  }

  /* ---------- build static SVG bits ---------- */
  function svg(tag, attrs) {
    var el = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) el.setAttribute(k, attrs[k]);
    return el;
  }
  // throw rings (轆轤目) — clipped to the body
  for (var y = 296; y <= 452; y += 20) {
    throwLines.appendChild(svg("ellipse", {
      cx: CX, cy: y, rx: 210, ry: 2.2, fill: "rgba(38,24,12,.16)"
    }));
  }
  // spinning marks on the wheel head
  var MARKS = 16, markEls = [];
  for (var m = 0; m < MARKS; m++) {
    var e = svg("ellipse", { rx: 5.5, ry: 2, fill: "#5A4632" });
    marksGroup.appendChild(e);
    markEls.push(e);
  }

  /* ---------- stages ---------- */
  var STAGES = [
    { at: 0.00, num: "01", name: "土揉み" },
    { at: 0.16, num: "02", name: "水挽き" },
    { at: 0.46, num: "03", name: "削り" },
    { at: 0.62, num: "04", name: "素焼き" },
    { at: 0.74, num: "05", name: "釉掛け" },
    { at: 0.88, num: "06", name: "本焼き" }
  ];
  var curStage = 0; // HTML already renders 01 / 土揉み
  function setStage(p) {
    var idx = 0;
    for (var i = 0; i < STAGES.length; i++) if (p >= STAGES[i].at) idx = i;
    if (idx === curStage) return;
    curStage = idx;
    stageLabel.classList.add("is-swapping");
    setTimeout(function () {
      stageNum.textContent = STAGES[idx].num;
      stageName.textContent = STAGES[idx].name;
      stageLabel.classList.remove("is-swapping");
    }, reduce ? 0 : 200);
  }

  /* ---------- render clay at progress p ---------- */
  function renderClay(p) {
    var P = paramsAt(p);
    var d = vesselPath(P);
    clayBody.setAttribute("d", d);
    clayGlaze.setAttribute("d", d);
    clipPath.setAttribute("d", d);

    // glaze arrives (釉掛け → 本焼き)
    clayGlaze.setAttribute("opacity", (norm(p, 0.72, 0.9) * 0.94).toFixed(3));
    // throw rings fade in during throwing
    throwLines.setAttribute("opacity", (norm(p, 0.18, 0.4) * 0.9).toFixed(3));
    // brief centre light while raising the wall
    var c = norm(p, 0.05, 0.18) * (1 - norm(p, 0.32, 0.5));
    core.setAttribute("cx", CX);
    core.setAttribute("cy", P.topY + 6);
    core.setAttribute("rx", (18 + 30 * c).toFixed(1));
    core.setAttribute("ry", (6 + 10 * c).toFixed(1));
    core.setAttribute("opacity", (c * 0.6).toFixed(3));
    // kiln fire at the finale
    ember.setAttribute("opacity", (norm(p, 0.86, 1) * 0.85).toFixed(3));

    setStage(p);
  }

  /* ---------- spinning wheel ---------- */
  var spinAngle = 0, spinning = false, heroInView = true, lastT = 0, curP = 0;
  function drawMarks() {
    var rx = 205, ry = 50, cy = 494;
    for (var i = 0; i < MARKS; i++) {
      var a = spinAngle + (i / MARKS) * Math.PI * 2;
      var s = Math.sin(a);
      markEls[i].setAttribute("cx", (CX + rx * Math.cos(a)).toFixed(1));
      markEls[i].setAttribute("cy", (cy + ry * s).toFixed(1));
      markEls[i].setAttribute("opacity", (0.25 + 0.55 * (s * 0.5 + 0.5)).toFixed(2));
    }
  }
  function spinLoop(t) {
    if (!spinning) return;
    var dt = lastT ? (t - lastT) : 16; lastT = t;
    // faster while actively throwing
    var speed = 0.0016 + 0.0026 * (norm(curP, 0.1, 0.55) * (1 - norm(curP, 0.7, 1)));
    spinAngle += dt * speed;
    drawMarks();
    requestAnimationFrame(spinLoop);
  }
  function startSpin() {
    if (spinning || reduce) return;
    spinning = true; lastT = 0; requestAnimationFrame(spinLoop);
  }
  function stopSpin() { spinning = false; }

  /* ---------- scroll driver ---------- */
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var total = hero.offsetHeight - window.innerHeight;
      var p = clamp((window.scrollY - hero.offsetTop) / (total || 1), 0, 1);
      curP = p;
      renderClay(p);
      hero.classList.toggle("is-scrolled", p > 0.02);
      header.classList.toggle("is-solid", window.scrollY > hero.offsetHeight - 90);
      ticking = false;
    });
  }

  /* ---------- init ---------- */
  if (reduce) {
    renderClay(1);           // show the finished, glazed bowl
    drawMarks();
    header.classList.add("is-solid");
  } else {
    renderClay(0);
    drawMarks();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    onScroll();

    // pause the spin loop when the hero leaves the viewport
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (ents) {
        heroInView = ents[0].isIntersecting;
        if (heroInView) startSpin(); else stopSpin();
      }, { threshold: 0 }).observe(hero);
    } else {
      startSpin();
    }
  }

  /* ---------- reveal on scroll ---------- */
  var revealSel = [
    ".section-title", ".eyebrow", ".step", ".piece", ".swatch",
    ".course", ".ph__body", ".ph__title", ".glaze__lead",
    ".workshop__lead", ".access__lead", ".access__info", ".collection__note"
  ].join(",");
  var targets = document.querySelectorAll(revealSel);
  if ("IntersectionObserver" in window && !reduce) {
    targets.forEach(function (el, i) {
      el.classList.add("reveal");
      el.style.transitionDelay = (Math.min(i % 6, 5) * 0.06) + "s";
    });
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    targets.forEach(function (el) { io.observe(el); });
  } else {
    targets.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- smooth anchor nav offset (fixed header) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
