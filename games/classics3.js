(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- SPACE DEFENDER ---- */
A.add({id:'defender',name:'SPACE DEFENDER',cat:'CLASSICS',how:'FLY LEFT/RIGHT. A FIRES FORWARD. SAVE THE FALLING PODS.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:100,y:120,d:1,vx:0},en=[],bl=[],pods=[],lives=3,inv=0,t=0,cam=0;for(let i=0;i<6;i++)pods.push({x:rnd(1200),y:200,v:0});
 g.update=()=>{t++;const k=A.in(0);if(ax(k))p.d=ax(k);p.vx=(p.vx+ax(k)*.3)*.94;p.x+=p.vx;p.y=cl(p.y+ay(k)*2.5,30,200);if(inv>0)inv--;cam+=(p.x-160+p.d*60-cam)*.2;
  if(A.fire(6)){bl.push({x:p.x+p.d*10,y:p.y,vx:p.d*7+p.vx,t:40});S('shoot');}if(t%Math.max(30,90-(t/100|0))===0)en.push({x:p.x+(Math.random()<.5?-400:400),y:30+rnd(100),vx:0,vy:0,c:0});
  bl.forEach(b=>{b.x+=b.vx;b.t--;});bl=bl.filter(b=>b.t>0);
  for(const e of en){const tg=pods.find(q=>q.v===0&&Math.abs(q.x-e.x)<200);if(tg&&!e.c){e.vx=(tg.x-e.x)*.01;e.vy=(tg.y-e.y)*.01;if(Math.abs(tg.x-e.x)<6&&Math.abs(tg.y-e.y)<8){e.c=tg;tg.v=1;}}else if(e.c){e.vy=-.8;e.c.x=e.x;e.c.y=e.y+8;if(e.y<0){e.dead=1;pods.splice(pods.indexOf(e.c),1);S('lose');fx.flash(K.r,6);}}else{e.vx=(p.x-e.x)*.005;e.vy=(p.y-e.y)*.01;}e.x+=e.vx;e.y+=e.vy;
   for(const b of bl)if(Math.abs(b.x-e.x)<8&&Math.abs(b.y-e.y)<8){e.dead=1;b.t=0;g.score+=e.c?150:50;if(e.c){e.c.v=2;fx.pop(e.x-cam,e.y-10,'RESCUE!',K.g);}S('hit');fx.spark(e.x-cam,e.y,'#7dff6a',12,2.5);fx.ring(e.x-cam,e.y,'#bfffa0',16,12);}
   if(inv===0&&Math.abs(p.x-e.x)<10&&Math.abs(p.y-e.y)<8){e.dead=1;lives--;inv=90;S('boom');fx.flash(K.r,8);fx.spark(p.x-cam,p.y,K.c,18,3);if(lives<=0)g.over='DEFEATED';}}
  en=en.filter(e=>!e.dead);pods.forEach(q=>{if(q.v===2){q.y+=1.5;if(q.y>=200){q.y=200;q.v=0;g.score+=100;S('coin');fx.pop(q.x-cam,190,'+100',K.y);}}});if(!pods.length)g.over='PODS LOST';};
 g.draw=()=>{X.cache('defsky',()=>{X.sky(['#02010a','#0a0828','#1a0f3a','#2a1440'],H);X.glow(220,60,100,'#5a2aaa',.25);X.glow(60,140,90,'#2a6aaa',.18);});const c=A.c;X.stars(60,6,cam*.2,0,190,.9);X.stars(25,13,cam*.5,0,190,.6);
  X.hills(206,34,'#2a1a4a',cam*.35,.02,2);X.hills(212,22,'#1a1036',cam*.7,.035,6);
  X.vg(0,208,W,32,['#2a1a50','#120a28']);c.fillStyle='rgba(255,200,120,.6)';for(let i=0;i<40;i++){const x=((i*53-cam)%640+640)%640-160;if(x>-2&&x<W)c.fillRect(x,212+(i*7)%10,1.5,1.5);}
  pods.forEach(q=>{const x=q.x-cam;if(x>-10&&x<W+10){X.glow(x,q.y-5,9,'#3dff8b',.35);X.rr(x-3.5,q.y-10,7,10,3,X.lg(0,q.y-10,0,q.y,['#c0ffd0','#3ddc84','#1a7a4a']));X.disc(x,q.y-12,2.6,'#f1c7a3');if(q.v===1&&A.t%10<5)X.ot('HELP',x,q.y-24,K.y,1,'c');}});
  en.forEach(e=>{const x=e.x-cam;if(x<-20||x>W+20)return;X.glow(x,e.y,12,'#7dff6a',.3);X.ell(x,e.y,9,3.5,X.lg(0,e.y-3,0,e.y+3,['#c8ffb0','#4ac040','#1a5a1a']));X.ell(x,e.y-3,4.5,3.5,'rgba(200,255,255,.8)');c.fillStyle='#1a3a1a';c.fillRect(x-7,e.y+2,1.2,4);c.fillRect(x+6,e.y+2,1.2,4);for(let i=-1;i<=1;i++)X.disc(x+i*4,e.y+.5,.9,(A.t>>2)%3===i+1?K.y:'#ff6060');if(e.c)X.stroke([[x,e.y+3],[x,e.y+8]],'rgba(120,255,160,.6)',2);});
  bl.forEach(b=>{const x=b.x-cam;X.glow(x,b.y,6,'#ffd060',.6);X.stroke([[x,b.y],[x-Math.sign(b.vx)*12,b.y]],'#fff0a0',1.6);});
  if(inv%8<5){const x=p.x-cam,d=p.d,y=p.y;if(Math.abs(p.vx)>.3){const fl=6+rnd(4)+Math.abs(p.vx)*2;X.glow(x-d*11,y,8,'#ff8030',.6);X.poly([[x-d*9,y-2],[x-d*(9+fl),y],[x-d*9,y+2]],'#ffb040');}
   X.poly([[x+d*13,y+1],[x-d*9,y-5],[x-d*6,y],[x-d*9,y+5]],X.lg(0,y-5,0,y+5,['#e8ffff','#4ad0e0','#1a6a8a']));X.poly([[x+d*2,y-2],[x+d*8,y],[x+d*2,y+1]],'#1a2a4a');X.poly([[x-d*4,y-3],[x-d*9,y-8],[x-d*7,y-3]],'#ff4f6d');}
  fx.draw();X.bar('SCORE '+g.score,'PODS '+pods.length);for(let i=0;i<lives;i++)X.heart(W-74-i*11,8,1,K.c);
  X.panel(98,222,124,12,K.c);pods.forEach(q=>{c.fillStyle='#3dff8b';c.fillRect(100+((q.x%1200+1200)%1200)/10,225,2,6);});en.forEach(e=>{c.fillStyle='#ff6060';c.fillRect(100+((e.x%1200+1200)%1200)/10,225,2,6);});c.fillStyle='#ffffff';c.fillRect(100+((p.x%1200+1200)%1200)/10,224,2,8);};
 return g;}});

/* ---- BUBBLE POP ---- */
A.add({id:'bubbles',name:'BUBBLE POP',cat:'CLASSICS',how:'LEFT/RIGHT AIM. A SHOOTS. MATCH 3 TO POP.',make(){
 const g={over:null,score:0},CW=14,CO=['#ff4f6d','#ffcf3f','#3ddc84','#4dabff','#c86dff'],fx=X.fx();let grid={},ang=-1.57,sh=null,nxt=ri(5),shots=0,falls=[],kick=0;
 const key=(c,r)=>c+','+r;const pos=(c,r)=>[20+c*20+(r%2?10:0),20+r*17];
 for(let r=0;r<5;r++)for(let c=0;c<CW-(r%2);c++)grid[key(c,r)]=ri(5);
 const nb=(c,r)=>r%2?[[c-1,r],[c+1,r],[c,r-1],[c+1,r-1],[c,r+1],[c+1,r+1]]:[[c-1,r],[c+1,r],[c-1,r-1],[c,r-1],[c-1,r+1],[c,r+1]];
 const flood=(c,r,same)=>{const seen=new Set(),st=[[c,r]],col=grid[key(c,r)];while(st.length){const[x,y]=st.pop(),k=key(x,y);if(seen.has(k)||!(k in grid))continue;if(same&&grid[k]!==col)continue;seen.add(k);nb(x,y).forEach(n=>st.push(n));}return seen;};
 g.update=()=>{if(kick)kick--;falls.forEach(f=>{f.vy+=.25;f.x+=f.vx;f.y+=f.vy;});falls=falls.filter(f=>f.y<H+12);
  if(sh){sh.x+=sh.vx;sh.y+=sh.vy;if(sh.x<8||sh.x>W-8){sh.vx*=-1;S('blip');}let land=sh.y<24;for(const k in grid){const[c,r]=k.split(',').map(Number),[px,py]=pos(c,r);if(Math.hypot(px-sh.x,py-sh.y)<18){land=true;break;}}
   if(land){let r=Math.round((sh.y-20)/17);r=Math.max(0,r);let c=Math.round((sh.x-20-(r%2?10:0))/20);c=cl(c,0,CW-1-(r%2));while(key(c,r) in grid)r++;grid[key(c,r)]=sh.col;const grp=flood(c,r,true);
    if(grp.size>=3){grp.forEach(k=>{const[cc,rr]=k.split(',').map(Number),[px,py]=pos(cc,rr);fx.spark(px,py,CO[grid[k]],6,2.5);fx.ring(px,py,CO[grid[k]],12,12);delete grid[k];});g.score+=grp.size*10;S('score');fx.pop(sh.x,sh.y,'+'+grp.size*10,K.w);
     const anch=new Set();for(const k in grid)if(k.endsWith(',0'))flood(...k.split(',').map(Number),false).forEach(x=>anch.add(x));let dropped=0;for(const k in grid)if(!anch.has(k)){const[cc,rr]=k.split(',').map(Number),[px,py]=pos(cc,rr);falls.push({x:px,y:py,vx:rnd(2)-1,vy:-rnd(2),c:grid[k]});delete grid[k];g.score+=20;dropped++;}if(dropped)fx.pop(160,120,'DROP x'+dropped,K.y);}else S('hit');
    sh=null;shots++;if(shots%6===0){const ng={};for(const k in grid){const[c,r]=k.split(',').map(Number);ng[key(c,r+1)]=grid[k];}grid=ng;for(let c=0;c<CW;c++)grid[key(c,0)]=ri(5);A.shake=3;}
    if(Object.keys(grid).some(k=>+k.split(',')[1]>=11))g.over='OVERFLOW';if(!Object.keys(grid).length)g.over='BOARD CLEAR! WIN';}return;}
  const k=A.in(0);ang=cl(ang+ax(k)*.03,-2.9,-.25);if(A.hit(0).a){sh={x:160,y:222,vx:Math.cos(ang)*5,vy:Math.sin(ang)*5,col:nxt};nxt=ri(5);S('shoot');kick=8;}};
 const bub=(x,y,col,r)=>{r=r||9;X.disc(x,y+1.5,r,'rgba(0,0,0,.25)');X.disc(x,y,r,X.rg(x-r*.35,y-r*.4,1,x,y,r,[X.lt(col,1.6),col,X.lt(col,.55)]));X.ell(x-r*.35,y-r*.42,r*.35,r*.22,'rgba(255,255,255,.75)',-.6);A.c.strokeStyle=X.rgba(col,.9);A.c.lineWidth=.6;A.c.beginPath();A.c.arc(x,y,r-.3,0,6.2832);A.c.stroke();};
 g.draw=()=>{X.cache('bubbg',()=>{X.sky(['#1a2a5a','#2a1a4a','#100820']);X.glow(80,80,120,'#3a6aff',.18);X.glow(260,160,110,'#ff3a9a',.14);for(let i=0;i<24;i++)A.ring((i*67)%W,(i*41)%200,3+(i%4)*3,'rgba(160,200,255,.12)');X.vg(0,0,4,H,['#6a7ab0','#2a3060']);X.vg(W-4,0,4,H,['#6a7ab0','#2a3060']);});const c=A.c;
  const lim=20+10.5*17;c.fillStyle=X.rgba('#ff4f6d',.25+.15*Math.sin(A.t*.1));c.fillRect(4,lim,W-8,1);
  for(const k in grid){const[cc,r]=k.split(',').map(Number),[x,y]=pos(cc,r);bub(x,y,CO[grid[k]]);}falls.forEach(f=>bub(f.x,f.y,CO[f.c],8));
  if(!sh){let x=160,y=222,vx=Math.cos(ang),vy=Math.sin(ang);for(let i=1;i<26;i++){x+=vx*7;y+=vy*7;if(x<8||x>W-8)vx=-vx;if(y<20)break;c.globalAlpha=1-i/28;X.disc(x,y,1.3,'#ffffff');}c.globalAlpha=1;}
  X.disc(160,232,22,X.rg(160,226,2,160,232,22,['#8a9ad0','#3a4a80','#1a2040']));c.save();c.translate(160,222);c.rotate(ang+1.5708);c.fillStyle=X.lg(-5,0,5,0,['#5a6aa0','#c8d0f0','#5a6aa0']);c.fillRect(-5,-18+kick*.5,10,16);c.restore();bub(160,222,CO[sh?nxt:nxt]);if(sh)bub(sh.x,sh.y,CO[sh.col]);
  X.panel(4,224,96,14,K.y);T('SCORE '+g.score,10,229,K.y,1);X.panel(232,224,84,14,K.c);T('DROP IN '+(6-shots%6),240,229,K.c,1);fx.draw();};
 return g;}});

/* ---- KEY QUEST ---- */
A.add({id:'keyquest',name:'KEY QUEST',cat:'CLASSICS',how:'GRAB EVERY KEY, THEN THE DOOR. A JUMPS. SPIKES HURT.',make(){
 const g={over:null,score:0},fx=X.fx();let lvl=0,p,pl,keys,spikes,door,lives=3,coy=0,buf=0,face=1,run=0;
 const build=()=>{lvl++;pl=[{x:0,y:220,w:W},{x:20,y:170,w:80},{x:140,y:150,w:70},{x:240,y:170,w:70},{x:60,y:110,w:60},{x:180,y:100,w:90},{x:10,y:60,w:70},{x:220,y:50,w:80}];keys=[];for(let i=0;i<4+Math.min(3,lvl);i++){const q=pl[1+ri(pl.length-1)];keys.push({x:q.x+10+rnd(q.w-20),y:q.y-10});}spikes=[];for(let i=0;i<lvl+1;i++){const q=pl[ri(pl.length)];spikes.push({x:q.x+10+rnd(Math.max(1,q.w-30)),y:q.y});}door={x:260,y:50};p={x:20,y:220,vy:0};};build();
 g.update=()=>{const k=A.in(0);if(ax(k)){face=ax(k);run+=.3;}p.x=cl(p.x+ax(k)*2.2,6,W-6);if(A.hit(0).a)buf=8;else if(buf)buf--;const on=pl.find(q=>p.vy>=0&&Math.abs(p.y-q.y)<4&&p.x>=q.x&&p.x<=q.x+q.w);if(on){p.y=on.y;p.vy=0;coy=6;}else{p.vy+=.25;if(coy)coy--;}
  if(buf&&coy){p.vy=-5.4;S('jump');buf=0;coy=0;fx.spark(p.x,p.y,'#c8b8e8',4,1.2);}const oy=p.y;p.y+=p.vy;if(p.vy>0){const q=pl.find(q=>oy<=q.y&&p.y>=q.y&&p.x>=q.x&&p.x<=q.x+q.w);if(q){p.y=q.y;p.vy=0;}}
  keys=keys.filter(kk=>{if(Math.abs(kk.x-p.x)<9&&Math.abs(kk.y-(p.y-10))<12){g.score+=50;S('coin');fx.spark(kk.x,kk.y,K.y,10,2);fx.pop(kk.x,kk.y-10,'+50',K.y);if(keys.length===1)fx.ring(door.x,door.y-11,K.g,30);return false;}return true;});
  if(spikes.some(s=>Math.abs(s.x-p.x)<9&&Math.abs(s.y-p.y)<6)){lives--;S('boom');fx.flash(K.r,8);fx.debris(p.x,p.y-10,'#2fd6c3',8,2);if(lives<=0){g.over='GAME OVER';return;}p={x:20,y:220,vy:0};}
  if(!keys.length&&Math.abs(door.x-p.x)<12&&Math.abs(door.y-p.y)<6){g.score+=200;S('win');fx.flash('#ffffff',8);build();}};
 const bg=()=>{X.vg(0,0,W,H,['#2a1e48','#1a1230']);const c=A.c;for(let y=0;y<H;y+=10)for(let x=-(y/10%2)*10;x<W;x+=20){c.fillStyle=((x*7+y*3)%5)<2?'#2e2250':'#271c44';c.fillRect(x+1,y+1,18,8);}c.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<H;y+=10)c.fillRect(0,y,W,1);X.vignette(.5);
  for(const tx of[120,300,40]){c.fillStyle='#5a4a3a';c.fillRect(tx-2,tx===40?118:tx===120?70:120,4,10);}};
 g.draw=()=>{X.cache('kqbg',bg);const c=A.c;for(const[tx,ty]of[[120,70],[300,120],[40,118]]){const f=Math.sin(A.t*.3+tx)*1.5;X.glow(tx,ty-4,34+f*3,'#ff9a30',.25);X.poly([[tx-3,ty],[tx,ty-9-f],[tx+3,ty]],X.lg(0,ty-9,0,ty,['#fff0a0','#ff8020']));}
  pl.forEach(q=>{X.shadow(q.x+q.w/2,q.y+10,q.w/2,3,.25);X.block(q.x,q.y,q.w,8,'#7a6aa8',2);c.fillStyle='rgba(0,0,0,.2)';for(let x=q.x+12;x<q.x+q.w;x+=14)c.fillRect(x,q.y+2,1,6);c.fillStyle='#5ab04a';for(let x=q.x+2;x<q.x+q.w-2;x+=5)c.fillRect(x,q.y,3,1.5+(x%3));});
  spikes.forEach(s=>{for(let i=0;i<3;i++)X.poly([[s.x-6+i*6,s.y],[s.x-3+i*6,s.y-8],[s.x+i*6,s.y]],X.lg(s.x-6+i*6,0,s.x+i*6,0,['#8a8aa0','#f0f0ff','#6a6a80']));X.glow(s.x+3,s.y-4,8,'#ff3040',.15);});
  keys.forEach((kk,i)=>{const b=Math.sin(A.t*.08+i)*2,y=kk.y+b;X.glow(kk.x,y,10,K.y,.35);A.c.strokeStyle='#ffcf3f';A.c.lineWidth=1.6;A.c.beginPath();A.c.arc(kk.x,y-4,2.6,0,6.2832);A.c.stroke();c.fillStyle='#ffcf3f';c.fillRect(kk.x-.8,y-2,1.8,8);c.fillRect(kk.x,y+3,3,1.6);c.fillRect(kk.x,y+5.5,2.4,1.4);if((A.t+i*20)%60<6){c.fillStyle='#fff';c.fillRect(kk.x-3,y-6,1,1);}});
  const open=!keys.length;X.rr(door.x-9,door.y-25,18,25,4,'#4a3a5a');X.rr(door.x-7,door.y-23,14,23,3,open?X.lg(0,door.y-23,0,door.y,['#c0ffd0','#3ddc84']):X.lg(0,door.y-23,0,door.y,['#9a6a3a','#5b3a1e']));if(open)X.glow(door.x,door.y-11,22,K.g,.4);else{c.fillStyle='rgba(0,0,0,.25)';c.fillRect(door.x-.5,door.y-23,1,23);}X.disc(door.x+4,door.y-11,1.4,K.y);
  const air=p.vy!==0;A.person(p.x,p.y,{s:.62,c:'#2fd6c3',pants:'#3a3a6a',st:air?1:run,d:face,arm1:air?-2.4:undefined,arm2:air?2.4:undefined,id:4});
  fx.draw();X.bar('SCORE '+g.score,'KEYS '+keys.length,'LEVEL '+lvl);for(let i=0;i<lives;i++)X.heart(W-74-i*11,8,1);};
 return g;}});

/* ---- TUNNEL DIGGER ---- */
A.add({id:'digger',name:'TUNNEL DIGGER',cat:'CLASSICS',how:'DIG THROUGH DIRT. A INFLATES NEARBY MONSTERS. CLEAR THEM ALL.',make(){
 const g={over:null,score:0},GW=20,GH=12,CS=16,OX=0,OY=32,fx=X.fx();let m,p,mons,lives=3,lvl=0,fr=0,pump=0,pumpT=null;
 const build=()=>{lvl++;m=[];for(let y=0;y<GH;y++){m.push([]);for(let x=0;x<GW;x++)m[y].push(y===0?0:1);}p={x:10,y:0,mv:0,fx:1,fy:0,px:10,py:0};mons=[];for(let i=0;i<2+lvl;i++){const x=ri(GW),y=2+ri(GH-2);mons.push({x,y,mv:0,inf:0,px:x,py:y});for(let dx=-1;dx<=1;dx++)if(m[y][cl(x+dx,0,GW-1)])m[y][cl(x+dx,0,GW-1)]=0;}};build();
 g.update=()=>{if(fr>0)fr--;if(pump)pump--;const k=A.in(0);if(p.mv>0)p.mv--;else{p.px=p.x;p.py=p.y;const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){p.fx=dx;p.fy=dy;const nx=p.x+dx,ny=p.y+dy;if(nx>=0&&ny>=0&&nx<GW&&ny<GH){p.x=nx;p.y=ny;p.mv=m[ny][nx]?8:5;if(m[ny][nx]){m[ny][nx]=0;g.score++;fx.debris(OX+nx*CS+8,OY+ny*CS+8,'#c88a4a',3,1.2);}}}}
  if(A.hit(0).a){pump=10;const t=mons.find(q=>q.x===p.x+p.fx&&q.y===p.y+p.fy||q.x===p.x+2*p.fx&&q.y===p.y+2*p.fy);pumpT=t||null;if(t){t.inf+=1;S('blip');if(t.inf>=4){mons.splice(mons.indexOf(t),1);g.score+=100;S('score');const cx=OX+t.x*CS+8,cy=OY+t.y*CS+8;fx.spark(cx,cy,K.r,16,3);fx.ring(cx,cy,'#ffffff',24);fx.pop(cx,cy-12,'+100',K.y);A.shake=4;pumpT=null;}}}
  for(const q of mons){if(q.inf>0){if(A.t%30===0)q.inf--;continue;}if(q.mv>0){q.mv--;continue;}q.mv=Math.max(6,14-lvl*2);q.px=q.x;q.py=q.y;const ds=[[1,0],[-1,0],[0,1],[0,-1]].filter(d=>{const x=q.x+d[0],y=q.y+d[1];return x>=0&&y>=0&&x<GW&&y<GH&&!m[y][x];});if(!ds.length)continue;ds.sort((a,b)=>Math.hypot(q.x+a[0]-p.x,q.y+a[1]-p.y)-Math.hypot(q.x+b[0]-p.x,q.y+b[1]-p.y));const d=Math.random()<.65?ds[0]:ds[ri(ds.length)];q.x+=d[0];q.y+=d[1];
   if(q.x===p.x&&q.y===p.y){lives--;S('boom');fx.flash(K.r,8);if(lives<=0){g.over='GAME OVER';return;}p={x:10,y:0,mv:0,fx:1,fy:0,px:10,py:0};fr=60;}}
  if(!mons.length){g.score+=500;S('win');fx.flash('#ffffff',8);build();}};
 const DC=['#c8823a','#b06a2a','#8a5226','#6a3e1e'];
 g.draw=()=>{X.cache('digsky',()=>{X.sky(['#3a8ae0','#8ac8ff'],OY);X.disc(280,14,9,'#fff3c0');X.glow(280,14,26,'#fff0a0',.4);for(let i=0;i<4;i++){X.disc(30+i*80,12+(i%2)*6,6,'#ffffff');X.disc(38+i*80,10+(i%2)*6,7,'#ffffff');}X.vg(0,OY+CS*GH,W,H,['#4a2a14','#2a1408']);});const c=A.c;
  for(let y=0;y<GH;y++){const col=DC[Math.min(3,y/3|0)];for(let x=0;x<GW;x++){const X0=OX+x*CS,Y0=OY+y*CS;if(m[y][x]){c.fillStyle=col;c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(0,0,0,.15)';c.fillRect(X0+((x*7+y*3)%11),Y0+((x*5+y*9)%12),2,2);c.fillStyle='rgba(255,230,180,.12)';c.fillRect(X0+((x*3+y*7)%12),Y0+((x*11+y*5)%10),2,1);if(y===0||!m[y-1][x]){c.fillStyle='rgba(255,255,255,.12)';c.fillRect(X0,Y0,CS,1);}}else{c.fillStyle='#1e0f08';c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(0,0,0,.3)';if(y>0&&m[y-1][x])c.fillRect(X0,Y0,CS,3);}}}
  X.vg(0,OY-2,W,4,['#5ad04a','#2a8a2a']);
  mons.forEach(q=>{const t=q.inf?1:1-q.mv/Math.max(6,14-lvl*2),x=OX+(q.px+(q.x-q.px)*t)*CS+8,y=OY+(q.py+(q.y-q.py)*t)*CS+8,s=6+q.inf*2.5+Math.sin(A.t*.3)*.4;X.shadow(x,y+s*.8,s*.8,1.5,.3);X.orb(x,y,s,q.inf?'#ff8a5a':'#e83a3a');X.rr(x-s*.75,y-s*.45,s*1.5,s*.6,s*.3,'#fff8e0');X.disc(x-s*.3,y-s*.15,s*.18,'#111');X.disc(x+s*.3,y-s*.15,s*.18,'#111');c.fillStyle='#1a1a1a';c.fillRect(x-s*.75,y-s*.48,s*1.5,.8);});
  const t=p.mv?1-p.mv/8:1,pxx=OX+(p.px+(p.x-p.px)*t)*CS+8,pyy=OY+(p.py+(p.y-p.py)*t)*CS+8;
  if(pump&&pumpT){const tx=OX+pumpT.x*CS+8,ty=OY+pumpT.y*CS+8;X.stroke([[pxx,pyy],[tx,ty]],'#ffffff',1.2);}else if(pump){X.stroke([[pxx,pyy],[pxx+p.fx*22,pyy+p.fy*22]],'rgba(255,255,255,.7)',1.2);}
  if(fr%8<5){c.save();c.translate(pxx,pyy);if(p.fx<0)c.scale(-1,1);X.shadow(0,7,6,1.5,.3);X.rr(-5,-3,10,10,3,X.lg(0,-3,0,7,['#ffffff','#c8d8ff']));X.disc(0,-4,4,'#f1c7a3');X.ell(0,-6,4.6,2.8,'#4dabff');c.fillStyle='#ffcf3f';c.fillRect(-1,-9,2,2);X.disc(1.8,-4,.8,'#111');c.fillStyle='#888';c.fillRect(4,0,5,2);c.restore();}
  fx.draw();X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++)X.heart(W-48-i*11,8,1);};
 return g;}});

/* ---- MILLIPEDE ---- */
A.add({id:'millipede',name:'MILLIPEDE',cat:'CLASSICS',how:'MOVE. A FIRES. SHOOT THE CHAIN, IT SPLITS.',make(){
 const g={over:null,score:0},GW=32,GH=24,fx=X.fx();let mush=new Map(),segs=[],p={x:16,y:22},sh=null,lives=3,wave=0,t=0;for(let i=0;i<30;i++)mush.set(ri(GW)+','+(1+ri(GH-6)),3);
 const spawn=()=>{wave++;for(let i=0;i<8+wave;i++)segs.push({x:i,y:0,d:1,h:i===0});};spawn();
 g.update=()=>{t++;const k=A.in(0);if(t%3===0){p.x=cl(p.x+ax(k),0,GW-1);p.y=cl(p.y+ay(k),GH-5,GH-1);}if(A.hit(0).a&&!sh){sh={x:p.x,y:p.y};S('shoot');}
  if(sh){sh.y--;const key=sh.x+','+sh.y;if(mush.has(key)){const hp=mush.get(key)-1;fx.spark(sh.x*10+5,sh.y*10+5,'#ffb0b0',4,1.5);if(hp<=0){mush.delete(key);g.score++;}else mush.set(key,hp);sh=null;}else{const i=segs.findIndex(s=>s.x===sh.x&&s.y===sh.y);if(i>=0){mush.set(sh.x+','+sh.y,3);fx.spark(sh.x*10+5,sh.y*10+5,'#7dff6a',10,2.5);fx.ring(sh.x*10+5,sh.y*10+5,'#bfffa0',12,10);segs.splice(i,1);if(segs[i])segs[i].h=true;sh=null;g.score+=10;S('hit');}}if(sh&&sh.y<0)sh=null;}
  if(t%Math.max(2,6-wave)===0)for(const s of segs){let nx=s.x+s.d;if(nx<0||nx>=GW||mush.has(nx+','+s.y)){s.d*=-1;s.y++;if(s.y>=GH){s.y=GH-5;}}else s.x=nx;if(s.x===p.x&&s.y===p.y){lives--;S('boom');fx.flash(K.r,8);fx.spark(p.x*10+5,p.y*10+5,K.c,16,3);if(lives<=0){g.over='GAME OVER';return;}p={x:16,y:22};segs.forEach(q=>{q.y=Math.min(q.y,10);});}}
  if(!segs.length){spawn();fx.pop(160,100,'WAVE '+wave,K.y);}};
 g.draw=()=>{X.cache('millbg',()=>{X.vg(0,0,W,H,['#0a1a10','#14301c','#0a1a10']);const c=A.c;for(let i=0;i<200;i++){c.fillStyle=i%3?'rgba(60,140,70,.25)':'rgba(120,200,100,.18)';const x=(i*61)%W,y=(i*37)%H;c.fillRect(x,y,1,3+(i%4));c.fillRect(x+2,y+1,1,2+(i%3));}X.vg(0,190,W,50,['rgba(40,30,80,0)','rgba(60,40,120,.35)']);X.vignette(.5);});const c=A.c;
  mush.forEach((hp,k)=>{const[x,y]=k.split(',').map(Number),cx=x*10+5,cy=y*10+5;c.fillStyle='#e8dcc0';c.fillRect(cx-1.5,cy,3,4);X.ell(cx,cy,4.6,3.4*(hp/3)+.6,X.lg(0,cy-4,0,cy+2,['#ff8a8a','#d02a3a']));if(hp>1){X.disc(cx-2,cy-1.5,.9,'#ffffff');X.disc(cx+1.5,cy-2,.8,'#ffffff');}});
  segs.forEach((s,i)=>{const cx=s.x*10+5,cy=s.y*10+5,lg=Math.sin(A.t*.5+i)*1.5;c.strokeStyle='#2a6a1a';c.lineWidth=.8;c.beginPath();c.moveTo(cx-3,cy+2);c.lineTo(cx-4,cy+4+lg);c.moveTo(cx+3,cy+2);c.lineTo(cx+4,cy+4-lg);c.stroke();X.orb(cx,cy,4.6,s.h?'#ffb040':'#5ae04a');if(s.h){X.disc(cx+s.d*1.5-1.2,cy-1,1.1,'#fff');X.disc(cx+s.d*1.5+1.2,cy-1,1.1,'#fff');X.disc(cx+s.d*2-1.2,cy-1,.5,'#111');X.disc(cx+s.d*2+1.2,cy-1,.5,'#111');X.stroke([[cx-1,cy-4],[cx-3,cy-7]],'#ffb040',.6);X.stroke([[cx+1,cy-4],[cx+3,cy-7]],'#ffb040',.6);}});
  if(sh){X.glow(sh.x*10+5,sh.y*10+4,6,'#7ff0ff',.7);c.fillStyle='#e8ffff';c.fillRect(sh.x*10+4.3,sh.y*10,1.4,8);}
  const px=p.x*10+5,py=p.y*10+5;X.glow(px,py,10,'#2fd6c3',.25);X.poly([[px,py-6],[px+4.5,py+4],[px,py+2],[px-4.5,py+4]],X.lg(0,py-6,0,py+4,['#e0ffff','#2fd6c3','#0e6a66']));X.disc(px,py-1,1.4,'#ff4f9a');
  fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);for(let i=0;i<lives;i++)X.heart(W-72-i*11,8,1,K.c);};
 return g;}});

/* ---- CUBE HOP ---- */
A.add({id:'cubehop',name:'CUBE HOP',cat:'CLASSICS',how:'HOP DIAGONALLY WITH THE ARROWS. TURN EVERY CUBE YOUR COLOUR. DODGE THE BALLS.',make(){
 const g={over:null,score:0},N=7,fx=X.fx();let cubes={},p,balls=[],lives=3,lvl=0,mv=0,t=0,pp={r:0,c:0},fall=0;
 const key=(r,c)=>r+','+c;const build=()=>{lvl++;cubes={};for(let r=0;r<N;r++)for(let c=0;c<=r;c++)cubes[key(r,c)]=0;p={r:0,c:0};pp={r:0,c:0};balls=[];};build();
 const px=(r,c)=>[160+(c-r/2)*32,40+r*24];
 g.update=()=>{t++;if(mv>0)mv--;if(fall)fall--;const h=A.hit(0);if(mv===0){let d=null;if(h.u)d=[-1,ax(A.in(0))>=0?0:-1];if(h.d)d=[1,ax(A.in(0))>0?1:0];if(h.l&&!h.u&&!h.d)d=[-1,-1];if(h.r&&!h.u&&!h.d)d=[1,1];if(d){const nr=p.r+d[0],nc=p.c+d[1];if(!(key(nr,nc) in cubes)){lives--;S('boom');const[x,y]=px(p.r,p.c);fx.spark(x+d[1]*10,y,'#ff9838',12,2.5);fx.flash(K.r,6);if(lives<=0){g.over='FELL OFF';return;}p={r:0,c:0};pp={r:0,c:0};}else{pp={r:p.r,c:p.c};p.r=nr;p.c=nc;S('jump');if(cubes[key(nr,nc)]===0){cubes[key(nr,nc)]=1;g.score+=25;const[x,y]=px(nr,nc);fx.ring(x,y+8,'#7ff0ff',14,12);}mv=8;if(Object.values(cubes).every(v=>v)){g.score+=500;S('win');fx.flash('#ffffff',10);fx.pop(160,100,'PYRAMID +500',K.y);build();}}}}
  if(t%Math.max(60,150-lvl*15)===0)balls.push({r:0,c:0,mv:0,t:0,pr:0,pc:0});for(const b of balls){if(++b.mv>Math.max(10,22-lvl*2)){b.mv=0;b.pr=b.r;b.pc=b.c;b.r++;b.c+=ri(2);if(b.r>=N)b.dead=1;}if(b.r===p.r&&b.c===p.c&&!b.dead){lives--;S('boom');b.dead=1;const[x,y]=px(p.r,p.c);fx.spark(x,y,K.r,14,3);fx.flash(K.r,6);if(lives<=0){g.over='SQUASHED';return;}p={r:0,c:0};pp={r:0,c:0};}}balls=balls.filter(b=>!b.dead);};
 g.draw=()=>{X.cache('cubebg',()=>{X.sky(['#0a0620','#1a1040','#2a0a30']);X.stars(70,3,0,0,H,.7);X.glow(160,120,170,'#5a2a9a',.25);});const c=A.c;
  for(let r=0;r<N;r++)for(let cc=0;cc<=r;cc++){const[x,y]=px(r,cc),on=cubes[key(r,cc)],top=on?'#3ff0e0':'#ffa040';X.poly([[x-16,y+8],[x,y+16],[x,y+30],[x-16,y+22]],X.lg(x-16,0,x,0,on?['#1a8a80','#126a62']:['#c0601a','#8a4010']));X.poly([[x,y+16],[x+16,y+8],[x+16,y+22],[x,y+30]],X.lg(x,0,x+16,0,on?['#0e5a52','#083a36']:['#7a3a10','#4a2008']));X.poly([[x,y],[x+16,y+8],[x,y+16],[x-16,y+8]],X.lg(x,y,x,y+16,[X.lt(top,1.35),top,X.lt(top,.8)]));X.polys([[x,y],[x+16,y+8],[x,y+16],[x-16,y+8]],'rgba(255,255,255,.35)',.6);if(on)X.glow(x,y+8,12,'#3ff0e0',.15);}
  const arc=(r0,c0,r1,c1,f)=>{const[a1,b1]=px(r0,c0),[a2,b2]=px(r1,c1);return[a1+(a2-a1)*f,b1+(b2-b1)*f-Math.sin(f*3.1416)*12];};
  balls.forEach(b=>{const f=Math.min(1,b.mv/6),[x,y]=b.r===0&&b.pr===0?px(0,0):arc(b.pr,b.pc,b.r,b.c,f);X.shadow(x,y+8,5,2,.35);X.orb(x,y-2,6,'#ff3a4a');});
  const f=mv?1-mv/8:1,[x,y]=arc(pp.r,pp.c,p.r,p.c,f),sq=mv>6?(mv-6)*.12:mv===0?Math.max(0,.15*Math.sin(A.t*.1)):0;X.shadow(x,y+8,6,2,.35);c.save();c.translate(x,y);c.scale(1+sq,1-sq);X.orb(0,-7,7,'#ff9838');X.rr(4,-8,7,4,2,'#ff7a28');X.disc(10,-6,1.6,'#3a1a08');X.disc(-1,-10,2.6,'#ffffff');X.disc(3,-10,2.6,'#ffffff');X.disc(0,-10,1.2,'#111');X.disc(4,-10,1.2,'#111');c.fillStyle='#ff9838';c.fillRect(-4,-1,2,4);c.fillRect(1,-1,2,4);c.restore();
  fx.draw();X.bar('SCORE '+g.score,'LV '+lvl);for(let i=0;i<lives;i++)X.heart(W-48-i*11,8,1);X.ot('UP=BACK-LEFT  RIGHT=DOWN-RIGHT  ETC',160,226,K.gr,1,'c');};
 return g;}});

/* ---- GALAXY WAVE ---- */
A.add({id:'galaxy',name:'GALAXY WAVE',cat:'CLASSICS',how:'MOVE. A FIRES. ENEMIES DIVE AT YOU.',make(){
 const g={over:null,score:0},fx=X.fx(),EC=['#ffcf3f','#ff4f6d','#4dabff','#4dabff'];let px=160,en=[],bl=[],eb=[],lives=3,inv=0,t=0,wave=0,msg=0;
 const spawn=()=>{wave++;msg=90;en=[];for(let r=0;r<4;r++)for(let c=0;c<8;c++)en.push({hx:60+c*28,hy:40+r*18,x:60+c*28,y:-20-r*18,st:0,r,dt:0,tr:[]});};spawn();
 g.update=()=>{t++;if(msg)msg--;px=cl(px+ax(A.in(0))*3,10,W-10);if(inv>0)inv--;if(A.fire(8)&&bl.length<8){bl.push({x:px,y:206});S('shoot');}bl.forEach(b=>b.y-=6);bl=bl.filter(b=>b.y>0);
  for(const e of en){if(e.st===0){e.x+=(e.hx+Math.sin(t*.03)*10-e.x)*.05;e.y+=(e.hy-e.y)*.05;if(Math.random()<.0015*wave&&t>120){e.st=1;e.dt=0;}}else{e.dt++;e.x=e.hx+Math.sin(e.dt*.05)*(px-e.hx)*1.2;e.y=e.hy+e.dt*2.2;if(A.t%3===0){e.tr.unshift([e.x,e.y]);if(e.tr.length>5)e.tr.pop();}if(e.dt%40===20)eb.push({x:e.x,y:e.y});if(e.y>H+10){e.y=-20;e.st=0;e.tr=[];}}
   for(const b of bl)if(Math.abs(b.x-e.x)<8&&Math.abs(b.y-e.y)<8){e.dead=1;b.y=-9;const pts=e.st?80:(4-e.r)*10+10;g.score+=pts;S('hit');fx.spark(e.x,e.y,EC[e.r],12,2.5);fx.ring(e.x,e.y,'#ffffff',14,12);if(e.st)fx.pop(e.x,e.y-8,'+'+pts,K.y);}
   if(inv===0&&Math.abs(px-e.x)<10&&Math.abs(210-e.y)<10){e.dead=1;lives--;inv=90;S('boom');fx.flash(K.r,8);fx.spark(px,212,K.c,18,3);if(lives<=0)g.over='GAME OVER';}}
  en=en.filter(e=>!e.dead);for(const b of eb){b.y+=3;if(inv===0&&Math.abs(b.x-px)<6&&Math.abs(b.y-212)<8){b.y=999;lives--;inv=90;S('boom');fx.flash(K.r,8);fx.spark(px,212,K.c,18,3);if(lives<=0)g.over='GAME OVER';}}eb=eb.filter(b=>b.y<H);if(!en.length){g.score+=200;S('win');spawn();}};
 const bug=(e)=>{const c=A.c,fl=(A.t>>3)%2,x=e.x,y=e.y,col=EC[e.r];c.save();c.translate(x,y);if(e.st)c.rotate(Math.sin(e.dt*.05)*.6);
  const wy=fl?-1:1;X.ell(-6,wy*.5,5,3,X.rgba(e.r===0?'#4dabff':'#ffffff',.75),fl?-.5:.3);X.ell(6,wy*.5,5,3,X.rgba(e.r===0?'#4dabff':'#ffffff',.75),fl?.5:-.3);
  X.ell(0,0,3.5,6,X.lg(0,-6,0,6,[X.lt(col,1.4),col,X.lt(col,.55)]));if(e.r===0){X.disc(0,-5,3,'#4dff8b');}c.fillStyle='#111';c.fillRect(-2,-4,1.4,1.4);c.fillRect(.6,-4,1.4,1.4);c.fillStyle=X.lt(col,.6);c.fillRect(-3,1,6,1);c.fillRect(-3,3,6,1);c.restore();};
 g.draw=()=>{X.cache('galbg',()=>{X.sky(['#02010a','#080420','#100630']);X.glow(240,50,90,'#4a1a8a',.22);X.glow(70,180,90,'#1a3a8a',.2);});const c=A.c;for(let i=0;i<60;i++){const sp=(i%3+1)*.6,y=((i*53)+t*sp)%H;c.fillStyle=i%4?'rgba(160,160,220,.7)':'#ffffff';c.fillRect((i*97)%W,y,1,i%3===2?2.5:1);}
  en.forEach(e=>{e.tr.forEach((q,i)=>{c.globalAlpha=.25*(1-i/5);X.disc(q[0],q[1],4-i*.6,EC[e.r]);});c.globalAlpha=1;bug(e);});
  bl.forEach(b=>{X.glow(b.x,b.y+3,6,'#7ff0ff',.7);c.fillStyle='#e8ffff';c.fillRect(b.x-.8,b.y,1.6,6);});eb.forEach(b=>{X.glow(b.x,b.y+2,5,'#ff4040',.7);X.disc(b.x,b.y+2,1.5,'#ffd0d0');});
  if(inv%8<5){const fl=4+rnd(3);X.glow(px-4,220,5,'#ff8030',.6);X.glow(px+4,220,5,'#ff8030',.6);c.fillStyle='#ffb040';c.fillRect(px-5,218,2,fl);c.fillRect(px+3,218,2,fl);X.poly([[px,203],[px+3,210],[px+9,215],[px+9,219],[px-9,219],[px-9,215],[px-3,210]],X.lg(0,203,0,219,['#ffffff','#c8d0e8','#6a7090']));X.poly([[px-9,215],[px-9,210],[px-6,214]],'#ff4f6d');X.poly([[px+9,215],[px+9,210],[px+6,214]],'#ff4f6d');X.disc(px,210,1.8,'#4dabff');}
  fx.draw();X.bar('SCORE '+g.score,'WAVE '+wave);for(let i=0;i<lives;i++)X.heart(W-72-i*11,8,1,K.c);if(msg&&msg<80)X.ot('STAGE '+wave,160,110,K.y,3,'c');};
 return g;}});

/* ---- ASTRO MINER ---- */
A.add({id:'miner',name:'ASTRO MINER',cat:'CLASSICS',how:'DIG DOWN, GRAB GEMS, SELL AT THE SURFACE BEFORE FUEL RUNS OUT.',make(){
 const g={score:0,over:null},GW=20,CS=16,fx=X.fx();let m=[],p={x:10,y:0,mv:0,px:10,py:0},fuel=300,cargo=0,cam=0,depthMax=0;
 const row=y=>{const r=[];for(let x=0;x<GW;x++){const v=Math.random();r.push(y<1?0:v<.08?3:v<.14?2:v<.2?0:1);}return r;};for(let i=0;i<60;i++)m.push(row(i));
 g.update=()=>{if(p.mv>0){p.mv--;return;}p.px=p.x;p.py=p.y;const k=A.in(0),dx=ax(k),dy=dx?0:ay(k);if(dx||dy){const nx=cl(p.x+dx,0,GW-1),ny=Math.max(0,p.y+dy);if(ny>=m.length)m.push(row(ny));const v=m[ny][nx];if(dy<0&&m[ny][nx]===1){}else{p.x=nx;p.y=ny;p.mv=v?7:4;fuel-=v?2:1;const sy=ny*CS+30-cam+8;if(v===2){cargo+=10;S('coin');fx.spark(nx*CS+8,sy,'#2fd6c3',8,2);fx.pop(nx*CS+8,sy-10,'+10',K.c);}if(v===3){cargo+=50;S('coin');fx.spark(nx*CS+8,sy,K.y,12,2.5);fx.pop(nx*CS+8,sy-10,'+50',K.y);}m[ny][nx]=0;if(v===1){S('blip');fx.debris(nx*CS+8,sy,'#b07040',3,1.2);}}depthMax=Math.max(depthMax,p.y);
   if(p.y===0&&cargo){g.score+=cargo;fx.pop(p.x*CS+8,10,'SOLD +'+cargo,K.g);fuel=Math.min(300,fuel+cargo);cargo=0;S('score');}}if(fuel<=0){g.score+=cargo;g.over='OUT OF FUEL';}};
 const DC=[['#c8823a','#a86a2e'],['#9a5a2a','#7a4420'],['#6a3e22','#4a2a18'],['#4a3a4a','#2a2030']];
 g.draw=()=>{const tc=p.y*CS-100;cam+=(Math.max(0,tc)-cam)*.2;const c=A.c;X.sky(['#ff9a6a','#ffd0a0','#8ac8ff'],Math.max(0,30-cam)+1);
  if(30-cam>0){c.fillStyle='#5a4a7a';c.fillRect(220,30-cam-22,40,22);X.poly([[216,30-cam-22],[240,30-cam-34],[264,30-cam-22]],'#ff4f6d');c.fillStyle='#ffe08a';c.fillRect(232,30-cam-14,8,8);X.ot('SHOP',240,30-cam-30,K.w,1,'c');}
  for(let y=0;y<m.length;y++){const sy=y*CS+30-cam;if(sy<-CS||sy>H)continue;const dc=DC[Math.min(3,y/12|0)];for(let x=0;x<GW;x++){const v=m[y][x],X0=x*CS;if(v){c.fillStyle=v===1?dc[(x*7+y*13)%5===0?1:0]:'#5a5070';c.fillRect(X0,sy,CS,CS);c.fillStyle='rgba(0,0,0,.18)';c.fillRect(X0+((x*7+y*3)%11),sy+((x*5+y*9)%12),3,2);c.fillStyle='rgba(255,230,200,.12)';c.fillRect(X0,sy,CS,1);}else{c.fillStyle='#120a08';c.fillRect(X0,sy,CS,CS);}
    if(v===2){X.glow(X0+8,sy+8,10,'#2fd6c3',.35);X.gem(X0+8,sy+8,10,'#2fd6c3');}if(v===3){X.glow(X0+8,sy+8,12,K.y,.45);X.gem(X0+8,sy+8,12,'#ffcf3f');if((A.t+x*7+y*13)%50<5){c.fillStyle='#fff';c.fillRect(X0+5,sy+4,1,1);}}}}
  X.vg(0,30-cam-1,W,3,['#5ad04a','#2a8a2a']);
  const t=p.mv?1-p.mv/7:1,px=(p.px+(p.x-p.px)*t)*CS,py=(p.py+(p.y-p.py)*t)*CS+30-cam;X.glow(px+8,py+8,18,'#fff0a0',.2);X.rr(px+2,py+4,12,9,3,X.lg(0,py+4,0,py+13,['#ffd080','#ff9838','#a05010']));X.rr(px+5,py+1,6,5,2,'#bfe8ff');c.fillStyle='#333';c.fillRect(px+2,py+12,12,3);c.fillStyle='#777';for(let i=0;i<4;i++)c.fillRect(px+3+i*3+(A.t%3),py+12.5,1.5,2);const dr=A.t%4<2?1:0;X.poly([[px+6,py+15],[px+10,py+15],[px+8,py+19+dr]],'#c8c8d8');
  fx.draw();X.bar('','');X.ot('CASH '+g.score,6,4,K.y,2);T('CARGO '+cargo,120,6,K.c,1);T('DEPTH '+p.y+'M',120,12,K.gr,1);X.meter(W-86,5,80,7,fuel/300,fuel<60?'#ff4f6d':'#ffcf3f');T('FUEL',W-110,6,fuel<60?K.r:K.w,1);};
 return g;}});
})();
