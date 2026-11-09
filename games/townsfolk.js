/* PIXEL ARCADE - townsfolk pack (round 30): twenty cabinets about the people who keep a town running - bakers, smiths,
   lamplighters, potters, firefighters, sweeps and bell ringers - drawn with the frontier pack's character kit (A.kit). */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off';
const ax=k=>(k.r?1:0)-(k.l?1:0),ay=k=>(k.d?1:0)-(k.u?1:0),TAU=Math.PI*2,hyp=Math.hypot;
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const K=A.kit,{hero,critter,tree,pine,cottage,cloud,ink}=K;
const T=(s,x,y,col,sc,al)=>X.ot(s,x,y,col,sc||1,al);
const hearts=(n,x)=>{for(let i=0;i<3;i++)X.heart(x+i*12,8,1,i<n?'#ff4f6d':'rgba(255,255,255,.2)');};
const LOOKS=[['#c84a3a','#2a2a3a','cap','#2a6ac8',0],['#3a8ad8','#2a2a3a','straw','#c84a3a',2],['#f0b040','#3a3a5a','beanie','#c83a8a',1],['#4aa86a','#3a2a2a',null,null,3],['#8a4ad8','#2a2a3a','hood','#5a2a8a',4],['#e86a8a','#2a3a5a',null,null,2]];
const SKIN=['#f2c29a','#c68a5e','#8a5a3a','#f6d2b8'];
const brick=(x,y,w,h,col)=>{const c=A.c;X.rr(x,y,w,h,0,col);c.fillStyle='rgba(0,0,0,.16)';for(let r=0;r*8<h;r++){c.fillRect(x,y+r*8,w,1);const hh=Math.min(8,h-r*8);for(let q=(r%2)*8;q<w;q+=16)c.fillRect(x+q,y+r*8,1,hh);}};
const shaft=(x,y,w,h,a)=>{const c=A.c;c.globalAlpha=a;X.poly([[x,y],[x+w,y],[x+w+h*.5,y+h],[x+h*.5,y+h]],'#fff4d0');c.globalAlpha=1;};
const rep=(i,k,n)=>{const h=A.hit(i),q=A.in(i);if(h[k]){n.c=0;return true;}if(q[k]){n.c=(n.c||0)+1;return n.c>14&&n.c%5===0;}return false;};

/* ================= BAKER'S DOZEN ================= */
const ING=[{n:'FLOUR',c:'#f4ecdc'},{n:'EGG',c:'#ffe7b0'},{n:'BUTTER',c:'#ffd84a'},{n:'SUGAR',c:'#ffffff'},{n:'BERRY',c:'#d83a6a'}];
const ingr=(k,x,y)=>{if(k===0){ink(c=>{c.moveTo(x-6,y+6);c.lineTo(x-5,y-5);c.lineTo(x+5,y-5);c.lineTo(x+6,y+6);c.closePath();},X.lg(x-6,0,x+6,0,['#f8f0e0','#d8c8a8']),.6);X.rr(x-5,y-1,10,3,0,'#c84a3a');}
 else if(k===1)ink(c=>c.ellipse(x,y,4.6,6,0,0,TAU),X.lg(x-4,y-6,x+4,y+6,['#fffaf0','#e8c890']),.6);
 else if(k===2){ink(c=>c.rect(x-7,y-3,14,7),X.lg(0,y-3,0,y+4,['#fff0a0','#f0c030']),.6);X.rr(x-7,y-3,14,2,0,'#ffffff');}
 else if(k===3){ink(c=>c.rect(x-5,y-6,10,12),'#f8f8ff',.6);X.rr(x-5,y-6,10,4,0,'#4a8ad8');}
 else{for(const[a,b]of[[-3,1],[3,1],[0,-3]])ink(c=>c.arc(x+a,y+b,3.2,0,TAU),X.lg(0,y-6,0,y+4,['#ff6a9a','#b82a5a']),.5);X.rr(x-1,y-9,2,4,1,'#3a8a3a');}};
A.add({id:'bakery',name:"BAKER'S DOZEN",cat:'CLASSICS',tags:'baking cake catch recipe kitchen',how:'LEFT/RIGHT MOVE THE BOWL. CATCH THE NEXT INGREDIENT ON THE RECIPE CARD. BAKE 12 CAKES.',make(){
 const g={over:null,score:0},fx=X.fx(),BY=196;let x=160,f=[],t=0,lives=3,rec=[],step=0,cakes=0,st=0,oven=0;
 const newRec=()=>{rec=[0,1,2,3,4].sort(()=>Math.random()-.5).slice(0,4);step=0;};newRec();
 g.update=()=>{t++;if(oven)oven--;const k=A.in(0),dx=ax(k);x=cl(x+dx*3.2,24,W-24);if(dx)st+=.4;
  if(t%Math.max(24,52-cakes*2)===0){const k2=Math.random()<.45?rec[step]:ri(5);f.push({k:k2,x:20+rnd(W-40),y:24,v:1+rnd(.6)+cakes*.06});}
  for(const o of f){o.y+=o.v;if(!o.done&&o.y>BY-14&&o.y<BY&&Math.abs(o.x-x)<18){o.done=1;if(o.k===rec[step]){step++;g.score+=5;S('blip');fx.pop(x,BY-30,ING[o.k].n,'#ffe27a');fx.spark(x,BY-6,ING[o.k].c,6,1.5);
     if(step>=4){cakes++;g.score+=50;oven=70;S('win');fx.pop(x,BY-46,'CAKE '+cakes+'! +50','#7dff9a');if(cakes>=12){g.over="A BAKER'S DOZEN!";return;}newRec();}}
    else{lives--;S('hit');A.shake=4;fx.debris(x,BY-6,ING[o.k].c,10,2);fx.pop(x,BY-30,'WRONG!','#ff6a5a');if(lives<=0){g.over='TOO MUCH MESS';return;}}}}
  f=f.filter(o=>!o.done&&o.y<H+10);};
 g.draw=()=>{const c=A.c;X.cache('tf_bakery',()=>{X.vg(0,0,W,H,['#f6dcb4','#ecc898','#dcae80']);c.fillStyle='rgba(255,255,255,.18)';for(let i=0;i<W;i+=16)for(let j=96;j<170;j+=16)c.fillRect(i+1,j+1,14,14);
   X.rr(18,26,70,52,3,'#8a5a3a');X.vg(22,30,62,44,['#8ac8f0','#c8e8f8']);cloud(44,48,.7);X.rr(52,30,2,44,0,'#8a5a3a');X.rr(22,51,62,2,0,'#8a5a3a');
   for(const sy of[52,82]){X.rr(112,sy,96,4,1,'#7a4a2a');for(let i=0;i<5;i++){const lx=118+i*18;ink(c=>c.ellipse(lx,sy-5,8,5,0,Math.PI,0),X.lg(0,sy-10,0,sy,['#e8a858','#a8642a']),.6);c.strokeStyle='rgba(255,240,200,.6)';c.lineWidth=1;c.beginPath();c.moveTo(lx-3,sy-8);c.lineTo(lx-1,sy-5);c.moveTo(lx+1,sy-9);c.lineTo(lx+3,sy-6);c.stroke();}}
   brick(230,40,80,130,'#b8644a');X.rr(226,34,88,10,2,'#8a4a3a');ink(c=>{c.moveTo(246,170);c.lineTo(246,110);c.arc(270,110,24,Math.PI,0);c.lineTo(294,170);c.closePath();},'#2a1410',1);
   X.vg(0,170,W,70,['#a8744a','#8a5a3a','#6a4028']);X.rr(0,170,W,4,0,'#c8946a');});
  const gl=.45+Math.sin(A.t*.15)*.08+(oven?.35:0);if(lo())X.glow(270,150,40,'#ff9a3a',gl);for(let i=0;i<5;i++)X.disc(254+i*8,166-Math.abs(Math.sin(A.t*.2+i))*5,4,i%2?'#ffb040':'#ff6a20');
  if(oven){c.globalAlpha=Math.min(1,oven/20);ink(c=>{c.rect(254,128,32,14);},X.lg(0,128,0,142,['#fff0f8','#f8b8d0']),.6);X.rr(254,124,32,5,2,'#ff6a9a');c.globalAlpha=1;}
  for(const o of f){X.shadow(o.x,BY+8,4,1.5,.2);ingr(o.k,o.x,o.y);}
  hero(x,230,{s:1.15,st,top:'#f4f4f8',bot:'#4a4a6a',hat:'chef',apron:'#ffffff',style:1,hair:'#6a3a1a',seed:7,arm:-1.2,skin:'#e8b088',mood:step?'happy':undefined});
  ink(c=>{c.moveTo(x-17,BY-4);c.quadraticCurveTo(x,BY+14,x+17,BY-4);c.closePath();},X.lg(x-17,0,x+17,0,['#9ac8e8','#e8f4ff','#6a98c8']),.8);X.ell(x,BY-4,17,3,'#c8a070');for(let i=0;i<step;i++)X.disc(x-8+i*5,BY-5,2.4,ING[rec[i]].c);
  X.panel(214,18,100,38,'#ffd84a');T('RECIPE',264,22,'#5a3a1a',1,'c');for(let i=0;i<4;i++){ingr(rec[i],232+i*22,42);if(i<step)X.stroke([[226+i*22,42],[230+i*22,47],[238+i*22,36]],'#2aa84a',2);else if(i===step)X.rr(222+i*22,30,20,22,3,'rgba(255,90,90,.25)');}
  fx.draw();X.bar('CAKES '+cakes+'/12',String(g.score),'','#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= BLACKSMITH ================= */
const HOT=['#5a5a64','#7a3a2a','#c83a1a','#ff6a1a','#ffb030','#fff0a0'];
A.add({id:'forge',name:'BLACKSMITH',cat:'SIM',tags:'forge anvil hammer sword metal',how:'HOLD DOWN TO PUMP THE BELLOWS. A HAMMERS IN THE GREEN. B QUENCHES THE BLADE.',make(){
 const g={over:null,score:0},fx=X.fx();let heat=.3,shape=0,crack=0,cd=0,t=0,lives=3,blades=0,pump=0,quench=0,msg='';
 g.update=()=>{t++;if(cd)cd--;if(quench)quench--;const k=A.in(0),h=A.hit(0);heat=Math.max(0,heat-.0035-blades*.0003);if(k.d){heat=Math.min(1,heat+.014);pump++;if(t%8===0)fx.spark(52,150,'#ffb040',2,1.2);}
  if(h.a&&!cd&&!quench){cd=14;if(heat>=.55&&heat<=.86){shape++;g.score+=5;S('hit');A.shake=2;fx.spark(160,170,'#ffe080',14,2.6);fx.ring(160,172,'#ffd060',14,12);}else if(heat>.86){S('blip');fx.pop(160,140,'TOO HOT - WARPED','#ff8a5a');shape=Math.max(0,shape-1);}else{crack++;S('lose');A.shake=4;fx.pop(160,140,'TOO COLD - CRACK!','#8ac8ff');fx.debris(160,170,'#8a8a94',6,1.6);if(crack>=3){lives--;crack=0;shape=0;fx.pop(160,124,'BLADE RUINED','#ff5a4a');if(lives<=0){g.over='OUT OF STEEL';return;}}}}
  if(h.b&&shape>=10&&!quench){quench=60;blades++;const q=100-crack*25;g.score+=q;msg='BLADE '+blades+'  +'+q;S('win');fx.pop(262,120,'HISSS! +'+q,'#7dff9a');shape=0;crack=0;heat=.25;}};
 g.draw=()=>{const c=A.c;X.cache('tf_forge',()=>{X.vg(0,0,W,H,['#2a1e1c','#3a2a24','#1a1210']);brick(0,30,110,150,'#4a3a34');X.poly([[10,30],[100,30],[86,0],[24,0]],'#3a2e2a');
   X.rr(14,128,86,56,4,X.lg(0,128,0,184,['#6a5a54','#3a2e2a']));X.rr(26,136,62,18,8,'#1a0a06');for(let i=0;i<6;i++)X.rr(124+i*12,40,3,30+(i%3)*8,1,'#7a6a64');X.rr(118,38,80,4,1,'#5a3a24');
   for(const[x,y]of[[130,74],[154,80],[178,72]])X.disc(x,y,4,'#8a8a94');X.rr(242,150,40,40,4,X.lg(242,0,282,0,['#6a4a2a','#8a6a3a','#5a3a1a']));X.rr(240,154,44,3,1,'#3a3a40');X.rr(240,180,44,3,1,'#3a3a40');X.ell(262,151,18,4,'#1a2a3a');
   X.vg(0,184,W,56,['#4a3a30','#2a1e18']);for(let i=0;i<30;i++)X.disc(hash(i,1)*W,190+hash(i,2)*48,1+hash(i,3)*2,'rgba(0,0,0,.25)');
   ink(c=>{c.moveTo(130,176);c.lineTo(190,176);c.quadraticCurveTo(200,172,206,166);c.lineTo(186,166);c.lineTo(182,160);c.lineTo(138,160);c.lineTo(130,166);c.closePath();},X.lg(0,160,0,176,['#7a7a84','#3a3a44']));X.rr(146,176,28,26,2,'#2a2a30');X.rr(138,200,44,6,2,'#3a3a44');});
  const fl=.5+heat*.5+Math.sin(A.t*.3)*.06;if(lo()){X.glow(57,146,60,'#ff6a1a',fl*.7);X.glow(160,168,30+heat*30,HOT[Math.min(5,heat*6|0)],heat*.5);}for(let i=0;i<7;i++)X.disc(32+i*8,150-Math.abs(Math.sin(A.t*.25+i*1.3))*(3+heat*6),4,i%2?'#ffb040':'#ff5a1a');
  const bc=HOT[Math.min(5,heat*6|0)],len=40+shape*3;ink(c=>{c.moveTo(160-len/2,153);c.lineTo(160+len/2-6,153);c.lineTo(160+len/2,156);c.lineTo(160+len/2-6,159);c.lineTo(160-len/2,159);c.closePath();},bc,.8);X.rr(160-len/2-12,152,12,8,2,'#4a2a1a');X.rr(160-len/2,154,len-6,1,0,'rgba(255,255,255,.35)');
  for(let i=0;i<crack;i++)X.stroke([[150+i*8,153],[153+i*8,156],[150+i*8,159]],'#1a1a2a',1);
  const up=cd>7;hero(206,206,{s:1.25,top:'#8a3a2a',bot:'#3a2a20',apron:'#5a3a24',style:3,hair:'#2a1a10',seed:21,skin:'#c68a5e',arm:up?-2.6:-1.1,d:-1,hold:c=>{X.rr(-1,-2,2,12,1,'#7a5434');X.rr(-5,-4,10,5,1,'#5a5a64');}});
  if(quench){c.globalAlpha=quench/60;for(let i=0;i<6;i++)cloud(250+Math.sin(i+A.t*.1)*8,140-i*8-(60-quench)*.6,.6+i*.08,'rgba(230,230,240,.7)');c.globalAlpha=1;}
  X.rr(40,214,240,10,3,'#1a1414');X.rr(40+240*.55,214,240*.31,10,0,'rgba(80,220,120,.45)');X.rr(40,214,240*heat,10,3,X.lg(40,0,280,0,['#5a5a64','#c83a1a','#ffb030','#fff0a0']));X.rr(38+240*heat,211,4,16,1,'#ffffff');
  for(let i=0;i<10;i++)X.rr(100+i*12,228,9,6,1,i<shape?'#ffd84a':'rgba(255,255,255,.18)');if(shape>=10)T('PRESS B TO QUENCH',160,140,'#7ae8ff',1,'c');
  fx.draw();X.bar('BLADES '+blades,String(g.score),'HEAT','#ffe27a','#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= LAMPLIGHTER ================= */
A.add({id:'lamplighter',name:'LAMPLIGHTER',cat:'ACTION',tags:'street lamps night town lighting',how:'LEFT/RIGHT WALK THE STREET. A UNDER A DARK LAMP CLIMBS AND LIGHTS IT. KEEP THE TOWN LIT.',make(){
 const g={over:null,score:0},fx=X.fx(),LX=[30,82,134,186,238,290];let x=160,st=0,d=1,lit=LX.map(()=>1),busy=0,bi=-1,t=0,dark=0,moth=[];
 g.update=()=>{t++;const k=A.in(0),dx=ax(k);if(busy){busy--;if(busy===0&&bi>=0){lit[bi]=1;g.score+=10;S('coin');fx.pop(LX[bi],70,'+10','#ffe27a');fx.spark(LX[bi],92,'#ffe080',10,1.6);bi=-1;}}else{if(dx)d=dx;x=cl(x+dx*1.9,10,W-10);if(dx)st+=.4;
   if(A.hit(0).a){const i=LX.findIndex(l=>Math.abs(l-x)<12);if(i>=0&&!lit[i]){busy=26;bi=i;x=LX[i];S('blip');}}}
  for(let i=0;i<6;i++)if(lit[i]&&i!==bi&&Math.random()<.0018+t/2.5e5){lit[i]=0;S('hit');fx.pop(LX[i],80,'PUFF','#c8c8d8');}
  const un=lit.filter(v=>!v).length;dark=cl(dark+(un>=3?.0018*un:-.004),0,1);if(dark>=1){g.over='THE TOWN WENT DARK';S('lose');}if(t%20===0)g.score+=6-un;};
 g.draw=()=>{const c=A.c,ev=Math.min(1,t/1800);X.cache('tf_lamp',()=>{X.sky(['#1a1a4a','#5a3a7a','#e8786a'],150);X.stars(50,7,0,0,90,.7);
   for(let i=0;i<7;i++){const bx=i*48-6,bh=70+hash(i,3)*30,col=['#5a4a6a','#4a4a6a','#6a4a5a'][i%3];X.rr(bx,166-bh,46,bh,1,X.lg(bx,0,bx+46,0,[X.lt(col,1.15),col,X.lt(col,.8)]));X.poly([[bx-2,166-bh],[bx+23,150-bh],[bx+48,166-bh]],'#3a2a3a');X.rr(bx+30,150-bh,6,12,0,'#4a3a3a');
    for(let r=0;r<3;r++)for(let q=0;q<2;q++)X.rr(bx+8+q*20,174-bh+r*22,10,13,1,hash(i*7+q,r)<.5?'#ffd880':'#2a2a3a');X.rr(bx+18,146,10,20,1,'#3a2418');}
   X.vg(0,166,W,74,['#5a5a6a','#4a4a5a','#3a3a48']);for(let r=0;r<6;r++)for(let q=0;q<22;q++)X.ell(q*16+(r%2)*8,172+r*11,7,4,'rgba(255,255,255,.06)');X.rr(0,164,W,4,0,'#7a7a8a');});
  c.fillStyle='rgba(8,8,30,'+(ev*.35+dark*.45)+')';c.fillRect(0,0,W,H);
  for(let i=0;i<6;i++){const lx=LX[i];if(lit[i]&&lo()){X.glow(lx,84,46,'#ffcc66',.5);c.globalAlpha=.18;X.poly([[lx-6,90],[lx+6,90],[lx+26,166],[lx-26,166]],'#ffe0a0');c.globalAlpha=1;}
   X.rr(lx-2,88,4,78,1,'#2a2a34');X.rr(lx-5,162,10,4,1,'#2a2a34');ink(c=>{c.moveTo(lx-7,78);c.lineTo(lx+7,78);c.lineTo(lx+5,92);c.lineTo(lx-5,92);c.closePath();},lit[i]?'#ffe6a0':'#3a3a4a',.8);X.poly([[lx-9,78],[lx,70],[lx+9,78]],'#2a2a34');if(lit[i])X.disc(lx,85,2.4+Math.sin(A.t*.3+i)*.5,'#ffffff');}
  if(busy&&bi>=0){const lx=LX[bi];X.stroke([[lx-10,166],[lx-4,96]],'#8a6a3a',2);X.stroke([[lx+6,166],[lx+8,96]],'#8a6a3a',2);for(let r=0;r<6;r++)X.stroke([[lx-9+r,158-r*11],[lx+7,158-r*11]],'#8a6a3a',1.5);hero(lx,166-(26-busy)*2.3,{s:1,top:'#2a3a6a',bot:'#2a2a3a',hat:'cap',hatC:'#1a1a2a',style:3,seed:31,arm:-2.6,hold:c=>{X.rr(-1,-14,2,16,0,'#8a6a3a');X.disc(0,-15,2,'#ffb040');}});}
  else hero(x,212,{s:1.1,st,d,top:'#2a3a6a',bot:'#2a2a3a',hat:'cap',hatC:'#1a1a2a',style:3,seed:31,hold:c=>{X.rr(-1,-18,2,20,0,'#8a6a3a');X.disc(0,-19,2,'#ffb040');if(lo())X.glow(0,-19,8,'#ffb040',.6);}});
  fx.draw();X.bar('LIT '+lit.filter(v=>v).length+'/6',String(g.score),'DARK','#ffe27a','#ffe27a');X.meter(130,7,60,5,dark,dark>.6?'#ff5a4a':'#8a7aff');};
 return g;}});

/* ================= POTTER'S WHEEL ================= */
A.add({id:'potter',name:"POTTER'S WHEEL",cat:'PUZZLE',tags:'clay pottery vase shape craft',how:'UP/DOWN PICK A ROW OF CLAY, LEFT/RIGHT SHAPE IT TO THE GHOST LINE. A FIRES THE VASE.',make(){
 const g={over:null,score:0},fx=X.fx(),N=8,BY=200,RH=13,CX=160;let w=[],tw=[],sel=4,t=0,vases=0,done=[],kiln=0,nl={},nr={};
 const newPot=()=>{const a=4+rnd(9),b=rnd(7),p=rnd(TAU);tw=[];for(let i=0;i<N;i++)tw.push(Math.round(cl(16+a*Math.sin(i/(N-1)*Math.PI)+b*Math.sin(i/(N-1)*TAU+p),6,34)/2)*2);w=tw.map(()=>20);};newPot();
 g.update=()=>{t++;if(kiln)kiln--;const h=A.hit(0);if(h.u)sel=Math.min(N-1,sel+1);if(h.d)sel=Math.max(0,sel-1);
  if(rep(0,'l',nl)){w[sel]=Math.max(4,w[sel]-2);S('blip');fx.debris(CX-w[sel],BY-sel*RH-6,'#c8784a',3,1);}if(rep(0,'r',nr)){w[sel]=Math.min(36,w[sel]+2);S('blip');}
  if(h.a&&!kiln){let e=0;for(let i=0;i<N;i++)e+=Math.abs(w[i]-tw[i]);const pts=Math.max(0,100-e*3);g.score+=pts;vases++;kiln=50;done.push({w:w.slice(),c:['#3a8ad8','#2aa88a','#d84a6a','#e8b030','#8a5ad8'][vases%5]});if(done.length>5)done.shift();S(pts>70?'win':'coin');fx.pop(CX,70,(pts>85?'MASTERPIECE ':pts>60?'LOVELY ':'LUMPY ')+'+'+pts,pts>60?'#7dff9a':'#ffb07a');newPot();}};
 const vase=(cx,by,ws,rh,fill,line)=>{ink(c=>{c.moveTo(cx-ws[0],by);for(let i=1;i<ws.length;i++)c.lineTo(cx-ws[i],by-i*rh);c.lineTo(cx-ws[ws.length-1]-2,by-ws.length*rh+2);c.lineTo(cx+ws[ws.length-1]+2,by-ws.length*rh+2);for(let i=ws.length-1;i>=0;i--)c.lineTo(cx+ws[i],by-i*rh);c.closePath();},fill,line);};
 g.draw=()=>{const c=A.c;X.cache('tf_pot',()=>{X.vg(0,0,W,H,['#e8d4bc','#d8bea0','#c8a684']);X.rr(220,24,80,90,3,'#6a4a2a');X.vg(224,28,72,82,['#a8d8f0','#e8f4f8']);tree(250,110,14,'#5aa84a');X.rr(258,24,2,90,0,'#6a4a2a');
   shaft(220,26,30,180,.12);X.rr(10,60,70,4,1,'#7a5434');X.rr(10,120,70,4,1,'#7a5434');for(let i=0;i<3;i++){X.ell(24+i*22,56,7,4,'#b8784a');X.rr(18+i*22,46,12,10,3,['#c8784a','#a85a3a','#d8986a'][i]);}
   X.vg(0,214,W,26,['#8a6a4a','#6a4a30']);X.ell(CX,214,52,8,'#5a5a64');X.ell(CX,210,48,7,X.lg(CX-48,0,CX+48,0,['#8a8a94','#c8c8d0','#6a6a74']));});
  for(let i=0;i<done.length;i++){const d=done[i];vase(30+i*16,116,d.w.map(v=>v*.18),3.2,d.c,.4);}
  ink(c=>c.ellipse(CX,BY+4,40,6,0,0,TAU),X.lg(CX-40,0,CX+40,0,['#6a3a2a','#a85a3a','#5a2a1a']),.6);
  vase(CX,BY,w,RH,X.lg(CX-36,0,CX+36,0,['#7a3a1a','#c87a4a','#f0b080','#d8885a','#7a3a1a']),.8);
  c.strokeStyle='rgba(90,40,20,.35)';c.lineWidth=1;for(let i=0;i<N;i++){const y=BY-i*RH-((A.t*.5)%RH);c.beginPath();c.moveTo(CX-w[i]+1,y);c.lineTo(CX+w[i]-1,y);c.stroke();}
  c.fillStyle='rgba(255,255,255,.25)';for(let i=0;i<N;i++)c.fillRect(CX-w[i]*.55+Math.sin(A.t*.2)*2,BY-i*RH-11,3,10);
  c.setLineDash([3,3]);c.strokeStyle='#ffffff';c.lineWidth=1.2;for(const s of[-1,1]){c.beginPath();for(let i=0;i<N;i++){const px=CX+s*tw[i],py=BY-i*RH;if(i)c.lineTo(px,py);else c.moveTo(px,py);}c.stroke();}c.setLineDash([]);
  const sy=BY-sel*RH-6;X.poly([[CX-w[sel]-14,sy-4],[CX-w[sel]-6,sy],[CX-w[sel]-14,sy+4]],'#ffe27a');X.poly([[CX+w[sel]+14,sy-4],[CX+w[sel]+6,sy],[CX+w[sel]+14,sy+4]],'#ffe27a');
  hero(76,226,{s:1.2,top:'#4a8a6a',bot:'#3a3a5a',apron:'#c8a684',style:2,hair:'#8a3a1a',seed:41,arm:-.9,mood:'happy'});
  if(kiln&&lo())X.glow(CX,140,70,'#ff8a3a',kiln/90);
  fx.draw();X.bar('VASES '+vases,String(g.score),'MATCH THE GHOST','#ffe27a','#ffe27a');};
 return g;}});

/* ================= CLOCK TOWER ================= */
A.add({id:'clocktower',name:'CLOCK TOWER',cat:'PUZZLE',tags:'clock time hands tower',how:'LEFT/RIGHT TURN THE HANDS 5 MINUTES. A RINGS THE BELL WHEN THE CLOCK SHOWS THE ASKED TIME.',make(){
 const g={over:null,score:0},fx=X.fx(),CX=160,CY=118,R=60;let cm=0,tgt=0,left=0,lives=3,t=0,ring=0,solved=0,nl={},nr={};
 const newT=()=>{do tgt=(ri(12)*60+ri(12)*5);while(tgt===cm%720);left=Math.max(260,720-solved*25);};newT();
 const fmt=m=>{const hh=Math.floor(m/60)||12,mm=m%60;return hh+':'+(mm<10?'0':'')+mm;};
 g.update=()=>{t++;if(ring)ring--;if(rep(0,'l',nl)){cm=(cm+715)%720;S('blip');}if(rep(0,'r',nr)){cm=(cm+5)%720;S('blip');}left--;
  if(A.hit(0).a&&!ring){ring=40;if(cm===tgt){solved++;const b=20+Math.round(left/12);g.score+=b;S('win');fx.pop(CX,CY-80,'DONG! +'+b,'#7dff9a');fx.ring(CX,CY,'#ffe27a',R+10,20);newT();}else{lives--;S('lose');A.shake=4;fx.pop(CX,CY-80,'WRONG TIME','#ff6a5a');if(lives<=0){g.over='THE TOWN IS LATE';return;}}}
  if(left<=0){lives--;S('lose');fx.pop(CX,CY-80,'TOO SLOW','#ff6a5a');if(lives<=0){g.over='THE TOWN IS LATE';return;}newT();}};
 g.draw=()=>{const c=A.c;X.cache('tf_clock',()=>{X.sky(['#5a8ad8','#a8c8f0','#f0e0c8'],240);cloud(40,40,1);cloud(270,60,.8);for(let i=0;i<9;i++)cottage(i*38-10,240,30,26+hash(i,1)*16,['#e8d0a8','#d8b090','#c8c0b0'][i%3],['#a84a3a','#5a6a8a'][i%2],0);
   X.rr(80,10,160,230,0,X.lg(80,0,240,0,['#a8988a','#c8b8a8','#8a7a6a']));for(let r=0;r<29;r++)for(let q=0;q<5;q++)X.rr(80+q*32+(r%2)*16,10+r*8,31,7,0,'rgba(0,0,0,'+(.04+hash(q,r)*.06)+')');
   X.rr(74,190,172,8,1,'#8a7a6a');X.rr(140,198,40,42,20,'#3a2a24');});
  X.disc(CX,CY,R+8,'#5a4a3a');X.disc(CX,CY,R+5,'#d8b050');X.disc(CX,CY,R,X.rg(CX-20,CY-20,4,CX,CY,R,['#fffaf0','#f4ead4','#d8c8a8']));
  for(let i=0;i<60;i++){const a=i/60*TAU,r1=i%5?R-4:R-9;c.strokeStyle='#3a2a1a';c.lineWidth=i%5?1:2.2;c.beginPath();c.moveTo(CX+Math.sin(a)*r1,CY-Math.cos(a)*r1);c.lineTo(CX+Math.sin(a)*(R-1),CY-Math.cos(a)*(R-1));c.stroke();}
  for(let i=1;i<=12;i++){const a=i/12*TAU;T(String(i),CX+Math.sin(a)*(R-17),CY-Math.cos(a)*(R-17)-3,'#3a2a1a',1,'c');}
  const ma=cm%60/60*TAU,ha=(cm%720)/720*TAU;const hand=(a,l,wd,col)=>{c.strokeStyle=col;c.lineWidth=wd;c.lineCap='round';c.beginPath();c.moveTo(CX-Math.sin(a)*8,CY+Math.cos(a)*8);c.lineTo(CX+Math.sin(a)*l,CY-Math.cos(a)*l);c.stroke();c.lineCap='butt';};
  hand(ha,R*.52,4.5,'#1a1210');hand(ma,R*.82,3,'#2a1a14');X.disc(CX,CY,4,'#d8b050');
  const sw=ring?Math.sin(ring*.5)*.5*(ring/40):0;c.save();c.translate(CX,CY+R+6);c.rotate(sw);ink(c=>{c.moveTo(-10,0);c.quadraticCurveTo(-10,-14,0,-16);c.quadraticCurveTo(10,-14,10,0);c.lineTo(12,4);c.lineTo(-12,4);c.closePath();},X.lg(-12,0,12,0,['#a8782a','#f0c860','#8a5a1a']),.8);c.restore();
  X.panel(8,24,64,44,'#ffe27a');T('RING AT',40,30,'#5a3a1a',1,'c');T(fmt(tgt),40,44,'#c83a3a',2,'c');X.meter(12,60,56,4,left/720,left<150?'#ff5a4a':'#7dff9a');
  for(let i=0;i<3;i++){const px=258+i*18,py=188+Math.sin(A.t*.1+i)*.5;X.ell(px,py,7,5,'#8a8a9a');X.disc(px+5,py-4,3.5,'#9a9aaa');X.disc(px+6,py-5,.9,'#1a1a1a');X.poly([[px+8,py-4],[px+11,py-3],[px+8,py-2]],'#e8a040');}
  hero(102,190,{s:1,top:'#5a3a6a',bot:'#2a2a3a',hat:'beanie',hatC:'#2a6ac8',style:4,hair:'#e8e0d0',seed:51,arm:ring?-2.4:-.8,mood:ring&&cm===tgt?'happy':undefined});
  fx.draw();X.bar('SET '+fmt(cm),String(g.score),'',"#ffe27a",'#ffe27a');hearts(lives,250);};
 return g;}});

/* ================= FIRE BRIGADE ================= */
A.add({id:'firebrigade',name:'FIRE BRIGADE',cat:'ACTION',tags:'firefighter hose ladder rescue fire',how:'ARROWS MOVE THE LADDER BETWEEN WINDOWS. HOLD A TO SPRAY. B RESCUES A WAVING RESIDENT.',make(){
 const g={over:null,score:0},fx=X.fx(),C=4,R=3,WX=i=>120+(i%C)*46,WY=i=>58+Math.floor(i/C)*48;let f=Array(C*R).fill(0),res=Array(C*R).fill(0),cx=0,cy=2,t=0,lives=3,drops=[],ex=0;
 f[5]=.4;
 g.update=()=>{t++;const h=A.hit(0);if(h.l)cx=Math.max(0,cx-1);if(h.r)cx=Math.min(C-1,cx+1);if(h.u)cy=Math.max(0,cy-1);if(h.d)cy=Math.min(R-1,cy+1);const ci=cy*C+cx;
  if(A.in(0).a){if(t%2===0)drops.push({x:80,y:212,tx:WX(ci)+rnd(16)-8,ty:WY(ci)+rnd(14)-4,k:0});if(f[ci]>0){const was=f[ci];f[ci]=Math.max(0,f[ci]-.022);if(was>0&&f[ci]===0){ex++;g.score+=10;S('coin');fx.pop(WX(ci),WY(ci)-20,'OUT! +10','#7dff9a');}}if(t%6===0)S('blip');}
  if(h.b&&res[ci]){res[ci]=0;g.score+=30;S('win');fx.pop(WX(ci),WY(ci)-26,'SAVED! +30','#ffe27a');fx.spark(WX(ci),WY(ci),'#ffe27a',12,2);}
  for(let i=0;i<C*R;i++){if(f[i]>0)f[i]=Math.min(1,f[i]+.0016+t/4e5);if(f[i]>=1&&Math.random()<.004){const n=[i-1,i+1,i-C,i+C].filter(j=>j>=0&&j<C*R&&(Math.abs(j%C-i%C)<=1))[ri(4)%4];if(n!==undefined&&f[n]===0)f[n]=.15;}
   if(res[i]){res[i]--;if(f[i]>=1){res[i]=0;lives--;S('lose');A.shake=5;fx.pop(WX(i),WY(i)-20,'TOO LATE!','#ff5a4a');if(lives<=0){g.over='THE BUILDING IS LOST';return;}}}}
  if(Math.random()<.008+t/2e5){const i=ri(C*R);if(f[i]===0)f[i]=.12;}if(Math.random()<.004){const i=ri(C*R);if(!res[i]&&f[i]<.8)res[i]=600;}
  if(f.filter(v=>v>=1).length>=7){g.over='THE BUILDING IS LOST';S('lose');}for(const d of drops)d.k+=.08;drops=drops.filter(d=>d.k<1);};
 g.draw=()=>{const c=A.c;X.cache('tf_fire',()=>{X.sky(['#2a1a3a','#6a3a5a','#c8785a'],200);X.skyline(170,'#2a2034',0,4,1);brick(96,28,196,170,'#a8544a');X.rr(92,22,204,8,1,'#6a3a34');
   for(let i=0;i<C*R;i++){X.rr(WX(i)-15,WY(i)-15,30,32,1,'#e8d8c8');X.rr(WX(i)-13,WY(i)-13,26,28,0,'#2a2a3a');X.rr(WX(i)-1,WY(i)-13,2,28,0,'#e8d8c8');X.rr(WX(i)-17,WY(i)+17,34,3,1,'#c8b8a8');}
   X.rr(170,170,36,28,1,'#5a3a2a');X.vg(0,198,W,42,['#4a4a54','#3a3a44']);for(let i=0;i<10;i++)X.rr(i*36,216,18,2,0,'#e8d860');});
  for(let i=0;i<C*R;i++){const v=f[i],x=WX(i),y=WY(i);if(res[i]){hero(x,y+16,{s:.7,top:LOOKS[i%6][0],bot:'#2a2a3a',style:LOOKS[i%6][4],seed:i,arm:-2.6+Math.sin(A.t*.4)*.4,bob:0,mood:'o',skin:SKIN[i%4]});}
   if(v>0){const s=v*(1+Math.sin(A.t*.3+i)*.1);if(lo())X.glow(x,y,20+s*20,'#ff6a1a',.3+v*.3);for(let k=0;k<4;k++){const fx2=x-8+k*5.4,fh=6+s*22*(.7+.3*Math.sin(A.t*.4+k*2+i));ink(c=>{c.moveTo(fx2-4,y+14);c.quadraticCurveTo(fx2-5,y+14-fh*.6,fx2,y+14-fh);c.quadraticCurveTo(fx2+5,y+14-fh*.6,fx2+4,y+14);c.closePath();},X.lg(0,y+14-fh,0,y+14,['#fff4a0','#ffa020','#e83a1a']),0);}
    if(v>.5){c.globalAlpha=(v-.5)*.8;for(let k=0;k<3;k++)X.disc(x+Math.sin(A.t*.05+k)*6,y-20-k*10-((A.t*.6+k*12)%20),6+k*2,'#3a3a44');c.globalAlpha=1;}}}
  const ci=cy*C+cx,tx=WX(ci),ty=WY(ci)+20;c.strokeStyle='#c8c8d0';c.lineWidth=3;c.beginPath();c.moveTo(60,196);c.lineTo(tx-20,ty);c.stroke();c.lineWidth=1.5;for(let k=1;k<12;k++){const q=k/12,x1=60+(tx-20-60)*q,y1=196+(ty-196)*q;c.beginPath();c.moveTo(x1-2,y1-2);c.lineTo(x1+2,y1+2);c.stroke();}
  for(const d of drops){const x=80+(d.tx-80)*d.k,y=212+(d.ty-212)*d.k-Math.sin(d.k*Math.PI)*30;X.disc(x,y,2,'rgba(140,210,255,.85)');}
  hero(tx-20,ty+4,{s:.9,top:'#2a2a34',bot:'#2a2a34',hat:'helm',hatC:'#c83a3a',style:3,seed:61,arm:-1.2,mood:'happy'});
  X.rr(10,180,100,32,5,X.lg(0,180,0,212,['#ff4a3a','#c82a1a']));X.rr(80,170,30,22,3,'#c82a1a');X.rr(84,174,22,10,2,'#8ac8f0');X.rr(10,196,100,3,0,'#ffd84a');for(const wx of[30,94])X.disc(wx,214,8,'#1a1a1a'),X.disc(wx,214,3,'#8a8a94');if(A.t%30<15)X.disc(96,168,3,'#3a8aff');else X.disc(104,168,3,'#ff3a3a');
  c.strokeStyle='#ffe27a';c.lineWidth=1.5;c.strokeRect(tx-17,WY(ci)-17,34,36);
  fx.draw();X.bar('OUT '+ex,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= MILK ROUND ================= */
A.add({id:'milkround',name:'MILK ROUND',cat:'CLASSICS',tags:'milkman delivery throw dawn street',how:'THE MILK FLOAT DRIVES ITSELF. A TOSSES A BOTTLE: LAND IT ON STEPS WITH A LIT LAMP.',make(){
 const g={over:null,score:0},fx=X.fx(),HW=74,SY=172;let x=0,t=0,b=[],bott=14,lives=3,served={},missed={},crate={};
 const wants=k=>k>1&&hash(k,7)<.55;
 g.update=()=>{t++;const v=1.5+t/5000;x+=v;if(A.hit(0).a&&bott>0){bott--;b.push({x:x+96,y:178,vx:1.4+v*.6,vy:-3.6});S('jump');}
  for(const o of b){o.x+=o.vx;o.y+=o.vy;o.vy+=.18;if(!o.done&&o.y>=SY&&o.vy>0){o.done=1;const k=Math.round((o.x-40)/HW),dx=o.x-(k*HW+40);if(Math.abs(dx)<12&&wants(k)&&!served[k]){served[k]=1;g.score+=15;S('coin');fx.pop(o.x-x,SY-20,'+15','#7dff9a');fx.spark(o.x-x,SY-4,'#ffffff',6,1.4);}else{S('hit');fx.debris(o.x-x,SY,'#ffffff',8,1.6);fx.pop(o.x-x,SY-20,'SMASH','#ff8a7a');}}}
  b=b.filter(o=>!o.done);const kb=Math.floor((x-30)/HW);if(wants(kb)&&!served[kb]&&!missed[kb]){missed[kb]=1;lives--;S('lose');fx.pop(20,SY-30,'NO MILK!','#ff5a4a');if(lives<=0){g.over='TOO MANY GRUMPY NEIGHBOURS';return;}}
  const kc=Math.floor((x+96)/(HW*6));if(!crate[kc]&&(x+96)%(HW*6)>HW*3){crate[kc]=1;bott+=6;S('power');fx.pop(96,150,'+6 BOTTLES','#7ae8ff');}if(bott<=0&&!b.length&&t%60===0){g.over='OUT OF MILK';}};
 g.draw=()=>{const c=A.c;X.cache('tf_milk',()=>{X.sky(['#5a6aa8','#e8a8a8','#ffd8a0'],150);X.glow(240,140,80,'#fff0c0',.6);X.disc(240,140,22,'#fff0c8');X.hills(140,14,'#8aa88a',0,.02,3);});
  const o1=x;for(let k=Math.floor(o1/HW)-1;k<Math.floor(o1/HW)+6;k++){const hx=k*HW-o1,col=['#e8c8a8','#c8a8b8','#a8c0d0','#e8d0a0','#c8b098'][Math.floor(hash(k,2)*5)],rf=hash(k,4)<.5?'#7a4a3a':'#4a5a7a';X.rr(hx,72,HW-2,100,0,X.lg(hx,0,hx+HW,0,[X.lt(col,1.1),col,X.lt(col,.85)]));X.poly([[hx-3,72],[hx+HW/2,48],[hx+HW+1,72]],rf);X.rr(hx+HW-20,44,8,14,0,'#8a5a4a');
   const lit=wants(k)&&!served[k];for(const wx of[8,46])X.rr(hx+wx,86,18,20,1,lit&&wx===8?'#ffd880':'#3a4a6a');X.rr(hx+33,128,16,32,2,['#2a5a3a','#6a2a2a','#2a3a6a'][k%3]);X.rr(hx+29,160,24,4,0,'#a8a098');X.rr(hx+27,164,28,8,0,'#c8c0b8');
   if(lit){if(lo())X.glow(hx+40,118,12,'#ffcc66',.7);X.rr(hx+37,114,6,8,1,'#ffe6a0');}if(served[k])for(let q=0;q<2;q++){X.rr(hx+34+q*6,154,4,8,1,'#ffffff');X.rr(hx+34+q*6,152,4,2,0,'#c8c8d0');}}
  X.vg(0,172,W,68,['#8a8a94','#6a6a74','#5a5a64']);X.rr(0,172,W,6,0,'#b8b8c0');for(let i=-1;i<10;i++)X.rr(i*40-(x%40),210,20,2,0,'#e8e8e8');
  for(let kc=Math.floor(x/(HW*6));kc<Math.floor(x/(HW*6))+2;kc++){const cx2=kc*HW*6+HW*3-x+96-96;if(!crate[kc]&&cx2>-20&&cx2<W){X.rr(cx2+90,178,18,12,1,'#4aa86a');for(let q=0;q<3;q++)X.rr(cx2+92+q*5,174,4,6,1,'#ffffff');}}
  for(const o of b){c.save();c.translate(o.x-x,o.y);c.rotate(A.t*.3);X.rr(-2,-5,4,10,1.5,'#ffffff');X.rr(-2,-6,4,2,0,'#3a8ad8');c.restore();}
  const bx=50,by=200,bob=Math.sin(A.t*.3)*.6;X.shadow(bx+30,by+4,36,4,.4);X.rr(bx,by-28+bob,60,24,4,X.lg(0,by-28,0,by-4,['#ffffff','#d8dce8']));X.rr(bx+40,by-40+bob,24,36,4,'#ffffff');X.rr(bx+44,by-36+bob,16,12,2,'#8ac8f0');X.rr(bx,by-12+bob,64,4,0,'#3a8ad8');
  for(let q=0;q<Math.min(6,bott);q++){X.rr(bx+4+q*6,by-36+bob,4,9,1.5,'#ffffff');X.rr(bx+4+q*6,by-37+bob,4,2,0,'#3a8ad8');}
  hero(bx+30,by-10,{s:.9,top:'#ffffff',bot:'#2a3a6a',hat:'cap',hatC:'#3a8ad8',style:0,seed:71,arm:-1.8,mood:'happy',bob:0});
  for(const wx of[bx+12,bx+52]){X.disc(wx,by,7,'#1a1a1a');c.strokeStyle='#8a8a94';c.lineWidth=1.5;c.beginPath();c.moveTo(wx+Math.cos(x*.2)*4,by+Math.sin(x*.2)*4);c.lineTo(wx-Math.cos(x*.2)*4,by-Math.sin(x*.2)*4);c.stroke();}
  fx.draw();X.bar('BOTTLES '+bott,String(g.score),'','#ffffff','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= BOOK SORT ================= */
const BC=[['#d84a4a','RED'],['#3a7ad8','BLUE'],['#3aa86a','GREEN'],['#e8b030','GOLD']];
A.add({id:'booksort',name:'BOOK SORT',cat:'PUZZLE',tags:'library books shelves colours sorting',how:'UP/DOWN PICK A SHELF. A SHELVES THE BOOK. MATCH ITS COLOUR BEFORE IT ROLLS AWAY.',make(){
 const g={over:null,score:0},fx=X.fx(),SH=[66,110,154,198];let sel=0,bk=null,t=0,strikes=0,combo=0,n=0,cnt=[0,0,0,0],fly=null;
 const next=()=>{bk={c:ri(4),x:300,h:22+ri(8),w:7+ri(4),stripe:ri(2)};};next();
 g.update=()=>{t++;const h=A.hit(0);if(h.u)sel=Math.max(0,sel-1);if(h.d)sel=Math.min(3,sel+1);if(h.u||h.d)S('blip');
  if(fly){fly.k+=.12;if(fly.k>=1){if(fly.ok)cnt[fly.s]++;fly=null;}}
  if(bk){bk.x-=.55+n*.03;if(h.a&&!fly){fly={b:bk,s:sel,k:0,x:bk.x,ok:bk.c===sel};if(bk.c===sel){combo++;n++;const p=10*Math.min(5,combo);g.score+=p;S('coin');fx.pop(60,SH[sel]-30,'+'+p,'#7dff9a');}else{combo=0;strikes++;S('lose');A.shake=3;fx.pop(60,SH[sel]-30,'WRONG SHELF','#ff5a4a');}bk=null;}
   else if(bk.x<130){strikes++;combo=0;S('lose');fx.pop(140,150,'MISSED','#ff5a4a');bk=null;}}
  if(!bk&&!fly)next();if(strikes>=5)g.over='THE LIBRARY IS A MESS';};
 g.draw=()=>{const c=A.c;X.cache('tf_lib',()=>{X.vg(0,0,W,H,['#3a2418','#5a3a24','#2a1a10']);for(let col=0;col<3;col++){const bx=120+col*66;X.rr(bx,18,62,190,2,'#6a4428');for(let r=0;r<5;r++){X.rr(bx+3,24+r*36,56,32,0,'#2a1a10');let px=bx+4;while(px<bx+56){const bw=4+hash(px,r)*5,bh=18+hash(r,px)*12,cc=['#8a3a3a','#3a4a7a','#3a6a4a','#8a6a2a','#5a3a6a','#6a5a4a'][Math.floor(hash(px,r+9)*6)];X.rr(px,56+r*36-bh,bw,bh,0,cc);X.rr(px,58+r*36-bh,bw,1,0,'rgba(255,230,160,.4)');px+=bw+.6;}X.rr(bx+3,56+r*36,56,3,0,'#7a5434');}}
   X.stroke([[296,20],[310,210]],'#8a5a34',2);X.stroke([[306,20],[318,210]],'#8a5a34',2);for(let r=0;r<10;r++)X.stroke([[297+r*1.4,30+r*19],[307+r*1.2,30+r*19]],'#8a5a34',1.5);
   X.rr(14,40,90,190,2,'#7a4a2a');X.vg(0,212,W,28,['#6a3a20','#4a2a14']);shaft(150,0,30,200,.07);});
  if(lo()){X.glow(60,22,40,'#ffd080',.35);X.glow(250,90,60,'#ffc070',.12);}X.rr(56,10,8,8,2,'#d8b050');
  for(let s=0;s<4;s++){const y=SH[s];X.rr(18,y-31,82,31,0,s===sel?'#3a2a20':'#2a1a10');X.rr(16,y,86,4,1,'#9a6a3a');X.rr(18,y+4,82,9,1,BC[s][0]);T(BC[s][1],59,y+5.5,'#ffffff',1,'c');
   for(let q=0;q<Math.min(14,cnt[s]);q++){const bh=16+hash(q,s)*12;X.rr(20+q*5.6,y-bh,5,bh,0,X.lg(20+q*5.6,0,25+q*5.6,0,[X.lt(BC[s][0],1.2),BC[s][0],X.lt(BC[s][0],.7)]));X.rr(20+q*5.6,y-bh+3,5,1.5,0,'#ffe8a0');}
   if(s===sel){c.strokeStyle='#ffe27a';c.lineWidth=2;c.strokeRect(17,y-32,84,45);}}
  X.rr(120,206,190,6,2,'#5a3a24');for(let i=0;i<8;i++)X.disc(130+i*24,214,3,'#3a2a1a');
  const book=(b,x,y)=>{ink(c=>c.rect(x-b.w/2,y-b.h,b.w,b.h),X.lg(x-b.w/2,0,x+b.w/2,0,[X.lt(BC[b.c][0],1.25),BC[b.c][0],X.lt(BC[b.c][0],.7)]),.6);X.rr(x-b.w/2,y-b.h+4,b.w,2,0,'#ffe8a0');if(b.stripe)X.rr(x-b.w/2,y-8,b.w,2,0,'#ffe8a0');};
  if(bk){X.rr(bk.x-14,192,28,12,2,'#8a5a34');X.disc(bk.x-8,206,3,'#3a2a1a');X.disc(bk.x+8,206,3,'#3a2a1a');book(bk,bk.x,192);}
  if(fly){const x=fly.x+(60-fly.x)*fly.k,y=192+(SH[fly.s]-192)*fly.k-Math.sin(fly.k*Math.PI)*40;book(fly.b,x,y);}
  hero(112,SH[sel]+30>234?234:SH[sel]+30,{s:.9,top:'#6a3a8a',bot:'#2a2a3a',style:2,hair:'#c8a050',seed:81,arm:-2,d:-1,mood:combo>2?'happy':undefined});
  fx.draw();X.bar('STRIKES '+strikes+'/5',String(g.score),combo>1?'COMBO X'+Math.min(5,combo):'','#ff8a7a','#ffe27a');};
 return g;}});

/* ================= TAILOR'S SEAM ================= */
A.add({id:'tailorshop',name:"TAILOR'S SEAM",cat:'SIM',tags:'sewing needle fabric tailor stitch',how:'LEFT/RIGHT GUIDE THE NEEDLE ALONG THE DOTTED SEAM. A SEWS ON A BUTTON AS IT PASSES.',make(){
 const g={over:null,score:0},fx=X.fx(),NY=150;let nx=160,y=0,t=0,thread=1,st=[],btn=[],on=0,cd=0,pat=ri(3);
 const sx=yw=>160+56*Math.sin(yw*.011)+28*Math.sin(yw*.027+1.3);
 g.update=()=>{t++;if(cd)cd--;const v=1+t/3000;y+=v;const k=A.in(0);nx=cl(nx+ax(k)*2.3,20,W-20);const tx=sx(y+NY),d=Math.abs(nx-tx);on=d<7;
  if(on){if(t%5===0)g.score++;}else thread-=.003+d*.00008;if(thread<=0){g.over='OUT OF THREAD';S('lose');return;}
  st.push({x:nx,y:y+NY,on});if(st.length>180)st.shift();if(t%170===80)btn.push({y:y+260,done:0});
  for(const b of btn){if(!b.done&&Math.abs(b.y-(y+NY))<9&&A.hit(0).a&&!cd&&Math.abs(sx(b.y)-nx)<10){b.done=1;cd=10;g.score+=25;thread=Math.min(1,thread+.15);S('coin');fx.pop(nx,NY-20,'BUTTON +25','#ffe27a');fx.spark(nx,NY,'#ffe27a',8,1.4);}}btn=btn.filter(b=>b.y>y-20);if(A.hit(0).a&&!cd){cd=10;S('blip');}};
 g.draw=()=>{const c=A.c,base=['#3a5a8a','#8a3a3a','#4a6a3a'][pat];X.rr(0,0,W,H,0,base);c.globalAlpha=.25;for(let i=0;i<12;i++){const yy=((i*40-y)%480+480)%480-40;X.rr(0,yy,W,10,0,'#1a1a2a');X.rr(0,yy+16,W,3,0,'#ffe8a0');}for(let i=0;i<9;i++){X.rr(i*40+6,0,10,H,0,'#1a1a2a');X.rr(i*40+22,0,3,H,0,'#ffe8a0');}c.globalAlpha=1;
  c.fillStyle='rgba(255,255,255,.75)';for(let sy=-((y)%6);sy<H;sy+=6){if(sy>NY)break;c.fillRect(sx(y+sy)-1,sy,2,3);}
  c.strokeStyle='#ffe27a';c.lineWidth=1.6;c.beginPath();let first=1;for(const p of st){const py=p.y-y;if(py<NY||py>H)continue;if(first){c.moveTo(p.x,py);first=0;}else c.lineTo(p.x,py);}c.stroke();
  c.fillStyle='#fff6c0';for(let i=0;i<st.length;i+=4){const p=st[i],py=p.y-y;if(py>NY&&py<H&&p.on)c.fillRect(p.x-1.5,py-.5,3,1);}
  for(const b of btn){const by=b.y-y,bx=sx(b.y);if(by<-10||by>H+10)continue;ink(c=>c.arc(bx,by,6,0,TAU),X.rg(bx-2,by-2,1,bx,by,6,['#fff4c0','#d8a040','#8a5a20']),.7);for(const[a,q]of[[-2,-2],[2,-2],[-2,2],[2,2]])X.disc(bx+a,by+q,.9,'#4a2a10');if(b.done)X.stroke([[bx-2,by-2],[bx+2,by+2]],'#ffe27a',1);}
  ink(c=>{c.moveTo(nx+6,0);c.lineTo(W,0);c.lineTo(W,96);c.quadraticCurveTo(W-30,110,nx+30,108);c.lineTo(nx+14,108);c.lineTo(nx+8,NY-28);c.lineTo(nx-8,NY-28);c.lineTo(nx-10,108);c.lineTo(nx-6,96);c.closePath();},X.lg(0,0,0,110,['#3a3a44','#1a1a22','#2a2a34']),.8);X.rr(nx+20,70,60,4,1,'#d8b050');X.rr(nx+20,78,40,2,0,'#d8b050');
  const up=Math.abs(Math.sin(A.t*.6))*6;X.rr(nx-1,NY-28+up,2,26-up,0,'#e8e8f0');X.disc(nx,NY,on?3:2,on?'#7dff9a':'#ff5a4a');if(!on&&lo())X.glow(nx,NY,12,'#ff5a4a',.4);
  hero(30,234,{s:1.1,top:'#e8d8c8',bot:'#3a3a5a',style:0,hair:'#2a1a10',seed:91,mood:on?'happy':'o',arm:-1.5,hold:c=>{c.strokeStyle='#ffe27a';c.lineWidth=1.2;c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(10,10,4,18);c.stroke();}});
  fx.draw();X.bar('THREAD',String(g.score),on?'ON THE SEAM':'OFF THE SEAM','#ffe27a','#ffe27a');X.meter(76,7,60,5,thread,thread<.25?'#ff5a4a':'#ffe27a');};
 return g;}});

/* ================= WINDOW WASHER ================= */
A.add({id:'windowwash',name:'WINDOW WASHER',cat:'ACTION',tags:'skyscraper cleaning squeegee pigeons',how:'ARROWS MOVE THE CRADLE. HOLD A TO SCRUB THE WINDOW BEHIND YOU. DODGE THE PIGEONS.',make(){
 const g={over:null,score:0},fx=X.fx(),C=5,R=4,WX=i=>48+(i%C)*56,WY=i=>48+Math.floor(i/C)*48;let d=[],cx=160,cy=120,t=0,lives=3,inv=0,pig=[],wave=1,scr=0;
 for(let i=0;i<C*R;i++)d.push(.4+rnd(.6));
 g.update=()=>{t++;if(inv)inv--;const k=A.in(0);cx=cl(cx+ax(k)*2,30,W-30);cy=cl(cy+ay(k)*2,40,212);scr=0;
  const i=d.findIndex((v,j)=>Math.abs(WX(j)-cx)<24&&Math.abs(WY(j)-cy)<20);if(k.a&&i>=0){scr=1;if(d[i]>0){d[i]=Math.max(0,d[i]-.025);if(d[i]===0){g.score+=10;S('coin');fx.pop(WX(i),WY(i)-20,'SPARKLING +10','#7ae8ff');fx.spark(WX(i),WY(i),'#ffffff',10,1.6);}}}if(k.a&&t%10===0)S('blip');
  if(d.every(v=>v===0)){wave++;g.score+=50;S('win');fx.pop(160,100,'ALL CLEAN! +50','#7dff9a');for(let j=0;j<C*R;j++)d[j]=.3+rnd(.5);}
  if(t%Math.max(50,140-wave*12)===0){const fromL=Math.random()<.5;pig.push({x:fromL?-10:W+10,y:40+rnd(170),vx:(fromL?1:-1)*(1.2+rnd(.8)+wave*.1),f:0});}
  for(const p of pig){p.x+=p.vx;p.f++;p.y+=Math.sin(p.f*.1)*.6;const j=d.findIndex((v,q)=>Math.abs(WX(q)-p.x)<20&&Math.abs(WY(q)-p.y)<18);if(j>=0&&Math.random()<.01)d[j]=Math.min(1,d[j]+.4);if(!inv&&hyp(p.x-cx,p.y-cy)<16){inv=80;lives--;S('hit');A.shake=5;fx.pop(cx,cy-24,'FLAP!','#ff8a7a');fx.debris(cx,cy,'#c8c8d8',8,1.6);if(lives<=0){g.over='KNOCKED OFF THE CRADLE';return;}}}pig=pig.filter(p=>p.x>-20&&p.x<W+20);};
 g.draw=()=>{const c=A.c;X.cache('tf_wash',()=>{X.sky(['#3a7ad8','#8ac0f0','#e0f0ff'],240);X.skyline(240,'#8aa8c8',0,9,0);X.rr(16,20,288,220,0,X.lg(16,0,304,0,['#6a7a8a','#9aaaba','#5a6a7a']));
   for(let i=0;i<C*R;i++){X.rr(WX(i)-24,WY(i)-20,48,40,0,X.lg(WX(i)-24,WY(i)-20,WX(i)+24,WY(i)+20,['#a8d8f8','#5a98d8','#3a6ab8','#8ac0e8']));c.globalAlpha=.35;X.poly([[WX(i)-14,WY(i)-20],[WX(i)-4,WY(i)-20],[WX(i)-20,WY(i)+20],[WX(i)-24,WY(i)+20],[WX(i)-24,WY(i)+10]],'#ffffff');c.globalAlpha=1;cloud(WX(i)+8,WY(i)-6,.4,'rgba(255,255,255,.5)');}
   X.rr(10,14,300,8,1,'#4a5a6a');});
  for(let i=0;i<C*R;i++)if(d[i]>0){c.globalAlpha=d[i]*.8;X.rr(WX(i)-24,WY(i)-20,48,40,0,'#8a7a5a');c.globalAlpha=d[i];for(let s=0;s<5;s++)X.disc(WX(i)-18+hash(i,s)*36,WY(i)-14+hash(s,i)*28,2+hash(i+s,3)*3,'#6a5a3a');c.globalAlpha=1;}
  X.stroke([[cx-30,16],[cx-30,cy+6]],'#3a3a44',1);X.stroke([[cx+30,16],[cx+30,cy+6]],'#3a3a44',1);
  hero(cx,cy+8,{s:.95,top:'#f0b030',bot:'#2a3a6a',hat:'helm',hatC:'#f0b030',style:1,seed:101,arm:scr?-1.6+Math.sin(A.t*.8)*.6:-.6,mood:'happy',hold:c=>{X.rr(-6,-2,12,2,1,'#2a2a34');X.rr(-1,0,2,6,0,'#c83a3a');}});
  if(!(inv&&A.t%6<3)){X.rr(cx-32,cy+6,64,6,1,X.lg(0,cy+6,0,cy+12,['#c8c8d0','#7a7a84']));X.rr(cx-32,cy-6,2,12,0,'#7a7a84');X.rr(cx+30,cy-6,2,12,0,'#7a7a84');X.rr(cx-32,cy-6,64,2,0,'#7a7a84');}
  if(scr&&lo())for(let s=0;s<3;s++)X.disc(cx-10+rnd(20),cy-10+rnd(10),1.5,'#ffffff');
  for(const p of pig){const fl=Math.sin(p.f*.5);c.save();c.translate(p.x,p.y);c.scale(p.vx>0?1:-1,1);X.ell(0,0,8,5,'#9a9aaa');X.disc(7,-4,3.5,'#8a8a9a');X.disc(8,-5,.9,'#1a1a1a');X.poly([[10,-4],[13,-3],[10,-2]],'#e8a040');X.poly([[-2,-2],[4,-2],[1,-2-fl*8]],'#7a7a8a');X.rr(-1,-1,4,2,0,'#5aa88a');c.restore();}
  fx.draw();X.bar('WAVE '+wave,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= BUS STOP ================= */
A.add({id:'busstop',name:'BUS STOP',cat:'SIM',tags:'bus driver brake stop passengers',how:'RIGHT ACCELERATES, LEFT BRAKES. STOP WITH THE DOOR BY THE SIGN TO LET PEOPLE ON.',make(){
 const g={over:null,score:0},fx=X.fx(),DX=150;let bx=0,v=0,stop=420,still=0,lives=3,t=0,pax=0,board=0,look=0,stops=0;
 g.update=()=>{t++;const k=A.in(0);if(board){board--;if(board===0){stop=bx+500+rnd(400)+stops*10;look=ri(6);}return;}v=cl(v+(k.r?.05:0)-(k.l?.1:0)-.006,0,3.4);bx+=v;const dd=bx-stop;
  if(v<.05&&Math.abs(dd)<40){still++;if(still>15){still=0;stops++;const e=Math.abs(dd),p=Math.max(5,40-Math.round(e));g.score+=p;pax+=3;board=60;S('coin');fx.pop(DX,140,(e<6?'PERFECT ':e<16?'NICE ':'OK ')+'+'+p,e<6?'#7dff9a':'#ffe27a');}}else still=0;
  if(dd>60){lives--;S('lose');A.shake=4;fx.pop(DX,140,'MISSED THE STOP','#ff5a4a');stop=bx+500+rnd(400);look=ri(6);if(lives<=0){g.over='COMPLAINTS FROM THE TOWN';}}};
 g.draw=()=>{const c=A.c;X.cache('tf_bus',()=>{X.sky(['#6aa8e8','#a8d0f0','#e8f4f8'],170);cloud(60,40,1);cloud(230,30,.8);});X.skyline(150,'#a8b8d0',bx*.15,3,1);X.hills(170,8,'#8ab88a',bx*.3,.03,4);
  for(let k=Math.floor(bx*.6/60)-1;k<Math.floor(bx*.6/60)+7;k++){const tx=k*60-bx*.6;if(hash(k,9)<.6)tree(tx,172,9+hash(k,2)*5,'#4a9a4a');else cottage(tx-14,172,28,22,['#e8d0a8','#c8b0c8'][k&1],'#a84a3a',1);}
  X.rr(0,172,W,14,0,'#b8b8c0');X.vg(0,186,W,54,['#5a5a64','#4a4a54']);for(let i=-1;i<10;i++)X.rr(i*40-(bx%40),212,20,3,0,'#e8e8e8');
  const sx=stop-bx+DX;if(sx>-60&&sx<W+60){X.rr(sx+6,124,3,50,0,'#5a5a64');X.disc(sx+7.5,124,9,'#3a8ad8');X.disc(sx+7.5,124,6,'#ffffff');T('B',sx+7.5,121,'#3a8ad8',1,'c');X.rr(sx+16,140,40,4,0,'#8a8a94');X.rr(sx+16,144,2,28,0,'#8a8a94');X.rr(sx+54,144,2,28,0,'#8a8a94');c.globalAlpha=.3;X.rr(sx+18,144,36,28,0,'#a8d8f0');c.globalAlpha=1;
   if(!board)for(let q=0;q<3;q++){const L=LOOKS[(look+q)%6];hero(sx+24+q*12,174,{s:.75,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:q+look,skin:SKIN[(q+look)%4],arm:q===0?-2.4:undefined,bob:0});}X.rr(sx-2,186,20,2,0,'#ffe27a');}
  if(board){for(let q=0;q<3;q++){const p=Math.max(0,Math.min(1,(60-board-q*12)/18));if(p<1){const L=LOOKS[(look+q)%6];hero(sx+24+q*12-(sx+24+q*12-DX)*p,174,{s:.75,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:q+look,st:A.t*.4,skin:SKIN[(q+look)%4]});}}}
  const by=200,L0=DX-96;X.shadow(L0+60,by+2,64,4,.4);X.rr(L0,by-46,120,40,6,X.lg(0,by-46,0,by-6,['#ff6a4a','#e84a3a','#a82a1a']));X.rr(L0,by-46,120,6,4,'#ffffff');for(let w=0;w<5;w++){X.rr(L0+6+w*20,by-38,16,14,2,'#8ac8f0');if(w<Math.min(5,pax))X.disc(L0+14+w*20,by-28,4,SKIN[w%4]);}
  X.rr(DX-12,by-38,14,30,1,board?'#2a2a3a':'#8ac8f0');X.rr(L0+112,by-38,8,16,2,'#c8e8f8');X.disc(L0+116,by-30,3,'#f2c29a');X.rr(L0,by-14,120,4,0,'#ffd84a');for(const wx of[L0+22,L0+98]){X.disc(wx,by-4,9,'#1a1a1a');X.disc(wx,by-4,4,'#8a8a94');}
  X.rr(8,24,64,26,4,'rgba(0,0,0,.45)');X.meter(14,34,52,6,v/3.4,v>2.5?'#ff8a4a':'#7dff9a');T('SPEED',40,26,'#ffffff',1,'c');if(sx>DX)T((sx-DX|0)+' M',40,42,'#ffe27a',1,'c');
  fx.draw();X.bar('STOPS '+stops,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= PIG CHASE ================= */
A.add({id:'pigchase',name:'PIG CHASE',cat:'VERSUS',vs:1,tags:'farm piglets pen catch barn',how:'MOVE TO GRAB A PIGLET, CARRY IT TO YOUR GATE. A DASHES; DASH INTO A CARRIER TO STEAL IT.',make(){
 const g={over:null,score:0},fx=X.fx(),GX=[18,302],GY=136;let P=[{x:70,y:136,c:-1,dash:0,cd:0,st:0,d:1,s:0},{x:250,y:136,c:-1,dash:0,cd:0,st:0,d:-1,s:0}],pigs=[],t=0;
 const spawn=()=>({x:130+rnd(60),y:70+rnd(130),vx:0,vy:0,held:-1,seed:ri(99)});for(let i=0;i<5;i++)pigs.push(spawn());
 g.timeUp=()=>tu(P[0].s,P[1].s);
 g.update=()=>{t++;if(A.cpu){const q=P[1],o={};let tx,ty;if(q.c>=0){tx=GX[1];ty=GY;}else{const fr=pigs.filter(p=>p.held<0).sort((a,b)=>hyp(a.x-q.x,a.y-q.y)-hyp(b.x-q.x,b.y-q.y))[0];const op=P[0];if(op.c>=0&&hyp(op.x-q.x,op.y-q.y)<60&&A.ai>.3){tx=op.x;ty=op.y;}else if(fr){tx=fr.x;ty=fr.y;}else{tx=160;ty=136;}}
   const sl=.7+A.ai*.3;if(tx<q.x-4)o.l=1;if(tx>q.x+4)o.r=1;if(ty<q.y-4)o.u=1;if(ty>q.y+4)o.d=1;if(Math.random()>sl){o.l=o.r=o.u=o.d=0;}if(!q.cd&&hyp(tx-q.x,ty-q.y)<34&&Math.random()<.05+A.ai*.1&&t%2)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],k=A.in(i),dx=ax(k),dy=ay(k);if(p.cd)p.cd--;if(p.dash)p.dash--;if(A.hit(i).a&&!p.cd){p.dash=12;p.cd=60;S(i?'blip':'jump');}const sp=(p.c>=0?1.4:1.8)*(p.dash?2.2:1);if(dx)p.d=dx;p.x=cl(p.x+dx*sp,24,W-24);p.y=cl(p.y+dy*sp,56,226);if(dx||dy)p.st+=.4;
   if(p.c<0){for(const pg of pigs)if(pg.held<0&&hyp(pg.x-p.x,pg.y-p.y)<14){pg.held=i;p.c=pigs.indexOf(pg);S('blip');fx.pop(p.x,p.y-36,'OINK!','#ffb0c8');break;}}
   else if(Math.abs(p.x-GX[i])<22&&Math.abs(p.y-GY)<26){p.s++;if(i===0)g.score=p.s*10;pigs[p.c]=spawn();p.c=-1;S('coin');fx.pop(p.x,p.y-36,'+1','#7dff9a');fx.spark(p.x,p.y-16,'#ffe27a',10,1.6);}}
  const a=P[0],b=P[1];if(hyp(a.x-b.x,a.y-b.y)<16){for(const[q,o]of[[a,b],[b,a]])if(q.dash&&o.c>=0&&q.c<0){const pg=pigs[o.c];pg.held=-1;pg.vx=(o.x-q.x)*.3;pg.vy=-2;o.c=-1;S('hit');A.shake=3;fx.pop(o.x,o.y-36,'FUMBLE!','#ff8a5a');}}
  for(const pg of pigs){if(pg.held>=0){const p=P[pg.held];pg.x=p.x+p.d*6;pg.y=p.y-14;continue;}const n=P.map(p=>hyp(p.x-pg.x,p.y-pg.y)),j=n[0]<n[1]?0:1;if(n[j]<50){pg.vx+=(pg.x-P[j].x)/n[j]*.25;pg.vy+=(pg.y-P[j].y)/n[j]*.25;}else if(Math.random()<.03){pg.vx+=rnd(1)-.5;pg.vy+=rnd(1)-.5;}pg.vx*=.9;pg.vy*=.9;pg.x=cl(pg.x+pg.vx,40,W-40);pg.y=cl(pg.y+pg.vy,62,222);}};
 const piglet=(x,y,d,seed,carry)=>{critter(x,y,7,'#ffb0c0',{ears:'cat',mood:carry?'o':'happy',d,seed});X.ell(x+d*6.5,y-6,2.4,1.8,'#ff8aa8');X.disc(x+d*6,y-6,.5,'#8a3a4a');X.disc(x+d*7,y-6,.5,'#8a3a4a');};
 g.draw=()=>{const c=A.c;X.cache('tf_pigs',()=>{X.sky(['#7ab8e8','#c0e0f0'],56);X.hills(56,10,'#6aa85a',0,.03,2);X.vg(0,50,W,190,['#8ac85a','#7ab84a','#6aa83a']);for(let i=0;i<70;i++){const x=hash(i,1)*W,y=60+hash(i,2)*175;X.stroke([[x,y],[x-1,y-4]],'rgba(40,90,30,.5)',1);X.stroke([[x+2,y],[x+3,y-4]],'rgba(40,90,30,.5)',1);}
   for(let i=0;i<8;i++){X.ell(60+hash(i,4)*200,90+hash(i,5)*120,14+hash(i,6)*10,5,'rgba(120,80,40,.35)');}
   for(const s of[0,1]){const x=s?W-22:0;X.rr(x,96,22,80,1,s?'#c84a3a':'#3a6ac8');X.poly([[x-4,96],[x+11,80],[x+26,96]],'#5a3a2a');X.rr(x+(s?0:12),118,10,36,0,'#2a1a10');}
   for(let i=0;i<14;i++){X.rr(26+i*20,50,3,14,0,'#8a5a34');}X.rr(26,54,268,2,0,'#a87a4a');X.rr(26,60,268,2,0,'#a87a4a');});
  X.rr(GX[0]-4,GY-24,8,48,2,'rgba(80,140,255,.25)');X.rr(GX[1]-4,GY-24,8,48,2,'rgba(255,80,120,.25)');
  const ents=[...P.map((p,i)=>({y:p.y,f:()=>hero(p.x,p.y,{s:1,st:p.st,d:p.d,top:i?'#c84a3a':'#3a6ac8',bot:'#4a3a2a',hat:'straw',hatC:i?'#ffd84a':'#e8d090',style:i?2:0,seed:i*5+3,arm:p.c>=0?-2.2:p.dash?-.2:undefined,mood:p.c>=0?'happy':undefined})})),...pigs.map(pg=>({y:pg.held>=0?P[pg.held].y+1:pg.y,f:()=>piglet(pg.x,pg.y,pg.vx<0?-1:1,pg.seed,pg.held>=0)}))].sort((a,b)=>a.y-b.y);for(const e of ents)e.f();
  for(const p of P)if(p.dash&&lo())X.ell(p.x-p.d*10,p.y,8,2,'rgba(200,170,120,.6)');
  fx.draw();X.bar();A.hud2(P[0].s,P[1].s);};
 return g;}});

/* ================= WOOD CHOP ================= */
A.add({id:'woodchop',name:'WOOD CHOP',cat:'VERSUS',vs:1,tags:'lumberjack axe logs timing contest',how:'PRESS A WHEN YOUR SWINGING NEEDLE IS IN THE GREEN. CENTRE HITS SPLIT FASTER. 8 LOGS WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),SX=[90,230];let P=[0,1].map(i=>({ph:rnd(TAU),sp:.055,hp:6,logs:0,cd:0,sw:0,last:''})),t=0,chips=[];
 g.timeUp=()=>tu(P[0].logs*10+(6-P[0].hp),P[1].logs*10+(6-P[1].hp));
 g.update=()=>{t++;if(A.cpu){const q=P[1],m=Math.sin(q.ph),o={};if(!q.cd&&Math.abs(m)<.1+(1-A.ai)*.35&&Math.random()<.25+A.ai*.3&&t%2)o.a=1;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i];p.ph+=p.sp;if(p.cd)p.cd--;if(p.sw)p.sw--;if(A.hit(i).a&&!p.cd){p.cd=16;p.sw=12;const m=Math.abs(Math.sin(p.ph)),dmg=m<.12?2:m<.4?1:0;p.last=dmg===2?'PERFECT':dmg?'GOOD':'SLIP';
    if(dmg){p.hp-=dmg;S('hit');A.shake=dmg;fx.debris(SX[i],168,'#e8c890',dmg*6,2);if(i===0)g.score+=dmg*5;}else{S('blip');p.cd=36;}fx.pop(SX[i],110,p.last,dmg===2?'#7dff9a':dmg?'#ffe27a':'#ff8a7a');
    if(p.hp<=0){p.logs++;p.hp=6;p.sp=Math.min(.12,p.sp+.006);S('coin');fx.spark(SX[i],160,'#ffe27a',12,2);chips.push({i,k:p.logs});if(i===0)g.score+=30;if(p.logs>=8){g.over=A.win(i);S('win');return;}}}}};
 g.draw=()=>{const c=A.c;X.cache('tf_chop',()=>{X.sky(['#8ac0e8','#d0e8f0','#f0f4e0'],150);X.hills(120,16,'#5a8a6a',0,.02,7);for(let i=0;i<16;i++)pine(i*22-6,130+hash(i,3)*10,40+hash(i,1)*20,'#2a5a3a');X.vg(0,140,W,100,['#7aa84a','#6a983a','#5a8a30']);for(let i=0;i<12;i++)X.ell(hash(i,8)*W,200+hash(i,9)*36,10,3,'rgba(255,240,180,.25)');});
  for(let i=0;i<2;i++){const p=P[i],x=SX[i];X.shadow(x,196,30,5,.35);X.rr(x-22,172,44,24,4,X.lg(x-22,0,x+22,0,['#6a4428','#8a5a34','#5a3a20']));X.ell(x,172,22,5,'#c8a070');for(let r=1;r<4;r++){c.strokeStyle='rgba(120,80,40,.5)';c.lineWidth=.8;c.beginPath();c.ellipse(x,172,r*5.5,r*1.2,0,0,TAU);c.stroke();}
   const hl=p.hp/6;X.rr(x-9,150+(1-hl)*0,18,22,2,X.lg(x-9,0,x+9,0,['#8a5a34','#a87a4a','#6a4428']));X.ell(x,150,9,2.4,'#e8c890');if(p.hp<6)X.rr(x-.5,150,1,22*(1-hl),0,'#3a2010');
   const L=i?{top:'#3a6ac8',hc:'#2a2a3a'}:{top:'#c83a3a',hc:'#ffd84a'};const raise=p.sw>6;hero(x+(i?26:-26),200,{s:1.25,d:i?-1:1,top:L.top,bot:'#2a3a5a',hat:'beanie',hatC:L.hc,style:i?3:1,hair:i?'#2a1a10':'#c8742a',seed:i*7+1,arm:raise?-2.8:-.3,mood:p.last==='PERFECT'&&p.sw?'happy':undefined,hold:c=>{X.rr(-1,-4,2,18,1,'#8a5a34');X.poly([[-1,12],[7,10],[8,17],[-1,16]],'#c8c8d0');}});
   for(let q=0;q<Math.min(8,p.logs);q++){const lx=(i?268:16)+(q%4)*10,ly=226-Math.floor(q/4)*8;X.rr(lx,ly,9,7,3,'#8a5a34');X.ell(lx+1,ly+3.5,1.8,3,'#e8c890');}
   const mx=x-34,my=96;X.rr(mx,my,68,8,3,'#1a1a1a');X.rr(mx+34-27,my,54,8,0,'rgba(255,220,80,.35)');X.rr(mx+34-8,my,16,8,0,'rgba(80,220,120,.7)');X.rr(mx+33+Math.sin(p.ph)*32,my-3,2,14,1,'#ffffff');
   X.meter(x-20,my+12,40,3,(6-p.hp)/6,'#e8c890');}
  fx.draw();X.bar();A.hud2(P[0].logs,P[1].logs);};
 return g;}});

/* ================= CHEESE ROLL ================= */
A.add({id:'cheeseroll',name:'CHEESE ROLL',cat:'VERSUS',vs:1,tags:'cheese hill race downhill tumble',how:'HOLD RIGHT TO SPRINT (USES STAMINA). A JUMPS TUFTS. FIRST TO CATCH THE CHEESE WINS.',make(){
 const g={over:null,score:0},fx=X.fx(),GOAL=2600,LY=[118,206];let P=[0,1].map(()=>({x:0,y:0,vy:0,sta:1,tum:0,st:0})),t=0;
 const tuft=(i,k)=>k*90+40+hash(k,i+5)*40;const isT=(i,k)=>k>1&&hash(k,i+11)<.6;
 g.timeUp=()=>tu(P[0].x,P[1].x);
 g.update=()=>{t++;if(A.cpu){const q=P[1],o={};if(q.sta>.35-A.ai*.2)o.r=1;const k=Math.floor((q.x+30)/90);for(const kk of[k,k+1])if(isT(1,kk)){const d=tuft(1,kk)-q.x;if(d>4&&d<20+A.ai*6&&Math.random()<.3+A.ai*.6)o.a=1;}if(q.y<0)o.a=0;A.bot(o);}
  for(let i=0;i<2;i++){const p=P[i],k=A.in(i);if(p.tum){p.tum--;p.x+=.6;continue;}const spr=k.r&&p.sta>.02;p.sta=cl(p.sta+(spr?-.008:.004),0,1);const v=spr?3.4:2.2;p.x+=v;p.st+=v*.18;
   if(A.hit(i).a&&p.y===0){p.vy=-3.8;if(i===0)S('jump');}p.vy+=.22;p.y=Math.min(0,p.y+p.vy);if(p.y===0)p.vy=0;
   const kk=Math.floor((p.x+20)/90);for(const q of[kk-1,kk])if(isT(i,q)&&Math.abs(tuft(i,q)-p.x)<6&&p.y>-6){p.tum=50;S('hit');if(i===0)A.shake=4;fx.pop(110,LY[i]-40,'TUMBLE!','#ff8a5a');p.x=tuft(i,q)+7;}
   if(p.x>=GOAL){g.over=A.win(i);S('win');return;}}g.score=P[0].x/10|0;};
 g.draw=()=>{const c=A.c;X.cache('tf_cheese',()=>{X.sky(['#7ab0e8','#c8e0f0','#f0f4e0'],60);cloud(60,24,.8);cloud(230,34,.7);X.hills(60,10,'#7aa86a',0,.03,4);X.vg(0,56,W,184,['#8ac85a','#7ab84a','#6aa83a']);for(let i=0;i<6;i++)cottage(20+i*52,72,22,16,'#f0e8d0','#8a4a3a',1);});
  for(let i=0;i<2;i++){const p=P[i],ly=LY[i],cam=p.x-110;c.save();c.beginPath();c.rect(0,ly-62,W,72);c.clip();X.vg(0,ly-62,W,72,i?['#7ab84a','#6aa83a']:['#8ac85a','#7ab84a']);
   for(let s=0;s<12;s++){const sx=((s*37-cam*.9)%W+W)%W;X.stroke([[sx,ly+6],[sx-8,ly-56]],'rgba(255,255,255,.08)',6);}
   for(let q=Math.floor(cam/90)-1;q<Math.floor(cam/90)+5;q++){if(!isT(i,q))continue;const tx=tuft(i,q)-cam;for(let b=-1;b<=1;b++)ink(c=>{c.moveTo(tx+b*4-3,ly);c.lineTo(tx+b*4,ly-9-Math.abs(b)*-2);c.lineTo(tx+b*4+3,ly);c.closePath();},'#4a8a2a',.5);}
   const ch=Math.max(p.x+60,Math.min(GOAL,p.x+60+Math.sin(t*.02)*10))-cam,ca=t*.25;if(GOAL-cam<W+40){X.rr(GOAL-cam+40,ly-50,3,50,0,'#ffffff');X.poly([[GOAL-cam+43,ly-50],[GOAL-cam+60,ly-45],[GOAL-cam+43,ly-40]],'#ff4a4a');}
   c.save();c.translate(ch,ly-9+Math.abs(Math.sin(ca))*-3);c.rotate(ca);ink(c=>c.arc(0,0,9,0,TAU),X.rg(-3,-3,1,0,0,9,['#fff4b0','#f0c840','#c89820']),.8);X.disc(0,0,3,'#e8b830');c.restore();
   if(p.tum){c.save();c.translate(110,ly-12);c.rotate(p.tum*.3);hero(0,12,{s:.9,top:i?'#c84a3a':'#3a6ac8',bot:'#f4f4f8',style:i?2:0,seed:i+3,mood:'o',bob:0});c.restore();}
   else hero(110,ly+p.y,{s:.9,st:p.st,top:i?'#c84a3a':'#3a6ac8',bot:'#f4f4f8',style:i?2:0,seed:i+3,arm:k2(p),mood:p.y<0?'happy':undefined});c.restore();
   X.meter(8,ly-56,60,4,p.sta,'#ffd84a');X.meter(80,ly-56,232,4,p.x/GOAL,i?'#ff4f9a':'#2fd6c3');}
  fx.draw();X.bar();A.hud2(P[0].x/26|0,P[1].x/26|0);};
 const k2=p=>p.y<0?-2.4:-.8+Math.sin(p.st)*.6;return g;}});

/* ================= SAWMILL ================= */
A.add({id:'sawmill',name:'SAWMILL',cat:'SIM',tags:'saw logs cut timing mill',how:'LOGS RIDE THE BELT. PRESS A TO DROP THE SAW WHEN A RED LINE IS UNDER IT. CLEAN CUTS SCORE.',make(){
 const g={over:null,score:0},fx=X.fx(),SXP=210,BY=170;let logs=[],t=0,strikes=0,drop=0,v=.9,cuts=0,dust=[];
 const add=x=>{const len=110+ri(90),n=1+ri(3),m=[];for(let i=1;i<=n;i++)m.push({p:len*i/(n+1)+rnd(10)-5,cut:0});logs.push({x,len,m,c:['#8a5a34','#7a4a2a','#9a6a3a'][ri(3)]});};add(-140);
 g.update=()=>{t++;if(drop)drop--;v=.9+cuts*.015;for(const l of logs)l.x+=v;const last=logs[logs.length-1];if(last.x>-20)add(last.x-last.len-30-rnd(40));
  if(A.hit(0).a&&!drop){drop=18;let best=null,bd=99;for(const l of logs)for(const m of l.m){if(m.cut)continue;const d=Math.abs(l.x-l.len+m.p-SXP);if(d<bd){bd=d;best=m;}}
   const onLog=logs.some(l=>SXP<l.x&&SXP>l.x-l.len);if(best&&bd<10){best.cut=1;cuts++;const p=bd<4?25:12;g.score+=p;S(bd<4?'coin':'hit');fx.pop(SXP,BY-60,bd<4?'PERFECT +25':'GOOD +12',bd<4?'#7dff9a':'#ffe27a');for(let i=0;i<14;i++)dust.push({x:SXP,y:BY-6,vx:rnd(3)-1.5,vy:-rnd(2.5),l:40});}
   else if(onLog){strikes++;S('lose');A.shake=4;fx.pop(SXP,BY-60,'BAD CUT','#ff5a4a');}else S('blip');}
  for(const l of logs)for(const m of l.m)if(!m.cut&&!m.miss&&l.x-l.len+m.p>SXP+12){m.miss=1;strikes++;S('lose');fx.pop(SXP+40,BY-50,'MISSED LINE','#ff5a4a');}
  logs=logs.filter(l=>l.x-l.len<W+20);for(const d of dust){d.x+=d.vx;d.y+=d.vy;d.vy+=.08;d.l--;}dust=dust.filter(d=>d.l>0);if(strikes>=3)g.over='THE FOREMAN SENT YOU HOME';};
 g.draw=()=>{const c=A.c;X.cache('tf_mill',()=>{X.vg(0,0,W,H,['#5a4030','#7a5a40','#4a3424']);for(let i=0;i<8;i++)X.rr(i*44,0,6,H,0,'rgba(0,0,0,.15)');X.rr(0,30,W,10,0,'#3a2a1a');X.rr(0,100,W,6,0,'#3a2a1a');
   X.rr(18,50,60,44,2,'#3a2a1a');X.vg(22,54,52,36,['#a8d0e8','#d8e8c8']);for(let i=0;i<3;i++)pine(30+i*18,90,22,'#3a6a4a');shaft(20,54,40,170,.1);
   for(let i=0;i<5;i++){X.rr(240+((i*13)%30),190-i*10,60,9,4,'#8a5a34');X.ell(240+((i*13)%30),194.5-i*10,3,4.5,'#e8c890');}
   X.rr(0,BY,W,10,1,'#3a3a44');for(let i=0;i<20;i++)X.disc(8+i*16,BY+5,4,'#6a6a74');X.vg(0,BY+10,W,60,['#3a2a1a','#2a1a10']);});
  for(let i=0;i<20;i++){const a=t*v*.25+i;c.strokeStyle='rgba(30,30,40,.6)';c.lineWidth=1;c.beginPath();c.moveTo(8+i*16+Math.cos(a)*3,BY+5+Math.sin(a)*3);c.lineTo(8+i*16-Math.cos(a)*3,BY+5-Math.sin(a)*3);c.stroke();}
  for(const l of logs){const x0=l.x-l.len;X.rr(x0,BY-22,l.len,22,10,X.lg(0,BY-22,0,BY,[X.lt(l.c,1.25),l.c,X.lt(l.c,.65)]));for(let q=0;q<l.len;q+=9)X.rr(x0+q+hash(q,l.len)*4,BY-18+hash(l.len,q)*12,5,1.2,0,'rgba(40,20,10,.4)');X.ell(l.x-3,BY-11,5,11,'#e8c890');c.strokeStyle='rgba(140,90,40,.6)';c.beginPath();c.ellipse(l.x-3,BY-11,2.5,6,0,0,TAU);c.stroke();
   for(const m of l.m){const mx=x0+m.p;if(m.cut){X.rr(mx-1,BY-24,2,26,0,'#2a1a10');}else X.rr(mx-1,BY-24,2,26,0,m.miss?'#6a3a3a':'#ff3a3a');}}
  const sy=drop?BY-12-Math.sin(drop/18*Math.PI)*-10:BY-40;X.rr(SXP-3,8,6,sy-8,0,'#5a5a64');const a=A.t*.6;ink(c=>{for(let i=0;i<18;i++){const q=a+i/18*TAU,q2=q+.17;c.lineTo(SXP+Math.cos(q)*20,sy+Math.sin(q)*20);c.lineTo(SXP+Math.cos(q2)*16,sy+Math.sin(q2)*16);}c.closePath();},X.rg(SXP-6,sy-6,2,SXP,sy,20,['#f0f0f8','#a8a8b8','#6a6a78']),.6);X.disc(SXP,sy,4,'#3a3a44');
  if(lo()&&drop)X.glow(SXP,BY-8,20,'#ffd080',.4);for(const d of dust)X.disc(d.x,d.y,1.4,'rgba(240,210,150,'+d.l/40+')');
  hero(268,BY,{s:1.2,top:'#3a6a3a',bot:'#4a3a2a',hat:'cap',hatC:'#c83a3a',apron:'#8a6a4a',style:3,hair:'#5a3a1a',seed:111,d:-1,arm:drop?-1.8:-.5});
  fx.draw();X.bar('STRIKES '+strikes+'/3',String(g.score),'CUTS '+cuts,'#ff8a7a','#ffe27a');};
 return g;}});

/* ================= ICE CREAM STACK ================= */
const FL=['#ff9ab8','#9ae8c0','#8a5434','#fff4d8','#9ab8ff'];
A.add({id:'icecream',name:'ICE CREAM STACK',cat:'CLASSICS',tags:'stack scoops cone beach catch',how:'LEFT/RIGHT CATCH SCOOPS ON THE CONE. A SERVES THE STACK - MATCH THE ORDER FOR DOUBLE.',make(){
 const g={over:null,score:0},fx=X.fx(),CY=196;let x=160,vx=0,stack=[],f=[],t=0,lives=3,want=3+ri(3),sway=0,sv=0,look=ri(6),served=0;
 g.update=()=>{t++;const k=A.in(0),nv=ax(k)*3.2;sv+=(vx-nv)*.02*stack.length;vx=nv;x=cl(x+vx,30,W-90);sv-=sway*.06;sv*=.92;sway+=sv;
  if(Math.abs(sway)>2.2+0*stack.length&&stack.length>2){lives--;S('lose');A.shake=5;for(let i=0;i<stack.length;i++)fx.debris(x+sway*i,CY-14-i*9,FL[stack[i]],4,2);stack=[];sway=0;sv=0;fx.pop(x,CY-40,'SPLAT!','#ff6a5a');if(lives<=0){g.over='THE TOWER TOPPLED';return;}}
  if(t%Math.max(34,64-served*2)===0)f.push({x:30+rnd(W-130),y:24,k:ri(5),v:1.1+rnd(.5)+served*.04});
  const top=CY-14-stack.length*9;for(const o of f){o.y+=o.v;if(!o.done&&o.y>top-6&&o.y<top+4){const dx=o.x-(x+sway*stack.length);if(Math.abs(dx)<10){o.done=1;stack.push(o.k);sv+=dx*.03;S('blip');fx.pop(x,top-20,'+'+stack.length,'#ffffff');}}if(!o.done&&o.y>CY+20){o.done=1;lives--;S('hit');fx.debris(o.x,CY+30,FL[o.k],6,1.4);fx.pop(o.x,CY,'DROPPED','#ff8a7a');if(lives<=0){g.over='TOO MANY DROPS';return;}}}f=f.filter(o=>!o.done);
  if(A.hit(0).a&&stack.length){const n=stack.length,p=n*n*5*(n===want?2:1);g.score+=p;served++;S(n===want?'win':'coin');fx.pop(W-50,120,(n===want?'PERFECT ORDER ':'')+'+'+p,n===want?'#7dff9a':'#ffe27a');stack=[];sway=0;sv=0;want=3+ri(4);look=ri(6);}};
 g.draw=()=>{const c=A.c;X.cache('tf_ice',()=>{X.sky(['#4ab0f0','#a0dcf8','#e8f8ff'],120);X.glow(60,40,50,'#fff8d0',.7);X.disc(60,40,14,'#fff8e0');cloud(220,40,.9);X.vg(0,110,W,40,['#2a8ad8','#4aa8e8','#8ad0f0']);for(let i=0;i<12;i++)X.rr(i*30+(i%3)*5,120+(i%4)*6,14,1.5,0,'rgba(255,255,255,.6)');X.vg(0,150,W,90,['#f8e0a8','#f0d090','#e0b878']);
   X.rr(232,90,80,8,2,'#ffffff');for(let i=0;i<8;i++)X.rr(232+i*10,98,10,12,0,i%2?'#ff6a8a':'#ffffff');X.rr(236,110,4,90,0,'#d8d8e0');X.rr(304,110,4,90,0,'#d8d8e0');X.rr(230,170,84,40,4,X.lg(0,170,0,210,['#ffffff','#e0e8f0']));for(let i=0;i<5;i++)X.disc(244+i*14,166,6,FL[i]);X.disc(246,214,8,'#3a3a44');X.disc(298,214,8,'#3a3a44');});
  const L=LOOKS[look];hero(272,166,{s:1,top:L[0],bot:L[1],hat:L[2],hatC:L[3],style:L[4],seed:look+20,skin:SKIN[look%4],mood:'happy',arm:-2.2});X.panel(244,116,58,26,'#ff9ab8');T('WANTS '+want,273,122,'#5a2a3a',1,'c');for(let i=0;i<want;i++)X.disc(256+i*7,135,2.6,FL[i%5]);
  for(const o of f){X.shadow(o.x,CY+30,5,1.5,.2);ink(c=>c.arc(o.x,o.y,7,0,TAU),X.rg(o.x-2,o.y-3,1,o.x,o.y,7,[X.lt(FL[o.k],1.2),FL[o.k],X.lt(FL[o.k],.8)]),.7);}
  hero(x+28,232,{s:1.1,top:'#ff6a8a',bot:'#ffffff',hat:'chef',apron:'#ffffff',style:1,seed:121,arm:-1.6,d:-1,mood:stack.length>2?'happy':undefined});
  ink(c=>{c.moveTo(x-9,CY-12);c.lineTo(x+9,CY-12);c.lineTo(x,CY+14);c.closePath();},X.lg(x-9,0,x+9,0,['#e8b878','#c8904a']),.8);c.strokeStyle='rgba(140,90,40,.6)';c.lineWidth=.8;for(let i=-2;i<=2;i++){c.beginPath();c.moveTo(x+i*4,CY-12);c.lineTo(x+i*2,CY+4);c.stroke();}
  for(let i=0;i<stack.length;i++){const sx=x+sway*(i+1)*.9,sy=CY-14-i*9;ink(c=>{c.arc(sx,sy,8.5,Math.PI*.95,Math.PI*2.05);c.quadraticCurveTo(sx+6,sy+5,sx,sy+3);c.quadraticCurveTo(sx-6,sy+5,sx-8.5,sy+1);c.closePath();},X.rg(sx-3,sy-4,1,sx,sy,9,[X.lt(FL[stack[i]],1.25),FL[stack[i]],X.lt(FL[stack[i]],.8)]),.7);}
  if(stack.length)X.disc(x+sway*(stack.length)*.9,CY-22-(stack.length-1)*9,2.4,'#e83a4a');
  fx.draw();X.bar('STACK '+stack.length,String(g.score),'SERVED '+served,'#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/* ================= STARGAZER ================= */
A.add({id:'stargazer',name:'STARGAZER',cat:'SIM',tags:'telescope comets night sky photo',how:'ARROWS AIM THE TELESCOPE. A TAKES A PHOTO - CENTRE A COMET IN THE RING. 30 PLATES OF FILM.',make(){
 const g={over:null,score:0},fx=X.fx();let rx=160,ry=100,co=[],t=0,film=30,flash=0,cd=0,shots=0;
 g.update=()=>{t++;if(flash)flash--;if(cd)cd--;const k=A.in(0);rx=cl(rx+ax(k)*2.6,20,W-20);ry=cl(ry+ay(k)*2.6,24,170);
  if(t%Math.max(40,110-t/60|0)===0){const fl=Math.random()<.5,sp=1+rnd(1.2)+t/6000;co.push({x:fl?-10:W+10,y:20+rnd(110),vx:(fl?1:-1)*sp,vy:.2+rnd(.6),c:['#9ae8ff','#ffd0a0','#c8a0ff','#a0ffc8'][ri(4)],tr:[]});}
  for(const o of co){o.x+=o.vx;o.y+=o.vy;o.tr.unshift([o.x,o.y]);if(o.tr.length>16)o.tr.pop();}co=co.filter(o=>o.x>-30&&o.x<W+30&&o.y<200&&!o.got);
  if(A.hit(0).a&&!cd&&film>0){film--;cd=20;flash=8;let got=0;for(const o of co){const d=hyp(o.x-rx,o.y-ry);if(d<22){o.got=1;got++;const p=10+Math.round(30*(1-d/22));g.score+=p;fx.pop(o.x,o.y-14,'+'+p,'#7dff9a');fx.ring(o.x,o.y,o.c,18,16);}}S(got?'coin':'blip');if(got)shots++;if(!got)fx.pop(rx,ry-26,'JUST STARS','#8a9ac8');if(film<=0){g.over='OUT OF FILM';}}};
 g.draw=()=>{const c=A.c;X.cache('tf_star',()=>{X.sky(['#060818','#141838','#2a2a5a','#4a3a6a'],200);X.stars(160,5,0,0,190,1);for(let i=0;i<260;i++){const q=hash(i,4),px=q*W,py=170-q*150+(hash(i,5)-.5)*40;X.disc(px,py,2+hash(i,7)*6,'rgba('+['168,160,232','232,176,208','144,184,240'][i%3]+','+(.03+hash(i,6)*.06).toFixed(3)+')');}for(let i=0;i<80;i++){const q=hash(i,8);X.disc(q*W,170-q*150+(hash(i,9)-.5)*30,.7,'#ffffff');}
   X.hills(186,12,'#141824',0,.015,2);X.vg(0,190,W,50,['#141824','#0a0c14']);X.rr(250,150,40,40,0,'#c8c8d0');ink(c=>c.arc(270,150,22,Math.PI,0),X.lg(248,0,292,0,['#e8e8f0','#a8a8b8']),.8);X.rr(266,128,8,22,0,'#2a2a3a');X.rr(274,166,8,12,1,'#ffd880');});
  if(lo())X.glow(278,172,14,'#ffd880',.4);
  for(const o of co){for(let i=0;i<o.tr.length;i++){const[a,b]=o.tr[i];c.globalAlpha=(1-i/16)*.7;X.disc(a,b,3-i*.15,o.c);}c.globalAlpha=1;if(lo())X.glow(o.x,o.y,10,o.c,.6);X.disc(o.x,o.y,2.6,'#ffffff');}
  ink(c=>{c.moveTo(56,206);c.lineTo(64,180);c.lineTo(68,182);c.lineTo(62,206);c.closePath();},'#4a3a2a',.6);c.save();c.translate(66,180);c.rotate(Math.atan2(ry-180,rx-66));X.rr(0,-4,30,8,2,X.lg(0,-4,0,4,['#d8b050','#8a6020']));X.rr(26,-5,6,10,1,'#3a3a44');c.restore();
  hero(48,214,{s:1,top:'#3a3a7a',bot:'#2a2a3a',hat:'wizard',hatC:'#2a2a6a',style:2,hair:'#e8e0d0',seed:131,arm:-1.8,d:1});
  c.strokeStyle=co.some(o=>hyp(o.x-rx,o.y-ry)<22)?'#7dff9a':'#ffffff';c.lineWidth=1.5;c.beginPath();c.arc(rx,ry,22,0,TAU);c.stroke();c.beginPath();c.moveTo(rx-30,ry);c.lineTo(rx-14,ry);c.moveTo(rx+14,ry);c.lineTo(rx+30,ry);c.moveTo(rx,ry-30);c.lineTo(rx,ry-14);c.moveTo(rx,ry+14);c.lineTo(rx,ry+30);c.stroke();
  if(flash){c.fillStyle='rgba(255,255,255,'+flash/12+')';c.fillRect(0,0,W,H);}
  fx.draw();X.bar('FILM '+film,String(g.score),'PHOTOS '+shots,'#ffe27a','#ffe27a');};
 return g;}});

/* ================= LOBSTER POTS ================= */
A.add({id:'lobsterpots',name:'LOBSTER POTS',cat:'SIM',tags:'fishing boat sea pots lobsters',how:'LEFT/RIGHT SAIL. A DROPS A POT (4 MAX). B OVER A BUOY HAULS IT UP. BEWARE THE OCTOPUS.',make(){
 const g={over:null,score:0},fx=X.fx(),SEA=64,BED=208;let bx=160,pots=[],lob=[],t=0,haul=null,oct={x:-40,on:null,k:0},caught=0;
 for(let i=0;i<6;i++)lob.push({x:rnd(W),vx:(Math.random()<.5?-1:1)*(.2+rnd(.3)),in:null});
 g.update=()=>{t++;const k=A.in(0),h=A.hit(0);bx=cl(bx+ax(k)*1.8,24,W-24);
  if(h.a&&pots.length<4&&!haul){pots.push({x:bx,y:SEA,n:0,age:0});S('jump');}
  if(h.b&&!haul){const p=pots.find(p=>Math.abs(p.x-bx)<14&&p.y>=BED-1);if(p){haul=p;S('blip');}}
  if(haul){haul.y-=2.4;if(haul.y<=SEA){const n=haul.n,pt=n*15+(n>=3?20:0);g.score+=pt;caught+=n;S(n?'coin':'blip');fx.pop(haul.x,SEA-24,n?n+' LOBSTER'+(n>1?'S':'')+' +'+pt:'EMPTY','#ffe27a');for(const l of lob)if(l.in===haul){l.in=null;l.x=Math.random()<.5?-10:W+10;}pots.splice(pots.indexOf(haul),1);haul=null;}}
  for(const p of pots){if(p!==haul&&p.y<BED)p.y=Math.min(BED,p.y+1.6);if(p.y>=BED)p.age++;}
  for(const l of lob){if(l.in)continue;l.x+=l.vx;if(l.x<-10||l.x>W+10)l.vx*=-1;if(Math.random()<.005)l.vx*=-1;for(const p of pots)if(p.y>=BED&&p.n<3&&Math.abs(p.x-l.x)<8&&Math.random()<.04){l.in=p;p.n++;S('blip');}}
  if(!oct.on&&t%600===300){const ps=pots.filter(p=>p.y>=BED&&p.n>0&&p!==haul);if(ps.length){oct.on=ps[ri(ps.length)];oct.k=0;oct.x=oct.on.x<160?-30:W+30;}}
  if(oct.on){const p=oct.on;if(!pots.includes(p)||p===haul){oct.on=null;}else{oct.x+=(p.x-oct.x)*.02;oct.k++;if(Math.abs(oct.x-p.x)<6){for(const l of lob)if(l.in===p){l.in=null;l.x=p.x;}p.n=0;fx.pop(p.x,BED-30,'OCTOPUS ATE THEM!','#ff8aff');S('lose');oct.on=null;}}}else oct.x+=(oct.x<160?-1:1)*1.5;};
 g.draw=()=>{const c=A.c;X.cache('tf_lob',()=>{X.sky(['#6aa8e0','#b8d8f0','#f0e8d0'],SEA);cloud(50,20,.7);cloud(250,30,.8);X.rr(270,40,50,24,0,'#7a8a6a');cottage(280,SEA-24,20,14,'#ffffff','#c84a3a',1);X.vg(0,SEA,W,BED-SEA+30,['#2a8ab8','#1a6a98','#0a3a68']);
   for(let i=0;i<6;i++)shaft(20+i*55,SEA,14,140,.06);X.vg(0,BED,W,H-BED,['#c8b080','#a89060']);for(let i=0;i<14;i++)X.ell(hash(i,1)*W,BED+6+hash(i,2)*24,6+hash(i,3)*10,3,'#8a7a6a');});
  for(let i=0;i<9;i++){const kx=12+i*36;c.strokeStyle='#2a7a4a';c.lineWidth=3;c.beginPath();c.moveTo(kx,BED+4);for(let s=1;s<6;s++)c.lineTo(kx+Math.sin(A.t*.03+s+i)*5,BED+4-s*12);c.stroke();}
  for(const p of pots){X.stroke([[p.x,SEA+2],[p.x,p.y-8]],'rgba(240,230,200,.7)',1);X.rr(p.x-11,p.y-14,22,14,3,'rgba(160,110,60,.9)');c.strokeStyle='#5a3a1a';c.lineWidth=1;for(let q=-8;q<=8;q+=4){c.beginPath();c.moveTo(p.x+q,p.y-14);c.lineTo(p.x+q,p.y);c.stroke();}for(let q=0;q<p.n;q++)X.ell(p.x-6+q*6,p.y-5,3,2,'#e84a2a');ink(c=>c.arc(p.x,SEA-1,4,0,TAU),p===haul?'#ffe27a':'#ff6a2a',.6);if(Math.abs(p.x-bx)<14&&p.y>=BED)T('B',p.x,SEA-16,'#ffe27a',1,'c');}
  for(const l of lob){if(l.in)continue;const d=l.vx>0?1:-1,y=BED+2;X.ell(l.x,y-3,6,2.6,'#c83a2a');X.ell(l.x-d*7,y-3,3,2,'#c83a2a');for(const s of[-1,1])X.ell(l.x+d*8,y-3+s*3,3,1.6,'#e84a2a');for(let q=0;q<3;q++)X.stroke([[l.x-3+q*3,y-1],[l.x-4+q*3,y+1]],'#a82a1a',1);}
  if(oct.on||oct.x>-30&&oct.x<W+30){const ox=oct.x,oy=BED-14;for(let q=0;q<6;q++){c.strokeStyle='#c84ac8';c.lineWidth=3;c.beginPath();c.moveTo(ox-6+q*2.4,oy+4);c.quadraticCurveTo(ox-10+q*4+Math.sin(A.t*.2+q)*4,oy+12,ox-12+q*5,oy+16);c.stroke();}critter(ox,oy+6,9,'#d85ad8',{mood:'mad',seed:5});}
  const bob=Math.sin(A.t*.08)*1.5;c.save();c.translate(bx,SEA+bob);ink(c=>{c.moveTo(-24,-8);c.lineTo(24,-8);c.lineTo(18,4);c.lineTo(-20,4);c.closePath();},X.lg(0,-8,0,4,['#ffffff','#3a6ac8']),.8);X.rr(-4,-22,16,14,2,'#f4f4f8');X.rr(0,-19,8,6,1,'#8ac8f0');X.rr(-24,-9,48,2,0,'#c83a3a');hero(-14,-8,{s:.75,top:'#ffd84a',bot:'#ffd84a',hat:'hood',hatC:'#ffd84a',style:3,seed:141,bob:0,arm:haul?-2.6:-.6});c.restore();
  c.fillStyle='rgba(255,255,255,.5)';for(let i=0;i<20;i++)c.fillRect((i*23+A.t*.4)%W,SEA+Math.sin(A.t*.05+i)*1.5,8,1);
  fx.draw();X.bar('POTS '+(4-pots.length)+' LEFT',String(g.score),'CAUGHT '+caught,'#ffe27a','#ffe27a');};
 return g;}});

/* ================= BELL RINGER ================= */
const BL=[['l','#ff6a8a'],['u','#ffd84a'],['d','#6ae8a8'],['r','#6ab0ff']];
A.add({id:'bellringer',name:'BELL RINGER',cat:'PARTY',tags:'bells rhythm music belfry notes',how:'NOTES FALL TOWARDS FOUR BELLS. PRESS LEFT, UP, DOWN OR RIGHT AS A NOTE REACHES ITS BELL.',make(){
 const g={over:null,score:0},fx=X.fx(),LX=[70,130,190,250],HY=196;let notes=[],t=0,combo=0,miss=0,swing=[0,0,0,0],best=0,beat=0;
 g.update=()=>{t++;const sp=1.3+t/5000,gap=Math.max(14,26-t/400|0);if(t%gap===0){beat++;const r=Math.random();if(r<.75){notes.push({l:ri(4),y:24});if(r<.12&&t>900)notes.push({l:ri(4),y:24});}}
  for(let i=0;i<4;i++)if(swing[i])swing[i]--;const h=A.hit(0);
  for(let i=0;i<4;i++){if(!h[BL[i][0]])continue;swing[i]=24;const n=notes.filter(o=>o.l===i&&!o.done).sort((a,b)=>Math.abs(a.y-HY)-Math.abs(b.y-HY))[0];const d=n?Math.abs(n.y-HY):99;
   if(d<14){n.done=1;combo++;best=Math.max(best,combo);const p=(d<5?30:15)*(1+Math.min(4,combo/10|0));g.score+=p;S(d<5?'coin':'blip');fx.pop(LX[i],HY-40,d<5?'PERFECT':'GOOD',d<5?'#7dff9a':'#ffe27a');fx.ring(LX[i],HY,BL[i][1],20,14);}else{combo=0;S('hit');}}
  for(const n of notes){n.y+=sp;if(!n.done&&n.y>HY+16){n.done=1;miss++;combo=0;fx.pop(LX[n.l],HY+10,'MISS','#ff6a5a');if(miss>=12){g.over='THE CHOIR GAVE UP';return;}}}notes=notes.filter(n=>!n.done);};
 g.draw=()=>{const c=A.c;X.cache('tf_bell',()=>{X.vg(0,0,W,H,['#1a1a3a','#2a2a4a','#3a2a3a']);X.stars(40,3,0,0,100,.6);
   for(let i=0;i<5;i++){const ax2=i*80-40;X.rr(ax2,0,20,H,0,X.lg(ax2,0,ax2+20,0,['#8a7a6a','#a89888','#6a5a4a']));}for(let i=0;i<4;i++)ink(c=>{c.moveTo(i*80-20,240);c.lineTo(i*80-20,60);c.arc(i*80+20,60,40,Math.PI,0);c.lineTo(i*80+60,240);},'rgba(0,0,0,0)',0);
   X.rr(0,0,W,22,0,'#5a4a3a');X.rr(0,224,W,16,0,'#4a3a2a');for(let i=0;i<4;i++){X.rr(LX[i]-1,22,2,HY-44,0,'rgba(255,255,255,.06)');}});
  for(let i=0;i<4;i++){X.rr(LX[i]-14,HY-14,28,28,6,'rgba(255,255,255,.06)');c.strokeStyle=X.rgba(BL[i][1],.5);c.lineWidth=1.5;c.strokeRect(LX[i]-14,HY-14,28,28);}
  for(const n of notes){const x=LX[n.l],col=BL[n.l][1];if(lo())X.glow(x,n.y,12,col,.4);ink(c=>c.arc(x,n.y,7,0,TAU),X.rg(x-2,n.y-2,1,x,n.y,7,['#ffffff',col]),.8);X.rr(x+5,n.y-14,2,14,0,col);}
  for(let i=0;i<4;i++){const s=swing[i]?Math.sin(swing[i]*.4)*.5*(swing[i]/24):Math.sin(A.t*.03+i)*.03;c.save();c.translate(LX[i],HY-30);c.rotate(s);X.rr(-1,-40,2,40,0,'#c8a070');ink(c=>{c.moveTo(-9,10);c.quadraticCurveTo(-9,-6,0,-8);c.quadraticCurveTo(9,-6,9,10);c.lineTo(12,15);c.lineTo(-12,15);c.closePath();},X.lg(-12,0,12,0,['#a8782a','#f8d870','#8a5a1a']),.8);X.disc(0,16,3,'#6a4a1a');c.restore();
   const ar=[[-1,0],[0,-1],[0,1],[1,0]][i];X.poly([[LX[i]+ar[0]*6,HY+ar[1]*6],[LX[i]-ar[1]*5-ar[0]*3,HY+ar[0]*5-ar[1]*3],[LX[i]+ar[1]*5-ar[0]*3,HY-ar[0]*5-ar[1]*3]],BL[i][1]);}
  hero(26,224,{s:1.1,top:'#6a3a2a',bot:'#2a2a3a',hat:'hood',hatC:'#5a3a2a',style:4,seed:151,arm:swing.some(v=>v>12)?-2.8:-1.4,mood:combo>5?'happy':undefined});X.stroke([[30,200],[38,30]],'#c8a070',1.5);
  fx.draw();X.bar(combo>1?'COMBO '+combo:'MISSES '+miss+'/12',String(g.score),'BEST '+best,'#ffe27a','#ffe27a');};
 return g;}});

/* ================= CHIMNEY SWEEP ================= */
A.add({id:'chimneysweep',name:'CHIMNEY SWEEP',cat:'CLASSICS',tags:'rooftops jump runner soot chimneys',how:'RUN THE ROOFTOPS. A JUMPS GAPS. B ON A SMOKING CHIMNEY SWEEPS IT CLEAN. 3 LIVES.',make(){
 const g={over:null,score:0},fx=X.fx(),PX=70;let x=0,y=150,vy=0,roofs=[],t=0,lives=3,inv=0,sweep=0,swept=0;
 const gen=()=>{const l=roofs[roofs.length-1],x0=l?l.x1+24+rnd(34):-40,ry=l?cl(l.y+rnd(60)-30,120,200):160,w=90+rnd(80),ch=[];for(let q=0;q<1+ri(2);q++)ch.push({x:x0+20+rnd(w-40),dirty:Math.random()<.75});roofs.push({x0,x1:x0+w,y:ry,ch,col:['#5a5a6a','#7a3a34','#4a4a5a','#6a4a3a'][ri(4)]});};for(let i=0;i<6;i++)gen();
 const ground=wx=>{const r=roofs.find(r=>wx>=r.x0-2&&wx<=r.x1+2);return r?r.y:999;};
 g.update=()=>{t++;if(inv)inv--;if(sweep)sweep--;const sp=1.7+t/5000;x+=sp;while(roofs[roofs.length-1].x1<x+W+60)gen();roofs=roofs.filter(r=>r.x1>x-60);
  const gy=ground(x+PX);if(A.hit(0).a&&y>=gy-.5&&gy<999){vy=-4.7;S('jump');}vy+=.22;y+=vy;if(y>=gy&&y-vy<=gy+2){y=gy;vy=0;}
  if(A.hit(0).b){const r=roofs.find(r=>r.ch.some(c=>c.dirty&&Math.abs(c.x-(x+PX))<12));if(r&&y>=r.y-24){const ch=r.ch.find(c=>c.dirty&&Math.abs(c.x-(x+PX))<12);ch.dirty=false;sweep=20;swept++;g.score+=20;S('coin');fx.pop(PX,y-44,'SWEPT! +20','#7dff9a');fx.debris(PX+4,y-30,'#2a2a2a',10,1.8);}else S('blip');}
  if(t%20===0)g.score++;if(y>H+20){lives--;S('lose');A.shake=5;if(lives<=0){g.over='TUMBLED OFF THE ROOFS';return;}const r=roofs.find(r=>r.x0>x+PX-10)||roofs[0];x=r.x0-PX+10;y=r.y-40;vy=0;inv=60;fx.pop(PX,120,'OOPS!','#ff8a5a');}};
 g.draw=()=>{const c=A.c;X.cache('tf_sweep',()=>{X.sky(['#2a2a5a','#8a5a7a','#f0a070'],200);X.disc(250,50,16,'#fff4d8');X.glow(250,50,40,'#fff0c0',.3);X.skyline(170,'#4a3a5a',0,6,1);});X.skyline(190,'#3a2a44',x*.3,8,1);
  for(const r of roofs){const rx0=r.x0-x,rx1=r.x1-x;X.rr(rx0,r.y,rx1-rx0,H-r.y,0,X.lg(rx0,0,rx1,0,['#8a6a5a','#a8887a','#6a4a3a']));for(let q=0;q*16<H-r.y-14;q++)for(let w=0;w*22<rx1-rx0-14;w++)X.rr(rx0+6+w*22,r.y+18+q*26,10,12,1,hash(w+r.x0|0,q)<.35?'#ffd880':'#2a2a3a');
   X.poly([[rx0-4,r.y+2],[rx0+8,r.y-10],[rx1-8,r.y-10],[rx1+4,r.y+2]],r.col);c.fillStyle='rgba(0,0,0,.18)';for(let q=rx0+4;q<rx1-4;q+=8)c.fillRect(q,r.y-9,1,10);X.rr(rx0-4,r.y,rx1-rx0+8,3,0,X.lt(r.col,.7));
   for(const ch of r.ch){const cx=ch.x-x;brick(cx-6,r.y-30,12,22,'#a8544a');X.rr(cx-8,r.y-32,16,4,1,'#6a3a34');if(ch.dirty){for(let k=0;k<4;k++){const ph=(A.t*.5+k*18+ch.x)%72;c.globalAlpha=(1-ph/72)*.7;X.disc(cx+Math.sin(ph*.1+k)*4+ph*.15,r.y-36-ph*.6,4+ph*.08,'#3a3a40');}c.globalAlpha=1;}else if(lo()&&A.t%40<20)X.disc(cx,r.y-36,1.5,'#ffffff');}}
  if(!(inv&&A.t%6<3))hero(PX,y,{s:1.05,st:vy?0:A.t*.35,top:'#2a2a34',bot:'#2a2a34',hat:'cap',hatC:'#1a1a22',style:3,skin:'#e8c0a0',seed:161,arm:sweep?-2.8+Math.sin(sweep)*.5:-2,mood:'happy',hold:c=>{X.rr(-1,-24,2,26,0,'#6a4a2a');for(let k=0;k<8;k++){const a=k/8*TAU;X.stroke([[0,-24],[Math.cos(a)*6,-24+Math.sin(a)*6]],'#1a1a1a',1.2);}}});
  fx.draw();X.bar('SWEPT '+swept,String(g.score),'','#ffe27a','#ffe27a');hearts(lives,120);};
 return g;}});

/*NEXT*/
})();
