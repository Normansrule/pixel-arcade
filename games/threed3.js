(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const pjOK=p=>p&&p[2]>.1&&isFinite(p[0])&&isFinite(p[1]);
const jet=(x,y,bank,s,col)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(bank||0);c.scale(s||1,s||1);X.glow(0,7,12+Math.sin(A.t*.8)*3,'#40a0ff',.6);X.poly([[0,-11],[-16,7],[-5,4],[0,7],[5,4],[16,7]],X.lg(-16,0,16,0,[X.lt(col||'#2fe8d0',.6),col||'#2fe8d0',X.lt(col||'#2fe8d0',.6)]));X.poly([[0,-11],[-3.5,2],[0,4],[3.5,2]],'#e0fffa');X.poly([[-16,7],[-18,1],[-12,5]],'#ff4f6d');X.poly([[16,7],[18,1],[12,5]],'#ff4f6d');X.disc(0,8,2.4,A.t%4<2?'#ffd040':'#ff8020');c.restore();};
const ringN=(x,y,z,r,col,col2)=>{for(let i=0;i<12;i++){const a=i*.5236,b=a+.5236;F([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*(r+.32),y+Math.sin(b)*(r+.32),z],[x+Math.cos(a)*(r+.32),y+Math.sin(a)*(r+.32),z]],i%2?col:(col2||col),false);}};
const sky=(top,bot)=>A.skyband(top,bot,130);
const ring3=(x,y,z,r,col)=>{for(let i=0;i<8;i++){const a=i*.785,b=a+.785;F([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*(r+.3),y+Math.sin(b)*(r+.3),z],[x+Math.cos(a)*(r+.3),y+Math.sin(a)*(r+.3),z]],col,false);}};

/* ---- RING RACE 3D ---- */
A.add({id:'rings',name:'RING RACE 3D',cat:'RETRO 3D',hd:1,tags:'ring race flight plane 3d time trial',how:'FLY THROUGH RINGS FOR TIME. CHAINS RAISE THE MULTIPLIER. GOLD RINGS BOOST. DODGE MINES.',make(){
 // rings follow a flowing ribbon; each ring adds time, a chain without misses raises the multiplier, mines cost time
 const g={over:null,score:0},fx=X.fx();
 const LAND=[
  {n:'GREEN VALLEY',top:'#1a2a6a',bot:'#ff9838',grd:'#1e5a35',line:'#2a7a45',hill:'#3a4a6a',hill2:'#2a5a4a',fog:'#6a7a5a',tree:'#1a4a2a',sun:'#ffe8a0'},
  {n:'SAPPHIRE BAY',top:'#0a3a7a',bot:'#9ae0ff',grd:'#1a5a9a',line:'#3a8ad0',hill:'#4a6a9a',hill2:'#2a4a7a',fog:'#7aa8d0',tree:'#d8c890',sun:'#ffffff'},
  {n:'NEON NIGHT',top:'#05031a',bot:'#4a1a6a',grd:'#0e0a24',line:'#ff3f8e',hill:'#1a0a3a',hill2:'#2a0a4a',fog:'#20103a',tree:'#2fe8d0',sun:'#ff6ab0'}];
 let px=0,py=2,z=0,v=.22,time=1500,rings=[],mines=[],roll=0,chain=0,mult=1,boostT=0,miss=0,got=0,course=0,banner=100,nz=10,trees=[],hitT=0;
 const path=zz=>[Math.sin(zz*.021)*3+Math.sin(zz*.007)*1.5,2.3+Math.sin(zz*.017+1)*1.3];
 const fill=()=>{while(nz<z+90){const [x,y]=path(nz),gold=Math.random()<.12;rings.push({z:nz,x,y,ok:0,gold});
   if(nz>40&&Math.random()<.35+Math.min(.3,z*.0004)){const s=Math.random()<.5?-1:1;mines.push({z:nz+5,x:x+s*(1.6+rnd(1.2)),y:y+rnd(1.6)-.8,ph:rnd(6)});}
   nz+=Math.max(7,11-Math.floor(z/400));}};
 for(let i=0;i<40;i++)trees.push({x:(Math.random()<.5?-1:1)*(7+rnd(10)),z:rnd(80)});
 fill();
 g._s=()=>({px,py,z,time,chain,mult,got,miss,course});g._r=()=>rings;g._m=()=>mines;
 g.update=()=>{const k=A.in(0);time--;if(hitT)hitT--;
  px=cl(px+ax(k)*.14,-6,6);py=cl(py-ay(k)*.12,.5,5);roll+=(ax(k)*.45-roll)*.12;
  const top=.24+Math.min(.12,z*.00008);v+=((boostT?top*1.7:top)-v)*.06;if(boostT)boostT--;z+=v;fill();
  for(const r of rings){if(!r.ok&&r.z<z+1.5){r.ok=1;if(Math.hypot(px-r.x,py-r.y)<1.35){r.ok=2;got++;chain++;if(chain%5===0&&mult<5){mult++;fx.pop(160,82,'X'+mult+' MULTIPLIER',K.y);S('power');}
     const add=r.gold?90:45;time=Math.min(1800,time+add);g.score+=10*mult*(r.gold?3:1);S('coin');fx.ring(160,130,r.gold?'#ffd040':'#ffffff',60);fx.spark(160,130,r.gold?K.y:'#a0fff0',16,3);fx.pop(160,104,'+'+(add/60).toFixed(1)+' SEC',K.g);
     if(r.gold){boostT=150;fx.flash('#ffe080',6);fx.pop(160,94,'BOOST!',K.y);}}
    else{miss++;chain=0;mult=1;S('lose');fx.pop(160,104,'MISSED','#ff6a6a');}}}
  for(const m of mines){if(!m.hit&&Math.abs(m.z-(z+1.5))<.5&&Math.hypot(px-m.x,py-m.y)<1){m.hit=1;time-=180;chain=0;mult=1;hitT=30;A.shake=7;S('boom');fx.flash('#ff3020',8);fx.spark(160,130,'#ff9040',22,3.5);fx.pop(160,94,'-3 SEC','#ff5a4a');}}
  rings=rings.filter(r=>r.z>z-3);mines=mines.filter(m=>m.z>z-3);
  for(const t of trees)if(t.z<z-2){t.z+=80+rnd(10);t.x=(Math.random()<.5?-1:1)*(7+rnd(10))+px;}
  const c=Math.floor(z/500)%3;if(c!==course){course=c;banner=110;S('score');fx.flash('#ffffff',6);}if(banner)banner--;
  if(time<=0){time=0;g.over='TIME UP';}};
 g.draw=()=>{const P=LAND[course],cc=A.c;
  A.skyband(P.top,P.bot,131);X.glow(220,110,70,P.sun,.45);X.disc(220,112,16,P.sun);if(course===2)X.stars(70,4,px*8,0,110,.9);
  X.hills(131,22,P.hill,px*8+z*.3,.018,3);X.hills(131,12,P.hill2,px*14+z*.6,.03,7);R(0,130,W,110,P.grd);
  A.fog={col:P.fog,near:25,far:62};A.cam.x=px*.9;A.cam.y=py*.9+.7;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=-.08;
  for(let i=-6;i<=6;i+=2){const a=A.p3(px*.9+i*3,0,z+1),b=A.p3(px*.9+i*3,0,z+55);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],P.line);}
  for(let zz=Math.floor(z/3)*3;zz<z+55;zz+=3){const a=A.p3(px*.9-20,0,zz),b=A.p3(px*.9+20,0,zz);if(a[2]>.1)L(a[0],a[1],b[0],b[1],P.line);}
  for(const t of trees){if(t.z<z||t.z>z+60)continue;if(course===1){B3(t.x,0,t.z,1.2,.5,1.2,P.tree);B3(t.x,.5,t.z,.15,2.2,.15,'#a08050');B3(t.x,2.6,t.z,1.6,.15,.5,'#2a8a4a');}
   else if(course===2){B3(t.x,0,t.z,1.4,3+((t.z*7)%4),1.4,'#1a1430');B3(t.x,3+((t.z*7)%4),t.z,1.5,.12,1.5,P.tree);}
   else{B3(t.x,0,t.z,.3,1,.3,'#5a3a1a');B3(t.x,1,t.z,1.6,1.4,1.6,P.tree);B3(t.x,2.4,t.z,1,.8,1,X.lt(P.tree,1.3));}}
  rings.forEach(r=>{if(r.z>z-1&&r.z<z+62){const near=r.z-z<14;const c1=r.ok===2?K.g:r.ok?K.gr:r.gold?'#ffd040':near?'#ffffff':'#ff9a3f',c2=r.ok?'#556':r.gold?'#fff4a0':near?'#40e0ff':'#ffd080';ringN(r.x,r.y,r.z,1.3,c1,c2);A.shadow3(r.x,r.z,2.8,.4);}});
  A.shadow3(px,z+1.5,1.4,1);A.flush();A.fog=null;
  mines.slice().sort((a,b)=>b.z-a.z).forEach(m=>{if(m.hit||m.z<z||m.z>z+55)return;const s=A.p3(m.x,m.y+Math.sin(A.t*.08+m.ph)*.2,m.z);if(!pjOK(s))return;const r=Math.min(14,26/s[2]);X.glow(s[0],s[1],r*2.4,'#ff3020',.25+.15*Math.sin(A.t*.3+m.ph));X.orb(s[0],s[1],r,'#3a3a48');for(let i=0;i<6;i++){const a=i*1.047+A.t*.02;X.disc(s[0]+Math.cos(a)*r*1.1,s[1]+Math.sin(a)*r*1.1,Math.max(1,r*.22),'#8a8a9a');}X.disc(s[0],s[1],Math.max(1,r*.3),A.t%20<10?'#ff3020':'#ff9070');});
  // trail of the ribbon to read ahead
  const nx=rings.filter(r=>!r.ok&&r.z>z).sort((a,b)=>a.z-b.z)[0];if(nx){const q=A.p3(nx.x,nx.y,nx.z);if(pjOK(q)){X.glow(q[0],q[1],Math.min(40,120/q[2]),'#ffe060',.3);const dx=q[0]-160,dy=q[1]-140,dd=Math.hypot(dx,dy);if(dd>50){const ux=dx/dd,uy=dy/dd,ax2=160+ux*44,ay2=140+uy*44;X.poly([[ax2+ux*8,ay2+uy*8],[ax2-uy*5,ay2+ux*5],[ax2+uy*5,ay2-ux*5]],'rgba(255,230,100,.8)');}}}
  if(boostT){cc.strokeStyle='rgba(255,240,180,.4)';cc.lineWidth=1;for(let i=0;i<12;i++){const a=i*.52+.2,r0=70+((A.t*9+i*37)%90);cc.beginPath();cc.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0*.6);cc.lineTo(160+Math.cos(a)*(r0+26),120+Math.sin(a)*(r0+26)*.6);cc.stroke();}}
  const s=A.p3(px,py,z+1.5);if(pjOK(s)&&(!hitT||A.t%6<3))jet(s[0],s[1],roll,1,boostT?'#ffd040':undefined);
  if(hitT){cc.fillStyle='rgba(255,40,30,'+(hitT/90)+')';cc.fillRect(0,0,W,H);}
  X.vignette(.25);fx.draw();
  X.panel(118,3,84,22,K.y);X.ot(String(g.score),160,8,'#ffffff',2,'c');
  T('RINGS '+got,6,6,'#ffffff',1);if(mult>1)X.ot('X'+mult,6,16,K.y,2);
  X.meter(W-90,5,84,8,Math.min(1,time/1500),time<300?K.r:K.g);T(Math.ceil(time/60)+'',W-96,5,time<300?K.r:'#ffffff',1,'r');
  if(banner){cc.globalAlpha=Math.min(1,banner/20);X.ot('COURSE '+(Math.floor(z/500)+1),160,46,'#ffffff',1,'c');X.ot(P.n,160,56,P.bot,3,'c');cc.globalAlpha=1;}};
 return g;}});
/* ---- CANYON RUN 3D ---- */
A.add({id:'canyon',name:'CANYON RUN 3D',cat:'RETRO 3D',hd:1,tags:'canyon flight jet flyer 3d dodge',how:'STEER + UP/DOWN ALTITUDE. HOLD A TO BOOST. GRAB CRYSTALS, DODGE ROCKS. 3 HULL.',make(){
 // a jet threads a winding canyon. walls, pillars and rock bridges cost hull (3); crystals fill boost and build a combo; every 300 m a new sector
 const g={over:null,score:0},fx=X.fx();
 const SEC=[
  {n:'RED GORGE',top:'#ff7a3a',bot:'#ffd27a',sun:'#fff0c0',wa:'#b5651d',wb:'#8a4a1d',ua:'#d08040',ub:'#a05a28',rim:'#e0a060',fl:'#c4915a',fl2:'#b8864f',riv:'#4ab0d8',fog:'#ffb070',mesa:'#c0703a'},
  {n:'DUSK PASS',top:'#3a1a6a',bot:'#ff7aa8',sun:'#ffd0e0',wa:'#7a3a6a',wb:'#5a2a50',ua:'#a0507a',ub:'#7a3a5a',rim:'#c87090',fl:'#8a5a7a',fl2:'#7a4e6c',riv:'#80d0ff',fog:'#b06090',mesa:'#5a2a5a'},
  {n:'MOON RIFT',top:'#040818',bot:'#1a3a6a',sun:'#e8f0ff',wa:'#2a3a5a',wb:'#1c2840',ua:'#3a5070',ub:'#283850',rim:'#5a7aa0',fl:'#24304a',fl2:'#1e2a42',riv:'#40ffe0',fog:'#10203a',mesa:'#16243e'},
  {n:'EMBER DEEP',top:'#1a0404',bot:'#7a1a0a',sun:'#ffb040',wa:'#4a1a12',wb:'#34120c',ua:'#6a2a18',ub:'#4a1c10',rim:'#8a3a20',fl:'#3a1a12',fl2:'#30160e',riv:'#ff7a20',fog:'#4a1208',mesa:'#2a0a06'}];
 const cx=z=>Math.sin(z*.03)*4+Math.sin(z*.011)*3,
  hw=z=>Math.max(3.1,6.2-(z%300)/300*1.1-Math.floor(z/300)*.3),
  sec=z=>SEC[((Math.floor(z/300)%4)+4)%4];
 let px=0,py=1.6,z=0,v=.22,bank=0,pitch=0,hp=3,inv=0,boost=.5,boosting=0,dist=0,bonus=0,combo=1,chain=0,skim=0,banner=90,lastSec=0,obs=[],nextZ=36,crystals=0,hits=0;
 const add=o=>obs.push(o);
 const spawn=()=>{ // drop the next obstacle pattern far ahead
  const zz=nextZ,s=Math.floor(zz/300),r=Math.random(),c=cx(zz),w=hw(zz);
  if(Math.floor((zz+16)/300)>s){add({t:'g',z:(s+1)*300,x:cx((s+1)*300),y:2});nextZ=(s+1)*300+14;return;}
  if(r<.34){const side=Math.random()<.5?-1:1,yy=.9+Math.random()*2.6;for(let i=0;i<5;i++){const q=zz+i*2.2;add({t:'c',z:q,x:cx(q)+side*(w*.35)*Math.cos(i*.5),y:yy+Math.sin(i*.9)*.6});}nextZ+=14;}
  else if(r<.62){const side=Math.random()<.5?-1:1;add({t:'p',z:zz,x:c+side*w*(.3+Math.random()*.25),r:.75+Math.random()*.35});
   if(s>0&&Math.random()<.5)add({t:'p',z:zz+5,x:c-side*w*.4,r:.8});
   add({t:'c',z:zz,x:c-side*w*.35,y:1.6});nextZ+=11-Math.min(4,s);}
  else if(r<.84){const low=Math.random()<.5;add({t:'a',z:zz,lo:low?0:2.3,hi:low?1.9:3.4});add({t:'c',z:zz,x:c,y:low?2.9:1.2});nextZ+=12-Math.min(4,s);}
  else{add({t:'p',z:zz,x:c-w*.45,r:.8});add({t:'p',z:zz,x:c+w*.45,r:.8});add({t:'c',z:zz,x:c,y:2});nextZ+=12;}
 };
 const hurt=(why)=>{if(inv)return;hp--;hits++;inv=70;v*=.55;combo=1;chain=0;A.shake=9;S('boom');fx.flash('#ff3020',8);const s=A.p3(px,py,z+1.5);if(pjOK(s)){fx.spark(s[0],s[1],'#ffd080',22,3.5);fx.debris(s[0],s[1],'#8a6a4a',10,2.5);}fx.pop(160,90,why,'#ff6a5a');if(hp<=0){g.over='WRECKED';}};
 g._s=()=>({px,py,z,v,hp,boost,combo,obs:obs.length,crystals,hits,sector:Math.floor(z/300)});g._o=()=>obs;g._c=zz=>[cx(zz),hw(zz)];
 g.update=()=>{const k=A.in(0);
  while(nextZ<z+70)spawn();
  const c=cx(z),w=hw(z);
  px+=ax(k)*.15;py=cl(py-ay(k)*.09,.55,4.4);bank+=(ax(k)*.5-bank)*.15;pitch+=(-ay(k)*.25-pitch)*.15;
  boosting=k.a&&boost>0.02?1:0;if(boosting)boost=Math.max(0,boost-.006);
  const base=.24+Math.min(.16,z*.00005),tv=base*(boosting?1.6:1);v+=(tv-v)*.04;z+=v;dist+=v*(boosting?2:1);
  if(inv)inv--;
  // walls: hit when you clip one, then get shoved back to the middle
  const off=px-c;if(Math.abs(off)>w-.55){hurt('SCRAPED!');px=c+Math.sign(off)*(w-.95);}
  else if(Math.abs(off)>w-1.25){skim++;if(skim%6===0){bonus+=2*combo;const s=A.p3(c+Math.sign(off)*(w-.2),py,z+1.5);if(pjOK(s))fx.spark(s[0],s[1],'#ffe0a0',3,2);}}else skim=0;
  for(const o of obs){if(o.done||o.z>z+1.5+.45||o.z<z+1.5-.45)continue;
   if(o.t==='c'){if(Math.hypot(px-o.x,py-o.y)<1.05){o.done=1;crystals++;chain++;if(chain%5===0&&combo<5){combo++;fx.pop(160,74,'COMBO X'+combo,K.y);}bonus+=10*combo;boost=Math.min(1,boost+.12);S('coin');const s=A.p3(o.x,o.y,o.z);if(pjOK(s)){fx.ring(s[0],s[1],'#a0fff0',18,10);fx.spark(s[0],s[1],'#e0fff8',8,2);}}}
   else if(o.t==='p'){if(Math.abs(px-o.x)<o.r+.45){o.done=1;hurt('ROCK!');}else if(Math.abs(px-o.x)<o.r+1.3){o.done=1;bonus+=10*combo;fx.pop(160,80,'CLOSE +'+10*combo,'#ffe080');S('blip');}}
   else if(o.t==='a'){o.done=1;if(py>o.lo-.35&&py<o.hi+.35)hurt('BRIDGE!');else{bonus+=10*combo;S('blip');}}
   else if(o.t==='g'){o.done=1;if(Math.hypot(px-o.x,py-o.y)<2.2){bonus+=100;hp=Math.min(3,hp+1);fx.flash('#ffffff',8);fx.pop(160,70,'GATE +100  HULL +1',K.g);S('score');}}}
  for(const o of obs)if(o.t==='c'&&!o.done&&o.z<z+.6){o.done=2;chain=0;}
  obs=obs.filter(o=>o.z>z-2);
  const sn=Math.floor(z/300);if(sn!==lastSec){lastSec=sn;banner=110;S('score');}if(banner)banner--;
  g.score=Math.floor(dist)+bonus;
 };
 g.draw=()=>{const P=sec(z),c0=cx(z),cc=A.c;
  A.skyband(P.top,P.bot,120);X.glow(160+(c0-cx(z+40))*6,70,110,P.sun,.35);X.disc(160+(c0-cx(z+40))*6,70,Math.floor(z/300)%4===2?12:18,P.sun);
  if(Math.floor(z/300)%4===2)X.stars(70,5,px*6,0,100,.9);
  X.hills(118,26,P.mesa,px*6+z*.6,.02,4);X.hills(122,14,X.lt(P.mesa,.8),px*10+z*1.2,.035,9);
  A.fog={col:P.fog,near:18,far:46};A.cam.x=px;A.cam.y=py+1.1;A.cam.z=z-3.6;A.cam.ry=Math.atan((cx(z+8)-c0)/8)*.6;A.cam.rx=-.12+pitch*.15;
  for(let zz=Math.floor(z)-1;zz<z+44;zz++){const a=cx(zz),b=cx(zz+1),wa=hw(zz),wb=hw(zz+1),Q=sec(zz),odd=zz%2,band=zz%5===0,h=4.6+(zz*7%3),hm=h*.45;
   F([[a-wa,0,zz],[a+wa,0,zz],[b+wb,0,zz+1],[b-wb,0,zz+1]],odd?Q.fl:Q.fl2);
   F([[a-1.1,.02,zz],[a+1.1,.02,zz],[b+1.1,.02,zz+1],[b-1.1,.02,zz+1]],Q.riv,false);if(zz%3===0)F([[a-.5,.03,zz],[a+.1,.03,zz],[b+.1,.03,zz+1],[b-.5,.03,zz+1]],X.lt(Q.riv,1.5),false);
   const w1=band?X.lt(Q.wa,.8):odd?Q.wa:X.lt(Q.wa,.92),w2=band?X.lt(Q.wb,.8):odd?Q.wb:X.lt(Q.wb,.92);
   F([[a-wa,0,zz],[a-wa,hm,zz],[b-wb,hm,zz+1],[b-wb,0,zz+1]],w1);F([[a-wa,hm,zz],[a-wa-.7,h,zz],[b-wb-.7,h,zz+1],[b-wb,hm,zz+1]],odd?Q.ua:X.lt(Q.ua,.92));
   F([[a+wa,0,zz],[a+wa,hm,zz],[b+wb,hm,zz+1],[b+wb,0,zz+1]],w2);F([[a+wa,hm,zz],[a+wa+.7,h,zz],[b+wb+.7,h,zz+1],[b+wb,hm,zz+1]],odd?Q.ub:X.lt(Q.ub,.92));
   F([[a-wa-.7,h,zz],[a-wa-4,h,zz],[b-wb-4,h,zz+1],[b-wb-.7,h,zz+1]],Q.rim);F([[a+wa+.7,h,zz],[a+wa+4,h,zz],[b+wb+4,h,zz+1],[b+wb+.7,h,zz+1]],X.lt(Q.rim,.9));}
  const Q=P;
  for(const o of obs){if(o.z<z-1||o.z>z+44)continue;const q=sec(o.z);
   if(o.t==='p'){B3(o.x,0,o.z,o.r*2,7,o.r*2,q.wa);B3(o.x,7,o.z,o.r*2.4,.5,o.r*2.4,q.rim);A.shadow3(o.x+.5,o.z+.4,o.r*2.4,o.r*2);}
   else if(o.t==='a'){const c=cx(o.z),w=hw(o.z);if(o.lo===0){for(let i=-2;i<=2;i++)B3(c+i*w*.42,0,o.z+(i%2)*.3,w*.5,o.hi-(Math.abs(i)%2)*.25,1.4,i%2?q.wa:q.wb);B3(c,o.hi-.1,o.z,w*2,.12,1.3,X.lt(q.rim,1.1));}
    else{B3(c,o.lo,o.z,w*2+1.6,o.hi-o.lo,1.2,q.ua);B3(c,o.hi,o.z,w*2+1.6,.15,1.25,q.rim);for(let i=-1;i<=1;i+=2)B3(c+i*(w*.55),o.lo-.4,o.z,.6,.4,.6,q.wb);}}
   else if(o.t==='g'){ringN(o.x,o.y,o.z,2,'#ffffff','#40ffe0');}}
  A.shadow3(px,z+1.5,1.6-py*.15,1.1-py*.1);A.flush();A.fog=null;
  // crystals (2D, far to near)
  obs.filter(o=>o.t==='c'&&!o.done&&o.z>z+.5&&o.z<z+44).sort((a,b)=>b.z-a.z).forEach(o=>{const s=A.p3(o.x,o.y,o.z);if(!pjOK(s))return;const r=Math.min(12,22/s[2]);X.glow(s[0],s[1],r*3,'#60ffe0',.35);X.gem(s[0],s[1]+Math.sin(A.t*.1+o.z)*r*.2,r,'#5affe0');});
  const s=A.p3(px,py,z+1.5);if(pjOK(s)&&(!inv||A.t%6<4)){if(boosting){X.glow(s[0],s[1]+10,26,'#80c0ff',.5);for(let i=0;i<3;i++)X.disc(s[0]+(i-1)*5,s[1]+12+i%2*4+ri(4),2,'#a0e0ff');}jet(s[0],s[1],bank,1.05+py*.03,inv?'#ff8070':'#2fe8d0');}
  if(boosting||v>.36){cc.strokeStyle='rgba(255,255,255,.35)';cc.lineWidth=1;for(let i=0;i<12;i++){const a=i*.52+.2,r0=70+((A.t*9+i*37)%90);cc.beginPath();cc.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0*.6);cc.lineTo(160+Math.cos(a)*(r0+26),120+Math.sin(a)*(r0+26)*.6);cc.stroke();}}
  const m=Math.abs(px-cx(z))/(hw(z)-.55);if(m>.72&&A.t%10<6)X.ot('TOO CLOSE!',160,196,'#ff4040',1,'c');
  X.vignette(.3);fx.draw();
  X.panel(118,3,84,22,Q.riv);X.ot(String(g.score),160,8,'#ffffff',2,'c');
  for(let i=0;i<3;i++)X.heart(10+i*13,10,1.3,i<hp?'#ff4f6d':'rgba(255,255,255,.2)');
  T('BOOST',6,22,'#c0e8ff',1);X.meter(32,22,60,5,boost,boost>.3?'#5affe0':'#ff9040');
  T((dist/10|0)+' M',W-6,8,'#ffffff',1,'r');if(combo>1)X.ot('X'+combo,W-6,18,K.y,2,'r');
  if(banner){cc.globalAlpha=Math.min(1,banner/20);X.ot('SECTOR '+(Math.floor(z/300)+1),160,46,'#ffffff',1,'c');X.ot(Q.n,160,56,Q.riv,3,'c');cc.globalAlpha=1;}};
 return g;}});
/* ---- BRICK BREAKER 3D ---- */
A.add({id:'bricks3d',name:'BRICK BREAKER 3D',cat:'RETRO 3D',hd:1,how:'MOVE THE PADDLE. A LAUNCHES. CLEAR THE WALL.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,b,br=[],lives=3,stuck=true,lvl=0,trail=[];
 const PAL=[[K.r,K.o,K.y,K.g],['#ff4f9a','#b070ff','#4dabff','#2fd6c3'],['#ffcf3f','#ff9838','#ff4f6d','#c040a0']],build=()=>{lvl++;br=[];if(lvl>1){fx.flash('#ffffff',8);fx.pop(160,110,'LEVEL '+lvl,'#ffcf3f');}const P=PAL[(lvl-1)%3];for(let r=0;r<4;r++)for(let c=0;c<7;c++)br.push({x:(c-3)*1.2,y:.5+r*.8,c:P[r]});};const nb=()=>{b={x:0,y:.4,z:0,vx:0,vz:.16+lvl*.02};stuck=true;};build();nb();
 const boom=q=>{const p=A.p3(q.x,q.y,13);if(pjOK(p)){fx.spark(p[0],p[1],q.c,14,2.6);fx.debris(p[0],p[1],q.c,8,2);fx.ring(p[0],p[1],'#ffffff',14,10);}A.shake=Math.max(A.shake||0,1.5);};
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-3.5,3.5);if(stuck){b.x=px;b.z=.3;if(A.hit(0).a){stuck=false;b.vx=rnd(.1)-.05;}return;}
  b.x+=b.vx;b.z+=b.vz;if(Math.abs(b.x)>4.2){b.vx*=-1;b.x=cl(b.x,-4.2,4.2);S('blip');}if(b.z>14){b.vz*=-1;S('blip');}
  const q=br.find(q=>Math.abs(q.x-b.x)<.7&&b.z>12.6&&b.z<13.6&&b.y===undefined?false:Math.abs(q.x-b.x)<.7&&Math.abs(13-b.z)<.5&&Math.abs(q.y-b.y)<.5);
  if(q){boom(q);br.splice(br.indexOf(q),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}else if(b.z>12.5&&b.z<13.5){const any=br.find(q=>Math.abs(q.x-b.x)<.7&&Math.abs(q.y-b.y)<.5);if(any){boom(any);br.splice(br.indexOf(any),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}}
  if(b.vz<0&&b.z<.4&&b.z>-.2&&Math.abs(b.x-px)<1.1){b.vz*=-1;b.vx=(b.x-px)*.12;b.y=.4;S('blip');const p=A.p3(b.x,.4,0);if(pjOK(p))fx.ring(p[0],p[1],'#2fe8d0',16);}if(b.z<-1){lives--;S('lose');A.shake=5;if(lives<=0)g.over='GAME OVER';else nb();}
  if(!stuck)b.y=.4+Math.abs(Math.sin(b.z*.4))*2.2;trail.push([b.x,b.y,b.z]);if(trail.length>8)trail.shift();};
 g.draw=()=>{X.cache('b3d_bg',()=>{X.sky(['#05030f','#0e0628','#1a0a30']);X.glow(90,60,90,'#6a2aa8',.3);X.glow(240,80,80,'#2a5ac8',.25);X.glow(170,40,50,'#ff4f9a',.12);X.stars(90,6,0,0,H,.7);for(let i=0;i<10;i++){const sx=(i*97)%W,sy=(i*41)%90;X.glow(sx,sy,4,'#ffffff',.4);}});const wp=A.p3(0,1.8,14.4);if(pjOK(wp))X.glow(wp[0],wp[1],110,PAL[(lvl-1)%3][1],.16);A.cam.x=px*.3;A.cam.y=2.8;A.cam.z=-4;A.cam.ry=0;A.cam.rx=-.32;F([[-4.5,0,-1],[4.5,0,-1],[4.5,0,14],[-4.5,0,14]],'#1a1440',false);
  for(let z=0;z<=14;z+=2){const a=A.p3(-4.5,0,z),c=A.p3(4.5,0,z);L(a[0],a[1],c[0],c[1],'#3a2a77');}for(let x=-4;x<=4;x+=2){const a=A.p3(x,0,-1),c=A.p3(x,0,14);L(a[0],a[1],c[0],c[1],'#2b2257');}
  B3(-4.6,0,6.5,.3,1,15,'#4a4570');B3(4.6,0,6.5,.3,1,15,'#4a4570');const nc=A.t%40<20?'#ff3f8e':'#ff6ab0';B3(-4.6,1,6.5,.32,.08,15,nc);B3(4.6,1,6.5,.32,.08,15,nc);B3(0,0,14.6,9.5,3.8,.3,'#2a2450');
  br.forEach(q=>{B3(q.x,q.y-.3,13,1,.6,.8,q.c);B3(q.x,q.y+.3,13,.9,.06,.7,X.lt(q.c,1.4));});
  B3(px,0,0,2,.4,.5,K.c);B3(px,.4,0,1.6,.06,.4,'#c0fff6');B3(px-1.05,.05,0,.12,.5,.55,'#ff4f9a');B3(px+1.05,.05,0,.12,.5,.55,'#ff4f9a');A.shadow3(b.x,b.z,.5,.5);A.flush();
  trail.forEach((t,i)=>{const p=A.p3(t[0],t[1]+.2,t[2]);if(pjOK(p))X.disc(p[0],p[1],Math.max(.5,i*.35*4/p[2]),'rgba(160,240,255,'+(i/trail.length*.4)+')');});const bp=A.p3(b.x,b.y+.2,b.z);if(pjOK(bp)){const r=Math.max(2,Math.min(16,24/bp[2]));X.glow(bp[0],bp[1],r*3,'#a0f0ff',.6);X.orb(bp[0],bp[1],r,'#e8fbff');}const pp=A.p3(px,.2,0);if(pjOK(pp))X.glow(pp[0],pp[1],30,'#2fe8d0',.25);
  fx.draw();X.bar('SCORE '+g.score,'','LEVEL '+lvl,K.y);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1.3,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');if(stuck)X.ot('A TO LAUNCH',160,200,'#ffffff',1,'c');};
 return g;}});

/* ---- HOVER TANK 3D ---- */
A.add({id:'hover',name:'HOVER TANK 3D',cat:'RETRO 3D',hd:1,how:'TURN + DRIVE. A FIRES. DESTROY 10 DRONES.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:0,z:0,a:0},en=[],sh=[],eb=[],hp=5,inv=0,t=0,booms=[];const spawn=()=>{const a=rnd(6.28);en.push({x:p.x+Math.cos(a)*22,z:p.z+Math.sin(a)*22,cd:60+ri(60)});};for(let i=0;i<3;i++)spawn();
 g.update=()=>{t++;if(inv>0)inv--;const k=A.in(0);p.a+=ax(k)*.045;const mv=-ay(k)*.16;p.x=cl(p.x+Math.sin(p.a)*mv,-30,30);p.z=cl(p.z+Math.cos(p.a)*mv,-30,30);
  if(A.fire(12)&&sh.length<6){sh.push({x:p.x,z:p.z,vx:Math.sin(p.a)*.7,vz:Math.cos(p.a)*.7,t:60});S('shoot');}sh.forEach(s=>{s.x+=s.vx;s.z+=s.vz;s.t--;});sh=sh.filter(s=>s.t>0);
  for(const e of en){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);if(d>8){e.x+=dx/d*.05;e.z+=dz/d*.05;}else{e.x+=dz/d*.05;e.z-=dx/d*.05;}if(--e.cd<=0){e.cd=90+ri(60);eb.push({x:e.x,z:e.z,vx:dx/d*.3,vz:dz/d*.3,t:80});}
   for(const s of sh)if(Math.hypot(s.x-e.x,s.z-e.z)<1.2){e.dead=1;s.t=0;g.score+=100;S('hit');booms.push({x:e.x,z:e.z,t:24});}}en=en.filter(e=>!e.dead);while(en.length<3&&g.score<1000)spawn();
  booms.forEach(b=>b.t--);booms=booms.filter(b=>b.t>0);
  for(const b of eb){b.x+=b.vx;b.z+=b.vz;b.t--;if(inv===0&&Math.hypot(b.x-p.x,b.z-p.z)<1){b.t=0;hp--;inv=60;S('boom');A.shake=6;fx.flash('#ff2040',6);if(hp<=0)g.over='TANK DESTROYED';}}eb=eb.filter(b=>b.t>0);if(g.score>=1000)g.over='ALL DRONES DOWN! WIN';};
 // horizon: a banded sun and two ridges of mountains that slide as the tank turns, then a gradient plain
 const horizon=hy=>{const c=A.c,o=((p.a*180/Math.PI)*2%640+640)%640;const sx=((160-o*.5)%320+320)%320;X.glow(sx,hy-18,80,'#ff4f9a',.35);
  for(let k=0;k<8;k++){const y=hy-44+k*5,hw=Math.sqrt(Math.max(0,26*26-(y-hy+18)*(y-hy+18)));if(hw>0){c.fillStyle=k<4?'#ffcf5a':k<6?'#ff8a5a':'#ff4f9a';c.fillRect(sx-hw,y,hw*2,3.2-k*.25);}}
  [[.7,'#2a1f55',26,9],[1,'#1a1440',16,14]].forEach(([par,col,amp,seed])=>{const off=o*par;c.fillStyle=col;c.beginPath();c.moveTo(0,hy+1);for(let x=0;x<=W;x+=8){const u=(x+off)/40+seed;c.lineTo(x,hy-2-Math.abs(Math.sin(u)*amp*.6+Math.sin(u*2.3)*amp*.35+Math.sin(u*.37)*amp*.4));}c.lineTo(W,hy+1);c.fill();});
  X.vg(0,hy,W,H-hy,['#2a1d5a','#1a1440','#0e0b26']);c.fillStyle='rgba(255,79,154,.25)';c.fillRect(0,hy,W,1);};
 g.draw=()=>{sky('#05030f','#2b2257');X.stars(60,4,p.a*200,0,110,.8);A.cam.x=p.x-Math.sin(p.a)*5;A.cam.z=p.z-Math.cos(p.a)*5;A.cam.y=2.5;A.cam.ry=-p.a;A.cam.rx=-.3;{const q=A.p3(p.x+Math.sin(p.a)*30,0,p.z+Math.cos(p.a)*30);horizon(q&&isFinite(q[1])&&q[2]>0?Math.max(30,Math.min(200,q[1]-3)):74);}A.fog={col:'#1a1440',near:18,far:40};
  for(let i=-30;i<=30;i+=5)for(let j=-30;j<=30;j+=5){const d=Math.hypot(i-p.x,j-p.z);if(d<28){B3(i,0,j,.4,.4,.4,'#2fe8d0');if(d<16){F([[i-2.5,.01,j-.04],[i+2.5,.01,j-.04],[i+2.5,.01,j+.04],[i-2.5,.01,j+.04]],'#2a6a8a',false);F([[i-.04,.01,j-2.5],[i+.04,.01,j-2.5],[i+.04,.01,j+2.5],[i-.04,.01,j+2.5]],'#2a6a8a',false);}}}
  en.forEach(e=>{if(Math.hypot(e.x-p.x,e.z-p.z)<40){const bob=Math.sin(A.t*.1+e.x)*.15;B3(e.x,.6+bob,e.z,1.4,.5,1.4,K.r);B3(e.x,1.1+bob,e.z,.7,.4,.7,K.o);B3(e.x-.9,.9+bob,e.z,.4,.1,.4,'#555');B3(e.x+.9,.9+bob,e.z,.4,.1,.4,'#555');}});eb.forEach(b=>B3(b.x,.8,b.z,.3,.3,.3,K.y));sh.forEach(s=>B3(s.x,.6,s.z,.3,.3,.6,K.g));
  if(inv%6<4){A.shadow3(p.x,p.z,1.8,2.2);const hb=Math.sin(A.t*.12)*.06;B3(p.x,.25+hb,p.z,1.7,.5,2.1,K.c);B3(p.x,.75+hb,p.z,1,.35,1,'#20b0a0');const c=Math.sin(p.a),s=Math.cos(p.a);B3(p.x+c*.8,.9+hb,p.z+s*.8,.3,.3,1.4,'#178a7d');}en.forEach(e=>A.shadow3(e.x,e.z,1.6,1.6));A.flush();A.fog=null;
  en.forEach(e=>{const q=A.p3(e.x,1.2,e.z);if(pjOK(q)&&q[2]<30)X.glow(q[0],q[1],Math.min(16,50/q[2]),'#ff4040',.35);});eb.forEach(b=>{const q=A.p3(b.x,.95,b.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(14,40/q[2]),'#ffe040',.6);});sh.forEach(s=>{const q=A.p3(s.x,.75,s.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(14,40/q[2]),'#60ff90',.6);});
  booms.forEach(b=>{const q=A.p3(b.x,1,b.z);if(pjOK(q)){const f=1-b.t/24,r=Math.min(60,(10+f*30)*6/q[2]);X.glow(q[0],q[1],r,'#ff9040',.8*(1-f));X.disc(q[0],q[1],r*.4,'rgba(255,240,180,'+(1-f)+')');}});
  fx.draw();X.bar('SCORE '+g.score,'','DRONES '+(g.score/100|0)+'/10',K.y);for(let i=0;i<5;i++)X.rr(W-12-i*10,4,8,9,2,i<hp?'#2fe8d0':'rgba(255,255,255,.15)');
  X.panel(4,190,46,46,'#2fe8d0');const rc=[27,213];A.ring(rc[0],rc[1],20,'rgba(47,232,208,.3)');A.ring(rc[0],rc[1],10,'rgba(47,232,208,.2)');const sw=A.t*.08;A.line(rc[0],rc[1],rc[0]+Math.cos(sw)*20,rc[1]+Math.sin(sw)*20,'rgba(47,232,208,.5)',1);
  en.forEach(e=>{const dx=e.x-p.x,dz=e.z-p.z,ca=Math.cos(-p.a),sa=Math.sin(-p.a),rx=dx*ca+dz*sa,rz=-dx*sa+dz*ca,d=Math.hypot(rx,rz),sc2=Math.min(19,d*.8)/(d||1);X.disc(rc[0]+rx*sc2,rc[1]-rz*sc2,1.8,'#ff4040');});X.disc(rc[0],rc[1],1.8,'#ffffff');};
 return g;}});

/* ---- ROLLER 3D ---- */
A.add({id:'roller',name:'ROLLER 3D',cat:'RETRO 3D',hd:1,tags:'roller ball rolling sky track jump 3d',how:'ROLL LEFT/RIGHT, A JUMPS. YELLOW PADS BOOST, PINK PADS LAUNCH. 3 BALLS.',make(){
 // a ball on a floating 5-lane track built from hand-made pieces; falling costs a ball and sends you back to the last flag
 const g={over:null,score:0},fx=X.fx(),LW=1.2,RL=2;
 const ZONES=[
  {n:'NEON RISE',top:'#1a0a44',bot:'#ff3f8e',a:'#1fb8a8',b:'#178a7d',side:'#0e5a52',edge:'#c0fff6',fog:'#3a1060',sun:'#ffcf3f'},
  {n:'GOLD COAST',top:'#0a2a5a',bot:'#ffb060',a:'#ffcf3f',b:'#e8a820',side:'#9a6a10',edge:'#fff4c0',fog:'#5a4a6a',sun:'#fff0d0'},
  {n:'ICE RIDGE',top:'#04142a',bot:'#4dabff',a:'#d8f0ff',b:'#a8d4f0',side:'#5a86a8',edge:'#ffffff',fog:'#1a3a60',sun:'#e8f8ff'},
  {n:'LAVA LOOP',top:'#140404',bot:'#ff5020',a:'#5a5060',b:'#46404e',side:'#2a2430',edge:'#ff9a40',fog:'#3a0e08',sun:'#ffd040'}];
 const rows=[];let built=0;
 const put=(l,o)=>rows.push(Object.assign({l,gem:-9},o||{}));
 const F5=[1,1,1,1,1];
 const PIECES=[
  ()=>{for(let i=0;i<6;i++)put(F5.slice(),{gem:i>1?(i%2?-1:1):-9});},
  ()=>{let c=0;for(let i=0;i<10;i++){if(i%3===0)c=Math.max(-2,Math.min(2,c+(ri(3)-1)));const l=[0,0,0,0,0];l[c+2]=1;if(i%2)l[Math.min(4,c+3)]=1;put(l,{gem:i%2?c:-9});}},
  ()=>{put(F5.slice());put([0,0,0,0,0],{gem:0});put([0,0,0,0,0]);put(F5.slice());put(F5.slice());},
  ()=>{for(let i=0;i<7;i++)put([1,1,0,1,1],{gem:i===3?(ri(2)?-2:2):-9});},
  ()=>{for(let i=0;i<6;i++)put(i%2?[1,0,1,0,1]:[0,1,0,1,0],{gem:i===2?0:-9});put(F5.slice());},
  ()=>{put([1,1,2,1,1]);put(F5.slice());put([0,0,0,0,0],{gem:0});put([0,0,0,0,0],{gem:0});put([0,0,0,0,0]);put(F5.slice());put(F5.slice());},
  ()=>{put(F5.slice());put([1,3,1,3,1]);for(let i=0;i<3;i++)put([0,0,0,0,0],{gem:i===1?-1:-9});put(F5.slice());},
  ()=>{const s=ri(5);for(let i=0;i<8;i++){const l=F5.slice();if(i%2===0){l[(s+i)%5]=5;l[(s+i+2)%5]=5;}put(l,{gem:i%2?((s+i)%5)-2:-9});}},
  ()=>{for(let i=0;i<8;i++){const l=[0,0,0,0,0];const c=i<4?-2+i:2-(i-4);l[c+2]=1;l[Math.min(4,c+3)]=1;put(l,{gem:c});}put(F5.slice());}];
 const build=()=>{const zi=Math.floor(built/90),hard=Math.min(PIECES.length,4+zi*2);
  if(built===0){for(let i=0;i<8;i++)put(F5.slice());}
  else{const n=rows.length;put(F5.slice(),{cp:1});PIECES[ri(hard)]();if(Math.random()<.5)PIECES[1+ri(hard-1)]();}
  built=rows.length;};
 while(rows.length<60)build();
 let p={x:0,y:0,z:0,vx:0,vy:0,vz:.13},spin=0,lives=3,cp=0,inv=0,boostT=0,air=0,fallT=0,gems=0,best=0,bonus=0,banner=100,zoneSeen=0,bump=0,trail=[];
 const row=r=>rows[r];
 const tileAt=(x,z)=>{const r=Math.round(z/RL),R=row(r);if(!R)return 0;const ln=Math.round(x/LW);if(ln<-2||ln>2)return 0;if(Math.abs(x-ln*LW)>LW*.5+.22)return 0;return R.l[ln+2];};
 const respawn=()=>{p.x=0;p.y=1.5;p.vy=0;p.vx=0;p.z=cp*RL;p.vz=.06;inv=90;fallT=0;const R=row(cp);if(R)for(let i=0;i<5;i++)if(!R.l[i])R.l[i]=1;};
 g._s=()=>({x:p.x,y:p.y,z:p.z,vz:p.vz,lives,cp,gems,row:Math.round(p.z/RL),zone:Math.floor(Math.round(p.z/RL)/90)});g._r=r=>rows[r];
 g.update=()=>{const k=A.in(0),h=A.hit(0);
  while(rows.length<Math.round(p.z/RL)+50)build();
  const zone=Math.floor(Math.round(p.z/RL)/90),base=.13+Math.min(.09,zone*.022);
  if(fallT){fallT++;p.vy-=.014;p.y+=p.vy;p.z+=p.vz*.6;if(fallT>50){lives--;if(lives<=0){g.over='OUT OF BALLS';return;}respawn();}return;}
  p.vx=(p.vx+ax(k)*.022)*.88;p.x+=p.vx;
  const tv=boostT>0?base*1.7:base;p.vz+=(tv-p.vz)*.05;if(boostT>0)boostT--;p.z+=p.vz;spin+=p.vz;if(inv)inv--;
  const t=tileAt(p.x,p.z);
  if(t===5&&p.y<.9){p.z-=p.vz*3;p.vz=-.04;bump=12;A.shake=4;S('hit');fx.pop(160,90,'BUMP!','#ff8080');}
  const ground=t&&t!==5&&p.y<=.01&&p.vy<=0;
  if(ground){p.y=0;p.vy=0;if(air>18){S('blip');const s=A.p3(p.x,0,p.z);if(pjOK(s))fx.ring(s[0],s[1],'#ffffff',14,8);}air=0;
   if(t===2&&boostT<60){boostT=120;S('power');fx.pop(160,90,'BOOST!',K.y);}
   if(t===3){p.vy=.36;S('jump');fx.pop(160,90,'LAUNCH!','#ff6ab0');}
   else if(h.a){p.vy=.25;S('jump');}}
  else{p.vy-=.012;p.y+=p.vy;air++;if(p.y<-.35&&!t)fallT=1,S('lose'),fx.flash('#ff3060',6);else if(p.y<0&&t&&t!==5){p.y=0;p.vy=0;}}
  const r=Math.round(p.z/RL);
  if(r>best){for(let q=best+1;q<=r;q++){bonus+=1;const R=row(q);if(R&&R.cp&&q>cp){cp=q;bonus+=20;fx.pop(160,70,'CHECKPOINT',K.g);S('score');}}best=r;}
  const R=row(r);if(R&&R.gem>-9&&!R.got&&Math.abs(p.x-R.gem*LW)<.8&&p.y<1.6){R.got=1;gems++;bonus+=10;S('coin');const s=A.p3(R.gem*LW,.8,r*RL);if(pjOK(s)){fx.spark(s[0],s[1],'#ffe060',10,2);fx.ring(s[0],s[1],'#fff0a0',14,10);}}
  const zn=Math.floor(r/90);if(zn!==zoneSeen){zoneSeen=zn;banner=110;S('score');fx.flash('#ffffff',6);}if(banner)banner--;if(bump)bump--;
  g.score=bonus;
 };
 g.draw=()=>{const zi=Math.floor(Math.round(p.z/RL)/90),Z=ZONES[zi%4],c=A.c;
  A.skyband(Z.top,Z.bot,128);X.stars(60,9+zi,p.x*30,0,110,.8);X.glow(160,124,120,Z.sun,.3);X.disc(160,124,26,X.lg(0,98,0,124,[X.lt(Z.sun,1.3),Z.sun,Z.bot]));
  c.fillStyle=X.rgba(Z.top,.6);for(let i=0;i<5;i++)c.fillRect(130,104+i*4.5,60,1.4+i*.4);
  X.hills(130,14,X.lt(Z.top,.7),p.x*8+p.z*.4,.025,zi+3);R(0,130,W,110,X.lt(Z.top,.6));
  A.fog={col:Z.fog,near:18,far:44};A.cam.x=p.x*.7;A.cam.y=3+Math.max(0,p.y)*.5;A.cam.z=p.z-5.2;A.cam.ry=0;A.cam.rx=-.36;
  const r0=Math.max(0,Math.round(p.z/RL)-3);
  for(let r=r0;r<r0+24;r++){const Rw=row(r);if(!Rw)continue;const zz=r*RL,Zr=ZONES[Math.floor(r/90)%4];
   for(let i=0;i<5;i++){const t=Rw.l[i],x=(i-2)*LW;if(!t)continue;const odd=(r+i)%2;
    B3(x,-.6,zz,LW-.06,.6,RL-.06,odd?Zr.b:Zr.side);F([[x-LW/2+.03,.01,zz-RL/2+.03],[x+LW/2-.03,.01,zz-RL/2+.03],[x+LW/2-.03,.01,zz+RL/2-.03],[x-LW/2+.03,.01,zz+RL/2-.03]],t===2?'#ffcf3f':t===3?'#ff4fa8':odd?Zr.a:Zr.b,false);
    if(t===2){F([[x-.3,.02,zz-.5],[x,.02,zz+.3],[x+.3,.02,zz-.5],[x,.02,zz-.1]],'#fff8c0',false);}
    if(t===3){F([[x-.35,.02,zz-.35],[x+.35,.02,zz-.35],[x+.35,.02,zz+.35],[x-.35,.02,zz+.35]],'#ffd0ea',false);}
    if(t===5){B3(x,0,zz,LW-.15,1,.6,'#ff4f6d');B3(x,1,zz,LW-.1,.1,.66,'#ffc0c8');}
    if(i===0)F([[x-LW/2,.02,zz-RL/2],[x-LW/2+.1,.02,zz-RL/2],[x-LW/2+.1,.02,zz+RL/2],[x-LW/2,.02,zz+RL/2]],Zr.edge,false);
    if(i===4)F([[x+LW/2-.1,.02,zz-RL/2],[x+LW/2,.02,zz-RL/2],[x+LW/2,.02,zz+RL/2],[x+LW/2-.1,.02,zz+RL/2]],Zr.edge,false);}
   if(Rw.cp){B3(-3.3,0,zz,.2,2.4,.2,'#ffffff');B3(3.3,0,zz,.2,2.4,.2,'#ffffff');B3(0,2.4,zz,6.8,.25,.2,r<=cp?K.g:'#ff9a3f');}}
  if(!fallT&&tileAt(p.x,p.z))A.shadow3(p.x,p.z,.9-Math.min(.5,p.y*.2),.9-Math.min(.5,p.y*.2));A.flush();A.fog=null;
  for(let r=r0+23;r>=r0;r--){const Rw=row(r);if(!Rw||Rw.gem<=-9||Rw.got)continue;const s=A.p3(Rw.gem*LW,.7+Math.sin(A.t*.12+r)*.12,r*RL);if(pjOK(s)){const q=Math.min(9,16/s[2]);X.glow(s[0],s[1],q*2.6,'#ffe060',.3);X.gem(s[0],s[1],q,'#ffd84a');}}
  const rr0=.42,q=A.p3(p.x,p.y+rr0,p.z),q2=A.p3(p.x+rr0,p.y+rr0,p.z);
  trail.unshift(q);if(trail.length>7)trail.pop();
  if(pjOK(q)&&pjOK(q2)&&(!inv||A.t%6<4)){const rr=Math.max(3,Math.abs(q2[0]-q[0]));if(boostT>0)trail.forEach((t,i)=>{if(pjOK(t))X.disc(t[0],t[1]+i*1.5,rr*(1-i/8),'rgba(255,220,90,'+(.35-i*.045)+')');});
   X.glow(q[0],q[1],rr*2.2,'#ffb040',.25);X.orb(q[0],q[1],rr,'#ff9a3f',0);c.save();c.beginPath();c.arc(q[0],q[1],rr,0,6.283);c.clip&&c.clip();for(let i=0;i<3;i++){const yy=q[1]+((spin*rr*1.2+i*rr*.9)%(rr*2.7))-rr*1.35;c.fillStyle='#ffd040';c.fillRect(q[0]-rr,yy,rr*2,rr*.32);}c.restore();X.ell(q[0]-rr*.35,q[1]-rr*.4,rr*.32,rr*.2,'rgba(255,255,255,.7)',-.5);}
  X.vignette(.3);fx.draw();
  X.panel(118,3,84,22,Z.a);X.ot(String(g.score),160,8,'#ffffff',2,'c');
  for(let i=0;i<3;i++)X.orb(12+i*14,12,5,i<lives?'#ff9a3f':'rgba(255,255,255,.18)',0);
  T('GEMS '+gems,W-6,8,'#ffe060',1,'r');T('ZONE '+(zi+1),W-6,18,X.lt(Z.a,1.2),1,'r');
  if(banner){c.globalAlpha=Math.min(1,banner/20);X.ot('ZONE '+(zi+1),160,46,'#ffffff',1,'c');X.ot(Z.n,160,56,Z.a,3,'c');c.globalAlpha=1;}
  if(fallT)X.ot(lives>1?'BACK TO THE FLAG':'LAST BALL!',160,110,'#ffffff',2,'c');};
 return g;}});
/* ---- WAVE RIDER 3D ---- */
A.add({id:'waverider',name:'WAVE RIDER 3D',cat:'RETRO 3D',hd:1,how:'STEER BETWEEN THE BUOYS. RED LEFT, GREEN RIGHT. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off';let px=0,z=0,v=.22,gates=[],time=3600,miss=0,bank=0,run=0,spray=[],hitT=0;for(let i=1;i<12;i++)gates.push({z:i*9,x:rnd(6)-3,ok:0});
 g.update=()=>{time--;if(hitT)hitT--;const k=A.in(0);px=cl(px+ax(k)*.13,-6,6);bank+=(ax(k)*.3-bank)*.15;z+=v;for(const q of gates){if(!q.ok&&q.z<z){q.ok=1;if(Math.abs(px-q.x)<1.4){g.score+=10;run++;S('coin');q.ok=2;hitT=12;A.burst(160,176,'#bfefff',6);fx.ring(160,182,'#ffffff',36,14);fx.spark(160,180,'#ffffff',14,2.6);fx.spark(160,180,'#ffcf3f',8,2);if(run%5===0){fx.pop(160,128,'STREAK '+run,'#ffcf3f');fx.flash('#ffffff',4);}}else{miss++;run=0;S('lose');A.shake=4;fx.pop(160,140,'MISSED','#ff6a6a');fx.debris(160,186,'#ff4f6d',6,2);}}if(q.z<z-2){q.z+=99;q.x=rnd(6)-3;q.ok=0;}}
  if(A.t%2===0)spray.push({x:160+(Math.random()-.5)*30,y:192,vx:(Math.random()-.5)*2.4-bank*3,vy:-1.2-Math.random()*1.6,t:22});spray.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.14;p.t--;});spray=spray.filter(p=>p.t>0);if(time<=0)g.over=g.score+' PTS, '+miss+' MISSED';};
 const hz=104,wv=zz=>Math.sin(zz*.7+A.t*.1)*.15;
 const buoy=(s,col,q)=>{const k=210/s[2],r=Math.max(1.2,.32*k),h=Math.max(3,1.05*k),x=s[0],y=s[1],c=A.c,on=A.t%30<15;
  X.ell(x,y+r*.25,r*1.7,r*.45,'rgba(0,30,60,.35)');c.globalAlpha*=.35;X.rr(x-r,y,r*2,h*.5,r*.6,X.lg(0,y,0,y+h*.5,[col,X.rgba(col,0)]));c.globalAlpha/=.35;
  X.rr(x-r,y-h*.62,r*2,h*.62,r*.7,X.lg(x-r,0,x+r,0,[X.lt(col,1.4),col,X.lt(col,.5)]));c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x-r,y-h*.42,r*2,h*.14);
  X.rr(x-r*.55,y-h*.92,r*1.1,h*.32,r*.4,X.lg(x-r,0,x+r,0,['#ffffff','#c8d0dc','#6a7488']));X.orb(x,y-h*.98,r*.55,on?'#fff6c0':X.lt(col,1.2));if(on&&lo())X.glow(x,y-h*.98,r*3.2,col,.6);
  c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x-r*.7,y-h*.58,r*.3,h*.5);};
 const boat=(x,y,b)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(b*.35);
  X.ell(0,8,30,6,'rgba(0,30,60,.35)');X.poly([[-26,-4],[26,-4],[20,9],[-20,9]],X.lg(0,-4,0,9,['#ffffff','#e2e8f2','#9aa4b8']));X.poly([[-20,5],[20,5],[18,9],[-18,9]],'#ff4f6d');
  X.rr(-22,-12,44,9,4,X.lg(0,-12,0,-3,['#ffe28a','#ffcf3f','#c88a10']));X.rr(-15,-20,30,9,3,X.lg(0,-20,0,-11,['#bff0ff','#4dabff','#1a5a9a']));c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-12,-19,10,1.5);
  X.orb(0,-22,4.2,'#2fd6c3');X.rr(-4,-27,8,3,1.5,'#1a2a4a');X.block(-6,4,12,10,'#2a2a38',2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-4,6,8,1);c.restore();};
 g.draw=()=>{const c=A.c;X.cache('wr_bg2',()=>{X.sky(['#2f86e0','#7cc4f4','#e6f6ff'],hz);X.glow(250,hz-26,90,'#fff4c0',.5);X.disc(250,hz-26,13,'#fffbe6');
   [[30,hz,46,9],[110,hz,26,6],[205,hz,60,12],[295,hz,34,7]].forEach(([x,y,w,h],i)=>{X.ell(x,y,w,h,i%2?'#5f8fa0':'#4f7f8a');X.ell(x-w*.3,y-h*.6,w*.45,h*.7,i%2?'#6a9cac':'#5a8c96');});
   [[40,26,22],[150,40,16],[300,22,20]].forEach(([x,y,s])=>{c.globalAlpha=.9;X.ell(x,y,s,s*.25,'#ffffff');X.ell(x+s*.3,y-s*.2,s*.55,s*.3,'#ffffff');X.ell(x-s*.35,y-s*.12,s*.4,s*.22,'#f4fbff');c.globalAlpha=1;});
   X.vg(0,hz,W,H-hz,['#8fcaf0','#2a8ad6','#0f4f94']);});
  [[60,46],[230,58]].forEach(([x0,y],i)=>{const x=((x0-A.t*.05*(i+1))%380+380)%380-30;c.globalAlpha=.85;X.ell(x,y,18,4,'#ffffff');X.ell(x+8,y-3,10,4,'#ffffff');c.globalAlpha=1;});
  A.fog={col:'#9fd4f5',near:12,far:40};A.cam.x=px;A.cam.y=1.4;A.cam.z=z-3.5;A.cam.ry=0;A.cam.rx=-.12;
  for(let zz=Math.floor(z)-1;zz<z+40;zz++){const a=wv(zz),b=wv(zz+1);F([[px-16,a,zz],[px+16,a,zz],[px+16,b,zz+1],[px-16,b,zz+1]],zz%2?'#1a6cb4':'#1e78c4');if((zz*7)%5===0){const sx=px-10+((zz*13)%20);F([[sx-.5,a+.02,zz],[sx+.5,a+.02,zz],[sx+.4,b+.02,zz+.35],[sx-.4,b+.02,zz+.35]],'#cfeaff',false);}}
  A.flush();A.fog=null;
  const nx=gates.filter(q=>!q.ok&&q.z>z+1).sort((a,b)=>a.z-b.z)[0];
  gates.filter(q=>q.z>z+.6&&q.z<z+42).sort((a,b)=>b.z-a.z).forEach(q=>{const d=q.z-z,bb=Math.sin(A.t*.1+q.z)*.08,al=Math.max(0,Math.min(1,(42-d)/14));c.globalAlpha=al;
   if(q===nx){const L=A.p3(q.x-1.6,.02,q.z),R_=A.p3(q.x+1.6,.02,q.z);if(pjOK(L)&&pjOK(R_)){c.setLineDash&&c.setLineDash([4,4]);X.stroke([[L[0],L[1]],[R_[0],R_[1]]],'rgba(255,255,255,.7)',1.2);c.setLineDash&&c.setLineDash([]);}}
   [[-1.6,'#ff3a4f'],[1.6,'#2fd65a']].forEach(([o,col])=>{const s=A.p3(q.x+o,bb,q.z);if(pjOK(s))buoy(s,q.ok===2?'#ffcf3f':col,q);});c.globalAlpha=1;});
  spray.forEach(p=>{c.globalAlpha=p.t/22*.8;X.disc(p.x,p.y,1.2+p.t*.05,'#ffffff');});c.globalAlpha=1;
  const bob=Math.sin(A.t*.2)*1.2;for(const sd of[-1,1]){const P0=[160+sd*16,196],P1=[160+sd*86-bank*30,244];if(lo())X.stroke([P0,P1],'rgba(255,255,255,.18)',7);for(let i=0;i<6;i++){const f=((i/6+A.t*.03)%1),f2=Math.min(1,f+.09);X.stroke([[P0[0]+(P1[0]-P0[0])*f,P0[1]+(P1[1]-P0[1])*f],[P0[0]+(P1[0]-P0[0])*f2,P0[1]+(P1[1]-P0[1])*f2]],'rgba(255,255,255,'+(.85-f*.5).toFixed(2)+')',1.5+f*3);}}if(lo()){c.globalAlpha=.5;X.ell(160,198,40,6,'rgba(255,255,255,.8)');c.globalAlpha=1;}boat(160,186+bob,bank);if(hitT&&lo())X.glow(160,180,40,'#ffffff',hitT/12*.4);
  fx.draw();X.bar('SCORE '+g.score,Math.ceil(time/60)+' SEC',miss?miss+' MISSED':run>1?'STREAK '+run:'',K.y,time<600?K.r:'#ffffff');};
 return g;}});
})();
