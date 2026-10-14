// STARFALL VANGUARD — a three-mission sci-fi story campaign on a ring-world. Original game for Pixel Arcade.
// Vanguard-09 + a CPU marine squad vs the Kyrr (Skitters, Wardens, Ravagers, turrets, Overseer Vash). Recharging shields + health,
// human ballistic and Kyrr energy weapons (heat/battery), frag + pulse charges, melee, weapon pickup/swap, a turret buggy and a
// hover tank, radio story beats, objectives, checkpoints, per-mission time limits, mission + campaign results.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,cl,rnd,wrapA,damp,fmt} from './util.js';
import {MISSIONS,buildMission,SQUAD,SPEAK} from './missions.js';
import {PHY} from './world.js';
import {buildScene,turretModel,landerModel} from './scene.js';
import {Actor3D} from './actors.js';
import {WPN,NADE,PICKABLE,freshWeapon,ammoLeft,gunModel,Viewmodel} from './weapons.js';
import {Vehicle,VSPEC} from './vehicles.js';
import {Particles,Beams,Shocks,Decals,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {DIFF,MARINE_AI,KIND,newBrain,think} from './ai.js';
import {HUD} from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),C=(r,g,b)=>new THREE.Color(r,g,b);
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);
const DMUL=[.75,1,1.4,1.9];

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(78,1,.08,12000);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xfff0e0,0x302820,.6),vmKey=new THREE.DirectionalLight(0xffffff,1.1),vmRim=new THREE.DirectionalLight(0xffc080,.6);vmKey.position.set(-1,2,1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmRim);
const VM=new Viewmodel(vmCam);const snd=new Sound();
const parts=new Particles(scene,5000),smoke=new Particles(scene,1800,true),beams=new Beams(scene,160),shocks=new Shocks(scene,10),decals=new Decals(scene,160),lights=new LightPool(scene,5);
// energy bolts: one instanced mesh of stretched glowing spheres
const MAXB=320,boltMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(.13,10,8),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}),MAXB);
boltMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);boltMesh.frustumCulled=false;boltMesh.setColorAt(0,new THREE.Color());boltMesh.count=0;boltMesh.renderOrder=6;scene.add(boltMesh);

/* ================= state ================= */
const G={app:'menu',phase:'play',opt:{diff:1,mis:0,sens:1,fov:90,vol:.8,mus:.6},actors:[],me:null,vehicles:[],items:[],proj:[],bolts:[],landers:[],time:0,clock:600,mi:0,D:null,W:null,S:null,def:MISSIONS[0],
 stepI:-1,step:null,stepT:0,f:{},mark:null,progress:0,cp:null,boss:null,stats:null,camp:null,results:null,hurtFx:0,shake:0,noise:null,timeScale:1,deadT:0,endT:0,attract:true,camYaw:0,camPitch:0,emitT:0,squadGoal:null,mres:null};
const saveOpt=stored('pxd_starfall_opt',G.opt);
G.sfx=(k,p)=>snd.play(k,p||null);G.mePos=()=>G.me?G.me.pos:new V();
const hud=new HUD(G);

/* ================= mission loading ================= */
let mcache={};
function loadMission(i){const def=MISSIONS[i];if(G.S)scene.remove(G.S.root);let m=mcache[i];if(!m){const D=buildMission(def);const S=buildScene(D,R,gfx);m=mcache={};m=mcache[i]={D,S};}
 // missions are rebuilt per load (state such as doors and barriers is consumed); keep cache to the current one only
 G.D=m.D;G.W=m.D.W;G.S=m.S;G.def=def;G.mi=i;scene.add(m.S.root);scene.environment=m.S.env;vmScene.environment=m.S.env;scene.fog=m.S.fog;scene.background=m.S.bg;fxStack=null;R.shadowMap.needsUpdate=true;
 applyGfxToScene();snd.ambience(def.theme);}
function freshMission(i){delete mcache[i];mcache={};loadMission(i);}
function applyGfxToScene(){const S=G.S;if(!S)return;S.sun.castShadow=gfx>0;if(S.grass)S.grass.visible=gfx>0;S.pls.forEach((p,i)=>p.visible=gfx>0||i<3);}

/* ================= actors ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,sprint:false,fire:false,zoom:false,reload:false,melee:false,nade:false,swap:false,interact:false,crouch:false});
class TurretRig{constructor(){const m=turretModel();this.root=m;this.body=m;this.head=m.userData.head;this.dead=null;this.gunMount=this.head;this.scale=1;this.SU={uHit:{value:0}};}
 setGun(){}hit(){}pose(f,dt){this.root.position.copy(f.pos);if(this.dead){this.dead.t+=dt;this.head.rotation.x=damp(this.head.rotation.x,.9,3,dt);this.root.visible=this.dead.t<8;return;}this.head.rotation.set(-f.pitch,f.yaw,0,'YXZ');}
 kill(){this.dead={t:0};}revive(){this.dead=null;}}
function makeActor(kind,team,o={}){const K=KIND[kind];const dm=DIFF[G.opt.diff];const hpM=team===1?dm.hp:1;
 const a={kind,K,team,name:o.name||K.name||kind.toUpperCase(),human:!!o.human,squad:!!o.squad,pos:new V(),vel:new V(),yaw:o.yaw||0,pitch:0,r:K.r,h:K.h,onGround:false,inp:blankInput(),alive:true,
  maxHp:K.hp*hpM,health:K.hp*hpM,maxSh:K.sh*hpM,shield:K.sh*hpM,shDelay:0,weapons:[],wi:0,nades:team===0?{frag:o.human?2:2,stick:o.human?1:0}:{frag:0,stick:kind==='skitter'||kind.startsWith('warden')?1:0},nadeSel:'frag',
  fireCD:0,burstLeft:0,burstT:0,reloadT:0,swapT:0,swapMid:false,meleeT:0,meleeCD:0,nadeCD:0,zoom:0,spread:.01,lastFire:-9,recoil:0,lastHitBy:null,lastHitT:-9,group:o.group||null,home:o.home||null,leash:o.leash,flee:0,crouch:false,veh:null,seat:null,landDip:0,swapHold:0,stepT:0,
  scale:1,over:0,stats:{shots:0,hits:0},guns:{},deadT:0};
 a.model=kind==='turret'?new TurretRig():new Actor3D(kind);a.scale=a.model.scale||1;scene.add(a.model.root);
 if(!o.human){const base=team===0?MARINE_AI:dm;a.ai=newBrain(base);a.ai.alert=!!o.alert;}
 const w=o.w||K.w;if(w){a.weapons.push(freshWeapon(w));setWeapon(a,0);}if(o.w2)a.weapons.push(freshWeapon(o.w2));
 if(team===1&&!o.human)a.ai.d=dm;if(kind==='overseer'){G.boss=a;}
 G.actors.push(a);return a;}
function removeActor(a){scene.remove(a.model.root);G.actors.splice(G.actors.indexOf(a),1);}
function setWeapon(f,i){f.wi=i;f.reloadT=0;f.burstLeft=0;f.zoom=0;const w=f.weapons[i];if(!w)return;if(f.kind==='turret')return;if(!f.guns[w.id]){const g=gunModel(w.id);g.scale.setScalar(f.kind==='skitter'?.9:.85);f.guns[w.id]=g;}f.model.setGun(f.guns[w.id]);if(f===G.me)VM.set(w.id);}
const eyeOf=(f,o=new V())=>o.set(f.pos.x,f.pos.y+(f.crouch?PHY.eyeC:f.K.head),f.pos.z);
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
function placeOnGround(a,x,z){a.pos.set(x,G.W.groundBelow(x,500,z,0)+.05,z);a.vel.set(0,0,0);}

function stepActor(f,dt){const inp=f.inp;if(!f.alive){f.deadT+=dt;return;}
 // shields, then health, recharge
 f.shDelay-=dt;if(f.shDelay<=0){if(f.shield<f.maxSh){if(f.shield<=0&&f===G.me)snd.play('recharge');f.shield=Math.min(f.maxSh,f.shield+f.maxSh*(f.K.boss?.25:.55)*dt);}
  else if(f.health<f.maxHp&&(f.human||f.squad))f.health=Math.min(f.maxHp,f.health+(f.human?14:4)*dt);}
 if(f.seat){seatedActor(f,dt);return;}
 const fixed=f.K.fixed;const frozen=G.phase!=='play'&&!G.attract;
 // ---- movement ----
 if(!fixed){const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen)wx=wz=0;
  const recent=f.lastFire>G.time-.3;const sprint=inp.sprint&&inp.fwd>.3&&!recent&&f.zoom<.3&&!f.reloadT;f.sprinting=sprint&&f.onGround;f.crouch=f.crouch||inp.crouch;
  let spd=(f.human?(sprint?PHY.sprint:PHY.walk):f.K.spd*(sprint?1.35:1))*(f.crouch?.5:1);if(f.zoom>.5)spd*=.8;if(f.flee>0)spd*=1.25;
  if(f.onGround){const k=Math.min(1,PHY.accel*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
  else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
  if(inp.jumpEdge&&f.onGround&&!frozen&&!f.crouch){f.vel.y=PHY.jump*(f.kind==='ravager'||f.kind==='overseer'?.8:1);f.onGround=false;if(f===G.me)snd.play('jump');}
  f.vel.y-=PHY.g*dt;if(f.vel.y<-50)f.vel.y=-50;
  if(f.lunge){f.lunge.t-=dt;const tg=f.lunge.target;if(tg&&tg.alive){tv.subVectors(tg.pos,f.pos);const d=tv.length();tv.normalize();f.vel.x=tv.x*14;f.vel.z=tv.z*14;if(d<1.6||f.lunge.t<=0){meleeHit(f,tg);f.lunge=null;}}else f.lunge=null;}
  const wasG=f.onGround,vy0=f.vel.y;f.h=f.crouch?PHY.hC*(f.K.h/1.8):f.K.h;G.W.move(f,dt);
  if(f.onGround&&!wasG&&-vy0>7){if(f===G.me){f.landDip=Math.min(.3,-vy0*.016);snd.play('land',null,1,-vy0);}if(-vy0>19&&f.human)damage(f,(-vy0-19)*8,null,{weapon:'fall'});}
  const hs=Math.hypot(f.vel.x,f.vel.z);if(f.onGround&&hs>2){f.stepT-=dt*hs*(f.sprinting?.3:.36);if(f.stepT<=0){f.stepT=1;snd.play('step',f===G.me?null:f.pos,f===G.me?.8:.4);}}
  if(f.pos.y<G.W.killY){die(f,null,{weapon:'fall'});return;}}
 if(frozen)return;
 weaponsStep(f,dt);}
function seatedActor(f,dt){const v=f.veh;v.seatPos(f.seat,f.pos);f.pos.y-=.95;f.vel.copy(v.vel);f.onGround=true;
 if(f.seat==='passenger'||(f.seat==='driver'&&!f.human)){weaponsStep(f,dt);}}

function weaponsStep(f,dt){const inp=f.inp;const w=f.weapons[f.wi];if(!w)return;const d=WPN[w.id];
 f.fireCD-=dt;f.meleeCD-=dt;f.nadeCD-=dt;if(f.meleeT>0)f.meleeT-=dt;f.recoil*=Math.exp(-dt*10);f.spread=Math.max(d.spr||0,f.spread-dt*(d.sprMax||.02)*2.2);
 for(const x of f.weapons)if(WPN[x.id].energy){if(x.vent>0){x.vent-=dt;if(x.vent<=0){x.vent=0;x.heat=.15;}}else x.heat=Math.max(0,x.heat-dt*(f.lastFire>G.time-.25&&x===w?.12:.55));}
 f.zoom=damp(f.zoom,inp.zoom&&!f.sprinting&&f.reloadT<=0&&f.swapT<=0&&d.zoom>1?1:0,16,dt);
 if(f.swapT>0){f.swapT-=dt;if(!f.swapMid&&f.swapT<.2){f.swapMid=true;setWeapon(f,1-f.wi);}if(f.swapT<=0)f.swapT=0;return;}
 if(inp.swap&&f.weapons.length>1&&f.meleeT<=0&&!f.seat){f.swapT=.42;f.swapMid=false;f.reloadT=0;f.burstLeft=0;if(f===G.me)snd.play('swap');return;}
 if(f.reloadT>0){f.reloadT-=dt;if(f.reloadT<=0){const take=Math.min(d.mag-w.mag,w.res);w.mag+=take;w.res-=take;f.reloadT=0;if(!f.human&&w.res<d.mag)w.res+=d.mag*3;}}
 if(inp.reload&&!f.reloadT&&!d.energy&&w.mag<d.mag&&w.res>0&&f.meleeT<=0){f.reloadT=d.reload;snd.play('reload',f===G.me?null:f.pos,.7);}
 if(inp.melee&&f.meleeCD<=0&&f.reloadT<=0&&!f.seat){melee(f);return;}
 if(inp.nade&&f.nadeCD<=0&&f.meleeT<=0&&!f.seat){let k=f.nadeSel;if(f.nades[k]<=0)k=k==='frag'?'stick':'frag';if(f.nades[k]>0){f.nades[k]--;f.nadeCD=1;throwNade(f,k);f.lastFire=G.time;}}
 if(f.slam){f.slam=0;slam(f);}
 if(f.burstLeft>0){f.burstT-=dt;if(f.burstT<=0&&w.mag>0){shoot(f,w,d);f.burstLeft--;f.burstT=d.gap;}else if(w.mag<=0)f.burstLeft=0;}
 const canFire=f.reloadT<=0&&f.meleeT<=0&&!f.lunge;
 const wantFire=inp.fire&&(d.auto||d.burst||!f.human||!f.fireHeld||f.fireCD<-.12||true);
 if(wantFire&&canFire&&f.fireCD<=0&&f.burstLeft<=0){
  if(d.energy){if(w.vent>0){if(f===G.me&&!f.ventBeep){f.ventBeep=1;snd.play('empty');}}else if(f.human&&w.bat<=0){snd.play('empty');f.fireCD=.3;}
   else{if(!d.auto&&f.human&&f.fireHeld&&f.fireCD>-d.rate*.5){}else{shoot(f,w,d);f.fireCD=d.rate*(f.ai?f.ai.d.rate||1:1);if(f.human)w.bat=Math.max(0,w.bat-d.bat);w.heat+=d.heat;if(w.heat>=1){w.heat=1;w.vent=d.vent;snd.play('overheat',f===G.me?null:f.pos);if(f===G.me)G.shake=Math.max(G.shake,.15);}}}}
  else if(w.mag<=0){if(w.res>0){f.reloadT=d.reload;snd.play('reload',f===G.me?null:f.pos,.7);}else{if(f===G.me)snd.play('empty');f.fireCD=.3;}}
  else if(d.burst){f.burstLeft=d.burst;f.burstT=0;f.fireCD=d.rate;}else{shoot(f,w,d);f.fireCD=d.rate*(f.ai?Math.max(1,f.ai.d.rate||1):1);}}
 if(!inp.fire)f.ventBeep=0;f.fireHeld=inp.fire;
 if(!d.energy&&w.mag<=0&&w.res>0&&!f.reloadT&&!inp.fire&&f.fireCD<0&&f.burstLeft<=0){f.reloadT=d.reload;snd.play('reload',f===G.me?null:f.pos,.7);}}

/* ================= combat ================= */
function rayActors(o,d,maxT,skip,all){const out=[];for(const f of G.actors){if(f===skip||!f.alive||f.hidden||f.seat&&f.veh&&f.veh.kind==='tank')continue;const K=f.K,s=f.crouch?.65:1;let best=null;
  if(!K.fixed){const hy=f.pos.y+K.head*s,hr=.24*f.scale;const hx=f.pos.x-o.x,hyy=hy-o.y,hz=f.pos.z-o.z;const tc=hx*d.x+hyy*d.y+hz*d.z;if(tc<-1||tc>maxT+2)continue;const d2=hx*hx+hyy*hyy+hz*hz-tc*tc;if(d2<hr*hr){const t=tc-Math.sqrt(hr*hr-d2);if(t>0&&t<maxT)best={f,t,head:true};}}
  const ay=f.pos.y+.2,by=f.pos.y+(K.fixed?2.6:K.head*s-.22*f.scale),r=K.fixed?.9:Math.max(.36,K.r*1.05);const wx=o.x-f.pos.x,wz=o.z-f.pos.z;const A=d.x*d.x+d.z*d.z;
  if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){const t=(-B-Math.sqrt(D))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>ay-r*.5&&y<by+r*.4&&(!best||t<best.t-.04))best={f,t,head:false};}}
  if(best)out.push(best);}
 out.sort((a,b)=>a.t-b.t);return all?out:out.slice(0,1);}
function rayVehicles(o,d,maxT,skipV){let best=null;for(const v of G.vehicles){if(v===skipV||v.dead&&v.deadT>6)continue;const r=v.S.r*.8,wx=o.x-v.pos.x,wz=o.z-v.pos.z,A=d.x*d.x+d.z*d.z;if(A<1e-6)continue;const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D<0)continue;
  let t=(-B-Math.sqrt(D))/A;if(Cc<0)t=0;const y=o.y+d.y*t;const top=v.pos.y+(v.kind==='tank'?3:2);if(t<0||t>maxT)continue;if(y<v.pos.y||y>top){if(Math.abs(d.y)<1e-4)continue;const tt=(top-o.y)/d.y;const hx=o.x+d.x*tt-v.pos.x,hz=o.z+d.z*tt-v.pos.z;if(tt>0&&tt<maxT&&hx*hx+hz*hz<r*r)t=tt;else continue;}
  if(!best||t<best.t)best={v,t};}return best;}
function muzzleOf(f,o=new V()){if(f===G.me&&!f.veh&&VM.root.visible){const g=VM.guns[f.weapons[f.wi].id];const md=g?.userData.muzzle||new V(0,0,-.7);
  VM.root.updateWorldMatrix(true,true);o.copy(md).applyMatrix4(g.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(1.1).add(cam.position);return o;}
 if(f.kind==='turret'){f.model.head.updateWorldMatrix(true,false);return o.set(0,0,-1.6).applyMatrix4(f.model.head.matrixWorld);}
 f.model.gunMount.updateWorldMatrix(true,false);return o.set(0,.03,-.62).applyMatrix4(f.model.gunMount.matrixWorld);}
function aimRay(f,eye,fw){// player: fire from the camera (3rd person seat or FP)
 if(f===G.me){eye.copy(cam.position);dirOf(G.camYaw,G.camPitch,fw);if(f.veh)eye.addScaledVector(fw,f.veh.S.cam[0]*.9);}else{eyeOf(f,eye);dirOf(f.yaw,f.pitch,fw);}}
function shoot(f,w,d){if(!f.human)w.mag=Math.max(0,w.mag-(d.energy?0:1));else if(!d.energy)w.mag--;f.lastFire=G.time;G.noise={p:f.pos.clone(),t:G.time,who:f};f.stats.shots++;const me=f===G.me;if(me){G.stats.shots++;G.shotHit=false;}
 const eye=new V(),fw=new V();aimRay(f,eye,fw);const right=new V(Math.cos(f.yaw),0,-Math.sin(f.yaw)),up=new V().crossVectors(right,fw);
 const moving=Math.hypot(f.vel.x,f.vel.z)>2?1.25:1,air=f.onGround?1:1.5,zm=1-f.zoom*.6,cr=f.crouch?.75:1;const spr=(d.pel?d.spr:f.spread)*moving*air*zm*cr;const mz=muzzleOf(f,new V());let hitAny=false;
 if(d.bolt||d.proj){const dir=fw.clone().addScaledVector(right,(Math.random()-.5)*spr*2).addScaledVector(up,(Math.random()-.5)*spr*2).normalize();
  if(d.proj==='rocket')spawnRocket(f,mz.clone(),dir,d);else spawnBolt(f,mz.clone(),dir,d);}
 else{const n=d.pel||1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*spr;const dir=fw.clone().addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();
   const ho={n:new V()};const wt=G.W.ray(eye,dir,d.range,ho);const vh=rayVehicles(eye,dir,wt,f.veh);const lim=vh?vh.t:wt;const hits=rayActors(eye,dir,lim,f,d.pierce);let end=lim;
   for(const h of hits){let dmg=d.dmg;if(d.fall&&h.t>d.fall[0])dmg*=1-(1-d.fall[2])*cl((h.t-d.fall[0])/(d.fall[1]-d.fall[0]),0,1);let hm=1;if(h.head)hm=d.precision||d.scope?(h.f.shield>0?1.2:d.hs):d.hs;
    damage(h.f,dmg*hm,f,{head:h.head,weapon:w.id,point:eye.clone().addScaledVector(dir,h.t),dir,dist:h.t});hitAny=true;if(!d.pierce){end=h.t;break;}}
   if(vh&&end>=vh.t&&vh.v.team!==f.team){damageVehicle(vh.v,d.dmg*.5,f);end=vh.t;}
   const ep=eye.clone().addScaledVector(dir,end);const tc=d.tr;
   if(d.scope){beams.beam(mz,ep,[tc[0],tc[1],tc[2]],.05,.6);for(let k=0;k<20;k++){const t=Math.random();tv.lerpVectors(mz,ep,t);smoke.emit(tv.x,tv.y,tv.z,rnd(.4)-.2,rnd(.4),rnd(.4)-.2,.6,.6,.6,.16,1,-.3,.8);}}
   else if(i<3||Math.random()<.4)beams.tracer(mz,ep,tc,d.pel?.018:.024,d.pel?260:330,d.pel?4:6);
   if(end>=wt&&wt<d.range)impact(ep,ho.n,d,w.id,ho.terrain);}}
 if(hitAny)f.stats.hits++;if(d.spr!==undefined&&!d.pel)f.spread=Math.min(d.sprMax||d.spr,f.spread+(d.sprAdd||0));
 snd.play(d.snd,me?null:f.pos,me?.9:.8);if(f.model.st)f.model.st.kick=1;
 if(me){VM.fire();f.recoil+=d.kick*.012;G.shake=Math.max(G.shake,d.kick*.07);if(w.id==='ar')VM.screen(w.mag,d.mag);}else if(Math.random()<.5)lights.flash(mz,d.col,1.4,7,.05);}
function impact(p,n,d,id,terr){const col=C(...d.tr);parts.burst(p,id==='shotgun'?3:8,6,[col,C(2.2,1.8,1.2)],.07,.35,{dir:n,spread:.9,grav:14,drag:2,floor:p.y-2});
 if(terr){for(let k=0;k<3;k++)smoke.emit(p.x,p.y,p.z,n.x*.8+rnd(.6)-.3,n.y*1.2+rnd(.5),n.z*.8+rnd(.6)-.3,.55,.45,.35,.35,1.1,-.1,1.4);}else decals.add(p,n,.18);if(Math.random()<.3)snd.play('tink',p,.4);}
function spawnBolt(f,p,dir,d){if(G.bolts.length>=MAXB)G.bolts.shift();G.bolts.push({p:p.clone(),v:dir.multiplyScalar(d.bolt),owner:f,d,life:d.arc?5:2.5,col:new THREE.Color(...d.tr),arc:d.arc});}
const rocketGeo=new THREE.CylinderGeometry(.08,.11,.7,8).rotateX(Math.PI/2),rocketMat=new THREE.MeshStandardMaterial({color:0x5a6044,roughness:.5,metalness:.6,emissive:0x331100});
const fragGeo=new THREE.SphereGeometry(.11,12,10),fragMat=new THREE.MeshStandardMaterial({color:0x3a4030,roughness:.4,metalness:.7,emissive:0xff6a10,emissiveIntensity:.3}),stickMat=new THREE.MeshBasicMaterial({color:C(1.6,.8,3.4)});
function spawnRocket(f,p,dir,d,o={}){const m=new THREE.Mesh(rocketGeo,rocketMat);m.position.copy(p);m.lookAt(p.clone().add(dir));scene.add(m);G.proj.push({kind:'rocket',pos:p.clone(),vel:dir.clone().multiplyScalar(o.speed||d.speed),owner:f,life:5,mesh:m,light:lights.grab(null,0xff8a30,10,10),d,dmg:o.dmg||d.sdmg,r:o.r||d.splash,push:d.push,veh:o.veh});}
function throwNade(f,k){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.14,new V());if(f===G.me)dirOf(G.camYaw,G.camPitch+.14,fw);const p=eye.addScaledVector(fw,.5);const v=fw.multiplyScalar(f.human?19:15).add(tv.copy(f.vel).multiplyScalar(.6));v.y+=2.5;
 const m=new THREE.Mesh(fragGeo,k==='frag'?fragMat:stickMat);m.position.copy(p);m.castShadow=true;scene.add(m);G.proj.push({kind:k,pos:p.clone(),vel:v,owner:f,life:NADE[k].fuse+(k==='stick'?2.5:0),fuse:k==='frag'?NADE.frag.fuse:99,mesh:m,light:k==='stick'?lights.grab(null,0x9a6aff,6,6):null,stuck:null});
 snd.play('throw',f===G.me?null:f.pos,.8);if(f===G.me)VM.kick=.6;}
function killProj(p){scene.remove(p.mesh);if(p.light)lights.release(p.light);p.dead=true;}
const bm4=new THREE.Matrix4(),bq=new THREE.Quaternion(),bs=new V(),Z1=new V(0,0,1);
function updateBolts(dt){const ho={n:new V()};let n=0;for(let i=G.bolts.length-1;i>=0;i--){const b=G.bolts[i];b.life-=dt;if(b.arc)b.v.y-=PHY.g*.55*dt;const sp=b.v.length(),step=sp*dt,dir=tv.copy(b.v).divideScalar(sp);
  const wt=G.W.ray(b.p,dir,step,ho);const vh=rayVehicles(b.p,dir,wt,b.owner.veh);const lim=vh?vh.t:wt;const fh=rayActors(b.p,dir,lim+.1,b.owner);
  let hit=null;if(fh.length&&fh[0].f.team!==b.owner.team){hit='a';}else if(fh.length&&fh[0].f.team===b.owner.team){/* friendlies: pass through */}
  if(hit||wt<step||vh||b.life<=0){const t=hit?fh[0].t:lim;b.p.addScaledVector(dir,Math.max(0,t-.05));
   if(b.d.splash){explode(b.p,b.owner,b.d.sdmg,b.d.splash,b.d.push,'mortar');}
   else{if(hit){const h=fh[0];damage(h.f,b.d.dmg*(h.head?b.d.hs||1:1),b.owner,{weapon:b.d===WPN.spark?'spark':'ion',point:b.p.clone(),dir:dir.clone(),head:h.head,shieldX:b.d.shieldX});}
    else if(vh&&vh.v.team!==b.owner.team)damageVehicle(vh.v,b.d.dmg*.6,b.owner);
    parts.burst(b.p,10,5,[b.col,C(2,2,2)],.08,.3,{grav:6});if(!hit)decals.add(b.p,ho.n,.22);}
   G.bolts.splice(i,1);continue;}
  b.p.addScaledVector(dir,step);if(Math.random()<.5)parts.emit(b.p.x,b.p.y,b.p.z,0,0,0,b.col.r*.5,b.col.g*.5,b.col.b*.5,b.arc?.5:.16,.18);}
 for(const b of G.bolts){if(n>=MAXB)break;const sp=b.v.length();bq.setFromUnitVectors(Z1,tv.copy(b.v).divideScalar(sp));const k=b.arc?3:1.2;bs.set(k,k,b.arc?3.2:3.6);bm4.compose(b.p,bq,bs);boltMesh.setMatrixAt(n,bm4);boltMesh.setColorAt(n,b.col);n++;}
 boltMesh.count=n;boltMesh.instanceMatrix.needsUpdate=true;if(boltMesh.instanceColor)boltMesh.instanceColor.needsUpdate=true;}
function updateProj(dt){const ho={n:new V()};for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.life-=dt;
  if(p.kind==='rocket'){const step=p.vel.length()*dt,dir=tv.copy(p.vel).normalize();const wt=G.W.ray(p.pos,dir,step,ho);const vh=rayVehicles(p.pos,dir,wt,p.owner.veh||p.veh);const lim=vh?vh.t:wt;const fh=rayActors(p.pos,dir,lim+.2,p.owner);
   const hitA=fh.length&&fh[0].f.team!==p.owner.team;if(hitA||wt<step||vh&&vh.v.team!==p.owner.team||p.life<=0){p.pos.addScaledVector(dir,Math.max(0,(hitA?fh[0].t:lim)-.15));if(hitA)damage(fh[0].f,p.d.dmg,p.owner,{weapon:'rocket',point:p.pos.clone(),dir:dir.clone()});explode(p.pos,p.owner,p.dmg,p.r,p.push||14,'rocket');killProj(p);G.proj.splice(i,1);continue;}
   p.pos.addScaledVector(dir,step);p.mesh.position.copy(p.pos);if(p.light)p.light.L.position.copy(p.pos);smoke.emit(p.pos.x,p.pos.y,p.pos.z,rnd(.6)-.3,rnd(.6),rnd(.6)-.3,.6,.58,.55,.4,1.3,-.2,1.2);parts.emit(p.pos.x,p.pos.y,p.pos.z,-dir.x*3,-dir.y*3,-dir.z*3,3,1.4,.4,.35,.15);continue;}
  if(p.stuck){if(p.stuck.f)p.pos.copy(p.stuck.f.pos).add(p.stuck.off);}
  else{p.vel.y-=PHY.g*dt;const step=p.vel.length()*dt;if(step>1e-4){const dir=tv.copy(p.vel).normalize();
    if(p.kind==='stick'){const fh=rayActors(p.pos,dir,step+.15,p.owner);if(fh.length&&fh[0].f.team!==p.owner.team){const tf=fh[0].f;p.stuck={f:tf,off:new V(0,tf.K.head*.7,0)};p.fuse=NADE.stick.fuse;snd.play('stick',tf.pos);if(p.owner===G.me){hud.toast('STUCK!',1.2);G.stats.sticks++;}p.stuckOn=tf;continue;}}
    const wt=G.W.ray(p.pos,dir,step+.11,ho);if(wt<step+.11){p.pos.addScaledVector(dir,Math.max(0,wt-.11));if(p.kind==='stick'){p.stuck={f:null};p.fuse=NADE.stick.fuse;p.vel.set(0,0,0);snd.play('stick',p.pos,.6);}
     else{const vn=p.vel.dot(ho.n);p.vel.addScaledVector(ho.n,-1.45*vn).multiplyScalar(.6);if(Math.abs(vn)>3)snd.play('tink',p.pos,.6);if(ho.n.y>.6&&p.vel.length()<1.2)p.vel.set(0,0,0);}}
    else p.pos.addScaledVector(dir,step);}}
  p.fuse-=dt;p.mesh.position.copy(p.pos);if(p.light)p.light.L.position.copy(p.pos);p.mesh.rotation.x+=dt*8;
  if(p.kind==='frag'&&Math.random()<dt*12)parts.emit(p.pos.x,p.pos.y,p.pos.z,0,.5,0,2,.6,.15,.12,.2);if(p.kind==='stick')parts.emit(p.pos.x,p.pos.y,p.pos.z,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,1.2,.6,3,.2,.25);
  if(p.fuse<=0||p.life<=0){const N=NADE[p.kind];explode(p.pos,p.owner,N.dmg,N.r,N.push,p.kind,p.stuckOn);killProj(p);G.proj.splice(i,1);}}}
function explode(pos,owner,dmg,radius,push,kind,stuckOn){const purple=kind==='mortar'||kind==='stick';const c1=purple?C(2.6,.8,2.8):C(3.2,1.5,.4),c2=purple?C(1.4,.4,2.2):C(2.4,.6,.1);
 parts.burst(pos,110,14,[c1,c2,C(3,2.6,2)],.5,.7,{grav:3,drag:2.4});parts.burst(pos,40,22,[c1,C(2.6,2.2,1.6)],.1,.9,{grav:16,drag:1.2});for(let k=0;k<16;k++)smoke.emit(pos.x+rnd(1.6)-.8,pos.y+rnd(1.2)-.3,pos.z+rnd(1.6)-.8,rnd(2)-1,rnd(2),rnd(2)-1,.22,.2,.2,1.8+rnd(1),2.4+rnd(1.2),-.4,1.2);
 shocks.fire(pos,c1.clone().multiplyScalar(.5),radius*1.1,.45);lights.flash(pos,purple?0xc060ff:0xff8a30,90,radius*4,.45);snd.play('boom',pos);
 const ho={n:new V()};const gd=G.W.ray(pos,tv.set(0,-1,0),3,ho);if(gd<3)decals.add(pos.clone().setY(pos.y-gd),ho.n,radius*.7);
 const cp=cam.position;const dd=cp.distanceTo(pos);if(dd<radius*5)G.shake=Math.max(G.shake,cl(1-dd/(radius*5),0,1)*.9);
 for(const f of G.actors){if(!f.alive||f.seat&&f.veh&&f.veh.kind==='tank')continue;const c=tv2.copy(f.pos);c.y+=f.K.h*.5;const d=c.distanceTo(pos);if(d>radius+f.K.r)continue;if(!G.W.los(pos,c)&&!G.W.los(pos,tv3.copy(f.pos).setY(f.pos.y+f.K.h)))continue;
  const k=1-Math.min(1,d/radius),self=f===owner;tv3.subVectors(c,pos).normalize();tv3.y=Math.max(tv3.y,.35);if(!f.K.fixed&&!f.seat)f.vel.addScaledVector(tv3.normalize(),push*(.4+k*.6)/(f.K.boss?4:f.kind==='ravager'?2.5:1));if(f.vel.y>4)f.onGround=false;
  const am=f===stuckOn?dmg*1.6:dmg*Math.pow(k,.7)*(self?.5:1);if(f.team===owner?.team&&!self)continue;damage(f,am,owner,{weapon:kind,point:pos.clone(),dir:tv3.clone(),splash:true,stuck:f===stuckOn});}
 for(const v of G.vehicles){if(v.dead)continue;const d=v.pos.distanceTo(pos);if(d<radius+v.S.r&&v.team!==owner?.team)damageVehicle(v,dmg*(1-Math.min(1,d/(radius+v.S.r)))*.8,owner);}
 for(const o of G.D.objs)if(o.type==='pylon'&&!o.done){const d=Math.hypot(o.p.x-pos.x,o.p.z-pos.z);if(d<radius+5&&pos.y<o.p.y+26)damageObj(o,dmg*(kind==='rocket'?1.6:1)*(1-Math.min(1,d/(radius+5))*.5),owner);}}
function melee(f){f.meleeT=.4;f.meleeCD=f.human?.9:1.3;snd.play('melee',f===G.me?null:f.pos,.8);const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bd=f.human?4:2.8*f.scale;
 for(const o of G.actors){if(o===f||!o.alive||o.team===f.team||o.seat)continue;tv.copy(o.pos).setY(o.pos.y+o.K.h*.5).sub(eye);const d=tv.length()-o.K.r;if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.5)continue;best=o;bd=d;}
 if(best){if(bd>1.6&&f.human)f.lunge={target:best,t:.2};else meleeHit(f,best);}}
function meleeHit(f,o){if(!o.alive)return;tv.subVectors(o.pos,f.pos).normalize();const back=-Math.sin(o.yaw)*tv.x+-Math.cos(o.yaw)*tv.z>.5;
 const dmg=f.human?(back&&!o.K.boss?999:72):f.K.melee*(f.team===1?DIFF[G.opt.diff].dmg:1);damage(o,dmg,f,{weapon:'melee',point:tv2.copy(o.pos).setY(o.pos.y+o.K.h*.6),dir:tv.clone(),melee:true,back});if(!o.K.fixed)o.vel.addScaledVector(tv,f.K.melee>80?10:5);
 parts.burst(tv2,16,5,[C(2.4,2,1.4)],.12,.4,{grav:6});if(f===G.me||o===G.me)G.shake=Math.max(G.shake,.35);snd.play('melee',o.pos);}
function slam(f){snd.play('roar',f.pos);const p=f.pos.clone();p.y+=.3;shocks.fire(p,C(1.8,1,.3),9,.5);parts.burst(p,80,14,[C(3,1.6,.4),C(2,.8,.2)],.3,.6,{up:true,grav:10});
 for(const o of G.actors){if(!o.alive||o.team===f.team)continue;const d=(o.veh?o.veh.pos:o.pos).distanceTo(p);if(d<9){const k=1-d/9;if(o.veh)damageVehicle(o.veh,260*k,f);else{damage(o,(55+70*k)*DIFF[G.opt.diff].dmg,f,{weapon:'slam',point:o.pos.clone(),splash:true});tv.subVectors(o.pos,p).setY(0).normalize();o.vel.addScaledVector(tv,12*k);o.vel.y+=6*k;o.onGround=false;}}}
 G.shake=Math.max(G.shake,.8);}

function damage(t,amount,att,o={}){if(!t.alive||amount<=0)return;if(att&&att!==t&&att.team===t.team)return;if(G.attract&&t.team===0&&t.squad)amount*=.2;if(att===G.me&&t.team===1&&!G.shotHit&&!o.splash){G.shotHit=true;G.stats.hits++;}
 if(t.seat&&t.veh){if(t.veh.kind==='tank')return;if(o.splash){damageVehicle(t.veh,amount*.8,att);amount*=.35;}else amount*=.6;}
 if(att&&att.team===1&&t.team===0){amount*=DIFF[G.opt.diff].dmg*(t.squad?.4+.07*G.opt.diff:1);if(!o.splash&&!o.melee&&att.ai)amount*=1;}
 if(att&&att.team===0&&t.team===1&&!att.human)amount*=.55;
 if(t.K.armor&&!o.splash)amount*=t.K.armor;
 if(att&&att!==t){t.lastHitBy=att;t.lastHitT=G.time;}
 const hadShield=t.shield>0;let a=amount;if(t.shield>0){const sa=a*(o.shieldX||1);const s=Math.min(t.shield,sa);t.shield-=s;a=Math.max(0,a-s/(o.shieldX||1));}if(a>0)t.health-=a;
 t.shDelay=t.K.boss?6:t.team===0?4.5:3.5;
 if(hadShield){const local=tv3.copy(o.point||t.pos).sub(t.pos);local.y-=t.K.h*.5;local.x/=.5*t.scale;local.y/=t.K.h*.55;local.z/=.45*t.scale;local.applyAxisAngle(UP,-t.yaw);t.model.hit(local.normalize(),Math.min(1,amount/40));
  if(o.point&&!o.splash)parts.burst(o.point,6,4,[t.team?C(2,1.2,3.4):C(1.6,2.4,3),C(2.4,2,3)],.06,.3,{grav:4});snd.play('hitShield',t===G.me?null:t.pos,.7);}
 else if(o.point&&!o.splash){const blood=t.team?(t.kind==='skitter'?C(.3,2.2,2.4):C(1.4,.6,2.6)):C(1.8,.3,.15);parts.burst(o.point,8,4,[blood,blood.clone().multiplyScalar(.5)],.08,.4,{grav:10});snd.play('hitBody',t===G.me?null:t.pos,.6);}
 if(hadShield&&t.shield<=0&&t.alive){snd.play('shieldBreak',t===G.me?null:t.pos);parts.burst(tv.copy(t.pos).setY(t.pos.y+t.K.h*.55),30,6,t.team?[C(2,1,3.4),C(3,2.2,3.4)]:[C(.5,1.4,3),C(1.6,2.6,3.2)],.09,.5,{grav:5});if(t===G.me)hud.flash(.12);}
 if(t.ai){t.ai.flinch=.3;t.ai.alert=true;if(att&&att!==t&&(!t.ai.target||t.ai.lostT>.5)){t.ai.target=att;t.ai.lastPos.copy(att.veh?att.veh.pos:att.pos);t.ai.lostT=0;t.ai.seenT=Math.min(t.ai.seenT,.15);}if(t.team===1)alertGroup(t);}
 if(t===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amount/120);G.shake=Math.max(G.shake,Math.min(.35,amount/90));t.zoom=0;if(att&&att!==t){const ap=att.veh?att.veh.pos:att.pos;const dx=ap.x-t.pos.x,dz=ap.z-t.pos.z;hud.damageFrom(-wrapA(Math.atan2(-dx,-dz)-G.camYaw));}if(t.shield<=0&&t.health<40&&Math.random()<.3)snd.play('lowShield');}
 const killed=t.health<=0;if(att===G.me&&t!==G.me){hud.hit(killed?'k':o.head?'h':'');snd.play(o.head&&killed?'headshot':'hitmark',null,1,killed?1:0);G.stats.dmg+=amount;}
 if(killed){t.health=0;die(t,att,o);}}
function damageVehicle(v,amount,att){if(v.dead||amount<=0)return;if(att&&att.team===1)amount*=DIFF[G.opt.diff].dmg*(v.kind==='tank'?.8:1);v.hp-=amount;v.hitT=.2;if(v.seats.driver===G.me){G.hurtFx=Math.min(.4,G.hurtFx+amount/600);G.shake=Math.max(G.shake,Math.min(.3,amount/300));}
 if(v.hp<=0)vehicleDestroyed(v,att);}
function vehicleDestroyed(v,att){v.dead=true;v.deadT=0;v.hp=0;explode(v.pos.clone().setY(v.pos.y+1.2),att,60,7,16,'rocket');parts.burst(v.pos,150,20,[C(3.4,1.6,.3),C(2.6,.8,.1)],.6,1,{grav:6});
 v.m.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.color){o.material=o.material.clone();o.material.color.multiplyScalar(.25);if(o.material.emissive)o.material.emissive.set(0);}});
 for(const k in v.seats){const a=v.seats[k];if(a){exitVehicle(a,true);damage(a,a===G.me?55:80,att,{weapon:'rocket',splash:true});}}if(v.kind==='buggy'&&G.stepI>=0)G.radioOnce('vdead','KESS','Jackrabbit\'s scrap! We hoof it from here!');}

function die(f,k,o={}){if(!f.alive)return;f.alive=false;f.deadT=0;f.lunge=null;f.flee=0;
 if(f.veh)exitVehicle(f,true);
 const dir=o.dir?tv.copy(o.dir).setY(0).normalize():tv.set(0,0,1);f.model.kill(dir,o.splash?8:o.melee?6:3);parts.burst(tv2.copy(f.pos).setY(f.pos.y+1),30,5,f.team?[C(.8,1.2,3),C(2,.8,2.4)]:[C(2,.8,.3)],.1,.6,{grav:8});
 snd.play(f.team?'alienDie':'death',f===G.me?null:f.pos);
 // drop the weapon
 const w=f.weapons[f.wi];if(w&&f!==G.me&&f.kind!=='turret'&&WPN[w.id]&&PICKABLE.includes(w.id)&&(f.team===0||Math.random()<.65)){const dw={...w};if(WPN[w.id].energy){dw.bat=20+Math.random()*70;dw.heat=0;dw.vent=0;}else{dw.res=Math.max(dw.res,WPN[w.id].mag);}dropWeapon(dw,f.pos);}
 if(f.team===1){if(k===G.me||k&&k.veh&&k.veh.seats.driver===G.me&&o.weapon==='splat'){G.stats.kills[f.kind]=(G.stats.kills[f.kind]||0)+1;G.stats.score+=f.K.score;if(o.head)G.stats.heads++;if(o.weapon==='melee')G.stats.melee++;if(o.weapon==='splat')G.stats.splat++;}
  else if(k&&k.team===0)G.stats.assist++;
  if(f.kind==='warden'||f.kind==='wardenR'||f.kind==='overseer')for(const s of G.actors)if(s.alive&&s.kind==='skitter'&&s.pos.distanceTo(f.pos)<20&&Math.random()<(f.kind==='warden'?.65:.85)){s.flee=2.5+rnd(2.5);}
  if(f===G.boss){G.radio('VASH','No... the ring... remembers...');}}
 if(f.squad&&G.stepI>=0){G.stats.lost++;const lines={OKOYE:'Sarge is down! SARGE!',KESSLER:'Kessler! Man down!',ROURKE:'Rourke\'s gone! Dammit!',AMADI:'Lost Amadi! Keep moving!'};const sp=G.actors.find(a=>a.squad&&a.alive);if(sp)G.radio(sp.name==='OKOYE'?'OKOYE':sp.name==='KESSLER'?'KESS':sp.name,lines[f.name]||'Marine down!');}
 if(f===G.me){G.deadT=3.2;G.stats.deaths++;G.hurtFx=.8;f.zoom=0;f.model.root.visible=true;camPos.copy(cam.position);}}
function alertGroup(f){if(!f.group)return;for(const o of G.actors)if(o.group===f.group&&o.ai&&o.alive&&o.pos.distanceTo(f.pos)<40){o.ai.alert=true;if(!o.ai.target&&f.ai&&f.ai.target){o.ai.target=f.ai.target;o.ai.lastPos.copy(f.ai.lastPos);o.ai.lostT=.5;}}}
G.alertGroup=alertGroup;

/* ================= pickups (racks + drops) ================= */
const pedGeo=new THREE.CylinderGeometry(.5,.65,.2,20),ringGeo=new THREE.TorusGeometry(.55,.03,6,32);
function itemMesh(id,rack){const g=new THREE.Group();const col=WPN[id].col;if(rack){const ped=new THREE.Mesh(pedGeo,new THREE.MeshStandardMaterial({color:0x2a2e26,roughness:.4,metalness:.8}));ped.position.y=.1;g.add(ped);
  const ring=new THREE.Mesh(ringGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(col).multiplyScalar(2)}));ring.rotation.x=Math.PI/2;ring.position.y=.21;g.add(ring);}
 const body=gunModel(id);body.scale.setScalar(1.2);if(rack){body.rotation.y=Math.PI/2;body.position.y=1;}else{body.rotation.set(0,Math.random()*6,Math.PI/2);body.position.y=.12;}g.add(body);body.traverse(o=>{if(o.isMesh)o.castShadow=true;});g.userData={body};return g;}
function dropWeapon(w,p){const it={w,id:w.id,p:p.clone(),life:45,mesh:itemMesh(w.id,false)};it.mesh.position.copy(p);it.mesh.position.y=G.W.groundBelow(p.x,p.y+.5,p.z)+.02;scene.add(it.mesh);G.items.push(it);if(G.items.length>40){const o=G.items.find(i=>!i.rack);if(o){scene.remove(o.mesh);G.items.splice(G.items.indexOf(o),1);}}}
function buildRacks(){for(const r of G.D.racks){const it={rack:true,id:r.w,p:r.p.clone(),ammo:r.ammo,mesh:itemMesh(r.w,true),cd:0};it.mesh.position.copy(r.p);scene.add(it.mesh);G.items.push(it);}}
function updateItems(dt){const me=G.me;let near=null,nd=2.2;for(let i=G.items.length-1;i>=0;i--){const it=G.items[i];
  if(!it.rack){it.life-=dt;if(it.life<=0){scene.remove(it.mesh);G.items.splice(i,1);continue;}}else{it.cd-=dt;it.mesh.userData.body.rotation.y+=dt*1.1;it.mesh.userData.body.position.y=1+Math.sin(G.time*2+it.p.x)*.07;}
  if(!me||!me.alive||me.veh)continue;const d=Math.hypot(me.pos.x-it.p.x,me.pos.z-it.p.z);if(d>2.4||Math.abs(me.pos.y-it.p.y)>2)continue;
  const have=me.weapons.find(w=>w.id===it.id),D=WPN[it.id];
  if(have){// ammo top-up by walking over
   if(!D.energy&&have.res<D.res&&(!it.rack||it.cd<=0)){have.res=Math.min(D.res,have.res+(it.rack?D.res:it.w.mag+it.w.res));snd.play('pickup');hud.toast(D.name+' AMMO',1.2);if(it.rack)it.cd=12;else{scene.remove(it.mesh);G.items.splice(i,1);}continue;}
   if(D.energy&&!it.rack&&it.w.bat>have.bat+5&&d<nd){near=it;nd=d;}continue;}
  if(me.weapons.length<2&&!it.rack){me.weapons.push(it.w);setWeapon(me,me.weapons.length-1);snd.play('pickup');hud.toast(D.name,1.2);scene.remove(it.mesh);G.items.splice(i,1);continue;}
  if(d<nd){near=it;nd=d;}}
 G.nearItem=near;}
function takeItem(it){const me=G.me,D=WPN[it.id];const nw=it.rack?freshWeapon(it.id):it.w;const have=me.weapons.findIndex(w=>w.id===it.id);
 if(have>=0){const old=me.weapons[have];me.weapons[have]=nw;dropWeapon(old,me.pos);setWeapon(me,have);}
 else if(me.weapons.length<2){me.weapons.push(nw);setWeapon(me,me.weapons.length-1);}else{const cur=me.weapons[me.wi];dropWeapon(cur,me.pos.clone().add(new V(.6,0,.6)));me.weapons[me.wi]=nw;setWeapon(me,me.wi);}
 if(!it.rack){scene.remove(it.mesh);G.items.splice(G.items.indexOf(it),1);}snd.play('pickup');hud.toast(D.name,1.2);}

/* ================= vehicles ================= */
function spawnVehicles(){for(const v of G.vehicles)v.dispose(scene);G.vehicles=[];for(const s of G.D.vehicles){const v=new Vehicle(s.kind,scene);v.team=0;v.place(s.x,G.W.H(s.x,s.z)+(s.kind==='tank'?1.2:0),s.z,s.yaw);v.m.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});G.vehicles.push(v);}}
function enterVehicle(a,v,seat){if(v.dead||v.seats[seat])return false;if(a.veh)exitVehicle(a);v.seats[seat]=a;a.veh=v;a.seat=seat;a.reloadT=0;a.zoom=0;a.crouch=false;
 if(a===G.me){a.model.root.visible=false;snd.play('enter');VM.root.visible=false;G.camYaw=v.yaw;G.camPitch=-.12;
  // squad boards
  if(v.kind==='buggy'){const sq=G.actors.filter(m=>m.squad&&m.alive&&!m.veh).sort((x,y)=>x.pos.distanceTo(v.pos)-y.pos.distanceTo(v.pos));for(const s of['gunner','passenger']){const m=sq.shift();if(m&&m.pos.distanceTo(v.pos)<40)m.boardVeh={v,seat:s};}}}
 else{a.model.setGun(a.seat==='gunner'?null:a.guns[a.weapons[a.wi]?.id]);a.seatHideGun=a.seat==='gunner';}
 return true;}
function exitVehicle(a,force){const v=a.veh;if(!v)return;for(const k in v.seats)if(v.seats[k]===a)v.seats[k]=null;a.veh=null;a.seat=null;a.boardVeh=null;
 const side=a===G.me?-1:1;const p=v.local(side*(v.S.r+.8),0,a===G.me?0:rnd(2)-1);let y=G.W.groundBelow(p.x,v.pos.y+3,p.z);if(!G.W.free(p.x,y+.05,p.z,.38,1.8)){p.copy(v.local(0,0,v.S.r+1.5));y=G.W.groundBelow(p.x,v.pos.y+3,p.z);}
 a.pos.set(p.x,y+.05,p.z);a.vel.copy(v.vel).multiplyScalar(.5);a.onGround=false;a.model.root.visible=a!==G.me;if(a.guns[a.weapons[a.wi]?.id])a.model.setGun(a.guns[a.weapons[a.wi].id]);
 if(a===G.me){a.yaw=G.camYaw;a.pitch=cl(G.camPitch,-1.2,1.2);snd.play('enter');setWeapon(a,a.wi);for(const k of['gunner','passenger']){const m=v.seats[k];if(m&&!force&&v.speed<6)exitVehicle(m);}}}
function stepVehicles(dt){const me=G.me;for(const v of G.vehicles){if(v.dead){v.deadT=(v.deadT||0)+dt;if(Math.random()<dt*12)smoke.emit(v.pos.x+rnd(2)-1,v.pos.y+1.5,v.pos.z+rnd(2)-1,rnd(1)-.5,2+rnd(1.5),rnd(1)-.5,.12,.11,.1,1.6,3,-.6,.4);v.step(dt,{thr:0,steer:0},G.W);v.visuals(dt,G.W);continue;}
  const drv=v.seats.driver;let inp={thr:0,steer:0,handbrake:false};
  if(drv===me&&me.alive&&G.phase==='play'){const i=me.inp;inp={thr:i.fwd,steer:i.side,aimYaw:G.camYaw,handbrake:i.jump};if(i.sprint&&v.kind==='buggy'&&v.boostT<-2){v.boostT=1.6;snd.play('jetPuff',null);}}
  v.step(dt,inp,G.W);
  if(v.impact>7&&drv===me){snd.play('crash',v.pos);G.shake=Math.max(G.shake,Math.min(.6,v.impact/30));damageVehicle(v,(v.impact-7)*6,null);}
  if(v.landV>8){snd.play('land',v.pos,1,v.landV);v.landV=0;}
  // splatter
  if(v.speed>5)for(const a of G.actors){if(!a.alive||a.seat||a.K.fixed)continue;const ap=a.pos;const d=Math.hypot(ap.x-v.pos.x,ap.z-v.pos.z);if(d>v.S.r+a.K.r||Math.abs(ap.y-v.pos.y)>2.5)continue;tv.subVectors(ap,v.pos).setY(0).normalize();
   if(a.team!==v.team){const big=a.K.boss||a.kind==='ravager';damage(a,v.speed*(big?3:14)*(v.kind==='tank'?1.6:1),drv||null,{weapon:'splat',point:ap.clone().setY(ap.y+1),dir:tv.clone()});a.vel.addScaledVector(tv,v.speed*(big?.2:.8));a.vel.y+=big?1:5;a.onGround=false;if(!a.alive)snd.play('splat',ap);if(big){v.vel.multiplyScalar(.5);damageVehicle(v,40,a);}}
   else{a.pos.x=v.pos.x+tv.x*(v.S.r+a.K.r+.05);a.pos.z=v.pos.z+tv.z*(v.S.r+a.K.r+.05);}}
  // turret aim: tank follows the camera, buggy gunner tracks targets
  if(v.kind==='tank'&&drv===me){const tgt=G.aimPoint;const mp=v.muzzleWorld(new V());const ty=Math.atan2(-(tgt.x-v.pos.x),-(tgt.z-v.pos.z));v.tYaw+=cl(wrapA(ty-v.tYaw),-1.6*dt,1.6*dt);
   const lp=v.local(0,2.85,0);const tp=Math.atan2(tgt.y-lp.y,Math.hypot(tgt.x-lp.x,tgt.z-lp.z))-v.pitch*Math.cos(wrapA(v.tYaw-v.yaw));v.tPitch=damp(v.tPitch,cl(tp,-.2,.5),8,dt);
   if(me.inp.fire&&v.fireCD<=0&&G.phase==='play'){v.fireCD=2.1;const dir=dirOf(v.tYaw,v.tPitch+v.pitch*Math.cos(wrapA(v.tYaw-v.yaw)),new V());const mzw=v.muzzleWorld(new V());spawnRocket(me,mzw,dir,WPN.rocket,{speed:140,dmg:320,r:7.5,veh:v});snd.play('cannon');G.shake=Math.max(G.shake,.5);
    parts.burst(mzw,40,10,[C(3.4,2,.6),C(2.6,1.2,.3)],.25,.3,{dir,spread:.5,grav:0});for(let k=0;k<14;k++)smoke.emit(mzw.x,mzw.y,mzw.z,dir.x*6+rnd(2)-1,dir.y*6+rnd(2),dir.z*6+rnd(2)-1,.5,.48,.45,1,1.6,-.2,1.6);lights.flash(mzw,0xffa040,60,20,.12);v.vel.addScaledVector(dir,-1.5);G.stats.shots++;G.shotHit=false;}
   if(me.inp.zoom&&v.mgCD<=0&&G.phase==='play'){v.mgCD=.08;const mzw=v.muzzleWorld(new V(),true);const eye=cam.position.clone(),fw=dirOf(G.camYaw,G.camPitch,new V());eye.addScaledVector(fw,v.S.cam[0]);fw.x+=rnd(.03)-.015;fw.y+=rnd(.03)-.015;fw.normalize();hitscan(me,eye,fw,mzw,11,160,[2.6,1.8,.6]);snd.play('chain',null,.6);}}
  const gun=v.seats.gunner;if(v.kind==='buggy'&&gun&&gun.alive){let best=null,bd=80;const gp=v.local(0,2.4,1.55);for(const a of G.actors){if(!a.alive||a.team===0)continue;const d=a.pos.distanceTo(gp);if(d<bd&&G.W.los(gp,tv.copy(a.pos).setY(a.pos.y+a.K.h*.6))){bd=d;best=a;}}
   if(best){const tp=tv.copy(best.pos).setY(best.pos.y+best.K.h*.55).addScaledVector(best.vel,bd/300);const ty=Math.atan2(-(tp.x-gp.x),-(tp.z-gp.z));v.tYaw+=cl(wrapA(ty-v.tYaw),-3*dt,3*dt);v.tPitch=damp(v.tPitch,cl(Math.atan2(tp.y-gp.y,Math.hypot(tp.x-gp.x,tp.z-gp.z)),-.4,.7),6,dt);
    const err=Math.abs(wrapA(ty-v.tYaw));gun.yaw=v.tYaw;gun.pitch=v.tPitch;if(err<.12&&v.mgCD<=0&&G.phase==='play'){v.mgCD=.075;v.spin=Math.min(40,v.spin+6);const mzw=v.muzzleWorld(new V());const fw=dirOf(v.tYaw,v.tPitch,new V());fw.x+=rnd(.05)-.025;fw.y+=rnd(.04)-.02;fw.z+=rnd(.05)-.025;fw.normalize();
     hitscan(gun,gp.clone(),fw,mzw,9,110,[3,1.8,.5]);snd.play('chain',v.pos,.8);}}
   else{v.tYaw+=wrapA(v.yaw-v.tYaw)*(1-Math.exp(-dt*2));v.tPitch=damp(v.tPitch,0,2,dt);}}
  else if(v.kind==='buggy'&&!gun)v.tYaw+=wrapA(v.yaw-v.tYaw)*(1-Math.exp(-dt*2));
  v.visuals(dt,G.W);}}
function hitscan(f,eye,fw,mz,dmg,range,tc){const ho={n:new V()};const wt=G.W.ray(eye,fw,range,ho);const vh=rayVehicles(eye,fw,wt,f.veh);const lim=vh?vh.t:wt;const h=rayActors(eye,fw,lim,f)[0];let end=lim;
 if(h&&h.f.team!==f.team){damage(h.f,dmg,f,{point:eye.clone().addScaledVector(fw,h.t),dir:fw,head:h.head,weapon:'chain'});end=h.t;0;}
 beams.tracer(mz,eye.clone().addScaledVector(fw,end),tc,.03,300,7);if(end>=wt&&wt<range)impact(eye.clone().addScaledVector(fw,wt),ho.n,{tr:tc},'chain',ho.terrain);if(f===G.me){G.stats.shots++;G.shotHit=false;};f.lastFire=G.time;G.noise={p:f.pos.clone(),t:G.time,who:f};}

/* ================= objectives (conduits, pylons, barrier, door, landers) ================= */
function damageObj(o,amount,att){if(o.done)return;if(att&&att.team===1)return;o.hp-=amount;o.hitT=.15;if(o.hp<=0){o.done=true;if(o.col){G.W.remove(o.col);o.col=null;}const p=o.p.clone();p.y+=10;explode(p,null,0,9,0,'rocket');parts.burst(p,200,26,[C(3.2,.8,3),C(2,.6,2.6),C(3,2.6,3)],.6,1.2,{grav:6});
  shocks.fire(p,C(1.6,.4,1.6),24,.8);snd.play('boom');snd.play('cannon',p);const u=o.mesh.userData;u.body.visible=false;u.debris.visible=true;G.stats.score+=600;G.shake=Math.max(G.shake,.7);hud.toast('PYLON DESTROYED',2);}}
function setupObjs(){for(const o of G.D.objs){o.done=false;o.hold=0;if(o.type==='pylon'){o.hp=o.hp0??(o.hp0=o.hp);if(o.col)G.W.remove(o.col);o.col=G.W.cyl(o.p.x,o.p.y-1,o.p.z,2.4,o.p.y+19,{pylon:o});const u=o.mesh.userData;u.body.visible=true;u.debris.visible=false;}
  if(o.type==='barrier'){o.boxes=[];const n=40,r=o.r;for(let i=0;i<n;i++){const a=i/n*Math.PI*2,x=o.p.x+Math.cos(a)*r,z=o.p.z+Math.sin(a)*r;o.boxes.push(G.W.box(x-3,o.p.y-4,z-3,x+3,o.p.y+30,z+3,{barrier:1}));}o.mesh.visible=true;o.mesh.userData.U.uA.value=1;}
  if(o.type==='conduit'){o.mesh.userData.cm.color.set(C(.6,2,3.6));}}}
function updateObjs(dt){const me=G.me;let prompt=null;for(const o of G.D.objs){const u=o.mesh&&o.mesh.userData;if(!u)continue;
  if(o.type==='relay'){u.blink.visible=Math.sin(G.time*5)>0;u.screen.material.color.setRGB(.4,1.6+G.progress,2.2);}
  else if(o.type==='conduit'){u.rings.forEach((r,i)=>{const k=(G.time*.4+i/3)%1;r.position.y=1+k*8;r.scale.setScalar(o.done?.6:1-k*.3);});if(o.done){u.cm.color.set(C(1.6,.1,.1));u.core.scale.x=u.core.scale.z=.4;}
   else if(me&&me.alive&&!me.veh&&G.step&&/CONDUIT/.test(G.step.obj||'')&&Math.hypot(me.pos.x-o.p.x,me.pos.z-o.p.z)<4){prompt='HOLD <kbd>E</kbd> TO CUT THE CONDUIT';if(me.inp.interact){o.hold+=dt;if(o.hold>1.4){o.done=true;snd.play('interact');shocks.fire(o.p.clone().setY(o.p.y+5),C(.6,1.6,3),8,.6);parts.burst(o.p.clone().setY(o.p.y+5),90,12,[C(.6,2,3.4),C(3,3,3)],.3,.8,{grav:5});hud.toast('CONDUIT CUT',1.6);G.stats.score+=300;}}else o.hold=Math.max(0,o.hold-dt*2);
    if(o.hold>0)prompt=`CUTTING CONDUIT ${Math.round(o.hold/1.4*100)}%`;}}
  else if(o.type==='pylon'){if(!o.done){u.crystal.rotation.y+=dt;u.crystal.position.y=22+Math.sin(G.time*1.6)*.6;u.crystal.material.color.set(o.hitT>0?C(4,4,4):C(3.4,.8,3.2));o.hitT-=dt;}}
  else if(o.type==='station'){u.core.rotation.y+=dt*.7;u.core.rotation.x+=dt*.4;}
  else if(o.type==='barrier'){u.U.uT.value=G.time;if(o.dropT!==undefined){o.dropT+=dt;u.U.uA.value=Math.max(0,1-o.dropT/1.5)*(Math.random()<.5?1:.3);if(o.dropT>1.5)o.mesh.visible=false;}else{const n=G.D.objs.filter(x=>x.type==='pylon'&&x.done).length;u.U.uA.value=(1-n*.22)*(n?(Math.random()<.9?1:.2):1);}}
  else if(o.type==='lift'){u.col.material.opacity=.25+Math.sin(G.time*3)*.1;}}
 for(const d of G.S.doors){if(d.open){d.m.position.y=Math.max(d.y0-5,d.m.position.y-dt*3);}}
 G.objPrompt=prompt;}
const landerPool=[];
function lander(gid,human){const g=G.D.groups[gid];if(!g)return;const m=landerModel(human);scene.add(m);const a=Math.random()*Math.PI*2;const hover=new V(g.x,G.W.H(g.x,g.z)+13,g.z);const from=hover.clone().add(new V(Math.cos(a)*260,90,Math.sin(a)*260));
 G.landers.push({m,g,hover,from,to:hover.clone().add(new V(-Math.cos(a)*260,120,-Math.sin(a)*260)),t:0,dropped:false,human,yaw:Math.atan2(-(hover.x-from.x),-(hover.z-from.z))});snd.play('lander',hover);}
function updateLanders(dt){for(let i=G.landers.length-1;i>=0;i--){const L=G.landers[i];L.t+=dt;const m=L.m;let p;
  if(L.t<6){const k=L.t/6,e=1-Math.pow(1-k,3);p=tv.lerpVectors(L.from,L.hover,e);}else if(L.t<11){p=tv.copy(L.hover);p.y+=Math.sin(L.t*2)*.3;if(!L.dropped&&L.t>6.6){L.dropped=true;if(L.human)squadReinforce(L.g);else spawnGroup(L.g.id,{drop:L.hover,alert:true,leash:999});}}
  else if(L.t<17){const k=(L.t-11)/6;p=tv.lerpVectors(L.hover,L.to,k*k);}else{scene.remove(m);G.landers.splice(i,1);continue;}
  m.position.copy(p);m.rotation.set(L.t<6?.15*(1-L.t/6):L.t>11?-.2:0,L.yaw,0);m.userData.beam.visible=L.t>6.3&&L.t<10.5;if(Math.random()<dt*20&&L.t>5&&L.t<11)smoke.emit(p.x+rnd(6)-3,G.W.H(p.x,p.z)+.3,p.z+rnd(6)-3,rnd(4)-2,.5,rnd(4)-2,.5,.45,.4,1.5,1.5,-.1,.8);}}
function rift(gid){const g=G.D.groups[gid];if(!g)return;const p=new V(g.x,G.W.H(g.x,g.z)+1.5,g.z);shocks.fire(p,C(1.6,.5,2.4),8,.7);parts.burst(p,120,10,[C(2.4,.8,3.4),C(3,2.4,3.4)],.3,.8,{grav:2});lights.flash(p,0xa060ff,60,24,.6);snd.play('tele',p);spawnGroup(gid,{alert:true,leash:999});}

/* ================= spawning ================= */
function spawnGroup(id,o={}){const g=G.D.groups[id];if(!g)return[];const out=[];let i=0;
 for(const[kind,n0]of g.units){const n=kind==='skitter'&&G.opt.diff>=2?n0+1:kind==='skitter'&&G.opt.diff===0?Math.max(1,n0-1):n0;
  for(let k=0;k<n;k++){const a=makeActor(kind,1,{group:id,alert:o.alert,home:new V(g.x,0,g.z),leash:o.leash??(g.leash||48)});const ang=(i++/Math.max(1,6))*Math.PI*2+rnd(.6),rr=kind==='turret'?g.r*.8:rnd(g.r);
   let x=g.x+Math.cos(ang)*rr,z=g.z+Math.sin(ang)*rr;if(o.drop){x=o.drop.x+rnd(5)-2.5;z=o.drop.z+rnd(5)-2.5;}const kk=G.W.nearest(new V(x,0,z));if(kk>=0&&!o.drop&&kind!=='turret'){const c=G.W.cpos(kk,new V());x=c.x+rnd(1)-.5;z=c.z+rnd(1)-.5;}
   placeOnGround(a,x,z);if(o.drop){a.pos.y=o.drop.y-2;a.vel.set(rnd(4)-2,-2,rnd(4)-2);}a.yaw=Math.random()*6.28;a.home.y=a.pos.y;out.push(a);
   if(G.me&&a.ai&&o.alert){a.ai.target=G.me;a.ai.lastPos.copy(G.me.pos);a.ai.lostT=2;}}}
 if(out.some(a=>a.kind==='ravager'||a.kind==='overseer'))snd.play('roar',out[0].pos);else if(out.length)snd.play('chitter',out[0].pos);return out;}
function spawnSquad(){const sp=G.D.squad;SQUAD.forEach((s,i)=>{if(!sp[i])return;const a=makeActor('marine',0,{name:s.n,squad:true,w:s.w});placeOnGround(a,sp[i].x,sp[i].z);a.yaw=G.D.start.yaw;});}
function squadReinforce(g){for(const s of SQUAD){let a=G.actors.find(x=>x.squad&&x.name===s.n);if(a&&a.alive)continue;if(a)removeActor(a);a=makeActor('marine',0,{name:s.n,squad:true,w:s.w});placeOnGround(a,g.x+rnd(6)-3,g.z+rnd(6)-3);a.pos.y+=6;a.vel.set(rnd(3)-1.5,-2,rnd(3)-1.5);}}
G.squadAnchor=f=>{if(f.boardVeh){const v=f.boardVeh.v;return{p:v.pos,r:2};}if(G.squadGoal&&G.squadGoal.t>G.time)return{p:G.squadGoal.p,r:G.squadGoal.r};const me=G.me;if(!me||!me.alive)return G.cp?{p:G.cp.pos,r:8}:null;return{p:me.veh?me.veh.pos:me.pos,r:me.veh?10:7};};
function stepSquadBoarding(){for(const a of G.actors){if(!a.boardVeh||!a.alive)continue;const{v,seat}=a.boardVeh;if(v.dead||!G.me.veh){a.boardVeh=null;continue;}if(a.pos.distanceTo(v.pos)<4.5||G.time-(a.boardT||(a.boardT=G.time))>12){a.boardVeh=null;a.boardT=0;enterVehicle(a,v,seat);G.radioOnce('board'+seat,a.name==='KESSLER'?'KESS':a.name,seat==='gunner'?'On the gun!':'Riding shotgun!');}}}

/* ================= mission script API ================= */
const groupAlive=id=>G.actors.filter(a=>a.group===id&&a.alive).length;
const MAPI={get t(){return G.stepT;},get f(){return G.f;},get diff(){return G.opt.diff;},set progress(v){G.progress=v;},get progress(){return G.progress;},
 say(w,t){G.radio(w,t);},spawn(id){return spawnGroup(id);},lander(id){lander(id,false);},rift(id){rift(id);},squadDrop(id){lander(id,true);},
 alive:groupAlive,aliveAll:()=>G.actors.filter(a=>a.team===1&&a.alive&&!a.K.fixed).length,
 groupPos(id){const g=G.D.groups[id];return new V(g.x,G.W.H(g.x,g.z),g.z);},P(k){const p=G.def.P[k];return new V(p[0],G.W.groundBelow(p[0],300,p[1]),p[1]);},
 squadPos(){const s=G.actors.filter(a=>a.squad&&a.alive);if(!s.length)return null;const p=new V();s.forEach(a=>p.add(a.pos));return p.divideScalar(s.length);},
 nearSquad(r){const p=MAPI.squadPos();return p&&G.me&&G.me.pos.distanceTo(p)<r;},nearP(p,r){if(!G.me)return false;const mp=G.me.veh?G.me.veh.pos:G.me.pos;return Math.hypot(mp.x-p.x,mp.z-p.z)<r;},
 playerZ(){return G.me?(G.me.veh?G.me.veh.pos.z:G.me.pos.z):0;},vehiclePos(k){const v=G.vehicles.find(v=>v.kind===k&&!v.dead);return v?v.pos.clone():null;},inVehicle(k){return!!(G.me&&G.me.veh&&G.me.veh.kind===k);},
 squadTo(p,r=6){if(p)G.squadGoal={p:p.clone(),r,t:G.time+25};},squadFollow(){G.squadGoal=null;},
 objDone(type){return G.D.objs.filter(o=>o.type===type&&o.done).length;},nextObj(type){const me=G.me;let best=null,bd=1e9;for(const o of G.D.objs)if(o.type===type&&!o.done){const d=me?o.p.distanceTo(me.pos):0;if(d<bd){bd=d;best=o;}}return best?best.p.clone().setY(best.p.y+(type==='pylon'?6:2)):null;},
 setObj(t){G.objText=t;hud.objective(t);snd.play('objective');},checkpoint(){checkpoint();},openDoor(){for(const d of G.S.doors){d.open=true;G.W.remove(d.s);}snd.play('tele');},
 dropBarrier(){for(const o of G.D.objs)if(o.type==='barrier'){for(const b of o.boxes)G.W.remove(b);o.dropT=0;}snd.play('shieldBreak');},bossPos(){return G.boss&&G.boss.alive?G.boss.pos.clone():null;},complete(){completeMission();}};
G.radio=(w,t)=>hud.radio(w,t);const once={};G.radioOnce=(k,w,t)=>{if(once[k])return;once[k]=1;G.radio(w,t);};

function enterStep(i){const st=G.def.steps[i];G.stepI=i;G.step=st;G.stepT=0;G.progress=0;if(!st)return;G.objText=st.obj;hud.objective(st.obj);if(i>0)snd.play('objective');if(st.cp&&i>0)checkpoint();st.enter&&st.enter(MAPI);}
function stepMission(dt){if(!G.step||G.step.done)return;G.stepT+=dt;const st=G.step;G.mark=st.mark?st.mark(MAPI):null;if(st.tick&&st.tick(MAPI))enterStep(G.stepI+1);}
function checkpoint(){const me=G.me;if(!me||!me.alive)return;const p=me.veh?me.veh.local(-(me.veh.S.r+1),0,0):me.pos.clone();p.y=G.W.groundBelow(p.x,p.y+3,p.z)+.05;
 G.cp={pos:p,yaw:me.veh?me.veh.yaw:me.yaw,weapons:me.weapons.map(w=>({...w})),nades:{...me.nades},stepI:G.stepI};if(G.stepI>0){hud.toast('CHECKPOINT... DONE',2.4);snd.play('checkpoint');}}
function respawnPlayer(){const me=G.me,cp=G.cp;me.alive=true;me.health=me.maxHp;me.shield=me.maxSh;me.shDelay=0;me.pos.copy(cp.pos);me.vel.set(0,0,0);me.yaw=cp.yaw;me.pitch=0;G.camYaw=cp.yaw;G.camPitch=0;me.lunge=null;
 me.weapons=cp.weapons.map(w=>({...w}));me.nades={...cp.nades};me.wi=0;setWeapon(me,0);me.model.revive();me.model.root.visible=false;G.snapCam=true;hud.flash(.5);snd.play('spawn');
 // clear enemies hugging the checkpoint so the revert is fair
 for(const a of G.actors)if(a.team===1&&a.alive&&a.pos.distanceTo(cp.pos)<10&&!a.K.boss&&!a.K.fixed){const k=G.W.randomNear(a.pos.clone().add(tv.subVectors(a.pos,cp.pos).setY(0).normalize().multiplyScalar(14)),4,new V());a.pos.copy(k);a.pos.y+=.1;}
 hud.toast('CHECKPOINT REVERTED',2);}

/* ================= mission flow ================= */
function newStats(){return{kills:{},score:0,heads:0,melee:0,splat:0,sticks:0,assist:0,deaths:0,lost:0,shots:0,hits:0,dmg:0};}
function clearWorld(){for(const a of G.actors)scene.remove(a.model.root);G.actors=[];G.me=null;G.boss=null;for(const it of G.items)scene.remove(it.mesh);G.items=[];for(const p of G.proj)killProj(p);G.proj=[];G.bolts=[];boltMesh.count=0;
 for(const L of G.landers)scene.remove(L.m);G.landers=[];parts.clear();smoke.clear();beams.clear();decals.clear();shocks.clear();lights.clear();G.squadGoal=null;G.cp=null;G.mark=null;G.progress=0;G.noise=null;for(const k in once)delete once[k];}
function setupMission(i,human){clearWorld();freshMission(i);const D=G.D;G.f={};G.time=0;G.clock=G.def.time;G.stats=newStats();G.deadT=0;G.endT=0;G.timeScale=1;G.phase='play';
 spawnVehicles();buildRacks();setupObjs();spawnSquad();
 if(human){const me=makeActor('vanguard',0,{human:true,name:'VANGUARD-09',w:'ar',w2:G.mi===1?'br':G.mi===2?'br':null});G.me=me;placeOnGround(me,D.start.x,D.start.z);me.yaw=D.start.yaw;G.camYaw=me.yaw;G.camPitch=0;me.model.root.visible=false;me.nades={frag:2,stick:1};
  if(G.mi===0){me.weapons=[freshWeapon('ar')];setWeapon(me,0);}VM.set(me.weapons[0].id);G.snapCam=true;enterStep(0);checkpoint();
  hud.title('MISSION '+G.def.n+' OF 3',G.def.name,G.def.sub,4.5);}
 else{G.stepI=-1;G.step=null;const g=Object.keys(D.groups)[0];spawnGroup(g,{alert:true});}}
function completeMission(){if(G.phase!=='play')return;G.phase='end';G.endT=0;G.missionWon=true;snd.play('streak');hud.title('MISSION COMPLETE',G.def.name,'',3.5);snd.music(false);}
function failMission(why){if(G.phase!=='play')return;G.phase='end';G.endT=0;G.missionWon=false;G.failWhy=why;snd.play('horn');hud.title('MISSION FAILED',why,'',3.5);snd.music(false);}
function missionScore(won){const s=G.stats;const kills=Object.values(s.kills).reduce((a,b)=>a+b,0);const squad=G.actors.filter(a=>a.squad&&a.alive).length;
 const base=s.score+(won?1500+Math.floor(G.clock)*3+squad*300:0)-s.deaths*250;return{kills,squad,pts:Math.max(0,Math.round(base*DMUL[G.opt.diff])),time:G.def.time-G.clock};}
function showMissionResults(){G.app='mres';unlock();$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.engine(false);
 const won=G.missionWon,sc=missionScore(won),s=G.stats;const acc=s.shots?Math.round(s.hits/s.shots*100)+'%':'—';
 const r={id:G.def.id,n:G.def.n,name:G.def.name,won,pts:sc.pts,kills:sc.kills,byKind:{...s.kills},deaths:s.deaths,squad:sc.squad,time:sc.time,acc,heads:s.heads};G.camp.missions.push(r);G.mres=r;
 $('meye').textContent=`MISSION ${G.def.n} OF 3 · ${DIFF[G.opt.diff].n}`;$('mres1').textContent=won?G.def.name+' — COMPLETE':'MISSION FAILED';$('mres1').style.color=won?'':'#ff5a3a';
 $('mres2').textContent=won?(G.def.n<3?'NEXT: '+MISSIONS[G.mi+1].name+' — '+MISSIONS[G.mi+1].sub:'THE KYRR GRIP ON HALCYON VERGE IS BROKEN'):(G.failWhy||'');
 const k=s.kills;const cell=(a,b)=>`<div><p>${a}</p><b>${b}</b></div>`;
 $('mstats').innerHTML=cell('SCORE',sc.pts)+cell('TIME',fmt(sc.time))+cell('KILLS',sc.kills)+cell('ACCURACY',acc)+cell('SKITTERS',k.skitter||0)+cell('WARDENS',(k.warden||0)+(k.wardenR||0))+cell('RAVAGERS',(k.ravager||0)+(k.overseer||0))+cell('TURRETS',k.turret||0)
  +cell('HEADSHOTS',s.heads)+cell('SPLATTERS',s.splat)+cell('DEATHS',s.deaths)+cell('SQUAD ALIVE',sc.squad+' / 4');
 $('mnext').hidden=!won;$('mnext').textContent=G.mi<2?'CONTINUE TO MISSION '+(G.mi+2):'CAMPAIGN RESULTS';$('mres').hidden=false;G.results={mission:r};}
function showCampaign(){G.app='over';unlock();$('mres').hidden=true;$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');const c=G.camp,ms=c.missions;
 const total=ms.reduce((a,m)=>a+m.pts,0),won=ms.length>0&&ms.every(m=>m.won)&&ms.at(-1).n===3,kills=ms.reduce((a,m)=>a+m.kills,0),deaths=ms.reduce((a,m)=>a+m.deaths,0);
 const per=(total-deaths*300)/Math.max(1,ms.length);const rank=!ms.some(m=>m.won)?'D':won&&per>9000&&deaths<=5?'S':per>6500?'A':per>4000?'B':'C';
 $('oeye').textContent=`CAMPAIGN ${won?'COMPLETE':'ENDED'} · ${DIFF[G.opt.diff].n}`;$('orank').textContent=rank;$('ores').textContent=won?'HALCYON VERGE SECURED':ms.filter(m=>m.won).length+' OF 3 MISSIONS WON';
 $('ofs').textContent=`${total} PTS · ${kills} KYRR DOWN · ${deaths} DEATHS`;
 $('stats').innerHTML='<tr><th>MISSION</th><th>RESULT</th><th>TIME</th><th>KILLS</th><th>ACCURACY</th><th>DEATHS</th><th>SQUAD</th><th>SCORE</th></tr>'+ms.map(m=>`<tr><td>${m.n} · ${m.name}</td><td>${m.won?'COMPLETE':'FAILED'}</td><td>${fmt(m.time)}</td><td>${m.kills}</td><td>${m.acc}</td><td>${m.deaths}</td><td>${m.squad}/4</td><td>${m.pts}</td></tr>`).join('')+
  `<tr class="tot"><td>TOTAL</td><td>${rank} RANK</td><td>${fmt(ms.reduce((a,m)=>a+m.time,0))}</td><td>${kills}</td><td></td><td>${deaths}</td><td></td><td>${total}</td></tr>`;
 const tok=5+Math.min(80,total/300|0);addRound(tok,won);saveBest('starfall',total);lastAward={pts:total,won,rank,kills,deaths,diff:DIFF[G.opt.diff].n,missions:ms.map(m=>m.name+(m.won?'':' (failed)')).join(', ')};
 $('otok').textContent=`+${tok} TOKENS · BEST ${bestScore('starfall')} PTS`;$('over').hidden=false;G.results={...(G.results||{}),campaign:{total,won,rank,missions:ms.length,kills,deaths,tok}};}
let lastAward=null;

/* ================= app flow ================= */
function start(o={}){if(o.mission!=null){o={...o,mis:o.mission};delete o.mission;}if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 G.camp={missions:[],start:G.opt.mis};startMission(G.opt.mis);}
function startMission(i){G.attract=false;G.app='play';G.results=null;setupMission(i,true);$('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=$('mres').hidden=true;$('hud').hidden=false;$('mname').textContent='MISSION '+G.def.n+' · '+G.def.name;
 document.body.classList.add('playing');hud.reset();hud.objective(G.step.obj);$('lock').hidden=false;lock();snd.music(G.opt.mus>0,0);}
function attractMode(){G.app='menu';G.attract=true;setupMission(G.opt.mis,false);$('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=$('mres').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.music(false);snd.engine(false);showBest();}
function toMenu(){unlock();attractMode();}

/* ================= main step ================= */
function stepGame(dt){
 if(G.phase==='play'&&!G.attract){G.clock-=dt;if(G.clock<=0){G.clock=0;failMission('OUT OF TIME');}stepMission(dt);
  if(G.me&&!G.me.alive){G.deadT-=dt;if(G.deadT<=0&&G.phase==='play')respawnPlayer();}}
 else if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.2?.4:1;if(G.endT>4.2&&!G.attract){G.timeScale=1;showMissionResults();}}
 const sdt=dt*G.timeScale;
 for(const a of G.actors){if(a.ai&&a.alive&&!a.seat)think(a,G,sdt);else if(a.ai&&a.seat){a.inp=blankInput();if(a.seat==='passenger')think(a,G,sdt),a.inp.fwd=a.inp.side=0;}}
 stepSquadBoarding();stepVehicles(sdt);
 for(const a of G.actors)stepActor(a,sdt);
 // separation so crowds do not overlap
 for(let i=0;i<G.actors.length;i++){const a=G.actors[i];if(!a.alive||a.seat||a.K.fixed)continue;for(let j=i+1;j<G.actors.length;j++){const b=G.actors[j];if(!b.alive||b.seat)continue;const dx=b.pos.x-a.pos.x,dz=b.pos.z-a.pos.z,r=a.K.r+b.K.r;const d2=dx*dx+dz*dz;if(d2<r*r&&d2>1e-6&&Math.abs(a.pos.y-b.pos.y)<1.5){const d=Math.sqrt(d2),k=(r-d)*.5/d;if(!b.K.fixed){b.pos.x+=dx*k;b.pos.z+=dz*k;}a.pos.x-=dx*k;a.pos.z-=dz*k;}}}
 // corpses fade + cleanup
 for(let i=G.actors.length-1;i>=0;i--){const a=G.actors[i];if(!a.alive&&a!==G.me&&a.deadT>7){removeActor(a);}}
 updateBolts(sdt);updateProj(sdt);updateItems(sdt);updateObjs(sdt);updateLanders(sdt);}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}if(G.app==='mres'||G.app==='over'){G.time+=dt;visuals(dt);return;}
 G.time+=dt*G.timeScale;readInput(dt);if(G.app==='play'||G.app==='menu')stepGame(dt);visuals(dt*G.timeScale);}

/* ================= visuals: camera, viewmodel, fx ================= */
let orbitA=0;const camPos=new V();G.aimPoint=new V();
function visuals(dt){parts.update(dt);smoke.update(dt);beams.update(dt);shocks.update(dt);decals.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);
 for(const a of G.actors){if(a===G.me&&a.alive&&!a.veh&&G.app==='play')continue;if(a.hidden)continue;a.seatYaw=a.veh?(a.seat==='gunner'?a.veh.tYaw:a.veh.yaw):undefined;a.model.pose(a,dt,G.time);
  if(a.seat&&a.veh){a.model.root.rotation.y=a.seatYaw;}}
 // ambient emitters (pod fire, flares)
 G.emitT-=dt;if(G.emitT<=0&&G.S){G.emitT=.05;for(const e of G.S.emit){if(e.k==='fire'){parts.emit(e.p.x+rnd(1.6)-.8,e.p.y-1,e.p.z+rnd(1.6)-.8,rnd(1)-.5,2+rnd(2),rnd(1)-.5,3,1.2,.3,.5,.5,-1);smoke.emit(e.p.x+rnd(1)-.5,e.p.y,e.p.z+rnd(1)-.5,rnd(1)-.5,2.5+rnd(1),rnd(1)-.5,.1,.09,.08,1.6,4,-.3,.3);}else parts.emit(e.p.x,e.p.y,e.p.z,rnd(.6)-.3,1.5,rnd(.6)-.3,3,.4,.2,.25,.6,-1);}}
 G.shake=Math.max(0,G.shake-dt*2.4);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);
 const me=G.me;const aspect=innerWidth/innerHeight;
 if((G.app==='play'||G.app==='paused')&&me){const v=me.veh;
  if(me.alive&&!v){me.landDip=Math.max(0,me.landDip-dt*1.4);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=me.onGround?Math.sin(G.time*sp*1.1)*Math.min(1,sp/9)*.03:0;
   const eyeT=me.crouch?PHY.eyeC:PHY.eye;me.eyeH=G.snapCam?eyeT:damp(me.eyeH||eyeT,eyeT,12,dt);G.snapCam=false;
   cam.position.set(me.pos.x,me.pos.y+me.eyeH-me.landDip+bob,me.pos.z);const s=G.shake*G.shake*.05;G.camYaw=me.yaw;G.camPitch=me.pitch;
   cam.rotation.set(me.pitch+me.recoil+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,0);const w=me.weapons[me.wi],d=w&&WPN[w.id];
   const vf=2*Math.atan(Math.tan((G.opt.fov+(me.sprinting?5:0))*Math.PI/360)/aspect)*180/Math.PI;const zf=d?1+(d.zoom-1)*me.zoom:1;cam.fov=damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,18,dt);
   VM.root.visible=G.phase!=='end';if(w){VM.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,ground:me.onGround,sprint:me.sprinting,air:!me.onGround,reload:me.reloadT>0?1-me.reloadT/d.reload:-1,vent:w.vent>0?1-w.vent/d.vent:0,heat:w.heat||0,
    swap:me.swapT>0?(me.swapT>.2?(.42-me.swapT)/.22:me.swapT/.2):0,melee:me.meleeT>0?1-me.meleeT/.4:0,zoom:me.zoom,scope:d.scope});if(w.id==='ar')VM.screen(w.mag,d.mag);}
   mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else if(me.alive&&v){// third-person vehicle camera, collision-aware
   VM.root.visible=false;const[dist,hgt]=v.S.cam;const fw=dirOf(G.camYaw,G.camPitch,tv);const piv=tv2.copy(v.pos);piv.y+=hgt;const back=tv3.copy(fw).multiplyScalar(-1);const ho={n:new V()};let dd=G.W.ray(piv,back,dist,ho);dd=Math.max(2,dd-.4);
   const target=piv.clone().addScaledVector(back,dd);if(G.snapCam){cam.position.copy(target);G.snapCam=false;}else cam.position.lerp(target,1-Math.exp(-dt*14));const th=G.W.H(cam.position.x,cam.position.z)+.6;if(cam.position.y<th)cam.position.y=th;
   const s=G.shake*G.shake*.05;cam.rotation.set(G.camPitch+(Math.random()-.5)*s,G.camYaw+(Math.random()-.5)*s,0);const vf=2*Math.atan(Math.tan((G.opt.fov+Math.min(12,v.speed*.35))*Math.PI/360)/aspect)*180/Math.PI;cam.fov=damp(cam.fov,vf,6,dt);
   const ar=G.W.ray(piv,fw,400);G.aimPoint.copy(piv).addScaledVector(fw,ar);snd.engine(G.app==='play',cl(v.speed/v.S.max,0,1.2),v.kind==='tank');}
  else{// death cam
   tv.copy(me.pos).add(tv2.set(Math.sin(me.yaw)*4,3.6,Math.cos(me.yaw)*4));camPos.lerp(tv,1-Math.exp(-dt*3));if(camPos.distanceTo(tv)>12)camPos.copy(tv);cam.position.copy(camPos);
   const m=new THREE.Matrix4().lookAt(cam.position,tv2.copy(me.pos).setY(me.pos.y+.5),UP);cam.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m),1-Math.exp(-dt*4));VM.root.visible=false;cam.fov=damp(cam.fov,70,4,dt);}
  if(!v)snd.engine(false);
  snd.listener(cam.position.x,cam.position.y,cam.position.z,G.camYaw);
  // crosshair target
  const eye=v?cam.position.clone().addScaledVector(dirOf(G.camYaw,G.camPitch,new V()),v.S.cam[0]):cam.position,fw=dirOf(G.camYaw,G.camPitch,new V());const wt=G.W.ray(eye,fw,150);const h=me.alive?rayActors(eye,fw,wt,me)[0]:null;G.aimTarget=h?h.f:null;G.aimFoe=!!(h&&h.f.team!==me.team);G.aimAlly=!!(h&&h.f.team===me.team);}
 else if(G.app==='menu'||G.app==='mres'||G.app==='over'){VM.root.visible=false;orbitA+=dt*.045;const s=G.D.start,c=tv.set(s.x,0,s.z);if(G.def.id==='landfall')c.z-=34;if(G.def.id==='spire')c.z-=10;
  const r=G.def.id==='spire'?22:34;cam.position.set(c.x+Math.cos(orbitA)*r,G.W.H(c.x,c.z)+(G.def.id==='spire'?7:12)+Math.sin(orbitA*.7)*2,c.z+Math.sin(orbitA)*r);const ty=G.W.H(c.x+Math.cos(orbitA)*r,c.z+Math.sin(orbitA)*r)+2;if(cam.position.y<ty)cam.position.y=ty;
  cam.lookAt(c.x,G.W.H(c.x,c.z)+3,c.z);cam.fov=60;G.camYaw=cam.rotation.y;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);}
 if(G.S)G.S.follow(me&&me.alive?(me.veh?me.veh.pos:me.pos):cam.position);
 cam.aspect=aspect;cam.updateProjectionMatrix();
 if(G.app==='play'&&me){let pr='';if(me.alive&&G.phase==='play'){if(G.objPrompt)pr=G.objPrompt;else if(me.veh)pr=me.veh.speed<8?'':'';else{const vv=nearVehicle();if(vv)pr=`HOLD <kbd>E</kbd> TO DRIVE THE ${vv.S.name}`;else if(G.nearItem)pr=`HOLD <kbd>E</kbd> TO TAKE ${WPN[G.nearItem.id].name}`;}}
  hud.prompt(pr);cam.updateMatrixWorld();hud.update(dt,cam);}}
function nearVehicle(){const me=G.me;let best=null,bd=4.2;for(const v of G.vehicles){if(v.dead||v.seats.driver)continue;const d=Math.hypot(me.pos.x-v.pos.x,me.pos.z-v.pos.z)-v.S.r*.6;if(d<bd){bd=d;best=v;}}return best;}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','ControlLeft','KeyQ'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);}});
const {keys,edge,mouse,lock,unlock}=I,mouseVis={dx:0,dy:0};
let padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'){const i=me.inp;const w=me.weapons[me.wi];const zm=me.veh?1:1+me.zoom*((WPN[w?.id]?.zoom||1)-1);const sens=G.opt.sens*.0022/zm;
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.sprint=!!(keys.ShiftLeft||keys.ShiftRight);i.crouch=!!(keys.KeyC||keys.ControlLeft);i.fire=I.fire();i.zoom=mouse.r;
  i.reload=!!ed('KeyR');i.melee=!!(ed('KeyF')||ed('KeyV'));i.nade=!!ed('KeyQ');i.swap=!!(ed('Digit1')&&me.wi!==0||ed('Digit2')&&me.wi!==1||mouse.wheel!==0);mouse.wheel=0;i.interact=!!keys.KeyE;
  if(ed('KeyX'))me.nadeSel=me.nadeSel==='frag'?'stick':'frag';
  if(I.locked&&me.alive){if(me.veh){G.camYaw-=mouse.dx*sens;G.camPitch=cl(G.camPitch-mouse.dy*sens,-.9,.6);}else{me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.5,1.5);}}mouseVis.dx+=mouse.dx;mouseVis.dy+=mouse.dy;mouse.dx=mouse.dy=0;
  const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,pr=padPrev;const P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0);if(me.veh){G.camYaw-=lx*Math.abs(lx)*3*G.opt.sens*dt;G.camPitch=cl(G.camPitch-ly*Math.abs(ly)*2*G.opt.sens*dt,-.9,.6);}else{const zf=1+me.zoom*2;me.yaw-=lx*Math.abs(lx)*3.4*G.opt.sens*dt/zf;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.6*G.opt.sens*dt/zf,-1.5,1.5);}
   if(P(0))i.jump=true;if(P(0)&&!pr[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;if((b[6]?.value||0)>.3)i.zoom=true;if(P(1))i.crouch=true;if(P(10))i.sprint=true;
   if(P(2)&&!pr[2])i.reload=true;if(P(2))i.interact=true;if(P(3)&&!pr[3])i.swap=true;if(P(5)&&!pr[5])i.nade=true;if(P(4)&&!pr[4])me.nadeSel=me.nadeSel==='frag'?'stick':'frag';if(P(11)&&!pr[11])i.melee=true;if(P(9)&&!pr[9])pause(true);for(let k=0;k<17;k++)pr[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}
  // hold E: enter / exit vehicles, take weapons
  if(i.interact&&me.alive&&G.phase==='play'){me.swapHold+=dt;if(me.swapHold>.28&&me.swapHold<1){me.swapHold=2;if(me.veh){if(me.veh.speed<9)exitVehicle(me);}else{const v=nearVehicle();if(v)enterVehicle(me,v,'driver');else if(G.nearItem)takeItem(G.nearItem);}}}else me.swapHold=0;}
 else if(G.app==='paused'){const gp=gamepad();if(gp&&gp.buttons[9]?.pressed&&!padPrev[9])pause(false);if(gp)padPrev[9]=gp.buttons[9]?.pressed;}
 I.flush();}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('pobj').textContent='OBJECTIVE: '+(G.objText||'');$('lock').hidden=true;document.body.classList.remove('playing');unlock();snd.engine(false);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.85));fxStack=null;fxSize='';applyGfxToScene();R.shadowMap.needsUpdate=true;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.5,saturation:T.sat,tint:T.tint,vignette:.34,grain:.022,aoStrength:.6,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade&&G.me){const m=G.me;const hp=G.app==='play'&&m.alive?Math.min(1,(m.health+m.shield)/120):1;fxStack.grade.uniforms.sat.value=T.sat*(.55+.45*hp);}
 cam.updateMatrixWorld();if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);if(VM.root.visible&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(vmScene,vmCam);R.autoClear=true;}}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-diff','diff',true,showBest);seg('o-mis','mis',true,()=>{if(G.app==='menu')attractMode();});seg('o-sens','sens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app==='play',0);});
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;$('restart').onclick=()=>{$('pause').hidden=true;startMission(G.mi);};
$('mnext').onclick=()=>{if(G.mi<2)startMission(G.mi+1);else showCampaign();};$('mretry').onclick=()=>{G.camp.missions.pop();startMission(G.mi);};$('mend').onclick=()=>showCampaign();
postButton($('post'),'starfall',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Starfall Vanguard\nPoints: ${a.pts||0}\nResult: ${a.won?'campaign complete':'campaign ended'} · rank ${a.rank||'-'}\nKills: ${a.kills||0} · Deaths: ${a.deaths||0}\nDifficulty: ${a.diff||''}\nMissions: ${a.missions||''}`];});
function showBest(){seg.sync();const b=bestScore('starfall');$('best').textContent=b?`YOUR BEST CAMPAIGN · ${b} PTS`:'';const m=MISSIONS[G.opt.mis];$('mapdesc').innerHTML=`<b>MISSION ${m.n} · ${m.name}</b> — ${m.brief} <b>${fmt(m.time)}</b> time limit.`;}

/* ================= boot ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.STARFALL={G,step,render,start,startMission,toMenu,pause,visuals:dt=>visuals(dt),
 get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},get score(){return G.stats?missionScore(G.phase==='end'?G.missionWon:false).pts:0;},
 get me(){return G.me;},get player(){return G.me;},get actors(){return G.actors;},get bots(){return G.actors.filter(a=>a.ai);},get enemies(){return G.actors.filter(a=>a.team===1);},get squad(){return G.actors.filter(a=>a.squad);},
 get vehicles(){return G.vehicles;},get mission(){return G.def.id;},get stepI(){return G.stepI;},get objective(){return G.objText;},get clock(){return G.clock;},setClock(s){G.clock=s;},get stats(){return G.stats;},get results(){return G.results;},get camp(){return G.camp;},
 get W(){return G.W;},get D(){return G.D;},scene,cam,R,VM,snd,setQuality:applyQuality,get gfx(){return gfx;},
 nextStep(){enterStep(G.stepI+1);},complete:completeMission,fail:failMission,showCampaign,
 killGroup(id){for(const a of G.actors)if(a.team===1&&a.alive&&(!id||a.group===id))damage(a,99999,G.me,{weapon:'ar',point:a.pos.clone()});},
 damage(a,n,b){damage(a,n,b||null,{weapon:'ar',point:a.pos.clone()});},teleport(x,y,z){const me=G.me;if(me.veh)exitVehicle(me);if(y==null){y=G.W.groundBelow(x,me.pos.y+3,z);if(!(y>G.W.H(x,z)-.2))y=G.W.groundBelow(x,400,z);}me.pos.set(x,y+.05,z);me.vel.set(0,0,0);G.snapCam=true;},
 look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;G.camYaw=yaw;G.camPitch=pitch;},aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+t.K.h*.6);const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));G.camYaw=me.yaw;G.camPitch=me.pitch;},
 enter(kind){const v=G.vehicles.find(v=>v.kind===kind&&!v.dead);if(v){G.me.pos.copy(v.pos);return enterVehicle(G.me,v,'driver');}return false;},exit(){exitVehicle(G.me);},give(id){const me=G.me;const w=freshWeapon(id);if(me.weapons.length<2)me.weapons.push(w);else me.weapons[me.wi]=w;setWeapon(me,me.weapons.indexOf(w));},
 cutConduits(){for(const o of G.D.objs)if(o.type==='conduit')o.done=true;},destroyPylons(){for(const o of G.D.objs)if(o.type==='pylon')damageObj(o,1e6,G.me);},
 input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},keys,mouse,setCamPitch(p){G.camPitch=p;},setCamYaw(y){G.camYaw=y;}};
