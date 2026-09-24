(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- ROAD HOPPER ---- */
A.add({id:'hopper',name:'ROAD HOPPER',cat:'CLASSICS',how:'HOP ACROSS THE ROAD AND RIDE THE LOGS.|FILL ALL FIVE DOCKS AT THE TOP.',make(){
 const g={over:null,score:0},CS=16;let f,lanes,homes,lives=3,lvl=1,best;
 const build=()=>{lanes=[];for(let r=3;r<=7;r++){const d=r%2?1:-1,sp=(.5+((r*7)%5)*.18)*(1+lvl*.12)*d,len=r%3===0?3:r%3===1?4:2,it=[];for(let x=0;x<W+120;x+=(len+2+r%2)*CS+16)it.push(x);lanes[r]={sp,len:len*CS,it,log:1};}
  for(let r=9;r<=13;r++){const d=r%2?-1:1,sp=(.7+((r*5)%4)*.3)*(1+lvl*.12)*d,len=r===11?2:1,it=[];for(let x=0;x<W+100;x+=(r%2?5:4)*CS+r*3)it.push(x);lanes[r]={sp,len:len*CS+6,it,log:0};}};
 const reset=()=>{f={x:152,y:14};best=14;};homes=[0,0,0,0,0];build();reset();
 const die=()=>{lives--;S('boom');if(lives<=0)g.over='GAME OVER';else reset();};
 g.update=()=>{const h=A.hit(0);if(h.l)f.x-=CS;if(h.r)f.x+=CS;if(h.u){f.y--;S('blip');if(f.y<best){best=f.y;g.score+=10;}}if(h.d&&f.y<14)f.y++;f.x=cl(f.x,0,W-CS);
  const span=W+140;lanes.forEach(l=>{if(l)l.it=l.it.map(x=>{x+=l.sp;if(x>W+70)x-=span;if(x<-70-l.len)x+=span;return x;});});
  const l=lanes[f.y];if(l){const on=l.it.find(x=>f.x+12>x&&f.x+4<x+l.len);if(l.log){if(on===undefined)return die();f.x+=l.sp;if(f.x<-8||f.x>W-8)return die();}else if(on!==undefined)return die();}
  if(f.y===2){const i=Math.round((f.x-24)/64);if(i>=0&&i<5&&Math.abs(f.x-(24+i*64))<14&&!homes[i]){homes[i]=1;g.score+=100;S('score');if(homes.every(v=>v)){homes=[0,0,0,0,0];lvl++;g.score+=500;build();}reset();}else die();}};
 g.draw=()=>{A.cls();R(0,32,W,16,'#1e8a45');R(0,48,W,80,'#1a3fa8');R(0,128,W,16,'#6a4fb5');R(0,144,W,80,'#222');R(0,224,W,16,'#6a4fb5');for(let i=0;i<5;i++){R(20+i*64,32,24,16,'#0b2a66');if(homes[i])R(24+i*64,34,16,12,K.g);}
  for(let r=10;r<=13;r++)for(let x=0;x<W;x+=24)R(x,r*CS-1,12,1,'#666');
  lanes.forEach((l,r)=>{if(l)l.it.forEach(x=>{if(l.log){R(x,r*CS+2,l.len,12,'#8a5c33');R(x+2,r*CS+5,l.len-4,2,'#5b3a1e');}else{R(x,r*CS+3,l.len,10,[K.r,K.y,K.p,K.c,K.o][r-9]);R(x+3,r*CS+5,l.len-6,6,'#9fd8ff');}});});
  R(f.x+2,f.y*CS+3,12,10,K.g);R(f.x+3,f.y*CS+1,3,3,K.w);R(f.x+10,f.y*CS+1,3,3,K.w);R(f.x,f.y*CS+10,3,4,K.g);R(f.x+13,f.y*CS+10,3,4,K.g);
  R(0,0,W,30,K.bg);T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives+'  LV '+lvl,W-6,6,K.w,2,'r');};
 return g;}});

/* ---- SKY SHIELD ---- */
A.add({id:'shield',name:'SKY SHIELD',cat:'CLASSICS',how:'MOVE THE CROSSHAIR. A LAUNCHES AN INTERCEPTOR THERE.|BLASTS DESTROY INCOMING ROCKETS. SAVE YOUR CITIES.',make(){
 const g={over:null,score:0};let cx=160,cy=100,ci=[1,1,1,1,1,1],en=[],sh=[],ex=[],wave=1,toSpawn=8,ammo=20,t=0;const cxs=i=>30+i*52;
 g.update=()=>{const k=A.in(0);cx=cl(cx+ax(k)*3.2,6,W-6);cy=cl(cy+ay(k)*3.2,24,190);
  if(A.hit(0).a&&ammo>0){ammo--;const d=Math.hypot(cx-160,cy-214);sh.push({x:160,y:214,tx:cx,ty:cy,vx:(cx-160)/d*5,vy:(cy-214)/d*5});S('shoot');}
  if(toSpawn>0&&++t>Math.max(25,80-wave*6)){t=0;toSpawn--;const live=ci.map((v,i)=>v?i:-1).filter(i=>i>=0),ti=live.length?live[ri(live.length)]:ri(6),sx=rnd(W),tx=cxs(ti),d=Math.hypot(tx-sx,206),sp=.45+wave*.07;en.push({sx,x:sx,y:14,vx:(tx-sx)/d*sp,vy:206/d*sp,ti});}
  sh.forEach(s=>{s.x+=s.vx;s.y+=s.vy;if(Math.hypot(s.x-s.tx,s.y-s.ty)<5){s.done=1;ex.push({x:s.tx,y:s.ty,r:1,g:1});S('boom');}});sh=sh.filter(s=>!s.done);
  ex.forEach(e=>{e.r+=e.g*.55;if(e.r>19)e.g=-1;});ex=ex.filter(e=>e.r>0);
  en.forEach(m=>{m.x+=m.vx;m.y+=m.vy;if(ex.some(e=>Math.hypot(e.x-m.x,e.y-m.y)<e.r)){m.done=1;g.score+=25;ex.push({x:m.x,y:m.y,r:1,g:1});}else if(m.y>=214){m.done=1;if(ci[m.ti]){ci[m.ti]=0;S('lose');}ex.push({x:m.x,y:214,r:1,g:1});}});en=en.filter(m=>!m.done);
  if(!ci.some(v=>v)){g.over='CITIES LOST';return;}if(toSpawn===0&&!en.length&&!ex.length){g.score+=ci.filter(v=>v).length*50+ammo*5;wave++;toSpawn=7+wave*2;ammo=20;S('win');}};
 g.draw=()=>{A.cls();R(0,220,W,20,'#5b3a1e');A.poly([[145,220],[152,208],[168,208],[175,220]],'#8a5c33',1);ci.forEach((v,i)=>{const x=cxs(i);if(v){R(x-9,212,6,8,K.c);R(x-3,208,6,12,K.b);R(x+3,214,6,6,K.c);}else R(x-9,218,18,2,K.gr);});
  en.forEach(m=>{L(m.sx,14,m.x,m.y,'#7a1d33');R(m.x-1,m.y-1,3,3,K.r);});sh.forEach(s=>{L(160,214,s.x,s.y,'#1c5f8a');R(s.x-1,s.y-1,2,2,K.w);});ex.forEach(e=>C(e.x,e.y,e.r,A.t%4<2?K.y:K.o));
  L(cx-5,cy,cx+5,cy,K.w);L(cx,cy-5,cx,cy+5,K.w);T('SCORE '+g.score,6,4,K.y,2);T('WAVE '+wave+'  SHOTS '+ammo,W-6,4,K.w,2,'r');};
 return g;}});

/* ---- MOON LANDER ---- */
A.add({id:'lander',name:'MOON LANDER',cat:'CLASSICS',how:'LEFT AND RIGHT TILT. UP OR A FIRES THE ENGINE.|TOUCH DOWN ON THE PAD SLOWLY AND UPRIGHT.',make(){
 const g={over:null,score:0};let s,ter,pad,lvl=0,fuel=0,wait=0,msg='';
 const build=()=>{lvl++;ter=[];const pi=3+ri(10),pw=Math.max(2,4-(lvl>>1));let y=170+rnd(30);for(let i=0;i<=16;i++){if(i>pi&&i<=pi+pw){}else y=cl(y+rnd(60)-30,120,225);ter.push(y);}pad=[pi*20,(pi+pw)*20,ter[pi]];fuel=Math.max(250,520-lvl*40);s={x:30+rnd(60),y:30,vx:.6,vy:0,a:0};};build();
 const gy=x=>{const i=cl(Math.floor(x/20),0,15),f=(x-i*20)/20;return ter[i]+(ter[i+1]-ter[i])*f;};
 g.update=()=>{if(wait>0){if(--wait===0){if(msg==='LANDED!')build();else g.over='CRASHED';}return;}const k=A.in(0);s.a=cl(s.a+ax(k)*.04,-1.4,1.4);
  if((k.u||k.a)&&fuel>0){fuel--;s.vx+=Math.sin(s.a)*.045;s.vy-=Math.cos(s.a)*.045;if(A.t%6===0)S('blip');}s.vy+=.016;s.x=cl(s.x+s.vx,4,W-4);s.y+=s.vy;
  if(s.y+6>=gy(s.x)){const ok=s.x>pad[0]+3&&s.x<pad[1]-3&&Math.abs(s.vy)<.75&&Math.abs(s.vx)<.5&&Math.abs(s.a)<.25;s.y=gy(s.x)-6;if(ok){msg='LANDED!';g.score+=100+fuel;S('win');}else{msg='CRASH!';S('boom');}wait=80;}};
 g.draw=()=>{A.cls();for(let i=0;i<30;i++)R((i*97)%W,(i*53)%110,1,1,K.w);const p=[[0,H]];ter.forEach((y,i)=>p.push([i*20,y]));p.push([W,H]);A.poly(p,'#4a4570',1);R(pad[0],pad[2],pad[1]-pad[0],3,K.g);
  const c=Math.cos(s.a),n=Math.sin(s.a),P=(x,y)=>[s.x+x*c-y*n,s.y+x*n+y*c];if(msg!=='CRASH!'||wait===0){A.poly([P(-5,-5),P(5,-5),P(5,2),P(-5,2)],K.w,1);L(...P(-4,2),...P(-7,6),K.gr);L(...P(4,2),...P(7,6),K.gr);if((A.in(0).u||A.in(0).a)&&fuel>0&&!wait)A.poly([P(-3,3),P(3,3),P(0,9+rnd(4))],K.o,1);}else C(s.x,s.y,10+rnd(6),K.o);
  T('SCORE '+g.score,6,4,K.y,2);T('FUEL '+fuel,W-6,4,fuel<80?K.r:K.w,2,'r');T('DROP '+s.vy.toFixed(1)+'   DRIFT '+Math.abs(s.vx).toFixed(1),W-6,18,Math.abs(s.vy)<.75&&Math.abs(s.vx)<.5?K.g:K.r,1,'r');if(wait)T(msg,160,70,K.y,3,'c');};
 return g;}});

/* ---- FLAP BOT ---- */
A.add({id:'flap',name:'FLAP BOT',cat:'CLASSICS',how:'PRESS A OR UP TO FLAP.|SLIP THROUGH THE GAPS.',make(){
 const g={over:null,score:0};let y=110,vy=0,pp=[],t=0,go=false;
 g.update=()=>{const h=A.hit(0);if(h.a||h.u){vy=-2.9;go=true;S('jump');}if(!go)return;vy+=.17;y+=vy;if(++t%85===1)pp.push({x:W+10,g:50+rnd(110),ok:0});
  for(const p of pp){p.x-=1.7;if(!p.ok&&p.x<60){p.ok=1;g.score++;S('coin');}if(p.x<76&&p.x>36&&(y-6<p.g-2||y+6>p.g+54))g.over='GAME OVER';}pp=pp.filter(p=>p.x>-30);if(y>222||y<0)g.over='GAME OVER';};
 g.draw=()=>{A.cls('#1c5f8a');R(0,226,W,14,'#c4915a');pp.forEach(p=>{R(p.x,0,26,p.g,K.g);R(p.x-2,p.g-8,30,8,'#1e8a45');R(p.x,p.g+52,26,H,K.g);R(p.x-2,p.g+52,30,8,'#1e8a45');});
  R(50,y-6,14,12,K.y);R(59,y-4,4,4,K.w);R(61,y-3,2,2,K.k);R(64,y,5,3,K.o);R(46,y-2+(vy<0?3:-3),6,4,K.o);T(g.score,160,10,K.w,4,'c');if(!go)T('PRESS A TO FLAP',160,150,K.w,2,'c');};
 return g;}});

/* ---- DASH RUNNER ---- */
A.add({id:'runner',name:'DASH RUNNER',cat:'CLASSICS',how:'A OR UP JUMPS. DOWN DUCKS UNDER DRONES.|IT ONLY GETS FASTER.',make(){
 const g={over:null,score:0},GY=190;let y=GY,vy=0,ob=[],d=0,nx=60;
 g.update=()=>{const k=A.in(0),sp=3+Math.min(4,d/3000);d+=sp;g.score=d/10|0;const duck=k.d&&y>=GY;if((k.a||k.u)&&y>=GY){vy=-5.6;S('jump');}vy+=k.d?.6:.3;y+=vy;if(y>GY){y=GY;vy=0;}
  nx-=sp;if(nx<=0){nx=70+rnd(110);const fl=d>1500&&Math.random()<.3;ob.push(fl?{x:W+10,y:GY-24,w:16,h:8,f:1}:{x:W+10,w:8+ri(3)*5,h:14+ri(2)*10,y:0});}
  for(const o of ob){o.x-=sp;const oy=o.f?o.y:GY-o.h,ph=duck?10:22;if(o.x<46&&o.x+o.w>34&&y-ph<oy+o.h&&y>oy)g.over='GAME OVER';}ob=ob.filter(o=>o.x>-30);};
 g.draw=()=>{A.cls();for(let i=0;i<20;i++)R((i*61-d*.2)%W+((i*61-d*.2)%W<0?W:0),20+(i*37)%90,1,1,K.w);R(0,GY,W,2,K.c);for(let i=0;i<10;i++){const x=((i*40-d)%400+400)%400-40;R(x,GY+8+(i%3)*8,12,1,K.d);}
  const duck=A.in(0).d&&y>=GY;if(duck)R(32,y-10,16,10,K.y);else{R(34,y-22,10,14,K.y);R(36,y-8,3,8,K.y);R(41,y-8,3,8,K.y);}R(duck?44:41,y-(duck?8:19),2,2,K.k);
  ob.forEach(o=>{if(o.f){R(o.x,o.y,o.w,o.h,K.p);R(o.x-3,o.y+2,3,2,K.w);R(o.x+o.w,o.y+2,3,2,K.w);}else R(o.x,GY-o.h,o.w,o.h,K.r);});T(g.score,W-6,6,K.w,2,'r');};
 return g;}});

/* ---- CAVE COPTER ---- */
A.add({id:'copter',name:'CAVE COPTER',cat:'CLASSICS',how:'HOLD A TO CLIMB. LET GO TO SINK.|THE CAVE NARROWS AS YOU FLY.',make(){
 const g={over:null,score:0};let y=120,vy=0,cave=[],d=0,mid=120,blocks=[];for(let i=0;i<82;i++)cave.push([30,210]);
 g.update=()=>{d++;g.score=d/6|0;vy+=A.in(0).a||A.in(0).u?-.16:.14;vy=cl(vy,-3,3);y+=vy;if(d%2===0){mid=cl(mid+rnd(14)-7,70,170);const gap=Math.max(62,150-d/60);cave.shift();cave.push([mid-gap/2,mid+gap/2]);blocks.forEach(b=>b.x-=4);if(d%90===0)blocks.push({x:W,y:mid-gap/2+rnd(gap-24)});blocks=blocks.filter(b=>b.x>-10);}
  const c=cave[15];if(y-5<c[0]||y+5>c[1]||blocks.some(b=>b.x<70&&b.x+8>50&&y+5>b.y&&y-5<b.y+24)){g.over='GAME OVER';S('boom');}};
 g.draw=()=>{A.cls();cave.forEach((c,i)=>{R(i*4-4,0,4,c[0],'#1e8a45');R(i*4-4,c[1],4,H,'#1e8a45');});blocks.forEach(b=>R(b.x,b.y,8,24,'#1e8a45'));R(50,y-4,16,8,K.y);R(44,y-1,6,2,K.y);R(48,y-7,20,1,A.t%4<2?K.w:K.gr);R(62,y-2,3,3,K.c);T(g.score,W-6,6,K.w,2,'r');};
 return g;}});

/* ---- NEON TRAILS ---- */
A.add({id:'trails',name:'NEON TRAILS',cat:'VERSUS',vs:1,how:'STEER YOUR LIGHT BIKE. NEVER STOP, NEVER HIT A TRAIL.|FIRST TO WIN 3 ROUNDS.',make(){
 const g={over:null,score:0},GW=80,GH=55;let gr,b,sc=[0,0],wait=50,t=0;
 const reset=()=>{gr=new Uint8Array(GW*GH);b=[{x:15,y:27,dx:1,dy:0},{x:64,y:27,dx:-1,dy:0}];wait=50;};reset();
 const free=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&!gr[y*GW+x];const room=(x,y,dx,dy)=>{let n=0;while(n<30&&free(x+dx*(n+1),y+dy*(n+1)))n++;return n;};
 g.update=()=>{for(let i=0;i<2;i++){const q=b[i];if(i===1&&A.cpu){const f=room(q.x,q.y,q.dx,q.dy);if(f<2+ri(3)||Math.random()<.01*(2-A.ai)){const l=room(q.x,q.y,q.dy,-q.dx),r=room(q.x,q.y,-q.dy,q.dx);if(Math.max(l,r)>f||f<2){const tl=l>r;[q.dx,q.dy]=tl?[q.dy,-q.dx]:[-q.dy,q.dx];}}if(A.ai<.6&&Math.random()<.004)[q.dx,q.dy]=[q.dy,-q.dx];}
   else{const h=A.hit(i);if(h.l&&!q.dx){q.dx=-1;q.dy=0;}else if(h.r&&!q.dx){q.dx=1;q.dy=0;}else if(h.u&&!q.dy){q.dx=0;q.dy=-1;}else if(h.d&&!q.dy){q.dx=0;q.dy=1;}}}
  if(wait>0){wait--;return;}if(++t%3)return;const dead=[0,0];b.forEach((q,i)=>{gr[q.y*GW+q.x]=i+1;q.x+=q.dx;q.y+=q.dy;if(!free(q.x,q.y))dead[i]=1;});if(b[0].x===b[1].x&&b[0].y===b[1].y)dead[0]=dead[1]=1;
  if(dead[0]||dead[1]){S('boom');if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{A.cls();R(0,18,W,1,K.d);for(let i=0;i<GW*GH;i++)if(gr[i])R((i%GW)*4,20+((i/GW)|0)*4,4,4,gr[i]===1?'#178a7d':'#a0205a');b.forEach((q,i)=>R(q.x*4,20+q.y*4,4,4,i?K.p:K.c));A.hud2(sc[0],sc[1]);if(wait>0)T('GET READY',160,110,K.y,2,'c');};
 return g;}});

/* ---- TANK DUEL ---- */
A.add({id:'tanks',name:'TANK DUEL',cat:'VERSUS',vs:1,how:'LEFT AND RIGHT TURN. UP AND DOWN DRIVE. A FIRES.|SHELLS BOUNCE ONCE. FIVE HITS WINS.',make(){
 const g={over:null,score:0},WL=[[70,60,12,60],[238,120,12,60],[130,110,60,12],[150,40,12,40],[158,170,12,40]];let tk,sh=[],sc=[0,0],stuck=0;
 const blocked=(x,y,r)=>x<r||x>W-r||y<22+r||y>H-r||WL.some(w=>x>w[0]-r&&x<w[0]+w[2]+r&&y>w[1]-r&&y<w[1]+w[3]+r);
 const reset=()=>{tk=[{x:30,y:130,a:0,cd:0},{x:290,y:130,a:3.14,cd:0}];sh=[];};reset();
 g.update=()=>{if(A.cpu){const q=tk[1],o=tk[0],want=Math.atan2(o.y-q.y,o.x-q.x);let df=want-q.a;while(df>3.14)df-=6.28;while(df<-3.14)df+=6.28;const d=Math.hypot(o.x-q.x,o.y-q.y);
   if(stuck>0){stuck--;A.bot({d:stuck>20,l:stuck<=20,u:stuck<=20});}else{const fx=q.x+Math.cos(q.a)*12,fy=q.y+Math.sin(q.a)*12;if(blocked(fx,fy,7)&&Math.abs(df)<.5)stuck=45;A.bot({l:df<-.08,r:df>.08,u:d>70&&Math.abs(df)<.8,a:Math.abs(df)<.15&&Math.random()<.03+.06*A.ai});}}
  for(let i=0;i<2;i++){const q=tk[i],k=A.in(i);q.a+=ax(k)*.05;const m=-ay(k)*(i&&A.cpu?.7+.5*A.ai:1.3),nx=q.x+Math.cos(q.a)*m,ny=q.y+Math.sin(q.a)*m;if(!blocked(nx,q.y,7))q.x=nx;if(!blocked(q.x,ny,7))q.y=ny;if(q.cd>0)q.cd--;
   if(A.hit(i).a&&q.cd===0){q.cd=45;sh.push({x:q.x+Math.cos(q.a)*10,y:q.y+Math.sin(q.a)*10,vx:Math.cos(q.a)*3.2,vy:Math.sin(q.a)*3.2,b:1,o:i,t:0});S('shoot');}}
  for(const s of sh){s.t++;s.x+=s.vx;if(blocked(s.x,s.y,1)){if(s.b-->0){s.x-=s.vx;s.vx*=-1;}else s.dead=1;}s.y+=s.vy;if(!s.dead&&blocked(s.x,s.y,1)){if(s.b-->0){s.y-=s.vy;s.vy*=-1;}else s.dead=1;}
   for(let i=0;i<2;i++)if(!s.dead&&(i!==s.o||s.t>20)&&Math.hypot(s.x-tk[i].x,s.y-tk[i].y)<8){s.dead=1;sc[1-i]++;S('boom');if(sc[1-i]>=5){g.over=A.win(1-i);return;}reset();return;}}sh=sh.filter(s=>!s.dead);};
 g.draw=()=>{A.cls('#2a2d1e');R(0,0,W,22,K.bg);WL.forEach(w=>R(w[0],w[1],w[2],w[3],'#8a7a4f'));tk.forEach((q,i)=>{const c=Math.cos(q.a),n=Math.sin(q.a);A.poly([[q.x+c*8-n*6,q.y+n*8+c*6],[q.x+c*8+n*6,q.y+n*8-c*6],[q.x-c*8+n*6,q.y-n*8-c*6],[q.x-c*8-n*6,q.y-n*8+c*6]],i?K.p:K.c,1);L(q.x,q.y,q.x+c*12,q.y+n*12,K.w,2);});sh.forEach(s=>R(s.x-1,s.y-1,3,3,K.y));A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- SUMO BUMP ---- */
A.add({id:'sumo',name:'SUMO BUMP',cat:'VERSUS',vs:1,how:'PUSH YOUR RIVAL OUT OF THE RING.|A IS A SHORT DASH. FIRST TO 3.',make(){
 const g={over:null,score:0},RR=92;let p,sc=[0,0],wait=50;const reset=()=>{p=[{x:115,y:128,vx:0,vy:0,cd:0},{x:205,y:128,vx:0,vy:0,cd:0}];wait=50;};reset();
 g.update=()=>{if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],me=Math.hypot(q.x-160,q.y-128);let tx=o.x,ty=o.y;if(me>RR*.72){tx=160;ty=128;}const d=Math.hypot(o.x-q.x,o.y-q.y);A.bot({l:q.x>tx+3,r:q.x<tx-3,u:q.y>ty+3,d:q.y<ty-3,a:d<45&&me<RR*.7&&Math.random()<.05*A.ai});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),acc=i&&A.cpu?.09+.09*A.ai:.17;q.vx=(q.vx+ax(k)*acc)*.95;q.vy=(q.vy+ay(k)*acc)*.95;if(q.cd>0)q.cd--;if(A.hit(i).a&&q.cd===0&&(ax(k)||ay(k))){q.vx+=ax(k)*3;q.vy+=ay(k)*3;q.cd=70;S('jump');}q.x+=q.vx;q.y+=q.vy;}
  const dx=p[1].x-p[0].x,dy=p[1].y-p[0].y,d=Math.hypot(dx,dy);if(d<26&&d>0){const nx=dx/d,ny=dy/d,rv=(p[1].vx-p[0].vx)*nx+(p[1].vy-p[0].vy)*ny;if(rv<0){p[0].vx+=rv*nx*1.05;p[0].vy+=rv*ny*1.05;p[1].vx-=rv*nx*1.05;p[1].vy-=rv*ny*1.05;S('hit');}const o=(26-d)/2;p[0].x-=nx*o;p[0].y-=ny*o;p[1].x+=nx*o;p[1].y+=ny*o;}
  const out=p.map(q=>Math.hypot(q.x-160,q.y-128)>RR+4);if(out[0]||out[1]){S('score');if(out[0]!==out[1]){const w=out[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{A.cls('#3a2a18');C(160,128,RR+6,'#e8c77a');C(160,128,RR,'#d9a55b');A.ring(160,128,RR,K.w);R(146,120,3,16,K.w);R(171,120,3,16,K.w);p.forEach((q,i)=>{C(q.x,q.y,13,i?K.p:K.c);C(q.x,q.y,7,'#ffd9a8');R(q.x-4,q.y-10,8,4,K.k);if(q.cd===0)A.ring(q.x,q.y,15,K.y);});A.hud2(sc[0],sc[1]);if(wait>0)T('PUSH!',160,40,K.y,3,'c');};
 return g;}});

/* ---- QUICK DRAW ---- */
A.add({id:'quickdraw',name:'QUICK DRAW',cat:'VERSUS',vs:1,how:'WAIT FOR THE SIGNAL, THEN PRESS A FIRST.|FIRE EARLY AND YOU LOSE THE ROUND. FIRST TO 3.',make(){
 const g={over:null,score:0};let sc=[0,0],t=0,go=0,ph='wait',res='',cpuAt=0,w=-1;const nr=()=>{t=0;go=120+ri(200);ph='wait';cpuAt=go+Math.round(34-A.ai*20+rnd(10));w=-1;};nr();
 g.update=()=>{t++;if(ph==='wait'||ph==='go'){if(ph==='wait'&&t>=go){ph='go';S('coin');}if(A.cpu)A.bot({a:t>=cpuAt});const a=A.hit(0).a,b=A.hit(1).a;
   if(a||b){if(ph==='wait'){w=a?1:0;res=A.nm(1-w)+' FIRED EARLY!';}else{w=a&&b?(Math.random()<.5?0:1):a?0:1;res=A.nm(w)+' WINS IN '+((t-go)/60).toFixed(2)+'S';}sc[w]++;ph='res';t=0;S('shoot');}}
  else if(t>100){if(sc[w]>=3)g.over=A.win(w);else nr();}};
 g.draw=()=>{A.cls('#ff9838');R(0,0,W,120,'#ffcf3f');C(250,60,22,'#fff3d6');R(0,170,W,70,'#b5651d');[0,1].forEach(i=>{const x=i?250:70,d=i?-1:1,shot=ph==='res'&&w===i,down=ph==='res'&&w!==i;if(down){R(x-14,166,30,8,K.k);return;}R(x-6,130,12,24,K.k);R(x-5,120,10,10,K.k);R(x-9,117,18,4,K.k);R(x-6,154,5,16,K.k);R(x+1,154,5,16,K.k);if(shot){R(x+d*6,136,d*14,3,K.k);if(t<8)C(x+d*24,137,4,K.w);}else R(x+d*6,138,3,12,K.k);});
  A.hud2(sc[0],sc[1]);if(ph==='wait')T('WAIT FOR IT...',160,60,K.k,2,'c');if(ph==='go')T('DRAW!',160,50,K.r,5,'c');if(ph==='res')T(res,160,60,K.k,2,'c');};
 return g;}});
})();
