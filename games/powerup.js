/* PIXEL ARCADE - powerup pack: MORPHBAND (a wrist band that turns you into four different aliens), OVERDRIVE AGENT
   (an energy suit with four modes, raced through a robot-infested city) and NOVA REBELLION (a starfighter battle, then a
   light-blade duel on the enemy flagship), all VS CPU with difficulty or 2 players */
(function(){'use strict';const A=window.A,{W,H}=A,rnd=A.rnd,ri=A.ri,cl=A.clamp,S=A.sfx;
const X=new Proxy({},{get:(_,k)=>A.gx[k]});const lo=()=>A.gfx!=='off',hi=()=>A.gfx==='high';
const TAU=Math.PI*2,hyp=Math.hypot;
const PC=['#2fd6c3','#ff4f9a'];
const tu=(a,b)=>a>b?'TIME UP - '+A.win(0):b>a?'TIME UP - '+A.win(1):'TIME UP - DRAW';
const hash=(i,j)=>{let h=(i*374761393+j*668265263)|0;h=(h^(h>>>13))*1274126177|0;return((h^(h>>>16))>>>0)/4294967296;};
const demo=g=>!!(g.auto||A._e&&A._e.state==='title');
const skill=()=>A._e&&A._e.state==='play'?A.ai:.85;
const adf=(a,b)=>{let d=a-b;while(d>Math.PI)d-=TAU;while(d<-Math.PI)d+=TAU;return d;};
// pressed-this-frame for an input object we built ourselves (CPU brains return held keys)
const edge=(h,k)=>{const e={};for(const n of['l','r','u','d','a','b'])e[n]=!!k[n]&&!h.pk[n];h.pk=Object.assign({},k);return e;};

/* ================= MORPHBAND ================= */
// a crashed alien pod in a junkyard; two kids who found its wrist bands fight it out
const GY=206;
const MPL=[{x0:30,x1:102,y:166},{x0:218,x1:290,y:166},{x0:120,x1:200,y:128}];
// 0 is the kid; 1-4 are the aliens the band can turn you into
const FORM=[
 {n:'KID',col:'#f1c7a3',spd:1.45,jmp:4.7,arm:1,cd:22},
 {n:'EMBERCLAW',col:'#ff7a2a',spd:1.6,jmp:4.8,arm:.9,cd:24,tip:'FIREBALLS'},
 {n:'STONEHIDE',col:'#9aa08a',spd:1.05,jmp:4.4,arm:.5,cd:46,tip:'QUAKE SLAM'},
 {n:'RIPSTREAK',col:'#3a8cff',spd:2.8,jmp:4.9,arm:1.15,cd:30,tip:'DASH STRIKE'},
 {n:'HOWLWING',col:'#b46aff',spd:1.7,jmp:4.4,arm:1,cd:30,tip:'FLY + SONIC'}];
const MCOST=12,MDRAIN=.085,MREGEN=.32,MMIN=25;

A.add({id:'morphband',name:'MORPHBAND',cat:'VERSUS',vs:1,time:120,warm:160,tags:'ben 10 ben10 omnitrix alien hero transform watch powers brawl fighter versus 2 player',
 how:'MOVE, UP JUMPS, A ATTACKS, B MORPHS TO THE NEXT ALIEN, DOWN+B TURNS BACK. 5 KOS WINS.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0;
 const P=[0,1].map(i=>({i,x:i?250:70,y:GY,vx:0,vy:0,face:i?-1:1,hp:100,form:0,sel:1,en:100,cd:0,stun:0,inv:60,morph:0,ko:0,kos:0,gnd:null,jumps:0,act:0,dash:0,drop:0,pk:{},think:0,want:1,wantT:0,dmg:0,flash:0,trail:[],tired:0}));
 const shots=[],orbs=[],motes=[];for(let i=0;i<26;i++)motes.push({x:rnd(W),y:120+rnd(90),p:rnd(TAU),s:.2+rnd(.4)});
 const surf=h=>h.gnd?h.gnd.y:null;
 const spawn=h=>{Object.assign(h,{x:h.i?262:58,y:-10,vx:0,vy:0,hp:100,form:0,en:Math.max(h.en,55),cd:0,stun:0,inv:90,morph:0,gnd:null,dash:0,act:0});};
 const hurt=(o,dmg,kx,by)=>{if(o.ko||o.inv>0||o.morph>0)return false;const F=FORM[o.form];const d=dmg*F.arm;o.hp-=d;P[by].dmg+=d;
  o.vx=cl(kx*(o.form===2?.4:1),-5,5);o.vy=Math.min(o.vy,o.form===2?-.6:-1.8);o.gnd=null;o.stun=o.form===2?6:14;o.inv=12;o.flash=6;o.dash=0;
  if(!demo(g))fx.pop(cl(o.x,14,W-14),o.y-34,'-'+Math.round(d),'#ffd6d6');
  if(o.hp<=0){o.ko=80;P[by].kos++;S('boom');A.shake=6;fx.flash('#ffffff',6);fx.ring(o.x,o.y-12,PC[by],40,22);fx.spark(o.x,o.y-12,FORM[o.form].col,22,3.4);fx.debris(o.x,o.y-12,'#4a4458',8,2.4);
   if(!demo(g))fx.pop(cl(o.x,40,W-40),Math.max(30,o.y-44),'KNOCKOUT!',PC[by]);
   if(P[by].kos>=5){if(demo(g)){P[0].kos=P[1].kos=0;}else g.over=A.win(by);}}else S('hit');return true;};
 const morphTo=(h,f)=>{h.form=f;h.morph=18;h.inv=Math.max(h.inv,18);if(f)h.sel=f;h.dash=0;h.act=0;
  fx.ring(h.x,h.y-14,f?'#7dff6a':'#ffffff',30,18);fx.spark(h.x,h.y-14,f?'#9dff8a':'#ffffff',12,2.6);if(!demo(g)){fx.pop(cl(h.x,26,W-26),Math.max(28,h.y-40),FORM[f].n,f?FORM[f].col:'#ffffff');if(h.i===0||!A.cpu)S('score');}};
 const attack=h=>{const F=FORM[h.form],o=P[1-h.i];h.cd=F.cd;h.act=12;
  if(h.form===0){if(!o.ko&&Math.sign(o.x-h.x)===h.face&&Math.abs(o.x-h.x)<18&&Math.abs(o.y-h.y)<16){hurt(o,6,h.face*2.2,h.i);fx.spark(o.x,o.y-12,'#ffffff',6,2);}else if(!demo(g))S('blip');}
  else if(h.form===1){shots.push({k:'fire',x:h.x+h.face*9,y:h.y-15,vx:h.face*3.7,vy:0,own:h.i,life:90});if(!demo(g))S('shoot');}
  else if(h.form===2){
   // a slam: hits anyone close and sends quake waves both ways along the floor you stand on
   if(!h.gnd){h.vy=6;h.slam=1;h.cd=10;return;}
   quake(h);}
  else if(h.form===3){h.dash=14;h.hitD=0;h.vx=h.face*6.2;if(!demo(g))S('jump');}
  else{const hit=!o.ko&&Math.sign(o.x-h.x)===h.face&&Math.abs(o.x-h.x)<66&&Math.abs(o.y-h.y)<22;shots.push({k:'sonic',x:h.x+h.face*8,y:h.y-16,vx:h.face*3,vy:0,own:h.i,life:20});if(hit)hurt(o,7,h.face*4.2,h.i);if(!demo(g))S('blip');}};
 const quake=h=>{const o=P[1-h.i],y=h.y;h.act=14;A.shake=Math.max(A.shake||0,4);S('boom');fx.ring(h.x,y,'#d8c8a0',30,16);fx.debris(h.x,y-2,'#8a7a5a',10,2.2);
  if(!o.ko&&Math.abs(o.x-h.x)<24&&Math.abs(o.y-h.y)<20)hurt(o,11,Math.sign(o.x-h.x||1)*4,h.i);
  for(const d of[-1,1])shots.push({k:'wave',x:h.x+d*10,y,vx:d*2.6,vy:0,own:h.i,life:60,on:h.gnd});};
 const updH=(h,k,e)=>{
  if(h.ko>0){if(--h.ko===0)spawn(h);return;}
  if(h.inv>0)h.inv--;if(h.cd>0)h.cd--;if(h.act>0)h.act--;if(h.flash>0)h.flash--;if(h.drop>0)h.drop--;
  if(h.morph>0){h.morph--;h.vx*=.8;}
  // the band: aliens burn energy, the kid recharges it, and an empty band turns you back
  if(h.form){h.en-=MDRAIN+(h.form===4&&!h.gnd&&k.u?.12:0)+(h.form===3&&Math.abs(h.vx)>2?.03:0);if(h.en<=0){h.en=0;morphTo(h,0);h.tired=60;if(!demo(g))fx.pop(cl(h.x,30,W-30),Math.max(28,h.y-48),'TIMED OUT!','#ff6a5a');}}
  else{h.en=Math.min(100,h.en+MREGEN*(h.tired>0?.5:1));if(h.tired>0)h.tired--;}
  const F=FORM[h.form],o=P[1-h.i];
  if(e.b&&h.morph<=0&&h.stun<=0){if(k.d&&h.form){morphTo(h,0);}else if(!h.form){if(h.en>=MMIN){h.en-=MCOST;morphTo(h,h.sel);}else if(!demo(g)&&(h.i===0||!A.cpu)){S('blip');fx.pop(cl(h.x,30,W-30),Math.max(28,h.y-40),'RECHARGING','#9dff8a');}}
   else{h.en-=MCOST*.6;morphTo(h,h.form%4+1);}}
  const can=h.stun<=0&&h.morph<=0;if(h.stun>0)h.stun--;
  const dir=can?(k.r?1:0)-(k.l?1:0):0;
  if(h.dash>0){h.dash--;h.vx=h.face*6.2;if(lo())h.trail.push({x:h.x,y:h.y,t:12,f:h.face});
   if(!h.hitD&&!o.ko&&Math.abs(o.x-h.x)<14&&Math.abs(o.y-h.y)<18){h.hitD=1;hurt(o,9,h.face*3.6,h.i);fx.spark(o.x,o.y-12,'#9cd2ff',10,2.6);}}
  else if(dir){const sp=F.spd*(h.gnd?1:.9);h.vx+=(dir*sp-h.vx)*(h.gnd?.35:.12);h.face=dir;}
  else{h.vx*=h.gnd?.7:.97;if(can&&!o.ko)h.face=o.x>h.x?1:-1;}
  if(h.gnd)h.jumps=0;
  if(can&&e.u){if(h.gnd){h.vy=-F.jmp;h.gnd=null;h.jumps=1;if(!demo(g)&&(h.i===0||!A.cpu))S('jump');}
   else if(h.form===3&&h.jumps<2){h.vy=-F.jmp*.85;h.jumps=2;if(lo())fx.ring(h.x,h.y,'#9cd2ff',10,10);}}
  if(can&&k.d&&h.gnd&&h.gnd!==GND&&!e.b){h.drop=10;h.gnd=null;h.y+=1;}
  if(can&&e.a&&h.cd<=0)attack(h);
  // HOWLWING flies while UP is held
  const fly=h.form===4&&!h.gnd&&k.u&&can&&h.en>0;
  if(!h.gnd){if(fly){h.vy=Math.max(-2.1,h.vy-.42);}h.vy=Math.min(h.slam?7:5,h.vy+(h.form===4&&!fly?.12:.22));const py=h.y;h.y+=h.vy;h.x+=h.vx;
   if(h.vy>=0){for(const p of MPL.concat([GND])){if(p!==GND&&h.drop>0)continue;if(h.x>=p.x0-3&&h.x<=p.x1+3&&py<=p.y+.01&&h.y>=p.y){h.y=p.y;h.vy=0;h.gnd=p;
     if(h.slam){h.slam=0;quake(h);}else if(lo()&&!demo(g)&&py<p.y-2)for(let q=0;q<3;q++)motes.push({x:h.x+rnd(8)-4,y:h.y-1,dust:16,vx:rnd(1)-.5});break;}}}
   if(h.y<22){h.y=22;h.vy=Math.max(0,h.vy);}}
  else{h.x+=h.vx;if(h.x<h.gnd.x0-3||h.x>h.gnd.x1+3){h.gnd=null;h.jumps=Math.max(h.jumps,1);}else{h.y=h.gnd.y;h.vy=0;}}
  if(h.x<8){h.x=8;h.vx=Math.abs(h.vx)*.3;if(h.dash)h.dash=0;}if(h.x>W-8){h.x=W-8;h.vx=-Math.abs(h.vx)*.3;if(h.dash)h.dash=0;}
  // energy orbs from the pod
  for(let i=orbs.length-1;i>=0;i--){const b=orbs[i];if(hyp(b.x-h.x,b.y-(h.y-12))<13){h.en=100;h.hp=Math.min(100,h.hp+10);orbs.splice(i,1);fx.ring(h.x,h.y-12,'#7dff6a',24,16);if(!demo(g)){fx.pop(cl(h.x,26,W-26),Math.max(28,h.y-40),'FULL CHARGE','#9dff8a');S('coin');}}}
  for(const tr of h.trail)tr.t--;while(h.trail.length&&h.trail[0].t<=0)h.trail.shift();};
 const GND={x0:-50,x1:W+50,y:GY};
 // CPU brain: pick the alien that suits the range, keep it at that range, attack when lined up
 const brain=h=>{const k={},o=P[1-h.i],sk=h.i===1&&!demo(g)?skill():.9;if(h.ko)return k;
  const dx=o.x-h.x,ady=Math.abs(o.y-h.y),dist=Math.abs(dx);
  if(--h.think<=0){h.think=6+ri(Math.round(4+(1-sk)*24));
   if(--h.wantT<=0||!h.want){h.wantT=4+ri(6);h.want=o.ko?h.want:dist>120?1:dist>70?(o.y<h.y-30?4:3):2;}
   if(h.en<30&&h.form)h.want=h.form;
   h.goOrb=orbs.length&&(h.en<45||h.hp<50)?orbs[0]:null;
   h.lazy=Math.random()<(1-sk)*.35;}
  if(h.lazy)return k;
  // morphing: from the kid once charged, and cycling towards the wanted alien
  if(h.morph<=0&&h.stun<=0){if(!h.form){if(h.en>=MMIN+15&&(t+h.i*7)%(10+Math.round((1-sk)*30))===0){h.sel=h.want;k.b=1;}}
   else if(h.form!==h.want&&h.en>50&&h.cd<=0&&h.morph<=0&&(t+h.i*5)%(14+Math.round((1-sk)*30))===0)k.b=1;}
  // where to stand
  let tx=o.x;const F=h.form;
  if(h.goOrb)tx=h.goOrb.x;
  else if(F===1)tx=o.x-Math.sign(dx||1)*110;else if(F===4)tx=o.x-Math.sign(dx||1)*44;else if(F===3)tx=o.x-Math.sign(dx||1)*50;else if(!F&&h.en<MMIN)tx=o.x-Math.sign(dx||1)*130;
  tx=cl(tx,14,W-14);if(Math.abs(tx-h.x)>8)k[tx>h.x?'r':'l']=1;
  // getting up and down
  const ty=h.goOrb?h.goOrb.y+10:o.y;
  if(ty<h.y-24&&h.gnd&&!h.stun){const p=MPL.find(p=>p.y<h.y-8&&h.x>p.x0-24&&h.x<p.x1+24);if(p||F===4)k.u=Math.random()<.5;}
  if(F===4&&ty<h.y-10&&!h.gnd)k.u=1;
  if(ty>h.y+24&&h.gnd&&h.gnd!==GND)k.d=Math.random()<.3;
  // dodging fireballs
  for(const s of shots)if(s.own!==h.i&&s.k==='fire'&&Math.sign(h.x-s.x)===Math.sign(s.vx)&&Math.abs(s.x-h.x)<44&&Math.abs(s.y-h.y+12)<10&&Math.random()<sk*.5&&h.gnd)k.u=1;
  // attacking
  if(h.cd<=0&&!o.ko&&o.inv<=0&&h.morph<=0){const face=Math.sign(dx||1);let ok=false;
   if(!F)ok=dist<17&&ady<14;else if(F===1)ok=ady<12&&dist<200;else if(F===2)ok=dist<24&&ady<18||ady<4&&o.gnd&&h.gnd===o.gnd&&dist<150;else if(F===3)ok=dist<80&&ady<12;else ok=dist<62&&ady<20;
   if(ok&&Math.random()<.18+sk*.55){if(face!==h.face&&!k.l&&!k.r)k[face>0?'r':'l']=1;else k.a=1;}}
  return k;};
 g.update=()=>{t++;
  for(const h of P){const k=demo(g)||(h.i===1&&A.cpu)?brain(h):A.in(h.i);if(h.i===1&&A.cpu&&!demo(g))A.bot(k);updH(h,k,edge(h,k));}
  // a fighter landing a stomp on the other is a bump, not a ride
  const [a,b]=P;if(!a.ko&&!b.ko&&Math.abs(a.x-b.x)<10&&Math.abs(a.y-b.y)<14){const d=a.x<b.x?-1:1;a.vx+=d*.6;b.vx-=d*.6;}
  // shots
  for(let i=shots.length-1;i>=0;i--){const s=shots[i],o=P[1-s.own];s.life--;s.x+=s.vx;s.y+=s.vy;let dead=s.life<=0||s.x<-10||s.x>W+10;
   if(s.k==='fire'){if(lo()&&t%2===0)motes.push({x:s.x,y:s.y,ember:18,vx:-s.vx*.1+rnd(.4)-.2});if(!dead&&!o.ko&&Math.abs(s.x-o.x)<8&&Math.abs(s.y-(o.y-12))<12){if(hurt(o,7,Math.sign(s.vx)*2.4,s.own)){fx.spark(s.x,s.y,'#ffb34a',10,2.4);}dead=true;}
    for(const p of MPL)if(s.x>p.x0&&s.x<p.x1&&s.y>p.y&&s.y<p.y+8){dead=true;fx.spark(s.x,s.y,'#ffb34a',5,1.6);}}
   else if(s.k==='wave'){if(s.on&&(s.x<s.on.x0||s.x>s.on.x1))dead=true;if(!dead&&!o.ko&&o.gnd===s.on&&Math.abs(s.x-o.x)<9){hurt(o,8,Math.sign(s.vx)*3,s.own);dead=true;}
    if(lo()&&t%3===0)fx.debris(s.x,s.y-1,'#8a7a5a',1,1.2);}
   if(dead)shots.splice(i,1);}
  // the pod spits out an energy orb now and then
  if(t%540===300&&orbs.length<2){orbs.push({x:160,y:150,vx:(Math.random()<.5?-1:1)*(.6+rnd(1.3)),vy:-3.2,gnd:0});fx.ring(160,160,'#7dff6a',20,14);}
  for(const b of orbs){if(b.gnd)continue;b.vy+=.12;const py=b.y;b.x+=b.vx;b.y+=b.vy;if(b.x<10||b.x>W-10)b.vx*=-1;for(const p of MPL.concat([GND]))if(b.x>p.x0&&b.x<p.x1&&py<=p.y-6&&b.y>=p.y-6){b.y=p.y-6;b.gnd=1;}}
  for(const m of motes){if(m.dust){m.dust--;m.x+=m.vx;m.y-=.2;}else if(m.ember){m.ember--;m.x+=m.vx;m.y-=.3;}else{m.p+=.02;m.x+=Math.sin(m.p)*m.s;m.y+=Math.cos(m.p*1.3)*.2;}}
  for(let i=motes.length-1;i>=0;i--)if(motes[i].dust===0||motes[i].ember===0)motes.splice(i,1);
  g.score=P[0].kos*100+Math.round(P[0].dmg);};
 g.timeUp=()=>P[0].kos!==P[1].kos?tu(P[0].kos,P[1].kos):tu(P[0].hp,P[1].hp);
 g._P=P;g.fxClear=fx.clear;

 /* ---- scene ---- */
 const back=()=>X.cache('morph_bg',()=>{const c=A.c;
  X.sky(['#060818','#10183a','#24305a','#3a4a6a'],GY);X.stars(70,11,0,0,140,.9);
  // a big cratered moon and a green aurora from the pod
  X.glow(236,84,56,'#cfe8ff',.18);X.disc(236,84,18,X.rg(229,77,2,236,84,18,['#ffffff','#d8e2ee','#8a98ae']));
  for(const[x,y,r]of[[230,79,3.4],[242,89,4],[240,76,2],[227,91,1.8]])X.disc(x,y,r,'rgba(110,124,150,.45)');
  c.globalCompositeOperation='lighter';for(let i=0;i<4;i++){const y=40+i*10;c.strokeStyle='rgba(90,255,140,'+(.08-i*.015)+')';c.lineWidth=8-i;c.beginPath();for(let x=0;x<=W;x+=10)c[x?'lineTo':'moveTo'](x,y+Math.sin(x*.025+i)*10);c.stroke();}c.globalCompositeOperation='source-over';
  X.hills(150,30,'#1a2440',0,.018,2);X.hills(172,24,'#141a30',40,.026,5);
  // junk piles: car hulks, tyres and a crane on the skyline
  c.fillStyle='#0e1222';c.fillRect(278,94,3,80);c.fillRect(250,94,60,3);c.fillRect(296,97,1,26);X.rr(290,122,12,8,1,'#0e1222');
  for(let i=0;i<9;i++){const x=hash(i,3)*W,w=24+hash(i,4)*30,h=10+hash(i,5)*16;X.poly([[x-w/2,190],[x-w/3,190-h],[x+w/4,190-h*1.1],[x+w/2,190]],i%2?'#1a1e30':'#151828');}
  for(let i=0;i<7;i++){const x=12+hash(i,7)*296;X.disc(x,186,5,'#0c0e18');X.disc(x,186,2.4,'#1e2236');}
  // the crashed pod, half-buried in its own crater, cracked open and glowing
  const px=160,py=172;X.ell(px,py+14,70,12,'#0c1018');X.glow(px,py,70,'#4dff7a',.22);
  c.save();c.translate(px,py);c.rotate(-.18);
  X.ell(0,0,38,20,X.lg(0,-20,0,20,['#8a96aa','#4a5468','#1e2432']));c.fillStyle='rgba(255,255,255,.25)';c.fillRect(-26,-14,40,2);
  for(let k=-3;k<=3;k++){c.fillStyle='rgba(0,0,0,.35)';c.fillRect(k*10-.5,-18,1,36);}
  X.poly([[-6,-18],[4,-6],[-2,2],[8,14],[2,18],[-6,6],[0,-2],[-10,-14]],'#a8ffb8');X.glow(0,0,26,'#4dff7a',.5);
  X.ell(18,-8,8,5,'rgba(150,255,190,.55)');c.restore();
  // a chain fence and the crater floor
  c.strokeStyle='rgba(120,130,160,.18)';c.lineWidth=.5;c.beginPath();for(let x=-20;x<W;x+=8){c.moveTo(x,150);c.lineTo(x+40,196);c.moveTo(x+40,150);c.lineTo(x,196);}c.stroke();
  c.fillStyle='rgba(60,70,90,.6)';for(let x=6;x<W;x+=48)c.fillRect(x,146,2,50);c.fillRect(0,148,W,1);
  X.vg(0,GY,W,H-GY,['#3a3428','#221e18','#141210']);c.fillStyle='rgba(255,255,255,.12)';c.fillRect(0,GY,W,1);
  for(let i=0;i<60;i++){c.fillStyle='rgba(0,0,0,'+(.1+hash(i,1)*.2)+')';c.fillRect(hash(i,2)*W,GY+3+hash(i,3)*30,1+hash(i,4)*4,1);}
  c.strokeStyle='rgba(110,255,150,.35)';c.lineWidth=.8;c.beginPath();c.moveTo(130,GY+2);c.lineTo(122,GY+10);c.lineTo(126,GY+18);c.moveTo(190,GY+2);c.lineTo(200,GY+12);c.lineTo(194,GY+22);c.stroke();
  // the platforms: a wrecked bus roof, a truck bed and a girder bridge over the pod
  MPL.forEach((p,i)=>{const w=p.x1-p.x0;
   if(i<2){X.rr(p.x0,p.y,w,12,3,X.lg(0,p.y,0,p.y+12,i?['#c86a3a','#8a4424','#4a2414']:['#d8b23a','#9a7a24','#4a3a14']));c.fillStyle='rgba(0,0,0,.4)';for(let x=p.x0+6;x<p.x1-6;x+=12)c.fillRect(x,p.y+3,8,5);c.fillStyle='rgba(160,220,255,.25)';for(let x=p.x0+6;x<p.x1-6;x+=12)c.fillRect(x,p.y+3,8,1.5);
    c.fillStyle='#14100c';c.fillRect(p.x0+8,p.y+12,4,GY-p.y-12);c.fillRect(p.x1-12,p.y+12,4,GY-p.y-12);c.fillStyle='rgba(255,255,255,.3)';c.fillRect(p.x0+2,p.y,w-4,1);}
   else{X.vg(p.x0,p.y,w,6,['#7a8296','#3a4052']);c.strokeStyle='#3a4052';c.lineWidth=1;c.beginPath();for(let x=p.x0;x<p.x1;x+=8){c.moveTo(x,p.y+6);c.lineTo(x+8,p.y+14);c.moveTo(x+8,p.y+6);c.lineTo(x,p.y+14);}c.stroke();c.fillStyle='#3a4052';c.fillRect(p.x0,p.y+13,w,2);
    c.strokeStyle='rgba(30,34,48,.9)';c.beginPath();c.moveTo(p.x0+4,p.y+15);c.lineTo(p.x0-10,GY);c.moveTo(p.x1-4,p.y+15);c.lineTo(p.x1+10,GY);c.stroke();c.fillStyle='rgba(255,255,255,.35)';c.fillRect(p.x0,p.y,w,1);}});
  X.vignette(.35);});
 // the band's emblem: a hexagon split by a lightning bolt
 const emblem=(x,y,r,col)=>{const pts=[];for(let k=0;k<6;k++){const a=k*TAU/6+Math.PI/6;pts.push([x+Math.cos(a)*r,y+Math.sin(a)*r]);}X.poly(pts,'#10141c');X.polys(pts,col,.8);
  X.poly([[x+r*.15,y-r*.75],[x-r*.4,y+r*.1],[x,y+r*.05],[x-r*.15,y+r*.75],[x+r*.4,y-r*.1],[x,y-r*.05]],col);};
 const fighter=h=>{const c=A.c;if(h.ko)return;if(h.inv>0&&!h.morph&&h.inv%8<3&&h.inv<80)return;
  const F=h.form,col=FORM[F].col,pc=PC[h.i],mv=h.gnd&&Math.abs(h.vx)>.3,run=mv?Math.sin(t*(F===3?.9:.45)):0,at=h.act/12;
  // afterimages behind the speed alien
  for(const tr of h.trail){c.globalAlpha=tr.t/24;X.ell(tr.x,tr.y-11,7,9,'#3a8cff');}c.globalAlpha=1;
  X.shadow(h.x,h.gnd?h.gnd.y:GY,F===2?11:7,1.8,h.gnd?.4:.18);
  c.save();c.translate(h.x,h.y);c.scale(h.face*1.2,1.2);
  if(h.flash>0){c.globalAlpha=.6+.4*Math.sin(t);}
  if(h.morph>0){const m=h.morph/18;c.globalAlpha=.4+.6*(1-m);X.glow(0,-14,26,'#7dff6a',.7*m);}
  if(F===0){
   // the kid: sneakers, jeans, a jacket in the player colour and the band glowing on the wrist
   c.strokeStyle='#2a3a5a';c.lineWidth=2.6;c.beginPath();c.moveTo(-1.5,-8);c.lineTo(-2-run*2.4,-1);c.moveTo(1.5,-8);c.lineTo(2+run*2.4,-1);c.stroke();
   c.fillStyle='#f6f6f6';c.fillRect(-4-run*2.4,-1.5,4,1.8);c.fillRect(run*2.4,-1.5,4,1.8);
   X.rr(-4,-17,8,10,2,X.lg(-4,0,4,0,[X.lt(pc,1.3),pc,X.lt(pc,.6)]));c.fillStyle='#f6f1e6';c.fillRect(-.6,-17,1.2,9);
   c.strokeStyle=X.lt(pc,.8);c.lineWidth=2;c.beginPath();c.moveTo(0,-15);c.lineTo(5+at*4,-11-at*3);c.moveTo(0,-15);c.lineTo(-3-run,-9);c.stroke();
   X.disc(5.5+at*4,-11-at*3,1.5,'#f1c7a3');X.rr(3.5+at*4,-13-at*3,3.4,2.6,.8,'#1a1e26');X.disc(5.2+at*4,-11.7-at*3,.9,h.en>=MMIN?'#7dff6a':'#ff6a5a');
   X.disc(0,-21,4,'#f1c7a3');c.fillStyle='#4a2a18';c.beginPath();c.arc(-.5,-22,4.3,Math.PI*.9,TAU*1.02);c.fill();c.fillRect(-4.6,-23,3,4);
   c.fillStyle='#14121c';c.fillRect(1.6,-21.5,1.2,1.4);
   if(lo()&&h.en>=MMIN)X.glow(5.2+at*4,-11.7-at*3,5,'#7dff6a',.5);}
  else if(F===1){
   // EMBERCLAW: a magma body under cooled black crust, a head of flame
   const fl=Math.sin(t*.5);c.strokeStyle='#2a1810';c.lineWidth=3;c.beginPath();c.moveTo(-2,-8);c.lineTo(-3-run*2.4,0);c.moveTo(2,-8);c.lineTo(3+run*2.4,0);c.stroke();
   X.rr(-5,-19,10,12,3,X.rg(0,-14,1,0,-13,9,['#ffe08a','#ff7a2a','#8a2a10']));
   c.fillStyle='#2a1810';X.poly([[-5,-18],[-1,-16],[-4,-12]],'#2a1810');X.poly([[5,-17],[1,-13],[4,-10]],'#2a1810');X.poly([[-4,-9],[0,-11],[3,-8]],'#2a1810');
   c.strokeStyle='#ff9a3a';c.lineWidth=2.4;c.beginPath();c.moveTo(1,-16);c.lineTo(6+at*4,-14+at*-2);c.stroke();X.disc(6.5+at*4,-14-at*2,2,'#ffe08a');
   if(lo()){X.glow(0,-14,14,'#ff7a2a',.45);if(at>0)X.glow(8,-15,8,'#ffcf3f',.8*at);}
   X.poly([[-4,-19],[-5,-26-fl],[-1.5,-23],[0,-30+fl],[2,-23],[5,-27-fl*.6],[4.5,-19]],X.lg(0,-30,0,-19,['#fff0a0','#ffb34a','#ff5a1a']));
   X.disc(0,-21,3.4,'#3a1a0e');c.fillStyle='#fff3b0';c.fillRect(1,-22,2.2,1.4);
   emblem(-1,-13,2.2,pc);}
  else if(F===2){
   // STONEHIDE: a slab-shouldered rock giant with crystal growths
   const sl=h.act>0?Math.sin(at*Math.PI)*-4:0;
   c.fillStyle='#4a4e40';c.fillRect(-6-run*1.2,-7,4.5,7);c.fillRect(1.5+run*1.2,-7,4.5,7);
   X.rr(-10,-24,20,18,5,X.lg(-10,-24,10,-6,['#c8ccb4','#8a9078','#4a4e40']));
   c.fillStyle='rgba(0,0,0,.25)';c.fillRect(-8,-15,16,1);c.fillRect(-2,-24,1,9);c.fillRect(4,-19,1,6);
   X.gem(-8,-25,6,'#7dffd8');X.gem(-4,-27,4,'#a8ffe8');X.gem(8,-24,5,'#7dffd8');
   X.rr(6,-20+sl,7,9,2.4,'#9aa08a');X.rr(-13,-19,6,9,2.4,'#7a8068');
   X.rr(-4,-30,9,8,3,'#a8ac94');c.fillStyle='#ffe27a';c.fillRect(1.5,-27.5,2.4,1.4);if(lo())X.glow(2.6,-26.8,4,'#ffe27a',.6);
   emblem(0,-14,3,pc);}
  else if(F===3){
   // RIPSTREAK: a lean blue raptor with a visor, a long tail and claws
   const lean=mv||h.dash?.35:.1;c.rotate(lean);
   c.strokeStyle='#14182a';c.lineWidth=2.2;c.beginPath();c.moveTo(-1,-8);c.lineTo(-3-run*3.4,0);c.moveTo(2,-8);c.lineTo(3+run*3.4,0);c.stroke();
   X.poly([[-4,-12],[-16,-9-Math.sin(t*.4)*2],[-4,-8]],'#1a2a5a');
   X.rr(-4,-17,8,10,3,X.lg(-4,0,4,0,['#6ab0ff','#3a8cff','#1a3a8a']));c.fillStyle='#14182a';c.fillRect(-4,-12,8,1.4);
   c.strokeStyle='#1a3a8a';c.lineWidth=1.8;c.beginPath();c.moveTo(1,-15);c.lineTo(6,-12);c.stroke();c.fillStyle='#ffffff';c.fillRect(6,-13,2,.8);c.fillRect(6,-11.6,2,.8);
   X.poly([[-3,-17],[-1,-24],[6,-23],[8,-20],[3,-17]],'#3a8cff');X.poly([[0,-22.5],[7,-21.5],[6.5,-19.6],[0,-20.4]],X.lg(0,-23,0,-19,['#bff0ff','#2a6aa8']));
   X.poly([[-3,-22],[-8,-25],[-2,-20]],'#1a3a8a');emblem(0,-12.5,2,pc);
   if(lo()&&(mv||h.dash))for(let k=0;k<3;k++){c.fillStyle='rgba(160,210,255,'+(.5-k*.12)+')';c.fillRect(-12-k*6,-18+k*4,8,.8);}}
  else{
   // HOWLWING: a purple bat-moth with huge ears; its wings beat faster in flight
   const fly=!h.gnd,wb=Math.sin(t*(fly?.7:.2))*(fly?7:2);
   for(const s of[-1,1]){X.poly([[0,-16],[s*-14,-24-wb],[s*-18,-14-wb*.5],[s*-11,-10],[s*-6,-8]],s>0?'rgba(120,60,200,.92)':'rgba(90,40,160,.92)');c.strokeStyle='rgba(220,180,255,.5)';c.lineWidth=.6;c.beginPath();c.moveTo(0,-16);c.lineTo(s*-14,-24-wb);c.moveTo(0,-15);c.lineTo(s*-17,-14-wb*.5);c.stroke();}
   c.strokeStyle='#3a1a5a';c.lineWidth=2;c.beginPath();c.moveTo(-1,-8);c.lineTo(-2-run*2,0);c.moveTo(1.5,-8);c.lineTo(2.5+run*2,0);c.stroke();
   X.ell(0,-12.5,4.6,6,X.lg(-4,0,4,0,['#d8a8ff','#b46aff','#5a2a9a']));
   X.disc(1,-21,4,'#b46aff');X.poly([[-2,-23],[-4,-31],[0,-24]],'#8a4ad8');X.poly([[2,-24],[5,-31],[4,-22]],'#8a4ad8');
   c.fillStyle='#ffef7a';c.fillRect(1.5,-22,1.5,1.5);c.fillRect(3.4,-22,1.2,1.5);
   if(h.act>0){X.ell(4.6,-19,1.6*at+.6,1.8*at+.6,'#2a0a3a');if(lo())X.glow(6,-19,8,'#e0b0ff',.7*at);}
   emblem(0,-12,2,pc);}
  c.restore();c.globalAlpha=1;
  // transformation: green rings climbing up the body
  if(h.morph>0){const m=1-h.morph/18;for(let k=0;k<3;k++){const yy=h.y-((m*36+k*10)%34);c.strokeStyle='rgba(125,255,106,'+(.8-k*.2)+')';c.lineWidth=1.2;c.beginPath();c.ellipse(h.x,yy,10,2.6,0,0,TAU);c.stroke();}
   if(lo())X.glow(h.x,h.y-14,30*(1-m)+6,'#ffffff',.5*(1-m));}
  if(h.stun>0&&!h.morph)for(let k=0;k<3;k++){const a=t*.15+k*2.1;X.disc(h.x+Math.cos(a)*6,h.y-(F===2?42:35)+Math.sin(a)*1.5,.9,'#ffcf3f');}
  X.ot(A.nm(h.i),cl(h.x,8,W-8),Math.max(20,h.y-(F===2?48:F===4?46:42)),pc,1,'c');};
 // the HUD's band dial: four alien icons around the emblem, the energy ring and health
 const dial=(h,x)=>{const c=A.c,r=h.i?-1:1,pc=PC[h.i];
  X.panel(x,20,96,24,pc);
  X.meter(x+22,23,70,5,h.hp/100,h.hp>35?'#3dff8b':'#ff4f4f');
  X.meter(x+22,30,70,4,h.en/100,h.en>=MMIN?'#7dff6a':'#ff9a3a');
  for(let f=1;f<=4;f++){const fx_=x+26+(f-1)*17,on=h.form===f,sel=!h.form&&h.sel===f;X.rr(fx_,36,13,6,2,on?FORM[f].col:sel?X.rgba(FORM[f].col,.45):'rgba(255,255,255,.12)');if(on)X.rrs(fx_,36,13,6,2,'#ffffff',.6);}
  emblem(x+11,32,8,h.en>=MMIN||h.form?'#7dff6a':'#ff6a5a');if(lo()&&(h.en>=MMIN||h.form))X.glow(x+11,32,12,'#7dff6a',.25+.1*Math.sin(t*.1));
  A.text(FORM[h.form].n,x+48,46,h.form?FORM[h.form].col:'#e8e2d0',1,'c');void r;void c;};
 g.draw=()=>{const c=A.c;back();
  // the pod's pulse and the drifting spores
  if(lo()){X.glow(160,170,46+6*Math.sin(t*.06),'#4dff7a',.16);for(const m of motes){if(m.dust){c.globalAlpha=m.dust/16*.6;X.disc(m.x,m.y,1.4,'#b8a888');}else if(m.ember){c.globalAlpha=m.ember/18;X.disc(m.x,m.y,1,'#ffb34a');}else{c.globalAlpha=.4+.4*Math.sin(t*.05+m.p*3);X.disc(m.x,m.y,.8,'#9dff8a');}}c.globalAlpha=1;}
  for(const b of orbs){const bob=b.gnd?Math.sin(t*.12)*1.5:0;if(lo())X.glow(b.x,b.y+bob,12,'#7dff6a',.55);X.orb(b.x,b.y+bob,4.5,'#5dff6a');emblem(b.x,b.y+bob,2,'#0a3a12');}
  for(const s of shots){if(s.k==='fire'){if(lo())X.glow(s.x,s.y,10,'#ff7a2a',.7);X.disc(s.x,s.y,3.4,X.rg(s.x,s.y,0,s.x,s.y,3.4,['#fff6c0','#ffb34a','#ff5a1a']));c.fillStyle='rgba(255,140,40,.6)';c.beginPath();c.moveTo(s.x,s.y-3);c.lineTo(s.x-s.vx*3,s.y);c.lineTo(s.x,s.y+3);c.fill();}
   else if(s.k==='wave'){const hgt=7+Math.sin(t*.6+s.x)*2;X.poly([[s.x-6,s.y],[s.x-2,s.y-hgt],[s.x+1,s.y-hgt*.6],[s.x+5,s.y-hgt*.9],[s.x+7,s.y]],'#a89a72');c.fillStyle='rgba(255,255,255,.3)';c.fillRect(s.x-3,s.y-hgt+1,4,1);}
   else{const r=(20-s.life)*1.4+3;c.strokeStyle='rgba(224,176,255,'+(s.life/20).toFixed(2)+')';c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();c.arc(s.x-Math.sign(s.vx)*(k*5),s.y,r-k*3>1?r-k*3:1,s.vx>0?-.7:Math.PI-.7,s.vx>0?.7:Math.PI+.7);c.stroke();}}}
  for(const h of P)fighter(h);
  fx.draw();
  X.bar();A.hud2(P[0].kos,P[1].kos);A.text('FIRST TO 5',160,6,'#9dff8a',1,'c');
  dial(P[0],4);dial(P[1],W-100);
  if(t<100)X.ot('PRESS B TO MORPH!',160,64,'#9dff8a',2,'c');};
 return g;}});
/* ================= OVERDRIVE AGENT ================= */
// a race across a city's elevated freeway; the suit's four modes each beat one kind of obstacle
const MODE=[null,
 {n:'STRENGTH',k:'DOWN',col:'#ff5a4a',spd:1.9},
 {n:'SPEED',k:'RIGHT',col:'#ffcf3f',spd:3.3},
 {n:'FLIGHT',k:'UP',col:'#3dd6ff',spd:2.3},
 {n:'CANNON',k:'LEFT',col:'#7dff6a',spd:2.1}];
const NEED={wall:1,laser:2,pit:3,drone:4,bar:0};
const OFIN=10000,LH=110,GL=90;
const lpos=o=>o.k==='pit'?o.w:o.k==='wall'?12:o.k==='laser'?8:o.k==='bar'?8:10;

A.add({id:'overdrive',name:'OVERDRIVE AGENT',cat:'VERSUS',vs:1,time:120,warm:200,tags:'max steel turbo suit hero energy modes robot runner race action versus 2 player',
 how:'DOWN STRENGTH, RIGHT SPEED, UP FLIGHT, LEFT CANNON. A JUMPS OR FIRES. MATCH EACH BLOCK.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0;
 // one course for both agents: walls to smash, laser gates to blitz, gaps to fly, drones to shoot, rails to jump
 const OB=g._OB=[],CELLS=[];{let x=420;const kinds=['wall','laser','pit','drone','bar'];let last='';
  while(x<OFIN-300){const d=x/OFIN;let k=kinds[ri(5)];if(k===last)k=kinds[ri(5)];last=k;
   const o={x,k,w:k==='pit'?92+ri(30)+Math.round(d*20):lpos({k}),ph:ri(100)};OB.push(o);
   if(Math.random()<.45)CELLS.push({x:x+lpos(o)+40+ri(30),y:14+ri(12)});
   x+=lpos(o)+Math.round(150+rnd(120)-d*60);}}
 const R=g._R=[0,1].map(i=>({i,x:40,y:0,vy:0,mode:2,tb:100,stun:0,fall:0,fin:0,pts:0,cd:0,gone:new Set(),got:new Set(),bolts:[],shots:[],pk:{},think:0,miss:-1,wob:0,last:-99}));
 const pop=(r,txt,col)=>{if(!demo(g))fx.pop(cl(r.x-camX(r)+0,30,W-30),r.i*LH+18+GL-44,txt,col);};
 const camX=r=>r.x-80;
 const setMode=(r,m)=>{if(r.mode===m||r.stun>0&&r.fall)return;if(m!==1&&m!==4&&r.tb<8)return;r.mode=m;r.tb=Math.max(0,r.tb-4);r.wob=10;if(!demo(g)&&(r.i===0||!A.cpu))S('blip');};
 const bump=(r,o,st,back,txt)=>{r.stun=st;r.wrong=0;r.x=Math.max(r.x-back,o.x-back);r.vy=Math.max(r.vy,1.4);r.y=Math.max(r.y,.01);if(!demo(g)){pop(r,txt,'#ff8a7a');if(r.i===0||!A.cpu)S('hit');}A.shake=Math.max(A.shake||0,r.i===0?3:1);};
 const step=(r,k,e)=>{
  if(r.fin){r.x+=1;return;}
  if(r.cd>0)r.cd--;if(r.wob>0)r.wob--;
  if(r.fall>0){r.fall--;r.y-=2.2;if(r.fall===0){r.y=0;r.vy=0;r.x=r.fallX;r.stun=12;
   // the suit's emergency reserve: enough turbo to fly the gap next time
   if(r.tb<40){r.tb=40;pop(r,'RESERVE TURBO','#7ad6ff');}}return;}
  if(e.d)setMode(r,1);else if(e.r)setMode(r,2);else if(e.u)setMode(r,3);else if(e.l)setMode(r,4);
  // turbo: speed and flight burn it, strength and cannon recharge it; running dry drops you into strength
  const M=MODE[r.mode];if(r.mode===2)r.tb-=.2;else if(r.mode===3)r.tb-=.13;else r.tb=Math.min(100,r.tb+.2);
  if(r.tb<=0){r.tb=0;r.mode=1;r.wob=10;pop(r,'TURBO EMPTY','#ff9a3a');}
  const sp=r.stun>0?.3:M.spd*(r.i===1&&A.cpu&&!demo(g)?.8+.2*skill():1);if(r.stun>0)r.stun--;r.x+=sp;
  // flight hovers; the others jump on A
  if(r.mode===3){const ty=k.a?30:22;r.y+=(ty-r.y)*.12;r.vy=0;}
  else{if(r.y>0||r.vy>0){r.vy-=.2;r.y+=r.vy;if(r.y<=0){r.y=0;r.vy=0;}}
   if(e.a&&r.y<=0&&r.stun<=0){r.vy=3.3;r.y=.01;if(!demo(g)&&(r.i===0||!A.cpu))S('jump');}}
  if(r.mode===4&&k.a&&r.cd<=0&&r.stun<=0){r.cd=11;r.shots.push({x:r.x+8,y:r.y+15});if(!demo(g)&&(r.i===0||!A.cpu))S('shoot');}
  for(let i=r.shots.length-1;i>=0;i--){const s=r.shots[i];s.x+=6;let dead=s.x>r.x+240;
   for(let j=0;j<OB.length&&!dead;j++){const o=OB[j];if(o.k!=='drone'||r.gone.has(j))continue;if(s.x>=o.x-4&&s.x<=o.x+12){r.gone.add(j);dead=true;r.pts+=40;fx.spark(o.x-camX(r)+5,r.i*LH+18+GL-24,'#ffcf3f',10,2.4);if(!demo(g)){pop(r,'+40','#7dff6a');if(r.i===0||!A.cpu)S('boom');}}
    else if(o.k==='wall'&&!r.gone.has(j)&&s.x>=o.x&&s.x<=o.x+12)dead=true;}
   if(dead)r.shots.splice(i,1);}
  // obstacles
  for(let j=0;j<OB.length;j++){const o=OB[j];if(r.gone.has(j))continue;const x0=o.x,x1=o.x+o.w;if(r.x+6<x0||r.x-6>x1)continue;
   if(o.k==='wall'){if(r.mode===1){r.gone.add(j);r.pts+=30;fx.debris(o.x-camX(r)+6,r.i*LH+18+GL-20,'#9aa2b0',12,2.6);fx.spark(o.x-camX(r)+6,r.i*LH+18+GL-20,'#ff5a4a',8,2);A.shake=Math.max(A.shake||0,r.i?1:3);if(!demo(g)){pop(r,'SMASH! +30','#ff8a6a');if(r.i===0||!A.cpu)S('boom');}}else bump(r,o,30,10,'NEED STRENGTH');}
   else if(o.k==='laser'){const on=(t+o.ph)%96<58;if(r.mode===2){if(!o.p){o.p=1;}}else if(on){bump(r,o,26,14,'NEED SPEED');fx.spark(o.x-camX(r)+4,r.i*LH+18+GL-12-r.y,'#ff3b6a',8,2);}}
   else if(o.k==='pit'){if(r.y<=0&&r.x>x0+4&&r.x<x1-4){r.fall=40;r.wrong=0;r.fallX=x0-24;if(!demo(g)){pop(r,'NEED FLIGHT','#7ad6ff');if(r.i===0||!A.cpu)S('lose');}}}
   else if(o.k==='drone'){if(r.y<34){r.gone.add(j);fx.spark(o.x-camX(r)+5,r.i*LH+18+GL-24,'#ff9a3a',12,2.6);if(r.mode===1){r.stun=8;r.pts+=20;pop(r,'PUNCHED +20','#ff8a6a');}else bump(r,o,22,0,'NEED CANNON');if(!demo(g)&&(r.i===0||!A.cpu))S('boom');}}
   else if(o.k==='bar'){if(r.y<10)bump(r,o,20,26,'JUMP!');}}
  // drones shoot at whoever comes near
  for(let j=0;j<OB.length;j++){const o=OB[j];if(o.k!=='drone'||r.gone.has(j))continue;const d=o.x-r.x;if(d>30&&d<170&&(t+o.ph+r.i*13)%80===0)r.bolts.push({x:o.x,y:22});}
  for(let i=r.bolts.length-1;i>=0;i--){const b=r.bolts[i];b.x-=2.6;let dead=b.x<r.x-120;
   if(!dead&&Math.abs(b.x-r.x)<6&&b.y>r.y+2&&b.y<r.y+26){dead=true;if(r.mode===1){fx.spark(b.x-camX(r),r.i*LH+18+GL-b.y,'#ffffff',4,1.4);}else bump(r,{x:r.x+20},14,4,'OUCH');}
   if(dead)r.bolts.splice(i,1);}
  for(const c of CELLS){if(r.got.has(c))continue;if(Math.abs(c.x-r.x)<9&&Math.abs(c.y-(r.y+14))<14){r.got.add(c);r.tb=Math.min(100,r.tb+35);r.pts+=10;if(!demo(g)){pop(r,'TURBO +35','#7ad6ff');if(r.i===0||!A.cpu)S('coin');}}}
  if(r.x>=OFIN){r.fin=1;fx.flash(PC[r.i],10);if(!demo(g))S('win');}};
 // CPU: look at the next live obstacle, switch to the mode that beats it in time (late, or wrong, more often on easy)
 const nextOb=r=>{for(let j=0;j<OB.length;j++){const o=OB[j];if(r.gone.has(j)||o.x+o.w<r.x-6)continue;return[o,j];}return[null,-1];};
 const brain=r=>{const k={},sk=r.i===1&&!demo(g)?skill():.92;if(r.fin||r.fall)return k;
  const [o,j]=nextOb(r);if(!o){k.r=1;return k;}const d=o.x-r.x;
  if(j!==r.last){r.last=j;r.late=Math.random()>sk+.1;r.wrong=Math.random()<(1-sk)*.45;}
  const react=(r.late?28:52)+sk*60;let want=r.tb>40?2:4;
  if(d<react){const n=NEED[o.k];if(n)want=n;if(r.wrong&&n)want=n%4+1;
   if(o.k==='pit'&&r.tb<22)want=2;if(o.k==='laser'&&r.tb<14)want=4;if(o.k==='bar')want=r.mode;}
  else if(r.mode===3&&r.y>0){const p=OB.find(q=>q.k==='pit'&&q.x<r.x+8&&q.x+q.w>r.x-8);if(p)want=3;}
  // never drop out of the air over a gap
  {const p=OB.find(q=>q.k==='pit'&&q.x<r.x+10&&q.x+q.w>r.x-10);if(p&&r.mode===3)want=3;}
  const key=['','d','r','u','l'][want];if(r.mode!==want)k[key]=1;
  if(o.k==='bar'&&d<30&&d>7&&r.mode!==3)k.a=t%2;
  if(o.k==='pit'&&r.mode===2&&d<10&&d>0)k.a=1;
  if(r.mode===4){const dr=OB.find((q,i)=>q.k==='drone'&&!r.gone.has(i)&&q.x>r.x&&q.x-r.x<180);if(dr&&Math.random()<.4+sk*.5&&!(o.k==='bar'&&d<34))k.a=t%4<2;}
  return k;};
 g.update=()=>{t++;
  for(const r of R){const k=demo(g)||(r.i===1&&A.cpu)?brain(r):A.in(r.i);if(r.i===1&&A.cpu&&!demo(g))A.bot(k);step(r,k,edge(r,k));}
  g.score=Math.floor(Math.min(OFIN,R[0].x)/10)+R[0].pts;
  const done=R.filter(r=>r.fin);
  if(done.length&&!g.over){if(demo(g)){if(done.length===2)R.forEach(r=>{r.x=40;r.fin=0;r.gone.clear();r.got.clear();r.tb=100;});return;}
   g.over=done.length===2?'PHOTO FINISH - DRAW':A.win(done[0].i);}};
 g.timeUp=()=>Math.abs(R[0].x-R[1].x)<4?'TIME UP - DRAW':tu(R[0].x,R[1].x);g.fxClear=fx.clear;

 /* ---- scene: two stacked lanes, each a side view of the freeway at dusk ---- */
 const lane=(r)=>{const c=A.c,y0=18+r.i*LH,cx=camX(r),gy=y0+GL;
  c.save();c.beginPath();c.rect(0,y0,W,LH);c.clip&&c.clip();
  X.vg(0,y0,W,LH,['#1a1040','#5a2a6a','#d8604a','#ffb36a']);
  X.glow(250,gy-14,60,'#ffcf7a',.35);X.disc(250,gy-14,16,X.lg(0,gy-30,0,gy,['#fff0c0','#ffb36a']));
  // far towers, then nearer ones with lit windows and neon, then the freeway
  const far=cx*.15,mid=cx*.4;c.fillStyle='rgba(60,30,80,.85)';for(let i=Math.floor(far/26)-1;i<Math.floor(far/26)+15;i++){const x=i*26-far,h=24+hash(i,1)*34;c.fillRect(x,gy-h-8,20,h+8);if(hash(i,9)>.7){c.fillRect(x+9,gy-h-18,2,10);}}
  for(let i=Math.floor(mid/46)-1;i<Math.floor(mid/46)+9;i++){if(hash(i,6)<.25)continue;const x=i*46-mid,h=16+hash(i,2)*38,w=22+hash(i,3)*10;X.vg(x,gy-h-6,w,h+6,['#2a1838','#140c20']);
   c.fillStyle='rgba(255,210,140,.55)';for(let yy=gy-h;yy<gy-10;yy+=6)for(let xx=x+3;xx<x+w-3;xx+=5)if(hash(xx+i*7|0,yy|0)>.55)c.fillRect(xx,yy,2,2.4);
   if(hash(i,4)>.6){const nc=['#ff4f9a','#3dd6ff','#7dff6a'][i%3];c.fillStyle=nc;c.fillRect(x+4,gy-h+4,w-8,3);if(lo())X.glow(x+w/2,gy-h+5,14,nc,.3);}}
  // freeway deck: the surface, a guard rail, support pillars and a hazard edge on every gap
  const off=((cx%30)+30)%30;
  X.vg(0,gy,W,LH-GL,['#4a4a5e','#24242e']);c.fillStyle='rgba(255,255,255,.18)';c.fillRect(0,gy,W,1);
  c.fillStyle='rgba(255,230,120,.5)';for(let x=-off;x<W;x+=30)c.fillRect(x,gy+7,14,1.2);
  for(let x=-((cx*1)%90+90)%90;x<W;x+=90){X.vg(x+30,gy+11,10,LH-GL,['#3a3a4a','#1a1a24']);}
  c.fillStyle='rgba(180,190,220,.3)';c.fillRect(0,gy-6,W,1);for(let x=-off;x<W;x+=15)c.fillRect(x,gy-6,1,6);
  // obstacles in view
  for(let j=0;j<OB.length;j++){const o=OB[j],sx=o.x-cx;if(sx>W+20)break;if(sx+o.w<-20)continue;const gone=r.gone.has(j);
   if(o.k==='pit'){X.vg(sx,gy-6,o.w,LH-GL+6,['#06040c','#120820']);if(lo())X.glow(sx+o.w/2,y0+LH,o.w*.5,'#ff6a2a',.22);
    c.fillStyle='#ffcf3f';for(const ex of[sx-4,sx+o.w])for(let q=0;q<4;q++){c.fillStyle=q%2?'#1a1a1a':'#ffcf3f';c.fillRect(ex,gy+q*3,4,3);}
    c.strokeStyle='rgba(255,255,255,.12)';c.lineWidth=.6;c.beginPath();c.moveTo(sx,gy+18);c.lineTo(sx+o.w,gy+24);c.stroke();}
   else if(o.k==='wall'&&!gone){X.block(sx,gy-40,12,40,'#7a8296',1.5);c.fillStyle='#ffcf3f';for(let q=0;q<5;q++){c.save();c.beginPath();c.rect(sx,gy-40+q*8,12,4);c.clip&&c.clip();for(let z=-12;z<24;z+=6){c.fillStyle='#ffcf3f';c.beginPath();c.moveTo(sx+z,gy-40+q*8+4);c.lineTo(sx+z+3,gy-40+q*8);c.lineTo(sx+z+6,gy-40+q*8);c.lineTo(sx+z+3,gy-40+q*8+4);c.fill();}c.restore();}
    c.fillStyle='rgba(0,0,0,.5)';c.fillRect(sx+3,gy-30,6,2);if(lo())X.glow(sx+6,gy-20,14,'#ff5a4a',.18+.1*Math.sin(t*.2));}
   else if(o.k==='laser'){const on=(t+o.ph)%96<58;X.vg(sx-1,gy-48,4,48,['#9aa2b0','#3a4052']);X.vg(sx+5,gy-48,4,48,['#9aa2b0','#3a4052']);
    if(on){for(let q=0;q<4;q++){const yy=gy-44+q*11;c.fillStyle='rgba(255,60,110,.9)';c.fillRect(sx+3,yy,2,8);}if(lo())X.glow(sx+4,gy-24,18,'#ff3b6a',.45);c.fillStyle='#ff3b6a';c.fillRect(sx-1,gy-50,10,2);}
    else{c.fillStyle='#3a4052';c.fillRect(sx-1,gy-50,10,2);c.fillStyle='rgba(255,60,110,.25)';c.fillRect(sx+3.5,gy-44,1,44);}}
   else if(o.k==='drone'&&!gone){const by=gy-24+Math.sin(t*.1+j)*2;X.ell(sx+5,by,9,4.6,X.lg(0,by-5,0,by+5,['#8a92a6','#3a4052','#1a1e28']));X.disc(sx+1,by,2.4,'#ff3b3b');if(lo())X.glow(sx+1,by,7,'#ff3b3b',.6);
    c.fillStyle='rgba(220,230,255,.55)';c.fillRect(sx-4,by-6,18,.8);c.fillRect(sx+4,by-6,2,2);c.fillStyle='#1a1e28';c.fillRect(sx+2,by+4,6,2);}
   else if(o.k==='bar'){X.vg(sx,gy-10,8,10,['#ff9a3a','#a04a14']);c.fillStyle='#ffffff';c.fillRect(sx,gy-10,8,2);c.fillRect(sx,gy-5,8,1.4);}}
  // the finish: the beacon tower
  {const sx=OFIN-cx;if(sx<W+40){X.vg(sx,y0+10,16,GL-10,['#e8f0ff','#5a6a90']);c.fillStyle='#ffffff';for(let q=0;q<8;q++)c.fillRect(sx+(q%2)*8,gy-8-q*8,8,8);if(lo())X.glow(sx+8,y0+12,30,'#3dd6ff',.6);}}
  // turbo cells
  for(const cc of CELLS){const sx=cc.x-cx;if(sx<-10||sx>W+10||r.got.has(cc))continue;const yy=gy-cc.y-Math.sin(t*.1+cc.x)*1.5;if(lo())X.glow(sx,yy,9,'#3dd6ff',.6);X.rr(sx-3,yy-4,6,8,2,X.lg(sx-3,0,sx+3,0,['#bff4ff','#3dd6ff','#1a6aa8']));c.fillStyle='#ffffff';c.fillRect(sx-.5,yy-3,1,6);}
  // the rival as a ghost in your lane, then you
  const o=R[1-r.i];if(Math.abs(o.x-r.x)<200&&!o.fall)agent(o,o.x-cx,gy,.35);
  agent(r,r.x-cx,gy,1);
  for(const s of r.shots){const sx=s.x-cx;X.rr(sx-4,gy-s.y-1,8,2.4,1,'#bfffaa');if(lo())X.glow(sx,gy-s.y,6,'#7dff6a',.6);}
  for(const b of r.bolts){const sx=b.x-cx;c.fillStyle='#ff4f4f';c.fillRect(sx-3,gy-b.y-1,6,2);if(lo())X.glow(sx,gy-b.y,5,'#ff4f4f',.6);}
  // lane HUD: the mode dial with its keys, turbo, distance
  X.panel(4,y0+3,128,15,PC[r.i]);A.text(A.nm(r.i),8,y0+8,PC[r.i],1);
  for(let m=1;m<=4;m++){const x=26+(m-1)*18,on=r.mode===m;X.rr(x,y0+6,16,9,2,on?MODE[m].col:'rgba(255,255,255,.1)');A.text(['','D','R','U','L'][m],x+8,y0+8,on?'#14121c':X.rgba(MODE[m].col,.8),1,'c');}
  X.meter(100,y0+8,28,5,r.tb/100,r.tb>25?'#3dd6ff':'#ff9a3a');
  A.text(MODE[r.mode].n,136,y0+8,MODE[r.mode].col,1);
  A.text(Math.floor(Math.min(OFIN,r.x)/10)+'M',W-6,y0+6,'#ffffff',1,'r');
  const lead=Math.round((r.x-o.x)/10);A.text((lead>=0?'+':'')+lead+'M',W-6,y0+14,lead>=0?'#3dff8b':'#ff9a9a',1,'r');
  if(r.fin)X.ot('FINISHED!',160,y0+40,'#ffcf3f',2,'c');
  if(r.fall>0)X.ot('FALLING!',160,y0+40,'#ff6a5a',2,'c');
  c.restore();};
 const agent=(r,sx,gy,al)=>{const c=A.c,m=r.mode,col=MODE[m].col,pc=PC[r.i];
  const yy=gy-r.y-(r.fall?0:0),run=r.y<=0&&!r.stun?Math.sin(t*(m===2?.8:.45)+r.i):0,lean=m===2?.28:m===3?.5:0;
  c.save();c.globalAlpha=al;
  if(r.y>0||r.fall)X.shadow(sx,gy,6*(1-Math.min(.6,r.y/60)),1.4,.3);else X.shadow(sx,gy,7,1.6,.4);
  // speed streaks and jet flames behind
  if(lo()&&m===2&&!r.stun)for(let k=0;k<4;k++){c.fillStyle=X.rgba(col,(.5-k*.1).toFixed(2));c.fillRect(sx-14-k*7,yy-8-k*4,10,1);}
  if(m===3){const f=4+Math.random()*3;X.poly([[sx-5,yy-10],[sx-5-f*2,yy-7],[sx-5,yy-5]],'#7ad6ff');if(lo())X.glow(sx-8,yy-8,8,'#3dd6ff',.6);}
  c.translate(sx,yy);c.rotate(lean+(r.stun?Math.sin(t*.8)*.2:0));if(r.wob>0){const s=1+r.wob*.02;c.scale(s,2-s);}
  // legs, a two-tone armoured body with glowing seams in the mode colour, a helmet with a visor
  const legc='#e8ecf4',dark='#2a3040';
  if(m===3){c.strokeStyle=legc;c.lineWidth=3;c.beginPath();c.moveTo(-1,-9);c.lineTo(-6,-3);c.moveTo(1,-9);c.lineTo(-3,-2);c.stroke();}
  else{c.strokeStyle=legc;c.lineWidth=m===1?4:3;c.beginPath();c.moveTo(-1.5,-9);c.lineTo(-2-run*4,0);c.moveTo(1.5,-9);c.lineTo(2+run*4,0);c.stroke();c.fillStyle=dark;c.fillRect(-4-run*4,-1.6,4,1.8);c.fillRect(run*4,-1.6,4,1.8);}
  const bw=m===1?13:10;X.rr(-bw/2,-21,bw,13,3,X.lg(-bw/2,0,bw/2,0,['#ffffff','#d8dee8','#8a92a6']));
  c.fillStyle=dark;c.fillRect(-bw/2,-15,bw,2.6);c.fillStyle=col;c.fillRect(-bw/2+1,-14.4,bw-2,1.2);
  X.disc(0,-17.5,2.4,col);if(lo())X.glow(0,-17.5,8,col,.7);
  // arms by mode: big fists, a cannon, swept wings, or tucked for speed
  if(m===1){X.rr(4,-20,6,7,2,'#d8dee8');X.rr(6,-15,7,7,2.5,X.lg(6,-15,13,-8,['#ff8a7a','#ff5a4a','#8a1a14']));X.rr(-9,-19,5,6,2,'#c8ced8');}
  else if(m===4){X.rr(3,-19,13,4.4,1.6,X.lg(0,-19,0,-14,['#e8ffd8','#7dff6a','#2a8a2a']));c.fillStyle=dark;c.fillRect(14,-18.4,3,3.2);if(lo()&&r.cd>7)X.glow(17,-17,7,'#7dff6a',.9);}
  else if(m===3){X.poly([[-2,-19],[-14,-25],[-12,-21],[-2,-15]],X.lg(-14,0,0,0,['#1a6aa8','#7ad6ff']));X.poly([[0,-18],[-10,-12],[-2,-13]],'#3dd6ff');}
  else{c.strokeStyle='#d8dee8';c.lineWidth=2.6;c.beginPath();c.moveTo(1,-18);c.lineTo(-3-run*2,-12);c.moveTo(1,-18);c.lineTo(5+run*2,-13);c.stroke();}
  X.rr(-4.5,-29,9,9,3.4,X.lg(0,-29,0,-20,['#ffffff','#c8ced8','#6a7286']));X.rr(-.5,-26.6,5.6,3,1.4,X.lg(0,-27,0,-23,[X.lt(col,1.5),col]));
  c.fillStyle=pc;c.fillRect(-4.5,-23,2,3);
  c.restore();c.globalAlpha=1;
  if(r.stun>0&&al===1)for(let k=0;k<3;k++){const a=t*.15+k*2.1;X.disc(sx+Math.cos(a)*6,yy-34+Math.sin(a)*1.5,.9,'#ffcf3f');}};
 g.draw=()=>{const c=A.c;c.fillStyle='#08060e';c.fillRect(0,0,W,H);
  lane(R[0]);lane(R[1]);c.fillStyle='#0c0a1a';c.fillRect(0,128,W,2);
  // the race strip along the bottom
  const bx=60,bw=200,y=H-3;c.fillStyle='rgba(255,255,255,.22)';c.fillRect(bx,y,bw,1);for(const r of R){X.disc(bx+bw*Math.min(1,r.x/OFIN),y+.5,2.2,PC[r.i]);}
  fx.draw();X.bar('','',null);A.hud2(Math.floor(Math.min(OFIN,R[0].x)/10)+'M',Math.floor(Math.min(OFIN,R[1].x)/10)+'M');
  if(t<110)X.ot('MATCH THE SUIT TO THE BLOCK!',160,70,'#ffcf3f',1,'c');};
 return g;}});
/* ================= NOVA REBELLION ================= */
// act one: a starfighter battle under the Dominion flagship; act two: a light-blade duel in its hangar
const ACT2=4200,CARD=150,FLOOR=198;
const BLADE=['#5ae8ff','#ff3b5a'];
let NOVA=null;
const novaSky=()=>{if(NOVA||!(typeof document!=='undefined'&&document.createElement))return NOVA;const cv=document.createElement('canvas');cv.width=640;cv.height=480;const c=cv.getContext('2d');if(!c||!c.createRadialGradient)return null;c.scale(2,2);
 const g0=c.createLinearGradient(0,0,0,240);g0.addColorStop(0,'#05040e');g0.addColorStop(1,'#0c0820');c.fillStyle=g0;c.fillRect(0,0,320,240);
 c.globalCompositeOperation='lighter';
 for(const[x,y,r,col]of[[70,180,130,'rgba(200,60,120,.22)'],[260,60,120,'rgba(60,110,230,.22)'],[160,120,90,'rgba(120,60,200,.16)'],[300,200,80,'rgba(255,140,60,.12)']]){const gr=c.createRadialGradient(x,y,0,x,y,r);gr.addColorStop(0,col);gr.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=gr;c.fillRect(0,0,320,240);}
 for(let i=0;i<380;i++){const x=hash(i,11)*320,y=hash(i,12)*240,b=hash(i,13);c.fillStyle='rgba(255,255,255,'+(.2+b*.75).toFixed(2)+')';const s=b>.97?1.5:b>.75?1:.5;c.fillRect(x,y,s,s);}
 c.globalCompositeOperation='source-over';
 // a gas giant low on the left with a thin moon
 const px=40,py=226,pg=c.createRadialGradient(px+20,py-30,6,px,py,70);pg.addColorStop(0,'#ffd6a0');pg.addColorStop(.5,'#c8604a');pg.addColorStop(1,'#2a0e20');c.fillStyle=pg;c.beginPath();c.arc(px,py,64,0,TAU);c.fill();
 c.save();c.beginPath();c.arc(px,py,64,0,TAU);c.clip();for(let k=0;k<7;k++){c.fillStyle='rgba(255,220,180,'+(.05+.04*(k%2))+')';c.fillRect(-30,py-60+k*14,160,5);}c.restore();
 c.strokeStyle='rgba(255,200,160,.35)';c.lineWidth=1;c.beginPath();c.arc(px,py,66,-1.4,-.1);c.stroke();
 c.fillStyle='#d8dcf0';c.beginPath();c.arc(270,34,7,0,TAU);c.fill();c.fillStyle='#0c0820';c.beginPath();c.arc(273,32,6.4,0,TAU);c.fill();
 NOVA=cv;return NOVA;};

A.add({id:'novarebel',name:'NOVA REBELLION',cat:'VERSUS',vs:1,time:150,warm:200,tags:'star wars starwars lightsaber jedi sith x-wing rebellion space battle dogfight duel saga versus 2 player',
 how:'ACT 1: TURN, UP THRUSTS, A FIRES, B ROLLS. ACT 2: A SWINGS, B GUARDS, DOWN+A PUSHES.',make(){
 const g={over:null,score:0},fx=X.fx();let t=0;const pts=[0,0];
 const scoreTo=(i,n,x,y,txt)=>{pts[i]+=n;if(!demo(g))fx.pop(cl(x,30,W-30),cl(y,30,H-20),txt||('+'+n),PC[i]);};
 /* ---- act one ---- */
 const F=[0,1].map(i=>({i,x:i?250:70,y:i?90:170,vx:0,vy:0,a:i?Math.PI:0,sh:3,dead:0,inv:90,cd:0,roll:0,rcd:0,pk:{},think:0,aimN:0}));
 const bolts=[],drones=[],flak=[],trails=[];
 const ship=g._S={x:160,y:54};
 const fighterHit=(f,by,x,y)=>{if(f.dead||f.inv>0||f.roll>0)return false;f.sh--;f.inv=24;fx.spark(x,y,'#ffffff',8,2);
  if(f.sh<=0){f.dead=100;S('boom');A.shake=5;fx.ring(f.x,f.y,'#ffcf3f',34,20);fx.spark(f.x,f.y,'#ff9a3a',22,3.2);fx.debris(f.x,f.y,'#8a8496',10,2.4);if(by!==null&&by!==undefined)scoreTo(by,3,f.x,f.y-14,'+3 ACE!');}else S('hit');return true;};
 const shoot=f=>{f.cd=9;const ca=Math.cos(f.a),sa=Math.sin(f.a),nx=-sa,ny=ca;for(const s of[-1,1])bolts.push({x:f.x+ca*6+nx*s*4,y:f.y+sa*6+ny*s*4,vx:ca*5.6+f.vx*.5,vy:sa*5.6+f.vy*.5,own:f.i,life:46});if(!demo(g)&&(f.i===0||!A.cpu))S('shoot');};
 const wrap=o=>{if(o.x<-8)o.x+=W+16;if(o.x>W+8)o.x-=W+16;if(o.y<10)o.y+=H-2;if(o.y>H+8)o.y-=H-2;};
 const flyF=(f,k,e)=>{
  if(f.dead>0){if(--f.dead===0){Object.assign(f,{x:f.i?290:30,y:f.i?60:200,vx:0,vy:0,a:f.i?Math.PI:0,sh:3,inv:100});}return;}
  if(f.inv>0)f.inv--;if(f.cd>0)f.cd--;if(f.roll>0)f.roll--;if(f.rcd>0)f.rcd--;
  const tr=(k.r?1:0)-(k.l?1:0);f.a+=tr*.075;
  if(k.u){f.vx+=Math.cos(f.a)*.11;f.vy+=Math.sin(f.a)*.11;if(lo()&&t%2===0)trails.push({x:f.x-Math.cos(f.a)*7,y:f.y-Math.sin(f.a)*7,t:16,c:f.i?'#ff6a8a':'#7ad6ff'});}
  if(e.b&&f.rcd<=0){f.roll=22;f.rcd=80;const nx=-Math.sin(f.a),ny=Math.cos(f.a),s=tr||1;f.vx+=nx*s*2.2;f.vy+=ny*s*2.2;}
  f.vx*=.986;f.vy*=.986;const sp=hyp(f.vx,f.vy),mx=f.roll?4.2:2.8;if(sp>mx){f.vx*=mx/sp;f.vy*=mx/sp;}
  f.x+=f.vx;f.y+=f.vy;wrap(f);
  if(k.a&&f.cd<=0)shoot(f);};
 // CPU pilot: lead the target, turn onto it, thrust in, fire when lined up, roll away from bolts
 const pilot=f=>{const k={},sk=f.i===1&&!demo(g)?skill():.88;if(f.dead)return k;const o=F[1-f.i];
  let tg=o.dead?null:o,bd=o.dead?1e9:hyp(o.x-f.x,o.y-f.y);for(const d of drones){const dd=hyp(d.x-f.x,d.y-f.y);if(dd<bd*.6){bd=dd;tg=d;}}
  if(--f.think<=0){f.think=8+ri(Math.round(4+(1-sk)*20));f.aimN=(Math.random()-.5)*(1-sk)*.9;}
  if(!tg){k.u=Math.random()<.4;return k;}
  const dist=hyp(tg.x-f.x,tg.y-f.y),lead=dist/5.6,ax=tg.x+(tg.vx||0)*lead-f.x,ay=tg.y+(tg.vy||0)*lead-f.y,want=Math.atan2(ay,ax)+f.aimN,err=adf(want,f.a);
  if(Math.abs(err)>.06)k[err>0?'r':'l']=1;
  if(dist>70||Math.abs(err)>1.6)k.u=Math.abs(err)<1.2;
  if(Math.abs(err)<.16+(1-sk)*.2&&dist<190&&Math.random()<.05+sk*.85)k.a=1;
  for(const b of bolts)if(b.own!==f.i&&hyp(b.x-f.x,b.y-f.y)<30&&Math.random()<sk*.25)k.b=1;
  if(f.y<34)k.u=Math.abs(adf(Math.PI/2,f.a))<.8;
  return k;};
 /* ---- act two ---- */
 const D=[0,1].map(i=>({i,x:i?220:100,y:FLOOR,vy:0,face:i?-1:1,hp:100,atk:0,combo:0,ctimer:0,hitDone:0,guard:0,gt:0,stun:0,inv:0,focus:30,push:0,pk:{},think:0,gnd:1,ko:0}));
 const resetD=()=>{D.forEach((d,i)=>Object.assign(d,{x:i?220:100,y:FLOOR,vy:0,face:i?-1:1,hp:100,atk:0,combo:0,stun:0,inv:40,gnd:1,ko:0}));};
 const SW=16,ACT0=4,ACT1=9,REACH=32;
 const hitD=(d,by,dmg,kb,x,y)=>{const o=d;if(o.inv>0||o.ko)return;
  // a guard facing the blade blocks it; a guard raised in the last moment is a parry that staggers the attacker
  if(o.guard&&o.face===-D[by].face){if(o.gt<7){D[by].stun=34;D[by].atk=0;fx.spark(x,y,'#ffffff',14,3);fx.ring(x,y,'#ffffff',16,12);o.focus=Math.min(100,o.focus+18);if(!demo(g)){fx.pop(cl(o.x,30,W-30),o.y-46,'PARRY!','#ffffff');S('score');}}
   else{o.x+=D[by].face*4;fx.spark(x,y,BLADE[o.i],8,2.2);o.focus=Math.min(100,o.focus+6);if(!demo(g))S('blip');}return;}
  o.hp-=dmg;o.stun=dmg>10?24:14;o.inv=10;o.x+=D[by].face*kb;o.atk=0;D[by].focus=Math.min(100,D[by].focus+10);
  fx.spark(x,y,'#ffcf9a',12,2.6);scoreTo(by,1,o.x,o.y-44);S('hit');
  if(o.hp<=0){o.ko=110;scoreTo(by,4,o.x,o.y-56,'+4 DEFEATED!');fx.flash('#ffffff',8);A.shake=6;S('boom');}};
 const duel=(d,k,e)=>{const o=D[1-d.i];
  if(d.ko>0){if(--d.ko===0)resetD();return;}
  if(o.ko>0){d.atk=0;return;}
  if(d.inv>0)d.inv--;if(d.ctimer>0)d.ctimer--;else d.combo=0;if(d.push>0)d.push--;
  d.focus=Math.min(100,d.focus+.04);
  if(d.stun>0){d.stun--;d.guard=0;d.atk=0;}
  const can=d.stun<=0&&d.atk<=0;
  d.guard=can&&k.b&&d.gnd?1:0;d.gt=d.guard?d.gt+1:0;
  const dir=can&&!d.guard?(k.r?1:0)-(k.l?1:0):0;
  d.x+=dir*(d.gnd?1.5:1.3);
  if(can&&!d.guard)d.face=o.x>d.x?1:-1;
  if(can&&e.u&&d.gnd){d.vy=-4.6;d.gnd=0;if(!demo(g)&&(d.i===0||!A.cpu))S('jump');}
  if(!d.gnd){d.vy+=.24;d.y+=d.vy;if(d.y>=FLOOR){d.y=FLOOR;d.vy=0;d.gnd=1;}}
  // the push: a wave of force down the hangar floor
  if(can&&e.a&&k.d&&d.focus>=50){d.focus-=50;d.push=20;d.atk=14;d.atype='push';if(!demo(g))S('boom');fx.ring(d.x+d.face*14,d.y-24,BLADE[d.i],40,18);
   if(Math.sign(o.x-d.x)===d.face&&Math.abs(o.x-d.x)<96&&Math.abs(o.y-d.y)<30&&!o.inv){o.x+=d.face*30;o.stun=28;o.hp-=6;o.inv=10;o.guard=0;scoreTo(d.i,1,o.x,o.y-44,'+1 PUSHED');fx.spark(o.x,o.y-16,BLADE[d.i],10,2.4);}}
  else if(can&&e.a){d.combo=d.combo%3+1;d.ctimer=SW+14;d.atk=SW;d.atype='cut';d.hitDone=0;if(!demo(g)&&(d.i===0||!A.cpu))S('shoot');}
  if(d.atk>0){d.atk--;const ph=SW-d.atk;
   if(d.atype==='cut'&&ph>=ACT0&&ph<=ACT1&&!d.hitDone){
    // two blades meeting mid-swing clash and throw both fighters back
    if(o.atk>0&&o.atype==='cut'&&SW-o.atk>=ACT0&&SW-o.atk<=ACT1&&Math.abs(o.x-d.x)<REACH+4){d.hitDone=o.hitDone=1;d.x-=d.face*6;o.x-=o.face*6;d.stun=o.stun=8;const mx=(d.x+o.x)/2;fx.spark(mx,d.y-30,'#ffffff',16,3.2);fx.ring(mx,d.y-30,'#ffffff',14,10);if(!demo(g))S('hit');}
    else if(Math.sign(o.x-d.x)===d.face&&Math.abs(o.x-d.x)<REACH&&Math.abs(o.y-d.y)<26){d.hitDone=1;hitD(o,d.i,d.combo===3?13:8,d.combo===3?14:5,d.x+d.face*20,d.y-28);}}}
  d.x=cl(d.x,14,W-14);
  if(Math.abs(d.x-o.x)<20&&d.gnd&&o.gnd){const s=d.x<o.x?-1:1;d.x+=s*1.2;}};
 // CPU duelist: hold the edge of reach, guard what is coming (parry on hard), strike into openings, push when charged
 const fencer=d=>{const k={},o=D[1-d.i],sk=d.i===1&&!demo(g)?skill():.85;if(d.ko||o.ko)return k;
  const dx=o.x-d.x,dist=Math.abs(dx);
  if(--d.think<=0){d.think=4+ri(Math.round(3+(1-sk)*14));d.plan=Math.random()<.12?'jump':Math.random()<.5?'press':'hover';}
  const incoming=o.atk>0&&o.atype==='cut'&&SW-o.atk<ACT1&&dist<REACH+10;
  if(incoming&&Math.random()<.1+sk*.75){k.b=1;return k;}
  const want=d.plan==='press'?26:40;if(dist>want+4)k[dx>0?'r':'l']=1;else if(dist<want-6)k[dx>0?'l':'r']=1;
  if(d.plan==='jump'&&dist<60&&d.gnd)k.u=1;
  if(d.focus>=50&&dist>34&&dist<90&&Math.random()<.04+sk*.05){k.d=1;k.a=1;}
  else if(dist<REACH-2&&d.atk<=0&&Math.random()<.04+sk*.34&&!(o.guard&&Math.random()<sk*.6))k.a=1;
  return k;};
 g.update=()=>{t++;
  if(t<ACT2){
   for(const f of F){const k=demo(g)||(f.i===1&&A.cpu)?pilot(f):A.in(f.i);if(f.i===1&&A.cpu&&!demo(g))A.bot(k);flyF(f,k,edge(f,k));}
   // Dominion drones launch from the flagship and hunt the nearest fighter
   if(t%170===60&&drones.length<4)drones.push({x:ship.x+(ri(3)-1)*60,y:ship.y+12,vx:0,vy:1.2,a:Math.PI/2,hp:1,cd:60});
   for(const d of drones){let tg=null,bd=1e9;for(const f of F)if(!f.dead){const dd=hyp(f.x-d.x,f.y-d.y);if(dd<bd){bd=dd;tg=f;}}
    if(tg){const w=Math.atan2(tg.y-d.y,tg.x-d.x);d.a+=cl(adf(w,d.a),-.04,.04);}d.vx=Math.cos(d.a)*1.5;d.vy=Math.sin(d.a)*1.5;d.x+=d.vx;d.y+=d.vy;wrap(d);
    if(--d.cd<=0&&tg&&bd<150){d.cd=70+ri(40);flak.push({x:d.x,y:d.y,vx:Math.cos(d.a)*3,vy:Math.sin(d.a)*3,life:60});}}
   // the flagship's guns lob slow plasma at whoever strays too close underneath it
   ship.x=160+Math.sin(t*.003)*40;
   if(t%140===100){const f=F[ri(2)];if(!f.dead&&f.y<140){const a=Math.atan2(f.y-ship.y,f.x-ship.x);flak.push({x:ship.x,y:ship.y+10,vx:Math.cos(a)*1.6,vy:Math.sin(a)*1.6,life:120,big:1});}}
   for(let i=bolts.length-1;i>=0;i--){const b=bolts[i];b.x+=b.vx;b.y+=b.vy;b.life--;let dead=b.life<=0;wrap(b);
    const o=F[1-b.own];if(!dead&&!o.dead&&hyp(b.x-o.x,b.y-o.y)<7){if(fighterHit(o,b.own,b.x,b.y))dead=true;}
    for(let j=drones.length-1;j>=0&&!dead;j--){const d=drones[j];if(hyp(b.x-d.x,b.y-d.y)<6){dead=true;drones.splice(j,1);fx.spark(d.x,d.y,'#ff9a3a',12,2.4);fx.ring(d.x,d.y,'#ffcf3f',14,12);scoreTo(b.own,1,d.x,d.y-10);if(!demo(g))S('boom');}}
    if(dead)bolts.splice(i,1);}
   for(let i=flak.length-1;i>=0;i--){const b=flak[i];b.x+=b.vx;b.y+=b.vy;b.life--;let dead=b.life<=0;
    for(const f of F)if(!dead&&!f.dead&&hyp(b.x-f.x,b.y-f.y)<(b.big?8:6)){if(fighterHit(f,null,b.x,b.y))dead=true;}
    if(dead)flak.splice(i,1);}
   for(const tr of trails)tr.t--;while(trails.length&&trails[0].t<=0)trails.shift();
   if(t===ACT2-1){bolts.length=flak.length=drones.length=0;if(!demo(g))S('win');}}
  else if(t>=ACT2+CARD){
   for(const d of D){const k=demo(g)||(d.i===1&&A.cpu)?fencer(d):A.in(d.i);if(d.i===1&&A.cpu&&!demo(g))A.bot(k);duel(d,k,edge(d,k));}}
  if(demo(g)&&t>ACT2+CARD+2400){t=0;pts[0]=pts[1]=0;resetD();F.forEach((f,i)=>Object.assign(f,{x:i?250:70,y:i?90:170,vx:0,vy:0,sh:3,dead:0}));}
  g.score=pts[0]*25;};
 g.timeUp=()=>tu(pts[0],pts[1]);
 g._F=F;g._D=D;g._pts=pts;g.fxClear=fx.clear;g._skip=()=>{t=ACT2+CARD;};

 /* ---- scenes ---- */
 const flagship=(x,y,s)=>{const c=A.c;c.save();c.translate(x,y);c.scale(s,s);
  // a long hammerhead hull with a lit spine, engine bells and turret blisters
  X.poly([[-120,-6],[-60,-16],[60,-16],[120,-8],[126,4],[60,14],[-60,14],[-126,4]],X.lg(0,-16,0,14,['#5a6070','#2a2e3a','#14161e']));
  X.poly([[-30,-16],[-18,-30],[18,-30],[30,-16]],X.lg(0,-30,0,-16,['#6a7080','#2a2e3a']));X.rr(-8,-36,16,7,2,'#3a3e4a');
  c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-110,-5,220,1);
  c.fillStyle='rgba(255,200,120,.8)';for(let k=-100;k<100;k+=6)if(hash(k,7)>.4)c.fillRect(k,2+hash(k,3)*6,1.6,1);
  for(const tx of[-80,-40,40,80]){X.disc(tx,-14,3,'#4a4e5a');c.fillStyle='#1a1c24';c.fillRect(tx-.5,-20,1,6);}
  for(const ex of[-126,126]){X.disc(ex,0,6,'#1a1c24');if(lo())X.glow(ex,0,14,'#7ad6ff',.5);X.disc(ex,0,3.4,'#bff4ff');}
  c.restore();};
 const fighter=f=>{const c=A.c;if(f.dead)return;if(f.inv>0&&f.inv%6<3&&f.inv<90)return;
  const roll=f.roll>0?Math.cos(f.roll/22*TAU):1;
  X.shadow(f.x+6,f.y+8,6,2.2,.15);
  c.save();c.translate(f.x,f.y);c.rotate(f.a);c.scale(1.45,1.45*roll);
  if(f.i===0){
   // the rebel interceptor: forward-swept wings with wingtip cannons and twin engines
   X.poly([[-6,0],[-2,-11],[2,-11],[1,-3]],'#c8ccd8');X.poly([[-6,0],[-2,11],[2,11],[1,3]],'#a8acb8');
   c.fillStyle='#ff8a3a';c.fillRect(-2,-11,6,1.4);c.fillRect(-2,9.6,6,1.4);
   X.rr(-8,-2.6,18,5.2,2.4,X.lg(0,-3,0,3,['#ffffff','#d8dce8','#8a8ea0']));X.poly([[10,-2],[15,0],[10,2]],'#e8ecf4');
   X.ell(3,0,3,1.6,'#2a3a5a');X.ell(3.6,-.5,1.4,.6,'rgba(160,220,255,.8)');c.fillStyle=PC[0];c.fillRect(-5,-2.6,2,5.2);
   if(lo()){X.glow(-9,-2,4,'#7ad6ff',.8);X.glow(-9,2,4,'#7ad6ff',.8);}X.disc(-8.6,-1.6,1,'#bff4ff');X.disc(-8.6,1.6,1,'#bff4ff');}
  else{
   // the Dominion viper: a black crescent with a red eye of a cockpit
   X.poly([[12,0],[-2,-5],[-8,-13],[-4,-4],[-8,0],[-4,4],[-8,13],[-2,5]],X.lg(-8,0,12,0,['#14141c','#3a3a48','#5a5a6a']));
   c.strokeStyle='rgba(255,80,110,.8)';c.lineWidth=.8;c.beginPath();c.moveTo(-8,-13);c.lineTo(-2,-5);c.moveTo(-8,13);c.lineTo(-2,5);c.stroke();
   X.disc(3,0,2.6,'#2a0a14');X.disc(3,0,1.6,PC[1]);if(lo()){X.glow(3,0,6,PC[1],.6);X.glow(-8,0,5,'#ff6a3a',.7);}X.disc(-7.4,0,1.2,'#ffb08a');}
  c.restore();
  if(f.roll>0&&lo())A.ring(f.x,f.y,10,'rgba(255,255,255,.25)');
  if(f.inv>0&&f.inv>=90)A.ring(f.x,f.y,12,X.rgba(PC[f.i],.6));
  X.ot(A.nm(f.i),cl(f.x,8,W-8),cl(f.y-22,22,H-8),PC[f.i],1,'c');};
 const drawAct1=()=>{const c=A.c;const sky=novaSky();if(sky&&c.drawImage)c.drawImage(sky,0,0,W,H);else X.vg(0,0,W,H,['#05040e','#0c0820']);
  X.stars(30,5,t*.3,0,H,.6);
  // far off, the rest of the fleet trades fire: tracer streaks and silent flashes
  if(lo()){for(let k=0;k<4;k++){const ph=(t*.7+k*97)%320,x=ph,y=120+k*22+Math.sin(k*3+t*.01)*10;c.fillStyle=k%2?'rgba(255,90,90,.55)':'rgba(120,255,140,.5)';c.fillRect(x,y,4,.7);}
   const fl=(t*13)%260;if(fl<14)X.glow(40+(t*31)%240,90+(t*17)%120,6+fl,'#ffcf9a',.5*(1-fl/14));}
  // drifting hull debris
  for(let k=0;k<7;k++){const x=((hash(k,1)*W+t*(.15+hash(k,2)*.25))%(W+20))-10,y=70+hash(k,3)*160,r=t*.01*(hash(k,4)-.5)+k;c.save();c.translate(x,y);c.rotate(r);X.poly([[-3,-2],[2,-3],[4,1],[0,3],[-4,1]],'#3a3a48');c.fillStyle='rgba(255,255,255,.18)';c.fillRect(-2,-2,4,.6);c.restore();}
  flagship(ship.x,ship.y,1);
  for(const tr of trails){c.globalAlpha=tr.t/16*.7;X.disc(tr.x,tr.y,1.6*tr.t/16+.4,tr.c);}c.globalAlpha=1;
  for(const d of drones){c.save();c.translate(d.x,d.y);c.rotate(d.a);c.scale(1.3,1.3);X.poly([[6,0],[-4,-5],[-2,0],[-4,5]],X.lg(-4,0,6,0,['#2a2a34','#6a6a7a']));X.disc(1,0,1.4,'#ff3b3b');c.restore();if(lo())X.glow(d.x,d.y,6,'#ff3b3b',.35);}
  for(const b of bolts){c.strokeStyle=b.own?'#ff4f7a':'#ff3b3b';if(b.own===0)c.strokeStyle='#ff5a3a';c.lineWidth=1.6;c.beginPath();c.moveTo(b.x,b.y);c.lineTo(b.x-b.vx*1.3,b.y-b.vy*1.3);c.stroke();if(lo()){X.glow(b.x,b.y,4,b.own?'#ff4f7a':'#ff8a3a',.6);}}
  for(const b of flak){if(b.big){if(lo())X.glow(b.x,b.y,10,'#7dff6a',.6);X.disc(b.x,b.y,3,'#d8ffc8');}else{X.disc(b.x,b.y,1.4,'#7dff6a');}}
  for(const f of F)fighter(f);
  fx.draw();
  X.bar();A.hud2(pts[0],pts[1]);A.text('ACT I  STARFIGHTERS',160,4,'#ffcf3f',1,'c');
  const left=Math.max(0,Math.ceil((ACT2-t)/60));A.text('BLADES IN '+left,160,11,'rgba(255,255,255,.6)',1,'c');
  for(const f of F){const x=f.i?W-48:28;for(let k=0;k<3;k++)X.disc(x+k*7,24,2.3,k<f.sh?PC[f.i]:'rgba(255,255,255,.18)');}
  if(t<110)X.ot('SHOOT DOWN THE RIVAL ACE!',160,64,'#ffcf3f',1,'c');};
 // the hangar: a huge window onto the battle, a reactor glow, catwalks and parked fighters
 const hangar=()=>X.cache('nova_hangar',()=>{const c=A.c;const sky=novaSky();if(sky&&c.drawImage)c.drawImage(sky,0,0,W,H);else X.vg(0,0,W,H,['#05040e','#0c0820']);
  c.fillStyle='rgba(10,12,20,.92)';c.fillRect(0,0,W,40);c.fillRect(0,150,W,H-150);c.fillRect(0,40,26,110);c.fillRect(294,40,26,110);
  c.strokeStyle='#2a2e3a';c.lineWidth=3;c.beginPath();for(let x=26;x<=294;x+=67){c.moveTo(x,40);c.lineTo(x,150);}c.moveTo(26,95);c.lineTo(294,95);c.stroke();
  c.strokeStyle='rgba(120,180,255,.25)';c.lineWidth=1;c.strokeRect(26,40,268,110);
  X.vg(0,150,W,48,['#1a1e2a','#0c0e16']);c.fillStyle='rgba(120,180,255,.15)';for(let x=0;x<W;x+=20)c.fillRect(x,150,1,48);
  // parked fighters in the bays
  for(const bx of[60,260]){X.ell(bx,182,22,4,'rgba(0,0,0,.4)');X.poly([[bx-20,176],[bx+16,176],[bx+22,180],[bx-20,180]],'#3a3e4a');X.poly([[bx-6,176],[bx+4,166],[bx+10,166],[bx+6,176]],'#4a4e5a');X.ell(bx+2,174,6,2,'#1a2a3a');}
  // the bridge floor
  X.vg(0,FLOOR,W,H-FLOOR,['#5a6070','#2a2e3a','#14161e']);c.fillStyle='rgba(255,255,255,.35)';c.fillRect(0,FLOOR,W,1);
  c.fillStyle='rgba(0,0,0,.35)';for(let x=0;x<W;x+=24)c.fillRect(x,FLOOR+1,1,H-FLOOR);
  c.fillStyle='rgba(255,200,120,.7)';for(let x=10;x<W;x+=40)c.fillRect(x,FLOOR+6,6,1.4);
  X.vignette(.4);});
 const duelist=d=>{const c=A.c;if(d.ko>0&&d.ko<70)return;const o=D[1-d.i];const ph=d.atk>0?SW-d.atk:0;
  const pc=PC[d.i],bc=BLADE[d.i],run=d.gnd&&!d.atk?Math.sin(t*.35)*(Math.abs(d.x-(d.px||d.x))>.3?1:0):0;d.px=d.x;
  X.shadow(d.x,FLOOR,11,2.2,.45);
  c.save();c.translate(d.x,d.y);c.scale(d.face*1.8,1.8);if(d.ko)c.rotate(-(1-(d.ko-70)/40)*1.2);
  if(d.inv>0&&d.inv%6<3)c.globalAlpha=.6;
  // a long coat / robe, boots, a hood or a helm
  const robe=d.i?'#1a141c':'#c8b48a',robe2=d.i?'#3a1a24':'#8a7a5a';
  c.strokeStyle=d.i?'#0c0a10':'#4a3a2a';c.lineWidth=2.4;c.beginPath();c.moveTo(-1.5,-8);c.lineTo(-2-run*2.4,0);c.moveTo(1.5,-8);c.lineTo(2+run*2.4,0);c.stroke();
  X.poly([[-4,-19],[4,-19],[6.5,-4],[-6.5,-4]],X.lg(-6,0,6,0,[robe,robe2]));
  c.fillStyle=d.i?PC[1]:'#5a3a24';c.fillRect(-4,-11,8,1.6);
  if(d.i){X.poly([[-5,-19],[5,-19],[8,-1],[-9,-1]],'rgba(10,6,12,.85)');}
  X.disc(0,-23,3.6,d.i?'#2a2a34':'#f1c7a3');
  if(d.i){X.poly([[-4,-24],[4,-24],[4,-20],[-4,-20]],'#14141c');c.fillStyle=PC[1];c.fillRect(1,-23.5,3,1);}
  else{c.fillStyle='#5a3a24';c.beginPath();c.arc(-.3,-24,3.8,Math.PI*.95,TAU*1.02);c.fill();c.fillStyle='#14121c';c.fillRect(1.4,-23.4,1,1.2);}
  // the blade: guard holds it upright, a swing sweeps an arc
  let ba;if(d.guard)ba=-1.45;else if(d.atype==='cut'&&d.atk>0){const p=Math.min(1,ph/ACT1),from=d.combo===2?.9:-2.2,to=d.combo===2?-2.1:.7;ba=from+(to-from)*(p<1?p*p*(3-2*p):1);}else if(d.atype==='push'&&d.atk>0)ba=-.3;else ba=-.6+Math.sin(t*.05+d.i)*.05;
  const hx=3,hy=-15,L=19,ex=hx+Math.cos(ba)*L,ey=hy+Math.sin(ba)*L;
  if(d.atype==='cut'&&d.atk>0&&ph<=ACT1+3&&lo()){const p=Math.min(1,ph/ACT1),from=d.combo===2?.9:-2.2,to=d.combo===2?-2.1:.7,cur=from+(to-from)*p;c.globalCompositeOperation='lighter';c.fillStyle=X.rgba(bc,.35);c.beginPath();c.moveTo(hx,hy);const a0=Math.min(from,cur),a1=Math.max(from,cur);c.arc(hx,hy,L,a0,a1);c.closePath();c.fill();c.globalCompositeOperation='source-over';}
  c.strokeStyle=d.i?'#3a3a44':'#8a8ea0';c.lineWidth=1.8;c.beginPath();c.moveTo(1,-17);c.lineTo(hx,hy);c.stroke();
  c.lineCap='round';if(lo()){c.globalCompositeOperation='lighter';c.strokeStyle=X.rgba(bc,.35);c.lineWidth=5;c.beginPath();c.moveTo(hx+Math.cos(ba)*3,hy+Math.sin(ba)*3);c.lineTo(ex,ey);c.stroke();c.globalCompositeOperation='source-over';}
  c.strokeStyle=bc;c.lineWidth=2.2;c.beginPath();c.moveTo(hx+Math.cos(ba)*3,hy+Math.sin(ba)*3);c.lineTo(ex,ey);c.stroke();
  c.strokeStyle='#ffffff';c.lineWidth=.9;c.beginPath();c.moveTo(hx+Math.cos(ba)*3,hy+Math.sin(ba)*3);c.lineTo(ex,ey);c.stroke();c.lineCap='butt';
  c.fillStyle='#c8ccd8';c.save();c.translate(hx,hy);c.rotate(ba);c.fillRect(-2,-1,5,2);c.restore();
  if(d.push>0){const p=1-d.push/20;c.strokeStyle=X.rgba(bc,(1-p).toFixed(2));c.lineWidth=1.4;for(let k=0;k<3;k++){c.beginPath();c.arc(8+p*40+k*6,-14,6+k*3,-1,1);c.stroke();}}
  c.restore();c.globalAlpha=1;
  if(lo())X.glow(d.x+d.face*(hx+Math.cos(ba)*L*.6)*1.8,d.y+(hy+Math.sin(ba)*L*.6)*1.8,22,bc,.22);
  if(d.stun>0&&!d.ko)for(let k=0;k<3;k++){const a=t*.15+k*2.1;X.disc(d.x+Math.cos(a)*7,d.y-54+Math.sin(a)*1.5,1.1,'#ffcf3f');}
  X.ot(A.nm(d.i),cl(d.x,8,W-8),d.y-62,pc,1,'c');void o;};
 const drawAct2=()=>{const c=A.c;hangar();
  // the battle still rages outside the window
  if(lo()){for(let k=0;k<3;k++){const x=((t*(1.2+k*.4)+k*120)%300)+10,y=60+k*24+Math.sin(t*.03+k)*8;if(x>26&&x<294){c.fillStyle='#ff6a3a';c.fillRect(x,y,3,1);X.glow(x,y,4,'#ff8a3a',.5);}}
   if(t%90<6){X.glow(60+(t*7)%200,70+(t%37),10,'#ffcf7a',.7);}
   X.glow(160,150,60,'#5ae8ff',.08+.04*Math.sin(t*.05));}
  for(const d of D)duelist(d);
  fx.draw();
  X.bar();A.hud2(pts[0],pts[1]);A.text('ACT II  BLADES',160,6,'#ffcf3f',1,'c');
  for(const d of D){const x=d.i?W-104:4;X.panel(x,20,100,16,PC[d.i]);X.meter(x+4,23,92,5,d.hp/100,d.hp>35?'#3dff8b':'#ff4f4f');X.meter(x+4,30,92,3,d.focus/100,d.focus>=50?BLADE[d.i]:'#5a6070');if(d.focus>=50)A.text('PUSH READY',x+50,38,BLADE[d.i],1,'c');}};
 const drawCard=()=>{const c=A.c,p=(t-ACT2)/CARD;const sky=novaSky();if(sky&&c.drawImage)c.drawImage(sky,0,0,W,H);else X.vg(0,0,W,H,['#05040e','#0c0820']);
  // swooping in to the flagship's hangar
  flagship(160,120,.9+p*2.2);c.fillStyle='rgba(0,0,0,'+Math.max(0,(p-.75)*4).toFixed(2)+')';c.fillRect(0,0,W,H);
  X.ot('ACT II',160,70,'#ffcf3f',3,'c');X.ot('BOARD THE FLAGSHIP',160,100,'#ffffff',1,'c');X.ot('A SWINGS  B GUARDS  DOWN+A PUSHES',160,170,'#9adfff',1,'c');
  X.bar();A.hud2(pts[0],pts[1]);};
 g.draw=()=>{if(t<ACT2)drawAct1();else if(t<ACT2+CARD)drawCard();else drawAct2();};
 return g;}});
})();
