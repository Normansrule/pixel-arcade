(function(){const A=window.A,{W,H,K}=A,R=A.rect,T=A.text,C=A.circ,L=A.line,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0);

A.add({id:'chopper',name:'CHOPPER RESCUE',cat:'ACTION',how:'FLY. LAND NEAR PEOPLE TO PICK UP (4 MAX). DROP THEM AT BASE. DODGE FLAK.',make(){
 const g={over:null,score:0};let h={x:40,y:180,vx:0,vy:0,load:0},ppl=[],flak=[],guns=[],t=0,hp=3,inv=0;const GY=210;for(let i=0;i<10;i++)ppl.push({x:130+rnd(180),w:rnd(6.28)});guns.push({x:200,cd:90},{x:290,cd:140});
 g.update=()=>{t++;if(inv>0)inv--;const k=A.in(0);h.vx=(h.vx+ax(k)*.12)*.96;h.vy=(h.vy+(ay(k)*.12)+.02)*.95;h.x=cl(h.x+h.vx,10,W-10);h.y=cl(h.y+h.vy,30,GY-8);const landed=h.y>=GY-9;
  if(landed){for(const p of ppl)if(!p.in&&Math.abs(p.x-h.x)<24&&h.load<4){p.in=1;h.load++;S('coin');}if(h.x<60&&h.load){g.score+=h.load*100;S('score');A.burst(h.x,h.y,K.g,14);h.load=0;if(ppl.every(p=>p.in)&&!h.load){g.over='ALL RESCUED! WIN';A.confetti();}}}
  ppl.forEach(p=>{if(!p.in){p.w+=.05;p.x+=Math.sin(p.w)*.2;}});for(const gn of guns){if(--gn.cd<=0){gn.cd=Math.max(40,100-t/60);const dx=h.x-gn.x,dy=h.y-GY,d=Math.hypot(dx,dy);flak.push({x:gn.x,y:GY-6,vx:dx/d*2.4,vy:dy/d*2.4});}}
  for(const f of flak){f.x+=f.vx;f.y+=f.vy;if(inv===0&&Math.hypot(f.x-h.x,f.y-h.y)<10){f.y=-99;hp--;inv=80;S('boom');A.burst(h.x,h.y,K.o,18,3);if(hp<=0)g.over='SHOT DOWN';}}flak=flak.filter(f=>f.y>0&&f.x>0&&f.x<W);};
 g.draw=()=>{A.skyband('#4dabff','#ffd0a0',GY);R(0,GY,W,H,'#6a8a3a');R(10,GY-26,50,26,'#8a8aa0');R(20,GY-40,4,14,K.r);T('BASE',35,GY-18,K.k,1,'c');guns.forEach(gn=>{R(gn.x-8,GY-8,16,8,'#5b3a1e');L(gn.x,GY-8,gn.x+(h.x-gn.x)*.05,GY-18,'#333',3);});
  ppl.forEach(p=>{if(!p.in){R(p.x-2,GY-10,4,7,K.y);C(p.x,GY-12,2.5,'#ffd9a8');if(A.t%30<15)L(p.x,GY-9,p.x-4,GY-14,K.y);}});flak.forEach(f=>C(f.x,f.y,2.5,K.r));
  if(inv%8<5){R(h.x-12,h.y-6,22,10,K.c);R(h.x+10,h.y-3,14,3,K.c);R(h.x-6,h.y-4,8,5,'#9fd8ff');R(h.x-18+(A.t%4)*2,h.y-10,36-(A.t%4)*4,2,K.w);R(h.x-8,h.y+4,16,2,'#333');}
  T('SCORE '+g.score,6,6,K.k,2);T('ON BOARD '+h.load+'/4  HP '+hp,W-6,6,K.k,1,'r');T((ppl.filter(p=>!p.in).length+h.load)+' LEFT',W-6,16,K.k,1,'r');};
 return g;}});

A.add({id:'depth',name:'DEPTH CHARGE',cat:'ACTION',how:'LEFT/RIGHT STEER THE SHIP. A DROPS A CHARGE. SINK SUBS BEFORE THEY FIRE.',make(){
 const g={over:null,score:0};let x=160,ch=[],subs=[],torp=[],t=0,hp=3,cd=0;
 g.update=()=>{t++;x=cl(x+ax(A.in(0))*2.4,20,W-20);if(cd>0)cd--;if(A.fire(20)&&ch.length<4){ch.push({x,y:58,vy:.6});S('shoot');}if(t%Math.max(50,120-t/60|0)===0){const d=Math.random()<.5?1:-1;subs.push({x:d>0?-20:W+20,y:100+rnd(110),d,v:.5+rnd(.6)+t/5000,cd:120+ri(120)});}
  ch.forEach(c=>{c.y+=c.vy;c.vy=Math.min(1.6,c.vy+.02);});for(const c of ch){for(const s of subs)if(!s.dead&&Math.abs(c.x-s.x)<16&&Math.abs(c.y-s.y)<8){s.dead=1;c.y=999;g.score+=Math.round(50+s.y/2);S('boom');A.burst(s.x,s.y,K.w,20,3);}}ch=ch.filter(c=>c.y<H);
  for(const s of subs){s.x+=s.d*s.v;if(--s.cd<=0&&s.x>0&&s.x<W){s.cd=200;torp.push({x:s.x,y:s.y});}}subs=subs.filter(s=>!s.dead&&s.x>-30&&s.x<W+30);
  for(const tp of torp){tp.y-=1;if(tp.y<60&&Math.abs(tp.x-x)<22){tp.y=-9;hp--;S('boom');A.burst(x,56,K.o,18,3);if(hp<=0)g.over='SUNK';}}torp=torp.filter(tp=>tp.y>40);};
 g.draw=()=>{A.cls('#4dabff');for(let y=60;y<H;y+=4)R(0,y,W,4,A.mix('#1b6fb8','#061a3a',(y-60)/180));for(let i=0;i<W;i+=16)R(i,58+Math.sin(A.t*.08+i*.1)*2,16,3,'#9fd8ff');
  A.poly([[x-22,50],[x+22,50],[x+16,60],[x-16,60]],'#8a8aa0',1);R(x-6,42,12,8,'#6a6a78');R(x-1,34,2,8,K.k);subs.forEach(s=>{R(s.x-15,s.y-4,30,8,'#2a3a2a');R(s.x-3,s.y-9,8,5,'#2a3a2a');R(s.x+s.d*12,s.y-1,3,2,K.y);});ch.forEach(c=>{R(c.x-3,c.y-3,6,6,K.k);R(c.x-1,c.y-4,2,2,K.r);});torp.forEach(tp=>{R(tp.x-1,tp.y-4,2,8,K.r);A.ring(tp.x,tp.y+6,2,'rgba(255,255,255,.4)');});
  T('SCORE '+g.score,6,6,K.w,2);T('HULL '+'|'.repeat(hp),W-6,6,K.r,2,'r');};
 return g;}});

A.add({id:'bossrush',name:'BOSS RUSH',cat:'ACTION',how:'MOVE, HOLD OR SPAM A TO FIRE. DODGE THE PATTERNS. BEAT 3 BOSSES.',make(){
 const g={over:null,score:0};let p={x:160,y:200},bl=[],eb=[],boss,stage=0,t=0,hp=5,inv=0;
 const nb=()=>{stage++;boss={x:160,y:50,hp:120+stage*80,max:120+stage*80,ph:0};};nb();
 g.update=()=>{t++;if(inv>0)inv--;const k=A.in(0),slow=k.b?.5:1;p.x=cl(p.x+ax(k)*3*slow,8,W-8);p.y=cl(p.y+ay(k)*3*slow,100,H-8);if(A.fire(5)){bl.push({x:p.x-3,y:p.y-8},{x:p.x+3,y:p.y-8});S('shoot');}
  bl.forEach(b=>b.y-=7);bl=bl.filter(b=>{if(Math.abs(b.x-boss.x)<26&&Math.abs(b.y-boss.y)<16){boss.hp--;g.score+=1;return false;}return b.y>0;});
  boss.x=160+Math.sin(t*.02)*90;const B=boss;if(stage>=1&&t%40===0)for(let i=0;i<10;i++){const a=i/10*6.283+t*.01;eb.push({x:B.x,y:B.y,vx:Math.cos(a)*1.4,vy:Math.sin(a)*1.4});}
  if(stage>=2&&t%8===0){const a=t*.13;eb.push({x:B.x,y:B.y,vx:Math.cos(a)*2,vy:Math.abs(Math.sin(a))*2+.5});}if(stage>=3&&t%60===30){const dx=p.x-B.x,dy=p.y-B.y,d=Math.hypot(dx,dy);for(let s=-2;s<=2;s++)eb.push({x:B.x,y:B.y,vx:(dx/d*2.6)+s*.4,vy:dy/d*2.6});}
  for(const e of eb){e.x+=e.vx;e.y+=e.vy;if(inv===0&&Math.hypot(e.x-p.x,e.y-p.y)<4){e.y=-99;hp--;inv=90;S('boom');A.burst(p.x,p.y,K.c,14);if(hp<=0)g.over='DEFEATED ON BOSS '+stage;}}eb=eb.filter(e=>e.x>-5&&e.x<W+5&&e.y>-5&&e.y<H+5);
  if(boss.hp<=0){g.score+=500*stage;S('win');A.burst(boss.x,boss.y,K.y,40,4);eb=[];if(stage>=3){g.over='ALL BOSSES DOWN! WIN';A.confetti();}else{nb();hp=Math.min(5,hp+2);}}};
 g.draw=()=>{A.cls('#0a0418');for(let i=0;i<30;i++)R((i*97)%W,(i*53+t*.8)%H,1,2,K.gr);const B=boss,c=[K.p,K.o,K.r][stage-1];R(B.x-28,B.y-14,56,28,c);R(B.x-36,B.y-6,8,20,c);R(B.x+28,B.y-6,8,20,c);C(B.x,B.y,8,K.y);R(B.x-6,B.y+14,12,6,'#333');
  eb.forEach(e=>{C(e.x,e.y,3,K.w);C(e.x,e.y,2,c);});bl.forEach(b=>R(b.x-1,b.y,2,6,K.c));if(inv%8<5){A.poly([[p.x,p.y-8],[p.x-7,p.y+6],[p.x+7,p.y+6]],K.c,1);C(p.x,p.y,2,K.w);}
  R(60,8,200,6,K.d);R(60,8,200*B.hp/B.max,6,c);T('BOSS '+stage+'/3',6,6,K.w,1);T('HP '+'|'.repeat(hp),W-6,6,K.g,1,'r');T('HOLD B = FOCUS',160,228,K.gr,1,'c');};
 return g;}});

A.add({id:'walljump',name:'WALL JUMP',cat:'CLASSICS',how:'A JUMPS OFF THE WALL. CLIMB THE SHAFT. AVOID SPIKES.',make(){
 const g={over:null,score:0};let p={x:40,y:200,vx:0,vy:0,side:-1},sp=[],cam=0,best=0;for(let i=0;i<60;i++)sp.push({side:Math.random()<.5?-1:1,y:100-i*55-rnd(30)});
 g.update=()=>{const onWall=Math.abs(p.vx)<.01;if(A.hit(0).a&&onWall){p.vx=-p.side*5;p.vy=-5.8;S('jump');}if(!onWall){p.vy+=.25;p.x+=p.vx;if(p.x<=40){p.x=40;p.vx=0;p.side=-1;}if(p.x>=280){p.x=280;p.vx=0;p.side=1;}}else{p.vy=Math.min(p.vy+.08,1.2);}p.y+=p.vy;
  best=Math.max(best,200-p.y);g.score=best/10|0;const want=p.y-150;if(want<cam)cam+=(want-cam)*.2;if(p.y>cam+H+20)g.over='FELL';
  for(const s of sp){if(onWall&&s.side===p.side&&Math.abs(s.y-p.y)<14){g.over='SPIKED';S('boom');A.burst(p.x,p.y-cam,K.r,16,3);}}};
 g.draw=()=>{A.cls('#1a1238');for(let y=((-cam)%24)-24;y<H;y+=24){R(0,y,34,22,'#3a2a78');R(286,y,34,22,'#3a2a78');}R(34,0,2,H,'#6a5ab8');R(284,0,2,H,'#6a5ab8');
  sp.forEach(s=>{const y=s.y-cam;if(y<-20||y>H+20)return;const x=s.side<0?36:284;for(let i=0;i<3;i++)A.poly([[x,y-12+i*8],[x+s.side*-12,y-8+i*8],[x,y-4+i*8]],K.r,1);});const y=p.y-cam;R(p.x-6,y-14,12,14,K.c);R(p.x-4,y-20,8,6,'#ffd9a8');T(g.score+' M',160,8,K.w,3,'c');};
 return g;}});

A.add({id:'bomber',name:'CITY BOMBER',cat:'CLASSICS',how:'YOUR PLANE DROPS LOWER EACH PASS. A DROPS A BOMB. FLATTEN THE CITY TO LAND.',make(){
 const g={over:null,score:0};let bld=[],pl={x:0,y:30},bomb=null,lvl=0;const gen=()=>{lvl++;bld=[];for(let i=0;i<14;i++)bld.push({h:30+ri(60+lvl*10),c:['#6a6a78','#7a5a6a','#5a6a7a','#6a7a5a'][i%4]});pl={x:0,y:30};bomb=null;};gen();
 g.update=()=>{pl.x+=1.6+lvl*.2;if(pl.x>W+10){pl.x=-10;pl.y+=10;}if(A.hit(0).a&&!bomb){bomb={x:pl.x,y:pl.y+6};S('shoot');}if(bomb){bomb.y+=3;const i=Math.floor((bomb.x-20)/20);if(i>=0&&i<14&&bld[i].h>0&&bomb.y>220-bld[i].h){bld[i].h=Math.max(0,bld[i].h-20);g.score+=10;S('hit');A.burst(bomb.x,bomb.y,K.o,8,2);if(bld[i].h<=0||Math.random()<.3)bomb=null;}if(bomb&&bomb.y>220)bomb=null;}
  const i=Math.floor((pl.x-20)/20);if(i>=0&&i<14&&pl.y+5>220-bld[i].h){g.over='CRASHED';S('boom');A.burst(pl.x,pl.y,K.o,24,3);}if(pl.y>=210&&bld.every(b=>b.h<=0)||bld.every(b=>b.h<=0)&&pl.x>W){g.score+=500;S('win');if(lvl>=5)g.over='CITY CLEARED! WIN';else gen();}};
 g.draw=()=>{A.skyband('#1a0a44','#ff7a59',220);R(0,220,W,20,'#3a3a44');bld.forEach((b,i)=>{if(b.h<=0)return;const x=20+i*20;R(x,220-b.h,19,b.h,b.c);for(let y=220-b.h+4;y<216;y+=8)for(let wx=x+3;wx<x+17;wx+=6)R(wx,y,3,4,(wx+y)%3?K.y:'#222');});
  if(bomb)R(bomb.x-2,bomb.y-3,4,6,K.k);R(pl.x-12,pl.y-3,22,6,K.w);R(pl.x-6,pl.y-8,8,5,K.w);R(pl.x+10,pl.y-1,4,2,K.r);T('SCORE '+g.score,6,6,K.w,2);T('CITY '+lvl+'/5',W-6,6,K.y,2,'r');};
 return g;}});

A.add({id:'cavediver',name:'CAVE DIVER',cat:'CLASSICS',how:'SWIM WITH THE ARROWS. GRAB PEARLS. SURFACE FOR AIR BEFORE IT RUNS OUT.',make(){
 const g={over:null,score:0};let d={x:160,y:30,vx:0,vy:0},air=100,pearls=[],eels=[],t=0;for(let i=0;i<8;i++)pearls.push({x:20+rnd(280),y:80+rnd(140)});for(let i=0;i<3;i++)eels.push({x:rnd(W),y:100+i*40,d:i%2?1:-1});
 g.update=()=>{t++;const k=A.in(0);d.vx=(d.vx+ax(k)*.15)*.94;d.vy=(d.vy+ay(k)*.15-.01)*.94;d.x=cl(d.x+d.vx,8,W-8);d.y=cl(d.y+d.vy,24,H-10);if(d.y<34){air=Math.min(100,air+1.5);}else air-=.12+d.y/3000;if(air<=0){g.over='OUT OF AIR';S('lose');}
  pearls=pearls.filter(p=>{if(Math.hypot(p.x-d.x,p.y-d.y)<10){g.score+=Math.round(20+p.y/4);S('coin');A.burst(p.x,p.y,K.w,8);return false;}return true;});if(pearls.length<5)pearls.push({x:20+rnd(280),y:90+rnd(140)});
  for(const e of eels){e.x+=e.d*(1+t/4000);if(e.x<-30)e.d=1;if(e.x>W+30)e.d=-1;if(Math.abs(e.x-d.x)<18&&Math.abs(e.y+Math.sin(t*.1+e.x*.05)*6-d.y)<7){g.over='STUNG';S('boom');}}};
 g.draw=()=>{for(let y=0;y<H;y+=6)R(0,y,W,6,A.mix('#4dabff','#061a3a',y/H));R(0,0,W,30,'#9fd8ff');for(let i=0;i<W;i+=12)R(i,28+Math.sin(A.t*.1+i)*2,12,2,K.w);for(let i=0;i<8;i++)A.poly([[i*45,H],[i*45+15,H-30-(i*13)%25],[i*45+30,H]],'#3a2a48',1);
  pearls.forEach(p=>{C(p.x,p.y+2,6,'#6a4a8a');C(p.x,p.y,3,'#fff3d6');});eels.forEach(e=>{for(let s=0;s<6;s++)C(e.x-e.d*s*5,e.y+Math.sin(A.t*.1+e.x*.05+s*.8)*6,4-s*.4,'#7aa83a');});
  R(d.x-8,d.y-3,16,6,K.o);C(d.x+6,d.y-2,4,'#ffd9a8');R(d.x-12,d.y-2,4,4,K.y);if(d.y>34&&A.t%20<10)A.ring(d.x+8,d.y-10-(A.t%20),2,'rgba(255,255,255,.6)');
  R(6,6,80,6,K.k);R(6,6,80*air/100,6,air<25?K.r:K.c);T('AIR',90,6,K.w);T('PEARLS '+g.score,W-6,6,K.w,1,'r');};
 return g;}});

A.add({id:'firefighter',name:'FIRE FIGHTER',cat:'SIM',how:'MOVE. HOLD A TO SPRAY. REFILL AT THE HYDRANT. SAVE THE BLOCK FOR 90 SEC.',make(){
 const g={over:null,score:0};let p={x:160,y:200,fx:0,fy:-1},water=100,fires=[],time=5400,burnt=0,drops=[];const HOUSES=[[40,50],[120,50],[200,50],[280,50],[40,120],[120,120],[200,120],[280,120]];
 g.update=()=>{time--;const k=A.in(0);if(ax(k)||ay(k)){p.fx=ax(k);p.fy=ay(k);}p.x=cl(p.x+ax(k)*2,10,W-10);p.y=cl(p.y+ay(k)*2,30,H-10);if(Math.hypot(p.x-160,p.y-225)<16)water=Math.min(100,water+2);
  if(A.in(0).a&&water>0){water-=.6;const m=Math.hypot(p.fx,p.fy)||1;drops.push({x:p.x,y:p.y,vx:p.fx/m*4+rnd(.6)-.3,vy:p.fy/m*4+rnd(.6)-.3,t:22});}drops.forEach(d=>{d.x+=d.vx;d.y+=d.vy;d.t--;});
  if(Math.random()<.008+(5400-time)/400000){const h=HOUSES[ri(8)];if(!fires.find(f=>f.h===h))fires.push({h,s:10});}for(const f of fires){f.s+=.04;for(const d of drops)if(d.t>0&&Math.abs(d.x-f.h[0])<18&&Math.abs(d.y-f.h[1])<16){f.s-=1.2;d.t=0;}if(f.s>100){f.done=1;burnt++;S('boom');}if(f.s<=0){f.done=1;g.score+=50;S('coin');A.burst(f.h[0],f.h[1],K.c,10);}}
  fires=fires.filter(f=>!f.done);drops=drops.filter(d=>d.t>0);if(burnt>=3)g.over='3 HOUSES LOST';if(time<=0){g.over='SHIFT OVER! WIN';A.confetti();}};
 g.draw=()=>{A.cls('#4a7a3a');R(0,84,W,14,'#555');R(0,154,W,14,'#555');HOUSES.forEach(h=>{R(h[0]-16,h[1]-10,32,22,'#c4915a');A.poly([[h[0]-19,h[1]-10],[h[0],h[1]-24],[h[0]+19,h[1]-10]],'#8a3a2a',1);R(h[0]-4,h[1]+2,8,10,'#5b3a1e');});
  fires.forEach(f=>{const s=f.s/100;for(let i=0;i<5;i++){C(f.h[0]-10+i*5,f.h[1]-10-Math.random()*20*s,3+s*6,i%2?K.o:K.y);}R(f.h[0]-16,f.h[1]-30,32*s,3,K.r);});R(152,218,16,14,K.r);drops.forEach(d=>C(d.x,d.y,2,'#9fd8ff'));
  R(p.x-5,p.y-8,10,14,K.y);R(p.x-4,p.y-14,8,6,K.r);L(p.x,p.y,p.x+p.fx*10,p.y+p.fy*10,'#333',2);R(6,6,80,6,K.k);R(6,6,80*water/100,6,K.b);T('WATER',90,6,K.w);T('SAVED '+g.score/50+'  LOST '+burnt,W-6,6,K.w,1,'r');T(Math.ceil(time/60),160,16,K.w,1,'c');};
 return g;}});

A.add({id:'traffic',name:'TRAFFIC CONTROL',cat:'SIM',how:'A SWITCHES THE LIGHTS. KEEP CARS MOVING, NO CRASHES. 5 JAMS AND YOU\'RE FIRED.',make(){
 const g={over:null,score:0};let ns=true,cars=[],t=0,jams=0,sw=0;
 g.pos=c=>c.d===0?[150,c.p]:c.d===1?[170,240-c.p]:c.d===2?[c.p,130]:[320-c.p,110];
 g.update=()=>{t++;if(sw>0)sw--;if(A.hit(0).a&&sw===0){ns=!ns;sw=30;S('blip');}if(t%Math.max(20,60-t/300|0)===0){const d=ri(4);cars.push({d,p:-20,v:1.4+rnd(.6),wait:0,col:[K.r,K.b,K.y,K.w,K.o][ri(5)]});}
  for(const c of cars){const green=(c.d<2)===ns;const stop=!green&&c.p<130&&c.p>118;const ahead=cars.filter(o=>o.d===c.d&&o.p>c.p&&o.p-c.p<22).length;if(stop||ahead){c.wait++;}else{c.p+=c.v;c.wait=Math.max(0,c.wait-1);}if(c.wait===400){jams++;S('lose');if(jams>=5)g.over='FIRED';}if(c.p>320){c.gone=1;g.score++;}}
  const pos=c=>c.d===0?[150,c.p]:c.d===1?[170,240-c.p]:c.d===2?[c.p,130]:[320-c.p,110];for(let i=0;i<cars.length;i++)for(let j=i+1;j<cars.length;j++){const a=cars[i],b=cars[j];if((a.d<2)===(b.d<2))continue;const[ax_,ay_]=pos(a),[bx,by]=pos(b);if(Math.abs(ax_-bx)<10&&Math.abs(ay_-by)<10&&!g.over){g.over='CRASH!';S('boom');A.burst(ax_,ay_,K.o,30,3);}}cars=cars.filter(c=>!c.gone);g.pos=pos;};
 g.draw=()=>{A.cls('#4a7a3a');R(140,0,40,H,'#444');R(0,100,W,40,'#444');for(let y=0;y<H;y+=20)R(159,y,2,10,K.y);for(let x=0;x<W;x+=20)R(x,119,10,2,K.y);R(136,96,48,48,'#555');
  C(128,92,5,ns?K.g:K.r);C(192,148,5,ns?K.g:K.r);C(128,148,5,ns?K.r:K.g);C(192,92,5,ns?K.r:K.g);cars.forEach(c=>{const[x,y]=g.pos(c);const v=c.d<2;R(x-(v?5:8),y-(v?8:5),v?10:16,v?16:10,c.col);if(c.wait>250)T('!',x,y-14,K.r,1,'c');});
  T('CARS '+g.score,6,6,K.w,2);T('JAMS '+jams+'/5',W-6,6,K.r,2,'r');T(ns?'NORTH-SOUTH GREEN':'EAST-WEST GREEN',160,228,K.w,1,'c');};
 return g;}});

A.add({id:'lemonade',name:'LEMONADE STAND',cat:'SIM',how:'EACH MORNING SET PRICE AND CUPS WITH THE ARROWS, A TO OPEN. CHECK THE WEATHER. 10 DAYS.',make(){
 const g={over:null,score:0};let cash=20,day=0,price=1,cups=20,ph='plan',weather,sold=0,t=0,crowd=[],demand=0,sel=0;const WX=['RAINY','CLOUDY','SUNNY','HOT'];const nd=()=>{day++;weather=ri(4);ph='plan';};nd();
 g.update=()=>{t++;if(ph==='plan'){const h=A.hit(0);if(h.u||h.d)sel^=1;if(h.l||h.r){const d=h.r?1:-1;if(sel===0)price=cl(price+d*.25,.25,5);else cups=cl(cups+d*5,5,100);S('blip');}if(h.a){const cost=cups*.3;if(cost>cash){cups=Math.floor(cash/.3/5)*5;}cash-=cups*.3;demand=Math.round((20+weather*25)*Math.max(0,1.6-price*.45)*(.8+rnd(.4)));sold=0;crowd=[];ph='sell';t=0;S('coin');}return;}
  if(ph==='sell'){if(t%6===0&&crowd.length<demand)crowd.push({x:-10,buy:sold<cups&&crowd.length<demand});crowd.forEach(c=>{c.x+=2;if(c.buy&&!c.done&&c.x>150){c.done=1;sold++;cash+=price;S('coin');}});if(t>demand*6+200){ph='report';t=0;}return;}
  if(ph==='report'&&(A.hit(0).a||t>200)){if(day>=10){g.score=Math.round(cash*100);g.over='$'+cash.toFixed(2)+(cash>=20?' PROFIT! WIN':' LOSS');}else nd();}};
 g.draw=()=>{const sky=['#6a7a8a','#9fb8d8','#4dabff','#ff9a5a'][weather];A.cls(sky);if(weather>=2)C(270,40,18,K.y);if(weather===0)for(let i=0;i<40;i++)L((i*37+t*3)%W,(i*53+t*6)%150,(i*37+t*3)%W-2,(i*53+t*6)%150+6,'#dfe');R(0,160,W,80,'#6aa84a');R(0,176,W,20,'#9a9aa8');
  R(130,120,60,40,'#ffe36a');R(126,112,68,10,K.r);for(let i=0;i<5;i++)R(130+i*14,112,7,10,K.w);T('LEMONADE',160,136,K.k,1,'c');crowd.forEach(c=>{R(c.x-4,172,8,14,c.done?K.g:K.b);C(c.x,168,4,'#ffd9a8');});
  T('DAY '+day+'/10  '+WX[weather],6,6,K.k,2);T('$'+cash.toFixed(2),W-6,6,K.k,2,'r');
  if(ph==='plan'){R(60,40,200,70,'rgba(7,3,15,.85)');T((sel===0?'> ':'  ')+'PRICE $'+price.toFixed(2),160,52,sel===0?K.y:K.w,1,'c');T((sel===1?'> ':'  ')+'CUPS '+cups+'  COST $'+(cups*.3).toFixed(2),160,68,sel===1?K.y:K.w,1,'c');T('UP/DOWN PICK  LEFT/RIGHT SET  A OPEN',160,90,K.gr,1,'c');}
  if(ph==='report'){R(60,40,200,50,'rgba(7,3,15,.85)');T('SOLD '+sold+' OF '+cups,160,52,K.y,1,'c');T(demand>cups?'SOLD OUT! MAKE MORE':'DEMAND '+demand,160,68,K.w,1,'c');}};
 return g;}});

A.add({id:'beekeeper',name:'BEE KEEPER',cat:'SIM',how:'STEER THE SWARM LEADER. VISIT FLOWERS, BRING POLLEN HOME. AVOID WASPS. 2 MIN.',make(){
 const g={over:null,score:0};let b={x:160,y:120},carry=0,fl=[],wasps=[],time=7200,swarm=[];for(let i=0;i<9;i++)fl.push({x:30+rnd(260),y:40+rnd(170),p:3,c:[K.p,K.y,K.r,'#b070ff'][i%4]});for(let i=0;i<6;i++)swarm.push({x:160,y:120});
 g.update=()=>{time--;const k=A.in(0);b.x=cl(b.x+ax(k)*2.4,10,W-10);b.y=cl(b.y+ay(k)*2.4,30,H-10);swarm.forEach((s,i)=>{const tx=b.x+Math.cos(A.t*.1+i)*10,ty=b.y+Math.sin(A.t*.13+i)*8;s.x+=(tx-s.x)*.1;s.y+=(ty-s.y)*.1;});
  for(const f of fl)if(f.p>0&&Math.hypot(f.x-b.x,f.y-b.y)<14&&carry<10&&A.t%10===0){f.p--;carry++;S('blip');}fl.forEach(f=>{if(f.p<3&&Math.random()<.002)f.p++;});if(Math.hypot(b.x-30,b.y-215)<22&&carry){g.score+=carry*10*(carry>=8?2:1);S('coin');A.burst(30,210,K.y,12);carry=0;}
  if(A.t%400===0&&wasps.length<4)wasps.push({x:W,y:rnd(H),vx:0,vy:0});for(const w of wasps){const dx=b.x-w.x,dy=b.y-w.y,d=Math.hypot(dx,dy)||1;w.vx=(w.vx+dx/d*.08)*.97;w.vy=(w.vy+dy/d*.08)*.97;w.x+=w.vx;w.y+=w.vy;if(d<10){carry=0;S('boom');w.x=W+20;w.y=rnd(H);w.vx=w.vy=0;swarm.pop();if(!swarm.length)g.over='SWARM LOST';}}if(time<=0){g.over='SEASON OVER';}};
 g.draw=()=>{A.cls('#6aa84a');for(let i=0;i<30;i++)R((i*83)%W,(i*47)%H,2,4,'#5a983a');fl.forEach(f=>{for(let k=0;k<5;k++)C(f.x+Math.cos(k*1.26)*5,f.y+Math.sin(k*1.26)*5,3.5,f.p>0?f.c:'#8a8a6a');C(f.x,f.y,3,f.p>0?K.y:'#6a6a4a');});
  R(14,196,32,34,'#d9a55b');for(let i=0;i<4;i++)R(14,198+i*8,32,2,'#8a5c33');R(26,220,8,8,K.k);swarm.forEach(s=>{C(s.x,s.y,2.5,K.y);R(s.x-1,s.y-1,2,2,K.k);});C(b.x,b.y,4,K.y);R(b.x-2,b.y-1,4,2,K.k);R(b.x-4,b.y-5,3,3,'rgba(255,255,255,.7)');
  wasps.forEach(w=>{C(w.x,w.y,4,K.r);R(w.x-3,w.y-1,6,2,K.k);});T('HONEY '+g.score,6,6,K.k,2);T('POLLEN '+carry+'/10',W-6,6,K.k,1,'r');T(Math.ceil(time/60),160,6,K.k,1,'c');};
 return g;}});
})();
