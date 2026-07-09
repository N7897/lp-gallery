(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(pointer:fine)").matches;

  /* loader — JS生成: script.jsが読めなければオーバーレイ自体が存在せず本体が即見える */
  var loaderDone = false;
  function finishLoader(l) {
    if (loaderDone) return;
    loaderDone = true;
    l.classList.add("done");
    fadeInFirst();
  }
  (function () {
    var l = document.createElement("div");
    l.className = "loader";
    l.setAttribute("aria-hidden", "true");
    l.innerHTML = '<span class="loader__mark">LUMIÈRE</span><span class="loader__line"><i></i></span>';
    document.body.appendChild(l);
    setTimeout(function () { finishLoader(l); }, reduce ? 0 : 1500);
    /* safety: 何かが失敗しても3秒で必ず解除し、進行中の退場/登場transitionも打ち切って即表示 */
    setTimeout(function () {
      document.documentElement.classList.add("loader-snap");
      finishLoader(l);
    }, 3000);
  })();

  function fadeInFirst() {
    document.querySelectorAll("#s1 [data-fade]").forEach(function (el, i) {
      setTimeout(function () { el.classList.add("in"); }, i * 160);
    });
  }

  var scroller = document.getElementById("scroller");
  var nav = document.getElementById("nav");
  var dots = Array.prototype.slice.call(document.querySelectorAll(".dots a"));
  var panels = Array.prototype.slice.call(document.querySelectorAll(".panel"));

  scroller.addEventListener("scroll", function () {
    if (nav) nav.classList.toggle("shrink", scroller.scrollTop > 40);
  }, { passive: true });

  /* fade + dot active via IntersectionObserver on the scroller */
  if ("IntersectionObserver" in window) {
    var fo = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-count")) countUp(e.target);
        }
      });
    }, { root: scroller, threshold: 0.2 });
    document.querySelectorAll("[data-fade],[data-count]").forEach(function (el) { fo.observe(el); });

    var po = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) {
          var id = e.target.id;
          dots.forEach(function (d) { d.classList.toggle("active", d.getAttribute("href") === "#" + id); });
        }
      });
    }, { root: scroller, threshold: 0.55 });
    panels.forEach(function (p) { po.observe(p); });
  }

  function countUp(el) {
    var target = parseInt(el.getAttribute("data-count"), 10);
    if (reduce) { el.textContent = target; return; }
    var t0 = null, dur = 1500;
    function s(ts) {
      if (!t0) t0 = ts;
      var p = Math.min((ts - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(e * target);
      if (p < 1) requestAnimationFrame(s);
    }
    requestAnimationFrame(s);
  }

  /* dot / anchor smooth scroll within scroller */
  document.querySelectorAll('a[href^="#s"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var t = document.querySelector(a.getAttribute("href"));
      if (!t) return;
      e.preventDefault();
      scroller.scrollTo({ top: t.offsetTop, behavior: reduce ? "auto" : "smooth" });
      closeDrawer();
    });
  });

  /* drawer */
  var burger = document.getElementById("burger"), drawer = document.getElementById("drawer");
  function closeDrawer() {
    if (!drawer) return;
    drawer.classList.remove("open"); burger.classList.remove("open");
    burger.setAttribute("aria-expanded", "false");
  }
  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = drawer.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    drawer.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeDrawer); });
  }

  /* magnetic */
  if (!reduce && fine) {
    document.querySelectorAll("[data-magnetic]").forEach(function (el) {
      el.addEventListener("mousemove", function (e) {
        var r = el.getBoundingClientRect();
        el.style.transform = "translate(" + (e.clientX - r.left - r.width / 2) * 0.25 + "px," + (e.clientY - r.top - r.height / 2) * 0.35 + "px)";
      });
      el.addEventListener("mouseleave", function () { el.style.transform = ""; });
    });
  }

  /* custom cursor */
  if (fine && !reduce) {
    var cur = document.createElement("div"); cur.className = "cursor"; document.body.appendChild(cur);
    document.body.classList.add("cur");
    var cx = 0, cy = 0, tx = 0, ty = 0;
    document.addEventListener("mousemove", function (e) { tx = e.clientX; ty = e.clientY; });
    (function loop() {
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cur.style.transform = "translate(" + cx + "px," + cy + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    })();
    document.querySelectorAll("[data-cursor],a,button").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cur.classList.add("hover"); });
      el.addEventListener("mouseleave", function () { cur.classList.remove("hover"); });
    });
  }

  /* ---- WebGL gem: signature (rotating faceted stone + orbiting light refraction) ---- */
  function initGem() {
    if (!window.THREE || reduce) return;
    var canvas = document.getElementById("gem");
    if (!canvas) return;
    var renderer = new THREE.WebGLRenderer({ canvas: canvas, alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 8;

    // faceted gem: two cones back-to-back = brilliant-ish silhouette
    var gemGroup = new THREE.Group();
    var mat = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0.35, roughness: 0.12, flatShading: true, transparent: true, opacity: 0.92 });
    var crown = new THREE.Mesh(new THREE.ConeGeometry(1.5, 1.1, 12), mat);
    crown.position.y = 0.55;
    var pav = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.1, 12), mat);
    pav.rotation.x = Math.PI; pav.position.y = -0.5;
    gemGroup.add(crown, pav);
    // wireframe glint overlay
    var wire = new THREE.Mesh(new THREE.ConeGeometry(1.52, 2.15, 12), new THREE.MeshBasicMaterial({ color: 0xc8a96a, wireframe: true, transparent: true, opacity: 0.18 }));
    wire.rotation.x = Math.PI; wire.position.y = -0.5;
    gemGroup.add(wire);
    gemGroup.scale.set(1.15, 1.15, 1.15);
    scene.add(gemGroup);

    scene.add(new THREE.AmbientLight(0x404048, 1.1));
    var lights = [];
    var cols = [0xfff4e0, 0xc8a96a, 0xbfd0ff, 0xffffff];
    for (var i = 0; i < 4; i++) {
      var pl = new THREE.PointLight(cols[i], 1.5, 30);
      lights.push(pl); scene.add(pl);
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
      // shift gem left a touch on wide screens for elegance
      gemGroup.position.x = w > 900 ? 0 : 0;
    }
    window.addEventListener("resize", resize); resize();

    var t = 0, sy = 0;
    scroller.addEventListener("scroll", function () {
      sy = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight || 1);
    }, { passive: true });

    (function animate() {
      requestAnimationFrame(animate);
      t += 0.0045;
      gemGroup.rotation.y += 0.004;
      gemGroup.rotation.x += (my * 0.4 - gemGroup.rotation.x) * 0.03;
      gemGroup.rotation.y += (mx * 0.3) * 0.006;
      // gem drifts down & fades influence as you scroll into content
      gemGroup.position.y = -sy * 2.2;
      var op = Math.max(0.15, 1 - sy * 1.3);
      mat.opacity = 0.92 * op;
      for (var i = 0; i < lights.length; i++) {
        var a = t * (1 + i * 0.35) + i * Math.PI / 2;
        lights[i].position.set(Math.cos(a) * 5, Math.sin(a * 1.3) * 5, Math.sin(a) * 5 + 2);
      }
      renderer.render(scene, camera);
    })();
  }
  if (document.readyState === "complete") initGem();
  else window.addEventListener("load", initGem);
})();
