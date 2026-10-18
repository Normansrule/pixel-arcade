(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0);
const X=new Proxy({},{get:(_,k)=>A.gx[k]}),ay=k=>(k.d?1:0)-(k.u?1:0),ri=A.ri;
const crowd2=(y0,y1,seed,a)=>{const c=A.c;for(let y=y0;y<y1;y+=5)for(let x=(y/5%2)*3;x<W;x+=6){const k=((x|0)*31+(y|0)*17+seed)%7;c.globalAlpha=a||.5;c.fillStyle=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'][k];c.fillRect(x,y+1,4,4);c.fillStyle=['#f1c7a3','#c68a5e','#6e4428'][k%3];c.fillRect(x+1,y-1,2,2);}c.globalAlpha=1;};
const pbar=(x,y,f)=>{X.panel(x-3,y-3,16,106,'#ffffff');X.rr(x,y,10,100,4,'rgba(0,0,0,.4)');const h=f*96;X.rr(x+1,y+98-h,8,h,3,X.lg(0,y+98,0,y,['#3ddc84','#ffcf3f','#ff4f6d']));};
const CRW2=['#ff4f6d','#4dabff','#ffcf3f','#e8e0d0','#3ddc84','#c86dff','#ff9838'],SKN2=['#f1c7a3','#c68a5e','#6e4428'];
const scr2=(key,fn,off,y0,h,dy)=>{const c=A.c,o=((off%W)+W)%W;c.save();c.beginPath();c.rect(0,y0,W,h);c.clip();c.translate(-o,dy||0);X.cache(key,fn);c.translate(W,0);X.cache(key,fn);c.restore();};
const arena2=(cam,ch)=>{const c=A.c;X.cache('ar2_sky',()=>{const c=A.c;X.sky(['#0c1634','#24427e','#5a8ace'],40);X.stars(30,3,0,0,22,.5);for(const x of[26,294]){c.fillStyle='#2a2e3e';c.fillRect(x-1.5,18,3,10);X.rr(x-10,13,20,8,2,'#3a3e50');for(let i=0;i<4;i++)for(let j=0;j<2;j++)X.disc(x-7+i*4.6,15+j*3.5,1.4,'#fff8e0');}});
 for(const x of[26,294])X.glow(x,17,34,'#fff4d0',.4);
 scr2('ar2_crowd',()=>{const c=A.c;X.vg(0,26,W,8,['#4a4e62','#1c1e2a']);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,26,W,1);X.vg(0,33,W,52,['#1e2030','#2c2e40']);for(let y=35;y<80;y+=5)for(let x=(y/5%2)*2.5;x<W;x+=5){const k=Math.abs(Math.sin(x*12.99+y*78.23)*43758|0)%7;c.globalAlpha=.55+(y-35)/100;c.fillStyle=CRW2[k];c.fillRect(x,y+1,3.6,3.4);c.fillStyle=SKN2[k%3];c.fillRect(x+.8,y-1,2,2);}c.globalAlpha=1;for(let x=38;x<W;x+=80){X.vg(x,33,5,48,['#3a3c4c','#4a4c5c']);c.fillStyle='rgba(255,255,255,.12)';for(let y=35;y<80;y+=4)c.fillRect(x,y,5,1);}X.vg(0,33,W,14,['rgba(0,0,0,.45)','rgba(0,0,0,0)']);c.fillStyle='#9aa0b4';c.fillRect(0,80,W,1.5);},cam*.45,26,56,ch?-Math.abs(Math.sin(A.t*.5))*1.5:0);
 if(A.gfx!=='off')for(let i=0;i<(ch?6:2);i++){c.globalAlpha=Math.random();c.fillStyle='#ffffff';c.fillRect(Math.random()*W,36+Math.random()*42,1.5,1.5);}c.globalAlpha=1;
 scr2('ar2_ads',()=>{const c=A.c,ws=['SPRINT','PIXEL','GO!','ARCADE','RUN','JUMP','FAST','TRACK'],cs=['#d0304e','#1a5ab0','#e8a020','#1a8a5a','#7a3ac0','#e05a20','#2a2a3a','#0a8aa0'];ws.forEach((w,i)=>{X.vg(i*40,82,40,9,[X.lt(cs[i],1.3),cs[i],X.lt(cs[i],.6)]);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(i*40,82,1,9);A.text(w,i*40+20,84,'#ffffff',1,'c');});c.fillStyle='#e8e8f0';c.fillRect(0,91,W,1.5);},cam,82,10);};
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
 /* per-hole course art: surround, green pair, rail, wall material, ambient */
 const TH=[{n:'MEADOW',sr:'grass',r:['#2f7a3a','#1c4f26'],g1:'#2fa65a',g2:'#3ab567',rl:'#a86a34',wl:'#b07a44',wm:'wood',am:'leaf'},
  {n:'SEASIDE',sr:'sand',r:['#e6cf96','#c4a668'],g1:'#27a072',g2:'#31ae7d',rl:'#f0ece0',wl:'#9aa0aa',wm:'stone',am:'gull'},
  {n:'CANYON',sr:'rock',r:['#c4703e','#7c3a20'],g1:'#3a9c48',g2:'#45a954',rl:'#6e4a36',wl:'#c45a34',wm:'brick',am:'dust'},
  {n:'LAGOON',sr:'water',r:['#2f9ad8','#155a8a'],g1:'#28a862',g2:'#33b56c',rl:'#d8c8a0',wl:'#8a5a30',wm:'wood',am:'fish'},
  {n:'TOPIARY',sr:'grass',r:['#3c8a3a','#22562a'],g1:'#34ac5e',g2:'#40ba6a',rl:'#b8b0a0',wl:'#2e7a34',wm:'hedge',am:'petal'},
  {n:'MOONLIT',sr:'night',r:['#1c2650','#0a1028'],g1:'#1d7a5e',g2:'#238868',rl:'#5c5c80',wl:'#6a5ab8',wm:'crystal',am:'fly'}];
 let hi=0,b,ang=0,pow=0,chg=false,st=0,ht,th,wait=0,tr=[],rl=0,intro=0,sink=0;const load=()=>{ht=HO[hi];th=TH[hi];b={x:ht.s[0],y:ht.s[1],vx:0,vy:0};ang=Math.atan2(ht.c[1]-b.y,ht.c[0]-b.x);st=0;tr=[];intro=80;sink=0;};load();
 const inW=(x,y)=>x<13||x>W-13||y<27||y>H-13||ht.w.some(w=>x>w[0]-3&&x<w[0]+w[2]+3&&y>w[1]-3&&y<w[1]+w[3]+3);
 const next=()=>{hi++;if(hi>=HO.length)g.over='COURSE CLEAR!';else load();};
 const bump=(sp)=>{S('blip');fx.spark(b.x,b.y,X.lt(th.wl,1.5),3+(sp*2|0),1.2+sp*.4);if(sp>2.2){A.shake=3;fx.ring(b.x,b.y,'#ffffff',8,10);}};
 g.update=()=>{if(intro>0)intro--;if(wait>0){sink++;if(--wait===0)next();return;}const k=A.in(0),mv=Math.hypot(b.vx,b.vy)>.05;
  if(!mv){b.vx=b.vy=0;ang+=ax(k)*.035;if(k.a){chg=true;pow=.5+.5*Math.sin(A.t*.08-1.57);}else if(chg){chg=false;b.vx=Math.cos(ang)*(1+pow*6);b.vy=Math.sin(ang)*(1+pow*6);st++;g.score++;S('hit');fx.spark(b.x,b.y,'#ffffff',6+(pow*8|0),1.4+pow);fx.ring(b.x,b.y,'#ffffff',6+pow*10,10);if(pow>.85)A.shake=2;}}
  else{const sp=Math.hypot(b.vx,b.vy);rl+=sp/3.6;tr.unshift([b.x,b.y]);if(tr.length>12)tr.pop();b.x+=b.vx;if(inW(b.x,b.y)){b.x-=b.vx;b.vx*=-.8;bump(sp);}b.y+=b.vy;if(inW(b.x,b.y)){b.y-=b.vy;b.vy*=-.8;bump(sp);}b.vx*=.982;b.vy*=.982;
   if(Math.hypot(b.x-ht.c[0],b.y-ht.c[1])<6&&Math.hypot(b.vx,b.vy)<3.2){b.x=ht.c[0];b.y=ht.c[1];b.vx=b.vy=0;wait=50;sink=0;tr=[];S('score');fx.ring(b.x,b.y,'#ffffff',22);fx.ring(b.x,b.y,K.y,34,26);fx.spark(b.x,b.y,K.y,16,2.4);fx.pop(b.x,b.y-30,st===1?'HOLE IN ONE!':st===2?'BIRDIE!':'IN!',K.y);if(st===1){A.confetti();A.shake=6;fx.flash('#fff6c0',8);}else A.shake=2;return;}
   if(Math.hypot(b.vx,b.vy)<=.05&&st>=8){wait=40;}}};
 /* wall: drop shadow, lit top face, darker front face, material texture */
 const wall=w=>{const c=A.c,[x,y,ww,hh]=w,m=th.wm,col=th.wl,fh=Math.min(4,hh*.3);X.rr(x+2,y+3,ww+2,hh+1,3,'rgba(0,0,0,.32)');
  X.rr(x,y+hh-fh-1,ww,fh+1,2,X.lt(col,.5));X.rr(x,y,ww,hh-fh,2,X.lg(x,y,x+ww,y+hh,[X.lt(col,1.3),col,X.lt(col,.78)]));
  c.save();c.beginPath();c.rect(x,y,ww,hh-fh);c.clip();
  if(m==='wood'){c.fillStyle='rgba(0,0,0,.2)';if(ww>hh)for(let i=y+4;i<y+hh;i+=4)c.fillRect(x,i,ww,.6);else for(let i=x+4;i<x+ww;i+=4)c.fillRect(i,y,.6,hh);c.fillStyle='rgba(255,255,255,.12)';for(let i=0;i<8;i++)c.fillRect(x+((i*37)%ww),y+((i*23)%hh),3,1);c.fillStyle='#3a2410';for(let i=0;i<4;i++)c.fillRect(x+2+((i*53)%Math.max(1,ww-4)),y+2+((i*31)%Math.max(1,hh-6)),1,1);}
  else if(m==='brick'||m==='stone'){const bw=m==='brick'?8:11,bh=m==='brick'?4:6;c.fillStyle='rgba(40,20,10,.38)';for(let j=0,yy=y;yy<y+hh;yy+=bh,j++){c.fillRect(x,yy,ww,.7);for(let xx=x+(j%2)*bw/2;xx<x+ww;xx+=bw)c.fillRect(xx,yy,.7,bh);}c.fillStyle='rgba(255,255,255,.14)';for(let j=0,yy=y+1;yy<y+hh;yy+=bh,j++)for(let xx=x+1+(j%2)*bw/2;xx<x+ww;xx+=bw)c.fillRect(xx,yy,bw-2,.8);}
  else if(m==='hedge'){for(let i=0;i<(ww*hh)/14;i++){const px=x+((i*37)%ww),py=y+((i*53)%hh);X.disc(px,py,2.6,i%3?X.lt(col,1.25):X.lt(col,.8));}c.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<ww*hh/30;i++)c.fillRect(x+((i*29)%ww),y+((i*41)%hh),1,1);}
  else if(m==='crystal'){c.fillStyle='rgba(255,255,255,.22)';for(let i=-hh;i<ww;i+=7){c.beginPath();c.moveTo(x+i,y+hh);c.lineTo(x+i+hh,y);c.lineTo(x+i+hh+2,y);c.lineTo(x+i+2,y+hh);c.fill();}}
  c.restore();c.fillStyle='rgba(255,255,255,.35)';c.fillRect(x+2,y+.5,ww-4,1);c.fillRect(x+.5,y+2,1,hh-fh-4);X.rrs(x+.5,y+.5,ww-1,hh-1,2,'rgba(0,0,0,.4)',1);};
 const bg=()=>{const c=A.c,s=th.sr;X.vg(0,0,W,H,th.r);
  /* surround texture */
  if(s==='water'){X.water(0,0,W,H,th.r[0],th.r[1],0);c.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<40;i++)c.fillRect((i*71)%W,(i*43)%H,4,1);}
  else if(s==='night'){X.stars(80,hi+3,0,0,H,.8);}
  else for(let i=0;i<500;i++){c.fillStyle=i%2?'rgba(255,255,255,.08)':'rgba(0,0,0,.12)';c.fillRect((i*67)%W,(i*41+i*i)%H,s==='grass'?1:1.5,s==='grass'?2:1.5);}
  if(s==='grass')for(let i=0;i<26;i++){const x=(i*29)%W,y=233+((i*7)%6);X.disc(x,y,5,X.lt(th.r[1],.8));X.disc(x-1,y-1,4,X.lt(th.r[0],1.1));X.disc(x-2,y-2,1.4,['#ff6fa0','#ffe25a','#ffffff'][i%3]);}
  if(s==='rock')for(let i=0;i<18;i++){const x=(i*37)%W,y=231+((i*5)%8);X.ell(x,y,7,4,X.lt(th.r[1],.9));X.ell(x-1,y-1.5,5,2.5,X.lt(th.r[0],1.15));}
  if(s==='sand')for(let i=0;i<14;i++){const x=(i*61)%W,y=235;X.ell(x,y,3,2,'#f8e8c8');X.ell(x+.5,y+.6,2,1,'#e0a0a0');}
  /* raised rail with bevel */
  X.rr(2,17,W-4,H-19,7,'rgba(0,0,0,.45)');X.rr(4,18,W-8,H-22,6,X.lg(0,18,0,H-4,[X.lt(th.rl,1.25),th.rl,X.lt(th.rl,.6)]));
  c.fillStyle='rgba(255,255,255,.35)';c.fillRect(10,19,W-20,1);c.fillRect(5,24,1,H-34);c.fillStyle='rgba(0,0,0,.3)';c.fillRect(10,H-5,W-20,1);c.fillRect(W-6,24,1,H-34);
  for(let i=14;i<W-10;i+=24){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(i,20.5,1.2,1.2);c.fillRect(i,H-7.5,1.2,1.2);}
  X.rr(9,23,W-18,H-32,3,X.lt(th.rl,.45));
  /* green: diagonal mow checks, grain, sheen, rail shadow */
  c.save();X.rr(10,24,W-20,H-34,3,th.g1);c.clip();c.fillStyle=X.rgba(th.g2,.7);for(let i=-12;i<24;i++)for(let j=0;j<14;j++)if((i+j)%2===0){const x=i*18+j*9,y=24+j*16;c.beginPath();c.moveTo(x,y);c.lineTo(x+18,y);c.lineTo(x+27,y+16);c.lineTo(x+9,y+16);c.fill();}
  for(let i=0;i<700;i++){const h=(i*2654435761)>>>0;c.fillStyle=i%3?'rgba(0,0,0,.08)':'rgba(255,255,255,.08)';c.fillRect(10+h%300,24+(h>>>9)%206,.8,1.6);}
  X.rr(10,24,W-20,H-34,0,X.rg(80,40,10,140,110,260,['rgba(255,255,230,.14)','rgba(0,0,0,0)','rgba(0,0,0,.22)']));
  X.vg(10,24,W-20,5,['rgba(0,0,0,.35)','rgba(0,0,0,0)']);X.hg(10,24,5,H-34,['rgba(0,0,0,.3)','rgba(0,0,0,0)']);
  /* tee mat */
  const [sx,sy]=ht.s;X.rr(sx-10,sy-8,20,16,3,'rgba(0,0,0,.3)');X.rr(sx-10,sy-9,20,16,3,X.lg(0,sy-9,0,sy+7,['#1f7a46','#125530']));c.fillStyle='rgba(255,255,255,.08)';for(let yy=sy-8;yy<sy+6;yy+=2)c.fillRect(sx-9,yy,18,.6);X.rrs(sx-9.5,sy-8.5,19,15,3,'rgba(255,255,255,.25)',1);X.orb(sx-7,sy-11,1.6,'#ff4f6d');X.orb(sx+7,sy-11,1.6,'#ff4f6d');
  /* cup collar */
  const [cx,cy]=ht.c;X.disc(cx,cy,17,X.rg(cx,cy,4,cx,cy,17,[X.lt(th.g2,1.18),X.rgba(th.g2,0)]));
  ht.w.forEach(wall);
  /* cup: liner, depth */
  X.disc(cx,cy,6.6,'#e8e8dc');X.disc(cx,cy,5.6,'#050806');X.ell(cx+.3,cy+1.6,4.6,3.4,'#26302a');X.ell(cx-.3,cy-.4,4.4,3.4,'#030403');X.ell(cx-1.5,cy-5,3,.8,'rgba(255,255,255,.5)');
  X.vignette(.32);};
 const flag=()=>{const c=A.c,[cx,cy]=ht.c,fw=Math.sin(A.t*.15),fw2=Math.sin(A.t*.15+1.4),ph=24;
  /* shadow cast down-right */
  c.globalAlpha=.25;X.stroke([[cx,cy],[cx+12,cy+7]],'#000',1.4);X.poly([[cx+12,cy+7],[cx+19,cy+11+fw*.6],[cx+17,cy+12]],'#000');c.globalAlpha=1;
  c.fillStyle=X.lg(cx-1,0,cx+1,0,['#ffffff','#9a9aa8']);c.fillRect(cx-.7,cy-ph,1.6,ph);X.orb(cx+.1,cy-ph,1.4,'#ffd84a');
  X.poly([[cx+1,cy-ph+1],[cx+7,cy-ph+1+fw2],[cx+13,cy-ph+3+fw],[cx+7,cy-ph+8+fw2*.8],[cx+1,cy-ph+8]],X.lg(cx,0,cx+13,0,['#c8243c','#ff4f6d','#d83050']));
  X.poly([[cx+1,cy-ph+1],[cx+7,cy-ph+1+fw2],[cx+7,cy-ph+3+fw2],[cx+1,cy-ph+3]],'rgba(255,255,255,.25)');A.text(''+(hi+1),cx+5,cy-ph+3,'#ffffff',1,'c',1);};
 const ball=(x,y,r)=>{const c=A.c,sp=Math.hypot(b.vx,b.vy),dx=sp>.05?b.vx/sp:Math.cos(ang),dy=sp>.05?b.vy/sp:Math.sin(ang);X.shadow(x+1.4,y+2,r*1.05,r*.6,.4);X.orb(x,y,r,'#f4f4f0');
  for(let k=0;k<3;k++){const p=rl+k*2.1,cz=Math.cos(p);if(cz<=0)continue;const o=Math.sin(p)*r*.62,px=x+dx*o+(-dy)*(k-1)*r*.38,py=y+dy*o+dx*(k-1)*r*.38;X.ell(px,py,.7*cz+.2,.7,'rgba(90,90,110,'+(.55*cz).toFixed(2)+')');}
  X.ell(x-r*.35,y-r*.4,r*.3,r*.18,'rgba(255,255,255,.9)',-.5);};
 const amb=()=>{const c=A.c,a=th.am,t=A.t;for(let i=0;i<7;i++){const ph=i*1.7,x=(i*53+t*(.25+i*.04))%340-10,y=30+((i*67)%180)+Math.sin(t*.03+ph)*8;
  if(a==='leaf'||a==='petal'){c.save();c.translate(x,y);c.rotate(t*.05+ph);X.ell(0,0,2,1,a==='leaf'?'rgba(200,160,60,.75)':'rgba(255,170,200,.8)');c.restore();}
  else if(a==='fly'){X.glow(x,y,6,'#c8ff6a',.35+.3*Math.sin(t*.1+ph));X.disc(x,y,.8,'#eaffb0');}
  else if(a==='dust'){c.fillStyle='rgba(255,220,180,.35)';c.fillRect(x,y,1.5,1.5);}
  else if(a==='gull'&&i<2){const gx=(t*.6+i*170)%380-30,gy=8+i*218,f=Math.sin(t*.2+i)*2;X.stroke([[gx-4,gy-f],[gx,gy],[gx+4,gy-f]],'#ffffff',1);}
  else if(a==='fish'&&i<3){const fx2=(i*120+t*.3)%W,fy=i%2?10:232;c.globalAlpha=.5+.3*Math.sin(t*.07+i);X.ell(fx2,fy,3,1.4,'#ff9838');c.globalAlpha=1;}}};
 g.draw=()=>{const c=A.c;X.cache('golf2_bg'+hi,bg);
  if(th.wm==='crystal')ht.w.forEach(w=>X.glow(w[0]+w[2]/2,w[1]+w[3]/2,Math.max(w[2],w[3])*.6,'#8a6aff',.12+.06*Math.sin(A.t*.06)));
  const moving=Math.hypot(b.vx,b.vy)>.05,inCup=wait&&b.x===ht.c[0]&&b.y===ht.c[1];
  if(!inCup||sink<14)flag();
  for(let i=1;i<tr.length;i++){c.globalAlpha=.35*(1-i/tr.length);X.stroke([tr[i-1],tr[i]],'#ffffff',3.2*(1-i/tr.length)+.5);}c.globalAlpha=1;
  if(inCup){if(sink<14){const f=1-sink/14;X.orb(b.x+(1-f)*.5,b.y+(1-f),3.6*f+.4,'#f4f4f0');}}else ball(b.x,b.y,4);
  if(!moving&&!wait){const len=chg?24+pow*46:34;for(let i=0;i<9;i++){const u=((i+(A.t*.06)%1)/9),d=7+u*len,a=(1-u)*.9;c.globalAlpha=a;X.disc(b.x+Math.cos(ang)*d,b.y+Math.sin(ang)*d,1.7-u*.8,chg?X.lt('#ffcf3f',1+pow*.3):'#ffffff');}c.globalAlpha=1;
   const ex=b.x+Math.cos(ang)*(7+len),ey=b.y+Math.sin(ang)*(7+len);c.strokeStyle=chg?'rgba(255,207,63,.8)':'rgba(255,255,255,.6)';c.lineWidth=1;c.beginPath();c.arc(ex,ey,3+Math.sin(A.t*.2)*.6,0,6.283);c.stroke();
   if(chg){const px=cl(b.x-20,14,W-54),py=b.y>H-40?b.y-22:b.y+9;X.panel(px,py,40,11,'#ffcf3f');X.meter(px+3,py+3,34,5,pow,pow>.8?'#ff4f6d':pow>.45?'#ffcf3f':'#3ddc84');}}
  amb();fx.draw();X.bar('HOLE '+(hi+1)+'/6','TOTAL '+g.score,'STROKES '+st,K.w,K.y);
  for(let i=0;i<8;i++)X.disc(126+i*9.5,15.5,1.3,i<st?(i<3?'#3ddc84':i<6?'#ffcf3f':'#ff4f6d'):'rgba(255,255,255,.18)');
  if(intro>0&&!st){const a=Math.min(1,intro/15,(80-intro)/10);c.globalAlpha=a;X.panel(105,92,110,40,'#ffcf3f');X.ot('HOLE '+(hi+1),160,98,K.y,2,'c');A.text(th.n,160,118,K.w,1,'c');c.globalAlpha=1;}
  if(wait>0)X.ot(inCup?'IN THE CUP!':'STROKE LIMIT',160,100,inCup?K.y:'#ff6f7f',2,'c');};
 return g;}});

/* ---- BOXING ---- */
A.add({id:'boxing',name:'RING BOXING',cat:'SPORTS',vs:1,how:'A PUNCHES. B BLOCKS. 60 SEC.',make(){
 const g={over:null,score:0},fx=X.fx();let f=[{x:110,hp:100,pt:0,st:0,gh:100,fl:0},{x:210,hp:100,pt:0,st:0,gh:100,fl:0}],time=3600,pow=null,ko=0;
 g.update=()=>{time--;if(pow&&--pow.t<=0)pow=null;f.forEach(q=>{q.gh+=(q.hp-q.gh)*.06;if(q.fl)q.fl--;});
  if(A.cpu){const q=f[1],d=q.x-f[0].x;A.bot({l:d>32||(d>26&&Math.random()<.3),r:d<22||(q.hp<30&&Math.random()<.04),b:f[0].pt>4&&Math.random()<.5+A.ai*.45,a:d<=34&&f[0].pt===0&&Math.random()<.04+.07*A.ai});}
  for(let i=0;i<2;i++){const q=f[i],o=f[1-i],k=A.in(i);q.blk=k.b&&q.pt===0;if(q.st>0){q.st--;continue;}if(!q.blk)q.x+=ax(k)*1.6;
   if(A.hit(i).a&&q.pt===0&&!q.blk){q.pt=18;S('jump');}if(q.pt>0){q.pt--;if(q.pt===11&&Math.abs(q.x-o.x)<36){const hx=(q.x+o.x)/2,hy=148;if(o.blk){o.hp-=1;S('blip');fx.spark(hx,hy-10,'#9fd0ff',7,1.8);fx.ring(o.x+(i?6:-6),hy-8,'#9fd0ff',12,8);}else{const dm=7+rnd(4);o.hp-=dm;o.st=10;o.fl=8;o.x+=i?-6:6;S('hit');A.shake=5;fx.spark(hx,hy,'#ffffff',12,2.8);fx.spark(hx,hy,'#bfe8ff',6,1.6);fx.ring(hx,hy,'#ffcf3f',18,10);pow={x:hx,y:hy-6,t:12,w:['POW!','BAM!','WHAM!'][ri(3)]};if(dm>9.5)fx.pop(o.x,112,'CRIT!','#ff9838');}}}}
  f[0].x=cl(f[0].x,46,W-70);f[1].x=cl(f[1].x,70,W-46);if(f[0].x>f[1].x-22){const m=(f[0].x+f[1].x)/2;f[0].x=m-11;f[1].x=m+11;}
  for(let i=0;i<2;i++)if(f[i].hp<=0){f[i].hp=0;fx.pop(f[i].x,100,'K.O.!',K.y);fx.flash('#ffffff',10);A.shake=10;A.confetti&&A.confetti();g.over=A.win(1-i);return;}
  if(time<=0)g.over=Math.round(f[0].hp)===Math.round(f[1].hp)?'DRAW!':A.win(f[0].hp>f[1].hp?0:1);};
 const BK=150,FR=204;
 const bg=()=>{const c=A.c;X.sky(['#05040c','#120a22','#1a1030']);
  for(let r=0;r<5;r++){const y0=34+r*20;X.vg(0,y0,W,20,['#1a1428','#0e0a18']);c.fillStyle='rgba(255,255,255,.06)';c.fillRect(0,y0,W,1);for(let x=(r%2)*3;x<W;x+=6-r*.4){const k=Math.abs(Math.sin(x*12.99+r*78.2)*43758|0)%7,s=1+r*.18;c.globalAlpha=.16+r*.09;c.fillStyle=CRW2[k];c.fillRect(x,y0+6,4*s,6*s);c.fillStyle=SKN2[k%3];X.disc(x+2*s,y0+4,1.8*s,SKN2[k%3]);}c.globalAlpha=1;}
  X.vg(0,34,W,40,['rgba(0,0,0,.6)','rgba(0,0,0,0)']);
  for(const lx of[70,160,250]){c.fillStyle=X.lg(lx,0,lx,FR,['rgba(255,240,210,.22)','rgba(255,240,210,.02)']);c.beginPath();c.moveTo(lx-5,18);c.lineTo(lx+5,18);c.lineTo(lx+60,FR);c.lineTo(lx-60,FR);c.closePath();c.fill();X.rr(lx-8,16,16,6,2,'#2a2a38');X.disc(lx,21,3,'#fff6dc');}
  X.poly([[54,BK],[W-54,BK],[W-14,FR],[14,FR]],X.lg(0,BK,0,FR,['#1c3e86','#2c5ab8','#3a6ad0']));X.glow(160,178,120,'#bfe0ff',.12);
  c.save();c.translate(160,177);c.scale(1,.32);X.disc(0,0,34,'rgba(255,255,255,.08)');c.strokeStyle='rgba(255,255,255,.25)';c.lineWidth=3;c.beginPath();c.arc(0,0,34,0,6.283);c.stroke();c.restore();T('PX',160,174,'rgba(255,255,255,.3)',1,'c');
  X.poly([[14,FR],[W-14,FR],[W-14,FR+5],[14,FR+5]],'#dce4f0');X.vg(10,FR+5,W-20,30,['#b0203a','#7a1024','#3a0814']);c.fillStyle='rgba(255,255,255,.12)';for(let x=24;x<W-20;x+=36)c.fillRect(x,FR+8,18,2);X.vg(0,FR+35,W,H-FR-35,['#0a0812','#000000']);
  for(const[px,top,bot,col]of[[54,96,BK,'#4dabff'],[W-54,96,BK,'#ff4f6d']]){X.vg(px-2,top,4,bot-top,['#c8ccd8','#6a6e80']);X.rr(px-3.5,top-2,7,10,2,col);}
  for(let r=0;r<3;r++){const y=BK-40+r*13;X.stroke([[54,y],[W-54,y]],['#ff4f6d','#f0f0f8','#4dabff'][r],1.6);}
  X.vignette(.5);};
 const front=()=>{for(let r=0;r<3;r++){const yl=FR-58+r*18;X.stroke([[18,yl],[W-18,yl]],X.rgba(['#ff4f6d','#f0f0f8','#4dabff'][r],.85),2.4);A.c.fillStyle='rgba(255,255,255,.35)';A.c.fillRect(18,yl-1,W-36,.6);}for(const[px,col]of[[14,'#ff4f6d'],[W-14,'#4dabff']]){X.vg(px-3,FR-66,6,70,['#e8ecf4','#7a7e90']);X.rr(px-5,FR-70,10,12,3,col);X.rr(px-4,FR-69,3,10,1.5,'rgba(255,255,255,.35)');}};
 g.draw=()=>{X.cache('box_bg2',bg);const c=A.c;
  if(A.gfx!=='off'&&Math.random()<.12){const x=Math.random()*W,y=40+Math.random()*80;X.glow(x,y,10,'#ffffff',.9);X.disc(x,y,1.2,'#ffffff');}
  f.forEach((q,i)=>{const d=i?-1:1,y=190,col=i?'#ff4f9a':'#2fd6c3',hurt=q.st>0,bob=Math.sin(A.t*.15+i*2)*1.2,lean=q.pt>8?d*.12:hurt?-d*.15:0;X.shadow(q.x,y+1,18,3.5,.45);c.save();c.translate(q.x,y);c.rotate(lean);
   A.person(0,0,{c:q.fl&&q.fl%4<2?'#ffffff':col,pants:i?'#2a1a4a':'#1a2a4a',st:q.x*.15,s:1.9,d,id:i*4+1,arm1:-1.4*d,arm2:-1.2*d});c.fillStyle=i?'#ff4f9a':'#2fd6c3';c.fillRect(-8,-26,16,4);c.fillStyle='#ffffff';c.fillRect(-8,-25,16,1);
   const ext=q.pt>8?(18-q.pt)*2.6:q.pt>0?q.pt*2.2:0,gc=i?'#e8304a':'#d82838';if(q.blk){X.orb(d*8,-51+bob,6.5,gc);X.orb(d*8,-41+bob,6.5,gc);X.glow(d*12,-46,14,'#9fd0ff',.25);}else{X.orb(d*8,-34+bob,6.5,gc);if(ext>14)X.glow(d*(10+ext),-42,12,'#ffcf3f',.3);X.orb(d*(10+ext),-42+bob*.5,6.5,gc);c.fillStyle='#ffffff';c.fillRect(d*(10+ext)-3,-38,6,1.4);}c.restore();});
  front();
  if(pow){const s=1+(12-pow.t)*.06,a=Math.min(1,pow.t/6);c.save();c.globalAlpha=a;c.translate(pow.x,pow.y-(12-pow.t));c.scale(s,s);const st=[];for(let k=0;k<16;k++){const r=k%2?7:15,an=k*.3927;st.push([Math.cos(an)*r,Math.sin(an)*r*.8]);}X.poly(st,'#ffcf3f');X.polys(st,'#ff4f6d',1.2);c.restore();X.ot(pow.w,pow.x,pow.y-(12-pow.t)-3,'#ffffff',1,'c');c.globalAlpha=1;}
  fx.draw();X.bar();f.forEach((q,i)=>{const mx=i?W-114:8;X.meter(mx,5,106,9,q.gh/100,'#ffffff','rgba(0,0,0,.6)');X.meter(mx,5,106,9,q.hp/100,q.hp>30?'#3ddc84':'#ff4f6d','rgba(0,0,0,0)');X.ot(A.nm(i),i?W-8:8,18,i?K.p:K.c,1,i?'r':'l');});const ts=Math.ceil(time/60);X.panel(138,1,44,16,ts<=10?K.r:K.c);T(ts,160,4,ts<=10?'#ff4f6d':K.w,2,'c');};
 return g;}});

/* ---- PENALTY KICKS 3D ---- */
A.add({id:'penalty',name:'PENALTY KICKS 3D',cat:'SPORTS',vs:1,how:'HOLD A DIRECTION BEFORE THE WHISTLE. 5 EACH.',make(){
 const g={over:null,score:0},fx=X.fx();let sc=[0,0],rd=0,ph='ready',t=0,sh,kp,res='',bot=null,log=[[],[]],netS=0,cheer=0,tr=[];
 const pick=()=>({hx:A.ri(3)-1,hy:A.ri(2)});
 /* ball state for the current phase: x, y, radius, spin, ground y */
 const bp=()=>{if(ph==='ready')return[160,212,7,0,218];const f=ph==='fly'?Math.min(1,t/36):1;let x=160+(sh.tx-160)*f,y=212+(sh.ty-212)*f-Math.sin(f*3.14)*14,r=7-4*f,gy=218-78*f;
  if(ph==='res'){const u=Math.min(1,t/24);if(res==='GOAL!'){y=sh.ty+(127-sh.ty)*u*u;gy=130;}else if(res==='SAVED!'){x=sh.tx+((sh.tx-160)||24)*.6*u;y=sh.ty+(150-sh.ty)*u-Math.sin(u*3.14)*24;r=3+2.4*u;gy=140+12*u;}else{x=sh.tx+(sh.tx-160)*.5*u;y=sh.ty-(res==='OVER THE BAR!'?34:6)*u;r=3-u;}}
  return[x,y,r,f*8+(ph==='res'?t*.25:0),gy];};
 g.update=()=>{t++;if(netS)netS--;if(cheer)cheer--;const s=rd%2,kI=1-s;if(A.cpu&&!bot)bot=pick();
  if(ph==='ready'&&t>=110){const rd_=i=>{if(A.cpu&&i===1)return bot;const k=A.in(human(i));return{hx:ax(k),hy:k.u?1:0};};sh=rd_(s);kp=rd_(kI);
   let miss=(sh.hy&&Math.random()<.18)?'OVER THE BAR!':(sh.hx&&Math.random()<.1)?'WIDE!':'';sh.tx=160+sh.hx*(miss==='WIDE!'?105:60)+rnd(10)-5;sh.ty=miss==='OVER THE BAR!'?58:sh.hy?96:128;
   const saved=!miss&&kp.hx===sh.hx&&(sh.hx===0||(sh.hy?kp.hy===1:(kp.hy===0||Math.random()<.5)));res=miss||(saved?'SAVED!':'GOAL!');ph='fly';t=0;tr=[];S('shoot');A.shake=2;fx.spark(160,212,'#ffffff',8,2.2);fx.ring(160,214,'#ffffff',14,12);}
  else if(ph==='fly'&&t>=36){ph='res';t=0;if(res==='GOAL!'){sc[s]++;S('score');netS=30;cheer=100;A.shake=6;fx.spark(sh.tx,sh.ty,K.y,18,3);fx.ring(sh.tx,sh.ty,'#ffffff',34,22);fx.flash('#ffffff',6);A.burst(sh.tx,sh.ty,s?'#ff4f9a':'#2fd6c3',18,2.6);}else if(res==='SAVED!'){S('hit');A.shake=3;fx.spark(sh.tx,sh.ty,'#ffffff',14,2.6);fx.ring(sh.tx,sh.ty,K.y,20);}else{S('hit');fx.spark(sh.tx,sh.ty,'#ffffff',6,1.6);}log[s].push(res==='GOAL!'?1:0);}
  else if(ph==='res'&&t>=70){rd++;ph='ready';t=0;bot=null;tr=[];if(rd>=10&&rd%2===0&&sc[0]!==sc[1])g.over=A.win(sc[0]>sc[1]?0:1);}
  if(ph!=='ready'){const b=bp();tr.unshift([b[0],b[1],b[2]]);if(tr.length>9)tr.pop();}};
 const pitch=()=>{const c=A.c;X.vg(0,92,W,148,['#1a6630','#2a9c4a']);for(let i=0;i<14;i++){const y0=92+148*Math.pow(i/14,1.7),y1=92+148*Math.pow((i+1)/14,1.7);if(i%2){c.fillStyle='rgba(255,255,255,.06)';c.fillRect(0,y0,W,y1-y0);}}
  for(let i=-9;i<9;i+=2)X.poly([[160+i*20,92],[160+(i+1)*20,92],[160+(i+1)*64,H],[160+i*64,H]],'rgba(0,0,0,.06)');X.vg(0,92,W,26,['rgba(0,0,0,.4)','rgba(0,0,0,0)']);
  X.poly([[80,138],[240,138],[252,143],[68,143]],'rgba(0,0,0,.22)');c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.3;c.beginPath();c.moveTo(0,138);c.lineTo(W,138);c.moveTo(58,138);c.lineTo(46,156);c.lineTo(274,156);c.lineTo(262,138);c.moveTo(16,138);c.lineTo(-40,240);c.moveTo(304,138);c.lineTo(360,240);c.stroke();X.ell(160,214,3,1.4,'#ffffff');X.vignette(.32);};
 /* net: back panel, side and roof panels; bul pushes the mesh around the ball */
 const net=(bx,by,bul)=>{const c=A.c,dp=(x,y)=>{if(!bul)return[x,y];const dx=x-bx,dy=y-by,k=bul*Math.exp(-(dx*dx+dy*dy)/500);return[x+dx*k*.06,y+dy*k*.06-k*2];};
  c.fillStyle='rgba(255,255,255,.07)';c.fillRect(92,64,136,64);X.poly([[80,72],[92,64],[92,128],[80,138]],'rgba(255,255,255,.1)');X.poly([[240,72],[228,64],[228,128],[240,138]],'rgba(255,255,255,.1)');X.poly([[80,72],[240,72],[228,64],[92,64]],'rgba(255,255,255,.12)');
  c.strokeStyle='rgba(255,255,255,.42)';c.lineWidth=.55;c.beginPath();for(let i=0;i<=20;i++){const x=92+i*6.8;for(let j=0;j<=8;j++){const p=dp(x,64+j*8);j?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}}for(let j=0;j<=8;j++){const y=64+j*8;for(let i=0;i<=20;i++){const p=dp(92+i*6.8,y);i?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}}
  for(let j=0;j<=6;j++){const u=j/6;for(const sd of[0,1]){const fx_=sd?240:80,bx_=sd?228:92;c.moveTo(fx_,72+66*u);c.lineTo(bx_,64+64*u);}}for(let i=0;i<=3;i++){const u=i/3;c.moveTo(80+(92-80)*u,72-8*u);c.lineTo(240-(240-228)*u,72-8*u);}for(let i=0;i<=16;i++){const x=80+i*10,x2=92+i*8.5;c.moveTo(x,72);c.lineTo(x2,64);}c.stroke();
  X.vg(91,63,2,66,['#d8d8e0','#8a8a94']);X.vg(227,63,2,66,['#d8d8e0','#8a8a94']);X.hg(91,63,138,2,['#b0b0b8','#e8e8f0','#b0b0b8']);};
 const frame=()=>{X.hg(77,70,5,69,['#a8a8b2','#ffffff','#c0c0c8']);X.hg(238,70,5,69,['#c0c0c8','#ffffff','#a8a8b2']);X.vg(77,68,166,5,['#ffffff','#e0e0e8','#9a9aa4']);};
 g.draw=()=>{const c=A.c,s=rd%2,b=bp();arena2(0,cheer>0);X.cache('pen_pitch',pitch);
  const goalIn=ph==='res'&&res==='GOAL!';net(b[0],b[1],netS?netS/30*8*(1+Math.sin(netS*.7)*.3):0);
  const f=ph==='ready'?0:ph==='fly'?Math.min(1,t/36):1;let kx=160,ky=138;if(ph!=='ready'){kx=160+kp.hx*52*f;ky=138-(kp.hy?26:kp.hx?6:0)*f;}
  const drawBall=()=>{tr.forEach((q,i)=>{c.globalAlpha=(1-i/9)*.28;X.disc(q[0],q[1],q[2]*(1-i*.06),'#ffffff');});c.globalAlpha=1;X.shadow(b[0],b[4],b[2],b[2]*.3,.3);sball(b[0],b[1],b[2],b[3]);};
  if(goalIn)drawBall();
  const kc=(1-s)?'#ff4f9a':'#2fd6c3';X.shadow(kx,139,10,2.4,.3);c.save();c.translate(kx,ky);if(ph!=='ready'&&kp.hx)c.rotate(kp.hx*1.3*f);else c.translate(0,Math.abs(Math.sin(A.t*.12))*-1.5);A.person(0,0,{s:1.2,c:kc,pants:'#222',d:1,id:7,arm1:-2.6,arm2:2.6});X.orb(-12,-35,3.4,'#ffcf3f');X.orb(12,-35,3.4,'#ffcf3f');if(A.gfx!=='off')X.glow(0,-35,18,'#ffcf3f',.18);c.restore();
  frame();
  if(ph==='ready'){const run=Math.min(1,t/100);A.person(132+run*14,236,{s:1.3,c:s?'#ff4f9a':'#2fd6c3',pants:'#f2f2f2',d:1,id:2,st:t*.15,num:s?9:10});}else A.person(146,236,{s:1.3,c:s?'#ff4f9a':'#2fd6c3',pants:'#f2f2f2',d:1,id:2,st:ph==='fly'&&t<12?1.3:0,num:s?9:10});
  if(!goalIn)drawBall();
  if(ph==='ready'&&!A.two&&t>20){const k=A.in(0),hx=ax(k),hy=k.u?1:0,pl=A.t*.1;if(s===0){const tx=160+hx*60,ty=hy?96:128;c.globalAlpha=.55+.3*Math.sin(pl);c.strokeStyle='#ffcf3f';c.lineWidth=1.4;c.beginPath();c.arc(tx,ty,8,0,6.283);c.moveTo(tx-12,ty);c.lineTo(tx-4,ty);c.moveTo(tx+4,ty);c.lineTo(tx+12,ty);c.moveTo(tx,ty-12);c.lineTo(tx,ty-4);c.moveTo(tx,ty+4);c.lineTo(tx,ty+12);c.stroke();c.globalAlpha=1;}else{const gx=160+hx*52,gy=138-(hy?26:hx?6:0)-34;c.globalAlpha=.5+.25*Math.sin(pl);X.orb(gx-5,gy,4,'#2fd6c3');X.orb(gx+5,gy,4,'#2fd6c3');c.globalAlpha=1;}}
  if(ph==='ready'){X.ot(A.nm(s)+' SHOOTS   '+A.nm(1-s)+' IN GOAL',160,24,K.w,1,'c');X.ot(t<70?'HOLD YOUR DIRECTION...':'WHISTLE!',160,36,t<70?K.y:K.g,2,'c');}
  if(ph==='res'){X.ot(res,160,42-6,res==='GOAL!'?K.y:K.c,3,'c');}
  fx.draw();X.bar();A.hud2(sc[0],sc[1]);log.forEach((a,i)=>a.slice(-8).forEach((v,j)=>{const x=i?W-12-j*8:10+j*8;X.disc(x,22,3.4,'rgba(0,0,0,.5)');X.orb(x,22,2.6,v?'#3ddc84':'#ff4f6d');}));};
 return g;}});

/* ---- 100M DASH ---- */
A.add({id:'dash100',name:'100M DASH',cat:'SPORTS',vs:1,how:'TAP LEFT-RIGHT-LEFT FAST.',make(){
 const g={over:null,score:0},fx=X.fx();let r=[{p:0,v:0,last:'',fin:0},{p:0,v:0,last:'',fin:0}],t=-180,cam=-100,ch=0;const sx=p=>p-cam+40;
 g.update=()=>{t++;if(ch)ch--;if(t<0)return;if(t===0){S('shoot');fx.flash('#ffffff',6);A.shake=2;}
  for(let i=0;i<2;i++){const q=r[i];if(q.fin)continue;if(A.cpu&&i===1){const tv=2.1+1.9*A.ai;q.v+=(tv-q.v)*.05+rnd(.1)-.05;}else{const h=A.hit(i);for(const n of['l','r'])if(h[n]&&q.last!==n){q.last=n;q.v+=.42;}q.v*=.965;}
   q.p+=q.v*.5;if(q.v>2&&A.t%4===0)fx.spark(sx(q.p)-4,150+i*55,'#f0a080',1,1);if(q.p>=1000){q.fin=t;S('coin');ch=90;fx.flash(i?'#ff4f9a':'#2fd6c3',8);A.burst(sx(q.p),150+i*55-20,i?'#ff4f9a':'#2fd6c3',24,2.6);A.shake=3;fx.pop(sx(q.p),150+i*55-52,(t/60).toFixed(2)+' S',K.y);}}
  cam=Math.max(r[0].p,r[1].p)-100;if(r[0].fin||r[1].fin){const w=!r[1].fin?0:!r[0].fin?1:r[0].fin<=r[1].fin?0:1;g.over=A.win(w);}};
 const trk=()=>{const c=A.c;X.vg(0,92,W,148,['#b84a2a','#d0583a','#c4552d','#a8462a']);c.fillStyle='rgba(0,0,0,.05)';for(let i=0;i<500;i++)c.fillRect((i*131)%W,92+(i*67)%148,1,1);for(const[y0,y1]of[[122,156],[177,211]])X.vg(0,y0,W,y1-y0,['rgba(255,255,255,.05)','rgba(255,255,255,0)']);c.fillStyle='rgba(255,255,255,.85)';for(const y of[121,156,211,236])c.fillRect(0,y,W,1.3);X.vg(0,236,W,4,['#3a7a3a','#2a5a2a']);};
 g.draw=()=>{const c=A.c,PCs=['#2fd6c3','#ff4f9a'];arena2(cam,ch);X.cache('dash_trk',trk);c.fillStyle='rgba(255,255,255,.45)';for(let x=-((cam%25)+25)%25;x<W;x+=25)for(const y of[156,211])c.fillRect(x,y-3,1.2,3);
  for(let m=0;m<=1000;m+=100){const x=sx(m);if(x>-20&&x<W+20){if(m===1000){for(let y=122;y<236;y+=4){c.fillStyle=((y-122)/4)%2?'#111':'#fff';c.fillRect(x,y,3,4);c.fillStyle=((y-122)/4)%2?'#fff':'#111';c.fillRect(x+3,y,3,4);}c.fillStyle='#d0d0d8';c.fillRect(x-1,96,2,26);c.fillRect(x+6,96,2,26);X.rr(x-8,94,24,9,2,'#d0304e');T('FINISH',x+4,96,'#ffffff',1,'c');}else{c.fillStyle='rgba(255,255,255,.5)';c.fillRect(x,122,2,114);X.rr(x-8,95,20,9,2,'rgba(10,20,40,.75)');T(m/10+'M',x+2,97,'#ffffff',1,'c');}}}
  r.forEach((q,i)=>{const y=150+i*55,bx=sx(-6);if(bx>-20){c.fillStyle='#8a8e9a';c.fillRect(bx-6,y-4,10,4);X.rr(bx-6,y-8,4,6,1,'#c0c4d0');X.rr(bx+1,y-6,4,4,1,'#c0c4d0');if(sx(-40)>10)X.ot(''+(i+1),sx(-40),y-24,'rgba(255,255,255,.5)',3,'c');}
   const x=sx(q.p);if(q.fin&&x<W+20){c.fillStyle='rgba(255,255,255,.8)';c.fillRect(sx(1000)+3,y-16,1,2);}if(q.v>2.6&&A.gfx!=='off'){c.fillStyle=X.rgba(PCs[i],.35);for(let k=0;k<5;k++)c.fillRect(x-14-k*9-(A.t*3+k*7)%9,y-24+k*5,8,1);}X.shadow(x,y+1,9,2,.35);A.person(x,y,{c:PCs[i],pants:'#222',st:t<0?0:q.p*.26,num:i+1,s:1.12,id:i*3});X.ot(A.nm(i),cl(x,14,W-14),y-42,i?K.p:K.c,1,'c');X.meter(6,y-22,40,4,Math.min(1,q.v/4.5),PCs[i]);if(q.fin)X.ot((q.fin/60).toFixed(2)+' S',cl(x,20,W-20),y-52,K.y,1,'c');});
  fx.draw();X.bar();r.forEach((q,i)=>{T(A.nm(i),i?W-6:6,4,PCs[i],1,i?'r':'l');X.meter(i?W-86:6,11,80,4,Math.min(1,q.p/1000),PCs[i]);});if(t<0)X.ot(t<-120?'ON YOUR MARKS':t<-50?'SET':'...',160,50,K.y,3,'c');else{X.ot((t/60).toFixed(2)+' S',160,4,K.w,2,'c');if(t<40)X.ot('GO!',160,50,'#3dff8b',3,'c');}};
 return g;}});

/* ---- HOME RUN DERBY ---- */
A.add({id:'homerun',name:'HOME RUN DERBY',cat:'SPORTS',how:'A SWINGS AT THE PLATE. 10 PITCHES.',make(){
 const g={over:null,score:0},fx=X.fx();let n=0,z=1,T_=60,cv=0,sw=0,ph='wait',t=0,msg='',hr=0,fly=null,tr=[],res=[],cj=0,mk=null;
 const pitch=()=>{z=1;T_=34+rnd(34);cv=rnd(2)-1;ph='pitch';sw=0;fly=null;tr=[];mk=null;};
 const bpos=zz=>{const f=1-zz;return[160+cv*Math.sin(f*3.14)*26,108+f*f*100];};
 g.update=()=>{t++;if(sw>0)sw--;if(cj){cj--;if(cj%11===0){const fx_=40+rnd(240),fy=26+rnd(30),col=['#ffcf3f','#ff4f6d','#4dabff','#3ddc84','#ffffff'][ri(5)];fx.spark(fx_,fy,col,16,2.6);fx.ring(fx_,fy,col,18,16);S('blip');}}
  if(ph==='wait'){if(t>70){if(n>=10){g.over=hr+' HOME RUNS';return;}n++;pitch();}}
  else if(ph==='pitch'){z-=1/T_;if(A.hit(0).a&&sw===0){sw=14;const off=Math.abs(z-.06);if(off<.1){const ql=1-off/.1,d=Math.round(45+ql*100*(.75+rnd(.35))),p=bpos(z);g.score+=d;msg=d>=120?'HOME RUN!':d+' METRES';
    fx.spark(p[0],p[1],'#ffffff',16,3.6);fx.spark(p[0],p[1],'#ffcf3f',8,2.4);fx.ring(p[0],p[1],K.y,26,12);
    if(d>=120){hr++;res.push(2);S('score');fx.flash('#ffffff',9);A.shake=7;cj=66;}else{res.push(1);S('hit');A.shake=2;}
    const ty=208-Math.min(d,150)*1.02,tx=160+(rnd(1.4)-.7)*(208-ty);fly={x0:p[0],y0:p[1],tx,ty,u:0,h:50+Math.min(1,(d-45)/100)*80,d,x:p[0],y:p[1],gy:p[1]};ph='wait';t=0;return;}S('blip');}
   if(z<-.15){msg=sw?'SWING AND A MISS':'STRIKE!';res.push(0);ph='wait';t=0;S('lose');A.shake=1;}}
  if(fly&&fly.u<1){fly.u=Math.min(1,fly.u+1/52);const u=fly.u;fly.x=fly.x0+(fly.tx-fly.x0)*u;fly.gy=fly.y0+(fly.ty-fly.y0)*u;fly.y=fly.gy-Math.sin(Math.PI*u)*fly.h;tr.unshift([fly.x,fly.y]);if(tr.length>14)tr.pop();
   if(u>=1){mk={x:fly.tx,y:fly.ty,d:fly.d};if(fly.d>=120){fx.spark(fly.tx,fly.ty,'#ffffff',10,2);fx.pop(fly.tx,fly.ty-10,fly.d+'M',K.y);}else{fx.debris(fly.tx,fly.ty,'#a8743a',8,1.4);fx.ring(fly.tx,fly.ty,'#ffffff',10,12);fx.pop(fly.tx,fly.ty-10,fly.d+'M','#ffffff');}}}};
 const bg=()=>{const c=A.c;X.sky(['#03040f','#0d1438','#2a2860'],96);X.stars(46,3,0,0,40,.7);
  X.vg(122,19,76,25,['#20242e','#0c0e14']);X.rrs(122.5,19.5,75,24,2,'#4a5060',1);X.rr(125,22,70,19,1,X.lg(0,22,0,41,['#0a1430','#050a1a']));
  for(const lx of[26,294]){X.vg(lx-1.5,30,3,16,['#4a4e5c','#2a2e3a']);X.rr(lx-12,20,24,11,2,'#3a3e4c');for(let i=0;i<5;i++)for(let j=0;j<2;j++)X.disc(lx-9.6+i*4.8,23+j*4.6,1.6,'#fffbe8');X.glow(lx,25,60,'#fff4d0',.45);}
  X.glow(160,150,190,'#9ad8ff',.12);
  X.vg(0,74,W,14,['#1f6a3c','#103a22']);c.fillStyle='#ffcf3f';c.fillRect(0,73,W,1.5);c.fillStyle='rgba(0,0,0,.28)';for(let x=0;x<W;x+=20)c.fillRect(x,75,1,13);[[40,'330'],[160,'410'],[280,'330']].forEach(q=>T(q[1],q[0],78,'#f4f0e0',1,'c'));
  X.vg(0,88,W,7,['#8a5a32','#a8743a']);
  X.vg(0,95,W,145,['#1f7a34','#2fa048']);for(let i=0;i<9;i++){const y0=95+i*i*1.9,y1=95+(i+1)*(i+1)*1.9;if(i%2){c.fillStyle='rgba(255,255,255,.055)';c.fillRect(0,y0,W,y1-y0);}}c.fillStyle='rgba(0,0,0,.05)';for(let i=-8;i<9;i+=2){c.beginPath();c.moveTo(160+i*12,95);c.lineTo(160+i*40,240);c.lineTo(160+(i+1)*40,240);c.lineTo(160+(i+1)*12,95);c.fill();}
  X.poly([[160,240],[52,128],[160,96],[268,128]],X.lg(0,96,0,240,['#b8844a','#d8a868','#c89458']));X.poly([[160,222],[88,140],[160,110],[232,140]],X.lg(0,110,0,222,['#2a8a3a','#36a44a']));
  for(const q of[[88,140],[160,110],[232,140]]){X.shadow(q[0]+1,q[1]+2,4,1.6,.3);X.rr(q[0]-3.5,q[1]-2,7,4,1,'#ffffff');}
  X.ell(160,118,13,4.5,X.lg(0,113,0,123,['#d8a868','#a8743a']));X.rr(157,116.5,6,1.6,0,'#ffffff');
  c.strokeStyle='rgba(255,255,255,.85)';c.lineWidth=1.1;c.beginPath();c.moveTo(160,212);c.lineTo(14,90);c.moveTo(160,212);c.lineTo(306,90);c.stroke();c.lineWidth=.8;c.strokeStyle='rgba(255,255,255,.6)';c.strokeRect(132,196,20,22);c.strokeRect(168,196,20,22);
  X.shadow(160,214,12,3,.3);X.poly([[152,206],[168,206],[168,212],[160,218],[152,212]],'#ffffff');X.vignette(.4);};
 const crowd=()=>{const c=A.c;X.vg(0,44,W,30,['#161828','#262a3e']);for(let y=46;y<72;y+=5)for(let x=(y/5%2)*2.5;x<W;x+=5){const k=Math.abs(Math.sin(x*12.99+y*78.23)*43758|0)%7;c.globalAlpha=.5+(y-46)/60;c.fillStyle=CRW2[k];c.fillRect(x,y+1,3.6,3.4);c.fillStyle=SKN2[k%3];c.fillRect(x+.8,y-1,2,2);}c.globalAlpha=1;c.fillStyle='#9aa0b4';c.fillRect(0,72,W,1.2);};
 const ball=(x,y,r,rot)=>{const c=A.c;X.orb(x,y,r,'#ffffff');if(r>2.4){c.strokeStyle='rgba(220,40,50,.8)';c.lineWidth=Math.max(.5,r*.16);c.beginPath();c.arc(x-r*.9,y,r*.75,-.9+rot,.9+rot);c.stroke();c.beginPath();c.arc(x+r*.9,y,r*.75,Math.PI-.9+rot,Math.PI+.9+rot);c.stroke();}};
 g.draw=()=>{X.cache('hr_bg2',bg);const c=A.c,on=A.gfx!=='off';
  scr2('hr_crowd',crowd,0,44,30,cj?-Math.abs(Math.sin(A.t*.5))*2.2:0);if(on)for(let i=0;i<(cj?7:1);i++){c.globalAlpha=Math.random();c.fillStyle='#ffffff';c.fillRect(Math.random()*W,48+Math.random()*22,1.5,1.5);}c.globalAlpha=1;
  T('DERBY',160,24,'#ffcf3f',1,'c');for(let i=0;i<10;i++){const r_=res[i],col=r_===2?'#ffcf3f':r_===1?'#7fd0ff':r_===0?'#ff4f6d':'#2a3048';X.disc(130+i*6.6,36,2.2,col);if(r_===2&&on)X.glow(130+i*6.6,36,5,'#ffcf3f',.4);}
  if(mk){X.shadow(mk.x,mk.y+1,4,1.4,.35);X.stroke([[mk.x,mk.y],[mk.x,mk.y-9]],'#ffffff',1);X.poly([[mk.x,mk.y-9],[mk.x+6,mk.y-7.5],[mk.x,mk.y-6]],mk.d>=120?'#ffcf3f':'#ff4f6d');}
  const wu=ph==='pitch'&&z>.8?(z-.8)*5:0;A.person(160,118,{s:.68,c:'#4dabff',pants:'#e8e8f0',cap:'#2a4a8a',d:1,id:4,arm2:ph==='pitch'&&z>.85?-2.6:.2,arm1:-wu*.8});
  if(ph==='pitch'){const p=bpos(z),f=1-z,cp=bpos(.06),near=Math.abs(z-.06)<.1;if(on&&z<.45){c.globalAlpha=Math.min(1,(.45-z)*3);A.ring(cp[0],cp[1],7+(near?1.5:0),near?'#3dff8b':'rgba(255,255,255,.5)');if(near)X.glow(cp[0],cp[1],12,'#3dff8b',.25);c.globalAlpha=1;}
   X.shadow(p[0],p[1]+3+(1-f)*8,1+f*4,.5+f*1.2,.3);for(let i=1;i<5;i++){const q=bpos(z+i*.025);c.globalAlpha=.18*(1-i/5);X.disc(q[0],q[1],1.5+(1-z-i*.025)*5,'#ffffff');}c.globalAlpha=1;X.glow(p[0],p[1],4+f*9,'#ffffff',.35);ball(p[0],p[1],1.5+f*5,A.t*.4);}
  const a=sw>0?-1.2+(14-sw)*.28:-2.2,bx=124+5-Math.sin(a+.2)*10*1.2,by=198-21*1.2+Math.cos(a+.2)*10*1.2;
  if(sw>0&&sw<13&&on)for(let k=1;k<4;k++){const aa=a-k*.28;c.globalAlpha=.22/k;X.stroke([[bx,by],[bx+Math.cos(aa)*32,by+Math.sin(aa)*32]],'#ffffff',4);}c.globalAlpha=1;
  A.person(124,200,{s:1.2,c:'#ff4f6d',pants:'#e8e8f0',cap:'#1a1a3a',d:1,id:2,arm1:a+.4,arm2:a+.2});X.stroke([[bx,by],[bx+Math.cos(a)*32,by+Math.sin(a)*32]],'#8a5a2a',3.8);X.stroke([[bx+Math.cos(a)*8,by+Math.sin(a)*8],[bx+Math.cos(a)*32,by+Math.sin(a)*32]],'#e0a868',3.2);X.stroke([[bx+Math.cos(a)*10,by+Math.sin(a)*10-.8],[bx+Math.cos(a)*30,by+Math.sin(a)*30-.8]],'rgba(255,255,255,.4)',1);
  if(fly){const u=fly.u,r=Math.max(1.2,3.6-u*2.2+Math.sin(Math.PI*u)*1.4);X.shadow(fly.x,fly.gy,r*1.1,r*.45,.35*(1-Math.sin(Math.PI*u)*.6));tr.forEach((q,i)=>{c.globalAlpha=.4*(1-i/14);X.disc(q[0],q[1],r*(1-i/16),fly.d>=120?'#ffe080':'#ffffff');});c.globalAlpha=1;if(on)X.glow(fly.x,fly.y,r*3.5,fly.d>=120?'#ffcf3f':'#fff0c0',.5);ball(fly.x,fly.y,r,A.t*.5);}
  fx.draw();X.bar('PITCH '+n+'/10',g.score+' M','HOME RUNS '+hr,K.w,K.y);
  if(ph==='wait'&&msg&&n>0){const big=msg==='HOME RUN!',s=big&&t<10?3:2;X.ot(msg,160+(big&&t<14?(Math.random()-.5)*3:0),big?96:100,big?(A.t%10<5?'#ffcf3f':'#ffffff'):msg.startsWith('S')?K.r:K.w,big?3:s,'c');if(big&&fly)X.ot(fly.d+' METRES',160,122,'#fff3d6',1,'c');}};
 return g;}});

/* ---- SKI SLALOM ---- */
A.add({id:'ski',name:'SKI SLALOM',cat:'SPORTS',how:'STEER BETWEEN FLAGS. 3 CRASHES = OUT.',make(){
 const g={over:null,score:0},fx=X.fx();let x=160,vx=0,ob=[],dist=0,lives=3,inv=0,nextG=120,combo=0,trail=[],sp=2,gf=0,gfc='#3ddc84',spray=[];
 g.update=()=>{sp=2+Math.min(3.2,dist/2600);dist+=sp;vx=(vx+ax(A.in(0))*.5)*.88;x=cl(x+vx,10,W-10);if(inv>0)inv--;if(gf)gf--;trail.forEach(q=>q[1]-=sp);trail.unshift([x,64]);if(trail.length>40)trail.pop();if(Math.abs(vx)>2&&A.t%2===0)fx.spark(x,70,'#ffffff',2,1.2);
  if(Math.abs(vx)>1.2&&inv<50)for(let i=0;i<2;i++)spray.push({x:x-Math.sign(vx)*4,y:72,vx:-vx*.5+rnd(1)-.5,vy:-sp*.4-rnd(1.4),t:16+ri(8),r:1+rnd(1.6)});spray.forEach(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.08;p.t--;});spray=spray.filter(p=>p.t>0);
  if(Math.random()<.05+dist/90000)ob.push({t:0,x:rnd(W),y:H+10,s:.8+rnd(.5)});nextG-=sp;if(nextG<=0){nextG=130;ob.push({t:1,x:50+rnd(W-100),y:H+10,ok:0});}
  for(const o of ob){o.y-=sp;if(o.t===0&&inv===0&&Math.abs(o.x-x)<8&&Math.abs(o.y-64)<8){lives--;inv=70;vx=0;combo=0;S('boom');A.shake=7;fx.debris(x,64,'#ffffff',16,2.8);fx.debris(x,64,'#2a7a3a',8,2.2);fx.ring(x,64,'#ffffff',26,14);fx.flash(K.r,6);o.hit=12;if(lives<=0)g.over='WIPEOUT!';}
   if(o.t===1&&!o.ok&&o.y<64){o.ok=1;if(Math.abs(o.x-x)<26){combo++;o.ok=2;g.score+=10*combo;S('coin');gf=14;gfc=combo>2?'#ffcf3f':'#3ddc84';fx.pop(o.x,o.y-14,'+'+10*combo,combo>2?K.y:K.b);fx.ring(o.x,o.y,'#4dabff',24,12);fx.spark(o.x-26,o.y-8,'#ff4f6d',6,2);fx.spark(o.x+26,o.y-8,'#4dabff',6,2);if(combo>2&&combo%3===0){fx.ring(x,64,'#ffcf3f',40,18);A.shake=2;}}else{combo=0;o.ok=3;fx.pop(o.x,o.y-14,'MISSED GATE',K.r);}}if(o.hit)o.hit--;}
  ob=ob.filter(o=>o.y>-20);if((dist|0)%10<sp)g.score++;};
 /* tileable snow layer: moguls, sparkle, edge forest + safety nets (scrolls vertically) */
 const snow=()=>{const c=A.c;X.vg(0,0,W,H,['#eaf2ff','#f4f8ff','#e6eefc']);X.hg(0,0,60,H,['rgba(120,150,210,.28)','rgba(120,150,210,0)']);X.hg(W-60,0,60,H,['rgba(120,150,210,0)','rgba(120,150,210,.28)']);
  const at=(y,f)=>{f(y);if(y<30)f(y+H);if(y>H-30)f(y-H);};
  for(let i=0;i<22;i++){const mx=40+(i*97)%(W-80),my=(i*61)%H,r=10+(i*7)%10;at(my,yy=>{X.ell(mx+2,yy+2,r,r*.45,'rgba(110,140,200,.18)');X.ell(mx-1,yy-1,r*.8,r*.32,'rgba(255,255,255,.75)');});}
  for(let i=0;i<120;i++){const sx=(i*53)%W,sy=(i*37)%H;c.fillStyle=i%4?'rgba(150,175,225,.35)':'rgba(255,255,255,.95)';c.fillRect(sx,sy,i%4?3+i%5:1,1);}
  for(let y=0;y<H;y+=16)for(const ex of[3,W-3]){at(y+(ex>9?8:0),yy=>{X.shadow(ex+2,yy+3,7,2,.18);c.fillStyle='#4a3020';c.fillRect(ex-1,yy,2,4);X.poly([[ex,yy-15],[ex-7,yy+1],[ex+7,yy+1]],X.lg(ex-7,0,ex+7,0,['#1d5a34','#2e8a4c','#164a2a']));X.poly([[ex,yy-15],[ex-3.5,yy-8],[ex+3.5,yy-8]],'#ffffff');});}
  for(let y=0;y<H;y+=12)for(const nx of[14,W-14]){c.fillStyle='#7a6a5a';c.fillRect(nx-.5,y,1,8);c.fillStyle='rgba(255,120,40,.75)';c.fillRect(nx-(nx<160?0:3),y+1,3,6);}};
 const pine=(px,py,s,hit)=>{const c=A.c,w=hit?Math.sin(hit)*2:0;X.shadow(px+5*s,py+5,11*s,3*s,.22);c.fillStyle='#5b3a1e';c.fillRect(px-1.6*s,py-2,3.2*s,7*s);
  for(let k=0;k<3;k++){const ty=py-k*7*s,tw=(11-k*2.6)*s,th=11*s,sx=px+w*(k+1)*.4;X.poly([[sx,ty-th],[sx-tw,ty+1],[sx+tw,ty+1]],X.lg(sx-tw,0,sx+tw,0,['#16502c','#2e9450','#11401f']));X.poly([[sx,ty-th],[sx-tw*.48,ty-th*.45],[sx-tw*.1,ty-th*.36],[sx+tw*.5,ty-th*.45]],'#ffffff');c.fillStyle='rgba(255,255,255,.5)';c.fillRect(sx-tw+2,ty-.5,tw*.7,1);}};
 const gate=o=>{const c=A.c,wv=Math.sin(A.t*.25+o.x)*1.5;if(o.ok===2){c.globalAlpha=Math.min(1,o.y/40+.2);X.vg(o.x-25,o.y-1,50,4,['rgba(61,220,132,0)','rgba(61,220,132,.5)','rgba(61,220,132,0)']);c.globalAlpha=1;}else if(o.ok!==3){c.globalAlpha=.4;c.setLineDash&&c.setLineDash([3,3]);X.stroke([[o.x-24,o.y+1],[o.x+24,o.y+1]],'#4dabff',1);c.setLineDash&&c.setLineDash([]);c.globalAlpha=1;}
  [-26,26].forEach((d,i)=>{const col=i?'#3a8af0':'#ff3a5a',px=o.x+d;X.shadow(px+3,o.y+2,5,1.6,.25);X.rr(px-1,o.y-20,2.4,22,1,X.lg(px-1,0,px+1.4,0,['#ffffff','#c8ccd8']));for(let k=0;k<3;k++){c.fillStyle=col;c.fillRect(px-1,o.y-18+k*6,2.4,2.5);}
   const fx0=px+(i?-1:2.4),dir=i?-1:1;X.poly([[fx0,o.y-20],[fx0+dir*(12+wv),o.y-18+wv*.4],[fx0+dir*(11+wv),o.y-9],[fx0,o.y-10]],X.lg(fx0,0,fx0+dir*12,0,[X.lt(col,1.3),col,X.lt(col,.7)]));c.fillStyle='rgba(255,255,255,.35)';c.fillRect(i?fx0-9:fx0+1,o.y-18,8,1);X.disc(px+.2,o.y-21,1.6,X.lt(col,1.3));});};
 g.draw=()=>{const c=A.c,o=dist%H;c.save();c.translate(0,-o);X.cache('ski_snow2',snow);c.translate(0,H);X.cache('ski_snow2',snow);c.restore();
  for(const s of[-3.5,3.5]){c.globalAlpha=1;c.strokeStyle='rgba(120,145,200,.5)';c.lineWidth=1.6;c.beginPath();trail.forEach((q,i)=>i?c.lineTo(q[0]+s,q[1]):c.moveTo(q[0]+s,q[1]));c.stroke();c.strokeStyle='rgba(255,255,255,.8)';c.lineWidth=.6;c.beginPath();trail.forEach((q,i)=>i?c.lineTo(q[0]+s+.8,q[1]+.6):c.moveTo(q[0]+s+.8,q[1]+.6));c.stroke();}
  if(sp>3.2){c.fillStyle='rgba(140,165,220,'+((sp-3.2)*.25).toFixed(2)+')';for(let i=0;i<10;i++){const yy=((i*67-dist*2.2)%H+H)%H;c.fillRect(20+(i*131)%(W-40),yy,1,14+sp*3);}}
  const beh=ob.filter(q=>q.y<64),fr=ob.filter(q=>q.y>=64),dr=q=>q.t===0?pine(q.x,q.y,q.s,q.hit):gate(q);beh.forEach(dr);
  const tum=inv>40;if(inv%8<4||tum){c.save();c.translate(x,64);if(tum)c.rotate((70-inv)*.35);else c.rotate(vx*.06);X.shadow(3,12,10,3,.25);const sk=vx*.09;for(const lx of[-4,4]){c.save();c.translate(lx,7);c.rotate(-sk);X.rr(-1.6,-8,3.2,18,1.6,X.lg(-1.6,0,1.6,0,['#ffe07a','#ff9a3a']));c.fillStyle='#2a2a3a';c.fillRect(-1.6,-1,3.2,3);c.restore();}
   X.stroke([[-6,-6],[-9+vx*.4,8]],'#c8ccd8',.8);X.stroke([[6,-6],[9+vx*.4,8]],'#c8ccd8',.8);A.person(0,6,{s:.78,c:'#ff3a6a',pants:'#1e2c6a',cap:'#ffcf3f',d:vx<0?-1:1,id:1,arm1:-.5,arm2:.5});X.rr(-3.4,-16.5,6.8,2,1,'#2a2a3a');c.fillStyle='rgba(120,220,255,.85)';c.fillRect(-2.6,-16.2,5.2,1.2);c.restore();}
  spray.forEach(p=>{c.globalAlpha=Math.min(1,p.t/10);X.disc(p.x,p.y,p.r,'#ffffff');});c.globalAlpha=1;fr.forEach(dr);
  if(A.gfx==='high'){c.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<26;i++){const fy=((i*53+A.t*(.6+i%3*.3))%H),fxx=((i*97+Math.sin(A.t*.02+i)*10)%W+W)%W;c.fillRect(fxx,fy,1+i%2,1+i%2);}}
  if(gf){c.globalAlpha=gf/14*.5;X.rrs(1.5,1.5,W-3,H-3,6,gfc,3);c.globalAlpha=1;}
  fx.draw();X.bar('SCORE '+g.score,'',combo>1?'GATE STREAK X'+combo:'');for(let i=0;i<3;i++)X.heart(W-12-i*14,8,1.2,i<lives?'#ff4f6d':'rgba(255,255,255,.15)');X.panel(6,H-20,62,14,'#4dabff');T((sp*14|0)+' KM/H',37,H-16,'#cfe6ff',1,'c');X.meter(72,H-15,56,5,(sp-2)/3.2,'#4dabff');};
 return g;}});

/* ---- ARCHERY ---- */
A.add({id:'archery',name:'ARCHERY',cat:'SPORTS',how:'A LOCKS AIM, A AGAIN FIRES. MIND THE WIND.',make(){
 const g={over:null,score:0},fx=X.fx();let n=0,ph=0,t=0,cx=160,cy=110,wind=0,marks=[],msg='',fly=0,last=null,pts=[],arr=null,wob=0,mp=0;const nw=()=>{wind=Math.round(rnd(28)-14);ph=0;t=rnd(100)|0;};nw();
 g.update=()=>{t++;if(fly)fly--;if(wob)wob--;if(mp)mp--;if(arr&&++arr.t>=arr.T){const p=arr.p,x=arr.x,y=arr.y;marks.push([x,y]);last=[x,y];fly=10;wob=p?14:0;mp=50;S(p>=8?'score':'hit');fx.spark(x,y,p>=8?K.y:'#ffffff',p>=8?14:6,2.2);fx.debris(x,y,'#e8d8b0',p?3:6,1.4);if(p>=8)A.shake=p===10?5:2;if(p===10){fx.ring(x,y,K.y,30,16);fx.ring(x,y,'#ffffff',18,10);fx.flash('#ffcf3f',5);fx.pop(160,58,'BULLSEYE!',K.y);}else if(p)fx.ring(x,y,'#ffffff',14,10);arr=null;}
  const sp=.05+n*.012;if(ph===0){cx=160+Math.sin(t*sp)*70;if(A.hit(0).a){ph=1;t=rnd(100)|0;S('blip');}}
  else if(ph===1){cy=110+Math.sin(t*sp*1.2)*60;if(A.hit(0).a){const x=cx+wind,y=cy+rnd(4)-2,d=Math.hypot(x-160,y-110),p=d<6?10:d<13?8:d<21?6:d<30?4:d<40?2:0;g.score+=p;pts.push(p);arr={x,y,p,t:0,T:12};msg=p?'+'+p:'MISS';S('shoot');ph=2;t=0;}}
  else if(t>60){n++;if(n>=6)g.over='ROUND COMPLETE';else nw();}};
 const bg=()=>{const c=A.c;X.sky(['#3a86d8','#8cc8f4','#e4f4ff'],150);X.glow(60,30,70,'#fff6d8',.35);X.disc(60,30,10,'#fffbe8');
  for(let i=0;i<5;i++){const x=20+i*72,y=26+(i%2)*16;c.globalAlpha=.92;X.ell(x,y,16,6,'#ffffff');X.disc(x-5,y-3,7,'#ffffff');X.disc(x+5,y-5,9,'#ffffff');X.ell(x,y+3,15,2.5,'rgba(170,200,235,.6)');c.globalAlpha=1;}
  X.hills(128,34,'#8aaed0',0,.018,5);X.hills(140,22,'#5c8a6a',40,.03,2);for(let x=0;x<W;x+=7){const h=10+((x*37)%11);X.poly([[x,146-h],[x-5,148],[x+5,148]],x%14?'#2e6a40':'#245a36');}
  X.vg(0,146,W,94,['#5ab04a','#3e9a3a','#2c7a2c']);c.fillStyle='rgba(255,255,255,.07)';for(let i=-8;i<=8;i+=2){c.beginPath();c.moveTo(160+i*10,146);c.lineTo(160+(i+1)*10,146);c.lineTo(160+(i+1)*44,H);c.lineTo(160+i*44,H);c.closePath();c.fill();}
  for(let j=0;j<6;j++){const yy=146+Math.pow(j/6,1.6)*94;c.fillStyle='rgba(255,255,255,.25)';c.fillRect(0,yy,W,.6);}
  for(const bx of[40,280]){X.shadow(bx,176,22,4,.3);X.rr(bx-20,158,40,18,5,X.lg(0,158,0,176,['#f0d27a','#d0a848','#9a7428']));c.fillStyle='rgba(120,80,20,.35)';for(let k=0;k<4;k++)c.fillRect(bx-18,161+k*4,36,.8);}
  X.shadow(160,192,40,5,.35);X.rr(116,150,88,30,6,X.lg(0,150,0,180,['#e8c870','#c49a40','#8a6a28']));c.fillStyle='rgba(110,70,20,.35)';for(let k=0;k<6;k++)c.fillRect(118,153+k*4.5,84,.8);
  X.stroke([[136,190],[150,112]],'#6a4020',4);X.stroke([[184,190],[170,112]],'#6a4020',4);X.stroke([[160,190],[160,150]],'#5a3418',3);
  X.disc(161,113,46,'rgba(0,0,0,.25)');X.disc(160,110,45,X.lg(0,66,0,156,['#b08a50','#7a5a30']));[[40,'#f4f0e4'],[30,'#262626'],[21,'#2a7ad8'],[13,'#e03040'],[6,'#ffcf3f']].forEach(v=>X.disc(160,110,v[0],X.rg(148,98,v[0]*.1,160,110,v[0],[X.lt(v[1],1.2),v[1],X.lt(v[1],.85)])));c.strokeStyle='rgba(0,0,0,.3)';c.lineWidth=.6;for(const r of[40,35,30,25.5,21,17,13,9.5,6]){c.beginPath();c.arc(160,110,r,0,6.283);c.stroke();}X.disc(160,110,1,'#111');X.ell(144,90,12,5,'rgba(255,255,255,.07)',-.6);};
 const arrow=(x,y,a,s,fl)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);c.fillStyle='#7a4a20';c.fillRect(0,-.7,14,1.4);c.fillStyle='rgba(255,255,255,.4)';c.fillRect(2,-.7,10,.5);X.poly([[10,-.6],[15,-4+fl],[15,-.6]],'#ff4f6d');X.poly([[10,.6],[15,4-fl],[15,.6]],'#ffcf3f');c.restore();};
 g.draw=()=>{const c=A.c,wb=wob?Math.sin(wob*1.3)*wob*.08:0;c.save();if(wob){c.translate(160,190);c.rotate(wb*.02);c.translate(-160,-190);}X.cache('arch_bg2',bg);
  marks.forEach((m,i)=>{const f=(i===marks.length-1&&fly)?Math.sin(fly*2)*1.5:0;X.disc(m[0]+.6,m[1]+.6,1.4,'rgba(0,0,0,.4)');arrow(m[0],m[1],-.5+f*.1,1,0);X.disc(m[0],m[1],1,'#111');});c.restore();
  if(arr){const f=arr.t/arr.T,e=f*f,sx=200,sy=260,x=sx+(arr.x-sx)*e,y=sy+(arr.y-sy)*e-Math.sin(f*3.14)*20;c.globalAlpha=.35;X.stroke([[sx+(arr.x-sx)*Math.max(0,e-.15),sy+(arr.y-sy)*Math.max(0,e-.15)],[x,y]],'#ffffff',2*(1-f)+.5);c.globalAlpha=1;arrow(x,y,Math.atan2(arr.y-sy,arr.x-sx)+3.14,3-2*f,0);}
  if(ph<2){const yy=ph?cy:110;c.globalAlpha=.45;X.stroke([[cx,24],[cx,200]],'#ffffff',1);if(ph===1)X.stroke([[60,cy],[260,cy]],'#ffffff',1);c.globalAlpha=1;X.glow(cx+wind,yy,10,'#ff4f6d',.35);c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=2;c.beginPath();c.arc(cx,yy,6,0,6.283);c.stroke();A.ring(cx,yy,6,'#ffffff');X.stroke([[cx-10,yy],[cx-4,yy]],'#ffffff',1);X.stroke([[cx+4,yy],[cx+10,yy]],'#ffffff',1);X.stroke([[cx,yy-10],[cx,yy-4]],'#ffffff',1);X.stroke([[cx,yy+4],[cx,yy+10]],'#ffffff',1);X.disc(cx+wind,yy,1.6,'#ff4f6d');if(wind)X.stroke([[cx,yy],[cx+wind,yy]],'rgba(255,79,109,.6)',.8);}
  const dr=ph===1?.5+.5*Math.min(1,t/20):ph===0?.2:0,bx=268,by=196;c.save();c.translate(bx,by);c.rotate(-.35);c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=5;c.beginPath();c.arc(14,0,44,2.2,4.1);c.stroke();c.strokeStyle=X.lg(-30,-40,-30,40,['#c87a3a','#7a3a14','#c87a3a']);c.lineWidth=4;c.beginPath();c.arc(12,0,44,2.2,4.1);c.stroke();X.rr(-34,-6,8,12,3,'#2a1a10');
   const sx=12+44*Math.cos(2.2),sy=44*Math.sin(2.2),ex=12+44*Math.cos(4.1),ey=44*Math.sin(4.1),px=-10+dr*26;X.stroke([[sx,sy],[px,0],[ex,ey]],'rgba(240,240,240,.85)',.8);if(ph<2)arrow(px-37,0,0,2.6,0);c.restore();
  const sw=Math.sign(wind||1),wv=Math.sin(A.t*.25)*1.6*sw,wl=Math.min(16,Math.abs(wind)*1.2);X.vg(296,138,2,52,['#ffffff','#9aa0b0']);X.poly([[297,140],[297+sw*wl+wv,143],[297+sw*wl*.9+wv,147],[297,150]],X.lg(297,0,297+sw*wl,0,['#ff7a3a','#ffb050']));c.fillStyle='rgba(255,255,255,.8)';c.fillRect(Math.min(297,297+sw*wl*.5),144,wl*.3,1);
  if(A.gfx==='high'&&wind){c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<6;i++){const xx=((i*61+A.t*wind*.25)%W+W)%W;c.fillRect(xx,40+i*24,8,.6);}}
  fx.draw();X.bar('ARROW '+Math.min(n+1,6)+'/6','SCORE '+g.score,'',K.w,K.y);X.panel(110,204,100,18,K.c);T('WIND '+(wind>0?'>> ':wind<0?'<< ':'')+Math.abs(wind),160,209,K.c,1,'c');
  X.panel(6,22,22,6*13+6,'#ffcf3f');for(let i=0;i<6;i++){const p=pts[i],y=28+i*13;if(p===undefined){X.disc(17,y+4,4,i===n?'rgba(255,207,63,.35)':'rgba(255,255,255,.1)');}else{X.orb(17,y+4,5,p===10?'#ffcf3f':p>=8?'#e03040':p>=6?'#2a7ad8':p?'#4a4a5a':'#2a2a30');T(p?p:'X',17,y+2,p===10||!p?'#1a1a1a':'#ffffff',1,'c');}}
  if(ph===2&&!arr){const s=mp>40?1+(mp-40)*.1:1;X.ot(msg,160,32-(s>1.15?7.5:0),msg==='MISS'?K.r:K.y,s>1.15?4:3,'c');}};
 return g;}});
})();
