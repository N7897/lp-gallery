/* ============================================================
   間 ma — interactions
   主役: 呼吸リング（吸う4s / 吐く4s）＋ヒーローのcue同期
   支援: 背骨スクロールドロー / セクション見出し語同期 / reveal
   ============================================================ */
(function(){
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---------- 呼吸サイクル（全breath要素を同期） ---------- */
  var breaths = Array.prototype.slice.call(document.querySelectorAll('[data-breath]'));
  var miniBreaths = Array.prototype.slice.call(document.querySelectorAll('[data-minibreath]'));
  var cues = Array.prototype.slice.call(document.querySelectorAll('[data-cue]'));
  var PHASES = ['吸って','ととのえる','吐いて','ゆるめる']; // 4段の間
  var phase = 0;
  var STEP = 4000; // 4秒/フェーズ

  function applyBreath(){
    var inhaling = (phase === 0 || phase === 1); // 吸う〜保つで拡張
    breaths.forEach(function(b){
      b.classList.toggle('inhale', inhaling);
      b.classList.toggle('exhale', !inhaling);
    });
    miniBreaths.forEach(function(b){
      b.classList.toggle('inhale', inhaling);
    });
    cues.forEach(function(c){
      c.style.opacity = '0';
      setTimeout(function(){ c.textContent = PHASES[phase]; c.style.opacity = '1'; }, 400);
    });
  }
  if(!reduce){
    applyBreath();
    setInterval(function(){ phase = (phase + 1) % PHASES.length; applyBreath(); }, STEP);
  } else {
    cues.forEach(function(c){ c.textContent = '呼吸を、ひとつずつ。'; });
  }

  /* ---------- NAV: scrolled state ---------- */
  var nav = document.getElementById('nav');
  var onScrollNav = function(){ nav.classList.toggle('scrolled', window.scrollY > 24); };
  onScrollNav();
  window.addEventListener('scroll', onScrollNav, {passive:true});

  /* ---------- burger ---------- */
  var burger = document.getElementById('burger');
  var links = document.querySelector('.nav__links');
  if(burger && links){
    burger.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      burger.setAttribute('aria-label', open ? 'メニューを閉じる' : 'メニューを開く');
    });
    links.querySelectorAll('a').forEach(function(a){
      a.addEventListener('click', function(){
        links.classList.remove('open');
        burger.setAttribute('aria-expanded','false');
      });
    });
  }

  /* ---------- reveal on view ---------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  if('IntersectionObserver' in window && !reduce){
    var ro = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){ e.target.classList.add('in'); ro.unobserve(e.target); }
      });
    }, {threshold:.16, rootMargin:'0px 0px -8% 0px'});
    reveals.forEach(function(el, i){
      // group-stagger: same parent siblings get d1/d2
      if(el.classList.contains('mcard') || el.classList.contains('tcard') || el.classList.contains('pcard')){
        var idx = Array.prototype.indexOf.call(el.parentNode.children, el);
        if(idx % 3 === 1) el.classList.add('d1'); else if(idx % 3 === 2) el.classList.add('d2');
      }
      ro.observe(el);
    });
  } else {
    reveals.forEach(function(el){ el.classList.add('in'); });
  }

  /* ---------- flow node activation ---------- */
  var flowItems = document.querySelectorAll('.flow__list li');
  if('IntersectionObserver' in window && !reduce){
    var fo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting) e.target.classList.add('in'); });
    }, {threshold:.5});
    flowItems.forEach(function(li){ fo.observe(li); });
  } else {
    flowItems.forEach(function(li){ li.classList.add('in'); });
  }

  /* ---------- 背骨スクロールドロー + セクションラベル同期 ---------- */
  var draw = document.querySelector('.spine__draw');
  var spineLabel = document.getElementById('spineLabel');
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-section]'));
  var LEN = 1000;
  var ticking = false;

  function updateSpine(){
    ticking = false;
    var doc = document.documentElement;
    var scrollable = (doc.scrollHeight - window.innerHeight) || 1;
    var p = Math.min(1, Math.max(0, window.scrollY / scrollable));
    if(draw) draw.style.strokeDashoffset = String(LEN * (1 - p));

    // current section label
    if(spineLabel && sections.length){
      var mid = window.scrollY + window.innerHeight * 0.4;
      var current = null;
      sections.forEach(function(s){
        if(s.offsetTop <= mid) current = s;
      });
      var label = current ? current.getAttribute('data-label') : '01 呼吸';
      if(spineLabel.textContent !== label) spineLabel.textContent = label;
    }
  }
  function requestSpine(){ if(!ticking){ ticking = true; requestAnimationFrame(updateSpine); } }
  if(draw && !reduce){
    updateSpine();
    window.addEventListener('scroll', requestSpine, {passive:true});
    window.addEventListener('resize', requestSpine);
  } else if(draw){
    draw.style.strokeDashoffset = '0';
  }

  /* ---------- method note micro-copy (右へ進むたび) ---------- */
  var note = document.querySelector('[data-methodnote]');
  var mcards = document.querySelectorAll('.mcard');
  if(note && mcards.length && 'IntersectionObserver' in window && !reduce){
    var seen = 0;
    var mo = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          seen = Math.max(seen, +e.target.getAttribute('data-method'));
          note.textContent = seen >= 3 ? '三つ、すべてに立ち返れました。' : ('立ち返る場所 ' + seen + ' / 3');
        }
      });
    }, {threshold:.6});
    mcards.forEach(function(c){ mo.observe(c); });
  }

  /* ---------- 巨大背景語の緩やかパララックス ---------- */
  var parallax = document.querySelector('[data-parallax]');
  if(parallax && !reduce){
    var pTick = false;
    window.addEventListener('scroll', function(){
      if(pTick) return; pTick = true;
      requestAnimationFrame(function(){
        var r = parallax.getBoundingClientRect();
        var offset = (r.top + r.height/2 - window.innerHeight/2) * -0.06;
        parallax.style.transform = 'translateY(calc(-50% + ' + offset.toFixed(1) + 'px))';
        pTick = false;
      });
    }, {passive:true});
  }
})();
