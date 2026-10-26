/* PIXEL ARCADE - saga pack: XENOSHIFT, a story-driven side-scrolling adventure. A boy finds an alien band that turns him
   into seven different aliens; every obstacle needs the right alien, and every chapter ends in a boss fight. Solo, with
   CPU difficulty setting how hard the enemies and bosses push */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const TAU=Math.PI*2,hyp=Math.hypot;
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const demo=g=>!!(g.auto||A._e&&A._e.state==='title');
const skill=()=>A._e&&A._e.state==='play'?A.ai:.75;
const edge=(h,k)=>{const e={};for(const n of['l','r','u','d','a','b'])e[n]=!!k[n]&&!h.pk[n];h.pk=Object.assign({},k);return e;};
const ebox=e=>e.k==='drone'||e.k==='bat'?{x0:e.x-8,x1:e.x+8,y0:e.y-7,y1:e.y+7}:{x0:e.x-8,x1:e.x+8,y0:e.y-16,y1:e.y};
const ov=(a,b)=>a.x0<b.x1&&a.x1>b.x0&&a.y0<b.y1&&a.y1>b.y0;

const GY=200,GRAV=.22,CELL=16;
// 0 is the boy; 1-7 are the aliens in the band. w/h is the body box, so MITE fits where nobody else can
const FORM=[
 {n:'JAX',col:'#f1c7a3',w:10,h:22,spd:1.5,jmp:4.6,arm:1,cd:20},
 {n:'BLAZE',col:'#ff7a2a',w:12,h:25,spd:1.6,jmp:4.7,arm:.85,cd:22,does:'BURNS THORNS'},
 {n:'GRANITE',col:'#b8bca0',w:18,h:31,spd:1.05,jmp:4.1,arm:.5,cd:30,does:'SMASHES ROCK'},
 {n:'ZIPTAIL',col:'#3a8cff',w:12,h:22,spd:3.2,jmp:4.0,arm:1,cd:28,does:'OUTRUNS COLLAPSES'},
 {n:'SKYWING',col:'#b46aff',w:14,h:22,spd:1.9,jmp:4.4,arm:1,cd:24,does:'FLIES OVER PITS'},
 {n:'MITE',col:'#4affd0',w:8,h:9,spd:1.35,jmp:3.4,arm:1.2,cd:16,does:'FITS IN VENTS'},
 {n:'VOLTEX',col:'#ffe23a',w:12,h:25,spd:1.6,jmp:4.6,arm:.9,cd:24,does:'POWERS GATES'},
 {n:'FROSTBYTE',col:'#8ae8ff',w:12,h:25,spd:1.5,jmp:4.6,arm:.85,cd:24,does:'FREEZES WATER'}];
const NEED={vine:1,rock:2,bridge:3,pit:4,vent:5,gate:6,pool:7};
const MCOST=10,MMIN=20,FLY=85;
const BOSS=[{n:'SCRAPJAW',hp:40,w:64,h:44,weak:6,pts:1500},{n:'GLASSMAW',hp:44,w:60,h:30,weak:2,pts:2000},{n:'KRAGG',hp:60,w:24,h:48,weak:7,pts:3000}];
// the story, chapter by chapter: who speaks (portrait) and what they say
const CH=[
 {name:'BRAMBLE BAY',forms:[1,2,4,6],plan:['vine','rock','pit','gate'],foes:['drone','crawl'],
  card:[['','BRAMBLE BAY. LAST NIGHT A STAR FELL INTO THE WOODS.'],['jax','A WATCH? NO... A BAND. AND IT JUST LOCKED ON MY WRIST!'],
   ['band','XENOLINK ONLINE. SEVEN ALIEN DNA SAMPLES. FOUR UNLOCKED.'],['kragg','THAT BAND BELONGS TO KRAGG. DRONES - BRING IT TO ME!']]},
 {name:'GLOWROOT CAVES',forms:[1,2,3,4,5,6,7],plan:['vent','pool','bridge','rock','vine'],foes:['bat','beetle'],
  card:[['','SCRAPJAW IS SCRAP METAL. BUT A TRACTOR BEAM HITS THE CAVES.'],['band','NEW DNA UNLOCKED: ZIPTAIL, MITE AND FROSTBYTE.'],
   ['jax','THE BEAM COMES FROM UNDER THE HILL. DOWN WE GO!']]},
 {name:'KRAGG WARSHIP',forms:[1,2,3,4,5,6,7],plan:['gate','bridge','vent','pit','pool'],foes:['drone','trooper'],
  card:[['','JAX RIDES THE BEAM UP INTO KRAGG\'S WARSHIP.'],['kragg','YOU WALKED INTO MY FORTRESS, CHILD. HAND OVER THE BAND.'],
   ['jax','NOT A CHANCE, KRAGG. TIME TO SHIFT!']]}];
const END=[['band','WARSHIP CORE OFFLINE. KRAGG IS BEATEN.'],['jax','NEXT TIME, PICK ON SOMEONE YOUR OWN SIZE. ALL SEVEN OF US!']];

/* ---- levels ---- */
// a chapter is built left to right: stretches of hills, steps and small gaps with enemies, then one obstacle per alien
const build=ci=>{const C=CH[ci],L={sol:[],plat:[],ob:[],foe:[],pick:[],x:0,gens:[]};let x=0,gy=GY,n=0;
 const ground=(w,y)=>{const s={x,y,w,h:H+80-y,k:'g'};L.sol.push(s);x+=w;return s;};
 const foe=(k,fx,y,s)=>L.foe.push({k,x:fx,y,y0:y,vx:0,vy:0,hp:k==='drone'||k==='bat'?2:3,cd:80+ri(60),t:ri(200),fz:0,face:-1,s,dead:0,flash:0});
 const run=m=>{for(let i=0;i<m;i++){n++;const r=hash(ci*977+n,1),w=80+Math.floor(hash(ci,n*3)*70);
   gy=i===0?GY:cl(gy+(r<.3?-16:r>.72?16:0),GY-32,GY);const s=ground(w,gy);
   if(hash(n,5+ci)<.55){const px=s.x+12+hash(n,6)*(w-56),py=gy-48-ri(2)*14;L.plat.push({x0:px,x1:px+40,y:py});
    for(let k=0;k<3;k++)L.pick.push({k:k===1&&hash(n,9)<.3?'orb':'gem',x:px+8+k*12,y:py-10});}
   else if(hash(n,7)<.6)L.pick.push({k:hash(n,8)<.25?'heart':'gem',x:s.x+w/2,y:gy-14});
   if(hash(n,4+ci)<.75){const k=C.foes[hash(n,11)<.5?0:1],air=k==='drone'||k==='bat';foe(k,s.x+w*.6,air?gy-58-ri(20):gy,s);}
   if(i<m-1&&hash(n,3)<.4)x+=22+Math.floor(hash(n,12)*7);}
  gy=GY;ground(90,GY);};
 run(2);
 for(const k of C.plan){const o={k,need:NEED[k],done:0};
  if(k==='vine'||k==='rock'){ground(70,GY);Object.assign(o,{x:x-24,y:-300,w:k==='rock'?30:16,h:GY+300,hp:k==='rock'?3:1,burn:0});L.sol.push(o);ground(60,GY);}
  else if(k==='gate'){ground(130,GY);Object.assign(o,{x:x-26,y:-300,w:10,h:GY+300,open:0});const gen={x:x-110,y:GY-30,w:16,h:30,on:0,gate:o};o.gen=gen;L.gens.push(gen);L.sol.push(o);ground(60,GY);}
  else if(k==='vent'){const s=ground(200,GY);Object.assign(o,{x:s.x+50,y:-300,w:100,h:GY-11+300});L.sol.push(o);}
  else if(k==='pit'){ground(30,GY);Object.assign(o,{x,y:GY,w:150,h:60});x+=150;ground(60,GY);}
  else if(k==='pool'){ground(30,GY);Object.assign(o,{x,y:GY,w:256,h:60,cells:new Array(16).fill(0)});x+=256;ground(60,GY);}
  else if(k==='bridge'){ground(60,GY);Object.assign(o,{x,y:GY,w:256,h:60,t:-1,tiles:[]});for(let i=0;i<16;i++){const tl={x:x+i*CELL,y:GY,w:CELL,h:8,k:'tile',i,b:o,gone:0,fy:0,fv:0};o.tiles.push(tl);L.sol.push(tl);}x+=256;ground(60,GY);}
  L.ob.push(o);run(2);}
 // the boss arena: one screen, walled in once the fight starts
 ground(40,GY);L.arena=x;ground(320,GY);ground(80,GY);L.len=L.arena+320;
 L.walls=[{x:L.arena-10,y:-300,w:10,h:GY+300,k:'wall'},{x:L.arena+320,y:-300,w:20,h:GY+300,k:'wall'}];
 return L;};

A.add({id:'xenoshift',name:'XENOSHIFT',cat:'ACTION',time:270,warm:200,tags:'ben 10 ben10 omnitrix alien force ultimate alien hero transform watch powers platformer adventure story boss side scroller',
 how:'MOVE, UP JUMPS (SKYWING FLIES), A ATTACKS. DOWN PICKS AN ALIEN, B TRANSFORMS.',make(){
 const g={over:null,score:0},fx=X.fx(),fw=X.fx();let t=0,ci=0,L=null,cam=0,state='card',card=null,cardI=0,cardT=0,clearT=0,boss=null,lock=0,banner=null,shake=0,hintT=0;
 const P={x:40,y:GY,vx:0,vy:0,gnd:null,face:1,form:0,sel:1,en:100,hp:100,lives:3,cd:0,act:0,inv:0,morph:0,fly:FLY,dash:0,hitD:null,tired:0,pk:{},safe:{x:40,y:GY},trail:[],dialT:0,step:0,unl:[]};
 const shots=[],bad=[],motes=[],zaps=[];
 const box=(o,f)=>{const F=FORM[f===undefined?o.form:f];return{x0:o.x-F.w/2,x1:o.x+F.w/2,y0:o.y-F.h,y1:o.y};};
 const sbox=s=>({x0:s.x,x1:s.x+s.w,y0:s.y,y1:s.y+s.h});
 const solids=()=>lock?L.sol.concat(L.walls):L.sol;
 const gtop=x=>{let y=H+40;for(const s of L.sol)if((s.k==='g'||s.k==='ice'||s.k==='tile')&&x>=s.x&&x<=s.x+s.w&&s.y<y)y=s.y;return y;};
 const pop=(x,y,s,c)=>{if(!demo(g))fx.pop(cl(x-cam,8+s.length*2,W-8-s.length*2),Math.max(28,y),s,c);};
 const hint=s=>{if(hintT>0)return;hintT=70;pop(P.x,P.y-44,s,'#ffe27a');if(!demo(g))S('blip');};
 const startCh=i=>{ci=i;L=build(i);cam=0;boss=null;lock=0;shots.length=bad.length=zaps.length=0;fx.clear();fw.clear();
  Object.assign(P,{x:40,y:GY,vx:0,vy:0,gnd:null,face:1,form:0,en:100,hp:100,cd:0,act:0,inv:60,morph:0,fly:FLY,dash:0,tired:0,safe:{x:40,y:GY}});
  P.unl=CH[i].forms;if(!P.unl.includes(P.sel))P.sel=P.unl[0];
  motes.length=0;for(let k=0;k<30;k++)motes.push({x:rnd(W),y:30+rnd(170),p:rnd(TAU),s:.15+rnd(.35)});
  banner={txt:'CHAPTER '+(i+1)+': '+CH[i].name,t:150};};
 const openCard=(lines,then)=>{card={lines,then};cardI=0;cardT=0;state='card';};
 startCh(0);openCard(CH[0].card,()=>{state='play';});

 /* ---- player ---- */
 const hurt=(dmg,from)=>{if(P.inv>0||P.morph>0||state!=='play')return;const d=dmg*FORM[P.form].arm*(.7+.6*skill());P.hp-=d;P.inv=55;P.vx=(from!==undefined?Math.sign(P.x-from)||-P.face:-P.face)*2.2;P.vy=-2.4;P.gnd=null;P.dash=0;
  shake=Math.max(shake,4);fw.spark(P.x,P.y-12,'#ffd6d6',8,2);if(!demo(g))S('hit');pop(P.x,P.y-38,'-'+Math.round(d),'#ff8a8a');if(P.hp<=0)die();};
 const resetBridges=()=>{for(const o of L.ob)if(o.k==='bridge'&&P.safe.x<o.x){o.t=-1;for(const tl of o.tiles){if(tl.gone){tl.gone=0;tl.fy=0;tl.fv=0;L.sol.push(tl);}}}};
 const respawn=()=>{Object.assign(P,{x:P.safe.x,y:P.safe.y-2,vx:0,vy:0,gnd:null,dash:0,inv:90,fly:FLY});if(lock&&P.x<L.arena+10)P.x=L.arena+30;resetBridges();
  // a respawn inside a wall (a vent, as the wrong alien) drops you back to the boy
  for(const s of solids())if(ov(box(P),sbox(s))){P.form=0;break;}};
 const die=()=>{fw.ring(P.x,P.y-12,'#ffffff',40,22);fw.spark(P.x,P.y-12,FORM[P.form].col,20,3);shake=8;if(!demo(g)){P.lives--;S('boom');}
  if(P.lives<=0&&!demo(g)){g.over='GAME OVER';return;}P.hp=100;P.form=0;P.en=Math.max(P.en,60);respawn();};
 const fall=()=>{if(!demo(g))S('lose');P.hp-=18*(.7+.6*skill());if(P.hp<=0){die();return;}respawn();pop(P.x,P.y-40,'OOF!','#ff8a8a');};
 const morphTo=f=>{
  {const b=box({x:P.x,y:P.y},f);for(const s of solids())if(ov(b,sbox(s))){hint('NO ROOM HERE!');return;}}
  if(P.form===0&&f){if(P.en<MMIN||P.tired>0){hint('BAND RECHARGING');return;}P.en-=MCOST;}else if(f)P.en-=MCOST*.6;
  P.form=f;P.morph=20;P.dash=0;P.act=0;P.fly=FLY;fw.ring(P.x,P.y-14,f?'#7dff6a':'#ffffff',34,20);fw.spark(P.x,P.y-14,f?'#9dff8a':'#ffffff',14,2.8);
  if(!demo(g)){pop(P.x,P.y-46,FORM[f].n,f?FORM[f].col:'#ffffff');S(f?'score':'blip');}};
 // attacks: each alien hits enemies, the boss and the one obstacle it was made for
 const strike=(bx,dmg,f,once)=>{let hit=false;
  for(const e of L.foe)if(!e.dead&&ov(bx,ebox(e))&&(!once||!once.has(e))){if(once)once.add(e);hitFoe(e,dmg,f);hit=true;}
  if(boss&&boss.hp>0&&ov(bx,bbox())&&(!once||!once.has(boss))){if(once)once.add(boss);hitBoss(dmg,f);hit=true;}
  for(const o of L.ob){if(o.done)continue;
   if((o.k==='rock'||o.k==='vine')&&ov(bx,sbox(o))){hit=true;if(o.need===f){if(o.k==='rock'){o.hp--;shake=6;fw.debris(o.x+o.w/2,P.y-16,'#8a8270',10,2.6);if(!demo(g))S('boom');if(o.hp<=0)clearOb(o);}else if(!o.burn){o.burn=1;if(!demo(g))S('shoot');}}else hint('NEEDS '+FORM[o.need].n+'!');}
   if(o.k==='gate'&&!o.gen.on&&ov(bx,sbox(o.gen))){hit=true;if(f===6){o.gen.on=1;S('score');shake=4;fw.ring(o.gen.x+8,o.gen.y+10,'#ffe23a',36,22);}else hint('NEEDS VOLTEX!');}}
  return hit;};
 const clearOb=o=>{o.done=1;const i=L.sol.indexOf(o);if(i>=0)L.sol.splice(i,1);g.score+=150;pop(o.x,GY-60,'+150','#ffe27a');fw.debris(o.x+o.w/2,GY-30,o.k==='rock'?'#8a8270':'#4a6a2a',16,3);};
 const hitFoe=(e,dmg,f)=>{e.hp-=dmg;e.flash=8;if(f===7)e.fz=150;e.vx+=P.face*1.2;
  if(e.hp<=0){e.dead=1;g.score+=50;fw.spark(e.x,e.y-8,'#ffcf3f',12,2.6);fw.debris(e.x,e.y-8,'#3a3a4a',6,2);if(!demo(g))S('boom');
   if(Math.random()<.35)L.pick.push({k:'orb',x:e.x,y:Math.min(e.y,gtop(e.x))-12});}else if(!demo(g))S('hit');};
 const attack=()=>{const f=P.form,F=FORM[f],fr=P.x+P.face*F.w/2;P.cd=F.cd;P.act=12;
  if(f===0||f===5){strike({x0:Math.min(fr,fr+P.face*(f?12:16)),x1:Math.max(fr,fr+P.face*(f?12:16)),y0:P.y-F.h,y1:P.y},1,f);if(!demo(g))S('blip');}
  else if(f===1){shots.push({k:'fire',x:fr,y:P.y-16,vx:P.face*3.8,vy:0,life:80});if(!demo(g))S('shoot');}
  else if(f===2){const b={x0:Math.min(fr,fr+P.face*24),x1:Math.max(fr,fr+P.face*24),y0:P.y-32,y1:P.y};if(!strike(b,4,2)&&!demo(g))S('blip');fw.ring(fr+P.face*12,P.y-16,'#d8c8a0',16,10);}
  else if(f===3){P.dash=14;P.hitD=new Set();if(!demo(g))S('jump');}
  else if(f===4){strike({x0:Math.min(fr,fr+P.face*58),x1:Math.max(fr,fr+P.face*58),y0:P.y-30,y1:P.y+6},1.5,4);shots.push({k:'sonic',x:fr,y:P.y-14,vx:P.face*3,vy:0,life:18});if(!demo(g))S('blip');}
  else if(f===6){shots.push({k:'bolt',x:fr,y:P.y-15,vx:P.face*6.5,vy:0,life:50});if(!demo(g))S('shoot');}
  else{// frost breath: freezes enemies and turns the water ahead into ice you can walk on
   strike({x0:Math.min(fr,fr+P.face*50),x1:Math.max(fr,fr+P.face*50),y0:P.y-24,y1:P.y+4},1.2,7);
   for(let k=0;k<12;k++)shots.push({k:'frost',x:fr,y:P.y-14,vx:P.face*(2+rnd(2)),vy:rnd(1.6)-.2,life:16+ri(8)});
   for(const o of L.ob)if(o.k==='pool'){for(let c=0;c<16;c++){const cx=o.x+c*CELL+8;if(!o.cells[c]&&(P.face>0?cx>fr-4&&cx<fr+52:cx<fr+4&&cx>fr-52)){o.cells[c]=1;L.sol.push({x:o.x+c*CELL,y:GY,w:CELL,h:10,k:'ice'});fw.spark(cx,GY,'#dff8ff',5,1.6);}}
    if(o.cells.every(v=>v)&&!o.done){o.done=1;g.score+=150;pop(o.x+o.w/2,GY-50,'+150','#ffe27a');}}
   if(!demo(g))S('shoot');}};
 const updP=(k,e)=>{const F=FORM[P.form];
  if(P.inv>0)P.inv--;if(P.cd>0)P.cd--;if(P.act>0)P.act--;if(P.morph>0){P.morph--;P.vx*=.8;}if(P.dialT>0)P.dialT--;
  // the band: aliens burn energy, the boy recharges it, and an empty band turns you back
  if(P.form){P.en-=.055*(.8+.4*skill())+(P.form===4&&!P.gnd&&k.u?.08:0);if(P.en<=0){P.en=0;morphTo(0);P.tired=90;pop(P.x,P.y-48,'TIMED OUT!','#ff6a5a');}}
  else{P.en=Math.min(100,P.en+.33*(P.tired>0?.5:1));if(P.tired>0)P.tired--;}
  if(e.d){const u=P.unl,i=u.indexOf(P.sel);P.sel=u[(i+1)%u.length];P.dialT=70;if(!demo(g))S('blip');}
  if(e.b&&P.morph<=0){if(P.form&&P.sel===P.form)morphTo(0);else morphTo(P.sel);}
  const can=P.morph<=0,dir=can?(k.r?1:0)-(k.l?1:0):0;
  if(P.dash>0){P.dash--;P.vx=P.face*6.4;if(lo())P.trail.push({x:P.x,y:P.y,t:12});strike({x0:P.x-10,x1:P.x+10,y0:P.y-20,y1:P.y},2,3,P.hitD);}
  else if(dir){P.vx+=(dir*F.spd-P.vx)*(P.gnd?.32:.14);P.face=dir;}else P.vx*=P.gnd?.72:.96;
  if(can&&e.u&&P.gnd){P.vy=-F.jmp;P.gnd=null;if(!demo(g))S('jump');if(lo())fw.ring(P.x,P.y,'#ffffff',8,8);}
  if(can&&e.a&&P.cd<=0)attack();
  // SKYWING flies while UP is held, until its wings tire; landing rests them
  // SKYWING's wings tire from takeoff to landing, so it can cross a pit but not a lake
  if(P.form===4&&!P.gnd&&P.fly>0)P.fly--;
  const fly=P.form===4&&!P.gnd&&k.u&&can&&P.fly>0&&P.vy>-4;
  if(fly)P.vy=Math.max(-1.8,P.vy-.42);
  P.vy=Math.min(6,P.vy+GRAV);
  // move and collide: x first, then y
  const sl=solids();P.x+=P.vx;let b=box(P);
  for(const s of sl){const r=sbox(s);if(ov(b,r)){if(s.k==='vine'){hurt(10,s.x+s.w/2);}
    if(s.k==='vent'&&P.form!==5)hint('TOO BIG! TRY MITE');else if(s.k==='rock'&&P.form!==2)hint('A ROCKSLIDE! GRANITE?');else if(s.k==='gate'&&!s.gen.on)hint('THE GATE NEEDS POWER');
    if(P.x<s.x+s.w/2)P.x=s.x-FORM[P.form].w/2-.01;else P.x=s.x+s.w+FORM[P.form].w/2+.01;P.vx=0;if(P.dash)P.dash=0;b=box(P);}}
  const py=P.y;P.y+=P.vy;b=box(P);P.gnd=null;
  for(const s of sl){const r=sbox(s);if(ov(b,r)){if(P.vy>=0&&py<=s.y+.5){P.y=s.y;P.vy=0;P.gnd=s;}else if(P.vy<0){P.y=s.y+s.h+FORM[P.form].h;P.vy=0;}b=box(P);}}
  if(!P.gnd&&P.vy>=0)for(const p of L.plat)if(P.x>=p.x0-2&&P.x<=p.x1+2&&py<=p.y+.01&&P.y>=p.y){P.y=p.y;P.vy=0;P.gnd=p;break;}
  if(P.gnd){P.fly=FLY;if(py<P.y-3&&lo())for(let q=0;q<3;q++)motes.push({x:P.x+rnd(8)-4,y:P.y-1,dust:16,vx:rnd(1)-.5,w:1});}
  if(P.y-FORM[P.form].h<20){P.y=20+FORM[P.form].h;P.vy=Math.max(0,P.vy);}
  if(P.x<6)P.x=6;
  const g0=P.gnd;if(g0&&g0.k==='g'&&!L.ob.some(o=>o.k==='vent'&&P.x>o.x-10&&P.x<o.x+o.w+10)&&P.x>g0.x+14&&P.x<g0.x+g0.w-14)P.safe={x:P.x,y:g0.y};
  if(g0&&g0.k==='tile'&&g0.b.t<0)g0.b.t=0;
  // falling into a pit, or into the water
  for(const o of L.ob)if(o.k==='pool'&&P.x>o.x&&P.x<o.x+o.w&&P.y>GY+5){if(lo())fw.spark(P.x,GY,ci===1?'#4affd0':'#7ad8ff',14,2.4);fall();return;}
  if(P.y>H+20){fall();return;}
  // pickups
  for(let i=L.pick.length-1;i>=0;i--){const q=L.pick[i];if(Math.abs(q.x-P.x)<10&&Math.abs(q.y-(P.y-FORM[P.form].h/2))<14){L.pick.splice(i,1);
   if(q.k==='gem'){g.score+=25;if(!demo(g))S('coin');fw.spark(q.x,q.y,'#7adfff',6,1.6);}
   else if(q.k==='orb'){P.en=Math.min(100,P.en+35);P.tired=0;if(!demo(g))S('coin');fw.ring(q.x,q.y,'#7dff6a',20,14);pop(q.x,q.y-20,'ENERGY','#9dff8a');}
   else{P.hp=Math.min(100,P.hp+30);if(!demo(g))S('coin');fw.ring(q.x,q.y,'#ff6a8a',20,14);}}}
  // obstacles you get past count as beaten
  for(const o of L.ob)if(!o.done&&(o.k==='pit'||o.k==='bridge'||o.k==='vent')&&P.x>o.x+o.w+8&&P.gnd&&P.gnd.k==='g'){o.done=1;g.score+=150;pop(P.x,P.y-40,'+150','#ffe27a');}
  if(P.x>L.arena+30&&!boss&&state==='play')startBoss();
  for(const tr of P.trail)tr.t--;while(P.trail.length&&P.trail[0].t<=0)P.trail.shift();};

 /* ---- enemies ---- */
 const updFoes=()=>{const sk=skill();
  for(const e of L.foe){if(e.dead||Math.abs(e.x-P.x)>300)continue;e.t++;if(e.flash>0)e.flash--;
   if(e.fz>0){e.fz--;continue;}
   const dx=P.x-e.x;
   if(e.k==='drone'||e.k==='bat'){e.vx+=Math.sign(dx-(dx>0?60:-60))*.03;e.vx=cl(e.vx,-.5-.5*sk,.5+.5*sk);e.x+=e.vx;e.y=e.y0+Math.sin(e.t*.05)*8;e.face=dx>0?1:-1;
    if(--e.cd<=0&&Math.abs(dx)<180){e.cd=Math.round(170-80*sk+ri(50));const a=Math.atan2(P.y-12-e.y,dx),v=1.4+.9*sk;bad.push({k:e.k==='bat'?'spore':'plasma',x:e.x,y:e.y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:160});}}
   else{const sp=.35+.35*sk;if(Math.abs(dx)<110&&Math.abs(P.y-e.y)<40)e.face=dx>0?1:-1;
    if(e.k==='trooper'&&Math.abs(dx)<60){e.face=dx>0?1:-1;}else e.x+=e.face*sp;
    if(e.s){if(e.x<e.s.x+8){e.x=e.s.x+8;e.face=1;}if(e.x>e.s.x+e.s.w-8){e.x=e.s.x+e.s.w-8;e.face=-1;}}
    if(e.k==='trooper'&&--e.cd<=0&&Math.abs(dx)<170&&Math.abs(P.y-e.y)<30){e.cd=Math.round(150-70*sk+ri(40));e.face=dx>0?1:-1;bad.push({k:'plasma',x:e.x+e.face*8,y:e.y-13,vx:e.face*(2+sk),vy:0,life:120});}}
   if(ov(box(P),ebox(e)))hurt(12,e.x);}
  for(let i=bad.length-1;i>=0;i--){const s=bad[i];s.life--;s.x+=s.vx;s.y+=s.vy;if(s.k==='bomb'||s.k==='shard')s.vy+=s.k==='bomb'?.12:.05;let dead=s.life<=0;
   if(s.k==='wave'){if(Math.abs(s.x-P.x)<8&&P.y>GY-10)hurt(14,s.x),dead=true;if(lo()&&t%3===0)fw.debris(s.x,s.y-1,ci===1?'#9adfff':'#8a7a5a',1,1.2);}
   else{if(Math.abs(s.x-P.x)<FORM[P.form].w/2+3&&s.y>P.y-FORM[P.form].h-3&&s.y<P.y+2){hurt(s.k==='bomb'?18:11,s.x);dead=true;}
    if(s.y>=gtop(s.x)){if(s.k==='bomb'){fw.ring(s.x,s.y,'#ffb34a',26,16);fw.spark(s.x,s.y,'#ffcf3f',10,2.4);shake=Math.max(shake,3);if(Math.abs(s.x-P.x)<20&&P.y>s.y-30)hurt(16,s.x);if(!demo(g))S('boom');}dead=true;}}
   if(dead)bad.splice(i,1);}};

 /* ---- bosses ---- */
 // GLASSMAW hangs below the cave roof by its feet, so its body box sits under y while it is up there
const bbox=()=>{const B=BOSS[boss.i];if(boss.st==='ceil')return{x0:boss.x-B.w/2,x1:boss.x+B.w/2,y0:boss.y+14,y1:boss.y+14+B.h};return{x0:boss.x-B.w/2,x1:boss.x+B.w/2,y0:boss.y-B.h,y1:boss.y};};
 const startBoss=()=>{const B=BOSS[ci];lock=1;const hp=Math.round(B.hp*(.8+.45*skill()));boss={i:ci,x:L.arena+250,y:ci===1?14:GY,vx:0,vy:0,hp,max:hp,st:ci===1?'ceil':'walk',st_t:0,face:-1,flash:0,fz:0,fzcd:0,legs:0};
  banner={txt:B.n+'!',sub:'WEAK TO '+FORM[B.weak].n,t:170,boss:1};if(!demo(g))S('boom');};
 const hitBoss=(dmg,f)=>{const B=BOSS[boss.i];if(boss.st==='dead')return;let m=1;if(f===B.weak){m=2.5;if(boss.i===2&&boss.fzcd<=0){boss.fz=50;boss.fzcd=170;}}if(boss.st==='stuck')m*=1.5;
  const d=dmg*m;boss.hp-=d;boss.flash=8;g.score+=Math.round(d*10);if(m>=2.5)pop(boss.x,boss.y-BOSS[boss.i].h-12,'WEAK SPOT!','#ffe27a');if(!demo(g))S('hit');fw.spark(boss.x+rnd(20)-10,boss.y-BOSS[boss.i].h/2,'#ffffff',8,2.4);
  if(boss.hp<=0){boss.hp=0;boss.st='dead';boss.st_t=0;g.score+=B.pts;pop(boss.x,boss.y-60,'+'+B.pts,'#ffe27a');}};
 const shock=(x,y)=>{for(const d of[-1,1])bad.push({k:'wave',x:x+d*14,y,vx:d*(2.2+skill()),vy:0,life:90});shake=Math.max(shake,6);fw.ring(x,y,'#d8c8a0',40,18);fw.debris(x,y-2,'#8a7a5a',12,2.4);if(!demo(g))S('boom');};
 const updBoss=()=>{const b=boss,B=BOSS[b.i],sk=skill(),dx=P.x-b.x,ax=L.arena;b.st_t++;if(b.flash>0)b.flash--;if(b.fzcd>0)b.fzcd--;
  if(b.st==='dead'){if(b.st_t%8===0){fw.spark(b.x+rnd(B.w)-B.w/2,b.y-rnd(B.h),'#ffcf3f',10,3);fw.ring(b.x+rnd(B.w)-B.w/2,b.y-rnd(B.h),'#ffb34a',20,14);shake=4;if(!demo(g))S('boom');}
   if(b.st_t>=110){fx.flash('#ffffff',10);fw.debris(b.x,b.y-B.h/2,'#4a4458',24,3.4);boss=null;lock=0;
    if(demo(g)){startCh((ci+1)%3);state='play';return;}
    clearT=0;state='clear';}return;}
  if(b.fz>0){b.fz--;return;}
  const set=s=>{b.st=s;b.st_t=0;};
  if(b.i===0){// SCRAPJAW: rolls up, revs and charges into the wall, and lobs bombs
   if(b.st==='walk'){b.face=dx>0?1:-1;b.x+=b.face*(.5+.4*sk);if(b.st_t>80+ri(40))set(Math.abs(dx)>80||Math.random()<.5?'rev':'mortar');}
   else if(b.st==='rev'){if(b.st_t>40-12*sk){set('charge');}}
   else if(b.st==='charge'){b.x+=b.face*(2.6+1.4*sk);if(b.x-B.w/2<ax+2||b.x+B.w/2>ax+318){b.x=cl(b.x,ax+2+B.w/2,ax+318-B.w/2);set('stuck');shock(b.x+b.face*B.w/2,GY);}}
   else if(b.st==='stuck'){if(b.st_t>100-30*sk)set('walk');}
   else if(b.st==='mortar'){if(b.st_t%16===8&&b.st_t<50){const tx=P.x+rnd(50)-25,tt=60,vx=(tx-b.x)/tt;bad.push({k:'bomb',x:b.x,y:b.y-B.h,vx,vy:-.12*tt/2,life:200});if(!demo(g))S('shoot');}if(b.st_t>70)set('walk');}
   const hb=bbox();if(ov(box(P),hb))hurt(b.st==='charge'?22:14,b.x);}
  else if(b.i===1){// GLASSMAW: hangs from the cave roof spitting shards, drops with a quake, then climbs back up
   if(b.st==='ceil'){b.y=14;b.x+=cl(dx,-1,1)*(.8+.6*sk);if(b.st_t%Math.round(80-30*sk)===40){for(const a of[-.5,0,.5])bad.push({k:'shard',x:b.x,y:b.y+36,vx:Math.sin(a)*1.6+cl(dx*.01,-1,1),vy:1.4,life:200});if(!demo(g))S('shoot');}
    if(b.st_t>(Math.abs(dx)<40?120:260))set('drop');}
   else if(b.st==='drop'){b.vy=Math.min(8,b.vy+.4);b.y+=b.vy;if(b.y>=GY){b.y=GY;b.vy=0;shock(b.x,GY);set('ground');}}
   else if(b.st==='ground'){b.face=dx>0?1:-1;b.x+=b.face*(.4+.3*sk);if(b.st_t>150-40*sk)set('climb');}
   else if(b.st==='climb'){b.y-=1.8;if(b.y<=14+B.h+12){b.y=14;set('ceil');}}
   b.x=cl(b.x,ax+B.w/2+2,ax+318-B.w/2);if(ov(box(P),bbox()))hurt(b.st==='drop'?22:12,b.x);}
  else{// KRAGG: sword fighter on the ground; below half health his jetpack takes him up to rain plasma
   const air=b.hp<b.max/2;
   if(b.st==='walk'){b.face=dx>0?1:-1;b.x+=b.face*(.65+.45*sk);b.y=GY;if(Math.abs(dx)<44)set('wind');else if(b.st_t>150)set('leap');else if(air&&b.st_t>60)set('fly');}
   else if(b.st==='wind'){if(b.st_t>26-10*sk)set('slash');}
   else if(b.st==='slash'){if(b.st_t===2){const bx={x0:b.face>0?b.x:b.x-50,x1:b.face>0?b.x+50:b.x,y0:b.y-44,y1:b.y};if(ov(box(P),bx))hurt(22,b.x);fw.ring(b.x+b.face*26,b.y-22,'#ff5a5a',26,10);if(!demo(g))S('shoot');}if(b.st_t>34)set('walk');}
   else if(b.st==='leap'){if(b.st_t===1){b.vy=-5.5;b.vx=cl(dx/50,-3,3);}b.vy+=GRAV;b.x+=b.vx;b.y+=b.vy;if(b.y>=GY&&b.vy>0){b.y=GY;shock(b.x,GY);set('walk');}}
   else if(b.st==='fly'){b.y+=(96+Math.sin(b.st_t*.04)*14-b.y)*.05;const tx=P.x+(P.x<ax+160?70:-70);b.x+=cl(tx-b.x,-1.4,1.4);b.face=dx>0?1:-1;
    if(b.st_t%Math.round(100-35*sk)===50){const a=Math.atan2(P.y-12-(b.y-30),dx);for(const o of[-.22,0,.22])bad.push({k:'plasma',x:b.x,y:b.y-30,vx:Math.cos(a+o)*(2+sk),vy:Math.sin(a+o)*(2+sk),life:150});if(!demo(g))S('shoot');}
    if(b.st_t>300){set('dive');b.vy=0;}}
   else if(b.st==='dive'){b.x+=cl(dx,-2,2);b.vy=Math.min(8,b.vy+.35);b.y+=b.vy;if(b.y>=GY){b.y=GY;b.vy=0;shock(b.x,GY);set('walk');}}
   b.x=cl(b.x,ax+B.w/2+2,ax+318-B.w/2);if(ov(box(P),bbox())&&b.st!=='slash')hurt(13,b.x);}};

 /* ---- the autopilot for the attract demo: reads the next obstacle and picks the alien for it ---- */
 const brain=()=>{const k={},F=P.form;
  const o=L.ob.find(o=>(!o.done||o.k==='vent'||o.k==='pit'||o.k==='bridge')&&o.x+o.w>P.x-6);
  const want=boss?BOSS[boss.i].weak:o&&o.x-P.x<130?o.need:0;
  const sw=want&&F!==want&&P.unl.includes(want)&&P.morph<=0;
  // pick on the dial with DOWN, then B; an alien that is low on energy turns back first to recharge
  const pick=f=>{if(P.sel!==f){if(t%6===0)k.d=1;}else if(t%6===3)k.b=1;};
  const low=F===0?P.en<55||P.tired>0:P.en<30;
  if(sw&&!low)pick(want);else if(sw&&F)pick(F);
  if(!want&&F&&P.morph<=0&&(P.en<70||!L.foe.some(e=>!e.dead&&Math.abs(e.x-P.x)<120)))pick(F);
  const waitE=sw&&low;
  if(boss){const B=BOSS[boss.i],dx=boss.x-P.x,rng=boss.i===1&&boss.st==='ceil'?70:[0,80,20,60,40,12,90,40][F];
   if(boss.st==='dead')return k;
   const away=boss.st==='charge'||boss.st==='drop'||boss.st==='leap'||boss.st==='dive';
   if(Math.abs(Math.abs(dx)-rng-B.w/2)>10){const d=(Math.abs(dx)>rng+B.w/2)===(dx>0)?'r':'l';if(!(d==='l'&&P.x<L.arena+16||d==='r'&&P.x>L.arena+304))k[d]=1;}
   if(Math.abs(dx)<B.w/2+rng+20&&P.cd<=0&&t%3===0){if(Math.sign(dx)!==P.face&&!k.l&&!k.r)k[dx>0?'r':'l']=1;else k.a=1;}
   if(away&&Math.abs(dx)<90&&P.gnd)k.u=1;
   for(const s of bad)if(s.k==='wave'&&Math.abs(s.x-P.x)<30&&Math.sign(P.x-s.x)===Math.sign(s.vx)&&P.gnd)k.u=1;
   return k;}
  if(waitE)return k;
  let go=1;
  if(o&&F===o.need){const d=o.x-P.x;
   if(o.k==='rock'){if(d<18){go=0;if(P.cd<=0)k.a=1;}}
   else if(o.k==='vine'){if(d<60){go=0;if(P.cd<=0)k.a=1;}}
   else if(o.k==='gate'){const gd=o.gen.x-P.x;if(!o.gen.on){if(gd<70&&gd>10){go=0;if(P.face<0)k.r=1;else if(P.cd<=0)k.a=1;}else if(gd<=10){go=0;k.l=1;}}}
   else if(o.k==='pool'){const fr=P.x+FORM[F].w/2+6;if(fr>o.x&&fr<o.x+o.w&&gtop(fr)>GY+2){go=0;if(P.cd<=0)k.a=1;}}
   else if(o.k==='pit'){if(P.gnd&&d>-4&&d<12)k.u=1;}}
  else if(o&&o.x-P.x<26&&o.need&&!(o.k==='pit'||o.k==='pool'||o.k==='bridge')&&F!==o.need)go=0;
  else if(o&&(o.k==='pit'||o.k==='pool'||o.k==='bridge')&&F!==o.need&&o.x-P.x<20)go=0;
  if(go)k.r=1;
  // enemies ahead get hit, steps and small gaps get jumped
  const e=L.foe.find(e=>!e.dead&&e.x>P.x-10&&e.x-P.x<(F===1||F===6?120:F===4?60:22)&&Math.abs(e.y-P.y)<(F===1||F===6?16:30));
  if(e&&P.cd<=0&&F!==3)k.a=1;
  if(e&&!F&&e.x-P.x<40&&P.gnd&&e.k!=='drone'&&e.k!=='bat')k.u=1;
  if(go&&P.gnd){const fr=P.x+FORM[F].w/2+4,wet=o&&(o.k==='pool'||o.k==='bridge')&&P.x>o.x-40;if(gtop(fr+6)>P.y+40&&!wet)k.u=1;for(const s of solids())if(s.k==='g'&&s.y<P.y-2&&fr+6>s.x&&fr<s.x)k.u=1;}
  if(!P.gnd&&F===4&&o&&o.k==='pit'&&P.x>o.x-30&&P.x<o.x+o.w+10&&P.y>GY-70)k.u=1;
  return k;};

 g.update=()=>{t++;if(shake>0)shake*=.85;if(shake<.3)shake=0;if(hintT>0)hintT--;if(banner&&--banner.t<=0)banner=null;
  for(const m of motes){if(m.dust){m.dust--;m.x+=m.vx;m.y-=.2;}else{m.p+=.02;m.x+=Math.sin(m.p)*m.s;m.y+=Math.cos(m.p*1.3)*.2;}}
  for(let i=motes.length-1;i>=0;i--)if(motes[i].dust===0)motes.splice(i,1);
  const k=demo(g)?brain():A.in(0),e=edge(P,k);
  // story cards and the chapter-clear screen don't eat into the round clock
  if(state!=='play'&&!demo(g)&&A.clock&&A.setClock&&A.clock()>0)A.setClock(A.clock()+1);
  if(state==='card'){cardT++;const L_=card.lines[cardI],need=Math.max(70,L_[1].length*2.4);
   if(cardT>(demo(g)?45:need+120)||cardT>16&&(e.a||e.b)){cardI++;cardT=0;if(cardI>=card.lines.length){card.then();}}return;}
  if(state==='clear'){clearT++;if(clearT===1){const sec=Math.floor(A.clock()/60);if(ci===2){g.score+=sec*10+P.lives*500;openCard(END,()=>{g.over='SAGA COMPLETE!';});return;}}
   if(clearT>130||clearT>30&&e.a){startCh(ci+1);openCard(CH[ci].card,()=>{state='play';});}return;}
  updP(k,e);if(g.over)return;
  if(boss)updBoss();updFoes();
  // the bridges crumble from the near end at a pace only ZIPTAIL outruns
  for(const o of L.ob)if(o.k==='bridge'){if(o.t>=0){o.t++;for(const tl of o.tiles)if(!tl.gone&&o.t>8+tl.i*6.2){tl.gone=1;const j=L.sol.indexOf(tl);if(j>=0)L.sol.splice(j,1);if(lo())fw.debris(tl.x+8,GY+2,'#6a5038',3,1.4);}}
   for(const tl of o.tiles)if(tl.gone&&tl.fy<200){tl.fv+=.25;tl.fy+=tl.fv;}}
  for(const o of L.ob){if(o.k==='vine'&&o.burn&&!o.done){o.burn++;if(lo()&&t%3===0)fw.spark(o.x+o.w/2+rnd(14)-7,30+rnd(GY-30),'#ffb34a',2,1.4);if(o.burn>45)clearOb(o);}
   if(o.k==='gate'&&o.gen.on&&!o.done){o.open=Math.min(1,o.open+.04);if(o.open>=1)clearOb(o);}}
  // player shots
  for(let i=shots.length-1;i>=0;i--){const s=shots[i];s.life--;s.x+=s.vx;s.y+=s.vy;let dead=s.life<=0||s.x<cam-20||s.x>cam+W+20;
   if(s.k==='fire'||s.k==='bolt'){if(lo()&&t%2===0)motes.push({x:s.x,y:s.y,dust:10,vx:-s.vx*.1,w:s.k==='fire'?2:3});
    const bx={x0:s.x-4,x1:s.x+4,y0:s.y-4,y1:s.y+4};if(!dead&&strike(bx,2,s.k==='fire'?1:6)){dead=true;fw.spark(s.x,s.y,s.k==='fire'?'#ffb34a':'#fff27a',8,2.2);
     if(s.k==='bolt'){const n=L.foe.find(e=>!e.dead&&hyp(e.x-s.x,e.y-8-s.y)<80&&hyp(e.x-s.x,e.y-8-s.y)>10);if(n){hitFoe(n,1,6);zaps.push({x0:s.x,y0:s.y,x1:n.x,y1:n.y-8,t:10});}}}
    if(!dead)for(const so of solids())if(so.k!=='vine'&&so.k!=='rock'&&ov(bx,sbox(so))){dead=true;fw.spark(s.x,s.y,'#ffcf3f',4,1.4);break;}}
   if(dead)shots.splice(i,1);}
  for(let i=zaps.length-1;i>=0;i--)if(--zaps[i].t<=0)zaps.splice(i,1);
  // the camera: leads the hero, and locks to the arena for the boss
  const tc=lock?L.arena:cl(P.x-120+P.face*20,0,L.len-W);cam+=(tc-cam)*(lock?.08:.12);
  if(demo(g)&&P.y>H+10)respawn();};
 g._P=P;g._L=()=>L;g._boss=()=>boss;g._ch=()=>ci;g._st=()=>state;g.fxClear=()=>{fx.clear();fw.clear();};
 g._skip=n=>{startCh(n);state='play';};

 /* ---- scenery ---- */
 const backdrop=i=>X.cache('xeno_bg'+i,()=>{const c=A.c;
  if(i===0){// dusk over a little seaside town
   X.sky(['#1a1440','#4a2a6a','#b84a5a','#ff9a4a','#ffd08a'],170);X.stars(30,4,0,0,70,.6);
   X.glow(220,132,90,'#ffb46a',.35);X.disc(220,132,22,X.rg(214,126,2,220,132,22,['#fff6d0','#ffd07a','#ff8a4a']));
   for(let k=0;k<6;k++){const y=60+k*14,x=hash(k,2)*W;c.fillStyle='rgba(255,180,160,'+(.14-k*.015)+')';X.ell(x,y,60+hash(k,3)*50,4,'rgba(120,60,110,.35)');X.ell(x+10,y-2,40,2,'rgba(255,190,150,.25)');}
   X.vg(0,150,W,30,['#5a4a8a','#2a2a5a']);c.fillStyle='rgba(255,210,150,.4)';for(let k=0;k<26;k++)c.fillRect(200+rnd(40)-hash(k,1)*20,152+hash(k,2)*24,4+hash(k,4)*8,1);
   X.hills(156,26,'#3a2a5a',0,.02,3);}
  else if(i===1){// a glowing cavern
   X.sky(['#060a14','#0a1a2a','#10283a','#0a1424'],H);
   for(let k=0;k<5;k++)X.glow(hash(k,1)*W,60+hash(k,2)*120,50+hash(k,3)*40,k%2?'#3affb0':'#7a5aff',.12);
   for(let k=0;k<40;k++){const x=hash(k,5)*W,h=20+hash(k,6)*60;X.poly([[x-8,0],[x+8,0],[x+1,h]],'#08121e');}
   for(let k=0;k<30;k++){c.fillStyle='rgba(120,255,210,'+(.2+hash(k,7)*.5)+')';c.fillRect(hash(k,8)*W,hash(k,9)*180,1,1);}}
  else{// the warship's bridge window: a planet, a moon and the fleet
   X.sky(['#02030a','#060a1e','#0a1030'],H);X.stars(110,7,0,0,H,1);
   X.glow(90,250,170,'#4a8aff',.25);X.disc(90,290,120,X.rg(60,240,10,90,290,120,['#7ab8ff','#2a5aa8','#0a1a3a']));
   c.fillStyle='rgba(255,255,255,.25)';for(let k=0;k<8;k++)X.ell(40+hash(k,1)*100,190+hash(k,2)*40,14+hash(k,3)*20,2,'rgba(255,255,255,.18)');
   X.disc(250,60,10,X.rg(246,56,1,250,60,10,['#e8e8f0','#9a9ab0','#4a4a5a']));
   for(let k=0;k<5;k++){const x=160+hash(k,4)*150,y=90+hash(k,5)*50,s=4+hash(k,6)*6;X.poly([[x-s*2,y],[x+s*2,y-s*.4],[x+s*2.4,y],[x+s*2,y+s*.4]],'#1a2240');c.fillStyle='#ff6a4a';c.fillRect(x-s*2,y-.5,1.5,1);}}
  X.vignette(.3);});
 const midlayer=()=>{const c=A.c;
  if(ci===0){// the town on the hill, then dark pines in front
   const o1=cam*.25;for(let k=Math.floor(o1/46)-1;k<Math.floor(o1/46)+9;k++){const x=k*46-o1,h=hash(k,21),bh=22+h*24,y=170-bh;
    X.poly([[x,170],[x,y],[x+12,y-10-h*6],[x+24,y],[x+24,170]],'#2a2048');c.fillStyle='rgba(255,200,120,.75)';for(let w=0;w<3;w++)if(hash(k,w)<.6)c.fillRect(x+4+w*7,y+6+(w%2)*8,3,4);
    if(k%7===3){c.fillStyle='#1e1838';c.fillRect(x+30,108,8,62);c.fillStyle=t%60<30?'#ffe27a':'#ffb34a';c.fillRect(x+30,104,8,5);if(lo())X.glow(x+34,106,22,'#ffe27a',.4);}}
   const o2=cam*.5;for(let k=Math.floor(o2/30)-1;k<Math.floor(o2/30)+12;k++){const x=k*30-o2,h=hash(k,31),th=40+h*40;X.poly([[x-12,190],[x,190-th],[x+12,190]],'#1a1430');X.poly([[x-8,190-th*.45],[x,190-th],[x+8,190-th*.45]],'#241c40');}}
  else if(ci===1){// crystal columns and mushrooms
   const o1=cam*.3;for(let k=Math.floor(o1/60)-1;k<Math.floor(o1/60)+7;k++){const x=k*60-o1,h=hash(k,41);c.fillStyle='#0c1826';c.fillRect(x+10,0,14+h*12,H);
    const cx=x+20,cy=120+h*50;X.poly([[cx-6,cy],[cx,cy-18-h*10],[cx+6,cy]],'rgba(80,220,255,.45)');if(lo())X.glow(cx,cy-8,20,'#4affd0',.18);}
   // glowing roots hanging from the roof, swaying, with bulbs of light
   const o4=cam*.45;for(let k=Math.floor(o4/52)-1;k<Math.floor(o4/52)+8;k++){const x=k*52-o4+hash(k,71)*30,len=30+hash(k,72)*70,sw=Math.sin(t*.02+k)*3;
    c.strokeStyle='rgba(30,70,70,.9)';c.lineWidth=1.4;c.beginPath();c.moveTo(x,18);c.quadraticCurveTo(x+sw,18+len/2,x+sw*1.6,18+len);c.stroke();
    for(let q=1;q<4;q++){const yy=18+len*q/4,xx=x+sw*q/2.4,col=k%3?'#4affd0':'#ffd84a';X.disc(xx,yy,1.3,col);if(lo())X.glow(xx,yy,7,col,.35);}}
   // shafts of light from cracks in the roof
   if(lo()){c.globalCompositeOperation='lighter';const o5=cam*.2;for(let k=Math.floor(o5/150)-1;k<Math.floor(o5/150)+3;k++){const x=k*150-o5+40;c.fillStyle=X.lg(0,0,0,200,['rgba(120,255,220,.12)','rgba(120,255,220,0)']);c.beginPath();c.moveTo(x,0);c.lineTo(x+18,0);c.lineTo(x+70,200);c.lineTo(x+30,200);c.fill();}c.globalCompositeOperation='source-over';}
   const o2=cam*.55;for(let k=Math.floor(o2/40)-1;k<Math.floor(o2/40)+10;k++){const x=k*40-o2,h=hash(k,51);if(h<.5)continue;const mh=14+h*20;c.fillStyle='#16303a';c.fillRect(x-1.5,190-mh,3,mh);X.ell(x,190-mh,8+h*5,4,h>.75?'#3affb0':'#9a6aff');if(lo())X.glow(x,190-mh,14,h>.75?'#3affb0':'#9a6aff',.25);}}
  else{// ribs of the hull, pipes and blinking consoles
   const o1=cam*.4;c.fillStyle='rgba(10,14,30,.85)';for(let k=Math.floor(o1/80)-1;k<Math.floor(o1/80)+6;k++){const x=k*80-o1;c.fillRect(x,0,14,H);X.poly([[x,40],[x+40,0],[x+54,0],[x+14,40]],'rgba(10,14,30,.85)');c.fillStyle=(t+k*20)%50<25?'#ff4a4a':'#4a1010';c.fillRect(x+5,60,4,3);c.fillStyle='rgba(10,14,30,.85)';}
   const o2=cam*.6;for(let k=Math.floor(o2/120)-1;k<Math.floor(o2/120)+5;k++){const x=k*120-o2;X.vg(x,150,70,40,['#1a2240','#0e1428']);c.fillStyle='#0a0e1c';c.fillRect(x+6,156,58,20);
    for(let q=0;q<6;q++){c.fillStyle=hash(k*7+q,Math.floor(t/20))<.5?'#4affd0':'#ff6a4a';c.fillRect(x+10+q*9,160,5,2);}c.fillStyle='#2a3458';c.fillRect(x,146,120,4);}}};
 // ground: grass and dirt in the bay, moss on stone in the caves, deck plates on the ship
 const TOP=[['#6adf5a','#3a9a3a','#5a3a2a','#2a1a14'],['#4a8a8a','#2a5a6a','#24323e','#0e161e'],['#8a96b4','#4a5474','#2a3044','#12162a']];
 const groundDraw=s=>{const c=A.c,x=s.x-cam,T=TOP[ci];if(x>W||x+s.w<0)return;
  X.vg(x,s.y,s.w,H-s.y,[T[2],T[3]]);
  if(ci===2){c.fillStyle='rgba(0,0,0,.35)';for(let q=Math.floor(s.x/32)*32;q<s.x+s.w;q+=32)if(q>=s.x)c.fillRect(q-cam,s.y,1,H-s.y);c.fillStyle='rgba(255,255,255,.05)';for(let yy=s.y+12;yy<H;yy+=12)c.fillRect(x,yy,s.w,1);}
  else for(let q=0;q<s.w/10;q++){const h=hash(Math.floor(s.x)+q,ci+3);if(h<.5){c.fillStyle='rgba(0,0,0,'+(.15+h*.2)+')';c.fillRect(x+q*10+h*6,s.y+8+h*40,2+h*5,1.5);}}
  X.vg(x,s.y,s.w,6,[T[0],T[1]]);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(x,s.y,s.w,1);
  if(ci===2){for(let q=x+4;q<x+s.w-8;q+=24){c.fillStyle='rgba(255,210,60,.7)';c.fillRect(q,s.y+2,8,2);}}
  else if(ci===0){c.fillStyle=T[0];for(let q=0;q<s.w;q+=3){const h=hash(Math.floor(s.x)+q,7);c.fillRect(x+q,s.y-1-h*3,1,2+h*3);}if(hi())for(let q=0;q<s.w;q+=37){const h=hash(Math.floor(s.x)+q,9);if(h<.4){X.disc(x+q,s.y-2,1.4,h<.2?'#ff6a8a':'#ffe27a');}}}
  else{for(let q=0;q<s.w;q+=13){const h=hash(Math.floor(s.x)+q,8);if(h<.35){X.disc(x+q,s.y,1.2,'#4affd0');if(lo())X.glow(x+q,s.y,6,'#4affd0',.35);}
    // crystal clusters growing out of the floor
    else if(h>.9){const cc=h>.95?'#c8a8ff':'#a8f8ff';X.poly([[x+q-4,s.y],[x+q-2,s.y-9],[x+q,s.y]],cc);X.poly([[x+q-1,s.y],[x+q+2,s.y-13],[x+q+4,s.y]],X.lt(cc,.8));X.poly([[x+q+3,s.y],[x+q+6,s.y-7],[x+q+7,s.y]],cc);if(lo())X.glow(x+q+1,s.y-6,12,cc,.3);}}
   c.fillStyle='rgba(74,255,208,.08)';c.fillRect(x,s.y+6,s.w,3);}
  // the sides of a raised step or a gap edge
  c.fillStyle='rgba(0,0,0,.35)';c.fillRect(x,s.y,2,H-s.y);c.fillRect(x+s.w-2,s.y,2,H-s.y);};
 const obDraw=o=>{const c=A.c,x=o.x-cam;if(x>W+40||x+o.w<-40)return;
  if(o.k==='rock'&&!o.done){// a rockslide from the cliff above
   for(let k=0;k<9;k++){const yy=GY-k*24-14,w=o.w+8-k%2*6,r=hash(k,o.x|0);X.rr(x-4+r*4,yy,w,26,8,X.lg(x,yy,x+w,yy+26,['#c8c0a8','#8a8270','#4a443a']));
    c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=1;c.beginPath();c.moveTo(x+6+r*8,yy+4);c.lineTo(x+12,yy+14);c.lineTo(x+8+r*10,yy+22);c.stroke();}
   if(o.hp<3){c.strokeStyle='rgba(255,230,160,.6)';c.lineWidth=1.2;c.beginPath();c.moveTo(x+4,GY-60);c.lineTo(x+16,GY-40);c.lineTo(x+8,GY-20);c.lineTo(x+22,GY-6);if(o.hp<2){c.moveTo(x+24,GY-80);c.lineTo(x+12,GY-50);}c.stroke();}}
  else if(o.k==='vine'&&!o.done){// a wall of thorny bramble hanging from the canopy
   const bn=o.burn/45;for(let k=0;k<16;k++){const yy=k*13,sw=Math.sin(t*.03+k)*1.5;c.strokeStyle=bn?X.rgba('#ff7a2a',.5+bn*.5):'#2a4a1a';c.lineWidth=5;c.beginPath();c.moveTo(x+4+sw,yy);c.quadraticCurveTo(x+14,yy+6,x+6-sw,yy+13);c.stroke();
    c.strokeStyle=bn?'#ffcf3f':'#4a7a2a';c.lineWidth=2.4;c.beginPath();c.moveTo(x+12-sw,yy);c.quadraticCurveTo(x+2,yy+7,x+10+sw,yy+13);c.stroke();
    X.poly([[x+14,yy+4],[x+20,yy+3],[x+15,yy+7]],'#c8d8a0');X.poly([[x+2,yy+9],[x-4,yy+8],[x+1,yy+12]],'#c8d8a0');if(k%3===0)X.disc(x+8,yy+6,2,'#c83a5a');}
   if(o.burn&&lo())X.glow(x+8,GY-60,50,'#ff7a2a',.45);}
  else if(o.k==='gate'){const gen=o.gen,gx=gen.x-cam;
   // the pylon that powers it
   X.rr(gx,gen.y,gen.w,gen.h,3,X.lg(gx,0,gx+gen.w,0,['#5a6478','#2a3044']));c.fillStyle=gen.on?'#ffe23a':'#3a3010';c.fillRect(gx+4,gen.y+5,8,14);
   if(gen.on){if(lo())X.glow(gx+8,gen.y+10,18,'#ffe23a',.6);}else if(t%40<20){c.fillStyle='#ff4a4a';c.fillRect(gx+6,gen.y+22,4,2);}
   c.strokeStyle='rgba(40,40,50,.9)';c.lineWidth=2;c.beginPath();c.moveTo(gx+8,GY);c.lineTo(x+5,GY);c.stroke();
   // the door frame stays; the laser curtain between its emitters fades out once the pylon is powered
   X.vg(x-4,18,18,GY-118,['#4a5470','#1a2036']);X.rr(x-4,GY-14,18,14,2,'#2a3044');c.fillStyle='#ff4a4a';c.fillRect(x-1,GY-101,12,2);c.fillRect(x-1,GY-14,12,2);
   if(!o.done){const op=o.open;for(let k=0;k<4;k++){c.strokeStyle='rgba(255,'+(60+k*40)+',90,'+(.9*(1-op)).toFixed(2)+')';c.lineWidth=1.3;c.beginPath();for(let yy=GY-100;yy<GY-13;yy+=5)c.lineTo(x+2+k*2+Math.sin(yy*.3+t*.4+k)*1.4,yy);c.stroke();}
    if(lo())X.glow(x+5,GY-56,44,'#ff4a5a',.3*(1-op));}}
  else if(o.k==='vent'){// a fallen bulkhead with a crawl-space underneath
   X.vg(x,18,o.w,GY-11-18,ci===2?['#3a4466','#1a2036']:['#3a4a52','#1a242c']);c.fillStyle='rgba(255,255,255,.1)';for(let yy=30;yy<GY-20;yy+=18)c.fillRect(x,yy,o.w,1);
   c.fillStyle='#0a0e14';c.fillRect(x,GY-11,o.w,11);for(let q=x+6;q<x+o.w;q+=10){c.fillStyle='#4a5a64';c.fillRect(q,GY-12,2,4);}
   c.fillStyle='rgba(255,210,60,.8)';for(let q=0;q<o.w;q+=12)X.poly([[x+q,GY-22],[x+q+6,GY-22],[x+q+12,GY-14],[x+q+6,GY-14]],'rgba(255,210,60,.7)');
   if(o.x>P.x)X.ot('VENT',x+o.w/2,GY-60,'#8a9aa8',1,'c');}
  else if(o.k==='pool'){// glowing water (or ship coolant); frozen cells are walkable ice
   const col=ci===1?['#2affc0','#0a5a5a']:['#4ab8ff','#0a2a6a'];X.vg(x,GY+6,o.w,H-GY,[col[0],col[1]]);
   c.fillStyle='rgba(255,255,255,.35)';for(let q=0;q<o.w;q+=8)c.fillRect(x+q,GY+6+Math.sin(t*.08+q*.3)*1.2,5,1);
   if(lo())X.glow(x+o.w/2,GY+10,o.w*.5,col[0],.18);
   for(let k=0;k<16;k++)if(o.cells[k]){const cx=x+k*CELL;X.vg(cx,GY,CELL,10,['#ffffff','#bfefff','#6ac8ff']);c.fillStyle='rgba(255,255,255,.8)';c.fillRect(cx+2,GY+2,5,1);X.poly([[cx+3,GY+10],[cx+6,GY+16],[cx+9,GY+10]],'#9ad8ff');}}
  else if(o.k==='pit'){// a sheer drop (the bay's sea cave, a cave chasm, a hull breach into space)
   X.vg(x,GY,o.w,H-GY,ci===2?['#02030a','#000000']:['#0a0610','#000000']);c.fillStyle=ci===2?'rgba(200,220,255,.8)':'rgba(120,180,255,.3)';for(let k=0;k<14;k++)c.fillRect(x+hash(k,3)*o.w,GY+4+hash(k,4)*36,1,1);
   if(ci===2){c.fillStyle='rgba(255,120,60,.6)';for(let k=0;k<5;k++)c.fillRect(x+hash(k,7)*o.w,GY-2+hash(k,8)*3,3,1);}}
  else if(o.k==='bridge'){for(const tl of o.tiles){const tx=tl.x-cam,ty=GY+tl.fy;if(tl.fy>=200)continue;
    if(ci===2){X.rr(tx+.5,ty,CELL-1,6,1,'#6a748e');c.fillStyle='#2a3044';c.fillRect(tx+2,ty+2,CELL-4,1);}else{X.rr(tx+.5,ty,CELL-1,7,1,X.lg(0,ty,0,ty+7,['#b08458','#6a4a2a']));c.fillStyle='rgba(0,0,0,.35)';c.fillRect(tx+3,ty+2,1,1);c.fillRect(tx+CELL-4,ty+2,1,1);}
    if(!tl.gone&&o.t>=0&&o.t>tl.i*6.2){c.fillStyle='rgba(255,180,90,.5)';c.fillRect(tx+rnd(CELL),ty-1,2,1);}}
   c.strokeStyle=ci===2?'rgba(140,150,180,.6)':'rgba(120,90,60,.8)';c.lineWidth=1;c.beginPath();c.moveTo(x,GY-14);c.quadraticCurveTo(x+o.w/2,GY+2,x+o.w,GY-14);c.stroke();}};
 const emblem=(x,y,r,col)=>{const pts=[];for(let k=0;k<6;k++){const a=k*TAU/6+Math.PI/6;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}X.poly(pts,'#10141c');X.polys(pts,col,.8);
  X.poly([[x+r*.15,y-r*.75],[x-r*.4,y+r*.1],[x,y+r*.05],[x-r*.15,y+r*.75],[x+r*.4,y-r*.1],[x,y-r*.05]],col);};
 // each form is drawn facing right with its feet on 0,0; rim light from the upper left, emblem on the chest
 const OUT='rgba(10,8,20,.85)';
 const drawForm=(f,run,at,air,small)=>{const c=A.c;
  if(f===0){// JAX: sneakers, jeans, a green-striped jacket, the band glowing on the wrist
   c.strokeStyle='#2a3a5a';c.lineWidth=2.8;c.beginPath();c.moveTo(-1.5,-9);c.lineTo(-2-run*2.6,-1);c.moveTo(1.5,-9);c.lineTo(2+run*2.6,-1);c.stroke();
   c.fillStyle='#f6f6f6';c.fillRect(-4.4-run*2.6,-1.8,4.6,2);c.fillRect(run*2.6,-1.8,4.6,2);c.fillStyle='#1a2a1a';c.fillRect(-4.4-run*2.6,-.4,4.6,.6);c.fillRect(run*2.6,-.4,4.6,.6);
   X.rr(-4.5,-19,9,11,2.4,X.lg(-4,0,4,0,['#5ae07a','#2a9a4a','#145a2a']));c.fillStyle='#f6f1e6';c.fillRect(-.7,-19,1.4,10);c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-3.8,-18,1,8);
   c.strokeStyle='#2a9a4a';c.lineWidth=2.2;c.beginPath();c.moveTo(0,-16);c.lineTo(5+at*4,-12-at*3);c.moveTo(0,-16);c.lineTo(-3-run,-10);c.stroke();
   X.disc(5.5+at*4,-12-at*3,1.6,'#f1c7a3');X.rr(3.4+at*4,-14.2-at*3,3.8,2.8,.8,'#1a1e26');X.disc(5.3+at*4,-12.8-at*3,1,P.en>=MMIN&&!P.tired?'#7dff6a':'#ff6a5a');
   if(lo()&&P.en>=MMIN)X.glow(5.3+at*4,-12.8-at*3,6,'#7dff6a',.55);
   X.disc(0,-23.5,4.4,X.rg(-1,-25,.5,0,-23.5,4.4,['#ffe0c4','#f1c7a3','#c8987a']));c.fillStyle='#3a2416';c.beginPath();c.arc(-.4,-24.6,4.8,Math.PI*.95,TAU*1.02);c.fill();X.poly([[-5,-25],[-3,-29],[0,-27],[2,-30],[3.4,-27],[5,-26]],'#3a2416');
   c.fillStyle='#14121c';c.fillRect(1.8,-24,1.3,1.6);c.fillStyle='#c8786a';c.fillRect(2,-21.4,1.6,.6);}
  else if(f===1){// BLAZE: a magma body under cracked black crust, a crown of flame
   const fl=Math.sin(t*.5);c.strokeStyle='#2a1810';c.lineWidth=3.2;c.beginPath();c.moveTo(-2,-9);c.lineTo(-3-run*2.6,0);c.moveTo(2,-9);c.lineTo(3+run*2.6,0);c.stroke();
   X.rr(-5.5,-21,11,13,3.4,X.rg(0,-15,1,0,-15,10,['#fff0a0','#ff7a2a','#8a2a10']));
   for(const p of[[[-5,-20],[-1,-17],[-4,-13]],[[5,-19],[1,-14],[4,-11]],[[-4,-10],[0,-12],[3,-9]]])X.poly(p,'#2a1810');
   c.strokeStyle='#ff9a3a';c.lineWidth=2.6;c.beginPath();c.moveTo(1,-17);c.lineTo(6+at*4,-15-at*2);c.stroke();X.disc(6.5+at*4,-15-at*2,2.2,'#ffe08a');
   if(lo()){X.glow(0,-15,16,'#ff7a2a',.45);if(at>0)X.glow(8,-16,9,'#ffcf3f',.8*at);}
   X.poly([[-4.5,-21],[-6,-28-fl],[-1.5,-25],[0,-33+fl],[2,-25],[5.5,-29-fl*.6],[5,-21]],X.lg(0,-33,0,-21,['#fff6c0','#ffb34a','#ff5a1a']));
   X.disc(0,-23,3.6,'#3a1a0e');c.fillStyle='#fff3b0';c.fillRect(1,-24,2.4,1.5);emblem(-1,-14,2.3,'#7dff6a');}
  else if(f===2){// GRANITE: a slab-shouldered rock giant with crystals growing from his back
   const sl=at>0?Math.sin(at*Math.PI)*6:0;
   c.fillStyle='#5a5e4a';c.fillRect(-7-run*1.4,-8,5,8);c.fillRect(2+run*1.4,-8,5,8);c.fillStyle='#3a3e30';c.fillRect(-7-run*1.4,-1.5,5,1.5);c.fillRect(2+run*1.4,-1.5,5,1.5);
   X.rr(-11,-27,22,20,6,X.lg(-11,-27,11,-7,['#e0e4cc','#a0a690','#5a5e4a']));
   c.fillStyle='rgba(0,0,0,.22)';c.fillRect(-9,-17,18,1.2);c.fillRect(-2,-27,1.2,10);c.fillRect(5,-21,1.2,7);
   X.gem(-9,-28,7,'#7dffd8');X.gem(-4,-30,5,'#a8ffe8');X.gem(9,-27,6,'#7dffd8');if(lo())X.glow(-6,-28,10,'#7dffd8',.3);
   X.rr(-15,-22,7,10,2.6,'#8a9078');X.rr(6+sl,-23,8,10,2.8,X.lg(6,-23,14,-13,['#c8ccb4','#9aa08a']));c.fillStyle='rgba(0,0,0,.3)';c.fillRect(8+sl,-16,6,1);
   X.rr(-4.5,-33,10,9,3.4,'#b8bca4');c.fillStyle='#ffe27a';c.fillRect(1.6,-30,2.6,1.6);if(lo())X.glow(2.8,-29.4,5,'#ffe27a',.6);c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-3,-26.5,7,1);
   emblem(0,-15,3.2,'#7dff6a');}
  else if(f===3){// ZIPTAIL: a lean blue raptor with a visor, a whip tail and claws
   c.rotate(air?.15:Math.abs(run)>.1||P.dash?.35:.1);
   c.strokeStyle='#14182a';c.lineWidth=2.4;c.beginPath();c.moveTo(-1,-8);c.lineTo(-3-run*3.6,0);c.moveTo(2,-8);c.lineTo(3+run*3.6,0);c.stroke();
   X.poly([[-4,-13],[-18,-10-Math.sin(t*.4)*2.5],[-4,-8]],'#1a2a5a');X.poly([[-14,-11],[-19,-10-Math.sin(t*.4)*2.5],[-15,-9]],'#6ab0ff');
   X.rr(-4.5,-18,9,11,3,X.lg(-4,0,4,0,['#8ac8ff','#3a8cff','#1a3a8a']));c.fillStyle='#14182a';c.fillRect(-4,-13,8,1.4);
   c.strokeStyle='#1a3a8a';c.lineWidth=2;c.beginPath();c.moveTo(1,-16);c.lineTo(6,-13);c.stroke();c.fillStyle='#ffffff';c.fillRect(6,-14,2.4,.8);c.fillRect(6,-12.4,2.4,.8);
   X.poly([[-3,-18],[-1,-25],[6,-24],[8.5,-21],[3,-18]],'#3a8cff');X.poly([[0,-23.5],[7.5,-22.5],[7,-20.4],[0,-21.4]],X.lg(0,-24,0,-20,['#d8f8ff','#2a6aa8']));
   X.poly([[-3,-23],[-9,-26],[-2,-21]],'#1a3a8a');emblem(0,-13.5,2.1,'#7dff6a');}
  else if(f===4){// SKYWING: a purple bat-moth with huge ears; wings beat hard in flight
   const wb=Math.sin(t*(air?.7:.2))*(air?8:2);
   for(const s of[-1,1]){X.poly([[0,-17],[s*-15,-26-wb],[s*-20,-15-wb*.5],[s*-12,-11],[s*-6,-9]],s>0?'rgba(130,70,210,.94)':'rgba(90,40,160,.94)');
    c.strokeStyle='rgba(230,190,255,.55)';c.lineWidth=.6;c.beginPath();c.moveTo(0,-17);c.lineTo(s*-15,-26-wb);c.moveTo(0,-16);c.lineTo(s*-19,-15-wb*.5);c.stroke();
    if(s>0){X.disc(-11,-18-wb*.6,1.6,'#ffd84a');}}
   c.strokeStyle='#3a1a5a';c.lineWidth=2.2;c.beginPath();c.moveTo(-1,-8);c.lineTo(-2-run*2,0);c.moveTo(1.5,-8);c.lineTo(2.5+run*2,0);c.stroke();
   X.ell(0,-13,5,6.5,X.lg(-4,0,4,0,['#e0b8ff','#b46aff','#5a2a9a']));
   X.disc(1,-22,4.3,'#b46aff');X.poly([[-2,-24],[-4.5,-33],[0,-25]],'#8a4ad8');X.poly([[2,-25],[5.5,-33],[4.5,-23]],'#8a4ad8');
   c.fillStyle='#ffef7a';c.fillRect(1.6,-23,1.6,1.6);c.fillRect(3.6,-23,1.3,1.6);
   if(at>0){X.ell(4.8,-20,1.8*at+.6,2*at+.6,'#2a0a3a');if(lo())X.glow(6,-20,9,'#e0b0ff',.7*at);}
   emblem(0,-12.5,2.1,'#7dff6a');}
  else if(f===5){// MITE: a tiny armoured techno-bug with a glowing back
   const sk=Math.sin(t*.6)*(Math.abs(run)>.1?1:0);
   c.strokeStyle='#0a2a24';c.lineWidth=.9;c.beginPath();for(let q=-1;q<=1;q++){c.moveTo(q*2.4,-2.4);c.lineTo(q*2.4-1.6+sk*(q%2?1:-1),0);}c.stroke();
   X.ell(0,-4.4,5,3.8,X.lg(-4,-8,4,-1,['#a8fff0','#4affd0','#0a6a5a']));c.fillStyle='rgba(0,0,0,.35)';c.fillRect(-.3,-8,.6,7);
   X.disc(4.6,-4,2.2,'#0a4a40');c.fillStyle='#ff4a6a';c.fillRect(5.3,-5,1.2,1.2);c.strokeStyle='#4affd0';c.lineWidth=.6;c.beginPath();c.moveTo(5,-6);c.lineTo(7.5,-9);c.moveTo(4,-6);c.lineTo(5,-9.5);c.stroke();
   if(at>0){c.fillStyle='#ffffff';c.fillRect(6.4,-3.6,2,.6);}
   if(lo())X.glow(0,-5,8,'#4affd0',.4);emblem(-1.2,-5.4,1.3,'#7dff6a');}
  else if(f===6){// VOLTEX: a living battery in a cracked glass shell, sparks arcing off it
   c.strokeStyle='#1e1e2a';c.lineWidth=2.8;c.beginPath();c.moveTo(-2,-9);c.lineTo(-3-run*2.6,0);c.moveTo(2,-9);c.lineTo(3+run*2.6,0);c.stroke();
   X.rr(-5.5,-21,11,13,3,X.lg(-5,0,5,0,['#4a4a5a','#2a2a36','#14141c']));X.rr(-4,-20,8,10,2.6,X.rg(0,-15,1,0,-15,6,['#ffffff','#fff27a','#ffb21a']));
   c.strokeStyle='#2a2a36';c.lineWidth=2.4;c.beginPath();c.moveTo(1,-17);c.lineTo(6+at*4,-15-at*2);c.stroke();X.disc(6.4+at*4,-15-at*2,2,'#fff27a');
   X.disc(0,-24.5,4.4,X.rg(-1,-26,.5,0,-24.5,4.4,['#ffffff','#fff27a','#c89a1a']));c.fillStyle='#1a1a24';c.fillRect(-4.4,-25.4,8.8,2);c.fillStyle='#ffffff';c.fillRect(1,-25,2.6,1);
   X.poly([[-2,-28],[-1,-32],[0,-29],[1.5,-33],[2,-28.5]],'#fff27a');
   if(lo()){X.glow(0,-17,16,'#ffe23a',.45);if(t%6<3){c.strokeStyle='rgba(255,255,200,.9)';c.lineWidth=.7;c.beginPath();c.moveTo(-5,-18);c.lineTo(-8,-21);c.lineTo(-7,-23);c.lineTo(-10,-26);c.stroke();}}
   emblem(-2.5,-11.5,1.8,'#7dff6a');}
  else{// FROSTBYTE: a crystalline ice spirit with a hooded head and a misty cloak
   c.strokeStyle='#2a5a7a';c.lineWidth=2.6;c.beginPath();c.moveTo(-2,-9);c.lineTo(-3-run*2.4,0);c.moveTo(2,-9);c.lineTo(3+run*2.4,0);c.stroke();
   X.poly([[-6,-21],[6,-21],[8,-8],[-8,-8]],X.lg(-6,0,6,0,['#e8fbff','#8ae8ff','#2a8ab8']));X.poly([[-8,-8],[-11,-4],[-6,-6],[-3,-3],[0,-7],[3,-3],[6,-6],[8,-8]],'rgba(200,240,255,.7)');
   c.strokeStyle='#8ae8ff';c.lineWidth=2.4;c.beginPath();c.moveTo(1,-17);c.lineTo(6+at*4,-15-at*2);c.stroke();X.gem(6.8+at*4,-15-at*2,3.6,'#dff8ff');
   X.poly([[-5,-21],[-4,-29],[0,-33],[4,-30],[5.5,-21]],X.lg(0,-33,0,-21,['#ffffff','#9aeaff','#3a9ac8']));X.ell(1.6,-24.5,2.8,2,'#0a2a44');c.fillStyle='#bff8ff';c.fillRect(2,-25,2.4,1.2);
   X.gem(-5,-30,4,'#ffffff');X.gem(5,-31,3.4,'#dff8ff');
   if(lo())X.glow(0,-17,15,'#8ae8ff',.35);emblem(0,-14,2.2,'#7dff6a');}};
 const heroDraw=()=>{const c=A.c,F=P.form,px=P.x-cam;
  for(const tr of P.trail){c.globalAlpha=tr.t/26;X.ell(tr.x-cam,tr.y-11,7,9,'#3a8cff');}c.globalAlpha=1;
  const gy_=P.gnd?P.y:gtop(P.x);if(gy_<H)X.shadow(px,gy_,FORM[F].w*.7,1.8,P.gnd?.42:.2);
  if(P.inv>0&&!P.morph&&P.inv%8<3&&P.inv<80)return;
  const mv=P.gnd&&Math.abs(P.vx)>.3,run=mv?Math.sin(t*(F===3?.9:.42)):0,at=P.act/12;
  c.save();c.translate(px,P.y);c.scale(P.face*1.3,1.3);
  if(P.morph>0){const m=P.morph/20;c.globalAlpha=.35+.65*(1-m);X.glow(0,-14,30,'#7dff6a',.75*m);}
  // a dark outline pass first, so the hero reads against any background
  if(hi()&&!P.morph){c.save();c.globalAlpha=.55;c.translate(.9,.9);c.filter&&(c.filter='brightness(0)');drawForm(F,run,at,!P.gnd);c.restore();if(c.filter)c.filter='none';}
  drawForm(F,run,at,!P.gnd);c.restore();c.globalAlpha=1;
  if(P.morph>0){const m=1-P.morph/20;for(let k=0;k<4;k++){const yy=P.y-((m*40+k*10)%38);c.strokeStyle='rgba(125,255,106,'+(.85-k*.18)+')';c.lineWidth=1.3;c.beginPath();c.ellipse(px,yy,12,3,0,0,TAU);c.stroke();}
   // a double helix spins around the body as the DNA rewrites
   if(lo())for(let k=0;k<14;k++){const a=k*.45+t*.35,yy=P.y-k*2.6;X.disc(px+Math.sin(a)*9,yy,1.1,'#bfffb0');X.disc(px-Math.sin(a)*9,yy,1.1,'#7dff6a');}
   if(lo())X.glow(px,P.y-14,34*(1-m)+8,'#ffffff',.5*(1-m));}
  if(F===4&&!P.gnd&&P.fly<FLY&&P.fly>0){X.meter(px-10,P.y-FORM[F].h*1.3-14,20,3,P.fly/FLY,'#e0b8ff');}};
 const foeDraw=e=>{const c=A.c,x=e.x-cam;if(x<-20||x>W+20)return;const fz=e.fz>0;
  if(e.k==='drone'||e.k==='bat'){X.shadow(x,gtop(e.x),6,1.4,.2);c.save();c.translate(x,e.y);c.scale(e.face,1);
   if(e.k==='drone'){X.ell(0,0,8,5,X.lg(0,-5,0,5,['#9aa4bc','#4a5470','#1a2034']));X.disc(3,0,2.6,'#1a0a0a');X.disc(3.4,0,1.5,t%30<15?'#ff4a4a':'#ff8a4a');if(lo())X.glow(3.4,0,6,'#ff4a4a',.5);
    c.fillStyle='rgba(200,220,255,.5)';c.fillRect(-9,-7+Math.sin(t*.9),8,1);c.fillRect(1,-7-Math.sin(t*.9),8,1);c.fillStyle='#2a3044';c.fillRect(-1,-7,2,3);if(lo())X.glow(0,6,6,'#7ab8ff',.4);}
   else{const fl=Math.sin(t*.4)*4;X.poly([[0,-1],[-10,-6-fl],[-7,1],[-3,0]],'#3a1a5a');X.poly([[0,-1],[10,-6-fl],[7,1],[3,0]],'#4a2a6a');X.ell(0,0,4,4.4,'#5a3a8a');c.fillStyle='#4affd0';c.fillRect(1,-1.4,1.4,1.4);c.fillRect(-2,-1.4,1.4,1.4);if(lo())X.glow(0,0,8,'#4affd0',.3);}
   c.restore();}
  else{X.shadow(x,e.y,8,1.6,.35);c.save();c.translate(x,e.y);c.scale(e.face,1);const w=Math.sin(e.t*.3)*1.5;
   if(e.k==='crawl'){c.strokeStyle='#1a1e2a';c.lineWidth=1.4;c.beginPath();for(const q of[-5,0,5]){c.moveTo(q,-4);c.lineTo(q-2+w,0);}c.stroke();X.ell(0,-6,8,5,X.lg(0,-11,0,-1,['#8a8a9a','#4a4a5a','#22222c']));c.fillStyle='#ff4a4a';c.fillRect(4,-8,3,2);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(-5,-10,7,1);}
   else if(e.k==='beetle'){c.strokeStyle='#1a1430';c.lineWidth=1.3;c.beginPath();for(const q of[-5,0,5]){c.moveTo(q,-4);c.lineTo(q-2+w,0);}c.stroke();X.ell(0,-6,8,5.4,X.lg(0,-11,0,-1,['#c8a8ff','#7a4ad8','#2a1a5a']));X.gem(-2,-10,5,'#a8f8ff');X.gem(3,-10,4,'#a8f8ff');c.fillStyle='#ffe27a';c.fillRect(6,-7,1.6,1.6);if(lo())X.glow(0,-9,10,'#a8f8ff',.25);}
   else{// a ship trooper: armoured, a red visor, a plasma rifle
    c.strokeStyle='#2a2e3e';c.lineWidth=2.4;c.beginPath();c.moveTo(-1.5,-7);c.lineTo(-2-w,0);c.moveTo(1.5,-7);c.lineTo(2+w,0);c.stroke();X.rr(-4,-16,8,10,2,X.lg(-4,0,4,0,['#7a8098','#3a4058']));X.disc(0,-19,3.6,'#4a5068');c.fillStyle='#ff3a3a';c.fillRect(0,-20,4,1.6);if(lo())X.glow(2,-19,5,'#ff3a3a',.5);
    c.fillStyle='#1a1e2a';c.fillRect(2,-13,9,2.4);c.fillStyle='#ff6a4a';c.fillRect(10,-12.6,1.4,1.4);}
   c.restore();}
  if(e.flash>0){c.globalAlpha=e.flash/8*.8;X.disc(x,e.y-8,8,'#ffffff');c.globalAlpha=1;}
  if(fz){c.globalAlpha=.75;X.rr(x-9,e.y-17,18,18,3,'rgba(190,240,255,.6)');X.rrs(x-9,e.y-17,18,18,3,'#ffffff',.6);c.globalAlpha=1;}};
 const bossDraw=()=>{const c=A.c,b=boss,B=BOSS[b.i],x=b.x-cam;const dead=b.st==='dead';
  X.shadow(x,GY,B.w*.55,3,b.i===1&&b.y<GY-20?.15:.45);
  if(b.i===1&&(b.st==='ceil'||b.st==='climb'||b.st==='drop')){c.strokeStyle='rgba(220,240,255,.5)';c.lineWidth=.7;c.beginPath();c.moveTo(x,0);c.lineTo(x,b.st==='ceil'?b.y+12:b.y-B.h);c.stroke();}
  c.save();c.translate(x+(b.st==='rev'||b.st==='stuck'||dead?rnd(2)-1:0),b.y);c.scale(b.face,1);
  if(b.i===0){// SCRAPJAW: a tracked junk tank with a huge drill nose and a furnace grin
   const sp=t*(b.st==='charge'?.8:b.st==='rev'?.6:.1);
   X.rr(-32,-12,64,12,6,'#1e1e24');for(let q=-28;q<30;q+=8){X.disc(q,-6,4,'#3a3a44');X.disc(q,-6,1.6,'#6a6a74');}c.fillStyle='#2a2a30';for(let q=0;q<16;q++){const xx=-32+((q*8+sp*10)%64+64)%64;c.fillRect(xx,-12,2,2);}
   X.rr(-28,-38,46,28,6,X.lg(0,-38,0,-10,['#c8783a','#8a4a24','#4a2412']));c.fillStyle='rgba(0,0,0,.35)';for(let q=-24;q<14;q+=9)c.fillRect(q,-36,1.2,24);
   X.rr(-20,-46,24,10,3,'#6a6a74');c.fillStyle='#1a1a20';c.fillRect(-26,-34,6,6);X.disc(-14,-50,4,'#3a3a44');c.fillStyle='rgba(120,120,130,.6)';if(t%20<10)X.disc(-14,-56,3,'rgba(90,90,100,.5)');
   // furnace mouth and eyes
   X.rr(-6,-28,22,10,3,'#1a0a06');c.fillStyle=b.st==='rev'||b.st==='charge'?'#ffe27a':'#ff7a2a';for(let q=-4;q<16;q+=4)X.poly([[q,-28],[q+2,-24],[q+4,-28]],'#c8c8d0');if(lo())X.glow(5,-23,14,'#ff7a2a',.45);
   X.disc(4,-34,3,'#ffe27a');X.disc(12,-34,3,'#ffe27a');if(lo())X.glow(8,-34,10,'#ffcf3f',.5);
   // the drill
   c.save();c.translate(18,-22);const dl=b.st==='charge'?6:0;X.poly([[0,-12],[30+dl,0],[0,12]],X.lg(0,-12,0,12,['#e8e8f0','#8a8a9a','#3a3a44']));c.strokeStyle='rgba(30,30,40,.8)';c.lineWidth=1.2;c.beginPath();for(let q=0;q<5;q++){const o=((q*7+sp*20)%30);c.moveTo(o,-12+o*.4);c.lineTo(o+5,12-(o+5)*.4);}c.stroke();c.restore();
   if(b.st==='stuck')for(let k=0;k<3;k++){const a=t*.15+k*2.1;X.disc(Math.cos(a)*12,-56+Math.sin(a)*3,1.4,'#ffcf3f');}}
  else if(b.i===1){// GLASSMAW: a crystal spider; upside down on the roof
   const up=b.st==='ceil';c.scale(1,up?-1:1);if(up)c.translate(0,-12);
   for(let q=0;q<4;q++)for(const s of[-1,1]){const a=Math.sin(t*.2+q)*3,lx=s*(10+q*5);c.strokeStyle='#3a2a6a';c.lineWidth=2.4;c.beginPath();c.moveTo(s*6,-16);c.lineTo(lx+s*6,-26+a);c.lineTo(lx+s*12,0);c.stroke();c.strokeStyle='#a8f8ff';c.lineWidth=.8;c.beginPath();c.moveTo(lx+s*6,-26+a);c.lineTo(lx+s*12,0);c.stroke();}
   X.ell(-6,-16,16,11,X.lg(0,-27,0,-5,['#c8a8ff','#6a3ab8','#2a1a5a']));for(let q=0;q<5;q++)X.gem(-16+q*6,-26-hash(q,1)*4,6+hash(q,2)*4,'#a8f8ff');if(lo())X.glow(-6,-24,24,'#a8f8ff',.3);
   X.ell(12,-12,8,7,'#4a2a8a');for(const[ex,ey]of[[14,-15],[17,-12],[14,-9],[18,-16]]){X.disc(ex,ey,1.4,'#ff4a8a');}if(lo())X.glow(16,-12,8,'#ff4a8a',.5);
   c.fillStyle='#e8e8f0';X.poly([[18,-8],[22,-4],[17,-5]],'#e8e8f0');}
  else{// KRAGG: a horned warlord in plate armour with a jetpack and a red energy blade
   const fly=b.st==='fly'||b.st==='dive'&&b.y<GY-4,run=b.st==='walk'?Math.sin(t*.3):0,wind=b.st==='wind'?b.st_t/26:0,sl=b.st==='slash'?1:0;
   if(fly){for(const s of[-8,-2]){X.poly([[s-2,-22],[s+2,-22],[s,-6-Math.random()*8]],'#ffb34a');if(lo())X.glow(s,-14,10,'#ff7a2a',.6);}}
   c.fillStyle='#3a3e4a';c.fillRect(-12,-36,7,18);c.fillStyle='#ff6a4a';c.fillRect(-11,-30,2,2);
   c.strokeStyle='#2a2430';c.lineWidth=5;c.beginPath();c.moveTo(-3,-18);c.lineTo(-5-run*4,0);c.moveTo(3,-18);c.lineTo(5+run*4,0);c.stroke();c.fillStyle='#4a4250';c.fillRect(-8-run*4,-3,7,3);c.fillRect(2+run*4,-3,7,3);
   X.rr(-9,-40,18,24,4,X.lg(-9,0,9,0,['#7a3a3a','#4a1e24','#2a0e14']));X.rr(-11,-42,22,8,3,X.lg(0,-42,0,-34,['#a8a8b8','#5a5a6a']));c.fillStyle='#ffcf3f';c.fillRect(-2,-30,4,4);if(lo())X.glow(0,-28,8,'#ffcf3f',.4);
   X.rr(-6,-52,12,11,4,'#5a5a6a');X.poly([[-5,-50],[-12,-60],[-4,-53]],'#d8d0c0');X.poly([[5,-50],[12,-60],[4,-53]],'#d8d0c0');c.fillStyle='#ff2a2a';c.fillRect(0,-48,5,2);if(lo())X.glow(3,-47,7,'#ff2a2a',.6);
   // sword arm
   const ang=sl?.9:wind?-1.9*Math.min(1,wind):-.3;c.save();c.translate(7,-36);c.rotate(ang);X.rr(-2,-2,10,5,2,'#5a5a6a');c.fillStyle='#2a2a30';c.fillRect(8,-2,3,5);
   X.rr(11,-1.2,30,3.4,1.6,X.lg(11,0,41,0,['#ffffff','#ff6a6a','#ff2a2a']));if(lo())X.glow(26,0,16,'#ff2a2a',.5+(wind?.4:0));c.restore();}
  c.restore();
  if(b.flash>0){const r=bbox();c.globalAlpha=b.flash/8*.5;X.rr(r.x0-cam,r.y0,B.w,B.h,6,'#ffffff');c.globalAlpha=1;}
  if(b.fz>0){c.globalAlpha=.7;X.rr(x-B.w/2-4,b.y-B.h-4,B.w+8,B.h+6,4,'rgba(190,240,255,.55)');X.rrs(x-B.w/2-4,b.y-B.h-4,B.w+8,B.h+6,4,'#ffffff',.8);c.globalAlpha=1;}};
 // portraits for the story cards
 const portrait=(who,x,y)=>{const c=A.c;X.rr(x,y,46,46,5,X.lg(0,y,0,y+46,who==='kragg'?['#4a1a24','#1a0810']:who==='band'?['#0a2a12','#04100a']:['#1a3a5a','#0a1424']));
  c.save();c.translate(x+23,y+48);
  if(who==='jax'){c.scale(2,2);drawForm(0,0,0,false);}
  else if(who==='kragg'){c.scale(.95,.95);X.rr(-14,-46,28,40,6,'#4a1e24');X.rr(-16,-50,32,10,3,'#8a8a9a');X.rr(-9,-66,18,17,6,'#5a5a6a');X.poly([[-8,-62],[-18,-78],[-6,-66]],'#d8d0c0');X.poly([[8,-62],[18,-78],[6,-66]],'#d8d0c0');c.fillStyle='#ff2a2a';c.fillRect(-6,-60,12,3);if(lo())X.glow(0,-58,12,'#ff2a2a',.6);}
  else if(who==='band'){emblem(0,-24,15,'#7dff6a');if(lo())X.glow(0,-24,26,'#7dff6a',.4+.2*Math.sin(t*.1));}
  c.restore();X.rrs(x+.5,y+.5,45,45,5,who==='kragg'?'#ff6a5a':who==='band'?'#7dff6a':'#7ab8ff',1.2);};
 const dial=()=>{const c=A.c,x=22,y=218,u=P.unl,big=P.dialT>0;
  X.disc(x,y,big?19:16,'rgba(6,10,14,.8)');
  c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=2.6;c.beginPath();c.arc(x,y,13,0,TAU);c.stroke();
  c.strokeStyle=P.form?'#ffe27a':P.en>=MMIN&&!P.tired?'#7dff6a':'#ff6a5a';c.beginPath();c.arc(x,y,13,-Math.PI/2,-Math.PI/2+TAU*P.en/100);c.stroke();
  u.forEach((f,i)=>{const a=-Math.PI/2+i*TAU/u.length,r=big?21:18.5,fx_=x+Math.cos(a)*r,fy=y+Math.sin(a)*r;if(fy>H-2)return;const on=P.sel===f;
   X.disc(fx_,fy,on?3.2:2,on?FORM[f].col:X.rgba(FORM[f].col,.45));if(on){c.strokeStyle='#ffffff';c.lineWidth=.8;c.beginPath();c.arc(fx_,fy,4,0,TAU);c.stroke();}});
  emblem(x,y,7.5,P.form?FORM[P.form].col:P.en>=MMIN&&!P.tired?'#7dff6a':'#ff6a5a');if(lo())X.glow(x,y,16,'#7dff6a',.18+.08*Math.sin(t*.1));
  X.panel(44,210,88,26,P.form?FORM[P.form].col:'#7dff6a');
  A.text(FORM[P.form].n,49,213,P.form?FORM[P.form].col:'#e8e2d0',1);X.meter(90,213,38,5,P.hp/100,P.hp>35?'#3dff8b':'#ff4f4f');
  const nx=P.sel===P.form?'B: BACK TO JAX':'B: '+FORM[P.sel].n;A.text(nx,49,225,'#9dff8a',1);};
 // a story card sits over the frozen scene
 const cardDraw=()=>{const c=A.c;const L_=card.lines[cardI],who=L_[0];
   c.fillStyle='rgba(0,0,0,.3)';c.fillRect(0,0,W,H);
   X.panel(10,22,300,74,'#7dff6a');if(who)portrait(who,18,36);
   const tx=who?72:20,n=Math.min(L_[1].length,Math.floor(cardT*1.4));const words=L_[1].slice(0,n);
   // the line wraps by words to the panel width
   const maxc=who?58:70,lines=[];let cur='';for(const w of words.split(' ')){if((cur+' '+w).trim().length>maxc){lines.push(cur.trim());cur=w;}else cur+=' '+w;}lines.push(cur.trim());
   if(who)A.text(who==='jax'?'JAX':who==='kragg'?'KRAGG':'XENOLINK',tx,34,who==='kragg'?'#ff6a5a':who==='band'?'#7dff6a':'#7ab8ff',1);
   lines.forEach((s,i)=>A.text(s,tx,(who?46:40)+i*10,'#f0ece0',1));
   if(cardT>20&&t%40<26)A.text('A: NEXT',300,86,'#9dff8a',1,'r');
   X.ot(ci===0&&card.lines===CH[0].card?'XENOSHIFT':card.lines===END?'THE END':'CHAPTER '+(ci+1)+': '+CH[ci].name,160,110,'#7dff6a',2,'c');
   if(card.lines===CH[0].card&&ci===0)A.text('THE STOLEN STAR',160,128,'#ffe27a',1,'c');
   };
 g.draw=()=>{const c=A.c;
  const sx=shake?rnd(shake)-shake/2:0,sy=shake?rnd(shake)-shake/2:0;
  backdrop(ci);midlayer();
  c.save();c.translate(sx,sy);
  for(const o of L.ob)if(o.k==='pit'||o.k==='pool')obDraw(o);
  for(const s of L.sol)if(s.k==='g')groundDraw(s);
  for(const p of L.plat){const x=p.x0-cam;if(x>W||x+40<0)continue;if(ci===2){X.rr(x,p.y,p.x1-p.x0,6,2,X.lg(0,p.y,0,p.y+6,['#8a96b4','#3a4460']));if(lo())X.glow(x+20,p.y+8,16,'#4ab8ff',.25);}else if(ci===1){X.rr(x,p.y,p.x1-p.x0,7,3,X.lg(0,p.y,0,p.y+7,['#7ad8c8','#2a5a5a']));X.gem(x+6,p.y+8,5,'#a8f8ff');X.gem(x+30,p.y+9,4,'#a8f8ff');}else{X.rr(x,p.y,p.x1-p.x0,7,2,X.lg(0,p.y,0,p.y+7,['#c09060','#6a4a2a']));c.fillStyle='#6adf5a';c.fillRect(x,p.y-1,p.x1-p.x0,2);}}
  for(const o of L.ob)if(o.k!=='pit'&&o.k!=='pool')obDraw(o);
  if(lock)for(const w of L.walls){const x=w.x-cam;X.vg(x,18,w.w,GY-18,['#3a2a4a','#1a1424']);c.fillStyle='rgba(255,80,80,'+(.4+.3*Math.sin(t*.2))+')';c.fillRect(x+(w.x<L.arena?w.w-2:0),18,2,GY-18);}
  // hints: a bubble over the next obstacle showing which alien it wants
  const nx=L.ob.find(o=>!o.done&&o.x+o.w>P.x-6);if(nx&&nx.x-P.x<150&&nx.x-cam<W-10&&P.form!==nx.need&&state==='play'){const bx=cl(nx.x+Math.min(nx.w,30)/2-cam,30,W-30),by=GY-96+Math.sin(t*.1)*2;
   X.rr(bx-26,by-9,52,16,5,'rgba(10,14,20,.85)');X.rrs(bx-26,by-9,52,16,5,FORM[nx.need].col,1);X.poly([[bx-3,by+7],[bx+3,by+7],[bx,by+11]],'rgba(10,14,20,.85)');emblem(bx-18,by-1,4,FORM[nx.need].col);A.text(FORM[nx.need].n,bx+3,by-3,FORM[nx.need].col,1,'c');}
  for(const q of L.pick){const x=q.x-cam;if(x<-10||x>W+10)continue;const bob=Math.sin(t*.1+q.x)*1.6;
   if(q.k==='gem'){X.gem(x,q.y+bob,7,'#7adfff');if(lo())X.glow(x,q.y+bob,8,'#7adfff',.35);}else if(q.k==='orb'){if(lo())X.glow(x,q.y+bob,12,'#7dff6a',.55);X.orb(x,q.y+bob,4.6,'#5dff6a');emblem(x,q.y+bob,2,'#0a3a12');}else{X.heart(x,q.y+bob-2,1.2,'#ff4f6d');}}
  for(const e of L.foe)if(!e.dead)foeDraw(e);
  if(boss)bossDraw();
  for(const s of bad){const x=s.x-cam;if(s.k==='wave'){const h=8+Math.sin(t*.6+s.x)*2;X.poly([[x-7,s.y],[x-2,s.y-h],[x+1,s.y-h*.6],[x+5,s.y-h*.9],[x+7,s.y]],ci===1?'#a8f8ff':'#a89a72');}
   else if(s.k==='bomb'){X.disc(x,s.y,3.4,'#2a2a30');c.fillStyle=t%8<4?'#ff4a4a':'#ffcf3f';c.fillRect(x-.5,s.y-5,1,2);}
   else if(s.k==='shard'){X.gem(x,s.y,6,'#a8f8ff');}
   else{if(lo())X.glow(x,s.y,7,s.k==='spore'?'#4affd0':'#ff4a8a',.6);X.disc(x,s.y,2.2,s.k==='spore'?'#bfffe8':'#ffd0e0');}}
  heroDraw();
  for(const s of shots){const x=s.x-cam;
   if(s.k==='fire'){if(lo())X.glow(x,s.y,11,'#ff7a2a',.7);X.disc(x,s.y,3.6,X.rg(x,s.y,0,x,s.y,3.6,['#fff6c0','#ffb34a','#ff5a1a']));c.fillStyle='rgba(255,140,40,.6)';c.beginPath();c.moveTo(x,s.y-3);c.lineTo(x-s.vx*3,s.y);c.lineTo(x,s.y+3);c.fill();}
   else if(s.k==='bolt'){c.strokeStyle='#fffbd0';c.lineWidth=1.6;c.beginPath();c.moveTo(x,s.y);for(let q=1;q<5;q++)c.lineTo(x-Math.sign(s.vx)*q*4,s.y+rnd(4)-2);c.stroke();if(lo())X.glow(x,s.y,10,'#ffe23a',.7);}
   else if(s.k==='frost'){c.globalAlpha=s.life/24;X.disc(x,s.y,1.4+(24-s.life)*.12,'#dff8ff');c.globalAlpha=1;}
   else{const r=(18-s.life)*1.6+3;c.strokeStyle='rgba(224,176,255,'+(s.life/18).toFixed(2)+')';c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();c.arc(x-Math.sign(s.vx)*(k*5),s.y,Math.max(1,r-k*3),s.vx>0?-.7:Math.PI-.7,s.vx>0?.7:Math.PI+.7);c.stroke();}}}
  for(const z of zaps){c.strokeStyle='rgba(255,250,180,'+(z.t/10)+')';c.lineWidth=1.2;c.beginPath();c.moveTo(z.x0-cam,z.y0);for(let q=1;q<6;q++)c.lineTo(z.x0-cam+(z.x1-z.x0)*q/6+rnd(6)-3,z.y0+(z.y1-z.y0)*q/6+rnd(6)-3);c.lineTo(z.x1-cam,z.y1);c.stroke();}
  if(lo())for(const m of motes){if(m.dust){c.globalAlpha=m.dust/16*.6;X.disc(m.x-(m.w?cam:0),m.y,m.w===2?1.6:1.2,m.w===2?'#ffb34a':m.w===3?'#fff27a':'#b8a888');}else{c.globalAlpha=.35+.35*Math.sin(t*.05+m.p*3);X.disc((m.x-cam*.8%W+W*2)%W,m.y,.8,ci===0?'#ffd08a':ci===1?'#4affd0':'#8ab8ff');}}c.globalAlpha=1;
  c.translate(-cam,0);fw.draw();c.restore();
  fx.draw();
  // light: caves are dark around the hero's glow; the ship pulses red during the boss
  if(ci===1&&lo()){c.fillStyle=X.rg(P.x-cam,P.y-14,30,P.x-cam,P.y-14,240,['rgba(0,0,0,0)','rgba(0,4,12,.62)']);c.fillRect(0,0,W,H);}
  if(ci===2&&lock&&boss){c.fillStyle='rgba(255,30,30,'+(.06+.05*Math.sin(t*.1))+')';c.fillRect(0,0,W,H);}
  // foreground silhouettes, moving faster than the play layer for depth
  if(lo()){const o3=cam*1.35;c.fillStyle=ci===0?'rgba(8,6,16,.9)':ci===1?'rgba(2,6,10,.9)':'rgba(4,6,14,.92)';for(let k=Math.floor(o3/170)-1;k<Math.floor(o3/170)+3;k++){const x=k*170-o3,h=hash(k,61);if(h<.45)continue;
   if(ci===0){X.poly([[x,H],[x+6,H-30-h*20],[x+10,H-10],[x+16,H-40-h*16],[x+22,H]],c.fillStyle);}else if(ci===1){X.poly([[x,0],[x+14,0],[x+8,26+h*30]],c.fillStyle);}else{c.fillRect(x,0,10,H);c.fillRect(x-6,H-14,22,14);}}}
  // HUD
  X.bar(String(g.score),'',CH[ci].name,'#ffe27a');
  for(let i=0;i<3;i++)X.heart(W-12-i*12,8,1,i<P.lives?'#ff4f6d':'rgba(255,255,255,.18)');
  if(boss){const B=BOSS[boss.i];X.panel(60,20,200,13,'#ff6a5a');X.meter(64,24,140,5,boss.hp/boss.max,'#ff4f4f');A.text(B.n,256,24,'#ff8a7a',1,'r');}
  dial();
  if(banner&&state!=='card'){const a=Math.min(1,banner.t/20);c.globalAlpha=a;X.ot(banner.txt,160,banner.boss?60:52,banner.boss?'#ff6a5a':'#7dff6a',2,'c');if(banner.sub)X.ot(banner.sub,160,80,FORM[BOSS[ci].weak].col,1,'c');c.globalAlpha=1;}
  if(state==='clear'){c.fillStyle='rgba(0,0,0,'+Math.min(.55,clearT/60)+')';c.fillRect(0,0,W,H);X.ot('CHAPTER CLEAR!',160,90,'#7dff6a',2,'c');A.text('SCORE '+g.score,160,114,'#ffe27a',1,'c');}
  if(state==='card')cardDraw();};
 return g;}});
})();
