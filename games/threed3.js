(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const pjOK=p=>p&&p[2]>.1&&isFinite(p[0])&&isFinite(p[1]);
const jet=(x,y,bank,s,col)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(bank||0);c.scale(s||1,s||1);X.glow(0,7,12+Math.sin(A.t*.8)*3,'#40a0ff',.6);X.poly([[0,-11],[-16,7],[-5,4],[0,7],[5,4],[16,7]],X.lg(-16,0,16,0,[X.lt(col||'#2fe8d0',.6),col||'#2fe8d0',X.lt(col||'#2fe8d0',.6)]));X.poly([[0,-11],[-3.5,2],[0,4],[3.5,2]],'#e0fffa');X.poly([[-16,7],[-18,1],[-12,5]],'#ff4f6d');X.poly([[16,7],[18,1],[12,5]],'#ff4f6d');X.disc(0,8,2.4,A.t%4<2?'#ffd040':'#ff8020');c.restore();};
const ringN=(x,y,z,r,col,col2)=>{for(let i=0;i<12;i++){const a=i*.5236,b=a+.5236;F([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*(r+.32),y+Math.sin(b)*(r+.32),z],[x+Math.cos(a)*(r+.32),y+Math.sin(a)*(r+.32),z]],i%2?col:(col2||col),false);}};
const sky=(top,bot)=>A.skyband(top,bot,130);
const ring3=(x,y,z,r,col)=>{for(let i=0;i<8;i++){const a=i*.785,b=a+.785;F([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*(r+.3),y+Math.sin(b)*(r+.3),z],[x+Math.cos(a)*(r+.3),y+Math.sin(a)*(r+.3),z]],col,false);}};

/* ---- RING RACE 3D ---- */
A.add({id:'rings',name:'RING RACE 3D',cat:'RETRO 3D',hd:1,how:'FLY THROUGH EVERY RING. EACH ONE ADDS TIME.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=1.5,z=0,v=.2,time=1200,rings=[],roll=0;for(let i=1;i<10;i++)rings.push({z:i*12,x:rnd(6)-3,y:1+rnd(3),ok:0});
 g.update=()=>{time--;const k=A.in(0);px=cl(px+ax(k)*.13,-4,4);py=cl(py-ay(k)*.13,.4,5);roll+=(ax(k)*.4-roll)*.1;z+=v;v=Math.min(.34,v+.0001);
  for(const r of rings){if(!r.ok&&r.z<z){r.ok=1;if(Math.hypot(px-r.x,py-r.y)<1.3){g.score+=10;time+=240;S('coin');r.ok=2;fx.ring(160,130,K.y,60);fx.spark(160,130,K.y,16,3);fx.pop(160,100,'+4 SEC',K.g);}else{S('lose');fx.pop(160,100,'MISSED','#ff6a6a');}}if(r.z<z-2){r.z+=108;r.x=rnd(6)-3;r.y=1+rnd(3);r.ok=0;}}if(time<=0)g.over='TIME UP';};
 g.draw=()=>{sky('#1a2a6a','#ff9838');X.glow(220,118,60,'#ffc070',.45);X.disc(220,118,16,'#ffe8a0');X.hills(131,22,'#3a4a6a',px*8,.018,3);X.hills(131,12,'#2a5a4a',px*14,.03,7);R(0,130,W,110,'#1e5a35');A.fog={col:'#6a7a5a',near:25,far:60};A.cam.x=px*.9;A.cam.y=py*.9+.6;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=-.08;
  for(let i=-4;i<=4;i+=2){const a=A.p3(px*.9+i*3,0,z+1),b=A.p3(px*.9+i*3,0,z+50);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],'#2a7a45');}
  for(let zz=Math.floor(z/3)*3;zz<z+50;zz+=3){const a=A.p3(px*.9-14,0,zz),b=A.p3(px*.9+14,0,zz);if(a[2]>.1)L(a[0],a[1],b[0],b[1],'#2a7a45');}
  rings.forEach(r=>{if(r.z>z-1&&r.z<z+60){const near=r.z-z<12;ringN(r.x,r.y,r.z,1.3,r.ok===2?K.g:r.ok?K.gr:near?K.y:K.o,r.ok?'#556':near?'#fff0a0':'#ffb060');A.shadow3(r.x,r.z,2.8,.4);}});A.shadow3(px,z+1.5,1.4,1);A.flush();A.fog=null;
  const nx=rings.filter(r=>!r.ok&&r.z>z).sort((a,b)=>a.z-b.z)[0];if(nx){const q=A.p3(nx.x,nx.y,nx.z);if(pjOK(q)){X.glow(q[0],q[1],Math.min(40,120/q[2]),'#ffe060',.3);const dx=q[0]-160,dy=q[1]-140,dd=Math.hypot(dx,dy);if(dd>50){const ux=dx/dd,uy=dy/dd,ax2=160+ux*44,ay2=140+uy*44;X.poly([[ax2+ux*8,ay2+uy*8],[ax2-uy*5,ay2+ux*5],[ax2+uy*5,ay2-ux*5]],'rgba(255,230,100,.8)');}}}
  const s=A.p3(px,py,z+1.5);if(pjOK(s))jet(s[0],s[1],roll,1);fx.draw();
  X.bar('RINGS '+g.score/10,'',' ',K.y);X.meter(W-90,5,84,8,Math.min(1,time/1200),time<300?K.r:K.g);T(Math.ceil(time/60)+'',W-96,5,time<300?K.r:'#ffffff',1,'r',1);};
 return g;}});

/* ---- CANYON RUN 3D ---- */
A.add({id:'canyon',name:'CANYON RUN 3D',cat:'RETRO 3D',hd:1,how:'FLY THE CANYON. WALLS CLOSE IN. DON\'T TOUCH.',make(){
 const g={over:null,score:0};let px=0,z=0,v=.2,bank=0;const cx=z=>Math.sin(z*.03)*4+Math.sin(z*.011)*3,hw=z=>Math.max(2.6,6-z*.005);
 g.update=()=>{const k=A.in(0);px+=ax(k)*.14;bank+=(ax(k)*.45-bank)*.15;z+=v;v+=.0001;g.score=z|0;if(Math.abs(px-cx(z))>hw(z)-.5){g.over='CRASHED';S('boom');A.shake=8;}};
 g.draw=()=>{sky('#ff9838','#ffcf3f');X.glow(160,80,100,'#fff0c0',.35);X.disc(160,80,18,'#fff8e0');A.fog={col:'#ffb060',near:20,far:48};A.cam.x=px;A.cam.y=1.5;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=-.05;
  for(let zz=Math.floor(z)-1;zz<z+45;zz++){const a=cx(zz),b=cx(zz+1),wa=hw(zz),wb=hw(zz+1),h=3+(zz%3),hm=h*.45,c1=zz%2?'#b5651d':'#a0521a',c2=zz%2?'#8a4a1d':'#7a3f18',u1=zz%2?'#d08040':'#c47538',u2=zz%2?'#a05a28':'#94501f';
   F([[a-wa,0,zz],[a+wa,0,zz],[b+wb,0,zz+1],[b-wb,0,zz+1]],zz%2?'#c4915a':'#b8864f');if(zz%3===0)F([[a-.1,.01,zz],[a+.1,.01,zz],[b+.1,.01,zz+1],[b-.1,.01,zz+1]],'#e8c890',false);
   F([[a-wa,0,zz],[a-wa,hm,zz],[b-wb,hm,zz+1],[b-wb,0,zz+1]],c1);F([[a-wa,hm,zz],[a-wa-.6,h,zz],[b-wb-.6,h,zz+1],[b-wb,hm,zz+1]],u1);F([[a+wa,0,zz],[a+wa,hm,zz],[b+wb,hm,zz+1],[b+wb,0,zz+1]],c2);F([[a+wa,hm,zz],[a+wa+.6,h,zz],[b+wb+.6,h,zz+1],[b+wb,hm,zz+1]],u2);
   F([[a-wa-.6,h,zz],[a-wa-3,h,zz],[b-wb-3,h,zz+1],[b-wb-.6,h,zz+1]],'#e0a060');F([[a+wa+.6,h,zz],[a+wa+3,h,zz],[b+wb+3,h,zz+1],[b+wb+.6,h,zz+1]],'#d89858');}
  A.shadow3(px,z+1.5,1.4,1);A.flush();A.fog=null;const s=A.p3(px,1,z+1.5);if(pjOK(s))jet(s[0],s[1],bank,1);
  const m=Math.abs(px-cx(z))/(hw(z)-.5);if(m>.75&&A.t%10<6){X.ot('TOO CLOSE!',160,200,'#ff4040',1,'c');}
  A.c.strokeStyle='rgba(255,255,255,.25)';A.c.lineWidth=1;for(let i=0;i<8;i++){const a=i*.785+.4,r0=80+((z*30+i*31)%70);A.c.beginPath();A.c.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0*.6);A.c.lineTo(160+Math.cos(a)*(r0+18),120+Math.sin(a)*(r0+18)*.6);A.c.stroke();}
  X.ot(String(g.score),160,6,'#ffffff',3,'c');};
 return g;}});

/* ---- BRICK BREAKER 3D ---- */
A.add({id:'bricks3d',name:'BRICK BREAKER 3D',cat:'RETRO 3D',hd:1,how:'MOVE THE PADDLE. A LAUNCHES. CLEAR THE WALL.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,b,br=[],lives=3,stuck=true,lvl=0,trail=[];
 const build=()=>{lvl++;br=[];for(let r=0;r<4;r++)for(let c=0;c<7;c++)br.push({x:(c-3)*1.2,y:.5+r*.8,c:[K.r,K.o,K.y,K.g][r]});};const nb=()=>{b={x:0,y:.4,z:0,vx:0,vz:.16+lvl*.02};stuck=true;};build();nb();
 const boom=q=>{const p=A.p3(q.x,q.y,13);if(pjOK(p)){fx.spark(p[0],p[1],q.c,12,2.4);fx.debris(p[0],p[1],q.c,6,1.8);}};
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-3.5,3.5);if(stuck){b.x=px;b.z=.3;if(A.hit(0).a){stuck=false;b.vx=rnd(.1)-.05;}return;}
  b.x+=b.vx;b.z+=b.vz;if(Math.abs(b.x)>4.2){b.vx*=-1;b.x=cl(b.x,-4.2,4.2);S('blip');}if(b.z>14){b.vz*=-1;S('blip');}
  const q=br.find(q=>Math.abs(q.x-b.x)<.7&&b.z>12.6&&b.z<13.6&&b.y===undefined?false:Math.abs(q.x-b.x)<.7&&Math.abs(13-b.z)<.5&&Math.abs(q.y-b.y)<.5);
  if(q){boom(q);br.splice(br.indexOf(q),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}else if(b.z>12.5&&b.z<13.5){const any=br.find(q=>Math.abs(q.x-b.x)<.7&&Math.abs(q.y-b.y)<.5);if(any){boom(any);br.splice(br.indexOf(any),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}}
  if(b.vz<0&&b.z<.4&&b.z>-.2&&Math.abs(b.x-px)<1.1){b.vz*=-1;b.vx=(b.x-px)*.12;b.y=.4;S('blip');const p=A.p3(b.x,.4,0);if(pjOK(p))fx.ring(p[0],p[1],'#2fe8d0',16);}if(b.z<-1){lives--;S('lose');A.shake=5;if(lives<=0)g.over='GAME OVER';else nb();}
  if(!stuck)b.y=.4+Math.abs(Math.sin(b.z*.4))*2.2;trail.push([b.x,b.y,b.z]);if(trail.length>8)trail.shift();};
 g.draw=()=>{A.cls('#05030f');X.stars(70,6,0,0,H,.6);A.cam.x=px*.3;A.cam.y=2.8;A.cam.z=-4;A.cam.ry=0;A.cam.rx=-.32;F([[-4.5,0,-1],[4.5,0,-1],[4.5,0,14],[-4.5,0,14]],'#1a1440',false);
  for(let z=0;z<=14;z+=2){const a=A.p3(-4.5,0,z),c=A.p3(4.5,0,z);L(a[0],a[1],c[0],c[1],'#3a2a77');}for(let x=-4;x<=4;x+=2){const a=A.p3(x,0,-1),c=A.p3(x,0,14);L(a[0],a[1],c[0],c[1],'#2b2257');}
  B3(-4.6,0,6.5,.3,1,15,'#4a4570');B3(4.6,0,6.5,.3,1,15,'#4a4570');B3(-4.6,1,6.5,.32,.08,15,'#ff3f8e');B3(4.6,1,6.5,.32,.08,15,'#ff3f8e');B3(0,0,14.6,9.5,3.8,.3,'#2a2450');
  br.forEach(q=>{B3(q.x,q.y-.3,13,1,.6,.8,q.c);B3(q.x,q.y+.3,13,.9,.06,.7,X.lt(q.c,1.4));});
  B3(px,0,0,2,.4,.5,K.c);B3(px,.4,0,1.6,.06,.4,'#c0fff6');A.shadow3(b.x,b.z,.5,.5);B3(b.x,b.y,b.z,.4,.4,.4,'#ffffff');A.flush();
  trail.forEach((t,i)=>{const p=A.p3(t[0],t[1]+.2,t[2]);if(pjOK(p))X.disc(p[0],p[1],Math.max(.5,i*.35*4/p[2]),'rgba(160,240,255,'+(i/trail.length*.4)+')');});const bp=A.p3(b.x,b.y+.2,b.z);if(pjOK(bp))X.glow(bp[0],bp[1],Math.min(20,50/bp[2]),'#a0f0ff',.5);const pp=A.p3(px,.2,0);if(pjOK(pp))X.glow(pp[0],pp[1],30,'#2fe8d0',.25);
  fx.draw();X.bar('SCORE '+g.score,'','LEVEL '+lvl,K.y);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1.3,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');if(stuck)X.ot('A TO LAUNCH',160,200,'#ffffff',1,'c');};
 return g;}});

/* ---- HOVER TANK 3D ---- */
A.add({id:'hover',name:'HOVER TANK 3D',cat:'RETRO 3D',hd:1,how:'TURN + DRIVE. A FIRES. DESTROY 10 DRONES.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:0,z:0,a:0},en=[],sh=[],eb=[],hp=5,inv=0,t=0,booms=[];const spawn=()=>{const a=rnd(6.28);en.push({x:p.x+Math.cos(a)*22,z:p.z+Math.sin(a)*22,cd:60+ri(60)});};for(let i=0;i<3;i++)spawn();
 g.update=()=>{t++;if(inv>0)inv--;const k=A.in(0);p.a+=ax(k)*.045;const mv=-ay(k)*.16;p.x=cl(p.x+Math.sin(p.a)*mv,-30,30);p.z=cl(p.z+Math.cos(p.a)*mv,-30,30);
  if(A.fire(12)&&sh.length<6){sh.push({x:p.x,z:p.z,vx:Math.sin(p.a)*.7,vz:Math.cos(p.a)*.7,t:60});S('shoot');}sh.forEach(s=>{s.x+=s.vx;s.z+=s.vz;s.t--;});sh=sh.filter(s=>s.t>0);
  for(const e of en){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);if(d>8){e.x+=dx/d*.05;e.z+=dz/d*.05;}else{e.x+=dz/d*.05;e.z-=dx/d*.05;}if(--e.cd<=0){e.cd=90+ri(60);eb.push({x:e.x,z:e.z,vx:dx/d*.3,vz:dz/d*.3,t:80});}
   for(const s of sh)if(Math.hypot(s.x-e.x,s.z-e.z)<1.2){e.dead=1;s.t=0;g.score+=100;S('hit');booms.push({x:e.x,z:e.z,t:24});}}en=en.filter(e=>!e.dead);while(en.length<3&&g.score<1000)spawn();
  booms.forEach(b=>b.t--);booms=booms.filter(b=>b.t>0);
  for(const b of eb){b.x+=b.vx;b.z+=b.vz;b.t--;if(inv===0&&Math.hypot(b.x-p.x,b.z-p.z)<1){b.t=0;hp--;inv=60;S('boom');A.shake=6;fx.flash('#ff2040',6);if(hp<=0)g.over='TANK DESTROYED';}}eb=eb.filter(b=>b.t>0);if(g.score>=1000)g.over='ALL DRONES DOWN! WIN';};
 g.draw=()=>{sky('#05030f','#2b2257');X.stars(60,4,p.a*200,0,110,.8);R(0,130,W,110,'#1a1440');A.fog={col:'#1a1440',near:18,far:40};A.cam.x=p.x-Math.sin(p.a)*5;A.cam.z=p.z-Math.cos(p.a)*5;A.cam.y=2.5;A.cam.ry=-p.a;A.cam.rx=-.3;
  for(let i=-30;i<=30;i+=5)for(let j=-30;j<=30;j+=5){const d=Math.hypot(i-p.x,j-p.z);if(d<28){B3(i,0,j,.4,.4,.4,'#2fe8d0');if(d<16){F([[i-2.5,.01,j-.04],[i+2.5,.01,j-.04],[i+2.5,.01,j+.04],[i-2.5,.01,j+.04]],'#2a6a8a',false);F([[i-.04,.01,j-2.5],[i+.04,.01,j-2.5],[i+.04,.01,j+2.5],[i-.04,.01,j+2.5]],'#2a6a8a',false);}}}
  en.forEach(e=>{if(Math.hypot(e.x-p.x,e.z-p.z)<40){const bob=Math.sin(A.t*.1+e.x)*.15;B3(e.x,.6+bob,e.z,1.4,.5,1.4,K.r);B3(e.x,1.1+bob,e.z,.7,.4,.7,K.o);B3(e.x-.9,.9+bob,e.z,.4,.1,.4,'#555');B3(e.x+.9,.9+bob,e.z,.4,.1,.4,'#555');}});eb.forEach(b=>B3(b.x,.8,b.z,.3,.3,.3,K.y));sh.forEach(s=>B3(s.x,.6,s.z,.3,.3,.6,K.g));
  if(inv%6<4){A.shadow3(p.x,p.z,1.8,2.2);const hb=Math.sin(A.t*.12)*.06;B3(p.x,.25+hb,p.z,1.7,.5,2.1,K.c);B3(p.x,.75+hb,p.z,1,.35,1,'#20b0a0');const c=Math.sin(p.a),s=Math.cos(p.a);B3(p.x+c*.8,.9+hb,p.z+s*.8,.3,.3,1.4,'#178a7d');}en.forEach(e=>A.shadow3(e.x,e.z,1.6,1.6));A.flush();A.fog=null;
  en.forEach(e=>{const q=A.p3(e.x,1.2,e.z);if(pjOK(q)&&q[2]<30)X.glow(q[0],q[1],Math.min(16,50/q[2]),'#ff4040',.35);});eb.forEach(b=>{const q=A.p3(b.x,.95,b.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(14,40/q[2]),'#ffe040',.6);});sh.forEach(s=>{const q=A.p3(s.x,.75,s.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(14,40/q[2]),'#60ff90',.6);});
  booms.forEach(b=>{const q=A.p3(b.x,1,b.z);if(pjOK(q)){const f=1-b.t/24,r=Math.min(60,(10+f*30)*6/q[2]);X.glow(q[0],q[1],r,'#ff9040',.8*(1-f));X.disc(q[0],q[1],r*.4,'rgba(255,240,180,'+(1-f)+')');}});
  fx.draw();X.bar('SCORE '+g.score,'','DRONES '+(g.score/100|0)+'/10',K.y);for(let i=0;i<5;i++)X.rr(W-12-i*10,4,8,9,2,i<hp?'#2fe8d0':'rgba(255,255,255,.15)');
  X.panel(4,190,46,46,'#2fe8d0');const rc=[27,213];A.ring(rc[0],rc[1],20,'rgba(47,232,208,.3)');A.ring(rc[0],rc[1],10,'rgba(47,232,208,.2)');const sw=A.t*.08;A.line(rc[0],rc[1],rc[0]+Math.cos(sw)*20,rc[1]+Math.sin(sw)*20,'rgba(47,232,208,.5)',1);
  en.forEach(e=>{const dx=e.x-p.x,dz=e.z-p.z,ca=Math.cos(-p.a),sa=Math.sin(-p.a),rx=dx*ca+dz*sa,rz=-dx*sa+dz*ca,d=Math.hypot(rx,rz),sc2=Math.min(19,d*.8)/(d||1);X.disc(rc[0]+rx*sc2,rc[1]-rz*sc2,1.8,'#ff4040');});X.disc(rc[0],rc[1],1.8,'#ffffff');};
 return g;}});

/* ---- ROLLER 3D ---- */
A.add({id:'roller',name:'ROLLER 3D',cat:'RETRO 3D',hd:1,how:'ROLL THE BALL. A JUMPS. STAY ON THE PATH.',make(){
 const g={over:null,score:0};let p={x:0,y:0,z:0,vx:0,vy:0,vz:.12},tiles=[],spin=0;for(let i=0;i<40;i++)tiles.push({x:i<6?0:Math.round(Math.sin(i*.4)*2),z:i*2,w:i%7===6||i<8?3:3});
 const on=()=>tiles.some(t=>t.w&&Math.abs(p.x-t.x)<t.w/2+.3&&Math.abs(p.z-t.z)<1.3);
 g.update=()=>{const k=A.in(0);p.vx=(p.vx+ax(k)*.02)*.9;p.x+=p.vx;p.z+=p.vz;spin+=p.vz;g.score=p.z|0;const ground=on()&&p.y<=0.01;if(ground){p.y=0;p.vy=0;if(A.hit(0).a){p.vy=.22;S('jump');}}else{p.vy-=.012;}p.y+=p.vy;if(p.y<-6){g.over='FELL OFF';S('boom');}
  for(const t of tiles)if(t.z<p.z-4){t.z+=80;t.x=Math.round(Math.sin(t.z*.2)*2);t.w=Math.random()<.12?0:3;}};
 g.draw=()=>{sky('#1a0a44','#ff3f8e');X.stars(60,9,p.x*30,0,120,.8);X.glow(160,128,120,'#ff3f8e',.3);R(0,130,W,110,'#12082a');A.fog={col:'#3a1060',near:20,far:50};A.cam.x=p.x;A.cam.y=p.y*.5+3;A.cam.z=p.z-5;A.cam.ry=0;A.cam.rx=-.35;
  tiles.forEach(t=>{if(t.w&&t.z>p.z-6&&t.z<p.z+50){const odd=(t.z/2|0)%2;B3(t.x,-.5,t.z,3,.5,2,odd?'#178a7d':'#106a60');F([[t.x-1.5,.01,t.z-1],[t.x+1.5,.01,t.z-1],[t.x+1.5,.01,t.z+1],[t.x-1.5,.01,t.z+1]],odd?K.c:'#1fb8a8',false);F([[t.x-1.5,.02,t.z-1],[t.x-1.35,.02,t.z-1],[t.x-1.35,.02,t.z+1],[t.x-1.5,.02,t.z+1]],'#c0fff6',false);F([[t.x+1.35,.02,t.z-1],[t.x+1.5,.02,t.z-1],[t.x+1.5,.02,t.z+1],[t.x+1.35,.02,t.z+1]],'#c0fff6',false);}});
  if(on())A.shadow3(p.x,p.z,.9,.9);A.flush();A.fog=null;
  const r=.45,q=A.p3(p.x,p.y+r,p.z),q2=A.p3(p.x+r,p.y+r,p.z);if(pjOK(q)&&pjOK(q2)){const rr=Math.max(3,Math.abs(q2[0]-q[0])),c=A.c;X.glow(q[0],q[1],rr*2,'#ffb040',.25);X.orb(q[0],q[1],rr,'#ff9a3f',0);c.save();c.beginPath();c.arc(q[0],q[1],rr,0,6.283);c.clip&&c.clip();for(let i=0;i<3;i++){const yy=q[1]+((spin*rr*1.2+i*rr*.9)%(rr*2.7))-rr*1.35;c.fillStyle='#ffd040';c.fillRect(q[0]-rr,yy,rr*2,rr*.32);}c.restore();X.ell(q[0]-rr*.35,q[1]-rr*.4,rr*.32,rr*.2,'rgba(255,255,255,.7)',-.5);}
  X.ot(String(g.score),160,6,'#ffffff',3,'c');};
 return g;}});

/* ---- WAVE RIDER 3D ---- */
A.add({id:'waverider',name:'WAVE RIDER 3D',cat:'RETRO 3D',hd:1,how:'STEER BETWEEN THE BUOYS. RED LEFT, GREEN RIGHT. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off';let px=0,z=0,v=.22,gates=[],time=3600,miss=0,bank=0,run=0,spray=[],hitT=0;for(let i=1;i<12;i++)gates.push({z:i*9,x:rnd(6)-3,ok:0});
 g.update=()=>{time--;if(hitT)hitT--;const k=A.in(0);px=cl(px+ax(k)*.13,-6,6);bank+=(ax(k)*.3-bank)*.15;z+=v;for(const q of gates){if(!q.ok&&q.z<z){q.ok=1;if(Math.abs(px-q.x)<1.4){g.score+=10;run++;S('coin');q.ok=2;hitT=12;A.burst(160,176,'#bfefff',6);fx.ring(160,182,'#ffffff',36,14);fx.spark(160,180,'#ffffff',14,2.6);fx.spark(160,180,'#ffcf3f',8,2);if(run%5===0){fx.pop(160,128,'STREAK '+run,'#ffcf3f');fx.flash('#ffffff',4);}}else{miss++;run=0;S('lose');A.shake=4;fx.pop(160,140,'MISSED','#ff6a6a');fx.debris(160,186,'#ff4f6d',6,2);}}if(q.z<z-2){q.z+=99;q.x=rnd(6)-3;q.ok=0;}}
  if(A.t%2===0)spray.push({x:160+(Math.random()-.5)*30,y:192,vx:(Math.random()-.5)*2.4-bank*3,vy:-1.2-Math.random()*1.6,t:22});spray.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.14;p.t--;});spray=spray.filter(p=>p.t>0);if(time<=0)g.over=g.score+' PTS, '+miss+' MISSED';};
 const hz=104,wv=zz=>Math.sin(zz*.7+A.t*.1)*.15;
 const buoy=(s,col,q)=>{const k=210/s[2],r=Math.max(1.2,.32*k),h=Math.max(3,1.05*k),x=s[0],y=s[1],c=A.c,on=A.t%30<15;
  X.ell(x,y+r*.25,r*1.7,r*.45,'rgba(0,30,60,.35)');c.globalAlpha*=.35;X.rr(x-r,y,r*2,h*.5,r*.6,X.lg(0,y,0,y+h*.5,[col,X.rgba(col,0)]));c.globalAlpha/=.35;
  X.rr(x-r,y-h*.62,r*2,h*.62,r*.7,X.lg(x-r,0,x+r,0,[X.lt(col,1.4),col,X.lt(col,.5)]));c.fillStyle='rgba(255,255,255,.9)';c.fillRect(x-r,y-h*.42,r*2,h*.14);
  X.rr(x-r*.55,y-h*.92,r*1.1,h*.32,r*.4,X.lg(x-r,0,x+r,0,['#ffffff','#c8d0dc','#6a7488']));X.orb(x,y-h*.98,r*.55,on?'#fff6c0':X.lt(col,1.2));if(on&&lo())X.glow(x,y-h*.98,r*3.2,col,.6);
  c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x-r*.7,y-h*.58,r*.3,h*.5);};
 const boat=(x,y,b)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(b*.35);
  X.ell(0,8,30,6,'rgba(0,30,60,.35)');X.poly([[-26,-4],[26,-4],[20,9],[-20,9]],X.lg(0,-4,0,9,['#ffffff','#e2e8f2','#9aa4b8']));X.poly([[-20,5],[20,5],[18,9],[-18,9]],'#ff4f6d');
  X.rr(-22,-12,44,9,4,X.lg(0,-12,0,-3,['#ffe28a','#ffcf3f','#c88a10']));X.rr(-15,-20,30,9,3,X.lg(0,-20,0,-11,['#bff0ff','#4dabff','#1a5a9a']));c.fillStyle='rgba(255,255,255,.55)';c.fillRect(-12,-19,10,1.5);
  X.orb(0,-22,4.2,'#2fd6c3');X.rr(-4,-27,8,3,1.5,'#1a2a4a');X.block(-6,4,12,10,'#2a2a38',2);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-4,6,8,1);c.restore();};
 g.draw=()=>{const c=A.c;X.cache('wr_bg2',()=>{X.sky(['#2f86e0','#7cc4f4','#e6f6ff'],hz);X.glow(250,hz-26,90,'#fff4c0',.5);X.disc(250,hz-26,13,'#fffbe6');
   [[30,hz,46,9],[110,hz,26,6],[205,hz,60,12],[295,hz,34,7]].forEach(([x,y,w,h],i)=>{X.ell(x,y,w,h,i%2?'#5f8fa0':'#4f7f8a');X.ell(x-w*.3,y-h*.6,w*.45,h*.7,i%2?'#6a9cac':'#5a8c96');});
   [[40,26,22],[150,40,16],[300,22,20]].forEach(([x,y,s])=>{c.globalAlpha=.9;X.ell(x,y,s,s*.25,'#ffffff');X.ell(x+s*.3,y-s*.2,s*.55,s*.3,'#ffffff');X.ell(x-s*.35,y-s*.12,s*.4,s*.22,'#f4fbff');c.globalAlpha=1;});
   X.vg(0,hz,W,H-hz,['#8fcaf0','#2a8ad6','#0f4f94']);});
  [[60,46],[230,58]].forEach(([x0,y],i)=>{const x=((x0-A.t*.05*(i+1))%380+380)%380-30;c.globalAlpha=.85;X.ell(x,y,18,4,'#ffffff');X.ell(x+8,y-3,10,4,'#ffffff');c.globalAlpha=1;});
  A.fog={col:'#9fd4f5',near:12,far:40};A.cam.x=px;A.cam.y=1.4;A.cam.z=z-3.5;A.cam.ry=0;A.cam.rx=-.12;
  for(let zz=Math.floor(z)-1;zz<z+40;zz++){const a=wv(zz),b=wv(zz+1);F([[px-16,a,zz],[px+16,a,zz],[px+16,b,zz+1],[px-16,b,zz+1]],zz%2?'#1a6cb4':'#1e78c4');if((zz*7)%5===0){const sx=px-10+((zz*13)%20);F([[sx-.5,a+.02,zz],[sx+.5,a+.02,zz],[sx+.4,b+.02,zz+.35],[sx-.4,b+.02,zz+.35]],'#cfeaff',false);}}
  A.flush();A.fog=null;
  const nx=gates.filter(q=>!q.ok&&q.z>z+1).sort((a,b)=>a.z-b.z)[0];
  gates.filter(q=>q.z>z+.6&&q.z<z+42).sort((a,b)=>b.z-a.z).forEach(q=>{const d=q.z-z,bb=Math.sin(A.t*.1+q.z)*.08,al=Math.max(0,Math.min(1,(42-d)/14));c.globalAlpha=al;
   if(q===nx){const L=A.p3(q.x-1.6,.02,q.z),R_=A.p3(q.x+1.6,.02,q.z);if(pjOK(L)&&pjOK(R_)){c.setLineDash&&c.setLineDash([4,4]);X.stroke([[L[0],L[1]],[R_[0],R_[1]]],'rgba(255,255,255,.7)',1.2);c.setLineDash&&c.setLineDash([]);}}
   [[-1.6,'#ff3a4f'],[1.6,'#2fd65a']].forEach(([o,col])=>{const s=A.p3(q.x+o,bb,q.z);if(pjOK(s))buoy(s,q.ok===2?'#ffcf3f':col,q);});c.globalAlpha=1;});
  spray.forEach(p=>{c.globalAlpha=p.t/22*.8;X.disc(p.x,p.y,1.2+p.t*.05,'#ffffff');});c.globalAlpha=1;
  const bob=Math.sin(A.t*.2)*1.2;for(const sd of[-1,1]){const P0=[160+sd*16,196],P1=[160+sd*86-bank*30,244];if(lo())X.stroke([P0,P1],'rgba(255,255,255,.18)',7);for(let i=0;i<6;i++){const f=((i/6+A.t*.03)%1),f2=Math.min(1,f+.09);X.stroke([[P0[0]+(P1[0]-P0[0])*f,P0[1]+(P1[1]-P0[1])*f],[P0[0]+(P1[0]-P0[0])*f2,P0[1]+(P1[1]-P0[1])*f2]],'rgba(255,255,255,'+(.85-f*.5).toFixed(2)+')',1.5+f*3);}}if(lo()){c.globalAlpha=.5;X.ell(160,198,40,6,'rgba(255,255,255,.8)');c.globalAlpha=1;}boat(160,186+bob,bank);if(hitT&&lo())X.glow(160,180,40,'#ffffff',hitT/12*.4);
  fx.draw();X.bar('SCORE '+g.score,Math.ceil(time/60)+' SEC',miss?miss+' MISSED':run>1?'STREAK '+run:'',K.y,time<600?K.r:'#ffffff');};
 return g;}});
})();
