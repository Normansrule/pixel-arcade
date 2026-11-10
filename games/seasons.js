/* PIXEL ARCADE - four seasons pack (round 30): the last eighteen cabinets of the 600, a spring-summer-autumn-winter
   tour drawn with the frontier pack's character kit (A.kit), plus the registration of the Summit Rush 3D world. */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),TAU=Math.PI*2,hyp=Math.hypot;
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const K=A.kit,{hero,critter,tree,pine,cottage,cloud,ink}=K;
const T=(s,x,y,col,sc,al)=>X.ot(s,x,y,col,sc||1,al);
const hearts=(n,x)=>{for(let i=0;i<3;i++)X.heart(x+i*12,8,1,i<n?'#ff4f6d':'rgba(255,255,255,.2)');};
const LOOKS=[['#c84a3a','#2a2a3a','cap','#2a6ac8',0],['#3a8ad8','#2a2a3a','straw','#c84a3a',2],['#f0b040','#3a3a5a','beanie','#c83a8a',1],['#4aa86a','#3a2a2a',null,null,3],['#8a4ad8','#2a2a3a','hood','#5a2a8a',4],['#e86a8a','#2a3a5a',null,null,2]];
const rep=(i,k,n)=>{const h=A.hit(i),q=A.in(i);if(h[k]){n.c=0;return true;}if(q[k]){n.c=(n.c||0)+1;return n.c>12&&n.c%5===0;}return false;};
const flower=(x,y,r,col,ph)=>{for(let i=0;i<5;i++){const a=i/5*TAU+(ph||0);X.disc(x+Math.cos(a)*r*.7,y+Math.sin(a)*r*.7,r*.55,col);}X.disc(x,y,r*.45,'#ffd84a');};
const leaf=(x,y,r,a,col)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(a);ink(c=>{c.moveTo(-r,0);c.quadraticCurveTo(0,-r*.7,r,0);c.quadraticCurveTo(0,r*.7,-r,0);},col,.5);c.restore();};

/* ================= SEED SOWER (spring) ================= */
const BLOOM=['#ff6a9a','#ffd84a','#9a6aff','#ff8a3a','#6ac8ff'];
A.add({id:'seedsower',name:'SEED SOWER',cat:'SIM',tags:'spring garden plant water flowers farm',how:'ARROWS STEP BETWEEN PLOTS. A PLANTS OR PICKS A BLOOM, B WATERS. DO NOT LET THEM WILT.',make(){
 const g={over:null,score:0},fx=X.fx(),C=6,R=3,PX=i=>46+(i%C)*46,PY=i=>112+Math.floor(i/C)*42;let p=[],cx=0,cy=1,t=0,wilt=0,water=0,picked=0;
 for(let i=0;i<C*R;i++)p.push({st:0,gr:0,w:0,dry:0,c:ri(5)});
 g.update=()=>{t++;if(water)water--;const h=A.hit(0);if(h.l)cx=Math.max(0,cx-1);if(h.r)cx=Math.min(C-1,cx+1);if(h.u)cy=Math.max(0,cy-1);if(h.d)cy=Math.min(R-1,cy+1);const q=p[cy*C+cx];
  if(h.a){if(q.st===0){q.st=1;q.gr=0;q.w=.6;q.dry=0;q.c=ri(5);S('blip');fx.pop(PX(cy*C+cx),PY(cy*C+cx)-20,'PLANTED','#c8f0a0');}else if(q.st>=4){q.st=0;picked++;g.score+=25;S('coin');fx.pop(PX(cy*C+cx),PY(cy*C+cx)-28,'+25','#7dff9a');fx.spark(PX(cy*C+cx),PY(cy*C+cx)-14,BLOOM[q.c],10,1.6);}}
  if(h.b){water=16;if(q.st){q.w=1;S('blip');}}
  for(const o of p){if(!o.st)continue;o.w=Math.max(0,o.w-.0016-t/9e5);if(o.w>0){o.dry=0;if(o.st<4){o.gr+=.0026;if(o.gr>=1){o.gr=0;o.st++;if(o.st===4)S('power');}}}else{o.dry++;if(o.dry>360){o.st=0;wilt++;S('lose');fx.pop(PX(p.indexOf(o)),PY(p.indexOf(o))-20,'WILTED','#c8a070');if(wilt>=4){g.over='THE GARDEN WILTED';return;}}}}};
 g.draw=()=>{const c=A.c;X.cache('fs_ss_bg',()=>{const c=A.c;X.sky(['#7ac0f0','#b8e0f8','#e8f6ff'],90);cloud(60,30,.9);cloud(250,22,.7);X.hills(80,14,'#8ad070',0,.025,3);X.hills(92,10,'#6ab85a',90,.03,5);cottage(250,92,40,28,'#f4e8d0','#c84a3a',1);tree(30,94,12,'#5aa84a');tree(214,92,10,'#6ab85a');
   X.vg(0,90,W,150,['#7ac05a','#6ab04a','#5aa040']);for(let i=0;i<C*R;i++){X.rr(PX(i)-20,PY(i)-12,40,26,6,'#7a5434');for(let k=0;k<3;k++)X.rr(PX(i)-16,PY(i)-6+k*7,32,2,1,'rgba(40,20,10,.35)');}
   for(let i=0;i<30;i++)flower(hash(i,1)*W,226+hash(i,2)*12,2,BLOOM[i%5]);});
  for(let i=0;i<C*R;i++){const o=p[i],x=PX(i),y=PY(i);if(o.st&&o.w>0){c.globalAlpha=o.w*.5;X.rr(x-20,y-12,40,26,6,'#3a2414');c.globalAlpha=1;}
   if(o.st){const dry=o.w<=0,sw=Math.sin(A.t*.06+i)*.08,hgt=[0,6,12,18,22][o.st]+o.gr*5;c.save();c.translate(x,y+4);c.rotate(dry?.5:sw);X.rr(-1,-hgt,2,hgt,1,dry?'#a89060':'#3a8a3a');if(o.st>=2){leaf(-4,-hgt*.5,4,-.5,dry?'#b8a070':'#4ab04a');leaf(4,-hgt*.6,4,3.6,dry?'#b8a070':'#5ac05a');}
    if(o.st===3)X.disc(0,-hgt,3,dry?'#a89060':'#5aa84a');if(o.st===4){if(lo())X.glow(0,-hgt,10,BLOOM[o.c],.35);flower(0,-hgt,5,dry?'#a89070':BLOOM[o.c],A.t*.01);}c.restore();
    X.rr(x-12,y+12,24,3,1,'rgba(0,0,0,.3)');X.rr(x-12,y+12,24*o.w,3,1,o.w<.25?'#ff8a5a':'#6ac8ff');}}
  const ci=cy*C+cx,hx=PX(ci)+14,hy=PY(ci)+16;hero(hx,hy,{s:.9,top:'#e86a8a',bot:'#4a6a3a',hat:'straw',hatC:'#ffd84a',style:2,seed:3,mood:'happy',arm:water?-1.2:-.4,d:-1,hold:c=>{X.rr(-4,0,8,6,2,'#6ab0d8');X.rr(3,1,6,1.5,0,'#6ab0d8');}});
  if(water)for(let k=0;k<5;k++)X.disc(PX(ci)+4-k*2+rnd(2),PY(ci)-4+((16-water)*2+k*3)%14,1.2,'#9ad8ff');c.strokeStyle='#ffe27a';c.lineWidth=1.5;c.strokeRect(PX(ci)-21,PY(ci)-13,42,28);
  fx.draw();X.bar('PICKED '+picked,String(g.score),'WILTED '+wilt+'/4','#ffe27a','#ffe27a');};
 return g;}});

/* ================= BEE DANCE (spring) ================= */
A.add({id:'beedance',name:'BEE DANCE',cat:'PUZZLE',tags:'bee waggle dance flowers memory direction',how:'THE DANCE ANGLE IS THE WAY, ITS WIGGLES THE DISTANCE. FLY THERE AND PRESS A TO LAND.',make(){
 const g={over:null,score:0},fx=X.fx(),HX=160,HY=212;let ph='dance',pt=0,ang=0,dist=0,n=1,fl=[],b={x:HX,y:HY-10},strikes=0,round=0,t=0,tgt=0;
 const newR=()=>{round++;ph='dance';pt=0;ang=(rnd(2)-1)*1.25;n=1+ri(4);dist=40+n*32;fl=[];const tx=HX+Math.sin(ang)*dist,ty=HY-Math.cos(ang)*dist;fl.push({x:cl(tx,16,W-16),y:cl(ty,30,196),c:ri(5)});tgt=0;
  let k=0;while(fl.length<6+Math.min(4,round)&&k<300){k++;const x=16+rnd(W-32),y=34+rnd(150);if(fl.every(f=>hyp(f.x-x,f.y-y)>30))fl.push({x,y,c:ri(5)});}b={x:HX,y:HY-10};};newR();
 g.update=()=>{t++;pt++;if(ph==='dance'){if(pt>200||A.hit(0).a&&pt>20){ph='fly';pt=0;}return;}if(ph==='done'){if(pt>40)newR();return;}
  const k=A.in(0);b.x=cl(b.x+ax(k)*2.2,8,W-8);b.y=cl(b.y+ay(k)*2.2,24,H-8);
  if(A.hit(0).a){const i=fl.findIndex(f=>hyp(f.x-b.x,f.y-b.y)<12);if(i>=0){if(i===tgt){const p=Math.max(10,60-Math.round(pt/12))+round*5;g.score+=p;S('win');fx.pop(b.x,b.y-20,'NECTAR! +'+p,'#7dff9a');fx.spark(b.x,b.y,'#ffe27a',12,1.6);}else{strikes++;g.score+=3;S('lose');fx.pop(b.x,b.y-20,'WRONG FLOWER +3 POLLEN','#ff6a5a');fx.ring(fl[tgt].x,fl[tgt].y,'#ffe27a',20,30);if(strikes>=3){g.over='THE HIVE WENT HUNGRY';return;}}ph='done';pt=0;}else S('blip');}};
 const bee=(x,y,s,a)=>{const c=A.c;c.save();c.translate(x,y);c.rotate(a||0);c.scale(s,s);for(const k of[-1,1]){c.globalAlpha=.6;X.ell(k*3,-4+Math.sin(A.t*1.5)*1,3.5,2.2,'#e8f4ff');c.globalAlpha=1;}ink(c=>c.ellipse(0,0,4,5.5,0,0,TAU),'#ffd030',.6);X.rr(-4,-1,8,1.6,0,'#2a1a10');X.rr(-3.6,2,7.2,1.6,0,'#2a1a10');X.disc(0,-5,2.6,'#2a1a10');c.restore();};
 g.draw=()=>{const c=A.c;X.cache('fs_bd_bg',()=>{const c=A.c;X.sky(['#8ac8f0','#c8e8f8'],40);X.vg(0,26,W,214,['#9ad870','#7ac05a','#6ab04a']);for(let i=0;i<120;i++){const x=hash(i,1)*W,y=30+hash(i,2)*200;X.stroke([[x,y],[x-1,y-4]],'rgba(40,100,30,.4)',1);}
   X.rr(HX-16,HY-16,32,26,10,'#e8b040');for(let r=0;r<4;r++)X.rr(HX-15,HY-12+r*6,30,1.5,0,'#b8802a');X.disc(HX,HY+2,4,'#3a2414');});
  for(let i=0;i<fl.length;i++){const f=fl[i];X.stroke([[f.x,f.y],[f.x,f.y+10]],'#3a8a3a',1.5);flower(f.x,f.y,6,BLOOM[f.c],i);if(ph==='done'&&i===tgt&&lo())X.glow(f.x,f.y,16,'#ffe27a',.5);}
  if(ph==='dance'){X.rr(8,24,104,92,8,'rgba(60,40,10,.75)');for(let r=0;r<6;r++)for(let q=0;q<7;q++){const hx=18+q*14+(r%2)*7,hy=34+r*14;c.strokeStyle='rgba(255,200,80,.35)';c.beginPath();for(let k=0;k<6;k++){const a=k/6*TAU+Math.PI/6;c.lineTo(hx+Math.cos(a)*7,hy+Math.sin(a)*7);}c.closePath();c.stroke();}
   const cyc=(pt%90)/90,DX=60,DY=72,ux=Math.sin(ang),uy=-Math.cos(ang);let bx,by,ba=ang;if(cyc<.5){const q=cyc/.5;bx=DX-ux*16+ux*32*q+(-uy)*Math.sin(q*n*TAU*2)*3;by=DY-uy*16+uy*32*q+ux*Math.sin(q*n*TAU*2)*3;}else{const q=(cyc-.5)/.5,s=Math.floor(pt/90)%2?1:-1,a2=ang+Math.PI+s*q*Math.PI;bx=DX+Math.sin(a2)*16*-1*-1;by=DY-Math.cos(a2)*16;ba=a2+Math.PI;}
   bee(bx,by,1.4,ba);T('UP = AWAY',60,104,'#ffe8a0',1,'c');T('WIGGLES '+n,60,28,'#ffe8a0',1,'c');T('A: GO',60,112,'#ffffff',1,'c');}
  else bee(b.x,b.y,1.6,Math.sin(A.t*.3)*.2);
  X.bar('ROUND '+round,String(g.score),'MISSES '+strikes+'/3','#ffe27a','#ffe27a');fx.draw();};
 return g;}});

/* ================= NEST BUILDER (spring) ================= */
A.add({id:'nestbuilder',name:'NEST BUILDER',cat:'ACTION',tags:'bird twigs nest spring hawk rain',how:'ARROWS FLY. TOUCH A TWIG TO PICK IT UP, BRING IT TO THE NEST. DODGE THE HAWK. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),NX=50,NY=96;let b={x:160,y:80,d:1,carry:false},tw=[],hawk=null,t=0,lives=3,inv=0,nest=0,nests=0,rain=0;
 g.update=()=>{t++;if(inv)inv--;if(t%60===0)g.score++;if(rain)rain--;else if(t%900===500)rain=360;const k=A.in(0),sp=(b.carry?1.8:2.4)*(rain?.75:1);if(ax(k))b.d=ax(k);b.x=cl(b.x+ax(k)*sp,10,W-10);b.y=cl(b.y+ay(k)*sp,24,224);
  if(tw.length<4&&t%50===0)tw.push({x:110+rnd(200),y:206+rnd(20),a:rnd(3)});
  if(!b.carry){const i=tw.findIndex(o=>hyp(o.x-b.x,o.y-b.y)<14);if(i>=0){tw.splice(i,1);b.carry=true;S('blip');}}else if(hyp(b.x-NX,b.y-NY)<18){b.carry=false;nest++;g.score+=10;S('coin');fx.pop(NX,NY-20,'+10','#7dff9a');if(nest>=8){nests++;nest=0;g.score+=60;S('win');fx.pop(NX,NY-34,'NEST DONE! +60','#ffe27a');}}
  if(!hawk&&t%Math.max(150,400-t/20|0)===0)hawk={x:W+30,y:40+rnd(150),vx:-(2+rnd(1)+t/4000)};if(hawk){hawk.x+=hawk.vx;hawk.y+=(b.y-hawk.y)*.01;if(hawk.x<-40)hawk=null;else if(!inv&&hyp(hawk.x-b.x,hawk.y-b.y)<16){lives--;inv=90;S('hit');A.shake=5;if(b.carry){b.carry=false;fx.pop(b.x,b.y-20,'TWIG DROPPED','#ff8a7a');}fx.debris(b.x,b.y,'#8a6a4a',8,1.6);if(lives<=0){g.over='THE HAWK WON';return;}}}};
 const bird=(x,y,d,s,col,carry)=>{const c=A.c;c.save();c.translate(x,y);c.scale(d*s,s);const fl=Math.sin(A.t*.5)*6;ink(c=>c.ellipse(0,0,7,5,0,0,TAU),col,.6);X.disc(5,-3,3.6,col);X.disc(6.5,-4,.9,'#1a1a1a');X.poly([[8.5,-3],[12,-2],[8.5,-1]],'#ffb030');X.ell(1,1.5,4,3,'#ffd8b0');ink(c=>{c.moveTo(-2,-2);c.lineTo(-6,-2-fl);c.lineTo(2,-2);},X.lt(col,.8),.5);X.poly([[-6,0],[-11,-2],[-11,2]],X.lt(col,.8));if(carry)X.rr(6,-1,12,1.6,0,'#8a6a3a');c.restore();};
 g.draw=()=>{const c=A.c;X.cache('fs_nb_bg',()=>{const c=A.c;X.sky(['#9ad0f8','#d0ecfa'],200);cloud(140,40,1);cloud(260,60,.8);X.hills(190,12,'#8ad070',0,.02,6);X.vg(0,200,W,40,['#7ac05a','#5aa040']);
   X.rr(40,100,14,120,3,X.lg(40,0,54,0,['#8a5a34','#5a3a20']));for(const[x,y,r]of[[47,90,26],[24,110,18],[72,108,20],[46,64,18]])X.disc(x,y,r,'#5aa84a');for(let i=0;i<14;i++)flower(hash(i,4)*30+20,hash(i,5)*60+60,2.2,'#ffc0d8');});
  ink(c=>c.ellipse(NX,NY,16,6,0,0,Math.PI),'#8a6a3a',.8);for(let i=0;i<Math.min(8,nest)+nests*2&&i<14;i++)X.stroke([[NX-14+((i*7)%28),NY+2-((i*3)%4)],[NX-6+((i*11)%22),NY-1+((i*5)%4)]],'#6a4a2a',1.4);for(let e=0;e<Math.min(3,nests);e++)X.ell(NX-6+e*6,NY-1,2.6,3.2,'#c8e8f0');
  for(const o of tw){c.save();c.translate(o.x,o.y);c.rotate(o.a);X.rr(-7,-1,14,2,1,'#8a6a3a');X.rr(-2,-3,6,1.2,0,'#8a6a3a');c.restore();}
  if(hawk){c.save();c.translate(hawk.x,hawk.y);const fl=Math.sin(A.t*.3)*8;ink(c=>c.ellipse(0,0,12,5,0,0,TAU),'#6a4a3a',.6);X.disc(-10,-3,4.5,'#f4ead4');X.poly([[-14,-3],[-18,-1],[-14,0]],'#ffb030');X.disc(-11,-4,1,'#1a1a1a');ink(c=>{c.moveTo(-4,-2);c.lineTo(4,-16-fl);c.lineTo(8,-2);},'#5a3a2a',.5);c.restore();}
  if(!(inv&&A.t%6<3))bird(b.x,b.y,b.d,1.5,'#4a8ad8',b.carry);
  if(rain){c.globalAlpha=Math.min(1,Math.min(rain,360-rain)/40)*.5;c.fillStyle='#3a4a6a';c.fillRect(0,0,W,H);c.strokeStyle='rgba(200,220,255,.8)';c.lineWidth=1;for(let i=0;i<70;i++){const x=(i*37+t*3)%W,y=(i*53+t*7)%H;c.beginPath();c.moveTo(x,y);c.lineTo(x-2,y+7);c.stroke();}c.globalAlpha=1;}
  fx.draw();X.bar('NESTS '+nests,String(g.score),'TWIGS '+nest+'/8','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= PETAL DUEL (spring, versus) ================= */
A.add({id:'petalduel',name:'PETAL DUEL',cat:'VERSUS',vs:1,tags:'blossom petals catch basket spring',how:'LEFT/RIGHT MOVE YOUR BASKET IN YOUR HALF. GOLD PETALS SCORE 3. BEES STUN YOU. FIRST TO 40.',make(){
 const g={over:null,score:0},fx=X.fx(),BY=210;let P=[{x:80,s:0,stun:0},{x:240,s:0,stun:0}],f=[],t=0;
 g.timeUp=()=>tu(P[0].s,P[1].s);
 g.update=()=>{t++;if(t%14===0)f.push({x:rnd(W),y:30,ph:rnd(TAU),k:Math.random()<.1?'g':Math.random()<.1?'b':'p',v:.7+rnd(.5)});
  if(A.cpu){const q=P[1],o={};const tg=f.filter(o2=>o2.k!=='b'&&o2.x>W/2&&o2.y<BY).sort((a,b)=>b.y-a.y)[0];if(tg){const d=tg.x+Math.sin(tg.ph+tg.y*.03)*12-q.x;if(Math.random()<.6+A.ai*.4){if(d<-4)o.l=1;else if(d>4)o.r=1;}}A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i];if(p.stun){p.stun--;continue;}const lo2=i?W/2+16:16,hi=i?W-16:W/2-16;p.x=cl(p.x+ax(A.in(i))*3,lo2,hi);}
  for(const o of f){o.y+=o.v;o.ph+=.03;const ox=o.x+Math.sin(o.ph+o.y*.03)*12;if(!o.done&&o.y>BY-10&&o.y<BY+2){for(let i=0;i<2;i++)if(Math.abs(ox-P[i].x)<16){o.done=1;if(o.k==='b'){P[i].stun=60;S('hit');fx.pop(P[i].x,BY-30,'STUNG!','#ff8a5a');}else{const v=o.k==='g'?3:1;P[i].s+=v;if(i===0){g.score=P[0].s;S('coin');}fx.pop(P[i].x,BY-30,'+'+v,o.k==='g'?'#ffe27a':'#ffc0d8');if(P[i].s>=40){g.over=A.win(i);S('win');return;}}break;}}}f=f.filter(o=>!o.done&&o.y<H);};
 g.draw=()=>{const c=A.c;X.cache('fs_pd_bg',()=>{const c=A.c;X.sky(['#a8d0f8','#f8e0f0'],170);X.hills(160,12,'#a8d890',0,.02,2);X.vg(0,170,W,70,['#8ac870','#6ab050']);for(const tx of[30,160,290]){X.rr(tx-5,60,10,120,3,'#6a4a3a');for(let k=0;k<14;k++)X.disc(tx+(hash(k,tx)-.5)*70,50+hash(tx,k)*50,10+hash(k,k+tx)*8,['#ffc0d8','#ffd8e8','#f8a8c8'][k%3]);}X.rr(W/2-1,24,2,216,0,'rgba(255,255,255,.4)');});
  for(const o of f){const ox=o.x+Math.sin(o.ph+o.y*.03)*12;if(o.k==='b'){X.ell(ox,o.y,4,3,'#ffd030');X.rr(ox-2,o.y-1,4,1.2,0,'#2a1a10');X.ell(ox,o.y-4,3,2,'rgba(230,240,255,.7)');}else{leaf(ox,o.y,o.k==='g'?5:4,o.ph,o.k==='g'?'#ffe060':'#ffb0d0');if(o.k==='g'&&lo())X.glow(ox,o.y,8,'#ffe060',.5);}}
  for(let i=0;i<2;i++){const p=P[i];hero(p.x,BY+24,{s:.95,top:i?'#c84a7a':'#3a8ad8',bot:'#3a3a5a',style:i?2:0,seed:i*9+4,mood:p.stun?'o':'happy',arm:-2.4,bob:0});ink(c=>{c.moveTo(p.x-15,BY-8);c.lineTo(p.x+15,BY-8);c.lineTo(p.x+11,BY+4);c.lineTo(p.x-11,BY+4);c.closePath();},'#c8944a',.8);for(let k=0;k<Math.min(8,p.s/5|0);k++)X.disc(p.x-10+k*3,BY-9,2.4,'#ffc0d8');}
  fx.draw();X.bar();A.hud2(P[0].s,P[1].s);};
 return g;}});

/* ================= SANDCASTLE (summer) ================= */
A.add({id:'sandcastle',name:'SANDCASTLE',cat:'CLASSICS',tags:'beach stack tower bucket summer tide',how:'THE BUCKET SWINGS. A DROPS A BLOCK OF SAND. OVERHANG CRUMBLES AWAY - KEEP THE TOWER WIDE.',make(){
 const g={over:null,score:0},fx=X.fx(),BH=12,GY=212;let st=[{x:160,w:70}],t=0,ph=0,drop=null,cam=0,fall=[],perfect=0;
 g.update=()=>{t++;const top=st[st.length-1],sp=.03+st.length*.0015;if(!drop){ph+=sp;if(A.hit(0).a){drop={x:160+Math.sin(ph)*110,y:40-cam*0,w:top.w,vy:0};S('jump');}}
  else{drop.vy+=.35;drop.y+=drop.vy;const ty=GY-st.length*BH+cam;if(drop.y>=ty-BH){const l=Math.max(drop.x-drop.w/2,top.x-top.w/2),r=Math.min(drop.x+drop.w/2,top.x+top.w/2);if(r-l<=2){fall.push({x:drop.x,y:ty-BH,w:drop.w,vy:0});g.over='THE CASTLE FELL';S('lose');drop=null;return;}
    const nw=r-l,cut=drop.w-nw;if(cut>1){const cx2=drop.x<top.x?l-cut/2:r+cut/2;fall.push({x:cx2,y:ty-BH,w:cut,vy:0});fx.debris(cx2,ty-BH,'#e8c890',6,1.4);}if(cut<4){perfect++;g.score+=25;S('win');fx.pop(160,ty-30,'PERFECT +25','#7dff9a');}else{perfect=0;g.score+=10;S('hit');}
    st.push({x:(l+r)/2,w:cut<4?drop.w:nw});drop=null;if(st.length>8)cam+=BH;}}
  for(const f2 of fall){f2.vy+=.3;f2.y+=f2.vy;}fall=fall.filter(f2=>f2.y<H+20);};
 g.draw=()=>{const c=A.c;X.cache('fs_sc_bg',()=>{const c=A.c;X.sky(['#4ab0f0','#a0dcf8','#f0f8ff'],140);X.glow(270,40,50,'#fff8d0',.6);X.disc(270,40,14,'#fff8e0');cloud(70,40,.9);X.vg(0,120,W,40,['#2a8ad8','#4aa8e8','#8ad0f0']);for(let i=0;i<10;i++)X.rr(i*34,130+(i%3)*8,16,1.5,0,'rgba(255,255,255,.6)');X.vg(0,160,W,80,['#f8e0a8','#f0d090','#e0b878']);for(let i=0;i<40;i++)X.disc(hash(i,1)*W,168+hash(i,2)*70,.8,'rgba(160,120,60,.5)');});
  const sea=Math.sin(A.t*.02)*4;c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.moveTo(0,162+sea);for(let x=0;x<=W;x+=10)c.lineTo(x,162+sea+Math.sin(x*.05+A.t*.05)*2);c.lineTo(W,158);c.lineTo(0,158);c.fill();
  c.save();c.translate(0,cam);for(let i=0;i<st.length;i++){const s=st[i],y=GY-(i+1)*BH;X.rr(s.x-s.w/2,y,s.w,BH,2,X.lg(0,y,0,y+BH,['#f8dca0','#e0b878','#c89a5a']));c.fillStyle='rgba(120,80,30,.25)';for(let k=0;k<s.w/8;k++)c.fillRect(s.x-s.w/2+k*8+3,y+3,2,2);if(i%4===3){for(let k=0;k<3;k++)X.rr(s.x-s.w/2+k*(s.w/2)-3,y-5,6,5,1,'#e8c890');}}
  const top=st[st.length-1];X.rr(top.x-1,GY-st.length*BH-16,2,16,0,'#8a6a4a');X.poly([[top.x+1,GY-st.length*BH-16],[top.x+12,GY-st.length*BH-13],[top.x+1,GY-st.length*BH-10]],'#ff4a4a');c.restore();
  for(const f2 of fall)X.rr(f2.x-f2.w/2,f2.y+cam,f2.w,BH,2,'#d8b070');
  if(!drop){const bx=160+Math.sin(ph)*110;X.stroke([[160,20],[bx,36]],'#8a8a94',1);ink(c=>{c.moveTo(bx-top.w/2,40);c.lineTo(bx+top.w/2,40);c.lineTo(bx+top.w/2-4,54);c.lineTo(bx-top.w/2+4,54);c.closePath();},X.lg(bx-top.w/2,0,bx+top.w/2,0,['#ff6a4a','#ffb04a']),.8);}
  else X.rr(drop.x-drop.w/2,drop.y,drop.w,BH,2,'#f0d090');
  hero(28,234,{s:1.1,top:'#ffd84a',bot:'#3a8ad8',hat:'cap',hatC:'#ff6a4a',style:1,seed:22,mood:'happy',arm:-2.4});for(let i=0;i<2;i++){const cx2=270+i*20+Math.sin(A.t*.05+i)*6;X.ell(cx2,226,5,3,'#e85a3a');X.disc(cx2-5,222,2,'#e85a3a');X.disc(cx2+5,222,2,'#e85a3a');}
  fx.draw();X.bar('HEIGHT '+(st.length-1),String(g.score),perfect>1?'PERFECT X'+perfect:'','#ffe27a','#ffe27a');};
 return g;}});

/* ================= SNORKEL (summer) ================= */
A.add({id:'snorkel',name:'SNORKEL REEF',cat:'ACTION',tags:'swim reef shells air jellyfish summer',how:'ARROWS SWIM. COLLECT SHELLS AND PEARLS. SURFACE FOR AIR. JELLYFISH STING. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),SURF=46;let s={x:160,y:40,d:1},air=1,t=0,lives=3,inv=0,items=[],jel=[];
 const add=()=>items.push({x:20+rnd(W-40),y:150+rnd(70),k:Math.random()<.15?'p':'s',c:ri(3)});for(let i=0;i<6;i++)add();for(let i=0;i<3;i++)jel.push({x:rnd(W),y:80+rnd(100),ph:rnd(TAU),vx:.4*(Math.random()<.5?-1:1)});
 g.update=()=>{t++;if(inv)inv--;if(t%60===0)g.score++;const k=A.in(0);if(ax(k))s.d=ax(k);s.x=cl(s.x+ax(k)*1.9,10,W-10);s.y=cl(s.y+ay(k)*1.9+(s.y>SURF&&!ay(k)?-.15:0),SURF-6,226);
  if(s.y<=SURF)air=Math.min(1,air+.02);else{air-=.0022+t/4e6;if(air<=0){lives--;air=1;s.y=SURF-6;S('lose');fx.pop(s.x,SURF-14,'OUT OF AIR','#ff6a5a');if(lives<=0){g.over='OUT OF BREATH';return;}}}
  for(let i=items.length-1;i>=0;i--){const o=items[i];if(hyp(o.x-s.x,o.y-s.y)<12){items.splice(i,1);const v=o.k==='p'?30:10;g.score+=v;S('coin');fx.pop(o.x,o.y-14,'+'+v,o.k==='p'?'#ffffff':'#ffd0a0');fx.spark(o.x,o.y,'#ffffff',6,1.2);add();}}
  if(jel.length<3+Math.floor(t/1500))jel.push({x:Math.random()<.5?-10:W+10,y:80+rnd(130),ph:0,vx:.5});for(const j of jel){j.ph+=.05;j.x+=j.vx;j.y+=Math.sin(j.ph)*.5;if(j.x<-20||j.x>W+20)j.vx*=-1;if(!inv&&hyp(j.x-s.x,j.y-s.y)<14){lives--;inv=90;S('hit');A.shake=4;fx.pop(s.x,s.y-18,'STING!','#ff8aff');if(lives<=0){g.over='TOO MANY STINGS';return;}}}};
 g.draw=()=>{const c=A.c;X.cache('fs_sn_bg',()=>{const c=A.c;X.sky(['#6ac0f0','#c0e8f8'],SURF);X.vg(0,SURF,W,H-SURF,['#2ab0d8','#1a88b8','#0a5a8a']);for(let i=0;i<6;i++){c.globalAlpha=.07;X.poly([[30+i*55,SURF],[44+i*55,SURF],[70+i*55,H],[50+i*55,H]],'#ffffff');}c.globalAlpha=1;
   X.vg(0,214,W,26,['#e8d0a0','#c8b080']);for(let i=0;i<9;i++){const x=hash(i,1)*W,col=['#ff7a6a','#ffb04a','#c86aff','#ff6ab0'][i%4];for(let k=0;k<5;k++)X.rr(x+k*3-6,200-hash(i,k)*24,3,40,1.5,col);}for(let i=0;i<5;i++){X.ell(hash(i,7)*W,214,18,8,'#8a7a6a');}});
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=1.5;c.beginPath();for(let x=0;x<=W;x+=8)c.lineTo(x,SURF+Math.sin(x*.06+A.t*.06)*1.5);c.stroke();
  for(let i=0;i<6;i++){const fx2=(i*61+A.t*(.3+i*.05))%(W+40)-20,fy=90+i*20;X.ell(fx2,fy,5,2.6,['#ffd030','#ff8a4a','#6ae8ff'][i%3]);X.poly([[fx2-5,fy],[fx2-9,fy-3],[fx2-9,fy+3]],['#ffd030','#ff8a4a','#6ae8ff'][i%3]);}
  for(const o of items){if(o.k==='p'){ink(c=>c.ellipse(o.x,o.y,6,4,0,Math.PI,0),'#8a7a8a',.6);X.disc(o.x,o.y-1,2.6,'#ffffff');if(lo())X.glow(o.x,o.y-1,6,'#ffffff',.5);}else{ink(c=>{c.moveTo(o.x-5,o.y+3);c.quadraticCurveTo(o.x,o.y-8,o.x+5,o.y+3);c.closePath();},['#ffd0a0','#ffb0c0','#f0e0c0'][o.c],.6);for(let k=-2;k<=2;k++)X.stroke([[o.x,o.y+3],[o.x+k*2,o.y-3]],'rgba(120,80,60,.5)',.6);}}
  for(const j of jel){const p=Math.sin(j.ph)*1.5;c.globalAlpha=.8;ink(c=>c.ellipse(j.x,j.y,8+p,6-p*.5,0,Math.PI,0),'#ff9ae8',.6);c.globalAlpha=1;for(let k=0;k<4;k++){c.strokeStyle='rgba(255,170,230,.7)';c.beginPath();c.moveTo(j.x-5+k*3.3,j.y);c.quadraticCurveTo(j.x-5+k*3.3+Math.sin(j.ph+k)*3,j.y+8,j.x-5+k*3.3,j.y+14);c.stroke();}if(lo())X.glow(j.x,j.y,10,'#ff9ae8',.3);}
  if(!(inv&&A.t%6<3)){const c2=A.c;c2.save();c2.translate(s.x,s.y);c2.rotate(s.y>SURF?s.d*1.3:0);hero(0,10,{s:.85,top:'#3a6ac8',bot:'#3a6ac8',style:1,seed:12,bob:0,arm:-1,mood:'happy'});X.rr(2,-14,8,4,2,'#ffd030');X.rr(6,-22,2,10,1,'#ffd030');c2.restore();if(s.y>SURF&&A.t%30<2)fx.spark(s.x,s.y-12,'#ffffff',2,.6);}
  fx.draw();X.bar('AIR',String(g.score),'','#9ae8ff','#ffe27a');X.meter(46,7,60,5,air,air<.25?'#ff5a4a':'#9ae8ff');hearts(lives,250);};
 return g;}});

/* ================= SEED SPIT (summer) ================= */
A.add({id:'seedspit',name:'SEED SPIT',cat:'SPORTS',tags:'watermelon seed distance wind summer picnic',how:'A LOCKS THE ANGLE, A AGAIN LOCKS THE POWER. MIND THE WIND. FIVE SPITS IN ALL.',make(){
 const g={over:null,score:0},fx=X.fx(),OX=50,OY=176,GY=206,SC=4;let ph='ang',a=0,pw=0,t=0,seed=null,tries=5,best=0,marks=[],wind=0,pt=0;
 const newW=()=>{wind=Math.round((rnd(2)-1)*3*10)/10;};newW();
 g.update=()=>{t++;pt++;if(ph==='ang'){a=.25+Math.abs(Math.sin(pt*.04))*1.1;if(A.hit(0).a){ph='pow';pt=0;S('blip');}}else if(ph==='pow'){pw=Math.abs(Math.sin(pt*.05));if(A.hit(0).a){ph='fly';seed={x:OX+8,y:OY,vx:Math.cos(a)*pw*7,vy:-Math.sin(a)*pw*7};S('jump');}}
  else if(ph==='fly'){seed.vx+=wind*.004;seed.vy+=.12;seed.x+=seed.vx;seed.y+=seed.vy;if(seed.y>=GY){const d=Math.max(0,(seed.x-OX)/SC);g.score+=Math.round(d*10);best=Math.max(best,d);marks.push(seed.x);fx.pop(Math.min(W-30,seed.x),GY-20,d.toFixed(1)+' M','#ffe27a');S(d>45?'win':'coin');fx.debris(Math.min(W-10,seed.x),GY,'#2a1a10',4,1);tries--;ph='land';pt=0;}}
  else if(ph==='land'&&pt>60){if(tries<=0){g.over='BEST '+best.toFixed(1)+' M';return;}ph='ang';pt=0;newW();}};
 g.draw=()=>{const c=A.c;X.cache('fs_sp_bg',()=>{const c=A.c;X.sky(['#5ab8f0','#a8dcf8','#f0f8ff'],170);cloud(100,40,1);cloud(250,30,.7);X.hills(160,14,'#7ac05a',0,.02,3);X.vg(0,170,W,70,['#8ad060','#6ab048']);for(let m=0;m<=70;m+=10){const x=OX+m*SC;if(x>W)break;X.rr(x,GY,1,6,0,'#ffffff');T(m+'',x,GY+8,'#ffffff',1,'c');}X.rr(OX,GY-1,W,2,0,'#ffe8a0');
   X.rr(10,180,60,6,1,'#c83a3a');for(let i=0;i<6;i++)X.rr(10+i*10,180,5,6,0,'#ffffff');});
  for(const m of marks)X.rr(m-1,GY-8,2,8,0,'#ff4a4a');const ws=Math.abs(wind);T('WIND '+(wind<0?'< ':'> ')+ws.toFixed(1),W-44,30,'#ffffff',1,'c');for(let i=0;i<3;i++){const wx=(A.t*wind*.5+i*100)%W;X.stroke([[(wx+W)%W,50+i*10],[(wx+W)%W+12*Math.sign(wind||1),50+i*10]],'rgba(255,255,255,.6)',1);}
  hero(OX-6,GY,{s:1.2,top:'#4aa86a',bot:'#3a3a5a',hat:'cap',hatC:'#ffd84a',style:3,seed:33,mood:ph==='fly'?'o':'happy',arm:-1.6,d:1,hold:c=>{ink(c=>{c.arc(0,0,7,0,Math.PI);c.closePath();},'#ff5a6a',.6);X.rr(-7,0,14,1.5,0,'#3a8a3a');}});
  if(ph==='ang'||ph==='pow'){const L=26;X.stroke([[OX+8,OY],[OX+8+Math.cos(a)*L,OY-Math.sin(a)*L]],'#ffffff',2);X.disc(OX+8+Math.cos(a)*L,OY-Math.sin(a)*L,2.5,'#ffe27a');}
  if(ph==='pow'){X.rr(OX+30,OY-40,8,40,2,'#1a1a1a');X.rr(OX+30,OY-pw*40,8,pw*40,2,X.lg(0,OY-40,0,OY,['#ff4a4a','#ffd84a','#7dff9a']));}
  if(seed)X.ell(seed.x,seed.y,1.8,1.2,'#2a1a10');T(ph==='ang'?'A: LOCK ANGLE':ph==='pow'?'A: LOCK POWER':'',160,30,'#ffffff',1,'c');
  fx.draw();X.bar('SPITS '+tries,String(g.score),'BEST '+best.toFixed(1)+' M','#ffe27a','#ffe27a');};
 return g;}});

/* ================= RIVER RAFT (summer, versus) ================= */
A.add({id:'raftrace',name:'RIVER RAFT',cat:'VERSUS',vs:1,tags:'raft river rapids race rocks summer',how:'UP/DOWN STEER, A PADDLES HARDER. ROCKS AND LOGS SLOW YOU. FIRST TO THE DOCK WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),GOAL=3000,CY=[66,174],HW=44;let P=[0,1].map(()=>({x:0,y:0,v:1.6,pad:0,hit:0})),t=0;
 const obs=(i,k)=>({x:k*70+30+hash(k,i+2)*30,y:(hash(i+5,k)-.5)*HW*1.5,log:hash(k,i+9)<.3});
 g.timeUp=()=>tu(P[0].x,P[1].x);
 g.update=()=>{t++;if(A.cpu){const q=P[1],o={},k=Math.floor((q.x+60)/70),ob=obs(1,k),d=ob.x-q.x;if(d>0&&d<70&&Math.abs(ob.y-q.y)<14+(ob.log?8:0)){if(Math.random()<.5+A.ai*.5){if(ob.y>q.y)o.u=1;else o.d=1;}}else if(Math.abs(q.y)>4&&Math.random()<.3){if(q.y>0)o.u=1;else o.d=1;}if(Math.random()<.18+A.ai*.25&&t%2)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],k=A.in(i);if(p.hit)p.hit--;if(p.pad)p.pad--;p.y=cl(p.y+ay(k)*1.4,-HW+8,HW-8);if(A.hit(i).a&&!p.pad){p.pad=18;p.v=Math.min(3.6,p.v+.5);if(i===0)S('blip');}p.v=lerp(p.v,p.hit?.6:1.8,.02);p.x+=p.v;
   const kk=Math.floor((p.x+20)/70);for(const q of[kk-1,kk]){const o=obs(i,q);if(q<1)continue;if(!p.hit&&Math.abs(o.x-p.x)<10&&Math.abs(o.y-p.y)<(o.log?16:10)){p.hit=40;p.v=.4;if(i===0){S('hit');A.shake=3;}fx.pop(110,CY[i]-20,'BUMP!','#ff8a5a');}}if(p.x>=GOAL){g.over=A.win(i);S('win');return;}}g.score=P[0].x/10|0;};
 const lerp=(a,b,t2)=>a+(b-a)*t2;
 g.draw=()=>{const c=A.c;X.cache('fs_rr_bg',()=>{const c=A.c;X.vg(0,0,W,H,['#6aa84a','#5a983a']);for(let i=0;i<40;i++)X.disc(hash(i,1)*W,hash(i,2)*H,4+hash(i,3)*6,'rgba(40,90,30,.4)');});
  for(let i=0;i<2;i++){const p=P[i],cy=CY[i],cam=p.x-100;c.save();c.beginPath();c.rect(0,cy-HW-14,W,HW*2+28);c.clip();X.vg(0,cy-HW,W,HW*2,['#3a9ad8','#2a7ab8','#3a9ad8']);
   for(let s=0;s<20;s++){const sx=((s*53-cam*1.2)%W+W)%W,sy=cy-HW+((s*29)%(HW*2));X.rr(sx,sy,14,1.5,0,'rgba(255,255,255,.35)');}
   for(let q=0;q<W;q+=12){const k2=Math.floor((q+cam)/12);pine(q-((cam%12)+12)%12,cy-HW-2,14+hash(k2,i)*6,'#2a5a3a');X.rr(q-((cam%12)+12)%12,cy+HW,12,3,0,'#c8b080');}
   for(let k=Math.floor(cam/70);k<Math.floor(cam/70)+6;k++){if(k<1)continue;const o=obs(i,k),ox=o.x-cam,oy=cy+o.y;if(o.log){X.rr(ox-14,oy-4,28,8,4,X.lg(0,oy-4,0,oy+4,['#a87a4a','#6a4a2a']));X.ell(ox+14,oy,2.5,4,'#e8c890');}else{X.ell(ox,oy+2,11,7,'rgba(255,255,255,.4)');ink(c=>c.ellipse(ox,oy,8,6,0,0,TAU),X.lg(0,oy-6,0,oy+6,['#a8a8b8','#6a6a7a']),.6);}}
   const gx=GOAL-cam;if(gx<W+40){X.rr(gx,cy-HW,10,HW*2,0,'#8a5a34');for(let k=0;k<6;k++)X.rr(gx,cy-HW+k*15,10,2,0,'#5a3a20');}
   const bob=Math.sin(t*.15+i)*1.2;c.save();c.translate(100,cy+p.y+bob);if(p.hit)c.rotate(Math.sin(p.hit*.5)*.3);X.ell(-18,2,6,3,'rgba(255,255,255,.5)');X.rr(-14,-6,28,12,6,i?'#ff6a3a':'#ffd030');X.rr(-10,-3,20,6,3,i?'#c84a2a':'#d8a020');
   hero(-3,3,{s:.7,top:i?'#c84a3a':'#3a6ac8',bot:'#2a2a3a',hat:'helm',hatC:i?'#ff6a3a':'#ffd030',style:i?2:0,seed:i*4+5,bob:0,arm:p.pad?-.3:-1.4});X.stroke([[2,-6],[12,6+(p.pad?-6:0)]],'#8a5a34',1.6);c.restore();c.restore();
   X.meter(8,cy+HW+6,W-16,3,p.x/GOAL,i?'#ff4f9a':'#2fd6c3');}
  fx.draw();X.bar();A.hud2(P[0].x/30|0,P[1].x/30|0);};
 return g;}});

/* ================= LEAF PILE (autumn) ================= */
A.add({id:'leafpile',name:'LEAF PILE',cat:'ACTION',tags:'autumn rake leaves wind yard',how:'WALK OVER LEAVES TO RAKE THEM (20 MAX), TOUCH THE PILE TO DROP THEM. GUSTS SCATTER IT.',make(){
 const g={over:null,score:0},fx=X.fx(),PX=160,PY=150;let p={x:80,y:180,d:1,st:0},lv=[],load=0,pile=0,t=0,gust=0,gdir=1,piled=0;
 const add=(x,y)=>lv.push({x:x??rnd(W),y:y??(70+rnd(160)),a:rnd(TAU),c:ri(4),vx:0,vy:0});for(let i=0;i<60;i++)add();
 g.update=()=>{t++;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)p.d=dx;p.x=cl(p.x+dx*1.9,10,W-10);p.y=cl(p.y+dy*1.9,70,232);if(dx||dy)p.st+=.4;
  if(gust)gust--;else if(t%Math.max(240,600-t/8|0)===0){gust=90;gdir=Math.random()<.5?-1:1;const n=Math.min(pile,4+ri(6));pile-=n;for(let i=0;i<n;i++){add(PX,PY);const o=lv[lv.length-1];o.vx=gdir*(1+rnd(2));o.vy=-rnd(2);}S('hit');fx.pop(PX,PY-40,'GUST!','#ffb07a');}
  for(let i=lv.length-1;i>=0;i--){const o=lv[i];if(gust){o.vx+=gdir*.05;}o.x+=o.vx;o.y+=o.vy;o.vx*=.95;o.vy*=.95;o.a+=o.vx*.05;if(o.x<0||o.x>W)o.vx*=-1;o.x=cl(o.x,0,W);o.y=cl(o.y,70,236);if(load<20&&hyp(o.x-p.x,o.y-p.y)<14){lv.splice(i,1);load++;if(load%4===0)S('blip');}}
  if(load&&hyp(p.x-PX,p.y-PY)<26){pile+=load;piled+=load;g.score+=load*2+(load>=15?20:0);S('coin');fx.pop(PX,PY-40,'+'+(load*2+(load>=15?20:0)),'#7dff9a');load=0;}
  if(t%30===0&&lv.length<70)add(rnd(W),70+rnd(20));};
 g.draw=()=>{const c=A.c;X.cache('fs_lp_bg',()=>{const c=A.c;X.sky(['#e8a868','#f8d0a0'],70);X.hills(66,10,'#c88a4a',0,.02,7);for(const[x,col]of[[30,'#e8743a'],[110,'#f0b030'],[200,'#d8502a'],[290,'#e8943a']])tree(x,74,16,col);cottage(240,70,40,26,'#f4e0c8','#8a3a2a',1);X.vg(0,66,W,174,['#9ab85a','#8aa84a','#7a9840']);});
  const LC=['#e8743a','#f0b030','#d8502a','#c8842a'];for(const o of lv)leaf(o.x,o.y,4,o.a,LC[o.c]);
  const ph=Math.min(40,8+pile*.6);ink(c=>c.ellipse(PX,PY,ph*1.1,ph*.5,0,Math.PI,0),X.lg(0,PY-ph*.5,0,PY,['#f0a040','#d8602a']),.8);for(let i=0;i<Math.min(30,pile);i++)leaf(PX+(hash(i,1)-.5)*ph*1.6,PY-hash(i,2)*ph*.45,3.5,hash(i,3)*6,LC[i%4]);
  hero(p.x,p.y,{s:1,st:p.st,d:p.d,top:'#c84a3a',bot:'#3a3a5a',hat:'beanie',hatC:'#3a8a5a',style:1,seed:41,mood:load>=15?'happy':undefined,hold:c=>{X.rr(-1,-14,2,24,0,'#8a6a3a');X.rr(-6,9,12,2,0,'#5a5a64');for(let k=0;k<5;k++)X.rr(-6+k*3,11,1,4,0,'#5a5a64');}});
  for(let i=0;i<Math.min(6,load/3|0);i++)leaf(p.x+p.d*10+((i%3)-1)*3,p.y-4-Math.floor(i/3)*3,3,i,LC[i%4]);
  if(gust){c.globalAlpha=Math.min(1,gust/20)*.6;for(let i=0;i<10;i++)X.stroke([[(i*40+t*4*gdir)%W+(gdir<0?W:0),80+i*15],[(i*40+t*4*gdir)%W+(gdir<0?W:0)+20*gdir,80+i*15]],'#ffffff',1);c.globalAlpha=1;}
  fx.draw();X.bar('RAKE '+load+'/20',String(g.score),'PILED '+piled,'#ffe27a','#ffe27a');};
 return g;}});

/* ================= APPLE ORCHARD (autumn) ================= */
A.add({id:'orchard',name:'APPLE ORCHARD',cat:'CLASSICS',tags:'apples tree shake catch autumn wasps',how:'LEFT/RIGHT MOVE. A SHAKES THE TREE ABOVE YOU. CATCH APPLES, DODGE ROTTEN ONES AND WASPS.',make(){
 const g={over:null,score:0},fx=X.fx(),TX=[50,130,210,290],BY=200;let x=160,st=0,d=1,f=[],t=0,lives=3,inv=0,shake=[0,0,0,0],wasp=[],caught=0;
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0),dx=ax(k);if(dx)d=dx;x=cl(x+dx*2.6,14,W-14);if(dx)st+=.4;for(let i=0;i<4;i++)if(shake[i])shake[i]--;
  if(A.hit(0).a){const i=TX.findIndex(tx=>Math.abs(tx-x)<34);if(i>=0&&!shake[i]){shake[i]=20;S('hit');const n=1+ri(3);for(let q=0;q<n;q++){const r=Math.random();f.push({x:TX[i]+rnd(40)-20,y:70+rnd(20),vy:rnd(.5),k:r<.12?'g':r<.3?'r':'a'});}if(Math.random()<.18)wasp.push({x:TX[i],y:70,l:300});}}
  if(t%120===0){const i=ri(4);f.push({x:TX[i]+rnd(40)-20,y:80,vy:0,k:Math.random()<.25?'r':'a'});}
  for(const o of f){o.vy+=.08;o.y+=o.vy;if(!o.done&&o.y>BY-14&&o.y<BY+2&&Math.abs(o.x-x)<16){o.done=1;if(o.k==='r'){lives--;S('lose');fx.pop(x,BY-30,'ROTTEN!','#a8c060');if(lives<=0){g.over='TOO MANY ROTTEN APPLES';return;}}else{const v=o.k==='g'?5:1;caught++;g.score+=v*5;S('coin');fx.pop(x,BY-30,'+'+v*5,o.k==='g'?'#ffe27a':'#ff8a8a');}}if(!o.done&&o.y>BY+20){o.done=1;fx.debris(o.x,BY+24,o.k==='r'?'#8a7a3a':'#e83a3a',4,1);}}f=f.filter(o=>!o.done);
  for(const w of wasp){w.l--;const a=Math.atan2(BY-20-w.y,x-w.x);w.x+=Math.cos(a)*1.3+Math.sin(t*.3)*1;w.y+=Math.sin(a)*1.3;if(!inv&&hyp(w.x-x,w.y-(BY-20))<12){lives--;inv=80;S('hit');A.shake=4;fx.pop(x,BY-40,'BZZT!','#ffd030');w.l=0;if(lives<=0){g.over='WASP ATTACK';return;}}}wasp=wasp.filter(w=>w.l>0);};
 const apple=(x,y,k)=>{ink(c=>c.arc(x,y,4.5,0,TAU),k==='g'?X.rg(x-1.5,y-1.5,.5,x,y,4.5,['#fff4a0','#e8b020']):k==='r'?'#8a7a3a':X.rg(x-1.5,y-1.5,.5,x,y,4.5,['#ff8a8a','#d82a2a']),.6);X.rr(x-.5,y-7,1,3,0,'#5a3a20');if(k!=='r')leaf(x+2.5,y-6,2.2,-.6,'#4aa84a');else X.disc(x+1,y+1,1.2,'#5a4a1a');};
 g.draw=()=>{const c=A.c;X.cache('fs_or_bg',()=>{const c=A.c;X.sky(['#e8a060','#f8d098','#fff0d0'],150);X.hills(140,12,'#c8a050',0,.02,4);X.vg(0,140,W,100,['#8aa848','#7a9838','#6a8830']);for(let i=0;i<20;i++)X.rr(i*18,BY+16,10,24,2,'rgba(60,90,30,.4)');});
  for(let i=0;i<4;i++){const tx=TX[i],sh=shake[i]?Math.sin(shake[i]*1.5)*2.5:0;X.rr(tx-5,90,10,BY-80,3,X.lg(tx-5,0,tx+5,0,['#8a5a34','#5a3a20']));for(let k=0;k<9;k++)X.disc(tx+(hash(k,i)-.5)*60+sh,74+hash(i,k)*32,14+hash(k,i+3)*6,['#5a983a','#6aa84a','#c8a030'][k%3]);
   for(let k=0;k<5;k++)apple(tx+(hash(k+9,i)-.5)*50+sh,76+hash(i,k+9)*30,'a');}
  for(const o of f)apple(o.x,o.y,o.k);for(const w of wasp){X.ell(w.x,w.y,3.5,2.5,'#ffd030');X.rr(w.x-2,w.y-1,4,1,0,'#1a1a1a');X.ell(w.x,w.y-3,3,1.6,'rgba(230,240,255,.7)');}
  if(!(inv&&A.t%6<3)){hero(x,BY+24,{s:1.05,st,d,top:'#3a6a3a',bot:'#4a3a2a',hat:'straw',hatC:'#c84a3a',style:3,seed:51,arm:-2.6,mood:'happy'});ink(c=>{c.moveTo(x-14,BY-14);c.lineTo(x+14,BY-14);c.lineTo(x+10,BY-2);c.lineTo(x-10,BY-2);c.closePath();},'#b8844a',.8);for(let k=0;k<Math.min(6,caught/4|0);k++)X.disc(x-9+k*3.6,BY-15,2.6,'#e83a3a');}
  fx.draw();X.bar('APPLES '+caught,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= CORN MAZE (autumn) ================= */
A.add({id:'cornmaze',name:'CORN MAZE NIGHT',cat:'PUZZLE',tags:'maze corn lantern night autumn tickets',how:'WALK THE MAZE BY LANTERN LIGHT. FIND 3 TICKETS, THEN THE EXIT. OIL REFILLS THE LAMP.',make(){
 const g={over:null,score:0},fx=X.fx(),CW=15,CH=11,CS=20,OX=10,OY=22;let m=[],p={x:0,y:0},tix=[],oil=1,cans=[],lvl=0,t=0,got=0,exit={x:CW-1,y:CH-1},nm={};
 const gen=()=>{m=[];for(let y=0;y<CH;y++){m.push([]);for(let x=0;x<CW;x++)m[y].push({n:1,e:1,s:1,w:1,v:0});}const st=[[0,0]];m[0][0].v=1;while(st.length){const[cx,cy]=st[st.length-1],nb=[];for(const[dx,dy,a,b]of[[0,-1,'n','s'],[1,0,'e','w'],[0,1,'s','n'],[-1,0,'w','e']]){const nx=cx+dx,ny=cy+dy;if(nx>=0&&ny>=0&&nx<CW&&ny<CH&&!m[ny][nx].v)nb.push([nx,ny,a,b]);}
   if(!nb.length){st.pop();continue;}const[nx,ny,a,b]=nb[ri(nb.length)];m[cy][cx][a]=0;m[ny][nx][b]=0;m[ny][nx].v=1;st.push([nx,ny]);}
  for(let i=0;i<12;i++){const x=1+ri(CW-2),y=1+ri(CH-2),d=['e','s'][ri(2)];m[y][x][d]=0;if(d==='e')m[y][x+1].w=0;else m[y+1][x].n=0;}
  p={x:0,y:0};tix=[];while(tix.length<3){const x=ri(CW),y=ri(CH);if(x+y>5&&!tix.some(q=>q.x===x&&q.y===y))tix.push({x,y});}cans=[];for(let i=0;i<3;i++)cans.push({x:ri(CW),y:ri(CH)});got=0;lvl++;oil=1;};gen();
 g.update=()=>{t++;oil-=.0006+lvl*.0001;if(oil<=0){g.over='THE LANTERN WENT OUT';S('lose');return;}const c0=m[p.y][p.x];
  for(const[k,dx,dy,w]of[['u',0,-1,'n'],['d',0,1,'s'],['l',-1,0,'w'],['r',1,0,'e']])if(rep(0,k,nm[k]||(nm[k]={}))&&!c0[w]){p.x+=dx;p.y+=dy;S('blip');break;}
  const ti=tix.findIndex(q=>q.x===p.x&&q.y===p.y);if(ti>=0){tix.splice(ti,1);got++;g.score+=20;S('coin');fx.pop(OX+p.x*CS+10,OY+p.y*CS-6,'TICKET!','#ffe27a');}
  const ci=cans.findIndex(q=>q.x===p.x&&q.y===p.y);if(ci>=0){cans.splice(ci,1);oil=Math.min(1,oil+.4);S('power');fx.pop(OX+p.x*CS+10,OY+p.y*CS-6,'+OIL','#ffb040');}
  if(got>=3&&p.x===exit.x&&p.y===exit.y){g.score+=100+Math.round(oil*100);S('win');fx.pop(160,120,'ESCAPED! +'+(100+Math.round(oil*100)),'#7dff9a');gen();}};
 // the whole maze is drawn under moonlight; the lantern lights a warm circle and only it reveals tickets and oil
 g.draw=()=>{const c=A.c;X.rr(0,0,W,H,0,'#0b1024');X.stars(40,9,0,0,22,.8);if(lo())X.glow(290,12,26,'#a8c0ff',.25);X.disc(290,12,7,'#fff4d8');X.disc(287,10,6,'#e8ecf8');
  const px=OX+p.x*CS+CS/2,py=OY+p.y*CS+CS/2,rad=26+oil*44,fl=lo()?Math.sin(t*.31)*1.5+Math.sin(t*.13)*1.2:0;
  // trampled earth with furrows
  X.rr(OX-2,OY-2,CW*CS+4,CH*CS+4,0,'#3a2c1c');for(let y=0;y<CH*CS;y+=4){c.fillStyle=y%8?'rgba(0,0,0,.12)':'rgba(255,220,160,.05)';c.fillRect(OX,OY+y,CW*CS,1);}
  for(let i=0;i<60;i++){const hx=hash(i,lvl),hy=hash(lvl,i);X.rr(OX+hx*CW*CS,OY+hy*CH*CS,2,1,0,'rgba(255,230,170,.12)');}
  // corn walls: a dark base, then rows of stalks with leaves and the odd ear, lit from the moon
  const wall=(x1,y1,w,h,sd)=>{X.rr(x1,y1+1,w,h,0,'rgba(0,0,0,.35)');X.rr(x1,y1,w,h,0,'#6a6a24');const n=Math.max(2,Math.round(Math.max(w,h)/4));
   for(let k=0;k<n;k++){const r=hash(sd,k),sx=w>h?x1+(k+.5)*w/n:x1+w/2+(r-.5)*2,sy=w>h?y1+h/2+(r-.5)*2:y1+(k+.5)*h/n;
    X.rr(sx-.5,sy-9,1.2,10,0,'#8aa03a');X.ell(sx-2,sy-6,2.6,1,'#a8b84a');X.ell(sx+2,sy-4,2.6,1,'#7a9030');X.ell(sx,sy-10,1.4,2.2,'#d8b850');if(r>.7)X.ell(sx+1.5,sy-7,1.1,2.4,'#f0cc58');}};
  for(let y=0;y<CH;y++)for(let x=0;x<CW;x++){const cx2=OX+x*CS,cy2=OY+y*CS,q=m[y][x];
   if(q.n)wall(cx2,cy2-2,CS,4,y*40+x);if(q.w)wall(cx2-2,cy2,4,CS,y*40+x+900);if(y===CH-1&&q.s)wall(cx2,cy2+CS-2,CS,4,y*40+x+1800);if(x===CW-1&&q.e)wall(cx2+CS-2,cy2,4,CS,y*40+x+2700);}
  for(const q of tix){const x=OX+q.x*CS+10,y=OY+q.y*CS+10;if(hyp(x-px,y-py)<rad){X.rr(x-5,y-3,10,7,1,'#ffd84a');X.rr(x-1,y-3,1,7,0,'#c83a3a');}}
  for(const q of cans){const x=OX+q.x*CS+10,y=OY+q.y*CS+10;if(hyp(x-px,y-py)<rad){X.rr(x-3,y-4,6,8,1,'#c83a3a');X.rr(x-1,y-6,2,2,0,'#8a8a94');}}
  const ex=OX+exit.x*CS+10,ey=OY+exit.y*CS+10;if(lo())X.glow(ex,ey,16,got>=3?'#7dff9a':'#ff5a4a',.7);X.rr(ex-7,ey-8,14,15,2,'#3a2414');X.rr(ex-6,ey-7,12,14,2,got>=3?'#3aa86a':'#6a2a2a');X.rr(ex-4,ey-9,8,2,0,'#c8a060');
  // darkness: moonlit blue beyond the lantern, falling off softly from its edge
  const R=rad+fl,gr=c.createRadialGradient&&c.createRadialGradient(px,py,R*.35,px,py,R*1.25);
  if(gr&&gr.addColorStop){gr.addColorStop(0,'rgba(6,8,22,0)');gr.addColorStop(.62,'rgba(6,8,22,.25)');gr.addColorStop(1,'rgba(6,8,26,.72)');c.fillStyle=gr;c.fillRect(0,0,W,H);}
  else{c.save();c.fillStyle='rgba(6,6,16,.7)';c.beginPath();c.rect(0,0,W,H);c.arc(px,py,R,0,TAU,true);c.fill('evenodd');c.restore();}
  if(lo()){X.glow(px,py,R*.95,'#ffb050',.22);for(let i=0;i<7;i++){const a=t*.01+i*.9,fx2=160+Math.sin(a*1.3+i)*140,fy2=130+Math.cos(a*.9+i*2)*90;X.glow(fx2,fy2,4,'#d8ff70',.5+.4*Math.sin(t*.1+i));}}
  hero(px,py+8,{s:.6,top:'#8a4a2a',bot:'#3a3a5a',hat:'beanie',hatC:'#ff8a3a',style:2,seed:61,bob:0,hold:c=>{X.disc(0,2,2.4,'#ffd060');}});
  fx.draw();X.bar('TICKETS '+got+'/3',String(g.score),'MAZE '+lvl,'#ffe27a','#ffe27a');X.meter(110,7,40,5,oil,oil<.25?'#ff5a4a':'#ffb040');};
 return g;}});

/* ================= SCARECROW (autumn) ================= */
A.add({id:'scarecrow',name:'SCARECROW',cat:'PARTY',tags:'crows crops field autumn whack',how:'ARROWS SWING THE SCARECROW TO A PATCH. CROWS THERE FLEE. DO NOT LET THEM EAT 5 PATCHES.',make(){
 const g={over:null,score:0},fx=X.fx(),PXs=[70,160,250],PYs=[90,145,200];let sx=1,sy=1,crops=Array(9).fill(1),crow=Array(9).fill(0),t=0,lost=0,shoo=0;
 g.update=()=>{t++;if(shoo)shoo--;const h=A.hit(0);let mv=false;if(h.l&&sx>0){sx--;mv=true;}if(h.r&&sx<2){sx++;mv=true;}if(h.u&&sy>0){sy--;mv=true;}if(h.d&&sy<2){sy++;mv=true;}if(mv||h.a){shoo=12;S('blip');}
  const i=sy*3+sx;if(crow[i]>0){crow[i]=0;g.score+=10;S('coin');fx.pop(PXs[sx],PYs[sy]-24,'SHOO! +10','#7dff9a');fx.debris(PXs[sx],PYs[sy]-10,'#1a1a2a',6,2);}
  if(t%Math.max(24,80-t/60|0)===0){const j=ri(9);if(crops[j]>0&&!crow[j]&&j!==i)crow[j]=1;}
  for(let j=0;j<9;j++)if(crow[j]>0&&crops[j]>0){crops[j]-=.0045+t/6e5;if(crops[j]<=0){crops[j]=0;crow[j]=0;lost++;S('lose');fx.pop(PXs[j%3],PYs[j/3|0]-24,'EATEN!','#ff5a4a');if(lost>=5){g.over='THE CROWS ATE THE HARVEST';return;}}}};
 g.draw=()=>{const c=A.c;X.cache('fs_scr_bg',()=>{const c=A.c;X.sky(['#d88a5a','#f0b878','#f8e0b0'],70);X.hills(60,12,'#a88a4a',0,.02,5);X.vg(0,60,W,180,['#a88a48','#987a38','#886a30']);for(let i=0;i<9;i++){const x=PXs[i%3],y=PYs[i/3|0];X.rr(x-38,y-20,76,34,6,'#6a4a2a');}});
  for(let i=0;i<9;i++){const x=PXs[i%3],y=PYs[i/3|0],v=crops[i];for(let k=0;k<6;k++){const px=x-30+k*12,hh=v*18;if(hh<1){X.rr(px-1,y+4,2,4,0,'#8a6a3a');continue;}X.rr(px-1,y+8-hh,2,hh,0,'#6a8a2a');if(i%3===0)X.disc(px,y+8-hh,3*v+1,'#ff8a2a');else if(i%3===1){X.ell(px,y+6-hh*.6,2.4,5*v,'#f0c040');}else{leaf(px-2,y+6-hh*.5,3,-.6,'#5aa83a');leaf(px+2,y+4-hh*.7,3,3.6,'#6ab84a');}}
   if(crow[i]){const bx=x+Math.sin(A.t*.2+i)*8,by=y-2;c.save();c.translate(bx,by);ink(c=>c.ellipse(0,0,7,5,0,0,TAU),'#1a1a2a',.6);X.disc(5,-4,3.5,'#2a2a3a');X.disc(6,-5,.9,'#ffe27a');X.poly([[8,-4],[12,-3+Math.sin(A.t*.8)*1],[8,-2]],'#e8a040');X.poly([[-6,-1],[-11,-3],[-11,2]],'#1a1a2a');c.restore();}}
  const x=PXs[sx],y=PYs[sy];c.save();c.translate(x,y-6);c.rotate(shoo?Math.sin(shoo*.8)*.4:0);X.rr(-1.5,-6,3,34,0,'#8a6a3a');X.rr(-22,-2,44,3,0,'#8a6a3a');hero(0,10,{s:1,top:'#c84a3a',bot:'#3a5a8a',hat:'straw',hatC:'#8a4a2a',style:0,skin:'#e8c878',hair:'#e8c050',seed:71,arm:shoo?-2.8:-1.6,mood:'happy',bob:0});c.restore();
  fx.draw();X.bar('EATEN '+lost+'/5',String(g.score),'','#ff8a7a','#ffe27a');};
 return g;}});

/* ================= APPLE BOBBING (autumn, versus) ================= */
A.add({id:'applebob',name:'APPLE BOBBING',cat:'VERSUS',vs:1,tags:'apples tub party autumn timing',how:'APPLES CIRCLE THE TUB. PRESS A AS ONE PASSES UNDER YOUR FACE TO BITE. FIRST TO 10.',make(){
 const g={over:null,score:0},fx=X.fx(),TX=[86,234],TY=150;let P=[0,1].map(()=>({s:0,dip:0,miss:0,ap:[{a:0},{a:2.1},{a:4.2}],sp:.02})),t=0;
 g.timeUp=()=>tu(P[0].s,P[1].s);
 g.update=()=>{t++;if(A.cpu){const q=P[1],o={};const near=q.ap.some(a=>Math.abs(Math.cos(a.a)*40)<6+(1-A.ai)*10&&Math.sin(a.a)<0);if(!q.dip&&!q.miss&&near&&Math.random()<.3+A.ai*.4&&t%2)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i];p.sp=.02+p.s*.003;for(const a of p.ap)a.a+=p.sp*(1+Math.sin(t*.01+i)*.3);if(p.dip)p.dip--;if(p.miss)p.miss--;
   if(A.hit(i).a&&!p.dip&&!p.miss){p.dip=24;const k=p.ap.findIndex(a=>Math.abs(Math.cos(a.a)*40)<9&&Math.sin(a.a)<0);if(k>=0){p.s++;if(i===0){g.score=p.s;S('coin');}fx.pop(TX[i],TY-50,'CHOMP!','#7dff9a');fx.spark(TX[i],TY-10,'#9ae8ff',10,2);p.ap[k].a+=Math.PI;if(p.s>=10){g.over=A.win(i);S('win');return;}}else{p.miss=40;if(i===0)S('hit');fx.pop(TX[i],TY-50,'SPLASH','#9ae8ff');fx.spark(TX[i],TY-6,'#9ae8ff',14,2.4);}}}};
 g.draw=()=>{const c=A.c;X.cache('fs_ab_bg',()=>{const c=A.c;X.vg(0,0,W,H,['#3a2a3a','#5a3a3a','#4a2a2a']);for(let i=0;i<8;i++){X.rr(i*42,0,40,150,0,i%2?'rgba(255,200,120,.05)':'rgba(0,0,0,.05)');}for(let i=0;i<12;i++){const x=14+i*27;X.stroke([[x,10],[x+13,18]],'#3a2a20',1);X.disc(x+13,22,5,['#ff8a3a','#ffd84a','#c84a3a'][i%3]);}X.vg(0,170,W,70,['#6a4a2a','#4a3020']);});
  if(lo())for(let i=0;i<12;i++)X.glow(27+i*27,22,10,'#ffb050',.25);
  for(let i=0;i<2;i++){const p=P[i],tx=TX[i];X.ell(tx,TY+38,62,10,'rgba(0,0,0,.35)');ink(c=>{c.moveTo(tx-58,TY);c.lineTo(tx+58,TY);c.lineTo(tx+48,TY+40);c.lineTo(tx-48,TY+40);c.closePath();},X.lg(tx-58,0,tx+58,0,['#8a8a94','#c8c8d0','#6a6a74']),.8);X.ell(tx,TY,56,12,X.lg(0,TY-12,0,TY+12,['#5ac8f0','#2a8ad8']));
   c.strokeStyle='rgba(255,255,255,.35)';c.lineWidth=1;c.beginPath();c.ellipse(tx,TY,40+Math.sin(A.t*.05)*3,8,0,0,TAU);c.stroke();
   const ord=p.ap.slice().sort((a,b)=>Math.sin(a.a)-Math.sin(b.a));for(const a of ord){const ax2=tx+Math.cos(a.a)*40,ay2=TY+Math.sin(a.a)*7;ink(c=>c.arc(ax2,ay2-2,5.5,0,TAU),X.rg(ax2-2,ay2-4,.5,ax2,ay2-2,5.5,['#ff8a8a','#d82a2a']),.6);X.rr(ax2-.5,ay2-9,1,3,0,'#5a3a20');}
   const dy=p.dip?Math.sin(p.dip/24*Math.PI)*26:0;hero(tx,TY-24+dy+30,{s:1.3,top:i?'#c84a7a':'#3a8ad8',bot:'#2a2a3a',style:i?2:0,seed:i*7+8,mood:p.miss?'o':'happy',arm:-.2,bob:0});if(p.miss)for(let k=0;k<3;k++)X.disc(tx-8+k*8,TY-40+((A.t+k*7)%14),1.4,'#9ae8ff');
   X.rr(tx-1,TY-10,2,6,0,'rgba(255,255,255,.6)');for(let k=0;k<Math.min(10,p.s);k++)X.disc(tx-27+k*6,TY+54,2.6,'#e83a3a');}
  fx.draw();X.bar();A.hud2(P[0].s,P[1].s);};
 return g;}});

/* ================= SNOWMAN (winter) ================= */
A.add({id:'snowmanbuild',name:'SNOWMAN',cat:'PUZZLE',tags:'snow roll snowman winter build sizes',how:'ROLL OVER FRESH SNOW TO GROW THE BALL. A STACKS IT: BIG, THEN MEDIUM, THEN SMALL.',make(){
 const g={over:null,score:0},fx=X.fx(),GW=32,GH=19,CS=10,SX=160,SY=48;let snow=[],b={x:60,y:150,r:4,d:1,rot:0},stack=[],t=0,built=0,want=[15,11,7];
 const fill=()=>{snow=[];for(let i=0;i<GW*GH;i++)snow.push(1);};fill();
 g.update=()=>{t++;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)b.d=dx;const sp=1.6-b.r*.03;b.x=cl(b.x+dx*sp,8,W-8);b.y=cl(b.y+dy*sp,70,232);if(dx||dy){b.rot+=(dx||dy)*.12;const cx2=Math.floor(b.x/CS),cy2=Math.floor((b.y-50)/CS);const i=cy2*GW+cx2;if(cx2>=0&&cy2>=0&&cx2<GW&&cy2<GH&&snow[i]>0){const take=Math.min(snow[i],.25);snow[i]-=take;b.r=Math.min(26,b.r+take*.18*(10/Math.max(6,b.r)));}}
  if(t%5===0){const i=ri(GW*GH);snow[i]=Math.min(1,snow[i]+.5);}
  if(A.hit(0).a){if(hyp(b.x-SX,b.y-(SY+40))<34&&b.r>5){const n=stack.length,tg=want[n],err=Math.abs(b.r-tg),prev=stack[n-1];if(prev&&b.r>prev+1){S('lose');fx.pop(SX,SY,'TOO BIG FOR THE TOP','#ff8a7a');}else{stack.push(b.r);const p=Math.max(0,40-Math.round(err*6));g.score+=p;S(err<2?'win':'coin');fx.pop(SX,SY-10,(err<2?'PERFECT ':'')+'+'+p,err<2?'#7dff9a':'#ffe27a');b={x:60,y:150,r:4,d:1,rot:0};
     if(stack.length===3){built++;g.score+=50;S('win');fx.pop(SX,SY-26,'SNOWMAN '+built+'! +50','#7dff9a');setTimeout0();}}}else S('blip');}};
 let clr=0;const setTimeout0=()=>{clr=90;};
 const upd0=g.update;g.update=()=>{if(clr){clr--;if(clr===0){stack=[];fill();}return;}upd0();};
 g.draw=()=>{const c=A.c;X.cache('fs_sm_bg2',()=>{const c=A.c;X.sky(['#4a5aa8','#c890b8','#ffd0a8'],60);X.disc(250,40,10,'#fff0d0');X.hills(50,14,'#c8d0e8',1,.03,4);X.hills(58,8,'#e8eef8',0,.02,3);cottage(140,60,30,20,'#8a5a3a','#e8eef8',1);for(let i=0;i<9;i++)if(Math.abs(i*38+8-160)>24)pine(i*38+8,62,26,'#2a4a4a');});
  if(lo())for(let k=0;k<5;k++){const sy=34-((A.t*.25+k*9)%30);c.fillStyle='rgba(230,230,240,'+(.35-k*.05)+')';c.beginPath();c.arc(162+Math.sin(A.t*.03+k)*2+k*1.5,sy,2+k*.7,0,TAU);c.fill();}
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const v=snow[y*GW+x];X.rr(x*CS,50+y*CS,CS,CS,0,v>.7?'#f8fbff':v>.35?'#e6ecf6':v>.05?'#d2dcec':'#cfd8e8');if(v<=.35){X.rr(x*CS+1,50+y*CS+1,CS-2,CS-2,CS*.4,v>.05?'#a8b4a4':'#7a8c62');if(v<=.05)for(let k=0;k<3;k++)X.rr(x*CS+3+k*(CS-6)/2,50+y*CS+CS*.3+hash(x+k,y)*CS*.3,1,3,0,'#5a7040');}if(v>.7&&lo()&&hash(x,y)>.93&&(A.t+x*7)%50<8)X.rr(x*CS+CS/2,50+y*CS+CS/2,1,1,0,'#ffffff');}
  if(lo()){const sg=c.createLinearGradient&&c.createLinearGradient(0,50,0,H);if(sg&&sg.addColorStop){sg.addColorStop(0,'rgba(90,110,180,.22)');sg.addColorStop(1,'rgba(255,200,170,.08)');c.fillStyle=sg;c.fillRect(0,50,W,H-50);}}
  c.fillStyle='rgba(255,255,255,.7)';for(let i=0;i<40;i++)c.fillRect((i*47+A.t*.3)%W,(i*31+A.t*.8)%H,1.5,1.5);
  const base=SY+56;X.ell(SX,base+2,24,5,'rgba(0,0,0,.15)');let yy=base;for(let i=0;i<stack.length;i++){const r=stack[i];yy-=r;ink(c=>c.arc(SX,yy,r,0,TAU),X.rg(SX-r*.4,yy-r*.4,1,SX,yy,r,['#ffffff','#e8f0f8','#b8c8e0']),.8);if(i===2){X.disc(SX-r*.35,yy-r*.2,1.4,'#1a1a1a');X.disc(SX+r*.35,yy-r*.2,1.4,'#1a1a1a');X.poly([[SX,yy],[SX+9,yy+1.5],[SX,yy+3]],'#ff8a2a');X.rr(SX-r*.8,yy-r-6,r*1.6,3,0,'#1a1a1a');X.rr(SX-r*.5,yy-r-14,r,9,0,'#1a1a1a');}
   if(i===1){for(let k=0;k<3;k++)X.disc(SX,yy-r*.4+k*r*.4,1.3,'#1a1a1a');X.stroke([[SX-r,yy],[SX-r-12,yy-8]],'#6a4a2a',1.4);X.stroke([[SX+r,yy],[SX+r+12,yy-8]],'#6a4a2a',1.4);}yy-=r;}
  if(stack.length<3){const nr=want[stack.length];c.setLineDash([3,3]);c.strokeStyle='rgba(60,80,120,.6)';c.beginPath();c.arc(SX,yy-nr,nr,0,TAU);c.stroke();c.setLineDash([]);}
  ink(c=>c.arc(b.x,b.y-b.r,b.r,0,TAU),X.rg(b.x-b.r*.4,b.y-b.r*1.4,1,b.x,b.y-b.r,b.r,['#ffffff','#e8f0f8','#b8c8e0']),.8);c.strokeStyle='rgba(150,170,200,.6)';c.beginPath();c.arc(b.x,b.y-b.r,b.r*.6,b.rot,b.rot+1.5);c.stroke();
  hero(b.x-b.d*(b.r+8),b.y,{s:.95,d:b.d,top:'#c83a5a',bot:'#2a3a6a',hat:'beanie',hatC:'#3ab0c8',style:1,seed:81,arm:-.6,mood:'happy',st:A.t*.2});
  fx.draw();X.bar('SNOWMEN '+built,String(g.score),'NEXT '+(stack.length<3?['BIG','MEDIUM','SMALL'][stack.length]:'-')+' / BALL '+Math.round(b.r),'#ffe27a','#ffe27a');};
 return g;}});

/* ================= SLEIGH RIDE (winter) ================= */
A.add({id:'sleighride',name:'SLEIGH RIDE',cat:'CLASSICS',tags:'sleigh gifts chimney winter night drop',how:'UP/DOWN FLY THE SLEIGH. A DROPS A GIFT INTO A CHIMNEY. DODGE THE BELL TOWERS.',make(){
 const g={over:null,score:0},fx=X.fx(),HW=64;let x=0,y=80,gifts=[],t=0,lives=3,inv=0,left=30,done={};
 const house=k=>({tall:hash(k,3)<.12&&k>3,h:40+hash(k,1)*40,cx:k*HW+20+hash(k,2)*24});
 g.update=()=>{t++;if(inv)inv--;const v=1.7+t/5000;x+=v;y=cl(y+ay(A.in(0))*1.8,30,150);if(A.hit(0).a&&left>0){left--;gifts.push({x:x+80,y:y+8,vx:v*.9,vy:0,c:['#ff4a6a','#4ab0ff','#7dff9a','#ffd84a'][ri(4)]});S('jump');}
  for(const o of gifts){o.vy+=.14;o.x+=o.vx-v*0;o.y+=o.vy;const k=Math.floor(o.x/HW),hs=house(k),top=H-30-hs.h;if(!o.done&&o.y>=top-12){if(!hs.tall&&Math.abs(o.x-hs.cx)<7&&!done[k]){done[k]=1;g.score+=25;S('coin');fx.pop(o.x-x,top-30,'DELIVERED +25','#7dff9a');fx.spark(o.x-x,top-14,'#ffe27a',10,1.6);}else{fx.debris(o.x-x,top-12,o.c,6,1.4);S('hit');}o.done=1;}}gifts=gifts.filter(o=>!o.done);
  const k0=Math.floor((x+80)/HW);for(const k of[k0,k0+1]){const hs=house(k);if(hs.tall&&!inv&&Math.abs(k*HW+32-(x+80))<20&&y+10>H-30-hs.h-50){lives--;inv=90;S('hit');A.shake=6;fx.pop(80,y-10,'BONG!','#ff8a5a');if(lives<=0){g.over='SLEIGH GROUNDED';return;}}}
  if(t%720===0){left+=8;fx.pop(160,40,'+8 GIFTS','#ffe27a');}if(left<=0&&!gifts.length&&t%120===0)g.over='OUT OF GIFTS';};
 g.draw=()=>{const c=A.c;X.cache('fs_sl_bg',()=>{const c=A.c;X.sky(['#0a1030','#1a2a5a','#3a4a7a'],240);X.stars(90,11,0,0,160,1);X.disc(260,44,16,'#fff8e0');X.glow(260,44,40,'#fff0c0',.25);X.hills(200,20,'#2a3a5a',0,.015,2);});
  for(let k=Math.floor(x/HW)-1;k<Math.floor(x/HW)+7;k++){const hs=house(k),hx=k*HW-x,top=H-30-hs.h;if(hs.tall){X.rr(hx+18,top-50,28,hs.h+80,0,'#5a5a7a');X.poly([[hx+14,top-50],[hx+32,top-84],[hx+50,top-50]],'#3a3a5a');X.disc(hx+32,top-34,6,'#ffd880');X.rr(hx+31,top-90,2,8,0,'#ffd84a');continue;}
   X.rr(hx,top,HW-4,hs.h+30,0,['#6a4a5a','#4a5a7a','#5a4a4a'][k%3]);X.poly([[hx-3,top],[hx+(HW-4)/2,top-16],[hx+HW-1,top]],'#e8eef8');for(let w=0;w<2;w++)X.rr(hx+8+w*30,top+10,12,12,1,hash(k,w)<.6?'#ffd880':'#2a2a3a');
   X.rr(hs.cx-x-5,top-22,10,16,0,'#a8544a');X.rr(hs.cx-x-7,top-24,14,4,1,'#e8eef8');if(done[k]){if(lo())X.glow(hs.cx-x,top-26,10,'#ffe27a',.5);}else if(lo()&&A.t%60<30)X.disc(hs.cx-x,top-28,2,'rgba(255,255,255,.6)');}
  X.rr(0,H-30,W,30,0,'#e8eef8');for(let i=0;i<50;i++)X.disc((i*37+A.t*.4)%W,(i*53+A.t*.9)%H,1,'rgba(255,255,255,.8)');
  for(const o of gifts){X.rr(o.x-x-4,o.y-4,8,8,1,o.c);X.rr(o.x-x-1,o.y-4,2,8,0,'#ffffff');}
  if(!(inv&&A.t%6<3)){const sx=80,bob=Math.sin(A.t*.1)*2;for(let r=0;r<2;r++){const rx=sx+40+r*22,ry=y+4+bob+Math.sin(A.t*.3+r)*2;ink(c=>c.ellipse(rx,ry,8,4,0,0,TAU),'#8a5a3a',.6);X.disc(rx+8,ry-4,3,'#8a5a3a');X.stroke([[rx+8,ry-7],[rx+6,ry-12]],'#6a4a2a',1);X.stroke([[rx+9,ry-7],[rx+12,ry-12]],'#6a4a2a',1);if(r===1)X.disc(rx+11,ry-3,1.4,'#ff3a3a');}
   X.stroke([[sx+16,y+bob],[sx+36,y+4+bob]],'#c8a070',1);ink(c=>{c.moveTo(sx-16,y-4+bob);c.lineTo(sx+14,y-4+bob);c.quadraticCurveTo(sx+20,y+6+bob,sx+12,y+10+bob);c.lineTo(sx-14,y+10+bob);c.closePath();},X.lg(0,y-4,0,y+10,['#e83a3a','#a81a1a']),.8);X.rr(sx-16,y+12+bob,32,2,1,'#d8b050');
   hero(sx,y-2+bob,{s:.8,top:'#c83a3a',bot:'#c83a3a',hat:'beanie',hatC:'#c83a3a',style:3,hair:'#ffffff',seed:91,bob:0,mood:'happy',arm:-1.4});for(let k=0;k<Math.min(4,left);k++)X.rr(sx-12+k*5,y-8+bob,4,4,1,['#ff4a6a','#4ab0ff','#7dff9a','#ffd84a'][k]);}
  fx.draw();X.bar('GIFTS '+left,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= COCOA CAFE (winter) ================= */
const TOP=[['l','MARSH','#fff4f0'],['u','CREAM','#ffffff'],['r','CINN','#c8743a'],['d','CHOC','#5a3020']];
A.add({id:'cocoacafe',name:'COCOA CAFE',cat:'SIM',tags:'cocoa cafe orders toppings winter serve',how:'ARROWS ADD TOPPINGS TO MATCH THE ORDER. A SERVES THE MUG, B TIPS IT OUT.',make(){
 const g={over:null,score:0},fx=X.fx();let q=[],cup=[],t=0,lives=3,served=0;
 const cust=()=>({ord:[...Array(2+Math.min(3,ri(2)+(served/4|0)))].map(()=>ri(4)),pat:1,look:ri(6),seed:ri(99)});for(let i=0;i<3;i++)q.push(cust());
 const same=(a,b)=>a.length===b.length&&a.slice().sort().join()===b.slice().sort().join();
 g.update=()=>{t++;const h=A.hit(0);for(let i=0;i<4;i++)if(h[TOP[i][0]]&&cup.length<6){cup.push(i);S('blip');}if(h.b&&cup.length){cup=[];S('hit');}
  if(h.a&&cup.length){const c0=q[0];if(same(cup,c0.ord)){const p=20+c0.ord.length*10+Math.round(c0.pat*20);g.score+=p;served++;S('win');fx.pop(150,100,'YUM! +'+p,'#7dff9a');}else{lives--;S('lose');fx.pop(150,100,'NOT MY ORDER','#ff6a5a');if(lives<=0){g.over='THE CAFE CLOSED EARLY';return;}}cup=[];q.shift();q.push(cust());}
  q[0].pat-=.0011+served*.00006;if(q[0].pat<=0){lives--;S('lose');fx.pop(150,100,'LEFT ANGRY','#ff6a5a');q.shift();q.push(cust());cup=[];if(lives<=0){g.over='THE CAFE CLOSED EARLY';return;}}};
 g.draw=()=>{const c=A.c;X.cache('fs_cc_bg',()=>{const c=A.c;X.vg(0,0,W,H,['#5a3a2a','#7a4a34','#4a2a1e']);X.rr(20,20,120,70,4,'#2a1a14');X.vg(24,24,112,62,['#1a2a5a','#3a4a7a']);for(let i=0;i<20;i++)X.disc(24+hash(i,1)*112,24+hash(i,2)*62,1,'#ffffff');X.rr(78,24,2,62,0,'#2a1a14');
   for(let i=0;i<5;i++){X.rr(180+i*26,30,20,26,2,['#c84a3a','#3a8ad8','#e8b030','#4aa86a','#8a4ad8'][i]);X.rr(184+i*26,26,12,4,1,'#e8e8f0');}X.rr(176,56,136,4,1,'#8a5a34');X.vg(0,170,W,70,['#a8744a','#8a5a3a','#6a4028']);X.rr(0,166,W,6,0,'#c8946a');});
  if(lo()){X.glow(80,60,40,'#ffd080',.08);X.glow(240,120,80,'#ffb060',.12);}
  for(let i=q.length-1;i>=0;i--){const cu=q[i],L=LOOKS[cu.look],x=150+i*56,yy=166;hero(x,yy,{s:1.2-i*.12,top:L[0],bot:L[1],hat:'beanie',hatC:L[3]||'#3ab0c8',style:L[4],seed:cu.seed,mood:i===0&&cu.pat<.3?'sad':'happy',arm:i===0?-1.4:undefined});}
  const c0=q[0];X.panel(118,62,30+c0.ord.length*16,30,'#ffd84a');for(let k=0;k<c0.ord.length;k++){const tp=TOP[c0.ord[k]];X.disc(132+k*16,77,6,tp[2]);X.disc(132+k*16,77,6,'rgba(0,0,0,0)');ink(c=>c.arc(132+k*16,77,6,0,TAU),tp[2],.6);}X.meter(122,96,c0.ord.length*16+22,4,c0.pat,c0.pat<.3?'#ff5a4a':'#7dff9a');
  const MX=60,MY=200;ink(c=>{c.moveTo(MX-20,MY-30);c.lineTo(MX+20,MY-30);c.lineTo(MX+16,MY);c.lineTo(MX-16,MY);c.closePath();},X.lg(MX-20,0,MX+20,0,['#e8e8f0','#ffffff','#c8c8d0']),.8);c.strokeStyle='#e8e8f0';c.lineWidth=3;c.beginPath();c.arc(MX+20,MY-16,7,-1.4,1.4);c.stroke();X.ell(MX,MY-29,19,3,'#5a3020');
  for(let k=0;k<cup.length;k++){const tp=TOP[cup[k]],px=MX-12+(k%3)*12,py=MY-33-Math.floor(k/3)*6;if(cup[k]===1)X.disc(px,py,5,'#ffffff');else if(cup[k]===0)X.rr(px-3,py-3,6,6,1.5,'#fff4f0');else for(let s=0;s<4;s++)X.disc(px-3+s*2,py-1+(s%2),1.2,tp[2]);}
  if(lo())for(let k=0;k<3;k++){c.globalAlpha=.4;X.disc(MX-6+k*6+Math.sin(A.t*.05+k)*3,MY-44-((A.t*.4+k*10)%20),3,'#ffffff');c.globalAlpha=1;}
  for(let i=0;i<4;i++){const tp=TOP[i],bx=12+i*30;X.rr(bx,214,26,20,4,'rgba(0,0,0,.35)');T(tp[1].slice(0,5),bx+13,226,tp[2],1,'c');const ar=[[-1,0],[0,-1],[1,0],[0,1]][i];X.poly([[bx+13+ar[0]*4,218+ar[1]*4],[bx+13-ar[1]*3-ar[0]*2,218+ar[0]*3-ar[1]*2],[bx+13+ar[1]*3-ar[0]*2,218-ar[0]*3-ar[1]*2]],'#ffffff');}
  fx.draw();X.bar('SERVED '+served,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= SNOWPLOW (winter) ================= */
A.add({id:'snowplow',name:'SNOWPLOW',cat:'ACTION',tags:'plow snow streets winter town drive',how:'ARROWS TURN THE PLOW AT CROSSROADS. CLEAR DEEP SNOW, AVOID PARKED CARS. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),CS=16,GW=20,GH=13,OY=24;let snow=[],p={x:0,y:0,dx:1,dy:0},want=null,mv=0,t=0,lives=3,inv=0,cars=[],cleared=0;
 const road=(x,y)=>x>=0&&y>=0&&x<GW&&y<GH&&(x%4===0||y%4===0);for(let i=0;i<GW*GH;i++)snow.push(.6+rnd(.4));
 g.update=()=>{t++;if(inv)inv--;const h=A.hit(0);if(h.l)want=[-1,0];if(h.r)want=[1,0];if(h.u)want=[0,-1];if(h.d)want=[0,1];
  if(++mv>=Math.max(6,10-t/1500|0)){mv=0;if(want&&road(p.x+want[0],p.y+want[1])){p.dx=want[0];p.dy=want[1];want=null;}if(!road(p.x+p.dx,p.y+p.dy)){const opts=[[p.dy,p.dx],[-p.dy,-p.dx],[-p.dx,-p.dy]].filter(o=>road(p.x+o[0],p.y+o[1]));if(opts.length){[p.dx,p.dy]=opts[0];}}
   p.x+=p.dx;p.y+=p.dy;const i=p.y*GW+p.x;if(snow[i]>.4){g.score+=Math.round(snow[i]*6);cleared++;if(snow[i]>.8)S('blip');fx.debris(OY+0+p.x*CS+8-OY+0,OY+p.y*CS+8,'#ffffff',3,1.2);}snow[i]=0;
   const ci=cars.findIndex(c2=>c2.x===p.x&&c2.y===p.y);if(ci>=0&&!inv){lives--;inv=60;cars.splice(ci,1);S('hit');A.shake=5;fx.pop(p.x*CS+8,OY+p.y*CS-8,'CRUNCH!','#ff6a5a');if(lives<=0){g.over='PLOW IN THE DITCH';return;}}}
  for(let k=0;k<3;k++){const i=ri(GW*GH);snow[i]=Math.min(1,snow[i]+.08);}if(t%240===0&&cars.length<5){let x,y,k=0;do{x=ri(GW);y=ri(GH);k++;}while((!road(x,y)||hyp(x-p.x,y-p.y)<5)&&k<50);if(road(x,y))cars.push({x,y,c:['#c83a3a','#3a6ac8','#e8b030'][ri(3)]});}};
 g.draw=()=>{const c=A.c;X.cache('fs_plow_bg',()=>{const c=A.c;X.rr(0,0,W,H,0,'#dfe8f4');for(let y=0;y<GH;y++)for(let x=0;x<GW;x++)if(!road(x,y)&&x%4===2&&y%4===2){cottage(x*CS-12,OY+y*CS+20,40,22,['#c8a088','#a8b0c8','#d8c098'][(x+y)%3],'#8a3a2a',1);}});
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){if(!road(x,y))continue;const v=snow[y*GW+x],px=x*CS,py=OY+y*CS;X.rr(px,py,CS,CS,0,'#4a4a54');if(v>.05){c.globalAlpha=Math.min(.8,v);X.rr(px+1,py+1,CS-2,CS-2,3,v>.7?'#ffffff':'#e8eef8');c.globalAlpha=1;}}
  for(const c2 of cars){const px=c2.x*CS,py=OY+c2.y*CS;X.rr(px+2,py+3,12,10,2,c2.c);X.rr(px+4,py+5,8,4,1,'#8ac8f0');X.rr(px+2,py+2,12,3,1,'#ffffff');}
  c.fillStyle='rgba(255,255,255,.85)';for(let i=0;i<50;i++)c.fillRect((i*47+A.t*.3)%W,(i*31+A.t*.9)%H,1.5,1.5);
  if(!(inv&&A.t%6<3)){const px=p.x*CS+8,py=OY+p.y*CS+8,a=Math.atan2(p.dy,p.dx);c.save();c.translate(px,py);c.rotate(a);X.rr(-7,-5,13,10,2,'#f0b030');X.rr(-4,-4,6,8,1,'#8ac8f0');X.rr(6,-7,3,14,1,'#c8c8d0');if(lo()&&A.t%20<10)X.disc(-3,0,1.6,'#ff8a2a');c.restore();if(lo())X.glow(px,py,10,'#ffb030',.25);}
  fx.draw();X.bar('CLEARED '+cleared,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= ICICLE ALLEY (winter) ================= */
A.add({id:'iciclealley',name:'ICICLE ALLEY',cat:'ACTION',tags:'icicles dodge winter street mittens cocoa',how:'LEFT/RIGHT WALK THE ALLEY. ICICLES SHAKE, THEN FALL - DODGE THEM. GRAB MITTENS AND COCOA.',make(){
 const g={over:null,score:0},fx=X.fx(),EY=66,GY=214;let x=160,st=0,d=1,ic=[],items=[],t=0,lives=3,inv=0,warm=1;
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0),dx=ax(k);if(dx)d=dx;x=cl(x+dx*2.4,10,W-10);if(dx)st+=.45;warm-=.0008;if(warm<=0){warm=.6;lives--;S('lose');fx.pop(x,GY-40,'TOO COLD','#9ae8ff');if(lives<=0){g.over='FROZEN STIFF';return;}}
  if(t%Math.max(14,40-t/120|0)===0)ic.push({x:10+rnd(W-20),y:EY,l:0,st:0,vy:0,len:10+rnd(12)});
  for(const o of ic){if(o.st===0){o.l=Math.min(1,o.l+.02);if(o.l>=1){o.st=1;o.w=50;}}else if(o.st===1){if(--o.w<=0){o.st=2;S('blip');}}else{o.vy+=.3;o.y+=o.vy;if(!o.done&&!inv&&o.y+o.len>GY-30&&o.y<GY&&Math.abs(o.x-x)<8){o.done=1;lives--;inv=80;S('hit');A.shake=5;fx.pop(x,GY-44,'OUCH!','#ff6a5a');if(lives<=0){g.over='BONKED BY AN ICICLE';return;}}if(o.y>GY-o.len*.5&&!o.done){o.done=1;fx.debris(o.x,GY,'#c8e8ff',6,1.6);}}}ic=ic.filter(o=>!o.done);
  if(t%150===0)items.push({x:10+rnd(W-20),k:Math.random()<.5?'m':'c',l:400});for(const o of items){o.l--;if(Math.abs(o.x-x)<12){o.l=0;g.score+=o.k==='c'?20:10;warm=Math.min(1,warm+(o.k==='c'?.4:.2));S('coin');fx.pop(o.x,GY-30,o.k==='c'?'COCOA +20':'MITTENS +10','#ffe27a');}}items=items.filter(o=>o.l>0);if(t%30===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('fs_ia_bg',()=>{const c=A.c;X.sky(['#2a3a6a','#5a6a9a','#a8b0d0'],120);X.disc(60,40,10,'#fff8e0');X.skyline(110,'#3a4a6a',0,3,1);X.rr(0,0,W,EY,0,'#5a4a5a');for(let i=0;i<8;i++){X.rr(i*42,10,36,40,1,'#3a2a3a');X.rr(i*42+4,14,12,14,1,'#ffd880');X.rr(i*42+20,14,12,14,1,hash(i,1)<.5?'#ffd880':'#2a2a3a');}
   X.poly([[0,EY],[W,EY],[W,EY-8],[0,EY-8]],'#e8eef8');X.vg(0,EY,W,GY-EY,['#8a8aa8','#7a7a98','#6a6a88']);for(let i=0;i<8;i++){X.rr(i*42+6,90,30,GY-90,1,'#5a5a78');X.rr(i*42+16,150,10,64,1,'#3a2a2a');}X.vg(0,GY,W,H-GY,['#f0f4fc','#d8e0f0']);});
  for(const o of ic){const sh=o.st===1?Math.sin(A.t*1.2)*1.2:0,len=o.len*o.l;ink(c=>{c.moveTo(o.x-3+sh,o.y);c.lineTo(o.x+3+sh,o.y);c.lineTo(o.x+sh,o.y+len);c.closePath();},X.lg(o.x-3,0,o.x+3,0,['#e8f8ff','#a8d8f0','#d8f0ff']),.5);if(o.st===2&&lo())X.ell(o.x,GY-1,6*(1-(GY-o.y)/150),1.5,'rgba(0,0,0,.2)');}
  for(const o of items){if(o.k==='m'){X.rr(o.x-6,GY-12,6,9,2,'#ff4a4a');X.rr(o.x,GY-12,6,9,2,'#ff4a4a');X.rr(o.x-6,GY-5,12,2,0,'#ffffff');}else{X.rr(o.x-4,GY-12,8,10,1,'#ffffff');X.rr(o.x-4,GY-12,8,2,0,'#8a5a3a');if(lo())X.disc(o.x,GY-16-(A.t%20)*.3,1.5,'rgba(255,255,255,.6)');}}
  c.fillStyle='rgba(255,255,255,.8)';for(let i=0;i<40;i++)c.fillRect((i*47+A.t*.3)%W,(i*31+A.t*.8)%H,1.5,1.5);
  if(!(inv&&A.t%6<3))hero(x,GY,{s:1.1,st,d,top:'#3a8a8a',bot:'#2a2a3a',hat:'beanie',hatC:'#ff4a6a',style:2,seed:101,mood:warm<.3?'sad':'happy'});
  fx.draw();X.bar('WARMTH',String(g.score),'','#ff9a7a','#ffe27a');X.meter(76,7,60,5,warm,warm<.25?'#9ae8ff':'#ff9a7a');hearts(lives,250);};
 return g;}});

/* ================= SUMMIT RUSH (full 3D world) ================= */
window.A.add({id:'summitrush',name:'SUMMIT RUSH',cat:'SPORTS',style:'SSX',v:71,href:'summit/',img:'docs/cards/summitrush.jpg',how:'CARVE THROUGH THE GATES, SPIN OFF KICKERS AND BEAT THREE RIDERS DOWN THE MOUNTAIN.',tags:'snowboard ski race downhill tricks spins gates kicker mountain sunset golden hour ssx steep 3d'});

/*NEXT*/
})();
