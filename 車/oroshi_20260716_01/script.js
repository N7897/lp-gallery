(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ── 風のエネルギー: スクロールの勢い＋車体へ手をかざす近接 → 風速(0..1)
     velocity.jsのエンジンを風洞へ翻訳。energy=風速、impulse=突風 ── */
  function createWind(nearEl) {
    var floor = 0.075, decay = 0.968;
    var energy = floor, velocity = 0, prox = 0;
    var lastY = window.scrollY, prevY = window.scrollY;
    if (reduced) {
      return { get: function () { return { energy: floor, velocity: 0 }; }, tick: function () {} };
    }
    addEventListener("scroll", function () {
      var dy = Math.abs(window.scrollY - lastY);
      lastY = window.scrollY;
      energy = Math.min(1, energy + dy / 760);
    }, { passive: true });
    addEventListener("pointermove", function (e) {
      if (!nearEl) return;
      var r = nearEl.getBoundingClientRect();
      var dx = e.clientX - (r.left + r.width / 2);
      var dy = e.clientY - (r.top + r.height / 2);
      var d = Math.hypot(dx, dy), R = Math.max(260, r.width * 0.55);
      prox = d < R ? Math.pow(1 - d / R, 2) : 0;
    }, { passive: true });
    return {
      tick: function () {
        var vRaw = window.scrollY - prevY;
        prevY = window.scrollY;
        velocity += (vRaw - velocity) * 0.16;
        energy = Math.max(floor, Math.min(1, (energy + prox * 0.035) * decay));
      },
      get: function () { return { energy: energy, velocity: velocity }; }
    };
  }

  /* ── 風洞キャンバス: 楕円障害物まわりのポテンシャル流で気流ラインを描く ── */
  function initTunnel() {
    var stage = document.querySelector(".stage");
    var canvas = document.querySelector(".wind");
    var tunnel = document.querySelector(".tunnel");
    var carwrap = document.querySelector(".carwrap");
    var carSvg = document.querySelector(".car");
    var rims = document.querySelectorAll(".rim");
    var hudNum = document.querySelector("[data-wind-speed]");
    var hudBar = document.querySelector("[data-wind-bar]");
    var hudDf = document.querySelector("[data-wind-df]");
    var panels = document.querySelectorAll(".ch-panel");
    var dots = document.querySelectorAll(".rail-dot");
    if (!stage || !canvas || !carwrap) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(devicePixelRatio || 1, 1.5);
    var W = 0, H = 0, obs = { cx: 0, cy: 0, a: 260, b: 74, s: 3.2 };
    var parts = [], TAIL = 12;
    var wheelAngle = 0, curCh = 0, frame = 0;
    var wind = createWind(carwrap);

    function resize() {
      W = stage.clientWidth;
      H = stage.clientHeight;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      measure();
      seed();
    }

    function measure() {
      var r = carwrap.getBoundingClientRect();
      var s = stage.getBoundingClientRect();
      obs.cx = r.left - s.left + r.width * 0.5;
      obs.cy = r.top - s.top + r.height * 0.60;
      obs.a = r.width * 0.46;
      obs.b = r.height * 0.34;
      obs.s = obs.a / obs.b;
    }

    function seed() {
      var n = W < 800 ? 58 : 108;
      parts = [];
      for (var i = 0; i < n; i++) {
        parts.push(newPart(Math.random() * W, true));
      }
      var warm = { u: 0, v: 0 };
      for (var s = 0; s < TAIL + 2; s++) {
        for (var j = 0; j < parts.length; j++) {
          var p = parts[j];
          field(p.x, p.y, 2.4, warm);
          p.x += warm.u;
          p.y += warm.v;
          p.hx.push(p.x); p.hy.push(p.y);
          if (p.hx.length > TAIL) { p.hx.shift(); p.hy.shift(); }
        }
      }
    }

    function newPart(x, randomX) {
      var y;
      do { y = Math.random() * H; } while (Math.abs(y - obs.cy) < obs.b * 0.5 && Math.random() < 0.7);
      var p = { x: randomX ? x : -20 - Math.random() * 60, y: y, seedY: y, hx: [], hy: [] };
      return p;
    }

    function field(x, y, U, out) {
      var X = x - obs.cx;
      var Y = (y - obs.cy) * obs.s;
      var r2 = X * X + Y * Y;
      var R2 = obs.a * obs.a;
      if (r2 < R2 * 0.55) { out.u = U; out.v = (Y > 0 ? 1 : -1) * U * 0.8; return; }
      var f = R2 / (r2 * r2);
      out.u = U * (1 - f * (X * X - Y * Y));
      out.v = U * (-2 * f * X * Y) / obs.s;
      out.u = clamp(out.u, U * 0.15, U * 2.2);
      out.v = clamp(out.v, -U * 1.6, U * 1.6);
    }

    var fo = { u: 0, v: 0 };
    function drawFlow(energy, t) {
      ctx.clearRect(0, 0, W, H);
      ctx.globalAlpha = Math.min(1, 0.5 + frame / 60);
      var U = 1.4 + energy * 13.5;
      var glowBase = 0.1 + energy * 0.16;
      ctx.lineWidth = 1.25;
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        field(p.x, p.y, U, fo);
        p.x += fo.u;
        p.y += fo.v + Math.sin(t * 0.012 + i * 1.7) * 0.22;
        p.y += (p.seedY - p.y) * 0.002;
        p.hx.push(p.x); p.hy.push(p.y);
        if (p.hx.length > TAIL) { p.hx.shift(); p.hy.shift(); }
        if (p.x > W + 30) {
          parts[i] = newPart(0, false);
          continue;
        }
        var dX = p.x - obs.cx, dY = (p.y - obs.cy) * obs.s;
        var dist = Math.sqrt(dX * dX + dY * dY) - obs.a;
        var near = clamp(1 - dist / 230, 0, 1);
        var a = glowBase + near * (0.26 + energy * 0.26);
        ctx.strokeStyle = "rgba(140,206,255," + a.toFixed(3) + ")";
        ctx.beginPath();
        ctx.moveTo(p.hx[0], p.hy[0]);
        for (var k = 1; k < p.hx.length; k++) ctx.lineTo(p.hx[k], p.hy[k]);
        ctx.stroke();
      }
      var gy = obs.cy + obs.b * 1.18;
      if (gy < H - 4) {
        ctx.strokeStyle = "rgba(120,170,215," + (0.05 + energy * 0.1).toFixed(3) + ")";
        ctx.beginPath();
        var span = obs.a * 2.3;
        var shift = (t * U * 1.15) % 90;
        for (var gx = obs.cx - span / 2 - shift; gx < obs.cx + span / 2; gx += 90) {
          ctx.moveTo(Math.max(gx, obs.cx - span / 2), gy);
          ctx.lineTo(Math.min(gx + 34, obs.cx + span / 2), gy);
        }
        ctx.stroke();
      }
    }

    function staticFlow() {
      measure();
      ctx.clearRect(0, 0, W, H);
      var rows = 16;
      ctx.lineWidth = 1;
      for (var j = 0; j < rows; j++) {
        var y0 = (H / (rows + 1)) * (j + 1);
        var near = clamp(1 - Math.abs(y0 - obs.cy) / 260, 0, 1);
        ctx.strokeStyle = "rgba(140,206,255," + (0.06 + near * 0.14).toFixed(3) + ")";
        ctx.beginPath();
        var x = -10, y = y0;
        ctx.moveTo(x, y);
        while (x < W + 10) {
          field(x, y, 6, fo);
          x += fo.u; y += fo.v;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      if (hudNum) hudNum.textContent = "8.2";
      if (hudBar) hudBar.style.transform = "scaleX(0.16)";
      if (hudDf) hudDf.textContent = "004";
    }

    var bands = [0.16, 0.44, 0.72];
    function chapterFrom(p) {
      if (p < bands[0]) return 0;
      if (p < bands[1]) return 1;
      if (p < bands[2]) return 2;
      return 3;
    }

    function setChapter(ch) {
      if (ch === curCh) return;
      curCh = ch;
      panels.forEach(function (el) {
        el.classList.toggle("is-on", +el.dataset.ch === ch);
      });
      dots.forEach(function (d) {
        d.classList.toggle("is-on", +d.dataset.goto === ch);
      });
      carSvg.classList.remove("z1", "z2", "z3");
      if (ch > 0) carSvg.classList.add("z" + ch);
    }

    dots.forEach(function (d) {
      d.addEventListener("click", function () {
        var ch = +d.dataset.goto;
        var vh = innerHeight;
        var span = tunnel.offsetHeight - vh;
        var centers = [0.01, 0.30, 0.58, 0.86];
        window.scrollTo({ top: tunnel.offsetTop + centers[ch] * span, behavior: reduced ? "auto" : "smooth" });
      });
    });

    if (reduced) {
      resize();
      staticFlow();
      addEventListener("resize", function () { resize(); staticFlow(); });
      addEventListener("scroll", function () {
        var rect = tunnel.getBoundingClientRect();
        var p = clamp(-rect.top / (tunnel.offsetHeight - innerHeight), 0, 1);
        setChapter(chapterFrom(p));
      }, { passive: true });
      return;
    }

    var running = false, rafId = 0, t = 0;

    function tick() {
      var rect = tunnel.getBoundingClientRect();
      var vh = innerHeight;
      var p = clamp(-rect.top / (tunnel.offsetHeight - vh), 0, 1);
      if (frame % 20 === 0) measure();
      wind.tick();
      var w = wind.get();
      t += 1;
      frame += 1;

      setChapter(chapterFrom(p));
      drawFlow(w.energy, t);

      var sink = w.energy * 5;
      carSvg.style.transform = "translateY(" + sink.toFixed(2) + "px)";
      wheelAngle -= (0.8 + w.energy * 11);
      var rot = "rotate(" + (wheelAngle % 360).toFixed(1) + ")";
      rims.forEach(function (r) { r.setAttribute("transform", rot); });

      if (frame % 3 === 0 && hudNum) {
        var ms = 4 + w.energy * 56;
        hudNum.textContent = ms.toFixed(1);
        hudBar.style.transform = "scaleX(" + (0.05 + w.energy * 0.95).toFixed(3) + ")";
        var df = Math.round(210 * Math.pow(ms / 60, 2));
        hudDf.textContent = String(df).padStart(3, "0");
      }
      rafId = requestAnimationFrame(tick);
    }

    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !running) {
          running = true;
          rafId = requestAnimationFrame(tick);
        } else if (!e.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(rafId);
        }
      });
    }, { threshold: 0 });
    io.observe(stage);

    addEventListener("resize", resize);
    resize();
    if (hudNum) {
      hudNum.textContent = "8.2";
      hudBar.style.transform = "scaleX(0.12)";
      hudDf.textContent = "004";
    }
  }

  /* ── リビール: 風に流されてきた要素が定位置に収まる(CSS側で発明) ── */
  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
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
    }, { threshold: 0.3 });
    targets.forEach(function (el) { io.observe(el); });
  }

  /* ── mono数値: 空力の成績表をカウントアップ ── */
  function initCountup() {
    var els = document.querySelectorAll("[data-count]");
    function fmt(v, dec) {
      return v.toLocaleString("ja-JP", { minimumFractionDigits: dec, maximumFractionDigits: dec });
    }
    function run(el) {
      var to = parseFloat(el.dataset.count);
      var dur = parseFloat(el.dataset.countDur || 1400);
      var dec = parseInt(el.dataset.countDec || 0, 10);
      if (reduced) { el.textContent = fmt(to, dec); return; }
      var t0 = performance.now();
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec);
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (reduced) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }

  function initForm() {
    var form = document.querySelector(".drive-form");
    if (!form) return;
    var note = form.querySelector(".form-note");
    if (note) note.setAttribute("aria-live", "polite");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var btn = form.querySelector("button[type=submit]");
      btn.disabled = true;
      btn.textContent = "申込みを受け付けました";
      if (note) note.textContent = "ありがとうございます。2営業日以内に、茅野工房からご連絡します。";
    });
  }

  function boot() {
    initTunnel();
    initReveal();
    initCountup();
    initForm();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        docEl.classList.add("is-loaded");
      });
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
