(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

/* ---- PADDLE DUEL ---- */
A.add({id:'pong',name:'PADDLE DUEL',cat:'SPORTS',vs:1,how:'UP AND DOWN MOVE YOUR PADDLE.|FIRST TO 7 POINTS WINS.',make(){
 const g={over:null,score:0};let p=[104,104],sc=[0,0],b,serve;
 const reset=d=>{b={x:160,y:120,vx:d*2.2,vy:rnd(2)-1};serve=50;};reset(1);
 g.update=()=>{if(A.cpu){const ty=b.vx>0?b.y:120,c=p[1]+16;A.bot({u:c>ty+5,d:c<ty-5});}
  for(let i=0;i<2;i++){const sp=i&&A.cpu?1.4+2*A.ai:3.2;p[i]=cl(p[i]+ay(A.in(i))*sp,16,H-36);}
  if(serve>0){serve--;return;}b.x+=b.vx;b.y+=b.vy;
  if(b.y<18||b.y>H-6){b.vy*=-1;b.y=cl(b.y,18,H-6);S('blip');}
  for(let i=0;i<2;i++){const px=i?304:16;if((i?b.vx>0:b.vx<0)&&Math.abs(b.x-px)<5&&b.y>p[i]-3&&b.y<p[i]+35){b.vx=cl(-b.vx*1.06,-6.5,6.5);b.vy=(b.y-p[i]-16)/5;S('hit');}}
  if(b.x<-5||b.x>W+5){const w=b.x<0?1:0;sc[w]++;S('score');if(sc[w]>=7)g.over=A.win(w);else reset(w?-1:1);}};
 g.draw=()=>{A.cls();for(let y=18;y<H;y+=12)R(159,y,2,6,K.d);R(0,15,W,1,K.gr);A.hud2(sc[0],sc[1]);R(12,p[0],4,32,K.c);R(304,p[1],4,32,K.p);R(b.x-2,b.y-2,5,5,K.w);};
 return g;}});

/* ---- COURT TENNIS (pseudo-3D) ---- */
A.add({id:'tennis',name:'COURT TENNIS',cat:'SPORTS',vs:1,how:'MOVE ANYWHERE ON YOUR SIDE. A SWINGS.|HOLD LEFT OR RIGHT WHILE SWINGING TO AIM. FIRST TO 7.',make(){
 const g={over:null,score:0},GR=.0012;let pl,b,sc=[0,0],wait=0,srv=0,msg='';
 const pr=(x,y,z)=>{const s=1/(1+y*.5);return[160+x*125*s,218-(y/(1+y*.5))*150-(z||0)*70*s,s];};
 const shoot=(i,tx,ty,t)=>{b.vx=(tx-b.x)/t;b.vy=(ty-b.y)/t;b.vz=(.5*GR*t*t-b.z)/t;b.last=i;b.bn=0;S('hit');};
 const serve=()=>{pl=[{x:0,y:.15,sw:0},{x:0,y:1.85,sw:0}];b={x:0,y:srv?1.8:.2,z:.4,vx:0,vy:0,vz:0,last:srv,bn:0};shoot(srv,rnd(.8)-.4,srv?.55:1.45,62);wait=0;};
 const point=(w,m)=>{sc[w]++;msg=m;wait=70;srv=w;S('score');if(sc[w]>=7)g.over=A.win(w);};serve();
 g.update=()=>{if(wait>0){if(--wait===0)serve();return;}
  if(A.cpu){const q=pl[1];let tx=0,ty=1.7;if(b.last===0){const t=Math.max(0,(1.6-b.y)/(b.vy||.01));tx=b.x+b.vx*Math.min(t,80);ty=cl(b.y>1?b.y+.1:1.6,1.2,1.9);}
   const near=Math.abs(b.x-q.x)<.2&&Math.abs(b.y-q.y)<.22;A.bot({l:q.x>tx+.05,r:q.x<tx-.05,u:q.y<ty-.05,d:q.y>ty+.05,a:near&&b.last===0&&A.t%3===0});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=(i&&A.cpu?.011+.012*A.ai:.024);q.x=cl(q.x+ax(k)*sp,-1.25,1.25);q.y=cl(q.y-ay(k)*sp,i?1.12:-.15,i?2.15:.88);
   if(q.sw>0)q.sw--;if(A.hit(i).a&&q.sw===0){q.sw=18;if(b.last!==i&&Math.abs(b.x-q.x)<.27&&Math.abs(b.y-q.y)<.27&&b.z<.85){const aim=ax(k)*.7+rnd(.3)-.15;shoot(i,cl(aim,-.92,.92),i?.35+rnd(.4):1.65-rnd(.4),50+rnd(12));}}}
  const oy=b.y;b.x+=b.vx;b.y+=b.vy;b.z+=b.vz;b.vz-=GR;
  if((oy-1)*(b.y-1)<=0&&oy!==b.y&&b.z<.13){point(1-b.last,'NET!');return;}
  if(b.z<0){b.z=0;b.vz*=-.72;b.bn++;const inb=Math.abs(b.x)<=1.02&&(b.last===0?b.y>1&&b.y<=2.03:b.y<1&&b.y>=-.03);
   if(b.bn===1&&!inb)point(1-b.last,'OUT!');else if(b.bn===2)point(b.last,'POINT!');else S('blip');}};
 g.draw=()=>{A.cls('#123a2a');const q=(x,y)=>pr(x,y);A.poly([q(-1,0),q(1,0),q(1,2),q(-1,2)],'#1d6b4a',1);
  [[-1,0,1,0],[-1,2,1,2],[-1,0,-1,2],[1,0,1,2],[-.75,0,-.75,2],[.75,0,.75,2],[-.75,.5,.75,.5],[-.75,1.5,.75,1.5],[0,.5,0,1.5]].forEach(l=>{const a=q(l[0],l[1]),c=q(l[2],l[3]);L(a[0],a[1],c[0],c[1],K.w);});
  const ents=[{y:pl[1].y,f:()=>man(1)},{y:1,f:()=>{const a=pr(-1.1,1),c=pr(1.1,1),t=pr(-1.1,1,.13);A.rect(a[0],t[1],c[0]-a[0],a[1]-t[1],'rgba(255,255,255,.35)');L(a[0],t[1],c[0],t[1],K.w);}},{y:b.y,f:()=>{const s=pr(b.x,b.y),p=pr(b.x,b.y,b.z);C(s[0],s[1],2.5*s[2]+.5,'rgba(0,0,0,.4)');C(p[0],p[1],3*p[2]+.8,K.y);}},{y:pl[0].y,f:()=>man(0)}];
  function man(i){const m=pl[i],p=pr(m.x,m.y),s=p[2];R(p[0]-5*s,p[1]-22*s,10*s,16*s,i?K.p:K.c);R(p[0]-4*s,p[1]-30*s,8*s,8*s,'#ffd9a8');R(p[0]-5*s,p[1]-6*s,4*s,6*s,K.w);R(p[0]+1*s,p[1]-6*s,4*s,6*s,K.w);const rx=m.sw>8?12:7;L(p[0]+5*s,p[1]-16*s,p[0]+rx*s+4,p[1]-(m.sw>8?26:14)*s,K.y,2);}
  ents.sort((a,c)=>c.y-a.y).forEach(e=>e.f());A.hud2(sc[0],sc[1]);if(wait>0)T(msg,160,60,K.y,3,'c');};
 return g;}});

/* ---- BEACH VOLLEY ---- */
A.add({id:'volley',name:'BEACH VOLLEY',cat:'SPORTS',vs:1,how:'LEFT AND RIGHT MOVE, UP OR A JUMPS.|BOUNCE THE BALL OVER THE NET. FIRST TO 7.',make(){
 const g={over:null,score:0},GY=212;let pl,b,sc=[0,0],wait=40;
 const reset=s=>{pl=[{x:80,y:GY,vy:0},{x:240,y:GY,vy:0}];b={x:s?232:88,y:90,vx:0,vy:0};wait=40;};reset(0);
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const q=pl[1];let tx=240;if(b.x>150){let x=b.x,y=b.y,vx=b.vx,vy=b.vy,n=0;while(y<GY-22&&n++<120){vy+=.16;x+=vx;y+=vy;if(x>W-7||x<167)vx=-vx;}tx=x+8;}
   A.bot({l:q.x>tx+4,r:q.x<tx-4,u:b.x>160&&Math.abs(b.x-q.x)<30&&b.y>GY-95&&b.y<GY-40&&Math.random()<A.ai});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),sp=i&&A.cpu?1.5+1.6*A.ai:3;q.x=cl(q.x+ax(k)*sp,i?180:16,i?W-16:140);if((k.u||k.a)&&q.y>=GY){q.vy=-5.2;S('jump');}q.vy+=.26;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}
   const dx=b.x-q.x,dy=b.y-(q.y-2),d=Math.hypot(dx,dy);if(d<24&&dy<6){const nx=dx/(d||1),ny=dy/(d||1);b.x=q.x+nx*24;b.y=q.y-2+ny*24;const sp2=Math.max(4.2,Math.hypot(b.vx,b.vy)*.9);b.vx=nx*sp2+ax(k)*.8;b.vy=ny*sp2-1+q.vy*.4;S('hit');}}
  b.vy+=.16;b.x+=b.vx;b.y+=b.vy;b.vx=cl(b.vx,-6,6);b.vy=cl(b.vy,-8,8);
  if(b.x<7){b.x=7;b.vx=Math.abs(b.vx);}if(b.x>W-7){b.x=W-7;b.vx=-Math.abs(b.vx);}if(b.y<7){b.y=7;b.vy=Math.abs(b.vy);}
  if(b.y>GY-62&&Math.abs(b.x-160)<10){if(b.y<GY-56&&b.vy>0){b.vy=-Math.abs(b.vy)*.8;b.y=GY-63;}else{b.vx=(b.x<160?-1:1)*Math.max(1.5,Math.abs(b.vx));b.x=160+(b.x<160?-10:10);}}
  if(b.y>GY-7){const w=b.x<160?1:0;sc[w]++;S('score');if(sc[w]>=7)g.over=A.win(w);else reset(w);}};
 g.draw=()=>{A.cls('#2a5db0');R(0,150,W,62,'#1b8fb8');C(260,50,18,K.y);R(0,GY,W,28,'#e8c77a');R(158,GY-56,4,56,K.w);
  pl.forEach((q,i)=>{A.c.fillStyle=i?K.p:K.c;A.c.beginPath();A.c.arc(q.x,q.y,17,Math.PI,0);A.c.fill();R(q.x+(i?-9:5),q.y-11,4,4,K.w);R(q.x+(i?-9:7),q.y-10,2,2,K.k);});
  C(b.x,b.y,7,K.w);R(b.x-3,GY+3,6,2,'rgba(0,0,0,.3)');A.hud2(sc[0],sc[1]);};
 return g;}});

/* ---- HOOPS ONE ON ONE ---- */
A.add({id:'hoops',name:'HOOPS 1 ON 1',cat:'SPORTS',vs:1,how:'A SHOOTS WHEN YOU HAVE THE BALL, STEALS WHEN YOU DO NOT.|UP JUMPS TO BLOCK. CLOSER SHOTS ARE SAFER. 60 SECONDS.',make(){
 const g={over:null,score:0},GY=205,HX=[296,24],HY=112;let pl,b,sc=[0,0],time=3600,clock=0,msg='',mt=0;
 const give=i=>{pl=[{x:110,y:GY,vy:0,cd:0},{x:210,y:GY,vy:0,cd:0}];b={own:i,x:0,y:0,vx:0,vy:0,pts:2,by:i};clock=600;};give(0);
 g.update=()=>{if(mt>0)mt--;time--;
  if(A.cpu){const q=pl[1],o=pl[0];let o2={};if(b.own===1){const d=q.x-HX[1];o2={l:d>95,a:d<=95+rnd(30)||clock<90||(Math.abs(q.x-o.x)<20&&Math.random()<.04)};}
   else if(b.own===0){const tx=o.x-10;o2={l:q.x>tx+4,r:q.x<tx-4,a:Math.abs(q.x-o.x)<18&&Math.random()<.05*A.ai};}
   else{const tx=b.own===-1?b.x:60;o2={l:q.x>tx+4,r:q.x<tx-4,u:b.own===-2&&b.by===0&&Math.abs(b.x-q.x)<26&&b.y>GY-90&&Math.random()<A.ai*.3};}A.bot(o2);}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),h=A.hit(i),sp=(b.own===i?2:2.4)*(i&&A.cpu?.6+.4*A.ai:1);q.x=cl(q.x+ax(k)*sp,14,W-14);if(q.cd>0)q.cd--;
   if(k.u&&q.y>=GY&&b.own!==i){q.vy=-4.6;}q.vy+=.25;q.y+=q.vy;if(q.y>GY){q.y=GY;q.vy=0;}
   if(h.a){if(b.own===i){const dx=HX[i]-q.x,dist=Math.abs(dx),t=38+dist*.12,def=Math.abs(pl[1-i].x-q.x)<26?1.8:1,err=(rnd(2)-1)*(dist*.011+.12)*def;b.x=q.x;b.y=q.y-30;b.vx=dx/t+err;b.vy=(HY-b.y-.5*.2*t*t)/t;b.own=-2;b.by=i;b.pts=dist>170?3:2;S('jump');}
    else if(b.own===1-i&&q.cd===0&&Math.abs(q.x-pl[1-i].x)<20){q.cd=40;if(Math.random()<.45){b.own=i;clock=600;S('coin');}}}}
  if(b.own>=0){const q=pl[b.own];b.x=q.x+(b.own?-8:8);b.y=q.y-14-Math.abs(Math.sin(A.t*.25))*8;if(--clock<=0){msg='SHOT CLOCK!';mt=60;give(1-b.own);}}
  else{const oyb=b.y;b.vy+=.2;b.x+=b.vx;b.y+=b.vy;
   if(b.own===-2){const hx=HX[b.by];if(oyb<HY&&b.y>=HY&&Math.abs(b.x-hx)<9){sc[b.by]+=b.pts;msg=b.pts+' POINTS!';mt=60;S('score');give(1-b.by);return;}
    if(Math.abs(b.y-HY)<4&&Math.abs(Math.abs(b.x-hx)-11)<3){b.vx=-b.vx*.6;b.vy=-Math.abs(b.vy)*.5;S('blip');}
    const d=pl[1-b.by];if(Math.abs(b.x-d.x)<11&&Math.abs(b.y-(d.y-30))<12&&d.y<GY-6){b.vx=-b.vx*.4;b.vy=-2;b.own=-1;S('hit');}}
   if(b.x<6||b.x>W-6){b.vx*=-.7;b.x=cl(b.x,6,W-6);}if(b.y>GY-4){b.y=GY-4;b.vy*=-.6;b.vx*=.85;b.own=-1;}
   if(b.own===-1||b.y>GY-45)for(let i=0;i<2;i++)if(b.own<0&&Math.abs(b.x-pl[i].x)<12&&b.y>pl[i].y-40&&(b.own===-1||i!==b.by)){b.own=i;clock=600;}}
  if(time<=0&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);};
 g.draw=()=>{A.cls('#241a4d');R(0,GY,W,35,'#b5651d');R(0,GY,W,2,K.w);L(160,GY,160,H,K.w);
  HX.forEach((hx,i)=>{const bx=i?4:W-8;R(bx,HY-34,4,44,K.w);R(bx+(i?4:-16),HY,16,2,K.o);R(i?hx-10:hx-10,HY,20,2,K.r);for(let n=0;n<4;n++)L(hx-9+n*6,HY+2,hx-6+n*4,HY+14,K.gr);R(bx+1,HY+10,2,GY-HY-10,K.gr);});
  pl.forEach((q,i)=>{R(q.x-5,q.y-24,10,15,i?K.p:K.c);R(q.x-4,q.y-32,8,8,'#ffd9a8');R(q.x-5,q.y-9,4,9,K.w);R(q.x+1,q.y-9,4,9,K.w);});
  C(b.x,b.y,5,K.o);A.hud2(sc[0],sc[1]);T(Math.max(0,Math.ceil(time/60)),160,4,time<0?K.r:K.w,2,'c');if(time<=0)T('NEXT BASKET WINS',160,20,K.r,1,'c');
  if(b.own>=0)T('SHOT '+Math.ceil(clock/60),160,28,K.gr,1,'c');if(mt>0)T(msg,160,70,K.y,3,'c');};
 return g;}});

/* ---- PIXEL SOCCER ---- */
A.add({id:'soccer',name:'PIXEL SOCCER',cat:'SPORTS',vs:1,how:'RUN INTO THE BALL TO DRIBBLE. A KICKS HARD.|KEEPERS MOVE ON THEIR OWN. FIRST TO 5 OR BEST AFTER 90 SECONDS.',make(){
 const g={over:null,score:0};let pl,kp,b,sc=[0,0],time=5400,wait=50;
 const reset=()=>{pl=[{x:100,y:125,fx:1,fy:0},{x:220,y:125,fx:-1,fy:0}];kp=[125,125];b={x:160,y:125,vx:0,vy:0};wait=50;};reset();
 g.update=()=>{if(wait>0){wait--;return;}time--;
  if(A.cpu){const q=pl[1],vx=b.x-14,vy=b.y-125,n=Math.hypot(vx,vy)||1,ux=vx/n,uy=vy/n,beh=(q.x-b.x)*ux+(q.y-b.y)*uy>2,dd=Math.hypot(q.x-b.x,q.y-b.y);let tx,ty;if(beh){tx=b.x+ux*2;ty=b.y+uy*2;}else{tx=b.x+ux*22;ty=b.y+uy*22+(q.y<b.y?-16:16);}
   A.bot({l:q.x>tx+1.5,r:q.x<tx-1.5,u:q.y>ty+1.5,d:q.y<ty-1.5,a:beh&&dd<9&&A.t%4===0&&(b.x<190||Math.random()<.3)});}
  for(let i=0;i<2;i++){const q=pl[i],k=A.in(i),dx=ax(k),dy=ay(k),sp=i&&A.cpu?1.1+.9*A.ai:1.9;if(dx||dy){const m=Math.hypot(dx,dy);q.fx=dx/m;q.fy=dy/m;q.x=cl(q.x+q.fx*sp,14,W-14);q.y=cl(q.y+q.fy*sp,30,H-14);}
   const ddx=b.x-q.x,ddy=b.y-q.y,d=Math.hypot(ddx,ddy);if(d<9){if(A.hit(i).a){b.vx=q.fx*5.5;b.vy=q.fy*5.5;S('hit');}else{b.vx=ddx/(d||1)*2.3+q.fx*.5;b.vy=ddy/(d||1)*2.3+q.fy*.5;}}
   const ty=cl(b.y,100,150),ks=.9+.5*(i&&A.cpu?A.ai:.7);kp[i]+=cl(ty-kp[i],-ks,ks);const kx=i?W-18:18;if(Math.abs(b.x-kx)<6&&Math.abs(b.y-kp[i])<10){b.vx=(i?-1:1)*(2.5+rnd(2));b.vy=rnd(4)-2;S('blip');}}
  b.x+=b.vx;b.y+=b.vy;b.vx*=.975;b.vy*=.975;if(Math.hypot(b.vx,b.vy)<.4&&(b.x<24||b.x>W-24||b.y<40||b.y>H-24)){b.vx+=(160-b.x)*.004;b.vy+=(125-b.y)*.004;}if(b.y<28||b.y>H-12){b.vy*=-1;b.y=cl(b.y,28,H-12);}
  const inG=b.y>95&&b.y<155;if(b.x<12||b.x>W-12){if(inG){const w=b.x<12?1:0;sc[w]++;S('score');if(sc[w]>=5){g.over=A.win(w);return;}reset();}else{b.vx*=-1;b.x=cl(b.x,12,W-12);}}
  if(time<=0){if(sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);else time=600;}};
 g.draw=()=>{A.cls('#176b35');for(let i=0;i<8;i++)if(i%2)R(i*40,24,40,H-32,'#1a7a3d');A.box(10,26,W-20,H-36,K.w);L(160,26,160,H-10,K.w);A.ring(160,125,28,K.w);A.box(10,85,34,80,K.w);A.box(W-44,85,34,80,K.w);R(4,95,7,60,K.gr);R(W-11,95,7,60,K.gr);
  kp.forEach((y,i)=>R((i?W-18:18)-3,y-8,6,16,i?'#ffb3d1':'#a8fff5'));pl.forEach((q,i)=>{R(q.x-5,q.y-6,10,12,i?K.p:K.c);R(q.x-3,q.y-10,6,5,'#ffd9a8');R(q.x+q.fx*6-1,q.y+q.fy*6-1,3,3,K.w);});
  C(b.x,b.y,3.5,K.w);A.hud2(sc[0],sc[1]);T(Math.ceil(time/60),160,4,K.w,2,'c');if(wait>0)T('KICK OFF',160,60,K.y,3,'c');};
 return g;}});

/* ---- AIR HOCKEY ---- */
A.add({id:'airhockey',name:'AIR HOCKEY',cat:'SPORTS',vs:1,how:'SLIDE YOUR MALLET AROUND YOUR HALF.|KNOCK THE PUCK INTO THE FAR GOAL. FIRST TO 7.',make(){
 const g={over:null,score:0};let m,b,sc=[0,0],wait=40;
 const reset=s=>{m=[{x:50,y:125,vx:0,vy:0},{x:270,y:125,vx:0,vy:0}];b={x:s?190:130,y:125,vx:0,vy:0};wait=40;};reset(0);
 g.update=()=>{if(wait>0){wait--;return;}
  if(A.cpu){const q=m[1];let tx=278,ty=cl(b.y,90,160);if(b.x>165){tx=b.x+(b.vx>1?20:-2);ty=b.y;if(b.x>q.x+4){tx=b.x+16;ty=b.y+(q.y<b.y?-14:14);}}A.bot({l:q.x>tx+3,r:q.x<tx-3,u:q.y>ty+3,d:q.y<ty-3});}
  for(let i=0;i<2;i++){const q=m[i],k=A.in(i),acc=i&&A.cpu?.35+.45*A.ai:.8;q.vx=(q.vx+ax(k)*acc)*.86;q.vy=(q.vy+ay(k)*acc)*.86;q.x=cl(q.x+q.vx,i?172:22,i?W-22:148);q.y=cl(q.y+q.vy,40,H-24);
   const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<17){const nx=dx/(d||1),ny=dy/(d||1);b.x=q.x+nx*17;b.y=q.y+ny*17;const rv=(b.vx-q.vx)*nx+(b.vy-q.vy)*ny;if(rv<0){b.vx-=1.9*rv*nx;b.vy-=1.9*rv*ny;S('hit');}}}
  const sp=Math.hypot(b.vx,b.vy);if(sp>7){b.vx*=7/sp;b.vy*=7/sp;}b.x+=b.vx;b.y+=b.vy;b.vx*=.994;b.vy*=.994;
  if(b.y<35||b.y>H-19){b.vy*=-1;b.y=cl(b.y,35,H-19);S('blip');}
  if(b.x<17||b.x>W-17){if(b.y>95&&b.y<155){if(b.x<6||b.x>W-6){const w=b.x<17?1:0;sc[w]++;S('score');if(sc[w]>=7)g.over=A.win(w);else reset(w?0:1);}}else{b.vx*=-1;b.x=cl(b.x,17,W-17);S('blip');}}};
 g.draw=()=>{A.cls();R(10,28,W-20,H-40,'#e9f4ff');A.box(10,28,W-20,H-40,K.b);L(160,28,160,H-12,K.r,2);A.ring(160,125,26,K.r);R(6,95,5,60,K.k);R(W-11,95,5,60,K.k);
  m.forEach((q,i)=>{C(q.x,q.y,11,i?K.p:K.c);C(q.x,q.y,5,i?'#a0205a':'#178a7d');});C(b.x,b.y,6,K.k);C(b.x,b.y,4,K.y);A.hud2(sc[0],sc[1]);};
 return g;}});
})();
