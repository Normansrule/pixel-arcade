// HARDFALL — pilots-and-frames FPS vs CPU. Original game for Pixel Arcade.
// Pilots: wall-run, double jump, slide, mantle; VX rifle, Mauler shotgun, Seeker smart pistol, frags, kick.
// Frame meter fills from time and kills; call a BULWARK frame down from orbit, board it (embark cinematic), fight with chaingun,
// salvo rockets, aegis shield, dash and punch; eject when the hull fails. 6v6 Attrition with grunts on two maps.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,cl,rnd,rr,wrapA,damp,fmt} from './util.js';
import {MAPS,buildMap,FR} from './maps.js';
import {PHY} from './world.js';
import {buildScene} from './scene.js';
import {Soldier3D,Mech3D} from './actors.js';
import {WPN,PILOT_KIT,NADE,MECH,gunModel,Viewmodel,Cockpit} from './weapons.js';
import {Particles,Beams,Shocks,Decals,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {BOTDIFF,CALLSIGNS,newBrain,think} from './ai.js';
import {HUD,TEAMCSS,TEAMN} from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),C=(r,g,b)=>new THREE.Color(r,g,b);
const TEAMS=[{n:'KESTREL',armor:0x34557e,glow:0x58b8ff,mech:0x4c6c90,grunt:0x4a5a6a},{n:'ASHEN',armor:0x8a4426,glow:0xff8a40,mech:0x94603c,grunt:0x7a5a44}];
const CAPS=[150,250,400],PTS={pilot:5,grunt:1,frame:10},PER_TEAM=6,GRUNTS=4,RESP=4,GRUNT_RESP=11;
const MULTI=[null,null,'DOUBLE KILL','TRIPLE KILL','QUAD KILL','MEGA KILL'];
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.06,9000);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xffe8d8,0x303848,1.3),vmKey=new THREE.DirectionalLight(0xffffff,1.8),vmRim=new THREE.DirectionalLight(0xffa060,1.1);vmKey.position.set(-1,2,1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmRim);
const VM=new Viewmodel(vmCam),CK=new Cockpit(vmCam);const snd=new Sound();
const parts=new Particles(scene,5000),smoke=new Particles(scene,1800,true),beams=new Beams(scene,160),shocks=new Shocks(scene,10),decals=new Decals(scene,160),lights=new LightPool(scene,5);

/* ================= state ================= */
const G={app:'menu',phase:'countdown',opt:{map:0,diff:1,time:10,cap:1,team:0,sens:1,fov:100,vol:.8,mus:.6,ann:1},fighters:[],mechs:[],beacons:[],me:null,time:0,clock:600,cdT:3,goT:0,endT:0,teamScore:[0,0],cap:250,
 D:null,W:null,WM:null,S:null,mapDef:MAPS[0],proj:[],noise:null,hurtFx:0,shake:0,attract:true,timeScale:1,annQ:[],aimTarget:null,aimFoe:false,aimAlly:false,results:null,cine:null,firstBlood:false};
const saveOpt=stored('pxd_hardfall_opt',G.opt);
G.enemy=(a,b)=>a!==b&&a.team!==b.team;G.mechOf=f=>G.mechs.find(m=>m.owner===f&&m.state!=='dead')||null;
const hud=new HUD(G);

/* ================= maps ================= */
const mapCache={};let gfx=quality();
function loadMap(i){const def=MAPS[i];if(G.S)scene.remove(G.S.root);let m=mapCache[i];if(!m){const D=buildMap(def);const S=buildScene(D,R,gfx);m=mapCache[i]={D,S};S.floorMesh=S.solidMeshes.filter(o=>o.material.userData.mirror);}
 m.S.sun.castShadow=gfx>0;m.S.mirror.on=gfx>0&&!!m.S.theme.refl;m.S.mirror.scale=gfx>=2?.5:.33;G.D=m.D;G.W=m.D.W;G.WM=m.D.WM;G.S=m.S;G.mapDef=def;scene.add(m.S.root);scene.environment=m.S.env;vmScene.environment=m.S.env;scene.fog=m.S.fog;scene.background=m.S.bg;fxStack=null;R.shadowMap.needsUpdate=true;
 for(const p of G.proj)killProj(p);G.proj=[];parts.clear();smoke.clear();beams.clear();decals.clear();shocks.clear();lights.clear();snd.ambience(def.theme);}

/* ================= fighters ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,sprint:false,slide:false,fire:false,zoom:false,reload:false,melee:false,nade:false,swap:false,swapTo:-1,interact:false,dash:false,shield:false,callMech:false});
function makeFighter(name,team,kind,human,diff){const T=TEAMS[team],grunt=kind==='grunt';
 const f={name,team,kind,human,pos:new V(),vel:new V(),yaw:0,pitch:0,r:PHY.r,h:PHY.h,onGround:false,inp:blankInput(),alive:false,respawnT:0,health:100,maxHp:grunt?60:100,regenT:0,weapons:[],wi:0,nades:2,nadeT:0,
  dbl:false,coyote:0,slideT:0,slideCD:0,fireCD:0,reloadT:0,swapT:0,swapTo:-1,swapMid:false,meleeT:0,meleeCD:0,nadeCD:0,zoom:0,spread:.01,lastFire:-9,airT:0,landDip:0,recoil:0,lastHitBy:null,lastHitT:-9,dmgBy:new Map(),stepT:0,spawnT:0,
  wallT:0,wallSide:0,wn:new V(),wallD:0,wallCD:0,wallLast:null,climbUsed:false,mantle:null,meter:0,mech:null,ejectT:0,locks:new Map(),interactHold:0,
  stats:{kills:0,grunts:0,frames:0,deaths:0,assists:0,pts:0,shots:0,hits:0,heads:0,dmg:0,medals:{},best:0},streak:0,multi:0,multiT:0,killedBy:null,killedWith:'',lastKiller:null,
  model:new Soldier3D(grunt?T.grunt:T.armor,T.glow,kind),ai:human?null:newBrain(BOTDIFF[diff]),guns:{}};
 f.model.root.visible=false;scene.add(f.model.root);G.fighters.push(f);return f;}
function clearFighters(){for(const f of G.fighters)scene.remove(f.model.root);G.fighters=[];G.me=null;for(const m of G.mechs)removeMech(m);G.mechs=[];for(const b of G.beacons)scene.remove(b.mesh);G.beacons=[];}
function setWeapon(f,i){f.wi=i;f.reloadT=0;f.zoom=0;f.locks.clear();const w=f.weapons[i];if(!w)return;if(!f.guns[w.id]){const g=gunModel(w.id);g.scale.setScalar(.85);f.guns[w.id]=g;}f.model.setGun(f.guns[w.id]);if(f===G.me)VM.set(w.id);}
function spawn(f){const D=G.D;let best=null,bs=-1e9;const cands=D.spawns.filter(s=>s.team===f.team||(s.team<0&&f.kind==='pilot'));
 for(const s of cands){let md=1e9,ally=1e9;for(const o of G.fighters){if(o===f||!o.alive)continue;const d=o.pos.distanceTo(s.p);if(G.enemy(f,o))md=Math.min(md,d);else ally=Math.min(ally,d);}for(const m of G.mechs)if(m.team!==f.team&&m.state==='piloted')md=Math.min(md,m.pos.distanceTo(s.p)*.7);
  let sc=Math.min(md,50)+rnd(12)+(s.team===f.team?12:0);if(md<16)sc-=50;if(ally<1.5)sc-=30;if(sc>bs){bs=sc;best=s;}}
 f.pos.copy(best.p);f.pos.x+=rnd(1.6)-.8;f.pos.z+=rnd(1.6)-.8;f.vel.set(0,0,0);f.yaw=best.yaw+rnd(.4)-.2;f.pitch=0;f.alive=true;f.health=f.maxHp;f.regenT=0;f.slideT=0;f.h=PHY.h;f.wallT=0;f.mantle=null;f.recoil=0;f.mech=null;f.ejectT=0;
 f.weapons=f.kind==='grunt'?[{id:'carbine',mag:WPN.carbine.mag}]:PILOT_KIT.map(id=>({id,mag:WPN[id].mag}));f.nades=f.kind==='grunt'?0:2;f.dmgBy.clear();f.spawnT=.8;f.streak=0;f.zoom=0;f.reloadT=f.swapT=f.meleeT=0;setWeapon(f,0);
 f.model.revive();f.model.root.visible=f!==G.me;if(f.ai){f.ai.path=null;f.ai.target=null;f.ai.goalT=0;}
 parts.burst(tv.copy(f.pos).setY(f.pos.y+1),26,5,C(.6,1.2,2.4),.2,.5,{up:true,grav:-2});if(f===G.me){snd.play('spawn');hud.flash(.3);G.snapCam=true;}}
const eyeOf=(f,o=new V())=>f.mech?o.copy(f.mech.pos).setY(f.mech.pos.y+MECH.eye):o.set(f.pos.x,f.pos.y+(f.slideT>0||f.h<1.5?PHY.eyeSlide:PHY.eye),f.pos.z);
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
const ho={n:new V()};

function stepFighter(f,dt){const inp=f.inp;
 if(!f.alive){if(G.phase==='play'||G.attract){f.respawnT-=dt;if(f.respawnT<=0)spawn(f);}return;}
 if(f.mech){f.pos.copy(f.mech.pos);f.vel.copy(f.mech.vel);f.onGround=true;return;}
 const frozen=G.phase==='countdown'&&!G.attract;f.spawnT-=dt;f.ejectT-=dt;const pilot=f.kind==='pilot';
 f.regenT-=dt;if(f.regenT<=0&&f.health<f.maxHp)f.health=Math.min(f.maxHp,f.health+28*dt);
 if(pilot&&!G.mechOf(f)&&G.phase!=='countdown'){const lag=cl((G.teamScore[1-f.team]-G.teamScore[f.team])/50,0,1.2);f.meter=Math.min(1,f.meter+dt*(1+lag)/(G.attract?40:140));}
 if(pilot&&f.nades<2){f.nadeT+=dt;if(f.nadeT>22){f.nadeT=0;f.nades++;}}
 // ---- movement ----
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen){wx=wz=0;}
 const firing=f.lastFire>G.time-.25;const sprint=inp.sprint&&inp.fwd>.3&&!firing&&f.zoom<.3&&!f.reloadT&&pilot;f.sprinting=sprint&&f.onGround;
 let spd=pilot?(sprint?PHY.sprint:PHY.walk):4.6;if(f.zoom>.5)spd*=.8;
 const hs=Math.hypot(f.vel.x,f.vel.z);f.slideCD-=dt;f.wallCD-=dt;
 if(f.mantle){const m=f.mantle;m.t+=dt;const k=Math.min(1,m.t/m.dur),ky=1-Math.pow(1-Math.min(1,k/.65),2),kx=k<.35?0:(k-.35)/.65;f.pos.set(m.a.x+(m.b.x-m.a.x)*kx,m.a.y+(m.b.y-m.a.y)*ky,m.a.z+(m.b.z-m.a.z)*kx);f.vel.set(0,0,0);
  if(k>=1){f.mantle=null;f.pos.copy(m.b);f.vel.set(m.dx*m.keep,0,m.dz*m.keep);f.onGround=true;f.dbl=true;f.climbUsed=false;}weapons(f,dt,frozen);return;}
 if(f.wallT>0){// ---- wall-run ----
  const n=f.wn;tv.set(f.vel.x,0,f.vel.z);tv.addScaledVector(n,-tv.dot(n));const tl=tv.length();if(tl>.01)tv.divideScalar(tl);else tv.set(-n.z,0,n.x);
  let s=Math.max(tl,PHY.wallMin+1.6);if(inp.fwd>0)s=Math.min(s+4*dt,Math.max(s,PHY.wallMax));f.vel.x=tv.x*s-n.x*1.2;f.vel.z=tv.z*s-n.z*1.2;f.vel.y=Math.max(-5,f.vel.y-PHY.wallG*dt*(f.vel.y>0?1.6:1));f.wallT+=dt;f.dbl=true;
  // still on the wall?
  tv2.set(f.pos.x,f.pos.y+1,f.pos.z);tv3.set(-n.x,0,-n.z);const hitD=G.W.ray(tv2,tv3,f.r+.7,ho);const still=hitD<f.r+.7&&Math.abs(ho.n.y)<.3&&ho.n.dot(n)>.9;
  if(inp.jumpEdge&&!frozen){let ox=n.x*PHY.wallOut,oz=n.z*PHY.wallOut;const lf=-sy*n.x+-cy*n.z;if(lf>.1){ox+=-sy*2.6;oz+=-cy*2.6;}f.vel.set(tv.x*s*.95+ox,PHY.wallUp,tv.z*s*.95+oz);endWall(f,.22);snd.play('jump',f.pos,f===G.me?1:.6);f.model.thrust();}
  else if(!still||f.wallT>PHY.wallT||inp.fwd<=0&&f.wallT>.3&&f.human||f.onGround){f.vel.x+=n.x*1.5;f.vel.z+=n.z*1.5;endWall(f,.3);}}
 else{
  if(inp.slide&&f.onGround&&hs>5.5&&f.slideCD<=0&&f.slideT<=0&&!frozen&&pilot){f.slideT=PHY.slideT;f.slideCD=.9;const k=Math.max(hs,PHY.slide)/hs;f.vel.x*=k;f.vel.z*=k;f.h=PHY.hSlide;snd.play('slide',f.pos,f===G.me?1:.6);}
  if(f.slideT>0){f.slideT-=dt;const fr=Math.exp(-PHY.slideFric*dt);f.vel.x*=fr;f.vel.z*=fr;f.vel.x+=wx*3*dt;f.vel.z+=wz*3*dt;
   if(f.slideT<=0||hs<3||!f.onGround&&f.slideT<PHY.slideT-.25){if(G.W.free(f.pos.x,f.pos.y+.02,f.pos.z,f.r,PHY.h)){f.slideT=0;f.h=PHY.h;}else f.slideT=Math.max(f.slideT,.05);}
   if(f.onGround&&Math.random()<dt*30)parts.emit(f.pos.x+rnd(.4)-.2,f.pos.y+.05,f.pos.z+rnd(.4)-.2,(Math.random()-.5),1+rnd(1),(Math.random()-.5),1.4,.9,.5,.08,.35,4);}
  else if(f.onGround){const k=Math.min(1,PHY.accel*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
  else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
  if(f.onGround){f.coyote=.12;f.dbl=true;f.airT=0;f.climbUsed=false;f.wallLast=null;}else{f.coyote-=dt;f.airT+=dt;}
  if(inp.jumpEdge&&!frozen){if(f.coyote>0){f.vel.y=pilot?PHY.jump:6.5;f.coyote=0;f.onGround=false;if(f.slideT>0){f.slideT=0;f.h=PHY.h;}snd.play('jump',f.pos,f===G.me?1:.5);}
   else if(f.dbl&&pilot){f.dbl=false;f.vel.y=Math.max(f.vel.y,PHY.djump);const h2=Math.hypot(f.vel.x,f.vel.z);if(wl>.1){const s=Math.max(h2,PHY.walk);f.vel.x=f.vel.x*.35+wx*s*.65;f.vel.z=f.vel.z*.35+wz*s*.65;}
    parts.burst(tv.copy(f.pos),12,4,TEAMS[f.team].glow===0x58b8ff?C(.6,1.2,2.4):C(2.4,1.1,.4),.18,.35,{grav:-1});f.model.thrust();snd.play('thrust',f.pos,f===G.me?1:.6);}}
  // wall-run start: airborne, fast, wall at the side, moving along it
  if(pilot&&!f.onGround&&f.wallCD<=0&&f.airT>.06&&!frozen){const hsp=Math.hypot(f.vel.x,f.vel.z);if(hsp>PHY.wallMin&&f.vel.y<7){
   for(const side of[1,-1]){tv2.set(f.pos.x,f.pos.y+1,f.pos.z);tv3.set(cy*side,0,-sy*side);const d=G.W.ray(tv2,tv3,f.r+.55,ho);if(d>=f.r+.55||Math.abs(ho.n.y)>.3)continue;const n=ho.n.clone();
    const along=Math.abs(f.vel.x*n.x+f.vel.z*n.z)/hsp;if(along>.75)continue;const pd=n.x*(tv2.x+tv3.x*d)+n.z*(tv2.z+tv3.z*d);if(f.wallLast&&f.wallLast.n.dot(n)>.95&&Math.abs(f.wallLast.d-pd)<.6)continue;
    tv2.y=f.pos.y+1.75;if(G.W.ray(tv2,tv3,f.r+.65)>=f.r+.65)continue;
    f.wallT=.001;f.wallSide=side;f.wn.copy(n);f.wallD=pd;f.vel.y=Math.max(f.vel.y*.5,1.6);f.slideT=0;f.h=PHY.h;snd.play('wallrun',f.pos,f===G.me?1:.6);break;}}}
  // climb kick + mantle when pushing into a ledge in the air
  if(pilot&&!f.onGround&&f.wallT<=0&&inp.fwd>.3&&!frozen){const fx=-sy,fz=-cy;tv2.set(f.pos.x,f.pos.y+1.1,f.pos.z);tv3.set(fx,0,fz);const d=G.W.ray(tv2,tv3,f.r+.45,ho);
   if(d<f.r+.45&&Math.abs(ho.n.y)<.3){// ledge above?
    const lx=f.pos.x+fx*(f.r+.55),lz=f.pos.z+fz*(f.r+.55);tv2.set(lx,f.pos.y+PHY.mantle+.3,lz);const dd=G.W.ray(tv2,tv3.set(0,-1,0),PHY.mantle+.3,ho);const top=tv2.y-dd;
    if(dd<PHY.mantle+.3&&ho.n.y>.7&&top-f.pos.y>.35&&G.W.free(lx,top+.03,lz,f.r,PHY.h)){f.mantle={a:f.pos.clone(),b:new V(lx,top+.01,lz),t:0,dur:.24+(top-f.pos.y)*.05,dx:fx,dz:fz,keep:Math.max(hsWall(f),5)};f.wallT=0;snd.play('land',f.pos,.6,5);weapons(f,dt,frozen);return;}
    if(!f.climbUsed&&f.vel.y<5){f.climbUsed=true;f.vel.y=Math.max(f.vel.y,6.4);f.model.thrust();}}}}
 if(f.wallT<=0){const g=PHY.g;f.vel.y-=g*dt;if(f.vel.y<-45)f.vel.y=-45;}
 const wasG=f.onGround;const vy0=f.vel.y;G.W.move(f,dt);
 if(f.onGround&&!wasG){const lv=-vy0;if(lv>6){f.landDip=Math.min(.35,lv*.018);snd.play('land',f.pos,f===G.me?1:.6,lv);}if(f.wallT>0)endWall(f,.1);}
 if(f.onGround&&hs>2&&f.slideT<=0||f.wallT>0){f.stepT-=dt*hs*(f.sprinting?.32:.38);if(f.stepT<=0){f.stepT=1;snd.play('step',f.pos,f===G.me?.8:.5);}}
 if(f.pos.y<G.W.killY){die(f,f.lastHitT>G.time-6?f.lastHitBy:null,{weapon:'fall',fall:true});return;}
 weapons(f,dt,frozen);}
function hsWall(f){return Math.hypot(f.vel.x,f.vel.z);}
function endWall(f,cd){f.wallLast={n:f.wn.clone(),d:f.wallD};f.wallT=0;f.wallCD=cd;f.airT=.1;}

/* ================= pilot weapons ================= */
function weapons(f,dt,frozen){const inp=f.inp;if(frozen)return;const w=f.weapons[f.wi];if(!w)return;const d=WPN[w.id];
 f.fireCD-=dt;f.meleeCD-=dt;f.nadeCD-=dt;if(f.meleeT>0)f.meleeT-=dt;f.recoil*=Math.exp(-dt*10);
 f.spread=Math.max(d.spr||0,f.spread-dt*(d.sprMax||.02)*2.2);f.zoom=damp(f.zoom,inp.zoom&&!f.sprinting&&f.reloadT<=0&&f.swapT<=0?1:0,16,dt);
 if(d.smart)updateLocks(f,d,dt);else if(f.locks.size)f.locks.clear();
 // frame call + boarding
 if(inp.callMech&&f.meter>=1&&!G.mechOf(f)&&f.kind==='pilot')callIn(f);
 const own=G.mechOf(f);if(inp.interact&&own&&own.state==='idle'&&Math.hypot(own.pos.x-f.pos.x,own.pos.z-f.pos.z)<4.6&&Math.abs(own.pos.y-f.pos.y)<3){embark(f,own);return;}
 if(f.swapT>0){f.swapT-=dt;if(!f.swapMid&&f.swapT<.2){f.swapMid=true;setWeapon(f,f.swapTo);}if(f.swapT<=0)f.swapT=0;return;}
 let to=inp.swapTo;if(inp.swap&&f.weapons.length>1)to=(f.wi+1)%f.weapons.length;
 if(to>=0&&to<f.weapons.length&&to!==f.wi&&f.meleeT<=0){f.swapT=.4;f.swapTo=to;f.swapMid=false;f.reloadT=0;if(f===G.me)snd.play('swap');return;}
 if(f.reloadT>0){f.reloadT-=dt;if(f.reloadT<=0){w.mag=d.mag;f.reloadT=0;}}
 if(inp.reload&&!f.reloadT&&w.mag<d.mag&&f.meleeT<=0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}
 if(inp.melee&&f.meleeCD<=0&&f.reloadT<=0){melee(f);return;}
 if(inp.nade&&f.nadeCD<=0&&f.nades>0&&f.meleeT<=0){f.nades--;f.nadeCD=.9;throwNade(f);f.lastFire=G.time;}
 const canFire=f.reloadT<=0&&f.meleeT<=0&&f.spawnT<.4&&!f.mantle;
 if(inp.fire&&canFire&&f.fireCD<=0){if(w.mag<=0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}else{shoot(f,w,d);f.fireCD=d.rate;}}
 if(w.mag<=0&&!f.reloadT&&!inp.fire&&f.fireCD<0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}}
// Seeker smart pistol: targets inside the lock cone gain locks (grunt 1, pilot 3); a full lock makes shots auto-hit
function updateLocks(f,d,dt){const eye=eyeOf(f,tv2),fw=dirOf(f.yaw,f.pitch,tv3);const seen=new Set();
 for(const o of G.fighters){if(!o.alive||o.mech||!G.enemy(f,o))continue;const c=new V(o.pos.x,o.pos.y+(o.slideT>0?.7:1.15),o.pos.z);const dv=c.clone().sub(eye);const dist=dv.length();if(dist>d.lockR)continue;dv.divideScalar(dist);
  if(Math.acos(cl(dv.dot(fw),-1,1))>d.lockCone)continue;if(!G.W.los(eye,c))continue;seen.add(o);const need=o.kind==='grunt'?1:3;const k=Math.min(need,(f.locks.get(o)||0)+dt*4.2);
  if(f===G.me&&Math.floor(k)>Math.floor(f.locks.get(o)||0))snd.play('lock',null,1,k>=need?1:0);f.locks.set(o,k);}
 for(const[o,k]of f.locks)if(!seen.has(o)){const nk=k-dt*5;if(nk<=0)f.locks.delete(o);else f.locks.set(o,nk);}}
function fullLock(f){let best=null;for(const[o,k]of f.locks){if(!o.alive||o.mech)continue;if(k>=(o.kind==='grunt'?1:3)){if(!best||o.health<best.health)best=o;}}return best;}

/* ================= ray hits: fighters, frames, aegis domes ================= */
function rayHit(o,d,maxT,skip,skipM){let best=null;
 for(const f of G.fighters){if(f===skip||!f.alive||f.mech)continue;const low=f.h<1.5;
  const hx=f.pos.x-o.x,hy=f.pos.y+(low?.9:1.62)-o.y,hz=f.pos.z-o.z;const tc=hx*d.x+hy*d.y+hz*d.z;if(tc<-1||tc>maxT+1)continue;const d2=hx*hx+hy*hy+hz*hz-tc*tc;
  if(d2<.24*.24){const t=tc-Math.sqrt(.24*.24-d2);if(t>0&&t<maxT&&(!best||t<best.t))best={f,t,head:true};}
  const ay=f.pos.y+.25,by=f.pos.y+(low?.75:1.42),r=.42;const wx=o.x-f.pos.x,wz=o.z-f.pos.z;const A=d.x*d.x+d.z*d.z;if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){const t=(-B-Math.sqrt(D))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>ay-r*.5&&y<by+r*.4&&(!best||t<best.t-.04))best={f,t,head:false};}}}
 for(const m of G.mechs){if(m===skipM||m.state==='dead'||m.state==='drop')continue;
  if(m.shieldT>0&&m.state==='piloted'){// aegis dome in front of the torso
   const fw=dirOf(m.yaw,0,tv);const cx=m.pos.x+fw.x*1.2,cy2=m.pos.y+3.5,cz=m.pos.z+fw.z*1.2,Rs=3.4;const ox=o.x-cx,oy=o.y-cy2,oz=o.z-cz;const b=ox*d.x+oy*d.y+oz*d.z,c=ox*ox+oy*oy+oz*oz-Rs*Rs,D=b*b-c;
   if(D>=0&&c>0){const t=-b-Math.sqrt(D);if(t>0&&t<maxT&&(!best||t<best.t)){const px=o.x+d.x*t-cx,pz=o.z+d.z*t-cz;if((px*fw.x+pz*fw.z)>Rs*.35)best={m,t,shield:true};}}}
  const r=1.55,ay=m.pos.y+.3,by=m.pos.y+(m.state==='idle'||m.state==='embark'?4.4:6.3);const wx=o.x-m.pos.x,wz=o.z-m.pos.z;const A=d.x*d.x+d.z*d.z;
  if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){let t=(-B-Math.sqrt(D))/A;if(Cc<0)t=0;const y=o.y+d.y*t;if(t>=0&&t<maxT&&y>ay&&y<by&&(!best||t<best.t))best={m,t,head:y>by-1.2};}}
  if(Math.abs(d.y)>.2){const t=(by-o.y)/d.y;if(t>0&&t<maxT&&(!best||t<best.t)){const x=o.x+d.x*t-m.pos.x,z=o.z+d.z*t-m.pos.z;if(x*x+z*z<r*r)best={m,t,head:true};}}}
 return best;}
function muzzleOf(f,o=new V()){if(f===G.me&&!f.mech&&G.app!=='menu'&&VM.root.visible){const g=VM.guns[f.weapons[f.wi].id];const md=g?.userData.muzzle||new V(0,0,-.7);
  VM.root.updateWorldMatrix(true,true);o.copy(md).applyMatrix4(g.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(1.1).add(cam.position);return o;}
 if(f===G.me)return eyeOf(f,o).addScaledVector(dirOf(f.yaw,f.pitch,tv3),.8);
 f.model.gunMount.updateWorldMatrix(true,false);return o.set(0,.03,-.62).applyMatrix4(f.model.gunMount.matrixWorld);}
function shoot(f,w,d){w.mag--;f.lastFire=G.time;G.noise={p:f.pos.clone(),t:G.time,who:f,team:f.team};f.stats.shots++;const me=f===G.me;
 const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());const right=new V(Math.cos(f.yaw),0,-Math.sin(f.yaw)),up=new V().crossVectors(right,fw);
 const moving=Math.hypot(f.vel.x,f.vel.z)>2?1.25:1,air=f.onGround||f.wallT>0?1:1.5,zm=1-f.zoom*.6;const spr=(d.pel?d.spr:f.spread)*moving*air*zm;const mz=muzzleOf(f,new V());let hitAny=false;
 const lockT=d.smart?fullLock(f):null;
 if(lockT){const c=new V(lockT.pos.x,lockT.pos.y+(lockT.slideT>0?.75:1.25),lockT.pos.z);damage(lockT,d.lockDmg,f,{weapon:w.id,point:c,dir:c.clone().sub(eye).normalize()});hitAny=true;beams.tracer(mz,c,d.tr,.03,260,6);}
 else{const n=d.pel||1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*spr;const dir=fw.clone().addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();
   const wt=G.W.ray(eye,dir,d.range,ho);const h=rayHit(eye,dir,wt,f,f.mech);let end=wt;
   if(h){end=h.t;let dmg=d.dmg;if(d.fall&&h.t>d.fall[0])dmg*=1-(1-d.fall[2])*cl((h.t-d.fall[0])/(d.fall[1]-d.fall[0]),0,1);const p=eye.clone().addScaledVector(dir,h.t);
    if(h.m)damage(h.m,dmg*d.mech,f,{weapon:w.id,point:p,dir,shield:h.shield});else damage(h.f,dmg*(h.head?d.hs:1),f,{head:h.head,weapon:w.id,point:p,dir,dist:h.t});hitAny=true;}
   const ep=eye.clone().addScaledVector(dir,end);if(i<3||Math.random()<.4)beams.tracer(mz,ep,d.tr,d.pel?.016:.022,d.pel?260:360,d.pel?4:7);
   if(!h&&wt<d.range)impact(ep,ho.n,d,w.id);}}
 if(hitAny)f.stats.hits++;if(!d.pel)f.spread=Math.min(d.sprMax||d.spr,f.spread+(d.sprAdd||0));
 snd.play(d.snd,me?null:f.pos,me?.9:1);f.model.st.kick=1;if(me){VM.fire();f.recoil+=d.kick*.012;G.shake=Math.max(G.shake,d.kick*.07);}else if(Math.random()<.3)lights.flash(mz,d.col,5,5,.05);}
function impact(p,n,d,id){const col=C(...d.tr);parts.burst(p,id==='shotgun'?3:7,6,[col,C(2.2,1.8,1.2)],.07,.35,{dir:n,spread:.9,grav:14,drag:2,floor:p.y-2});decals.add(p,n,.16);
 if(Math.random()<.35)smoke.emit(p.x,p.y,p.z,n.x*.6,n.y*.6+.3,n.z*.6,.35,.33,.3,.4,.9,-.3,1);if(Math.random()<.3)snd.play('tink',p,.5);}
const fragGeo=new THREE.SphereGeometry(.11,12,10),fragMat=new THREE.MeshStandardMaterial({color:0x3a3f48,roughness:.4,metalness:.8,emissive:0xff4a10,emissiveIntensity:.5});
const rocketGeo=(()=>{const g=new THREE.CylinderGeometry(.09,.12,.8,8);g.rotateX(Math.PI/2);return g;})(),rocketMat=new THREE.MeshStandardMaterial({color:0x5a5e66,roughness:.4,metalness:.8,emissive:0xff6a20,emissiveIntensity:.6});
function throwNade(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.12,new V());const p=eye.addScaledVector(fw,.5);const v=fw.multiplyScalar(20).add(tv.copy(f.vel).multiplyScalar(.6));v.y+=2.5;
 const m=new THREE.Mesh(fragGeo,fragMat);m.position.copy(p);scene.add(m);G.proj.push({kind:'frag',pos:p.clone(),vel:v,owner:f,life:NADE.fuse,fuse:NADE.fuse,mesh:m});snd.play('throw',f.pos,f===G.me?1:.7);}
function killProj(p){scene.remove(p.mesh);if(p.light)lights.release(p.light);p.dead=true;}
function updateProj(dt){for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.life-=dt;
  if(p.kind==='rocket'){const step=p.vel.length()*dt,dir=tv.copy(p.vel).normalize();const wt=G.W.ray(p.pos,dir,step,ho);const h=rayHit(p.pos,dir,wt+.3,p.owner,p.src);
   if(h||wt<step||p.life<=0){const t=h?h.t:wt;p.pos.addScaledVector(dir,Math.max(0,t-.1));if(h&&h.m)damage(h.m,MECH.rk.mechDmg*.4,p.owner,{weapon:'rocket',point:p.pos.clone(),dir:dir.clone(),shield:h.shield,ord:true});
    explode(p.pos,p.owner,MECH.rk.dmg,MECH.rk.r,8,'rocket',MECH.rk.mechDmg*.6,h&&h.shield?h.m:null);killProj(p);G.proj.splice(i,1);continue;}
   p.pos.addScaledVector(dir,step);p.mesh.position.copy(p.pos);p.mesh.lookAt(tv2.copy(p.pos).add(dir));if(p.light)p.light.L.position.copy(p.pos);
   for(let k=0;k<2;k++)parts.emit(p.pos.x,p.pos.y,p.pos.z,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,3,1.3,.4,.22,.18);if(Math.random()<dt*40)smoke.emit(p.pos.x,p.pos.y,p.pos.z,rnd(.4)-.2,rnd(.4),rnd(.4)-.2,.45,.42,.4,.45,1.2,-.2,1);continue;}
  p.vel.y-=PHY.g*dt;const step=p.vel.length()*dt;if(step>1e-4){const dir=tv.copy(p.vel).normalize();const wt=G.W.ray(p.pos,dir,step+.11,ho);
   if(wt<step+.11){p.pos.addScaledVector(dir,Math.max(0,wt-.11));const vn=p.vel.dot(ho.n);p.vel.addScaledVector(ho.n,-1.45*vn).multiplyScalar(.6);if(Math.abs(vn)>3)snd.play('tink',p.pos,.6);if(ho.n.y>.6&&p.vel.length()<1.2)p.vel.set(0,0,0);}
   else{const h=rayHit(p.pos,dir,step+.2,p.owner,null);if(h&&h.m&&!h.shield){p.stuck=h.m;p.off=p.pos.clone().sub(h.m.pos);p.vel.set(0,0,0);snd.play('tink',p.pos);}else p.pos.addScaledVector(dir,step);}}
  if(p.stuck){if(p.stuck.state==='dead')p.stuck=null;else p.pos.copy(p.stuck.pos).add(p.off);}
  p.fuse-=dt;p.mesh.position.copy(p.pos);p.mesh.rotation.x+=dt*8;if(Math.random()<dt*12)parts.emit(p.pos.x,p.pos.y,p.pos.z,0,.5,0,2,.6,.15,.12,.2);
  if(p.fuse<=0){explode(p.pos,p.owner,NADE.dmg,NADE.r,NADE.push,'frag',NADE.mechDmg);killProj(p);G.proj.splice(i,1);}}}
function explode(pos,owner,dmg,radius,push,kind,mechDmg=0,blockM=null){const big=kind==='frame';const c1=big?C(3.4,1.6,.5):C(3.2,1.5,.4),c2=C(2.4,.6,.1);
 parts.burst(pos,big?220:100,big?20:14,[c1,c2,C(3,2.6,2)],big?.8:.5,.7,{grav:3,drag:2.4});parts.burst(pos,big?80:36,big?30:22,[c1,C(2.6,2.2,1.6)],.1,.9,{grav:16,drag:1.2});
 for(let k=0;k<(big?40:16);k++)smoke.emit(pos.x+rnd(1.6)-.8,pos.y+rnd(1.2)-.3,pos.z+rnd(1.6)-.8,rnd(2)-1,rnd(2)+(big?2:0),rnd(2)-1,.2,.18,.17,big?3:1.6+rnd(1),big?4:2+rnd(1.2),-.4,1.2);
 shocks.fire(pos,c1.clone().multiplyScalar(.5),radius*1.1,.45);lights.flash(pos,0xff8a30,big?160:90,radius*4,big?.8:.45);snd.play(big?'mechBoom':'boom',pos);
 const gd=G.W.ray(pos,tv.set(0,-1,0),3,ho);if(gd<3)decals.add(pos.clone().setY(pos.y-gd),ho.n,radius*.6);
 const mePos=cam.position;const dd=mePos.distanceTo(pos);if(dd<radius*5)G.shake=Math.max(G.shake,cl(1-dd/(radius*5),0,1)*(big?1.2:.8));
 for(const f of G.fighters){if(!f.alive||f.mech)continue;const c=tv2.copy(f.pos);c.y+=.9;const d=c.distanceTo(pos);if(d>radius)continue;if(!G.W.los(pos,c)&&!G.W.los(pos,tv3.copy(f.pos).setY(f.pos.y+1.6)))continue;
  const k=1-d/radius,self=f===owner;tv3.subVectors(c,pos).normalize();tv3.y=Math.max(tv3.y,.35);f.vel.addScaledVector(tv3.normalize(),push*(.45+k*.55));if(f.vel.y>3)f.onGround=false;
  damage(f,dmg*Math.pow(k,.7)*(self?.5:1),owner,{weapon:kind,point:pos.clone(),dir:tv3.clone(),splash:true});}
 if(mechDmg)for(const m of G.mechs){if(m.state==='dead'||m.state==='drop'||m===blockM)continue;const c=tv2.copy(m.pos);c.y+=3;const d=Math.max(0,Math.hypot(c.x-pos.x,(c.y-pos.y)*.6,c.z-pos.z)-1.6);if(d>radius)continue;damage(m,mechDmg*(1-d/radius*.6),owner,{weapon:kind,point:pos.clone(),splash:true,ord:true});}}
function melee(f){f.meleeT=.35;f.meleeCD=.9;snd.play('melee',f.pos,f===G.me?1:.7);const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bd=2.6;
 for(const o of G.fighters){if(o===f||!o.alive||o.mech||!G.enemy(f,o))continue;tv.copy(o.pos).setY(o.pos.y+1).sub(eye);const d=tv.length();if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.5)continue;best=o;bd=d;}
 if(best){tv.subVectors(best.pos,f.pos).normalize();damage(best,f.kind==='grunt'?60:100,f,{weapon:'melee',point:tv2.copy(best.pos).setY(best.pos.y+1.2),dir:tv.clone(),melee:true});best.vel.addScaledVector(tv,7);best.vel.y+=3;parts.burst(tv2,16,5,[C(2.4,2,1.4)],.12,.4,{grav:6});if(f===G.me)G.shake=Math.max(G.shake,.35);}}

/* ================= damage + deaths ================= */
function damage(t,amount,att,o={}){if(t.isMech)return damageMech(t,amount,att,o);
 if(!t.alive||amount<=0||t.mech)return;if(att&&att!==t&&att.team===t.team)return;if(t.ejectT>0)return;if(t.spawnT>0&&att!==t)amount*=.3;
 if(att&&att!==t){t.dmgBy.set(att,G.time);t.lastHitBy=att;t.lastHitT=G.time;att.stats.dmg+=amount;}
 t.health-=amount;t.regenT=4.5;if(o.point&&!o.splash){parts.burst(o.point,8,4,[C(2.4,.7,.2),C(1.2,.2,.1)],.07,.4,{grav:10});if(Math.random()<.5)snd.play('hitBody',t.pos,.6);}
 if(t.ai){t.ai.flinch=.35;if(att&&att!==t&&(!t.ai.target||t.ai.lostT>.5)){t.ai.target=att.mech||att;t.ai.lastPos.copy(att.pos);t.ai.lostT=0;t.ai.seenT=Math.min(t.ai.seenT,.1);}}
 if(t===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amount/120);G.shake=Math.max(G.shake,Math.min(.4,amount/90));t.zoom=0;if(att&&att!==t){const ap=att.mech?att.mech.pos:att.pos;hud.damageFrom(-wrapA(Math.atan2(-(ap.x-t.pos.x),-(ap.z-t.pos.z))-t.yaw));}}
 const killed=t.health<=0;if(att===G.me&&t!==G.me){hud.hit(killed?'k':o.head?'h':'');snd.play(o.head?'headshot':'hitmark',null,1,killed?1:0);}
 if(killed){t.health=0;if(o.head&&att)att.stats.heads++;die(t,att,o);}}
function wname(o){return{fall:'FELL',melee:'KICK',frag:'FRAG',rocket:'SALVO',chaingun:'CHAINGUN',punch:'FRAME PUNCH',crush:'FRAMEFALL',frame:'FRAME BLAST',core:'FRAME BLAST'}[o.weapon]||WPN[o.weapon]?.name||'';}
function die(f,k,o={}){if(!f.alive)return;f.alive=false;f.respawnT=f.kind==='grunt'?GRUNT_RESP:RESP;f.stats.deaths++;f.wallT=0;f.mantle=null;f.locks.clear();
 const dir=o.dir?tv.copy(o.dir).setY(0).normalize():tv.set(0,0,1);f.model.kill(dir,o.splash?8:o.melee?6:3);parts.burst(tv2.copy(f.pos).setY(f.pos.y+1),24,5,[C(.6,1.2,2.4),C(2,.8,.3)],.1,.6,{grav:8});snd.play('death',f.pos,.8);
 const wn=wname(o);f.killedBy=k&&k!==f?k:null;f.killedWith=wn;const prevStreak=f.streak;f.streak=0;
 if(!k||k===f||k.team===f.team){hud.feed(null,f,o.fall?'FELL':'SELF',f===G.me);}
 else{const pts=f.kind==='grunt'?PTS.grunt:PTS.pilot;addScore(k.team,pts);k.stats.pts+=pts;if(f.kind==='grunt')k.stats.grunts++;else{k.stats.kills++;k.streak++;k.stats.best=Math.max(k.stats.best,k.streak);}
  if(k.kind==='pilot'&&!G.mechOf(k))k.meter=Math.min(1,k.meter+(f.kind==='grunt'?.04:.12));
  for(const[a,t]of f.dmgBy)if(a!==k&&a.alive&&G.time-t<6&&G.enemy(a,f)&&f.kind==='pilot'){a.stats.assists++;if(a===G.me)hudMsg('ASSIST · '+f.name);}
  if(f.kind==='pilot'){if(!G.firstBlood){G.firstBlood=true;medal(k,'FIRST STRIKE','#ff6a2a','1');}if(o.head)medal(k,'HEADSHOT','#ffcf3f','◉');if(o.weapon==='crush')medal(k,'FRAMEFALL','#ff3d7f','▼');
   if(k.lastKiller===f){medal(k,'REVENGE','#ff5a2a','↺');k.lastKiller=null;}if(prevStreak>=4)medal(k,'SHUTDOWN','#c060ff','✕');if(!k.mech&&k.wallT>0)medal(k,'WALL RUNNER','#5fd8ff','⫽');else if(!k.mech&&!k.onGround&&k.airT>.4)medal(k,'AIRBORNE','#9fd8ff','▲');
   if(G.time-k.multiT<4.2)k.multi++;else k.multi=1;k.multiT=G.time;if(k.multi>=2)medal(k,MULTI[Math.min(5,k.multi)],'#ff6a2a','×'+k.multi);if(k.streak===5&&k===G.me){hud.banner('RAMPAGE','5 PILOTS WITHOUT DYING','#ff6a2a',2.2);ann('rampage');}}
  hud.feed(k,f,wn,k===G.me||f===G.me);if(k===G.me){snd.play('kill');}f.lastKiller=k;}
 if(f===G.me){G.hurtFx=.8;f.zoom=0;f.model.root.visible=true;camPos.copy(cam.position);}}
function medal(f,name,col,glyph){if(!f)return;f.stats.medals[name]=(f.stats.medals[name]||0)+1;if(f===G.me){hud.medal(name,col,glyph);snd.play('medal');}}
function addScore(team,n){if(G.attract||G.phase!=='play')return;G.teamScore[team]+=n;checkCap();}
let msgT=0;function hudMsg(t){hud.prompt(`<span style="color:#9fe8ff">${t}</span>`);msgT=1.4;}
function ann(t){if(G.attract)return;G.annQ.push(t);}

/* ================= frames (mechs) ================= */
function makeMech(owner,p){const T=TEAMS[owner.team];const model=new Mech3D(owner.team,T.mech,T.glow);scene.add(model.root);
 const m={isMech:true,team:owner.team,owner,pilot:null,pos:p.clone(),vel:new V(),yaw:owner.yaw,legYaw:owner.yaw,pitch:0,hp:MECH.hp,sh:MECH.sh,shDelay:0,state:'drop',dropT:0,embT:0,deadT:0,r:FR.r,h:FR.h,step:FR.step,onGround:false,
  cg:{mag:MECH.cg.mag,reloadT:0,spin:0,fireCD:0,spread:MECH.cg.spr,spinSnd:0},rk:{cd:0,left:0,gapT:0},aegis:{cd:0,absorb:0},shieldT:0,dash:{n:MECH.dash.n,regen:0},dashT:0,dashSide:0,dashFwd:0,punchT:0,punchCD:0,hitDone:true,
  recentDmg:0,model,ejectHold:0,firing:false,spin:0,lastStep:0,lastAtt:null,lastAttT:-9};
 G.mechs.push(m);return m;}
function removeMech(m){scene.remove(m.model.root);m.model.root.traverse(o=>{if(o.geometry&&o.geometry!==rocketGeo)o.geometry.dispose();});}
function dropSpot(f){const eye=eyeOf(f,new V());const fw=dirOf(f.yaw,cl(f.pitch,-.5,.05),new V());const far=Math.min(36,G.W.ray(eye,fw,36,ho));
 const ok=(x,z)=>{const g=G.W.groundBelow(x,40,z,1.6);if(g<-1||g>1.7)return null;if(!G.W.free(x,g+.08,z,1.7,6.6))return null;if(G.W.ray(new V(x,g+7,z),UP,30)<30)return null;return new V(x,g,z);};
 for(let d=far-2;d>3;d-=2){const p=ok(eye.x+fw.x*d,eye.z+fw.z*d);if(p)return p;}
 for(let r=4;r<24;r+=3)for(let a=0;a<12;a++){const an=a/12*Math.PI*2+f.yaw;const p=ok(f.pos.x+Math.sin(an)*r,f.pos.z+Math.cos(an)*r);if(p)return p;}
 const n=G.WM.nearest(f.pos,40);return n?new V(n.x,n.y,n.z):f.pos.clone();}
function callIn(f){const p=dropSpot(f);f.meter=0;const m=makeMech(f,p);m.legYaw=m.yaw=f.yaw;m.pos.y=p.y;m.groundY=p.y;m.model.root.visible=false;
 const bm=new THREE.Mesh(new THREE.CylinderGeometry(.6,1.6,60,16,1,true),new THREE.ShaderMaterial({uniforms:{uC:{value:new THREE.Color(TEAMS[f.team].glow).multiplyScalar(.8)},uT:{value:0}},transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform vec3 uC;uniform float uT;varying vec2 vU;void main(){float s=fract(vU.y*6.-uT*2.);gl_FragColor=vec4(uC*(pow(1.-vU.y,3.)*.9+s*.15*(1.-vU.y)),1.);}'}));
 bm.position.set(p.x,p.y+30,p.z);scene.add(bm);G.beacons.push({p,t:3,team:f.team,m,mesh:bm});snd.play('incoming',f===G.me?null:p,f===G.me?1:.6);
 if(f===G.me){hud.banner('FRAMEFALL','STAND BY FOR YOUR FRAME','#'+new THREE.Color(TEAMS[f.team].glow).getHexString(),2);ann('stand by for framefall');}else if(f.team===G.me?.team)hud.sys(f.name+' · FRAME INBOUND',TEAMCSS[f.team]);}
function embark(f,m){m.state='embark';m.embT=0;m.pilot=f;f.mech=m;f.model.root.visible=false;f.slideT=0;f.wallT=0;f.locks.clear();f.zoom=0;m.yaw=f.yaw;snd.play('hatch',m.pos,f===G.me?1:.6);
 if(f===G.me){G.cine={t:0,dur:1.5,from:cam.position.clone(),q:cam.quaternion.clone(),m};VM.root.visible=false;}}
function eject(m,manual){const f=m.pilot;if(!f)return;f.mech=null;m.pilot=null;const fw=dirOf(m.yaw,0,tv);f.pos.set(m.pos.x,m.pos.y+5.6,m.pos.z);f.vel.set(fw.x*5,25,fw.z*5);f.onGround=false;f.ejectT=1.8;f.dbl=true;f.yaw=m.yaw;f.pitch=.3;
 f.model.root.visible=f!==G.me;f.model.revive();snd.play('eject',f===G.me?null:f.pos);parts.burst(tv2.copy(f.pos),60,10,[C(3,2,1),C(2,1,.3)],.25,.6,{grav:8});smoke.emit(f.pos.x,f.pos.y,f.pos.z,0,-2,0,.5,.5,.5,1.5,2,-.2,1);
 if(f===G.me){hud.flash(.8);G.snapCam=true;G.cine=null;VM.set(f.weapons[f.wi].id);ann('ejecting');}if(manual){m.hp=0;m.sh=0;mechDown(m,null,{weapon:'core'});}}
function damageMech(m,amount,att,o={}){if(m.state==='dead'||m.state==='drop'||amount<=0)return;if(att&&att.team===m.team)return;
 if(att){m.lastAtt=att;m.lastAttT=G.time;att.stats.dmg+=amount;if(att.kind==='pilot'&&!att.mech&&!G.mechOf(att))att.meter=Math.min(1,att.meter+amount/5000);if(m.pilot&&m.pilot.ai){const b=m.pilot.ai;if(!b.target||b.lostT>.6){b.target=att.mech||att;b.lastPos.copy(att.pos);b.lostT=0;}}}
 if(att===G.me){hud.hit('');snd.play('hitArmor',null,.8);}
 if(o.shield&&m.shieldT>0){m.aegis.absorb-=amount;m.model.shieldHit();if(Math.random()<.4)snd.play('aegisHit',o.point||m.pos,.6);if(o.point)parts.burst(o.point,5,4,[C(1,2,3)],.08,.3,{grav:2});if(m.aegis.absorb<=0){m.shieldT=0;snd.play('aegis',m.pos,.5);}return;}
 m.recentDmg+=amount;m.shDelay=MECH.shDelay;let a=amount;if(m.sh>0){const s=Math.min(m.sh,a);m.sh-=s;a-=s;}m.hp-=a;
 if(o.point&&!o.splash){parts.burst(o.point,6,5,[C(2.6,1.8,.8),C(1.6,1.6,1.6)],.06,.3,{grav:10});}
 if(m.pilot===G.me){G.shake=Math.max(G.shake,Math.min(.35,amount/300));G.hurtFx=Math.min(.5,G.hurtFx+amount/2000);if(att){const ap=att.mech?att.mech.pos:att.pos;hud.damageFrom(-wrapA(Math.atan2(-(ap.x-m.pos.x),-(ap.z-m.pos.z))-m.yaw));}if(m.hp<MECH.hp*.25&&Math.random()<.05)snd.play('alarm');}
 if(m.hp<=0){m.hp=0;mechDown(m,att,o);}}
function mechDown(m,att,o){if(m.state==='dead')return;const owner=m.owner;if(m.pilot&&m.pilot.mech)eject(m,false);m.state='dead';m.deadT=0;m.shieldT=0;
 const k=att&&att.team!==m.team?att:null;if(k){addScore(k.team,PTS.frame);k.stats.frames++;k.stats.pts+=PTS.frame;if(k.kind==='pilot'&&!G.mechOf(k))k.meter=Math.min(1,k.meter+.2);medal(k,'FRAME DOWN','#ffb040','▣');
  hud.feed(k,owner,wname(o),k===G.me||owner===G.me,(owner===G.me?'YOUR FRAME':owner.name+"'S FRAME"));if(k===G.me)ann('enemy frame destroyed');}else hud.feed(null,owner,'CORE',owner===G.me,(owner===G.me?'YOUR FRAME':owner.name+"'S FRAME"));
 if(owner===G.me){ann('frame destroyed');}m.model.kill();}
function stepMech(m,dt){const W=G.W;
 if(m.state==='drop'){m.dropT+=dt;const b=G.beacons.find(b=>b.m===m);if(b){b.t=3-m.dropT;b.mesh.material.uniforms.uT.value=G.time;}
  if(m.dropT>1.8){m.model.root.visible=true;const k=(3-m.dropT)/1.2;m.pos.y=m.groundY+Math.max(0,k)*110;m.vel.set(0,-92,0);
   for(let i=0;i<4;i++)parts.emit(m.pos.x+rnd(2)-1,m.pos.y+3+rnd(3),m.pos.z+rnd(2)-1,rnd(2)-1,30+rnd(20),rnd(2)-1,3,1.4,.4,.6,.35);if(Math.random()<.6)smoke.emit(m.pos.x,m.pos.y+6,m.pos.z,rnd(2)-1,10,rnd(2)-1,.4,.36,.34,2.2,2.5,-.2,.6);}
  if(m.dropT>=3)landMech(m,b);return;}
 if(m.state==='dead'){m.deadT+=dt;if(m.deadT<.6&&Math.random()<.5)parts.burst(tv.copy(m.pos).setY(m.pos.y+3+rnd(2)),6,8,[C(3,2,.8)],.08,.4,{grav:10});
  if(m.deadT>=.6&&!m.blown){m.blown=true;explode(tv.copy(m.pos).setY(m.pos.y+3),m.lastAtt,140,7,14,'frame',300,m);}
  if(m.deadT>1&&m.deadT<11&&Math.random()<dt*14)smoke.emit(m.pos.x+rnd(2)-1,m.pos.y+3,m.pos.z+rnd(2)-1,rnd(.6)-.3,2+rnd(1),rnd(.6)-.3,.12,.11,.1,2.4,3,-.25,.4);
  if(m.deadT>1&&m.deadT<6&&Math.random()<dt*10)parts.emit(m.pos.x+rnd(2)-1,m.pos.y+2.5,m.pos.z+rnd(2)-1,rnd(2)-1,3+rnd(2),rnd(2)-1,3,1.2,.3,.35,.4,6);
  if(m.deadT>13){removeMech(m);G.mechs.splice(G.mechs.indexOf(m),1);}return;}
 // shield regen, cooldowns
 m.shDelay-=dt;if(m.shDelay<=0&&m.sh<MECH.sh)m.sh=Math.min(MECH.sh,m.sh+MECH.shRate*dt);m.recentDmg*=Math.exp(-dt*.8);
 m.aegis.cd-=dt;m.rk.cd-=dt;m.punchCD-=dt;m.dashT-=dt;if(m.shieldT>0){m.shieldT-=dt;if(m.shieldT<=0){m.aegis.cd=MECH.aegis.cd;}}
 if(m.dash.n<MECH.dash.n){m.dash.regen+=dt;if(m.dash.regen>=MECH.dash.regen){m.dash.regen=0;m.dash.n++;}}
 if(m.state==='idle'){m.idleT=(m.idleT||0)+dt;const o=m.owner;if(m.idleT>24&&o.ai&&o.alive&&!o.mech&&G.mechOf(o)===m){o.pos.set(m.pos.x+2,m.pos.y,m.pos.z);o.vel.set(0,0,0);embark(o,m);}}
 if(m.state==='embark'){m.embT+=dt;if(m.embT>=1.3){m.state='piloted';if(m.pilot===G.me){hud.boot();snd.play('boot');ann('frame online');}}}
 const f=m.pilot,piloted=m.state==='piloted'&&f;const inp=piloted?f.inp:blankInput();const frozen=G.phase==='countdown'&&!G.attract;
 if(piloted){m.yaw=f.yaw;m.pitch=cl(f.pitch,-.9,.9);}
 // movement
 const cy=Math.cos(m.yaw),sy=Math.sin(m.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen){wx=wz=0;}
 const spd=(m.firing?MECH.walk:MECH.run)*(m.shieldT>0?.75:1);
 if(m.onGround&&m.dashT<=0){const k=Math.min(1,MECH.accel*dt);m.vel.x+=(wx*spd-m.vel.x)*k;m.vel.z+=(wz*spd-m.vel.z)*k;}else if(m.dashT>0){m.vel.x*=Math.exp(-dt*2.2);m.vel.z*=Math.exp(-dt*2.2);}
 if(inp.dash&&m.dash.n>=1&&piloted&&!frozen){m.dash.n--;const dx=wl>.1?wx:-sy,dz=wl>.1?wz:-cy;m.vel.x=dx*MECH.dash.v;m.vel.z=dz*MECH.dash.v;m.dashT=.45;m.dashSide=inp.side;m.dashFwd=inp.fwd;snd.play('dash',m.pilot===G.me?null:m.pos);
  for(let i=0;i<30;i++)parts.emit(m.pos.x-dx*1.5+rnd(2)-1,m.pos.y+1.5+rnd(3),m.pos.z-dz*1.5+rnd(2)-1,-dx*8+rnd(4)-2,rnd(2),-dz*8+rnd(4)-2,2.6,1.6,.6,.2,.4);for(let i=0;i<6;i++)smoke.emit(m.pos.x+rnd(2)-1,m.pos.y+.4,m.pos.z+rnd(2)-1,rnd(2)-1,.8,rnd(2)-1,.5,.45,.4,1.6,1.4,-.1,1);}
 m.vel.y-=PHY.g*dt;if(m.vel.y<-50)m.vel.y=-50;W.move(m,dt);if(m.pos.y<W.killY){m.hp=0;mechDown(m,m.lastAtt,{weapon:'fall'});return;}
 const hs=Math.hypot(m.vel.x,m.vel.z);if(hs>1&&m.state==='piloted'){const mvYaw=Math.atan2(-m.vel.x,-m.vel.z);let tgt=mvYaw;if(Math.abs(wrapA(mvYaw-m.yaw))>Math.PI/2)tgt=mvYaw+Math.PI;m.legYaw+=wrapA(tgt-m.legYaw)*(1-Math.exp(-dt*4));}
 const tw=wrapA(m.yaw-m.legYaw);if(Math.abs(tw)>1.2)m.legYaw+=wrapA(tw-Math.sign(tw)*1.2);else if(hs<1&&m.state==='piloted')m.legYaw+=tw*(1-Math.exp(-dt*1.2));
 // keep pilots out of the frame's body; frames shove each other
 for(const o of G.fighters){if(!o.alive||o.mech)continue;if(o.pos.y>m.pos.y+FR.h-.4||o.pos.y+o.h<m.pos.y)continue;const dx=o.pos.x-m.pos.x,dz=o.pos.z-m.pos.z,d=Math.hypot(dx,dz),min=FR.r+o.r;if(d<min&&d>1e-3){const push=(min-d);const nx=dx/d,nz=dz/d;if(G.W.free(o.pos.x+nx*push,o.pos.y+.02,o.pos.z+nz*push,o.r,o.h)){o.pos.x+=nx*push;o.pos.z+=nz*push;}}}
 for(const o of G.mechs){if(o===m||o.state==='dead'||o.state==='drop')continue;const dx=o.pos.x-m.pos.x,dz=o.pos.z-m.pos.z,d=Math.hypot(dx,dz),min=FR.r*2;if(d<min&&d>1e-3){const p=(min-d)/2,nx=dx/d,nz=dz/d;m.vel.x-=nx*p*4;m.vel.z-=nz*p*4;}}
 if(!piloted||frozen){m.firing=false;m.spin=damp(m.spin,0,3,dt);return;}
 // eject (hold)
 if(inp.interact&&m.state==='piloted'){m.ejectHold+=dt;if(m.ejectHold>.8){m.ejectHold=0;eject(m,true);return;}}else m.ejectHold=0;
 // chaingun
 const cg=m.cg,CG=MECH.cg;cg.fireCD-=dt;cg.spread=Math.max(CG.spr,cg.spread-dt*.05);
 if(cg.reloadT>0){cg.reloadT-=dt;if(cg.reloadT<=0)cg.mag=CG.mag;}
 const wantFire=inp.fire&&cg.reloadT<=0&&m.state==='piloted';m.spin=damp(m.spin,wantFire?1:0,wantFire?1/CG.spin*1.6:2,dt);if(wantFire&&cg.spinSnd<=0){cg.spinSnd=.5;snd.play('spin',f===G.me?null:m.pos,.8,1);}cg.spinSnd-=dt;
 m.firing=wantFire;if(wantFire&&m.spin>.85&&cg.fireCD<=0){if(cg.mag<=0){cg.reloadT=CG.reload;snd.play('reload',m.pos);}else{cg.fireCD=CG.rate;mechShoot(m,f);}}
 if(inp.reload&&cg.mag<CG.mag&&cg.reloadT<=0){cg.reloadT=CG.reload;snd.play('reload',m.pos);}
 // salvo
 if(inp.nade&&m.rk.cd<=0){m.rk.cd=MECH.rk.cd;m.rk.left=MECH.rk.n;m.rk.gapT=0;}
 if(m.rk.left>0){m.rk.gapT-=dt;if(m.rk.gapT<=0){m.rk.gapT=MECH.rk.gap;m.rk.left--;fireRocket(m,f);}}
 // aegis
 if(inp.shield&&m.aegis.cd<=0&&m.shieldT<=0){m.shieldT=MECH.aegis.dur;m.aegis.absorb=MECH.aegis.absorb;m.aegis.cd=99;snd.play('aegis',f===G.me?null:m.pos);}
 // punch
 if(inp.melee&&m.punchCD<=0){m.punchCD=MECH.punch.cd;m.punchT=.5;m.hitDone=false;snd.play('servo',m.pos);}
 if(m.punchT>0){m.punchT-=dt;if(!m.hitDone&&m.punchT<.3){m.hitDone=true;mechPunch(m,f);}}}
function landMech(m,b){m.state='idle';m.pos.y=m.groundY;m.vel.set(0,0,0);m.onGround=true;if(b){scene.remove(b.mesh);G.beacons.splice(G.beacons.indexOf(b),1);}
 const p=m.pos;parts.burst(tv.copy(p).setY(p.y+.5),140,16,[C(2.4,1.6,.8),C(1.6,1.2,.8)],.4,.8,{up:true,grav:12,drag:2});for(let k=0;k<36;k++){const a=k/36*Math.PI*2;smoke.emit(p.x+Math.cos(a)*2,p.y+.4,p.z+Math.sin(a)*2,Math.cos(a)*9,.6+rnd(1),Math.sin(a)*9,.6,.5,.42,2.6,2.4,-.1,1.4);}
 shocks.fire(tv.copy(p).setY(p.y+.5),C(1.4,.9,.5),8,.6);lights.flash(tv.copy(p).setY(p.y+2),0xffa050,120,30,.5);decals.add(tv.copy(p).setY(p.y+.02),UP,6);snd.play('mechLand',p);
 const dd=cam.position.distanceTo(p);if(dd<40)G.shake=Math.max(G.shake,1.3*(1-dd/40));
 for(const o of G.fighters){if(!o.alive||o.mech)continue;if(Math.hypot(o.pos.x-p.x,o.pos.z-p.z)<2.8&&o.pos.y>p.y-1&&o.pos.y<p.y+7){if(o===m.owner){o.pos.x+=3;continue;}damage(o,999,o.team===m.team?null:m.owner,{weapon:'crush',dir:new V(0,-1,0)});}}
 if(m.owner===G.me)hudMsg('FRAME READY · HOLD <kbd>E</kbd> TO BOARD');}
function mechMuzzle(m,o){if(m.pilot===G.me&&CK.root.visible){CK.barrels.updateWorldMatrix(true,true);o.set(0,0,-.8).applyMatrix4(CK.barrels.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(2.4).add(cam.position);return o;}
 m.model.muzzle.updateWorldMatrix(true,false);return o.setFromMatrixPosition(m.model.muzzle.matrixWorld);}
function mechShoot(m,f){const cg=m.cg,CG=MECH.cg;cg.mag--;f.lastFire=G.time;f.stats.shots++;G.noise={p:m.pos.clone(),t:G.time,who:f,team:f.team};
 const eye=eyeOf(f,new V()),fw=dirOf(m.yaw,m.pitch,new V());eye.addScaledVector(fw,1.2);const right=new V(Math.cos(m.yaw),0,-Math.sin(m.yaw)),up=new V().crossVectors(right,fw);const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*cg.spread;
 const dir=fw.addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();cg.spread=Math.min(CG.sprMax,cg.spread+.0016);
 const wt=G.W.ray(eye,dir,CG.range,ho);const h=rayHit(eye,dir,wt,f,m);let end=wt;const mz=mechMuzzle(m,new V());
 if(h){end=h.t;const p=eye.clone().addScaledVector(dir,h.t);if(h.m)damage(h.m,CG.mechDmg,f,{weapon:'chaingun',point:p,dir,shield:h.shield});else{damage(h.f,CG.dmg,f,{weapon:'chaingun',point:p,dir});}f.stats.hits++;}
 const ep=eye.clone().addScaledVector(dir,end);beams.tracer(mz,ep,[3,1.8,.6],.05,300,9);if(!h&&wt<CG.range){parts.burst(ep,6,7,[C(3,1.8,.6),C(2,2,2)],.09,.35,{dir:ho.n,spread:.9,grav:14,drag:2,floor:ep.y-2});if(Math.random()<.3)decals.add(ep,ho.n,.35);if(Math.random()<.25)smoke.emit(ep.x,ep.y,ep.z,ho.n.x,ho.n.y+.4,ho.n.z,.4,.36,.32,.8,1,-.3,1);}
 snd.play('chaingun',f===G.me?null:m.pos,f===G.me?.8:1);if(f===G.me){CK.fire();G.shake=Math.max(G.shake,.12);f.recoil+=.004;}else if(Math.random()<.4)lights.flash(mz,0xffa040,10,8,.05);
 if(Math.random()<.5)parts.emit(mz.x,mz.y,mz.z,rnd(2)-1+dir.x*6,rnd(2)+dir.y*6,rnd(2)-1+dir.z*6,3,2,.8,.25,.06);}
function fireRocket(m,f){const fw=dirOf(m.yaw,m.pitch,new V());m.model.podMuzzle.updateWorldMatrix(true,false);const p=new V().setFromMatrixPosition(m.model.podMuzzle.matrixWorld);
 if(m.pilot===G.me){eyeOf(f,p).addScaledVector(fw,2).add(new V(Math.cos(m.yaw),0,-Math.sin(m.yaw)).multiplyScalar(-1.2)).setY(p.y+.6);}
 // converge on the aim point
 const eye=eyeOf(f,new V());const wt=G.W.ray(eye,fw,150,ho);const h=rayHit(eye,fw,wt,f,m);const aim=eye.clone().addScaledVector(fw,h?h.t:wt);const dir=aim.sub(p).normalize();dir.x+=rnd(.05)-.025;dir.y+=rnd(.04)-.02;dir.z+=rnd(.05)-.025;dir.normalize();
 const mesh=new THREE.Mesh(rocketGeo,rocketMat);mesh.position.copy(p);scene.add(mesh);G.proj.push({kind:'rocket',pos:p.clone(),vel:dir.multiplyScalar(MECH.rk.speed),owner:f,src:m,life:3,mesh,light:lights.grab(null,0xff8030,8,8)});
 snd.play('rocket',f===G.me?null:p,.8);parts.burst(p,20,6,[C(3,1.6,.5)],.2,.3,{grav:0});G.noise={p:m.pos.clone(),t:G.time,who:f,team:f.team};}
function mechPunch(m,f){const fw=dirOf(m.yaw,0,new V());const c=m.pos.clone().addScaledVector(fw,2.5);c.y+=3;let hit=false;
 for(const o of G.mechs){if(o===m||o.state==='dead'||o.state==='drop'||o.team===m.team)continue;if(o.pos.distanceTo(m.pos)<MECH.punch.range+1.6){tv.subVectors(o.pos,m.pos).setY(0).normalize();if(tv.dot(fw)<.5)continue;damage(o,MECH.punch.dmg,f,{weapon:'punch',point:o.pos.clone().setY(o.pos.y+3.5)});o.vel.addScaledVector(tv,9);hit=true;}}
 for(const o of G.fighters){if(!o.alive||o.mech||!G.enemy(f,o))continue;if(o.pos.distanceTo(c)<3.4){tv.subVectors(o.pos,m.pos).normalize();damage(o,999,f,{weapon:'punch',point:o.pos.clone().setY(o.pos.y+1),dir:tv.clone(),melee:true});hit=true;}}
 if(hit){snd.play('punch',c);parts.burst(c,30,8,[C(3,2,1)],.15,.4,{grav:8});if(f===G.me)G.shake=Math.max(G.shake,.6);}}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);snd.annOn=!!G.opt.ann;
 G.attract=false;G.app='play';setupMatch(G.opt.map,G.opt.diff,true);G.clock=G.opt.time*60;G.cap=G.opt.cap>2?G.opt.cap:CAPS[G.opt.cap];
 $('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.reset();$('lock').hidden=false;lock();snd.music(G.opt.mus>0,0);ann('attrition. destroy enemy pilots, grunts and frames');
 document.documentElement.style.setProperty('--us',TEAMCSS[G.me.team]);document.documentElement.style.setProperty('--them',TEAMCSS[1-G.me.team]);}
function setupMatch(mapI,diff,human){clearFighters();loadMap(mapI);G.teamScore=[0,0];G.time=0;G.annQ=[];G.results=null;G.noise=null;G.timeScale=1;G.endT=0;G.cine=null;G.firstBlood=false;G.ann1=G.ann30=false;G.lastLead=null;
 const names=CALLSIGNS.slice().sort(()=>Math.random()-.5);const myTeam=G.opt.team|0;
 for(let t=0;t<2;t++){for(let i=0;i<PER_TEAM;i++){const isMe=human&&t===myTeam&&i===0;const f=makeFighter(isMe?'YOU':names.pop(),t,'pilot',isMe,diff);if(isMe)G.me=f;if(G.attract)f.meter=.6+rnd(.4);}
  for(let i=0;i<GRUNTS;i++)makeFighter('GRUNT',t,'grunt',false,Math.max(0,diff-1));}
 for(const f of G.fighters)spawn(f);
 G.phase=human?'countdown':'play';G.cdT=3;G.goT=0;G.lastBeep=4;if(G.me){VM.set(G.me.weapons[0].id);G.snapCam=true;}}
function attractMode(){G.app='menu';G.attract=true;setupMatch(G.opt.map,1,false);$('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');document.body.classList.remove('inmech');$('cockpit').classList.remove('on');snd.music(false);showBest();}
function toMenu(){unlock();attractMode();}
function checkCap(){if(G.attract||G.phase!=='play')return;if(G.teamScore[0]>=G.cap||G.teamScore[1]>=G.cap)endMatch();}
function endMatch(){if(G.phase==='end')return;G.phase='end';G.endT=0;snd.play('horn');const w=winner();hud.banner(w.draw?'DRAW':w.me?'VICTORY':'DEFEAT',w.text,w.me?TEAMCSS[G.me.team]:'#ff4a3a',3);ann(w.draw?'draw':w.me?'victory':'defeat');snd.music(false);}
function winner(){const[a,b]=G.teamScore;const t=a===b?-1:a>b?0:1;return{team:t,me:G.me&&t===G.me.team,draw:t<0,text:t<0?'SCORES LEVEL':TEAMN[t]+' WINS '+Math.floor(Math.max(a,b))+' – '+Math.floor(Math.min(a,b))};}
function showOver(){G.app='over';unlock();$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');document.body.classList.remove('inmech');$('cockpit').classList.remove('on');CK.root.visible=false;VM.root.visible=false;
 const me=G.me,win=winner();const pilots=G.fighters.filter(f=>f.kind==='pilot');const ranked=pilots.slice().sort((a,b)=>b.stats.pts-a.stats.pts||b.stats.kills-a.stats.kills);const ord=n=>n+(['TH','ST','ND','RD'][n%10>3||Math.floor(n%100/10)===1?0:n%10]);
 $('oeye').textContent=`ATTRITION · ${G.mapDef.name} · ${BOTDIFF[G.opt.diff].n} CPU`;$('oplace').textContent=win.draw?'=':win.me?'W':'L';$('ores').textContent=win.draw?'DRAW':win.me?'VICTORY':'DEFEAT';
 const tm=me.team;$('ofs').innerHTML=`<span style="color:${TEAMCSS[tm]}">${TEAMN[tm]} ${Math.floor(G.teamScore[tm])}</span> — <span style="color:${TEAMCSS[1-tm]}">${TEAMN[1-tm]} ${Math.floor(G.teamScore[1-tm])}</span> · YOU PLACED ${ord(ranked.filter(f=>f.team===tm).indexOf(me)+1)} ON YOUR TEAM`;
 $('oplace').style.color=win.me?TEAMCSS[tm]:'#8a8f9a';const acc=s=>s.shots?Math.round(s.hits/s.shots*100)+'%':'—';
 $('stats').innerHTML=`<tr><th>#</th><th>PILOT</th><th>ATTRITION</th><th>PILOTS</th><th>GRUNTS</th><th>FRAMES</th><th>DEATHS</th><th>ASSISTS</th><th>ACCURACY</th><th>BEST STREAK</th></tr>`+
  ranked.map((f,i)=>`<tr class="${f===me?'me ':''}t${f.team}"><td>${i+1}</td><td style="color:${TEAMCSS[f.team]}">${f.name}</td><td>${f.stats.pts}</td><td>${f.stats.kills}</td><td>${f.stats.grunts}</td><td>${f.stats.frames}</td><td>${f.stats.deaths}</td><td>${f.stats.assists}</td><td>${acc(f.stats)}</td><td>${f.stats.best}</td></tr>`).join('');
 const ms=Object.entries(me.stats.medals).sort((a,b)=>b[1]-a[1]).slice(0,12);$('omedals').innerHTML=ms.length?ms.map(([n,c])=>`<div class="medal"><i>★</i><span>${n} <b>×${c}</b></span></div>`).join(''):'<p class="tok" style="margin:0">No medals this match — go get some.</p>';
 const tok=award(me,win.me);$('otok').textContent=`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${best()} PTS`;$('over').hidden=false;G.results={won:win.me,draw:win.draw,stats:{...me.stats},team:G.teamScore.slice(),pts:lastAward.pts};}
let lastAward=null;
function award(me,won){const s=me.stats,mc=Object.values(s.medals).reduce((a,b)=>a+b,0);const pts=Math.max(0,s.kills*100+s.grunts*25+s.frames*300+s.assists*40+mc*20-s.deaths*10+(won?500:0));
 lastAward={pts,won,kills:s.kills,grunts:s.grunts,frames:s.frames,deaths:s.deaths,map:G.mapDef.name,diff:BOTDIFF[G.opt.diff].n.toLowerCase(),team:G.teamScore.map(Math.floor).join('-')};
 const tok=5+Math.min(60,pts/50|0);addRound(tok,won);saveBest('hardfall',pts);return tok;}
function best(){return bestScore('hardfall');}
function showBest(){seg.sync();const b=best();$('best').textContent=b?`YOUR BEST · ${b} PTS`:'';const M=MAPS[G.opt.map];$('mapdesc').textContent=M.sub+' — '+M.desc;}

/* ================= game loop ================= */
function stepMatch(dt){
 if(G.phase==='countdown'){G.cdT-=dt;const n=Math.ceil(G.cdT);if(n!==G.lastBeep&&n>0){G.lastBeep=n;snd.play('beep',null,1,0);}if(G.cdT<=0){G.phase='play';G.goT=1.2;snd.play('beep',null,1,1);}}
 else if(G.phase==='play'){G.goT-=dt;if(!G.attract){G.clock-=dt;if(G.clock<=60&&!G.ann1){G.ann1=true;ann('one minute remaining');snd.music(G.opt.mus>0,.8);}if(G.clock<=30&&!G.ann30){G.ann30=true;ann('thirty seconds');}if(G.clock<=0){G.clock=0;endMatch();}leadCheck();}
  if(G.me&&G.me.meter>=1&&!G.me.readyAnn&&!G.mechOf(G.me)){G.me.readyAnn=true;snd.play('ready');hud.banner('FRAME READY','PRESS V TO CALL IT DOWN','#ffb040',2.2);ann('your frame is ready');}if(G.me&&G.me.meter<1)G.me.readyAnn=false;}
 else if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.5?.35:1;if(G.endT>3.2){G.timeScale=1;showOver();}}}
function leadCheck(){const[a,b]=G.teamScore;const lead=a===b?null:a>b?0:1;if(lead!==null&&lead!==G.lastLead&&Math.max(a,b)>=10&&G.me){ann(lead===G.me.team?'your team has the lead':'your team lost the lead');G.lastLead=lead;}}
let annT=0;function stepAnn(dt){annT-=dt;if(annT<=0&&G.annQ.length){const t=G.annQ.shift();snd.announce(t);annT=1.4;}}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}
 if(G.app==='over'){G.time+=dt;visuals(dt);return;}
 const sdt=dt*G.timeScale;G.time+=sdt;readInput(dt);
 if(G.app==='play'||G.app==='menu'){stepMatch(dt);
  for(const f of G.fighters){if(f.ai&&f.alive&&(G.phase==='play'||G.attract)&&!G.botsFrozen)think(f,G,sdt);else if(f.ai)Object.assign(f.inp,blankInput());}
  for(const f of G.fighters)stepFighter(f,sdt);for(let i=G.mechs.length-1;i>=0;i--){const m=G.mechs[i];if(m)stepMech(m,sdt);}updateProj(sdt);
  if(G.me&&G.cine)G.me.inp=blankInput();}
 stepAnn(dt);visuals(sdt);}

/* ================= visuals: camera, viewmodel, cockpit, fx ================= */
let orbitA=0;const camPos=new V();
function visuals(dt){parts.update(dt);smoke.update(dt);beams.update(dt);shocks.update(dt);decals.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);
 for(const f of G.fighters){if(f===G.me&&f.alive&&G.app!=='over'&&!f.mech)continue;if(f.mech){f.model.root.visible=false;continue;}f.model.vis=true;if(f.alive||f.model.dead)f.model.pose(f,dt,G.time);}
 for(const m of G.mechs){const mine=m.pilot===G.me&&G.me&&(m.state==='piloted'||m.state==='embark'&&G.cine&&G.cine.t>G.cine.dur*.68)&&G.app!=='over';m.model.vis=!mine;if(m.state!=='drop'||m.dropT>1.8)m.model.root.visible=!mine||G.app==='over';m.model.pose(m,dt,G.time);
  if(m.model.footEv!==m.lastStep){m.lastStep=m.model.footEv;snd.play('stomp',mine?null:m.pos,mine?.7:1);const d=cam.position.distanceTo(m.pos);if(d<30)G.shake=Math.max(G.shake,mine?.14:.3*(1-d/30));
   if(Math.random()<.7)for(let k=0;k<5;k++)smoke.emit(m.pos.x+rnd(3)-1.5,m.pos.y+.2,m.pos.z+rnd(3)-1.5,rnd(2)-1,.4,rnd(2)-1,.5,.44,.38,1.1,1.2,-.05,1.2);}}
 G.shake=Math.max(0,G.shake-dt*2.4);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);
 const me=G.me;const aspect=innerWidth/innerHeight;let inMech=false;
 if((G.app==='play'||G.app==='paused')&&me){
  const m=me.mech;
  if(G.cine&&G.cine.m){// embark: climb up the frame and drop into the cockpit
   const c=G.cine,cm=c.m;c.t+=dt;const k=Math.min(1,c.t/c.dur),e=k*k*(3-2*k);const fw=dirOf(cm.yaw,0,tv);const seat=tv2.copy(cm.pos).setY(cm.pos.y+MECH.eye).addScaledVector(fw,1.0);
   const mid=tv3.copy(cm.pos).addScaledVector(fw,3.4).setY(cm.pos.y+MECH.eye+2.6);const a=c.from,p=new V();const u=1-e;p.set(u*u*a.x+2*u*e*mid.x+e*e*seat.x,u*u*a.y+2*u*e*mid.y+e*e*seat.y,u*u*a.z+2*u*e*mid.z+e*e*seat.z);cam.position.copy(p);
   const look=new THREE.Matrix4().lookAt(p,k<.6?tv3.copy(cm.pos).setY(cm.pos.y+3.2):tv3.copy(seat).addScaledVector(fw,10),UP);const q=new THREE.Quaternion().setFromRotationMatrix(look);cam.quaternion.copy(c.q).slerp(q,Math.min(1,k*1.8));
   cam.fov=damp(cam.fov,70,4,dt);if(k>.82)hud.flash(.25);VM.root.visible=false;CK.root.visible=k>.68;if(k>=1){G.cine=null;me.yaw=cm.yaw;me.pitch=0;cam.rotation.set(0,me.yaw,0);}
   inMech=k>.9;}
  else if(me.alive&&m&&m.state!=='dead'){inMech=true;VM.root.visible=false;CK.root.visible=G.phase!=='end';const fw=dirOf(m.yaw,0,tv);const sp=Math.hypot(m.vel.x,m.vel.z);const ph=m.model.ph;const bob=Math.abs(Math.sin(ph))*.12*Math.min(1,sp/6);
   cam.position.set(m.pos.x+fw.x*1.0,m.pos.y+MECH.eye-bob+(m.model.st.kneel*-1.4),m.pos.z+fw.z*1.0);const s=G.shake*G.shake*.06;me.roll=damp(me.roll||0,-(m.dashSide||0)*(m.dashT>0?.06:0),6,dt);
   cam.rotation.set(m.pitch+me.recoil+(Math.random()-.5)*s,m.yaw+(Math.random()-.5)*s,me.roll);const hf=G.opt.fov-6+(m.dashT>0?8:0);const vf=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;const zf=me.inp.zoom?1.5:1;cam.fov=damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,10,dt);
   CK.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,spin:m.spin,step:ph/Math.PI,punch:m.punchT>0,alarm:m.hp<MECH.hp*.25});
   CK.screen([`HULL ${Math.ceil(m.hp)}`,`${m.shieldT>0?'AEGIS UP':'SHIELD '+Math.ceil(m.sh)}`,(m.hp<MECH.hp*.25?'!WARNING · HULL CRITICAL':'CORE NOMINAL')]);mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else if(me.alive){CK.root.visible=false;VM.root.visible=G.phase!=='end';me.landDip=Math.max(0,me.landDip-dt*1.4);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=(me.onGround||me.wallT>0)&&me.slideT<=0?Math.sin(G.time*sp*1.1)*Math.min(1,sp/9)*.03:0;
   const eyeT=(me.slideT>0||me.h<1.5?PHY.eyeSlide:PHY.eye);me.eyeH=G.snapCam?eyeT:damp(me.eyeH||eyeT,eyeT,14,dt);G.snapCam=false;
   cam.position.set(me.pos.x,me.pos.y+me.eyeH-me.landDip+bob,me.pos.z);const s=G.shake*G.shake*.05;const strafe=(me.vel.x*Math.cos(me.yaw)-me.vel.z*Math.sin(me.yaw));
   me.roll=damp(me.roll||0,cl(-strafe*.003,-.025,.025)+(me.slideT>0?.05:0)+(me.wallT>0?me.wallSide*.16:0),me.wallT>0?7:9,dt);
   cam.rotation.set(me.pitch+me.recoil+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,me.roll);const w=me.weapons[me.wi],d=w&&WPN[w.id];
   const hf=G.opt.fov+(me.sprinting?6:0)+(me.slideT>0?8:0)+(me.wallT>0?6:0);const vf=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;const zf=d?1+(d.zoom-1)*me.zoom:1;
   cam.fov=damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,18,dt);
   if(w){const lk=d.smart&&fullLock(me)?1:0;VM.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,ground:me.onGround,sprint:me.sprinting,slide:me.slideT>0,air:!me.onGround&&me.wallT<=0,wall:me.wallT>0?me.wallSide:0,reload:me.reloadT>0?1-me.reloadT/d.reload:-1,swap:me.swapT>0?(me.swapT>.2?(.4-me.swapT)/.2:me.swapT/.2):0,melee:me.meleeT>0?1-me.meleeT/.35:0,zoom:me.zoom,lock:lk});}
   mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else{CK.root.visible=false;VM.root.visible=false;const k=me.killedBy;tv.copy(me.pos).add(tv2.set(Math.sin(me.yaw)*4,3.4,Math.cos(me.yaw)*4));camPos.lerp(tv,1-Math.exp(-dt*3));if(camPos.distanceTo(tv)>12)camPos.copy(tv);cam.position.copy(camPos);
   const kp=k?(k.mech?k.mech.pos:k.pos):null;const tgt=kp&&k.alive?tv2.copy(kp).setY(kp.y+(k.mech?4:1.2)):tv2.copy(me.pos).setY(me.pos.y+.5);const mm=new THREE.Matrix4().lookAt(cam.position,tgt,UP);const q=new THREE.Quaternion().setFromRotationMatrix(mm);cam.quaternion.slerp(q,1-Math.exp(-dt*4));cam.fov=damp(cam.fov,70,4,dt);}
  snd.listener(cam.position.x,cam.position.y,cam.position.z,me.mech?me.mech.yaw:me.yaw);snd.jet(me.wallT>0&&G.app==='play');snd.mech(inMech&&G.app==='play',me.mech?Math.hypot(me.mech.vel.x,me.mech.vel.z):0);
  // what is under the crosshair
  const eye=cam.position,fw=dirOf(inMech&&me.mech?me.mech.yaw:me.yaw,inMech&&me.mech?me.mech.pitch:me.pitch,new V());const wt=G.W.ray(eye,fw,150);const h=me.alive&&!G.cine?rayHit(eye,fw,wt,me,me.mech):null;const tg=h?(h.m||h.f):null;G.aimTarget=tg;G.aimFoe=!!(tg&&tg.team!==me.team);G.aimAlly=!!(tg&&tg.team===me.team);}
 else if(G.app==='menu'||G.app==='over'){VM.root.visible=false;CK.root.visible=false;orbitA+=dt*.04;const b=G.mapDef.bounds,rx=(b[1]-b[0])*.32,rz=(b[3]-b[2])*.3;cam.position.set(Math.cos(orbitA)*rx,16+Math.sin(orbitA*.7)*4,Math.sin(orbitA)*rz);cam.lookAt(0,3,0);
  cam.fov=G.app==='over'?55:62;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);snd.jet(false);snd.mech(false);}
 cam.aspect=aspect;cam.updateProjectionMatrix();
 if(msgT>0){msgT-=dt;if(msgT<=0)hud.prompt('');}
 if(G.app==='play'&&me){if(msgT<=0){const own=G.mechOf(me);if(me.alive&&!me.mech&&own&&own.state==='idle'&&Math.hypot(own.pos.x-me.pos.x,own.pos.z-me.pos.z)<4.6)hud.prompt('PRESS <kbd>E</kbd> TO BOARD YOUR FRAME');else if(me.mech&&me.mech.ejectHold>0)hud.prompt('EJECTING…');else hud.prompt('');}
  cam.updateMatrixWorld();hud.update(dt,cam);hud.board(keys.Tab||padBoard);}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','ControlLeft','KeyQ'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);}});
const {keys,edge,mouse}=I,{lock,unlock}=I,mouseVis={dx:0,dy:0};let padBoard=false;
let padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'&&!G.cine){const i=me.inp;const inM=!!me.mech;const w=me.weapons[me.wi];const zk=inM?(i.zoom?1.5:1):1+(me.zoom*((WPN[w?.id]?.zoom||1)-1));const sens=G.opt.sens*.0022/zk*(inM?.85:1);
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);i.fire=I.fire();
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.reload=!!ed('KeyR');i.swapTo=-1;i.swap=false;i.callMech=false;i.dash=false;i.shield=false;
  if(inM){i.zoom=false;i.nade=!!(mouse.re||ed('KeyQ'));i.shield=!!ed('KeyF');i.dash=!!(ed('ShiftLeft')||ed('ShiftRight')||ed('KeyC')||ed('ControlLeft'));i.melee=!!ed('KeyV');i.interact=!!keys.KeyE;i.sprint=false;i.slide=false;}
  else{i.zoom=mouse.r;i.sprint=!!(keys.ShiftLeft||keys.ShiftRight);i.slide=!!(ed('KeyC')||ed('ControlLeft'));i.melee=!!ed('KeyF');i.nade=!!ed('KeyQ');i.callMech=!!ed('KeyV');i.interact=!!ed('KeyE');
   if(ed('Digit1'))i.swapTo=0;if(ed('Digit2'))i.swapTo=1;if(ed('Digit3'))i.swapTo=2;if(mouse.wheel)i.swapTo=(me.wi+(mouse.wheel>0?1:2))%3;}
  mouse.wheel=0;mouse.re=false;
  if(I.locked&&me.alive){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.5,1.5);}mouseVis.dx+=mouse.dx;mouseVis.dy+=mouse.dy;mouse.dx=mouse.dy=0;
  const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,pr=padPrev;const P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0),zf=1+me.zoom;me.yaw-=lx*Math.abs(lx)*3.4*G.opt.sens*dt/zf;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.6*G.opt.sens*dt/zf,-1.5,1.5);
   if(P(0))i.jump=true;if(P(0)&&!pr[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;
   if(inM){if((b[6]?.value||0)>.3&&!pr.lt)i.nade=true;pr.lt=(b[6]?.value||0)>.3;if(P(1)&&!pr[1]||P(10)&&!pr[10])i.dash=true;if(P(5)&&!pr[5])i.nade=true;if(P(4)&&!pr[4])i.shield=true;if(P(11)&&!pr[11])i.melee=true;if(P(2))i.interact=true;}
   else{if((b[6]?.value||0)>.3)i.zoom=true;if(P(1)&&!pr[1])i.slide=true;if(P(10))i.sprint=true;if(P(2)&&!pr[2]){i.reload=true;i.interact=true;}if(P(3)&&!pr[3])i.swapTo=(me.wi+1)%3;if(P(5)&&!pr[5])i.nade=true;if(P(4)&&!pr[4])i.callMech=true;if(P(11)&&!pr[11])i.melee=true;}
   if(P(9)&&!pr[9])pause(true);padBoard=!!P(8);for(let k=0;k<17;k++)pr[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}}
 else if(G.app==='paused'){const gp=gamepad();if(gp&&gp.buttons[9]?.pressed&&!padPrev[9])pause(false);if(gp)padPrev[9]=gp.buttons[9]?.pressed;}
 I.flush();}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');unlock();snd.jet(false);snd.mech(false);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible&&!CK.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.85));fxStack=null;fxSize='';for(const k in mapCache){const S=mapCache[k].S;S.sun.castShadow=q>0;S.mirror.on=q>0&&!!S.theme.refl;S.mirror.scale=q>=2?.5:.33;}R.shadowMap.needsUpdate=true;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.5,saturation:T.sat,tint:T.tint,vignette:.36,grain:.025,aoStrength:.7,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade&&G.me){const m=G.me;const hp=G.app==='play'&&m.alive&&!m.mech?Math.min(1,m.health/70):1;fxStack.grade.uniforms.sat.value=T.sat*(.45+.55*hp);}
 cam.updateMatrixWorld();if(G.S.mirror.on)G.S.mirror.render(R,scene,cam,w*pr,h*pr,G.S.floorMesh);
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);if((VM.root.visible||CK.root.visible)&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(vmScene,vmCam);R.autoClear=true;}}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-map','map',true,()=>{if(G.app==='menu')attractMode();});seg('o-diff','diff');seg('o-time','time');seg('o-cap','cap');seg('o-team','team');
seg('o-sens','sens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app!=='menu',0);});seg('o-ann','ann',true,v=>snd.annOn=!!v);
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
postButton($('post'),'hardfall',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Hardfall\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} · ${a.team||''}\nPilots: ${a.kills||0} · Grunts: ${a.grunts||0} · Frames: ${a.frames||0} · Deaths: ${a.deaths||0}\nAttrition · ${a.map||''} · ${a.diff||''} CPU`];});

/* ================= boot ================= */
attractMode();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
const F=v=>typeof v==='number'?G.fighters[v]:v;
window.HARDFALL={visuals:dt=>visuals(dt),get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},G,step,render,start,toMenu,pause,endMatch,
 get me(){return G.me;},get player(){return G.me;},get fighters(){return G.fighters;},get bots(){return G.fighters.filter(f=>f.ai);},get pilots(){return G.fighters.filter(f=>f.kind==='pilot');},get grunts(){return G.fighters.filter(f=>f.kind==='grunt');},get mechs(){return G.mechs;},
 get clock(){return G.clock;},setClock(s){G.clock=s;},get score(){return G.teamScore.slice();},get cap(){return G.cap;},get results(){return G.results;},get W(){return G.W;},get D(){return G.D;},get proj(){return G.proj;},
 scene,cam,R,VM,CK,snd,setQuality:applyQuality,get gfx(){return gfx;},skipCountdown(){if(G.phase==='countdown')G.cdT=0;},
 kill(victim,killer=null,o={weapon:'rifle'}){const v=F(victim),k=F(killer);if(v&&v.alive)damage(v,9999,k,{...o,point:v.pos.clone().setY(v.pos.y+1)});},
 damage(victim,n,killer){const v=F(victim);damage(v,n,F(killer),{weapon:'rifle'});},
 teleport(x,y,z,f){f=F(f)||G.me;f.pos.set(x,y,z);f.vel.set(0,0,0);G.snapCam=true;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;},
 aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+(t.isMech?3.5:1.2));const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));},
 meter(v=1,f){(F(f)||G.me).meter=v;},callMech(f){f=F(f)||G.me;f.meter=1;callIn(f);return G.mechOf(f);},board(f){f=F(f)||G.me;const m=G.mechOf(f);if(m&&m.state==='idle'){f.pos.set(m.pos.x+2,m.pos.y,m.pos.z);embark(f,m);}return m;},
 eject(f){f=F(f)||G.me;if(f.mech)eject(f.mech,true);},input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},keys,mouse,freezeBots(on=true){G.botsFrozen=on;},
 nav:()=>({nodes:G.W.nodes.length,roam:G.W.roam.length,mech:G.WM.nodes.length})};
