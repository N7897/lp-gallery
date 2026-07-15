(function () {
  "use strict";
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- reveal on enter ---------- */
  var reveals = [].slice.call(document.querySelectorAll(".reveal"));
  function revealAll() { reveals.forEach(function (e) { e.classList.add("in"); }); }
  if (reduce || !("IntersectionObserver" in window)) {
    revealAll();
  } else {
    var ro = new IntersectionObserver(function (es) {
      es.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); ro.unobserve(en.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (e) { ro.observe(e); });
  }

  /* ---------- header stuck ---------- */
  var head = document.getElementById("head");
  var lastStuck = null;
  function onScrollHead() {
    var s = window.pageYOffset > 40;
    if (s !== lastStuck) { head.classList.toggle("stuck", s); lastStuck = s; }
  }
  onScrollHead();
  window.addEventListener("scroll", onScrollHead, { passive: true });

  /* ---------- mobile nav ---------- */
  var tg = document.getElementById("navToggle"), nav = document.getElementById("nav");
  if (tg) {
    tg.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      tg.classList.toggle("open", open);
      tg.setAttribute("aria-expanded", open ? "true" : "false");
      tg.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    nav.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        nav.classList.remove("open"); tg.classList.remove("open");
        tg.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- signature: driven damped pendulum ----------
     translation of the oscillate engine: instead of a fixed sin phase,
     angular state is integrated from a restoring spring + damping, and
     driven by input energy (scroll velocity, pointer sweep, ambient breath).
     the gem's specular glint drifts with the swing angle & speed. */
  var swing = document.getElementById("swing");
  var glint = document.getElementById("glint");
  var stage = document.getElementById("heroStage");
  var mechSwing = document.getElementById("mechSwing");
  var PIVOT = { x: 150, y: 90 };
  var MPIVOT = { x: 190, y: 46 };

  if (swing && reduce) {
    swing.setAttribute("transform", "rotate(-5 " + PIVOT.x + " " + PIVOT.y + ")");
    if (mechSwing) mechSwing.setAttribute("transform", "rotate(6 " + MPIVOT.x + " " + MPIVOT.y + ")");
  }

  if (swing && !reduce) {
    var angle = 7, vel = 0;               // degrees
    var K = 0.010, C = 0.045;             // spring / damping (slow, graceful)
    var t0 = performance.now(), running = true, raf = 0;
    var lastScroll = window.pageYOffset, lastT = t0;

    function impulse(v) { vel += v; if (vel > 3.2) vel = 3.2; if (vel < -3.2) vel = -3.2; }

    // scroll energy
    window.addEventListener("scroll", function () {
      var y = window.pageYOffset, dv = (y - lastScroll);
      lastScroll = y;
      impulse(dv * 0.012);
    }, { passive: true });

    // pointer sweep over the stage
    var lastPX = null;
    if (stage) {
      stage.addEventListener("pointermove", function (e) {
        if (lastPX !== null) impulse((e.clientX - lastPX) * 0.010);
        lastPX = e.clientX;
      });
      stage.addEventListener("pointerleave", function () { lastPX = null; });
    }

    // device tilt (mobile)
    window.addEventListener("deviceorientation", function (e) {
      if (e.gamma != null) { var target = Math.max(-10, Math.min(10, e.gamma * 0.4)); impulse((target - angle) * 0.003); }
    });

    function tick(now) {
      var dt = Math.min(2.4, (now - lastT) / 16.667); lastT = now;
      var breath = Math.sin(now * 0.0011) * 0.05;          // ambient life
      // READ phase (none from layout) then WRITE
      var acc = (-K * angle - C * vel) + breath;
      vel += acc * dt;
      angle += vel * dt;
      if (angle > 14) { angle = 14; vel *= -0.4; }
      if (angle < -14) { angle = -14; vel *= -0.4; }
      swing.setAttribute("transform", "rotate(" + angle.toFixed(3) + " " + PIVOT.x + " " + PIVOT.y + ")");
      if (glint) {
        var gx = 138 - angle * 0.9;
        glint.setAttribute("cx", gx.toFixed(2));
        glint.style.opacity = (0.55 + Math.min(0.4, Math.abs(vel) * 0.5)).toFixed(3);
      }
      if (mechSwing) mechSwing.setAttribute("transform", "rotate(" + (angle * 0.8).toFixed(3) + " " + MPIVOT.x + " " + MPIVOT.y + ")");
      if (running) raf = requestAnimationFrame(tick);
    }
    var hio = new IntersectionObserver(function (es) {
      running = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (running) { lastT = performance.now(); raf = requestAnimationFrame(tick); }
    });
    if (stage) hio.observe(stage);
    raf = requestAnimationFrame(tick);
  }

  /* ---------- supporting: collection cards gentle sway ---------- */
  var sways = [].slice.call(document.querySelectorAll(".sway"));
  if (sways.length && !reduce) {
    sways.forEach(function (el, i) {
      el.style.transformOrigin = "50% 10%";
      el.dataset.phase = (i * 1.3).toString();
    });
    var srun = false, sraf = 0;
    function stick(now) {
      for (var i = 0; i < sways.length; i++) {
        var el = sways[i];
        var amp = parseFloat(el.getAttribute("data-amp")) || 5;
        var ph = parseFloat(el.dataset.phase);
        el.style.transform = "rotate(" + (Math.sin(now * 0.0013 + ph) * amp * 0.28).toFixed(3) + "deg)";
      }
      if (srun) sraf = requestAnimationFrame(stick);
    }
    var sio = new IntersectionObserver(function (es) {
      var any = es.some(function (e) { return e.isIntersecting; });
      // keep running if any card visible
      var vis = sways.some(function (el) { return el.getBoundingClientRect().bottom > 0 && el.getBoundingClientRect().top < innerHeight; });
      srun = any || vis;
      cancelAnimationFrame(sraf);
      if (srun) sraf = requestAnimationFrame(stick);
    }, { threshold: 0 });
    sways.forEach(function (el) { sio.observe(el); });
  }
})();
