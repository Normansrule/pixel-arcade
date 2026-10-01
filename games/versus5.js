/* PIXEL ARCADE - versus5 pack: 16 head-to-head games (VS CPU with difficulty, or 2 players) */
(function(){'use strict';const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),TAU=Math.PI*2;
const PC=['#2fd6c3','#ff4f9a'],PD=['#127a70','#a0205a'],PL=['#a8fff2','#ffc0dc'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const adf=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;};
const lin=(x0,y0,x1,y1,cols)=>{const c=A.c,g=c.createLinearGradient?c.createLinearGradient(x0,y0,x1,y1):null;if(g&&g.addColorStop){cols.forEach((s,i)=>g.addColorStop(i/(cols.length-1),s));return g;}return cols[0];};
const rad=(x,y,r,cols)=>{const c=A.c,g=c.createRadialGradient?c.createRadialGradient(x,y,0,x,y,Math.max(.5,r)):null;if(g&&g.addColorStop){cols.forEach((s,i)=>g.addColorStop(i/(cols.length-1),s));return g;}return cols[cols.length-1];};
const fr=(x,y,w,h,f)=>{A.c.fillStyle=f;A.c.fillRect(x,y,w,h);};
const vg=(x,y,w,h,a,b)=>fr(x,y,w,h,lin(x,y,x,y+h,[a,b]));
const ell=(x,y,rx,ry,f,rot)=>{const c=A.c;c.fillStyle=f;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),rot||0,0,TAU);c.fill();};
const ering=(x,y,rx,ry,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),0,0,TAU);c.stroke();};
const disc=(x,y,r,f)=>{const c=A.c;c.fillStyle=f;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);c.fill();};
const arcS=(x,y,r,a0,a1,col,w)=>{const c=A.c;c.strokeStyle=col;c.lineWidth=w||1;c.beginPath();c.arc(x,y,Math.max(.1,r),a0,a1);c.stroke();};
const rr=(x,y,w,h,r,f)=>{const c=A.c;r=Math.max(0,Math.min(r,w/2,h/2));c.fillStyle=f;c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath();c.fill();};
const ga=a=>{A.c.globalAlpha=cl(a,0,1);};
const glow=(x,y,r,rgb,a)=>disc(x,y,r,rad(x,y,r,['rgba('+rgb+','+(a||.5)+')','rgba('+rgb+',0)']));
const P=(pts,col)=>A.poly(pts,col,1);
const sv=()=>A.c.save(),rs=()=>A.c.restore(),tr=(x,y,a,sx,sy)=>{A.c.translate(x,y);if(a)A.c.rotate(a);if(sx!==undefined)A.c.scale(sx,sy===undefined?sx:sy);};
/* shared HUD: top bar with player chips, score pips (or numbers) and a centre label */
const hud=(s0,s1,goal,mid)=>{ga(.86);fr(0,0,W,17,lin(0,0,0,17,['#0a0820','#1c1646']));ga(1);fr(0,17,W,1,'rgba(255,255,255,.14)');
 rr(3,3,19,11,3,PC[0]);T(A.nm(0),12.5,6,'#0a0820',1,'c',1);rr(W-22,3,19,11,3,PC[1]);T(A.nm(1),W-12.5,6,'#0a0820',1,'c',1);
 if(goal&&goal<=10){for(let i=0;i<goal;i++){disc(29+i*9,8.5,3,i<s0?PC[0]:'rgba(255,255,255,.16)');disc(W-29-i*9,8.5,3,i<s1?PC[1]:'rgba(255,255,255,.16)');}}
 else{T(s0,27,2,PC[0],2);T(s1,W-27,2,PC[1],2,'r');}
 if(mid)T(mid,160,6,'#fff3d6',1,'c',1);};
const banner=(s,col,sub,y)=>{y=y||104;ga(.5);fr(0,y-8,W,sub?40:32,'#000');ga(1);T(s,160,y,col||K.y,3,'c');if(sub)T(sub,160,y+20,K.w,1,'c');};
const ready=(w,max)=>{if(w>max*.4)banner('READY',K.w);else if(w>0)banner('GO!',K.y);};
const crowd=(n,y0,y1,seed)=>{const a=[];let s=seed||7;const r=()=>{s=(s*9301+49297)%233280;return s/233280;};for(let i=0;i<n;i++)a.push({x:r()*W,y:y0+r()*(y1-y0),c:['#ff4f6d','#ffcf3f','#4dabff','#fff3d6','#2fd6c3','#ff9838','#ff4f9a','#8d86b8'][(r()*8)|0],p:r()*6,k:['#f1c7a3','#c68a5e','#e0a57c','#9a6440'][(r()*4)|0]});return a.sort((p,q)=>p.y-q.y);};
const drawCrowd=(a,hype)=>{for(const f of a){const b=hype?Math.abs(Math.sin(A.t*.3+f.p))*3:Math.sin(A.t*.04+f.p)*.5;rr(f.x-3,f.y-b,6,6,2,f.c);disc(f.x,f.y-b-2.5,2.2,f.k);}};

/* ================= 1. HEAD SOCCER ================= */
A.add({id:'headsoccer',name:'HEAD SOCCER',cat:'VERSUS',vs:1,how:'LEFT/RIGHT RUN, UP JUMPS, A KICKS. HEAD OR BOOT IT INTO THE NET. FIRST TO 5.',make(){
 const g={over:null,score:0},G=206,BAR=150,GOAL=5;let pl,b,sc=[0,0],wait=0,cel=0,msg='',plan={tx:240},spin=0;
 const fans=crowd(170,40,122,11);
 const reset=()=>{pl=[{x:84,y:G,vx:0,vy:0,f:1,k:0,kh:0},{x:236,y:G,vx:0,vy:0,f:-1,k:0,kh:0}];b={x:160,y:70,vx:(rnd(1)-.5)*1.4,vy:0,r:7};wait=55;};reset();
 const head=p=>[p.x+p.f,p.y-31];
 const kswing=p=>p.k>0?Math.sin((14-p.k)/14*Math.PI):0;
 const foot=p=>{const s=kswing(p);return[p.x+p.f*(3+s*12),p.y-2-s*8];};
 const goal=w=>{sc[w]++;g.score=sc[0];cel=110;msg=A.nm(w)+' GOAL!';S('score');A.shake=10;A.burst(b.x,b.y,PC[w],34,3.4);};
 const cpu=()=>{const q=pl[1];if(A.t%[16,9,3][A.lvl]===0){const fx=b.x+b.vx*9;let tx=fx>q.x-6?fx+18:fx+8;if(b.x<120&&b.vx<-1)tx=Math.max(tx,180);plan.tx=tx+(rnd(2)-1)*(1-A.ai)*34;}
  const dx=plan.tx-q.x,near=Math.abs(b.x-q.x)<30,jump=near&&b.y<q.y-44&&b.y>q.y-96&&b.vy>-1.5&&Math.random()<.05+.22*A.ai;
  const kick=b.x<q.x+6&&b.x>q.x-28&&b.y>q.y-30&&q.k===0&&Math.random()<.08+.5*A.ai;A.bot({l:dx<-4,r:dx>4,u:jump,a:kick});};
 g.update=()=>{if(cel>0){cel--;b.vy+=.22;b.x+=b.vx*.5;b.y=Math.min(G-b.r,b.y+b.vy);if(cel===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}
  if(wait>0)wait--;if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i),sp=(i&&A.cpu)?2.25*(.82+.18*A.ai):2.3;p.vx+=(ax(k)*sp-p.vx)*.3;if(h.u&&p.y>=G){p.vy=-6.5;S('jump');}if(h.a&&p.k===0){p.k=14;p.kh=0;}if(p.k>0)p.k--;p.vy+=.34;p.x+=p.vx;p.y+=p.vy;if(p.y>G){p.y=G;p.vy=0;}p.x=cl(p.x,18,302);});
  const dx=pl[1].x-pl[0].x;if(Math.abs(dx)<22&&Math.abs(pl[1].y-pl[0].y)<40){const o=(22-Math.abs(dx))/2*(dx>=0?1:-1);pl[0].x=cl(pl[0].x-o,18,302);pl[1].x=cl(pl[1].x+o,18,302);}
  if(wait>0)return;
  b.vy+=.22;b.vx*=.996;b.x+=b.vx;b.y+=b.vy;spin+=b.vx*.09;
  if(b.y>G-b.r){b.y=G-b.r;if(b.vy>1.5)S('hit');b.vy=-b.vy*.68;if(Math.abs(b.vy)<.9)b.vy=0;b.vx*=.97;}
  if(b.y<22+b.r){b.y=22+b.r;b.vy=Math.abs(b.vy)*.8;}
  if(b.x<b.r&&b.y<BAR){b.x=b.r;b.vx=Math.abs(b.vx)*.8;}if(b.x>W-b.r&&b.y<BAR){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.8;}
  for(const[x1,x2]of[[0,26],[294,320]]){const cx=cl(b.x,x1,x2),ddx=b.x-cx,ddy=b.y-BAR,d=Math.hypot(ddx,ddy);if(d<b.r+2.5&&d>0){const nx=ddx/d,ny=ddy/d;b.x=cx+nx*(b.r+2.5);b.y=BAR+ny*(b.r+2.5);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.75*vn*nx;b.vy-=1.75*vn*ny;S('hit');}}}
  if(b.y<BAR&&b.y>BAR-14&&(b.x<32||b.x>288)&&Math.abs(b.vx)<.4)b.vx+=b.x<160?.2:-.2;
  pl.forEach((p,i)=>{const[hx,hy]=head(p);let ddx=b.x-hx,ddy=b.y-hy,d=Math.hypot(ddx,ddy);if(d<b.r+13&&d>0){const nx=ddx/d,ny=ddy/d;b.x=hx+nx*(b.r+13);b.y=hy+ny*(b.r+13);const vn=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(vn<0){b.vx-=1.55*vn*nx;b.vy-=1.55*vn*ny;b.vx+=p.vx*.35;b.vy+=Math.min(0,p.vy)*.45;if(-vn>2)S('hit');}}
   const bx=cl(b.x,p.x-7,p.x+7),by=cl(b.y,p.y-18,p.y);ddx=b.x-bx;ddy=b.y-by;d=Math.hypot(ddx,ddy);if(d<b.r&&d>0){const nx=ddx/d,ny=ddy/d;b.x=bx+nx*b.r;b.y=by+ny*b.r;const vn=(b.vx-p.vx)*nx+(b.vy-p.vy)*ny;if(vn<0){b.vx-=1.4*vn*nx;b.vy-=1.4*vn*ny;}}
   if(p.k>=3&&p.k<=11&&!p.kh){const[fx,fy]=foot(p);if(Math.hypot(b.x-fx,b.y-fy)<b.r+8){p.kh=1;b.vx=p.f*7.4+p.vx*.4;b.vy=b.y>p.y-10?-4.6:-2.6;S('shoot');A.burst(b.x,b.y,'#ffffff',8,1.6);A.shake=3;}}});
  const s=Math.hypot(b.vx,b.vy);if(s>10){b.vx*=10/s;b.vy*=10/s;}
  if(b.x<13&&b.y>BAR+3)goal(1);else if(b.x>307&&b.y>BAR+3)goal(0);};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const net=(x0,d)=>{ga(.18);fr(d>0?x0:x0-26,BAR,26,G-BAR,'#ffffff');ga(1);for(let y=BAR+5;y<G;y+=6)L(x0,y,x0+d*24,y,'rgba(255,255,255,.35)');for(let x=4;x<26;x+=5)L(x0+d*x,BAR,x0+d*x,G,'rgba(255,255,255,.35)');};
 const player=(p,i)=>{const[hx,hy]=head(p),col=PC[i],dk=PD[i],skin=i?'#c68a5e':'#f1c7a3',hair=i?'#1a1a1a':'#8a3a1a',f=p.f,s=kswing(p),run=Math.abs(p.vx)>.4&&p.y>=G?Math.sin(A.t*.45+i*2):0;
  const air=G-p.y;ell(p.x,G+1,11-Math.min(6,air/10),2.4,'rgba(0,0,0,.3)');
  L(p.x-f*2,p.y-10,p.x-f*2-run*4,p.y-2,'#e8e8f0',3.6);ell(p.x-f*2-run*4+f,p.y-1,3.4,2,'#111111');
  const[fx,fy]=foot(p);L(p.x+f*2,p.y-10,fx+run*3*(1-s),fy,'#e8e8f0',3.6);ell(fx+run*3*(1-s)+f*1.5,fy+.5,3.6,2.2,'#111111');
  rr(p.x-6,p.y-13,12,5,2,'#fff3d6');rr(p.x-6.5,p.y-21,13,10,3,col);fr(p.x-1,p.y-21,2,8,'rgba(255,255,255,.35)');
  L(p.x-f*6,p.y-19,p.x-f*9,p.y-12+run*2,col,3);L(p.x+f*6,p.y-19,p.x+f*9,p.y-13-run*2,col,3);
  C(hx,hy,13.5,skin);disc(hx-f*8,hy+1,3,skin);
  A.c.fillStyle=hair;A.c.beginPath();A.c.arc(hx,hy-1,14,Math.PI*1.02,Math.PI*1.98);A.c.fill();ell(hx-f*9,hy-4,5,7,hair);
  arcS(hx,hy-1,13,Math.PI*(f>0?1.25:1.1),Math.PI*(f>0?1.9:1.75),col,3);
  const ex=hx+f*5,ey=hy-1,ang=Math.atan2(b.y-ey,b.x-ex);ell(ex-f*7,ey,2.6,3.6,'#ffffff');ell(ex,ey,3.6,4.4,'#ffffff');disc(ex+Math.cos(ang)*1.6,ey+Math.sin(ang)*2,2,'#15151f');disc(ex-f*7+Math.cos(ang)*1.2,ey+Math.sin(ang)*1.5,1.5,'#15151f');
  L(ex-3.5,ey-6+(cel&&sc[i]?-1:0),ex+3.5,ey-6.5,'#2a1a10',1.4);ell(hx+f*6,hy+7,p.k||cel?3:2.5,p.k||cel?2.4:1,'#7a2a2a');};
 g.draw=()=>{vg(0,0,W,124,'#070d30','#27367e');
  for(const lx of[34,286]){fr(lx-1,16,3,30,'#2a2a3a');rr(lx-11,10,22,9,2,'#c8c8d8');for(let j=0;j<4;j++)disc(lx-7+j*4.6,14.5,1.7,'#fffbe0');glow(lx,15,46,'255,250,210',.28);}
  for(let r=0;r<6;r++)fr(0,36+r*15,W,15,r%2?'#1b2050':'#222a62');drawCrowd(fans,cel>0);
  const ads=['PIXEL','ARCADE','HEADS','KICK!','GOAL'];for(let i=0;i<8;i++){fr(i*40,122,40,14,lin(0,122,0,136,[i%2?'#e0305a':'#1a6ad0',i%2?'#8a1030':'#0a3a80']));T(ads[(i+(A.t>>6))%5],i*40+20,127,'#fff3d6',1,'c',1);}
  for(let i=0;i<8;i++)fr(i*40,136,40,104,i%2?'#2c9a3c':'#35a848');vg(0,136,W,20,'rgba(0,0,0,.25)','rgba(0,0,0,0)');
  L(160,136,160,240,'rgba(255,255,255,.55)',1.5);ering(160,G+6,46,9,'rgba(255,255,255,.5)',1.5);L(0,G+1,W,G+1,'rgba(255,255,255,.4)');L(70,G+1,40,240,'rgba(255,255,255,.45)');L(250,G+1,280,240,'rgba(255,255,255,.45)');
  net(0,1);net(320,-1);
  const air=G-b.y;ell(b.x,G+1,b.r-Math.min(4,air/25),2,'rgba(0,0,0,.3)');
  pl.forEach(player);
  C(b.x,b.y,b.r,'#f4f4f4');for(let j=0;j<5;j++){const a=spin+j*1.2566;disc(b.x+Math.cos(a)*4.2,b.y+Math.sin(a)*4.2,1.6,'#22222a');}disc(b.x,b.y,2,'#22222a');
  for(const[x,d]of[[0,1],[320,-1]]){fr(d>0?0:294,BAR-2,26,4,'#ffffff');fr(d>0?24:294,BAR,2,G-BAR,'#e8e8f0');fr(d>0?0:318,BAR,2,G-BAR,'#b8b8c8');}
  hud(sc[0],sc[1],GOAL,'FIRST TO 5');if(cel)banner(msg,PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,55);};
 return g;}});

/* ================= 2. KNOCK OFF ================= */
A.add({id:'knockoff',name:'KNOCK OFF',cat:'VERSUS',vs:1,how:'ARROWS SLIDE, A DASHES. BUMP YOUR RIVAL OFF THE SHRINKING ICE. FIRST TO 5.',make(){
 const g={over:null,score:0},CX=160,CY=136,SQ=.6,GOAL=5,R0=98;let pl,sc=[0,0],Rr=R0,t=0,wait=0,end=0,msg='',chunks=[],trail=[],cracks=[],plan={x:0,y:0,e:0};
 const snow=[];for(let i=0;i<40;i++)snow.push({x:rnd(W),y:rnd(H),s:.3+rnd(.8)});
 const reset=()=>{pl=[{x:-52,y:0,vx:0,vy:0,cd:30,dash:0,f:0,fx:1,fy:0,bl:0},{x:52,y:0,vx:0,vy:0,cd:30,dash:0,f:0,fx:-1,fy:0,bl:0}];Rr=R0;t=0;wait=60;end=0;chunks=[];trail=[];cracks=[];for(let i=0;i<9;i++){const a=rnd(TAU),r0=30+rnd(40);cracks.push([a,r0,a+rnd(.5)-.25,r0+14+rnd(20)]);}};reset();
 const scr=(x,y)=>[CX+x,CY+y*SQ];
 const cpu=()=>{const q=pl[1],o=pl[0],dq=Math.hypot(q.x,q.y),od=Math.hypot(o.x,o.y)||1;if(A.t%24===0)plan.e=(rnd(2)-1)*(1-A.ai)*34;
  let tx,ty,dash=false;if(dq>Rr-26){tx=0;ty=0;}else if(dq<od+6){tx=o.x+o.vx*6+plan.e;ty=o.y+o.vy*6;const d=Math.hypot(o.x-q.x,o.y-q.y);dash=d<48&&q.cd===0&&dq<Rr-34&&Math.random()<.03+.1*A.ai;}else{tx=o.x-o.x/od*28+plan.e;ty=o.y-o.y/od*28;}
  let vx=tx-q.x,vy=ty-q.y;const m=Math.hypot(vx,vy)||1;vx=vx/m*2.4-q.vx;vy=vy/m*2.4-q.vy;A.bot({l:vx<-.25,r:vx>.25,u:vy<-.25,d:vy>.25,a:dash});};
 g.update=()=>{if(end>0){end--;pl.forEach(p=>{if(p.f>0){p.f++;p.x+=p.vx*.4;p.y+=p.vy*.4;}});if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}
  if(wait>0){wait--;return;}t++;
  if(t>150&&Rr>34){Rr-=.045;if(t%4===0)chunks.push({a:rnd(TAU),r:Rr+3,t:0,s:2+rnd(4)});}chunks.forEach(c=>c.t++);chunks=chunks.filter(c=>c.t<60);
  if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i);let ix=ax(k),iy=ay(k);const m=Math.hypot(ix,iy)||1;ix/=m;iy/=m;const acc=(i&&A.cpu)?.09*(.78+.22*A.ai):.09;p.vx+=ix*acc;p.vy+=iy*acc;if(ix||iy){p.fx=ix;p.fy=iy;}
   if(p.cd>0)p.cd--;if(p.dash>0)p.dash--;if(p.bl>0)p.bl--;if(h.a&&p.cd===0){p.vx+=p.fx*3.3;p.vy+=p.fy*3.3;p.cd=70;p.dash=16;S('jump');const[sx,sy]=scr(p.x,p.y);A.burst(sx,sy,'#dff4ff',10,1.6);}
   p.vx*=.986;p.vy*=.986;const sp=Math.hypot(p.vx,p.vy),mx=p.dash?6.2:3.4;if(sp>mx){p.vx*=mx/sp;p.vy*=mx/sp;}p.x+=p.vx;p.y+=p.vy;});
  const a=pl[0],b=pl[1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<24&&d>0){const nx=dx/d,ny=dy/d,o=(24-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(rv<0){const fa=(b.dash?1.45:1)*(a.dash?.55:1),fb=(a.dash?1.45:1)*(b.dash?.55:1);a.vx+=rv*nx*fa;a.vy+=rv*ny*fa;b.vx-=rv*nx*fb;b.vy-=rv*ny*fb;if(-rv>1){S('hit');a.bl=b.bl=10;const[sx,sy]=scr((a.x+b.x)/2,(a.y+b.y)/2);A.burst(sx,sy-6,'#ffffff',8+(-rv*4|0),1.5+(-rv)*.4);A.shake=Math.min(8,-rv*2|0);}}}
  if(t%3===0)pl.forEach((p,i)=>trail.push({x:p.x,y:p.y,i,t:40}));trail.forEach(q=>q.t--);trail=trail.filter(q=>q.t>0);
  const out=pl.map(p=>Math.hypot(p.x,p.y)>Rr);if(out[0]||out[1]){out.forEach((o,i)=>{if(o){pl[i].f=1;const[sx,sy]=scr(pl[i].x,pl[i].y);A.burst(sx,sy+6,'#9fd8ff',26,2.6);}});S('boom');
   if(out[0]&&out[1])msg='DOUBLE DROP!';else{const w=out[0]?1:0;sc[w]++;g.score=sc[0];msg=A.nm(w)+' SCORES!';}end=100;}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const puck=(p,i)=>{let[sx,sy]=scr(p.x,p.y);if(p.f>0){sy+=Math.min(30,p.f*.6);ga(1-p.f/70);}const col=PC[i];
  if(!p.f)ell(sx+2,sy+4,14,8,'rgba(0,0,0,.28)');ell(sx,sy+3,13,8,PD[i]);fr(sx-13,sy-2,26,5,PD[i]);ell(sx,sy-2,13,8,rad(sx-4,sy-5,16,[PL[i],col,PD[i]]));ering(sx,sy-2,9,5.4,'rgba(255,255,255,.55)',1.2);
  const ex=p.fx*3,ey=p.fy*1.6;ell(sx-3.5+ex,sy-3+ey,2.4,2.8,'#ffffff');ell(sx+3.5+ex,sy-3+ey,2.4,2.8,'#ffffff');disc(sx-3.5+ex*1.3,sy-3+ey*1.3,1.3,'#111');disc(sx+3.5+ex*1.3,sy-3+ey*1.3,1.3,'#111');
  if(p.bl>0){L(sx-6+ex,sy-7,sx-2+ex,sy-6,'#111',1);L(sx+6+ex,sy-7,sx+2+ex,sy-6,'#111',1);}
  if(p.dash>0){ga(p.dash/16);ering(sx,sy-2,17,10,'#ffffff',2);ga(1);}if(p.cd>0&&!p.f)arcS(sx,sy-2,16,-1.57,-1.57+TAU*(1-p.cd/70),'rgba(255,255,255,.5)',1.5);ga(1);};
 g.draw=()=>{vg(0,0,W,H,'#0b2f52','#020d1c');
  for(let i=0;i<3;i++){ga(.16);A.c.fillStyle=lin(0,20+i*10,W,40,['#3dff8b','#4dabff','#ff4f9a']);A.c.beginPath();A.c.moveTo(0,30+i*9);for(let x=0;x<=W;x+=20)A.c.lineTo(x,30+i*9+Math.sin(x*.03+A.t*.02+i)*8);A.c.lineTo(W,48+i*9);A.c.lineTo(0,48+i*9);A.c.fill();}ga(1);
  for(const[x,w,h]of[[20,40,18],[250,56,22],[120,24,10]]){P([[x,70],[x+w*.4,70-h],[x+w*.7,70-h*.6],[x+w,70]],'#cfe8f6');P([[x+w*.4,70-h],[x+w*.7,70-h*.6],[x+w,70],[x+w*.55,70]],'#8fb8d4');}
  fr(0,70,W,1,'rgba(255,255,255,.3)');for(let j=0;j<14;j++){const y=78+j*12,o=(A.t*.3+j*23)%60;for(let x=-60+o;x<W;x+=60)L(x,y,x+22,y,'rgba(150,210,255,'+(.08+j*.012)+')',1);}
  ell(CX,CY+14,Rr+2,(Rr+2)*SQ,'rgba(0,0,0,.35)');ell(CX,CY+9,Rr,Rr*SQ,'#2a6a94');fr(CX-Rr,CY,Rr*2,9,'#5a9ec4');ell(CX,CY,Rr,Rr*SQ,rad(CX-20,CY-14,Rr*1.3,['#ffffff','#dff2ff','#a8d4ee']));
  ering(CX,CY,Rr*.62,Rr*.62*SQ,'rgba(255,79,109,.45)',3);ering(CX,CY,Rr*.34,Rr*.34*SQ,'rgba(77,171,255,.5)',3);disc(CX,CY,3,'rgba(255,79,109,.6)');
  for(const c of cracks)if(c[3]<Rr)L(CX+Math.cos(c[0])*c[1],CY+Math.sin(c[0])*c[1]*SQ,CX+Math.cos(c[2])*c[3],CY+Math.sin(c[2])*c[3]*SQ,'rgba(90,150,190,.6)',1);
  ering(CX,CY,Rr-1,(Rr-1)*SQ,'rgba(255,255,255,.8)',1.5);if(Rr<R0&&t%20<10&&!end)ering(CX,CY,Rr-5,(Rr-5)*SQ,'rgba(255,79,109,.5)',1);
  for(const c of chunks){const x=CX+Math.cos(c.a)*c.r,y=CY+Math.sin(c.a)*c.r*SQ+c.t*.5;ga(1-c.t/60);P([[x-c.s,y],[x,y-c.s*.6],[x+c.s,y+1],[x,y+c.s*.5]],'#dff2ff');ga(1);}
  for(const q of trail){const[x,y]=scr(q.x,q.y);ga(q.t/100);disc(x,y+4,1.5,q.i?'#ffb0d0':'#a0fff0');}ga(1);
  const ord=[0,1].sort((i,j)=>pl[i].y-pl[j].y);ord.forEach(i=>puck(pl[i],i));
  for(const s of snow){s.y+=s.s;s.x+=Math.sin(A.t*.02+s.s*9)*.3;if(s.y>H){s.y=0;s.x=rnd(W);}fr(s.x,s.y,1.4,1.4,'rgba(255,255,255,.7)');}
  hud(sc[0],sc[1],GOAL,'FIRST TO 5');if(end)banner(msg,msg[0]==='D'?K.w:PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,60);};
 return g;}});

/* ================= 3. MARBLE MUNCH ================= */
A.add({id:'marblemunch',name:'MARBLE MUNCH',cat:'VERSUS',vs:1,how:'UP/DOWN SLIDE YOUR HIPPO, A CHOMPS. GOLD MARBLES COUNT 3. MOST MARBLES WINS.',make(){
 const g={over:null,score:0},TX0=70,TX1=250,TY0=30,TY1=228,TOT=46,REACH=66,MR=4.2,CH=22;let hp=[{y:129,c:0,cd:0,gulp:0},{y:129,c:0,cd:0,gulp:0}],mb=[],sc=[0,0],rel=0,wait=50,end=0,plan={y:129,t:0},spin=0;
 const COLS=['#ff4f6d','#4dabff','#3dff8b','#ff9838','#b86bff','#fff3d6'];
 const ext=h=>h.c>0?Math.sin(Math.PI*h.c/CH)*REACH:0;
 const tip=(h,i)=>i?TX1+8-ext(h):TX0-8+ext(h);
 const cpu=()=>{const q=hp[1];let chomp=false;if(A.t%[18,9,4][A.lvl]===0){let best=null,bd=1e9;for(const m of mb){const px=m.x+m.vx*12,py=m.y+m.vy*12;if(px<TX1-REACH-6)continue;const d=Math.abs(py-q.y)-(m.gold?30:0)-(px-160)*.3;if(d<bd){bd=d;best=py;}}plan.y=best!==null?best+(rnd(2)-1)*(1-A.ai)*24:129;}
  if(q.c===0&&q.cd===0){for(const m of mb){const px=m.x+m.vx*9,py=m.y+m.vy*9;if(px>TX1-REACH+2&&Math.abs(py-q.y)<10){chomp=Math.random()<.12+.45*A.ai;break;}}if(!chomp&&Math.random()<.004*(1-A.ai))chomp=true;}
  A.bot({u:plan.y<q.y-3,d:plan.y>q.y+3,a:chomp});};
 g.update=()=>{spin+=.05;if(end>0){if(--end===0)g.over=sc[0]===sc[1]?'DRAW!':A.win(sc[0]>sc[1]?0:1);return;}if(wait>0){wait--;return;}
  if(rel<TOT&&A.t%20===0&&mb.length<24){const a=rnd(TAU),s=1.8+rnd(1.2);mb.push({x:160+Math.cos(a)*14,y:129+Math.sin(a)*14,vx:Math.cos(a)*s,vy:Math.sin(a)*s,c:COLS[ri(6)],gold:Math.random()<.12});rel++;S('blip');}
  if(A.cpu)cpu();
  hp.forEach((h,i)=>{const k=A.in(i),hi=A.hit(i);if(h.gulp>0)h.gulp--;if(h.c>0){h.c++;if(h.c>=7&&h.c<=14){const x0=i?TX1-2:TX0+2,x1=tip(h,i);for(const m of mb){if(m.dead)continue;if(m.x>=Math.min(x0,x1)-MR&&m.x<=Math.max(x0,x1)+MR&&Math.abs(m.y-h.y)<11){m.dead=1;sc[i]+=m.gold?3:1;h.gulp=20;S(m.gold?'score':'coin');A.burst(m.x,m.y,m.gold?K.y:m.c,m.gold?14:6,1.6);}}}if(h.c>=CH){h.c=0;h.cd=6;}}
   else{if(h.cd>0)h.cd--;const sp=(i&&A.cpu)?2.7*(.72+.28*A.ai):2.7;h.y=cl(h.y+ay(k)*sp,TY0+14,TY1-14);if(hi.a&&h.cd===0){h.c=1;S('hit');}}});
  mb=mb.filter(m=>!m.dead);g.score=sc[0];
  for(const m of mb){m.vx+=(rnd(1)-.5)*.07;m.vy+=(rnd(1)-.5)*.07;const s=Math.hypot(m.vx,m.vy);if(s<.6){m.vx*=1.06;m.vy*=1.06;}if(s>4){m.vx*=.96;m.vy*=.96;}m.vx*=.994;m.vy*=.994;m.x+=m.vx;m.y+=m.vy;
   if(m.x<TX0+MR){m.x=TX0+MR;m.vx=Math.abs(m.vx)*.9;}if(m.x>TX1-MR){m.x=TX1-MR;m.vx=-Math.abs(m.vx)*.9;}if(m.y<TY0+MR){m.y=TY0+MR;m.vy=Math.abs(m.vy)*.9;}if(m.y>TY1-MR){m.y=TY1-MR;m.vy=-Math.abs(m.vy)*.9;}
   const dx=m.x-160,dy=m.y-129,d=Math.hypot(dx,dy);if(d<13+MR&&d>0){m.x=160+dx/d*(13+MR);m.y=129+dy/d*(13+MR);const vn=m.vx*dx/d+m.vy*dy/d;if(vn<1.6){m.vx+=dx/d*(1.6-vn);m.vy+=dy/d*(1.6-vn);}}}
  for(let i=0;i<mb.length;i++)for(let j=i+1;j<mb.length;j++){const a=mb[i],b=mb[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<MR*2&&d>0){const nx=dx/d,ny=dy/d,o=(MR*2-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;if(rv<0){a.vx+=rv*nx;a.vy+=rv*ny;b.vx-=rv*nx;b.vy-=rv*ny;}}}
  if(rel>=TOT&&!mb.length)end=60;};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const hippo=(h,i)=>{const d=i?-1:1,col=PC[i],dk=PD[i],y=h.y,tx=tip(h,i),open=h.c>0&&h.c<10?Math.sin(Math.PI*h.c/10)*9:h.c>=10&&h.c<14?2:0,bx=i?W-22:22,g2=h.gulp>0?Math.sin(h.gulp*.8)*1.5:0;
  ell(bx+d*2,y+4,26,28,'rgba(0,0,0,.3)');ell(bx,y,24+g2,27+g2,rad(bx-d*6,y-8,34,[PL[i],col,dk]));disc(bx-d*10,y-20,5,dk);disc(bx-d*10,y+20,5,dk);
  const hx=tx-d*14,nx0=Math.min(bx,hx),nw=Math.abs(hx-bx);fr(nx0,y-10,nw,20,lin(0,y-10,0,y+10,[PL[i],col,dk]));for(let x=bx+d*16;d>0?x<hx-4:x>hx+4;x+=d*7)fr(x,y-9,1.5,18,'rgba(0,0,0,.18)');
  if(open>0){ell(hx+d*6,y,12,6+open,'#6a1020');ell(hx+d*8,y,8,3+open*.6,'#c03040');for(let j=0;j<3;j++){fr(hx+d*(4+j*4)-1,y-5-open,2.2,3,'#ffffff');fr(hx+d*(4+j*4)-1,y+3+open,2.2,3,'#ffffff');}}
  ell(hx+d*6,y-open,13,8.5,rad(hx,y-open-5,16,[PL[i],col,dk]));ell(hx+d*6,y+open,12,6,dk);ell(hx+d*6,y+open-1,12,5.5,col);
  disc(hx+d*13,y-open-3,1.4,dk);disc(hx+d*13,y-open+2,1.4,dk);
  disc(hx-d*4,y-8-open*.5,4.2,'#ffffff');disc(hx-d*4,y+8+open*.5,4.2,'#ffffff');disc(hx-d*3,y-8-open*.5,2,'#111');disc(hx-d*3,y+8+open*.5,2,'#111');ell(hx-d*9,y-11-open*.5,2.4,1.6,dk);ell(hx-d*9,y+11+open*.5,2.4,1.6,dk);
  disc(bx-d*4,y-12,3,PL[i]);disc(bx+d*2,y+10,2,PL[i]);};
 g.draw=()=>{vg(0,0,W,H,'#6a3a1e','#3a1e0c');for(let y=18;y<H;y+=14){fr(0,y,W,1,'rgba(0,0,0,.25)');for(let x=(y*7)%60;x<W;x+=60)fr(x,y,1,14,'rgba(0,0,0,.2)');}
  rr(TX0-12,TY0-12,TX1-TX0+24,TY1-TY0+24,14,'#c89018');rr(TX0-10,TY0-10,TX1-TX0+20,TY1-TY0+20,12,lin(0,TY0,0,TY1,['#ffe060','#e0a020']));rr(TX0-2,TY0-2,TX1-TX0+4,TY1-TY0+4,6,'#8a5a0a');
  fr(TX0,TY0,TX1-TX0,TY1-TY0,rad(160,129,140,['#3ab86a','#1f8a4a','#0f5a30']));for(let x=TX0+12;x<TX1;x+=18)fr(x,TY0,1,TY1-TY0,'rgba(255,255,255,.05)');
  for(let i=0;i<2;i++){const x=i?TX1-REACH:TX0+REACH;for(let y=TY0+4;y<TY1;y+=8)fr(x,y,1,4,'rgba(255,255,255,.18)');}
  ell(160,131,15,15,'rgba(0,0,0,.3)');C(160,129,13,'#ffcf3f');for(let j=0;j<4;j++){const a=spin+j*1.57;L(160,129,160+Math.cos(a)*11,129+Math.sin(a)*11,'#c87a10',2);}C(160,129,4,'#ff4f6d');
  for(const m of mb){ell(m.x+1,m.y+2,MR,MR*.6,'rgba(0,0,0,.3)');if(m.gold)glow(m.x,m.y,9,'255,210,60',.6);C(m.x,m.y,MR,m.gold?'#ffcf3f':m.c);disc(m.x-1.3,m.y-1.4,1.1,'rgba(255,255,255,.85)');}
  hippo(hp[0],0);hippo(hp[1],1);
  hud(sc[0],sc[1],0,'MARBLES LEFT '+(TOT-rel+mb.length));if(end)banner(sc[0]===sc[1]?'DRAW!':A.nm(sc[0]>sc[1]?0:1)+' WINS!',K.y);else ready(wait,50);};
 return g;}});

/* ================= 4. STAR DUEL ================= */
A.add({id:'spacewar',name:'STAR DUEL',cat:'VERSUS',vs:1,how:'LEFT/RIGHT TURN, UP THRUSTS, A FIRES, B HYPERSPACE. AVOID THE STAR. FIRST TO 5.',make(){
 const g={over:null,score:0},SX=160,SY=129,Y0=18,HH=H-Y0,GOAL=5,GM=140;let sh,bl=[],sc=[0,0],wait=0,end=0,msg='',aimE=0;
 const stars=[];for(let i=0;i<110;i++)stars.push({x:rnd(W),y:Y0+rnd(HH),b:.3+rnd(.7),p:rnd(6)});
 const wd=(d,m)=>d>m/2?d-m:d<-m/2?d+m:d;
 const reset=()=>{sh=[{x:60,y:SY,vx:0,vy:-1.12,a:-Math.PI/2,alive:1,hy:0,ch:3,th:0},{x:260,y:SY,vx:0,vy:1.12,a:Math.PI/2,alive:1,hy:0,ch:3,th:0}];bl=[];wait=60;};reset();
 const grav=(o,cap)=>{const dx=SX-o.x,dy=SY-o.y,d2=dx*dx+dy*dy,d=Math.sqrt(d2)||1,ac=Math.min(cap,GM/d2);o.vx+=ac*dx/d;o.vy+=ac*dy/d;return d;};
 const wrap=o=>{if(o.x<0)o.x+=W;if(o.x>=W)o.x-=W;if(o.y<Y0)o.y+=HH;if(o.y>=H)o.y-=HH;};
 const kill=i=>{const s=sh[i];if(!s.alive)return;s.alive=0;S('boom');A.shake=9;A.burst(s.x,s.y,PC[i],30,3);A.burst(s.x,s.y,'#ffcf3f',18,2);};
 const cpu=()=>{const q=sh[1],o=sh[0];if(!q.alive||q.hy){A.bot({});return;}if(A.t%40===0)aimE=(rnd(2)-1)*(1-A.ai)*.5;
  let x=q.x,y=q.y,vx=q.vx,vy=q.vy,md=1e9;for(let s=0;s<32;s++){const dx=SX-x,dy=SY-y,d2=dx*dx+dy*dy,d=Math.sqrt(d2),ac=Math.min(.3,GM/d2);vx+=ac*dx/d;vy+=ac*dy/d;x+=vx;y+=vy;md=Math.min(md,d);}
  let want=q.a,thr=false,fire=false,hyp=false;const rx=q.x-SX,ry=q.y-SY;
  if(md<26){const cr=rx*q.vy-ry*q.vx;want=Math.atan2(ry,rx)+(cr>=0?1:-1)*1.1;thr=true;if(Math.hypot(rx,ry)<28&&q.ch>0&&Math.random()<.08*A.ai)hyp=true;}
  else if(o.alive&&!o.hy){let dx=wd(o.x-q.x,W),dy=wd(o.y-q.y,HH);const d=Math.hypot(dx,dy),tt=d/5;dx+=(o.vx-q.vx)*tt;dy+=(o.vy-q.vy)*tt;want=Math.atan2(dy,dx)+aimE;const sp=Math.hypot(q.vx,q.vy),da=Math.abs(adf(want,q.a));thr=sp<1.1&&da<.8;fire=da<.1+(1-A.ai)*.2&&d<175&&Math.random()<.25+.55*A.ai;}
  const da=adf(want,q.a);A.bot({l:da<-.05,r:da>.05,u:thr,a:fire,b:hyp});};
 g.update=()=>{if(end>0){end--;bl.forEach(b=>{b.x+=b.vx;b.y+=b.vy;wrap(b);b.t--;});bl=bl.filter(b=>b.t>0);if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}
  if(wait>0){wait--;return;}if(A.cpu)cpu();
  sh.forEach((s,i)=>{if(!s.alive)return;const k=A.in(i),h=A.hit(i);if(s.hy>0){if(--s.hy===0){let x,y;do{x=20+rnd(W-40);y=Y0+20+rnd(HH-40);}while(Math.hypot(x-SX,y-SY)<75);s.x=x;s.y=y;s.vx*=.3;s.vy*=.3;A.burst(x,y,PL[i],16,2);S('coin');}return;}
   const rot=(i&&A.cpu)?.07*(.8+.2*A.ai):.07;s.a+=ax(k)*rot;s.th=k.u?1:0;if(k.u){s.vx+=Math.cos(s.a)*.06;s.vy+=Math.sin(s.a)*.06;}
   if(h.b&&s.ch>0){s.ch--;s.hy=45;A.burst(s.x,s.y,PL[i],16,2);S('blip');return;}
   if(A.fire(13,i)&&bl.filter(b=>b.o===i).length<4){bl.push({x:s.x+Math.cos(s.a)*9,y:s.y+Math.sin(s.a)*9,vx:s.vx+Math.cos(s.a)*4.2,vy:s.vy+Math.sin(s.a)*4.2,o:i,t:75});S('shoot');}
   const d=grav(s,.3);const sp=Math.hypot(s.vx,s.vy);if(sp>4.2){s.vx*=4.2/sp;s.vy*=4.2/sp;}s.x+=s.vx;s.y+=s.vy;wrap(s);if(d<11)kill(i);});
  for(const b of bl){b.x+=b.vx;b.y+=b.vy;wrap(b);b.t--;if(Math.hypot(b.x-SX,b.y-SY)<11)b.t=0;sh.forEach((s,i)=>{if(i!==b.o&&s.alive&&!s.hy&&b.t>0&&Math.hypot(wd(b.x-s.x,W),wd(b.y-s.y,HH))<8){b.t=0;kill(i);}});}bl=bl.filter(b=>b.t>0);
  const d0=!sh[0].alive,d1=!sh[1].alive;if(d0||d1){if(d0&&d1)msg='BOTH DESTROYED';else{const w=d0?1:0;sc[w]++;g.score=sc[0];msg=A.nm(w)+' SCORES!';}end=100;}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const ship=(s,i)=>{if(!s.alive)return;if(s.hy>0){ga(s.hy/45);ering(s.x,s.y,(45-s.hy)*.6+4,(45-s.hy)*.6+4,PL[i],1.5);ga(1);return;}sv();tr(s.x,s.y,s.a);const col=PC[i],dk=PD[i];
  if(s.th){const fl=6+rnd(5);P([[-6,-2.5],[-6-fl,0],[-6,2.5]],'#ffcf3f');P([[-6,-1.3],[-6-fl*.6,0],[-6,1.3]],'#ffffff');}
  if(i===0){P([[12,0],[-6,-3.5],[-8,-7],[-5,0],[-8,7],[-6,3.5]],dk);P([[12,0],[-6,-2.5],[-4,0],[-6,2.5]],col);P([[6,0],[1,-1.5],[1,1.5]],'#dffcff');}
  else{P([[10,0],[-7,-8],[-4,0],[-7,8]],dk);P([[10,0],[-5,-6],[-3,0],[-5,6]],col);P([[5,0],[0,-2],[0,2]],'#ffe0f0');}
  rs();};
 g.draw=()=>{vg(0,0,W,H,'#03020e','#0b0a2e');glow(70,70,90,'120,60,200',.22);glow(260,190,100,'40,160,200',.16);glow(240,60,60,'255,79,154',.12);
  for(const s of stars){ga(s.b*(.6+.4*Math.sin(A.t*.05+s.p)));fr(s.x,s.y,1,1,'#ffffff');}ga(1);
  for(let r=30;r<130;r+=24)ering(SX,SY,r,r,'rgba(255,200,120,'+(.08-r*.0005)+')',1);
  glow(SX,SY,60,'255,190,90',.35);glow(SX,SY,30,'255,240,200',.7);for(let j=0;j<8;j++){const a=A.t*.01+j*.785,l=16+Math.sin(A.t*.1+j)*5;L(SX+Math.cos(a)*8,SY+Math.sin(a)*8,SX+Math.cos(a)*l,SY+Math.sin(a)*l,'rgba(255,230,160,.7)',1.5);}C(SX,SY,9,'#fff0b0');
  for(const b of bl){glow(b.x,b.y,5,b.o?'255,120,190':'120,255,240',.6);disc(b.x,b.y,1.4,'#ffffff');}
  sh.forEach(ship);
  hud(sc[0],sc[1],GOAL,'FIRST TO 5');for(let i=0;i<2;i++)for(let j=0;j<3;j++){const x=i?W-80-j*7:80+j*7;P([[x,5],[x+2.5,8.5],[x,12],[x-2.5,8.5]],j<sh[i].ch?PL[i]:'rgba(255,255,255,.15)');}
  if(end)banner(msg,msg[0]==='B'?K.w:PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,60);};
 return g;}});

/* ================= 5. SHEEP PUSH ================= */
A.add({id:'sheeppush',name:'SHEEP PUSH',cat:'VERSUS',vs:1,how:'UP/DOWN PICK A LANE, A SENDS A SHEEP. BIG SHEEP PUSH HARDER. FIRST TO 30.',make(){
 const g={over:null,score:0},LY=42,LH=37,X0=40,X1=280,GOAL=30,RW=[5.5,7.5,9.5],SP=[.72,.58,.46];let sh=[],sc=[0,0],wait=50,end=0,dust=[];
 const rollW=()=>{const r=Math.random();return r<.45?1:r<.8?2:3;};
 const pl=[0,1].map(()=>({lane:2,cd:20,q:[rollW(),rollW(),rollW()],think:0,tgt:2}));
 const laneY=l=>LY+l*LH+LH/2;
 const send=i=>{const p=pl[i];if(p.cd>0)return;const w=p.q[0],r=RW[w-1],x=i?X1-r:X0+r;if(sh.some(s=>s.lane===p.lane&&s.side===i&&Math.abs(s.x-x)<s.r+r+1)){S('blip');return;}
  sh.push({lane:p.lane,side:i,x,w,r,st:rnd(6),push:0});p.q.shift();p.q.push(rollW());p.cd=22+w*12;S('jump');};
 const stepLane=l=>{const a=sh.filter(s=>s.lane===l&&s.side===0).sort((p,q)=>q.x-p.x),b=sh.filter(s=>s.lane===l&&s.side===1).sort((p,q)=>p.x-q.x);let ca=[],cb=[];a.concat(b).forEach(s=>s.push=0);
  if(a.length&&b.length&&(b[0].x-b[0].r)-(a[0].x+a[0].r)<=1.2){ca=[a[0]];for(let i=1;i<a.length;i++){if((a[i-1].x-a[i-1].r)-(a[i].x+a[i].r)<=1.5)ca.push(a[i]);else break;}cb=[b[0]];for(let i=1;i<b.length;i++){if((b[i].x-b[i].r)-(b[i-1].x+b[i-1].r)<=1.5)cb.push(b[i]);else break;}
   const wa=ca.reduce((t,s)=>t+s.w,0),wb=cb.reduce((t,s)=>t+s.w,0),v=cl((wa-wb)*.16,-.55,.55);for(const s of ca){s.x+=v;s.push=1;}for(const s of cb){s.x+=v;s.push=1;}if(A.t%6===0&&!A.silent)dust.push({x:(a[0].x+b[0].x)/2,y:laneY(l)+5,t:24,vx:v*2+rnd(1)-.5});}
  for(const s of a)if(!ca.includes(s))s.x+=SP[s.w-1];for(const s of b)if(!cb.includes(s))s.x-=SP[s.w-1];
  if(a.length&&b.length){const o=(a[0].x+a[0].r)-(b[0].x-b[0].r);if(o>0){a[0].x-=o/2;b[0].x+=o/2;}}
  for(let i=1;i<a.length;i++)a[i].x=Math.min(a[i].x,a[i-1].x-a[i-1].r-a[i].r);for(let i=1;i<b.length;i++)b[i].x=Math.max(b[i].x,b[i-1].x+b[i-1].r+b[i].r);};
 const cpu=()=>{const p=pl[1],o={};if(p.think>0)p.think--;if(A.t%24===0){let best=-1e9;for(let l=0;l<5;l++){const mine=sh.filter(s=>s.lane===l&&s.side===1),en=sh.filter(s=>s.lane===l&&s.side===0),mw=mine.reduce((t,s)=>t+s.w,0),ew=en.reduce((t,s)=>t+s.w,0),ef=en.length?Math.max(...en.map(s=>s.x)):0;
   let v=(ew-mw)*1.5*A.ai+(ef?(ef-160)/30:0)+(!en.length?.8:0)+(!mine.length&&!en.length?.6:0)+rnd((1-A.ai)*6+.5);if(mw>ew+4)v-=2.5;if(v>best){best=v;p.tgt=l;}}}
  if(p.lane<p.tgt&&A.t%5===0)o.d=1;if(p.lane>p.tgt&&A.t%5===0)o.u=1;if(p.lane===p.tgt&&p.cd===0&&p.think===0){o.a=1;p.think=4+ri(8+(1-A.ai)*60);}A.bot(o);};
 g.update=()=>{dust.forEach(d=>{d.t--;d.x+=d.vx;d.y-=.3;});dust=dust.filter(d=>d.t>0);if(end>0){if(--end===0)g.over=A.win(sc[0]>=GOAL?0:1);return;}if(wait>0){wait--;return;}
  if(A.cpu)cpu();pl.forEach((p,i)=>{const h=A.hit(i);if(p.cd>0)p.cd--;if(h.u&&p.lane>0){p.lane--;S('blip');}if(h.d&&p.lane<4){p.lane++;S('blip');}if(h.a)send(i);});
  for(let l=0;l<5;l++)stepLane(l);
  for(const s of sh){if(s.side===0&&s.x>X1+4||s.side===1&&s.x<X0-4){sc[s.side]+=s.w;s.dead=1;S('score');A.burst(s.x,laneY(s.lane),PC[s.side],10+s.w*4,2);A.fx.push({txt:'+'+s.w,x:s.x,y:laneY(s.lane)-16,vx:0,vy:-.6,t:40,c:PC[s.side],g:0});}
   else if(s.side===0&&s.x-s.r<X0-12||s.side===1&&s.x+s.r>X1+12){s.dead=1;S('lose');A.burst(s.x,laneY(s.lane),'#ffffff',8,1.5);}}
  sh=sh.filter(s=>!s.dead);g.score=sc[0];if(sc[0]>=GOAL||sc[1]>=GOAL){end=70;S('win');}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const sheep=(s,x,y,sc_)=>{const r=s.r*(sc_||1),d=s.side?-1:1,wool=s.side?'#4a4458':'#f4f0e8',wd=s.side?'#2e2a38':'#d8d0c0',face=s.side?'#15101c':'#2a2428',st=A.t*(s.push?.35:.22)+s.st,bob=Math.abs(Math.sin(st))*1.2;
  ell(x,y+r*.8,r*1.15,r*.32,'rgba(0,0,0,.25)');for(let j=0;j<4;j++){const lx=x+(j<2?-1:1)*r*.45+(j%2?1.5:-1.5),sw=Math.sin(st+j*1.6)*2;L(lx,y+r*.2,lx+sw,y+r*.85,'#2a2020',1.6);}
  ga(1);for(let j=0;j<7;j++){const a=j/7*TAU;disc(x+Math.cos(a)*r*.55,y-bob-r*.1+Math.sin(a)*r*.38,r*.5,j<4?wool:wd);}disc(x,y-bob-r*.15,r*.62,wool);disc(x-r*.2,y-bob-r*.35,r*.3,'rgba(255,255,255,.25)');
  const hx=x+d*r*(s.push?1.02:.92),hy=y-bob-r*(s.push?-.05:.15);ell(hx,hy,r*.42,r*.33,face,d*.3);ell(hx-d*r*.18,hy-r*.28,r*.2,r*.1,face,-d*.6);disc(hx+d*r*.12,hy-r*.08,Math.max(.8,r*.09),'#ffffff');
  disc(x+d*r*.45,y-bob+r*.12,Math.max(1,r*.16),PC[s.side]);};
 g.draw=()=>{vg(0,0,W,H,'#7ac85a','#3a8a3a');
  for(let l=0;l<5;l++){const y=LY+l*LH;fr(X0,y+5,X1-X0,LH-10,lin(0,y,0,y+LH,['#c8a868','#a88848']));for(let x=X0+6;x<X1;x+=17)fr(x+(l*7)%11,y+10+(x*3)%14,2,1,'rgba(90,60,30,.4)');
   fr(X0,y,X1-X0,2,'#8a5a2a');for(let x=X0;x<=X1;x+=24){fr(x-1,y-4,3,8,'#6a4020');fr(x-1,y-4,3,1,'#a87848');}}
  const yb=LY+5*LH;fr(X0,yb,X1-X0,2,'#8a5a2a');for(let x=X0;x<=X1;x+=24){fr(x-1,yb-4,3,8,'#6a4020');}
  for(let i=0;i<2;i++){const x=i?X1:0,w=X0;fr(x,LY-4,w,5*LH+8,lin(x,0,x+w,0,i?['#c89a50','#a07030']:['#a07030','#c89a50']));for(let y=LY;y<yb;y+=6)fr(x+((y*13)%w),y,6,1,'rgba(255,230,150,.5)');fr(i?X1:X0-2,LY-4,2,5*LH+8,'#ffffff');
   for(let y=LY-4;y<yb+4;y+=8)fr(i?X1-3:X0+1,y,2,4,(y/8|0)%2?'#1a1a1a':'#ffffff');}
  fr(0,18,W,LY-22,'#5aa84a');for(let x=4;x<W;x+=11)disc(x,26+(x*7)%10,1.4,['#ffcf3f','#ff9ad0','#ffffff'][x%3]);
  pl.forEach((p,i)=>{rr(i?W-128:40,21,88,19,5,'rgba(10,8,32,.55)');T('NEXT',i?W-44:44,28,K.w,1,i?'r':'l',1);p.q.forEach((w,j)=>{const x=i?W-76-j*17:76+j*17;sheep({r:RW[w-1],side:i,st:j,push:0},x,31,.7);});});
  for(const s of sh.slice().sort((a,b)=>a.lane-b.lane))sheep(s,s.x,laneY(s.lane));
  for(const d of dust){ga(d.t/30);disc(d.x,d.y,2+(24-d.t)*.15,'#e8d8b0');}ga(1);
  pl.forEach((p,i)=>{const y=laneY(p.lane)+14,x=i?W-19:19,d=i?-1:1;ga(.35);fr(i?X1:0,laneY(p.lane)-LH/2+4,X0,LH-8,PC[i]);ga(1);
   A.person(x,y,{c:PC[i],pants:i?'#3a2040':'#203a40',s:.9,d,id:i?3:0,cap:i?'#8a2a5a':'#1a6a60',arm2:i?.4:-.4,arm1:i?.4:-.4});
   const hx=x+d*6,hy=y-17;L(hx,hy+6,hx+d*3,hy-16,'#7a5028',1.6);arcS(hx+d*6,hy-16,3,d>0?Math.PI:0,d>0?TAU:Math.PI,'#7a5028',1.6);
   if(p.cd>0){fr(x-9,y+3,18,2,'rgba(0,0,0,.4)');fr(x-9,y+3,18*(1-p.cd/58),2,PC[i]);}});
  hud(sc[0],sc[1],0,'FIRST TO 30');if(end)banner(A.nm(sc[0]>=GOAL?0:1)+' WINS!',K.y);else ready(wait,50);};
 return g;}});

/* ================= 6. BALLOON BATTLE ================= */
A.add({id:'balloonbattle',name:'BALLOON BATTLE',cat:'VERSUS',vs:1,how:'UP DRIVES, LEFT/RIGHT STEER, A USES ITEMS. POP ALL 3 RIVAL BALLOONS. WIN 2.',make(){
 const g={over:null,score:0},X0=14,X1=306,Y0=26,Y1=232,PIL=[[98,80,11],[222,80,11],[98,178,11],[222,178,11],[160,129,17]],SPOTS=[[160,52],[160,206],[42,129],[278,129]];
 let cars,boxes,shots=[],tacks=[],rw=[0,0],wait=0,end=0,msg='',noise=0;
 const mk=(x,y,a)=>({x,y,a,vx:0,vy:0,bal:3,inv:0,item:null,boost:0,stuck:0,rev:0,held:0,hit:0});
 const reset=()=>{cars=[mk(44,58,.6),mk(276,200,Math.PI+.6)];boxes=SPOTS.map(s=>({x:s[0],y:s[1],t:0}));shots=[];tacks=[];wait=60;};reset();
 const pop=(i)=>{const c=cars[i];if(c.inv>0||c.bal<=0||end)return;c.bal--;c.inv=80;S('boom');A.shake=6;A.burst(c.x,c.y-10,PC[i],22,2.6);A.fx.push({txt:'POP!',x:c.x,y:c.y-24,vx:0,vy:-.5,t:36,c:K.w,g:0});
  if(c.bal===0){const w=1-i;rw[w]++;msg=A.nm(w)+' TAKES THE ROUND';end=110;}};
 const cpu=()=>{const c=cars[1],o=cars[0];if(A.t%30===0)noise=(rnd(2)-1)*(1-A.ai)*.6;let tx=o.x,ty=o.y,use=false;const toO=Math.atan2(o.y-c.y,o.x-c.x),dO=Math.hypot(o.x-c.x,o.y-c.y),dA=adf(toO,c.a);
  if(!c.item){let bb=null,bd=1e9;for(const b of boxes)if(b.t===0){const d=Math.hypot(b.x-c.x,b.y-c.y);if(d<bd){bd=d;bb=b;}}if(bb&&bd<dO+30){tx=bb.x;ty=bb.y;}}
  else{c.held++;if(c.item==='DART')use=Math.abs(dA)<.1+(1-A.ai)*.15&&dO<170&&Math.random()<.2+.5*A.ai;if(c.item==='BOOST')use=Math.abs(dA)<.3&&dO<110;if(c.item==='TACK')use=Math.abs(dA)>2.3&&dO<90||c.held>360;tx=o.x-Math.cos(o.a)*14;ty=o.y-Math.sin(o.a)*14;}
  if(!c.item)c.held=0;let want=Math.atan2(ty-c.y,tx-c.x)+noise;const lx=c.x+Math.cos(c.a)*26,ly=c.y+Math.sin(c.a)*26;
  for(const p of PIL)if(Math.hypot(lx-p[0],ly-p[1])<p[2]+12){const s=adf(Math.atan2(p[1]-c.y,p[0]-c.x),c.a);want=c.a-(s>0?1:-1)*1.2;}
  if(lx<X0+8||lx>X1-8||ly<Y0+8||ly>Y1-8)want=Math.atan2(129-c.y,160-c.x);
  const da=adf(want,c.a),sp=Math.hypot(c.vx,c.vy);if(sp<.4)c.stuck++;else c.stuck=0;if(c.stuck>40){c.rev=30;c.stuck=0;}
  if(c.rev>0){c.rev--;A.bot({d:1,l:da>0,r:da<0,a:use});return;}A.bot({u:Math.abs(da)<2.2,l:da<-.08,r:da>.08,a:use});};
 g.update=()=>{if(end>0){end--;if(end===0){if(rw[0]>=2||rw[1]>=2){g.over=A.win(rw[0]>=2?0:1);return;}reset();}return;}if(wait>0){wait--;return;}if(A.cpu)cpu();
  cars.forEach((c,i)=>{const k=A.in(i),h=A.hit(i),fx=Math.cos(c.a),fy=Math.sin(c.a),vf=c.vx*fx+c.vy*fy;c.a+=ax(k)*.075*cl(Math.abs(vf)/1.4,0,1)*(vf<0?-1:1);
   let acc=k.u?.14:k.d?-.09:0;if(i&&A.cpu)acc*=.84+.16*A.ai;if(c.boost>0){c.boost--;acc=.32;if(A.t%2===0)A.burst(c.x-fx*12,c.y-fy*12,K.o,1,.8);}
   c.vx+=fx*acc;c.vy+=fy*acc;const lx=-fy,ly=fx,vl=c.vx*lx+c.vy*ly;c.vx-=lx*vl*.2;c.vy-=ly*vl*.2;c.vx*=.965;c.vy*=.965;const sp=Math.hypot(c.vx,c.vy),mx=c.boost?5.6:3.6;if(sp>mx){c.vx*=mx/sp;c.vy*=mx/sp;}
   c.x+=c.vx;c.y+=c.vy;if(c.x<X0+9){c.x=X0+9;c.vx=Math.abs(c.vx)*.5;}if(c.x>X1-9){c.x=X1-9;c.vx=-Math.abs(c.vx)*.5;}if(c.y<Y0+9){c.y=Y0+9;c.vy=Math.abs(c.vy)*.5;}if(c.y>Y1-9){c.y=Y1-9;c.vy=-Math.abs(c.vy)*.5;}
   for(const p of PIL){const dx=c.x-p[0],dy=c.y-p[1],d=Math.hypot(dx,dy);if(d<p[2]+9&&d>0){const nx=dx/d,ny=dy/d;c.x=p[0]+nx*(p[2]+9);c.y=p[1]+ny*(p[2]+9);const vn=c.vx*nx+c.vy*ny;if(vn<0){c.vx-=1.5*vn*nx;c.vy-=1.5*vn*ny;}}}
   if(c.inv>0)c.inv--;if(c.hit>0)c.hit--;
   for(const b of boxes)if(b.t===0&&!c.item&&Math.hypot(b.x-c.x,b.y-c.y)<14){b.t=360;c.item=['DART','DART','TACK','BOOST'][ri(4)];S('coin');A.burst(b.x,b.y,K.y,12,2);}
   if(h.a&&c.item){if(c.item==='DART'){shots.push({x:c.x+fx*12,y:c.y+fy*12,vx:fx*6.2+c.vx*.3,vy:fy*6.2+c.vy*.3,o:i,t:90,b:2});S('shoot');}else if(c.item==='TACK'){tacks.push({x:c.x-fx*16,y:c.y-fy*16,o:i,arm:50,t:1100});S('blip');}else{c.boost=70;S('jump');}c.item=null;}});
  boxes.forEach(b=>{if(b.t>0)b.t--;});
  for(const s of shots){s.x+=s.vx;s.y+=s.vy;s.t--;if(s.x<X0||s.x>X1){s.vx*=-1;s.b--;}if(s.y<Y0||s.y>Y1){s.vy*=-1;s.b--;}if(s.b<0)s.t=0;for(const p of PIL)if(Math.hypot(s.x-p[0],s.y-p[1])<p[2])s.t=0;const o=cars[1-s.o];if(s.t>0&&Math.hypot(s.x-o.x,s.y-o.y)<12){s.t=0;pop(1-s.o);}}shots=shots.filter(s=>s.t>0);
  for(const t of tacks){t.t--;if(t.arm>0)t.arm--;cars.forEach((c,i)=>{if(t.t>0&&(i!==t.o||t.arm===0)&&Math.hypot(c.x-t.x,c.y-t.y)<10){t.t=0;pop(i);}});}tacks=tacks.filter(t=>t.t>0);
  const a=cars[0],b=cars[1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<18&&d>0){const nx=dx/d,ny=dy/d,o=(18-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(rv<0){const pa=a.vx*nx+a.vy*ny,pb=-(b.vx*nx+b.vy*ny);a.vx+=rv*nx*1.1;a.vy+=rv*ny*1.1;b.vx-=rv*nx*1.1;b.vy-=rv*ny*1.1;S('hit');A.burst((a.x+b.x)/2,(a.y+b.y)/2,K.w,6,1.5);
    if(-rv>1.3&&!a.hit){a.hit=b.hit=20;if(a.boost>0&&!b.boost)pop(1);else if(b.boost>0&&!a.boost)pop(0);else if(pa>pb+.7)pop(1);else if(pb>pa+.7)pop(0);}}}};
 g.timeUp=()=>tu(rw[0]*10+cars[0].bal,rw[1]*10+cars[1].bal);
 const car=(c,i)=>{const col=PC[i],dk=PD[i];if(c.inv>0&&c.inv%8<4)ga(.45);ell(c.x+2,c.y+4,13,9,'rgba(0,0,0,.3)');sv();tr(c.x,c.y,c.a);
  for(const[x,y]of[[-7,-8],[6,-8],[-7,8],[6,8]])rr(x-3.5,y-2.5,7,5,1.5,'#141418');rr(-12,-8,24,16,6,'#1c1c24');rr(-11,-7,22,14,5,lin(0,-7,0,7,[PL[i],col,dk]));rr(3,-5,6,10,2,'rgba(160,230,255,.85)');
  disc(-2,0,4.4,'#f4f4f4');disc(-1,0,3.4,col);rr(0.5,-2,2.5,4,1,'#1a1a2a');fr(-12,-1,3,2,'#ffcf3f');rs();ga(1);};
 const balloons=(c,i)=>{const fx=Math.cos(c.a),fy=Math.sin(c.a),bx=c.x-fx*10,by=c.y-fy*10;for(let j=0;j<c.bal;j++){const off=(j-(c.bal-1)/2)*8,sw=Math.sin(A.t*.08+j*2+i)*2,x=bx-fx*12+(-fy)*off+sw,y=by-fy*12+fx*off-14+Math.cos(A.t*.07+j)*1.5;
  L(bx,by,x,y+6,'rgba(255,255,255,.6)',.8);ell(x,y,5,6,rad(x-2,y-2,8,['#ffffff',PC[i],PD[i]]));P([[x-1.5,y+7],[x+1.5,y+7],[x,y+5.5]],PD[i]);}};
 g.draw=()=>{fr(0,0,W,H,'#20202c');fr(X0,Y0,X1-X0,Y1-Y0,rad(160,129,190,['#4a4a5a','#34343f','#26262f']));for(let x=X0;x<X1;x+=24)fr(x,Y0,1,Y1-Y0,'rgba(255,255,255,.04)');for(let y=Y0;y<Y1;y+=24)fr(X0,y,X1-X0,1,'rgba(255,255,255,.04)');
  ering(160,129,60,60,'rgba(255,207,63,.35)',3);ering(160,129,90,90,'rgba(255,255,255,.08)',8);ga(.18);fr(X0,Y0,50,50,PC[0]);fr(X1-50,Y1-50,50,50,PC[1]);ga(1);
  for(let x=X0-6;x<X1+6;x+=10){disc(x,Y0-4,5,(x/10|0)%2?'#1a1a1a':'#e03a3a');disc(x,Y1+4,5,(x/10|0)%2?'#1a1a1a':'#f4f4f4');}for(let y=Y0;y<Y1;y+=10){disc(X0-5,y,5,(y/10|0)%2?'#1a1a1a':'#f4f4f4');disc(X1+5,y,5,(y/10|0)%2?'#1a1a1a':'#e03a3a');}
  for(const t of tacks){const f=t.arm>0&&t.arm%6<3;for(let j=0;j<4;j++){const a=j*1.57+.4;L(t.x,t.y,t.x+Math.cos(a)*5,t.y+Math.sin(a)*5,f?'#ffffff':'#c8c8d8',1.5);}disc(t.x,t.y,2.5,PC[t.o]);}
  for(const b of boxes){if(b.t>0){if(b.t<60){ga(.3);ering(b.x,b.y,8,8,'#ffffff',1);ga(1);}continue;}const bob=Math.sin(A.t*.1+b.x)*2;ell(b.x,b.y+8,8,3,'rgba(0,0,0,.3)');sv();tr(b.x,b.y+bob-2,A.t*.03);rr(-7,-7,14,14,3,lin(-7,-7,7,7,['#ff4f6d','#ffcf3f','#3dff8b','#4dabff']));rs();T('?',b.x,b.y+bob-4,'#ffffff',1,'c');}
  PIL.forEach((p,j)=>{ell(p[0]+3,p[1]+5,p[2]+2,p[2]*.6,'rgba(0,0,0,.3)');if(j===4){C(p[0],p[1],p[2],'#8a8aa0');disc(p[0],p[1],p[2]-4,'#2a7ac8');for(let r=0;r<3;r++){const rr_=(A.t*.3+r*4)%12;ga(1-rr_/12);ering(p[0],p[1],rr_,rr_,'#bfe6ff',1);}ga(1);disc(p[0],p[1],2.5,'#dff4ff');}
   else{C(p[0],p[1],p[2],'#e8e8f0');for(let a=0;a<4;a++)arcS(p[0],p[1],p[2]-3,a*1.57+A.t*.01,a*1.57+.8+A.t*.01,'#ff9838',3);disc(p[0],p[1],3,'#44444e');}});
  for(const s of shots){const a=Math.atan2(s.vy,s.vx);L(s.x-Math.cos(a)*9,s.y-Math.sin(a)*9,s.x,s.y,'#ffcf3f',2);P([[s.x+Math.cos(a)*4,s.y+Math.sin(a)*4],[s.x+Math.cos(a+2.5)*3,s.y+Math.sin(a+2.5)*3],[s.x+Math.cos(a-2.5)*3,s.y+Math.sin(a-2.5)*3]],'#ffffff');}
  cars.forEach(car);cars.forEach(balloons);
  hud(rw[0],rw[1],2,'WIN 2 ROUNDS');cars.forEach((c,i)=>{if(c.item)T(c.item,i?W-44:44,6,K.y,1,i?'r':'l',1);});
  if(end)banner(msg.split(' TAKES')[0]+' WINS ROUND',PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,60);};
 return g;}});

/* ================= 7. SPIN TOPS ================= */
A.add({id:'spintop',name:'SPIN TOPS',cat:'VERSUS',vs:1,how:'A SETS LAUNCH POWER. ARROWS TILT, A DASHES. LAST TOP SPINNING WINS. BEST OF 3.',make(){
 const g={over:null,score:0},CX=160,CY=138,BR=96,SQ=.56;let tp,ph='launch',pw=[0,0],lock=[0,0],lt=0,rw=[0,0],end=0,msg='';
 const fans=crowd(90,22,58,5);
 const reset=()=>{tp=[{x:-66,y:-8,vx:0,vy:0,sp:0,ang:0,cd:0,out:0,dead:0,fall:0,bl:0},{x:66,y:8,vx:0,vy:0,sp:0,ang:0,cd:0,out:0,dead:0,fall:0,bl:0}];ph='launch';lock=[0,0];lt=0;};reset();
 const meter=i=>(Math.sin(lt*.075+i*1.9)+1)/2;
 const scr=(x,y)=>[CX+x,CY+y*SQ];
 const cpu=()=>{const q=tp[1],o=tp[0];if(ph==='launch'){const m=meter(1),err=.05+(1-A.ai)*.4;A.bot({a:!lock[1]&&lt>30&&(m>1-err&&Math.random()<.5||lt>300)});return;}
  if(q.dead){A.bot({});return;}let tx,ty,dash=false;const d=Math.hypot(o.x-q.x,o.y-q.y);if(q.sp>=o.sp*.9){tx=o.x+o.vx*8;ty=o.y+o.vy*8;dash=d<52&&q.cd===0&&Math.random()<.02+.07*A.ai;}else{tx=-o.x*.7;ty=-o.y*.7;}
  if(Math.hypot(q.x,q.y)>BR-30){tx=0;ty=0;}const dx=tx-q.x-q.vx*6,dy=ty-q.y-q.vy*6;A.bot({l:dx<-6,r:dx>6,u:dy<-6,d:dy>6,a:dash});};
 g.update=()=>{if(end>0){end--;tp.forEach(t=>{if(t.dead)t.fall++;if(t.out){t.x+=t.vx;t.y+=t.vy;}});if(end===0){if(rw[0]>=2||rw[1]>=2){g.over=A.win(rw[0]>=2?0:1);return;}reset();}return;}
  if(A.cpu)cpu();
  if(ph==='launch'){lt++;for(let i=0;i<2;i++)if(!lock[i]&&(A.hit(i).a||lt>420)){lock[i]=1;pw[i]=meter(i);S(pw[i]>.9?'coin':'blip');if(pw[i]>.9)A.fx.push({txt:'PERFECT',x:i?250:70,y:70,vx:0,vy:-.4,t:40,c:K.y,g:0});}
   if(lock[0]&&lock[1]){ph='battle';tp.forEach((t,i)=>{t.sp=55+pw[i]*45;const d=i?-1:1;t.vx=d*(1.2+pw[i]*1.6);t.vy=-d*(.6+rnd(.8));});S('jump');}return;}
  tp.forEach((t,i)=>{if(t.dead)return;const k=A.in(i),h=A.hit(i),acc=(i&&A.cpu)?.045*(.75+.25*A.ai):.045;t.vx+=ax(k)*acc-t.x*.0011;t.vy+=ay(k)*acc-t.y*.0011;
   if(h.a&&t.cd===0&&t.sp>8){let dx=ax(k),dy=ay(k);if(!dx&&!dy){const o=tp[1-i];dx=o.x-t.x;dy=o.y-t.y;}const m=Math.hypot(dx,dy)||1;t.vx+=dx/m*2.6;t.vy+=dy/m*2.6;t.sp-=4;t.cd=45;S('jump');}
   if(t.cd>0)t.cd--;if(t.bl>0)t.bl--;t.vx*=.99;t.vy*=.99;t.x+=t.vx;t.y+=t.vy;t.sp-=.05+Math.hypot(t.vx,t.vy)*.004;t.ang+=t.sp*.012;
   const d=Math.hypot(t.x,t.y);if(d>BR-11){const nx=t.x/d,ny=t.y/d,vo=t.vx*nx+t.vy*ny;if(vo>3.3){t.out=1;t.dead=1;S('boom');A.shake=8;}else{t.x=nx*(BR-11);t.y=ny*(BR-11);if(vo>0){t.vx-=1.6*vo*nx;t.vy-=1.6*vo*ny;t.sp-=vo*.8;if(vo>.8){S('blip');const[sx,sy]=scr(t.x,t.y);A.burst(sx,sy,'#ffcf3f',5,1.4);}}}}
   if(t.sp<=0&&!t.dead){t.sp=0;t.dead=1;S('lose');}});
  const a=tp[0],b=tp[1];if(!a.dead&&!b.dead){const dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<24&&d>0){const nx=dx/d,ny=dy/d,o=(24-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;const rv=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(rv<0){const j=-rv;a.vx-=nx*j*.95;a.vy-=ny*j*.95;b.vx+=nx*j*.95;b.vy+=ny*j*.95;const ta=a.sp+b.sp||1;a.sp-=j*3.4*(b.sp/ta+.35);b.sp-=j*3.4*(a.sp/ta+.35);a.bl=b.bl=8;S('hit');const[sx,sy]=scr(a.x+nx*12,a.y+ny*12);A.burst(sx,sy-8,'#ffe890',8+(j*5|0),1.5+j*.6);A.shake=Math.min(8,j*3|0);}}}
  const d0=tp[0].dead,d1=tp[1].dead;if(d0||d1){if(d0&&d1)msg='DOUBLE KO';else{const w=d0?1:0;rw[w]++;msg=A.nm(w)+(tp[1-w].out?' RINGS OUT!':' OUTSPINS!');}end=110;}};
 g.timeUp=()=>tu(rw[0]*1000+(tp[0].sp|0),rw[1]*1000+(tp[1].sp|0));
 const top=(t,i)=>{let[sx,sy]=scr(t.x,t.y);const col=PC[i],dk=PD[i],wob=t.dead?0:t.sp<28?(28-t.sp)/28:0,wx=Math.cos(A.t*.3)*wob*4,wy=Math.sin(A.t*.3)*wob*2;
  if(t.out){sy+=t.fall*t.fall*.05;ga(Math.max(0,1-t.fall/60));}if(!t.out)ell(sx+2,sy+2,12,5,'rgba(0,0,0,.35)');
  if(t.dead&&!t.out){sv();tr(sx,sy-4,Math.min(1.2,t.fall*.08));ell(0,0,13,6,dk);ell(0,-1,13,6,col);rs();ga(1);return;}
  P([[sx-10+wx,sy-9+wy],[sx+10+wx,sy-9+wy],[sx,sy]],dk);P([[sx-10+wx,sy-9+wy],[sx+wx*.5,sy-9+wy],[sx,sy]],col);
  sv();tr(sx+wx,sy-10+wy);A.c.scale(1,.46);disc(0,0,14,dk);for(let j=0;j<6;j++){A.c.fillStyle=j%2?col:PL[i];A.c.beginPath();A.c.moveTo(0,0);A.c.arc(0,0,13,t.ang+j*1.047,t.ang+(j+1)*1.047);A.c.closePath();A.c.fill();}disc(0,0,5,'#e8e8f0');rs();
  fr(sx-2+wx*1.2,sy-17+wy,4,6,'#c8c8d8');disc(sx+wx*1.3,sy-17+wy,2.6,'#ffffff');if(t.sp>40&&!t.dead){ga(.3);ering(sx+wx,sy-10+wy,17,8,'#ffffff',1);ga(1);}if(t.bl>0){ga(.6);ering(sx,sy-10,18,9,'#ffe890',2);ga(1);}ga(1);};
 g.draw=()=>{vg(0,0,W,H,'#12102a','#050410');drawCrowd(fans,end>0);for(const x of[60,160,260]){ga(.08);P([[x-8,18],[x+8,18],[x+50,H],[x-50,H]],'#ffffff');ga(1);}
  ell(CX,CY+14,BR+16,(BR+16)*SQ,'rgba(0,0,0,.5)');ell(CX,CY+8,BR+12,(BR+12)*SQ,'#2a2a38');fr(CX-BR-12,CY,BR*2+24,8,'#3a3a4c');ell(CX,CY,BR+12,(BR+12)*SQ,lin(0,CY-60,0,CY+60,['#b0b0c8','#6a6a80']));
  ell(CX,CY,BR,BR*SQ,rad(CX,CY+8,BR,['#0c1a3a','#20407a','#4a78c0']));for(let r=20;r<BR;r+=19)ering(CX,CY,r,r*SQ,'rgba(160,210,255,.14)',1);
  for(let j=0;j<12;j++){const a=j*TAU/12;disc(CX+Math.cos(a)*(BR+6),CY+Math.sin(a)*(BR+6)*SQ,1.6,'#e8e8f0');}ering(CX,CY,10,10*SQ,'rgba(255,207,63,.45)',2);
  const ord=[0,1].sort((i,j)=>tp[i].y-tp[j].y);ord.forEach(i=>top(tp[i],i));
  hud(rw[0],rw[1],2,'BEST OF 3');ga(.7);fr(0,18,W,11,'#05040c');ga(1);for(let i=0;i<2;i++){const w=Math.max(0,tp[i].sp)/100*90,x=i?W-100:10;fr(x,21,90,5,'rgba(0,0,0,.5)');fr(i?x+90-w:x,21,w,5,tp[i].sp<25?K.r:PC[i]);T('SPIN',i?x-4:x+94,21,PL[i],1,i?'r':'l',1);}
  if(ph==='launch'){for(let i=0;i<2;i++){const x=i?290:30,m=lock[i]?pw[i]:meter(i);rr(x-10,56,20,118,5,'#e8e8f0');rr(x-8,58,16,114,4,'#0a0a14');fr(x-5,61,10,108,lin(0,61,0,169,['#3dff8b','#ffcf3f','#ff4f6d']));fr(x-5,61,10,11,'rgba(255,255,255,.35)');ga(.65);fr(x-5,61,10,108*(1-m),'#0a0a14');ga(1);fr(x-9,59+108*(1-m),18,4,lock[i]?K.y:'#ffffff');T(lock[i]?'SET':'POWER',x,178,lock[i]?K.y:PL[i],1,'c',1);}banner('LET IT RIP!',K.y,'PRESS A AT THE TOP OF THE METER',196);}
  if(end)banner(msg,msg[0]==='D'?K.w:PC[msg.startsWith(A.nm(0))?0:1]);};
 return g;}});

/* ================= 8. SQUASH ================= */
A.add({id:'squash',name:'SQUASH',cat:'VERSUS',vs:1,how:'LEFT/RIGHT RUN, A SWINGS ON YOUR TURN. HOLD UP TO LOB, DOWN TO DRIVE. TO 7.',make(){
 const g={over:null,score:0},FW=28,BW=300,FL=204,CEIL=48,OUT=52,TIN=184,GOAL=7;let pl,b,sc=[0,0],turn=0,last=0,state='serve',server=0,bounces=0,end=0,msg='',trail=[],serveT=0,plan={tx:200,e:0};
 const fans=crowd(46,30,40,3);
 const reset=()=>{pl=[{x:server===0?240:170,vx:0,sw:0,cd:0,st:0},{x:server===1?240:170,vx:0,sw:0,cd:0,st:0}];b={x:0,y:0,vx:0,vy:0};state='serve';turn=server;last=server;bounces=0;serveT=0;trail=[];};reset();
 const point=(w,why)=>{if(end)return;sc[w]++;g.score=sc[0];msg=why;end=80;server=w;S('score');A.burst(b.x,b.y,PC[w],14,2);};
 const shoot=i=>{const k=A.in(i);b.vx=-(5.3+rnd(.5));b.vy=k.u?-5.4:k.d?-1.3:-3.2;last=i;state='toWall';S('hit');A.burst(b.x,b.y,'#ffffff',5,1.2);};
 const stepBall=(o,st)=>{o.vy+=.16;o.x+=o.vx;o.y+=o.vy;let ev=null;if(o.y<CEIL){o.y=CEIL;o.vy=Math.abs(o.vy)*.6;}if(o.x<FW+3){o.x=FW+3;o.vx=Math.abs(o.vx)*.82;o.vy*=.9;ev='wall';}if(o.x>BW-3){o.x=BW-3;o.vx=-Math.abs(o.vx)*.7;}if(o.y>FL-3){o.y=FL-3;o.vy=-Math.abs(o.vy)*.66;o.vx*=.92;ev=ev||'floor';}return ev;};
 const sweet=p=>[p.x-12,FL-24];
 const cpu=()=>{const q=pl[1],o={};if(state==='serve'){if(server===1&&serveT>50){o.a=1;o.u=Math.random()<.5;}A.bot(o);return;}
  const mine=state==='live'&&turn===1||state==='toWall'&&last===0;if(A.t%30===0)plan.e=(rnd(2)-1)*(1-A.ai)*44;
  if(mine){const s={x:b.x,y:b.y,vx:b.vx,vy:b.vy};let st=state,tx=null;for(let k=0;k<160;k++){const ev=stepBall(s,st);if(st==='toWall'&&ev==='wall')st='live';if(st==='live'&&s.y>FL-40&&s.vy>-1){tx=s.x+12;break;}}plan.tx=(tx===null?200:tx)+plan.e;}
  else plan.tx=last===1?210:230;
  const dx=plan.tx-q.x;o.l=dx<-3;o.r=dx>3;if(state==='live'&&turn===1&&q.sw===0&&q.cd===0){const[sx,sy]=sweet(q),nx=b.x+b.vx*3,ny=b.y+b.vy*3;if(Math.hypot(nx-sx,ny-sy)<18&&Math.random()<.35+.6*A.ai){o.a=1;const r=Math.random();if(pl[0].x>200&&r<.3+.3*A.ai)o.d=1;else if(pl[0].x<120&&r<.5)o.u=1;}}A.bot(o);};
 g.update=()=>{if(end>0){end--;stepBall(b,state);if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i),sp=(i&&A.cpu)?2.5*(.8+.2*A.ai):2.5;p.vx+=(ax(k)*sp-p.vx)*.35;p.x=cl(p.x+p.vx,FW+18,BW-10);if(Math.abs(p.vx)>.3)p.st+=.3;if(p.cd>0)p.cd--;
   if((h.a||state==='serve'&&server===i&&++serveT>240)&&p.sw===0&&p.cd===0){p.sw=13;if(state==='serve'&&server===i){b.x=p.x-12;b.y=FL-30;shoot(i);}else S('blip');}
   if(p.sw>0){p.sw--;if(p.sw===0)p.cd=6;if(state==='live'&&turn===i&&p.sw<=10&&p.sw>=3){const[sx,sy]=sweet(p);if(Math.hypot(b.x-sx,b.y-sy)<20)shoot(i);}}});
  if(state==='serve'){const p=pl[server];b.x=p.x-10;b.y=FL-20+Math.sin(A.t*.2)*2;return;}
  const ev=stepBall(b,state);if(A.t%2===0)trail.push({x:b.x,y:b.y});if(trail.length>8)trail.shift();
  if(ev==='wall'&&state==='toWall'){if(b.y<OUT)point(1-last,'OUT! POINT '+A.nm(1-last));else if(b.y>TIN)point(1-last,'TIN! POINT '+A.nm(1-last));else{state='live';turn=1-last;bounces=0;S('blip');}}
  else if(ev==='floor'){if(state==='toWall')point(1-last,'SHORT! POINT '+A.nm(1-last));else if(state==='live'&&++bounces>=2)point(last,'POINT '+A.nm(last));}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 g.draw=()=>{vg(0,0,W,H,'#e9e4d8','#cfc6b4');fr(0,0,W,20,'#2a2a34');for(let x=30;x<W;x+=60){fr(x,16,40,4,'#fffbe0');glow(x+20,20,30,'255,250,220',.35);}
  fr(0,20,W,26,lin(0,20,0,46,['#3a3040','#5a4a58']));drawCrowd(fans,end>0);fr(0,42,W,4,'#7a5a3a');fr(0,41,W,1,'#c8a070');L(FW,OUT,BW,118,'#d8243a',2);fr(BW,46,W-BW,FL-46,'rgba(170,210,230,.35)');ga(.3);for(let y=60;y<FL;y+=40)L(BW+2,y,W,y-14,'#ffffff',2);ga(1);fr(BW,46,3,FL-46,'#9ab8c8');
  fr(0,46,FW,FL-46,lin(0,0,FW,0,['#bdb6a6','#f6f2ea']));fr(FW-2,46,2,FL-46,'#fffdf6');fr(0,OUT-1,FW,3,'#d8243a');fr(0,110,FW,2,'#d8243a');fr(0,TIN,FW,FL-TIN,lin(0,TIN,0,FL,['#d8243a','#801020']));fr(0,TIN,FW,2,'#ff6070');
  fr(0,FL,W,H-FL,lin(0,FL,0,H,['#d8a868','#a8743a']));for(let y=FL+6;y<H;y+=7)fr(0,y,W,1,'rgba(90,50,20,.25)');for(let x=0;x<W;x+=46)fr(x+((x/46|0)%2)*20,FL,1,H-FL,'rgba(90,50,20,.2)');fr(0,FL,W,2,'#8a5a2a');fr(170,FL+2,3,12,'#d8243a');
  ell(b.x,FL+2,4-Math.min(3,(FL-b.y)/40),1.3,'rgba(0,0,0,.35)');
  pl.forEach((p,i)=>{const s=p.sw>0?(13-p.sw)/13:0,a1=p.sw>0?-1.3+s*3.1:-.5,s1=1.3;
   A.person(p.x,FL,{c:PC[i],pants:'#ffffff',s:s1,d:-1,id:i?3:0,st:p.st,arm1:a1,arm2:.3,cap:i?undefined:undefined});
   const shx=p.x-5*s1,shy=FL-21*s1,hx=shx-Math.sin(a1)*10*s1,hy=shy+Math.cos(a1)*10*s1,rx=hx-Math.sin(a1)*14,ry=hy+Math.cos(a1)*14;L(hx,hy,rx,ry,'#2a2a2a',1.6);ell(rx-Math.sin(a1)*4,ry+Math.cos(a1)*4,4.5,3,'rgba(255,255,255,.25)',a1);ering(rx-Math.sin(a1)*4,ry+Math.cos(a1)*4,4.5,4.5,'#2a2a2a',1.2);
   if(!end&&(state==='live'&&turn===i||state==='serve'&&server===i)){const y=FL-54+Math.sin(A.t*.15)*2;P([[p.x-4,y],[p.x+4,y],[p.x,y+5]],PC[i]);}});
  trail.forEach((t,j)=>{ga(j/16);disc(t.x,t.y,2.2,'#3a3a3a');});ga(1);disc(b.x,b.y,2.8,'#141414');disc(b.x-.8,b.y-.8,.9,'#ffcf3f');
  hud(sc[0],sc[1],GOAL,state==='serve'?A.nm(server)+' SERVES':'RALLY');if(end)banner(msg,K.y);};
 return g;}});

/* ================= 9. THUMB WAR ================= */
A.add({id:'thumbwar',name:'THUMB WAR',cat:'VERSUS',vs:1,how:'LEFT/RIGHT SWING, HOLD UP TO DODGE, A SLAMS. PINNED? MASH A. PIN 3 TO WIN.',make(){
 const g={over:null,score:0},GOAL=3,LEN=50,BX=[147,173],BY=180,SQ=.8,IMP=16,SLT=24;let th,sc=[0,0],intro=0,end=0,msg='',pin=null,dodge={on:0,d:0};
 const fans=crowd(70,20,64,9);
 const reset=()=>{th=[{a:-.55,va:0,up:0,st:100,tired:0,sl:0,rec:0,stun:0,wig:0},{a:.55,va:0,up:0,st:100,tired:0,sl:0,rec:0,stun:0,wig:0}];pin=null;intro=150;};reset();
 const tipOf=(i,a)=>{a=a===undefined?th[i].a:a;return[BX[i]+Math.sin(a)*LEN,BY-Math.cos(a)*LEN*SQ];};
 const segD=(i)=>{const[tx,ty]=tipOf(i),o=1-i,[ox,oy]=tipOf(o),bx=BX[o],by=BY;let best=1e9;for(let t=.35;t<=1.001;t+=.08){const px=bx+(ox-bx)*t,py=by+(oy-by)*t;best=Math.min(best,Math.hypot(tx-px,(ty-py)/SQ));}return best;};
 const tipD=()=>segD(1);
 const lift=t=>t.sl>0?(t.sl<IMP?Math.sin(t.sl/IMP*Math.PI*.5)*(1-Math.max(0,t.sl-IMP+4)/4):0):t.up?.75:0;
 const cpu=()=>{const q=th[1],o=th[0],b={};if(pin){if(Math.random()<(pin.by===1?[.08,.11,.14]:[.07,.1,.13])[A.lvl])b.a=1;A.bot(b);return;}
  const[ox0,oy0]=tipOf(0),ox=BX[0]+(ox0-BX[0])*.75,oy=BY+(oy0-BY)*.75,want=cl(Math.atan2(ox-BX[1],(BY-oy)/SQ),-1.25,1.25),da=want-q.a;b.l=da<-.06;b.r=da>.06;const d=tipD();
  if(o.sl===1){dodge.on=Math.random()<.3+.6*A.ai;dodge.d=[10,7,4][A.lvl]+ri(4);}if(o.sl>0&&o.sl<IMP+2&&dodge.on&&o.sl>=dodge.d&&d<30&&q.st>10)b.u=1;
  if(d<15&&!o.up&&o.sl===0&&q.sl===0&&q.rec===0&&Math.random()<.03+.1*A.ai)b.a=1;A.bot(b);};
 g.update=()=>{if(intro>0){intro--;th[0].a=-.55+Math.sin((150-intro)*.21)*.25;th[1].a=.55+Math.sin((150-intro)*.21)*.25;if(intro%30===0)S(intro?'blip':'coin');return;}
  if(end>0){end--;if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();intro=90;}return;}
  if(A.cpu)cpu();
  if(pin){const pi=pin.by,vi=1-pi;if(A.hit(vi).a){pin.esc+=7;th[vi].wig=6;S('blip');}if(A.hit(pi).a)pin.esc=Math.max(0,pin.esc-3.5);pin.esc=Math.max(0,pin.esc-.1);if(th[vi].wig>0)th[vi].wig--;pin.t++;if(pin.t%60===0&&pin.t<180)S('hit');
   if(pin.esc>=100){th[pi].stun=36;th[pi].va=pi?.12:-.12;th[vi].rec=0;pin=null;S('jump');A.burst(BX[vi],BY-40,'#ffffff',16,2);A.fx.push({txt:'ESCAPED!',x:160,y:70,vx:0,vy:-.4,t:40,c:PC[vi],g:0});}
   else if(pin.t>=180){sc[pi]++;g.score=sc[0];msg=A.nm(pi)+' PINS IT!';end=110;S('score');A.shake=8;}return;}
  th.forEach((t,i)=>{const k=A.in(i),h=A.hit(i);if(t.stun>0){t.stun--;t.a=cl(t.a+t.va,-1.25,1.25);t.va*=.85;}
   if(t.tired>0)t.tired--;t.up=k.u&&t.st>0&&!t.tired&&!t.sl&&!t.rec&&!t.stun;if(t.up){t.st-=1.25;if(t.st<=0){t.st=0;t.tired=50;}}else t.st=Math.min(100,t.st+.45);
   if(t.rec>0)t.rec--;
   if(t.sl>0){t.sl++;if(t.sl===IMP){const o=th[1-i];if(!o.up&&!(o.sl>0&&o.sl<IMP)&&segD(i)<12){const[px,py]=tipOf(i);pin={by:i,t:0,esc:0,a:t.a,px,py};S('boom');A.shake=6;const[x,y]=tipOf(1-i);A.burst(x,y,'#ffe890',16,2);}else{t.rec=26;S('blip');}}if(t.sl>=SLT)t.sl=0;return;}
   if(!t.stun&&!t.rec){const sp=(i&&A.cpu)?.012*(.8+.2*A.ai):.012;t.va+=ax(k)*sp;}t.va*=.8;t.a=cl(t.a+t.va,-1.25,1.25);
   if(h.a&&!t.rec&&!t.stun&&!t.up){t.sl=1;S('jump');}});};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const thumb=(i,a,z,face)=>{const col=PC[i],skin=i?'#c68a5e':'#f1c7a3',sk2=i?'#9a6440':'#d8a07c',bx=BX[i],by=BY,[tx0,ty0]=tipOf(i,a),s=1+z*.35,tx=bx+(tx0-bx)*s,ty=by+(ty0-by)*s-z*10,ang=Math.atan2(ty-by,tx-bx)+Math.PI/2,c=A.c;
  if(z>0){ga(.3);c.lineCap='round';L(bx+z*4,by+4,tx0+z*6,ty0+z*8,'#000000',13);ga(1);}
  c.lineCap='round';L(bx,by,tx,ty,sk2,15*s);L(bx,by,tx,ty,skin,12.5*s);c.lineCap='butt';
  sv();tr(tx,ty,ang,s);fr(-6.2,6,12.4,3.4,col);fr(-6.2,6,12.4,1,PL[i]);fr(-6.2+(i?9:0),6.5,3.4,6,col);
  if(face==='x'){L(-4,-2,-1,1,'#2a1a1a',1.2);L(-1,-2,-4,1,'#2a1a1a',1.2);L(1,-2,4,1,'#2a1a1a',1.2);L(4,-2,1,1,'#2a1a1a',1.2);ell(0,3.5,2,1.2,'#7a2a2a');}
  else{disc(-2.5,-.5,1.5,'#ffffff');disc(2.5,-.5,1.5,'#ffffff');disc(-2.5,0,.8,'#111');disc(2.5,0,.8,'#111');L(-4.5,-3.2+(face==='mad'?1:0),-1,-2.6,'#2a1a1a',1);L(4.5,-3.2+(face==='mad'?1:0),1,-2.6,'#2a1a1a',1);arcS(0,2,2,.3,2.84,'#7a2a2a',1);}
  rs();};
 const hand=(i)=>{const d=i?-1:1,skin=i?'#c68a5e':'#f1c7a3',sk2=i?'#9a6440':'#d8a07c',x0=i?250:70;
  P([[x0-d*60,H],[x0-d*20,H],[x0+d*30,200],[x0-d*6,186]],PC[i]);P([[x0-d*60,H],[x0-d*48,H],[x0-d*2,196],[x0-d*12,190]],PD[i]);
  rr(Math.min(x0+d*16,160-d*24)-4,182,Math.abs(x0+d*16-(160-d*24))+8,50,10,lin(0,182,0,232,[skin,sk2]));};
 const fingers=i=>{const d=i?-1:1,skin=i?'#c68a5e':'#f1c7a3',sk2=i?'#9a6440':'#d8a07c';for(let j=0;j<4;j++){const y=192+j*10+(i?5:0),x0=160-d*30,x1=160+d*28;rr(Math.min(x0,x1),y-4,Math.abs(x1-x0),9,4.5,lin(0,y-4,0,y+5,[skin,sk2]));disc(x1-d*3,y,3.6,skin);}};
 g.draw=()=>{vg(0,0,W,H,'#1c0c2c','#05020a');drawCrowd(fans,end>0||!!pin);for(let j=0;j<3;j++){const x=(A.t*37+j*101)%W;if((A.t+j*13)%47<3)glow(x,30+j*12,10,'255,255,255',.9);}
  for(const x of[40,280]){ga(.1);P([[x-6,18],[x+6,18],[160+(x-160)*.2+40,240],[160+(x-160)*.2-40,240]],'#fff6d0');ga(1);}
  P([[66,82],[254,82],[312,234],[8,234]],'#1a3a6a');P([[72,86],[248,86],[300,228],[20,228]],lin(0,86,0,228,['#d8e2ee','#a8b8cc']));T('THUMB',160,104,'rgba(26,58,106,.25)',4,'c',1);T('WAR',160,128,'rgba(255,79,154,.22)',4,'c',1);
  for(let r=0;r<3;r++){const y=r*7;L(70,78-y,250,78-y,r===1?'#ffffff':'#ff4f6d',1.5);L(70,78-y,14,224-y*1.4,r===1?'#ffffff':'#4dabff',1.5);L(250,78-y,306,224-y*1.4,r===1?'#ffffff':'#4dabff',1.5);}
  for(const[x,y,h,c]of[[70,84,24,PC[0]],[250,84,24,PC[1]]]){fr(x-2,y-h,4,h,'#c8c8d8');rr(x-3,y-h,6,8,2,c);}
  hand(0);hand(1);fingers(1);fingers(0);
  const z0=lift(th[0]),z1=lift(th[1]);
  if(pin){const pi=pin.by,vi=1-pi;thumb(vi,th[vi].a+(th[vi].wig?Math.sin(A.t*1.6)*.06:0),0,'x');thumb(pi,pin.a,0,'mad');}
  else{const ord=z0>z1?[1,0]:[0,1];ord.forEach(i=>thumb(i,th[i].a,i?z1:z0,th[i].sl>0?'mad':th[i].stun?'x':''));}
  hud(sc[0],sc[1],GOAL,'PIN 3 TO WIN');for(let i=0;i<2;i++){const x=i?W-74:10,w=th[i].st/100*64;fr(x,21,64,4,'rgba(0,0,0,.5)');fr(i?x+64-w:x,21,w,4,th[i].tired?K.r:PL[i]);T('DODGE',i?x-3:x+67,21,PL[i],1,i?'r':'l',1);}
  if(intro>0){const w=['ONE','TWO','THREE','FOUR','THUMB WAR!'][Math.min(4,(150-intro)/30|0)];banner(w,intro<30?K.y:K.w,intro<30?'':'I DECLARE A...',40);}
  if(pin){const pi=pin.by,n=Math.min(3,1+(pin.t/60|0));T(''+n,160,40,PC[pi],5,'c');rr(100,76,120,10,4,'rgba(0,0,0,.6)');fr(102,78,116*Math.min(1,pin.esc/100),6,PC[1-pi]);T(A.nm(1-pi)+' MASH A!',160,90,PL[1-pi],1,'c');}
  if(end)banner(msg,PC[msg.startsWith(A.nm(0))?0:1],'',40);};
 return g;}});

/* ================= 10. CUP STACK RACE ================= */
A.add({id:'cupstack',name:'CUP STACK RACE',cat:'VERSUS',vs:1,how:'LEFT/RIGHT TO THE GLOWING STACK. UP BUILDS, DOWN COLLAPSES. KEEP A RHYTHM.',make(){
 const g={over:null,score:0},GOAL=5,SEQS=[[3,6,3],[3,3,3],[6,6],[1,10,1],[6,3,6],[3,6,3],[1,10,1],[6,6]],ROWS={1:1,3:2,6:3,10:4},TOP=162,fans=crowd(80,64,112,17);let race=0,rw=[0,0],ps,wait=0,end=0,msg='',seq,tk=0;
 const plan=s=>{const st=[];s.forEach((n,i)=>st.push({i,dir:'u',n}));s.forEach((n,i)=>st.push({i,dir:'d',n:ROWS[n]}));return st;};
 const reset=()=>{seq=SEQS[race%SEQS.length];ps=[0,1].map(()=>({pos:0,step:0,prog:0,cd:0,since:0,fum:0,done:0,combo:0,wait:-1,think:0,hx:0,lift:0,steps:plan(seq),built:seq.map(()=>0),rm:seq.map(()=>0)}));wait=80;tk=0;};reset();
 const stX=(i,j)=>(i?160:0)+80+(j-(seq.length-1)/2)*(seq.length>2?44:52);
 const act=(i,key)=>{const p=ps[i],s=p.steps[p.step];if(p.cd>0){p.fum=10;p.combo=0;S('blip');A.fx.push({txt:'SLIP',x:stX(i,p.pos),y:120,vx:0,vy:-.5,t:26,c:K.o,g:0});return;}
  if(p.pos!==s.i||key!==s.dir){p.fum=34;p.combo=0;if(s.dir==='u'){p.built[s.i]=0;p.prog=0;}S('lose');A.burst(stX(i,p.pos),TOP,PC[i],12,2);A.fx.push({txt:'FUMBLE!',x:stX(i,p.pos),y:120,vx:0,vy:-.5,t:34,c:K.r,g:0});return;}
  const perf=p.since<=4;p.combo=perf?p.combo+1:0;p.cd=perf?5:7;p.since=0;p.lift=6;if(s.dir==='u')p.built[s.i]++;else p.rm[s.i]++;p.prog++;S(perf&&p.combo>2?'coin':'blip');
  if(p.prog>=s.n){if(s.dir==='d'){p.built[s.i]=0;p.rm[s.i]=0;}p.step++;p.prog=0;if(p.step>=p.steps.length){p.done=tk;}}};
 const cpu=()=>{const q=ps[1],o={};if(q.done||q.fum>0||wait>0){A.bot(o);return;}const s=q.steps[q.step];
  if(q.pos!==s.i){if(q.cd===0){if(q.think<=0){o[q.pos<s.i?'r':'l']=1;q.think=[7,4,2][A.lvl]+ri(3);}else q.think--;}}
  else if(q.cd===0){if(q.wait<0)q.wait=[6,3,1][A.lvl]+ri([6,4,3][A.lvl]);if(q.wait--<=0){const err=Math.random()<[.07,.035,.012][A.lvl];o[err?(s.dir==='u'?'d':'u'):s.dir]=1;q.wait=-1;}}A.bot(o);};
 g.update=()=>{if(end>0){if(--end===0){if(rw[0]>=GOAL||rw[1]>=GOAL){g.over=A.win(rw[0]>=GOAL?0:1);return;}race++;reset();}return;}if(wait>0){wait--;if(wait===20)S('coin');return;}tk++;if(A.cpu)cpu();
  ps.forEach((p,i)=>{const h=A.hit(i);p.hx+=(stX(i,p.pos)-p.hx)*.35;if(p.lift>0)p.lift--;if(p.done)return;if(p.fum>0){p.fum--;return;}if(p.cd>0)p.cd--;else p.since++;
   if(h.l&&p.pos>0){p.pos--;p.cd=Math.max(p.cd,4);p.since=0;}else if(h.r&&p.pos<seq.length-1){p.pos++;p.cd=Math.max(p.cd,4);p.since=0;}else if(h.u)act(i,'u');else if(h.d)act(i,'d');});
  const d0=ps[0].done,d1=ps[1].done;if(d0||d1){if(d0&&d1&&d0===d1)msg='DEAD HEAT';else{const w=d0&&(!d1||d0<d1)?0:1;rw[w]++;g.score=rw[0];msg=A.nm(w)+' WINS RACE '+(race+1);}end=100;S('score');}};
 g.timeUp=()=>tu(rw[0],rw[1]);
 const cup=(x,y,col,dk)=>{P([[x-4.6,y],[x+4.6,y],[x+3.2,y-10],[x-3.2,y-10]],col);P([[x-4.6,y],[x-1.5,y],[x-1,y-10],[x-3.2,y-10]],dk);fr(x-4.8,y-1.5,9.6,1.5,'#ffffff');};
 const station=(i,j,p)=>{const n=seq[j],x=stX(i,j),col=i?'#ff4f6d':'#2f9ad6',dk=i?'#a01838':'#1a5a90',rows=ROWS[n];let b=p.built[j],rm=p.rm[j];
  if(b<n||rm===0){let k=0;for(let r=0;r<rows&&k<b;r++){const m=rows-r;for(let c=0;c<m&&k<b;c++,k++)cup(x+(c-(m-1)/2)*9.4,TOP+12-r*10,col,dk);}}
  else{let keep=n;for(let r=0;r<rm;r++)keep-=r+1;let k=0;for(let r=0;r<rows&&k<keep;r++){const m=rows-r;for(let c=0;c<m&&k<keep;c++,k++)cup(x+(c-(m-1)/2)*9.4,TOP+12-r*10,col,dk);}b=keep;}
  const nest=n-b;for(let c=0;c<nest;c++)cup(x+(n===1?0:rows*4.7+7),TOP+12-c*1.8,col,dk);};
 const half=i=>{const p=ps[i],ox=i?160:0,cx=ox+80;fr(ox,18,160,H-18,lin(0,18,0,H,[i?'#3a1a3a':'#1a2a44',i?'#1a0a1a':'#0a1222']));for(let x=ox+8;x<ox+160;x+=20)fr(x,18,1,120,'rgba(255,255,255,.04)');
  for(let r=0;r<4;r++)fr(ox,62+r*14,160,14,r%2?'rgba(255,255,255,.05)':'rgba(0,0,0,.12)');sv();A.c.beginPath();A.c.rect(ox,0,160,H);A.c.clip();drawCrowd(fans.filter(f=>i?f.x>=160:f.x<160),!!end);rs();P([[ox+8,22],[ox+36,22],[ox+22,36]],PC[i]);P([[ox+124,22],[ox+152,22],[ox+138,36]],PC[i]);
  const s=p.steps[Math.min(p.step,p.steps.length-1)],hx=p.hx||stX(i,0),ly=p.lift>0?-4:0;
  A.person(cx,184,{c:PC[i],pants:'#2a2a3a',s:2,id:i?3:1,d:1,arm1:0,arm2:0,cap:i?'#5a1a3a':undefined});
  P([[ox+8,TOP-2],[ox+152,TOP-2],[ox+160,TOP+20],[ox,TOP+20]],'#8a5a30');P([[ox+10,TOP],[ox+150,TOP],[ox+156,TOP+16],[ox+4,TOP+16]],lin(0,TOP,0,TOP+16,['#d8a868','#b8844a']));fr(ox+4,TOP+20,152,H-TOP-20,lin(0,TOP+20,0,H,['#5a3a1e','#2a1a0e']));rr(ox+24,TOP+5,112,10,3,'rgba(30,30,40,.55)');
  if(!p.done&&wait===0){const tx=stX(i,s.i);glow(tx,TOP+12,22,i?'255,79,154':'47,214,195',.45);const ay_=TOP-48+Math.sin(A.t*.25)*2;if(s.dir==='u')P([[tx-6,ay_+6],[tx+6,ay_+6],[tx,ay_-2]],K.y);else P([[tx-6,ay_-2],[tx+6,ay_-2],[tx,ay_+6]],K.y);}
  for(let j=0;j<seq.length;j++)station(i,j,p);
  const shx=cx-10,shy=184-42,sx2=cx+10;A.c.lineCap='round';L(shx,shy,hx-8,TOP+4+ly,PC[i],5);L(sx2,shy,hx+8,TOP+4+ly,PC[i],5);A.c.lineCap='butt';disc(hx-8,TOP+4+ly,3.4,'#f1c7a3');disc(hx+8,TOP+4+ly,3.4,'#f1c7a3');
  if(p.fum>0){ga(.25);fr(ox,18,160,H-18,'#ff2040');ga(1);}
  const tm=((p.done||tk)/60).toFixed(2);rr(cx-26,24,52,13,3,'rgba(0,0,0,.6)');T(tm,cx,27,p.done?K.y:K.w,1,'c',1);const pr=p.step/p.steps.length;fr(ox+16,44,128,3,'rgba(255,255,255,.15)');fr(ox+16,44,128*pr,3,PC[i]);
  if(p.combo>2&&!p.done)T('RHYTHM X'+p.combo,cx,52,K.y,1,'c',1);if(p.done)T('DONE!',cx,60,K.y,2,'c');};
 g.draw=()=>{half(0);half(1);fr(158,18,4,H,'#0a0a14');
  hud(rw[0],rw[1],GOAL,seq.join('-'));if(wait>0)banner(wait>20?'RACE '+(race+1):'STACK!',wait>20?K.w:K.y,wait>20?seq.join('-')+'  UP THEN DOWN':'');if(end)banner(msg,msg[0]==='D'?K.w:PC[msg.startsWith(A.nm(0))?0:1]);};
 return g;}});

/* ================= 11. POGO JOUST ================= */
A.add({id:'pogojoust',name:'POGO JOUST',cat:'VERSUS',vs:1,how:'LEFT/RIGHT LEAN, A AS YOU LAND BOUNCES HIGH, DOWN DIVES. STOMP THEIR HEAD.',make(){
 const g={over:null,score:0},FLR=214,PLAT=[[34,156,70],[216,156,70],[122,104,76]],GOAL=5;let pl,sc=[0,0],wait=0,end=0,msg='',plan={tx:160},wheel=0;
 const reset=()=>{pl=[{x:70,y:FLR,vx:0,vy:-4,pump:-99,dive:0,comp:0,down:0,py:FLR},{x:250,y:FLR,vx:0,vy:-4,pump:-99,dive:0,comp:0,down:0,py:FLR}];wait=50;};reset();
 const below=q=>{let best=FLR;for(const p of PLAT)if(q.x>p[0]&&q.x<p[0]+p[2]&&p[1]>=q.y-2&&p[1]<best)best=p[1];return best;};
 const cpu=()=>{const q=pl[1],o=pl[0],b={};if(A.t%[14,8,3][A.lvl]===0){plan.tx=q.y<o.y-24?o.x+o.vx*12:(o.x<160?250:70);plan.tx+=(rnd(2)-1)*(1-A.ai)*36;}
  const dx=plan.tx-q.x;b.l=dx<-6;b.r=dx>6;if(q.vy>0){const top=below(q);if((top-q.y)/Math.max(q.vy,.5)<7&&Math.random()<.25+.6*A.ai)b.a=1;}
  if(q.vy>0&&Math.abs(q.x-o.x)<12&&q.y<o.y-50&&Math.random()<.15+.5*A.ai)b.d=1;A.bot(b);};
 g.update=()=>{wheel+=.004;if(end>0){end--;pl.forEach(p=>{if(p.down){p.down++;p.vy+=.25;p.y=Math.min(FLR,p.y+p.vy);}});if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}
  if(wait>0)wait--;if(A.cpu&&!wait)cpu();
  pl.forEach((p,i)=>{const k=wait?{}:A.in(i),h=wait?{}:A.hit(i);if(h.a)p.pump=A.t;if(h.d&&p.vy>-2)p.dive=1;p.vy+=.25;if(p.dive)p.vy=Math.max(p.vy,6.5);
   const acc=(i&&A.cpu)?.2*(.8+.2*A.ai):.2;p.vx+=ax(k)*acc*(p.dive?.3:1);p.vx*=.97;p.vx=cl(p.vx,-2.8,2.8);p.py=p.y;p.x+=p.vx;p.y+=p.vy;if(p.comp>0)p.comp--;
   if(p.x<12){p.x=12;p.vx=Math.abs(p.vx);}if(p.x>308){p.x=308;p.vx=-Math.abs(p.vx);}if(p.y<70){p.y=70;p.vy=Math.max(0,p.vy);}
   if(p.vy>0){let top=null;if(p.y>=FLR)top=FLR;for(const q of PLAT)if(p.x>q[0]&&p.x<q[0]+q[2]&&p.py<=q[1]&&p.y>=q[1])top=q[1];
    if(top!==null){p.y=top;const big=A.t-p.pump<10;p.vy=big?-7.4:p.dive?-6:-5.2;p.dive=0;p.comp=7;S(big?'jump':'blip');if(big)A.burst(p.x,p.y,'#ffffff',6,1.4);}}});
  if(wait)return;
  for(let i=0;i<2;i++){const p=pl[i],o=pl[1-i];if(p.vy>.5&&p.y<o.y-30&&Math.abs(p.x-o.x)<11&&Math.abs(p.y-(o.y-42))<11){sc[i]++;g.score=sc[0];o.down=1;o.vy=-2;p.vy=-6.5;msg=A.nm(i)+' STOMPS!';end=90;S('boom');A.shake=7;A.burst(o.x,o.y-42,K.y,24,2.6);return;}}
  const a=pl[0],b=pl[1],dx=b.x-a.x;if(Math.abs(dx)<14&&Math.abs(a.y-b.y)<28){const o=(14-Math.abs(dx))/2*(dx>=0?1:-1);a.x-=o;b.x+=o;const t=a.vx;a.vx=b.vx*.8-(dx>=0?.6:-.6);b.vx=t*.8+(dx>=0?.6:-.6);S('hit');}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const rider=(p,i)=>{const lean=p.down?(i?-1:1)*Math.min(1.5,p.down*.1):p.vx*.09,cmp=p.comp>0?Math.sin(p.comp/7*Math.PI)*4:0;ell(p.x,FLR+2,9,2.4,'rgba(0,0,0,.3)');
  sv();tr(p.x,p.y,lean);L(0,0,0,-8+cmp,'#c8c8d8',1.5);for(let j=0;j<4;j++){const y=-1-j*(8-cmp)/4;L(-2.5,y,2.5,y-(8-cmp)/8,'#e8e8f0',1.2);}fr(-1.2,-44,2.4,36-cmp,'#7a7a8a');fr(-1.2,-44,1,36-cmp,'#c8c8d8');fr(-6,-12+cmp,12,2,'#3a3a4a');fr(-6,-45+cmp,12,2.2,'#3a3a4a');disc(-6,-44+cmp,1.6,PC[i]);disc(6,-44+cmp,1.6,PC[i]);
  A.person(0,-12+cmp,{c:PC[i],pants:i?'#3a1a3a':'#1a2a4a',s:1,d:p.vx>=0?1:-1,id:i?3:0,arm1:Math.PI+.3,arm2:Math.PI-.3,cap:PD[i]});rs();};
 g.draw=()=>{vg(0,0,W,FLR,'#ffb070','#7a4aa8');glow(250,150,70,'255,230,160',.5);disc(250,150,22,'#ffe8b0');
  const fx=70,fy=120;for(let j=0;j<10;j++){const a=wheel+j*TAU/10;L(fx,fy,fx+Math.cos(a)*44,fy+Math.sin(a)*44,'rgba(60,30,80,.6)',1);disc(fx+Math.cos(a)*44,fy+Math.sin(a)*44,3,'rgba(60,30,80,.7)');}ering(fx,fy,44,44,'rgba(60,30,80,.6)',2);L(fx,fy,fx-20,FLR,'rgba(60,30,80,.6)',2);L(fx,fy,fx+20,FLR,'rgba(60,30,80,.6)',2);
  for(const[x,w,h]of[[150,80,60],[230,60,46]]){P([[x,FLR],[x+w/2,FLR-h],[x+w,FLR]],'#5a2a6a');for(let s=0;s<4;s++)P([[x+w/2,FLR-h],[x+w*s/4,FLR],[x+w*(s+.5)/4,FLR]],'rgba(255,79,109,.35)');}
  for(let x=0;x<W;x+=26){const y=30+Math.sin(x*.025)*5;P([[x,y],[x+12,y+1],[x+6,y+10]],['#ff4f6d','#ffcf3f','#2fd6c3','#4dabff'][(x/26|0)%4]);}L(0,30,W,30,'rgba(40,20,40,.6)',1);
  fr(0,FLR-12,W,12,'#3a2a4a');for(let x=0;x<W;x+=14)fr(x,FLR-18,3,18,'#4a3a5a');fr(0,FLR,W,H-FLR,lin(0,FLR,0,H,['#4ab84a','#2a7a3a']));for(let x=0;x<W;x+=40)fr(x,FLR,20,H-FLR,'rgba(255,255,255,.05)');
  for(const q of PLAT){const[x,y,w]=q;fr(x+4,y,w-8,FLR-y,lin(x,0,x+w,0,['#8a1a2a','#e0405a','#8a1a2a']));for(let s=x+10;s<x+w-6;s+=14)fr(s,y,5,FLR-y,'rgba(255,255,255,.55)');ell(x+w/2,y,w/2,5,'#ffcf3f');ell(x+w/2,y-1,w/2-3,3.5,'#fff0a0');}
  pl.forEach((p,i)=>{if(!p.down&&!end&&p.y<pl[1-i].y-30&&Math.abs(p.x-pl[1-i].x)<60){ga(.5+.3*Math.sin(A.t*.4));ering(pl[1-i].x,pl[1-i].y-42,10,10,PC[i],1.5);ga(1);}});
  pl.forEach(rider);hud(sc[0],sc[1],GOAL,'FIRST TO 5');if(end)banner(msg,PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,50);};
 return g;}});

/* ================= 12. FLIPPER DUEL ================= */
A.add({id:'flipperduel',name:'FLIPPER DUEL',cat:'VERSUS',vs:1,how:'UP/DOWN FLIP TOP/BOTTOM FLIPPER, A FLIPS BOTH. DRAIN IT PAST YOUR RIVAL.',make(){
 const g={over:null,score:0},CY=129,FLEN=40,BR=4,GOAL=5,X0=8,X1=312,Y0=22,Y1=236,GT=62,GB=196,GR=.11;let fl,b,sc=[0,0],wait=0,end=0,msg='',trail=[],slow=0,hold=[0,0],pend=[-1,-1],cdF=[0,0];
 const BUMP=[[108,74,11],[212,74,11],[108,184,11],[212,184,11],[160,96,8],[160,162,8]].map(q=>({x:q[0],y:q[1],r:q[2],f:0}));
 const mkF=(px,py,rest,act)=>({px,py,rest,act,a:rest,w:0});
 fl=[[mkF(30,CY-48,1.95,.7),mkF(30,CY+48,-1.95,-.7)],[mkF(290,CY-48,Math.PI-1.95,Math.PI-.7),mkF(290,CY+48,-(Math.PI-1.95),-(Math.PI-.7))]];
 const GUIDE=[[66,Y0,30,CY-48],[66,Y1,30,CY+48],[254,Y0,290,CY-48],[254,Y1,290,CY+48]];
 const reset=w=>{const d=w===undefined?(Math.random()<.5?1:-1):(w?-1:1);b={x:160,y:CY,vx:d*2.6,vy:(rnd(2)-1)*1.4};trail=[];wait=50;slow=0;};reset();
 const capsule=(ax_,ay_,bx,by,rr_,w,px,py,e)=>{const dx=bx-ax_,dy=by-ay_,l2=dx*dx+dy*dy,t=cl(((b.x-ax_)*dx+(b.y-ay_)*dy)/l2,0,1),cx=ax_+dx*t,cy=ay_+dy*t;let nx=b.x-cx,ny=b.y-cy;const d=Math.hypot(nx,ny);if(d>=BR+rr_||d===0)return false;nx/=d;ny/=d;b.x=cx+nx*(BR+rr_);b.y=cy+ny*(BR+rr_);
  const svx=w?-w*(cy-py):0,svy=w?w*(cx-px):0,vn=(b.vx-svx)*nx+(b.vy-svy)*ny;if(vn<0){b.vx-=(1+e)*vn*nx;b.vy-=(1+e)*vn*ny;}return true;};
 const cpu=()=>{const o={};for(let j=0;j<2;j++){const f=fl[1][j];if(hold[j]>0)hold[j]--;else if(cdF[j]>0)cdF[j]--;else{const tx=f.px+Math.cos(f.rest)*FLEN,ty=f.py+Math.sin(f.rest)*FLEN,x=b.x+b.vx*2,y=b.y+b.vy*2,dx=tx-f.px,dy=ty-f.py,t=cl(((x-f.px)*dx+(y-f.py)*dy)/(FLEN*FLEN),0,1),d=Math.hypot(x-f.px-dx*t,y-f.py-dy*t);
  if(pend[j]<0&&t>.2&&d<BR+9&&b.x>200)pend[j]=ri([7,4,2][A.lvl]);if(pend[j]>=0&&pend[j]--===0){if(Math.random()<.7+.3*A.ai)hold[j]=10;cdF[j]=8;pend[j]=-1;}}}o.u=hold[0]>0;o.d=hold[1]>0;A.bot(o);};
 g.update=()=>{BUMP.forEach(q=>{if(q.f>0)q.f--;});if(end>0){end--;b.x+=b.vx*.5;b.y+=b.vy*.5;if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset(msg.startsWith(A.nm(0))?1:0);}return;}
  if(A.cpu)cpu();
  for(let i=0;i<2;i++){const k=A.in(i);fl[i].forEach((f,j)=>{const on=k.a||(j?k.d:k.u),tg=on?f.act:f.rest,sp=on?.36:.2,d=tg-f.a;const st=Math.abs(d)<sp?d:Math.sign(d)*sp;if(on&&Math.abs(d)>.3&&Math.abs(f.a-f.rest)<.05)S('blip');f.a0=f.a;f.w=st;});}
  const NS=6;
  if(wait>0){wait--;fl.forEach(ff=>ff.forEach(f=>{f.a=f.a0+f.w;}));return;}
  b.vx+=(b.x<160?-1:1)*GR*Math.min(1,Math.abs(b.x-160)/36);
  for(let s=0;s<NS;s++){b.x+=b.vx/NS;b.y+=b.vy/NS;
   for(const ff of fl)for(const f of ff){f.a=f.a0+f.w*(s+1)/NS;const tx=f.px+Math.cos(f.a)*FLEN,ty=f.py+Math.sin(f.a)*FLEN;if(capsule(f.px,f.py,tx,ty,4,f.w,f.px,f.py,.5)&&Math.abs(f.w)>.05&&s===0){S('hit');}}
   for(const q of GUIDE)capsule(q[0],q[1],q[2],q[3],1.5,0,0,0,.6);
   if(b.y<Y0+BR){b.y=Y0+BR;b.vy=Math.abs(b.vy)*.9;}if(b.y>Y1-BR){b.y=Y1-BR;b.vy=-Math.abs(b.vy)*.9;}
   for(const q of BUMP){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<q.r+BR&&d>0){const nx=dx/d,ny=dy/d;b.x=q.x+nx*(q.r+BR);b.y=q.y+ny*(q.r+BR);const sp=Math.max(5.2,Math.hypot(b.vx,b.vy));b.vx=nx*sp;b.vy=ny*sp;q.f=12;S('coin');A.burst(b.x,b.y,'#ffe890',5,1.5);}}}
  const sp=Math.hypot(b.vx,b.vy);if(sp>8.5){b.vx*=8.5/sp;b.vy*=8.5/sp;}if(sp<.25){if(++slow>150)reset();}else slow=0;
  if(A.t%2===0){trail.push({x:b.x,y:b.y});if(trail.length>7)trail.shift();}
  const drain=b.x<4?1:b.x>316?0:-1;if(drain>=0){sc[drain]++;g.score=sc[0];msg=A.nm(drain)+' SCORES!';end=90;S('boom');A.shake=8;A.burst(drain?14:306,b.y,PC[1-drain],26,3);}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const flip=(f,i)=>{const c=Math.cos(f.a),s=Math.sin(f.a),nx=-s,ny=c,tx=f.px+c*FLEN,ty=f.py+s*FLEN;P([[f.px+nx*5,f.py+ny*5],[tx+nx*3,ty+ny*3],[tx-nx*3,ty-ny*3],[f.px-nx*5,f.py-ny*5]],'#e8e8f0');L(f.px+c*4,f.py+s*4,tx-c*2,ty-s*2,PC[i],2);disc(tx,ty,3,'#e8e8f0');C(f.px,f.py,5,'#c8c8d8');disc(f.px,f.py,1.6,PD[i]);};
 g.draw=()=>{fr(0,0,W,H,'#2a1a10');fr(X0,Y0,X1-X0,Y1-Y0,rad(160,129,190,['#3a1a6a','#1e0e44','#0c0620']));
  for(let i=0;i<2;i++){const x=i?X1-46:X0;ga(.22+.1*Math.sin(A.t*.1));fr(x,GT,46,GB-GT,lin(x,0,x+46,0,i?['rgba(255,79,154,0)',PC[1]]:[PC[0],'rgba(47,214,195,0)']));ga(1);}
  for(let j=0;j<5;j++){const on=(A.t/6|0)%5===j;for(let i=0;i<2;i++){const x=i?240-j*14:80+j*14,d=i?1:-1;P([[x,CY-6],[x+d*6,CY],[x,CY+6],[x+d*3,CY]],on?PC[i]:'rgba(255,255,255,.12)');}}
  ering(160,CY,26,26,'rgba(255,207,63,.35)',2);sv();tr(160,CY,A.t*.02);for(let j=0;j<4;j++){A.c.rotate(1.57);fr(-1,-24,2,10,'rgba(255,207,63,.4)');}rs();T('VS',160,CY-5,'rgba(255,243,214,.5)',3,'c',1);
  for(const q of GUIDE){const top=q[1]<CY,x0=q[0]<160?0:W;P([[x0,q[1]],[q[0],q[1]],[q[2],q[3]],[x0,q[3]]],'#2a1a10');P([[x0,top?q[1]:q[1]],[q[0],q[1]],[q[2],q[3]],[q[2]+(q[0]<160?-6:6),q[3]]],lin(0,Y0,0,Y1,['#5a3a20','#3a2410']));}
  for(const q of GUIDE)L(q[0],q[1],q[2],q[3],'#e8e8f0',3);L(66,Y0,254,Y0,'#c8c8d8',3);L(66,Y1,254,Y1,'#c8c8d8',3);
  for(const q of BUMP){if(q.f)glow(q.x,q.y,q.r+10,'255,232,144',.7);disc(q.x,q.y+2,q.r+1,'rgba(0,0,0,.4)');C(q.x,q.y,q.r,q.f?'#ffe890':'#ff4f6d');C(q.x,q.y-1,q.r*.62,q.f?'#ffffff':'#ffcf3f');ering(q.x,q.y,q.r,q.r,'#ffffff',1);}
  fl.forEach((ff,i)=>ff.forEach(f=>flip(f,i)));
  trail.forEach((t,j)=>{ga(j/14);disc(t.x,t.y,BR*.8,'#c8d8ff');});ga(1);C(b.x,b.y,BR+.5,'#e8eef8');disc(b.x-1.2,b.y-1.4,1.3,'#ffffff');
  for(let x=0;x<W;x+=4)fr(x,Y1+1,2,3,(x/4|0)%2?'#4a2a14':'#6a3a1a');
  hud(sc[0],sc[1],GOAL,'FIRST TO 5');if(end)banner(msg,PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,50);};
 return g;}});

/* ================= 13. BIPLANE DOGFIGHT ================= */
A.add({id:'dogfight',name:'BIPLANE DOGFIGHT',cat:'VERSUS',vs:1,how:'LEFT/RIGHT LOOP, HOLD UP FOR THROTTLE, A FIRES, B BAILS OUT. 5 KILLS WINS.',make(){
 const g={over:null,score:0},GND=208,TOP=22,GOAL=5;let pl,bl=[],sc=[0,0],wait=50,end=0,msg='',mt=0,smoke=[],chutes=[],aimE=0,mill=0;
 const clouds=[];for(let i=0;i<6;i++)clouds.push({x:rnd(W),y:40+rnd(110),s:.8+rnd(.7),v:.08+rnd(.15),f:i%2});
 const spawn=i=>({x:i?290:30,y:70+rnd(50),a:i?Math.PI:0,v:3,hp:3,st:'fly',stall:0,flash:0,resp:0,bail:0,inv:60});
 pl=[spawn(0),spawn(1)];
 const wd=d=>d>W/2?d-W:d<-W/2?d+W:d;
 const kill=(i,why)=>{const w=1-i;sc[w]++;g.score=sc[0];msg=A.nm(w)+' '+why;mt=90;S('score');if(sc[w]>=GOAL&&!end){end=130;}};
 const cpu=()=>{const q=pl[1],o=pl[0],b={};if(q.st==='fall'){if(!q.bail&&Math.random()<.04+.04*A.ai)b.b=1;A.bot(b);return;}if(q.st!=='fly'){A.bot({});return;}
  if(A.t%45===0)aimE=(rnd(2)-1)*(1-A.ai)*.5;const dx=wd(o.x-q.x),dy=o.y-q.y,d=Math.hypot(dx,dy),fwd=Math.cos(q.a)>=0;let want;
  if(q.y>GND-55&&Math.sin(q.a)>-.3)want=fwd?-.8:Math.PI+.8;else if(q.y<TOP+30&&Math.sin(q.a)<.3)want=fwd?.5:Math.PI-.5;
  else if(o.st==='fly'){const t=d/8;want=Math.atan2(dy+Math.sin(o.a)*o.v*t,dx+Math.cos(o.a)*o.v*t)+aimE;}else want=fwd?-.15:Math.PI+.15;
  const da=adf(want,q.a);b.l=da<-.06;b.r=da>.06;b.u=q.v<3.4||Math.sin(q.a)<-.3;b.a=o.st==='fly'&&Math.abs(adf(Math.atan2(dy,dx),q.a))<.1+(1-A.ai)*.14&&d<150&&Math.random()<.25+.6*A.ai;A.bot(b);};
 g.update=()=>{mill+=.06;clouds.forEach(c=>{c.x+=c.v;if(c.x>W+40)c.x=-40;});smoke.forEach(s=>{s.t--;s.y-=.2;s.r+=.08;});smoke=smoke.filter(s=>s.t>0);if(mt)mt--;
  if(end>0){end--;if(end===0)g.over=A.win(sc[0]>=GOAL?0:1);return;}if(wait>0){wait--;return;}if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i);if(p.inv>0)p.inv--;if(p.flash>0)p.flash--;
   if(p.st==='dead'){if(--p.resp<=0)pl[i]=spawn(i);return;}
   if(p.st==='fall'){p.a+=.13*(i?-1:1);p.x+=Math.cos(p.a)*1.3;p.y+=2.3;if(A.t%2===0)smoke.push({x:p.x,y:p.y,r:3,t:40,c:'#3a3a3a'});
    if(h.b&&!p.bail){p.bail=1;chutes.push({x:p.x,y:p.y,vy:-2,i,t:0});S('jump');}if(p.x<0)p.x+=W;if(p.x>=W)p.x-=W;
    if(p.y>=GND){p.st='dead';p.resp=p.bail?70:160;S('boom');A.burst(p.x,GND,K.o,26,3);A.burst(p.x,GND,'#3a3a3a',14,2);}return;}
   const rot=.068*(p.stall?.35:1)*((i&&A.cpu)?.82+.18*A.ai:1);p.a+=ax(k)*rot;const thr=k.u?.09:.052;p.v+=thr-p.v*.02+.075*Math.sin(p.a);p.v=cl(p.v,0,5.4);
   if(p.v<1.1&&!p.stall){p.stall=50;S('lose');}if(p.stall){p.stall--;p.a+=adf(Math.PI/2,p.a)*.06;p.y+=1.1*p.stall/50;}
   p.x+=Math.cos(p.a)*p.v;p.y+=Math.sin(p.a)*p.v;if(p.x<0)p.x+=W;if(p.x>=W)p.x-=W;if(p.y<TOP){p.y=TOP;p.stall=Math.max(p.stall,30);}
   if(p.hp<3&&A.t%(p.hp<2?2:5)===0)smoke.push({x:p.x-Math.cos(p.a)*10,y:p.y-Math.sin(p.a)*10,r:2,t:30,c:p.hp<2?'#3a3a3a':'#9a9aa0'});
   if(p.y>GND-5){p.st='dead';p.resp=160;S('boom');A.shake=8;A.burst(p.x,GND,K.o,26,3);kill(i,'SCORES - RIVAL CRASHED');return;}
   if(A.fire(9,i)){const s=(rnd(2)-1)*.04;bl.push({x:p.x+Math.cos(p.a)*13,y:p.y+Math.sin(p.a)*13,vx:Math.cos(p.a+s)*(p.v+5.5),vy:Math.sin(p.a+s)*(p.v+5.5),o:i,t:40});S('shoot');}});
  for(const b of bl){b.x+=b.vx;b.y+=b.vy;b.t--;if(b.x<0)b.x+=W;if(b.x>=W)b.x-=W;if(b.y>GND||b.y<TOP)b.t=0;const o=pl[1-b.o];
   if(b.t>0&&o.st==='fly'&&!o.inv&&Math.hypot(wd(b.x-o.x),b.y-o.y)<10){b.t=0;o.hp--;o.flash=6;S('hit');A.burst(b.x,b.y,'#ffcf3f',6,1.5);if(o.hp<=0){o.st='fall';S('boom');A.shake=6;A.burst(o.x,o.y,K.o,20,2.5);kill(1-b.o,'SHOOTS ONE DOWN!');}}}bl=bl.filter(b=>b.t>0);
  const a=pl[0],c=pl[1];if(a.st==='fly'&&c.st==='fly'&&!a.inv&&!c.inv&&Math.hypot(wd(a.x-c.x),a.y-c.y)<14){a.hp--;c.hp--;a.inv=c.inv=40;a.a+=1.2;c.a-=1.2;S('boom');A.burst((a.x+c.x)/2,(a.y+c.y)/2,K.w,14,2);[a,c].forEach((p,i)=>{if(p.hp<=0){p.st='fall';kill(i,'SCORES - MIDAIR CRASH');}});}
  chutes.forEach(ch=>{ch.t++;ch.vy=Math.min(ch.vy+.06,.7);ch.y+=ch.vy;ch.x+=Math.sin(ch.t*.04)*.4;});chutes=chutes.filter(ch=>{if(ch.y>=GND-2){A.burst(ch.x,GND,'#ffffff',6,1);return false;}return true;});};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const plane=(p,i)=>{if(p.st==='dead')return;if(p.inv>0&&p.inv%8<4&&p.st==='fly')ga(.5);const col=PC[i],dk=PD[i],up=Math.cos(p.a)>=0?1:-1;sv();tr(p.x,p.y,p.a,1.15,1.15*up);
  P([[-11,-2],[-16,-8],[-13,-2]],dk);rr(-15,-1,6,2,1,dk);P([[13,0],[8,-3.5],[-9,-2.5],[-14,-1],[-14,1],[-9,2.5],[8,3.5]],p.flash?'#ffffff':col);fr(-9,1,17,2,dk);
  rr(-5,2.5,12,2.6,1,dk);L(-3,-6,-3,3,'#3a2a1a',.8);L(5,-6,5,3,'#3a2a1a',.8);rr(-6,-8.5,14,2.8,1.2,lin(0,-9,0,-6,[PL[i],col]));disc(1,-7,1.3,'#ffffff');disc(1,-7,.7,K.r);
  disc(-1,-4,2.6,'#f1c7a3');fr(-2.6,-5.5,3.6,1.4,'#3a2a1a');fr(.2,-5.4,1.6,1.2,'#9fd8ff');L(-3,-3,-8,-3+Math.sin(A.t*.5)*1.5,'#ffffff',1.4);
  L(4,3.5,4,6.5,'#3a3a3a',.8);disc(4,7,1.5,'#1a1a1a');disc(13.5,0,2.2,'#4a4a4a');ga(.35);ell(14.5,0,1.2,7,'#dcdcdc');ga(1);rs();ga(1);
  if(p.stall&&p.st==='fly'&&A.t%20<12)T('STALL',p.x,p.y-18,K.r,1,'c',1);};
 const cloud=(c)=>{const x=c.x,y=c.y,s=c.s;ga(.92);disc(x,y,12*s,'#ffffff');disc(x+12*s,y+3*s,10*s,'#f4f8ff');disc(x-13*s,y+4*s,9*s,'#eef4fc');disc(x+4*s,y-7*s,9*s,'#ffffff');fr(x-20*s,y+3*s,42*s,8*s,'#e6eef8');ga(1);};
 g.draw=()=>{vg(0,0,W,GND,'#3a8ad8','#cfe8f8');glow(262,52,50,'255,250,210',.6);disc(262,52,13,'#fff8d8');
  P([[0,GND],[0,150],[50,126],[90,144],[140,112],[200,140],[250,118],[300,136],[W,128],[W,GND]],'#9ab8d0');P([[0,GND],[0,170],[60,158],[130,176],[190,160],[260,174],[W,160],[W,GND]],'#6aa868');
  for(const c of clouds)if(!c.f)cloud(c);
  fr(0,GND,W,H-GND,'#5a9a3a');const fc=['#7ab84a','#c8b04a','#5a8a3a','#a8c858','#8a6a3a'];for(let j=0;j<8;j++)fr(j*40,GND+4,40,16,fc[j%5]);for(let j=0;j<6;j++)fr(j*54+10,GND+22,54,18,fc[(j+2)%5]);for(let x=0;x<W;x+=40)fr(x,GND+4,1,36,'rgba(40,60,20,.5)');
  fr(56,GND-22,24,22,'#b83a2a');P([[54,GND-22],[68,GND-32],[82,GND-22]],'#6a2a1a');fr(64,GND-12,8,12,'#4a1a10');
  fr(236,GND-40,6,40,'#e8dcc8');P([[232,GND-40],[239,GND-48],[246,GND-40]],'#8a3a2a');for(let j=0;j<4;j++){const a=mill+j*1.57;L(239,GND-40,239+Math.cos(a)*18,GND-40+Math.sin(a)*18,'#5a4a3a',2.5);}
  for(const x of[24,120,160,300]){fr(x-1,GND-8,3,8,'#5a3a1a');disc(x,GND-12,7,'#2a6a2a');}
  for(const s of smoke){ga(s.t/50);disc(s.x,s.y,s.r,s.c);}ga(1);
  for(const ch of chutes){const op=Math.min(1,ch.t/12);A.person(ch.x,ch.y+12,{c:PC[ch.i],s:.5,id:ch.i?3:0,arm1:Math.PI-.4,arm2:Math.PI+.4});L(ch.x-2,ch.y-3,ch.x-9*op,ch.y-14,'#ffffff',.6);L(ch.x+2,ch.y-3,ch.x+9*op,ch.y-14,'#ffffff',.6);A.c.fillStyle=PC[ch.i];A.c.beginPath();A.c.arc(ch.x,ch.y-14,10*op,Math.PI,0);A.c.fill();fr(ch.x-1,ch.y-24*op,2,10*op,'#ffffff');}
  for(const b of bl){L(b.x,b.y,b.x-b.vx*.6,b.y-b.vy*.6,'#ffe070',1.6);}
  pl.forEach(plane);for(const c of clouds)if(c.f)cloud(c);
  hud(sc[0],sc[1],GOAL,'5 KILLS WINS');pl.forEach((p,i)=>{for(let j=0;j<3;j++){const x=i?W-80-j*8:74+j*8;ga(j<p.hp&&p.st!=='dead'?1:.25);P([[x,7],[x+3,4],[x+6,7],[x+3,11]],K.r);}ga(1);});
  if(end)banner(A.nm(sc[0]>=GOAL?0:1)+' ACE!',K.y);else if(mt)T(msg,160,24,PC[msg.startsWith(A.nm(0))?0:1],1,'c');if(wait)ready(wait,50);
  pl.forEach((p,i)=>{if(p.st==='fall'&&!p.bail&&(i===0||!A.cpu)&&A.t%30<20)T('B = BAIL OUT!',p.x,p.y-20,K.y,1,'c',1);});};
 return g;}});

/* ================= 14. ROCKET BALL ================= */
A.add({id:'rocketball',name:'ROCKET BALL',cat:'VERSUS',vs:1,how:'LEFT/RIGHT DRIVE, UP JUMPS (TWICE FLIPS), HOLD A TO BOOST. SCORE 5 GOALS.',make(){
 const g={over:null,score:0},FL=212,CEIL=78,LW=28,RW=292,GTOP=134,GOAL=5,BRD=15;let cars,b,sc=[0,0],wait=0,cel=0,msg='',plan={tx:200,e:0,hop:0,idle:0},pads=[{x:46,t:0},{x:160,t:0},{x:274,t:0}];
 const fans=crowd(130,30,72,21);
 const mk=(x,f)=>({x,y:FL-8,vx:0,vy:0,a:f>0?0:Math.PI,f,gr:1,boost:50,jumps:0,jt:0,flip:0,wr:0,bt:0});
 const reset=()=>{cars=[mk(70,1),mk(250,-1)];b={x:160,y:110,vx:0,vy:0,r:BRD,spin:0};wait=60;};reset();
 const goal=w=>{sc[w]++;g.score=sc[0];cel=110;msg=A.nm(w)+' SCORES!';S('score');A.shake=12;A.burst(b.x,b.y,PC[w],40,4);};
 const sim=()=>{const r=[];let x=b.x,y=b.y,vx=b.vx,vy=b.vy;for(let k=0;k<60;k++){vy+=.17;vx*=.997;x+=vx;y+=vy;if(y>FL-b.r){y=FL-b.r;vy=-vy*.72;vx*=.98;}if(y<CEIL+b.r){y=CEIL+b.r;vy=Math.abs(vy)*.8;}if(x<LW+b.r&&y<GTOP||x<b.r){x=Math.max(x,b.r);vx=Math.abs(vx)*.8;}if(x>RW-b.r&&y<GTOP||x>W-b.r){x=Math.min(x,W-b.r);vx=-Math.abs(vx)*.8;}r.push([x,y]);}return r;};
 const cpu=()=>{const q=cars[1],p1=cars[0],o={};if(plan.idle>0){plan.idle--;A.bot({});return;}if(Math.random()<[.012,.002,0][A.lvl])plan.idle=25+ri(35);if(A.t%[20,10,3][A.lvl]===0)plan.e=(rnd(2)-1)*(1-A.ai)*64;if(A.t%[10,5,2][A.lvl]===0)plan.path=sim();const path=plan.path||sim();
  const gs=q.x>b.x+8;let tx,boost=false,jump=false;
  if(gs){let land=null;for(let k=0;k<path.length;k++)if(path[k][1]>FL-48){land=path[k];break;}
   if(b.y>FL-60)tx=b.x-24;else tx=land?land[0]+8:b.x+10;boost=b.y>FL-50&&q.x-b.x<70&&Math.random()<.7*A.ai;
   }
  else{tx=Math.min(RW-20,b.x+b.vx*10+50);if(b.vx<2)for(const ob of[{x:b.x,y:b.y},{x:p1.x,y:p1.y}])if(ob.x>q.x+4&&ob.x-q.x<54&&ob.y>FL-64)jump=true;boost=tx-q.x>90&&!jump;}
  if(b.vx>3&&b.x>190&&!gs){tx=RW-20;boost=true;}tx+=plan.e;const dir=tx<q.x-5?-1:tx>q.x+5?1:0;if(plan.hop>0)plan.hop--;
  if(q.gr){o.l=dir<0;o.r=dir>0;if(jump&&Math.random()<.35+.6*A.ai){o.u=1;if(!gs)plan.hop=26;}o.a=boost&&dir===q.f&&q.boost>8;}
  else{const da=adf(plan.hop>0?-.9:q.f>0?0:Math.PI,q.a);o.l=da<-.12;o.r=da>.12;if(plan.hop>0){o.a=q.boost>5;A.bot(o);return;}
   if(gs&&q.jumps===1&&q.jt>5&&Math.hypot(b.x-q.x,b.y-q.y)<38&&b.x<q.x&&Math.random()<.4*A.ai)o.u=1;o.a=boost&&Math.abs(da)<.4&&q.boost>8;}A.bot(o);};
 g.update=()=>{pads.forEach(p=>{if(p.t>0)p.t--;});if(cel>0){cel--;b.vy+=.17;b.x=cl(b.x+b.vx*.4,b.r,W-b.r);b.y=Math.min(FL-b.r,b.y+b.vy);if(cel===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset();}return;}
  if(wait>0)wait--;if(A.cpu)cpu();
  cars.forEach((c,i)=>{const k=A.in(i),h=A.hit(i),mult=(i&&A.cpu)?.64+.36*A.ai:1;
   if(c.gr){const dir=ax(k);if(dir){if(dir!==c.f){if(Math.abs(c.vx)<1.3){c.f=dir;c.a=dir>0?0:Math.PI;}else c.vx*=.9;}else c.vx+=dir*.22*mult;}c.vx*=.965;if(h.u){c.vy=-6.3;c.gr=0;c.jumps=1;c.jt=0;S('jump');}}
   else{c.vy+=.28;c.a+=ax(k)*.13;c.jt++;if(h.u&&c.jumps===1&&c.jt<70){c.vx+=Math.cos(c.a)*3.6;c.vy=Math.min(c.vy,-1)-2.2;c.flip=20;c.jumps=2;S('jump');}}
   if(k.a&&c.boost>0){c.vx+=Math.cos(c.a)*.32*mult;c.vy+=Math.sin(c.a)*.32*mult;c.boost-=.9;c.bt=3;if(A.t%2===0)A.fx.push({x:c.x-Math.cos(c.a)*15,y:c.y-Math.sin(c.a)*15,vx:-Math.cos(c.a)*1.5+rnd(1)-.5,vy:-Math.sin(c.a)*1.5+rnd(1)-.5,t:14,c:rnd(1)<.5?K.o:K.y,g:0});}else{c.boost=Math.min(100,c.boost+.1);if(c.bt>0)c.bt--;}
   const sp=Math.hypot(c.vx,c.vy);if(sp>7.5){c.vx*=7.5/sp;c.vy*=7.5/sp;}c.x+=c.vx;c.y+=c.vy;c.wr+=c.vx*.25;if(c.flip>0)c.flip--;
   if(c.y>=FL-8){c.y=FL-8;if(!c.gr){c.gr=1;c.jumps=0;c.flip=0;if(Math.cos(c.a)>=0){c.f=1;c.a=0;}else{c.f=-1;c.a=Math.PI;}if(c.vy>3)S('hit');}c.vy=0;}
   if(c.y<CEIL+8){c.y=CEIL+8;c.vy=Math.abs(c.vy)*.3;}if(c.x<LW+14){c.x=LW+14;c.vx=Math.max(0,c.vx);}if(c.x>RW-14){c.x=RW-14;c.vx=Math.min(0,c.vx);}
   for(const p of pads)if(p.t===0&&c.gr&&Math.abs(c.x-p.x)<12){c.boost=Math.min(100,c.boost+45);p.t=300;S('coin');A.burst(p.x,FL-2,K.o,10,1.5);}});
  const a=cars[0],c2=cars[1],dx=c2.x-a.x;if(Math.abs(dx)<26&&Math.abs(c2.y-a.y)<14){const sx=dx>=0?1:-1,o=(26-Math.abs(dx))/2;a.x=cl(a.x-sx*o,LW+14,RW-14);c2.x=cl(c2.x+sx*o,LW+14,RW-14);const rv=(c2.vx-a.vx)*sx;if(rv<0){a.vx+=rv*sx;c2.vx-=rv*sx;S('hit');}}
  if(wait>0)return;
  b.vy+=.17;b.vx*=.997;b.x+=b.vx;b.y+=b.vy;b.spin+=b.vx*.05;
  if(b.y>FL-b.r){b.y=FL-b.r;if(b.vy>1.5)S('hit');b.vy=-b.vy*.72;if(Math.abs(b.vy)<.8)b.vy=0;b.vx*=.98;}if(b.y<CEIL+b.r){b.y=CEIL+b.r;b.vy=Math.abs(b.vy)*.8;}
  if(b.y<GTOP){if(b.x<LW+b.r){b.x=LW+b.r;b.vx=Math.abs(b.vx)*.8;}if(b.x>RW-b.r){b.x=RW-b.r;b.vx=-Math.abs(b.vx)*.8;}}if(b.x<b.r){b.x=b.r;b.vx=Math.abs(b.vx)*.5;}if(b.x>W-b.r){b.x=W-b.r;b.vx=-Math.abs(b.vx)*.5;}
  for(const px of[LW,RW]){const ddx=b.x-px,ddy=b.y-GTOP,dd=Math.hypot(ddx,ddy);if(dd<b.r+3&&dd>0){const nx=ddx/dd,ny=ddy/dd;b.x=px+nx*(b.r+3);b.y=GTOP+ny*(b.r+3);const vn=b.vx*nx+b.vy*ny;if(vn<0){b.vx-=1.7*vn*nx;b.vy-=1.7*vn*ny;S('hit');}}}
  cars.forEach(c=>{const ca=Math.cos(c.a),sa=Math.sin(c.a),ddx=b.x-c.x,ddy=b.y-c.y,lx=ddx*ca+ddy*sa,ly=-ddx*sa+ddy*ca,qx=cl(lx,-14,14),qy=cl(ly,-6,6),px=c.x+qx*ca-qy*sa,py=c.y+qx*sa+qy*ca;let nx=b.x-px,ny=b.y-py,dd=Math.hypot(nx,ny);
   if(dd<b.r){if(dd<.01){nx=0;ny=-1;dd=1;}else{nx/=dd;ny/=dd;}b.x=px+nx*b.r;b.y=py+ny*b.r;const vn=(b.vx-c.vx)*nx+(b.vy-c.vy)*ny;if(vn<0){b.vx-=1.55*vn*nx;b.vy-=1.55*vn*ny;const kick=c.flip>0?3:c.bt>0?1.4:.5;b.vx+=nx*kick;b.vy+=ny*kick-.3;c.vx*=.85;if(-vn>2.5){S('shoot');A.burst(b.x-nx*b.r,b.y-ny*b.r,'#ffffff',8,1.8);A.shake=3;}}}});
  const s=Math.hypot(b.vx,b.vy);if(s>11){b.vx*=11/s;b.vy*=11/s;}
  if(b.x<LW-5&&b.y>GTOP)goal(1);else if(b.x>RW+5&&b.y>GTOP)goal(0);};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const car=(c,i)=>{const col=PC[i],dk=PD[i],up=Math.cos(c.a)>=0?1:-1,fr_=c.flip>0?(20-c.flip)/20*TAU*(up):0;ell(c.x,FL+1,16-Math.min(8,(FL-8-c.y)/10),2.5,'rgba(0,0,0,.35)');
  sv();tr(c.x,c.y,c.a+fr_,1,up);if(c.bt>0){const fl=8+rnd(6);P([[-14,-1],[-14-fl,2],[-14,5]],'#ffcf3f');P([[-14,1],[-14-fl*.5,2],[-14,3.5]],'#ffffff');}
  P([[15,3],[15,-1],[9,-3],[3,-9],[-7,-9],[-12,-4],[-15,-4],[-15,3]],lin(0,-9,0,3,[PL[i],col,dk]));P([[2,-8],[7,-3.5],[1,-3.5]],'#9fe0ff');P([[-1,-8],[-1,-3.5],[-8,-3.5],[-6,-8]],'#7ac0e8');fr(-16,-7,4,2,dk);fr(-15,-6,1,3,dk);fr(-12,0,26,1.5,'rgba(255,255,255,.5)');fr(13,-1,2.5,2,'#fff6b0');
  for(const wx of[-8,8]){disc(wx,3,4,'#141414');disc(wx,3,2,'#c8c8d8');L(wx,3,wx+Math.cos(c.wr)*2,3+Math.sin(c.wr)*2,'#555',1);}rs();};
 const net=(x0,d,i)=>{ga(.2);fr(d>0?0:RW,GTOP,LW,FL-GTOP,PC[i]);ga(1);for(let y=GTOP+5;y<FL;y+=6)L(x0,y,x0+d*LW,y,'rgba(255,255,255,.3)');fr(d>0?LW-2:RW,GTOP,2,FL-GTOP,PC[i]);fr(d>0?0:RW,GTOP-2,LW,3,PC[i]);glow(d>0?LW:RW,GTOP,14,i?'255,79,154':'47,214,195',.6);};
 g.draw=()=>{vg(0,0,W,H,'#0a0a26','#20164a');drawCrowd(fans,cel>0);fr(0,72,W,4,'#1a1a40');for(let x=0;x<W;x+=20)glow(x+10,74,6,(x/20|0)%2?'47,214,195':'255,79,154',.5);
  fr(LW,76,RW-LW,FL-76,lin(0,76,0,FL,['rgba(60,80,160,.18)','rgba(60,80,160,.05)']));L(LW,CEIL,RW,CEIL,'rgba(160,200,255,.5)',2);L(LW,CEIL,LW,GTOP,'rgba(160,200,255,.5)',2);L(RW,CEIL,RW,GTOP,'rgba(160,200,255,.5)',2);
  for(let x=LW+24;x<RW;x+=24)L(x,CEIL,x,FL,'rgba(160,200,255,.05)');
  fr(0,FL,W,H-FL,'#1e7a3a');for(let x=0;x<W;x+=32)fr(x,FL,16,H-FL,'rgba(255,255,255,.05)');fr(0,FL,W,2,'#ffffff');fr(159,FL,2,H-FL,'rgba(255,255,255,.6)');ering(160,FL+12,30,6,'rgba(255,255,255,.4)',1.5);
  for(const p of pads){const on=p.t===0;ell(p.x,FL+4,12,3,on?'#ff9838':'#4a4a5a');if(on)glow(p.x,FL+2,14,'255,152,56',.5);}
  net(0,1,0);net(W,-1,1);cars.forEach(car);
  ell(b.x,FL+1,b.r-Math.min(8,(FL-b.y)/20),3,'rgba(0,0,0,.35)');glow(b.x,b.y,b.r+8,'200,220,255',.3);C(b.x,b.y,b.r,'#d8dce8');for(let j=0;j<5;j++){const a=b.spin+j*1.2566;L(b.x+Math.cos(a)*4,b.y+Math.sin(a)*4,b.x+Math.cos(a)*b.r,b.y+Math.sin(a)*b.r,'rgba(60,70,100,.6)',1.2);}disc(b.x,b.y,4,'#6a7898');disc(b.x-5,b.y-5,2.5,'rgba(255,255,255,.7)');
  hud(sc[0],sc[1],GOAL,'FIRST TO 5');cars.forEach((c,i)=>{const x=i?W-70:14;rr(x,224,56,7,2,'rgba(0,0,0,.55)');fr(x+1,225,54*c.boost/100,5,c.boost>30?K.o:K.r);T('BOOST',x+28,233,K.w,1,'c',1);});
  if(cel)banner(msg,PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,60);};
 return g;}});

/* ================= 15. DEFLECT ================= */
A.add({id:'deflect',name:'DEFLECT',cat:'VERSUS',vs:1,how:'LEFT/RIGHT MOVE, UP JUMPS, A PARRIES AS THE ORB ARRIVES. IT SPEEDS UP. TO 5.',make(){
 const g={over:null,score:0},FL=204,CEIL=26,X0=14,X1=306,GOAL=5,SC=1.35;let pl,o,sc=[0,0],wait=0,end=0,msg='',trail=[],hits=0,lastT=-1,lead=4;
 const petals=[];for(let i=0;i<26;i++)petals.push({x:rnd(W),y:rnd(H),s:.3+rnd(.5),p:rnd(6)});
 const reset=srv=>{pl=[{x:70,y:FL,vx:0,vy:0,sw:0,cd:0,f:1,st:0,hit:0},{x:250,y:FL,vx:0,vy:0,sw:0,cd:0,f:-1,st:0,hit:0}];const tg=srv===undefined?ri(2):srv;o={x:160,y:96,vx:(tg?1:-1)*2.4,vy:-.5,sp:2.4,tg,lh:-1};trail=[];wait=60;hits=0;lastT=-1;};reset();
 const core=p=>[p.x,p.y-24];
 const cpu=()=>{const q=pl[1],b={};if(o.tg===1&&lastT!==1){const r=Math.random();lead=A.lvl===0?(r<.3?-2+rnd(3):1+rnd(8)):A.lvl===1?(r<.12?-1:2+rnd(5)):2+rnd(3.5);}lastT=o.tg;
  const[cx,cy]=core(q),d=Math.hypot(o.x-cx,o.y-cy),tti=(d-26)/o.sp;if(o.tg===1&&q.sw===0&&q.cd===0&&tti<lead){b.a=1;b.u=Math.random()<.3;b.d=!b.u&&Math.random()<.3;}
  const tx=o.tg===1?q.x:236+Math.sin(A.t*.013)*36;b.l=tx<q.x-4;b.r=tx>q.x+4;if(o.tg===1&&o.y>FL-18&&Math.abs(o.x-q.x)<70&&o.sp>7&&Math.random()<.02*A.ai)b.u=1;A.bot(b);};
 g.update=()=>{petals.forEach(p=>{p.y+=p.s;p.x+=Math.sin(A.t*.02+p.p)*.4;if(p.y>H){p.y=-4;p.x=rnd(W);}});if(end>0){end--;if(end===0){if(sc[0]>=GOAL||sc[1]>=GOAL){g.over=A.win(sc[0]>=GOAL?0:1);return;}reset(msg.startsWith(A.nm(0))?1:0);}return;}
  if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i),sp=(i&&A.cpu)?2.4*(.8+.2*A.ai):2.4;p.vx+=(ax(k)*sp-p.vx)*.3;if(h.u&&p.y>=FL){p.vy=-6.4;S('jump');}p.vy+=.34;p.x=cl(p.x+p.vx,X0+8,X1-8);p.y+=p.vy;if(p.y>FL){p.y=FL;p.vy=0;}if(Math.abs(p.vx)>.3&&p.y>=FL)p.st+=.3;p.f=o.x>p.x?1:-1;
   if(p.cd>0)p.cd--;if(h.a&&p.sw===0&&p.cd===0){p.sw=12;p.hit=0;S('blip');}
   if(p.sw>0){p.sw--;if(!wait&&p.sw>=3&&p.sw<=10&&o.tg===i&&!p.hit){const[cx,cy]=core(p);if(Math.hypot(o.x-cx-p.f*6,o.y-cy)<28){p.hit=1;hits++;o.tg=1-i;o.lh=i;o.sp=Math.min(11,o.sp+.45);const[tx,ty]=core(pl[1-i]);let ang=Math.atan2(ty-o.y,tx-o.x)+(k.u?-.9:k.d?.6:0)*(tx>o.x?1:-1);o.vx=Math.cos(ang)*o.sp;o.vy=Math.sin(ang)*o.sp;S('hit');A.shake=3;A.burst(o.x,o.y,'#ffffff',10+hits,2+o.sp*.2);}}if(p.sw===0&&!p.hit)p.cd=20;}});
  if(wait>0){wait--;return;}
  const[tx,ty]=core(pl[o.tg]),want=Math.atan2(ty-o.y,tx-o.x);let cur=Math.atan2(o.vy,o.vx);const trn=.045+o.sp*.004,da=adf(want,cur);cur+=cl(da,-trn,trn);o.vx=Math.cos(cur)*o.sp;o.vy=Math.sin(cur)*o.sp;o.x+=o.vx;o.y+=o.vy;
  if(o.x<X0+5){o.x=X0+5;o.vx=Math.abs(o.vx);}if(o.x>X1-5){o.x=X1-5;o.vx=-Math.abs(o.vx);}if(o.y<CEIL+5){o.y=CEIL+5;o.vy=Math.abs(o.vy);}if(o.y>FL-5){o.y=FL-5;o.vy=-Math.abs(o.vy);}
  if(A.t%1===0){trail.push({x:o.x,y:o.y});if(trail.length>10)trail.shift();}
  if(Math.hypot(o.x-tx,o.y-ty)<12){const w=1-o.tg;sc[w]++;g.score=sc[0];msg=A.nm(w)+' SCORES!';end=90;S('boom');A.shake=10;A.burst(o.x,o.y,PC[w],34,3.5);}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 const fighter=(p,i)=>{const s=p.sw>0?(12-p.sw)/12:0,a1=p.sw>0?(p.f>0?-2.6+s*3.2:2.6-s*3.2):(p.f>0?-.6:.6);A.person(p.x,p.y,{c:PC[i],pants:'#1a1a2a',s:SC,d:p.f,id:i?3:0,st:p.st,arm1:p.f>0?.2:a1,arm2:p.f>0?a1:-.2,cap:PD[i]});
  const shx=p.x+(p.f>0?5:-5)*SC,shy=p.y-21*SC,hx=shx-Math.sin(a1)*10*SC,hy=shy+Math.cos(a1)*10*SC,bx=hx-Math.sin(a1)*20,by=hy+Math.cos(a1)*20;A.c.lineCap='round';L(hx,hy,bx,by,'#e8e8f0',2.4);L(hx,hy,hx-Math.sin(a1)*4,hy+Math.cos(a1)*4,'#5a3a1a',3);A.c.lineCap='butt';
  if(p.sw>=3&&p.sw<=10){const[cx,cy]=core(p);ga(.55);arcS(cx+p.f*6,cy,24,p.f>0?-1.2:Math.PI-1.2,p.f>0?1.2:Math.PI+1.2,'#ffffff',3);ga(1);}
  if(p.cd>0){ga(.5);T('...',p.x,p.y-52,K.gr,1,'c',1);ga(1);}};
 g.draw=()=>{vg(0,0,W,FL,'#2a1650','#ff8a5a');glow(160,120,70,'255,200,140',.45);disc(160,120,30,'#ffd8a0');
  for(const[x,h]of[[40,90],[270,110]]){for(let j=0;j<4;j++){const w=46-j*9,y=FL-24-j*(h/4);P([[x-w/2-6,y],[x+w/2+6,y],[x+w/2,y-5],[x-w/2,y-5]],'#3a1a3a');fr(x-w/2+4,y,w-8,h/4-5,'#2a1028');}}
  fr(126,96,6,FL-96,'#6a1a1a');fr(188,96,6,FL-96,'#6a1a1a');fr(116,92,88,6,'#8a2020');fr(122,104,76,4,'#6a1a1a');
  L(0,40,W,48,'rgba(30,10,30,.6)',1);for(let x=20;x<W;x+=50){const y=42+x*.025;glow(x,y+8,14,'255,150,60',.5);rr(x-4,y+2,8,11,3,'#e04a2a');fr(x-4,y+6,8,1,'#ffcf3f');}
  for(const[cx,d]of[[0,1],[W,-1]]){L(cx,22,cx+d*60,40,'#3a1a1a',3);for(let j=0;j<7;j++)disc(cx+d*(10+j*8),26+j*2+(j%2)*4,6,j%2?'#ffb0d0':'#ff90c0');}
  fr(0,FL,W,H-FL,lin(0,FL,0,H,['#8a5a3a','#4a2a1a']));for(let y=FL+5;y<H;y+=6)fr(0,y,W,1,'rgba(0,0,0,.2)');ga(.25);ell(o.x,FL+6,18,3,o.lh<0?'#ffffff':PC[o.lh]);ga(1);
  pl.forEach(fighter);
  const col=o.lh<0?'#ffffff':PC[o.lh],rgb=o.lh<0?'255,255,255':o.lh?'255,79,154':'47,214,195';trail.forEach((t,j)=>{ga(j/14);disc(t.x,t.y,2+j*.35,col);});ga(1);glow(o.x,o.y,16+o.sp,rgb,.55);C(o.x,o.y,6,o.lh<0?'#e8e8f0':o.lh?'#ff4f9a':'#2fd6c3');disc(o.x-1.5,o.y-1.5,2,'#ffffff');
  const[tx,ty]=core(pl[o.tg]);if(!end&&Math.hypot(o.x-tx,o.y-ty)<70){ga(.6);ering(tx,ty,14+Math.sin(A.t*.6)*2,14+Math.sin(A.t*.6)*2,K.r,1.5);ga(1);}
  for(const p of petals){fr(p.x,p.y,2,1.4,'#ffc0d8');}
  hud(sc[0],sc[1],GOAL,'SPEED '+o.sp.toFixed(1));if(end)banner(msg,PC[msg.startsWith(A.nm(0))?0:1]);else ready(wait,60);};
 return g;}});

/* ================= 16. KING OF THE HILL ================= */
A.add({id:'kingofhill',name:'KING OF THE HILL',cat:'VERSUS',vs:1,how:'ARROWS MOVE, A SHOVES. STAND ALONE ON THE SUMMIT TO SCORE. FIRST TO 25.',make(){
 const g={over:null,score:0},CX=160,CY=146,SQ=.6,AR=114,HR=94,HH=34,ZR=24,GOAL=25;let pl,sc=[0,0],hold=[0,0],wait=60,end=0,rocks=[],rt=420,king=-1,plan={e:0,ex:0};
 const hgt=r=>r<HR?HH*(1-(r/HR)*(r/HR)):0;
 pl=[{x:-84,y:24,vx:0,vy:0,fx:1,fy:0,cd:0,dash:0,stun:0,st:0},{x:84,y:-24,vx:0,vy:0,fx:-1,fy:0,cd:0,dash:0,stun:0,st:0}];
 const scr=(x,y)=>[CX+x,CY+y*SQ-hgt(Math.hypot(x,y))];
 const cpu=()=>{const q=pl[1],o=pl[0],b={};if(A.t%30===0){plan.e=(rnd(2)-1)*(1-A.ai)*22;plan.ex=(rnd(2)-1)*(1-A.ai)*22;}let tx=plan.e,ty=plan.ex,threat=false;
  for(const k of rocks){const dx=q.x-k.x,dy=q.y-k.y;if(Math.hypot(dx,dy)<44&&k.vx*dx+k.vy*dy>0&&Math.random()<.5+.5*A.ai){threat=true;tx=q.x-k.vy*20;ty=q.y+k.vx*20;}}
  const d=Math.hypot(o.x-q.x,o.y-q.y),ro=Math.hypot(o.x,o.y);if(!threat&&(ro<ZR+16)){tx=o.x;ty=o.y;if(d<34&&q.cd===0&&!q.stun&&Math.random()<.03+.1*A.ai)b.a=1;}
  const dx=tx-q.x-q.vx*4,dy=ty-q.y-q.vy*4;b.l=dx<-3;b.r=dx>3;b.u=dy<-3;b.d=dy>3;A.bot(b);};
 g.update=()=>{if(end>0){if(--end===0)g.over=A.win(sc[0]>=GOAL?0:1);return;}if(wait>0){wait--;return;}if(A.cpu)cpu();
  pl.forEach((p,i)=>{const k=A.in(i),h=A.hit(i),r=Math.hypot(p.x,p.y);if(p.cd>0)p.cd--;if(p.dash>0)p.dash--;
   if(p.stun>0)p.stun--;else{let ix=ax(k),iy=ay(k);const m=Math.hypot(ix,iy)||1;ix/=m;iy/=m;const acc=(i&&A.cpu)?.2*(.82+.18*A.ai):.2;p.vx+=ix*acc;p.vy+=iy*acc;if(ix||iy){p.fx=ix;p.fy=iy;p.st+=.3;}
    if(h.a&&p.cd===0){p.vx+=p.fx*3.8;p.vy+=p.fy*3.8;p.dash=12;p.cd=50;S('jump');}}
   if(r>2&&r<HR){const s=.055*(r/HR);p.vx+=p.x/r*s;p.vy+=p.y/r*s;}const fr_=p.dash?.92:.85;p.vx*=fr_;p.vy*=fr_;p.x+=p.vx;p.y+=p.vy;const r2=Math.hypot(p.x,p.y);if(r2>AR-8){p.x*=(AR-8)/r2;p.y*=(AR-8)/r2;}});
  const a=pl[0],b=pl[1],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy);if(d<16&&d>0){const nx=dx/d,ny=dy/d,o=(16-d)/2;a.x-=nx*o;a.y-=ny*o;b.x+=nx*o;b.y+=ny*o;
   if(a.dash&&!b.dash&&!b.stun){b.vx+=nx*5;b.vy+=ny*5;b.stun=24;S('hit');A.shake=5;const[sx,sy]=scr(b.x,b.y);A.burst(sx,sy-20,K.y,12,2);}else if(b.dash&&!a.dash&&!a.stun){a.vx-=nx*5;a.vy-=ny*5;a.stun=24;S('hit');A.shake=5;const[sx,sy]=scr(a.x,a.y);A.burst(sx,sy-20,K.y,12,2);}
   else if(a.dash&&b.dash){a.vx-=nx*3;a.vy-=ny*3;b.vx+=nx*3;b.vy+=ny*3;a.dash=b.dash=0;S('hit');}}
  if(--rt===40)A.shake=12;if(rt<=0){rt=360+ri(240);const an=rnd(TAU);rocks.push({x:0,y:0,vx:Math.cos(an)*2.4,vy:Math.sin(an)*2.4,sp:0});S('boom');}
  for(const k of rocks){k.x+=k.vx;k.y+=k.vy;k.vx*=1.004;k.vy*=1.004;k.sp+=.2;pl.forEach(p=>{if(!p.stun&&Math.hypot(p.x-k.x,p.y-k.y)<14){const n=Math.hypot(k.vx,k.vy)||1;p.vx+=k.vx/n*4.5;p.vy+=k.vy/n*4.5;p.stun=28;S('hit');A.shake=6;}});}rocks=rocks.filter(k=>Math.hypot(k.x,k.y)<AR+20);
  const inZ=pl.map(p=>Math.hypot(p.x,p.y)<ZR&&!p.stun);king=inZ[0]&&!inZ[1]?0:inZ[1]&&!inZ[0]?1:-1;
  if(king>=0&&++hold[king]>=60){hold[king]=0;sc[king]++;g.score=sc[0];S('coin');const[sx,sy]=scr(pl[king].x,pl[king].y);A.fx.push({txt:'+1',x:sx,y:sy-46,vx:0,vy:-.6,t:30,c:PC[king],g:0});if(sc[king]>=GOAL){end=90;S('win');}}};
 g.timeUp=()=>tu(sc[0],sc[1]);
 g.draw=()=>{vg(0,0,W,H,'#4a9ae8','#e8f4ff');glow(60,46,40,'255,250,220',.6);disc(60,46,12,'#fffbe0');
  P([[0,112],[40,70],[80,96],[130,58],[180,92],[230,64],[280,96],[W,74],[W,130],[0,130]],'#8aa8c8');P([[120,62],[130,58],[140,64]],'#ffffff');P([[222,68],[230,64],[238,70]],'#ffffff');P([[0,124],[60,100],[120,118],[200,96],[260,114],[W,100],[W,140],[0,140]],'#5a9a5a');
  ell(CX,CY+12,AR+10,(AR+10)*SQ,'#4a3420');ell(CX,CY+6,AR+6,(AR+6)*SQ,'#6a4a2a');ell(CX,CY,AR,AR*SQ,'#4c9a3c');
  const post=(an)=>{const x=CX+Math.cos(an)*(AR+2),y=CY+Math.sin(an)*(AR+2)*SQ;fr(x-1.5,y-10,3,10,'#7a5028');fr(x-1.5,y-10,3,2,'#a87848');};for(let j=0;j<24;j++){const an=j*TAU/24;if(Math.sin(an)<0)post(an);}
  for(let r=HR;r>0;r-=6){const h=hgt(r),t=1-r/HR;ell(CX,CY-h,r,r*SQ,A.mix('#3e8a30','#8fd06a',t));}
  ell(CX,CY-HH+1,ZR,ZR*SQ,king>=0?PL[king]:'#c8e8a0');ering(CX,CY-HH+1,ZR,ZR*SQ,king>=0?PC[king]:'#ffcf3f',2);for(let j=0;j<10;j++){const an=j*TAU/10;disc(CX+Math.cos(an)*ZR,CY-HH+1+Math.sin(an)*ZR*SQ,2,'#9a9aa8');}
  const fx=CX,fy=CY-HH;fr(fx-1,fy-30,2,30,'#e8e8f0');const fc=king>=0?PC[king]:'#ffffff';A.c.fillStyle=fc;A.c.beginPath();A.c.moveTo(fx+1,fy-30);for(let j=0;j<=6;j++)A.c.lineTo(fx+1+j*3,fy-30+Math.sin(A.t*.15+j)*1.5+j*.3);for(let j=6;j>=0;j--)A.c.lineTo(fx+1+j*3,fy-20+Math.sin(A.t*.15+j)*1.5);A.c.fill();
  if(rt<60&&rt%10<5){T('ROCK!',CX,fy-44,K.r,1,'c',1);}
  const things=[];pl.forEach((p,i)=>things.push({y:p.y,f:()=>{const[sx,sy]=scr(p.x,p.y);ell(sx,sy,8,2.5,'rgba(0,0,0,.3)');A.person(sx,sy,{c:PC[i],pants:'#2a2a3a',s:1.05,d:p.fx>=0?1:-1,id:i?3:0,st:p.st,arm1:p.dash?-1.4*(p.fx>=0?1:-1):undefined,arm2:p.dash?-1.4*(p.fx>=0?1:-1):undefined,cap:PD[i]});
   if(king===i){P([[sx-5,sy-41],[sx-5,sy-46],[sx-2.5,sy-43],[sx,sy-47],[sx+2.5,sy-43],[sx+5,sy-46],[sx+5,sy-41]],K.y);arcS(sx,sy-20,14,-1.57,-1.57+TAU*hold[i]/60,PC[i],2);}
   if(p.stun>0)for(let j=0;j<3;j++){const an=A.t*.2+j*2.1;disc(sx+Math.cos(an)*7,sy-40+Math.sin(an)*2,1.5,K.y);}}}));
  rocks.forEach(k=>things.push({y:k.y,f:()=>{const[sx,sy]=scr(k.x,k.y);ell(sx,sy+2,8,2.5,'rgba(0,0,0,.3)');C(sx,sy-6,7,'#8a8a98');L(sx+Math.cos(k.sp)*6,sy-6+Math.sin(k.sp)*6,sx-Math.cos(k.sp)*6,sy-6-Math.sin(k.sp)*6,'#5a5a68',1.5);}}));
  things.sort((p,q)=>p.y-q.y).forEach(t=>t.f());for(let j=0;j<24;j++){const an=j*TAU/24;if(Math.sin(an)>=0)post(an);}
  hud(sc[0],sc[1],0,king>=0?'KING: '+A.nm(king):'FIRST TO 25');if(end)banner(A.nm(sc[0]>=GOAL?0:1)+' IS KING!',K.y);else if(wait)ready(wait,60);};
 return g;}});

})();
