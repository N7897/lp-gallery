(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ── 回転検分: スクロール位置を0..1に正規化し、車体のrotateY角度・章切替に写像
     Polestarの実配置写真の代わりに、静止した1台のSVGを軽く傾けて「見て回る」感覚を作る ── */
  function initRotate() {
    var sec = document.getElementById("rotate");
    var car = document.querySelector(".car-turn");
    var azEl = document.querySelector("[data-azimuth]");
    var notes = document.querySelectorAll(".rn");
    if (!sec || !car) return;

    var stops = [0, 0.5, 1];
    var angles = [10, -6, 4];
    var azimuths = [0, 48, 96];

    function apply(p) {
      var seg = p < stops[1] ? 0 : 1;
      var segP = seg === 0 ? p / stops[1] : (p - stops[1]) / (stops[2] - stops[1]);
      segP = clamp(segP, 0, 1);
      var angle = angles[seg] + (angles[seg + 1] - angles[seg]) * segP;
      var az = azimuths[seg] + (azimuths[seg + 1] - azimuths[seg]) * segP;
      if (!reduced) {
        car.style.transform = "perspective(1400px) rotateY(" + angle.toFixed(2) + "deg)";
      }
      if (azEl) azEl.textContent = Math.round(az);

      var idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
      notes.forEach(function (n) {
        n.classList.toggle("is-on", +n.dataset.rn === idx);
      });
    }

    if (reduced) { apply(0.5); return; }

    var running = false, rafId = 0;
    function tick() {
      var rect = sec.getBoundingClientRect();
      var span = sec.offsetHeight - innerHeight;
      var p = clamp(-rect.top / Math.max(1, span), 0, 1);
      apply(p);
      rafId = requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && !running) { running = true; rafId = requestAnimationFrame(tick); }
        else if (!e.isIntersecting && running) { running = false; cancelAnimationFrame(rafId); }
      });
    }, { threshold: 0 });
    io.observe(sec);
  }

  /* ── カラー配色: ボタン選択でボディ塗装・ホイールを差し替え(<use>先のdefsグラデ終端色を書き換え) ── */
  function initConfigure() {
    var swatches = document.querySelectorAll(".swatch");
    var carDef = document.querySelector("#carBodyDef");
    if (!swatches.length || !carDef) return;
    var grad = document.querySelector("#paintB");
    var stops = grad ? grad.querySelectorAll("stop") : [];

    function lighten(hex, amt) {
      var n = parseInt(hex.slice(1), 16);
      var r = clamp(((n >> 16) & 255) + amt, 0, 255);
      var g = clamp(((n >> 8) & 255) + amt, 0, 255);
      var b = clamp((n & 255) + amt, 0, 255);
      return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    function setColor(base, deep) {
      if (stops.length < 4) return;
      stops[0].setAttribute("stop-color", lighten(base, 46));
      stops[1].setAttribute("stop-color", base);
      stops[2].setAttribute("stop-color", lighten(base, -18));
      stops[3].setAttribute("stop-color", deep);
    }

    swatches.forEach(function (btn) {
      btn.addEventListener("click", function () {
        swatches.forEach(function (b) { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-on");
        btn.setAttribute("aria-pressed", "true");
        setColor(btn.dataset.paint, btn.dataset.paintDark);
      });
    });
  }

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
      if (note) note.textContent = "ありがとうございます。2営業日以内に、ニセコショールームからご連絡します。";
    });
  }

  function boot() {
    initRotate();
    initConfigure();
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
