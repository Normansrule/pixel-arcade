// PLATFORM BRAWL — fighting simulation (pure logic, no rendering). 60 Hz fixed step.
// Percent-based knockback, hitlag, shields, dodges, ledges, grabs/throws, projectiles, items, hazards, blast zones.
import {moveSet} from './fighters.js';

export const KS=.0039,DECAY=.00714,FPS=60;
const cl=(v,a,b)=>v<a?a:v>b?b:v,sgn=v=>v<0?-1:v>0?1:0,app=(v,t,s)=>v<t?Math.min(t,v+s):Math.max(t,v-s);
export const blankInput=()=>({x:0,y:0,jump:false,jumpP:false,atk:false,atkP:false,spc:false,spcP:false,smash:false,smashP:false,sx:0,sy:0,shield:false,shieldP:false,grabP:false,want:null,mash:false});
// knockback formula (percent after hit p, damage d, weight w, base b, growth g)
export const kbOf=(p,d,w,b,g)=>((((p/10+p*d/20)*(200/(w+100))*1.4)+18)*(g/100))+b;

const ACTIVE=new Set(['idle','walk','run','crouch']);
export class Fighter{
 constructor(def,slot,o={}){this.def=def;this.mv=moveSet(def);this.slot=slot;this.id=slot;this.name=o.name||def.name;this.human=o.human??-1;this.lvl=o.lvl||5;this.alt=o.alt||0;
  this.W=def.W;this.H0=def.Hh;this.stocks=o.stocks??3;this.score=0;this.inp=blankInput();
  this.stats={kos:0,falls:0,sds:0,dealt:0,taken:0,maxCombo:0,big:0,hits:0};this.reset(0,0,1);}
 reset(x,y,face){Object.assign(this,{x,y,vx:0,vy:0,kx:0,ky:0,face,ground:null,st:'air',t:0,move:null,mname:'',mt:0,hits:{},chg:0,dmg:0,hitstun:0,hitlag:0,shield:50,inv:0,jumpsLeft:this.def.jumps,usedUp:false,usedSide:false,adUsed:false,ff:false,
  ledge:null,ledgeCd:0,ledgeFresh:true,held:null,holder:null,holdT:0,thr:null,dropT:0,lag:0,techT:0,counterOn:0,reflectOn:0,armorOn:0,vanish:false,noGrav:false,item:null,power:0,fuel:999,px:0,py:0,combo:0,comboBy:null,lastHitBy:null,lastHitF:-9999,tap:false,dizzyT:0,flash:0,sub:'',dodgeDir:0,pumT:0,teleDir:null,stunT:0,deadT:0,lastKb:0});}
 get H(){return this.st==='crouch'||this.st==='down'?this.H0*.62:this.H0;}
 hittable(){return this.inv<=0&&!['dead','out','revive'].includes(this.st)&&!this.vanish;}
 cx(){return this.x;}cy(){return this.y+this.H*.5;}
}

export class World{
 constructor(stage,o={}){this.stage=stage;this.f=[];this.proj=[];this.items=[];this.frame=0;this.ev=o.ev||(()=>{});this.mode=o.mode||'time';this.itemsOn=!!o.items;this.itemT=600;this.haz={t:0,next:540,warn:0,on:0,x:0,y:0,dir:1};this.ledgeOcc=new Map();this.sudden=false;
  for(const p of stage.plats){p.bx0=p.x0;p.bx1=p.x1;p.by=p.y;p.dx=0;p.dy=0;p.soft=true;}stage.solids.forEach((s,i)=>{s.dx=0;s.dy=0;s.soft=false;s.id=s.id??i;});}
 add(def,o){const f=new Fighter(def,this.f.length,o);this.f.push(f);const sp=this.stage.spawns[f.slot%this.stage.spawns.length];f.reset(sp[0],sp[1],sp[0]>0?-1:1);this.snapGround(f);f.st='idle';return f;}
 snapGround(f){const s=this.surfaceBelow(f.x,f.y+.5);if(s){f.y=s.y;f.ground=s;}}
 surfaceBelow(x,y){let best=null;for(const s of[...this.stage.solids,...this.stage.plats]){if(x>=s.x0&&x<=s.x1&&s.y<=y+1e-3&&(!best||s.y>best.y))best=s;}return best;}
 alive(){return this.f.filter(f=>f.st!=='out');}

 /* ---------- main step ---------- */
 step(){this.frame++;const fr=this.frame;
  this.movePlats();
  for(const f of this.f){if(f.st==='out')continue;if(f.hitlag>0){f.hitlag--;continue;}this.update(f);}
  this.holds();this.hitboxes();this.stepProj();this.stepItems();this.hazard();
  for(const f of this.f)this.blast(f);
  if(this.itemsOn&&--this.itemT<=0){this.itemT=600+Math.random()*480|0;const s=this.stage.solids[0];const r=Math.random();this.spawnItem(r<.4?'bomb':r<.72?'heal':'power',s.x0+2+Math.random()*(s.x1-s.x0-4),s.y+9);}
  return fr;}
 movePlats(){const t=this.frame/FPS;for(const p of this.stage.plats){if(!p.path){p.dx=p.dy=0;continue;}const P=p.path,k=Math.sin(t*Math.PI*2/P.period+(P.phase||0));const nx=P.ax?P.ax*k:0,ny=P.ay?P.ay*(P.type==='bob'?Math.sin(t*Math.PI*2/P.period*2+(P.phase||0)):k):0;
   const x0=p.bx0+nx,y=p.by+ny;p.dx=x0-p.x0;p.dy=y-p.y;p.x0=x0;p.x1=p.bx1+nx;p.y=y;}}

 /* ---------- per-fighter update: control, physics, moves ---------- */
 update(f){const inp=f.inp,st0=f.st;f.t++;if(f.inv>0)f.inv--;if(f.ledgeCd>0)f.ledgeCd--;if(f.power>0)f.power--;if(f.dropT>0)f.dropT--;if(f.techT>0)f.techT--;if(f.pumT>0)f.pumT--;if(f.flash>0)f.flash--;
  if(inp.shieldP)f.techT=20;if(f.st!=='shield')f.shield=Math.min(50,f.shield+.09);
  f.downP=inp.y<-.5&&f.py>=-.5;f.upP=inp.y>.5&&f.py<=.5;f.sideP=Math.abs(inp.x)>.6&&Math.abs(f.px)<=.6;f.py=inp.y;f.px=inp.x;
  f.counterOn=0;f.reflectOn=0;f.armorOn=0;f.noGrav=false;
  switch(f.st){
   case 'dead':if(f.t>=f.deadT)this.revive(f);return;
   case 'revive':f.inv=2;if(f.t>240||Math.abs(inp.x)>.3||inp.y<-.5||inp.jumpP||inp.atkP||inp.spcP||inp.smashP||inp.shieldP){f.st='air';f.t=0;f.inv=100;f.ground=null;f.vy=0;}else{f.vx=f.vy=0;return;}break;
   case 'idle':case 'walk':case 'run':case 'crouch':this.groundAct(f,inp);break;
   case 'land':if(f.t>=f.lag){f.st='idle';this.groundAct(f,inp);}break;
   case 'jsq':if(f.tap&&(inp.atkP||inp.smashP||inp.spcP||inp.want)){if(inp.spcP||inp.want==='uspec'){this.special(f,'uspec');break;}if(inp.smashP||inp.want==='usmash'){this.start(f,'usmash');break;}if(inp.atkP){this.start(f,'utilt');break;}}
    if(f.t>=4){const full=f.tap?inp.y>.5:inp.jump;f.ground=null;f.vy=full||f.forceFull?f.def.jump:f.def.hop;f.vx=cl(f.vx*.8+inp.x*f.def.air*.6,-f.def.air,f.def.air);f.st='air';f.t=0;f.y+=.01;f.forceFull=false;this.ev('jump',f);}break;
   case 'air':case 'tumble':if(f.st==='tumble'&&f.hitstun>0){f.hitstun--;break;}this.airAct(f,inp);break;
   case 'stun':if(--f.hitstun<=0){f.st=f.ground?'idle':'air';f.t=0;}break;
   case 'helpless':f.vx=app(f.vx,inp.x*f.def.air*.65,f.def.airAcc*.7);if(f.downP&&f.vy<=0)f.ff=true;break;
   case 'atk':this.atkCtl(f,inp);break;
   case 'shield':this.shieldAct(f,inp);break;
   case 'sstun':if(f.t>=f.stunT){f.st=inp.shield?'shield':'idle';f.t=0;}break;
   case 'sdrop':if(f.t>=7){f.st='idle';this.groundAct(f,inp);}break;
   case 'dodge':if(f.t>=2&&f.t<=17)f.inv=Math.max(f.inv,1);if(f.t>=26){f.st='idle';f.t=0;}break;
   case 'roll':if(f.t>=3&&f.t<=19)f.inv=Math.max(f.inv,1);f.vx=f.t>=3&&f.t<=22?f.dodgeDir*.13:0;if(f.t>=30){f.st='idle';f.t=0;f.face=-f.dodgeDir;}break;
   case 'adodge':if(f.t>=3&&f.t<=(f.dodgeDir?18:26))f.inv=Math.max(f.inv,1);if(f.dodgeDir){f.noGrav=f.t<14;if(f.t<14){f.vx*=.9;f.vy*=.9;}}if(f.t>=(f.dodgeDir?34:40)){f.st='air';f.t=0;}break;
   case 'down':if(f.t>20&&(Math.abs(inp.x)>.5||inp.atkP||inp.jumpP||inp.shieldP||inp.y>.5||inp.want)||f.t>100){if(inp.atkP||inp.want==='getupAtk'){this.start(f,'getupAtk');f.inv=12;}else{f.st='getup';f.t=0;f.dodgeDir=Math.abs(inp.x)>.5?sgn(inp.x):0;}}break;
   case 'getup':f.inv=f.t<20?2:0;if(f.dodgeDir)f.vx=f.t<26?f.dodgeDir*.11:0;if(f.t>=(f.dodgeDir?32:26)){f.st='idle';f.t=0;}break;
   case 'tech':f.inv=f.t<18?2:0;if(f.dodgeDir)f.vx=f.t<20?f.dodgeDir*.13:0;if(f.t>=(f.dodgeDir?28:24)){f.st='idle';f.t=0;}break;
   case 'ledge':this.ledgeAct(f,inp);return;
   case 'lget':this.ledgeGet(f);return;
   case 'hold':this.holdAct(f,inp);break;
   case 'held':return;
   case 'throw':this.throwTick(f);break;
   case 'dizzy':f.dizzyT--;if(f.dizzyT<=0&&f.ground){f.st='idle';f.t=0;}break;
  }
  if(f.st==='atk')this.tickMove(f,inp);
  if(f.st==='held'||f.st==='ledge'||f.st==='lget'||f.st==='dead'||f.st==='out')return;
  if(f.ground)this.groundPhys(f,inp);else this.airPhys(f,inp);}

 /* ---------- actions ---------- */
 start(f,name,keep){const m=f.mv[name];if(!m)return false;f.move=m;f.mname=name;f.mt=0;f.st='atk';f.t=0;f.hits={};f.chg=0;f.charging=false;f.vanish=false;f.sub='';if(!keep&&f.ground)f.vx*=.5;
  const sp=m.sp;if(sp){if(sp.kind==='jet'){f.usedUp=true;if(f.fuel>sp.fuel)f.fuel=sp.fuel;if(f.ground){f.ground=null;f.y+=.05;}}if(sp.kind==='pound'&&f.ground){f.ground=null;f.vy=sp.hop;f.y+=.05;}}
  this.ev('move',f,name);return true;}
 special(f,name){const air=!f.ground;if(name==='uspec'){if(air&&f.usedUp)return false;f.usedUp=true;}if(name==='sspec'){if(air&&f.usedSide)return false;if(air)f.usedSide=true;}
  if(Math.abs(f.inp.x)>.3&&name!=='dspec')f.face=sgn(f.inp.x);return this.start(f,name);}
 aerialFor(f,x,y){if(y>.5&&Math.abs(y)>=Math.abs(x)*.8)return'uair';if(y<-.5&&Math.abs(y)>=Math.abs(x)*.8)return'dair';if(Math.abs(x)>.4)return x*f.face>0?'fair':'bair';return'nair';}
 specFor(f,x,y){return y>.5?'uspec':y<-.5?'dspec':Math.abs(x)>.5?'sspec':'nspec';}
 doWant(f,w){if(!w)return false;const air=!f.ground;
  if(w==='jump'){if(!air){this.jsq(f,false);f.forceFull=true;return true;}if(f.jumpsLeft>0){this.djump(f);return true;}return false;}
  if(w==='hop'){if(!air){this.jsq(f,false);return true;}return false;}
  if(w==='shield'){if(!air&&f.shield>5){f.st='shield';f.t=0;return true;}return false;}
  if(w==='adodge'){if(air&&!f.adUsed){this.adodge(f,f.inp.x,f.inp.y);return true;}return false;}
  if(w==='roll'){if(!air){this.roll(f,sgn(f.inp.x)||f.face);return true;}return false;}
  if(w==='dodge'){if(!air){f.st='dodge';f.t=0;f.vx=0;return true;}return false;}
  if(w==='grab'){if(!air){this.start(f,'grab');return true;}return false;}
  if(/spec$/.test(w))return this.special(f,w);
  const m=f.mv[w];if(!m)return false;if(!!m.air!==air)return false;if(!air&&Math.abs(f.inp.x)>.3&&w!=='dash')f.face=sgn(f.inp.x);return this.start(f,w,w==='dash');}
 jsq(f,tap){f.st='jsq';f.t=0;f.tap=tap;}
 djump(f){f.vy=f.def.djump;f.vx=f.inp.x*f.def.air;f.jumpsLeft--;f.ff=false;f.st='air';f.t=0;this.ev('djump',f);}
 adodge(f,x,y){f.st='adodge';f.t=0;f.adUsed=true;const m=Math.hypot(x,y);if(m>.3){f.dodgeDir=1;f.vx=x/m*.36;f.vy=y/m*.36;}else{f.dodgeDir=0;}f.ff=false;this.ev('dodge',f);}
 roll(f,d){f.st='roll';f.t=0;f.dodgeDir=d;this.ev('dodge',f);}
 groundAct(f,inp){if(inp.want&&this.doWant(f,inp.want))return;
  if(f.item&&(inp.atkP||inp.smashP)){this.throwItem(f,inp);return;}if(f.item&&inp.grabP){this.dropItem(f);return;}
  if(inp.smashP){const x=inp.sx||inp.x,y=inp.sy||inp.y;if(y>.5){this.start(f,'usmash');return;}if(y<-.5){this.start(f,'dsmash');return;}if(x*f.face<-.3)f.face*=-1;this.start(f,'fsmash');return;}
  if(inp.spcP){if(this.special(f,this.specFor(f,inp.x,inp.y)))return;}
  if(inp.atkP){const it=this.items.find(i=>!i.held&&i.type==='bomb'&&i.ground&&Math.abs(i.x-f.x)<1.1&&Math.abs(i.y-f.y)<1);if(it){f.item=it;it.held=f;it.thrown=false;this.ev('pickup',f);return;}
   if(f.st==='run'&&Math.abs(f.vx)>f.def.walk*1.15){this.start(f,'dash',true);return;}
   if(inp.y>.5){this.start(f,'utilt');return;}if(inp.y<-.5){this.start(f,'dtilt');return;}if(Math.abs(inp.x)>.5){f.face=sgn(inp.x);this.start(f,'ftilt');return;}this.start(f,'jab');return;}
  if(inp.grabP){this.start(f,'grab');return;}
  if(inp.jumpP){this.jsq(f,false);return;}if(f.upP&&inp.tapJump!==false){this.jsq(f,true);return;}
  if(inp.shield&&f.shield>3){f.st='shield';f.t=0;f.vx*=.3;return;}
  if(f.downP&&f.ground&&f.ground.soft){f.ground=null;f.dropT=12;f.y-=.05;f.st='air';f.t=0;return;}
  if(inp.y<-.5){if(f.st!=='crouch'){f.st='crouch';f.t=0;}return;}
  const ax=Math.abs(inp.x);if(ax>.2){if(sgn(inp.x)!==f.face){f.face=sgn(inp.x);}const run=ax>.75;const ns=run?'run':'walk';if(f.st!==ns){f.st=ns;f.t=0;}}else if(f.st!=='idle'){f.st='idle';f.t=0;}}
 airAct(f,inp){if(inp.want&&this.doWant(f,inp.want))return;
  if(f.item&&(inp.atkP||inp.smashP)){this.throwItem(f,inp);return;}
  if(inp.smashP){f.ujT=0;this.start(f,this.aerialFor(f,inp.sx||inp.x,inp.sy||inp.y));return;}
  if(inp.spcP){f.ujT=0;if(this.special(f,this.specFor(f,inp.x,inp.y)))return;}
  if(inp.atkP){f.ujT=0;this.start(f,this.aerialFor(f,inp.x,inp.y));return;}
  if(inp.jumpP&&f.jumpsLeft>0){f.ujT=0;this.djump(f);return;}
  if(f.upP&&inp.tapJump!==false&&f.jumpsLeft>0)f.ujT=4;
  if(f.ujT>0&&--f.ujT===0&&inp.y>.5&&f.jumpsLeft>0){this.djump(f);return;}
  if(inp.shieldP&&!f.adUsed){this.adodge(f,inp.x,inp.y);return;}
  if(f.downP&&f.vy+f.ky<=.02&&!f.ff){f.ff=true;f.vy=-f.def.fall*1.5;}}
 atkCtl(f,inp){const m=f.move;
  if(f.mname==='jab'&&f.mt>=7&&inp.atkP&&f.ground){this.start(f,'jab2');return;}
  if(!f.ground&&m&&(m.air||(m.sp&&!['dash','tele','pound'].includes(m.sp.kind)))){f.vx=app(f.vx,inp.x*f.def.air,f.def.airAcc*(m.air?1:.6));if(m.air&&f.downP&&f.vy<=.02&&!f.ff){f.ff=true;f.vy=-f.def.fall*1.5;}}}
 shieldAct(f,inp){f.shield-=.14;f.vx*=.8;if(f.shield<=0){this.shieldBreak(f);return;}
  if(inp.want&&inp.want!=='shield'&&this.doWant(f,inp.want))return;
  if(!inp.shield&&inp.want!=='shield'){f.st='sdrop';f.t=0;return;}
  if(inp.jumpP||f.upP){this.jsq(f,f.upP&&!inp.jumpP);return;}
  if(inp.atkP||inp.grabP){this.start(f,'grab');return;}
  if(inp.spcP&&inp.y>.5){this.special(f,'uspec');return;}if(inp.smashP&&(inp.sy||inp.y)>.5){this.start(f,'usmash');return;}
  if(f.downP){f.st='dodge';f.t=0;this.ev('dodge',f);return;}
  if(f.sideP){this.roll(f,sgn(inp.x));return;}}
 shieldBreak(f){f.st='dizzy';f.t=0;f.dizzyT=Math.min(330,170+f.dmg*.6);f.shield=30;f.ground=null;f.vy=.42;f.y+=.05;this.ev('shieldbreak',f);}

 /* ---------- move ticking + specials ---------- */
 tickMove(f,inp){const m=f.move,sp=m.sp,K=sp&&sp.kind;
  if(m.charge&&f.mt===m.charge&&(inp.smash||inp.want==='charge')&&f.chg<1){f.chg=Math.min(1,f.chg+1/60);f.charging=true;f.flash=2;return;}
  if((K==='cshot'||K==='cpunch')&&f.mt===sp.at&&(inp.spc||inp.want==='charge')&&f.chg<1){f.chg=Math.min(1,f.chg+1/sp.max);f.charging=true;if(f.ground)f.vx*=.8;else{f.vy=Math.max(f.vy,-.05);}return;}
  f.charging=false;f.mt++;const mt=f.mt;
  if(m.m)for(const e of m.m)if(e[0]===mt){if(e[1]!=null)f.vx=f.face*e[1];if(e[2]!=null){f.vy=e[2];f.ground=null;}}
  if(sp)switch(K){
   case 'shoot':if(mt===sp.at)this.spawnProj(f,sp.proj);break;
   case 'cshot':if(mt===sp.at+1){const k=f.chg,b=sp.big,p={...sp.proj};p.r+= (b.r-p.r)*k;p.d=Math.round(p.d+(b.d-p.d)*k);p.b+=(b.b-p.b)*k;p.g+=(b.g-p.g)*k;p.spd+=(b.spd-p.spd)*k;p.chg=k;this.spawnProj(f,p);}break;
   case 'dash':if(mt>=sp.a&&mt<=sp.b){f.vx=f.face*sp.spd;if(!f.ground){f.noGrav=true;f.vy=sp.vy?sp.vy*(1-(mt-sp.a)/(sp.b-sp.a))*2-sp.vy*.5:0;}if(sp.inv){f.inv=Math.max(f.inv,1);f.vanish=mt<sp.b-2;}if(sp.armor&&mt>=sp.armor[0]&&mt<=sp.armor[1])f.armorOn=sp.armor[2];}else if(mt===sp.b+1){f.vx*=.35;f.vanish=false;}break;
   case 'spin':if(mt>=sp.a&&mt<=sp.b){f.vx=app(f.vx,f.face*sp.spd+inp.x*.06,.02);if(!f.ground){f.vy=Math.max(f.vy,-.06);}}break;
   case 'rise':if(mt===sp.at){if(f.ground){f.ground=null;f.y+=.05;}f.vy=sp.vy;f.vx=inp.x*sp.vx*1.5;f.ff=false;}if(mt>sp.at&&mt<=sp.at+sp.dur){f.noGrav=true;f.vy=sp.vy*(1-(mt-sp.at)/sp.dur*.55);f.vx=app(f.vx,inp.x*sp.vx*2,.012);}break;
   case 'tele':if(mt<sp.a){f.vy*=.6;f.vx*=.6;f.noGrav=true;}if(mt===sp.a){const L=Math.hypot(inp.x,inp.y);f.teleDir=L>.3?[inp.x/L,inp.y/L]:[0,1];if(f.ground&&f.teleDir[1]<0)f.teleDir=[sgn(f.teleDir[0])||f.face,0];this.ev('vanish',f);}
    if(mt>=sp.a&&mt<sp.b){f.vanish=true;f.inv=Math.max(f.inv,1);f.noGrav=true;const s=sp.dist/(sp.b-sp.a);f.vx=f.teleDir[0]*s;f.vy=f.teleDir[1]*s;if(f.ground&&f.teleDir[1]>0){f.ground=null;f.y+=.05;}}
    if(mt===sp.b){f.vanish=false;f.vx*=.25;f.vy=Math.max(0,f.vy*.25);if(f.teleDir[0])f.face=sgn(f.teleDir[0]);this.ev('appear',f);}break;
   case 'jet':if((inp.spc||inp.want==='uspec'||inp.want==='hold')&&f.fuel>0){f.fuel--;f.noGrav=true;f.vy=Math.min(sp.max,f.vy+sp.acc);f.vx=app(f.vx,inp.x*sp.drift*1.5,.01);if(inp.x)f.face=sgn(inp.x);}else{this.endMove(f,true);return;}break;
   case 'counter':if(mt>=sp.a&&mt<=sp.b)f.counterOn=1;if(!f.ground){f.vy=Math.max(f.vy,-.05);}break;
   case 'reflect':if(mt>=sp.a&&mt<=sp.b)f.reflectOn=1;if(!f.ground){f.vy=Math.max(f.vy,-.04);f.vx*=.9;}break;
   case 'pound':if(mt<sp.stall){f.noGrav=true;f.vy*=.82;f.vx*=.85;}else{f.noGrav=true;f.vy=-sp.spd;f.vx=inp.x*.04;}if(mt>=m.f-1){this.endMove(f,true);return;}break;
   case 'breath':if(mt>sp.a+10&&mt<sp.a+sp.max&&!(inp.spc||inp.want==='hold')){f.mt=m.f-sp.end;}if(!f.ground)f.vy=Math.max(f.vy,-.07);break;
  }
  if(f.mt>=m.f)this.endMove(f);}
 endMove(f,forceHelpless){const m=f.move;f.move=null;f.vanish=false;f.charging=false;if(f.ground){f.st='idle';f.t=0;}else{f.st=(m&&m.helpless)||forceHelpless?'helpless':'air';f.t=0;}}

 /* ---------- physics ---------- */
 groundPhys(f,inp){const p=f.ground,d=f.def;f.x+=p.dx;f.y=p.y;
  if(f.st==='walk'||f.st==='run'){const tgt=Math.sign(inp.x)*(f.st==='run'?d.run:d.walk)*Math.min(1,Math.abs(inp.x)*1.3);f.vx=app(f.vx,tgt,f.st==='run'?.03:.02);}
  else if(f.st!=='roll'&&f.st!=='getup'&&f.st!=='tech'&&!(f.st==='atk'&&f.move&&f.move.sp&&['dash','spin'].includes(f.move.sp.kind)))f.vx=app(f.vx,0,f.st==='atk'?.012:.02);
  f.kx=app(f.kx,0,.022);
  const nx=f.x+f.vx+f.kx;
  if(nx<p.x0||nx>p.x1){const walkOff=['walk','run','stun','tumble','dizzy','helpless'].includes(f.st)||(f.st==='atk'&&f.move&&f.move.sp&&['dash','spin'].includes(f.move.sp.kind))||Math.abs(f.kx)>.12;
   if(walkOff){f.x=nx;f.ground=null;if(['walk','run','idle','crouch','land'].includes(f.st)){f.st='air';f.t=0;}return;}
   f.x=cl(nx,p.x0,p.x1);f.vx=0;f.kx=0;}else f.x=nx;
  this.pushOut(f);}
 airPhys(f,inp){const d=f.def;
  if(f.st==='air'||f.st==='tumble'&&f.hitstun<=0){f.vx=Math.abs(inp.x)>.15?app(f.vx,inp.x*d.air,d.airAcc):app(f.vx,0,.0025);}
  if(!f.noGrav){f.vy-=d.grav*(f.st==='dizzy'?.8:1);const cap=-(f.ff?d.fall*1.5:d.fall);if(f.vy<cap)f.vy=f.ff?cap:Math.min(f.vy+d.grav*2,Math.max(f.vy,cap));}
  const km=Math.hypot(f.kx,f.ky);if(km>0){const nm=Math.max(0,km-DECAY);f.kx*=nm/km;f.ky*=nm/km;}
  const ox=f.x,oy=f.y;f.x+=f.vx+f.kx;f.y+=f.vy+f.ky;this.collide(f,ox,oy);
  if(!f.ground)this.tryLedge(f,inp);}
 collide(f,ox,oy){const hw=f.W/2,vyt=f.vy+f.ky;
  for(const s of this.stage.solids){
   if(vyt<=0&&oy>=s.y-1e-3&&f.y<s.y&&f.x>=s.x0-.05&&f.x<=s.x1+.05){f.y=s.y;f.x=cl(f.x,s.x0,s.x1);this.land(f,s,vyt);return;}
   if(f.x+hw>s.x0&&f.x-hw<s.x1&&f.y<s.y&&f.y+f.H>s.yb){
    if(oy+f.H<=s.yb+.05){f.y=s.yb-f.H;if(f.vy>0)f.vy=0;if(f.ky>0)f.ky=f.st==='tumble'?-f.ky*.5:0;}
    else{const left=ox<(s.x0+s.x1)/2;f.x=left?s.x0-hw-.001:s.x1+hw+.001;if(f.st==='tumble'&&Math.abs(f.kx)>.15){f.kx=-f.kx*.6;this.ev('wallbounce',f);}else{f.kx=0;}f.vx=0;}}}
  if(f.dropT>0)return;
  for(const p of this.stage.plats){if(vyt-p.dy<=0&&oy>=p.y-p.dy-1e-3&&f.y<p.y+1e-3&&f.x>=p.x0&&f.x<=p.x1){if(f.inp.y<-.5&&f.ff&&f.st!=='tumble')continue;f.y=p.y;this.land(f,p,vyt);return;}}}
 pushOut(f){const hw=f.W/2;for(const s of this.stage.solids){if(f.ground===s)continue;if(f.x+hw>s.x0&&f.x-hw<s.x1&&f.y<s.y-.05&&f.y+f.H>s.yb){f.x=f.x<(s.x0+s.x1)/2?s.x0-hw:s.x1+hw;}}}
 land(f,p,vy){f.ground=p;f.ff=false;f.jumpsLeft=f.def.jumps;f.usedUp=false;f.usedSide=false;f.adUsed=false;f.fuel=999;f.ledgeFresh=true;f.dropT=0;
  const st=f.st;f.vy=0;
  if(st==='tumble'){if(f.techT>0){f.st='tech';f.t=0;f.dodgeDir=Math.abs(f.inp.x)>.5?sgn(f.inp.x):0;f.kx=0;f.ky=0;f.hitstun=0;this.ev('tech',f);return;}
   if(vy<-.42&&f.hitstun>0){f.ground=null;f.ky=-vy*.55;f.vy=0;f.y=p.y+.02;this.ev('bounce',f);return;}
   f.st='down';f.t=0;f.ky=0;f.kx*=.5;f.hitstun=0;this.ev('knockdown',f);return;}
  f.ky=0;
  if(st==='stun'){return;}
  if(st==='atk'&&f.move){const m=f.move,K=m.sp&&m.sp.kind;
   if(K==='pound'&&m.land){f.move=null;this.start(f,f.mname+'Land');this.ev('quake',f);return;}
   if(m.air){f.st='land';f.lag=f.ff?m.ll:m.ll;f.t=0;f.move=null;this.ev('land',f,vy);return;}
   if(K&&['shoot','cshot','breath','counter','reflect','spin','cmd','cpunch'].includes(K))return;
   f.move=null;f.st='land';f.lag=12;f.t=0;return;}
  if(st==='helpless'){f.st='land';f.lag=20;f.t=0;this.ev('land',f,vy);return;}
  if(st==='adodge'){f.st='land';f.lag=10;f.t=0;f.vx*=.5;return;}
  if(st==='dizzy'||st==='hold'||st==='throw')return;
  if(st==='ledge'||st==='lget'||st==='revive')return;
  f.st='land';f.lag=vy<-.2?5:3;f.t=0;this.ev('land',f,vy);}

 /* ---------- ledges ---------- */
 tryLedge(f,inp){if(f.ledgeCd>0||inp.y<-.5)return;const ok=f.st==='air'||f.st==='helpless'||(f.st==='tumble'&&f.hitstun<=0)||(f.st==='adodge'&&f.t>10)||(f.st==='atk'&&f.move&&f.move.sp&&(f.mname==='uspec'&&f.mt>10));if(!ok)return;
  if(f.vy+f.ky>.08&&f.st!=='atk')return;
  for(const s of this.stage.solids){if(!s.ledge)continue;for(const side of[-1,1]){const ex=side<0?s.x0:s.x1,ey=s.y;
    if(side<0?f.x>ex+.15:f.x<ex-.15)continue;if(Math.abs(f.x-ex)>f.W/2+.8)continue;const top=f.y+f.H;if(top<ey-.7||top>ey+1.1)continue;
    const key=s.id+':'+side,occ=this.ledgeOcc.get(key);if(occ&&occ!==f&&occ.st==='ledge'){occ.st='air';occ.t=0;occ.vx=side*.12;occ.vy=.14;occ.ledgeCd=50;occ.inv=0;occ.ledge=null;this.ev('trump',occ);}
    this.ledgeOcc.set(key,f);f.st='ledge';f.t=0;f.ledge={s,side,ex,ey};f.move=null;f.vanish=false;f.x=ex+side*(f.W/2+.05);f.y=ey-f.H*.92;f.face=-side;f.vx=f.vy=f.kx=f.ky=0;f.ff=false;
    f.jumpsLeft=f.def.jumps;f.usedUp=false;f.usedSide=false;f.adUsed=false;f.fuel=999;f.inv=f.ledgeFresh?50:0;f.ledgeFresh=false;this.ev('ledge',f);return;}}}
 ledgeAct(f,inp){const L=f.ledge;if(!L){f.st='air';return;}f.x=L.ex+L.side*(f.W/2+.05)+L.s.dx;f.y=L.ey-f.H*.92;
  if(f.t>300){this.ledgeDrop(f);return;}if(f.t<8)return;
  const toward=inp.x*-L.side>.5,away=inp.x*L.side>.5,w=inp.want;
  if(inp.jumpP||w==='ljump'){this.ledgeFree(f);f.st='air';f.t=0;f.y=L.ey-f.H*.55;f.vy=f.def.jump*1.02;f.vx=-L.side*.06;f.inv=Math.max(f.inv,6);this.ev('jump',f);return;}
  if(inp.atkP||inp.smashP||w==='latk'){this.ledgeFree(f);f.st='lget';f.sub='atk';f.t=0;return;}
  if(inp.shieldP||w==='lroll'){this.ledgeFree(f);f.st='lget';f.sub='roll';f.t=0;return;}
  if(inp.y>.5||toward||w==='lclimb'){this.ledgeFree(f);f.st='lget';f.sub='climb';f.t=0;return;}
  if(inp.y<-.5||away||w==='ldrop')this.ledgeDrop(f);}
 ledgeFree(f){const L=f.ledge;if(L){const key=L.s.id+':'+L.side;if(this.ledgeOcc.get(key)===f)this.ledgeOcc.delete(key);}}
 ledgeDrop(f){const L=f.ledge;this.ledgeFree(f);f.st='air';f.t=0;f.ledgeCd=30;f.x+=L.side*.25;f.inv=0;}
 ledgeGet(f){const L=f.ledge,t=f.t,hx=L.ex+L.side*(f.W/2+.05),hy=L.ey-f.H*.92,sx=L.ex-L.side*(f.W/2+.35);
  if(t<=12){const k=t/12;f.x=hx+(sx-hx)*k;f.y=hy+(L.ey-hy)*Math.min(1,k*1.4);f.inv=2;return;}
  if(t===13){f.ground=L.s;f.y=L.ey;f.x=sx;f.ledge=null;if(f.sub==='atk'){this.start(f,'ledgeAtk');f.mt=10;f.inv=6;return;}if(f.sub==='climb'){f.st='land';f.lag=8;f.t=0;f.inv=8;return;}
   f.st='roll';f.t=3;f.dodgeDir=-L.side;return;}}

 /* ---------- grabs & throws ---------- */
 tryGrab(a,v,hb){if(['held','hold','throw','dead','revive','out','ledge','lget'].includes(v.st)||v.vanish)return false;if(!v.ground&&v.y-a.y>1.2&&!hb.cmd)return false;
  if(v.held)this.release(v);v.move=null;a.held=v;v.holder=a;v.st='held';v.t=0;v.hitstun=0;v.kx=v.ky=v.vx=v.vy=0;v.charging=false;
  if(hb.cmd){a.st='throw';a.thr=a.move.thr;a.t=0;a.move=null;}else{a.st='hold';a.t=0;a.holdT=Math.min(240,70+v.dmg*.7);a.move=null;}
  a.vx=0;this.ev('grab',a,v);return true;}
 holds(){for(const a of this.f){const v=a.held;if(!v)continue;if((a.st!=='hold'&&a.st!=='throw')||v.st!=='held'){this.release(a);continue;}
   v.x=a.x+a.face*(a.W/2+v.W/2-.15);v.y=a.y+(a.st==='throw'?.4:.15);v.face=-a.face;v.ground=null;}}
 release(a){const v=a.held;a.held=null;if(v&&v.holder===a){v.holder=null;if(v.st==='held'){v.st='air';v.t=0;v.vy=.12;v.vx=a.face*.12;v.ledgeCd=10;}}if(a.st==='hold'||a.st==='throw'){a.st=a.ground?'idle':'air';a.t=0;}}
 holdAct(a,inp){const v=a.held;if(!v){a.st='idle';return;}a.vx=0;a.holdT--;if(v.inp&&(v.inp.atkP||v.inp.jumpP||v.inp.spcP||v.inp.shieldP||v.inp.mash||v.sideP))a.holdT-=4;
  if(a.holdT<=0){this.release(a);v.kx=a.face*.16;v.st='stun';v.hitstun=12;a.st='land';a.lag=14;a.t=0;this.ev('grabrelease',a,v);return;}
  if(a.t<6)return;const w=inp.want;
  if((inp.atkP||w==='pummel')&&a.pumT<=0&&a.t<300){a.pumT=16;const d=Math.round(1.6*a.def.P*10)/10;v.dmg+=d;a.stats.dealt+=d;v.stats.taken+=d;v.flash=4;a.hitlag=v.hitlag=3;this.ev('pummel',a,v,d);return;}
  let k=null;if(w&&/^throw/.test(w))k=w.slice(5).toLowerCase();else if(inp.y>.5)k='u';else if(inp.y<-.5)k='d';else if(Math.abs(inp.x)>.5)k=inp.x*a.face>0?'f':'b';
  if(k){a.st='throw';a.thr=a.mv.throws[k];a.thrK=k;a.t=0;this.ev('throw',a,k);}}
 throwTick(a){const T=a.thr,v=a.held;if(!T){a.st='idle';return;}
  if(a.t===T.rel&&v){a.held=null;v.holder=null;const d=T.d*(a.power>0?1.3:1);v.dmg=Math.min(999,v.dmg+d);a.stats.dealt+=d;v.stats.taken+=d;a.stats.hits++;v.lastHitBy=a;v.lastHitF=this.frame;
   const kb=kbOf(v.dmg,d,v.def.w,T.b,T.g);this.launch(v,kb,T.a,a.face,false);a.hitlag=v.hitlag=Math.min(18,d*.4+4|0);v.st=kb>80?'tumble':'stun';v.ground=null;v.y+=.05;this.ev('hit',a,v,{d,kb,fx:a.def.fx,x:v.x,y:v.y+v.H*.5,throw:1});}
  if(a.t>=T.f){a.thr=null;a.st=a.ground?'idle':'air';a.t=0;}}

 /* ---------- hits ---------- */
 hitboxes(){for(const a of this.f){if(a.st!=='atk'||!a.move)continue;const m=a.move;
   for(const hb of m.h){if(a.mt<hb.s||a.mt>hb.e)continue;const cx=a.x+a.face*hb.x,cy=a.y+hb.y;
    for(const v of this.f){if(v===a||!v.hittable()||v.holder===a)continue;const g=hb.k||0,rec=a.hits[g]||(a.hits[g]=new Map());
     if(rec.has(v.id)&&!(hb.rh&&a.mt-rec.get(v.id)>=hb.rh))continue;if(!this.overlap(cx,cy,hb.r,v))continue;
     if(hb.grab){if(v.st==='shield'||hb.cmd||true){rec.set(v.id,a.mt);if(this.tryGrab(a,v,hb))return this.hitboxes();}continue;}
     rec.set(v.id,a.mt);this.hit(a,v,hb,cx,cy,null);if(a.st!=='atk')break;}
    if(a.st!=='atk'||!a.move)break;}}}
 overlap(cx,cy,r,v){const rad=v.W/2,y0=v.y+rad,y1=Math.max(y0,v.y+v.H-rad);const py=cl(cy,y0,y1);return Math.hypot(cx-v.x,cy-py)<r+rad;}
 launch(v,kb,ang,s,ground){let a=ang===361?(ground?(kb<60?0:38):42):ang;let rad=a*Math.PI/180;let dx=Math.cos(rad)*s,dy=Math.sin(rad);
  const ix=v.inp.x,iy=v.inp.y;if(Math.hypot(ix,iy)>.3&&kb>30){const c=dx*iy-dy*ix;rad=Math.atan2(dy,dx)+cl(c,-1,1)*.3;dx=Math.cos(rad);dy=Math.sin(rad);}
  const sp=kb*KS;v.kx=dx*sp;v.ky=dy*sp;v.vx=0;v.vy=0;v.hitstun=Math.floor(kb*.4);v.lastKb=kb;
  if(v.ground){if(dy<=.05){if(dy<-.2&&kb>50){v.ky=-v.ky*.7;v.ground=null;v.y+=.05;}else{v.ky=0;}}else{v.ground=null;v.y+=.05;}}
  v.st=kb>80?'tumble':'stun';v.t=0;v.ff=false;v.move=null;v.vanish=false;v.charging=false;if(v.held)this.release(v);if(v.st==='stun'&&!v.ground&&kb<=80)v.st='stun';}
 hit(a,v,hb,cx,cy,proj){const pw=a&&a.power>0?1.3:1;let d=hb.d*pw*(a&&a.st==='atk'&&a.chg?1+a.chg*(a.move.sp&&a.move.sp.cm||.4):1);d=Math.round(d*10)/10;
  const srcX=proj?proj.x:cx;
  if(v.counterOn&&!hb.grab&&a!==v&&!(proj&&proj.haz)){this.counter(v,a,d,proj);return'counter';}
  if(v.reflectOn&&proj&&!proj.pillar&&!proj.mine&&!proj.haz){proj.owner=v;proj.vx=-proj.vx*1.25;proj.vy=-proj.vy*.5;proj.d*=1.4;proj.dirX=sgn(proj.vx);proj.t=0;proj.hitSet=new Set();this.ev('reflect',v,proj);return'reflect';}
  if((v.st==='shield'||v.st==='sstun')&&v.shield>0&&!hb.unblock){v.shield-=d*1.05;v.st='sstun';v.t=0;v.stunT=Math.floor(d*.75+4);const dir=sgn(v.x-srcX)||(a?a.face:1);
   v.kx=dir*Math.min(.32,.04+d*.011);if(a&&!proj&&a.ground)a.kx=-dir*Math.min(.16,d*.006);const hl=Math.min(14,d*.3+3|0);v.hitlag=hl;if(a&&!proj)a.hitlag=hl;this.ev('shieldhit',v,a,{d,x:cx,y:cy});
   if(v.shield<=0)this.shieldBreak(v);return'shield';}
  if(a)a.stats.dealt+=d;v.stats.taken+=d;if(a){a.stats.hits++;}
  if(v.armorOn&&d<v.armorOn&&!hb.lk){v.dmg=Math.min(999,v.dmg+d);v.flash=6;const hl=Math.min(14,d*.35+3|0);v.hitlag=hl;if(a&&!proj)a.hitlag=hl;this.ev('armor',v,a,{d,x:cx,y:cy});return'armor';}
  v.dmg=Math.min(999,v.dmg+d);v.flash=6;
  const inStun=(v.st==='stun'||v.st==='tumble')&&v.hitstun>0;
  if(a){if(inStun&&v.comboBy===a)v.combo++;else{v.combo=1;v.comboBy=a;}if(v.combo>a.stats.maxCombo)a.stats.maxCombo=v.combo;v.lastHitBy=a;v.lastHitF=this.frame;}
  v.ledgeFresh=true;if(v.item)this.dropItem(v);if(v.held)this.release(v);if(v.st==='ledge'){this.ledgeFree(v);v.ledge=null;}
  let kb=0;
  if(hb.lk){v.st='stun';v.t=0;v.hitstun=14;v.move=null;v.vanish=false;const ax=a?a.vx+a.kx:0,ay=a?a.vy+a.ky:0;v.kx=(cx-v.x)*.14+ax;v.ky=(cy-v.cy())*.14+ay;v.vx=v.vy=0;if(v.ground&&v.ky>.03){v.ground=null;v.y+=.05;}
   const hl=4;v.hitlag=hl;if(a&&!proj)a.hitlag=hl;}
  else{kb=kbOf(v.dmg,d,v.def.w,hb.b,hb.g)*(v.st==='crouch'?.85:1);const s=hb.away?(sgn(v.x-srcX)||(a?a.face:1)):(proj?(proj.dirX||sgn(v.x-srcX)):(a?a.face:sgn(v.x-srcX)||1));
   this.launch(v,kb,hb.a,s,!!v.ground);let hl=Math.min(22,d*.45+4|0);if(hb.fx==='elec')hl=Math.min(26,hl*1.4|0);v.hitlag=hl;if(a&&!proj)a.hitlag=hl;if(a&&kb>a.stats.big)a.stats.big=Math.round(kb);}
  this.ev('hit',a,v,{d,kb,fx:hb.fx||(a?a.def.fx:'impact'),x:(cx+v.x)/2,y:(cy+v.cy())/2,lk:!!hb.lk,proj:!!proj,combo:v.combo});return'hit';}
 counter(v,a,d,proj){v.move=null;if(a&&!proj)v.face=sgn(a.x-v.x)||v.face;if(proj)proj.dead=true;const cd=Math.max(9,d*1.3);
  v.mv.counterHit=v.mv.counterHit||{name:'counterHit',f:32,h:[{s:4,e:8,x:1.0,y:1.1,r:.95,d:0,a:361,b:60,g:92,fx:v.def.fx,away:false}],p:['punchW','punch'],lb:'hR',ai:{x0:0,x1:2,y0:0,y1:2,st:4,d:10,kb:150},fx:v.def.fx};
  this.start(v,'counterHit');v.move.h[0].d=Math.round(cd*10)/10;v.inv=12;if(a&&!proj){a.hitlag=18;}this.ev('counter',v,a);}

 /* ---------- projectiles ---------- */
 spawnProj(f,def,o={}){if(def.max){const n=this.proj.filter(p=>p.owner===f&&p.t0===def.t&&!p.dead).length;if(n>=def.max){this.ev('fizzle',f);return null;}}
  const ang=(def.ang||0)*Math.PI/180;const p={...def,t0:def.t,owner:f,x:f.x+f.face*(f.W/2+.45),y:f.y+f.H*.55,vx:Math.cos(ang)*def.spd*f.face,vy:Math.sin(ang)*def.spd,t:0,dirX:f.face,hitSet:new Set(),dead:false,armed:!def.mine,bounces:def.bounce||0,id:Math.random()};
  if(def.pillar){p.x=f.x+f.face*def.pillar.off;const s=this.surfaceBelow(p.x,f.y+.5);p.y=s?s.y:f.y;p.vx=0;}
  if(def.mine){p.x=f.x+f.face*.6;p.y=f.y+.3;p.vx=0;}
  if(def.ground){p.y=f.y+.5;}
  this.proj.push(p);this.ev('proj',f,p);return p;}
 stepProj(){for(const p of this.proj){if(p.dead)continue;p.t++;
   if(p.t>p.life){if(p.explode)this.explode(p);p.dead=true;continue;}
   if(p.homing){let tg=null,bd=1e9;for(const v of this.f){if(v===p.owner||!v.hittable())continue;const d=Math.hypot(v.x-p.x,v.cy()-p.y);if(d<bd){bd=d;tg=v;}}if(tg){const a=Math.atan2(p.vy,p.vx),b=Math.atan2(tg.cy()-p.y,tg.x-p.x);let da=b-a;while(da>Math.PI)da-=Math.PI*2;while(da<-Math.PI)da+=Math.PI*2;const na=a+cl(da,-p.homing,p.homing),s=Math.hypot(p.vx,p.vy);p.vx=Math.cos(na)*s;p.vy=Math.sin(na)*s;}}
   if(p.accel){const s=Math.hypot(p.vx,p.vy)||1,ns=Math.min(p.vmax,s+p.accel);p.vx*=ns/s;p.vy*=ns/s;}
   if(p.mine&&p.landed){p.vx=p.vy=0;}else p.vy-=p.grav;
   const ox=p.x,oy=p.y;p.x+=p.vx;p.y+=p.vy;
   if(p.ground){const s=this.surfaceBelow(p.x,p.y+.2);if(s&&p.y-s.y<1.2){p.y=s.y+.45;p.vy=0;}else if(!s||p.y<s.y){p.vy-=.01;}if(p.y<this.stage.solids[0].y-14)p.dead=true;}
   else if(!p.pillar){for(const s of[...this.stage.solids,...this.stage.plats]){if(p.vy<=0&&oy-p.r>=s.y-.05&&p.y-p.r<s.y&&p.x>=s.x0&&p.x<=s.x1){
      if(p.mine){p.y=s.y+p.r*.6;p.landed=true;p.vx=p.vy=0;p.onS=s;break;}
      if(p.bounces>0){p.bounces--;p.y=s.y+p.r;p.vy=Math.abs(p.vy)*.62;p.vx*=.85;this.ev('pbounce',p);break;}
      if(p.grav>0||p.explode){if(p.explode)this.explode(p);p.dead=true;break;}}
     if(!s.soft&&p.x>s.x0&&p.x<s.x1&&p.y<s.y-.1&&p.y>s.yb){if(p.explode)this.explode(p);p.dead=true;break;}}}
   if(p.mine&&p.onS){p.x+=p.onS.dx;p.y+=p.onS.dy;}
   if(p.dead)continue;if(p.mine&&!p.armed&&p.t>=p.arm)p.armed=true;
   const B=this.stage.blast;if(p.x<B.l||p.x>B.r||p.y<B.b||p.y>B.t){p.dead=true;continue;}
   // hits
   for(const v of this.f){if(v===p.owner||!v.hittable()||p.hitSet.has(v.id))continue;
    if(p.pillar){const ph=p.pillar.h;if(p.t<3||Math.abs(v.x-p.x)>p.r+v.W/2||v.y>p.y+ph||v.y+v.H<p.y-.3)continue;}
    else{const rr=p.mine?p.r+.25:p.r;if(!this.overlap(p.x,p.y,rr,v))continue;if(p.mine&&!p.armed)continue;}
    if(p.mine||p.explode&&!p.pillar){this.explode(p);p.dead=true;break;}
    p.hitSet.add(v.id);const r=this.hit(p.owner,v,{d:p.d,a:p.a,b:p.b,g:p.g,fx:p.fx,away:!!p.pillar},p.x,p.y,p);if(r==='reflect')break;if(!p.pillar){p.dead=true;this.ev('phit',p);break;}}
   // projectile clash
   if(!p.dead&&!p.pillar&&!p.mine)for(const q of this.proj){if(q===p||q.dead||q.owner===p.owner||q.pillar||q.mine)continue;if(Math.hypot(q.x-p.x,q.y-p.y)<p.r+q.r){p.dead=q.dead=true;this.ev('clash',p,q);if(p.explode)this.explode(p);if(q.explode)this.explode(q);break;}}}
  this.proj=this.proj.filter(p=>!p.dead);}
 explode(p){if(p.boomed)return;p.boomed=true;const R=typeof p.explode==='number'?p.explode:1.6;this.ev('boom',p,R);
  for(const v of this.f){if((v===p.owner&&!p.selfHit)||!v.hittable())continue;if(!this.overlap(p.x,p.y,R,v))continue;this.hit(p.owner,v,{d:p.d,a:p.a,b:p.b,g:p.g,fx:p.fx==='tech'?'fire':p.fx,away:true},p.x,p.y,p);}}

 /* ---------- items ---------- */
 spawnItem(type,x,y){const it={type,x,y,vx:0,vy:0,t:0,held:null,ground:false,thrown:false,owner:null,id:Math.random()};this.items.push(it);this.ev('item',it);return it;}
 throwItem(f,inp){const it=f.item;if(!it)return;f.item=null;it.held=null;it.thrown=true;it.owner=f;it.t=0;const sm=inp.smashP?1.4:1;
  if(inp.y>.5){it.vx=f.face*.05;it.vy=.5*sm;}else if(inp.y<-.5&&!f.ground){it.vx=0;it.vy=-.5*sm;}else{if(Math.abs(inp.x)>.3)f.face=sgn(inp.x);it.vx=f.face*.42*sm;it.vy=.12;}
  it.x=f.x+f.face*.6;it.y=f.y+f.H*.7;f.st=f.ground?'land':'air';f.lag=10;f.t=0;this.ev('toss',f,it);}
 dropItem(f){const it=f.item;if(!it)return;f.item=null;it.held=null;it.thrown=false;it.vx=f.face*.05;it.vy=.1;}
 stepItems(){for(const it of this.items){if(it.dead)continue;it.t++;
   if(it.held){const f=it.held;if(f.st==='dead'||f.st==='out'){it.held=null;f.item=null;}else{it.x=f.x+f.face*.55;it.y=f.y+f.H*.8;continue;}}
   if(!it.ground){it.vy-=.01;it.vy=Math.max(it.vy,-.3);const ox=it.x,oy=it.y;it.x+=it.vx;it.y+=it.vy;
    for(const s of[...this.stage.solids,...this.stage.plats]){if(it.vy<=0&&oy>=s.y-.05&&it.y<s.y&&it.x>=s.x0&&it.x<=s.x1){if(it.thrown&&it.type==='bomb'){this.itemBoom(it);break;}it.y=s.y;it.ground=s;it.vx=0;it.vy=0;it.t=Math.min(it.t,60);break;}}}
   else{it.x+=it.ground.dx;it.y=it.ground.y;if(it.x<it.ground.x0||it.x>it.ground.x1)it.ground=null;}
   if(it.dead)continue;
   if(it.thrown&&it.type==='bomb'){for(const v of this.f){if((v===it.owner&&it.t<20)||!v.hittable())continue;if(this.overlap(it.x,it.y+.3,.45,v)){this.itemBoom(it);break;}}}
   else if(it.type!=='bomb'){for(const v of this.f){if(!v.hittable()||v.st==='held')continue;if(Math.abs(v.x-it.x)<.9&&it.y>v.y-.4&&it.y<v.y+v.H){if(it.type==='heal'){v.dmg=Math.max(0,v.dmg-30);}else{v.power=600;}it.dead=true;this.ev('collect',v,it);break;}}}
   const B=this.stage.blast;if(it.y<B.b||it.x<B.l||it.x>B.r)it.dead=true;
   if(!it.held&&it.t>(it.type==='bomb'&&it.ground?540:900)){if(it.type==='bomb')this.itemBoom(it);else it.dead=true;}}
  this.items=this.items.filter(i=>!i.dead);}
 itemBoom(it){it.dead=true;if(it.held){it.held.item=null;it.held=null;}const p={x:it.x,y:it.y+.3,d:15,a:361,b:50,g:82,fx:'fire',owner:it.owner||null,explode:2,selfHit:true};this.explode(p);}

 /* ---------- stage hazards ---------- */
 hazard(){const H=this.stage.hazard;if(!H)return;const z=this.haz;z.t++;
  if(!z.warn&&!z.on&&z.t>=z.next){z.warn=1;z.t=0;const s=this.stage.solids[0];
   if(H.kind==='geyser'){const tgt=this.alive().filter(f=>f.st!=='dead')[Math.random()*this.alive().length|0];z.x=cl(tgt?tgt.x+(Math.random()-.5)*3:0,s.x0+1.5,s.x1-1.5);}
   if(H.kind==='laser'){z.y=s.y+[.45,1.75,H.high||4.4][Math.random()*3|0];z.dir=Math.random()<.5?1:-1;}
   this.ev('hazwarn',z,H);}
  if(z.warn&&z.t>=H.warn){z.warn=0;z.on=1;z.t=0;z.hit=new Set();this.ev('hazon',z,H);}
  if(z.on){const B=this.stage.blast;
   for(const v of this.f){if(!v.hittable()||z.hit.has(v.id))continue;let hit=false;
    if(H.kind==='geyser')hit=Math.abs(v.x-z.x)<1.25+v.W/2&&v.y<this.stage.solids[0].y+7;
    if(H.kind==='laser'){const bx=z.dir>0?B.l+(B.r-B.l)*(z.t/H.dur*1.6):B.r-(B.r-B.l)*(z.t/H.dur*1.6);const past=z.dir>0?v.x<bx:v.x>bx;hit=past&&v.y<z.y+.25&&v.y+v.H>z.y-.25;}
    if(hit){z.hit.add(v.id);this.hit(null,v,{d:H.d,a:H.kind==='laser'?(z.dir>0?35:145):88,b:H.b,g:H.g,fx:H.fx,away:false},H.kind==='laser'?v.x-z.dir:z.x,v.cy(),{x:H.kind==='laser'?v.x-z.dir:z.x,dirX:z.dir,haz:1});}}
   if(z.t>=H.dur){z.on=0;z.t=0;z.next=H.every+(Math.random()*H.jit|0);this.ev('hazoff',z,H);}}}

 /* ---------- blast zones, KOs, respawn ---------- */
 blast(f){if(['dead','out','revive'].includes(f.st))return;const B=this.stage.blast;
  const top=f.y>B.t&&(f.st==='tumble'||f.st==='stun');if(f.y>B.t+6)f.y=B.t+6;
  if(f.x<B.l||f.x>B.r||f.y<B.b||top)this.ko(f);}
 ko(f,silent){const killer=f.lastHitBy&&f.lastHitBy!==f&&this.frame-f.lastHitF<600?f.lastHitBy:null;const ex=f.x,ey=f.y+f.H*.5;
  f.stats.falls++;if(killer){killer.stats.kos++;killer.score++;}else f.stats.sds++;f.score--;f.stocks--;
  if(f.held)this.release(f);if(f.holder)this.release(f.holder);if(f.item)this.dropItem(f);if(f.ledge)this.ledgeFree(f);
  for(const p of this.proj)if(p.owner===f&&p.mine)p.dead=true;
  f.st=this.mode==='stock'&&f.stocks<=0?'out':'dead';f.t=0;f.deadT=80;f.move=null;f.vanish=false;f.kx=f.ky=f.vx=f.vy=0;f.ground=null;f.combo=0;
  if(!silent)this.ev('ko',f,killer,{x:ex,y:ey});}
 revive(f){const r=this.stage.respawn;const n=this.f.length,off=(f.slot-(n-1)/2)*2.2;f.x=r[0]+off;f.y=r[1];f.vx=f.vy=f.kx=f.ky=0;f.dmg=this.sudden?300:0;f.st='revive';f.t=0;f.face=f.x>0?-1:1;f.shield=50;f.jumpsLeft=f.def.jumps;f.usedUp=f.usedSide=f.adUsed=false;f.fuel=999;f.ledgeFresh=true;f.lastHitBy=null;f.power=0;this.ev('revive',f);}
}
