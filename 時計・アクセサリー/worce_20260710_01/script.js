(function(){
'use strict';
if('scrollRestoration'in history)history.scrollRestoration='manual';
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;

var THEMES=[
  {accent:'#0e7c86',deep:'#095e66',img:'img/dive-1200.webp'},
  {accent:'#b08d43',deep:'#75591f',img:'img/dress-1200.webp'},
  {accent:'#c62f2f',deep:'#96201f',img:'img/chrono-1200.webp'},
  {accent:'#2f5fa8',deep:'#234880',img:'img/pilot-1200.webp'},
  {accent:'#55555c',deep:'#3c3c42',img:'img/minimal-1200.webp'}
];

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
    setTimeout(function(){if(el.parentNode)el.parentNode.removeChild(el);},600);
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

/* ---- carousel: 3秒CM回転＋手動＋テーマ切替 ---- */
(function carousel(){
  var track=document.getElementById('track');
  if(!track)return;
  var cards=[].slice.call(track.querySelectorAll('.card'));
  var dots=document.getElementById('dots');
  var root=document.documentElement;
  var bgA=document.querySelector('.bg__a'),bgB=document.querySelector('.bg__b');
  var bgFlip=false;
  var active=-1,timer=null,resume=null;

  cards.forEach(function(c,i){
    var b=document.createElement('button');
    b.type='button';
    b.setAttribute('role','tab');
    b.setAttribute('aria-selected',i===0?'true':'false');
    b.setAttribute('aria-label',c.querySelector('.card__name').textContent+'を表示');
    b.addEventListener('click',function(){pause();go(i);});
    dots.appendChild(b);
  });
  var dotBtns=[].slice.call(dots.children);

  function applyTheme(i){
    var t=THEMES[i];
    root.style.setProperty('--accent',t.accent);
    root.style.setProperty('--accent-deep',t.deep);
    var incoming=bgFlip?bgA:bgB,outgoing=bgFlip?bgB:bgA;
    incoming.style.backgroundImage='url('+t.img+')';
    incoming.classList.add('is-on');
    outgoing.classList.remove('is-on');
    bgFlip=!bgFlip;
  }
  function setActive(i){
    if(i===active)return;
    active=i;
    cards.forEach(function(c,k){c.classList.toggle('is-active',k===i);});
    dotBtns.forEach(function(d,k){d.setAttribute('aria-selected',k===i?'true':'false');});
    applyTheme(i);
  }
  function go(i){
    i=(i+cards.length)%cards.length;
    var c=cards[i];
    track.scrollTo({left:c.offsetLeft-(track.clientWidth-c.offsetWidth)/2,behavior:reduced?'auto':'smooth'});
  }
  var scrollT=null;
  track.addEventListener('scroll',function(){
    if(scrollT)clearTimeout(scrollT);
    scrollT=setTimeout(function(){
      var center=track.scrollLeft+track.clientWidth/2;
      var best=0,bd=1e9;
      cards.forEach(function(c,k){
        var d=Math.abs(c.offsetLeft+c.offsetWidth/2-center);
        if(d<bd){bd=d;best=k;}
      });
      setActive(best);
    },80);
  },{passive:true});

  function play(){
    if(reduced||timer)return;
    timer=setInterval(function(){go(active+1);},3000);
  }
  function pause(){
    if(timer){clearInterval(timer);timer=null;}
    if(resume)clearTimeout(resume);
    resume=setTimeout(play,8000);
  }
  ['pointerdown','wheel','touchstart'].forEach(function(ev){
    track.addEventListener(ev,pause,{passive:true});
  });
  track.addEventListener('keydown',function(e){
    if(e.key==='ArrowRight'){e.preventDefault();pause();go(active+1);}
    if(e.key==='ArrowLeft'){e.preventDefault();pause();go(active-1);}
  });
  document.getElementById('prev').addEventListener('click',function(){pause();go(active-1);});
  document.getElementById('next').addEventListener('click',function(){pause();go(active+1);});
  document.addEventListener('visibilitychange',function(){
    if(document.hidden){if(timer){clearInterval(timer);timer=null;}}
    else play();
  });

  var dragging=false,dragX=0,dragL=0;
  track.addEventListener('pointerdown',function(e){
    if(e.pointerType!=='mouse')return;
    dragging=true;dragX=e.clientX;dragL=track.scrollLeft;
  });
  window.addEventListener('pointermove',function(e){
    if(!dragging)return;
    track.scrollLeft=dragL-(e.clientX-dragX);
  });
  window.addEventListener('pointerup',function(){dragging=false;});

  track.scrollLeft=0;
  setActive(0);
  if('IntersectionObserver'in window){
    new IntersectionObserver(function(es){
      if(es[0].isIntersecting)play();
      else if(timer){clearInterval(timer);timer=null;}
    },{threshold:.2}).observe(track);
  }else{
    play();
  }
})();
})();
