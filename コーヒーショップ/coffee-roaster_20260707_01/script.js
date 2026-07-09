(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* loader — JS生成: script.jsが読めなければオーバーレイ自体が存在せず本体が即見える */
  var loaderDone = false;
  function finishLoader(l) {
    if (loaderDone) return;
    loaderDone = true;
    l.classList.add("done");
    revealHero();
  }
  (function () {
    var l = document.createElement("div");
    l.className = "loader";
    l.setAttribute("aria-hidden", "true");
    l.innerHTML = '<div class="loader__inner"><span class="loader__mark">MŌRU</span><span class="loader__bar"><i></i></span></div>';
    document.body.appendChild(l);
    setTimeout(function () { finishLoader(l); }, reduce ? 0 : 1250);
    /* safety: 何かが失敗しても3秒で必ず解除し、進行中の退場/登場transitionも打ち切って即表示 */
    setTimeout(function () {
      document.documentElement.classList.add("loader-snap");
      finishLoader(l);
    }, 3000);
  })();

  function revealHero() {
    var words = document.querySelectorAll(".hero__title .word");
    words.forEach(function (w, i) {
      setTimeout(function () { w.classList.add("in"); }, i * 130);
    });
  }

  /* nav shrink + mobile drawer */
  var nav = document.getElementById("nav");
  var lastY = 0;
  window.addEventListener("scroll", function () {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("shrink", y > 60);
    lastY = y;
  }, { passive: true });

  var burger = document.getElementById("burger");
  var drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
        document.body.style.overflow = "";
      });
    });
  }

  /* reveal on scroll */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-count")) animateCount(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.16, rootMargin: "0px 0px -8% 0px" });
    document.querySelectorAll("[data-reveal],[data-count]").forEach(function (el) {
      io.observe(el);
    });
  } else {
    document.querySelectorAll("[data-reveal]").forEach(function (el) { el.classList.add("in"); });
  }

  /* count up */
  function animateCount(el) {
    if (reduce) { el.textContent = el.getAttribute("data-count"); return; }
    var target = parseInt(el.getAttribute("data-count"), 10);
    var dur = 1400, start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* parallax photo */
  var pxEls = document.querySelectorAll("[data-parallax] .craft__photo");
  function parallax() {
    var h = window.innerHeight;
    pxEls.forEach(function (el) {
      var r = el.getBoundingClientRect();
      var mid = r.top + r.height / 2;
      var off = (mid - h / 2) / h;
      el.style.transform = "scale(1.12) translateY(" + (off * -26) + "px)";
    });
  }

  /* hero cup drift */
  var cup = document.querySelector(".hero__cup");
  function heroDrift() {
    if (!cup || reduce) return;
    var y = window.scrollY;
    cup.style.transform = "translateY(" + (y * 0.16) + "px)";
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      if (!reduce) { parallax(); heroDrift(); }
      ticking = false;
    });
  }, { passive: true });
  if (!reduce) parallax();

  /* custom cursor */
  var cur = document.querySelector(".cursor");
  var dot = document.querySelector(".cursor-dot");
  var fine = window.matchMedia("(pointer:fine)").matches;
  if (cur && dot && fine && !reduce) {
    document.body.classList.add("hide-native");
    var cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", function (e) {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = "translate(" + tx + "px," + ty + "px) translate(-50%,-50%)";
    });
    (function loop() {
      cx += (tx - cx) * 0.16;
      cy += (ty - cy) * 0.16;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor],a,button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("is-hover"); });
    });
  }

  /* smooth anchor (respect reduce) */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      e.preventDefault();
      t.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    });
  });
})();
