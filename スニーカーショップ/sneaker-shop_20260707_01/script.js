(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* loader */
  window.addEventListener("load", function () {
    var l = document.getElementById("loader"), num = document.getElementById("loaderNum");
    var n = 0, dur = reduce ? 0 : 1100, t0 = null;
    function step(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1);
      n = Math.round(p * 100);
      if (num) num.textContent = (n < 10 ? "0" : "") + n;
      if (p < 1) requestAnimationFrame(step);
      else { l.classList.add("done"); revealHero(); }
    }
    requestAnimationFrame(step);
  });

  function revealHero() {
    document.querySelectorAll(".hero__title em").forEach(function (em, i) {
      setTimeout(function () { em.classList.add("in"); }, i * 110);
    });
  }

  /* nav + scrollbar */
  var nav = document.getElementById("nav"), sb = document.getElementById("scrollbar");
  function onScroll() {
    var y = window.scrollY;
    if (nav) nav.classList.toggle("shrink", y > 50);
    if (sb) {
      var h = document.documentElement.scrollHeight - window.innerHeight;
      sb.style.width = (h > 0 ? (y / h) * 100 : 0) + "%";
    }
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* drawer */
  var burger = document.getElementById("burger"), drawer = document.getElementById("drawer");
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        drawer.classList.remove("open"); burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false"); document.body.style.overflow = "";
      });
    });
  }

  /* reveal + count */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-count")) count(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    document.querySelectorAll("[data-reveal],[data-count]").forEach(function (el) { io.observe(el); });
  }
  function count(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce) { el.textContent = fmt(target); return; }
    var dur = 1600, t0 = null;
    function s(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = fmt(Math.round(e * target));
      if (p < 1) requestAnimationFrame(s);
    }
    requestAnimationFrame(s);
  }
  function fmt(n) { return n >= 1000 ? n.toLocaleString("en-US") : String(n); }

  /* accordion */
  document.querySelectorAll(".acc__item").forEach(function (item) {
    var q = item.querySelector(".acc__q"), a = item.querySelector(".acc__a");
    q.addEventListener("click", function () {
      var open = item.classList.toggle("open");
      a.style.maxHeight = open ? a.scrollHeight + "px" : 0;
    });
  });

  /* magnetic buttons */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2, y = e.clientY - r.top - r.height / 2;
        el.style.transform = "translate(" + x * 0.3 + "px," + y * 0.4 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* tilt */
  if (!reduce && window.matchMedia("(pointer:fine)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = "perspective(900px) rotateY(" + px * 8 + "deg) rotateX(" + (-py * 8) + "deg)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* parallax lookbook */
  var px = document.querySelectorAll("[data-parallax]");
  function parallax() {
    var h = window.innerHeight;
    px.forEach(function (el, i) {
      var r = el.getBoundingClientRect();
      var off = (r.top + r.height / 2 - h / 2) / h;
      el.style.backgroundPosition = "50% " + (50 + off * (i % 2 ? -14 : 14)) + "%";
    });
  }

  /* custom cursor */
  var cur = document.querySelector(".cursor");
  if (cur && !reduce && window.matchMedia("(pointer:fine)").matches) {
    document.body.classList.add("cur");
    var cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor],a,button,input").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("hover"); });
    });
  }

  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking || reduce) return;
    ticking = true;
    requestAnimationFrame(function () { parallax(); ticking = false; });
  }, { passive: true });
  if (!reduce) parallax();

  /* horizontal rail: wheel to scroll */
  var rail = document.getElementById("rail");
  if (rail) {
    rail.addEventListener("wheel", function (e) {
      if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
        rail.scrollLeft += e.deltaY; e.preventDefault();
      }
    }, { passive: false });
  }

  /* smooth anchors */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (t) { e.preventDefault(); t.scrollIntoView({ behavior: reduce ? "auto" : "smooth" }); }
    });
  });

  /* Three.js ambient background */
  function initBG() {
    if (!window.THREE || reduce) return;
    var canvas = document.getElementById("bg");
    if (!canvas) return;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
    camera.position.z = 26;

    var group = new THREE.Group();
    scene.add(group);
    var geoms = [new THREE.IcosahedronGeometry(1.6, 0), new THREE.TorusGeometry(1.3, 0.4, 8, 20), new THREE.OctahedronGeometry(1.7, 0)];
    var mat = new THREE.MeshBasicMaterial({ color: 0xd4ff2e, wireframe: true, transparent: true, opacity: 0.55 });
    var matDim = new THREE.MeshBasicMaterial({ color: 0x3a3a42, wireframe: true, transparent: true, opacity: 0.5 });
    var meshes = [];
    for (var i = 0; i < 16; i++) {
      var g = geoms[i % geoms.length];
      var m = new THREE.Mesh(g, i % 4 === 0 ? mat : matDim);
      m.position.set((Math.random() - 0.5) * 46, (Math.random() - 0.5) * 40, (Math.random() - 0.5) * 26);
      var s = 0.6 + Math.random() * 1.6; m.scale.set(s, s, s);
      m.userData.rot = 0.002 + Math.random() * 0.006;
      group.add(m); meshes.push(m);
    }

    var mx = 0, my = 0;
    document.addEventListener("mousemove", function (e) {
      mx = (e.clientX / window.innerWidth - 0.5);
      my = (e.clientY / window.innerHeight - 0.5);
    });

    function resize() {
      var w = window.innerWidth, h = window.innerHeight;
      renderer.setSize(w, h, false);
      camera.aspect = w / h; camera.updateProjectionMatrix();
    }
    window.addEventListener("resize", resize); resize();

    var sy = 0;
    window.addEventListener("scroll", function () { sy = window.scrollY; }, { passive: true });

    (function animate() {
      requestAnimationFrame(animate);
      meshes.forEach(function (m) { m.rotation.x += m.userData.rot; m.rotation.y += m.userData.rot; });
      group.rotation.y += (mx * 0.6 - group.rotation.y) * 0.05;
      group.rotation.x += (my * 0.4 - group.rotation.x) * 0.05;
      camera.position.y = -sy * 0.006;
      renderer.render(scene, camera);
    })();
  }
  if (document.readyState === "complete") initBG();
  else window.addEventListener("load", initBG);
})();
