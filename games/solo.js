(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};
const hsl=(h,s,l)=>'hsl('+(h%360)+','+s+'%,'+l+'%)';

/* ---- TOWER STACK ---- */
A.add({id:'stack',name:'TOWER STACK',cat:'CLASSICS',how:'A DROPS THE BLOCK. OVERHANG GETS CUT.',make(){
 const g={over:null,score:0},fx=X.fx();let base={x:110,w:100},cur={x:0,w:100,d:1},y=200,blocks=[],cam=0,perfect=0,chips=[],land=0;
 g.update=()=>{if(land)land--;chips.forEach(q=>{q.vy+=.25;q.y+=q.vy;q.x+=q.vx;q.r+=q.vr;});chips=chips.filter(q=>q.y+cam<H+40);
  cur.x+=cur.d*(1.6+g.score*.05);if(cur.x<0||cur.x+cur.w>W)cur.d*=-1;if(A.hit(0).a){const l=Math.max(cur.x,base.x),r=Math.min(cur.x+cur.w,base.x+base.w);if(r-l<4){g.over='TOPPLED';S('lose');chips.push({x:cur.x,y,w:cur.w,vx:cur.d,vy:-1,r:0,vr:.05*cur.d,h:g.score});return;}
  if(Math.abs(cur.x-base.x)<3){perfect++;cur.x=base.x;cur.w=base.w;if(perfect>2&&base.w<110){base.w+=4;cur.w=base.w;}S('coin');fx.ring(cur.x+cur.w/2,y+cam+5,'#ffffff',cur.w*.7,16);if(perfect>1)fx.pop(cur.x+cur.w/2,y+cam-14,'PERFECT x'+perfect,K.y);}
  else{perfect=0;if(cur.x<l)chips.push({x:cur.x,y,w:l-cur.x,vx:-1,vy:-1,r:0,vr:-.06,h:g.score});if(cur.x+cur.w>r)chips.push({x:r,y,w:cur.x+cur.w-r,vx:1,vy:-1,r:0,vr:.06,h:g.score});cur.x=l;cur.w=r-l;S('hit');}
  blocks.push({x:cur.x,w:cur.w,y,h:g.score});land=6;base={x:cur.x,w:cur.w};y-=10;g.score++;cur={x:cur.d>0?0:W-cur.w,w:cur.w,d:cur.d};}
  const t=Math.max(0,100-y);cam+=(t-cam)*.15;};
 const slab=(x,y,w,h,hue,a)=>{const c=A.c;if(a!==undefined)c.globalAlpha=a;c.fillStyle=hsl(hue,70,42);c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y-5);c.lineTo(x+w+6,y-5);c.lineTo(x+w,y);c.closePath();c.fill();c.fillStyle=hsl(hue,70,62);c.beginPath();c.moveTo(x,y);c.lineTo(x+6,y-5);c.lineTo(x+w+6,y-5);c.lineTo(x+w,y);c.closePath();c.fill();c.fillStyle=X.lg(0,y,0,y+h,[hsl(hue,75,58),hsl(hue,70,44)]);c.fillRect(x,y,w,h);c.fillStyle=hsl(hue,60,30);c.beginPath();c.moveTo(x+w,y);c.lineTo(x+w+6,y-5);c.lineTo(x+w+6,y+h-5);c.lineTo(x+w,y+h);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.25)';c.fillRect(x,y,w,1);c.globalAlpha=1;};
 g.draw=()=>{const k=cl(cam/600,0,1),c=A.c;c.fillStyle=X.lg(0,0,0,H,[A.mix('#5ab0ff','#0a0a2a',k),A.mix('#c8ecff','#3a2a6a',k)]);c.fillRect(0,0,W,H);if(k>.3){c.globalAlpha=(k-.3)*1.4;X.stars(60,4,0,-cam*.1,H,.9);c.globalAlpha=1;}
  for(let i=0;i<5;i++){const yy=((i*70+cam*.4)%400)-60;c.globalAlpha=.7*(1-k);X.disc((i*83)%W,yy,10,'#ffffff');X.disc((i*83)%W+12,yy-3,12,'#ffffff');X.disc((i*83)%W+24,yy,9,'#ffffff');c.globalAlpha=1;}
  X.hills(214+cam,30,'#5a9a5a',0,.02,2);X.vg(0,210+cam,W,40,['#7ac85a','#3a7a3a']);
  blocks.forEach(b=>{if(b.y+cam>-20&&b.y+cam<H+20)slab(b.x,b.y+cam+(land&&b===blocks[blocks.length-1]?-land*.3:0),b.w,10,b.h*12);});
  chips.forEach(q=>{c.save();c.translate(q.x+q.w/2,q.y+cam+5);c.rotate(q.r);slab(-q.w/2,-5,q.w,10,q.h*12,.9);c.restore();});
  if(!g.over){slab(cur.x,y+cam-1,cur.w,10,g.score*12);X.glow(cur.x+cur.w/2,y+cam+4,cur.w*.6,'#ffffff',.12);}
  fx.draw();X.ot(g.score,160,10,K.w,3,'c');if(perfect>1)X.ot('PERFECT X'+perfect,160,38,K.y,1,'c');};
 return g;}});

/* ---- SLIDE 15 ---- */
A.add({id:'slide',name:'SLIDE 15',cat:'PUZZLE',low:1,how:'ARROWS SLIDE A TILE INTO THE GAP. ORDER 1-15.',make(){
 const g={over:null,score:0},fx=X.fx();let b=[...Array(16).keys()].map(i=>(i+1)%16),an={i:-1,dx:0,dy:0};const gap=()=>b.indexOf(0);
 for(let i=0;i<300;i++){const e=gap(),ds=[e%4>0?e-1:-1,e%4<3?e+1:-1,e>3?e-4:-1,e<12?e+4:-1].filter(v=>v>=0),t=ds[ri(ds.length)];b[e]=b[t];b[t]=0;}
 g.update=()=>{an.dx*=.55;an.dy*=.55;const h=A.hit(0),e=gap();let t=-1;if(h.l&&e%4<3)t=e+1;if(h.r&&e%4>0)t=e-1;if(h.u&&e<12)t=e+4;if(h.d&&e>3)t=e-4;if(t>=0){b[e]=b[t];b[t]=0;an={i:e,dx:((t%4)-(e%4))*40,dy:(((t/4)|0)-((e/4)|0))*40};g.score++;S('blip');if(b[e]===e+1)fx.spark(80+(e%4)*40+19,40+((e/4)|0)*40+19,'#3ddc84',5,1.5);if(b.every((v,i)=>v===(i+1)%16)){g.over='SOLVED! WIN';S('win');}}};
 g.draw=()=>{X.cache('slidebg',()=>{X.vg(0,0,W,H,['#3a2418','#1e120a']);X.rr(72,32,176,176,8,X.lg(0,32,0,208,['#7a4a2a','#4a2a14']));X.rr(78,38,164,164,4,'#1a0e06');});const c=A.c;
  b.forEach((v,i)=>{if(!v)return;const x=80+(i%4)*40+(an.i===i?an.dx:0),y=40+((i/4)|0)*40+(an.i===i?an.dy:0),ok=v===i+1;c.fillStyle='rgba(0,0,0,.4)';c.fillRect(x+2,y+3,38,38);X.rr(x,y,38,38,4,X.lg(0,y,0,y+38,ok?['#b8f0a0','#6ac050','#3a8a2a']:['#f8d8a0','#e0a860','#a8743a']));c.fillStyle='rgba(0,0,0,.08)';for(let k=4;k<38;k+=6)c.fillRect(x+2,y+k,34,1);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+3,y+2,32,2);X.rrs(x+.5,y+.5,37,37,4,'rgba(60,30,10,.6)',1);T(v,x+19,y+13,ok?'#1a4a10':'#5a3010',2,'c',1);});
  fx.draw();X.bar('MOVES '+g.score,'',' ',K.w);T('IN PLACE '+b.filter((v,i)=>v===i+1).length+'/15',W-6,6,K.g,1,'r');};
 return g;}});

/* ---- PINBALL ---- */
A.add({id:'pinball',name:'PINBALL',cat:'CLASSICS',how:'A/LEFT + B/RIGHT FLIP. DOWN LAUNCHES.',make(){
 const g={over:null,score:0},fx=X.fx();let b=null,balls=3,fl=[0,0],fa=[0,0],tr=[],bumps=[{x:110,y:70,r:11},{x:190,y:70,r:11},{x:150,y:115,r:11},{x:70,y:130,r:8},{x:230,y:130,r:8}],pl=0;
 const launch=()=>{b={x:298,y:200,vx:0,vy:-9-rnd(1.5)};tr=[];};
 g.update=()=>{const k=A.in(0);fl[0]=(k.a||k.l)?1:0;fl[1]=(k.b||k.r)?1:0;fa=fa.map((v,i)=>v+((fl[i]?1:0)-v)*.5);if(!b){pl=k.d?Math.min(1,pl+.05):0;if(A.hit(0).d){launch();S('shoot');}return;}
  tr.unshift([b.x,b.y]);if(tr.length>7)tr.pop();
  b.vy+=.14;b.x+=b.vx;b.y+=b.vy;if(b.x>290){if(b.y<30){b.x=286;b.vx=-2;}else if(b.x>306){b.x=306;b.vx=-Math.abs(b.vx)*.5;}}
  if(b.x<9){b.x=9;b.vx=Math.abs(b.vx)*.8;}if(b.x>282&&b.x<290&&b.y>40){b.x=282;b.vx=-Math.abs(b.vx)*.8;}if(b.y<9){b.y=9;b.vy=Math.abs(b.vy)*.8;}
  for(const q of bumps){const dx=b.x-q.x,dy=b.y-q.y,d=Math.hypot(dx,dy);if(d<q.r+5){b.vx=dx/d*4.5;b.vy=dy/d*4.5;b.x=q.x+dx/d*(q.r+5);b.y=q.y+dy/d*(q.r+5);const pts=q.r>9?100:50;g.score+=pts;q.t=12;S('hit');fx.ring(q.x,q.y,'#ffffff',q.r+10,12);fx.spark(b.x,b.y,'#ffe080',6,2);fx.pop(q.x,q.y-q.r-8,'+'+pts,K.y);}if(q.t)q.t--;}
  [[9,150,90,200],[282,150,201,200]].forEach(w=>{const[x1,y1,x2,y2]=w,dx=x2-x1,dy=y2-y1,l=dx*dx+dy*dy,t=cl(((b.x-x1)*dx+(b.y-y1)*dy)/l,0,1),px=x1+dx*t,py=y1+dy*t,d=Math.hypot(b.x-px,b.y-py);if(d<5){const nx=(b.x-px)/d,ny=(b.y-py)/d;b.x=px+nx*5;b.y=py+ny*5;const dot=b.vx*nx+b.vy*ny;if(dot<0){b.vx-=1.8*dot*nx;b.vy-=1.8*dot*ny;}}});
  [[90,200,1,fl[0]],[201,200,-1,fl[1]]].forEach(f=>{const[fx_,fy,d,up]=f,a=up?-.55*d:.35*d,ex=fx_+d*40*Math.cos(a),ey=fy+40*Math.sin(a);const dx=ex-fx_,dy=ey-fy,l=dx*dx+dy*dy,t=cl(((b.x-fx_)*dx+(b.y-fy)*dy)/l,0,1),px=fx_+dx*t,py=fy+dy*t,dd=Math.hypot(b.x-px,b.y-py);if(dd<6&&b.vy>-1){b.y=py-6;b.vy=up?-7-t*3:-Math.abs(b.vy)*.5;b.vx+=d*(up?1.5:0);S('blip');if(up)fx.spark(b.x,b.y+4,'#ffffff',4,1.5);}});
  if(b.y>H+10){balls--;b=null;S('lose');fx.flash(K.r,8);if(balls<=0)g.over='GAME OVER';}};
 const bg=()=>{X.sky(['#0a0620','#140a30']);X.rr(5,5,289,H,8,X.lg(0,0,0,H,['#3a2a7a','#241a50','#1a1238']));const c=A.c;c.strokeStyle='rgba(160,140,255,.12)';c.lineWidth=1;for(let i=0;i<14;i++){c.beginPath();c.arc(150,95,20+i*14,0,6.283);c.stroke();}
  X.glow(150,95,110,'#ff4f9a',.12);for(const[x,y,col]of[[60,40,'#ffcf3f'],[240,40,'#2fd6c3'],[150,30,'#ff4f9a']]){X.glow(x,y,10,col,.4);X.disc(x,y,3,col);}
  X.vg(282,40,8,H,['#8a86b8','#4a4570']);X.vg(292,40,16,H,['#1a1238','#120c28']);c.fillStyle='rgba(255,255,255,.08)';for(let y=60;y<H;y+=16)c.fillRect(294,y,12,1);
  X.stroke([[9,150],[90,200]],'#2fd6c3',4);X.stroke([[282,150],[201,200]],'#2fd6c3',4);X.stroke([[9,150],[90,200]],'rgba(255,255,255,.5)',1);X.stroke([[282,150],[201,200]],'rgba(255,255,255,.5)',1);X.disc(90,200,4,'#8a86b8');X.disc(201,200,4,'#8a86b8');};
 g.draw=()=>{X.cache('pinbg',bg);const c=A.c;
  bumps.forEach(q=>{const lit=q.t>0;if(lit)X.glow(q.x,q.y,q.r*2.6,q.r>9?'#ff4f9a':'#ff9838',.6);X.shadow(q.x+2,q.y+3,q.r,q.r*.8,.35);X.disc(q.x,q.y,q.r+1.5,'#e8e8f0');X.orb(q.x,q.y,q.r,lit?'#ffffff':q.r>9?'#ff4f9a':'#ff9838');X.disc(q.x,q.y,q.r-4.5,lit?'#fff8c0':'#ffcf3f');X.ell(q.x-q.r*.3,q.y-q.r*.4,q.r*.3,q.r*.2,'rgba(255,255,255,.7)');});
  [[90,200,1,fa[0]],[201,200,-1,fa[1]]].forEach(f=>{const[fx_,fy,d,u]=f,a=(.35-.9*u)*d;c.save();c.translate(fx_,fy);c.rotate(d>0?a:Math.PI-a);X.shadow(20,4,20,3,.3);c.fillStyle=X.lg(0,-5,0,5,['#ff9aa8','#ff4f6d','#a01a30']);c.beginPath();c.arc(0,0,5,1.5708,4.712);c.lineTo(40,-2);c.arc(40,0,2,-1.5708,1.5708);c.closePath();c.fill();c.fillStyle='rgba(255,255,255,.4)';c.fillRect(2,-3.5,34,1);X.disc(0,0,2.2,'#e8e8f0');c.restore();});
  tr.forEach((q,i)=>{c.globalAlpha=.3*(1-i/7);X.disc(q[0],q[1],4.5-i*.4,'#c8d8ff');});c.globalAlpha=1;
  if(b){X.shadow(b.x+2,b.y+3,4.5,3.5,.3);X.orb(b.x,b.y,5,'#d8e0f0');}else{const py=205+pl*14;X.orb(298,py,5,'#d8e0f0');c.fillStyle=X.lg(0,0,0,1,['#c8c8d8','#6a6a7a']);c.fillStyle='#c8c8d8';c.fillRect(294,py+6,8,H-py);if(A.t%50<35)X.ot('DOWN TO LAUNCH',150,150,K.w,1,'c');}
  fx.draw();X.panel(10,8,110,16,K.y);T('SCORE '+g.score,16,13,K.y,1);X.panel(220,8,60,16,K.c);for(let i=0;i<balls;i++)X.orb(232+i*12,16,4,'#d8e0f0');};
 return g;}});

/* ---- DARTS ---- */
A.add({id:'darts',name:'DARTS 301',cat:'SPORTS',low:1,how:'A LOCKS X, A LOCKS Y. GET FROM 301 TO EXACTLY 0.',make(){
 const g={over:null,score:0},fx=X.fx(),SEG=[20,1,18,4,13,6,10,15,2,17,3,19,7,16,8,11,14,9,12,5];let left=301,ph=0,cx=160,cy=120,t=0,darts=0,msg='',mt=0,marks=[];
 g.update=()=>{t++;if(mt>0)mt--;if(ph===0){cx=160+Math.sin(t*.06)*70;if(A.hit(0).a){ph=1;t=0;S('blip');}}else if(ph===1){cy=120+Math.sin(t*.075)*60;if(A.hit(0).a){const x=cx+rnd(6)-3,y=cy+rnd(6)-3,d=Math.hypot(x-160,y-120);let a=Math.atan2(y-120,x-160)+Math.PI/2+Math.PI/20;a=((a%(2*Math.PI))+2*Math.PI)%(2*Math.PI);const seg=SEG[Math.floor(a/(Math.PI/10))%20];
   let p=d<4?50:d<9?25:d<28?seg:d<33?seg*3:d<52?seg:d<57?seg*2:0;darts++;g.score=darts;marks.push([x,y,ri(3)]);if(marks.length>6)marks.shift();fx.spark(x,y,'#ffe0a0',6,1.8);A.shake=2;if(left-p===0){left=0;g.over='CHECKOUT! WIN';S('win');return;}if(left-p<0){msg='BUST';p=0;}else{msg=p?(d<4?'BULLSEYE! ':d>=28&&d<33?'TREBLE ':d>=52&&d<57?'DOUBLE ':'')+'-'+p:'MISS';left-=p;}S(p?'hit':'lose');if(p>=40)fx.ring(x,y,K.y,20);ph=2;t=0;mt=50;}}
  else if(t>50)ph=0;};
 const board=()=>{X.vg(0,0,W,H,['#4a2e1a','#2a180c']);const c=A.c;c.fillStyle='rgba(0,0,0,.15)';for(let x=0;x<W;x+=24)c.fillRect(x,0,2,H);X.glow(160,120,110,'#ffe0a0',.18);X.disc(160,124,74,'rgba(0,0,0,.45)');X.disc(160,120,72,X.lg(0,48,0,192,['#3a3a3a','#141414']));
  for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2,a0=a-Math.PI/20,a1=a+Math.PI/20,dark=i%2===0;const ring=(r0,r1,col)=>{c.fillStyle=col;c.beginPath();c.arc(160,120,r1,a0,a1);c.arc(160,120,r0,a1,a0,true);c.closePath();c.fill();};
   ring(9,28,dark?'#1a1a1a':'#f0e4c0');ring(28,33,dark?'#d0283a':'#1a9a4a');ring(33,52,dark?'#1a1a1a':'#f0e4c0');ring(52,57,dark?'#d0283a':'#1a9a4a');T(SEG[i],160+Math.cos(a)*65,120+Math.sin(a)*65-2,'#f0f0f0',1,'c');}
  X.disc(160,120,9,'#1a9a4a');X.disc(160,120,4,'#d0283a');c.strokeStyle='rgba(200,200,200,.55)';c.lineWidth=.5;for(const r of[4,9,28,33,52,57]){c.beginPath();c.arc(160,120,r,0,6.283);c.stroke();}for(let i=0;i<20;i++){const a=i*Math.PI/10-Math.PI/2-Math.PI/20;c.beginPath();c.moveTo(160+Math.cos(a)*9,120+Math.sin(a)*9);c.lineTo(160+Math.cos(a)*57,120+Math.sin(a)*57);c.stroke();}};
 g.draw=()=>{X.cache('dartbg',board);const c=A.c;
  marks.forEach(m=>{const col=['#ff4f6d','#4dabff','#ffcf3f'][m[2]];X.stroke([[m[0],m[1]],[m[0]+6,m[1]+7]],'#c8c8d0',1.2);X.poly([[m[0]+5,m[1]+6],[m[0]+12,m[1]+7],[m[0]+8,m[1]+10]],col);X.poly([[m[0]+5,m[1]+6],[m[0]+6,m[1]+13],[m[0]+8,m[1]+10]],X.lt(col,.7));X.disc(m[0],m[1],1,'#222');});
  if(ph<2){c.globalAlpha=.6;X.stroke([[cx,46],[cx,194]],'#7ff0ff',1);if(ph===1)X.stroke([[86,cy],[234,cy]],'#ff7fc0',1);c.globalAlpha=1;const yy=ph?cy:120;X.glow(cx,yy,10,'#7ff0ff',.4);A.ring(cx,yy,5,'#ffffff');}
  fx.draw();X.bar('LEFT '+left,'DARTS '+darts);T(ph===0?'A: LOCK X':ph===1?'A: LOCK Y':'',160,6,K.c,1,'c');if(mt>0)X.ot(msg,160,210,msg==='BUST'||msg==='MISS'?K.r:K.y,2,'c');};
 return g;}});

/* ---- RHYTHM TAP ---- */
A.add({id:'rhythm',name:'RHYTHM TAP',cat:'PUZZLE',how:'HIT THE ARROW WHEN IT REACHES THE LINE.',make(){
 const g={over:null,score:0},KS=['l','d','u','r'],LX=[100,140,180,220],COL=['#ff4f9a','#2fd6c3','#3ddc84','#ffcf3f'],fx=X.fx();let notes=[],t=0,miss=0,combo=0,bpm=90,flash={},hf=0,beat=0;
 for(let i=0;i<400;i++)notes.push({k:ri(4),t:120+i*(3600/bpm)*(1-Math.min(.5,i/300)),ok:0});
 g.update=()=>{t++;if(hf>0)hf--;if(beat>0)beat--;const h=A.hit(0);for(const n of notes){if(n.ok)continue;const dy=n.t-t;if(dy<-14){n.ok=2;miss++;combo=0;S('lose');fx.pop(LX[n.k],170,'MISS',K.r);if(miss>=8)g.over='OFF BEAT';}else if(Math.abs(dy)<=14&&h[KS[n.k]]){n.ok=1;const p=Math.abs(dy)<5?3:1;combo++;g.score+=p*Math.min(combo,10);flash[n.k]=10;hf=p;beat=8;S(p>1?'coin':'blip');fx.ring(LX[n.k],190,COL[n.k],20,12);fx.spark(LX[n.k],190,COL[n.k],p>1?10:5,2.5);h[KS[n.k]]=false;}}
  for(const k in flash)if(flash[k]>0)flash[k]--;if(t>notes[notes.length-1].t+30)g.over='SONG CLEAR! WIN';};
 const arrow=(x,y,k,col,s)=>{s=s||1;const rot=[Math.PI,Math.PI/2,-Math.PI/2,0][k],c=A.c;c.save();c.translate(x,y);c.rotate(rot);c.scale(s,s);X.poly([[9,0],[0,-9],[0,-4],[-8,-4],[-8,4],[0,4],[0,9]],X.lg(-8,-9,8,9,[X.lt(col,1.5),col,X.lt(col,.55)]));X.polys([[9,0],[0,-9],[0,-4],[-8,-4],[-8,4],[0,4],[0,9]],'rgba(255,255,255,.6)',.8);c.restore();};
 g.draw=()=>{X.cache('rhybg',()=>{X.sky(['#140a30','#0a0618']);X.vg(80,0,160,H,['rgba(40,20,90,.8)','rgba(20,10,50,.9)']);const c=A.c;for(let i=0;i<4;i++){c.fillStyle=X.rgba(COL[i],.06);c.fillRect(LX[i]-18,0,36,H);}c.fillStyle='rgba(255,255,255,.12)';c.fillRect(80,0,1,H);c.fillRect(239,0,1,H);});const c=A.c;
  const pulse=beat/8;X.glow(160,190,90+pulse*30,'#7a4aff',.15+pulse*.15);c.fillStyle='rgba(255,255,255,.55)';c.fillRect(80,189,160,2);
  for(let i=0;i<4;i++){if(flash[i])X.glow(LX[i],190,24,COL[i],.6*flash[i]/10);arrow(LX[i],190,i,flash[i]?'#ffffff':'#4a4470',flash[i]?1.15:1);}
  notes.forEach(n=>{if(n.ok)return;const y=190-(n.t-t)*1.5;if(y>-10&&y<H){X.glow(LX[n.k],y,12,COL[n.k],.25);arrow(LX[n.k],y,n.k,COL[n.k]);}});
  fx.draw();X.bar('SCORE '+g.score,'MISS '+miss+'/8','',K.y,miss>4?K.r:K.w);if(combo>4)X.ot('COMBO '+combo,160,40,K.w,2,'c');if(hf)X.ot(hf>1?'PERFECT':'GOOD',160,60,hf>1?K.y:K.c,1,'c');};
 return g;}});

/* ---- SKY FURY ---- */
A.add({id:'skyfury',name:'SKY FURY',cat:'CLASSICS',how:'FLY. A FIRES. SHOOT EVERYTHING.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:200},en=[],bl=[],eb=[],lives=3,inv=0,t=0,pw=0,bank=0;
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*3,8,W-8);p.y=cl(p.y+ay(k)*2.5,30,H-10);bank+=(ax(k)-bank)*.2;if(inv>0)inv--;
  if(A.hit(0).a||A.in(0).a&&t%(pw?5:9)===0){bl.push({x:p.x-4,y:p.y-8});bl.push({x:p.x+4,y:p.y-8});S('shoot');}
  if(t%Math.max(18,50-(t/200|0))===0){const big=Math.random()<.15;en.push({x:rnd(W-40)+20,y:-10,vx:rnd(1.6)-.8,vy:big?.6:1.2+rnd(.8),hp:big?6:1,big,w:0,hit:0});}
  bl.forEach(b=>b.y-=6);bl=bl.filter(b=>b.y>-10);
  for(const e of en){e.x+=e.vx;e.y+=e.vy;if(e.hit)e.hit--;if(e.x<10||e.x>W-10)e.vx*=-1;e.w++;if(e.w%(e.big?40:90)===0&&e.y>0){const d=Math.hypot(p.x-e.x,p.y-e.y);eb.push({x:e.x,y:e.y,vx:(p.x-e.x)/d*2,vy:(p.y-e.y)/d*2});}
   for(const b of bl)if(Math.abs(b.x-e.x)<(e.big?12:7)&&Math.abs(b.y-e.y)<(e.big?12:7)){b.y=-99;e.hp--;e.hit=4;fx.spark(b.x,b.y,'#fff0a0',3,1.5);if(e.hp<=0){g.score+=e.big?200:10;S(e.big?'boom':'hit');fx.spark(e.x,e.y,e.big?K.p:K.o,e.big?24:10,3);fx.debris(e.x,e.y,'#5a5a6a',e.big?10:4,2);fx.ring(e.x,e.y,'#ffd080',e.big?36:16);if(e.big){fx.pop(e.x,e.y-14,'+200',K.y);if(!pw){pw=600;S('win');fx.pop(p.x,p.y-24,'RAPID FIRE!',K.g);}}}}
   if(inv===0&&Math.abs(p.x-e.x)<(e.big?14:8)&&Math.abs(p.y-e.y)<(e.big?14:8)){e.hp=0;lives--;inv=90;S('boom');fx.flash(K.r,8);fx.spark(p.x,p.y,K.c,16,3);if(lives<=0)g.over='SHOT DOWN';}}
  en=en.filter(e=>e.hp>0&&e.y<H+10);for(const b of eb){b.x+=b.vx;b.y+=b.vy;if(inv===0&&Math.abs(b.x-p.x)<5&&Math.abs(b.y-p.y)<6){b.y=999;lives--;inv=90;S('boom');fx.flash(K.r,8);if(lives<=0)g.over='SHOT DOWN';}}eb=eb.filter(b=>b.y<H&&b.y>-10&&b.x>0&&b.x<W);if(pw>0)pw--;};
 const plane=(x,y,s,body,wing,dir,bank_)=>{const c=A.c;c.save();c.translate(x,y);c.scale(s*(1-Math.abs(bank_||0)*.15),s*dir);X.poly([[-14,1],[14,1],[12,-2],[-12,-2]],X.lg(-14,0,14,0,[X.lt(wing,.7),X.lt(wing,1.3),X.lt(wing,.7)]));X.poly([[-5,9],[5,9],[4,7],[-4,7]],wing);X.ell(0,0,3.2,10,X.lg(-3,0,3,0,[X.lt(body,.7),X.lt(body,1.4),X.lt(body,.7)]));X.ell(0,-3,1.6,3,'rgba(160,230,255,.9)');c.restore();};
 g.draw=()=>{const c=A.c;X.cache('skyseabg',()=>{X.sky(['#1a5a9a','#2a7ab8','#1a5a9a']);});const sc=t*.8;
  for(let i=0;i<4;i++){const yy=((i*110+sc)%440)-60,xx=(i*137)%W;X.ell(xx,yy,30,18,'#3a9a5a');X.ell(xx,yy,26,15,'#4ab86a');X.ell(xx-6,yy-4,10,6,'#6ad08a');X.ell(xx,yy,34,22,'rgba(255,255,255,.08)');}
  c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<30;i++){const yy=((i*29+sc)%260)-10;c.fillRect((i*71)%W,yy,8,1);}
  en.forEach(e=>{X.shadow(e.x+14,e.y+18,e.big?16:8,e.big?5:3,.18);});X.shadow(p.x+16,p.y+22,10,3,.2);
  en.forEach(e=>{if(e.hit)c.globalAlpha=.6;plane(e.x,e.y,e.big?1.5:.9,e.big?'#c84a8a':'#d04040',e.big?'#a03a70':'#a83030',-1,0);c.globalAlpha=1;if(e.big){X.meter(e.x-12,e.y-20,24,3,e.hp/6,'#ff4f6d');}});
  bl.forEach(b=>{X.glow(b.x,b.y+3,5,pw?'#3ddc84':'#ffd060',.6);c.fillStyle=pw?'#c0ffd0':'#fff0b0';c.fillRect(b.x-.8,b.y,1.6,6);});eb.forEach(b=>{X.glow(b.x,b.y,6,'#ff6020',.6);X.disc(b.x,b.y,2,'#ffd0a0');});
  for(let i=0;i<5;i++){const yy=((i*120+sc*1.8)%480)-80,xx=(i*97+40)%W;c.globalAlpha=.55;X.disc(xx,yy,14,'#ffffff');X.disc(xx+14,yy+4,12,'#ffffff');X.disc(xx-12,yy+5,10,'#ffffff');c.globalAlpha=1;}
  if(inv%8<5){X.glow(p.x,p.y+11,6,'#ff8030',.6);plane(p.x,p.y,1.1,'#e8eef8','#4dabff',1,bank);}
  fx.draw();X.bar('SCORE '+g.score,'',pw>0?'RAPID FIRE '+Math.ceil(pw/60):'');for(let i=0;i<lives;i++)X.heart(W-10-i*11,8,1);};
 return g;}});

/* ---- WHACK BOTS ---- */
A.add({id:'whack',name:'WHACK BOTS',cat:'PUZZLE',how:'MOVE TO A BOT, PRESS A. AVOID THE RED ONES. 45 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let c={x:1,y:1},bots=Array(9).fill(0),time=2700,t=0,sw=0,dizzy=Array(9).fill(0);
 g.update=()=>{time--;t++;if(sw)sw--;dizzy=dizzy.map(v=>v?v-1:0);if(time<=0){g.over='TIME UP';return;}const h=A.hit(0);mvCur(h,c,3,3);if(h.l||h.r||h.u||h.d)S('blip');if(t%Math.max(20,60-(time/60|0))===0){const i=ri(9);if(!bots[i])bots[i]=Math.random()<.22?-40:50+rnd(30);}
  bots=bots.map(v=>v>0?v-1:v<0?v+1:0);if(h.a){sw=10;const i=c.y*3+c.x,x=70+(i%3)*70,y=70+((i/3)|0)*60;if(bots[i]>0){g.score+=10;bots[i]=0;dizzy[i]=20;S('coin');fx.spark(x,y,K.y,10,2.5);fx.ring(x,y,'#ffffff',18,10);A.shake=2;}else if(bots[i]<0){g.score=Math.max(0,g.score-15);bots[i]=0;S('boom');fx.flash(K.r,8);fx.pop(x,y-20,'-15',K.r);}else S('blip');}};
 g.draw=()=>{const cx=A.c;X.cache('whackbg',()=>{X.sky(['#4a9ae0','#9ad0f8'],48);X.hills(48,14,'#5aa04a',0,.03,3);X.turf(0,44,W,H-44,'#3a9a3a','#45a845',18);X.vignette(.3);for(let i=0;i<9;i++){const x=70+(i%3)*70,y=70+((i/3)|0)*60;X.ell(x,y+16,26,10,'#6a4a20');X.ell(x,y+15,22,8,X.lg(0,y+8,0,y+22,['#2a1808','#000000']));}});
  for(let i=0;i<9;i++){const x=70+(i%3)*70,y=70+((i/3)|0)*60;if(bots[i]){const bad=bots[i]<0,up=Math.min(1,Math.abs(bots[i])/10),top=y+14-26*up;cx.save();cx.beginPath();cx.rect(x-30,y-40,60,y+15-(y-40));if(cx.clip)cx.clip();
    X.rr(x-12,top,24,30,8,X.lg(x-12,0,x+12,0,bad?['#a01020','#ff4f6d','#a01020']:['#7a8098','#d0d8f0','#7a8098']));X.rr(x-9,top+4,18,9,3,'#1a1a2a');const ec=bad?'#ff3030':'#3dff8b';X.glow(x-4,top+8,5,ec,.6);X.glow(x+4,top+8,5,ec,.6);X.disc(x-4,top+8,1.8,ec);X.disc(x+4,top+8,1.8,ec);
    cx.fillStyle='#555';cx.fillRect(x-.5,top-6,1,6);X.disc(x,top-6,1.8,bad?'#ff4f6d':'#ffcf3f');if(bad){X.poly([[x-12,top+4],[x-16,top],[x-12,top+10]],'#ffcf3f');X.poly([[x+12,top+4],[x+16,top],[x+12,top+10]],'#ffcf3f');}cx.restore();}
   if(dizzy[i])for(let s=0;s<3;s++){const a=A.t*.2+s*2.1;X.disc(x+Math.cos(a)*10,y-14+Math.sin(a)*3,1.5,K.y);}
   X.ell(x,y+16.5,22,3,'rgba(120,80,30,.6)');}
  const hx=70+c.x*70,hy=70+c.y*60,ang=sw?-.2+sw*.12:.9;cx.save();cx.translate(hx+18,hy+4);cx.rotate(-ang);cx.fillStyle=X.lg(0,0,30,0,['#c8905a','#8a5a2a']);cx.fillRect(-2,-2,30,4);X.rr(-8,-9,14,18,3,X.lg(-8,0,6,0,['#ff7a8a','#d02040','#801020']));cx.restore();A.ring(hx,hy+10,24,'rgba(255,207,63,.6)');
  fx.draw();X.bar('SCORE '+g.score,''+Math.ceil(time/60),'',K.y,time<600?K.r:K.w);};
 return g;}});

/* ---- CLOUD HOP ---- */
A.add({id:'cloudhop',name:'CLOUD HOP',cat:'CLASSICS',how:'LEFT/RIGHT MOVE. BOUNCE UP. DON\'T FALL.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:180,vy:0,f:1},pl=[],cam=0,top=0,sq=0;for(let i=0;i<9;i++)pl.push({x:rnd(W-40)+20,y:200-i*28,w:40,m:i>4&&Math.random()<.3?1:0,d:1,b:0});pl[0].x=160;pl[0].w=60;
 g.update=()=>{const k=A.in(0);if(sq)sq--;if(ax(k))p.f=ax(k);p.x=(p.x+ax(k)*3+W)%W;p.vy+=.18;p.y+=p.vy;for(const q of pl){if(q.b)q.b--;if(q.m){q.x+=q.d*1.2;if(q.x<20||q.x>W-20)q.d*=-1;}if(p.vy>0&&p.y>q.y-4&&p.y<q.y+6&&Math.abs(p.x-q.x)<q.w/2+4){p.vy=-6.2;q.b=10;sq=8;S('jump');fx.spark(p.x,q.y,'#ffffff',4,1.4);}}
  const want=p.y-140;if(want<cam)cam=want;const s0=g.score;g.score=Math.max(g.score,-cam/5|0);if(g.score>=100&&s0<100||g.score>=250&&s0<250||g.score>=500&&s0<500)fx.pop(160,60,g.score+'!',K.y);for(const q of pl)if(q.y>cam+H+10){q.y-=9*28;q.x=rnd(W-40)+20;q.w=Math.max(22,40-g.score/40);q.m=Math.random()<.35?1:0;}if(p.y>cam+H+20)g.over='FELL';};
 g.draw=()=>{const k=cl(-cam/2500,0,1),c=A.c;c.fillStyle=X.lg(0,0,0,H,[A.mix('#3a8ae0','#0a0a3a',k),A.mix('#bfe6ff','#6a4aa0',k)]);c.fillRect(0,0,W,H);if(k>.2){c.globalAlpha=k;X.stars(50,2,0,cam*.05,H,.8);c.globalAlpha=1;}
  for(let i=0;i<6;i++){const y=((i*90-cam*.3)%(H+60)+H+60)%(H+60)-30,x=(i*97)%W;c.globalAlpha=.35;X.disc(x,y,12,'#ffffff');X.disc(x+14,y-4,14,'#ffffff');X.disc(x+28,y,10,'#ffffff');c.globalAlpha=1;}
  pl.forEach(q=>{const y=q.y-cam+(q.b?Math.sin(q.b*.6)*2:0),w=q.w;X.ell(q.x,y+7,w/2+2,3,'rgba(60,80,140,.18)');const col=q.m?'#d8f0ff':'#ffffff';for(let i=-1;i<=1;i++)X.disc(q.x+i*w/3,y-(i?0:3),i?7:9,X.lg(0,y-12,0,y+8,[col,q.m?'#9ad0f0':'#d8e4f4']));X.rr(q.x-w/2,y-2,w,8,4,X.lg(0,y-2,0,y+6,[col,q.m?'#8ac0e8':'#c8d4e8']));if(q.m){X.glow(q.x,y,14,'#4dabff',.2);}});
  const y=p.y-cam,s=sq*.05;c.save();c.translate(p.x,y);c.scale(1+s,1-s+(p.vy<-3?.08:0));X.orb(0,-8,8,'#5ad04a');X.disc(-3*p.f+1,-11,2.6,'#fff');X.disc(3*p.f+1,-11,2.6,'#fff');X.disc(-3*p.f+1.6*p.f,-11,1.2,'#111');X.disc(3*p.f+1.6*p.f,-11,1.2,'#111');X.ell(0,-4,3,1.2,'#2a7a2a');c.restore();
  fx.draw();X.ot(g.score,160,10,K.w,3,'c');};
 return g;}});

/* ---- DUCK GALLERY ---- */
A.add({id:'gallery',name:'DUCK GALLERY',cat:'SPORTS',how:'MOVE THE SIGHT. A SHOOTS. 30 SHOTS.',make(){
 const g={over:null,score:0},fx=X.fx();let cx=160,cy=120,ducks=[],shots=30,t=0,hitT=0,down=[],rec=0;
 g.update=()=>{t++;if(hitT>0)hitT--;if(rec)rec--;down.forEach(d=>{d.r+=.15;d.y+=d.vy;d.vy+=.2;});down=down.filter(d=>d.y<H+20);const k=A.in(0);if(A.mouse.t>0){cx=cl(A.mouse.x,10,W-10);cy=cl(A.mouse.y,30,200);}else{cx=cl(cx+ax(k)*3.5,10,W-10);cy=cl(cy+ay(k)*3.5,30,200);}if(t%50===0){const row=ri(3);ducks.push({x:row%2?W+10:-10,y:70+row*45,d:row%2?-1:1,v:1+rnd(1.5)+t/3000,big:Math.random()<.2});}
  ducks.forEach(d=>d.x+=d.d*d.v);ducks=ducks.filter(d=>d.x>-20&&d.x<W+20);
  if(A.hit(0).a&&shots>0){shots--;rec=6;S('shoot');fx.spark(cx,cy,'#fff0c0',4,1.5);const d=ducks.find(d=>Math.abs(d.x-cx)<(d.big?8:12)&&Math.abs(d.y-cy)<10);if(d){ducks.splice(ducks.indexOf(d),1);g.score+=d.big?50:10;hitT=15;S('coin');down.push({x:d.x,y:d.y,vy:-2,r:0,d:d.d,big:d.big});fx.debris(d.x,d.y,d.big?'#ffcf3f':'#ffffff',8,1.8);fx.pop(d.x,d.y-14,d.big?'+50':'+10',d.big?K.y:K.w);}if(shots===0)g.over='OUT OF SHOTS';}};
 const duck=(x,y,d,big,rot)=>{const s=big?.7:1,col=big?'#ffcf3f':'#f0f0f0',c=A.c;c.save();c.translate(x,y);if(rot)c.rotate(rot);c.scale(s*d,s);c.fillStyle='#8a5c33';c.fillRect(-1.5,6,3,10);X.ell(0,0,10,6,X.lg(0,-6,0,6,[X.lt(col,1.1),col,X.lt(col,.75)]));X.ell(-2,-1,5,3,X.lt(col,.85));X.disc(7,-7,4.5,col);X.poly([[10,-8],[16,-6.5],[10,-5]],'#ff9838');X.disc(8,-8,1,'#111');c.restore();};
 g.draw=()=>{X.cache('gallery_bg',()=>{X.sky(['#1a3a6a','#2a5a9a']);const c=A.c;for(let i=0;i<12;i++){c.fillStyle=i%2?'#d02a3a':'#f4f0e8';c.fillRect(i*W/12,0,W/12,24);}for(let i=0;i<12;i++)X.disc(i*W/12+W/24,24,W/24,i%2?'#d02a3a':'#f4f0e8');c.fillStyle='rgba(0,0,0,.2)';c.fillRect(0,30,W,3);
   [80,125,170].forEach((y,i)=>{X.vg(0,y-4,W,8,[['#d8a060','#a86a30'][i%2],'#6a3a14']);c.fillStyle='rgba(0,0,0,.25)';c.fillRect(0,y+4,W,2);for(let x=0;x<W;x+=16){c.fillStyle=['#2a7ad0','#2a90e0'][i%2];c.beginPath();c.arc(x+8,y+12,8,Math.PI,0);c.fill();}});X.vg(0,196,W,44,['#7a4a20','#4a2810']);c.fillStyle='#e8c070';c.fillRect(0,196,W,3);X.vignette(.45);});const c=A.c;
  ducks.forEach(d=>duck(d.x,d.y-4,d.d,d.big,0));down.forEach(d=>duck(d.x,d.y-4,d.d,d.big,d.r*d.d));
  const r=rec?9:7;c.globalAlpha=.9;A.ring(cx,cy,r,hitT?K.y:'#ffffff');A.ring(cx,cy,r+.6,'rgba(0,0,0,.5)');X.stroke([[cx-12,cy],[cx-4,cy]],'#ffffff',1.2);X.stroke([[cx+4,cy],[cx+12,cy]],'#ffffff',1.2);X.stroke([[cx,cy-12],[cx,cy-4]],'#ffffff',1.2);X.stroke([[cx,cy+4],[cx,cy+12]],'#ffffff',1.2);X.disc(cx,cy,.9,'#ff3040');c.globalAlpha=1;
  fx.draw();X.panel(4,204,120,14,K.y);T('SCORE '+g.score,10,209,K.y,1);X.panel(196,204,120,14,shots<6?K.r:K.w);for(let i=0;i<30;i++){c.fillStyle=i<shots?'#ffcf3f':'rgba(255,255,255,.15)';c.fillRect(200+i*3.8,207,2,8);}};
 return g;}});

/* ---- ORBIT HOP ---- */
A.add({id:'orbit',name:'ORBIT HOP',cat:'PUZZLE',how:'A JUMPS TO THE NEXT RING. LAND ON THE PAD.',make(){
 const g={over:null,score:0},fx=X.fx();let ring=0,a=0,dir=1,rings=[],jump=null,life=3,tr=[];const mk=i=>({y:200-i*45,r:26+ri(14),pa:rnd(6.28),pw:.9-Math.min(.5,i*.04),sp:.03+i*.003,h:ri(360)});for(let i=0;i<8;i++)rings.push(mk(i));
 const pos=()=>{const q=rings[ring],n=rings[ring+1]||q;if(jump){const r=q.r+(n.r-q.r)*jump.t;return[160+Math.cos(a)*r,q.y+(n.y-q.y)*jump.t-Math.sin(jump.t*3.14)*20];}return[160+Math.cos(a)*q.r,q.y+Math.sin(a)*q.r*.35];};
 g.update=()=>{const ps=pos();tr.unshift(ps);if(tr.length>10)tr.pop();const q=rings[ring];if(jump){jump.t+=.08;if(jump.t>=1){jump=null;ring++;const n=rings[ring];let d=Math.abs(((a-n.pa)%6.283+9.425)%6.283-3.1416);const[px,py]=pos();if(d<n.pw){const pts=d<n.pw*.4?30:10;g.score+=pts;S('coin');dir*=-1;fx.ring(px,py,pts>10?K.y:K.g,18,12);fx.pop(px,py-12,pts>10?'PERFECT +30':'+10',pts>10?K.y:K.g);}else{life--;S('boom');fx.spark(px,py,K.r,12,2.5);fx.flash(K.r,6);if(life<=0)g.over='MISSED';}if(ring>=6){rings.shift();ring--;rings.push(mk(rings.length+ring*0+rings[rings.length-1].id||0));rings[rings.length-1].y=rings[rings.length-2].y-45;rings.forEach(r=>r.y+=45);}}return;}
  a+=dir*q.sp;if(A.hit(0).a){jump={t:0};S('jump');}};
 g.draw=()=>{X.cache('orbbg',()=>{X.sky(['#02010a','#0a0620','#140830']);X.stars(90,7,0,0,H,.8);X.glow(70,60,80,'#3a1a8a',.3);X.glow(260,180,90,'#0a4a7a',.3);});const c=A.c;
  rings.forEach((q,i)=>{const y=q.y,col=hsl(q.h,80,60);c.save();c.translate(160,y);c.scale(1,.35);c.strokeStyle=i===ring?'rgba(127,240,255,.8)':'rgba(140,130,200,.35)';c.lineWidth=i===ring?2:1.2;c.beginPath();c.arc(0,0,q.r,0,6.283);c.stroke();if(i>ring){c.strokeStyle=K.y;c.lineWidth=5;c.shadowBlur=0;c.beginPath();c.arc(0,0,q.r,q.pa-q.pw,q.pa+q.pw);c.stroke();}c.restore();X.orb(160,y,7+(q.r-26)*.2,col);});
  tr.forEach((p,i)=>{c.globalAlpha=.4*(1-i/10);X.disc(p[0],p[1],4-i*.3,'#7dff9a');});c.globalAlpha=1;const[x,y]=pos();X.glow(x,y,12,'#3ddc84',.6);X.orb(x,y,4.5,'#5aff8a');
  fx.draw();X.bar('SCORE '+g.score,'');for(let i=0;i<life;i++)X.heart(W-10-i*11,8,1,'#3ddc84');};
 return g;}});
})();
