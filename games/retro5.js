(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,E=A.emoji;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

A.add({id:'skycab',name:'SKY CAB',cat:'CLASSICS',how:'THRUST LEFT/RIGHT, HOLD A TO LIFT. LAND SOFTLY, PICK UP, FLY THEM HOME.',make(){
 const g={over:null,score:0},PADS=[[30,200,60],[140,150,50],[240,210,60],[40,90,50],[220,100,60]];let c={x:60,y:180,vx:0,vy:0},fuel=100,fare=null,wait=null,lives=3,msg='',mt=0;
 const newFare=()=>{const a=ri(5);let b;do{b=ri(5);}while(b===a);wait={from:a,to:b};};newFare();
 g.update=()=>{if(mt)mt--;const k=A.in(0);c.vx+=ax(k)*.06;if(k.a&&fuel>0){c.vy-=.14;fuel-=.08;}c.vy+=.07;c.vx*=.99;c.x+=c.vx;c.y+=c.vy;
  const pad=PADS.findIndex(p=>c.x>p[0]&&c.x<p[0]+p[2]&&c.y+6>=p[1]&&c.y+6-c.vy<=p[1]+2);if(pad>=0&&c.vy>0){if(c.vy>1.6){crash();return;}c.y=PADS[pad][1]-6;c.vy=0;c.vx*=.8;fuel=Math.min(100,fuel+.2);
   if(!fare&&wait&&wait.from===pad){fare=wait;wait=null;msg='PAD '+(fare.to+1)+' PLEASE';mt=90;S('coin');}else if(fare&&fare.to===pad){g.score+=50+Math.round(fuel/2);msg='THANKS! +'+(50+Math.round(fuel/2));mt=70;S('score');fare=null;newFare();}}
  if(c.x<4||c.x>W-4||c.y<22||c.y>H-4||PADS.some(p=>c.x>p[0]&&c.x<p[0]+p[2]&&c.y>p[1]+2&&c.y<p[1]+8))crash();};
 const crash=()=>{lives--;S('boom');A.shake=8;A.burst(c.x,c.y,K.o,20,3);if(lives<=0){g.over='CAB WRECKED';return;}c={x:60,y:180,vx:0,vy:0};fuel=100;};
 g.draw=()=>{A.skyband('#1a1a3a','#4a3a6a',H);for(let i=0;i<30;i++)R((i*97)%W,(i*41)%200,1,1,K.gr);PADS.forEach((p,i)=>{R(p[0],p[1],p[2],6,'#8a8aa0');R(p[0],p[1]+6,p[2],H,'#3a3a4a');T(i+1,p[0]+p[2]/2,p[1]+10,K.y,1,'c');if(wait&&wait.from===i)A.person(p[0]+10,p[1],{c:K.p,s:.6,id:i,arm1:-2.4});if(fare&&fare.to===i&&A.t%30<15)A.box(p[0]-1,p[1]-1,p[2]+2,8,K.g);});
  R(c.x-9,c.y-4,18,8,K.y);R(c.x-5,c.y-8,10,5,'#9fd8ff');R(c.x-3,c.y-10,6,2,K.k);if(A.in(0).a&&fuel>0)A.poly([[c.x-3,c.y+4],[c.x+3,c.y+4],[c.x,c.y+10+rnd(4)]],K.o,1);R(6,6,60,5,K.d);R(6,6,60*fuel/100,5,fuel<25?K.r:K.g);T('SCORE '+g.score,W-6,6,K.w,1,'r');T('LIVES '+lives,W-6,16,K.w,1,'r');if(mt)T(msg,160,24,K.y,1,'c');};
 return g;}});

A.add({id:'smashcity',name:'SMASH CITY',cat:'ACTION',how:'GIANT MONSTER! UP/DOWN CLIMB, A PUNCHES. FLATTEN BUILDINGS, DODGE TANKS.',make(){
 const g={over:null,score:0};let m={x:40,y:200,vx:0,climb:null,f:1,punch:0,hp:100},bld=[],foes=[],shots=[],t=0,lvl=0;
 const gen=()=>{lvl++;bld=[];for(let i=0;i<4;i++){const w=40,h=80+ri(60),x=60+i*62;bld.push({x,w,h,cells:[...Array(Math.floor(h/16)*2)].map(()=>2)});}};gen();
 g.update=()=>{t++;const k=A.in(0),h=A.hit(0);if(m.punch)m.punch--;if(h.a&&!m.punch){m.punch=14;S('hit');const px=m.x+m.f*14,py=m.y-20;for(const b of bld){const cx=Math.floor((px-b.x)/20),cy=Math.floor((200-py)/16);if(px>b.x&&px<b.x+b.w&&cy>=0&&cy<b.cells.length/2){const i=cy*2+cx;if(b.cells[i]>0){b.cells[i]--;g.score+=10;A.burst(px,py,'#8a8a98',6,2);if(b.cells[i]===0)S('boom');}}}for(const f of foes)if(Math.hypot(f.x-px,f.y-py)<14){f.dead=1;g.score+=50;S('boom');A.burst(f.x,f.y,K.o,12,2);}}
  const on=bld.find(b=>Math.abs(m.x-(m.f>0?b.x:b.x+b.w))<8||(m.climb===b));if(m.climb){if(ay(k)){m.y=cl(m.y+ay(k)*1.5,200-m.climb.h+10,200);}if(ax(k)&&Math.sign(ax(k))!==m.f){m.climb=null;}}else{m.x=cl(m.x+ax(k)*1.8,10,W-10);if(ax(k))m.f=ax(k);if(k.u){const b=bld.find(b=>m.x>b.x-12&&m.x<b.x+b.w+12);if(b){m.climb=b;m.x=m.f>0?b.x-6:b.x+b.w+6;}}if(!m.climb)m.y=Math.min(200,m.y+3);}
  bld.forEach(b=>{if(b.cells.filter(c=>c>0).length<b.cells.length*.35&&!b.down){b.down=1;g.score+=200;S('score');A.shake=10;A.burst(b.x+b.w/2,200-b.h/2,'#aaaab8',40,4);if(m.climb===b)m.climb=null;}});bld=bld.filter(b=>!b.down||(b.h=Math.max(0,b.h-3))>0);
  if(t%Math.max(60,150-lvl*15)===0)foes.push(Math.random()<.5?{x:Math.random()<.5?-10:W+10,y:206,k:'tank',vx:0}:{x:Math.random()<.5?-10:W+10,y:40+rnd(60),k:'heli',vx:0});
  foes.forEach(f=>{f.x+=f.k==='tank'?Math.sign(m.x-f.x)*.5:Math.sign(m.x-f.x)*.9;if(f.k==='heli')f.y+=Math.sign(m.y-40-f.y)*.3;if(t%90===0){const dx=m.x-f.x,dy=m.y-20-f.y,d=Math.hypot(dx,dy)||1;shots.push({x:f.x,y:f.y,vx:dx/d*2.2,vy:dy/d*2.2});}});foes=foes.filter(f=>!f.dead);
  shots.forEach(s=>{s.x+=s.vx;s.y+=s.vy;if(Math.abs(s.x-m.x)<12&&Math.abs(s.y-(m.y-20))<20){s.dead=1;m.hp-=6;S('lose');}});shots=shots.filter(s=>!s.dead&&s.x>-10&&s.x<W+10&&s.y>0&&s.y<H);if(m.hp<=0){g.over='MONSTER DOWN';return;}if(!bld.length){g.score+=500;S('win');m.hp=Math.min(100,m.hp+30);gen();}};
 g.draw=()=>{A.skyband('#ff9a5a','#3a2a5a',H);R(0,206,W,34,'#44444e');bld.forEach(b=>{const top=200-b.h;R(b.x,top+(b.down?b.h-b.h:0),b.w,b.h,'#6a6a78');b.cells.forEach((c,i)=>{const cx=i%2,cy=Math.floor(i/2);const x=b.x+cx*20,y=200-(cy+1)*16;if(y<top)return;if(c===0)R(x+2,y+2,16,12,'#1a1a24');else{R(x+4,y+4,5,6,c===2?K.y:'#6a5a2a');R(x+11,y+4,5,6,c===2?K.y:'#6a5a2a');}});});
  foes.forEach(f=>{if(f.k==='tank'){R(f.x-10,f.y-6,20,8,'#4a5a3a');R(f.x-4,f.y-10,8,5,'#4a5a3a');L(f.x,f.y-8,f.x+Math.sign(m.x-f.x)*10,f.y-12,'#333',2);}else{R(f.x-10,f.y-4,20,8,'#3a4a5a');R(f.x-14+(A.t%4)*2,f.y-8,28-(A.t%4)*4,2,K.w);}});shots.forEach(s=>C(s.x,s.y,2,K.y));
  const px=m.x,py=m.y;C(px,py-24,14,'#5a8a3a');C(px+m.f*6,py-32,8,'#6a9a4a');R(px+m.f*6,py-34,3,3,K.r);R(px-8,py-12,6,12,'#4a7a2a');R(px+2,py-12,6,12,'#4a7a2a');R(px+m.f*(m.punch?16:8)-4,py-26,10,7,'#6a9a4a');R(6,6,80,6,K.d);R(6,6,.8*m.hp,6,m.hp>30?K.g:K.r);T('SCORE '+g.score,W-6,6,K.w,1,'r');T('CITY '+lvl,160,6,K.w,1,'c');};
 return g;}});

A.add({id:'roadagent',name:'ROAD AGENT',cat:'CLASSICS',how:'STEER, UP SPEEDS UP, HOLD A TO FIRE. HIT ENEMY CARS, NOT BLUE CIVILIANS.',make(){
 const g={over:null,score:0};let x=160,sp=3,d=0,cars=[],bl=[],lives=3,inv=0,rw=100;
 g.update=()=>{const k=A.in(0);sp=cl(sp+(k.u?.05:k.d?-.08:-.01),2,6);d+=sp;rw=90+Math.sin(d/600)*30;x=cl(x+ax(k)*2.4,160-rw+10,160+rw-10);if(inv)inv--;if(A.fire(7)){bl.push({x,y:196});S('shoot');}bl.forEach(b=>b.y-=7);
  if(A.t%50===0){const civ=Math.random()<.4;cars.push({x:160-rw+20+rnd(rw*2-40),y:-20,v:civ?1.5:2+rnd(1.5),civ,hp:civ?1:2,vx:0});}
  cars.forEach(c=>{c.y+=sp-c.v;if(!c.civ&&c.y>100&&c.y<200)c.vx+=Math.sign(x-c.x)*.03;c.vx*=.95;c.x=cl(c.x+c.vx,160-rw+8,160+rw-8);for(const b of bl)if(Math.abs(b.x-c.x)<9&&Math.abs(b.y-c.y)<14){b.y=-99;c.hp--;if(c.hp<=0){c.dead=1;if(c.civ){g.score=Math.max(0,g.score-200);S('lose');}else{g.score+=150;S('boom');A.burst(c.x,c.y,K.o,16,2.5);}}}if(inv===0&&Math.abs(c.x-x)<14&&Math.abs(c.y-200)<22){c.dead=1;lives--;inv=90;S('boom');A.shake=8;if(lives<=0)g.over='WRECKED';}});
  cars=cars.filter(c=>!c.dead&&c.y<H+30&&c.y>-60);bl=bl.filter(b=>b.y>0);if(A.t%20===0)g.score+=Math.round(sp);};
 g.draw=()=>{A.cls('#3a6a2a');R(160-rw,0,rw*2,H,'#44444e');R(160-rw-4,0,4,H,K.w);R(160+rw,0,4,H,K.w);for(let y=-(d%40);y<H;y+=40)R(159,y,2,20,K.y);cars.forEach(c=>{R(c.x-8,c.y-13,16,26,c.civ?K.b:'#2a2a2a');R(c.x-6,c.y-6,12,8,'#9fd8ff');if(!c.civ)R(c.x-2,c.y+10,4,4,K.r);});bl.forEach(b=>R(b.x-1,b.y,2,6,K.y));
  if(inv%8<5){R(x-9,186,18,28,K.w);R(x-7,192,14,8,'#3a5a8a');R(x-2,184,4,4,K.r);}T('SCORE '+g.score,6,6,K.y,1);T('LIVES '+lives,W-6,6,K.w,1,'r');T(Math.round(sp*30)+' KMH',160,6,K.w,1,'c');};
 return g;}});

A.add({id:'mazebots',name:'MAZE BOTS',cat:'ACTION',how:'SHOOT WITH A WHERE YOU FACE. ELECTRIC WALLS. LEAVE BY ANY OPEN EXIT.',make(){
 const g={over:null,score:0};let p,walls,bots,bl=[],eb=[],room=0,lives=3,fx=1,fy=0,t=0,ghost=0;
 const gen=()=>{room++;walls=[[0,20,W,4],[0,H-4,W,4],[0,20,4,H],[W-4,20,4,H]];const gaps=[[140,20,40,4],[140,H-4,40,4],[0,110,4,40],[W-4,110,4,40]];walls=walls.flatMap(w=>{const gp=gaps.find(q=>(q[3]===4&&w[3]===4&&q[1]===w[1])||(q[2]===4&&w[2]===4&&q[0]===w[0]));if(!gp)return[w];return w[3]===4?[[w[0],w[1],gp[0]-w[0],4],[gp[0]+gp[2],w[1],w[0]+w[2]-gp[0]-gp[2],4]]:[[w[0],w[1],4,gp[1]-w[1]],[w[0],gp[1]+gp[3],4,w[1]+w[3]-gp[1]-gp[3]]];});
  for(let i=1;i<4;i++)for(let j=1;j<3;j++){if(Math.random()<.6)walls.push(Math.random()<.5?[i*80-2,20+j*73-30,4,60]:[i*80-30,20+j*73-2,60,4]);}p={x:20,y:130};bots=[];for(let i=0;i<4+room;i++){let x,y;do{x=40+rnd(260);y=40+rnd(180);}while(Math.hypot(x-p.x,y-p.y)<60||hitW(x,y,6));bots.push({x,y,cd:60+ri(120)});}ghost=0;t=0;};
 const hitW=(x,y,r)=>walls.some(w=>x+r>w[0]&&x-r<w[0]+w[2]&&y+r>w[1]&&y-r<w[1]+w[3]);gen();
 g.update=()=>{t++;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){fx=dx;fy=dy;}const nx=p.x+dx*1.6,ny=p.y+dy*1.6;if(hitW(nx,ny,4)){die();return;}p.x=nx;p.y=ny;if(p.x<-4||p.x>W+4||p.y<16||p.y>H+4){g.score+=bots.length?0:bots.length*0+100;S('win');gen();return;}
  if(A.fire(10)){const m=Math.hypot(fx,fy)||1;bl.push({x:p.x,y:p.y,vx:fx/m*5,vy:fy/m*5});S('shoot');}bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;});bl=bl.filter(b=>!hitW(b.x,b.y,1)&&b.x>0&&b.x<W);
  for(const b of bots){if(--b.cd<=0){b.cd=Math.max(40,120-room*8);const ddx=p.x-b.x,ddy=p.y-b.y,d=Math.hypot(ddx,ddy)||1;eb.push({x:b.x,y:b.y,vx:ddx/d*2,vy:ddy/d*2});}const d=Math.hypot(p.x-b.x,p.y-b.y)||1;const mx=b.x+(p.x-b.x)/d*.25,my=b.y+(p.y-b.y)/d*.25;if(!hitW(mx,my,6)){b.x=mx;b.y=my;}else b.dead=1;for(const q of bl)if(Math.hypot(q.x-b.x,q.y-b.y)<7){b.dead=1;q.x=-99;g.score+=50;S('hit');A.burst(b.x,b.y,K.r,8);}if(d<8){die();return;}}bots=bots.filter(b=>!b.dead);
  eb.forEach(b=>{b.x+=b.vx;b.y+=b.vy;});eb=eb.filter(b=>!hitW(b.x,b.y,1)&&b.x>0&&b.x<W&&b.y>0&&b.y<H);if(eb.some(b=>Math.hypot(b.x-p.x,b.y-p.y)<5)){die();return;}if(t>900){ghost++;}if(ghost>0&&Math.hypot((ghost*.4)-p.x,120-p.y)<10)die();};
 const die=()=>{lives--;S('boom');A.shake=6;if(lives<=0){g.over='SHORT CIRCUITED IN ROOM '+room;return;}room--;gen();};
 g.draw=()=>{A.cls('#050510');walls.forEach(w=>R(w[0],w[1],w[2],w[3],A.t%20<10?'#3a5aff':'#2a4ae0'));bots.forEach(b=>{C(b.x,b.y,6,K.r);R(b.x-4,b.y-2,8,2,K.y);});bl.forEach(b=>R(b.x-1,b.y-1,3,3,K.g));eb.forEach(b=>R(b.x-1,b.y-1,3,3,K.r));A.person(p.x,p.y+8,{c:K.g,s:.45,id:1,st:A.t*.3});if(ghost>0)E('😈',ghost*.4,120,20);T('SCORE '+g.score,6,6,K.y,1);T('ROOM '+room,160,6,K.w,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'moonbuggy',name:'MOON BUGGY',cat:'CLASSICS',how:'UP JUMPS CRATERS AND ROCKS. HOLD A TO FIRE UP AND AHEAD. LEFT/RIGHT CHANGE SPEED.',make(){
 const g={over:null,score:0};let x=80,y=0,vy=0,sp=2,d=0,obs=[],ufos=[],bl=[],eb=[],lives=3,no=150;
 g.update=()=>{const k=A.in(0);sp=cl(sp+ax(k)*.04,1.4,3.4);d+=sp;if(A.hit(0).u&&y===0){vy=4.4;S('jump');}if(y>0||vy>0){y+=vy;vy-=.2;if(y<=0){y=0;vy=0;}}
  if(A.fire(10)){bl.push({x,y:196-y,vx:0,vy:-5},{x:x+10,y:200-y,vx:5,vy:0});S('shoot');}bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;});bl=bl.filter(b=>b.y>0&&b.x<W);
  if((no-=sp)<=0){no=80+rnd(90);obs.push({x:W+20,k:Math.random()<.5?'c':'r',hp:1});}if(A.t%200===0)ufos.push({x:W,y:40+rnd(50),t:0});obs.forEach(o=>o.x-=sp);ufos.forEach(u=>{u.t++;u.x-=1+Math.sin(u.t*.05);if(u.t%80===40)eb.push({x:u.x,y:u.y});});eb.forEach(b=>b.y+=2.2);
  for(const o of obs){if(o.k==='r'){for(const b of bl)if(b.vx&&Math.abs(b.x-o.x)<8&&b.y>190){o.hp=0;b.x=W+99;g.score+=50;S('hit');A.burst(o.x,200,'#8a8a8a',8);}}if(Math.abs(o.x-x)<(o.k==='c'?10:8)&&y<(o.k==='c'?1:8)&&o.hp>0){die();return;}}
  for(const u of ufos)for(const b of bl)if(Math.hypot(b.x-u.x,b.y-u.y)<9){u.dead=1;b.y=-99;g.score+=100;S('boom');A.burst(u.x,u.y,K.p,12);}if(eb.some(b=>Math.abs(b.x-x)<10&&Math.abs(b.y-(200-y))<10)){die();return;}
  obs=obs.filter(o=>o.x>-20&&o.hp>0);ufos=ufos.filter(u=>!u.dead&&u.x>-20);eb=eb.filter(b=>b.y<210);if(A.t%10===0)g.score++;};
 const die=()=>{lives--;S('boom');A.shake=8;A.burst(x,196,K.o,20,3);if(lives<=0){g.over=Math.floor(d/10)+' KM';return;}obs=obs.filter(o=>o.x>x+60);eb=[];y=0;vy=0;};
 g.draw=()=>{A.cls('#05030f');for(let i=0;i<40;i++)R((i*97)%W,(i*53)%150,1,1,K.gr);C(260,40,16,'#3a8ad8');for(let i=0;i<4;i++){const px=((i*120-d*.3)%(W+160)+W+160)%(W+160)-80;A.poly([[px-60,208],[px,150],[px+60,208]],'#3a3a5a',1);}R(0,208,W,32,'#8a7a6a');
  obs.forEach(o=>{if(o.k==='c'){R(o.x-10,208,20,10,'#05030f');}else C(o.x,203,6,'#6a6a6a');});ufos.forEach(u=>{A.c.fillStyle=K.p;A.c.beginPath();A.c.ellipse(u.x,u.y,10,4,0,0,7);A.c.fill();C(u.x,u.y-3,4,'#9fd8ff');});eb.forEach(b=>C(b.x,b.y,2,K.r));bl.forEach(b=>R(b.x-1,b.y-1,3,3,K.y));
  const by=200-y;R(x-12,by-6,24,6,'#c8c8d8');R(x-4,by-10,10,5,'#9fd8ff');C(x-9,by+1,4,'#333');C(x,by+1,4,'#333');C(x+9,by+1,4,'#333');T('SCORE '+g.score,6,6,K.y,1);T(Math.floor(d/10)+' KM',160,6,K.w,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'caveraid',name:'CAVE RAID',cat:'CLASSICS',how:'FLY THE CAVE. A FIRES, B BOMBS. SHOOT FUEL TANKS TO REFUEL. AVOID WALLS.',make(){
 const g={over:null,score:0};let s={x:60,y:100},d=0,fuel=100,bl=[],bombs=[],tgt=[],lives=3,inv=0;const top=x=>30+Math.sin((x+d)*.01)*18+Math.sin((x+d)*.027)*10,bot=x=>200-Math.sin((x+d)*.013+1)*20-Math.sin((x+d)*.031)*8;
 g.update=()=>{d+=2;fuel-=.05;if(inv)inv--;const k=A.in(0);s.x=cl(s.x+ax(k)*2,20,200);s.y+=ay(k)*2;if(A.fire(8)){bl.push({x:s.x+8,y:s.y});S('shoot');}if(A.hit(0).b&&bombs.length<3){bombs.push({x:s.x,y:s.y+4,vx:1.5,vy:0});S('blip');}
  if(A.t%45===0){const x=W+10;tgt.push({x,k:Math.random()<.4?'f':'m',y:bot(x)-8,up:false});}tgt.forEach(t_=>{t_.x-=2;if(t_.k==='m'&&!t_.up&&t_.x<s.x+60&&Math.random()<.03)t_.up=true;if(t_.up)t_.y-=1.6;});bl.forEach(b=>b.x+=6);bombs.forEach(b=>{b.x+=b.vx-2;b.y+=b.vy;b.vy+=.15;});
  for(const t_ of tgt){for(const b of[...bl,...bombs])if(Math.abs(b.x-t_.x)<8&&Math.abs(b.y-t_.y)<10){t_.dead=1;b.x=W+99;g.score+=t_.k==='f'?150:100;if(t_.k==='f')fuel=Math.min(100,fuel+25);S('boom');A.burst(t_.x,t_.y,t_.k==='f'?K.y:K.r,12);}if(inv===0&&Math.abs(t_.x-s.x)<10&&Math.abs(t_.y-s.y)<8)crash();}
  if(inv===0&&(s.y<top(s.x)+4||s.y>bot(s.x)-4))crash();if(fuel<=0){g.over='OUT OF FUEL';return;}bl=bl.filter(b=>b.x<W&&b.y>top(b.x)&&b.y<bot(b.x));bombs=bombs.filter(b=>b.y<bot(b.x));tgt=tgt.filter(t_=>!t_.dead&&t_.x>-10&&t_.y>0);if(A.t%15===0)g.score++;};
 const crash=()=>{lives--;inv=90;S('boom');A.shake=8;A.burst(s.x,s.y,K.o,20,3);s.y=(top(s.x)+bot(s.x))/2;if(lives<=0)g.over='CRASHED';};
 g.draw=()=>{A.cls('#0a0418');A.c.fillStyle='#5a3a2a';A.c.beginPath();A.c.moveTo(0,0);for(let x=0;x<=W;x+=4)A.c.lineTo(x,top(x));A.c.lineTo(W,0);A.c.fill();A.c.beginPath();A.c.moveTo(0,H);for(let x=0;x<=W;x+=4)A.c.lineTo(x,bot(x));A.c.lineTo(W,H);A.c.fill();
  tgt.forEach(t_=>{if(t_.k==='f'){R(t_.x-6,t_.y-8,12,14,K.y);T('F',t_.x,t_.y-5,K.k,1,'c');}else{A.poly([[t_.x,t_.y-10],[t_.x-4,t_.y+6],[t_.x+4,t_.y+6]],K.r,1);}});bl.forEach(b=>R(b.x,b.y-1,5,2,K.c));bombs.forEach(b=>C(b.x,b.y,2.5,K.w));
  if(inv%8<5){A.poly([[s.x+10,s.y],[s.x-8,s.y-5],[s.x-5,s.y],[s.x-8,s.y+5]],K.c,1);R(s.x-12,s.y-1,4,2,K.o);}R(6,6,70,5,K.d);R(6,6,.7*fuel,5,fuel<25?K.r:K.y);T('FUEL',80,5,K.w,1);T('SCORE '+g.score,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'bombhero',name:'BOMB HERO',cat:'CLASSICS',how:'JUMP WITH A (HOLD TO FLOAT). GRAB EVERY BOMB, LIT ONES FIRST. AVOID ROBOTS.',make(){
 const g={over:null,score:0},PL=[[40,170,70],[210,170,70],[120,120,80],[30,80,60],[230,80,60],[130,50,60]];let p,bombs,foes,lvl=0,lit=0,lives=3,inv=0;
 const gen=()=>{lvl++;p={x:160,y:210,vx:0,vy:0};bombs=[];for(let i=0;i<14;i++){const pl=PL[ri(PL.length)];bombs.push({x:pl[0]+8+rnd(pl[2]-16),y:pl[1]-8,got:false});}bombs.push({x:20+rnd(280),y:214,got:false});lit=0;foes=[];for(let i=0;i<1+lvl;i++)foes.push({x:rnd(W),y:30+rnd(150),vx:rnd(2)-1,vy:rnd(2)-1});};gen();
 g.update=()=>{if(inv)inv--;const k=A.in(0);p.vx=ax(k)*2;if(A.hit(0).a&&(p.y>=216||PL.some(q=>p.x>q[0]&&p.x<q[0]+q[2]&&Math.abs(p.y-q[1])<1))){p.vy=-5.5;S('jump');}p.vy+=A.in(0).a&&p.vy>0?.06:.25;p.x=cl(p.x+p.vx,6,W-6);const ny=p.y+p.vy;
  if(p.vy>0){const q=PL.find(q=>p.x>q[0]&&p.x<q[0]+q[2]&&p.y<=q[1]&&ny>=q[1]);if(q){p.y=q[1];p.vy=0;}else p.y=ny;}else p.y=ny;if(p.y>216){p.y=216;p.vy=0;}if(p.y<24){p.y=24;p.vy=0;}
  bombs.forEach((b,i)=>{if(!b.got&&Math.abs(b.x-p.x)<8&&Math.abs(b.y-(p.y-6))<10){b.got=true;const isLit=i===lit;g.score+=isLit?200:50;S(isLit?'score':'coin');if(isLit){lit=bombs.findIndex(q=>!q.got);}else if(!bombs[lit]||bombs[lit].got)lit=bombs.findIndex(q=>!q.got);}});
  if(bombs.every(b=>b.got)){g.score+=1000;S('win');A.confetti();if(lvl>=4){g.over='ALL BOMBS DEFUSED! WIN';return;}gen();}foes.forEach(f=>{f.x+=f.vx*(1+lvl*.2);f.y+=f.vy*(1+lvl*.2);if(f.x<6||f.x>W-6)f.vx*=-1;if(f.y<30||f.y>210)f.vy*=-1;if(inv===0&&Math.hypot(f.x-p.x,f.y-(p.y-8))<10){lives--;inv=90;S('boom');A.shake=6;if(lives<=0)g.over='CAUGHT';}});};
 g.draw=()=>{A.skyband('#1a1a4a','#6a3a5a',H);A.poly([[60,220],[160,60],[260,220]],'#8a6a4a',1);R(0,218,W,22,'#5a4a3a');PL.forEach(q=>{R(q[0],q[1],q[2],5,'#c8a060');R(q[0],q[1]+5,q[2],2,'#8a6030');});bombs.forEach((b,i)=>{if(b.got)return;C(b.x,b.y,5,'#2a2a3a');R(b.x-1,b.y-8,2,3,'#aa8a6a');if(i===lit&&A.t%10<6)C(b.x,b.y-9,2,K.y);});
  foes.forEach(f=>{R(f.x-5,f.y-5,10,10,'#8a8aa0');R(f.x-3,f.y-3,2,2,K.r);R(f.x+1,f.y-3,2,2,K.r);});if(inv%8<5)A.person(p.x,p.y,{c:K.b,pants:K.b,cap:K.r,s:.6,id:2,st:p.vy?1:A.t*.3,arm1:p.vy<0?-2.6:0,arm2:p.vy<0?2.6:0});T('SCORE '+g.score,6,6,K.y,1);T('STAGE '+lvl+'/4',160,6,K.w,1,'c');T('LIVES '+lives,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'rallymaze',name:'RALLY MAZE',cat:'CLASSICS',how:'GRAB ALL 8 FLAGS. B DROPS SMOKE TO STALL CHASERS. WATCH YOUR FUEL.',make(){
 const g={over:null,score:0},N=15,CS=16;let m,p,flags,cops,smoke=[],fuel=100,lvl=0,mvT=0,lives=3;
 const gen=()=>{lvl++;m=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)m.push(x===0||y===0||x===N-1||y===N-1||(x%2===0&&y%2===0)?1:0);for(let i=0;i<14;i++){const x=1+ri(N-2),y=1+ri(N-2);if((x+y)%2===1)m[y*N+x]=1;}m[N+1]=0;p={x:1,y:1,d:[1,0]};flags=[];while(flags.length<8){const x=1+ri(N-2),y=1+ri(N-2);if(!m[y*N+x]&&!flags.some(f=>f.x===x&&f.y===y)&&x+y>6)flags.push({x,y});}cops=[{x:N-2,y:N-2,mv:0,stall:0},{x:N-2,y:1,mv:0,stall:0}].slice(0,1+Math.min(1,lvl-1)+ (lvl>2?0:0));if(lvl>2)cops.push({x:1,y:N-2,mv:0,stall:0});fuel=100;smoke=[];};gen();
 const open=(x,y)=>x>=0&&y>=0&&x<N&&y<N&&!m[y*N+x];
 const bfs=(sx,sy)=>{const D=new Int16Array(N*N).fill(-1),q=[p.y*N+p.x];D[q[0]]=0;while(q.length){const c=q.shift();const cx=c%N,cy=(c/N)|0;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=cx+dx,ny=cy+dy;if(open(nx,ny)&&D[ny*N+nx]<0){D[ny*N+nx]=D[c]+1;q.push(ny*N+nx);}}}return D;};
 g.update=()=>{fuel-=.02+lvl*.004;if(fuel<=0){g.over='OUT OF FUEL';return;}const k=A.in(0);if(ax(k))p.d=[ax(k),0];else if(ay(k))p.d=[0,ay(k)];if(A.hit(0).b&&fuel>8){smoke.push({x:p.x,y:p.y,t:240});fuel-=6;S('blip');}
  if(++mvT>=7){mvT=0;if(open(p.x+p.d[0],p.y+p.d[1])){p.x+=p.d[0];p.y+=p.d[1];}const f=flags.findIndex(q=>q.x===p.x&&q.y===p.y);if(f>=0){flags.splice(f,1);g.score+=100*(9-flags.length);S('coin');if(!flags.length){g.score+=Math.round(fuel)*10;S('win');A.confetti();if(lvl>=4){g.over='RALLY CHAMPION! WIN';return;}gen();return;}}}
  const D=bfs();smoke.forEach(s=>s.t--);smoke=smoke.filter(s=>s.t>0);for(const c of cops){if(c.stall>0){c.stall--;continue;}if(++c.mv<9-lvl)continue;c.mv=0;let best=null,bd=1e9;for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nx=c.x+dx,ny=c.y+dy;if(!open(nx,ny))continue;const v=D[ny*N+nx]+rnd(.9);if(v>=0&&v<bd){bd=v;best=[nx,ny];}}if(best){c.x=best[0];c.y=best[1];}if(smoke.some(s=>s.x===c.x&&s.y===c.y))c.stall=120;if(c.x===p.x&&c.y===p.y){lives--;S('boom');A.shake=8;if(lives<=0){g.over='BUSTED';return;}c.x=N-2;c.y=N-2;c.stall=120;}}};
 g.draw=()=>{A.cls('#2a5a2a');const ox=cl(p.x*CS-160+8,0,N*CS-W),oy=cl(p.y*CS-128+8,-20,N*CS-H+20);for(let y=0;y<N;y++)for(let x=0;x<N;x++){const sx=x*CS-ox,sy=y*CS-oy;if(m[y*N+x]){R(sx,sy,CS,CS,'#3a7a3a');C(sx+8,sy+8,6,'#4a9a4a');}else R(sx,sy,CS,CS,'#8a8a94');}
  smoke.forEach(s=>C(s.x*CS-ox+8,s.y*CS-oy+8,7,'rgba(220,220,220,.7)'));flags.forEach(f=>{R(f.x*CS-ox+6,f.y*CS-oy+2,1,12,K.k);R(f.x*CS-ox+7,f.y*CS-oy+2,6,4,K.y);});cops.forEach(c=>{R(c.x*CS-ox+3,c.y*CS-oy+3,10,10,c.stall?'#666':K.r);R(c.x*CS-ox+5,c.y*CS-oy+2,6,2,A.t%10<5?K.b:K.r);});R(p.x*CS-ox+3,p.y*CS-oy+3,10,10,K.b);R(p.x*CS-ox+5,p.y*CS-oy+5,6,4,'#9fd8ff');
  R(0,0,W,12,'rgba(0,0,0,.6)');R(6,3,70,5,K.d);R(6,3,.7*fuel,5,fuel<25?K.r:K.g);T('FLAGS '+(8-flags.length)+'/8',160,3,K.y,1,'c');T('LIVES '+lives,W-6,3,K.w,1,'r');};
 return g;}});
})();
