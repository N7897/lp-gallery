(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover:hover) and (pointer:fine)").matches;

  /* ---------- reveal on scroll ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (Math.min(i % 4, 3) * 0.08) + "s";
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- header scroll state ---------- */
  var header = document.getElementById("siteHeader");
  var onScroll = function () {
    if (window.scrollY > 40) header.classList.add("is-scrolled");
    else header.classList.remove("is-scrolled");
    var h = document.documentElement;
    var p = h.scrollTop / (h.scrollHeight - h.clientHeight);
    var bar = document.getElementById("progressBar");
    if (bar) bar.style.width = (p * 100) + "%";
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- mobile nav ---------- */
  var toggle = document.getElementById("navToggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.classList.toggle("is-open", open);
      header.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    });
    nav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("is-open");
        toggle.classList.remove("is-open");
        header.classList.remove("nav-open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  /* ---------- count up ---------- */
  var counted = false;
  var runCounts = function () {
    if (counted) return; counted = true;
    document.querySelectorAll(".count").forEach(function (el) {
      var to = parseFloat(el.getAttribute("data-to"));
      var dec = el.hasAttribute("data-decimal");
      var suffix = el.getAttribute("data-suffix") || "";
      var dur = 1800, start = performance.now();
      var step = function (now) {
        var t = Math.min((now - start) / dur, 1);
        var eased = 1 - Math.pow(1 - t, 3);
        var val = to * eased;
        var out = dec ? (val / 10).toFixed(1) : Math.round(val).toLocaleString("ja-JP");
        el.textContent = out + (t === 1 ? suffix : "");
        if (t < 1) requestAnimationFrame(step);
      };
      if (reduce) { el.textContent = (dec ? (to / 10).toFixed(1) : to.toLocaleString("ja-JP")) + suffix; }
      else requestAnimationFrame(step);
    });
  };
  var stats = document.querySelector(".stats");
  if (stats && "IntersectionObserver" in window) {
    new IntersectionObserver(function (en, ob) {
      en.forEach(function (e) { if (e.isIntersecting) { runCounts(); ob.disconnect(); } });
    }, { threshold: 0.4 }).observe(stats);
  } else { runCounts(); }

  /* ---------- tabs ---------- */
  var tabs = document.querySelectorAll(".tab");
  var panels = document.querySelectorAll(".tab-panel");
  tabs.forEach(function (tab) {
    tab.addEventListener("click", function () {
      var key = tab.getAttribute("data-tab");
      tabs.forEach(function (t) { t.classList.remove("is-active"); t.setAttribute("aria-selected", "false"); });
      tab.classList.add("is-active"); tab.setAttribute("aria-selected", "true");
      panels.forEach(function (p) { p.classList.toggle("is-active", p.getAttribute("data-panel") === key); });
    });
  });

  /* ---------- accordion ---------- */
  document.querySelectorAll(".acc__q").forEach(function (q) {
    q.addEventListener("click", function () {
      var item = q.closest(".acc__item");
      var panel = item.querySelector(".acc__a");
      var open = item.classList.toggle("is-open");
      q.setAttribute("aria-expanded", open ? "true" : "false");
      panel.style.maxHeight = open ? panel.scrollHeight + "px" : null;
    });
  });
  window.addEventListener("resize", function () {
    document.querySelectorAll(".acc__item.is-open .acc__a").forEach(function (p) {
      p.style.maxHeight = p.scrollHeight + "px";
    });
  });

  /* ---------- custom cursor ---------- */
  if (fine && !reduce) {
    var cur = document.querySelector(".cursor");
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("a,button,[data-tilt]").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hot"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hot"); });
    });
  }

  /* ---------- magnetic buttons ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-magnetic]").forEach(function (btn) {
      btn.addEventListener("mousemove", function (e) {
        var r = btn.getBoundingClientRect();
        var mx = e.clientX - r.left - r.width / 2;
        var my = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + mx * 0.28 + "px," + my * 0.4 + "px)";
      });
      btn.addEventListener("mouseleave", function () { btn.style.transform = ""; });
    });
  }

  /* ---------- 3D tilt ---------- */
  if (fine && !reduce) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5;
        var py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "rotateY(" + px * 10 + "deg) rotateX(" + (-py * 10) + "deg)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* ---------- hero parallax on petals ---------- */
  if (fine && !reduce) {
    var scene = document.querySelector(".hero__scene");
    if (scene) {
      window.addEventListener("mousemove", function (e) {
        var dx = (e.clientX / window.innerWidth - 0.5);
        var dy = (e.clientY / window.innerHeight - 0.5);
        scene.querySelectorAll(".petal").forEach(function (p, i) {
          var d = (i + 1) * 6;
          p.style.marginLeft = dx * d + "px";
          p.style.marginTop = dy * d + "px";
        });
      });
    }
  }
})();
