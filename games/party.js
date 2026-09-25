(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;

/* ---- POOL SHARK ---- */
A.add({id:'pool',name:'POOL SHARK',cat:'PARTY',vs:1,how:'LEFT/RIGHT AIM. HOLD A, RELEASE TO SHOOT. POT YOUR 3 BALLS THEN THE BLACK.',make(){
 const g={over:null,score:0};let balls=[],p=0,ang=0,pow=0,chg=false,moving=false,potted=[[],[]],msg='',mt=0,think=0,aiPlan=null;
 const cue=()=>balls.find(b=>b.id===0);
 const setup=()=>{balls=[{id:0,x:80,y:120,vx:0,vy:0,c:K.w}];const cols=[K.r,K.y,K.r,K.k,K.y,K.r,K.y];let n=1;for(let r=0;r<3;r++)for(let j=0;j<=r;j++){balls.push({id:n,x:210+r*12,y:120+(j-r/2)*13,vx:0,vy:0,c:cols[n-1],t:cols[n-1]===K.r?0:cols[n-1]===K.y?1:2});n++;}};setup();
 const POCK=[[14,24],[160,20],[306,24],[14,216],[160,220],[306,216]];
 g.update=()=>{if(mt>0)mt--;if(moving){let any=false;for(const b of balls){b.x+=b.vx;b.y+=b.vy;b.vx*=.985;b.vy*=.985;if(Math.hypot(b.vx,b.vy)<.05){b.vx=b.vy=0;}else any=true;if(b.x<20){b.x=20;b.vx=Math.abs(b.vx);}if(b.x>W-20){b.x=W-20;b.vx=-Math.abs(b.vx);}if(b.y<28){b.y=28;b.vy=Math.abs(b.vy);}if(b.y>H-28){b.y=H-28;b.vy=-Math.abs(b.vy);}}
   for(let i=0;i<balls.length;i++)for(let j=i+1;j<balls.length;j++){const a=balls[i],b=balls[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<12&&d>0){const nx=dx/d,ny=dy/d,rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx;a.vy+=rv*ny;b.vx-=rv*nx;b.vy-=rv*ny;S('hit');}const o=(12-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;}}
   for(const b of balls.slice()){if(POCK.some(q=>Math.hypot(q[0]-b.x,q[1]-b.y)<11)){balls.splice(balls.indexOf(b),1);S('score');if(b.id===0){balls.push({id:0,x:80,y:120,vx:0,vy:0,c:K.w});msg='SCRATCH';mt=60;}else if(b.t===2){const mine=potted[p].length>=3;g.over=mine?A.win(p):A.win(1-p);return;}else{const own=b.t===p;potted[own?p:1-p].push(b);if(own){msg='POTTED!';g.again=true;}else msg='WRONG BALL';mt=60;}}}
   if(!any){moving=false;if(!g.again)p=1-p;g.again=false;think=0;aiPlan=null;}return;}
  const c=cue();if(!c)return;
  if(A.cpu&&p===1){if(++think<40)return;if(!aiPlan){const tg=balls.filter(b=>b.t===1).concat(potted[1].length>=3?balls.filter(b=>b.t===2):[])[0]||balls.find(b=>b.id!==0);let best=null,bs=1e9;for(const q of POCK){const dx=q[0]-tg.x,dy=q[1]-tg.y,d=Math.hypot(dx,dy),gx=tg.x-dx/d*12,gy=tg.y-dy/d*12,a=Math.atan2(gy-c.y,gx-c.x);const sc=d+Math.abs(Math.atan2(dy,dx)-a)*80;if(sc<bs){bs=sc;best={a:a+(rnd(.1)-.05)*(2-A.ai*1.5),pw:.55+rnd(.25)};}}aiPlan=best;}
   ang+=(aiPlan.a-ang)*.1;if(Math.abs(aiPlan.a-ang)<.01&&think>70){c.vx=Math.cos(aiPlan.a)*(2+aiPlan.pw*7);c.vy=Math.sin(aiPlan.a)*(2+aiPlan.pw*7);moving=true;S('shoot');}return;}
  const k=A.in(human(p));ang+=ax(k)*(k.b?.008:.03);if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;c.vx=Math.cos(ang)*(2+pow*7);c.vy=Math.sin(ang)*(2+pow*7);moving=true;S('shoot');}};
 g.draw=()=>{A.cls('#5b3a1e');R(12,20,W-24,H-40,'#1e8a45');A.box(12,20,W-24,H-40,'#8a5c33');POCK.forEach(q=>C(q[0],q[1],9,K.k));balls.forEach(b=>{C(b.x,b.y,6,b.c);C(b.x-2,b.y-2,2,'rgba(255,255,255,.5)');});
  const c=cue();if(c&&!moving){for(let i=1;i<14;i++){const x=c.x+Math.cos(ang)*i*12,y=c.y+Math.sin(ang)*i*12;if(x<20||x>W-20||y<28||y>H-28)break;C(x,y,1,K.w);}L(c.x-Math.cos(ang)*8,c.y-Math.sin(ang)*8,c.x-Math.cos(ang)*(50+(chg?pow*30:0)),c.y-Math.sin(ang)*(50+(chg?pow*30:0)),'#d9a55b',3);if(chg){A.box(8,60,10,100,K.w);R(10,158-pow*96,6,pow*96,K.r);}}
  T(A.nm(0)+' RED '+potted[0].length+'/3',6,4,K.c,1);T('YELLOW '+potted[1].length+'/3 '+A.nm(1),W-6,4,K.p,1,'r');T(A.nm(p)+(potted[p].length>=3?' ON BLACK':' TO SHOOT'),160,226,K.w,1,'c');if(mt>0)T(msg,160,110,K.y,2,'c');};
 return g;}});

/* ---- SHUFFLEBOARD ---- */
A.add({id:'shuffle',name:'SHUFFLEBOARD',cat:'PARTY',vs:1,how:'LEFT/RIGHT AIM. A LOCKS POWER. 4 PUCKS EACH, HIGHEST ZONE SCORES.',make(){
 const g={over:null,score:0};let pucks=[],p=0,n=0,live=null,t=0,aim=0,ph=0,sc=[0,0],rnd_=1,msg='',mt=0;
 g.update=()=>{t++;if(mt>0)mt--;if(live){live.y-=live.vy;live.x+=live.vx;live.vy*=.985;live.vx*=.985;for(const q of pucks){const dx=q.x-live.x,dy=q.y-live.y,d=Math.hypot(dx,dy);if(d<14&&d>0){const nx=dx/d,ny=dy/d,rv=(-live.vy)*ny+live.vx*nx;if(rv>0){q.vx=(q.vx||0)+rv*nx;q.vy=(q.vy||0)+rv*ny;live.vx-=rv*nx;live.vy+=rv*ny;S('hit');}}}pucks.forEach(q=>{q.x+=q.vx||0;q.y+=q.vy||0;q.vx=(q.vx||0)*.97;q.vy=(q.vy||0)*.97;});
   if(Math.abs(live.vy)+Math.abs(live.vx)<.05){if(live.y>20&&live.x>40&&live.x<W-40)pucks.push(live);live=null;n++;p=1-p;ph=0;t=0;pucks=pucks.filter(q=>q.y>20);
    if(n>=8){const zone=q=>q.y<60?3:q.y<100?2:q.y<140?1:0;const s=[0,0];pucks.forEach(q=>s[q.o]+=zone(q));sc[0]+=s[0];sc[1]+=s[1];msg=A.nm(0)+' +'+s[0]+'   '+A.nm(1)+' +'+s[1];mt=90;pucks=[];n=0;rnd_++;if(rnd_>3)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>40){aim=(rnd(.3)-.15)*(2-A.ai);ph=1;t=0;}}else{aim=cl(aim+ax(k)*.02,-.5,.5);if(h.a){ph=1;t=0;}}}
  else{const pw=.5+.5*Math.sin(t*.07);if(cpu?t>25+rnd(20):h.a){const P=cpu?.55+rnd(.2)*(2-A.ai):pw;live={x:160+Math.sin(aim)*40,y:225,vy:2+P*3.5,vx:Math.sin(aim)*(2+P*2),o:p};S('shoot');}}};
 g.draw=()=>{A.cls('#3a2a18');R(40,20,240,H-30,'#e8c77a');[[20,60,3],[60,100,2],[100,140,1]].forEach(z=>{L(40,z[1],W-40,z[1],'#8a5c33');T(z[2],160,(z[0]+z[1])/2-3,'#8a5c33',2,'c');});R(40,20,240,3,K.r);
  pucks.forEach(q=>{C(q.x,q.y,7,q.o?K.p:K.c);C(q.x,q.y,4,q.o?'#a0205a':'#178a7d');});if(live){C(live.x,live.y,7,live.o?K.p:K.c);}
  if(!live){L(160+Math.sin(aim)*40,225,160+Math.sin(aim)*40+Math.sin(aim)*120,225-120*Math.cos(aim),K.y);if(ph===1){A.box(8,60,10,100,K.w);R(10,158-(.5+.5*Math.sin(t*.07))*96,6,(.5+.5*Math.sin(t*.07))*96,K.r);}}
  A.hud2(sc[0],sc[1]);T('ROUND '+Math.min(rnd_,3)+'/3  PUCK '+(n+1)+'/8  '+A.nm(p),160,4,K.w,1,'c');if(mt>0)T(msg,160,180,K.k,1,'c');};
 return g;}});

/* ---- DODGEBALL ---- */
A.add({id:'dodgeball',name:'DODGEBALL',cat:'PARTY',vs:1,how:'MOVE ON YOUR HALF. A THROWS AT YOUR RIVAL. 3 HITS WINS.',make(){
 const g={over:null,score:0};let pl,balls=[],sc=[0,0],wait=40;const reset=()=>{pl=[{x:70,y:120,fx:1,fy:0,cd:0,has:true},{x:250,y:120,fx:-1,fy:0,cd:0,has:true}];balls=[];wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=pl[1],o=pl[0],inc=balls.find(b=>b.o===0&&b.vx>0&&Math.abs(b.y-q.y)<20),loose=balls.find(b=>b.loose&&b.x>160);let b={};if(inc){if(!q.dg||q.dgb!==inc){q.dgb=inc;q.dg=q.y>120?-1:1;if(q.y<70)q.dg=1;if(q.y>170)q.dg=-1;}b={u:q.dg<0,d:q.dg>0};}else q.dg=0;if(inc)b.a=false;else if(!q.has&&loose)b={l:q.x>loose.x+3,r:q.x<loose.x-3,u:q.y>loose.y+3,d:q.y<loose.y-3};else if(q.has)b={u:q.y>o.y+4,d:q.y<o.y-4,a:Math.abs(q.y-o.y)<22&&Math.random()<.1+.15*A.ai};else b={u:q.y>124,d:q.y<116};A.bot(b);}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.3+1.3*A.ai:2.6;if(ax(k)||ay(k)){q.fx=ax(k);q.fy=ay(k);}q.x=cl(q.x+ax(k)*sp,i?172:14,i?W-14:148);q.y=cl(q.y+ay(k)*sp,34,H-14);if(q.cd>0)q.cd--;
   if(A.hit(i).a&&q.has&&q.cd===0){q.has=false;q.cd=20;const o=pl[1-i],dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy);balls.push({x:q.x,y:q.y,vx:dx/d*5.5,vy:dy/d*5.5+(rnd(1)-.5),o:i,loose:false});S('shoot');}
   for(const b of balls){if(b.loose&&Math.hypot(b.x-q.x,b.y-q.y)<12&&!q.has){q.has=true;b.dead=1;S('blip');}else if(!b.loose&&b.o!==i&&Math.hypot(b.x-q.x,b.y-q.y)<10){b.dead=1;sc[1-i]++;S('boom');if(sc[1-i]>=3){g.over=A.win(1-i);return;}reset();return;}}}
  for(const b of balls){b.x+=b.vx;b.y+=b.vy;if(!b.loose){b.vx*=.995;}else{b.vx*=.95;b.vy*=.95;}if(b.x<14||b.x>W-14){b.vx*=-.6;b.x=cl(b.x,14,W-14);b.loose=true;}if(b.y<34||b.y>H-14){b.vy*=-.6;b.y=cl(b.y,34,H-14);b.loose=true;}if(!b.loose&&Math.abs(b.vx)<1)b.loose=true;}balls=balls.filter(b=>!b.dead);};
 g.draw=()=>{A.cls('#c4915a');A.box(10,30,W-20,H-40,K.w);L(160,30,160,H-10,K.w,2);A.ring(160,120,20,K.w);pl.forEach((q,i)=>{R(q.x-6,q.y-9,12,18,i?K.p:K.c);R(q.x-4,q.y-14,8,6,'#ffd9a8');if(q.has)C(q.x+q.fx*8,q.y-4,5,K.r);});balls.forEach(b=>C(b.x,b.y,5,K.r));A.hud2(sc[0],sc[1]);if(wait>0)T('READY',160,60,K.y,2,'c');};
 return g;}});

/* ---- BALLOON BLITZ ---- */
A.add({id:'balloons',name:'BALLOON BLITZ',cat:'PARTY',vs:1,how:'TAP A TO PUMP. FILL YOUR BALLOON FIRST. TOO FAST AND IT POPS.',make(){
 const g={over:null,score:0};let s=[0,0],heat=[0,0],t=-90,pop=[0,0],lt=[0,0];
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){if(pop[i]>0){pop[i]--;if(pop[i]===0){s[i]=0;heat[i]=0;}continue;}if(A.cpu&&i===1){if(t%(4-A.ai*2|0)===0&&heat[1]<.8){s[1]+=1;heat[1]+=.06;}}else if(A.hit(i).a){s[i]+=1;heat[i]+=.08;if(heat[i]>1){pop[i]=60;S('boom');}else S('blip');}heat[i]=Math.max(0,heat[i]-.01);if(s[i]>=100){g.over=A.win(i);S('win');}}};
 g.draw=()=>{A.cls('#4dabff');R(0,200,W,40,'#3f8a3a');[0,1].forEach(i=>{const x=90+i*140,r=pop[i]?0:10+s[i]*.5,c=i?K.p:K.c;if(!pop[i]){C(x,150-r,r,c);A.poly([[x-4,150],[x+4,150],[x,150-4]],c,1);L(x,150,x,200,K.k);}else for(let k=0;k<8;k++)C(x+Math.cos(k)*(60-pop[i]),150-30+Math.sin(k*2)*(60-pop[i]),3,c);
   A.box(x-30,206,60,8,K.w);R(x-29,207,58*Math.min(1,heat[i]),6,heat[i]>.8?K.r:K.y);T(A.nm(i)+' '+Math.min(100,s[i])+'%',x,220,c,1,'c');});T(t<0?'READY...':'PUMP!',160,20,K.w,3,'c');};
 return g;}});

/* ---- COLOR RUSH ---- */
A.add({id:'colorrush',name:'COLOR RUSH',cat:'PARTY',vs:1,how:'PRESS A ONLY WHEN THE WORD MATCHES ITS COLOUR. FIRST TO 10.',make(){
 const g={over:null,score:0},CO=[['RED',K.r],['BLUE',K.b],['GREEN',K.g],['PINK',K.p],['GOLD',K.y]];let w=0,c=0,sc=[0,0],t=0,dur=80,fl=[0,0],cpuAt=999;
 const next=()=>{w=ri(5);c=Math.random()<.4?w:ri(5);t=0;dur=Math.max(35,80-(sc[0]+sc[1])*3);cpuAt=w===c?20+ri(40)-A.ai*15:(Math.random()<.15*(2-A.ai*2)?30:999);};next();
 g.update=()=>{t++;fl=fl.map(v=>v>0?v-1:0);if(A.cpu)A.bot({a:t===cpuAt});for(let i=0;i<2;i++)if(A.hit(i).a){if(w===c){sc[i]++;fl[i]=15;S('coin');}else{sc[i]=Math.max(0,sc[i]-1);fl[i]=-15;S('lose');}if(sc[i]>=10){g.over=A.win(i);return;}next();return;}if(t>dur)next();};
 g.draw=()=>{A.cls();R(60,70,200,90,K.d);T(CO[w][0],160,100,CO[c][1],5,'c');R(60,165,200*(1-t/dur),4,K.gr);A.hud2(sc[0],sc[1]);[0,1].forEach(i=>{if(fl[i])R(i?W-100:0,30,100,H,fl[i]>0?'rgba(61,255,139,.2)':'rgba(255,79,109,.25)');});T('WORD = COLOUR?  PRESS A',160,200,K.w,1,'c');};
 return g;}});

/* ---- BOMB PASS ---- */
A.add({id:'bombpass',name:'BOMB PASS',cat:'PARTY',vs:1,how:'TYPE THE SHOWN ARROWS TO PASS THE BOMB. HOLDING IT WHEN IT BLOWS LOSES. FIRST TO 3.',make(){
 const g={over:null,score:0},KS=['l','u','r','d'];let holder=0,seq=[],idx=0,fuse=0,sc=[0,0],wait=40,cpuT=0;
 const newSeq=()=>{seq=[];for(let i=0;i<3+ri(2);i++)seq.push(ri(4));idx=0;cpuT=20+ri(30)-A.ai*12;};
 const reset=()=>{holder=ri(2);fuse=300+ri(200);newSeq();wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}fuse--;if(fuse<=0){sc[1-holder]++;S('boom');if(sc[1-holder]>=3){g.over=A.win(1-holder);return;}reset();return;}
  if(A.cpu&&holder===1){if(--cpuT<=0){cpuT=10+ri(20)-A.ai*8;if(Math.random()<.1*(1-A.ai))idx=0;else idx++;S('blip');if(idx>=seq.length){holder=0;newSeq();S('hit');}}return;}
  const h=A.hit(human(holder));for(let k=0;k<4;k++)if(h[KS[k]]){if(k===seq[idx]){idx++;S('blip');if(idx>=seq.length){holder=1-holder;newSeq();S('hit');}}else{idx=0;S('lose');}}};
 g.draw=()=>{A.cls();[0,1].forEach(i=>{const x=80+i*160;R(x-14,140,28,44,i?K.p:K.c);R(x-10,120,20,20,'#ffd9a8');if(holder===i){C(x,100,14,K.k);R(x-2,84,4,6,K.o);if(A.t%10<5)C(x+3,82,3,K.y);}});
  const bar=fuse/500;R(60,30,200,8,K.d);R(60,30,200*bar,8,bar<.3?K.r:K.o);seq.forEach((k,i)=>{const x=160-seq.length*14+i*28,d=[[-8,0,8,-8,8,8],[0,-8,-8,8,8,8],[8,0,-8,-8,-8,8],[0,8,-8,-8,8,-8]][k];A.poly([[x+d[0],200+d[1]],[x+d[2],200+d[3]],[x+d[4],200+d[5]]],i<idx?K.g:i===idx?K.y:K.gr,1);});
  A.hud2(sc[0],sc[1]);T(A.nm(holder)+' HAS THE BOMB',160,50,K.w,1,'c');if(wait>0)T('READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- TURF TAG ---- */
A.add({id:'tag',name:'TURF TAG',cat:'PARTY',vs:1,how:'TOUCH TO TAG. TAGGED PLAYER CHASES. LEAST TIME AS "IT" IN 60 SEC WINS.',make(){
 const g={over:null,score:0},WL=[[60,60,40,14],[220,60,40,14],[60,166,40,14],[220,166,40,14],[150,100,20,40]];let p=[{x:60,y:120},{x:260,y:120}],it=0,itT=[0,0],time=3600,cd=0;
 const blk=(x,y)=>x<12||x>W-12||y<30||y>H-12||WL.some(w=>x>w[0]-6&&x<w[0]+w[2]+6&&y>w[1]-6&&y<w[1]+w[3]+6);
 g.update=()=>{time--;if(cd>0)cd--;itT[it]++;if(A.cpu){const q=p[1],o=p[0],chase=it===1,dx=o.x-q.x,dy=o.y-q.y;let b={};const s=chase?1:-1;b={l:dx*s<-3,r:dx*s>3,u:dy*s<-3,d:dy*s>3};if(!chase&&(blk(q.x+(b.r?3:b.l?-3:0),q.y)||blk(q.x,q.y+(b.d?3:b.u?-3:0))))b={u:q.y>120,d:q.y<=120,l:q.x>160,r:q.x<=160};if(Math.random()<.02*(1-A.ai))b={[['l','r','u','d'][ri(4)]]:1};A.bot(b);}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),sp=(i&&A.cpu?1.2+1.4*A.ai:2.6)*(it===i?1.1:1);if(!blk(q.x+ax(k)*sp,q.y))q.x+=ax(k)*sp;if(!blk(q.x,q.y+ay(k)*sp))q.y+=ay(k)*sp;}
  if(cd===0&&Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)<16){it=1-it;cd=60;S('hit');}if(time<=0)g.over=itT[0]===itT[1]?'DRAW!':A.win(itT[0]<itT[1]?0:1);};
 g.draw=()=>{A.cls('#3f8a3a');for(let i=0;i<W;i+=20)for(let j=28;j<H;j+=20)if((i+j)%40===8)R(i,j,20,20,'#448f3f');A.box(10,28,W-20,H-38,K.w);WL.forEach(w=>{R(w[0],w[1],w[2],w[3],'#5b3a1e');R(w[0],w[1],w[2],3,'#8a5c33');});
  p.forEach((q,i)=>{C(q.x,q.y,8,i?K.p:K.c);if(it===i){T('IT',q.x,q.y-22,K.y,2,'c');A.ring(q.x,q.y,11,cd?K.gr:K.y);}});T(A.nm(0)+' '+(itT[0]/60|0)+'S',6,4,K.c,2);T((itT[1]/60|0)+'S '+A.nm(1),W-6,4,K.p,2,'r');T(Math.ceil(time/60),160,4,K.w,2,'c');};
 return g;}});

/* ---- BASKET TOSS ---- */
A.add({id:'toss',name:'BASKET TOSS',cat:'PARTY',vs:1,how:'UP/DOWN AIM. A LOCKS POWER. 5 SHOTS EACH, HOOP MOVES. MOST BASKETS WINS.',make(){
 const g={over:null,score:0};let p=0,n=0,ang=.9,pw=0,ph=0,t=0,ball=null,sc=[0,0],hoop={x:240,y:100,d:1},msg='',mt=0;
 g.update=()=>{t++;if(mt>0)mt--;hoop.y+=hoop.d*.6;if(hoop.y<60||hoop.y>160)hoop.d*=-1;
  if(ball){ball.vy+=.18;ball.x+=ball.vx;ball.y+=ball.vy;if(ball.vy>0&&Math.abs(ball.x-hoop.x)<10&&Math.abs(ball.y-hoop.y)<6&&!ball.done){ball.done=1;sc[p]++;msg='SWISH!';mt=50;S('score');}if(ball.y>220||ball.x>W+10){if(!ball.done){msg='MISS';mt=40;S('lose');}ball=null;n++;p=1-p;ph=0;t=0;if(n>=10)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>30){ang=.85+rnd(.2)-.1;ph=1;t=0;}}else{ang=cl(ang-ay(k)*.02,.4,1.3);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.08);if(cpu){if(!g.want){let best=0,bd=1e9;for(let w=0;w<=1;w+=.02){let x=60,y=200,vx=Math.cos(ang)*(3+w*6),vy=-Math.sin(ang)*(3+w*6),hy=hoop.y,hd=hoop.d,ok=1e9;for(let f=0;f<200;f++){vy+=.18;x+=vx;y+=vy;hy+=hd*.6;if(hy<60||hy>160)hd*=-1;if(vy>0&&Math.abs(x-hoop.x)<10){ok=Math.min(ok,Math.abs(y-hy));if(y>hy)break;}if(y>220)break;}if(ok<bd){bd=ok;best=w;}}g.want=cl(best+(rnd(.16)-.08)*(2-A.ai*1.6),0,1);}if(Math.abs(pw-g.want)<.03||t>140){ball={x:60,y:200,vx:Math.cos(ang)*(3+g.want*6),vy:-Math.sin(ang)*(3+g.want*6)};g.want=null;S('shoot');}}else if(h.a){ball={x:60,y:200,vx:Math.cos(ang)*(3+pw*6),vy:-Math.sin(ang)*(3+pw*6)};S('shoot');}}};
 g.draw=()=>{A.cls('#241a4d');R(0,210,W,30,'#b5651d');R(hoop.x+12,hoop.y-40,4,80,K.w);R(hoop.x-12,hoop.y,24,3,K.r);for(let i=0;i<4;i++)L(hoop.x-10+i*6,hoop.y+3,hoop.x-6+i*4,hoop.y+16,K.gr);
  R(52,170,16,30,p?K.p:K.c);R(54,160,12,10,'#ffd9a8');if(!ball){for(let i=1;i<8;i++)C(60+Math.cos(ang)*i*12,200-Math.sin(ang)*i*12+.18*i*i*2,1.5,K.gr);if(ph===1){A.box(8,60,10,100,K.w);R(10,158-pw*96,6,pw*96,K.r);}}if(ball)C(ball.x,ball.y,6,K.o);
  A.hud2(sc[0],sc[1]);T('SHOT '+(n+1)+'/10  '+A.nm(p),160,4,K.w,1,'c');if(mt>0)T(msg,160,40,K.y,3,'c');};
 return g;}});

/* ---- RHYTHM DUEL ---- */
A.add({id:'rhythmduel',name:'RHYTHM DUEL',cat:'PARTY',vs:1,how:'HIT YOUR ARROWS ON THE LINE. P1 LEFT LANES, P2 RIGHT. MOST POINTS WINS.',make(){
 const g={over:null,score:0},KS=['l','d','u','r'];let notes=[],t=0,sc=[0,0],combo=[0,0],flash={};
 for(let i=0;i<120;i++){const k=ri(4);notes.push({k,t:120+i*36,ok:[0,0]});}
 g.update=()=>{t++;for(const kk in flash)if(flash[kk]>0)flash[kk]--;if(A.cpu){const n=notes.find(n=>!n.ok[1]&&Math.abs(n.t-t)<=3);A.bot({[n&&Math.random()<.5+.45*A.ai?KS[n.k]:'x']:!!n});}
  for(let p=0;p<2;p++){const h=A.hit(p);for(const n of notes){if(n.ok[p])continue;const dy=n.t-t;if(dy<-14){n.ok[p]=2;combo[p]=0;}else if(Math.abs(dy)<=14&&h[KS[n.k]]){n.ok[p]=1;combo[p]++;sc[p]+=(Math.abs(dy)<5?3:1)*Math.min(combo[p],10);flash[p+''+n.k]=8;S(p?'coin':'blip');h[KS[n.k]]=false;}}}
  if(t>notes[notes.length-1].t+30)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);};
 g.draw=()=>{A.cls();const arrow=(x,y,k,c)=>{const d=[[-7,0,7,-7,7,7],[0,7,-7,-7,7,-7],[0,-7,-7,7,7,7],[7,0,-7,-7,-7,7]][k];A.poly([[x+d[0],y+d[1]],[x+d[2],y+d[3]],[x+d[4],y+d[5]]],c,1);};
  [0,1].forEach(p=>{const X0=p?190:30;R(X0-10,0,120,H,p?'#1a0f22':'#0f1a22');L(X0-10,190,X0+110,190,K.w,2);for(let i=0;i<4;i++)arrow(X0+i*30,190,i,flash[p+''+i]?K.w:K.gr);notes.forEach(n=>{if(n.ok[p])return;const y=190-(n.t-t)*1.5;if(y>-10&&y<H)arrow(X0+n.k*30,y,n.k,[K.p,K.c,K.g,K.y][n.k]);});if(combo[p]>4)T('X'+combo[p],X0+45,30,K.w,2,'c');});
  A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- QUAD PONG ---- */
A.add({id:'quadpong',name:'QUAD PONG',cat:'PARTY',vs:1,how:'YOU GUARD TWO WALLS: LEFT/RIGHT MOVES THE BOTTOM PADDLE, UP/DOWN THE SIDE ONE. FIRST TO 5.',make(){
 const g={over:null,score:0};let pad=[{h:160,v:120},{h:160,v:120}],b,sc=[0,0],wait=40;const reset=()=>{const a=rnd(6.28);b={x:160,y:120,vx:Math.cos(a)*2.5,vy:Math.sin(a)*2.5};wait=40;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=pad[1];A.bot({l:q.h>b.x+4,r:q.h<b.x-4,u:q.v>b.y+4,d:q.v<b.y-4});}
  for(let i=0;i<2;i++){const q=pad[i],k=A.in(i),sp=i&&A.cpu?1.5+1.7*A.ai:3.2;q.h=cl(q.h+ax(k)*sp,40,W-40);q.v=cl(q.v+ay(k)*sp,60,H-40);}
  b.x+=b.vx;b.y+=b.vy;const P0=pad[0],P1=pad[1];
  if(b.y>H-14&&b.vy>0){if(Math.abs(b.x-P0.h)<26){b.vy=-Math.abs(b.vy)*1.04;b.vx+=(b.x-P0.h)*.08;S('hit');}else{sc[1]++;S('score');if(sc[1]>=5)g.over=A.win(1);else reset();return;}}
  if(b.x<14&&b.vx<0){if(Math.abs(b.y-P0.v)<26){b.vx=Math.abs(b.vx)*1.04;b.vy+=(b.y-P0.v)*.08;S('hit');}else{sc[1]++;S('score');if(sc[1]>=5)g.over=A.win(1);else reset();return;}}
  if(b.y<34&&b.vy<0){if(Math.abs(b.x-P1.h)<26){b.vy=Math.abs(b.vy)*1.04;b.vx+=(b.x-P1.h)*.08;S('hit');}else{sc[0]++;S('score');if(sc[0]>=5)g.over=A.win(0);else reset();return;}}
  if(b.x>W-14&&b.vx>0){if(Math.abs(b.y-P1.v)<26){b.vx=-Math.abs(b.vx)*1.04;b.vy+=(b.y-P1.v)*.08;S('hit');}else{sc[0]++;S('score');if(sc[0]>=5)g.over=A.win(0);else reset();return;}}
  const sp=Math.hypot(b.vx,b.vy);if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}};
 g.draw=()=>{A.cls();R(0,20,W,1,K.d);A.box(8,28,W-16,H-36,K.d);R(pad[0].h-24,H-12,48,5,K.c);R(8,pad[0].v-24,5,48,K.c);R(pad[1].h-24,28,48,5,K.p);R(W-13,pad[1].v-24,5,48,K.p);R(b.x-3,b.y-3,6,6,K.w);A.hud2(sc[0],sc[1]);if(wait>0)T('READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- GOLF DUEL ---- */
A.add({id:'golfduel',name:'GOLF DUEL',cat:'PARTY',vs:1,how:'TAKE TURNS. AIM, HOLD A, RELEASE. FEWEST STROKES OVER 3 HOLES.',make(){
 const g={over:null,score:0};const HO=[{s:[40,125],c:[280,125],w:[[150,70,20,110]]},{s:[40,200],c:[280,50],w:[[100,24,16,130],[200,100,16,130]]},{s:[40,50],c:[280,200],w:[[90,90,140,16],[90,150,16,80]]}];
 let hi=0,b=[null,null],ang=[0,0],pow=0,chg=false,st=[[0,0,0],[0,0,0]],ht,p=0,done=[false,false],wait=0,think=0;
 const load=()=>{ht=HO[hi];b=[{x:ht.s[0],y:ht.s[1]-6,vx:0,vy:0},{x:ht.s[0],y:ht.s[1]+6,vx:0,vy:0}];ang=b.map(q=>Math.atan2(ht.c[1]-q.y,ht.c[0]-q.x));done=[false,false];p=0;think=0;};load();
 const inW=(x,y)=>x<13||x>W-13||y<27||y>H-13||ht.w.some(w=>x>w[0]-3&&x<w[0]+w[2]+3&&y>w[1]-3&&y<w[1]+w[3]+3);
 g.update=()=>{if(wait>0){if(--wait===0){hi++;if(hi>=3){const a=st[0].reduce((x,y)=>x+y),c=st[1].reduce((x,y)=>x+y);g.over=a===c?'DRAW!':A.win(a<c?0:1);}else load();}return;}
  const q=b[p],mv=Math.hypot(q.vx,q.vy)>.05;if(mv){q.x+=q.vx;if(inW(q.x,q.y)){q.x-=q.vx;q.vx*=-.8;}q.y+=q.vy;if(inW(q.x,q.y)){q.y-=q.vy;q.vy*=-.8;}q.vx*=.982;q.vy*=.982;const o=b[1-p];if(!done[1-p]&&Math.hypot(q.x-o.x,q.y-o.y)<6){const dx=o.x-q.x,dy=o.y-q.y,d=Math.hypot(dx,dy)||1;o.vx+=q.vx*.5;o.vy+=q.vy*.5;q.vx*=.5;q.vy*=.5;}
   if(Math.hypot(q.x-ht.c[0],q.y-ht.c[1])<6&&Math.hypot(q.vx,q.vy)<3.2){done[p]=true;q.x=ht.c[0];q.y=ht.c[1];q.vx=q.vy=0;S('score');}if(Math.hypot(q.vx,q.vy)<=.05||done[p]){q.vx=q.vy=0;if(done[0]&&done[1]){wait=50;return;}p=1-p;if(done[p])p=1-p;think=0;ang[p]=Math.atan2(ht.c[1]-b[p].y,ht.c[0]-b[p].x);}return;}
  const o=b[1-p];o.x+=o.vx;o.y+=o.vy;o.vx*=.95;o.vy*=.95;
  if(A.cpu&&p===1){if(++think>40){const d=Math.hypot(ht.c[0]-q.x,ht.c[1]-q.y),pw_=cl(d/220,.15,1)+(rnd(.2)-.1)*(2-A.ai*1.5);ang[1]+=(rnd(.1)-.05)*(2-A.ai*1.5);q.vx=Math.cos(ang[1])*(1+pw_*6);q.vy=Math.sin(ang[1])*(1+pw_*6);st[1][hi]++;S('hit');if(st[1][hi]>=8)done[1]=true;}return;}
  const k=A.in(human(p));ang[p]+=ax(k)*.035;if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;q.vx=Math.cos(ang[p])*(1+pow*6);q.vy=Math.sin(ang[p])*(1+pow*6);st[p][hi]++;S('hit');if(st[p][hi]>=8)done[p]=true;}};
 g.draw=()=>{A.cls('#5b3a1e');R(10,24,W-20,H-34,'#2e9e57');ht.w.forEach(w=>{R(w[0],w[1],w[2],w[3],'#5b3a1e');A.box(w[0],w[1],w[2],w[3],'#8a5c33');});C(ht.c[0],ht.c[1],5,K.k);R(ht.c[0],ht.c[1]-18,1,18,K.w);R(ht.c[0]+1,ht.c[1]-18,8,5,K.r);
  b.forEach((q,i)=>{if(!done[i])C(q.x,q.y,3,i?K.p:K.c);});const q=b[p];if(Math.hypot(q.vx,q.vy)<=.05&&!wait&&!done[p]){for(let i=1;i<=5;i++)C(q.x+Math.cos(ang[p])*i*7,q.y+Math.sin(ang[p])*i*7,1,K.y);if(chg){A.box(q.x-16,q.y+8,32,5,K.w);R(q.x-15,q.y+9,30*pow,3,K.r);}}
  const tot=i=>st[i].reduce((a,c)=>a+c);T(A.nm(0)+' '+tot(0),6,6,K.c,2);T(tot(1)+' '+A.nm(1),W-6,6,K.p,2,'r');T('HOLE '+(hi+1)+'/3  '+A.nm(p),160,6,K.w,1,'c');if(wait)T('HOLE DONE',160,110,K.y,2,'c');};
 return g;}});
})();
