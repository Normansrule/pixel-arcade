/* PIXEL ARCADE - skyway pack: ROOFTOP SCRAMBLE (a wobbly rooftop race to the escape ladder, with guns and a moving train)
   and NEBULA RUN (a race down a tile tunnel floating in deep space), both VS CPU with difficulty or 2 players */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const TAU=Math.PI*2,hyp=Math.hypot;
const PC=['#2fd6c3','#ff4f9a'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const demo=g=>!!(g.auto||A._e&&A._e.state==='title');
const skill=()=>A._e&&A._e.state==='play'?A.ai:.85;
const doc=()=>typeof document!=='undefined'&&document.createElement;

/* ================= ROOFTOP SCRAMBLE ================= */
// every platform is one-way: you hop up through it from below and land on its top
const ROOFS=[{x0:0,x1:52,y:140,k:0},{x0:66,x1:124,y:110,k:1},{x0:142,x1:180,y:156,k:2},{x0:196,x1:256,y:106,k:3},{x0:270,x1:320,y:136,k:4}];
const LEDGES=[{x0:8,x1:40,y:176},{x0:72,x1:104,y:146},{x0:88,x1:120,y:182},{x0:146,x1:176,y:188},{x0:202,x1:234,y:142},{x0:222,x1:254,y:178},{x0:278,x1:312,y:170}];
const TRY=202,CAR=70,CGAP=22,NCAR=5,TSP=.85,TLEN=NCAR*(CAR+CGAP);
const TRAIN={x0:0,x1:W,y:TRY,train:1};
const NAV=ROOFS.concat(LEDGES,[TRAIN]);
// which platforms a hop can reach from which (gap, and how far up)
const LINK=NAV.map(p=>NAV.map(q=>{if(p===q)return 0;const gap=Math.max(0,q.x0-p.x1,p.x0-q.x1),up=p.y-q.y;return gap<=34&&up<=40?1:0;}));
const WEP={pistol:{ammo:8,cd:12,col:'#c7ccd6'},shotgun:{ammo:4,cd:34,col:'#8a5a32'},rocket:{ammo:2,cd:44,col:'#5f8a3a'}};
const SUIT=['#1d2433','#2a1d30'];

A.add({id:'rooftop',name:'ROOFTOP SCRAMBLE',cat:'VERSUS',vs:1,time:150,warm:200,tags:'getaway shootout wobbly ragdoll rooftop chase escape helicopter guns train hop versus 2 player',
 how:'LEFT/RIGHT HOP, UP JUMPS HIGH, A FIRES OR SHOVES. REACH THE LADDER FIRST. 3 ESCAPES WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0,banner=null,quiet=0;
 const cars=[];for(let i=0;i<NCAR;i++)cars.push({x:i*(CAR+CGAP)-40,col:i===0?'#e8453c':'#c9ced8',loco:i===0});
 const P=[0,1].map(i=>({i,x:0,y:0,vx:0,vy:0,a:0,va:0,gnd:null,coy:0,stun:0,hopcd:0,face:1,wep:null,ammo:0,cd:0,esc:0,hits:0,dead:0,shield:0,last:null,arm:0,think:0,keys:{},tt:0,step:0}));
 const crates=[],shots=[],smoke=[],rain=[];for(let i=0;i<46;i++)rain.push({x:rnd(W),y:rnd(H),s:2+rnd(2)});
 const ch={x:-40,y:40,tx:160,ty:40,lad:0,roof:ROOFS[2],wait:0,leave:0,timer:0};
 const place=(h,x,y)=>Object.assign(h,{climb:0,x,y,vx:0,vy:0,a:0,va:0,gnd:null,stun:0,dead:0,shield:60,wep:null,ammo:0,cd:0,face:h.i?-1:1});
 const pickRoof=()=>{const d=P[0].esc-P[1].esc;let r;
  // the ladder comes down nearer whoever is behind; level scores give the middle or a random side
  if(d<0)r=ROOFS[1];else if(d>0)r=ROOFS[3];else r=ROOFS[[1,2,3][ri(3)]];
  if(r===ch.roof&&!d)r=ROOFS[r.k===2?1+ri(2)*2:2];return r;};
 const callChopper=r=>{ch.roof=r;ch.tx=r.x0+10+rnd(r.x1-r.x0-20);ch.ty=r.y-4-46-8;ch.timer=0;};
 const roundStart=()=>{place(P[0],24,ROOFS[0].y);place(P[1],296,ROOFS[4].y);crates.length=0;shots.length=0;ch.lad=0;crates.push({x:150+rnd(20),y:-30,k:['pistol','shotgun','rocket'][ri(3)],land:null,sw:0});ch.leave=0;callChopper(t<10?ROOFS[2]:pickRoof());};
 roundStart();ch.x=-50;ch.y=30;
 const plats=()=>{const L=ROOFS.concat(LEDGES);for(const c of cars){const x=((c.x%TLEN)+TLEN)%TLEN-60;L.push({x0:x,x1:x+CAR,y:TRY,car:c});}return L;};
 const carX=c=>((c.x%TLEN)+TLEN)%TLEN-60;
 const knock=(h,kx,st,by,ky)=>{if(h.dead||h.shield>0)return false;if(h.climb){h.climb=0;if(!demo(g))fx.pop(cl(h.x,24,W-24),Math.max(24,h.y-26),'SHOT DOWN!','#ff4f6d');}h.vx=cl(kx,-5,5);h.vy=Math.min(h.vy,ky!==undefined?ky:-1.4-Math.abs(kx)*.45);h.gnd=null;h.coy=0;h.va=Math.sign(kx||1)*(.14+Math.abs(kx)*.045);h.stun=Math.max(h.stun,st);h.last={by,t};if(by!==undefined&&by!==h.i)P[by].hits++;return true;};
 const boom=(x,y,by)=>{fx.ring(x,y,'#ffcf3f',34,20);fx.ring(x,y,'#ff6a2a',22,14);fx.spark(x,y,'#ffcf3f',16,3.2);fx.debris(x,y,'#3a3040',8,2.4);for(let k=0;k<10;k++)smoke.push({x:x+rnd(16)-8,y:y+rnd(10)-5,vx:rnd(1)-.5,vy:-rnd(.8),r:3+rnd(4),t:50+ri(30),m:80,c:k<4?'#ffb34a':'#4a4458'});
  S('boom');A.shake=6;for(const h of P){const dx=h.x-x,dy=h.y-8-y,d=hyp(dx,dy);if(d<32){const f=1-d/32;knock(h,Math.sign(dx||1)*(1.6+3.4*f),26+f*24,by,-2-2.6*f);}}};
 const fire=h=>{const w=h.wep;h.arm=8;
  if(!w){const o=P[1-h.i];h.cd=26;if(!o.dead&&Math.sign(o.x-h.x)===h.face&&Math.abs(o.x-h.x)<17&&Math.abs(o.y-h.y)<14){if(knock(o,h.face*2.6,24,h.i)){fx.spark(o.x,o.y-9,'#ffffff',6,2);S('hit');}}else S('blip');return;}
  const W_=WEP[w],mx=h.x+h.face*7,my=h.y-10;h.cd=W_.cd;h.ammo--;
  if(w==='pistol'){shots.push({x:mx,y:my,vx:h.face*5.2,vy:0,own:h.i,k:'p',life:70});S('shoot');}
  else if(w==='shotgun'){for(let k=0;k<5;k++)shots.push({x:mx,y:my,vx:h.face*(4.2+rnd(.6)),vy:(k-2)*.32+rnd(.12)-.06,own:h.i,k:'s',life:24});h.vx-=h.face*1.3;S('boom');A.shake=Math.max(A.shake||0,2);}
  else{shots.push({x:mx,y:my,vx:h.face*1.4,vy:0,own:h.i,k:'r',life:140});h.vx-=h.face*.8;S('jump');}
  if(lo())fx.spark(mx,my,'#ffe7a0',4,1.6);
  if(h.ammo<=0)h.wep=null;};
 // CPU brain: choose a goal (the ladder, or a gun when empty-handed), route over the platform graph, hop, and shoot when lined up
 const platOf=h=>{if(h.gnd)return h.gnd.car?TRAIN:h.gnd;let best=TRAIN,by=1e9;for(const p of NAV){if(h.x>=p.x0-2&&h.x<=p.x1+2&&p.y>=h.y-2&&p.y-h.y<by){by=p.y-h.y;best=p;}}return best;};
 const route=(a,b)=>{if(a===b)return b;const ia=NAV.indexOf(a),ib=NAV.indexOf(b),prev=new Array(NAV.length).fill(-1),q=[ia];prev[ia]=ia;
  while(q.length){const c=q.shift();if(c===ib)break;for(let n=0;n<NAV.length;n++)if(LINK[c][n]&&prev[n]<0){prev[n]=c;q.push(n);}}
  if(prev[ib]<0)return b;let c=ib;while(prev[c]!==ia)c=prev[c];return NAV[c];};
 const brain=h=>{const sk=h.i===1?skill():.9,o=P[1-h.i],k={};if(h.dead)return k;
  if(h.idle>0){h.idle--;return k;}
  if(--h.think<=0){h.think=3+ri(Math.round(4+(1-sk)*16));if(Math.random()<(1-sk)*.3)h.idle=8+ri(18);
   let gx=ch.x,gy=ch.roof.y,goal=ch.roof;
   if(!h.wep){let bd=1e9;for(const c of crates){if(!c.land)continue;const d=hyp(c.x-h.x,c.y-h.y);if(d<bd){bd=d;if(d<hyp(gx-h.x,gy-h.y)*.8+20){gx=c.x;gy=c.y;goal=c.land.car?TRAIN:c.land;}}}}
   const here=platOf(h),nx=route(here,goal);h.goal={gx,gy,nx,here};}
  const G=h.goal;if(!G)return k;
  if(h.stun>0)return k;
  const here=platOf(h),nx=here===G.here?G.nx:route(here,G.nx===here?G.nx:G.nx);
  if(here===nx||nx===here){const dx=G.gx-h.x;if(Math.abs(dx)>5){if(h.gnd&&h.hopcd<=0)k[dx>0?'r':'l']=1;}else if(G.gy<h.y-20)k.u=1;}
  else{const up=here.y-nx.y,tx=cl((nx.x0+nx.x1)/2,here.x0+6,here.x1-6),ov=Math.min(here.x1,nx.x1)-Math.max(here.x0,nx.x0);
   if(up>14){const sx=ov>8?cl(h.x,Math.max(here.x0,nx.x0)+5,Math.min(here.x1,nx.x1)-5):tx;const dx=sx-h.x;
    if(Math.abs(dx)>6&&!(ov<=8&&Math.abs(dx)<14)){if(h.gnd)k[dx>0?'r':'l']=1;}else{k.u=1;if(ov<=8)k[(nx.x0+nx.x1)/2>h.x?'r':'l']=1;}}
   else{const cx=(nx.x0+nx.x1)/2;k[cx>h.x?'r':'l']=1;}}
  // only press a hop key while standing, so the CPU does not drift in the air like a kite
  if(!h.gnd&&!k.u){const dx=G.gx-h.x;if(Math.abs(dx)>8)k[dx>0?'r':'l']=Math.random()<.5;}
  if(h.cd<=0&&!o.dead&&o.shield<=0){const dx=o.x-h.x,dy=Math.abs(o.y-h.y),rng=!h.wep?16:h.wep==='shotgun'?80:h.wep==='rocket'?220:170;
   if(Math.sign(dx)===h.face&&Math.abs(dx)<rng&&dy<(h.wep==='rocket'?22:o.climb?20:13)&&Math.random()<.25+sk*.55)k.a=1;}
  return k;};
 const updH=(h,k)=>{
  if(h.dead>0){if(--h.dead===0){const far=ROOFS.slice().sort((a,b)=>Math.abs((b.x0+b.x1)/2-P[1-h.i].x)-Math.abs((a.x0+a.x1)/2-P[1-h.i].x))[ri(2)];place(h,far.x0+10+rnd(far.x1-far.x0-20),-6);h.shield=90;}return;}
  // on the ladder: climb up to the cabin; a hit knocks you off
  if(h.climb>0){h.climb++;h.x+=(ch.x+Math.sin(t*.07)*2*((h.y-ch.y)/Math.max(1,ch.lad))-h.x)*.3;h.y=h.cy0-h.climb*.3;h.vx=h.vy=0;h.gnd=null;h.a*=.8;if(h.cd>0)h.cd--;h.face=1;
   if(h.climb>=60){h.climb=0;h.esc++;S('win');fx.flash(PC[h.i],8);fx.ring(h.x,h.y-8,PC[h.i],30,20);for(const o of P)o.climb=0;
    if(h.esc>=3&&!demo(g)){g.over=A.win(h.i);}else{banner={who:h.i,t:80};if(demo(g)&&h.esc>=3){P[0].esc=P[1].esc=0;}}}
   return;}
  if(h.shield>0)h.shield--;if(h.stun>0)h.stun--;if(h.hopcd>0)h.hopcd--;if(h.cd>0)h.cd--;if(h.arm>0)h.arm--;
  const can=h.stun<=0,dir=(k.r?1:0)-(k.l?1:0);
  if(h.gnd)h.coy=5;else if(h.coy>0)h.coy--;
  if(can&&h.coy>0&&h.hopcd<=0&&(k.u||dir)){
   if(k.u){h.vy=-4.25;h.vx=dir*1.05+h.vx*.25;h.va=dir*.05;}else{h.vy=-3.05;h.vx=dir*1.2;h.va=dir*.085;h.face=dir;}
   h.gnd=null;h.coy=0;h.hopcd=9;h.step++;if(!demo(g)&&(h.i===0||!A.cpu))S('jump');}
  if(!h.gnd&&can&&dir){h.vx=cl(h.vx+dir*.045,-1.75,1.75);h.va+=dir*.003;h.face=dir;}
  if(can&&(k.a&&h.cd<=0))fire(h);
  // carried by the train, or sliding to a stop
  if(h.gnd){if(h.gnd.car){h.x+=TSP;const x0=carX(h.gnd.car);if(h.x<x0-3||h.x>x0+CAR+3)h.gnd=null;}else if(h.x<h.gnd.x0-3||h.x>h.gnd.x1+3)h.gnd=null;
   if(h.gnd){h.vx*=h.stun>0?.9:.72;h.vy=0;h.y=h.gnd.y;}}
  if(!h.gnd){h.vy=Math.min(5,h.vy+.2);const py=h.y;h.x+=h.vx;h.y+=h.vy;
   if(h.vy>=0)for(const p of plats())if(h.x>=p.x0-2&&h.x<=p.x1+2&&py<=p.y+.01&&h.y>=p.y){h.y=p.y;h.vy=0;h.gnd=p;
    // landing upright is fine; landing on your back (or while stunned) is a tumble
    if(Math.abs(h.a)>1||h.stun>8){h.stun=Math.max(h.stun,30);h.va=Math.sign(h.a||1)*.22;if(!demo(g))fx.spark(h.x,h.y,'#cfc8e8',5,1.4);}else{h.va=0;}
    if(lo()&&!demo(g))for(let q=0;q<3;q++)smoke.push({x:h.x+rnd(8)-4,y:h.y-1,vx:rnd(.8)-.4,vy:-rnd(.3),r:1.5+rnd(1.5),t:18,m:18,c:'#b8b0c8'});break;}}
  else h.x+=h.vx;
  if(h.x<3){h.x=3;h.vx=Math.abs(h.vx)*.4;}if(h.x>W-3){h.x=W-3;h.vx=-Math.abs(h.vx)*.4;}
  // body angle: stiff spring when standing, a loose wobble in the air, a roll when tumbling
  if(h.gnd&&h.stun<=0){h.a*=.65;h.va=0;}else if(h.gnd){h.a+=h.va;h.va*=.9;if(h.stun<8)h.a*=.8;}else{h.va+=-h.a*.012;h.va*=.985;h.a+=h.va;}
  if(h.a>Math.PI)h.a-=TAU;if(h.a<-Math.PI)h.a+=TAU;
  if(h.y>H+18){h.dead=60;if(h.wep)h.wep=null;const by=h.last&&t-h.last.t<240?h.last.by:null;if(by!==null&&by!==h.i){P[by].hits+=3;if(!demo(g))fx.pop(cl(P[by].x,28,W-28),Math.max(24,P[by].y-26),'KNOCKED OFF!',PC[by]);}S('lose');}
  // crates
  for(let i=crates.length-1;i>=0;i--){const c=crates[i];if(!h.wep&&Math.abs(c.x-h.x)<9&&Math.abs(c.y-4-(h.y-8))<12){h.wep=c.k;h.ammo=WEP[c.k].ammo;crates.splice(i,1);if(!demo(g))fx.pop(cl(h.x,18,W-18),Math.max(24,h.y-24),c.k.toUpperCase(),'#ffcf3f');S('coin');}}};
 g.update=()=>{t++;if(banner){banner.t--;}
  for(const c of cars)c.x+=TSP;
  // the escape chopper: flies to its rooftop, lowers the ladder, and moves on if nobody comes
  ch.x+=(ch.tx-ch.x)*.05;ch.y+=(ch.ty-ch.y)*.05;const near=hyp(ch.tx-ch.x,ch.ty-ch.y)<3;
  if(banner&&banner.who!==undefined){ch.lad=Math.max(0,ch.lad-1.2);ch.ty-=.5;const h=P[banner.who];h.x=ch.x;h.y=ch.y+14+ch.lad;h.vx=h.vy=0;h.gnd=null;h.a*=.9;
   if(banner.t<=0){banner=null;roundStart();}return;}
  if(near&&ch.lad<46)ch.lad=Math.min(46,ch.lad+2.2);else if(!near)ch.lad=Math.max(0,ch.lad-2);
  if(++ch.timer>1500&&ch.lad>=46)callChopper(pickRoof());
  if(t%300===150&&crates.length<3&&!banner){const r=NAV[ri(ROOFS.length)];crates.push({x:r.x0+8+rnd(r.x1-r.x0-16),y:-8,k:['pistol','pistol','shotgun','rocket'][ri(4)],land:null,sw:rnd(6)});}
  for(const c of crates){if(c.land){if(c.land.car){c.x+=TSP;const x0=carX(c.land.car);if(c.x<x0||c.x>x0+CAR)c.land=null;}continue;}const py=c.y;c.y+=.55;c.sw+=.05;c.x+=Math.sin(c.sw)*.15;for(const p of plats())if(c.x>=p.x0&&c.x<=p.x1&&py<=p.y&&c.y>=p.y){c.y=p.y;c.land=p;break;}}
  for(let i=crates.length-1;i>=0;i--)if(crates[i].y>H+10)crates.splice(i,1);
  for(const h of P){const k=demo(g)||(h.i===1&&A.cpu)?brain(h):A.in(h.i);if(h.i===1&&A.cpu&&!demo(g))A.bot(k);updH(h,k);}
  // shots
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];if(s.k==='r'){s.vx=cl(s.vx+Math.sign(s.vx)*.14,-5,5);if(lo()&&t%2===0)smoke.push({x:s.x-Math.sign(s.vx)*5,y:s.y,vx:-s.vx*.1,vy:-.1,r:2,t:28,m:28,c:'#8a8496'});}
   s.x+=s.vx;s.y+=s.vy;s.life--;let hit=s.life<=0||s.x<-8||s.x>W+8;
   for(const h of P){if(hit||h.i===s.own||h.dead)continue;const cy=h.y-8;if(Math.abs(s.x-h.x)<6&&Math.abs(s.y-cy)<9){hit=true;
    if(h.shield>0){fx.ring(h.x,cy,'#ffffff',10,8);continue;}
    if(s.k==='r'){boom(s.x,s.y,s.own);}else{knock(h,Math.sign(s.vx)*(s.k==='s'?1.7:2),s.k==='s'?20:16,s.own);fx.spark(s.x,s.y,'#ff5a5a',6,2);S('hit');}}}
   if(!hit&&s.k==='r')for(const r of ROOFS)if(s.x>r.x0&&s.x<r.x1&&s.y>r.y&&s.y<r.y+8){hit=true;break;}
   if(hit){if(s.k==='r'&&s.life>0)boom(s.x,s.y,s.own);else if(s.k==='r')boom(s.x,s.y,s.own);shots.splice(i,1);}}
  for(const p of smoke){p.x+=p.vx;p.y+=p.vy;p.r+=.08;p.t--;}for(let i=smoke.length-1;i>=0;i--)if(smoke[i].t<=0)smoke.splice(i,1);if(smoke.length>120)smoke.splice(0,smoke.length-120);
  // grabbing the ladder starts the climb; two seconds up it is an escape
  if(ch.lad>=30&&!banner)for(const h of P){if(h.dead||h.climb||h.stun>0)continue;const bot=ch.y+8+ch.lad;if(Math.abs(h.x-ch.x)<6&&h.y-16<bot&&h.y>ch.y+10){h.climb=1;h.cy0=h.y;h.wep=h.wep;if(!demo(g))S('coin');}}
  g.score=P[0].esc*100+P[0].hits*10;};
 g.timeUp=()=>P[0].esc!==P[1].esc?tu(P[0].esc,P[1].esc):tu(P[0].hits,P[1].hits);

 /* ---- scene ---- */
 const back=()=>X.cache('rooftop_bg',()=>{const c=A.c;
  X.sky(['#140f33','#3a2366','#8a3a6e','#e0705a','#ffb36a']);X.stars(50,7,0,0,90,.8);
  X.glow(236,150,90,'#ffcf7a',.35);X.disc(236,150,22,X.lg(0,128,0,172,['#fff1c0','#ffb36a']));
  for(let i=0;i<5;i++){const y=96+i*9;c.fillStyle='rgba(255,170,120,'+(.10-i*.015)+')';c.fillRect(0,y,W,1);}
  X.ell(70,70,60,6,'rgba(255,190,170,.18)');X.ell(250,58,70,5,'rgba(255,190,170,.14)');
  X.skyline(176,'#3a2550',8,3,'rgba(255,214,140,.35)');X.skyline(196,'#24183a',40,5,'rgba(255,214,140,.5)');
  // the buildings we stand on: brick facades, lit windows, parapets
  ROOFS.forEach((r,i)=>{const w=r.x1-r.x0,base=['#5a3a4a','#3e4a66','#6a4a3a','#44506a','#5a3a5a'][i];
   X.hg(r.x0,r.y,w,H-r.y,[X.lt(base,1.15),base,X.lt(base,.7)]);
   c.fillStyle='rgba(0,0,0,.12)';for(let y=r.y+6;y<H;y+=4)c.fillRect(r.x0,y,w,.6);
   for(let y=r.y+12;y<H-10;y+=13)for(let x=r.x0+5;x<r.x1-6;x+=10){const on=hash(x*3+i,y)>.45;X.rr(x,y,6,8,1,on?X.lg(0,y,0,y+8,['#ffe9a8','#ffb04a']):'#1c1a2c');if(on){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+2.6,y,.8,8);}}
   X.vg(r.x0-1,r.y-3,w+2,5,['#b9b0c4','#6e6680']);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(r.x0,r.y-3,w,1);});
  // roof furniture: an antenna, a water tower, a neon noodle sign, aircon units and a billboard
  {const r=ROOFS[0];c.fillStyle='#2a2438';c.fillRect(14,r.y-30,1.6,27);c.fillRect(8,r.y-22,13,1);c.fillRect(10,r.y-15,9,1);}
  {const r=ROOFS[1],x=100;c.fillStyle='#3a2a20';for(const dx of[-7,6])c.fillRect(x+dx,r.y-12,1.6,10);X.rr(x-10,r.y-30,20,19,3,X.hg?X.lg(x-10,0,x+10,0,['#6a4a30','#9a6a40','#5a3a24']):'#7a5434');c.fillStyle='rgba(0,0,0,.25)';for(let y=r.y-27;y<r.y-12;y+=4)c.fillRect(x-10,y,20,.6);X.poly([[x-12,r.y-30],[x,r.y-38],[x+12,r.y-30]],'#4a3424');}
  {const r=ROOFS[2],x=r.x0+11;c.fillStyle='#2a2438';c.fillRect(x-7,r.y+14,2,2);c.fillRect(x-7,r.y+44,2,2);X.rr(x-6,r.y+8,12,46,2,'#1a1424');X.glow(x,r.y+31,22,'#ff4f9a',.35);X.rrs(x-5.5,r.y+8.5,11,45,2,'#ff7ab8',1);'NOODLE'.split('').forEach((ch_,k)=>X.ot(ch_,x+.5,r.y+11+k*7,'#ffd0e6',1,'c'));}
  {const r=ROOFS[3];for(const x of[206,222])X.block(x,r.y-9,12,9,'#8a92a4',1.5);c.fillStyle='#2a2e38';c.fillRect(208,r.y-7,8,1);c.fillRect(224,r.y-7,8,1);}
  {const r=ROOFS[4];c.fillStyle='#2a2438';c.fillRect(284,r.y-26,1.6,24);c.fillRect(306,r.y-26,1.6,24);X.rr(278,r.y-40,34,16,2,X.lg(0,r.y-40,0,r.y-24,['#3dbbd9','#2a6aa8']));A.text('ZAP',295,r.y-37,'#fff3d6',1,'c');X.disc(302,r.y-30,2,'#ffcf3f');}
  // fire escapes in front of the facades
  for(const l of LEDGES){c.fillStyle='#1c1828';c.fillRect(l.x0,l.y,l.x1-l.x0,2);c.fillStyle='#4a445a';c.fillRect(l.x0,l.y,l.x1-l.x0,1);
   c.fillStyle='rgba(28,24,40,.9)';for(let x=l.x0;x<=l.x1;x+=4)c.fillRect(x,l.y-7,.7,7);c.fillRect(l.x0,l.y-7,l.x1-l.x0,.8);
   c.strokeStyle='rgba(28,24,40,.9)';c.lineWidth=.8;c.beginPath();c.moveTo(l.x1-6,l.y+2);c.lineTo(l.x1-16,l.y+14);c.stroke();}
  // the elevated railway
  X.vg(0,TRY+16,W,H-TRY-16,['#2a2236','#141020']);c.fillStyle='#4a405e';c.fillRect(0,TRY+14,W,2);c.fillStyle='#6a6080';c.fillRect(0,TRY+14,W,.7);
  for(let x=4;x<W;x+=40){X.vg(x,TRY+16,7,H,['#3a3050','#1a1428']);c.fillStyle='rgba(0,0,0,.35)';for(let y=TRY+19;y<H;y+=5)c.fillRect(x+1,y,5,.6);}
  c.strokeStyle='rgba(90,80,120,.6)';c.lineWidth=.8;c.beginPath();for(let x=0;x<W;x+=20){c.moveTo(x,TRY+16);c.lineTo(x+20,TRY+30);c.moveTo(x+20,TRY+16);c.lineTo(x,TRY+30);}c.stroke();
  X.vignette(.3);});
 const drawCar=c=>{const cv=A.c,x=carX(c),y=TRY;if(x>W+4||x+CAR<-4)return;
  cv.fillStyle='rgba(0,0,0,.35)';cv.fillRect(x+2,y+13,CAR-4,3);
  X.rr(x,y,CAR,13,c.loco?4:2,X.lg(0,y,0,y+13,c.loco?['#ff8a7a','#e8453c','#8a2420']:['#f4f6fa','#c9ced8','#7a8090']));
  cv.fillStyle=c.loco?'#ffcf3f':'#2f6fe0';cv.fillRect(x+1,y+9,CAR-2,1.6);
  for(let k=0;k<(c.loco?2:6);k++){const wx=x+(c.loco?40:5)+k*10.5;X.rr(wx,y+3,7,5,1,'#ffe3a0');cv.fillStyle='rgba(255,255,255,.4)';cv.fillRect(wx+1,y+3.5,1.4,4);}
  if(c.loco){X.rr(x+3,y+2,14,6,2,'#1d2433');cv.fillStyle='#fff6c0';cv.fillRect(x+64,y+4,4,2);}
  cv.fillStyle='rgba(255,255,255,.5)';cv.fillRect(x+2,y+.6,CAR-4,.8);
  for(const wx of[x+9,x+19,x+CAR-19,x+CAR-9]){X.disc(wx,y+15,2.6,'#141018');X.disc(wx,y+15,1,'#8a8496');}
  if(lo()&&(t+c.x|0)%37<3)X.glow(x+12,y+17,6,'#ffd27a',.6);};
 const chopper=()=>{const c=A.c,x=ch.x,y=ch.y,tilt=cl((ch.tx-ch.x)*.01,-.25,.25);
  if(lo()&&ch.lad>0){const g_=X.lg(0,y,0,y+120,['rgba(255,240,190,.28)','rgba(255,240,190,0)']);X.poly([[x-3,y+6],[x+3,y+6],[x+26,y+130],[x-26,y+130]],g_);}
  // the rope ladder sways a little
  if(ch.lad>0){const sw=Math.sin(t*.07)*2,bot=y+8+ch.lad;c.strokeStyle='#d8c08a';c.lineWidth=.9;c.beginPath();c.moveTo(x-3,y+7);c.lineTo(x-3+sw,bot);c.moveTo(x+3,y+7);c.lineTo(x+3+sw,bot);c.stroke();
   c.fillStyle='#e8d29a';for(let yy=y+11;yy<bot;yy+=4){const f=(yy-y)/ch.lad;c.fillRect(x-3+sw*f,yy,6,1);}
   if(ch.lad>=30){X.glow(x+sw,bot,12,'#3dff8b',.35+.2*Math.sin(t*.2));X.ot('EXIT',cl(x+sw,10,W-10),bot+3,'#3dff8b',1,'c');}}
  c.save();c.translate(x,y);c.rotate(tilt);
  c.fillStyle='#2a2e3a';c.fillRect(6,-2,22,2.4);X.rr(26,-6,4,6,1,'#3a3f4c');
  X.ell(0,0,11,6.5,X.lg(0,-6,0,6,['#5a6478','#2f3644','#1b2029']));X.ell(-4,-1.5,5,3.5,'rgba(150,220,255,.75)');c.fillStyle='rgba(255,255,255,.6)';c.fillRect(-7,-3,3,1);
  c.fillStyle='#1b2029';c.fillRect(-7,6,15,1);c.fillRect(-5,4,1,2.5);c.fillRect(4,4,1,2.5);
  c.fillStyle='#1b2029';c.fillRect(-1,-9,2,3);const sp=Math.abs(Math.sin(t*.9));X.ell(0,-9,14+sp*4,1.2,'rgba(200,210,230,.55)');X.ell(28,-3,.8,4,'rgba(200,210,230,.5)');
  X.disc(29,-6,1,(t>>4)%2?'#ff3b3b':'#5a1010');X.disc(-10,1,1,(t>>4)%2?'#3dff8b':'#104a20');
  c.restore();};
 const agent=h=>{const c=A.c;if(h.dead)return;if(h.shield>0&&h.shield%10<4)return;
  const col=PC[h.i],run=h.gnd&&Math.abs(h.vx)>.2?Math.sin(t*.5)*2:0;
  X.shadow(h.x,platOf(h).y,5,1.4,h.gnd?.35:.15);
  c.save();c.translate(h.x,h.y-7);c.rotate(h.a);
  // legs dangle in the air and kick when tumbling
  const lg_=h.gnd?0:cl(h.vy*.6,-2,2);c.strokeStyle='#14121c';c.lineWidth=2;c.beginPath();c.moveTo(-1.5,1);c.lineTo(-2.2-run*.4-lg_*.3,7);c.moveTo(1.5,1);c.lineTo(2.2+run*.4+lg_*.3,7);c.stroke();
  c.fillStyle='#0c0a10';c.fillRect(-3.6-run*.4,6,3,1.6);c.fillRect(1+run*.4,6,3,1.6);
  X.rr(-3.6,-7,7.2,9,2.2,X.lg(-4,0,4,0,[X.lt(SUIT[h.i],1.6),SUIT[h.i],X.lt(SUIT[h.i],.7)]));
  c.fillStyle='#f6f1e6';X.poly([[-1.4,-7],[1.4,-7],[0,-3.5]],'#f6f1e6');c.fillStyle=col;c.fillRect(-.6,-6.5,1.2,5);
  // arms: the gun arm points ahead, the other flails
  const fa=h.arm>0?0:h.wep?.15:.9+Math.sin(t*.3+h.i)*.3;c.strokeStyle=SUIT[h.i];c.lineWidth=1.8;c.beginPath();c.moveTo(0,-5.5);c.lineTo(h.face*(5.5-fa*2),-4+fa*3);c.stroke();
  if(h.wep){const w=WEP[h.wep];c.fillStyle=w.col;if(h.wep==='rocket'){X.rr(h.face>0?2:-11,-6.5,9,3,1.2,w.col);c.fillStyle='#ff6a2a';c.fillRect(h.face>0?10:-11,-6,1,2);}else if(h.wep==='shotgun'){c.fillRect(h.face>0?3:-11,-5,8,1.6);}else c.fillRect(h.face>0?4:-8,-5.2,4,1.6);}
  else{X.disc(h.face*(5.5-fa*2),-4+fa*3,1.2,'#f1c7a3');}
  c.strokeStyle=SUIT[h.i];c.beginPath();c.moveTo(0,-5.5);c.lineTo(-h.face*3,-1+Math.sin(t*.4+h.i)*1.5);c.stroke();
  X.disc(0,-10,3.4,'#f1c7a3');c.fillStyle=h.i?'#5a2a1a':'#1a1414';c.beginPath();c.arc(0,-10.6,3.5,Math.PI,TAU);c.fill();
  c.fillStyle='#0c0a10';c.fillRect(h.face>0?-.5:-3.5,-10.6,4,1.4);c.fillStyle=col;c.fillRect(h.face>0?2.2:-3.5,-10.4,1.2,.8);
  c.restore();
  if(h.stun>0&&!h.gnd||h.stun>10)for(let k=0;k<3;k++){const a=t*.15+k*2.1;X.disc(h.x+Math.cos(a)*5,h.y-20+Math.sin(a)*1.5,.9,'#ffcf3f');}
  if(h.shield>0)A.ring(h.x,h.y-8,11,X.rgba(col,.6));
  X.ot(A.nm(h.i),cl(h.x,8,W-8),Math.max(20,h.y-27),col,1,'c');};
 const crate=c=>{const cv=A.c;if(!c.land){cv.strokeStyle='rgba(255,255,255,.6)';cv.lineWidth=.5;cv.beginPath();cv.moveTo(c.x-4,c.y-7);cv.lineTo(c.x-7,c.y-16);cv.moveTo(c.x+4,c.y-7);cv.lineTo(c.x+7,c.y-16);cv.stroke();
   cv.fillStyle='#f6f1e6';cv.beginPath();cv.arc(c.x,c.y-16,8,Math.PI,TAU);cv.fill();cv.fillStyle='#e8453c';for(let k=0;k<4;k+=2){cv.beginPath();cv.moveTo(c.x,c.y-16);cv.arc(c.x,c.y-16,8,Math.PI+k*Math.PI/4,Math.PI+(k+1)*Math.PI/4);cv.fill();}}
  X.block(c.x-4.5,c.y-8,9,8,'#b07a48',1);cv.strokeStyle='rgba(60,30,10,.7)';cv.lineWidth=.6;cv.beginPath();cv.moveTo(c.x-4,c.y-7.5);cv.lineTo(c.x+4,c.y-.5);cv.stroke();
  if(c.land&&lo())X.glow(c.x,c.y-4,9,'#ffcf3f',.25+.15*Math.sin(t*.15));
  if(c.y>14)A.text(c.k[0].toUpperCase(),c.x,c.y-6.5,'#fff3d6',1,'c');};
 g.draw=()=>{const c=A.c;back();
  if(hi()){c.strokeStyle='rgba(200,190,255,.22)';c.lineWidth=.5;c.beginPath();for(const r of rain){r.y+=r.s;r.x-=r.s*.25;if(r.y>H){r.y=-4;r.x=rnd(W+40);}c.moveTo(r.x,r.y);c.lineTo(r.x+1,r.y-4);}c.stroke();}
  chopper();for(const k of crates)crate(k);
  for(const p of smoke){c.globalAlpha=Math.max(0,p.t/p.m)*.6;X.disc(p.x,p.y,p.r,p.c);}c.globalAlpha=1;
  for(const k of cars)drawCar(k);
  for(const h of P)agent(h);
  for(const s of shots){if(s.k==='r'){c.save();c.translate(s.x,s.y);if(s.vx<0)c.scale(-1,1);X.rr(-4,-1.2,7,2.4,1,'#9aa2b0');c.fillStyle='#e8453c';c.fillRect(2.5,-1.2,1.5,2.4);if(lo())X.glow(-5,0,5,'#ffb34a',.7);c.restore();}
   else{c.strokeStyle='#fff3a0';c.lineWidth=s.k==='s'?1:1.3;c.beginPath();c.moveTo(s.x,s.y);c.lineTo(s.x-s.vx*1.4,s.y-s.vy*1.4);c.stroke();}}
  fx.draw();
  X.bar();A.hud2(P[0].esc,P[1].esc);
  for(const h of P){const x=h.i?W-60:44;for(let k=0;k<3;k++)X.disc(x+k*7,9,2.3,k<h.esc?PC[h.i]:'rgba(255,255,255,.18)');if(h.wep)A.text(h.wep.toUpperCase()+' '+h.ammo,h.i?W-6:6,20,'#ffcf3f',1,h.i?'r':'l');}
  if(banner&&banner.who!==undefined)X.ot(A.nm(banner.who)+' ESCAPED!',160,64,PC[banner.who],2,'c');
  else if(t<90)X.ot('GET TO THE LADDER!',160,64,'#ffcf3f',2,'c');};
 return g;}});

/* ================= NEBULA RUN ================= */
// a tube of NS tile lanes; you run along the inside and whichever lane you stand on is the floor
const NS=8,RL=.6,FIN=900,APO=Math.cos(Math.PI/NS),EYE=.42,BEHIND=1.55,FOG=24;
const SECT=[{edge:'#2fd6c3',tile:[26,52,86],name:'TEAL REACH'},{edge:'#ff4f9a',tile:[70,26,74],name:'ROSE DRIFT'},{edge:'#ffb340',tile:[78,48,22],name:'AMBER VOID'}];
const sectOf=j=>SECT[Math.min(2,Math.floor(j/(FIN/3)))];
let NEB=null;
const nebula=()=>{if(NEB||!doc())return NEB;const cv=document.createElement('canvas');cv.width=840;cv.height=840;const c=cv.getContext('2d');if(!c||!c.createRadialGradient)return null;c.scale(2,2);
 const g0=c.createRadialGradient(210,210,10,210,210,300);g0.addColorStop(0,'#1a1238');g0.addColorStop(1,'#04030c');c.fillStyle=g0;c.fillRect(0,0,420,420);
 c.globalCompositeOperation='lighter';
 for(const[x,y,r,col]of[[120,140,150,'rgba(150,60,220,.35)'],[300,260,170,'rgba(40,160,220,.28)'],[250,110,110,'rgba(255,90,150,.22)'],[140,310,120,'rgba(255,160,70,.16)'],[210,210,90,'rgba(120,90,255,.2)']]){const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,420,420);}
 for(let i=0;i<500;i++){const x=hash(i,1)*420,y=hash(i,2)*420,b=hash(i,3);c.fillStyle='rgba(255,255,255,'+(.25+b*.7).toFixed(2)+')';const s=b>.96?1.6:b>.7?1:.6;c.fillRect(x,y,s,s);}
 c.globalCompositeOperation='source-over';
 // a ringed planet and a far galaxy
 const px=330,py=90,pg=c.createRadialGradient(px-8,py-8,2,px,py,26);pg.addColorStop(0,'#ffd8a8');pg.addColorStop(.6,'#c86a5a');pg.addColorStop(1,'#3a1830');c.fillStyle=pg;c.beginPath();c.arc(px,py,24,0,TAU);c.fill();
 c.strokeStyle='rgba(255,220,180,.55)';c.lineWidth=2;c.beginPath();c.ellipse(px,py,40,9,-.35,0,TAU);c.stroke();
 c.save();c.translate(80,330);c.rotate(.6);c.globalCompositeOperation='lighter';const gg=c.createRadialGradient(0,0,0,0,0,30);gg.addColorStop(0,'rgba(255,240,220,.6)');gg.addColorStop(1,'rgba(120,140,255,0)');c.fillStyle=gg;c.scale(1,.35);c.beginPath();c.arc(0,0,30,0,TAU);c.fill();c.restore();
 NEB=cv;return NEB;};

A.add({id:'nebularun',name:'NEBULA RUN',cat:'VERSUS',vs:1,time:150,warm:150,tags:'run 3 run3 tunnel runner space gravity tube endless runner versus race',
 how:'LEFT/RIGHT RUN ROUND THE TUNNEL, A OR UP JUMPS. MIND THE GAPS. FIRST TO THE GATE WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0;
 // the track: one shared tile map, rings of NS tiles. 0 gap, 1 tile, 2 crumbling, 3 boost
 const N=FIN+60,T=g._T=new Uint8Array(N*NS),CELL=new Int8Array(N).fill(-1);
 {let j=0,lane=0;const set=(r,k,v)=>{if(r<N)T[r*NS+((k%NS)+NS)%NS]=v;};
  while(j<N){const d=Math.min(1,j/FIN);let len=10+ri(10);
   const kinds=j<30||j>FIN-4?['plain']:['plain','gaps','holes','stripes','spiral','crumble','gaps','holes'];const kd=kinds[ri(kinds.length)],par=ri(2);if(kd==='crumble')len=8+ri(6);
   for(let r=j;r<j+len&&r<N;r++){
    if(r%5===0&&Math.random()<.35)lane+=ri(3)-1;
    for(let k=0;k<NS;k++)set(r,k,1);
    if(kd==='holes'){for(let k=0;k<NS;k++)if(Math.random()<.12+d*.22)set(r,k,0);set(r,lane,1);set(r,lane+1,1);}
    else if(kd==='stripes'){for(let k=0;k<NS;k++)if((k+par)%2)set(r,k,0);}
    else if(kd==='spiral'){const s=lane+Math.floor((r-j)/3);for(let k=0;k<NS;k++){const dk=((k-s)%NS+NS)%NS;if(dk>2)set(r,k,0);}if(r===j+len-1)lane=s+1;}
    else if(kd==='crumble'){for(let k=0;k<NS;k++)set(r,k,2);set(r,lane,1);}
    if(kd!=='crumble'&&kd!=='spiral'&&Math.random()<.025)set(r,lane+ri(3)-1,3);
    if((r-j)%6===3)CELL[r]=((lane+ri(3)-1)%NS+NS)%NS;}
   // full gaps to jump, wider further on, always with solid tiles to land on
   if(kd==='gaps'){const mg=Math.max(1,Math.floor(33*(.062+d*.05)/RL)-1),gl=1+ri(Math.min(mg,2+Math.round(d*2.4))),at=j+4+ri(Math.max(1,len-gl-6));for(let r=at;r<at+gl&&r<N;r++)for(let k=0;k<NS;k++)set(r,k,0);const end=at+gl+Math.ceil(33*(.062+d*.05)/RL)+3;for(let r=at+gl;r<end&&r<N;r++)for(let k=0;k<NS;k++)set(r,k,1);len=Math.max(len,end-j);}
   j+=len;}
  for(let r=0;r<12;r++)for(let k=0;k<NS;k++)T[r*NS+k]=1;
  for(let r=FIN-4;r<N;r++)for(let k=0;k<NS;k++)T[r*NS+k]=1;
  for(let r=0;r<N;r++)if(CELL[r]>=0&&!T[r*NS+CELL[r]])CELL[r]=-1;}
 const R=g._R=[0,1].map(i=>({i,z:RL*2,u:i?4.5:.5,cu:i?4.5:.5,y:0,vy:0,vz:.06,boost:0,fall:0,safe:{z:RL*2,u:i?4.5:.5},cells:0,crumb:new Map(),gotC:new Set(),fin:0,step:0,think:0,want:0,jumpAt:-1,lean:0}));
 const ringOf=z=>Math.floor(z/RL),laneOf=u=>((Math.floor(u)%NS)+NS)%NS;
 // amber tiles: some of them drop out as you come near, so the floor ahead changes under your feet
 const tileFor=(r,j,k)=>{if(j<0)return 1;if(j>=N)return 1;const v=T[j*NS+k];if(v===2){const id=j*NS+k;let c=r.crumb.get(id);if(c===undefined&&hash(j,k+9)<.5&&r.z>(j-2.6-hash(j,k)*2.6)*RL&&!r.fall){r.crumb.set(id,t);c=t;r.think=0;}if(c!==undefined&&t-c>6)return 0;}return v;};
 // the CPU runs a touch slower on easier settings, since it rarely falls
 const base=r=>(.062+Math.min(1,r.z/RL/FIN)*.05)*(r.i===1&&A.cpu&&!demo(g)?.86+.14*skill():1);
 const step=(r,k)=>{
  if(r.fin){r.vz*=.96;r.z+=r.vz;return;}
  if(r.fall>0){r.fall--;r.y+=r.vy;r.vy-=.006;r.z+=r.vz*.6;if(r.fall===0){
   // three falls from the same spot: a mercy skip to the next steady ground a little further on
   r.fails=r.safe.z===r.lastSafe?(r.fails||0)+1:1;r.lastSafe=r.safe.z;
   if(r.fails>=3){let j=ringOf(r.safe.z)+8;for(;j<N-3;j++){let k=0;for(;k<NS;k++)if(T[j*NS+k]===1&&T[(j+1)*NS+k]===1&&T[(j+2)*NS+k]===1&&T[(j-1)*NS+k]===1)break;if(k<NS){r.safe={z:j*RL+RL*.5,u:k+.5};break;}}r.fails=0;}
   r.z=r.safe.z;r.u=r.safe.u;r.cu=r.u;r.y=0;r.vy=0;r.vz=base(r);r.crumb.clear();}return;}
  const dir=(k.r?1:0)-(k.l?1:0);r.u+=dir*.1;r.lean+=(dir-r.lean)*.2;
  if(r.boost>0)r.boost--;const tv=base(r)+(r.boost>0?.035:0);r.vz+=(tv-r.vz)*.03;r.z+=r.vz;
  const j=ringOf(r.z),ln=laneOf(r.u),tl=tileFor(r,j,ln);
  if(r.y>0||r.vy>0){r.vy-=.0045;r.y+=r.vy;if(r.y<=0){if(tl){r.y=0;r.vy=0;if(!demo(g)&&r.i===0)S('blip');}else if(r.y<-.05){}}}
  if(r.y<=0&&r.vy<=0){if(tl&&r.y>-.12){r.y=0;r.vy=0;
    if(tl===3&&r.boost<30){r.boost=90;if(!demo(g)&&(r.i===0||!A.cpu))S('score');}
    if(tl===1&&j>3&&tileFor(r,j-1,ln)&1&&tileFor(r,j-2,ln)&1&&tileFor(r,j+1,ln)&1&&tileFor(r,j+2,ln)&1)r.safe={z:(j-1)*RL+RL*.5,u:Math.floor(r.u)+.5};
    if((k.a||k.u)){r.vy=.074;r.y=.001;r.step++;if(!demo(g)&&(r.i===0||!A.cpu))S('jump');}}
   else{r.vy-=.006;r.y+=r.vy;if(r.y<-.5){r.fall=60;r.vy=-.02;if(!demo(g))S('lose');}}}
  // power cells float above the tiles
  if(CELL[j]>=0&&!r.gotC.has(j)&&laneOf(r.u)===CELL[j]&&r.y<.5){r.gotC.add(j);r.cells++;if(!demo(g)&&(r.i===0||!A.cpu))S('coin');}
  if(ringOf(r.z)>=FIN){r.fin=1;if(!demo(g))fx.flash(PC[r.i],10);}};
 // CPU: a little search over the tiles ahead (walk on, side-step a lane, or jump a gap) for the route that gets furthest
 const LOOK=14,reach=new Int16Array((LOOK+8)*NS),from=new Int16Array((LOOK+8)*NS);
 const brain=r=>{const sk=r.i===1&&!demo(g)?skill():.93,k={},j=ringOf(r.z);
  if(r.fall>0||r.fin)return k;
  const L=Math.round(6+sk*8),ok=(q,l)=>{const ll=((l%NS)+NS)%NS,v=tileFor(r,j+q,ll);return v===2&&hash(j+q,ll+9)<.5?0:v;},air=Math.max(2,Math.floor(2*.074/.0045*r.vz/RL));
  // in the air: steer for the nearest lane with tiles where you will come down
  if(r.y>0||r.vy>0){const tr=(r.vy+Math.sqrt(r.vy*r.vy+2*.0045*Math.max(0,r.y)))/.0045,ql=Math.floor((r.z+r.vz*tr)/RL)-j,reachL=tr*.1;let best=null,bd=1e9;
   for(let d=-3;d<=3;d++){const l=laneOf(r.u)+d;if(ok(ql,l)&&ok(ql+1,l)){const du=Math.abs(Math.floor(r.u)+d+.5-r.u);if(du<=reachL+.4&&du<bd){bd=du;best=Math.floor(r.u)+d;}}}
   if(best!==null){const du=best+.5-r.u;if(Math.abs(du)>.1)k[du>0?'r':'l']=1;}return k;}
  const mid=r.plan&&Math.abs(r.plan.l+.5-(((r.u%NS)+NS)%NS))>.15&&ok(1,r.plan.l)&&ok(0,r.plan.l);
  if(--r.think<=0&&!mid){r.think=2+ri(Math.round(1+(1-sk)*8));
   reach.fill(0);const l0=laneOf(r.u)+NS;let bq=0,bl=l0,bs=-1e9;
   const at=(q,l)=>q*NS+((l%NS)+NS)%NS,mark=(q,l,f)=>{if(q>L+6)return;const i=at(q,l);if(!reach[i]){reach[i]=1;from[i]=f;}};
   mark(0,l0,-1);
   for(let q=0;q<=L;q++)for(let l=0;l<NS;l++){const i=at(q,l);if(!reach[i]||!ok(q,l))continue;
    const s=q*10-(l!==l0%NS?.5:0)+(CELL[j+q]===l?3:0)+(l===r.goalL?4:0);if(s>bs){bs=s;bq=q;bl=l;}
    if(ok(q+1,l))mark(q+1,l,i);
    for(const d of[-1,1])if(ok(q+2,l+d)&&(ok(q+1,l)||ok(q+1,l+d)))mark(q+2,l+d,i);
    if(!ok(q+1,l))for(const d of[0,-1,1,-2,2])if(ok(q+air,l+d)&&ok(q+air+1,l+d)&&ok(q+air+2,l+d))mark(q+air+1,l+d,i);}
   // walk back to the first step of the best route
   let i=at(bq,bl),prev=i;while(from[i]>=0&&Math.floor(from[i]/NS)>0){prev=i;i=from[i];}
   r.goalL=bl;r.plan={l:i%NS,q:Math.floor(i/NS)};
   // easier CPUs sometimes pick a worse lane
   if(Math.random()>sk+.15){const w=(r.plan.l+(Math.random()<.5?1:-1)+NS)%NS;if(ok(0,w)&&ok(1,w)&&ok(2,w))r.plan.l=w;}}
  const pl=r.plan||{l:laneOf(r.u),q:1};
  let du=((pl.l+.5-((r.u%NS)+NS)%NS)%NS+NS)%NS;if(du>NS/2)du-=NS;
  // only slide into the next lane once it has a tile under you (or will in a moment); jump only when the route says so
  const ln=laneOf(r.u),ed=(j+1)*RL-r.z,gap=!ok(1,ln),isJ=pl.q>2,err=(1-sk)*(hash(j,r.i+3)-.5)*.4;
  if(Math.abs(du)>.1){const nx=laneOf(r.u+Math.sign(du)*.7);if(nx===ln||ok(0,nx)&&ok(1,nx)||ok(1,nx)&&(ok(2,nx)&&ed<r.vz*4||gap&&!isJ))k[du>0?'r':'l']=1;}
  if(r.y<=0&&ok(0,ln)&&gap&&ed<r.vz*3+.03+err&&(isJ||Math.abs(du)<.1))k.a=1;
  return k;};
 g.update=()=>{t++;
  for(const r of R){const k=demo(g)||(r.i===1&&A.cpu)?brain(r):A.in(r.i);if(r.i===1&&A.cpu&&!demo(g))A.bot(k);step(r,k);
   let d=r.u-r.cu;r.cu+=d*.22;}
  g.score=Math.floor(Math.min(FIN,R[0].z/RL))*2+R[0].cells*10;
  const done=R.filter(r=>r.fin);
  if(done.length&&!g.over){if(demo(g)){if(done.length===2){R.forEach(r=>{r.z=RL*2;r.fin=0;r.vz=.06;r.crumb.clear();r.gotC.clear();r.safe={z:RL*2,u:r.u};});}return;}
   const a=R[0].fin&&R[1].fin;g.over=a?'PHOTO FINISH - DRAW':A.win(done[0].i);S('win');}};
 g.timeUp=()=>{const a=R[0].z,b=R[1].z;return Math.abs(a-b)<RL?'TIME UP - DRAW':tu(a,b);};

 /* ---- scene: a perspective view down the tube from just behind the runner, rolled so their lane is the floor ---- */
 const cosT=new Float32Array(NS+1),sinT=new Float32Array(NS+1);
 const view=(r,y0,h,full)=>{const c=A.c,cx=160,cy=y0+h*.47,F=h*.66,camZ=r.z-BEHIND,camY=APO-EYE;
  c.save();c.beginPath();c.rect(0,y0,W,h);c.clip&&c.clip();
  // space, rolled with the tube
  const roll=(r.cu-.5)*TAU/NS,neb=nebula();
  if(neb&&c.drawImage){c.save();c.translate(cx,cy);c.rotate(-roll*.35);const s=Math.max(1,h/150);c.drawImage(neb,-210*s,-210*s,420*s,420*s);c.restore();}
  else X.vg(0,y0,W,h,['#1a1238','#04030c']);
  // the tube's corners for this camera: lane k spans angles around the floor
  for(let k=0;k<=NS;k++){const a=Math.PI/2+(k-r.cu)*TAU/NS;cosT[k]=Math.cos(a)/APO;sinT[k]=Math.sin(a)/APO;}
  const j0=Math.max(0,ringOf(camZ+.25)),j1=Math.min(N-1,j0+Math.round(FOG/RL));
  const P_=(k,z,lift)=>{const dz=z-camZ,s=(1-(lift||0));let co,si;if(k===(k|0)&&k<=NS){co=cosT[k];si=sinT[k];}else{const a=Math.PI/2+(k-r.cu)*TAU/NS;co=Math.cos(a)/APO;si=Math.sin(a)/APO;}return[cx+co*s*F/dz,cy+(si*s-camY)*F/dz];};
  const cut=j=>(j*RL-camZ);
  for(let j=j1;j>=j0;j--){const z0=Math.max(j*RL,camZ+.22),z1=(j+1)*RL;if(z1-camZ<.25)continue;const fog=Math.min(1,cut(j)/FOG),al=1-fog*fog,se=sectOf(j),tc=se.tile;
   for(let k=0;k<NS;k++){const v=tileFor(r,j,k);
    // a crumbling tile that has gone drops away into space
    if(!v){if(T[j*NS+k]===2){const c0=r.crumb.get(j*NS+k);const age=t-c0-6;if(age<30){const dl=age*.02;const a=P_(k,z0,-dl),b=P_(k+1,z0,-dl),d=P_(k+1,z1,-dl),e=P_(k,z1,-dl);c.globalAlpha=al*(1-age/30);X.poly([a,b,d,e],'#6a3a1a');c.globalAlpha=1;}}continue;}
    const a=P_(k,z0),b=P_(k+1,z0),d=P_(k+1,z1),e=P_(k,z1);
    const ang=(k+.5-r.cu)*TAU/NS,lit=.5+.5*Math.cos(ang),chk=(j+k)&1?1:.86;
    let R_=tc[0]*lit*chk,G_=tc[1]*lit*chk,B_=tc[2]*lit*chk;
    if(v===2){R_=150*lit*chk;G_=96*lit*chk;B_=40*lit*chk;}else if(v===3){R_=40*lit;G_=150*lit;B_=90*lit;}
    c.fillStyle='rgba('+(R_|0)+','+(G_|0)+','+(B_|0)+','+al.toFixed(2)+')';X.poly([a,b,d,e],c.fillStyle);
    const dz=z0-camZ;
    if(dz<10&&lo()){
     if(v===3){const m=P_(k+.5,z0+RL*.25),l=P_(k+.15,z0+RL*.75),q=P_(k+.85,z0+RL*.75);c.strokeStyle='rgba(160,255,200,'+(al*(.6+.4*Math.sin(t*.3+j))).toFixed(2)+')';c.lineWidth=Math.max(.6,3/dz);c.beginPath();c.moveTo(l[0],l[1]);c.lineTo(m[0],m[1]);c.lineTo(q[0],q[1]);c.stroke();}
     else if(v===2){const m1=P_(k+.3,z0+RL*.2),m2=P_(k+.55,z0+RL*.55),m3=P_(k+.4,z0+RL*.9);c.strokeStyle='rgba(255,220,150,'+(al*.45).toFixed(2)+')';c.lineWidth=Math.min(1.1,Math.max(.4,1/dz));c.beginPath();c.moveTo(m1[0],m1[1]);c.lineTo(m2[0],m2[1]);c.lineTo(m3[0],m3[1]);c.stroke();}
     else{const i1=P_(k+.12,z0+RL*.12),i2=P_(k+.88,z0+RL*.12),i3=P_(k+.88,z1-RL*.12),i4=P_(k+.12,z1-RL*.12);c.strokeStyle='rgba(255,255,255,'+(al*.07).toFixed(2)+')';c.lineWidth=Math.max(.4,1.6/dz);c.beginPath();c.moveTo(i1[0],i1[1]);c.lineTo(i2[0],i2[1]);c.lineTo(i3[0],i3[1]);c.lineTo(i4[0],i4[1]);c.closePath();c.stroke();}}
    // the neon seams: the far edge of each tile and its lane edges
    c.strokeStyle=X.rgba(se.edge,(al*(dz<3?.9:.55)).toFixed(2));c.lineWidth=Math.max(.35,(dz<2?2.2:1.4)/Math.max(1,dz*.6));c.beginPath();c.moveTo(e[0],e[1]);c.lineTo(d[0],d[1]);c.moveTo(a[0],a[1]);c.lineTo(e[0],e[1]);c.stroke();}
   // power cells
   if(CELL[j]>=0&&!r.gotC.has(j)){const k=CELL[j],zc=j*RL+RL*.5;if(zc-camZ>.4){const p=P_(k+.5,zc,.28),sz=Math.min(9,2.4*F/80/(zc-camZ)*4);if(lo())X.glow(p[0],p[1],sz*2.6,'#ffe27a',al*.6);X.orb(p[0],p[1],sz,'#ffcf3f');}}
   // the finish gate
   if(j===FIN){const pts=[];for(let k=0;k<=NS;k++)pts.push(P_(k,FIN*RL,.04));c.strokeStyle='rgba(255,255,255,'+al+')';c.lineWidth=Math.max(1,6/Math.max(1,cut(j)*.5));c.beginPath();pts.forEach((p,i)=>i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]));c.stroke();
    if(lo()){const m=P_(0,FIN*RL,1);X.glow(m[0],cy,40*F/100/Math.max(.5,cut(j)*.15),'#ffffff',al*.25);}}}
  // speed motes streaking past along the walls
  if(lo())for(let m=0;m<26;m++){const zz=camZ+.6+((hash(m,1)*FOG-(r.z*1.6)%FOG)+FOG)%FOG,k=hash(m,2)*NS;if(zz-camZ<.6)continue;const p0=P_(k,zz,.12),p1=P_(k,zz+.5,.12),al2=Math.min(1,(1-(zz-camZ)/FOG)*1.3);c.strokeStyle='rgba(220,230,255,'+(al2*.5).toFixed(2)+')';c.lineWidth=Math.max(.4,1.4/(zz-camZ));c.beginPath();c.moveTo(p0[0],p0[1]);c.lineTo(p1[0],p1[1]);c.stroke();}
  // the rival as a ghost runner, then you
  const o=R[1-r.i];if(o.z-camZ>.5&&o.z-camZ<FOG&&!o.fall){runner(o,camZ,camY,cx,cy,F,r.cu,.5);}
  if(r.fall<=0||r.fall>45)runner(r,camZ,camY,cx,cy,F,r.cu,1);
  // labels
  const se=sectOf(ringOf(r.z));
  X.panel(4,y0+3,96,13,PC[r.i]);A.text(A.nm(r.i)+' '+Math.floor(Math.min(FIN,r.z/RL))*2+'M',8,y0+6,PC[r.i],1);X.disc(78,y0+9,2.6,'#ffcf3f');A.text(''+r.cells,96,y0+6,'#ffcf3f',1,'r');
  A.text(se.name,W-6,y0+6,X.rgba(se.edge,.85),1,'r');
  const lead=Math.floor((r.z-o.z)/RL)*2;if(full||true)A.text((lead>=0?'+':'')+lead+'M VS '+A.nm(1-r.i),W-6,y0+15,lead>=0?'#3dff8b':'#ff9a9a',1,'r');
  if(r.boost>0)X.ot('BOOST!',cx,y0+h-20,'#3dff8b',1,'c');
  if(r.fall>0)X.ot('LOST IN SPACE!',cx,y0+h*.35,'#ff4f6d',2,'c');if(r.fin)X.ot('FINISHED!',cx,y0+h*.35,'#ffcf3f',2,'c');
  c.restore();};
 const runner=(q,camZ,camY,cx,cy,F,cu,al)=>{const c=A.c,dz=q.z-camZ;if(dz<.3)return;
  const a=Math.PI/2+(q.u-cu)*TAU/NS,rad=APO-Math.max(-.6,q.y);const fx_=Math.cos(a)*rad,fy=Math.sin(a)*rad;
  const sx=cx+fx_*F/dz,sy=cy+(fy-camY)*F/dz,s=F/dz/60,rot=a-Math.PI/2;
  c.save();c.globalAlpha=al*(q.fall>0?Math.max(0,(q.fall-45)/15):1);c.translate(sx,sy);c.rotate(rot+q.lean*.15);c.scale(s,s);
  const col=PC[q.i],run=q.y>0?0:Math.sin(q.z*18),sh=q.y>0?Math.max(.2,1-q.y*2):1;
  if(q.y>0){c.globalAlpha*=.6;X.ell(0,q.y*F/dz/s*0,6*sh,1.6*sh,'rgba(0,0,0,.4)');c.globalAlpha=al;}else X.ell(0,0,6,1.6,'rgba(0,0,0,.4)');
  // legs, a round suit, a big visor
  c.strokeStyle='#cfd6e6';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-2,-6);c.lineTo(-2-run*2.5,-1+Math.abs(run)*-1.5);c.moveTo(2,-6);c.lineTo(2+run*2.5,-1-Math.abs(run)*1.5);c.stroke();c.lineCap='butt';
  X.ell(0,-11,6,7,X.lg(-6,0,6,0,['#ffffff','#cfd6e6','#7a8296']));c.fillStyle=col;c.fillRect(-6,-10,12,1.6);
  X.disc(0,-19,5.2,X.rg(-2,-21,0,0,-19,5.2,['#ffffff','#dfe5f0','#8a92a6']));X.ell(0,-19,3.8,2.8,X.lg(0,-22,0,-16,['#3a2a6a','#120a24']));X.ell(-1.4,-20.2,1.3,.6,'rgba(255,255,255,.8)');
  c.strokeStyle='#cfd6e6';c.lineWidth=2;c.beginPath();c.moveTo(-5,-13);c.lineTo(-7,-9-run*2);c.moveTo(5,-13);c.lineTo(7,-9+run*2);c.stroke();
  if(lo()){X.glow(0,-8,7,col,.35);if(q.boost>0)for(let k=0;k<3;k++)X.disc(rnd(4)-2,-4+k*2,1.4,'#7dffb5');}
  c.restore();c.globalAlpha=1;};
 g.draw=()=>{const c=A.c;c.fillStyle='#04030c';c.fillRect(0,0,W,H);
  if(A.two&&!demo(g)){view(R[0],18,111,false);view(R[1],130,110,false);c.fillStyle='#0c0a1a';c.fillRect(0,128,W,2);}
  else view(R[0],18,H-18,true);
  // the race strip
  const bx=110,bw=100,y=A.two&&!demo(g)?128.5:H-6;c.fillStyle='rgba(255,255,255,.25)';c.fillRect(bx,y,bw,1);for(const r of R){const f=Math.min(1,r.z/RL/FIN);X.disc(bx+bw*f,y+.5,2.2,PC[r.i]);}
  fx.draw();X.bar('','',null);A.hud2(Math.floor(Math.min(FIN,R[0].z/RL))*2+'M',Math.floor(Math.min(FIN,R[1].z/RL))*2+'M');};
 return g;}});
})();
