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
 const g={over:null,score:0},fx=X.fx();let d=0,x=0,v=.12,lives=3,inv=0,gates=[],rocks=[];const cx=z=>Math.sin(z*.05)*6+Math.sin(z*.021)*4,hy=z=>Math.sin(z*.08)*.6;
 for(let i=1;i<20;i++){gates.push({z:i*14,x:rnd(6)-3,ok:0});rocks.push({z:i*14+7,x:rnd(10)-5});}
 g.update=()=>{const k=A.in(0);v+=k.u||k.a?.003:-.001;v=cl(v,.08,.3);d+=v;x+=ax(k)*.16;x=cl(x,-6,6);if(inv>0)inv--;
  for(const q of gates){if(!q.ok&&q.z<d){q.ok=1;if(Math.abs(cx(q.z)+q.x-x)<1.6){g.score+=50;S('coin');q.ok=2;fx.ring(160,150,K.y,40);fx.spark(160,140,K.y,16,2.6);fx.pop(160,110,'GATE +50',K.y);}}if(q.z<d-4){q.z+=280;q.x=rnd(6)-3;q.ok=0;}}
  for(const r of rocks){if(r.z<d-4){r.z+=280;r.x=rnd(10)-5;}if(inv===0&&Math.abs(r.z-d)<1.2&&Math.abs(cx(r.z)+r.x-x)<1.1){lives--;inv=80;v=.08;S('boom');A.shake=7;fx.flash('#ff2040',6);fx.debris(160,170,'#8d86b8',12,2.6);if(lives<=0)g.over='WRECKED';}}
  if(A.t%20===0)g.score++;};
 g.draw=()=>{sky('#1a2a6a','#ff9838');X.glow(160,118,70,'#ffb050',.45);X.disc(160,118,22,X.rg(160,118,0,160,118,22,['#fff4c0','#ffd75a','#ff9040']));X.hills(132,18,'#5a3a6a',d*3,.02,2);R(0,130,W,110,'#7a4f1d');A.fog={col:'#c78a5a',near:16,far:36};const px=cx(d)+x,py=hy(d);A.cam.x=px-Math.sin(0)*0;A.cam.z=d-4;A.cam.y=py+1.6;A.cam.ry=0;A.cam.rx=-.2;A.cam.x=cx(d-4)+x*.8;
  for(let z=Math.floor(d)-2;z<d+34;z++){const a=cx(z),b=cx(z+1),ya=hy(z),yb=hy(z+1);F([[a-7,ya,z],[a+7,ya,z],[b+7,yb,z+1],[b-7,yb,z+1]],z%2?'#4a4a55':'#3e3e48');if(z%4<2&&z>d)F([[a-.12,ya+.01,z],[a+.12,ya+.01,z],[b+.12,yb+.01,z+1],[b-.12,yb+.01,z+1]],'#e8e8e8',false);F([[a-16,ya-.2,z],[a-7.6,ya,z],[b-7.6,yb,z+1],[b-16,yb-.2,z+1]],z%2?'#3f8a3a':'#377f33');F([[a+7.6,ya,z],[a+16,ya-.2,z],[b+16,yb-.2,z+1],[b+7.6,yb,z+1]],z%2?'#3f8a3a':'#377f33');F([[a-7.6,ya,z],[a-7,ya,z],[b-7,yb,z+1],[b-7.6,yb,z+1]],z%2?K.r:K.w);F([[a+7,ya,z],[a+7.6,ya,z],[b+7.6,yb,z+1],[b+7,yb,z+1]],z%2?K.r:K.w);if(z%6===0)tree(a-11,z,2.5+(z%5)*.3),tree(b+11,z,2+(z%7)*.3);}
  gates.forEach(q=>{if(q.z>d-2&&q.z<d+34){const gx=cx(q.z)+q.x,gy=hy(q.z),col=q.ok===2?K.g:q.ok?K.gr:K.y;B3(gx-1.7,gy,q.z,.25,2.2,.25,col);B3(gx+1.7,gy,q.z,.25,2.2,.25,col);B3(gx,gy+2.2,q.z,3.7,.3,.25,col);F([[gx-1.55,gy+.05,q.z],[gx+1.55,gy+.05,q.z],[gx+1.55,gy+.05,q.z+.6],[gx-1.55,gy+.05,q.z+.6]],q.ok?'#3e3e48':'#ffe680',false);}});
  rocks.forEach(r=>{if(r.z>d-2&&r.z<d+34){const rx=cx(r.z)+r.x,ry=hy(r.z);B3(rx,ry,r.z,1.2,.9,1.2,'#8d86b8');B3(rx+.2,ry+.9,r.z-.1,.7,.35,.7,'#a8a0d0');}});
  if(inv%8<5)car(px,py,d,ax(A.in(0))*.25,K.c,'#178a7d');A.flush();A.fog=null;
  gates.forEach(q=>{if(q.ok||q.z<d+1||q.z>d+30)return;const s=A.p3(cx(q.z)+q.x,hy(q.z)+2.35,q.z);if(pjOK(s))X.glow(s[0],s[1],Math.min(30,90/s[2]),'#ffe060',.35);});
  if(v>.22){A.c.strokeStyle='rgba(255,255,255,.2)';A.c.lineWidth=1;for(let i=0;i<10;i++){const a=i*.628+A.t*.03,r0=70+((A.t*7+i*37)%90);A.c.beginPath();A.c.moveTo(160+Math.cos(a)*r0,125+Math.sin(a)*r0*.6);A.c.lineTo(160+Math.cos(a)*(r0+24),125+Math.sin(a)*(r0+24)*.6);A.c.stroke();}}
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<3;i++)X.heart(W-12-i*13,7,1.3,i<lives?'#ff4f6d':'rgba(255,255,255,.2)');X.panel(122,20,76,14,'#ffb050');X.meter(126,24,40,6,(v-.08)/.22,K.o);T(Math.round(v*900)+'',194,24,'#ffffff',1,'r',1);};
 return g;}});

/* ---- CUBE FIELD 3D ---- */
A.add({id:'cubes',name:'CUBE FIELD 3D',cat:'RETRO 3D',hd:1,how:'STEER LEFT/RIGHT. NEVER STOP. SURVIVE.',make(){
 const g={over:null,score:0};let x=0,z=0,v=.14,cubes=[],hue=0,bank=0,lastHue=0,hb=0;for(let i=0;i<90;i++)cubes.push({x:rnd(40)-20,z:rnd(80)+5,c:i%3});
 g.update=()=>{const k=A.in(0);x+=ax(k)*.22;bank+=(ax(k)*.4-bank)*.15;z+=v;v+=.00008;g.score=z*2|0;hue=(z/50)|0;if(hue!==lastHue){lastHue=hue;hb=60;S('score');}if(hb>0)hb--;
  for(const c of cubes){if(c.z<z-1){c.z+=80+rnd(6);c.x=x+rnd(40)-20;}if(Math.abs(c.z-z)<.9&&Math.abs(c.x-x)<1.1){g.over='CRASHED';S('boom');A.shake=8;}}};
 g.draw=()=>{const pal=[['#0a0520','#ff3f8e','#2fe8d0'],['#03101f','#ffcf3f','#4dabff'],['#1a0a0a','#3dff8b','#ff9838'],['#0f0f1a','#ffffff','#ff4f6d']][hue%4];sky(pal[0],X.lt(pal[1],.35));X.stars(50,hue+2,x*20,0,110,.6);A.fog={col:pal[0],near:20,far:60};A.cam.x=x;A.cam.z=z-3;A.cam.y=1.4;A.cam.ry=0;A.cam.rx=-.15;const hzp=A.p3(x,0,z+400),hz=pjOK(hzp)?cl(hzp[1],40,200):120;X.glow(160,hz,120,pal[1],.25);X.vg(0,hz,W,H-hz,['#1a1428','#08080e']);A.line(0,hz,W,hz,X.rgba(pal[1],.6),1);
  for(let i=-20;i<=20;i+=4){const gx=Math.round(x/4)*4+i,a=A.p3(gx,0,z+1),b=A.p3(gx,0,z+60);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],X.rgba(pal[1],.5));}for(let j=0;j<12;j++){const zz=Math.ceil(z/5)*5+j*5,a=A.p3(x-24,0,zz),b=A.p3(x+24,0,zz);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],X.rgba(pal[1],.25*(1-j/12)));}
  cubes.forEach(c=>{if(c.z>z-1&&c.z<z+60){B3(c.x,0,c.z,1.4,1.4+c.c*.8,1.4,c.c?pal[1]:pal[2]);}});A.flush();A.fog=null;
  const sp=A.p3(x,.35,z+.4);if(pjOK(sp)){X.ell(sp[0],sp[1]+12,16,3,'rgba(0,0,0,.4)');jet(sp[0],sp[1],bank,1,'#ffffff');}
  A.c.strokeStyle=X.rgba(pal[1],.35);A.c.lineWidth=1;for(let i=0;i<8;i++){const a=i*.785+.3,r0=80+((z*40+i*31)%80);A.c.beginPath();A.c.moveTo(160+Math.cos(a)*r0,110+Math.sin(a)*r0*.55);A.c.lineTo(160+Math.cos(a)*(r0+18),110+Math.sin(a)*(r0+18)*.55);A.c.stroke();}
  X.ot(String(g.score),160,6,'#ffffff',3,'c');if(hb>0)X.ot('ZONE '+(hue+1),160,60,pal[1],2,'c');};
 return g;}});

/* ---- TUNNEL RUN 3D ---- */
A.add({id:'tunnel',name:'TUNNEL RUN 3D',cat:'RETRO 3D',hd:1,how:'MOVE TO THE GAP IN EACH WALL.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=0,z=0,v=.16,walls=[],bank=0;for(let i=1;i<12;i++)walls.push({z:i*9+12,gx:ri(3)-1,gy:ri(3)-1,ok:0});
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.16,-1.8,1.8);py=cl(py-ay(k)*.16,-1.8,1.8);bank+=(ax(k)*.4-bank)*.15;z+=v;v+=.00012;
  for(const w of walls){if(!w.ok&&w.z<z){w.ok=1;const inG=Math.abs(px-w.gx*1.9)<1&&Math.abs(py-w.gy*1.9)<1;if(inG){g.score+=10;S('coin');fx.ring(160,120,'#2fe8d0',60);fx.spark(160,120,'#2fe8d0',10,3);}else{g.over='SMASHED';S('boom');A.shake=8;fx.flash('#ff2060',8);}}if(w.z<z-2){w.z+=99;w.gx=ri(3)-1;w.gy=ri(3)-1;w.ok=0;}}};
 g.draw=()=>{A.cls('#05030f');A.fog={col:'#05030f',near:25,far:75};A.cam.x=px*.4;A.cam.y=py*.4;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<12;i++){const zz=Math.floor(z/8)*8+i*8,c=i%2?'#2b2257':'#1b1440',c2=i%2?'#241c4a':'#16103a';F([[-3,-3,zz],[3,-3,zz],[3,-3,zz+8],[-3,-3,zz+8]],c);F([[-3,3,zz],[3,3,zz],[3,3,zz+8],[-3,3,zz+8]],c2);F([[-3,-3,zz],[-3,3,zz],[-3,3,zz+8],[-3,-3,zz+8]],c2);F([[3,-3,zz],[3,3,zz],[3,3,zz+8],[3,-3,zz+8]],c2);
   const nc='#ff3f8e';F([[-3,-2.99,zz],[3,-2.99,zz],[3,-2.99,zz+.25],[-3,-2.99,zz+.25]],nc,false);F([[-3,2.99,zz],[3,2.99,zz],[3,2.99,zz+.25],[-3,2.99,zz+.25]],nc,false);F([[-2.99,-3,zz],[-2.99,3,zz],[-2.99,3,zz+.25],[-2.99,-3,zz+.25]],nc,false);F([[2.99,-3,zz],[2.99,3,zz],[2.99,3,zz+.25],[2.99,-3,zz+.25]],nc,false);
   F([[-.1,-2.98,zz+1],[.1,-2.98,zz+1],[.1,-2.98,zz+5],[-.1,-2.98,zz+5]],'#2fe8d0',false);}
  walls.forEach(w=>{if(w.z<z+70&&w.z>z-1)for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(!(i===w.gx&&j===w.gy))B3(i*1.9,j*1.9-.9,w.z,1.8,1.8,.5,w.z-z<12?'#ff3f8e':'#a0205a');});
  A.flush();A.fog=null;
  walls.forEach(w=>{if(w.ok||w.z>z+40)return;const a=A.p3(w.gx*1.9-.95,w.gy*1.9-.95,w.z),b=A.p3(w.gx*1.9+.95,w.gy*1.9+.95,w.z);if(pjOK(a)&&pjOK(b)){const al=Math.max(.2,1-(w.z-z)/40);X.rrs(Math.min(a[0],b[0]),Math.min(a[1],b[1]),Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]),2,X.rgba('#2fe8d0',al),2);X.glow((a[0]+b[0])/2,(a[1]+b[1])/2,Math.abs(b[0]-a[0])*.7,'#2fe8d0',.25*al);}});
  const s=A.p3(px,py,z+1.5);if(pjOK(s))jet(s[0],s[1],bank,.9);
  A.c.strokeStyle='rgba(255,63,142,.3)';A.c.lineWidth=1;for(let i=0;i<10;i++){const a=i*.628,r0=90+((z*30+i*23)%70);A.c.beginPath();A.c.moveTo(160+Math.cos(a)*r0,120+Math.sin(a)*r0);A.c.lineTo(160+Math.cos(a)*(r0+20),120+Math.sin(a)*(r0+20));A.c.stroke();}
  fx.draw();X.ot(String(g.score),160,6,'#ffffff',3,'c');};
 return g;}});

/* ---- TRENCH RUN 3D ---- */
A.add({id:'trench',name:'TRENCH RUN 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES. BLAST TURRETS, DODGE BARS.',make(){
 const g={over:null,score:0},fx=X.fx();let px=0,py=0,z=0,v=.15,ob=[],bl=[],sh=3,inv=0,bank=0;for(let i=1;i<16;i++)ob.push({z:i*10,t:i%3===0?1:0,x:ri(3)-1,y:ri(2),hp:1});
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-2,2);py=cl(py-ay(k)*.14,-1.5,1.5);bank+=(ax(k)*.4-bank)*.15;z+=v;if(inv>0)inv--;if(A.fire(7)&&bl.length<12){bl.push({x:px,y:py,z:z+1});S('shoot');}
  bl.forEach(b=>b.z+=.9);bl=bl.filter(b=>b.z<z+60);
  for(const o of ob){if(o.t===1&&o.hp>0)for(const b of bl)if(Math.abs(b.z-o.z)<1&&Math.abs(b.x-o.x*1.5)<.9&&Math.abs(b.y-(o.y?1:-1.5))<1){o.hp=0;b.z=999;g.score+=100;S('hit');o.boom=20;}
   if(o.boom>0)o.boom--;if(o.z<z+.5&&o.z>z-.5&&inv===0){const hit=o.t===0?(o.y?py>-.2:py<.2)&&true:o.hp>0&&Math.abs(px-o.x*1.5)<1&&Math.abs(py-(o.y?1:-1.5))<1;if(hit){sh--;inv=70;S('boom');A.shake=7;fx.flash('#ff2040',7);fx.spark(160,150,'#ff9040',18,3);if(sh<=0)g.over='SHIP LOST';}}
   if(o.z<z-2){o.z+=150;o.t=Math.random()<.35?1:0;o.x=ri(3)-1;o.y=ri(2);o.hp=1;}}if(A.t%30===0)g.score++;};
 g.draw=()=>{A.cls('#05030f');X.stars(60,11,0,0,60,.8);A.fog={col:'#05030f',near:30,far:75};A.cam.x=px*.5;A.cam.y=py*.5+.2;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<10;i++){const zz=Math.floor(z/8)*8+i*8,c=i%2?'#4a4570':'#3a3560',c2=i%2?'#3e3a62':'#302c52';F([[-3,-2,zz],[3,-2,zz],[3,-2,zz+8],[-3,-2,zz+8]],c);F([[-3,-2,zz],[-3,2.5,zz],[-3,2.5,zz+8],[-3,-2,zz+8]],c2);F([[3,-2,zz],[3,2.5,zz],[3,2.5,zz+8],[3,-2,zz+8]],c2);
   F([[-.08,-1.99,zz],[.08,-1.99,zz],[.08,-1.99,zz+4],[-.08,-1.99,zz+4]],'#7ff8ff',false);B3(-2.8,.4+((zz/8)%3)*.5,zz+3,.4,.5,1.4,'#5a5488');B3(2.8,-1+((zz/8)%2)*1.2,zz+5,.4,.6,1.8,'#5a5488');F([[-2.99,1.6,zz+1],[-2.99,1.8,zz+1],[-2.99,1.8,zz+7],[-2.99,1.6,zz+7]],(i+((z*2)|0))%4?'#ff9a3f':'#ffe0a0',false);F([[2.99,1.6,zz+1],[2.99,1.8,zz+1],[2.99,1.8,zz+7],[2.99,1.6,zz+7]],(i+((z*2)|0))%4?'#ff9a3f':'#ffe0a0',false);}
  ob.forEach(o=>{if(o.z<z+70&&o.z>z-1){if(o.t===0)B3(0,o.y?-.1:-2,o.z,6,1.6,.5,'#ff3050');else if(o.hp>0){const tx=o.x*1.5,ty=o.y?.5:-2;B3(tx,ty,o.z,1,1,1,K.o);B3(tx,ty+1,o.z,.5,.35,.5,'#c86a20');B3(tx,ty+1.1,o.z-.5,.15,.15,.9,'#333');}}});
  A.flush();A.fog=null;
  ob.forEach(o=>{if(o.z<z+1||o.z>z+50)return;if(o.t===0){const q=A.p3(0,o.y?.7:-1.2,o.z);if(pjOK(q))X.glow(q[0],q[1],Math.min(120,300/q[2]),'#ff2040',.35);}else if(o.boom>0){const q=A.p3(o.x*1.5,o.y?1:-1.5,o.z);if(pjOK(q)){X.glow(q[0],q[1],(20-o.boom)*3,'#ffb040',.8);X.disc(q[0],q[1],(20-o.boom)*1.2,'rgba(255,240,180,'+o.boom/20+')');}}});
  bl.forEach(b=>{const p=A.p3(b.x,b.y,b.z),p2=A.p3(b.x,b.y,b.z-1.2);if(pjOK(p)&&pjOK(p2)){X.stroke([p2,p],'#7fff9a',Math.max(1,3/p[2]));X.glow(p[0],p[1],Math.max(3,12/p[2]),'#40ff80',.5);}});if(inv%8<5){const s=A.p3(px,py,z+1.5);if(pjOK(s))jet(s[0],s[1],bank,1);}
  fx.draw();X.bar('SCORE '+g.score,'','',K.y);for(let i=0;i<3;i++)X.orb(W-12-i*14,9,4.5,i<sh?'#4ff8e0':'#2a2a3a');};
 return g;}});
})();
