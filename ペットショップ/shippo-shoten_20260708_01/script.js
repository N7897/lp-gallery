/* ============ しっぽ商店 SHIPPO ============ */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- ヘッダー scrolled ---- */
  var header = document.getElementById("siteHeader");
  function onScrollHeader() {
    if (window.scrollY > 40) header.classList.add("scrolled");
    else header.classList.remove("scrolled");
  }
  onScrollHeader();
  window.addEventListener("scroll", onScrollHeader, { passive: true });

  /* ---- 足あと 進捗レール ---- */
  var pawWrap = document.getElementById("pawPaws");
  var PAW_N = 11, paws = [];
  if (pawWrap) {
    var pawSVG = '<svg viewBox="0 0 24 24"><path d="M12 14c-3 0-5.5 2.2-5.5 4.6C6.5 20.6 8.6 22 12 22s5.5-1.4 5.5-3.4C17.5 16.2 15 14 12 14z" fill="currentColor"/><circle cx="6" cy="9.5" r="2.3" fill="currentColor"/><circle cx="10" cy="6.4" r="2.3" fill="currentColor"/><circle cx="14" cy="6.4" r="2.3" fill="currentColor"/><circle cx="18" cy="9.5" r="2.3" fill="currentColor"/></svg>';
    for (var i = 0; i < PAW_N; i++) {
      var p = document.createElement("span");
      p.className = "paw";
      p.style.top = (i / (PAW_N - 1)) * 100 + "%";
      p.style.transitionDelay = (i % 2) * 40 + "ms";
      p.innerHTML = pawSVG;
      pawWrap.appendChild(p);
      paws.push(p);
    }
  }
  function onScrollPaws() {
    var h = document.documentElement;
    var prog = h.scrollTop / (h.scrollHeight - h.clientHeight || 1);
    var lit = Math.round(prog * PAW_N);
    for (var i = 0; i < paws.length; i++) {
      if (i < lit) paws[i].classList.add("lit");
      else paws[i].classList.remove("lit");
    }
  }
  onScrollPaws();
  window.addEventListener("scroll", onScrollPaws, { passive: true });

  /* ---- リビール ---- */
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } });
  }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
  if (!reduce) {
    document.querySelectorAll(".tile, .voice, .steplist li, .assure__item, .kurashi__cols p")
      .forEach(function (el, i) { el.classList.add("reveal"); el.style.transitionDelay = (i % 3) * 70 + "ms"; io.observe(el); });
  }

  /* ============ 主役：しっぽの波形 ============ */
  var tail = document.getElementById("tail");
  var trailG = document.getElementById("tailTrail");
  var head = document.getElementById("dogHead");
  var stage = document.getElementById("stage");
  var hint = document.getElementById("stageHint");
  var readout = document.getElementById("wagReadout");
  var TAIL_X = 150, TAIL_Y = 300;      // 尾の付け根
  var HEAD_CX = 372, HEAD_CY = 205;    // 首まわり

  // 残像ゴースト（固定プール）
  var GHOSTS = 6, ghosts = [];
  if (trailG && tail) {
    var d = tail.getAttribute("d");
    for (var g = 0; g < GHOSTS; g++) {
      var gp = document.createElementNS("http://www.w3.org/2000/svg", "path");
      gp.setAttribute("d", d);
      gp.setAttribute("class", "trail-seg");
      gp.setAttribute("stroke-width", 26 - g * 2.6);
      gp.setAttribute("stroke-opacity", (0.16 - g * 0.024).toFixed(3));
      trailG.appendChild(gp);
      ghosts.push(gp);
    }
  }

  var energy = 0.14;      // 興奮エネルギー 0..1
  var scrollEnergy = 0;   // スクロール速度から供給
  var pointerBoost = 0;   // ポインタ近接から供給
  var headTarget = 0, headNow = 0;
  var phase = 0, angHist = [];

  // スクロール速度 → エネルギー
  var lastY = window.scrollY, lastT = performance.now();
  window.addEventListener("scroll", function () {
    var now = performance.now();
    var dy = Math.abs(window.scrollY - lastY);
    var dt = Math.max(16, now - lastT);
    var v = dy / dt;                 // px/ms
    scrollEnergy = Math.min(1, scrollEnergy + v * 0.9);
    lastY = window.scrollY; lastT = now;
  }, { passive: true });

  // ポインタ近接（ヒーロー内）
  var stageRect = null;
  function measure() { if (stage) stageRect = stage.getBoundingClientRect(); }
  measure();
  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("scroll", measure, { passive: true });
  window.addEventListener("pointermove", function (e) {
    if (!stageRect) return;
    var cx = stageRect.left + stageRect.width / 2;
    var cy = stageRect.top + stageRect.height / 2;
    var dx = e.clientX - cx, dy = e.clientY - cy;
    var dist = Math.sqrt(dx * dx + dy * dy);
    var R = Math.max(stageRect.width, 320);
    var prox = Math.max(0, 1 - dist / R);      // 0..1
    pointerBoost = prox * prox;
    headTarget = Math.max(-9, Math.min(9, (dx / R) * 16));
  }, { passive: true });
  if (stage) {
    stage.addEventListener("pointerenter", function () { if (hint) hint.textContent = "うれしい！"; });
    stage.addEventListener("pointerleave", function () { pointerBoost = 0; headTarget = 0; if (hint) hint.textContent = "近づくと、よろこびます"; });
    stage.addEventListener("click", function () { energy = 1; });
  }

  var lerp = function (a, b, t) { return a + (b - a) * t; };

  if (reduce) {
    // 静止：やわらかな一振り
    if (tail) tail.setAttribute("transform", "rotate(-10 " + TAIL_X + " " + TAIL_Y + ")");
    if (readout) readout.textContent = "0.00";
  } else {
    var last = performance.now();
    function loop(now) {
      var dt = Math.min(0.05, (now - last) / 1000); last = now;

      // エネルギー：供給と減衰
      energy += scrollEnergy * 0.06 + pointerBoost * 0.05;
      scrollEnergy *= 0.90;
      energy *= 0.955;
      energy = Math.max(0.12, Math.min(1, energy));

      var eff = energy;
      var amp = lerp(7, 34, eff);           // 度
      var freq = lerp(1.5, 6.4, eff);       // Hz
      phase += freq * dt * Math.PI * 2;
      var ang = Math.sin(phase) * amp;

      if (tail) tail.setAttribute("transform", "rotate(" + ang.toFixed(2) + " " + TAIL_X + " " + TAIL_Y + ")");

      // 残像：直近の角度を薄く重ねる
      angHist.unshift(ang);
      if (angHist.length > GHOSTS + 2) angHist.pop();
      for (var i = 0; i < ghosts.length; i++) {
        var a = angHist[(i + 1) * 1] != null ? angHist[i + 1] : ang;
        ghosts[i].setAttribute("transform", "rotate(" + a.toFixed(2) + " " + TAIL_X + " " + TAIL_Y + ")");
      }

      // 頭：ポインタへ軽く向く
      headNow = lerp(headNow, headTarget, 0.09);
      if (head) head.setAttribute("transform", "rotate(" + headNow.toFixed(2) + " " + HEAD_CX + " " + HEAD_CY + ")");

      if (readout) readout.textContent = freq.toFixed(2);

      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  /* ---- CTA近くの相棒：最大に振れる ---- */
  var minitail = document.getElementById("minitail");
  var access = document.getElementById("access");
  if (minitail && access && !reduce) {
    var miniOn = false;
    new IntersectionObserver(function (es) {
      miniOn = es[0].isIntersecting;
    }, { threshold: 0.3 }).observe(access);
    var mp = 0, mlast = performance.now();
    (function mloop(now) {
      var dt = Math.min(0.05, (now - mlast) / 1000); mlast = now;
      if (miniOn) {
        mp += 8.5 * dt * Math.PI * 2;         // 速く
        var ma = Math.sin(mp) * 30;
        minitail.setAttribute("transform", "rotate(" + ma.toFixed(2) + " 46 92)");
      }
      requestAnimationFrame(mloop);
    })(performance.now());
  }

  /* ---- 内部リンクのスムーススクロール補正（ヘッダー分） ---- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 72;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
