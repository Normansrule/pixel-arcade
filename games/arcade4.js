(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

A.add({id:'lanes',name:'LANE DODGE',cat:'CLASSICS',how:'LEFT/RIGHT CHANGE LANE. GRAB COINS. DODGE TRAFFIC.',make(){
 const g={over:null,score:0};let lane=1,x=160,ob=[],sp=3,d=0,nx=40,inv=0,lives=3;const LX=[100,160,220];
 g.update=()=>{const h=A.hit(0);if(h.l&&lane>0){lane--;S('blip');}if(h.r&&lane<2){lane++;S('blip');}x+=(LX[lane]-x)*.3;sp=3+d/2500;d+=sp;g.score=(d/20|0)+g.bonus|0;if(inv>0)inv--;
  if((nx-=sp)<=0){nx=50+rnd(60);const l=ri(3);ob.push({x:LX[l],y:-30,c:Math.random()<.3,col:[K.r,K.b,K.o,K.p][ri(4)]});}
  for(const o of ob){o.y+=sp*(o.c?1:.6);if(Math.abs(o.x-x)<18&&Math.abs(o.y-200)<24){if(o.c){g.bonus=(g.bonus||0)+25;S('coin');A.burst(o.x,o.y,K.y,10);o.y=999;}else if(inv===0){lives--;inv=60;S('boom');A.burst(x,200,K.r,16,3);if(lives<=0)g.over='CRASHED';}}}ob=ob.filter(o=>o.y<H+30);};g.bonus=0;
 g.draw=()=>{A.cls('#2a5a2a');R(70,0,180,H,'#34343e');for(let i=0;i<2;i++)for(let y=(d*1.2)%40-40;y<H;y+=40)R(129+i*60,y,2,20,K.w);R(66,0,4,H,K.w);R(250,0,4,H,K.w);
  ob.forEach(o=>{if(o.c){C(o.x,o.y,7,K.y);T('$',o.x,o.y-2,K.k,1,'c');}else{R(o.x-13,o.y-20,26,40,o.col);R(o.x-10,o.y-12,20,10,'#9fd8ff');R(o.x-13,o.y+14,5,4,K.y);R(o.x+8,o.y+14,5,4,K.y);}});
  if(inv%8<5){R(x-12,180,24,40,K.c);R(x-9,188,18,9,'#9fd8ff');R(x-12,178,5,4,K.w);R(x+7,178,5,4,K.w);}T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives,W-6,6,K.w,2,'r');};
 return g;}});

A.add({id:'plane',name:'PAPER PLANE',cat:'CLASSICS',how:'HOLD A TO CLIMB. RELEASE TO GLIDE DOWN. COLLECT STARS.',make(){
 const g={over:null,score:0};let y=100,vy=0,d=0,st=[],walls=[],t=0;
 g.update=()=>{t++;vy+=A.in(0).a?-.12:.09;vy=cl(vy,-2.4,2.4);y+=vy;d+=2+t/3000;if(t%70===0)st.push({x:W+10,y:40+rnd(150)});if(t%110===0){const gap=70-Math.min(25,t/200);const gy=40+rnd(160-gap);walls.push({x:W+10,gy,gap});}
  st.forEach(s=>s.x-=2+t/3000);walls.forEach(w=>w.x-=2+t/3000);st=st.filter(s=>{if(Math.hypot(s.x-60,s.y-y)<12){g.score+=10;S('coin');A.burst(s.x,s.y,K.y,8);return false;}return s.x>-10;});walls=walls.filter(w=>w.x>-20);
  if(walls.some(w=>Math.abs(w.x-60)<10&&(y<w.gy||y>w.gy+w.gap))||y<4||y>H-8){g.over='CRUMPLED';S('boom');}if(t%30===0)g.score++;};
 g.draw=()=>{A.skyband?A.skyband('#4dabff','#dff4ff',H):A.cls('#4dabff');for(let i=0;i<5;i++){const cx=((i*90-d*.4)%(W+80)+W+80)%(W+80)-40;C(cx,40+i*30,14,'#ffffff');C(cx+14,44+i*30,10,'#ffffff');}
  walls.forEach(w=>{R(w.x-8,0,16,w.gy,'#8a5c33');R(w.x-8,w.gy+w.gap,16,H,'#8a5c33');R(w.x-10,w.gy-4,20,4,'#5b3a1e');R(w.x-10,w.gy+w.gap,20,4,'#5b3a1e');});
  st.forEach(s=>{A.poly([[s.x,s.y-7],[s.x+2,s.y-2],[s.x+7,s.y-2],[s.x+3,s.y+2],[s.x+5,s.y+7],[s.x,s.y+4],[s.x-5,s.y+7],[s.x-3,s.y+2],[s.x-7,s.y-2],[s.x-2,s.y-2]],K.y,1);});
  const a=Math.atan(vy*.4);A.c.save();A.c.translate(60,y);A.c.rotate(a);A.poly([[12,0],[-10,-7],[-6,0],[-10,6]],K.w,1);A.poly([[12,0],[-6,0],[-10,6]],'#cfd8e8',1);A.c.restore();T(g.score,160,8,K.k,3,'c');};
 return g;}});

A.add({id:'meteors',name:'METEOR SHOWER',cat:'CLASSICS',how:'MOVE. DODGE METEORS. BLUE ORBS GIVE A SHIELD.',make(){
 const g={over:null,score:0};let x=160,m=[],t=0,shield=0;
 g.update=()=>{t++;x=cl(x+ax(A.in(0))*3.2,10,W-10);if(shield>0)shield--;if(t%Math.max(6,24-t/300|0)===0)m.push({x:rnd(W),y:-10,v:1.5+rnd(2)+t/2000,r:4+rnd(7),o:Math.random()<.04});
  for(const o of m){o.y+=o.v;if(Math.hypot(o.x-x,o.y-210)<o.r+8){if(o.o){shield=300;S('coin');o.y=999;}else if(shield>0){A.burst(o.x,o.y,K.c,10);S('hit');o.y=999;}else{g.over='HIT';A.burst(x,210,K.o,30,3);S('boom');}}}m=m.filter(o=>o.y<H+20);if(t%6===0)g.score++;};
 g.draw=()=>{A.cls('#0a0418');for(let i=0;i<40;i++)R((i*83)%W,(i*47+t*.2*(i%3+1))%H,1,1,K.gr);R(0,222,W,18,'#3a2a48');m.forEach(o=>{if(o.o){C(o.x,o.y,6,K.b);return;}for(let k=1;k<5;k++)C(o.x,o.y-k*o.v*2.5,o.r*(1-k*.18),k<2?K.o:'#ff9838');C(o.x,o.y,o.r,'#8a5c33');});
  A.poly([[x,198],[x-10,218],[x+10,218]],K.c,1);R(x-3,206,6,5,'#9fd8ff');if(shield>0&&(shield>60||t%10<5))A.ring(x,210,15,K.b);T('SCORE '+g.score,6,6,K.y,2);};let t2=0;return g;}});

A.add({id:'catcher',name:'STAR CATCHER',cat:'CLASSICS',how:'MOVE THE BASKET. CATCH STARS, AVOID BOMBS. 3 MISSES.',make(){
 const g={over:null,score:0};let x=160,it=[],t=0,miss=0,combo=0;
 g.update=()=>{t++;x=cl(x+ax(A.in(0))*3.6,20,W-20);if(t%Math.max(16,45-t/200|0)===0)it.push({x:20+rnd(W-40),y:-10,v:1.2+rnd(1)+t/2500,b:Math.random()<.22});
  for(const o of it){o.y+=o.v;if(o.y>196&&o.y<212&&Math.abs(o.x-x)<22){o.y=999;if(o.b){miss++;combo=0;S('boom');A.burst(o.x,200,K.r,18,3);}else{combo++;g.score+=10*Math.min(5,1+combo/5|0);S('coin');A.burst(o.x,200,K.y,8);}}else if(o.y>H&&o.y<900&&!o.b){miss++;combo=0;S('lose');o.y=999;}}it=it.filter(o=>o.y<H+10);if(miss>=3)g.over='GAME OVER';};
 g.draw=()=>{A.cls('#1a1238');it.forEach(o=>{if(o.b){C(o.x,o.y,7,'#333344');R(o.x-1,o.y-11,2,4,K.o);}else A.poly([[o.x,o.y-7],[o.x+2,o.y-2],[o.x+7,o.y-2],[o.x+3,o.y+2],[o.x+5,o.y+7],[o.x,o.y+4],[o.x-5,o.y+7],[o.x-3,o.y+2],[o.x-7,o.y-2],[o.x-2,o.y-2]],K.y,1);});
  A.poly([[x-22,200],[x+22,200],[x+16,218],[x-16,218]],'#b5651d',1);for(let i=0;i<4;i++)L(x-18+i*12,202,x-14+i*10,216,'#8a4a1d');R(0,226,W,14,'#2b2257');T('SCORE '+g.score,6,6,K.y,2);T('X'.repeat(miss),W-6,6,K.r,2,'r');if(combo>4)T('COMBO '+combo,160,30,K.c,1,'c');};
 return g;}});

A.add({id:'laserdodge',name:'LASER DODGE',cat:'CLASSICS',how:'MOVE. STAY OFF THE RED LASERS. SURVIVE.',make(){
 const g={over:null,score:0};let p={x:160,y:130},lz=[],t=0;
 g.update=()=>{t++;const k=A.in(0);p.x=cl(p.x+ax(k)*2.6,20,W-20);p.y=cl(p.y+ay(k)*2.6,40,H-20);if(t%Math.max(40,110-t/40|0)===0){const v=Math.random()<.5;lz.push({v,pos:v?20+rnd(W-40):40+rnd(H-60),warn:60,life:40,sweep:Math.random()<.3?(Math.random()<.5?1:-1):0});}
  for(const l of lz){if(l.warn>0)l.warn--;else{l.life--;if(l.sweep)l.pos+=l.sweep*2;if(l.v?Math.abs(p.x-l.pos)<5:Math.abs(p.y-l.pos)<5){g.over='FRIED';A.burst(p.x,p.y,K.r,24,3);S('boom');}}}lz=lz.filter(l=>l.life>0);g.score=t/6|0;};
 g.draw=()=>{A.cls('#0d0926');for(let i=0;i<W;i+=20)R(i,30,1,H,'#1a1440');for(let j=30;j<H;j+=20)R(0,j,W,1,'#1a1440');lz.forEach(l=>{const c=l.warn>0?(l.warn%10<5?'rgba(255,79,109,.35)':'rgba(255,79,109,.1)'):K.r;if(l.v){R(l.pos-(l.warn?1:3),30,l.warn?2:6,H,c);if(!l.warn)R(l.pos-1,30,2,H,K.w);}else{R(0,l.pos-(l.warn?1:3),W,l.warn?2:6,c);if(!l.warn)R(0,l.pos-1,W,2,K.w);}});
  C(p.x,p.y,6,K.c);R(0,0,W,24,K.bg);T('SURVIVED '+g.score,6,6,K.y,2);};
 return g;}});

A.add({id:'orbitguard',name:'ORBIT GUARD',cat:'CLASSICS',how:'LEFT/RIGHT SPIN THE SHIELD. BLOCK ROCKS. 3 HITS AND THE PLANET FALLS.',make(){
 const g={over:null,score:0};let a=0,rocks=[],t=0,hp=3;
 g.update=()=>{t++;a+=ax(A.in(0))*.07;if(t%Math.max(22,70-t/80|0)===0){const r=rnd(6.283);rocks.push({a:r,d:170,v:.8+rnd(.6)+t/4000});}
  for(const r of rocks){r.d-=r.v;if(r.d<52&&r.d>44){let da=((r.a-a)%6.283+9.425)%6.283-3.1416;if(Math.abs(da)<.55){r.d=-1;g.score+=10;S('hit');A.burst(160+Math.cos(r.a)*48,125+Math.sin(r.a)*48,K.c,8);}}if(r.d<28&&r.d>0){r.d=-1;hp--;S('boom');A.burst(160,125,K.o,20,3);if(hp<=0)g.over='PLANET LOST';}}rocks=rocks.filter(r=>r.d>0);};
 g.draw=()=>{A.cls('#05030f');for(let i=0;i<50;i++)R((i*97)%W,(i*53)%H,1,1,K.gr);C(160,125,26,K.b);C(152,118,8,K.g);C(168,132,6,K.g);A.c.strokeStyle=K.c;A.c.lineWidth=5;A.c.beginPath();A.c.arc(160,125,48,a-.5,a+.5);A.c.stroke();
  rocks.forEach(r=>C(160+Math.cos(r.a)*r.d,125+Math.sin(r.a)*r.d,5,'#8d86b8'));T('SCORE '+g.score,6,6,K.y,2);T('HP '+'|'.repeat(hp),W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'chain',name:'CHAIN REACTION',cat:'PUZZLE',how:'ONE SHOT PER LEVEL. MOVE, PRESS A TO BLAST. CHAIN ENOUGH ORBS.',make(){
 const g={over:null,score:0};let lvl=0,orbs,ex,cx=160,cy=120,used,need,wait=0;
 const build=()=>{lvl++;orbs=[];for(let i=0;i<10+lvl*3;i++)orbs.push({x:20+rnd(W-40),y:40+rnd(H-60),vx:rnd(1.2)-.6,vy:rnd(1.2)-.6,c:[K.r,K.y,K.c,K.p,K.g][i%5]});ex=[];used=false;need=Math.min(orbs.length-2,3+lvl*2);wait=0;};build();let got=0;
 g.update=()=>{const k=A.in(0);if(A.mouse&&A.mouse.t>0){cx=A.mouse.x;cy=A.mouse.y;}else{cx=cl(cx+ax(k)*3,10,W-10);cy=cl(cy+ay(k)*3,30,H-10);}
  orbs.forEach(o=>{o.x+=o.vx;o.y+=o.vy;if(o.x<10||o.x>W-10)o.vx*=-1;if(o.y<30||o.y>H-10)o.vy*=-1;});if(!used&&A.hit(0).a){used=true;got=0;ex.push({x:cx,y:cy,r:1,g:1});S('shoot');}
  for(const e of ex){e.r+=e.g*1.2;if(e.r>24)e.g=-.5;for(const o of orbs)if(!o.dead&&Math.hypot(o.x-e.x,o.y-e.y)<e.r){o.dead=1;got++;g.score+=10*got;ex.push({x:o.x,y:o.y,r:1,g:1,c:o.c});S('hit');}}ex=ex.filter(e=>e.r>0);orbs=orbs.filter(o=>!o.dead);
  if(used&&!ex.length){if(wait++>30){if(got>=need){S('win');build();}else g.over='CHAIN TOO SHORT';}}};
 g.draw=()=>{A.cls('#0d0926');orbs.forEach(o=>C(o.x,o.y,5,o.c));ex.forEach(e=>{A.c.globalAlpha=.5;C(e.x,e.y,e.r,e.c||K.w);A.c.globalAlpha=1;A.ring(e.x,e.y,e.r,e.c||K.w);});if(!used){A.ring(cx,cy,24,'rgba(255,255,255,.4)');L(cx-5,cy,cx+5,cy,K.w);L(cx,cy-5,cx,cy+5,K.w);}
  T('LEVEL '+lvl,6,6,K.w,2);T('NEED '+need+'  GOT '+(used?got:0),W-6,6,(used?got:0)>=need?K.g:K.y,2,'r');};
 return g;}});

A.add({id:'helix',name:'HELIX DROP',cat:'CLASSICS',how:'LEFT/RIGHT SLIDE THE FLOORS. DROP THROUGH GAPS. AVOID RED.',make(){
 const g={over:null,score:0};let off=0,by=40,vy=0,fl=[],cam=0;for(let i=0;i<60;i++){const gap=rnd(260),red=i>2?rnd(260):-999;fl.push({y:100+i*60,gap,red,rw:30+Math.min(80,i*3)});}
 const inRange=(v,s,w)=>{const d=((v-s)%320+320)%320;return d<w;};
 g.update=()=>{off+=ax(A.in(0))*3.5;vy+=.3;by+=vy;const bxw=160-off;for(const f of fl){if(vy>0&&by+6>=f.y&&by+6-vy<f.y+2){if(inRange(bxw,f.gap,46)){if(!f.pass){f.pass=1;g.score+=10;S('coin');}}else if(f.red>-999&&inRange(bxw,f.red,f.rw)){g.over='SMASHED';S('boom');A.burst(160,by-cam,K.r,20,3);return;}else{by=f.y-6;vy=-5.2;S('jump');}}}
  const want=by-90;if(want>cam)cam+=(want-cam)*.2;if(fl.every(f=>f.pass))g.over='BOTTOM REACHED! WIN';};
 g.draw=()=>{A.cls('#1a1238');R(150,0,20,H,'#2b2257');fl.forEach(f=>{const y=f.y-cam;if(y<-10||y>H+10)return;for(let x=0;x<W;x+=4){const w=(x+off+320*9)%320;let c='#7a5cd6';if(inRange(w,f.gap,46))continue;if(f.red>-999&&inRange(w,f.red,f.rw))c=K.r;R(x,y,4,8,c);}});C(160,by-cam,6,K.y);T(g.score,160,8,K.w,3,'c');};
 return g;}});

A.add({id:'timing',name:'TIMING BAR',cat:'PUZZLE',how:'PRESS A WHEN THE NEEDLE IS IN THE GREEN. IT SHRINKS.',make(){
 const g={over:null,score:0};let n=0,d=1,zone=[130,190],sp=2,lives=3,fl=0,msg='';const nz=()=>{const w=Math.max(10,60-g.score*2);const s=20+rnd(280-w);zone=[s,s+w];sp=2+g.score*.12;};
 g.update=()=>{if(fl>0)fl--;n+=d*sp;if(n<20||n>300){d*=-1;n=cl(n,20,300);}if(A.hit(0).a){const perfect=Math.abs(n-(zone[0]+zone[1])/2)<3;if(n>=zone[0]&&n<=zone[1]){g.score+=perfect?3:1;msg=perfect?'PERFECT':'GOOD';S(perfect?'coin':'hit');A.burst(n,120,perfect?K.y:K.g,perfect?16:8);nz();}else{lives--;msg='MISS';S('lose');if(lives<=0)g.over='GAME OVER';}fl=30;}};
 g.draw=()=>{A.cls();R(20,110,280,20,K.d);R(zone[0],110,zone[1]-zone[0],20,K.g);R((zone[0]+zone[1])/2-1,110,2,20,K.y);R(n-2,100,4,40,K.w);T('SCORE '+g.score,6,6,K.y,2);T('LIVES '+lives,W-6,6,K.r,2,'r');if(fl)T(msg,160,60,msg==='MISS'?K.r:K.y,3,'c');};
 return g;}});

A.add({id:'colorwheel',name:'COLOR WHEEL',cat:'PUZZLE',how:'LEFT/RIGHT SPIN THE WHEEL. MATCH THE FALLING BALL TO ITS COLOUR.',make(){
 const g={over:null,score:0},CO=[K.r,K.y,K.c,K.p];let a=0,ta=0,ball={y:30,c:0},v=1.2;const nb=()=>{ball={y:30,c:ri(4)};v=1.2+g.score*.08;};nb();
 g.update=()=>{const h=A.hit(0);if(h.l)ta-=1.5708;if(h.r)ta+=1.5708;a+=(ta-a)*.25;ball.y+=v;if(ball.y>=150){const seg=(((Math.round(-ta/1.5708))%4)+4)%4;if(seg===ball.c){g.score++;S('coin');A.burst(160,150,CO[ball.c],12);nb();}else{g.over='WRONG COLOUR';S('boom');}}};
 g.draw=()=>{A.cls('#0d0926');for(let i=0;i<4;i++){A.c.fillStyle=CO[i];A.c.beginPath();A.c.moveTo(160,200);A.c.arc(160,200,50,a+i*1.5708-2.356,a+i*1.5708-.785);A.c.fill();}C(160,200,18,'#0d0926');C(160,ball.y,7,CO[ball.c]);T(g.score,160,8,K.w,3,'c');};
 return g;}});
})();
