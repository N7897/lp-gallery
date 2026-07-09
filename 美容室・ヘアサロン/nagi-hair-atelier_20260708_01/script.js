/* nagi ── hair atelier : 主役=流れる髪カーテン / 支援=curtain reveal + stagger */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- nav sticky ---- */
  var nav = document.getElementById("nav");
  var onScroll = function () {
    if (window.scrollY > 24) nav.classList.add("stuck");
    else nav.classList.remove("stuck");
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ---- mobile drawer ---- */
  var toggle = document.getElementById("navToggle");
  var drawer = document.getElementById("drawer");
  var open = false;
  function setDrawer(state) {
    open = state;
    toggle.setAttribute("aria-expanded", state ? "true" : "false");
    toggle.setAttribute("aria-label", state ? "メニューを閉じる" : "メニューを開く");
    if (state) { drawer.hidden = false; requestAnimationFrame(function(){ drawer.classList.add("open"); }); }
    else { drawer.classList.remove("open"); setTimeout(function(){ if(!open) drawer.hidden = true; }, 600); }
    document.body.style.overflow = state ? "hidden" : "";
  }
  toggle.addEventListener("click", function () { setDrawer(!open); });
  drawer.querySelectorAll("a").forEach(function (a) {
    a.addEventListener("click", function () { setDrawer(false); });
  });
  window.addEventListener("keydown", function (e) { if (e.key === "Escape" && open) setDrawer(false); });

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal, .reveal-curtain");
  if (reduce || !("IntersectionObserver" in window)) {
    reveals.forEach(function (el) { el.classList.add("in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  }

  /* ---- HERO : flowing hair curtain ---- */
  var canvas = document.getElementById("hairCanvas");
  if (!canvas) return;
  var ctx = canvas.getContext("2d");
  var hero = document.querySelector(".hero");
  var W = 0, H = 0, dpr = 1, strands = [], spacing = 14;
  var pointer = { x: -9999, y: 0, tx: -9999, active: false };

  function build() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    var r = hero.getBoundingClientRect();
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    spacing = W < 640 ? 16 : 13;
    strands = [];
    var n = Math.ceil(W / spacing) + 2;
    for (var i = 0; i < n; i++) {
      strands.push({
        x: i * spacing,
        amp: 8 + Math.random() * 16,          // sway amplitude toward tips
        phase: Math.random() * Math.PI * 2,
        speed: 0.5 + Math.random() * 0.5,
        len: 0.72 + Math.random() * 0.28,      // fraction of height
        hue: Math.random(),                    // warm tone mix
        part: 0                                 // current parting offset (lerped)
      });
    }
  }

  function warm(t, a) {
    // interpolate between deep and light warm browns
    var r = Math.round(112 + t * 96);   // 112..208
    var g = Math.round(84 + t * 72);    // 84..156
    var b = Math.round(60 + t * 54);    // 60..114
    return "rgba(" + r + "," + g + "," + b + "," + a + ")";
  }

  var t0 = performance.now();
  function draw(now) {
    var time = (now - t0) / 1000;
    ctx.clearRect(0, 0, W, H);
    // smooth pointer
    pointer.x += (pointer.tx - pointer.x) * 0.12;
    var seg = 16;
    for (var i = 0; i < strands.length; i++) {
      var s = strands[i];
      // parting target: strands near pointer x get pushed away
      var target = 0;
      if (pointer.active) {
        var d = s.x - pointer.x;
        var ad = Math.abs(d);
        var R = 150;
        if (ad < R) {
          var f = 1 - ad / R;
          target = (d >= 0 ? 1 : -1) * f * f * 46;
        }
      }
      s.part += (target - s.part) * 0.09;

      var maxY = H * s.len;
      ctx.beginPath();
      for (var k = 0; k <= seg; k++) {
        var p = k / seg;
        var y = p * maxY;
        // sway grows toward the tip; gentle wind
        var sway = Math.sin(time * s.speed + s.phase + p * 2.4) * s.amp * p;
        var x = s.x + sway + s.part * (0.25 + p * 0.9);
        if (k === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      var a = 0.05 + s.hue * 0.09;
      ctx.strokeStyle = warm(s.hue, a);
      ctx.lineWidth = 0.8 + s.hue * 1.1;
      ctx.stroke();
    }
    if (!reduce) raf = requestAnimationFrame(draw);
  }

  var raf;
  function start() {
    build();
    if (reduce) { draw(performance.now()); }
    else { cancelAnimationFrame(raf); raf = requestAnimationFrame(draw); }
  }

  hero.addEventListener("pointermove", function (e) {
    var r = hero.getBoundingClientRect();
    pointer.tx = e.clientX - r.left;
    pointer.y = e.clientY - r.top;
    pointer.active = true;
    if (pointer.x < -1000) pointer.x = pointer.tx;
  });
  hero.addEventListener("pointerleave", function () { pointer.active = false; });

  var rz;
  window.addEventListener("resize", function () {
    clearTimeout(rz);
    rz = setTimeout(start, 180);
  });

  start();
})();
