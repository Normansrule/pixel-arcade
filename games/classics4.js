/* CLASSICS 4 — sixteen original cabinets built on golden-age arcade mechanics */
(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,P=A.poly,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const alpha=(a,f)=>{A.c.globalAlpha=a;f();A.c.globalAlpha=1;};
const GX=new Proxy({},{get:(_,k)=>A.gx[k]}),lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const hud=(l,c,r,lc)=>{const g=A.c;g.fillStyle=GX.lg(0,0,0,15,['rgba(14,10,40,.94)','rgba(6,4,20,.78)']);g.fillRect(0,0,W,15);g.fillStyle='rgba(255,255,255,.14)';g.fillRect(0,15,W,1);g.fillStyle='rgba(255,255,255,.07)';g.fillRect(0,0,W,1);if(l)GX.ot(l,6,5,lc||K.y,1);if(c)GX.ot(c,160,5,K.w,1,'c');if(r)GX.ot(r,W-6,5,'#ffe9c8',1,'r');};
const ell=(x,y,rx,ry,col,rot)=>{const c=A.c;c.fillStyle=col;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,6.2832);c.fill();};
const vg=(a,b,y0,y1)=>{A.c.fillStyle=GX.lg(0,y0,0,y1,[a,b]);A.c.fillRect(0,y0,W,y1-y0);};
const banner=(s,col,y)=>{y=y||104;const w=s.length*8+20;GX.rr(160-w/2,y-7,w,24,6,'rgba(8,6,24,.84)');GX.rrs(160-w/2+.5,y-6.5,w-1,23,6,GX.rgba(col||K.y,.75),1);A.c.fillStyle=GX.rgba(col||K.y,.25);A.c.fillRect(160-w/2+6,y-6,w-12,1);GX.ot(s,160,y,col||K.y,2,'c');};
const ott=(s,x,y,col,al)=>{s=String(s);const w=s.length*4-1,x0=al==='c'?x-w/2:al==='r'?x-w:x;if(x0<1||x0+w>319||y<1||y>233)return;GX.ot(s,x,y,col,1,al);};
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=ri(i+1);[a[i],a[j]]=[a[j],a[i]];}return a;};
const squash=(x,y,sy,f)=>{const c=A.c;c.save();c.translate(x,y);c.scale(1,sy);f();c.restore();};

/* ================= ICE PUSHER ================= */
A.add({id:'icepush',name:'ICE PUSHER',cat:'CLASSICS',warm:120,time:300,how:'WALK. A SHOVES ICE TO CRUSH MITES. B AT THE RIM STUNS THEM. CLEAR 5 RINKS.',make(){
 const g={over:null,score:0},GW=19,GH=13,CS=16,OX=8,OY=18,D4=[[1,0],[-1,0],[0,1],[0,-1]],ef=GX.fx();
 let m,p,mites=[],sl=[],lvl=0,lives=3,left=0,inv=0,shk=0,shkCd=0,tm=0,msg='',mt=0,gemDone=false,clearT=0,hs=0,push=0;
 const at=(x,y)=>x<0||y<0||x>=GW||y>=GH?9:m[y*GW+x];
 const slAt=(x,y)=>sl.some(s=>s.cx===x&&s.cy===y);
 const free=(x,y)=>at(x,y)===0&&!slAt(x,y);
 const miteAt=(x,y,me)=>mites.some(q=>q!==me&&!q.dead&&q.x===x&&q.y===y);
 const fp=o=>o.mv>0?[o.x-(o.x-o.ox)*o.mv/o.T,o.y-(o.y-o.oy)*o.mv/o.T]:[o.x,o.y];
 const gen=()=>{lvl++;m=new Uint8Array(GW*GH).fill(1);const vis=new Uint8Array(GW*GH),st=[[0,0]];m[0]=0;vis[0]=1;
  while(st.length){const[cx,cy]=st[st.length-1];const o=D4.filter(([dx,dy])=>{const nx=cx+dx*2,ny=cy+dy*2;return nx>=0&&ny>=0&&nx<GW&&ny<GH&&!vis[ny*GW+nx];});
   if(!o.length){st.pop();continue;}const[dx,dy]=o[ri(o.length)],nx=cx+dx*2,ny=cy+dy*2;vis[ny*GW+nx]=1;m[ny*GW+nx]=0;m[(cy+dy)*GW+cx+dx]=0;st.push([nx,ny]);}
  for(let i=0;i<GW*GH;i++)if(m[i]&&Math.random()<.16)m[i]=0;
  for(let y=5;y<=7;y++)for(let x=8;x<=10;x++)m[y*GW+x]=0;
  let n=0,tries=0;while(n<3&&tries++<999){const x=1+ri(GW-2),y=1+ri(GH-2);if(m[y*GW+x]===1&&Math.abs(x-9)+Math.abs(y-6)>3){m[y*GW+x]=2;n++;}}
  p={x:9,y:6,ox:9,oy:6,dx:0,dy:1,mv:0,T:7,buf:0};sl=[];mites=[];left=3+lvl*2;tm=0;inv=90;gemDone=false;clearT=0;msg='RINK '+lvl;mt=80;};
 const spawn=()=>{for(let k=0;k<80;k++){const x=ri(GW),y=ri(GH);if(free(x,y)&&!miteAt(x,y)&&Math.abs(x-p.x)+Math.abs(y-p.y)>7){mites.push({x,y,ox:x,oy:y,mv:0,T:1,hatch:50,stun:0,stuck:0,dead:0,c:ri(3),id:ri(99)});return;}}
  for(let k=0;k<80;k++){const x=ri(GW),y=ri(GH);if(at(x,y)===1&&Math.abs(x-p.x)+Math.abs(y-p.y)>7){m[y*GW+x]=0;A.burst(OX+x*CS+8,OY+y*CS+8,'#bfefff',8,1.5);mites.push({x,y,ox:x,oy:y,mv:0,T:1,hatch:50,stun:0,stuck:0,dead:0,c:ri(3),id:ri(99)});return;}}};
 const gemCheck=()=>{if(gemDone)return;const gs=[];for(let i=0;i<GW*GH;i++)if(m[i]===2)gs.push([i%GW,(i/GW)|0]);if(gs.length<3)return;
  const row=gs.every(q=>q[1]===gs[0][1]),col=gs.every(q=>q[0]===gs[0][0]);if(!row&&!col)return;const vs=gs.map(q=>row?q[0]:q[1]).sort((a,b)=>a-b);
  if(vs[2]-vs[0]===2){gemDone=true;g.score+=1000;msg='GEM LINE! +1000';mt=90;S('win');ef.flash('#ff9ad8',14);gs.forEach(q=>ef.ring(OX+q[0]*CS+8,OY+q[1]*CS+8,'#ff9ad8',30,24));A.burst(OX+gs[1][0]*CS+8,OY+gs[1][1]*CS+8,K.p,30,3);mites.forEach(q=>{q.stun=300;});}};
 const shove=()=>{const tx=p.x+p.dx,ty=p.y+p.dy,v=at(tx,ty);if((v!==1&&v!==2)||slAt(tx,ty))return;
  push=10;if(at(tx+p.dx,ty+p.dy)===0&&!slAt(tx+p.dx,ty+p.dy)){m[ty*GW+tx]=0;sl.push({x:tx*CS,y:ty*CS,cx:tx,cy:ty,dx:p.dx,dy:p.dy,v,k:0});S('hit');ef.spark(OX+tx*CS+8-p.dx*8,OY+ty*CS+8-p.dy*8,'#dff6ff',6,1.6);}
  else if(v===1){m[ty*GW+tx]=0;g.score+=10;S('blip');A.burst(OX+tx*CS+8,OY+ty*CS+8,'#bfefff',12,1.6);ef.debris(OX+tx*CS+8,OY+ty*CS+8,'#bfefff',8,1.6);}else S('blip');};
 const die=()=>{lives--;S('lose');A.shake=8;ef.flash('#ff4f6d',10);const[px,py]=fp(p);A.burst(OX+px*CS+8,OY+py*CS+8,K.r,20,2.5);if(lives<=0){g.over='FROZEN OUT ON RINK '+lvl;return;}
  inv=150;mites.forEach(q=>{if(Math.abs(q.x-p.x)+Math.abs(q.y-p.y)<5)q.hatch=100;});};
 gen();
 g.update=()=>{if(clearT){clearT--;if(clearT===0){if(lvl>=5){g.over='ALL RINKS CLEAR! WIN';return;}gen();}return;}
  if(hs>0){hs--;return;}if(push)push--;tm++;if(mt)mt--;if(inv)inv--;if(shk)shk--;if(shkCd)shkCd--;const k=A.in(0),h=A.hit(0);if(h.a)p.buf=10;if(p.buf)p.buf--;
  if(p.mv>0)p.mv--;
  if(p.mv===0){const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){p.dx=dx;p.dy=dy;if(free(p.x+dx,p.y+dy)){p.ox=p.x;p.oy=p.y;p.x+=dx;p.y+=dy;p.mv=p.T=7;}}
   if(p.buf&&p.mv===0){p.buf=0;shove();}}
  if(h.b&&!shkCd&&(p.x===0||p.y===0||p.x===GW-1||p.y===GH-1)){shkCd=100;shk=22;A.shake=6;S('hit');mites.forEach(q=>{if(!q.dead&&!q.hatch&&(q.x===0||q.y===0||q.x===GW-1||q.y===GH-1))q.stun=220;});}
  for(const s of sl){s.x+=s.dx*4;s.y+=s.dy*4;
   for(const q of mites)if(!q.dead){const[fx,fy]=fp(q);if(Math.abs(fx*CS-s.x)<12&&Math.abs(fy*CS-s.y)<12){q.dead=1;s.k++;hs=4;ef.ring(OX+fx*CS+8,OY+fy*CS+8,'#ffffff',22,14);g.score+=Math.min(1600,200*(1<<(s.k-1)));left--;S('boom');A.shake=4;A.burst(OX+fx*CS+8,OY+fy*CS+8,['#3dff8b','#ffcf3f','#ff9838'][q.c],16,2.2);if(s.k>1){msg=s.k+'X CRUSH!';mt=60;}}}
   if(s.x%CS===0&&s.y%CS===0){s.cx=s.x/CS;s.cy=s.y/CS;const nx=s.cx+s.dx,ny=s.cy+s.dy;if(at(nx,ny)!==0||sl.some(o=>o!==s&&o.cx===nx&&o.cy===ny)){m[s.cy*GW+s.cx]=s.v;s.done=1;A.burst(OX+s.x+8+s.dx*8,OY+s.y+8+s.dy*8,'#ffffff',5,1);if(s.v===2)gemCheck();}}}
  sl=sl.filter(s=>!s.done);
  const alive=mites.filter(q=>!q.dead).length;if(tm%40===0&&alive<Math.min(2+Math.ceil(lvl/2),left))spawn();
  const spd=Math.max(7,15-lvl*2);
  for(const q of mites){if(q.dead)continue;if(q.hatch){q.hatch--;continue;}
   if(q.stun)q.stun--;else{if(q.mv>0)q.mv--;if(q.mv===0){const o=D4.filter(([dx,dy])=>free(q.x+dx,q.y+dy)&&!miteAt(q.x+dx,q.y+dy,q));
    if(!o.length){if(++q.stuck>70&&lvl>=2){const d=D4[ri(4)];if(at(q.x+d[0],q.y+d[1])===1){m[(q.y+d[1])*GW+q.x+d[0]]=0;A.burst(OX+(q.x+d[0])*CS+8,OY+(q.y+d[1])*CS+8,'#bfefff',8,1.2);}q.stuck=0;}}
    else{q.stuck=0;const nb=o.filter(d=>!(d[0]===-q.ldx&&d[1]===-q.ldy)),pool=nb.length?nb:o;let d;
     if(Math.random()<.3+lvl*.1)d=pool.slice().sort((a,b)=>(Math.abs(q.x+a[0]-p.x)+Math.abs(q.y+a[1]-p.y))-(Math.abs(q.x+b[0]-p.x)+Math.abs(q.y+b[1]-p.y)))[0];else d=pool[ri(pool.length)];
     q.ox=q.x;q.oy=q.y;q.x+=d[0];q.y+=d[1];q.ldx=d[0];q.ldy=d[1];q.mv=q.T=spd;}}}
   const[fx,fy]=fp(q),[px,py]=fp(p);if(Math.abs(fx-px)<.6&&Math.abs(fy-py)<.6){if(q.stun){q.dead=1;left--;g.score+=100;S('coin');A.burst(OX+fx*CS+8,OY+fy*CS+8,K.y,10,1.5);}else if(!inv){die();if(g.over)return;}}}
  mites=mites.filter(q=>!q.dead);
  if(left<=0&&!mites.length){const b=Math.max(0,Math.round((2400-tm*2)/100)*100);g.score+=500+b;msg='RINK CLEAR! +'+(500+b);mt=90;clearT=100;S('win');A.confetti();}};
 const blk=(x,y,v)=>{const c=A.c;GX.rr(x+.5,y+.5,15,15,3,GX.lg(x,y,x+12,y+16,v===2?['#fff0fb','#e3b0ff','#8a5ad0']:['#f4fdff','#a6e4ff','#3a86cc']));
  c.fillStyle='rgba(255,255,255,.62)';c.fillRect(x+3,y+2,9,1.4);c.fillRect(x+2,y+3,1.4,7);c.fillStyle='rgba(8,40,90,.34)';c.fillRect(x+2,y+13.2,12,1.8);c.fillRect(x+13.2,y+3,1.8,11);
  GX.stroke([[x+9,y+4],[x+11,y+7.5],[x+9.5,y+11]],'rgba(255,255,255,.45)',.6);if(v===2){if(lo())GX.glow(x+8,y+8,11,'#ff7ad0',.35);GX.gem(x+8,y+8,10,'#ff4f9a');}};
 const floor=()=>GX.cache('icepush_floor',()=>{const c=A.c;GX.sky(['#0c1f4a','#040a1c']);GX.stars(40,3,0,0,H,.4);
  GX.rr(OX-6,OY-6,GW*CS+12,GH*CS+12,6,GX.lg(0,OY-6,0,OY+GH*CS+6,['#8aa6f0','#3048a8','#1a2668']));GX.rr(OX-2,OY-2,GW*CS+4,GH*CS+4,3,'#061230');
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const X0=OX+x*CS,Y0=OY+y*CS;c.fillStyle=(x+y)%2?'#10305f':'#0d2852';c.fillRect(X0,Y0,CS,CS);c.fillStyle='rgba(170,225,255,.06)';c.fillRect(X0,Y0,CS,1);if((x*7+y*13)%5===0){c.fillStyle='rgba(200,240,255,.35)';c.fillRect(X0+((x*5+y*3)%12)+2,Y0+((x*11+y)%11)+2,1,1);}}
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(OX-5,OY-5,GW*CS+10,1);});
 g.draw=()=>{const c=A.c,sx=shk?(A.t%4<2?-2:2):0;c.save();c.translate(sx,0);floor();c.restore();
  if(shk){c.globalAlpha=shk/22;GX.rrs(OX-5+sx,OY-5,GW*CS+10,GH*CS+10,6,'#dff6ff',3);c.globalAlpha=1;}
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const v=m[y*GW+x];if(v)blk(OX+x*CS+sx,OY+y*CS,v);}
  for(const s of sl){c.globalAlpha=.25;blk(OX+s.x-s.dx*7+sx,OY+s.y-s.dy*7,s.v);c.globalAlpha=.12;blk(OX+s.x-s.dx*14+sx,OY+s.y-s.dy*14,s.v);c.globalAlpha=1;blk(OX+s.x+sx,OY+s.y,s.v);}
  const[pX,pY]=fp(p);
  for(const q of mites){const[fx_,fy_]=fp(q),x=OX+fx_*CS+8+sx,y=OY+fy_*CS+8;
   if(q.hatch){const w=q.hatch<25?Math.sin(A.t*.8)*1.5:0;GX.shadow(x,y+6,5,1.6,.35);GX.ell(x+w*.3,y,5,6.5,GX.lg(x-5,y-6,x+5,y+6,['#ffffff','#cfe2f8']));GX.stroke([[x-3+w*.3,y-1],[x-1,y+1],[x+1,y-1],[x+3+w*.3,y+1]],'#6a8ab8',.8);continue;}
   const col=q.stun?'#9d96c8':['#3dff8b','#ffcf3f','#ff9838'][q.c],bob=Math.sin(A.t*.3+q.id)*1,st=q.mv>0?Math.sin(A.t*.6+q.id)*1.5:0;
   GX.shadow(x,y+7,6,1.8,.4);GX.disc(x-4,y+5+st*.4,2,GX.lt(col,.55));GX.disc(x+4,y+5-st*.4,2,GX.lt(col,.55));GX.orb(x,y+bob,6.5,col);
   GX.stroke([[x-2,y-5+bob],[x-4,y-10+bob]],GX.lt(col,.6),1);GX.stroke([[x+2,y-5+bob],[x+4,y-10+bob]],GX.lt(col,.6),1);GX.disc(x-4,y-10+bob,1.2,GX.lt(col,1.4));GX.disc(x+4,y-10+bob,1.2,GX.lt(col,1.4));
   const lx=cl(pX*CS-fx_*CS,-1,1)*1.2,ly=cl(pY*CS-fy_*CS,-1,1)*1.2;GX.disc(x-2.5,y-1+bob,2.4,'#ffffff');GX.disc(x+2.5,y-1+bob,2.4,'#ffffff');GX.disc(x-2.5+lx,y-1+ly+bob,1.1,'#101018');GX.disc(x+2.5+lx,y-1+ly+bob,1.1,'#101018');
   if(q.stun)for(let i=0;i<3;i++){const a=A.t*.15+i*2.1;GX.disc(x+Math.cos(a)*7,y-9+Math.sin(a)*2,1.3,K.y);}}
  if(!(inv&&inv%8<4)){const d=p.dx||1,pu=push>0?-1.4*d:undefined;A.person(OX+pX*CS+8+sx,OY+pY*CS+15,{s:.54,c:'#ff4f6d',pants:'#2a3a7a',cap:'#ffffff',id:3,st:p.mv?A.t*.5:0,d,arm1:pu,arm2:pu});}
  ef.draw();
  hud('SCORE '+g.score,'RINK '+lvl+'/5   MITES LEFT '+Math.max(0,left),'LIVES '+lives);if(mt)banner(msg,msg.startsWith('RINK C')||msg.startsWith('GEM')?K.y:K.w,112);};
return g;}});

/* ================= BUBBLE TRAP ================= */
const BLAY=[
 [[8,224,304],[8,184,80],[232,184,80],[104,166,112],[8,128,110],[202,128,110],[72,90,176],[8,56,60],[252,56,60]],
 [[8,224,120],[192,224,120],[40,188,80],[200,188,80],[120,152,80],[24,116,90],[206,116,90],[110,80,100],[8,48,70],[242,48,70]],
 [[8,224,304],[40,190,40],[140,190,40],[240,190,40],[88,156,40],[192,156,40],[40,122,40],[140,122,40],[240,122,40],[88,88,40],[192,88,40],[140,56,40]],
 [[8,224,304],[8,184,140],[172,184,140],[60,144,200],[8,104,140],[172,104,140],[60,64,200]],
 [[8,224,90],[120,224,80],[222,224,90],[30,188,60],[130,178,60],[230,188,60],[70,142,60],[190,142,60],[130,106,60],[20,90,50],[250,90,50],[90,60,140]]];
A.add({id:'bubbletrap',name:'BUBBLE TRAP',cat:'CLASSICS',warm:120,time:240,how:'MOVE, UP JUMPS. A BLOWS BUBBLES. TRAP ROBOTS, THEN TOUCH THEM TO POP.',make(){
 const g={over:null,score:0},PC=['#ff4f9a','#2fd6c3','#ffcf3f','#ff9838','#4dabff'],FR=[['#ff3a4a',300],['#ffd83a',500],['#a05aff',800],['#5aff7a',1200],['#ff9ad8',2000]];
 let lvl=0,lives=3,plats,p,ens=[],bubs=[],fruit=[],inv=0,lt=0,clearT=0,msg='',mt=0,hurry=false,sq=0;const ef=GX.fx();
 const gen=()=>{lvl++;plats=BLAY[(lvl-1)%5];p={x:40,y:plats[0][1],vy:0,f:1,on:null,blow:0,st:0};ens=[];bubs=[];fruit=[];
  const n=3+lvl;for(let i=0;i<n;i++)ens.push({x:60+i*(200/n),y:18,vy:0,f:i%2?1:-1,on:null,wait:i*25,cap:null,angry:0,dec:null,st:0,id:i});lt=0;hurry=false;inv=60;msg='STAGE '+lvl;mt=90;};
 const phys=o=>{o.vy=Math.min(o.vy+.22,3.6);const ny=o.y+o.vy;let land=null;if(o.vy>=0)for(const q of plats)if(o.x>q[0]-3&&o.x<q[0]+q[2]+3&&o.y<=q[1]+.01&&ny>=q[1]){land=q;break;}
  if(land){o.y=land[1];o.vy=0;o.on=land;}else{o.y=ny;o.on=null;}if(o.y<30&&o.vy<0){o.vy=0;}if(o.y>H+8)o.y=10;};
 const pop=b0=>{const set=[b0];for(let i=0;i<set.length;i++)for(const b of bubs)if(!set.includes(b)&&!b.dead&&Math.hypot(b.x-set[i].x,b.y-set[i].y)<26)set.push(b);
  let n=0;for(const b of set){b.dead=1;ef.ring(b.x,b.y,b.e?'#ffa0e0':'#bfefff',16,12);A.burst(b.x,b.y,'#bfefff',8,1.4);if(b.e){n++;b.e.dead=1;g.score+=100*(1<<Math.min(4,n-1));fruit.push({x:b.x,y:b.y,vy:-3,vx:rnd(2)-1,t:0,k:Math.min(4,n-1),on:null});}else g.score+=10;}
  if(n){S('score');A.shake=n>1?5:2;ef.spark(b0.x,b0.y,'#ffffff',8+n*4,2.5);if(n>1){msg=n+' IN A ROW!';mt=60;ef.flash('#ffa0e0',8);}}else S('blip');};
 const die=()=>{lives--;S('lose');A.shake=8;A.burst(p.x,p.y-8,'#3dff8b',20,2.5);if(lives<=0){g.over='BURST ON STAGE '+lvl;return;}p.x=40;p.y=plats[0][1];p.vy=0;inv=150;};
 gen();
 g.update=()=>{if(mt)mt--;if(clearT){clearT--;fruit.forEach(f=>{if(Math.abs(f.x-p.x)<14&&Math.abs(f.y-p.y)<16)f.got=1;});if(clearT===0){if(lvl>=5){g.over='ALL STAGES CLEAR! WIN';return;}gen();}}
  lt++;if(inv)inv--;if(p.blow)p.blow--;if(lt===1500){hurry=true;msg='HURRY UP!';mt=90;ens.forEach(e=>e.angry=1);S('blip');}
  const k=A.in(0),h=A.hit(0),dx=ax(k);if(dx){p.f=dx;p.x=cl(p.x+dx*1.7,14,306);p.st+=.3;}
  const wasOn=p.on;if(p.on&&(h.u||h.b)){p.vy=-5.3;S('jump');p.on=null;sq=-6;}
  if(!p.on&&p.vy>0&&(k.u||k.b))for(const b of bubs)if(!b.dead&&b.t>14&&Math.abs(b.x-p.x)<11&&p.y>b.y-13&&p.y<b.y-2){p.vy=-5;S('jump');break;}
  phys(p);if(!wasOn&&p.on)sq=6;if(sq>0)sq--;else if(sq<0)sq++;
  if(A.fire(16)&&bubs.length<7){bubs.push({x:p.x+p.f*8,y:p.y-8,vx:p.f*5.4,t:0,e:null,float:0});p.blow=8;S('shoot');}
  for(const b of bubs){if(b.dead)continue;b.t++;if(!b.float){b.x+=b.vx;b.vx*=.9;if(Math.abs(b.vx)<.45)b.float=1;
    if(Math.abs(b.vx)>1)for(const e of ens)if(!e.cap&&!e.dead&&!e.wait&&Math.hypot(e.x-b.x,e.y-7-b.y)<12){b.e=e;e.cap=b;b.t=0;b.float=1;S('hit');break;}}
   else{b.y=Math.max(30,b.y-.55);b.x+=Math.sin(b.t*.08+b.x*.1)*.3+(b.y<=31?(160-b.x)*.004:0);}
   b.x=cl(b.x,18,302);const life=b.e?Math.max(260,500-lvl*35):320;
   if(b.t>life){b.dead=1;if(b.e){const e=b.e;e.cap=null;e.angry=1;e.x=b.x;e.y=b.y+8;e.vy=0;S('hit');}else A.burst(b.x,b.y,'#9fe4ff',6,1);}
   else if(b.t>14&&Math.hypot(b.x-p.x,b.y-(p.y-8))<13)pop(b);}
  for(let i=0;i<bubs.length;i++)for(let j=i+1;j<bubs.length;j++){const a=bubs[i],b=bubs[j];if(!a.float||!b.float)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<16&&d>0){const f=(16-d)*.05;a.x+=(a.x-b.x)/d*f;b.x-=(a.x-b.x)/d*f;}}
  bubs=bubs.filter(b=>!b.dead);
  for(const e of ens){if(e.dead||e.cap)continue;if(e.wait){e.wait--;continue;}
   const sp=(e.angry?1.2:.72)+lvl*.07+(hurry?.35:0);
   if(e.on){e.x+=e.f*sp;e.st+=.3;if(e.x<16||e.x>304){e.f*=-1;e.x=cl(e.x,16,304);}const q=e.on,nx=e.x+e.f*6;
    if((nx<q[0]||nx>q[0]+q[2])&&e.dec!==q){e.dec=q;if(Math.random()<.55)e.f*=-1;}
    if(p.y<e.y-24&&Math.random()<.007+lvl*.002){e.vy=-5.3;e.on=null;}}else e.x=cl(e.x+e.f*sp*.5,16,304);
   phys(e);if(!inv&&Math.abs(e.x-p.x)<11&&Math.abs(e.y-p.y)<13){die();if(g.over)return;}}
  ens=ens.filter(e=>!e.dead);
  for(const f of fruit){f.t++;f.x=cl(f.x+f.vx,14,306);phys(f);if(Math.abs(f.x-p.x)<12&&Math.abs(f.y-p.y)<16){f.got=1;g.score+=FR[f.k][1];S('coin');A.burst(f.x,f.y-4,FR[f.k][0],10,1.5);}}
  fruit=fruit.filter(f=>!f.got&&f.t<520);
  if(!ens.length&&!clearT){clearT=150;g.score+=1000;msg='STAGE CLEAR! +1000';mt=100;S('win');}};
 const bot=(x,y,f,col,sc,st,ang)=>{const c=A.c;c.save();c.translate(x,y);c.scale(sc,sc);GX.shadow(0,0,7,1.8,.35);
  GX.disc(-4,-2,2.6,'#3a3a4a');GX.disc(4,-2,2.6,'#3a3a4a');GX.disc(-4+Math.sin(st)*.8,-2,1,'#8a8a9a');GX.disc(4-Math.sin(st)*.8,-2,1,'#8a8a9a');
  GX.rr(-7,-14,14,12,3,GX.lg(-7,-14,7,-2,[GX.lt(col,1.45),col,GX.lt(col,.55)]));c.fillStyle='rgba(255,255,255,.35)';c.fillRect(-5,-13,10,1.2);
  GX.rr(f>0?-1:-6,-12,7,5,2,'#141824');GX.disc(f>0?3:-3,-9.5,1.6,ang?'#ff4f6d':'#7affff');if(lo())GX.glow(f>0?3:-3,-9.5,4,ang?'#ff4f6d':'#7affff',.5);
  GX.stroke([[0,-14],[0,-18]],'#c8c8d8',1);GX.disc(0,-19,1.6,A.t%30<15?'#ffcf3f':'#ff9838');GX.stroke([[-f*7,-7],[-f*10,-7+Math.sin(A.t*.3)*3]],'#c8a040',2);c.restore();};
 const bgK=()=>{const i=(lvl-1)%5,pc=PC[i];GX.cache('bubbletrap_bg'+i,()=>{const c=A.c;GX.sky([GX.lt(pc,.22),'#0c0620','#05030e']);
   for(let y=24;y<H;y+=12)for(let x=((y/12)%2)*12;x<W;x+=24){c.fillStyle='rgba(255,255,255,.035)';c.fillRect(x+9,y,22,10);}
   GX.glow(160,120,170,pc,.10);for(let i2=0;i2<5;i2++){const x=40+i2*60;c.fillStyle='rgba(0,0,0,.18)';c.fillRect(x,16,14,H);c.fillStyle=GX.rgba(pc,.06);c.fillRect(x+2,16,2,H);}
   const dk=['#8a2a55','#1a7a70','#8a7020','#8a5020','#2a5a8a'][i];for(let y=16;y<H;y+=12){GX.block(0,y,8,12,dk,1.5);GX.block(312,y,8,12,dk,1.5);}});};
 g.draw=()=>{bgK();const pc=PC[(lvl-1)%5],c=A.c;
  for(const q of plats){GX.block(q[0],q[1],q[2],8,pc,2);c.fillStyle='rgba(0,0,0,.28)';c.fillRect(q[0]+2,q[1]+8,q[2]-4,3);for(let x=q[0]+6;x<q[0]+q[2]-3;x+=12){c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x,q[1]+3,1.5,1.5);}}
  for(const f of fruit){if(f.t>420&&A.t%8<4)continue;const[cc]=FR[f.k],y=f.y;GX.shadow(f.x,y,5,1.4,.35);
   if(f.k===1){GX.ell(f.x,y-4,6.5,3.2,GX.lg(f.x-6,y-7,f.x+6,y-1,['#fff6a0',cc,'#b08a10']),.4);}
   else if(f.k===2){[[-2,-3],[2,-3],[0,-6],[0,-1]].forEach(d=>GX.orb(f.x+d[0],y+d[1],2.6,cc));}
   else if(f.k===3){GX.orb(f.x,y-5,5,cc);GX.ell(f.x+1.5,y-10,2.5,1.2,'#1a8a2a',-.4);}
   else if(f.k===4){GX.rr(f.x-5,y-8,10,7,2,GX.lg(0,y-8,0,y-1,['#ffd8ee',cc]));GX.rr(f.x-5,y-9.5,10,2.5,1,'#ffffff');GX.disc(f.x,y-11,1.8,K.r);}
   else{GX.orb(f.x-2,y-3,3,cc);GX.orb(f.x+3,y-2,3,cc);GX.stroke([[f.x-2,y-6],[f.x+1,y-10],[f.x+3,y-5]],'#3a8a2a',1);}}
  for(const e of ens){if(e.dead||e.cap||e.wait)continue;bot(e.x,e.y,e.f,e.angry?'#ff4f6d':'#b8c0e8',1,e.st,e.angry);}
  for(const b of bubs){const life=Math.max(260,500-lvl*35),warn=b.e&&b.t>life-90&&A.t%10<5,wob=Math.sin(b.t*.2+b.x)*.6,r=9+(b.t<6?(b.t-6)*.6:0);
   if(b.e)bot(b.x,b.y+5+wob,b.e.f,warn?'#ff4f6d':'#9aa2d8',.66,0,warn);
   GX.disc(b.x,b.y,r,GX.rg(b.x-3,b.y-3,1,b.x,b.y,r,b.e?['rgba(255,200,235,.08)','rgba(255,150,220,.16)','rgba(255,120,210,.42)']:['rgba(200,245,255,.06)','rgba(140,230,255,.14)','rgba(120,220,255,.42)']));
   c.strokeStyle=warn?K.r:b.e?'rgba(255,170,230,.9)':'rgba(170,240,255,.85)';c.lineWidth=1;c.beginPath();c.arc(b.x,b.y,Math.max(1,r),0,6.2832);c.stroke();
   c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1.2;c.beginPath();c.arc(b.x,b.y,Math.max(1,r-2.5),3.6,4.5);c.stroke();GX.disc(b.x+4,b.y+4,1,'rgba(255,255,255,.6)');}
  if(!(inv&&inv%8<4)){const x=p.x,y=p.y,f=p.f,run=p.on&&ax(A.in(0)),wob=run?Math.sin(p.st)*1.2:0,sy=1-sq*.035,sx=1+sq*.03;c.save();c.translate(x,y);c.scale(sx,sy);
   GX.shadow(0,0,7,1.8,.35);GX.rr(-5,-3+wob*.5,4,3,1,'#1f9a4a');GX.rr(1,-3-wob*.5,4,3,1,'#1f9a4a');
   for(let i=0;i<3;i++)GX.poly([[-f*(2+i*3)-2,-11+i],[-f*(2+i*3)+2,-11+i],[-f*(2+i*3),-15+i]],GX.lg(0,-15,0,-10,['#ffd070','#ff8a30']));
   GX.ell(0,-7,7,5.5,GX.rg(-2,-10,1,0,-7,8,['#a8ffc8','#3ddf7b','#178a40']));GX.ell(f*1,-5.5,4,3,'#d8ffe0');GX.ell(-f*6,-6,3,2,'#2fbf60',f*.6);
   GX.disc(f*5,-12,5.2,GX.rg(f*4,-14,1,f*5,-12,5.5,['#a8ffc8','#3ddf7b','#1a9a48']));GX.disc(f*6,-14,2.3,'#ffffff');GX.disc(f*6.6,-14,1.1,'#000000');c.fillStyle='#ffffff';c.fillRect(f*6.2,-15,.8,.8);
   if(p.blow){GX.disc(f*10,-11,2.2,'#1a1a1a');GX.disc(f*12,-11,1.5+p.blow*.2,'rgba(190,240,255,.6)');}c.restore();}
  ef.draw();hud('SCORE '+g.score,'STAGE '+lvl+'/5'+(hurry?'  HURRY!':''),'LIVES '+lives);if(mt)banner(msg,K.y,112);};
return g;}});

/* ================= ELEVATOR AGENT ================= */
A.add({id:'elevator',name:'ELEVATOR AGENT',cat:'CLASSICS',warm:120,time:300,how:'UP JUMPS, DOWN DUCKS, A FIRES. RIDE LIFTS, GRAB RED-DOOR FILES, EXIT BELOW.',make(){
 const g={over:null,score:0},FH=44,NF=14,X0=14,X1=306;
 let lvl=0,lives=3,p,shafts,doors,ags,pb,eb,camY=0,docs=0,inv=0,msg='',mt=0,spT=60,t=0,aid=0,fireT=0;const ef=GX.fx();
 const fy=f=>60+f*FH;
 const gen=()=>{lvl++;shafts=[];doors=[];ags=[];pb=[];eb=[];const XS=[64,256,160,104,216];let f=0,i=lvl%2;
  while(f<NF-1){const span=Math.min(NF-1-f,3+ri(3));shafts.push({x:XS[i%5],a:f,b:f+span,y:fy(f)});f+=span;i+=1+ri(2);}
  for(let fl=0;fl<NF-1;fl++){[40,120,200,280].forEach(x=>{if(!shafts.some(s=>fl>=s.a&&fl<=s.b&&Math.abs(s.x-x)<36)&&!(fl===0&&x<60))doors.push({f:fl,x,red:false,open:0});});}
  const cand=shuffle(doors.filter(d=>d.f>0));const nred=Math.min(cand.length,4+lvl);for(let j=0;j<nred;j++)cand[j].red=true;docs=nred;
  p={x:30,y:fy(0),f:0,jh:0,vj:0,duck:0,face:1,car:null,st:0};camY=0;inv=60;msg='BUILDING '+lvl;mt=90;spT=90;};
 const onShaft=(x,f,w)=>shafts.find(s=>f>=s.a&&f<=s.b&&Math.abs(x-s.x)<w);
 const aligned=s=>{const f=Math.round((s.y-60)/FH);return Math.abs(s.y-fy(f))<.6?f:-1;};
 const hurt=()=>{lives--;S('lose');A.shake=8;ef.flash('#ff4f6d',10);A.burst(p.x,p.y-camY-12,K.r,20,2.5);eb=[];if(lives<=0){g.over='AGENT DOWN ON FLOOR '+(p.f+1);return;}inv=150;ags=ags.filter(a=>Math.abs(a.x-p.x)>70);};
 gen();
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;if(fireT)fireT--;const k=A.in(0),h=A.hit(0);
  for(const s of shafts){if(s===p.car)continue;const want=p.f>=s.a&&p.f<=s.b&&Math.abs(p.x-s.x)<70&&!p.car?fy(p.f):fy(Math.round(cl((s.y-60)/FH,s.a,s.b)));s.y+=cl(want-s.y,-1.6,1.6);}
  if(p.car){const s=p.car;if(k.u&&s.y>fy(s.a))s.y=Math.max(fy(s.a),s.y-1.5);else if(k.d&&s.y<fy(s.b))s.y=Math.min(fy(s.b),s.y+1.5);else{const tf=fy(Math.round(cl((s.y-60)/FH,s.a,s.b)));s.y+=cl(tf-s.y,-1.5,1.5);}
   p.y=s.y;p.x+=(s.x-p.x)*.3;p.duck=0;p.jh=0;const f=aligned(s);if(f>=0){p.f=f;const dx=ax(k);if(dx&&!k.u&&!k.d){p.car=null;p.x=s.x+dx*15;p.face=dx;}}}
  else{const dx=ax(k);p.duck=k.d&&!p.jh?1:0;
   if(dx&&!p.duck){p.face=dx;const nx=cl(p.x+dx*1.35,X0+6,X1-6),s=onShaft(nx,p.f,14);if(!s||Math.abs(s.y-fy(p.f))<.6)p.x=nx;p.st+=.28;}
   if(h.u&&p.jh===0){p.vj=3.3;S('jump');}if(p.jh>0||p.vj>0){p.jh+=p.vj;p.vj-=.2;if(p.jh<=0){p.jh=0;p.vj=0;}}
   const s=onShaft(p.x,p.f,5);if(s&&Math.abs(s.y-fy(p.f))<.6&&p.jh===0)p.car=s;
   for(const d of doors)if(d.red&&d.f===p.f&&Math.abs(d.x-p.x)<8){d.red=false;d.open=30;docs--;g.score+=500;S('score');A.burst(d.x,fy(d.f)-camY-16,K.y,16,2);msg=docs?'FILE GRABBED  '+docs+' LEFT':'ALL FILES! GET TO THE CAR';mt=80;}
   if(p.f===NF-1&&p.x>X1-44){if(docs===0){g.score+=1000+lives*200;S('win');A.confetti();if(lvl>=3){g.over='ALL FILES STOLEN! WIN';return;}gen();return;}p.x=X1-45;if(!mt){msg='FILES LEFT: '+docs;mt=60;}}}
  if(A.fire(14)&&!p.car){pb.push({x:p.x+p.face*8,f:p.f,vx:p.face*5,hy:p.duck?8:17+p.jh});fireT=10;S('shoot');}
  for(const b of pb){b.x+=b.vx;for(const a of ags)if(!a.dead&&!a.out&&a.f===b.f&&Math.abs(a.x-b.x)<6&&!(a.low&&a.aim&&b.hy>13)){a.dead=1;b.x=-99;g.score+=100;S('boom');A.shake=3;ef.spark(a.x,fy(a.f)-camY-16,'#ffcf3f',10,2.2);ef.debris(a.x,fy(a.f)-camY-14,'#2a2a3a',6,1.6);A.burst(a.x,fy(a.f)-camY-14,'#6a6a8a',14,2);}}
  pb=pb.filter(b=>b.x>X0&&b.x<X1);
  if(!p.car&&--spT<=0){const onF=ags.filter(a=>a.f===p.f).length;const ds=doors.filter(d=>d.f===p.f&&!d.red&&Math.abs(d.x-p.x)>56&&Math.abs(d.x-p.x)<200);
   if(ds.length&&onF<1+Math.min(3,lvl-1+Math.floor(p.f/5))){const d=ds[ri(ds.length)];ags.push({x:d.x,f:p.f,cd:50+ri(50),aim:0,low:0,st:0,out:24,id:aid++,dead:0});d.open=24;spT=Math.max(50,120-lvl*15-p.f*2);}else spT=30;}
  ags=ags.filter(a=>!a.dead&&a.f===p.f);
  for(const a of ags){if(a.out){a.out--;continue;}const dx=p.x-a.x;a.face=dx>=0?1:-1;const want=60+(a.id%3)*28;
   if(a.aim){a.aim--;if(a.aim===0){eb.push({x:a.x+a.face*8,f:a.f,vx:a.face*(2.4+lvl*.2),low:a.low});S('shoot');a.cd=Math.max(40,90-lvl*12)+ri(40);}}
   else{if(Math.abs(dx)>want){const nx=a.x+a.face*.8;if(!onShaft(nx,a.f,15))a.x=nx;a.st+=.22;}if(--a.cd<=0&&Math.abs(dx)<220){a.aim=26;a.low=Math.random()<.45?1:0;}}
   if(!inv&&!p.car&&Math.abs(dx)<9){hurt();if(g.over)return;}}
  for(const b of eb){b.x+=b.vx;if(!inv&&b.f===p.f&&Math.abs(b.x-p.x)<5){const inCarOk=p.car&&aligned(p.car)!==b.f;if(inCarOk)continue;const dodge=b.low?p.jh>7:p.duck;if(!dodge){b.x=-99;hurt();if(g.over)return;}}}
  eb=eb.filter(b=>b.x>X0&&b.x<X1);doors.forEach(d=>{if(d.open)d.open--;});
  const ty=cl(p.y-150,0,fy(NF-1)+30-H);camY+=(ty-camY)*.15;};
 g.draw=()=>{const c=A.c,cy=Math.round(camY);GX.cache('elevator_bg',()=>{GX.sky(['#0a0a26','#1c1440','#2a1a40']);GX.stars(50,5,0,0,H,.6);GX.skyline(H,'#120e26',0,3,'rgba(255,210,120,.5)');});
  const ry=fy(0)-FH-cy;if(ry>-40){GX.vg(X0-4,ry-6,X1-X0+8,8,['#5a5070','#2a2438']);GX.stroke([[250,ry-6],[250,ry-30]],'#8d86b8',1);if(A.t%40<20){GX.disc(250,ry-31,2,K.r);if(lo())GX.glow(250,ry-31,8,'#ff4f6d',.6);}}
  for(let f=0;f<NF;f++){const y=fy(f)-cy;if(y<0||y-FH>H)continue;const last=f===NF-1;
   GX.vg(X0,y-FH,X1-X0,FH,last?['#3a3646','#24202e']:f%2?['#5a4c80','#3e3360']:['#62548a','#463a6a']);
   c.fillStyle='rgba(255,255,255,.04)';for(let x=X0+6;x<X1;x+=12)c.fillRect(x,y-FH,1,FH-12);
   GX.vg(X0,y-13,X1-X0,13,last?['#2e2a36','#1c1a24']:['#3a2e58','#271e40']);c.fillStyle='rgba(255,220,160,.18)';c.fillRect(X0,y-13,X1-X0,1);
   for(const lx of[80,240]){GX.rr(lx-5,y-FH,10,3,1,'#1a1a1a');GX.disc(lx,y-FH+5,2.6,'#fff2c0');if(lo())GX.glow(lx,y-FH+6,14,'#ffe08a',.35);c.globalAlpha=.08;GX.poly([[lx-3,y-FH+7],[lx+3,y-FH+7],[lx+28,y],[lx-28,y]],'#ffe08a');c.globalAlpha=1;}
   GX.vg(X0,y,X1-X0,4,['#4a3c60','#1a1424']);ott(last?'B':''+(NF-f),X0+3,y-FH+4,'#b8b0e0');
   if(last){const cx=X1-26;GX.shadow(cx,y,24,3,.4);GX.rr(cx-20,y-15,40,11,4,GX.lg(0,y-15,0,y-4,['#ff7a7a','#d83a3a','#8a1a1a']));GX.rr(cx-12,y-22,24,9,3,'#b82a2a');GX.rr(cx-9,y-20,18,6,2,GX.lg(cx-9,y-20,cx+9,y-14,['#dff4ff','#7ab8e8']));
    GX.disc(cx-11,y-3,4,'#141414');GX.disc(cx+11,y-3,4,'#141414');GX.disc(cx-11,y-3,1.6,'#9a9aa8');GX.disc(cx+11,y-3,1.6,'#9a9aa8');ott('EXIT',cx,y-FH+8,docs?K.gr:(A.t%20<10?K.y:K.g),'c');}}
  for(const d of doors){const y=fy(d.f)-cy;if(y<0||y-FH>H)continue;GX.rr(d.x-10,y-31,20,31,2,'#1a1428');const col=d.red?'#e03a4a':'#3a6ad8';
   if(d.open){c.fillStyle='#08060e';c.fillRect(d.x-8,y-29,16,29);GX.vg(d.x-8,y-29,5,29,[GX.lt(col,1.2),GX.lt(col,.6)]);c.globalAlpha=.12;GX.poly([[d.x-8,y],[d.x+8,y],[d.x+20,y+4],[d.x-20,y+4]],'#ffe8b0');c.globalAlpha=1;}
   else{GX.vg(d.x-8,y-29,16,29,[GX.lt(col,1.3),col,GX.lt(col,.6)]);c.fillStyle='rgba(0,0,0,.22)';c.fillRect(d.x-6,y-27,12,10);c.fillRect(d.x-6,y-14,12,11);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(d.x-6,y-27,12,1);c.fillRect(d.x-6,y-14,12,1);GX.disc(d.x+5,y-15,1.2,K.y);
    if(d.red){const b=Math.sin(A.t*.12+d.x)*1.5;if(lo())GX.glow(d.x,y-38+b,10,'#ffcf3f',.35);GX.rr(d.x-5,y-42+b,10,8,1,'#ffffff');c.fillStyle='#8888aa';c.fillRect(d.x-3,y-40+b,6,1);c.fillRect(d.x-3,y-38+b,5,1);c.fillRect(d.x-3,y-36+b,6,1);GX.rr(d.x-5,y-43+b,5,2,1,'#ffcf3f');}}}
  for(const s of shafts){for(let f=s.a;f<=s.b;f++){const y=fy(f)-cy;if(y<0||y-FH>H)continue;GX.hg(s.x-13,y-FH,26,FH+4,['#0a0814','#1c1830','#0a0814']);GX.stroke([[s.x-6,y-FH],[s.x-6,y]],'#2e2844',1);GX.stroke([[s.x+6,y-FH],[s.x+6,y]],'#2e2844',1);}
   const y=s.y-cy;GX.stroke([[s.x-2,fy(s.a)-FH-cy],[s.x-2,y-32]],'#8d86b8',.8);GX.stroke([[s.x+2,fy(s.a)-FH-cy],[s.x+2,y-32]],'#8d86b8',.8);
   GX.rr(s.x-12,y-33,24,33,2,GX.lg(s.x-12,0,s.x+12,0,['#a8884a','#f0d890','#a8884a']));GX.rr(s.x-10,y-30,20,26,1,GX.lg(0,y-30,0,y-4,['#fff6d8','#e8d8a8']));if(lo())GX.glow(s.x,y-24,14,'#fff0c0',.25);GX.vg(s.x-12,y-4,24,4,['#8a7040','#4a3a1a']);
   if(p.car===s)A.person(p.x,s.y-cy-3,{c:'#c89a50',pants:'#3a3a4a',cap:'#6a4a2a',id:2,d:p.face,s:.85});
   c.fillStyle='rgba(180,220,255,.12)';c.fillRect(s.x-10,y-30,20,26);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(s.x-8,y-29,2,24);
   for(let f=s.a;f<=s.b;f++){const yy=fy(f)-cy;if(yy<0||yy-FH>H)continue;if(Math.abs(s.y-fy(f))>30){GX.vg(s.x-12,yy-30,24,30,['#8a8aa0','#5a5a70']);GX.stroke([[s.x,yy-30],[s.x,yy]],'#3a3a4a',1);c.fillStyle='rgba(255,255,255,.15)';c.fillRect(s.x-11,yy-29,10,1);}
    const on=Math.abs(s.y-fy(f))<.6;GX.rr(s.x-6,yy-38,12,6,1,'#141418');ott(''+(NF-f),s.x,yy-37,on?K.y:'#7a6a4a','c');}}
  for(const a of ags){const y=fy(a.f)-cy;if(a.out){c.globalAlpha=.5;A.person(a.x,y,{c:'#20202c',pants:'#20202c',cap:'#0a0a0a',id:a.id,d:a.face});c.globalAlpha=1;continue;}const o={c:'#20202c',pants:'#20202c',cap:'#0a0a0a',id:a.id,st:a.st,d:a.face,arm2:a.aim?-1.57*a.face:undefined};
   if(a.low&&a.aim)squash(a.x,y,.62,()=>A.person(0,0,o));else A.person(a.x,y,o);if(a.aim&&a.aim<10&&A.t%4<2){const yy=y-(a.low?10:17);GX.disc(a.x+a.face*10,yy,2.2,'#ffffff');if(lo())GX.glow(a.x+a.face*10,yy,8,'#ffcf3f',.7);}}
  if(!p.car&&!(inv&&inv%8<4)){const y=p.y-cy-p.jh,o={c:'#c89a50',pants:'#3a3a4a',cap:'#6a4a2a',id:2,st:p.st,d:p.face,arm2:fireT?-1.57*p.face:undefined};if(p.jh)GX.shadow(p.x,p.y-cy,6,1.6,.3);if(p.duck)squash(p.x,y,.6,()=>A.person(0,0,o));else A.person(p.x,y,o);if(fireT>7&&lo())GX.glow(p.x+p.face*11,y-(p.duck?8:17),9,'#ffcf3f',.7);}
  pb.forEach(b=>{const y=fy(b.f)-cy-b.hy;GX.stroke([[b.x-b.vx*1.6,y+1],[b.x+2,y+1]],'rgba(255,220,120,.6)',2);GX.rr(b.x-2,y,5,2,1,'#fff2a0');});
  eb.forEach(b=>{const y=fy(b.f)-cy-(b.low?6:17);GX.stroke([[b.x-b.vx*2,y+1],[b.x+2,y+1]],'rgba(255,90,110,.6)',2);GX.rr(b.x-2,y,5,2,1,'#ffb0b8');});
  ef.draw();hud('SCORE '+g.score,'FILES '+docs+'   FLOOR '+(NF-p.f)+(p.f===NF-1?' B':''),'BLDG '+lvl+'/3  LIVES '+lives);if(mt)banner(msg,msg.startsWith('FILES L')?K.r:K.y,24);};
return g;}});

/* ================= BAR RUSH ================= */
A.add({id:'barrush',name:'BAR RUSH',cat:'CLASSICS',warm:120,time:240,how:'UP/DOWN SWITCH COUNTERS, A SLIDES A DRINK. WALK TO CATCH EMPTIES. NO SPILLS.',make(){
 const g={over:null,score:0},LY=[78,118,158,198],CX0=40,CX1=268;
 let lvl=0,lives=3,bl=0,bx=CX1-6,cust=[],dr=[],em=[],tips=[],toSpawn=0,spT=0,pour=0,freeze=0,msg='',mt=0,cid=0,walkSt=0;
 const gen=()=>{lvl++;cust=[];dr=[];em=[];tips=[];toSpawn=6+lvl*3;spT=40;msg='ROUND '+lvl;mt=90;bl=0;bx=CX1-6;};
 const miss=why=>{lives--;S('lose');A.shake=8;msg=why;mt=90;freeze=70;dr=[];em=[];cust.forEach(c=>{c.x=Math.min(c.x,CX0+10+ri(30));c.st='walk';c.t=0;});if(lives<=0)g.over='BAR CLOSED - '+why;};
 gen();
 g.update=()=>{if(mt)mt--;if(freeze){freeze--;return;}const k=A.in(0),h=A.hit(0);
  if(h.u&&bl>0){bl--;bx=CX1-6;S('blip');}if(h.d&&bl<3){bl++;bx=CX1-6;S('blip');}
  const dx=ax(k);if(dx){bx=cl(bx+dx*2.4,CX0+8,CX1-6);walkSt+=.3;}
  if(pour)pour--;if(h.a&&!pour){if(bx<CX1-20){bx=CX1-6;}pour=12;dr.push({lane:bl,x:CX1-10,wait:8});S('blip');}
  if(--spT<=0&&toSpawn>0){const cnt=[0,1,2,3].map(l=>cust.filter(c=>c.lane===l).length);const l=[0,1,2,3].sort((a,b)=>cnt[a]-cnt[b]+rnd(1.5)-.75)[0];
   cust.push({lane:l,x:CX0-10,st:'walk',t:0,pb:0,id:cid++,c:['#ff4f6d','#4dabff','#3dff8b','#ffcf3f','#ff9838','#ff4f9a','#2fd6c3'][cid%7],sp:.32+lvl*.06+rnd(.12)});toSpawn--;spT=Math.max(50,150-lvl*16)+ri(60);}
  for(const c of cust){c.t++;if(c.st==='walk'){if(c.t%90<55)c.x+=c.sp;if(c.x>CX1-14){c.gone=1;miss('CUSTOMER STORMED THE BAR');return;}}
   else if(c.st==='back'){c.x-=1.9;c.pb-=1.9;if(c.x<CX0-12){c.gone=1;g.score+=50;S('coin');}else if(c.pb<=0){c.st='drink';c.t=0;}}
   else if(c.st==='drink'&&c.t>70){c.st='walk';c.t=0;em.push({lane:c.lane,x:c.x+10});}}
  cust=cust.filter(c=>!c.gone);
  for(const d of dr){if(d.wait){d.wait--;continue;}d.x-=2.3+lvl*.25;const c=cust.filter(c=>c.lane===d.lane&&c.st==='walk'&&c.x+9>=d.x).sort((a,b)=>b.x-a.x)[0];
   if(c){d.gone=1;c.st='back';c.pb=48+rnd(40);g.score+=30;S('coin');if(Math.random()<.18)tips.push({lane:c.lane,x:c.x+14,t:0});}
   else if(d.x<CX0){d.gone=1;miss('DRINK SMASHED ON THE FLOOR');return;}}
  dr=dr.filter(d=>!d.gone);
  for(const e of em){e.x+=1.2+lvl*.12;if(e.lane===bl&&e.x>=bx-10){e.gone=1;g.score+=100;S('score');A.burst(bx-8,LY[bl]-8,'#ffffff',6,1);}else if(e.x>CX1+2){e.gone=1;miss('EMPTY MUG SHATTERED');return;}}
  em=em.filter(e=>!e.gone);
  for(const tp of tips){tp.t++;if(tp.lane===bl&&Math.abs(tp.x-bx)<10){tp.gone=1;g.score+=150;S('coin');msg='TIP +150';mt=40;}}tips=tips.filter(t=>!t.gone&&t.t<400);
  if(toSpawn<=0&&!cust.length&&!em.length&&!dr.length){g.score+=500*lvl;S('win');A.confetti();if(lvl>=5){g.over='LAST CALL! VICTORY';return;}gen();}};
 const mug=(x,y,full)=>{R(x-3,y-7,7,8,full?'#ffcf3f':'#c8d8e8');if(full)R(x-3,y-8,7,2,'#ffffff');R(x+4,y-5,2,4,'#c8d8e8');};
 g.draw=()=>{vg('#5a2e1a','#2a140a',14,H,10);for(let x=6;x<W;x+=24)R(x,14,2,H,'#4a2412');
  for(let l=0;l<4;l++){const y=LY[l]-(l?11:24),bh=l?6:9;R(66,y,200,3,'#2a1006');for(let i=0;i<14;i++){const x=72+i*14,bc=['#3a8a3a','#8a2a2a','#c8a040','#3a5a9a','#e8e8d8'][(i+l*2)%5];R(x,y-bh,5,bh,bc);R(x+1.5,y-bh-3,2,3,bc);R(x+1,y-bh+1,1,bh-3,'#f0e8d8');}}
  for(let lx=50;lx<W;lx+=110){L(lx,14,lx,24,'#1a1a1a');ell(lx,27,8,4,'#c8a040');alpha(.07,()=>P([[lx-6,28],[lx+6,28],[lx+40,90],[lx-40,90]],'#ffe8a0',1));}
  for(let l=0;l<4;l++){const y=LY[l];R(4,y-34,30,34,'#3a1a0a');R(8,y-31,10,29,'#8a5a2a');R(20,y-31,10,29,'#8a5a2a');R(9,y-20,1,4,K.y);
   R(CX1+14,y-30,30,30,'#6a3a1a');C(CX1+29,y-15,9,'#8a5a2a');R(CX1+20,y-24,18,2,'#3a2010');R(CX1+20,y-8,18,2,'#3a2010');R(CX1+4,y-22,12,4,'#c8c8d8');R(CX1+6,y-18,3,6,'#c8c8d8');}
  for(let l=0;l<4;l++){const y=LY[l];
   for(const c of cust)if(c.lane===l)A.person(c.x,y+10,{c:c.c,id:c.id,s:.85,st:c.st==='walk'&&c.t%90<55?c.t*.2:0,d:1,arm2:c.st==='drink'?-2.6:undefined,arm1:c.st==='back'?-1.2:undefined});
   if(bl===l)A.person(bx,y+10,{c:'#ffffff',pants:'#1a1a1a',hair:'#1a1a1a',id:4,s:.9,d:-1,st:walkSt,arm1:pour?-1.3:undefined});
   R(CX0-6,y,CX1-CX0+20,5,'#c88a4a');R(CX0-6,y+5,CX1-CX0+20,14,'#6a3a18');R(CX0-6,y+12,CX1-CX0+20,2,'#d8b050');
   for(const c of cust)if(c.lane===l&&c.st==='drink')mug(c.x+6,y-12,true);
   for(const d of dr)if(d.lane===l)mug(d.x,y,true);for(const e of em)if(e.lane===l)mug(e.x,y,false);
   for(const tp of tips)if(tp.lane===l&&!(tp.t>320&&A.t%8<4)){C(tp.x,y-3,3,K.y);T('$',tp.x-1,y-5,'#8a6a00',1);}}
  if(bl>=0&&!freeze&&A.t%30<18)P([[CX1+6,LY[bl]-40],[CX1+12,LY[bl]-46],[CX1,LY[bl]-46]],K.y,1);
  hud('SCORE '+g.score,'ROUND '+lvl+'/5  GUESTS '+(toSpawn+cust.length),'LIVES '+lives);if(mt)banner(msg,msg.startsWith('ROUND')||msg.startsWith('TIP')?K.y:K.r,24);};
 return g;}});

/* ================= HIGH RISE ================= */
A.add({id:'highrise',name:'HIGH RISE',cat:'CLASSICS',warm:120,how:'HOLD UP TO CLIMB, LEFT/RIGHT TO SHIFT. DODGE CLOSING WINDOWS AND FALLING POTS.',make(){
 const g={over:null,score:0},NC=5,RH=30,TOP=60,cx=i=>64+i*48,BY=176;
 let c=2,x=cx(2),h=0,best=0,lives=3,inv=60,win=[],pots=[],birds=[],fall=0,t=0,msg='',mt=0,done=0,cam=0,potT=230,bump=0;const ef=GX.fx();
 const WN=(r,i)=>{if(r<0||r>=TOP)return null;if(!win[r]){win[r]=[];for(let j=0;j<NC;j++)win[r].push({s:0,t:0,cl:0});}return win[r][i];};
 const closed=(r,i)=>{const w=WN(r,i);return!!w&&w.cl>.5;};
 const Y=v=>BY-(v-cam)*RH;
 const knock=why=>{lives--;S('lose');A.shake=7;ef.flash('#ffffff',8);ef.debris(x,Y(h+1),'#e0d0a8',8,2);A.burst(x,Y(h+1),K.w,16,2);msg=why;mt=70;if(lives<=0){g.over='FELL FROM FLOOR '+(Math.floor(h)+1);return;}fall=34;inv=150;};
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;cam+=(h-cam)*.12;
  if(done){done--;if(done===0)g.over='ROOF REACHED! WIN';return;}
  if(fall>0){fall--;h=Math.max(0,h-.11);}
  else{const k=A.in(0),hh=A.hit(0),moving=Math.abs(x-cx(c))>2,hr=Math.floor(h+1.2);
   if(!moving&&k.u){const nh=h+.052;if(!closed(Math.floor(nh+1.2),c)){h=nh;}else if(++bump%20===1)S('hit');}
   else if(!moving&&k.d)h=Math.max(0,h-.04);
   const d=hh.l?-1:hh.r?1:0;if(d&&c+d>=0&&c+d<NC&&!closed(hr,c+d)&&!closed(Math.floor(h+.2),c+d)){c+=d;S('blip');}
   x+=cl(cx(c)-x,-3.2,3.2);}
  if(Math.floor(h)>best){best=Math.floor(h);g.score+=10+(best%10===0?150:0);if(best%10===0){msg='FLOOR '+best;mt=50;S('score');}}
  if(h>=TOP-1.1&&!done){done=110;g.score+=2000+lives*500;S('win');A.confetti();msg='HELICOPTER PICKUP!';mt=110;return;}
  const lo=Math.max(0,Math.floor(h)-3),hi=Math.min(TOP-1,Math.floor(h)+8),hr=Math.floor(h+1.2);
  if(Math.random()<.025+h*.0012){const r=Math.floor(h)+ri(7)-1,i=ri(NC),w=WN(r,i);if(w&&w.s===0){w.s=1;w.t=Math.max(34,60-h*.5);}}
  for(let r=lo;r<=hi;r++)for(let i=0;i<NC;i++){const w=WN(r,i);if(!w||w.s===0)continue;
   if(w.s===1){if(--w.t<=0)w.s=2;}else if(w.s===2){const was=w.cl;w.cl=Math.min(1,w.cl+.07);if(was<=.5&&w.cl>.5&&r===hr&&i===c&&!inv&&!fall&&!done){knock('WINDOW SLAMMED!');if(g.over)return;}if(w.cl>=1){w.s=3;w.t=90+ri(90);}}
   else if(w.s===3){if(--w.t<=0)w.s=4;}else{w.cl=Math.max(0,w.cl-.04);if(w.cl<=0)w.s=0;}}
  if(--potT<=0){potT=Math.max(45,150-h*1.8)+ri(40);const i=Math.random()<.6?c:ri(NC),r=Math.min(TOP-1,Math.floor(h)+5);pots.push({i,r:r+.5,st:30});}
  for(const q of pots){if(q.st){q.st--;continue;}q.r-=.1+h*.001;if(!inv&&!fall&&!done&&Math.abs(q.r-(h+1))<.55&&Math.abs(cx(q.i)-x)<16){q.gone=1;A.burst(cx(q.i),Y(q.r),'#c8643a',14,2);knock('POT ON THE HEAD!');if(g.over)return;}if(q.r<h-5)q.gone=1;}
  pots=pots.filter(q=>!q.gone);
  if(h>15&&t%Math.max(140,320-Math.floor(h*3))===0){const fr=Math.random()<.5;birds.push({x:fr?-12:W+12,v:(fr?1:-1)*(1.3+h*.012),r:h+1+rnd(1.4)});}
  for(const b of birds){b.x+=b.v;if(!inv&&!fall&&!done&&Math.abs(b.x-x)<10&&Math.abs(b.r-(h+1))<.5){b.gone=1;knock('BIRD STRIKE!');if(g.over)return;}if(b.x<-20||b.x>W+20)b.gone=1;}birds=birds.filter(b=>!b.gone);};
 g.draw=()=>{const f=cl(cam/TOP,0,1),C2=A.c;C2.fillStyle=GX.lg(0,0,0,H,[A.mix('#5a8ae8','#0c1650',f),A.mix('#a8d0ff','#3a2a80',f),A.mix('#ffd6a0','#ff8a6a',f)]);C2.fillRect(0,0,W,H);
  GX.glow(268,40+f*30,60,'#fff0c0',.35);GX.disc(268,40+f*30,10,'#fff6d8');if(f>.4)GX.stars(30,9,0,0,120,(f-.4)*1.5);
  for(let i=0;i<5;i++){const cxx=((i*83-cam*RH*.08+t*.1)%(W+80)+W+80)%(W+80)-40,cyy=30+i*34+(cam*RH*.25)%200*0;C2.globalAlpha=.75;GX.ell(cxx,cyy,24,7,'#ffffff');GX.ell(cxx+12,cyy-4,14,6,'#ffffff');GX.ell(cxx-10,cyy+1,12,5,'#e8f0ff');C2.globalAlpha=1;}
  const so=(cam*RH*.18)%40;GX.skyline(H+so,A.mix('#2a2a5a','#141030',f),cam*2,7,'rgba(255,214,120,.6)');
  const top=Y(TOP),bt=Math.max(15,top);
  GX.hg(36,bt,248,H-bt,['#a8825e','#d8b48c','#c4a07a','#a8825e']);C2.fillStyle='rgba(90,50,20,.12)';for(let yy=Math.round(Y(Math.floor(cam)+8))%6;yy<H;yy+=6)if(yy>bt)C2.fillRect(36,yy,248,1);
  C2.fillStyle='rgba(0,0,0,.25)';C2.fillRect(36,bt,3,H-bt);C2.fillRect(281,bt,3,H-bt);
  const lo_=Math.max(0,Math.floor(cam)-3),hi_=Math.min(TOP-1,Math.floor(cam)+7);
  for(let r=lo_;r<=hi_;r++){const yb=Y(r);GX.vg(32,yb-3,256,5,['#f0e0c8','#8a6a4a']);if(r%5===0){GX.rr(10,yb-20,22,11,3,'rgba(10,10,30,.7)');ott(''+r,21,yb-17,K.y,'c');}
   for(let i=0;i<NC;i++){const w=WN(r,i),X=cx(i),y0=Y(r+.86),y1=Y(r+.16),hg=y1-y0;GX.rr(X-17,y0-2,34,hg+4,2,'#5a3a2a');
    if(w.s===1){GX.vg(X-15,y0,30,hg,['#ffe6a0','#ffb860']);if(lo())GX.glow(X,y0+hg/2,22,'#ffd070',.3);GX.disc(X,y0+hg*.5,4,'#f1c7a3');GX.rr(X-5,y0+hg*.5+3,10,7,2,'#ff4f9a');GX.disc(X-1.5,y0+hg*.5-.5,.8,'#222');GX.disc(X+1.5,y0+hg*.5-.5,.8,'#222');}
    else{GX.vg(X-15,y0,30,hg,['#7ab0e8','#2a4a8a']);C2.globalAlpha=.35;GX.poly([[X-15,y0+hg*.7],[X-4,y0],[X+3,y0],[X-15,y0+hg]],'#e0f4ff');C2.globalAlpha=1;C2.fillStyle='rgba(255,255,255,.25)';C2.fillRect(X-1,y0,1.5,hg);}
    if(w.cl>0){const sh=hg*w.cl;GX.vg(X-15,y0,30,sh,['#f4e6c0','#c8b088']);C2.fillStyle='rgba(120,90,50,.45)';for(let yy=y0+3;yy<y0+sh;yy+=4)C2.fillRect(X-15,yy,30,1);GX.vg(X-15,y0+sh-2,30,2,['#8a6a40','#5a4020']);if(w.s===2&&w.cl<1){C2.fillStyle='rgba(255,80,80,.5)';C2.fillRect(X-15,y0+sh-1,30,1);}}
    GX.vg(X-18,y1+1,36,3,['#fff4e0','#b89878']);}}
  if(top>-60){GX.vg(28,top-8,264,8,['#8a7a6a','#4a3a2a']);GX.rr(120,top-12,80,4,1,'#8a8a98');const hx=160,hy=top-28,rot=Math.sin(A.t*.6)*30;GX.shadow(hx,top-10,26,3,.35);
   GX.ell(hx,hy,22,9,GX.lg(0,hy-9,0,hy+9,['#ff8a8a','#e03a3a','#8a1a1a']));GX.rr(hx+16,hy-3,26,4,2,'#c82a2a');GX.ell(hx-8,hy-2,10,6,GX.lg(hx-18,hy-8,hx,hy+4,['#e8f8ff','#7ab8e8']));GX.stroke([[hx-30+rot*.3,hy-12],[hx+30-rot*.3,hy-12]],'#1a1a1a',2);GX.rr(hx-1,hy-12,2,4,1,'#1a1a1a');GX.stroke([[hx-14,hy+9],[hx+14,hy+9]],'#1a1a1a',2);GX.disc(hx+42,hy-1,3,'rgba(30,30,30,.6)');}
  for(const q of pots){const X=cx(q.i),y=Y(q.r);if(q.st){GX.disc(X,Y(Math.floor(q.r)+.5),4,'#f1c7a3');if(A.t%10<5)ott('!',X,Y(Math.floor(q.r)+.5)-14,K.r,'c');}
   if(!q.st&&q.r>h+1){C2.globalAlpha=.3+.3*Math.min(1,1/(q.r-h));GX.ell(X,Y(h+1.1),7,2.2,'#000000');C2.globalAlpha=1;}
   GX.poly([[X-5,y-5],[X+5,y-5],[X+3,y+4],[X-3,y+4]],GX.lg(X-5,0,X+5,0,['#e08a5a','#c8643a','#8a3a1a']));GX.rr(X-6,y-6,12,2.5,1,'#d8784a');GX.orb(X-2,y-8,3,'#3a9a3a',0);GX.orb(X+2,y-9,3,'#4ab04a',0);GX.disc(X,y-11,1.5,'#ff4f9a');}
  for(const b of birds){const y=Y(b.r),fl=Math.sin(A.t*.5)*4,d=b.v>0?1:-1;GX.stroke([[b.x-8,y-fl],[b.x-2,y-1],[b.x,y]],'#1a1a2a',2);GX.stroke([[b.x,y],[b.x+2,y-1],[b.x+8,y-fl]],'#1a1a2a',2);GX.ell(b.x+d*2,y,4,2.2,'#3a3a4a');GX.poly([[b.x+d*6,y-1],[b.x+d*9,y],[b.x+d*6,y+1]],K.o);}
  if(!(inv&&inv%8<4)){const ph=Math.sin(h*18);A.person(x,Y(h)+2,{c:'#3a7aff',pants:'#2a2a4a',id:1,s:1.05,arm1:fall?-1.2:Math.PI-.25+ph*.35,arm2:fall?1.2:Math.PI+.25+ph*.35,st:fall?A.t*.6:h*9});}
  ef.draw();hud('SCORE '+g.score,'FLOOR '+Math.min(TOP,Math.floor(h)+1)+'/'+TOP,'LIVES '+lives);
  {const fq=cl(h/TOP,0,1);GX.rr(302,30,6,150,3,'rgba(0,0,0,.5)');if(fq>0)GX.rr(303,31+148*(1-fq),4,148*fq,2,GX.lg(0,30,0,180,['#3dff8b','#ffcf3f']));GX.disc(305,28,3,'#ff4f6d');}if(mt)banner(msg,msg.startsWith('FLOOR')||msg.startsWith('HELI')?K.y:K.r,26);};
return g;}});

/* ================= SCRAMBLE RUN ================= */
A.add({id:'scramble',name:'SCRAMBLE RUN',cat:'CLASSICS',warm:120,how:'ARROWS FLY. HOLD A TO FIRE, B DROPS BOMBS. BOMB FUEL TANKS. BLOW UP THE BASE.',make(){
 const g={over:null,score:0},ZL=1500,ZN=['HILLS','SAUCERS','METEORS','TOWERS','BASE'],ZC=[['#2f7a3a','#6ad05a'],['#8a5a2a','#e0a860'],['#4a4a6a','#a0a0c8'],['#2a2a48','#7a7ab8'],['#6a2a2a','#e05a5a']];
 const hs=n=>{const v=Math.sin(n*12.9898)*43758.5453;return v-Math.floor(v);};
 let wx=0,s={x:60,y:100},fuel=100,lives=3,inv=90,bl=[],bm=[],obj=[],air=[],loop=1,nextObj=260,msg='HILLS',mt=90,done=0,airT=0,lastZ=0;const ef=GX.fx();
 const zoneOf=w=>Math.floor(w/ZL)%5;
 const gz=(z,w)=>{if(z===0)return 192-22*Math.sin(w*.013)-12*Math.sin(w*.031+1);if(z===1)return 206-10*Math.sin(w*.02);if(z===2)return 212-6*Math.sin(w*.05);if(z===3){const b=Math.floor(w/32);return 214-(hs(b)<.55?24+hs(b+7)*70:0);}return 206;};
 const gnd=w=>{const z=zoneOf(w),f=w%ZL;let v=gz(z,w);if(f>ZL-80){const q=(f-(ZL-80))/80;v=v*(1-q)+gz((z+1)%5,w)*q;}return v;};
 const cei=w=>{if(zoneOf(w)!==3)return 14;const f=w%ZL,b=Math.floor(w/32),e=hs(b+3)<.45?16+hs(b+9)*44:0,ramp=Math.min(1,f/100,(ZL-f)/100);return Math.min(14+e*ramp,gnd(w)-74);};
 const crash=()=>{lives--;inv=130;S('boom');A.shake=10;ef.flash('#ff9838',10);ef.debris(s.x,s.y,'#dfe8ff',10,2.4);A.burst(s.x,s.y,K.o,24,3);if(lives<=0){g.over='SHOT DOWN OVER THE '+ZN[zoneOf(wx+s.x)];return;}const w=wx+s.x;s.y=(cei(w)+gnd(w))/2;fuel=Math.max(fuel,60);};
 const kill=(o,pts)=>{o.dead=1;g.score+=pts;S('boom');ef.ring(o.w-wx,o.y-6,o.k==='fuel'?'#ffcf3f':'#ff9838',o.k==='base'?50:20,16);ef.debris(o.w-wx,o.y-6,o.k==='fuel'?'#ffcf3f':'#c8c8d8',o.k==='base'?16:6,2);if(o.k==='base')ef.flash('#ffffff',14);A.burst(o.w-wx,o.y-6,o.k==='fuel'?K.y:K.o,14,2.2);if(o.k==='fuel'){fuel=Math.min(100,fuel+22);}};
 g.update=()=>{if(mt)mt--;if(inv)inv--;if(done){done--;if(done===0)g.over='BASE DESTROYED! WIN';wx+=1;return;}
  const sp=1.5+loop*.25;wx+=sp;const z=zoneOf(wx+s.x);if(z!==lastZ){lastZ=z;msg=ZN[z];mt=80;S('blip');if(z===0){loop++;msg='LOOP '+loop;}}
  fuel-=.05+loop*.008;if(fuel<=0){fuel=0;crash();if(g.over)return;}
  const k=A.in(0);s.x=cl(s.x+ax(k)*2.2,16,200);s.y+=ay(k)*2.2;const w=wx+s.x;s.y=cl(s.y,20,H-6);
  if(!inv&&(s.y>gnd(w)-4||s.y<cei(w)+4)){crash();if(g.over)return;}else if(inv){s.y=cl(s.y,cei(w)+6,gnd(w)-6);}
  if(A.fire(8)){bl.push({x:s.x+10,y:s.y});S('shoot');}if(A.hit(0).b&&bm.length<2){bm.push({x:s.x,y:s.y+5,vx:1.2,vy:.5});S('blip');}
  while(nextObj<wx+W+30){const oz=zoneOf(nextObj),r=Math.random();let kk=r<.5?'rock':r<.8?'fuel':'myst';if(oz===1||oz===2)kk=r<.5?'fuel':r<.75?'rock':'myst';
   const f=nextObj%ZL;if(oz===4&&f>ZL-360&&f<ZL-250&&!obj.some(o=>o.k==='base')){kk='base';}
   obj.push({k:kk,w:nextObj,y:gnd(nextObj),hp:kk==='base'?4:1,vy:0,fly:0});nextObj+=kk==='base'?140:44+rnd(56);}
  if(++airT>(z===2?22:48)&&(z===1||z===2)){airT=0;const cy=cei(wx+W),gy=gnd(wx+W);air.push({k:z===1?'ufo':'met',x:W+12,y:cy+20+rnd(gy-cy-50),by:0,t:0,vx:z===1?-1.2:-(3.2+rnd(1.6))});}
  for(const o of obj){const sx=o.w-wx;if(o.k==='rock'&&!o.fly&&sx<s.x+130&&sx>s.x-10&&Math.random()<.025+loop*.005)o.fly=1;if(o.fly){o.vy=Math.max(-3.2,o.vy-.06);o.y+=o.vy;}
   if(!inv&&Math.abs(sx-s.x)<9&&s.y>o.y-(o.k==='base'?22:16)&&s.y<o.y+2){o.dead=1;crash();if(g.over)return;}}
  for(const a of air){a.t++;a.x+=a.vx;if(a.k==='ufo'){a.y+=Math.sin(a.t*.06)*1.2;}if(!inv&&Math.hypot(a.x-s.x,a.y-s.y)<(a.k==='met'?10:9)){a.dead=1;crash();if(g.over)return;}}
  for(const b of bl){b.x+=6;const bw=wx+b.x;if(b.y>gnd(bw)||b.y<cei(bw))b.dead=1;
   for(const o of obj)if(!o.dead&&!b.dead&&Math.abs(o.w-wx-b.x)<7&&b.y>o.y-(o.k==='base'?22:15)&&b.y<o.y+2){b.dead=1;if(--o.hp<=0)kill(o,o.k==='base'?1000:o.k==='fuel'?150:o.k==='myst'?100*(1+ri(3)):o.fly?80:50);else{S('hit');A.burst(b.x,b.y,K.w,4,1);}}
   for(const a of air)if(!a.dead&&!b.dead&&Math.hypot(a.x-b.x,a.y-b.y)<9){b.dead=1;if(a.k==='ufo'){a.dead=1;g.score+=100;S('boom');A.burst(a.x,a.y,K.p,14,2);}else A.burst(b.x,b.y,'#c8a080',4,1);}}
  for(const b of bm){b.x+=b.vx;b.vx=Math.max(0,b.vx-.02);b.y+=b.vy;b.vy+=.14;const bw=wx+b.x;
   if(b.y>=gnd(bw)){b.dead=1;S('boom');A.burst(b.x,b.y,K.o,16,2.4);A.shake=3;for(const o of obj)if(!o.dead&&Math.abs(o.w-wx-b.x)<16&&Math.abs(o.y-b.y)<24){if(o.k==='base'){o.hp-=2;if(o.hp<=0)kill(o,1000);}else kill(o,o.k==='fuel'?150:o.k==='myst'?300:100);}}
   else for(const o of obj)if(!o.dead&&Math.abs(o.w-wx-b.x)<8&&b.y>o.y-16&&b.y<o.y){b.dead=1;kill(o,o.k==='fuel'?150:100);S('boom');}}
  if(obj.some(o=>o.dead&&o.k==='base')&&!done){done=120;g.score+=500*lives;msg='BASE DESTROYED!';mt=120;A.confetti();S('win');}
  bl=bl.filter(b=>!b.dead&&b.x<W+6);bm=bm.filter(b=>!b.dead&&b.x<W);obj=obj.filter(o=>!o.dead&&o.w-wx>-30&&o.y>-20);air=air.filter(a=>!a.dead&&a.x>-20);if(A.t%30===0)g.score+=2;};
 g.draw=()=>{const c=A.c;GX.cache('scramble_sky',()=>{GX.sky(['#02010a','#0c0828','#24124a']);GX.glow(250,60,90,'#7a3aff',.18);GX.glow(70,140,80,'#ff3a8a',.10);});GX.stars(70,4,wx*.6,0,200,.9);
  const zz=zoneOf(wx+160);GX.hills(206,70,['#1a1240','#2a1a28','#1a1a30','#120e2a','#2a1018'][zz],wx*.25,.012,3);GX.hills(212,40,['#22183e','#3a2420','#24243a','#1a1638','#3a1620'][zz],wx*.45,.02,7);
  const GG=[],CG=[];for(let x=0;x<W;x+=4){const w=wx+x,z=zoneOf(w),gy=gnd(w),cy=cei(w);c.fillStyle=GG[z]||(GG[z]=GX.lg(0,150,0,H,[ZC[z][0],GX.lt(ZC[z][0],.35)]));c.fillRect(x,gy,4,H-gy);c.fillStyle=ZC[z][1];c.fillRect(x,gy,4,2);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(x,gy,4,.8);
   if((Math.floor(w/4)*7)%11===0){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+1,gy+6+(Math.floor(w/4)%5)*4,2,2);}
   if(z===3&&gy<200&&Math.floor(w/4)%3===0)for(let yy=gy+8;yy<H-8;yy+=10){c.fillStyle=(Math.floor(w/8)+yy)%3?'#ffcf3f':'#3a3a5a';c.fillRect(x+1,yy,2,3);}
   if(cy>15){c.fillStyle=CG[z]||(CG[z]=GX.lg(0,14,0,90,[GX.lt(ZC[z][0],.35),ZC[z][0]]));c.fillRect(x,14,4,cy-14);c.fillStyle=ZC[z][1];c.fillRect(x,cy-2,4,2);}}
  for(const o of obj){const x=o.w-wx,y=o.y;if(x<-40||x>W+40)continue;
   if(o.k==='rock'){if(o.fly){GX.poly([[x-2.5,y],[x+2.5,y],[x,y+7+rnd(6)]],'#ffcf3f');if(lo())GX.glow(x,y+3,8,'#ff9838',.6);}GX.rr(x-2.5,y-15,6,13,2,GX.lg(x-3,0,x+3,0,['#ffffff','#c8c8d8','#7a7a8a']));GX.poly([[x-2.5,y-14],[x+3.5,y-14],[x+.5,y-20]],'#ff4f6d');GX.poly([[x-2.5,y-5],[x-6,y],[x-2.5,y-1]],'#d83a4a');GX.poly([[x+3.5,y-5],[x+7,y],[x+3.5,y-1]],'#d83a4a');GX.disc(x+.5,y-10,1.2,'#4dabff');}
   else if(o.k==='fuel'){GX.shadow(x,y,10,2,.4);GX.rr(x-9,y-14,18,14,3,GX.lg(x-9,0,x+9,0,['#a87a10','#ffe070','#ffcf3f','#a87a10']));GX.ell(x,y-14,9,2.5,'#fff0a0');ott('FUEL',x,y-9,'#5a3a00','c');}
   else if(o.k==='myst'){GX.block(x-7,y-13,14,13,'#ff4f9a',3);ott('?',x,y-10,'#ffffff','c');}
   else{GX.shadow(x,y,26,3,.45);GX.rr(x-22,y-14,44,14,3,GX.lg(0,y-14,0,y,['#a85050','#7a3a3a','#4a1a1a']));GX.disc(x,y-14,12,GX.rg(x-4,y-20,1,x,y-14,12,['#ff9a9a','#c85a5a','#6a2020']));GX.rr(x-1,y-34,2,10,1,'#c8c8d8');if(A.t%20<10){GX.disc(x,y-35,2,K.r);if(lo())GX.glow(x,y-35,9,'#ff4f6d',.7);}
    GX.rr(x-18,y-8,6,4,1,K.y);GX.rr(x+12,y-8,6,4,1,K.y);for(let i=0;i<o.hp;i++)GX.disc(x-6+i*4,y-4,1.3,'#3dff8b');if(A.t%30<15)ott('TARGET',x,y-48,K.r,'c');}}
  for(const a of air){if(a.k==='ufo'){if(lo())GX.glow(a.x,a.y,16,'#ff4f9a',.3);GX.ell(a.x,a.y,11,4,GX.lg(0,a.y-4,0,a.y+4,['#ffb0d8','#ff4f9a','#8a1a4a']));GX.ell(a.x,a.y-3,5,4,GX.lg(0,a.y-7,0,a.y,['#e8f8ff','#7ab8e8']));GX.disc(a.x-7,a.y+1,1.2,A.t%10<5?K.y:'#ffffff');GX.disc(a.x+7,a.y+1,1.2,A.t%10<5?'#ffffff':K.y);}
   else{c.globalAlpha=.6;GX.poly([[a.x,a.y-5],[a.x+28,a.y-1],[a.x+28,a.y+1],[a.x,a.y+5]],GX.lg(a.x,0,a.x+28,0,['#ffcf3f','rgba(255,90,40,0)']));c.globalAlpha=1;GX.orb(a.x,a.y,6,'#8a6a4a',0);GX.disc(a.x-2,a.y-2,1.6,'#5a3a2a');GX.disc(a.x+2,a.y+1.5,1.1,'#5a3a2a');}}
  bl.forEach(b=>{GX.stroke([[b.x-4,b.y],[b.x+5,b.y]],'rgba(47,214,195,.45)',3);GX.stroke([[b.x-2,b.y],[b.x+5,b.y]],'#c8fff6',1.2);});
  bm.forEach(b=>{GX.orb(b.x,b.y,3,'#e8e8f0');GX.rr(b.x-1,b.y-6,2,3,1,K.r);});
  if(!(inv&&inv%8<4)){const x=s.x,y=s.y,fl=4+rnd(6);if(lo())GX.glow(x-10,y,10,'#ff9838',.6);GX.poly([[x-8,y-2.5],[x-12-fl,y],[x-8,y+2.5]],GX.lg(x-12-fl,0,x-8,0,['rgba(255,90,40,0)','#ffcf3f']));
   GX.poly([[x+14,y+1],[x-8,y-5],[x-5,y+1],[x-8,y+6]],GX.lg(0,y-5,0,y+6,['#ffffff','#c8d8f0','#6a7aa8']));GX.poly([[x-8,y-5],[x-3,y-10],[x,y-4]],'#4dabff');GX.poly([[x-7,y+5],[x-2,y+8],[x,y+3]],'#2a6ad8');GX.ell(x+3,y-2,4,1.8,GX.lg(x,y-4,x+6,y,['#e8f8ff','#4dabff']));}
  ef.draw();hud('SCORE '+g.score,'','LIVES '+lives);GX.ot('FUEL',62,5,K.w,1);GX.meter(80,4,58,7,fuel/100,fuel<25?(A.t%20<10?'#ff4f6d':'#ffcf3f'):'#3dff8b');
  const zq=zoneOf(wx+s.x);for(let i=0;i<5;i++)GX.rr(150+i*24,4,22,7,2,i<zq?'#4a4a6a':i===zq?ZC[i][1]:'#1a1a2a');GX.rr(150+zq*24+((wx+s.x)%ZL)/ZL*22-1,2,2,11,1,K.w);if(mt)banner(msg,K.y,108);};
return g;}});

/* ================= CORRIDOR FIGHTER ================= */
A.add({id:'kungfu',name:'CORRIDOR FIGHTER',cat:'CLASSICS',warm:120,time:240,how:'A PUNCHES, B KICKS, UP JUMPS, DOWN DUCKS. SHAKE OFF GRABBERS. BEAT 5 FLOORS.',make(){
 const g={over:null,score:0},LEN=960,GY=206,FC=[['#7a2a1a','#3a120a'],['#1a4a3a','#0a2018'],['#3a2a6a','#140a2a'],['#6a5a1a','#2a200a'],['#6a1a3a','#2a0a18']];
 let fl=0,dir=-1,p,ens=[],kn=[],camX=0,lives=3,msg='',mt=0,spT=60,boss=null,bossDone=false,eid=0,clearT=0,hs=0;const ef=GX.fx();
 const goal=()=>dir<0?24:LEN-24;
 const gen=()=>{fl++;dir=fl%2?-1:1;p={x:dir<0?LEN-40:40,jh:0,vj:0,duck:0,f:dir,atk:0,ak:'p',hp:100,grab:0,shk:0,st:0,hurt:0,hitDone:0};ens=[];kn=[];boss=null;bossDone=false;spT=80;msg='FLOOR '+fl;mt=90;clearT=0;};
 const hurt=(n,why)=>{if(p.hurt)return;p.hp-=n;p.hurt=40;S('hit');A.shake=4;ef.flash('#ff4f6d',6);A.burst(p.x-camX,GY-22,K.r,8,1.5);if(p.hp<=0){lives--;S('lose');A.shake=8;if(lives<=0){g.over='DEFEATED ON FLOOR '+fl;return;}p.hp=100;p.grab=0;ens=[];kn=[];msg=why||'GET UP!';mt=70;p.hurt=120;}};
 gen();
 g.update=()=>{if(mt)mt--;if(clearT){clearT--;if(clearT===0){if(fl>=5){g.over='TEMPLE CLEARED! VICTORY';return;}gen();}return;}if(hs>0){hs--;return;}
  const k=A.in(0),h=A.hit(0);if(p.atk)p.atk--;if(p.hurt)p.hurt--;
  if(p.grab>0){p.duck=0;if(h.l||h.r){p.shk++;S('blip');}p.hp-=.12*p.grab;if(p.hp<=0){p.hp=1;hurt(5,'SQUEEZED!');if(g.over)return;}
   if(p.shk>=6){ens.forEach(e=>{if(e.grab){e.grab=0;e.dead=1;g.score+=50;A.burst(e.x-camX,GY-20,'#b85aff',10,2);}});p.grab=0;p.shk=0;S('hit');A.shake=4;}}
  else{p.duck=k.d&&!p.jh?1:0;const dx=ax(k);if(dx&&!p.duck&&!p.atk){p.f=dx;p.x=cl(p.x+dx*1.55,10,LEN-10);p.st+=.25;}else if(dx&&p.atk)p.f=dx;
   if(h.u&&!p.jh&&!p.duck){p.vj=4.2;S('jump');}if((h.a||h.b)&&!p.atk){p.atk=h.b?16:11;p.ak=h.b?'k':'p';p.hitDone=0;S('blip');}}
  if(p.jh>0||p.vj>0){p.jh+=p.vj;p.vj-=.24;if(p.jh<=0){p.jh=0;p.vj=0;}}
  if(p.atk&&!p.hitDone&&p.atk<=(p.ak==='k'?11:7)){p.hitDone=1;const reach=p.ak==='k'?32:24;
   for(const e of ens){const d=(e.x-p.x)*p.f;if(!e.dead&&!e.grab&&d>-4&&d<reach){e.hp--;e.x+=p.f*10;hs=3;ef.spark(e.x-camX-p.f*4,GY-(p.duck?8:22),'#fff2a0',9,2.4);ef.ring(e.x-camX-p.f*4,GY-(p.duck?8:22),'#ffffff',12,8);A.burst(e.x-camX,GY-(p.duck?8:22),K.w,6,1.4);if(e.hp<=0){e.dead=1;g.score+=(p.jh?150:p.ak==='k'?50:100);S('boom');}else S('hit');}}
   for(const q of kn){const d=(q.x-p.x)*p.f;if(d>-4&&d<reach&&(q.low?p.duck||p.ak==='k':!p.duck)){q.dead=1;g.score+=30;S('hit');A.burst(q.x-camX,q.y,'#c8c8d8',5,1);}}
   if(boss&&!boss.dead){const d=(boss.x-p.x)*p.f;if(d>-4&&d<reach+4){if(!boss.atk&&Math.random()<.3){S('blip');A.burst(boss.x-camX-p.f*8,GY-26,K.y,5,1);}else{boss.hp--;boss.x+=p.f*6;boss.stun=14;hs=4;ef.spark(boss.x-camX-p.f*6,GY-26,'#ffcf3f',12,2.6);ef.ring(boss.x-camX-p.f*6,GY-26,'#ffffff',16,10);S('hit');A.burst(boss.x-camX,GY-26,K.r,10,1.8);if(boss.hp<=0){boss.dead=1;bossDone=true;g.score+=1500;S('boom');A.shake=8;msg='THE STAIRS ARE OPEN';mt=80;}}}}}
  const near=Math.abs(p.x-goal())<300;
  if(!boss&&near){boss={x:goal()-dir*20,hp:6+fl*2,max:6+fl*2,atk:0,cd:60,stun:0,low:0,st:0};msg='GUARDIAN!';mt=60;}
  if(--spT<=0&&!near){const n=ens.length;if(n<2+fl){const ahead=Math.random()<.65,side=ahead?dir:-dir,ex=side>0?camX+W+12:camX-12,kk=Math.random()<.25+fl*.05?'k':'g';if(ex>0&&ex<LEN)ens.push({x:ex,k:kk,hp:kk==='k'?2:1,cd:50,aim:0,low:0,grab:0,st:0,id:eid++,dead:0});}spT=Math.max(30,85-fl*9)+ri(40);}
  for(const e of ens){if(e.dead)continue;const dx=p.x-e.x,f=dx>=0?1:-1;e.f=f;
   if(e.k==='g'){if(e.grab){e.x=p.x-f*8;continue;}if(Math.abs(dx)>8){e.x+=f*(1+fl*.1);e.st+=.3;}else if(p.jh<6&&!p.hurt){e.grab=1;p.grab++;S('hit');}}
   else{if(e.aim){if(--e.aim===0){kn.push({x:e.x+f*8,y:e.low?GY-7:GY-25,low:e.low,vx:f*(2.2+fl*.2)});S('shoot');e.cd=Math.max(45,95-fl*8)+ri(30);}}
    else{const want=70+(e.id%3)*18;if(Math.abs(dx)>want){e.x+=f*.9;e.st+=.25;}else if(Math.abs(dx)<want-30)e.x-=f*.6;if(--e.cd<=0){e.aim=22;e.low=Math.random()<.5?1:0;}}}}
  ens=ens.filter(e=>!e.dead&&Math.abs(e.x-p.x)<420);
  for(const q of kn){q.x+=q.vx;if(Math.abs(q.x-p.x)<6){const dodge=q.low?p.jh>7:p.duck;if(!dodge){q.dead=1;hurt(12,'KNIFED!');if(g.over)return;}}}kn=kn.filter(q=>!q.dead&&Math.abs(q.x-p.x)<340);
  if(boss&&!boss.dead){const b=boss,dx=p.x-b.x,f=dx>=0?1:-1;b.f=f;if(b.stun)b.stun--;else if(b.atk){if(--b.atk===0){if(Math.abs(dx)<40){const dodge=b.low?p.jh>7:p.duck;if(!dodge){hurt(15,'STAFF STRIKE!');if(g.over)return;}else g.score+=20;}b.cd=Math.max(40,80-fl*6)+ri(30);}}
   else{if(Math.abs(dx)>28){b.x+=f*(.7+fl*.08);b.st+=.2;}if(--b.cd<=0&&Math.abs(dx)<46){b.atk=24;b.low=Math.random()<.5?1:0;}}}
  if(bossDone&&Math.abs(p.x-goal())<12){g.score+=1000+Math.round(p.hp)*10;S('win');A.confetti();msg='FLOOR '+fl+' CLEAR!';mt=90;clearT=100;}
  if(!bossDone)p.x=dir<0?Math.max(p.x,goal()+26):Math.min(p.x,goal()-26);
  camX+=(cl(p.x-160,0,LEN-W)-camX)*.2;};
 const fighter=(x,y,o,kick,f)=>{A.person(x,y,o);if(kick){const s=o.s||1;R(f>0?x+2*s:x-20*s,y-14*s,18*s,4*s,o.pants);R(f>0?x+18*s:x-22*s,y-15*s,4*s,5*s,'#161616');}};
 g.draw=()=>{const fc=FC[(fl-1)%5],c=A.c;vg(GX.lt(fc[0],1.25),fc[1],14,GY);const ox=Math.round(camX);
  for(let px=-(ox*.5%120)-20;px<W+120;px+=120){c.fillStyle='rgba(0,0,0,.16)';c.fillRect(px,40,70,GY-60);GX.rr(px+8,52,54,80,4,'rgba(255,220,150,.07)');c.fillStyle='rgba(255,220,150,.06)';c.fillRect(px+34,52,2,80);c.fillRect(px+8,90,54,2);}
  for(let px=-(ox%80);px<W+80;px+=80){GX.hg(px-9,34,18,GY-34,[GX.lt(fc[0],.45),GX.lt(fc[0],.95),GX.lt(fc[0],.4)]);GX.vg(px-12,30,24,6,['#ffe08a','#a8782a']);GX.vg(px-12,GY-9,24,9,['#ffe08a','#a8782a']);c.fillStyle='rgba(255,230,160,.18)';c.fillRect(px-5,36,2,GY-46);}
  for(let lx=-(ox%160)+80;lx<W+160;lx+=160){GX.stroke([[lx,14],[lx,34]],'#1a1a1a',1);if(lo())GX.glow(lx,44,30,'#ffb040',.35);GX.ell(lx,44,8,11,GX.rg(lx-3,40,1,lx,44,11,['#ffd070','#ff5a2a','#a0201a']));GX.rr(lx-7,33,14,3,1,'#e8b850');GX.rr(lx-7,53,14,3,1,'#e8b850');GX.stroke([[lx,56],[lx,62]],'#e8b850',1);}
  for(let x=-(ox%16);x<W;x+=16){GX.rr(x,18,8,2.5,1,'#e8b850');GX.rr(x+8,21,8,2.5,1,'#c89a40');}
  GX.vg(0,GY,W,H-GY,['#6a4630','#2a160c']);for(let y=GY+6,i=0;y<H;y+=6+i*2,i++){c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,y,W,1);}for(let x=-(ox%40);x<W;x+=40)GX.stroke([[x,GY],[x+(x-160)*.4,H]],'rgba(0,0,0,.22)',1);
  c.fillStyle='rgba(255,220,150,.10)';c.fillRect(0,GY,W,2);
const gx=goal()-ox;if(gx>-80&&gx<W+80){R(gx-16,GY-74,32,74,bossDone?'#140a06':'#3a1a0a');R(gx-18,GY-76,36,4,'#c8a040');for(let i=0;i<7;i++){const w=34-i*4;R(dir<0?gx-17:gx+17-w,GY-(i+1)*9,w,9,i%2?'#8a6a4a':'#9a7a5a');}if(!bossDone){for(let i=0;i<4;i++)R(gx-14+i*8,GY-74,3,74,'#6a6a78');}T(bossDone?'UP!':'LOCKED',gx,GY-86,bossDone?(A.t%20<10?K.g:K.y):K.r,1,'c');}
  for(const e of ens){const x=e.x-ox,o={c:e.k==='g'?'#8a3ad8':'#d87a2a',pants:'#2a2a3a',id:e.id,st:e.st,d:e.f,s:1.1,arm1:e.grab?-1.5*e.f:undefined,arm2:e.grab?-1.5*e.f:e.aim?-2.6*e.f:undefined};
   if(e.k==='k'&&e.aim&&e.low)squash(x,GY,.65,()=>A.person(0,0,o));else A.person(x,GY,o);}
  if(boss&&!boss.dead){const b=boss,x=b.x-ox,up=b.atk&&b.atk>10;A.person(x,GY,{c:'#1a1a1a',pants:'#3a0a0a',hair:'#e8e0d0',id:5,st:b.st,d:b.f,s:1.35,arm2:b.atk?(up?-2.8:-1.4)*b.f:-.5*b.f});
   const hx=x+b.f*6,hy=GY-24;if(b.atk)L(hx,hy,hx+b.f*(up?10:38),b.low?GY-6:(up?GY-60:GY-30),'#c8a060',3);else L(hx,hy-14,hx+b.f*4,hy+18,'#c8a060',3);
   GX.meter(x-20,GY-64,40,5,b.hp/b.max,'#ff4f6d');}
  if(!(p.hurt&&p.hurt%8<4)){const x=p.x-ox,y=GY-p.jh,pun=p.atk&&p.ak==='p'&&p.atk>3,kick=p.atk&&p.ak==='k'&&p.atk>3;const o={c:'#f4f0e0',pants:'#f4f0e0',hair:'#1a1a1a',id:0,s:1.1,d:p.f,st:p.grab?A.t*.8:p.st,arm2:pun?-1.57*p.f:undefined,arm1:p.grab?-2.4*p.f:undefined};
   if(p.duck)squash(x,y,.62,()=>fighter(0,0,o,kick,p.f));else fighter(x,y,o,kick,p.f);R(x-5,y-15*(p.duck?.62:1),10,2,'#1a1a1a');}
  kn.forEach(q=>{const x=q.x-camX;GX.stroke([[x-q.vx*3,q.y],[x,q.y]],'rgba(220,220,255,.35)',2);R(x-5,q.y-1,10,2,'#d8d8e8');R(q.vx>0?x-7:x+5,q.y-2,3,4,'#6a3a1a');});
  ef.draw();hud('SCORE '+g.score,'FLOOR '+fl+'/5 '+(dir<0?'<<<':'>>>'),'LIVES '+lives);GX.meter(6,19,70,6,Math.max(0,p.hp)/100,p.hp>30?'#3dff8b':'#ff4f6d');
  if(p.grab&&A.t%20<14)banner('SHAKE LEFT/RIGHT!',K.r,40);else if(mt)banner(msg,K.y,40);};
 return g;}});

/* ================= BASKET BOWMAN ================= */
A.add({id:'bowman',name:'BASKET BOWMAN',cat:'CLASSICS',warm:120,time:240,how:'UP/DOWN RIDE THE LIFT. A SHOOTS BALLOONS, B THROWS BAIT. STOP THE CLIMBERS.',make(){
 const g={over:null,score:0},GY=222,BX=44,LX=80,BC=[K.r,K.y,K.c,K.p,K.o,K.g];
 let lvl=0,lives=3,by=120,ar=[],wv=[],rocks=[],bait=null,baits=1,toRel=0,relT=0,msg='',mt=0,inv=0,t=0,draw=0;const ef=GX.fx();
 const gen=()=>{lvl++;wv=[];ar=[];rocks=[];bait=null;baits=1;toRel=18+lvl*4;relT=60;msg='ROUND '+lvl;mt=90;};
 const lose=why=>{lives--;S('lose');A.shake=8;ef.flash('#ff4f6d',8);msg=why;mt=80;inv=120;rocks=[];wv.forEach(w=>{if(w.st==='climb'||w.st==='walk')w.dead=1;});if(lives<=0)g.over='THE WOLVES WON ROUND '+lvl;};
 gen();
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;if(draw)draw--;const k=A.in(0),h=A.hit(0);by=cl(by+ay(k)*1.7,56,206);
  if(A.fire(18)&&ar.filter(a=>!a.dead).length<3){ar.push({x:BX+10,y:by-16,vx:4.6,vy:-.1,hit:0});draw=10;S('shoot');}
  if(h.b&&baits>0&&!bait){baits--;bait={x:BX+12,y:by-12,vx:1.3,vy:-.4};S('blip');}
  if(--relT<=0&&toRel>0){toRel--;relT=Math.max(36,100-lvl*12)+ri(50);wv.push({x:256,y:44,vx:-(.3+rnd(.35)+lvl*.05),vy:.28+rnd(.2)+lvl*.04,st:'float',bal:BC[ri(6)],t:ri(99),dead:0});}
  for(const w of wv){w.t++;if(w.st==='float'){w.x=Math.max(100,w.x+w.vx);w.y+=w.vy+Math.sin(w.t*.05)*.2;if(w.y>=GY){w.y=GY;w.st='walk';}
    if(w.x<250&&Math.abs(w.y-by)<50&&Math.random()<.0025+lvl*.001){rocks.push({x:w.x-6,y:w.y-6,vx:-2.1,vy:-(by<w.y?1.4:.2)});}}
   else if(w.st==='fall'){w.vy+=.22;w.y+=w.vy;if(w.y>=GY){w.dead=1;A.burst(w.x,GY-4,'#8a8a9a',10,1.6);S('hit');}}
   else if(w.st==='walk'){w.x-=.7+lvl*.06;if(w.x<=LX+4){w.x=LX+4;w.st='climb';}}
   else if(w.st==='climb'){w.y-=.28+lvl*.05;if(w.y<=40){lose('A WOLF REACHED THE TOP!');if(g.over)return;break;}}}
  for(const a of ar){if(a.dead)continue;a.x+=a.vx;a.vy+=.015;a.y+=a.vy;
   for(const w of wv){if(w.dead)continue;if(w.st==='float'&&Math.hypot(a.x-w.x,a.y-(w.y-20))<8){w.st='fall';w.vy=0;a.hit++;ef.ring(w.x,w.y-20,w.bal,16,12);ef.debris(w.x,w.y-20,w.bal,6,1.6);const pts=50*(1<<Math.min(3,a.hit-1));g.score+=pts;S('score');A.burst(w.x,w.y-20,w.bal,10,1.6);if(a.hit>1){msg=a.hit+' IN ONE SHOT!';mt=40;}}
    else if((w.st==='float'||w.st==='fall')&&Math.abs(a.x-w.x)<6&&Math.abs(a.y-(w.y-5))<6){a.dead=1;a.bounce=1;A.burst(a.x,a.y,'#c8c8c8',3,1);break;}
    else if((w.st==='climb'||w.st==='walk')&&Math.abs(a.x-w.x)<7&&Math.abs(a.y-(w.y-6))<8){w.dead=1;a.dead=1;g.score+=100;S('boom');A.burst(w.x,w.y-6,'#8a8a9a',12,2);break;}}
   if(a.x>W||a.y>GY)a.dead=1;}
  ar=ar.filter(a=>!a.dead);
  if(bait){bait.x+=bait.vx;bait.vy+=.08;bait.y+=bait.vy;for(const w of wv)if(!w.dead&&w.st!=='fall'&&Math.hypot(bait.x-w.x,bait.y-(w.y-8))<18){w.st='fall';w.vy=0;g.score+=100;S('score');A.burst(w.x,w.y-10,K.r,8,1.5);}if(bait.y>GY||bait.x>W)bait=null;}
  for(const r of rocks){r.x+=r.vx;r.vy+=.05;r.y+=r.vy;if(!inv&&Math.abs(r.x-BX)<12&&r.y>by-26&&r.y<by){r.dead=1;lose('HIT BY A ROCK!');if(g.over)return;}if(r.x<20||r.y>GY)r.dead=1;}rocks=rocks.filter(r=>!r.dead);
  wv=wv.filter(w=>!w.dead);
  if(toRel<=0&&!wv.length){g.score+=500*lvl;S('win');A.confetti();if(lvl>=4){g.over='WOLVES ROUTED! WIN';return;}gen();}};
 const wolf=(x,y,st,t)=>{const leg=st==='walk'||st==='climb'?Math.sin(t*.3)*2:0;R(x-5,y-3,2,3+leg,'#6a6a7a');R(x+3,y-3,2,3-leg,'#6a6a7a');ell(x,y-7,6,5,'#8a8a9a');C(x-5,y-13,4.5,'#9a9aaa');P([[x-9,y-14],[x-14,y-12],[x-9,y-11]],'#9a9aaa',1);R(x-14,y-13,2,2,'#1a1a1a');
  P([[x-7,y-17],[x-6,y-22],[x-4,y-17]],'#6a6a7a',1);P([[x-4,y-17],[x-2,y-21],[x-1,y-16]],'#6a6a7a',1);R(x-7,y-15,2,2,K.y);P([[x+5,y-9],[x+11,y-12-leg],[x+6,y-6]],'#8a8a9a',1);};
 g.draw=()=>{const c=A.c;GX.cache('bowman_bg',()=>{const c=A.c;GX.sky(['#2a6ad8','#7ab8f0','#d8f0ff']);GX.glow(200,40,70,'#fff6d0',.4);GX.hills(GY,46,'#8ac0a0',0,.015,2);GX.hills(GY+6,30,'#6aa870',90,.022,5);
   GX.vg(0,GY,W,H-GY,['#5aa848','#2a6a28']);c.fillStyle='#8ae070';c.fillRect(0,GY,W,2);
   GX.hg(250,46,70,GY-46,['#5a3a22','#8a6a44','#6a4a2c']);for(let y=60;y<GY;y+=18){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(256+(y*7)%40,y,14,3);c.fillStyle='rgba(255,230,180,.15)';c.fillRect(256+(y*7)%40,y-1,14,1);}GX.vg(248,42,72,7,['#8ae070','#4a9a3a']);
   GX.hg(0,14,32,H-14,['#6a4a2c','#9a7a50','#7a5a38']);for(let y=24;y<GY;y+=16){c.fillStyle='rgba(0,0,0,.2)';c.fillRect(4+(y*5)%18,y,10,3);}GX.vg(0,14,34,5,['#8ae070','#4a9a3a']);});
  for(let i=0;i<4;i++){const cx=((i*97+t*.15)%(W+80))-40,cy=40+i*22;c.globalAlpha=.9;GX.ell(cx,cy,22,7,'#ffffff');GX.ell(cx+14,cy-4,14,6,'#ffffff');GX.ell(cx-8,cy+2,12,5,'#e8f2ff');c.globalAlpha=1;}
  A.person(290,46,{c:'#8a8a9a',pants:'#6a6a7a',id:4,s:.9,d:-1,arm1:-1+Math.sin(t*.2)*.5});
  if(toRel>0){const bc=BC[toRel%6],r=4+Math.min(4,(90-relT)/12);GX.orb(272,20,Math.max(2,r),bc);GX.stroke([[272,20+r],[275,40]],'#ffffff',.7);}
R(26,18,30,5,'#6a4a2a');C(BX,24,4,'#c8c8c8');L(BX,24,BX,by-24,'#d8c8a0');
  L(LX-4,34,LX-4,GY,'#8a5a2a',2);L(LX+4,34,LX+4,GY,'#8a5a2a',2);for(let y=40;y<GY;y+=8)L(LX-4,y,LX+4,y,'#8a5a2a');
  for(const w of wv){if(w.st==='float'){GX.stroke([[w.x,w.y-11],[w.x,w.y-14]],'#ffffff',.8);GX.orb(w.x,w.y-20,7,w.bal);GX.poly([[w.x-1.5,w.y-12.5],[w.x+1.5,w.y-12.5],[w.x,w.y-14]],w.bal);}wolf(w.x,w.y,w.st,w.t);}
  A.person(BX,by-6,{c:'#ff4f6d',pants:'#2a3a6a',cap:'#3a8a3a',id:2,s:.72,d:1,arm2:-1.57,arm1:draw?-1.2:-1.4});
  const bw=draw?3:6;A.c.strokeStyle='#8a4a1a';A.c.lineWidth=1.5;A.c.beginPath();A.c.arc(BX+8,by-16,8,-1.2,1.2);A.c.stroke();L(BX+8+Math.cos(-1.2)*8,by-16+Math.sin(-1.2)*8,BX+8-bw+6,by-16,'#ffffff');L(BX+8-bw+6,by-16,BX+8+Math.cos(1.2)*8,by-16+Math.sin(1.2)*8,'#ffffff');
  R(BX-12,by-12,24,12,'#c8a060');for(let i=0;i<5;i++)R(BX-11+i*5,by-11,2,10,'#a07a3a');R(BX-12,by-13,24,2,'#8a5a2a');L(BX-12,by-12,BX,by-24,'#d8c8a0');L(BX+12,by-12,BX,by-24,'#d8c8a0');
  ar.forEach(a=>{L(a.x-8,a.y,a.x,a.y,'#6a3a1a',1.5);P([[a.x,a.y-2],[a.x+4,a.y],[a.x,a.y+2]],'#c8c8d8',1);R(a.x-9,a.y-1,2,2,K.r);});
  rocks.forEach(r=>C(r.x,r.y,3,'#6a6a6a'));if(bait){ell(bait.x,bait.y,6,4,'#c8403a');R(bait.x+4,bait.y-1,4,2,'#f0e0d0');}
  ef.draw();hud('SCORE '+g.score,'ROUND '+lvl+'/4  WOLVES '+(toRel+wv.length)+'  BAIT '+baits,'LIVES '+lives);if(mt)banner(msg,msg.startsWith('ROUND')||msg.includes('ONE SHOT')?K.y:K.r,110);};
 return g;}});

/* ================= CIRCUS SEESAW ================= */
A.add({id:'seesaw',name:'CIRCUS SEESAW',cat:'CLASSICS',warm:120,time:240,how:'MOVE THE SEESAW, A FLIPS IT. LAND FLYERS ON THE HIGH END. POP ALL BALLOONS.',make(){
 const g={over:null,score:0},PY=212,HL=26,RY=[36,54,72],RC=[[K.r,K.y],[K.c,K.g],[K.p,K.o]],RP=[50,30,20];
 let lvl=0,lives=5,sx=160,side=-1,fly=null,rows,wait=60,msg='',mt=0,t=0,flipT=0,pops=0;
 const gen=()=>{lvl++;rows=RY.map((y,i)=>({y,off:rnd(24),v:(i%2?-1:1)*(.45+i*.15+lvl*.15),b:Array(14).fill(1)}));msg='ACT '+lvl;mt=90;};
 const bpos=(r,i)=>((i*24+r.off)%336+336)%336-8;
 gen();
 g.update=()=>{t++;if(mt)mt--;if(flipT)flipT--;const k=A.in(0),h=A.hit(0);sx=cl(sx+ax(k)*3.2,HL+6,W-HL-6);if(h.a){side=-side;flipT=8;S('blip');}
  rows.forEach(r=>{r.off+=r.v;});
  if(wait){wait--;if(wait===0){fly={x:24,y:64,vx:1.2+rnd(.6),vy:-2.4,rot:0};S('jump');}return;}
  const f=fly;f.vy+=.12;f.x+=f.vx;f.y+=f.vy;f.rot+=f.vx*.06;if(f.x<10){f.x=10;f.vx=Math.abs(f.vx);}if(f.x>W-10){f.x=W-10;f.vx=-Math.abs(f.vx);}if(f.y<34&&f.vy<0){f.vy=-f.vy*.8;}
  for(let ri_=0;ri_<3;ri_++){const r=rows[ri_];for(let i=0;i<14;i++){if(!r.b[i])continue;const bx=bpos(r,i);if(Math.hypot(bx-f.x,r.y-(f.y-12))<12){r.b[i]=0;pops++;g.score+=RP[ri_]*lvl;S('coin');A.burst(bx,r.y,RC[ri_][i%2],8,1.5);
    if(r.b.every(v=>!v)){g.score+=300*(3-ri_)*lvl;msg='ROW CLEAR! +'+300*(3-ri_)*lvl;mt=60;S('score');}}}}
  if(rows.every(r=>r.b.every(v=>!v))){g.score+=1000*lvl;S('win');A.confetti();if(lvl>=3){g.over='GRAND FINALE! WIN';return;}gen();}
  const upX=sx-side*HL;
  if(f.vy>0&&f.y>=PY-16&&f.y-f.vy<PY-16){const dx=f.x-upX;if(Math.abs(dx)<14){const v=Math.abs(f.vy),tip=Math.abs(dx)>6;const nv=cl(v*.97+.25+(tip?.55:0),5.2,7.9);
    const dX=sx+side*HL;fly={x:dX,y:PY-2,vx:(dX<160?1:-1)*(.4+rnd(1.3)),vy:-nv,rot:0};side=-side;g.score+=10;S('jump');A.burst(upX,PY-14,K.w,6,1.2);if(tip){msg='TIP BOUNCE!';mt=30;}return;}}
  if(f.y>PY+10){lives--;S('lose');A.shake=8;A.burst(f.x,PY+8,K.r,22,2.5);msg=lives?'SPLAT!':'';mt=60;if(lives<=0){g.over='THE SHOW IS OVER';return;}fly=null;wait=80;}};
 const clown=(x,y,o,rot)=>{const c=A.c;if(rot){c.save();c.translate(x,y-15);c.rotate(rot);x=0;y=15;}A.person(x,y,o);P([[x-4,y-31],[x+4,y-31],[x,y-41]],o.hat,1);C(x,y-41,1.5,K.w);C(x+(o.d||1)*4,y-28,1.6,K.r);if(rot)c.restore();};
 g.draw=()=>{A.cls('#1a0418');for(let i=0;i<16;i++)P([[160,0],[i*22-16,PY-30],[i*22+6,PY-30]],i%2?'#5a0a20':'#3a0618',1);vg('#2a0820','#120310',PY-30,PY+12,6);
  for(let i=0;i<3;i++){const lx=60+i*100+Math.sin(t*.01+i)*40;alpha(.08,()=>P([[lx-4,14],[lx+4,14],[lx+40,PY],[lx-40,PY]],'#fff6c0',1));}
  R(0,14,24,PY-14,'#3a1a2a');R(0,60,30,6,'#c8a040');for(let y=70;y<PY;y+=8)R(10,y,8,2,'#8a6a3a');
  for(let i=0;i<3;i++){const r=rows[i];for(let j=0;j<14;j++){if(!r.b[j])continue;const bx=bpos(r,j),sw=Math.sin(t*.06+j)*1.2;GX.stroke([[bx,r.y+6],[bx+sw,r.y+12]],'rgba(220,220,220,.7)',.7);GX.ell(bx,r.y,6,7,GX.rg(bx-2,r.y-3,.5,bx,r.y,8,[GX.lt(RC[i][j%2],1.6),RC[i][j%2],GX.lt(RC[i][j%2],.5)]));GX.ell(bx-2,r.y-3,1.8,2.4,'rgba(255,255,255,.7)',-.4);GX.poly([[bx-1.5,r.y+6.5],[bx+1.5,r.y+6.5],[bx,r.y+5]],RC[i][j%2]);}}
  ell(160,PY+18,180,16,'#c8a060');R(0,PY+12,W,H-PY-12,'#a8803a');for(let x=0;x<W;x+=12)R(x,PY+12,6,3,x%24?'#e8e0d0':'#d83a3a');
  for(let i=0;i<26;i++)C(6+i*12.3,H-4+Math.sin(i*1.7+t*.05)*1,5,['#3a3050','#4a3a2a','#2a2a40'][i%3]);
  const yL=side<0?PY:PY-16,yR=side<0?PY-16:PY;P([[sx,PY-8],[sx-9,PY+12],[sx+9,PY+12]],'#8a8aa0',1);L(sx-HL,yL,sx+HL,yR,'#d83a3a',4);L(sx-HL,yL-2,sx+HL,yR-2,'#ffcf3f',1);
  const sX=sx+side*HL;clown(sX,PY-2,{c:'#4dabff',pants:'#ffcf3f',id:1,s:.85,d:-side,hat:K.r,arm1:-.4*side,arm2:.4*side});
  if(fly)clown(fly.x,fly.y,{c:'#ff4f9a',pants:'#3dff8b',id:3,s:.85,d:fly.vx>0?1:-1,hat:K.y,arm1:-2.6,arm2:2.6},fly.rot);
  else if(wait)clown(18,60,{c:'#ff4f9a',pants:'#3dff8b',id:3,s:.85,d:1,hat:K.y,arm1:-2.8,arm2:2.8});
  if(fly){let x=fly.x,y=fly.y,vx=fly.vx,vy=fly.vy;for(let i=0;i<200&&!(vy>0&&y>=PY-16);i++){vy+=.12;x+=vx;y+=vy;if(x<10||x>W-10)vx=-vx;if(y<34&&vy<0)vy=-vy*.8;}const a=.35+.25*Math.sin(t*.25);A.c.globalAlpha=a;GX.poly([[x-4,PY-30],[x+4,PY-30],[x,PY-24]],K.y);GX.ell(x,PY+12,8,2,K.y);A.c.globalAlpha=1;}
  if(fly&&fly.vy>0){const upX=sx-side*HL;alpha(.35+.2*Math.sin(t*.3),()=>R(upX-6,PY-24,12,3,K.y));}
  hud('SCORE '+g.score,'ACT '+lvl+'/3','CLOWNS '+lives);if(mt&&msg)banner(msg,msg==='SPLAT!'?K.r:K.y,110);};
 return g;}});

/* ================= SUB HUNT ================= */
A.add({id:'subhunt',name:'SUB HUNT',cat:'CLASSICS',warm:120,time:240,how:'AIM WITH LEFT/RIGHT OR MOUSE, A FIRES. LEAD THE SHIPS. SINK 15, SPARE LINERS.',make(){
 const g={over:null,score:0},HZ=96,LN=[{y:104,s:.42},{y:124,s:.66},{y:156,s:1}],
  TY=[{n:'FREIGHTER',len:70,sp:.5,pts:100,c:'#6a4a3a'},{n:'TANKER',len:92,sp:.38,pts:150,c:'#3a4a5a'},{n:'DESTROYER',len:62,sp:.95,pts:300,c:'#5a6070'},{n:'PATROL',len:32,sp:1.5,pts:500,c:'#4a5a4a'},{n:'LINER',len:84,sp:.6,pts:-300,c:'#f4f4f4'}];
 let aim=160,torps=30,tubes=[0,0],tp=[],ships=[],sunk=0,spT=20,msg='',mt=0,done=0,sid=0,t=0;const ef=GX.fx();
 const spawn=()=>{const l=ri(3),r=Math.random(),ti=r<.13?4:r<.28?3:r<.48?2:r<.74?0:1,ty=TY[ti],s=LN[l].s,d=Math.random()<.5?1:-1;
  ships.push({l,ty,ti,x:d>0?-ty.len*s/2-10:W+ty.len*s/2+10,vx:d*ty.sp*(.55+.45*s)*(1+sunk*.025),sink:0,id:sid++});};
 g.update=()=>{t++;if(mt)mt--;if(done){done--;if(done===0)g.over='MISSION COMPLETE! WIN';return;}
  const k=A.in(0);if(A.mouse.t>0)aim+=(A.mouse.x-aim)*.25;aim=cl(aim+ax(k)*2.6,52,268);tubes=tubes.map(v=>Math.max(0,v-1));
  if(A.fire(10)&&torps>0){const i=tubes.indexOf(0);if(i>=0){tubes[i]=55;torps--;tp.push({x:aim,y:232,py:232});S('shoot');}}
  if(--spT<=0&&ships.filter(s=>!s.sink).length<5){spawn();spT=50+ri(70);}
  for(const s of ships){if(s.sink){s.sink++;continue;}s.x+=s.vx;}
  ships=ships.filter(s=>s.sink<110&&s.x>-140&&s.x<W+140);
  for(const q of tp){q.py=q.y;q.y-=1.7*(.45+.55*(q.y-HZ)/(232-HZ));
   for(const s of ships){if(s.sink||q.dead)continue;const L_=LN[s.l];if(q.py>L_.y&&q.y<=L_.y&&Math.abs(q.x-s.x)<s.ty.len*L_.s/2+2){q.dead=1;s.sink=1;A.shake=6;S('boom');ef.ring(q.x,L_.y-6,'#ffcf3f',30*L_.s+8,18);ef.debris(q.x,L_.y-6,'#3a3a3a',8,2*L_.s+.5);ef.flash('#ffd890',5);A.burst(q.x,L_.y-6,K.o,22,2.6*L_.s+.6);
     if(s.ti===4){torps=Math.max(0,torps-2);g.score=Math.max(0,g.score-300);msg='NEUTRAL LINER! -2 TORPS';mt=90;}
     else{const pts=s.ty.pts*(s.l===0?3:s.l===1?2:1);g.score+=pts;sunk++;msg=s.ty.n+' SUNK +'+pts;mt=60;if(sunk>=15){done=110;g.score+=torps*100;A.confetti();S('win');msg='15 SHIPS SUNK!';mt=110;}}}}
   if(q.y<HZ+2&&!q.dead){q.dead=1;A.burst(q.x,HZ+3,'#bfe8ff',5,.8);}}
  tp=tp.filter(q=>!q.dead);if(torps===0&&!tp.length&&!done){g.over='OUT OF TORPEDOES';}};
 const ship=(s)=>{const L_=LN[s.l],sc=L_.s,len=s.ty.len*sc,x=s.x,dir=Math.sign(s.vx)||1,c=A.c;let y=L_.y;const sk=s.sink;
  c.save();c.translate(x,y+(sk?sk*.12*sc:0));if(sk)c.rotate(dir*Math.min(.35,sk*.006));if(sk)c.globalAlpha=Math.max(0,1-sk/110);const hc=s.ty.c;
  P([[-len/2,-5*sc],[len/2+4*sc,-6*sc],[len/2-6*sc,2*sc],[-len/2+3*sc,2*sc]].map(p=>[p[0]*dir,p[1]]),hc,1);R(-len/2,-5*sc-1,len,1.5,'#1a1a1a');
  if(s.ti===4){R(-len*.32,-11*sc,len*.64,6*sc,'#ffffff');R(-len*.32,-8*sc,len*.64,1.5,'#3a6ad8');R(-len*.1,-17*sc,6*sc,6*sc,K.r);}
  else if(s.ti===1){R(len*.25*dir-4*sc,-12*sc,8*sc,7*sc,'#e8e8e8');R(-len*.35,-7*sc,len*.5,2*sc,'#2a3a4a');}
  else if(s.ti===2){R(-6*sc,-12*sc,14*sc,7*sc,'#7a8090');L(0,-12*sc,0,-22*sc,'#3a3a3a');R(dir*len*.3,-9*sc,6*sc,2*sc,'#3a3a3a');R(-dir*len*.3-5*sc,-9*sc,10*sc,2*sc,'#3a3a3a');}
  else if(s.ti===3){R(-5*sc,-10*sc,8*sc,5*sc,'#8a9a8a');L(0,-10*sc,0,-16*sc,'#3a3a3a');}
  else{R(-len*.3,-10*sc,len*.18,5*sc,'#c8a060');R(len*.05,-10*sc,len*.18,5*sc,'#5aa0c8');R(len*.28*dir-5*sc,-14*sc,10*sc,9*sc,'#e8e0d0');R(len*.28*dir-1*sc,-20*sc,3*sc,6*sc,'#3a3a3a');}
  c.restore();c.globalAlpha=1;if(sk&&sk<80&&A.t%3===0)A.fx.push({x:x+rnd(len)-len/2,y:y-6,vx:0,vy:-.4,t:30,c:'#5a5a5a',g:0,w:3});};
 g.draw=()=>{vg('#14204a','#ff9a6a',0,HZ);GX.glow(210,HZ,70,'#ffb070',.45);GX.disc(210,HZ,16,GX.lg(0,HZ-16,0,HZ,['#fff6c0','#ffb050']));for(let i=0;i<3;i++)ell(60+i*90+Math.sin(t*.002+i)*20,40+i*12,26,5,'#ffc8a8');
  P([[20,HZ],[50,HZ-8],[80,HZ-3],[110,HZ]],'#2a2a4a',1);P([[230,HZ],[262,HZ-6],[300,HZ]],'#2a2a4a',1);
  vg('#4a7aaa','#061430',HZ,H);GX.vg(150,HZ,120,40,['rgba(255,190,110,.35)','rgba(255,190,110,0)']);for(let i=0;i<40;i++){const yy=HZ+3+Math.pow(i/40,1.6)*140,len=4+i*.5,xx=((i*73+t*(.2+i*.02))%(W+40))-20;R(xx,yy,len,1,'#8ab8e0');}
  ships.slice().sort((a,b)=>a.l-b.l).forEach(ship);
  for(const q of tp){const sc=.3+.7*(q.y-HZ)/(232-HZ);alpha(.5,()=>{A.c.strokeStyle='#e8f4ff';A.c.lineWidth=1;A.c.beginPath();A.c.moveTo(q.x,232);A.c.lineTo(q.x,q.y);A.c.stroke();});ell(q.x,q.y,1.5*sc+.5,3*sc+.5,'#1a1a2a');if(A.t%4<2)C(q.x+rnd(2)-1,q.y+4,1,'#ffffff');}
  const c=A.c;c.fillStyle=GX.rg(160,126,100,160,126,128,['rgba(0,0,0,0)','rgba(0,0,0,.55)']);c.fillRect(0,0,W,H);c.fillStyle='#050508';c.beginPath();c.rect(0,0,W,H);c.arc(160,126,118,0,6.2832,true);c.fill();c.strokeStyle='#4a4a52';c.lineWidth=3;c.beginPath();c.arc(160,126,119.5,0,6.2832);c.stroke();c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=1;c.beginPath();c.arc(160,126,117,3.6,5.2);c.stroke();
  L(46,HZ,274,HZ,'rgba(0,0,0,.6)');for(const l of LN){L(150,l.y,170,l.y,'rgba(0,0,0,.5)');}
  alpha(.8,()=>{L(aim,HZ-20,aim,230,'#3dff8b');for(const l of LN)L(aim-4*l.s-2,l.y,aim+4*l.s+2,l.y,'#3dff8b');});
  ef.draw();GX.ot('SCORE '+g.score,6,5,K.y,1);GX.ot('SUNK '+sunk+'/15',6,16,K.w,1);GX.ot('TORPS '+torps,W-6,5,torps<5?K.r:K.w,1,'r');
  tubes.forEach((v,i)=>{R(W-46+i*22,16,18,6,K.d);R(W-46+i*22,16,18*(1-v/55),6,v?K.o:K.g);});T('TUBES',W-6,26,K.gr,1,'r');
  if(mt)banner(msg,msg.startsWith('NEUTRAL')?K.r:K.y,60);};
 return g;}});

/* ================= SPIRAL SHOOTER ================= */
A.add({id:'spiral',name:'SPIRAL SHOOTER',cat:'CLASSICS',warm:120,time:240,how:'ARROWS (OR MOUSE) CIRCLE THE RIM. HOLD A TO FIRE INWARD. CLEAR 6 WARPS.',make(){
 const g={over:null,score:0},CX=160,CY=126,RR=100,PN=['OUTER RIM','ICE MOON','GAS GIANT','RED WORLD','BLUE WORLD','HOME WORLD'],PC=['#8d86b8','#bfefff','#ffb070','#ff4f6d','#4dabff','#3dff8b'],EC=[K.p,K.c,K.y,K.o,K.g,K.r];
 const ef=GX.fx();let a=Math.PI/2,stage=0,lives=3,bl=[],en=[],eb=[],warp=0,inv=120,toSpawn=0,grpT=0,diveT=160,msg='',mt=0,t=0,stars=[],grp=0;
 for(let i=0;i<70;i++)stars.push({a:rnd(6.283),r:rnd(170),v:.4+rnd(1.2)});
 const pos=(r,an)=>[CX+Math.cos(an)*r,CY+Math.sin(an)*r*.92];
 const angd=(x,y)=>{let d=x-y;while(d>Math.PI)d-=6.2832;while(d<-Math.PI)d+=6.2832;return d;};
 const gen=()=>{stage++;en=[];eb=[];toSpawn=24+stage*4;grpT=40;grp=0;msg='WARP '+stage+': '+PN[stage-1];mt=110;};
 const die=()=>{lives--;S('boom');A.shake=10;ef.flash('#ff9838',10);const[x,y]=pos(RR,a);A.burst(x,y,K.o,26,3);eb=[];if(lives<=0){g.over='LOST NEAR '+PN[stage-1];return;}inv=150;};
 gen();
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;stars.forEach(s=>{s.r+=s.v*(1+s.r/70)*(warp?5:1);if(s.r>190){s.r=rnd(10);s.a=rnd(6.283);}});
  if(warp){warp--;if(warp===0){if(stage>=6){g.over='HOME WORLD REACHED! WIN';return;}gen();}return;}
  const k=A.in(0),dx=ax(k),dy=ay(k);let tgt=null;if(dx||dy)tgt=Math.atan2(dy,dx);else if(A.mouse.t>0&&Math.hypot(A.mouse.x-CX,A.mouse.y-CY)>20)tgt=Math.atan2((A.mouse.y-CY)/.92,A.mouse.x-CX);
  if(tgt!==null)a+=cl(angd(tgt,a),-.07,.07);
  if(A.fire(7)&&bl.length<8){bl.push({r:RR-8,an:a});S('shoot');}
  for(const b of bl){b.r-=5;}bl=bl.filter(b=>b.r>8&&!b.dead);
  if(toSpawn>0&&--grpT<=0){const n=Math.min(8,toSpawn),out=grp%2===1,dir=grp%4<2?1:-1,base=rnd(6.283);for(let i=0;i<n;i++)en.push({r:out?RR+40+i*14:-i*12,an:base+i*.12*dir,st:'in',dir,out,fr:30+(i%3)*14,fa:(grp*.4+i*.785),cd:0,k:grp%3,hp:1});toSpawn-=n;grp++;grpT=200-stage*12;}
  const gr=t*.008;
  for(const e of en){if(e.st==='in'){if(e.out){e.r-=1.3;e.an+=.03*e.dir;if(e.r<=e.fr)e.st='form';}else{e.r+=1.1;e.an+=.05*e.dir;if(e.r>=e.fr)e.st='form';}}
   else if(e.st==='form'){e.an+=cl(angd(e.fa+gr,e.an),-.04,.04);e.r+=(e.fr+Math.sin(t*.05+e.fa)*3-e.r)*.08;}
   else{e.r+=1.3+stage*.12;const hm=.01+stage*.0016;e.an+=cl(angd(a,e.an),-hm,hm);if(!e.shot&&e.r>50){e.shot=1;const[x,y]=pos(e.r,e.an),[sx,sy]=pos(RR,a),d=Math.hypot(sx-x,sy-y)||1;const bv=1.8+stage*.12;eb.push({x,y,vx:(sx-x)/d*bv,vy:(sy-y)/d*bv});S('blip');}
    if(e.r>RR+34){e.r=0;e.st='in';e.out=false;e.shot=0;}}
   if(e.r>0){const[x,y]=pos(e.r,e.an),sc=.35+.65*Math.min(1,e.r/RR);for(const b of bl){if(b.dead)continue;const[bx,by]=pos(b.r,b.an);if(Math.hypot(bx-x,by-y)<4+7*sc){b.dead=1;e.dead=1;g.score+=e.st==='dive'?150:e.st==='in'?80:50;S('boom');A.burst(x,y,EC[(stage-1)%6],12,1.8);ef.ring(x,y,EC[(stage-1)%6],14*sc+4,12);break;}}
    const[sx,sy]=pos(RR,a);if(!e.dead&&!inv&&e.st!=='in'&&Math.hypot(sx-x,sy-y)<10){e.dead=1;die();if(g.over)return;}}}
  en=en.filter(e=>!e.dead);
  if(--diveT<=0){diveT=Math.max(25,85-stage*10)+ri(30);const f=en.filter(e=>e.st==='form');if(f.length){const e=f[ri(f.length)];e.st='dive';e.shot=0;}}
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;const[sx,sy]=pos(RR,a);if(!inv&&Math.hypot(b.x-sx,b.y-sy)<6){b.dead=1;die();if(g.over)return;}}eb=eb.filter(b=>!b.dead&&b.x>-5&&b.x<W+5&&b.y>10&&b.y<H+5);
  if(toSpawn<=0&&!en.length){warp=140;g.score+=1000*stage;msg='WARP CLEAR! +'+1000*stage;mt=120;S('win');}};
 g.draw=()=>{const c=A.c,pc=PC[(stage-1)%6];GX.cache('spiral_bg',()=>{GX.sky(['#03020e','#080420','#03020c']);GX.glow(70,60,110,'#5a2aff',.16);GX.glow(260,190,120,'#ff3a8a',.12);GX.glow(200,40,70,'#2adfff',.08);});
  for(const s of stars){const[x,y]=pos(s.r,s.a),sz=s.r>110?1.6:s.r>60?1.1:.7;if(warp)GX.stroke([[x,y],[x-Math.cos(s.a)*s.r*.14,y-Math.sin(s.a)*s.r*.13]],'rgba(190,215,255,.8)',sz);else{c.fillStyle=s.r>80?'#ffffff':'#9a94c8';c.fillRect(x,y,sz,sz);}}
  const pr=8+stage*2+(warp?(140-warp)*.35:0);if(lo())GX.glow(CX,CY,pr*2.4,pc,.35);GX.orb(CX,CY,pr,pc);if(stage===3||stage===5){c.strokeStyle=GX.rgba(pc,.6);c.lineWidth=1.5;c.beginPath();c.ellipse(CX,CY,pr*1.7,pr*.45,-.3,0,6.2832);c.stroke();}
  c.strokeStyle='rgba(120,110,220,.22)';c.lineWidth=1;c.beginPath();c.ellipse(CX,CY,RR,RR*.92,0,0,6.2832);c.stroke();c.strokeStyle='rgba(120,110,220,.08)';c.lineWidth=5;c.stroke();
  for(const e of en){if(e.r<=0)continue;const[x,y]=pos(e.r,e.an),sc=.35+.65*Math.min(1.3,e.r/RR),col=EC[(stage-1+e.k)%6],fl=Math.sin(t*.4+e.fa)*2*sc,o=e.an+Math.PI/2;
   if(e.st==='dive'&&lo())GX.glow(x,y,10*sc+4,col,.5);c.save();c.translate(x,y);c.rotate(o);GX.poly([[-10*sc,-fl],[-2*sc,-3*sc],[-2*sc,3*sc]],GX.lg(-10*sc,0,0,0,[GX.lt(col,.6),col]));GX.poly([[10*sc,-fl],[2*sc,-3*sc],[2*sc,3*sc]],GX.lg(10*sc,0,0,0,[GX.lt(col,.6),col]));c.restore();
   GX.orb(x,y,3.6*sc+.6,col);GX.disc(x,y,1.2*sc+.3,'#1a1a1a');}
  for(const b of bl){const[x,y]=pos(b.r,b.an),[x2,y2]=pos(b.r+7,b.an);GX.stroke([[x,y],[x2,y2]],'rgba(255,207,63,.4)',3.5);GX.stroke([[x,y],[x2,y2]],'#fff6c0',1.4);}
  eb.forEach(b=>{if(lo())GX.glow(b.x,b.y,6,'#ff4f6d',.6);GX.disc(b.x,b.y,2.4,'#ff6a80');GX.disc(b.x,b.y,1,'#ffffff');});
  if(!(inv&&inv%8<4)&&!(warp&&warp<60)){const[tx,ty]=pos(RR-12,a),[lx,ly]=pos(RR+5,a-.1),[rx,ry]=pos(RR+5,a+.1),[ex,ey]=pos(RR+9,a),[mx,my]=pos(RR+2,a);
   if(lo())GX.glow(ex,ey,8+rnd(3),'#ff9838',.7);GX.poly([[tx,ty],[lx,ly],[mx,my]],'#a8b8e8');GX.poly([[tx,ty],[mx,my],[rx,ry]],'#eef4ff');GX.disc((tx*2+mx)/3,(ty*2+my)/3,1.6,'#4dabff');GX.disc(ex,ey,2+rnd(1.5),'#ffcf3f');}
  ef.draw();hud('SCORE '+g.score,'WARP '+stage+'/6  '+PN[stage-1],'LIVES '+lives);if(mt)banner(msg,K.y,40);};
return g;}});

/* ================= JUNGLE VINE ================= */
A.add({id:'jungle',name:'JUNGLE VINE',cat:'CLASSICS',warm:120,how:'RUN, A JUMPS. JUMP INTO A VINE TO SWING, A LETS GO. DODGE CROCS, GRAB LOOT.',make(){
 const g={over:null,score:0},SEG=320,TYP=['start','pit','logs','vine','croc','pit2','vine','logs','croc','vine','pit2','croc','vine','end'],N=TYP.length,GY=196;
 const holes=[];TYP.forEach((ty,i)=>{const o=i*SEG;if(ty==='pit')holes.push([o+140,o+188,'pit']);if(ty==='pit2'){holes.push([o+92,o+136,'pit']);holes.push([o+200,o+244,'pit']);}if(ty==='vine')holes.push([o+70,o+250,'tar']);if(ty==='croc')holes.push([o+80,o+240,'water']);});
 const treas=[];TYP.forEach((ty,i)=>{if(ty!=='start'&&ty!=='end'&&i%2===0||ty==='vine')treas.push({x:i*SEG+290,k:i%3,got:0});});
 let p={x:40,y:GY,vx:0,vy:0,on:'g',f:1,st:0,stum:0,nog:0},camX=0,lives=3,logs=[],logT=0,t=0,msg='',mt=0,best=0,got=0,done=0,rs=0;
 const segOf=x=>cl(Math.floor(x/SEG),0,N-1);
 const crocs=i=>[i*SEG+112,i*SEG+160,i*SEG+208];
 const open=(i,j)=>((t+j*45+i*20)%Math.max(110,170-i*4))<50;
 const solid=x=>{const h=holes.find(q=>x>q[0]+3&&x<q[1]-3);if(!h)return true;if(h[2]==='water'){const i=segOf(x);return crocs(i).some(cx=>Math.abs(x-cx)<12);}return false;};
 const vine=i=>{const px=i*SEG+160,py=20,len=138,an=.9*Math.sin(t*.032+i*1.3),w=.9*.032*Math.cos(t*.032+i*1.3);return{px,py,len,an,x:px+Math.sin(an)*len,y:py+Math.cos(an)*len,vx:w*len*Math.cos(an)};};
 const die=why=>{lives--;S('lose');A.shake=8;msg=why;mt=80;if(lives<=0){g.over='LOST IN THE JUNGLE';return;}const i=segOf(p.x);p={x:i*SEG+24,y:GY,vx:0,vy:0,on:'g',f:1,st:0,stum:0,nog:0};logs=[];rs=45;};
 g.update=()=>{t++;if(mt)mt--;if(done){done--;if(done===0)g.over='JUNGLE CROSSED! WIN';return;}if(rs){rs--;camX+=(cl(p.x-120,0,N*SEG-W)-camX)*.15;return;}const k=A.in(0),h=A.hit(0),dx=ax(k);if(p.nog)p.nog--;
  if(p.on==='vine'){const v=vine(segOf(p.x+0));p.x=v.x;p.y=v.y+26;if(dx)p.f=dx;if(h.a||h.u){p.on='air';p.vx=cl(v.vx,-3,3)+dx*.6;p.vy=-2.4;p.nog=24;S('jump');}}
  else if(p.on==='g'){if(p.stum)p.stum--;else{p.vx=dx*1.75;if(dx){p.f=dx;p.st+=.3;}}p.x+=p.vx;if(!p.stum&&(h.a||h.u)){p.on='air';p.vy=-4.3;S('jump');}
   else if(!solid(p.x)){p.on='air';p.vy=.5;}}
  else{p.vy+=.22;p.vx=cl(p.vx+dx*.06,-2.6,2.6);p.x+=p.vx;p.y+=p.vy;if(dx)p.f=dx;
   const i=segOf(p.x);if(TYP[i]==='vine'&&!p.nog){const v=vine(i);if(Math.hypot(v.x-p.x,v.y-(p.y-27))<17){p.on='vine';S('blip');}}
   if(p.on==='air'&&p.y>=GY&&p.y-p.vy<=GY+1&&solid(p.x)){p.y=GY;p.vy=0;p.on='g';}
   if(p.y>GY+30){die(holes.some(q=>p.x>q[0]&&p.x<q[1]&&q[2]==='water')?'SPLASH!':holes.some(q=>p.x>q[0]&&p.x<q[1]&&q[2]==='tar')?'STUCK IN THE TAR!':'FELL IN A PIT!');return;}}
  p.x=cl(p.x,8,N*SEG-8);const si=segOf(p.x);
  if(p.on==='g'&&TYP[si]==='croc'){crocs(si).forEach((cx,j)=>{if(Math.abs(p.x-cx)<12&&open(si,j)){die('SNAP! EATEN BY A CROC');}});if(g.over||mt===80)return;}
  if(si>best){best=si;g.score+=50;}
  if(TYP[si]==='logs'&&++logT>130){logT=0;logs.push({x:si*SEG+SEG+10,seg:si,r:0,j:0});}
  for(const l of logs){l.x-=1.1+si*.05;l.r+=.08;if(p.on==='g'&&!p.stum&&Math.abs(l.x-p.x)<9){p.stum=30;p.vx=0;p.x+=10;g.score=Math.max(0,g.score-100);S('hit');A.shake=4;msg='-100';mt=30;}
   if(!l.j&&p.y<GY-8&&Math.abs(l.x-p.x)<8){l.j=1;g.score+=20;}}logs=logs.filter(l=>l.x>l.seg*SEG-20);
  for(const q of treas)if(!q.got&&Math.abs(q.x-p.x)<10&&p.y>GY-30){q.got=1;got++;const pts=[1000,2000,4000][q.k];g.score+=pts;S('score');A.burst(q.x-camX,GY-8,K.y,18,2);msg=['GOLD BAR','SILVER IDOL','DIAMOND RING'][q.k]+' +'+pts;mt=60;}
  if(p.x>=N*SEG-40&&!done){done=100;g.score+=lives*500+got*250;S('win');A.confetti();msg='TEMPLE REACHED!';mt=100;}
  camX+=(cl(p.x-120,0,N*SEG-W)-camX)*.15;};
 g.draw=()=>{const ox=camX,c=A.c;GX.cache('jungle_sky',()=>{GX.sky(['#3a8a4a','#1e5a2a','#0c2a14']);GX.glow(220,30,120,'#e8ffb0',.25);});
  c.globalAlpha=.10;for(let i=0;i<4;i++){const x=((i*110-ox*.2)%440+440)%440-60;GX.poly([[x,14],[x+24,14],[x+90,GY],[x+40,GY]],'#f0ffd0');}c.globalAlpha=1;
  for(let i=-1;i<8;i++){const x=i*60-((ox*.3)%60);c.fillStyle='#1a4022';c.fillRect(x,14,9,GY-14);}for(let i=-1;i<14;i++){const x=i*30-((ox*.3)%30);GX.disc(x,22+(i*7%3)*6,19,'#16502a');}
  GX.hills(GY+2,26,'#123a1c',ox*.5,.03,4);
  for(let i=-1;i<6;i++){const x=i*90-(ox%90)+20;GX.hg(x,14,15,GY-14,['#3a2210','#6a4a24','#3a2210']);c.fillStyle='rgba(0,0,0,.2)';for(let y=30;y<GY;y+=14)c.fillRect(x+2,y,11,1);GX.stroke([[x+7,14],[x+12,40],[x+9,70]],'#2a8a2a',2);GX.ell(x+12,46,4,2,'#3aa83a',.6);}
  for(let i=-1;i<12;i++){const x=i*36-(ox%36);GX.disc(x,20,21,GX.rg(x-6,12,2,x,20,22,['#3aa848','#1f6a2a','#123a18']));GX.disc(x+18,30,14,GX.rg(x+14,25,1,x+18,30,15,['#4ac05a','#2a8a3a','#1a5a24']));}
  GX.vg(0,GY,W,10,['#9a7a3a','#6a4a1a']);c.fillStyle='#b8984a';c.fillRect(0,GY,W,1.5);GX.vg(0,GY+10,W,H-GY-10,['#3a2614','#1a0e06']);for(let x=-(ox%24);x<W;x+=24){c.fillStyle='rgba(0,0,0,.3)';c.fillRect(x,GY+18,10,4);}
for(let i=Math.floor(ox/23);i<(ox+W)/23+1;i++){const x=i*23-ox+((i*37)%11),hgt=4+(i*13)%7;if(holes.some(q=>i*23+((i*37)%11)>q[0]-6&&i*23+((i*37)%11)<q[1]+6))continue;P([[x-4,GY+1],[x-1,GY-hgt],[x+1,GY+1]],'#3a9a2a',1);P([[x,GY+1],[x+3,GY-hgt+2],[x+5,GY+1]],'#2a7a22',1);if(i%5===0){ell(x+8,GY-3,7,5,'#1f6a2a');ell(x+12,GY-5,5,4,'#2a8a3a');}}
  for(const q of holes){const a=q[0]-ox,b=q[1]-ox;if(b<0||a>W)continue;if(q[2]==='pit'){R(a,GY,b-a,H-GY,'#0a0604');}else if(q[2]==='tar'){R(a,GY+3,b-a,H-GY,'#120a10');R(a,GY+3,b-a,2,'#3a2a38');for(let x=a+8;x<b;x+=20)ell(x+Math.sin(t*.05+x)*3,GY+8,4,1.5,'#2a1a28');}
   else{R(a,GY+4,b-a,H-GY,'#2a5aa8');R(a,GY+4,b-a,2,'#7ab8f0');for(let x=a+6;x<b;x+=14)R(x+Math.sin(t*.08+x)*3,GY+9,6,1,'#5a9ad8');}}
  for(let i=Math.max(0,segOf(ox)-1);i<=Math.min(N-1,segOf(ox+W));i++){
   if(TYP[i]==='croc')crocs(i).forEach((cx,j)=>{const x=cx-ox,op=open(i,j),pd=Math.max(110,170-i*4),warn=!op&&((t+j*45+i*20)%pd)>pd-25;GX.ell(x+8,GY+6,17,4,'#1f5a24');GX.rr(x-12,GY-3,26,8,3,GX.lg(0,GY-3,0,GY+5,['#5ab04a','#2a7a2a']));for(let k=0;k<4;k++)GX.poly([[x-6+k*5,GY-3],[x-4+k*5,GY-6],[x-2+k*5,GY-3]],'#2a7a2a');GX.disc(x-6,GY-5,2.4,warn&&A.t%6<3?'#ff4f6d':K.y);GX.disc(x-6,GY-5,1,'#111');if(op){GX.poly([[x-12,GY-2],[x-25,GY-15],[x-21,GY-2]],GX.lg(0,GY-15,0,GY,['#6ac05a','#2a7a2a']));GX.poly([[x-12,GY-1],[x-26,GY+1],[x-12,GY+3]],'#2a7a2a');c.fillStyle='#c83a3a';c.fillRect(x-22,GY-4,9,3);for(let k=0;k<4;k++)GX.poly([[x-22+k*2.5,GY-4],[x-21+k*2.5,GY-7],[x-20+k*2.5,GY-4]],'#ffffff');}else GX.rr(x-25,GY-3,14,5,2,'#3a8a3a');});
   if(TYP[i]==='vine'){const v=vine(i);for(let s=0;s<8;s++){const a1=s/8,a2=(s+1)/8,bend=Math.sin(a1*3.14)*-v.an*6,x1=v.px-ox+(v.x-v.px)*a1+bend,y1=v.py+(v.y-v.py)*a1;GX.stroke([[x1,y1],[v.px-ox+(v.x-v.px)*a2,v.py+(v.y-v.py)*a2]],'#2f8a2a',2.4);if(s%2)GX.ell(x1+3,y1,3,1.4,'#5ac04a',.5+v.an);}GX.disc(v.px-ox,v.py,3.5,'#5a3a1a');GX.ell(v.x-ox,v.y,3.5,2.2,'#6ad05a');}
   if(TYP[i]==='end'){const x=i*SEG+250-ox;R(x-30,GY-70,60,70,'#8a8a78');R(x-14,GY-46,28,46,'#1a1a14');P([[x-38,GY-70],[x,GY-92],[x+38,GY-70]],'#9a9a88',1);T('TEMPLE',x,GY-62,K.y,1,'c');}}
  for(const l of logs){const x=l.x-ox;C(x,GY-6,6,'#7a4a1a');A.ring(x,GY-6,3.5,'#a06a2a');L(x,GY-6,x+Math.cos(l.r)*5,GY-6+Math.sin(l.r)*5,'#4a2a0a');}
  for(const q of treas){if(q.got)continue;const x=q.x-ox,y=GY-4+Math.sin(t*.1+q.x)*1.5;if(lo()&&x>-20&&x<W+20)GX.glow(x,y-5,14,'#ffe070',.35);if(q.k===0){R(x-6,y-5,12,5,K.y);R(x-4,y-7,8,2,'#fff0a0');}else if(q.k===1){R(x-3,y-10,6,10,'#d8d8e8');C(x,y-11,3,'#d8d8e8');}else{A.ring(x,y-3,4,K.y);P([[x,y-12],[x+3,y-8],[x,y-6],[x-3,y-8]],'#9fe4ff',1);}if(A.t%30<4)R(x+3,y-12,2,2,'#ffffff');}
  const x=p.x-ox,o={c:'#d8c890',pants:'#6a5a3a',cap:'#c8a060',id:2,s:1,d:p.f,st:p.on==='g'?p.st:1.2};if(p.on==='vine'){o.arm1=Math.PI-.2;o.arm2=Math.PI+.2;}if(p.stum)o.arm1=-2.5;A.person(x,p.y,o);
  hud('SCORE '+g.score,'AREA '+(segOf(p.x)+1)+'/'+N+'  TREASURE '+got,'LIVES '+lives);if(mt)banner(msg,msg.includes('+')||msg.startsWith('TEMPLE')?K.y:K.r,60);};
 return g;}});

/* ================= MOUSE MANSION ================= */
A.add({id:'mansion',name:'MOUSE MANSION',cat:'CLASSICS',warm:120,time:240,how:'BOUNCE UP SHAFTS, HOLD LEFT/RIGHT TO HOP OFF. A SWINGS DOORS AT CATS. GET LOOT.',make(){
 const g={over:null,score:0},FY=[58,98,138,178,218],SX=[34,122,198,286],TRY=234,GV=.15,BV=7.4,TC=['#3dff8b','#ffcf3f','#ff9838','#ff4f6d','#ff4f6d'];
 let lvl=0,lives=3,m,cats=[],doors=[],loot=[],waves=[],inv=0,msg='',mt=0,t=0,last=-1,chain=1,pend=[],cid=0,clearT=0;
 const gen=()=>{lvl++;doors=[];FY.forEach((y,fl)=>{const xs=shuffle([78,160,242]).slice(0,1+ri(2));xs.forEach(x=>doors.push({fl,x,open:false,pw:false,anim:0}));});const pd=doors[ri(doors.length)];pd.pw=true;
  loot=[];let tries=0;while(loot.length<10&&tries++<500){const fl=ri(5),x=20+rnd(280);if(SX.some(s=>Math.abs(s-x)<20)||doors.some(d=>d.fl===fl&&Math.abs(d.x-x)<16)||loot.some(q=>q.fl===fl&&Math.abs(q.x-x)<26)||(fl===4&&Math.abs(x-160)<20))continue;loot.push({fl,x,k:ri(5)});}
  m={x:160,y:FY[4],st:'f',fl:4,vy:0,f:1,bn:0,ign:-1,stp:0};cats=[];pend=[];for(let i=0;i<2+lvl;i++)pend.push(60+i*90);inv=60;last=-1;chain=1;waves=[];msg='HOUSE '+lvl;mt=90;clearT=0;};
 const shaftAt=x=>SX.find(s=>Math.abs(s-x)<4);
 const blocked=(fl,x0,x1)=>doors.some(d=>!d.open&&d.fl===fl&&((x0<d.x&&x1>=d.x-4)||(x0>d.x&&x1<=d.x+4)));
 const bounce=(o,isM)=>{const py=o.y;o.vy+=GV;o.y+=o.vy;if(o.y>=TRY){o.y=TRY;o.vy=-BV;if(isM){o.bn++;S('jump');if(o.bn>=5)return'break';}}return py;};
 const die=why=>{lives--;S('lose');A.shake=8;A.burst(m.x,m.y-6,'#c8c8d8',18,2);msg=why;mt=80;if(lives<=0){g.over='CAUGHT IN HOUSE '+lvl;return;}
  m={x:160,y:FY[4],st:'f',fl:4,vy:0,f:1,bn:0,ign:-1,stp:0};inv=150;cats.forEach(c=>{if(c.fl>=3||c.st==='s'){c.st='f';c.fl=0;c.y=FY[0];c.x=c.x<160?60:260;c.stun=60;}});};
 gen();
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;if(clearT){clearT--;if(clearT===0){if(lvl>=4){g.over='MANSION LOOTED! WIN';return;}gen();}return;}
  const k=A.in(0),h=A.hit(0),dx=ax(k);
  if(m.st==='f'){if(dx){m.f=dx;const nx=cl(m.x+dx*1.5,12,308);if(!blocked(m.fl,m.x,nx)){m.x=nx;m.stp+=.3;}}
   const s=shaftAt(m.x);if(s!==undefined){m.st='s';m.x=s;m.vy=0;m.ign=m.fl;S('blip');}
   if(h.a){const d=doors.filter(d=>d.fl===m.fl&&Math.abs(d.x-m.x)<20).sort((a,b)=>Math.abs(a.x-m.x)-Math.abs(b.x-m.x))[0];
    if(d){d.open=!d.open;d.anim=10;S('hit');if(d.open){const side=d.x>m.x?1:-1;if(d.pw){d.pw=false;waves.push({fl:d.fl,x:d.x,dir:side,n:0});S('score');A.shake=5;}
      cats.forEach(c=>{if(c.st==='f'&&c.fl===d.fl&&(c.x-d.x)*side>-4&&Math.abs(c.x-d.x)<34&&!c.stun){c.stun=170;c.x=cl(c.x+side*16,12,308);g.score+=50;A.burst(c.x,c.y-8,K.y,8,1.5);}});}}}}
  else{const py=bounce(m,true);if(py==='break'){m.st='x';}else{if(m.ign>=0&&Math.abs(m.y-FY[m.ign])>8)m.ign=-1;if(dx)for(let i=0;i<5;i++){if(i===m.ign)continue;if((py-FY[i])*(m.y-FY[i])<=0){m.st='f';m.fl=i;m.y=FY[i];m.x=m.x+dx*12;m.f=dx;m.bn=0;S('blip');break;}}}}
  if(m.st==='x'){A.burst(m.x,TRY,TC[3],20,2);die('TRAMPOLINE SNAPPED!');if(g.over)return;}
  for(const l of loot)if(m.st==='f'&&l.fl===m.fl&&Math.abs(l.x-m.x)<10){l.got=1;chain=l.k===last?chain+1:1;last=l.k;const pts=100*(l.k+1)*chain;g.score+=pts;S('coin');A.burst(l.x,FY[l.fl]-8,K.y,12,1.6);if(chain>1){msg='MATCH X'+chain+'  +'+pts;mt=50;}}
  loot=loot.filter(l=>!l.got);if(!loot.length){g.score+=1000*lvl;S('win');A.confetti();msg='HOUSE CLEAR!';mt=100;clearT=100;return;}
  pend=pend.map(v=>v-1);pend.filter(v=>v<=0).forEach(()=>cats.push({x:SX[ri(4)],y:40,st:'s',fl:0,vy:1,f:1,stun:0,tgt:0,cool:0,id:cid++,bc:0}));pend=pend.filter(v=>v>0);
  const csp=.85+lvl*.15+Math.min(.6,t/3000);
  for(const c of cats){if(c.cool)c.cool--;
   if(c.st==='f'){if(c.stun){c.stun--;continue;}const same=m.st==='f'&&m.fl===c.fl;if(same)c.f=Math.sign(m.x-c.x)||c.f;
    const nx=cl(c.x+c.f*csp,12,308);if(blocked(c.fl,c.x,nx)||nx<=12||nx>=308)c.f=-c.f;else c.x=nx;
    const s=shaftAt(c.x);if(s!==undefined&&!c.cool&&(!same||Math.random()<.02)&&Math.random()<.7){c.st='s';c.x=s;c.vy=0;c.tgt=m.st==='f'&&m.fl!==c.fl?m.fl:ri(5);c.bc=0;c.ign=c.fl;}else if(s!==undefined)c.cool=30;
    if(!inv&&m.st==='f'&&same&&Math.abs(c.x-m.x)<10){die('CAUGHT BY A CAT!');if(g.over)return;}}
   else{const py=c.y;c.vy+=GV;c.y+=c.vy;if(c.y>=TRY){c.y=TRY;c.vy=-BV;c.bc++;}if(c.ign>=0&&Math.abs(c.y-FY[c.ign])>8)c.ign=-1;
    for(let i=0;i<5;i++){if(i===c.ign)continue;if((py-FY[i])*(c.y-FY[i])<=0&&(i===c.tgt||c.bc>2)&&c.vy<0){c.st='f';c.fl=i;c.y=FY[i];c.f=m.x>c.x?1:-1;c.x+=c.f*12;c.cool=60;break;}}
    if(!inv&&m.st==='s'&&Math.abs(c.x-m.x)<6&&Math.abs(c.y-m.y)<10){die('CAUGHT IN THE SHAFT!');if(g.over)return;}}}
  for(const w of waves){w.x+=w.dir*3.2;for(const c of cats)if(c.st==='f'&&c.fl===w.fl&&Math.abs(c.x-w.x)<8&&!c.gone){c.gone=1;w.n++;const pts=200*(1<<Math.min(4,w.n-1));g.score+=pts;S('boom');A.burst(c.x,c.y-8,K.b,14,2);pend.push(240);}if(w.x<0||w.x>W)w.done=1;}
  waves=waves.filter(w=>!w.done);cats=cats.filter(c=>!c.gone);doors.forEach(d=>{if(d.anim)d.anim--;});};
 const item=(x,y,k)=>{if(k===0){R(x-6,y-10,12,10,'#6a6a7a');R(x-4,y-8,8,6,'#4dabff');R(x-3,y-12,1,2,'#aaa');R(x+2,y-12,1,2,'#aaa');}else if(k===1){R(x-6,y-7,12,7,'#8a4a2a');C(x+2,y-4,2,'#e8e8e8');R(x-5,y-6,4,4,'#3a2a1a');}
  else if(k===2){R(x-6,y-12,12,10,'#d8a83a');R(x-4,y-10,8,6,'#3a8ad8');P([[x-4,y-4],[x-1,y-8],[x+3,y-4]],'#3a9a3a',1);}else if(k===3){R(x-6,y-11,12,11,'#4a4a5a');A.ring(x,y-6,3,'#c8c8d8');R(x+3,y-7,2,2,K.y);}else{R(x-6,y-11,12,8,'#e8e0c8');R(x-4,y-10,8,5,'#2a6a4a');R(x-3,y-3,6,3,'#c8c0a8');}};
 g.draw=()=>{const c=A.c;GX.cache('mansion_bg',()=>{const c2=A.c;GX.sky(['#0c0420','#24103e']);GX.stars(30,8,0,0,46,.8);
   GX.poly([[0,46],[160,14],[320,46]],GX.lg(0,14,0,46,['#c8485a','#7a1a2a']));GX.poly([[22,46],[160,22],[298,46]],GX.lg(0,22,0,46,['#e05a6a','#a02a3a']));
   for(let i=0;i<5;i++){const y0=i===0?46:FY[i-1]+5,y1=FY[i];GX.vg(8,y0,304,y1-y0,i%2?['#f2bcd6','#d898b8']:['#fad0e2','#e2aec8']);for(let x=16;x<312;x+=16){c2.fillStyle='rgba(160,60,110,.12)';c2.fillRect(x,y0,2,y1-y0);}c2.fillStyle='rgba(120,40,80,.25)';c2.fillRect(8,y1-7,304,2);}
   GX.hg(0,46,8,H,['#5a1a34','#8a3a5a']);GX.hg(312,46,8,H,['#8a3a5a','#5a1a34']);
   for(const s of SX){GX.hg(s-10,46,20,TRY-46+6,['#14081c','#2a1438','#14081c']);for(let y=50;y<TRY;y+=12){c2.fillStyle='rgba(120,80,180,.25)';c2.fillRect(s-1,y,2,6);}}
   FY.forEach(y=>{let x0=8;const seg=(a,b)=>{GX.vg(a,y,b-a,6,['#e0a060','#a86a30','#7a4a20']);c2.fillStyle='rgba(255,240,200,.4)';c2.fillRect(a,y,b-a,1);};for(const s of SX){seg(x0,s-10);x0=s+10;}seg(x0,312);});});
  if(lo())GX.glow(160,34,14,'#ffe08a',.6);GX.disc(160,34,6,GX.rg(158,32,1,160,34,6,['#ffffff','#ffe08a','#c8a040']));
  for(const s of SX){const ms=m.st==='s'&&m.x===s,col=ms?TC[Math.min(4,m.bn)]:TC[0];GX.rr(s-11,TRY,22,3.5,1.5,GX.lg(0,TRY,0,TRY+3,[GX.lt(col,1.4),col]));if(lo()&&ms)GX.glow(s,TRY,10,col,.4);GX.rr(s-11,TRY+3,2,4,1,'#6a6a7a');GX.rr(s+9,TRY+3,2,4,1,'#6a6a7a');}
for(const d of doors){const y=FY[d.fl],col=d.pw?(A.t%20<10?'#4dabff':'#9fd8ff'):'#8a5a2a';if(d.open){R(d.x-1,y-26,2,26,'#5a3a1a');R(d.x+1,y-26,13,3,col);R(d.x+1,y-3,13,3,col);}else{R(d.x-3,y-26,6,26,col);R(d.x+1,y-14,2,2,K.y);}}
  for(const l of loot)item(l.x,FY[l.fl],l.k);
  for(const w of waves){alpha(.6,()=>{R(w.x-4,FY[w.fl]-24,8,24,'#9fd8ff');R(w.x-w.dir*10,FY[w.fl]-18,8,14,'#4dabff');});}
  for(const c of cats){const x=c.x,y=c.y,f=c.f,col=c.stun?'#a8a0b8':'#ff9838';ell(x,y-6,8,5,col);C(x+f*7,y-11,5,col);P([[x+f*4,y-15],[x+f*5,y-20],[x+f*8,y-15]],col,1);P([[x+f*8,y-15],[x+f*10,y-20],[x+f*11,y-14]],col,1);
   R(x+f*8-1,y-12,2,2,c.stun?'#1a1a1a':'#3dff8b');L(x-f*7,y-7,x-f*13,y-14+Math.sin(t*.2+c.id)*2,col,2);R(x-5,y-2,2,2,col);R(x+3,y-2,2,2,col);if(c.stun)for(let i=0;i<3;i++){const a=t*.2+i*2.1;R(x+Math.cos(a)*7,y-20+Math.sin(a)*2,2,2,K.y);}}
  if(!(inv&&inv%8<4)){const x=m.x,y=m.y,f=m.f;ell(x,y-5,6,4.5,'#b8b8c8');C(x+f*5,y-9,4,'#c8c8d8');C(x+f*2,y-14,3.5,'#a8a8b8');C(x+f*2,y-14,2,'#ffb0c0');R(x+f*7,y-10,2,2,'#1a1a1a');R(x+f*8,y-8,2,2,'#ff6a8a');
   R(x+f*2-4,y-17,8,3,'#2a4ab8');R(x+f*4-1,y-15,5,1,'#2a4ab8');L(x-f*6,y-4,x-f*12,y-8,'#ffb0c0');R(x-3,y-1,2,2,'#888');R(x+2,y-1+Math.sin(m.stp)*1,2,2,'#888');}
  hud('SCORE '+g.score,'HOUSE '+lvl+'/4  LOOT '+loot.length,'LIVES '+lives);if(mt)banner(msg,msg.includes('CAUGHT')||msg.includes('SNAP')?K.r:K.y,108);};
 return g;}});

/* ================= ROBOT ROOMS ================= */
A.add({id:'roomrobots',name:'ROBOT ROOMS',cat:'CLASSICS',warm:120,time:240,how:'MOVE, HOLD A TO FIRE WHERE YOU FACE. WALLS ARE LIVE. ESCAPE 10 ROOMS FAST.',make(){
 const g={over:null,score:0},X0=8,Y0=20,X1=312,Y1=232,CW=(X1-X0)/5,CH=(Y1-Y0)/3,RC=['#ffcf3f','#ff4f6d','#e8e8f0','#3dff8b','#4dabff','#ff9838','#ff4f9a','#2fd6c3','#c8a8ff','#ff3a3a'];
 let room=0,lives=3,p,walls,bots,pb=[],eb=[],face=null,t=0,entry=3,fx=1,fy=0,msg='',mt=0,start=0,faceT=0,deadT=0,seal=null;const ef=GX.fx();
 const hitW=(x,y,r)=>walls.some(w=>x+r>w[0]&&x-r<w[0]+w[2]&&y+r>w[1]&&y-r<w[1]+w[3]);
 const gen=()=>{room++;let segs,ok=false,tries=0;
  while(!ok&&tries++<30){segs=[];const blk=new Set();for(let gi=1;gi<=4;gi++)for(let gj=1;gj<=2;gj++){const px=X0+gi*CW,py=Y0+gj*CH,d=ri(4);
    if(d===0){segs.push([px-2,py-CH-2,4,CH+4]);blk.add((gi-1)+','+(gj-1)+'|'+gi+','+(gj-1));}else if(d===1){segs.push([px-2,py-2,4,CH+4]);blk.add((gi-1)+','+gj+'|'+gi+','+gj);}
    else if(d===2){segs.push([px-2,py-2,CW+4,4]);blk.add(gi+','+(gj-1)+'|'+gi+','+gj);}else{segs.push([px-CW-2,py-2,CW+4,4]);blk.add((gi-1)+','+(gj-1)+'|'+(gi-1)+','+gj);}}
   const seen=new Set(['0,0']),q=[[0,0]];while(q.length){const[a,b]=q.pop();for(const[c,d]of[[a+1,b],[a-1,b],[a,b+1],[a,b-1]]){if(c<0||d<0||c>4||d>2||seen.has(c+','+d))continue;const k1=Math.min(a,c)+','+Math.min(b,d)+'|'+Math.max(a,c)+','+Math.max(b,d);if(blk.has(k1))continue;seen.add(c+','+d);q.push([c,d]);}}ok=seen.size===15;}
  const gx=[140,180],gy=[106,146];walls=[[X0,Y0,gx[0]-X0,4],[gx[1],Y0,X1-gx[1],4],[X0,Y1-4,gx[0]-X0,4],[gx[1],Y1-4,X1-gx[1],4],[X0,Y0,4,gy[0]-Y0],[X0,gy[1],4,Y1-gy[1]],[X1-4,Y0,4,gy[0]-Y0],[X1-4,gy[1],4,Y1-gy[1]],...segs];
  seal=[[gx[0],Y0,40,4],[X1-4,gy[0],4,40],[gx[0],Y1-4,40,4],[X0,gy[0],4,40]][entry];walls.push(seal);
  p=[{x:160,y:Y0+14},{x:X1-14,y:126},{x:160,y:Y1-14},{x:X0+14,y:126}][entry];p.st=0;fx=[0,-1,0,1][entry];fy=[1,0,-1,0][entry];
  bots=[];const n=Math.min(12,4+room);let tr=0;while(bots.length<n&&tr++<400){const x=X0+14+rnd(X1-X0-28),y=Y0+14+rnd(Y1-Y0-28);if(hitW(x,y,9)||Math.hypot(x-p.x,y-p.y)<80||bots.some(b=>Math.hypot(b.x-x,b.y-y)<16))continue;bots.push({x,y,cd:60+ri(120),eye:rnd(6)});}
  pb=[];eb=[];face=null;start=bots.length;faceT=Math.max(300,760-room*45);t=0;msg='ROOM '+room;mt=70;};
 const die=why=>{lives--;S('boom');A.shake=10;ef.flash('#3dff8b',10);ef.debris(p.x,p.y,'#3dff8b',10,2);A.burst(p.x,p.y,K.g,24,2.5);msg=why;mt=80;deadT=60;if(lives<=0){g.over='DELETED IN ROOM '+room;return;}};
 gen();
 g.update=()=>{if(mt)mt--;if(deadT){deadT--;if(deadT===0){room--;gen();}return;}t++;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){fx=dx;fy=dy;}
  const n=Math.hypot(dx,dy)||1,nx=p.x+dx/n*1.35,ny=p.y+dy/n*1.35;if(dx||dy)p.st+=.3;if(hitW(nx,ny,3.5)){die('ELECTROCUTED!');return;}p.x=nx;p.y=ny;
  const side=p.y<Y0-3?0:p.x>X1+3?1:p.y>Y1+3?2:p.x<X0-3?3:-1;
  if(side>=0){const bonus=bots.length?0:start*30;g.score+=100+bonus;S('win');if(bonus){A.confetti();}if(room>=10){g.over='ESCAPED THE COMPLEX! WIN';return;}entry=(side+2)%4;gen();if(bonus){msg='ROOM CLEARED +'+bonus;mt=70;}return;}
  if(A.fire(14)&&pb.length<2){const m=Math.hypot(fx,fy)||1;pb.push({x:p.x+fx/m*5,y:p.y-3+fy/m*5,vx:fx/m*4.2,vy:fy/m*4.2});S('shoot');}
  for(const b of pb){b.x+=b.vx;b.y+=b.vy;if(hitW(b.x,b.y,1)||b.x<0||b.x>W||b.y<14||b.y>H)b.dead=1;}
  const bs=Math.min(.6,.22+room*.035),maxEB=1+Math.floor(room/3);
  for(const b of bots){if(b.dead)continue;b.eye+=.08;const ddx=p.x-b.x,ddy=p.y-b.y;
   if(Math.random()<.85){let mx=0,my=0;if(Math.abs(ddx)>Math.abs(ddy))mx=Math.sign(ddx)*bs;else my=Math.sign(ddy)*bs;const tx=b.x+mx,ty=b.y+my;if(hitW(tx,ty,5)){b.dead=1;g.score+=50;S('boom');A.burst(b.x,b.y,RC[(room-1)%10],12,2);continue;}b.x=tx;b.y=ty;}
   for(const o of bots)if(o!==b&&!o.dead&&Math.hypot(o.x-b.x,o.y-b.y)<9){o.dead=1;b.dead=1;g.score+=100;S('boom');A.burst(b.x,b.y,K.o,16,2.2);}
   for(const q of pb)if(!q.dead&&Math.abs(q.x-b.x)<6&&Math.abs(q.y-b.y)<7){q.dead=1;b.dead=1;g.score+=50;S('boom');A.burst(b.x,b.y,RC[(room-1)%10],12,2);}
   if(!b.dead&&--b.cd<=0&&eb.length<maxEB&&t>100){const al=Math.abs(ddx)<5?[0,Math.sign(ddy)]:Math.abs(ddy)<5?[Math.sign(ddx),0]:Math.abs(Math.abs(ddx)-Math.abs(ddy))<7?[Math.sign(ddx),Math.sign(ddy)]:null;
    if(al){const m=Math.hypot(al[0],al[1]),v=1.6+room*.12;eb.push({x:b.x+al[0]/m*6,y:b.y-2+al[1]/m*6,vx:al[0]/m*v,vy:al[1]/m*v});b.cd=Math.max(40,130-room*9)+ri(40);S('blip');}else b.cd=10;}
   if(!b.dead&&Math.hypot(b.x-p.x,b.y-p.y)<8){die('ZAPPED BY A ROBOT!');return;}}
  bots=bots.filter(b=>!b.dead);pb=pb.filter(b=>!b.dead);
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(hitW(b.x,b.y,1)||b.x<0||b.x>W||b.y<14||b.y>H)b.dead=1;if(Math.hypot(b.x-p.x,b.y-(p.y-3))<5){die('SHOT!');return;}for(const q of pb)if(Math.hypot(q.x-b.x,q.y-b.y)<4){q.dead=1;b.dead=1;g.score+=10;}}eb=eb.filter(b=>!b.dead);
  if(t===faceT){face={x:[{x:160,y:Y0+6},{x:X1-6,y:126},{x:160,y:Y1-6},{x:X0+6,y:126}][entry].x,y:[{x:160,y:Y0+6},{x:X1-6,y:126},{x:160,y:Y1-6},{x:X0+6,y:126}][entry].y,t:0};msg='GET OUT!';mt=60;S('lose');}
  if(face){face.t++;const d=Math.hypot(p.x-face.x,p.y-face.y)||1,v=.55+room*.045;face.x+=(p.x-face.x)/d*v;face.y+=(p.y-face.y)/d*v;const hop=Math.abs(Math.sin(face.t*.09))*12;
   pb.forEach(q=>{if(Math.hypot(q.x-face.x,q.y-(face.y-hop))<9){q.dead=1;A.burst(q.x,q.y,K.y,4,1);}});if(Math.hypot(p.x-face.x,p.y-face.y)<9&&hop<6){die('THE GRIN GOT YOU!');return;}}};
 g.draw=()=>{const c=A.c,col=RC[(room-1)%10];GX.cache('roomrobots_floor',()=>{const c2=A.c;GX.sky(['#06061a','#03030c']);for(let x=X0;x<X1;x+=16)for(let y=Y0;y<Y1;y+=16){c2.fillStyle=((x+y)/16)%2?'#0a0a1e':'#0c0c24';c2.fillRect(x,y,16,16);c2.fillStyle='rgba(120,140,255,.05)';c2.fillRect(x,y,16,1);c2.fillRect(x,y,1,16);}});
  for(const w of walls){const s=w===seal,wc=s?'#ff4f6d':'#4a6aff';c.globalAlpha=.18+(s?.1:.06*Math.sin(A.t*.15));c.fillStyle=wc;c.fillRect(w[0]-3,w[1]-3,w[2]+6,w[3]+6);c.globalAlpha=.35;c.fillRect(w[0]-1.5,w[1]-1.5,w[2]+3,w[3]+3);c.globalAlpha=1;c.fillStyle=s?'#ff8a9a':'#9ab0ff';c.fillRect(w[0],w[1],w[2],w[3]);c.fillStyle='#ffffff';c.globalAlpha=.6;if(w[2]>w[3])c.fillRect(w[0],w[1]+w[3]/2-.5,w[2],1);else c.fillRect(w[0]+w[2]/2-.5,w[1],1,w[3]);c.globalAlpha=1;}
  for(let i=0;i<4;i++){if(i===entry)continue;const[x,y]=[[160,Y0+2],[X1-2,126],[160,Y1-2],[X0+2,126]][i],[ux,uy]=[[0,-1],[1,0],[0,1],[-1,0]][i],o=A.t%40/10;c.globalAlpha=.65;GX.poly([[x+ux*(4+o),y+uy*(4+o)],[x-ux*2+uy*5,y-uy*2+ux*5],[x-ux*2-uy*5,y-uy*2-ux*5]],'#3dff8b');if(lo())GX.glow(x,y,10,'#3dff8b',.3);c.globalAlpha=1;}
  for(const b of bots){const x=b.x,y=b.y;GX.shadow(x,y+8,6,1.6,.5);GX.rr(x-4.5,y-1,9,7,2,GX.lg(x-5,0,x+5,0,[GX.lt(col,.6),GX.lt(col,1.3),GX.lt(col,.6)]));GX.orb(x,y-4,4.8,col);GX.rr(x-4,y-6.5,8,3,1.2,'#0a0a14');const ex=x-3+((Math.sin(b.eye)+1)*2.5|0);GX.rr(ex,y-5.8,2.4,1.6,.6,'#ff3a4a');if(lo())GX.glow(ex+1,y-5,5,'#ff3a4a',.6);GX.rr(x-4.5,y+6,3,2.5,1,GX.lt(col,.7));GX.rr(x+1.5,y+6,3,2.5,1,GX.lt(col,.7));}
  pb.forEach(b=>{if(lo())GX.glow(b.x,b.y,6,'#3dff8b',.7);GX.stroke([[b.x-b.vx*1.5,b.y-b.vy*1.5],[b.x,b.y]],'#c8ffd8',2);});
  eb.forEach(b=>{if(lo())GX.glow(b.x,b.y,6,col,.6);GX.disc(b.x,b.y,1.8,col);GX.disc(b.x,b.y,.8,'#ffffff');});
  if(!deadT){if(lo())GX.glow(p.x,p.y,14,'#3dff8b',.18);A.person(p.x,p.y+7,{s:.46,c:'#3dff8b',pants:'#2a6a3a',id:1,st:p.st,d:fx||1,arm2:A.in(0).a?-1.57*(fx||1):undefined});}
  if(face){const hop=Math.abs(Math.sin(face.t*.09))*12,x=face.x,y=face.y-hop;GX.shadow(face.x,face.y+6,8-hop*.3,2.5,.4);if(lo())GX.glow(x,y,18,'#ffcf3f',.4);GX.orb(x,y,9,'#ffcf3f');GX.rr(x-4,y-4,2,3,1,'#1a1a1a');GX.rr(x+2,y-4,2,3,1,'#1a1a1a');c.strokeStyle='#1a1a1a';c.lineWidth=1.5;c.beginPath();c.arc(x,y,5,.3,2.84);c.stroke();}
  ef.draw();hud('SCORE '+g.score,'ROOM '+room+'/10  ROBOTS '+bots.length,'LIVES '+lives);if(mt)banner(msg,msg.startsWith('ROOM')?K.y:K.r,108);};
return g;}});

/* ================= ISO FLIGHT ================= */
A.add({id:'isoflight',name:'ISO FLIGHT',cat:'CLASSICS',warm:120,hd:1,how:'LEFT/RIGHT SLIDE, UP/DOWN ALTITUDE, HOLD A TO FIRE. WATCH ALTIMETER + SHADOW.',make(){
 const g={over:null,score:0},XO=58,YO=198,KX=13,KY=7.5,KH=12.5,LW=4,HM=4.5,FEND=300,V=.085,OFF=2.4;
 let cam=0,pl=0,ph=1.6,fuel=100,lives=3,inv=90,shots=[],shells=[],objs=[],t=0,msg='FORTRESS 1',mt=90,boss=null,done=0,spT=0,lastSec=1;
 const pr=(f,l,h)=>[XO+(f-cam+l)*KX,YO+(l-(f-cam))*KY-h*KH];
 const deck=f=>(f>=-4&&f<118)||(f>=160&&f<FEND+40);
 const OH={tur:.7,tank:1,dish:1.1};
 (()=>{const seg=(a,b,gap)=>{for(let f=a;f<b;f+=gap){const r=Math.random();
   if(r<.33)objs.push({k:'low',f,hgt:1.3+rnd(.7)});else if(r<.66){const g0=-3.6+rnd(4.8);objs.push({k:'door',f,g0,g1:g0+2.3,gh:2});}else objs.push({k:'beam',f,hb:1+rnd(2.6)});
   const n=2+ri(2);for(let i=0;i<n;i++){const kk=Math.random();objs.push({k:kk<.45?'tur':kk<.75?'tank':'dish',f:f+3+rnd(gap-5),l:-3.2+rnd(6.4),cd:40+ri(80)});}}};
  seg(14,110,13);seg(172,FEND-14,11);objs.sort((a,b)=>a.f-b.f);})();
 const crash=why=>{lives--;inv=130;S('boom');A.shake=10;const[x,y]=pr(cam+OFF,pl,ph);A.burst(x,y,K.o,26,3);msg=why;mt=70;if(lives<=0){g.over='SHOT DOWN IN SECTOR '+lastSec;return;}ph=2;pl=0;fuel=Math.max(fuel,55);shells=[];};
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;if(done){done--;cam+=V*.3;if(done===0)g.over='FORTRESS DESTROYED! WIN';return;}
  const pf0=cam+OFF;cam+=V;const pf=cam+OFF,k=A.in(0);pl=cl(pl+ax(k)*.065,-3.5,3.5);ph=cl(ph-ay(k)*.055,.3,HM);
  const sec=pf<118?1:pf<160?2:3;if(sec!==lastSec){lastSec=sec;msg=['','FORTRESS 1','OPEN SPACE','FORTRESS 2'][sec];mt=80;S('blip');}
  fuel-=.028;if(fuel<=0){fuel=0;crash('OUT OF FUEL');if(g.over)return;}
  if(A.fire(9)&&shots.length<6){shots.push({f:pf+.5,l:pl,h:ph,life:34});S('shoot');}
  if(!inv)for(const o of objs){if(o.dead||!(o.f>pf0&&o.f<=pf))continue;let hit=false;
   if(o.k==='low')hit=ph<o.hgt+.25;else if(o.k==='door')hit=!(pl>o.g0+.2&&pl<o.g1-.2&&ph<o.gh-.2);else if(o.k==='beam')hit=Math.abs(ph-o.hb)<.5;
   else if(OH[o.k])hit=Math.abs(pl-o.l)<.6&&ph<OH[o.k]+.2;
   if(hit){if(OH[o.k])o.dead=1;crash(o.k==='beam'?'FRIED BY A BEAM':o.k==='low'||o.k==='door'?'HIT THE WALL':'CRASHED');if(g.over)return;break;}else if(o.k==='low'||o.k==='door'||o.k==='beam'){g.score+=50;}}
  if(pf>118&&pf<156&&--spT<=0){spT=Math.max(30,60-ri(20));objs.push({k:'plane',f:pf+13,l:-3+rnd(6),h:.8+rnd(3.4),vf:-.07});}
  if(pf>FEND-12&&!boss){boss={f:pf+10,hp:12,cd:70,t:0};msg='FORTRESS CORE!';mt=90;S('lose');}
  for(const o of objs){if(o.dead)continue;if(o.k==='plane'){o.f+=o.vf;o.l+=cl(pl-o.l,-.015,.015);o.h+=cl(ph-o.h,-.012,.012);if(!inv&&Math.abs(o.f-pf)<.4&&Math.abs(o.l-pl)<.6&&Math.abs(o.h-ph)<.5){o.dead=1;crash('MID-AIR COLLISION');if(g.over)return;}}
   else if(o.k==='mis'){o.f-=.11;o.l+=cl(pl-o.l,-.03,.03);o.h+=cl(ph-o.h,-.03,.03);if(!inv&&Math.abs(o.f-pf)<.4&&Math.abs(o.l-pl)<.5&&Math.abs(o.h-ph)<.5){o.dead=1;crash('MISSILE HIT');if(g.over)return;}}
   else if(o.k==='tur'){const d=o.f-pf;if(d>3&&d<11&&--o.cd<=0){o.cd=Math.max(50,110-lastSec*15)+ri(40);const n=d/(.11+V);shells.push({f:o.f,l:o.l,h:.6,vl:(pl-o.l)/n,vh:(ph-.6)/n});S('blip');}}
   if(o.f<cam-4)o.dead=1;}
  for(const s of shells){s.f-=.11;s.l+=s.vl;s.h+=s.vh;if(!inv&&Math.abs(s.f-pf)<.35&&Math.abs(s.l-pl)<.4&&Math.abs(s.h-ph)<.45){s.dead=1;crash('FLAK HIT');if(g.over)return;}if(s.f<cam-2)s.dead=1;}
  for(const s of shots){const f0=s.f;s.f+=.5;s.life--;if(s.life<=0)s.dead=1;
   for(const o of objs){if(o.dead||s.dead)continue;if(o.k==='plane'||o.k==='mis'){if(Math.abs(s.f-o.f)<.6&&Math.abs(s.l-o.l)<.6&&Math.abs(s.h-o.h)<.6){o.dead=1;s.dead=1;g.score+=o.k==='plane'?200:100;S('boom');const[x,y]=pr(o.f,o.l,o.h);A.burst(x,y,K.o,12,2);}continue;}
    if(!(o.f>f0&&o.f<=s.f))continue;
    if(o.k==='low'&&s.h<o.hgt)s.dead=1;else if(o.k==='door'&&!(s.l>o.g0&&s.l<o.g1&&s.h<o.gh))s.dead=1;else if(o.k==='beam'&&Math.abs(s.h-o.hb)<.35)s.dead=1;
    else if(OH[o.k]&&Math.abs(s.l-o.l)<.55&&s.h<OH[o.k]+.35){o.dead=1;s.dead=1;g.score+=o.k==='tur'?100:o.k==='tank'?150:300;if(o.k==='tank'){fuel=Math.min(100,fuel+30);msg='FUEL +30';mt=40;}S('boom');A.shake=3;const[x,y]=pr(o.f,o.l,.5);A.burst(x,y,o.k==='tank'?K.y:K.o,16,2.2);}
    if(s.dead){const[x,y]=pr(s.f,s.l,s.h);A.burst(x,y,'#c8c8ff',3,.8);}}
   if(boss&&!s.dead&&Math.abs(s.f-boss.f)<.7&&Math.abs(s.l)<1.5&&s.h<4.6){s.dead=1;const[x,y]=pr(boss.f,s.l,s.h);if(Math.abs(s.l)<.8&&s.h>2.2&&s.h<3.6){boss.hp--;g.score+=100;S('hit');A.burst(x,y,K.r,10,1.8);if(boss.hp<=0){done=130;g.score+=3000+lives*500;S('win');A.shake=12;A.confetti();msg='CORE DESTROYED!';mt=130;}}else A.burst(x,y,'#c8c8ff',3,.8);}}
  if(boss&&!done){boss.t++;boss.f=pf+10+Math.sin(boss.t*.02)*.6;if(--boss.cd<=0){boss.cd=Math.max(55,110-(12-boss.hp)*4);objs.push({k:'mis',f:boss.f-.6,l:rnd(2)-1,h:3});S('shoot');}}
  shots=shots.filter(s=>!s.dead);shells=shells.filter(s=>!s.dead);objs=objs.filter(o=>!o.dead);if(t%30===0)g.score+=5;};
 const P4=(pts,col)=>P(pts.map(p=>pr(p[0],p[1],p[2])),col,1);
 const ibox=(f,l,h,df,dl,dh,col)=>{P4([[f,l,h],[f,l+dl,h],[f,l+dl,h+dh],[f,l,h+dh]],A.shade(col,.85));P4([[f,l+dl,h],[f+df,l+dl,h],[f+df,l+dl,h+dh],[f,l+dl,h+dh]],A.shade(col,.62));P4([[f,l,h+dh],[f+df,l,h+dh],[f+df,l+dl,h+dh],[f,l+dl,h+dh]],A.shade(col,1.18));};
 g.draw=()=>{GX.cache('isoflight_bg',()=>{GX.sky(['#05041a','#0c0a2a','#1a0c2a']);GX.glow(240,60,120,'#3a2aff',.14);GX.glow(60,200,110,'#ff3a6a',.10);});GX.stars(60,6,cam*40,cam*20,H,.8);
  const f0=Math.floor(cam)-3;for(let f=f0;f<cam+17;f++){if(!deck(f))continue;P4([[f,-LW,0],[f+1,-LW,0],[f+1,LW,0],[f,LW,0]],f%2?'#3a4a5c':'#34424f');P4([[f,LW,0],[f+1,LW,0],[f+1,LW,-.9],[f,LW,-.9]],'#1c242e');
   if(!deck(f-1))P4([[f,-LW,0],[f,LW,0],[f,LW,-.9],[f,-LW,-.9]],'#283240');for(const l of[-3,0,3])P4([[f+.3,l-.08,0],[f+.7,l-.08,0],[f+.7,l+.08,0],[f+.3,l+.08,0]],'#4a5c70');
   if(f%3===0){const[x,y]=pr(f,-LW+.2,0);R(x-1,y-1,2,2,A.t%30<15?K.r:'#5a2a2a');}}
  const pf=cam+OFF,L_=[];const add=(key,fn)=>L_.push({key,fn});
  const span=(f,l0,l1,h0,h1,col,dep)=>{for(let a=l0;a<l1-1e-6;){const b=Math.min(l1,Math.floor(a)+1);const aa=a;add(-(f-cam)*100+(aa+b)/2,()=>ibox(f,aa,h0,dep||.45,b-aa,h1-h0,col));a=b;}};
  for(const o of objs){if(o.f<cam-4||o.f>cam+17)continue;
   if(o.k==='low')span(o.f,-LW,LW,0,o.hgt,'#7a7aa0');
   else if(o.k==='door'){span(o.f,-LW,o.g0,0,4.6,'#6a6a90');span(o.f,o.g0,o.g1,o.gh,4.6,'#6a6a90');span(o.f,o.g1,LW,0,4.6,'#6a6a90');}
   else if(o.k==='beam'){span(o.f,-LW-.5,-LW,0,4.6,'#8a8aa8');span(o.f,LW,LW+.5,0,4.6,'#8a8aa8');add(-(o.f+.2-cam)*100,()=>{const[a1,b1]=pr(o.f+.22,-LW,o.hb),[a2,b2]=pr(o.f+.22,LW,o.hb);alpha(.35,()=>L(a1,b1,a2,b2,'#ff4f6d',5));L(a1,b1,a2,b2,A.t%4<2?'#ffd0d8':'#ff6a8a',1.5);});}
   else if(o.k==='tur')add(-(o.f-cam)*100+o.l,()=>{ibox(o.f-.3,o.l-.3,0,.6,.6,.45,'#8a3a3a');const[x,y]=pr(o.f,o.l,.55);C(x,y,4,'#b84a4a');const[x2,y2]=pr(o.f-.6,o.l+(pl-o.l)*.1,.75);L(x,y,x2,y2,'#2a2a2a',2);});
   else if(o.k==='tank')add(-(o.f-cam)*100+o.l,()=>{ibox(o.f-.35,o.l-.35,0,.7,.7,1,'#c8a83a');const[x,y]=pr(o.f-.35,o.l+.35,.5);T('F',x-6,y-2,'#3a2a00',1);});
   else if(o.k==='dish')add(-(o.f-cam)*100+o.l,()=>{ibox(o.f-.15,o.l-.15,0,.3,.3,.7,'#8a8aa0');const[x,y]=pr(o.f,o.l,1);ell(x,y,7,3.5+Math.sin(t*.05)*2,'#d8d8e8');});
   else if(o.k==='plane'||o.k==='mis')add(-(o.f-cam)*100+o.l,()=>{const[sx,sy]=pr(o.f,o.l,0);if(deck(o.f))alpha(.3,()=>ell(sx,sy,6,2.5,'#000000'));if(o.k==='plane'){P4([[o.f-.5,o.l,o.h],[o.f+.4,o.l-.6,o.h],[o.f+.2,o.l,o.h+.2],[o.f+.4,o.l+.6,o.h]],'#d83a5a');}else{ibox(o.f-.3,o.l-.12,o.h-.12,.6,.24,.24,'#ff6a3a');}});}
  if(boss){const b=boss.f;add(-(b-cam)*100,()=>{ibox(b,-1.3,0,.8,.7,2.2,'#4a4a6a');ibox(b,.6,0,.8,.7,2.2,'#4a4a6a');ibox(b,-1.5,2.2,.9,3,1.9,'#5a5a80');ibox(b+.1,-.5,4.1,.6,1,.7,'#7a7aa0');
   const[x,y]=pr(b,0,2.9),pu=4+Math.sin(t*.2)*1.2;alpha(.4,()=>C(x,y,pu+4,K.r));C(x,y,pu,'#ff4f6d');const[ex,ey]=pr(b+.1,-.1,4.5);R(ex-5,ey-1,10,2,A.t%20<10?K.y:K.r);});}
  for(const s of shells)add(-(s.f-cam)*100+s.l,()=>{const[x,y]=pr(s.f,s.l,s.h);C(x,y,2.5,K.o);});
  for(const s of shots)add(-(s.f-cam)*100+s.l,()=>{const[x,y]=pr(s.f,s.l,s.h),[x2,y2]=pr(s.f+.5,s.l,s.h);L(x,y,x2,y2,K.y,2);});
  add(-OFF*100+pl,()=>{if(inv&&inv%8<4)return;const[sx,sy]=pr(pf,pl,0),[x,y]=pr(pf,pl,ph);if(deck(pf)){alpha(.45,()=>ell(sx,sy,8,3,'#000000'));for(let yy=sy-4;yy>y+4;yy-=5)R(sx,yy,1,2,'rgba(160,200,255,.35)');}
   P4([[pf+1.2,pl,ph],[pf-.5,pl-1,ph],[pf-.25,pl,ph+.15],[pf-.5,pl+1,ph]],'#dfe8ff');P4([[pf+1.2,pl,ph],[pf-.25,pl,ph+.15],[pf-.5,pl+1,ph]],'#8ab8ff');P4([[pf+.5,pl,ph+.12],[pf+.1,pl-.2,ph+.12],[pf+.1,pl+.2,ph+.12]],'#1a2a5a');P4([[pf-.25,pl,ph+.15],[pf-.6,pl,ph+.65],[pf-.5,pl,ph]],'#4dabff');const[ex,ey]=pr(pf-.55,pl,ph);if(lo())GX.glow(ex,ey,8,'#ff9838',.7);C(ex,ey,1.5+rnd(1.5),K.o);});
  L_.sort((a,b)=>a.key-b.key).forEach(d=>d.fn());
  GX.rr(3,28,12,154,3,'rgba(10,10,30,.8)');GX.rrs(3.5,28.5,11,153,3,'rgba(120,120,200,.5)',1);const ay_=h=>178-h/HM*146;const nx=objs.find(o=>(o.k==='low'||o.k==='door'||o.k==='beam')&&o.f>pf);
  if(nx){if(nx.k==='low')R(5,ay_(nx.hgt+.25),8,178-ay_(nx.hgt+.25),'#ff4f6d');else if(nx.k==='beam')R(5,ay_(nx.hb+.5),8,ay_(nx.hb-.5)-ay_(nx.hb+.5),'#ff4f6d');else R(5,ay_(nx.gh-.2),8,178-ay_(nx.gh-.2),'#3dff8b');}
  GX.rr(1,ay_(ph)-1.5,16,3,1.5,K.y);GX.ot('ALT',9,186,K.w,1,'c');
  hud('SCORE '+g.score,'','LIVES '+lives);GX.ot('FUEL',70,5,K.w,1);GX.meter(88,4,60,7,fuel/100,fuel<25?(A.t%20<10?'#ff4f6d':'#ffcf3f'):'#3dff8b');GX.meter(170,5,90,5,cl(pf/FEND,0,1),'#2fd6c3');
  if(mt)banner(msg,msg.includes('HIT')||msg.includes('FRIED')||msg.includes('CRASH')||msg.includes('OUT')||msg.includes('COLL')?K.r:K.y,24);};
 return g;}});

/* ================= FIREBIRD FLEET ================= */
A.add({id:'firebird',name:'FIREBIRD FLEET',cat:'CLASSICS',warm:120,time:240,how:'HOLD A TO FIRE, B SHIELDS. HIT BIG BIRDS IN THE BODY. DESTROY THE MOTHERSHIP.',make(){
 const g={over:null,score:0},PY=222,MX=56;
 let wave=0,lives=3,px=160,bl=[],eb=[],birds=[],ms=null,sh=0,shCd=0,inv=90,t=0,msg='',mt=0,diveT=80,clearT=0,won=0;
 const gen=()=>{wave++;birds=[];eb=[];ms=null;const kind=wave<=2?'s':wave<=4?'b':'m';
  if(kind==='s'){for(let r=0;r<3;r++)for(let i=0;i<8;i++)birds.push({k:'s',hx:52+i*31,hy:36+r*20,x:52+i*31,y:-20-r*24-i*8,st:'ret',t:ri(99),vx:0,vy:0});}
  else if(kind==='b'){for(let i=0;i<8;i++)birds.push({k:'b',hx:44+i*33,hy:44+(i%2)*28,x:44+i*33,y:-30-i*10,st:'ret',t:ri(99),lw:3,rw:3,vx:0,vy:0});}
  else{ms={y:24,hull:[Array(26).fill(1),Array(26).fill(1)],belt:Array(26).fill(1).map((v,i)=>i%7===6?0:1),bo:0,cd:50};for(let i=0;i<4;i++)birds.push({k:'s',hx:60+i*66,hy:126,x:60+i*66,y:-20,st:'ret',t:ri(99),vx:0,vy:0,esc:1});}
  msg=kind==='m'?'MOTHERSHIP!':kind==='b'?'WAVE '+wave+'  FIREBIRDS':'WAVE '+wave;mt=90;diveT=90;};
 const die=()=>{lives--;S('boom');A.shake=10;A.burst(px,PY-6,K.c,26,3);eb=[];if(lives<=0){g.over='SHOT DOWN ON WAVE '+wave;return;}inv=140;};
 const home=b=>[b.hx+Math.sin(t*.015)*16,b.hy+Math.sin(t*.08+b.t)*2];
 gen();
 g.update=()=>{t++;if(mt)mt--;if(inv)inv--;if(sh)sh--;if(shCd)shCd--;
  if(won){won--;if(won===0)g.over='MOTHERSHIP DOWN! VICTORY';return;}
  if(clearT){clearT--;if(clearT===0)gen();}
  const k=A.in(0);if(!sh)px=cl(px+ax(k)*2.5,12,308);if(A.hit(0).b&&!shCd){sh=80;shCd=420;S('hit');}
  if(A.fire(9)&&bl.length<3&&!sh){bl.push({x:px,y:PY-16});S('shoot');}
  for(const b of bl){b.y-=5.2;if(b.y<14)b.dead=1;}
  if(--diveT<=0){diveT=Math.max(25,(ms?50:80)-wave*8)+ri(40);const hs=birds.filter(b=>b.st==='home');if(hs.length){const b=hs[ri(hs.length)];b.st='dive';b.vx=0;b.vy=b.k==='b'?1.1:2.1;b.shots=0;}}
  for(const b of birds){if(b.dead)continue;b.t++;
   if(b.st==='home'){[b.x,b.y]=home(b);}
   else if(b.st==='ret'){const[hx,hy]=home(b),dx=hx-b.x,dy=hy-b.y,d=Math.hypot(dx,dy);if(d<3)b.st='home';else{b.x+=dx/d*Math.min(d,2.4);b.y+=dy/d*Math.min(d,2.4);}}
   else if(b.st==='dive'){b.vx=cl(b.vx+Math.sign(px-b.x)*.07,-2.2,2.2);b.x+=b.vx+Math.sin(b.t*.12)*.8;b.y+=b.vy;if(b.y>90&&b.shots<(b.k==='b'?2:1)&&Math.random()<.03){b.shots++;eb.push({x:b.x,y:b.y+6,vx:0,vy:2.6});S('blip');}
    if(b.k==='b'&&b.y>176){b.st='rise';}if(b.y>H+12){b.y=-16;b.st='ret';}}
   else if(b.st==='rise'){b.y-=1.1;b.x+=Math.sin(b.t*.05)*1.2;if(b.y<90)b.st='ret';}
   for(const q of bl){if(q.dead)continue;const dx=q.x-b.x,dy=q.y-b.y;
    if(b.k==='s'){if(Math.abs(dx)<7&&Math.abs(dy)<7){q.dead=1;b.dead=1;g.score+=(b.st==='dive'?80:20)*Math.ceil(wave/2);S('boom');A.burst(b.x,b.y,b.esc?K.o:wave===1?K.p:K.c,12,1.8);}}
    else if(Math.abs(dy)<7){if(Math.abs(dx)<4){q.dead=1;b.dead=1;const pts=b.y>140?500:b.y>90?250:100;g.score+=pts;S('boom');A.shake=4;A.burst(b.x,b.y,K.o,20,2.4);if(pts>=250){msg='+'+pts;mt=30;}}
     else if(dx<-3&&dx>-20&&b.lw>0){q.dead=1;b.lw--;g.score+=10;S('hit');A.burst(q.x,q.y,K.y,5,1.2);}else if(dx>3&&dx<20&&b.rw>0){q.dead=1;b.rw--;g.score+=10;S('hit');A.burst(q.x,q.y,K.y,5,1.2);}}}
   if(b.k==='b'&&t%300===0){if(b.lw<3)b.lw++;if(b.rw<3)b.rw++;}
   if(!b.dead&&Math.abs(b.x-px)<(b.k==='b'?12:9)&&Math.abs(b.y-(PY-6))<9){if(sh){b.dead=1;g.score+=50;S('boom');A.burst(b.x,b.y,K.c,12,2);}else if(!inv){b.dead=1;die();if(g.over)return;}}}
  birds=birds.filter(b=>!b.dead);if(ms&&birds.filter(b=>b.esc).length<3&&t%240===0)birds.push({k:'s',hx:40+rnd(240),hy:120+rnd(20),x:rnd(W),y:-20,st:'ret',t:ri(99),vx:0,vy:0,esc:1});
  if(ms){const y0=ms.y;ms.y+=.02;if(t%8===0)ms.bo=(ms.bo+1)%26;if(--ms.cd<=0){ms.cd=Math.max(22,46-Math.floor(t/600)*3);const c=ri(26);eb.push({x:MX+c*8+4,y:y0+48,vx:(px-(MX+c*8))*.004,vy:2.3});}
   for(const q of bl){if(q.dead)continue;const c=Math.floor((q.x-MX)/8);if(c<0||c>25)continue;
    if(q.y<y0+43&&q.y>y0+36&&ms.hull[1][c]){ms.hull[1][c]=0;q.dead=1;g.score+=10;S('hit');A.burst(q.x,y0+40,'#8a5ad8',6,1.2);}
    else if(q.y<y0+36&&q.y>y0+29&&ms.hull[0][c]){ms.hull[0][c]=0;q.dead=1;g.score+=10;S('hit');A.burst(q.x,y0+33,'#8a5ad8',6,1.2);}
    else if(q.y<y0+28&&q.y>y0+21&&ms.belt[(c+ms.bo)%26]){ms.belt[(c+ms.bo)%26]=0;q.dead=1;g.score+=30;S('hit');A.burst(q.x,y0+25,K.o,6,1.2);}
    else if(q.y<y0+20&&q.y>y0+2){q.dead=1;if(Math.abs(q.x-160)<7){won=140;g.score+=5000+lives*1000;S('win');A.shake=14;A.burst(160,y0+10,K.g,40,3.5);A.confetti();msg='DIRECT HIT!';mt=140;}else A.burst(q.x,q.y,'#bfa8ff',4,1);}}
   if(ms.y>150){g.over='THE MOTHERSHIP LANDED';return;}}
  bl=bl.filter(b=>!b.dead);
  for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(Math.abs(b.x-px)<(sh?16:6)&&b.y>PY-(sh?24:12)&&b.y<PY+2){b.dead=1;if(sh){A.burst(b.x,b.y,K.c,4,1);}else if(!inv){die();if(g.over)return;}}}eb=eb.filter(b=>!b.dead&&b.y<H);
  if(!ms&&!clearT&&!birds.length){clearT=90;g.score+=500*wave;msg='WAVE CLEAR! +'+500*wave;mt=80;S('win');}};
 const sbird=(x,y,col,tt)=>{const fl=Math.sin(tt*.3);P([[x-2,y],[x-11,y-3-fl*5],[x-8,y+2]],col,1);P([[x+2,y],[x+11,y-3-fl*5],[x+8,y+2]],col,1);C(x,y,4,col);R(x-2,y-2,1.5,1.5,'#ffffff');R(x+1,y-2,1.5,1.5,'#ffffff');P([[x-1,y+2],[x+1,y+2],[x,y+5]],K.y,1);};
 const bbird=(b)=>{const x=b.x,y=b.y,fl=Math.sin(b.t*.18);const FC=['#ffcf3f','#ff9838','#ff4f6d'];
  for(let s=-1;s<=1;s+=2){const n=s<0?b.lw:b.rw;for(let i=0;i<n;i++){const a=4+i*5,bb=10+i*5,yo=-fl*(2+i*2.5);P([[x+s*a,y-2+yo*.5],[x+s*bb,y-6+yo],[x+s*(bb+1),y+1+yo],[x+s*a,y+3+yo*.5]],FC[i],1);}}
  ell(x,y,5,7,'#ff4f6d');C(x,y-8,4,'#ff6a3a');R(x-3,y-9,2,2,'#ffffff');R(x+1,y-9,2,2,'#ffffff');P([[x-1,y-6],[x+1,y-6],[x,y-2]],K.y,1);P([[x-3,y+6],[x,y+13+fl*2],[x+3,y+6]],K.o,1);};
 g.draw=()=>{GX.cache('firebird_bg',()=>{GX.sky(['#04021a','#120830','#1c0a3c']);GX.glow(80,90,110,'#7a2aba',.22);GX.glow(250,170,120,'#2a4aca',.18);GX.glow(200,40,60,'#ff4f9a',.10);});for(let i=0;i<60;i++){const tw=(i*13+t)%90<4;R((i*97)%W,14+(i*53+t*(.2+(i%3)*.15))%226,tw?2:1,tw?2:1,i%4?K.gr:K.w);}
  if(ms){const y0=ms.y;ell(160,y0+18,64,18,'#4a1aa0');ell(160,y0+12,20,12,'rgba(160,255,200,.25)');C(160,y0+12,6,'#3dff8b');R(157,y0+10,2,2,'#000000');R(161,y0+10,2,2,'#000000');L(157,y0+6,154,y0+1,'#3dff8b');L(163,y0+6,166,y0+1,'#3dff8b');
   for(let c=0;c<26;c++){const x=MX+c*8;if(ms.belt[(c+ms.bo)%26])R(x,y0+22,7,6,'#ff9838');if(ms.hull[0][c])R(x,y0+30,7,6,'#8a5ad8');if(ms.hull[1][c])R(x,y0+37,7,6,'#6a3ab8');}
   P([[MX-4,y0+22],[MX-22,y0+40],[MX-4,y0+43]],'#5a2ab0',1);P([[MX+212,y0+22],[MX+230,y0+40],[MX+212,y0+43]],'#5a2ab0',1);R(84,y0+44,152,4,'#3a1a6a');for(let i=0;i<8;i++)R(90+i*19,y0+45,3,2,(t/8+i)%2<1?K.y:K.r);}
  for(const b of birds){if(b.k==='s')sbird(b.x,b.y,b.esc?K.o:wave===1?K.p:K.c,b.t);else bbird(b);}
  bl.forEach(b=>{if(lo())GX.glow(b.x,b.y,6,'#ffcf3f',.5);GX.rr(b.x-1,b.y-4,2,7,1,'#fff2a0');});eb.forEach(b=>{if(lo())GX.glow(b.x,b.y,6,'#ff4f6d',.55);GX.disc(b.x,b.y,2.4,'#ff6a80');GX.disc(b.x,b.y,1,'#ffffff');});
  if(!(inv&&inv%8<4)){if(lo())GX.glow(px,PY+5,10,'#ff9838',.6);GX.poly([[px-9,PY+3],[px-7,PY+7+rnd(3)],[px-5,PY+3]],K.o);GX.poly([[px+5,PY+3],[px+7,PY+7+rnd(3)],[px+9,PY+3]],K.o);GX.poly([[px-12,PY+3],[px-4,PY-8],[px,PY-17],[px+4,PY-8],[px+12,PY+3]],GX.lg(0,PY-17,0,PY+3,['#ffffff','#c8d0e8','#6a7090']));GX.ell(px,PY-7,3,4,GX.lg(0,PY-11,0,PY-3,['#dff4ff','#4dabff']));GX.rr(px-1,PY-19,2,5,1,'#e8e8f0');}
  if(sh){alpha(.25+.15*Math.sin(t*.5),()=>C(px,PY-6,18,'#2fd6c3'));A.ring(px,PY-6,18,'#9ff8ff');}
  hud('SCORE '+g.score,'WAVE '+wave+'/5','LIVES '+lives);R(120,17,80,3,K.d);R(120,17,80*(1-shCd/420),3,shCd?K.gr:K.c);if(!shCd&&A.t%40<30)T('SHIELD READY',160,22,K.c,1,'c');
  if(mt)banner(msg,K.y,110);};
 return g;}});

})();
