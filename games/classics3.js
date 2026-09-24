(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- SPACE DEFENDER ---- */
A.add({id:'defender',name:'SPACE DEFENDER',cat:'CLASSICS',how:'FLY LEFT/RIGHT. A FIRES FORWARD. SAVE THE FALLING PODS.',make(){
 const g={over:null,score:0};let p={x:100,y:120,d:1,vx:0},en=[],bl=[],pods=[],lives=3,inv=0,t=0,cam=0;for(let i=0;i<6;i++)pods.push({x:rnd(1200),y:200,v:0});
 g.update=()=>{t++;const k=A.in(0);if(ax(k))p.d=ax(k);p.vx=(p.vx+ax(k)*.3)*.94;p.x+=p.vx;p.y=cl(p.y+ay(k)*2.5,30,200);if(inv>0)inv--;cam=p.x-160+p.d*60;
  if(A.hit(0).a){bl.push({x:p.x,y:p.y,vx:p.d*7,t:40});S('shoot');}if(t%Math.max(30,90-t/100)===0)en.push({x:p.x+(Math.random()<.5?-400:400),y:30+rnd(100),vx:0,vy:0,c:0});
  bl.forEach(b=>{b.x+=b.vx;b.t--;});bl=bl.filter(b=>b.t>0);
  for(const e of en){const tg=pods.find(q=>q.v===0&&Math.abs(q.x-e.x)<200);if(tg&&!e.c){e.vx=(tg.x-e.x)*.01;e.vy=(tg.y-e.y)*.01;if(Math.abs(tg.x-e.x)<6&&Math.abs(tg.y-e.y)<8){e.c=tg;tg.v=1;}}else if(e.c){e.vy=-.8;e.c.x=e.x;e.c.y=e.y+8;if(e.y<0){e.dead=1;pods.splice(pods.indexOf(e.c),1);S('lose');}}else{e.vx=(p.x-e.x)*.005;e.vy=(p.y-e.y)*.01;}e.x+=e.vx;e.y+=e.vy;
   for(const b of bl)if(Math.abs(b.x-e.x)<8&&Math.abs(b.y-e.y)<8){e.dead=1;b.t=0;g.score+=e.c?150:50;if(e.c){e.c.v=2;}S('hit');}
   if(inv===0&&Math.abs(p.x-e.x)<10&&Math.abs(p.y-e.y)<8){e.dead=1;lives--;inv=90;S('boom');if(lives<=0)g.over='DEFEATED';}}
  en=en.filter(e=>!e.dead);pods.forEach(q=>{if(q.v===2){q.y+=1.5;if(q.y>=200){q.y=200;q.v=0;g.score+=100;S('coin');}}});if(!pods.length)g.over='PODS LOST';};
 g.draw=()=>{A.cls('#05030f');for(let i=0;i<30;i++)R(((i*97-cam*.3)%W+W)%W,(i*53)%200,1,1,K.gr);for(let x=-cam%40-40;x<W;x+=40)A.poly([[x,210],[x+20,190+((x+cam)/40|0)%3*8],[x+40,210]],'#2b2257',1);R(0,210,W,30,'#1a1440');
  pods.forEach(q=>{const x=q.x-cam;if(x>-10&&x<W+10){R(x-4,q.y-8,8,10,K.g);R(x-2,q.y-11,4,3,K.g);}});en.forEach(e=>{const x=e.x-cam;R(x-7,e.y-3,14,6,K.r);R(x-3,e.y-6,6,3,K.r);R(x-2,e.y+3,4,2,K.y);});bl.forEach(b=>R(b.x-cam-3,b.y,6,2,K.y));
  if(inv%8<5){const x=p.x-cam;A.poly([[x+p.d*12,p.y],[x-p.d*8,p.y-5],[x-p.d*8,p.y+5]],K.c,1);R(x-p.d*10-2,p.y-2,4,4,K.o);}
  T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives+'  PODS '+pods.length,W-6,4,K.w,2,'r');R(100,224,120,8,K.d);pods.forEach(q=>R(100+((q.x%1200+1200)%1200)/10,225,2,6,K.g));en.forEach(e=>R(100+((e.x%1200+1200)%1200)/10,225,2,6,K.r));R(100+((p.x%1200+1200)%1200)/10,225,2,6,K.c);};
 return g;}});

/* ---- BUBBLE POP ---- */
A.add({id:'bubbles',name:'BUBBLE POP',cat:'CLASSICS',how:'LEFT/RIGHT AIM. A SHOOTS. MATCH 3 TO POP.',make(){
 const g={over:null,score:0},CW=14,CO=[K.r,K.y,K.g,K.b,K.p];let grid={},ang=-1.57,sh=null,nxt=ri(5),shots=0;
 const key=(c,r)=>c+','+r;const pos=(c,r)=>[20+c*20+(r%2?10:0),20+r*17];
 for(let r=0;r<5;r++)for(let c=0;c<CW-(r%2);c++)grid[key(c,r)]=ri(5);
 const nb=(c,r)=>r%2?[[c-1,r],[c+1,r],[c,r-1],[c+1,r-1],[c,r+1],[c+1,r+1]]:[[c-1,r],[c+1,r],[c-1,r-1],[c,r-1],[c-1,r+1],[c,r+1]];
 const flood=(c,r,same)=>{const seen=new Set(),st=[[c,r]],col=grid[key(c,r)];while(st.length){const[x,y]=st.pop(),k=key(x,y);if(seen.has(k)||!(k in grid))continue;if(same&&grid[k]!==col)continue;seen.add(k);nb(x,y).forEach(n=>st.push(n));}return seen;};
 g.update=()=>{if(sh){sh.x+=sh.vx;sh.y+=sh.vy;if(sh.x<8||sh.x>W-8)sh.vx*=-1;let land=sh.y<24;for(const k in grid){const[c,r]=k.split(',').map(Number),[px,py]=pos(c,r);if(Math.hypot(px-sh.x,py-sh.y)<18){land=true;break;}}
   if(land){let r=Math.round((sh.y-20)/17);r=Math.max(0,r);let c=Math.round((sh.x-20-(r%2?10:0))/20);c=cl(c,0,CW-1-(r%2));while(key(c,r) in grid)r++;grid[key(c,r)]=sh.col;const grp=flood(c,r,true);if(grp.size>=3){grp.forEach(k=>delete grid[k]);g.score+=grp.size*10;S('score');const anch=new Set();for(const k in grid)if(k.endsWith(',0'))flood(...k.split(',').map(Number),false).forEach(x=>anch.add(x));for(const k in grid)if(!anch.has(k)){delete grid[k];g.score+=20;}}else S('hit');sh=null;shots++;if(shots%6===0){const ng={};for(const k in grid){const[c,r]=k.split(',').map(Number);ng[key(c,r+1)]=grid[k];}grid=ng;for(let c=0;c<CW;c++)grid[key(c,0)]=ri(5);}
    if(Object.keys(grid).some(k=>+k.split(',')[1]>=11))g.over='OVERFLOW';if(!Object.keys(grid).length)g.over='BOARD CLEAR! WIN';}return;}
  const k=A.in(0);ang=cl(ang+ax(k)*.03,-2.9,-.25);if(A.hit(0).a){sh={x:160,y:222,vx:Math.cos(ang)*5,vy:Math.sin(ang)*5,col:nxt};nxt=ri(5);S('shoot');}};
 g.draw=()=>{A.cls();for(const k in grid){const[c,r]=k.split(',').map(Number),[x,y]=pos(c,r);C(x,y,9,CO[grid[k]]);C(x-3,y-3,2,'rgba(255,255,255,.6)');}R(0,206,W,1,K.r);if(!sh)for(let i=1;i<7;i++)C(160+Math.cos(ang)*i*14,222+Math.sin(ang)*i*14,1.5,K.gr);
  C(160,222,9,sh?CO[nxt]:CO[nxt]);if(sh)C(sh.x,sh.y,9,CO[sh.col]);T('SCORE '+g.score,6,224,K.y,1);};
 return g;}});

/* ---- KEY QUEST ---- */
A.add({id:'keyquest',name:'KEY QUEST',cat:'CLASSICS',how:'GRAB EVERY KEY, THEN THE DOOR. A JUMPS. SPIKES HURT.',make(){
 const g={over:null,score:0};let lvl=0,p,pl,keys,spikes,door,lives=3;
 const build=()=>{lvl++;pl=[{x:0,y:220,w:W},{x:20,y:170,w:80},{x:140,y:150,w:70},{x:240,y:170,w:70},{x:60,y:110,w:60},{x:180,y:100,w:90},{x:10,y:60,w:70},{x:220,y:50,w:80}];keys=[];for(let i=0;i<4+Math.min(3,lvl);i++){const q=pl[1+ri(pl.length-1)];keys.push({x:q.x+10+rnd(q.w-20),y:q.y-10});}spikes=[];for(let i=0;i<lvl+1;i++){const q=pl[ri(pl.length)];spikes.push({x:q.x+10+rnd(Math.max(1,q.w-30)),y:q.y});}door={x:260,y:50};p={x:20,y:220,vy:0};};build();
 g.update=()=>{const k=A.in(0);p.x=cl(p.x+ax(k)*2.2,6,W-6);const on=pl.find(q=>p.vy>=0&&Math.abs(p.y-q.y)<4&&p.x>=q.x&&p.x<=q.x+q.w);if(on){p.y=on.y;p.vy=0;if(A.hit(0).a){p.vy=-5.4;S('jump');}}else{p.vy+=.25;}const oy=p.y;p.y+=p.vy;if(p.vy>0){const q=pl.find(q=>oy<=q.y&&p.y>=q.y&&p.x>=q.x&&p.x<=q.x+q.w);if(q){p.y=q.y;p.vy=0;}}
  keys=keys.filter(kk=>{if(Math.abs(kk.x-p.x)<9&&Math.abs(kk.y-(p.y-10))<12){g.score+=50;S('coin');return false;}return true;});
  if(spikes.some(s=>Math.abs(s.x-p.x)<9&&Math.abs(s.y-p.y)<6)){lives--;S('boom');if(lives<=0){g.over='GAME OVER';return;}p={x:20,y:220,vy:0};}
  if(!keys.length&&Math.abs(door.x-p.x)<12&&Math.abs(door.y-p.y)<6){g.score+=200;S('win');build();}};
 g.draw=()=>{A.cls('#1a1238');pl.forEach(q=>{R(q.x,q.y,q.w,6,'#6a4fb5');R(q.x,q.y,q.w,2,'#8d78d6');});spikes.forEach(s=>{for(let i=0;i<3;i++)A.poly([[s.x-6+i*6,s.y],[s.x-3+i*6,s.y-7],[s.x+i*6,s.y]],K.r,1);});
  keys.forEach(kk=>{C(kk.x,kk.y-3,3,K.y);R(kk.x-1,kk.y-1,2,7,K.y);R(kk.x,kk.y+4,3,2,K.y);});R(door.x-7,door.y-22,14,22,keys.length?'#5b3a1e':K.g);C(door.x+3,door.y-11,1.5,K.y);
  R(p.x-5,p.y-16,10,10,K.c);R(p.x-4,p.y-22,8,7,'#ffd9a8');R(p.x-5,p.y-6,4,6,K.w);R(p.x+1,p.y-6,4,6,K.w);T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives+'  KEYS '+keys.length,W-6,6,K.w,2,'r');};
 return g;}});

/* ---- TUNNEL DIGGER ---- */
A.add({id:'digger',name:'TUNNEL DIGGER',cat:'CLASSICS',how:'DIG THROUGH DIRT. A INFLATES NEARBY MONSTERS. CLEAR THEM ALL.',make(){
 const g={over:null,score:0},GW=20,GH=12,CS=16,OX=0,OY=32;let m,p,mons,lives=3,lvl=0,fr=0;
 const build=()=>{lvl++;m=[];for(let y=0;y<GH;y++){m.push([]);for(let x=0;x<GW;x++)m[y].push(y===0?0:1);}p={x:10,y:0,mv:0,fx:1,fy:0};mons=[];for(let i=0;i<2+lvl;i++){const x=ri(GW),y=2+ri(GH-2);mons.push({x,y,mv:0,inf:0});for(let dx=-1;dx<=1;dx++)if(m[y][cl(x+dx,0,GW-1)])m[y][cl(x+dx,0,GW-1)]=0;}};build();
 g.update=()=>{if(fr>0)fr--;const k=A.in(0);if(p.mv>0)p.mv--;else{const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){p.fx=dx;p.fy=dy;const nx=p.x+dx,ny=p.y+dy;if(nx>=0&&ny>=0&&nx<GW&&ny<GH){p.x=nx;p.y=ny;p.mv=m[ny][nx]?8:5;if(m[ny][nx]){m[ny][nx]=0;g.score++;}}}}
  if(A.hit(0).a){const t=mons.find(q=>q.x===p.x+p.fx&&q.y===p.y+p.fy||q.x===p.x+2*p.fx&&q.y===p.y+2*p.fy);if(t){t.inf+=1;S('blip');if(t.inf>=4){mons.splice(mons.indexOf(t),1);g.score+=100;S('score');}}}
  for(const q of mons){if(q.inf>0){if(A.t%30===0)q.inf--;continue;}if(q.mv>0){q.mv--;continue;}q.mv=Math.max(6,14-lvl*2);const ds=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>{const x=q.x+d[0],y=q.y+d[1];return x>=0&&y>=0&&x<GW&&y<GH&&!m[y][x];});if(!ds.length)continue;ds.sort((a,b)=>Math.hypot(q.x+a[0]-p.x,q.y+a[1]-p.y)-Math.hypot(q.x+b[0]-p.x,q.y+b[1]-p.y));const d=Math.random()<.65?ds[0]:ds[ri(ds.length)];q.x+=d[0];q.y+=d[1];
   if(q.x===p.x&&q.y===p.y){lives--;S('boom');if(lives<=0){g.over='GAME OVER';return;}p={x:10,y:0,mv:0,fx:1,fy:0};fr=60;}}
  if(!mons.length){g.score+=500;S('win');build();}};
 g.draw=()=>{A.cls('#4dabff');m.forEach((row,y)=>row.forEach((v,x)=>{if(v)R(OX+x*CS,OY+y*CS,CS,CS,['#b5651d','#a0521a','#8a4a1d','#7a3f18'][Math.min(3,y/3|0)]);}));R(0,OY,W,1,'#1e8a45');
  mons.forEach(q=>{const s=8+q.inf*3;R(OX+q.x*CS+8-s/2,OY+q.y*CS+8-s/2,s,s,q.inf?K.o:K.r);R(OX+q.x*CS+5,OY+q.y*CS+5,2,2,K.w);R(OX+q.x*CS+9,OY+q.y*CS+5,2,2,K.w);});
  if(fr%8<5){R(OX+p.x*CS+3,OY+p.y*CS+4,10,10,K.c);R(OX+p.x*CS+4,OY+p.y*CS+1,8,4,K.w);R(OX+p.x*CS+8+p.fx*7,OY+p.y*CS+8+p.fy*7,3,3,K.y);}T('SCORE '+g.score,6,6,K.k,2);T('LIVES '+lives+'  LV '+lvl,W-6,6,K.k,2,'r');};
 return g;}});

/* ---- MILLIPEDE ---- */
A.add({id:'millipede',name:'MILLIPEDE',cat:'CLASSICS',how:'MOVE. A FIRES. SHOOT THE CHAIN, IT SPLITS.',make(){
 const g={over:null,score:0},GW=32,GH=24;let mush=new Set(),segs=[],p={x:16,y:22},sh=null,lives=3,wave=0,t=0;for(let i=0;i<30;i++)mush.add(ri(GW)+','+(1+ri(GH-6)));
 const spawn=()=>{wave++;for(let i=0;i<8+wave;i++)segs.push({x:i,y:0,d:1,h:i===0});};spawn();
 g.update=()=>{t++;const k=A.in(0);if(t%3===0){p.x=cl(p.x+ax(k),0,GW-1);p.y=cl(p.y+ay(k),GH-5,GH-1);}if(A.hit(0).a&&!sh){sh={x:p.x,y:p.y};S('shoot');}
  if(sh){sh.y--;const key=sh.x+','+sh.y;if(mush.has(key)){mush.delete(key);sh=null;g.score++;}else{const i=segs.findIndex(s=>s.x===sh.x&&s.y===sh.y);if(i>=0){mush.add(sh.x+','+sh.y);segs.splice(i,1);if(segs[i])segs[i].h=true;sh=null;g.score+=10;S('hit');}}if(sh&&sh.y<0)sh=null;}
  if(t%Math.max(2,6-wave)===0)for(const s of segs){let nx=s.x+s.d;if(nx<0||nx>=GW||mush.has(nx+','+s.y)){s.d*=-1;s.y++;if(s.y>=GH){s.y=GH-5;}}else s.x=nx;if(s.x===p.x&&s.y===p.y){lives--;S('boom');if(lives<=0){g.over='GAME OVER';return;}p={x:16,y:22};segs.forEach(q=>{q.y=Math.min(q.y,10);});}}
  if(!segs.length)spawn();};
 g.draw=()=>{A.cls();mush.forEach(k=>{const[x,y]=k.split(',');R(x*10+1,y*10+1,8,8,K.g);R(x*10+2,y*10+1,6,3,K.w);});segs.forEach(s=>{R(s.x*10+1,s.y*10+1,8,8,s.h?K.r:K.p);});if(sh)R(sh.x*10+4,sh.y*10,2,8,K.y);R(p.x*10+2,p.y*10+1,6,8,K.c);T('SCORE '+g.score,6,0,K.y,1);T('LIVES '+lives+'  WAVE '+wave,W-6,0,K.w,1,'r');};
 return g;}});

/* ---- CUBE HOP ---- */
A.add({id:'cubehop',name:'CUBE HOP',cat:'CLASSICS',how:'HOP DIAGONALLY WITH THE ARROWS. TURN EVERY CUBE YOUR COLOUR. DODGE THE BALLS.',make(){
 const g={over:null,score:0},N=7;let cubes={},p,balls=[],lives=3,lvl=0,mv=0,t=0;
 const key=(r,c)=>r+','+c;const build=()=>{lvl++;cubes={};for(let r=0;r<N;r++)for(let c=0;c<=r;c++)cubes[key(r,c)]=0;p={r:0,c:0};balls=[];};build();
 const px=(r,c)=>[160+(c-r/2)*32,40+r*24];
 g.update=()=>{t++;if(mv>0)mv--;const h=A.hit(0);if(mv===0){let d=null;if(h.u&&h.l||h.u&&!h.r&&!h.l&&false)d=null;if(h.u)d=[-1,ax(A.in(0))>=0?0:-1];if(h.d)d=[1,ax(A.in(0))>0?1:0];if(h.l&&!h.u&&!h.d)d=[-1,-1];if(h.r&&!h.u&&!h.d)d=[1,1];if(d){const nr=p.r+d[0],nc=p.c+d[1];if(!(key(nr,nc) in cubes)){lives--;S('boom');if(lives<=0){g.over='FELL OFF';return;}p={r:0,c:0};}else{p.r=nr;p.c=nc;if(cubes[key(nr,nc)]===0){cubes[key(nr,nc)]=1;g.score+=25;S('blip');}mv=8;if(Object.values(cubes).every(v=>v)){g.score+=500;S('win');build();}}}}
  if(t%Math.max(60,150-lvl*15)===0)balls.push({r:0,c:0,mv:0,t:0});for(const b of balls){if(++b.mv>Math.max(10,22-lvl*2)){b.mv=0;b.r++;b.c+=ri(2);if(b.r>=N)b.dead=1;}if(b.r===p.r&&b.c===p.c&&!b.dead){lives--;S('boom');b.dead=1;if(lives<=0){g.over='SQUASHED';return;}p={r:0,c:0};}}balls=balls.filter(b=>!b.dead);};
 g.draw=()=>{A.cls('#1a1238');for(let r=0;r<N;r++)for(let c=0;c<=r;c++){const[x,y]=px(r,c),on=cubes[key(r,c)];A.poly([[x,y],[x+16,y+8],[x,y+16],[x-16,y+8]],on?K.c:K.o,1);A.poly([[x-16,y+8],[x,y+16],[x,y+30],[x-16,y+22]],on?'#178a7d':'#a0521a',1);A.poly([[x,y+16],[x+16,y+8],[x+16,y+22],[x,y+30]],on?'#0f5a52':'#7a3f18',1);}
  balls.forEach(b=>{const[x,y]=px(b.r,b.c);C(x,y-2,6,K.r);});const[x,y]=px(p.r,p.c);R(x-5,y-12,10,10,K.y);R(x-4,y-4,8,6,K.y);R(x+2,y-10,4,3,K.k);R(x+4,y-8,5,2,K.o);
  T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives+'  LV '+lvl,W-6,6,K.w,2,'r');T('UP=BACK-LEFT  RIGHT=DOWN-RIGHT  ETC',160,226,K.gr,1,'c');};
 return g;}});

/* ---- GALAXY WAVE ---- */
A.add({id:'galaxy',name:'GALAXY WAVE',cat:'CLASSICS',how:'MOVE. A FIRES. ENEMIES DIVE AT YOU.',make(){
 const g={over:null,score:0};let px=160,en=[],bl=[],eb=[],lives=3,inv=0,t=0,wave=0;
 const spawn=()=>{wave++;en=[];for(let r=0;r<4;r++)for(let c=0;c<8;c++)en.push({hx:60+c*28,hy:40+r*18,x:60+c*28,y:-20-r*18,st:0,r,dt:0});};spawn();
 g.update=()=>{t++;px=cl(px+ax(A.in(0))*3,10,W-10);if(inv>0)inv--;if(A.hit(0).a&&bl.length<3){bl.push({x:px,y:210});S('shoot');}bl.forEach(b=>b.y-=6);bl=bl.filter(b=>b.y>0);
  for(const e of en){if(e.st===0){e.x+=(e.hx+Math.sin(t*.03)*10-e.x)*.05;e.y+=(e.hy-e.y)*.05;if(Math.random()<.0015*wave&&t>120){e.st=1;e.dt=0;}}else{e.dt++;e.x=e.hx+Math.sin(e.dt*.05)*(px-e.hx)*1.2;e.y=e.hy+e.dt*2.2;if(e.dt%40===20)eb.push({x:e.x,y:e.y});if(e.y>H+10){e.y=-20;e.st=0;}}
   for(const b of bl)if(Math.abs(b.x-e.x)<8&&Math.abs(b.y-e.y)<8){e.dead=1;b.y=-9;g.score+=e.st?80:(4-e.r)*10+10;S('hit');}
   if(inv===0&&Math.abs(px-e.x)<10&&Math.abs(210-e.y)<10){e.dead=1;lives--;inv=90;S('boom');if(lives<=0)g.over='GAME OVER';}}
  en=en.filter(e=>!e.dead);for(const b of eb){b.y+=3;if(inv===0&&Math.abs(b.x-px)<6&&Math.abs(b.y-212)<8){b.y=999;lives--;inv=90;S('boom');if(lives<=0)g.over='GAME OVER';}}eb=eb.filter(b=>b.y<H);if(!en.length){g.score+=200;S('win');spawn();}};
 g.draw=()=>{A.cls();for(let i=0;i<40;i++)R((i*97)%W,((i*53)+t*(i%3+1)*.5)%H,1,1,i%4?K.gr:K.w);en.forEach(e=>{const c=[K.p,K.r,K.c,K.c][e.r];R(e.x-6,e.y-3,12,6,c);R(e.x-9,e.y-1,3,4,c);R(e.x+6,e.y-1,3,4,c);R(e.x-2,e.y-6,4,3,K.y);});
  bl.forEach(b=>R(b.x-1,b.y,2,6,K.w));eb.forEach(b=>R(b.x-1,b.y,2,5,K.r));if(inv%8<5){R(px-8,214,16,5,K.c);R(px-2,208,4,6,K.c);R(px-1,205,2,3,K.w);}T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives+'  WAVE '+wave,W-6,4,K.w,2,'r');};
 return g;}});

/* ---- ASTRO MINER ---- */
A.add({id:'miner',name:'ASTRO MINER',cat:'CLASSICS',how:'DRILL DOWN WITH THE ARROWS. GRAB GEMS. UP TO THE SURFACE TO SELL BEFORE FUEL RUNS OUT.',make(){
 const g={score:0,over:null},GW=20,CS=16;let m=[],p={x:10,y:0,mv:0},fuel=300,cargo=0,cam=0,depthMax=0;
 const row=y=>{const r=[];for(let x=0;x<GW;x++){const v=Math.random();r.push(y<1?0:v<.08?3:v<.14?2:v<.2?0:1);}return r;};for(let i=0;i<60;i++)m.push(row(i));
 g.update=()=>{if(p.mv>0){p.mv--;return;}const k=A.in(0),dx=ax(k),dy=dx?0:ay(k);if(dx||dy){const nx=cl(p.x+dx,0,GW-1),ny=Math.max(0,p.y+dy);if(ny>=m.length)m.push(row(ny));const v=m[ny][nx];if(dy<0&&m[ny][nx]===1){}else{p.x=nx;p.y=ny;p.mv=v?7:4;fuel-=v?2:1;if(v===2){cargo+=10;S('coin');}if(v===3){cargo+=50;S('coin');}m[ny][nx]=0;if(v===1)S('blip');}depthMax=Math.max(depthMax,p.y);
   if(p.y===0&&cargo){g.score+=cargo;fuel=Math.min(300,fuel+cargo);cargo=0;S('score');}}if(fuel<=0){g.score+=cargo;g.over='OUT OF FUEL';}};
 g.draw=()=>{A.cls('#4dabff');const tc=p.y*CS-100;cam+=(Math.max(0,tc)-cam)*.2;for(let y=0;y<m.length;y++){const sy=y*CS+30-cam;if(sy<-CS||sy>H)continue;for(let x=0;x<GW;x++){const v=m[y][x];if(v)R(x*CS,sy,CS,CS,v===1?['#b5651d','#8a4a1d','#5b3a1e'][Math.min(2,y/10|0)]:'#4a4570');if(v===2)R(x*CS+4,sy+4,8,8,K.c);if(v===3)A.poly([[x*CS+8,sy+2],[x*CS+14,sy+8],[x*CS+8,sy+14],[x*CS+2,sy+8]],K.y,1);}}
  R(0,30-cam,W,3,'#1e8a45');const py=p.y*CS+30-cam;R(p.x*CS+2,py+3,12,10,K.o);R(p.x*CS+5,py,6,4,K.w);R(p.x*CS+6,py+13,4,3,K.k);T('CASH '+g.score+'  CARGO '+cargo,6,6,K.k,1);T('FUEL '+fuel,W-6,6,fuel<60?K.r:K.k,2,'r');};
 return g;}});
})();
