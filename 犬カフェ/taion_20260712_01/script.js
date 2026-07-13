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

  var DOG = '<g><path d="M16 66 Q4 54 14 42 Q22 54 32 62 Z"/><ellipse cx="36" cy="66" rx="21" ry="24"/><path d="M40 44 Q54 30 66 34 L70 80 L46 84 Z"/><rect x="58" y="62" width="10" height="30" rx="5"/><ellipse cx="63" cy="92" rx="8" ry="5"/><circle cx="70" cy="32" r="17"/><ellipse cx="86" cy="37" rx="10" ry="7"/><ellipse cx="62" cy="19" rx="7" ry="13" transform="rotate(-25 62 19)"/></g>';

  function dogTrail() {
    var steps = [
      ["story", "体温のはなし"],
      ["dogs", "こどもたち"],
      ["price", "料金"],
      ["flow", "はじめての方へ"],
      ["access", "アクセス"],
      ["cta", "予約"]
    ];
    var nav = document.querySelectorAll(".hero, .menu, .access, .cta, .story");
    var darkRanges = [];
    Array.prototype.forEach.call(nav, function (s) {
      darkRanges.push([s.offsetTop, s.offsetTop + s.offsetHeight * (s.classList.contains("story") ? 0.4 : 1)]);
    });
    function isDark(y) {
      for (var i = 0; i < darkRanges.length; i++) {
        if (y >= darkRanges[i][0] && y <= darkRanges[i][1]) return true;
      }
      return false;
    }
    var wrap = document.createElement("nav");
    wrap.className = "dogtrail";
    wrap.setAttribute("aria-label", "ページの道しるべ（現在地）");
    var items = [];
    var marks = [];
    steps.forEach(function (s) {
      marks.push(document.getElementById(s[0]));
    });
    function addPaw(y, k) {
      var d = document.createElement("span");
      d.className = "dogtrail__mark dogtrail__paw";
      var leftSide = (k % 2 === 0);
      d.style.left = (leftSide ? 15 : 28) + "px";
      d.style.top = (y - 7) + "px";
      d.style.transform = "rotate(" + (leftSide ? -12 : 12) + "deg)";
      d.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + PAW + "</svg>";
      wrap.appendChild(d);
      items.push({ el: d, y: y, base: d.style.transform });
    }
    for (var i = 0; i < steps.length; i++) {
      var el = marks[i];
      if (!el) continue;
      var y = el.offsetTop + 46;
      var b = document.createElement("button");
      b.type = "button";
      b.className = "dogtrail__mark dogtrail__dog";
      b.style.top = (y - 28) + "px";
      b.setAttribute("aria-label", steps[i][1] + "へ移動");
      b.innerHTML =
        '<span class="dogtrail__label">' + steps[i][1] + "</span>" +
        '<svg viewBox="0 0 100 100" aria-hidden="true">' + DOG + "</svg>";
      (function (target) {
        b.addEventListener("click", function () {
          target.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
        });
      })(el);
      wrap.appendChild(b);
      items.push({ el: b, y: y, dog: true });
      if (i < steps.length - 1 && marks[i + 1]) {
        var y2 = marks[i + 1].offsetTop + 54;
        var top = y + 46;
        var bottom = y2 - 46;
        var step = 36;
        var kk = 0;
        for (var yy = top; yy <= bottom; yy += step) {
          addPaw(yy, kk++);
        }
      }
    }
    items.forEach(function (it) {
      if (isDark(it.y)) it.el.classList.add("on-dark");
    });
    document.body.appendChild(wrap);
    function sizeTrail() {
      wrap.style.height = document.body.scrollHeight + "px";
    }
    sizeTrail();
    var ticking = false;
    function paint() {
      ticking = false;
      var sc = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      var mark = sc + window.innerHeight * 0.42;
      var hereY = -1;
      for (var i = 0; i < items.length; i++) {
        if (items[i].dog && items[i].y <= mark) hereY = items[i].y;
      }
      for (var j = 0; j < items.length; j++) {
        var it = items[j];
        it.el.classList.toggle("is-warm", it.y <= mark);
        if (it.dog) it.el.classList.toggle("is-here", it.y === hereY);
      }
    }
    addEventListener("scroll", function () {
      if (!ticking) { ticking = true; requestAnimationFrame(paint); }
    }, { passive: true });
    var rt;
    addEventListener("resize", function () {
      clearTimeout(rt);
      rt = setTimeout(function () { sizeTrail(); paint(); }, 180);
    }, { passive: true });
    paint();
  }

  function boot() {
    splash();
    reveals();
    counters();
    stickyHead();
    dogTrail();
    var hero = document.querySelector(".hero");
    if (hero) hero.classList.add("in");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
