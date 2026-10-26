/* PIXEL ARCADE - rush pack: HEAT RUN (two getaway drivers loose in a city at night, grabbing cash bags while the
   police close in) and FLOPPY HOOPS (one-button wobbly basketball, two players a side, new rules every basket),
   both VS CPU with difficulty or 2 players */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const TAU=Math.PI*2,hyp=Math.hypot;
const PC=['#2fd6c3','#ff4f9a'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const demo=g=>!!(g.auto||A._e&&A._e.state==='title');
const skill=()=>A._e&&A._e.state==='play'?A.ai:.85;
const adf=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;};
const canvasOK=()=>typeof document!=='undefined'&&!!document.createElement;
const money=v=>String(Math.max(0,Math.round(v))).replace(/\B(?=(\d{3})+(?!\d))/g,',');

/* ================= HEAT RUN ================= */
// the city is a 25x17 grid of 40 px cells: every fourth row and column is a road, the 3x3 cells between are blocks
const CS=40,NC=25,NR=17,WW=NC*CS,WH=NR*CS,GS=2,CR=7;
const isRoad=(cx,cy)=>cx>=0&&cy>=0&&cx<NC&&cy<NR&&(cx%4===0||cy%4===0);
const DIRS=[[1,0],[-1,0],[0,1],[0,-1]];
// the nearest road cell to a point: snap one axis to the closest multiple of four
const roadCell=(x,y)=>{const cx=cl(Math.floor(x/CS),0,NC-1),cy=cl(Math.floor(y/CS),0,NR-1);if(isRoad(cx,cy))return[cx,cy];
 const sx=cl(Math.round(cx/4)*4,0,NC-1),sy=cl(Math.round(cy/4)*4,0,NR-1);
 return hyp(sx*CS+20-x,0)<hyp(0,sy*CS+20-y)?[sx,cy]:[cx,sy];};
const ci=(x,y)=>{const r=roadCell(x,y);return r[1]*NC+r[0];};
// breadth-first distances over the road grid from one point: cops and CPU drivers walk them downhill
const bfs=(x,y)=>{const d=new Int16Array(NC*NR).fill(-1),[sx,sy]=roadCell(x,y),q=[sx+sy*NC];d[q[0]]=0;
 for(let h=0;h<q.length;h++){const i=q[h],cx=i%NC,cy=(i/NC)|0;for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy;if(!isRoad(nx,ny))continue;const j=nx+ny*NC;if(d[j]<0){d[j]=d[i]+1;q.push(j);}}}return d;};
const nextPt=(d,x,y)=>{if(!d)return null;let[cx,cy]=roadCell(x,y);
 const step=(cx,cy)=>{let best=null,bv=d[cy*NC+cx];if(bv<0)return null;for(const[dx,dy]of DIRS){const nx=cx+dx,ny=cy+dy;if(!isRoad(nx,ny))continue;const v=d[ny*NC+nx];if(v>=0&&v<bv){bv=v;best=[nx,ny];}}return best;};
 const a=step(cx,cy);if(!a)return null;const b=step(a[0],a[1]);
 // on a straight run aim two cells ahead so the car doesn't weave
 if(b&&b[0]-a[0]===a[0]-cx&&b[1]-a[1]===a[1]-cy)return[b[0]*CS+20,b[1]*CS+20];return[a[0]*CS+20,a[1]*CS+20];};
const BCOL=['#3a3f52','#463f58','#384a52','#4a4448','#33384a','#4a4a3c'];
const NEON=['#ff4f9a','#5ae8ff','#ffcf3f','#7dff6a','#b46aff'];

A.add({id:'heatrun',name:'HEAT RUN',cat:'VERSUS',vs:1,time:150,warm:160,tags:'escape road police chase getaway gta grand theft car driving cops city heist cash drift 2 player versus',
 how:'UP GAS, DOWN BRAKE, LEFT/RIGHT STEER, A NITRO, B DRIFT. GRAB CASH, DODGE THE COPS.',make(){
 const g={over:null,score:0},wfx=X.fx(),sfx=X.fx();let t=0;
 /* ---- the city ---- */
 const B=[],TR=[],parked=[],blocks=[],lamps=[];let bid=0;
 const bld=(x,y,w,h)=>({x,y,w,h,id:bid++,ht:26+ri(48),col:BCOL[ri(BCOL.length)],sign:Math.random()<.35?NEON[ri(NEON.length)]:null,signF:ri(4),pad:w>90&&h>90&&Math.random()<.35,ac:[0,1,2].map(()=>[6+rnd(w-16),6+rnd(h-16)])});
 for(let by=0;by<4;by++)for(let bx=0;bx<6;bx++){const x0=(bx*4+1)*CS,y0=(by*4+1)*CS,r=Math.random(),k=r<.32?'tower':r<.62?'split':r<.78?'park':r<.91?'lot':'station',bl={x0,y0,k,v:Math.random()<.5};blocks.push(bl);
  if(k==='tower')B.push(bld(x0+8,y0+8,104,104));
  else if(k==='split'){if(bl.v){B.push(bld(x0+8,y0+8,44,104));B.push(bld(x0+68,y0+8,44,104));}else{B.push(bld(x0+8,y0+8,104,44));B.push(bld(x0+8,y0+68,104,44));}}
  else if(k==='park'){TR.push({x:x0+60,y:y0+60,r:12,fount:1});for(const[tx,ty]of[[26,26],[94,26],[26,94],[94,94],[60,22],[22,60],[98,62]])if(Math.random()<.75)TR.push({x:x0+tx+rnd(8)-4,y:y0+ty+rnd(8)-4,r:7+rnd(3),hue:ri(3)});}
  else if(k==='lot'){for(let i=0;i<6;i++)for(const row of[0,1])if(Math.random()<.45)parked.push({x:x0+14+i*16,y:y0+(row?78:22),w:9,h:16,col:BCOL[ri(6)].replace('#3','#6'),car:['#c84a4a','#4a7ac8','#d8d8d8','#3a3a3a','#c8a83a','#4ac87a'][ri(6)]});}
  else B.push(Object.assign(bld(x0+70,y0+12,40,30),{ht:16,sign:'#ffcf3f',shop:1}));
  lamps.push({x:x0+4,y:y0+4},{x:x0+116,y:y0+116});}
 const solids=B.concat(parked);
 // a point inside any building (used for sight lines)
 const inB=(x,y)=>{for(const b of solids)if(x>b.x-2&&x<b.x+b.w+2&&y>b.y-2&&y<b.y+b.h+2)return true;return false;};
 const los=(x0,y0,x1,y1)=>{const d=hyp(x1-x0,y1-y0),n=Math.ceil(d/9);for(let i=1;i<n;i++){const f=i/n;if(inB(x0+(x1-x0)*f,y0+(y1-y0)*f))return false;}return true;};
 const roadSpot=()=>{for(;;){const cx=ri(NC),cy=ri(NR);if(isRoad(cx,cy))return[cx*CS+20,cy*CS+20,cx,cy];}};
 /* ---- painted ground: drawn once into a big offscreen canvas, skid marks are added to it as you drive ---- */
 const paintGround=cheap=>{const c=A.c;c.fillStyle='#1d1f27';c.fillRect(0,0,WW,WH);
  if(!cheap)for(let i=0;i<3200;i++){c.fillStyle=i%2?'rgba(255,255,255,.035)':'rgba(0,0,0,.2)';c.fillRect(rnd(WW),rnd(WH),1+rnd(2),1);}
  for(const bl of blocks){const{x0,y0,k}=bl;c.fillStyle='#3c3f4b';c.fillRect(x0,y0,120,120);c.fillStyle='#5c6070';c.fillRect(x0,y0,120,1.2);c.fillRect(x0,y0,1.2,120);c.fillStyle='#22242c';c.fillRect(x0,y0+118.8,120,1.2);c.fillRect(x0+118.8,y0,1.2,120);
   if(!cheap){c.fillStyle='rgba(0,0,0,.16)';for(let i=8;i<120;i+=8){c.fillRect(x0+i,y0,.6,8);c.fillRect(x0+i,y0+112,.6,8);c.fillRect(x0,y0+i,8,.6);c.fillRect(x0+112,y0+i,8,.6);}}
   if(k==='park'){c.fillStyle=X.lg(x0,y0,x0+120,y0+120,['#2a4a26','#1e3a1e','#2a4626']);c.fillRect(x0+7,y0+7,106,106);if(!cheap){c.fillStyle='rgba(255,255,255,.03)';for(let i=0;i<106;i+=12)c.fillRect(x0+7+i,y0+7,6,106);c.fillStyle='rgba(120,200,90,.08)';for(let i=0;i<160;i++)c.fillRect(x0+8+rnd(104),y0+8+rnd(104),1,1.5);}
    c.fillStyle='#6a6050';c.fillRect(x0+56,y0+7,8,106);c.fillRect(x0+7,y0+56,106,8);X.disc(x0+60,y0+60,18,'#6a6050');
    for(const[bx2,by2,v]of[[30,52,0],[86,66,0],[52,30,1],[66,86,1]]){c.fillStyle='#5a3a24';v?c.fillRect(x0+bx2,y0+by2,2,8):c.fillRect(x0+bx2,y0+by2,8,2);}}
   else if(k==='lot'){c.fillStyle='#262830';c.fillRect(x0+7,y0+7,106,106);c.fillStyle='rgba(240,240,240,.45)';for(let i=0;i<=6;i++){c.fillRect(x0+12+i*16,y0+16,1,22);c.fillRect(x0+12+i*16,y0+82,1,22);}c.fillStyle='rgba(255,207,63,.5)';c.fillRect(x0+10,y0+59,100,1);
    if(!cheap)for(let i=0;i<8;i++)X.ell(x0+14+rnd(92),y0+14+rnd(92),3+rnd(4),2+rnd(2),'rgba(0,0,0,.25)');}
   else if(k==='station'){c.fillStyle='#41444e';c.fillRect(x0+7,y0+7,106,106);for(let i=0;i<2;i++){X.rr(x0+26+i*30,y0+66,8,14,1.5,'#5a5e6c');X.rr(x0+28+i*30,y0+69,4,8,1,'#c84a3a');}
    if(!cheap)for(let i=0;i<5;i++)X.ell(x0+20+rnd(70),y0+56+rnd(40),2+rnd(4),1+rnd(2),'rgba(0,0,0,.3)');}
   else if(k==='split'){c.fillStyle='#24262e';if(bl.v)c.fillRect(x0+52,y0,16,120);else c.fillRect(x0,y0+52,120,16);
    const dx=bl.v?x0+55:x0+20,dy=bl.v?y0+20:y0+55;X.rr(dx,dy,bl.v?10:14,bl.v?14:10,1,'#2e5a3a');X.rr(bl.v?dx:dx+70,bl.v?dy+70:dy,bl.v?10:14,bl.v?14:10,1,'#5a4a2e');}}
  // lane markings, crosswalks and manholes
  for(let r=0;r<NR;r+=4){const y=r*CS+20;for(let x=0;x<WW;x+=16){const cx=Math.floor((x+4)/CS);if(cx%4===0)continue;c.fillStyle='rgba(222,184,72,.75)';c.fillRect(x,y-.7,8,1.4);}
   c.fillStyle='rgba(255,255,255,.12)';for(let x=0;x<WW;x+=CS){if(Math.floor(x/CS)%4===0)continue;c.fillRect(x,r*CS+3,CS,.7);c.fillRect(x,r*CS+36.3,CS,.7);}}
  for(let q=0;q<NC;q+=4){const x=q*CS+20;for(let y=0;y<WH;y+=16){const cy=Math.floor((y+4)/CS);if(cy%4===0)continue;c.fillStyle='rgba(222,184,72,.75)';c.fillRect(x-.7,y,1.4,8);}
   c.fillStyle='rgba(255,255,255,.12)';for(let y=0;y<WH;y+=CS){if(Math.floor(y/CS)%4===0)continue;c.fillRect(q*CS+3,y,.7,CS);c.fillRect(q*CS+36.3,y,.7,CS);}}
  c.fillStyle='rgba(235,235,235,.42)';
  for(let iy=0;iy<NR;iy+=4)for(let ix=0;ix<NC;ix+=4){const x=ix*CS,y=iy*CS;
   for(let s=4;s<37;s+=4){if(ix>0)c.fillRect(x-7,y+s,6,2);if(ix<NC-1)c.fillRect(x+CS+1,y+s,6,2);if(iy>0)c.fillRect(x+s,y-7,2,6);if(iy<NR-1)c.fillRect(x+s,y+CS+1,2,6);}}
  if(!cheap){for(let i=0;i<26;i++){const[x,y]=roadSpot();X.disc(x+rnd(24)-12,y+rnd(24)-12,3.2,'#2a2a30');}
   for(let i=0;i<18;i++){const[x,y]=roadSpot();X.ell(x+rnd(30)-15,y+rnd(30)-15,6+rnd(10),3+rnd(4),'rgba(70,100,150,.16)');}}
  for(const p of parked)carSprite(p.x+p.w/2,p.y+p.h/2,p.h>p.w?(p.y%80<40?Math.PI/2:-Math.PI/2):0,p.car,0);
  // the city limits
  c.fillStyle='#8a2a2a';c.fillRect(0,0,WW,2);c.fillRect(0,WH-2,WW,2);c.fillRect(0,0,2,WH);c.fillRect(WW-2,0,2,WH);};
 let GC=null;
 if(canvasOK()){try{const cv=document.createElement('canvas');cv.width=WW*GS;cv.height=WH*GS;const x=cv.getContext('2d');if(x&&x.scale){x.scale(GS,GS);const sv=A.c;A.c=x;try{paintGround(false);}finally{A.c=sv;}GC={cv,x};}}catch(e){GC=null;}}
 /* ---- cars ---- */
 const mk=(x,y,a,o)=>Object.assign({x,y,a,vx:0,vy:0,hp:100,sp:0,slip:0,stuck:0,rev:0,flash:0,wl:null,smoke:0},o);
 const P=[0,1].map(i=>mk(i?WW-180:180,i?WH-180:180,i?Math.PI:0,{i,pl:1,cash:0,heat:0,bust:0,dead:0,inv:90,nitro:100,nOn:0,top:3.15,acc:.085,turn:.062,col:PC[i],think:0,goal:null,nb:0,why:'',pk:{}}));
 {const s0=roadCell(P[0].x,P[0].y),s1=roadCell(P[1].x,P[1].y);P[0].x=s0[0]*CS+20;P[0].y=s0[1]*CS+20;P[1].x=s1[0]*CS+20;P[1].y=s1[1]*CS+20;}
 const cops=[],bags=[],picks=[],wrecks=[],blasts=[],F=[null,null];let heli=null,spawnT=60;
 const sp=(x,y)=>{const sx=(x-cam.x)*cam.z+W/2,sy=(y-cam.y)*cam.z+H/2;return[sx,sy];};
 const pop=(x,y,txt,col)=>{if(demo(g))return;const[sx,sy]=sp(x,y),hw=txt.length*2+3;sfx.pop(cl(sx,hw,W-hw),cl(sy-14,48,H-14),txt,col);};
 const boom=(x,y,big)=>{blasts.push({x,y,t:big?40:26,m:big?40:26,r:big?46:30});wfx.ring(x,y,'#ffcf7a',big?40:26,18);wfx.spark(x,y,'#ffb34a',big?26:14,3.4);wfx.debris(x,y,'#3a3a44',big?14:8,2.6);wfx.debris(x,y,'#ff7a2a',6,2);if(!demo(g)){S('boom');A.shake=Math.max(A.shake||0,big?7:4);}};
 const addBag=(v,gold)=>{let x,y;for(let n=0;n<40;n++){[x,y]=roadSpot();if(P.every(p=>hyp(p.x-x,p.y-y)>170)&&bags.every(b=>hyp(b.x-x,b.y-y)>120))break;}bags.push({x:x+rnd(16)-8,y:y+rnd(16)-8,v,gold,ph:rnd(TAU),F:bfs(x,y)});};
 for(let i=0;i<4;i++)addBag(100,0);
 const stars=p=>Math.min(5,1+Math.floor(p.heat));
 /* driving model: velocity split into along-the-nose and sideways parts; sideways grip drops when you drift */
 const drive=(c,k)=>{let ca=Math.cos(c.a),sa=Math.sin(c.a);let f=c.vx*ca+c.vy*sa,l=-c.vx*sa+c.vy*ca;
  const nit=!!(k.nit&&c.pl&&c.nitro>0);if(c.pl){if(nit)c.nitro=Math.max(0,c.nitro-.85);else c.nitro=Math.min(100,c.nitro+.075);}c.nOn=nit;
  const top=c.top*(nit?1.42:1)*(c.hp<30?.86:1);
  if(k.thr){if(f<top)f+=c.acc*(nit?1.9:1);}else if(k.brk)f=f>.3?f-.13:Math.max(f-.05,-1.5);else f*=.985;
  if(f>top)f+=(top-f)*.06;
  c.a+=(k.st||0)*c.turn*cl(Math.abs(f)/2,0,1)*(f>=0?1:-1)*(k.hb?1.45:1);
  l*=k.hb?.965:.86;if(k.hb)f*=.992;
  ca=Math.cos(c.a);sa=Math.sin(c.a);c.vx=ca*f-sa*l;c.vy=sa*f+ca*l;c.x+=c.vx;c.y+=c.vy;c.sp=f;c.slip=Math.abs(l);c.brk=!!k.brk;
  // tyre marks go straight onto the painted ground
  const wl=[-1,1].map(s=>[c.x-ca*6-sa*s*3.6,c.y-sa*6+ca*s*3.6]);
  if(GC&&c.wl&&(c.slip>1.05||k.brk&&f>1.6)){const x=GC.x;x.strokeStyle='rgba(6,6,8,'+Math.min(.42,.16+c.slip*.12).toFixed(2)+')';x.lineWidth=1.5;x.beginPath();for(let s=0;s<2;s++){x.moveTo(c.wl[s][0],c.wl[s][1]);x.lineTo(wl[s][0],wl[s][1]);}x.stroke();
   if(lo()&&t%3===0)wfx.spark(wl[0][0],wl[0][1],'rgba(200,200,210,.5)',1,.6);}
  c.wl=wl;};
 const hurt=(c,d)=>{if(c.pl&&(c.inv>0||c.dead))return;c.hp-=d;c.flash=6;};
 const bump=(c,imp,x,y)=>{if(imp<1.25)return;hurt(c,(imp-1.05)*(c.pl?5.5:10));wfx.spark(x,y,'#ffd28a',Math.min(10,2+imp*2|0),1.8);if(imp>2.2&&!demo(g)){S('hit');if(c.pl)A.shake=Math.max(A.shake||0,3);}};
 const collide=c=>{
  for(const b of solids){const px=cl(c.x,b.x,b.x+b.w),py=cl(c.y,b.y,b.y+b.h);let dx=c.x-px,dy=c.y-py,d=hyp(dx,dy);if(d>=CR)continue;
   if(d<.01){const L=c.x-b.x,R_=b.x+b.w-c.x,T=c.y-b.y,Bo=b.y+b.h-c.y,m=Math.min(L,R_,T,Bo);dx=m===L?-1:m===R_?1:0;dy=m===T?-1:m===Bo?1:0;d=1;c.x=m===L?b.x:m===R_?b.x+b.w:c.x;c.y=m===T?b.y:m===Bo?b.y+b.h:c.y;}
   const nx=dx/d,ny=dy/d;c.x=px+nx*CR;c.y=py+ny*CR;if(d<.01){c.x+=nx*CR;c.y+=ny*CR;}const vn=c.vx*nx+c.vy*ny;if(vn<0){c.vx-=1.35*vn*nx;c.vy-=1.35*vn*ny;c.vx*=.82;c.vy*=.82;bump(c,-vn,px,py);}}
  for(const o of TR.concat(wrecks)){const r=(o.r||7)+CR-2,dx=c.x-o.x,dy=c.y-o.y,d=hyp(dx,dy);if(d>=r||d<.01)continue;const nx=dx/d,ny=dy/d;c.x=o.x+nx*r;c.y=o.y+ny*r;const vn=c.vx*nx+c.vy*ny;if(vn<0){c.vx-=1.4*vn*nx;c.vy-=1.4*vn*ny;c.vx*=.8;c.vy*=.8;bump(c,-vn,c.x-nx*CR,c.y-ny*CR);}}
  if(c.x<CR+2){c.x=CR+2;c.vx=Math.abs(c.vx)*.5;}if(c.x>WW-CR-2){c.x=WW-CR-2;c.vx=-Math.abs(c.vx)*.5;}if(c.y<CR+2){c.y=CR+2;c.vy=Math.abs(c.vy)*.5;}if(c.y>WH-CR-2){c.y=WH-CR-2;c.vy=-Math.abs(c.vy)*.5;}};
 // aim at a point; back out after being stuck against something
 const steerTo=(c,tx,ty)=>{const des=Math.atan2(ty-c.y,tx-c.x),df=adf(des,c.a),v=hyp(c.vx,c.vy);
  if(v<.35&&!c.rev){if(++c.stuck>34){c.rev=26+ri(10);c.stuck=0;}}else if(v>.8)c.stuck=0;
  if(c.rev>0){c.rev--;return{thr:0,brk:1,st:-(Math.sign(df)||1),hb:0};}
  return{thr:Math.abs(df)<2.4||v<1?1:0,st:cl(df*2.6,-1,1),brk:Math.abs(df)>1.35&&v>2.1,hb:Math.abs(df)>.75&&v>1.9};};
 /* ---- the getaway drivers' brains (CPU, and both cars in the demo) ---- */
 const brain=c=>{const o=P[1-c.i],sk=skill();
  if(--c.think<=0){c.think=10+ri(6);let best=null,bv=1e9;const me=ci(c.x,c.y),them=ci(o.x,o.y);
   for(const b of bags){const d=b.F[me];if(d<0)continue;let v=d*CS-hyp(b.x-c.x,b.y-c.y)*.2-(b.v-100)*.7;if(!o.dead&&b.F[them]>=0&&b.F[them]<d-1)v+=150*sk;if(v<bv){bv=v;best=b;}}
   if(c.hp<45)for(const p of picks)if(p.k==='fix'){const d=hyp(p.x-c.x,p.y-c.y);if(d<260){best=p;p.F=p.F||bfs(p.x,p.y);}}
   c.goal=best;}
  const b=c.goal;let tx=c.x+Math.cos(c.a)*40,ty=c.y+Math.sin(c.a)*40;
  if(b){const d=hyp(b.x-c.x,b.y-c.y);if(d<90&&los(c.x,c.y,b.x,b.y)){tx=b.x;ty=b.y;}else{const n=nextPt(b.F,c.x,c.y);if(n){tx=n[0];ty=n[1];}else{tx=b.x;ty=b.y;}}}
  const k=steerTo(c,tx,ty);
  // swerve round a cop in front, and burn nitro when one is on your tail
  for(const p of cops){const dx=p.x-c.x,dy=p.y-c.y,d=hyp(dx,dy);if(d>60)continue;const rel=adf(Math.atan2(dy,dx),c.a);
   if(Math.abs(rel)<.6&&d<46&&Math.random()<sk*.8)k.st=cl(k.st-Math.sign(rel||1)*.9,-1,1);
   if(Math.abs(rel)>2.2&&d<40&&c.nitro>25&&Math.random()<sk*.3)c.nb=24;}
  if(!c.rev&&Math.abs(k.st)<.2&&c.nitro>60&&hyp(c.vx,c.vy)>2&&Math.random()<.01+sk*.03)c.nb=26;
  if(c.nb>0){c.nb--;k.nit=1;}
  if(Math.random()>.3+sk*.7)k.st*=.4;
  return k;};
 const pad=k=>({thr:k.u,brk:k.d,st:(k.r?1:0)-(k.l?1:0),hb:k.b,nit:k.a});
 /* ---- police ---- */
 const spawnCop=()=>{const L=P.filter(p=>!p.dead);if(!L.length)return;let w=L.map(p=>Math.pow(stars(p),1.6)),s=w.reduce((a,b)=>a+b,0),r=rnd(s),T=L[0];for(let i=0;i<L.length;i++){r-=w[i];if(r<=0){T=L[i];break;}}
  let best=null,bv=-1;for(let n=0;n<26;n++){const[x,y]=roadSpot(),dT=hyp(x-T.x,y-T.y),dm=Math.min(...P.map(p=>p.dead?1e9:hyp(p.x-x,p.y-y)));if(dm<230)continue;const v=-Math.abs(dT-330);if(v>bv||!best){bv=v;best=[x,y];}}
  if(!best)return;cops.push(mk(best[0],best[1],Math.atan2(T.y-best[1],T.x-best[0]),{cop:1,hp:55,top:2.62+.12*stars(T)+.15*A.lvl*(demo(g)?0:1),acc:.07,turn:.058,tgt:T.i,siren:ri(30),wan:null}));};
 const copBrain=c=>{let T=P[c.tgt];if(!T||T.dead){const o=P[1-c.tgt];if(o&&!o.dead){c.tgt=o.i;T=o;}else T=null;}
  if(!T){if(!c.wan||hyp(c.wan[0]-c.x,c.wan[1]-c.y)<30){const[x,y]=roadSpot();c.wan=[x,y,bfs(x,y)];}const n=nextPt(c.wan[2],c.x,c.y)||c.wan;return steerTo(c,n[0],n[1]);}
  const dx=T.x-c.x,dy=T.y-c.y,d=hyp(dx,dy);let tx,ty;
  if(d<120&&los(c.x,c.y,T.x,T.y)){const lead=Math.min(d/5,20);tx=T.x+T.vx*lead;ty=T.y+T.vy*lead;}
  else{const n=nextPt(F[T.i],c.x,c.y);if(n){tx=n[0];ty=n[1];}else{tx=T.x;ty=T.y;}}
  const k=steerTo(c,tx,ty);if(T.inv>0&&d<50){k.thr=0;k.brk=1;}return k;};
 const down=(p,why)=>{const loss=Math.round(p.cash*.3/10)*10;p.cash-=loss;p.dead=150;p.why=why;p.heat=0;p.bust=0;p.nOn=0;
  if(why==='WRECKED')boom(p.x,p.y,1);else if(!demo(g))S('lose');
  pop(p.x,p.y,why+(loss?' -'+money(loss):''),'#ff6a5a');
  if(loss>0)bags.push({x:p.x,y:p.y,v:loss,gold:0,drop:1,ph:0,F:bfs(p.x,p.y)});};
 const respawn=p=>{let best=null,bv=-1;for(let n=0;n<40;n++){const[x,y,cx,cy]=roadSpot();if(!(cx%4===0&&cy%4===0)&&Math.random()<.5)continue;
   const dc=cops.length?Math.min(...cops.map(c=>hyp(c.x-x,c.y-y))):999,dp=hyp(P[1-p.i].x-x,P[1-p.i].y-y);const v=Math.min(dc,400)+Math.min(dp,160);if(v>bv){bv=v;best=[x,y,cx,cy];}}
  Object.assign(p,{x:best[0],y:best[1],a:best[3]%4===0?(best[0]<WW/2?0:Math.PI):(best[1]<WH/2?Math.PI/2:-Math.PI/2),vx:0,vy:0,hp:100,nitro:Math.max(p.nitro,60),inv:120,dead:0,wl:null,rev:0});};
 /* ---- camera: frames both drivers, zooming out as they split up ---- */
 const cam={x:(P[0].x+P[1].x)/2,y:(P[0].y+P[1].y)/2,z:.5};
 const camStep=snap=>{const L=P.filter(p=>!p.dead),Q=L.length?L:P;let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9;for(const p of Q){x0=Math.min(x0,p.x+p.vx*14);x1=Math.max(x1,p.x+p.vx*14);y0=Math.min(y0,p.y+p.vy*14);y1=Math.max(y1,p.y+p.vy*14);}
  const zt=cl(Math.min(W/(x1-x0+170),H/(y1-y0+140)),.42,1.05),k=snap?1:1;cam.z+=(zt-cam.z)*(snap?1:.035)*k;
  cam.x+=((x0+x1)/2-cam.x)*(snap?1:.1);cam.y+=((y0+y1)/2-cam.y)*(snap?1:.1);
  const vw=W/cam.z,vh=H/cam.z;cam.x=vw>=WW?WW/2:cl(cam.x,vw/2,WW-vw/2);cam.y=vh>=WH?WH/2:cl(cam.y,vh/2,WH-vh/2);};
 camStep(true);
 g.update=()=>{t++;
  if(t%10===1){F[0]=bfs(P[0].x,P[0].y);F[1]=bfs(P[1].x,P[1].y);}
  for(const p of P){if(p.dead){if(--p.dead===0)respawn(p);continue;}if(p.inv>0)p.inv--;if(p.flash>0)p.flash--;
   const raw=demo(g)||(p.i===1&&A.cpu)?brain(p):pad(A.in(p.i));if(p.i===1&&A.cpu&&!demo(g)&&raw.thr!==undefined)A.bot({u:raw.thr,d:raw.brk,l:raw.st<-.3,r:raw.st>.3,a:raw.nit,b:raw.hb});
   drive(p,raw);collide(p);
   // stopped with a cop on your bumper: the cuffs come out
   const near=cops.some(c=>hyp(c.x-p.x,c.y-p.y)<21);if(p.inv<=0&&near&&hyp(p.vx,p.vy)<.75)p.bust+=1/70;else p.bust=Math.max(0,p.bust-.02);
   let close=cops.some(c=>hyp(c.x-p.x,c.y-p.y)<150);if(!close)p.heat=Math.max(0,p.heat-.0016);
   if(p.hp<35&&lo()&&t%5===p.i)wfx.spark(p.x,p.y,'rgba(150,150,160,.6)',1,.5);
   if(p.nOn&&lo()&&t%2===0)wfx.spark(p.x-Math.cos(p.a)*9,p.y-Math.sin(p.a)*9,'#5ae8ff',2,1.2);
   if(p.hp<=0)down(p,'WRECKED');else if(p.bust>=1)down(p,'BUSTED');}
  // police numbers rise with both drivers' wanted stars and with the clock
  const want=cl(2+Math.floor((stars(P[0])+stars(P[1])-2)/1.2)+Math.floor(t/2400),2,9);
  if(--spawnT<=0){spawnT=50;if(cops.length<want)spawnCop();}
  for(const c of cops){if(c.flash>0)c.flash--;c.siren++;drive(c,copBrain(c));collide(c);}
  // car against car
  const all=P.filter(p=>!p.dead).concat(cops);
  for(let i=0;i<all.length;i++)for(let j=i+1;j<all.length;j++){const a=all[i],b=all[j],dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy);if(d>=CR*2||d<.01)continue;
   const nx=dx/d,ny=dy/d,ov=(CR*2-d)/2;a.x-=nx*ov;a.y-=ny*ov;b.x+=nx*ov;b.y+=ny*ov;const rel=(a.vx-b.vx)*nx+(a.vy-b.vy)*ny;if(rel<=0)continue;
   const j_=rel*.9;a.vx-=j_*nx;a.vy-=j_*ny;b.vx+=j_*nx;b.vy+=j_*ny;
   if(rel>.9){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;wfx.spark(mx,my,'#ffe0a0',Math.min(10,rel*3|0),2);
    const pa=a.pl,pb=b.pl;hurt(a,rel*(pa?(pb?3:5.5):(pb?3.5:5)));hurt(b,rel*(pb?(pa?3:5.5):(pa?3.5:5)));if(pa&&!pb)b.last=a.i;if(pb&&!pa)a.last=b.i;
    if(rel>2&&!demo(g)){S('hit');A.shake=Math.max(A.shake||0,2);}}}
  for(let i=cops.length-1;i>=0;i--){const c=cops[i];if(c.hp>0)continue;cops.splice(i,1);boom(c.x,c.y,0);wrecks.push({x:c.x,y:c.y,a:c.a,r:7,t:420});
   // the driver who rammed it (or the nearest) takes the credit and the extra heat
   let cr=c.last!==undefined&&!P[c.last].dead?P[c.last]:null;if(!cr){let bd=130;for(const p of P)if(!p.dead){const d=hyp(p.x-c.x,p.y-c.y);if(d<bd){bd=d;cr=p;}}}
   if(cr){cr.cash+=50;cr.heat=Math.min(4.99,cr.heat+.45);pop(c.x,c.y,'COP WRECKED +50','#ffcf3f');}}
  for(let i=wrecks.length-1;i>=0;i--){const w=wrecks[i];if(--w.t<=0)wrecks.splice(i,1);else if(lo()&&t%6===i%6)wfx.spark(w.x+rnd(4)-2,w.y-2,'rgba(120,120,130,.55)',1,.4);}
  // cash bags, the gold case and pickups
  for(let i=bags.length-1;i>=0;i--){const b=bags[i];b.ph+=.08;for(const p of P){if(p.dead||hyp(p.x-b.x,p.y-b.y)>13)continue;
    p.cash+=b.v;p.heat=Math.min(4.99,p.heat+b.v/260);bags.splice(i,1);wfx.ring(b.x,b.y,b.gold?'#ffcf3f':'#7dff6a',22,16);wfx.spark(b.x,b.y,b.gold?'#ffe27a':'#9dff8a',10,2.2);
    pop(b.x,b.y,'+'+money(b.v),b.gold?'#ffcf3f':'#9dff8a');if(!demo(g))S(b.gold?'win':'coin');break;}}
  if(bags.filter(b=>!b.drop&&!b.gold).length<4&&t%40===0)addBag(100,0);
  if(t%1500===900&&!bags.some(b=>b.gold)){addBag(400,1);pop(cam.x,cam.y,'GOLD CASE ON THE MAP!','#ffcf3f');}
  if(t%600===300&&picks.length<2){const[x,y]=roadSpot();picks.push({x,y,k:Math.random()<.5?'fix':'nit',ph:0});}
  for(let i=picks.length-1;i>=0;i--){const q=picks[i];q.ph+=.06;for(const p of P){if(p.dead||hyp(p.x-q.x,p.y-q.y)>13)continue;picks.splice(i,1);
    if(q.k==='fix'){p.hp=Math.min(100,p.hp+45);pop(q.x,q.y,'REPAIRED','#7dff6a');}else{p.nitro=100;pop(q.x,q.y,'NITRO FULL','#5ae8ff');}wfx.ring(q.x,q.y,'#ffffff',18,14);if(!demo(g))S('score');break;}}
  for(let i=blasts.length-1;i>=0;i--)if(--blasts[i].t<=0)blasts.splice(i,1);
  // the helicopter turns up for anyone at four stars or more
  const hot=P.filter(p=>!p.dead&&stars(p)>=4).sort((a,b)=>b.heat-a.heat)[0];
  if(hot){if(!heli)heli={x:hot.x-200,y:hot.y-160,lx:hot.x,ly:hot.y,r:0};heli.x+=(hot.x-heli.x)*.02;heli.y+=(hot.y-30-heli.y)*.02;heli.lx+=(hot.x-heli.lx)*.07;heli.ly+=(hot.y-heli.ly)*.07;heli.on=1;}
  else if(heli){heli.on=0;heli.x+=3;heli.y-=2;if(heli.x>cam.x+W/cam.z)heli=null;}
  if(heli)heli.r+=.6;
  camStep(false);
  g.score=P[0].cash;};
 g.timeUp=()=>tu(P[0].cash,P[1].cash);
 g._P=P;g._cops=cops;g._bags=bags;g._cam=cam;g.fxClear=()=>{wfx.clear();sfx.clear();blasts.length=0;};

 /* ---- drawing ---- */
 // top-down car pointing along +x
 function carSprite(x,y,a,col,kind,o){const c=A.c;o=o||{};c.save();c.translate(x,y);c.rotate(a);
  X.rr(-8,-4.4,17,9.6,3,'rgba(0,0,0,.42)');
  c.translate(-.5,-.8);
  const body=kind===1?'#e8ecf2':col;X.rr(-8.5,-4.6,17,9.2,3.2,X.lg(0,-4.6,0,4.6,[X.lt(body,1.25),body,X.lt(body,.5)]));
  if(kind===1){c.fillStyle='#14161c';c.fillRect(-8.5,-4.6,4,9.2);c.fillRect(5,-4.6,3.5,9.2);}
  else if(kind===2){c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-8,-.9,16,1.8);}
  X.rr(.8,-3.6,3.6,7.2,1.3,X.lg(1,0,4.4,0,['#1a2a3a','#5a8ab0']));X.rr(-6.4,-3.2,2.2,6.4,1,'#141c26');
  X.rr(-4.2,-3.7,5.2,7.4,1.6,kind===1?'#f4f6fa':X.lt(body,1.08));
  c.fillStyle='#fff6c8';c.fillRect(7.2,-3.6,1.3,1.6);c.fillRect(7.2,2,1.3,1.6);
  c.fillStyle=o.brk?'#ff3a4a':'#a0202a';c.fillRect(-8.6,-3.6,1.1,1.6);c.fillRect(-8.6,2,1.1,1.6);
  if(kind===1){const ph=Math.floor((o.siren||0)/7)%2;c.fillStyle=ph?'#ff2a3a':'#4a2a2a';c.fillRect(-2.6,-3.6,2.6,3.4);c.fillStyle=ph?'#2a2a4a':'#2a6aff';c.fillRect(-2.6,.2,2.6,3.4);}
  if(o.flash){c.globalAlpha=.6;X.rr(-8.5,-4.6,17,9.2,3.2,'#ffffff');c.globalAlpha=1;}
  if(o.dmg){c.globalAlpha=o.dmg;c.fillStyle='#1a1414';c.fillRect(-6,-3,4,2);c.fillRect(2,1,3,2.4);c.globalAlpha=1;}
  c.restore();}
 const buildingDraw=b=>{const c=A.c,cx=b.x+b.w/2,cy=b.y+b.h/2,k=b.ht*.0024,ox=(cx-cam.x)*k,oy=(cy-cam.y)*k;
  const p=[[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]],q=p.map(v=>[v[0]+ox,v[1]+oy]),N=[[0,-1],[1,0],[0,1],[-1,0]],SH=[.78,.5,.42,.66];
  for(let i=0;i<4;i++){const n=N[i],dv=ox*n[0]+oy*n[1];if(dv>=0)continue;const a=p[i],b2=p[(i+1)%4],qa=q[i],qb=q[(i+1)%4];
   X.poly([a,b2,qb,qa],X.lt(b.col,SH[i]));
   // lit windows on the walls you can see
   if(-dv>2.2&&lo()){const len=hyp(b2[0]-a[0],b2[1]-a[1]),nw=Math.floor(len/8),nf=Math.max(1,Math.floor(b.ht/11));
    for(let f=1;f<=nf;f++){const tt=f/(nf+1);for(let j=0;j<nw;j++){const s=(j+.5)/nw,h=hash(b.id*31+i*7+f,j);if(h>.55)continue;
     const x=a[0]+(b2[0]-a[0])*s,y=a[1]+(b2[1]-a[1])*s,X2=qa[0]+(qb[0]-qa[0])*s,Y2=qa[1]+(qb[1]-qa[1])*s;c.fillStyle=h<.08?'#ffeebb':h<.3?'rgba(255,214,130,.85)':'rgba(120,170,255,.5)';c.fillRect(x+(X2-x)*tt-.9,y+(Y2-y)*tt-.9,1.8,1.8);}}}
   if(b.sign&&b.signF===i&&-dv>1.5){const tt=.55,s0=.2,s1=.8,P0=[a[0]+(b2[0]-a[0])*s0,a[1]+(b2[1]-a[1])*s0],P1=[a[0]+(b2[0]-a[0])*s1,a[1]+(b2[1]-a[1])*s1],Q0=[qa[0]+(qb[0]-qa[0])*s0,qa[1]+(qb[1]-qa[1])*s0],Q1=[qa[0]+(qb[0]-qa[0])*s1,qa[1]+(qb[1]-qa[1])*s1];
    const m0=[P0[0]+(Q0[0]-P0[0])*tt,P0[1]+(Q0[1]-P0[1])*tt],m1=[P1[0]+(Q1[0]-P1[0])*tt,P1[1]+(Q1[1]-P1[1])*tt],on=(t+b.id*13)%140>8;
    X.stroke([m0,m1],on?b.sign:X.lt(b.sign,.4),2.2);if(on&&lo())X.glow((m0[0]+m1[0])/2,(m0[1]+m1[1])/2,16,b.sign,.35);}}
  X.poly(q,X.lg(q[0][0],q[0][1],q[2][0],q[2][1],[X.lt(b.col,1.18),X.lt(b.col,.9)]));
  X.polys(q,X.lt(b.col,1.5),1.2);
  c.fillStyle='rgba(0,0,0,.25)';c.fillRect(q[0][0]+2,q[0][1]+2,b.w-4,1.2);
  if(b.shop){c.fillStyle='#ffcf3f';c.fillRect(q[0][0]+4,q[0][1]+b.h-5,b.w-8,2);}
  else{for(const[ax,ay]of b.ac){X.block(q[0][0]+ax,q[0][1]+ay,7,5,'#6a7080',1);c.fillStyle='rgba(0,0,0,.4)';c.beginPath();c.arc(q[0][0]+ax+3.5,q[0][1]+ay+2.5,1.6,0,TAU);c.fill();}
   if(b.pad){const hx=q[0][0]+b.w/2,hy=q[0][1]+b.h/2;X.disc(hx,hy,13,'#2a2e38');A.c.strokeStyle='#ffcf3f';A.c.lineWidth=1;A.c.beginPath();A.c.arc(hx,hy,11,0,TAU);A.c.stroke();c.fillStyle='#e8e8e8';c.fillRect(hx-4,hy-5,1.6,10);c.fillRect(hx+2.4,hy-5,1.6,10);c.fillRect(hx-4,hy-.8,8,1.6);}
   if(b.ht>58){const on=(t+b.id*17)%70<35;X.disc(q[0][0]+3,q[0][1]+3,1.3,on?'#ff3a3a':'#5a2020');if(on&&lo())X.glow(q[0][0]+3,q[0][1]+3,7,'#ff3a3a',.6);}}};
 const treeDraw=o=>{const ox=(o.x-cam.x)*.03,oy=(o.y-cam.y)*.03;
  if(o.fount){X.disc(o.x,o.y,o.r+2,'#8a8478');X.disc(o.x,o.y,o.r,X.rg(o.x,o.y,1,o.x,o.y,o.r,['#7ac8ff','#2a6ab0']));for(let k=0;k<3;k++){const r=((t*.25+k*4)%o.r);A.c.strokeStyle='rgba(255,255,255,'+(.5-r/o.r*.5).toFixed(2)+')';A.c.lineWidth=.8;A.c.beginPath();A.c.arc(o.x,o.y,r,0,TAU);A.c.stroke();}X.disc(o.x,o.y,2,'#d8f0ff');return;}
  X.disc(o.x+2,o.y+3,o.r,'rgba(0,0,0,.35)');const G=[['#2e6a2a','#4a9a3a','#7ac85a'],['#2a5a3a','#3a8a5a','#6ac88a'],['#4a5a22','#6a8a2a','#a8c84a']][o.hue||0];
  X.disc(o.x+ox,o.y+oy,o.r,G[0]);X.disc(o.x+ox-1,o.y+oy-1,o.r*.78,G[1]);X.disc(o.x+ox-2,o.y+oy-2.4,o.r*.42,G[2]);};
 const star=(x,y,r,f)=>{const pts=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?r*.45:r;pts.push([x+Math.cos(a)*rr,y+Math.sin(a)*rr]);}X.poly(pts,f);};
 g.draw=()=>{const c=A.c,z=cam.z;c.fillStyle='#0b0c12';c.fillRect(0,0,W,H);
  const vx0=cam.x-W/2/z,vy0=cam.y-H/2/z,vx1=cam.x+W/2/z,vy1=cam.y+H/2/z,vis=(x,y,m)=>x>vx0-m&&x<vx1+m&&y>vy0-m&&y<vy1+m;
  c.save();c.translate(W/2,H/2);c.scale(z,z);c.translate(-cam.x,-cam.y);
  if(GC&&c.drawImage){const sx=Math.max(0,vx0),sy=Math.max(0,vy0),ex=Math.min(WW,vx1),ey=Math.min(WH,vy1);if(ex>sx&&ey>sy)c.drawImage(GC.cv,sx*GS,sy*GS,(ex-sx)*GS,(ey-sy)*GS,sx,sy,ex-sx,ey-sy);}else paintGround(true);
  // street lamps pool light on the tarmac
  if(lo())for(const l of lamps)if(vis(l.x,l.y,40)){X.glow(l.x+6,l.y+6,hi()?30:24,'#ffc87a',.15);X.glow(l.x+2,l.y+2,5,'#fff0c8',.5);}
  for(const q of picks)if(vis(q.x,q.y,20)){const y=q.y-2+Math.sin(q.ph)*1.5;X.glow(q.x,y,12,q.k==='fix'?'#7dff6a':'#5ae8ff',.5);X.rr(q.x-5,y-5,10,10,2.5,q.k==='fix'?'#2a8a4a':'#1a6a9a');c.fillStyle='#ffffff';if(q.k==='fix'){c.fillRect(q.x-3.5,y-.8,7,1.6);c.fillRect(q.x-.8,y-3.5,1.6,7);}else{X.poly([[q.x+1,y-4],[q.x-3,y+.5],[q.x,y+.5],[q.x-1,y+4],[q.x+3,y-.5],[q.x,y-.5]],'#ffffff');}}
  for(const b of bags)if(vis(b.x,b.y,30)){const y=b.y+Math.sin(b.ph)*1.5,gd=b.gold;X.glow(b.x,y,gd?22:13,gd?'#ffcf3f':'#7dff6a',gd?.6:.4);
   if(gd){X.rr(b.x-6,y-4,12,8,1.5,X.lg(0,y-4,0,y+4,['#ffe27a','#c8901a']));c.fillStyle='#7a5a10';c.fillRect(b.x-2,y-6,4,2);c.fillRect(b.x-.5,y-1,1,2);c.strokeStyle='rgba(255,240,180,'+(.4+.4*Math.sin(t*.1)).toFixed(2)+')';c.lineWidth=1;c.beginPath();c.arc(b.x,y,12+Math.sin(t*.1)*2,0,TAU);c.stroke();}
   else{X.disc(b.x+1,y+3.5,4.5,'rgba(0,0,0,.35)');X.disc(b.x,y+.5,4.6,X.rg(b.x-1,y-1,0,b.x,y,5,['#e8d8a8','#a8925a']));X.poly([[b.x-2.2,y-3.6],[b.x+2.2,y-3.6],[b.x+1.2,y-5.6],[b.x-1.2,y-5.6]],'#8a7444');c.fillStyle='#2a8a3a';c.fillRect(b.x-1.6,y-.6,3.2,3);c.fillStyle='#d8ffd8';c.fillRect(b.x-.4,y-.2,.8,2.2);}}
  for(const w of wrecks)if(vis(w.x,w.y,20)){c.globalAlpha=Math.min(1,w.t/40);carSprite(w.x,w.y,w.a,'#2a2a2e',0,{dmg:1});if(lo()&&w.t>60)X.glow(w.x,w.y,8+Math.sin(t*.4+w.x)*2,'#ff7a2a',.35);c.globalAlpha=1;}
  const cars=cops.concat(P.filter(p=>!p.dead));
  for(const k of cars)if(vis(k.x,k.y,20))carSprite(k.x,k.y,k.a,k.pl?k.col:'#e8ecf2',k.cop?1:2,{brk:k.brk,siren:k.siren,flash:k.flash>0||(k.pl&&k.inv>0&&t%8<4),dmg:k.hp<50?(50-Math.max(0,k.hp))/60:0});
  // headlights, nitro flames and the police light bars
  if(lo()){c.globalCompositeOperation='lighter';
   for(const k of cars){if(!vis(k.x,k.y,60))continue;c.save();c.translate(k.x,k.y);c.rotate(k.a);c.fillStyle=X.lg(7,0,58,0,['rgba(255,240,200,.26)','rgba(255,240,200,0)']);c.beginPath();c.moveTo(7,-3.5);c.lineTo(58,-19);c.lineTo(58,19);c.lineTo(7,3.5);c.closePath();c.fill();
    if(k.nOn){const fl=6+rnd(5);c.fillStyle=X.lg(-9,0,-9-fl,0,['rgba(140,230,255,.9)','rgba(60,120,255,0)']);c.beginPath();c.moveTo(-8.5,-2);c.lineTo(-9-fl,0);c.lineTo(-8.5,2);c.closePath();c.fill();}
    c.restore();
    if(k.cop){const ph=Math.floor(k.siren/7)%2;X.glow(k.x,k.y,hi()?20:14,ph?'#ff2a3a':'#2a6aff',.42);}}
   c.globalCompositeOperation='source-over';}
  for(const o of TR)if(vis(o.x,o.y,20))treeDraw(o);
  const vb=B.filter(b=>b.x+b.w>vx0-30&&b.x<vx1+30&&b.y+b.h>vy0-30&&b.y<vy1+30).sort((a,b)=>hyp(b.x+b.w/2-cam.x,b.y+b.h/2-cam.y)-hyp(a.x+a.w/2-cam.x,a.y+a.h/2-cam.y));
  for(const b of vb)buildingDraw(b);
  // markers that stay on top: who is who, where the nearest cash is, how close the cuffs are
  for(const p of P){if(p.dead)continue;const nb=bags.reduce((m,b)=>{const d=hyp(b.x-p.x,b.y-p.y);return d<m[0]?[d,b]:m;},[1e9,null])[1];
   c.strokeStyle=X.rgba(p.col,.7);c.lineWidth=1.2;c.beginPath();c.arc(p.x,p.y,11,0,TAU);c.stroke();
   if(nb&&hyp(nb.x-p.x,nb.y-p.y)>40){const a=Math.atan2(nb.y-p.y,nb.x-p.x),r=17;X.poly([[p.x+Math.cos(a)*(r+5),p.y+Math.sin(a)*(r+5)],[p.x+Math.cos(a+.35)*r,p.y+Math.sin(a+.35)*r],[p.x+Math.cos(a-.35)*r,p.y+Math.sin(a-.35)*r]],nb.gold?'#ffcf3f':X.rgba(p.col,.85));}
   if(p.bust>0){c.strokeStyle='#ff3a4a';c.lineWidth=2.2;c.beginPath();c.arc(p.x,p.y,14,-Math.PI/2,-Math.PI/2+TAU*Math.min(1,p.bust));c.stroke();}}
  for(const b of blasts){const f=b.t/b.m;X.glow(b.x,b.y,b.r*(1.3-f*.5),'#ffb34a',f*.8);X.disc(b.x,b.y,b.r*.3*f,'rgba(255,250,220,'+f.toFixed(2)+')');}
  wfx.draw();
  if(heli){const hx=heli.x,hy=heli.y;
   if(heli.on&&lo()){c.globalCompositeOperation='lighter';X.ell(heli.lx,heli.ly,26,22,X.rg(heli.lx,heli.ly,0,heli.lx,heli.ly,26,['rgba(230,240,255,.32)','rgba(230,240,255,0)']));c.fillStyle='rgba(220,235,255,.05)';c.beginPath();c.moveTo(hx-3,hy);c.lineTo(heli.lx-20,heli.ly);c.lineTo(heli.lx+20,heli.ly);c.closePath();c.fill();c.globalCompositeOperation='source-over';}
   X.ell(hx+26,hy+44,12,5,'rgba(0,0,0,.3)');c.save();c.translate(hx,hy);c.rotate(.3);X.rr(-10,-5,20,10,5,X.lg(0,-5,0,5,['#3a4a6a','#1a2234']));c.fillStyle='#1a2234';c.fillRect(-24,-1.2,16,2.4);c.fillRect(-25,-4,2.4,8);X.rr(4,-3.6,5,7.2,2.5,'#8ac0ff');
   c.globalAlpha=.55;c.fillStyle='#c8d0dc';for(const a of[heli.r,heli.r+Math.PI/2]){c.save();c.rotate(a);c.fillRect(-22,-.8,44,1.6);c.restore();}c.globalAlpha=1;X.disc(0,0,1.6,'#888');
   if(t%30<4)X.glow(-24,0,6,'#ff3a3a',.8);c.restore();}
  c.restore();
  // a soft night vignette, then the screen-space HUD
  if(lo())X.vignette(.5);
  for(const p of P){if(!p.dead)continue;const[sx,sy]=sp(p.x,p.y);if(sx>20&&sx<W-20&&sy>40&&sy<H-12)X.ot(Math.ceil(p.dead/60)+'',sx,sy-4,p.col,2,'c');}
  for(const p of P){if(p.dead)continue;const[sx,sy]=sp(p.x,p.y);if(sx>-4&&sx<W+4&&sy>34&&sy<H+4)continue;const ex=cl(sx,10,W-10),ey=cl(sy,42,H-10),a=Math.atan2(sy-ey,sx-ex);
   X.poly([[ex+Math.cos(a)*7,ey+Math.sin(a)*7],[ex+Math.cos(a+2.4)*6,ey+Math.sin(a+2.4)*6],[ex+Math.cos(a-2.4)*6,ey+Math.sin(a-2.4)*6]],p.col);}
  for(const p of P){const x=p.i?W-108:2;X.panel(x,2,106,32,PC[p.i]);A.text(A.nm(p.i),x+5,7,PC[p.i],1);X.ot(money(p.cash),x+101,6,'#ffe27a',2,'r');{const bx=x+92-money(p.cash).length*8;X.rr(bx-11,7,10,7,1.5,'#3a9a4a');X.rrs(bx-10.5,7.5,9,6,1.5,'#9dffaa',.8);A.c.fillStyle='#d8ffd8';A.c.fillRect(bx-7,9.5,3,2);}
   const s=stars(p),warn=cops.some(c=>c.tgt===p.i&&hyp(c.x-p.x,c.y-p.y)<120)&&t%20<10;for(let j=0;j<5;j++)star(x+8+j*9,25,4,j<s?(warn?'#ffffff':'#ffcf3f'):'rgba(255,255,255,.16)');
   X.meter(x+52,21,50,4,Math.max(0,p.hp)/100,p.hp>35?'#3dff8b':'#ff4f4f');X.meter(x+52,27,50,3,p.nitro/100,'#5ae8ff');}
  if(heli&&heli.on&&t%60<40)A.text('CHOPPER',160,6,'#ff6a5a',1,'c');
  sfx.draw();};
 return g;}});

/* ================= FLOPPY HOOPS ================= */
// one button per team: press to jump and swing both players' arms up, let go to throw. Every basket brings new rules.
const FL=206,RY=112;
// hoop 1 (right) is the one team 0 attacks; front is the rim's open end, back meets the board
const HOOP=[{x:31,front:42,back:21,b0:14,b1:18,dir:-1},{x:289,front:278,back:299,b0:302,b1:306,dir:1}];
const MODS=[{n:'CLASSIC'},{n:'BIG BALL',r:10.5,bounce:.55},{n:'MOON GRAVITY',bg:.085,pg:.55,jump:.76},{n:'BEACH BALL',r:9,bg:.075,bounce:.8,drag:.992,kind:1},
 {n:'LONG ARMS',arm:1.6},{n:'ICE COURT',ice:1},{n:'TALL TEAMS',L:1.3},{n:'BOWLING BALL',r:5.5,bg:.22,bounce:.32,kind:2},{n:'MINI PLAYERS',L:.72,jump:.9},{n:'SUPER BOUNCE',bounce:.92,jump:1.12}];
const THEMES=['gym','beach','roof','street'];
const MOD0={r:6.5,bg:.16,bounce:.62,drag:.998,pg:1,jump:1,arm:1,ice:0,L:1,kind:0};
const SKIN=['#f1c7a3','#c68a5a','#8a5a3a','#e8b088'],HAIR=['#2a1a10','#e8c060','#1a1a1a','#a0402a'];

A.add({id:'floppyhoops',name:'FLOPPY HOOPS',cat:'VERSUS',vs:1,time:120,warm:160,tags:'basket random basketball random ragdoll physics one button funny wobbly sports 2 player versus',
 how:'ONE BUTTON (A): HOLD TO JUMP AND RAISE ARMS, LET GO TO THROW. NEW RULES EVERY BASKET.',make(){
 const g={over:null,score:0},fx=X.fx();let shout=null,t=0,M=Object.assign({},MOD0,MODS[0]),theme='gym',banner=150,celebrate=0,net=[0,0],dropT=40,lastMod=0;
 const st={shots:0,grabs:0,steals:0},sc=[0,0],ai=[{press:0,next:0,t0:0,err:0,pe:null},{press:0,next:0,t0:0,err:0,pe:null}],btn=[0,0];
 const mkP=(team,idx)=>({team,idx,d:team?-1:1,fx:0,fy:FL,th:0,w:0,gnd:1,cx:0,cy:0,vx:0,vy:0,fvx:0,arm:Math.PI,armW:0,hold:0,cd:0,down:0,sq:0,hand:[0,0],hv:[0,0],sh:[0,0],skin:SKIN[(team*2+idx)%4],hair:HAIR[(team+idx*3)%4]});
 const PL=[mkP(0,0),mkP(0,1),mkP(1,0),mkP(1,1)];
 const ball={x:160,y:60,vx:0,vy:0,rot:0,held:null,from:0,cd:0};
 const place=()=>{const X0=[62,118,258,202];PL.forEach((p,i)=>Object.assign(p,{fx:X0[i],fy:FL,th:p.d*.1,w:0,gnd:1,vx:0,vy:0,fvx:0,arm:Math.PI,hold:0,cd:0,down:0}));
  Object.assign(ball,{x:160,y:46,vx:(Math.random()-.5)*.8,vy:0,held:null,cd:0});dropT=40;};
 const newRules=first=>{let k=0;if(!first){do k=1+ri(MODS.length-1);while(k===lastMod);}lastMod=k;M=Object.assign({},MOD0,MODS[k]);theme=first?'gym':THEMES[(THEMES.indexOf(theme)+1+ri(THEMES.length-1))%THEMES.length];banner=130;};
 newRules(true);place();
 const len=()=>42*M.L;
 const handOf=p=>{const L=len(),sx=p.fx+Math.sin(p.th)*L*.78,sy=p.fy-Math.cos(p.th)*L*.78,aa=p.th+p.d*p.arm,AL=15*M.arm;return[sx,sy,sx+Math.sin(aa)*AL,sy-Math.cos(aa)*AL,aa];};
 const throwBall=p=>{const[,,,,aa]=handOf(p),sp=5.35*(M.kind===1?.8:M.kind===2?1.1:1);ball.vx=Math.sin(aa)*sp+(p.gnd?p.fvx*.5:p.vx*.45);ball.vy=-Math.cos(aa)*sp+(p.gnd?0:p.vy*.35);ball.held=null;p.hold=0;p.cd=14;ball.from=p.fx;ball.team=p.team;st.shots++;};
 const updP=(p,press,dn,up)=>{const L=len();if(p.cd>0)p.cd--;
  // let go: the ball leaves along the arm exactly as it pointed last frame
  if(up&&p.hold)throwBall(p);if(p.sq>0)p.sq=Math.max(0,p.sq-.08);
  const own=ball.held&&ball.held.team===p.team;
  // bodies lean toward the ball, or toward the far hoop while your team has it, with a constant wobble on top
  let lean=own?p.d*.3:cl((ball.x-p.fx)*.012,-.32,.32);lean+=.1*Math.sin(t*.045+p.idx*2.1+p.team*1.3);
  if(p.gnd){
   if(p.down>0){p.down--;p.w+=-p.th*.016;p.w*=.86;}else p.w+=Math.sin(p.th)*.0055-(p.th-lean)*.011-p.w*.035;
   p.th+=p.w;if(Math.abs(p.th)>1.45){p.th=Math.sign(p.th)*1.45;p.w=0;if(!p.down)p.down=50;}
   p.fx+=p.fvx;p.fvx*=M.ice?.985:.72;
   if(dn&&p.down<=0){const J=4.55*M.jump;p.vx=Math.sin(p.th)*J*1.15+p.fvx;p.vy=-Math.cos(p.th)*J;p.gnd=0;p.cx=p.fx+Math.sin(p.th)*L/2;p.cy=FL-Math.cos(p.th)*L/2;p.w=p.w*.6+(Math.random()-.5)*.02;
    if(!demo(g)&&p.idx===1&&(p.team===0||!A.cpu))S('jump');}}
  else{p.vy+=.2*M.pg;p.cx+=p.vx;p.cy+=p.vy;p.w-=p.armW*.008*p.d;p.w+=-p.th*.0035;p.w*=.975;p.th+=p.w;
   p.fx=p.cx-Math.sin(p.th)*L/2;p.fy=p.cy+Math.cos(p.th)*L/2;
   if(p.fy>=FL){p.gnd=1;p.fy=FL;p.fvx=p.vx*(M.ice?.9:.45);p.sq=1;p.w=p.w*.4+p.vx*.008;if(Math.abs(p.th)>1.38)p.down=40;}}
  const lim=(x,s)=>{if(p.gnd){p.fx+=x-p.fx;p.fvx=s*Math.abs(p.fvx)*.5;}else{p.cx+=x-p.fx;p.fx=x;p.vx=s*Math.abs(p.vx)*.4;}};
  if(p.fx<10)lim(10,1);if(p.fx>310)lim(310,-1);
  const tg=press?-.9:Math.PI,spd=press?.085:.13,pa=p.arm;p.arm+=cl(tg-p.arm,-spd,spd);p.armW=p.arm-pa;
  const[sx,sy,hx,hy]=handOf(p);p.hv=[hx-p.hand[0],hy-p.hand[1]];p.hand=[hx,hy];p.sh=[sx,sy];
};
 // where a throw released right now would cross the rim height on its way down
 const predict=p=>{const[,,hx,hy,aa]=handOf(p),sp=5.35*(M.kind===1?.8:M.kind===2?1.1:1);let x=hx+Math.sin(aa)*M.r*.5,y=hy-Math.cos(aa)*M.r*.5,vx=Math.sin(aa)*sp+(p.gnd?p.fvx*.5:p.vx*.45),vy=-Math.cos(aa)*sp+(p.gnd?0:p.vy*.35);
  for(let i=0;i<160;i++){vy+=M.bg;vx*=M.drag;vy*=M.drag;const py=y;x+=vx;y+=vy;if(py<RY&&y>=RY&&vy>0)return x;if(y>FL)return null;}return null;};
 // the CPU (and both teams in the demo) only decides when to press and when to let go
 const think=tm=>{const s=ai[tm],sk=skill(),me=PL.filter(p=>p.team===tm),hp=HOOP[tm?0:1],h=ball.held;
  if(h&&h.team===tm){
   if(!s.press){const dist=Math.abs(hp.x-h.fx);if(h.gnd&&h.down<=0&&t>=s.next&&(dist<215||Math.random()<.02)){s.press=1;s.t0=t;s.err=(Math.random()-.5)*(1-sk)*30;s.pe=null;}}
   else{const x=predict(h),e=x===null?null:x-hp.x-s.err;
    if(e!==null&&(Math.abs(e)<4||s.pe!==null&&Math.sign(e)!==Math.sign(s.pe)&&Math.abs(e)<30))s.press=0;else if(h.arm<-.5||t-s.t0>70)s.press=0;s.pe=e;
    if(!s.press)s.next=t+12;}}
  else{const p=me.reduce((a,b)=>Math.abs(b.fx-ball.x)<Math.abs(a.fx-ball.x)?b:a),dx=ball.x-p.fx,close=Math.abs(dx)<36&&ball.y>FL-125;
   const theirs=h&&h.team!==tm&&Math.abs(h.fx-p.fx)<40;
   if(s.press){if(t-s.t0>(close||theirs?24:7)){s.press=0;s.next=t+(close?4:8+Math.round((1-sk)*16+rnd(8)));}}
   else if(t>=s.next&&p.gnd&&p.down<=0&&(Math.abs(dx)>16||close||theirs)){s.press=1;s.t0=t;}}
  return s.press;};
 const collideBall=()=>{const r=M.r;
  if(ball.y+r>FL){ball.y=FL-r;if(ball.vy>0){if(ball.vy>2.2&&!demo(g))S('hit');ball.vy=-ball.vy*M.bounce;ball.vx*=.94;if(Math.abs(ball.vy)<.5)ball.vy=0;}}
    if(ball.x-r<14){ball.x=14+r;ball.vx=Math.abs(ball.vx)*.6;}if(ball.x+r>306){ball.x=306-r;ball.vx=-Math.abs(ball.vx)*.6;}
  const box=(x0,y0,x1,y1,e)=>{const px=cl(ball.x,x0,x1),py=cl(ball.y,y0,y1),dx=ball.x-px,dy=ball.y-py,d=hyp(dx,dy);if(d>=r||d<.01)return;const nx=dx/d,ny=dy/d;ball.x=px+nx*r;ball.y=py+ny*r;const vn=ball.vx*nx+ball.vy*ny;if(vn<0){ball.vx-=(1+e)*vn*nx;ball.vy-=(1+e)*vn*ny;}};
  const pt=(x,y,e)=>{const dx=ball.x-x,dy=ball.y-y,d=hyp(dx,dy),rr=r+1.6;if(d>=rr||d<.01)return;const nx=dx/d,ny=dy/d;ball.x=x+nx*rr;ball.y=y+ny*rr;const vn=ball.vx*nx+ball.vy*ny;if(vn<0){ball.vx-=(1+e)*vn*nx;ball.vy-=(1+e)*vn*ny;ball.vx*=.92;}};
  for(const h of HOOP){box(h.b0,76,h.b1,128,.6);pt(h.front,RY,.5);pt(h.back,RY,.4);}
  for(const p of PL){const L=len(),ux=Math.sin(p.th),uy=-Math.cos(p.th),hx=p.fx+ux*(L*.8+8.4),hy=p.fy+uy*(L*.8+8.4);
   // head
   let dx=ball.x-hx,dy=ball.y-hy,d=hyp(dx,dy);const pv=p.gnd?[p.fvx,0]:[p.vx,p.vy];
   if(d<r+8&&d>.01){const nx=dx/d,ny=dy/d;ball.x=hx+nx*(r+8);ball.y=hy+ny*(r+8);const vn=(ball.vx-pv[0])*nx+(ball.vy-pv[1])*ny;if(vn<0){ball.vx-=1.5*vn*nx;ball.vy-=1.5*vn*ny;}continue;}
   // torso and legs as one capsule
   const ax=p.fx,ay=p.fy-2,bx=p.fx+ux*L*.8,by=p.fy+uy*L*.8,abx=bx-ax,aby=by-ay,k=cl(((ball.x-ax)*abx+(ball.y-ay)*aby)/(abx*abx+aby*aby),0,1),qx=ax+abx*k,qy=ay+aby*k;
   dx=ball.x-qx;dy=ball.y-qy;d=hyp(dx,dy);if(d<r+4.5&&d>.01){const nx=dx/d,ny=dy/d;ball.x=qx+nx*(r+4.5);ball.y=qy+ny*(r+4.5);const vn=(ball.vx-pv[0])*nx+(ball.vy-pv[1])*ny;if(vn<0){ball.vx-=1.45*vn*nx;ball.vy-=1.45*vn*ny;}}}};
 const score=(tm,dunk)=>{const hp=HOOP[tm?0:1],three=!dunk&&Math.abs(ball.from-hp.x)>170&&ball.team===tm,pts=three?3:2;sc[tm]+=pts;celebrate=100;net[tm?0:1]=1;
  fx.ring(hp.x,RY+6,PC[tm],34,20);fx.spark(hp.x,RY+10,PC[tm],18,2.8);fx.spark(hp.x,RY+10,'#ffcf3f',10,2.2);shout={txt:dunk?'DUNK! +2':three?'THREE! +3':'+2',x:cl(hp.x,dunk?54:60,W-(dunk?54:60)),col:PC[tm],t:70};
  if(!demo(g)){S('score');A.shake=Math.max(A.shake||0,4);}};
 g.update=()=>{t++;if(banner>0)banner--;
  for(let tm=0;tm<2;tm++){const auto=demo(g)||(tm===1&&A.cpu);let pr;if(auto)pr=think(tm);else{const k=A.in(tm);pr=!!(k.a||k.u);}if(tm===1&&A.cpu&&!demo(g))A.bot({a:pr});
   const dn=pr&&!btn[tm],up=!pr&&btn[tm];btn[tm]=pr?1:0;for(const p of PL)if(p.team===tm)updP(p,pr,dn,up);}
  // players shove each other
  for(let i=0;i<4;i++)for(let j=i+1;j<4;j++){const a=PL[i],b=PL[j],L=len(),ax=a.fx+Math.sin(a.th)*L*.55,bx=b.fx+Math.sin(b.th)*L*.55,ay=a.fy-Math.cos(a.th)*L*.55,by=b.fy-Math.cos(b.th)*L*.55;
   if(Math.abs(ax-bx)<12&&Math.abs(ay-by)<L*.7){const ov=(12-Math.abs(ax-bx))/2,s=ax<bx?-1:1;for(const[p,sg]of[[a,s],[b,-s]]){if(p.gnd)p.fx+=sg*ov;else{p.cx+=sg*ov;p.fx+=sg*ov;p.vx+=sg*.15;}p.w+=sg*.01;}}}
  // the ball: carried in a hand, or flying free
  if(dropT>0){dropT--;ball.vy=0;ball.y=46+Math.sin(t*.1)*2;}
  else{const py=ball.y,h=ball.held;
   if(h){const[,,hx,hy,aa]=handOf(h);ball.x=hx+Math.sin(aa)*M.r*.5;ball.y=hy-Math.cos(aa)*M.r*.5;ball.vx=h.hv[0];ball.vy=h.hv[1];ball.rot+=.05;}
   else{ball.vy+=M.bg;ball.vx*=M.drag;ball.vy*=M.drag;ball.x+=ball.vx;ball.y+=ball.vy;ball.rot+=ball.vx*.09;collideBall();}
   // grabs and steals
   if(!celebrate)for(const p of PL){if(p.cd>0||p.hold)continue;const d=hyp(p.hand[0]-ball.x,p.hand[1]-ball.y);if(d>M.r+5)continue;
    if(!ball.held){ball.held=p;p.hold=1;ball.team=p.team;st.grabs++;if(!demo(g))S('blip');}
    else if(ball.held.team!==p.team&&p.armW<-.02&&Math.random()<.3){st.steals++;const o=ball.held;o.hold=0;o.cd=22;ball.held=null;ball.vx=p.hv[0]*1.3;ball.vy=p.hv[1]*1.3-1.6;p.cd=8;fx.spark(ball.x,ball.y,'#ffffff',8,2);if(!demo(g))fx.pop(cl(ball.x,24,W-24),Math.max(30,ball.y-20),'STOLEN!','#ffffff');}
    break;}
   // through the hoop, from above
   if(!celebrate&&py<RY&&ball.y>=RY){for(const[i,hp]of HOOP.entries()){const x0=Math.min(hp.front,hp.back)+1.5,x1=Math.max(hp.front,hp.back)-1.5;if(ball.x>x0&&ball.x<x1){const dunk=!!ball.held;if(dunk){ball.held.hold=0;ball.held.cd=20;ball.held=null;ball.vy=2;ball.vx=0;}score(i===1?0:1,dunk);break;}}}}
  for(let i=0;i<2;i++)if(net[i]>0)net[i]=Math.max(0,net[i]-.025);
  if(celebrate>0&&--celebrate===0){if(sc[0]>=11||sc[1]>=11){if(demo(g)){sc[0]=sc[1]=0;}else{g.over=A.win(sc[0]>=11?0:1);return;}}newRules(false);place();}
  g.score=sc[0];};
 g.timeUp=()=>tu(sc[0],sc[1]);
 g._st=st;g._dbg=()=>({celebrate,dropT,banner});g._PL=PL;g._ball=ball;g._sc=sc;g._M=()=>M;g.fxClear=fx.clear;

 /* ---- the four courts ---- */
 const court=()=>X.cache('fh_'+theme,()=>{const c=A.c;
  if(theme==='gym'){X.sky(['#2a2440','#3a3050','#5a4a5a'],FL);
   for(let i=0;i<3;i++){const x=40+i*120;X.rr(x,24,80,40,3,X.lg(0,24,0,64,['#9ac8f0','#5a88c0']));c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x+39,24,2,40);c.fillRect(x,43,80,2);X.glow(x+40,44,60,'#c8e0ff',.12);}
   X.vg(0,96,W,FL-96,['#3a2e44','#2a2234']);for(let r=0;r<5;r++){const y=104+r*17;X.vg(0,y+10,W,5,['#5a4a5a','#3a2e3a']);for(let x=6+(r%2)*5;x<W;x+=10){const h=hash(x,r);X.disc(x,y+5,3.4,['#e8b088','#c68a5a','#8a5a3a','#f1c7a3'][h*4|0]);X.rr(x-4,y+7,8,6,2,['#2fd6c3','#ff4f9a','#ffcf3f','#4dabff','#e8e8e8','#7dff6a'][(h*97|0)%6]);}}
   for(const[x,col]of[[30,'#2fd6c3'],[250,'#ff4f9a']]){X.rr(x,70,40,20,2,col);c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x+4,78,32,2);}
   c.fillStyle='rgba(20,14,30,.55)';c.fillRect(0,100,W,FL-100);X.glow(160,150,150,'#ffe0b0',.1);
   c.fillStyle=X.lg(0,FL,0,H,['#c8884a','#a8683a','#7a4a2a']);c.fillRect(0,FL,W,H-FL);c.fillStyle='rgba(0,0,0,.12)';for(let x=0;x<W;x+=22)c.fillRect(x+((x/22)%2)*6,FL,1,H-FL);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,FL,W,1.5);X.glow(160,FL+12,120,'#ffe0b0',.12);
   c.fillStyle='rgba(255,255,255,.55)';c.fillRect(159,FL+2,2,H-FL-2);for(const x of[119,201])c.fillRect(x,FL+2,1.2,H-FL-2);}
  else if(theme==='beach'){X.sky(['#2a2a6a','#c85a7a','#ffb36a','#ffe0a0'],150);X.disc(220,132,22,'#fff0b0');X.glow(220,132,70,'#ffb36a',.5);
   X.vg(0,140,W,FL-140,['#2a6aa0','#1a4a7a']);c.fillStyle='rgba(255,220,160,.35)';for(let y=144;y<FL;y+=5)for(let x=(y*7)%23;x<W;x+=23)c.fillRect(x,y,8+(y%3)*3,1);
   for(const[x,s]of[[24,1],[300,-1]]){c.strokeStyle='#5a3a1a';c.lineWidth=4;c.beginPath();c.moveTo(x,FL);c.quadraticCurveTo(x+s*10,150,x+s*4,96);c.stroke();for(let k=0;k<6;k++){const a=k*1.05;X.ell(x+s*4+Math.cos(a)*14,96+Math.sin(a)*6,16,3.5,'#2a7a3a',a);}}
   c.fillStyle=X.lg(0,FL,0,H,['#f0d8a0','#d8b878','#b8985a']);c.fillRect(0,FL,W,H-FL);c.fillStyle='rgba(120,90,40,.18)';for(let i=0;i<220;i++){const x=hash(i,3)*W,y=FL+hash(i,5)*(H-FL);c.fillRect(x,y,2,1);}c.fillStyle='rgba(255,255,255,.6)';c.fillRect(159,FL+2,2,H-FL-2);}
  else if(theme==='roof'){X.sky(['#05061a','#10143a','#2a2050'],FL);X.stars(70,7,0,0,110,.9);X.disc(60,40,10,'#f0f0e0');X.glow(60,40,30,'#d8e0ff',.3);
   X.skyline(150,'#141830',0,3,'rgba(255,214,130,.5)');X.skyline(170,'#0c0e20',60,9,'rgba(140,190,255,.45)');
   c.strokeStyle='rgba(180,190,210,.25)';c.lineWidth=.6;for(let x=0;x<W;x+=6){c.beginPath();c.moveTo(x,140);c.lineTo(x+6,FL);c.moveTo(x+6,140);c.lineTo(x,FL);c.stroke();}c.fillStyle='#5a5e6a';c.fillRect(0,138,W,2);
   c.fillStyle=X.lg(0,FL,0,H,['#2a4a8a','#1a3060']);c.fillRect(0,FL,W,H-FL);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(0,FL+1,W,1);c.fillRect(159,FL+2,2,H-FL-2);}
  else{X.sky(['#5ab0ff','#a8d8ff','#e8f4ff'],FL);for(let i=0;i<4;i++){const x=30+i*80;X.disc(x,40+(i%2)*10,9,'#ffffff');X.disc(x+10,36+(i%2)*10,11,'#ffffff');X.disc(x+22,40+(i%2)*10,8,'#ffffff');}
   c.fillStyle='#a04a3a';c.fillRect(0,92,W,FL-92);c.fillStyle='rgba(0,0,0,.18)';for(let y=92;y<FL;y+=6){c.fillRect(0,y,W,.8);for(let x=((y/6)%2)*7;x<W;x+=14)c.fillRect(x,y,.8,6);}
   for(const[x,y,col,r]of[[70,130,'#ff4f9a',22],[110,140,'#ffcf3f',16],[200,128,'#2fd6c3',24],[240,146,'#7d6aff',14],[150,150,'#7dff6a',12]]){X.ell(x,y,r,r*.6,col,.3);X.ell(x-3,y-3,r*.5,r*.25,'rgba(255,255,255,.35)',.3);}
   c.fillStyle=X.lg(0,FL,0,H,['#4a4a52','#34343a']);c.fillRect(0,FL,W,H-FL);c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=.7;c.beginPath();c.moveTo(60,FL+4);c.lineTo(80,FL+14);c.lineTo(76,FL+26);c.moveTo(230,FL+8);c.lineTo(250,FL+12);c.stroke();c.fillStyle='rgba(255,255,255,.5)';c.fillRect(159,FL+2,2,H-FL-2);}});
 const hoopBack=h=>{const c=A.c,s=h.dir;
  const px=s>0?h.b1+2:h.b0-6;X.vg(px,126,4,FL-126,['#8a8e9a','#4a4e5a']);X.shadow(px+2,FL+2,8,2,.4);
  c.fillStyle='rgba(230,240,255,.28)';c.fillRect(h.b0,76,4,52);c.strokeStyle='#e8eef8';c.lineWidth=1;c.strokeRect(h.b0+.5,76.5,3,51);c.fillStyle='#ff7a2a';c.fillRect(s>0?h.b0:h.b1-1,96,1,14);
  c.strokeStyle='#ff6a1a';c.lineWidth=1.6;c.beginPath();if(c.ellipse)c.ellipse(h.x,RY,11,2.6,0,Math.PI,TAU);c.stroke();};
 const hoopFront=(h,i)=>{const c=A.c,sw=net[i];c.strokeStyle='rgba(245,245,250,.8)';c.lineWidth=.8;
  for(let k=0;k<=5;k++){const x0=h.x-11+k*4.4,x1=h.x-6+k*2.4+Math.sin(t*.5+k)*sw*3,y1=RY+22+sw*4;c.beginPath();c.moveTo(x0,RY);c.lineTo(x1,y1);c.stroke();}
  for(let j=1;j<=3;j++){const f=j/4,y=RY+22*f+sw*4*f,w=11-5*f;c.beginPath();c.moveTo(h.x-w,y);c.lineTo(h.x+w,y);c.stroke();}
  c.strokeStyle='#ff6a1a';c.lineWidth=1.8;c.beginPath();if(c.ellipse)c.ellipse(h.x,RY,11,2.6,0,0,Math.PI);c.stroke();};
 const player=p=>{const c=A.c,L=len()-p.sq*3,ux=Math.sin(p.th),uy=-Math.cos(p.th),nx=-uy,ny=ux,at=(f,o)=>[p.fx+ux*L*f+nx*(o||0),p.fy+uy*L*f+ny*(o||0)];
  const air=!p.gnd,hip=at(.42),neck=at(.8),head=at(.8,0),hr=8.4*Math.min(1.15,Math.max(.8,M.L)),hd=[head[0]+ux*hr,head[1]+uy*hr],jer=PC[p.team],dark=X.lt(jer,.45);
  X.shadow(p.fx,FL+2,9*Math.max(.3,1-(FL-p.fy)/120),2.2,.35);
  // legs (tucked in the air)
  for(const s of[-1,1]){const foot=air?[hip[0]-ux*L*.3+p.d*3+s*2,hip[1]-uy*L*.3]:[p.fx+s*3.2,p.fy-1],knee=[(hip[0]+foot[0])/2+p.d*(air?4:1.5),(hip[1]+foot[1])/2];
   X.stroke([hip,knee,foot],s<0?X.lt(p.skin,.8):p.skin,4.6);X.stroke([[foot[0],foot[1]-3.5],foot],'#f4f4f4',4.8);X.ell(foot[0]+p.d*1.8,foot[1]+.6,4.4,2.2,s<0?'#2a2a34':'#3a3a48');}
  // back arm, torso, shorts
  const sh=p.sh,ba=p.th-p.d*.35;
  X.stroke([sh,[sh[0]-Math.sin(ba)*12,sh[1]+Math.cos(ba)*12]],X.lt(p.skin,.75),4);
  X.stroke([at(.36),at(.76)],jer,13);X.stroke([at(.38),at(.46)],dark,13.5);X.stroke([at(.62,0),at(.62,0)],'#ffffff',3);
  X.stroke([at(.5,-2),at(.72,-2)],X.lt(jer,1.4),2);
  // head, hair and eyes on the ball
  X.disc(hd[0],hd[1],hr,p.skin);
  if(p.idx===0)X.disc(hd[0]+uy*0-ux*1,hd[1]-hr*.35,hr*.9,p.hair);else{c.save();c.beginPath();c.arc(hd[0],hd[1],hr,Math.PI+p.th-.2,TAU+p.th+.2);c.closePath();c.fillStyle=p.hair;c.fill();c.restore();X.stroke([[hd[0]-nx*hr,hd[1]-ny*hr],[hd[0]+nx*hr,hd[1]+ny*hr]],jer,1.6);}
  X.disc(hd[0],hd[1]+1,hr*.82,p.skin);
  const la=Math.atan2(ball.y-hd[1],ball.x-hd[0]);for(const s of[-1,1]){const ex=hd[0]+p.d*2.8+s*2.8,ey=hd[1]+.5;X.disc(ex,ey,2.3,'#ffffff');X.disc(ex+Math.cos(la)*1,ey+Math.sin(la)*1,1.15,'#141414');}
  if(p.down>0){c.fillStyle='rgba(255,255,255,.7)';for(let k=0;k<3;k++){const a=t*.2+k*2.1;c.fillRect(hd[0]+Math.cos(a)*7,hd[1]-hr-3+Math.sin(a)*1.5,1.5,1.5);}}
  // the throwing arm
  X.stroke([sh,p.hand],X.lt(p.skin,.7),5.4);X.stroke([sh,p.hand],p.skin,4.2);X.disc(p.hand[0],p.hand[1],2.6,X.lt(p.skin,.9));};
 const ballDraw=()=>{const c=A.c,r=M.r,x=ball.x,y=ball.y;X.shadow(x,FL+2,r*Math.max(.3,1-(FL-y)/140),r*.25,.3);
  if(M.kind===1){c.save();c.translate(x,y);c.rotate(ball.rot);const C=['#ff4f6d','#ffffff','#4dabff','#ffffff','#ffcf3f','#ffffff'];for(let i=0;i<6;i++){c.fillStyle=C[i];c.beginPath();c.moveTo(0,0);c.arc(0,0,r,i*TAU/6,(i+1)*TAU/6);c.closePath();c.fill();}c.restore();X.disc(x,y,r*.22,'#ffffff');X.ell(x-r*.35,y-r*.4,r*.3,r*.18,'rgba(255,255,255,.6)',-.5);}
  else if(M.kind===2){X.orb(x,y,r,'#2a3a7a');c.save();c.translate(x,y);c.rotate(ball.rot);for(const[a,b]of[[-1.6,-1.6],[1.2,-2],[-.3,-2.8]])X.disc(a*r*.22,b*r*.18,r*.16,'#0a0e20');c.restore();}
  else{X.orb(x,y,r,'#ff7a2a');c.save();c.translate(x,y);c.rotate(ball.rot);c.strokeStyle='rgba(40,16,0,.75)';c.lineWidth=.8;c.beginPath();c.moveTo(-r,0);c.lineTo(r,0);c.moveTo(0,-r);c.lineTo(0,r);c.stroke();c.beginPath();c.arc(-r*1.15,0,r*.8,-1,1);c.stroke();c.beginPath();c.arc(r*1.15,0,r*.8,Math.PI-1,Math.PI+1);c.stroke();c.restore();}};
 g.draw=()=>{const c=A.c;court();
  if(theme==='roof'&&lo())for(let i=0;i<14;i++){const x=12+i*22,y=26+Math.sin(i*.9)*4,on=(i+Math.floor(t/20))%5;X.disc(x,y,1.6,['#ffcf3f','#ff4f9a','#5ae8ff','#7dff6a','#ffffff'][on]);X.glow(x,y,7,['#ffcf3f','#ff4f9a','#5ae8ff','#7dff6a','#ffffff'][on],.4);}
  if(theme==='gym'&&lo())for(let i=0;i<8;i++){const x=20+i*40,y=104+(i%5)*17;if((t+i*19)%60<10){c.globalAlpha=.45;X.disc(x,y+3-Math.abs(Math.sin(t*.3))*3,3.4,'#f1c7a3');c.globalAlpha=1;}}
  if(theme==='beach'&&lo()){c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<5;i++){const x=((t*.3+i*70)%360)-20;c.fillRect(x,150+i*9,14,1);}}
  // the three-point marks
  c.fillStyle='rgba(255,255,255,.35)';for(const h of HOOP){const x=h.x-h.dir*170;c.fillRect(x-.6,FL+3,1.2,H-FL-6);}
  HOOP.forEach(hoopBack);
  const order=PL.slice().sort((a,b)=>a.idx-b.idx);for(const p of order)player(p);
  ballDraw();
  HOOP.forEach(hoopFront);
  if(lo()&&!ball.held&&hyp(ball.vx,ball.vy)>3)X.glow(ball.x,ball.y,M.r*2,'#ffb36a',.25);
  fx.draw();
  X.panel(108,2,104,24,'#ffcf3f');X.ot(sc[0],140,6,PC[0],2,'c');X.ot(sc[1],180,6,PC[1],2,'c');A.text('-',160,8,'#ffffff',1,'c');A.text(A.nm(0),116,8,PC[0],1);A.text(A.nm(1),204,8,PC[1],1,'r');A.text(M.n,160,18,'#ffcf3f',1,'c');
  if(banner>0&&!demo(g)||banner>0&&t<200){const a=Math.min(1,banner/20);c.globalAlpha=a;X.ot(M.n+'!',160,62,'#ffcf3f',3,'c');A.text('FIRST TO 11',160,84,'#ffffff',1,'c');c.globalAlpha=1;}
  if(shout&&shout.t>0){shout.t--;const k=Math.min(1,shout.t/15),z=shout.t>60?1+(shout.t-60)*.04:1;c.globalAlpha=k;X.ot(shout.txt,shout.x,78-(70-shout.t)*.2,shout.col,2,'c');c.globalAlpha=1;void z;}};
 return g;}});
})();
