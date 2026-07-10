(function(){
'use strict';
document.documentElement.classList.add('js');
if('scrollRestoration'in history)history.scrollRestoration='manual';
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---- splash: chase-ring 2秒1周 ---- */
(function splash(){
  if(reduced)return;
  var N=60,R=86,C=110;
  var ticks='';
  for(var i=0;i<N;i++){
    var a=(i/N)*Math.PI*2-Math.PI/2;
    var x1=C+Math.cos(a)*R,y1=C+Math.sin(a)*R;
    var x2=C+Math.cos(a)*(R+(i%5===0?14:8)),y2=C+Math.sin(a)*(R+(i%5===0?14:8));
    ticks+='<line class="sp-tick" x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';
  }
  var el=document.createElement('div');
  el.id='splash';
  el.setAttribute('aria-hidden','true');
  el.innerHTML='<svg viewBox="0 0 220 220">'+ticks+
    '<text class="sp-word" x="110" y="116" text-anchor="middle">WORCE</text></svg>';
  document.body.appendChild(el);
  var lines=el.querySelectorAll('.sp-tick');
  var t0=null,done=false;
  function finish(){
    if(done)return;done=true;
    el.classList.add('is-done');
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},700);
  }
  function step(t){
    if(done)return;
    if(t0===null)t0=t;
    var p=(t-t0)/2000;
    if(p>=1){for(var i=0;i<lines.length;i++)lines[i].classList.add('lit');finish();return;}
    var upto=Math.floor(p*60);
    for(var i=0;i<=upto&&i<60;i++)lines[i].classList.add('lit');
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  setTimeout(finish,3000);
})();

/* ---- live clocks: 実時刻・rAFスイープ / reducedは1秒刻み ---- */
(function clocks(){
  var lcTicks=document.querySelector('.lc-ticks');
  if(lcTicks){
    var s='';
    for(var i=0;i<12;i++){
      var a=(i/12)*Math.PI*2;
      var x1=24+Math.cos(a)*20,y1=24+Math.sin(a)*20;
      var x2=24+Math.cos(a)*22,y2=24+Math.sin(a)*22;
      s+='<line x1="'+x1.toFixed(1)+'" y1="'+y1.toFixed(1)+'" x2="'+x2.toFixed(1)+'" y2="'+y2.toFixed(1)+'"/>';
    }
    lcTicks.innerHTML=s;
  }
  var bcTicks=document.querySelector('.bc-ticks');
  if(bcTicks){
    var b='';
    for(var j=0;j<60;j++){
      var a2=(j/60)*Math.PI*2;
      var r1=j%5===0?168:178,r2=188;
      b+='<line x1="'+(200+Math.cos(a2)*r1).toFixed(1)+'" y1="'+(200+Math.sin(a2)*r1).toFixed(1)+
         '" x2="'+(200+Math.cos(a2)*r2).toFixed(1)+'" y2="'+(200+Math.sin(a2)*r2).toFixed(1)+'"/>';
    }
    bcTicks.innerHTML=b;
  }
  var hands=[
    {h:document.getElementById('lc-h'),m:document.getElementById('lc-m'),s:document.getElementById('lc-s'),cx:24,cy:24},
    {h:document.getElementById('bc-h'),m:document.getElementById('bc-m'),s:document.getElementById('bc-s'),cx:200,cy:200}
  ];
  var visible=[true,true];
  var big=document.getElementById('bigclock');
  if(big&&'IntersectionObserver'in window){
    new IntersectionObserver(function(es){visible[1]=es[0].isIntersecting;}).observe(big);
  }
  function setHands(now,sweep){
    var ms=sweep?now.getMilliseconds():0;
    var sec=now.getSeconds()+ms/1000;
    var min=now.getMinutes()+sec/60;
    var hr=(now.getHours()%12)+min/60;
    for(var i=0;i<hands.length;i++){
      if(!visible[i]||!hands[i].h)continue;
      hands[i].h.setAttribute('transform','rotate('+(hr*30)+' '+hands[i].cx+' '+hands[i].cy+')');
      hands[i].m.setAttribute('transform','rotate('+(min*6)+' '+hands[i].cx+' '+hands[i].cy+')');
      hands[i].s.setAttribute('transform','rotate('+(sec*6)+' '+hands[i].cx+' '+hands[i].cy+')');
    }
  }
  if(reduced){
    setHands(new Date(),false);
    setInterval(function(){setHands(new Date(),false);},1000);
  }else{
    (function loop(){setHands(new Date(),true);requestAnimationFrame(loop);})();
  }
})();

/* ---- hero: 全画面CMスライド(3秒放映)＋視差 ---- */
(function hero(){
  var wrap=document.getElementById('slides');
  if(!wrap)return;
  var hero=wrap.closest('.hero');
  var slides=[].slice.call(wrap.querySelectorAll('.slide'));
  var dots=document.getElementById('dots');
  var active=0,timer=null,resume=null;

  slides.forEach(function(sl,i){
    var b=document.createElement('button');
    b.type='button';
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected',i===0?'true':'false');
    b.setAttribute('aria-label',sl.querySelector('.slide__name').textContent+'を表示');
    b.addEventListener('click',function(){pause();setActive(i);});
    dots.appendChild(b);
  });
  var dotBtns=[].slice.call(dots.children);

  function setActive(i){
    i=(i+slides.length)%slides.length;
    active=i;
    slides.forEach(function(sl,k){sl.classList.toggle('is-active',k===i);});
    dotBtns.forEach(function(d,k){d.setAttribute('aria-selected',k===i?'true':'false');});
  }
  function play(){
    if(reduced||timer)return;
    timer=setInterval(function(){setActive(active+1);},3000);
  }
  function pause(){
    if(timer){clearInterval(timer);timer=null;}
    if(resume)clearTimeout(resume);
    resume=setTimeout(play,8000);
  }
  document.getElementById('prev').addEventListener('click',function(){pause();setActive(active-1);});
  document.getElementById('next').addEventListener('click',function(){pause();setActive(active+1);});
  hero.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){pause();setActive(active+1);}
    if(e.key==='ArrowLeft'){pause();setActive(active-1);}
  });
  var touchX=null;
  hero.addEventListener('touchstart',function(e){touchX=e.touches[0].clientX;},{passive:true});
  hero.addEventListener('touchend',function(e){
    if(touchX===null)return;
    var dx=e.changedTouches[0].clientX-touchX;
    if(Math.abs(dx)>48){pause();setActive(active+(dx<0?1:-1));}
    touchX=null;
  },{passive:true});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){if(timer){clearInterval(timer);timer=null;}}
    else play();
  });

  if(!reduced){
    var px=0,py=0,tx=0,ty=0,raf=null;
    hero.addEventListener('pointermove',function(e){
      tx=(e.clientX/window.innerWidth-.5)*2;
      ty=(e.clientY/window.innerHeight-.5)*2;
      if(!raf)raf=requestAnimationFrame(ease);
    });
    function ease(){
      raf=null;
      px+=(tx-px)*.08;py+=(ty-py)*.08;
      hero.style.setProperty('--px',px.toFixed(3));
      hero.style.setProperty('--py',py.toFixed(3));
      if(Math.abs(tx-px)>.002||Math.abs(ty-py)>.002)raf=requestAnimationFrame(ease);
    }
  }

  setActive(0);
  if('IntersectionObserver'in window){
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting)play();
      else if(timer){clearInterval(timer);timer=null;}
    },{threshold:.2}).observe(hero);
  }else{
    play();
  }
})();
})();
