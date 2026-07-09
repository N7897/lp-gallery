(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  var header = document.getElementById("siteHeader");
  var onScrollHeader = function () {
    if (window.scrollY > 24) header.classList.add("is-stuck");
    else header.classList.remove("is-stuck");
  };
  onScrollHeader();

  var toggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  if (toggle && mobileNav) {
    var setNav = function (open) {
      toggle.setAttribute("aria-expanded", String(open));
      toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
      mobileNav.hidden = !open;
      document.body.style.overflow = open ? "hidden" : "";
    };
    toggle.addEventListener("click", function () {
      setNav(toggle.getAttribute("aria-expanded") !== "true");
    });
    mobileNav.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setNav(false); });
    });
  }

  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  var counters = document.querySelectorAll(".counter");
  var runCounter = function (el) {
    var target = parseFloat(el.getAttribute("data-target")) || 0;
    var suffix = el.getAttribute("data-suffix") || "";
    var comma = el.getAttribute("data-comma");
    var dur = 1600, start = null;
    var fmt = function (n) {
      var v = Math.round(n);
      if (comma) v = v.toLocaleString("en-US");
      return v + suffix;
    };
    if (reduce) { el.textContent = fmt(target); return; }
    var step = function (ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(target * eased);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = fmt(target);
    };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { runCounter(e.target); cio.unobserve(e.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(function (el) { runCounter(el); });
  }

  var railFill = document.getElementById("railFill");
  var railDot = document.getElementById("railDot");
  var ticking = false;
  var updateRail = function () {
    ticking = false;
    var doc = document.documentElement;
    var max = doc.scrollHeight - doc.clientHeight;
    var p = max > 0 ? Math.min(window.scrollY / max, 1) : 0;
    if (railFill) railFill.style.strokeDashoffset = String(1000 - 1000 * p);
    if (railDot) railDot.style.top = (p * 100) + "vh";
  };
  var onScroll = function () {
    onScrollHeader();
    if (!ticking) { requestAnimationFrame(updateRail); ticking = true; }
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", updateRail, { passive: true });
  updateRail();

  var ecg = document.getElementById("ecgPath");
  if (ecg && ecg.getTotalLength) {
    try {
      var len = Math.ceil(ecg.getTotalLength());
      ecg.style.setProperty("--dash", len);
    } catch (e) {}
  }
})();
