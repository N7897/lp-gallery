/* ============================================================
   律 RITSU — interactions
   署名: 生きているムーブメント（テンプが常時律動 + スクロールで針が一周）
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  var SVGNS = 'http://www.w3.org/2000/svg';

  function $(s, c) { return (c || document).querySelector(s); }
  function el(name, attrs) {
    var e = document.createElementNS(SVGNS, name);
    if (attrs) for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function pt(cx, cy, r, a) { return [cx + Math.cos(a) * r, cy + Math.sin(a) * r]; }

  /* -------- toothed gear path -------- */
  function gearPath(cx, cy, rO, rR, teeth) {
    var d = '', step = (Math.PI * 2) / teeth, tip = step * 0.36;
    for (var i = 0; i < teeth; i++) {
      var a0 = i * step, a1 = a0 + tip, a2 = a1 + step * 0.06,
          a3 = (i + 1) * step - step * 0.06;
      var p0 = pt(cx, cy, rO, a0), p1 = pt(cx, cy, rO, a1),
          p2 = pt(cx, cy, rR, a2), p3 = pt(cx, cy, rR, a3);
      d += (i === 0 ? 'M' : 'L') + p0[0].toFixed(2) + ',' + p0[1].toFixed(2)
        + ' L' + p1[0].toFixed(2) + ',' + p1[1].toFixed(2)
        + ' L' + p2[0].toFixed(2) + ',' + p2[1].toFixed(2)
        + ' L' + p3[0].toFixed(2) + ',' + p3[1].toFixed(2);
    }
    return d + 'Z';
  }
  /* -------- archimedean spiral (hairspring) -------- */
  function spiralPath(cx, cy, turns, rMax, seg) {
    var d = '', N = turns * seg, a, r, p;
    for (var i = 0; i <= N; i++) {
      a = (i / seg) * Math.PI * 2;
      r = (i / N) * rMax;
      p = pt(cx, cy, r, a);
      d += (i === 0 ? 'M' : 'L') + p[0].toFixed(2) + ',' + p[1].toFixed(2);
    }
    return d;
  }

  function gearGroup(cx, cy, rO, rR, teeth, spokes) {
    var g = el('g');
    g.appendChild(el('circle', { cx: cx, cy: cy, r: rO - 2, class: 'mv-gear-fill' }));
    g.appendChild(el('path', { d: gearPath(cx, cy, rO, rR, teeth), class: 'mv-gear' }));
    g.appendChild(el('circle', { cx: cx, cy: cy, r: rR * 0.42, class: 'mv-gear-core' }));
    for (var s = 0; s < spokes; s++) {
      var a = (s / spokes) * Math.PI * 2, i0 = pt(cx, cy, rR * 0.42, a), o0 = pt(cx, cy, rO - 4, a);
      g.appendChild(el('line', { x1: i0[0], y1: i0[1], x2: o0[0], y2: o0[1], class: 'mv-gear-core' }));
    }
    g.appendChild(el('circle', { cx: cx, cy: cy, r: 4, class: 'mv-jewel' }));
    return g;
  }

  /* ============================================================
     1. HERO MOVEMENT
     ============================================================ */
  var mvBalance, mvHair, mvFork, mvGears = [], mvRunning = false, mvRAF = 0;
  function buildMovement() {
    var svg = document.getElementById('movement');
    if (!svg) return;
    var fb = document.getElementById('mv-fallback');
    if (fb) { var em = fb.querySelector('.mv-emblem'); if (em) em.remove(); }

    var root = el('g', { class: 'mv-root' });

    // bridges / plates for depth
    root.appendChild(el('rect', { x: 96, y: 232, width: 210, height: 150, rx: 40, class: 'mv-bridge', transform: 'rotate(-8 200 300)' }));
    root.appendChild(el('rect', { x: 250, y: 120, width: 150, height: 130, rx: 34, class: 'mv-bridge', transform: 'rotate(12 320 190)' }));

    // gear train
    var barrel = gearGroup(170, 300, 92, 78, 42, 0);           // mainspring barrel
    var center = gearGroup(300, 252, 62, 50, 30, 4);           // center wheel
    var third  = gearGroup(360, 348, 40, 30, 22, 4);           // third wheel
    root.appendChild(barrel); root.appendChild(center); root.appendChild(third);
    mvGears = [
      { g: barrel, cx: 170, cy: 300, spd: -0.10 },
      { g: center, cx: 300, cy: 252, spd: 0.26 },
      { g: third,  cx: 360, cy: 348, spd: -0.5 }
    ];

    // pallet fork
    mvFork = el('g');
    mvFork.appendChild(el('line', { x1: 316, y1: 214, x2: 348, y2: 196, class: 'mv-fork' }));
    mvFork.appendChild(el('line', { x1: 316, y1: 214, x2: 300, y2: 236, class: 'mv-fork' }));
    mvFork.appendChild(el('circle', { cx: 316, cy: 214, r: 3.4, class: 'mv-jewel' }));
    root.appendChild(mvFork);

    // balance wheel (署名: oscillates)
    var bx = 352, by = 168, br = 78;
    mvBalance = el('g');
    mvBalance.appendChild(el('circle', { cx: bx, cy: by, r: br, class: 'mv-balance-rim' }));
    mvBalance.appendChild(el('circle', { cx: bx, cy: by, r: br - 6, class: 'mv-balance-rim', style: 'opacity:.35' }));
    for (var s = 0; s < 3; s++) {
      var a = (s / 3) * Math.PI * 2, p = pt(bx, by, br, a);
      mvBalance.appendChild(el('line', { x1: bx, y1: by, x2: p[0], y2: p[1], class: 'mv-balance-spoke' }));
    }
    mvHair = el('path', { d: spiralPath(bx, by, 3.2, br - 16, 60), class: 'mv-hairspring' });
    mvBalance.appendChild(mvHair);
    mvBalance.appendChild(el('circle', { cx: bx, cy: by, r: 4, class: 'mv-jewel' }));
    root.appendChild(mvBalance);

    // blued screws / jewels around the plate (署名色ドット)
    var screws = [[120, 250], [250, 372], [386, 274], [214, 176], [300, 130]];
    screws.forEach(function (c) {
      root.appendChild(el('circle', { cx: c[0], cy: c[1], r: 5, class: 'mv-screw' }));
    });

    svg.appendChild(root);

    if (reduce) { renderMovement(0); return; }
    // pause when off-screen
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { if (!mvRunning) { mvRunning = true; mvRAF = requestAnimationFrame(tickMovement); } }
        else { mvRunning = false; cancelAnimationFrame(mvRAF); }
      });
    }, { threshold: 0.05 });
    io.observe(svg);
  }
  function renderMovement(t) {
    var beat = Math.sin(t * 0.006);        // ~0.95Hz oscillation
    if (mvBalance) mvBalance.setAttribute('transform', 'rotate(' + (beat * 150).toFixed(2) + ' 352 168)');
    if (mvHair) mvHair.setAttribute('transform', 'rotate(' + (beat * 26).toFixed(2) + ' 352 168)');
    if (mvFork) mvFork.setAttribute('transform', 'rotate(' + (-beat * 10).toFixed(2) + ' 316 214)');
    for (var i = 0; i < mvGears.length; i++) {
      var gg = mvGears[i];
      gg.g.setAttribute('transform', 'rotate(' + (t * 0.02 * gg.spd).toFixed(2) + ' ' + gg.cx + ' ' + gg.cy + ')');
    }
  }
  function tickMovement(ts) {
    if (!mvRunning) return;
    renderMovement(ts);
    mvRAF = requestAnimationFrame(tickMovement);
  }

  /* ============================================================
     2. DIAL — ticks + scroll-driven hands + running seconds
     ============================================================ */
  function buildDial() {
    var ticks = document.getElementById('dial-ticks');
    if (!ticks) return;
    var romans = ['XII','I','II','III','IIII','V','VI','VII','VIII','IX','X','XI'];
    for (var i = 0; i < 60; i++) {
      var a = (i / 60) * Math.PI * 2 - Math.PI / 2, major = i % 5 === 0;
      var o = pt(200, 200, 182, a), inr = pt(200, 200, major ? 166 : 174, a);
      ticks.appendChild(el('line', { x1: inr[0].toFixed(2), y1: inr[1].toFixed(2), x2: o[0].toFixed(2), y2: o[1].toFixed(2), class: 'tick' + (major ? ' major' : '') }));
    }
    for (var h = 0; h < 12; h++) {
      var aa = (h / 12) * Math.PI * 2 - Math.PI / 2, np = pt(200, 200, 146, aa);
      var tx = el('text', { x: np[0].toFixed(2), y: (np[1] + 6).toFixed(2), 'text-anchor': 'middle', class: 'tick-num' });
      tx.textContent = romans[h];
      ticks.appendChild(tx);
    }
  }

  var handHour, handMin, handSec, dialScroll, cards, activeIdx = -1;
  function setHand(elm, deg) { if (elm) elm.setAttribute('transform', 'rotate(' + deg.toFixed(2) + ' 200 200)'); }

  function updateDial() {
    if (!dialScroll) return;
    var r = dialScroll.getBoundingClientRect();
    var total = dialScroll.offsetHeight - window.innerHeight;
    var prog = total > 0 ? clamp(-r.top / total, 0, 1) : 0;
    setHand(handHour, prog * 360);
    setHand(handMin, prog * 360 * 6);
    var idx = Math.min(cards.length - 1, Math.floor(prog * cards.length + 0.0001));
    if (idx !== activeIdx) {
      activeIdx = idx;
      for (var i = 0; i < cards.length; i++) cards[i].classList.toggle('is-active', i === idx);
    }
  }
  function runSeconds(ts) {
    if (handSec && !reduce) setHand(handSec, (ts * 0.045) % 360);
    requestAnimationFrame(runSeconds);
  }

  /* ============================================================
     3. ESCAPEMENT (mechanism section)
     ============================================================ */
  var escWheel, escFork, escBalance, escRunning = false, escRAF = 0;
  function buildEscape() {
    var parts = document.getElementById('esc-parts');
    if (!parts) return;
    // escape wheel (steps)
    escWheel = el('g');
    escWheel.appendChild(el('circle', { cx: 160, cy: 210, r: 52, class: 'esc-wheel-fill' }));
    escWheel.appendChild(el('path', { d: gearPath(160, 210, 56, 40, 15), class: 'esc-wheel' }));
    escWheel.appendChild(el('circle', { cx: 160, cy: 210, r: 6, class: 'esc-jewel' }));
    parts.appendChild(escWheel);
    // pallet fork
    escFork = el('g');
    escFork.appendChild(el('path', { d: 'M160 150 L146 168 M160 150 L174 168 M160 150 L160 128', class: 'esc-fork' }));
    escFork.appendChild(el('circle', { cx: 160, cy: 150, r: 4, class: 'esc-jewel' }));
    parts.appendChild(escFork);
    // balance
    escBalance = el('g');
    escBalance.appendChild(el('circle', { cx: 160, cy: 108, r: 44, class: 'esc-balance' }));
    for (var s = 0; s < 3; s++) {
      var a = (s / 3) * Math.PI * 2, p = pt(160, 108, 44, a);
      escBalance.appendChild(el('line', { x1: 160, y1: 108, x2: p[0], y2: p[1], class: 'esc-spoke' }));
    }
    escBalance.appendChild(el('path', { d: spiralPath(160, 108, 3, 30, 56), class: 'esc-hair' }));
    escBalance.appendChild(el('circle', { cx: 160, cy: 108, r: 4, class: 'esc-jewel' }));
    parts.appendChild(escBalance);

    if (reduce) { return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { if (!escRunning) { escRunning = true; escRAF = requestAnimationFrame(tickEscape); } }
        else { escRunning = false; cancelAnimationFrame(escRAF); }
      });
    }, { threshold: 0.15 });
    io.observe(document.getElementById('escape'));
  }
  function tickEscape(ts) {
    if (!escRunning) return;
    var beat = Math.sin(ts * 0.006);
    if (escBalance) escBalance.setAttribute('transform', 'rotate(' + (beat * 160).toFixed(2) + ' 160 108)');
    if (escFork) escFork.setAttribute('transform', 'rotate(' + (-beat * 12).toFixed(2) + ' 160 150)');
    // escape wheel steps at each half-cycle
    var steps = Math.floor(ts * 0.006 / Math.PI);
    if (escWheel) escWheel.setAttribute('transform', 'rotate(' + (steps * (360 / 15)).toFixed(2) + ' 160 210)');
    escRAF = requestAnimationFrame(tickEscape);
  }

  /* ============================================================
     4. BENTO TILT
     ============================================================ */
  function initTilt() {
    if (!finePointer || reduce) return;
    var pieces = document.querySelectorAll('.piece.tilt');
    pieces.forEach(function (p) {
      p.addEventListener('pointermove', function (e) {
        var r = p.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        p.style.transform = 'perspective(800px) rotateY(' + ((px - 0.5) * 9).toFixed(2) + 'deg) rotateX(' + ((0.5 - py) * 9).toFixed(2) + 'deg) translateY(-4px)';
        p.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        p.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      p.addEventListener('pointerleave', function () { p.style.transform = ''; });
    });
  }

  /* ============================================================
     5. HEADER / REVEAL / COUNT-UP / FORM
     ============================================================ */
  function initHeader() {
    var h = document.getElementById('siteHeader');
    var onScroll = function () { h.classList.toggle('scrolled', window.scrollY > 40); };
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  function initReveal() {
    var els = document.querySelectorAll('.section-title,.section-index,.spec,.care-card,.atelier-body,.visit-form,.hero-meta');
    els.forEach(function (e) { e.classList.add('reveal'); });
    if (reduce) { els.forEach(function (e) { e.classList.add('in'); }); return; }
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.16, rootMargin: '0px 0px -8% 0px' });
    els.forEach(function (e) { io.observe(e); });
  }
  function countUp() {
    var nums = document.querySelectorAll('.hero-meta .num');
    nums.forEach(function (n) {
      var raw = n.textContent.replace(/,/g, '');
      if (!/^\d+$/.test(raw)) return;
      var target = parseInt(raw, 10);
      if (reduce) { n.textContent = target.toLocaleString('en-US'); return; }
      var io = new IntersectionObserver(function (ents) {
        ents.forEach(function (en) {
          if (!en.isIntersecting) return; io.unobserve(en.target);
          var t0 = null, dur = 1400;
          function step(ts) {
            if (!t0) t0 = ts; var p = clamp((ts - t0) / dur, 0, 1);
            var e = 1 - Math.pow(1 - p, 3);
            n.textContent = Math.round(target * e).toLocaleString('en-US');
            if (p < 1) requestAnimationFrame(step);
          }
          requestAnimationFrame(step);
        });
      }, { threshold: 0.6 });
      io.observe(n);
    });
  }
  function initForm() {
    var f = document.querySelector('.visit-form');
    if (!f) return;
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = document.getElementById('formNote');
      var name = document.getElementById('v-name').value.trim();
      var mail = document.getElementById('v-mail').value.trim();
      if (!name || !mail) { note.textContent = 'お名前とメールアドレスをご入力ください。'; note.style.color = 'var(--steel)'; return; }
      note.textContent = 'ありがとうございます。折り返し、ご希望日時のご相談をお送りします。';
      note.style.color = 'var(--steel)';
      f.querySelector('button').disabled = true;
    });
  }

  /* -------- boot -------- */
  function boot() {
    buildMovement();
    buildDial();
    buildEscape();
    initTilt();
    initHeader();
    initReveal();
    countUp();
    initForm();

    handHour = document.getElementById('hand-hour');
    handMin = document.getElementById('hand-min');
    handSec = document.getElementById('hand-sec');
    dialScroll = document.getElementById('collection');
    cards = Array.prototype.slice.call(document.querySelectorAll('.dcard'));

    if (dialScroll && cards.length) {
      updateDial();
      window.addEventListener('scroll', function () { requestAnimationFrame(updateDial); }, { passive: true });
      window.addEventListener('resize', updateDial, { passive: true });
    }
    if (!reduce) requestAnimationFrame(runSeconds);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
