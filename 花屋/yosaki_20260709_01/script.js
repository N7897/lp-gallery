(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var coarse = matchMedia("(hover: none)").matches;

  var hd = document.getElementById("hd");
  var stuck = false;
  addEventListener("scroll", function () {
    var s = scrollY > 24;
    if (s !== stuck) { hd.classList.toggle("is-stuck", s); stuck = s; }
  }, { passive: true });

  var revealTargets = document.querySelectorAll("[data-reveal]");
  revealTargets.forEach(function (el) {
    el.querySelectorAll("[data-reveal-child]").forEach(function (k, i) {
      k.style.setProperty("--d", (i * 0.1).toFixed(2) + "s");
    });
  });
  if (reduced) {
    revealTargets.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var rio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        rio.unobserve(e.target);
      });
    }, { threshold: 0.22 });
    revealTargets.forEach(function (el) { rio.observe(el); });
  }

  var counts = document.querySelectorAll("[data-count]");
  function runCount(el) {
    var to = parseFloat(el.dataset.count);
    if (reduced) { el.textContent = to.toLocaleString("ja-JP"); return; }
    var t0 = performance.now(), dur = 1200;
    (function step(now) {
      var p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(to * (1 - Math.pow(1 - p, 3))).toLocaleString("ja-JP");
      if (p < 1) requestAnimationFrame(step);
    })(t0);
  }
  if (reduced) { counts.forEach(runCount); }
  else {
    var cio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCount(e.target); cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counts.forEach(function (el) { cio.observe(el); });
  }

  var words = document.querySelectorAll(".bloom-word");
  if (!reduced && words.length) {
    var wio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-open");
        wio.unobserve(e.target);
      });
    }, { threshold: 0.7 });
    words.forEach(function (w) { wio.observe(w); });
  }

  if (coarse && !reduced) {
    var cards = document.querySelectorAll(".fcard");
    var lio = new IntersectionObserver(function (es) {
      es.forEach(function (e) { e.target.classList.toggle("is-lit", e.isIntersecting); });
    }, { threshold: 0.65 });
    cards.forEach(function (c) { lio.observe(c); });
  }

  var hero = document.querySelector(".hero");
  var bloom = document.getElementById("bloom");
  if (hero && bloom && !reduced) mountLantern();
  function mountLantern() {
    var tx = 62, ty = 45, cx = 62, cy = 45, px = null, py = null;
    var raf = 0, running = true, t0 = performance.now(), rect = null;
    function measure() { rect = bloom.getBoundingClientRect(); }
    addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true });
    addEventListener("resize", function () { rect = null; }, { passive: true });
    addEventListener("scroll", function () { rect = null; }, { passive: true });
    function tick(now) {
      if (!running) return;
      if (px !== null) {
        if (!rect) measure();
        var r = rect;
        tx = ((px - r.left) / r.width) * 100;
        ty = ((py - r.top) / r.height) * 100;
      } else {
        var t = (now - t0) / 1000;
        tx = 58 + Math.sin(t * 0.35) * 16;
        ty = 44 + Math.cos(t * 0.27) * 12;
      }
      cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
      bloom.style.setProperty("--mx", cx.toFixed(2) + "%");
      bloom.style.setProperty("--my", cy.toFixed(2) + "%");
      raf = requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (es) {
      running = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (running) raf = requestAnimationFrame(tick);
    });
    io.observe(hero);
    raf = requestAnimationFrame(tick);
  }

  var air = document.getElementById("air");
  if (air) {
    air.style.background = "radial-gradient(80% 90% at 70% 30%,#241631,#16101d)";
    var startAir = function () { setTimeout(mountAir, 1500); };
    if (document.readyState === "complete") startAir();
    else addEventListener("load", startAir, { once: true });
  }
  function mountAir() {
    var canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
    air.appendChild(canvas);
    var gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { air.style.background = "radial-gradient(80% 90% at 70% 30%,#241631,#16101d)"; canvas.remove(); return; }
    var vs = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;gl_Position=vec4(p,0.,1.);}";
    var fs = "precision mediump float;varying vec2 v;uniform float uT,uS,uG;uniform vec2 uR;uniform vec3 uA,uB,uC;" +
      "float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}" +
      "float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);" +
      "return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}" +
      "float fbm(vec2 p){float s=0.,a=.5;for(int i=0;i<3;i++){s+=a*n(p);p*=2.02;a*=.5;}return s;}" +
      "void main(){vec2 uv=v*vec2(uR.x/uR.y,1.)*uS;" +
      "float q=fbm(uv+uT*vec2(.05,.02));float w=fbm(uv+q*1.7+uT*vec2(-.02,.04));" +
      "vec3 col=mix(uA,uB,smoothstep(.22,.78,w));" +
      "col=mix(col,uC,pow(smoothstep(.6,.97,fbm(uv*1.6-uT*.03)),3.2)*.38);" +
      "col+=(h(v*uR+uT)-.5)*uG;gl_FragColor=vec4(col,1.);}";
    function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
    var prog = gl.createProgram();
    gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
    gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    var loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    function hex(c) {
      var s = c.slice(1);
      return [0, 2, 4].map(function (i) { return parseInt(s.slice(i, i + 2), 16) / 255; });
    }
    var U = function (n) { return gl.getUniformLocation(prog, n); };
    gl.uniform3fv(U("uA"), hex("#16101d"));
    gl.uniform3fv(U("uB"), hex("#2b1c3e"));
    gl.uniform3fv(U("uC"), hex("#ff87b3"));
    gl.uniform1f(U("uS"), 1.35);
    gl.uniform1f(U("uG"), 0.045);
    var uT = U("uT"), uR = U("uR");
    var raf = 0, running = true, t0 = performance.now();
    function resize() {
      canvas.width = Math.round(air.clientWidth * 0.5);
      canvas.height = Math.round(air.clientHeight * 0.5);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uR, canvas.width, canvas.height);
    }
    function draw(now) {
      gl.uniform1f(uT, ((now - t0) / 1000) * 0.42);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
    var last = 0;
    function loop(now) {
      if (!running) return;
      if (now - last > 33) { last = now; draw(now); }
      raf = requestAnimationFrame(loop);
    }
    resize();
    if (reduced) { draw(t0 + 9000); }
    else {
      var io = new IntersectionObserver(function (es) {
        running = es[0].isIntersecting;
        cancelAnimationFrame(raf);
        if (running) raf = requestAnimationFrame(loop);
      });
      io.observe(air);
    }
    addEventListener("resize", function () { resize(); if (reduced) draw(t0 + 9000); }, { passive: true });
    if (!reduced) raf = requestAnimationFrame(loop);
  }
})();
