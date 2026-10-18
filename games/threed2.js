(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
/* 2D jet sprite at screen pos, bank angle, scale */
const jet=(x,y,bank,s,col)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(bank||0);c.scale(s||1,s||1);X.glow(0,7,12+Math.sin(A.t*.8)*3,'#40a0ff',.6);X.poly([[0,-11],[-16,7],[-5,4],[0,7],[5,4],[16,7]],X.lg(-16,0,16,0,[X.lt(col||'#2fe8d0',.6),col||'#2fe8d0',X.lt(col||'#2fe8d0',.6)]));X.poly([[0,-11],[-3.5,2],[0,4],[3.5,2]],'#e0fffa');X.poly([[-16,7],[-18,1],[-12,5]],'#ff4f6d');X.poly([[16,7],[18,1],[12,5]],'#ff4f6d');X.disc(0,8,2.4,A.t%4<2?'#ffd040':'#ff8020');c.restore();};
const pjOK=p=>p&&p[2]>.1&&isFinite(p[0])&&isFinite(p[1]);
const sky=(top,bot)=>A.skyband(top,bot,130);
const car=(x,y,z,a,col,dark)=>{const c=Math.cos(a),s=Math.sin(a),P=(px,py,pz)=>[x+px*c-pz*s,y+py,z+px*s+pz*c];const q=(p1,p2,p3,p4,cc)=>F([P(...p1),P(...p2),P(...p3),P(...p4)],cc);
 A.shadow3(x,z,1.3,2.1);
 q([-.45,.12,-.9],[.45,.12,-.9],[.45,.4,-.95],[-.45,.4,-.95],col);q([.45,.12,.9],[-.45,.12,.9],[-.45,.4,.95],[.45,.4,.95],col);q([-.45,.12,.9],[-.45,.12,-.9],[-.45,.4,-.95],[-.45,.4,.95],col);q([.45,.12,-.9],[.45,.12,.9],[.45,.4,.95],[.45,.4,-.95],col);q([-.45,.4,-.95],[.45,.4,-.95],[.45,.4,.95],[-.45,.4,.95],col);
 q([-.38,.4,-.3],[.38,.4,-.3],[.3,.68,0],[-.3,.68,0],'#8fd0ff');q([.38,.4,.5],[-.38,.4,.5],[-.3,.68,.15],[.3,.68,.15],'#8fd0ff');q([-.3,.68,0],[.3,.68,0],[.3,.68,.15],[-.3,.68,.15],dark);q([-.38,.4,-.3],[-.3,.68,0],[-.3,.68,.15],[-.38,.4,.5],dark);q([.38,.4,.5],[.3,.68,.15],[.3,.68,0],[.38,.4,-.3],dark);
 q([-.34,.18,-.96],[-.16,.18,-.96],[-.16,.3,-.96],[-.34,.3,-.96],'#fff7c0');q([.16,.18,-.96],[.34,.18,-.96],[.34,.3,-.96],[.16,.3,-.96],'#fff7c0');q([-.34,.18,.96],[-.16,.18,.96],[-.16,.3,.96],[-.34,.3,.96],'#ff2a2a');q([.16,.18,.96],[.34,.18,.96],[.34,.3,.96],[.16,.3,.96],'#ff2a2a');
 [[-.48,-.58],[.48,-.58],[-.48,.58],[.48,.58]].forEach(w=>{const wp=P(w[0],.16,w[1]);A.cyl3(wp[0],wp[1],wp[2],.16,.12,'#151515',8,'x');});};
const tree=(x,z,h)=>{A.cyl3(x,0,z,.14,h*.35,'#5b3a1e',6);for(let i=0;i<3;i++){const y=h*.3+i*h*.22,r=.9-i*.25;F([[x-r,y,z-r],[x+r,y,z-r],[x,y+h*.35,z]],'#1e8a45');F([[x+r,y,z-r],[x+r,y,z+r],[x,y+h*.35,z]],'#25a352');F([[x+r,y,z+r],[x-r,y,z+r],[x,y+h*.35,z]],'#1e8a45');F([[x-r,y,z+r],[x-r,y,z-r],[x,y+h*.35,z]],'#187a3c');}};
const lamp=(x,z)=>{A.cyl3(x,0,z,.06,2.4,'#777',5);B3(x,2.4,z,.3,.15,.3,'#fff3a0');};

/* ---- CITY CRUISER 3D ---- */
A.add({id:'city',name:'CITY CRUISER 3D',cat:'RETRO 3D',hd:1,how:'DRIVE THE GRID. GRAB COINS. DODGE CARS. 90 SEC.',warm:20,make(){
 const g={over:null,score:0},N=6,SP=8,BC=['#5c6b8a','#8a5c6b','#6b8a5c','#7a6b9a','#9a8a5c','#5c8a8a'],fx=X.fx();let p={x:0,z:0,a:0,v:0},time=5400,coins=[],cars=[],flash=0,bld=[],got=0;
 for(let i=-N;i<N;i++)for(let j=-N;j<N;j++)bld.push({x:i*SP+SP/2,z:j*SP+SP/2,h:1.5+((i*7+j*13)%5)*.9,w:4+((i+j)%2),c:BC[((i*3+j*5)%6+6)%6]});
 const spawnCoin=()=>{const i=ri(N*2)-N,j=ri(N*2)-N,h=Math.random()<.5;coins.push({x:h?i*SP+rnd(SP)-SP/2:i*SP,z:h?j*SP:j*SP+rnd(SP)-SP/2});};for(let i=0;i<10;i++)spawnCoin();
 for(let i=0;i<8;i++){const h=i%2===0,l=(ri(N*2)-N)*SP;cars.push({x:h?rnd(N*2*SP)-N*SP:l+.9,z:h?l-.9:rnd(N*2*SP)-N*SP,a:h?1.5708:0,v:.06+rnd(.05),c:[K.r,K.y,K.p,K.w][i%4]});}
 const inBld=(x,z)=>{const rx=((x%SP)+2*SP)%SP,rz=((z%SP)+2*SP)%SP;return rx>1.3&&rx<SP-1.3&&rz>1.3&&rz<SP-1.3;};
 g.update=()=>{time--;if(flash>0)flash--;if(got>0)got--;const k=A.in(0);p.v+=(k.u||k.a)?.006:k.d?-.008:0;p.v*=.985;p.v=cl(p.v,-.05,.2);p.a+=ax(k)*.045*Math.min(1,Math.abs(p.v)*12);
  const nx=p.x+Math.sin(p.a)*p.v,nz=p.z+Math.cos(p.a)*p.v;if(!inBld(nx,nz)&&Math.abs(nx)<N*SP&&Math.abs(nz)<N*SP){p.x=nx;p.z=nz;}else{if(Math.abs(p.v)>.05){A.shake=3;fx.spark(160,170,'#ffd080',8,2);}p.v*=-.3;S('hit');}
  coins=coins.filter(c=>{if(Math.hypot(c.x-p.x,c.z-p.z)<1.1){g.score+=10;S('coin');got=20;fx.spark(160,150,K.y,14,2.4);fx.ring(160,150,K.y,24);spawnCoin();return false;}return true;});
  for(const c of cars){c.x+=Math.sin(c.a)*c.v;c.z+=Math.cos(c.a)*c.v;if(Math.abs(c.x)>N*SP||Math.abs(c.z)>N*SP)c.a+=3.1416;if(Math.hypot(c.x-p.x,c.z-p.z)<1.5&&flash===0){flash=40;g.score=Math.max(0,g.score-5);p.v*=-.5;S('boom');A.shake=6;fx.flash('#ff2040',6);fx.spark(160,160,'#ff9040',18,3);}}
  if(time<=0)g.over='TIME UP';};
 g.draw=()=>{sky('#0a0520','#c7497d');X.stars(40,8,p.a*300,0,110,.7);R(0,130,W,110,'#2a2a38');A.fog={col:'#3a2050',near:14,far:34};A.cam.x=p.x-Math.sin(p.a)*4.5;A.cam.z=p.z-Math.cos(p.a)*4.5;A.cam.y=2.3;A.cam.ry=-p.a;A.cam.rx=-.28;
  const vis=(o,r)=>{const dx=o.x-p.x,dz=o.z-p.z;return dx*Math.sin(p.a)+dz*Math.cos(p.a)>-4&&Math.hypot(dx,dz)<(r||34);};
  bld.forEach(b=>{if(!vis(b))return;B3(b.x,0,b.z,b.w+1.2,.12,b.w+1.2,'#8a8aa0');B3(b.x,0,b.z,b.w,b.h,b.w,b.c);B3(b.x,b.h,b.z,b.w*.5,.25,b.w*.5,'#3a3a4a');if(vis(b,16))for(let f=.5;f<b.h-.3;f+=.7){const hw=b.w/2+.01,wc=((b.x*3+f*7+b.z)|0)%3?'#0d0d1a':'#ffe08a';F([[b.x-hw+.3,f,b.z-hw],[b.x+hw-.3,f,b.z-hw],[b.x+hw-.3,f+.3,b.z-hw],[b.x-hw+.3,f+.3,b.z-hw]],wc,false);F([[b.x+hw-.3,f,b.z+hw],[b.x-hw+.3,f,b.z+hw],[b.x-hw+.3,f+.3,b.z+hw],[b.x+hw-.3,f+.3,b.z+hw]],wc,false);F([[b.x-hw,f,b.z+hw-.3],[b.x-hw,f,b.z-hw+.3],[b.x-hw,f+.3,b.z-hw+.3],[b.x-hw,f+.3,b.z+hw-.3]],'#0d0d1a',false);F([[b.x+hw,f,b.z-hw+.3],[b.x+hw,f,b.z+hw-.3],[b.x+hw,f+.3,b.z+hw-.3],[b.x+hw,f+.3,b.z-hw+.3]],'#0d0d1a',false);}});
  for(let i=-N;i<=N;i++)for(let j=-N;j<=N;j++){const gx=i*SP,gz=j*SP;if(vis({x:gx,z:gz},30)){F([[gx-.06,.02,gz+1.6],[gx+.06,.02,gz+1.6],[gx+.06,.02,gz+SP-1.6],[gx-.06,.02,gz+SP-1.6]],'#ffd75a',false);F([[gx+1.6,.02,gz-.06],[gx+SP-1.6,.02,gz-.06],[gx+SP-1.6,.02,gz+.06],[gx+1.6,.02,gz+.06]],'#ffd75a',false);if((i+j)%2===0)lamp(gx+1.35,gz+1.35);}}
  coins.forEach(c=>{if(vis(c))A.cyl3(c.x,.35+Math.sin(A.t*.1)*.1,c.z,.3,.12,K.y,8,'x');});
  cars.forEach(c=>{if(vis(c))car(c.x,0,c.z,c.a,c.c,'#333');});if(flash%6<3)car(p.x,0,p.z,p.a,K.c,'#178a7d');A.flush();A.fog=null;
  coins.forEach(c=>{if(!vis(c,22))return;const q=A.p3(c.x,.4,c.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(14,40/q[2]),'#ffd040',.45);});
  fx.draw();X.bar('SCORE '+g.score,Math.ceil(time/60)+' SEC','',K.y,time<600?K.r:'#ffffff');X.panel(122,20,76,14,'#2fe8d0');X.meter(126,24,40,6,Math.abs(p.v)/.2,K.c);T(Math.round(Math.abs(p.v)*600)+'',194,24,'#ffffff',1,'r',1);
  X.panel(W-58,20,54,54,'#ffd040');const mm=50/(N*SP*2),ox=W-56,oy=22;A.c.fillStyle='#2a2a38';A.c.fillRect(ox,oy,50,50);for(let i=-N;i<N;i++)for(let j=-N;j<N;j++)A.c.fillStyle='#5c6b8a',A.c.fillRect(ox+(i*SP+N*SP+1.3)*mm,oy+(N*SP-(j*SP+SP-1.3))*mm,(SP-2.6)*mm,(SP-2.6)*mm);coins.forEach(c=>X.disc(ox+(c.x+N*SP)*mm,oy+(N*SP-c.z)*mm,1.2,K.y));X.disc(ox+(p.x+N*SP)*mm,oy+(N*SP-p.z)*mm,1.8,'#2fe8d0');
  if(A.t<180)X.ot('COINS ARE ON THE STREETS',150,60,K.y,1,'c');};
 return g;}});

/* ---- MESH DRIFT 3D ---- */
A.add({id:'drift',name:'MESH DRIFT 3D',cat:'RETRO 3D',hd:1,how:'STEER. UP GAS. PASS GATES FOR POINTS.',make(){
 const g={over:null,score:0},fx=X.fx();let d=0,x=0,v=.12,lives=3,inv=0,gates=[],rocks=[],smoke=[],streak=0,carS=[160,198];const cx=z=>Math.sin(z*.05)*6+Math.sin(z*.021)*4,hy=z=>Math.sin(z*.08)*.6;
 for(let i=1;i<20;i++){gates.push({z:i*14,x:rnd(6)-3,ok:0});rocks.push({z:i*14+7,x:rnd(10)-5});}
 g.update=()=>{const k=A.in(0);v+=k.u||k.a?.003:-.001;v=cl(v,.08,.3);d+=v;x+=ax(k)*.16;x=cl(x,-6,6);if(inv>0)inv--;
  for(const q of gates){if(!q.ok&&q.z<d){q.ok=1;if(Math.abs(cx(q.z)+q.x-x)<1.6){streak++;g.score+=50;S('coin');q.ok=2;fx.ring(160,150,K.y,44);fx.ring(160,150,'#ffffff',26,14);fx.spark(160,140,K.y,18,2.8);fx.pop(160,110,'GATE +50',K.y);A.shake=1;}else{streak=0;fx.pop(160,110,'MISSED',K.r);}}if(q.z<d-4){q.z+=280;q.x=rnd(6)-3;q.ok=0;}}
  for(const r of rocks){if(r.z<d-4){r.z+=280;r.x=rnd(10)-5;}if(inv===0&&Math.abs(r.z-d)<1.2&&Math.abs(cx(r.z)+r.x-x)<1.1){lives--;inv=80;v=.08;streak=0;S('boom');A.shake=7;fx.flash('#ff2040',6);fx.debris(160,170,'#8d86b8',14,2.8);fx.spark(160,165,'#ffb040',14,3);if(lives<=0)g.over='WRECKED';}}
  if(A.t%20===0)g.score++;const st=ax(k);if(A.t%3===0&&(st&&v>.16||v>.27))smoke.push({x:carS[0]+rnd(20)-10,y:carS[1],vx:-st*1.2+rnd(.6)-.3,vy:-.3-rnd(.4),t:30,r:2+rnd(2)});smoke.forEach(s=>{s.x+=s.vx;s.y+=s.vy;s.r+=.25;s.t--;});smoke=smoke.filter(s=>s.t>0);};
 const back=()=>{X.sky(['#140a3a','#4a1a5a','#c84a5a','#ff9838'],132);X.stars(40,7,0,0,50,.6);for(let i=0;i<5;i++){const x=20+i*70,y=40+(i%2)*14;X.ell(x,y,30,3,'rgba(255,170,140,.35)');}X.glow(160,118,80,'#ffb050',.5);X.disc(160,118,22,X.rg(160,118,0,160,118,22,['#fff4c0','#ffd75a','#ff9040']));const c=A.c;c.fillStyle='rgba(255,120,80,.4)';for(let i=0;i<4;i++)c.fillRect(138,108+i*5,44,1.4);};
 g.draw=()=>{X.cache('drift_sky',back);X.hills(132,34,'#6a3a7a',d*1.2,.014,5);X.hills(132,18,'#3a2050',d*3,.02,2);R(0,130,W,110,'#7a4f1d');A.fog={col:'#c78a5a',near:16,far:36};const px=cx(d)+x,py=hy(d);A.cam.z=d-4;A.cam.y=py+1.6;A.cam.ry=0;A.cam.rx=-.2;A.cam.x=cx(d-4)+x*.8;
  for(let z=Math.floor(d)-2;z<d+34;z++){const a=cx(z),b=cx(z+1),ya=hy(z),yb=hy(z+1);F([[a-7,ya,z],[a+7,ya,z],[b+7,yb,z+1],[b-7,yb,z+1]],z%2?'#4a4a55':'#3e3e48');if(z%4<2&&z>d)F([[a-.12,ya+.01,z],[a+.12,ya+.01,z],[b+.12,yb+.01,z+1],[b-.12,yb+.01,z+1]],'#e8e8e8',false);F([[a-16,ya-.2,z],[a-7.6,ya,z],[b-7.6,yb,z+1],[b-16,yb-.2,z+1]],z%2?'#3f8a3a':'#377f33');F([[a+7.6,ya,z],[a+16,ya-.2,z],[b+16,yb-.2,z+1],[b+7.6,yb,z+1]],z%2?'#3f8a3a':'#377f33');F([[a-7.6,ya,z],[a-7,ya,z],[b-7,yb,z+1],[b-7.6,yb,z+1]],z%2?K.r:K.w);F([[a+7,ya,z],[a+7.6,ya,z],[b+7.6,yb,z+1],[b+7,yb,z+1]],z%2?K.r:K.w);if(z%6===0&&z>d-1)tree(a-11,z,2.5+(z%5)*.3),tree(b+11,z,2+(z%7)*.3);if(z%12===3&&z>d)lamp(a-8.4,z),lamp(b+8.4,z);}
  /* gates and rocks are culled once level with the car so they never fill the camera */
  gates.forEach(q=>{if(q.z>d&&q.z<d+34){const gx=cx(q.z)+q.x,gy=hy(q.z),col=q.ok===2?K.g:q.ok?K.gr:K.y;B3(gx-1.7,gy,q.z,.28,2.2,.28,col);B3(gx+1.7,gy,q.z,.28,2.2,.28,col);B3(gx,gy+2.2,q.z,3.7,.34,.28,col);B3(gx-.9,gy+2.2,q.z-.01,.9,.34,.29,'#222230');B3(gx+.9,gy+2.2,q.z-.01,.9,.34,.29,'#222230');F([[gx-1.55,gy+.05,q.z],[gx+1.55,gy+.05,q.z],[gx+1.55,gy+.05,q.z+.6],[gx-1.55,gy+.05,q.z+.6]],q.ok?'#3e3e48':'#ffe680',false);}});
  rocks.forEach(r=>{if(r.z>d-.6&&r.z<d+34){const rx=cx(r.z)+r.x,ry=hy(r.z);A.shadow3(rx,r.z,1.6,1.6);B3(rx,ry,r.z,1.2,.9,1.2,'#7d76a8');B3(rx+.2,ry+.9,r.z-.1,.7,.35,.7,'#a8a0d0');B3(rx-.35,ry,r.z-.45,.4,.4,.4,'#6a6496');}});
  if(inv%8<5)car(px,py,d,ax(A.in(0))*.25,K.c,'#178a7d');A.flush();A.fog=null;const c=A.c;
  gates.forEach(q=>{if(q.ok||q.z<d+1||q.z>d+30)return;const s=A.p3(cx(q.z)+q.x,hy(q.z)+2.35,q.z);if(pjOK(s))X.glow(s[0],s[1],Math.min(34,100/s[2]),'#ffe060',.4+.15*Math.sin(A.t*.2));});
  {const s=A.p3(px,py+.3,d+.95);if(pjOK(s)){carS=[s[0],s[1]+6];for(const o of[-12,12])X.glow(s[0]+o*(4/s[2]),s[1],10,'#ff3030',.5);}}
  smoke.forEach(s=>{c.globalAlpha=s.t/60;X.disc(s.x,s.y,s.r,'#d8c8b8');});c.globalAlpha=1;
  if(v>.2){c.strokeStyle='rgba(255,255,255,'+((v-.2)*2.5).toFixed(2)+')';c.lineWidth=1;for(let i=0;i<14;i++){const a=i*.449+A.t*.03,r0=70+((A.t*7+i*37)%90);c.beginPath();c.moveTo(160+Math.cos(a)*r0,125+Math.sin(a)*r0*.6);c.lineTo(160+Math.cos(a)*(r0+30),125+Math.sin(a)*(r0+30)*.6);c.stroke();}}
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1.3,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');X.panel(118,20,84,14,'#ffb050');X.meter(122,24,48,6,(v-.08)/.22,v>.26?'#ff4f6d':K.o);T(Math.round(v*900)+' KM',198,24,'#ffffff',1,'r',1);if(streak>1){X.panel(130,36,60,11,K.y);T('STREAK x'+streak,160,39,K.y,1,'c');}};
 return g;}});

/* ---- CUBE FIELD 3D ---- */
A.add({id:'cubes',name:'CUBE FIELD 3D',cat:'RETRO 3D',hd:1,how:'STEER LEFT/RIGHT. NEVER STOP. SURVIVE.',make(){
 const g={over:null,score:0},fx=X.fx();let x=0,z=0,v=.14,cubes=[],hue=0,bank=0,lastHue=0,hb=0,ss=[160,170],tr=[],nm=0;for(let i=0;i<90;i++)cubes.push({x:rnd(40)-20,z:rnd(80)+5,c:i%3});
 g.update=()=>{const k=A.in(0);x+=ax(k)*.22;bank+=(ax(k)*.4-bank)*.15;z+=v;v+=.00008;g.score=z*2|0;hue=(z/50)|0;if(hue!==lastHue){lastHue=hue;hb=60;S('score');fx.flash('#ffffff',6);fx.ring(160,110,'#ffffff',120,24);}if(hb>0)hb--;if(nm)nm--;
  for(const c of cubes){if(c.z<z-1){c.z+=80+rnd(6);c.x=x+rnd(40)-20;c.nm=0;}if(Math.abs(c.z-z)<.9&&Math.abs(c.x-x)<1.1){g.over='CRASHED';S('boom');A.shake=8;fx.flash('#ffffff',10);fx.spark(ss[0],ss[1],'#ffd080',24,4);fx.debris(ss[0],ss[1],'#e8e8f0',12,3);fx.ring(ss[0],ss[1],'#ff8040',50,20);}
   else if(!c.nm&&Math.abs(c.z-z)<.9&&Math.abs(c.x-x)<2){c.nm=1;nm=24;S('blip');fx.spark(ss[0]+(c.x<x?-16:16),ss[1],'#ffffff',8,2.2);fx.pop(ss[0],ss[1]-26,'CLOSE!',K.y);}}};
 g.draw=()=>{const c=A.c,pal=[['#0a0520','#ff3f8e','#2fe8d0'],['#03101f','#ffcf3f','#4dabff'],['#1a0a0a','#3dff8b','#ff9838'],['#0f0f1a','#ffffff','#ff4f6d']][hue%4];sky(pal[0],X.lt(pal[1],.35));X.stars(50,hue+2,x*20,0,110,.6);A.fog={col:pal[0],near:20,far:60};A.cam.x=x;A.cam.z=z-3;A.cam.y=1.4;A.cam.ry=0;A.cam.rx=-.15;const hzp=A.p3(x,0,z+400),hz=pjOK(hzp)?cl(hzp[1],40,200):120;
  X.glow(160,hz,130,pal[1],.3);c.save();c.beginPath();c.rect(0,0,W,hz);c.clip&&c.clip();X.disc(160,hz,34,X.lg(0,hz-34,0,hz,[X.lt(pal[1],1.5),pal[1],X.lt(pal[2],.9)]));c.fillStyle=X.lt(pal[1],.35);for(let i=0;i<6;i++){const yy=hz-4-i*5,hh=3-i*.4;c.fillRect(120,yy,80,Math.max(.6,hh));}c.restore();X.hills(hz+1,10,X.lt(pal[1],.22),x*6,.03,hue+2);
  X.vg(0,hz,W,H-hz,[X.lt(pal[1],.3),pal[0],'#040408']);A.line(0,hz,W,hz,X.rgba(pal[1],.8),1);
  for(let i=-20;i<=20;i+=4){const gx=Math.round(x/4)*4+i,a=A.p3(gx,0,z+1),b=A.p3(gx,0,z+60);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],X.rgba(pal[1],.55));}for(let j=0;j<12;j++){const zz=Math.ceil(z/5)*5+j*5,a=A.p3(x-24,0,zz),b=A.p3(x+24,0,zz);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],X.rgba(pal[1],.35*(1-j/12)));}
  cubes.forEach(q=>{if(q.z>z-1&&q.z<z+24){const s=A.p3(q.x,0,q.z);if(pjOK(s))X.glow(s[0],s[1],Math.min(40,260/s[2]),q.c?pal[1]:pal[2],.18);}});
  cubes.forEach(q=>{if(q.z>z-1&&q.z<z+60){B3(q.x,0,q.z,1.4,1.4+q.c*.8,1.4,q.c?pal[1]:pal[2]);}});A.flush();A.fog=null;
  const sp=A.p3(x,.35,z+.4);if(pjOK(sp)){ss=[sp[0],sp[1]];if(!g.over){tr.unshift([sp[0],sp[1]+8]);if(tr.length>10)tr.pop();tr.forEach((t,i)=>{c.globalAlpha=.4*(1-i/10);X.disc(t[0],t[1]+i*2.2,3.2-i*.25,i<3?'#ffffff':pal[2]);});c.globalAlpha=1;X.ell(sp[0],sp[1]+12,16,3,'rgba(0,0,0,.4)');jet(sp[0],sp[1],bank,1,'#ffffff');}}
  c.strokeStyle=X.rgba(pal[1],.4);c.lineWidth=1;for(let i=0;i<10;i++){const a=i*.628+.3,r0=80+((z*40+i*31)%80);c.beginPath();c.moveTo(160+Math.cos(a)*r0,110+Math.sin(a)*r0*.55);c.lineTo(160+Math.cos(a)*(r0+20),110+Math.sin(a)*(r0+20)*.55);c.stroke();}
  X.vignette(.35);fx.draw();X.panel(118,3,84,30,pal[1]);X.ot(String(g.score),160,7,'#ffffff',2,'c');X.meter(124,24,72,5,(z%50)/50,pal[1]);A.text('ZONE '+(hue+1),6,6,X.lt(pal[1],1.2),1);if(hb>0){c.globalAlpha=Math.min(1,hb/15);X.ot('ZONE '+(hue+1),160,64-(60-hb)*.15,pal[1],3,'c');c.globalAlpha=1;}};
 return g;}});

/* ---- TUNNEL RUN 3D ---- */
A.add({id:'tunnel',name:'TUNNEL RUN 3D',cat:'RETRO 3D',hd:1,how:'MOVE TO THE GAP IN EACH WALL.',make(){
 const g={over:null,score:0},fx=X.fx(),lo=()=>A.gfx!=='off';let px=0,py=0,z=0,v=.16,walls=[],bank=0,run=0,boost=0,trail=[];for(let i=1;i<12;i++)walls.push({z:i*9+12,gx:ri(3)-1,gy:ri(3)-1,ok:0});
 g.update=()=>{if(boost)boost--;const k=A.in(0);px=cl(px+ax(k)*.16,-1.8,1.8);py=cl(py-ay(k)*.16,-1.8,1.8);bank+=(ax(k)*.4-bank)*.15;z+=v;v+=.00012;
  for(const w of walls){if(!w.ok&&w.z<z){w.ok=1;const inG=Math.abs(px-w.gx*1.9)<1&&Math.abs(py-w.gy*1.9)<1;if(inG){g.score+=10;run++;boost=14;S('coin');A.burst(160,104,'#2fe8d0',6);fx.ring(160,120,'#2fe8d0',70,16);fx.ring(160,120,'#ffffff',40,10);fx.spark(160,120,'#2fe8d0',14,3.4);if(run%5===0){fx.flash('#2fe8d0',5);fx.pop(160,80,'STREAK '+run,'#ffcf3f');}}else{g.over='SMASHED';S('boom');A.shake=10;fx.flash('#ff2060',10);fx.debris(160,140,'#ff3f8e',18,3.5);fx.spark(160,140,'#ffcf3f',20,4);}}if(w.z<z-2){w.z+=99;w.gx=ri(3)-1;w.gy=ri(3)-1;w.ok=0;}}};
 const P=(x,y,zz)=>A.p3(x,y,zz),ok=p=>pjOK(p)&&p[2]>.5;
 g.draw=()=>{const c=A.c;X.cache('tun_bg2',()=>{X.sky(['#0a0420','#120830','#0a0420']);X.glow(160,120,150,'#ff3f8e',.22);X.glow(160,120,60,'#8a6bff',.35);X.glow(160,120,22,'#ffffff',.5);});
  A.fog={col:'#120830',near:14,far:72};A.cam.x=px*.4;A.cam.y=py*.4;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<12;i++){const zz=Math.floor(z/8)*8+i*8,a=i%2?'#2c2260':'#211a4c',b=i%2?'#251d54':'#1a1442';F([[-3,-3,zz],[3,-3,zz],[3,-3,zz+8],[-3,-3,zz+8]],a);F([[-3,3,zz],[3,3,zz],[3,3,zz+8],[-3,3,zz+8]],b);F([[-3,-3,zz],[-3,3,zz],[-3,3,zz+8],[-3,-3,zz+8]],b);F([[3,-3,zz],[3,3,zz],[3,3,zz+8],[3,-3,zz+8]],b);
   for(const q of[-1.5,1.5])F([[q-.06,-2.98,zz],[q+.06,-2.98,zz],[q+.06,-2.98,zz+8],[q-.06,-2.98,zz+8]],'#3a2f7a',false);F([[-.1,-2.97,zz+1],[.1,-2.97,zz+1],[.1,-2.97,zz+5],[-.1,-2.97,zz+5]],'#2fe8d0',false);}
  A.flush();A.fog=null;
  /* neon ribs: 2D strokes so the near ones never smear across the screen */
  for(let i=13;i>=0;i--){const zz=Math.floor(z/4)*4+i*4,d=zz-z;if(d<1)continue;const Q=[[-3,-3],[3,-3],[3,3],[-3,3]].map(q=>P(q[0],q[1],zz));if(!Q.every(ok))continue;const al=Math.min(1,(d-1)/3)*Math.max(0,1-d/56),col=(Math.floor(zz/4)%2)?'#ff3f8e':'#8a6bff',pts=Q.map(p=>[p[0],p[1]]);c.globalAlpha=al;if(lo())X.polys(pts,X.rgba(col,.25),5);X.polys(pts,col,1.4);c.globalAlpha=1;}
  /* walls, far to near, drawn as glossy lit panels */
  walls.filter(w=>w.z>z-.2&&w.z<z+70).sort((a,b)=>b.z-a.z).forEach(w=>{const d=w.z-z,al=Math.max(0,Math.min(1,1.25-d/56)),hot=d<12,col=hot?'#ff3f8e':'#b02868';c.globalAlpha=al;
   const F0=P(-2.8,2.8,w.z),F1=P(2.8,-2.8,w.z);if(!ok(F0)||!ok(F1)){c.globalAlpha=1;return;}const sz=F1[0]-F0[0];X.rr(F0[0],F0[1],sz,F1[1]-F0[1],sz*.02,'rgba(10,4,24,.85)');
   for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++){const a=P(i*1.9-.88,j*1.9+.88,w.z),b=P(i*1.9+.88,j*1.9-.88,w.z),x=a[0],y=a[1],ww=b[0]-a[0],hh=b[1]-a[1];
    if(i===w.gx&&j===w.gy){const gl=hot?.55+.3*Math.sin(A.t*.4):.3;if(lo())X.glow(x+ww/2,y+hh/2,ww*.9,'#2fe8d0',gl*.5);X.rrs(x+1,y+1,ww-2,hh-2,ww*.08,'#2fe8d0',Math.max(1,ww*.04));if(ww>20){const m=ww*.12;c.strokeStyle=X.rgba('#bffff6',.5+.4*Math.sin(A.t*.3));c.lineWidth=Math.max(1,ww*.025);c.beginPath();c.moveTo(x+m*2,y+m);c.lineTo(x+m,y+m);c.lineTo(x+m,y+m*2);c.moveTo(x+ww-m*2,y+hh-m);c.lineTo(x+ww-m,y+hh-m);c.lineTo(x+ww-m,y+hh-m*2);c.stroke();}continue;}
    X.block(x,y,ww,hh,col,ww*.1);if(ww>14){X.rr(x+ww*.2,y+hh*.2,ww*.6,hh*.6,ww*.06,'rgba(0,0,0,.22)');c.fillStyle=X.rgba('#ffd0e8',hot?.55:.25);c.fillRect(x+ww*.22,y+hh*.47,ww*.56,Math.max(.6,hh*.06));}}
   c.globalAlpha=1;});
  /* streaks + jet with exhaust trail */
  c.strokeStyle='rgba(255,120,200,.35)';c.lineWidth=1;for(let i=0;i<16;i++){const a=i*.3927+i*i*.1,r0=70+((z*(40+boost*6)+i*37)%110),l=10+boost*2;c.beginPath();c.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0);c.lineTo(160+Math.cos(a)*(r0+l),120+Math.sin(a)*(r0+l));c.stroke();}
  const s=P(px,py,z+1.5);if(pjOK(s)){trail.unshift([s[0],s[1]+7]);if(trail.length>9)trail.pop();trail.forEach((q,i)=>{c.globalAlpha=(1-i/9)*.5;X.disc(q[0],q[1]+i*1.4,3.4-i*.3,i<3?'#bfefff':'#4da0ff');});c.globalAlpha=1;jet(s[0],s[1],bank,1.05);}
  fx.draw();X.vignette(.4);
  X.bar('SCORE '+g.score,'',run>1?'STREAK '+run:'',K.y);X.ot('SPEED',W-58,6,'#c8c0ff',1);X.meter(W-34,6,28,6,(v-.12)/.12,'#ff3f8e');};
 return g;}});

/* ---- TRENCH RUN 3D ---- */
A.add({id:'trench',name:'TRENCH RUN 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES. BLAST TURRETS, DODGE BARS.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=0,z=0,v=.15,ob=[],bl=[],sh=3,inv=0,bank=0,trail=[];for(let i=1;i<16;i++)ob.push({z:i*10,t:i%3===0?1:0,x:ri(3)-1,y:ri(2),hp:1});
 const SZ=1.5; /* the ship flies SZ ahead of z; obstacles hit it there */
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-2,2);py=cl(py-ay(k)*.14,-1.5,1.5);bank+=(ax(k)*.4-bank)*.15;z+=v;if(inv>0)inv--;if(A.fire(7)&&bl.length<12){bl.push({x:px,y:py,z:z+SZ+.5});S('shoot');}
  bl.forEach(b=>b.z+=.9);bl=bl.filter(b=>b.z<z+60);
  for(const o of ob){if(o.t===1&&o.hp>0)for(const b of bl)if(Math.abs(b.z-o.z)<1&&Math.abs(b.x-o.x*1.5)<.9&&Math.abs(b.y-(o.y?1:-1.5))<1){o.hp=0;b.z=999;g.score+=100;S('hit');o.boom=20;A.shake=2;const q=A.p3(o.x*1.5,o.y?1:-1.5,o.z);if(q[2]>.1){fx.spark(q[0],q[1],'#ffb040',14,2.6);fx.debris(q[0],q[1],'#c86a20',8,2);fx.pop(q[0],q[1]-10,'+100',K.y);}}
   if(o.boom>0)o.boom--;if(o.z<z+SZ+.5&&o.z>z+SZ-.5&&inv===0){const hit=o.t===0?(o.y?py>-.2:py<.2)&&true:o.hp>0&&Math.abs(px-o.x*1.5)<1&&Math.abs(py-(o.y?1:-1.5))<1;if(hit){sh--;inv=70;S('boom');A.shake=7;fx.flash('#ff2040',7);const s=A.p3(px,py,z+SZ);fx.spark(s[0],s[1],'#ff9040',20,3.2);fx.debris(s[0],s[1],'#8a86b8',8,2.4);if(sh<=0)g.over='SHIP LOST';}}
   if(o.z<z-2){o.z+=150;o.t=Math.random()<.35?1:0;o.x=ri(3)-1;o.y=ri(2);o.hp=1;}}if(A.t%30===0)g.score++;};
 const space=()=>{A.cls('#05030f');X.sky(['#05030f','#120a2e','#2a0f3a'],120);X.disc(250,30,60,X.rg(250,30,0,250,30,60,['rgba(255,80,160,.22)','rgba(120,40,200,.1)','rgba(0,0,0,0)']));X.disc(70,40,44,X.rg(70,40,0,70,40,44,['rgba(60,140,255,.18)','rgba(0,0,0,0)']));X.disc(280,18,12,X.rg(276,14,1,280,18,12,['#ffd8a0','#c86a40','#4a1a20']));X.ell(280,18,20,3,'rgba(255,200,150,.35)',-.3);};
 g.draw=()=>{X.cache('trench_sky',space);X.stars(60,11,0,z*4,80,.8);A.fog={col:'#0a0618',near:30,far:75};A.cam.x=px*.5;A.cam.y=py*.5+.2;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<10;i++){const zz=Math.floor(z/8)*8+i*8,c=i%2?'#4a4570':'#3a3560',c2=i%2?'#3e3a62':'#302c52';F([[-3,-2,zz],[3,-2,zz],[3,-2,zz+8],[-3,-2,zz+8]],c);F([[-3,-2,zz],[-3,2.5,zz],[-3,2.5,zz+8],[-3,-2,zz+8]],c2);F([[3,-2,zz],[3,2.5,zz],[3,2.5,zz+8],[3,-2,zz+8]],c2);
   F([[-.08,-1.99,zz],[.08,-1.99,zz],[.08,-1.99,zz+4],[-.08,-1.99,zz+4]],'#7ff8ff',false);F([[-2.2,-1.99,zz+2],[-2,-1.99,zz+2],[-2,-1.99,zz+6],[-2.2,-1.99,zz+6]],'#4a5aa0',false);F([[2,-1.99,zz+2],[2.2,-1.99,zz+2],[2.2,-1.99,zz+6],[2,-1.99,zz+6]],'#4a5aa0',false);
   B3(-2.8,.4+((zz/8)%3)*.5,zz+3,.4,.5,1.4,'#5a5488');B3(2.8,-1+((zz/8)%2)*1.2,zz+5,.4,.6,1.8,'#5a5488');B3(-2.85,-1.4,zz+6.5,.3,.8,.6,'#6a64a0');B3(2.85,1.2,zz+1.5,.3,.5,.9,'#6a64a0');
   F([[-2.99,1.6,zz+1],[-2.99,1.8,zz+1],[-2.99,1.8,zz+7],[-2.99,1.6,zz+7]],(i+((z*2)|0))%4?'#ff9a3f':'#ffe0a0',false);F([[2.99,1.6,zz+1],[2.99,1.8,zz+1],[2.99,1.8,zz+7],[2.99,1.6,zz+7]],(i+((z*2)|0))%4?'#ff9a3f':'#ffe0a0',false);}
  ob.forEach(o=>{if(o.z<z+70&&o.z>z+SZ-.2){if(o.t===0){const yb=o.y?-.1:-2;B3(0,yb,o.z,6,1.6,.5,'#c81838');B3(0,yb+1.6,o.z,6,.12,.55,'#ff8090');B3(0,yb-.02,o.z,6,.12,.55,'#ff8090');}else if(o.hp>0){const tx=o.x*1.5,ty=o.y?.5:-2;B3(tx,ty,o.z,1,1,1,K.o);B3(tx,ty+1,o.z,.5,.35,.5,'#c86a20');B3(tx,ty+1.1,o.z-.5,.15,.15,.9,'#333');}}});
  A.flush();A.fog=null;const c=A.c,pulse=.3+.15*Math.sin(A.t*.3);
  ob.forEach(o=>{if(o.z<z+SZ||o.z>z+50)return;if(o.t===0){const q=A.p3(0,o.y?.7:-1.2,o.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(120,300/q[2]),'#ff2040',pulse);}else if(o.hp>0){const q=A.p3(o.x*1.5,(o.y?.5:-2)+1.1,o.z-1);if(pjOK(q)&&A.t%30<4)X.glow(q[0],q[1],Math.max(3,20/q[2]),'#ffd060',.8);}else if(o.boom>0){const q=A.p3(o.x*1.5,o.y?1:-1.5,o.z);if(pjOK(q)){X.glow(q[0],q[1],(20-o.boom)*3,'#ffb040',.8);X.disc(q[0],q[1],(20-o.boom)*1.2,'rgba(255,240,180,'+o.boom/20+')');}}});
  bl.forEach(b=>{const p=A.p3(b.x,b.y,b.z),p2=A.p3(b.x,b.y,b.z-1.2);if(pjOK(p)&&pjOK(p2)){X.stroke([p2,p],'#7fff9a',Math.max(1,3/p[2]));X.glow(p[0],p[1],Math.max(3,12/p[2]),'#40ff80',.5);}});
  const s=A.p3(px,py,z+SZ);if(pjOK(s)){trail.unshift([s[0],s[1]+9]);if(trail.length>8)trail.pop();trail.forEach((q,i)=>{c.globalAlpha=(1-i/8)*.35;X.disc(q[0],q[1]+i*2,3-i*.3,'#60c0ff');});c.globalAlpha=1;if(inv%8<5)jet(s[0],s[1],bank,1.3);}
  if(A.gfx!=='off'){c.strokeStyle='rgba(180,200,255,.18)';c.lineWidth=1;for(let i=0;i<8;i++){const a=i*.785+.4,r0=60+((A.t*6+i*31)%100);c.beginPath();c.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0*.7);c.lineTo(160+Math.cos(a)*(r0+18),120+Math.sin(a)*(r0+18)*.7);c.stroke();}}
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);T('SHIELD',W-50,6,'#7fd0ff',1,'r');for(let i=0;i<3;i++)X.orb(W-12-i*14,9,4.5,i<sh?'#4ff8e0':'#2a2a3a');if(inv>0&&inv%10<5)X.vg(0,0,W,H,['rgba(255,32,64,.12)','rgba(255,32,64,0)','rgba(255,32,64,.12)']);};
 return g;}});
})();
