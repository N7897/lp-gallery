/* ============================================================
   稜線 RYŌSEN — interactions
   主役: スクロール連動のルート描画 + 高度計カウント (I1×I8)
   支援: 等高線の自己描画リビール / セクションreveal
   全て rAF + passive scroll / IntersectionObserver / reduced-motion対応
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
  var ALT_MIN = 610, ALT_MAX = 2999;

  /* ---------- helpers ---------- */
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ce(ns, name) { return document.createElementNS(ns, name); }
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ============================================================
     1. 等高線（地形図）の生成
     ============================================================ */
  function buildContours() {
    var g = document.getElementById("topoContours");
    var hatch = document.getElementById("topoHatch");
    if (!g) return;
    var cx = 1060, cy = 300;               // 山頂まわり
    var rings = 9;
    for (var i = 0; i < rings; i++) {
      var baseR = 70 + i * 78;
      var pts = 46, d = "";
      for (var p = 0; p <= pts; p++) {
        var a = (p / pts) * Math.PI * 2;
        // 稜線が上に伸びる非対称ノイズ
        var noise = Math.sin(a * 3 + i * 0.7) * 14 + Math.cos(a * 2 - i) * 20;
        var stretch = 1 + Math.sin(a - 1.2) * 0.16;      // 南北にやや伸長
        var r = (baseR + noise) * stretch;
        var x = cx + Math.cos(a) * r * 1.35;
        var y = cy + Math.sin(a) * r;
        d += (p === 0 ? "M" : "L") + x.toFixed(1) + "," + y.toFixed(1);
      }
      d += "Z";
      var path = ce(SVGNS, "path");
      path.setAttribute("d", d);
      g.appendChild(path);
      var len = 0;
      try { len = path.getTotalLength(); } catch (e) { len = 1400; }
      path.style.setProperty("--len", len);
      path.style.setProperty("--d", (0.15 + i * 0.12).toFixed(2) + "s");
    }
    // 斜面のハッチ（急斜面記号）
    if (hatch) {
      for (var h = 0; h < 26; h++) {
        var ang = (h / 26) * Math.PI * 2;
        var rr = 150;
        var x1 = cx + Math.cos(ang) * rr * 1.35;
        var y1 = cy + Math.sin(ang) * rr;
        var x2 = x1 + Math.cos(ang) * 14 * 1.35;
        var y2 = y1 + Math.sin(ang) * 14;
        var ln = ce(SVGNS, "line");
        ln.setAttribute("x1", x1.toFixed(1)); ln.setAttribute("y1", y1.toFixed(1));
        ln.setAttribute("x2", x2.toFixed(1)); ln.setAttribute("y2", y2.toFixed(1));
        hatch.appendChild(ln);
      }
    }
  }

  /* ============================================================
     2. 断面プロファイルのグリッド
     ============================================================ */
  function buildProfileGrid() {
    var g = document.getElementById("profileGrid");
    if (!g) return;
    var labels = ["3000", "2000", "1000", "600"];
    var ys = [70, 210, 370, 470];
    for (var i = 0; i < ys.length; i++) {
      var ln = ce(SVGNS, "line");
      ln.setAttribute("x1", 0); ln.setAttribute("y1", ys[i]);
      ln.setAttribute("x2", 1200); ln.setAttribute("y2", ys[i]);
      g.appendChild(ln);
      var t = ce(SVGNS, "text");
      t.setAttribute("x", 8); t.setAttribute("y", ys[i] - 6);
      t.textContent = labels[i] + "m";
      g.appendChild(t);
    }
  }

  /* ============================================================
     3. reveal（IntersectionObserver）
     ============================================================ */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (reduce || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          var el = en.target;
          var sibs = Array.prototype.slice.call(el.parentNode.querySelectorAll(".reveal"));
          var idx = Math.max(0, sibs.indexOf(el));
          el.style.transitionDelay = Math.min(idx * 80, 320) + "ms";
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ============================================================
     4. 高度計レール & ヘッダー & プロファイルscrub
     ============================================================ */
  var railProg = document.getElementById("railProg");
  var railMarker = document.getElementById("railMarker");
  var altValue = document.getElementById("altValue");
  var header = document.getElementById("siteHeader");
  var railTrack = railMarker ? railMarker.parentNode : null;
  var sections = Array.prototype.slice.call(document.querySelectorAll(".section[data-alt], .hero"));
  var profileStage = document.getElementById("profileStage");
  var profileRoute = document.getElementById("profileRoute");
  var profileHiker = document.getElementById("profileHiker");
  var profLen = 2000, profDrawn = false;

  // レール ウェイポイント生成
  var waypoints = [];
  function buildWaypoints() {
    if (!railTrack) return;
    var secEls = Array.prototype.slice.call(document.querySelectorAll(".section[data-alt]"));
    secEls.forEach(function (s) {
      var dot = document.createElement("span");
      dot.className = "rail__wp";
      railTrack.appendChild(dot);
      waypoints.push({ el: s, dot: dot });
    });
  }

  function scrollRange() {
    return Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
  }

  function setupProfile() {
    if (profileRoute) {
      try { profLen = profileRoute.getTotalLength(); } catch (e) { profLen = 2000; }
      profileRoute.style.setProperty("--plen", profLen);
      if (reduce) { profileRoute.style.strokeDashoffset = 0; if (profileHiker) profileHiker.classList.add("is-active"); }
    }
  }

  function positionWaypoints() {
    if (!railTrack) return;
    var range = scrollRange();
    var trackH = railTrack.clientHeight;
    waypoints.forEach(function (w) {
      var top = w.el.offsetTop - window.innerHeight * 0.5;
      var f = clamp(top / range, 0, 1);
      w.frac = f;
      w.dot.style.top = (f * trackH) + "px";
    });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(update);
  }

  function update() {
    ticking = false;
    var y = window.pageYOffset || document.documentElement.scrollTop;
    var range = scrollRange();
    var prog = clamp(y / range, 0, 1);

    // header
    if (header) header.classList.toggle("is-solid", y > 40);

    // rail progress line
    if (railProg) railProg.style.strokeDashoffset = (600 * (1 - prog)).toFixed(1);
    if (railMarker && railTrack) {
      railMarker.style.top = (prog * railTrack.clientHeight).toFixed(1) + "px";
    }
    // altimeter (整数・カンマ)
    if (altValue) {
      var alt = Math.round(lerp(ALT_MIN, ALT_MAX, prog));
      altValue.textContent = alt.toLocaleString("en-US");
    }
    // waypoints passed
    waypoints.forEach(function (w) {
      if (w.frac != null) w.dot.classList.toggle("is-passed", prog >= w.frac - 0.001);
    });

    // profile scrub
    if (profileStage && profileRoute && !reduce) {
      var rect = profileStage.getBoundingClientRect();
      var vh = window.innerHeight;
      // 0 when stage bottom enters, 1 when stage top passes ~35% viewport
      var p = (vh * 0.85 - rect.top) / (rect.height + vh * 0.45);
      p = clamp(p, 0, 1);
      profileRoute.style.strokeDashoffset = (profLen * (1 - p)).toFixed(1);
      if (profileHiker) {
        profileHiker.classList.toggle("is-active", p > 0.001);
        try {
          var pt = profileRoute.getPointAtLength(profLen * p);
          profileHiker.setAttribute("cx", pt.x);
          profileHiker.setAttribute("cy", pt.y);
        } catch (e) {}
      }
    }
  }

  /* ============================================================
     init
     ============================================================ */
  function init() {
    buildContours();
    buildProfileGrid();
    buildWaypoints();
    setupProfile();
    initReveal();
    positionWaypoints();
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", function () {
      positionWaypoints();
      setupProfile();
      update();
    }, { passive: true });
    // fonts / late layout
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(function () { positionWaypoints(); update(); });
    }
    window.addEventListener("load", function () { positionWaypoints(); update(); });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else { init(); }
})();
