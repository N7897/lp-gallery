(function(){
'use strict';
document.documentElement.classList.add('js');
if('scrollRestoration'in history)history.scrollRestoration='manual';
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* フレーバーごとの色・缶意匠 */
var THEMES=[
  {name:'ORBIT',accent:'#6ea8ff',deep:'#6ea8ff'},
  {name:'GLITCH',accent:'#ff4fa8',deep:'#ff4fa8'},
  {name:'VINE',accent:'#b98bff',deep:'#b98bff'}
];

/* ---- splash ---- */
(function splash(){
  if(reduced)return;
  var el=document.createElement('div');
  el.id='splash';el.setAttribute('aria-hidden','true');
  el.innerHTML='<div class="sp-word">FERAL<span class="sp-bar"></span></div>';
  document.body.appendChild(el);
  var bar=el.querySelector('.sp-bar');
  var t0=null,done=false;
  function finish(){if(done)return;done=true;el.classList.add('is-done');setTimeout(function(){el.remove();},600);}
  function step(t){
    if(done)return;
    if(t0===null)t0=t;
    var p=Math.min((t-t0)/1400,1);
    bar.style.width=(p*100)+'%';
    if(p>=1){finish();return;}
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
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

  /* ホイール/タッチでフレーバー送り。端では通常スクロールへ解放 */
  function inHero(){var r=reelEl.getBoundingClientRect();return r.top<=1&&r.bottom>=window.innerHeight-1;}
  reelEl.addEventListener('wheel',function(e){
    if(!inHero()||locked)return;
    var down=e.deltaY>0;
    if(down&&active<flavors.length-1){e.preventDefault();pause();go(active+1);lockScroll();}
    else if(!down&&active>0){e.preventDefault();pause();go(active-1);lockScroll();}
  },{passive:false});
  function lockScroll(){locked=true;setTimeout(function(){locked=false;},760);}

  var tY=null;
  reelEl.addEventListener('touchstart',function(e){tY=e.touches[0].clientY;},{passive:true});
  reelEl.addEventListener('touchend',function(e){
    if(tY===null)return;
    var dy=e.changedTouches[0].clientY-tY;
    if(Math.abs(dy)>44){pause();go(active+(dy<0?1:-1));}
    tY=null;
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
})();
