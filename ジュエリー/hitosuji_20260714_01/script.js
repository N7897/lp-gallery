(function () {
  "use strict";
  var root = document.documentElement;
  root.classList.add("js");

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var main = document.getElementById("main");
  var svg = document.querySelector(".thread-svg");
  var line = document.querySelector(".thread-line");
  var pen = document.querySelector(".thread-pen");

  function easeInOut(k) {
    return k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  var W = 0, H = 0, total = 1, heroFrac = 0.16, cur = 0, running = false;
  var introDone = false, introStart = null;

  function ellipse(cx, cy, rx, ry) {
    var k = 0.5523;
    return "M " + cx + " " + (cy + ry) +
      " C " + (cx + rx * k) + " " + (cy + ry) + " " + (cx + rx) + " " + (cy + ry * k) + " " + (cx + rx) + " " + cy +
      " C " + (cx + rx) + " " + (cy - ry * k) + " " + (cx + rx * k) + " " + (cy - ry) + " " + cx + " " + (cy - ry) +
      " C " + (cx - rx * k) + " " + (cy - ry) + " " + (cx - rx) + " " + (cy - ry * k) + " " + (cx - rx) + " " + cy +
      " C " + (cx - rx) + " " + (cy + ry * k) + " " + (cx - rx * k) + " " + (cy + ry) + " " + cx + " " + (cy + ry) + " ";
  }

  function smooth(a, b) {
    var my1 = a.y + (b.y - a.y) * 0.5;
    var my2 = b.y - (b.y - a.y) * 0.5;
    return "C " + a.x + " " + my1 + " " + b.x + " " + my2 + " " + b.x + " " + b.y + " ";
  }

  function sec(id) { return document.getElementById(id); }
  function bandY(el, f) { return el ? el.offsetTop + el.offsetHeight * f : 0; }

  function build() {
    W = main.clientWidth;
    H = main.scrollHeight;
    svg.setAttribute("viewBox", "0 0 " + W + " " + H);

    var L = W * 0.17, R = W * 0.83, Cx = W * 0.5;
    var r = Math.max(46, Math.min(96, W * 0.062));

    var hero = sec("top"), concept = sec("concept"), kan = sec("kan"),
        material = sec("material"), shizuku = sec("shizuku"), forge = sec("forge"),
        maker = sec("maker"), nai = sec("nai"), choose = sec("choose"),
        voices = sec("voices"), care = sec("care"), process = sec("process"),
        cta = sec("reserve");

    var heroC = bandY(hero, 0.52);
    var d = "M " + (-W * 0.06) + " " + heroC + " ";

    d += smooth({ x: -W * 0.06, y: heroC }, { x: Cx, y: heroC + r });
    d += ellipse(Cx, heroC, r, r);
    var heroExitY = heroC + r;

    var pts = [
      { x: L, y: bandY(concept, 0.5) },
      { x: R, y: bandY(kan, 0.42) },
      { x: L, y: bandY(material, 0.5) }
    ];
    var prev = { x: Cx, y: heroExitY };
    for (var i = 0; i < pts.length; i++) { d += smooth(prev, pts[i]); prev = pts[i]; }

    var earC = { x: R, y: bandY(shizuku, 0.44) };
    d += smooth(prev, { x: earC.x, y: earC.y + r * 1.15 });
    d += ellipse(earC.x, earC.y, r * 0.6, r * 1.15);
    prev = { x: earC.x, y: earC.y + r * 1.15 };

    var mid = [
      { x: Cx, y: bandY(forge, 0.5) },
      { x: L, y: bandY(maker, 0.5) }
    ];
    for (i = 0; i < mid.length; i++) { d += smooth(prev, mid[i]); prev = mid[i]; }

    var braC = { x: Cx, y: bandY(nai, 0.4) };
    d += smooth(prev, { x: braC.x, y: braC.y + r * 0.78 });
    d += ellipse(braC.x, braC.y, r * 1.28, r * 0.78);
    prev = { x: braC.x, y: braC.y + r * 0.78 };

    var low = [
      { x: R, y: bandY(choose, 0.5) },
      { x: L, y: bandY(voices, 0.5) },
      { x: Cx, y: bandY(care, 0.5) },
      { x: R, y: bandY(process, 0.5) }
    ];
    for (i = 0; i < low.length; i++) { d += smooth(prev, low[i]); prev = low[i]; }

    var knotC = { x: Cx, y: bandY(cta, 0.34) };
    d += smooth(prev, { x: knotC.x, y: knotC.y + r * 0.5 });
    d += ellipse(knotC.x, knotC.y, r * 0.5, r * 0.5);
    prev = { x: knotC.x, y: knotC.y + r * 0.5 };
    d += smooth(prev, { x: Cx, y: H - 8 });

    line.setAttribute("d", d);
    total = line.getTotalLength();

    var exitL = 0, steps = 240;
    for (i = 1; i <= steps; i++) {
      var p = line.getPointAtLength((i / steps) * total);
      if (p.y > heroExitY + 6) { exitL = (i / steps) * total; break; }
    }
    heroFrac = exitL > 0 ? clamp01(exitL / total) : 0.16;
  }

  function place(v) {
    var L = clamp01(v) * total;
    var pt = line.getPointAtLength(L);
    line.style.strokeDashoffset = String(1 - clamp01(v));
    pen.setAttribute("cx", pt.x);
    pen.setAttribute("cy", pt.y);
  }

  function scrollTarget() {
    var y = window.pageYOffset || root.scrollTop;
    return clamp01((y + window.innerHeight * 0.82) / H);
  }

  function loop() {
    if (!introDone) return;
    var target = Math.max(heroFrac, scrollTarget());
    cur += (target - cur) * 0.12;
    if (Math.abs(target - cur) < 0.0003) { cur = target; running = false; }
    place(cur);
    if (running) requestAnimationFrame(loop);
  }
  function kick() {
    if (!running && introDone) { running = true; requestAnimationFrame(loop); }
  }

  function intro(t) {
    if (introStart === null) introStart = t;
    var k = clamp01((t - introStart) / 2400);
    cur = easeInOut(k) * heroFrac;
    place(cur);
    pen.style.opacity = String(0.9 * Math.min(1, k * 1.4));
    if (k < 1) { requestAnimationFrame(intro); return; }
    introDone = true;
    pen.style.transition = "opacity .9s ease";
    pen.style.opacity = "0";
    kick();
  }

  function knotDraw(el, glow) {
    if (reduced) { el.style.strokeDashoffset = "0"; if (glow) glow.style.opacity = "0"; return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        el.style.transition = "stroke-dashoffset 2s cubic-bezier(.42,0,.32,1)";
        el.style.strokeDashoffset = "0";
        if (glow) { glow.style.transition = "opacity 1s ease 1.8s"; glow.style.opacity = "0.9"; }
        io.disconnect();
      });
    }, { threshold: 0.5 });
    io.observe(el);
  }

  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    targets.forEach(function (el) {
      var kids = el.querySelectorAll("[data-reveal-child]");
      kids.forEach(function (k, i) { k.style.setProperty("--d", (i * 0.09).toFixed(2) + "s"); });
    });
    if (reduced) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.22 });
    targets.forEach(function (el) { io.observe(el); });
  }

  var ready = false;
  function start() {
    if (ready) return; ready = true;
    build();
    initReveal();
    var ctaKnot = document.querySelector(".cta__knot-line");
    var footKnot = document.querySelector(".foot__knot");
    var footGlow = document.querySelector(".foot__glow");
    if (ctaKnot) knotDraw(ctaKnot, null);
    if (footKnot) knotDraw(footKnot, footGlow);

    if (reduced) {
      line.style.strokeDashoffset = "0";
      pen.style.opacity = "0";
      introDone = true;
      return;
    }
    place(0);
    requestAnimationFrame(intro);

    window.addEventListener("scroll", kick, { passive: true });
    var rt;
    window.addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () {
        var keep = cur;
        build();
        cur = keep;
        place(cur);
        kick();
      }, 200);
    }, { passive: true });
  }

  if (document.readyState === "complete") start();
  else window.addEventListener("load", start);
  document.addEventListener("DOMContentLoaded", function () {
    if (!ready && document.readyState !== "loading") { /* wait for load for accurate geometry */ }
  });
})();
