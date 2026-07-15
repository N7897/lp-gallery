(function () {
  "use strict";

  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var docEl = document.documentElement;

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ── 組立検分: スクロール位置0..1で散らばった部品写真が定位置へ収束し、
     終盤で完成車の実写にクロスフェードする(位置合わせの粗をフェードで吸収する設計) ── */
  function initRotate() {
    var sec = document.getElementById("rotate");
    var azEl = document.querySelector("[data-azimuth]");
    var notes = document.querySelectorAll(".rn");
    var parts = document.querySelectorAll(".asm");
    var finalImg = document.querySelector(".asm-final");
    if (!sec || !parts.length) return;

    function apply(p) {
      var e = 1 - Math.pow(1 - clamp(p / 0.75, 0, 1), 3);
      var fade = clamp((p - 0.7) / 0.18, 0, 1);
      if (!reduced) {
        parts.forEach(function (el) {
          var k = 1 - e;
          el.style.transform = "translate(" + (el.dataset.dx * k).toFixed(1) + "px," +
            (el.dataset.dy * k).toFixed(1) + "px) rotate(" + (el.dataset.rot * k).toFixed(2) + "deg)";
          el.style.opacity = (1 - fade).toFixed(3);
        });
        if (finalImg) finalImg.style.opacity = fade.toFixed(3);
      }
      if (azEl) azEl.textContent = Math.round(e * 100);

      var idx = p < 0.34 ? 0 : p < 0.67 ? 1 : 2;
      notes.forEach(function (n) {
        n.classList.toggle("is-on", +n.dataset.rn === idx);
      });
    }

    if (reduced) {
      parts.forEach(function (el) { el.style.opacity = "0"; });
      if (finalImg) finalImg.style.opacity = "1";
      if (azEl) azEl.textContent = "100";
      apply(1);
      return;
    }

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
