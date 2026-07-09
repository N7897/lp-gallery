/* =========================================================
   淹 EN — ドリップ抽出 scrub 署名
   ・ヒーローをピン留めし、スクロール進捗 p(0→1) を
     「注ぐ→蒸らし(ふくらむ)→抽出(雫)→一杯(満ちる)」へ写像
   ・湯気/雫/泡は rAF で常時生かし、画面外は停止(電池/GPU)
   ・reduced-motion / 狭幅 は最終状態を静止提示
   ========================================================= */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var $ = function (s, r) { return (r || document).querySelector(s); };

  /* ---------- header ---------- */
  var head = $("#siteHead");
  var onScrollHead = function () {
    if (window.scrollY > 24) head.classList.add("scrolled");
    else head.classList.remove("scrolled");
  };
  onScrollHead();
  window.addEventListener("scroll", onScrollHead, { passive: true });

  /* ---------- reveal ---------- */
  var reveals = [];
  var addReveal = function (el, cls) { el.classList.add("reveal"); if (cls) el.classList.add(cls); reveals.push(el); };
  $(".intro-h") && addReveal($(".intro-h"));
  Array.prototype.forEach.call(document.querySelectorAll(".intro .col-b, .intro .col-c"), function (e, i) { addReveal(e, "d" + (i + 1)); });
  Array.prototype.forEach.call(document.querySelectorAll(".beans-head, .bean"), function (e, i) { addReveal(e, "d" + (i % 4 + 1)); });
  Array.prototype.forEach.call(document.querySelectorAll(".guide-head, .step"), function (e, i) { addReveal(e, "d" + (i % 4 + 1)); });
  Array.prototype.forEach.call(document.querySelectorAll(".place-inner > *, .reserve > *"), function (e, i) { addReveal(e, "d" + (i % 4 + 1)); });

  if ("IntersectionObserver" in window) {
    var ro = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); } });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (e) { ro.observe(e); });
  } else {
    reveals.forEach(function (e) { e.classList.add("in"); });
  }

  /* ---------- brew scene refs ---------- */
  var hero = $(".hero");
  var svg = $(".brew-svg");
  var pour = $(".pour");
  var spiral = $(".spiral-path");
  var bed = $(".bed");
  var bubbles = svg ? svg.querySelectorAll(".bubbles circle") : [];
  var drips = svg ? svg.querySelectorAll(".drip") : [];
  var fill = $(".server-fill");
  var ripples = svg ? svg.querySelectorAll(".ripple") : [];
  var steam = $(".steam");
  var steamLines = svg ? svg.querySelectorAll(".st") : [];
  var railFill = $(".rail-fill");
  var railDot = $(".rail-dot");
  var railSteps = document.querySelectorAll(".rail-steps li");
  var brewTime = $("#brewTime");

  var FILL_EMPTY = 0, FILL_FULL = -102; /* server-fill translateY range */

  /* progress-driven (scrub) render */
  var lastStep = -1;
  function renderScrub(p) {
    p = clamp(p, 0, 1);

    /* 注ぐ: pour線を描く(0→.30) → その後フェード */
    var pourP = clamp(p / 0.30, 0, 1);
    if (pour) {
      pour.style.strokeDashoffset = (100 - pourP * 100).toFixed(1);
      pour.style.opacity = p < 0.02 ? 0 : (p > 0.34 ? clamp((0.46 - p) / 0.12, 0, 1) : 1);
    }
    if (spiral) {
      var spP = clamp((p - 0.06) / 0.32, 0, 1);
      spiral.style.strokeDashoffset = (100 - spP * 100).toFixed(1);
      spiral.style.opacity = p > 0.36 ? clamp((0.5 - p) / 0.14, 0, 1) : 1;
    }

    /* 蒸らし: 粉床がドーム状にふくらむ(.30→.55) */
    var bloom;
    if (p < 0.30) bloom = 1;
    else if (p < 0.44) bloom = lerp(1, 1.95, (p - 0.30) / 0.14);   /* rise */
    else if (p < 0.55) bloom = lerp(1.95, 1.28, (p - 0.44) / 0.11); /* settle */
    else bloom = 1.28;
    if (bed) bed.style.transform = "scaleY(" + bloom.toFixed(3) + ")";
    var bubO = clamp((p - 0.30) / 0.12, 0, 1) * (p > 0.6 ? clamp((0.9 - p) / 0.3, 0.25, 1) : 1);
    for (var i = 0; i < bubbles.length; i++) bubbles[i].dataset.baseO = bubO;

    /* 抽出→一杯: サーバーに満ちる(.5→1) */
    var fillP = clamp((p - 0.5) / 0.5, 0, 1);
    if (fill) fill.style.transform = "translateY(" + lerp(FILL_EMPTY, FILL_FULL, fillP).toFixed(1) + "px)";

    /* rail */
    if (railFill) railFill.style.height = (p * 100).toFixed(1) + "%";
    if (railDot) railDot.style.top = (p * 100).toFixed(1) + "%";
    var step = clamp(Math.floor(p * 3.999), 0, 3);
    if (step !== lastStep) {
      for (var s = 0; s < railSteps.length; s++) railSteps[s].classList.toggle("on", s === step);
      lastStep = step;
    }
    if (brewTime) {
      var sec = Math.round(p * 180);
      brewTime.textContent = Math.floor(sec / 60) + ":" + ("0" + (sec % 60)).slice(-2);
    }
  }

  /* ---------- idle rAF (steam sway, bubbles twinkle, drips) ---------- */
  var inView = true, running = false, t0 = 0, curP = 0;
  var dripPhase = [0, 0.33, 0.66];

  function frame(ts) {
    if (!running) return;
    if (!t0) t0 = ts;
    var t = (ts - t0) / 1000;

    /* steam */
    for (var i = 0; i < steamLines.length; i++) {
      var el = steamLines[i];
      var sway = Math.sin(t * 1.1 + i * 1.7) * 3;
      el.style.transform = "translateX(" + sway + "px)";
      el.style.strokeDashoffset = (60 - ((t * 22 + i * 20) % 60)).toFixed(1);
      el.style.opacity = (0.5 + 0.4 * Math.sin(t * 0.9 + i)).toFixed(2);
    }

    /* bubbles twinkle */
    for (var b = 0; b < bubbles.length; b++) {
      var base = parseFloat(bubbles[b].dataset.baseO || 0);
      var tw = 0.55 + 0.45 * Math.sin(t * 2.2 + b * 1.3);
      bubbles[b].style.fill = "rgba(232,196,158," + (base * tw).toFixed(3) + ")";
    }

    /* drips (only while extracting) */
    var drO = clamp((curP - 0.5) / 0.12, 0, 1) * clamp((1.02 - curP) / 0.15, 0, 1);
    var landed = -1;
    for (var d = 0; d < drips.length; d++) {
      var cyc = (t * 0.9 + dripPhase[d]) % 1;      /* 0..1 fall cycle */
      var y = cyc * 34;                             /* fall distance */
      drips[d].style.transform = "translateY(" + y.toFixed(1) + "px)";
      drips[d].style.opacity = (drO * (cyc < 0.9 ? 1 : 0)).toFixed(2);
      if (cyc > 0.86 && cyc < 0.92 && drO > 0.2) landed = d;
    }
    /* ripple on landing */
    if (landed >= 0 && ripples.length) {
      var rp = ripples[landed % ripples.length];
      var rt = (t * 0.9) % 1;
      var rr = (rt * 26);
      rp.setAttribute("rx", rr.toFixed(1));
      rp.setAttribute("ry", (rr * 0.32).toFixed(1));
      rp.style.opacity = clamp(drO * (1 - rt), 0, 1).toFixed(2);
      var fy = fill ? (512 + FILL_FULL * clamp((curP - 0.5) / 0.5, 0, 1)) : 512;
      rp.setAttribute("cy", clamp(fy, 402, 512).toFixed(1));
    }

    requestAnimationFrame(frame);
  }
  function start() { if (running || reduce) return; running = true; t0 = 0; requestAnimationFrame(frame); }
  function stop() { running = false; }

  /* ---------- scroll → progress ---------- */
  var isPinned = function () { return window.innerWidth > 680 && !reduce; };
  var ticking = false;
  function updateP() {
    ticking = false;
    if (!hero) return;
    if (!isPinned()) { curP = 1; renderScrub(1); return; }
    var rect = hero.getBoundingClientRect();
    var dist = hero.offsetHeight - window.innerHeight;
    var p = dist > 0 ? clamp(-rect.top / dist, 0, 1) : 0;
    curP = p;
    renderScrub(p);
  }
  function onScroll() { if (!ticking) { ticking = true; requestAnimationFrame(updateP); } }

  /* ---------- observe hero for idle rAF ---------- */
  if (svg && "IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (ents) {
      inView = ents[0].isIntersecting;
      if (inView) start(); else stop();
    }, { threshold: 0.02 });
    io.observe(hero);
  } else { inView = true; start(); }

  /* init */
  if (reduce || !isPinned()) {
    renderScrub(1);            /* 一杯が満ちた最終状態 */
    if (steamLines.length) for (var k = 0; k < steamLines.length; k++) { steamLines[k].style.strokeDashoffset = 0; steamLines[k].style.opacity = 0.5; }
    if (steam) steam.style.opacity = 1;
  } else {
    if (steam) steam.style.opacity = 1;
    renderScrub(0);
    window.addEventListener("scroll", onScroll, { passive: true });
    updateP();
  }
  window.addEventListener("resize", function () {
    if (reduce) return;
    if (!isPinned()) { renderScrub(1); stop(); }
    else { start(); updateP(); }
  }, { passive: true });
})();
