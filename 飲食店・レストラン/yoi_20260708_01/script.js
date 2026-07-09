/* ============================================================
   宵 YOI — night engine
   署名: スクロールで夜が更け、月が満ちる／料理が器に盛られる
   外部ライブラリ非依存・rAF/IntersectionObserver・60fps
   ============================================================ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };

  /* ---------- NAV ---------- */
  var nav = document.getElementById("nav");
  var toggle = document.getElementById("navToggle");
  var sheet = document.getElementById("navSheet");

  function onScrollNav() { nav.classList.toggle("is-stuck", window.scrollY > 40); }
  onScrollNav();

  function closeSheet() {
    toggle.setAttribute("aria-expanded", "false");
    toggle.setAttribute("aria-label", "メニューを開く");
    sheet.hidden = true;
    document.body.style.overflow = "";
  }
  toggle.addEventListener("click", function () {
    var open = toggle.getAttribute("aria-expanded") === "true";
    if (open) { closeSheet(); }
    else {
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "メニューを閉じる");
      sheet.hidden = false;
      document.body.style.overflow = "hidden";
    }
  });
  Array.prototype.forEach.call(sheet.querySelectorAll("a"), function (a) {
    a.addEventListener("click", closeSheet);
  });

  /* ---------- REVEAL ---------- */
  var revs = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("is-in"); ro.unobserve(e.target); } });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    revs.forEach(function (el) { ro.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- PLATE MOTIFS (SVG) ---------- */
  function svg(inner) {
    return '<svg viewBox="0 0 400 328" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' +
      '<defs><radialGradient id="glow" cx="50%" cy="42%" r="60%">' +
      '<stop offset="0%" stop-color="#1c2c4e"/><stop offset="100%" stop-color="#0c1424"/></radialGradient></defs>' +
      '<g class="plated">' + inner + '</g></svg>';
  }
  function plateMotif(c) { // composed dish
    return svg(
      '<ellipse cx="200" cy="180" rx="118" ry="86" fill="url(#glow)"/>' +
      '<ellipse cx="182" cy="150" rx="46" ry="20" fill="' + c + '" opacity=".92" transform="rotate(-18 182 150)"/>' +
      '<ellipse cx="232" cy="176" rx="34" ry="15" fill="' + c + '" opacity=".62" transform="rotate(12 232 176)"/>' +
      '<path d="M120 200 Q200 236 288 196" fill="none" stroke="' + c + '" stroke-width="2.4" opacity=".4" stroke-linecap="round"/>' +
      '<circle cx="156" cy="188" r="4.5" fill="#ECE4D4" opacity=".8"/>' +
      '<circle cx="250" cy="150" r="3.5" fill="' + c + '"/>' +
      '<circle cx="214" cy="204" r="3" fill="#ECE4D4" opacity=".55"/>' +
      '<path d="M170 128 q10 -18 26 -10" fill="none" stroke="#CBD8EE" stroke-width="1.6" opacity=".5" stroke-linecap="round"/>' +
      '<path d="M120 132 A120 120 0 0 1 176 112" fill="none" stroke="#CBD8EE" stroke-width="1.4" opacity=".28"/>'
    );
  }
  function brothMotif(c) { // soup / 椀
    return svg(
      '<ellipse cx="200" cy="176" rx="112" ry="82" fill="url(#glow)"/>' +
      '<ellipse cx="200" cy="176" rx="86" ry="60" fill="none" stroke="' + c + '" stroke-width="2.2" opacity=".5"/>' +
      '<ellipse cx="200" cy="176" rx="58" ry="40" fill="none" stroke="' + c + '" stroke-width="1.8" opacity=".38"/>' +
      '<ellipse cx="200" cy="176" rx="30" ry="21" fill="' + c + '" opacity=".8"/>' +
      '<circle cx="176" cy="164" r="4" fill="#ECE4D4" opacity=".8"/>' +
      '<circle cx="228" cy="186" r="3.4" fill="#ECE4D4" opacity=".6"/>' +
      '<path d="M188 120 q-10 -22 6 -40" fill="none" stroke="#CBD8EE" stroke-width="1.6" opacity=".4" stroke-linecap="round"/>' +
      '<path d="M214 120 q10 -20 -4 -42" fill="none" stroke="#CBD8EE" stroke-width="1.6" opacity=".3" stroke-linecap="round"/>'
    );
  }
  function sweetMotif(c) { // 甘味
    return svg(
      '<ellipse cx="200" cy="196" rx="108" ry="70" fill="url(#glow)"/>' +
      '<path d="M156 196 q44 -64 88 0 Z" fill="' + c + '" opacity=".9"/>' +
      '<ellipse cx="200" cy="196" rx="66" ry="10" fill="' + c + '" opacity=".4"/>' +
      '<path d="M206 150 q16 -14 30 -6 q-10 12 -30 6 Z" fill="#7FA06B" opacity=".8"/>' +
      '<circle cx="168" cy="176" r="2.4" fill="#ECE4D4" opacity=".7"/>' +
      '<circle cx="232" cy="170" r="2.4" fill="#ECE4D4" opacity=".7"/>' +
      '<circle cx="200" cy="150" r="2.8" fill="#ECE4D4" opacity=".8"/>' +
      '<path d="M120 214 h160" stroke="#CBD8EE" stroke-width="1.2" opacity=".22"/>'
    );
  }
  var motifs = { plate: plateMotif, broth: brothMotif, sweet: sweetMotif };
  Array.prototype.forEach.call(document.querySelectorAll(".dish__plate"), function (box) {
    var li = box.closest(".dish");
    var accent = getComputedStyle(li || box).getPropertyValue("--dish").trim() || "#CBD8EE";
    var key = box.getAttribute("data-motif") || "plate";
    var fn = motifs[key] || plateMotif;
    box.insertAdjacentHTML("beforeend", fn(accent));
  });

  /* ---------- CONSTELLATION ---------- */
  var YS = [18, 60, 102, 144, 186, 228, 270];
  var dotsG = document.getElementById("constelDots");
  var line = document.getElementById("constelLine");
  var progPath = null, progLen = 0;
  if (dotsG && line) {
    progPath = line.cloneNode();
    progPath.setAttribute("class", "constel__prog");
    line.parentNode.appendChild(progPath);
    try { progLen = progPath.getTotalLength(); } catch (e) { progLen = 252; }
    progPath.style.strokeDasharray = progLen;
    progPath.style.strokeDashoffset = progLen;
    YS.forEach(function (y, i) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", 20); c.setAttribute("cy", y); c.setAttribute("r", 4.2);
      c.setAttribute("class", "cdot"); c.setAttribute("data-i", i + 1);
      dotsG.appendChild(c);
    });
    dotsG.appendChild(progPath); // keep line above? actually place prog above base line
    line.parentNode.insertBefore(progPath, dotsG);
  }
  var cdots = document.querySelectorAll(".cdot");

  /* ---------- COURSE aside state ---------- */
  var elNum = document.getElementById("courseNum");
  var elName = document.getElementById("courseName");
  var elYomi = document.getElementById("courseYomi");
  var elIdx = document.getElementById("courseIdx");
  var current = null;

  function setCourse(li) {
    if (current === li) return;
    current = li;
    var d = li.dataset;
    if (elName) {
      elName.style.opacity = 0;
      setTimeout(function () {
        elNum.textContent = d.num; elName.textContent = d.name;
        elYomi.textContent = d.yomi; elIdx.textContent = d.i;
        elName.style.opacity = 1;
      }, reduce ? 0 : 180);
    }
    var idx = parseInt(d.i, 10);
    cdots.forEach(function (dot) {
      dot.classList.toggle("lit", parseInt(dot.getAttribute("data-i"), 10) <= idx);
    });
    if (progPath) progPath.style.strokeDashoffset = progLen * (1 - idx / 7);
  }

  var dishes = document.querySelectorAll(".dish");
  if ("IntersectionObserver" in window) {
    var co = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) setCourse(e.target); });
    }, { threshold: 0.01, rootMargin: "-45% 0px -45% 0px" });
    dishes.forEach(function (d) { co.observe(d); });
  }

  /* ---------- NIGHT GAUGE (moon waxing) ---------- */
  var gauge = document.getElementById("nightgauge");
  var moonShadow = document.querySelector(".nm-shadow");
  var moonSvg = document.querySelector(".nightgauge__moon");
  var ngTime = document.getElementById("ngTime");
  var ngPct = document.getElementById("ngPct");
  var CX = 32, CY = 32, R = 22;

  function moonPath(p) {
    // p:0 new -> 1 full, waxing (light grows from right)
    var rx = Math.abs(R * Math.cos(Math.PI * p));
    var sweep = p < 0.5 ? 1 : 0;
    return "M " + CX + " " + (CY - R) +
      " A " + R + " " + R + " 0 0 0 " + CX + " " + (CY + R) +
      " A " + rx.toFixed(2) + " " + R + " 0 0 " + sweep + " " + CX + " " + (CY - R) + " Z";
  }

  var lastP = -1, ticking = false, provTop = 1e9;
  var provEl = document.getElementById("provenance");
  function measure() { if (provEl) provTop = provEl.offsetTop; }
  measure();
  function render() {
    ticking = false;
    var doc = document.documentElement;
    var max = (doc.scrollHeight - window.innerHeight) || 1;
    var p = clamp(window.scrollY / max, 0, 1);
    var moonP = clamp(0.05 + p * 0.95, 0, 1);
    if (Math.abs(moonP - lastP) > 0.004) {
      lastP = moonP;
      if (moonShadow) moonShadow.setAttribute("d", moonPath(moonP));
      if (moonSvg) moonSvg.style.setProperty("--lum", moonP.toFixed(3));
    }
    gauge.classList.toggle("is-on", window.scrollY > window.innerHeight * 0.55);
    // label: prefer current course, else page buckets
    var label, time;
    if (current && window.scrollY < provTop - 200) {
      label = current.dataset.phase; time = current.dataset.time;
    } else if (p > 0.82) { label = "満月"; time = "22:00"; }
    else if (p < 0.14) { label = "宵の口"; time = "18:00"; }
    else { label = "夜半"; time = "20:00"; }
    if (ngTime && ngTime.textContent !== label) ngTime.textContent = label;
    if (ngPct && ngPct.textContent !== time) ngPct.textContent = time;
  }
  function onScroll() {
    onScrollNav();
    if (!ticking) { ticking = true; requestAnimationFrame(render); }
  }
  if (moonShadow) moonShadow.setAttribute("d", moonPath(reduce ? 1 : 0.05));
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", function () { lastP = -1; measure(); render(); }, { passive: true });
  render();

  /* ---------- STARS (ambient, hero only) ---------- */
  var canvas = document.getElementById("stars");
  if (canvas && !reduce) {
    var ctx = canvas.getContext("2d");
    var hero = document.getElementById("hero");
    var stars = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), raf, visible = true;
    function build() {
      W = hero.offsetWidth; H = hero.offsetHeight;
      canvas.width = W * dpr; canvas.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = Math.min(90, Math.round(W * H / 16000));
      stars = [];
      for (var i = 0; i < n; i++) {
        stars.push({ x: Math.random() * W, y: Math.random() * H * 0.9,
          r: Math.random() * 1.3 + 0.3, a: Math.random() * Math.PI * 2,
          s: Math.random() * 0.9 + 0.25, hue: Math.random() < 0.2 });
      }
    }
    function draw(t) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var st = stars[i];
        var tw = 0.45 + 0.55 * (0.5 + 0.5 * Math.sin(t * 0.001 * st.s + st.a));
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, 6.2832);
        ctx.fillStyle = (st.hue ? "rgba(203,216,238," : "rgba(246,242,233,") + (tw * 0.9).toFixed(2) + ")";
        ctx.fill();
      }
      if (visible) raf = requestAnimationFrame(draw);
    }
    build();
    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", build, { passive: true });
    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (es) {
        visible = es[0].isIntersecting;
        if (visible && !raf) raf = requestAnimationFrame(draw);
        if (!visible) { cancelAnimationFrame(raf); raf = null; }
      }, { threshold: 0 }).observe(hero);
    }
  }
})();
