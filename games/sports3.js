(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const tapper=(i,q)=>{if(A.cpu&&i===1){const tv=2+2*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const runner=(x,y,col,st)=>{R(x-5,y-22,10,14,col);R(x-4,y-31,8,8,'#ffd9a8');R(x-5+(st?4:-3),y-8,4,10,K.w);R(x+1+(st?-4:3),y-8,4,10,K.w);};

/* ---- TABLE KICK ---- */
A.add({id:'foos',name:'TABLE KICK',cat:'SPORTS',vs:1,how:'UP/DOWN SLIDE YOUR ROD. A KICKS. FIRST TO 5.',make(){
 const g={over:null,score:0};let rod=[120,120],b,sc=[0,0],wait=40;const RX=[[70,130],[190,250]];
 const reset=()=>{b={x:160,y:120,vx:rnd(2)-1,vy:rnd(2)-1};wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const ty=b.y+(b.vx>0?0:(b.y<120?-20:20));A.bot({u:rod[1]>ty+3,d:rod[1]<ty-3,a:Math.abs(b.y-rod[1])<20&&Math.random()<.1*A.ai});}
  for(let i=0;i<2;i++){const k=A.in(i);rod[i]=cl(rod[i]+ay(k)*(i&&A.cpu?1.4+1.6*A.ai:3.2),60,180);const kick=A.hit(i).a;for(const x of RX[i])for(const off of[-46,0,46]){const my=rod[i]+off;if(Math.abs(b.x-x)<6&&Math.abs(b.y-my)<8){b.vx=(i?-1:1)*(kick?7.5:3.2);b.vy=(b.y-my)*.3+rnd(1)-.5;b.x=x+(i?-7:7);S(kick?'hit':'blip');}}}
  b.x+=b.vx;b.y+=b.vy;b.vx*=.997;b.vy*=.997;if(Math.abs(b.vx)<.3)b.vx+=(b.x<160?-.05:.05);if(b.y<30||b.y>210){b.vy*=-1;b.y=cl(b.y,30,210);}
  if(b.x<10||b.x>W-10){if(b.y>90&&b.y<150){const w=b.x<10?1:0;sc[w]++;S('score');if(sc[w]>=5)g.over=A.win(w);else reset();}else{b.vx*=-1;b.x=cl(b.x,10,W-10);}}};
 g.draw=()=>{A.cls('#176b35');A.box(8,26,W-16,188,K.w);L(160,26,160,214,K.w);A.ring(160,120,20,K.w);R(3,90,5,60,K.gr);R(W-8,90,5,60,K.gr);RX.forEach((xs,i)=>xs.forEach(x=>{R(x-1,26,2,188,'#aaa');[-46,0,46].forEach(o=>{const y=rod[i]+o;R(x-4,y-7,8,14,i?K.p:K.c);R(x-3,y-12,6,5,'#ffd9a8');});}));C(b.x,b.y,4,K.w);A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- CURLING ---- */
A.add({id:'curling',name:'CURLING',cat:'SPORTS',vs:1,how:'A LOCKS AIM, A LOCKS POWER. NEAREST THE BUTTON SCORES.',make(){
 const g={over:null,score:0},BX=260,BY=120;let stones=[],p=0,n=0,ph=0,t=0,aim=0,pow=0,live=null,end=1,sc=[0,0],msg='',mt=0;
 g.update=()=>{t++;if(mt>0)mt--;const cpu=A.cpu&&p===1,h=A.hit(human(p));
  if(live){live.x+=live.vx;live.y+=live.vy;live.vx*=.985;live.vy*=.985;for(const s of stones){const dx=s.x-live.x,dy=s.y-live.y,d=Math.hypot(dx,dy);if(d<12&&d>0){const nx=dx/d,ny=dy/d,rv=live.vx*nx+live.vy*ny;if(rv>0){s.vx=(s.vx||0)+rv*nx;s.vy=(s.vy||0)+rv*ny;live.vx-=rv*nx;live.vy-=rv*ny;S('hit');}}}
   stones.forEach(s=>{s.x+=s.vx||0;s.y+=s.vy||0;s.vx=(s.vx||0)*.98;s.vy=(s.vy||0)*.98;});if(Math.hypot(live.vx,live.vy)<.05){if(live.x>40&&live.x<W-6&&live.y>30&&live.y<210)stones.push(live);live=null;n++;p=1-p;ph=0;t=0;
    if(n>=8){stones.sort((a,b)=>Math.hypot(a.x-BX,a.y-BY)-Math.hypot(b.x-BX,b.y-BY));let pts=0;const w=stones[0]?stones[0].o:0;for(const s of stones){if(s.o!==w||Math.hypot(s.x-BX,s.y-BY)>40)break;pts++;}if(stones.length){sc[w]+=pts;msg=A.nm(w)+' +'+pts;S('score');}else msg='NO SCORE';mt=90;stones=[];n=0;end++;if(end>3){g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}}return;}
  if(ph===0){aim=Math.sin(t*.05)*.3;if(cpu?t>50:h.a){ph=1;t=0;if(cpu)aim=(rnd(.1)-.05)*(2-A.ai);}}else{pow=.5+.5*Math.sin(t*.07);if(cpu?t>30+rnd(20):h.a){if(cpu)pow=.55+rnd(.2)*(2-A.ai);live={x:30,y:120,vx:Math.cos(aim)*(2+pow*3.2),vy:Math.sin(aim)*(2+pow*3.2),o:p};S('shoot');}}};
 g.draw=()=>{A.cls('#dbe9f4');[[40,K.b],[28,K.w],[16,K.r],[6,K.w]].forEach(v=>C(BX,BY,v[0],v[1]));L(40,30,40,210,K.r);L(BX,30,BX,210,'#aaa');const st=s=>{C(s.x,s.y,6,'#555');C(s.x,s.y,4,s.o?K.p:K.c);};stones.forEach(st);if(live)st(live);
  if(!live&&ph===0)L(30,120,30+Math.cos(aim)*60,120+Math.sin(aim)*60,K.y);if(!live&&ph===1){A.box(8,40,10,80,K.k);R(10,118-pow*76,6,pow*76,K.r);}
  A.hud2(sc[0],sc[1]);T('END '+Math.min(end,3)+'/3  STONE '+(n+1)+'/8  '+A.nm(p),160,4,K.k,1,'c');if(mt>0)T(msg,160,200,K.k,2,'c');};
 return g;}});

/* ---- PUCK HOCKEY ---- */
A.add({id:'hockey',name:'PUCK HOCKEY',cat:'SPORTS',vs:1,how:'SKATE INTO THE PUCK. A SLAPSHOTS. FIRST TO 5.',make(){
 const g={over:null,score:0};let pl,b,sc=[0,0],wait=40;const reset=()=>{pl=[{x:100,y:120,vx:0,vy:0,fx:1,fy:0},{x:220,y:120,vx:0,vy:0,fx:-1,fy:0}];b={x:160,y:120,vx:0,vy:0};wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=pl[1],vx=b.x-14,vy=b.y-120,n=Math.hypot(vx,vy)||1,ux=vx/n,uy=vy/n,beh=(q.x-b.x)*ux+(q.y-b.y)*uy>3,dd=Math.hypot(q.x-b.x,q.y-b.y);let tx,ty;if(beh){tx=b.x+ux*3;ty=b.y+uy*3;}else{tx=b.x+ux*24;ty=b.y+uy*24+(q.y<b.y?-18:18);}
   A.bot({l:q.x>tx+2,r:q.x<tx-2,u:q.y>ty+2,d:q.y<ty-2,a:beh&&dd<13&&A.t%5===0&&(b.x<200||Math.random()<.3)});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),acc=i&&A.cpu?.14+.12*A.ai:.28;q.vx=(q.vx+ax(k)*acc)*.93;q.vy=(q.vy+ay(k)*acc)*.93;if(ax(k)||ay(k)){const m=Math.hypot(ax(k),ay(k));q.fx=ax(k)/m;q.fy=ay(k)/m;}q.x=cl(q.x+q.vx,20,W-20);q.y=cl(q.y+q.vy,36,H-16);
   const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<11){if(A.hit(i).a){b.vx=q.fx*7;b.vy=q.fy*7;S('hit');}else{b.vx=dx/(d||1)*2.5+q.vx;b.vy=dy/(d||1)*2.5+q.vy;}b.x=q.x+dx/(d||1)*11;b.y=q.y+dy/(d||1)*11;}}
  b.x+=b.vx;b.y+=b.vy;b.vx*=.985;b.vy*=.985;if(Math.hypot(b.vx,b.vy)<.5&&(b.x<30||b.x>W-30||b.y<48||b.y>H-28)){b.vx+=(160-b.x)*.005;b.vy+=(120-b.y)*.005;}if(b.y<32||b.y>H-12){b.vy*=-1;b.y=cl(b.y,32,H-12);}
  if(b.x<14||b.x>W-14){if(b.y>90&&b.y<150){const w=b.x<14?1:0;sc[w]++;S('score');if(sc[w]>=5)g.over=A.win(w);else reset();}else{b.vx=(b.x<14?1:-1)*Math.max(1,Math.abs(b.vx)*.5);b.x=b.x<14?15:W-15;}}if((b.y<40||b.y>H-20)&&(b.x<40||b.x>W-40)){b.vy+=(120-b.y)*.01;b.vx+=(160-b.x)*.01;}};
 g.draw=()=>{A.cls('#e9f4ff');A.box(10,28,W-20,H-38,K.b);L(160,28,160,H-10,K.r,2);A.ring(160,120,24,K.b);L(60,28,60,H-10,K.b);L(260,28,260,H-10,K.b);R(6,90,5,60,K.r);R(W-11,90,5,60,K.r);
  pl.forEach((q,i)=>{R(q.x-6,q.y-8,12,16,i?K.p:K.c);R(q.x-4,q.y-13,8,6,'#ffd9a8');L(q.x,q.y+4,q.x+q.fx*14,q.y+q.fy*14+4,'#5b3a1e',2);});C(b.x,b.y,4,K.k);A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- LONG JUMP ---- */
A.add({id:'longjump',name:'LONG JUMP',cat:'SPORTS',how:'TAP LEFT/RIGHT TO RUN. A AT THE BOARD TO JUMP. 3 TRIES.',make(){
 const g={over:null,score:0};let q={p:0,v:0,last:''},air=null,tries=3,msg='',mt=0,best=0;
 g.update=()=>{if(mt>0){mt--;if(mt===0){if(tries<=0)g.over=best.toFixed(2)+' M BEST';q={p:0,v:0,last:''};air=null;}return;}
  if(air){air.t++;air.x+=air.vx;air.y=air.vy*air.t-.18*air.t*air.t;if(air.y<0){const d=Math.max(0,(air.x-240)/22);msg=air.foul?'FOUL':d.toFixed(2)+' M';if(!air.foul){g.score=Math.max(g.score,Math.round(d*100));best=Math.max(best,d);}mt=80;tries--;S(air.foul?'lose':'score');}return;}
  tapper(0,q);q.p+=q.v*.5;if(A.hit(0).a||q.p>250){air={t:0,x:q.p,y:0,vx:q.v*.6,vy:2.5+q.v*.35,foul:q.p>246};S('jump');}};
 g.draw=()=>{A.cls('#2a5db0');R(0,150,W,90,'#c4552d');R(240,140,W,100,'#e8c77a');R(236,140,4,100,K.w);for(let m=1;m<=8;m++){R(240+m*22,150,1,90,K.w);T(m,240+m*22-2,152,K.w);}
  const x=air?air.x:q.p,y=air?150-air.y*8:150;runner(x,y,K.c,Math.floor((air?0:q.p)/8)%2);T('TRIES '+tries,6,6,K.w,2);T('BEST '+best.toFixed(2)+' M',W-6,6,K.y,2,'r');if(mt>0)T(msg,160,60,K.y,3,'c');};
 return g;}});

/* ---- HURDLES ---- */
A.add({id:'hurdles',name:'HURDLES',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT TO RUN. A JUMPS HURDLES.',make(){
 const g={over:null,score:0};let r=[{p:0,v:0,last:'',j:0,fin:0},{p:0,v:0,last:'',j:0,fin:0}],t=-120;const HU=[150,300,450,600,750];
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;tapper(i,q);if(q.j>0)q.j--;const nh=HU.find(h=>h>q.p-10);
   if(i===1&&A.cpu){if(nh&&nh-q.p<28+rnd(8)&&q.j===0&&Math.random()<.6)q.j=32;}else if(A.hit(i).a&&q.j===0)q.j=32;
   if(nh&&Math.abs(nh-q.p)<5&&(q.j<8||q.j>28)){q.v*=.3;S('hit');}q.p+=q.v*.5;if(q.p>=900){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 g.draw=()=>{A.cls('#2a5db0');R(0,60,W,30,'#555');R(0,90,W,150,'#c4552d');const cam=Math.max(r[0].p,r[1].p)-100;R(900-cam+40,90,3,150,K.w);
  r.forEach((q,i)=>{const y=150+i*55;R(0,y+4,W,1,K.w);HU.forEach(h=>{const x=h-cam+40;if(x>-10&&x<W+10){R(x-1,y-16,2,20,K.k);R(x-8,y-16,16,3,K.w);}});const jy=q.j>0?Math.sin(q.j/32*3.14)*22:0;runner(q.p-cam+40,y-jy,i?K.p:K.c,Math.floor(q.p/12)%2);T(A.nm(i),6,y-30,i?K.p:K.c);});
  T(t<0?'SET...':(t/60).toFixed(1)+'S',160,30,K.y,2,'c');};
 return g;}});

/* ---- SWIM SPRINT ---- */
A.add({id:'swim',name:'SWIM SPRINT',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT IN RHYTHM. STEADY BEATS FAST.',make(){
 const g={over:null,score:0};let r=[{p:0,v:0,last:'',lt:0,fin:0},{p:0,v:0,last:'',lt:0,fin:0}],t=-100,lap=[0,0];
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){q.v+=(1.4+1.4*A.ai-q.v)*.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){const gap=t-q.lt;q.last=n;q.lt=t;q.v+=gap>8&&gap<22?.5:.15;}q.v*=.97;}
   q.p+=q.v*.5;if(lap[i]===0&&q.p>=280){lap[i]=1;q.v*=.5;}if(lap[i]===1&&q.p>=560){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 g.draw=()=>{A.cls('#1b8fb8');for(let i=0;i<3;i++)R(0,70+i*60,W,4,i===1?K.w:'#e33');R(20,40,4,200,K.w);R(296,40,4,200,K.w);r.forEach((q,i)=>{const x=lap[i]?296-(q.p-280):20+q.p,y=100+i*60,s=Math.sin(t*.4+i)*3;R(x-14,y-4,28,8,i?K.p:K.c);R(x+(lap[i]?-16:14)-3,y-5,7,7,'#ffd9a8');R(x-12+s,y-9,6,4,'#ffd9a8');R(x+6-s,y-9,6,4,'#ffd9a8');T(A.nm(i),6,y-22,i?K.p:K.c);});
  T(t<0?'TAKE YOUR MARKS':(t/60).toFixed(1)+'S',160,14,K.w,2,'c');};
 return g;}});

/* ---- FISHING DERBY ---- */
A.add({id:'fishing',name:'FISHING DERBY',cat:'SPORTS',how:'LEFT/RIGHT MOVE. DOWN LOWERS THE HOOK, UP REELS. BIG FISH = BIG POINTS. 60 SEC.',make(){
 const g={over:null,score:0};let bx=160,hy=80,fish=[],time=3600,caught=null;for(let i=0;i<9;i++)fish.push({x:rnd(W),y:100+i*14,d:i%2?1:-1,s:1+ri(3),v:.5+rnd(1)});
 g.update=()=>{time--;const k=A.in(0);bx=cl(bx+ax(k)*2,20,W-20);hy=cl(hy+ay(k)*2,70,225);fish.forEach(f=>{f.x+=f.d*f.v/f.s*1.5;if(f.x<-20)f.x=W+20;if(f.x>W+20)f.x=-20;});
  if(caught){caught.x=bx;caught.y=hy;if(hy<=72){g.score+=caught.s*caught.s*10;S('score');fish.push({x:rnd(W),y:100+ri(9)*14,d:1,s:1+ri(3),v:.5+rnd(1)});fish.splice(fish.indexOf(caught),1);caught=null;}}
  else{const f=fish.find(f=>Math.abs(f.x-bx)<6*f.s&&Math.abs(f.y-hy)<6);if(f){caught=f;S('coin');}}if(time<=0)g.over='TIME UP';};
 g.draw=()=>{A.cls('#4dabff');R(0,60,W,H,'#1b5fa8');R(0,60,W,3,'#7fc3ff');R(bx-16,48,32,12,'#8a5c33');R(bx-6,30,12,18,K.c);R(bx-4,22,8,8,'#ffd9a8');L(bx+12,40,bx+12,hy,K.w);fish.forEach(f=>{const s=f.s,c=[K.o,K.y,K.p][s-1];R(f.x-6*s,f.y-3*s,12*s,6*s,c);A.poly([[f.x-f.d*6*s,f.y],[f.x-f.d*10*s,f.y-4*s],[f.x-f.d*10*s,f.y+4*s]],c,1);R(f.x+f.d*3*s,f.y-2*s,2,2,K.k);});if(!caught)R(bx+11,hy,3,4,K.w);
  T('SCORE '+g.score,6,6,K.k,2);T(Math.ceil(time/60),W-6,6,K.k,2,'r');};
 return g;}});

/* ---- HALFPIPE ---- */
A.add({id:'halfpipe',name:'HALFPIPE',cat:'SPORTS',how:'A AT THE LIP LAUNCHES. TAP A IN THE AIR FOR TRICKS. 45 SEC.',make(){
 const g={over:null,score:0};let a=0,va=.02,air=0,h=0,vh=0,spins=0,time=2700,msg='',mt=0;
 g.update=()=>{time--;if(mt>0)mt--;if(air){h+=vh;vh-=.25;if(A.hit(0).a){spins++;S('blip');}if(h<=0){air=0;h=0;const p=spins*50+(spins>3?100:0);g.score+=p;msg=spins?['','KICKFLIP','360','540','720','900+'][Math.min(spins,5)]+' +'+p:'';mt=50;spins=0;S(p?'score':'hit');}return;}
  a+=va;if(Math.abs(a)>1.4){va*=-1;a=cl(a,-1.4,1.4);if(A.hit(0).a||A.in(0).a){air=1;vh=3+Math.abs(va)*60;S('jump');}}else{va+=(a<0?1:-1)*-.0006;va*=1.004;}
  if(time<=0)g.over='SESSION OVER';};
 g.draw=()=>{A.cls('#2a5db0');C(160,60,18,K.y);A.c.fillStyle='#888';A.c.beginPath();A.c.moveTo(0,H);A.c.lineTo(0,80);A.c.arc(160,80,160,3.1416,0);A.c.lineTo(W,H);A.c.fill();R(0,H-8,W,8,'#555');const x=160+Math.sin(a)*150,y=80+Math.cos(a)*150-h*4;R(x-6,y-16,12,14,K.p);R(x-4,y-22,8,7,'#ffd9a8');R(x-9,y-3,18,3,K.k);
  T('SCORE '+g.score,6,6,K.w,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');if(air)T('TRICKS '+spins,160,20,K.y,1,'c');if(mt>0)T(msg,160,30,K.y,2,'c');};
 return g;}});

/* ---- HIGH DIVE ---- */
A.add({id:'dive',name:'HIGH DIVE',cat:'SPORTS',how:'A TUCKS TO SPIN. RELEASE TO STRAIGHTEN. ENTER VERTICAL. 5 DIVES.',make(){
 const g={over:null,score:0};let y=40,vy=0,rot=0,n=0,ph='wait',t=0,msg='',flips=0;
 g.update=()=>{t++;if(ph==='wait'){if(t>40){ph='fall';vy=0;y=40;rot=0;flips=0;}return;}if(ph==='fall'){vy+=.09;y+=vy;if(A.in(0).a){rot+=.18;}rot+=.02;flips=rot/6.28;if(y>=200){const ang=Math.abs(((rot%6.28)+6.28)%6.28-6.28*0),e=Math.min(ang,6.28-ang),clean=e<.35;const p=Math.round(Math.floor(flips)*30+(clean?50:e<.9?20:0));g.score+=p;msg=(clean?'SPLASHLESS! ':e<.9?'OK ':'BELLY FLOP ')+'+'+p;n++;ph='res';t=0;S(clean?'score':'boom');}}
  else if(t>70){if(n>=5)g.over='DIVES DONE';else{ph='wait';t=0;}}};
 g.draw=()=>{A.cls('#4dabff');R(0,200,W,40,'#1b5fa8');R(60,36,100,6,K.gr);R(150,42,8,H,K.gr);if(ph!=='res'){const c=Math.cos(rot),s=Math.sin(rot),x=110,P=(px,py)=>[x+px*c-py*s,y+px*s+py*c];A.poly([P(-4,-14),P(4,-14),P(4,10),P(-4,10)],K.c,1);C(...P(0,-18),4,'#ffd9a8');}else{for(let i=0;i<6;i++)R(90+i*8,196-(t<15?t:30-t)*(i%2?1:1.6),3,4,K.w);}
  T('DIVE '+Math.min(n+1,5)+'/5',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');if(ph==='fall')T('FLIPS '+flips.toFixed(1),160,60,K.w,1,'c');if(ph==='res')T(msg,160,100,K.y,2,'c');};
 return g;}});

/* ---- BADMINTON ---- */
A.add({id:'badminton',name:'BADMINTON',cat:'SPORTS',vs:1,how:'MOVE. UP JUMPS. A SMASHES. FIRST TO 7.',make(){
 const g={over:null,score:0},GY=210;let pl,b,sc=[0,0],wait=40;const reset=s=>{pl=[{x:70,y:GY,vy:0},{x:250,y:GY,vy:0}];b={x:s?250:70,y:120,vx:0,vy:0};wait=40;};reset(0);
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=pl[1];let tx=250;if(b.x>160){let x=b.x,y=b.y,vx=b.vx,vy=b.vy,n=0;while(y<GY-30&&n++<200){vy+=.09;vy*=.985;vx*=.985;x+=vx;y+=vy;}tx=cl(x-10,175,W-16);}A.bot({l:q.x>tx+3,r:q.x<tx-3,u:b.x>160&&Math.abs(b.x-q.x)<24&&b.y>GY-90&&b.y<GY-50&&Math.random()<A.ai*.8,a:Math.abs(b.x-q.x)<24&&Math.abs(b.y-q.y+20)<26&&Math.random()<.3});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.4+1.6*A.ai:3;q.x=cl(q.x+ax(k)*sp,i?175:16,i?W-16:145);if(k.u&&q.y>=GY){q.vy=-4.5;S('jump');}q.vy+=.22;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}
   const dx=b.x-q.x,dy=b.y-(q.y-20),d=Math.hypot(dx,dy);if(d<24&&(A.hit(i).a||d<12)){const sm=A.hit(i).a&&q.y<GY-10;b.vx=(i?-1:1)*(sm?5.5:2.8+rnd(1));b.vy=sm?2.5:-4.2-rnd(1);S('hit');}}
  b.vy+=.09;b.vx*=.985;b.vy*=.985;b.x+=b.vx;b.y+=b.vy;if(b.x<5){b.x=5;b.vx=Math.abs(b.vx);}if(b.x>W-5){b.x=W-5;b.vx=-Math.abs(b.vx);}
  if(b.y>GY-70&&Math.abs(b.x-160)<6){b.vx=(b.x<160?-1:1)*Math.abs(b.vx)*.5;b.x=160+(b.x<160?-6:6);}
  if(b.y>GY-4){const w=b.x<160?1:0;sc[w]++;S('score');if(sc[w]>=7)g.over=A.win(w);else reset(w);}};
 g.draw=()=>{A.cls('#1a1238');R(0,GY,W,30,'#1e8a45');L(0,GY,W,GY,K.w);R(158,GY-68,4,68,K.w);for(let y=GY-66;y<GY;y+=6)L(150,y,170,y,'#aaa');
  pl.forEach((q,i)=>{R(q.x-5,q.y-24,10,16,i?K.p:K.c);R(q.x-4,q.y-32,8,8,'#ffd9a8');R(q.x-5,q.y-8,4,8,K.w);R(q.x+1,q.y-8,4,8,K.w);A.ring(q.x+(i?-12:12),q.y-24,5,K.y);});
  C(b.x,b.y,3,K.w);A.poly([[b.x,b.y],[b.x-b.vx*2-3,b.y-b.vy*2-6],[b.x-b.vx*2+3,b.y-b.vy*2-6]],K.y,1);A.hud2(sc[0],sc[1]);};
 return g;}});
})();
