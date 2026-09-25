(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);
const mvCur=(h,c,w,hh)=>{if(h.l)c.x=(c.x+w-1)%w;if(h.r)c.x=(c.x+1)%w;if(h.u)c.y=(c.y+hh-1)%hh;if(h.d)c.y=(c.y+1)%hh;};
const AN=[{n:'LION',c:'#d9a55b',c2:'#8a5c33',cost:60,draw:60,d(x,y,f){R(x-10,y-8,20,14,'#d9a55b');C(x+9,y-8,9,'#8a5c33');C(x+9,y-8,6,'#d9a55b');R(x+7,y-10,2,2,K.k);R(x+11,y-10,2,2,K.k);R(x-8,y+6,3,6,'#d9a55b');R(x+6,y+6,3,6,'#d9a55b');}},
 {n:'PENGUIN',c:K.k,c2:K.w,cost:30,draw:30,d(x,y,f){R(x-6,y-12,12,20,K.k);R(x-4,y-6,8,12,K.w);R(x-2,y-12,2,2,K.w);R(x+3,y-10,3,2,K.o);R(x-5,y+8,4,2,K.o);R(x+1,y+8,4,2,K.o);}},
 {n:'MONKEY',c:'#8a5c33',c2:'#ffd9a8',cost:40,draw:45,d(x,y,f){R(x-7,y-6,14,14,'#8a5c33');C(x,y-11,6,'#8a5c33');R(x-3,y-12,6,5,'#ffd9a8');R(x-2,y-11,1,1,K.k);R(x+1,y-11,1,1,K.k);L(x+7,y+4,x+14,y-6+Math.sin(f*.2)*3,'#8a5c33',2);}},
 {n:'GIRAFFE',c:K.y,c2:'#a0521a',cost:80,draw:70,d(x,y,f){R(x-8,y,16,10,K.y);R(x+3,y-22,5,22,K.y);R(x+2,y-26,10,6,K.y);R(x-6,y+10,3,6,K.y);R(x+4,y+10,3,6,K.y);for(let i=0;i<4;i++)R(x-7+(i%2)*8,y+1+(i/2|0)*5,3,3,'#a0521a');}},
 {n:'PANDA',c:K.w,c2:K.k,cost:100,draw:90,d(x,y,f){R(x-9,y-6,18,14,K.w);C(x-7,y-10,3,K.k);C(x+7,y-10,3,K.k);C(x,y-8,8,K.w);R(x-4,y-10,3,3,K.k);R(x+1,y-10,3,3,K.k);R(x-1,y-6,2,2,K.k);R(x-9,y-4,4,14,K.k);R(x+5,y-4,4,14,K.k);}},
 {n:'FLAMINGO',c:K.p,c2:K.k,cost:50,draw:50,d(x,y,f){C(x,y-2,7,K.p);R(x+2,y-16,3,14,K.p);C(x+4,y-17,4,K.p);R(x+6,y-17,4,2,K.k);R(x-1,y+5,1,10,K.k);}}];

/* ---- PIXEL ZOO ---- */
A.add({id:'zoo',name:'PIXEL ZOO',cat:'SIM',how:'A BUYS AN ANIMAL IN AN EMPTY PEN. B FEEDS (10). HAPPY ANIMALS DRAW PAID VISITORS. 3 MIN.',make(){
 const g={over:null,score:0};let pens=Array(9).fill(null),c={x:0,y:0},money=120,time=10800,vis=[],pick=0,t=0,msg='',mt=0;
 g.update=()=>{t++;time--;if(mt>0)mt--;const h=A.hit(0);mvCur(h,c,3,3);const i=c.y*3+c.x;if(h.l||h.r||h.u||h.d)S('blip');
  if(h.u&&h.d){}if(A.in(0).b&&A.hit(0).l||A.in(0).b&&A.hit(0).r){}
  if(h.a){if(!pens[i]){if(money>=AN[pick].cost){money-=AN[pick].cost;pens[i]={a:pick,hun:100,t:0};S('coin');pick=(pick+1)%AN.length;}else{msg='NEED $'+AN[pick].cost;mt=40;S('lose');}}else{pick=(pick+1)%AN.length;S('blip');}}
  if(h.b&&pens[i]){if(money>=10){money-=10;pens[i].hun=100;S('coin');}else{msg='NO MONEY';mt=40;}}
  let draw=0;pens.forEach((p,j)=>{if(!p)return;p.t++;if(t%30===0)p.hun-=1+(AN[p.a].cost/50|0);if(p.hun<=0){pens[j]=null;msg=AN[p.a].n+' LEFT THE ZOO';mt=60;S('boom');return;}if(p.hun>30)draw+=AN[p.a].draw*(p.hun>70?1:.5);});
  if(t%Math.max(10,120-draw/3|0)===0&&draw>0){vis.push({x:-10,y:225+rnd(10),v:.6+rnd(.6)});money+=3;g.score+=3;}vis.forEach(v=>v.x+=v.v);vis=vis.filter(v=>v.x<W+10);
  if(time<=0){g.score=money;g.over='$'+money+' RAISED';}};
 g.draw=()=>{A.cls('#2a5db0');R(0,40,W,H,'#3f8a3a');for(let i=0;i<9;i++){const x=20+(i%3)*100,y=50+((i/3)|0)*58,p=pens[i];R(x,y,90,50,p?'#5aa54a':'#4a7a3a');A.box(x,y,90,50,'#8a5c33');for(let k=0;k<9;k++)R(x+k*11,y+44,2,6,'#8a5c33');
   if(p){AN[p.a].d(x+45,y+28,p.t);R(x+4,y+4,40,4,K.k);R(x+5,y+5,38*p.hun/100,2,p.hun>30?K.g:K.r);if(p.hun<30&&A.t%20<10)T('!',x+80,y+4,K.r,2);}if(c.y*3+c.x===i)A.box(x-2,y-2,94,54,K.y);}
  R(0,220,W,20,'#8a8a90');vis.forEach(v=>{R(v.x-3,v.y-14,6,10,[K.r,K.c,K.p,K.o][v.x/40&3]);R(v.x-2,v.y-19,4,5,'#ffd9a8');});
  T('$'+money,6,6,K.y,2);T(Math.ceil(time/60),160,6,K.w,2,'c');T('NEXT: '+AN[pick].n+' $'+AN[pick].cost,W-6,6,K.w,1,'r');T('A BUY/SWITCH   B FEED $10',W-6,18,K.gr,1,'r');if(mt>0)T(msg,160,30,K.y,1,'c');};
 return g;}});

/* ---- SAFARI SNAP ---- */
A.add({id:'safari',name:'SAFARI SNAP',cat:'SIM',how:'MOVE THE CAMERA. A SNAPS. CLOSER + CENTRED = MORE POINTS. 24 SHOTS.',make(){
 const g={over:null,score:0};let cx=160,cy=120,an=[],shots=24,fl=0,msg='',mt=0,t=0;
 const spawn=()=>{const a=ri(AN.length),z=.5+rnd(.9);an.push({a,x:Math.random()<.5?-30:W+30,y:100+z*60,z,v:(.4+rnd(.8))*(z),d:0});an[an.length-1].d=an[an.length-1].x<0?1:-1;};for(let i=0;i<3;i++)spawn();
 g.update=()=>{t++;if(fl>0)fl--;if(mt>0)mt--;const k=A.in(0);cx=cl(cx+ax(k)*3,20,W-20);cy=cl(cy+ay(k)*3,60,200);an.forEach(o=>{o.x+=o.d*o.v;});an=an.filter(o=>o.x>-40&&o.x<W+40);if(t%90===0&&an.length<5)spawn();
  if(A.hit(0).a&&shots>0){shots--;fl=6;S('shoot');let best=null,bd=1e9;for(const o of an){const d=Math.hypot(o.x-cx,o.y-cy);if(d<40*o.z&&d<bd){bd=d;best=o;}}if(best){const p=Math.round((40*best.z-bd)/(40*best.z)*50*best.z+10);g.score+=p;msg=AN[best.a].n+' +'+p;S('coin');}else msg='EMPTY SHOT';mt=50;if(shots===0)g.over='FILM FULL';}};
 g.draw=()=>{A.cls('#ffb060');R(0,0,W,90,'#ff9838');C(240,50,16,K.y);R(0,90,W,150,'#c4a54a');for(let i=0;i<8;i++){const x=(i*47+20)%W;R(x,80,3,14,'#5b3a1e');C(x+1,76,8,'#3f8a3a');}
  an.slice().sort((a,b)=>a.z-b.z).forEach(o=>{A.c.save();A.c.translate(o.x,o.y);A.c.scale(o.z*1.3,o.z*1.3);AN[o.a].d(0,0,t);A.c.restore();});
  A.box(cx-30,cy-22,60,44,K.w);L(cx-6,cy,cx+6,cy,K.w);L(cx,cy-6,cx,cy+6,K.w);if(fl>0)R(0,0,W,H,'rgba(255,255,255,'+fl/8+')');
  T('SCORE '+g.score,6,6,K.k,2);T('FILM '+shots,W-6,6,K.k,2,'r');if(mt>0)T(msg,160,220,K.k,2,'c');};
 return g;}});

/* ---- POCKET PET ---- */
A.add({id:'pet',name:'POCKET PET',cat:'SIM',how:'LEFT FEED, UP PLAY, RIGHT WASH, DOWN SLEEP. KEEP ALL BARS UP. EARN AGE.',make(){
 const g={over:null,score:0};let s={food:70,fun:70,clean:70,rest:70},t=0,act='',at=0,age=0,mood=0;
 g.update=()=>{t++;if(at>0){at--;return;}const h=A.hit(0);if(h.l){act='EAT';at=30;s.food=Math.min(100,s.food+30);s.clean-=5;S('coin');}if(h.u){act='PLAY';at=30;s.fun=Math.min(100,s.fun+30);s.rest-=8;s.food-=5;S('jump');}if(h.r){act='WASH';at=30;s.clean=Math.min(100,s.clean+40);S('blip');}if(h.d){act='SLEEP';at=60;s.rest=Math.min(100,s.rest+40);s.fun-=5;S('blip');}
  if(t%40===0){s.food-=1.2+age*.05;s.fun-=1+age*.04;s.clean-=.7;s.rest-=.8;}for(const k in s)s[k]=cl(s[k],0,100);mood=(s.food+s.fun+s.clean+s.rest)/4;if(t%300===0){age++;g.score=age*10+(mood|0);}
  if(Object.values(s).some(v=>v<=0))g.over='PET RAN AWAY AT AGE '+age;};
 g.draw=()=>{A.cls('#1a1238');R(40,40,240,150,'#2fe8d0');R(44,44,232,142,'#9fe8e0');const bob=Math.sin(t*.1)*3,x=160,y=120+bob,happy=mood>60;
  C(x,y,28,act==='WASH'&&at?K.w:K.y);C(x-22,y-18,8,K.y);C(x+22,y-18,8,K.y);if(act==='SLEEP'&&at){R(x-12,y-6,8,2,K.k);R(x+4,y-6,8,2,K.k);T('Z',x+30,y-30-at%20,K.k,2);}else{R(x-12,y-8,5,5,K.k);R(x+7,y-8,5,5,K.k);}
  if(happy)A.poly([[x-10,y+8],[x+10,y+8],[x,y+16]],K.k,1);else R(x-8,y+10,16,2,K.k);if(act==='EAT'&&at)R(x-30,y+10,10,8,K.r);if(act==='PLAY'&&at)C(x+30,y+10-Math.abs(Math.sin(at*.3))*20,6,K.p);
  [['FOOD',s.food,K.o],['FUN',s.fun,K.p],['CLEAN',s.clean,K.b],['REST',s.rest,K.g]].forEach((b,i)=>{const bx=8+i*78;T(b[0],bx,200,K.w);R(bx,210,70,8,K.d);R(bx,210,70*b[1]/100,8,b[1]<25?K.r:b[2]);});
  T('AGE '+age,6,6,K.y,2);T(happy?'HAPPY':'GRUMPY',W-6,6,happy?K.g:K.r,2,'r');T('LEFT FEED  UP PLAY  RIGHT WASH  DOWN SLEEP',160,228,K.gr,1,'c');};
 return g;}});

/* ---- FARM PLOT ---- */
A.add({id:'farm',name:'FARM PLOT',cat:'SIM',how:'A PLANTS (5). A AGAIN HARVESTS WHEN RIPE. B WATERS. 2 MIN.',make(){
 const g={over:null,score:0};let plots=Array(12).fill(null),c={x:0,y:0},money=30,time=7200,t=0;const CROPS=[{n:'WHEAT',t:400,v:12,c:K.y},{n:'CARROT',t:600,v:20,c:K.o},{n:'BERRY',t:900,v:35,c:K.p}];
 g.update=()=>{t++;time--;const h=A.hit(0);mvCur(h,c,4,3);const i=c.y*4+c.x,p=plots[i];
  if(h.a){if(!p){if(money>=5){money-=5;plots[i]={k:ri(3),g:0,w:0};S('blip');}else S('lose');}else if(p.g>=CROPS[p.k].t){money+=CROPS[p.k].v;g.score+=CROPS[p.k].v;plots[i]=null;S('coin');}}
  if(h.b&&p){p.w=300;S('blip');}plots.forEach(p=>{if(!p)return;p.g+=p.w>0?2:1;if(p.w>0)p.w--;});if(time<=0){g.score=money;g.over='$'+money+' EARNED';}};
 g.draw=()=>{A.cls('#4dabff');R(0,40,W,H,'#3f8a3a');C(50,20,10,K.y);for(let i=0;i<12;i++){const x=24+(i%4)*70,y=52+((i/4)|0)*58,p=plots[i];R(x,y,60,48,p&&p.w>0?'#4a3a28':'#8a5c33');for(let r=0;r<4;r++)R(x,y+6+r*12,60,2,'#5b3a1e');
   if(p){const cr=CROPS[p.k],f=Math.min(1,p.g/cr.t),ripe=f>=1;for(let k=0;k<3;k++){const px=x+12+k*18,ph=6+f*22;R(px-1,y+40-ph,3,ph,'#1e8a45');if(f>.4)C(px,y+40-ph,3+f*3,ripe?cr.c:'#2fa352');}if(ripe&&A.t%20<10)T('!',x+52,y+2,K.y,2);}if(c.y*4+c.x===i)A.box(x-2,y-2,64,52,K.y);}
  T('$'+money,6,6,K.y,2);T(Math.ceil(time/60),160,6,K.w,2,'c');T('A PLANT/HARVEST   B WATER',W-6,6,K.gr,1,'r');T('WHEAT 12  CARROT 20  BERRY 35',160,230,K.w,1,'c');};
 return g;}});

/* ---- REEF KEEPER ---- */
A.add({id:'reef',name:'REEF KEEPER',cat:'SIM',how:'MOVE. A DROPS FOOD. FED FISH BREED, HUNGRY FISH DIE. GROW THE SCHOOL IN 2 MIN.',make(){
 const g={over:null,score:0};let fish=[],food=[],cx=160,cy=60,time=7200,bub=[];for(let i=0;i<4;i++)fish.push({x:rnd(W),y:80+rnd(120),vx:rnd(2)-1,vy:0,h:80,c:[K.o,K.y,K.p,K.c][i]});
 g.update=()=>{time--;const k=A.in(0);cx=cl(cx+ax(k)*3,10,W-10);cy=cl(cy+ay(k)*3,40,200);if(A.hit(0).a&&food.length<12){food.push({x:cx,y:cy});S('blip');}food.forEach(f=>f.y+=.4);food=food.filter(f=>f.y<H-14);
  for(const f of fish){f.h-=.06;let tg=null,td=1e9;for(const fd of food){const d=Math.hypot(fd.x-f.x,fd.y-f.y);if(d<td){td=d;tg=fd;}}if(tg&&f.h<90){f.vx+=(tg.x-f.x)*.002;f.vy+=(tg.y-f.y)*.002;if(td<8){food.splice(food.indexOf(tg),1);f.h=Math.min(100,f.h+35);S('coin');if(f.h>95&&fish.length<20){fish.push({x:f.x,y:f.y,vx:-f.vx,vy:0,h:60,c:f.c});g.score+=10;}}}else{f.vx+=rnd(.1)-.05;f.vy+=rnd(.1)-.05;}
   f.vx=cl(f.vx*.98,-1.5,1.5);f.vy=cl(f.vy*.98,-1,1);f.x+=f.vx;f.y+=f.vy;if(f.x<10||f.x>W-10)f.vx*=-1;if(f.y<40||f.y>H-20)f.vy*=-1;}
  fish=fish.filter(f=>f.h>0);if(!fish.length){g.over='TANK EMPTY';return;}if(A.t%20===0)bub.push({x:40+rnd(240),y:H});bub.forEach(b=>b.y-=1);bub=bub.filter(b=>b.y>30);if(time<=0){g.score=fish.length*10;g.over=fish.length+' FISH';}};
 g.draw=()=>{A.cls('#1b5fa8');R(0,30,W,3,'#7fc3ff');R(0,H-14,W,14,'#c4a54a');for(let i=0;i<6;i++){const x=30+i*52;for(let j=0;j<5;j++)R(x+Math.sin(A.t*.05+j+i)*3,H-14-j*10,4,10,'#2fa352');}bub.forEach(b=>A.ring(b.x,b.y,2,'rgba(255,255,255,.5)'));
  fish.forEach(f=>{const d=f.vx<0?-1:1;R(f.x-6,f.y-3,12,6,f.h<30?K.gr:f.c);A.poly([[f.x-d*6,f.y],[f.x-d*10,f.y-4],[f.x-d*10,f.y+4]],f.h<30?K.gr:f.c,1);R(f.x+d*3,f.y-2,2,2,K.k);});food.forEach(fd=>R(fd.x-1,fd.y-1,3,3,'#8a5c33'));
  A.ring(cx,cy,5,K.w);T('FISH '+fish.length,6,6,K.w,2);T(Math.ceil(time/60),W-6,6,K.w,2,'r');};
 return g;}});
})();
