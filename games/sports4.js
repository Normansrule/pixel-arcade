(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),human=p=>A.two?p:0;
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),PC=['#2fd6c3','#ff4f9a'];
const crowd4=(y0,y1,seed,a)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.globalAlpha=a||.5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};
const pb4=(x,y,f)=>{X.panel(x-3,y-3,16,106,'#ffffff');X.rr(x,y,10,100,4,'rgba(0,0,0,.4)');const h=f*96;X.rr(x+1,y+98-h,8,h,3,X.lg(0,y+98,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};
const sb4=(x,y,r,rot)=>{const c=A.c;c.save();c.translate(x,y);X.orb(0,0,r,'#ffffff');c.rotate(rot||0);c.fillStyle='#222';c.fillRect(-r*.25,-r*.25,r*.5,r*.5);c.fillRect(r*.45,-r*.7,r*.3,r*.3);c.fillRect(-r*.75,r*.35,r*.3,r*.3);c.restore();};
const tapRace=(i,q)=>{if(A.cpu&&i===1){q.v+=((2+2*A.ai)-q.v)*.05+rnd(.1)-.05;return;}const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.45;}q.v*=.965;};
const person=(x,y,col,st)=>A.person(x,y,{c:col,st:typeof st==='number'?st*Math.PI+(A.t*.35):0,s:1.05});

A.add({id:'tabletennis',name:'TABLE TENNIS',cat:'SPORTS',vs:1,how:'LEFT/RIGHT MOVE THE BAT. HOLD UP OR DOWN AS YOU HIT TO ADD SPIN. FIRST TO 11.',make(){
 const g={over:null,score:0},fx=X.fx();let bat=[160,160],b,sc=[0,0],srv=0,wait=50,tr=[],hitT=[0,0];const reset=()=>{b={x:bat[srv],y:srv?50:190,vx:0,vy:srv?2.4:-2.4,z:0,vz:0,spin:0,bounced:false};wait=50;tr=[];};reset();
 g.update=()=>{hitT=hitT.map(v=>v?v-1:0);if(wait>0){wait--;return;}if(A.cpu){const tx=b.vy<0?b.x+b.vx*((b.y-50)/-b.vy||0)*.6:160;A.bot({l:bat[1]>tx+3,r:bat[1]<tx-3,u:Math.random()<.3});}
  for(let i=0;i<2;i++){const k=A.in(i),sp=i&&A.cpu?1.6+1.8*A.ai:3.4;bat[i]=cl(bat[i]+ax(k)*sp,70,250);const by=i?44:196;if((i?b.vy<0:b.vy>0)&&Math.abs(b.y-by)<6&&Math.abs(b.x-bat[i])<18){b.vy=-b.vy*1.03;b.vx=(b.x-bat[i])*.12+ax(k)*.6;b.spin=ay(k)*(i?-1:1)*.04;b.bounced=false;S('hit');hitT[i]=8;fx.spark(b.x,b.y,'#ffffff',5,1.8);if(b.spin)fx.ring(b.x,b.y,'#ffcf3f',10,10);}}
  tr.unshift([b.x,b.y]);if(tr.length>8)tr.pop();b.x+=b.vx;b.y+=b.vy;b.vx+=b.spin;if(b.x<60||b.x>260){const w=b.vy<0?0:1;sc[w]++;S('score');fx.pop(160,120,'POINT '+A.nm(w),PC[w]);if(sc[w]>=11&&sc[w]-sc[1-w]>=2)g.over=A.win(w);else{srv=(sc[0]+sc[1])%4<2?0:1;reset();}return;}
  if(b.y<30||b.y>210){const w=b.y<30?0:1;sc[w]++;S('score');fx.pop(160,120,'POINT '+A.nm(w),PC[w]);if(sc[w]>=11&&sc[w]-sc[1-w]>=2)g.over=A.win(w);else{srv=(sc[0]+sc[1])%4<2?0:1;reset();}}};
 const bg=()=>{X.wood(0,0,W,H,'#6a4a30',true);X.vignette(.5);X.shadow(162,126,96,70,.4);X.rr(68,54,184,136,3,'#0e3a7a');X.rr(70,56,180,132,2,X.lg(0,56,0,188,['#2a6ac8','#1f5aa8','#1a4a90']));const c=A.c;c.strokeStyle='#ffffff';c.lineWidth=1.5;c.strokeRect(71,57,178,130);c.fillStyle='rgba(255,255,255,.8)';c.fillRect(159.5,57,1,130);
  c.fillStyle='rgba(20,20,30,.5)';c.fillRect(64,119,192,5);c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.5;c.beginPath();for(let x=66;x<254;x+=3){c.moveTo(x,119);c.lineTo(x,124);}c.stroke();c.fillStyle='#f0f0f0';c.fillRect(64,118,192,1.5);c.fillStyle='#333';c.fillRect(62,116,3,9);c.fillRect(255,116,3,9);};
 g.draw=()=>{X.cache('tt_bg',bg);const c=A.c;
  tr.forEach((q,i)=>{c.globalAlpha=.3*(1-i/8);X.disc(q[0],q[1],3-i*.25,'#fff3d6');});c.globalAlpha=1;X.shadow(b.x+3,b.y+5,3,1.5,.35);X.orb(b.x,b.y,3.5,'#fff8e8');
  [0,1].forEach(i=>{const y=i?44:196,s=hitT[i]*.06;c.save();c.translate(bat[i],y);c.rotate((i?-1:1)*s);X.shadow(2,4,15,3,.3);c.fillStyle='#8a5c33';c.fillRect(-2.5,i?-14:4,5,10);X.ell(0,0,15,5,X.lg(0,-5,0,5,[X.lt(i?'#e83a4a':'#2a2a3a',1.4),i?'#e83a4a':'#2a2a3a']));X.ell(0,-1,12,3,'rgba(255,255,255,.12)');c.restore();});
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);if(b.spin)X.ot(b.spin>0?'TOPSPIN':'BACKSPIN',160,210,K.y,1,'c');};
 return g;}});

A.add({id:'cornhole',name:'CORNHOLE',cat:'SPORTS',vs:1,how:'UP/DOWN AIM, A LOCKS POWER. HOLE = 3, BOARD = 1. FIRST TO 21.',make(){
 const g={over:null,score:0},fx=X.fx();let p=0,n=0,ang=.8,pw=0,ph=0,t=0,bag=null,bags=[],sc=[0,0],rd=[0,0],msg='',mt=0;
 const HX=250,HY=150;g.update=()=>{t++;if(mt>0)mt--;
  if(bag){bag.vy+=.2;bag.x+=bag.vx;bag.y+=bag.vy;bag.r+=.15;if(bag.y>=bag.gy){const onB=bag.x>225&&bag.x<285;if(onB&&Math.hypot(bag.x-HX,(bag.y-HY)*2)<9){rd[p]+=3;msg='IN THE HOLE!';S('score');fx.spark(HX,HY,K.y,14,2.5);fx.ring(HX,HY,'#ffffff',18);}else if(onB){rd[p]+=1;bags.push({x:bag.x,y:bag.gy,o:p,r:bag.r});msg='ON THE BOARD';S('hit');fx.spark(bag.x,bag.gy,'#e8c890',5,1.5);}else{msg='MISS';S('lose');fx.debris(bag.x,bag.gy,'#5aa040',5,1.5);}mt=40;bag=null;n++;p=1-p;ph=0;t=0;
    if(n>=8){const d=rd[0]-rd[1];if(d>0)sc[0]+=d;else sc[1]-=d;rd=[0,0];n=0;bags=[];if(sc[0]>=21||sc[1]>=21)g.over=A.win(sc[0]>=21?0:1);}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));if(ph===0){if(cpu){if(t>30){ang=.8+rnd(.1)-.05;ph=1;t=0;}}else{ang=cl(ang-ay(k)*.02,.3,1.3);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.08);let want=null;if(cpu){let best=0,bd=1e9;for(let w=0;w<=1;w+=.02){let x=50,y=180,vx=Math.cos(ang)*(3+w*5),vy=-Math.sin(ang)*(3+w*5);while(y<180||vy<0){vy+=.2;x+=vx;y+=vy;}const d=Math.abs(x-HX);if(d<bd){bd=d;best=w;}}want=cl(best+(rnd(.12)-.06)*(2-A.ai*1.6),0,1);}
   if(cpu?(Math.abs(pw-want)<.03||t>140):h.a){const w=cpu?want:pw;bag={x:50,y:180,vx:Math.cos(ang)*(3+w*5),vy:-Math.sin(ang)*(3+w*5),gy:180,r:0};S('shoot');}}};
 const bg=()=>{X.sky(['#3a8ae0','#a8d8f8'],160);for(let i=0;i<4;i++){X.disc(40+i*80,40+(i%2)*16,9,'rgba(255,255,255,.9)');X.disc(52+i*80,36+(i%2)*16,11,'rgba(255,255,255,.9)');}const c=A.c;for(let x=0;x<W;x+=14){c.fillStyle=X.lg(x,0,x+12,0,['#c8a070','#e8c090']);c.fillRect(x,120,12,42);X.poly([[x,120],[x+6,114],[x+12,120]],'#e8c090');}c.fillStyle='rgba(0,0,0,.15)';c.fillRect(0,132,W,2);c.fillRect(0,150,W,2);
  X.turf(0,160,W,80,'#4a9a3a','#55a844',16);X.shadow(256,178,34,5,.35);X.poly([[225,174],[285,174],[280,140],[230,140]],X.lg(0,140,0,174,['#e8c890','#c4915a']));X.poly([[225,174],[285,174],[285,180],[225,180]],'#8a5c33');c.strokeStyle='rgba(120,70,20,.4)';c.beginPath();c.moveTo(227,160);c.lineTo(283,160);c.stroke();X.ell(HX,HY,7.5,4.5,'#3a2410');X.ell(HX,HY+.5,6.5,3.6,'#0a0604');c.fillStyle='#ff4f6d';c.fillRect(250,164,2,2);};
 const bagD=(x,y,o,r)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(r||0);X.rr(-5.5,-4,11,8,3,X.lg(0,-4,0,4,[X.lt(PC[o],1.3),PC[o],X.lt(PC[o],.6)]));c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=.5;c.setLineDash&&c.setLineDash([1,1]);c.strokeRect(-4,-2.5,8,5);c.setLineDash&&c.setLineDash([]);c.restore();};
 g.draw=()=>{X.cache('corn_bg',bg);bags.forEach(b=>bagD(b.x,b.y-3,b.o,b.r*.1));if(bag){X.shadow(bag.x,182,5,1.5,.25);bagD(bag.x,bag.y,p,bag.r);}
  A.person(50,190,{s:1.05,c:PC[p],pants:'#2a2a4a',d:1,id:p*3+2,arm2:ph===1?-2.3:bag?-1.2:.2});
  if(!bag){A.c.globalAlpha=.8;for(let i=1;i<8;i++)X.disc(50+Math.cos(ang)*i*10,180-Math.sin(ang)*i*10,1.6-i*.12,'#ffffff');A.c.globalAlpha=1;if(ph===1)pb4(10,60,pw);}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);X.panel(120,20,80,14,'#ffffff');T('ROUND '+rd[0]+' - '+rd[1],160,24,K.w,1,'c');if(mt)X.ot(msg,160,60,msg==='MISS'?K.r:K.y,2,'c');};
 return g;}});

A.add({id:'javelin',name:'JAVELIN',cat:'SPORTS',how:'TAP LEFT/RIGHT TO RUN. HOLD A TO SET ANGLE, RELEASE BEFORE THE LINE. 3 THROWS.',make(){
 const g={over:null,score:0},fx=X.fx();let q={p:0,v:0,last:''},ang=0,jav=null,tries=3,msg='',mt=0,best=0,hold=false,marks=[];
 g.update=()=>{if(mt>0){if(--mt===0){if(tries<=0){g.over=best.toFixed(1)+' M';return;}q={p:0,v:0,last:''};jav=null;ang=0;}return;}
  if(jav){jav.vy+=.08;jav.x+=jav.vx;jav.y+=jav.vy;if(jav.y>=0){const d=jav.foul?0:(jav.x-200)/4;msg=jav.foul?'FOUL':d.toFixed(1)+' M';if(!jav.foul){best=Math.max(best,d);g.score=Math.round(best*10);marks.push(jav.x);}tries--;mt=80;S(jav.foul?'lose':'score');jav.land=true;fx.debris(160,172,'#6a4a20',6,1.5);}return;}
  tapRace(0,q);q.p+=q.v*.5;if(A.in(0).a&&q.p>120){hold=true;ang=Math.min(.9,ang+.02);}else if(hold||q.p>210){hold=false;jav={x:q.p,y:-20,vx:q.v*1.2,vy:-Math.sin(ang)*q.v*1.3,foul:q.p>200};S('shoot');}};
 g.draw=()=>{const c=A.c,cam=jav?Math.max(0,jav.x-160):0;X.cache('jav_sky',()=>{X.sky(['#3a8ae0','#a8d8f8'],100);A.c.fillStyle='#3a3a48';A.c.fillRect(0,100,W,58);crowd4(104,156,7,.55);A.c.fillStyle='#e8e8f0';A.c.fillRect(0,156,W,2);});
  X.turf(0,158,W,82,'#3a9a3a','#45a845',20,true);c.fillStyle='#c4552d';c.fillRect(0,196,Math.max(0,204-cam),44);c.fillStyle='#ffffff';c.fillRect(200-cam,158,3,82);for(let m=10;m<=100;m+=10){const x=200+m*4-cam;if(x>0&&x<W-16){c.fillStyle='rgba(255,255,255,.45)';c.fillRect(x,160,1,80);X.ot(m,x+2,164,K.w,1);}}
  marks.forEach(x=>{const xx=x-cam;if(xx>-5&&xx<W+5){c.fillStyle='#ff4f6d';c.fillRect(xx-.5,160,1,10);X.poly([[xx,160],[xx+6,162],[xx,164]],'#ff4f6d');}});
  if(jav){const a=jav.land?.6:Math.atan2(jav.vy,jav.vx),x=jav.x-cam,y=170+jav.y;X.shadow(x,172,10,1.5,.2);X.stroke([[x-Math.cos(a)*18,y-Math.sin(a)*18],[x+Math.cos(a)*16,y+Math.sin(a)*16]],'#e8d8b0',1.8);X.stroke([[x+Math.cos(a)*12,y+Math.sin(a)*12],[x+Math.cos(a)*18,y+Math.sin(a)*18]],'#c8c8d8',1.6);X.stroke([[x-Math.cos(a)*2,y-Math.sin(a)*2],[x+Math.cos(a)*2,y+Math.sin(a)*2]],'#ff4f6d',2.4);if(!jav.land)A.person(Math.min(q.p,200)-cam,196,{s:1.05,c:'#2fd6c3',pants:'#222',d:1,id:2,arm2:-2.4});}
  else{A.person(q.p-cam,196,{s:1.05,c:'#2fd6c3',pants:'#222',d:1,id:2,st:q.p*.26,arm2:-2.6+ang});X.stroke([[q.p-cam-12,174+Math.sin(ang)*14],[q.p-cam+14,174-Math.sin(ang)*14]],'#e8d8b0',1.8);if(hold)X.ot('ANGLE '+(ang*57|0),160,40,K.w,2,'c');}
  fx.draw();X.bar('THROWS '+tries,'BEST '+best.toFixed(1)+' M');X.meter(110,22,100,5,Math.min(1,q.v/4.5),'#ff9838');if(mt)X.ot(msg,160,60,msg==='FOUL'?K.r:K.y,3,'c');};
 return g;}});

A.add({id:'bocce',name:'BOCCE',cat:'SPORTS',vs:1,how:'UP/DOWN AIM, A LOCKS POWER. CLOSEST TO THE JACK SCORES. FIRST TO 7.',make(){
 const g={over:null,score:0},fx=X.fx();let balls=[],jack,p=0,n=0,ph=0,t=0,aim=0,pw=0,live=null,sc=[0,0],msg='',mt=0;const rs=()=>{balls=[];jack={x:200+rnd(60),y:90+rnd(60)};n=0;};rs();
 g.update=()=>{t++;if(mt>0){mt--;return;}if(live){live.x+=live.vx;live.y+=live.vy;live.vx*=.975;live.vy*=.975;const all=[...balls,jack];for(const o of all){const dx=o.x-live.x,dy=o.y-live.y,d=Math.hypot(dx,dy),rr=o===jack?8:12;if(d<rr&&d>0){const nx=dx/d,ny=dy/d,rv=live.vx*nx+live.vy*ny;if(rv>0){o.vx=(o.vx||0)+rv*nx*.9;o.vy=(o.vy||0)+rv*ny*.9;live.vx-=rv*nx;live.vy-=rv*ny;S('hit');fx.spark((o.x+live.x)/2,(o.y+live.y)/2,'#ffffff',5,1.8);}}}
   all.forEach(o=>{if(o.vx){o.x+=o.vx;o.y+=o.vy;o.vx*=.95;o.vy*=.95;if(Math.abs(o.vx)<.02)o.vx=o.vy=0;}});if(live.y<30||live.y>210)live.vy*=-1;if(live.x>305)live.vx*=-1;if(A.t%4===0&&Math.hypot(live.vx,live.vy)>.5)fx.spark(live.x,live.y+4,'#d8c090',1,.8);
   if(Math.hypot(live.vx,live.vy)<.05){balls.push(live);live=null;n++;const dist=o=>Math.hypot(o.x-jack.x,o.y-jack.y);const near=[0,1].map(i=>Math.min(...balls.filter(b=>b.o===i).map(dist),999));p=n>=8?0:near[p]<near[1-p]?1-p:p;if(balls.filter(b=>b.o===p).length>=4)p=1-p;ph=0;t=0;
    if(n>=8){const w=near[0]<near[1]?0:1,pts=balls.filter(b=>b.o===w&&dist(b)<near[1-w]).length;sc[w]+=pts;msg=A.nm(w)+' +'+pts;mt=90;S('score');fx.ring(jack.x,jack.y,PC[w],40,20);if(sc[w]>=7)g.over=A.win(w);else rs();}}return;}
  const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));const ang0=Math.atan2(jack.y-120,jack.x-30);if(ph===0){if(cpu){if(t>30){aim=ang0+(rnd(.12)-.06)*(2-A.ai);ph=1;t=0;}}else{aim=cl(aim+ay(k)*.015,-.8,.8);if(h.a){ph=1;t=0;}}}
  else{pw=.5+.5*Math.sin(t*.07);const d=Math.hypot(jack.x-30,jack.y-120),want=cl(d/260+(rnd(.1)-.05)*(2-A.ai*1.5),0,1);if(cpu?Math.abs(pw-want)<.03||t>140:h.a){const P=cpu?want:pw,v=P*6.5;live={x:30,y:120,vx:Math.cos(aim)*v,vy:Math.sin(aim)*v,o:p};S('shoot');}}};
 const bg=()=>{X.turf(0,0,W,H,'#3a8a3a','#45963f',20);X.rr(16,24,303,192,4,X.lg(0,24,0,216,['#8a5c33','#5a3414']));X.rr(20,28,295,184,2,X.rg(160,120,20,160,120,200,['#e0c890','#d0b070','#b89858']));const c=A.c;c.fillStyle='rgba(120,90,40,.25)';for(let i=0;i<300;i++)c.fillRect(22+(i*67)%290,30+(i*41)%180,1.5,1);X.vignette(.3);};
 const ball=(b,col)=>{X.shadow(b.x+1.5,b.y+3,6.5,3.5,.35);X.disc(b.x,b.y,6.2,X.rg(b.x-2,b.y-2.5,.5,b.x,b.y,6.2,[X.lt(col,1.7),col,X.lt(col,.45)]));A.c.strokeStyle='rgba(255,255,255,.35)';A.c.lineWidth=.6;A.c.beginPath();A.c.arc(b.x,b.y,4,.4,2.4);A.c.stroke();};
 g.draw=()=>{X.cache('bocce_bg',bg);X.glow(jack.x,jack.y,10,'#ffffff',.25);X.shadow(jack.x+1,jack.y+2,4,2,.3);X.orb(jack.x,jack.y,3.8,'#f8f8f0');balls.forEach(b=>ball(b,b.o?'#d8306a':'#1a9a90'));if(live)ball(live,live.o?'#d8306a':'#1a9a90');
  if(!live&&!mt){A.c.globalAlpha=.8;for(let i=1;i<9;i++)X.disc(30+Math.cos(aim)*i*10,120+Math.sin(aim)*i*10,1.6-i*.1,'#3a2410');A.c.globalAlpha=1;ball({x:30,y:120},p?'#d8306a':'#1a9a90');if(ph===1)pb4(4,60,pw);}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);const w=(A.nm(p)+' THROWS').length*4+12;X.panel(160-w/2,216,w,11,PC[p]);T(A.nm(p)+' THROWS',160,219,PC[p],1,'c');if(mt)X.ot(msg,160,110,K.y,2,'c');};
 return g;}});

A.add({id:'rowing',name:'ROWING',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT TO ROW. FIRST ACROSS THE LINE WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:''},{p:0,v:0,last:''}],t=-90;
 g.update=()=>{t++;if(t<0)return;if(t===0)fx.flash('#ffffff',6);for(let i=0;i<2;i++){tapRace(i,r[i]);r[i].p+=r[i].v*.4;if(r[i].p>=800){g.over=A.win(i);S('win');}}};
 g.draw=()=>{const c=A.c,cam=Math.max(r[0].p,r[1].p)-120;X.cache('row_bg',()=>{X.sky(['#4a9ae0','#bfe6ff'],40);X.hills(40,10,'#4a9a4a',0,.03,2);X.vg(38,36,W,6,['#5aa040','#3a7a2a']);X.vg(0,42,W,198,['#2a8ac8','#1a6aa8','#14508a']);});
  c.fillStyle='rgba(255,255,255,.2)';for(let i=0;i<24;i++){const x=((i*47-cam*.9)%(W+40)+W+40)%(W+40)-20,y=50+(i*37)%180;c.fillRect(x,y+Math.sin(A.t*.05+i),14,1.2);}
  for(const y of[125,195]){for(let x=0;x<W+20;x+=10){const xx=((x-cam)%(W+20)+W+20)%(W+20)-10;X.disc(xx,y,1.8,(((x-cam)/10|0)%4)?'#ff9838':'#ffffff');}}
  const fl=800-cam+40;if(fl>-10&&fl<W+10){c.fillStyle='#ffffff';c.fillRect(fl,50,3,180);X.disc(fl,60,4,'#ff4f6d');X.disc(fl,220,4,'#ff4f6d');}
  r.forEach((q,i)=>{const x=q.p-cam+40,y=90+i*70,s=Math.sin(t*.3*(1+q.v)),col=PC[i];X.ell(x,y+6,36,5,'rgba(0,30,60,.3)');X.poly([[x-34,y],[x+34,y],[x+26,y+7],[x-26,y+7]],X.lg(0,y,0,y+7,[X.lt(col,1.3),col,X.lt(col,.6)]));c.fillStyle='rgba(255,255,255,.4)';c.fillRect(x-30,y,60,1);
   for(let j=-1;j<=1;j++){const rx=x+j*16,lean=s*3;A.person(rx-lean*.5,y+2,{s:.5,c:'#ffffff',pants:col,d:1,id:i*3+j+1,arm1:-1.3+s*.5,arm2:-1.3+s*.5});X.stroke([[rx-lean*.5+2,y-6],[rx-12+s*8,y+12]],'#c8a070',1.4);X.ell(rx-12+s*8,y+12,2.5,1,'#c8a070');}
   if(q.v>.6&&A.t%3===0)fx.spark(x-36,y+5,'#ffffff',2,1.2);X.ot(A.nm(i),cl(x-20,2,W-20),y-26,i?K.p:K.c,1);});
  fx.draw();X.ot(t<0?'READY...':(t/60).toFixed(1)+'S',160,8,K.w,2,'c');};
 return g;}});

A.add({id:'skate',name:'SPEED SKATE',cat:'SPORTS',vs:1,how:'TAP LEFT/RIGHT IN TURN. HOLD B ON THE BENDS OR YOU SLIDE.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:''},{p:0,v:0,last:''}],t=-90,slide=[0,0];const bend=p=>(p%400)>300;
 g.update=()=>{t++;slide=slide.map(v=>v?v-1:0);if(t<0)return;for(let i=0;i<2;i++){const q=r[i];tapRace(i,q);const hold=A.cpu&&i===1?Math.random()<.5+A.ai*.45:A.in(i).b;if(bend(q.p)&&!hold&&q.v>2){q.v*=.9;slide[i]=8;const a=(q.p%400)/400*6.283;fx.spark(160+Math.cos(a)*(110+i*20),130+Math.sin(a)*(60+i*20),'#ffffff',2,1.5);}q.p+=q.v*.4;if(q.p>=1200){g.over=A.win(i);S('win');}}};
 const bg=()=>{X.sky(['#1a2a4a','#2a4a7a']);for(let y=4;y<40;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){A.c.globalAlpha=.4;A.c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0'][((x|0)+y)%4];A.c.fillRect(x,y,4,4);}A.c.globalAlpha=1;X.ell(160,130,160,104,X.rg(160,130,20,160,130,160,['#ffffff','#e0eef8','#c8dcf0']));const c=A.c;c.strokeStyle='#8fb8d8';c.lineWidth=40;c.beginPath();if(c.ellipse)c.ellipse(160,130,120,70,0,0,6.283);c.stroke();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;for(const d of[-20,0,20]){c.beginPath();if(c.ellipse)c.ellipse(160,130,120+d,70+d,0,0,6.283);c.stroke();}c.fillStyle='#ffffff';c.fillRect(158,60+20,4,20);c.fillStyle='rgba(255,79,109,.5)';c.beginPath();if(c.ellipse)c.ellipse(160,130,140,90,0,-.9,-.1);c.lineTo(160,130);c.fill();};
 g.draw=()=>{X.cache('skate_bg',bg);r.forEach((q,i)=>{const a=(q.p%400)/400*6.283,rx=110+i*20,ry=60+i*20,x=160+Math.cos(a)*rx,y=130+Math.sin(a)*ry,tang=Math.atan2(Math.cos(a)*ry,-Math.sin(a)*rx);X.shadow(x,y+1,7,2,.3);A.c.save();A.c.translate(x,y);A.c.rotate(bend(q.p)?Math.cos(tang)*.3:0);A.person(0,0,{s:.7,c:PC[i],pants:'#222',st:q.p*.15,d:Math.cos(tang)>0?1:-1,id:i*3+1,cap:i?'#ffcf3f':'#ffffff'});A.c.restore();if(bend(q.p))X.ot('B',x,y-30,slide[i]?K.r:K.y,1,'c');});
  fx.draw();X.bar();T(A.nm(0)+' LAP '+Math.min(3,1+(r[0].p/400|0)),6,6,K.c,1);T(A.nm(1)+' LAP '+Math.min(3,1+(r[1].p/400|0)),W-6,6,K.p,1,'r');if(t<0)X.ot('READY',160,120,K.y,2,'c');};
 return g;}});

A.add({id:'horserace',name:'HORSE RACE',cat:'SPORTS',vs:1,how:'TAP A TO WHIP. TOO MUCH TIRES YOUR HORSE. WATCH THE STAMINA BAR.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:1,st:100,w:0},{p:0,v:1,st:100,w:0}],t=-90;
 g.update=()=>{t++;if(t<0)return;for(let i=0;i<2;i++){const q=r[i];if(q.w)q.w--;let whip=A.cpu&&i===1?(q.st>25+(1-A.ai)*15&&Math.random()<.05+A.ai*.04):A.hit(i).a;if(whip&&q.st>0){q.v+=.35;q.st-=7;q.w=8;if(!(A.cpu&&i===1))S('blip');}q.st=Math.min(100,q.st+.15);q.v+=((q.st>10?1.6:.9)-q.v)*.02;q.p+=q.v;if(A.t%5===0&&q.v>1.2)fx.spark(q.p-(Math.max(r[0].p,r[1].p)-160)+40-16,150+i*45+12,'#c8a070',1,1.2);if(q.p>=1500){g.over=A.win(i);S('win');}}};
 const bg=()=>{X.sky(['#4a9ae0','#bfe6ff'],60);A.c.fillStyle='#3a3a48';A.c.fillRect(0,50,W,40);crowd4(54,88,13,.55);X.vg(0,88,W,22,['#6aa84a','#4a8a3a']);X.vg(0,110,W,110,['#c8945a','#b07a40']);X.vg(0,220,W,20,['#5a9a4a','#3a7a2a']);};
 const horse=(x,y,col,silk,ph,whip)=>{const c=A.c,l1=Math.sin(ph)*5,l2=Math.sin(ph+3.14)*5;X.shadow(x,y+14,18,3,.3);c.strokeStyle=X.lt(col,.7);c.lineWidth=2.4;c.lineCap='round';for(const[lx,lp]of[[-12,l1],[-8,l2],[10,l2],[14,l1]]){c.beginPath();c.moveTo(x+lx,y+2);c.lineTo(x+lx+lp*.4,y+8);c.lineTo(x+lx+lp,y+14);c.stroke();}c.lineCap='butt';
  X.ell(x,y-2,17,7,X.lg(0,y-9,0,y+5,[X.lt(col,1.35),col,X.lt(col,.7)]));X.poly([[x+12,y-6],[x+20,y-18],[x+25,y-16],[x+18,y-2]],col);X.ell(x+24,y-15,6,3.4,col,.4);c.fillStyle='#1a1a1a';c.fillRect(x+13,y-18,6,2);X.stroke([[x-16,y-4],[x-24,y+2+l1*.3]],'#1a1a1a',2.5);X.disc(x+25,y-16,.9,'#111');
  A.person(x-1,y-6,{s:.55,c:silk,pants:'#f2f2f2',cap:silk,d:1,id:5,arm1:whip?-2.6:-1.2,arm2:-1.4});if(whip)X.stroke([[x-4,y-22],[x-16,y-30]],'#3a2a18',1);};
 g.draw=()=>{X.cache('horse_bg',bg);const c=A.c,cam=Math.max(r[0].p,r[1].p)-160;for(let x=-((cam%40)+40)%40;x<W;x+=40){c.fillStyle='#ffffff';c.fillRect(x,100,3,12);}c.fillStyle='#ffffff';c.fillRect(0,100,W,2);c.fillRect(0,222,W,2);const fl=1500-cam+40;if(fl>-10&&fl<W+10){for(let y=104;y<226;y+=6){c.fillStyle='#111';c.fillRect(fl,y,2,3);c.fillStyle='#fff';c.fillRect(fl,y+3,2,3);c.fillRect(fl+2,y,2,3);}}
  r.forEach((q,i)=>{horse(q.p-cam+40,150+i*45,i?'#5a3018':'#8a5428',PC[i],q.p*.12,q.w);});
  fx.draw();X.bar();r.forEach((q,i)=>{T(A.nm(i),i?W-6:6,4,PC[i],1,i?'r':'l');X.meter(i?W-70:6,11,64,5,q.st/100,q.st>30?'#3ddc84':'#ff4f6d');});if(t<0)X.ot('AND THEY\'RE OFF...',160,60,K.w,1,'c');};
 return g;}});

A.add({id:'goalie',name:'GOALKEEPER',cat:'SPORTS',how:'LEFT/RIGHT DIVE, UP JUMPS. SAVE THE SHOTS. 3 GOALS AND YOU\'RE OUT.',make(){
 const g={over:null,score:0},fx=X.fx();let k={x:160,y:180,vx:0,vy:0,air:0},ball=null,t=0,conc=0,msg='',mt=0,netS=0;const shot=()=>{const tx=90+rnd(140),ty=110+rnd(70),sp=35-Math.min(18,g.score);ball={x:160,y:236,z:0,tx,ty,t:0,T:sp,curve:rnd(2)-1};S('shoot');};
 g.update=()=>{t++;if(mt>0)mt--;if(netS)netS--;const K_=A.in(0);if(k.air<=0){k.vx=ax(K_)*3.2;if(A.hit(0).u){k.vy=-4.5;k.air=1;S('jump');}}k.x=cl(k.x+k.vx,80,240);if(k.air){k.vy+=.3;k.y+=k.vy;if(k.y>=180){k.y=180;k.air=0;k.vy=0;}}
  if(!ball){if(t%60===0)shot();return;}ball.t++;const f=ball.t/ball.T;ball.x=160+(ball.tx-160)*f+Math.sin(f*3.14)*ball.curve*20;ball.y=236+(ball.ty-236)*f;
  if(f>=.9&&!ball.done&&Math.abs(ball.x-k.x)<20&&ball.y>k.y-40&&ball.y<k.y+4){ball.done=1;g.score++;msg='SAVE!';mt=40;S('hit');fx.spark(ball.x,ball.y,'#ffffff',14,3);fx.ring(ball.x,ball.y,K.y,20);A.shake=3;ball=null;t=1;return;}
  if(f>=1){if(!ball.done){conc++;msg='GOAL';mt=40;S('lose');netS=20;fx.flash(K.r,8);if(conc>=3)g.over='3 CONCEDED';}ball=null;t=1;}};
 const bg=()=>{X.sky(['#0a1a3a','#1a3a7a'],100);crowd4(30,98,9,.55);for(const lx of[30,290]){X.glow(lx,26,30,'#ffffff',.4);}X.turf(0,100,W,140,'#1f7a3a','#26883f',14);X.vg(0,100,W,140,['rgba(0,0,0,.25)','rgba(255,255,255,.04)']);A.c.strokeStyle='rgba(255,255,255,.85)';A.c.lineWidth=1.2;A.c.beginPath();A.c.moveTo(40,192);A.c.lineTo(280,192);A.c.moveTo(60,192);A.c.lineTo(30,236);A.c.moveTo(260,192);A.c.lineTo(290,236);A.c.stroke();};
 g.draw=()=>{X.cache('goalie_bg',bg);const c=A.c,sw=netS?Math.sin(netS*.6)*2:0;c.fillStyle='rgba(255,255,255,.1)';c.fillRect(82,102,156,90);c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=.6;c.beginPath();for(let i=1;i<20;i++){c.moveTo(80+i*8+sw,102);c.lineTo(80+i*8,192);}for(let i=1;i<11;i++){c.moveTo(80,100+i*8);c.lineTo(240,100+i*8+sw);}c.stroke();X.vg(78,98,4,94,['#ffffff','#c8c8d0']);X.vg(238,98,4,94,['#ffffff','#c8c8d0']);X.hg(78,98,164,4,['#ffffff','#e0e0e8','#ffffff']);
  const dive=k.vx?Math.sign(k.vx)*(k.air?1.1:.5):0;X.shadow(k.x,182,10,2,.3);c.save();c.translate(k.x,k.y);c.rotate(dive);A.person(0,0,{s:1.15,c:'#ffcf3f',pants:'#222',d:1,id:7,arm1:-2.7,arm2:2.7});X.orb(-12,-34,3.2,'#3ddc84');X.orb(12,-34,3.2,'#3ddc84');c.restore();
  if(ball){const f=ball.t/ball.T,r=4+(1-f)*4;X.shadow(ball.x,236-(236-ball.ty)*f*.2+4,r,r*.3,.25);sb4(ball.x,ball.y,r,f*10);}
  fx.draw();X.bar('SAVES '+g.score,'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<3-conc?'#ff4f6d':'rgba(255,255,255,.15)');if(mt)X.ot(msg,160,60,msg==='GOAL'?K.r:K.y,3,'c');};
 return g;}});

A.add({id:'freethrow',name:'FREE THROW',cat:'SPORTS',how:'PRESS A TWICE: STOP THE AIM, THEN THE POWER. 20 SHOTS.',make(){
 const g={over:null,score:0},fx=X.fx();let ph=0,t=0,aim=0,pw=0,ball=null,n=0,msg='',mt=0,streak=0,net=0;
 g.update=()=>{t++;if(mt>0)mt--;if(net)net--;if(ball){ball.vy+=.2;ball.x+=ball.vx;ball.y+=ball.vy;ball.r+=.15;if(ball.vy>0&&Math.abs(ball.x-250)<9&&Math.abs(ball.y-90)<5&&!ball.done){ball.done=1;streak++;g.score+=streak>=3?3:2;msg=streak>=3?'ON FIRE +3':'SWISH +2';mt=40;S('score');net=20;fx.spark(250,95,streak>=3?K.o:'#ffffff',14,2.5);fx.ring(250,90,K.y,20);}if(ball.y>230){if(!ball.done){streak=0;msg='MISS';mt=40;S('lose');}ball=null;n++;ph=0;t=0;if(n>=20)g.over=g.score+' POINTS';}return;}
  if(ph===0){aim=Math.sin(t*.06);if(A.hit(0).a){ph=1;t=0;}}else{pw=.5+.5*Math.sin(t*.08);if(A.hit(0).a){const e=aim*.35,p=(pw-.62)*3;ball={x:70,y:170,vx:3.8+p*.4+e*.2,vy:-6.1-p*.6+e*.3,r:0};S('shoot');}}};
 const bg=()=>{X.sky(['#140c30','#2a1a50','#3a2050'],200);crowd4(60,140,3,.35);for(const lx of[60,160,260]){X.glow(lx,22,30,'#fff0c0',.35);X.disc(lx,22,3,'#fffbe8');}X.vg(0,200,W,40,['#d89a5a','#8a5428']);const c=A.c;c.fillStyle='rgba(0,0,0,.12)';for(let x=0;x<W;x+=14)c.fillRect(x,200,1,40);c.fillStyle='#fff';c.fillRect(0,200,W,1.5);X.vg(262,106,3,94,['#9aa0b0','#5a6070']);c.fillStyle='rgba(220,240,255,.35)';c.fillRect(258,56,16,50);c.strokeStyle='#fff';c.lineWidth=1;c.strokeRect(258,56,16,50);c.strokeRect(258,76,10,14);c.fillStyle='#ff6a3a';c.fillRect(256,90,4,2);};
 g.draw=()=>{X.cache('ft_bg',bg);const c=A.c,sw=net?Math.sin(net*.8)*2:0;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=.7;c.beginPath();for(let i=0;i<4;i++){c.moveTo(242+i*5,93);c.lineTo(244+i*4+sw,106);}for(let y=96;y<106;y+=4){c.moveTo(242+(y-90)*.2,y);c.lineTo(258-(y-90)*.2+sw,y);}c.stroke();X.vg(240,90,20,2.5,['#ff9a5a','#d0401a']);
  if(streak>=3)X.glow(70,180,26,'#ff8030',.4+.15*Math.sin(A.t*.3));A.person(70,200,{s:1.15,c:streak>=3?'#ff9838':'#2fd6c3',pants:'#222',d:1,id:2,num:streak>=3?'!':23,arm1:ball?-2.6:-2.3,arm2:ball?-2.6:-2.3});
  if(ball){c.save();c.translate(ball.x,ball.y);X.orb(0,0,6,'#ff8a2a');c.rotate(ball.r);c.strokeStyle='rgba(60,20,0,.7)';c.lineWidth=.6;c.beginPath();c.moveTo(-6,0);c.lineTo(6,0);c.moveTo(0,-6);c.lineTo(0,6);c.stroke();c.restore();if(streak>=3)X.glow(ball.x,ball.y,10,'#ff8030',.5);}
  else{X.orb(72,160,6,'#ff8a2a');X.panel(16,206,88,14,K.y);X.rr(20,210,80,6,3,'rgba(0,0,0,.5)');X.rr(57,209,6,8,2,'#3ddc84');c.fillStyle='#fff';c.fillRect(59+aim*39,208,2,10);if(ph===1){X.panel(5,57,16,106,'#ffffff');X.rr(8,60,10,100,4,'rgba(0,0,0,.4)');X.rr(9,158-pw*96,8,pw*96,3,X.lg(0,158,0,62,['#3ddc84','#ffcf3f','#ff4f6d']));c.fillStyle='#ffffff';c.fillRect(6,158-.62*96,14,1.5);}}
  fx.draw();X.bar('SCORE '+g.score,'SHOT '+Math.min(n+1,20)+'/20',streak>=2?'STREAK '+streak:'');if(mt)X.ot(msg,160,40,msg==='MISS'?K.r:K.y,2,'c');};
 return g;}});

A.add({id:'cricket',name:'CRICKET',cat:'SPORTS',how:'LEFT/RIGHT STEP, A SWINGS. TIME IT TO HIT THE GAPS. 3 WICKETS.',make(){
 const g={over:null,score:0},fx=X.fx();let bx=160,ball=null,t=0,sw=0,wk=3,msg='',mt=0,balls=0,fly=null,stumps=0;
 g.update=()=>{t++;if(mt>0)mt--;if(sw>0)sw--;if(stumps)stumps--;bx=cl(bx+ax(A.in(0))*1.5,130,190);if(A.hit(0).a&&sw===0)sw=14;
  if(fly){fly.x+=fly.vx;fly.y+=fly.vy;fly.vy+=.05;if(fly.y>200||fly.x<0||fly.x>W){fly=null;}return;}
  if(!ball){if(t>60){ball={z:0,x:160+rnd(40)-20,v:.012+balls*.0004+rnd(.004),sw:rnd(.6)-.3};t=0;}return;}ball.z+=ball.v;ball.x+=ball.sw;
  if(ball.z>.85&&ball.z<.97&&sw>6&&Math.abs(ball.x-bx)<22){const q=1-Math.abs(ball.z-.91)/.06,runs=q>.8?6:q>.5?4:q>.25?2:1;g.score+=runs;msg=runs===6?'SIX!':runs===4?'FOUR!':runs+' RUN'+(runs>1?'S':'');mt=50;S(runs>=4?'score':'hit');fx.spark(ball.x,170,'#ffffff',10,2.5);if(runs===6)fx.flash('#ffffff',6);fly={x:ball.x,y:150,vx:(rnd(2)-1)*4,vy:-2-q*3};ball=null;balls++;t=0;return;}
  if(ball.z>=1){if(Math.abs(ball.x-160)<10){wk--;msg='BOWLED!';S('boom');stumps=40;fx.debris(160,186,'#e8e0c8',10,2.5);fx.flash(K.r,6);if(wk<=0)g.over='ALL OUT FOR '+g.score;}else msg='DOT BALL';mt=40;ball=null;balls++;t=0;}};
 const bg=()=>{X.sky(['#3a8ae0','#a8d8f8'],H);A.c.fillStyle='#3a3a48';A.c.fillRect(0,24,W,60);crowd4(28,80,21,.55);X.disc(160,300,260,X.rg(160,200,20,160,300,260,['#7ac85a','#5aa840','#3a8a2a']));const c=A.c;for(let i=0;i<12;i++){c.fillStyle='rgba(255,255,255,.06)';c.beginPath();c.moveTo(160,240);c.lineTo(160+Math.cos(-3.14+i*.26)*300,240+Math.sin(-3.14+i*.26)*300);c.lineTo(160+Math.cos(-3.14+i*.26+.13)*300,240+Math.sin(-3.14+i*.26+.13)*300);c.closePath();c.fill();}
  X.poly([[140,40],[180,40],[210,236],[110,236]],X.lg(0,40,0,236,['#d8c08a','#c4a56a']));c.fillStyle='rgba(255,255,255,.8)';c.fillRect(130,176,60,1.5);c.fillRect(146,52,28,1);};
 g.draw=()=>{X.cache('crk_bg',bg);const c=A.c;
  A.person(160,52,{s:.55,c:'#ff4f9a',pants:'#f2f2f2',d:1,id:3,arm2:ball&&ball.z<.1?-2.8:.2});
  for(let i=0;i<3;i++){const fall=stumps?(i-1)*Math.min(1,(40-stumps)*.08):0;c.save();c.translate(155.5+i*4,204);c.rotate(fall);c.fillStyle=X.lg(-1,0,1,0,['#c8b890','#f8f0d0']);c.fillRect(-1,-24,2.2,24);c.restore();}if(!stumps){c.fillStyle='#e8d8b0';c.fillRect(153,179,14,1.5);}
  if(ball){const y=40+ball.z*150,s=2+ball.z*5;X.shadow(ball.x,y+s+2,s,s*.3,.25);X.orb(ball.x,y,s,'#c8202a');}if(fly){X.glow(fly.x,fly.y,6,'#ffffff',.3);X.orb(fly.x,fly.y,3,'#c8202a');}
  const a=sw>0?-1.4+(14-sw)*.2:-2.2;A.person(bx,196,{s:1.05,c:'#f2f2f2',pants:'#f2f2f2',cap:'#2a4a8a',d:1,id:2,arm1:a+.3,arm2:a+.2});const hx=bx+5-Math.sin(a+.2)*10.5,hy=196-22+Math.cos(a+.2)*10.5;c.save();c.translate(hx,hy);c.rotate(a);X.rr(0,-2,24,4.5,1.5,X.lg(0,-2,0,2.5,['#f0d090','#c8a060']));c.restore();
  fx.draw();X.bar('RUNS '+g.score,'');for(let i=0;i<3;i++){c.fillStyle=i<wk?'#e8d8b0':'rgba(255,255,255,.15)';c.fillRect(W-12-i*10,4,2,10);c.fillRect(W-9-i*10,4,2,10);}if(mt)X.ot(msg,160,110,msg==='BOWLED!'?K.r:K.y,3,'c');};
 return g;}});
})();
