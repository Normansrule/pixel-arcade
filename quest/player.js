// WILD QUEST — the Wanderer: movement (run/sprint/jump/climb/glide/swim/roll), stamina, sword/shield/bow combat, lock-on, third-person camera.
import * as THREE from '../vendor/three.module.min.js';
import {makeRig,animate,placeGear,gearPoints,makeSword} from './rig.js';
import {heightAt,gradAt,waterAt,normalAt} from './terrain.js';
import {Trail} from './fx.js';
const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a;
const angDiff=(a,b)=>{let d=b-a;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;return d;};
export const GRAV=24,WALK=6.4,SPRINT=10,JUMP=8.4,CLIMB=1.9,STEEP=1.08;
const ATK={slash1:{dur:.4,hit:.17,dmg:1,next:'slash2'},slash2:{dur:.4,hit:.17,dmg:1,next:'chop'},chop:{dur:.56,hit:.24,dmg:1.6,next:null,knock:true},spin:{dur:.6,hit:.2,dmg:2.2,next:null,knock:true,spin:true},flurry:{dur:.16,hit:.04,dmg:1.6,next:null}};
const tv=new V(),tv2=new V(),tv3=new V();

export function makePlayer(G){const rig=makeRig('hero');G.scene.add(rig.root);
 const P={rig,p:new V(),v:new V(),yaw:0,mode:'ground',hp:12,maxHp:12,tmp:0,st:100,stMax:100,ex:false,stShow:0,stDelay:0,
  arrows:20,sword:'traveler',swordMul:1,atk:null,combo:0,charge:0,block:false,blockT:9,aim:false,draw:0,lock:null,roll:null,iframe:0,hurtT:0,dead:false,deadT:0,
  climb:null,glideT:0,fallV:0,airT:0,lastSafe:new V(),safeT:0,buffs:{},inv:{},dishes:[],seeds:0,kills:0,cooked:0,falls:0,flurry:null,crouch:false,sprinting:false,loud:0,
  drawn:0,stepT:0,grounded:true,trail:new Trail(G.scene,18,new THREE.Color(1.2,1.5,1.7)),slow:0,coyote:0,jumpBuf:0,stun:0};
 G.P=P;return P;}
export function resetPlayer(G,x,y,z,yaw=0){const P=G.P;P.p.set(x,y,z);P.v.set(0,0,0);P.yaw=yaw;P.mode='ground';P.climb=null;P.atk=null;P.roll=null;P.dead=false;P.deadT=0;P.aim=false;P.draw=0;P.lock=null;P.flurry=null;P.iframe=1;P.lastSafe.set(x,y,z);
 P.rig.glider.visible=false;P.rig.root.rotation.set(0,yaw,0);P.rig.root.position.copy(P.p);G.cam.snap=true;}
function setGear(P,s,sh,b){const g=P.rig.gear;if(g.sword!==s||g.shield!==sh||g.bow!==b){g.sword=s;g.shield=sh;g.bow=b;placeGear(P.rig);}}
export function upgradeSword(G,kind='rune'){const P=G.P;P.sword=kind;P.swordMul=kind==='rune'?1.75:1;const old=P.rig.sword;old.parent&&old.parent.remove(old);P.rig.sword=makeSword(kind);placeGear(P.rig);if(kind==='rune')P.trail.col.setRGB(.6,2.2,2.6);else P.trail.col.setRGB(1.2,1.5,1.7);}
export function useStam(P,a){if(a<=0)return;P.st=Math.max(0,P.st-a);P.stDelay=.9;P.stShow=2;if(P.st<=0&&!P.ex){P.ex=true;}}

/* ================= per-step update ================= */
export function updatePlayer(G,dt,inp){const P=G.P,phys=G.phys;const rig=P.rig;
 P.blockT+=dt;P.iframe=Math.max(0,P.iframe-dt);P.hurtT=Math.max(0,P.hurtT-dt);P.loud=Math.max(0,P.loud-dt);P.stun=Math.max(0,P.stun-dt);for(const k in P.buffs){P.buffs[k]-=dt;if(P.buffs[k]<=0)delete P.buffs[k];}
 if(P.dead){P.deadT+=dt;P.v.x*=.9;P.v.z*=.9;animate(rig,{mode:'dead',dp:Math.min(1,P.deadT*2),t:G.time},dt);rig.root.position.copy(P.p);return;}
 // camera-relative input
 const cy=G.cam.yaw,fx=Math.sin(cy),fz=Math.cos(cy),rx=-fz,rz=fx;let ix=inp.mx,iy=inp.my;const im=Math.min(1,Math.hypot(ix,iy));
 let wx=fx*iy+rx*ix,wz=fz*iy+rz*ix;const wl=Math.hypot(wx,wz);if(wl>1e-4){wx/=wl;wz/=wl;}
 const speedBuff=P.buffs.speed?1.3:1;
 // stamina regen
 P.stDelay-=dt;if(P.stDelay<=0&&(P.mode==='ground')){P.st=Math.min(P.stMax,P.st+dt*(P.ex?30:48));if(P.ex&&P.st>=P.stMax)P.ex=false;}
 if(P.st<P.stMax||P.ex)P.stShow=1.2;else P.stShow=Math.max(0,P.stShow-dt);
 // lock-on validity
 if(P.lock&&(P.lock.dead||P.lock.p.distanceTo(P.p)>32||G.room))P.lock=null;
 // aim / bow
 const canAim=!P.climb&&P.mode!=='swim'&&P.mode!=='glide'&&!P.roll&&!P.flurry;P.aim=inp.aim&&canAim&&P.stun<=0;
 if(P.aim){if(P.draw===0)G.snd.play('draw');P.draw=Math.min(1,P.draw+dt/.45/Math.max(G.timeScale,.3));}else P.draw=0;
 if(P.aim&&inp.fire&&P.draw>.35){if(P.arrows>0){shoot(G);P.draw=.05;}else G.toast('No arrows!','');}
 P.slow=P.aim&&P.mode==='air'&&!P.ex&&P.st>0?1:0;if(P.slow)useStam(P,dt/Math.max(.2,G.timeScale)*22);
 // shield
 const wantBlock=inp.block&&!P.climb&&P.mode!=='swim'&&P.mode!=='glide'&&!P.aim&&!P.roll;if(wantBlock&&!P.block){P.blockT=0;}P.block=wantBlock&&P.stun<=0;
 // gear placement
 const combat=P.atk||P.block||P.lock||P.drawn>0;if(P.atk||P.block||P.lock)P.drawn=4;else P.drawn=Math.max(0,P.drawn-dt);
 if(P.aim)setGear(P,'back','back','hand');else if(P.climb||P.mode==='glide'||P.mode==='swim')setGear(P,'back','back','back');else if(combat)setGear(P,'hand','hand','back');else setGear(P,'back','back','back');
 // attacks
 updateAttack(G,dt,inp,wx,wz,wl);
 // dodge / roll
 if(inp.roll&&!P.roll&&!P.climb&&(P.mode==='ground')&&!P.aim&&P.stun<=0){startRoll(G,wl>.1?{x:wx,z:wz}:{x:Math.sin(P.yaw),z:Math.cos(P.yaw)},'fwd');}
 if(P.lock&&inp.jumpEdge&&P.mode==='ground'&&!P.roll&&!P.atk){// sidehop / backflip while locked on
  const ax=inp.mx,ay=inp.my;const dir=Math.abs(ax)>.3?(ax>0?'right':'left'):'back';const s=dir==='back'?-1:0;const hx=dir==='back'?-Math.sin(P.yaw):(dir==='right'?-Math.cos(P.yaw):Math.cos(P.yaw)),hz=dir==='back'?-Math.cos(P.yaw):(dir==='right'?Math.sin(P.yaw):-Math.sin(P.yaw));
  startRoll(G,{x:hx,z:hz},dir);inp.jumpEdge=false;}
 if(P.roll){P.roll.t+=dt;const r=P.roll;const k=r.t/r.dur;const sp=(r.dir==='fwd'?10:9)*(1-k*.5);P.v.x=r.x*sp;P.v.z=r.z*sp;if(r.dir!=='fwd'&&r.t<.06)P.v.y=r.dir==='back'?5:3.5;if(r.t>=r.dur){P.roll=null;}}
 /* ---------- locomotion by mode ---------- */
 const wlv=waterAt(P.p.x,P.p.z);
 if(P.mode==='climb')climbStep(G,dt,inp);
 else if(P.mode==='swim'){const sp=(inp.sprint&&!P.ex?5.2:2.6)*speedBuff;if(inp.sprint&&!P.ex&&wl>.1)useStam(P,dt*20);else if(P.st<P.stMax&&!P.ex){P.stDelay=Math.min(P.stDelay,0);P.st=Math.min(P.stMax,P.st+dt*10);if(P.ex&&P.st>=P.stMax)P.ex=false;}
  P.v.x+=(wx*sp*im-P.v.x)*Math.min(1,dt*3);P.v.z+=(wz*sp*im-P.v.z)*Math.min(1,dt*3);P.p.x+=P.v.x*dt;P.p.z+=P.v.z*dt;P.p.y+=(wlv-.6-P.p.y)*Math.min(1,dt*6);P.v.y=0;
  if(wl>.1)P.yaw+=angDiff(P.yaw,Math.atan2(wx,wz))*Math.min(1,dt*6);
  phys.push(P.p,.4,1.7,.55);const gh=ground(G);if(wlv-gh<1.05){P.mode='ground';P.p.y=gh;}
  if(P.ex&&!P.drown){P.drown=1.2;}if(P.drown){P.drown-=dt;if(P.drown<=0){P.drown=0;G.drowned();}}
  if(Math.random()<dt*(.5+P.v.length()*.6))G.splash(P.p.x+Math.sin(P.yaw)*.6,wlv,P.p.z+Math.cos(P.yaw)*.6,2);}
 else if(P.mode==='glide'){if(!inp.glideHold&&inp.jumpEdge){closeGlider(G);}else{
   const sp=7.4*speedBuff;P.v.x+=(wx*sp*Math.max(.55,im)+Math.sin(P.yaw)*sp*(im<.1?.6:0)-P.v.x)*Math.min(1,dt*1.6);P.v.z+=(wz*sp*Math.max(.55,im)+Math.cos(P.yaw)*sp*(im<.1?.6:0)-P.v.z)*Math.min(1,dt*1.6);
   const up=G.updraft(P.p);if(up)P.v.y=Math.min(9,P.v.y+dt*24);else P.v.y=Math.max(-2.6,P.v.y-GRAV*dt*.5);
   if(wl>.1){const ny=Math.atan2(wx,wz);const d=angDiff(P.yaw,ny);P.yaw+=d*Math.min(1,dt*2.5);P.bank=cl(-d*.6,-.4,.4);}else P.bank*=.9;
   useStam(P,dt*7);if(P.st<=0)closeGlider(G);P.glideT+=dt;
   moveCollide(G,dt);}}
 else{// ground / air
  const onG=P.mode==='ground';const sprinting=inp.sprint&&!P.ex&&wl>.1&&onG&&!P.block&&!P.aim&&!P.atk;P.sprinting=sprinting;if(sprinting)useStam(P,dt*20);
  let sp=(sprinting?SPRINT:WALK*(inp.walk?.45:1))*speedBuff*im;if(P.block)sp*=.45;if(P.aim)sp*=.5;if(P.atk&&!P.flurry)sp*=.15;if(P.stun>0)sp=0;if(P.ex)sp=Math.min(sp,3.2);
  if(!P.roll){if(P.atk&&P.atk.lunge>0){P.v.x+=(Math.sin(P.yaw)*P.atk.lunge-P.v.x)*Math.min(1,dt*12);P.v.z+=(Math.cos(P.yaw)*P.atk.lunge-P.v.z)*Math.min(1,dt*12);}
   else{const acc=onG?(wl>.1?14:18):3.2;P.v.x+=(wx*sp-P.v.x)*Math.min(1,dt*acc);P.v.z+=(wz*sp-P.v.z)*Math.min(1,dt*acc);}}
  // facing
  if(P.lock&&!P.roll){P.yaw+=angDiff(P.yaw,Math.atan2(P.lock.p.x-P.p.x,P.lock.p.z-P.p.z))*Math.min(1,dt*12);}
  else if(P.aim){P.yaw+=angDiff(P.yaw,G.cam.yaw)*Math.min(1,dt*20);}
  else if(P.block&&!P.atk){let t=null,bd=9;for(const e of G.enemies){if(e.dead||!e.aware)continue;const d=e.p.distanceTo(P.p);if(d<bd){bd=d;t=e;}}const a=t?Math.atan2(t.p.x-P.p.x,t.p.z-P.p.z):G.cam.yaw;P.yaw+=angDiff(P.yaw,a)*Math.min(1,dt*14);}
  else if(wl>.1&&!P.atk&&!P.roll&&P.stun<=0)P.yaw+=angDiff(P.yaw,Math.atan2(wx,wz))*Math.min(1,dt*(onG?14:5));
  // jump / glide
  P.coyote=onG?.12:Math.max(0,P.coyote-dt);P.jumpBuf=inp.jumpEdge?.15:Math.max(0,P.jumpBuf-dt);
  if(P.jumpBuf>0&&P.coyote>0&&!P.lock&&!P.roll&&!P.atk&&P.stun<=0){P.v.y=JUMP;P.mode='air';P.coyote=0;P.jumpBuf=0;G.snd.play('jump');P.airT=0;P.loud=.3;}
  else if(inp.jumpEdge&&P.mode==='air'&&P.airT>.18&&!P.ex&&P.st>0&&!P.aim&&P.p.y-ground(G)>1.6){openGlider(G);}
  // slopes too steep to stand on: slide
  if(onG){const g=gradAt(P.p.x,P.p.z),s=Math.hypot(g.x,g.z);if(s>STEEP+.12&&!onBox(G)){P.v.x-=g.x/s*dt*14;P.v.z-=g.z/s*dt*14;}}
  if(P.mode==='air'){P.v.y-=GRAV*dt;P.airT+=dt;P.fallV=Math.min(P.fallV,P.v.y);}
  moveCollide(G,dt,wx,wz,wl,inp);
  // water
  const gh2=ground(G);if(wlv-gh2>1.3&&P.p.y<wlv-1.0&&P.mode!=='climb'){if(P.mode==='air'&&P.fallV<-6)G.splash(P.p.x,wlv,P.p.z,30);P.mode='swim';P.v.y=0;P.fallV=0;P.atk=null;P.aim=false;P.lock=null;G.snd.play('land',.4);}}
 if(P.mode==='ground'&&!P.roll){P.safeT+=dt;if(P.safeT>1&&waterAt(P.p.x,P.p.z)<P.p.y-.2&&!G.room){P.lastSafe.copy(P.p);P.safeT=0;}}
 // fall into the void (shrines)
 if(G.room&&P.p.y<-8)G.voidFall();
 /* ---------- animation ---------- */
 const hsp=Math.hypot(P.v.x,P.v.z);
 const st={t:G.time,speed:P.mode==='climb'?0:hsp,vy:P.v.y,sprint:P.sprinting,block:P.block&&!P.atk,aim:P.aim?P.draw:0,pitch:P.aim?-G.cam.pitch:0,hurt:P.hurtT*2.5,atk:P.atk?{name:P.atk.name==='flurry'?(P.atk.alt?'slash2':'slash1'):P.atk.name,p:P.atk.t/P.atk.dur}:null,crouch:P.crouch,bank:P.bank};
 st.mode=P.roll?'roll':P.mode==='climb'?'climb':P.mode==='glide'?'glide':P.mode==='swim'?'swim':P.mode==='air'?'air':(hsp>.3?'move':'idle');if(P.roll)st.roll={p:P.roll.t/P.roll.dur,dir:P.roll.dir};if(P.mode==='climb')st.cmove=P.climb.mv;
 if(P.charge>.05&&!P.atk){st.atk={name:'spin',p:0};}
 animate(rig,st,dt);
 rig.root.position.copy(P.p);if(P.mode==='climb'){rig.root.position.x+=P.climb.nx*.32;rig.root.position.z+=P.climb.nz*.32;rig.root.position.y-=.05;}
 rig.root.rotation.y=P.yaw+(P.atk&&P.atk.name==='spin'?P.atk.t/P.atk.dur*Math.PI*2:0);
 if(P.mode==='swim')rig.root.position.y+=Math.sin(G.time*3)*.04;
 rig.glider.scale.setScalar(P.mode==='glide'?Math.min(1,P.glideT*6):1);
 // footsteps
 if(P.mode==='ground'&&hsp>1){P.stepT-=dt*hsp/(P.sprinting?2.6:2);if(P.stepT<=0){P.stepT=1;G.snd.play('step',G.room?2:1);if(P.sprinting)G.dust(P.p.x,P.p.y,P.p.z,3,true);}}
 // sword trail
 gearPoints(rig.sword,tv,tv2);P.trail.push(tv,tv2,!!P.atk&&P.atk.t>P.atk.dur*.15&&P.atk.t<P.atk.dur*.8&&rig.gear.sword==='hand',dt);}

function ground(G){return G.phys.ground(G.P.p.x,G.P.p.y,G.P.p.z,.4,.6).h;}
function onBox(G){return !!G.phys.ground(G.P.p.x,G.P.p.y,G.P.p.z,.4,.6).o;}
function openGlider(G){const P=G.P;P.mode='glide';P.glideT=0;P.rig.glider.visible=true;P.v.y=Math.max(P.v.y,-1);G.snd.play('glide');P.atk=null;}
function closeGlider(G){const P=G.P;P.mode='air';P.rig.glider.visible=false;P.fallV=0;P.airT=1;}
function startRoll(G,d,dir){const P=G.P;P.roll={t:0,dur:dir==='back'?.5:dir==='fwd'?.45:.38,x:d.x,z:d.z,dir};P.iframe=Math.max(P.iframe,.32);P.dodgeT=0;P.atk=null;P.charge=0;G.snd.play('jump');if(dir==='fwd')P.yaw=Math.atan2(d.x,d.z);P.lastDodge=G.time;}

/* horizontal + vertical movement with terrain/colliders, climb triggers, landing */
function moveCollide(G,dt,wx=0,wz=0,wl=0,inp={}){const P=G.P,phys=G.phys;const ox=P.p.x,oz=P.p.z;
 P.p.x+=P.v.x*dt;P.p.z+=P.v.z*dt;
 // steep terrain acts as a wall (and a climbing surface)
 if(phys.terrainOn(P.p.x,P.p.z)&&P.mode!=='glide'||P.mode==='glide'){const h=heightAt(P.p.x,P.p.z);if(h>P.p.y+.45&&P.mode!=='swim'){const g=gradAt(P.p.x,P.p.z),s=Math.hypot(g.x,g.z);if(s>STEEP&&!G.room){
   if(wl>.1&&(-g.x*wx-g.z*wz)/s<-.35&&!P.ex&&P.st>0&&!P.aim&&!P.block&&!P.atk){startClimb(G,{t:'terrain'});return;}
   P.p.x=ox;P.p.z=oz;const vn=(P.v.x*g.x+P.v.z*g.z)/s;if(vn>0){P.v.x-=vn*g.x/s;P.v.z-=vn*g.z/s;}}}}
 const hit=phys.push(P.p,.4,1.75,.55);
 if(hit.o){if(hit.o.tag==='cube'&&G.room&&G.room.push){G.room.push(hit.o,-hit.nx,-hit.nz,dt);}
  if(hit.o.climb&&wl>.1&&(wx*hit.nx+wz*hit.nz)<-.55&&hit.o.y1>P.p.y+1.1&&!P.ex&&P.st>0&&!P.aim&&!P.block&&!P.atk&&P.mode!=='swim'){startClimb(G,{t:'obj',o:hit.o,nx:hit.nx,nz:hit.nz});return;}
  if(hit.o.tag==='barrier'&&!G.barrierToastT){G.barrierToastT=4;G.toast('A searing barrier seals the Keep.','');G.hurtPlayer(1,null,'barrier',{from:new V(hit.o.x,P.p.y,hit.o.z),knock:9});}}
 // vertical
 const gr=phys.ground(P.p.x,P.p.y,P.p.z,.4,P.mode==='ground'?.6:.3);
 if(P.mode!=='glide'||true){if(P.mode==='glide'){P.p.y+=P.v.y*dt;if(P.p.y<=gr.h){P.p.y=gr.h;closeGlider(G);P.mode='ground';G.snd.play('land',.6);P.fallV=0;}}
  else{P.p.y+=P.v.y*dt;const ceil=phys.ceiling(P.p.x,P.p.y,P.p.z,.35,P.p.y+1.8);if(P.p.y+1.8>ceil&&P.v.y>0){P.p.y=ceil-1.8;P.v.y=0;}
   if(P.p.y<=gr.h+.02){const wasAir=P.mode==='air';P.p.y=gr.h;if(P.v.y<0)P.v.y=0;if(wasAir){landed(G);}P.mode='ground';if(gr.o&&gr.o.dyn&&gr.o.vy)P.p.y+=0;}
   else if(P.mode==='ground'){// stick to slopes when walking down, else start falling
    if(P.p.y-gr.h<.45&&P.v.y<=0){P.p.y=gr.h;}else{P.mode='air';P.airT=0;P.fallV=0;}}}}}
function landed(G){const P=G.P;const v=-P.fallV;P.fallV=0;if(v>5)G.snd.play('land',v/12);if(v>8)G.dust(P.p.x,P.p.y,P.p.z,Math.min(30,v*1.5|0));
 if(v>20&&!G.room){const dmg=v>33?40:Math.ceil((v-20)/3)*2;G.hurtPlayer(dmg,null,'fall');}}

/* ================= climbing ================= */
function startClimb(G,c){const P=G.P;P.mode='climb';P.climb={...c,mv:0,slipT:0};P.v.set(0,0,0);P.aim=false;P.atk=null;P.lock=null;P.rig.glider.visible=false;
 if(c.t==='terrain'){const g=gradAt(P.p.x,P.p.z),s=Math.hypot(g.x,g.z)||1;P.climb.nx=-g.x/s;P.climb.nz=-g.z/s;}P.yaw=Math.atan2(-P.climb.nx,-P.climb.nz);}
function climbStep(G,dt,inp){const P=G.P,c=P.climb,phys=G.phys;let ix=inp.mx,iy=inp.my;
 const moving=Math.abs(ix)>.1||Math.abs(iy)>.1;c.mv=moving?1:0;
 if(inp.letGo||P.st<=0){P.mode='air';P.climb=null;P.v.set(c.nx*2,0,c.nz*2);P.airT=.5;P.fallV=0;if(P.st<=0)G.toast('Out of stamina!','');return;}
 useStam(P,dt*(moving?10:2.2));
 let jump=0;if(inp.jumpEdge&&P.st>0){useStam(P,22);jump=.38;G.snd.play('jump');}if(jump)c.jumpT=jump;if(c.jumpT>0){c.jumpT-=dt;iy=Math.max(iy,0)+3.6;}
 // rain makes walls slippery
 if(G.rain>.5){c.slipT-=dt;if(c.slipT<=0){c.slipT=1.2+rnd(1.2);if(Math.random()<.5){c.slip=.4;G.toast('Slipping in the rain…','');}}}if(c.slip>0){c.slip-=dt;iy=-1.6;}
 const sp=CLIMB*(P.buffs.speed?1.25:1);
 if(c.t==='terrain'){const g=gradAt(P.p.x,P.p.z),s=Math.hypot(g.x,g.z);if(s<.6){P.mode='ground';P.climb=null;return;}
  const ux=g.x/s,uz=g.z/s,rxx=-uz,rzz=ux;const k=1/Math.sqrt(1+s*s);
  P.p.x+=(ux*iy*sp*k*1.4+(-rxx)*ix*sp*.8)*dt;P.p.z+=(uz*iy*sp*k*1.4+(-rzz)*ix*sp*.8)*dt;
  P.p.y=heightAt(P.p.x,P.p.z);c.nx+=(-ux-c.nx)*Math.min(1,dt*8);c.nz+=(-uz-c.nz)*Math.min(1,dt*8);P.yaw=Math.atan2(-c.nx,-c.nz);
  const g2=gradAt(P.p.x,P.p.z),s2=Math.hypot(g2.x,g2.z);
  if(s2<STEEP-.05){if(iy>0){P.p.x+=ux*.35;P.p.z+=uz*.35;P.p.y=heightAt(P.p.x,P.p.z);}P.mode='ground';P.climb=null;G.snd.play('step');}
  if(P.p.y<waterAt(P.p.x,P.p.z)-.6){P.mode='ground';P.climb=null;}}
 else{const o=c.o;if(o.t==='c'){const dx=P.p.x-o.x,dz=P.p.z-o.z,d=Math.hypot(dx,dz)||1;c.nx=dx/d;c.nz=dz/d;}
  const rxx=c.nz,rzz=-c.nx;// right along the face
  P.p.y+=iy*sp*dt;P.p.x+=rxx*ix*sp*.8*dt;P.p.z+=rzz*ix*sp*.8*dt;
  if(o.t==='b'){if(c.nx>.5)P.p.x=o.x1+.4;else if(c.nx<-.5)P.p.x=o.x0-.4;else P.p.x=cl(P.p.x,o.x0-.2,o.x1+.2);if(c.nz>.5)P.p.z=o.z1+.4;else if(c.nz<-.5)P.p.z=o.z0-.4;else P.p.z=cl(P.p.z,o.z0-.2,o.z1+.2);}
  else{const dx=P.p.x-o.x,dz=P.p.z-o.z,d=Math.hypot(dx,dz)||1;P.p.x=o.x+dx/d*(o.r+.4);P.p.z=o.z+dz/d*(o.r+.4);}
  P.yaw=Math.atan2(-c.nx,-c.nz);
  if(P.p.y>=o.y1-.25){// mantle
   P.p.y=o.y1;P.p.x-=c.nx*.75;P.p.z-=c.nz*.75;if(o.t==='c'){const dx=P.p.x-o.x,dz=P.p.z-o.z,d=Math.hypot(dx,dz);if(d>o.r*.7){P.p.x=o.x+dx/d*o.r*.5;P.p.z=o.z+dz/d*o.r*.5;}}P.mode='ground';P.climb=null;G.snd.play('step');return;}
  const gh=phys.ground(P.p.x,P.p.y,P.p.z,.3,.05).h;if(P.p.y<=gh+.02&&iy<0){P.p.y=gh;P.mode='ground';P.climb=null;return;}}}

/* ================= combat ================= */
function updateAttack(G,dt,inp,wx,wz,wl){const P=G.P;
 if(P.flurry){P.flurry.t-=dt/Math.max(.05,G.timeScale);if(P.flurry.t<=0||P.flurry.target.dead){P.flurry=null;G.setFlurry(false);}}
 const canAtk=!P.climb&&P.mode!=='swim'&&P.mode!=='glide'&&!P.roll&&!P.aim&&P.stun<=0;
 if(inp.atkEdge&&canAtk){if(P.flurry){if(!P.atk||P.atk.t>P.atk.dur*.5)startAtk(G,'flurry');}
  else if(!P.atk)startAtk(G,P.mode==='air'?'chop':'slash1');else if(P.atk.t>P.atk.dur*.35&&ATK[P.atk.name].next)P.atk.queued=true;}
 // hold to charge a spin
 if(inp.atkHeld&&canAtk&&!P.flurry&&(!P.atk||P.atk.t>P.atk.dur*.9)&&P.mode==='ground'&&!P.ex){P.charge+=dt;if(P.charge>.25){P.atk=null;useStam(P,dt*14);if(P.charge>.4&&Math.random()<.4)G.parts.emit(P.p.x+rnd(1)-.5,P.p.y+1+rnd(.5),P.p.z+rnd(1)-.5,0,1,0,1,1.6,2,.2,.4);}}
 else{if(P.charge>.6&&canAtk&&!P.ex)startAtk(G,'spin');P.charge=0;}
 if(!P.atk)return;const a=P.atk,A=ATK[a.name];a.t+=dt;a.lunge=a.t<A.dur*.4?(a.name==='flurry'?0:a.name==='chop'?4:3):0;
 if(!a.hitDone&&a.t>=A.hit){a.hitDone=true;meleeHit(G,a,A);}
 if(a.t>=A.dur){if(a.queued&&A.next){startAtk(G,A.next);}else{P.atk=null;}}}
function startAtk(G,name){const P=G.P;P.atk={name,t:0,dur:ATK[name].dur,hitDone:false,queued:false,alt:!(P.atk&&P.atk.alt)};G.snd.play('swing');P.drawn=4;P.loud=.5;
 // aim the swing: at lock target, else nearest enemy ahead, else input
 let tgt=P.lock||P.flurry?.target;if(!tgt){let best=null,bd=4.5;for(const e of G.enemies){if(e.dead||e.state==='intro'||e.state==='dormant')continue;const d=e.p.distanceTo(P.p)-e.K.r;if(d<bd){bd=d;best=e;}}tgt=best;}
 if(tgt){P.yaw=Math.atan2(tgt.p.x-P.p.x,tgt.p.z-P.p.z);if(name==='flurry'){const d=tgt.p.distanceTo(P.p);const want=tgt.K.r+1.2;if(d>want){const k=(d-want)/d;P.p.x+=(tgt.p.x-P.p.x)*k;P.p.z+=(tgt.p.z-P.p.z)*k;}G.parts.burst(tv.set(P.p.x,P.p.y+1,P.p.z),20,4,new THREE.Color(.6,1.6,2.4),.3,.3,{});}}}
function meleeHit(G,a,A){const P=G.P;const f=Math.sin(P.yaw),c=Math.cos(P.yaw);const reach=A.spin?3.4:2.7;let any=false;
 const mul=P.swordMul*(P.buffs.attack?1.5:1);const base=12;
 for(const e of G.enemies){if(e.dead||e.state==='intro'||(e.kind==='boss'&&e.state==='rise'))continue;const dx=e.p.x-P.p.x,dz=e.p.z-P.p.z,d=Math.hypot(dx,dz)-e.K.r*.8;if(d>reach||Math.abs(e.p.y-P.p.y)>2.6+(e.K.bodyY))continue;
  const fw=(dx*f+dz*c)/Math.max(.01,Math.hypot(dx,dz));if(!A.spin&&fw<.25&&d>.6)continue;
  let dmg=base*A.dmg*mul;let sneak=false;if(e.dormant===undefined&&(e.sleeping||(!e.aware&&e.alert<.5))&&(e.kind==='grunt'||e.kind==='archer')){dmg*=4;sneak=true;}
  if(e.stun>0||e.state==='stunned')dmg*=1.6;
  G.damageEnemy(e,Math.round(dmg),{dir:new V(f,0,c),kind:'sword',knock:A.knock||sneak,sneak,flurry:a.name==='flurry'});any=true;}
 // shrine puzzle objects
 if(G.room&&G.room.hit){tv3.set(P.p.x+f*1.4,P.p.y+1,P.p.z+c*1.4);if(G.room.hit(tv3,'sword',new V(f,0,c)))any=true;}
 if(any){G.hitstop(a.name==='chop'||a.name==='spin'?.07:.04);}}
function shoot(G){const P=G.P;P.arrows--;G.snd.play('shoot');P.loud=.4;
 const cam=G.camera;const dir=new V();cam.getWorldDirection(dir);const o=cam.position.clone();
 // find what the crosshair points at
 let t=200;const tt=G.phys.ray(o.x,o.y,o.z,dir.x,dir.y,dir.z,200);t=Math.min(t,tt);const tr=G.phys.terrainRay(o.x,o.y,o.z,dir.x,dir.y,dir.z,Math.min(t,200),1);t=Math.min(t,tr);
 for(const e of G.enemies){if(e.dead)continue;tv.set(e.p.x,e.p.y+e.K.bodyY,e.p.z).sub(o);const along=tv.dot(dir);if(along<0||along>t)continue;const perp=tv.addScaledVector(dir,-along).length();if(perp<e.K.bodyR)t=along;}
 const target=o.clone().addScaledVector(dir,t);const src=new V(P.p.x+Math.sin(P.yaw)*.4,P.p.y+1.45,P.p.z+Math.cos(P.yaw)*.4);
 const v=target.sub(src);const L=v.length();v.normalize().multiplyScalar(58);v.y+=5*L/58*.5;G.proj.spawn('arrow',src,v,'player',Math.round(15*(.6+.4*P.draw)*(P.buffs.attack?1.3:1)),null);}

/* ================= camera ================= */
export function makeCam(){return{yaw:Math.PI,pitch:.22,dist:5.2,pos:new V(),look:new V(),fov:62,shake:0,snap:true,zoom:1,lockBlend:0};}
export function updateCamera(G,dt){const P=G.P,C=G.cam,cam=G.camera;const aim=P.aim;
 if(P.lock&&!aim){const a=Math.atan2(P.lock.p.x-P.p.x,P.lock.p.z-P.p.z);C.yaw+=angDiff(C.yaw,a)*Math.min(1,dt*5);C.pitch+=(.28-C.pitch)*Math.min(1,dt*3);}
 const dist=(aim?2.9:P.mode==='glide'?6.8:P.mode==='climb'?6:P.lock?6.2:5.2)*C.zoom*(G.room?.9:1);C.dist+=(dist-C.dist)*Math.min(1,dt*6);
 const tgt=tv.set(P.p.x,P.p.y+(P.mode==='swim'?1.0:1.55),P.p.z);if(P.mode==='climb'){tgt.x+=P.climb.nx*.6;tgt.z+=P.climb.nz*.6;}
 if(aim){tgt.x+=-Math.cos(C.yaw)*.95;tgt.z+=Math.sin(C.yaw)*.95;tgt.y+=.3;}
 const cp=Math.cos(C.pitch),sp=Math.sin(C.pitch);const dir=tv2.set(-Math.sin(C.yaw)*cp,sp,-Math.cos(C.yaw)*cp);
 // pull in against walls / terrain
 const filt=o=>!(o.tag==='barrier')&&!(['tree','rock','tent','crate'].includes(o.tag)&&!G.room);
 let d=C.dist;const tr=G.phys.ray(tgt.x,tgt.y,tgt.z,dir.x,dir.y,dir.z,d,filt);if(tr<d)d=Math.max(.6,tr-.25);
 // blocked close behind: try lifting the camera over the obstacle
 C.lift=C.lift||0;let lift=0;if(d<C.dist*.55&&!aim){for(const L of[.5,.9]){const p2=C.pitch+L,c2=Math.cos(p2),s2=Math.sin(p2);const t2=G.phys.ray(tgt.x,tgt.y,tgt.z,-Math.sin(C.yaw)*c2,s2,-Math.cos(C.yaw)*c2,C.dist,filt);if(t2>=C.dist*.9){lift=L;break;}}}
 C.lift+=(lift-C.lift)*Math.min(1,dt*4);if(C.lift>.02){const p2=C.pitch+C.lift,c2=Math.cos(p2),s2=Math.sin(p2);dir.set(-Math.sin(C.yaw)*c2,s2,-Math.cos(C.yaw)*c2);d=C.dist;const t3=G.phys.ray(tgt.x,tgt.y,tgt.z,dir.x,dir.y,dir.z,d,filt);if(t3<d)d=Math.max(.6,t3-.25);}
 const ttr=G.phys.terrainRay(tgt.x,tgt.y,tgt.z,dir.x,dir.y,dir.z,d,.35);if(ttr<d)d=Math.max(.6,ttr-.3);
 const want=tv3.copy(tgt).addScaledVector(dir,d);if(G.phys.terrainOn(want.x,want.z)&&!G.room){const h=heightAt(want.x,want.z)+.45;if(want.y<h)want.y=h;}
 if(C.snap){C.pos.copy(want);C.look.copy(tgt);C.snap=false;}else{C.pos.lerp(want,Math.min(1,dt*(aim?30:16)));C.look.lerp(tgt,Math.min(1,dt*(aim?30:18)));}
 const fov=(aim?46:P.mode==='glide'?68:P.sprinting?66:62)+(P.flurry?-6:0);C.fov+=(fov-C.fov)*Math.min(1,dt*5);cam.fov=C.fov;
 cam.position.copy(C.pos);C.shake=Math.max(0,C.shake-dt*2.2);const s=C.shake*C.shake*.5;cam.position.x+=(Math.random()-.5)*s;cam.position.y+=(Math.random()-.5)*s;cam.position.z+=(Math.random()-.5)*s;
 P.rig.root.visible=C.pos.distanceTo(tgt)>1.05||P.dead;
 if(aim){// look straight down the camera direction so the crosshair is exact
  cam.lookAt(tv.copy(C.pos).addScaledVector(dir,-10));}else cam.lookAt(C.look);
 cam.updateProjectionMatrix();}
