(function () {
  "use strict";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  var hd = document.getElementById("hd");
  var lastStuck = false;
  addEventListener("scroll", function () {
    var s = scrollY > 24;
    if (s !== lastStuck) { hd.classList.toggle("is-stuck", s); lastStuck = s; }
  }, { passive: true });

  function initReveal() {
    var targets = document.querySelectorAll("[data-reveal]");
    targets.forEach(function (el) {
      el.querySelectorAll("[data-reveal-child]").forEach(function (k, i) {
        k.style.setProperty("--d", (i * 0.09).toFixed(2) + "s");
      });
    });
    if (reduced) {
      targets.forEach(function (el) { el.classList.add("is-in"); });
      return;
    }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        io.unobserve(e.target);
      });
    }, { threshold: 0.25 });
    targets.forEach(function (el) { io.observe(el); });
  }
  initReveal();

  function initCount() {
    var els = document.querySelectorAll("[data-count]");
    function run(el) {
      var to = parseFloat(el.dataset.count);
      var suf = el.dataset.countSuffix || "";
      if (reduced) { el.textContent = to.toLocaleString("ja-JP") + suf; return; }
      var t0 = performance.now(), dur = 1300;
      (function step(now) {
        var p = Math.min(1, (now - t0) / dur);
        var e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(to * e).toLocaleString("ja-JP") + suf;
        if (p < 1) requestAnimationFrame(step);
      })(t0);
    }
    if (reduced) { els.forEach(run); return; }
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        run(e.target); io.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    els.forEach(function (el) { io.observe(el); });
  }
  initCount();

  var stage = document.getElementById("stage");
  var heroImg = document.getElementById("heroImg");
  if (stage && heroImg && !reduced) mountInspection();
  if (stage && reduced) {
    document.querySelectorAll(".hero__measure .draw").forEach(function (p) { p.style.strokeDashoffset = 0; });
    document.querySelectorAll(".hero__measure text").forEach(function (t) { t.style.opacity = 1; });
  }

  function mountInspection() {
    var gl = null, canvas = null;
    canvas = document.createElement("canvas");
    canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
    stage.insertBefore(canvas, heroImg.nextSibling);
    gl = canvas.getContext("webgl", { antialias: false, alpha: false });
    if (!gl) { canvas.remove(); canvas = null; }

    var ready = 0, imgW = 1, imgH = 1, tex = {};
    if (gl) {
      var vs = "attribute vec2 p;varying vec2 v;void main(){v=p*.5+.5;v.y=1.-v.y;gl_Position=vec4(p,0.,1.);}";
      var fs = "precision mediump float;varying vec2 v;uniform sampler2D uI,uD;uniform vec2 uC,uO;" +
        "void main(){vec2 uv=(v-.5)*uC+.5;float d=texture2D(uD,uv).r;" +
        "vec2 q=clamp(uv+uO*(d-.45),0.002,0.998);gl_FragColor=texture2D(uI,q);}";
      function sh(t, s) { var o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); return o; }
      var prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, vs));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, fs));
      gl.linkProgram(prog); gl.useProgram(prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      var loc = gl.getAttribLocation(prog, "p");
      gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      var uC = gl.getUniformLocation(prog, "uC"), uO = gl.getUniformLocation(prog, "uO");
      gl.uniform1i(gl.getUniformLocation(prog, "uI"), 0);
      gl.uniform1i(gl.getUniformLocation(prog, "uD"), 1);
      function mkTex(unit) {
        var t = gl.createTexture();
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        return t;
      }
      tex.img = mkTex(0); tex.dep = mkTex(1);
      function upload(unit, t, image) {
        gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
      }
      function load(src, unit, t, first) {
        var i = new Image();
        i.onload = function () {
          if (first) { imgW = i.width; imgH = i.height; }
          upload(unit, t, i); ready++;
          if (ready === 2) { resize(); heroImg.style.visibility = "hidden"; }
        };
        i.src = src;
      }
      load("img/hero.webp", 0, tex.img, true);
      load("img/hero_depth.png", 1, tex.dep, false);
      function resize() {
        var dpr = Math.min(devicePixelRatio || 1, 2);
        canvas.width = stage.clientWidth * dpr; canvas.height = stage.clientHeight * dpr;
        gl.viewport(0, 0, canvas.width, canvas.height);
        var ca = stage.clientWidth / stage.clientHeight, ia = imgW / imgH;
        gl.uniform2f(uC, ca > ia ? 1 : ca / ia, ca > ia ? ia / ca : 1);
      }
      addEventListener("resize", resize, { passive: true });
    }

    var paths = document.querySelectorAll(".hero__measure .draw:not(.static)");
    var labels = {
      t1: document.querySelector(".hero__measure .t1"),
      t2: document.querySelector(".hero__measure .t2"),
      t4: document.querySelector(".hero__measure .t4")
    };
    var bands = { d1: [0.06, 0.3], d2: [0.18, 0.42], d4: [0.4, 0.68] };
    var labelAt = { t1: "d1", t2: "d2", t4: "d4" };

    var tx = 0, ty = 0, cx = 0, cy = 0, ip = 0, raf = 0, visible = true, t0 = performance.now();
    var px = null, py = null;
    addEventListener("pointermove", function (e) {
      px = e.clientX; py = e.clientY;
    }, { passive: true });

    function seg(p, a, b) { return Math.min(1, Math.max(0, (p - a) / (b - a))); }
    function tick(now) {
      if (!visible) return;
      if (px !== null) {
        var r = stage.getBoundingClientRect();
        tx = ((px - r.left) / r.width - 0.5) * 2;
        ty = ((py - r.top) / r.height - 0.5) * 2;
      }
      var target = Math.min(1, Math.max(0, scrollY / (innerHeight * 0.85)));
      ip += (target - ip) * 0.09;
      cx += (tx - cx) * 0.045; cy += (ty - cy) * 0.045;
      var t = (now - t0) / 1000;
      var dx = cx + Math.sin(t * 0.32) * 0.16;
      var dy = cy + Math.cos(t * 0.24) * 0.12;
      if (gl && ready === 2) {
        gl.uniform2f(uO, dx * 0.04, dy * 0.028);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      stage.style.setProperty("--lx", (34 + ip * 38 + dx * 5).toFixed(2) + "%");
      stage.style.setProperty("--ly", (44 + dy * 6).toFixed(2) + "%");
      paths.forEach(function (p) {
        var band = p.classList.contains("d1") ? "d1" : p.classList.contains("d2") ? "d2" : "d4";
        p.style.strokeDashoffset = 1 - seg(ip, bands[band][0], bands[band][1]);
      });
      for (var k in labels) {
        if (!labels[k]) continue;
        var b = bands[labelAt[k]];
        labels[k].style.opacity = seg(ip, b[1] - 0.06, b[1] + 0.08).toFixed(2);
      }
      raf = requestAnimationFrame(tick);
    }
    var io = new IntersectionObserver(function (es) {
      visible = es[0].isIntersecting;
      cancelAnimationFrame(raf);
      if (visible) raf = requestAnimationFrame(tick);
    });
    io.observe(stage);
    raf = requestAnimationFrame(tick);
  }
})();
