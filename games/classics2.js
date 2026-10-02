(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
/* little car sprite: x,y top-left, length, body colour, dir (+1 right) */
const car=(x,y,len,col,dir,truck)=>{const c=A.c;X.shadow(x+len/2,y+12,len/2+1,2,.35);if(truck){X.block(x+(dir>0?0:10),y+1,len-10,11,'#d8dce8',1);X.block(x+(dir>0?len-11:0),y+2,11,10,col,2);c.fillStyle='#9fd8ff';c.fillRect(x+(dir>0?len-5:1),y+4,4,6);c.fillStyle='rgba(0,0,0,.25)';for(let i=x+(dir>0?3:13);i<x+(dir>0?len-13:len-3);i+=5)c.fillRect(i,y+3,1,8);}
 else{X.block(x,y+2,len,10,col,3);X.rr(x+len*.25,y+3.5,len*.5,7,2,X.lg(0,y+3,0,y+10,['#d8f2ff','#5a9ac8']));c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x+len*.3,y+4,len*.15,1);}
 c.fillStyle='#151515';c.fillRect(x+2,y+.5,4,2);c.fillRect(x+len-6,y+.5,4,2);c.fillRect(x+2,y+11.5,4,2);c.fillRect(x+len-6,y+11.5,4,2);
 const hx=dir>0?x+len-1:x;X.glow(hx+dir*3,y+7,8,'#fff2a0',.35);c.fillStyle='#fff6c0';c.fillRect(hx-(dir>0?1:0),y+3.5,2,2);c.fillRect(hx-(dir>0?1:0),y+8.5,2,2);c.fillStyle='#ff3040';const tx=dir>0?x:x+len-1;c.fillRect(tx,y+4,1,2);c.fillRect(tx,y+8,1,2);};

/* ---- ROAD HOPPER ---- */
A.add({id:'hopper',name:'ROAD HOPPER',cat:'CLASSICS',how:'HOP ACROSS. RIDE LOGS. FILL 5 DOCKS.',make(){
 const g={over:null,score:0},CS=16,fx=X.fx();let f,lanes,homes,lives=3,lvl=1,best,hop=0,face=0;
 const build=()=>{lanes=[];for(let r=3;r<=7;r++){const d=r%2?1:-1,sp=(.5+((r*7)%5)*.18)*(1+lvl*.12)*d,len=r%3===0?3:r%3===1?4:2,it=[];for(let x=0;x<W+120;x+=(len+2+r%2)*CS+16)it.push(x);lanes[r]={sp,len:len*CS,it,log:1};}
  for(let r=9;r<=13;r++){const d=r%2?-1:1,sp=(.7+((r*5)%4)*.3)*(1+lvl*.12)*d,len=r===11?2:1,it=[];for(let x=0;x<W+100;x+=(r%2?5:4)*CS+r*3)it.push(x);lanes[r]={sp,len:len*CS+6,it,log:0};}};
 const reset=()=>{f={x:152,y:14};best=14;face=0;};homes=[0,0,0,0,0];build();reset();
 const die=(kind)=>{lives--;S('boom');const x=f.x+8,y=f.y*CS+8;if(kind==='w'){fx.ring(x,y,'#bfe8ff',18);fx.spark(x,y,'#9fd8ff',12,2);}else{fx.debris(x,y,'#5ad04a',10,2);fx.flash(K.r,6);}if(lives<=0)g.over='GAME OVER';else reset();};
 g.update=()=>{const h=A.hit(0);if(hop)hop--;const mv=()=>{hop=8;S('blip');};if(h.l){f.x-=CS;face=3;mv();}if(h.r){f.x+=CS;face=1;mv();}if(h.u){f.y--;face=0;mv();if(f.y<best){best=f.y;g.score+=10;}}if(h.d&&f.y<14){f.y++;face=2;mv();}f.x=cl(f.x,0,W-CS);
  const span=W+140;lanes.forEach(l=>{if(l)l.it=l.it.map(x=>{x+=l.sp;if(x>W+70)x-=span;if(x<-70-l.len)x+=span;return x;});});
  const l=lanes[f.y];if(l){const on=l.it.find(x=>f.x+12>x&&f.x+4<x+l.len);if(l.log){if(on===undefined)return die('w');f.x+=l.sp;if(f.x<-8||f.x>W-8)return die('w');}else if(on!==undefined)return die('r');}
  if(f.y===2){const i=Math.round((f.x-24)/64);if(i>=0&&i<5&&Math.abs(f.x-(24+i*64))<14&&!homes[i]){homes[i]=1;g.score+=100;S('score');fx.ring(32+i*64,40,K.y,20);fx.pop(32+i*64,30,'+100',K.y);if(homes.every(v=>v)){homes=[0,0,0,0,0];lvl++;g.score+=500;fx.flash('#ffffff',8);build();}reset();}else die('r');}};
 const bg=()=>{const c=A.c;X.vg(0,0,W,32,['#0e2a18','#174a26']);X.vg(0,32,W,16,['#2a7a3a','#1a5a2a']);for(let i=0;i<40;i++)X.disc((i*37)%W,34+(i*13)%12,3+(i%3),i%2?'#3a9a4a':'#24703a');
  for(let i=0;i<5;i++){X.rr(20+i*64,33,24,15,3,X.lg(0,33,0,48,['#0a2a6a','#14408a']));X.ell(32+i*64,42,6,3,'#2a8a3a');}
  X.water(0,48,W,80,'#1e5ac8','#123a8a',0);
  X.vg(0,128,W,16,['#6a8a3a','#4a6a2a']);for(let i=0;i<30;i++){c.fillStyle=['#ffd0e0','#fff3a0','#d0e0ff'][i%3];c.fillRect((i*53)%W,131+(i*7)%10,1.5,1.5);}
  X.vg(0,144,W,80,['#2e2e36','#1e1e24']);for(let r=10;r<=13;r++)for(let x=0;x<W;x+=24){c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x,r*CS-1,12,1.2);}c.fillStyle='#d8d8d8';c.fillRect(0,144,W,1.5);c.fillRect(0,222,W,1.5);
  X.vg(0,224,W,16,['#8a7aa8','#6a5a88']);for(let x=0;x<W;x+=16){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(x,224,1,16);}};
 const frog=(x,y,dir,j)=>{const c=A.c;c.save();c.translate(x+8,y+8);c.rotate(dir*1.5708);const s=1+j*.05;c.scale(1/s,s);X.shadow(0,5,6,2,.3);
  for(const sx of[-1,1]){X.ell(sx*5.5,3+j*.3,2.6,4,'#3aa02a');X.ell(sx*5,-3,2,3,'#3aa02a');}X.ell(0,1,5.5,6.5,X.lg(0,-6,0,7,['#9aff7a','#4ad03a','#2a8a2a']));c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-2,-3,4,1);
  for(const sx of[-1,1]){X.disc(sx*2.6,-4.5,2.2,'#7aff5a');X.disc(sx*2.6,-5,1.4,'#ffffff');X.disc(sx*2.6,-5.4,.8,'#111');}c.restore();};
 g.draw=()=>{X.cache('hopperbg',bg);const c=A.c;c.fillStyle='rgba(255,255,255,.12)';for(let j=52;j<126;j+=9)for(let i=0;i<W;i+=40){const o=(A.t*.4+j*7)%40;c.fillRect((i+o)%W,j+Math.sin(A.t*.05+i)*1,10,1);}
  for(let i=0;i<5;i++)if(homes[i])frog(24+i*64,32,2,0);
  lanes.forEach((l,r)=>{if(l)l.it.forEach(x=>{if(l.log){const y=r*CS+2;X.shadow(x+l.len/2,y+13,l.len/2,2,.3);X.rr(x,y,l.len,12,5,X.lg(0,y,0,y+12,['#b88a5a','#8a5c33','#4a2c13']));c.fillStyle='rgba(0,0,0,.22)';for(let i=x+6;i<x+l.len-6;i+=7)c.fillRect(i,y+3+(i%3),5,1);c.fillStyle='rgba(255,230,190,.25)';c.fillRect(x+4,y+2,l.len-8,1);X.ell(x+3,y+6,2.5,5,'#d8b080');X.ell(x+3,y+6,1.2,2.5,'#8a5c33');}else car(x,r*CS+1,l.len,['#ff4f6d','#ffcf3f','#ff4f9a','#2fd6c3','#ff9838'][r-9],l.sp>0?1:-1,r===11);});});
  if(!g.over)frog(f.x,f.y*CS,face,hop>4?hop-4:0);fx.draw();X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++)X.heart(W-48-i*11,8,1);};
 return g;}});

/* ---- SKY SHIELD ---- */
A.add({id:'shield',name:'SKY SHIELD',cat:'CLASSICS',how:'MOVE CROSSHAIR. A FIRES. SAVE THE CITIES.',make(){
 const g={over:null,score:0},fx=X.fx();let cx=160,cy=100,ci=[1,1,1,1,1,1],en=[],sh=[],ex=[],wave=1,toSpawn=8,ammo=20,t=0,smoke=[];const cxs=i=>30+i*52;
 g.update=()=>{const k=A.in(0);if(A.mouse.t>0){cx=cl(A.mouse.x,6,W-6);cy=cl(A.mouse.y,24,190);}else{cx=cl(cx+ax(k)*3.2,6,W-6);cy=cl(cy+ay(k)*3.2,24,190);}
  if(A.hit(0).a&&ammo>0){ammo--;const d=Math.hypot(cx-160,cy-214);sh.push({x:160,y:206,tx:cx,ty:cy,vx:(cx-160)/d*5,vy:(cy-214)/d*5});S('shoot');}
  if(toSpawn>0&&++t>Math.max(25,80-wave*6)){t=0;toSpawn--;const live=ci.map((v,i)=>v?i:-1).filter(i=>i>=0),ti=live.length?live[ri(live.length)]:ri(6),sx=rnd(W),tx=cxs(ti),d=Math.hypot(tx-sx,206),sp=.45+wave*.07;en.push({sx,x:sx,y:14,vx:(tx-sx)/d*sp,vy:206/d*sp,ti});}
  sh.forEach(s=>{s.x+=s.vx;s.y+=s.vy;if(Math.hypot(s.x-s.tx,s.y-s.ty)<5){s.done=1;ex.push({x:s.tx,y:s.ty,r:1,g:1});S('boom');}});sh=sh.filter(s=>!s.done);
  ex.forEach(e=>{e.r+=e.g*.55;if(e.r>19)e.g=-1;});ex=ex.filter(e=>e.r>0);
  en.forEach(m=>{m.x+=m.vx;m.y+=m.vy;if(ex.some(e=>Math.hypot(e.x-m.x,e.y-m.y)<e.r)){m.done=1;g.score+=25;ex.push({x:m.x,y:m.y,r:1,g:1});fx.spark(m.x,m.y,K.o,8,2);fx.pop(m.x,m.y-10,'+25',K.y);}else if(m.y>=214){m.done=1;if(ci[m.ti]){ci[m.ti]=0;S('lose');fx.flash(K.r,8);fx.debris(cxs(m.ti),212,'#4dabff',12,2.5);}ex.push({x:m.x,y:214,r:1,g:1});}});en=en.filter(m=>!m.done);
  if(A.t%6===0)ci.forEach((v,i)=>{if(!v)smoke.push({x:cxs(i)+rnd(10)-5,y:214,t:60});});smoke.forEach(s=>{s.y-=.4;s.x+=.15;s.t--;});smoke=smoke.filter(s=>s.t>0);
  if(!ci.some(v=>v)){g.over='CITIES LOST';return;}if(toSpawn===0&&!en.length&&!ex.length){const b=ci.filter(v=>v).length*50+ammo*5;g.score+=b;fx.pop(160,100,'WAVE BONUS +'+b,K.y);wave++;toSpawn=7+wave*2;ammo=20;S('win');}};
 const bg=()=>{X.sky(['#05061a','#16123a','#3a1a4a','#6a2a3a'],H);X.stars(80,5,0,0,170,.8);X.glow(250,190,120,'#ff5a3a',.18);X.hills(214,40,'#1a1030',0,.03,2);X.hills(218,24,'#120a22',90,.05,5);X.vg(0,218,W,22,['#3a2a3a','#1a1018']);};
 g.draw=()=>{X.cache('shieldbg',bg);const c=A.c;
  ci.forEach((v,i)=>{const x=cxs(i);if(v){const bl=[[-10,8,6],[-4,13,5],[1,10,5],[6,6,5]];bl.forEach(b=>{X.vg(x+b[0],214-b[1],b[2],b[1],['#6a9ae0','#2a4a8a']);for(let wy=214-b[1]+2;wy<212;wy+=3)if((wy+i+b[0])%2){c.fillStyle='#ffe08a';c.fillRect(x+b[0]+1,wy,1,1);c.fillRect(x+b[0]+3,wy,1,1);}});X.glow(x,206,14,'#6ab0ff',.15);}else{c.fillStyle='#2a2028';c.fillRect(x-10,212,20,4);c.fillStyle='#4a3838';c.fillRect(x-7,210,5,3);c.fillRect(x+1,211,6,2);if(A.t%20<10)X.glow(x,212,5,'#ff5a1a',.4);}});
  smoke.forEach(s=>{c.globalAlpha=s.t/90;X.disc(s.x,s.y,3+(60-s.t)*.08,'#3a3438');});c.globalAlpha=1;
  /* turret */const an=Math.atan2(cy-210,cx-160);X.ell(160,214,16,8,X.lg(0,206,0,220,['#9aa0b8','#4a4e64']));X.stroke([[160,208],[160+Math.cos(an)*12,208+Math.sin(an)*12]],'#c8d0e8',3);X.disc(160,208,4,'#6a7090');
  en.forEach(m=>{c.strokeStyle=X.lg(m.sx,14,m.x,m.y,['rgba(255,60,60,0)','rgba(255,90,90,.75)']);c.lineWidth=1.3;c.beginPath();c.moveTo(m.sx,14);c.lineTo(m.x,m.y);c.stroke();X.glow(m.x,m.y,6,'#ff4040',.8);X.disc(m.x,m.y,1.4,'#ffe0e0');});
  sh.forEach(s=>{X.stroke([[160,206],[s.x,s.y]],'rgba(80,200,255,.5)',1);X.glow(s.x,s.y,5,'#7fe0ff',.9);X.stroke([[s.tx-2,s.ty-2],[s.tx+2,s.ty+2]],'#7fe0ff',.8);X.stroke([[s.tx+2,s.ty-2],[s.tx-2,s.ty+2]],'#7fe0ff',.8);});
  ex.forEach(e=>{X.glow(e.x,e.y,e.r*1.8,'#ff8030',.5);X.disc(e.x,e.y,e.r,X.rg(e.x,e.y,0,e.x,e.y,e.r,['#ffffff','#fff0a0','#ffa030',A.t%4<2?'rgba(255,60,30,.6)':'rgba(255,120,40,.6)']));});
  const rt=A.t*.05;A.ring(cx,cy,7,'rgba(255,255,255,.85)');for(let i=0;i<4;i++){const a=rt+i*1.5708;X.stroke([[cx+Math.cos(a)*9,cy+Math.sin(a)*9],[cx+Math.cos(a)*5,cy+Math.sin(a)*5]],'#ffffff',1.2);}X.disc(cx,cy,.8,'#ff4040');
  fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);X.panel(118,20,84,12,K.c);for(let i=0;i<20;i++){c.fillStyle=i<ammo?'#7fe0ff':'#2a3050';c.fillRect(122+i*4,23,2,6);}};
 return g;}});

/* ---- MOON LANDER ---- */
A.add({id:'lander',name:'MOON LANDER',cat:'CLASSICS',how:'TILT. UP = ENGINE. LAND SOFT ON THE PAD.',make(){
 const g={over:null,score:0},fx=X.fx();let s,ter,pad,lvl=0,fuel=0,wait=0,msg='',fmax=1;
 const build=()=>{lvl++;ter=[];const pi=3+ri(10),pw=Math.max(2,4-(lvl>>1));let y=170+rnd(30);for(let i=0;i<=16;i++){if(i>pi&&i<=pi+pw){}else y=cl(y+rnd(60)-30,120,225);ter.push(y);}pad=[pi*20,(pi+pw)*20,ter[pi]];fuel=fmax=Math.max(250,520-lvl*40);s={x:30+rnd(60),y:30,vx:.6,vy:0,a:0};};build();
 const gy=x=>{const i=cl(Math.floor(x/20),0,15),f=(x-i*20)/20;return ter[i]+(ter[i+1]-ter[i])*f;};
 g.update=()=>{if(wait>0){if(--wait===0){if(msg==='LANDED!')build();else g.over='CRASHED';}return;}const k=A.in(0);s.a=cl(s.a+ax(k)*.04,-1.4,1.4);
  if((k.u||k.a)&&fuel>0){fuel--;s.vx+=Math.sin(s.a)*.045;s.vy-=Math.cos(s.a)*.045;if(A.t%6===0)S('blip');if(A.t%3===0&&s.y>gy(s.x)-40)fx.spark(s.x,gy(s.x),'#c8c0d8',2,1.5);}s.vy+=.016;s.x=cl(s.x+s.vx,4,W-4);s.y+=s.vy;
  if(s.y+6>=gy(s.x)){const ok=s.x>pad[0]+3&&s.x<pad[1]-3&&Math.abs(s.vy)<.75&&Math.abs(s.vx)<.5&&Math.abs(s.a)<.25;s.y=gy(s.x)-6;if(ok){msg='LANDED!';g.score+=100+fuel;S('win');fx.ring(s.x,s.y+6,K.g,30);fx.spark(s.x,s.y+6,'#d8d0e8',10,1.5);}else{msg='CRASH!';const near=Math.max(0,Math.round(30-Math.abs(s.x-(pad[0]+pad[1])/2)/4));if(near){g.score+=near;fx.pop(s.x,s.y-16,'NEAR PAD +'+near,K.c);}S('boom');fx.debris(s.x,s.y,'#e8c060',14,2.5);fx.spark(s.x,s.y,K.o,18,3);fx.flash(K.o,8);}wait=80;}};
 g.draw=()=>{X.cache('landersky',()=>{X.sky(['#000006','#060a1a','#0a1028']);X.stars(120,8,0,0,H,.9);X.disc(260,48,20,X.rg(252,40,2,260,48,20,['#bfe8ff','#3a7ad0','#0a2a6a']));X.ell(255,44,8,4,'rgba(80,200,90,.6)',.3);X.ell(266,54,6,3,'rgba(80,200,90,.5)',-.2);X.glow(260,48,34,'#4a9aff',.25);});
  const c=A.c,p=[[0,H]];ter.forEach((y,i)=>p.push([i*20,y]));p.push([W,H]);X.poly(p,X.lg(0,120,0,H,['#8a86a8','#4a4570','#1a1830']));c.save();c.beginPath();c.moveTo(p[0][0],p[0][1]);for(const q of p)c.lineTo(q[0],q[1]);c.closePath();if(c.clip)c.clip();for(let i=0;i<14;i++){const x=(i*61)%W;X.ell(x,gy(x)+12+(i*17)%40,6+(i%3)*3,2+(i%2),'rgba(0,0,0,.22)');X.ell(x-1,gy(x)+11+(i*17)%40,5+(i%3)*3,1,'rgba(255,255,255,.07)');}c.restore();
  c.strokeStyle='rgba(220,220,255,.55)';c.lineWidth=1;c.beginPath();ter.forEach((y,i)=>i?c.lineTo(i*20,y):c.moveTo(0,y));c.stroke();
  X.block(pad[0],pad[2]-1,pad[1]-pad[0],4,'#4a5a6a',1);for(const px of[pad[0]+2,pad[1]-3]){X.glow(px,pad[2]-2,6,A.t%40<20?'#3dff8b':'#ff4f6d',.7);X.disc(px,pad[2]-2,1.2,A.t%40<20?'#3dff8b':'#ff4f6d');}
  const cs=Math.cos(s.a),n=Math.sin(s.a),P=(x,y)=>[s.x+x*cs-y*n,s.y+x*n+y*cs];
  if(msg!=='CRASH!'||wait===0){const fire=(A.in(0).u||A.in(0).a)&&fuel>0&&!wait;if(fire){const fl=9+rnd(5);X.glow(...P(0,6),12,'#ff9040',.6);X.poly([P(-3,3),P(3,3),P(0,3+fl)],X.lg(...P(0,3),...P(0,3+fl),['#ffffff','#ffd060','rgba(255,80,0,0)']));}
   X.stroke([P(-4,1),P(-8,7)],'#c8c8d8',1.2);X.stroke([P(4,1),P(8,7)],'#c8c8d8',1.2);X.stroke([P(-10,7),P(-6,7)],'#c8c8d8',1.2);X.stroke([P(6,7),P(10,7)],'#c8c8d8',1.2);
   X.poly([P(-6,-1),P(6,-1),P(5,3),P(-5,3)],X.lg(...P(0,-1),...P(0,3),['#ffe08a','#c89020']));X.poly([P(-4,-8),P(4,-8),P(6,-1),P(-6,-1)],X.lg(...P(-6,-4),...P(6,-4),['#9aa0b8','#e8ecf8','#7a8098']));const wp=P(0,-4.5);X.disc(wp[0],wp[1],1.8,'#2a6ad0');X.disc(wp[0]-.5,wp[1]-.6,.6,'#d0f0ff');}
  fx.draw();const safe=Math.abs(s.vy)<.75&&Math.abs(s.vx)<.5;X.bar('SCORE '+g.score,'');X.panel(196,20,118,30,safe?K.g:K.r);T('FUEL',202,25,K.gr);X.meter(224,24,84,6,fuel/fmax,fuel<80?'#ff4f6d':'#ffcf3f');T('DROP '+s.vy.toFixed(1)+'  DRIFT '+Math.abs(s.vx).toFixed(1),255,38,safe?K.g:K.r,1,'c');T('LV '+lvl,W-6,6,K.w,1,'r');if(wait)X.ot(msg,160,70,msg==='LANDED!'?K.g:K.r,3,'c');};
 return g;}});

/* ---- FLAP BOT ---- */
A.add({id:'flap',name:'FLAP BOT',cat:'CLASSICS',how:'A FLAPS. THREAD THE GAPS.',make(){
 const g={over:null,score:0},fx=X.fx();let y=110,vy=0,pp=[],t=0,go=false,scroll=0,flapT=0;
 g.update=()=>{const h=A.hit(0);if(flapT)flapT--;if(h.a||h.u){vy=-2.9;go=true;S('jump');flapT=10;fx.spark(50,y+4,'#ffffff',3,1);}if(!go){y=110+Math.sin(A.t*.08)*4;scroll+=1.7;return;}scroll+=1.7;vy+=.17;y+=vy;if(++t%85===1)pp.push({x:W+10,g:50+rnd(110),ok:0});
  for(const p of pp){p.x-=1.7;if(!p.ok&&p.x<60){p.ok=1;g.score++;S('coin');fx.ring(57,y,K.y,14,12);}if(p.x<76&&p.x>36&&(y-6<p.g-2||y+6>p.g+54)){g.over='GAME OVER';S('boom');fx.flash('#ffffff',8);fx.debris(57,y,'#ffcf3f',10,2);}}pp=pp.filter(p=>p.x>-30);if(y>222||y<0){g.over='GAME OVER';S('boom');fx.flash('#ffffff',8);}};
 const pipe=(x,y0,y1,cap)=>{const c=A.c;c.fillStyle=X.lg(x,0,x+26,0,['#2a8a3a','#9aff8a','#4ad04a','#1a6a2a']);c.fillRect(x,y0,26,y1-y0);c.fillStyle=X.lg(x-2,0,x+28,0,['#2a8a3a','#bfffaa','#4ad04a','#1a5a22']);c.fillRect(x-2,cap,30,8);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x-2,cap+7,30,1);c.fillRect(x+25,y0,1,y1-y0);};
 g.draw=()=>{X.cache('flapsky',()=>{X.sky(['#3a8ad8','#7ac0f0','#c8ecff'],226);X.disc(250,60,18,'rgba(255,255,220,.8)');X.glow(250,60,50,'#fff0a0',.3);});const c=A.c;
  for(let i=0;i<6;i++){const x=((i*70-scroll*.15)%420+420)%420-60,yy=30+(i*37)%60;c.globalAlpha=.85;X.disc(x,yy,9,'#ffffff');X.disc(x+10,yy-4,11,'#ffffff');X.disc(x+22,yy,8,'#ffffff');X.ell(x+11,yy+5,18,4,'#e8f4ff');c.globalAlpha=1;}
  X.skyline(200,'#9ac8e0',scroll*.3,4,'rgba(255,255,255,.4)');X.hills(214,18,'#4aa04a',scroll*.6,.04,3);
  pp.forEach(p=>{pipe(p.x,0,p.g,p.g-8);pipe(p.x,p.g+52,226,p.g+52);});
  X.vg(0,226,W,14,['#e8c07a','#b8864a']);c.fillStyle='#7ac83a';c.fillRect(0,226,W,3);c.fillStyle='rgba(0,0,0,.12)';for(let x=-((scroll)%12);x<W;x+=12)c.fillRect(x,230,6,10);
  /* bot */c.save();c.translate(57,y);c.rotate(cl(vy*.12,-.5,1));X.shadow(0,0,0,0,0);X.rr(-8,-6,15,12,4,X.lg(0,-6,0,6,['#fff0a0','#ffcf3f','#c88a10']));X.rr(-1,-4,8,5,2,'#1a2a4a');X.disc(4,-1.5,1.6,go?'#3dff8b':'#4dabff');X.glow(4,-1.5,4,'#3dff8b',.5);X.poly([[7,1],[11,2.5],[7,4]],'#ff9838');c.fillStyle='#c88a10';c.fillRect(-3,-9,1.5,3);X.disc(-2.3,-9.5,1.4,K.r);
  const wa=flapT?Math.sin(flapT*.9)*5:Math.sin(A.t*.3)*2;X.poly([[-6,0],[-14,-2+wa],[-12,3+wa*.5],[-5,3]],X.lg(-14,0,-5,0,['#ffffff','#c8d0e0']));c.restore();
  X.ot(g.score,160,14,K.w,4,'c');if(!go&&A.t%50<35)X.ot('PRESS A TO FLAP',160,150,K.w,2,'c');fx.draw();};
 return g;}});

/* ---- DASH RUNNER ---- */
A.add({id:'runner',name:'DASH RUNNER',cat:'CLASSICS',how:'A JUMPS. DOWN DUCKS.',make(){
 const g={over:null,score:0},GY=190,fx=X.fx();let y=GY,vy=0,ob=[],d=0,nx=60,land=0;
 g.update=()=>{const k=A.in(0),sp=3+Math.min(4,d/3000);d+=sp;const s0=g.score;g.score=d/10|0;if(g.score%100===0&&g.score!==s0){S('coin');fx.pop(160,60,g.score+'!',K.y);}const duck=k.d&&y>=GY;if(land)land--;if((k.a||k.u)&&y>=GY){vy=-5.6;S('jump');fx.spark(40,GY,'#e8c090',5,1.5);}vy+=k.d?.6:.3;y+=vy;if(y>GY){if(vy>2){land=8;fx.spark(40,GY,'#e8c090',4,1.2);}y=GY;vy=0;}
  if(y>=GY&&A.t%6===0&&!duck)fx.spark(34,GY-1,'rgba(230,190,140,.8)',1,.8);
  nx-=sp;if(nx<=0){nx=70+rnd(110);const fl=d>1500&&Math.random()<.3;ob.push(fl?{x:W+10,y:GY-24,w:16,h:8,f:1}:{x:W+10,w:8+ri(3)*5,h:14+ri(2)*10,y:0});}
  for(const o of ob){o.x-=sp;const oy=o.f?o.y:GY-o.h,ph=duck?10:22;if(o.x<46&&o.x+o.w>34&&y-ph<oy+o.h&&y>oy){g.over='GAME OVER';S('boom');fx.flash(K.r,8);fx.debris(40,y-10,'#ffcf3f',10,2);}}ob=ob.filter(o=>o.x>-30);};
 g.draw=()=>{X.cache('runsky',()=>{X.sky(['#1a1440','#6a3a7a','#ff8a5a','#ffd08a'],GY);X.disc(230,130,30,X.rg(230,130,0,230,130,30,['#fff8d0','#ffd070','#ff9a40']));X.glow(230,130,80,'#ff9040',.3);X.stars(30,2,0,0,80,.6);});const c=A.c;
  X.hills(GY,60,'#8a4a6a',d*.1,.012,1);X.hills(GY,34,'#5a2a4a',d*.25,.025,4);
  for(let i=0;i<5;i++){const x=((i*90-d*.45)%450+450)%450-40;c.fillStyle='#3a1a30';c.fillRect(x,GY-26,4,26);c.fillRect(x-5,GY-18,5,3);c.fillRect(x-5,GY-22,3,6);c.fillRect(x+4,GY-14,5,3);c.fillRect(x+6,GY-19,3,7);}
  X.vg(0,GY,W,H-GY,['#d89060','#8a4a30','#4a2418']);c.fillStyle='#ffd8a0';c.fillRect(0,GY,W,1.5);c.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<16;i++){const x=((i*40-d)%640+640)%640-40;c.fillRect(x,GY+6+(i%3)*9,14+(i%4)*3,1.5);}
  ob.forEach(o=>{if(o.f){const ox=o.x,oy=o.y;X.shadow(ox+8,GY,7,1.5,.25);X.rr(ox,oy,o.w,o.h,3,X.lg(0,oy,0,oy+o.h,['#ff9ad0','#ff4f9a','#9a1a5a']));X.disc(ox+12,oy+4,1.6,'#ffffff');X.glow(ox+12,oy+4,5,'#ff4040',.5);const pr=A.t%4<2?6:3;c.fillStyle='rgba(255,255,255,.8)';c.fillRect(ox+4-pr,oy-2,pr*2,1);c.fillRect(ox+12-pr,oy-2,pr*2,1);c.fillStyle='#555';c.fillRect(ox+3.5,oy-2,1,2);c.fillRect(ox+11.5,oy-2,1,2);}
   else{const ox=o.x,oy=GY-o.h;X.shadow(ox+o.w/2,GY,o.w/2+2,1.5,.3);X.block(ox,oy,o.w,o.h,'#c8503a',2);c.fillStyle='rgba(0,0,0,.25)';for(let yy=oy+5;yy<GY-2;yy+=5)c.fillRect(ox+1,yy,o.w-2,1);X.poly([[ox,oy],[ox+o.w/2,oy-4],[ox+o.w,oy]],'#ffcf3f');}});
  const duck=A.in(0).d&&y>=GY;c.save();c.translate(40,y);if(duck)c.scale(1.25,.55);else if(land)c.scale(1+land*.03,1-land*.03);else if(y<GY)c.rotate(-.12);A.person(0,0,{s:.72,c:'#ffcf3f',pants:'#3a3a7a',cap:'#ff4f6d',st:y<GY?1.2:d*.12,d:1,arm1:y<GY?-2.6:undefined,arm2:y<GY?2.2:undefined,id:1});c.restore();
  fx.draw();X.ot(g.score,W-6,6,K.w,2,'r');X.ot('HI-SPEED '+(3+Math.min(4,d/3000)).toFixed(1),6,8,K.c,1);};
 return g;}});

/* ---- CAVE COPTER ---- */
A.add({id:'copter',name:'CAVE COPTER',cat:'CLASSICS',how:'HOLD A TO RISE. RELEASE TO SINK.',make(){
 const g={over:null,score:0},fx=X.fx();let y=120,vy=0,cave=[],d=0,mid=120,blocks=[],puffs=[];for(let i=0;i<82;i++)cave.push([30,210]);
 let go=false;g.update=()=>{const up=A.in(0).a||A.in(0).u;if(up)go=true;if(!go){y=120+Math.sin(A.t*.08)*5;if(A.t%3===0)puffs.push({x:46,y:y+1,t:30});puffs.forEach(p=>{p.x-=2;p.t--;});puffs=puffs.filter(p=>p.t>0);return;}d++;g.score=d/6|0;vy+=up?-.16:.14;vy=cl(vy,-3,3);y+=vy;if(d%3===0)puffs.push({x:46,y:y+1,t:30});puffs.forEach(p=>{p.x-=2;p.y-=.15;p.t--;});puffs=puffs.filter(p=>p.t>0);
  if(d%2===0){mid=cl(mid+rnd(14)-7,70,170);const gap=Math.max(62,150-d/60);cave.shift();cave.push([mid-gap/2,mid+gap/2]);blocks.forEach(b=>b.x-=4);if(d%90===0)blocks.push({x:W,y:mid-gap/2+rnd(gap-24)});blocks=blocks.filter(b=>b.x>-10);}
  const c=cave[15];if(y-5<c[0]||y+5>c[1]||blocks.some(b=>b.x<70&&b.x+8>50&&y+5>b.y&&y-5<b.y+24)){g.over='GAME OVER';S('boom');fx.flash(K.o,10);fx.debris(56,y,'#ffcf3f',14,2.5);fx.spark(56,y,K.o,16,3);}};
 g.draw=()=>{X.cache('copterbg',()=>{X.sky(['#0a1a14','#10281e','#081410']);X.glow(160,120,150,'#1a6a4a',.25);});const c=A.c,off=(d%2)*2;
  X.hills(110,40,'rgba(20,60,40,.6)',d*.6,.03,2);X.hills(240,60,'rgba(10,40,26,.7)',d*1.2,.025,5);
  const top=[[0,0]],bot=[[0,H]];cave.forEach((cv,i)=>{top.push([i*4-4-off,cv[0]]);bot.push([i*4-4-off,cv[1]]);});top.push([W,0]);bot.push([W,H]);
  X.poly(top,X.lg(0,0,0,120,['#0a2a1a','#2a6a3a','#5ab060']));X.poly(bot,X.lg(0,120,0,H,['#5ab060','#2a6a3a','#0a2a1a']));
  c.strokeStyle='rgba(180,255,170,.5)';c.lineWidth=1;c.beginPath();cave.forEach((cv,i)=>i?c.lineTo(i*4-4-off,cv[0]):c.moveTo(-4,cv[0]));c.stroke();c.beginPath();cave.forEach((cv,i)=>i?c.lineTo(i*4-4-off,cv[1]):c.moveTo(-4,cv[1]));c.stroke();
  for(let i=2;i<cave.length;i+=6){const x=i*4-4-off,cv=cave[i];X.poly([[x-2,cv[0]-1],[x+2,cv[0]-1],[x,cv[0]+4+(i*7)%5]],'#3a8a4a');}
  blocks.forEach(b=>{X.block(b.x,b.y,8,24,'#4a9a5a',2);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(b.x+1,b.y+8,6,1);c.fillRect(b.x+1,b.y+16,6,1);});
  puffs.forEach(p=>{c.globalAlpha=p.t/45;X.disc(p.x,p.y,2+(30-p.t)*.12,'#c8d8d0');});c.globalAlpha=1;
  c.save();c.translate(58,y);c.rotate(vy*.08);X.rr(-8,-4,17,9,4,X.lg(0,-4,0,5,['#fff0a0','#ffcf3f','#b07a10']));X.rr(2,-3,6,5,2,X.lg(0,-3,0,2,['#d8f8ff','#4aa0d0']));c.fillStyle='#b07a10';c.fillRect(-16,-1,9,2.4);c.fillRect(-17,-4,2,5);c.fillStyle='#555';c.fillRect(-1,-7,2,3);c.fillRect(-4,5,10,1.2);
  const bw=A.t%3;c.fillStyle='rgba(230,240,255,'+(bw?.5:.85)+')';c.fillRect(-10+bw*2,-8,21-bw*4,1.2);c.fillStyle='rgba(230,240,255,.5)';c.fillRect(-18,-4+bw,1,5-bw*2);c.restore();X.glow(66,y,8,'#ffe080',.2);
  if(!go&&A.t%50<35)X.ot('HOLD A TO FLY',160,150,K.w,2,'c');fx.draw();X.ot(g.score,W-6,6,K.w,2,'r');X.ot('DIST',W-6-String(g.score).length*8-30,10,K.gr,1);};
 return g;}});

/* ---- NEON TRAILS ---- */
A.add({id:'trails',name:'NEON TRAILS',cat:'VERSUS',vs:1,how:'STEER. NEVER HIT A TRAIL. FIRST TO 3.',make(){
 const g={over:null,score:0},GW=80,GH=55,fx=X.fx();let gr,b,sc=[0,0],wait=50,t=0;
 const reset=()=>{gr=new Uint8Array(GW*GH);b=[{x:15,y:27,dx:1,dy:0},{x:64,y:27,dx:-1,dy:0}];wait=50;};reset();
 const free=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&!gr[y*GW+x];const room=(x,y,dx,dy)=>{let n=0;while(n<30&&free(x+dx*(n+1),y+dy*(n+1)))n++;return n;};
 g.update=()=>{for(let i=0;i<2;i++){const q=b[i];if(i===1&&A.cpu){const f=room(q.x,q.y,q.dx,q.dy);if(f<2+ri(3)||Math.random()<.01*(2-A.ai)){const l=room(q.x,q.y,q.dy,-q.dx),r=room(q.x,q.y,-q.dy,q.dx);if(Math.max(l,r)>f||f<2){const tl=l>r;[q.dx,q.dy]=tl?[q.dy,-q.dx]:[-q.dy,q.dx];}}if(A.ai<.6&&Math.random()<.004)[q.dx,q.dy]=[q.dy,-q.dx];}
   else{const h=A.hit(i);if(h.l&&!q.dx){q.dx=-1;q.dy=0;}else if(h.r&&!q.dx){q.dx=1;q.dy=0;}else if(h.u&&!q.dy){q.dx=0;q.dy=-1;}else if(h.d&&!q.dy){q.dx=0;q.dy=1;}}}
  if(wait>0){wait--;return;}if(++t%3)return;const dead=[0,0];b.forEach((q,i)=>{gr[q.y*GW+q.x]=i+1;q.x+=q.dx;q.y+=q.dy;if(!free(q.x,q.y))dead[i]=1;});if(b[0].x===b[1].x&&b[0].y===b[1].y)dead[0]=dead[1]=1;
  if(dead[0]||dead[1]){S('boom');b.forEach((q,i)=>{if(dead[i]){fx.spark(q.x*4+2,20+q.y*4+2,i?'#ff4f9a':'#2fd6c3',22,3.5);fx.ring(q.x*4+2,20+q.y*4+2,'#ffffff',30);}});fx.flash('#ffffff',6);if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 g.draw=()=>{X.cache('trailsbg',()=>{X.sky(['#05020f','#0a0620','#05020f']);const c=A.c;c.strokeStyle='rgba(90,70,200,.22)';c.lineWidth=.6;c.beginPath();for(let x=0;x<=W;x+=16){c.moveTo(x,20);c.lineTo(x,H);}for(let y=20;y<=H;y+=16){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();X.vignette(.55);});const c=A.c;
  c.fillStyle='rgba(47,214,195,.18)';for(let i=0;i<GW*GH;i++)if(gr[i]===1)c.fillRect((i%GW)*4-1,19+((i/GW)|0)*4,6,6);c.fillStyle='rgba(255,79,154,.18)';for(let i=0;i<GW*GH;i++)if(gr[i]===2)c.fillRect((i%GW)*4-1,19+((i/GW)|0)*4,6,6);
  for(let i=0;i<GW*GH;i++)if(gr[i]){c.fillStyle=gr[i]===1?'#5ff0e0':'#ff7fc0';c.fillRect((i%GW)*4+.5,20.5+((i/GW)|0)*4,3,3);}
  b.forEach((q,i)=>{const x=q.x*4+2,y=20+q.y*4+2,col=i?'#ff4f9a':'#2fd6c3';X.glow(x,y,12,col,.7);X.disc(x,y,2.6,'#ffffff');X.stroke([[x,y],[x+q.dx*5,y+q.dy*5]],'#ffffff',1.5);});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot(wait>30?'GET READY':'GO!',160,110,K.y,2,'c');};
 return g;}});

/* ---- TANK DUEL ---- */
A.add({id:'tanks',name:'TANK DUEL',cat:'VERSUS',vs:1,how:'TURN + DRIVE. A FIRES. 5 HITS WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),WL=[[70,60,12,60],[238,120,12,60],[130,110,60,12],[150,40,12,40],[158,170,12,40]];let tk,sh=[],sc=[0,0],stuck=0,tracks=[];
 const blocked=(x,y,r)=>x<r||x>W-r||y<22+r||y>H-r||WL.some(w=>x>w[0]-r&&x<w[0]+w[2]+r&&y>w[1]-r&&y<w[1]+w[3]+r);
 const reset=()=>{tk=[{x:30,y:130,a:0,cd:0,tr:0,rec:0},{x:290,y:130,a:3.14,cd:0,tr:0,rec:0}];sh=[];};reset();
 g.update=()=>{if(A.cpu){const q=tk[1],o=tk[0],want=Math.atan2(o.y-q.y,o.x-q.x);let df=want-q.a;while(df>3.14)df-=6.28;while(df<-3.14)df+=6.28;const d=Math.hypot(o.x-q.x,o.y-q.y);
   if(stuck>0){stuck--;A.bot({d:stuck>20,l:stuck<=20,u:stuck<=20});}else{const fx_=q.x+Math.cos(q.a)*12,fy=q.y+Math.sin(q.a)*12;if(blocked(fx_,fy,7)&&Math.abs(df)<.5)stuck=45;A.bot({l:df<-.08,r:df>.08,u:d>70&&Math.abs(df)<.8,a:Math.abs(df)<.15&&Math.random()<.03+.06*A.ai});}}
  for(let i=0;i<2;i++){const q=tk[i],k=A.in(i);q.a+=ax(k)*.05;const m=-ay(k)*(i&&A.cpu?.7+.5*A.ai:1.3),nx=q.x+Math.cos(q.a)*m,ny=q.y+Math.sin(q.a)*m;if(!blocked(nx,q.y,7))q.x=nx;if(!blocked(q.x,ny,7))q.y=ny;if(m||ax(k)){q.tr+=.4;if(A.t%5===0)tracks.push({x:q.x,y:q.y,a:q.a,t:240});}if(q.cd>0)q.cd--;if(q.rec)q.rec--;
   if(A.hit(i).a&&q.cd===0){q.cd=45;q.rec=6;sh.push({x:q.x+Math.cos(q.a)*10,y:q.y+Math.sin(q.a)*10,vx:Math.cos(q.a)*3.2,vy:Math.sin(q.a)*3.2,b:1,o:i,t:0});S('shoot');fx.spark(q.x+Math.cos(q.a)*13,q.y+Math.sin(q.a)*13,'#ffe080',5,1.5);}}
  tracks.forEach(t_=>t_.t--);tracks=tracks.filter(t_=>t_.t>0);if(tracks.length>160)tracks.shift();
  for(const s of sh){s.t++;s.x+=s.vx;if(blocked(s.x,s.y,1)){if(s.b-->0){s.x-=s.vx;s.vx*=-1;fx.spark(s.x,s.y,'#ffe080',4,1.5);S('blip');}else s.dead=1;}s.y+=s.vy;if(!s.dead&&blocked(s.x,s.y,1)){if(s.b-->0){s.y-=s.vy;s.vy*=-1;fx.spark(s.x,s.y,'#ffe080',4,1.5);S('blip');}else s.dead=1;}
   if(s.dead)fx.ring(s.x,s.y,'#ffd080',8,10);
   for(let i=0;i<2;i++)if(!s.dead&&(i!==s.o||s.t>20)&&Math.hypot(s.x-tk[i].x,s.y-tk[i].y)<8){s.dead=1;sc[1-i]++;S('boom');fx.spark(tk[i].x,tk[i].y,K.o,20,3);fx.debris(tk[i].x,tk[i].y,i?'#ff4f9a':'#2fd6c3',10,2.5);fx.ring(tk[i].x,tk[i].y,'#ffd080',30);fx.flash('#ffffff',5);if(sc[1-i]>=5){g.over=A.win(1-i);return;}reset();return;}}sh=sh.filter(s=>!s.dead);};
 g.draw=()=>{X.cache('tanksbg',()=>{X.vg(0,0,W,H,['#5a5a32','#4a4a28']);const c=A.c;for(let i=0;i<140;i++){c.fillStyle=i%2?'rgba(0,0,0,.08)':'rgba(255,255,200,.06)';X.ell((i*97)%W,22+(i*53)%220,3+(i%5),1.5+(i%3),c.fillStyle);}
   WL.forEach(w=>{c.fillStyle='rgba(0,0,0,.35)';c.fillRect(w[0]+3,w[1]+3,w[2],w[3]);X.block(w[0],w[1],w[2],w[3],'#a89a6a',2);c.fillStyle='rgba(0,0,0,.18)';if(w[2]<w[3])for(let y=w[1]+6;y<w[1]+w[3];y+=6)c.fillRect(w[0]+1,y,w[2]-2,1);else for(let x=w[0]+8;x<w[0]+w[2];x+=8)c.fillRect(x,w[1]+1,1,w[3]-2);});X.vignette(.35);});const c=A.c;
  tracks.forEach(t_=>{c.globalAlpha=t_.t/400;c.save();c.translate(t_.x,t_.y);c.rotate(t_.a);c.fillStyle='#2a2a14';c.fillRect(-1,-6,2,2);c.fillRect(-1,4,2,2);c.restore();});c.globalAlpha=1;
  tk.forEach((q,i)=>{const col=i?'#ff4f9a':'#2fd6c3';c.save();c.translate(q.x,q.y);c.rotate(q.a);X.shadow(1,2,10,8,.35);for(const sy of[-6,4]){c.fillStyle='#2a2a2a';c.fillRect(-9,sy,18,3);c.fillStyle='#555';for(let x=-9+(q.tr%3);x<9;x+=3)c.fillRect(x,sy,1,3);}X.block(-8,-4.5,16,9,col,2);const rb=-q.rec*.5;c.fillStyle='#e8e8e8';c.fillRect(2+rb,-1,11,2);c.fillStyle='#888';c.fillRect(11+rb,-1.5,2,3);X.orb(rb*.4,0,4,X.hx(col)?col:col);c.restore();if(q.cd===0)A.ring(q.x,q.y,13,X.rgba(col,.35));});
  sh.forEach(s=>{X.glow(s.x,s.y,7,'#ffd060',.7);X.stroke([[s.x,s.y],[s.x-s.vx*2,s.y-s.vy*2]],'#fff0b0',1.6);});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- SUMO BUMP ---- */
A.add({id:'sumo',name:'SUMO BUMP',cat:'VERSUS',vs:1,how:'PUSH RIVAL OUT. A DASHES. FIRST TO 3.',make(){
 const g={over:null,score:0},RR=92,fx=X.fx();let p,sc=[0,0],wait=50,bump=0;const reset=()=>{p=[{x:115,y:128,vx:0,vy:0,cd:0},{x:205,y:128,vx:0,vy:0,cd:0}];wait=50;};reset();
 g.update=()=>{if(bump)bump--;if(wait>0){wait--;return;}if(A.cpu){const q=p[1],o=p[0],me=Math.hypot(q.x-160,q.y-128);let tx=o.x,ty=o.y;if(me>RR*.72){tx=160;ty=128;}const d=Math.hypot(o.x-q.x,o.y-q.y);A.bot({l:q.x>tx+3,r:q.x<tx-3,u:q.y>ty+3,d:q.y<ty-3,a:d<45&&me<RR*.7&&Math.random()<.05*A.ai});}
  for(let i=0;i<2;i++){const q=p[i],k=A.in(i),acc=i&&A.cpu?.09+.09*A.ai:.17;q.vx=(q.vx+ax(k)*acc)*.95;q.vy=(q.vy+ay(k)*acc)*.95;if(q.cd>0)q.cd--;if(A.hit(i).a&&q.cd===0&&(ax(k)||ay(k))){q.vx+=ax(k)*3;q.vy+=ay(k)*3;q.cd=70;S('jump');fx.spark(q.x,q.y,'#ffe0a0',6,1.5);}q.x+=q.vx;q.y+=q.vy;if(Math.hypot(q.vx,q.vy)>2&&A.t%3===0)fx.spark(q.x,q.y+8,'#e8c890',1,.8);}
  const dx=p[1].x-p[0].x,dy=p[1].y-p[0].y,d=Math.hypot(dx,dy);if(d<26&&d>0){const nx=dx/d,ny=dy/d,rv=(p[1].vx-p[0].vx)*nx+(p[1].vy-p[0].vy)*ny;if(rv<0){p[0].vx+=rv*nx*1.05;p[0].vy+=rv*ny*1.05;p[1].vx-=rv*nx*1.05;p[1].vy-=rv*ny*1.05;S('hit');if(rv<-1.5){bump=8;A.shake=Math.min(6,-rv*2);fx.ring(p[0].x+dx/2,p[0].y+dy/2,'#ffffff',20,12);fx.spark(p[0].x+dx/2,p[0].y+dy/2,'#fff0c0',8,2.5);}}const o=(26-d)/2;p[0].x-=nx*o;p[0].y-=ny*o;p[1].x+=nx*o;p[1].y+=ny*o;}
  const out=p.map(q=>Math.hypot(q.x-160,q.y-128)>RR+4);if(out[0]||out[1]){S('score');p.forEach((q,i)=>{if(out[i])fx.debris(q.x,q.y,'#e8c890',12,2);});if(out[0]!==out[1]){const w=out[0]?1:0;sc[w]++;fx.pop(160,60,A.nm(w)+' SCORES',w?K.p:K.c);if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 const bg=()=>{X.sky(['#2a1a10','#4a2a18','#2a1a10']);const c=A.c;for(let i=0;i<220;i++){const a=i*.0285,r=124+(i%3)*6;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#3ddc84','#e8e0d0','#c86dff'][i%6];X.disc(160+Math.cos(a)*r*1.25,128+Math.sin(a)*r*.95,2.4,c.fillStyle);X.disc(160+Math.cos(a)*r*1.25,126+Math.sin(a)*r*.95,1.3,'#e0b090');}
  X.disc(160,132,RR+12,'rgba(0,0,0,.4)');X.disc(160,128,RR+10,X.rg(150,110,10,160,128,RR+10,['#f8e0a0','#d8b070','#a07840']));X.disc(160,128,RR,X.rg(150,115,10,160,128,RR,['#e8b878','#d29a58','#b07a40']));
  c.strokeStyle='#f0e0b0';c.lineWidth=3;c.beginPath();c.arc(160,128,RR+2,0,6.2832);c.stroke();c.strokeStyle='rgba(120,80,30,.5)';c.lineWidth=1;for(let i=0;i<48;i++){const a=i*.1309;c.beginPath();c.moveTo(160+Math.cos(a)*(RR+.5),128+Math.sin(a)*(RR+.5));c.lineTo(160+Math.cos(a+.06)*(RR+3.5),128+Math.sin(a+.06)*(RR+3.5));c.stroke();}
  c.fillStyle='#f8f0e0';c.fillRect(146,120,3,16);c.fillRect(171,120,3,16);};
 const wrestler=(q,i)=>{const col=i?'#ff4f9a':'#2fd6c3',sk=i?'#e0a07c':'#f1c7a3',c=A.c,sp=Math.hypot(q.vx,q.vy),an=Math.atan2(q.vy,q.vx),st=Math.min(.25,sp*.06);c.save();c.translate(q.x,q.y);X.shadow(2,4,15,12,.35);c.rotate(an);c.scale(1+st,1-st);c.rotate(-an);
  const fa=Math.atan2((i?p[0]:p[1]).y-q.y,(i?p[0]:p[1]).x-q.x);for(const s of[-1,1])X.orb(Math.cos(fa+s*1.1)*11,Math.sin(fa+s*1.1)*11,4.2,sk,0);X.orb(0,0,13,sk);c.lineWidth=3.2;c.strokeStyle=col;c.beginPath();c.arc(0,0,11.5,0,6.2832);c.stroke();X.disc(Math.cos(fa)*3,Math.sin(fa)*3,6,X.lt(sk,.9));X.disc(Math.cos(fa)*1,Math.sin(fa)*1,4.3,'#1a1a1a');X.disc(Math.cos(fa)*-1.5,Math.sin(fa)*-1.5,2,'#2a2a2a');c.restore();if(q.cd===0)A.ring(q.x,q.y,16+Math.sin(A.t*.2),X.rgba('#ffcf3f',.7));};
 g.draw=()=>{X.cache('sumobg',bg);p.forEach(wrestler);fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(wait>0)X.ot(wait>20?'HAKKEYOI!':'PUSH!',160,40,K.y,3,'c');};
 return g;}});

/* ---- QUICK DRAW ---- */
A.add({id:'quickdraw',name:'QUICK DRAW',cat:'VERSUS',vs:1,how:'ON DRAW! PRESS A FIRST. EARLY = LOSE.',make(){
 const g={over:null,score:0},fx=X.fx();let sc=[0,0],t=0,go=0,ph='wait',res='',cpuAt=0,w=-1,tw=-40;const nr=()=>{t=0;go=120+ri(200);ph='wait';cpuAt=go+Math.round(34-A.ai*20+rnd(10));w=-1;};nr();
 g.update=()=>{t++;tw+=.6;if(tw>360)tw=-40;if(ph==='wait'||ph==='go'){if(ph==='wait'&&t>=go){ph='go';S('coin');fx.flash('#fff3d6',6);}if(A.cpu)A.bot({a:t>=cpuAt});const a=A.hit(0).a,b=A.hit(1).a;
   if(a||b){if(ph==='wait'){w=a?1:0;res=A.nm(1-w)+' FIRED EARLY!';}else{w=a&&b?(Math.random()<.5?0:1):a?0:1;res=A.nm(w)+' WINS IN '+((t-go)/60).toFixed(2)+'S';}sc[w]++;ph='res';t=0;S('shoot');A.shake=5;const sx=w?232:88;fx.spark(sx,136,'#fff0a0',10,3);fx.ring(sx,136,'#ffffff',14,10);fx.debris(w?70:250,140,'#a01010',6,1.5);}}
  else if(t>100){if(sc[w]>=3)g.over=A.win(w);else nr();}};
 const bg=()=>{X.sky(['#3a1a5a','#c04a4a','#ff9838','#ffcf6f'],170);X.disc(250,64,24,X.rg(250,64,0,250,64,24,['#fffbe8','#ffe08a','#ffb050']));X.glow(250,64,70,'#ffb050',.35);
  X.hills(170,50,'#7a3a3a',0,.015,2);const c=A.c;c.fillStyle='#5a2a2a';c.fillRect(20,100,40,70);c.fillRect(12,100,56,6);c.fillRect(270,110,34,60);c.fillRect(264,110,46,5);
  X.vg(0,170,W,70,['#d0904a','#a0622a','#6a3a18']);c.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<30;i++)c.fillRect((i*67)%W,176+(i*29)%60,8+(i%4)*3,1);
  const cac=(x,h)=>{c.fillStyle='#2a4a1a';c.fillRect(x,170-h,5,h);c.fillRect(x-6,170-h*.7,6,3);c.fillRect(x-6,170-h*.95,3,h*.28);c.fillRect(x+5,170-h*.55,6,3);c.fillRect(x+8,170-h*.8,3,h*.28);};cac(130,30);cac(196,22);};
 const cowboy=(i)=>{const x=i?250:70,d=i?-1:1,shot=ph==='res'&&w===i,down=ph==='res'&&w!==i,c=A.c,col=i?'#c84a6a':'#3a8ab0';
  if(down){c.save();c.translate(x,170);c.rotate(-d*Math.min(1.5,t*.1));A.person(0,0,{s:1.15,c:col,pants:'#4a3a2a',d,id:i?3:1});c.restore();return;}
  const draw=ph==='go'||shot;A.person(x,170,{s:1.15,c:col,pants:'#4a3a2a',d,id:i?3:1,arm2:d>0?(shot?-1.5708:draw?-.6:.15):undefined,arm1:d<0?(shot?1.5708:draw?.6:-.15):undefined});
  /* hat */X.ell(x,170-33.6*1.15,8.5,1.8,'#5a3a1a');X.rr(x-4.5,170-39*1.15,9,6,2,'#6a4a2a');c.fillStyle='#2a1a0a';c.fillRect(x-4.5,170-35*1.15,9,1.2);
  if(shot){c.fillStyle='#333';c.fillRect(d>0?x+5:x-17,170-21*1.15-1,12,2.5);if(t<8){X.glow(x+d*20,170-21*1.15,10,'#fff0a0',.9);}}};
 g.draw=()=>{X.cache('qdbg',bg);const c=A.c,tx=tw,ty=172+Math.abs(Math.sin(tw*.15))*-6;c.save();c.translate(tx,ty-5);c.rotate(tw*.1);c.strokeStyle='#8a6a3a';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.arc(0,0,3+i*.5,i,i+4);c.stroke();}c.restore();
  cowboy(0);cowboy(1);fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(ph==='wait')X.ot('WAIT FOR IT...',160,60,'#fff3d6',2,'c');if(ph==='go'){const s=A.t%10<5?5:6;X.ot('DRAW!',160,46,K.r,s,'c');}if(ph==='res')X.ot(res,160,60,'#fff3d6',2,'c');};
 return g;}});
})();
