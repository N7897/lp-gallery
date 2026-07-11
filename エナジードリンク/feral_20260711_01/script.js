(function(){
'use strict';
document.documentElement.classList.add('js');
if('scrollRestoration'in history)history.scrollRestoration='manual';
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* フレーバーごとの色・缶意匠 */
var THEMES=[
  {name:'HALO',accent:'#ff4d5e',deep:'#b3202f'},
  {name:'FIEND',accent:'#3fbf5a',deep:'#1f7d38'},
  {name:'BOLT',accent:'#5a86ff',deep:'#2447b0'}
];

/* ---- splash ---- */
(function splash(){
  if(reduced)return;
  var el=document.createElement('div');
  el.id='splash';el.setAttribute('aria-hidden','true');
  var frags='';
  for(var i=0;i<14;i++){
    var a=(i/14)*Math.PI*2;
    frags+='<line x1="'+(250+Math.cos(a)*70).toFixed(0)+'" y1="'+(250+Math.sin(a)*70).toFixed(0)+'" x2="'+(250+Math.cos(a)*240).toFixed(0)+'" y2="'+(250+Math.sin(a)*240).toFixed(0)+'"/>';
  }
  el.innerHTML='<div class="sp-box">'+
    '<svg class="sp-fx" viewBox="0 0 500 500"><circle cx="250" cy="250" r="180"/>'+frags+'</svg>'+
    '<span class="sp-word">FARAL</span>'+
    '<span class="sp-sub">WILD SINCE MIDNIGHT</span></div>';
  document.body.appendChild(el);
  var done=false;
  function finish(){if(done)return;done=true;el.classList.add('is-done');setTimeout(function(){el.remove();},550);}
  setTimeout(finish,1700);
  setTimeout(finish,3000);
})();

/* ---- hero reel: 全画面フレーバー切替(3秒/スクロール/スワイプ/キー) ---- */
(function reel(){
  var reelEl=document.getElementById('flavors');
  var stage=document.getElementById('stage');
  if(!stage)return;
  var flavors=[].slice.call(stage.querySelectorAll('.flavor'));
  var dots=document.getElementById('dots');
  var root=document.documentElement;
  var active=0,timer=null,resume=null,locked=false;

  flavors.forEach(function(fl,i){
    var b=document.createElement('button');
    b.type='button';b.setAttribute('role','tab');
    b.setAttribute('aria-selected',i===0?'true':'false');
    b.setAttribute('aria-label',THEMES[i].name+'を表示');
    b.addEventListener('click',function(){pause();go(i);});
    dots.appendChild(b);
  });
  var dotBtns=[].slice.call(dots.children);

  function applyTheme(i){
    var t=THEMES[i];
    root.style.setProperty('--accent',t.accent);
    root.style.setProperty('--accent-deep',t.deep);
  }
  function go(i){
    i=(i+flavors.length)%flavors.length;
    if(i===active)return;
    active=i;
    flavors.forEach(function(fl,k){fl.classList.toggle('is-active',k===i);});
    dotBtns.forEach(function(d,k){d.setAttribute('aria-selected',k===i?'true':'false');});
    applyTheme(i);
  }
  function play(){if(reduced||timer)return;timer=setInterval(function(){go(active+1);},3000);}
  function pause(){
    if(timer){clearInterval(timer);timer=null;}
    if(resume)clearTimeout(resume);
    resume=setTimeout(play,9000);
  }

  document.getElementById('prev').addEventListener('click',function(){pause();go(active-1);});
  document.getElementById('next').addEventListener('click',function(){pause();go(active+1);});
  reelEl.setAttribute('tabindex','0');
  reelEl.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'||e.key==='ArrowDown'){e.preventDefault();pause();go(active+1);}
    if(e.key==='ArrowLeft'||e.key==='ArrowUp'){e.preventDefault();pause();go(active-1);}
  });

  /* 横方向のホイール/トラックパッドのみでフレーバー送り。縦スクロールは素通し(ページ送りを妨げない) */
  reelEl.addEventListener('wheel',function(e){
    if(locked)return;
    if(Math.abs(e.deltaX)<=Math.abs(e.deltaY))return;
    var right=e.deltaX>0;
    if(right&&active<flavors.length-1){e.preventDefault();pause();go(active+1);lockScroll();}
    else if(!right&&active>0){e.preventDefault();pause();go(active-1);lockScroll();}
  },{passive:false});
  function lockScroll(){locked=true;setTimeout(function(){locked=false;},760);}

  var tX=null;
  reelEl.addEventListener('touchstart',function(e){tX=e.touches[0].clientX;},{passive:true});
  reelEl.addEventListener('touchend',function(e){
    if(tX===null)return;
    var dx=e.changedTouches[0].clientX-tX;
    if(Math.abs(dx)>44){pause();go(active+(dx<0?1:-1));}
    tX=null;
  },{passive:true});

  document.addEventListener('visibilitychange',function(){
    if(document.hidden){if(timer){clearInterval(timer);timer=null;}}else play();
  });

  applyTheme(0);
  if('IntersectionObserver'in window){
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting)play();
      else if(timer){clearInterval(timer);timer=null;}
    },{threshold:.3}).observe(reelEl);
  }else play();
})();

/* ---- lab: mono数値カウントアップ ---- */
(function count(){
  var nums=[].slice.call(document.querySelectorAll('.lab__num'));
  if(!nums.length)return;
  function run(el){
    var target=+el.getAttribute('data-count');
    if(reduced||target===0){el.textContent=target;return;}
    var t0=null;
    function step(t){
      if(t0===null)t0=t;
      var p=Math.min((t-t0)/900,1);
      el.textContent=Math.round(target*(1-Math.pow(1-p,3)));
      if(p<1)requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  if('IntersectionObserver'in window){
    var io=new IntersectionObserver(function(es){
      es.forEach(function(e){if(e.isIntersecting){run(e.target);io.unobserve(e.target);}});
    },{threshold:.6});
    nums.forEach(function(n){io.observe(n);});
  }else nums.forEach(run);
})();

/* ---- HUD: 雰囲気メーターの数値をゆらす(演出。成分表とは別) ---- */
(function hud(){
  var vals=[].slice.call(document.querySelectorAll('.hud-val'));
  if(!vals.length||reduced)return;
  setInterval(function(){
    vals.forEach(function(el){
      var base=+el.getAttribute('data-hud');
      var v=Math.max(40,Math.min(99,base+Math.round((Math.random()-.5)*8)));
      el.textContent=v;
      var bar=el.parentNode.querySelector('.hud-bar i');
      if(bar)bar.style.setProperty('--v',v+'%');
    });
  },900);
})();

})();