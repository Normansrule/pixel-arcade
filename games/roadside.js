/* PIXEL ARCADE - roadside pack: SINKHOLE CITY (a growing-hole duel over a busy city block) and RIDGE RUNNER
   (a split-screen hill-climb race), both VS CPU with difficulty or 2 players */
(function(){'use strict';const A=window.A,{W,H,K}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const hi=()=>A.gfx==='high',lo=()=>A.gfx!=='off';
const TAU=Math.PI*2,hyp=Math.hypot;
const PC=['#2fd6c3','#ff4f9a'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const demo=g=>!!(g.auto||A._e&&A._e.state==='title');

/* ================= SINKHOLE CITY ================= */
// the block plan: two roads each way cut the screen into nine blocks; the middle one is a park
const TOP=18,RY=[[80,96],[158,174]],RX=[[96,112],[208,224]];
const BLOCKS=[];{const ys=[[TOP,80],[96,158],[174,H]],xs=[[0,96],[112,208],[224,W]];ys.forEach((y,j)=>xs.forEach((x,i)=>BLOCKS.push({x0:x[0],x1:x[1],y0:y[0],y1:y[1],park:i===1&&j===1})));}
// thing types: size (how big a hole must be), and how it is painted
const T={person:{s:1.6},cone:{s:1.8},hydrant:{s:2},bin:{s:2.4},lamp:{s:2.5},bench:{s:3,w:7,h:3},bike:{s:2.8},tree:{s:5},car:{s:5.4,w:11,h:6},
 kiosk:{s:6.5,w:10,h:9},bus:{s:9.5,w:20,h:8},fountain:{s:10},house:{s:11,w:20,h:16},shop:{s:15,w:28,h:20},tower:{s:21,w:30,h:30}};
const CARC=['#e8453c','#2f6fe0','#f2c14e','#eceae3','#3b3f4a','#36b37e','#9b59d0'];
const ROOF=['#b95a46','#6e7d91','#c9a46a','#8a5d9e','#4f8a7a'];

A.add({id:'sinkhole',name:'SINKHOLE CITY',cat:'VERSUS',vs:1,mouse:1,time:120,warm:120,tags:'hole.io hole io swallow grow city eat everything sinkhole versus',
 how:'STEER YOUR HOLE. SWALLOW THINGS SMALLER THAN YOU TO GROW. A BIG HOLE CAN EAT ITS RIVAL.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0,uid=0;
 const things=[],later=[];
 const mk=(type,x,y,o)=>Object.assign({id:++uid,type,x,y,hx:x,hy:y,s:T[type].s,w:T[type].w||0,h:T[type].h||0,a:0,col:'#fff',vx:0,vy:0,fall:null,wob:0,seed:ri(1000)},o||{});
 const free=(x,y,s,b)=>x-s>b.x0+3&&x+s<b.x1-3&&y-s>b.y0+3&&y+s<b.y1-3&&!things.some(o=>!o.mv&&hyp(o.x-x,o.y-y)<o.s+s+1.5);
 const place=(b,type,n,o)=>{for(let k=0;k<n;k++)for(let tr=0;tr<40;tr++){const s=T[type].s,x=b.x0+rnd(b.x1-b.x0),y=b.y0+rnd(b.y1-b.y0);if(free(x,y,s,b)){things.push(mk(type,x,y,Object.assign({col:type==='house'||type==='shop'||type==='tower'?ROOF[ri(ROOF.length)]:'#fff'},o)));break;}}};
 BLOCKS.forEach((b,i)=>{
  if(b.park){things.push(mk('fountain',160,127));place(b,'tree',7);place(b,'bench',3);place(b,'lamp',3);return;}
  place(b,i%2?'shop':'tower',1);place(b,'house',2);place(b,'kiosk',i%3===0?1:0);place(b,'tree',3);place(b,'bench',2);place(b,'bin',2);place(b,'hydrant',1);place(b,'lamp',2);place(b,'cone',1);place(b,'bike',1);});
 // people stroll round the blocks, cars and a bus drive the roads and wrap at the edges
 const walker=()=>{const b=BLOCKS[ri(9)];return mk('person',b.x0+4+rnd(b.x1-b.x0-8),b.y0+4+rnd(b.y1-b.y0-8),{mv:'walk',b,col:['#ff4f6d','#4dabff','#ffcf3f','#3ddc84','#c86dff','#ff9838'][ri(6)],vx:rnd(.6)-.3,vy:rnd(.6)-.3});};
 const driver=(type)=>{const hz=Math.random()<.5,r=ri(2),dir=Math.random()<.5?1:-1,lane=dir>0?1:0;
  const o=hz?mk(type,rnd(W),RY[r][0]+4+lane*8,{mv:'drive',hz,dir}):mk(type,RX[r][0]+4+(1-lane)*8,TOP+rnd(H-TOP),{mv:'drive',hz,dir});o.col=type==='bus'?'#f2a516':CARC[ri(CARC.length)];o.a=hz?(dir>0?0:Math.PI):(dir>0?Math.PI/2:-Math.PI/2);o.sp=(type==='bus'?.45:.6+rnd(.5));return o;};
 for(let i=0;i<18;i++)things.push(walker());for(let i=0;i<7;i++)things.push(driver('car'));things.push(driver('bus'));
 const P=[0,1].map(i=>({i,x:i?250:70,y:i?200:56,area:49,r:7,sc:0,dead:0,safe:0,vx:0,vy:0,tx:null,tt:0,eat:0,spin:rnd(6)}));
 const grow=(h,a)=>{h.area=Math.min(32*32,h.area+a);};
 // CPU: every few frames pick the best-value thing it can eat (or the rival, if it is small enough), run from a bigger rival
 const think=h=>{const o=P[1-h.i];let best=-1,tx=h.x,ty=h.y;const skill=A._e&&A._e.state==='play'?A.ai:.85;
  for(const q of things){if(q.fall||q.s>h.r*.8)continue;const d=hyp(q.x-h.x,q.y-h.y),v=(q.s*q.s+1)/(d+25)*(1+rnd(1.2-skill));if(v>best){best=v;tx=q.x;ty=q.y;}}
  if(!o.dead&&h.r>o.r*1.25&&skill>.6){const d=hyp(o.x-h.x,o.y-h.y),v=o.area/(d+25)*.6;if(v>best){tx=o.x;ty=o.y;}}
  if(!o.dead&&o.r>h.r*1.2){const d=hyp(o.x-h.x,o.y-h.y);if(d<o.r+50){tx=h.x+(h.x-o.x)*3;ty=h.y+(h.y-o.y)*3;}}
  h.tx=cl(tx,8,W-8);h.ty=cl(ty,TOP+8,H-8);h.tt=8+ri(Math.round(24*(1.2-skill)));};
 const aiKeys=h=>{if(h.tt--<=0||h.tx===null)think(h);const dx=h.tx-h.x,dy=h.ty-h.y,m=2;return{l:dx<-m,r:dx>m,u:dy<-m,d:dy>m};};
 const move=(h,k)=>{const sp=1.65-h.r*.012;let mx=(k.r?1:0)-(k.l?1:0),my=(k.d?1:0)-(k.u?1:0);
  if(h.i===0&&A.mouse.t>0&&!demo(g)){const dx=A.mouse.x-h.x,dy=A.mouse.y-h.y,d=hyp(dx,dy);if(d>2){mx=dx/d;my=dy/d;}else mx=my=0;}
  const m=hyp(mx,my)||1;h.vx+=(mx/m*sp-h.vx)*.25;h.vy+=(my/m*sp-h.vy)*.25;h.x=cl(h.x+h.vx,0,W);h.y=cl(h.y+h.vy,TOP,H);};
 g.update=()=>{t++;
  if(A.cpu&&!demo(g))A.bot(aiKeys(P[1]));
  for(const h of P){h.r+=(Math.sqrt(h.area)-h.r)*.12;h.spin+=.05;if(h.eat>0)h.eat--;if(h.safe>0)h.safe--;
   if(h.dead>0){h.dead--;continue;}
   move(h,demo(g)?aiKeys(h):A.in(h.i));}
  // the bigger hole eats a much smaller rival that drifts over its middle
  for(const a of P){const b=P[1-a.i];if(a.dead||b.dead||b.safe>0||a.r<=b.r*1.22)continue;if(hyp(a.x-b.x,a.y-b.y)<a.r-b.r*.4){
   grow(a,b.area*.35);a.sc+=30+(b.r|0);a.eat=20;fx.ring(b.x,b.y,PC[b.i],b.r+10,20);if(!demo(g)){fx.pop(a.x,a.y-a.r-6,'GULP! +'+(30+(b.r|0)),'#ffcf3f');fx.flash(PC[a.i],6);}S('boom');
   b.area=Math.max(49,b.area*.5);b.r=Math.sqrt(b.area);b.dead=90;b.safe=210;b.x=a.x<160?250:70;b.y=a.y<130?205:50;}}
  for(const o of things){
   if(o.fall){const h=o.fall.h;o.fall.t++;o.x+=(h.x-o.x)*.18;o.y+=(h.y-o.y)*.18;o.a+=.15;
    if(o.fall.t>=16){o.gone=1;const v=Math.round(o.s*o.s*.5)+1;h.sc+=v;grow(h,o.s*o.s*.2);h.eat=8;if(o.s>=9&&!demo(g)){fx.pop(h.x,h.y-h.r-4,'+'+v,o.s>=15?'#ffcf3f':'#ffffff');A.shake=Math.min(5,o.s/4);}
     later.push({o,at:t+(o.mv?200:900)});}continue;}
   if(o.mv==='walk'){o.x+=o.vx;o.y+=o.vy;const b=o.b;if(o.x<b.x0+2||o.x>b.x1-2)o.vx*=-1;if(o.y<b.y0+2||o.y>b.y1-2)o.vy*=-1;if(t%90===o.seed%90){o.vx=rnd(.6)-.3;o.vy=rnd(.6)-.3;}
    // people run from a hole that is about to swallow them
    for(const h of P)if(!h.dead){const d=hyp(o.x-h.x,o.y-h.y);if(d<h.r+12&&d>0){o.x+=(o.x-h.x)/d*.35;o.y+=(o.y-h.y)/d*.35;}}
    o.x=cl(o.x,b.x0+1,b.x1-1);o.y=cl(o.y,b.y0+1,b.y1-1);}
   else if(o.mv==='drive'){if(o.hz){o.x+=o.dir*o.sp;if(o.x<-14)o.x=W+14;if(o.x>W+14)o.x=-14;}else{o.y+=o.dir*o.sp;if(o.y<TOP-14)o.y=H+14;if(o.y>H+14)o.y=TOP-14;}}
   o.wob=0;
   for(const h of P){if(h.dead)continue;const d=hyp(o.x-h.x,o.y-h.y);
    if(o.s<=h.r*.8&&d<h.r-o.s*.45){o.fall={h,t:0};if(o.s>=5)S(o.s>=11?'hit':'blip');break;}
    if(d<h.r+o.s*.3&&o.s>h.r*.8)o.wob=1;}}
  if(things.some(o=>o.gone)){for(let i=things.length-1;i>=0;i--)if(things[i].gone)things.splice(i,1);}
  // eaten things come back: people and traffic soon, buildings rebuilt after a while
  for(let i=later.length-1;i>=0;i--)if(later[i].at<=t){const {o}=later.splice(i,1)[0];
   if(o.mv==='walk')things.push(walker());else if(o.mv==='drive')things.push(driver(o.type));
   else if(!P.some(h=>hyp(h.x-o.hx,h.y-o.hy)<h.r+o.s)){o.x=o.hx;o.y=o.hy;o.fall=null;o.gone=0;o.a=0;o.pop=20;things.push(o);}else later.push({o,at:t+120});}
  g.score=P[0].sc;};
 g.timeUp=()=>tu(P[0].sc,P[1].sc);

 /* ---- scene ---- */
 const city=()=>X.cache('sinkhole_bg',()=>{const c=A.c;
  X.vg(0,TOP,W,H-TOP,['#5c9a4a','#4f8a40']);
  for(const b of BLOCKS){if(b.park){X.rr(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0,3,X.lg(0,b.y0,0,b.y1,['#6cc35a','#55a748']));
    for(let i=0;i<60;i++){c.fillStyle='rgba(255,255,255,.08)';c.fillRect(b.x0+hash(i,1)*(b.x1-b.x0),b.y0+hash(i,2)*(b.y1-b.y0),2,1);}
    // a pond and gravel paths
    X.ell(136,140,15,9,'#3b7fb0');X.ell(136,139,13,7,X.lg(0,132,0,146,['#5fb0e0','#2f6f9e']));c.fillStyle='rgba(255,255,255,.35)';c.fillRect(129,136,6,1);c.fillRect(138,142,4,1);
    c.fillStyle='#d9c79a';c.fillRect(b.x0,125,b.x1-b.x0,4);c.fillRect(158,b.y0,4,b.y1-b.y0);continue;}
   X.rr(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0,2,'#c9c4b8');c.fillStyle='rgba(0,0,0,.06)';for(let x=b.x0;x<b.x1;x+=6)c.fillRect(x,b.y0,1,b.y1-b.y0);for(let y=b.y0;y<b.y1;y+=6)c.fillRect(b.x0,y,b.x1-b.x0,1);
   X.rr(b.x0+3,b.y0+3,b.x1-b.x0-6,b.y1-b.y0-6,2,X.lg(0,b.y0,0,b.y1,['#a9a396','#9a9488']));}
  // roads: asphalt with grain, kerbs, dashed centre lines and zebra crossings at every junction
  for(const[y0,y1]of RY){X.vg(0,y0,W,y1-y0,['#3a3d46','#30333b']);c.fillStyle='#e6c84a';for(let x=0;x<W;x+=12)c.fillRect(x,(y0+y1)/2-.5,6,1);}
  for(const[x0,x1]of RX){X.hg(x0,TOP,x1-x0,H-TOP,['#3a3d46','#30333b']);c.fillStyle='#e6c84a';for(let y=TOP;y<H;y+=12)c.fillRect((x0+x1)/2-.5,y,1,6);}
  for(let i=0;i<500;i++){const x=hash(i,5)*W,y=TOP+hash(i,6)*(H-TOP);if(RY.some(r=>y>r[0]&&y<r[1])||RX.some(r=>x>r[0]&&x<r[1])){c.fillStyle='rgba(255,255,255,.05)';c.fillRect(x,y,1,1);}}
  for(const[x0,x1]of RX)for(const[y0,y1]of RY){X.vg(x0,y0,x1-x0,y1-y0,['#383b44','#33363e']);c.fillStyle='rgba(240,240,240,.75)';
   for(let k=0;k<4;k++){c.fillRect(x0+1+k*4,y0-6,2,5);c.fillRect(x0+1+k*4,y1+1,2,5);c.fillRect(x0-6,y0+1+k*4,5,2);c.fillRect(x1+1,y0+1+k*4,5,2);}}
  X.vignette(.25);});
 // a thing, painted at its own spot (falling things are drawn shrunk inside the hole's clip)
 const thing=(o,sc)=>{const c=A.c,s=o.s;c.save();c.translate(o.x+(o.wob?Math.sin(t*.9+o.id)*.6:0),o.y);if(sc!==1)c.scale(sc,sc);
  const sh=o.fall?0:Math.min(6,1+s*.25);
  switch(o.type){
   case 'person':X.disc(.6,1,1.2,'rgba(0,0,0,.25)');X.disc(0,0,1.5,o.col);X.disc(0,-.4,.8,'#f1c7a3');break;
   case 'cone':X.poly([[0,-2],[1.8,1.6],[-1.8,1.6]],'#ff7a1a');c.fillStyle='#fff';c.fillRect(-1,-.2,2,.6);break;
   case 'hydrant':X.disc(.6,.8,1.9,'rgba(0,0,0,.25)');X.orb(0,0,1.9,'#d8322b');break;
   case 'bin':X.disc(.8,1,2.3,'rgba(0,0,0,.25)');X.disc(0,0,2.3,'#2f6a43');X.disc(0,0,1.4,'#1d3f28');break;
   case 'lamp':X.disc(1.2,1.2,1.2,'rgba(0,0,0,.25)');X.disc(0,0,1.5,'#7b8290');if(lo())X.glow(0,0,7,'#fff1b0',.25);X.disc(0,0,.8,'#fff8d0');break;
   case 'bench':c.rotate(o.a);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-3.5+1,-1.5+1,7,3);c.fillStyle='#8a5a32';c.fillRect(-3.5,-1.5,7,3);c.fillStyle='#b07a48';c.fillRect(-3.5,-1.5,7,1);break;
   case 'bike':c.strokeStyle='#2b2f38';c.lineWidth=.7;c.beginPath();c.arc(-1.4,0,1.2,0,TAU);c.arc(1.4,0,1.2,0,TAU);c.stroke();c.fillStyle='#e8453c';c.fillRect(-1.4,-.4,2.8,.8);break;
   case 'tree':X.disc(sh,sh,5,'rgba(0,0,0,.28)');X.disc(0,0,5,X.rg(-1.6,-1.8,.5,0,0,5,['#7fdc5c','#3f9a3a','#25652a']));X.disc(-1.5,-1.5,1.6,'rgba(255,255,255,.18)');break;
   case 'fountain':X.disc(2,2,10,'rgba(0,0,0,.22)');X.disc(0,0,10,'#cfc8b8');X.disc(0,0,8.4,X.lg(0,-8,0,8,['#7fd0f5','#3d8fc8']));X.disc(0,0,2.6,'#e2dccd');
    if(lo())for(let k=0;k<3;k++){const r=2.6+((t*.12+k*2)%6);c.strokeStyle=`rgba(255,255,255,${.5-r/14})`;c.lineWidth=.6;c.beginPath();c.arc(0,0,r,0,TAU);c.stroke();}
    X.disc(0,-.6,1.2,'#ffffff');break;
   case 'car':case 'bus':{c.rotate(o.a);const w=o.w,h=o.h;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-w/2+1.5,-h/2+1.5,w,h);X.rr(-w/2,-h/2,w,h,1.8,X.lg(0,-h/2,0,h/2,[X.lt(o.col,1.35),o.col,X.lt(o.col,.7)]));
    if(o.type==='car'){c.fillStyle='#1d2433';c.fillRect(w/2-4.2,-h/2+1,2,h-2);c.fillRect(-w/2+1.2,-h/2+1.2,1.6,h-2.4);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-1.5,-h/2+1,3.4,h-2);}
    else{c.fillStyle='#1d2433';for(let k=-7;k<8;k+=3.2)c.fillRect(k,-h/2+.8,2.2,1.2),c.fillRect(k,h/2-2,2.2,1.2);c.fillStyle='#fff6';c.fillRect(-w/2+1,-1,w-2,2);}
    c.fillStyle='#fff6c0';c.fillRect(w/2-.8,-h/2+.6,.8,1.2);c.fillRect(w/2-.8,h/2-1.8,.8,1.2);c.fillStyle='#ff3b3b';c.fillRect(-w/2,-h/2+.6,.6,1.2);c.fillRect(-w/2,h/2-1.8,.6,1.2);break;}
   case 'kiosk':{const w=o.w,h=o.h;c.fillStyle='rgba(0,0,0,.28)';c.fillRect(-w/2+sh,-h/2+sh,w,h);for(let k=0;k<5;k++){c.fillStyle=k%2?'#f6f1e6':'#e8453c';c.fillRect(-w/2+k*w/5,-h/2,w/5+.2,h);}c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-w/2,h/2-2,w,2);break;}
   default:{// rooftops: a shadow that grows with height, parapet, roof units and a water tank on the tall ones
    const w=o.w,h=o.h;c.fillStyle='rgba(0,0,0,.3)';c.fillRect(-w/2+sh,-h/2+sh,w,h);X.block(-w/2,-h/2,w,h,o.col,1.5);
    X.rr(-w/2+2,-h/2+2,w-4,h-4,1,X.lg(0,-h/2,0,h/2,[X.lt(o.col,.92),X.lt(o.col,.78)]));
    if(o.type==='house'){c.fillStyle='rgba(0,0,0,.18)';c.fillRect(-w/2+2,-.5,w-4,1);X.block(w/4-2,-h/2+3,4,4,'#8a8f9a',1);}
    else{for(let k=0;k<(o.type==='tower'?4:2);k++)X.block(-w/2+4+k*6,-h/2+4,4,3,'#a7adb8',1);if(o.type==='tower'){X.disc(w/4,h/4,4,'#6b4a32');X.disc(w/4,h/4,3,'#8a603f');c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-w/2+3,h/2-6,w-6,1);
     if(lo()){const on=(t>>5)%2;X.disc(-w/2+3,-h/2+3,1.2,on?'#ff3b3b':'#5a1010');}}
     else{c.fillStyle='rgba(120,200,255,.5)';c.fillRect(-w/2+4,h/2-7,w-8,3);}}}}
  c.restore();};
 const hole=h=>{const c=A.c,r=h.r;
  if(h.dead){if(h.dead%10<5){c.strokeStyle=X.rgba(PC[h.i],.5);c.lineWidth=1;c.beginPath();c.arc(h.x,h.y,7,0,TAU);c.stroke();}return;}
  X.disc(h.x,h.y,r+2.4,'rgba(20,14,10,.45)');X.disc(h.x,h.y,r,X.rg(h.x,h.y+r*.15,0,h.x,h.y,r,['#000000','#05060c','#1a1d2c']));
  // the falling things, clipped to the hole so they vanish over its lip
  c.save();c.beginPath();c.arc(h.x,h.y,r,0,TAU);c.clip&&c.clip();
  for(const o of things)if(o.fall&&o.fall.h===h){const f=o.fall.t/16;c.globalAlpha=1-f*.7;thing(o,1-f*.85);}c.globalAlpha=1;
  if(lo())for(let k=0;k<3;k++){c.strokeStyle=X.rgba(PC[h.i],.18-k*.04);c.lineWidth=1;c.beginPath();c.arc(h.x,h.y,r*(.35+k*.2),h.spin+k*2,h.spin+k*2+2);c.stroke();}
  c.restore();
  // inner lip shading, then a glowing rim in the player's colour
  c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=2;c.beginPath();c.arc(h.x,h.y+.6,r-1,Math.PI*1.05,Math.PI*1.95);c.stroke();
  if(lo())X.glow(h.x,h.y,r+8,PC[h.i],h.eat>0?.45:.2);c.strokeStyle=PC[h.i];c.lineWidth=1.6+(h.eat>0?1:0);c.beginPath();c.arc(h.x,h.y,r,0,TAU);c.stroke();
  c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=.8;c.beginPath();c.arc(h.x,h.y,r+1.2,Math.PI*1.15,Math.PI*1.6);c.stroke();
  if(h.safe>0&&h.safe%12<8){c.strokeStyle='rgba(255,255,255,.7)';c.setLineDash&&c.setLineDash([3,3]);c.lineWidth=1;c.beginPath();c.arc(h.x,h.y,r+4,0,TAU);c.stroke();c.setLineDash&&c.setLineDash([]);}
  X.ot(A.nm(h.i),h.x,h.y-r-9,PC[h.i],1,'c');};
 g.draw=()=>{const c=A.c;city();
  for(const h of P)hole(h);
  const vis=things.filter(o=>!o.fall).sort((a,b)=>a.s-b.s);for(const o of vis){if(o.pop>0){o.pop--;c.globalAlpha=1-o.pop/20;}thing(o,1);c.globalAlpha=1;}
  fx.draw();X.bar();A.hud2(P[0].sc,P[1].sc);
  // size meters under the scores
  for(const h of P){const f=Math.min(1,(h.r-7)/25);X.meter(h.i?W-66:6,13,60,3,f,PC[h.i]);}};
 return g;}});

/* ================= RIDGE RUNNER ================= */
const FIN=11000,VH=110,VY=[18,130];
const BIOME=[{sky:['#5fb2ff','#a9dcff','#fff1c8'],far:'#8fb7d9',near:'#6c9a6e',top:'#5fc44a',dirt:['#7a5434','#4e3420'],name:'MEADOW'},
 {sky:['#3a2a6e','#c85a5a','#ffb36a'],far:'#a8566a',near:'#7a3f45',top:'#e8b866',dirt:['#b27a48','#6e4526'],name:'DUSK DUNES'},
 {sky:['#070b22','#1d2c5e','#4d6aa8'],far:'#2e3f6e',near:'#25335a',top:'#eef4ff',dirt:['#5a6478','#2e3444'],name:'FROST PASS'}];
const biomeAt=x=>BIOME[Math.min(2,Math.max(0,Math.floor(x/(FIN/3))))];

A.add({id:'ridgerunner',name:'RIDGE RUNNER',cat:'VERSUS',vs:1,time:150,warm:150,tags:'hill climb racing truck jeep physics flips split screen race hills',
 how:'RIGHT OR A IS GAS, LEFT OR B BRAKES. IN THE AIR THEY TILT YOU. FIRST TO THE FLAG WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0;
 // the track: one smooth height profile for both drivers, gentle at first and wilder further out
 const N=Math.ceil(FIN/8)+80,HT=new Float32Array(N),ph=[rnd(6),rnd(6),rnd(6),rnd(6)];
 for(let i=0;i<N;i++){const x=i*8,k=Math.min(1,x/2500)*.75+.25+Math.min(.5,x/FIN*.5);
  HT[i]=Math.sin(x*.0021+ph[0])*46*k+Math.sin(x*.0057+ph[1])*24*k+Math.sin(x*.013+ph[2])*9*k+Math.sin(x*.031+ph[3])*2.5*k-x*.004;}
 for(let i=0;i<40;i++)HT[i]=HT[40]*(i/40)+HT[0]*0*(1-i/40);
 const G=x=>{const f=Math.max(0,x)/8,i=Math.min(N-2,f|0),u=f-i;return 120+HT[i]+(HT[i+1]-HT[i])*u;};
 const slope=x=>(G(x+2)-G(x-2))/4;
 const coins=[];for(let x=300;x<FIN-100;x+=34+ri(30))if(hash(x,3)>.45)coins.push({x,y:G(x)-12,got:[0,0]});
 // a jeep: two wheels and two roof corners held together by stiff links (the wheel links are a touch springy)
 const SHAPE=[[-12,0],[12,0],[-8,-11],[9,-11]];
 const car=(i,x)=>{const y=G(x)-9;const p=SHAPE.map(([dx,dy])=>({x:x+dx,y:y+dy,px:x+dx,py:y+dy}));const L=[];
  for(let a=0;a<4;a++)for(let b=a+1;b<4;b++)L.push([a,b,hyp(SHAPE[a][0]-SHAPE[b][0],SHAPE[a][1]-SHAPE[b][1]),a<2&&b>=2?.55:1]);
  return{i,p,L,spin:[0,0],gnd:[0,0],crash:0,best:x,coins:0,flips:0,rot:0,lastA:0,cam:{x:x-90,y:y-60},dust:[],gas:0,fin:0,cp:x};};
 const P=[car(0,60),car(1,60)];
 const scr=(c,x,y)=>[x-c.cam.x,VY[c.i]+y-c.cam.y];
 const ang=c=>Math.atan2(c.p[1].y-c.p[0].y,c.p[1].x-c.p[0].x);
 const ctr=c=>({x:(c.p[0].x+c.p[1].x+c.p[2].x+c.p[3].x)/4,y:(c.p[0].y+c.p[1].y+c.p[2].y+c.p[3].y)/4});
 const reset=c=>{const x=Math.max(60,c.cp),n=car(c.i,x);c.p=n.p;c.spin=[0,0];c.crash=0;c.rot=0;};
 const rotate=(c,d)=>{const m=ctr(c),cs=Math.cos(d),sn=Math.sin(d);for(const q of c.p){const dx=q.x-m.x,dy=q.y-m.y;q.x=m.x+dx*cs-dy*sn;q.y=m.y+dx*sn+dy*cs;}};
 const SUB=3,GR=.16/(SUB*SUB);
 const step=(c,gas,brk)=>{
  if(c.crash>0){if(--c.crash===0)reset(c);return;}
  if(c.fin)gas=brk=0;
  const air=!c.gnd[0]&&!c.gnd[1];
  // in the air the pedals tilt the jeep: gas lifts the nose, brake drops it
  if(air)rotate(c,(brk-gas)*.0075);
  c.gnd=[0,0];
  for(let s=0;s<SUB;s++){
   for(const q of c.p){let vx=(q.x-q.px)*.999,vy=(q.y-q.py)*.999;const sp=hyp(vx,vy);if(sp>6/SUB){vx*=6/SUB/sp;vy*=6/SUB/sp;}q.px=q.x;q.py=q.y;q.x+=vx;q.y+=vy+GR;}
   for(let it=0;it<3;it++)for(const[a,b,len,k]of c.L){const A_=c.p[a],B_=c.p[b],dx=B_.x-A_.x,dy=B_.y-A_.y,d=hyp(dx,dy)||.01,f=(d-len)/d*.5*k;A_.x+=dx*f;A_.y+=dy*f;B_.x-=dx*f;B_.y-=dy*f;}
   for(let w=0;w<2;w++){const q=c.p[w],R=5,sl=slope(q.x),nl=Math.sqrt(1+sl*sl),nx=sl/nl,ny=-1/nl,d=(G(q.x)-q.y)/nl;
    if(d<R){q.x+=nx*(R-d);q.y+=ny*(R-d);c.gnd[w]=1;
     let vx=q.x-q.px,vy=q.y-q.py;const vn=vx*nx+vy*ny;if(vn<0){vx-=nx*vn*1.05;vy-=ny*vn*1.05;}
     const tx=1/nl,ty=sl/nl;let vt=vx*tx+vy*ty;const nvx=vx-tx*vt,nvy=vy-ty*vt;
     if(gas)vt+=.055/SUB*(vt<3.6/SUB?1:.2);if(brk)vt=vt>.05?vt*.94:vt-.03/SUB;if(!gas&&!brk)vt*=.997;
     vx=nvx+tx*vt;vy=nvy+ty*vt;q.px=q.x-vx;q.py=q.y-vy;c.spin[w]+=vt/R;}}
   // the roof touching the ground is a crash
   for(let w=2;w<4;w++){const q=c.p[w];if(G(q.x)-q.y<2.5){c.crash=70;S('boom');fx.ring(...scr(c,q.x,q.y),'#ffffff',18,18);for(let k=0;k<10;k++)c.dust.push({x:q.x,y:q.y,vx:rnd(3)-1.5,vy:-rnd(2),t:30,col:'#ffcf3f'});return;}}}
  // flips: count a full turn made in the air
  const a=ang(c);let da=a-c.lastA;if(da>Math.PI)da-=TAU;if(da<-Math.PI)da+=TAU;c.lastA=a;
  if(air){c.rot+=da;if(Math.abs(c.rot)>TAU*.95){c.flips++;c.coins+=5;c.rot=0;const m=ctr(c),[sx,sy]=scr(c,m.x,m.y-20);if(!demo(g))fx.pop(sx,sy,'FLIP! +5',PC[c.i]);S('score');}}else c.rot=0;
  const m=ctr(c);c.best=Math.max(c.best,m.x);if(!air&&Math.abs(a-Math.atan(slope(m.x)))<.4&&m.x>c.cp+300)c.cp=m.x-20;
  // dust off the back wheel, coins, and the flag
  if(c.gnd[0]&&gas&&lo()&&t%2===0){const q=c.p[0];c.dust.push({x:q.x-4,y:q.y+3,vx:-rnd(1.2),vy:-rnd(.8),t:22,col:biomeAt(q.x).top});}
  for(const o of coins)if(!o.got[c.i]&&Math.abs(o.x-m.x)<11&&Math.abs(o.y-m.y)<14){o.got[c.i]=1;c.coins++;if(c.i===0||!A.cpu)S('coin');}
  if(!c.fin&&m.x>=FIN){c.fin=1;fx.flash(PC[c.i],10);}
  for(const d of c.dust){d.x+=d.vx;d.y+=d.vy;d.vy+=.03;d.t--;}c.dust=c.dust.filter(d=>d.t>0);};
 // CPU: full gas, but ease off when the nose rears up, and in the air tilt to match the ground below
 const aiKeys=c=>{const skill=A._e&&A._e.state==='play'?A.ai:c.i?.8:.97,m=ctr(c),a=ang(c),ga=Math.atan(slope(m.x+10)),air=!c.gnd[0]&&!c.gnd[1];
  const err=(1-skill)*.5*Math.sin(t*.05+c.i*2),diff=a-ga+err;
  if(air)return diff<-.12?{l:1}:diff>.25?{r:1}:{};
  if(diff<-.55+(1-skill)*.25)return t%3?{}:{l:1};
  if(hash(t>>4,c.i+7)>.6+skill*.4)return{};
  return{r:1};};
 g.update=()=>{t++;
  if(A.cpu&&!demo(g))A.bot(aiKeys(P[1]));
  for(const c of P){const k=demo(g)?aiKeys(c):A.in(c.i);step(c,k.r||k.a?1:0,k.l||k.b?1:0);
   const m=ctr(c);c.cam.x+=(m.x-90-c.cam.x)*.2;c.cam.y+=(m.y-62-c.cam.y)*.12;}
  g.score=Math.floor(P[0].best/10)+P[0].coins*5;
  const done=P.filter(c=>c.fin);
  if(done.length&&!g.over){if(demo(g)){P.forEach((c,i)=>{const n=car(i,60);Object.assign(c,n);});return;}g.over=done.length===2?'PHOTO FINISH - DRAW':A.win(done[0].i);S('win');}};
 g.timeUp=()=>{const a=P[0].best,b=P[1].best;return Math.abs(a-b)<10?'TIME UP - DRAW':tu(a,b);};

 /* ---- scene: drawn once per half of the split screen ---- */
 const view=(c,y0)=>{const cx=c.cam.x,cy=c.cam.y,b=biomeAt(cx+160),cv=A.c;
  cv.save();cv.beginPath();cv.rect(0,y0,W,VH);cv.clip&&cv.clip();cv.translate(0,y0);
  X.vg(0,0,W,VH,b.sky);
  if(b===BIOME[2])for(let i=0;i<40;i++){const x=(hash(i,1)*W*3-cx*.05)%W;cv.fillStyle='rgba(255,255,255,'+(.3+hash(i,2)*.6)+')';cv.fillRect((x+W)%W,hash(i,3)*VH*.6,1,1);}
  if(b===BIOME[0])for(let i=0;i<5;i++){const x=((hash(i,4)*600-cx*.12)%420+420)%420-50,y=10+hash(i,5)*30;X.ell(x,y,16,5,'rgba(255,255,255,.75)');X.ell(x+8,y-3,10,5,'rgba(255,255,255,.85)');}
  if(b===BIOME[1]){X.glow(250,VH*.62,60,'#ffd27a',.45);X.disc(250,VH*.62,14,'#ffe2a0');}
  // two parallax ridges
  for(const[par,col,amp,base]of[[.25,b.far,22,70],[.5,b.near,18,86]]){const pts=[[0,VH]];for(let sx=0;sx<=W;sx+=8){const wx=sx+cx*par;pts.push([sx,base-cy*par*.3+Math.sin(wx*.011)*amp+Math.sin(wx*.027)*amp*.4-(cy-0)*0]);}pts.push([W,VH]);X.poly(pts,col);}
  // roadside props planted along the track: trees and bushes, cacti and rocks, pines and snowmen
  const p0=Math.floor(cx/46)*46;for(let wx=p0;wx<cx+W+46;wx+=46){const hv=hash(wx,9);if(hv<.35)continue;const sx=wx-cx+hash(wx,10)*20,gy=G(wx)-cy+2,bb=biomeAt(wx),k=BIOME.indexOf(bb),sz=.7+hash(wx,11)*.6;
   if(k===0){if(hv>.7){cv.fillStyle='#6b4a2c';cv.fillRect(sx-1.2*sz,gy-14*sz,2.4*sz,14*sz);X.disc(sx,gy-17*sz,8*sz,X.rg(sx-3,gy-20*sz,1,sx,gy-17*sz,8*sz,['#8fe070','#3f9a3a','#2a6a2a']));}else X.ell(sx,gy-3*sz,6*sz,4*sz,'#4caa44');}
   else if(k===1){if(hv>.68){cv.fillStyle='#3f8a52';X.rr(sx-2*sz,gy-16*sz,4*sz,16*sz,2*sz,'#4a9a5c');X.rr(sx-7*sz,gy-11*sz,3*sz,6*sz,1.5*sz,'#4a9a5c');X.rr(sx+4*sz,gy-13*sz,3*sz,7*sz,1.5*sz,'#4a9a5c');cv.fillRect(sx-7*sz,gy-6*sz,7*sz,2*sz);}else X.ell(sx,gy-2*sz,5*sz,3*sz,'#9a6a44');}
   else{if(hv>.6){X.poly([[sx,gy-22*sz],[sx+8*sz,gy-2],[sx-8*sz,gy-2]],'#1f4a46');X.poly([[sx,gy-24*sz],[sx+5*sz,gy-12*sz],[sx-5*sz,gy-12*sz]],'#e8f2ff');}else{X.disc(sx,gy-4,4,'#f4f8ff');X.disc(sx,gy-10,3,'#ffffff');cv.fillStyle='#ff7a1a';cv.fillRect(sx,gy-10.5,3,1);}}}
  // the ground itself: dirt with stones anchored to the world, then a grass, sand or snow top
  const pts=[[0,VH+2]];for(let sx=-4;sx<=W+4;sx+=4)pts.push([sx,G(cx+sx)-cy]);pts.push([W,VH+2]);X.poly(pts,X.lg(0,40,0,VH,b.dirt));
  const s0=Math.floor(cx/18)*18;for(let wx=s0;wx<cx+W+18;wx+=18){const gy=G(wx)-cy;for(let k=0;k<2;k++){const yy=gy+8+hash(wx,k)*30;if(yy<VH)X.ell(wx-cx+hash(wx,k+5)*10,yy,2+hash(wx,k+7)*2.5,1.4,'rgba(0,0,0,.18)');}}
  cv.strokeStyle=b.top;cv.lineWidth=4;cv.beginPath();for(let sx=-4;sx<=W+4;sx+=4){const y=G(cx+sx)-cy+1.5;sx<=-4?cv.moveTo(sx,y):cv.lineTo(sx,y);}cv.stroke();
  cv.strokeStyle='rgba(255,255,255,.3)';cv.lineWidth=1;cv.beginPath();for(let sx=-4;sx<=W+4;sx+=4){const y=G(cx+sx)-cy;sx<=-4?cv.moveTo(sx,y):cv.lineTo(sx,y);}cv.stroke();
  // distance posts every 100 m, the finish arch, coins
  for(let wx=Math.ceil(cx/1000)*1000;wx<cx+W+40;wx+=1000){if(wx<=0||wx>=FIN)continue;const sx=wx-cx,gy=G(wx)-cy;cv.fillStyle='#6b4a2c';cv.fillRect(sx-1,gy-20,2,20);X.rr(sx-12,gy-28,24,10,2,'#f6f1e6');A.text((wx/10)+'M',sx,gy-26,'#2a2030',1,'c');}
  {const sx=FIN-cx,gy=G(FIN)-cy;if(sx>-30&&sx<W+30){cv.fillStyle='#ddd';cv.fillRect(sx-22,gy-44,3,44);cv.fillRect(sx+19,gy-44,3,44);for(let k=0;k<10;k++)for(let j=0;j<2;j++){cv.fillStyle=(k+j)%2?'#111':'#fff';cv.fillRect(sx-22+k*4.4,gy-46+j*4,4.4,4);}A.text('FINISH',sx,gy-56,'#ffcf3f',1,'c');}}
  for(const o of coins){const sx=o.x-cx;if(sx<-6||sx>W+6||o.got[c.i])continue;const w=Math.abs(Math.sin(t*.08+o.x))*3+.6;X.ell(sx,o.y-cy,w,3.4,X.lg(0,o.y-cy-3,0,o.y-cy+3,['#fff3a0','#ffcf3f','#c98a10']));}
  for(const q of P)for(const d of q.dust){cv.globalAlpha=d.t/30;X.disc(d.x-cx,d.y-cy,1.4+(22-d.t)*.08,d.col);}cv.globalAlpha=1;
  // the rival as a ghost, then this player's jeep
  for(const q of[P[1-c.i],c]){cv.globalAlpha=q===c?1:.45;jeep(q,cx,cy);}cv.globalAlpha=1;
  // labels
  X.panel(4,4,104,13,PC[c.i]);A.text(A.nm(c.i)+' '+Math.floor(Math.min(FIN,c.best)/10)+'M',8,7,PC[c.i],1);X.disc(84,10,2.6,'#ffcf3f');A.text(''+c.coins,104,7,'#ffcf3f',1,'r');
  A.text(b.name,W-6,7,'rgba(255,255,255,.7)',1,'r');
  if(c.crash>0)X.ot('CRASH!',160,40,'#ff4f6d',2,'c');if(c.fin)X.ot('FINISHED!',160,40,'#ffcf3f',2,'c');
  cv.restore();};
 const jeep=(c,cx,cy)=>{const cv=A.c,m=ctr(c),a=ang(c),col=PC[c.i];
  if(c.crash>0&&c.crash%8<4)return;
  // suspension struts, then the body in its own frame
  for(let w=0;w<2;w++){const q=c.p[w];cv.strokeStyle='#3a3f4a';cv.lineWidth=1.6;cv.beginPath();cv.moveTo(q.x-cx,q.y-cy);cv.lineTo(m.x-cx+(w?7:-7)*Math.cos(a),m.y-cy+(w?7:-7)*Math.sin(a));cv.stroke();}
  cv.save();cv.translate(m.x-cx,m.y-cy);cv.rotate(a);
  X.rr(-15,-4,30,7,2,X.lg(0,-4,0,3,[X.lt(col,1.3),col,X.lt(col,.6)]));cv.fillStyle='rgba(0,0,0,.25)';cv.fillRect(-15,1,30,2);
  X.rr(-7,-11,11,7,1.5,X.lt(col,.85));cv.fillStyle='#bfe8ff';cv.fillRect(-1,-10,4,5);cv.fillStyle='rgba(255,255,255,.6)';cv.fillRect(0,-10,1,5);
  cv.strokeStyle='#2b2f38';cv.lineWidth=1;cv.beginPath();cv.moveTo(-8,-4);cv.lineTo(-7,-13);cv.lineTo(4,-13);cv.stroke();
  X.disc(-3,-12,2.6,'#f1c7a3');X.disc(-3,-13,2.8,X.lt(col,1.2));cv.fillStyle='#1d2433';cv.fillRect(-2,-13,2.4,1.4);
  cv.fillStyle='#fff6c0';cv.fillRect(13,-3,2,2);cv.fillStyle='#ff3b3b';cv.fillRect(-15,-3,1.2,2);
  if(c.gnd[0]&&lo()&&t%6<3){X.disc(-17,-1,1.3,'rgba(200,200,210,.6)');}
  cv.restore();
  for(let w=0;w<2;w++){const q=c.p[w],x=q.x-cx,y=q.y-cy;X.disc(x,y,5,'#1b1d24');X.disc(x,y,3.6,'#2c2f39');cv.fillStyle='#3b3f4a';for(let k=0;k<8;k++){const aa=c.spin[w]+k*TAU/8;cv.fillRect(x+Math.cos(aa)*4.4-.6,y+Math.sin(aa)*4.4-.6,1.2,1.2);}
   X.disc(x,y,2.2,'#c7ccd6');cv.strokeStyle='#7b8290';cv.lineWidth=.7;cv.beginPath();for(let k=0;k<3;k++){const aa=c.spin[w]+k*TAU/3;cv.moveTo(x,y);cv.lineTo(x+Math.cos(aa)*2.2,y+Math.sin(aa)*2.2);}cv.stroke();}};
 g.draw=()=>{const cv=A.c;cv.fillStyle='#0c0f17';cv.fillRect(0,0,W,H);
  view(P[0],VY[0]);view(P[1],VY[1]);
  // the race strip between the halves
  X.vg(0,128,W,2,['#1a1d29','#0c0f17']);const bx=110,bw=100;cv.fillStyle='rgba(255,255,255,.2)';cv.fillRect(bx,128.5,bw,1);
  for(const c of P){const f=Math.min(1,c.best/FIN);X.disc(bx+bw*f,129,2.2,PC[c.i]);}
  fx.draw();X.bar('','',null);A.hud2(Math.floor(Math.min(FIN,P[0].best)/10)+'M',Math.floor(Math.min(FIN,P[1].best)/10)+'M');};
 return g;}});
})();
