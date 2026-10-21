/* PIXEL ARCADE · The console on the front page: a tray of cartridges, a screen in attract mode with a round clock,
   and a slot. Drag a cartridge in (or tap it, or pick it with the arrows and press Enter) and the screen powers off,
   counts down and boots the game. Uses A.shelf from js/lobby.js and A.preview from the engine. */
(function(){
'use strict';
if(typeof document==='undefined'||!window.A)return;
const A=window.A,$=id=>document.getElementById(id);
const DEMO=20,TRAY=6;       // seconds each attract demo runs; cartridges on the counter

addEventListener('arcade-ready',()=>{
 const S=A.shelf,E=A._e,tc=E.tc,con=$('console'),carts=$('carts'),cv=$('cdemo'),scr=$('cscreen'),osd=$('cosd'),clock=$('cclock'),cname=$('cname');
 if(!con||!carts||!S)return;
 const RM=S.RM,x=cv.getContext('2d');
 let tray=[],cur=0,left=DEMO,stop=null,busy=false,seen=true,last=performance.now();

 /* the tray */
 function deal(){
  const pool=A.games.filter(g=>!g.href&&!g.typing),out=[];
  while(out.length<TRAY&&out.length<pool.length){const g=pool[Math.random()*pool.length|0];if(!out.includes(g))out.push(g);}
  tray=out;carts.innerHTML='';
  tray.forEach((gm,i)=>{
   const b=document.createElement('button');b.type='button';b.className='cart';b.setAttribute('role','option');b.dataset.cid=gm.id;b.tabIndex=-1;
   b.setAttribute('aria-label',tc(gm.name)+', '+S.fmt(A.limitOf(gm))+' round');
   b.innerHTML='<span class="lbl"></span><b></b><small></small>';b.querySelector('b').textContent=tc(gm.name);b.querySelector('small').textContent=S.fmt(A.limitOf(gm));
   S.art(gm,b.querySelector('.lbl'));drag(b,gm);b.onfocus=()=>{if(cur!==i)tune(i);};carts.appendChild(b);
  });
  tune(0,true);
 }
 const cartEls=()=>[...carts.children];
 function mark(){cartEls().forEach((b,i)=>{b.setAttribute('aria-selected',i===cur);b.tabIndex=i===cur?0:-1;});}

 /* the screen: attract mode on one cartridge at a time */
 function setClock(s){clock.textContent=S.fmt(Math.max(0,Math.ceil(s)));clock.classList.toggle('low',s<=10&&s>0&&!busy);}
 function still(gm){x.fillStyle='#05060a';x.fillRect(0,0,320,240);const im=new Image();im.onload=()=>{if(tray[cur]===gm)x.drawImage(im,0,0,320,240);};im.onerror=()=>{if(tray[cur]===gm)S.live(gm,cv);};im.src=gm.img||'docs/thumbs/'+gm.id+'.jpg';}
 function tune(i,quiet){
  cur=(i+tray.length)%tray.length;const gm=tray[cur];mark();
  if(stop){stop();stop=null;}
  cname.textContent=tc(gm.name);left=DEMO;
  if(RM.matches){still(gm);clock.textContent=S.fmt(A.limitOf(gm));clock.classList.remove('low');return;}
  setClock(left);still(gm);
  if(!quiet){scr.classList.remove('on');void scr.offsetWidth;scr.classList.add('on');}
  if(seen)stop=A.preview(gm,cv,30);
 }
 // one ticker drives the round clock; it only counts while the console is on screen and the lobby is showing
 setInterval(()=>{
  const now=performance.now(),dt=(now-last)/1000;last=now;
  if(busy||RM.matches||!seen||document.hidden||E.state!=='hub')return;
  left-=dt;setClock(left);
  if(left<=0){osd.textContent='TIME UP';setTimeout(()=>{if(!busy)osd.textContent='ATTRACT MODE';},900);powerCycle(()=>tune(cur+1,true));}
 },250);
 function powerCycle(then){scr.classList.remove('on');scr.classList.add('off');setTimeout(()=>{scr.classList.remove('off');then&&then();void scr.offsetWidth;scr.classList.add('on');},RM.matches?0:280);}
 if(window.IntersectionObserver)new IntersectionObserver(es=>{seen=es[0].isIntersecting;if(!seen&&stop){stop();stop=null;}else if(seen&&!stop&&!busy&&!RM.matches&&tray[cur])stop=A.preview(tray[cur],cv,30);}).observe(con);

 /* insert: the cartridge drops into the slot, the screen powers down, the clock counts 3-2-1, the game boots */
 function insert(gm,el,from){
  if(busy)return;busy=true;if(stop){stop();stop=null;}
  const s=$('slot').getBoundingClientRect(),r=(from||el).getBoundingClientRect();
  if(!RM.matches){const t=from||el;t.classList.add('gone');t.style.transform='translate('+(s.left+s.width/2-(r.left+r.width/2))+'px,'+(s.top-(r.top+r.height/2))+'px) scale(.55)';}
  con.classList.remove('ready');osd.textContent='LOADING '+gm.name;cname.textContent=tc(gm.name);
  let n=3;const step=()=>{clock.classList.remove('low');if(n<0||RM.matches){S.play(gm);setTimeout(reset,400);return;}clock.textContent=n?'0:0'+n:'GO';n--;setTimeout(step,260);};
  powerCycle(()=>{still(gm);step();});
 }
 function reset(){busy=false;osd.textContent='ATTRACT MODE';const i=tray.indexOf(tray[cur]);cartEls().forEach(b=>{b.classList.remove('gone','lift');b.style.transform='';});tune(i,true);}
 addEventListener('hashchange',()=>{if(!location.hash&&busy)reset();});

 /* drag: the cartridge lifts off the tray as a floating copy (the tray scrolls, so it would clip), tilts with
    the pointer's speed, lights the slot when it's over the console, and springs home if dropped anywhere else */
 function drag(b,gm){
  let p=null;
  b.addEventListener('pointerdown',e=>{if(busy||e.button>0)return;p={x:e.clientX,y:e.clientY,id:e.pointerId,moved:false,g:null,vx:0,lx:e.clientX,tilt:0};});
  b.addEventListener('pointermove',e=>{
   if(!p||e.pointerId!==p.id)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;
   if(!p.moved){if(Math.hypot(dx,dy)<6)return;p.moved=true;b.setPointerCapture(e.pointerId);const r=b.getBoundingClientRect();const g=b.cloneNode(true);g.removeAttribute('id');g.setAttribute('aria-hidden','true');g.classList.add('drag');Object.assign(g.style,{position:'fixed',left:r.left+'px',top:r.top+'px',width:r.width+'px',margin:0,transform:'none',pointerEvents:'none'});document.body.appendChild(g);p.g=g;p.r=r;b.classList.add('lift');}
   p.vx=p.vx*.7+(e.clientX-p.lx)*.3;p.lx=e.clientX;p.tilt=Math.max(-14,Math.min(14,p.vx*1.4));
   p.g.style.transform='translate('+dx+'px,'+dy+'px) rotate('+p.tilt.toFixed(1)+'deg)';
   con.classList.toggle('ready',over(e));
  });
  const end=e=>{
   if(!p||e.pointerId!==p.id)return;const q=p;p=null;
   if(!q.moved)return;b._dragged=true;setTimeout(()=>{b._dragged=false;},0);
   if(e.type==='pointerup'&&over(e)){insert(gm,b,q.g);setTimeout(()=>{q.g.remove();b.classList.remove('lift');},400);return;}
   con.classList.remove('ready');q.g.classList.remove('drag');q.g.classList.add('back');requestAnimationFrame(()=>{q.g.style.transform='none';});
   setTimeout(()=>{q.g.remove();b.classList.remove('lift');},RM.matches?0:560);
  };
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);
  b.addEventListener('click',()=>{if(b._dragged)return;insert(gm,b);});
 }
 const over=e=>{const r=con.getBoundingClientRect();return e.clientX>r.left&&e.clientX<r.right&&e.clientY>r.top-30&&e.clientY<r.bottom;};

 carts.addEventListener('dragstart',e=>e.preventDefault());
 carts.addEventListener('keydown',e=>{
  let j=null;if(e.key==='ArrowRight'||e.key==='ArrowDown')j=cur+1;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=cur-1;else if(e.key==='Home')j=0;else if(e.key==='End')j=tray.length-1;else return;
  e.preventDefault();tune(Math.max(0,Math.min(tray.length-1,j)));cartEls()[cur].focus();
 });
 $('shuffle').onclick=()=>{if(!busy)powerCycle(deal);};
 deal();
});
})();
