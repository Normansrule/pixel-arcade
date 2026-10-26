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
 const bg=()=>{const c=A.c;X.sky(['#02031a','#0c0c34','#261646','#5a2244','#a8443a'],218);X.stars(120,5,0,0,165,.9);X.glow(70,70,100,'#4a3aff',.12);X.glow(200,40,80,'#b03aff',.08);
  X.glow(262,58,46,'#ffe8c0',.28);X.orb(262,58,13,'#f2e6cc',0);X.disc(267,62,13,'rgba(20,10,40,.18)');X.disc(257,54,2.6,'rgba(110,90,90,.28)');X.disc(266,63,3.2,'rgba(110,90,90,.22)');X.disc(264,50,1.6,'rgba(110,90,90,.3)');
  X.glow(250,205,150,'#ff6a3a',.24);X.glow(60,208,110,'#ff3a7a',.13);X.hills(196,36,'#3e1e4c',0,.022,7);X.skyline(228,'#22123a',30,3,'rgba(255,190,120,.35)');X.hills(214,40,'#1a1030',0,.03,2);X.hills(218,24,'#120a22',90,.05,5);
  X.vg(0,216,W,24,['#3e2c3c','#1c1220','#08050c']);c.fillStyle='rgba(255,150,110,.35)';c.fillRect(0,216,W,1);for(let i=0;i<70;i++){c.fillStyle=i%2?'rgba(0,0,0,.3)':'rgba(255,200,170,.08)';c.fillRect((i*53)%W,219+(i*7)%20,2+i%4,1);}X.vignette(.42);};
 g.draw=()=>{X.cache('shieldbg',bg);const c=A.c;
  const hi=A.gfx==='high';
  ci.forEach((v,i)=>{const x=cxs(i);if(v){X.glow(x,206,20,'#6ab0ff',.18);X.shadow(x,214.5,14,2,.5);const bl=[[-12,9,6],[-6,17,6],[0,12,5],[5,8,6],[-2,22,3]];bl.forEach((b,j)=>{const bx=x+b[0],by=214-b[1];X.vg(bx,by,b[2],b[1],['#86b4f4','#3a5ca4','#18265a']);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(bx,by,1,b[1]);c.fillStyle='rgba(0,0,20,.4)';c.fillRect(bx+b[2]-1,by,1,b[1]);c.fillStyle='rgba(200,230,255,.5)';c.fillRect(bx,by,b[2],1);
     for(let wy=by+2;wy<212;wy+=3)for(let wx=bx+1;wx<bx+b[2]-1;wx+=2)if((wy*3+wx*7+i)%5<3){c.fillStyle=(wy+wx+i)%7?'#ffe08a':'#9fe0ff';c.fillRect(wx,wy,1,1);}});
     c.fillStyle='#9ab0d8';c.fillRect(x-1,186,1,6);X.disc(x-.5,186,1,(A.t+i*13)%60<30?'#ff4040':'#501018');if((A.t+i*13)%60<30)X.glow(x-.5,186,4,'#ff4040',.5);}
    else{X.shadow(x,215,13,2,.5);c.fillStyle='#241a22';c.fillRect(x-11,211,22,5);X.poly([[x-9,211],[x-6,204],[x-3,211]],'#3a2c30');X.poly([[x+1,211],[x+4,206],[x+8,211]],'#30242a');c.fillStyle='#4a3838';c.fillRect(x-7,209,5,3);c.fillRect(x+1,210,6,2);
     const fl=.5+.5*Math.sin(A.t*.3+i*2);X.glow(x-4,208,8+fl*3,'#ff5a1a',.35+fl*.2);X.glow(x+4,209,5+fl*2,'#ffa030',.3);X.disc(x-4,209,1.3+fl*.6,'#ffd070');if(hi)for(let k=0;k<3;k++){const ey=(A.t*.4+k*5+i*3)%15;c.globalAlpha=1-ey/15;X.disc(x-5+k*4+Math.sin(A.t*.1+k)*2,207-ey,.8,'#ffb050');}c.globalAlpha=1;}});
  smoke.forEach(s=>{const a=s.t/60;c.globalAlpha=a*.7;X.disc(s.x,s.y,3+(60-s.t)*.09,'#3a3438');c.globalAlpha=a*.25;X.disc(s.x-1,s.y-1,2+(60-s.t)*.06,'#7a6a70');});c.globalAlpha=1;
  /* turret */const an=Math.atan2(cy-210,cx-160),bx=160+Math.cos(an)*15,by=207+Math.sin(an)*15;X.shadow(160,219,22,3,.55);X.stroke([[160,207],[bx,by]],'#1a1e2c',5);X.stroke([[160,207],[bx,by]],X.lg(160,200,bx,by,['#8a92b0','#e0e8ff']),2.6);X.disc(bx,by,1.6,ammo>0?'#7fe0ff':'#404860');if(ammo>0)X.glow(bx,by,5,'#7fe0ff',.35);
  X.disc(160,209,8,X.rg(157,205,1,160,209,8,['#f0f4ff','#8a92b0','#2e3448']));X.ell(160,215,19,6,X.lg(0,209,0,221,['#a0a6c0','#5a5e78','#22243a']));c.fillStyle='rgba(255,255,255,.35)';c.fillRect(146,211,28,1);for(let k=0;k<5;k++){X.disc(148+k*6,215,.9,k<Math.ceil(ammo/4)?'#7fe0ff':'#2a3050');}
  en.forEach(m=>{c.strokeStyle=X.lg(m.sx,14,m.x,m.y,['rgba(120,100,110,0)','rgba(160,130,140,.28)']);c.lineWidth=3;c.beginPath();c.moveTo(m.sx,14);c.lineTo(m.x,m.y);c.stroke();c.strokeStyle=X.lg(m.sx,14,m.x,m.y,['rgba(255,60,60,0)','rgba(255,110,90,.85)']);c.lineWidth=1.2;c.beginPath();c.moveTo(m.sx,14);c.lineTo(m.x,m.y);c.stroke();X.glow(m.x,m.y,9,'#ff4030',.7);X.glow(m.x,m.y,4,'#ffd080',.8);X.disc(m.x,m.y,1.6,'#fff0e0');});
  sh.forEach(s=>{X.stroke([[160,206],[s.x,s.y]],'rgba(80,200,255,.22)',2.4);X.stroke([[160,206],[s.x,s.y]],'rgba(160,230,255,.6)',.8);X.glow(s.x,s.y,7,'#7fe0ff',.9);X.disc(s.x,s.y,1.3,'#ffffff');const p=2+Math.sin(A.t*.4);X.stroke([[s.tx-p,s.ty-p],[s.tx+p,s.ty+p]],'#7fe0ff',.9);X.stroke([[s.tx+p,s.ty-p],[s.tx-p,s.ty+p]],'#7fe0ff',.9);});
  ex.forEach(e=>{X.glow(e.x,e.y,e.r*2.4,'#ff6020',.45);if(e.g>0){c.strokeStyle='rgba(255,220,160,'+(.5*(1-e.r/19)).toFixed(2)+')';c.lineWidth=1.5;c.beginPath();c.arc(e.x,e.y,e.r*1.5+2,0,6.283);c.stroke();}X.disc(e.x,e.y,e.r,X.rg(e.x,e.y,0,e.x,e.y,e.r,['#ffffff','#fff0a0','#ffa030',A.t%4<2?'rgba(255,60,30,.6)':'rgba(255,120,40,.6)']));});
  const rt=A.t*.05;A.ring(cx,cy,7,'rgba(255,255,255,.85)');for(let i=0;i<4;i++){const a=rt+i*1.5708;X.stroke([[cx+Math.cos(a)*9,cy+Math.sin(a)*9],[cx+Math.cos(a)*5,cy+Math.sin(a)*5]],'#ffffff',1.2);}X.disc(cx,cy,.8,'#ff4040');
  fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);X.panel(118,20,84,12,K.c);for(let i=0;i<20;i++){c.fillStyle=i<ammo?'#7fe0ff':'#2a3050';c.fillRect(122+i*4,23,2,6);}};
 return g;}});

/* ---- MOON LANDER ---- */
A.add({id:'lander',name:'MOON LANDER',cat:'CLASSICS',tags:'lunar lander moon landing apollo space classic',how:'LEFT/RIGHT TILT, UP OR A FIRES. LAND SOFTLY ON A PAD. SMALL PADS PAY MORE.',make(){
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off';let s,ter,pads,craters,rocks,lvl=0,fuel=0,fmax=1,wait=0,msg='',lives=3,dust=[],puffs=[],wreck=null,flag=null,lastPad=null,grav=.016,touch=0;
 const cam={x:160,y:120,z:1};const SEG=4,NS=80;
 // a new stretch of moon: rough ground from a random walk, three flattened pads (x2 wide, x3, x5 tiny), craters and boulders
 const build=()=>{lvl++;ter=[];let y=168+rnd(40),v=0;const rough=5+Math.min(lvl,6);for(let i=0;i<=NS;i++){v=v*.6+(rnd(2)-1)*rough;y=cl(y+v,112,226);ter.push(y);}
  const W_=[40,26,16],Mul=[2,3,5],thirds=[0,1,2].sort(()=>Math.random()-.5);pads=[];
  for(let k=0;k<3;k++){const w=Math.max(12,W_[k]-Math.min(lvl-1,4)*2),n=Math.ceil(w/SEG),lo_=thirds[k]*26+2,i0=lo_+ri(Math.max(1,24-n)),py=cl(ter[i0],130,224);for(let i=i0;i<=i0+n&&i<=NS;i++)ter[i]=py;pads.push({x0:i0*SEG,x1:(i0+n)*SEG,y:py,m:Mul[k]});}
  craters=[];for(let i=0;i<9;i++){const x=8+rnd(304);if(pads.some(p=>x>p.x0-14&&x<p.x1+14))continue;craters.push({x,r:4+rnd(9),d:3+rnd(10)});}
  rocks=[];for(let i=0;i<14;i++){const x=rnd(320);if(pads.some(p=>x>p.x0-4&&x<p.x1+4))continue;rocks.push({x,r:1+rnd(2.4)});}
  fmax=Math.max(320,620-lvl*30);fuel=Math.min(fmax,(lvl===1?fmax:fuel+fmax*.45));grav=.016*(1+Math.min(lvl-1,6)*.05);
  s={x:30+rnd(260),y:34,vx:(Math.random()<.5?-1:1)*(.3+rnd(.5)),vy:0,a:0,eng:0,rcs:0};wreck=null;flag=null;dust=[];puffs=[];cam.z=1;cam.x=160;cam.y=120;};
 build();
 const gy=x=>{const i=cl(Math.floor(x/SEG),0,NS-1),f=cl((x-i*SEG)/SEG,0,1);return ter[i]+(ter[i+1]-ter[i])*f;};
 const foot=sx=>{const cs=Math.cos(s.a),n=Math.sin(s.a);return[s.x+sx*cs-7*n,s.y+sx*n+7*cs];};
 const crash=why=>{msg=why;lives--;S('boom');A.shake=9;fx.flash('#ffd8a0',10);wreck={x:s.x,y:gy(s.x)-3,a:s.a,t:0};
  fx.debris(s.x,s.y,'#e8c060',16,2.8);fx.debris(s.x,s.y,'#b8bcc8',10,2.4);fx.spark(s.x,s.y,'#ff9838',22,3.4);fx.ring(s.x,s.y,'#ffcf7a',36,20);
  const near=Math.min(...pads.map(p=>Math.abs(s.x-(p.x0+p.x1)/2)));const b=Math.max(0,Math.round(30-near/4));if(b){g.score+=b;fx.pop(s.x,Math.max(30,s.y-20),'NEAR PAD +'+b,K.c);}wait=110;};
 g.update=()=>{for(const d of dust){d.x+=d.vx;d.y+=d.vy;d.vy+=.012;d.vx*=.97;d.t--;}dust=dust.filter(d=>d.t>0);for(const p of puffs){p.x+=p.vx;p.y+=p.vy;p.t--;}puffs=puffs.filter(p=>p.t>0);
  if(flag&&flag.t<60)flag.t++;if(wreck)wreck.t++;
  // the camera drops in close for the touchdown
  const alt=gy(s.x)-(s.y+7),zt=!wait&&alt<58?2:wait&&msg==='LANDED!'?2:1;cam.z+=(zt-cam.z)*.05;const f=cam.z-1,tx=cl(s.x,160/cam.z,320-160/cam.z),ty=cl(s.y+16,120/cam.z,240-120/cam.z);cam.x=160+(tx-160)*f;cam.y=120+(ty-120)*f;
  if(wait>0){if(--wait===0){if(msg==='LANDED!')build();else if(lives<=0)g.over='OUT OF LANDERS';else{const f0=fuel;lvl--;build();fuel=Math.max(f0,140);}}return;}
  const k=A.in(0),turn=ax(k);s.a=cl(s.a+turn*.04,-1.45,1.45);s.rcs=turn;if(turn&&fuel>0){fuel=Math.max(0,fuel-.15);if(lo()&&A.t%3===0){const side=turn>0?-1:1,cs=Math.cos(s.a),n=Math.sin(s.a);puffs.push({x:s.x+side*7*cs+6*n,y:s.y+side*7*n-6*cs,vx:side*cs*.8,vy:side*n*.8-.1,t:14});}}
  s.eng=(k.u||k.a)&&fuel>0?Math.min(1,s.eng+.2):Math.max(0,s.eng-.25);
  if(s.eng>0&&(k.u||k.a)&&fuel>0){fuel=Math.max(0,fuel-1);s.vx+=Math.sin(s.a)*.045;s.vy-=Math.cos(s.a)*.045;if(A.t%6===0)S('blip');
   // exhaust blasting the dust off the surface
   const ex=s.x-Math.sin(s.a)*10,hit=gy(ex),dd=hit-s.y;if(dd<70&&lo()){const n=Math.ceil((70-dd)/22);for(let i=0;i<n;i++){const dir=Math.random()<.5?-1:1;dust.push({x:ex+dir*rnd(4),y:hit-1,vx:dir*(1+rnd(2.2))*(1-dd/80),vy:-rnd(.5),t:24+ri(20),r:1+rnd(2)});}}}
  s.vy+=grav;s.x+=s.vx;s.y+=s.vy;if(s.x<6){s.x=6;s.vx=Math.abs(s.vx)*.3;}if(s.x>314){s.x=314;s.vx=-Math.abs(s.vx)*.3;}if(s.y<10){s.y=10;s.vy=Math.max(0,s.vy);}
  if(fuel<=0&&A.t%40===0&&!wait)fx.pop(160,64,'OUT OF FUEL','#ff6a5a');
  const fl=foot(-8),fr=foot(8),cl_=fl[1]>=gy(fl[0]),cr=fr[1]>=gy(fr[0]),body=s.y+2>=gy(s.x);
  if(cl_||cr||body){const pad=pads.find(p=>fl[0]>=p.x0-1&&fr[0]<=p.x1+1),ok=pad&&!body&&Math.abs(s.vy)<.75&&Math.abs(s.vx)<.5&&Math.abs(s.a)<.24;
   if(ok){s.y=pad.y-7;msg='LANDED!';const soft=Math.abs(s.vy)<.3,base=50+Math.round(fuel/4),pts=pad.m*base*(soft?1.5:1)|0;g.score+=pts;fuel=Math.min(fmax,fuel+150);lastPad=pad;
    S('win');fx.ring(s.x,s.y+7,K.g,34,22);fx.pop(s.x,Math.max(34,s.y-24),(soft?'PERFECT ':'')+'X'+pad.m+' +'+pts,soft?K.y:K.g);flag={x:s.x+(s.x<pad.x1-14?12:-12),y:pad.y,t:0};
    for(let i=0;i<14;i++){const dir=i%2?1:-1;dust.push({x:s.x+dir*rnd(6),y:pad.y-1,vx:dir*(.5+rnd(1.4)),vy:-rnd(.3),t:30+ri(20),r:1+rnd(2)});}wait=150;s.vx=s.vy=0;s.a=0;s.eng=0;}
   else crash(body||!pad?'CRASH!':'TOO HARD!');}};
 /* ---- drawing ---- */
 const sky=()=>X.cache('lander2sky',()=>{const c=A.c;X.sky(['#000004','#03061a','#0a1030']);
  c.save();c.translate(160,120);c.rotate(-.5);c.fillStyle=X.lg(0,-40,0,40,['rgba(120,130,200,0)','rgba(150,150,220,.12)','rgba(120,130,200,0)']);c.fillRect(-260,-40,520,80);c.restore();
  X.stars(170,8,0,0,H,.95);X.stars(60,21,0,0,H,.6);
  const ex=128,ey=56,er=18;X.glow(ex,ey,40,'#4a9aff',.3);X.disc(ex,ey,er,X.rg(ex-6,ey-7,2,ex,ey,er,['#cfeeff','#3a86d8','#0a2a6a']));
  for(const[x,y,rx,ry,r]of[[-8,-6,7,3,.3],[5,4,8,3,-.2],[-2,10,6,2,.1],[9,-10,4,2,.6]])X.ell(ex+x,ey+y,rx,ry,'rgba(70,170,80,.55)',r);
  for(const[x,y,rx,ry]of[[-4,-12,9,1.4],[6,-2,10,1.2],[-10,4,6,1.2],[2,14,8,1.2]])X.ell(ex+x,ey+y,rx,ry,'rgba(255,255,255,.5)',.2);
  c.fillStyle='rgba(0,0,12,.55)';c.beginPath();c.arc(ex,ey,er,-1.2,1.9);c.closePath();c.fill();X.glow(ex-8,ey-8,10,'#ffffff',.18);
  X.glow(24,20,70,'#fff4d8',.08);X.glow(24,20,14,'#ffffff',.35);
  c.fillStyle='#2a2c40';c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=8)c.lineTo(x,148-28*Math.abs(Math.sin(x*.021+1))-10*Math.sin(x*.07));c.lineTo(W,H);c.closePath();c.fill();
  c.fillStyle='#3a3c54';c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=6)c.lineTo(x,162-18*Math.abs(Math.sin(x*.033+2))-6*Math.sin(x*.11));c.lineTo(W,H);c.closePath();c.fill();});
 const lander=(x,y,a,o)=>{const c=A.c;o=o||{};c.save();c.translate(x,y);c.rotate(a);
  // legs and footpads
  for(const s_ of[-1,1]){X.stroke([[s_*4,1],[s_*8,7]],'#c8ccd8',1.3);X.stroke([[s_*6,-1],[s_*8,7]],'#8a8ea0',.9);X.rr(s_*8-2,6.4,4,1.4,.6,'#d8dce8');}
  X.poly([[-2.6,3],[2.6,3],[3.6,6],[-3.6,6]],X.lg(-3,0,3,0,['#4a4e5a','#a8acb8','#4a4e5a']));
  // descent stage in gold foil
  X.poly([[-7,-1],[7,-1],[6,3.4],[-6,3.4]],X.lg(-7,0,7,0,['#a8701a','#ffd870','#e8b040','#9a6010']));c.strokeStyle='rgba(120,70,10,.6)';c.lineWidth=.5;c.beginPath();c.moveTo(-3,-1);c.lineTo(-2.4,3.4);c.moveTo(2.6,-1);c.lineTo(2,3.4);c.stroke();
  // ascent stage, window, antenna, thruster quads
  X.poly([[-5,-8],[4,-8],[6,-4],[6,-1],[-6,-1],[-6,-4]],X.lg(-6,-8,6,-1,['#e8ecf8','#a8acc0','#6a6e84']));c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-6,-2.2,12,1.2);
  X.poly([[-3.4,-6.8],[-.6,-6.8],[-.6,-4],[-3.8,-4]],'#1a2a4a');c.fillStyle='rgba(160,220,255,.6)';c.fillRect(-3,-6.4,1,1.2);
  X.stroke([[2.6,-8],[4.4,-12]],'#c8ccd8',.7);X.disc(4.6,-12.4,1.3,'#e8ecf8');c.fillStyle='#5a5e70';c.fillRect(-7.4,-5.2,1.4,2.2);c.fillRect(6,-5.2,1.4,2.2);
  if(o.eng>0){const fl=(7+rnd(5))*o.eng;X.glow(0,8,14*o.eng,'#ff9040',.6);X.poly([[-2.4,6],[2.4,6],[0,6+fl*1.25]],X.lg(0,6,0,6+fl*1.25,['rgba(255,255,255,.95)','rgba(255,200,90,.85)','rgba(255,90,0,0)']));X.poly([[-1.1,6],[1.1,6],[0,6+fl*.7]],X.lg(0,6,0,6+fl*.7,['#ffffff','rgba(150,200,255,.2)']));}
  c.restore();};
 const terrain=()=>{const c=A.c;const pts=[[0,H+40]];for(let i=0;i<=NS;i++)pts.push([i*SEG,ter[i]]);pts.push([W,H+40]);X.poly(pts,X.lg(0,110,0,H,['#7a7890','#4a4862','#24223a']));
  // every slope lit by the low sun on the left
  for(let i=0;i<NS;i++){const x0=i*SEG,y0=ter[i],y1=ter[i+1],sl=(y1-y0)/SEG,b=cl(.5-sl*.9,0,1);c.fillStyle=b>.5?'rgba(255,250,235,'+((b-.5)*.5).toFixed(2)+')':'rgba(0,0,20,'+((.5-b)*.7).toFixed(2)+')';c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+SEG,y1);c.lineTo(x0+SEG,y1+9);c.lineTo(x0,y0+9);c.closePath();c.fill();}
  for(const k of craters){const y=gy(k.x)+k.d;X.ell(k.x,y,k.r,k.r*.32,'rgba(0,0,10,.4)');X.ell(k.x+k.r*.2,y+.3,k.r*.75,k.r*.2,'rgba(0,0,10,.35)');c.strokeStyle='rgba(255,250,235,.25)';c.lineWidth=.7;c.beginPath();if(c.ellipse)c.ellipse(k.x,y,k.r,k.r*.32,0,.2,Math.PI*.95);c.stroke();}
  for(const r of rocks){const y=gy(r.x);X.disc(r.x,y-r.r*.5,r.r,'#8a889c');X.disc(r.x-r.r*.3,y-r.r*.8,r.r*.45,'#b8b6c8');X.ell(r.x+r.r,y,r.r,.6,'rgba(0,0,0,.4)');}
  c.strokeStyle='rgba(235,235,255,.55)';c.lineWidth=.8;c.beginPath();ter.forEach((y,i)=>i?c.lineTo(i*SEG,y):c.moveTo(0,y));c.stroke();
  for(const p of pads){X.block(p.x0,p.y-1,p.x1-p.x0,3.5,'#5a6a7a',1);c.fillStyle='rgba(255,207,63,.8)';for(let x=p.x0+2;x<p.x1-2;x+=4)c.fillRect(x,p.y-.6,2,.8);
   for(const px of[p.x0+1.5,p.x1-1.5]){const on=(A.t+p.m*7)%40<20;X.stroke([[px,p.y-1],[px,p.y-5]],'#8a8ea0',.7);X.disc(px,p.y-5.5,1.1,on?'#3dff8b':'#ff4f6d');if(lo())X.glow(px,p.y-5.5,5,on?'#3dff8b':'#ff4f6d',.7);}}};
 g.draw=()=>{const c=A.c;sky();
  c.save();c.translate(160,120);c.scale(cam.z,cam.z);c.translate(-cam.x,-cam.y);
  terrain();
  for(const d of dust){c.globalAlpha=Math.min(1,d.t/20)*.7;X.disc(d.x,d.y,d.r,'#b8b4c8');}c.globalAlpha=1;
  for(const p of puffs){c.globalAlpha=p.t/14*.8;X.disc(p.x,p.y,1+(14-p.t)*.15,'#ffffff');}c.globalAlpha=1;
  if(flag){const h=Math.min(1,flag.t/20)*14;X.stroke([[flag.x,flag.y],[flag.x,flag.y-h]],'#d8dce8',.8);if(flag.t>20){const w=Math.min(1,(flag.t-20)/12)*8;X.poly([[flag.x,flag.y-h],[flag.x+w,flag.y-h+1+Math.sin(A.t*.1)*.4],[flag.x+w,flag.y-h+5],[flag.x,flag.y-h+4]],'#ff4f6d');c.fillStyle='#ffffff';c.fillRect(flag.x+1,flag.y-h+2,w*.8,.8);}
   const ax_=flag.x+(flag.x<s.x?-5:5),hop=Math.abs(Math.sin(flag.t*.15))*2;X.disc(ax_,flag.y-6-hop,2,'#f4f4f8');X.disc(ax_+.4,flag.y-6.2-hop,1,'#ffcf3f');c.fillStyle='#e8e8f0';c.fillRect(ax_-1.5,flag.y-4.4-hop,3,4);}
  if(wreck){const f=wreck.t;c.globalAlpha=Math.max(0,1-f/90);X.glow(wreck.x,wreck.y,30-f*.2,'#ff8a2a',.6);c.globalAlpha=1;c.save();c.translate(wreck.x,wreck.y);c.rotate(wreck.a+.6);X.poly([[-6,-2],[6,-1],[5,3],[-5,3]],'#4a3a20');X.stroke([[-6,0],[-11,4]],'#6a6e7a',1);c.restore();if(lo()&&f%4===0)fx.spark(wreck.x+rnd(6)-3,wreck.y-2,'rgba(120,120,130,.6)',1,.5);}
  else lander(s.x,s.y,s.a,{eng:s.eng});
  fx.draw();
  c.restore();
  // pad multipliers float above each pad
  for(const p of pads){const sx=((p.x0+p.x1)/2-cam.x)*cam.z+160,sy=(p.y-cam.y)*cam.z+120+5;if(sx>14&&sx<W-14&&sy>24&&sy<H-8)X.ot('X'+p.m,sx,sy,p.m===5?K.y:p.m===3?K.c:K.w,1,'c');}
  const alt=Math.max(0,Math.round(gy(s.x)-(s.y+7))),safeV=Math.abs(s.vy)<.75,safeH=Math.abs(s.vx)<.5,safeA=Math.abs(s.a)<.24;
  X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++){const x=W-60-i*12;X.poly([[x-3,14],[x+3,14],[x+4,10],[x-4,10]],'#e8b040');X.poly([[x-2.5,10],[x+2.5,10],[x+1.5,6.5],[x-1.5,6.5]],'#d8dce8');}
  const hide=s.x>196&&s.y<74;if(hide)c.globalAlpha=.3;X.panel(214,20,102,40,safeV&&safeH&&safeA?K.g:K.r);T('FUEL',219,25,K.gr);X.meter(238,24,74,6,fuel/fmax,fuel<100?'#ff4f6d':'#ffcf3f');
  T('ALT '+alt,219,34,K.w);T('ANG',272,34,safeA?K.g:K.r);X.stroke([[300,36],[300+Math.sin(s.a)*7,36-Math.cos(s.a)*7]],safeA?'#3dff8b':'#ff4f6d',1.4);
  T('V '+s.vy.toFixed(1),219,44,safeV?K.g:K.r);T('H '+Math.abs(s.vx).toFixed(1),262,44,safeH?K.g:K.r);
  T('LANDERS '+lives,219,53,K.gr);c.globalAlpha=1;
  if(wait)X.ot(msg,160,72,msg==='LANDED!'?K.g:K.r,3,'c');};
 g._s=()=>s;g._pads=()=>pads;
 return g;}});

/* ---- FLAP BOT ---- */
A.add({id:'flap',name:'FLAP BOT',cat:'CLASSICS',how:'A FLAPS. THREAD THE GAPS.',make(){
 const g={over:null,score:0},fx=X.fx();let y=110,vy=0,pp=[],t=0,go=false,scroll=0,flapT=0,puff=[],sp=0;
 g.update=()=>{const h=A.hit(0);if(flapT)flapT--;if(h.a||h.u){vy=-2.9;go=true;S('jump');flapT=10;fx.spark(48,y+4,'#ffffff',4,1.2);for(let i=0;i<3;i++)puff.push({x:46,y:y+3,vx:-.6-Math.random(),vy:.5+Math.random()*.8,t:20});}puff.forEach(q=>{q.x+=q.vx-1.2;q.y+=q.vy;q.t--;});puff=puff.filter(q=>q.t>0);if(sp)sp--;if(!go){y=110+Math.sin(A.t*.08)*4;scroll+=1.7;return;}scroll+=1.7;vy+=.17;y+=vy;if(++t%85===1)pp.push({x:W+10,g:50+rnd(110),ok:0});
  for(const p of pp){p.x-=1.7;if(!p.ok&&p.x<60){p.ok=1;g.score++;sp=12;S('coin');A.burst(57,y-6,K.y,5);fx.ring(57,y,K.y,18,14);fx.spark(p.x+13,p.g+26,'#ffffff',8,2);if(g.score%10===0){fx.flash('#fff6c0',5);fx.ring(160,22,'#ffcf3f',30,18);}}if(p.x<76&&p.x>36&&(y-6<p.g-2||y+6>p.g+54)){g.over='GAME OVER';S('boom');A.shake=7;fx.flash('#ffffff',8);fx.debris(57,y,'#ffcf3f',14,2.6);fx.spark(57,y,'#ff9838',14,3);}}pp=pp.filter(p=>p.x>-30);if(!g.over&&(y>222||y<0)){g.over='GAME OVER';S('boom');A.shake=7;fx.flash('#ffffff',8);fx.debris(57,Math.min(y,222),'#ffcf3f',14,2.6);}};
 const pipe=(x,y0,y1,cap)=>{const c=A.c;c.fillStyle=X.lg(x,0,x+26,0,['#2a8a3a','#9aff8a','#4ad04a','#1a6a2a']);c.fillRect(x,y0,26,y1-y0);c.fillStyle=X.lg(x-2,0,x+28,0,['#2a8a3a','#bfffaa','#4ad04a','#1a5a22']);c.fillRect(x-2,cap,30,8);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x-2,cap+7,30,1);c.fillRect(x+25,y0,1,y1-y0);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+5,y0,2,y1-y0);c.fillRect(x+1,cap+1,26,1.2);c.fillStyle='rgba(0,60,10,.5)';for(const bx of[x+2,x+24])c.fillRect(bx,cap+3,1.5,1.5);};
 g.draw=()=>{X.cache('flapsky',()=>{X.sky(['#3a8ad8','#7ac0f0','#c8ecff'],226);X.disc(250,60,18,'rgba(255,255,220,.8)');X.glow(250,60,50,'#fff0a0',.3);X.hills(196,40,'rgba(120,170,210,.55)',0,.012,6);});const c=A.c;
  for(let i=0;i<6;i++){const x=((i*70-scroll*.15)%420+420)%420-60,yy=30+(i*37)%60;c.globalAlpha=.85;X.disc(x,yy,9,'#ffffff');X.disc(x+10,yy-4,11,'#ffffff');X.disc(x+22,yy,8,'#ffffff');X.ell(x+11,yy+5,18,4,'#e8f4ff');c.globalAlpha=1;}
  X.skyline(200,'#9ac8e0',scroll*.3,4,'rgba(255,255,255,.4)');X.hills(214,18,'#4aa04a',scroll*.6,.04,3);
  pp.forEach(p=>{pipe(p.x,0,p.g,p.g-8);pipe(p.x,p.g+52,226,p.g+52);});
  X.vg(0,226,W,14,['#e8c07a','#b8864a']);c.fillStyle='#7ac83a';c.fillRect(0,226,W,3);c.fillStyle='rgba(0,0,0,.12)';for(let x=-((scroll)%12);x<W;x+=12)c.fillRect(x,230,6,10);
  puff.forEach(q=>{c.globalAlpha=q.t/20*.7;X.disc(q.x,q.y,2+(20-q.t)*.12,'#ffffff');});c.globalAlpha=1;X.glow(48,y+1,10,'#ffb040',.35+(flapT?.3:0));
  /* bot */c.save();c.translate(57,y);c.scale(1.35,1.35);c.rotate(cl(vy*.12,-.5,1));X.shadow(0,0,0,0,0);X.rr(-8,-6,15,12,4,X.lg(0,-6,0,6,['#fff0a0','#ffcf3f','#c88a10']));X.rr(-1,-4,8,5,2,'#1a2a4a');X.disc(4,-1.5,1.6,go?'#3dff8b':'#4dabff');X.glow(4,-1.5,4,'#3dff8b',.5);X.poly([[7,1],[11,2.5],[7,4]],'#ff9838');c.fillStyle='#c88a10';c.fillRect(-3,-9,1.5,3);X.disc(-2.3,-9.5,1.4,K.r);
  const wa=flapT?Math.sin(flapT*.9)*5:Math.sin(A.t*.3)*2;X.poly([[-6,0],[-14,-2+wa],[-12,3+wa*.5],[-5,3]],X.lg(-14,0,-5,0,['#ffffff','#c8d0e0']));c.restore();
  X.ot(g.score,160,14-(sp>6?sp-6:0)*.6,sp?'#ffcf3f':K.w,4,'c');if(!go&&A.t%50<35)X.ot('PRESS A TO FLAP',160,150,K.w,2,'c');fx.draw();};
 return g;}});

/* ---- DASH RUNNER ---- */
A.add({id:'runner',name:'DASH RUNNER',cat:'CLASSICS',how:'A JUMPS. DOWN DUCKS.',make(){
 const g={over:null,score:0},GY=190,fx=X.fx();let y=GY,vy=0,ob=[],d=0,nx=60,land=0;
 g.update=()=>{const k=A.in(0),sp=3+Math.min(4,d/3000);d+=sp;const s0=g.score;g.score=d/10|0;if(g.score%100===0&&g.score!==s0){S('coin');fx.pop(160,60,g.score+'!',K.y);fx.ring(W-24,14,'#ffcf3f',22,14);fx.spark(W-24,14,'#ffcf3f',10,2);}const duck=k.d&&y>=GY;if(land)land--;if((k.a||k.u)&&y>=GY){vy=-5.6;S('jump');fx.spark(40,GY,'#e8c090',5,1.5);}vy+=k.d?.6:.3;y+=vy;if(y>GY){if(vy>2){land=8;fx.spark(40,GY,'#e8c090',4,1.2);}y=GY;vy=0;}
  if(y>=GY&&A.t%6===0&&!duck)fx.spark(34,GY-1,'rgba(230,190,140,.8)',1,.8);
  nx-=sp;if(nx<=0){nx=70+rnd(110);const fl=d>1500&&Math.random()<.3;ob.push(fl?{x:W+10,y:GY-24,w:16,h:8,f:1}:{x:W+10,w:8+ri(3)*5,h:14+ri(2)*10,y:0});}
  for(const o of ob){o.x-=sp;const oy=o.f?o.y:GY-o.h,ph=duck?10:22;if(o.x<46&&o.x+o.w>34&&y-ph<oy+o.h&&y>oy){g.over='GAME OVER';S('boom');A.shake=9;fx.flash(K.r,8);fx.debris(40,y-10,'#ffcf3f',10,2);fx.debris(o.x+o.w/2,oy+o.h/2,o.f?'#ff4f9a':'#c07a34',12,2.6);fx.ring(40,y-10,'#ffffff',30,14);}}ob=ob.filter(o=>o.x>-30);};
 g.draw=()=>{X.cache('runsky',()=>{X.sky(['#1a1440','#6a3a7a','#ff8a5a','#ffd08a'],GY);X.disc(230,130,30,X.rg(230,130,0,230,130,30,['#fff8d0','#ffd070','#ff9a40']));X.glow(230,130,80,'#ff9040',.3);X.stars(30,2,0,0,80,.6);for(let i=0;i<7;i++)X.rr(0,118+i*7,W,1.2,0,'rgba(255,220,180,'+(.05+i*.02)+')');X.hills(GY-22,40,'rgba(150,80,120,.55)',300,.008,7);});const c=A.c;
  for(let i=0;i<4;i++){const x=((i*120-d*.06)%480+480)%480-80,y=30+(i*37)%50;c.globalAlpha=.32;X.ell(x,y,30,5,'#ffd0c0');X.ell(x+16,y-3,18,4,'#ffe8d8');c.globalAlpha=1;}
  X.hills(GY,60,'#8a4a6a',d*.1,.012,1);X.hills(GY,34,'#5a2a4a',d*.25,.025,4);
  for(let i=0;i<5;i++){const x=((i*90-d*.45)%450+450)%450-40;c.fillStyle='#3a1a30';c.fillRect(x,GY-26,4,26);c.fillRect(x-5,GY-18,5,3);c.fillRect(x-5,GY-22,3,6);c.fillRect(x+4,GY-14,5,3);c.fillRect(x+6,GY-19,3,7);}
  X.vg(0,GY,W,H-GY,['#d89060','#8a4a30','#4a2418']);c.fillStyle='#ffd8a0';c.fillRect(0,GY,W,1.5);c.fillStyle='rgba(0,0,0,.18)';for(let i=0;i<16;i++){const x=((i*40-d)%640+640)%640-40;c.fillRect(x,GY+6+(i%3)*9,14+(i%4)*3,1.5);}
  ob.forEach(o=>{if(o.f){const ox=o.x,oy=o.y;X.shadow(ox+8,GY,7,1.5,.25);X.rr(ox,oy,o.w,o.h,3,X.lg(0,oy,0,oy+o.h,['#ff9ad0','#ff4f9a','#9a1a5a']));X.disc(ox+12,oy+4,1.6,'#ffffff');X.glow(ox+12,oy+4,5,'#ff4040',.5);const pr=A.t%4<2?6:3;c.fillStyle='rgba(255,255,255,.8)';c.fillRect(ox+4-pr,oy-2,pr*2,1);c.fillRect(ox+12-pr,oy-2,pr*2,1);c.fillStyle='#555';c.fillRect(ox+3.5,oy-2,1,2);c.fillRect(ox+11.5,oy-2,1,2);}
   else{const ox=o.x,oy=GY-o.h,n=o.h>20?2:1,ch=o.h/n;X.shadow(ox+o.w/2,GY,o.w/2+3,2,.35);for(let k=0;k<n;k++){const cy=oy+k*ch;X.block(ox,cy,o.w,ch,k?'#b06a2a':'#c88040',1.5);c.strokeStyle='rgba(70,35,10,.6)';c.lineWidth=1;c.beginPath();c.moveTo(ox+1.5,cy+1.5);c.lineTo(ox+o.w-1.5,cy+ch-1.5);c.moveTo(ox+o.w-1.5,cy+1.5);c.lineTo(ox+1.5,cy+ch-1.5);c.stroke();X.rrs(ox+1.5,cy+1.5,o.w-3,ch-3,1,'rgba(255,220,160,.35)',.8);}X.rr(ox-1,oy-2,o.w+2,2.5,1,'#ffcf3f');c.fillStyle='#2a1a10';for(let k=0;k<o.w;k+=4)c.fillRect(ox+k,oy-2,2,2.5);}});
  const duck=A.in(0).d&&y>=GY;c.save();c.translate(40,y);if(duck)c.scale(1.25,.55);else if(land)c.scale(1+land*.03,1-land*.03);else if(y<GY)c.rotate(-.12);A.person(0,0,{s:.8,c:'#ffcf3f',pants:'#3a3a7a',cap:'#ff4f6d',st:y<GY?1.2:d*.12,d:1,arm1:y<GY?-2.6:undefined,arm2:y<GY?2.2:undefined,id:1});c.restore();
  const spd=3+Math.min(4,d/3000);if(spd>3.6){c.fillStyle='rgba(255,240,220,'+Math.min(.35,(spd-3.6)*.15)+')';for(let i=0;i<8;i++){const x=((i*53-d*2.2)%380+380)%380-40,yy=60+(i*41)%120;c.fillRect(x,yy,18+(i%3)*8,1);}}
  fx.draw();X.panel(W-62,3,58,22,'#ffcf3f');X.ot(g.score,W-8,7,'#ffcf3f',2,'r');T('M',W-58,13,'#fff3d6',1);X.panel(4,4,84,15,'#2fd6c3');X.ot('SPEED '+spd.toFixed(1),8,8,K.c,1);X.meter(52,9,32,4,(spd-3)/4,'#2fd6c3');};
 return g;}});

/* ---- CAVE COPTER ---- */
A.add({id:'copter',name:'CAVE COPTER',cat:'CLASSICS',how:'HOLD A TO RISE. RELEASE TO SINK.',make(){
 const g={over:null,score:0},fx=X.fx();let y=120,vy=0,cave=[],d=0,mid=120,blocks=[],puffs=[];for(let i=0;i<82;i++)cave.push([30,210]);
 let go=false;g.update=()=>{const up=A.in(0).a||A.in(0).u;if(up)go=true;if(!go){y=120+Math.sin(A.t*.08)*5;if(A.t%3===0)puffs.push({x:46,y:y+1,t:30});puffs.forEach(p=>{p.x-=2;p.t--;});puffs=puffs.filter(p=>p.t>0);return;}d++;g.score=d/6|0;vy+=up?-.16:.14;vy=cl(vy,-3,3);y+=vy;if(d%3===0)puffs.push({x:46,y:y+1,t:30});puffs.forEach(p=>{p.x-=2;p.y-=.15;p.t--;});puffs=puffs.filter(p=>p.t>0);
  if(d%2===0){mid=cl(mid+rnd(14)-7,70,170);const gap=Math.max(62,150-d/60);cave.shift();cave.push([mid-gap/2,mid+gap/2]);blocks.forEach(b=>b.x-=4);if(d%90===0)blocks.push({x:W,y:mid-gap/2+rnd(gap-24)});blocks=blocks.filter(b=>b.x>-10);}
  const c=cave[15];if(y-5<c[0]||y+5>c[1]||blocks.some(b=>b.x<70&&b.x+8>50&&y+5>b.y&&y-5<b.y+24)){g.over='GAME OVER';S('boom');fx.flash(K.o,10);fx.debris(56,y,'#ffcf3f',14,2.5);fx.spark(56,y,K.o,16,3);fx.ring(58,y,'#ffcf3f',34,18);A.shake=8;}};
 g.draw=()=>{X.cache('copterbg2',()=>{X.sky(['#0a0814','#141428','#1a1e30','#0a0c14']);X.glow(160,120,170,'#2a5a7a',.22);X.glow(240,90,60,'#8a3aaa',.12);X.glow(70,160,50,'#2ab8a0',.1);for(let i=0;i<9;i++){const px=i*38+(i*17)%20,pw=10+(i*7)%10;A.c.fillStyle=X.lg(px,0,px+pw,0,['#16162a','#20203a','#141426']);A.c.fillRect(px,0,pw,H);}});const c=A.c,off=(d%2)*2,lo=()=>A.gfx!=='off',sh=d>>1;
  c.save();c.translate(0,H);c.scale(1,-1);X.hills(150,50,'rgba(30,30,56,.55)',d*.6,.03,2);c.restore();X.hills(170,50,'rgba(30,30,56,.55)',d*.6,.03,4);c.save();c.translate(0,H);c.scale(1,-1);X.hills(190,40,'rgba(40,40,72,.7)',d*1.2,.04,7);c.restore();X.hills(214,40,'rgba(40,40,72,.7)',d*1.2,.035,5);
  for(let i=0;i<14;i++){const mx=((i*67-d*1.5)%(W+20)+W+20)%(W+20)-10,my=40+(i*53)%160,tw=.4+.4*Math.sin(A.t*.05+i);c.fillStyle='rgba(190,230,255,'+(tw*.5).toFixed(2)+')';c.fillRect(mx,my+Math.sin(A.t*.02+i)*4,1.2,1.2);}
  const top=[[0,0]],bot=[[0,H]];cave.forEach((cv,i)=>{top.push([i*4-4-off,cv[0]]);bot.push([i*4-4-off,cv[1]]);});top.push([W,0]);bot.push([W,H]);
  X.poly(top,X.lg(0,0,0,120,['#1a100c','#4a3024','#86603e']));X.poly(bot,X.lg(0,120,0,H,['#86603e','#4a3024','#1a100c']));c.save();X.poly(top,'rgba(0,0,0,0)');c.clip();c.fillStyle='rgba(0,0,0,.2)';for(let j=0;j<8;j++){const yy=12+j*14;c.fillRect(0,yy+Math.sin(j)*3,W,1.5);}c.restore();c.save();X.poly(bot,'rgba(0,0,0,0)');c.clip();c.fillStyle='rgba(0,0,0,.2)';for(let j=0;j<8;j++){const yy=130+j*14;c.fillRect(0,yy+Math.sin(j)*3,W,1.5);}c.restore();
  c.strokeStyle='#c8a070';c.lineWidth=2;c.beginPath();cave.forEach((cv,i)=>i?c.lineTo(i*4-4-off,cv[0]):c.moveTo(-4,cv[0]));c.stroke();c.beginPath();cave.forEach((cv,i)=>i?c.lineTo(i*4-4-off,cv[1]):c.moveTo(-4,cv[1]));c.stroke();
  for(let i=0;i<cave.length;i++){const ab=i+sh,x=i*4-4-off,cv=cave[i];if(ab%5===0){const L=5+(ab*7)%9;X.poly([[x-3,cv[0]-1],[x+3,cv[0]-1],[x,cv[0]+L]],X.lg(0,cv[0],0,cv[0]+L,['#86603e','#3a2418']));}if(ab%7===3){const L=4+(ab*5)%7;X.poly([[x-3,cv[1]+1],[x+3,cv[1]+1],[x,cv[1]-L]],X.lg(0,cv[1],0,cv[1]-L,['#86603e','#4a3024']));}if(ab%23===11){const col=ab%2?'#5af0d0':'#c070ff';if(lo())X.glow(x,cv[1]-4,14,col,.4);X.poly([[x-3,cv[1]+1],[x-1,cv[1]-9],[x+1,cv[1]+1]],col);X.poly([[x,cv[1]+1],[x+3,cv[1]-6],[x+4,cv[1]+1]],X.lt(col,1.4));}if(ab%31===17){if(lo())X.glow(x,cv[0]+5,12,'#5af0d0',.35);X.poly([[x-2,cv[0]-1],[x,cv[0]+9],[x+2,cv[0]-1]],'#8af8e0');}}
  blocks.forEach(b=>{if(lo())X.glow(b.x+4,b.y+12,22,'#ff5a40',.22);X.block(b.x-1,b.y,10,24,'#7a5a40',2);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(b.x,b.y+8,8,1);c.fillRect(b.x,b.y+16,8,1);X.poly([[b.x+1,b.y+4],[b.x+4,b.y+1],[b.x+7,b.y+5],[b.x+4,b.y+9]],'#ff7a50');X.poly([[b.x+2,b.y+15],[b.x+5,b.y+13],[b.x+7,b.y+18],[b.x+3,b.y+20]],'#ff9a60');c.fillStyle=A.t%20<10?'#ffcf3f':'#ff4f6d';c.fillRect(b.x+3,b.y-2,2,2);});
  puffs.forEach(p=>{c.globalAlpha=p.t/45;X.disc(p.x,p.y,2+(30-p.t)*.15,'#a8b0c0');});c.globalAlpha=1;
  {const cv=cave[15],gap=Math.min(y-cv[0],cv[1]-y);if(go&&gap<16&&lo())X.glow(58,y,26,'#ff4040',.35*(1-gap/16));}if(lo()){c.save();c.globalCompositeOperation='lighter';X.poly([[66,y+1],[150,y-16+vy*6],[150,y+18+vy*6]],X.lg(66,0,150,0,['rgba(255,240,180,.28)','rgba(255,240,180,0)']));c.restore();}
  c.save();c.translate(58,y);c.rotate(vy*.08);c.scale(1.3,1.3);X.rr(-8,-4,17,9,4,X.lg(0,-4,0,5,['#fff0a0','#ffcf3f','#b07a10']));X.rr(2,-3,6,5,2,X.lg(0,-3,0,2,['#d8f8ff','#4aa0d0']));c.fillStyle='#b07a10';c.fillRect(-16,-1,9,2.4);c.fillRect(-17,-4,2,5);c.fillStyle='#555';c.fillRect(-1,-7,2,3);c.fillRect(-4,5,10,1.2);
  const bw=A.t%3;c.fillStyle='rgba(230,240,255,'+(bw?.5:.85)+')';c.fillRect(-10+bw*2,-8,21-bw*4,1.2);c.fillStyle='rgba(230,240,255,.5)';c.fillRect(-18,-4+bw,1,5-bw*2);c.restore();X.glow(66,y,8,'#ffe080',.2);
  if(!go&&A.t%50<35)X.ot('HOLD A TO FLY',160,150,K.w,2,'c');fx.draw();X.bar('DIST '+g.score,'','',K.y);if(g.score>0&&g.score%100<3&&go)X.ot(Math.floor(g.score/100)*100+'M!',160,40,'#5af0d0',2,'c');};
 return g;}});

/* ---- NEON TRAILS ---- */
A.add({id:'trails',name:'NEON TRAILS',cat:'VERSUS',vs:1,how:'STEER. NEVER HIT A TRAIL. FIRST TO 3.',make(){
 const g={over:null,score:0},GW=80,GH=55,fx=X.fx(),PCOL=['#2fd6c3','#ff4f9a'],lo=()=>A.gfx!=='off';let gr,b,sc=[0,0],wait=50,t=0,rnd_=0,ko=0,lw=-1;
 const reset=()=>{gr=new Uint8Array(GW*GH);b=[{x:15,y:27,dx:1,dy:0},{x:64,y:27,dx:-1,dy:0}];wait=70;rnd_++;};reset();
 const free=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&!gr[y*GW+x];const room=(x,y,dx,dy)=>{let n=0;while(n<30&&free(x+dx*(n+1),y+dy*(n+1)))n++;return n;};
 g.update=()=>{if(ko)ko--;for(let i=0;i<2;i++){const q=b[i];if(i===1&&A.cpu){const f=room(q.x,q.y,q.dx,q.dy);if(f<2+ri(3)||Math.random()<.01*(2-A.ai)){const l=room(q.x,q.y,q.dy,-q.dx),r=room(q.x,q.y,-q.dy,q.dx);if(Math.max(l,r)>f||f<2){const tl=l>r;[q.dx,q.dy]=tl?[q.dy,-q.dx]:[-q.dy,q.dx];}}if(A.ai<.6&&Math.random()<.004)[q.dx,q.dy]=[q.dy,-q.dx];}
   else{const h=A.hit(i);if(h.l&&!q.dx){q.dx=-1;q.dy=0;}else if(h.r&&!q.dx){q.dx=1;q.dy=0;}else if(h.u&&!q.dy){q.dx=0;q.dy=-1;}else if(h.d&&!q.dy){q.dx=0;q.dy=1;}}}
  if(wait>0){wait--;if(wait===45||wait===25)S('blip');if(wait===0)S('coin');return;}if(++t%3)return;const dead=[0,0];b.forEach((q,i)=>{gr[q.y*GW+q.x]=i+1;q.x+=q.dx;q.y+=q.dy;if(!free(q.x,q.y))dead[i]=1;});if(b[0].x===b[1].x&&b[0].y===b[1].y)dead[0]=dead[1]=1;
  if(dead[0]||dead[1]){S('boom');A.shake=7;ko=30;b.forEach((q,i)=>{if(dead[i]){const x=q.x*4+2,y=20+q.y*4+2;fx.spark(x,y,PCOL[i],24,3.8);fx.spark(x,y,'#ffffff',10,2.5);fx.debris(x,y,PCOL[i],12,2.4);fx.ring(x,y,'#ffffff',34,18);fx.ring(x,y,PCOL[i],54,24);}});fx.flash(dead[0]&&!dead[1]?PCOL[1]:dead[1]&&!dead[0]?PCOL[0]:'#ffffff',5);if(dead[0]!==dead[1]){const w=dead[0]?1:0;sc[w]++;lw=w;if(sc[w]>=3){g.over=A.win(w);return;}}reset();}};
 const cyc=(x,y,dx,dy,col)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(Math.atan2(dy,dx));if(lo())X.glow(0,0,16,col,.6);X.rr(-6,-3,11,6,3,X.lg(0,-3,0,3,[X.lt(col,1.6),col,X.lt(col,.45)]));X.rr(-1,-2,5,4,2,'rgba(230,255,255,.9)');c.fillStyle='#0a0618';c.fillRect(-5,-3.6,3,1.2);c.fillRect(-5,2.4,3,1.2);X.disc(5,0,1.3,'#ffffff');c.restore();};
 g.draw=()=>{X.cache('trailsbg2',()=>{X.sky(['#07031a','#0d0628','#07031a']);X.glow(160,130,170,'#5a3aff',.14);const c=A.c;c.strokeStyle='rgba(110,90,230,.16)';c.lineWidth=.6;c.beginPath();for(let x=0;x<=W;x+=8){c.moveTo(x,20);c.lineTo(x,H);}for(let y=20;y<=H;y+=8){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();c.strokeStyle='rgba(140,120,255,.3)';c.beginPath();for(let x=0;x<=W;x+=40){c.moveTo(x,20);c.lineTo(x,H);}for(let y=20;y<=H;y+=40){c.moveTo(0,y);c.lineTo(W,y);}c.stroke();
   for(let x=0;x<=W;x+=40)for(let y=20;y<=H;y+=40){X.glow(x,y,5,'#8a70ff',.25);X.disc(x,y,1.2,'rgba(200,185,255,.7)');}for(let i=0;i<40;i++){const x=((i*97)%40)*8,y=20+((i*53)%27)*8;c.fillStyle=i%3?'rgba(90,70,220,.12)':'rgba(47,214,195,.07)';c.fillRect(x+1,y+1,7,7);}
   c.fillStyle=X.lg(0,20,0,60,['rgba(140,120,255,.12)','rgba(140,120,255,0)']);c.fillRect(0,20,W,40);X.vignette(.6);X.rrs(1,19,W-2,H-20,2,'rgba(140,120,255,.6)',1.5);X.rrs(3,21,W-6,H-24,2,'rgba(140,120,255,.18)',1);
   for(const[x,y,sx,sy]of[[2,20,1,1],[318,20,-1,1],[2,238,1,-1],[318,238,-1,-1]]){X.stroke([[x,y+sy*14],[x,y],[x+sx*14,y]],'#c8b8ff',2);X.glow(x,y,10,'#8a70ff',.4);}});const c=A.c;
  if(lo()){const sy=20+((A.t*1.1)%(H-20));c.fillStyle='rgba(150,130,255,.06)';c.fillRect(0,sy-6,W,12);c.fillStyle='rgba(190,175,255,.1)';c.fillRect(0,sy,W,1);}
  if(lo())for(let k=1;k<3;k++){c.fillStyle=X.rgba(PCOL[k-1],.14);for(let i=0;i<GW*GH;i++)if(gr[i]===k)c.fillRect((i%GW)*4-2,18+((i/GW)|0)*4,8,8);}
  for(let k=1;k<3;k++){c.fillStyle=X.lt(PCOL[k-1],.85);for(let i=0;i<GW*GH;i++)if(gr[i]===k)c.fillRect((i%GW)*4,20+((i/GW)|0)*4,4,4);c.fillStyle=X.lt(PCOL[k-1],1.7);for(let i=0;i<GW*GH;i++)if(gr[i]===k){const x=(i%GW)*4+1,y=21+((i/GW)|0)*4;c.fillRect(x,y,(i%GW<GW-1&&gr[i+1]===k)?6:2,(gr[i+GW]===k)?6:2);}}
  if(A.gfx==='high')for(let k=1;k<3;k++){const ph=(A.t*3)%160;c.fillStyle='rgba(255,255,255,.55)';for(let i=0;i<GW*GH;i++)if(gr[i]===k&&(((i%GW)+((i/GW)|0)*3+k*40)%160+160-ph)%160<3)c.fillRect((i%GW)*4+1,21+((i/GW)|0)*4,2,2);}
  b.forEach((q,i)=>{const x=q.x*4+2,y=20+q.y*4+2;if(lo()){X.glow(x,y,26,PCOL[i],.18);X.shadow(x+1,y+3,5,2,.4);}if(wait>0&&lo()){const r=8+((A.t*.6)%14);c.globalAlpha=1-(r-8)/14;A.ring(x,y,r,PCOL[i]);c.globalAlpha=1;}cyc(x,y,q.dx,q.dy,PCOL[i]);});
  fx.draw();X.bar();X.ot(A.nm(0),6,5,PCOL[0],1);X.ot(A.nm(1),W-6,5,PCOL[1],1,'r');for(let k=0;k<3;k++){const on0=k<sc[0],on1=k<sc[1];X.orb(A.nm(0).length*4+14+k*9,8,3,on0?PCOL[0]:'#2a2448',on0?1:0);X.orb(W-A.nm(1).length*4-14-k*9,8,3,on1?PCOL[1]:'#2a2448',on1?1:0);}X.ot('ROUND '+rnd_,160,5,'#c8c0ff',1,'c');
  if(lw>=0&&wait>40){const a=Math.min(1,(wait-40)/10);c.globalAlpha=a;X.rr(70,60,180,30,8,'rgba(8,4,24,.8)');X.rrs(70.5,60.5,179,29,8,PCOL[lw],1.5);X.ot(A.nm(lw)+' SCORES',160,68,PCOL[lw],2,'c');c.globalAlpha=1;}else if(wait>0){const n=wait>45?'3':wait>25?'2':wait>5?'1':'GO!',f=(((wait-5)%20)+20)%20/20;c.globalAlpha=Math.min(1,f*3);X.ot(n,160,104-f*4,n==='GO!'?'#3dff8b':'#ffcf3f',4,'c');c.globalAlpha=1;}};
 return g;}});

/* ---- TANK DUEL ---- */
A.add({id:'tanks',name:'TANK DUEL',cat:'VERSUS',vs:1,warm:100,tags:'tank trouble tanks ricochet bounce versus 2 player',how:'TURN + DRIVE. A FIRES. SHELLS BOUNCE OFF WALLS. 5 HITS WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let FLD=null,tk,sh=[],sc=g._sc=[0,0],tracks=[],scorch=[],smoke=[],crates=[],pick=null,pickT=360,round=0,t=0,banner=90;
 // three battlefields, one per round in turn: concrete walls that never break, and wooden crates that do
 const MAPS=[
  {wl:[[70,60,12,60],[238,120,12,60],[130,110,60,12],[150,40,12,40],[158,170,12,40]],cr:[[110,170],[200,64],[40,200],[270,40]]},
  {wl:[[60,40,12,70],[248,130,12,70],[100,124,40,12],[180,104,40,12],[154,30,12,30],[154,190,12,30]],cr:[[140,60],[170,166],[90,190],[220,50]]},
  {wl:[[90,70,40,12],[190,158,40,12],[90,158,12,40],[218,42,12,40],[150,110,20,20]],cr:[[60,120],[252,120],[160,60],[160,180]]}];
 let WL=MAPS[0].wl;
 const blocked=(x,y,r)=>x<r||x>W-r||y<22+r||y>H-r||WL.some(w=>x>w[0]-r&&x<w[0]+w[2]+r&&y>w[1]-r&&y<w[1]+w[3]+r)||crates.some(c=>c.hp>0&&x>c.x-6-r&&x<c.x+6+r&&y>c.y-6-r&&y<c.y+6+r);
 const GW=32,GH=22,cell=(x,y)=>{const cx_=Math.floor(x/10),cy_=Math.floor((y-22)/10);return cx_<0||cy_<0||cx_>=GW||cy_>=GH?-1:cy_*GW+cx_;};
 const crateAt=(x,y)=>crates.find(c=>c.hp>0&&Math.abs(x-c.x)<6.5&&Math.abs(y-c.y)<6.5);
 const reset=()=>{const m=MAPS[round%3];WL=m.wl;crates=m.cr.map(([x,y])=>({x,y,hp:2}));tk=[{x:30,y:130,a:0,cd:0,tr:0,rec:0,pow:null,powT:0,shield:0,dodge:0,think:0},{x:290,y:130,a:Math.PI,cd:0,tr:0,rec:0,pow:null,powT:0,shield:0,dodge:0,think:0}];sh=[];pick=null;pickT=300;banner=70;};reset();
 const fire=(i,a)=>{const q=tk[i];if(i===1&&A.cpu)a+=(Math.random()-.5)*(1-A.ai)*.6;sh.push({x:q.x+Math.cos(a)*12,y:q.y+Math.sin(a)*12,vx:Math.cos(a)*3.1,vy:Math.sin(a)*3.1,b:3,o:i,t:0});};
 // step a shell, bouncing off walls and crates; returns false when it is spent
 const move=(s,real)=>{s.t++;s.x+=s.vx;let hit=blocked(s.x,s.y,1);if(hit){const c=real&&crateAt(s.x,s.y);if(c){c.hp--;s.dead=1;fx.debris(c.x,c.y,'#a8743c',c.hp?4:12,2);if(!c.hp){fx.ring(c.x,c.y,'#ffd080',16,12);scorch.push({x:c.x,y:c.y,r:7});S('hit');}return false;}
   s.x-=s.vx;s.vx*=-1;if(s.b--<=0)return false;if(real){fx.spark(s.x,s.y,'#ffe080',4,1.5);S('blip');}}
  s.y+=s.vy;hit=blocked(s.x,s.y,1);if(hit){const c=real&&crateAt(s.x,s.y);if(c){c.hp--;s.dead=1;fx.debris(c.x,c.y,'#a8743c',c.hp?4:12,2);if(!c.hp){fx.ring(c.x,c.y,'#ffd080',16,12);scorch.push({x:c.x,y:c.y,r:7});S('hit');}return false;}
   s.y-=s.vy;s.vy*=-1;if(s.b--<=0)return false;if(real){fx.spark(s.x,s.y,'#ffe080',4,1.5);S('blip');}}
  return s.t<240;};
 // CPU: fire when a test shell (bounces included) would pass the player; dodge incoming shells; otherwise hunt
 const sim=(q,a,o)=>{const s={x:q.x+Math.cos(a)*12,y:q.y+Math.sin(a)*12,vx:Math.cos(a)*3.1,vy:Math.sin(a)*3.1,b:3,t:0};for(let n=0;n<130;n++){if(!move(s,false))return 0;if(Math.hypot(s.x-o.x,s.y-o.y)<8)return 1;if(n>8&&Math.hypot(s.x-q.x,s.y-q.y)<9)return -1;}return 0;};
 const brain=()=>{const q=tk[1],o=tk[0],sk=A.ai,k={};
  for(const s of sh){if(s.o===1&&s.t<20)continue;const dx=q.x-s.x,dy=q.y-s.y,d=Math.hypot(dx,dy);if(d<46&&(dx*s.vx+dy*s.vy)>0&&Math.random()<sk){q.dodge=18;q.dodgeA=Math.atan2(s.vy,s.vx)+Math.PI/2;}}
  if(q.dodge>0){q.dodge--;let df=q.dodgeA-q.a;while(df>Math.PI)df-=6.283;while(df<-Math.PI)df+=6.283;if(Math.abs(df)>Math.PI/2){df+=df>0?-Math.PI:Math.PI;k.d=1;}else k.u=1;k.l=df<-.1;k.r=df>.1;return k;}
  if(--q.think<=0){q.think=2;q.shot=0;if(q.cd===0)for(const da of[0,-.04,.04,-.1,.1,-.2,.2]){const r=sim(q,q.a+da,o);if(r===1){q.shot=Math.abs(da)<.05?2:Math.sign(da);break;}}}
  if(q.shot===2&&Math.random()<.3+sk*.6){k.a=1;q.shot=0;}
  // route round the walls on a coarse grid (a distance field grown out from the player)
  if(t%15===0||!FLD){FLD=new Int16Array(GW*GH).fill(-1);const q0=[];const st=cell(o.x,o.y);if(st>=0){FLD[st]=0;q0.push(st);}
   while(q0.length){const c_=q0.shift(),cx_=c_%GW,cy_=(c_/GW)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx_+dx,ny=cy_+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const n=ny*GW+nx;if(FLD[n]>=0||blocked(nx*10+5,22+ny*10+5,7))continue;FLD[n]=FLD[c_]+1;q0.push(n);}}}
  let want=Math.atan2(o.y-q.y,o.x-q.x);const here=cell(q.x,q.y);
  if(here>=0&&FLD[here]>2){let best=FLD[here],bx=q.x,by=q.y;const hx=here%GW,hy=(here/GW)|0;for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=hx+dx,ny=hy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;const v=FLD[ny*GW+nx];if(v>=0&&v<best){best=v;bx=nx*10+5;by=22+ny*10+5;}}want=Math.atan2(by-q.y,bx-q.x);}
  let df=(q.shot===1||q.shot===-1)?q.shot*.08:want-q.a;if(q.shot===1||q.shot===-1)q.shot=0;while(df>Math.PI)df-=6.283;while(df<-Math.PI)df+=6.283;
  k.l=df<-.06;k.r=df>.06;const d=Math.hypot(o.x-q.x,o.y-q.y);
  if(q.stuck>0){q.stuck--;k.d=1;k.l=1;k.r=0;}else if((d>60||here>=0&&FLD[here]>4)&&Math.abs(df)<.9){k.u=1;if(blocked(q.x+Math.cos(q.a)*14,q.y+Math.sin(q.a)*14,8))q.stuck=20;}
  if(pick&&!q.pow&&Math.hypot(pick.x-q.x,pick.y-q.y)<90){const wa=Math.atan2(pick.y-q.y,pick.x-q.x);let dd=wa-q.a;while(dd>Math.PI)dd-=6.283;while(dd<-Math.PI)dd+=6.283;k.l=dd<-.1;k.r=dd>.1;k.u=Math.abs(dd)<.8;}
  return k;};
 const hitTank=(i,s)=>{const q=tk[i];if(q.shield){q.shield=0;fx.ring(q.x,q.y,'#7ff0ff',22,14);S('hit');return;}sc[1-i]++;S('boom');A.shake=7;fx.spark(q.x,q.y,K.o,22,3);fx.debris(q.x,q.y,i?'#ff4f9a':'#2fd6c3',12,2.6);fx.ring(q.x,q.y,'#ffd080',34);fx.flash('#ffffff',5);scorch.push({x:q.x,y:q.y,r:13});
  for(let k=0;k<14;k++)smoke.push({x:q.x+rnd(10)-5,y:q.y+rnd(10)-5,vx:rnd(.8)-.4,vy:-rnd(.6),r:3+rnd(4),t:60+ri(40),m:100,c:k<5?'#ffb34a':'#3a3630'});
  if(sc[1-i]>=5){g.over=A.win(1-i);return;}round++;reset();};
 g.update=()=>{t++;if(banner>0)banner--;
  if(A.cpu)A.bot(banner>0?{}:brain());
  for(let i=0;i<2;i++){const q=tk[i],k=banner>0?{}:A.in(i);q.a+=ax(k)*.05;const m=-ay(k)*(i&&A.cpu?.75+.5*A.ai:1.3),nx=q.x+Math.cos(q.a)*m,ny=q.y+Math.sin(q.a)*m;if(!blocked(nx,q.y,8))q.x=nx;if(!blocked(q.x,ny,8))q.y=ny;
   if(m||ax(k)){q.tr+=.4;if(t%5===0)tracks.push({x:q.x,y:q.y,a:q.a,t:300});if(A.gfx!=='off'&&t%6===i*3)smoke.push({x:q.x-Math.cos(q.a)*10,y:q.y-Math.sin(q.a)*10,vx:-Math.cos(q.a)*.3,vy:-.2,r:1.6,t:26,m:26,c:'#8a8070'});}
   if(q.cd>0)q.cd--;if(q.rec)q.rec--;if(q.powT>0&&--q.powT===0)q.pow=null;
   if(A.hit(i).a&&q.cd===0){q.cd=q.pow==='rapid'?16:42;q.rec=6;fire(i,q.a);if(q.pow==='spread'){fire(i,q.a-.22);fire(i,q.a+.22);}S('shoot');fx.spark(q.x+Math.cos(q.a)*15,q.y+Math.sin(q.a)*15,'#ffe080',5,1.5);for(let k=0;k<4;k++)smoke.push({x:q.x+Math.cos(q.a)*15,y:q.y+Math.sin(q.a)*15,vx:Math.cos(q.a)*.6+rnd(.4)-.2,vy:Math.sin(q.a)*.6+rnd(.4)-.2,r:2,t:24,m:24,c:'#d8d0c0'});}
   if(pick&&Math.hypot(pick.x-q.x,pick.y-q.y)<12){if(pick.k==='shield')q.shield=1;else{q.pow=pick.k;q.powT=480;}fx.pop(pick.x,pick.y-10,pick.k.toUpperCase()+'!',K.y);fx.ring(pick.x,pick.y,K.y,18,12);S('score');pick=null;pickT=600;}}
  if(!pick&&--pickT<=0){for(let n=0;n<40;n++){const x=20+rnd(W-40),y=34+rnd(H-50);if(!blocked(x,y,10)){pick={x,y,k:['spread','rapid','shield'][ri(3)]};break;}}pickT=600;}
  tracks.forEach(t_=>t_.t--);tracks=tracks.filter(t_=>t_.t>0);if(tracks.length>200)tracks.shift();
  for(const p of smoke){p.x+=p.vx;p.y+=p.vy;p.r+=.06;p.t--;}smoke=smoke.filter(p=>p.t>0);if(smoke.length>140)smoke.splice(0,smoke.length-140);if(scorch.length>24)scorch.shift();
  for(const s of sh){if(!move(s,true)){if(!s.dead)fx.ring(s.x,s.y,'#ffd080',8,10);s.dead=1;continue;}
   for(let i=0;i<2;i++)if(!s.dead&&(i!==s.o||s.t>15)&&Math.hypot(s.x-tk[i].x,s.y-tk[i].y)<9){s.dead=1;hitTank(i,s);return;}}
  sh=sh.filter(s=>!s.dead);g.score=sc[0];};
 g.draw=()=>{const c=A.c;const m=round%3;X.cache('tanksbg4_'+m,()=>{const pal=[['#6e6c3a','#5a5a30','#46461f'],['#8a7448','#76603a','#5a4628'],['#4e6a3a','#3e5a2e','#2c4420']][m];X.vg(0,0,W,H,pal);
   for(let i=0;i<28;i++)X.ell((i*131+m*40)%W,24+(i*71)%214,9+(i%5)*3,5+(i%3)*2,i%3?'rgba(100,76,34,.16)':'rgba(130,160,60,.16)',i*.7);
   for(let i=0;i<140;i++)X.ell((i*97+m*13)%W,22+(i*53)%220,3+(i%5),1.5+(i%3),i%2?'rgba(0,0,0,.08)':'rgba(255,255,200,.06)');
   c.strokeStyle='rgba(60,46,20,.22)';c.lineWidth=7;c.beginPath();c.moveTo(0,200-m*40);c.bezierCurveTo(90,150,120,230,200,190);c.bezierCurveTo(260,160,290,100,W,90+m*30);c.stroke();
   for(let i=0;i<80;i++){const x=(i*173+11+m*7)%W,y=26+(i*89)%210;c.fillStyle=i%2?'#84943e':'#5e6e2a';c.fillRect(x,y,1,2);c.fillRect(x+1.5,y-1,1,3);c.fillRect(x+3,y,1,2);}
   // concrete walls with a sandbag crown
   WL.forEach(w=>{X.rr(w[0]+2,w[1]+3,w[2]+4,w[3]+4,3,'rgba(0,0,0,.35)');X.rr(w[0],w[1]+2,w[2],w[3]+1,2,'#4a4a4a');X.block(w[0],w[1],w[2],w[3],'#a8a69a',2);c.fillStyle='rgba(0,0,0,.18)';if(w[2]<w[3])for(let y=w[1]+8;y<w[1]+w[3];y+=8)c.fillRect(w[0]+1,y,w[2]-2,.8);else for(let x=w[0]+10;x<w[0]+w[2];x+=10)c.fillRect(x,w[1]+1,.8,w[3]-2);
    for(let k=0;k<6;k++){c.fillStyle='rgba(60,50,40,.25)';c.fillRect(w[0]+1+(k*7)%Math.max(2,w[2]-3),w[1]+1+(k*11)%Math.max(2,w[3]-3),1.2,1.2);}
    const bags=w[2]<w[3]?Math.floor(w[3]/6):Math.floor(w[2]/7);for(let k=0;k<bags;k++){const bx=w[2]<w[3]?w[0]+w[2]/2:w[0]+3.5+k*7,by=w[2]<w[3]?w[1]+3+k*6:w[1]+w[3]/2;X.ell(bx,by,w[2]<w[3]?w[2]*.32:3.2,w[2]<w[3]?2.6:w[3]*.3,'rgba(200,180,120,.35)');}});
   X.glow(60,40,160,'#fff0c0',.08);X.vignette(.4);});
  for(const s of scorch){X.ell(s.x,s.y,s.r,s.r*.7,'rgba(20,14,8,.35)');X.ell(s.x,s.y,s.r*.55,s.r*.4,'rgba(10,6,4,.35)');}
  tracks.forEach(t_=>{c.globalAlpha=t_.t/380;c.save();c.translate(t_.x,t_.y);c.rotate(t_.a);c.fillStyle='#2e2a12';c.fillRect(-1.5,-8,3,3);c.fillRect(-1.5,5,3,3);c.restore();});c.globalAlpha=1;
  for(const cr of crates){if(cr.hp<=0)continue;X.rr(cr.x-5,cr.y-3,12,10,1,'rgba(0,0,0,.3)');X.block(cr.x-6,cr.y-6,12,12,cr.hp>1?'#b07a48':'#8a5a32',1.5);c.strokeStyle='rgba(60,30,10,.7)';c.lineWidth=.8;c.beginPath();c.moveTo(cr.x-5,cr.y-5);c.lineTo(cr.x+5,cr.y+5);c.moveTo(cr.x+5,cr.y-5);c.lineTo(cr.x-5,cr.y+5);c.stroke();if(cr.hp===1){c.strokeStyle='rgba(20,10,0,.8)';c.beginPath();c.moveTo(cr.x-2,cr.y-6);c.lineTo(cr.x,cr.y-1);c.lineTo(cr.x-3,cr.y+3);c.stroke();}}
  if(pick){const b=Math.sin(t*.12)*1.5,col=pick.k==='shield'?'#4dabff':pick.k==='rapid'?'#ff9838':'#3dff8b';X.shadow(pick.x,pick.y+7,6,2,.35);X.glow(pick.x,pick.y+b,14,col,.45);X.rr(pick.x-6,pick.y-6+b,12,12,3,X.lg(0,pick.y-6,0,pick.y+6,[X.lt(col,1.5),col,X.lt(col,.6)]));A.text(pick.k[0].toUpperCase(),pick.x,pick.y-2+b,'#ffffff',1,'c');}
  tk.forEach((q,i)=>{const col=i?'#ff4f9a':'#2fd6c3';X.shadow(q.x+2,q.y+3,13,10,.38);c.save();c.translate(q.x,q.y);c.rotate(q.a);for(const sy of[-8,4.5]){X.rr(-11,sy,22,3.8,1.6,'#22221e');c.fillStyle='#5a5a54';for(let x=-10+(q.tr%3);x<10;x+=3)c.fillRect(x,sy+.3,1,3.2);c.fillStyle='rgba(255,255,255,.15)';c.fillRect(-10,sy,20,.6);}
   X.block(-9.5,-5,19,10,col,2);c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-9,-.4,4,.8);c.fillRect(-7.5,-4,1,8);c.fillStyle=X.rgba('#000000',.16);c.fillRect(-4,-4.5,3,2);c.fillRect(3,2,4,2);
   const rb=-q.rec*.5;X.rr(2+rb,-1.5,12,3,1,X.lg(0,-1.5,0,1.5,['#ffffff','#b8b8c0','#6a6a74']));c.fillStyle='#4a4a52';c.fillRect(12+rb,-2.2,2.6,4.4);
   if(q.rec>2){X.glow(16+rb,0,11,'#ffc040',.8);X.poly([[14+rb,-2.6],[21+rb,0],[14+rb,2.6]],'#fff0a0');}X.disc(rb*.4,0,5.6,'rgba(0,0,0,.3)');X.orb(rb*.4,0,4.6,col);X.disc(rb*.4-1.5,-1.5,.8,'#ffffff');c.restore();
   if(q.shield){X.glow(q.x,q.y,18,'#4dabff',.25);A.ring(q.x,q.y,15,'rgba(120,200,255,.7)');}
   if(q.pow){X.meter(q.x-10,q.y-20,20,3,q.powT/480,q.pow==='rapid'?'#ff9838':'#3dff8b');}
   if(q.cd===0){c.globalAlpha=.6+.3*Math.sin(t*.15);A.ring(q.x,q.y,14,X.rgba(col,.45));c.globalAlpha=1;}else{c.strokeStyle=X.rgba(col,.5);c.lineWidth=1.2;c.beginPath();c.arc(q.x,q.y,14,-1.57,-1.57+6.283*(1-q.cd/(q.pow==='rapid'?16:42)));c.stroke();}});
  for(const p of smoke){c.globalAlpha=Math.max(0,p.t/p.m)*.5;X.disc(p.x,p.y,p.r,p.c);}c.globalAlpha=1;
  sh.forEach(s=>{X.shadow(s.x+2,s.y+4,2.5,1,.3);for(let k=1;k<5;k++){c.globalAlpha=.22*(1-k/5);X.disc(s.x-s.vx*k*1.3,s.y-s.vy*k*1.3,1.4+k*.6,'#d8d0b8');}c.globalAlpha=1;X.glow(s.x,s.y,9,s.o?'#ff7ab8':'#7ff0e0',.6);X.stroke([[s.x,s.y],[s.x-s.vx*2,s.y-s.vy*2]],'#fff0b0',1.8);X.disc(s.x,s.y,1.4,'#ffffff');});
  fx.draw();X.bar('','','ROUND '+(round+1));A.hud2(sc[0],sc[1]);
  if(banner>0)X.ot(['FIELD','QUARRY','MAZE'][m]+' - ROUND '+(round+1),160,60,K.y,2,'c');};
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
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off';let sc=[0,0],t=0,go=0,ph='wait',res='',cpuAt=0,w=-1,tw=-40;const nr=()=>{t=0;go=120+ri(200);ph='wait';cpuAt=go+Math.round(34-A.ai*20+rnd(10));w=-1;};nr();
 g.update=()=>{t++;tw+=.6;if(tw>360)tw=-40;if(ph==='wait'||ph==='go'){if(ph==='wait'&&t>=go){ph='go';S('coin');fx.flash('#fff3d6',6);}if(A.cpu)A.bot({a:t>=cpuAt});const a=A.hit(0).a,b=A.hit(1).a;
   if(a||b){if(ph==='wait'){w=a?1:0;res=A.nm(1-w)+' FIRED EARLY!';}else{w=a&&b?(Math.random()<.5?0:1):a?0:1;res=A.nm(w)+' WINS IN '+((t-go)/60).toFixed(2)+'S';}sc[w]++;ph='res';t=0;S('shoot');A.shake=6;const sx=w?226:94;fx.spark(sx,130,'#fff0a0',12,3);fx.ring(sx,130,'#ffffff',18,12);fx.debris(w?70:250,130,'#a01010',6,1.5);fx.debris(w?70:250,166,'#c89a60',8,1.6);}}
  else if(t>100){if(sc[w]>=3)g.over=A.win(w);else nr();}};
 const bg=()=>{X.sky(['#2a1448','#7a2a5a','#c04a4a','#ff9838','#ffcf6f'],170);X.glow(160,150,170,'#ffb050',.25);X.disc(160,128,30,X.rg(160,128,0,160,128,30,['#fffbe8','#ffe08a','#ffb050']));X.glow(160,128,80,'#ffb050',.4);const c=A.c;c.fillStyle='rgba(120,40,60,.35)';for(const[x,y,w]of[[30,50,70],[200,36,90],[110,70,50]]){X.ell(x+w/2,y,w/2,4,'rgba(255,170,120,.35)');X.ell(x+w/2+6,y+3,w/3,3,'rgba(120,40,80,.3)');}
  X.hills(150,30,'#a04a4a',0,.01,3);c.fillStyle='#8a3a42';c.fillRect(70,112,40,40);X.poly([[66,112],[114,112],[106,104],[74,104]],'#8a3a42');c.fillRect(220,116,30,40);X.poly([[216,116],[254,116],[246,110],[224,110]],'#8a3a42');X.hills(170,40,'#7a3236',60,.015,2);
  const bld=(x,w,h,col)=>{X.vg(x,170-h,w,h,[X.lt(col,1.2),col]);c.fillStyle=X.lt(col,.7);c.fillRect(x-3,170-h-6,w+6,7);X.wood(x,170-h,w,h,'rgba(0,0,0,0)',true);c.fillStyle='rgba(255,210,120,.75)';c.fillRect(x+5,170-h+12,7,9);c.fillRect(x+w-12,170-h+12,7,9);c.fillStyle='#2a1410';c.fillRect(x+w/2-5,148,10,22);c.fillStyle=X.lt(col,.6);c.fillRect(x-4,142,w+8,3);c.fillRect(x-2,145,2,25);c.fillRect(x+w,145,2,25);X.rr(x+w/2-12,170-h-18,24,10,1,'#e8d0a0');c.fillStyle='#5a2a1a';c.fillRect(x+w/2-8,170-h-14,16,2);};bld(4,66,62,'#6a3426');bld(262,54,54,'#5a2a2a');
  X.vg(0,170,W,70,['#d0904a','#a0622a','#6a3a18']);c.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<30;i++)c.fillRect((i*67)%W,176+(i*29)%60,8+(i%4)*3,1);
  c.fillStyle='rgba(0,0,0,.25)';X.ell(200,214,14,3,'rgba(0,0,0,.25)');X.ell(110,226,10,2.5,'rgba(0,0,0,.25)');X.ell(200,212,11,4,'#8a6a4a');X.ell(110,224,8,3,'#7a5a3a');c.strokeStyle='#5a3a1a';c.lineWidth=2;c.beginPath();c.arc(40,200,12,0,6.283);c.stroke();for(let k=0;k<6;k++){c.beginPath();c.moveTo(40,200);c.lineTo(40+Math.cos(k*1.05)*12,200+Math.sin(k*1.05)*12);c.stroke();}X.vignette(.3);
  const cac=(x,h)=>{c.fillStyle='#2a4a1a';c.fillRect(x,170-h,5,h);c.fillRect(x-6,170-h*.7,6,3);c.fillRect(x-6,170-h*.95,3,h*.28);c.fillRect(x+5,170-h*.55,6,3);c.fillRect(x+8,170-h*.8,3,h*.28);};cac(130,30);cac(196,22);};
 const SC=1.55,cowboy=(i)=>{const x=i?248:72,d=i?-1:1,shot=ph==='res'&&w===i,down=ph==='res'&&w!==i,c=A.c,col=i?'#c84a6a':'#3a8ab0';X.shadow(x+8,172,16,3,.35);
  if(down){c.save();c.translate(x,172);c.rotate(-d*Math.min(1.5,t*.1));A.person(0,0,{s:SC,c:col,pants:'#4a3a2a',d,id:i?3:1});c.restore();return;}
  const draw=ph==='go'||shot;A.person(x,172,{s:SC,c:col,pants:'#4a3a2a',d,id:i?3:1,arm2:d>0?(shot?-1.5708:draw?-.6:.15):undefined,arm1:d<0?(shot?1.5708:draw?.6:-.15):undefined});
  /* hat */X.ell(x,172-33.6*SC,11,2.3,'#5a3a1a');X.rr(x-6,172-39*SC,12,8,2.5,X.lg(0,172-39*SC,0,172-33*SC,['#8a6a3a','#5a3a1a']));c.fillStyle='#2a1a0a';c.fillRect(x-6,172-35*SC,12,1.6);
  if(ph==='go'&&!shot){c.fillStyle='#333';c.fillRect(d>0?x+6:x-14,172-17*SC,8,3);}if(shot){c.fillStyle='#333';c.fillRect(d>0?x+7:x-23,172-21*SC-1,16,3.2);c.fillStyle='#6a4a2a';c.fillRect(d>0?x+7:x+19-23,172-21*SC+1,4,4);if(t<8){X.glow(x+d*26,172-21*SC,16,'#fff0a0',.95);X.disc(x+d*26,172-21*SC,3,'#ffffff');}if(t<5){const ty=172-21*SC;X.stroke([[x+d*28,ty],[x+d*(28+t*40),ty]],'rgba(255,240,180,.8)',1.5);}if(t<40){c.globalAlpha=1-t/40;X.disc(x+d*(30+t*.4),172-21*SC-t*.4,3+t*.15,'#d8d0c8');c.globalAlpha=1;}}};
 g.draw=()=>{X.cache('qdbg',bg);const c=A.c,tx=tw,ty=172+Math.abs(Math.sin(tw*.15))*-6;c.save();c.translate(tx,ty-5);c.rotate(tw*.1);c.strokeStyle='#8a6a3a';c.lineWidth=1;for(let i=0;i<6;i++){c.beginPath();c.arc(0,0,3+i*.5,i,i+4);c.stroke();}c.restore();
  for(let i=0;i<20;i++){const mx=((i*71+A.t*(.2+(i%3)*.1))%(W+10)+W+10)%(W+10)-5,my=150+(i*37)%80+Math.sin(A.t*.03+i)*4;c.fillStyle='rgba(255,220,160,'+(.15+(i%3)*.1)+')';c.fillRect(mx,my,1.3,1.3);}
  cowboy(0);cowboy(1);if(ph==='go'&&lo())X.vg(0,0,W,H,['rgba(255,240,200,.06)','rgba(255,240,200,0)']);fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(ph==='wait')X.ot('WAIT FOR IT...',160,60,'#fff3d6',2,'c');if(ph==='go'){const s=A.t%10<5?5:6;X.ot('DRAW!',160,46,K.r,s,'c');}if(ph==='res')X.ot(res,160,60,'#fff3d6',2,'c');};
 return g;}});
})();
