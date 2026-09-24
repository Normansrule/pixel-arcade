(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- BYTE SNAKE ---- */
A.add({id:'snake',name:'BYTE SNAKE',cat:'CLASSICS',how:'ARROWS STEER. EAT. DO NOT CRASH.',make(){
 const g={over:null,score:0},CW=32,CH=22;let s=[[8,11],[7,11],[6,11]],d=[1,0],nd=[1,0],f,t=0;
 const food=()=>{do{f=[ri(CW),ri(CH)];}while(s.some(c=>c[0]===f[0]&&c[1]===f[1]));};food();
 g.update=()=>{const h=A.hit(0);if(h.l&&d[0]!==1)nd=[-1,0];if(h.r&&d[0]!==-1)nd=[1,0];if(h.u&&d[1]!==1)nd=[0,-1];if(h.d&&d[1]!==-1)nd=[0,1];
  if(++t<Math.max(3,8-(g.score/50|0)))return;t=0;d=nd;const n=[s[0][0]+d[0],s[0][1]+d[1]];
  if(n[0]<0||n[1]<0||n[0]>=CW||n[1]>=CH||s.some(c=>c[0]===n[0]&&c[1]===n[1])){g.over='GAME OVER';return;}
  s.unshift(n);if(n[0]===f[0]&&n[1]===f[1]){g.score+=10;S('coin');food();}else s.pop();};
 g.draw=()=>{A.cls();R(0,0,W,20,K.d);T('SCORE '+g.score,6,5,K.y,2);s.forEach((c,i)=>R(c[0]*10+1,c[1]*10+21,8,8,i?K.g:K.w));R(f[0]*10+2,f[1]*10+22,6,6,K.r);};
 return g;}});

/* ---- BRICK BUSTER ---- */
A.add({id:'bricks',name:'BRICK BUSTER',cat:'CLASSICS',how:'MOVE THE BAT. A LAUNCHES. CLEAR ALL BRICKS.',make(){
 const g={over:null,score:0};let px=140,b,br,lives=3,lvl=1,stuck=true;
 const build=()=>{br=[];for(let r=0;r<6;r++)for(let c=0;c<10;c++)br.push({x:10+c*30,y:34+r*11,c:[K.r,K.o,K.y,K.g,K.b,K.p][r],p:(6-r)*10});};
 const nb=()=>{b={x:0,y:0,vx:1.5,vy:-(2.2+lvl*.3)};stuck=true;};build();nb();
 g.update=()=>{px=cl(px+ax(A.in(0))*4,4,W-44);if(stuck){b.x=px+20;b.y=212;if(A.hit(0).a){stuck=false;S('blip');}return;}
  b.x+=b.vx;if(b.x<4||b.x>W-4){b.vx*=-1;b.x=cl(b.x,4,W-4);S('blip');}let hx=br.find(q=>b.x>q.x&&b.x<q.x+28&&b.y>q.y&&b.y<q.y+9);if(hx){b.vx*=-1;b.x+=b.vx;}
  b.y+=b.vy;if(b.y<24){b.vy*=-1;b.y=24;S('blip');}let hy=br.find(q=>b.x>q.x&&b.x<q.x+28&&b.y>q.y&&b.y<q.y+9);if(hy){b.vy*=-1;b.y+=b.vy;}
  const q=hx||hy;if(q){br.splice(br.indexOf(q),1);g.score+=q.p;S('hit');if(!br.length){lvl++;build();nb();}}
  if(b.vy>0&&b.y>214&&b.y<222&&b.x>px-3&&b.x<px+43){b.vy=-Math.abs(b.vy);b.vx=(b.x-px-20)/7;S('blip');}
  if(b.y>H+6){lives--;S('lose');if(lives<=0)g.over='GAME OVER';else nb();}};
 g.draw=()=>{A.cls();R(0,0,W,20,K.d);T('SCORE '+g.score,6,5,K.y,2);T('LIVES '+lives+'  LV '+lvl,W-6,5,K.w,2,'r');br.forEach(q=>R(q.x,q.y,28,9,q.c));R(px,216,40,6,K.c);R(b.x-2,b.y-2,5,5,K.w);if(stuck)T('PRESS A TO LAUNCH',160,150,K.gr,1,'c');};
 return g;}});

/* ---- BLOCK DROP ---- */
A.add({id:'blocks',name:'BLOCK DROP',cat:'CLASSICS',how:'SLIDE. A ROTATES. B SLAMS. FILL ROWS.',make(){
 const g={over:null,score:0},BW=12,BH=18,CS=12,OX=88,OY=20,SH=['0000111100000000','100111000','001111000','1111','011110000','010111000','110011000'],CO=[K.c,K.b,K.o,K.y,K.g,K.p,K.r];
 let bd=[],pc,nx=ri(7),t=0,lines=0,rep=0;for(let i=0;i<BH;i++)bd.push(Array(BW).fill(0));
 const mk=i=>{const n=Math.sqrt(SH[i].length),m=[];for(let r=0;r<n;r++){m.push([]);for(let c=0;c<n;c++)m[r].push(+SH[i][r*n+c]);}return m;};
 const fits=(m,x,y)=>m.every((row,r)=>row.every((v,c)=>!v||(x+c>=0&&x+c<BW&&y+r<BH&&(y+r<0||!bd[y+r][x+c]))));
 const spawn=()=>{pc={m:mk(nx),i:nx,x:4,y:0};if(pc.i===0)pc.y=-1;nx=ri(7);if(!fits(pc.m,pc.x,pc.y))g.over='GAME OVER';};
 const lock=()=>{pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)bd[pc.y+r][pc.x+c]=pc.i+1;}));let n=0;for(let r=BH-1;r>=0;r--)if(bd[r].every(v=>v)){bd.splice(r,1);bd.unshift(Array(BW).fill(0));n++;r++;}
  if(n){lines+=n;g.score+=[0,100,300,500,800][n];S('score');}else S('hit');spawn();};spawn();
 g.update=()=>{const h=A.hit(0),k=A.in(0),dx=ax(k);if(dx){if(rep===0||(rep>10&&rep%3===0)){if(fits(pc.m,pc.x+dx,pc.y))pc.x+=dx;}rep++;}else rep=0;
  if(h.u||h.a){const n=pc.m.length,m=pc.m.map((row,r)=>row.map((_,c)=>pc.m[n-1-c][r]));for(const o of[0,-1,1,-2,2])if(fits(m,pc.x+o,pc.y)){pc.m=m;pc.x+=o;S('blip');break;}}
  if(h.b){while(fits(pc.m,pc.x,pc.y+1)){pc.y++;g.score++;}lock();t=0;return;}
  t+=k.d?8:1;if(t>=Math.max(4,40-(lines/6|0)*4)){t=0;if(fits(pc.m,pc.x,pc.y+1))pc.y++;else lock();}};
 g.draw=()=>{A.cls();R(OX-2,OY-2,BW*CS+4,BH*CS+4,K.d);R(OX,OY,BW*CS,BH*CS,K.k);const cell=(x,y,i)=>{R(OX+x*CS,OY+y*CS,CS-1,CS-1,CO[i]);R(OX+x*CS,OY+y*CS,CS-1,2,'rgba(255,255,255,.35)');};
  bd.forEach((row,r)=>row.forEach((v,c)=>{if(v)cell(c,r,v-1);}));if(!g.over)pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)cell(pc.x+c,pc.y+r,pc.i);}));
  T('SCORE',8,30,K.gr);T(g.score,8,40,K.y,2);T('LINES',8,70,K.gr);T(lines,8,80,K.w,2);T('NEXT',250,30,K.gr);mk(nx).forEach((row,r)=>row.forEach((v,c)=>{if(v)R(250+c*8,42+r*8,7,7,CO[nx]);}));};
 return g;}});

/* ---- MUNCH MAZE ---- */
A.add({id:'munch',name:'MUNCH MAZE',cat:'CLASSICS',how:'EAT EVERY PELLET. BIG PELLET = EAT BUGS.',make(){
 const g={over:null,score:0},M=['###################','#........#........#','#o##.###.#.###.##o#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#','####.### # ###.####','   #.#       #.#   ','####.# ## ## #.####','    .  #   #  .    ','####.# ##### #.####','   #.#       #.#   ','####.# ##### #.####','#........#........#','#.##.###.#.###.##.#','#o..#....P....#..o#','##.#.#.#####.#.#.##','#....#...#...#....#','#.######.#.######.#','#.................#','###################'],CS=11,OX=8,OY=5;
 let dots,left,pl,bugs,lives=3,lvl=1,fr=0,wait=60;
 const wall=(x,y)=>{x=(x+19)%19;return y<0||y>20||M[y][x]==='#';};
 const fill=()=>{dots=M.map(r=>r.split('').map(c=>c==='.'?1:c==='o'?2:0));left=dots.flat().filter(v=>v).length;};
 const place=()=>{pl={x:9,y:15,dx:0,dy:0,wx:0,wy:0,p:0};bugs=[0,1,2].map(i=>({x:8+i,y:9,dx:0,dy:-1,p:0,home:60+i*90,c:[K.r,K.p,K.o][i],i}));fr=0;wait=60;};fill();place();
 g.update=()=>{if(wait>0){wait--;return;}if(fr>0)fr--;const k=A.in(0);if(ax(k)){pl.wx=ax(k);pl.wy=0;}else if(ay(k)){pl.wx=0;pl.wy=ay(k);}
  if(pl.p>0&&pl.wx===-pl.dx&&pl.wy===-pl.dy&&(pl.dx||pl.dy)){pl.x+=pl.dx;pl.y+=pl.dy;pl.x=(pl.x+19)%19;pl.dx=-pl.dx;pl.dy=-pl.dy;pl.p=1-pl.p;}
  if(pl.p===0){if((pl.wx||pl.wy)&&!wall(pl.x+pl.wx,pl.y+pl.wy)){pl.dx=pl.wx;pl.dy=pl.wy;}else if(wall(pl.x+pl.dx,pl.y+pl.dy)){pl.dx=pl.dy=0;}}
  if(pl.dx||pl.dy){pl.p+=.13;if(pl.p>=1){pl.p=0;pl.x=(pl.x+pl.dx+19)%19;pl.y+=pl.dy;const v=dots[pl.y][pl.x];if(v){dots[pl.y][pl.x]=0;left--;g.score+=v===2?50:10;if(v===2){fr=360;S('score');}else if(left%2)S('blip');
    if(left===0){lvl++;fill();place();return;}}}}
  for(const b of bugs){if(b.home>0){b.home--;if(b.home===0){b.x=9;b.y=7;b.p=0;b.dx=b.i%2?1:-1;b.dy=0;}continue;}
   if(b.p===0){let tx=pl.x,ty=pl.y;if(b.i===1){tx+=pl.dx*4;ty+=pl.dy*4;}if(b.i===2&&Math.hypot(b.x-pl.x,b.y-pl.y)<6){tx=1;ty=19;}
    let best=null,bd=1e9;for(const d of[[0,-1],[-1,0],[0,1],[1,0]]){if(d[0]===-b.dx&&d[1]===-b.dy)continue;if(wall(b.x+d[0],b.y+d[1]))continue;if(b.y+d[1]===8&&b.x===9&&d[1]===1)continue;
     let ds=Math.hypot(b.x+d[0]-tx,b.y+d[1]-ty);if(fr>0)ds=-ds+rnd(6);else ds+=rnd(2.5);if(ds<bd){bd=ds;best=d;}}
    if(!best)best=[-b.dx,-b.dy];b.dx=best[0];b.dy=best[1];}
   b.p+=(fr>0?.06:.085+lvl*.008);if(b.p>=1){b.p=0;b.x=(b.x+b.dx+19)%19;b.y+=b.dy;}
   const bx=b.x+b.dx*b.p,by=b.y+b.dy*b.p,px=pl.x+pl.dx*pl.p,py=pl.y+pl.dy*pl.p;
   if(Math.abs(bx-px)+Math.abs(by-py)<.7){if(fr>0){g.score+=200;S('coin');b.x=9;b.y=9;b.p=0;b.home=150;}else{lives--;S('boom');if(lives<=0){g.over='GAME OVER';return;}place();return;}}}};
 g.draw=()=>{A.cls();M.forEach((row,y)=>row.split('').forEach((c,x)=>{if(c==='#'){R(OX+x*CS,OY+y*CS,CS,CS,'#2b3bd6');R(OX+x*CS+2,OY+y*CS+2,CS-4,CS-4,K.bg);}const v=dots[y][x];if(v===1)R(OX+x*CS+4,OY+y*CS+4,2,2,K.w);if(v===2&&A.t%30<20)R(OX+x*CS+2,OY+y*CS+2,6,6,K.y);}));
  const px=OX+(pl.x+pl.dx*pl.p)*CS,py=OY+(pl.y+pl.dy*pl.p)*CS;R(px+1,py+1,9,9,K.g);if(A.t%16<8)R(px+(pl.dx<0?1:pl.dx>0?6:3),py+(pl.dy<0?1:pl.dy>0?6:4),4,pl.dy?4:3,K.bg);R(px+3,py+2,2,2,K.k);
  bugs.forEach(b=>{const x=OX+(b.x+b.dx*b.p)*CS,y=OY+(b.y+b.dy*b.p)*CS,c=fr>0&&b.home===0?(fr<90&&A.t%12<6?K.w:K.b):b.c;R(x+1,y+2,9,6,c);R(x+1,y+8,2,2,c);R(x+4,y+8,2,2,c);R(x+8,y+8,2,2,c);R(x+3,y+3,2,2,K.w);R(x+6,y+3,2,2,K.w);});
  T('SCORE',232,20,K.gr);T(g.score,232,30,K.y,2);T('LIVES',232,60,K.gr);for(let i=0;i<lives;i++)R(232+i*12,70,8,8,K.g);T('LEVEL '+lvl,232,96,K.w);if(wait>0)T('READY!',113,125,K.y,2,'c');};
 return g;}});

/* ---- GIRDER CLIMB ---- */
A.add({id:'girder',name:'GIRDER CLIMB',cat:'CLASSICS',how:'REACH THE FLAG. A JUMPS COGS. UP/DOWN ON LADDERS.',make(){
 const g={over:null,score:0},PL=[{y:222,x0:0,x1:320},{y:182,x0:0,x1:286},{y:142,x0:34,x1:320},{y:102,x0:0,x1:286},{y:62,x0:34,x1:320}],LD=[{x:250,a:182,b:222},{x:70,a:142,b:182},{x:170,a:142,b:182},{x:250,a:102,b:142},{x:120,a:102,b:142},{x:70,a:62,b:102}];
 let p,cogs,lives=3,lvl=1,sp=0,bonus=3000;const dirOf=q=>q.x0>0?-1:q.x1<320?1:-1;
 const platAt=(x,y)=>PL.find(q=>Math.abs(q.y-y)<1.5&&x>=q.x0&&x<=q.x1);
 const reset=()=>{p={x:30,y:222,vy:0,lad:null,air:false};cogs=[];sp=40;};reset();
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(bonus>0&&A.t%6===0)bonus-=10;
  if(p.lad){p.y+=ay(k)*1.1;if(p.y<=p.lad.a){p.y=p.lad.a;p.lad=null;}else if(p.y>=p.lad.b){p.y=p.lad.b;p.lad=null;}}
  else{const on=platAt(p.x,p.y)&&p.vy>=0;if(on&&!p.air||on){p.air=false;p.vy=0;const l=LD.find(l=>Math.abs(l.x-p.x)<7&&((k.u&&Math.abs(p.y-l.b)<2)||(k.d&&Math.abs(p.y-l.a)<2)));if(l){p.lad=l;p.x=l.x;p.y+=k.u?-1:1;}else if(h.a){p.vy=-3.1;p.air=true;S('jump');}}
   if(!p.lad){p.x=cl(p.x+ax(k)*1.5,6,W-6);if(!platAt(p.x,p.y)||p.vy<0||p.air){p.air=true;const oy=p.y;p.vy+=.22;p.y+=p.vy;if(p.vy>0){const q=PL.find(q=>oy<=q.y&&p.y>=q.y&&p.x>=q.x0&&p.x<=q.x1);if(q){p.y=q.y;p.vy=0;p.air=false;}}}}}
  if(p.y<=62&&!p.lad&&p.x<110){g.score+=bonus+500;bonus=3000;lvl++;S('win');reset();return;}
  if(--sp<=0){sp=Math.max(45,130-lvl*12)+rnd(40);cogs.push({x:286,y:62,d:-1,vy:0,lad:null,j:0});}
  for(const c of cogs){const v=1.1+lvl*.15;if(c.lad){c.y+=1.2;if(c.y>=c.lad.b){c.y=c.lad.b;c.lad=null;c.d=dirOf(platAt(c.x,c.y)||PL[0]);}}
   else{const q=platAt(c.x,c.y);if(q&&c.vy>=0){c.vy=0;c.y=q.y;if(!c.set||c.set!==q){c.set=q;c.d=dirOf(q);}c.x+=c.d*v;const l=LD.find(l=>Math.abs(l.x-c.x)<v/2+.1&&l.a===q.y);if(l&&Math.random()<.3){c.lad=l;c.x=l.x;}}
    else{c.vy+=.2;const oy=c.y;c.y+=c.vy;const n=PL.find(q=>oy<q.y&&c.y>=q.y&&c.x>=q.x0-2&&c.x<=q.x1+2);if(n){c.y=n.y;c.vy=0;c.x=cl(c.x,n.x0,n.x1);}}}
   const dx=Math.abs(c.x-p.x),dy=p.y-c.y;if(dx<8&&Math.abs(dy)<9){lives--;S('boom');if(lives<=0){g.over='GAME OVER';return;}reset();return;}
   if(p.air&&!c.j&&dx<5&&dy<-8&&dy>-30){c.j=1;g.score+=100;S('coin');}}
  cogs=cogs.filter(c=>c.x>-10&&c.y<H+10);};
 g.draw=()=>{A.cls();LD.forEach(l=>{R(l.x-5,l.a,1,l.b-l.a,K.c);R(l.x+4,l.a,1,l.b-l.a,K.c);for(let y=l.a+4;y<l.b;y+=6)R(l.x-5,y,10,1,K.c);});
  PL.forEach(q=>{R(q.x0,q.y,q.x1-q.x0,5,K.r);for(let x=q.x0;x<q.x1-4;x+=10)R(x+2,q.y+1,5,3,'#7a1d33');});
  R(292,34,20,28,K.gr);R(296,40,4,4,K.r);R(304,40,4,4,K.r);R(296,50,12,3,K.k);R(60,38,2,24,K.w);R(62,38,12,8,K.y);
  cogs.forEach(c=>{C(c.x,c.y-6,6,K.o);const a=c.x*.2;L(c.x-Math.cos(a)*6,c.y-6-Math.sin(a)*6,c.x+Math.cos(a)*6,c.y-6+Math.sin(a)*6,K.k);});
  R(p.x-4,p.y-14,8,9,K.b);R(p.x-3,p.y-20,6,6,'#ffd9a8');R(p.x-4,p.y-22,8,3,K.r);R(p.x-4,p.y-5,3,5,K.w);R(p.x+1,p.y-5,3,5,K.w);
  T('SCORE '+g.score,6,4,K.y,2);T('BONUS '+bonus,160,6,K.w,1,'c');T('LIVES '+lives+' LV '+lvl,W-6,4,K.w,2,'r');};
 return g;}});

/* ---- INVADER WAVE ---- */
A.add({id:'invaders',name:'INVADER WAVE',cat:'CLASSICS',how:'MOVE. A FIRES. STOP THE WAVE.',make(){
 const g={over:null,score:0};let px=160,sh=null,en,bm=[],dir=1,lives=3,wave=1,t=0;
 const build=()=>{en=[];for(let r=0;r<5;r++)for(let c=0;c<9;c++)en.push({x:30+c*26,y:34+r*16+Math.min(wave-1,4)*8,r});dir=1;bm=[];};build();
 g.update=()=>{px=cl(px+ax(A.in(0))*2.6,10,W-10);if(A.hit(0).a&&!sh){sh={x:px,y:212};S('shoot');}
  if(sh){sh.y-=6;const e=en.find(e=>Math.abs(e.x-sh.x)<9&&Math.abs(e.y-sh.y)<7);if(e){en.splice(en.indexOf(e),1);g.score+=(5-e.r)*10;sh=null;S('hit');}else if(sh.y<20)sh=null;}
  if(++t>=Math.max(2,Math.floor(en.length/2.2))){t=0;let edge=en.some(e=>(dir>0&&e.x>W-16)||(dir<0&&e.x<16));if(edge){dir=-dir;en.forEach(e=>e.y+=8);}else en.forEach(e=>e.x+=dir*4);}
  if(en.length&&Math.random()<.015+wave*.004){const e=en[ri(en.length)];bm.push({x:e.x,y:e.y+6});}
  for(const b of bm){b.y+=2.2+wave*.15;if(Math.abs(b.x-px)<8&&b.y>210&&b.y<224){b.y=999;lives--;S('boom');if(lives<=0)g.over='GAME OVER';}}bm=bm.filter(b=>b.y<H);
  if(en.some(e=>e.y>200))g.over='THEY LANDED!';if(!en.length){wave++;g.score+=100;S('win');build();}};
 g.draw=()=>{A.cls();en.forEach(e=>{const c=[K.p,K.c,K.c,K.g,K.g][e.r],f=(A.t>>4)&1;R(e.x-6,e.y-4,12,7,c);R(e.x-8,e.y-1,2,4,c);R(e.x+6,e.y-1,2,4,c);R(e.x-4,e.y-2,2,2,K.bg);R(e.x+2,e.y-2,2,2,K.bg);R(e.x-6+(f?0:2),e.y+3,2,3,c);R(e.x+4-(f?0:2),e.y+3,2,3,c);});
  bm.forEach(b=>R(b.x-1,b.y,2,6,K.y));if(sh)R(sh.x-1,sh.y,2,7,K.w);R(px-9,216,18,6,K.g);R(px-2,211,4,5,K.g);R(0,226,W,1,K.g);
  T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives+'  WAVE '+wave,W-6,4,K.w,2,'r');};
 return g;}});

/* ---- ROCK BLASTER ---- */
A.add({id:'rocks',name:'ROCK BLASTER',cat:'CLASSICS',how:'TURN. UP THRUSTS. A FIRES.',make(){
 const g={over:null,score:0};let s,rk=[],bl=[],lives=3,lvl=0,inv=120;
 const wave=()=>{lvl++;for(let i=0;i<3+lvl;i++){let x,y;do{x=rnd(W);y=rnd(H);}while(Math.hypot(x-160,y-120)<70);rk.push({x,y,vx:rnd(1.6)-.8,vy:rnd(1.6)-.8,r:16,s:rnd(9)});}};
 s={x:160,y:120,vx:0,vy:0,a:-1.57};wave();const wr=o=>{o.x=(o.x+W)%W;o.y=(o.y+H)%H;};
 g.update=()=>{const k=A.in(0);s.a+=ax(k)*.075;if(k.u){s.vx+=Math.cos(s.a)*.07;s.vy+=Math.sin(s.a)*.07;}s.vx*=.994;s.vy*=.994;s.x+=s.vx;s.y+=s.vy;wr(s);if(inv>0)inv--;
  if(A.hit(0).a&&bl.length<5){bl.push({x:s.x+Math.cos(s.a)*8,y:s.y+Math.sin(s.a)*8,vx:Math.cos(s.a)*4.5+s.vx,vy:Math.sin(s.a)*4.5+s.vy,t:55});S('shoot');}
  bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;wr(b);b.t--;});const add=[];
  for(const r of rk){r.x+=r.vx;r.y+=r.vy;wr(r);for(const b of bl)if(b.t>0&&Math.hypot(b.x-r.x,b.y-r.y)<r.r){b.t=0;r.dead=1;g.score+=r.r>12?20:r.r>6?50:100;S('hit');if(r.r>5)for(let i=0;i<2;i++)add.push({x:r.x,y:r.y,vx:rnd(2.4)-1.2,vy:rnd(2.4)-1.2,r:r.r/2,s:rnd(9)});break;}
   if(!r.dead&&inv===0&&Math.hypot(s.x-r.x,s.y-r.y)<r.r+4){lives--;inv=150;s.x=160;s.y=120;s.vx=s.vy=0;S('boom');if(lives<=0)g.over='GAME OVER';}}
  rk=rk.filter(r=>!r.dead).concat(add);bl=bl.filter(b=>b.t>0);if(!rk.length)wave();};
 g.draw=()=>{A.cls();rk.forEach(r=>{const p=[];for(let i=0;i<8;i++){const a=i*.785,m=r.r*(.75+.25*Math.sin(r.s+i*2.3));p.push([r.x+Math.cos(a)*m,r.y+Math.sin(a)*m]);}A.poly(p,K.gr);});bl.forEach(b=>R(b.x-1,b.y-1,2,2,K.y));
  if(inv%10<6){const c=Math.cos(s.a),n=Math.sin(s.a);A.poly([[s.x+c*8,s.y+n*8],[s.x-c*6-n*5,s.y-n*6+c*5],[s.x-c*3,s.y-n*3],[s.x-c*6+n*5,s.y-n*6-c*5]],K.c);if(A.in(0).u&&A.t%4<2)L(s.x-c*5,s.y-n*5,s.x-c*11,s.y-n*11,K.o,2);}
  T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives,W-6,4,K.w,2,'r');};
 return g;}});
})();
