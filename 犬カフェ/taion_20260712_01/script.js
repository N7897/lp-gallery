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

  function boot() {
    splash();
    reveals();
    counters();
    stickyHead();
    var hero = document.querySelector(".hero");
    if (hero) hero.classList.add("in");
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
