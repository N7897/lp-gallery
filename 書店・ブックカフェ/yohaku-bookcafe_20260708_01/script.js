/* 余白 YOHAKU — interactions (vanilla JS, 60fps, reduced-motion aware) */
(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- hero book opens on load ---- */
  var book = document.getElementById("book");
  if (book) {
    if (reduce) {
      book.classList.add("is-open");
    } else {
      window.addEventListener("load", function () {
        setTimeout(function () { book.classList.add("is-open"); }, 480);
      });
    }
  }

  /* ---- header stuck state ---- */
  var head = document.getElementById("siteHead");
  /* ---- 栞 scroll progress ---- */
  var ribbon = document.querySelector(".shiori__ribbon");
  var pct = document.querySelector(".shiori__pct");
  var ticking = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var p = docH > 0 ? Math.min(1, Math.max(0, y / docH)) : 0;

    if (head) head.classList.toggle("is-stuck", y > 40);
    if (ribbon) ribbon.style.height = (p * 100) + "vh";
    if (pct) pct.textContent = String(Math.round(p * 100)).padStart(3, "0");

    updateFlip();
    ticking = false;
  }
  function requestScroll() {
    if (!ticking) { window.requestAnimationFrame(onScroll); ticking = true; }
  }
  window.addEventListener("scroll", requestScroll, { passive: true });
  window.addEventListener("resize", requestScroll, { passive: true });

  /* ---- signature: spread page flip driven by scroll ---- */
  var spread = document.getElementById("spread");
  var flip = document.getElementById("flip");
  function updateFlip() {
    if (!flip || !spread || reduce) return;
    var r = spread.getBoundingClientRect();
    var vh = window.innerHeight;
    /* progress: 0 when spread enters bottom, 1 when it reaches top-ish */
    var raw = (vh - r.top) / (vh + r.height);
    var prog = Math.min(1, Math.max(0, (raw - 0.15) / 0.6));
    var deg = -180 * prog;
    flip.style.transform = "rotateY(" + deg + "deg)";
    /* subtle shadow of turned page via z lift kept in CSS */
  }
  if (reduce && flip) { flip.style.transform = "rotateY(-180deg)"; }

  /* ---- reveal on view ---- */
  var io;
  if ("IntersectionObserver" in window && !reduce) {
    io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll(".reveal, .tl__item").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal, .tl__item").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- mobile drawer ---- */
  var toggle = document.querySelector(".nav-toggle");
  var drawer = document.getElementById("drawer");
  function setDrawer(open) {
    if (!drawer || !toggle) return;
    drawer.classList.toggle("is-open", open);
    drawer.setAttribute("aria-hidden", open ? "false" : "true");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "メニューを閉じる" : "メニューを開く");
    document.body.style.overflow = open ? "hidden" : "";
  }
  if (toggle) {
    toggle.addEventListener("click", function () {
      setDrawer(!drawer.classList.contains("is-open"));
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () { setDrawer(false); });
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") setDrawer(false);
    });
  }

  /* ---- footnote tap toggle (touch) ---- */
  document.querySelectorAll(".fn").forEach(function (fn) {
    fn.addEventListener("click", function (e) {
      e.preventDefault();
      fn.classList.toggle("is-shown");
      var note = fn.querySelector(".fn__note");
      if (note) {
        var shown = fn.classList.contains("is-shown");
        note.style.opacity = shown ? "1" : "";
        note.style.visibility = shown ? "visible" : "";
        note.style.transform = shown ? "translateY(0)" : "";
      }
    });
  });

  /* initial paint */
  onScroll();
})();
