/* PIXEL ARCADE - voyage pack (round 30): twenty cabinets set around the world - deserts, jungles, fjords, carnivals and
   snowy passes - with the frontier pack's character kit (A.kit, from games/frontier.js) for the people and animals. */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),TAU=Math.PI*2,hyp=Math.hypot;
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const K=A.kit,{hero,critter,tree,pine,cottage,cloud,ink}=K;
const T=(s,x,y,col,sc,al)=>X.ot(s,x,y,col,sc||1,al);
const hearts=(n,x)=>{for(let i=0;i<3;i++)X.heart(x+i*12,8,1,i<n?'#ff4f6d':'rgba(255,255,255,.2)');};
const LOOKS=[['#c84a3a','#2a2a3a','cap','#2a6ac8',0],['#3a8ad8','#2a2a3a','straw','#c84a3a',2],['#f0b040','#3a3a5a','beanie','#c83a8a',1],['#4aa86a','#3a2a2a',null,null,3],['#8a4ad8','#2a2a3a','hood','#5a2a8a',4],['#e86a8a','#2a3a5a',null,null,2]];
const crowd=(y,n,s,seed)=>{for(let i=0;i<n;i++){const L=LOOKS[(i+seed)%6];hero(8+i*(W-16)/(n-1),y+Math.abs(Math.sin(A.t*.12+i))*1.5,{s,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:i+seed,bob:0,arm:(i+seed)%3===0?-2.6:undefined,skin:['#f2c29a','#c68a5e','#8a5a3a','#f6d2b8'][i%4],mood:'happy'});}};

/* ================= CAMEL CARAVAN ================= */
A.add({id:'camelcaravan',name:'CAMEL CARAVAN',cat:'CLASSICS',tags:'desert camel dunes oasis',how:'A OR UP HOPS THE LEAD CAMEL OVER CACTI. GRAB WATER. SANDSTORMS HIDE THE ROAD. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),GY=196;let x=0,py=0,vy=0,ob=[],t=0,lives=3,inv=0,water=1,storm=0,trail=[];
 g.update=()=>{t++;if(inv)inv--;const sp=2+t/2500;x+=sp;water-=.0005;if(water<=0){water=.5;lives--;S('lose');fx.pop(160,90,'THIRSTY!','#ff8a5a');if(lives<=0){g.over='DRIED OUT';return;}}const h=A.hit(0);if((h.a||h.u)&&py===0){vy=-4.4;S('jump');}vy+=.24;py=Math.min(0,py+vy);if(py===0)vy=0;
  if(t%Math.max(50,110-t/40|0)===0)ob.push(Math.random()<.3?{k:'w',x:x+W+20,y:GY-30-rnd(30)}:{k:'c',x:x+W+20,h:14+ri(12)});if(t%900===400)storm=300;if(storm)storm--;
  for(const o of ob){if(o.k==='c'&&!o.hit&&!inv&&Math.abs(o.x-x-80)<10&&py>-o.h){o.hit=1;lives--;inv=80;S('hit');A.shake=5;fx.pop(80,GY-50,'PRICKLY!','#ff6a5a');if(lives<=0)g.over='CARAVAN STOPPED';}if(o.k==='w'&&!o.got&&hyp(o.x-x-80,o.y-(GY-26+py))<14){o.got=1;water=Math.min(1,water+.35);g.score+=15;S('coin');fx.pop(80,GY-60,'+15 WATER','#7ae8ff');}}ob=ob.filter(o=>o.x>x-40&&!o.got);if(t%15===0)g.score++;trail.unshift(py);if(trail.length>60)trail.pop();};
 const camel=(cx,cy,ph,rider)=>{const c=A.c;c.save();c.translate(cx,cy);X.shadow(0,2,16,3,.3);for(let l=0;l<4;l++){c.save();c.translate(-9+l*6,-14);c.rotate(Math.sin(ph+l*1.6)*.4);ink(c=>c.rect(-1.4,0,2.8,14),'#c8945a',.6);c.restore();}
  ink(c=>{c.moveTo(-14,-14);c.quadraticCurveTo(-12,-24,-6,-22);c.quadraticCurveTo(-2,-32,4,-22);c.quadraticCurveTo(10,-22,12,-16);c.lineTo(12,-12);c.lineTo(-14,-12);c.closePath();},X.lg(0,-32,0,-12,['#e8b878','#c8945a','#a07040']));
  ink(c=>{c.moveTo(10,-18);c.quadraticCurveTo(16,-22,16,-30);c.lineTo(22,-31);c.lineTo(22,-27);c.lineTo(19,-27);c.quadraticCurveTo(19,-18,12,-13);c.closePath();},'#d8a468');X.disc(19,-29.5,.8,'#1a1010');X.rr(-6,-28,12,5,2,'#c83a3a');X.rr(-6,-25,12,1.2,0,'#ffd04a');
  if(rider)hero(0,-24,{s:.8,top:'#f4ead4',bot:'#4a3a2a',hat:'hood',hatC:'#2a6ac8',style:0,seed:3,bob:0});c.restore();};
 g.draw=()=>{const c=A.c,s=storm?Math.min(1,Math.min(storm,300-storm)/60):0;X.cache('vy_desert',()=>{X.sky(['#e88a3a','#f8b860','#ffe0a0'],150);X.glow(70,60,70,'#fff0c0',.6);X.disc(70,60,18,'#fff4d0');X.hills(150,18,'#e8a860',0,.012,3);X.hills(170,14,'#d89850',60,.02,6);X.vg(0,180,W,60,['#e8b070','#c8904e','#a8743a']);});
  const o1=x*.3;for(let k=Math.floor(o1/160)-1;k<Math.floor(o1/160)+3;k++){if(hash(k,3)<.5)continue;const px=k*160-o1;X.rr(px+20,140,24,20,1,'#d8b888');X.poly([[px+18,140],[px+32,128],[px+46,140]],'#c8a070');X.rr(px+4,136,8,24,1,'#c8a878');X.disc(px+8,134,5,'#e8c890');}
  for(const o of ob){const ox=o.x-x;if(o.k==='c'){X.rr(ox-2.5,GY-o.h,5,o.h,2.5,X.lg(ox-2.5,0,ox+2.5,0,['#5aa84a','#3a7a2a']));X.rr(ox-8,GY-o.h*.6,5,3,1.5,'#4a9a3a');X.rr(ox-8,GY-o.h*.6-6,3,8,1.5,'#4a9a3a');X.rr(ox+3,GY-o.h*.75,5,3,1.5,'#4a9a3a');X.rr(ox+5,GY-o.h*.75-5,3,7,1.5,'#4a9a3a');X.disc(ox,GY-o.h,1.4,'#ff6ab8');}
   else{if(lo())X.glow(ox,o.y,10,'#7ae8ff',.4);ink(c=>{c.moveTo(ox,o.y-6);c.quadraticCurveTo(ox+5,o.y,ox,o.y+4);c.quadraticCurveTo(ox-5,o.y,ox,o.y-6);},X.lg(ox-4,0,ox+4,0,['#c8f4ff','#3aa8e8']),.6);}}
  for(let i=2;i>=0;i--){const q=trail[i*14]||0;if(i&&!(inv&&A.t%6<3)||!i&&!(inv&&A.t%6<3))camel(80-i*42,GY+(i?q:py),A.t*.3+i,i===0);}
  if(s>0){c.globalAlpha=s*.75;c.fillStyle='#d8a868';c.fillRect(0,0,W,H);c.globalAlpha=s*.6;for(let i=0;i<60;i++){c.fillStyle='#f4d8a8';c.fillRect((i*53-A.t*8)%W+W%W,(i*37)%H,14,1);}c.globalAlpha=1;}
  fx.draw();X.bar('WATER',String(g.score),'','#7ae8ff','#ffe27a');X.meter(70,7,60,5,water,water<.25?'#ff5a4a':'#7ae8ff');hearts(lives,150);};
 return g;}});

/* ================= RICKSHAW RUN ================= */
A.add({id:'rickshaw',name:'RICKSHAW RUN',cat:'ACTION',tags:'city taxi pedal passengers',how:'UP/DOWN CHANGE LANE, RIGHT PEDALS FASTER. PICK UP WAVING PEOPLE, DROP THEM AT THE STAR.',make(){
 const g={over:null,score:0},fx=X.fx(),LN=[150,176,202];let lane=1,ly=176,x=0,v=1.6,ob=[],t=0,lives=3,inv=0,rider=null,mv=0;
 g.update=()=>{t++;if(inv)inv--;if(mv)mv--;const k=A.in(0);v=cl(v+(k.r?.04:-.02)+(k.l?-.05:0),1,3.6);x+=v;if(!mv&&ay(k)){lane=cl(lane+ay(k),0,2);mv=10;}ly+=(LN[lane]-ly)*.25;
  if(t%Math.max(40,90-t/50|0)===0){const r=Math.random();ob.push(r<.55?{k:'car',x:x+W+30,l:ri(3),v:.4+rnd(.8),c:['#c84a3a','#3a6ac8','#f0b040','#4aa86a'][ri(4)]}:r<.85&&!rider?{k:'fare',x:x+W+30,l:ri(3),look:ri(6)}:rider?{k:'drop',x:x+W+30,l:ri(3)}:{k:'cone',x:x+W+30,l:ri(3)});}
  for(const o of ob){if(o.k==='car')o.x+=o.v;const hit=Math.abs(o.x-x-80)<16&&o.l===lane;if(!hit||o.done)continue;if(o.k==='fare'&&!rider){rider=o.look;o.done=1;S('blip');fx.pop(80,ly-40,'HOP IN!','#7dff9a');}else if(o.k==='drop'&&rider!==null){o.done=1;rider=null;const v2=20+Math.round(v*5);g.score+=v2;S('coin');fx.pop(80,ly-40,'+'+v2,'#ffe27a');fx.spark(80,ly-20,'#ffe27a',12,2);}else if((o.k==='car'||o.k==='cone')&&!inv){o.done=1;lives--;inv=80;v=1;S('hit');A.shake=6;fx.pop(80,ly-40,'CRASH!','#ff6a5a');if(rider!==null){rider=null;fx.pop(80,ly-52,'FARE LOST','#ff8a7a');}if(lives<=0)g.over='RICKSHAW WRECKED';}}ob=ob.filter(o=>o.x>x-40&&!(o.done&&o.k!=='car'));};
 g.draw=()=>{const c=A.c;X.cache('vy_city',()=>{X.sky(['#ffb07a','#ffd8a8','#fff0d8'],140);X.glow(240,50,70,'#fff4d0',.6);});
  const o1=x*.3;for(let k=Math.floor(o1/40)-1;k<Math.floor(o1/40)+10;k++){const bx=k*40-o1,h=50+hash(k,1)*50,col=['#e8a878','#d88a8a','#f0c890','#c8a0b0'][Math.floor(hash(k,2)*4)];X.rr(bx,140-h,38,h,1,X.lg(bx,0,bx+38,0,[X.lt(col,1.1),X.lt(col,.8)]));for(let r=0;r<Math.floor(h/16);r++)for(let q=0;q<3;q++)X.rr(bx+5+q*11,148-h+r*16,6,8,1,hash(k*3+q,r)<.3?'#ffe0a0':'#5a4a5a');if(hash(k,5)<.4){X.rr(bx+2,124,34,4,1,['#c83a3a','#3a8a5a','#e8b030'][k&1+1]);for(let s2=0;s2<5;s2++)X.poly([[bx+2+s2*7,128],[bx+9+s2*7,128],[bx+5.5+s2*7,132]],s2%2?'#fff':'#c83a3a');}}
  c.strokeStyle='rgba(40,30,30,.7)';c.lineWidth=.6;for(let k=0;k<3;k++){c.beginPath();const ox=-((x*.6+k*120)%360);c.moveTo(ox,90+k*8);c.quadraticCurveTo(ox+180,110+k*8,ox+360,90+k*8);c.stroke();for(let f=0;f<9;f++){const fx2=ox+f*40;X.poly([[fx2,92+k*8+Math.sin(f/8*Math.PI)*16],[fx2+6,92+k*8+Math.sin(f/8*Math.PI)*16],[fx2+3,100+k*8+Math.sin(f/8*Math.PI)*16]],['#ff4a6a','#ffd04a','#4ad8ff','#7dff6a'][f%4]);}}
  X.vg(0,138,W,102,['#6a6a72','#5a5a62','#4a4a52']);c.fillStyle='#c8b8a0';c.fillRect(0,136,W,6);c.fillStyle='#fff';for(const y of[163,189])for(let i=0;i<10;i++)c.fillRect(((i*40-x)%W+W)%W,y,18,1.6);
  const items=[];for(const o of ob)items.push({y:LN[o.l],f:()=>{const ox=o.x-x,oy=LN[o.l];if(o.k==='car'){X.shadow(ox,oy+2,20,3,.35);X.rr(ox-20,oy-12,40,12,4,X.lg(0,oy-12,0,oy,[X.lt(o.c,1.3),o.c,X.lt(o.c,.6)]));X.rr(ox-12,oy-20,22,9,3,X.lg(0,oy-20,0,oy-11,[X.lt(o.c,1.2),X.lt(o.c,.8)]));X.rr(ox-9,oy-18,8,6,1,'#9ad8f0');X.rr(ox+1,oy-18,7,6,1,'#9ad8f0');for(const w of[-12,12]){X.disc(ox+w,oy,4,'#1a1a1e');X.disc(ox+w,oy,1.5,'#9a9aa0');}}
   else if(o.k==='cone'){X.poly([[ox-5,oy],[ox,oy-12],[ox+5,oy]],'#ff7a2a');X.rr(ox-3,oy-7,6,2,0,'#fff');}else if(o.k==='fare'){const L=LOOKS[o.look];hero(ox,oy,{top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:o.look,bob:0,d:-1,arm:-2.8+Math.sin(A.t*.3)*.3,mood:'happy'});}else{X.rr(ox-1,oy-34,2,34,0,'#ddd');T('*',ox,oy-44,'#ffe27a',2,'c');if(lo())X.glow(ox,oy-40,12,'#ffe27a',.5);}}});
  items.push({y:ly+.5,f:()=>{if(inv&&A.t%6<3)return;c.save();c.translate(80,ly);X.shadow(-8,2,22,3,.35);for(const w of[-20,6]){X.disc(w,-6,6,'#2a2a2e');c.strokeStyle='#9a9aa0';c.lineWidth=.6;for(let s2=0;s2<4;s2++){const a=s2*.8+x*.1;c.beginPath();c.moveTo(w,-6);c.lineTo(w+Math.cos(a)*5,-6+Math.sin(a)*5);c.stroke();}}
   X.rr(-30,-26,20,16,3,X.lg(0,-26,0,-10,['#e84a3a','#a82a24']));ink(c=>{c.moveTo(-32,-26);c.quadraticCurveTo(-26,-40,-12,-36);c.lineTo(-12,-26);c.closePath();},'#ffd04a');X.stroke([[-10,-14],[8,-10]],'#3a3a3a',1.4);
   if(rider!==null){const L=LOOKS[rider];hero(-21,-14,{s:.75,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:rider,bob:0,mood:'happy'});}
   hero(4,-6,{s:.85,top:'#f4f4f4',bot:'#2a3a5a',hat:'cap',hatC:'#c83a3a',style:0,seed:70,st:x*.15,arm:-.9});c.restore();}});
  items.sort((a,b)=>a.y-b.y).forEach(o=>o.f());
  fx.draw();X.bar(rider!==null?'TO THE STAR':'FIND A FARE',String(g.score),'','#7dff9a','#ffe27a');hearts(lives,140);};
 return g;}});

/* ================= PANDA CLIMB ================= */
A.add({id:'pandaclimb',name:'PANDA CLIMB',cat:'CLASSICS',tags:'bamboo panda climb leaves',how:'A OR UP CLIMBS. LEFT/RIGHT SWAP STALKS. DODGE FALLING COCONUTS, MUNCH LEAVES.',make(){
 const g={over:null,score:0},fx=X.fx(),SX=[90,160,230];let s=1,px=160,alt=0,ob=[],lf=[],t=0,lives=3,inv=0,climb=0,hun=1;
 g.update=()=>{t++;if(inv)inv--;const h=A.hit(0),k=A.in(0);if(h.l)s=Math.max(0,s-1);if(h.r)s=Math.min(2,s+1);if(h.l||h.r)S('blip');px+=(SX[s]-px)*.3;let up=0;if(h.a||h.u){up=10;climb+=1;S('jump');}else if(k.a||k.u)up=.6;alt+=up;hun-=.0009;if(hun<=0){hun=.6;lives--;S('lose');fx.pop(px,100,'HUNGRY!','#ff8a5a');if(lives<=0){g.over='TOO HUNGRY';return;}}
  if(t%Math.max(40,90-t/60|0)===0)ob.push({s:ri(3),y:-10,v:1.6+rnd(1)+t/4000});if(t%70===0)lf.push({s:ri(3),y:-10});
  for(const o of ob){o.y+=o.v+up*.4;if(!inv&&!o.done&&o.s===s&&Math.abs(o.y-150)<12){o.done=1;lives--;inv=80;S('hit');A.shake=5;fx.pop(px,120,'BONK!','#ff6a5a');if(lives<=0)g.over='KNOCKED DOWN';}}ob=ob.filter(o=>o.y<H+10&&!o.done);
  for(const l of lf){l.y+=up*.8+.2;if(!l.done&&l.s===s&&Math.abs(l.y-140)<14){l.done=1;hun=Math.min(1,hun+.3);g.score+=10;S('coin');fx.pop(px,120,'+10','#7dff6a');}}lf=lf.filter(l=>l.y<H+10&&!l.done);g.score=Math.max(g.score,0);if(up)g.score+=up>5?1:0;};
 g.draw=()=>{const c=A.c,k2=cl(alt/8000,0,1);X.sky([A.mix?A.mix('#bfe8c8','#6ab0e8',k2):'#bfe8c8','#e8f4d8']);X.glow(260,40,60,'#fffbe0',.5);
  for(let i=0;i<5;i++){const y=((i*80+alt*.15)%400)-60;c.globalAlpha=.6;cloud(40+i*67%240,y,1.2);c.globalAlpha=1;}
  for(let i=0;i<4;i++){const y=((i*90+alt*.3)%360)-40;X.poly([[i%2?W:0,y],[i%2?W-70:70,y+40],[i%2?W:0,y+80]],'#4a8a4a');}
  for(const sx of SX){X.rr(sx-5,0,10,H,3,X.lg(sx-5,0,sx+5,0,['#9ad85a','#5aa83a','#3a7a2a']));const o=alt%26;for(let y=-26+o;y<H;y+=26){X.rr(sx-6,y,12,2.4,1,'#3a7a2a');if(hash(sx,Math.floor((y-alt)/26))<.3)X.ell(sx+8,y-3,7,2.4,'#6ac04a',-.5);}}
  for(const l of lf){const lx=SX[l.s];X.ell(lx-9,l.y,8,3,'#7ae04a',.4);X.ell(lx+9,l.y,8,3,'#6ad03a',-.4);if(lo())X.glow(lx,l.y,10,'#bfff8a',.3);}
  for(const o of ob){const ox=SX[o.s];X.disc(ox,o.y,6,X.rg(ox-2,o.y-2,1,ox,o.y,6,['#a07040','#6a4424','#3a2410']));X.disc(ox-1.5,o.y-1,1,'#2a1a10');X.disc(ox+1.5,o.y-1,1,'#2a1a10');}
  if(!(inv&&A.t%6<3)){const y=150,sw=Math.sin(climb*1.2)*.6;c.save();c.translate(px,y);for(const sd of[-1,1]){c.save();c.translate(sd*6,-6);c.rotate(sd*(-.8+sw*sd));ink(c=>c.ellipse(0,-5,3,6,0,0,TAU),'#1a1a1e',.7);c.restore();}
   ink(c=>c.ellipse(0,4,10,12,0,0,TAU),X.rg(-3,0,1,0,4,12,['#ffffff','#f0f0f0','#c8c8d0']));for(const sd of[-1,1]){c.save();c.translate(sd*6,12);c.rotate(sd*(.4-sw*sd));ink(c=>c.ellipse(0,3,3.4,5,0,0,TAU),'#1a1a1e',.7);c.restore();}
   ink(c=>c.arc(0,-12,8,0,TAU),'#ffffff');for(const sd of[-1,1]){ink(c=>c.arc(sd*6,-18,3,0,TAU),'#1a1a1e',.6);X.ell(sd*3.2,-12,2.2,2.8,'#1a1a1e',sd*.4);X.disc(sd*3,-12.4,.9,'#fff');}X.ell(0,-8.6,1.6,1,'#1a1a1e');c.restore();}
  fx.draw();X.bar('HEIGHT '+(alt/10|0),String(g.score),'BAMBOO','#7dff6a','#ffe27a');X.meter(120,12,80,3,hun,hun<.25?'#ff5a4a':'#7dff6a');hearts(lives,210);};
 return g;}});

/* ================= DOG SLED ================= */
A.add({id:'dogsled',name:'DOG SLED DASH',cat:'VERSUS',vs:1,tags:'sled dogs race snow',how:'TAP A ON THE BEAT TO DRIVE THE DOGS. UP/DOWN DODGE ROCKS. FIRST TO THE FLAG WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),GOAL=3000,LY=[110,190];let P=[{x:0,v:0,y:0,mv:0,ok:0,inv:0},{x:0,v:0,y:0,mv:0,ok:0,inv:0}],t=0,rocks=[[],[]];
 for(let i=0;i<2;i++)for(let d=300;d<GOAL;d+=160+ri(160))rocks[i].push({d,y:ri(2)?-10:10});
 g.timeUp=()=>tu(P[0].x,P[1].x);
 g.update=()=>{t++;const beat=t%30<8;if(A.cpu){const q=P[1],o={};const nx=rocks[1].find(r=>r.d>q.x&&r.d-q.x<70);if(nx&&Math.sign(nx.y)===Math.sign(q.y||-1)&&Math.random()<.2+A.ai*.4)o[nx.y<0?'d':'u']=1;if(beat&&Math.random()<.18+A.ai*.25)o.a=1;else if(!beat&&Math.random()<.05*(1-A.ai))o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],h=A.hit(i),k=A.in(i);if(p.inv)p.inv--;if(h.a){if(beat){p.v=Math.min(4.2,p.v+.6);p.ok=10;if(i===0)S('blip');}else{p.v*=.7;}}p.v*=.992;p.x+=p.v;p.y=cl(p.y+ay(k)*1.2,-12,12);
   for(const r of rocks[i])if(!p.inv&&Math.abs(r.d-p.x)<10&&Math.abs(r.y-p.y)<8){p.inv=50;p.v=.4;S('hit');A.shake=4;fx.pop(80,LY[i]-30,'THUMP','#ff8a7a');}if(p.ok)p.ok--;
   if(p.x>=GOAL){g.over=A.win(i);S('win');return;}}g.score=P[0].x/10|0;};
 g.draw=()=>{const c=A.c;X.cache('vy_snow',()=>{X.sky(['#2a3a6a','#5a7aaa','#a8c0dc','#dce8f4'],80);X.hills(70,20,'#8aa0c0',0,.02,3);X.hills(80,14,'#c8d8e8',30,.03,5);for(let i=0;i<14;i++)pine(i*24,82,22+(i*7)%10,'#2a4a4a');X.vg(0,80,W,160,['#eef4fa','#dce8f4','#c8d8e8']);c.save();c.globalCompositeOperation='lighter';for(let i=0;i<3;i++)X.poly([[0,10+i*14],[W,24+i*10],[W,30+i*10],[0,14+i*14]],['rgba(80,255,180,.10)','rgba(120,180,255,.08)','rgba(200,120,255,.06)'][i]);c.restore();});
  for(let i=0;i<2;i++){const p=P[i],ly=LY[i],cam=p.x-120,lead=p.x-P[1-i].x;c.fillStyle='rgba(120,150,190,.25)';c.fillRect(0,ly+12,W,1);c.fillRect(0,ly-14,W,1);
   for(const r of rocks[i]){const rx=r.d-cam;if(rx<-20||rx>W+20)continue;X.disc(rx,ly+r.y,5,X.rg(rx-2,ly+r.y-2,1,rx,ly+r.y,5,['#9aa0aa','#6a7080','#4a5060']));X.ell(rx,ly+r.y-3,4,1.4,'#ffffff');}
   const fx2=GOAL-cam;if(fx2<W+20){X.rr(fx2,ly-30,2,40,0,'#3a3a3a');X.poly([[fx2+2,ly-30],[fx2+16,ly-25],[fx2+2,ly-20]],'#ff4a4a');}
   const sx=p.x-cam,sy=ly+p.y,run=p.x*.25;if(!(p.inv&&A.t%6<3)){for(let d=0;d<4;d++){const dx=sx+14+(d>>1)*12,dy=sy-3+(d&1)*6,b=Math.abs(Math.sin(run+d))*2;c.save();c.translate(dx,dy-b);ink(c=>c.ellipse(0,0,5,2.6,0,0,TAU),d%2?'#8a8a90':'#5a5a62',.5);ink(c=>c.ellipse(5,-2,2.4,2,0,0,TAU),d%2?'#9a9aa0':'#6a6a72',.5);X.poly([[4,-4],[5,-6],[6,-4]],'#3a3a40');X.disc(6,-2.4,.6,'#1a1a1a');c.restore();}
    X.stroke([[sx+2,sy],[sx+14,sy]],'#7a5430',.8);X.rr(sx-12,sy-4,14,6,2,i?'#c83a3a':'#2a6ac8');X.stroke([[sx-14,sy+3],[sx+4,sy+3],[sx+6,sy]],'#5a3a24',1);hero(sx-6,sy-2,{s:.75,top:i?'#e84a4a':'#3a8ad8',bot:'#2a2a3a',hat:'beanie',hatC:i?'#ffd04a':'#ff6a3a',style:i?2:0,seed:80+i,bob:0,arm:p.ok?-2.4:-1});}
   if(lo())for(let k=0;k<3;k++){c.globalAlpha=.4-k*.12;X.disc(sx-16-k*6,sy+3,2+k,'#ffffff');}c.globalAlpha=1;T(lead>=0?'+'+(lead/10|0)+'M':(lead/10|0)+'M',300,ly-26,lead>=0?'#7dff9a':'#ff8a7a',1,'r');}
  c.fillStyle=t%30<8?'#ffe27a':'rgba(255,255,255,.3)';c.beginPath();c.arc(160,152,5+(t%30<8?2:0),0,TAU);c.fill();T('BEAT',160,160,'#fff',1,'c');
  for(let i=0;i<2;i++)X.meter(40,30+i*8,240,4,P[i].x/GOAL,i?'#ff4f9a':'#2fd6c3');fx.draw();X.bar();A.hud2(P[0].x/30|0,P[1].x/30|0);};
 return g;}});

/* ================= VOLCANO HOP ================= */
A.add({id:'volcanohop',name:'VOLCANO HOP',cat:'CLASSICS',tags:'lava stones island hop',how:'ARROWS HOP STONE TO STONE. STONES SINK INTO THE LAVA. GRAB TIKI GEMS. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),GW=8,GH=5,CS=34,OX=24,OY=58;let st=[],p={x:0,y:2,hop:0,fx:0,fy:2},t=0,lives=3,inv=0,gem=null,mv=0;
 for(let i=0;i<GW*GH;i++)st.push({h:Math.random()<.7?1:0,sink:0});st[2*GW].h=1;
 const placeGem=()=>{for(let n=0;n<40;n++){const i=ri(GW*GH);if(st[i].h>.5){gem=i;return;}}};placeGem();
 g.update=()=>{t++;if(inv)inv--;if(mv)mv--;const k=A.in(0);if(!mv&&(ax(k)||ay(k))){const nx=cl(p.x+ax(k),0,GW-1),ny=cl(p.y+(ax(k)?0:ay(k)),0,GH-1);if(nx!==p.x||ny!==p.y){p.fx=p.x;p.fy=p.y;p.x=nx;p.y=ny;p.hop=12;mv=13;S('jump');}}if(p.hop)p.hop--;
  const rate=.002+t/400000;for(let i=0;i<st.length;i++){const s=st[i];if(s.h>0&&i===p.y*GW+p.x&&!p.hop)s.h-=rate*3;else if(s.h<=0&&Math.random()<.003)s.h=1;else if(s.h>0&&Math.random()<.0006)s.h-=.01;if(s.h<1&&s.h>0&&i!==p.y*GW+p.x)s.h-=rate*.3;}
  const cur=st[p.y*GW+p.x];if(!p.hop&&cur.h<=.15&&!inv){lives--;inv=90;S('lose');A.shake=6;fx.spark(OX+p.x*CS+17,OY+p.y*CS+17,'#ff6a2a',16,2.4);fx.pop(160,40,'SCORCHED!','#ff6a5a');cur.h=1;if(lives<=0)g.over='TOASTED';}
  if(!p.hop&&gem===p.y*GW+p.x){g.score+=25;S('coin');fx.pop(OX+p.x*CS+17,OY+p.y*CS,'+25','#7ae8ff');placeGem();}if(t%30===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('vy_volc',()=>{X.sky(['#2a0a0a','#5a1a14','#a83a1a','#e86a2a'],60);X.poly([[90,60],[140,10],[180,10],[230,60]],X.lg(0,10,0,60,['#4a2a24','#2a1410']));X.glow(160,10,40,'#ff8a2a',.6);X.vg(0,56,W,H-56,['#ff6a1a','#d83a10','#8a1a08']);});
  const lt=A.t*.05;for(let i=0;i<30;i++){const x=(i*41+Math.sin(lt+i)*10+W)%W,y=60+(i*29)%180;c.globalAlpha=.3+.2*Math.sin(lt*2+i);X.ell(x,y,8,2,'#ffd04a');}c.globalAlpha=1;
  if(lo())for(let i=0;i<8;i++){const y=60-((A.t*.4+i*30)%80);c.globalAlpha=.3;X.disc(160+Math.sin(i+A.t*.02)*12,y,4+i%3*2,'#5a4a4a');}c.globalAlpha=1;
  for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const s=st[y*GW+x],px=OX+x*CS+17,py=OY+y*CS+17;if(s.h<=0)continue;const r=11*Math.min(1,s.h+.2),sk=(1-s.h)*6;X.ell(px,py+5,r+3,(r+3)*.45,'rgba(80,20,0,.5)');X.ell(px,py+sk,r,r*.62,X.rg(px-3,py-3+sk,1,px,py+sk,r,['#8a7a72','#5a4a44','#3a2a26']));if(s.h<.5&&lo())X.glow(px,py+sk,r+4,'#ff4a1a',.4*(1-s.h));if(gem===y*GW+x){if(lo())X.glow(px,py-8,10,'#7ae8ff',.5);X.gem(px,py-8+Math.sin(A.t*.1)*1.5,5,'#3ad8ff');}}
  const fx0=OX+p.fx*CS+17,fy0=OY+p.fy*CS+17,tx=OX+p.x*CS+17,ty=OY+p.y*CS+17,k=p.hop/12,hx=tx+(fx0-tx)*k,hy=ty+(fy0-ty)*k-Math.sin(k*Math.PI)*12;if(!(inv&&A.t%6<3))hero(hx,hy+4,{s:.95,d:p.x>=p.fx?1:-1,top:'#4ad8a8',bot:'#c86a3a',hat:'straw',hatC:'#ff4a8a',style:4,hair:'#2a1a10',skin:'#c68a5e',seed:90,bob:0,st:p.hop?2:0,mood:p.hop?'o':'happy'});
  fx.draw();X.bar('LIVES '+lives,String(g.score),'','#ffd04a','#ffe27a');};
 return g;}});

/* ================= SAND GLYPHS ================= */
A.add({id:'sandglyph',name:'SAND GLYPHS',cat:'PUZZLE',tags:'tomb tiles rotate glyph path',how:'MOVE THE CURSOR, A TURNS A STONE. CONNECT THE SUN GLYPH TO THE DOOR TO OPEN THE TOMB.',make(){
 const g={over:null,score:0},fx=X.fx(),N=6,CS=30,OX=70,OY=36;let b,cur={x:0,y:0},mv=0,lvl=1,wait=0,lit=new Uint8Array(N*N),moves=0;
 // each stone is a pipe: bitmask of open sides (1 up,2 right,4 down,8 left)
 const rot=m=>((m<<1)|(m>>3))&15;
 const make=()=>{b=new Uint8Array(N*N);let x=0,y=0;const path=[[0,0]];const seen=new Set(['0,0']);while(!(x===N-1&&y===N-1)){const opts=[];if(x<N-1)opts.push([1,0]);if(y<N-1)opts.push([0,1]);if(x>0&&Math.random()<.2)opts.push([-1,0]);const ok=opts.filter(o=>!seen.has((x+o[0])+','+(y+o[1])));const o=(ok.length?ok:opts)[ri((ok.length?ok:opts).length)];x+=o[0];y+=o[1];seen.add(x+','+y);path.push([x,y]);if(path.length>40)break;}
  const dir=(a,b2)=>b2[0]>a[0]?2:b2[0]<a[0]?8:b2[1]>a[1]?4:1,opp=d=>d===1?4:d===4?1:d===2?8:2;
  for(let i=0;i<path.length;i++){const[px,py]=path[i];let m=b[py*N+px];if(i===0)m|=8;if(i>0)m|=opp(dir(path[i-1],path[i]));if(i<path.length-1)m|=dir(path[i],path[i+1]);else m|=2;b[py*N+px]=m;}
  for(let i=0;i<N*N;i++){if(!b[i])b[i]=[5,3,7,1][ri(4)];const r=ri(4);for(let k=0;k<r;k++)b[i]=rot(b[i]);}moves=0;};
 const flow=()=>{lit.fill(0);const q=[[0,0]];if(!(b[0]&8))return false;lit[0]=1;while(q.length){const[x,y]=q.shift(),m=b[y*N+x];for(const[d,dx,dy,o]of[[1,0,-1,4],[2,1,0,8],[4,0,1,1],[8,-1,0,2]]){if(!(m&d))continue;const nx=x+dx,ny=y+dy;if(nx===N&&ny===N-1&&x===N-1)return true;if(nx<0||ny<0||nx>=N||ny>=N)continue;const j=ny*N+nx;if(!lit[j]&&(b[j]&o)){lit[j]=1;q.push([nx,ny]);}}}return lit[N*N-1]&&(b[N*N-1]&2);};
 make();
 g.update=()=>{if(wait){if(--wait===0){lvl++;make();}return;}if(mv)mv--;const k=A.in(0);if(!mv&&(ax(k)||ay(k))){cur.x=cl(cur.x+ax(k),0,N-1);cur.y=cl(cur.y+ay(k),0,N-1);mv=7;}
  if(A.hit(0).a){const i=cur.y*N+cur.x;b[i]=rot(b[i]);moves++;S('blip');fx.debris(OX+cur.x*CS+15,OY+cur.y*CS+15,'#e8c890',3,1);}
  if(flow()){g.score+=Math.max(20,120-moves*2);wait=100;S('win');A.confetti();fx.pop(160,20,'TOMB OPENED!','#ffe27a');}};
 g.draw=()=>{const c=A.c;X.cache('vy_tomb',()=>{X.vg(0,0,W,H,['#3a2a1a','#2a1e12','#1a120a']);for(let y=0;y<H;y+=16)for(let x=(y/16%2)*20;x<W;x+=40){X.rr(x,y,39,15,1,'#4a3824');c.fillStyle='rgba(255,220,160,.05)';c.fillRect(x,y,39,1);}
   for(const tx of[30,290]){X.rr(tx-4,60,8,16,2,'#5a3a20');X.poly([[tx-6,60],[tx+6,60],[tx+4,56],[tx-4,56]],'#7a5430');}
   X.rr(OX-6,OY-6,N*CS+12,N*CS+12,4,'#6a5034');X.rrs(OX-6,OY-6,N*CS+12,N*CS+12,4,'#c8a060',1.4);X.rr(OX+N*CS+6,OY+(N-1)*CS,24,CS,2,'#2a1a10');X.rr(OX-30,OY,24,CS,2,'#2a1a10');});
  for(const tx of[30,290]){if(lo())X.glow(tx,52,22,'#ffb040',.5);X.ell(tx,50-Math.abs(Math.sin(A.t*.3+tx))*2,3,6,'#ffd060');}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x,m=b[i],px=OX+x*CS,py=OY+y*CS,on=lit[i];X.rr(px+1,py+1,CS-2,CS-2,3,X.lg(0,py,0,py+CS,['#d8b880','#b8955a','#8a6a3a']));c.fillStyle='rgba(0,0,0,.18)';c.fillRect(px+3,py+CS-4,CS-6,1.5);
   const cx=px+15,cy=py+15,col=on?'#ffd04a':'#5a3a1a';if(on&&lo())X.glow(cx,cy,12,'#ffb040',.25);for(const[d,dx,dy]of[[1,0,-1],[2,1,0],[4,0,1],[8,-1,0]])if(m&d)X.stroke([[cx,cy],[cx+dx*14,cy+dy*14]],col,4,'round');X.disc(cx,cy,3,col);}
  if(lo())X.glow(OX-18,OY+15,14,'#ffd04a',.6);X.disc(OX-18,OY+15,6,'#ffd04a');for(let k=0;k<8;k++){const a=k/8*TAU+A.t*.02;X.stroke([[OX-18+Math.cos(a)*8,OY+15+Math.sin(a)*8],[OX-18+Math.cos(a)*11,OY+15+Math.sin(a)*11]],'#ffd04a',1.4);}
  const dx=OX+N*CS+18,dy=OY+(N-1)*CS+15;X.rr(dx-8,dy-12,16,24,3,wait?'#ffd04a':'#4a3420');X.rrs(dx-8,dy-12,16,24,3,'#c8a060',1);
  X.rrs(OX+cur.x*CS,OY+cur.y*CS,CS,CS,4,A.t%30<20?'#ffffff':'#ffe27a',1.6);
  K.hero(36,226,{s:1,top:'#e8d8b0',bot:'#6a5a3a',hat:'straw',hatC:'#8a5a2a',style:2,hair:'#c86a2a',seed:100,bob:0,arm:-1.6,mood:'o',hold:c=>{X.rr(-1,-6,2,7,.5,'#7a5430');X.ell(0,-8,2.4,3.4,'#ffb040');}});
  fx.draw();X.bar('TOMB '+lvl,String(g.score),'TURNS '+moves,'#ffd04a','#ffe27a');};
 return g;}});

/* ================= KOI POND ================= */
A.add({id:'koipond',name:'KOI POND',cat:'SIM',tags:'koi fish pond garden feed',how:'MOVE THE HAND. A SCATTERS FOOD. FEED EVERY KOI BEFORE IT SULKS. SHOO THE HERON WITH B.',make(){
 const g={over:null,score:0},fx=X.fx();let hand={x:160,y:130},koi=[],food=[],t=0,sulks=0,heron=null,cd=0;
 for(let i=0;i<5;i++)koi.push({x:80+rnd(160),y:90+rnd(100),a:rnd(6),hun:.6+rnd(.4),c:[['#ff6a2a','#ffffff'],['#ffffff','#e83a2a'],['#ffd04a','#ff8a2a'],['#2a2a2a','#ff6a2a'],['#ffffff','#2a2a2a']][i]});
 const inPond=(x,y)=>((x-160)/120)**2+((y-142)/70)**2<1;
 g.update=()=>{t++;if(cd)cd--;const k=A.in(0);hand.x=cl(hand.x+ax(k)*2.4,20,W-20);hand.y=cl(hand.y+ay(k)*2.4,60,H-20);const h=A.hit(0);
  if(h.a&&!cd){cd=12;for(let i=0;i<4;i++)food.push({x:hand.x+rnd(16)-8,y:hand.y+rnd(10)-5,l:400});S('blip');}
  if(h.b&&heron&&hyp(heron.x-hand.x,heron.y-hand.y)<40){heron.flee=1;S('hit');g.score+=15;fx.pop(heron.x,heron.y-30,'SHOO! +15','#7dff9a');}
  for(const f of food)f.l--;food=food.filter(f=>f.l>0&&inPond(f.x,f.y));
  for(const q of koi){q.hun-=.0009+t/2e6;let tgt=null,bd=1e9;for(const f of food){const d=hyp(f.x-q.x,f.y-q.y);if(d<bd){bd=d;tgt=f;}}const want=tgt?Math.atan2(tgt.y-q.y,tgt.x-q.x):q.a+Math.sin(t*.01+q.x)*.05;let da=want-q.a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;q.a+=da*.06;const sp=tgt?1.1:.5;const nx=q.x+Math.cos(q.a)*sp,ny=q.y+Math.sin(q.a)*sp;if(inPond(nx,ny)){q.x=nx;q.y=ny;}else q.a+=.3;
   if(tgt&&bd<5){tgt.l=0;q.hun=Math.min(1,q.hun+.25);g.score+=5;fx.spark(q.x,q.y,'#ffe27a',4,1.2);}if(q.hun<=0){q.hun=.5;sulks++;S('lose');fx.pop(q.x,q.y-12,'SULKING','#8ab8ff');if(sulks>=5)g.over='THE KOI ARE CROSS';}}
  if(!heron&&t>400&&t%600===0)heron={x:Math.random()<.5?40:280,y:100+rnd(80),t:0,flee:0};
  if(heron){heron.t++;if(heron.flee){heron.y-=3;heron.x+=2;if(heron.y<-40)heron=null;}else if(heron.t>240){const q=koi[ri(koi.length)];q.hun=Math.max(0,q.hun-.4);fx.pop(heron.x,heron.y-30,'SNATCH!','#ff6a5a');S('hit');sulks++;heron.flee=1;if(sulks>=5)g.over='THE KOI ARE CROSS';}}};
 g.draw=()=>{const c=A.c;X.cache('vy_koi',()=>{X.vg(0,0,W,H,['#6aa85a','#5a984a','#4a883e']);for(let i=0;i<120;i++){c.fillStyle=i%2?'rgba(255,255,255,.06)':'rgba(0,0,0,.08)';c.fillRect(hash(i,1)*W,hash(i,2)*H,3,1);}
   for(let i=0;i<16;i++){const a=i/16*TAU;X.disc(160+Math.cos(a)*126,142+Math.sin(a)*76,9,X.rg(0,0,0,0,0,1,['#9a9a92']));X.disc(160+Math.cos(a)*126,142+Math.sin(a)*76,8,X.rg(160+Math.cos(a)*126-3,142+Math.sin(a)*76-3,1,160+Math.cos(a)*126,142+Math.sin(a)*76,8,['#c8c8c0','#8a8a84','#6a6a64']));}
   X.ell(160,142,120,70,X.rg(140,120,10,160,142,130,['#3a8aa8','#1a5a7a','#0e3a52']));for(let i=0;i<6;i++){const a=i*1.1;X.ell(160+Math.cos(a)*80,142+Math.sin(a)*40,9,6,'#3a8a3a');X.poly([[160+Math.cos(a)*80,142+Math.sin(a)*40],[160+Math.cos(a)*80+9,142+Math.sin(a)*40-2],[160+Math.cos(a)*80+9,142+Math.sin(a)*40+2]],'#1a5a7a');}
   X.disc(196,170,3,'#ff8ad8');X.disc(116,110,3,'#ffffff');
   X.rr(20,20,60,30,2,'#7a3a2a');X.poly([[10,22],[50,4],[90,22]],'#3a2a2a');X.poly([[4,24],[50,8],[96,24],[90,22],[50,4],[10,22]],'#c83a2a');tree(290,60,16,'#c86a8a');tree(270,226,12,'#5a9a4a');X.rr(240,30,4,30,0,'#c83a2a');X.rr(270,30,4,30,0,'#c83a2a');X.rr(234,28,46,4,1,'#c83a2a');X.rr(236,36,42,3,1,'#c83a2a');});
  for(let i=0;i<4;i++){const r=((A.t*.3+i*20)%80);c.strokeStyle='rgba(255,255,255,'+(.25-r/320)+')';c.lineWidth=.6;c.beginPath();c.ellipse(130+i*20,130+i*8,r*.5,r*.3,0,0,TAU);c.stroke();}
  for(const f of food)X.disc(f.x,f.y,1.2,'#c8904a');
  for(const q of koi){c.save();c.translate(q.x,q.y);c.rotate(q.a);const sw=Math.sin(A.t*.2+q.x)*.3;X.ell(1,2,10,4,'rgba(0,0,0,.2)');c.save();c.translate(-8,0);c.rotate(sw);X.poly([[0,0],[-7,-4],[-5,0],[-7,4]],X.rgba(q.c[0],.85));c.restore();ink(c=>c.ellipse(0,0,9,3.6,0,0,TAU),q.c[0],.5);X.ell(1,-.6,4,1.8,q.c[1]);X.ell(-4,.8,2.4,1.4,q.c[1]);X.disc(6,-1.6,.7,'#1a1a1a');X.disc(6,1.6,.7,'#1a1a1a');c.restore();if(q.hun<.3&&A.t%40<20)T('!',q.x,q.y-14,'#ff8a7a',1,'c');}
  c.fillStyle='rgba(255,255,255,.12)';c.beginPath();c.ellipse(130,110,40,8,-.2,0,TAU);c.fill();
  if(heron){const hx=heron.x,hy=heron.y;c.save();c.translate(hx,hy);X.stroke([[-2,0],[-3,20]],'#c8a040',1);X.stroke([[2,0],[3,20]],'#c8a040',1);ink(c=>c.ellipse(0,-6,8,6,-.3,0,TAU),'#dce4ec',.6);X.stroke([[5,-10],[8,-24]],'#dce4ec',3);ink(c=>c.ellipse(9,-26,3.6,3,0,0,TAU),'#dce4ec',.6);X.poly([[12,-27],[22,-25],[12,-24]],'#e8b040');X.disc(10,-27,.8,'#1a1a1a');c.restore();}
  c.save();c.translate(hand.x,hand.y);ink(c=>c.ellipse(0,0,6,5,0,0,TAU),'#f2c29a',.6);for(let f=0;f<4;f++)ink(c=>c.ellipse(-4.5+f*3,-5,1.4,2.6,0,0,TAU),'#f2c29a',.5);c.restore();
  fx.draw();X.bar('SULKS '+sulks+'/5',String(g.score),'','#8ab8ff','#ffe27a');};
 return g;}});

/* ================= CABLE CAR ================= */
A.add({id:'cablecar',name:'CABLE CAR',cat:'CLASSICS',tags:'mountain gondola lift timing passengers',how:'A STARTS AND STOPS THE CAR. STOP AT STATIONS TO SWAP RIDERS. STOPS MID-AIR SCARE THEM.',make(){
 const g={over:null,score:0},fx=X.fx(),ST=[30,160,290],SY=[200,120,50];let pos=0,dir=1,go=0,riders=[],wait=[[],[],[]],t=0,scare=0,v=0;
 const yAt=x=>{if(x<=160)return SY[0]+(SY[1]-SY[0])*(x-30)/130;return SY[1]+(SY[2]-SY[1])*(x-160)/130;};
 const xAt=p=>30+p*260;
 g.update=()=>{t++;if(t%Math.max(80,200-t/30|0)===0){const s=ri(3);if(wait[s].length<4){let to=ri(3);if(to===s)to=(s+1)%3;wait[s].push({to,look:ri(6),p:900,seed:ri(99)});}}
  if(A.hit(0).a){go=!go;S('blip');}v+=((go?1:0)-v)*.08;pos+=dir*v*.004;if(pos>=1){pos=1;dir=-1;}if(pos<=0){pos=0;dir=1;}
  const x=xAt(pos);const at=ST.findIndex(s=>Math.abs(s-x)<6);if(!go&&v<.05){if(at>=0){const off=riders.filter(r=>r.to===at);if(off.length){g.score+=off.length*20;S('coin');fx.pop(x,yAt(x)-40,'+'+off.length*20,'#ffe27a');}riders=riders.filter(r=>r.to!==at);while(wait[at].length&&riders.length<4){riders.push(wait[at].shift());S('blip');}}else if(riders.length&&t%40===0){scare++;S('lose');fx.pop(x,yAt(x)-40,'EEK!','#ff8a7a');if(scare>=8){g.over='RIDERS WALKED HOME';return;}}}
  for(const w of wait)for(const r of w){r.p--;if(r.p<=0){r.gone=1;scare++;fx.pop(ST[wait.indexOf(w)],SY[wait.indexOf(w)]-30,'GAVE UP','#ff8a7a');}}for(let i=0;i<3;i++)wait[i]=wait[i].filter(r=>!r.gone);if(scare>=8)g.over='RIDERS WALKED HOME';};
 g.draw=()=>{const c=A.c;X.cache('vy_alps',()=>{X.sky(['#4a8ad8','#8ab8f0','#d8e8f8']);X.poly([[0,150],[60,60],[110,120],[170,30],[240,110],[290,20],[W,90],[W,240],[0,240]],X.lg(0,20,0,240,['#f4f8fc','#c8d4e0','#6a8a6a']));for(const[a,b2]of[[60,60],[170,30],[290,20]])X.poly([[a-14,b2+20],[a,b2],[a+14,b2+20],[a+6,b2+16],[a,b2+22],[a-6,b2+16]],'#ffffff');
   X.hills(200,20,'#4a8a4a',0,.02,3);X.vg(0,210,W,30,['#3a7a3a','#2a5a2a']);for(let i=0;i<16;i++)pine(i*21,236,18+(i*5)%10,'#1a4a2a');
   c.strokeStyle='#3a3a3a';c.lineWidth=1;c.beginPath();c.moveTo(30,SY[0]-30);c.lineTo(160,SY[1]-30);c.lineTo(290,SY[2]-30);c.stroke();
   for(let i=0;i<3;i++){X.rr(ST[i]-18,SY[i]-30,36,30,2,'#8a5a3a');X.poly([[ST[i]-22,SY[i]-30],[ST[i],SY[i]-44],[ST[i]+22,SY[i]-30]],'#5a2a24');X.rr(ST[i]-6,SY[i]-16,12,16,1,'#3a2a20');X.rr(ST[i]-15,SY[i]-24,7,6,1,'#ffd87a');X.rr(ST[i]+8,SY[i]-24,7,6,1,'#ffd87a');X.ot(['BASE','MIDDLE','PEAK'][i],ST[i],SY[i]+4,'#ffffff',1,'c');}});
  const x=xAt(pos),y=yAt(x)-30;c.save();c.translate(x,y);c.rotate(Math.sin(A.t*.05)*.03*v+(!go&&riders.length?Math.sin(A.t*.4)*.04:0));X.rr(-1,0,2,12,0,'#3a3a3a');X.rr(-18,12,36,24,4,X.lg(0,12,0,36,['#e84a3a','#a82a24']));X.rr(-15,15,30,10,2,'#bfe4ff');for(let i=0;i<riders.length;i++){const L=LOOKS[riders[i].look];c.save();c.beginPath();c.rect(-15,15,30,10);c.clip();hero(-10+i*7,32,{s:.6,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:riders[i].seed,bob:0,mood:!go&&ST.every(s=>Math.abs(s-x)>6)?'o':'happy'});c.restore();X.rr(-12+i*7,27,5,4,1,['#ffd04a','#7dff9a','#7ae8ff'][riders[i].to]);}c.restore();
  for(let s=0;s<3;s++)wait[s].forEach((r,i)=>{const L=LOOKS[r.look];hero(ST[s]-26-i*9,SY[s],{s:.7,d:1,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:r.seed,bob:0,mood:r.p<300?'sad':'happy'});X.rr(ST[s]-29-i*9,SY[s]-30,6,4,1,['#ffd04a','#7dff9a','#7ae8ff'][r.to]);});
  for(let i=0;i<3;i++)X.rr(ST[i]-3,SY[i]-56,6,4,1,['#ffd04a','#7dff9a','#7ae8ff'][i]);
  fx.draw();X.bar('RIDING '+riders.length+'/4',String(g.score),go?'MOVING':'STOPPED','#ffe27a','#ffe27a');for(let i=0;i<8;i++)X.disc(126+i*9,30,2.4,i<scare?'#ff5a4a':'rgba(255,255,255,.3)');};
 return g;}});

/* ================= BALLOON CROSSING ================= */
A.add({id:'ballooncross',name:'BALLOON CROSSING',cat:'CLASSICS',tags:'hot air balloon wind mountains',how:'HOLD A TO BURN AND RISE, LET GO TO SINK. EACH HEIGHT HAS ITS OWN WIND. REACH THE FLAGS.',make(){
 const g={over:null,score:0},fx=X.fx();let x=40,y=180,vy=0,fuel=1,flags=[],t=0,lives=3,inv=0,gx2=0;
 const wind=y=>Math.sin(y*.035+t*.002)*1.2;
 const addF=()=>flags.push({x:40+rnd(240),y:50+rnd(120)});addF();addF();
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0);if(k.a&&fuel>0){vy-=.06;fuel-=.003;}vy=(vy+.025)*.97;y+=vy;x+=wind(y)*.8+ax(k)*.2;if(x<10)x=W-10;if(x>W-10)x=10;fuel=Math.min(1,fuel+.0008);
  if(y>214&&!inv){lives--;inv=90;y=150;vy=-1;S('lose');A.shake=5;fx.pop(x,180,'BUMP!','#ff6a5a');if(lives<=0){g.over='BASKET BROKE';return;}}if(y<30){y=30;vy=.3;}
  for(const f of flags)if(hyp(f.x-x,f.y-(y+14))<16){f.done=1;g.score+=20;S('coin');fx.pop(f.x,f.y-14,'+20','#ffe27a');fx.spark(f.x,f.y,'#ffe27a',10,2);}flags=flags.filter(f=>!f.done);while(flags.length<2)addF();gx2+=.2;};
 g.draw=()=>{const c=A.c;X.cache('vy_cap',()=>{X.sky(['#f8a86a','#fcd0a0','#fff0d8']);X.glow(60,180,90,'#fff0c0',.5);for(const[x,h,col]of[[0,90,'#c8906a'],[60,130,'#b87a5a'],[150,100,'#c8906a'],[220,140,'#a86a4a'],[290,110,'#b87a5a']]){X.poly([[x-30,240],[x-8,240-h],[x+6,240-h-6],[x+30,240-h*.6],[x+50,240]],X.lg(0,240-h,0,240,[X.lt(col,1.2),col,X.lt(col,.6)]));for(let k=0;k<3;k++)X.rr(x-4+k*5,240-h*.7+k*8,3,4,1.5,'#3a2a20');}X.vg(0,214,W,26,['#a87a5a','#7a5a3a']);});
  for(let i=0;i<6;i++){const yy=40+i*30,w=wind(yy);c.globalAlpha=.35;for(let k=0;k<3;k++){const xx=((k*130+gx2*Math.sign(w)*Math.abs(w)*6)%(W+80)+W+80)%(W+80)-40;X.stroke([[xx,yy],[xx+16*Math.sign(w),yy]],'#ffffff',1);X.poly([[xx+16*Math.sign(w),yy-2],[xx+20*Math.sign(w),yy],[xx+16*Math.sign(w),yy+2]],'#ffffff');}c.globalAlpha=1;}
  for(let i=0;i<4;i++){const bx=((i*90+A.t*.15*(i%2?1:-1))%(W+40)+W+40)%(W+40)-20,by=60+i*28;c.globalAlpha=.6;X.ell(bx,by,6,7,['#7ae8ff','#ff8ad8','#ffd04a','#7dff9a'][i]);X.rr(bx-2,by+9,4,3,1,'#7a5430');c.globalAlpha=1;}
  for(const f of flags){X.rr(f.x-1,f.y-12,1.4,16,0,'#3a3a3a');X.poly([[f.x,f.y-12],[f.x+10,f.y-9],[f.x,f.y-6]],A.t%20<10?'#ff4a4a':'#ff8a2a');if(lo())X.glow(f.x,f.y-8,10,'#ffe27a',.3);}
  if(!(inv&&A.t%6<3)){const by=y,burn=A.in(0).a&&fuel>0;c.save();c.translate(x,by);ink(c=>{c.moveTo(-14,-10);c.bezierCurveTo(-18,-34,18,-34,14,-10);c.quadraticCurveTo(8,4,4,8);c.lineTo(-4,8);c.quadraticCurveTo(-8,4,-14,-10);},X.lg(-14,0,14,0,['#ff6a4a','#ffd04a','#ff6a4a']));for(const s of[-7,0,7])X.stroke([[s*.7,-29],[s,6]],'rgba(120,30,20,.35)',.8);X.rr(-14,-18,28,3,1,'rgba(255,255,255,.5)');
   X.stroke([[-4,8],[-5,16]],'#5a3a24',.6);X.stroke([[4,8],[5,16]],'#5a3a24',.6);if(burn){if(lo())X.glow(0,10,12,'#ffb040',.7);X.ell(0,10,2,4,'#ffe080');}hero(0,26,{s:.6,top:'#3a6ac8',bot:'#2a2a3a',hat:'cap',hatC:'#ffd04a',style:0,seed:110,bob:0,arm:burn?-2.6:-.4});X.rr(-7,16,14,9,2,X.lg(0,16,0,25,['#c8945a','#8a5a30']));c.restore();}
  fx.draw();X.bar('FUEL',String(g.score),'','#ffb040','#ffe27a');X.meter(56,7,70,5,fuel,fuel<.2?'#ff5a4a':'#ffb040');hearts(lives,140);};
 return g;}});

/* ================= CARNIVAL PARADE ================= */
A.add({id:'carnival',name:'CARNIVAL PARADE',cat:'PARTY',tags:'dance rhythm parade float samba',how:'PRESS THE ARROW SHOWN AS IT REACHES THE RING. THE CROWD CHEERS LOUDER WITH EVERY STREAK.',make(){
 const g={over:null,score:0},fx=X.fx(),DIRS=['l','u','d','r'],COL=['#ff4a8a','#ffd04a','#4ad8ff','#7dff6a'];let notes=[],t=0,streak=0,miss=0,hype=0,pose=0,poseT=0;
 g.update=()=>{t++;if(poseT)poseT--;const iv=Math.max(20,46-t/120|0);if(t%iv===0)notes.push({d:ri(4),x:W+10});const h=A.hit(0);
  for(const n of notes)n.x-=2+t/3000;let pressed=DIRS.findIndex(d=>h[d]);if(pressed<0&&h.a)pressed=4;if(pressed>=0){poseT=10;pose=pressed%4;const n=notes.filter(n=>!n.done).sort((a,b)=>a.x-b.x)[0];if(n&&Math.abs(n.x-70)<14&&n.d===pressed){n.done=1;streak++;const v=Math.abs(n.x-70)<5?20:10;g.score+=v+Math.min(streak,20);hype=Math.min(1,hype+.08);pose=n.d;poseT=14;S('coin');fx.spark(70,100,COL[n.d],8,1.8);fx.pop(70,74,v===20?'PERFECT':'GOOD',COL[n.d]);}else{streak=0;hype=Math.max(0,hype-.1);S('hit');}}
  for(const n of notes)if(!n.done&&n.x<50){n.done=1;streak=0;miss++;hype=Math.max(0,hype-.15);S('lose');if(miss>=10)g.over='THE PARADE MOVED ON';}notes=notes.filter(n=>!n.done);hype=Math.max(0,hype-.0005);};
 g.draw=()=>{const c=A.c;X.cache('vy_carn',()=>{X.sky(['#1a0a3a','#3a1a6a','#8a3a8a','#e86a6a'],150);for(let i=0;i<8;i++){const x=i*44,h=40+(i*13)%40;X.rr(x,150-h,40,h,1,['#e86a5a','#f0b040','#5ab8a8','#c86ab8'][i%4]);for(let r=0;r<2;r++)for(let q=0;q<3;q++)X.rr(x+5+q*12,156-h+r*14,7,9,3,'#ffe0a0');}X.vg(0,150,W,90,['#5a4a5a','#3a2a3a']);});
  for(let k=0;k<3;k++){const y=24+k*10;c.strokeStyle='rgba(255,255,255,.3)';c.lineWidth=.5;c.beginPath();c.moveTo(0,y);c.quadraticCurveTo(160,y+20,W,y);c.stroke();for(let i=0;i<14;i++){const x=(i*24+A.t*.4*(k%2?1:-1)+k*7)%W,yy=y+Math.sin(x/W*Math.PI)*15;X.poly([[x,yy],[x+5,yy],[x+2.5,yy+6]],COL[(i+k)%4]);}}
  for(let i=0;i<20;i++){const x=(i*17+A.t*(.5+i%3*.3))%W,y=(i*37+A.t*(1+i%2))%150;c.globalAlpha=.7;X.rr(x,y,2,3,0,COL[i%4]);}c.globalAlpha=1;
  const fy=170,fx2=180+Math.sin(A.t*.02)*6;X.shadow(fx2,fy+30,80,6,.4);X.rr(fx2-80,fy,160,26,6,X.lg(0,fy,0,fy+26,['#ffd04a','#ff8a2a','#c84a2a']));for(let i=0;i<10;i++)X.disc(fx2-72+i*16,fy+4,5,COL[i%4]);for(const w of[-56,56]){X.disc(fx2+w,fy+28,8,'#3a2a3a');X.disc(fx2+w,fy+28,3,'#ffd04a');}
  const arms=[[-2.6,.4],[-2.8,-2.8],[.5,.5],[.4,-2.6]];for(let i=0;i<5;i++){const L=LOOKS[(i+2)%6],a=poseT?arms[pose]:[Math.sin(A.t*.15+i)*1.2-1,0];hero(fx2-56+i*28,fy+2-Math.abs(Math.sin(A.t*.2+i))*(2+hype*4),{s:1.15,top:L[0],bot:L[1],hat:i%2?'straw':null,hatC:COL[i%4],style:L[4],seed:120+i,bob:0,arm:a[0],mood:'happy',cape:hype>.6?COL[i%4]:null});}
  crowd(236,16,.8,3);
  c.fillStyle='rgba(0,0,0,.4)';c.fillRect(0,88,W,24);X.rrs(56,86,28,28,6,'#ffffff',1.6);for(const n of notes){if(n.x>W-10)continue;const ar=['<','^','v','>'][n.d];if(lo())X.glow(n.x,100,10,COL[n.d],.4);X.rr(n.x-10,90,20,20,5,COL[n.d]);T(ar,n.x,96,'#1a1020',2,'c');}
  fx.draw();X.bar('STREAK '+streak,String(g.score),'MISSES '+miss+'/10','#ff8ad8','#ffe27a');X.meter(110,20,100,4,hype,'#ff4a8a');};
 return g;}});

/* ================= PENGUIN SLIDE ================= */
A.add({id:'penguinslide',name:'PENGUIN SLIDE',cat:'CLASSICS',tags:'penguin belly slide ice fish',how:'UP/DOWN STEER THE SLIDING PENGUIN. A HOPS CRACKS. EAT FISH, MISS SEALS. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx();let y=150,vy=0,hop=0,ob=[],t=0,lives=3,inv=0,dist=0;
 g.update=()=>{t++;if(inv)inv--;if(hop)hop--;const sp=2.4+t/1800;dist+=sp;const k=A.in(0);vy=(vy+ay(k)*.25)*.88;y=cl(y+vy,90,226);if(A.hit(0).a&&!hop){hop=26;S('jump');}
  if(t%Math.max(18,40-t/150|0)===0){const r=Math.random();ob.push({k:r<.35?'fish':r<.6?'crack':r<.85?'seal':'ice',x:W+20,y:96+rnd(126)});}
  for(const o of ob){o.x-=sp;const near=Math.abs(o.x-70)<12&&Math.abs(o.y-y)<12;if(!near||o.done)continue;if(o.k==='fish'){o.done=1;g.score+=10;S('coin');fx.pop(70,y-24,'+10','#7ae8ff');}else if(!hop&&!inv){o.done=1;lives--;inv=80;S('hit');A.shake=5;fx.pop(70,y-24,o.k==='seal'?'BOOP!':o.k==='crack'?'SPLASH!':'THUNK!','#ff8a7a');if(lives<=0)g.over='WIPED OUT';}}ob=ob.filter(o=>o.x>-20&&!(o.done&&o.k==='fish'));if(t%20===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('vy_ice',()=>{X.sky(['#1a2a5a','#3a5a9a','#8ab0d8'],90);c.save();c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){c.beginPath();c.moveTo(0,20+i*10);for(let x=0;x<=W;x+=20)c.lineTo(x,20+i*10+Math.sin(x*.03+i)*8);c.lineTo(W,40+i*10);c.lineTo(0,40+i*10);c.fillStyle=['rgba(80,255,170,.14)','rgba(80,200,255,.10)','rgba(160,120,255,.08)','rgba(80,255,170,.06)'][i];c.fill();}c.restore();X.stars(40,61,0,0,60,.6);
   for(const[x,h]of[[30,40],[110,26],[200,46],[280,30]]){X.poly([[x-30,90],[x-6,90-h],[x+10,90-h+6],[x+34,90]],X.lg(0,90-h,0,90,['#ffffff','#c8dcf0']));X.poly([[x+10,90-h+6],[x+34,90],[x+10,90]],'rgba(80,120,180,.2)');}X.vg(0,88,W,152,['#e8f2fa','#cfe0f0','#b8d0e8']);});
  const o=dist%60;c.fillStyle='rgba(140,170,210,.35)';for(let i=-1;i<7;i++)for(let k=0;k<4;k++)c.fillRect(i*60-o+(k*17)%40,100+k*34,24,1);
  for(const ob2 of ob){const x=ob2.x,yy=ob2.y;if(ob2.k==='fish'){if(lo())X.glow(x,yy,8,'#7ae8ff',.4);c.save();c.translate(x,yy);c.rotate(Math.sin(A.t*.3+x)*.3);X.poly([[-6,0],[-10,-3],[-10,3]],'#4a8ad8');ink(c=>c.ellipse(0,0,6,2.6,0,0,TAU),X.lg(0,-3,0,3,['#bfe8ff','#4a8ad8']),.5);c.restore();}
   else if(ob2.k==='crack'){X.ell(x,yy,14,5,'#1a4a7a');X.ell(x,yy-1,12,3.5,'#2a6aa8');X.stroke([[x-16,yy],[x-22,yy-3]],'#8ab0d8',.8);}
   else if(ob2.k==='seal'){c.save();c.translate(x,yy);ink(c=>c.ellipse(0,-5,12,6,0,0,TAU),X.lg(0,-11,0,1,['#9aa4b8','#6a7488']));ink(c=>c.arc(-9,-10,5,0,TAU),'#9aa4b8');X.disc(-11,-11,1,'#1a1a1a');X.disc(-13,-9,.9,'#3a3a3a');X.poly([[10,-4],[16,-8],[16,0]],'#6a7488');c.restore();}
   else{X.poly([[x-8,yy],[x-5,yy-14],[x+4,yy-16],[x+8,yy]],X.lg(x-8,0,x+8,0,['#ffffff','#b8d4ec']));}}
  if(!(inv&&A.t%6<3)){const hy=y-(hop?Math.sin(hop/26*Math.PI)*16:0);X.shadow(70,y+2,12,3,.3);c.save();c.translate(70,hy);ink(c=>c.ellipse(0,-5,13,6,0,0,TAU),X.lg(0,-11,0,1,['#2a2a3a','#1a1a24']));X.ell(1,-2.6,10,3,'#ffffff');ink(c=>c.arc(12,-8,5,0,TAU),'#2a2a3a');X.ell(13,-6.6,3,2,'#ffffff');X.disc(13.6,-9,1.2,'#fff');X.disc(14,-9,.6,'#1a1a1a');X.poly([[16.6,-8],[21,-7],[16.6,-6]],'#ffb030');X.poly([[-13,-6],[-18,-9],[-17,-3]],'#ffb030');X.rr(6,-12,6,3,1,'#c83a3a');c.restore();if(lo())for(let k=0;k<4;k++){c.globalAlpha=.4-k*.1;X.disc(52-k*7,y-2+Math.sin(A.t+k)*1,2-k*.3,'#ffffff');}c.globalAlpha=1;}
  fx.draw();X.bar((dist/10|0)+' M',String(g.score),'','#7ae8ff','#ffe27a');hearts(lives,140);};
 return g;}});

/* ================= FJORD RACE ================= */
A.add({id:'fjordrace',name:'FJORD RACE',cat:'VERSUS',vs:1,tags:'longship rowing race fjord',how:'ALTERNATE LEFT AND RIGHT TO ROW. A IN A GUST RAISES THE SAIL. FIRST PAST THE STONES WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),GOAL=2400,LY=[118,196];let P=[{x:0,v:0,last:'',sail:0,str:0},{x:0,v:0,last:'',sail:0,str:0}],t=0,gust=0;
 g.timeUp=()=>tu(P[0].x,P[1].x);
 g.update=()=>{t++;if(gust)gust--;else if(t%400===200)gust=120;if(A.cpu){const q=P[1],o={};if(Math.random()<.12+A.ai*.18)o[q.last==='l'?'r':'l']=1;if(gust&&!q.sail&&Math.random()<.04+A.ai*.08)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],h=A.hit(i);if(p.str)p.str--;for(const d of['l','r'])if(h[d]){if(p.last!==d){p.v=Math.min(3.4,p.v+.35);p.last=d;p.str=8;if(i===0)S('blip');}else p.v*=.85;}if(h.a&&gust&&!p.sail){p.sail=120;if(i===0)S('power');}if(p.sail){p.sail--;p.v=Math.min(4,p.v+.04);}if(!gust)p.sail=0;p.v*=.985;p.x+=p.v;if(p.x>=GOAL){g.over=A.win(i);S('win');return;}}g.score=P[0].x/10|0;};
 g.draw=()=>{const c=A.c;X.cache('vy_fjord',()=>{X.sky(['#5a7ab8','#9ab8d8','#d8e4ee'],80);X.poly([[0,80],[0,10],[40,30],[70,0],[110,40],[130,80]],X.lg(0,0,0,80,['#5a6a7a','#3a4a5a']));X.poly([[190,80],[220,20],[260,40],[290,0],[W,20],[W,80]],X.lg(0,0,0,80,['#6a7a8a','#3a4a5a']));for(const[a,b2]of[[70,0],[290,0]])X.poly([[a-10,b2+14],[a,b2],[a+10,b2+14]],'#ffffff');for(let i=0;i<12;i++)pine(i*28,84,16,'#2a4a3a');X.vg(0,80,W,160,['#3a6a8a','#2a5a7a','#1a4a6a']);});
  c.fillStyle='rgba(200,230,255,.18)';for(let i=0;i<30;i++)c.fillRect((i*47-t*.6)%W+W%W,90+(i*29)%150,14,1);
  if(gust){c.globalAlpha=Math.min(1,gust/30)*.5;for(let i=0;i<8;i++)X.stroke([[(i*50+t*4)%W,96+i*16],[(i*50+t*4)%W+24,96+i*16]],'#ffffff',1);c.globalAlpha=1;T('GUST! PRESS A',160,96,'#ffffff',1,'c');}
  for(let i=0;i<2;i++){const p=P[i],ly=LY[i],cam=p.x-110,sx=p.x-cam;const gx=GOAL-cam;if(gx<W+30){for(let k=0;k<2;k++){X.rr(gx-4,ly-34+k*48,8,22,2,'#7a7a72');}}
   c.save();c.translate(sx,ly);c.rotate(Math.sin(t*.06+i)*.03);if(lo())for(let k=0;k<3;k++){c.globalAlpha=.3-k*.08;X.ell(-30-k*10,6,8+k*4,2,'#ffffff');}c.globalAlpha=1;
   ink(c=>{c.moveTo(-30,-4);c.quadraticCurveTo(-36,-14,-32,-18);c.lineTo(-26,-6);c.lineTo(26,-6);c.lineTo(32,-18);c.quadraticCurveTo(36,-14,30,-4);c.quadraticCurveTo(0,8,-30,-4);},X.lg(0,-18,0,6,['#a87a4a','#7a5430','#5a3a20']));for(let s=0;s<5;s++)ink(c=>c.arc(-20+s*10,-6,3.4,0,TAU),s%2?(i?'#c83a3a':'#2a6ac8'):'#f4ead4',.5);
   X.rr(-1,-40,2,34,0,'#5a3a24');if(p.sail||gust)ink(c=>{c.moveTo(-14,-38);c.lineTo(14,-38);c.quadraticCurveTo(18+(p.sail?6:0),-24,14,-10);c.lineTo(-14,-10);c.quadraticCurveTo(-10+(p.sail?6:0),-24,-14,-38);},p.sail?(i?'#e84a4a':'#3a8ad8'):'rgba(255,255,255,.3)',.6);
   for(let r=0;r<3;r++){hero(-16+r*12,-6,{s:.55,top:i?'#c84a3a':'#3a6ac8',bot:'#3a2a20',hat:'helm',hatC:'#ffd04a',style:r%2?4:1,hair:['#c8a050','#8a3a1a','#e8d8a0'][r],seed:130+r+i*3,bob:0,arm:p.str?-1.6:-.4});const oa=p.str?.6:-.4;X.stroke([[-14+r*12,-8],[-14+r*12+Math.cos(oa+1.2)*14,-8+Math.sin(oa+1.2)*14]],'#c8a070',1);}c.restore();
   X.meter(20,ly+20,280,3,p.x/GOAL,i?'#ff4f9a':'#2fd6c3');}
  fx.draw();X.bar();A.hud2(P[0].x/24|0,P[1].x/24|0);};
 return g;}});

/* ================= SNOW RESCUE ================= */
A.add({id:'snowrescue',name:'SNOW RESCUE',cat:'ACTION',tags:'rescue dog avalanche hikers snow',how:'MOVE THE RESCUE DOG. A SNIFFS: THE RING GLOWS WARMER NEAR A BURIED HIKER. B DIGS.',make(){
 const g={over:null,score:0},fx=X.fx();let d={x:160,y:140,f:1,st:0},hid=[],t=0,sniff=0,warmth=0,dig=0,found=0,cold=1,flk=[];for(let i=0;i<50;i++)flk.push({x:rnd(W),y:rnd(H)});
 const add=()=>hid.push({x:20+rnd(W-40),y:50+rnd(H-70),look:ri(6),seed:ri(99),up:0});add();add();
 g.update=()=>{t++;if(sniff)sniff--;if(dig)dig--;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx)d.f=dx;d.x=cl(d.x+dx*1.8,10,W-10);d.y=cl(d.y+dy*1.8,40,H-8);if(dx||dy)d.st+=.4;cold-=.0006+t/3e6;if(cold<=0){g.over='TOO COLD TO SEARCH';S('lose');return;}
  const near=hid.filter(h=>!h.up).sort((a,b)=>hyp(a.x-d.x,a.y-d.y)-hyp(b.x-d.x,b.y-d.y))[0];const nd=near?hyp(near.x-d.x,near.y-d.y):999;
  if(A.hit(0).a&&!sniff){sniff=50;warmth=cl(1-nd/200,0,1);S('blip');}
  if(A.hit(0).b&&!dig){dig=20;S('hit');fx.debris(d.x+d.f*8,d.y,'#ffffff',8,1.8);if(near&&nd<14){near.up=1;found++;g.score+=50;cold=Math.min(1,cold+.4);S('win');fx.pop(near.x,near.y-30,'FOUND! +50','#7dff9a');fx.spark(near.x,near.y-10,'#ffe27a',14,2);}}
  for(const h of hid)if(h.up)h.up++;hid=hid.filter(h=>h.up<120);while(hid.filter(h=>!h.up).length<2)add();for(const f of flk){f.y+=1.2;f.x+=1+Math.sin(t*.02+f.y*.04);if(f.y>H){f.y=0;f.x=rnd(W);}if(f.x>W)f.x=0;}};
 g.draw=()=>{const c=A.c;X.cache('vy_aval',()=>{X.vg(0,0,W,H,['#d8e4f0','#e8f0f8','#f4f8fc']);for(let i=0;i<40;i++){X.ell(hash(i,1)*W,30+hash(i,2)*210,10+hash(i,3)*20,3,'rgba(160,190,220,.25)');}for(let i=0;i<8;i++){const x=hash(i,5)*W,y=40+hash(i,6)*190;pine(x,y,22,'#2a4a4a');X.ell(x,y-14,6,2,'#fff');}X.rr(270,20,40,26,2,'#8a4a2a');X.poly([[266,20],[290,6],[314,20]],'#ffffff');X.rr(284,30,8,16,1,'#3a2a20');X.rr(296,26,8,6,1,'#ffd87a');});
  if(lo())X.glow(300,30,20,'#ffd87a',.3);
  for(const h of hid){if(!h.up){if(lo()&&A.t%90<4){X.disc(h.x+rnd(4)-2,h.y-2,1,'rgba(200,220,240,.8)');}continue;}const L=LOOKS[h.look],r=Math.min(1,h.up/20);c.save();c.globalAlpha=1-Math.max(0,(h.up-90)/30);hero(h.x,h.y,{s:r,top:L[0],bot:L[1],hat:'beanie',hatC:L[3]||'#c83a3a',style:L[4],seed:h.seed,bob:0,arm:-2.6,mood:'happy'});c.restore();X.ell(h.x,h.y+1,12,3,'rgba(255,255,255,.9)');}
  if(sniff){const r=(50-sniff)*1.2,col=warmth>.66?'#ff4a2a':warmth>.33?'#ffb040':'#4ab8ff';c.strokeStyle=X.rgba(col,sniff/50);c.lineWidth=2;c.beginPath();c.arc(d.x,d.y-6,r,0,TAU);c.stroke();T(warmth>.66?'HOT!':warmth>.33?'WARM':'COLD',d.x,d.y-40,col,1,'c');}
  c.save();c.translate(d.x,d.y);c.scale(d.f,1);X.shadow(0,0,11,3,.3);for(let l=0;l<4;l++){c.save();c.translate(-6+l*4,-5);c.rotate(Math.sin(d.st+l*1.6)*.5);ink(c=>c.rect(-1,0,2.2,5),'#7a4a2a',.5);c.restore();}ink(c=>c.ellipse(0,-9,9,5,0,0,TAU),X.lg(0,-14,0,-4,['#c88a4a','#8a5a2a']));X.ell(-1,-7,5,2,'#f4ead4');X.rr(-3,-15,6,5,1,'#c83a3a');X.disc(0,-15,1.6,'#ffd04a');ink(c=>c.ellipse(9,-13,4.6,4,0,0,TAU),'#c88a4a',.6);X.ell(12,-12,2.4,1.6,'#f4ead4');X.disc(13.6,-12.6,.9,'#1a1a1a');X.disc(9.4,-14.4,.8,'#1a1a1a');ink(c=>c.ellipse(6,-12,1.8,3.4,.3,0,TAU),'#5a3a1a',.5);X.stroke([[-9,-10],[-13,-14+Math.sin(A.t*.5)*2]],'#8a5a2a',1.6);c.restore();
  for(const f of flk)X.disc(f.x,f.y,1,'#ffffff');
  fx.draw();X.bar('FOUND '+found,String(g.score),'WARMTH','#7dff9a','#ffe27a');X.meter(120,12,80,3,cold,cold<.25?'#ff5a4a':'#ffb040');};
 return g;}});

/* ================= CANYON BRIDGE ================= */
A.add({id:'canyonbridge',name:'CANYON BRIDGE',cat:'PUZZLE',tags:'bridge planks canyon build cart',how:'LEFT/RIGHT AIM THE CRANE, A DROPS A PLANK. FILL EVERY GAP, THEN THE CART ROLLS ACROSS.',make(){
 const g={over:null,score:0},fx=X.fx(),N=12,PW=20,OX=40,BY=150;let gaps,laid,cx=6,drop=null,lvl=1,cart=-1,wait=0,planks=0,wasted=0;
 const make=()=>{gaps=[];laid=new Uint8Array(N);for(let i=0;i<N;i++){const isGap=i>0&&i<N-1&&Math.random()<.35+lvl*.05;gaps.push(isGap);if(!isGap)laid[i]=1;}if(!gaps.some(x=>x))gaps[5]=true,laid[5]=0;cart=-1;planks=gaps.filter(x=>x).length+2;};make();
 g.update=()=>{if(wait){if(--wait===0){lvl++;make();}return;}const h=A.hit(0),k=A.in(0);if(A.t%5===0&&ax(k))cx=cl(cx+ax(k)*.5,0,N-1);if(h.l)cx=Math.max(0,cx-1);if(h.r)cx=Math.min(N-1,cx+1);
  if(h.a&&!drop&&cart<0&&planks>0){drop={x:Math.round(cx),y:40,vy:0};planks--;S('blip');}
  if(drop){drop.vy+=.25;drop.y+=drop.vy;if(drop.y>=BY-4){const i=drop.x;if(gaps[i]&&!laid[i]){laid[i]=1;g.score+=15;S('hit');fx.debris(OX+i*PW+10,BY,'#c8945a',6,1.4);fx.pop(OX+i*PW+10,BY-20,'+15','#ffe27a');}else{wasted++;S('lose');fx.pop(OX+i*PW+10,BY-20,'WASTED','#ff8a7a');fx.debris(OX+i*PW+10,BY+40,'#c8945a',8,2);}drop=null;}}
  if(cart<0&&laid.every(v=>v)){cart=0;S('power');}if(cart>=0){cart+=.08;if(cart>=N){g.score+=50+planks*20;wait=60;S('win');A.confetti();fx.pop(160,70,'CROSSED!','#7dff9a');}}
  if(cart<0&&!drop&&planks===0&&!laid.every(v=>v)){g.over='OUT OF PLANKS';S('lose');}};
 g.draw=()=>{const c=A.c;X.cache('vy_canyon',()=>{X.sky(['#f0a060','#f8c890','#fff0d0'],140);X.glow(250,40,60,'#fff4d0',.6);for(const[x,w]of[[0,40],[280,40]])X.poly([[x,BY],[x+w,BY],[x+w-6,H],[x+6,H]],X.lg(0,BY,0,H,['#c8784a','#8a4a2a','#5a2a1a']));
   X.vg(40,BY,240,H-BY,['#5a2a1a','#3a1a10','#1a0a06']);c.fillStyle='rgba(255,180,120,.08)';for(let i=0;i<8;i++)c.fillRect(40,BY+10+i*10,240,1);X.stroke([[130,H],[150,200],[170,220],[190,H]],'#3a7ab8',4);
   for(const[x,h]of[[60,60],[120,40],[200,70],[260,50]])X.poly([[x-14,140],[x,140-h],[x+14,140]],X.lg(0,140-h,0,140,['#e8986a','#b86a40']));});
  for(let i=0;i<N;i++){const x=OX+i*PW-0;if(!gaps[i]||laid[i]){X.rr(x,BY-4,PW-1,6,1,X.lg(0,BY-4,0,BY+2,['#d8a46a','#a8743a']));c.fillStyle='rgba(0,0,0,.25)';c.fillRect(x+PW-2,BY-4,1,6);}}
  X.stroke([[OX,BY-14],[OX+N*PW,BY-14]],'#7a5430',1);for(let i=0;i<=N;i+=3)X.rr(OX+i*PW-1,BY-16,2,14,0,'#7a5430');
  const cxp=OX+cx*PW+10;X.rr(cxp-1,20,2,20,0,'#3a3a3a');X.rr(cxp-14,14,28,8,2,'#ffd04a');X.rr(cxp-14,14,28,2,1,'#fff0a0');if(!drop&&cart<0&&planks>0)X.rr(cxp-9,40,18,5,1,'#c8945a');if(!drop)X.stroke([[cxp,48],[cxp,BY-10]],'rgba(255,255,255,.25)',.6);
  if(drop)X.rr(OX+drop.x*PW+1,drop.y,PW-2,5,1,'#c8945a');
  hero(OX-14,BY,{s:1,d:1,top:'#f0b030',bot:'#3a4a6a',hat:'helm',hatC:'#ffd04a',style:0,seed:140,bob:0,arm:-2.2,mood:'happy'});
  const cpos=cart<0?-1:cart;const cxx=cart<0?OX-34:OX+cpos*PW;c.save();c.translate(cxx+8,BY-6);X.rr(-12,-14,24,12,2,X.lg(0,-14,0,-2,['#8a5a3a','#5a3a20']));for(const w of[-7,7])X.disc(w,0,3.4,'#2a2a2a');for(let k=0;k<3;k++)X.disc(-6+k*6,-15,3.4,['#ffd04a','#c8c8d0','#ff8a4a'][k]);c.restore();
  fx.draw();X.bar('BRIDGE '+lvl,String(g.score),'PLANKS '+planks,'#ffd04a','#ffe27a');};
 return g;}});

/* ================= TEMPLE TORCHES ================= */
A.add({id:'templetorch',name:'TEMPLE TORCHES',cat:'PUZZLE',tags:'temple jungle torches lights out',how:'MOVE TO A TORCH. A FLIPS IT AND ITS NEIGHBOURS. LIGHT ALL OF THEM TO WAKE THE IDOL.',make(){
 const g={over:null,score:0},fx=X.fx(),N=5,CS=36,OX=70,OY=48;let b,cur={x:2,y:2},mv=0,lvl=1,wait=0,moves=0;
 const flip=(x,y)=>{for(const[dx,dy]of[[0,0],[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<N&&ny<N)b[ny*N+nx]^=1;}};
 const make=()=>{b=new Uint8Array(N*N).fill(1);for(let i=0;i<2+lvl*2;i++)flip(ri(N),ri(N));if(b.every(v=>v))flip(2,2);moves=0;};make();
 g.update=()=>{if(wait){if(--wait===0){lvl++;make();}return;}if(mv)mv--;const k=A.in(0);if(!mv&&(ax(k)||ay(k))){cur.x=cl(cur.x+ax(k),0,N-1);cur.y=cl(cur.y+ay(k),0,N-1);mv=7;}
  if(A.hit(0).a){flip(cur.x,cur.y);moves++;S('blip');fx.spark(OX+cur.x*CS+18,OY+cur.y*CS+10,'#ffb040',6,1.4);if(b.every(v=>v)){g.score+=Math.max(20,100-moves*4);wait=110;S('win');A.confetti();fx.pop(160,26,'THE IDOL WAKES!','#ffe27a');}}};
 g.draw=()=>{const c=A.c;X.cache('vy_temple',()=>{X.vg(0,0,W,H,['#1a2a1a','#14201a','#0a120c']);for(let y=0;y<H;y+=18)for(let x=(y/18%2)*16;x<W;x+=32){X.rr(x,y,31,17,1,'#2a3a2a');c.fillStyle='rgba(120,200,120,.05)';c.fillRect(x,y,31,1);}
   for(let i=0;i<14;i++){const x=hash(i,1)*W;X.stroke([[x,0],[x+Math.sin(i)*8,40+hash(i,2)*60]],'#2a6a2a',2);for(let k=0;k<4;k++)X.ell(x+Math.sin(i)*k*2,10+k*14+hash(i,2)*10,4,2,'#3a8a3a');}
   X.rr(OX-8,OY-8,N*CS+16,N*CS+16,4,'#3a4a3a');X.rrs(OX-8,OY-8,N*CS+16,N*CS+16,4,'#6a8a5a',1.2);
   X.rr(14,90,40,70,4,'#4a5a4a');X.rr(18,84,32,14,4,'#5a6a5a');X.rr(266,90,40,70,4,'#4a5a4a');X.rr(270,84,32,14,4,'#5a6a5a');});
  const awake=wait>0;for(const ix of[34,286]){X.disc(ix-6,104,3,awake?'#7dff6a':'#1a2a1a');X.disc(ix+6,104,3,awake?'#7dff6a':'#1a2a1a');if(awake&&lo())X.glow(ix,104,16,'#7dff6a',.5);X.rr(ix-8,116,16,3,1,awake?'#7dff6a':'#2a3a2a');}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const on=b[y*N+x],px=OX+x*CS+18,py=OY+y*CS+18;X.rr(px-3,py-2,6,14,1,'#5a4a3a');X.rr(px-7,py-6,14,5,2,'#7a6a5a');if(on){if(lo())X.glow(px,py-12,20,'#ffb040',.45);const f=Math.sin(A.t*.3+x+y)*1.5;ink(c=>{c.moveTo(px-5,py-6);c.quadraticCurveTo(px-6,py-14,px+f,py-22);c.quadraticCurveTo(px+6,py-14,px+5,py-6);c.closePath();},X.lg(0,py-22,0,py-6,['#fff4b0','#ffb040','#ff6a2a']),.5);}else{X.ell(px,py-8,4,1.5,'#2a2a2a');if(lo()){c.globalAlpha=.3;X.disc(px+Math.sin(A.t*.05)*2,py-14-(A.t*.2%10),2,'#6a6a6a');c.globalAlpha=1;}}}
  X.rrs(OX+cur.x*CS+2,OY+cur.y*CS+2,CS-4,CS-4,5,A.t%30<20?'#ffffff':'#ffe27a',1.4);
  hero(OX+cur.x*CS+18,OY+cur.y*CS+CS+2,{s:.65,top:'#c8a060',bot:'#5a4a2a',hat:'cowboy',hatC:'#7a5430',style:0,seed:150,bob:0,arm:-2,hold:c=>{X.rr(-1,-6,2,7,.5,'#7a5430');X.ell(0,-8,2,3,'#ffb040');}});
  fx.draw();X.bar('TEMPLE '+lvl,String(g.score),'FLIPS '+moves,'#ffb040','#ffe27a');};
 return g;}});

/* ================= LASSO LOOP ================= */
A.add({id:'lassoloop',name:'LASSO LOOP',cat:'ACTION',tags:'cowboy lasso ranch calves',how:'LEFT/RIGHT RIDE. HOLD A TO SPIN THE LASSO, LET GO TO THROW. ROPE THE RUNAWAY CALVES.',make(){
 const g={over:null,score:0},fx=X.fx(),GY=200;let x=60,spin=0,rope=null,calves=[],t=0,escaped=0,roped=0;
 g.update=()=>{t++;const k=A.in(0);x=cl(x+ax(k)*2.2,20,W-20);if(k.a&&!rope){spin=Math.min(1,spin+.03);}else if(spin>0&&!rope){rope={x,y:GY-34,vx:3+spin*3,vy:-2.6-spin*2,r:6+spin*6,l:0};spin=0;S('shoot');}
  if(t%Math.max(50,110-t/40|0)===0)calves.push({x:-14,v:1+rnd(.9)+t/4000,ph:rnd(6),hop:0,c:['#8a5a3a','#f4ead4','#3a2a20'][ri(3)]});
  if(rope){rope.vy+=.12;rope.x+=rope.vx;rope.y+=rope.vy;rope.l++;for(const cv of calves)if(!cv.caught&&rope.y>GY-20&&hyp(cv.x-rope.x,(GY-8)-rope.y)<rope.r+6){cv.caught=1;roped++;g.score+=20+Math.round(cv.v*5);S('coin');fx.pop(cv.x,GY-30,'YEEHAW!','#ffe27a');rope=null;break;}if(rope&&(rope.y>GY||rope.x>W+20))rope=null;}
  for(const cv of calves){if(cv.caught){cv.x+=(30-cv.x)*.04;continue;}cv.x+=cv.v;cv.ph+=.3;if(cv.x>W+10&&!cv.gone){cv.gone=1;escaped++;S('lose');fx.pop(W-30,GY-30,'GOT AWAY','#ff8a7a');if(escaped>=5)g.over='THE HERD IS LOOSE';}}calves=calves.filter(c=>!c.gone&&!(c.caught&&c.x<34));};
 g.draw=()=>{const c=A.c;X.cache('vy_ranch',()=>{X.sky(['#6aa8e8','#a8d0f0','#f0e8c8'],GY-40);X.hills(150,20,'#b8a070',0,.015,3);for(const[mx,mw,mh]of[[200,80,60],[40,50,40]])X.poly([[mx,170],[mx+10,170-mh],[mx+mw-10,170-mh],[mx+mw,170]],X.lg(0,170-mh,0,170,['#c8704a','#8a4a2e']));
   X.vg(0,160,W,80,['#c8b070','#a8904e','#7a6a38']);for(let i=0;i<40;i++)X.stroke([[hash(i,1)*W,170+hash(i,2)*60],[hash(i,1)*W-2,165+hash(i,2)*60]],'#8a7a3a',1);
   X.rr(0,170,34,40,2,'#8a5a30');for(let i=0;i<4;i++)X.rr(0,174+i*9,34,2,0,'#5a3a20');X.rr(W-30,160,30,50,2,'#a83a2a');X.poly([[W-34,160],[W-15,144],[W+4,160]],'#7a2a1e');X.rr(W-22,180,14,30,1,'#5a2a1a');});
  for(const cv of calves){const b=cv.caught?0:Math.abs(Math.sin(cv.ph))*3;c.save();c.translate(cv.x,GY-b);X.shadow(0,b,9,2,.3);for(let l=0;l<4;l++){c.save();c.translate(-5+l*3.4,-6);c.rotate(Math.sin(cv.ph+l*1.6)*.5);ink(c=>c.rect(-.9,0,1.8,6),cv.c,.5);c.restore();}ink(c=>c.ellipse(0,-9,8,5,0,0,TAU),cv.c);X.disc(-2,-10,2,cv.c==='#f4ead4'?'#3a2a20':'#f4ead4');ink(c=>c.ellipse(8,-12,3.6,3.2,0,0,TAU),cv.c,.6);X.ell(10.6,-11,1.8,1.4,'#e8b0a0');X.disc(8.6,-13,.8,'#1a1a1a');X.poly([[6,-15],[5,-18],[8,-15]],'#f4ead4');if(cv.caught)X.stroke([[0,-9],[30-cv.x,-30]],'#d8b060',.8);c.restore();}
  c.save();c.translate(x,GY);X.shadow(0,2,18,3,.35);const run=x*.3;for(let l=0;l<4;l++){c.save();c.translate(-10+l*6,-14);c.rotate(Math.sin(run+l*1.6)*.4);ink(c=>c.rect(-1.4,0,2.8,14),'#5a3a24',.6);c.restore();}
  ink(c=>c.ellipse(0,-20,15,8,0,0,TAU),X.lg(0,-28,0,-12,['#8a5a3a','#5a3a24']));ink(c=>{c.moveTo(10,-24);c.lineTo(18,-34);c.lineTo(23,-31);c.lineTo(15,-20);c.closePath();},'#7a4a2e');ink(c=>c.ellipse(21,-33,4.6,3,-.6,0,TAU),'#7a4a2e');X.disc(21.6,-34.6,.8,'#1a1a1a');X.stroke([[16,-36],[10,-32],[4,-28]],'#2a1a10',2);
  hero(0,-24,{s:.95,top:'#c83a3a',bot:'#3a4a7a',hat:'cowboy',hatC:'#a87040',style:0,hair:'#2a1a10',seed:160,bob:0,arm:spin?-2.8:-.6});
  if(spin){c.strokeStyle='#d8b060';c.lineWidth=1;c.beginPath();c.ellipse(2,-58,5+spin*8,2+spin*3,0,0,TAU);c.stroke();}c.restore();
  if(rope){c.strokeStyle='#d8b060';c.lineWidth=1;c.beginPath();c.moveTo(x+2,GY-50);c.quadraticCurveTo((x+rope.x)/2,rope.y-20,rope.x,rope.y);c.stroke();c.beginPath();c.ellipse(rope.x,rope.y,rope.r,rope.r*.4,0,0,TAU);c.stroke();}
  fx.draw();X.bar('ROPED '+roped,String(g.score),'LOOSE '+escaped+'/5','#ffe27a','#ffe27a');};
 return g;}});

/* ================= TOPIARY ================= */
A.add({id:'topiary',name:'TOPIARY',cat:'PUZZLE',tags:'hedge garden trim shape',how:'MOVE THE SHEARS. A SNIPS A CLUMP. TRIM THE HEDGE TO THE PLAN. DO NOT CUT INSIDE.',make(){
 const g={over:null,score:0},fx=X.fx(),N=10,CS=14,OX=150,OY=60;let hedge,plan,cur={x:5,y:5},mv=0,lvl=1,wait=0,mist=0;
 const SH=[(x,y)=>((x-4.5)**2+(y-4.5)**2)<16,(x,y)=>y>=Math.abs(x-4.5)*1.6-1&&y<9,(x,y)=>((x-4.5)**2/16+(y-3)**2/6)<1||(x>3&&x<6&&y>5),(x,y)=>((x-2.5)**2+(y-3)**2<5)||((x-6.5)**2+(y-3)**2<5)||(y>=3&&y<=8&&Math.abs(x-4.5)<=4-(y-3)*.8)];
 const make=()=>{const f=SH[(lvl-1)%SH.length];hedge=new Uint8Array(N*N).fill(1);plan=new Uint8Array(N*N);for(let y=0;y<N;y++)for(let x=0;x<N;x++)plan[y*N+x]=f(x,y)?1:0;mist=0;};make();
 const left=()=>{let n=0;for(let i=0;i<N*N;i++)if(hedge[i]&&!plan[i])n++;return n;};
 g.update=()=>{if(wait){if(--wait===0){lvl++;make();}return;}if(mv)mv--;const k=A.in(0);if(!mv&&(ax(k)||ay(k))){cur.x=cl(cur.x+ax(k),0,N-1);cur.y=cl(cur.y+ay(k),0,N-1);mv=6;}
  if(A.hit(0).a){const i=cur.y*N+cur.x;if(hedge[i]){hedge[i]=0;S('blip');fx.debris(OX+cur.x*CS+7,OY+cur.y*CS+7,'#4aa83a',6,1.6);if(plan[i]){mist++;g.score=Math.max(0,g.score-10);fx.pop(OX+cur.x*CS+7,OY+cur.y*CS-6,'OOPS','#ff8a7a');S('lose');if(mist>=5){g.over='THE DUCHESS IS NOT AMUSED';return;}}else g.score+=2;}}
  if(!left()){g.score+=80-mist*10;wait=90;S('win');A.confetti();fx.pop(160,30,'MASTERPIECE!','#ffe27a');}};
 g.draw=()=>{const c=A.c;X.cache('vy_garden',()=>{X.sky(['#8ac8f0','#c8e8f8'],60);X.rr(0,30,W,30,0,'#c8b8a0');for(let i=0;i<10;i++){X.rr(i*34,22,20,38,1,'#e8dcc8');X.rr(i*34-2,18,24,6,1,'#f4ead4');}X.vg(0,56,W,184,['#6ab84a','#5aa83e','#4a8a32']);for(let y=60;y<H;y+=20)for(let x=(y/20%2)*20;x<W;x+=40){c.fillStyle='rgba(255,255,255,.05)';c.fillRect(x,y,20,20);}
   X.rr(OX-4,OY+N*CS,N*CS+8,12,2,'#a8743a');X.rr(OX-8,OY+N*CS+10,N*CS+16,6,2,'#8a5a2e');
   X.rr(14,64,108,120,4,'#f4ead4');X.rrs(14,64,108,120,4,'#a89a80',1);X.ot('THE PLAN',68,70,'#5a4a3a',1,'c');for(let i=0;i<4;i++)X.stroke([[20,170+i*3],[110,170+i*3]],'rgba(90,70,50,.2)',.6);});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(plan[i])X.rr(28+x*8,80+y*8,7,7,1,'#4a8a3a');else X.rr(28+x*8,80+y*8,7,7,1,'rgba(90,70,50,.08)');}
  for(let y=0;y<N;y++)for(let x=0;x<N;x++){const i=y*N+x;if(!hedge[i])continue;const px=OX+x*CS,py=OY+y*CS,sh=hash(x,y);X.disc(px+7,py+7,8.4,X.rg(px+4,py+4,1,px+7,py+7,9,[plan[i]?'#6ad04a':'#7ac85a','#3a8a2a','#1e5a1a']));if(sh<.3)X.disc(px+4+sh*8,py+4,1.2,'#a8f080');}
  X.rrs(OX+cur.x*CS-1,OY+cur.y*CS-1,CS+2,CS+2,3,A.t%30<20?'#ffffff':'#ffe27a',1.4);c.save();c.translate(OX+cur.x*CS+12,OY+cur.y*CS+12);X.stroke([[0,0],[8,8]],'#c8c8d0',1.6);X.stroke([[0,4],[8,0]],'#c8c8d0',1.6);X.disc(9,9,2.4,'#c83a3a');X.disc(9,0,2.4,'#c83a3a');c.restore();
  hero(296,220,{s:1.1,d:-1,top:'#4a7a3a',bot:'#5a4a2a',hat:'straw',hatC:'#3a6a2a',style:0,hair:'#8a8a8a',seed:170,bob:0,arm:-1.4,mood:mist>2?'sad':'happy'});
  fx.draw();X.bar('HEDGE '+lvl,String(g.score),left()+' CLUMPS TO TRIM','#7dff6a','#ffe27a');for(let i=0;i<5;i++)X.disc(140+i*8,30,2.4,i<mist?'#ff5a4a':'rgba(255,255,255,.3)');};
 return g;}});

/* ================= KITE SURF ================= */
A.add({id:'kitesurf',name:'KITE SURF',cat:'CLASSICS',tags:'kite surf waves jumps tricks',how:'UP/DOWN STEER THE BOARD. A ON A WAVE CREST LAUNCHES A JUMP; HOLD FOR MORE AIR. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),SEA=170;let y=SEA,vy=0,air=0,dist=0,t=0,lives=3,inv=0,ob=[],spin=0,lane=0;
 const wave=x=>Math.sin((x+dist)*.03)*8+Math.sin((x+dist)*.011)*5;
 g.update=()=>{t++;if(inv)inv--;const sp=2.4+t/2000;dist+=sp;const k=A.in(0);lane=cl(lane+ay(k)*1.2,-20,40);const sy=SEA+lane+wave(90);
  if(!air){y=sy;if(A.hit(0).a&&wave(90)<-6){air=1;vy=-4;S('jump');}else if(A.hit(0).a){air=1;vy=-2.2;S('jump');}}else{if(k.a)vy-=.08;vy+=.2;y+=vy;spin+=.2;if(y>=sy){air=0;const sp2=Math.round(Math.abs(spin)/TAU);if(sp2>0){g.score+=sp2*25;fx.pop(90,sy-40,sp2+' SPIN +'+sp2*25,'#ffe27a');S('coin');}spin=0;}}
  if(t%Math.max(30,70-t/100|0)===0)ob.push({k:Math.random()<.6?'rock':'buoy',x:W+20,l:-20+rnd(60)});for(const o of ob){o.x-=sp;if(!o.hit&&!inv&&Math.abs(o.x-90)<10&&Math.abs(o.l-lane)<12&&!air){o.hit=1;if(o.k==='buoy'){g.score+=10;S('blip');fx.pop(90,y-30,'+10','#7ae8ff');}else{lives--;inv=80;S('hit');A.shake=5;fx.pop(90,y-30,'WIPEOUT!','#ff6a5a');if(lives<=0)g.over='BOARD SNAPPED';}}}ob=ob.filter(o=>o.x>-20);if(t%20===0)g.score++;};
 g.draw=()=>{const c=A.c;X.cache('vy_surf',()=>{X.sky(['#3aa8e8','#8ad0f8','#d8f0ff'],140);X.glow(260,40,70,'#fffbe0',.7);X.disc(260,40,14,'#fffbe8');cloud(60,40,1.2);cloud(180,60,.9);X.poly([[0,140],[30,128],[70,134],[100,140]],'#3a8a5a');X.poly([[230,140],[270,122],[320,136],[320,140]],'#4a9a5a');});
  for(let l=0;l<3;l++){c.beginPath();c.moveTo(0,H);for(let x=0;x<=W;x+=8)c.lineTo(x,SEA-20+l*30+wave(x*(1+l*.3))*(1-l*.25));c.lineTo(W,H);c.closePath();c.fillStyle=['#2a8ac8','#1a6aa8','#0e4a88'][l];c.fill();c.fillStyle='rgba(255,255,255,'+(.5-l*.12)+')';for(let x=0;x<W;x+=6)c.fillRect(x,SEA-21+l*30+wave(x*(1+l*.3))*(1-l*.25),4,1.2);}
  for(const o of ob){const oy=SEA+o.l+wave(o.x);if(o.k==='rock'){X.poly([[o.x-10,oy+4],[o.x-5,oy-10],[o.x+6,oy-8],[o.x+10,oy+4]],X.lg(o.x-10,0,o.x+10,0,['#8a8a92','#4a4a52']));X.ell(o.x,oy+3,12,2.4,'rgba(255,255,255,.6)');}else{X.rr(o.x-4,oy-10,8,12,3,'#ff6a2a');X.rr(o.x-4,oy-6,8,2,0,'#fff');X.rr(o.x-1,oy-16,2,6,0,'#3a3a3a');}}
  const kx=150,ky=40+Math.sin(A.t*.03)*8;X.stroke([[90,y-20],[kx-20,ky+8]],'rgba(255,255,255,.7)',.6);X.stroke([[90,y-20],[kx+20,ky+8]],'rgba(255,255,255,.7)',.6);ink(c=>{c.moveTo(kx-30,ky+6);c.quadraticCurveTo(kx,ky-16,kx+30,ky+6);c.quadraticCurveTo(kx,ky-6,kx-30,ky+6);},X.lg(kx-30,0,kx+30,0,['#ff4a8a','#ffd04a','#4ad8ff']),.7);
  if(!(inv&&A.t%6<3)){c.save();c.translate(90,y);c.rotate(air?spin:Math.sin(A.t*.1)*.08);X.rr(-12,-2,24,4,2,X.lg(-12,0,12,0,['#ffd04a','#ff6a2a']));hero(0,-1,{s:.95,top:'#2a2a3a',bot:'#2a8ac8',style:2,hair:'#e8c060',skin:'#c68a5e',seed:180,bob:0,arm:-2.4,mood:air?'o':'happy'});c.restore();if(!air&&lo())for(let k=0;k<4;k++){c.globalAlpha=.5-k*.12;X.disc(76-k*6,y+1,2+k,'#ffffff');}c.globalAlpha=1;}
  fx.draw();X.bar((dist/10|0)+' M',String(g.score),'','#7ae8ff','#ffe27a');hearts(lives,140);};
 return g;}});

/* ================= SPICE TRADER ================= */
A.add({id:'spicetrade',name:'SPICE TRADER',cat:'CARDS',tags:'market trade buy sell prices',how:'LEFT/RIGHT PICK A SPICE. UP BUYS, DOWN SELLS. PRICES SWING DAILY. END WITH MOST COINS.',make(){
 const g={over:null,score:0},fx=X.fx(),SP=[{n:'SAFFRON',c:'#ffb030',b:40},{n:'PEPPER',c:'#3a3a3a',b:12},{n:'CINNAMON',c:'#a8603a',b:18},{n:'CHILLI',c:'#e83a2a',b:9},{n:'CLOVE',c:'#6a3a2a',b:24}];
 let sel=0,coins=100,inv=[0,0,0,0,0],price=SP.map(s=>s.b),hist=SP.map(s=>[s.b]),day=1,t=0,news='',nt=0,last=[];
 g.update=()=>{t++;if(nt)nt--;const h=A.hit(0);if(h.l)sel=(sel+4)%5;if(h.r)sel=(sel+1)%5;
  if(h.u&&coins>=price[sel]){coins-=price[sel];inv[sel]++;S('blip');fx.pop(60+sel*50,160,'-'+price[sel],'#ff8a7a');}if(h.d&&inv[sel]>0){coins+=price[sel];inv[sel]--;S('coin');fx.pop(60+sel*50,160,'+'+price[sel],'#7dff9a');}
  if(t%240===0){day++;let ev=-1;if(Math.random()<.4){ev=ri(5);const up=Math.random()<.5;news=SP[ev].n+(up?' SHIPS SANK - PRICES UP':' CARAVAN ARRIVED - PRICES DOWN');nt=150;price[ev]=Math.max(2,Math.round(price[ev]*(up?1.6:.55)));}
   for(let i=0;i<5;i++){if(i!==ev)price[i]=Math.max(2,Math.round(price[i]+(SP[i].b-price[i])*.25+(rnd(2)-1)*SP[i].b*.18));hist[i].push(price[i]);if(hist[i].length>12)hist[i].shift();}S('hit');}
  g.score=coins+inv.reduce((a,v,i)=>a+v*price[i],0);if(g.score<=0&&coins<2)g.over='BANKRUPT';};
 g.draw=()=>{const c=A.c;X.cache('vy_bazaar',()=>{X.sky(['#e8a060','#f8c890','#fff0d0'],80);for(let i=0;i<6;i++){const x=i*56;X.rr(x,30,54,50,1,'#d8b888');X.poly([[x,30],[x+27,14],[x+54,30]],'#c8a070');X.rr(x+20,50,14,30,6,'#5a3a24');}
   X.vg(0,80,W,160,['#c89a6a','#a87a4a','#7a5432']);for(let i=0;i<10;i++)X.poly([[i*32,82],[i*32+32,82],[i*32+32,94],[i*32+16,98],[i*32,94]],i%2?'#f4ead4':'#c83a3a');});
  hero(30,186,{s:1.2,d:1,top:'#4a3a8a',bot:'#2a2a3a',hat:'hood',hatC:'#c8a040',style:0,skin:'#c68a5e',seed:190,bob:0,arm:-1,mood:'happy'});
  for(let i=0;i<5;i++){const x=60+i*50,s=SP[i],on=i===sel;X.rr(x,104,44,74,4,on?'rgba(255,230,140,.35)':'rgba(0,0,0,.25)');X.rrs(x,104,44,74,4,on?'#ffe27a':'rgba(255,255,255,.2)',1);X.ell(x+22,126,16,7,'#8a5a30');X.ell(x+22,123,14,6,s.c);for(let k=0;k<6;k++)X.disc(x+12+k*4,121+(k%2),1.4,X.lt(s.c,1.3));
   const hs=hist[i],mx=Math.max(...hs),mn=Math.min(...hs);c.strokeStyle=hs[hs.length-1]>=hs[0]?'#7dff9a':'#ff8a7a';c.lineWidth=1;c.beginPath();hs.forEach((v,j)=>{const px=x+4+j*3.2,py=150-(v-mn)/Math.max(1,mx-mn)*12;j?c.lineTo(px,py):c.moveTo(px,py);});c.stroke();
   T(s.n.slice(0,6),x+22,108,'#fff0d0',1,'c');T(String(price[i]),x+22,156,'#ffe27a',1,'c');T('X'+inv[i],x+22,168,'#ffffff',1,'c');}
  X.rr(60,186,250,20,3,'rgba(0,0,0,.35)');T('UP BUY  DOWN SELL',185,193,'#fff0d0',1,'c');if(nt){X.panel(40,214,240,20,'#ffe27a');T(news.slice(0,38),160,220,'#ffe27a',1,'c');}
  fx.draw();X.bar('COINS '+coins,'DAY '+day,'WORTH '+g.score,'#ffe27a','#fff0d0');};
 return g;}});

/* ================= MUSEUM GUARD ================= */
A.add({id:'museumguard',name:'MUSEUM GUARD',cat:'ACTION',tags:'museum night thieves flashlight',how:'PATROL THE HALL. SHINE YOUR TORCH ON A THIEF AND PRESS A TO CATCH THEM. KEEP THE ART SAFE.',make(){
 const g={over:null,score:0},fx=X.fx();let p={x:160,y:160,d:1,st:0,a:0},th=[],art=[1,1,1,1,1],t=0,caught=0,lost=0;
 const AX=[40,100,160,220,280];
 g.update=()=>{t++;const k=A.in(0),dx=ax(k),dy=ay(k);if(dx||dy){p.a=Math.atan2(dy,dx);if(dx)p.d=dx;}p.x=cl(p.x+dx*1.6,10,W-10);p.y=cl(p.y+dy*1.6,100,H-10);if(dx||dy)p.st+=.3;
  if(t%Math.max(90,220-t/30|0)===0){const i=ri(5);if(art[i])th.push({x:Math.random()<.5?-10:W+10,y:110+rnd(110),tg:i,has:0,seen:0});}
  for(const q of th){const tx=q.has?(q.x<160?-20:W+20):AX[q.tg],ty=q.has?q.y:96;const d=hyp(tx-q.x,ty-q.y)||1,sp=q.seen?.4:.9;q.x+=(tx-q.x)/d*sp;q.y+=(ty-q.y)/d*sp;if(!q.has&&d<4&&art[q.tg]){q.has=1;art[q.tg]=0;S('lose');fx.pop(AX[q.tg],70,'STOLEN!','#ff6a5a');}
   const ex=q.x-p.x,ey=q.y-p.y,dd=hyp(ex,ey);let da=Math.atan2(ey,ex)-p.a;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;q.seen=dd<110&&Math.abs(da)<.45;
   if(q.seen&&A.hit(0).a&&dd<60){q.done=1;caught++;g.score+=q.has?40:25;if(q.has){art[q.tg]=1;fx.pop(AX[q.tg],70,'RECOVERED','#7dff9a');}S('coin');fx.pop(q.x,q.y-30,'GOTCHA!','#ffe27a');}
   if(q.has&&(q.x<-15||q.x>W+15)){q.done=1;lost++;if(lost>=3)g.over='THE GALLERY WAS EMPTIED';}}th=th.filter(q=>!q.done);for(let i=0;i<5;i++)if(!art[i]&&!th.some(q=>q.tg===i&&q.has)&&t%600===0)art[i]=1;};
 g.draw=()=>{const c=A.c;X.cache('vy_museum',()=>{X.vg(0,0,W,100,['#4a3a5a','#3a2e4a']);for(let i=0;i<9;i++)X.rr(i*36,0,4,100,0,'#2a2238');X.vg(0,100,W,140,['#5a4a3a','#4a3a2a']);for(let y=100;y<H;y+=14)for(let x=(y/14%2)*20;x<W;x+=40){c.fillStyle='rgba(255,255,255,.04)';c.fillRect(x,y,20,14);}X.rr(0,98,W,4,0,'#8a6a4a');
   for(let i=0;i<5;i++){X.rr(AX[i]-18,30,36,44,2,'#c8a040');X.rr(AX[i]-15,33,30,38,1,'#1a1a24');}});
  for(let i=0;i<5;i++){const x=AX[i];if(art[i]){const pal=[['#3a6ab8','#ffd04a'],['#c83a3a','#f4ead4'],['#4a9a4a','#ffd8a0'],['#8a4ad8','#ff8ad8'],['#e8a040','#3a3a8a']][i];X.rr(x-15,33,30,38,1,pal[0]);if(i===0){X.disc(x,48,8,pal[1]);}else if(i===1){K.hero(x,70,{s:1,top:'#2a2a3a',bot:'#2a2a3a',style:2,seed:200,bob:0,mood:'happy'});}else if(i===2){X.hills(70,6,pal[1],x,.2,1);X.poly([[x-12,70],[x-4,50],[x+4,60],[x+12,70]],'#2a6a3a');}else if(i===3){for(let k=0;k<4;k++)X.disc(x-8+k*5,44+k*6,4,pal[1]);}else{X.poly([[x-10,66],[x,40],[x+10,66]],pal[1]);}}else{T('?',x,48,'#5a5a6a',2,'c');}X.rr(x-10,76,20,5,1,'#e8dcc8');}
  for(const q of th){K.hero(q.x,q.y,{s:1,d:q.x<160?1:-1,st:A.t*.3,top:'#1a1a24',bot:'#1a1a24',hat:'beanie',hatC:'#1a1a24',style:0,skin:'#c8a088',seed:210,mood:q.seen?'o':'happy',hold:q.has?(c=>{X.rr(-5,-4,10,8,1,'#c8a040');}):null});}
  // darkness with the torch cone cut out
  c.save();c.fillStyle='rgba(6,6,16,.82)';c.beginPath();c.rect(0,0,W,H);const L=120,a=p.a;c.moveTo(p.x,p.y-14);c.arc(p.x,p.y-14,L,a+.45,a-.45,true);c.closePath();c.fill('evenodd');c.restore();
  if(lo()){c.save();c.globalCompositeOperation='lighter';X.poly([[p.x,p.y-14],[p.x+Math.cos(a-.45)*L,p.y-14+Math.sin(a-.45)*L],[p.x+Math.cos(a+.45)*L,p.y-14+Math.sin(a+.45)*L]],X.rg(p.x,p.y-14,2,p.x,p.y-14,L,['rgba(255,240,180,.25)','rgba(255,240,180,0)']));c.restore();}
  for(let i=0;i<5;i++)if(art[i]&&lo()){X.glow(AX[i],20,10,'#ff4040',.25);X.disc(AX[i],20,1.4,A.t%40<20?'#ff4040':'#5a1010');}
  K.hero(p.x,p.y,{s:1.05,d:p.d,st:p.st,top:'#2a3a6a',bot:'#1a1a2a',hat:'cap',hatC:'#1a2a5a',style:0,seed:220,arm:-1.2,hold:c=>{X.rr(-1.5,-1,3,6,1,'#3a3a3a');X.disc(0,-1,2,'#fff8d0');}});
  fx.draw();X.bar('CAUGHT '+caught,String(g.score),'LOST '+lost+'/3','#ffe27a','#ffe27a');};
 return g;}});

/*NEXT*/
})();
