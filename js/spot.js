/* The "New on the shelf" spotlight: the newest cartridge plays itself in high resolution beside its pitch, and a row of
   freshly repainted cartridges sits underneath. Runs only while the section is on screen and no game is open. */
(function(){
 const A=window.A,cv=document.getElementById('spotcv');if(!A||!A.shelf||!cv)return;
 const byId=id=>A.games.find(g=>g.id===id),tc=(A._e&&A._e.tc)||(s=>s);
 document.querySelectorAll('.spot [data-play]').forEach(b=>b.addEventListener('click',()=>{const gm=byId(b.dataset.play);if(gm)A.shelf.play(gm);}));
 // the repainted row: prerendered box art, a name and the shelf it lives on
 const fresh=document.getElementById('fresh');
 if(fresh)['fps','beatjumper','moonbuggy','jetpack','shield','digger'].map(byId).filter(Boolean).forEach(gm=>{
  const b=document.createElement('button');b.type='button';b.className='fr';b.setAttribute('aria-label','Play '+tc(gm.name));
  const art=document.createElement('span');art.className='fr-art';A.shelf.art(gm,art);
  const nm=document.createElement('b');nm.textContent=tc(gm.name);const ct=document.createElement('em');ct.textContent=tc(gm.cat);
  b.append(art,nm,ct);b.addEventListener('click',()=>A.shelf.play(gm));fresh.appendChild(b);});
 // the live demo, drawn at three times the cabinet's resolution so the fruit stays crisp
 const gm=byId('melondrop');if(!gm)return;
 const S=3,off=document.createElement('canvas');off.width=320*S;off.height=240*S;const o=off.getContext('2d'),x=cv.getContext('2d');
 let g=null,f=0,on=false,timer=0;
 // a new round starts a minute in, so the jars are already busy when the section scrolls into view
 const fresh_=()=>{const sv=A.silent,sc=A.cpu,sh=A.shake,sf=A.fx;A.silent=true;A.cpu=true;A.fx=[];try{g=gm.make();g.auto=true;for(let i=0;i<1500&&!g.over;i++){A.bot({});g.update();}if(g.over)g=null;}catch(e){g=null;}A.silent=sv;A.cpu=sc;A.shake=sh;A.fx=sf;};
 const frame=()=>{if(!g)fresh_();if(!g)return;const E=A._e;if(E&&E.state!=="hub")return;
  const k={c:A.c,t:A.t,cpu:A.cpu,two:A.two,silent:A.silent,fx:A.fx,shake:A.shake};
  A.c=o;o.setTransform(S,0,0,S,0,0);A.silent=true;A.cpu=true;A.two=false;A.fx=[];A.t=f;
  try{A._set&&A._set(0,{});A.bot({});g.update();A.cls();g.draw();A.flush&&A.flush();x.drawImage(off,0,0,cv.width,cv.height);if(g.over)g=null;}catch(e){g=null;}
  A.c=k.c;A.t=k.t;A.cpu=k.cpu;A.two=k.two;A.silent=k.silent;A.fx=k.fx;A.shake=k.shake;f++;};
 const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
 if(RM){frame();return;}
 // about 30 frames a second, on the display's own clock
 let last=0;const loop=now=>{timer=0;if(!on||document.hidden)return;if(now-last>=31){last=now;frame();}timer=requestAnimationFrame(loop);};
 const run=()=>{if(on&&!document.hidden&&!timer)timer=requestAnimationFrame(loop);};
 new IntersectionObserver(es=>{on=es[es.length-1].isIntersecting;run();},{rootMargin:'100px'}).observe(cv);
 document.addEventListener('visibilitychange',run);
})();
