(function(){
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function createOscillator(watchEl){
    var fns = [], raf = 0, running = false, io = null;
    function tick(t){
      for (var i = 0; i < fns.length; i++) fns[i](t);
      if (running) raf = requestAnimationFrame(tick);
    }
    var api = {
      add: function(fn){ fns.push(fn); if (reduced) fn(0); return api; },
      destroy: function(){ running = false; cancelAnimationFrame(raf); if (io) io.disconnect(); }
    };
    if (!reduced && watchEl){
      io = new IntersectionObserver(function(es){
        running = es[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(tick);
      });
      io.observe(watchEl);
    }
    return api;
  }

  function initBreath(){
    var pearl = document.querySelector("[data-pearl]");
    var stage = document.querySelector(".stage");
    if (!pearl) return;
    var period = 4800;
    var osc = createOscillator(stage || pearl);
    osc.add(function(t){
      var s = Math.sin((t / period) * Math.PI * 2);
      var scale = (1.0075 + 0.0075 * s).toFixed(4);
      var bright = (1.04 + 0.04 * s).toFixed(3);
      var hue = (12 * s).toFixed(2);
      var rot = (6 * s).toFixed(2);
      pearl.style.setProperty("--bscale", scale);
      pearl.style.setProperty("--bbright", bright);
      pearl.style.setProperty("--bhue", hue + "deg");
      pearl.style.setProperty("--brot", rot + "deg");
    });
  }

  function initGrain(){
    var cv = document.querySelector(".pearl-grain");
    if (!cv) return;
    function paint(){
      var ctx = cv.getContext("2d");
      if (!ctx) return;
      var w = cv.width, h = cv.height, r = w / 2;
      ctx.clearRect(0, 0, w, h);
      var n = 520;
      for (var i = 0; i < n; i++){
        var a = Math.random() * Math.PI * 2;
        var rad = Math.sqrt(Math.random()) * r * 0.94;
        var x = r + Math.cos(a) * rad;
        var y = r + Math.sin(a) * rad;
        var alpha = Math.random() * 0.10;
        ctx.fillStyle = "rgba(255,253,246," + alpha.toFixed(3) + ")";
        ctx.fillRect(x, y, 1, 1);
      }
    }
    if (reduced){ paint(); return; }
    var started = false;
    var io = new IntersectionObserver(function(es){
      if (es[0].isIntersecting && !started){
        started = true;
        setTimeout(paint, 1500);
        io.disconnect();
      }
    });
    io.observe(cv);
  }

  function buildStrand(){
    var strand = document.querySelector("[data-strand]");
    if (!strand) return;
    var count = 47;
    var frag = document.createDocumentFragment();
    for (var i = 0; i < count; i++){
      var p = i / (count - 1);
      var ang = Math.PI * (0.08 + 0.84 * p);
      var cx = 50 + Math.cos(ang) * 40;
      var cy = 40 + Math.sin(ang) * 34;
      var mid = 1 - Math.abs(p - 0.5) * 2;
      var size = 18 + mid * 12;
      var bead = document.createElement("span");
      bead.className = "bead";
      bead.style.left = cx.toFixed(2) + "%";
      bead.style.top = cy.toFixed(2) + "%";
      bead.style.width = size.toFixed(1) + "px";
      bead.style.height = size.toFixed(1) + "px";
      frag.appendChild(bead);
    }
    strand.appendChild(frag);
  }

  function initScenes(){
    var stage = document.querySelector(".stage");
    var sections = document.querySelectorAll("section[data-scene]");
    var caption = document.querySelector("[data-stage-caption]");
    var word = document.querySelector("[data-scene-word]");
    if (!stage || !sections.length) return;
    var captions = { breath: "呼吸する、一粒。", core: "巻き ―― 千層の断面。", select: "選珠 ―― 一万から四十七へ。", strand: "一連 ―― 四十七粒。" };
    var words = { breath: "orient", core: "nacre", select: "select", strand: "strand" };
    var sceneClass = { breath: "scene-breath", core: "scene-core", select: "scene-select", strand: "scene-strand" };
    var ratios = {};
    function apply(scene){
      stage.classList.remove("scene-breath", "scene-core", "scene-select", "scene-strand");
      stage.classList.add(sceneClass[scene] || "scene-breath");
      if (caption) caption.textContent = captions[scene] || captions.breath;
      if (word) word.textContent = words[scene] || words.breath;
    }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        ratios[e.target.getAttribute("data-scene") + "|" + e.target.id] = e.isIntersecting ? e.intersectionRatio : 0;
      });
      var best = null, bestR = 0;
      var all = document.querySelectorAll("section[data-scene]");
      all.forEach(function(sec){
        var k = sec.getAttribute("data-scene") + "|" + sec.id;
        var r = ratios[k] || 0;
        if (r > bestR){ bestR = r; best = sec.getAttribute("data-scene"); }
      });
      if (best) apply(best);
    }, { threshold: [0.2, 0.5, 0.8], rootMargin: "-30% 0px -30% 0px" });
    sections.forEach(function(sec){ io.observe(sec); });
    apply("breath");
  }

  function initReveal(){
    var stagger = 0.14;
    var targets = document.querySelectorAll("[data-reveal]");
    targets.forEach(function(el){
      var kids = el.querySelectorAll("[data-reveal-child]");
      kids.forEach(function(k, i){ k.style.setProperty("--d", (i * stagger).toFixed(2) + "s"); });
    });
    if (reduced){
      targets.forEach(function(el){
        el.querySelectorAll("[data-reveal-child]").forEach(function(k){ k.classList.add("is-in"); });
      });
      return;
    }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        e.target.querySelectorAll("[data-reveal-child]").forEach(function(k){ k.classList.add("is-in"); });
        io.unobserve(e.target);
      });
    }, { threshold: 0.3 });
    targets.forEach(function(el){ io.observe(el); });
  }

  function initCountup(){
    var els = document.querySelectorAll("[data-count]");
    function fmt(v, d){ return v.toLocaleString("ja-JP", { minimumFractionDigits: d, maximumFractionDigits: d }); }
    function run(el){
      var to = parseFloat(el.getAttribute("data-count"));
      var dur = parseFloat(el.getAttribute("data-count-dur") || 1600);
      var dec = parseInt(el.getAttribute("data-count-dec") || 0, 10);
      var suf = el.getAttribute("data-count-suffix") || "";
      if (reduced){ el.textContent = fmt(to, dec) + suf; return; }
      var t0 = performance.now();
      (function step(now){
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = fmt(to * e, dec) + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (reduced){ els.forEach(run); return; }
    var io = new IntersectionObserver(function(es){
      es.forEach(function(e){
        if (!e.isIntersecting) return;
        run(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function(el){ io.observe(el); });
  }

  function initHush(){
    var hush = document.querySelector("[data-hush]");
    if (!hush) return;
    if (reduced){ hush.classList.add("is-in"); return; }
    var timer = 0;
    function arm(){
      clearTimeout(timer);
      hush.classList.remove("is-in");
      timer = setTimeout(function(){ hush.classList.add("is-in"); }, 2600);
    }
    window.addEventListener("scroll", arm, { passive: true });
    arm();
  }

  function boot(){
    initReveal();
    initCountup();
    buildStrand();
    initScenes();
    initHush();
    initBreath();
    initGrain();
  }

  if (document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
