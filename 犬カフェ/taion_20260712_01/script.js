(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var PAW = '<g fill="currentColor"><ellipse cx="50" cy="63" rx="20" ry="16"/><ellipse cx="27" cy="42" rx="9" ry="12" transform="rotate(-18 27 42)"/><ellipse cx="43" cy="30" rx="9" ry="12" transform="rotate(-6 43 30)"/><ellipse cx="61" cy="30" rx="9" ry="12" transform="rotate(6 61 30)"/><ellipse cx="76" cy="42" rx="9" ry="12" transform="rotate(18 76 42)"/></g>';

  function splash() {
    try {
      var s = document.createElement("div");
      s.id = "splash";
      s.setAttribute("role", "dialog");
      s.setAttribute("aria-label", "ようこそ。肉球にタッチするか、3秒でひらきます");
      s.innerHTML =
        '<div class="splash__door" aria-hidden="true"><span></span><span></span></div>' +
        '<div class="splash__inner">' +
        '<p class="splash__brand">taion</p>' +
        '<p class="splash__copy">路地を、一本入る。</p>' +
        '<button class="splash__paw" type="button" aria-label="お店をひらく">' +
        '<svg class="splash__ring" viewBox="0 0 140 140" aria-hidden="true"><circle cx="70" cy="70" r="67"/></svg>' +
        '<svg viewBox="0 0 100 100" aria-hidden="true">' + PAW + "</svg>" +
        "</button>" +
        '<p class="splash__hint">肉球にタッチ、または3秒でひらきます</p>' +
        "</div>";
      document.body.appendChild(s);
      document.body.style.overflow = "hidden";
      var btn = s.querySelector(".splash__paw");
      var opened = false;
      function remove() {
        if (s.parentNode) s.parentNode.removeChild(s);
        document.body.style.overflow = "";
      }
      function open() {
        if (opened) return;
        opened = true;
        s.classList.add("is-opening");
        document.body.style.overflow = "";
        setTimeout(remove, reduced ? 60 : 620);
      }
      btn.addEventListener("click", open);
      requestAnimationFrame(function () {
        btn.focus({ preventScroll: true });
        s.classList.add("splash--counting");
      });
      setTimeout(open, 3000);
      setTimeout(remove, 6000);
    } catch (e) {
      var el = document.getElementById("splash");
      if (el && el.parentNode) el.parentNode.removeChild(el);
      document.body.style.overflow = "";
    }
  }

  function warmth() {
    var wrap = document.getElementById("warmth");
    if (!wrap || reduced) return;
    var img = wrap.querySelector("img");
    var hero = wrap.closest(".hero");
    var cv = document.createElement("canvas");
    cv.setAttribute("aria-hidden", "true");
    wrap.appendChild(cv);
    var ctx = cv.getContext("2d");
    var cool = document.createElement("canvas");
    var coolCtx = cool.getContext("2d");
    var SCALE = 0.5;
    var W = 0, H = 0, raf = 0, running = false;
    var queue = [], last = null, travel = 0;
    var t0 = performance.now(), hasPointer = false;
    var rect = null, topAbs = 0;

    function cover(c, iw, ih) {
      var s = Math.max(c.width / iw, c.height / ih);
      return [ (c.width - iw * s) / 2, (c.height - ih * s) / 2, iw * s, ih * s ];
    }
    function buildCool() {
      cool.width = W; cool.height = H;
      var f = cover(cool, img.naturalWidth, img.naturalHeight);
      coolCtx.filter = "grayscale(.95) brightness(.8) contrast(1.02)";
      coolCtx.drawImage(img, f[0], f[1], f[2], f[3]);
      coolCtx.filter = "none";
      coolCtx.globalCompositeOperation = "source-atop";
      coolCtx.fillStyle = "rgba(64,78,104,.32)";
      coolCtx.fillRect(0, 0, W, H);
      coolCtx.globalCompositeOperation = "source-over";
    }
    function size() {
      rect = wrap.getBoundingClientRect();
      topAbs = rect.top + window.scrollY;
      W = Math.max(2, Math.round(rect.width * SCALE));
      H = Math.max(2, Math.round(rect.height * SCALE));
      cv.width = W; cv.height = H;
      buildCool();
      ctx.drawImage(cool, 0, 0);
      stamp(W * 0.62, H * 0.42, Math.min(W, H) * 0.34, 0.9);
    }
    function stamp(x, y, r, a) {
      ctx.globalCompositeOperation = "destination-out";
      var g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(0,0,0," + a + ")");
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, 7);
      ctx.fill();
      ctx.globalCompositeOperation = "source-over";
    }
    function pawStamp(x, y, ang) {
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.globalCompositeOperation = "destination-out";
      ctx.fillStyle = "rgba(0,0,0,.95)";
      var u = Math.min(W, H) * 0.016;
      ctx.beginPath();
      ctx.ellipse(0, u * 1.2, u * 2, u * 1.6, 0, 0, 7);
      ctx.fill();
      [[-2.3, -1.2, -0.3], [-0.8, -2.2, -0.1], [0.8, -2.2, 0.1], [2.3, -1.2, 0.3]].forEach(function (p) {
        ctx.beginPath();
        ctx.ellipse(p[0] * u, p[1] * u, u * 0.8, u * 1.05, p[2], 0, 7);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    }
    function onMove(e) {
      if (!rect) return;
      var x = (e.clientX - rect.left) * SCALE;
      var y = (e.clientY - (topAbs - window.scrollY)) * SCALE;
      hasPointer = true;
      if (last) {
        var dx = x - last.x, dy = y - last.y;
        var d = Math.hypot(dx, dy);
        var steps = Math.max(1, Math.floor(d / 14));
        for (var i = 1; i <= steps; i++) {
          queue.push({ x: last.x + (dx * i) / steps, y: last.y + (dy * i) / steps, paw: false });
        }
        travel += d;
        if (travel > 110) {
          travel = 0;
          queue.push({ x: x, y: y, paw: true, ang: Math.atan2(dy, dx) + Math.PI / 2 });
        }
      } else {
        queue.push({ x: x, y: y, paw: false });
      }
      last = { x: x, y: y };
    }
    function tick(now) {
      ctx.globalAlpha = 0.022;
      ctx.drawImage(cool, 0, 0);
      ctx.globalAlpha = 1;
      if (!hasPointer) {
        var t = (now - t0) / 1000;
        var ix = W * (0.62 + Math.sin(t * 0.45) * 0.14);
        var iy = H * (0.44 + Math.cos(t * 0.32) * 0.1);
        queue.push({ x: ix, y: iy, paw: false });
      }
      var r = Math.min(W, H) * 0.16;
      for (var i = 0; i < queue.length; i++) {
        var p = queue[i];
        if (p.paw) pawStamp(p.x, p.y, p.ang);
        else stamp(p.x, p.y, r, 0.5);
      }
      queue.length = 0;
      raf = requestAnimationFrame(tick);
    }
    function start() { if (!running) { running = true; raf = requestAnimationFrame(tick); } }
    function stop() { running = false; cancelAnimationFrame(raf); }

    function init() {
      size();
      var io = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) start(); else stop();
      });
      io.observe(wrap);
      hero.addEventListener("pointermove", onMove, { passive: true });
      hero.addEventListener("pointerleave", function () { last = null; }, { passive: true });
      var rt;
      addEventListener("resize", function () {
        clearTimeout(rt);
        rt = setTimeout(size, 180);
      }, { passive: true });
    }
    function whenReady() {
      if (img.complete && img.naturalWidth) init();
      else img.addEventListener("load", init, { once: true });
    }
    if (document.readyState === "complete") setTimeout(whenReady, 1300);
    else addEventListener("load", function () { setTimeout(whenReady, 1300); }, { once: true });
  }

  function reveals() {
    var sel = ".sec-title,.sec-lead,.exp-card,.dog-card,.price-card,.price-note," +
      ".flow-list li,.rules-list li,.faq-list div,.menu-list li," +
      ".story__cold,.story__arrow,.story__warmth,.access__map,.access__info,.cta__inner";
    document.querySelectorAll(sel).forEach(function (el) {
      el.setAttribute("data-reveal", "");
    });
    document.querySelectorAll(".exp-card,.dog-card,.price-card,.flow-list li,.rules-list li,.menu-list li").forEach(function (el) {
      var i = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.setProperty("--i", String(i));
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll("main > section, .site-foot").forEach(function (s) {
      io.observe(s);
    });
  }

  function counters() {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;
    function run(el) {
      var to = parseFloat(el.getAttribute("data-to"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var t0 = performance.now(), dur = 1800;
      if (reduced) { el.firstChild.nodeValue = to.toFixed(dec); return; }
      function step(now) {
        var t = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - t, 3);
        el.firstChild.nodeValue = (to * e).toFixed(dec);
        if (t < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          run(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  function stickyHead() {
    var head = document.querySelector(".site-head");
    var hero = document.querySelector(".hero");
    if (!head || !hero) return;
    var io = new IntersectionObserver(function (es) {
      head.classList.toggle("at-top", es[0].intersectionRatio >= 0.88);
    }, { threshold: [0.85, 0.92] });
    io.observe(hero);
  }

  function boot() {
    splash();
    warmth();
    reveals();
    counters();
    stickyHead();
    var hero = document.querySelector(".hero");
    if (hero) hero.classList.add("in");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
