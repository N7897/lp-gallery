(function () {
  "use strict";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var SVGNS = "http://www.w3.org/2000/svg";

  /* ---------- Header solid on scroll ---------- */
  var head = document.getElementById("siteHead");
  function onHeadScroll() {
    if (head) head.classList.toggle("is-solid", window.scrollY > 40);
  }
  onHeadScroll();
  window.addEventListener("scroll", onHeadScroll, { passive: true });

  /* ---------- Tap list data ---------- */
  var beers = [
    { name: "灯火", en: "HEARTH", style: "Amber Ale", abv: "5.4", ibu: "28",
      desc: "キャラメル麦芽の甘い余韻。最初の一杯に。", color: "#E0812A", fill: "24%" },
    { name: "鉄泡", en: "IRONFOAM", style: "Dry Stout", abv: "4.8", ibu: "42",
      desc: "焙煎麦とビターチョコ。泡まで黒い。", color: "#2A1B12", fill: "12%" },
    { name: "麦音", en: "BARLEY HUM", style: "Pilsner", abv: "4.9", ibu: "32",
      desc: "淡色麦芽と、すっと切れる苦味。", color: "#E7B84A", fill: "30%" },
    { name: "夏至", en: "SOLSTICE", style: "Hazy IPA", abv: "6.2", ibu: "55",
      desc: "南国ホップの霞。香りで飲ませる。", color: "#E89234", fill: "20%" },
    { name: "野の実", en: "WILD BERRY", style: "Fruit Sour", abv: "4.2", ibu: "8",
      desc: "地の果実の酸。夜のはじまりに。", color: "#B23A4E", fill: "26%" },
    { name: "黒鉄", en: "KUROGANE", style: "Imperial Stout", abv: "9.0", ibu: "60",
      desc: "樽で熟した、いちばん深い夜。", color: "#1C120C", fill: "10%" }
  ];
  var list = document.querySelector(".tap__list");
  if (list) {
    beers.forEach(function (b, idx) {
      var cid = "ci" + idx;
      var li = document.createElement("li");
      li.className = "beer reveal";
      li.style.setProperty("--beer-c", b.color);
      li.innerHTML =
        '<div class="beer__top">' +
          '<span class="beer__style">' + b.style + '</span>' +
          '<span class="beer__glassicon" aria-hidden="true">' +
            '<svg viewBox="0 0 28 40">' +
              '<clipPath id="' + cid + '"><path d="M5 3h18l-1.5 30a3 3 0 0 1-3 2.7H9.5a3 3 0 0 1-3-2.7L5 3Z"/></clipPath>' +
              '<g clip-path="url(#' + cid + ')">' +
                '<rect class="beer__gfill" x="3" y="0" width="22" height="40" fill="' + b.color + '" style="--fill:' + b.fill + '"/>' +
              '</g>' +
              '<path class="beer__gout" d="M5 3h18l-1.5 30a3 3 0 0 1-3 2.7H9.5a3 3 0 0 1-3-2.7L5 3Z"/>' +
            '</svg>' +
          '</span>' +
        '</div>' +
        '<h3 class="beer__name">' + b.name + '<b>' + b.en + '</b></h3>' +
        '<p class="beer__desc">' + b.desc + '</p>' +
        '<div class="beer__nums">' +
          '<span><b>' + b.abv + '%</b><span>ABV 度数</span></span>' +
          '<span><b>' + b.ibu + '</b><span>IBU 苦味</span></span>' +
        '</div>' +
        '<span class="beer__bar" aria-hidden="true"></span>';
      list.appendChild(li);
    });
  }

  /* ---------- Reveal on scroll ---------- */
  var revs = document.querySelectorAll(".reveal, .story, .brew__step");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          if (e.target.hasAttribute("data-count") === false &&
              e.target.querySelector) {
            var nums = e.target.querySelectorAll("[data-count]");
            nums.forEach(startCount);
          }
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    revs.forEach(function (el) { io.observe(el); });
  } else {
    revs.forEach(function (el) { el.classList.add("in"); });
    document.querySelectorAll("[data-count]").forEach(function (n) {
      n.textContent = (n.getAttribute("data-text") || n.getAttribute("data-count")) +
        (n.getAttribute("data-suffix") || "");
    });
  }

  /* ---------- Number count up ---------- */
  function startCount(el) {
    if (el.dataset.done) return;
    el.dataset.done = "1";
    var txt = el.getAttribute("data-text");
    if (txt !== null) { el.textContent = txt; return; }
    var target = parseFloat(el.getAttribute("data-count"));
    var suffix = el.getAttribute("data-suffix") || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var dur = 1100, t0 = performance.now();
    function tick(now) {
      var p = Math.min(1, (now - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suffix;
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ---------- HERO : glass fill + foam + bubbles ---------- */
  var hero = document.getElementById("hero");
  var beerFill = document.getElementById("beerFill");
  var foam = document.getElementById("foam");
  var pour = document.getElementById("pour");
  var hint = document.getElementById("scrubHint");
  var bubbleLayer = document.getElementById("bubbleLayer");

  var TOP_Y = 118, BOT_Y = 352;      // liquid surface travel (svg units)
  var bubbles = [];

  if (bubbleLayer) {
    for (var i = 0; i < 26; i++) {
      var c = document.createElementNS(SVGNS, "circle");
      var r = 1.2 + Math.random() * 2.6;
      c.setAttribute("r", r.toFixed(1));
      bubbleLayer.appendChild(c);
      bubbles.push({
        el: c,
        x: 66 + Math.random() * 108,
        y: BOT_Y - Math.random() * 40,
        r: r,
        sp: 0.35 + Math.random() * 0.9,
        drift: (Math.random() - 0.5) * 0.25,
        ph: Math.random() * 6.28
      });
    }
  }

  function setFill(p) {
    var surf = BOT_Y - (BOT_Y - TOP_Y) * p;
    if (beerFill) { beerFill.setAttribute("y", surf); beerFill.setAttribute("height", 420); }
    if (foam) {
      foam.setAttribute("transform", "translate(0," + (surf - 120) + ")");
      foam.setAttribute("opacity", Math.max(0, Math.min(1, (p - 0.06) / 0.16)).toFixed(3));
    }
    if (pour) {
      var pouring = p > 0.02 && p < 0.985;
      pour.style.opacity = pouring ? "0.9" : "0";
      pour.style.transform = "translateX(-50%) scaleY(" + (pouring ? 1 : 0) + ")";
    }
    return surf;
  }

  var curSurf = BOT_Y, tPour = 0;
  function heroProgress() {
    if (!hero) return 0;
    var rect = hero.getBoundingClientRect();
    var total = hero.offsetHeight - window.innerHeight;
    var p = total > 0 ? (-rect.top) / total : 0;
    return Math.max(0, Math.min(1, p));
  }

  if (reduce) {
    setFill(0.9);
    bubbles.forEach(function (b) { b.el.setAttribute("cx", b.x); b.el.setAttribute("cy", (TOP_Y + BOT_Y) / 2); });
  } else {
    var raf = null;
    function frame(now) {
      var p = heroProgress();
      curSurf = setFill(p);
      if (hint) hint.style.opacity = p > 0.06 ? "0" : "1";
      tPour = now * 0.001;
      // bubbles only within liquid
      for (var k = 0; k < bubbles.length; k++) {
        var b = bubbles[k];
        if (p > 0.05) {
          b.y -= b.sp * (0.6 + p * 0.8);
          b.x += Math.sin(tPour * 1.2 + b.ph) * b.drift;
          if (b.y <= curSurf + b.r + 2) {
            b.y = BOT_Y - 4 - Math.random() * 10;
            b.x = 66 + Math.random() * 108;
          }
          var vis = b.y < BOT_Y && b.y > curSurf;
          b.el.setAttribute("cx", b.x.toFixed(1));
          b.el.setAttribute("cy", b.y.toFixed(1));
          b.el.setAttribute("opacity", vis ? (0.28 + b.r * 0.14).toFixed(2) : "0");
        } else {
          b.el.setAttribute("opacity", "0");
        }
      }
      raf = requestAnimationFrame(frame);
    }
    // Only animate while hero is in/near viewport (battery/GPU saving)
    var heroVisible = true;
    if ("IntersectionObserver" in window && hero) {
      new IntersectionObserver(function (ents) {
        heroVisible = ents[0].isIntersecting;
        if (heroVisible && !raf) raf = requestAnimationFrame(frame);
        if (!heroVisible && raf) { cancelAnimationFrame(raf); raf = null; }
      }, { rootMargin: "20% 0px 20% 0px" }).observe(hero);
    }
    setFill(0);
    raf = requestAnimationFrame(frame);
  }

  /* ---------- Smooth-scroll offset for fixed header ---------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (ev) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var t = document.querySelector(id);
      if (!t) return;
      ev.preventDefault();
      var y = t.getBoundingClientRect().top + window.scrollY - 64;
      window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
    });
  });
})();
