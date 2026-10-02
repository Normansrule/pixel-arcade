(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- BYTE SNAKE ---- */
A.add({id:'snake',name:'BYTE SNAKE',cat:'CLASSICS',how:'ARROWS STEER. EAT. DO NOT CRASH.',make(){
 const g={over:null,score:0},CW=32,CH=22,fx=X.fx();let s=[[8,11],[7,11],[6,11]],d=[1,0],q=[],f,t=0,eaten=0,gold=null,grow=0,pulse=0;
 const free=()=>{let p;do{p=[ri(CW),ri(CH)];}while(s.some(c=>c[0]===p[0]&&c[1]===p[1])||(f&&f[0]===p[0]&&f[1]===p[1]));return p;};
 const food=()=>{f=free();};food();
 const cx=c=>c[0]*10+5,cy=c=>c[1]*10+25;
 g.update=()=>{const h=A.hit(0);const want=h.l?[-1,0]:h.r?[1,0]:h.u?[0,-1]:h.d?[0,1]:null;
  if(want&&q.length<2){const last=q.length?q[q.length-1]:d;if(want[0]!==-last[0]||want[1]!==-last[1])if(want[0]!==last[0]||want[1]!==last[1])q.push(want);}
  if(pulse>0)pulse--;if(gold&&--gold.t<=0)gold=null;
  if(++t<Math.max(3,8-(g.score/60|0)))return;t=0;if(q.length)d=q.shift();const n=[s[0][0]+d[0],s[0][1]+d[1]];
  if(n[0]<0||n[1]<0||n[0]>=CW||n[1]>=CH||s.some((c,i)=>i<s.length-1&&c[0]===n[0]&&c[1]===n[1])){S('boom');fx.flash(K.r,10);s.forEach((c,i)=>{if(i%2===0)fx.debris(cx(c),cy(c),i?'#3ddc84':'#b8ffcf',2,1.5);});g.over='GAME OVER';return;}
  s.unshift(n);let ate=false;
  if(n[0]===f[0]&&n[1]===f[1]){g.score+=10;eaten++;ate=true;S('coin');fx.ring(cx(f),cy(f),'#ff6d6d',16);fx.spark(cx(f),cy(f),'#ffd0a0',8,2);pulse=10;food();if(eaten%5===0&&!gold)gold={p:free(),t:360};}
  else if(gold&&n[0]===gold.p[0]&&n[1]===gold.p[1]){g.score+=50;grow+=2;ate=true;S('score');fx.ring(cx(gold.p),cy(gold.p),K.y,26);fx.spark(cx(gold.p),cy(gold.p),K.y,14,3);fx.pop(cx(gold.p),cy(gold.p)-8,'+50',K.y);pulse=14;gold=null;}
  if(!ate){if(grow>0)grow--;else s.pop();}};
 g.draw=()=>{X.cache('snakebg',()=>{for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){A.c.fillStyle=(x+y)%2?'#16331f':'#1a3b24';A.c.fillRect(x*10,y*10+20,10,10);}X.vignette(.5);A.c.fillStyle='rgba(255,255,255,.04)';for(let i=0;i<60;i++)A.c.fillRect((i*73)%W,20+(i*41)%220,1,2);});
  /* food */const fb=Math.sin(A.t*.12)*1.2;X.glow(cx(f),cy(f),14,'#ff4040',.35);X.shadow(cx(f),cy(f)+5,4,1.3,.35);X.orb(cx(f),cy(f)+fb*.3,4.4,'#e8303a');A.c.fillStyle='#5a3a1a';A.c.fillRect(cx(f)-.5,cy(f)-6+fb*.3,1.2,3);X.ell(cx(f)+2,cy(f)-5+fb*.3,2.4,1.2,'#4ccf5a',-.5);
  if(gold){const gx=cx(gold.p),gy=cy(gold.p),a=gold.t<90&&A.t%10<5?.3:1;A.c.globalAlpha=a;X.glow(gx,gy,18,K.y,.5);const pts=[];for(let i=0;i<10;i++){const r=i%2?2.6:6,an=i*.628-1.57+A.t*.03;pts.push([gx+Math.cos(an)*r,gy+Math.sin(an)*r]);}X.poly(pts,X.lg(gx,gy-6,gx,gy+6,['#fff6a0','#ffb020']));A.c.globalAlpha=1;}
  /* snake body: tapered glossy tube */
  const n=s.length;for(let i=n-1;i>=0;i--){const c=s[i],x=cx(c),y=cy(c),k=i/Math.max(1,n-1),r=4.8-k*1.8+(i===0?.6:0)+(pulse>0&&i<4?pulse*.08:0);
   if(i<n-1){const p=s[i+1];const col=A.mix('#5dff9a','#127a46',k);A.c.strokeStyle=col;A.c.lineWidth=r*2-1;A.c.lineCap='round';A.c.beginPath();A.c.moveTo(cx(p),cy(p));A.c.lineTo(x,y);A.c.stroke();A.c.lineCap='butt';}
   X.shadow(x+1,y+4,r,1.4,.2);X.orb(x,y,r,i===0?'#7dffb0':i%3===0?'#2fbf6a':'#3ddc84',i===0?1:0);}
  const hx=cx(s[0]),hy=cy(s[0]),ex=d[0],ey=d[1];for(const sd of[-1,1]){const px=hx+ex*1.5-ey*sd*2.4,py=hy+ey*1.5+ex*sd*2.4;X.disc(px,py,1.7,'#ffffff');X.disc(px+ex*.7,py+ey*.7,.9,'#0a0a0a');}
  if(A.t%50<10)X.stroke([[hx+ex*5,hy+ey*5],[hx+ex*9,hy+ey*9],[hx+ex*11-ey*1.5,hy+ey*11+ex*1.5]],'#ff3a5a',.8);
  fx.draw();X.bar('SCORE '+g.score,'LENGTH '+s.length);};
 return g;}});

/* ---- BRICK BUSTER ---- */
A.add({id:'bricks',name:'BRICK BUSTER',cat:'CLASSICS',how:'MOVE THE BAT. A LAUNCHES. CLEAR ALL BRICKS. CATCH W/M/S POWER-UPS.',make(){
 const g={over:null,score:0},fx=X.fx(),COL=['#ff4f6d','#ff9838','#ffcf3f','#3ddc84','#4dabff','#b06dff'];let px=140,pw=40,wide=0,balls,br,lives=3,lvl=1,stuck=true,drops=[],hitT=0;
 const build=()=>{br=[];for(let r=0;r<6;r++)for(let c=0;c<10;c++){if(lvl%3===2&&(r+c)%4===0)continue;if(lvl%3===0&&Math.abs(c-4.5)<r*.5-1)continue;const hp=lvl>1&&r<lvl-1?2:1;br.push({x:10+c*30,y:34+r*11,c:COL[r],p:(6-r)*10,hp,mx:hp,sh:0});}};
 const nb=()=>{balls=[{x:0,y:0,vx:1.5,vy:-(2.4+lvl*.3),tr:[]}];stuck=true;};build();nb();
 const inB=(b,q)=>b.x>q.x-2&&b.x<q.x+30&&b.y>q.y-2&&b.y<q.y+11;
 g.update=()=>{px=cl(px+ax(A.in(0))*4.4,4,W-4-pw);if(wide>0&&--wide===0){px+=10;pw=40;}if(hitT)hitT--;br.forEach(q=>{if(q.sh)q.sh--;});
  drops.forEach(d=>{d.y+=1.3;if(d.y>212&&d.y<224&&d.x>px-4&&d.x<px+pw+4){d.y=999;S('coin');fx.ring(d.x,216,K.c,20);fx.pop(d.x,204,{W:'WIDE',M:'MULTI',S:'SLOW'}[d.k],K.c);g.score+=25;
   if(d.k==='W'){if(pw===40)px-=10;pw=60;wide=900;}else if(d.k==='S')balls.forEach(b=>{b.vx*=.7;b.vy*=.7;});else if(balls.length<6){const b0=balls[0];if(b0)for(const s of[-1,1])balls.push({x:b0.x,y:b0.y,vx:b0.vx*-s+s,vy:-Math.abs(b0.vy),tr:[]});}}});drops=drops.filter(d=>d.y<H);
  if(stuck){const b=balls[0];b.x=px+pw/2;b.y=211;if(A.hit(0).a){stuck=false;S('blip');}return;}
  for(const b of balls){b.tr.unshift([b.x,b.y]);if(b.tr.length>7)b.tr.pop();
   b.x+=b.vx;if(b.x<4||b.x>W-4){b.vx*=-1;b.x=cl(b.x,4,W-4);S('blip');}let hx=br.find(q=>inB(b,q));if(hx){b.vx*=-1;b.x+=b.vx;}
   b.y+=b.vy;if(b.y<22){b.vy*=-1;b.y=22;S('blip');}let hy=br.find(q=>inB(b,q));if(hy){b.vy*=-1;b.y+=b.vy;}
   const q=hx||hy;if(q){q.hp--;q.sh=8;if(q.hp<=0){br.splice(br.indexOf(q),1);g.score+=q.p;S('hit');fx.debris(q.x+14,q.y+4,q.c,7,2);fx.spark(q.x+14,q.y+4,'#ffffff',5,2);if(Math.random()<.14)drops.push({x:q.x+14,y:q.y+4,k:'WMS'[ri(3)]});
     const sp=Math.hypot(b.vx,b.vy);if(sp<5){b.vx*=1.015;b.vy*=1.015;}if(!br.length){lvl++;g.score+=200;S('win');fx.flash(K.c,10);fx.pop(160,120,'LEVEL '+lvl,K.y);build();nb();drops=[];return;}}else{S('blip');fx.spark(b.x,b.y,'#e0e8ff',4,1.5);}}
   if(b.vy>0&&b.y>211&&b.y<221&&b.x>px-3&&b.x<px+pw+3){b.vy=-Math.abs(b.vy);b.vx=(b.x-px-pw/2)/(pw/5.5);hitT=8;S('blip');fx.ring(b.x,216,'#7ff0ff',12,10);}
   if(b.y>H+6)b.dead=1;}
  balls=balls.filter(b=>!b.dead);if(!balls.length){lives--;S('lose');fx.flash(K.r,8);if(lives<=0)g.over='GAME OVER';else{nb();pw=40;wide=0;}}};
 g.draw=()=>{X.cache('bricksbg',()=>{X.sky(['#1d0f52','#0b0626','#040312']);A.c.strokeStyle='rgba(120,90,255,.10)';A.c.lineWidth=1;for(let y=24;y<H;y+=16)for(let x=(y/16%2)*14;x<W;x+=28){A.c.beginPath();A.c.moveTo(x,y);A.c.lineTo(x+14,y+8);A.c.lineTo(x+28,y);A.c.stroke();}X.glow(160,60,140,'#5a2aff',.25);X.vg(0,18,3,H,['#8a8ab8','#3a3a5a']);X.vg(W-3,18,3,H,['#8a8ab8','#3a3a5a']);});
  br.forEach(q=>{const o=q.sh?Math.sin(q.sh*1.7)*1.2:0;X.block(q.x+o,q.y,28,9,q.hp>1?'#c8cce0':q.c,2);if(q.hp>1){A.c.fillStyle='rgba(255,255,255,.5)';A.c.fillRect(q.x+4+((A.t*.6+q.x)%20),q.y+2,3,5);}if(q.mx>1&&q.hp===1){A.c.strokeStyle='rgba(0,0,0,.45)';A.c.beginPath();A.c.moveTo(q.x+10,q.y);A.c.lineTo(q.x+14,q.y+5);A.c.lineTo(q.x+19,q.y+9);A.c.stroke();}});
  drops.forEach(d=>{X.glow(d.x,d.y,10,K.c,.4);X.block(d.x-8,d.y-4,16,8,{W:'#3ddc84',M:'#ff4f9a',S:'#4dabff'}[d.k],4);T(d.k,d.x,d.y-2,K.w,1,'c');});
  balls.forEach(b=>{b.tr.forEach((p,i)=>{A.c.globalAlpha=.35*(1-i/7);X.disc(p[0],p[1],2.6-i*.25,'#9fe8ff');});A.c.globalAlpha=1;X.glow(b.x,b.y,9,'#7fd8ff',.5);X.orb(b.x,b.y,2.8,'#f0f8ff');});
  const sq=hitT/8;X.glow(px+pw/2,217,pw*.7,'#2fd6c3',.18+sq*.2);X.rr(px,215-sq,pw,7+sq,3.5,X.lg(0,215,0,222,['#c8fff8','#2fd6c3','#0e6a66']));X.rr(px,215-sq,6,7+sq,3,X.lg(0,215,0,222,['#ffb0b0','#ff4f6d','#801020']));X.rr(px+pw-6,215-sq,6,7+sq,3,X.lg(0,215,0,222,['#ffb0b0','#ff4f6d','#801020']));A.c.fillStyle='rgba(255,255,255,.55)';A.c.fillRect(px+7,216-sq,pw-14,1);
  if(stuck&&A.t%50<35)X.ot('PRESS A TO LAUNCH',160,150,K.w,1,'c');fx.draw();X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++)X.heart(W-62-i*11,8,1);};
 return g;}});

/* ---- BLOCK DROP ---- */
A.add({id:'blocks',name:'BLOCK DROP',cat:'CLASSICS',how:'SLIDE. A ROTATES. B SLAMS. FILL ROWS.',make(){
 const g={over:null,score:0},fx=X.fx(),BW=12,BH=18,CS=12,OX=88,OY=20,SH=['0000111100000000','100111000','001111000','1111','011110000','010111000','110011000'],CO=['#2fd6c3','#4dabff','#ff9838','#ffcf3f','#3ddc84','#c86dff','#ff4f6d'];
 let bd=[],pc,nx=ri(7),t=0,lines=0,rep=0,clr=null,slam=0;for(let i=0;i<BH;i++)bd.push(Array(BW).fill(0));
 const mk=i=>{const n=Math.sqrt(SH[i].length),m=[];for(let r=0;r<n;r++){m.push([]);for(let c=0;c<n;c++)m[r].push(+SH[i][r*n+c]);}return m;};
 const fits=(m,x,y)=>m.every((row,r)=>row.every((v,c)=>!v||(x+c>=0&&x+c<BW&&y+r<BH&&(y+r<0||!bd[y+r][x+c]))));
 const spawn=()=>{pc={m:mk(nx),i:nx,x:4,y:0};if(pc.i===0)pc.y=-1;nx=ri(7);if(!fits(pc.m,pc.x,pc.y)){g.over='GAME OVER';S('boom');}};
 const lock=()=>{pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)bd[pc.y+r][pc.x+c]=pc.i+1;}));const full=[];for(let r=0;r<BH;r++)if(bd[r].every(v=>v))full.push(r);
  if(full.length){clr={rows:full,t:16};const n=full.length;lines+=n;const pts=[0,100,300,500,800][n]*(1+(lines/10|0));g.score+=pts;S('score');full.forEach(r=>{for(let c=0;c<BW;c+=2)fx.spark(OX+c*CS+6,OY+r*CS+6,'#ffffff',2,2.5);});fx.pop(OX+BW*CS/2,OY+full[0]*CS-4,n===4?'BLOCK DROP! +'+pts:'+'+pts,n===4?K.y:K.w);if(n===4){fx.flash('#ffffff',8);A.shake=6;}}else S('hit');pc=null;if(!clr)spawn();};spawn();
 const ghostY=()=>{let y=pc.y;while(fits(pc.m,pc.x,y+1))y++;return y;};
 g.update=()=>{if(slam)slam--;if(clr){if(--clr.t<=0){clr.rows.forEach(r=>{bd.splice(r,1);bd.unshift(Array(BW).fill(0));});clr=null;spawn();}return;}if(!pc)return;
  const h=A.hit(0),k=A.in(0),dx=ax(k);if(dx){if(rep===0||(rep>9&&rep%3===0)){if(fits(pc.m,pc.x+dx,pc.y))pc.x+=dx;}rep++;}else rep=0;
  if(h.u||h.a){const n=pc.m.length,m=pc.m.map((row,r)=>row.map((_,c)=>pc.m[n-1-c][r]));for(const o of[0,-1,1,-2,2])if(fits(m,pc.x+o,pc.y)){pc.m=m;pc.x+=o;S('blip');break;}}
  if(h.b){const y0=pc.y;while(fits(pc.m,pc.x,pc.y+1)){pc.y++;g.score++;}slam=8;A.shake=3;pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&r===pc.m.length-1||v&&!(pc.m[r+1]&&pc.m[r+1][c]))fx.spark(OX+(pc.x+c)*CS+6,OY+(pc.y+r)*CS+12,CO[pc.i],2,1.5);}));lock();t=0;return;}
  t+=k.d?8:1;if(k.d&&t%8===0)g.score+=0;if(t>=Math.max(4,40-(lines/6|0)*4)){t=0;if(fits(pc.m,pc.x,pc.y+1))pc.y++;else lock();}};
 const cell=(x,y,i,a)=>{if(a!==undefined)A.c.globalAlpha=a;X.block(OX+x*CS,OY+y*CS,CS,CS,CO[i],2);A.c.globalAlpha=1;};
 g.draw=()=>{X.cache('blocksbg',()=>{X.sky(['#2a1a5e','#120a30','#06040f']);X.stars(50,4,0,0,H,.5);X.glow(60,200,120,'#ff4f9a',.12);X.glow(270,40,120,'#2fd6c3',.12);X.rr(OX-5,OY-5,BW*CS+10,BH*CS+10,5,X.lg(0,OY,0,OY+BH*CS,['#6a5ab0','#2a2060']));X.vg(OX,OY,BW*CS,BH*CS,['#0c0a24','#05040e']);A.c.strokeStyle='rgba(255,255,255,.05)';A.c.lineWidth=1;A.c.beginPath();for(let c=1;c<BW;c++){A.c.moveTo(OX+c*CS,OY);A.c.lineTo(OX+c*CS,OY+BH*CS);}for(let r=1;r<BH;r++){A.c.moveTo(OX,OY+r*CS);A.c.lineTo(OX+BW*CS,OY+r*CS);}A.c.stroke();X.panel(6,22,76,46,K.y);X.panel(6,74,76,46,K.c);X.panel(6,126,76,30,K.p);X.panel(242,22,72,60,K.g);T('SCORE',12,28,K.gr);T('LINES',12,80,K.gr);T('LEVEL',12,132,K.gr);T('NEXT',248,28,K.gr);});
  bd.forEach((row,r)=>{const fl=clr&&clr.rows.includes(r);row.forEach((v,c)=>{if(v){if(fl){X.rr(OX+c*CS,OY+r*CS,CS,CS,2,clr.t%4<2?'#ffffff':CO[v-1]);}else cell(c,r,v-1);}});});
  if(pc&&!g.over){const gy=ghostY();pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&gy+r>=0)X.rrs(OX+(pc.x+c)*CS+1.5,OY+(gy+r)*CS+1.5,CS-3,CS-3,2,X.rgba(CO[pc.i],.6),1);}));
   X.glow(OX+(pc.x+pc.m.length/2)*CS,OY+(pc.y+pc.m.length/2)*CS,30,CO[pc.i],.18);pc.m.forEach((row,r)=>row.forEach((v,c)=>{if(v&&pc.y+r>=0)cell(pc.x+c,pc.y+r,pc.i);}));}
  T(g.score,12,40,K.y,2);T(lines,12,92,K.w,2);T(1+(lines/10|0),40,132,K.p,2);const m=mk(nx),n=m.length;m.forEach((row,r)=>row.forEach((v,c)=>{if(v)X.block(278-n*5+c*10,52-n*5+r*10,10,10,CO[nx],2);}));
  T('A ROTATE',248,92,K.gr);T('B SLAM',248,102,K.gr);T('DOWN SOFT',248,112,K.gr);fx.draw();};
 return g;}});

/* ---- MUNCH MAZE ---- */
A.add({id:'munch',name:'MUNCH MAZE',cat:'CLASSICS',how:'EAT EVERY PELLET. BIG PELLET = EAT BUGS.',make(){
 const g={over:null,score:0},fx=X.fx(),M=['###################','#........#........#','#o##.###.#.###.##o#','#.................#','#.##.#.#####.#.##.#','#....#...#...#....#','####.### # ###.####','   #.#       #.#   ','####.# ## ## #.####','    .  #   #  .    ','####.# ##### #.####','   #.#       #.#   ','####.# ##### #.####','#........#........#','#.##.###.#.###.##.#','#o..#....P....#..o#','##.#.#.#####.#.#.##','#....#...#...#....#','#.######.#.######.#','#.................#','###################'],CS=11,OX=8,OY=5;
 let dots,left,pl,bugs,lives=3,lvl=1,fr=0,wait=60,combo=0;
 const wall=(x,y)=>{x=(x+19)%19;return y<0||y>20||M[y][x]==='#';};
 const fill=()=>{dots=M.map(r=>r.split('').map(c=>c==='.'?1:c==='o'?2:0));left=dots.flat().filter(v=>v).length;};
 const place=()=>{pl={x:9,y:15,dx:0,dy:0,wx:0,wy:0,p:0,f:1,fy:0};bugs=[0,1,2].map(i=>({x:8+i,y:9,dx:0,dy:-1,p:0,home:60+i*90,c:['#ff4f4f','#ff7fd0','#ffa63f'][i],i}));fr=0;wait=60;};fill();place();
 g.update=()=>{if(wait>0){wait--;return;}if(fr>0)fr--;const k=A.in(0);if(ax(k)){pl.wx=ax(k);pl.wy=0;}else if(ay(k)){pl.wx=0;pl.wy=ay(k);}
  if(pl.p>0&&pl.wx===-pl.dx&&pl.wy===-pl.dy&&(pl.dx||pl.dy)){pl.x+=pl.dx;pl.y+=pl.dy;pl.x=(pl.x+19)%19;pl.dx=-pl.dx;pl.dy=-pl.dy;pl.p=1-pl.p;}
  if(pl.p===0){if((pl.wx||pl.wy)&&!wall(pl.x+pl.wx,pl.y+pl.wy)){pl.dx=pl.wx;pl.dy=pl.wy;}else if(wall(pl.x+pl.dx,pl.y+pl.dy)){pl.dx=pl.dy=0;}}
  if(pl.dx||pl.dy){pl.f=pl.dx;pl.fy=pl.dy;pl.p+=.13;if(pl.p>=1){pl.p=0;pl.x=(pl.x+pl.dx+19)%19;pl.y+=pl.dy;const v=dots[pl.y][pl.x];if(v){dots[pl.y][pl.x]=0;left--;g.score+=v===2?50:10;if(v===2){fr=360;combo=0;S('score');fx.ring(OX+pl.x*CS+5,OY+pl.y*CS+5,'#ffe08a',30);}else if(left%2)S('blip');
    if(left===0){lvl++;S('win');fx.flash('#ffffff',10);fill();place();return;}}}}
  for(const b of bugs){if(b.home>0){b.home--;if(b.home===0){b.x=9;b.y=7;b.p=0;b.dx=b.i%2?1:-1;b.dy=0;}continue;}
   if(b.p===0){let tx=pl.x,ty=pl.y;if(b.i===1){tx+=pl.dx*4;ty+=pl.dy*4;}if(b.i===2&&Math.hypot(b.x-pl.x,b.y-pl.y)<6){tx=1;ty=19;}
    let best=null,bd=1e9;for(const d of[[0,-1],[-1,0],[0,1],[1,0]]){if(d[0]===-b.dx&&d[1]===-b.dy)continue;if(wall(b.x+d[0],b.y+d[1]))continue;if(b.y+d[1]===8&&b.x===9&&d[1]===1)continue;
     let ds=Math.hypot(b.x+d[0]-tx,b.y+d[1]-ty);if(fr>0)ds=-ds+rnd(6);else ds+=rnd(2.5);if(ds<bd){bd=ds;best=d;}}
    if(!best)best=[-b.dx,-b.dy];b.dx=best[0];b.dy=best[1];}
   b.p+=(fr>0?.06:.085+lvl*.008);if(b.p>=1){b.p=0;b.x=(b.x+b.dx+19)%19;b.y+=b.dy;}
   const bx=b.x+b.dx*b.p,by=b.y+b.dy*b.p,px=pl.x+pl.dx*pl.p,py=pl.y+pl.dy*pl.p;
   if(Math.abs(bx-px)+Math.abs(by-py)<.7){if(fr>0){combo++;const pts=200*combo;g.score+=pts;S('coin');fx.spark(OX+bx*CS+5,OY+by*CS+5,'#6d8dff',12,2.5);fx.pop(OX+bx*CS+5,OY+by*CS-4,'+'+pts,'#9fd0ff');b.x=9;b.y=9;b.p=0;b.home=150;}else{lives--;S('boom');fx.flash(K.r,10);fx.spark(OX+px*CS+5,OY+py*CS+5,K.y,16,3);if(lives<=0){g.over='GAME OVER';return;}place();return;}}}};
 const drawMaze=()=>{const c=A.c;c.fillStyle='#04030c';c.fillRect(0,0,W,H);X.glow(110,120,150,'#2030a0',.18);
  for(let y=0;y<21;y++)for(let x=0;x<19;x++)if(M[y][x]==='#'){const X0=OX+x*CS,Y0=OY+y*CS;c.fillStyle='#3a5cff';c.fillRect(X0,Y0,CS,CS);}
  for(let y=0;y<21;y++)for(let x=0;x<19;x++)if(M[y][x]==='#'){const X0=OX+x*CS,Y0=OY+y*CS,wl=(xx,yy)=>xx<0||xx>18||yy<0||yy>20||M[yy][xx]==='#';const l=wl(x-1,y)?0:2,r=wl(x+1,y)?0:2,t=wl(x,y-1)?0:2,b=wl(x,y+1)?0:2;c.fillStyle='#0d1250';c.fillRect(X0+l,Y0+t,CS-l-r,CS-t-b);c.fillStyle='#16207a';c.fillRect(X0+l+1,Y0+t+1,CS-l-r-2>0?CS-l-r-2:0,1);}
  c.fillStyle='#ff9fd0';c.fillRect(OX+9*CS,OY+8*CS+4,CS,2);X.panel(222,6,94,228,'#3a5cff');T('SCORE',230,14,K.gr);T('LIVES',230,52,K.gr);T('LEVEL',230,92,K.gr);};
 g.draw=()=>{X.cache('munchbg',drawMaze);const pw=Math.sin(A.t*.15);
  for(let y=0;y<21;y++)for(let x=0;x<19;x++){const v=dots[y][x];if(v===1){A.c.fillStyle='#ffe6c0';A.c.fillRect(OX+x*CS+4.5,OY+y*CS+4.5,2,2);}else if(v===2){X.glow(OX+x*CS+5.5,OY+y*CS+5.5,9+pw*2,'#ffd080',.45);X.orb(OX+x*CS+5.5,OY+y*CS+5.5,3+pw*.6,'#ffe0a0');}}
  const px=OX+(pl.x+pl.dx*pl.p)*CS+5.5,py=OY+(pl.y+pl.dy*pl.p)*CS+5.5,an=pl.fy?pl.fy*1.5708:pl.f<0?Math.PI:0,mo=(pl.dx||pl.dy)?Math.abs(Math.sin(A.t*.35))*.75:.35;
  X.glow(px,py,14,'#ffd83a',.3);A.c.fillStyle=X.rg(px-2,py-2,.5,px,py,5.5,['#fff6b0','#ffd83a','#c89000']);A.c.beginPath();A.c.moveTo(px,py);A.c.arc(px,py,5.3,an+mo,an+6.2832-mo);A.c.closePath();A.c.fill();X.disc(px+Math.cos(an-1.6)*2.4,py+Math.sin(an-1.6)*2.4-(pl.fy?0:.5),.9,'#1a1a1a');
  bugs.forEach(b=>{const x=OX+(b.x+b.dx*b.p)*CS+5.5,y=OY+(b.y+b.dy*b.p)*CS+5.5+(b.home>0?Math.sin(A.t*.2+b.i)*1.5:0),scared=fr>0&&b.home===0,col=scared?(fr<90&&A.t%12<6?'#f0f0ff':'#2b4dff'):b.c;
   X.glow(x,y,12,scared?'#2b4dff':b.c,.25);A.c.fillStyle=X.lg(0,y-5,0,y+5,[X.lt(col.length===7?col:'#2b4dff',1.35),col]);A.c.beginPath();A.c.arc(x,y-1,5,Math.PI,0);A.c.lineTo(x+5,y+5);for(let i=0;i<3;i++){const w=10/3,xx=x+5-(i+1)*w,o=(A.t>>3)%2?1:0;A.c.lineTo(xx+w/2,y+3+o);A.c.lineTo(xx,y+5);}A.c.closePath();A.c.fill();
   if(scared){A.c.fillStyle='#ffd0d0';A.c.fillRect(x-2.5,y-2,1.4,1.4);A.c.fillRect(x+1.2,y-2,1.4,1.4);X.stroke([[x-3,y+2],[x-1.5,y+1],[0+x,y+2],[x+1.5,y+1],[x+3,y+2]],'#ffd0d0',.6);}
   else for(const s of[-2,2]){X.disc(x+s,y-1.5,1.7,'#ffffff');X.disc(x+s+b.dx*.8,y-1.5+b.dy*.8,.9,'#1a3aff');}});
  T(g.score,230,24,K.y,2);for(let i=0;i<lives;i++){const lx=238+i*16,ly=70;A.c.fillStyle='#ffd83a';A.c.beginPath();A.c.moveTo(lx,ly);A.c.arc(lx,ly,5,.6,5.68);A.c.closePath();A.c.fill();}T(lvl,230,102,K.c,2);
  if(fr>0){X.meter(230,130,78,6,fr/360,'#4d7dff');T('POWER!',230,140,'#9fd0ff');}if(wait>0)X.ot('READY!',113,125,K.y,2,'c');fx.draw();};
 return g;}});

/* ---- GIRDER CLIMB ---- */
A.add({id:'girder',name:'GIRDER CLIMB',cat:'CLASSICS',how:'REACH THE FLAG. A JUMPS COGS. UP/DOWN ON LADDERS.',make(){
 const g={over:null,score:0},fx=X.fx(),PL=[{y:222,x0:0,x1:320},{y:182,x0:0,x1:286},{y:142,x0:34,x1:320},{y:102,x0:0,x1:286},{y:62,x0:34,x1:320}],LD=[{x:250,a:182,b:222},{x:70,a:142,b:182},{x:170,a:142,b:182},{x:250,a:102,b:142},{x:120,a:102,b:142},{x:70,a:62,b:102}];
 let p,cogs,lives=3,lvl=1,sp=0,bonus=3000,boss=0;const dirOf=q=>q.x0>0?-1:q.x1<320?1:-1;
 const platAt=(x,y)=>PL.find(q=>Math.abs(q.y-y)<1.5&&x>=q.x0&&x<=q.x1);
 const reset=()=>{p={x:30,y:222,vy:0,lad:null,air:false,f:1,st:0};cogs=[];sp=40;};reset();
 g.update=()=>{const k=A.in(0),h=A.hit(0);if(bonus>0&&A.t%6===0)bonus-=10;if(boss)boss--;
  if(p.lad){p.y+=ay(k)*1.1;if(ay(k))p.st+=.25;if(p.y<=p.lad.a){p.y=p.lad.a;p.lad=null;}else if(p.y>=p.lad.b){p.y=p.lad.b;p.lad=null;}}
  else{const on=platAt(p.x,p.y)&&p.vy>=0;if(on){p.air=false;p.vy=0;const l=LD.find(l=>Math.abs(l.x-p.x)<7&&((k.u&&Math.abs(p.y-l.b)<2)||(k.d&&Math.abs(p.y-l.a)<2)));if(l){p.lad=l;p.x=l.x;p.y+=k.u?-1:1;}else if(h.a){p.vy=-3.1;p.air=true;S('jump');fx.spark(p.x,p.y,'#c8b8a0',4,1);}}
   if(!p.lad){p.x=cl(p.x+ax(k)*1.5,6,W-6);if(ax(k)){p.f=ax(k);if(!p.air)p.st+=.3;}if(!platAt(p.x,p.y)||p.vy<0||p.air){p.air=true;const oy=p.y;p.vy+=.22;p.y+=p.vy;if(p.vy>0){const q=PL.find(q=>oy<=q.y&&p.y>=q.y&&p.x>=q.x0&&p.x<=q.x1);if(q){p.y=q.y;p.vy=0;p.air=false;}}}}}
  if(p.y<=62&&!p.lad&&p.x<110){g.score+=bonus+500;fx.pop(p.x,p.y-40,'+'+(bonus+500),K.y);fx.flash(K.y,10);bonus=3000;lvl++;S('win');reset();return;}
  if(--sp<=0){sp=Math.max(45,130-lvl*12)+rnd(40);cogs.push({x:286,y:62,d:-1,vy:0,lad:null,j:0,r:0});boss=20;}
  for(const c of cogs){const v=1.1+lvl*.15;c.r+=c.d*v*.18;if(c.lad){c.y+=1.2;if(c.y>=c.lad.b){c.y=c.lad.b;c.lad=null;c.d=dirOf(platAt(c.x,c.y)||PL[0]);}}
   else{const q=platAt(c.x,c.y);if(q&&c.vy>=0){c.vy=0;c.y=q.y;if(!c.set||c.set!==q){c.set=q;c.d=dirOf(q);}c.x+=c.d*v;const l=LD.find(l=>Math.abs(l.x-c.x)<v/2+.1&&l.a===q.y);if(l&&Math.random()<.3){c.lad=l;c.x=l.x;}}
    else{c.vy+=.2;const oy=c.y;c.y+=c.vy;const n=PL.find(q=>oy<q.y&&c.y>=q.y&&c.x>=q.x0-2&&c.x<=q.x1+2);if(n){c.y=n.y;c.vy=0;c.x=cl(c.x,n.x0,n.x1);fx.spark(c.x,c.y,'#ffb060',4,1.2);}}}
   const dx=Math.abs(c.x-p.x),dy=p.y-c.y;if(dx<8&&Math.abs(dy)<9){lives--;S('boom');fx.flash(K.r,10);fx.debris(p.x,p.y-10,'#4dabff',10,2);if(lives<=0){g.over='GAME OVER';return;}reset();return;}
   if(p.air&&!c.j&&dx<5&&dy<-8&&dy>-30){c.j=1;g.score+=100;S('coin');fx.pop(p.x,p.y-38,'+100',K.y);}}
  cogs=cogs.filter(c=>c.x>-10&&c.y<H+10);};
 const bg=()=>{X.sky(['#0b1240','#3b2a70','#d06a5a'],H);X.stars(40,7,0,0,120,.7);X.disc(250,150,30,'rgba(255,190,120,.25)');X.skyline(240,'#1a1438',0,3,'rgba(255,210,120,.5)');X.skyline(240,'#0e0b22',140,9,'rgba(255,230,160,.35)');
  LD.forEach(l=>{const c=A.c;for(const sx of[-5,4]){c.fillStyle=X.lg(l.x+sx,0,l.x+sx+2,0,['#d0e8f0','#5a8a9a']);c.fillRect(l.x+sx,l.a,2,l.b-l.a);}for(let y=l.a+4;y<l.b;y+=6){c.fillStyle='#9ac8d8';c.fillRect(l.x-4,y,9,1.4);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(l.x-4,y+1.4,9,.6);}});
  PL.forEach(q=>{const w=q.x1-q.x0,c=A.c;c.fillStyle=X.lg(0,q.y,0,q.y+6,['#ff8090','#d02848','#701020']);c.fillRect(q.x0,q.y,w,6);c.strokeStyle='#7a1028';c.lineWidth=1;c.beginPath();for(let x=q.x0;x<q.x1-6;x+=8){c.moveTo(x,q.y+5.5);c.lineTo(x+4,q.y+1);c.lineTo(x+8,q.y+5.5);}c.stroke();c.fillStyle='#ffd0d8';c.fillRect(q.x0,q.y,w,1);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(q.x0,q.y+6,w,2);for(let x=q.x0+4;x<q.x1;x+=16){c.fillStyle='#ffe0e0';c.fillRect(x,q.y+2,1,1);}});};
 g.draw=()=>{X.cache('girderbg',bg);
  /* flag */const fw=Math.sin(A.t*.15);A.c.fillStyle='#ddd';A.c.fillRect(60,36,2,26);X.poly([[62,37],[76,39+fw],[74,44+fw],[62,46]],X.lg(62,0,76,0,['#ffe680','#ffb020']));
  /* boss robot */const bx=300,by=62,sh=boss?Math.sin(boss)*1.5:0;X.shadow(bx,by,12,2);X.block(bx-12+sh,by-30,24,22,'#7a7f9a',4);X.block(bx-8+sh,by-38,16,10,'#8a90ae',3);X.glow(bx-3+sh,by-33,6,'#ff3040',.6);X.disc(bx-3+sh,by-33,1.6,'#ff6070');X.disc(bx+3+sh,by-33,1.6,'#ff6070');A.c.fillStyle='#222';A.c.fillRect(bx-6+sh,by-18,12,2);R(bx-16+sh,by-26+(boss?-4:0),5,12,'#5a5f7a');R(bx+11+sh,by-26,5,12,'#5a5f7a');
  cogs.forEach(c=>{const cx=c.x,cy=c.y-6;X.shadow(cx,c.y,5,1.3,.35);A.c.save();A.c.translate(cx,cy);A.c.rotate(c.r);A.c.fillStyle='#8a4a10';for(let i=0;i<8;i++){A.c.rotate(.785);A.c.fillRect(-1.3,-7.2,2.6,3);}A.c.restore();X.orb(cx,cy,5.6,'#ff9a30',0);X.disc(cx,cy,2,'#5a2a08');X.disc(cx-1.6,cy-2,1,'rgba(255,255,255,.6)');});
  const st=p.lad?Math.sin(p.st)*1.2:p.air?1.2:p.st;A.person(p.x,p.y,{s:.6,c:'#3a7bff',pants:'#2a3a6a',cap:'#ff4f4f',st,d:p.f,arm1:p.lad?-2.8+Math.sin(p.st)*.4:p.air?-2.4:undefined,arm2:p.lad?2.8-Math.sin(p.st)*.4:p.air?2.4:undefined,id:2});
  fx.draw();X.bar('SCORE '+g.score,'LV '+lvl,'BONUS '+bonus);for(let i=0;i<lives;i++)X.heart(W-50-i*11,8,1);};
 return g;}});

/* ---- INVADER WAVE ---- */
A.add({id:'invaders',name:'INVADER WAVE',cat:'CLASSICS',how:'MOVE. A FIRES. HIDE BEHIND BUNKERS. STOP THE WAVE.',make(){
 const g={over:null,score:0},fx=X.fx(),SP=[['00100000100','00010001000','00111111100','01101110110','11111111111','10111111101','10100000101','00011011000'],['00011111000','01111111110','11111111111','11100100111','11111111111','00110001100','01101110110','11000000011'],['00001100000','00011110000','00111111000','01101101100','01111111100','00010010000','00101101000','01010010100']];
 const SC=['#ff5fb0','#3fe0ff','#7dff6a'];let px=160,shs=[],en,bm=[],dir=1,lives=3,wave=1,t=0,bunk=[],ufo=null,hitF=0,muz=0,frame=0;
 const build=()=>{en=[];for(let r=0;r<5;r++)for(let c=0;c<9;c++)en.push({x:30+c*26,y:34+r*16+Math.min(wave-1,4)*8,r,ty:r===0?0:r<3?1:2});dir=1;bm=[];};
 const mkB=()=>{bunk=[];for(let b=0;b<4;b++)for(let y=0;y<5;y++)for(let x=0;x<8;x++){if(y===0&&(x===0||x===7))continue;if(y>=3&&x>=3&&x<=4)continue;bunk.push({x:34+b*76+x*3,y:184+y*3});}};build();mkB();
 const hitBunk=(x,y)=>{const i=bunk.findIndex(c=>x>=c.x-1&&x<c.x+4&&y>=c.y-1&&y<c.y+4);if(i>=0){fx.spark(bunk[i].x+1,bunk[i].y+1,'#7dff6a',3,1);bunk.splice(i,1);return true;}return false;};
 g.update=()=>{px=cl(px+ax(A.in(0))*2.8,10,W-10);if(hitF)hitF--;if(muz)muz--;if(A.fire(10)&&shs.length<4){shs.push({x:px,y:208});S('shoot');muz=4;}
  for(const sh of shs){sh.y-=6;if(hitBunk(sh.x,sh.y)){sh.y=-99;continue;}const e=en.find(e=>Math.abs(e.x-sh.x)<9&&Math.abs(e.y-sh.y)<7);if(e){en.splice(en.indexOf(e),1);g.score+=(5-e.r)*10;sh.y=-99;S('hit');fx.spark(e.x,e.y,SC[e.ty],10,2.5);fx.ring(e.x,e.y,SC[e.ty],12,12);fx.debris(e.x,e.y,SC[e.ty],4,1.5);}
   if(ufo&&Math.abs(sh.x-ufo.x)<12&&Math.abs(sh.y-ufo.y)<6){const pts=[100,150,300][ri(3)];g.score+=pts;S('score');fx.spark(ufo.x,ufo.y,K.r,18,3);fx.ring(ufo.x,ufo.y,K.y,30);fx.pop(ufo.x,ufo.y+8,'+'+pts,K.y);ufo=null;sh.y=-99;}}shs=shs.filter(s=>s.y>=20);
  if(++t>=Math.max(2,Math.floor(en.length/2.2))){t=0;frame^=1;let edge=en.some(e=>(dir>0&&e.x>W-16)||(dir<0&&e.x<16));if(edge){dir=-dir;en.forEach(e=>e.y+=8);}else en.forEach(e=>e.x+=dir*4);}
  en.forEach(e=>{if(e.y>178)hitBunk(e.x,e.y)||hitBunk(e.x-4,e.y)||hitBunk(e.x+4,e.y);});
  if(!ufo&&A.t%1200===600)ufo={x:-14,y:28,v:1.1};if(ufo){ufo.x+=ufo.v;if(ufo.x>W+16)ufo=null;}
  if(en.length&&Math.random()<.015+wave*.004){const e=en[ri(en.length)];bm.push({x:e.x,y:e.y+6});}
  for(const b of bm){b.y+=2.2+wave*.15;if(hitBunk(b.x,b.y)){b.y=999;continue;}if(Math.abs(b.x-px)<8&&b.y>206&&b.y<222){b.y=999;lives--;S('boom');hitF=20;fx.flash(K.r,10);fx.spark(px,214,'#7dff6a',16,3);if(lives<=0)g.over='GAME OVER';}}bm=bm.filter(b=>b.y<H);
  if(en.some(e=>e.y>200))g.over='THEY LANDED!';if(!en.length){wave++;g.score+=100;S('win');fx.pop(160,110,'WAVE '+wave,K.y);build();if(bunk.length<60)mkB();}};
 const bg=()=>{X.sky(['#02010a','#0c0830','#1d0c3c'],H);X.glow(250,70,110,'#7a2aff',.18);X.glow(60,150,90,'#ff2a8a',.10);X.stars(90,11,0,0,H,.8);X.disc(270,250,90,X.rg(250,190,10,270,250,90,['#6a4ab0','#2a1a5a','#100830']));X.vg(0,226,W,14,['#1a3a2a','#08140e']);A.c.fillStyle='#7dff6a';A.c.fillRect(0,226,W,1);};
 const spr=(e)=>{const m=SP[e.ty],c=A.c,x0=e.x-5.5,y0=e.y-4;c.fillStyle=X.lg(0,y0,0,y0+8,[X.lt(SC[e.ty],1.2),SC[e.ty],X.lt(SC[e.ty],.7)]);for(let y=0;y<8;y++){const row=frame&&y>=6?(y===6?m[7]:m[6]):m[y];for(let x=0;x<11;x++)if(row[x]==='1')c.fillRect(x0+x,y0+y,1.02,1.02);}c.fillStyle='#fff';c.fillRect(x0+3+(e.ty===2?1:0),y0+3,1,1);c.fillRect(x0+7-(e.ty===2?1:0),y0+3,1,1);};
 g.draw=()=>{X.cache('invbg',bg);en.forEach(e=>X.glow(e.x,e.y,9,SC[e.ty],.12));en.forEach(spr);
  bunk.forEach(c=>{A.c.fillStyle=(c.x+c.y)%2?'#4fd060':'#62e874';A.c.fillRect(c.x,c.y,3,3);});
  if(ufo){X.glow(ufo.x,ufo.y,16,K.r,.4);X.ell(ufo.x,ufo.y+1,12,4,X.lg(0,ufo.y-3,0,ufo.y+5,['#ff9aa0','#d02040']));X.ell(ufo.x,ufo.y-2,5,3.5,'rgba(180,240,255,.85)');for(let i=-2;i<=2;i++)X.disc(ufo.x+i*4.5,ufo.y+2,.9,(A.t>>3)%5===i+2?K.y:'#ffd0d0');}
  bm.forEach(b=>{X.glow(b.x,b.y+3,6,K.o,.5);X.stroke([[b.x,b.y],[b.x+1.5,b.y+2],[b.x-1.5,b.y+4],[b.x,b.y+6]],'#ffd070',1.2);});
  shs.forEach(sh=>{X.glow(sh.x,sh.y+3,7,'#7ff0ff',.6);A.c.fillStyle='#e8ffff';A.c.fillRect(sh.x-.8,sh.y,1.6,7);});
  if(!(hitF&&A.t%4<2)){X.glow(px,216,16,'#7dff6a',.2);X.poly([[px-10,222],[px+10,222],[px+8,216],[px+3,214],[px+1.5,209],[px-1.5,209],[px-3,214],[px-8,216]],X.lg(0,209,0,222,['#e0ffe0','#6ae070','#1c7a2a']));A.c.fillStyle='#bfffff';A.c.fillRect(px-1,213,2,2);if(muz)X.glow(px,207,8,'#ffffff',.8);}
  fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);for(let i=0;i<lives;i++)X.heart(W-72-i*11,8,1,'#7dff6a');};
 return g;}});

/* ---- ROCK BLASTER ---- */
A.add({id:'rocks',name:'ROCK BLASTER',cat:'CLASSICS',how:'TURN. UP THRUSTS. A FIRES.',make(){
 const g={over:null,score:0},fx=X.fx();let s,rk=[],bl=[],lives=3,lvl=0,inv=120,sx=0,sy=0,msg=90;
 const mkR=(x,y,r)=>{const sh=[];for(let i=0;i<10;i++)sh.push(.72+rnd(.3));const cr=[];for(let i=0;i<3;i++)cr.push([rnd(1.2)-.6,rnd(1.2)-.6,.12+rnd(.15)]);return{x,y,vx:rnd(1.6)-.8,vy:rnd(1.6)-.8,r,sh,cr,a:rnd(6),va:rnd(.04)-.02,tone:ri(3)};};
 const wave=()=>{lvl++;msg=90;for(let i=0;i<3+lvl;i++){let x,y;do{x=rnd(W);y=rnd(H);}while(Math.hypot(x-160,y-120)<70);rk.push(mkR(x,y,16));}};
 s={x:160,y:120,vx:0,vy:0,a:-1.57};wave();const wr=o=>{o.x=(o.x+W)%W;o.y=(o.y+H)%H;};
 g.update=()=>{const k=A.in(0);if(msg)msg--;s.a+=ax(k)*.075;if(k.u){s.vx+=Math.cos(s.a)*.07;s.vy+=Math.sin(s.a)*.07;}s.vx*=.994;s.vy*=.994;s.x+=s.vx;s.y+=s.vy;sx+=s.vx;sy+=s.vy;wr(s);if(inv>0)inv--;
  if(A.fire(8)&&bl.length<12){bl.push({x:s.x+Math.cos(s.a)*8,y:s.y+Math.sin(s.a)*8,vx:Math.cos(s.a)*4.5+s.vx,vy:Math.sin(s.a)*4.5+s.vy,t:55});S('shoot');}
  bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;wr(b);b.t--;});const add=[];
  for(const r of rk){r.x+=r.vx;r.y+=r.vy;r.a+=r.va;wr(r);for(const b of bl)if(b.t>0&&Math.hypot(b.x-r.x,b.y-r.y)<r.r){b.t=0;r.dead=1;g.score+=r.r>12?20:r.r>6?50:100;S(r.r>12?'boom':'hit');if(r.r>12)A.shake=4;fx.debris(r.x,r.y,['#a08a78','#8a8aa0','#b09070'][r.tone],r.r>12?10:6,2);fx.spark(r.x,r.y,'#ffd0a0',8,2.5);fx.ring(r.x,r.y,'#ffb080',r.r*1.6,14);if(r.r>5)for(let i=0;i<2;i++){const n=mkR(r.x,r.y,r.r/2);n.vx=rnd(2.4)-1.2;n.vy=rnd(2.4)-1.2;add.push(n);}break;}
   if(!r.dead&&inv===0&&Math.hypot(s.x-r.x,s.y-r.y)<r.r+4){lives--;inv=150;fx.spark(s.x,s.y,'#7ff0ff',20,3.5);fx.ring(s.x,s.y,'#7ff0ff',40);fx.flash(K.r,8);s.x=160;s.y=120;s.vx=s.vy=0;S('boom');if(lives<=0)g.over='GAME OVER';}}
  rk=rk.filter(r=>!r.dead).concat(add);bl=bl.filter(b=>b.t>0);if(!rk.length)wave();};
 g.draw=()=>{X.cache('rocksbg',()=>{X.sky(['#060414','#0a0a24','#05030c']);X.glow(80,70,130,'#3a1a8a',.35);X.glow(260,180,120,'#0a5a7a',.30);X.glow(200,40,70,'#8a2a5a',.18);});X.stars(70,3,sx*.6,sy*.6,H,.9);X.stars(30,9,sx*1.6,sy*1.6,H,.6);
  rk.forEach(r=>{const p=[];for(let i=0;i<10;i++){const a=r.a+i*.628;p.push([r.x+Math.cos(a)*r.r*r.sh[i],r.y+Math.sin(a)*r.r*r.sh[i]]);}const base=['#8a7462','#6e6e84','#947a5a'][r.tone];
   X.poly(p,X.rg(r.x-r.r*.4,r.y-r.r*.4,1,r.x,r.y,r.r*1.1,[X.lt(base,1.45),base,X.lt(base,.4)]));r.cr.forEach(c=>{const cx=r.x+(c[0]*Math.cos(r.a)-c[1]*Math.sin(r.a))*r.r,cy=r.y+(c[0]*Math.sin(r.a)+c[1]*Math.cos(r.a))*r.r;X.disc(cx,cy,c[2]*r.r,'rgba(0,0,0,.28)');X.disc(cx-.6,cy-.6,c[2]*r.r*.6,'rgba(255,255,255,.08)');});X.polys(p,'rgba(255,230,200,.35)',.8);});
  bl.forEach(b=>{X.glow(b.x,b.y,6,'#ffd070',.6);X.stroke([[b.x,b.y],[b.x-b.vx*1.2,b.y-b.vy*1.2]],'#fff0b0',1.4);});
  if(inv%10<6||inv===0){const c=Math.cos(s.a),n=Math.sin(s.a);if(A.in(0).u){const fl=8+rnd(5);X.glow(s.x-c*8,s.y-n*8,10,'#ff8030',.6);X.poly([[s.x-c*4-n*3,s.y-n*4+c*3],[s.x-c*(4+fl),s.y-n*(4+fl)],[s.x-c*4+n*3,s.y-n*4-c*3]],X.lg(s.x-c*4,s.y-n*4,s.x-c*14,s.y-n*14,['#fff0a0','#ff8030','rgba(255,40,0,0)']));}
   const P=[[s.x+c*9,s.y+n*9],[s.x-c*6-n*6,s.y-n*6+c*6],[s.x-c*3,s.y-n*3],[s.x-c*6+n*6,s.y-n*6-c*6]];X.poly(P,X.lg(s.x-n*6,s.y+c*6,s.x+n*6,s.y-c*6,['#2a8aa0','#bff8ff','#2a8aa0']));X.polys(P,'#e8ffff',.7);X.disc(s.x+c*2,s.y+n*2,1.5,'#ff5a7a');if(inv>0)A.ring(s.x,s.y,12+Math.sin(A.t*.3)*1.5,'rgba(127,240,255,.5)');}
  fx.draw();X.bar('SCORE '+g.score,'',' WAVE '+lvl);for(let i=0;i<lives;i++){const lx=W-10-i*12,ly=9;X.poly([[lx,ly-5],[lx+4,ly+4],[lx,ly+2],[lx-4,ly+4]],'#7ff0ff');}if(msg&&msg<80)X.ot('WAVE '+lvl,160,104,K.y,3,'c');};
 return g;}});
})();
