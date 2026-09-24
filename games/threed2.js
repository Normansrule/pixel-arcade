(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx,F=A.face,B3=A.box3;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
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
 const g={over:null,score:0},N=6,SP=8,BC=['#5c6b8a','#8a5c6b','#6b8a5c','#7a6b9a','#9a8a5c','#5c8a8a'];let p={x:0,z:0,a:0,v:0},time=5400,coins=[],cars=[],flash=0,bld=[];
 for(let i=-N;i<N;i++)for(let j=-N;j<N;j++)bld.push({x:i*SP+SP/2,z:j*SP+SP/2,h:1.5+((i*7+j*13)%5)*.9,w:4+((i+j)%2),c:BC[(i*3+j*5+36)%6]});
 const spawnCoin=()=>{const i=ri(N*2)-N,j=ri(N*2)-N,h=Math.random()<.5;coins.push({x:h?i*SP+rnd(SP)-SP/2:i*SP,z:h?j*SP:j*SP+rnd(SP)-SP/2});};for(let i=0;i<10;i++)spawnCoin();
 for(let i=0;i<8;i++){const h=i%2===0,l=(ri(N*2)-N)*SP;cars.push({x:h?rnd(N*2*SP)-N*SP:l+.9,z:h?l-.9:rnd(N*2*SP)-N*SP,a:h?1.5708:0,v:.06+rnd(.05),c:[K.r,K.y,K.p,K.w][i%4]});}
 const inBld=(x,z)=>{const rx=((x%SP)+2*SP)%SP,rz=((z%SP)+2*SP)%SP;return rx>1.3&&rx<SP-1.3&&rz>1.3&&rz<SP-1.3;};
 g.update=()=>{time--;if(flash>0)flash--;const k=A.in(0);p.v+=(k.u||k.a)?.006:k.d?-.008:0;p.v*=.985;p.v=cl(p.v,-.05,.2);p.a+=ax(k)*.045*Math.min(1,Math.abs(p.v)*12);
  const nx=p.x+Math.sin(p.a)*p.v,nz=p.z+Math.cos(p.a)*p.v;if(!inBld(nx,nz)&&Math.abs(nx)<N*SP&&Math.abs(nz)<N*SP){p.x=nx;p.z=nz;}else{p.v*=-.3;S('hit');}
  coins=coins.filter(c=>{if(Math.hypot(c.x-p.x,c.z-p.z)<1.1){g.score+=10;S('coin');spawnCoin();return false;}return true;});
  for(const c of cars){c.x+=Math.sin(c.a)*c.v;c.z+=Math.cos(c.a)*c.v;if(Math.abs(c.x)>N*SP||Math.abs(c.z)>N*SP)c.a+=3.1416;if(Math.hypot(c.x-p.x,c.z-p.z)<1.5&&flash===0){flash=40;g.score=Math.max(0,g.score-5);p.v*=-.5;S('boom');}}
  if(time<=0)g.over='TIME UP';};
 g.draw=()=>{sky('#0a0520','#c7497d');R(0,130,W,110,'#2a2a38');A.fog={col:'#3a2050',near:14,far:34};A.cam.x=p.x-Math.sin(p.a)*4.5;A.cam.z=p.z-Math.cos(p.a)*4.5;A.cam.y=2.3;A.cam.ry=-p.a;A.cam.rx=-.28;
  const vis=(o,r)=>{const dx=o.x-p.x,dz=o.z-p.z;return dx*Math.sin(p.a)+dz*Math.cos(p.a)>-4&&Math.hypot(dx,dz)<(r||34);};
  bld.forEach(b=>{if(!vis(b))return;B3(b.x,0,b.z,b.w+1.2,.12,b.w+1.2,'#8a8aa0');B3(b.x,0,b.z,b.w,b.h,b.w,b.c);if(vis(b,16))for(let f=.5;f<b.h-.3;f+=.7){const hw=b.w/2+.01;F([[b.x-hw+.3,f,b.z-hw],[b.x+hw-.3,f,b.z-hw],[b.x+hw-.3,f+.3,b.z-hw],[b.x-hw+.3,f+.3,b.z-hw]],'#0d0d1a',false);F([[b.x+hw-.3,f,b.z+hw],[b.x-hw+.3,f,b.z+hw],[b.x-hw+.3,f+.3,b.z+hw],[b.x+hw-.3,f+.3,b.z+hw]],'#0d0d1a',false);F([[b.x-hw,f,b.z+hw-.3],[b.x-hw,f,b.z-hw+.3],[b.x-hw,f+.3,b.z-hw+.3],[b.x-hw,f+.3,b.z+hw-.3]],'#0d0d1a',false);F([[b.x+hw,f,b.z-hw+.3],[b.x+hw,f,b.z+hw-.3],[b.x+hw,f+.3,b.z+hw-.3],[b.x+hw,f+.3,b.z-hw+.3]],'#0d0d1a',false);}});
  for(let i=-N;i<=N;i++)for(let j=-N;j<=N;j++){const gx=i*SP,gz=j*SP;if(vis({x:gx,z:gz},30)){F([[gx-.06,.02,gz+1.6],[gx+.06,.02,gz+1.6],[gx+.06,.02,gz+SP-1.6],[gx-.06,.02,gz+SP-1.6]],'#ffd75a',false);F([[gx+1.6,.02,gz-.06],[gx+SP-1.6,.02,gz-.06],[gx+SP-1.6,.02,gz+.06],[gx+1.6,.02,gz+.06]],'#ffd75a',false);if((i+j)%2===0)lamp(gx+1.35,gz+1.35);}}
  coins.forEach(c=>{if(vis(c))A.cyl3(c.x,.35+Math.sin(A.t*.1)*.1,c.z,.3,.12,K.y,8,'x');});
  cars.forEach(c=>{if(vis(c))car(c.x,0,c.z,c.a,c.c,'#333');});if(flash%6<3)car(p.x,0,p.z,p.a,K.c,'#178a7d');A.flush();A.fog=null;
  T('SCORE '+g.score,6,4,K.y,2);T(Math.ceil(time/60),160,4,time<600?K.r:K.w,2,'c');T(Math.round(Math.abs(p.v)*600)+' KMH',W-6,4,K.w,2,'r');if(A.t<180)T('COINS ARE ON THE STREETS',160,60,K.y,1,'c');};
 return g;}});

/* ---- MESH DRIFT 3D ---- */
A.add({id:'drift',name:'MESH DRIFT 3D',cat:'RETRO 3D',hd:1,how:'STEER. UP GAS. PASS GATES FOR POINTS.',make(){
 const g={over:null,score:0};let d=0,x=0,v=.12,lives=3,inv=0,gates=[],rocks=[];const cx=z=>Math.sin(z*.05)*6+Math.sin(z*.021)*4,hy=z=>Math.sin(z*.08)*.6;
 for(let i=1;i<20;i++){gates.push({z:i*14,x:rnd(6)-3,ok:0});rocks.push({z:i*14+7,x:rnd(10)-5});}
 g.update=()=>{const k=A.in(0);v+=k.u||k.a?.003:-.001;v=cl(v,.08,.3);d+=v;x+=ax(k)*.16;x=cl(x,-6,6);if(inv>0)inv--;
  for(const q of gates){if(!q.ok&&q.z<d){q.ok=1;if(Math.abs(cx(q.z)+q.x-x)<1.6){g.score+=50;S('coin');}}if(q.z<d-4){q.z+=280;q.x=rnd(6)-3;q.ok=0;}}
  for(const r of rocks){if(r.z<d-4){r.z+=280;r.x=rnd(10)-5;}if(inv===0&&Math.abs(r.z-d)<1.2&&Math.abs(cx(r.z)+r.x-x)<1.1){lives--;inv=80;v=.08;S('boom');if(lives<=0)g.over='WRECKED';}}
  if(A.t%20===0)g.score++;};
 g.draw=()=>{sky('#1a2a6a','#ff9838');C(160,118,22,'#ffd75a');R(0,130,W,110,'#7a4f1d');A.fog={col:'#c78a5a',near:16,far:36};const px=cx(d)+x,py=hy(d);A.cam.x=px-Math.sin(0)*0;A.cam.z=d-4;A.cam.y=py+1.6;A.cam.ry=0;A.cam.rx=-.2;A.cam.x=cx(d-4)+x*.8;
  for(let z=Math.floor(d)-2;z<d+34;z++){const a=cx(z),b=cx(z+1),ya=hy(z),yb=hy(z+1);F([[a-7,ya,z],[a+7,ya,z],[b+7,yb,z+1],[b-7,yb,z+1]],z%2?'#4a4a55':'#3e3e48');if(z%4<2&&z>d)F([[a-.12,ya+.01,z],[a+.12,ya+.01,z],[b+.12,yb+.01,z+1],[b-.12,yb+.01,z+1]],'#e8e8e8',false);F([[a-16,ya-.2,z],[a-7.6,ya,z],[b-7.6,yb,z+1],[b-16,yb-.2,z+1]],z%2?'#3f8a3a':'#377f33');F([[a+7.6,ya,z],[a+16,ya-.2,z],[b+16,yb-.2,z+1],[b+7.6,yb,z+1]],z%2?'#3f8a3a':'#377f33');F([[a-7.6,ya,z],[a-7,ya,z],[b-7,yb,z+1],[b-7.6,yb,z+1]],z%2?K.r:K.w);F([[a+7,ya,z],[a+7.6,ya,z],[b+7.6,yb,z+1],[b+7,yb,z+1]],z%2?K.r:K.w);if(z%6===0)tree(a-11,z,2.5+(z%5)*.3),tree(b+11,z,2+(z%7)*.3);}
  gates.forEach(q=>{if(q.z>d-2&&q.z<d+34){const gx=cx(q.z)+q.x,gy=hy(q.z);B3(gx-1.7,gy,q.z,.25,2.2,.25,q.ok?K.gr:K.y);B3(gx+1.7,gy,q.z,.25,2.2,.25,q.ok?K.gr:K.y);B3(gx,gy+2.2,q.z,3.7,.3,.25,q.ok?K.gr:K.y);}});
  rocks.forEach(r=>{if(r.z>d-2&&r.z<d+34)B3(cx(r.z)+r.x,hy(r.z),r.z,1.2,.9,1.2,'#8d86b8');});
  if(inv%8<5)car(px,py,d,ax(A.in(0))*.25,K.c,'#178a7d');A.flush();A.fog=null;T('SCORE '+g.score,6,4,K.y,2);T('LIVES '+lives,W-6,4,lives<2?K.r:K.w,2,'r');T(Math.round(v*900)+' KMH',160,4,K.w,2,'c');};
 return g;}});

/* ---- CUBE FIELD 3D ---- */
A.add({id:'cubes',name:'CUBE FIELD 3D',cat:'RETRO 3D',hd:1,how:'STEER LEFT/RIGHT. NEVER STOP. SURVIVE.',make(){
 const g={over:null,score:0};let x=0,z=0,v=.14,cubes=[],hue=0;for(let i=0;i<90;i++)cubes.push({x:rnd(40)-20,z:rnd(80)+5,c:i%3});
 g.update=()=>{const k=A.in(0);x+=ax(k)*.22;z+=v;v+=.00008;g.score=z*2|0;hue=(z/50)|0;
  for(const c of cubes){if(c.z<z-1){c.z+=80+rnd(6);c.x=x+rnd(40)-20;}if(Math.abs(c.z-z)<.9&&Math.abs(c.x-x)<1.1){g.over='CRASHED';S('boom');}}};
 g.draw=()=>{const pal=[['#0a0520','#ff3f8e','#2fe8d0'],['#03101f','#ffcf3f','#4dabff'],['#1a0a0a','#3dff8b','#ff9838'],['#0f0f1a','#ffffff','#ff4f6d']][hue%4];sky(pal[0],'#000');R(0,120,W,120,'#111');A.fog={col:pal[0],near:20,far:60};A.cam.x=x;A.cam.z=z-3;A.cam.y=1.4;A.cam.ry=0;A.cam.rx=-.15;
  for(let i=-20;i<=20;i+=4){const a=A.p3(x+i,0,z+1),b=A.p3(x+i,0,z+60);if(a[2]>.1&&b[2]>.1)L(a[0],a[1],b[0],b[1],pal[1]);}
  cubes.forEach(c=>{if(c.z>z-1&&c.z<z+60)B3(c.x,0,c.z,1.4,1.4+c.c*.8,1.4,c.c?pal[1]:pal[2]);});A.flush();A.fog=null;T(g.score,160,6,K.w,3,'c');};
 return g;}});

/* ---- TUNNEL RUN 3D ---- */
A.add({id:'tunnel',name:'TUNNEL RUN 3D',cat:'RETRO 3D',hd:1,how:'MOVE TO THE GAP IN EACH WALL.',make(){
 const g={over:null,score:0};let px=0,py=0,z=0,v=.16,walls=[];for(let i=1;i<12;i++)walls.push({z:i*9,gx:ri(3)-1,gy:ri(3)-1,ok:0});
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.16,-1.8,1.8);py=cl(py-ay(k)*.16,-1.8,1.8);z+=v;v+=.00012;
  for(const w of walls){if(!w.ok&&w.z<z){w.ok=1;const inG=Math.abs(px-w.gx*1.9)<1&&Math.abs(py-w.gy*1.9)<1;if(inG){g.score+=10;S('coin');}else{g.over='SMASHED';S('boom');}}if(w.z<z-2){w.z+=99;w.gx=ri(3)-1;w.gy=ri(3)-1;w.ok=0;}}};
 g.draw=()=>{A.cls('#05030f');A.fog={col:'#05030f',near:25,far:75};A.cam.x=px*.4;A.cam.y=py*.4;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<12;i++){const zz=Math.floor(z/8)*8+i*8,c=i%2?'#2b2257':'#1b1440';F([[-3,-3,zz],[3,-3,zz],[3,-3,zz+8],[-3,-3,zz+8]],c);F([[-3,3,zz],[3,3,zz],[3,3,zz+8],[-3,3,zz+8]],c);F([[-3,-3,zz],[-3,3,zz],[-3,3,zz+8],[-3,-3,zz+8]],c);F([[3,-3,zz],[3,3,zz],[3,3,zz+8],[3,-3,zz+8]],c);}
  walls.forEach(w=>{if(w.z<z+70)for(let i=-1;i<=1;i++)for(let j=-1;j<=1;j++)if(!(i===w.gx&&j===w.gy))F([[i*1.9-.95,j*1.9-.95,w.z],[i*1.9+.95,j*1.9-.95,w.z],[i*1.9+.95,j*1.9+.95,w.z],[i*1.9-.95,j*1.9+.95,w.z]],w.z-z<12?K.p:'#a0205a');});
  A.flush();A.fog=null;const s=A.p3(px,py,z+1.5);A.poly([[s[0],s[1]-6],[s[0]-9,s[1]+5],[s[0],s[1]+2],[s[0]+9,s[1]+5]],K.c,1);T(g.score,160,6,K.w,3,'c');};
 return g;}});

/* ---- TRENCH RUN 3D ---- */
A.add({id:'trench',name:'TRENCH RUN 3D',cat:'RETRO 3D',hd:1,how:'FLY. A FIRES. BLAST TURRETS, DODGE BARS.',make(){
 const g={over:null,score:0};let px=0,py=0,z=0,v=.15,ob=[],bl=[],sh=3,inv=0;for(let i=1;i<16;i++)ob.push({z:i*10,t:i%3===0?1:0,x:ri(3)-1,y:ri(2),hp:1});
 g.update=()=>{const k=A.in(0);px=cl(px+ax(k)*.14,-2,2);py=cl(py-ay(k)*.14,-1.5,1.5);z+=v;if(inv>0)inv--;if(A.hit(0).a&&bl.length<4){bl.push({x:px,y:py,z:z+1});S('shoot');}
  bl.forEach(b=>b.z+=.9);bl=bl.filter(b=>b.z<z+60);
  for(const o of ob){if(o.t===1&&o.hp>0)for(const b of bl)if(Math.abs(b.z-o.z)<1&&Math.abs(b.x-o.x*1.5)<.9&&Math.abs(b.y-(o.y?1:-1.5))<1){o.hp=0;b.z=999;g.score+=100;S('hit');}
   if(o.z<z+.5&&o.z>z-.5&&inv===0){const hit=o.t===0?(o.y?py>-.2:py<.2)&&true:o.hp>0&&Math.abs(px-o.x*1.5)<1&&Math.abs(py-(o.y?1:-1.5))<1;if(hit){sh--;inv=70;S('boom');if(sh<=0)g.over='SHIP LOST';}}
   if(o.z<z-2){o.z+=150;o.t=Math.random()<.35?1:0;o.x=ri(3)-1;o.y=ri(2);o.hp=1;}}if(A.t%30===0)g.score++;};
 g.draw=()=>{A.cls('#05030f');A.fog={col:'#05030f',near:30,far:75};A.cam.x=px*.5;A.cam.y=py*.5+.2;A.cam.z=z-3;A.cam.ry=0;A.cam.rx=0;
  for(let i=0;i<10;i++){const zz=Math.floor(z/8)*8+i*8,c=i%2?'#4a4570':'#3a3560';F([[-3,-2,zz],[3,-2,zz],[3,-2,zz+8],[-3,-2,zz+8]],c);F([[-3,-2,zz],[-3,2.5,zz],[-3,2.5,zz+8],[-3,-2,zz+8]],c);F([[3,-2,zz],[3,2.5,zz],[3,2.5,zz+8],[3,-2,zz+8]],c);}
  ob.forEach(o=>{if(o.z<z+70&&o.z>z-1){if(o.t===0)B3(0,o.y?-.1:-2,o.z,6,1.6,.5,K.r);else if(o.hp>0)B3(o.x*1.5,o.y?.5:-2,o.z,1,1,1,K.o);}});
  A.flush();A.fog=null;bl.forEach(b=>{const p=A.p3(b.x,b.y,b.z);if(p[2]>.1)R(p[0]-1,p[1]-1,3,3,K.g);});if(inv%8<5){const s=A.p3(px,py,z+1.5);A.poly([[s[0],s[1]-7],[s[0]-11,s[1]+6],[s[0],s[1]+2],[s[0]+11,s[1]+6]],K.c,1);}
  T('SCORE '+g.score,6,4,K.y,2);T('SHIELDS '+sh,W-6,4,sh<2?K.r:K.w,2,'r');};
 return g;}});
})();
