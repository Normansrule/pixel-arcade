(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0);
const human=p=>A.two?p:0; /* which input a human seat uses */

/* ---- BOWLING 3D ---- */
A.add({id:'bowling',name:'BOWLING 3D',cat:'SPORTS',vs:1,how:'LEFT AND RIGHT TO LINE UP, THEN PRESS A THREE TIMES:|SET POSITION, LOCK THE ANGLE, LOCK THE POWER. 5 FRAMES.',make(){
 const g={over:null,score:0},NF=5;let rolls=[[],[]],p=0,fr=0,rl=0,ph='pos',ball,pins,t=0,down0=0,msg='',mt=0;
 const pr=(x,d)=>{const s=1/(1+d*.22);return[160+x*80*s,228-(1-s)*205,s];};
 const rack=()=>{pins=[];for(let r=0;r<4;r++)for(let j=0;j<=r;j++)pins.push({x:(j-r/2)*.36,d:15+r*.7,up:1,vx:0,vd:0,t:0});};
 const fresh=()=>{ball={x:0,d:0,ang:0,pow:0,spd:0};ph='pos';t=0;};rack();fresh();
 const total=a=>{let s=0,i=0;for(let f=0;f<NF&&i<a.length;f++){if(a[i]===10){s+=10+(a[i+1]||0)+(a[i+2]||0);i++;}else{const two=a[i]+(a[i+1]||0);s+=two+(two===10?(a[i+2]||0):0);i+=2;}}return s;};
 const knock=(q,nx,nd,sp)=>{q.up=0;q.vx=nx*sp;q.vd=Math.abs(nd)*sp+sp*.4;q.t=26;S('hit');};
 g.update=()=>{t++;if(mt>0)mt--;const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));
  if(ph==='pos'){if(cpu){if(t>40){ball.x=rnd(.3)-.15;ball.ang=(rnd(2)-1)*.035*(1.7-A.ai);ball.pow=.6+rnd(.4);ph='roll';ball.spd=.13+ball.pow*.1;S('shoot');}}else{ball.x=cl(ball.x+ax(k)*.02,-.8,.8);if(h.a&&t>10){ph='aim';t=0;}}}
  else if(ph==='aim'){ball.ang=Math.sin(t*.07)*.07;if(h.a){ph='pow';t=0;}}
  else if(ph==='pow'){ball.pow=.5+.5*Math.sin(t*.09-1.57);if(h.a){ph='roll';ball.spd=.13+ball.pow*.1;S('shoot');}}
  else if(ph==='roll'){ball.d+=ball.spd;ball.x+=ball.ang*ball.spd*3;const gut=Math.abs(ball.x)>1;if(gut){ball.x=ball.x>0?1.1:-1.1;ball.ang=0;}
   if(!gut)for(const q of pins)if(q.up){const dx=q.x-ball.x,dd=q.d-ball.d,m=Math.hypot(dx,dd);if(m<.27){knock(q,dx/m,dd/m,ball.spd*.9);ball.ang-=dx/m*.012;}}
   if(ball.d>19){ph='settle';t=0;}}
  if(ph==='roll'||ph==='settle')for(const q of pins)if(q.t>0){q.t--;q.x+=q.vx;q.d+=q.vd;q.vx*=.93;q.vd*=.93;for(const o of pins)if(o.up){const dx=o.x-q.x,dd=o.d-q.d,m=Math.hypot(dx,dd);if(m<.2)knock(o,dx/m,dd/m,Math.hypot(q.vx,q.vd)*.85);}}
  if(ph==='settle'&&t>55){const got=pins.filter(q=>!q.up).length,dn=down0+got;rolls[p].push(got);
   let endFrame=false;if(rl===0&&dn===10){msg='STRIKE!';endFrame=true;}else if(rl===1){msg=dn===10?'SPARE!':got+' DOWN';endFrame=true;}else msg=got?got+' DOWN':'GUTTER!';mt=70;if(dn===10)S('score');
   if(endFrame){rl=0;down0=0;rack();if(p===1){fr++;p=0;}else p=1;if(fr>=NF){const a=total(rolls[0]),b=total(rolls[1]);g.over=a===b?'DRAW!':A.win(a>b?0:1);}}else{rl=1;down0=dn;pins=pins.filter(q=>q.up);}
   fresh();}};
 g.draw=()=>{A.cls('#1a1238');A.poly([pr(-1.25,0),pr(1.25,0),pr(1.25,19),pr(-1.25,19)].map(v=>[v[0],v[1]]),'#3a2a18',1);A.poly([pr(-1,0),pr(1,0),pr(1,19),pr(-1,19)].map(v=>[v[0],v[1]]),'#d9a55b',1);
  for(let i=-2;i<=2;i++){const a=pr(i*.35,4),b=pr(i*.35,5);L(a[0],a[1],b[0],b[1],'#7a4f1d');}
  pins.slice().sort((a,b)=>b.d-a.d).forEach(q=>{const v=pr(q.x,Math.min(q.d,19)),s=v[2];if(q.up){R(v[0]-5*s,v[1]-34*s,10*s,34*s,K.w);R(v[0]-5*s,v[1]-24*s,10*s,4*s,K.r);}else R(v[0]-14*s,v[1]-6*s,28*s,8*s,K.gr);});
  if(ball.d<19){const v=pr(ball.x,ball.d);C(v[0],v[1]-14*v[2],14*v[2],p?K.p:K.c);}
  if(ph==='aim'||ph==='pos'){const a=pr(ball.x,0),b=pr(ball.x+ball.ang*15,5);L(a[0],a[1]-8,b[0],b[1],K.y);}
  if(ph==='pow'||ph==='aim'){A.box(8,80,10,100,K.w);R(10,178-ball.pow*96,6,ball.pow*96,K.r);T('POWER',4,184,K.gr);}
  T(A.nm(0)+' '+total(rolls[0]),6,4,K.c,2);T(total(rolls[1])+' '+A.nm(1),W-6,4,K.p,2,'r');T('FRAME '+Math.min(fr+1,NF)+'/'+NF,160,4,K.w,1,'c');T(A.nm(p)+' BOWLS',160,12,p?K.p:K.c,1,'c');
  if(ph==='pos'&&!(A.cpu&&p===1))T('LINE UP, THEN PRESS A',160,50,K.y,1,'c');if(mt>0)T(msg,160,30,K.y,3,'c');};
 return g;}});

/* ---- MINI GOLF ---- */
A.add({id:'golf',name:'MINI GOLF',cat:'SPORTS',low:1,how:'LEFT AND RIGHT AIM. HOLD A TO CHARGE, RELEASE TO PUTT.|SIX HOLES. FEWEST STROKES WINS.',make(){
 const g={over:null,score:0};const HO=[{s:[40,125],c:[280,125],w:[]},{s:[40,125],c:[280,125],w:[[150,70,20,110]]},{s:[40,200],c:[280,50],w:[[100,24,16,130],[200,100,16,130]]},{s:[40,50],c:[280,200],w:[[90,90,140,16],[90,150,16,80]]},{s:[30,125],c:[290,125],w:[[80,24,14,90],[80,140,14,90],[160,80,14,100],[235,24,14,90],[235,140,14,90]]},{s:[40,40],c:[160,125],w:[[110,80,100,12],[110,160,100,12],[110,80,12,92]]}];
 let hi=0,b,ang=0,pow=0,chg=false,st=0,ht,wait=0;const load=()=>{ht=HO[hi];b={x:ht.s[0],y:ht.s[1],vx:0,vy:0};ang=Math.atan2(ht.c[1]-b.y,ht.c[0]-b.x);st=0;};load();
 const inW=(x,y)=>x<13||x>W-13||y<27||y>H-13||ht.w.some(w=>x>w[0]-3&&x<w[0]+w[2]+3&&y>w[1]-3&&y<w[1]+w[3]+3);
 const next=()=>{hi++;if(hi>=HO.length)g.over='COURSE CLEAR!';else load();};
 g.update=()=>{if(wait>0){if(--wait===0)next();return;}const k=A.in(0),mv=Math.hypot(b.vx,b.vy)>.05;
  if(!mv){b.vx=b.vy=0;ang+=ax(k)*.035;if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;b.vx=Math.cos(ang)*(1+pow*6);b.vy=Math.sin(ang)*(1+pow*6);st++;g.score++;S('hit');}}
  else{b.x+=b.vx;if(inW(b.x,b.y)){b.x-=b.vx;b.vx*=-.8;S('blip');}b.y+=b.vy;if(inW(b.x,b.y)){b.y-=b.vy;b.vy*=-.8;S('blip');}b.vx*=.982;b.vy*=.982;
   if(Math.hypot(b.x-ht.c[0],b.y-ht.c[1])<6&&Math.hypot(b.vx,b.vy)<3.2){b.x=ht.c[0];b.y=ht.c[1];b.vx=b.vy=0;wait=50;S('score');return;}
   if(Math.hypot(b.vx,b.vy)<=.05&&st>=8){wait=40;}}};
 g.draw=()=>{A.cls('#5b3a1e');R(10,24,W-20,H-34,'#2e9e57');ht.w.forEach(w=>{R(w[0],w[1],w[2],w[3],'#5b3a1e');A.box(w[0],w[1],w[2],w[3],'#8a5c33');});
  C(ht.c[0],ht.c[1],5,K.k);R(ht.c[0],ht.c[1]-18,1,18,K.w);R(ht.c[0]+1,ht.c[1]-18,8,5,K.r);C(b.x,b.y,3,K.w);
  if(Math.hypot(b.vx,b.vy)<=.05&&!wait){for(let i=1;i<=5;i++)C(b.x+Math.cos(ang)*i*7,b.y+Math.sin(ang)*i*7,1,K.y);if(chg){A.box(b.x-16,b.y+8,32,5,K.w);R(b.x-15,b.y+9,30*pow,3,K.r);}}
  T('HOLE '+(hi+1)+'/6',6,6,K.w,2);T('STROKES '+st+'   TOTAL '+g.score,W-6,8,K.y,1,'r');if(wait>0)T(b.x===ht.c[0]?'IN THE CUP!':'STROKE LIMIT',160,100,K.y,2,'c');};
 return g;}});

/* ---- BOXING ---- */
A.add({id:'boxing',name:'RING BOXING',cat:'SPORTS',vs:1,how:'LEFT AND RIGHT MOVE. A PUNCHES. HOLD B TO BLOCK.|KNOCK OUT OR LEAD AFTER 60 SECONDS.',make(){
 const g={over:null,score:0};let f=[{x:110,hp:100,pt:0,st:0},{x:210,hp:100,pt:0,st:0}],time=3600;
 g.update=()=>{time--;
  if(A.cpu){const q=f[1],d=q.x-f[0].x;A.bot({l:d>32||(d>26&&Math.random()<.3),r:d<22||(q.hp<30&&Math.random()<.04),b:f[0].pt>4&&Math.random()<.5+A.ai*.45,a:d<=34&&f[0].pt===0&&Math.random()<.04+.07*A.ai});}
  for(let i=0;i<2;i++){const q=f[i],o=f[1-i],k=A.in(i);q.blk=k.b&&q.pt===0;if(q.st>0){q.st--;continue;}if(!q.blk)q.x+=ax(k)*1.6;
   if(A.hit(i).a&&q.pt===0&&!q.blk)q.pt=18;if(q.pt>0){q.pt--;if(q.pt===11&&Math.abs(q.x-o.x)<36){if(o.blk){o.hp-=1;S('blip');}else{o.hp-=7+rnd(4);o.st=10;o.x+=i?-6:6;S('hit');}}}}
  f[0].x=cl(f[0].x,40,W-64);f[1].x=cl(f[1].x,64,W-40);if(f[0].x>f[1].x-22){const m=(f[0].x+f[1].x)/2;f[0].x=m-11;f[1].x=m+11;}
  for(let i=0;i<2;i++)if(f[i].hp<=0){f[i].hp=0;g.over=A.win(1-i);return;}
  if(time<=0)g.over=Math.round(f[0].hp)===Math.round(f[1].hp)?'DRAW!':A.win(f[0].hp>f[1].hp?0:1);};
 g.draw=()=>{A.cls('#1a1238');R(20,190,W-40,30,'#3d6fb5');for(let i=0;i<3;i++)L(30,120+i*20,W-30,120+i*20,K.r);R(28,110,4,80,K.w);R(W-32,110,4,80,K.w);
  f.forEach((q,i)=>{const d=i?-1:1,y=190,col=i?K.p:K.c,hurt=q.st>0;R(q.x-7,y-44,14,24,hurt?K.w:col);R(q.x-5,y-56,10,11,'#ffd9a8');R(q.x-7,y-20,6,20,K.w);R(q.x+1,y-20,6,20,K.w);
   const ext=q.pt>8?(18-q.pt)*2.6:q.pt>0?q.pt*2.2:0;if(q.blk){R(q.x+d*6-3,y-54,7,14,K.r);}else{R(q.x+d*(8+ext)-3,y-42,7,7,K.r);R(q.x+d*7-3,y-34,7,7,K.r);}});
  f.forEach((q,i)=>{A.box(i?W-110:8,16,102,8,K.w);R(i?W-109+(100-q.hp):9,17,q.hp,6,q.hp>30?K.g:K.r);T(A.nm(i),i?W-8:8,6,i?K.p:K.c,1,i?'r':'l');});T(Math.ceil(time/60),160,10,K.w,2,'c');};
 return g;}});

/* ---- PENALTY KICKS 3D ---- */
A.add({id:'penalty',name:'PENALTY KICKS 3D',cat:'SPORTS',vs:1,how:'HOLD A DIRECTION BEFORE THE WHISTLE: LEFT, RIGHT, UP, OR NOTHING.|SHOOTER PICKS A CORNER, KEEPER PICKS A DIVE. 5 KICKS EACH.',make(){
 const g={over:null,score:0};let sc=[0,0],rd=0,ph='ready',t=0,sh,kp,res='',bot=null,log=[[],[]];
 const pick=()=>({hx:A.ri(3)-1,hy:A.ri(2)});
 g.update=()=>{t++;const s=rd%2,kI=1-s;if(A.cpu&&!bot)bot=pick();
  if(ph==='ready'&&t>=110){const rd_=i=>{if(A.cpu&&i===1)return bot;const k=A.in(human(i));return{hx:ax(k),hy:k.u?1:0};};sh=rd_(s);kp=rd_(kI);
   let miss=(sh.hy&&Math.random()<.18)?'OVER THE BAR!':(sh.hx&&Math.random()<.1)?'WIDE!':'';sh.tx=160+sh.hx*(miss==='WIDE!'?105:60)+rnd(10)-5;sh.ty=miss==='OVER THE BAR!'?58:sh.hy?96:128;
   const saved=!miss&&kp.hx===sh.hx&&(sh.hx===0||(sh.hy?kp.hy===1:(kp.hy===0||Math.random()<.5)));res=miss||(saved?'SAVED!':'GOAL!');ph='fly';t=0;S('shoot');}
  else if(ph==='fly'&&t>=36){ph='res';t=0;if(res==='GOAL!'){sc[s]++;S('score');}else S('hit');log[s].push(res==='GOAL!'?1:0);}
  else if(ph==='res'&&t>=70){rd++;ph='ready';t=0;bot=null;if(rd>=10&&rd%2===0&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);}};
 g.draw=()=>{A.cls('#2a5db0');R(0,120,W,120,'#1e8a45');for(let i=0;i<W;i+=8)R(i,100+((i/8)%3),6,18,['#c33','#36c','#eee'][(i/8)%3|0]);R(0,118,W,3,K.w);
  A.box(80,72,160,66,K.w);R(80,72,160,3,K.w);for(let i=1;i<10;i++)L(80+i*16,75,80+i*16,138,'rgba(255,255,255,.25)');for(let i=1;i<4;i++)L(80,72+i*16,240,72+i*16,'rgba(255,255,255,.25)');
  const s=rd%2,f=ph==='ready'?0:ph==='fly'?t/36:1;let kx=160,ky=138;if(ph!=='ready'){kx=160+kp.hx*52*f;ky=138-(kp.hy?26:kp.hx?6:0)*f;}
  const kc=(1-s)?K.p:K.c;if(ph!=='ready'&&kp.hx){R(kx-16,ky-14,32,12,kc);R(kx+kp.hx*16-4,ky-14,8,8,'#ffd9a8');}else{R(kx-7,ky-30,14,22,kc);R(kx-5,ky-40,10,10,'#ffd9a8');R(kx-16,ky-30,9,5,kc);R(kx+7,ky-30,9,5,kc);}
  let bx=160,by=212,br=7;if(ph!=='ready'){bx=160+(sh.tx-160)*f;by=212+(sh.ty-212)*f-Math.sin(f*3.14)*14;br=7-4*f;}C(bx,by,br,K.w);
  if(ph==='ready'){R(150,200,12,30,s?K.p:K.c);T(A.nm(s)+' SHOOTS   '+A.nm(1-s)+' IN GOAL',160,24,K.w,1,'c');T(t<70?'HOLD YOUR DIRECTION...':'WHISTLE!',160,36,K.y,2,'c');}
  if(ph==='res')T(res,160,36,K.y,3,'c');A.hud2(sc[0],sc[1]);log.forEach((a,i)=>a.slice(-8).forEach((v,j)=>R(i?W-10-j*7:6+j*7,18,5,5,v?K.g:K.r)));};
 return g;}});

/* ---- 100M DASH ---- */
A.add({id:'dash100',name:'100M DASH',cat:'SPORTS',vs:1,how:'TAP LEFT AND RIGHT IN TURN AS FAST AS YOU CAN.|TAPPING THE SAME KEY TWICE DOES NOTHING.',make(){
 const g={over:null,score:0};let r=[{p:0,v:0,last:'',fin:0},{p:0,v:0,last:'',fin:0}],t=-180;
 g.update=()=>{t++;if(t<0)return;if(t===0)S('shoot');
  for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){const tv=2.1+1.9*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.42;}q.v*=.965;}
   q.p+=q.v*.5;if(q.p>=1000){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 g.draw=()=>{A.cls('#2a5db0');R(0,60,W,30,'#555');for(let i=0;i<W;i+=6)R(i,64+(i%4),4,20,['#c33','#eee','#36c','#ec3'][(i/6)%4|0]);R(0,90,W,150,'#c4552d');
  const cam=Math.max(r[0].p,r[1].p)-100;for(let m=0;m<=1000;m+=100){const x=m-cam+40;if(x>-20&&x<W+20){R(x,90,2,150,K.w);T(m/10+'M',x+4,94,K.w);}}
  r.forEach((q,i)=>{const x=q.p-cam+40,y=150+i*55,st=Math.floor(q.p/12)%2;R(0,y+4,W,1,K.w);R(x-5,y-22,10,14,i?K.p:K.c);R(x-4,y-31,8,8,'#ffd9a8');R(x-5+(st?4:-3),y-8,4,10,K.w);R(x+1+(st?-4:3),y-8,4,10,K.w);T(A.nm(i),6,y-30,i?K.p:K.c);});
  if(t<0)T(t<-120?'ON YOUR MARKS':t<-50?'SET':'...',160,30,K.y,3,'c');else T((t/60).toFixed(2)+' S',160,30,K.w,2,'c');};
 return g;}});

/* ---- HOME RUN DERBY ---- */
A.add({id:'homerun',name:'HOME RUN DERBY',cat:'SPORTS',how:'PRESS A TO SWING AS THE BALL CROSSES THE PLATE.|TEN PITCHES. 120 METRES OR MORE IS A HOME RUN.',make(){
 const g={over:null,score:0};let n=0,z=1,T_=60,cv=0,sw=0,ph='wait',t=0,msg='',hr=0,fly=null;
 const pitch=()=>{z=1;T_=34+rnd(34);cv=rnd(2)-1;ph='pitch';sw=0;fly=null;};
 g.update=()=>{t++;if(sw>0)sw--;
  if(ph==='wait'){if(t>70){if(n>=10){g.over=hr+' HOME RUNS';return;}n++;pitch();}}
  else if(ph==='pitch'){z-=1/T_;if(A.hit(0).a&&sw===0){sw=14;const off=Math.abs(z-.06);if(off<.1){const ql=1-off/.1,d=Math.round(45+ql*100*(.75+rnd(.35)));g.score+=d;msg=d>=120?'HOME RUN! '+d+'M':d+' METRES';if(d>=120){hr++;S('score');}else S('hit');fly={x:160,y:190,vx:(rnd(2)-1)*2,vy:-3-ql*3};ph='wait';t=0;return;}S('blip');}
   if(z<-.15){msg=sw?'SWING AND A MISS':'STRIKE!';ph='wait';t=0;S('lose');}}
  if(fly){fly.x+=fly.vx;fly.y+=fly.vy;}};
 g.draw=()=>{A.cls('#1a1238');R(0,90,W,150,'#1e8a45');A.poly([[160,230],[60,120],[160,95],[260,120]],'#c4915a',1);for(let i=0;i<W;i+=5)R(i,70+(i%3)*2,3,18,['#c33','#eee','#36c'][(i/5)%3|0]);R(0,88,W,3,'#0f5a2a');
  R(155,100,10,16,K.w);R(156,92,8,8,'#ffd9a8');A.poly([[152,206],[168,206],[168,212],[160,218],[152,212]],K.w,1);
  R(120,170,14,26,K.c);R(122,158,10,11,'#ffd9a8');const a=sw>0?-1.2+(14-sw)*.28:-2.2;L(134,178,134+Math.cos(a)*34,178+Math.sin(a)*34,K.y,3);
  if(ph==='pitch'){const f=1-z;C(160+cv*Math.sin(f*3.14)*26,108+f*f*100,1.5+f*5,K.w);}if(fly)C(fly.x,fly.y,3,K.w);
  T('PITCH '+n+'/10',6,6,K.w,2);T(g.score+' M',W-6,6,K.y,2,'r');T('HOME RUNS '+hr,W-6,20,K.g,1,'r');if(ph==='wait'&&msg)T(msg,160,40,K.y,2,'c');};
 return g;}});

/* ---- SKI SLALOM ---- */
A.add({id:'ski',name:'SKI SLALOM',cat:'SPORTS',how:'LEFT AND RIGHT STEER. PASS BETWEEN THE FLAGS FOR POINTS.|THREE CRASHES AND YOUR RUN IS OVER.',make(){
 const g={over:null,score:0};let x=160,vx=0,ob=[],dist=0,lives=3,inv=0,nextG=120,combo=0;
 g.update=()=>{const sp=2+Math.min(3.2,dist/2600);dist+=sp;vx=(vx+ax(A.in(0))*.5)*.88;x=cl(x+vx,10,W-10);if(inv>0)inv--;
  if(Math.random()<.05+dist/90000)ob.push({t:0,x:rnd(W),y:H+10});nextG-=sp;if(nextG<=0){nextG=130;ob.push({t:1,x:50+rnd(W-100),y:H+10,ok:0});}
  for(const o of ob){o.y-=sp;if(o.t===0&&inv===0&&Math.abs(o.x-x)<8&&Math.abs(o.y-64)<8){lives--;inv=70;vx=0;combo=0;S('boom');if(lives<=0)g.over='WIPEOUT!';}
   if(o.t===1&&!o.ok&&o.y<64){o.ok=1;if(Math.abs(o.x-x)<26){combo++;g.score+=10*combo;S('coin');}else combo=0;}}
  ob=ob.filter(o=>o.y>-20);if((dist|0)%10<sp)g.score++;};
 g.draw=()=>{A.cls('#eef4ff');for(let i=0;i<12;i++)R((i*53+17)%W,(i*71-dist*1)%H+(((i*71-dist)%H)<0?H:0),6,1,'#cfdcf2');
  ob.forEach(o=>{if(o.t===0){A.poly([[o.x,o.y-12],[o.x-7,o.y+2],[o.x+7,o.y+2]],'#1e8a45',1);R(o.x-1,o.y+2,3,4,'#5b3a1e');}else{[-26,26].forEach((d,i)=>{R(o.x+d,o.y-10,1,12,K.k);R(o.x+d+1,o.y-10,6,4,i?K.b:K.r);});}});
  if(inv%8<4){R(x-4,50,8,12,K.r);R(x-3,43,6,6,'#ffd9a8');L(x-5,58,x-5+vx*2,72,K.k,2);L(x+4,58,x+4+vx*2,72,K.k,2);}
  T('SCORE '+g.score,6,6,K.k,2);T('LIVES '+lives,W-6,6,K.r,2,'r');if(combo>1)T('GATE STREAK X'+combo,160,22,K.b,1,'c');};
 return g;}});

/* ---- ARCHERY ---- */
A.add({id:'archery',name:'ARCHERY',cat:'SPORTS',how:'PRESS A TO LOCK THE SIDEWAYS AIM, THEN AGAIN TO LOCK HEIGHT AND FIRE.|THE WIND PUSHES YOUR ARROW. SIX ARROWS.',make(){
 const g={over:null,score:0};let n=0,ph=0,t=0,cx=160,cy=110,wind=0,marks=[],msg='';const nw=()=>{wind=Math.round(rnd(28)-14);ph=0;t=rnd(100)|0;};nw();
 g.update=()=>{t++;const sp=.05+n*.012;if(ph===0){cx=160+Math.sin(t*sp)*70;if(A.hit(0).a){ph=1;t=rnd(100)|0;S('blip');}}
  else if(ph===1){cy=110+Math.sin(t*sp*1.2)*60;if(A.hit(0).a){const x=cx+wind,y=cy+rnd(4)-2,d=Math.hypot(x-160,y-110),p=d<6?10:d<13?8:d<21?6:d<30?4:d<40?2:0;g.score+=p;marks.push([x,y]);msg=p?'+'+p:'MISS';S(p>=8?'score':'hit');ph=2;t=0;}}
  else if(t>60){n++;if(n>=6)g.over='ROUND COMPLETE';else nw();}};
 g.draw=()=>{A.cls('#2a5db0');R(0,170,W,70,'#1e8a45');R(157,150,6,40,'#5b3a1e');[[40,K.w],[30,K.k],[21,K.b],[13,K.r],[6,K.y]].forEach(v=>C(160,110,v[0],v[1]));marks.forEach(m=>{C(m[0],m[1],1.5,K.g);});
  if(ph<2){L(cx,20,cx,200,'rgba(255,255,255,.5)');if(ph===1)L(60,cy,260,cy,'rgba(255,255,255,.5)');A.ring(cx,ph?cy:110,4,K.w);}
  T('ARROW '+Math.min(n+1,6)+'/6',6,6,K.w,2);T('SCORE '+g.score,W-6,6,K.y,2,'r');T('WIND '+(wind>0?'>> ':wind<0?'<< ':'')+Math.abs(wind),160,210,K.w,2,'c');if(ph===2)T(msg,160,30,K.y,3,'c');};
 return g;}});
})();
