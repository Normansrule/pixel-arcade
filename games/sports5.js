(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const tap=(i,q)=>{if(A.cpu&&i===1){q.v+=((2+2*A.ai)-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const guy=(x,y,c,st)=>{R(x-5,y-22,10,14,c);R(x-4,y-31,8,8,'#ffd9a8');R(x-5+(st?4:-3),y-8,4,10,K.w);R(x+1+(st?-4:3),y-8,4,10,K.w);};

A.add({id:'polevault',name:'POLE VAULT',cat:'SPORTS',how:'TAP LEFT/RIGHT TO RUN. HOLD A TO PLANT, RELEASE AT THE TOP. 3 TRIES.',make(){
 const g={over:null,score:0};let q={p:0,v:0,last:''},ph='run',y=0,vy=0,bar=4,tries=3,msg='',mt=0,plant=0;
 g.update=()=>{if(mt>0){if(--mt===0){if(tries<=0){g.over=(bar-.2).toFixed(1)+' M';return;}q={p:0,v:0,last:''};ph='run';y=0;}return;}
  if(ph==='run'){tap(0,q);q.p+=q.v*.5;if(A.in(0).a&&q.p>180){ph='plant';plant=q.v;}if(q.p>240){msg='NO JUMP';tries--;mt=60;}}
  else if(ph==='plant'){y+=plant*.9;if(!A.in(0).a||y>plant*28){ph='air';vy=-plant*.4;}}else if(ph==='air'){vy+=.12;y-=vy;const h=y/20;if(vy>0&&y<=0){y=0;const cleared=g._max>=bar;msg=cleared?'CLEARED '+bar.toFixed(1)+' M':'KNOCKED THE BAR';if(cleared){g.score=Math.round(bar*10);bar+=.2;S('score');}else{tries--;S('lose');}mt=70;g._max=0;return;}g._max=Math.max(g._max||0,h);}};
 g.draw=()=>{A.cls('#4dabff');R(0,200,W,40,'#c4552d');R(260,200-bar*20,4,bar*20,K.w);R(290,200-bar*20,4,bar*20,K.w);R(262,200-bar*20,30,2,K.y);R(250,196,60,6,'#2a5db0');for(let m=1;m<=6;m++)T(m+'M',300,196-m*20,K.w);
  const x=ph==='run'?20+q.p:230+Math.min(40,y*.4);guy(x,200-y,K.c,Math.floor(q.p/8)%2);if(ph!=='air')L(x+6,190-y,x+30,178-y-(ph==='plant'?y*.2:0),K.y,2);T('BAR '+bar.toFixed(1)+' M',6,6,K.k,2);T('TRIES '+tries,W-6,6,K.k,2,'r');if(mt)T(msg,160,60,K.y,2,'c');};
 return g;}});

A.add({id:'shotput',name:'SHOT PUT',cat:'SPORTS',how:'A THREE TIMES: SPIN, POWER, ANGLE. BEST OF 3 THROWS.',make(){
 const g={over:null,score:0};let ph=0,t=0,pw=0,ang=0,ball=null,n=0,best=0,msg='',mt=0;
 g.update=()=>{t++;if(mt>0){if(--mt===0){n++;if(n>=3){g.over=best.toFixed(2)+' M';return;}ph=0;ball=null;}return;}
  if(ball){ball.vy+=.12;ball.x+=ball.vx;ball.y+=ball.vy;if(ball.y>=0){const d=ball.x/12;best=Math.max(best,d);g.score=Math.round(best*100);msg=d.toFixed(2)+' M';mt=70;S('score');A.burst(40+ball.x*1.1,200,'#c4915a',12);}return;}
  if(ph===0&&A.hit(0).a){ph=1;t=0;}else if(ph===1){pw=.5+.5*Math.sin(t*.1);if(A.hit(0).a){ph=2;t=0;}}else if(ph===2){ang=.5+.4*Math.sin(t*.06);if(A.hit(0).a){const v=3+pw*4.5,q=1-Math.abs(ang-.72)*1.5;ball={x:0,y:-18,vx:v*Math.cos(ang)*q,vy:-v*Math.sin(ang)};S('shoot');}}};
 g.draw=()=>{A.cls('#4dabff');R(0,200,W,40,'#6aa84a');for(let m=5;m<=25;m+=5){const x=40+m*12*1.1;R(x,200,1,40,'rgba(255,255,255,.5)');T(m,x+2,204,K.w);}A.ring(40,210,14,K.w);
  if(ball)C(40+ball.x*1.1,200+ball.y,4,'#555566');else{guy(40,210,K.c,t%10<5);C(48,186,4,'#555566');}if(ph===1){A.box(8,60,10,100,K.k);R(10,158-pw*96,6,pw*96,K.r);}if(ph===2)L(48,186,48+Math.cos(ang)*30,186-Math.sin(ang)*30,K.y,2);
  T('THROW '+Math.min(n+1,3)+'/3',6,6,K.k,2);T('BEST '+best.toFixed(2)+' M',W-6,6,K.k,2,'r');if(ph===0&&!ball)T('PRESS A',160,60,K.k,2,'c');if(mt)T(msg,160,60,K.y,3,'c');};
 return g;}});

A.add({id:'hammer',name:'HAMMER THROW',cat:'SPORTS',how:'TAP LEFT/RIGHT TO SPIN FASTER. PRESS A WHEN THE ARROW POINTS AT THE FIELD.',make(){
 const g={over:null,score:0};let a=0,sp=0,q={v:0,last:''},ball=null,n=0,best=0,msg='',mt=0;
 g.update=()=>{if(mt>0){if(--mt===0){n++;if(n>=3){g.over=best.toFixed(1)+' M';return;}sp=0;a=0;ball=null;q={v:0,last:''};}return;}
  if(ball){ball.x+=ball.vx;ball.y+=ball.vy;ball.vx*=.985;ball.vy*=.985;if(Math.hypot(ball.vx,ball.vy)<.2){const d=Math.hypot(ball.x-60,ball.y-120)/3,inF=Math.abs(Math.atan2(ball.y-120,ball.x-60))<.5;msg=inF?d.toFixed(1)+' M':'FOUL';if(inF){best=Math.max(best,d);g.score=Math.round(best*10);}mt=70;S(inF?'score':'lose');}return;}
  tap(0,q);sp=Math.min(.35,q.v*.06);a+=sp;if(A.hit(0).a&&sp>.02){const v=sp*20;ball={x:60+Math.cos(a)*16,y:120+Math.sin(a)*16,vx:-Math.sin(a)*v,vy:Math.cos(a)*v};S('shoot');}};
 g.draw=()=>{A.cls('#6aa84a');A.poly([[60,120],[W,120-Math.tan(.5)*260],[W,120+Math.tan(.5)*260]],'#7ab85a',1);for(let m=20;m<=80;m+=20)A.ring(60,120,m*3,'rgba(255,255,255,.3)');C(60,120,10,'#c4c4c4');
  if(ball)C(ball.x,ball.y,4,'#333');else{L(60,120,60+Math.cos(a)*16,120+Math.sin(a)*16,'#888',2);C(60+Math.cos(a)*16,120+Math.sin(a)*16,4,'#333');const ok=Math.abs(Math.atan2(Math.cos(a),-Math.sin(a)))<.5;C(60,120,5,ok?K.g:K.r);}
  T('THROW '+Math.min(n+1,3)+'/3',6,6,K.k,2);T('BEST '+best.toFixed(1)+' M',W-6,6,K.k,2,'r');if(mt)T(msg,160,30,K.y,3,'c');};
 return g;}});

A.add({id:'surf',name:'SURF',cat:'SPORTS',how:'UP/DOWN RIDE THE WAVE FACE. A AT THE LIP FOR A TRICK. DON\'T WIPE OUT.',make(){
 const g={over:null,score:0};let y=150,vy=0,air=0,spin=0,t=0,crash=0,lives=3;
 g.update=()=>{t++;if(crash>0){crash--;return;}const lip=110+Math.sin(t*.02)*10,k=A.in(0);if(air){vy+=.3;y+=vy;if(A.hit(0).a){spin++;S('blip');}if(y>=lip+10){air=0;if(spin>0){g.score+=spin*50;S('score');}spin=0;}return;}
  vy+=ay(k)*.4;vy*=.9;y=cl(y+vy,lip,200);if(y<=lip+2&&A.hit(0).a){air=1;vy=-5;S('jump');}if(y>=199){lives--;crash=60;S('boom');y=150;if(lives<=0)g.over='WIPED OUT';}if(t%10===0)g.score++;};
 g.draw=()=>{A.cls('#4dabff');C(260,40,18,K.y);const lip=110+Math.sin(t*.02)*10;A.c.fillStyle='#1b6fb8';A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=8)A.c.lineTo(x,lip+10+Math.sin(x*.05+t*.1)*4+x*.2);A.c.lineTo(W,H);A.c.fill();for(let x=0;x<W;x+=8)R(x,lip+8+Math.sin(x*.05+t*.1)*4+x*.2,8,3,K.w);
  const x=120;A.c.save();A.c.translate(x,y);A.c.rotate(air?spin*1.57+t*.2:vy*.1);R(-14,4,28,4,K.o);R(-4,-14,8,18,K.p);C(0,-17,4,'#ffd9a8');A.c.restore();if(crash)T('WIPEOUT',160,80,K.w,3,'c');T('SCORE '+g.score,6,6,K.k,2);T('LIVES '+lives,W-6,6,K.k,2,'r');};
 return g;}});

A.add({id:'trials',name:'BIKE TRIALS',cat:'SPORTS',how:'UP GAS, DOWN BRAKE, LEFT/RIGHT LEAN. LAND ON YOUR WHEELS. REACH THE FLAG.',make(){
 const g={over:null,score:0},gr=x=>{const s=x/60;return 190-Math.max(0,Math.sin(s)*30+Math.sin(s*2.7)*15+(x>600?Math.sin(x/40)*20:0));};let b={x:40,y:gr(40)-10,vx:0,vy:0,a:0,va:0},t=0,crash=0,lives=3,cam=0;
 g.update=()=>{t++;if(crash>0){if(--crash===0){b={x:Math.max(40,b.x-60),y:gr(Math.max(40,b.x-60))-12,vx:0,vy:0,a:0,va:0};}return;}const k=A.in(0);const gy=gr(b.x),on=b.y>=gy-10.5;
  if(on){const slope=Math.atan2(gr(b.x+4)-gr(b.x-4),8);b.vx+=(k.u?.12:0)-(k.d?.1:0)+Math.sin(slope)*.1;b.vx*=.99;b.y=gy-10;b.vy=0;if(Math.abs(b.a-slope)>.9){lives--;crash=60;S('boom');A.burst(b.x-cam,b.y,K.o,20,3);if(lives<=0)g.over='CRASHED OUT';return;}b.a+=(slope-b.a)*.2+ax(k)*.02;}else{b.vy+=.25;b.va+=ax(k)*.006;b.a+=b.va;b.va*=.96;}
  b.x+=b.vx;b.y+=b.vy;if(on&&b.vx>2&&gr(b.x+6)>gy+1){b.vy=-b.vx*.3;}cam=Math.max(0,b.x-100);g.score=Math.max(g.score,b.x/10|0);if(b.x>1500){g.over='FINISH! WIN';A.confetti();}};
 g.draw=()=>{A.cls('#ff9a5a');A.c.fillStyle='#5b3a1e';A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=4)A.c.lineTo(x,gr(x+cam));A.c.lineTo(W,H);A.c.fill();R(1500-cam,gr(1500)-40,2,40,K.k);R(1502-cam,gr(1500)-40,12,8,K.r);
  if(!crash){A.c.save();A.c.translate(b.x-cam,b.y);A.c.rotate(b.a);C(-10,6,5,'#222222');C(10,6,5,'#222222');R(-10,-2,20,4,K.r);R(-3,-14,6,12,K.c);C(0,-17,4,'#ffd9a8');A.c.restore();}T(g.score+' / 150',6,6,K.k,2);T('LIVES '+lives,W-6,6,K.k,2,'r');};
 return g;}});

A.add({id:'airrace',name:'AIR RACE',cat:'SPORTS',how:'FLY THROUGH THE GATES IN ORDER. MISS ONE AND LOSE 3 SECONDS. BEAT 60 SEC.',low:1,make(){
 const g={over:null,score:0};let p={x:40,y:120,vx:2,vy:0},gates=[],idx=0,t=0,pen=0,cam=0;for(let i=0;i<12;i++)gates.push({x:200+i*140,y:60+rnd(130)});
 g.update=()=>{t++;const k=A.in(0);p.vy=cl(p.vy+ay(k)*.2,-3,3)*.95;p.vx=cl(p.vx+(k.r?.05:k.l?-.05:0),1.5,4);p.x+=p.vx;p.y=cl(p.y+p.vy,20,220);cam=p.x-80;const gt=gates[idx];if(gt&&p.x>gt.x){if(Math.abs(p.y-gt.y)<22){S('coin');A.burst(gt.x-cam,gt.y,K.g,10);}else{pen+=180;S('lose');}idx++;if(idx>=gates.length){g.score=Math.round((t+pen)/6)/10;g.over=(g.score).toFixed(1)+' SEC';}}};
 g.draw=()=>{A.skyband('#4dabff','#dff4ff',H);R(0,225,W,15,'#6aa84a');gates.forEach((q,i)=>{const x=q.x-cam;if(x<-20||x>W+20)return;const c=i<idx?'#888888':i===idx?K.r:K.o;R(x-2,q.y-26,4,52,c);R(x-8,q.y-28,16,4,c);R(x-8,q.y+24,16,4,c);});R(p.x-cam-10,p.y-3,20,6,K.c);R(p.x-cam-4,p.y-9,6,14,K.c);R(p.x-cam+10,p.y-1,4,2,K.w);
  T(((t+pen)/60).toFixed(1)+' S',6,6,K.k,2);T('GATE '+Math.min(idx+1,12)+'/12',W-6,6,K.k,2,'r');if(pen)T('+'+(pen/60)+'S PENALTY',160,20,K.r,1,'c');};
 return g;}});

A.add({id:'canoe',name:'CANOE SLALOM',cat:'SPORTS',how:'TAP LEFT/RIGHT TO PADDLE AND STEER. PASS GREEN GATES ON THE LEFT, RED ON THE RIGHT.',make(){
 const g={over:null,score:0};let b={x:160,y:200,a:-1.57,v:0},gates=[],t=0,last='',miss=0;for(let i=0;i<14;i++)gates.push({x:60+rnd(200),y:-i*110,c:i%2,ok:0});
 g.update=()=>{t++;const h=A.hit(0);if(h.l&&last!=='l'){b.v+=.8;b.a+=.12;last='l';S('blip');}if(h.r&&last!=='r'){b.v+=.8;b.a-=.12;last='r';S('blip');}b.v*=.97;b.x+=Math.cos(b.a)*b.v;b.y+=Math.sin(b.a)*b.v-1.2;b.x=cl(b.x,40,280);b.a+=(-1.57-b.a)*.01;
  const scrollY=b.y-200;for(const q of gates){if(!q.ok&&b.y<q.y){q.ok=1;const good=q.c?b.x<q.x+30&&b.x>q.x:b.x>q.x-30&&b.x<q.x;if(good){g.score+=20;S('coin');}else{miss++;S('lose');}}}if(gates.every(q=>q.ok)){g.over=miss?miss+' MISSED':'CLEAN RUN! WIN';}g.cam=scrollY;};g.cam=0;
 g.draw=()=>{A.cls('#1b6fb8');const cy=g.cam;for(let i=0;i<20;i++){const y=((i*37-cy*.9)%H+H)%H;R((i*71)%W,y,14,2,'#3a8fd8');}R(0,0,34,H,'#3f6a3a');R(286,0,34,H,'#3f6a3a');gates.forEach(q=>{const y=q.y-cy;if(y<-10||y>H+10)return;R(q.x-1,y-14,2,14,q.c?K.g:K.r);R(q.x+(q.c?0:-30),y-2,30,2,q.ok?'#888888':q.c?K.g:K.r);});
  const y=b.y-cy;A.c.save();A.c.translate(b.x,y);A.c.rotate(b.a+1.57);A.poly([[0,-12],[5,0],[0,12],[-5,0]],K.y,1);C(0,0,3,'#ffd9a8');A.c.restore();T('SCORE '+g.score,6,6,K.w,2);T('MISSED '+miss,W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'climb',name:'SPEED CLIMB',cat:'SPORTS',vs:1,how:'TAP UP THEN A, UP THEN A... TO CLIMB. WRONG ORDER SLIPS. FIRST TO THE TOP.',make(){
 const g={over:null,score:0};let r=[{h:0,next:'u',slip:0},{h:0,next:'u',slip:0}],t=-90;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];if(q.slip>0){q.slip--;q.h=Math.max(0,q.h-.2);continue;}if(A.cpu&&i===1){if(t%Math.max(4,12-A.ai*8|0)===0){if(Math.random()<.05*(1-A.ai)){q.slip=20;}else{q.h+=2.2;}}}else{const h=A.hit(i);if(h.u||h.a){const k=h.u?'u':'a';if(k===q.next){q.h+=2.2;q.next=k==='u'?'a':'u';S('blip');}else{q.slip=20;S('lose');}}}if(q.h>=180){g.over=A.win(i);S('win');}}};
 g.draw=()=>{A.cls('#2a2a38');[0,1].forEach(i=>{const x=90+i*140;R(x-40,20,80,200,'#5a5a6a');for(let k=0;k<20;k++)C(x-30+(k*17)%60,30+k*10,3,[K.r,K.y,K.b,K.g][k%4]);const y=210-r[i].h;R(x-5,y-14,10,14,i?K.p:K.c);C(x,y-18,4,'#ffd9a8');L(x-5,y-10,x-10,y-18,'#ffd9a8',2);L(x+5,y-10,x+10,y-4,'#ffd9a8',2);if(r[i].slip)T('SLIP',x,y-30,K.r,1,'c');});R(40,20,240,2,K.y);A.hud2('','');T(t<0?'READY':'',160,110,K.w,2,'c');};
 return g;}});

A.add({id:'penaltyduel',name:'PENALTY DUEL',cat:'SPORTS',vs:1,how:'SHOOTER: HOLD LEFT/RIGHT/UP AND PRESS A. KEEPER: HOLD A DIRECTION. 5 EACH.',make(){
 const g={over:null,score:0};let sc=[0,0],rd=0,ph='aim',t=0,sh=null,kp=null,res='',cpuS=null,cpuK=null;
 g.update=()=>{t++;const s=rd%2,k_=1-s;if(ph==='aim'){if(A.cpu&&s===1&&!cpuS)cpuS={x:Math.random()<.5?-1:1,y:ri(2)};if(A.cpu&&k_===1&&!cpuK){const hs=g.hist||[];let x=ri(3)-1;if(hs.length&&Math.random()<.35+A.ai*.45){const c={'-1':0,'0':0,'1':0};hs.forEach(v=>c[v]++);x=+Object.keys(c).sort((a,b)=>c[b]-c[a])[0];}cpuK={x,y:ri(2)};}
   const fire=A.cpu&&s===1?t>50:A.hit(A.two?s:0).a;if(fire||t>240){const hk=A.cpu&&k_===1?cpuK:{x:ax(A.in(A.two?k_:0)),y:A.in(A.two?k_:0).u?1:0};const hs=A.cpu&&s===1?cpuS:{x:ax(A.in(A.two?s:0)),y:A.in(A.two?s:0).u?1:0};sh=hs;kp=hk;if(A.cpu&&s===0)(g.hist=g.hist||[]).push(hs.x);ph='fly';t=0;S('shoot');}}
  else if(ph==='fly'&&t>30){const saved=sh.x===kp.x&&(sh.y===kp.y||sh.x===0);res=saved?'SAVED':'GOAL';if(!saved)sc[s]++;S(saved?'hit':'score');ph='res';t=0;}else if(ph==='res'&&t>60){rd++;ph='aim';t=0;cpuS=cpuK=null;if(rd>=10&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);}};
 g.draw=()=>{A.cls('#2a5db0');R(0,130,W,110,'#1e8a45');A.box(80,70,160,64,K.w);const s=rd%2;const f=ph==='aim'?0:Math.min(1,t/30);const kx=160+(kp&&ph!=='aim'?kp.x*50*f:0),ky=132-(kp&&ph!=='aim'&&kp.y?24*f:0);R(kx-8,ky-30,16,26,(1-s)?K.p:K.c);C(kx,ky-34,5,'#ffd9a8');
  let bx=160,by=210;if(sh&&ph!=='aim'){bx=160+sh.x*60*f;by=210-(210-(sh.y?88:120))*f;}C(bx,by,6-f*2,K.w);A.hud2(sc[0],sc[1]);T(ph==='aim'?A.nm(s)+' SHOOTS - '+A.nm(1-s)+' KEEPS':ph==='res'?res:'',160,24,K.y,1,'c');};
 return g;}});

A.add({id:'archduel',name:'ARCHERY DUEL',cat:'SPORTS',vs:1,how:'A TWICE: LOCK AIM, LOCK HEIGHT. CLOSEST TO THE BULLSEYE WINS EACH END. BEST OF 5.',make(){
 const g={over:null,score:0};let p=0,ph=0,t=0,cx=160,cy=110,wind=0,arrows=[],sc=[0,0],ends=0,msg='',mt=0;const nw=()=>{wind=Math.round(rnd(20)-10);};nw();
 g.update=()=>{t++;if(mt>0){if(--mt===0){arrows=[];nw();if(sc[0]>=3||sc[1]>=3)g.over=A.win(sc[0]>=3?0:1);}return;}const cpu=A.cpu&&p===1,h=A.hit(A.two?p:0).a;
  if(ph===0){cx=160+Math.sin(t*.06)*60;if(cpu?Math.abs(cx-(160-wind))<4+(1-A.ai)*20:h){ph=1;t=0;}}else if(ph===1){cy=110+Math.sin(t*.07)*55;if(cpu?Math.abs(cy-110)<3+(1-A.ai)*18:h){arrows.push({x:cx+wind,y:cy+rnd(4)-2,o:p});S('hit');ph=0;t=rnd(100)|0;if(p===1){const d=arrows.map(a=>Math.hypot(a.x-160,a.y-110));const w=d[0]<d[1]?0:1;sc[w]++;msg=A.nm(w)+' TAKES THE END';mt=70;S('score');ends++;}p=1-p;}}};
 g.draw=()=>{A.cls('#2a5db0');R(0,170,W,70,'#1e8a45');R(157,150,6,40,'#5b3a1e');[[40,K.w],[30,K.k],[21,K.b],[13,K.r],[6,K.y]].forEach(v=>C(160,110,v[0],v[1]));arrows.forEach(a=>{C(a.x,a.y,2.5,a.o?K.p:K.c);L(a.x,a.y,a.x+4,a.y+4,K.w);});
  if(!mt){L(cx,20,cx,200,'rgba(255,255,255,.5)');if(ph===1)L(60,cy,260,cy,'rgba(255,255,255,.5)');}A.hud2(sc[0],sc[1]);T('WIND '+(wind>0?'>> ':wind<0?'<< ':'')+Math.abs(wind),160,212,K.w,1,'c');T(mt?msg:A.nm(p)+' SHOOTS',160,24,K.y,1,'c');};
 return g;}});
})();
