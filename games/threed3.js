(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const sky=(top,bot)=>A.skyband(top,bot,130);
const ring3=(x,y,z,r,col)=>{for(let i=0;i<8;i++){const a=i*.785,b=a+.785;F([[x+Math.cos(a)*r,y+Math.sin(a)*r,z],[x+Math.cos(b)*r,y+Math.sin(b)*r,z],[x+Math.cos(b)*(r+.3),y+Math.sin(b)*(r+.3),z],[x+Math.cos(a)*(r+.3),y+Math.sin(a)*(r+.3),z]],col,false);}};

/* ---- RING RACE 3D ---- */
A.add({id:'rings',name:'RING RACE 3D',cat:'RETRO 3D',hd:1,how:'FLY THROUGH EVERY RING. EACH ONE ADDS TIME.',make(){
 const g={over:null,score:0};let px=0,py=1.5,z=0,v=.2,time=1200,rings=[],roll=0;for(let i=1;i<10;i++)rings.push({z:i*12,x:rnd(6)-3,y:1+rnd(3),ok:0});
 g.update=()=>{time--;const k=A.in(0);px=cl(px+ax(k)*.13,-4,4);py=cl(py-ay(k)*.13,.4,5);roll+=(ax(k)*.4-roll)*.1;z+=v;v=Math.min(.34,v+.0001);
  for(const r of rings){if(!r.ok&&r.z<z){r.ok=1;if(Math.hypot(px-r.x,py-r.y)<1.3){g.score+=10;time+=240;S('coin');}else S('lose');}if(r.z<z-2){r.z+=108;r.x=rnd(6)-3;r.y=1+rnd(3);r.ok=0;}}if(time<=0)g.over='TIME UP';};
 g.draw=()=>{sky('#1a2a6a','#ff9838');R(0,130,W,110,'#1e5a35');A.fog={col:'#6a7a5a',near:25,far:60};A.cam.x=px*.9;A.cam.y=py*.9+.6;A.cam.z=z-4;A.cam.ry=0;A.cam.rx=-.08;
  for(let i=-4;i<=4;i+=2){const a=A.p3(px*.9+i*3,0,z+1),b=A.p3(px*.9+i*3,0,z+50);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],'#2a7a45');}
  for(let zz=Math.floor(z/3)*3;zz<z+50;zz+=3){const a=A.p3(px*.9-14,0,zz),b=A.p3(px*.9+14,0,zz);if(a[2]>.1)L(a[0],a[1],b[0],b[1],'#2a7a45');}
  rings.forEach(r=>{if(r.z>z-1&&r.z<z+60){ring3(r.x,r.y,r.z,1.3,r.ok?K.gr:r.z-z<12?K.y:K.o);A.shadow3(r.x,r.z,2.8,.4);}});A.shadow3(px,z+1.5,1.4,1);A.flush();A.fog=null;
  const s=A.p3(px,py,z+1.5),c=Math.cos(roll),sn=Math.sin(roll),P=(x,y)=>[s[0]+x*c-y*sn,s[1]+x*sn+y*c];A.poly([P(0,-8),P(-16,6),P(0,2),P(16,6)],K.c,1);
  T('RINGS '+g.score/10,6,4,K.y,2);T('TIME '+Math.ceil(time/60),W-6,4,time<300?K.r:K.w,2,'r');};
 return g;}});

/* ---- CANYON RUN 3D ---- */
A.add({id:'canyon',name:'CANYON RUN 3D',cat:'RETRO 3D',hd:1,how:'FLY THE CANYON. WALLS CLOSE IN. DON\'T TOUCH.',make(){
 const g={over:null,score:0};let px=0,z=0,v=.2;const cx=z=>Math.sin(z*.03)*4+Math.sin(z*.011)*3,hw=z=>Math.max(2.6,6-z*.005);
 g.update=()=>{const k=A.in(0);px+=ax(k)*.14;z+=v;v+=.0001;g.score=z|0;if(Math.abs(px-cx(z))>hw(z)-.5){g.over='CRASHED';S('boom');}};
 g.draw=()=>{sky('#ff9838','#ffcf3f');A.fog={col:'#ffb060',near:20,far:48};A.cam.x=px;A.cam.y=1.5;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=-.05;
  for(let zz=Math.floor(z)-1;zz<z+45;zz++){const a=cx(zz),b=cx(zz+1),wa=hw(zz),wb=hw(zz+1),h=3+(zz%3),c1=zz%2?'#b5651d':'#a0521a',c2=zz%2?'#8a4a1d':'#7a3f18';F([[a-wa,0,zz],[a+wa,0,zz],[b+wb,0,zz+1],[b-wb,0,zz+1]],zz%2?'#c4915a':'#b8864f');F([[a-wa,0,zz],[a-wa,h,zz],[b-wb,h,zz+1],[b-wb,0,zz+1]],c1);F([[a+wa,0,zz],[a+wa,h,zz],[b+wb,h,zz+1],[b+wb,0,zz+1]],c2);}
  A.shadow3(px,z+1.5,1.4,1);A.flush();A.fog=null;const s=A.p3(px,1,z+1.5);A.poly([[s[0],s[1]-8],[s[0]-16,s[1]+6],[s[0],s[1]+2],[s[0]+16,s[1]+6]],K.c,1);T(g.score,160,6,K.w,3,'c');};
 return g;}});

/* ---- BRICK BREAKER 3D ---- */
A.add({id:'bricks3d',name:'BRICK BREAKER 3D',cat:'RETRO 3D',hd:1,how:'MOVE THE PADDLE. A LAUNCHES. CLEAR THE WALL.',make(){
 const g={over:null,score:0};let px=0,b,br=[],lives=3,stuck=true,lvl=0;
 const build=()=>{lvl++;br=[];for(let r=0;r<4;r++)for(let c=0;c<7;c++)br.push({x:(c-3)*1.2,y:.5+r*.8,c:[K.r,K.o,K.y,K.g][r]});};const nb=()=>{b={x:0,y:.4,z:0,vx:0,vz:.16+lvl*.02};stuck=true;};build();nb();
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-3.5,3.5);if(stuck){b.x=px;b.z=.3;if(A.hit(0).a){stuck=false;b.vx=rnd(.1)-.05;}return;}
  b.x+=b.vx;b.z+=b.vz;if(Math.abs(b.x)>4.2){b.vx*=-1;b.x=cl(b.x,-4.2,4.2);S('blip');}if(b.z>14){b.vz*=-1;S('blip');}
  const q=br.find(q=>Math.abs(q.x-b.x)<.7&&b.z>12.6&&b.z<13.6&&b.y===undefined?false:Math.abs(q.x-b.x)<.7&&Math.abs(13-b.z)<.5&&Math.abs(q.y-b.y)<.5);
  if(q){br.splice(br.indexOf(q),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}else if(b.z>12.5&&b.z<13.5){const any=br.find(q=>Math.abs(q.x-b.x)<.7&&Math.abs(q.y-b.y)<.5);if(any){br.splice(br.indexOf(any),1);b.vz*=-1;g.score+=10;S('hit');if(!br.length){build();nb();return;}}}
  if(b.vz<0&&b.z<.4&&b.z>-.2&&Math.abs(b.x-px)<1.1){b.vz*=-1;b.vx=(b.x-px)*.12;b.y=.4;S('blip');}if(b.z<-1){lives--;S('lose');if(lives<=0)g.over='GAME OVER';else nb();}
  if(!stuck)b.y=.4+Math.abs(Math.sin(b.z*.4))*2.2;};
 g.draw=()=>{A.cls('#05030f');A.cam.x=px*.3;A.cam.y=2.8;A.cam.z=-4;A.cam.ry=0;A.cam.rx=-.32;F([[-4.5,0,-1],[4.5,0,-1],[4.5,0,14],[-4.5,0,14]],'#1a1440',false);for(let z=0;z<=14;z+=2){const a=A.p3(-4.5,0,z),c=A.p3(4.5,0,z);L(a[0],a[1],c[0],c[1],'#2b2257');}
  B3(-4.6,0,6.5,.3,1,15,'#4a4570');B3(4.6,0,6.5,.3,1,15,'#4a4570');br.forEach(q=>B3(q.x,q.y-.3,13,1,.6,.8,q.c));B3(px,0,0,2,.4,.5,K.c);B3(b.x,b.y,b.z,.4,.4,.4,K.w);A.flush();
  T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives,W-6,4,K.w,2,'r');if(stuck)T('A TO LAUNCH',160,200,K.gr,1,'c');};
 return g;}});

/* ---- HOVER TANK 3D ---- */
A.add({id:'hover',name:'HOVER TANK 3D',cat:'RETRO 3D',hd:1,how:'TURN + DRIVE. A FIRES. DESTROY 10 DRONES.',make(){
 const g={over:null,score:0};let p={x:0,z:0,a:0},en=[],sh=[],eb=[],hp=5,inv=0,t=0;const spawn=()=>{const a=rnd(6.28);en.push({x:p.x+Math.cos(a)*22,z:p.z+Math.sin(a)*22,cd:60+ri(60)});};for(let i=0;i<3;i++)spawn();
 g.update=()=>{t++;if(inv>0)inv--;const k=A.in(0);p.a+=ax(k)*.045;const mv=-ay(k)*.16;p.x=cl(p.x+Math.sin(p.a)*mv,-30,30);p.z=cl(p.z+Math.cos(p.a)*mv,-30,30);
  if(A.hit(0).a&&sh.length<3){sh.push({x:p.x,z:p.z,vx:Math.sin(p.a)*.7,vz:Math.cos(p.a)*.7,t:60});S('shoot');}sh.forEach(s=>{s.x+=s.vx;s.z+=s.vz;s.t--;});sh=sh.filter(s=>s.t>0);
  for(const e of en){const dx=p.x-e.x,dz=p.z-e.z,d=Math.hypot(dx,dz);if(d>8){e.x+=dx/d*.05;e.z+=dz/d*.05;}else{e.x+=dz/d*.05;e.z-=dx/d*.05;}if(--e.cd<=0){e.cd=90+ri(60);eb.push({x:e.x,z:e.z,vx:dx/d*.3,vz:dz/d*.3,t:80});}
   for(const s of sh)if(Math.hypot(s.x-e.x,s.z-e.z)<1.2){e.dead=1;s.t=0;g.score+=100;S('hit');}}en=en.filter(e=>!e.dead);while(en.length<3&&g.score<1000)spawn();
  for(const b of eb){b.x+=b.vx;b.z+=b.vz;b.t--;if(inv===0&&Math.hypot(b.x-p.x,b.z-p.z)<1){b.t=0;hp--;inv=60;S('boom');if(hp<=0)g.over='TANK DESTROYED';}}eb=eb.filter(b=>b.t>0);if(g.score>=1000)g.over='ALL DRONES DOWN! WIN';};
 g.draw=()=>{sky('#05030f','#2b2257');R(0,130,W,110,'#1a1440');A.fog={col:'#1a1440',near:18,far:40};A.cam.x=p.x-Math.sin(p.a)*5;A.cam.z=p.z-Math.cos(p.a)*5;A.cam.y=2.5;A.cam.ry=-p.a;A.cam.rx=-.3;
  for(let i=-30;i<=30;i+=5)for(let j=-30;j<=30;j+=5){const d=Math.hypot(i-p.x,j-p.z);if(d<28)B3(i,0,j,.4,.4,.4,'#2fe8d0');}
  en.forEach(e=>{if(Math.hypot(e.x-p.x,e.z-p.z)<40){B3(e.x,.6,e.z,1.4,.6,1.4,K.r);B3(e.x,1.2,e.z,.6,.4,.6,K.o);}});eb.forEach(b=>B3(b.x,.8,b.z,.3,.3,.3,K.y));sh.forEach(s=>B3(s.x,.6,s.z,.3,.3,.6,K.g));
  if(inv%6<4){A.shadow3(p.x,p.z,1.8,2.2);B3(p.x,.2,p.z,1.6,.6,2,K.c);const c=Math.sin(p.a),s=Math.cos(p.a);B3(p.x+c*.8,.9,p.z+s*.8,.3,.3,1.4,'#178a7d');}en.forEach(e=>A.shadow3(e.x,e.z,1.6,1.6));A.flush();A.fog=null;
  T('SCORE '+g.score,6,4,K.y,2);T('ARMOUR '+'|'.repeat(hp),W-6,4,hp<2?K.r:K.w,2,'r');};
 return g;}});

/* ---- ROLLER 3D ---- */
A.add({id:'roller',name:'ROLLER 3D',cat:'RETRO 3D',hd:1,how:'ROLL THE BALL. A JUMPS. STAY ON THE PATH.',make(){
 const g={over:null,score:0};let p={x:0,y:0,z:0,vx:0,vy:0,vz:.12},tiles=[],spin=0;for(let i=0;i<40;i++)tiles.push({x:i<6?0:Math.round(Math.sin(i*.4)*2),z:i*2,w:i%7===6||i<8?3:3});
 const on=()=>tiles.some(t=>t.w&&Math.abs(p.x-t.x)<t.w/2+.3&&Math.abs(p.z-t.z)<1.3);
 g.update=()=>{const k=A.in(0);p.vx=(p.vx+ax(k)*.02)*.9;p.x+=p.vx;p.z+=p.vz;spin+=p.vz;g.score=p.z|0;const ground=on()&&p.y<=0.01;if(ground){p.y=0;p.vy=0;if(A.hit(0).a){p.vy=.22;S('jump');}}else{p.vy-=.012;}p.y+=p.vy;if(p.y<-6){g.over='FELL OFF';S('boom');}
  for(const t of tiles)if(t.z<p.z-4){t.z+=80;t.x=Math.round(Math.sin(t.z*.2)*2);t.w=Math.random()<.12?0:3;}};
 g.draw=()=>{sky('#1a0a44','#ff3f8e');R(0,130,W,110,'#12082a');A.fog={col:'#3a1060',near:20,far:50};A.cam.x=p.x;A.cam.y=p.y*.5+3;A.cam.z=p.z-5;A.cam.ry=0;A.cam.rx=-.35;
  tiles.forEach(t=>{if(t.w&&t.z>p.z-6&&t.z<p.z+50)F([[t.x-1.5,0,t.z-1],[t.x+1.5,0,t.z-1],[t.x+1.5,0,t.z+1],[t.x-1.5,0,t.z+1]],(t.z/2|0)%2?K.c:'#178a7d');});
  const r=.45,y=p.y+r;for(let i=0;i<4;i++){const a=spin+i*1.57;F([[p.x-r,y+Math.sin(a)*r*.6,p.z+Math.cos(a)*r*.6],[p.x+r,y+Math.sin(a)*r*.6,p.z+Math.cos(a)*r*.6],[p.x+r,y+Math.sin(a+1.57)*r*.6,p.z+Math.cos(a+1.57)*r*.6],[p.x-r,y+Math.sin(a+1.57)*r*.6,p.z+Math.cos(a+1.57)*r*.6]],i%2?K.y:K.o);}if(on())A.shadow3(p.x,p.z,.9,.9);A.flush();A.fog=null;T(g.score,160,6,K.w,3,'c');};
 return g;}});

/* ---- WAVE RIDER 3D ---- */
A.add({id:'waverider',name:'WAVE RIDER 3D',cat:'RETRO 3D',hd:1,how:'STEER BETWEEN THE BUOYS. RED LEFT, GREEN RIGHT. 60 SEC.',make(){
 const g={over:null,score:0};let px=0,z=0,v=.22,gates=[],time=3600,miss=0;for(let i=1;i<12;i++)gates.push({z:i*9,x:rnd(6)-3,ok:0});
 g.update=()=>{time--;const k=A.in(0);px=cl(px+ax(k)*.13,-6,6);z+=v;for(const q of gates){if(!q.ok&&q.z<z){q.ok=1;if(Math.abs(px-q.x)<1.4){g.score+=10;S('coin');}else{miss++;S('lose');}}if(q.z<z-2){q.z+=99;q.x=rnd(6)-3;q.ok=0;}}if(time<=0)g.over=g.score+' PTS, '+miss+' MISSED';};
 g.draw=()=>{sky('#4dabff','#dff4ff');A.fog={col:'#bfe4ff',near:18,far:42};A.cam.x=px;A.cam.y=1.4;A.cam.z=z-3.5;A.cam.ry=0;A.cam.rx=-.12;
  for(let zz=Math.floor(z)-1;zz<z+40;zz++){const w=Math.sin(zz*.7+A.t*.1)*.15;F([[px-14,w,zz],[px+14,w,zz],[px+14,-w,zz+1],[px-14,-w,zz+1]],zz%2?'#1b6fb8':'#1f7fcf');}
  gates.forEach(q=>{if(q.z>z-1&&q.z<z+45){B3(q.x-1.6,0,q.z,.5,1,.5,K.r);B3(q.x+1.6,0,q.z,.5,1,.5,K.g);}});
  B3(px,.1,z,.7,.4,1.6,K.y);B3(px,.5,z-.2,.4,.5,.6,K.c);A.flush();A.fog=null;T('SCORE '+g.score,6,4,K.y,2);T(Math.ceil(time/60),W-6,4,K.w,2,'r');};
 return g;}});
})();
