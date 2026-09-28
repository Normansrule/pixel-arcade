(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const star=(x,y,r,c)=>A.poly([[x,y-r],[x+r*.3,y-r*.3],[x+r,y-r*.3],[x+r*.45,y+r*.2],[x+r*.65,y+r],[x,y+r*.55],[x-r*.65,y+r],[x-r*.45,y+r*.2],[x-r,y-r*.3],[x-r*.3,y-r*.3]],c,1);

A.add({id:'gravflip',name:'GRAVITY FLIP',cat:'CLASSICS',how:'A FLIPS GRAVITY. RUN ON FLOOR OR CEILING. DODGE THE BLOCKS.',make(){
 const g={over:null,score:0};let y=180,vy=0,gdir=1,ob=[],d=0,nx=80;
 g.update=()=>{const sp=3+d/3000;d+=sp;g.score=d/10|0;if(A.hit(0).a&&(y>=200||y<=40)){gdir*=-1;S('jump');}vy+=.5*gdir;y+=vy;if(y>200){y=200;vy=0;}if(y<40){y=40;vy=0;}
  if((nx-=sp)<=0){nx=70+rnd(90);ob.push({x:W+10,top:Math.random()<.5,h:20+ri(30)});}ob.forEach(o=>o.x-=sp);ob=ob.filter(o=>o.x>-20);
  for(const o of ob)if(o.x<64&&o.x+14>48&&(o.top?y-10<30+o.h:y+10>210-o.h)){g.over='SMASHED';S('boom');A.burst(56,y,K.c,20,3);}};
 g.draw=()=>{A.cls('#140a2a');R(0,0,W,30,'#3a2a78');R(0,210,W,30,'#3a2a78');for(let x=-(d%40);x<W;x+=40){R(x,28,20,2,K.p);R(x+20,210,20,2,K.c);}ob.forEach(o=>o.top?R(o.x,30,14,o.h,K.r):R(o.x,210-o.h,14,o.h,K.r));R(48,y-10,16,20,K.y);R(gdir>0?58:50,gdir>0?y-6:y+2,4,4,K.k);T(g.score,160,40,K.w,3,'c');};
 return g;}});

A.add({id:'bounceball',name:'BOUNCE BALL',cat:'CLASSICS',how:'LEFT/RIGHT STEER THE BOUNCING BALL. LAND ON PLATFORMS. GO HIGH.',make(){
 const g={over:null,score:0};let b={x:160,y:200,vx:0,vy:-7},pl=[],cam=0;for(let i=0;i<14;i++)pl.push({x:30+rnd(260),y:220-i*40,w:50,k:i>4&&Math.random()<.15?'spring':i>6&&Math.random()<.15?'break':'n'});pl[0]={x:160,y:220,w:320,k:'n'};
 g.update=()=>{b.vx=(b.vx+ax(A.in(0))*.4)*.92;b.x=(b.x+b.vx+W)%W;b.vy+=.25;b.y+=b.vy;for(const p of pl){if(p.gone)continue;if(b.vy>0&&b.y+6>=p.y&&b.y+6-b.vy<=p.y+2&&Math.abs(b.x-p.x)<p.w/2+4){b.vy=p.k==='spring'?-11:-7;S('jump');if(p.k==='break'){p.gone=1;A.burst(p.x,p.y-cam,K.o,10);}}}
  if(b.y-140<cam)cam+=(b.y-140-cam)*.1;g.score=Math.max(g.score,(-cam/10)|0);pl.forEach(p=>{if(p.y>cam+H+20){p.y-=14*40;p.x=30+rnd(260);p.gone=0;p.w=Math.max(28,50-g.score/30);p.k=Math.random()<.15?'spring':Math.random()<.2?'break':'n';}});if(b.y>cam+H+30)g.over='FELL';};
 g.draw=()=>{A.cls('#2a5db0');pl.forEach(p=>{if(p.gone)return;const y=p.y-cam;R(p.x-p.w/2,y,p.w,6,p.k==='break'?K.o:p.k==='spring'?K.p:K.g);if(p.k==='spring')R(p.x-4,y-4,8,4,K.y);});C(b.x,b.y-cam,6,K.y);T(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'balloonpop',name:'BALLOON POP',cat:'CLASSICS',mouse:1,how:'AIM WITH MOUSE OR ARROWS. CLICK OR A FIRES. POP BALLOONS, NOT BOMBS. 60 SEC.',make(){
 const g={over:null,score:0};let cx=160,cy=120,bl=[],darts=[],time=3600,combo=0;
 g.update=()=>{time--;if(time<=0){g.over='TIME UP';return;}const k=A.in(0);if(A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*3,5,W-5);cy=cl(cy+ay(k)*3,20,H-5);}
  if(A.fire(6)){darts.push({x:cx,y:cy,t:4});S('shoot');}if(A.t%18===0)bl.push({x:20+rnd(280),y:H+14,v:.6+rnd(1)+(3600-time)/3000,c:[K.r,K.y,K.c,K.p,K.g][ri(5)],bomb:Math.random()<.12,s:rnd(6)});
  for(const d of darts){d.t--;if(d.t===0)for(const b of bl)if(!b.pop&&Math.hypot(b.x-d.x,b.y-d.y)<11){b.pop=1;if(b.bomb){g.score=Math.max(0,g.score-50);combo=0;S('boom');A.burst(b.x,b.y,K.o,20,3);}else{combo++;g.score+=10*Math.min(5,1+combo/5|0);S('coin');A.burst(b.x,b.y,b.c,12,2);}}}darts=darts.filter(d=>d.t>0);
  bl.forEach(b=>{b.y-=b.v;b.x+=Math.sin(A.t*.03+b.s)*.4;});bl=bl.filter(b=>{if(b.y<-20&&!b.pop&&!b.bomb)combo=0;return!b.pop&&b.y>-20;});};
 g.draw=()=>{A.cls('#4dabff');bl.forEach(b=>{C(b.x,b.y,10,b.bomb?'#333344':b.c);L(b.x,b.y+10,b.x+Math.sin(A.t*.1)*2,b.y+22,K.w);if(b.bomb){R(b.x-1,b.y-15,2,5,K.o);T('!',b.x,b.y-3,K.r,1,'c');}});A.ring(cx,cy,7,K.k);L(cx-11,cy,cx+11,cy,K.k);L(cx,cy-11,cx,cy+11,K.k);T('SCORE '+g.score,6,6,K.k,2);T(Math.ceil(time/60),W-6,6,K.k,2,'r');if(combo>4)T('COMBO '+combo,160,8,K.p,1,'c');};
 return g;}});

A.add({id:'missiles',name:'MISSILE DODGE',cat:'CLASSICS',how:'LEFT/RIGHT TURN YOUR JET. OUT-TURN HOMING MISSILES. MAKE THEM COLLIDE.',make(){
 const g={over:null,score:0};let p={x:160,y:120,a:0},ms=[],t=0,stars=[];
 g.update=()=>{t++;p.a+=ax(A.in(0))*.07;p.x+=Math.cos(p.a)*2.2;p.y+=Math.sin(p.a)*2.2;p.x=(p.x+W)%W;p.y=(p.y+H)%H;if(t%Math.max(80,200-t/20|0)===0){const a=rnd(6.28);ms.push({x:p.x+Math.cos(a)*170,y:p.y+Math.sin(a)*170,a:a+3.14,life:600});}
  if(t%120===0)stars.push({x:20+rnd(280),y:30+rnd(190)});stars=stars.filter(s=>{if(Math.hypot(s.x-p.x,s.y-p.y)<12){g.score+=50;S('coin');return false;}return true;});
  for(const m of ms){let da=Math.atan2(p.y-m.y,p.x-m.x)-m.a;while(da>3.14)da-=6.28;while(da<-3.14)da+=6.28;m.a+=cl(da,-.045,.045);m.x+=Math.cos(m.a)*2.6;m.y+=Math.sin(m.a)*2.6;m.life--;if(Math.hypot(m.x-p.x,m.y-p.y)<8){g.over='HIT';S('boom');A.burst(p.x,p.y,K.o,30,3);}}
  for(let i=0;i<ms.length;i++)for(let j=i+1;j<ms.length;j++)if(ms[i].life>0&&ms[j].life>0&&Math.hypot(ms[i].x-ms[j].x,ms[i].y-ms[j].y)<8){ms[i].life=ms[j].life=0;g.score+=100;S('hit');A.burst(ms[i].x,ms[i].y,K.y,16,2.5);}
  ms=ms.filter(m=>m.life>0);if(t%30===0)g.score++;};
 g.draw=()=>{A.cls('#1a2a6a');for(let i=0;i<30;i++)C((i*97)%W,(i*53)%H,6+i%3*4,'rgba(255,255,255,.05)');stars.forEach(s=>star(s.x,s.y,6,K.y));ms.forEach(m=>{L(m.x,m.y,m.x-Math.cos(m.a)*8,m.y-Math.sin(m.a)*8,K.w,2);R(m.x-Math.cos(m.a)*10-1,m.y-Math.sin(m.a)*10-1,3,3,K.o);});
  const c=Math.cos(p.a),s=Math.sin(p.a);A.poly([[p.x+c*9,p.y+s*9],[p.x-c*7-s*7,p.y-s*7+c*7],[p.x-c*4,p.y-s*4],[p.x-c*7+s*7,p.y-s*7-c*7]],K.c,1);T('SCORE '+g.score,6,6,K.y,2);};
 return g;}});

A.add({id:'swing',name:'ROPE SWING',cat:'CLASSICS',how:'HOLD A TO GRAB THE NEAREST HOOK, RELEASE TO FLY. DO NOT TOUCH THE GROUND.',make(){
 const g={over:null,score:0};let p={x:40,y:80,vx:2.5,vy:0},hooks=[],rope=null,cam=0;for(let i=0;i<40;i++)hooks.push({x:80+i*70+rnd(30),y:40+rnd(50)});
 g.update=()=>{if(A.in(0).a){if(!rope){let best=null,bd=1e9;for(const h of hooks){const d=Math.hypot(h.x-p.x,h.y-p.y);if(h.x>p.x-20&&d<bd&&d<140){bd=d;best=h;}}if(best){rope={h:best,len:bd};S('blip');}}}else rope=null;
  p.vy+=.22;if(rope){const dx=p.x-rope.h.x,dy=p.y-rope.h.y,d=Math.hypot(dx,dy);if(d>rope.len){const nx=dx/d,ny=dy/d;p.x=rope.h.x+nx*rope.len;p.y=rope.h.y+ny*rope.len;const vn=p.vx*nx+p.vy*ny;p.vx-=vn*nx;p.vy-=vn*ny;}}p.x+=p.vx;p.y+=p.vy;
  if(p.x-100>cam)cam+=(p.x-100-cam)*.1;g.score=Math.max(g.score,p.x/10|0);if(p.y>225)g.over='HIT THE GROUND';if(hooks[hooks.length-1].x<cam+W)hooks.push({x:hooks[hooks.length-1].x+70+rnd(40),y:40+rnd(50)});};
 g.draw=()=>{A.cls('#ff9a5a');R(0,225,W,15,'#3a2a18');for(let i=0;i<8;i++){const x=((i*60-cam*.4)%W+W)%W;A.poly([[x-40,225],[x,150+(i*17)%40],[x+40,225]],'#6a3a48',1);}hooks.forEach(h=>{const x=h.x-cam;if(x>-10&&x<W+10){C(x,h.y,4,'#444444');A.ring(x,h.y,6,K.k);}});if(rope)L(p.x-cam,p.y,rope.h.x-cam,rope.h.y,K.w,2);C(p.x-cam,p.y,6,K.c);T(g.score+' M',160,8,K.k,3,'c');};
 return g;}});

A.add({id:'firefly',name:'FIREFLY',cat:'CLASSICS',how:'FLY IN THE DARK. EAT LIGHT MOTES TO STAY BRIGHT. SPIDERS FEAR YOUR LIGHT.',make(){
 const g={over:null,score:0};let p={x:160,y:120},glow=60,motes=[],sp=[],t=0;for(let i=0;i<6;i++)motes.push({x:rnd(W),y:rnd(H)});for(let i=0;i<3;i++)sp.push({x:rnd(W),y:rnd(60),vx:0,vy:0});
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*2.4,5,W-5);p.y=cl(p.y+ay(k)*2.4,5,H-5);glow=Math.max(12,glow-.06);motes=motes.filter(m=>{if(Math.hypot(m.x-p.x,m.y-p.y)<10){glow=Math.min(90,glow+14);g.score+=10;S('coin');return false;}return true;});while(motes.length<6)motes.push({x:rnd(W),y:rnd(H)});
  for(const s of sp){const dx=p.x-s.x,dy=p.y-s.y,d=Math.hypot(dx,dy)||1,fear=d<glow*.7;s.vx=(s.vx+(fear?-dx:dx)/d*.06)*.97;s.vy=(s.vy+(fear?-dy:dy)/d*.06)*.97;s.x=cl(s.x+s.vx,0,W);s.y=cl(s.y+s.vy,0,H);if(d<8){g.over='CAUGHT';S('boom');}}if(t%600===0)sp.push({x:rnd(W),y:0,vx:0,vy:0});};
 g.draw=()=>{A.cls('#05030a');motes.forEach(m=>C(m.x,m.y,2+Math.sin(t*.2+m.x)*.8,K.y));sp.forEach(s=>{if(Math.hypot(s.x-p.x,s.y-p.y)<glow+20){C(s.x,s.y,5,'#3a2a48');for(let i=0;i<4;i++){L(s.x-4,s.y-3+i*2,s.x-9,s.y-5+i*3,'#3a2a48');L(s.x+4,s.y-3+i*2,s.x+9,s.y-5+i*3,'#3a2a48');}R(s.x-2,s.y-1,1,1,K.r);R(s.x+1,s.y-1,1,1,K.r);}});
  const c=A.c;if(c.createRadialGradient){const gr=c.createRadialGradient(p.x,p.y,0,p.x,p.y,glow);if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(255,230,120,.35)');gr.addColorStop(1,'rgba(255,230,120,0)');c.fillStyle=gr;c.fillRect(p.x-glow,p.y-glow,glow*2,glow*2);}}C(p.x,p.y,3,'#fff6a0');T('LIGHT '+g.score,6,6,K.y,2);};
 return g;}});

A.add({id:'painter',name:'PIXEL PAINTER',cat:'PUZZLE',how:'MOVE TO PAINT TILES. PAINT 80% BEFORE TIME RUNS OUT. AVOID THE ERASERS.',make(){
 const g={over:null,score:0},GW=20,GH=13;let b=new Uint8Array(GW*GH),p={x:0,y:0,mv:0},er=[],time=3600,lvl=1;const reset=()=>{b.fill(0);p={x:0,y:0,mv:0};er=[];for(let i=0;i<lvl+1;i++)er.push({x:5+ri(14),y:3+ri(9),dx:Math.random()<.5?1:-1,dy:Math.random()<.5?1:-1,mv:0});time=3600;};reset();
 g.update=()=>{time--;if(time<=0){g.over='OUT OF PAINT';return;}const k=A.in(0);if(p.mv>0)p.mv--;else{const dx=ax(k),dy=dx?0:ay(k);if(dx||dy){p.x=cl(p.x+dx,0,GW-1);p.y=cl(p.y+dy,0,GH-1);p.mv=4;if(!b[p.y*GW+p.x]){b[p.y*GW+p.x]=1;g.score++;}}}
  for(const e of er){if(++e.mv>=9-lvl){e.mv=0;if(e.x+e.dx<0||e.x+e.dx>=GW)e.dx*=-1;if(e.y+e.dy<0||e.y+e.dy>=GH)e.dy*=-1;e.x+=e.dx;e.y+=e.dy;b[e.y*GW+e.x]=0;}if(e.x===p.x&&e.y===p.y){g.over='ERASED';S('boom');}}
  const pct=b.reduce((a,v)=>a+v,0)/(GW*GH);if(pct>=.8){g.score+=Math.ceil(time/60)*5;S('win');A.confetti();lvl++;if(lvl>5)g.over='MASTERPIECE! WIN';else reset();}};
 g.draw=()=>{A.cls('#1a1238');const CS=15,OX=10,OY=30;for(let i=0;i<GW*GH;i++){const x=OX+(i%GW)*CS,y=OY+((i/GW)|0)*CS;R(x,y,CS-1,CS-1,b[i]?A.mix('#ff3f8e','#2fe8d0',((i%GW)+(i/GW|0))/30):'#2b2257');}er.forEach(e=>{R(OX+e.x*CS+2,OY+e.y*CS+2,CS-5,CS-5,K.w);R(OX+e.x*CS+4,OY+e.y*CS+5,CS-9,3,K.r);});R(OX+p.x*CS+2,OY+p.y*CS+2,CS-5,CS-5,K.y);
  const pct=b.reduce((a,v)=>a+v,0)/(GW*GH);T((pct*100|0)+'% / 80%',6,8,K.w,2);T('LV '+lvl+'  '+Math.ceil(time/60),W-6,8,K.y,2,'r');};
 return g;}});

A.add({id:'pingbounce',name:'PING BOUNCE',cat:'CLASSICS',how:'ONE BUTTON. A FLIPS THE BALL UP OR DOWN. DODGE THE SPIKES ON THE WALLS.',make(){
 const g={over:null,score:0};let b={x:160,y:120,vx:3,vy:2},sp=[],t=0;const spike=()=>sp.push({side:ri(4),p:40+rnd(W-80),life:300});
 const at=s=>s.side===0?[s.p,34]:s.side===1?[s.p,H-14]:s.side===2?[14,cl(s.p,40,H-20)]:[W-14,cl(s.p,40,H-20)];
 g.update=()=>{t++;if(A.hit(0).a){b.vy*=-1;S('blip');}const sp1=Math.min(4.5,3+t/1500);b.x+=Math.sign(b.vx)*sp1;b.y+=Math.sign(b.vy)*sp1*.7;if(b.x<14||b.x>W-14){b.vx*=-1;b.x=cl(b.x,14,W-14);g.score++;S('hit');if(Math.random()<.5)spike();}if(b.y<34||b.y>H-14){b.vy*=-1;b.y=cl(b.y,34,H-14);g.score++;S('hit');if(Math.random()<.5)spike();}
  for(const s of sp){s.life--;const[x,y]=at(s);if(s.life<260&&Math.hypot(b.x-x,b.y-y)<10){g.over='SPIKED';S('boom');A.burst(b.x,b.y,K.r,20,3);}}sp=sp.filter(s=>s.life>0);};
 g.draw=()=>{A.cls('#0d0926');A.box(10,30,W-20,H-40,K.c);sp.forEach(s=>{const[x,y]=at(s);C(x,y,7,s.life>260?'rgba(255,79,109,.3)':s.life<60&&s.life%10<5?'#661122':K.r);});C(b.x,b.y,6,K.y);T(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'asteroidrain',name:'ASTEROID RAIN',cat:'CLASSICS',how:'LEFT/RIGHT MOVE THE TURRET. HOLD A TO FIRE. PROTECT THE DOMES.',make(){
 const g={over:null,score:0};let x=160,rocks=[],sh=[],domes=[1,1,1,1],t=0;
 g.update=()=>{t++;x=cl(x+ax(A.in(0))*3.2,10,W-10);if(A.fire(6)){sh.push({x,y:206});S('shoot');}sh.forEach(s=>s.y-=6);if(t%Math.max(14,40-t/200|0)===0)rocks.push({x:rnd(W),y:-10,vx:rnd(1)-.5,v:.8+rnd(.8)+t/4000,r:5+rnd(6)});
  for(const r of rocks){r.x+=r.vx;r.y+=r.v;for(const s of sh)if(Math.hypot(s.x-r.x,s.y-r.y)<r.r+2){s.y=-99;r.r-=4;g.score+=10;S('hit');A.burst(r.x,r.y,K.gr,6,2);}if(r.y>210&&r.r>0){const d=cl(Math.floor(r.x/80),0,3);if(domes[d]){domes[d]=0;S('boom');A.burst(40+d*80,215,K.o,20,3);}r.r=0;}}rocks=rocks.filter(r=>r.r>0);sh=sh.filter(s=>s.y>0);if(!domes.some(v=>v))g.over='COLONY LOST';};
 g.draw=()=>{A.cls('#0a0418');for(let i=0;i<40;i++)R((i*97)%W,(i*53)%200,1,1,K.gr);R(0,222,W,18,'#3a2a48');domes.forEach((v,i)=>{if(v){A.c.fillStyle='rgba(47,232,208,.35)';A.c.beginPath();A.c.arc(40+i*80,222,22,3.14,0);A.c.fill();R(30+i*80,212,20,10,'#8d86b8');}});rocks.forEach(r=>C(r.x,r.y,r.r,'#8a5c33'));sh.forEach(s=>R(s.x-1,s.y,2,6,K.y));R(x-8,208,16,8,K.c);R(x-2,200,4,8,K.c);T('SCORE '+g.score,6,6,K.y,2);};
 return g;}});

A.add({id:'dashjump',name:'DASH JUMP',cat:'CLASSICS',how:'A JUMPS. PRESS A AGAIN IN THE AIR TO DASH FORWARD. CLEAR THE GAPS.',make(){
 const g={over:null,score:0};let p={y:180,vy:0,air:false,dash:0,can:true},seg=[],d=0;let x=0;while(x<W*2){const w=60+rnd(100);seg.push({x,w});x+=w+40+rnd(40);}seg[0].x=0;seg[0].w=200;
 g.update=()=>{const sp=3+d/4000+(p.dash>0?4:0);d+=sp;g.score=d/10|0;if(p.dash>0)p.dash--;seg.forEach(s=>s.x-=sp);const l=seg[seg.length-1];if(l.x+l.w<W*2)seg.push({x:l.x+l.w+45+rnd(40+Math.min(40,d/200)),w:50+rnd(90)});seg=seg.filter(s=>s.x+s.w>-20);
  const on=seg.some(s=>60>=s.x&&60<=s.x+s.w);if(A.hit(0).a){if(!p.air&&on){p.vy=-6;p.air=true;S('jump');}else if(p.can){p.dash=14;p.vy=Math.min(p.vy,-1);p.can=false;S('shoot');}}
  if(p.dash<=0)p.vy+=.3;p.y+=p.vy;if(on&&p.y>=180&&p.y<190&&p.vy>=0){p.y=180;p.vy=0;p.air=false;p.can=true;}else if(!on&&!p.air&&p.vy>=0)p.air=true;if(p.y>H+20)g.over='FELL';};
 g.draw=()=>{A.cls('#1a2a6a');for(let i=0;i<5;i++){const x=((i*90-d*.3)%420+420)%420-50;A.poly([[x-50,180],[x,110],[x+50,180]],'#2b3b7a',1);}seg.forEach(s=>{R(s.x,188,s.w,H,'#3a2a78');R(s.x,188,s.w,4,K.c);});if(p.dash>0)for(let i=1;i<4;i++){A.c.globalAlpha=.3/i;R(52-i*10,p.y-8,16,16,K.y);}A.c.globalAlpha=1;R(52,p.y-8,16,16,p.dash>0?K.w:K.y);T(g.score,160,8,K.w,3,'c');};
 return g;}});
})();
