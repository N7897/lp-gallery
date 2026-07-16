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

  /* ── 配色ハブ: 実写5枚をスタック配置し、選択で「ペイントが塗られる」ワイプで前面へ切替
     (clip-path inset()を右→左に開くアニメ。塗装をひと吹きで替える感覚をそのまま演出に翻訳)
     連続クリック対策: 進行中のワイプがあれば即座に確定(settle)してから次のワイプを始める。
     pendingTimeoutは常に1つだけ保持し、新しいクリックで前のタイマーを必ずclearする
     (放置すると古いタイマーが後から発火して新しい選択を上書きし、色が一瞬で戻るバグになる) ── */
  function initConfigure() {
    var swatches = document.querySelectorAll(".swatch");
    var imgs = document.querySelectorAll(".cfg-img");
    if (!swatches.length || !imgs.length) return;
    var pendingTimeout = null;

    function settle(finalImg) {
      imgs.forEach(function (img) {
        img.classList.remove("is-wiping");
        img.style.clipPath = "";
        img.classList.toggle("is-on", img === finalImg);
      });
    }

    swatches.forEach(function (btn) {
      btn.addEventListener("click", function () {
        var color = btn.dataset.color;
        var target = null;
        imgs.forEach(function (img) { if (img.dataset.color === color) target = img; });
        if (!target || target.classList.contains("is-on")) return;

        swatches.forEach(function (b) { b.classList.remove("is-on"); b.setAttribute("aria-pressed", "false"); });
        btn.classList.add("is-on");
        btn.setAttribute("aria-pressed", "true");

        if (pendingTimeout) { clearTimeout(pendingTimeout); pendingTimeout = null; }

        if (reduced) { settle(target); return; }

        var wiping = document.querySelector(".cfg-img.is-wiping");
        if (wiping) settle(wiping);

        target.style.clipPath = "inset(0 100% 0 0)";
        target.classList.add("is-wiping");
        requestAnimationFrame(function () {
          requestAnimationFrame(function () {
            target.style.clipPath = "inset(0 0 0 0)";
          });
        });
        pendingTimeout = setTimeout(function () {
          pendingTimeout = null;
          settle(target);
        }, 780);
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
