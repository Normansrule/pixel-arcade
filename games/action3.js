/* ACTION PACK 3: popular modern action genres, built from scratch.
   survivors, beatjumper, cellgrow, gundungeon, neonhit, runngun, dashpeak, bullethell,
   broadside, boomerang, lavarise, samuraislash, grapple, zombieroad, spellcaster, archertower */
(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji,P=A.poly;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),hyp=Math.hypot,PI=Math.PI,TAU=PI*2,sin=Math.sin,cos=Math.cos,atan2=Math.atan2,flo=Math.floor;
const GA=a=>{A.c.globalAlpha=cl(a,0,1);},GA1=()=>{A.c.globalAlpha=1;};
const shk=n=>{if(!A.silent)A.shake=Math.max(A.shake,n);};
const pop=(txt,x,y,col)=>{if(A.silent)return;txt=String(txt);const w=txt.length*8;A.fx.push({txt,x:cl(x,w/2+2,W-w/2-2),y:cl(y,24,H-24),vx:0,vy:-.55,t:48,c:col||K.y,g:0});};
const spark=(x,y,col,n,sp,life)=>{if(A.silent)return;for(let i=0;i<n;i++){const a=rnd(TAU),v=(sp||2)*(.3+rnd(1));A.fx.push({x,y,vx:cos(a)*v,vy:sin(a)*v,t:(life||14)+ri(8),c:col,g:0});}};
const dang=(a,b)=>{let d=b-a;while(d>PI)d-=TAU;while(d<-PI)d+=TAU;return d;};
const srng=s=>()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296;};
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const grad=(x0,y0,x1,y1,stops)=>{const c=A.c;const g=c.createLinearGradient?c.createLinearGradient(x0,y0,x1,y1):null;if(!g||!g.addColorStop)return stops[0][1];stops.forEach(s=>g.addColorStop(s[0],s[1]));return g;};
const rgrad=(x,y,r0,r1,stops)=>{const c=A.c;const g=c.createRadialGradient?c.createRadialGradient(x,y,r0,x,y,r1):null;if(!g||!g.addColorStop)return stops[stops.length-1][1];stops.forEach(s=>g.addColorStop(s[0],s[1]));return g;};
const fillG=(x,y,w,h,f)=>{A.c.fillStyle=f;A.c.fillRect(x,y,w,h);};
const vign=(a)=>{fillG(0,0,W,H,rgrad(160,120,80,220,[[0,'rgba(0,0,0,0)'],[1,'rgba(0,0,0,'+(a||.55)+')']]));};
const glow=(x,y,r,col,a)=>{GA(a||.35);C(x,y,r,col);GA1();};
const rot=(x,y,a,f)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(a);f();c.restore();};
const bar=(x,y,w,h,f,col,bg)=>{R(x,y,w,h,bg||'#1a1030');if(f>0)R(x+1,y+1,Math.max(0,(w-2)*cl(f,0,1)),h-2,col);};
const mmss=f=>{const s=Math.max(0,f/60|0);return(s/60|0)+':'+String(s%60).padStart(2,'0');};
/* mouse cursor that works with or without pointer lock; falls back when the mouse is idle */
const aimer=()=>{const m={x:160,y:120,on:false};m.upd=()=>{m.on=A.mouse.t>0;if(!m.on)return;let lk=false,s=.5;try{lk=typeof document!=='undefined'&&!!document.pointerLockElement;if(lk){const r=document.getElementById('scr').getBoundingClientRect();s=320/(r.width||640);}}catch(_){}if(lk){m.x=cl(m.x+A.mouse.dx*s,0,W);m.y=cl(m.y+A.mouse.dy*s,0,H);}else{m.x=A.mouse.x;m.y=A.mouse.y;}};
 m.draw=col=>{if(!m.on)return;col=col||K.w;A.ring(m.x,m.y,5,col);L(m.x-9,m.y,m.x-4,m.y,col);L(m.x+4,m.y,m.x+9,m.y,col);L(m.x,m.y-9,m.x,m.y-4,col);L(m.x,m.y+4,m.x,m.y+9,col);R(m.x,m.y,1,1,col);};return m;};
/* choose-one-of-N card overlay used by level-ups and shops */
const cards=(opts,sel,title,sub)=>{GA(.72);R(0,0,W,H,'#000000');GA1();T(title,160,38,K.y,2,'c');if(sub)T(sub,160,54,K.gr,1,'c');const n=opts.length,cw=n>3?70:92,gap=n>3?6:10,x0=160-(n*cw+(n-1)*gap)/2;
 opts.forEach((o,i)=>{const x=x0+i*(cw+gap),y=70+(i===sel?-4:0),on=i===sel;R(x,y,cw,112,on?'#2a2060':'#15102e');A.box(x,y,cw,112,on?K.y:'#4a3f80');if(on){A.box(x-1,y-1,cw+2,114,'#ffe9a0');}
  C(x+cw/2,y+26,15,o.col||K.c);if(o.icon)E(o.icon,x+cw/2,y+27,17);if(o.tag)T(o.tag,x+cw/2,y+46,o.tagc||K.y,1,'c');const ws=(o.name||'').split(' ');let ln=[''];ws.forEach(w=>{if((ln[ln.length-1]+' '+w).trim().length*4>cw-6)ln.push(w);else ln[ln.length-1]=(ln[ln.length-1]+' '+w).trim();});ln.slice(0,2).forEach((l,j)=>T(l,x+cw/2,y+56+j*8,K.w,1,'c'));
  const ds=(o.desc||'').split(' ');let dl=[''];ds.forEach(w=>{if((dl[dl.length-1]+' '+w).trim().length*4>cw-6)dl.push(w);else dl[dl.length-1]=(dl[dl.length-1]+' '+w).trim();});dl.slice(0,4).forEach((l,j)=>T(l,x+cw/2,y+76+j*8,K.gr,1,'c'));});
 T('LEFT/RIGHT CHOOSE   A CONFIRM',160,196,K.w,1,'c');};
const cardPick=(n,st,m)=>{const h=A.hit(0);if(h.l){st.sel=(st.sel+n-1)%n;S('blip');}if(h.r){st.sel=(st.sel+1)%n;S('blip');}const cw=n>3?70:92,gap=n>3?6:10,x0=160-(n*cw+(n-1)*gap)/2;const mx=m?m.x:A.mouse.x,my=m?m.y:A.mouse.y;if(A.mouse.t>0&&my>66&&my<186){const i=flo((mx-x0)/(cw+gap));if(i>=0&&i<n&&mx-x0-i*(cw+gap)<cw)st.sel=i;}return h.a&&st.wait<=0?st.sel:-1;};
const TS=(s,x,y,col,sc,al)=>{s=String(s);sc=sc||1;const w=s.length*4*sc-sc,x0=al==='c'?x-w/2:al==='r'?x-w:x;if(x0<0||x0+w>W||y<0||y+5*sc>H)return;T(s,x,y,col,sc,al);};
const heart=(x,y,col,s)=>{s=s||1;const c=col||K.r;C(x-2*s,y,2.3*s,c);C(x+2*s,y,2.3*s,c);P([[x-4.2*s,y+.6*s],[x+4.2*s,y+.6*s],[x,y+5*s]],c,1);};
/* ---- art kit: shared A.gx paint kit + offscreen sprite/pattern cache (2x) ---- */
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const hiG=()=>A.gfx==='high',loG=()=>A.gfx!=='off';
const PT={};let PTn=0;
const patt=(key,w,h,fn)=>{if(PT[key]!==undefined)return PT[key];let cv=null;try{if(typeof document!=='undefined'&&document.createElement&&A.c&&A.c.drawImage){cv=document.createElement('canvas');cv.width=Math.ceil(w*2);cv.height=Math.ceil(h*2);const x=cv.getContext('2d');x.scale(2,2);const sv=A.c;A.c=x;try{fn(w,h);}finally{A.c=sv;}}}catch(e){cv=null;}if(++PTn>400){for(const k in PT)delete PT[k];PTn=0;}PT[key]=cv;return cv;};
/* blit a cached sprite centred at x,y; fn(w,h) draws it once into the cache, also used as the no-canvas fallback */
const spr=(key,x,y,w,h,fn,a)=>{const cv=patt(key,w,h,fn);if(cv){if(a!==undefined)GA(a);A.c.drawImage(cv,x-w/2,y-h/2,w,h);if(a!==undefined)GA1();}else{const c=A.c;c.save();c.translate(x-w/2,y-h/2);fn(w,h);c.restore();}};
const tileBG=(cv,w,h,ox,oy)=>{ox=((ox%w)+w)%w;oy=((oy%h)+h)%h;for(let x=-ox;x<W;x+=w)for(let y=-oy;y<H;y+=h)A.c.drawImage(cv,x,y,w,h);};
const ell=(x,y,rx,ry,col,r)=>{const c=A.c;c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),r||0,0,TAU);c.fill();};
const torch=(x,y,t)=>{R(x-1.5,y,3,8,'#4a3020');R(x-3,y-2,6,3,'#6a4a2a');const f=sin(t*.3+x)*1.2;X.glow(x,y-5,16+f*2,'#ff9a3a',.35);ell(x,y-5,3+f*.3,5,'#ff7a1a');ell(x,y-4,1.8,3,'#ffe27a');};

/* ---- HORDE SURVIVOR ---- */
A.add({id:'survivors',name:'HORDE SURVIVOR',cat:'ACTION',time:200,how:'ARROWS MOVE. WEAPONS FIRE BY THEMSELVES. GRAB GEMS, PICK UPGRADES.',make(){
 const g={over:null,score:0},GOAL=180*60;
 const WP={wand:{n:'MAGIC WAND',ev:'HOLY WAND',col:'#6ac8ff',i:'🪄',d:'BOLTS SEEK THE NEAREST FOE'},whip:{n:'WHIP',ev:'BLOOD LASH',col:'#ff4f6d',i:'〰️',d:'LASHES LEFT AND RIGHT'},orb:{n:'ORBIT STARS',ev:'STAR HALO',col:'#ffcf3f',i:'⭐',d:'STARS CIRCLE YOU'},
  aura:{n:'GARLIC AURA',ev:'SOUL EATER',col:'#9dff6a',i:'🧄',d:'HURTS ALL FOES NEAR YOU'},knife:{n:'KNIVES',ev:'THOUSAND EDGE',col:'#e8e8ff',i:'🔪',d:'THROWN WHERE YOU FACE'},bolt:{n:'LIGHTNING',ev:'THUNDER LOOP',col:'#fff07a',i:'⚡',d:'ZAPS RANDOM FOES'}};
 const PS={might:{n:'MIGHT',i:'💪',d:'+20 PERCENT DAMAGE'},haste:{n:'HASTE',i:'⏱️',d:'WEAPONS RELOAD 12 PERCENT FASTER'},boots:{n:'BOOTS',i:'👢',d:'+12 PERCENT MOVE SPEED'},heart:{n:'HOLLOW HEART',i:'❤️',d:'+20 MAX HP AND HEAL'},magnet:{n:'MAGNET',i:'🧲',d:'PULL GEMS FROM FARTHER'}};
 const EN=[{k:'bat',hp:6,sp:1.0,r:5,dm:4,xp:1,pt:5},{k:'zom',hp:16,sp:.55,r:7,dm:8,xp:2,pt:10},{k:'skel',hp:28,sp:.75,r:7,dm:10,xp:3,pt:15},{k:'ghost',hp:45,sp:.95,r:8,dm:12,xp:5,pt:25},{k:'elite',hp:420,sp:.62,r:14,dm:20,xp:25,pt:250}];
 let p={x:0,y:0,hp:120,mh:120,fx:1,fy:0,inv:0,st:0},en=[],gems=[],sh=[],sl=[],zap=[],items=[],t=0,lvl=1,xp=0,need=5,menu=null,hs=0,fl=0,flc='#ffffff',kills=0,orbA=0,auraT=0;
 const own={wand:1},evo={},pas={might:0,haste:0,boots:0,heart:0,magnet:0},cd={wand:30,whip:60,orb:0,aura:0,knife:40,bolt:80};
 const mt=()=>1+.2*pas.might,hst=()=>Math.pow(.88,pas.haste);
 const nearest=(ex)=>{let b=null,bd=1e9;for(const e of en){if(ex&&ex.has(e))continue;const d=hyp(e.x-p.x,e.y-p.y);if(d<bd){bd=d;b=e;}}return bd<220?b:null;};
 const kill=e=>{e.dead=1;kills++;g.score+=e.pt;gems.push({x:e.x,y:e.y,v:e.xp,big:e.xp>=5});const sx=e.x-p.x+160,sy=e.y-p.y+128;A.burst(sx,sy,e.k==='elite'?K.o:e.k==='ghost'?'#b8c8ff':e.k==='bat'?'#a060e0':'#8ac070',e.k==='elite'?40:7,e.k==='elite'?4:1.6);
  if(e.k==='elite'){items.push({x:e.x,y:e.y,k:'chest'});hs=8;shk(8);S('boom');}else if(Math.random()<.012)items.push({x:e.x,y:e.y,k:Math.random()<.7?'meat':'mag'});if(evo.aura&&p.hp<p.mh)p.hp=Math.min(p.mh,p.hp+.5);};
 const hit=(e,d,kx,ky)=>{if(e.dead)return;e.hp-=d*mt();e.fl=5;const m=hyp(kx,ky)||1;e.x+=kx/m*(e.k==='elite'?.4:2.2);e.y+=ky/m*(e.k==='elite'?.4:2.2);if(e.hp<=0)kill(e);};
 const offers=()=>{const pool=[];for(const k in WP){if(own[k]&&!evo[k]&&own[k]<5)pool.push({t:'w',k,name:WP[k].n,tag:'LV '+(own[k]+1),desc:own[k]===4?'MAX LEVEL. A CHEST WILL EVOLVE IT':WP[k].d,col:WP[k].col,icon:WP[k].i});else if(!own[k]&&Object.keys(own).length<4)pool.push({t:'w',k,name:WP[k].n,tag:'NEW!',tagc:K.g,desc:WP[k].d,col:WP[k].col,icon:WP[k].i});}
  for(const k in PS)if(pas[k]<5)pool.push({t:'p',k,name:PS[k].n,tag:'LV '+(pas[k]+1),desc:PS[k].d,col:'#5a4aa0',icon:PS[k].i});const o=[];while(o.length<3&&pool.length)o.push(pool.splice(ri(pool.length),1)[0]);if(!o.length)o.push({t:'h',name:'ROAST',tag:'HEAL',desc:'RESTORE 40 HP',col:K.r,icon:'🍗'});return o;};
 const take=o=>{if(o.t==='w')own[o.k]=(own[o.k]||0)+1;else if(o.t==='p'){pas[o.k]++;if(o.k==='heart'){p.mh+=20;p.hp=Math.min(p.mh,p.hp+30);}}else p.hp=Math.min(p.mh,p.hp+40);S('coin');fl=10;flc='#ffe9a0';};
 const chest=()=>{const mx=Object.keys(own).filter(k=>own[k]>=5&&!evo[k]);if(mx.length){const k=mx[ri(mx.length)];evo[k]=1;pop(WP[k].ev+'!',160,90,K.y);}else{const up=Object.keys(own).filter(k=>own[k]<5);if(up.length){const k=up[ri(up.length)];own[k]++;pop(WP[k].n+' UP',160,90,K.c);}else{p.hp=p.mh;pop('FULL HEAL',160,90,K.g);}}S('win');fl=16;flc='#fff3a0';A.burst(160,128,K.y,30,3);g.score+=200;};
 const spawn=()=>{const m=t/3600;let pool=[0];if(m>.3)pool.push(1,1);if(m>.9)pool.push(2,2);if(m>1.6)pool.push(3);if(m<.9)pool.push(0);const e0=EN[pool[ri(pool.length)]];const a=rnd(TAU),d=210+rnd(40),sc=1+m*.7;en.push({...e0,x:p.x+cos(a)*d,y:p.y+sin(a)*d*.8,hp:e0.hp*sc,mhp:e0.hp*sc,fl:0,ph:rnd(TAU),ht:0});};
 g._sv=()=>({p,menu,en});
 g.update=()=>{if(g.over)return;if(menu){menu.wait--;const i=cardPick(menu.o.length,menu);if(i>=0){take(menu.o[i]);menu=null;}return;}if(hs>0){hs--;return;}t++;if(fl)fl--;if(p.inv)p.inv--;
  const k=A.in(0),dx=ax(k),dy=ay(k),spd=1.35*(1+.12*pas.boots);if(dx||dy){const m=hyp(dx,dy);p.x+=dx/m*spd;p.y+=dy/m*spd;p.fx=dx/m;p.fy=dy/m;p.st+=.25;}
  if(t%Math.max(6,44-flo(t/200))===0&&en.length<130){const n=1+flo(t/4500);for(let i=0;i<n;i++)spawn();}if(t%(45*60)===0)en.push({...EN[4],x:p.x+230,y:p.y+rnd(80)-40,hp:420*(1+t/7200),mhp:420*(1+t/7200),fl:0,ph:0,ht:0});
  if(t===60*60||t===120*60)for(let i=0;i<24;i++){const a=i/24*TAU;en.push({...EN[t<7200?0:2],x:p.x+cos(a)*200,y:p.y+sin(a)*170,hp:30,mhp:30,fl:0,ph:0,ht:0});}
  // weapons
  const hm=hst();for(const w in own){const lv=own[w],E_=evo[w];cd[w]--;
   if(w==='wand'&&cd[w]<=0){cd[w]=(E_?18:46-lv*4)*hm;const ex=new Set();const n=E_?4:1+(lv>=3)+(lv>=5);for(let i=0;i<n;i++){const e=nearest(ex);if(!e)break;ex.add(e);const a=atan2(e.y-p.y,e.x-p.x);sh.push({x:p.x,y:p.y,vx:cos(a)*4.2,vy:sin(a)*4.2,d:10+lv*3,pr:E_?3:1,t:70,k:'wand',hitS:new Set()});}if(n&&en.length)S('shoot');}
   if(w==='whip'&&cd[w]<=0){cd[w]=(E_?40:72)*hm;const sides=lv>=2||E_?[1,-1]:[p.fx>=0?1:-1];sides.forEach((s,j)=>{sl.push({x:p.x,y:p.y-4+j*6,s,t:10,w:E_?96:56+lv*6});for(const e of en)if((e.x-p.x)*s>-4&&Math.abs(e.x-p.x)<(E_?96:56+lv*6)&&Math.abs(e.y-p.y+4-j*6)<16){hit(e,14+lv*6,s,0);if(E_)p.hp=Math.min(p.mh,p.hp+.4);}});S('hit');}
   if(w==='knife'&&cd[w]<=0){cd[w]=(E_?7:34)*hm;const n=E_?1:lv;for(let i=0;i<n;i++){const sp=(i-(n-1)/2)*.12,a=atan2(p.fy,p.fx)+sp;sh.push({x:p.x,y:p.y,vx:cos(a)*6,vy:sin(a)*6,d:8+lv*2,pr:E_?2:1,t:50,k:'knife',hitS:new Set()});}}
   if(w==='bolt'&&cd[w]<=0){cd[w]=(E_?40:100-lv*6)*hm;const n=E_?7:lv;const vis=en.filter(e=>Math.abs(e.x-p.x)<160&&Math.abs(e.y-p.y)<110);for(let i=0;i<n&&vis.length;i++){const e=vis.splice(ri(vis.length),1)[0];zap.push({x:e.x,y:e.y,t:10});hit(e,22+lv*8,0,0);}if(n)shk(2);}
   if(w==='aura'){if(cd[w]<=0){cd[w]=22*hm;const r=E_?74:26+lv*6;for(const e of en)if(hyp(e.x-p.x,e.y-p.y)<r+e.r)hit(e,3+lv*2,e.x-p.x,e.y-p.y);}}}
  if(own.orb){orbA+=evo.orb?.085:.06;const n=evo.orb?6:[0,1,2,3,3,4][own.orb],r=evo.orb?46:34;for(let i=0;i<n;i++){const a=orbA+i/n*TAU,ox=p.x+cos(a)*r,oy=p.y+sin(a)*r;for(const e of en)if(e.ht<=0&&hyp(e.x-ox,e.y-oy)<e.r+5){hit(e,8+own.orb*3,e.x-p.x,e.y-p.y);e.ht=18;}}}
  for(const s of sh){s.x+=s.vx;s.y+=s.vy;s.t--;for(const e of en){if(e.dead||s.hitS.has(e))continue;if(hyp(e.x-s.x,e.y-s.y)<e.r+3){s.hitS.add(e);hit(e,s.d,s.vx,s.vy);if(--s.pr<=0){s.t=0;break;}}}}sh=sh.filter(s=>s.t>0);sl.forEach(s=>s.t--);sl=sl.filter(s=>s.t>0);zap.forEach(z=>z.t--);zap=zap.filter(z=>z.t>0);
  // enemies
  for(const e of en){if(e.dead)continue;if(e.fl)e.fl--;if(e.ht>0)e.ht--;e.ph+=.2;const vx=p.x-e.x,vy=p.y-e.y,d=hyp(vx,vy)||1;e.x+=vx/d*e.sp+(e.k==='bat'?sin(e.ph)*.6:0);e.y+=vy/d*e.sp;
   if(d>320){const a=rnd(TAU);e.x=p.x+cos(a)*220;e.y=p.y+sin(a)*180;}
   if(d<e.r+6&&!p.inv){p.hp-=e.dm;p.inv=36;hs=3;shk(5);fl=8;flc='#ff2040';S('hit');A.burst(160,124,K.r,10,2);if(p.hp<=0){g.over='OVERWHELMED AT '+mmss(t);S('lose');return;}}}
  for(let i=0;i<en.length;i++){const a=en[i];for(let j=i+1;j<en.length;j++){const b=en[j],dx2=b.x-a.x,dy2=b.y-a.y,rr=a.r+b.r;if(dx2*dx2+dy2*dy2<rr*rr){const d=hyp(dx2,dy2)||1,o=(rr-d)*.3;a.x-=dx2/d*o;a.y-=dy2/d*o;b.x+=dx2/d*o;b.y+=dy2/d*o;}}}en=en.filter(e=>!e.dead);
  const mg=34*(1+.45*pas.magnet);for(const gm of gems){const d=hyp(gm.x-p.x,gm.y-p.y)||1;if(d<mg||gm.pull){gm.pull=1;const sp=Math.min(7,3+(mg-d)*.05+(gm.sp=(gm.sp||0)+.25));gm.x+=(p.x-gm.x)/d*sp;gm.y+=(p.y-gm.y)/d*sp;}if(d<8){gm.got=1;xp+=gm.v;g.score+=gm.v;if(t%3===0)S('coin');}}gems=gems.filter(q=>!q.got);if(gems.length>260)gems.splice(0,40);
  for(const it of items){if(hyp(it.x-p.x,it.y-p.y)<12){it.got=1;if(it.k==='meat'){p.hp=Math.min(p.mh,p.hp+30);pop('+30 HP',160,100,K.g);S('coin');}else if(it.k==='mag'){gems.forEach(q=>q.pull=1);pop('VACUUM!',160,100,K.c);S('score');}else chest();}}items=items.filter(i=>!i.got);
  if(xp>=need){xp-=need;lvl++;need=flo(need*1.22+4);menu={o:offers(),sel:0,wait:14};S('win');A.burst(160,124,K.c,26,3);fl=10;flc='#a0f0ff';}
  if(t>=GOAL){g.score+=1000;g.over='SURVIVED 3:00! VICTORY';}};
 /* cached sprites for the horde: drawn once at 2x, then blitted (dozens of foes on screen) */
 const SV={bat:(w,h,f,wh)=>{const x=w/2,y=h/2,fl=[-4,0,3,0][f];const wc=wh||'#5a2a8a';for(const s of[-1,1]){X.poly([[x,y-1],[x+s*13,y-6-fl],[x+s*11,y+1-fl*.4],[x+s*7,y-1],[x+s*5,y+3],[x+s*2,y+2]],wh||X.lg(x,y-6,x,y+4,['#8a4ac8',wc]));if(!wh)X.stroke([[x+s*3,y],[x+s*11,y-5-fl]],'rgba(255,255,255,.18)',.7);}
   X.orb(x,y+1,4.6,wh||'#7a3ab8',wh?0:1);P([[x-3,y-2],[x-4,y-6],[x-1,y-3]],wh||'#5a2a8a',1);P([[x+3,y-2],[x+4,y-6],[x+1,y-3]],wh||'#5a2a8a',1);if(!wh){R(x-2.4,y,1.6,1.6,'#ff3040');R(x+.8,y,1.6,1.6,'#ff3040');R(x-1,y+3,.8,1.4,'#ffffff');R(x+.4,y+3,.8,1.4,'#ffffff');}},
  zom:(w,h,f,wh)=>{const x=w/2,y=h/2+2,sw=[-1.5,0,1.5,0][f];ell(x,y+9,6,1.8,'rgba(0,0,0,.35)');R(x-3.5+sw*.4,y+3,2.6,6,wh||'#3a3428');R(x+1-sw*.4,y+3,2.6,6,wh||'#3a3428');X.rr(x-5,y-6,10,10,2,wh||X.lg(x-5,0,x+5,0,['#6a8a5a','#3a5a32']));if(!wh){R(x-5,y-1,10,1.5,'#2a3a22');R(x+1,y-5,3,4,'#5a7a4a');R(x-3,y+1,2,2,'#7a2020');}
   R(x+3,y-4+sw*.3,8,2.6,wh||'#8ab070');R(x+3,y-.5-sw*.3,7,2.6,wh||'#7aa060');X.orb(x,y-9,4.6,wh||'#8ab070',wh?0:1);if(!wh){R(x-2,y-10,1.6,1.6,'#ff4030');R(x+1.4,y-10,1.6,1.6,'#ff4030');R(x-1.5,y-7,3,1,'#3a2020');R(x-4,y-13,3,2,'#4a5a30');}},
  skel:(w,h,f,wh)=>{const x=w/2,y=h/2+2,sw=[-1.5,0,1.5,0][f],bn=wh||'#e8e0cc';ell(x,y+9,6,1.8,'rgba(0,0,0,.35)');R(x-2.5+sw*.4,y+3,1.6,6,bn);R(x+1-sw*.4,y+3,1.6,6,bn);R(x-.6,y-5,1.4,9,bn);for(let i=0;i<4;i++)X.rr(x-4+i*.3,y-5+i*2,8-i*.6,1.4,.6,bn);R(x-5,y-5,2,6+sw*.3,bn);R(x+3.5,y-5,2,6-sw*.3,bn);if(!wh){R(x+5,y-7,1.2,10,'#a0a0b0');R(x+4,y-3,3.4,1.2,'#806040');}
   X.orb(x,y-9.5,4.6,wh||'#f4ecd8',wh?0:1);if(!wh){R(x-2.6,y-10.5,2,2.4,'#1a1010');R(x+.8,y-10.5,2,2.4,'#1a1010');R(x-2,y-10,.8,.8,'#ff5030');R(x+1.4,y-10,.8,.8,'#ff5030');R(x-1.6,y-6.8,3.2,.8,'#1a1010');}},
  ghost:(w,h,f,wh)=>{const x=w/2,y=h/2,o=[0,1,0,-1][f];if(!wh)X.glow(x,y,13,'#9ab0ff',.35);const c=A.c;c.beginPath();c.moveTo(x-7,y+6);c.lineTo(x-7,y-2);c.arc(x,y-2,7,PI,0);c.lineTo(x+7,y+6);for(let i=0;i<4;i++)c.quadraticCurveTo(x+7-i*3.5-1.75,y+(i%2?9+o:4-o),x+7-(i+1)*3.5,y+6);c.closePath();c.fillStyle=wh||X.lg(x,y-9,x,y+8,['rgba(230,240,255,.95)','rgba(150,170,255,.55)']);c.fill();
   if(!wh){ell(x-2.6,y-3,1.8,2.6,'#202048');ell(x+2.6,y-3,1.8,2.6,'#202048');ell(x,y+1.6,1.6,1.2,'#202048');R(x-3,y-4.5,.8,.8,'#ffffff');}},
  elite:(w,h,f,wh)=>{const x=w/2,y=h/2+3,b=[0,1,0,-1][f];ell(x,y+15,14,3.5,'rgba(0,0,0,.4)');if(!wh)X.glow(x,y,26,'#ff3010',.25);for(const s of[-1,1]){X.poly([[x+s*10,y-6],[x+s*17,y-21+b],[x+s*12,y-20],[x+s*6,y-10]],wh||X.lg(x,y-20,x,y-6,['#fff4dc','#b09060']));}
   X.orb(x,y,14,wh||'#b02a2a',wh?0:1);if(!wh){X.disc(x,y+5,8,'rgba(60,0,0,.35)');R(x-7,y-4,5,3.4,'#ffe040');R(x+2,y-4,5,3.4,'#ffe040');R(x-5.4,y-3.4,1.6,2.2,'#300000');R(x+3.6,y-3.4,1.6,2.2,'#300000');X.poly([[x-6,y+4],[x+6,y+4],[x+4,y+8],[x-4,y+8]],'#300000');for(let i=0;i<4;i++)P([[x-5+i*3,y+4],[x-4+i*3,y+6.4],[x-3+i*3,y+4]],'#f0e0c0',1);}}};
 const SZ={bat:[30,18],zom:[26,30],skel:[24,30],ghost:[22,22],elite:[44,48]};
 const foeS=(e,x,y)=>{const sz=SZ[e.k],f=(flo(e.ph*.7)%4+4)%4,wh=e.fl>0;spr('sv_'+e.k+f+(wh?'w':''),x,y,sz[0],sz[1],(w,h)=>SV[e.k](w,h,f,wh?'#ffffff':null));};
 g.draw=()=>{const cx=p.x-160,cy=p.y-128;const gp=patt('sv_ground',192,192,(w,h)=>{fillG(0,0,w,h,'#2a5630');const wr=(a,b,f)=>{for(const dx of[-w,0,w])for(const dy of[-h,0,h])f(a+dx,b+dy);};
   for(let i=0;i<34;i++){const r=8+hash(i,3)*16;wr(hash(i,1)*w,hash(i,2)*h,(a,b)=>ell(a,b,r,r*.7,i%3?'rgba(18,42,24,.32)':'rgba(70,120,60,.2)'));}
   for(let i=0;i<220;i++){const gc=i%4?'#3a7438':'#4c8e44';wr(hash(i,5)*w,hash(i,6)*h,(a,b)=>{R(a,b,1,2.5,gc);R(a+1.4,b+.6,1,2,gc);});}
   for(let i=0;i<4;i++)wr(hash(i,9)*w,hash(i,10)*h,(a,b)=>{ell(a,b,12+hash(i,11)*8,6,'rgba(120,90,50,.28)');for(let j=0;j<4;j++)ell(a+hash(i,j+20)*14-7,b+hash(j,i)*6-3,1.2,.9,'rgba(150,130,100,.6)');});
   for(let i=0;i<6;i++){const fc=['#ff6a9a','#ffe060','#ffffff','#9ac8ff'][i%4];wr(hash(i,13)*w,hash(i,14)*h,(a,b)=>{for(let j=0;j<3;j++){X.disc(a+j*3,b+(j%2)*2,1.3,fc);R(a+j*3-.3,b+(j%2)*2-.3,.6,.6,'#fff8d0');}});}
   for(let i=0;i<2;i++)wr(hash(i,17)*w,hash(i,18)*h,(a,b)=>{ell(a+1,b+2,5,2,'rgba(0,0,0,.3)');X.orb(a,b,4,'#747a70');});});
  if(gp)tileBG(gp,192,192,cx,cy);else{A.cls('#24452c');}
  /* tree canopies drift over the field for depth */
  const gx=flo(cx/64),gy=flo(cy/64);for(let i=gx-1;i<gx+7;i++)for(let j=gy-1;j<gy+6;j++){const h=hash(i,j);if(h>.1)continue;const x=i*64-cx+32,y=j*64-cy+32;ell(x+4,y+8,20,7,'rgba(0,0,0,.3)');R(x-2.5,y-6,5,14,'#4a3220');R(x-2.5,y-6,2,14,'#5e4230');X.disc(x-9,y-12,12,'#1f4e28');X.disc(x+9,y-13,11,'#1f4e28');X.disc(x,y-22,13,'#28602f');X.disc(x-4,y-14,10,'#2c6a34');X.disc(x+4,y-26,7,'#3a8040');X.disc(x-6,y-24,5,'#4a9a4c');}
  for(const it of items){const x=it.x-cx,y=it.y-cy+sin(t*.1)*2;X.glow(x,y,16,it.k==='chest'?'#ffcf3f':'#ffffff',.4);E(it.k==='chest'?'🎁':it.k==='meat'?'🍗':'🧲',x,y,it.k==='chest'?16:12);}
  for(const q of gems){const x=q.x-cx,y=q.y-cy;if(x<-5||x>W+5||y<-5||y>H+5)continue;const c=q.big?'#ff5ac8':q.v>=2?'#5aff9a':'#5ac8ff';if(q.big||loG())X.glow(x,y,q.big?10:6,c,.3);X.gem(x,y,q.big?10:7,c);}
  if(own.aura){const r=evo.aura?74:26+own.aura*6;GA(.16+.05*sin(t*.2));X.disc(160,124,r,X.rg(160,124,r*.3,160,124,r,[evo.aura?'rgba(192,106,255,0)':'rgba(157,255,106,0)',evo.aura?'#c06aff':'#9dff6a']));GA1();A.ring(160,124,r,evo.aura?'#e0a0ff':'#c8ffa0');}
  const ens=en.slice().sort((a,b)=>a.y-b.y);for(const e of ens){const x=e.x-cx,y=e.y-cy;if(x<-24||x>W+24||y<-24||y>H+24)continue;foeS(e,x,y);if(e.k==='elite')bar(x-14,y-24,28,3,e.hp/e.mhp,K.r,'#300010');}
  for(const s of sl){GA(s.t/10);const x0=s.x-cx,y0=s.y-cy,col=evo.whip?'#ff3060':'#f0e0ff';A.c.strokeStyle=col;A.c.lineWidth=3*s.t/10+1;A.c.lineCap='round';A.c.beginPath();A.c.moveTo(x0,y0-6);A.c.quadraticCurveTo(x0+s.s*s.w*.5,y0-22+(10-s.t)*2,x0+s.s*s.w,y0-4+(10-s.t));A.c.stroke();A.c.lineCap='butt';if(s.t>6)X.glow(x0+s.s*s.w,y0-4,10,col,.5);GA1();}
  if(own.orb){const n=evo.orb?6:[0,1,2,3,3,4][own.orb],r=evo.orb?46:34;for(let i=0;i<n;i++){const a=orbA+i/n*TAU,x=160+cos(a)*r,y=124+sin(a)*r;X.glow(x,y,10,'#ffcf3f',.5);X.orb(x,y,4,evo.orb?'#fff6c0':'#ffcf3f');}}
  const pv=p.inv%6<3;if(pv){if(p.inv)X.glow(160,124,18,'#ff4060',.3);A.person(160,138,{c:'#3a5aff',pants:'#2a2040',s:.92,st:p.st,d:p.fx>=0?1:-1,cap:'#c02a3a',id:2});}X.meter(144,142,32,5,p.hp/p.mh,p.hp/p.mh<.3?'#ff3a4a':'#4ae070');
  for(const s of sh){const x=s.x-cx,y=s.y-cy;if(s.k==='wand'){X.glow(x,y,8,evo.wand?'#ffcf3f':'#6ac8ff',.55);L(x,y,x-s.vx*1.6,y-s.vy*1.6,evo.wand?'#fff0a0':'#9adcff',2);C(x,y,2.5,evo.wand?'#ffffc0':'#e0f6ff');}else rot(x,y,atan2(s.vy,s.vx),()=>{R(-6,-1,8,2,'#e8e8ff');P([[2,-2],[6,0],[2,2]],'#ffffff',1);R(-8,-1.5,2,3,'#6a4a2a');});}
  for(const z of zap){const x=z.x-cx,y=z.y-cy;let px=x+rnd(10)-5,py=-4;GA(z.t/10);X.glow(x,y,16,'#fff070',.6);for(let i=1;i<=6;i++){const nx=x+(i<6?rnd(16)-8:0),ny=y*i/6;L(px,py,nx,ny,'#fff8a0',2.4);L(px,py,nx,ny,'#ffffff',.8);px=nx;py=ny;}C(x,y,6,'#ffffff');GA1();}
  if(fl){GA(fl/24);R(0,0,W,H,flc);GA1();}vign(.5);
  /* HUD: XP strip, level badge, timer panel, kills */
  X.rr(0,0,W,9,0,'rgba(8,10,30,.85)');X.meter(1,1,W-2,7,xp/need,'#4ab8ff');X.panel(2,11,40,13,'#4ab8ff');T('LV '+lvl,22,15,K.c,1,'c');X.panel(130,11,60,17,t>GOAL-600?'#ff4060':'#ffcf3f');T(mmss(GOAL-t),160,13,t>GOAL-600?K.r:K.w,2,'c');X.panel(W-62,11,60,13);T('KILLS '+kills,W-6,15,K.w,1,'r');
  let ix=4;for(const w in own){X.panel(ix,H-18,16,16,evo[w]?'#ffcf3f':WP[w].col);E(WP[w].i,ix+8,H-10,9);for(let q=0;q<own[w];q++)R(ix+2+q*3,H-21,2,2,WP[w].col);ix+=19;}
  if(menu)cards(menu.o,menu.sel,'LEVEL UP!','CHOOSE ONE');};
 return g;}});

/* ---- BEAT JUMPER ---- */
A.add({id:'beatjumper',name:'BEAT JUMPER',cat:'ACTION',how:'RUN TO THE BEAT. A OR UP JUMPS (HOLD TO HOP). TAP A ON RINGS MID-AIR.',make(){
 const g={over:null,score:0},GY=196,SP=4,BT=120,GR=.62,JV=-7.6;
 const PAL=[['#1a0840','#6a1fb0','#ff4fd8','#3dffd8'],['#04202e','#0a7a8a','#3dffd8','#ffcf3f'],['#2a0a04','#b03a0a','#ffcf3f','#ff4f6d']];
 let lvl=0,objs=[],endX=0,x=0,y=GY-16,vy=0,onG=true,spin=0,dead=0,cp=0,tries=6,maxB=0,trail=[],coins=0,pulse=0,lastB=0,buf=0,flash=0,jb=[],deaths=0;
 const build=()=>{const r=srng(91+lvl*57);objs=[];jb=[];let L=BT*4;const bars=10+lvl*2;
  const sp=(x0,yb)=>objs.push({k:'sp',x:x0,y:yb}),blk=(x0,yt,w,h)=>objs.push({k:'bk',x:x0,y:yt,w,h});
  const PT=[
   {b:1,w:[3,2,1],f:L=>{sp(L+36,GY);jb.push(L);}},
   {b:1,w:[2,3,2],f:L=>{sp(L+36,GY);sp(L+52,GY);jb.push(L);}},
   {b:2,w:[0,2,3],f:L=>{sp(L+30,GY);sp(L+46,GY);sp(L+62,GY);jb.push(L);}},
   {b:3,w:[2,2,1],f:L=>{blk(L+36,GY-20,180,20);jb.push(L);if(r()<.6)objs.push({k:'coin',x:L+120,y:GY-50});}},
   {b:4,w:[1,2,2],f:L=>{blk(L+36,GY-20,300,20);sp(L+BT+40,GY-20);jb.push(L,L+BT);}},
   {b:4,w:[1,2,2],f:L=>{blk(L+36,GY-20,120,20);blk(L+156,GY-40,150,40);jb.push(L,L+BT);}},
   {b:4,w:[1,2,3],f:L=>{objs.push({k:'pad',x:L+26});blk(L+80,GY-60,240,12);for(let i=0;i<14;i++)sp(L+84+i*16,GY);if(r()<.7)objs.push({k:'coin',x:L+200,y:GY-80});}},
   {b:3,w:[0,2,3],f:L=>{for(let i=0;i<5;i++)sp(L+60+i*16,GY);objs.push({k:'orb',x:L+44,y:GY-56});jb.push(L);}},
  ];
  let beat=4,lc=-99;const tb=bars*4;
  while(beat<tb){if(beat-lc>=8){objs.push({k:'cp',x:beat*BT});lc=beat;beat++;continue;}const ok=PT.filter(p=>p.w[lvl]>0);let tot=ok.reduce((a,p)=>a+p.w[lvl],0)+1.2-lvl*.4,q=r()*tot,pick=null;for(const p of ok){q-=p.w[lvl];if(q<0){pick=p;break;}}
   if(!pick){beat++;continue;}pick.f(beat*BT);beat+=pick.b;}
  endX=(beat+1)*BT;objs.sort((a,b)=>a.x-b.x);};
 const respawn=()=>{x=cp-16;y=GY-16;vy=0;onG=true;spin=0;trail=[];objs.forEach(o=>{o.used=0;});lastB=flo((x+16)/BT);};
 build();respawn();g._dbg=()=>({x,y,jb,objs,lvl});
 const die=()=>{dead=48;tries--;deaths++;S('boom');shk(9);flash=10;const sx=x-(x-70)+8,sy=y+8;A.burst(sx,sy,PAL[lvl][2],26,3.2);A.burst(sx,sy,'#ffffff',10,2);};
 g.update=()=>{if(g.over)return;if(flash)flash--;pulse*=.86;
  if(dead){dead--;if(dead===0){if(tries<=0){g.over='OUT OF TRIES AT '+flo(x/endX*100)+'%';return;}respawn();}return;}
  const h=A.hit(0),k=A.in(0),jp=h.a||h.u,jh=k.a||k.u;if(jp)buf=6;else if(buf)buf--;
  x+=SP;const pb=y+16;vy+=GR;if(vy>12)vy=12;y+=vy;onG=false;
  const b=flo((x+16)/BT);if(b!==lastB){lastB=b;pulse=1;S(b%2?'blip':'hit');if(b>maxB){maxB=b;g.score+=10;}}
  if(y+16>=GY){y=GY-16;vy=0;onG=true;}
  for(const o of objs){if(o.x>x+40)break;if(o.x+(o.w||20)<x-20)continue;
   if(o.k==='bk'){if(x+16>o.x&&x<o.x+o.w){if(pb<=o.y+1&&y+16>=o.y&&vy>=0){y=o.y-16;vy=0;onG=true;}else if(y+16>o.y+3&&y<o.y+o.h){die();return;}}}
   else if(o.k==='sp'){if(x+14>o.x+5&&x+2<o.x+11&&y+14>o.y-11&&y<o.y){die();return;}}
   else if(o.k==='pad'){if(x+16>o.x&&x<o.x+16&&y+16>=GY-6){vy=-10.5;onG=false;y=GY-17;S('jump');A.burst(o.x-(x-70)+8,GY-4,K.y,8,2);}}
   else if(o.k==='orb'&&!o.used){if(hyp(x+8-o.x,y+8-o.y)<19&&buf){o.used=1;buf=0;vy=-8.2;onG=false;S('jump');pulse=1;spark(o.x-(x-70),o.y,K.y,14,2.5);}}
   else if(o.k==='coin'&&!o.used){if(hyp(x+8-o.x,y+8-o.y)<14){o.used=1;coins++;g.score+=100;S('coin');spark(o.x-(x-70),o.y,K.y,12,2);pop('COIN!',o.x-(x-70),o.y-10,K.y);}}
   else if(o.k==='cp'&&x+16>=o.x&&cp<o.x){cp=o.x;pop('CHECKPOINT',160,70,K.g);S('score');}}
  if(onG){spin=Math.round(spin/(PI/2))*(PI/2);if(buf||jh){vy=JV;onG=false;buf=0;}}else spin+=PI/2/22;
  if(A.t%2===0){trail.push({x,y,r:spin});if(trail.length>7)trail.shift();}
  if(x>=endX){g.score+=500;S('win');A.confetti();if(lvl>=2){g.over='ALL LEVELS COMPLETE! WIN';return;}pop('LEVEL '+(lvl+1)+' COMPLETE!',160,90,K.y);lvl++;tries+=2;build();cp=0;maxB=0;respawn();}};
 g.draw=()=>{const pl=PAL[lvl],cx=x-70;fillG(0,0,W,H,grad(0,0,0,H,[[0,pl[0]],[1,pl[1]]]));if(pulse>.05){GA(pulse*.14);R(0,0,W,GY,pl[2]);GA1();}
  for(let i=0;i<14;i++){const s=18+(i*13)%34,sx=((i*83-cx*.25)%420+420)%420-50,sy=30+(i*57)%120;GA(.12+(i%3)*.05);rot(sx,sy,i+A.t*.004*(i%2?1:-1),()=>A.box(-s/2,-s/2,s,s,pl[2]));GA1();}
  for(let i=0;i<22;i++){const bw=26,hh=20+hash(i,lvl)*60,sx=((i*bw-cx*.5)%(22*bw)+22*bw)%(22*bw)-bw;GA(.35);R(sx,GY-hh,bw-2,hh,pl[0]);GA1();}
  fillG(0,GY,W,H-GY,grad(0,GY,0,H,[[0,'#0c0618'],[1,'#000000']]));for(let i=0;i<9;i++){const gx=((i*40-cx)%360+360)%360-20;L(gx,GY,gx-30,H,'rgba(255,255,255,.08)');}L(0,GY,W,GY,pl[2],2);GA(.3+pulse*.5);L(0,GY+2,W,GY+2,pl[2],3);GA1();
  for(const o of objs){const sx=o.x-cx;if(sx<-320||sx>W+20)continue;
   if(o.k==='bk'){if(sx+o.w<-5)continue;fillG(sx,o.y,o.w,o.h,'#0e0820');A.box(sx,o.y,o.w,o.h,pl[2]);for(let q=12;q<o.w-4;q+=20)A.box(sx+q-6,o.y+4,Math.min(12,o.w-q),Math.max(2,o.h-8),'rgba(255,255,255,.12)');}
   else if(o.k==='sp'){P([[sx,o.y],[sx+8,o.y-16],[sx+16,o.y]],'#0a0414',1);P([[sx,o.y],[sx+8,o.y-16],[sx+16,o.y]],pl[2]);L(sx+8,o.y-14,sx+8,o.y-4,'rgba(255,255,255,.25)');}
   else if(o.k==='pad'){glow(sx+8,GY-2,10,K.y,.3+pulse*.3);fillG(sx,GY-4,16,4,K.y);R(sx+3,GY-6,10,2,'#fff3a0');}
   else if(o.k==='orb'){if(o.used){GA(.3);A.ring(o.x-cx,o.y,9,K.y);GA1();}else{glow(sx,o.y,14+pulse*4,K.y,.3);A.ring(sx,o.y,9,K.y);A.ring(sx,o.y,7,'#fff3a0');C(sx,o.y,3,'#ffffff');}}
   else if(o.k==='coin'&&!o.used){const w2=Math.abs(cos(A.t*.08))*6+1;glow(sx,o.y,9,K.y,.3);A.c.fillStyle=K.y;A.c.beginPath();A.c.ellipse(sx,o.y,w2,7,0,0,TAU);A.c.fill();R(sx-1,o.y-3,2,6,'#fff3a0');}
   else if(o.k==='cp'){L(sx,GY,sx,GY-40,'#aaaaaa',2);const on=cp>=o.x;P([[sx,GY-50],[sx+6,GY-44],[sx,GY-38],[sx-6,GY-44]],on?K.g:'#406050',1);if(on)glow(sx,GY-44,9,K.g,.3);}}
  const ex=endX-cx;if(ex<W+30){for(let i=0;i<6;i++){GA(.25+.1*sin(A.t*.2+i));R(ex+i*6,0,4,GY,[pl[2],pl[3],'#ffffff'][i%3]);}GA1();T('FINISH',ex+18,GY-60,K.w,1,'c');}
  if(!dead){trail.forEach((q,i)=>{GA(i/trail.length*.35);rot(q.x-cx+8,q.y+8,q.r,()=>R(-6,-6,12,12,pl[3]));});GA1();
   const px=70+8,py=y+8,sq=onG?1+pulse*.08:1;glow(px,py,14,pl[3],.2);rot(px,py,spin,()=>{A.c.scale(sq,1/sq);R(-8,-8,16,16,pl[3]);R(-5,-5,10,10,'#ffffff');R(-4,-4,8,8,pl[3]);R(-3,-2,2,3,'#101010');R(1,-2,2,3,'#101010');R(-3,2,6,1,'#101010');});}
  if(flash){GA(flash/20);R(0,0,W,H,'#ffffff');GA1();}
  R(0,0,W,20,'rgba(0,0,0,.45)');T('LV '+(lvl+1)+'/3',6,7,pl[3],1);bar(60,7,176,6,x/endX,pl[2],'#1a1030');T(flo(cl(x/endX,0,1)*100)+'%',242,7,K.w,1);T('TRIES '+tries,W-6,7,tries<=2?K.r:K.w,1,'r');
  if(dead&&tries<=0)T('OUT OF TRIES',160,100,K.r,2,'c');};
 return g;}});

/* ---- CELL GROW ---- */
A.add({id:'cellgrow',name:'CELL GROW',cat:'ACTION',mouse:1,time:300,how:'ARROWS OR MOUSE STEER. EAT SMALLER CELLS, FLEE BIG ONES. A SPLITS.',make(){
 const g={over:null,score:0},WW=1200,WH=1200,GOAL=500,rad=m=>Math.sqrt(m)*2.6+2,spd=m=>3.1/(1+Math.sqrt(m)*.075);
 const NM=['BLOB','NOMNOM','AMOEBA','GOO','ZORP','MITOSIS','PLASMA','SQUISH','VOID','CHOMP','JELLY','PROTO','MOLD','SPORE'],CO=['#ff4f6d','#ffcf3f','#3dff8b','#4dabff','#ff9838','#ff4f9a','#2fd6c3','#b07aff','#a0e040','#ff7a50'];
 const m=aimer();let me=[{x:WW/2,y:WH/2,m:12,vx:0,vy:0,mt:0}],bots=[],pel=[],vir=[],zoom=1.3,cx=WW/2,cy=WH/2,best=12,t=0,tx=0,ty=0,fl=0;
 const mkPel=()=>({x:20+rnd(WW-40),y:20+rnd(WH-40),c:(q=>A.mix(q,q,0))(CO[ri(CO.length)]),m:1+ri(2)});for(let i=0;i<820;i++)pel.push(mkPel());
 const mkBot=(small)=>{let x,y;do{x=40+rnd(WW-80);y=40+rnd(WH-80);}while(hyp(x-cx,y-cy)<260);return{x,y,m:small?6+rnd(10):[8,14,20,30,45,70,110,160][ri(8)],n:NM[ri(NM.length)],c:CO[ri(CO.length)],tx:x,ty:y,th:0,vx:0,vy:0};};for(let i=0;i<14;i++)bots.push(mkBot());
 for(let i=0;i<9;i++)vir.push({x:80+rnd(WW-160),y:80+rnd(WH-160),m:100});
 const tot=()=>me.reduce((a,c)=>a+c.m,0);
 const move=(c,dx,dy,sp)=>{const d=hyp(dx,dy);if(d>2){const s=Math.min(sp,d*.08+sp*.3);c.x+=dx/d*s;c.y+=dy/d*s;}c.x+=c.vx;c.y+=c.vy;c.vx*=.9;c.vy*=.9;const r=rad(c.m)*.5;c.x=cl(c.x,r,WW-r);c.y=cl(c.y,r,WH-r);};
 const eatPel=c=>{const r=rad(c.m);for(const p of pel){if(Math.abs(p.x-c.x)<r&&Math.abs(p.y-c.y)<r&&hyp(p.x-c.x,p.y-c.y)<r){c.m+=p.m*.5;Object.assign(p,mkPel());return true;}}return false;};
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;m.upd();const k=A.in(0),h=A.hit(0);
  let mx=cx,my=cy;for(const c of me){mx=c.x;my=c.y;break;}const T_=tot();let wx=0,wy=0;me.forEach(c=>{wx+=c.x*c.m;wy+=c.y*c.m;});cx+=(wx/T_-cx)*.15;cy+=(wy/T_-cy)*.15;
  if(m.on){tx=cx+(m.x-160)/zoom;ty=cy+(m.y-120)/zoom;}else{const dx=ax(k),dy=ay(k);if(dx||dy){tx=cx+dx*200;ty=cy+dy*200;}else{tx=cx;ty=cy;}}
  if(h.a&&me.length<8){const add=[];for(const c of me){if(c.m<24||me.length+add.length>=8)continue;const a=atan2(ty-c.y,tx-c.x),half=c.m/2;c.m=half;c.mt=540;const n={x:c.x+cos(a)*rad(half),y:c.y+sin(a)*rad(half),m:half,vx:cos(a)*11,vy:sin(a)*11,mt:540};add.push(n);}if(add.length){me.push(...add);S('jump');spark(160,120,K.c,6,2);}}
  for(const c of me){if(c.mt>0)c.mt--;move(c,tx-c.x,ty-c.y,spd(c.m));if(c.m>90)c.m-=c.m*.00018;if(eatPel(c)&&t%4===0)S('blip');}
  for(let i=0;i<me.length;i++)for(let j=i+1;j<me.length;j++){const a=me[i],b=me[j],d=hyp(b.x-a.x,b.y-a.y)||1,rr=rad(a.m)+rad(b.m);if(a.mt>0||b.mt>0){if(d<rr){const o=(rr-d)*.25;a.x-=(b.x-a.x)/d*o;a.y-=(b.y-a.y)/d*o;b.x+=(b.x-a.x)/d*o;b.y+=(b.y-a.y)/d*o;}}else if(d<Math.max(rad(a.m),rad(b.m))*.8){a.m+=b.m;b.m=0;}}me=me.filter(c=>c.m>0);
  // viruses pop big player cells
  for(const v of vir)for(const c of me){if(c.m>130&&hyp(c.x-v.x,c.y-v.y)<rad(c.m)*.9&&me.length<8){const n=Math.min(6,9-me.length),pm=c.m/(n+1);c.m=pm;c.mt=600;for(let q=0;q<n;q++){const a=q/n*TAU;me.push({x:c.x,y:c.y,m:pm,vx:cos(a)*8,vy:sin(a)*8,mt:600});}v.x=80+rnd(WW-160);v.y=80+rnd(WH-160);S('boom');shk(6);spark(160,120,K.g,20,3);pop('POPPED!',160,80,K.g);break;}}
  // bots
  for(const b of bots){b.th--;const br=rad(b.m);if(b.th<=0){b.th=12+ri(12);let thr=null,td=1e9,prey=null,pd=1e9;const all=bots.concat(me.map(c=>({x:c.x,y:c.y,m:c.m,pl:1})));for(const o of all){if(o===b)continue;const d=hyp(o.x-b.x,o.y-b.y)-rad(o.m);if(o.m>b.m*1.15&&d<140+br&&d<td){td=d;thr=o;}else if(b.m>o.m*1.2&&d<(o.pl?(t<480?0:110):150)&&d<pd){pd=d;prey=o;}}
    if(thr){const a=atan2(b.y-thr.y,b.x-thr.x);b.tx=b.x+cos(a)*150;b.ty=b.y+sin(a)*150;}else if(prey&&Math.random()<.85){b.tx=prey.x;b.ty=prey.y;if(prey.pl&&b.m>prey.m*2.6&&pd<60&&Math.random()<.2*A.ai){b.vx=(prey.x-b.x)/(pd+30)*9;b.vy=(prey.y-b.y)/(pd+30)*9;}}else if(hyp(b.tx-b.x,b.ty-b.y)<30||Math.random()<.05){const p=pel[ri(pel.length)];b.tx=p.x;b.ty=p.y;}
    if(b.m>130)for(const v of vir)if(hyp(v.x-b.x,v.y-b.y)<br+30){const a=atan2(b.y-v.y,b.x-v.x);b.tx=b.x+cos(a)*80;b.ty=b.y+sin(a)*80;}}
   move(b,b.tx-b.x,b.ty-b.y,spd(b.m)*.88);eatPel(b);if(b.m>90)b.m-=b.m*.00018;}
  // eating between cells
  const eat=(a,b)=>a.m>=b.m*1.15&&hyp(a.x-b.x,a.y-b.y)<rad(a.m)-rad(b.m)*.35;
  for(const b of bots){for(const c of me){if(b.dead||c.m<=0)continue;if(eat(c,b)){c.m+=b.m*.9;b.dead=1;S('score');shk(3);const s=[(b.x-cx)*zoom+160,(b.y-cy)*zoom+120];A.burst(s[0],s[1],b.c,14,2.4);pop('+'+flo(b.m)+' '+b.n,s[0],s[1]-12,K.y);}else if(eat(b,c)){b.m+=c.m*.9;c.m=0;S('lose');shk(6);fl=10;A.burst((c.x-cx)*zoom+160,(c.y-cy)*zoom+120,K.c,18,3);if(me.filter(q=>q.m>0).length===0){g.over='EATEN BY '+b.n;}}}}
  for(const a of bots)for(const b of bots){if(a===b||a.dead||b.dead)continue;if(eat(a,b)){a.m+=b.m*.9;b.dead=1;}}
  me=me.filter(c=>c.m>0);bots=bots.filter(b=>!b.dead);while(bots.length<14)bots.push(mkBot(bots.length<10));if(g.over)return;
  const T2=tot();best=Math.max(best,T2);g.score=flo(best);zoom+=(cl(1.55-Math.sqrt(T2)*.042,.55,1.4)-zoom)*.03;if(T2>=GOAL){g.score+=500;g.over='BIGGEST CELL! WIN';}};
 const cellD=(x,y,r,c,n,msv)=>{const sx=(x-cx)*zoom+160,sy=(y-cy)*zoom+120,sr=r*zoom;if(sx<-sr-4||sx>W+sr+4||sy<-sr-4||sy>H+sr+4)return;const wob=sr>8?1:0;GA(.3);C(sx+2,sy+3,sr,'#000000');GA1();if(sr>6)X.glow(sx,sy,sr*1.3,c,.18);C(sx,sy,sr,A.mix(c,'#000000',.4));const ir=sr-Math.max(1.5,sr*.1)+wob*sin(t*.1+x)*.5;X.disc(sx,sy,ir,X.rg(sx-ir*.35,sy-ir*.4,ir*.05,sx,sy,ir,[A.mix(c,'#ffffff',.45),c,A.mix(c,'#000000',.2)]));if(sr>9){for(let i=0;i<3;i++){const a=hash(flo(x),i)*TAU+t*.01,d=ir*.45;X.disc(sx+cos(a)*d,sy+sin(a)*d,ir*.12,'rgba(255,255,255,.18)');}X.ell(sx-ir*.35,sy-ir*.45,ir*.32,ir*.18,'rgba(255,255,255,.45)',-.5);}if(n&&sr>13)TS(n,sx,sy-(sr>22?6:2),'#ffffff',1,'c');if(msv&&sr>20)TS(''+flo(msv),sx,sy+3,'rgba(255,255,255,.8)',1,'c');};
 g.draw=()=>{A.cls('#0c1226');X.cache('cg_bg',()=>{X.sky(['#0c1430','#0a0e22']);for(let i=0;i<14;i++)X.glow(hash(i,1)*W,hash(i,2)*H,30+hash(i,3)*50,['#2a4aa0','#5a2a90','#1a7a8a'][i%3],.12);});const gs=40*zoom,ox=((-cx*zoom+160)%gs+gs)%gs,oy=((-cy*zoom+120)%gs+gs)%gs;for(let x=ox;x<W;x+=gs)L(x,0,x,H,'rgba(120,150,220,.12)');for(let y=oy;y<H;y+=gs)L(0,y,W,y,'rgba(120,150,220,.12)');
  const bx0=(0-cx)*zoom+160,by0=(0-cy)*zoom+120;A.c.strokeStyle=K.r;A.c.lineWidth=2;A.c.strokeRect(bx0,by0,WW*zoom,WH*zoom);
  for(const p of pel){const sx=(p.x-cx)*zoom+160,sy=(p.y-cy)*zoom+120;if(sx<-4||sx>W+4||sy<-4||sy>H+4)continue;const pr=Math.max(2,(2.2+p.m*.7)*zoom);C(sx,sy,pr,p.c);R(sx-pr*.45,sy-pr*.5,pr*.5,pr*.4,'rgba(255,255,255,.5)');}
  const all=bots.map(b=>({x:b.x,y:b.y,m:b.m,c:b.c,n:b.n})).concat(me.map(c=>({x:c.x,y:c.y,m:c.m,c:'#2fd6c3',n:'YOU',me:1})));all.sort((a,b)=>a.m-b.m);
  const drawVir=v=>{const sx=(v.x-cx)*zoom+160,sy=(v.y-cy)*zoom+120,r=rad(v.m)*zoom;if(sx<-r-8||sx>W+r+8||sy<-r-8||sy>H+r+8)return;const pts=[];for(let i=0;i<24;i++){const a=i/24*TAU+t*.01,rr=r*(i%2?1:1.13);pts.push([sx+cos(a)*rr,sy+sin(a)*rr]);}GA(.85);P(pts,'#33dd55',1);GA1();P(pts,'#1a8a2a');C(sx,sy,r*.55,'#2ac04a');};
  let vd=false;for(const c of all){if(!vd&&c.m>100){vir.forEach(drawVir);vd=true;}cellD(c.x,c.y,rad(c.m),c.c,c.n,c.m);if(c.me){const sx=(c.x-cx)*zoom+160,sy=(c.y-cy)*zoom+120;A.ring(sx,sy,rad(c.m)*zoom+2,'rgba(255,255,255,.5)');}}if(!vd)vir.forEach(drawVir);
  if(fl){GA(fl/25);R(0,0,W,H,K.r);GA1();}m.draw(K.c);
  const T3=tot();R(0,0,W,16,'rgba(0,0,0,.45)');T('MASS '+flo(T3),6,5,K.c,1);bar(64,5,120,6,T3/GOAL,K.c);T('GOAL '+GOAL,188,5,K.gr,1);T('CELLS '+me.length,W-6,5,K.w,1,'r');
  const lb=all.slice().sort((a,b)=>b.m-a.m).slice(0,5);R(W-78,20,74,50,'rgba(0,0,0,.4)');T('TOP CELLS',W-41,23,K.y,1,'c');lb.forEach((c,i)=>{T((i+1)+'.'+c.n.slice(0,7),W-74,33+i*7,c.me?K.c:K.w,1);T(''+flo(c.m),W-8,33+i*7,c.me?K.c:K.gr,1,'r');});
  R(W-50,H-50,46,46,'rgba(0,0,0,.4)');A.box(W-50,H-50,46,46,'rgba(255,255,255,.3)');bots.forEach(b=>{if(b.m>40)R(W-50+b.x/WW*46-1,H-50+b.y/WH*46-1,2,2,b.c);});me.forEach(c=>R(W-50+c.x/WW*46-1,H-50+c.y/WH*46-1,3,3,'#ffffff'));};
 return g;}});

/* ---- GUN DUNGEON ---- */
A.add({id:'gundungeon',name:'GUN DUNGEON',cat:'ACTION',mouse:1,how:'MOVE, HOLD A FIRES (MOUSE AIMS), B DODGE-ROLLS. SLAY THE BULLET KING.',make(){
 const g={over:null,score:0},X0=10,Y0=30,X1=310,Y1=230,DY=130,NR=7,m=aimer();
 const GUNS={PISTOL:{r:12,n:1,sp:.05,d:1,v:5,c:'#ffe070'},SHOTGUN:{r:30,n:6,sp:.55,d:1,v:5.5,c:'#ff9838'},SMG:{r:5,n:1,sp:.18,d:.6,v:6,c:'#9dff6a'},RAILGUN:{r:36,n:1,sp:0,d:6,v:10,pr:4,c:'#6ac8ff'},BOUNCER:{r:12,n:1,sp:.06,d:1.3,v:4.5,bo:3,c:'#ff5ac8'}};
 let room=0,p={x:40,y:DY,fx:1,st:0},ob=[],en=[],pb=[],eb=[],items=[],door=true,gun='PISTOL',hp=6,mh=6,inv=0,roll=0,rcd=0,rdx=1,rdy=0,hs=0,fl=0,flc='#fff',t=0,boss=null,trans=0,aim=0,rt=0,won=0,kills=0;
 const open=(x,y,r)=>door&&x+r>X1&&Math.abs(y-DY)<14;
 const solid=(x,y,r)=>{if(open(x,y,r))return false;if(x-r<X0||x+r>X1||y-r<Y0||y+r>Y1)return true;for(const o of ob)if(x+r>o.x&&x-r<o.x+o.w&&y+r>o.y&&y-r<o.y+o.h)return true;return false;};
 const mv=(o,dx,dy,r)=>{if(!solid(o.x+dx,o.y,r))o.x+=dx;if(!solid(o.x,o.y+dy,r))o.y+=dy;};
 let lid=0;const load=()=>{lid++;p.x=24;p.y=DY;ob=[];en=[];pb=[];eb=[];items=[];boss=null;door=false;rt=0;
  if(room===0){door=true;items.push({x:100,y:DY,k:'chest'});}
  else if(room<NR-1){const n=2+ri(3);for(let i=0,tr=0;i<n&&tr<60;tr++){const w=16+ri(3)*12,h=16+ri(2)*12,x=80+ri(170),y=Y0+14+ri(Y1-Y0-40);if(y<DY+18&&y+h>DY-18&&x+w>250)continue;if(ob.some(o=>x<o.x+o.w+14&&x+w+14>o.x&&y<o.y+o.h+14&&y+h+14>o.y))continue;ob.push({x,y,w,h,k:ri(2)});i++;}
   const pool=['kin','kin','blob'].concat(room>=2?['shot','turret']:[],room>=4?['shot','blob','turret']:[]);for(let i=0,tr=0;i<2+room&&tr<99;tr++){const x=120+rnd(170),y=Y0+14+rnd(Y1-Y0-28);if(solid(x,y,8))continue;const k=pool[ri(pool.length)];en.push({k,x,y,hp:{kin:3,shot:5,blob:4,turret:7}[k]+room*.4,t:-40-ri(40),fl:0,tx:x,ty:y,ph:rnd(TAU)});i++;}}
  else boss={x:230,y:90,hp:160,mh:160,t:0,ph:0,fl:0};};
 load();
 const hurt=()=>{if(inv||(roll>4))return;hp--;inv=70;hs=6;shk(7);fl=12;flc='#ff2040';S('boom');A.burst(p.x,p.y,K.r,16,2.5);eb=eb.filter(b=>hyp(b.x-p.x,b.y-p.y)>44);if(hp<=0){g.over='SLAIN IN ROOM '+(room+1);S('lose');}};
 const shootE=(x,y,a,v,c)=>eb.push({x,y,vx:cos(a)*v,vy:sin(a)*v,c:c||K.p});
 const killE=e=>{e.dead=1;kills++;g.score+=50;A.burst(e.x,e.y,e.k==='blob'?K.g:e.k==='turret'?'#aaaaaa':'#e0b050',14,2.2);shk(3);hs=Math.max(hs,2);S('hit');if(Math.random()<.1)items.push({x:e.x,y:e.y,k:'heart'});};
 const dmg=(e,d,a)=>{e.hp-=d;e.fl=4;if(e.k!=='turret')mv(e,cos(a)*2,sin(a)*2,7);if(e.hp<=0&&!e.dead)killE(e);};
 g.update=()=>{if(g.over)return;m.upd();if(trans){trans--;if(trans===10){room++;load();}return;}if(won){won--;if(won===0){g.score+=2000+hp*200;g.over='DUNGEON CLEAR! VICTORY';}return;}if(hs){hs--;return;}t++;rt++;if(fl)fl--;if(inv)inv--;if(rcd)rcd--;
  const k=A.in(0),h=A.hit(0),dx=ax(k),dy=ay(k);if(dx||dy){const d=hyp(dx,dy);rdx=dx/d;rdy=dy/d;if(dx)p.fx=dx;p.st+=.3;}
  let tgt=null,td=1e9;for(const e of en){const d=hyp(e.x-p.x,e.y-p.y);if(d<td){td=d;tgt=e;}}if(boss)tgt=boss;
  if(m.on)aim=atan2(m.y-p.y,m.x-p.x);else if(tgt)aim=atan2(tgt.y-p.y,tgt.x-p.x);else if(dx||dy)aim=atan2(rdy,rdx);
  if(h.b&&!roll&&!rcd){roll=22;rcd=42;S('jump');if(!(dx||dy)){rdx=cos(aim);rdy=sin(aim);}}
  if(roll){roll--;const s=roll>8?3.6:1.4;mv(p,rdx*s,rdy*s,5);if(roll%3===0)spark(p.x,p.y+5,'#b0a090',1,.5,10);}else if(dx||dy){const d=hyp(dx,dy);mv(p,dx/d*1.75,dy/d*1.75,5);}
  const G=GUNS[gun];if(!roll&&A.fire(G.r)){for(let i=0;i<G.n;i++){const a=aim+(G.n>1?(i/(G.n-1)-.5)*G.sp:(rnd(2)-1)*G.sp);pb.push({x:p.x+cos(aim)*8,y:p.y-3+sin(aim)*8,vx:cos(a)*G.v*(G.n>1?.85+rnd(.3):1),vy:sin(a)*G.v*(G.n>1?.85+rnd(.3):1),d:G.d,pr:G.pr||0,bo:G.bo||0,life:G.n>1?28:90,hit:[]});}S('shoot');if(gun==='SHOTGUN'||gun==='RAILGUN')shk(3);p.mf=3;}
  if(p.mf)p.mf--;
  if(open(p.x,p.y,5)&&p.x>X1-4){trans=20;g.score+=100;S('coin');return;}
  for(const b of pb){b.x+=b.vx;b.y+=b.vy;b.life--;if(solid(b.x,b.y,1)&&!open(b.x,b.y,1)){if(b.bo>0){b.bo--;if(solid(b.x-b.vx,b.y,1))b.vy*=-1;else b.vx*=-1;b.x+=b.vx;b.y+=b.vy;}else{b.life=0;spark(b.x,b.y,'#ffe8a0',3,1.2,8);}}
   for(const e of en){if(e.dead||b.life<=0||b.hit.includes(e))continue;if(hyp(e.x-b.x,e.y-b.y)<8){b.hit.push(e);dmg(e,b.d,atan2(b.vy,b.vx));spark(b.x,b.y,K.y,3,1.5,8);if(b.pr--<=0)b.life=0;}}
   if(boss&&b.life>0&&Math.abs(b.x-boss.x)<16&&Math.abs(b.y-boss.y)<20){boss.hp-=b.d;boss.fl=3;g.score+=2;b.life=0;spark(b.x,b.y,K.y,3,1.5,8);}}
  pb=pb.filter(b=>b.life>0);
  for(const e of en){if(e.dead)continue;e.t++;if(e.fl)e.fl--;const d=hyp(p.x-e.x,p.y-e.y)||1,a=atan2(p.y-e.y,p.x-e.x);if(e.t<0)continue;
   if(e.k==='blob'){e.ph+=.15;const s=(.75+room*.06)*(1+.3*sin(e.ph));mv(e,(p.x-e.x)/d*s,(p.y-e.y)/d*s,6);}
   else if(e.k!=='turret'){if(e.t%70===0||hyp(e.tx-e.x,e.ty-e.y)<4){const ra=a+PI+(rnd(2)-1)*1.2,rr=70+rnd(40);e.tx=cl(p.x+cos(ra)*rr,X0+10,X1-10);e.ty=cl(p.y+sin(ra)*rr,Y0+10,Y1-10);}const q=hyp(e.tx-e.x,e.ty-e.y)||1;mv(e,(e.tx-e.x)/q*.6,(e.ty-e.y)/q*.6,6);
    if(e.k==='kin'&&e.t%Math.max(55,95-room*6)===40){shootE(e.x,e.y-2,a,1.9);S('blip');}if(e.k==='shot'&&e.t%120===60){for(let i=-2;i<=2;i++)shootE(e.x,e.y-2,a+i*.2,1.7,K.o);S('blip');}}
   else if(e.t%130===70){for(let i=0;i<10;i++)shootE(e.x,e.y,i/10*TAU+e.t*.01,1.5,'#c070ff');S('blip');}
   if(d<10)hurt();}
  en=en.filter(e=>!e.dead);
  if(boss){const B=boss;B.t++;if(B.fl)B.fl--;const rage=B.hp<B.mh/2;B.x=190+sin(B.t*.012)*90;B.y=80+sin(B.t*.027)*26;const ph=flo(B.t/240)%4,a=atan2(p.y-B.y,p.x-B.x);
   if(B.t>60){if(ph===0&&B.t%(rage?3:5)===0){for(let s=0;s<(rage?3:2);s++)shootE(B.x,B.y,B.t*.13+s*TAU/(rage?3:2),1.6,'#ff4f9a');}
    if(ph===1&&B.t%(rage?30:42)===0){for(let i=0;i<22;i++)shootE(B.x,B.y,i/22*TAU+B.t,1.5,'#ffcf3f');S('blip');}
    if(ph===2&&B.t%(rage?24:34)===0){for(let i=-3;i<=3;i++)shootE(B.x,B.y+8,a+i*.16,2.1,'#ff9838');S('blip');}
    if(ph===3){if(B.t%240===180&&en.length<4){en.push({k:'kin',x:B.x-20,y:B.y+26,hp:3,t:0,fl:0,tx:B.x,ty:B.y+40,ph:0},{k:'kin',x:B.x+20,y:B.y+26,hp:3,t:0,fl:0,tx:B.x,ty:B.y+40,ph:0});}if(B.t%50===0)for(let i=0;i<12;i++)shootE(B.x,B.y,i/12*TAU+(B.t%100?.26:0),1.3,'#c070ff');}}
   if(hyp(p.x-B.x,p.y-B.y)<18)hurt();if(B.hp<=0){boss=null;won=110;eb=[];en=[];S('win');shk(14);fl=20;flc='#ffffff';A.burst(B.x,B.y,K.y,50,4);A.burst(B.x,B.y,K.o,40,3);A.confetti();}}
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(solid(b.x,b.y,1))b.dead=1;else if(hyp(b.x-p.x,b.y-p.y+3)<4.5){if(roll>4){if(!b.gz){b.gz=1;g.score+=5;spark(b.x,b.y,K.c,3,1,8);}}else{b.dead=1;hurt();}}}eb=eb.filter(b=>!b.dead);if(g.over)return;
  for(const it of items){if(hyp(it.x-p.x,it.y-p.y)<14){it.got=1;if(it.k==='heart'){if(hp<mh)hp++;S('coin');pop('+1 HEART',it.x,it.y-14,K.r);}else{const opts=Object.keys(GUNS).filter(q=>q!==gun&&q!=='PISTOL');gun=opts[ri(opts.length)];S('win');fl=10;flc='#fff3a0';A.burst(it.x,it.y,K.y,24,2.6);pop(gun+'!',it.x,it.y-18,K.y);g.score+=100;}}}items=items.filter(i=>!i.got);
  if(!door&&!boss&&room<NR-1&&!en.length&&rt>30){door=true;S('score');pop('ROOM CLEAR',160,70,K.g);g.score+=100;if(room===2||room===4)items.push({x:160,y:DY,k:'chest'});}};
 const kinD=(e)=>{const x=e.x,y=e.y,w=e.fl?'#ffffff':null,bc=e.k==='shot'?'#c83838':'#d8a040',bob=sin(t*.25+e.ph)*.8;ell(x,y+9,7,2,'rgba(0,0,0,.35)');
  /* bullet-kin: a walking brass cartridge */
  X.rr(x-5,y-4+bob,10,13,3,w||X.lg(x-5,0,x+5,0,[X.lt(bc,1.35),bc,X.lt(bc,.6)]));X.rr(x-5,y-9+bob,10,7,4,w||X.lg(x-5,0,x+5,0,[e.k==='shot'?'#ff8a80':'#ffe6a0',e.k==='shot'?'#e05050':'#e8c060',e.k==='shot'?'#8a2020':'#9a7020']));R(x-5,y+1+bob,10,2,w||'#6a4418');
  const lx=cl((p.x-x)*.05,-1,1);R(x-3.5,y-4+bob,2.6,2.6,'#ffffff');R(x+1,y-4+bob,2.6,2.6,'#ffffff');R(x-3+lx+.6,y-3.4+bob,1.2,1.4,'#000000');R(x+1.5+lx+.6,y-3.4+bob,1.2,1.4,'#000000');if(e.k==='shot'){L(x-4,y-6+bob,x-1,y-5+bob,'#400000',1);L(x+4,y-6+bob,x+1,y-5+bob,'#400000',1);}
  const sw=sin(e.ph+t*.3)*1.5;R(x-4,y+9+sw*.3,3,2.4,'#2a2a2a');R(x+1,y+9-sw*.3,3,2.4,'#2a2a2a');const ga=atan2(p.y-y,p.x-x);L(x+cos(ga)*3,y+2+bob,x+cos(ga)*10,y+2+bob+sin(ga)*7,'#3a3a44',2.4);
  if(e.t<0){GA(.5+.5*sin(t*.5));A.ring(x,y,12,K.r);GA1();}};
 const roomBG=()=>X.cache('gd_room'+lid,()=>{A.cls('#120c16');
   /* floor: beveled flagstones with mortar, worn centre carpet toward the exit */
   for(let i=0;i<19;i++)for(let j=0;j<13;j++){const x=X0+i*16,y=Y0+j*16;if(x>=X1||y>=Y1)continue;const hh=hash(i+room*31,j),c0=hh<.33?'#3e3846':hh<.66?'#39333f':'#433c4a';R(x,y,16,16,'#221c28');X.rr(x+.5,y+.5,15,15,1.5,X.lg(x,y,x+16,y+16,[X.lt(c0,1.18),c0,X.lt(c0,.82)]));if(hh>.86){L(x+3,y+5,x+8,y+9,'#28222e');L(x+8,y+9,x+7,y+13,'#28222e');}if(hh<.06)ell(x+8,y+9,4,2.5,'rgba(60,120,60,.25)');}
   X.rr(X0+20,DY-18,X1-X0-20,36,2,'rgba(110,24,40,.55)');for(let x=X0+24;x<X1;x+=10){R(x,DY-16,4,1.5,'rgba(230,180,90,.35)');R(x,DY+14,4,1.5,'rgba(230,180,90,.35)');}
   /* back wall with bricks, arches and banners */
   X.vg(0,0,W,Y0,['#1a1220','#2e2236']);for(let j=0;j<4;j++)for(let i=-1;i<21;i++){const bx=i*16+(j%2)*8,by=Y0-30+j*7;X.rr(bx+.5,by,15,6,1,X.lg(0,by,0,by+6,['#5a4860','#3e3046']));}
   for(const bx of[70,160,250]){X.rr(bx-10,2,20,Y0-6,2,X.lg(bx-10,0,bx+10,0,['#6a1830','#a02848','#6a1830']));P([[bx-10,Y0-4],[bx,Y0+2],[bx+10,Y0-4]],'#a02848',1);X.disc(bx,12,4,'#ffcf3f');}
   R(0,Y0-3,W,3,'#7a6a84');R(0,Y0,W,2,'rgba(0,0,0,.45)');
   X.vg(0,Y0,X0,H-Y0,['#2e2236','#1a1220']);X.vg(X1,Y0,W-X1,H-Y0,['#2e2236','#1a1220']);X.vg(0,Y1,W,H-Y1,['#2a1e30','#120c16']);R(X0-1,Y0,1,Y1-Y0,'#5a4a64');R(X1,Y0,1,Y1-Y0,'#5a4a64');
   /* pillars / crates */
   for(const o of ob){ell(o.x+o.w/2+3,o.y+o.h+2,o.w/2+3,4,'rgba(0,0,0,.45)');if(o.k){X.block(o.x,o.y-4,o.w,o.h+4,'#8a6038',2);for(let q=o.x+5;q<o.x+o.w-2;q+=7)R(q,o.y-2,1,o.h,'rgba(60,30,10,.35)');L(o.x+2,o.y-2,o.x+o.w-2,o.y+o.h-2,'#5a3a18',1.5);L(o.x+o.w-2,o.y-2,o.x+2,o.y+o.h-2,'#5a3a18',1.5);}
    else{X.vg(o.x,o.y+o.h-6,o.w,6,['#4e4a5c','#2e2a3a']);X.block(o.x,o.y-4,o.w,o.h-2,'#77738a',2);for(let q=o.y;q<o.y+o.h-6;q+=6)R(o.x+1,q,o.w-2,1,'rgba(0,0,0,.18)');}}
   X.vignette(.5);});
 g.draw=()=>{roomBG();for(const tx of[40,120,200,280])torch(tx,Y0-14,t);
  if(door){X.vg(X1,DY-14,W-X1,28,['#000000','#140a1c']);X.glow(X1+4,DY,16,'#3dff8b',.25+.15*sin(t*.15));GA(.6+.3*sin(t*.15));P([[X1+2,DY-5],[X1+8,DY],[X1+2,DY+5]],K.g,1);GA1();}else{X.vg(X1,DY-14,W-X1,28,['#5a1020','#2a0610']);for(let i=0;i<4;i++)X.rr(X1+1,DY-12+i*7,8,2,1,K.r);}
  for(const it of items){const y=it.y+sin(t*.1)*1.5;if(it.k==='heart'){X.glow(it.x,y,9,'#ff4060',.35);X.heart(it.x,y,1.2);}else{X.glow(it.x,y,18,'#ffcf3f',.3+.12*sin(t*.2));ell(it.x,it.y+8,10,3,'rgba(0,0,0,.4)');X.block(it.x-10,y-6,20,13,'#a8702a',2);X.rr(it.x-10,y-9,20,6,3,X.lg(0,y-9,0,y-3,['#e0a048','#a06a20']));R(it.x-10,y-4,20,2,'#5a3a10');X.rr(it.x-2.5,y-5,5,5,1,'#ffe060');}}
  const draws=en.map(e=>({y:e.y,f:()=>{if(e.k==='blob'){const sq=1+.15*sin(e.ph);ell(e.x,e.y+6,8,2.2,'rgba(0,0,0,.35)');ell(e.x,e.y+1,8.5*sq,7/sq,e.fl?'#ffffff':X.rg(e.x-3,e.y-3,1,e.x,e.y+1,9,['#b8ffb0','#4ad060','#1e7a30']));if(!e.fl){ell(e.x-3,e.y-3,2.4,1.4,'rgba(255,255,255,.6)');R(e.x-3.5,e.y-.5,2,2.4,'#103010');R(e.x+1.5,e.y-.5,2,2.4,'#103010');}}
   else if(e.k==='turret'){ell(e.x,e.y+8,9,2.5,'rgba(0,0,0,.4)');X.block(e.x-8,e.y+1,16,7,'#4a4a58',2);X.orb(e.x,e.y-1,8,e.fl?'#ffffff':'#8a8a9e');if(!e.fl){X.disc(e.x,e.y-1,3.4,'#200020');X.disc(e.x,e.y-1,1.8,(e.t%130)>50?'#ff3a6a':'#7a2040');}}else kinD(e);}}));
  draws.push({y:p.y,f:()=>{if(roll){ell(p.x,p.y+7,6,2,'rgba(0,0,0,.35)');rot(p.x,p.y,roll*.5*(p.fx>0?1:-1),()=>{X.orb(0,0,6.5,'#3a6ad0');R(-2,-6,4,3,'#f1c7a3');});}else if(inv%8<5){A.person(p.x,p.y+9,{s:.66,c:'#3a6ad0',pants:'#2a2a3a',st:p.st,d:p.fx>0?1:-1,id:3,cap:'#a03030'});const gx=p.x+cos(aim)*11,gy=p.y-5+sin(aim)*11;L(p.x,p.y-5,gx,gy,'#20202a',4);L(p.x+cos(aim)*4,p.y-5+sin(aim)*4,gx,gy,GUNS[gun].c,1.4);if(p.mf){X.glow(gx,gy,9,'#ffcf3f',.8);C(gx,gy,2.5,'#ffffff');}}}});
  draws.sort((a,b)=>a.y-b.y).forEach(d=>d.f());
  if(boss){const B=boss,x=B.x,y=B.y,w=B.fl?'#ffffff':null;X.glow(x,y,40,'#ff3040',.2+.08*sin(t*.1));ell(x,y+24,18,4,'rgba(0,0,0,.45)');X.rr(x-15,y-10,30,32,5,w||X.lg(x-15,0,x+15,0,['#ffe6a0','#d8a040','#8a5a20']));X.rr(x-15,y-20,30,16,8,w||X.lg(x-15,0,x+15,0,['#fff0c0','#e8c060','#9a7020']));R(x-15,y+8,30,4,w||'#6a4018');
   X.poly([[x-13,y-18],[x-13,y-32],[x-6,y-25],[x,y-36],[x+6,y-25],[x+13,y-32],[x+13,y-18]],w||X.lg(0,y-36,0,y-18,['#fff3a0','#ffcf3f','#c08a10']));X.disc(x,y-30,2,'#ff3a5a');X.disc(x-9,y-26,1.5,'#4ab8ff');X.disc(x+9,y-26,1.5,'#4ab8ff');
   R(x-8,y-10,6,5,'#ffffff');R(x+2,y-10,6,5,'#ffffff');R(x-6,y-9,2.5,3,K.r);R(x+4,y-9,2.5,3,K.r);L(x-9,y-13,x-3,y-11,'#402010',1.5);L(x+9,y-13,x+3,y-11,'#402010',1.5);R(x-6,y+1,12,2.5,'#402010');for(const s of[-1,1]){L(x+s*15,y,x+s*24,y+6+sin(t*.2)*3,'#3a3a44',4);}}
  for(const b of pb){X.glow(b.x,b.y,4,GUNS[gun].c,.4);L(b.x,b.y,b.x-b.vx*1.2,b.y-b.vy*1.2,GUNS[gun].c,2.2);C(b.x,b.y,1.2,'#ffffff');}for(const b of eb){X.glow(b.x,b.y,6,b.c,.45);X.orb(b.x,b.y,2.8,b.c,0);R(b.x-.8,b.y-.8,1.4,1.4,'#ffffff');}
  if(fl){GA(fl/26);R(0,0,W,H,flc);GA1();}m.draw(K.y);
  X.rr(4,3,mh*11+4,13,3,'rgba(0,0,0,.55)');for(let i=0;i<mh;i++)X.heart(10+i*11,7,1,i<hp?'#ff4060':'#402030');X.panel(4,17,gun.length*4+44,10,GUNS[gun].c);T(gun,8,19,GUNS[gun].c,1);T('B ROLL',8+gun.length*4+6,19,rcd?K.gr:K.c,1);
  X.rr(210,3,NR*13+4,12,3,'rgba(0,0,0,.55)');for(let i=0;i<NR;i++){X.rr(213+i*13,5,10,8,2,i===room?'#ffcf3f':i<room?'#5a5070':'#2a2438');if(i===NR-1)R(216+i*13,7,4,4,K.r);}T('SCORE '+g.score,W-6,18,K.w,1,'r');
  if(boss){X.meter(60,Y1-9,200,7,boss.hp/boss.mh,'#ff3a4a');T('BULLET KING',160,Y1-17,K.y,1,'c');}if(room===0&&t<400)T('WALK INTO THE CHEST, THEN THE DOOR',160,Y1-16,K.w,1,'c');
  if(trans){GA(1-Math.abs(trans-10)/10);R(0,0,W,H,'#000000');GA1();}};
 return g;}});

/* ---- NEON HIT ---- */
const NHM=[
["####################","#P.....#......t....#","#......#...........#","#..b...#....####...#","#......#....#..#...#","#...........#g.....#","####..#######..#####","#......#...........#","#..t...#...t.......#","#......#.......##..#","#..........g...#...#","#......#.......#.t.#","####################"],
["####################","#.......#....g.....#","#..t....#..........#","#.......####..######","#..................#","###..######..#.....#","#P...#....#..#..t..#","#....#.g..#..#.....#","#....#....#..####..#","#..p.............s.#","######..####.......#","#t.........#...g...#","####################"],
["####################","#g....#.....#.....g#","#.....#..t..#......#","#..........s.......#","###.####.....####.##","#.....#.......#....#","#..t..#...P...#..t.#","#.....#.......#....#","###.####.....####.##","#..........b.......#","#.....#..t..#......#","#s....#.....#....g.#","####################"],
["####################","#P..#.......t.....s#","#...#..............#","#...#..####..####..#","#...#..#g.....t.#..#","#......#........#..#","#####..###....###..#","#..t...............#","#..........g.......#","#..######....#######","#..#s.............g#","#.p#....t..........#","####################"]];
A.add({id:'neonhit',name:'NEON HIT',cat:'ACTION',mouse:1,how:'MOVE, A ATTACKS (MOUSE AIMS), B THROWS YOUR WEAPON. ONE HIT KILLS ANYONE.',make(){
 const g={over:null,score:0},TS_=16,OY=24,m=aimer(),PAL=[['#ff2fa0','#2a0a2a'],['#2fd6ff','#081a2a'],['#ffcf3f','#2a1a06'],['#7aff5a','#0a2210']];
 const WPN={bat:{melee:1,rng:19,cd:20},pistol:{ammo:8,cd:14},shotgun:{ammo:4,cd:34}};
 let fl=0,map,p,en,pb,eb,drops,dec,thr,combo=0,cT=0,dead=0,lives=5,clearT=0,fT=0,hs=0,flash=0,aim=0,sw=0,t=0;
 const tile=(x,y)=>{const c=flo(x/TS_),r=flo((y-OY)/TS_);if(r<0||r>=13||c<0||c>=20)return true;return map[r][c]==='#';};
 const col=(x,y,rr)=>tile(x-rr,y-rr)||tile(x+rr,y-rr)||tile(x-rr,y+rr)||tile(x+rr,y+rr);
 const mv=(o,dx,dy,rr)=>{if(!col(o.x+dx,o.y,rr))o.x+=dx;if(!col(o.x,o.y+dy,rr))o.y+=dy;};
 const los=(x0,y0,x1,y1)=>{const d=hyp(x1-x0,y1-y0),n=d/4|0;for(let i=1;i<n;i++){if(tile(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n))return false;}return true;};
 const load=()=>{map=NHM[fl].map(r=>(r+'####################').slice(0,20));en=[];pb=[];eb=[];drops=[];dec=[];thr=[];dead=0;clearT=0;fT=0;combo=0;cT=0;
  map.forEach((row,r)=>row.split('').forEach((c,ci)=>{const x=ci*TS_+8,y=OY+r*TS_+8;if(c==='P')p={x,y,w:null,ammo:0,cd:0,st:0};else if('tgs'.includes(c))en.push({x,y,k:c,a:rnd(TAU),al:0,rt:0,cd:40,wt:0,tx:x,ty:y,st:0,pt:ri(120)});else if(c==='b'||c==='p')drops.push({x,y,w:c==='b'?'bat':'pistol',ammo:c==='p'?8:0});}));};
 load();
 const killE=(e,a)=>{if(e.dead)return;e.dead=1;combo=cT>0?combo+1:1;cT=150;const pts=100*combo;g.score+=pts;pop(combo>1?'COMBO X'+combo:'+'+pts,e.x,e.y-16,combo>1?K.y:PAL[fl][0]);dec.push({x:e.x,y:e.y,a,k:'body',c:e.k==='t'?'#e8e8e8':'#8a8aa0'});for(let i=0;i<4;i++)dec.push({x:e.x+cos(a)*(4+i*5)+rnd(4)-2,y:e.y+sin(a)*(4+i*5)+rnd(4)-2,r:2+rnd(3),k:'blood'});
  A.burst(e.x,e.y,'#c01030',14,2.4);shk(5);hs=4;S('hit');if(e.k==='g')drops.push({x:e.x+rnd(8)-4,y:e.y+rnd(8)-4,w:'pistol',ammo:4+ri(5)});else if(e.k==='s')drops.push({x:e.x,y:e.y,w:'shotgun',ammo:3});else if(Math.random()<.5)drops.push({x:e.x,y:e.y,w:'bat',ammo:0});};
 const die=()=>{if(dead)return;dead=70;lives--;S('boom');shk(10);flash=14;A.burst(p.x,p.y,'#c01030',24,3);dec.push({x:p.x,y:p.y,a:rnd(TAU),k:'body',c:'#ffcf3f'});};
 g.update=()=>{if(g.over)return;m.upd();if(hs){hs--;return;}t++;if(flash)flash--;
  if(dead){dead--;if(dead===0){if(lives<=0){g.over='GAME OVER ON FLOOR '+(fl+1);return;}load();}return;}
  if(clearT){clearT--;if(clearT===0){g.score+=Math.max(0,1500-fT*2|0);fl++;if(fl>=NHM.length){g.over='ALL FLOORS CLEAR! VICTORY';return;}load();}}
  fT++;if(cT)cT--;const k=A.in(0),h=A.hit(0),dx=ax(k),dy=ay(k);if(dx||dy){const d=hyp(dx,dy);mv(p,dx/d*1.7,dy/d*1.7,4);p.st+=.35;if(!m.on)aim=atan2(dy,dx);}if(m.on)aim=atan2(m.y-p.y,m.x-p.x);
  if(p.cd)p.cd--;if(sw)sw--;
  if(!p.w)for(const d of drops)if(hyp(d.x-p.x,d.y-p.y)<9){p.w=d.w;p.ammo=d.ammo;d.got=1;S('coin');break;}drops=drops.filter(d=>!d.got);
  if((h.a||(k.a&&p.w==='pistol'))&&!p.cd){const W_=p.w;if(W_==='pistol'||W_==='shotgun'){if(p.ammo>0){p.ammo--;p.cd=WPN[W_].cd;const n=W_==='shotgun'?5:1;for(let i=0;i<n;i++){const a=aim+(n>1?(i-2)*.1:0);pb.push({x:p.x+cos(aim)*6,y:p.y+sin(aim)*6,vx:cos(a)*7,vy:sin(a)*7,l:n>1?22:80});}S('shoot');shk(W_==='shotgun'?4:2);spark(p.x+cos(aim)*9,p.y+sin(aim)*9,K.y,4,1.5,6);}else{p.cd=12;S('blip');pop('EMPTY - THROW IT',p.x,p.y-16,K.gr);}}
   else{p.cd=W_?20:18;sw=8;S('jump');const rg=W_?19:13;for(const e of en){if(e.dead)continue;const d=hyp(e.x-p.x,e.y-p.y);if(d<rg+4&&Math.abs(dang(aim,atan2(e.y-p.y,e.x-p.x)))<1.1)killE(e,aim);}}}
  if(h.b&&p.w){thr.push({x:p.x,y:p.y,vx:cos(aim)*6.5,vy:sin(aim)*6.5,w:p.w,ammo:p.ammo,s:0,l:40});p.w=null;p.ammo=0;S('jump');}
  for(const q of thr){q.s+=.5;q.l--;const nx=q.x+q.vx,ny=q.y+q.vy;if(tile(nx,ny)||q.l<=0){q.l=0;drops.push({x:q.x,y:q.y,w:q.w,ammo:q.ammo});spark(q.x,q.y,'#ffffff',3,1,8);continue;}q.x=nx;q.y=ny;for(const e of en)if(!e.dead&&hyp(e.x-q.x,e.y-q.y)<8){killE(e,atan2(q.vy,q.vx));q.vx*=-.3;q.vy*=-.3;}}thr=thr.filter(q=>q.l>0);
  for(const b of pb){b.x+=b.vx;b.y+=b.vy;b.l--;if(tile(b.x,b.y)){b.l=0;spark(b.x-b.vx,b.y-b.vy,K.y,3,1,6);}for(const e of en)if(!e.dead&&b.l>0&&hyp(e.x-b.x,e.y-b.y)<6){killE(e,atan2(b.vy,b.vx));b.l=0;}}pb=pb.filter(b=>b.l>0);
  for(const e of en){if(e.dead)continue;const d=hyp(p.x-e.x,p.y-e.y)||1,a=atan2(p.y-e.y,p.x-e.x),see=d<175&&los(e.x,e.y,p.x,p.y)&&(e.al||d<44||Math.abs(dang(e.a,a))<1.2);
   if(see){if(!e.al){e.al=1;e.rt=Math.round(30-A.ai*10);pop('!',e.x,e.y-14,K.r);}e.tx=p.x;e.ty=p.y;e.a+=dang(e.a,a)*.25;}
   if(!e.al){e.pt++;if(e.pt%150===0)e.a+=PI/2*(ri(2)?1:-1);if(e.pt%150<60){mv(e,cos(e.a)*.4,sin(e.a)*.4,4);}continue;}
   if(e.rt>0){e.rt--;continue;}e.st+=.3;
   if(e.k==='t'){if(e.wt){e.wt--;if(e.wt===0&&d<18)die();}else if(d<14&&see){e.wt=14;}else{const q=hyp(e.tx-e.x,e.ty-e.y)||1;if(q>3)mv(e,(e.tx-e.x)/q*1.45,(e.ty-e.y)/q*1.45,4);e.a+=dang(e.a,atan2(e.ty-e.y,e.tx-e.x))*.3;}}
   else{if(see){e.cd--;if(e.cd<=0){e.cd=e.k==='s'?70:46;const n=e.k==='s'?4:1;for(let i=0;i<n;i++){const aa=e.a+(n>1?(i-1.5)*.13:(rnd(2)-1)*.06);eb.push({x:e.x+cos(aa)*6,y:e.y+sin(aa)*6,vx:cos(aa)*4,vy:sin(aa)*4});}S('shoot');}}else{const q=hyp(e.tx-e.x,e.ty-e.y)||1;if(q>3)mv(e,(e.tx-e.x)/q*1,(e.ty-e.y)/q*1,4);e.a+=dang(e.a,atan2(e.ty-e.y,e.tx-e.x))*.3;e.cd=Math.max(e.cd,18);}}}
  en=en.filter(e=>!e.dead);for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(tile(b.x,b.y))b.d=1;else if(hyp(b.x-p.x,b.y-p.y)<4){b.d=1;die();}}eb=eb.filter(b=>!b.d);
  if(!en.length&&!clearT){clearT=100;S('win');flash=8;pop('FLOOR CLEAR!',160,90,K.g);}};
 const td=(x,y,a,body,head,w,st,mask)=>{rot(x,y,a,()=>{A.c.scale(1.5,1.5);A.c.fillStyle='rgba(0,0,0,.35)';A.c.beginPath();A.c.ellipse(-.5,0,4.6,6.8,0,0,TAU);A.c.fill();const s=sin(st||0)*2;R(-3+s,-5,4,3,'#1a1a1a');R(-3-s,2,4,3,'#1a1a1a');A.c.fillStyle=body;A.c.beginPath();A.c.ellipse(0,0,3.2,5.5,0,0,TAU);A.c.fill();R(1,-5,5,2,body);R(1,3,5,2,body);
  if(w==='bat'){R(4,2,11,2,'#a07040');}else if(w==='pistol'){R(5,-1,6,2,'#303030');}else if(w==='shotgun'){R(4,-1,11,2,'#503020');}C(.5,0,3.2,head);if(mask){R(-1,-1,3,2,'#ff3040');R(3,-1,2,2,'#ff9020');}});};
 g.draw=()=>{const pl=PAL[fl];
  X.cache('nh_floor'+fl,()=>{A.cls('#08040e');for(let r=0;r<13;r++)for(let c=0;c<20;c++){const x=c*TS_,y=OY+r*TS_;if(map[r][c]!=='#'){const d=(r+c)%2?pl[1]:A.mix(pl[1],'#000000',.3);R(x,y,16,16,d);R(x+1,y+1,14,1,'rgba(255,255,255,.04)');if(hash(c+fl*20,r)>.85){X.rr(x+3,y+3,10,10,2,'rgba(255,255,255,.04)');}}}
   A.c.globalAlpha=.16;for(let c=0;c<=20;c++)L(c*16,OY,c*16,OY+208,pl[0]);for(let r=0;r<=13;r++)L(0,OY+r*16,W,OY+r*16,pl[0]);A.c.globalAlpha=1;
   /* walls: dark slabs with a glowing neon rim where they meet the floor */
   for(let r=0;r<13;r++)for(let c=0;c<20;c++)if(map[r][c]==='#'){const x=c*TS_,y=OY+r*TS_;R(x,y,16,16,X.lg(x,y,x,y+16,['#1c1028','#0e0818']));}
   const o=A.c.globalCompositeOperation;A.c.globalCompositeOperation='lighter';
   for(let pass=0;pass<2;pass++){A.c.strokeStyle=pass?pl[0]:A.mix(pl[0],'#000000',.5);A.c.lineWidth=pass?1.2:4;A.c.globalAlpha=pass?1:.45;A.c.beginPath();
    for(let r=0;r<13;r++)for(let c=0;c<20;c++)if(map[r][c]==='#'){const x=c*TS_,y=OY+r*TS_;if(r>0&&map[r-1][c]!=='#'){A.c.moveTo(x,y+1);A.c.lineTo(x+16,y+1);}if(r<12&&map[r+1][c]!=='#'){A.c.moveTo(x,y+15);A.c.lineTo(x+16,y+15);}if(c>0&&map[r][c-1]!=='#'){A.c.moveTo(x+1,y);A.c.lineTo(x+1,y+16);}if(c<19&&map[r][c+1]!=='#'){A.c.moveTo(x+15,y);A.c.lineTo(x+15,y+16);}}A.c.stroke();}
   A.c.globalAlpha=1;A.c.globalCompositeOperation=o||'source-over';X.vignette(.4);});
  GA(.08+.05*sin(t*.05));R(0,OY,W,208,pl[0]);GA1();
  for(const d of dec){if(d.k==='blood'){GA(.75);C(d.x,d.y,d.r,'#8a0018');GA1();}else{GA(.8);td(d.x,d.y,d.a,d.c,'#5a2020',null,0,0);GA1();}}
  for(const d of drops){const c=d.w==='bat'?'#c09050':d.w==='pistol'?'#8888a0':'#b07040';glow(d.x,d.y,7,'#ffffff',.12+.08*sin(t*.2));rot(d.x,d.y,.6,()=>R(-5,-1,d.w==='pistol'?7:11,3,c));}
  for(const q of thr)rot(q.x,q.y,q.s,()=>R(-5,-1,10,3,'#ffffff'));
  for(const e of en){if(!e.al&&e.k!=='t'){GA(.07);P([[e.x,e.y],[e.x+cos(e.a-1.2)*60,e.y+sin(e.a-1.2)*60],[e.x+cos(e.a+1.2)*60,e.y+sin(e.a+1.2)*60]],'#ffffff',1);GA1();}td(e.x,e.y,e.a,e.k==='t'?'#e8e8e8':e.k==='s'?'#606070':'#9090a8','#2a1a10',e.k==='t'?'bat':e.k==='s'?'shotgun':'pistol',e.st,0);if(e.wt)A.ring(e.x,e.y,9,K.r);}
  if(!dead){X.glow(p.x,p.y,14,pl[0],.25);td(p.x,p.y,aim,'#5a3a9a','#fff3d6',p.w,p.st,1);if(sw){GA(sw/8);const rg=p.w?19:13;A.c.strokeStyle='#ffffff';A.c.lineWidth=2;A.c.beginPath();A.c.arc(p.x,p.y,rg,aim-1+(8-sw)*.12,aim+1-(8-sw)*.1);A.c.stroke();GA1();}}
  for(const b of pb)L(b.x,b.y,b.x-b.vx,b.y-b.vy,'#fff3a0',2);for(const b of eb){glow(b.x,b.y,4,K.r,.4);L(b.x,b.y,b.x-b.vx,b.y-b.vy,'#ff8080',2);}
  if(flash){GA(flash/22);R(0,0,W,H,dead?'#ff0030':'#ffffff');GA1();}vign(.45);m.draw(pl[0]);
  R(0,0,W,OY,'#000000');T('FLOOR '+(fl+1)+'/'+NHM.length,6,4,pl[0],1);T('SCORE '+g.score,6,14,K.w,1);T((p.w||'FISTS').toUpperCase()+(p.w==='pistol'||p.w==='shotgun'?' '+p.ammo:''),160,4,K.w,1,'c');T('FOES '+en.length,160,14,K.gr,1,'c');for(let i=0;i<lives;i++)heart(W-10-i*11,9,K.r,1);if(cT>0&&combo>1)T('COMBO X'+combo,W-6,16,K.y,1,'r');
  if(dead)T('DOWN! RESTARTING FLOOR',160,120,K.w,2,'c');else if(clearT)T('FLOOR CLEAR',160,110,pl[0],3,'c');};
 return g;}});

/* ---- RUN N GUN ---- */
A.add({id:'runngun',name:'RUN N GUN',cat:'ACTION',mouse:1,how:'ARROWS RUN AND AIM, HOLD A FIRES, B JUMPS, DOWN+B THROWS A GRENADE.',make(){
 const g={over:null,score:0},GY=204,LEN=2700,m=aimer();
 const GUN={PISTOL:{r:10,n:1,v:6,d:1},HEAVY:{r:4,n:1,v:7,d:1,a:200},SPREAD:{r:14,n:3,v:6,d:1,a:40}};
 let p={x:40,y:GY,vx:0,vy:0,on:1,f:1,st:0,cr:0},camX=0,gun='PISTOL',ammo=0,gren=8,gcd=0,lives=3,dead=0,inv=90,aim=0,pb=[],eb=[],gr=[],ex=[],en=[],items=[],pows=[],boss=null,lock=0,t=0,hs=0,fl=0,flc='#fff',won=0,mf=0;
 const plats=[],deco=[],spawns=[],r=srng(2024);
 for(let x=300;x<LEN-200;x+=180+r()*160){const w=60+r()*70,h=r()<.5?44:76;plats.push({x,y:GY-h,w,k:h>50?1:0});}
 for(let x=60;x<LEN+300;x+=50+r()*90)deco.push({x,k:r()<.45?0:r()<.6?1:2,s:.7+r()*.6});
 for(let x=360;x<LEN-100;x+=150+r()*70){const k=x>800&&x<860?'tank':x>1500&&x<1580?'tank':x>1150&&x<1240?'heli':x>2050&&x<2140?'heli':'sold';spawns.push({x,k,n:k==='sold'?1+flo(r()*3):1});}
 [620,1380,2240].forEach((x,i)=>pows.push({x,y:GY,free:0,t:0,it:['HEAVY','SPREAD','HEAVY'][i]}));
 const gy=(x,y0)=>{let b=GY;for(const q of plats)if(x>q.x&&x<q.x+q.w&&q.y>=y0-1&&q.y<b)b=q.y;return b;};
 const boom=(x,y,rad,hurtsP)=>{ex.push({x,y,r:rad,t:18});S('boom');shk(rad>25?8:5);A.burst(x-camX,y,K.o,18,3);A.burst(x-camX,y,K.y,10,2);for(const e of en)if(!e.dead&&hyp(e.x-x,e.y-10-y)<rad+12)hitE(e,hurtsP?0:8);if(boss&&!hurtsP&&hyp(boss.x-x,boss.y-20-y)<rad+30)hitB(8);if(hurtsP&&hyp(p.x-x,p.y-10-y)<rad+4)die();};
 const hitE=(e,d)=>{if(!d)return;e.hp-=d;e.fl=4;if(e.hp<=0&&!e.dead){e.dead=1;const pts={sold:100,tank:1000,heli:800}[e.k];g.score+=pts;pop('+'+pts,e.x-camX,e.y-30,K.y);if(e.k!=='sold'){boom(e.x,e.y-12,34,false);hs=6;}else{A.burst(e.x-camX,e.y-12,'#c02020',10,2);S('hit');if(Math.random()<.06)items.push({x:e.x,y:e.y-10,vy:-2,k:'G'});}}};
 const hitB=d=>{boss.hp-=d;boss.fl=3;g.score+=d|0;};
 const die=()=>{if(dead||inv||won)return;dead=70;lives--;S('lose');shk(8);fl=12;flc='#ff2020';A.burst(p.x-camX,p.y-12,'#c02020',20,2.5);gun='PISTOL';};
 g.update=()=>{if(g.over)return;m.upd();if(hs){hs--;return;}t++;if(fl)fl--;if(mf)mf--;
  if(won){won--;if(won===0){g.score+=lives*1000;g.over='MISSION COMPLETE! VICTORY';}}
  if(dead){dead--;if(dead===0){if(lives<=0){g.over='MISSION FAILED';return;}inv=120;p.y=GY-40;p.vy=0;p.x=Math.max(p.x,camX+40);}}
  else{if(inv)inv--;const k=A.in(0),h=A.hit(0),dx=ax(k);p.cr=k.d&&p.on;if(dx)p.f=dx;const sp=p.cr?0:1.8;p.vx=dx*sp;if(dx&&p.on)p.st+=.3;
   if(h.b){if(k.d&&gren>0&&!gcd){gren--;gcd=26;gr.push({x:p.x+p.f*6,y:p.y-18,vx:p.f*2.6+p.vx*.5,vy:-4.2,e:0});S('jump');}else if(p.on&&!k.d){p.vy=-6.4;p.on=0;S('jump');}}if(gcd)gcd--;
   if(m.on)aim=atan2(m.y-(p.y-15),m.x-camX-p.x);else{let vy2=k.u?-1:(k.d&&!p.on)?1:0,vx2=dx;if(!vx2&&!vy2)vx2=p.f;if(k.u&&!dx)vx2=0;aim=atan2(vy2,vx2);}if(cos(aim)>.1)p.f=1;else if(cos(aim)<-.1)p.f=-1;
   const G=GUN[gun];if(A.fire(G.r)){const ox=p.x+cos(aim)*11,oy=p.y-(p.cr?10:16)+sin(aim)*11;for(let i=0;i<G.n;i++){const a=aim+(G.n>1?(i-1)*.14:(gun==='HEAVY'?(rnd(2)-1)*.06:0));pb.push({x:ox,y:oy,vx:cos(a)*G.v,vy:sin(a)*G.v,l:70});}mf=3;S('shoot');if(gun!=='PISTOL'){ammo--;if(ammo<=0){gun='PISTOL';pop('OUT OF AMMO',160,60,K.gr);}}}
   const py0=p.y;p.vy+=.32;p.x+=p.vx;p.y+=p.vy;p.x=cl(p.x,camX+6,lock?camX+314:LEN+300);p.on=0;if(p.vy>=0){const b=gy(p.x,py0);if(p.y>=b&&py0<=b+1){p.y=b;p.vy=0;p.on=1;}}
   if(!lock)camX=cl(Math.max(camX,p.x-130),0,LEN);if(!lock&&p.x>LEN+120){lock=1;camX=LEN;boss={x:LEN+250,y:GY,hp:260,mh:260,t:0,vx:-.6,fl:0,jy:0,jv:0};S('boom');pop('WARNING: BOSS',160,80,K.r);}}
  while(spawns.length&&spawns[0].x<camX+340){const s=spawns.shift();for(let i=0;i<s.n;i++){if(s.k==='sold')en.push({k:'sold',x:camX+330+i*22,y:GY,hp:2,cd:60+ri(60),f:-1,st:0,fl:0,gren:Math.random()<.3,vy:0});else if(s.k==='tank')en.push({k:'tank',x:camX+360,y:GY,hp:32,cd:100,fl:0,f:-1});else en.push({k:'heli',x:camX+360,y:58,hp:20,cd:80,fl:0,f:-1});}}
  for(const e of en){if(e.dead)continue;if(e.fl)e.fl--;e.cd--;const dx=p.x-e.x;
   if(e.k==='sold'){e.f=dx<0?-1:1;if(Math.abs(dx)>110){e.x+=e.f*1.1;e.st+=.3;}if(e.cd<=0&&!dead&&Math.abs(dx)<300){e.cd=90+ri(60);if(e.gren){eb.push({x:e.x,y:e.y-20,vx:dx/60,vy:-4,gr:1});}else eb.push({x:e.x+e.f*8,y:e.y-15,vx:e.f*2.6,vy:cl((p.y-15-(e.y-15))/Math.max(40,Math.abs(dx))*2.6,-1,1)});S('blip');}e.y=gy(e.x,e.y);}
   else if(e.k==='tank'){e.x+=dx<-90?-.45:dx>-40?.35:0;e.f=-1;if(e.cd<=0){e.cd=150;eb.push({x:e.x-24,y:e.y-14,vx:-2.2,vy:0,sh:1});S('boom');shk(3);}if(Math.abs(dx)<22&&p.y>e.y-26)die();}
   else{e.x+=cl(dx*.02,-1.2,1.2);e.y=58+sin(t*.05)*8;if(e.cd<=0&&Math.abs(dx)<60){e.cd=70;eb.push({x:e.x,y:e.y+12,vx:0,vy:1,bomb:1});S('blip');}}
   if(e.x<camX-60)e.dead=1;}
  en=en.filter(e=>!e.dead);
  if(boss){const B=boss;B.t++;if(B.fl)B.fl--;const ph=flo(B.t/200)%3,rage=B.hp<B.mh/2;if(!B.jv&&B.jy===0){B.x+=B.vx*(rage?1.6:1);if(B.x<LEN+150||B.x>LEN+290)B.vx*=-1;}
   if(ph===0&&B.t%(rage?50:70)===0){for(let i=0;i<3;i++)eb.push({x:B.x-30,y:B.y-60,vx:-1.2-i*.9,vy:-3.5,gr:1});S('boom');}
   if(ph===1&&B.t%6===0&&B.t%200>40&&B.t%200<120){const a=PI+sin(B.t*.06)*.5+.15;eb.push({x:B.x-34,y:B.y-36,vx:cos(a)*3,vy:sin(a)*3});S('shoot');}
   if(ph===2&&B.t%200===60){B.jv=-6;}if(B.jv||B.jy<0){B.jv+=.25;B.jy+=B.jv;if(B.jy>=0){B.jy=0;B.jv=0;shk(10);S('boom');eb.push({x:B.x-40,y:GY-6,vx:-2.6,vy:0,wave:1},{x:B.x+40,y:GY-6,vx:2.6,vy:0,wave:1});}}
   if(Math.abs(p.x-B.x)<40&&p.y>B.y+B.jy-60)die();if(B.hp<=0){boom(B.x,B.y-30,50,false);boom(B.x-20,B.y-10,30,false);boss=null;won=120;eb=[];g.score+=5000;A.confetti();hs=10;}}
  for(const b of pb){b.x+=b.vx;b.y+=b.vy;b.l--;if(b.y>GY)b.l=0;for(const e of en){if(e.dead||b.l<=0)continue;const hw=e.k==='tank'?26:e.k==='heli'?22:6,hh=e.k==='tank'?26:e.k==='heli'?12:22,cy=e.k==='heli'?e.y:e.y-hh/2;if(Math.abs(b.x-e.x)<hw&&Math.abs(b.y-cy)<hh/2+2){b.l=0;hitE(e,GUN[gun].d);spark(b.x-camX,b.y,K.y,3,1.2,6);}}
   if(boss&&b.l>0&&Math.abs(b.x-boss.x)<40&&b.y>boss.y+boss.jy-70&&b.y<boss.y+boss.jy){b.l=0;hitB(1);spark(b.x-camX,b.y,K.y,3,1.2,6);}}pb=pb.filter(b=>b.l>0&&b.x>camX-10&&b.x<camX+330&&b.y>-10);
  for(const q of gr){q.vy+=.2;q.x+=q.vx;q.y+=q.vy;if(q.y>=gy(q.x,q.y-q.vy)||en.some(e=>Math.abs(e.x-q.x)<14&&Math.abs(e.y-12-q.y)<14)||(boss&&Math.abs(boss.x-q.x)<36&&q.y>boss.y-70)){q.e=1;boom(q.x,q.y,30,false);}}gr=gr.filter(q=>!q.e);
  for(const b of eb){if(b.gr){b.vy+=.18;}b.x+=b.vx;b.y+=b.vy;if((b.gr||b.bomb)&&b.y>=gy(b.x,b.y-b.vy)){b.d=1;boom(b.x,b.y,22,true);continue;}if(b.y>GY+4||b.x<camX-20||b.x>camX+340)b.d=1;const hr=b.sh?9:b.wave?7:4;if(!dead&&Math.abs(b.x-p.x)<hr+3&&b.y>p.y-(p.cr?12:22)-hr&&b.y<p.y+hr){b.d=1;die();}}eb=eb.filter(b=>!b.d);ex.forEach(e=>e.t--);ex=ex.filter(e=>e.t>0);
  for(const w of pows){if(!w.free&&Math.abs(w.x-p.x)<12&&Math.abs(w.y-p.y)<20){w.free=1;g.score+=500;S('coin');pop('THANK YOU!',w.x-camX,w.y-40,K.g);items.push({x:w.x+10,y:w.y-20,vy:-3,k:w.it});}if(w.free){w.t++;if(w.t>50)w.x-=2;}}
  for(const it of items){it.vy=(it.vy||0)+.2;it.y=Math.min(it.y+it.vy,gy(it.x,it.y)-6);if(hyp(it.x-p.x,it.y-(p.y-10))<14){it.got=1;S('win');if(it.k==='G'){gren+=5;pop('+5 GRENADES',160,60,K.g);}else{gun=it.k;ammo=GUN[it.k].a;pop(it.k==='HEAVY'?'HEAVY MACHINE GUN!':'SPREAD GUN!',160,60,K.y);}}}items=items.filter(i=>!i.got);};
 const soldier=(x,y,f,st,col,cap,fl2)=>{A.person(x,y,{s:.72,c:fl2?'#ffffff':col,pants:'#4a4030',st,d:f,cap,id:1});};
 g.draw=()=>{fillG(0,0,W,H,grad(0,0,0,GY,[[0,'#ff9a5a'],[.6,'#ffd09a'],[1,'#ffe8c0']]));glow(250,60,30,'#fff3c0',.5);C(250,60,16,'#fff8e0');
  for(let i=0;i<8;i++){const bx=((i*90-camX*.15)%720+720)%720-90;P([[bx,GY-20],[bx+50,GY-90-(i%3)*20],[bx+110,GY-20]],'#c98a6a',1);}
  for(let i=0;i<10;i++){const bx=((i*70-camX*.4)%700+700)%700-70;C(bx+35,GY+10,50,'rgb(224,176,128)');}
  fillG(0,GY,W,H-GY,grad(0,GY,0,H,[[0,'#d8a868'],[1,'#a87840']]));fillG(0,GY,W,2,'#f0c890');for(let i=0;i<12;i++){const sx=((i*37-camX)%340+340)%340-10;R(sx,GY+8+(i%3)*8,4,2,'#8a6030');}
  for(const d of deco){const sx=d.x-camX;if(sx<-40||sx>W+40)continue;if(d.k===0){L(sx,GY,sx+4*d.s,GY-46*d.s,'#7a5030',3);for(let a=0;a<5;a++){const an=-PI/2+(a-2)*.6;L(sx+4*d.s,GY-46*d.s,sx+4*d.s+cos(an)*20*d.s,GY-46*d.s+sin(an)*20*d.s+6,'#3a8a3a',3);}}else if(d.k===1){R(sx-10,GY-12,20,12,'#8a8a6a');R(sx-6,GY-16,12,4,'#9a9a7a');}else{C(sx,GY-3,6*d.s,'#9a8a70');}}
  for(const q of plats){const sx=q.x-camX;if(sx>W||sx+q.w<0)continue;for(let i=0;i<q.w;i+=12)R(sx+i,q.y,12,7,i%24?'#b8a070':'#a89060');fillG(sx+4,q.y+7,4,GY-q.y-7,'#6a5030');fillG(sx+q.w-8,q.y+7,4,GY-q.y-7,'#6a5030');}
  for(const w of pows){const sx=w.x-camX;if(sx<-20||sx>W+20)continue;if(!w.free){A.person(sx,w.y,{s:.7,c:'#d8d0b0',pants:'#8a8070',id:4,arm1:.3,arm2:-.3});L(sx-6,w.y-14,sx+6,w.y-14,'#8a6030',2);if(t%40<25)TS('HELP!',sx,w.y-36,K.w,1,'c');}else A.person(sx,w.y,{s:.7,c:'#d8d0b0',pants:'#8a8070',id:4,st:w.t*.4,d:-1,arm2:w.t<50?-2.6:undefined});}
  for(const it of items){const sx=it.x-camX;glow(sx,it.y,9,K.y,.3);R(sx-6,it.y-6,12,12,it.k==='G'?'#4a7a3a':'#c03030');T(it.k,sx,it.y-2,K.w,1,'c');}
  for(const e of en){const sx=e.x-camX;if(e.k==='sold')soldier(sx,e.y,e.f,e.st,'#b8a060','#6a6a3a',e.fl);else if(e.k==='tank'){const c=e.fl?'#ffffff':'#5a6a3a';GA(.3);R(sx-28,e.y-2,56,4,'#000');GA1();R(sx-26,e.y-12,52,11,'#3a3a30');for(let i=0;i<6;i++)C(sx-22+i*9,e.y-6,4,'#2a2a28');R(sx-24,e.y-24,48,12,c);R(sx-12,e.y-32,24,9,c);R(sx-38,e.y-29,26,3,'#3a4a2a');C(sx+4,e.y-28,2,'#20201a');}
   else{const c=e.fl?'#ffffff':'#4a5a4a';R(sx-16,e.y-6,30,12,c);R(sx+14,e.y-3,16,4,c);P([[sx-16,e.y-6],[sx-22,e.y],[sx-16,e.y+6]],'#88c8ff',1);L(sx-24,e.y-9,sx+24,e.y-9,'#202020',2);if(t%4<2)L(sx-24,e.y-9,sx+24,e.y-9,'#888888',1);R(sx-10,e.y+7,24,2,'#202020');}}
  if(boss){const B=boss,sx=B.x-camX,y=B.y+B.jy,c=B.fl?'#ffffff':'#7a3a3a',lg=sin(B.t*.1)*6;for(let i=-1;i<=1;i+=2)for(let j=0;j<2;j++){L(sx+i*(14+j*12),y-28,sx+i*(28+j*14)+lg*j,y,'#3a2a2a',4);}R(sx-36,y-58,72,30,c);R(sx-30,y-66,60,10,c);C(sx-14,y-62,5,K.y);C(sx+14,y-62,5,K.y);R(sx-50,y-44,16,6,'#3a3a3a');R(sx-44,y-40,12,4,'#2a2a2a');}
  if(!dead&&inv%8<5){A.person(p.x-camX,p.y,{s:.75,c:'#3a7a3a',pants:'#3a4a2a',st:p.st,d:p.f,cap:'#2a5a2a',id:2});const sy=p.y-(p.cr?10:16),sx=p.x-camX;L(sx,sy,sx+cos(aim)*11,sy+sin(aim)*11,'#202020',3);if(mf)glow(sx+cos(aim)*13,sy+sin(aim)*13,5,K.y,.9);}
  for(const b of pb)L(b.x-camX,b.y,b.x-camX-b.vx,b.y-b.vy,gun==='HEAVY'?'#ffcf3f':'#fff3a0',2);
  for(const q of gr){C(q.x-camX,q.y,3,'#3a5a2a');}for(const b of eb){const sx=b.x-camX;if(b.sh){C(sx,b.y,5,'#303030');glow(sx+5,b.y,5,K.o,.5);}else if(b.wave){GA(.8);P([[sx-7,GY],[sx,GY-14],[sx+7,GY]],K.o,1);GA1();}else if(b.gr||b.bomb)C(sx,b.y,3,'#404040');else{glow(sx,b.y,3,K.r,.5);C(sx,b.y,1.8,'#ffe0a0');}}
  for(const e of ex){GA(e.t/18);C(e.x-camX,e.y,e.r*(1.2-e.t/30),e.t>10?'#fff3a0':'#ff8030');GA1();}
  if(fl){GA(fl/24);R(0,0,W,H,flc);GA1();}m.draw('#ffffff');
  R(0,0,W,16,'rgba(0,0,0,.5)');T('SCORE '+g.score,6,5,K.w,1);T(gun+(gun!=='PISTOL'?' '+ammo:''),110,5,gun==='PISTOL'?K.w:K.y,1);T('GRENADES '+gren,190,5,K.g,1);for(let i=0;i<lives;i++)A.person(W-10-i*10,15,{s:.3,c:'#3a7a3a',cap:'#2a5a2a',id:2});
  if(boss){bar(60,20,200,6,boss.hp/boss.mh,K.r,'#300010');T('IRON CRAB',160,28,K.y,1,'c');}else if(!lock)bar(110,20,100,3,p.x/(LEN+120),'#ffffff','rgba(0,0,0,.3)');if(dead&&lives<=0)T('MISSION FAILED',160,110,K.r,2,'c');};
 return g;}});

/* ---- DASH PEAK ---- */
const DPR=[
["#####.....##########","#####.....##########","#.......####.......#","#..................#","#...####...........#","#...............B..#","#........####......#","#..................#","#.............####.#","#..................#","#.........###......#","#..................#","#....####..........#","#S.................#","####################"],
["##########.....#####","##########.....#####","#..................#","#..................#","#..........####....#","#..................#","#......O...........#","#..................#","#..................#","#..................#","#..####............#","#...........B......#","#..................#","#S.......^^^^^^^...#","####################"],
["########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","########...#########","#..................#","#...............B..#","#S..^^^^...^^^^^...#","####################"],
["################...#","################...#","#..................#","#..............#####","#..................#","#..........O.......#","#..................#","#..................#","#...####...........#","#..................#","#..................#","#..................#","#..................#","#SJ^^^^^^^^^^^^^^^^#","####################"],
["##########....######","##########....######","#.....####.........#","#..................#","#......O...........#","#.............###..#","#..................#","#.####.............#","#..................#","#.......^^.........#","#......######......#","#.............B....#","#.............####.#","#S..^^^^^^^^.......#","####################"]];
const DPN=['FIRST STEPS','THE DASH','CHIMNEY','SPRING BOARD','THE SUMMIT'];
const dpSolid=(rm,x,y)=>{const c=flo(x/16),r=flo(y/16);if(c<0||c>19)return true;if(r<0)return false;if(r>14)return false;return rm[r][c]==='#';};
const dpHit=(rm,x,y,w,h)=>{const xs=[x,x+w-.01],ys=[y,y+h-.01];for(let q=x+6;q<x+w;q+=6)xs.push(q);for(let q=y+6;q<y+h;q+=6)ys.push(q);for(const a of xs)for(const b of ys)if(dpSolid(rm,a,b))return true;return false;};
/* one physics step; s = state, k = held, h = pressed. returns 'dead' | 'exit' | event or null */
const dpStep=(rm,s,k,h,cry)=>{const PW=8,PH=12;let ev=null;
 const onG=s.vy>=0&&dpHit(rm,s.x-PW/2,s.y+.1,PW,1),wl=dpHit(rm,s.x-PW/2-1.5,s.y-PH+2,1,PH-4),wr=dpHit(rm,s.x+PW/2+.5,s.y-PH+2,1,PH-4);
 if(onG){s.co=6;s.cd=1;s.sta=90;}else if(s.co>0)s.co--;
 const dx=(k.r?1:0)-(k.l?1:0),dy=(k.d?1:0)-(k.u?1:0);if(dx)s.f=dx;
 if(h.b&&s.cd&&!s.da){let ddx=dx,ddy=dy;if(!ddx&&!ddy)ddx=s.f;const m=hyp(ddx,ddy);s.dvx=ddx/m*5.5;s.dvy=ddy/m*5.5;s.da=10;s.cd=0;ev='dash';}
 if(h.a)s.jb=6;else if(s.jb)s.jb--;
 if(s.da){s.da--;s.vx=s.dvx;s.vy=s.dvy;if(!s.da){s.vx*=.6;s.vy*=.5;}}
 else{if(s.lk)s.lk--;const tv=dx*2;if(!s.lk)s.vx+=(tv-s.vx)*(onG?.5:.3);
  const cling=!onG&&((wl&&(dx<0||k.u))||(wr&&(dx>0||k.u)));
  if(s.jb&&(onG||s.co>0)){s.vy=-5.2;s.co=0;s.jb=0;ev='jump';}
  else if(s.jb&&!onG&&(wl||wr)){s.vy=-4.8;s.vx=wl?2.6:-2.6;s.lk=8;s.jb=0;ev='wall';}
  if(cling&&k.u&&s.sta>0&&!s.lk){s.vy=-1.1;s.sta--;}else{s.vy+=.28;if(cling&&s.vy>1.3)s.vy=1.3;}
  if(s.vy>4.5)s.vy=4.5;}
 // move x
 {const ox=s.x;s.x+=s.vx;if(dpHit(rm,s.x-PW/2,s.y-PH,PW,PH)){if(s.vx>0)s.x=Math.floor((s.x+PW/2)/16)*16-PW/2-.01;else s.x=(Math.floor((s.x-PW/2)/16)+1)*16+PW/2+.01;if(dpHit(rm,s.x-PW/2,s.y-PH,PW,PH))s.x=ox;s.vx=0;if(s.da&&!s.dvy)s.da=0;}}
 {const oy=s.y;s.y+=s.vy;if(dpHit(rm,s.x-PW/2,s.y-PH,PW,PH)){if(s.vy>0)s.y=Math.floor(s.y/16)*16;else s.y=(Math.floor((s.y-PH)/16)+1)*16+PH+.01;if(dpHit(rm,s.x-PW/2,s.y-PH,PW,PH))s.y=oy;s.vy=0;}}
 const c0=flo((s.x-PW/2)/16),c1=flo((s.x+PW/2-.01)/16),r0=flo((s.y-PH)/16),r1=flo((s.y-.01)/16);
 for(let r=Math.max(0,r0);r<=Math.min(14,r1);r++)for(let c=Math.max(0,c0);c<=Math.min(19,c1);c++){const ch=rm[r][c];
  if(ch==='^'&&s.y>r*16+8&&s.x+PW/2>c*16+2&&s.x-PW/2<c*16+14)return'dead';
  if(ch==='J'&&s.y>r*16+8&&s.vy>=0){s.vy=-8.2;s.cd=1;s.da=0;ev='spring';}
  if(ch==='O'&&!s.cd&&(!cry||!cry[r*20+c])){s.cd=1;if(cry)cry[r*20+c]=150;ev='crystal';}
  if(ch==='B')ev='berry'+(r*20+c);}
 if(s.y>H+14)return'dead';if(s.y-PH<4)return'exit';return ev;};
A.add({id:'dashpeak',name:'DASH PEAK',cat:'ACTION',time:300,how:'ARROWS MOVE, A JUMPS (ALSO OFF WALLS), B DASHES. HOLD UP ON A WALL TO CLIMB.',make(){
 const g={over:null,score:0};let ri_=0,rm,s,cry={},got={},berries=0,deaths=0,dead=0,best=999,fl=0,t=0,trail=[],intro=0,hair=[];
 const load=()=>{rm=DPR[ri_];cry={};rm.forEach((row,r)=>{const c=row.indexOf('S');if(c>=0)s={x:c*16+8,y:r*16+16,vx:0,vy:0,co:0,cd:1,sta:90,da:0,dvx:0,dvy:0,f:1,jb:0,lk:0};});best=s.y;intro=70;trail=[];};
 load();g._dp=()=>({s,rm,ri_});g._step=dpStep;g._rooms=()=>DPR;
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;if(intro)intro--;for(const kk in cry)if(cry[kk]>0)cry[kk]--;
  if(dead){dead--;if(!dead)load();return;}
  const ev=dpStep(rm,s,A.in(0),A.hit(0),cry);
  if(ev==='dead'){dead=36;deaths++;S('boom');shk(7);fl=8;A.burst(s.x,s.y-6,'#ff4f6d',22,2.6);A.burst(s.x,s.y-6,'#ffffff',8,1.5);return;}
  if(ev==='exit'){g.score+=300;S('win');ri_++;if(ri_>=DPR.length){g.score+=Math.max(0,1000-deaths*20);A.confetti();g.over='SUMMIT REACHED! WIN';return;}pop(DPN[ri_],160,100,K.c);load();return;}
  if(ev==='dash'){S('shoot');shk(2);spark(s.x,s.y-6,'#9adfff',6,1.5,10);}else if(ev==='jump'||ev==='wall'){S('jump');spark(s.x,s.y,'#e0e0f0',4,1,8);}else if(ev==='spring'){S('score');shk(3);}else if(ev==='crystal'){S('coin');spark(s.x,s.y-6,K.g,12,2,12);}
  else if(ev&&ev.startsWith('berry')){const id=ri_+':'+ev;if(!got[id]){got[id]=1;berries++;g.score+=500;S('win');spark(s.x,s.y-8,K.r,18,2.2,14);pop('STRAWBERRY!',s.x,s.y-20,K.r);}}
  if(s.y<best-4){g.score+=flo((best-s.y)/4);best=s.y;}
  if(s.da||t%3===0){trail.push({x:s.x,y:s.y,d:s.da>0});if(trail.length>(s.da?8:4))trail.shift();}};
 g.draw=()=>{const sky=[['#1a2a5a','#6a7ab8'],['#22305e','#8a7ab0'],['#2a2050','#b08aa0'],['#302048','#d8a080'],['#140c30','#ff9a6a']][ri_];
  X.cache('dp_room'+ri_,()=>{X.sky([sky[0],sky[1]]);X.stars(50,ri_+3,0,0,130,.8);X.glow(250,60,30,'#ffffff',.25);
   X.hills(150,70,A.mix(sky[0],'#8090c0',.25),ri_*50,.018,ri_+1);   X.hills(185,45,A.mix(sky[0],'#000000',.35),ri_*90,.025,ri_+5);X.hills(215,25,A.mix(sky[0],'#000000',.55),ri_*130,.035,ri_+9);
   for(let r=0;r<15;r++)for(let c=0;c<20;c++){const ch=rm[r][c],x=c*16,y=r*16;
    if(ch==='#'){const top=r===0||rm[r-1][c]!=='#',hh=hash(c,r+ri_*20);R(x,y,16,16,X.lg(x,y,x+16,y+16,['#4a4464','#36304c','#2a2440']));if(hh>.55){R(x+3+hh*8,y+5,4,2,'rgba(0,0,0,.2)');R(x+2,y+11,3,1,'rgba(255,255,255,.08)');}
     if(top){X.rr(x-.5,y-1,17,6,2.5,X.lg(0,y-1,0,y+5,['#ffffff','#e2ecff','#a8bce0']));if(hh>.4)X.disc(x+4+hh*8,y+5,2,'#e2ecff');R(x,y+5,16,1,'rgba(40,40,80,.35)');}
     if(c>0&&rm[r][c-1]!=='#')R(x,y,1.5,16,'rgba(150,140,200,.5)');if(c<19&&rm[r][c+1]!=='#')R(x+14.5,y,1.5,16,'rgba(0,0,0,.35)');if(r<14&&rm[r+1][c]!=='#')R(x,y+14,16,2,'rgba(0,0,0,.4)');}
    else if(ch==='^'){for(let i=0;i<4;i++){X.poly([[x+i*4,y+16],[x+i*4+2,y+7],[x+i*4+4,y+16]],X.lg(0,y+7,0,y+16,['#ffffff','#a8b8e0']));R(x+i*4+1.6,y+8,.8,6,'rgba(255,255,255,.6)');}}
    else if(ch==='J'){X.block(x+1,y+12,14,4,'#8a5a30',1);}}
   X.vignette(.35);});
  for(let r=0;r<15;r++)for(let c=0;c<20;c++){const ch=rm[r][c],x=c*16,y=r*16;
   if(ch==='J'){X.rr(x+3,y+8,10,4,2,X.lg(0,y+8,0,y+12,['#ff8a8a','#d02a3a']));}
   else if(ch==='O'){const off=cry[r*20+c]>0;if(off){GA(.3);A.ring(x+8,y+8,5,K.g);GA1();}else{const yy=y+8+sin(t*.08)*2;X.glow(x+8,yy,14,'#3dff8b',.45);X.gem(x+8,yy,14,'#3dff8b');}}
   else if(ch==='B'&&!got[ri_+':berry'+(r*20+c)]){const yy=y+8+sin(t*.07)*2;X.glow(x+8,yy,12,'#ff4060',.35);X.orb(x+8,yy+1,5.5,'#ff3a50');P([[x+4,yy-4],[x+8,yy-7],[x+12,yy-4],[x+8,yy-3]],'#4ac050',1);R(x+6,yy,1,1,'#ffe0a0');R(x+9,yy+2,1,1,'#ffe0a0');R(x+7,yy+4,1,1,'#ffe0a0');}}
  for(let i=0;i<24;i++){const sx=(hash(i,9)*W+t*(.3+hash(i,8)*.4)+sin(t*.02+i)*8)%W,sy=(hash(i,7)*H+t*(.4+hash(i,6)*.5))%H;GA(.6);R(sx,sy,1.2,1.2,'#ffffff');}GA1();
  if(!dead){trail.forEach((q,i)=>{GA(i/trail.length*(q.d?.55:.2));X.rr(q.x-4,q.y-12,8,12,3,q.d?'#9adfff':'#ff6a8a');});GA1();const hc=s.cd?'#ff3a5a':'#5ab0ff',fx=s.f,bx=s.x,by=s.y;if(s.cd)X.glow(bx,by-8,10,'#ff3a5a',.18);
   const st=Math.abs(s.vx)>.5&&!s.da?sin(t*.4)*1.5:0;R(bx-3+st*.5,by-4,2.5,4,'#2a2448');R(bx+.5-st*.5,by-4,2.5,4,'#2a2448');X.rr(bx-4,by-10,8,7,2,X.lg(bx-4,0,bx+4,0,['#7a6ad0','#4a3a8a']));R(bx-4,by-6,8,1.5,'#ffcf3f');
   for(let i=0;i<4;i++)X.disc(bx-fx*(3+i*1.8),by-12+i*.6+sin(t*.2+i)*.6,2.6-i*.35,hc);X.disc(bx,by-12.5,3.6,'#f6d2b8');X.disc(bx-fx*.5,by-14,3.5,hc);R(bx+fx*1.4-.5,by-13,1,1.4,'#202020');if(s.sta<30&&t%10<5)X.rr(bx-4,by-10,8,7,2,'rgba(255,60,80,.6)');}
  if(fl){GA(fl/16);R(0,0,W,H,'#ffffff');GA1();}
  R(0,0,W,13,'rgba(0,0,0,.45)');T(DPN[ri_]+'  '+(ri_+1)+'/'+DPR.length,4,4,K.c,1);T('DEATHS '+deaths,175,4,K.w,1);T('BERRIES '+berries,W-4,4,K.r,1,'r');if(intro)T(DPN[ri_],160,100,K.w,2,'c');};
 return g;}});

/* ---- BULLET HELL ---- */
A.add({id:'bullethell',name:'BULLET HELL',cat:'ACTION',time:240,how:'HOLD A FIRES, HOLD B FOCUSES (SLOW), DOUBLE-TAP B BOMBS. GRAZE FOR POINTS.',make(){
 const g={over:null,score:0},FX=8,FW=204,FY=4,FH=232,CX=FX+FW/2;
 let p={x:CX,y:200,inv:120},bl=[],sh=[],en=[],it=[],t=0,lives=3,bombs=3,pow=1,graze=0,lastB=-99,bombT=0,boss=null,wave=0,fl=0,flc='#fff',hs=0,stars=[],cap=1,won=0,focus=false;
 for(let i=0;i<50;i++)stars.push({x:FX+rnd(FW),y:rnd(H),s:.3+rnd(1.5)});
 const shoot=(x,y,a,v,c,r,o)=>{if(bl.length<800)bl.push(Object.assign({x,y,vx:cos(a)*v,vy:sin(a)*v,c,r:r||2.5,gz:0},o||{}));};
 const aimA=(x,y)=>atan2(p.y-y,p.x-x);
 const W8=[ // fairy waves: [frame,type,arg]
  [60,0,1],[220,0,-1],[380,1,0],[560,3,0],[720,0,1],[760,0,-1],[900,2,0],[1100,1,0],[1260,3,0],[1420,0,1],[1460,0,-1],[1600,2,0],[1800,1,0],[1820,3,0],[2000,2,0],[2150,0,1],[2190,0,-1]];
 const spawnW=(k,a)=>{if(k===0)for(let i=0;i<5;i++)en.push({k:0,x:a>0?FX-10-i*16:FX+FW+10+i*16,y:30+i*8,vx:a*1.4,vy:.35,hp:4,t:-i*8,cd:40+i*10,col:'#ff7ab8'});
  else if(k===1)for(let i=0;i<3;i++)en.push({k:1,x:CX+(i-1)*60,y:-10,vx:0,vy:1.6,stop:50+i%2*20,hp:14,t:0,cd:50,col:'#7ad0ff'});
  else if(k===2)en.push({k:2,x:CX,y:-14,vx:0,vy:1.2,stop:70,hp:60,t:0,cd:20,col:'#ffcf3f',big:1});
  else for(let i=0;i<4;i++)en.push({k:3,x:i<2?FX+20+i*24:FX+FW-20-(i-2)*24,y:-10-i*10,vx:0,vy:.9,hp:8,t:0,cd:30,col:'#9dff6a'});};
 const CARDS=[{n:'STARFALL SPIRAL',hp:340},{n:'ROSE BLOOM',hp:380},{n:'AIMED LATTICE',hp:400},{n:'NOVA STORM',hp:460}];
 const kill=e=>{e.dead=1;g.score+=e.big?2000:300;A.burst(e.x,e.y,e.col,e.big?24:10,e.big?3:2);S('hit');const n=e.big?6:e.k===1?2:1;for(let i=0;i<n;i++)it.push({x:e.x+rnd(16)-8,y:e.y,vy:-1.6-rnd(1),k:Math.random()<.5?'p':'s'});};
 const hit=()=>{lives--;inv();S('boom');shk(10);fl=16;flc='#ff3050';hs=10;cap=0;A.burst(p.x,p.y,K.p,30,3);bl.forEach(b=>spark(b.x,b.y,b.c,1,1,10));bl=[];bombs=Math.max(bombs,3);pow=Math.max(1,pow-1);if(lives<0){lives=0;g.over='SHOT DOWN';S('lose');}};
 const inv=()=>{p.inv=150;};
 const bomb=()=>{bombs--;bombT=90;p.inv=Math.max(p.inv,120);cap=0;S('boom');shk(12);fl=14;flc='#ffffff';bl.forEach(b=>{g.score+=10;spark(b.x,b.y,'#ffe8ff',1,1.5,12);});bl=[];en.forEach(e=>{e.hp-=24;if(e.hp<=0&&!e.dead)kill(e);});if(boss)boss.hp-=40;};
 const startCard=i=>{boss.card=i;boss.hp=boss.mh=CARDS[i].hp;boss.ct=0;cap=1;bl.forEach(b=>spark(b.x,b.y,b.c,1,1,8));bl=[];pop(CARDS[i].n,CX,60,K.p);S('score');};
 g.update=()=>{if(g.over)return;if(hs){hs--;return;}t++;if(fl)fl--;if(bombT)bombT--;if(p.inv)p.inv--;
  if(won){won--;if(won===0){g.score+=lives*5000+bombs*1000;g.over='STAGE CLEAR! VICTORY';}}
  const k=A.in(0),h=A.hit(0);focus=k.b;if(h.b){if(t-lastB<14&&bombs>0&&!bombT)bomb();lastB=t;}
  const sp=focus?1.1:2.6,dx=ax(k),dy=ay(k),m=hyp(dx,dy)||1;p.x=cl(p.x+dx/m*sp,FX+5,FX+FW-5);p.y=cl(p.y+dy/m*sp,FY+10,FY+FH-6);
  if(A.fire(5)){const P_=Math.floor(pow);sh.push({x:p.x-4,y:p.y-6,vx:0,vy:-7,d:1},{x:p.x+4,y:p.y-6,vx:0,vy:-7,d:1});for(let i=1;i<P_;i++){const s=focus?.04*i:.16*i;sh.push({x:p.x-6,y:p.y,vx:-sin(s)*7,vy:-cos(s)*7,d:.8,hm:focus},{x:p.x+6,y:p.y,vx:sin(s)*7,vy:-cos(s)*7,d:.8,hm:focus});}if(t%10===0)S('shoot');}
  while(wave<W8.length&&W8[wave][0]<=t){spawnW(W8[wave][1],W8[wave][2]);wave++;}
  if(wave>=W8.length&&!boss&&!won&&t>2350&&!en.length){boss={x:CX,y:-30,ty:60,card:-1,hp:1,mh:1,ct:0,t:0,fl:0};pop('WARNING!',CX,100,K.r);S('lose');}
  for(const e of en){e.t++;if(e.t<0)continue;if(e.stop!==undefined){if(e.t<e.stop){e.y+=e.vy;}else if(e.t>e.stop+200){e.y-=1;}}else{e.x+=e.vx;e.y+=e.vy;}if(e.fl)e.fl--;e.cd--;
   if(e.cd<=0&&e.y>0&&e.y<FY+FH*.6){if(e.k===0){shoot(e.x,e.y,aimA(e.x,e.y),2.2,'#ff6ab0');e.cd=50;}else if(e.k===1){const o=rnd(TAU);for(let i=0;i<14;i++)shoot(e.x,e.y,o+i/14*TAU,1.4,'#6ab8ff',2.5);e.cd=60;}else if(e.k===2){for(let s=0;s<4;s++)shoot(e.x,e.y,e.t*.09+s*PI/2,1.7,'#ffcf3f',3);e.cd=5;}else{shoot(e.x,e.y,PI/2+(rnd(2)-1)*.1,2.4,'#9dff6a',2);e.cd=14;}}
   if(e.y>H+20||e.x<FX-60||e.x>FX+FW+60||e.y<-40&&e.t>60)e.dead=e.dead||2;if(!p.inv&&hyp(e.x-p.x,e.y-p.y)<8)hit();}en=en.filter(e=>!e.dead);
  if(boss){const B=boss;B.t++;if(B.fl)B.fl--;if(B.card<0){B.y+=(B.ty-B.y)*.05;if(B.t>70)startCard(0);}else{B.ct++;const c=B.card,ct=B.ct;B.x=CX+sin(B.t*.013)*50;B.y=55+sin(B.t*.021)*12;
    if(ct>50){if(c===0&&ct%4===0){for(let s=0;s<5;s++){const a=ct*.035+s*TAU/5;shoot(B.x,B.y,a,1.7,'#c070ff',2.6);shoot(B.x,B.y,-a*1.1,1.4,'#ff70c0',2.2);}}
     if(c===1&&ct%28===0){const o=ct*.05,n=24;for(let i=0;i<n;i++){const a=o+i/n*TAU;shoot(B.x,B.y,a,1.3,'#ff5a8a',3,{cv:.008*((ct/28)%2?1:-1)});}S('blip');}
     if(c===2){if(ct%36===0){const a=aimA(B.x,B.y);for(let i=-4;i<=4;i++)shoot(B.x,B.y,a+i*.12,2.3,'#6ae0ff',2.4);S('blip');}if(ct%10===0){shoot(FX+2,FY+(ct*3)%100,0.3,1.8,'#ffffff',2);shoot(FX+FW-2,FY+(ct*3)%100,PI-.3,1.8,'#ffffff',2);}}
     if(c===3){if(ct%3===0)shoot(B.x,B.y,rnd(TAU),.9+rnd(1.4),['#ff4f6d','#ffcf3f','#4dabff'][ct%3],2.2);if(ct%60===0){for(let i=0;i<30;i++)shoot(B.x,B.y,i/30*TAU+ct,1.6,'#ffffff',3.5);S('blip');}}}
    if(B.hp<=0||ct>60*40){const ok=B.hp<=0;if(ok&&cap){g.score+=10000;pop('CARD BONUS!',CX,90,K.y);}A.burst(B.x,B.y,K.p,30,3.5);shk(8);S('win');hs=8;
     if(c<3){startCard(c+1);it.push({x:B.x,y:B.y,vy:-2,k:'p'},{x:B.x-10,y:B.y,vy:-2.4,k:'s'},{x:B.x+10,y:B.y,vy:-2.4,k:'s'});}else{boss=null;won=110;bl=[];A.burst(B.x,B.y,K.y,60,4);A.confetti();g.score+=20000;}}}
   if(boss&&!p.inv&&hyp(boss.x-p.x,boss.y-p.y)<12)hit();}
  for(const s of sh){if(s.hm){let tg=boss||en[0];if(tg){const a=atan2(tg.y-s.y,tg.x-s.x);s.vx+=cos(a)*.6;s.vy+=sin(a)*.6;const v=hyp(s.vx,s.vy)||1;s.vx=s.vx/v*7;s.vy=s.vy/v*7;}}s.x+=s.vx;s.y+=s.vy;
   for(const e of en)if(!e.dead&&e.t>=0&&Math.abs(e.x-s.x)<(e.big?12:8)&&Math.abs(e.y-s.y)<(e.big?12:8)){s.y=-99;e.hp-=s.d;e.fl=3;g.score+=10;if(e.hp<=0)kill(e);break;}
   if(boss&&boss.card>=0&&s.y>0&&Math.abs(boss.x-s.x)<12&&Math.abs(boss.y-s.y)<16){s.y=-99;boss.hp-=s.d;boss.fl=2;g.score+=10;}}sh=sh.filter(s=>s.y>-10&&s.x>FX-10&&s.x<FX+FW+10);
  for(const b of bl){if(b.cv){const a=atan2(b.vy,b.vx)+b.cv,v=hyp(b.vx,b.vy);b.vx=cos(a)*v;b.vy=sin(a)*v;}b.x+=b.vx;b.y+=b.vy;const d=hyp(b.x-p.x,b.y-p.y);
   if(d<b.r+1.6&&!p.inv){hit();break;}if(d<b.r+11&&!b.gz){b.gz=1;graze++;g.score+=50;if(graze%3===0)S('blip');spark(p.x+(b.x-p.x)*.5,p.y+(b.y-p.y)*.5,'#ffffff',2,1.2,8);}}
  bl=bl.filter(b=>b.x>FX-8&&b.x<FX+FW+8&&b.y>-8&&b.y<H+8);
  for(const q of it){if(p.y<80||hyp(q.x-p.x,q.y-p.y)<34){const a=atan2(p.y-q.y,p.x-q.x);q.x+=cos(a)*5;q.y+=sin(a)*5;}else{q.vy=Math.min(1.8,q.vy+.06);q.y+=q.vy;}if(hyp(q.x-p.x,q.y-p.y)<8){q.got=1;if(q.k==='p'){if(pow<4){pow=Math.min(4,pow+.25);if(Math.floor(pow)!==Math.floor(pow-.25))pop('POWER UP',p.x,p.y-20,K.r);}g.score+=100;}else g.score+=p.y<80?1000:300;if(t%2===0)S('coin');}}it=it.filter(q=>!q.got&&q.y<H+10);
  for(const s of stars){s.y+=s.s;if(s.y>H){s.y=0;s.x=FX+rnd(FW);}}};
 const drawB=()=>{const by={};for(const b of bl)(by[b.c]=by[b.c]||[]).push(b);const c=A.c;for(const col in by){c.fillStyle=col;GA(.35);c.beginPath();for(const b of by[col]){c.moveTo(b.x+b.r+1.5,b.y);c.arc(b.x,b.y,b.r+1.5,0,TAU);}c.fill();GA1();c.beginPath();for(const b of by[col]){c.moveTo(b.x+b.r,b.y);c.arc(b.x,b.y,b.r,0,TAU);}c.fill();c.fillStyle='#ffffff';c.beginPath();for(const b of by[col]){c.moveTo(b.x+b.r*.5,b.y);c.arc(b.x,b.y,b.r*.5,0,TAU);}c.fill();}};
 g.draw=()=>{A.cls('#05030c');fillG(FX,FY,FW,FH,grad(0,FY,0,FY+FH,[[0,'#1a0a3a'],[.5,'#0a0a28'],[1,'#120618']]));A.c.save();A.c.beginPath();A.c.rect(FX,FY,FW,FH);A.c.clip&&A.c.clip();
  GA(.25);C(FX+60,(t*.3)%400-80,60,'rgb(90,40,140)');C(FX+150,(t*.3+200)%400-80,50,'rgb(40,60,140)');GA1();for(const s of stars){GA(s.s/2);R(s.x,s.y,1,s.s>1.2?2:1,'#ffffff');}GA1();
  if(bombT){GA(bombT/90*.6);A.ring(p.x,p.y,(90-bombT)*4,'#ffd0ff');C(p.x,p.y,(90-bombT)*3.5,'rgba(255,200,255,.25)');GA1();}
  for(const q of it){R(q.x-3,q.y-3,7,7,q.k==='p'?'#e03040':'#3060e0');T(q.k==='p'?'P':'*',q.x-1,q.y-2,'#ffffff',1);}
  for(const e of en){if(e.t<0)continue;const w=e.fl?'#ffffff':e.col,s=e.big?1.6:1;GA(.5);P([[e.x,e.y],[e.x-9*s,e.y-5*s+sin(t*.4)*2],[e.x-6*s,e.y+3*s]],'#e0f0ff',1);P([[e.x,e.y],[e.x+9*s,e.y-5*s+sin(t*.4)*2],[e.x+6*s,e.y+3*s]],'#e0f0ff',1);GA1();C(e.x,e.y+2*s,4*s,w);C(e.x,e.y-3*s,3*s,'#f6d2b8');R(e.x-3*s,e.y-6*s,6*s,2*s,e.col);}
  if(boss){const B=boss;glow(B.x,B.y,26,'#c070ff',.18+.08*sin(t*.1));if(B.card>=0){A.c.strokeStyle='rgba(255,120,220,.5)';A.c.lineWidth=1;A.c.beginPath();for(let i=0;i<=6;i++){const a=t*.02+i*TAU/6*2;i?A.c.lineTo(B.x+cos(a)*24,B.y+sin(a)*24):A.c.moveTo(B.x+cos(a)*24,B.y+sin(a)*24);}A.c.stroke();}
   A.person(B.x,B.y+14,{s:.85,c:B.fl?'#ffffff':'#7a2ad0',pants:'#3a1060',skin:'#f6d2b8',hair:'#e8e0f0',arm1:-2.4,arm2:2.4,id:5});P([[B.x-9,B.y-14],[B.x+9,B.y-14],[B.x+2,B.y-30]],'#4a1a90',1);R(B.x-10,B.y-15,20,2,'#4a1a90');}
  for(const s of sh){R(s.x-1,s.y-4,2,7,s.hm?'#a0ffd0':'#c0e8ff');}
  if(p.inv%8<5||!p.inv){P([[p.x,p.y-8],[p.x-6,p.y+6],[p.x,p.y+3],[p.x+6,p.y+6]],'#e0e8ff',1);P([[p.x,p.y-8],[p.x-2,p.y+2],[p.x+2,p.y+2]],'#4dabff',1);GA(.5+.5*sin(t*.5));R(p.x-1,p.y+5,2,3+(t%4),'#ff9838');GA1();}
  drawB();if(focus){rot(p.x,p.y,t*.08,()=>A.box(-6,-6,12,12,'rgba(255,255,255,.6)'));C(p.x,p.y,2.6,'#ff3050');C(p.x,p.y,1.6,'#ffffff');}
  A.c.restore();if(fl){GA(fl/26);R(FX,FY,FW,FH,flc);GA1();}A.box(FX-1,FY-1,FW+2,FH+2,'#6a4ab0');
  if(boss&&boss.card>=0){bar(FX+4,FY+3,FW-8,4,boss.hp/boss.mh,K.p,'#300020');T(CARDS[boss.card].n,FX+4,FY+9,K.p,1);T(''+Math.max(0,40-flo(boss.ct/60)),FX+FW-4,FY+9,K.w,1,'r');for(let i=boss.card+1;i<4;i++)C(FX+FW-30-(i-boss.card)*7,FY+20,2,K.y);}
  const sx=222;fillG(sx-4,0,W-sx+4,H,grad(sx,0,W,0,[[0,'#120a28'],[1,'#1e1040']]));T('BULLET',sx+4,10,K.p,2);T('HELL',sx+4,24,K.c,2);T('SCORE',sx,48,K.gr,1);T(''+g.score,sx,58,K.w,1);T('LIVES',sx,76,K.gr,1);for(let i=0;i<lives;i++)heart(sx+5+i*11,86,K.p,1);
  T('BOMBS',sx,104,K.gr,1);for(let i=0;i<bombs;i++)C(sx+5+i*11,116,4,K.g);T('POWER '+pow.toFixed(2),sx,132,K.r,1);T('GRAZE '+graze,sx,146,K.w,1);T(boss?'BOSS':'STAGE 1',sx,164,boss?K.p:K.c,1);
  T('B HOLD: FOCUS',sx,196,K.gr,1);T('B B: BOMB',sx,206,K.gr,1);T('A: FIRE',sx,216,K.gr,1);};
 return g;}});

/* ---- BROADSIDE ---- */
A.add({id:'broadside',name:'BROADSIDE',cat:'ACTION',time:360,how:'LEFT/RIGHT STEER, UP/DOWN SAIL. A FIRES PORT, B STARBOARD. BOARD WRECKS.',make(){
 const g={over:null,score:0},WW=1100,WH=900;
 let p={x:550,y:450,a:-PI/2,v:0,sail:1,hp:100,rl:[0,0],pl:1,inv:0},en=[],balls=[],puffs=[],wake=[],isl=[],wind=rnd(TAU),wtar=wind,wave=0,gold=0,camx=0,camy=0,t=0,fl=0,msg=300,board=null,won=0,between=90,bar_=[];const nb=()=>{let x,y;do{x=60+rnd(WW-120);y=60+rnd(WH-120);}while(isl.some(q=>hyp(q.x-x,q.y-y)<q.r+20));return{x,y,ph:rnd(TAU)};};
 for(let i=0;i<6;i++){let x,y;do{x=120+rnd(WW-240);y=120+rnd(WH-240);}while(hyp(x-550,y-450)<160||isl.some(q=>hyp(q.x-x,q.y-y)<200));isl.push({x,y,r:30+rnd(26),s:ri(999)});}
 for(let i=0;i<9;i++)bar_.push(nb());bar_.push({x:550,y:385,ph:0},{x:550,y:300,ph:1},{x:470,y:430,ph:2},{x:630,y:430,ph:3});
 const spawn=()=>{wave++;const n=wave>=5?2:Math.min(4,wave);for(let i=0;i<n+(wave>=5?1:0);i++){const fs=wave>=5&&i===0,a=rnd(TAU);en.push({x:cl(p.x+cos(a)*380,60,WW-60),y:cl(p.y+sin(a)*320,60,WH-60),a:a+PI,v:0,hp:fs?180:36+wave*6,mh:fs?180:36+wave*6,rl:[60+ri(60),60+ri(60)],fs,sail:2,fl:0});}pop(wave>=5?'THE FLAGSHIP!':'WAVE '+wave,160,70,wave>=5?K.r:K.y);S('score');};
 const wf=a=>.3+.7*(1+cos(a-wind))/2;
 const hull=(s,x,y)=>{const dx=x-s.x,dy=y-s.y,c=cos(-s.a),sn=sin(-s.a),lx=dx*c-dy*sn,ly=dx*sn+dy*c,L=s.fs?30:22,Wd=s.fs?11:8;return(lx*lx)/(L*L)+(ly*ly)/(Wd*Wd)<1;};
 const fire=(s,side,n,pl)=>{const ang=s.a+side*PI/2,L=s.fs?24:16;for(let i=0;i<n;i++){const o=(i/(n-1||1)-.5)*L,x=s.x+cos(s.a)*o+cos(ang)*8,y=s.y+sin(s.a)*o+sin(ang)*8,a2=ang+(rnd(2)-1)*.05;balls.push({x,y,vx:cos(a2)*3.3+cos(s.a)*s.v,vy:sin(a2)*3.3+sin(s.a)*s.v,z:0,vz:1.4,pl,src:s});puffs.push({x,y,r:3,t:30});}S('boom');if(pl)shk(4);};
 const sail=(s,turn,target)=>{s.a+=turn*(.012+Math.min(1,s.v)*.018);const tv=s.sail*.55*wf(s.a);s.v+=(tv-s.v)*.02;s.x+=cos(s.a)*s.v;s.y+=sin(s.a)*s.v;s.x=cl(s.x,20,WW-20);s.y=cl(s.y,20,WH-20);
  for(const q of isl){const d=hyp(s.x-q.x,s.y-q.y);if(d<q.r+12){s.x=q.x+(s.x-q.x)/d*(q.r+12);s.y=q.y+(s.y-q.y)/d*(q.r+12);s.v*=.9;if(s.pl&&s.v>.3){s.hp-=.08;if(t%20===0)S('hit');}}}
  if(t%4===0&&s.v>.25)wake.push({x:s.x-cos(s.a)*16,y:s.y-sin(s.a)*16,t:50,r:2});};
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;if(msg)msg--;if(won){won--;if(won===0){g.score=gold+flo(p.hp)*5;g.over='VICTORY! THE SEAS ARE YOURS';}}
  if(t%900===0)wtar=wind+(rnd(2)-1)*1.4;wind+=dang(wind,wtar)*.004;
  if(!en.length&&!won&&!board){if(wave>=5){won=120;S('win');A.confetti();}else if(--between<=0){between=150;spawn();}}
  const k=A.in(0),h=A.hit(0);if(h.u&&p.sail<3){p.sail++;S('blip');}if(h.d&&p.sail>0){p.sail--;S('blip');}sail(p,ax(k),0);
  for(let s=0;s<2;s++)if(p.rl[s])p.rl[s]--;if(h.a&&!p.rl[0]){fire(p,-1,4,1);p.rl[0]=80;}if(h.b&&!p.rl[1]){fire(p,1,4,1);p.rl[1]=80;}
  for(const e of en){if(e.fl)e.fl--;const d=hyp(p.x-e.x,p.y-e.y),toP=atan2(p.y-e.y,p.x-e.x);let want;if(e.hp<e.mh*.3&&!e.fs){want=toP+PI;e.sail=3;}else if(d>200){want=toP;e.sail=3;}else{const s1=toP+PI/2,s2=toP-PI/2;want=Math.abs(dang(e.a,s1))<Math.abs(dang(e.a,s2))?s1:s2;e.sail=d<90?1:2;}
   for(const q of isl)if(hyp(e.x+cos(e.a)*50-q.x,e.y+sin(e.a)*50-q.y)<q.r+20)want=e.a+1.2;
   sail(e,cl(dang(e.a,want)*3,-1,1)*.85,0);for(let s=0;s<2;s++){if(e.rl[s])e.rl[s]--;const side=s?1:-1,rel=dang(e.a+side*PI/2,toP);if(!e.rl[s]&&Math.abs(rel)<.22&&d<200&&!board){fire(e,side,e.fs?5:3,0);e.rl[s]=e.fs?70:130-wave*8;}}}
  for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.vz-=.042;if(b.z<=0){b.dead=1;let hitS=null;if(!b.pl&&hull(p,b.x,b.y))hitS=p;else if(b.pl)for(const e of en)if(hull(e,b.x,b.y)){hitS=e;break;}
    if(hitS){hitS.hp-=hitS===p?6:9;if(hitS!==p){hitS.fl=4;gold+=5;}else{fl=8;shk(6);}A.burst(b.x-camx,b.y-camy,'#c07030',10,2);puffs.push({x:b.x,y:b.y,r:6,t:40});S('hit');}else{for(let i=0;i<6;i++)wake.push({x:b.x+rnd(6)-3,y:b.y+rnd(6)-3,t:30,r:3,sp:1});}}}
  balls=balls.filter(b=>!b.dead);
  for(const e of en){if(e.hp<=0&&!e.dead){e.dead=1;gold+=e.fs?800:60;S('boom');shk(8);A.burst(e.x-camx,e.y-camy,K.o,26,3);for(let i=0;i<8;i++)puffs.push({x:e.x+rnd(30)-15,y:e.y+rnd(30)-15,r:6+rnd(6),t:60});pop(e.fs?'FLAGSHIP SUNK! +800':'SUNK! +60',160,90,K.y);}
   if(!e.dead&&!board&&e.hp<e.mh*.35&&hyp(e.x-p.x,e.y-p.y)<34&&p.v<1.4)board={e,t:0};}
  en=en.filter(e=>!e.dead);
  if(board){board.t++;const e=board.e;e.v*=.9;p.v*=.9;if(hyp(e.x-p.x,e.y-p.y)>50||e.dead)board=null;else if(board.t>=70){e.dead=1;en=en.filter(q=>q!==e);const loot=e.fs?1200:150+wave*20;gold+=loot;p.hp=Math.min(100,p.hp+15);pop('BOARDED! +'+loot+' GOLD',160,90,K.y);S('win');A.burst(160,120,K.y,30,3);board=null;}}
  for(const q of bar_)if(hyp(q.x-p.x,q.y-p.y)<20){Object.assign(q,nb());gold+=15;S('coin');pop('+15 GOLD',160,100,K.y);}p.hp=Math.min(100,p.hp+.006);g.score=gold;if(p.hp<=0){g.over='SUNK ON WAVE '+wave;S('lose');}
  wake.forEach(w=>{w.t--;w.r+=w.sp?.15:.06;});wake=wake.filter(w=>w.t>0);puffs.forEach(q=>{q.t--;q.r+=.15;});puffs=puffs.filter(q=>q.t>0);
  camx+=(cl(p.x+cos(p.a)*p.v*30-160,0,WW-W)-camx)*.08;camy+=(cl(p.y+sin(p.a)*p.v*30-120,0,WH-H)-camy)*.08;};
 const ship=(s,pl)=>{const x=s.x-camx,y=s.y-camy;if(x<-50||x>W+50||y<-50||y>H+50)return;const HL=s.fs?30:22,Wd=s.fs?11:8,c=cos(s.a),sn=sin(s.a),pt=(lx,ly)=>[x+c*lx-sn*ly,y+sn*lx+c*ly];
  GA(.25);P([pt(-HL+2,-Wd+3),pt(HL-6,-Wd+3),pt(HL+4,3),pt(HL-6,Wd+3),pt(-HL+2,Wd+3)],'#002030',1);GA1();P([pt(-HL,-Wd),pt(HL-8,-Wd),pt(HL+4,0),pt(HL-8,Wd),pt(-HL,Wd)],s.fl?'#ffffff':pl?'#8a5028':'#4a3020',1);P([pt(-HL+3,-Wd+2.5),pt(HL-9,-Wd+2.5),pt(HL-1,0),pt(HL-9,Wd-2.5),pt(-HL+3,Wd-2.5)],pl?'#c08a50':'#7a5a3a',1);
  const masts=s.fs?[-14,0,14]:[-8,6];for(const mo of masts){const m=pt(mo,0);const full=.4+(s.sail||0)*.2,sw=Wd*1.6;L(pt(mo,-sw)[0],pt(mo,-sw)[1],pt(mo,sw)[0],pt(mo,sw)[1],'#3a2410',2);P([pt(mo,-sw),pt(mo+4*full*2,-sw*.7),pt(mo+5*full*2,0),pt(mo+4*full*2,sw*.7),pt(mo,sw)],pl?'#f4ecd8':'#2a2a30',1);C(m[0],m[1],1.6,'#3a2410');}
  const fpt=pt(-HL+2,0);R(fpt[0]-2,fpt[1]-6,6,4,pl?K.r:'#101010');if(!pl)R(fpt[0],fpt[1]-5,2,2,'#ffffff');
  if(!pl){const f=s.hp/s.mh;bar(x-14,y-Wd-14,28,4,f,f<.35?K.y:K.r,'#200008');if(f<.35&&!s.fs&&t%40<28)TS('BOARD ME',x,y-Wd-24,K.y,1,'c');}};
 g.draw=()=>{A.cls('#0a3a6a');fillG(0,0,W,H,grad(0,0,0,H,[[0,'#1a5a8a'],[1,'#0a3060']]));
  const gx=flo(camx/40),gy=flo(camy/30);for(let i=gx;i<gx+10;i++)for(let j=gy;j<gy+10;j++){const hh=hash(i,j),x=i*40-camx+hh*20+sin(t*.03+hh*6)*4,y=j*30-camy+hh*10;GA(.25+.15*sin(t*.05+hh*9));L(x,y,x+6+hh*6,y-1,'#8ac8ff');GA1();}
  GA(.5);A.c.strokeStyle='#ffffff';A.c.lineWidth=1;A.c.strokeRect(-camx,-camy,WW,WH);GA1();
  for(const w of wake){GA(w.t/(w.sp?40:70));A.ring(w.x-camx,w.y-camy,w.r,'#e0f4ff');GA1();}
  for(const q of isl){const x=q.x-camx,y=q.y-camy;if(x<-90||x>W+90||y<-90||y>H+90)continue;GA(.35);C(x,y,q.r+10,'rgb(120,200,220)');GA1();C(x,y,q.r+3,'#e8d090');C(x,y,q.r-4,'#4a9a3a');for(let i=0;i<4;i++){const a=hash(q.s,i)*TAU,rr=q.r*.5*hash(i,q.s);E('🌴',x+cos(a)*rr,y+sin(a)*rr,12);}}
  for(const q of bar_){const x=q.x-camx,y=q.y-camy+sin(t*.05+q.ph)*1.5;if(x<-10||x>W+10||y<-10||y>H+10)continue;GA(.3);A.ring(x,y,7+sin(t*.05+q.ph),'#e0f4ff');GA1();R(x-4,y-4,8,8,'#9a6a30');R(x-4,y-2,8,1,'#5a3a10');R(x-4,y+2,8,1,'#5a3a10');}
  en.forEach(e=>ship(e,0));ship(p,1);
  for(const b of balls){const x=b.x-camx,y=b.y-camy;GA(.3);C(x,y,2,'#000000');GA1();C(x,y-b.z*3,2.4,'#202020');}
  for(const q of puffs){GA(q.t/60*.8);C(q.x-camx,q.y-camy-(40-q.t)*.2,q.r,'rgb(220,220,220)');GA1();}
  if(board){const x=board.e.x-camx,y=board.e.y-camy;bar(x-20,y+16,40,5,board.t/70,K.y);TS('BOARDING!',x,y+24,K.y,1,'c');}
  if(fl){GA(fl/20);R(0,0,W,H,K.r);GA1();}vign(.4);
  R(0,0,W,18,'rgba(0,0,0,.45)');T('GOLD '+gold,6,6,K.y,1);T('WAVE '+Math.max(1,wave)+'/5',70,6,K.w,1);T('HULL',122,6,K.gr,1);bar(142,5,60,7,p.hp/100,p.hp<30?K.r:K.g);T('SAIL '+'I'.repeat(p.sail)+'-'.repeat(3-p.sail),208,6,K.c,1);
  const wx=W-16,wy=34;C(wx,wy,11,'#0a2a4a');A.ring(wx,wy,11,'#8ac8ff');L(wx-cos(wind)*8,wy-sin(wind)*8,wx+cos(wind)*8,wy+sin(wind)*8,'#ffffff',2);C(wx+cos(wind)*8,wy+sin(wind)*8,2,'#ffffff');T('WIND',wx,48,K.w,1,'c');
  bar(6,H-12,40,5,1-p.rl[0]/80,'#ffcf3f');T('A PORT',6,H-20,p.rl[0]?K.gr:K.y,1);bar(W-46,H-12,40,5,1-p.rl[1]/80,'#ffcf3f');T('STARBOARD B',W-6,H-20,p.rl[1]?K.gr:K.y,1,'r');
  for(const e of en){const x=e.x-camx,y=e.y-camy;if(x>0&&x<W&&y>18&&y<H)continue;const a=atan2(y-120,x-160),ex=cl(160+cos(a)*150,8,W-8),ey=cl(120+sin(a)*110,26,H-8);P([[ex+cos(a)*6,ey+sin(a)*6],[ex+cos(a+2.4)*5,ey+sin(a+2.4)*5],[ex+cos(a-2.4)*5,ey+sin(a-2.4)*5]],e.fs?K.r:K.o,1);}
  if(msg)T('BROADSIDES FIRE SIDEWAYS. SAIL WITH THE WIND!',160,206,K.w,1,'c');};
 return g;}});

/* ---- BOOMERANG ---- */
A.add({id:'boomerang',name:'BOOMERANG',cat:'ACTION',mouse:1,time:300,how:'MOVE, A THROWS (MOUSE AIMS). IT HITS GOING AND COMING BACK. B DASHES.',make(){
 const g={over:null,score:0},X0=12,Y0=28,X1=308,Y1=230,m=aimer();
 const AR=[{n:'MEADOW',f:'#5a9a4a',f2:'#4e8a40',w:'#3a5a2a'},{n:'DUNES',f:'#d8b070',f2:'#c8a060',w:'#8a6a3a'},{n:'RUINS',f:'#6a6a7a',f2:'#5e5e6e',w:'#3a3a4a'}];
 let p={x:160,y:140,fx:1,fy:0,st:0,inv:60,da:0,dcd:0},hp=5,ar=0,wv=0,en=[],rangs=[],arrows=[],pk=[],booms=[],aim=0,cnt=1,dmg=1,rng=1,spd=1,t=0,hs=0,fl=0,flc='#fff',between=80,won=0,combo=0,deco=[];
 let did=0;const mkDeco=()=>{did++;deco=[];for(let i=0;i<14;i++)deco.push({x:X0+10+rnd(X1-X0-20),y:Y0+10+rnd(Y1-Y0-20),k:ri(3)});};mkDeco();
 const spawnWave=()=>{wv++;const n=3+wv+ar*2,pool=['slime','slime'].concat(ar>=0&&wv>=2?['knight']:[],ar>=1?['archer','knight','bomber']:[],ar>=2?['archer','bomber','knight']:[]);
  for(let i=0;i<n;i++){const side=ri(4),x=side===0?X0+6:side===1?X1-6:X0+rnd(X1-X0),y=side===2?Y0+6:side===3?Y1-6:Y0+rnd(Y1-Y0);const k=pool[ri(pool.length)];en.push({k,x,y,hp:k==='knight'?2+ar:k==='slime'?1+(ar>1?1:0):1,t:-30-i*12,fa:0,fl:0,cd:60+ri(60),ph:rnd(TAU)});}
  if(ar===2&&wv===3)en.push({k:'golem',x:160,y:Y0+20,hp:40,mh:40,t:-60,fa:PI/2,fl:0,cd:90,ph:0});pop(AR[ar].n+' - WAVE '+wv+'/3',160,90,K.y);S('score');};
 const throwR=()=>{const used=rangs.length;if(used>=cnt)return;rangs.push({x:p.x,y:p.y-4,vx:cos(aim)*5.6*rng,vy:sin(aim)*5.6*rng,ph:0,t:0,hitO:new Set(),hitB:new Set(),sp:0,curve:(used%2?-1:1)*.05,kills:0});S('jump');};
 const killE=(e,r)=>{e.dead=1;if(r)r.kills++;const mult=r?r.kills:1;const pts=(e.k==='golem'?3000:100)*mult;g.score+=pts;if(mult>1)pop('X'+mult+' +'+pts,e.x,e.y-14,K.y);A.burst(e.x,e.y,e.k==='slime'?'#6ae06a':e.k==='bomber'?K.o:'#c0c0d0',12,2.2);S('hit');shk(3);hs=Math.max(hs,2);if(e.k==='bomber')boom(e.x,e.y);if(Math.random()<.08)pk.push({x:e.x,y:e.y,k:'heart'});};
 const boom=(x,y)=>{booms.push({x,y,t:16});S('boom');shk(6);for(const e of en)if(!e.dead&&hyp(e.x-x,e.y-y)<28)killE(e,null);if(hyp(p.x-x,p.y-y)<26)hurt();};
 const hurt=()=>{if(p.inv||p.da)return;hp--;p.inv=80;hs=5;shk(6);fl=10;flc='#ff2040';S('boom');A.burst(p.x,p.y,K.r,14,2);if(hp<=0){g.over='FELL IN THE '+AR[ar].n;S('lose');}};
 const hitR=(e,r,back)=>{const set=back?r.hitB:r.hitO;if(set.has(e))return;set.add(e);if(e.k==='knight'){const toward=Math.cos(atan2(r.vy,r.vx)-e.fa);if(toward<-.3){S('blip');spark(e.x+cos(e.fa)*6,e.y+sin(e.fa)*6,'#ffffff',6,1.6,8);pop('CLANG',e.x,e.y-14,K.gr);return;}}e.hp-=dmg;e.fl=5;const a=atan2(r.vy,r.vx);e.x+=cos(a)*4;e.y+=sin(a)*4;spark(e.x,e.y,K.y,4,1.5,8);if(e.hp<=0)killE(e,r);else S('hit');};
 g.update=()=>{if(g.over)return;m.upd();if(hs){hs--;return;}t++;if(fl)fl--;if(p.inv)p.inv--;if(p.dcd)p.dcd--;
  if(won){won--;if(won===0){g.score+=hp*500;g.over='ARENA CLEAR! VICTORY';}return;}
  const k=A.in(0),h=A.hit(0),dx=ax(k),dy=ay(k);if(dx||dy){const d=hyp(dx,dy);p.fx=dx/d;p.fy=dy/d;p.st+=.3;}if(m.on)aim=atan2(m.y-p.y,m.x-p.x);else aim=atan2(p.fy,p.fx);
  if(h.b&&!p.dcd&&!p.da){p.da=12;p.dcd=40;S('jump');}let s=1.8*spd;if(p.da){p.da--;s=4.4;if(p.da%3===0)spark(p.x,p.y+4,'#ffffff',1,.6,8);}const md=p.da?[p.fx,p.fy]:[dx?(dx/hyp(dx,dy)):0,dy?(dy/hyp(dx,dy)):0];p.x=cl(p.x+md[0]*s,X0+6,X1-6);p.y=cl(p.y+md[1]*s,Y0+6,Y1-4);
  if(h.a)throwR();
  for(const r of rangs){r.t++;r.sp+=.5;if(r.ph===0){const v=hyp(r.vx,r.vy);const a=atan2(r.vy,r.vx)+r.curve;const nv=Math.max(0,v-.17);r.vx=cos(a)*nv;r.vy=sin(a)*nv;if(nv<.4)r.ph=1;if(r.x<X0||r.x>X1||r.y<Y0||r.y>Y1){r.ph=1;r.x=cl(r.x,X0,X1);r.y=cl(r.y,Y0,Y1);S('blip');}}
   else{const a=atan2(p.y-r.y,p.x-r.x),v=Math.min(6.5,hyp(r.vx,r.vy)+.3);r.vx+=(cos(a)*v-r.vx)*.25;r.vy+=(sin(a)*v-r.vy)*.25;if(hyp(p.x-r.x,p.y-r.y)<10){r.caught=1;S('coin');if(r.kills>=2){g.score+=r.kills*50;pop('CATCH! X'+r.kills,p.x,p.y-20,K.c);}}}
   r.x+=r.vx;r.y+=r.vy;for(const e of en){if(e.dead||e.t<0)continue;if(hyp(e.x-r.x,e.y-r.y)<(e.k==='golem'?16:8))hitR(e,r,r.ph===1);}}
  rangs=rangs.filter(r=>!r.caught);
  for(const e of en){if(e.dead)continue;e.t++;if(e.fl)e.fl--;if(e.t<0)continue;e.ph+=.15;const d=hyp(p.x-e.x,p.y-e.y)||1,a=atan2(p.y-e.y,p.x-e.x);e.fa+=dang(e.fa,a)*.06;
   let sp=e.k==='slime'?.55+ar*.1:e.k==='knight'?.45:e.k==='bomber'?1.25:e.k==='golem'?.35:0;if(e.k==='archer'){sp=d<90?-.7:d>140?.6:0;e.cd--;if(e.cd<=0){e.cd=110-ar*15;arrows.push({x:e.x,y:e.y,vx:cos(a)*2.6,vy:sin(a)*2.6});S('blip');}}
   if(e.k==='golem'){e.cd--;if(e.cd<=0){e.cd=110;for(let i=0;i<10;i++){const aa=i/10*TAU+t*.1;arrows.push({x:e.x,y:e.y,vx:cos(aa)*1.8,vy:sin(aa)*1.8,rock:1});}S('boom');shk(4);}}
   if(e.k==='slime')sp*=.6+.6*Math.max(0,sin(e.ph));e.x=cl(e.x+cos(a)*sp,X0+6,X1-6);e.y=cl(e.y+sin(a)*sp,Y0+6,Y1-6);
   if(e.k==='bomber'&&d<14){killE(e,null);continue;}if(d<(e.k==='golem'?18:9))hurt();}
  for(let i=0;i<en.length;i++)for(let j=i+1;j<en.length;j++){const a=en[i],b=en[j],dx2=b.x-a.x,dy2=b.y-a.y,d=hyp(dx2,dy2)||1;if(d<12){a.x-=dx2/d*.6;a.y-=dy2/d*.6;b.x+=dx2/d*.6;b.y+=dy2/d*.6;}}
  en=en.filter(e=>!e.dead);for(const q of arrows){q.x+=q.vx;q.y+=q.vy;if(hyp(q.x-p.x,q.y-p.y)<5){q.d=1;hurt();}}arrows=arrows.filter(q=>!q.d&&q.x>X0&&q.x<X1&&q.y>Y0&&q.y<Y1);booms.forEach(b=>b.t--);booms=booms.filter(b=>b.t>0);
  for(const q of pk){if(hyp(q.x-p.x,q.y-p.y)<12){q.got=1;S('win');fl=8;flc='#fff3a0';if(q.k==='heart'){hp=Math.min(6,hp+1);pop('+1 HEART',q.x,q.y-12,K.r);}else if(q.k==='twin'){cnt++;pop('+1 BOOMERANG!',q.x,q.y-12,K.y);}else if(q.k==='fire'){dmg++;pop('FLAME RANG! DMG UP',q.x,q.y-12,K.o);}else if(q.k==='range'){rng+=.18;pop('LONGER THROWS',q.x,q.y-12,K.c);}else{spd+=.15;pop('SWIFT FEET',q.x,q.y-12,K.g);}}}pk=pk.filter(q=>!q.got);
  if(!en.length){if(--between<=0){if(wv>=3){if(ar>=2){won=100;S('win');A.confetti();return;}ar++;wv=0;mkDeco();hp=Math.min(6,hp+1);pop('NEXT ARENA: '+AR[ar].n,160,80,K.c);}between=120;spawnWave();}
   else if(between===60&&wv>0){const ups=['twin','fire','range','swift','heart'];pk.push({x:160,y:130,k:ups[(wv+ar*3)%5]});}}};
 const rangD=(x,y,a,col)=>rot(x,y,a,()=>{P([[-7,-2],[0,-1],[1,-7],[3,-7],[2,1],[-7,1]].map(q=>[q[0],q[1]+3]),col,1);});
 const arenaBG=()=>X.cache('bm_ar'+ar+'_'+did,()=>{const A_=AR[ar];A.cls(A_.w);
   /* surrounding wall band: hedge / sandstone / ruined masonry */
   X.vg(0,0,W,H,[X.lt(A_.w,1.3),A_.w]);for(let i=0;i<24;i++)for(let j=0;j<2;j++){const bx=i*14+(j%2)*7-7,by=6+j*8;if(ar===0){X.disc(bx+7,by+4,6,j?'#2e5222':'#3a6a2a');X.disc(bx+5,by+2,3,'#4e8a3a');}else X.rr(bx,by+4,13,7,1.5,X.lg(0,by,0,by+8,[X.lt(A_.w,1.6),X.lt(A_.w,1.05)]));}
   /* floor: soft tiles with a painted ring */
   for(let i=0;i<19;i++)for(let j=0;j<13;j++){const x=X0+i*16,y=Y0+j*16;if(x>=X1||y>=Y1)continue;const c0=(i+j)%2?A_.f:A_.f2,hh=hash(i+ar*40,j);R(x,y,Math.min(16,X1-x),Math.min(16,Y1-y),X.lg(x,y,x+16,y+16,[X.lt(c0,1.08),c0]));if(ar===2&&hh>.7)L(x+3,y+4,x+9,y+11,'rgba(0,0,0,.25)',1);if(ar===1&&hh>.5){A.c.strokeStyle='rgba(120,80,30,.18)';A.c.beginPath();A.c.moveTo(x,y+8);A.c.quadraticCurveTo(x+8,y+5+hh*6,x+16,y+8);A.c.stroke();}}
   A.c.strokeStyle='rgba(255,255,255,.12)';A.c.lineWidth=2;A.c.beginPath();A.c.ellipse(160,129,70,48,0,0,TAU);A.c.stroke();A.c.beginPath();A.c.ellipse(160,129,8,6,0,0,TAU);A.c.stroke();
   for(const d of deco){if(ar===0){if(d.k===0){for(let j=0;j<3;j++){X.disc(d.x+j*3,d.y+(j%2)*2,1.6,j%2?'#ff7aa8':'#ffe060');}}else{R(d.x,d.y,1,4,'#3a7a2a');R(d.x+2,d.y+1,1,3,'#4a8a3a');R(d.x-2,d.y+1,1,3,'#2e6a22');}}else if(ar===1){if(d.k===2){ell(d.x+2,d.y+7,6,2,'rgba(0,0,0,.25)');E('🌵',d.x,d.y,12);}else ell(d.x,d.y,4,1.5,'rgba(255,240,200,.35)');}else{ell(d.x+1,d.y+3,5,1.6,'rgba(0,0,0,.3)');X.block(d.x-3,d.y-2,7,5,'#7e7e90',1);}}
   /* corner pillars / braziers */
   for(const c of[[X0+4,Y0+4],[X1-4,Y0+4],[X0+4,Y1-4],[X1-4,Y1-4]]){ell(c[0]+1,c[1]+4,7,2.5,'rgba(0,0,0,.4)');X.block(c[0]-6,c[1]-8,12,12,ar===0?'#6a8a5a':ar===1?'#c8a060':'#7a7a8e',2);}
   R(X0-2,Y0-2,X1-X0+4,2,'rgba(0,0,0,.45)');R(X0-2,Y0-2,2,Y1-Y0+4,'rgba(0,0,0,.3)');A.c.strokeStyle='rgba(0,0,0,.6)';A.c.lineWidth=1;A.c.strokeRect(X0-.5,Y0-.5,X1-X0+1,Y1-Y0+1);X.vignette(.35);});
 g.draw=()=>{const A_=AR[ar];arenaBG();for(const c of[[X0+4,Y0-6],[X1-4,Y0-6]])torch(c[0],c[1]+4,t);
  for(const q of pk){const y=q.y+sin(t*.1)*2;glow(q.x,y,12,K.y,.25+.1*sin(t*.2));C(q.x,y,6,q.k==='heart'?K.r:q.k==='fire'?K.o:q.k==='twin'?K.y:q.k==='range'?K.c:K.g);E(q.k==='heart'?'❤️':q.k==='fire'?'🔥':q.k==='twin'?'🪃':q.k==='range'?'🎯':'👟',q.x,y,9);}
  const all=en.slice().sort((a,b)=>a.y-b.y);for(const e of all){const x=e.x,y=e.y,w=e.fl?'#ffffff':null;if(e.t<0){GA(.4+.3*sin(t*.4));A.ring(x,y,8,K.r);GA1();continue;}GA(.3);R(x-6,y+5,12,2,'#000');GA1();
   if(e.k==='slime'){const sq=1+.2*sin(e.ph);ell(x,y+1,7.5*sq,6.5/sq,w||X.rg(x-3,y-3,1,x,y+1,8,['#c0ffb0','#5ad05a','#1e7a2a']));if(!w){ell(x-3,y-2,2.2,1.2,'rgba(255,255,255,.6)');R(x-3,y,2,2.4,'#103010');R(x+1.5,y,2,2.4,'#103010');}}
   else if(e.k==='knight'){A.person(x,y+7,{s:.56,c:w||'#8a8aa0',pants:'#4a4a5a',st:e.ph,id:2,cap:'#9a9ab0'});const sx=x+cos(e.fa)*7,sy=y-3+sin(e.fa)*7;rot(sx,sy,e.fa,()=>{X.rr(-2,-7,4,14,1.5,X.lg(-2,0,2,0,['#e8e8f8','#8a8aa0']));R(-.5,-5,1,10,'#c03030');});}
   else if(e.k==='archer'){A.person(x,y+7,{s:.56,c:w||'#2a7a3a',pants:'#4a3a2a',st:e.ph,id:3,cap:'#1a5a2a',arm2:e.fa-PI/2});A.c.strokeStyle='#7a5a2a';A.c.lineWidth=1.2;A.c.beginPath();A.c.arc(x+cos(e.fa)*5,y-8+sin(e.fa)*5,5,e.fa-1.2,e.fa+1.2);A.c.stroke();}
   else if(e.k==='bomber'){X.orb(x,y,6,w||'#34343c');R(x-2,y-1,1.6,1.6,'#ff4030');R(x+1,y-1,1.6,1.6,'#ff4030');L(x+3,y-5,x+5,y-9,'#a08060',1.2);if(t%6<3){X.glow(x+5,y-10,6,'#ffcf3f',.7);C(x+5,y-10,1.6,'#ffffff');}}
   else{X.block(x-15,y+2,8,12,w||'#5e5040',2);X.block(x+7,y+2,8,12,w||'#5e5040',2);X.orb(x,y,15,w||'#7a6a5a',w?0:1);if(!w){for(let i=0;i<4;i++)L(x-10+i*6,y-8+(i%2)*4,x-6+i*6,y+6,'rgba(40,30,20,.5)',1);X.glow(x-5,y-4,6,'#ff9a3a',.6);X.glow(x+5,y-4,6,'#ff9a3a',.6);}C(x-5,y-4,2.6,K.o);C(x+5,y-4,2.6,K.o);X.meter(x-16,y-24,32,5,e.hp/e.mh,'#ff3a4a');}}
  for(const q of arrows){if(q.rock)C(q.x,q.y,3,'#8a7a6a');else L(q.x,q.y,q.x-q.vx*2.5,q.y-q.vy*2.5,'#e0d0b0',1.5);}
  for(const b of booms){GA(b.t/16);C(b.x,b.y,28*(1-b.t/24),b.t>8?'#fff3a0':'#ff8030');GA1();}
  if(p.inv%8<5){if(p.da)for(let i=1;i<4;i++){GA(.18*(4-i));A.person(p.x-p.fx*i*5,p.y+8-p.fy*i*5,{s:.64,c:'#ffffff',pants:'#ffffff',d:p.fx>=0?1:-1,id:0});}GA1();A.person(p.x,p.y+8,{s:.64,c:'#e07a2a',pants:'#3a3060',st:p.st,d:p.fx>=0?1:-1,id:0,arm2:rangs.length?-1.6:undefined});}
  const held=cnt-rangs.length;for(let i=0;i<held;i++)rangD(p.x+(p.fx>=0?6:-6),p.y-8-i*3,.5,dmg>1?K.o:'#e0c060');
  for(const r of rangs){for(let i=1;i<4;i++){GA(.12*(4-i));rangD(r.x-r.vx*i*1.2,r.y-r.vy*i*1.2,r.sp-i*.5,dmg>1?K.o:'#e0c060');}GA1();rangD(r.x,r.y,r.sp,dmg>1?K.o:'#e0c060');if(dmg>1&&t%2===0)spark(r.x,r.y,K.o,1,.6,8);}
  if(!m.on&&!rangs.length){GA(.35);L(p.x+cos(aim)*10,p.y-4+sin(aim)*10,p.x+cos(aim)*22,p.y-4+sin(aim)*22,'#ffffff');GA1();}
  if(fl){GA(fl/22);R(0,0,W,H,flc);GA1();}m.draw(K.y);
  for(let i=0;i<hp;i++)heart(10+i*11,12,K.r,1);T(AR[ar].n+' '+Math.max(1,wv)+'/3',160,8,K.w,1,'c');T('SCORE '+g.score,W-6,8,K.y,1,'r');T('RANGS '+cnt+(dmg>1?' FIRE':''),160,17,K.gr,1,'c');};
 return g;}});

/* ---- LAVA RISE ---- */
A.add({id:'lavarise',name:'LAVA RISE',cat:'ACTION',time:240,how:'ARROWS MOVE, A JUMPS, ALSO OFF WALLS. OUTCLIMB THE LAVA TO 300 M.',make(){
 const g={over:null,score:0},WL=14,WR=306,GOALM=300;
 let p={x:160,y:200,vx:0,vy:0,on:0,f:1,st:0,wall:0,lk:0,co:0,jb:0},pl=[],it=[],lava=400,camY=0,top=200,coins=0,best=0,t=0,pw={boots:0,jet:0,freeze:0,shield:0},fl=0,flc='#fff',emb=[],dead=0,lavaV=.22;
 const r=srng(4242);let nextY=210;
 const gen=()=>{while(nextY>camY-260){const h=-(top-nextY)/10,diff=Math.min(1,h/300);const w=Math.max(28,70-diff*36-r()*20),x=WL+4+r()*(WR-WL-8-w);const roll=r();const k=roll<.12+diff*.15?'crumble':roll<.24+diff*.2?'move':roll<.3?'spring':'n';const q={x,y:nextY,w,k,ox:x,ph:r()*TAU,cr:0};pl.push(q);
   const ir=r();if(ir<.18)it.push({x:x+w/2,y:nextY-10,k:'coin'});else if(ir<.23)it.push({x:x+w/2,y:nextY-12,k:['boots','jet','freeze','shield'][flo(r()*4)]});nextY-=30+r()*16+diff*8;}};
 pl.push({x:WL,y:220,w:WR-WL,k:'n',ox:WL,ph:0,cr:0});gen();
 const die=()=>{if(pw.shield){pw.shield=0;p.vy=-9;p.y=Math.min(p.y,lava-6);lava+=40;S('score');fl=12;flc='#80e0ff';pop('SHIELD SAVED YOU!',160,120,K.c);A.burst(p.x,p.y-camY,K.c,20,3);return;}dead=1;g.over='MELTED AT '+best+' M';S('lose');shk(10);A.burst(p.x,p.y-camY,K.o,30,3);};
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;for(const k in pw)if(pw[k]>0&&k!=='shield')pw[k]--;
  const k=A.in(0),h=A.hit(0),dx=ax(k);if(dx)p.f=dx;if(h.a||h.u)p.jb=7;else if(p.jb)p.jb--;
  if(p.lk)p.lk--;else p.vx+=(dx*2.3-p.vx)*(p.on?.4:.22);
  if(p.on)p.co=6;else if(p.co)p.co--;
  if(p.jb&&p.co){p.vy=pw.boots?-8.2:-6.3;p.co=0;p.jb=0;p.on=0;S('jump');spark(p.x,p.y-camY,'#d0c0b0',4,1,8);}
  else if(p.jb&&p.wall&&!p.on){p.vy=-6;p.vx=-p.wall*3.2;p.lk=10;p.jb=0;p.f=-p.wall;S('jump');spark(p.x+p.wall*4,p.y-6-camY,'#ffffff',5,1.4,8);}
  if(pw.jet&&(k.a||k.u)){p.vy=Math.max(p.vy-.55,-3.6);if(t%2===0)A.fx.push({x:p.x-p.f*3,y:p.y-camY-4,vx:rnd(1)-.5,vy:2,t:14,c:t%4?K.o:K.y,g:0});}
  p.vy+=.3;if(p.wall&&p.vy>1.6&&dx===p.wall)p.vy=1.6;if(p.vy>7)p.vy=7;
  const py0=p.y;p.x+=p.vx;p.y+=p.vy;p.wall=0;if(p.x<WL+4){p.x=WL+4;p.wall=-1;p.vx=0;}if(p.x>WR-4){p.x=WR-4;p.wall=1;p.vx=0;}if(dx)p.st+=.3;
  p.on=0;for(const q of pl){if(q.k==='move'){const nx=q.ox+sin(t*.02+q.ph)*30;q.x=cl(nx,WL,WR-q.w);}if(q.k==='crumble'&&q.cr>0){q.cr++;if(q.cr>34)q.gone=1;}if(q.gone)continue;
   if(p.vy>=0&&py0<=q.y+.5&&p.y>=q.y&&p.x>q.x-3&&p.x<q.x+q.w+3){p.y=q.y;p.vy=0;p.on=1;if(q.k==='move')p.x+=cos(t*.02+q.ph)*.6;if(q.k==='crumble'&&!q.cr){q.cr=1;S('hit');}if(q.k==='spring'){p.vy=-10.5;p.on=0;S('score');q.bo=10;spark(p.x,p.y-camY,K.y,8,2,10);}}}
  for(const q of it){if(!q.got&&hyp(q.x-p.x,q.y-(p.y-8))<12){q.got=1;S('coin');if(q.k==='coin'){coins++;spark(q.x,q.y-camY,K.y,8,1.6,10);}else{pw[q.k]=q.k==='shield'?1:600;fl=10;flc='#fff3a0';pop({boots:'SPRING BOOTS!',jet:'JETPACK! HOLD A',freeze:'LAVA FROZEN!',shield:'SHIELD!'}[q.k],160,100,K.y);S('win');}}}
  pl=pl.filter(q=>q.y<lava+40&&!q.gone);it=it.filter(q=>!q.got&&q.y<lava+20);
  const m_=flo((200-p.y)/10);if(m_>best){best=m_;}g.score=best+coins*10;
  camY+=(p.y-140-camY)*(p.y-140<camY?.2:.08);gen();
  if(!pw.freeze&&t>90){lavaV=.2+best*.0012;const gap=lava-p.y;lava-=lavaV+(gap>260?(gap-260)*.02:0);}
  if(p.y>lava-2)die();if(t%3===0)emb.push({x:WL+rnd(WR-WL),y:lava,vy:-.5-rnd(1),t:60});emb.forEach(e=>{e.y+=e.vy;e.t--;});emb=emb.filter(e=>e.t>0);
  if(best>=GOALM&&!g.over){g.score+=500;g.over='SUMMIT REACHED! WIN';}};
 g.draw=()=>{const hf=cl(best/GOALM,0,1);fillG(0,0,W,H,grad(0,0,0,H,[[0,A.mix('#1a0a10','#4a7ad0',hf)],[1,A.mix('#4a1a10','#f0a070',hf)]]));
  /* cavern depth: parallax rock columns with glowing magma veins */
  const cv=patt('lr_back',160,240,(w,h)=>{for(let i=0;i<7;i++){const x=hash(i,1)*w,cw=14+hash(i,2)*22;X.vg(x-cw/2,0,cw,h,['rgba(30,10,10,.0)','rgba(40,14,12,.55)','rgba(20,6,6,.0)']);}for(let i=0;i<10;i++){const x=hash(i,3)*w,y=hash(i,4)*h;X.stroke([[x,y],[x+4,y+10],[x+1,y+18],[x+6,y+28]],'rgba(255,110,30,.35)',1.2);}for(let i=0;i<30;i++)R(hash(i,5)*w,hash(i,6)*h,1,1,'rgba(255,180,90,.4)');});
  if(cv)tileBG(cv,160,240,0,camY*.3);
  const wp=patt('lr_wall',16,32,(w,h)=>{fillG(0,0,w,h,'#24160f');for(let j=0;j<2;j++){X.rr(1,j*16+1,14,14,2,X.lg(0,j*16,16,j*16+16,['#5a3e30','#3a261c','#2a1a12']));R(3,j*16+2,8,1.5,'rgba(255,255,255,.12)');}ell(10,24,2,1.4,'rgba(255,110,30,.5)');});
  for(let s_=0;s_<2;s_++){const x0=s_?WR:0,w=s_?W-WR:WL;if(wp){A.c.save();A.c.beginPath();A.c.rect(x0,0,w,H);A.c.clip&&A.c.clip();tileBG(wp,16,32,s_?-WR:0,camY);A.c.restore();}else fillG(x0,0,w,H,'#2a1a18');fillG(s_?WR:WL-2,0,2,H,s_?'rgba(0,0,0,.5)':'rgba(255,140,60,.25)');}
  for(const q of pl){const y=q.y-camY;if(y<-10||y>H+10)continue;const sh=q.cr?(rnd(2)-1)*Math.min(2,q.cr/10):0;const c=q.k==='crumble'?'#9a7450':q.k==='move'?'#5a6e98':q.k==='spring'?'#7a6060':'#6e6478',x=q.x+sh;
   ell(x+q.w/2,y+11,q.w/2,2.5,'rgba(0,0,0,.3)');X.block(x,y,q.w,8,c,2);if(q.k==='n'||q.k==='spring'){X.vg(x,y-1,q.w,3,['#8ae070','#4aa040']);for(let i=2;i<q.w-2;i+=4)R(x+i,y-2-(i%3),1,2,'#6ac050');}if(q.k==='crumble'){R(x,y,q.w,2,'#c8a070');for(let i=0;i<3;i++)L(x+q.w*(i+1)/4,y+1,x+q.w*(i+1)/4+(q.cr?3:1),y+7,'#4a2a10',q.cr?1.4:.8);if(q.cr&&t%3===0)A.fx.push({x:x+rnd(q.w),y:y+8,vx:0,vy:1,t:12,c:'#8a6a4a',g:.1});}
   if(q.k==='spring'){const b=q.bo?(q.bo--,4):0;L(q.x+q.w/2-4,y,q.x+q.w/2+4,y-4+b,'#d0d0d8',1.5);L(q.x+q.w/2+4,y,q.x+q.w/2-4,y-4+b,'#d0d0d8',1.5);X.rr(q.x+q.w/2-7,y-7+b,14,4,2,X.lg(0,y-7,0,y-3,['#ff8a8a','#d02a3a']));}if(q.k==='move'){X.orb(x+4,y+4,2,'#e0e4f0',0);X.orb(x+q.w-4,y+4,2,'#e0e4f0',0);X.glow(x+q.w/2,y+4,8,'#6ab0ff',.25);}}
  for(const q of it){const y=q.y-camY+sin(t*.1+q.x)*2;if(y<-10||y>H+10)continue;if(q.k==='coin'){const w=Math.abs(cos(t*.08+q.x))*4+1;X.glow(q.x,y,8,'#ffcf3f',.35);ell(q.x,y,w,5,X.lg(q.x-w,0,q.x+w,0,['#fff3a0','#ffcf3f','#c08a10']));}else{X.glow(q.x,y,14,'#3dd8ff',.4);X.orb(q.x,y,7,'#2a4a80',0);E({boots:'👢',jet:'🚀',freeze:'❄️',shield:'🛡️'}[q.k],q.x,y,9);}}
  if(!dead){const y=p.y-camY;if(pw.shield){GA(.35+.15*sin(t*.2));C(p.x,y-8,12,'#80e0ff');GA1();}if(pw.jet)X.rr(p.x-p.f*6-3,y-20,6,11,2,X.lg(0,y-20,0,y-9,['#d0d0e0','#7a7a90']));A.person(p.x,y,{s:.76,c:'#2a8ad0',pants:'#3a3a4a',st:p.on?p.st:0,d:p.f,id:1,arm1:p.on?undefined:p.wall?-3:-2.4,arm2:p.on?undefined:2.4});if(pw.boots)X.rr(p.x-4,y-3,8,3,1,'#ff4a4a');}
  const ly=lava-camY;if(ly<H+60){const top_=Math.max(-20,ly);if(!pw.freeze){GA(.45+.1*sin(t*.1));fillG(0,top_-60,W,60,grad(0,top_-60,0,top_,[[0,'rgba(255,80,0,0)'],[1,'rgba(255,120,0,1)']]));GA1();}
   A.c.fillStyle=pw.freeze?'#5a7aa0':'#ff5a10';A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=10)A.c.lineTo(x,ly+sin(x*.05+t*.08)*3);A.c.lineTo(W,H);A.c.fill();fillG(0,ly+4,W,Math.max(0,H-ly),grad(0,ly,0,ly+60,[[0,pw.freeze?'#7a9ac0':'#ff8a20'],[1,pw.freeze?'#2a3a60':'#a01a00']]));
   A.c.strokeStyle=pw.freeze?'#d8f0ff':'#ffe27a';A.c.lineWidth=1.5;A.c.beginPath();for(let x=0;x<=W;x+=10)x?A.c.lineTo(x,ly+sin(x*.05+t*.08)*3):A.c.moveTo(x,ly+sin(t*.08)*3);A.c.stroke();for(let i=0;i<8;i++){const bx=(i*41+t*.3)%W,ph=((t+i*23)%50)/50,by=ly+20-ph*18;GA(1-ph);X.orb(bx,by,1.6+(i%3)+ph*2,pw.freeze?'#c8e8ff':'#ffb030',0);GA1();}}
  for(const e of emb){GA(e.t/60);R(e.x,e.y-camY,1,1,pw.freeze?'#c0e0ff':K.y);}GA1();
  const gap=lava-p.y;if(gap<70&&!pw.freeze){GA((70-gap)/70*.25);R(0,0,W,H,K.r);GA1();}if(fl){GA(fl/20);R(0,0,W,H,flc);GA1();}
  R(0,0,W,18,'rgba(0,0,0,.5)');T(best+' M',6,5,K.y,2);bar(56,6,90,6,best/GOALM,K.o);T('GOAL '+GOALM,150,6,K.gr,1);T('COINS '+coins,W-6,6,K.y,1,'r');let ix=WL+4;for(const kk of['boots','jet','freeze'])if(pw[kk]>0){bar(ix,29,24,3,pw[kk]/600,K.c);T(kk.toUpperCase().slice(0,4),ix,22,K.c,1);ix+=28;}if(pw.shield)T('SHLD',ix,22,K.c,1);
  T('LAVA '+Math.max(0,flo((lava-p.y)/10))+' M BELOW',160,H-10,gap<70?K.r:K.w,1,'c');};
 return g;}});

/* ---- SAMURAI SLASH ---- */
A.add({id:'samuraislash',name:'SAMURAI SLASH',cat:'ACTION',time:300,how:'HOLD A (OR DRAG MOUSE) TO SLOW TIME AND DRAW A PATH. RELEASE TO SLASH.',make(){
 const g={over:null,score:0};
 let p={x:160,y:150,f:1,st:0,inv:60},hp=3,rnd_=0,mode='between',bt=60,foes=[],arrows=[],halves=[],petals=[],path=null,ink=0,dash=null,sheath=0,cutN=0,focus=180,t=0,hs=0,fl=0,flc='#fff',duel=null,sf=1,won=0;
 const MAXINK=240;for(let i=0;i<24;i++)petals.push({x:rnd(W),y:rnd(H),vx:.3+rnd(.6),vy:.2+rnd(.4),ph:rnd(TAU)});
 const FT={ash:{c:'#6a5a3a',hp:1,sp:.42},arch:{c:'#3a6a3a',hp:1,sp:0},nin:{c:'#2a2a3a',hp:1,sp:.9},ron:{c:'#3a4a8a',hp:2,sp:.3},sho:{c:'#8a1a2a',hp:4,sp:.35}};
 const startRound=()=>{rnd_++;if(rnd_===3||rnd_===6){mode='duel';duel={ph:'wait',w:90+ri(150),r:0,cpu:Math.max(14,36-rnd_*2),res:0};return;}mode='fight';foes=[];arrows=[];p.x=160;p.y=150;
  const n=3+rnd_,pool=['ash','ash'].concat(rnd_>=2?['arch']:[],rnd_>=4?['nin','ron','arch']:[],rnd_>=7?['nin','ron']:[]);for(let i=0;i<n;i++){const a=rnd(TAU),k=pool[ri(pool.length)];foes.push({k,x:cl(160+cos(a)*150,14,306),y:cl(140+sin(a)*110,34,226),hp:FT[k].hp,wt:0,cd:60+ri(80),st:rnd(TAU),stun:0,cut:0});}
  if(rnd_===8)foes.push({k:'sho',x:160,y:40,hp:4,wt:0,cd:80,st:0,stun:0,cut:0});pop('ROUND '+rnd_+(rnd_===8?' - THE SHOGUN':''),160,90,K.y);S('score');};
 const hurt=()=>{if(p.inv||dash)return;hp--;p.inv=90;hs=6;shk(7);fl=12;flc='#ff1030';S('boom');A.burst(p.x,p.y-10,K.r,16,2.4);if(hp<=0){g.over='FALLEN IN ROUND '+rnd_;S('lose');}};
 const sheathe=()=>{const cut=foes.filter(f=>f.cut);let kills=0;for(const f of cut){f.cut=0;f.hp--;if(f.hp<=0){f.dead=1;kills++;const a=rnd(TAU);halves.push({x:f.x,y:f.y-10,vx:cos(a)*2,vy:-2,r:0,vr:.2,c:FT[f.k].c,t:50,top:1},{x:f.x,y:f.y-4,vx:-cos(a)*2,vy:-1,r:0,vr:-.15,c:FT[f.k].c,t:50,top:0});A.burst(f.x,f.y-10,'#b00020',16,2.6);}else{f.stun=60;spark(f.x,f.y-10,'#ffffff',8,2,10);}}
  if(kills){const pts=100*kills*kills;g.score+=pts;pop(kills>1?kills+' IN ONE STROKE! +'+pts:'+'+pts,160,70,kills>2?K.y:K.w);hs=4+kills*2;shk(3+kills*2);fl=6;flc='#ffffff';S(kills>2?'boom':'hit');}foes=foes.filter(f=>!f.dead);};
 g.update=()=>{if(g.over)return;if(hs){hs--;return;}t++;if(fl)fl--;if(p.inv)p.inv--;for(const q of petals){q.x+=q.vx*sf;q.y+=q.vy*sf;q.ph+=.05;if(q.x>W)q.x=0;if(q.y>H)q.y=0;}
  for(const q of halves){q.x+=q.vx;q.y+=q.vy;q.vy+=.15;q.r+=q.vr;q.t--;}halves=halves.filter(q=>q.t>0);
  if(won){won--;if(won===0){g.score+=hp*1000;g.over='VICTORY! THE BLADE IS SHEATHED';}return;}
  const k=A.in(0),h=A.hit(0);
  if(mode==='between'){if(--bt<=0){if(rnd_>=8){won=90;S('win');A.confetti();return;}startRound();}return;}
  if(mode==='duel'){const D=duel;if(D.ph==='wait'){D.w--;if(h.a){D.ph='lose';D.r=50;pop('TOO EARLY!',160,90,K.r);hurt();}else if(D.w<=0){D.ph='go';D.r=0;S('blip');}}
   else if(D.ph==='go'){D.r++;if(h.a){D.ph='win';D.res=D.r;D.r=60;g.score+=500+Math.max(0,40-D.res)*20;S('boom');shk(10);fl=14;flc='#ffffff';hs=10;pop('STRUCK IN '+flo(D.res*1000/60)+' MS',160,70,K.y);}else if(D.r>=D.cpu){D.ph='lose';D.r=60;pop('TOO SLOW!',160,90,K.r);hurt();}}
   else{D.r--;if(D.r<=0){if(D.ph==='win'){mode='between';bt=60;}else{duel={ph:'wait',w:90+ri(150),r:0,cpu:D.cpu+4,res:0};}}}return;}
  // fight
  const drawing=path&&!dash;sf=drawing?.15:1;
  if(!dash){if(k.a&&focus>0){if(!path){path=[[p.x,p.y-8]];ink=0;S('blip');}const hd=path[path.length-1];let nx=hd[0],ny=hd[1];if(A.mouse.t>0&&A.mouse.down){const dx=A.mouse.x-nx,dy=A.mouse.y-ny,d=hyp(dx,dy);if(d>1){const s=Math.min(d,7);nx+=dx/d*s;ny+=dy/d*s;}}else{const dx=ax(k),dy=ay(k),d=hyp(dx,dy);if(d){nx+=dx/d*4.5;ny+=dy/d*4.5;}}
    nx=cl(nx,8,312);ny=cl(ny,30,232);const sl=hyp(nx-hd[0],ny-hd[1]);if(sl>=3&&ink+sl<=MAXINK){path.push([nx,ny]);ink+=sl;}focus=Math.max(0,focus-1);}
   else if(path){if(path.length>2){dash={i:0,pts:path};S('shoot');}path=null;}else focus=Math.min(180,focus+1.2);}
  if(dash){let move=11;while(move>0&&dash.i<dash.pts.length-1){const a=dash.pts[dash.i],b=dash.pts[dash.i+1],seg=hyp(b[0]-a[0],b[1]-a[1])||1;const fx=p.x,fy=p.y-8;const toB=hyp(b[0]-fx,b[1]-fy);if(toB<=move){p.x=b[0];p.y=b[1]+8;move-=toB;dash.i++;}else{p.x+=(b[0]-fx)/toB*move;p.y+=(b[1]-fy)/toB*move;move=0;}if(b[0]!==a[0])p.f=b[0]>a[0]?1:-1;
     for(const f of foes)if(!f.cut&&hyp(f.x-p.x,f.y-p.y)<14){f.cut=1;S('hit');spark(f.x,f.y-10,'#ffffff',4,2,6);}}
    if(t%1===0)A.fx.push({x:p.x,y:p.y-12,vx:0,vy:0,t:10,c:'#ffffff',g:0,w:3});if(dash.i>=dash.pts.length-1){dash=null;sheath=20;}}
  if(sheath){sheath--;if(!sheath)sheathe();}
  for(const f of foes){f.st+=.25*sf;if(f.cut)continue;if(f.stun){f.stun--;continue;}const d=hyp(p.x-f.x,p.y-f.y)||1,a=atan2(p.y-f.y,p.x-f.x),T_=FT[f.k];
   if(f.k==='arch'){f.cd-=sf;if(f.cd<=0){f.cd=150-rnd_*8;arrows.push({x:f.x,y:f.y-12,vx:cos(a)*2.2,vy:sin(a)*2.2});S('blip');}if(d<80){f.x-=cos(a)*.3*sf;f.y-=sin(a)*.3*sf;}}
   else{if(f.wt>0){f.wt-=sf;if(f.wt<=0){if(d<24)hurt();f.cd=40;}}else if(d<20){f.wt=34;}else{let sp=T_.sp;if(f.k==='nin'){sp*=1+.6*sin(f.st*.6);if(f.cd--<=0){f.cd=120;arrows.push({x:f.x,y:f.y-10,vx:cos(a)*3,vy:sin(a)*3,sh:1});}}f.x+=cos(a)*sp*sf;f.y+=sin(a)*sp*sf;}}
   f.x=cl(f.x,10,310);f.y=cl(f.y,34,232);}
  for(const q of arrows){q.x+=q.vx*sf;q.y+=q.vy*sf;if(dash&&hyp(q.x-p.x,q.y-p.y+8)<12){q.d=1;spark(q.x,q.y,'#ffffff',4,1.5,8);g.score+=20;}else if(hyp(q.x-p.x,q.y-(p.y-10))<7){q.d=1;hurt();}}arrows=arrows.filter(q=>!q.d&&q.x>0&&q.x<W&&q.y>20&&q.y<H);
  if(!foes.length&&!sheath&&!dash){mode='between';bt=70;g.score+=200;pop('ROUND CLEAR',160,100,K.g);S('win');}};
 const foeD=(f)=>{const T_=FT[f.k],x=f.x,y=f.y,dir=p.x>x?1:-1;if(f.cut){GA(.6);}A.person(x,y,{s:f.k==='sho'?1.0:.78,c:f.stun&&t%6<3?'#ffffff':T_.c,pants:'#2a2420',st:f.st,d:dir,id:f.k==='nin'?2:4,cap:f.k==='ash'?'#8a7a4a':f.k==='nin'?'#1a1a28':f.k==='sho'?'#d0a020':undefined,arm1:f.wt>0?-2.6:undefined});GA1();
  if(f.k==='ash'){L(x+dir*5,y-25,x+dir*24,y-31-(f.wt>0?8:0),'#8a6a3a',2);P([[x+dir*24,y-31-(f.wt>0?8:0)],[x+dir*29,y-33-(f.wt>0?9:0)],[x+dir*25,y-28-(f.wt>0?8:0)]],'#d0d0d8',1);}else if(f.k==='arch'){A.c.strokeStyle='#6a4a2a';A.c.lineWidth=2;A.c.beginPath();A.c.arc(x+dir*5,y-20,8,dir>0?-1.3:PI-1.3,dir>0?1.3:PI+1.3);A.c.stroke();L(x+dir*5+cos(dir>0?-1.3:PI-1.3)*8,y-20+sin(-1.3)*8,x+dir*5+cos(dir>0?1.3:PI+1.3)*8,y-20+sin(1.3)*8,'#e0e0e0',.6);}else if(f.k==='ron'){X.rr(x+dir*4-3,y-26,6,13,1,X.lg(x-3,0,x+3,0,['#d0d0e0','#7a7a90']));}else if(f.k==='sho'){L(x+dir*5,y-22,x+dir*26,y-38,'#e8e8f8',2.4);X.glow(x,y-40,12,'#ffcf3f',.3);for(let i=0;i<f.hp;i++)X.heart(x-6+i*4,y-44,.45,'#ff4060');}else{L(x+dir*5,y-20,x+dir*15,y-25,'#c0c0d0',1.5);R(x-4,y-30,8,2,'#1a1a28');}
  if(f.wt>0&&t%6<4){X.glow(x,y-44,9,'#ff3040',.5);TS('!',x,y-48,K.r,2,'c');}if(f.cut){A.c.strokeStyle='#ff2040';A.c.lineWidth=2;A.c.beginPath();A.c.moveTo(x-10,y-28);A.c.lineTo(x+10,y-4);A.c.stroke();A.c.strokeStyle='#ffffff';A.c.lineWidth=.7;A.c.stroke();}};
 g.draw=()=>{if(mode==='duel'){const D=duel;fillG(0,0,W,H,grad(0,0,0,H,[[0,'#ff7a3a'],[.55,'#ffd08a'],[.56,'#3a2a2a'],[1,'#1a1010']]));C(160,132,40,'#fff0c0');GA(.3);for(let i=0;i<5;i++)L(0,140+i*16,W,140+i*16,'#000000');GA1();
   const go=D.ph==='go',wn=D.ph==='win',ls=D.ph==='lose';A.person(wn?230:90,200,{s:1.6,c:'#c02a2a',pants:'#2a1a1a',d:1,id:0,hair:'#101010',arm1:wn?-2.8:undefined});L(wn?240:100,170,wn?262:114,wn?150:182,'#e8e8f0',2);
   A.person(230,200,{s:1.6,c:wn?'#808080':'#3a3a5a',pants:'#1a1a2a',d:-1,id:3,cap:'#2a2a3a'});if(wn&&D.r<40){GA(.9);L(0,160,W,150,'#ffffff',3);GA1();}
   fillG(0,0,W,24,'#000000');fillG(0,H-24,W,24,'#000000');T('DUEL',160,8,K.y,2,'c');for(let i=0;i<24;i++){const q=petals[i];GA(.7);R(q.x,q.y,2,1+sin(q.ph),'#ffb0c8');}GA1();
   if(go){T('!',160,60,K.r,6,'c');}else if(D.ph==='wait')T('WAIT FOR IT... THEN PRESS A',160,H-15,K.w,1,'c');else if(wn)T('ONE CUT.',160,60,K.w,3,'c');else if(ls)T('DEFEATED',160,60,K.r,3,'c');
   for(let i=0;i<hp;i++)heart(10+i*11,12,K.r,1);if(fl){GA(fl/20);R(0,0,W,H,flc);GA1();}return;}
  X.cache('ss_garden',()=>{X.vg(0,0,W,H,['#efe2c4','#d6c096']);
   /* raked sand: long combed lines that ripple around each stone */
   const ST=[[46,78,15],[278,196,19],[62,212,10],[250,70,8]];A.c.lineWidth=1;for(let y=38;y<H;y+=5){A.c.strokeStyle=y%10?'rgba(150,120,70,.28)':'rgba(255,250,235,.45)';A.c.beginPath();for(let x=0;x<=W;x+=4){let yy=y+sin(x*.03+y*.1)*1.2;for(const st of ST){const dx=x-st[0],dy=y-st[1],d=Math.sqrt(dx*dx+dy*dy*2.2),R_=st[2]*2.2;if(d<R_)yy+=(dy>=0?1:-1)*(R_-d)*.35;}x?A.c.lineTo(x,yy):A.c.moveTo(x,yy);}A.c.stroke();}
   for(const st of ST){for(let k=1;k<4;k++){A.c.strokeStyle=k%2?'rgba(150,120,70,.35)':'rgba(255,250,235,.5)';A.c.beginPath();A.c.ellipse(st[0],st[1],st[2]+k*4,st[2]*.7+k*3,0,0,TAU);A.c.stroke();}
    ell(st[0]+3,st[1]+st[2]*.45,st[2]*1.1,st[2]*.4,'rgba(60,40,20,.3)');ell(st[0],st[1],st[2],st[2]*.72,X.rg(st[0]-st[2]*.4,st[1]-st[2]*.4,1,st[0],st[1],st[2]*1.1,['#b8b4ac','#7c7a74','#4e4c48']));ell(st[0]-st[2]*.3,st[1]-st[2]*.3,st[2]*.4,st[2]*.2,'rgba(255,255,255,.25)');ell(st[0]+st[2]*.2,st[1]-st[2]*.5,st[2]*.5,st[2]*.18,'rgba(90,130,60,.55)');}
   /* cherry tree in the corner, stone lantern opposite */
   const tx=292,ty=96;ell(tx-6,ty+30,30,8,'rgba(60,40,20,.25)');X.stroke([[tx,ty+30],[tx-4,ty+8],[tx-14,ty-14]],'#4a2a20',5);X.stroke([[tx-4,ty+8],[tx+10,ty-8]],'#4a2a20',3);X.stroke([[tx-14,ty-14],[tx-30,ty-20]],'#4a2a20',2);
   for(let i=0;i<26;i++){const a=hash(i,3)*TAU,r=8+hash(i,4)*22;X.disc(tx-10+cos(a)*r,ty-14+sin(a)*r*.6,4+hash(i,5)*4,i%3?'#ffb8cc':i%2?'#ff9ab8':'#ffd4e0');}
   const lx=24,ly=150;ell(lx+2,ly+16,10,3,'rgba(0,0,0,.3)');X.block(lx-6,ly+6,12,10,'#8a8880',1);X.block(lx-3,ly-2,6,9,'#9a9890',1);R(lx-2,ly+1,4,3,'#ffd890');X.poly([[lx-10,ly-2],[lx+10,ly-2],[lx+5,ly-8],[lx-5,ly-8]],'#7a7870');X.disc(lx,ly-10,2.2,'#7a7870');
   /* veranda: dark wood eave with lanterns along the top edge */
   X.vg(0,0,W,30,['#2a1810','#4a2e20']);for(let i=0;i<W;i+=20){X.rr(i+1,22,18,8,1,X.lg(0,22,0,30,['#7a4a30','#4a2a1c']));}R(0,30,W,3,'#1a0e08');for(let i=0;i<W;i+=40)R(i+18,0,4,30,'#1e120c');
   X.vignette(.3);});
  for(const lx of[60,260]){const sw=sin(t*.04+lx)*1.5;L(lx,30,lx+sw,38,'#2a1a10',1);X.glow(lx+sw,45,12,'#ff6a3a',.35);X.rr(lx+sw-5,38,10,13,4,X.lg(lx-5,0,lx+5,0,['#c02a20','#ff5a3a','#c02a20']));R(lx+sw-5,38,10,1.5,'#2a1a10');R(lx+sw-5,50,10,1.5,'#2a1a10');}
  const sorted=foes.slice().sort((a,b)=>a.y-b.y);for(const f of sorted)if(f.y<p.y)foeD(f);
  if(p.inv%8<5||!p.inv){if(dash)X.glow(p.x,p.y-14,20,'#ffffff',.3);A.person(p.x,p.y,{s:.86,c:'#c02a2a',pants:'#2a1a1a',st:dash?t:0,d:p.f,id:0,hair:'#101010',arm2:dash?-1.4:undefined});R(p.x-4,p.y-14,8,2,'#f0d040');const sx=p.x+p.f*5,sy=p.y-22;L(sx,sy,p.x+p.f*(dash?26:12),p.y-(dash?22:38),'#f4f4ff',dash?2.4:1.8);L(sx,sy,sx+p.f*2,sy-1,'#1a1a1a',3);}
  for(const f of sorted)if(f.y>=p.y)foeD(f);
  for(const q of halves){GA(Math.min(1,q.t/20));rot(q.x,q.y,q.r,()=>{R(-5,q.top?-6:0,10,6,q.c);if(q.top)C(0,-8,3,'#f1c7a3');fillG(-5,q.top?0:0,10,1,'#b00020');});}GA1();
  for(const q of arrows){if(q.sh){rot(q.x,q.y,t*.5,()=>{R(-3,-1,6,2,'#c0c0d0');R(-1,-3,2,6,'#c0c0d0');});}else L(q.x,q.y,q.x-q.vx*3,q.y-q.vy*3,'#5a3a20',1.5);}
  if(path){GA(.25);R(0,0,W,H,'#203040');GA1();A.c.strokeStyle='rgba(20,10,10,.85)';A.c.lineWidth=3;A.c.beginPath();path.forEach((q,i)=>i?A.c.lineTo(q[0],q[1]):A.c.moveTo(q[0],q[1]));A.c.stroke();A.c.strokeStyle='rgba(255,40,60,.7)';A.c.lineWidth=1;A.c.stroke();const hd=path[path.length-1];C(hd[0],hd[1],3,K.r);}
  if(dash){A.c.strokeStyle='rgba(255,255,255,.6)';A.c.lineWidth=2;A.c.beginPath();dash.pts.forEach((q,i)=>i?A.c.lineTo(q[0],q[1]):A.c.moveTo(q[0],q[1]));A.c.stroke();}
  for(const q of petals){GA(.75);R(q.x,q.y,2,1+Math.abs(sin(q.ph)),'#ffa8c0');}GA1();if(fl){GA(fl/20);R(0,0,W,H,flc);GA1();}vign(path?.6:.35);
  for(let i=0;i<hp;i++)heart(10+i*11,12,K.r,1);T('ROUND '+Math.max(1,rnd_)+'/8',160,5,K.w,1,'c');T('SCORE '+g.score,W-6,5,K.y,1,'r');T('FOCUS',112,15,K.gr,1);bar(136,15,50,5,focus/180,K.c);T('INK',196,15,K.gr,1);bar(210,15,50,5,1-(path?ink:0)/MAXINK,K.r);
  if(mode==='between'&&rnd_===0)T('HOLD A, STEER THE BRUSH, RELEASE TO STRIKE',160,120,'#3a2420',1,'c');};
 return g;}});

/* ---- GRAPPLE HOOK ---- */
A.add({id:'grapple',name:'GRAPPLE HOOK',cat:'ACTION',how:'HOLD A TO HOOK A RING, RELEASE TO FLING. LEFT/RIGHT PUMP, UP/DOWN REEL.',make(){
 const g={over:null,score:0},GR=.28,RANGE=150;
 const SK=[['#5ab0ff','#d0f0ff','#4a9a3a'],['#ff8a5a','#ffd8a0','#6a8a3a'],['#141c40','#4a3a7a','#2a5a4a']];
 let lvl=0,ground=[],anchors=[],saws=[],coins=[],cps=[],goal=0,p,rope=null,camX=0,lives=5,dead=0,cp=40,t=0,fl=0,maxX=0,trail=[];
 const build=()=>{const r=srng(311+lvl*97);ground=[];anchors=[];saws=[];coins=[];cps=[];let x=-200;ground.push({x,w:560,y:200});anchors.push({x:250,y:86});x=360;const len=3000+lvl*600;
  while(x<len){const gap=110+r()*(90+lvl*50),nA=gap>200?2:1;for(let i=0;i<nA;i++){const ax_=x+gap*(i+1)/(nA+1)+(r()-.5)*20,ay_=50+r()*40;anchors.push({x:ax_,y:ay_});if(r()<.8)for(let c=0;c<3;c++)coins.push({x:ax_-30+c*30,y:ay_+90+Math.abs(c-1)*-12});}
   if(lvl>0&&r()<.3+lvl*.15)saws.push({x:x+gap/2+(r()-.5)*40,y:150+r()*30,r:10,ph:r()*TAU,amp:lvl>1?20:0});
   x+=gap;const w=90+r()*170,y=180+r()*30;ground.push({x,w,y});if(r()<.35&&w>140)anchors.push({x:x+w/2,y:60+r()*30});if(cps.length===0||x-cps[cps.length-1]>900)cps.push(x+20);x+=w;}
  goal=x-60;ground[ground.length-1].w+=200;};
 const spawn=()=>{const gy=gAt(cp)||180;p={x:cp,y:gy,vx:0,vy:0,on:1,st:0,f:1};rope=null;};
 const gAt=x=>{for(const q of ground)if(x>=q.x&&x<=q.x+q.w)return q.y;return null;};
 build();spawn();g._gp=()=>({p,rope,anchors,lvl,goal,lives});
 const target=()=>{let b=null,bd=1e9;for(const a of anchors){const dx=a.x-p.x,dy=a.y-p.y,d=hyp(dx,dy);if(d<RANGE&&dy<-10&&dx>-60){const sc=d-dx*.4;if(sc<bd){bd=sc;b=a;}}}return b;};
 const die=()=>{dead=50;lives--;rope=null;S('boom');shk(8);fl=10;A.burst(p.x-camX,cl(p.y,0,H-4),K.r,20,2.6);};
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;
  if(dead){dead--;if(!dead){if(lives<=0){g.over='OUT OF ROPE ON LEVEL '+(lvl+1);return;}spawn();}return;}
  const k=A.in(0),h=A.hit(0),dx=ax(k);if(dx)p.f=dx;
  if(k.a&&!rope){const a=target();if(a){{const d0=hyp(a.x-p.x,a.y-p.y);rope={a,len:d0,tl:Math.max(30,Math.min(d0*.95,170-a.y))};}p.on=0;S('jump');}else if(h.a&&p.on){p.vy=-5.6;p.on=0;S('jump');}}
  if(!k.a&&rope){rope=null;if(p.vy<-1)p.vy*=1.1;S('blip');}
  if(rope){if(k.u)rope.tl=Math.max(24,rope.tl-1.6);if(k.d)rope.tl=Math.min(RANGE,rope.tl+1.6);rope.len+=cl(rope.tl-rope.len,-3,1.6);const rx=p.x-rope.a.x,ry=p.y-rope.a.y,d=hyp(rx,ry)||1;const tx=ry/d,ty=-rx/d,along=(p.vx*tx+p.vy*ty)*dx;p.vx+=tx*dx*(along>=0?.13:.03);p.vy+=ty*dx*(along>=0?.13:.03);}
  else if(!p.on)p.vx+=dx*.06;else{p.vx+=(dx*2.4-p.vx)*.3;if(dx)p.st+=.3;}
  p.vy+=GR;p.vx*=rope?.998:.995;if(p.vy>9)p.vy=9;const py0=p.y;p.x+=p.vx;p.y+=p.vy;
  if(rope){const rx=p.x-rope.a.x,ry=p.y-rope.a.y,d=hyp(rx,ry)||1;if(d>rope.len){const nx=rx/d,ny=ry/d;p.x=rope.a.x+nx*rope.len;p.y=rope.a.y+ny*rope.len;const vn=p.vx*nx+p.vy*ny;if(vn>0){p.vx-=vn*nx;p.vy-=vn*ny;}}}
  p.on=0;const gy=gAt(p.x);if(gy!==null&&p.vy>=0&&py0<=gy+1&&p.y>=gy){p.y=gy;p.vy=0;p.on=1;if(rope&&p.vx<1)rope=null;}
  for(const q of ground)if(p.y>q.y+4&&p.y<q.y+60&&p.x>q.x-4&&p.x<q.x+4&&p.vx>0){p.x=q.x-4;p.vx=-p.vx*.3;}
  if(p.y>H+20){die();return;}if(p.x<camX)p.x=camX,p.vx=Math.abs(p.vx);
  for(const s of saws){const sy=s.y+sin(t*.04+s.ph)*s.amp;if(hyp(p.x-s.x,p.y-10-sy)<s.r+5){die();return;}}
  for(const c of coins)if(!c.got&&hyp(c.x-p.x,c.y-(p.y-10))<12){c.got=1;g.score+=50;S('coin');spark(c.x-camX,c.y,K.y,6,1.5,10);}
  for(const c of cps)if(p.x>c&&cp<c){cp=c;pop('CHECKPOINT',160,70,K.g);S('score');}
  if(p.x>maxX+10){g.score+=flo((p.x-maxX)/10);maxX=p.x;}
  if(t%2===0){trail.push({x:p.x,y:p.y-10});if(trail.length>10)trail.shift();}
  if(p.x>=goal){g.score+=1000;S('win');A.confetti();if(lvl>=2){g.over='ALL CLEAR! WIN';return;}lvl++;pop('LEVEL '+(lvl+1),160,80,K.y);build();cp=40;maxX=0;camX=0;spawn();lives++;}
  camX+=(Math.max(0,p.x-110+p.vx*12)-camX)*.1;};
 g.draw=()=>{const sk=SK[lvl];X.cache('gp_sky'+lvl,()=>{X.sky([sk[0],sk[1]]);if(lvl===2)X.stars(60,7,0,0,140,.9);X.glow(lvl===1?250:70,lvl===1?60:40,40,lvl===2?'#c0c8ff':'#fff4c0',.6);X.disc(lvl===1?250:70,lvl===1?60:40,lvl===2?10:14,lvl===2?'#e8ecff':'#fff8e0');});
  for(let i=0;i<6;i++){const x=((i*90-camX*.08)%540+540)%540-90,y=30+(i%3)*16;GA(lvl===2?.25:.85);X.disc(x,y,12,'#ffffff');X.disc(x+13,y+3,10,'#ffffff');X.disc(x-12,y+4,8,'#ffffff');X.rr(x-18,y+2,40,9,4,'#ffffff');GA1();}
  X.hills(170,60,A.mix(sk[1],'#3a4a6a',.45),camX*.15,.012,lvl+1);X.hills(190,40,A.mix(sk[2],'#000000',.35),camX*.3,.02,lvl+4);X.hills(215,22,A.mix(sk[2],'#000000',.15),camX*.5,.03,lvl+7);
  for(const q of ground){const sx=q.x-camX;if(sx>W||sx+q.w<0)continue;const x0=Math.max(-2,sx),x1=Math.min(W+2,sx+q.w);X.vg(x0,q.y,x1-x0,H-q.y,['#8a6440','#5a3e26','#2a1c12']);for(let yy=q.y+14;yy<H;yy+=12)R(x0,yy,x1-x0,1,'rgba(0,0,0,.12)');for(let i=8;i<q.w;i+=23){const xx=sx+i;if(xx<x0||xx>x1)continue;ell(xx,q.y+14+(i%3)*8,2.2,1.4,'#6a4a2e');}
   X.vg(x0,q.y-1,x1-x0,7,[A.mix(sk[2],'#ffffff',.25),sk[2],A.mix(sk[2],'#000000',.3)]);for(let xx=Math.ceil(x0/5)*5;xx<x1;xx+=5){const hh=2+hash(flo((xx+camX)/5),lvl)*3;P([[xx,q.y],[xx+1.5,q.y-hh],[xx+3,q.y]],A.mix(sk[2],'#ffffff',.15),1);}R(sx,q.y,2,H-q.y,'rgba(0,0,0,.25)');R(sx+q.w-2,q.y,2,H-q.y,'rgba(0,0,0,.25)');}
  for(let i=-((camX*.9)%10);i<W;i+=10){P([[i,H],[i+5,H-10],[i+10,H]],'#9a9aa8',1);P([[i+5,H-10],[i+7,H],[i+5,H]],'#d8d8e4',1);}
  for(const c of cps){const sx=c-camX;if(sx<-10||sx>W+10)continue;const gy=gAt(c)||200;L(sx,gy,sx,gy-30,'#dddddd',2);P([[sx,gy-30],[sx+12,gy-25],[sx,gy-20]],cp>=c?K.g:'#888888',1);}
  {const sx=goal-camX;if(sx<W+20){const gy=gAt(goal)||200;for(let i=0;i<6;i++)for(let j=0;j<4;j++)R(sx+j*5,gy-50+i*5,5,5,(i+j)%2?'#ffffff':'#202020');L(sx,gy,sx,gy-50,'#dddddd',2);}}
  const tg=rope?null:target();for(const a of anchors){const sx=a.x-camX;if(sx<-20||sx>W+20)continue;const on=(rope&&rope.a===a)||tg===a;L(sx,a.y-6,sx,a.y-20,'#5a5a6a',2);X.block(sx-5,a.y-24,10,5,'#7a7a8e',1);X.glow(sx,a.y,on?18:10,on?'#ffcf3f':'#9ad8ff',on?.55+.2*sin(t*.3):.25);A.c.strokeStyle=on?'#ffcf3f':'#c8ccd8';A.c.lineWidth=3;A.c.beginPath();A.c.arc(sx,a.y,6.5,0,TAU);A.c.stroke();A.c.strokeStyle=on?'#fff6c0':'#ffffff';A.c.lineWidth=1;A.c.beginPath();A.c.arc(sx,a.y,6.5,3.6,5.2);A.c.stroke();if(on&&!rope&&!dead){GA(.35+.2*sin(t*.3));A.c.setLineDash&&A.c.setLineDash([3,3]);L(p.x-camX,p.y-16,sx,a.y,'#ffcf3f',1);A.c.setLineDash&&A.c.setLineDash([]);GA1();}}
  for(const s of saws){const sx=s.x-camX,sy=s.y+sin(t*.04+s.ph)*s.amp;if(sx<-20||sx>W+20)continue;X.glow(sx,sy,s.r+8,'#ff4040',.2);rot(sx,sy,t*.3,()=>{const pts=[];for(let i=0;i<16;i++){const a=i/16*TAU,rr=i%2?s.r:s.r+4;pts.push([cos(a)*rr,sin(a)*rr]);}X.poly(pts,X.lg(-s.r,-s.r,s.r,s.r,['#ffffff','#b8b8c4','#6a6a78']));X.disc(0,0,s.r*.55,'#8a8a98');C(0,0,3,'#404048');});}
  for(const c of coins){if(c.got)continue;const sx=c.x-camX;if(sx<-10||sx>W+10)continue;const w=Math.abs(cos(t*.08+c.x))*4+1;X.glow(sx,c.y,8,'#ffcf3f',.3);ell(sx,c.y,w,5,X.lg(sx-w,0,sx+w,0,['#fff3a0','#ffcf3f','#c08a10']));}
  if(!dead){const sp=hyp(p.vx,p.vy);if(sp>4)trail.forEach((q,i)=>{GA(i/trail.length*.3);C(q.x-camX,q.y,3,'#ffffff');});GA1();
   if(rope){L(p.x-camX,p.y-20,rope.a.x-camX,rope.a.y,'#3a2a1a',2.4);L(p.x-camX,p.y-20,rope.a.x-camX,rope.a.y,'#e8c890',1);}
   A.person(p.x-camX,p.y,{s:.76,c:'#e04a3a',pants:'#2a3a6a',st:p.st,d:p.vx<-.3?-1:1,id:2,cap:'#203060',arm1:rope?-2.8:p.on?undefined:-1.8,arm2:rope?-2.6:p.on?undefined:1.9});if(sp>6)for(let i=0;i<3;i++){GA(.4);L(p.x-camX-p.vx*3,p.y-20+i*6,p.x-camX-p.vx*5,p.y-20+i*6,'#ffffff');}GA1();}
  if(fl){GA(fl/20);R(0,0,W,H,K.r);GA1();}
  X.bar('','');T('LEVEL '+(lvl+1)+'/3',6,5,K.w,1);X.meter(66,5,150,7,p.x/goal,'#ffcf3f');T('SCORE '+g.score,W-6,5,K.y,1,'r');for(let i=0;i<lives;i++)X.heart(W-10-i*11,24,1);if(lvl===0&&maxX<400&&!dead){X.panel(54,30,212,22,'#ffcf3f');T('RUN RIGHT. HOLD A NEAR A GLOWING RING,',160,34,K.w,1,'c');T('PUMP LEFT/RIGHT, LET GO TO FLING!',160,43,K.y,1,'c');}};
 return g;}});

/* ---- ZOMBIE ROAD ---- */
A.add({id:'zombieroad',name:'ZOMBIE ROAD',cat:'ACTION',time:300,how:'RIGHT GAS, LEFT BRAKE, UP/DOWN TILT. PLOW ZOMBIES, UPGRADE, REACH EVAC.',make(){
 const g={over:null,score:0},LEN=5600,DAYS=10;
 const UP=[{k:'eng',n:'ENGINE',d:'MORE SPEED'},{k:'fuel',n:'FUEL TANK',d:'DRIVE FARTHER'},{k:'arm',n:'ARMOR + PLOW',d:'TOUGHER, KEEPS SPEED'},{k:'boost',n:'ROCKET BOOST',d:'B FIRES THE BOOSTER'},{k:'gun',n:'ROOF GUN',d:'HOLD A TO SHOOT'}],COST=[50,120,220,360,520];
 const lv={eng:0,fuel:0,arm:0,boost:0,gun:0};let cash=0,day=1,best=0,kills=0,mode='shop',sel=5,t=0,car,zs=[],flyers=[],bul=[],crates=[],camX=0,camY=0,stopT=0,endMsg='',fl=0,hs=0,runCash=0;
 const hs_=[];{const r=srng(808);let y=190,i=0;while(i*4<LEN+800){const x=i*4;let ty=190+sin(x*.004)*14+sin(x*.011)*6;hs_.push(ty);i++;}
  for(let k=0;k<14;k++){const x0=500+k*370+flo(r()*120),n=18;const i0=flo(x0/4);for(let j=0;j<n;j++)if(hs_[i0+j]!==undefined)hs_[i0+j]-=j*2.6;}}
 const hgt=x=>{const i=cl(x/4,0,hs_.length-2),i0=flo(i),f=i-i0;return hs_[i0]*(1-f)+hs_[i0+1]*f;};
 const slope=x=>atan2(hgt(x+6)-hgt(x-6),12);
 const newRun=()=>{car={x:60,y:hgt(60),vx:0,vy:0,a:0,on:1,hp:60+lv.arm*30,mh:60+lv.arm*30,fuel:100+lv.fuel*70,mf:100+lv.fuel*70,bf:lv.boost?60+lv.boost*40:0,mbf:lv.boost?60+lv.boost*40:0,wr:0,boosting:0};zs=[];flyers=[];bul=[];crates=[];stopT=0;runCash=0;
  const r=srng(day*131);for(let x=300;x<LEN;x+=26+r()*60*(1-x/LEN*.5)){const n=r()<.25?2+flo(r()*3):1;for(let j=0;j<n;j++)zs.push({x:x+j*9,k:r()<.15+x/LEN*.15?'fat':'z',st:r()*TAU,hp:r()<.1?2:1});}
  for(let x=900;x<LEN;x+=500+r()*400)crates.push({x,hp:3});mode='drive';camX=0;};
 const endRun=(why)=>{const m=flo(car.x/10);best=Math.max(best,m);mode='end';endMsg=why;g.score=best+kills*5;sel=5;};
 newRun();g._zr=()=>({mode,sel,cash,lv,car,day,best});
 g.update=()=>{if(g.over)return;t++;if(fl)fl--;const k=A.in(0),h=A.hit(0);
  if(mode==='shop'){if(h.u){sel=(sel+5)%6;S('blip');}if(h.d){sel=(sel+1)%6;S('blip');}if(h.a){if(sel===5){newRun();S('coin');}else{const u=UP[sel],c=COST[lv[u.k]];if(lv[u.k]<4&&cash>=c){cash-=c;lv[u.k]++;S('win');pop(u.n+' LV '+lv[u.k],160,40,K.y);}else S('lose');}}return;}
  if(mode==='end'){if(++stopT>60&&h.a){day++;if(day>DAYS){g.over='THE HORDE WON';return;}mode='shop';sel=5;}return;}
  if(hs){hs--;return;}
  const c=car,eng=.055+lv.eng*.018,top=3.4+lv.eng*.7;
  if(c.on){const sl=slope(c.x);c.a+=dang(c.a,sl)*.5;if(k.r&&c.fuel>0){c.vx+=eng*cos(sl);c.fuel-=.09+lv.eng*.01;c.wr+=c.vx*.3;}if(k.l)c.vx*=.94;c.vx-=.06*sin(sl);c.vx*=.996;if(c.vx>top)c.vx=Math.max(top,c.vx*.98);
   const ny=hgt(c.x+c.vx),vyg=ny-c.y;if(vyg>3.2&&c.vx>1.5){c.on=0;c.vy=vyg*.4;}else{c.x+=c.vx;c.y=hgt(c.x);}}
  else{c.vy+=.22;c.x+=c.vx;c.y+=c.vy;c.a+=(k.u?-.06:0)+(k.d?.06:0);c.wr+=.2;const gy=hgt(c.x);if(c.y>=gy){c.y=gy;const bad=Math.abs(dang(c.a,slope(c.x)));if(bad>.9){c.hp-=22;c.vx*=.4;shk(10);S('boom');fl=8;A.burst(c.x-camX,c.y-camY-8,'#808080',16,2.5);pop('CRASH!',160,80,K.r);}else{shk(3);S('hit');if(bad<.25){runCash+=8;cash+=8;pop('NICE LANDING +8',160,80,K.g);}}c.on=1;c.vy=0;c.a=slope(c.x);}}
  if(k.b&&c.bf>0){c.bf--;c.vx+=.18;c.boosting=1;if(!c.on)c.vy-=.05;if(t%2===0)A.fx.push({x:c.x-camX-cos(c.a)*20,y:c.y-camY-8-sin(c.a)*20,vx:-2-rnd(1),vy:rnd(1)-.5,t:14,c:t%4?K.o:K.y,g:0});}else c.boosting=0;
  if(lv.gun&&A.fire(Math.max(5,16-lv.gun*3))){bul.push({x:c.x+cos(c.a)*6,y:c.y-22+sin(c.a)*6,vx:cos(c.a)*8+c.vx,vy:sin(c.a)*8});S('shoot');}
  for(const b of bul){b.x+=b.vx;b.y+=b.vy;for(const z of zs){if(!z.dead&&Math.abs(z.x-b.x)<5&&b.y>hgt(z.x)-22&&b.y<hgt(z.x)){z.hp--;b.d=1;spark(b.x-camX,b.y-camY,'#5a8a3a',4,1.5,8);if(z.hp<=0){z.dead=1;kills++;cash+=3;runCash+=3;}break;}}}bul=bul.filter(b=>!b.d&&b.x<camX+340);
  const plow=lv.arm;for(const z of zs){if(z.dead)continue;if(z.x>c.x+200||z.x<c.x-40){continue;}z.st+=.15;z.x-=.25;const zy=hgt(z.x);if(Math.abs(z.x-(c.x+16))<10&&c.y>zy-24){if(c.vx>2.2||c.boosting){z.dead=1;kills++;const pay=z.k==='fat'?8:4;cash+=pay;runCash+=pay;c.vx*=z.k==='fat'?.8+plow*.04:.9+plow*.02;c.hp-=Math.max(0,2-plow*.5);flyers.push({x:z.x,y:zy,vx:c.vx*1.2+rnd(2),vy:-3-rnd(3)-c.vx*.3,r:0,vr:(rnd(2)-1)*.4,k:z.k,t:90});A.burst(z.x-camX,zy-camY-10,'#7a1010',10,2.2);S('hit');shk(2);hs=1;}else{c.vx*=.9;c.hp-=.25;if(t%20===0){S('hit');spark(z.x-camX,zy-camY-12,'#7a1010',3,1,10);}}}}
  for(const q of crates)if(q.hp>0&&Math.abs(q.x-(c.x+16))<12&&c.y>hgt(q.x)-20){q.hp=0;c.vx*=.55;c.hp-=Math.max(1,8-plow*2);S('boom');shk(5);A.burst(q.x-camX,hgt(q.x)-camY-10,'#a07040',16,2.5);}
  for(const f of flyers){f.x+=f.vx;f.y+=f.vy;f.vy+=.25;f.r+=f.vr;f.t--;if(f.y>hgt(f.x)){f.y=hgt(f.x);f.vy*=-.3;f.vx*=.6;f.vr*=.5;}}flyers=flyers.filter(f=>f.t>0);
  const m=flo(c.x/10);g.score=Math.max(best,m)+kills*5;
  if(c.x>=LEN){mode='won';g.score+=2000+(DAYS-day)*500;g.over='ESCAPED ON DAY '+day+'! WIN';S('win');A.confetti();return;}
  if(c.hp<=0){S('lose');shk(10);endRun('CAR WRECKED');return;}
  if(Math.abs(c.vx)<.15&&c.on){stopT++;if(stopT>70)endRun(c.fuel<=0?'OUT OF FUEL':'STALLED');}else stopT=0;if(c.fuel<0)c.fuel=0;
  camX+=(c.x-100+c.vx*10-camX)*.12;camY+=(c.y-160-camY)*.08;};
 const zomb=(x,y,st,k,rr)=>{const s=k==='fat'?.85:.7,o={s,c:k==='fat'?'#6a5a7a':'#5a6a8a',pants:'#3a3028',skin:'#8ab070',hair:'#3a3a20',st,d:-1,arm1:1.5,arm2:1.3,id:3};if(rr!==undefined)rot(x,y-10,rr,()=>A.person(0,10,o));else A.person(x,y,o);};
 const carD=()=>{const c=car,x=c.x-camX,y=c.y-camY;rot(x,y,c.a,()=>{GA(.3);R(-20,-2,40,3,'#000000');GA1();R(-20,-16,40,10,'#c83a2a');R(-8,-24,18,9,'#a02a20');R(-6,-23,7,6,'#a0d0f0');R(3,-23,6,6,'#a0d0f0');R(-20,-12,40,2,'#e86a4a');if(lv.arm){P([[20,-16],[27,-4],[20,-4]],'#9a9aa0',1);for(let i=0;i<lv.arm;i++)R(-18+i*4,-10,3,3,'#6a6a70');}
  if(lv.gun){R(-4,-28,10,4,'#404048');R(4,-27,9,2,'#202028');}if(lv.boost){R(-26,-14,7,6,'#606068');}
  for(const wx of[-12,12]){C(wx,-4,6,'#202020');C(wx,-4,3,'#909090');L(wx,-4,wx+cos(c.wr)*3,-4+sin(c.wr)*3,'#404040',1.5);}});};
 g.draw=()=>{if(mode==='shop'){fillG(0,0,W,H,grad(0,0,0,H,[[0,'#2a2018'],[1,'#120c08']]));T('GARAGE - DAY '+day+'/'+DAYS,160,10,K.y,2,'c');T('CASH '+cash,160,28,K.g,1,'c');T('BEST '+best+' M OF '+(LEN/10)+' M',160,38,K.gr,1,'c');
   UP.forEach((u,i)=>{const y=52+i*26,on=sel===i,l=lv[u.k],c=COST[l];R(30,y,260,22,on?'#3a2a50':'#1e1810');A.box(30,y,260,22,on?K.y:'#4a3a2a');T(u.n,38,y+4,on?K.y:K.w,1);T(u.d,38,y+13,K.gr,1);for(let j=0;j<4;j++)R(190+j*12,y+5,9,6,j<l?K.g:'#3a3a3a');T(l>=4?'MAX':''+c,284,y+8,l>=4?K.gr:cash>=c?K.g:K.r,1,'r');});
   const y=52+5*26,on=sel===5;R(110,y,100,22,on?'#2a6a2a':'#1a3a1a');A.box(110,y,100,22,on?K.y:K.g);T('DRIVE!',160,y+8,K.w,1,'c');T('UP/DOWN PICK   A BUY OR DRIVE',160,H-10,K.gr,1,'c');return;}
  fillG(0,0,W,H,grad(0,0,0,H,[[0,'#3a1a2a'],[.6,'#a04a3a'],[1,'#e08a4a']]));C(250,70-camY*.1,22,'#ffb070');
  for(let i=0;i<12;i++){const x=((i*44-camX*.25)%528+528)%528-44,h=30+hash(i,9)*50;fillG(x,170-h-camY*.3,30,h+60,'#2a1420');for(let w=0;w<3;w++)if(hash(i,w)>.5)fillG(x+5+w*8,180-h-camY*.3,3,3,'#e0a040');}
  A.c.fillStyle='#3a2a20';A.c.beginPath();A.c.moveTo(0,H);for(let sx=0;sx<=W+4;sx+=4)A.c.lineTo(sx,hgt(camX+sx)-camY);A.c.lineTo(W,H);A.c.fill();A.c.strokeStyle='#6a5a4a';A.c.lineWidth=3;A.c.beginPath();for(let sx=0;sx<=W+4;sx+=4)sx?A.c.lineTo(sx,hgt(camX+sx)-camY):A.c.moveTo(sx,hgt(camX+sx)-camY);A.c.stroke();
  for(let m=flo(camX/500)*500;m<camX+W+10;m+=500){if(m<=0)continue;const sx=m-camX,gy=hgt(m)-camY;L(sx,gy,sx,gy-16,'#cccccc');R(sx-8,gy-24,16,8,'#2a6a2a');T(''+m/10,sx,gy-22,K.w,1,'c');}
  {const sx=LEN-camX;if(sx<W+40){const gy=hgt(LEN)-camY;R(sx,gy-50,30,50,'#4a5a4a');R(sx+4,gy-46,22,8,K.g);T('EVAC',sx+15,gy-44,'#102010',1,'c');}}
  for(const q of crates)if(q.hp>0){const sx=q.x-camX,gy=hgt(q.x)-camY;if(sx>-20&&sx<W+20){R(sx-8,gy-16,16,16,'#a07040');L(sx-8,gy-16,sx+8,gy,'#6a4020');L(sx+8,gy-16,sx-8,gy,'#6a4020');}}
  for(const z of zs){if(z.dead)continue;const sx=z.x-camX;if(sx<-20||sx>W+20)continue;zomb(sx,hgt(z.x)-camY,z.st,z.k);}
  for(const f of flyers){GA(Math.min(1,f.t/30));zomb(f.x-camX,f.y-camY,0,f.k,f.r);}GA1();
  carD();for(const b of bul)L(b.x-camX,b.y-camY,b.x-camX-b.vx,b.y-camY-b.vy,K.y,1.5);
  if(fl){GA(fl/20);R(0,0,W,H,K.r);GA1();}
  R(0,0,W,18,'rgba(0,0,0,.5)');T('DAY '+day,6,6,K.w,1);T('FUEL',40,6,K.gr,1);bar(58,5,50,7,car.fuel/car.mf,car.fuel<20?K.r:K.y);T('HP',114,6,K.gr,1);bar(124,5,40,7,car.hp/car.mh,K.g);if(car.mbf){T('BST',170,6,K.gr,1);bar(184,5,30,7,car.bf/car.mbf,K.o);}T(flo(car.x/10)+' M',W-6,6,K.y,1,'r');
  bar(6,22,W-12,3,car.x/LEN,'#ffffff','rgba(0,0,0,.3)');T('CASH '+cash,6,29,K.g,1);
  if(mode==='end'){GA(.75);R(40,70,240,90,'#000000');GA1();A.box(40,70,240,90,K.y);T(endMsg,160,82,K.r,2,'c');T('DISTANCE '+flo(car.x/10)+' M',160,104,K.w,1,'c');T('CASH THIS RUN +'+runCash,160,116,K.g,1,'c');T('BEST '+best+' M',160,128,K.c,1,'c');if(stopT>60)T('A: BACK TO THE GARAGE',160,144,K.y,1,'c');}};
 return g;}});

/* ---- SPELL CASTER ---- */
A.add({id:'spellcaster',name:'SPELL CASTER',cat:'ACTION',mouse:1,time:420,how:'ARROWS PICK FIRE/ICE/BOLT/EARTH, MIX UP TO 3. A CASTS, B CLEARS.',make(){
 const g={over:null,score:0},GY=206,BX=62,m=aimer();
 const EL={F:{n:'FIRE',c:'#ff6a2a',k:'u'},I:{n:'ICE',c:'#7ad8ff',k:'l'},L:{n:'BOLT',c:'#fff06a',k:'r'},E:{n:'EARTH',c:'#b08a4a',k:'d'}};
 const NM={F:'FIREBALL',FF:'INFERNO',FFF:'METEOR',I:'ICE SHARD',II:'BLIZZARD',III:'ABSOLUTE ZERO',L:'SPARK',LL:'CHAIN LIGHTNING',LLL:'THUNDERSTORM',E:'STONE',EE:'BOULDER',EEE:'EARTHQUAKE',FI:'STEAM BURST',FL:'PLASMA',EF:'MAGMA',IL:'SHATTER BOLT',EI:'GLACIER',EL:'SANDSTORM'};
 const nameOf=q=>{const s=q.slice().sort().join('');if(NM[s])return NM[s];const u=[...new Set(q)].sort().join('');if(u.length===3)return'PRISM NOVA';return'GREATER '+NM[u];};
 const MT={slime:{hp:10,sp:.35,c:'#6ad06a',aff:null,pt:50},imp:{hp:14,sp:.5,c:'#e04a2a',aff:'F',weak:'I',pt:80},yeti:{hp:22,sp:.3,c:'#d8f0ff',aff:'I',weak:'F',pt:100},golem:{hp:34,sp:.22,c:'#8a7a6a',aff:'E',weak:'L',pt:140},wisp:{hp:12,sp:.6,c:'#c0a0ff',aff:'L',weak:'E',pt:90,fly:1},lich:{hp:400,sp:.12,c:'#5a3a8a',aff:'F',pt:3000,boss:1}};
 let q=[],cd=0,mons=[],spells=[],fx2=[],hp=10,wave=0,between=90,t=0,fl=0,flc='#fff',hs=0,won=0,last='',lastT=0,aim={x:240,y:170},kills=0;
 const spawnWave=()=>{wave++;const n=5+wave*2,pool=['slime','slime','imp'].concat(wave>=2?['yeti','wisp']:[],wave>=4?['golem','imp','yeti']:[],wave>=6?['golem','wisp']:[]);for(let i=0;i<n;i++){const k=pool[ri(pool.length)],M=MT[k];const hpS=1+wave*.18;mons.push({k,x:330+i*26+rnd(16),y:M.fly?100+rnd(60):150+rnd(GY-150),hp:M.hp*hpS,mh:M.hp*hpS,burn:0,slow:0,frz:0,stun:0,st:rnd(TAU),aff:M.aff,fl:0,atk:0});}
  if(wave===10)mons.push({k:'lich',x:340,y:170,hp:400,mh:400,burn:0,slow:0,frz:0,stun:0,st:0,aff:'F',fl:0,atk:0,sw:0});pop(wave===10?'THE LICH APPROACHES':'WAVE '+wave+'/10',160,80,wave===10?K.p:K.y);S('score');};
 const target=()=>{if(m.on)return{x:m.x,y:m.y};let b=null;for(const e of mons)if(e.x<318&&(!b||e.x<b.x))b=e;return b?{x:b.x,y:b.y-8}:{x:240,y:170};};
 const dmgE=(e,mult,cnt,spell)=>{const M=MT[e.k];let d=0;for(const el in cnt){if(!cnt[el])continue;let f=1;if(e.aff===el)f=.25;else if(M.weak===el||(e.k==='lich'&&{F:'I',I:'F',L:'E',E:'L'}[e.aff]===el))f=2.2;d+=cnt[el]*7*f*mult;if(f>1&&!spell.wk){spell.wk=1;pop('WEAK!',e.x,e.y-26,K.y);}if(f<1&&!spell.rs){spell.rs=1;pop('RESIST',e.x,e.y-26,K.gr);}}
  e.hp-=d;e.fl=5;if(cnt.F&&e.aff!=='F')e.burn=Math.max(e.burn,90*cnt.F);if(cnt.I&&e.aff!=='I'){e.slow=Math.max(e.slow,120);if(cnt.I>=2||e.slow&&cnt.I)e.frz=Math.max(e.frz,cnt.I*40);}if(cnt.E&&!MT[e.k].fly){e.x+=cnt.E*(e.k==='lich'?3:9);e.stun=Math.max(e.stun,cnt.E*15);}if(cnt.F&&cnt.I)e.burn+=30;};
 const impact=s=>{const n=s.q.length,cnt={F:0,I:0,L:0,E:0};s.q.forEach(c=>cnt[c]++);const rad=10+(n-1)*14+(cnt.E>=2?8:0);fx2.push({x:s.x,y:s.y,r:rad,t:20,c:EL[s.q[0]].c,q:s.q});S(n>=3?'boom':'hit');shk(2+n*2);if(n>=3)hs=3;
  const hit=new Set();for(const e of mons)if(hyp(e.x-s.x,(e.y-8-s.y)*1.3)<rad+8){dmgE(e,1,cnt,s);hit.add(e);}
  if(cnt.L){let from={x:s.x,y:s.y},jumps=cnt.L*2;while(jumps-->0){let b=null,bd=80;for(const e of mons){if(hit.has(e))continue;const d=hyp(e.x-from.x,e.y-from.y);if(d<bd){bd=d;b=e;}}if(!b)break;hit.add(b);fx2.push({x:from.x,y:from.y,x2:b.x,y2:b.y-8,t:10,bolt:1});dmgE(b,.7,cnt,s);from={x:b.x,y:b.y-8};}}
  A.burst(s.x,s.y,EL[s.q[0]].c,8+n*6,1.6+n*.5);if(cnt.F&&cnt.E)fx2.push({x:s.x,y:Math.max(s.y,150),r:24,t:150,pool:1});};
 g.update=()=>{if(g.over)return;m.upd();if(hs){hs--;return;}t++;if(fl)fl--;if(cd)cd--;
  if(won){won--;if(won===0){g.score+=hp*300;g.over='VICTORY! THE TOWER STANDS';}return;}
  const h=A.hit(0);for(const c in EL)if(h[EL[c].k]&&q.length<3){q.push(c);S('blip');spark(BX-30,120,EL[c].c,6,1.5,10);}if(h.b&&q.length){q=[];S('blip');}
  aim=target();if(h.a&&q.length&&!cd){const sx=BX-28,sy=118,a=atan2(aim.y-sy,aim.x-sx),v=6;spells.push({x:sx,y:sy,vx:cos(a)*v,vy:sin(a)*v,q:q.slice(),tx:aim.x,ty:aim.y});last=nameOf(q);lastT=70;cd=14+q.length*10;q=[];S('shoot');}
  if(lastT)lastT--;
  for(const s of spells){s.x+=s.vx;s.y+=s.vy;let boom=hyp(s.x-s.tx,s.y-s.ty)<6||s.y>GY||s.x>W+10;if(!boom)for(const e of mons)if(hyp(e.x-s.x,e.y-8-s.y)<10){boom=true;break;}if(boom){s.d=1;impact(s);}if(t%2===0)A.fx.push({x:s.x,y:s.y,vx:0,vy:0,t:10,c:EL[s.q[s.q.length-1]].c,g:0});}spells=spells.filter(s=>!s.d);
  for(const f of fx2){f.t--;if(f.pool&&t%15===0)for(const e of mons)if(hyp(e.x-f.x,e.y-f.y)<f.r+6){e.hp-=2;e.fl=3;}}fx2=fx2.filter(f=>f.t>0);
  if(!mons.length&&!won){if(wave>=10){won=100;S('win');A.confetti();return;}if(--between<=0){between=150;spawnWave();}}
  for(const e of mons){if(e.fl)e.fl--;if(e.burn){e.burn--;if(e.burn%20===0){e.hp-=1.5;e.fl=2;}}if(e.slow)e.slow--;if(e.frz){e.frz--;continue;}if(e.stun){e.stun--;continue;}const M=MT[e.k];e.st+=.15;
   if(e.k==='lich'){e.sw++;if(e.sw%360===0){e.aff=['F','I','L','E'][(e.sw/360)%4];pop('SHIELD: '+EL[e.aff].n,e.x,e.y-50,EL[e.aff].c);}}
   if(e.x>BX+8)e.x-=M.sp*(e.slow?.5:1);else{e.atk++;if(e.atk%60===0){hp-=M.boss?2:1;fl=8;flc='#ff2040';shk(4);S('hit');if(hp<=0){g.over='THE TOWER FELL ON WAVE '+wave;S('lose');return;}}}
   if(M.fly)e.y+=sin(e.st)*.6;if(e.hp<=0&&!e.dead){e.dead=1;kills++;g.score+=M.pt;A.burst(e.x,e.y-8,M.c,M.boss?50:12,M.boss?4:2);if(M.boss){shk(12);hs=10;}}}
  mons=mons.filter(e=>!e.dead);};
 const monD=e=>{const M=MT[e.k],x=e.x,y=e.y,w=e.fl?'#ffffff':M.c;GA(.3);R(x-7,GY-1,14,3,'#000000');GA1();
  if(e.k==='slime'){const sq=1+.15*sin(e.st);A.c.fillStyle=w;A.c.beginPath();A.c.ellipse(x,y-5,8*sq,7/sq,0,0,TAU);A.c.fill();R(x-4,y-8,2,2,'#103010');R(x+1,y-8,2,2,'#103010');}
  else if(e.k==='imp'){C(x,y-9,6,w);P([[x-5,y-14],[x-7,y-20],[x-2,y-15]],w,1);P([[x+5,y-14],[x+7,y-20],[x+2,y-15]],w,1);R(x-3,y-11,2,2,K.y);R(x+1,y-11,2,2,K.y);R(x-3,y-3,2,4,w);R(x+1,y-3,2,4,w);}
  else if(e.k==='yeti'){C(x,y-11,9,w);C(x,y-19,6,w);R(x-4,y-21,2,2,'#2040a0');R(x+1,y-21,2,2,'#2040a0');R(x-10,y-14,4,8,w);R(x+6,y-14,4,8,w);}
  else if(e.k==='golem'){R(x-9,y-22,18,18,w);R(x-6,y-28,12,7,w);R(x-4,y-26,3,2,K.o);R(x+1,y-26,3,2,K.o);R(x-13,y-20,5,12,w);R(x+8,y-20,5,12,w);R(x-7,y-4,5,4,w);R(x+2,y-4,5,4,w);}
  else if(e.k==='wisp'){glow(x,y-8,12,M.c,.3);C(x,y-8,5,w);R(x-2,y-9,1,2,'#302050');R(x+1,y-9,1,2,'#302050');}
  else{glow(x,y-24,30,EL[e.aff].c,.2+.1*sin(t*.1));A.person(x,y,{s:1.5,c:w,pants:'#2a1a3a',skin:'#c8c8b0',hair:'#e0e0e0',d:-1,arm1:1.4,arm2:1.6,id:5});L(x-12,y-50,x-12,y,'#4a3a2a',2);C(x-12,y-52,4,EL[e.aff].c);}
  if(e.hp<e.mh)bar(x-10,y-(e.k==='lich'?62:e.k==='golem'?34:28),20,3,e.hp/e.mh,K.r,'#300010');if(e.aff&&e.k!=='lich')C(x+8,y-(e.k==='golem'?30:22),2,EL[e.aff].c);
  if(e.frz){GA(.45);R(x-9,y-24,18,24,'#a0e8ff');GA1();}if(e.burn&&t%6<3)spark(x,y-10,K.o,1,.6,8);};
 g.draw=()=>{fillG(0,0,W,H,grad(0,0,0,H,[[0,'#140a30'],[.6,'#3a2a5a'],[1,'#5a3a4a']]));for(let i=0;i<30;i++){GA(.5+.5*sin(t*.02+i));R(hash(i,7)*W,hash(i,8)*100,1,1,'#ffffff');}GA1();C(270,40,14,'#e8e0c0');C(276,36,12,'#2a1a40');
  P([[60,GY],[120,150],[170,GY]],'#2a2040',1);P([[150,GY],[230,130],[310,GY]],'#2a2040',1);fillG(0,GY,W,H-GY,grad(0,GY,0,H,[[0,'#3a3028'],[1,'#1a1410']]));fillG(0,GY,W,2,'#5a4a3a');
  for(const f of fx2)if(f.pool){GA(Math.min(1,f.t/40)*.8);A.c.fillStyle='#ff5a10';A.c.beginPath();A.c.ellipse(f.x,f.y,f.r,5,0,0,TAU);A.c.fill();GA1();}
  R(4,120,46,GY-120,'#4a4458');for(let y=124;y<GY;y+=10)for(let x=6;x<48;x+=12)fillG(x+((y/10)%2)*6,y,10,8,'#5a5468');for(let i=0;i<4;i++)R(4+i*12,112,8,8,'#5a5468');R(BX-6,150,4,GY-150,'#6a5a8a');GA(.25+.1*sin(t*.1));R(BX-6,150,4,GY-150,K.c);GA1();
  A.person(28,112,{s:.8,c:'#3a3ab0',pants:'#2a2a6a',skin:'#f1c7a3',hair:'#e0e0e0',d:1,arm2:-2.2,id:4});P([[20,90],[36,90],[30,72]],'#3a3ab0',1);R(19,90,18,2,'#2a2a80');L(36,96,40,118,'#6a4a2a',2);const oc=q.length?EL[q[q.length-1]].c:'#a0a0ff';glow(36,94,6+q.length*2,oc,.4+.1*sin(t*.3));C(36,94,3,oc);
  const sorted=mons.slice().sort((a,b)=>a.y-b.y);sorted.forEach(monD);
  for(const s of spells){glow(s.x,s.y,6+s.q.length*2,EL[s.q[0]].c,.4);C(s.x,s.y,2+s.q.length,EL[s.q[0]].c);if(s.q.length>1)C(s.x,s.y,1.5,EL[s.q[1]].c);}
  for(const f of fx2){if(f.bolt){GA(f.t/10);let px=f.x,py=f.y;for(let i=1;i<=5;i++){const nx=f.x+(f.x2-f.x)*i/5+(i<5?rnd(8)-4:0),ny=f.y+(f.y2-f.y)*i/5+(i<5?rnd(8)-4:0);L(px,py,nx,ny,'#fff8a0',2);px=nx;py=ny;}GA1();}else if(!f.pool){GA(f.t/20);A.ring(f.x,f.y,f.r*(1.3-f.t/40),f.c);C(f.x,f.y,f.r*(1-f.t/25)*.8,f.c);GA1();}}
  if(!m.on&&mons.length){A.ring(aim.x,aim.y,6+sin(t*.2),'#ffffff');}if(fl){GA(fl/20);R(0,0,W,H,flc);GA1();}m.draw('#ffffff');
  R(0,0,W,18,'rgba(0,0,0,.5)');T('TOWER',6,6,K.gr,1);bar(30,5,60,7,hp/10,hp<4?K.r:K.g);T('WAVE '+Math.max(1,wave)+'/10',160,6,K.w,1,'c');T('SCORE '+g.score,W-6,6,K.y,1,'r');
  R(60,H-30,200,26,'rgba(0,0,0,.55)');A.box(60,H-30,200,26,'#5a4a8a');for(let i=0;i<3;i++){const c=q[i];R(68+i*16,H-24,12,12,c?EL[c].c:'#2a2440');if(c)T(EL[c].n[0],74+i*16,H-21,'#000000',1,'c');}
  T(q.length?nameOf(q):'PICK ELEMENTS',120,H-25,q.length?K.y:K.gr,1);T('UP FIRE LT ICE RT BOLT DN EARTH',120,H-14,K.gr,1);if(cd)bar(68,H-8,44,2,1-cd/44,K.c);
  if(lastT)T(last+'!',160,40,K.y,2,'c');if(wave===0)T('MIX ELEMENTS: EACH COMBO IS A NEW SPELL',160,60,K.w,1,'c');};
 return g;}});

/* ---- ARCHER TOWER ---- */
A.add({id:'archertower',name:'ARCHER TOWER',cat:'ACTION',mouse:1,time:420,how:'MOUSE AIMS (OR UP/DOWN ANGLE, LEFT/RIGHT POWER). HOLD A TO SHOOT.',make(){
 const g={over:null,score:0},GY=204,AX=46,AY=80,TX=64,m=aimer();
 const ET={grunt:{hp:3,sp:.36,w:8,h:22,dm:2,pt:50,c:'#a03030'},shield:{hp:6,sp:.28,w:10,h:22,dm:2,pt:80,c:'#5a6a8a'},runner:{hp:2,sp:.85,w:8,h:20,dm:1,pt:60,c:'#d0a030'},flyer:{hp:2,sp:.6,w:12,h:8,dm:2,pt:70,c:'#6a3a8a',fly:1},giant:{hp:22,sp:.18,w:20,h:44,dm:6,pt:300,c:'#6a7a5a'},ram:{hp:14,sp:.3,w:30,h:16,dm:10,pt:250,c:'#7a5a3a'},lord:{hp:70,sp:.16,w:22,h:48,dm:10,pt:2000,c:'#3a2a2a'}};
 let ang=-.35,pw=6,arrows=[],en=[],stuck=[],thp=100,tmh=100,wave=0,between=100,menu=null,t=0,fl=0,flc='#fff',hs=0,won=0,kills=0,up={multi:0,pow:0,quick:0,fire:0,pierce:0},draw_=0,lastFire=-99;
 const UPS=[{k:'multi',name:'MULTISHOT',desc:'+1 ARROW PER SHOT',icon:'🏹',col:'#5a8a3a',max:3},{k:'pow',name:'HEAVY TIPS',desc:'+50 PERCENT DAMAGE',icon:'⚔️',col:'#8a5a3a',max:5},{k:'quick',name:'QUICK DRAW',desc:'SHOOT FASTER',icon:'⚡',col:'#3a6a9a',max:4},{k:'fire',name:'FIRE ARROWS',desc:'ARROWS SET FOES ALIGHT',icon:'🔥',col:'#b04a20',max:1},{k:'pierce',name:'PIERCING',desc:'ARROWS PASS THROUGH +1',icon:'🎯',col:'#6a3a8a',max:3},{k:'repair',name:'MASONS',desc:'+40 TOWER HP AND +10 MAX',icon:'🧱',col:'#7a7a8a',max:99}];
 const spawnWave=()=>{wave++;const list=[];const n=5+wave*2;for(let i=0;i<n;i++){let k='grunt';const r=Math.random();if(wave>=2&&r<.25)k='runner';else if(wave>=3&&r<.42)k='shield';else if(wave>=4&&r<.56)k='flyer';list.push(k);}if(wave%3===0)list.push('ram');if(wave>=5)list.push('giant');if(wave>=8)list.push('giant');if(wave===10)list.push('lord');
  list.forEach((k,i)=>{const E_=ET[k],sc=1+wave*.1;en.push({k,x:330+i*22+rnd(20),y:E_.fly?70+rnd(50):GY,hp:E_.hp*sc,mh:E_.hp*sc,st:rnd(TAU),fl:0,burn:0,atk:0});});pop(wave===10?'FINAL WAVE: THE WARLORD':'WAVE '+wave+'/10',160,60,wave===10?K.r:K.y);S('score');};
 const shoot=()=>{const n=1+up.multi;for(let i=0;i<n;i++){const a=ang+(i-(n-1)/2)*.06;arrows.push({x:AX+6,y:AY-12,vx:cos(a)*pw,vy:sin(a)*pw,pr:up.pierce,hit:new Set()});}S('shoot');draw_=0;};
 const hitE=(e,a,head)=>{const E_=ET[e.k];let d=(2+up.pow)*(head?2:1);if(e.k==='shield'&&!head&&a.vx>0)d*=.35;e.hp-=d;e.fl=4;if(up.fire)e.burn=120;if(head){g.score+=50;pop('HEADSHOT',e.x,e.y-E_.h-14,K.y);S('coin');}spark(a.x,a.y,head?K.y:'#c02020',head?8:4,1.6,8);if(e.hp<=0&&!e.dead){e.dead=1;kills++;g.score+=E_.pt;A.burst(e.x,e.y-E_.h/2,E_.c,E_.h>30?28:12,E_.h>30?3:2);if(E_.h>30){shk(8);hs=5;S('boom');}else S('hit');}};
 g._at=()=>({ang,pw,en,wave,thp,menu});
 g.update=()=>{if(g.over)return;m.upd();if(menu){menu.wait--;const i=cardPick(menu.o.length,menu,m);if(i>=0){const o=menu.o[i];if(o.k==='repair'){tmh+=10;thp=Math.min(tmh,thp+40);}else up[o.k]++;S('win');pop(o.name+'!',160,60,K.y);menu=null;between=60;}return;}
  if(hs){hs--;return;}t++;if(fl)fl--;
  if(won){won--;if(won===0){g.score+=thp*20;g.over='DEFENDED! VICTORY';}return;}
  const k=A.in(0);if(m.on){ang=cl(atan2(m.y-AY,m.x-AX),-1.35,1.0);pw=cl(hyp(m.x-AX,m.y-AY)/24,3,9);}else{ang=cl(ang+(k.d?.018:0)-(k.u?.018:0),-1.35,1.0);pw=cl(pw+(k.r?.06:0)-(k.l?.06:0),3,9);}
  if(k.a)draw_=Math.min(1,draw_+.15);if(A.fire(Math.max(7,18-up.quick*3)))shoot();
  if(!en.length&&!won){if(wave>=10){won=100;S('win');A.confetti();return;}if(wave>0&&between===100){g.score+=100*wave;const pool=UPS.filter(u=>u.k==='repair'||up[u.k]<u.max),o=[];while(o.length<3&&pool.length)o.push(Object.assign({tag:''},pool.splice(ri(pool.length),1)[0]));o.forEach(q=>{q.tag=q.k==='repair'?'HP '+flo(thp):'LV '+(up[q.k]+1);});menu={o,sel:0,wait:20};between=99;return;}if(--between<=0){between=100;spawnWave();}}
  for(const a of arrows){a.vy+=.12;a.x+=a.vx;a.y+=a.vy;a.a=atan2(a.vy,a.vx);for(const e of en){if(e.dead||a.hit.has(e))continue;const E_=ET[e.k],top=e.y-E_.h;if(Math.abs(a.x-e.x)<E_.w/2+2&&a.y>top-2&&a.y<e.y){a.hit.add(e);hitE(e,a,!E_.fly&&e.k!=='ram'&&a.y<top+E_.h*.28);if(a.pr--<=0){a.d=1;break;}}}
   if(a.y>=GY){a.d=1;stuck.push({x:a.x,y:GY,a:a.a,t:100});}if(a.x>W+20)a.d=1;}arrows=arrows.filter(a=>!a.d);stuck.forEach(s=>s.t--);stuck=stuck.filter(s=>s.t>0);
  for(const e of en){if(e.dead)continue;const E_=ET[e.k];e.st+=.2;if(e.fl)e.fl--;if(e.burn){e.burn--;if(e.burn%30===0){e.hp-=1;e.fl=2;if(e.hp<=0){e.dead=1;kills++;g.score+=E_.pt;A.burst(e.x,e.y-10,K.o,10,2);}}}
   const stop=E_.fly?AX+16:TX+E_.w/2;if(e.x>stop){e.x-=E_.sp*1.3;if(E_.fly)e.y+=sin(e.st*.5)*.8+(e.x<120?(AY-10-e.y)*.02:0);}else{e.atk++;if(e.atk%90===45){thp-=E_.dm;fl=6;flc='#ff2040';shk(E_.dm>5?7:3);S('hit');A.burst(TX,GY-20,'#a0a0b0',6,1.5);if(thp<=0){g.over='THE TOWER FELL ON WAVE '+wave;S('lose');return;}}}}
  en=en.filter(e=>!e.dead);};
 const enD=e=>{const E_=ET[e.k],x=e.x,y=e.y,w=e.fl?'#ffffff':null;
  if(e.k==='flyer'){const f=sin(e.st*2)*5;P([[x,y-4],[x-10,y-8-f],[x-4,y]],w||'#4a2a6a',1);P([[x,y-4],[x+10,y-8-f],[x+4,y]],w||'#4a2a6a',1);C(x,y-4,4,w||E_.c);R(x-2,y-5,1,1,K.y);R(x+1,y-5,1,1,K.y);}
  else if(e.k==='ram'){R(x-15,y-14,30,10,w||E_.c);R(x-18,y-12,6,6,'#5a5a60');C(x-8,y-3,4,'#3a2a1a');C(x+8,y-3,4,'#3a2a1a');A.person(x+12,y,{s:.5,c:'#8a3030',d:-1,st:e.st,id:1,arm1:1.2,arm2:1.2});}
  else{const s=e.k==='giant'?1.45:e.k==='lord'?1.6:.68;A.person(x,y,{s,c:w||E_.c,pants:'#3a3028',skin:e.k==='giant'?'#8a9a6a':undefined,st:e.st,d:-1,id:2,cap:e.k==='lord'?'#c0a020':e.k==='shield'?'#7a8aa0':undefined});if(e.k==='shield')R(x-8,y-16,4,12,w||'#9aa0b0');if(e.k==='giant'||e.k==='lord')L(x-8,y-30,x-20,y-48,'#5a4a3a',3);}
  if(e.burn&&t%5<3)spark(x,y-E_.h*.6,K.o,1,.6,8);if(e.hp<e.mh)bar(x-10,y-E_.h-8,20,3,e.hp/e.mh,K.r,'#300010');};
 g.draw=()=>{fillG(0,0,W,H,grad(0,0,0,H,[[0,'#2a2a5a'],[.5,'#c86a5a'],[1,'#f0b070']]));C(250,110,18,'#ffe0a0');
  P([[100,GY],[150,150],[200,GY]],'#6a4a5a',1);P([[170,GY],[240,140],[320,GY]],'#5a3a50',1);for(let i=0;i<5;i++)R(220+i*14,140-(i%2)*8,8,30,'#3a2a40');
  fillG(0,GY,W,H-GY,grad(0,GY,0,H,[[0,'#4a6a3a'],[1,'#2a3a20']]));fillG(0,GY,W,2,'#6a9a4a');
  for(const s of stuck){GA(Math.min(1,s.t/30));rot(s.x,s.y,s.a,()=>{R(-9,0,9,1,'#c0a070');R(-11,-1,2,3,'#ffffff');});}GA1();
  const sorted=en.slice().sort((a,b)=>b.x-a.x);sorted.forEach(enD);
  R(20,AY,44,GY-AY,'#7a7a8a');for(let y=AY+4;y<GY;y+=10)for(let x=22;x<62;x+=12)fillG(x+((y/10|0)%2)*6,y,10,8,'#8a8a9a');for(let i=0;i<4;i++)R(20+i*12,AY-8,8,8,'#7a7a8a');R(36,AY+40,10,16,'#2a2030');GA(.5*(1-thp/tmh));for(let i=0;i<4;i++)L(24+i*9,AY+20+i*20,32+i*9,AY+34+i*20,'#2a2a30',2);GA1();
  A.person(AX-4,AY,{s:.75,c:'#2a6a3a',pants:'#3a3028',d:1,id:1,cap:'#1a4a2a',arm2:ang-PI/2,arm1:ang-PI/2-.2});
  const bx=AX+2,by=AY-16;A.c.strokeStyle='#6a4a2a';A.c.lineWidth=2;A.c.beginPath();A.c.arc(bx,by,9,ang-1.2,ang+1.2);A.c.stroke();const pull=4+draw_*4;L(bx+cos(ang-1.2)*9,by+sin(ang-1.2)*9,bx-cos(ang)*pull,by-sin(ang)*pull,'#e0e0e0');L(bx+cos(ang+1.2)*9,by+sin(ang+1.2)*9,bx-cos(ang)*pull,by-sin(ang)*pull,'#e0e0e0');L(bx-cos(ang)*pull,by-sin(ang)*pull,bx+cos(ang)*10,by+sin(ang)*10,'#c0a070');
  {let x=AX+6,y=AY-12,vx=cos(ang)*pw,vy=sin(ang)*pw;for(let i=0;i<34;i++){vy+=.12;x+=vx;y+=vy;if(y>GY)break;if(i%3===0){GA(.5-i/80);R(x,y,2,2,'#ffffff');}}GA1();}
  for(const a of arrows)rot(a.x,a.y,a.a||0,()=>{R(-9,0,10,1,up.fire?K.o:'#e0c890');R(1,-1,2,3,'#d0d0d0');R(-11,-1,2,3,'#ffffff');if(up.fire)C(1,0,1.5,K.y);});
  if(fl){GA(fl/18);R(0,0,W,H,flc);GA1();}m.draw('#ffffff');
  R(0,0,W,18,'rgba(0,0,0,.45)');T('TOWER',6,6,K.gr,1);bar(30,5,70,7,thp/tmh,thp<30?K.r:K.g);T('WAVE '+Math.max(1,wave)+'/10',160,6,K.w,1,'c');T('SCORE '+g.score,W-6,6,K.y,1,'r');T('POWER',6,22,K.gr,1);bar(30,22,40,4,(pw-3)/6,K.y);
  if(menu)cards(menu.o,menu.sel,'WAVE '+wave+' HELD!','CHOOSE AN UPGRADE');};
 return g;}});
})();
