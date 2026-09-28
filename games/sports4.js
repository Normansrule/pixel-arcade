(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const tapRace=(i,q)=>{if(A.cpu&&i===1){q.v+=((2+2*A.ai)-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const person=(x,y,col,st)=>A.person(x,y,{c:col,st:typeof st==='number'?st*Math.PI+(A.t*.35):0,s:1.05});

A.add({id:'tabletennis',name:'TABLE TENNIS',cat:'SPORTS',vs:1,how:'LEFT/RIGHT MOVE THE BAT. HOLD UP OR DOWN AS YOU HIT TO ADD SPIN. FIRST TO 11.',make(){
 const g={over:null,score:0};let bat=[160,160],b,sc=[0,0],srv=0,wait=50;const reset=()=>{b={x:bat[srv],y:srv?50:190,vx:0,vy:srv?2.4:-2.4,z:0,vz:0,spin:0,bounced:false};wait=50;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const tx=b.vy<0?b.x+b.vx*((b.y-50)/-b.vy||0)*.6:160;A.bot({l:bat[1]>tx+3,r:bat[1]<tx-3,u:Math.random()<.3});}
  for(let i=0;i<2;i++){const k=A.in(i),sp=i&&A.cpu?1.6+1.8*A.ai:3.4;bat[i]=cl(bat[i]+ax(k)*sp,70,250);const by=i?44:196;if((i?b.vy<0:b.vy>0)&&Math.abs(b.y-by)<6&&Math.abs(b.x-bat[i])<18){b.vy=-b.vy*1.03;b.vx=(b.x-bat[i])*.12+ax(k)*.6;b.spin=ay(k)*(i?-1:1)*.04;b.bounced=false;S('hit');A.burst(b.x,b.y,K.w,5);}}
  b.x+=b.vx;b.y+=b.vy;b.vx+=b.spin;if(b.x<60||b.x>260){const w=b.vy<0?0:1;sc[w]++;S('score');if(sc[w]>=11&&sc[w]-sc[1-w]>=2)g.over=A.win(w);else{srv=(sc[0]+sc[1])%4<2?0:1;reset();}return;}
  if(b.y<30||b.y>210){const w=b.y<30?0:1;sc[w]++;S('score');if(sc[w]>=11&&sc[w]-sc[1-w]>=2)g.over=A.win(w);else{srv=(sc[0]+sc[1])%4<2?0:1;reset();}}};
 g.draw=()=>{A.cls('#1a1238');R(70,56,180,132,'#1f5aa8');A.box(70,56,180,132,K.w);R(159,56,2,132,K.w);R(66,120,188,3,'#ddd');R(66,118,188,2,'#888');
  [0,1].forEach(i=>{const y=i?44:196;R(bat[i]-14,y-3,28,6,i?K.p:K.c);R(bat[i]-3,y+(i?-10:3),6,7,'#8a5c33');});C(b.x,b.y,3.5,'#fff3d6');A.hud2(sc[0],sc[1]);};
 return g;}});

A.add({id:'cornhole',name:'CORNHOLE',cat:'SPORTS',vs:1,how:'UP/DOWN AIM, A LOCKS POWER. HOLE = 3, BOARD = 1. FIRST TO 21.',make(){
 const g={over:null,score:0};let p=0,n=0,ang=.8,pw=0,ph=0,t=0,bag=null,bags=[],sc=[0,0],rd=[0,0],msg='',mt=0;
 const HX=250,HY=150;g.update=()=>{t++;if(mt>0)mt--;
  if(bag){bag.vy+=.2;bag.x+=bag.vx;bag.y+=bag.vy;if(bag.y>=bag.gy){const onB=bag.x>225&&bag.x<285;if(onB&&Math.hypot(bag.x-HX,(bag.y-HY)*2)<9){rd[p]+=3;msg='IN THE HOLE!';S('score');A.burst(HX,HY,K.y,14);}else if(onB){rd[p]+=1;bags.push({x:bag.x,y:bag.gy,o:p});msg='ON THE BOARD';S('hit');}else{msg='MISS';S('lose');}mt=40;bag=null;n++;p=1-p;ph=0;t=0;
    if(n>=8){const d=rd[0]-rd[1];if(d>0)sc[0]+=d;else sc[1]-=d;rd=[0,0];n=0;bags=[];if(sc[0]>=21||sc[1]>=21)g.over=A.win(sc[0]>=21?0:1);}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>30){ang=.8+rnd(.1)-.05;ph=1;t=0;}}else{ang=cl(ang-ay(k)*.02,.3,1.3);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.08);let want=null;if(cpu){let best=0,bd=1e9;for(let w=0;w<=1;w+=.02){let x=50,y=180,vx=Math.cos(ang)*(3+w*5),vy=-Math.sin(ang)*(3+w*5);while(y<180||vy<0){vy+=.2;x+=vx;y+=vy;}const d=Math.abs(x-HX);if(d<bd){bd=d;best=w;}}want=cl(best+(rnd(.12)-.06)*(2-A.ai*1.6),0,1);}
   if(cpu?(Math.abs(pw-want)<.03||t>140):h.a){const w=cpu?want:pw;bag={x:50,y:180,vx:Math.cos(ang)*(3+w*5),vy:-Math.sin(ang)*(3+w*5),gy:180};S('shoot');}}};
 g.draw=()=>{A.cls('#4dabff');R(0,160,W,80,'#3f8a3a');A.poly([[225,172],[285,172],[280,140],[230,140]],'#c4915a',1);A.c.fillStyle='#111';A.c.beginPath();A.c.ellipse(HX,HY,7,4,0,0,7);A.c.fill();
  bags.forEach(b=>R(b.x-5,b.y-6,10,6,b.o?K.p:K.c));if(bag)R(bag.x-5,bag.y-4,10,8,p?K.p:K.c);person(50,188,p?K.p:K.c,0);
  if(!bag){for(let i=1;i<8;i++)C(50+Math.cos(ang)*i*10,180-Math.sin(ang)*i*10,1.5,K.w);if(ph===1){A.box(8,60,10,100,K.w);R(10,158-pw*96,6,pw*96,K.r);}}
  A.hud2(sc[0],sc[1]);T('ROUND '+rd[0]+' - '+rd[1],160,20,K.k,1,'c');if(mt)T(msg,160,60,K.y,2,'c');};
 return g;}});

A.add({id:'javelin',name:'JAVELIN',cat:'SPORTS',how:'TAP LEFT/RIGHT TO RUN. HOLD A TO SET ANGLE, RELEASE BEFORE THE LINE. 3 THROWS.',make(){
 const g={over:null,score:0};let q={p:0,v:0,last:''},ang=0,jav=null,tries=3,msg='',mt=0,best=0,hold=false;
 g.update=()=>{if(mt>0){if(--mt===0){if(tries<=0){g.over=best.toFixed(1)+' M';return;}q={p:0,v:0,last:''};jav=null;ang=0;}return;}
  if(jav){jav.vy+=.08;jav.x+=jav.vx;jav.y+=jav.vy;if(jav.y>=0){const d=jav.foul?0:(jav.x-200)/4;msg=jav.foul?'FOUL':d.toFixed(1)+' M';if(!jav.foul){best=Math.max(best,d);g.score=Math.round(best*10);}tries--;mt=80;S(jav.foul?'lose':'score');}return;}
  tapRace(0,q);q.p+=q.v*.5;if(A.in(0).a){hold=true;ang=Math.min(.9,ang+.02);}else if(hold||q.p>210){hold=false;jav={x:q.p,y:-20,vx:q.v*1.2,vy:-Math.sin(ang)*q.v*1.3,foul:q.p>200};S('shoot');}};
 g.draw=()=>{A.cls('#4dabff');R(0,160,W,80,'#3f8a3a');const cam=jav?Math.max(0,jav.x-160):0;R(200-cam,150,3,90,K.w);for(let m=10;m<=100;m+=10){const x=200+m*4-cam;if(x>0&&x<W){R(x,160,1,80,'rgba(255,255,255,.4)');T(m,x+2,164,K.w);}}
  if(jav){const a=Math.atan2(jav.vy,jav.vx);L(jav.x-cam-Math.cos(a)*16,170+jav.y-Math.sin(a)*16,jav.x-cam+Math.cos(a)*16,170+jav.y+Math.sin(a)*16,K.y,2);}else{person(q.p-cam,190,K.c,Math.floor(q.p/10)%2);L(q.p-cam-12,168+Math.sin(ang)*14,q.p-cam+14,168-Math.sin(ang)*14,K.y,2);if(hold)T('ANGLE '+(ang*57|0),160,40,K.w,2,'c');}
  T('THROWS '+tries,6,6,K.w,2);T('BEST '+best.toFixed(1)+' M',W-6,6,K.y,2,'r');if(mt)T(msg,160,60,K.y,3,'c');};
 return g;}});

A.add({id:'bocce',name:'BOCCE',cat:'SPORTS',vs:1,how:'UP/DOWN AIM, A LOCKS POWER. CLOSEST TO THE JACK SCORES. FIRST TO 7.',make(){
 const g={over:null,score:0};let balls=[],jack,p=0,n=0,ph=0,t=0,aim=0,pw=0,live=null,sc=[0,0],msg='',mt=0;const rs=()=>{balls=[];jack={x:200+rnd(60),y:90+rnd(60)};n=0;};rs();
 g.update=()=>{t++;if(mt>0){mt--;return;}if(live){live.x+=live.vx;live.y+=live.vy;live.vx*=.975;live.vy*=.975;const all=[...balls,jack];for(const o of all){const dx=o.x-live.x,dy=o.y-live.y,d=Math.hypot(dx,dy),rr=o===jack?8:12;if(d<rr&&d>0){const nx=dx/d,ny=dy/d,rv=live.vx*nx+live.vy*ny;if(rv>0){o.vx=(o.vx||0)+rv*nx*.9;o.vy=(o.vy||0)+rv*ny*.9;live.vx-=rv*nx;live.vy-=rv*ny;S('hit');}}}
   all.forEach(o=>{if(o.vx){o.x+=o.vx;o.y+=o.vy;o.vx*=.95;o.vy*=.95;if(Math.abs(o.vx)<.02)o.vx=o.vy=0;}});if(live.y<30||live.y>210)live.vy*=-1;if(live.x>305)live.vx*=-1;
   if(Math.hypot(live.vx,live.vy)<.05){balls.push(live);live=null;n++;const dist=o=>Math.hypot(o.x-jack.x,o.y-jack.y);const near=[0,1].map(i=>Math.min(...balls.filter(b=>b.o===i).map(dist),999));p=n>=8?0:near[p]<near[1-p]?1-p:p;if(balls.filter(b=>b.o===p).length>=4)p=1-p;ph=0;t=0;
    if(n>=8){const w=near[0]<near[1]?0:1,pts=balls.filter(b=>b.o===w&&dist(b)<near[1-w]).length;sc[w]+=pts;msg=A.nm(w)+' +'+pts;mt=90;S('score');if(sc[w]>=7)g.over=A.win(w);else rs();}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));const ang0=Math.atan2(jack.y-120,jack.x-30);if(ph===0){if(cpu){if(t>30){aim=ang0+(rnd(.12)-.06)*(2-A.ai);ph=1;t=0;}}else{aim=cl(aim+ay(k)*.015,-.8,.8);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.07);const d=Math.hypot(jack.x-30,jack.y-120),want=cl(d/260+(rnd(.1)-.05)*(2-A.ai*1.5),0,1);if(cpu?Math.abs(pw-want)<.03||t>140:h.a){const P=cpu?want:pw,v=P*6.5;live={x:30,y:120,vx:Math.cos(aim)*v,vy:Math.sin(aim)*v,o:p};S('shoot');}}};
 g.draw=()=>{A.cls('#3a2a18');R(20,28,295,184,'#c4a56a');A.box(20,28,295,184,'#8a5c33');C(jack.x,jack.y,4,K.w);balls.forEach(b=>C(b.x,b.y,6,b.o?K.p:K.c));if(live)C(live.x,live.y,6,live.o?K.p:K.c);
  if(!live&&!mt){for(let i=1;i<8;i++)C(30+Math.cos(aim)*i*10,120+Math.sin(aim)*i*10,1.5,K.k);if(ph===1){A.box(4,60,10,100,K.w);R(6,158-pw*96,6,pw*96,K.r);}}A.hud2(sc[0],sc[1]);T(A.nm(p)+' THROWS',160,218,K.w,1,'c');if(mt)T(msg,160,110,K.y,2,'c');};
 return g;}});

A.add({id:'rowing',name:'ROWING',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT TO ROW. FIRST ACROSS THE LINE WINS.',make(){
 const g={over:null,score:0};let r=[{p:0,v:0,last:''},{p:0,v:0,last:''}],t=-90;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){tapRace(i,r[i]);r[i].p+=r[i].v*.4;if(r[i].p>=800){g.over=A.win(i);S('win');}}};
 g.draw=()=>{A.cls('#1b6fb8');for(let i=0;i<14;i++)R((i*47-(t*2)%47+W)%W,20+i*16,20,2,'#3a8fd8');const cam=Math.max(r[0].p,r[1].p)-120;R(800-cam+40,40,4,180,K.w);
  r.forEach((q,i)=>{const x=q.p-cam+40,y=90+i*70,s=Math.sin(t*.3*(1+q.v));A.poly([[x-30,y],[x+30,y],[x+22,y+8],[x-22,y+8]],i?K.p:K.c,1);R(x-4,y-14,8,14,'#ffd9a8');L(x-24,y+14+s*4,x+24,y-2-s*4,'#8a5c33',2);T(A.nm(i),x-20,y-26,i?K.p:K.c);});T(t<0?'READY...':(t/60).toFixed(1)+'S',160,6,K.w,2,'c');};
 return g;}});

A.add({id:'skate',name:'SPEED SKATE',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT IN TURN. HOLD B ON THE BENDS OR YOU SLIDE.',make(){
 const g={over:null,score:0};let r=[{p:0,v:0,last:''},{p:0,v:0,last:''}],t=-90;const bend=p=>(p%400)>300;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];tapRace(i,q);const hold=A.cpu&&i===1?Math.random()<.5+A.ai*.45:A.in(i).b;if(bend(q.p)&&!hold&&q.v>2){q.v*=.9;}q.p+=q.v*.4;if(q.p>=1200){g.over=A.win(i);S('win');}}};
 g.draw=()=>{A.cls('#dbe9f4');A.c.strokeStyle='#8fb8d8';A.c.lineWidth=40;A.c.beginPath();A.c.ellipse(160,130,120,70,0,0,7);A.c.stroke();A.c.strokeStyle='#fff';A.c.lineWidth=1;A.c.beginPath();A.c.ellipse(160,130,120,70,0,0,7);A.c.stroke();
  r.forEach((q,i)=>{const a=(q.p%400)/400*6.283,rx=110+i*20,ry=60+i*20;const x=160+Math.cos(a)*rx,y=130+Math.sin(a)*ry;C(x,y,6,i?K.p:K.c);if(bend(q.p))T('B',x,y-16,K.r,1,'c');});
  T(A.nm(0)+' LAP '+Math.min(3,1+(r[0].p/400|0)),6,6,K.c,1);T(A.nm(1)+' LAP '+Math.min(3,1+(r[1].p/400|0)),W-6,6,K.p,1,'r');T(t<0?'READY':'',160,120,K.k,2,'c');};
 return g;}});

A.add({id:'horserace',name:'HORSE RACE',cat:'SPORTS',vs:1,how:'TAP A TO WHIP. TOO MUCH TIRES YOUR HORSE. WATCH THE STAMINA BAR.',make(){
 const g={over:null,score:0};let r=[{p:0,v:1,st:100},{p:0,v:1,st:100}],t=-90;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];let whip=A.cpu&&i===1?(q.st>25+(1-A.ai)*15&&Math.random()<.05+A.ai*.04):A.hit(i).a;if(whip&&q.st>0){q.v+=.35;q.st-=7;if(!(A.cpu&&i===1))S('blip');}q.st=Math.min(100,q.st+.15);q.v+=((q.st>10?1.6:.9)-q.v)*.02;q.p+=q.v;if(q.p>=1500){g.over=A.win(i);S('win');}}};
 g.draw=()=>{A.cls('#4dabff');R(0,90,W,150,'#6aa84a');R(0,110,W,110,'#c4915a');const cam=Math.max(r[0].p,r[1].p)-160;for(let x=-cam%40;x<W;x+=40)R(x,100,3,10,K.w);R(1500-cam+40,105,4,120,K.w);
  r.forEach((q,i)=>{const x=q.p-cam+40,y=150+i*45,s=Math.sin(t*.4*q.v);R(x-16,y-10,32,12,i?'#5b3a1e':'#8a5c33');R(x+12,y-18,8,10,i?'#5b3a1e':'#8a5c33');R(x-12,y+2,3,10+s*3,'#3a2a18');R(x+8,y+2,3,10-s*3,'#3a2a18');R(x-4,y-22,8,10,i?K.p:K.c);
   R(i?W-66:6,20+i*0,60,5,K.k);R(i?W-66:6,20,60*q.st/100,5,q.st>30?K.g:K.r);});A.hud2('','');T(t<0?'AND THEY\'RE OFF...':'',160,60,K.k,1,'c');};
 return g;}});

A.add({id:'goalie',name:'GOALKEEPER',cat:'SPORTS',how:'LEFT/RIGHT DIVE, UP JUMPS. SAVE THE SHOTS. 3 GOALS AND YOU\'RE OUT.',make(){
 const g={over:null,score:0};let k={x:160,y:180,vx:0,vy:0,air:0},ball=null,t=0,conc=0,msg='',mt=0;const shot=()=>{const tx=90+rnd(140),ty=110+rnd(70),sp=35-Math.min(18,g.score);ball={x:160,y:236,z:0,tx,ty,t:0,T:sp,curve:rnd(2)-1};};
 g.update=()=>{t++;if(mt>0)mt--;const K_=A.in(0);if(k.air<=0){k.vx=ax(K_)*3.2;if(A.hit(0).u){k.vy=-4.5;k.air=1;}}k.x=cl(k.x+k.vx,80,240);if(k.air){k.vy+=.3;k.y+=k.vy;if(k.y>=180){k.y=180;k.air=0;k.vy=0;}}
  if(!ball){if(t%60===0)shot();return;}ball.t++;const f=ball.t/ball.T;ball.x=160+(ball.tx-160)*f+Math.sin(f*3.14)*ball.curve*20;ball.y=236+(ball.ty-236)*f;
  if(f>=.9&&!ball.done&&Math.abs(ball.x-k.x)<20&&ball.y>k.y-40&&ball.y<k.y+4){ball.done=1;g.score++;msg='SAVE!';mt=40;S('hit');A.burst(ball.x,ball.y,K.w,12);ball=null;t=1;return;}
  if(f>=1){if(!ball.done){conc++;msg='GOAL';mt=40;S('lose');if(conc>=3)g.over='3 CONCEDED';}ball=null;t=1;}};
 g.draw=()=>{A.cls('#2a5db0');R(0,190,W,50,'#1e8a45');A.box(80,100,160,92,K.w);for(let i=1;i<10;i++)L(80+i*16,100,80+i*16,190,'rgba(255,255,255,.25)');for(let i=1;i<6;i++)L(80,100+i*16,240,100+i*16,'rgba(255,255,255,.25)');
  R(k.x-8,k.y-30,16,22,K.y);R(k.x-6,k.y-40,12,10,'#ffd9a8');R(k.x-18,k.y-30,10,5,K.y);R(k.x+8,k.y-30,10,5,K.y);R(k.x-6,k.y-8,5,8,K.k);R(k.x+1,k.y-8,5,8,K.k);if(ball)C(ball.x,ball.y,4+(1-ball.t/ball.T)*4,K.w);
  T('SAVES '+g.score,6,6,K.w,2);T('X'.repeat(conc),W-6,6,K.r,2,'r');if(mt)T(msg,160,60,msg==='GOAL'?K.r:K.y,3,'c');};
 return g;}});

A.add({id:'freethrow',name:'FREE THROW',cat:'SPORTS',how:'PRESS A TWICE: STOP THE AIM, THEN THE POWER. 20 SHOTS.',make(){
 const g={over:null,score:0};let ph=0,t=0,aim=0,pw=0,ball=null,n=0,msg='',mt=0,streak=0;
 g.update=()=>{t++;if(mt>0)mt--;if(ball){ball.vy+=.2;ball.x+=ball.vx;ball.y+=ball.vy;if(ball.vy>0&&Math.abs(ball.x-250)<9&&Math.abs(ball.y-90)<5&&!ball.done){ball.done=1;streak++;g.score+=streak>=3?3:2;msg=streak>=3?'ON FIRE +3':'SWISH +2';mt=40;S('score');A.burst(250,95,K.o,14);}if(ball.y>230){if(!ball.done){streak=0;msg='MISS';mt=40;S('lose');}ball=null;n++;ph=0;t=0;if(n>=20)g.over=g.score+' POINTS';}return;}
  if(ph===0){aim=Math.sin(t*.06);if(A.hit(0).a){ph=1;t=0;}}else{pw=.5+.5*Math.sin(t*.08);if(A.hit(0).a){const e=aim*.35,p=(pw-.62)*3;ball={x:70,y:170,vx:3.8+p*.4+e*.2,vy:-6.1-p*.6+e*.3};S('shoot');}}};
 g.draw=()=>{A.cls('#241a4d');R(0,200,W,40,'#b5651d');R(262,50,4,150,K.w);R(258,56,16,50,'rgba(255,255,255,.3)');A.box(258,56,16,50,K.w);R(240,90,20,3,K.r);for(let i=0;i<4;i++)L(242+i*5,93,244+i*4,106,K.gr);
  R(62,172,16,28,streak>=3?K.o:K.c);R(64,162,12,10,'#ffd9a8');if(ball)C(ball.x,ball.y,6,K.o);else{C(72,160,6,K.o);A.box(20,210,80,8,K.w);R(59+aim*39,209,2,10,K.y);if(ph===1){A.box(8,60,10,100,K.w);R(10,158-pw*96,6,pw*96,K.r);R(8,158-.62*96,10,1,K.g);}}
  T('SCORE '+g.score,6,6,K.y,2);T('SHOT '+Math.min(n+1,20)+'/20',W-6,6,K.w,2,'r');if(mt)T(msg,160,40,K.y,2,'c');};
 return g;}});

A.add({id:'cricket',name:'CRICKET',cat:'SPORTS',how:'LEFT/RIGHT STEP, A SWINGS. TIME IT TO HIT THE GAPS. 3 WICKETS.',make(){
 const g={over:null,score:0};let bx=160,ball=null,t=0,sw=0,wk=3,msg='',mt=0,balls=0,fly=null;
 g.update=()=>{t++;if(mt>0)mt--;if(sw>0)sw--;bx=cl(bx+ax(A.in(0))*1.5,130,190);if(A.hit(0).a&&sw===0)sw=14;
  if(fly){fly.x+=fly.vx;fly.y+=fly.vy;fly.vy+=.05;if(fly.y>200||fly.x<0||fly.x>W){fly=null;}return;}
  if(!ball){if(t>60){ball={z:0,x:160+rnd(40)-20,v:.012+balls*.0004+rnd(.004),sw:rnd(.6)-.3};t=0;}return;}ball.z+=ball.v;ball.x+=ball.sw;
  if(ball.z>.85&&ball.z<.97&&sw>6&&Math.abs(ball.x-bx)<22){const q=1-Math.abs(ball.z-.91)/.06,runs=q>.8?6:q>.5?4:q>.25?2:1;g.score+=runs;msg=runs===6?'SIX!':runs===4?'FOUR!':runs+' RUN'+(runs>1?'S':'');mt=50;S(runs>=4?'score':'hit');fly={x:ball.x,y:150,vx:(rnd(2)-1)*4,vy:-2-q*3};ball=null;balls++;t=0;return;}
  if(ball.z>=1){if(Math.abs(ball.x-160)<10){wk--;msg='BOWLED!';S('boom');A.burst(160,190,K.w,14);if(wk<=0)g.over='ALL OUT FOR '+g.score;}else msg='DOT BALL';mt=40;ball=null;balls++;t=0;}};
 g.draw=()=>{A.cls('#6aa84a');A.poly([[140,40],[180,40],[210,236],[110,236]],'#c4a56a',1);R(154,184,12,20,K.w);for(let i=0;i<3;i++)R(155+i*4,180,2,24,'#e8e0c8');R(153,178,14,2,'#e8e0c8');
  R(160-6,34,12,16,K.p);if(ball){const y=40+ball.z*150,s=2+ball.z*5;C(ball.x,y,s,K.r);}if(fly)C(fly.x,fly.y,3,K.r);R(bx-6,170,12,24,K.c);R(bx-4,160,8,10,'#ffd9a8');const a=sw>0?-1.4+(14-sw)*.2:-2.2;L(bx+6,184,bx+6+Math.cos(a)*22,184+Math.sin(a)*22,'#d9a55b',3);
  T('RUNS '+g.score,6,6,K.w,2);T('WICKETS '+wk,W-6,6,K.r,2,'r');if(mt)T(msg,160,110,K.y,3,'c');};
 return g;}});
})();
