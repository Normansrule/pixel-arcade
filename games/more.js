(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};

/* ---- COIN DASH 3D ---- */
A.add({id:'coindash',name:'COIN DASH 3D',cat:'RETRO 3D',hd:1,how:'RUN AROUND THE ARENA. GRAB COINS. AVOID THE ROLLERS. 60 SEC.',make(){
 const g={over:null,score:0};let p={x:0,z:0,a:0},coins=[],rollers=[],time=3600,inv=0;for(let i=0;i<12;i++)coins.push({x:rnd(40)-20,z:rnd(40)-20});for(let i=0;i<4;i++)rollers.push({x:rnd(40)-20,z:rnd(40)-20,a:rnd(6.28),v:.08+rnd(.05)});
 g.update=()=>{time--;if(inv>0)inv--;const k=A.in(0),dx=ax(k),dz=-ay(k);if(dx||dz){p.a=Math.atan2(dx,dz);p.x=cl(p.x+dx*.16,-22,22);p.z=cl(p.z+dz*.16,-22,22);}
  coins=coins.filter(c=>{if(Math.hypot(c.x-p.x,c.z-p.z)<1){g.score+=10;S('coin');coins.push({x:rnd(40)-20,z:rnd(40)-20});return false;}return true;});
  for(const r of rollers){r.x+=Math.sin(r.a)*r.v;r.z+=Math.cos(r.a)*r.v;if(Math.abs(r.x)>22||Math.abs(r.z)>22){r.a+=3.14+rnd(1)-.5;}if(inv===0&&Math.hypot(r.x-p.x,r.z-p.z)<1.5){inv=60;g.score=Math.max(0,g.score-20);S('boom');}}
  if(time<=0)g.over='TIME UP';};
 g.draw=()=>{A.skyband('#1a0a44','#ff3f8e',130);A.fog={col:'#3a1060',near:20,far:50};A.cam.x=p.x;A.cam.y=8;A.cam.z=p.z-11;A.cam.ry=0;A.cam.rx=-.6;
  for(let i=-22;i<22;i+=4)for(let j=-22;j<22;j+=4)F([[i,0,j],[i+4,0,j],[i+4,0,j+4],[i,0,j+4]],((i+j)/4)%2?'#2b2257':'#231b4a');for(let i=-22;i<=22;i+=4){B3(i,0,-22.5,4,1,1,'#4a4570');B3(i,0,22.5,4,1,1,'#4a4570');B3(-22.5,0,i,1,1,4,'#4a4570');B3(22.5,0,i,1,1,4,'#4a4570');}
  coins.forEach(c=>{A.shadow3(c.x,c.z,.6,.6);A.cyl3(c.x,.5+Math.sin(A.t*.1+c.x)*.15,c.z,.35,.12,K.y,8,'x');});rollers.forEach(r=>{A.shadow3(r.x,r.z,1.6,1.6);A.cyl3(r.x,.7,r.z,.7,1.4,K.r,10,'x');});
  if(inv%6<4){A.shadow3(p.x,p.z,1,1);B3(p.x,.1,p.z,.6,.9,.6,K.c);B3(p.x,1,p.z,.5,.5,.5,'#ffd9a8');const s=Math.sin(p.a),c=Math.cos(p.a);B3(p.x+s*.3,1.05,p.z+c*.3,.15,.15,.15,K.k);}A.flush();A.fog=null;
  T('SCORE '+g.score,6,4,K.y,2);T(Math.ceil(time/60),W-6,4,K.w,2,'r');};
 return g;}});

/* ---- FROST PEAK ---- */
A.add({id:'frost',name:'FROST PEAK',cat:'CLASSICS',how:'A JUMPS. BREAK THROUGH FLOORS ABOVE YOU. CLIMB BEFORE THE ICE FALLS.',make(){
 const g={over:null,score:0};let p={x:160,y:200,vy:0},floors=[],cam=0,fall=[];for(let i=0;i<40;i++){const f=[];for(let x=0;x<10;x++)f.push(x===0||x===9?2:Math.random()<.15?0:1);floors.push(f);}
 const at=(x,y)=>{const r=Math.round((220-y)/48),c=Math.floor(x/32);return floors[r]&&floors[r][c];};
 g.update=()=>{const k=A.in(0);p.x=(p.x+ax(k)*2.2+W)%W;const row=(220-p.y)/48,onF=Math.abs(row-Math.round(row))<.03&&at(p.x,p.y)&&p.vy>=0;
  if(onF){p.vy=0;p.y=220-Math.round(row)*48;if(A.hit(0).a){p.vy=-7.2;S('jump');}}else{p.vy+=.28;}const oy=p.y;p.y+=p.vy;
  if(p.vy<0){const r=Math.round((220-(p.y-30))/48),c=Math.floor(p.x/32);if(floors[r]&&floors[r][c]===1&&(220-r*48)>p.y-30&&(220-r*48)<oy-30+1){floors[r][c]=0;p.vy=1;fall.push({x:c*32,y:220-r*48,vy:0});S('hit');g.score+=5;}}
  if(p.vy>0){const r=Math.round((220-p.y)/48),fy=220-r*48;if(oy<=fy&&p.y>=fy&&floors[r]&&floors[r][Math.floor(p.x/32)]){p.y=fy;p.vy=0;}}
  const want=p.y-150;if(want<cam)cam=want;g.score=Math.max(g.score,-cam/10|0);fall.forEach(f=>{f.vy+=.3;f.y+=f.vy;});fall=fall.filter(f=>f.y<cam+H+40);if(p.y>cam+H+30)g.over='FELL';if(g.score>360)g.over='SUMMIT! WIN';};
 g.draw=()=>{A.cls('#0a1a44');for(let i=0;i<20;i++)R((i*89)%W,((i*47-cam*.2)%H+H)%H,1,1,K.w);floors.forEach((f,r)=>{const y=220-r*48-cam;if(y<-10||y>H)return;f.forEach((v,c)=>{if(v===1){R(c*32,y,32,8,'#9fd8ff');R(c*32,y,32,2,K.w);}else if(v===2){R(c*32,y-40,32,48,'#4a6a9a');R(c*32+4,y-36,24,40,'#5a7aaa');}});});
  fall.forEach(f=>R(f.x,f.y-cam,32,8,'#9fd8ff'));const y=p.y-cam;R(p.x-6,y-20,12,14,K.o);R(p.x-4,y-26,8,7,'#ffd9a8');R(p.x-6,y-6,4,6,K.b);R(p.x+2,y-6,4,6,K.b);T('HEIGHT '+g.score,160,6,K.w,2,'c');};
 return g;}});

/* ---- DRONE DROP ---- */
A.add({id:'drone',name:'DRONE DROP',cat:'SIM',how:'FLY. PICK UP PARCELS, A DROPS ONTO THE MARKED ROOF. BATTERY DRAINS. 90 SEC.',make(){
 const g={over:null,score:0};let d={x:160,y:60,vx:0,vy:0,has:false},bld=[],time=5400,tgt=0,pick={x:0,y:0};for(let i=0;i<7;i++)bld.push({x:20+i*42,w:30,h:40+ri(80)});const newT=()=>{tgt=ri(7);pick={x:rnd(W-40)+20,y:200};};newT();
 g.update=()=>{time--;const k=A.in(0);d.vx=(d.vx+ax(k)*.15)*.95;d.vy=(d.vy+ay(k)*.15)*.95;d.x=cl(d.x+d.vx,8,W-8);d.y=cl(d.y+d.vy,20,H-8);if(!d.has&&Math.hypot(d.x-pick.x,d.y-pick.y)<12){d.has=true;S('blip');}
  if(A.hit(0).a&&d.has){d.has=false;const b=bld[tgt];if(d.x>b.x&&d.x<b.x+b.w&&d.y<H-b.h-4&&d.y>H-b.h-40){g.score+=100;S('score');}else{g.score=Math.max(0,g.score-20);S('lose');}newT();}
  if(bld.some(b=>d.x>b.x-4&&d.x<b.x+b.w+4&&d.y>H-b.h-4)){d.y=Math.min(d.y,H-bld.find(b=>d.x>b.x-4&&d.x<b.x+b.w+4).h-5);d.vy=-Math.abs(d.vy)*.5;}if(time<=0)g.over='SHIFT OVER';};
 g.draw=()=>{A.cls('#ffb060');A.skyband('#4dabff','#ffb060',200);bld.forEach((b,i)=>{R(b.x,H-b.h,b.w,b.h,i===tgt?'#3a5a8a':'#2a2a48');for(let y=H-b.h+6;y<H-6;y+=10)for(let x=b.x+4;x<b.x+b.w-4;x+=8)R(x,y,4,5,(x+y)%3?K.y:'#111');if(i===tgt){R(b.x+4,H-b.h-2,b.w-8,3,A.t%20<10?K.g:K.y);T('X',b.x+b.w/2,H-b.h-14,K.g,2,'c');}});
  if(!d.has)R(pick.x-6,pick.y-6,12,12,'#8a5c33');R(d.x-14,d.y-2,28,4,K.w);R(d.x-4,d.y-6,8,10,K.c);[-12,12].forEach(o=>{R(d.x+o-6,d.y-6,12,2,A.t%2?K.gr:K.w);});if(d.has)R(d.x-5,d.y+6,10,8,'#8a5c33');
  T('SCORE '+g.score,6,4,K.k,2);T(Math.ceil(time/60),W-6,4,K.k,2,'r');T(d.has?'A DROPS ON THE X ROOF':'GRAB THE PARCEL',160,4,K.k,1,'c');};
 return g;}});

/* ---- LASER MAZE ---- */
A.add({id:'lasermaze',name:'LASER MAZE',cat:'PUZZLE',how:'A ROTATES A MIRROR. BOUNCE THE BEAM INTO THE TARGET.',make(){
 const g={over:null,score:0},N=7;let grid=[],c={x:3,y:3},lvl=0,src,tgt,path=[];
 const gen=()=>{lvl++;grid=[];for(let i=0;i<N*N;i++)grid.push(Math.random()<.35?{m:ri(2)}:null);src={x:0,y:ri(N),d:[1,0]};tgt={x:N-1,y:ri(N)};grid[src.y*N+src.x]=null;grid[tgt.y*N+tgt.x]=null;let n=0;while(!solvable()&&n++<200){const i=ri(N*N);if(i!==src.y*N+src.x&&i!==tgt.y*N+tgt.x)grid[i]=Math.random()<.5?{m:ri(2)}:null;}};
 const trace=()=>{path=[];let x=src.x,y=src.y,d=src.d.slice(),n=0;while(n++<60){path.push([x,y]);if(x===tgt.x&&y===tgt.y)return true;const cell=grid[y*N+x];if(cell){if(cell.m===0)d=[-d[1],-d[0]];else d=[d[1],d[0]];}x+=d[0];y+=d[1];if(x<0||y<0||x>=N||y>=N)return false;}return false;};
 const solvable=()=>{const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);for(let k=0;k<300;k++){if(trace())return true;const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}return trace();};
 gen();for(let k=0;k<30;k++){const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}trace();
 g.update=()=>{const h=A.hit(0);mvCur(h,c,N,N);if(h.a){const cell=grid[c.y*N+c.x];if(cell){cell.m^=1;S('blip');if(trace()){g.score+=100;S('score');if(lvl>=6){g.over='ALL BEAMS ALIGNED! WIN';return;}gen();for(let k=0;k<30;k++){const ms=grid.map((v,i)=>v?i:-1).filter(i=>i>=0);const i=ms[ri(ms.length)];if(i>=0)grid[i].m^=1;}trace();}}}};
 g.draw=()=>{A.cls();const CS=26,OX=69,OY=29;for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;R(x+1,y+1,CS-2,CS-2,'#1a1440');const m=grid[i];if(m){if(m.m===0)L(x+4,y+4,x+CS-4,y+CS-4,K.w,3);else L(x+CS-4,y+4,x+4,y+CS-4,K.w,3);}}
  for(let i=0;i<path.length-1;i++){const a=path[i],b=path[i+1];L(OX+a[0]*CS+CS/2,OY+a[1]*CS+CS/2,OX+b[0]*CS+CS/2,OY+b[1]*CS+CS/2,K.r,2);}
  R(OX+src.x*CS+2,OY+src.y*CS+8,10,10,K.r);C(OX+tgt.x*CS+CS/2,OY+tgt.y*CS+CS/2,8,K.g);C(OX+tgt.x*CS+CS/2,OY+tgt.y*CS+CS/2,4,K.k);A.box(OX+c.x*CS,OY+c.y*CS,CS,CS,K.y);T('LEVEL '+lvl+'/6',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');};
 return g;}});

/* ---- NONOGRAM ---- */
A.add({id:'nonogram',name:'NONOGRAM',cat:'PUZZLE',how:'NUMBERS = RUNS OF FILLED CELLS. A FILLS, B MARKS X. SOLVE THE PICTURE.',make(){
 const g={over:null,score:0},N=6;let sol=[],b=[],c={x:0,y:0},lvl=0,t=0;
 const clue=arr=>{const o=[];let n=0;arr.forEach(v=>{if(v)n++;else if(n){o.push(n);n=0;}});if(n)o.push(n);return o.length?o:[0];};
 const gen=()=>{lvl++;sol=[];for(let i=0;i<N*N;i++)sol.push(Math.random()<.55?1:0);b=Array(N*N).fill(0);t=0;};gen();
 const rowC=y=>clue(sol.slice(y*N,y*N+N)),colC=x=>clue([...Array(N).keys()].map(y=>sol[y*N+x]));
 const done=()=>[...Array(N).keys()].every(y=>JSON.stringify(rowC(y))===JSON.stringify(clue(b.slice(y*N,y*N+N).map(v=>v===1?1:0))))&&[...Array(N).keys()].every(x=>JSON.stringify(colC(x))===JSON.stringify(clue([...Array(N).keys()].map(y=>b[y*N+x]===1?1:0))));
 g.update=()=>{t++;const h=A.hit(0);mvCur(h,c,N,N);const i=c.y*N+c.x;if(h.a){b[i]=b[i]===1?0:1;S('blip');if(done()){g.score+=Math.max(50,300-(t/60|0)*3);S('score');if(lvl>=5)g.over='GALLERY COMPLETE! WIN';else gen();}}if(h.b){b[i]=b[i]===2?0:2;S('blip');}};
 g.draw=()=>{A.cls();const CS=22,OX=120,OY=70;for(let y=0;y<N;y++){const cc=rowC(y);cc.forEach((v,i)=>T(v,OX-8-(cc.length-1-i)*12,OY+y*CS+7,K.w));}for(let x=0;x<N;x++){const cc=colC(x);cc.forEach((v,i)=>T(v,OX+x*CS+9,OY-10-(cc.length-1-i)*10,K.w,1,'c'));}
  for(let i=0;i<N*N;i++){const x=OX+(i%N)*CS,y=OY+((i/N)|0)*CS;R(x,y,CS-1,CS-1,b[i]===1?K.c:'#1a1440');if(b[i]===2){L(x+5,y+5,x+CS-6,y+CS-6,K.gr);L(x+CS-6,y+5,x+5,y+CS-6,K.gr);}}A.box(OX+c.x*CS-1,OY+c.y*CS-1,CS+1,CS+1,K.y);T('PUZZLE '+lvl+'/5',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');};
 return g;}});

/* ---- SPACE MINER 3D ---- */
A.add({id:'spaceminer',name:'SPACE MINER 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES THE MINING LASER AT ORE ROCKS. DODGE THE GREY ONES. 90 SEC.',make(){
 const g={over:null,score:0};let px=0,py=0,z=0,rocks=[],time=5400,beam=0,sh=3,inv=0;for(let i=0;i<30;i++)rocks.push({x:rnd(16)-8,y:rnd(10)-5,z:i*4+10,ore:Math.random()<.4,r:.6+rnd(.8),hp:3});
 g.update=()=>{time--;if(inv>0)inv--;const k=A.in(0);px=cl(px+ax(k)*.12,-7,7);py=cl(py-ay(k)*.12,-4,4);z+=.16;if(beam>0)beam--;
  if(A.in(0).a){beam=2;const t=rocks.filter(r=>r.z>z+1&&r.z<z+30&&Math.abs(r.x-px)<r.r+.4&&Math.abs(r.y-py)<r.r+.4).sort((a,b)=>a.z-b.z)[0];if(t&&t.ore){t.hp-=.08;if(t.hp<=0){t.z=-1;g.score+=50;S('coin');}}}
  for(const r of rocks){if(r.z<z-2){r.z+=120;r.x=rnd(16)-8;r.y=rnd(10)-5;r.ore=Math.random()<.4;r.hp=3;}if(Math.abs(r.z-z)<r.r&&Math.abs(r.x-px)<r.r+.5&&Math.abs(r.y-py)<r.r+.4&&inv===0){inv=60;sh--;S('boom');r.z=-1;if(sh<=0)g.over='HULL BREACH';}}
  if(time<=0)g.over='SHIFT OVER';};
 g.draw=()=>{A.cls('#04020c');for(let i=0;i<40;i++)R((i*97)%W,(i*53)%H,1,1,i%3?K.gr:K.w);A.fog={col:'#04020c',near:25,far:60};A.cam.x=px*.5;A.cam.y=py*.5;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=0;
  rocks.forEach(r=>{if(r.z>z-1&&r.z<z+60){const c=r.ore?(r.hp<3?A.mix('#8a5c33',K.y,1-r.hp/3):'#8a5c33'):'#6a6a78';B3(r.x,r.y-r.r/2,r.z,r.r*1.4,r.r,r.r*1.2,c);if(r.ore)B3(r.x,r.y+r.r*.3,r.z,r.r*.5,r.r*.4,r.r*.5,K.y);}});A.flush();A.fog=null;
  const s=A.p3(px,py,z+1.5);if(beam){const t=rocks.filter(r=>r.z>z+1&&Math.abs(r.x-px)<r.r+.4&&Math.abs(r.y-py)<r.r+.4).sort((a,b)=>a.z-b.z)[0];const e=t?A.p3(t.x,t.y,t.z):A.p3(px,py,z+30);L(s[0],s[1],e[0],e[1],K.g,2);}
  if(inv%6<4){A.poly([[s[0],s[1]-7],[s[0]-12,s[1]+6],[s[0],s[1]+2],[s[0]+12,s[1]+6]],K.c,1);}T('ORE '+g.score,6,4,K.y,2);T(Math.ceil(time/60),160,4,K.w,2,'c');T('HULL '+'|'.repeat(sh),W-6,4,sh<2?K.r:K.w,2,'r');};
 return g;}});

/* ---- RAIL BLASTER 3D ---- */
A.add({id:'rail',name:'RAIL BLASTER 3D',cat:'RETRO 3D',hd:1,how:'YOU RIDE THE RAIL. MOVE THE SIGHT, A FIRES. DROIDS POP FROM COVER. SURVIVE 10 WAVES.',make(){
 const g={over:null,score:0};let z=0,cx=0,cy=1.5,en=[],hp=5,wave=0,fl=0,inv=0,left=0;const spawn=()=>{wave++;left=4+wave;};spawn();
 g.update=()=>{z+=.05;if(fl>0)fl--;if(inv>0)inv--;const k=A.in(0);cx=cl(cx+ax(k)*.09,-4,4);cy=cl(cy-ay(k)*.09,.3,3.2);
  if(left>0&&Math.random()<.03){left--;en.push({x:rnd(8)-4,y:.6,z:z+12+rnd(10),t:0,up:0,cd:90+ri(60),hp:1});}
  for(const e of en){e.t++;e.up=Math.min(1,e.t/25);e.z-=.03;if(--e.cd<=0){e.cd=120;if(inv===0){hp--;inv=50;S('hit');if(hp<=0)g.over='RAIL DERAILED  WAVE '+wave;}}if(e.z<z+1)e.hp=0;}
  if(A.hit(0).a){fl=4;S('shoot');const best=en.filter(e=>e.hp>0).map(e=>{const sx=e.x/(e.z-z)*8,sy=(e.y+.8*e.up-1.5)/(e.z-z)*8;return{e,d:Math.hypot(sx-cx*8/(e.z-z)*(e.z-z)/8,sy-(cy-1.5))};}).filter(o=>Math.abs(o.e.x-cx)<.9&&Math.abs(o.e.y+.8*o.e.up-cy)<.9).sort((a,b)=>a.e.z-b.e.z)[0];if(best){best.e.hp=0;g.score+=100;S('boom');}}
  en=en.filter(e=>e.hp>0);if(left===0&&!en.length){if(wave>=10){g.over='RAIL CLEARED! WIN';return;}hp=Math.min(5,hp+1);S('win');spawn();}};
 g.draw=()=>{A.skyband('#3a1a6a','#ff7a59',120);R(0,120,W,120,'#2a2a38');A.fog={col:'#5a3a6a',near:14,far:40};A.cam.x=0;A.cam.y=1.6;A.cam.z=z;A.cam.ry=cx*.06;A.cam.rx=(cy-1.5)*.08;
  for(let zz=Math.floor(z)+1;zz<z+35;zz+=2){F([[-.6,0,zz],[.6,0,zz],[.6,0,zz+2],[-.6,0,zz+2]],'#555');F([[-5,-.05,zz],[5,-.05,zz],[5,-.05,zz+2],[-5,-.05,zz+2]],(zz/2)%2?'#3a3a44':'#40404c');if(zz%6===1){B3(-4,0,zz,1.2,1.4,1.2,'#6a6a78');B3(4,0,zz,1.2,1.4,1.2,'#6a6a78');}}
  en.forEach(e=>{B3(e.x,e.y-.6+.8*e.up-.4,e.z,.8,.8,.6,'#8a3a3a');B3(e.x,e.y-.6+.8*e.up+.4,e.z,.5,.4,.5,K.r);B3(e.x,e.y-.6+.8*e.up+.1,e.z-.35,.15,.15,.4,K.k);});A.flush();A.fog=null;
  const s=A.p3(cx,cy,z+8);A.ring(s[0],s[1],8,K.g);L(s[0]-12,s[1],s[0]+12,s[1],K.g);L(s[0],s[1]-12,s[0],s[1]+12,K.g);if(fl)R(0,0,W,H,'rgba(255,255,200,.15)');if(inv>40)R(0,0,W,H,'rgba(255,0,0,.3)');
  T('WAVE '+wave+'/10',6,4,K.y,2);T('SCORE '+g.score,160,4,K.w,2,'c');T('HP '+'|'.repeat(hp),W-6,4,hp<2?K.r:K.w,2,'r');};
 return g;}});

/* ---- SKEE BALL ---- */
A.add({id:'skee',name:'SKEE BALL',cat:'SPORTS',how:'LEFT/RIGHT AIM. A LOCKS POWER. 9 BALLS. RING SCORES 10 TO 50.',make(){
 const g={over:null,score:0};let ang=0,pw=0,ph=0,t=0,ball=null,n=0,msg='',mt=0;
 g.update=()=>{t++;if(mt>0)mt--;if(ball){ball.z+=ball.v;ball.x+=ball.vx;ball.v*=.99;if(ball.z>16){ball.z=16;ball.air=true;}if(ball.air){ball.vy=(ball.vy||ball.v*3)-.5;ball.h=(ball.h||0)+ball.vy;if(ball.h<0){const d=Math.hypot(ball.x,ball.h0-8);const p=d<1.2?50:d<2.4?40:d<3.6?30:d<4.8?20:10;g.score+=p;msg='+'+p;mt=50;S(p>=40?'score':'hit');ball=null;n++;ph=0;t=0;if(n>=9)g.over=g.score+' POINTS';}}return;}
  const h=A.hit(0),k=A.in(0);if(ph===0){ang=cl(ang+ax(k)*.02,-.3,.3);if(h.a){ph=1;t=0;}}else{pw=.5+.5*Math.sin(t*.08);if(h.a){ball={x:0,z:0,v:.25+pw*.35,vx:Math.sin(ang)*.15,h:0,h0:6+pw*8};S('shoot');}}};
 g.draw=()=>{A.cls('#3a2a18');const pr=(x,z,h)=>{const s=1/(1+z*.15);return[160+x*30*s,225-(1-s)*190-(h||0)*20*s,s];};A.poly([pr(-3,0),pr(3,0),pr(3,16),pr(-3,16)].map(v=>[v[0],v[1]]),'#d9a55b',1);
  [[5,10,K.b],[4,20,K.g],[3,30,K.y],[2,40,K.o],[1,50,K.r]].forEach(rg=>{const c=pr(0,16,4);A.c.fillStyle=rg[2];A.c.beginPath();A.c.ellipse(c[0],c[1]-rg[0]*6,rg[0]*14,rg[0]*8,0,0,6.283);A.c.fill();T(rg[1],c[0],c[1]-rg[0]*6-rg[0]*8-8,K.w,1,'c');});
  if(ball){const v=pr(ball.x,ball.z,ball.h);C(v[0],v[1],7*v[2]+1,K.w);}else{const a=pr(0,0),b=pr(Math.sin(ang)*8,10);L(a[0],a[1]-6,b[0],b[1],K.y);C(a[0],a[1]-6,8,K.w);if(ph===1){A.box(8,60,10,100,K.w);R(10,158-pw*96,6,pw*96,K.r);}}
  T('SCORE '+g.score,6,6,K.y,2);T('BALL '+Math.min(n+1,9)+'/9',W-6,6,K.w,2,'r');if(mt>0)T(msg,160,40,K.y,3,'c');};
 return g;}});

/* ---- SUSHI STACK ---- */
A.add({id:'sushi',name:'SUSHI STACK',cat:'PUZZLE',how:'MOVE THE PLATE. CATCH FALLING SUSHI, DODGE WASABI. STACK HIGH. 3 MISSES.',make(){
 const g={over:null,score:0};let px=160,items=[],stack=0,miss=0,t=0;
 g.update=()=>{t++;px=cl(px+ax(A.in(0))*3.4,20,W-20);if(t%Math.max(18,50-t/100)===0)items.push({x:rnd(W-40)+20,y:-10,v:1.5+rnd(1.5)+t/2000,k:Math.random()<.2?'w':['s','m','r','t'][ri(4)]});
  for(const it of items){it.y+=it.v;const top=200-stack*6;if(it.y>top-6&&it.y<top+4&&Math.abs(it.x-px)<18){it.dead=1;if(it.k==='w'){miss++;stack=Math.max(0,stack-3);S('boom');if(miss>=3)g.over='STACK TOPPLED';}else{stack++;g.score+=10*Math.min(5,1+stack/5|0);S('coin');}}else if(it.y>H){it.dead=1;if(it.k!=='w'){miss++;S('lose');if(miss>=3)g.over='TOO MANY DROPPED';}}}items=items.filter(i=>!i.dead);};
 g.draw=()=>{A.cls('#1a1238');R(0,200,W,40,'#8a5c33');R(0,200,W,4,'#a0724a');const draw=(k,x,y)=>{if(k==='w')C(x,y,5,K.g);else{R(x-8,y-3,16,6,K.w);R(x-8,y-6,16,4,k==='s'?'#ff8a5a':k==='m'?'#b8b8b8':k==='r'?K.r:K.y);if(k==='m')R(x-8,y-3,16,2,K.k);}};
  items.forEach(i=>draw(i.k,i.x,i.y));for(let i=0;i<stack;i++)draw(['s','m','r','t'][i%4],px,196-i*6);R(px-18,198,36,5,'#e8e8e8');T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(miss),W-6,6,K.r,2,'r');T('STACK '+stack,160,6,K.w,1,'c');};
 return g;}});
})();
