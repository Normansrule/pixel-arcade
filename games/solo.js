(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};

/* ---- TOWER STACK ---- */
A.add({id:'stack',name:'TOWER STACK',cat:'CLASSICS',how:'A DROPS THE BLOCK. OVERHANG GETS CUT.',make(){
 const g={over:null,score:0};let base={x:110,w:100},cur={x:0,w:100,d:1},y=200,blocks=[],cam=0,perfect=0;
 g.update=()=>{cur.x+=cur.d*(1.6+g.score*.05);if(cur.x<0||cur.x+cur.w>W)cur.d*=-1;if(A.hit(0).a){const l=Math.max(cur.x,base.x),r=Math.min(cur.x+cur.w,base.x+base.w);if(r-l<4){g.over='TOPPLED';S('lose');return;}
  if(Math.abs(cur.x-base.x)<3){perfect++;cur.x=base.x;cur.w=base.w;if(perfect>2&&base.w<110){base.w+=4;cur.w=base.w;}S('coin');}else{perfect=0;cur.x=l;cur.w=r-l;S('hit');}blocks.push({x:cur.x,w:cur.w,y,c:[K.r,K.o,K.y,K.g,K.c,K.b,K.p][g.score%7]});base={x:cur.x,w:cur.w};y-=10;g.score++;cur={x:cur.d>0?0:W-cur.w,w:cur.w,d:cur.d};}
  const t=Math.max(0,100-y);cam+=(t-cam)*.15;};
 g.draw=()=>{A.cls('#1c5f8a');R(0,210+cam,W,30,'#c4915a');blocks.forEach(b=>R(b.x,b.y+cam,b.w,10,b.c));R(cur.x,y+cam-1,cur.w,10,K.w);T(g.score,160,10,K.w,3,'c');if(perfect>1)T('PERFECT X'+perfect,160,40,K.y,1,'c');};
 return g;}});

/* ---- SLIDE 15 ---- */
A.add({id:'slide',name:'SLIDE 15',cat:'PUZZLE',low:1,how:'ARROWS SLIDE A TILE INTO THE GAP. ORDER 1-15.',make(){
 const g={over:null,score:0};let b=[...Array(16).keys()].map(i=>(i+1)%16);const gap=()=>b.indexOf(0);
 for(let i=0;i<300;i++){const e=gap(),ds=[e%4>0?e-1:-1,e%4<3?e+1:-1,e>3?e-4:-1,e<12?e+4:-1].filter(v=>v>=0),t=ds[ri(ds.length)];b[e]=b[t];b[t]=0;}
 g.update=()=>{const h=A.hit(0),e=gap();let t=-1;if(h.l&&e%4<3)t=e+1;if(h.r&&e%4>0)t=e-1;if(h.u&&e<12)t=e+4;if(h.d&&e>3)t=e-4;if(t>=0){b[e]=b[t];b[t]=0;g.score++;S('blip');if(b.every((v,i)=>v===(i+1)%16)){g.over='SOLVED! WIN';S('win');}}};
 g.draw=()=>{A.cls();R(78,38,164,164,K.d);b.forEach((v,i)=>{if(!v)return;const x=80+(i%4)*40,y=40+((i/4)|0)*40;R(x,y,38,38,v===i+1?K.g:K.o);R(x,y,38,3,'rgba(255,255,255,.35)');T(v,x+19,y+13,K.k,2,'c');});T('MOVES '+g.score,160,12,K.w,2,'c');};
 return g;}});

/* ---- PINBALL ---- */
A.add({id:'pinball',name:'PINBALL',cat:'CLASSICS',how:'A/LEFT + B/RIGHT FLIP. DOWN LAUNCHES.',make(){
 const g={over:null,score:0};let b=null,balls=3,fl=[0,0],bumps=[{x:110,y:70,r:11},{x:190,y:70,r:11},{x:150,y:115,r:11},{x:70,y:130,r:8},{x:230,y:130,r:8}];
 const launch=()=>{b={x:298,y:200,vx:0,vy:-9-rnd(1.5)};};
 g.update=()=>{const k=A.in(0);fl[0]=(k.a||k.l)?1:0;fl[1]=(k.b||k.r)?1:0;if(!b){if(A.hit(0).d){launch();S('shoot');}return;}
  b.vy+=.14;b.x+=b.vx;b.y+=b.vy;if(b.x>290){if(b.y<30){b.x=286;b.vx=-2;}else if(b.x>306){b.x=306;b.vx=-Math.abs(b.vx)*.5;}}
  if(b.x<9){b.x=9;b.vx=Math.abs(b.vx)*.8;}if(b.x>282&&b.x<290&&b.y>40){b.x=282;b.vx=-Math.abs(b.vx)*.8;}if(b.y<9){b.y=9;b.vy=Math.abs(b.vy)*.8;}
  for(const q of bumps){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<q.r+5){b.vx=dx/d*4.5;b.vy=dy/d*4.5;b.x=q.x+dx/d*(q.r+5);b.y=q.y+dy/d*(q.r+5);g.score+=q.r>9?100:50;q.t=8;S('hit');}if(q.t)q.t--;}
  [[9,150,90,200],[282,150,201,200]].forEach(w=>{const[x1,y1,x2,y2]=w,dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy,t=cl(((b.x-x1)*dx+(b.y-y1)*dy)/l,0,1),px=x1+dx*t,py=y1+dy*t,d=Math.hypot(b.x-px,b.y-py);if(d<5){const nx=(b.x-px)/d,ny=(b.y-py)/d;b.x=px+nx*5;b.y=py+ny*5;const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.8*dot*nx;b.vy-=1.8*dot*ny;}}});
  [[90,200,1,fl[0]],[201,200,-1,fl[1]]].forEach(f=>{const[fx,fy,d,up]=f,a=up?-.55*d:.35*d,ex=fx+d*40*Math.cos(a),ey=fy+40*Math.sin(a);const dx=ex-fx,dy=ey-fy,l=dx*dx+dy*dy,t=cl(((b.x-fx)*dx+(b.y-fy)*dy)/l,0,1),px=fx+dx*t,py=fy+dy*t,dd=Math.hypot(b.x-px,b.y-py);if(dd<6&&b.vy>-1){b.y=py-6;b.vy=up?-7-t*3:-Math.abs(b.vy)*.5;b.vx+=d*(up?1.5:0);S('blip');}});
  if(b.y>H+10){balls--;b=null;S('lose');if(balls<=0)g.over='GAME OVER';}};
 g.draw=()=>{A.cls('#1a1238');R(9,9,281,H,'#2b2257');R(282,40,8,H,K.gr);L(9,150,90,200,K.c,3);L(282,150,201,200,K.c,3);bumps.forEach(q=>{C(q.x,q.y,q.r,q.t?K.w:q.r>9?K.p:K.o);C(q.x,q.y,q.r-4,K.y);});
  [[90,200,1,fl[0]],[201,200,-1,fl[1]]].forEach(f=>{const[fx,fy,d,up]=f,a=up?-.55*d:.35*d;L(fx,fy,fx+d*40*Math.cos(a),fy+40*Math.sin(a),K.r,5);});
  if(b)C(b.x,b.y,5,K.w);else{C(298,205,5,K.w);T('DOWN TO LAUNCH',160,120,K.gr,1,'c');}T('SCORE '+g.score,14,14,K.y,2);T('BALLS '+balls,270,14,K.w,2,'r');};
 return g;}});

/* ---- DARTS ---- */
A.add({id:'darts',name:'DARTS 301',cat:'SPORTS',low:1,how:'A LOCKS X, A LOCKS Y. GET FROM 301 TO EXACTLY 0.',make(){
 const g={over:null,score:0};let left=301,ph=0,cx=160,cy=120,t=0,darts=0,msg='',mt=0,marks=[];
 g.update=()=>{t++;if(mt>0)mt--;if(ph===0){cx=160+Math.sin(t*.06)*70;if(A.hit(0).a){ph=1;t=0;}}else if(ph===1){cy=120+Math.sin(t*.075)*60;if(A.hit(0).a){const x=cx+rnd(6)-3,y=cy+rnd(6)-3,d=Math.hypot(x-160,y-120);let a=Math.atan2(y-120,x-160)+Math.PI/2+Math.PI/20;a=((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);const seg=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5][Math.floor(a/(Math.PI/10))%20];
   let p=d<4?50:d<9?25:d<28?seg:d<33?seg*3:d<52?seg:d<57?seg*2:0;darts++;g.score=darts;marks.push([x,y]);if(left-p===0){left=0;g.over='CHECKOUT! WIN';S('win');return;}if(left-p<0){msg='BUST';p=0;}else{msg=p?'-'+p:'MISS';left-=p;}S(p?'hit':'lose');ph=2;t=0;mt=50;}}
  else if(t>50)ph=0;};
 g.draw=()=>{A.cls('#3a2a18');[[57,K.k],[52,'#e8e0c8'],[33,K.k],[28,'#e8e0c8'],[9,K.g],[4,K.r]].forEach(v=>C(160,120,v[0],v[1]));for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2-Math.PI/20;L(160+Math.cos(a)*9,120+Math.sin(a)*9,160+Math.cos(a)*57,120+Math.sin(a)*57,'#888');}
  for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2;if(i%2===0){A.c.fillStyle='rgba(255,79,109,.55)';A.c.beginPath();A.c.arc(160,120,57,a-Math.PI/20,a+Math.PI/20);A.c.arc(160,120,52,a+Math.PI/20,a-Math.PI/20,true);A.c.fill();A.c.beginPath();A.c.arc(160,120,33,a-Math.PI/20,a+Math.PI/20);A.c.arc(160,120,28,a+Math.PI/20,a-Math.PI/20,true);A.c.fill();}
   const n=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5][i];T(n,160+Math.cos(a)*66,120+Math.sin(a)*66-2,K.w,1,'c');}
  marks.forEach(m=>{R(m[0]-1,m[1]-1,3,3,K.y);});if(ph<2){L(cx,50,cx,190,'rgba(255,255,255,.5)');if(ph===1)L(90,cy,230,cy,'rgba(255,255,255,.5)');A.ring(cx,ph?cy:120,4,K.c);}
  T('LEFT '+left,6,6,K.y,2);T('DARTS '+darts,W-6,6,K.w,2,'r');if(mt>0)T(msg,160,210,K.y,3,'c');};
 return g;}});

/* ---- RHYTHM TAP ---- */
A.add({id:'rhythm',name:'RHYTHM TAP',cat:'PUZZLE',how:'HIT THE ARROW WHEN IT REACHES THE LINE.',make(){
 const g={over:null,score:0},KS=['l','d','u','r'],X=[100,140,180,220];let notes=[],t=0,miss=0,combo=0,bpm=90,flash={},fx=0;
 for(let i=0;i<400;i++)notes.push({k:ri(4),t:120+i*(3600/bpm)*(1-Math.min(.5,i/300)),ok:0});
 g.update=()=>{t++;if(fx>0)fx--;const h=A.hit(0);for(const n of notes){if(n.ok)continue;const dy=n.t-t;if(dy<-14){n.ok=2;miss++;combo=0;S('lose');if(miss>=8)g.over='OFF BEAT';}else if(Math.abs(dy)<=14&&h[KS[n.k]]){n.ok=1;const p=Math.abs(dy)<5?3:1;combo++;g.score+=p*Math.min(combo,10);flash[n.k]=8;fx=p;S(p>1?'coin':'blip');h[KS[n.k]]=false;}}
  for(const k in flash)if(flash[k]>0)flash[k]--;if(t>notes[notes.length-1].t+30)g.over='SONG CLEAR! WIN';};
 g.draw=()=>{A.cls();R(80,0,160,H,'#1a1440');for(let i=0;i<4;i++)L(X[i]-20,0,X[i]-20,H,K.d);L(80,190,240,190,K.w,2);
  const arrow=(x,y,k,c)=>{const d=[[-8,0,8,-8,8,8],[0,8,-8,-8,8,-8],[0,-8,-8,8,8,8],[8,0,-8,-8,-8,8]][k];A.poly([[x+d[0],y+d[1]],[x+d[2],y+d[3]],[x+d[4],y+d[5]]],c,1);};
  for(let i=0;i<4;i++)arrow(X[i],190,i,flash[i]?K.w:K.gr);notes.forEach(n=>{if(n.ok)return;const y=190-(n.t-t)*1.5;if(y>-10&&y<H)arrow(X[n.k],y,n.k,[K.p,K.c,K.g,K.y][n.k]);});
  T('SCORE '+g.score,6,6,K.y,2);T('MISS '+miss+'/8',W-6,6,miss>4?K.r:K.w,2,'r');if(combo>4)T('COMBO '+combo,160,40,K.w,2,'c');if(fx)T(fx>1?'PERFECT':'GOOD',160,60,fx>1?K.y:K.c,1,'c');};
 return g;}});

/* ---- SKY FURY ---- */
A.add({id:'skyfury',name:'SKY FURY',cat:'CLASSICS',how:'FLY. A FIRES. SHOOT EVERYTHING.',make(){
 const g={over:null,score:0};let p={x:160,y:200},en=[],bl=[],eb=[],lives=3,inv=0,t=0,pw=0;
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*3,8,W-8);p.y=cl(p.y+ay(k)*2.5,30,H-10);if(inv>0)inv--;
  if(A.in(0).a&&t%(pw?5:9)===0){bl.push({x:p.x-4,y:p.y-8});bl.push({x:p.x+4,y:p.y-8});S('shoot');}
  if(t%Math.max(18,50-t/200)===0){const big=Math.random()<.15;en.push({x:rnd(W-40)+20,y:-10,vx:rnd(1.6)-.8,vy:big?.6:1.2+rnd(.8),hp:big?6:1,big,w:0});}
  bl.forEach(b=>b.y-=6);bl=bl.filter(b=>b.y>-10);
  for(const e of en){e.x+=e.vx;e.y+=e.vy;if(e.x<10||e.x>W-10)e.vx*=-1;e.w++;if(e.w%(e.big?40:90)===0&&e.y>0){const d=Math.hypot(p.x-e.x,p.y-e.y);eb.push({x:e.x,y:e.y,vx:(p.x-e.x)/d*2,vy:(p.y-e.y)/d*2});}
   for(const b of bl)if(Math.abs(b.x-e.x)<(e.big?12:7)&&Math.abs(b.y-e.y)<(e.big?12:7)){b.y=-99;e.hp--;if(e.hp<=0){g.score+=e.big?200:10;S('hit');if(e.big&&!pw){pw=600;S('win');}}}
   if(inv===0&&Math.abs(p.x-e.x)<(e.big?14:8)&&Math.abs(p.y-e.y)<(e.big?14:8)){e.hp=0;lives--;inv=90;S('boom');if(lives<=0)g.over='SHOT DOWN';}}
  en=en.filter(e=>e.hp>0&&e.y<H+10);for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(inv===0&&Math.abs(b.x-p.x)<5&&Math.abs(b.y-p.y)<6){b.y=999;lives--;inv=90;S('boom');if(lives<=0)g.over='SHOT DOWN';}}eb=eb.filter(b=>b.y<H&&b.y>-10&&b.x>0&&b.x<W);if(pw>0)pw--;};
 g.draw=()=>{A.cls('#1c5f8a');for(let i=0;i<14;i++){const y=((i*67+t*1.2)%(H+40))-20,x=(i*113)%W;R(x,y,30,8,'#2a72a0');R(x+8,y-4,14,4,'#2a72a0');}
  en.forEach(e=>{if(e.big){R(e.x-14,e.y-6,28,12,K.p);R(e.x-6,e.y-12,12,24,K.p);R(e.x-3,e.y-3,6,6,K.y);}else{R(e.x-7,e.y-3,14,6,K.r);R(e.x-2,e.y-7,4,14,K.r);}});
  bl.forEach(b=>R(b.x-1,b.y,2,6,pw?K.g:K.y));eb.forEach(b=>C(b.x,b.y,2.5,K.o));if(inv%8<5){R(p.x-9,p.y-2,18,5,K.c);R(p.x-2,p.y-9,4,16,K.c);R(p.x-1,p.y-4,2,4,K.w);}
  T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives,W-6,6,lives<2?K.r:K.w,2,'r');if(pw>0)T('RAPID FIRE '+Math.ceil(pw/60),160,6,K.g,1,'c');};
 return g;}});

/* ---- WHACK BOTS ---- */
A.add({id:'whack',name:'WHACK BOTS',cat:'PUZZLE',how:'MOVE TO A BOT, PRESS A. AVOID THE RED ONES. 45 SEC.',make(){
 const g={over:null,score:0};let c={x:1,y:1},bots=Array(9).fill(0),time=2700,t=0;
 g.update=()=>{time--;t++;if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mvCur(h,c,3,3);if(t%Math.max(20,60-time/60)===0){const i=ri(9);if(!bots[i])bots[i]=Math.random()<.22?-40:50+rnd(30);}
  bots=bots.map(v=>v>0?v-1:v<0?v+1:0);if(h.a){const i=c.y*3+c.x;if(bots[i]>0){g.score+=10;bots[i]=0;S('coin');}else if(bots[i]<0){g.score=Math.max(0,g.score-15);bots[i]=0;S('boom');}else S('blip');}};
 g.draw=()=>{A.cls('#2a5db0');R(0,40,W,H,'#1e8a45');for(let i=0;i<9;i++){const x=70+(i%3)*70,y=70+((i/3)|0)*60;C(x,y+14,22,'#4a2a10');C(x,y+14,16,K.k);if(bots[i]){const bad=bots[i]<0,up=Math.min(1,Math.abs(bots[i])/10);R(x-12,y+14-26*up,24,26*up,bad?K.r:K.gr);R(x-9,y+14-22*up,6,6,bad?K.k:K.c);R(x+3,y+14-22*up,6,6,bad?K.k:K.c);}}
  A.box(70+c.x*70-30,70+c.y*60-24,60,52,K.y);T('SCORE '+g.score,6,6,K.y,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');};
 return g;}});

/* ---- CLOUD HOP ---- */
A.add({id:'cloudhop',name:'CLOUD HOP',cat:'CLASSICS',how:'LEFT/RIGHT MOVE. BOUNCE UP. DON\'T FALL.',make(){
 const g={over:null,score:0};let p={x:160,y:180,vy:0},pl=[],cam=0,top=0;for(let i=0;i<9;i++)pl.push({x:rnd(W-40)+20,y:200-i*28,w:40,m:i>4&&Math.random()<.3?1:0,d:1});
 g.update=()=>{const k=A.in(0);p.x=(p.x+ax(k)*3+W)%W;p.vy+=.18;p.y+=p.vy;for(const q of pl){if(q.m){q.x+=q.d*1.2;if(q.x<20||q.x>W-20)q.d*=-1;}if(p.vy>0&&p.y>q.y-4&&p.y<q.y+6&&Math.abs(p.x-q.x)<q.w/2+4){p.vy=-6.2;S('jump');}}
  const want=p.y-140;if(want<cam)cam=want;g.score=Math.max(g.score,-cam/5|0);for(const q of pl)if(q.y>cam+H+10){q.y-=9*28;q.x=rnd(W-40)+20;q.w=Math.max(22,40-g.score/40);q.m=Math.random()<.35?1:0;}if(p.y>cam+H+20)g.over='FELL';};
 g.draw=()=>{A.cls('#4dabff');for(let i=0;i<6;i++){const y=((i*90-cam*.3)%(H+60)+H+60)%(H+60)-30;C((i*97)%W,y,10,'#7fc3ff');}pl.forEach(q=>{const y=q.y-cam;C(q.x-q.w/4,y,8,K.w);C(q.x+q.w/4,y,8,K.w);R(q.x-q.w/2,y-2,q.w,8,K.w);if(q.m)R(q.x-q.w/2,y+3,q.w,3,K.c);});
  const y=p.y-cam;R(p.x-6,y-16,12,14,K.g);R(p.x-4,y-13,3,3,K.k);R(p.x+1,y-13,3,3,K.k);R(p.x-6,y-2,4,4,K.g);R(p.x+2,y-2,4,4,K.g);T(g.score,160,10,K.w,3,'c');};
 return g;}});

/* ---- DUCK GALLERY ---- */
A.add({id:'gallery',name:'DUCK GALLERY',cat:'SPORTS',how:'MOVE THE SIGHT. A SHOOTS. 30 SHOTS.',make(){
 const g={over:null,score:0};let cx=160,cy=120,ducks=[],shots=30,t=0,hitT=0;
 g.update=()=>{t++;if(hitT>0)hitT--;const k=A.in(0);cx=cl(cx+ax(k)*3.5,10,W-10);cy=cl(cy+ay(k)*3.5,30,200);if(t%50===0){const row=ri(3);ducks.push({x:row%2?W+10:-10,y:70+row*45,d:row%2?-1:1,v:1+rnd(1.5)+t/3000,big:Math.random()<.2});}
  ducks.forEach(d=>d.x+=d.d*d.v);ducks=ducks.filter(d=>d.x>-20&&d.x<W+20);
  if(A.hit(0).a&&shots>0){shots--;S('shoot');const d=ducks.find(d=>Math.abs(d.x-cx)<(d.big?8:12)&&Math.abs(d.y-cy)<10);if(d){ducks.splice(ducks.indexOf(d),1);g.score+=d.big?50:10;hitT=15;S('coin');}if(shots===0)g.over='OUT OF SHOTS';}};
 g.draw=()=>{A.cls('#1c5f8a');R(0,200,W,40,'#1e8a45');[60,105,150].forEach((y,i)=>R(0,y+20,W,4,['#b5651d','#c4915a','#8a5c33'][i]));
  ducks.forEach(d=>{const s=d.big?.6:1,c=d.big?K.y:K.o;R(d.x-8*s,d.y-4*s,16*s,10*s,c);R(d.x+d.d*7*s-3*s,d.y-10*s,7*s,8*s,c);R(d.x+d.d*10*s,d.y-7*s,4*s,3*s,K.r);R(d.x-d.d*10*s-2,d.y-2*s,5*s,5*s,c);});
  A.ring(cx,cy,7,hitT?K.y:K.w);L(cx-10,cy,cx+10,cy,K.w);L(cx,cy-10,cx,cy+10,K.w);T('SCORE '+g.score,6,6,K.y,2);T('SHOTS '+shots,W-6,6,shots<6?K.r:K.w,2,'r');};
 return g;}});

/* ---- ORBIT HOP ---- */
A.add({id:'orbit',name:'ORBIT HOP',cat:'PUZZLE',how:'A JUMPS TO THE NEXT RING. LAND ON THE PAD.',make(){
 const g={over:null,score:0};let ring=0,a=0,dir=1,rings=[],jump=null,life=3;const mk=i=>({y:200-i*45,r:26+ri(14),pa:rnd(6.28),pw:.9-Math.min(.5,i*.04),sp:.03+i*.003});for(let i=0;i<8;i++)rings.push(mk(i));
 g.update=()=>{const q=rings[ring];if(jump){jump.t+=.08;if(jump.t>=1){jump=null;ring++;const n=rings[ring];let d=Math.abs(((a-n.pa)%6.283+9.425)%6.283-3.1416);if(d<n.pw){g.score+=d<n.pw*.4?30:10;S('coin');dir*=-1;}else{life--;S('boom');if(life<=0)g.over='MISSED';}if(ring>=6){rings.shift();ring--;rings.push(mk(rings.length+ring*0+rings[rings.length-1].id||0));rings[rings.length-1].y=rings[rings.length-2].y-45;rings.forEach(r=>r.y+=45);}}return;}
  a+=dir*q.sp;if(A.hit(0).a){jump={t:0};S('jump');}};
 g.draw=()=>{A.cls('#05030f');rings.forEach((q,i)=>{const y=q.y;A.ring(160,y,q.r,i===ring?K.c:K.gr);A.c.strokeStyle=i>ring?K.y:K.d;A.c.lineWidth=4;A.c.beginPath();A.c.arc(160,y,q.r,q.pa-q.pw,q.pa+q.pw);A.c.stroke();});
  const q=rings[ring],n=rings[ring+1]||q;let x,y;if(jump){const r=q.r+(n.r-q.r)*jump.t;x=160+Math.cos(a)*r;y=q.y+(n.y-q.y)*jump.t-Math.sin(jump.t*3.14)*20;}else{x=160+Math.cos(a)*q.r;y=q.y+Math.sin(a)*q.r*.35;}C(x,y,5,K.g);T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+life,W-6,6,K.w,2,'r');};
 return g;}});
})();
