(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),ay=k=>(k.d?1:0)-(k.u?1:0),ri=A.ri;
const crowd2=(y0,y1,seed,a)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.globalAlpha=a||.5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};
const pbar=(x,y,f)=>{X.panel(x-3,y-3,16,106,'#ffffff');X.rr(x,y,10,100,4,'rgba(0,0,0,.4)');const h=f*96;X.rr(x+1,y+98-h,8,h,3,X.lg(0,y+98,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};
const sball=(x,y,r,rot)=>{const c=A.c;c.save();c.translate(x,y);X.orb(0,0,r,'#ffffff');c.rotate(rot||0);c.fillStyle='#222';c.fillRect(-r*.25,-r*.25,r*.5,r*.5);c.fillRect(r*.45,-r*.7,r*.3,r*.3);c.fillRect(-r*.75,r*.35,r*.3,r*.3);c.restore();};
const human=p=>A.two?p:0; /* which input a human seat uses */

/* ---- BOWLING 3D ---- */
A.add({id:'bowling',name:'BOWLING 3D',cat:'SPORTS',vs:1,how:'A x3: POSITION, ANGLE, POWER. 5 FRAMES.',make(){
 const g={over:null,score:0},NF=5,fx=X.fx();let rolls=[[],[]],p=0,fr=0,rl=0,ph='pos',ball,pins,t=0,down0=0,msg='',mt=0,spin=0;
 const pr=(x,d)=>{const s=1/(1+d*.22);return[160+x*80*s,228-(1-s)*205,s];};
 const rack=()=>{pins=[];for(let r=0;r<4;r++)for(let j=0;j<=r;j++)pins.push({x:(j-r/2)*.36,d:15+r*.7,up:1,vx:0,vd:0,t:0,rot:0});};
 const fresh=()=>{ball={x:0,d:0,ang:0,pow:0,spd:0};ph='pos';t=0;};rack();fresh();
 const total=a=>{let s=0,i=0;for(let f=0;f<NF&&i<a.length;f++){if(a[i]===10){s+=10+(a[i+1]||0)+(a[i+2]||0);i++;}else{const two=a[i]+(a[i+1]||0);s+=two+(two===10?(a[i+2]||0):0);i+=2;}}return s;};
 const knock=(q,nx,nd,sp)=>{q.up=0;q.vx=nx*sp;q.vd=Math.abs(nd)*sp+sp*.4;q.t=26;q.rot=nx>0?1:-1;S('hit');const v=pr(q.x,q.d);fx.spark(v[0],v[1]-12*v[2],'#ffffff',3,1.5);};
 g.update=()=>{t++;spin+=ball.spd*3;if(mt>0)mt--;const cpu=A.cpu&&p===1,h=A.hit(human(p)),k=A.in(human(p));
  if(ph==='pos'){if(cpu){if(t>40){ball.x=rnd(.3)-.15;ball.ang=(rnd(2)-1)*.035*(1.7-A.ai);ball.pow=.6+rnd(.4);ph='roll';ball.spd=.13+ball.pow*.1;S('shoot');}}else{ball.x=cl(ball.x+ax(k)*.02,-.8,.8);if(h.a&&t>10){ph='aim';t=0;}}}
  else if(ph==='aim'){ball.ang=Math.sin(t*.07)*.07;if(h.a){ph='pow';t=0;}}
  else if(ph==='pow'){ball.pow=.5+.5*Math.sin(t*.09-1.57);if(h.a){ph='roll';ball.spd=.13+ball.pow*.1;S('shoot');}}
  else if(ph==='roll'){ball.d+=ball.spd;ball.x+=ball.ang*ball.spd*3;const gut=Math.abs(ball.x)>1;if(gut){ball.x=ball.x>0?1.1:-1.1;ball.ang=0;}
   if(!gut)for(const q of pins)if(q.up){const dx=q.x-ball.x,dd=q.d-ball.d,m=Math.hypot(dx,dd);if(m<.27){knock(q,dx/m,dd/m,ball.spd*.9);ball.ang-=dx/m*.012;}}
   if(ball.d>19){ph='settle';t=0;}}
  if(ph==='roll'||ph==='settle')for(const q of pins)if(q.t>0){q.t--;q.x+=q.vx;q.d+=q.vd;q.vx*=.93;q.vd*=.93;for(const o of pins)if(o.up){const dx=o.x-q.x,dd=o.d-q.d,m=Math.hypot(dx,dd);if(m<.2)knock(o,dx/m,dd/m,Math.hypot(q.vx,q.vd)*.85);}}
  if(ph==='settle'&&t>55){const got=pins.filter(q=>!q.up).length,dn=down0+got;rolls[p].push(got);
   let endFrame=false;if(rl===0&&dn===10){msg='STRIKE!';endFrame=true;}else if(rl===1){msg=dn===10?'SPARE!':got+' DOWN';endFrame=true;}else msg=got?got+' DOWN':'GUTTER!';mt=70;if(dn===10){S('score');fx.spark(160,60,K.y,24,3);fx.flash('#ffffff',8);}
   if(endFrame){rl=0;down0=0;rack();if(p===1){fr++;p=0;}else p=1;if(fr>=NF){const a=total(rolls[0]),b=total(rolls[1]);g.over=a===b?'DRAW!':A.win(a>b?0:1);}}else{rl=1;down0=dn;pins=pins.filter(q=>q.up);}
   fresh();}};
 const bg=()=>{X.sky(['#140c28','#24164a']);const c=A.c;X.glow(160,30,120,'#ffd890',.2);const q=(a,b)=>[a[0],a[1]];X.poly([pr(-1.4,0),pr(1.4,0),pr(1.4,19),pr(-1.4,19)].map(v=>[v[0],v[1]]),'#1a1020');
   X.poly([pr(-1.25,0),pr(-1,0),pr(-1,19),pr(-1.25,19)].map(v=>[v[0],v[1]]),'#3a3a48');X.poly([pr(1,0),pr(1.25,0),pr(1.25,19),pr(1,19)].map(v=>[v[0],v[1]]),'#3a3a48');
   const ln=[pr(-1,0),pr(1,0),pr(1,19),pr(-1,19)];X.poly(ln.map(v=>[v[0],v[1]]),X.lg(0,ln[2][1],0,ln[0][1],['#a8743a','#e8b878','#f4cc90']));c.strokeStyle='rgba(120,70,20,.25)';c.lineWidth=.6;for(let i=-9;i<=9;i++){const a=pr(i/9.5,0),b=pr(i/9.5,19);c.beginPath();c.moveTo(a[0],a[1]);c.lineTo(b[0],b[1]);c.stroke();}
   for(let i=-2;i<=2;i++){const a=pr(i*.35,4.3),b=pr(i*.35-.05,4.9),d=pr(i*.35+.05,4.9);X.poly([[a[0],a[1]],[b[0],b[1]],[d[0],d[1]]],'#7a3a1a');X.disc(pr(i*.2,1.5)[0],pr(i*.2,1.5)[1],1.2,'#7a3a1a');}
   const bk=pr(0,19.5);X.vg(bk[0]-60,bk[1]-50,120,50,['#000','#1a1020']);X.glow(bk[0],bk[1]-30,50,'#ffffff',.08);};
 const pin=(v,s,down,rot)=>{const c=A.c;c.save();c.translate(v[0],v[1]);if(down){c.rotate(rot*1.4);c.translate(0,-3*s);}X.shadow(0,0,6*s,2*s,.3);X.ell(0,-9*s,5*s,9*s,X.lg(-5*s,0,5*s,0,['#c8c8d0','#ffffff','#b0b0b8']));X.ell(0,-21*s,2.5*s,4*s,'#f8f8f8');X.disc(0,-27*s,3*s,X.rg(-1*s,-28*s,0,0,-27*s,3*s,['#ffffff','#d8d8e0']));c.fillStyle='#e03040';c.fillRect(-2.6*s,-22*s,5.2*s,1.6*s);c.fillRect(-2.4*s,-19*s,4.8*s,1.4*s);c.restore();};
 g.draw=()=>{X.cache('bowl_bg',bg);const c=A.c;
  pins.slice().sort((a,b)=>b.d-a.d).forEach(q=>{const v=pr(q.x,Math.min(q.d,19)),s=v[2];pin(v,s,!q.up,q.rot);});
  if(ball.d<19){const v=pr(ball.x,ball.d),r=14*v[2],col=p?'#ff4f9a':'#2fd6c3';X.shadow(v[0],v[1],r,r*.3,.35);c.save();c.translate(v[0],v[1]-r);X.orb(0,0,r,col);c.rotate(spin);X.disc(r*.3,-r*.25,r*.12,'#111');X.disc(r*.05,-r*.45,r*.12,'#111');X.disc(-r*.15,-r*.15,r*.14,'#111');c.restore();}
  if(ph==='aim'||ph==='pos'){const a=pr(ball.x,0),b=pr(ball.x+ball.ang*15,5);c.globalAlpha=.8;for(let i=1;i<10;i++){const f=i/10;X.disc(a[0]+(b[0]-a[0])*f,a[1]-8+(b[1]-a[1]+8)*f,2-f,'#ffcf3f');}c.globalAlpha=1;}
  if(ph==='pow'||ph==='aim')pbar(10,80,ball.pow);
  fx.draw();X.bar();T(A.nm(0)+' '+total(rolls[0]),6,4,K.c,2);T(total(rolls[1])+' '+A.nm(1),W-6,4,K.p,2,'r');T('FRAME '+Math.min(fr+1,NF)+'/'+NF,160,3,K.w,1,'c');T(A.nm(p)+' BOWLS',160,10,p?K.p:K.c,1,'c');
  if(ph==='pos'&&!(A.cpu&&p===1))X.ot('LINE UP, THEN PRESS A',160,50,K.y,1,'c');if(mt>0)X.ot(msg,160,30,K.y,3,'c');};
 return g;}});

/* ---- MINI GOLF ---- */
A.add({id:'golf',name:'MINI GOLF',cat:'SPORTS',low:1,how:'AIM. HOLD A, RELEASE TO PUTT. 6 HOLES.',make(){
 const g={over:null,score:0},fx=X.fx();const HO=[{s:[40,125],c:[280,125],w:[]},{s:[40,125],c:[280,125],w:[[150,70,20,110]]},{s:[40,200],c:[280,50],w:[[100,24,16,130],[200,100,16,130]]},{s:[40,50],c:[280,200],w:[[90,90,140,16],[90,150,16,80]]},{s:[30,125],c:[290,125],w:[[80,24,14,90],[80,140,14,90],[160,80,14,100],[235,24,14,90],[235,140,14,90]]},{s:[40,40],c:[160,125],w:[[110,80,100,12],[110,160,100,12],[110,80,12,92]]}];
 let hi=0,b,ang=0,pow=0,chg=false,st=0,ht,wait=0,tr=[];const load=()=>{ht=HO[hi];b={x:ht.s[0],y:ht.s[1],vx:0,vy:0};ang=Math.atan2(ht.c[1]-b.y,ht.c[0]-b.x);st=0;tr=[];};load();
 const inW=(x,y)=>x<13||x>W-13||y<27||y>H-13||ht.w.some(w=>x>w[0]-3&&x<w[0]+w[2]+3&&y>w[1]-3&&y<w[1]+w[3]+3);
 const next=()=>{hi++;if(hi>=HO.length)g.over='COURSE CLEAR!';else load();};
 g.update=()=>{if(wait>0){if(--wait===0)next();return;}const k=A.in(0),mv=Math.hypot(b.vx,b.vy)>.05;
  if(!mv){b.vx=b.vy=0;ang+=ax(k)*.035;if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;b.vx=Math.cos(ang)*(1+pow*6);b.vy=Math.sin(ang)*(1+pow*6);st++;g.score++;S('hit');fx.spark(b.x,b.y,'#ffffff',4,1.4);}}
  else{tr.unshift([b.x,b.y]);if(tr.length>10)tr.pop();b.x+=b.vx;if(inW(b.x,b.y)){b.x-=b.vx;b.vx*=-.8;S('blip');fx.spark(b.x,b.y,'#e8c890',3,1.2);}b.y+=b.vy;if(inW(b.x,b.y)){b.y-=b.vy;b.vy*=-.8;S('blip');fx.spark(b.x,b.y,'#e8c890',3,1.2);}b.vx*=.982;b.vy*=.982;
   if(Math.hypot(b.x-ht.c[0],b.y-ht.c[1])<6&&Math.hypot(b.vx,b.vy)<3.2){b.x=ht.c[0];b.y=ht.c[1];b.vx=b.vy=0;wait=50;S('score');fx.ring(b.x,b.y,'#ffffff',20);fx.spark(b.x,b.y,K.y,12,2.2);fx.pop(b.x,b.y-26,st===1?'HOLE IN ONE!':'IN!',K.y);return;}
   if(Math.hypot(b.vx,b.vy)<=.05&&st>=8){wait=40;}}};
 g.draw=()=>{const c=A.c;X.cache('golf_bg'+hi,()=>{X.vg(0,0,W,H,['#2a5a2a','#1a3a1a']);X.rr(8,22,W-16,H-30,6,X.lg(0,22,0,H,['#8a5a2a','#5a3414']));X.turf(12,26,W-24,H-38,'#2e9e57','#35a85e',16,true);X.disc(ht.c[0],ht.c[1],24,'rgba(120,220,140,.25)');X.disc(ht.s[0],ht.s[1],10,'rgba(255,255,255,.1)');
   ht.w.forEach(w=>{A.c.fillStyle='rgba(0,0,0,.3)';A.c.fillRect(w[0]+3,w[1]+3,w[2],w[3]);X.block(w[0],w[1],w[2],w[3],'#a8743a',2);A.c.fillStyle='rgba(0,0,0,.15)';if(w[2]>w[3])for(let x=w[0]+10;x<w[0]+w[2];x+=10)A.c.fillRect(x,w[1]+1,1,w[3]-2);else for(let y=w[1]+10;y<w[1]+w[3];y+=10)A.c.fillRect(w[0]+1,y,w[2]-2,1);});
   X.disc(ht.c[0],ht.c[1],5.5,'#0a0a0a');X.ell(ht.c[0],ht.c[1]-1.5,5,2,'rgba(255,255,255,.12)');});
  const fw=Math.sin(A.t*.15);c.fillStyle='#eee';c.fillRect(ht.c[0],ht.c[1]-20,1.2,20);X.poly([[ht.c[0]+1,ht.c[1]-20],[ht.c[0]+11,ht.c[1]-17+fw],[ht.c[0]+1,ht.c[1]-13]],'#ff4f6d');
  tr.forEach((q,i)=>{c.globalAlpha=.25*(1-i/10);X.disc(q[0],q[1],2.5,'#ffffff');});c.globalAlpha=1;if(!(wait&&b.x===ht.c[0])){X.shadow(b.x+1,b.y+2,3.5,2,.35);X.orb(b.x,b.y,3.2,'#ffffff');}
  if(Math.hypot(b.vx,b.vy)<=.05&&!wait){for(let i=1;i<=6;i++)X.disc(b.x+Math.cos(ang)*i*7,b.y+Math.sin(ang)*i*7,1.4-i*.12,'rgba(255,255,255,.85)');if(chg){X.rr(b.x-17,b.y+8,34,7,3,'rgba(0,0,0,.5)');X.rr(b.x-16,b.y+9,32*pow,5,2,X.lg(b.x-16,0,b.x+16,0,['#3ddc84','#ffcf3f','#ff4f6d']));}}
  fx.draw();X.bar('HOLE '+(hi+1)+'/6','TOTAL '+g.score,'STROKES '+st,K.w,K.y);if(wait>0)X.ot(b.x===ht.c[0]?'IN THE CUP!':'STROKE LIMIT',160,100,K.y,2,'c');};
 return g;}});

/* ---- BOXING ---- */
A.add({id:'boxing',name:'RING BOXING',cat:'SPORTS',vs:1,how:'A PUNCHES. B BLOCKS. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let f=[{x:110,hp:100,pt:0,st:0},{x:210,hp:100,pt:0,st:0}],time=3600;
 g.update=()=>{time--;
  if(A.cpu){const q=f[1],d=q.x-f[0].x;A.bot({l:d>32||(d>26&&Math.random()<.3),r:d<22||(q.hp<30&&Math.random()<.04),b:f[0].pt>4&&Math.random()<.5+A.ai*.45,a:d<=34&&f[0].pt===0&&Math.random()<.04+.07*A.ai});}
  for(let i=0;i<2;i++){const q=f[i],o=f[1-i],k=A.in(i);q.blk=k.b&&q.pt===0;if(q.st>0){q.st--;continue;}if(!q.blk)q.x+=ax(k)*1.6;
   if(A.hit(i).a&&q.pt===0&&!q.blk){q.pt=18;S('jump');}if(q.pt>0){q.pt--;if(q.pt===11&&Math.abs(q.x-o.x)<36){const hx=(q.x+o.x)/2,hy=148;if(o.blk){o.hp-=1;S('blip');fx.spark(hx,hy-10,'#9fd0ff',5,1.5);}else{o.hp-=7+rnd(4);o.st=10;o.x+=i?-6:6;S('hit');A.shake=4;fx.spark(hx,hy,'#ffffff',10,2.5);fx.ring(hx,hy,'#ffcf3f',16,10);}}}}
  f[0].x=cl(f[0].x,40,W-64);f[1].x=cl(f[1].x,64,W-40);if(f[0].x>f[1].x-22){const m=(f[0].x+f[1].x)/2;f[0].x=m-11;f[1].x=m+11;}
  for(let i=0;i<2;i++)if(f[i].hp<=0){f[i].hp=0;fx.pop(f[i].x,100,'K.O.!',K.y);g.over=A.win(1-i);return;}
  if(time<=0)g.over=Math.round(f[0].hp)===Math.round(f[1].hp)?'DRAW!':A.win(f[0].hp>f[1].hp?0:1);};
 const bg=()=>{X.sky(['#08060f','#140c24']);crowd2(40,110,3,.35);for(const lx of[60,160,260]){A.c.fillStyle=X.lg(lx,0,lx,190,['rgba(255,240,200,.18)','rgba(255,240,200,0)']);A.c.beginPath();A.c.moveTo(lx-6,0);A.c.lineTo(lx+6,0);A.c.lineTo(lx+50,190);A.c.lineTo(lx-50,190);A.c.closePath();A.c.fill();}
  X.vg(20,186,W-40,10,['#5a8ad8','#2a5aa8']);X.vg(14,196,W-28,30,['#2a3a6a','#141c38']);X.glow(160,190,130,'#ffffff',.08);const c=A.c;for(const px of[30,W-30]){X.vg(px-3,104,6,92,['#e8e8f0','#8a8aa0']);X.rr(px-5,102,10,6,2,'#ff4f6d');}
  [['#ff4f6d',122],['#ffffff',140],['#4dabff',158]].forEach(r=>{X.stroke([[30,r[1]],[W-30,r[1]+2]],r[0],2);});};
 g.draw=()=>{X.cache('box_bg',bg);
  f.forEach((q,i)=>{const d=i?-1:1,y=190,col=i?'#ff4f9a':'#2fd6c3',hurt=q.st>0;X.shadow(q.x,y+1,16,3,.35);A.person(q.x,y,{c:hurt?'#ffffff':col,pants:col,st:q.x*.15,s:1.9,d,id:i*4+1,arm1:-1.4*d,arm2:-1.2*d});A.c.fillStyle='#1a1a1a';A.c.fillRect(q.x-7,y-26,14,3);
   const ext=q.pt>8?(18-q.pt)*2.6:q.pt>0?q.pt*2.2:0,gc=i?'#ff4f6d':'#e83a4a';if(q.blk){X.orb(q.x+d*7,y-50,5.5,gc);X.orb(q.x+d*7,y-41,5.5,gc);}else{X.orb(q.x+d*8,y-34,5.5,gc);X.orb(q.x+d*(10+ext),y-42,5.5,gc);}});
  fx.draw();X.bar();f.forEach((q,i)=>{X.meter(i?W-112:8,6,104,8,q.hp/100,q.hp>30?'#3ddc84':'#ff4f6d');T(A.nm(i),i?W-8:8,16,i?K.p:K.c,1,i?'r':'l');});X.panel(140,2,40,14,time<600?K.r:K.c);T(Math.ceil(time/60),160,4,K.w,2,'c');};
 return g;}});

/* ---- PENALTY KICKS 3D ---- */
A.add({id:'penalty',name:'PENALTY KICKS 3D',cat:'SPORTS',vs:1,how:'HOLD A DIRECTION BEFORE THE WHISTLE. 5 EACH.',make(){
 const g={over:null,score:0},fx=X.fx();let sc=[0,0],rd=0,ph='ready',t=0,sh,kp,res='',bot=null,log=[[],[]],netS=0;
 const pick=()=>({hx:A.ri(3)-1,hy:A.ri(2)});
 g.update=()=>{t++;if(netS)netS--;const s=rd%2,kI=1-s;if(A.cpu&&!bot)bot=pick();
  if(ph==='ready'&&t>=110){const rd_=i=>{if(A.cpu&&i===1)return bot;const k=A.in(human(i));return{hx:ax(k),hy:k.u?1:0};};sh=rd_(s);kp=rd_(kI);
   let miss=(sh.hy&&Math.random()<.18)?'OVER THE BAR!':(sh.hx&&Math.random()<.1)?'WIDE!':'';sh.tx=160+sh.hx*(miss==='WIDE!'?105:60)+rnd(10)-5;sh.ty=miss==='OVER THE BAR!'?58:sh.hy?96:128;
   const saved=!miss&&kp.hx===sh.hx&&(sh.hx===0||(sh.hy?kp.hy===1:(kp.hy===0||Math.random()<.5)));res=miss||(saved?'SAVED!':'GOAL!');ph='fly';t=0;S('shoot');fx.spark(160,212,'#ffffff',6,1.8);}
  else if(ph==='fly'&&t>=36){ph='res';t=0;if(res==='GOAL!'){sc[s]++;S('score');netS=24;fx.spark(sh.tx,sh.ty,K.y,16,3);fx.flash('#ffffff',6);}else{S('hit');fx.spark(sh.tx,sh.ty,'#ffffff',8,2);}log[s].push(res==='GOAL!'?1:0);}
  else if(ph==='res'&&t>=70){rd++;ph='ready';t=0;bot=null;if(rd>=10&&rd%2===0&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);}};
 const bg=()=>{X.sky(['#0a1a3a','#1a3a7a'],100);crowd2(30,100,9,.55);for(const lx of[30,290]){X.glow(lx,26,30,'#ffffff',.4);}X.vg(0,98,W,4,['#e8e8e8','#a0a0a8']);X.turf(0,102,W,138,'#1f7a3a','#26883f',14);X.vg(0,102,W,138,['rgba(0,0,0,.25)','rgba(255,255,255,.04)']);
  const c=A.c;c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.2;c.beginPath();c.moveTo(40,138);c.lineTo(280,138);c.moveTo(60,138);c.lineTo(30,190);c.moveTo(260,138);c.lineTo(290,190);c.stroke();X.disc(160,210,1.6,'#fff');};
 g.draw=()=>{X.cache('pen_bg',bg);const c=A.c,sw=netS?Math.sin(netS*.6)*2:0;
  c.fillStyle='rgba(255,255,255,.1)';c.fillRect(82,74,156,64);c.strokeStyle='rgba(255,255,255,.4)';c.lineWidth=.6;c.beginPath();for(let i=1;i<20;i++){c.moveTo(80+i*8+sw*Math.sin(i),75);c.lineTo(80+i*8,138);}for(let i=1;i<8;i++){c.moveTo(80,72+i*8);c.lineTo(240,72+i*8+sw);}c.stroke();X.vg(78,70,4,68,['#ffffff','#c8c8d0']);X.vg(238,70,4,68,['#ffffff','#c8c8d0']);X.hg(78,70,164,4,['#ffffff','#e0e0e8','#ffffff']);
  const s=rd%2,f=ph==='ready'?0:ph==='fly'?Math.min(1,t/36):1;let kx=160,ky=138;if(ph!=='ready'){kx=160+kp.hx*52*f;ky=138-(kp.hy?26:kp.hx?6:0)*f;}
  const kc=(1-s)?'#ff4f9a':'#2fd6c3';c.save();c.translate(kx,ky);if(ph!=='ready'&&kp.hx)c.rotate(kp.hx*1.3*f);A.person(0,0,{s:1.1,c:kc,pants:'#222',d:1,id:7,arm1:-2.6,arm2:2.6});X.orb(-11,-32,3,'#ffcf3f');X.orb(11,-32,3,'#ffcf3f');c.restore();
  let bx=160,by=212,br=7;if(ph!=='ready'){bx=160+(sh.tx-160)*f;by=212+(sh.ty-212)*f-Math.sin(f*3.14)*14;br=7-4*f;}X.shadow(bx,ph==='ready'?218:212-f*70,br,br*.3,.3);sball(bx,by,br,f*8);
  if(ph==='ready'){const run=Math.min(1,t/100);A.person(132+run*14,236,{s:1.3,c:s?'#ff4f9a':'#2fd6c3',pants:'#f2f2f2',d:1,id:2,st:t*.15,num:s?9:10});X.ot(A.nm(s)+' SHOOTS   '+A.nm(1-s)+' IN GOAL',160,24,K.w,1,'c');X.ot(t<70?'HOLD YOUR DIRECTION...':'WHISTLE!',160,36,t<70?K.y:K.g,2,'c');}
  if(ph==='res')X.ot(res,160,36,res==='GOAL!'?K.y:K.c,3,'c');fx.draw();X.bar();A.hud2(sc[0],sc[1]);log.forEach((a,i)=>a.slice(-8).forEach((v,j)=>X.disc(i?W-12-j*8:10+j*8,22,2.6,v?'#3ddc84':'#ff4f6d')));};
 return g;}});

/* ---- 100M DASH ---- */
A.add({id:'dash100',name:'100M DASH',cat:'SPORTS',vs:1,how:'TAP LEFT-RIGHT-LEFT FAST.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',fin:0},{p:0,v:0,last:'',fin:0}],t=-180;
 g.update=()=>{t++;if(t<0)return;if(t===0){S('shoot');fx.flash('#ffffff',6);}
  for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){const tv=2.1+1.9*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.42;}q.v*=.965;}
   q.p+=q.v*.5;if(q.v>2&&A.t%4===0)fx.spark(40+q.p-(Math.max(r[0].p,r[1].p)-100)-4,150+i*55,'#e8a070',1,1);if(q.p>=1000){q.fin=t;S('coin');}}
  if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 g.draw=()=>{const c=A.c,cam=Math.max(r[0].p,r[1].p)-100;X.cache('dash_sky',()=>{X.sky(['#3a8ae0','#a8d8f8'],60);});
  c.fillStyle='#3a3a48';c.fillRect(0,40,W,50);for(let y=44;y<88;y+=5)for(let x=0;x<W+6;x+=6){const xx=((x-cam*.5)%W+W)%W,k=((x/6|0)*7+y)%5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84'][k];c.globalAlpha=.6;c.fillRect(xx,y,4,3);}c.globalAlpha=1;c.fillStyle='#e8e8f0';c.fillRect(0,88,W,3);
  X.vg(0,91,W,149,['#d8603a','#c4552d','#a8462a']);c.fillStyle='rgba(255,255,255,.9)';for(const y of[118,150,180,205,232])c.fillRect(0,y,W,1.2);
  for(let m=0;m<=1000;m+=100){const x=m-cam+40;if(x>-20&&x<W+20){c.fillStyle=m===1000?'#ffffff':'rgba(255,255,255,.5)';c.fillRect(x,91,m===1000?4:2,149);if(m===1000){for(let y=91;y<240;y+=6){c.fillStyle='#111';c.fillRect(x,y,2,3);c.fillRect(x+2,y+3,2,3);}}if(x>-2&&x<W-24)X.ot(m/10+'M',x+4,96,K.w,1);}}
  r.forEach((q,i)=>{const x=q.p-cam+40,y=150+i*55;X.shadow(x,y,9,2,.3);A.person(x,y,{c:i?'#ff4f9a':'#2fd6c3',pants:'#222',st:q.p*.26,num:i+1,s:1.1,id:i*3});X.ot(A.nm(i),6,y-30,i?K.p:K.c,1);X.meter(6,y-22,40,4,Math.min(1,q.v/4.5),i?'#ff4f9a':'#2fd6c3');});
  fx.draw();X.bar();if(t<0)X.ot(t<-120?'ON YOUR MARKS':t<-50?'SET':'...',160,30,K.y,3,'c');else X.ot((t/60).toFixed(2)+' S',160,22,K.w,2,'c');};
 return g;}});

/* ---- HOME RUN DERBY ---- */
A.add({id:'homerun',name:'HOME RUN DERBY',cat:'SPORTS',how:'A SWINGS AT THE PLATE. 10 PITCHES.',make(){
 const g={over:null,score:0},fx=X.fx();let n=0,z=1,T_=60,cv=0,sw=0,ph='wait',t=0,msg='',hr=0,fly=null,tr=[];
 const pitch=()=>{z=1;T_=34+rnd(34);cv=rnd(2)-1;ph='pitch';sw=0;fly=null;tr=[];};
 g.update=()=>{t++;if(sw>0)sw--;
  if(ph==='wait'){if(t>70){if(n>=10){g.over=hr+' HOME RUNS';return;}n++;pitch();}}
  else if(ph==='pitch'){z-=1/T_;if(A.hit(0).a&&sw===0){sw=14;const off=Math.abs(z-.06);if(off<.1){const ql=1-off/.1,d=Math.round(45+ql*100*(.75+rnd(.35)));g.score+=d;msg=d>=120?'HOME RUN! '+d+'M':d+' METRES';if(d>=120){hr++;S('score');fx.flash('#ffffff',8);A.shake=5;}else S('hit');fx.spark(160,190,'#ffffff',12,3);fx.ring(160,190,K.y,20,12);fly={x:160,y:190,vx:(rnd(2)-1)*2,vy:-3-ql*3};ph='wait';t=0;return;}S('blip');}
   if(z<-.15){msg=sw?'SWING AND A MISS':'STRIKE!';ph='wait';t=0;S('lose');}}
  if(fly){tr.unshift([fly.x,fly.y]);if(tr.length>12)tr.pop();fly.x+=fly.vx;fly.y+=fly.vy;}};
 const bg=()=>{X.sky(['#05061a','#141a40','#24204a'],90);X.stars(40,3,0,0,50,.6);crowd2(54,86,5,.45);for(const lx of[30,110,210,290]){A.c.fillStyle='#555';A.c.fillRect(lx-1,10,2,40);X.rr(lx-10,6,20,8,2,'#d8d8e0');X.glow(lx,10,40,'#fff8d0',.25);}
  A.c.fillStyle='#1a5a2a';A.c.fillRect(0,86,W,4);X.turf(0,90,W,150,'#2a8a3a','#30983f',14);X.poly([[160,236],[60,124],[160,98],[260,124]],X.lg(0,98,0,236,['#c89a5a','#d8a868']));X.poly([[160,224],[90,140],[160,112],[230,140]],'#2a8a3a');const c=A.c;c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=1;c.beginPath();c.moveTo(160,212);c.lineTo(20,90);c.moveTo(160,212);c.lineTo(300,90);c.stroke();
  X.ell(160,118,10,3,'#c89a5a');X.poly([[152,206],[168,206],[168,212],[160,218],[152,212]],'#ffffff');};
 g.draw=()=>{X.cache('hr_bg',bg);const c=A.c;
  A.person(160,118,{s:.65,c:'#4dabff',pants:'#e8e8f0',cap:'#2a4a8a',d:1,id:4,arm2:ph==='pitch'&&z>.85?-2.6:.2});
  const a=sw>0?-1.2+(14-sw)*.28:-2.2;A.person(124,198,{s:1.15,c:'#ff4f6d',pants:'#e8e8f0',cap:'#1a1a3a',d:1,id:2,arm1:a+.4,arm2:a+.2});const hx=124+5-Math.sin(a+.2)*10*1.15,hy=198-21*1.15+Math.cos(a+.2)*10*1.15;X.stroke([[hx,hy],[hx+Math.cos(a)*30,hy+Math.sin(a)*30]],'#d8a060',3.2);X.stroke([[hx,hy],[hx+Math.cos(a)*30,hy+Math.sin(a)*30]],'rgba(255,255,255,.3)',1);
  if(ph==='pitch'){const f=1-z,bx=160+cv*Math.sin(f*3.14)*26,by=108+f*f*100;X.glow(bx,by,4+f*8,'#ffffff',.3);X.orb(bx,by,1.5+f*5,'#ffffff');}
  if(fly){tr.forEach((q,i)=>{c.globalAlpha=.4*(1-i/12);X.disc(q[0],q[1],3-i*.2,'#ffffff');});c.globalAlpha=1;X.glow(fly.x,fly.y,8,'#fff0a0',.5);X.orb(fly.x,fly.y,3,'#ffffff');}
  fx.draw();X.bar('PITCH '+n+'/10',g.score+' M','HOME RUNS '+hr,K.w,K.y);if(ph==='wait'&&msg)X.ot(msg,160,40,msg.startsWith('HOME')?K.y:msg.startsWith('S')?K.r:K.w,2,'c');};
 return g;}});

/* ---- SKI SLALOM ---- */
A.add({id:'ski',name:'SKI SLALOM',cat:'SPORTS',how:'STEER BETWEEN FLAGS. 3 CRASHES = OUT.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,vx=0,ob=[],dist=0,lives=3,inv=0,nextG=120,combo=0,trail=[];
 g.update=()=>{const sp=2+Math.min(3.2,dist/2600);dist+=sp;vx=(vx+ax(A.in(0))*.5)*.88;x=cl(x+vx,10,W-10);if(inv>0)inv--;trail.forEach(q=>q[1]-=sp);trail.unshift([x,64]);if(trail.length>40)trail.pop();if(Math.abs(vx)>2&&A.t%2===0)fx.spark(x,70,'#ffffff',2,1.2);
  if(Math.random()<.05+dist/90000)ob.push({t:0,x:rnd(W),y:H+10,s:.8+rnd(.5)});nextG-=sp;if(nextG<=0){nextG=130;ob.push({t:1,x:50+rnd(W-100),y:H+10,ok:0});}
  for(const o of ob){o.y-=sp;if(o.t===0&&inv===0&&Math.abs(o.x-x)<8&&Math.abs(o.y-64)<8){lives--;inv=70;vx=0;combo=0;S('boom');fx.debris(x,64,'#ffffff',12,2.5);fx.debris(x,64,'#2a7a3a',6,2);fx.flash(K.r,6);if(lives<=0)g.over='WIPEOUT!';}
   if(o.t===1&&!o.ok&&o.y<64){o.ok=1;if(Math.abs(o.x-x)<26){combo++;g.score+=10*combo;S('coin');fx.pop(o.x,o.y-14,'+'+10*combo,K.b);fx.ring(o.x,o.y,'#4dabff',20,10);}else{combo=0;fx.pop(o.x,o.y-14,'MISSED GATE',K.r);}}}
  ob=ob.filter(o=>o.y>-20);if((dist|0)%10<sp)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('ski_bg',()=>{X.vg(0,0,W,H,['#f4f8ff','#dce8f8']);});c.fillStyle='rgba(160,180,220,.3)';for(let i=0;i<20;i++){const y=((i*71-dist)%H+H)%H;c.fillRect((i*53+17)%W,y,8,1);}
  c.strokeStyle='rgba(150,170,210,.6)';c.lineWidth=1;for(const o of[-3,3]){c.beginPath();trail.forEach((q,i)=>i?c.lineTo(q[0]+o,q[1]):c.moveTo(q[0]+o,q[1]));c.stroke();}
  ob.forEach(o=>{if(o.t===0){const s=o.s;X.shadow(o.x+3,o.y+4,8*s,2.5,.15);c.fillStyle='#5b3a1e';c.fillRect(o.x-1.5,o.y,3,5*s);X.poly([[o.x,o.y-18*s],[o.x-9*s,o.y+1],[o.x+9*s,o.y+1]],X.lg(o.x-9,0,o.x+9,0,['#1a6a3a','#2a9a4a','#145a30']));X.poly([[o.x,o.y-18*s],[o.x-5*s,o.y-9*s],[o.x+5*s,o.y-9*s]],'#ffffff');}else{[-26,26].forEach((d,i)=>{c.fillStyle='#333';c.fillRect(o.x+d,o.y-12,1.2,14);X.poly([[o.x+d+1,o.y-12],[o.x+d+9,o.y-9],[o.x+d+1,o.y-6]],i?'#4dabff':'#ff4f6d');});c.globalAlpha=.3;c.fillStyle=o.ok?'#3ddc84':'#4dabff';c.fillRect(o.x-25,o.y+1,50,1.5);c.globalAlpha=1;}});
  if(inv%8<4){c.save();c.translate(x,64);c.rotate(vx*.08);c.fillStyle='#2a2a3a';c.fillRect(-6+vx,4,3,12);c.fillRect(3+vx,4,3,12);A.person(0,8,{s:.5,c:'#ff4f6d',pants:'#2a3a7a',cap:'#ffcf3f',d:1,id:1,arm1:-.6,arm2:.6});c.restore();}
  fx.draw();X.bar('SCORE '+g.score,'',combo>1?'GATE STREAK X'+combo:'');for(let i=0;i<3;i++)X.heart(W-10-i*11,8,1,i<lives?'#ff4f6d':'rgba(255,255,255,.15)');};
 return g;}});

/* ---- ARCHERY ---- */
A.add({id:'archery',name:'ARCHERY',cat:'SPORTS',how:'A LOCKS AIM, A AGAIN FIRES. MIND THE WIND.',make(){
 const g={over:null,score:0},fx=X.fx();let n=0,ph=0,t=0,cx=160,cy=110,wind=0,marks=[],msg='',fly=0,last=null;const nw=()=>{wind=Math.round(rnd(28)-14);ph=0;t=rnd(100)|0;};nw();
 g.update=()=>{t++;if(fly)fly--;const sp=.05+n*.012;if(ph===0){cx=160+Math.sin(t*sp)*70;if(A.hit(0).a){ph=1;t=rnd(100)|0;S('blip');}}
  else if(ph===1){cy=110+Math.sin(t*sp*1.2)*60;if(A.hit(0).a){const x=cx+wind,y=cy+rnd(4)-2,d=Math.hypot(x-160,y-110),p=d<6?10:d<13?8:d<21?6:d<30?4:d<40?2:0;g.score+=p;marks.push([x,y]);last=[x,y];fly=10;msg=p?'+'+p:'MISS';S(p>=8?'score':'hit');fx.spark(x,y,p>=8?K.y:'#ffffff',p>=8?12:5,2);if(p===10){fx.ring(x,y,K.y,24);fx.pop(160,60,'BULLSEYE!',K.y);}ph=2;t=0;}}
  else if(t>60){n++;if(n>=6)g.over='ROUND COMPLETE';else nw();}};
 const bg=()=>{X.sky(['#4a9ae0','#bfe6ff'],170);for(let i=0;i<4;i++){X.disc(30+i*90,40+(i%2)*14,9,'rgba(255,255,255,.9)');X.disc(42+i*90,36+(i%2)*14,11,'rgba(255,255,255,.9)');}X.hills(176,30,'#5aa04a',0,.02,3);X.turf(0,170,W,70,'#3a9a3a','#45a845',12);
  const c=A.c;c.fillStyle='#6a4020';c.fillRect(150,140,4,48);c.fillRect(166,140,4,48);X.shadow(160,190,30,4,.3);X.disc(160,110,44,'#8a6a3a');[[40,'#f4f0e4'],[30,'#222222'],[21,'#2a7ad8'],[13,'#e03040'],[6,'#ffcf3f']].forEach(v=>X.disc(160,110,v[0],X.rg(150,100,v[0]*.2,160,110,v[0],[X.lt(v[1],1.15),v[1]])));c.strokeStyle='rgba(0,0,0,.25)';c.lineWidth=.6;for(const r of[40,30,21,13,6]){c.beginPath();c.arc(160,110,r,0,6.283);c.stroke();}X.disc(160,110,1,'#111');};
 g.draw=()=>{X.cache('arch_bg',bg);const c=A.c;
  marks.forEach((m,i)=>{const fl=(i===marks.length-1&&fly)?Math.sin(fly*2)*1.5:0;c.save();c.translate(m[0],m[1]);c.rotate(-.5+fl*.1);c.fillStyle='#6a4020';c.fillRect(0,-.6,12,1.2);X.poly([[9,-.6],[14,-3.5],[14,-.6]],'#ff4f6d');X.poly([[9,.6],[14,3.5],[14,.6]],'#ff4f6d');c.restore();X.disc(m[0],m[1],1,'#111');});
  if(ph<2){c.globalAlpha=.55;X.stroke([[cx,24],[cx,200]],'#ffffff',1);if(ph===1)X.stroke([[60,cy],[260,cy]],'#ffffff',1);c.globalAlpha=1;const yy=ph?cy:110;X.glow(cx+wind,yy,8,'#ff4f6d',.3);A.ring(cx,yy,4,'#ffffff');X.disc(cx+wind,yy,1.4,'#ff4f6d');}
  const wv=Math.sin(A.t*.2)*2*Math.sign(wind);c.fillStyle='#ddd';c.fillRect(296,150,1.5,40);X.poly([[297,150],[297+Math.sign(wind||1)*Math.min(14,Math.abs(wind))+wv,154],[297,158]],'#ff9838');
  fx.draw();X.bar('ARROW '+Math.min(n+1,6)+'/6','SCORE '+g.score,'',K.w,K.y);X.panel(110,204,100,18,K.c);T('WIND '+(wind>0?'>> ':wind<0?'<< ':'')+Math.abs(wind),160,209,K.c,1,'c');if(ph===2)X.ot(msg,160,30,msg==='MISS'?K.r:K.y,3,'c');};
 return g;}});
})();
