// STARWARDEN — co-op space-fantasy looter shooter. Original game for Pixel Arcade.
// You and two CPU guardians run a strike: a ruined landing site (patrols + a vault seal to decrypt), the Hall of Echoes (waves)
// and a megalith ring where a multi-phase boss raises shielded anchors, summons adds and kneels for a damage phase.
// Three subclasses (grenade / melee / super), elemental shields matched by weapon element, engram drops with rarity, random
// perks and power; a vault + loadout in orbit between strikes (localStorage, keys looter_*).
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,cl,rnd,rr,wrapA,damp,fmt,pick} from './util.js';
import {PHY} from './world.js';
import {DEST,ARENA,buildLevel} from './level.js';
import {buildScene} from './scene.js';
import {Guardian3D,Foe3D,CLS,FAC,FTYPE} from './actors.js';
import {EL,ELS,RAR,ARCH,EXO,SLOTS,wstats,makeItem,rollDrop,addToVault,loadSave,storeSave,equipped,powerOf} from './loot.js';
import {gunFor,Viewmodel} from './guns.js';
import {Particles,Beams,Shocks,Decals,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {DIFF,ALLY_NAMES,newBrain,thinkGuardian,thinkFoe} from './ai.js';
import {HUD} from './hud.js';
import {Orbit,itemCard} from './ui.js';
import {orbTex,hexTex} from './tex.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),C=(r,g,b)=>new THREE.Color(r,g,b);
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);
const ELCOL={kin:C(2.2,2,1.7),solar:C(3.2,1.2,.25),arc:C(.5,1.7,3.4),void:C(1.9,.6,3.4)};
const FOE={grunt:{hp:130,spd:3.6,pref:[10,24],range:48,burst:3,gap:.16,cool:1.7,dmg:8,bolt:30,pts:10,sup:.03,eng:.05},
 rusher:{hp:95,spd:6.4,dmg:20,pts:12,sup:.03,eng:.05},
 major:{hp:360,sh:260,spd:3.4,pref:[8,22],range:52,burst:4,gap:.13,cool:1.9,dmg:12,bolt:34,pts:50,orb:1,sup:.08,eng:.3,ammo:.35},
 heavy:{hp:1500,sh:480,spd:2.1,pref:[8,30],range:58,burst:1,gap:.2,cool:2.6,dmg:30,bolt:20,splash:3.2,pts:120,orb:2,sup:.12,eng:.7,ammo:1},
 pylon:{hp:800,sh:320,pts:40,orb:1,sup:.06,eng:0,ammo:.5},
 boss:{hp:15000,pts:1500,sup:0,eng:0}};

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.06,9000);cam.rotation.order='YXZ';scene.add(cam);
const menuL=new THREE.PointLight(0xfff2e4,0,16,1.4);scene.add(menuL);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xdfe8ff,0x303440,1.1),vmKey=new THREE.DirectionalLight(0xffffff,1.8),vmRim=new THREE.DirectionalLight(0xffd090,.7);vmKey.position.set(-1,2,1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmRim);
const VM=new Viewmodel(vmCam);const snd=new Sound();
const parts=new Particles(scene,5000),smoke=new Particles(scene,1400,true),beams=new Beams(scene,160),shocks=new Shocks(scene,12),decals=new Decals(scene,120),lights=new LightPool(scene,4);
// enemy bolts: one instanced draw
const BOLTN=140,boltMesh=new THREE.InstancedMesh(new THREE.SphereGeometry(1,12,8),new THREE.MeshBasicMaterial({color:0xffffff}),BOLTN);boltMesh.frustumCulled=false;boltMesh.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(BOLTN*3),3);scene.add(boltMesh);
const glowSpr=orbTex(),hexT=hexTex();

/* ================= state ================= */
const G={app:'menu',phase:'countdown',opt:{dest:0,diff:1,time:15,sens:1,fov:100,vol:.8,mus:.6},save:loadSave(),team:[],me:null,foes:[],proj:[],eproj:[],drops:[],nums:[],time:0,clock:900,cdT:3,
 dif:DIFF[1],dest:DEST[0],D:null,W:null,S:null,stage:'patrol',power:100,lvl:100,hpMul:1,inMul:1,hurtFx:0,shake:0,timeScale:1,auto:false,loot:[],boss:null,chest:null,ck:0,wave:-1,waveT:0,beaconK:0,beaconW:0,
 objT:'',objS:'',objP:null,objPos:null,objTag:'',patrolN:0,results:null,endT:0,wipeT:0,addT:0,group:0,aimFoe:false,kills:0,pts:0,ptsKill:0,events:[]};
const saveOpt=stored('looter_opt',G.opt);
G.opt.dest=cl(G.opt.dest|0,0,DEST.length-1);
const hud=new HUD(G);
const log=t=>{G.events.push([Math.round(G.time*10)/10,t]);if(G.events.length>200)G.events.shift();};

/* ================= destinations ================= */
const cache={};let gfx=quality();
function loadDest(i){const def=DEST[i];if(G.S)scene.remove(G.S.root);let m=cache[i];if(!m){const D=buildLevel(def);const S=buildScene(D,R,gfx);m=cache[i]={D,S};}
 G.D=m.D;G.W=m.D.W;G.S=m.S;G.dest=def;scene.add(m.S.root);scene.environment=m.S.env;vmScene.environment=m.S.env;scene.fog=m.S.fog;scene.background=m.S.bg;fxStack=null;m.S.sun.castShadow=gfx>0;R.shadowMap.needsUpdate=true;
 for(const k in G.D.doors){G.D.doors[k].off=false;G.S.setDoor(k,0);}snd.ambience(def.theme);}

/* ================= guardians ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,sprint:false,slide:false,fire:false,zoom:false,reload:false,melee:false,nade:false,sel:-1,sup:false,interact:false});
function makeGuardian(name,cls,human,items){const Cc=CLS[cls];const f={name,cls,human,glow:Cc.glow,el:Cc.el,pos:new V(),vel:new V(),yaw:0,pitch:0,r:PHY.r,h:PHY.h,onGround:false,inp:blankInput(),alive:true,downed:false,bleedT:0,reviveK:0,respawnT:0,
  shield:100,maxSh:cls==='bulwark'?140:100,health:100,shDelay:0,weapons:[],guns:[],wi:0,fireCD:0,burstLeft:0,burstT:0,reloadT:0,reloadMul:1,swapT:0,swapTo:0,swapMid:false,meleeT:0,meleeCD2:0,meleeMax:10,punchCD:0,nadeT:0,nadeMax:cls==='seer'?17:20,
  superK:0,superT:0,supFire:0,castT:0,chargeT:0,zoom:0,spread:.01,lastFire:-9,dbl:false,coyote:0,jumpHeldT:0,fuel:1,fuelDelay:0,jetting:false,slideT:0,slideCD:0,airT:0,landDip:0,recoil:0,lunge:null,stepT:0,spawnT:0,novaCast:false,
  pk:{ramp:0,rampT:0,ksWin:0,ksT:0,quickT:0,spark:0,flare:0,multiN:0,multiT:-9},stats:{kills:0,deaths:0,revives:0,dmg:0,prec:0,abil:0,orbs:0,pts:0},
  model:new Guardian3D(cls),ai:human?null:newBrain()};
 setLoadout(f,items);scene.add(f.model.root);return f;}
function setLoadout(f,items){f.weapons=items.map(it=>{const st=wstats(it);return{it,st,mag:st.mag,res:it.s==='pow'?Math.ceil(st.res*.5):st.res};});f.guns=items.map(it=>{const g=gunFor(it);g.scale.setScalar(.85);return g;});setWeapon(f,0);}
function setWeapon(f,i){f.wi=i;f.reloadT=0;f.chargeT=0;f.burstLeft=0;f.zoom=0;f.model.setGun(f.guns[i]);if(f===G.me)VM.set(f.weapons[i].it,f.glow);}
const eyeOf=(f,o=new V())=>o.set(f.pos.x,f.pos.y+(f.slideT>0||f.h<1.5?PHY.eyeSlide:PHY.eye),f.pos.z);
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
const powMul=p=>cl(1+(p-G.lvl)*.015,.55,1.3);
function placeG(f,p,yaw){f.pos.copy(p);f.vel.set(0,0,0);f.yaw=yaw??0;f.pitch=0;f.alive=true;f.downed=false;f.reviveK=0;f.shield=f.maxSh;f.health=100;f.shDelay=0;f.slideT=0;f.h=PHY.h;f.lunge=null;f.spawnT=1;f.superT=0;f.model.revive();
 f.model.root.visible=f!==G.me;if(f.ai){f.ai.path=null;f.ai.target=null;f.ai.goalT=0;}}
function respawnG(f){const ck=G.D.check[G.ck],i=G.team.indexOf(f);placeG(f,ck[i]||ck[0],G.ck===0?0:0);parts.burst(tv.copy(f.pos).setY(f.pos.y+1),50,6,[ELCOL[f.el],C(2,2,2)],.25,.7,{up:true,grav:-2});snd.play('revive',f===G.me?null:f.pos);if(f===G.me){hud.flash(.5);G.snapCam=true;}}
function downG(f,by){if(f.downed||!f.alive)return;f.downed=true;f.bleedT=f.human?14:18;f.reviveK=0;f.superT=0;f.lunge=null;f.stats.deaths++;snd.play('down',f===G.me?null:f.pos);hud.feed(`<span style="color:#ff8a70">▼ ${f.name}</span> is down${by?' · '+by.name:''}`);log('down '+f.name);
 if(f===G.me){G.hurtFx=.9;G.downCam=f.pos.clone();}}
function reviveG(f,by){f.downed=false;f.health=60;f.shield=f.maxSh*.5;f.shDelay=1;f.reviveK=0;f.spawnT=.8;if(by){by.stats.revives++;hud.feed(`<span style="color:#9fd8ff">${by.name}</span> revived <span style="color:#9fd8ff">${f.name}</span>`);}snd.play('revive',f===G.me?null:f.pos);
 parts.burst(tv.copy(f.pos).setY(f.pos.y+1),40,5,[ELCOL[f.el],C(2,2,2)],.2,.6,{up:true,grav:-2});if(f===G.me)hud.flash(.4);log('revive '+f.name);}

function stepG(f,dt){const inp=f.inp;
 if(!f.alive){f.respawnT-=dt;if(f.respawnT<=0&&G.phase==='play')respawnG(f);return;}
 if(f.downed){f.bleedT-=dt;f.vel.x*=.85;f.vel.z*=.85;f.vel.y-=PHY.g*dt;G.W.move(f,dt);let by=null;for(const o of G.team)if(o!==f&&o.alive&&!o.downed&&o.inp.interact&&o.pos.distanceTo(f.pos)<2.4){by=o;break;}
  if(by){f.reviveK+=dt/2.2;if(f.reviveK>=1)reviveG(f,by);}else f.reviveK=Math.max(0,f.reviveK-dt*.4);
  if(f.bleedT<=0&&f.downed){f.downed=false;f.alive=false;f.respawnT=5;f.model.kill(new V(0,0,1),1);}
  if(f.pos.y<G.W.killY){f.downed=false;f.alive=false;f.respawnT=4;}return;}
 const frozen=G.phase==='countdown';f.spawnT-=dt;
 // regen + timers
 f.shDelay-=dt;if(f.shDelay<=0)f.shield=Math.min(f.maxSh,f.shield+(f.cls==='seer'?55:42)*dt);if(f.shDelay<-1.2)f.health=Math.min(100,f.health+28*dt);
 f.nadeT=Math.max(0,f.nadeT-dt);f.meleeCD2=Math.max(0,f.meleeCD2-dt);if(f.superT<=0)f.superK=Math.min(1,f.superK+dt/170);f.castT-=dt;
 const pk=f.pk;pk.rampT-=dt;if(pk.rampT<=0)pk.ramp=0;pk.ksWin-=dt;pk.ksT-=dt;pk.quickT-=dt;f.reloadMul=pk.quickT>0?.5:1;
 // ---- movement (from the arena kit: sprint, slide, double jump, glide) ----
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen){wx=wz=0;}
 const firing=f.lastFire>G.time-.25||f.chargeT>0;const sprint=inp.sprint&&inp.fwd>.3&&!firing&&f.zoom<.3&&!f.reloadT;f.sprinting=sprint&&f.onGround;
 let spd=(sprint?PHY.sprint:PHY.walk)*(f.cls==='strider'?1.06:1);if(f.zoom>.5)spd*=.8;
 const hs=Math.hypot(f.vel.x,f.vel.z);f.slideCD-=dt;
 if(inp.slide&&f.onGround&&hs>5.5&&f.slideCD<=0&&f.slideT<=0&&!frozen){f.slideT=PHY.slideT;f.slideCD=1;const k=Math.max(hs,PHY.slide)/hs;f.vel.x*=k;f.vel.z*=k;f.h=PHY.hSlide;snd.play('slide',f.pos,f===G.me?1:.6);}
 if(f.slideT>0){f.slideT-=dt;const fr=Math.exp(-PHY.slideFric*dt);f.vel.x*=fr;f.vel.z*=fr;if(f.slideT<=0||hs<3){if(G.W.free(f.pos.x,f.pos.y+.02,f.pos.z,f.r,PHY.h)){f.slideT=0;f.h=PHY.h;}else f.slideT=Math.max(f.slideT,.05);}}
 else if(f.onGround){const k=Math.min(1,PHY.accel*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
 else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
 if(f.onGround){f.coyote=.12;f.dbl=true;f.airT=0;}else{f.coyote-=dt;f.airT+=dt;}
 if(inp.jump)f.jumpHeldT+=dt;else f.jumpHeldT=0;
 if(inp.jumpEdge&&!frozen){if(f.coyote>0){f.vel.y=PHY.jump;f.coyote=0;f.onGround=false;f.jumpHeldT=0;if(f.slideT>0){f.slideT=0;f.h=PHY.h;}snd.play('jump',f.pos,f===G.me?1:.5);}
  else if(f.dbl){f.dbl=false;f.vel.y=Math.max(f.vel.y,PHY.djump*(f.cls==='strider'?1.1:1));f.jumpHeldT=0;parts.burst(tv.copy(f.pos),14,4,ELCOL[f.el],.2,.4,{grav:-1});snd.play('jump',f.pos,f===G.me?1:.5);}}
 f.jetting=false;if(inp.jump&&!f.onGround&&f.fuel>.01&&f.jumpHeldT>.22&&!frozen&&f.vel.y<2){f.jetting=true;f.vel.y=Math.min(f.vel.y+PHY.g*1.15*dt,1.2);f.fuel=Math.max(0,f.fuel-.42*dt);f.fuelDelay=.8;}
 else{f.fuelDelay-=dt;if(f.fuelDelay<=0)f.fuel=Math.min(1,f.fuel+.5*dt);}
 f.vel.y-=PHY.g*dt;if(f.vel.y<-45)f.vel.y=-45;
 if(f.lunge){f.lunge.t-=dt;const tg=f.lunge.target;if(tg&&tg.alive){tv.subVectors(tg.pos,f.pos);const d=tv.length();tv.normalize();f.vel.x=tv.x*f.lunge.v;f.vel.z=tv.z*f.lunge.v;f.vel.y=Math.max(f.vel.y,tv.y*f.lunge.v);if(d<tg.r+1.3||f.lunge.t<=0){meleeHit(f,tg);f.lunge=null;}}else f.lunge=null;}
 const wasG=f.onGround,vy0=f.vel.y;G.W.move(f,dt);if(f.onGround&&!wasG&&-vy0>6){f.landDip=Math.min(.35,-vy0*.018);snd.play('land',f.pos,f===G.me?1:.5,-vy0);}
 if(f.onGround&&hs>2&&f.slideT<=0){f.stepT-=dt*hs*(f.sprinting?.32:.38);if(f.stepT<=0){f.stepT=1;snd.play('step',f.pos,f===G.me?.8:.4);}}
 if(f.pos.y<G.W.killY){f.alive=false;f.respawnT=4;f.stats.deaths++;return;}
 if(frozen)return;
 // ---- weapons + abilities ----
 const w=f.weapons[f.wi],A=w.st;
 for(let i=0;i<2;i++){const x=f.weapons[i];if(x.res<x.st.res){x.resF=(x.resF||0)+x.st.mag*.25*dt;if(x.resF>=1){const n=Math.floor(x.resF);x.resF-=n;x.res=Math.min(x.st.res,x.res+n);}}}
 f.fireCD-=dt;f.punchCD-=dt;if(f.meleeT>0)f.meleeT-=dt;f.recoil*=Math.exp(-dt*10);
 f.spread=Math.max(A.spr||0,f.spread-dt*(A.sprMax||.02)*2.2);
 f.zoom=damp(f.zoom,inp.zoom&&!f.sprinting&&f.reloadT<=0&&f.swapT<=0&&f.superT<=0?1:0,16,dt);
 if(inp.sup&&f.superK>=1&&f.superT<=0){activateSuper(f);return;}
 if(f.superT>0){superStep(f,dt);return;}
 if(f.swapT>0){f.swapT-=dt;if(!f.swapMid&&f.swapT<.2){f.swapMid=true;setWeapon(f,f.swapTo);}if(f.swapT<=0)f.swapT=0;return;}
 if(inp.sel>=0&&inp.sel!==f.wi&&f.weapons[inp.sel]&&f.meleeT<=0){f.swapT=.4;f.swapMid=false;f.swapTo=inp.sel;f.reloadT=0;f.chargeT=0;f.burstLeft=0;if(f===G.me)snd.play('swap');return;}
 if(f.reloadT>0){f.reloadT-=dt;if(f.reloadT<=0){const take=Math.min(A.mag-w.mag,Math.floor(w.res));w.mag+=take;w.res-=take;f.reloadT=0;if(pk.ksWin>0){pk.ksT=5;pk.ksWin=0;}}}
 const reloadable=w.mag<A.mag&&w.res>=1;
 if(inp.reload&&!f.reloadT&&reloadable&&f.meleeT<=0){f.reloadT=A.reload*f.reloadMul;f.chargeT=0;f.burstLeft=0;snd.play('reload',f.pos,f===G.me?1:.5);}
 if(inp.nade&&f.nadeT<=0&&f.meleeT<=0){throwNade(f);}
 if(inp.melee&&f.meleeT<=0&&f.reloadT<=0){melee(f);return;}
 if(f.burstLeft>0){f.burstT-=dt;if(f.burstT<=0&&w.mag>0){shoot(f,w,A);f.burstLeft--;f.burstT=A.gap;}else if(w.mag<=0)f.burstLeft=0;}
 const canFire=f.reloadT<=0&&f.meleeT<=0&&!f.lunge&&f.castT<.1;
 if(A.charge){if(inp.fire&&canFire&&f.fireCD<=0&&w.mag>0){if(f.chargeT===0)snd.play('charge',f.pos,f===G.me?1:.6);f.chargeT+=dt;if(f.chargeT>=A.charge){shoot(f,w,A);f.chargeT=0;f.fireCD=A.rate;}}else f.chargeT=Math.max(0,f.chargeT-dt*3);}
 else if(inp.fire&&canFire&&f.fireCD<=0&&f.burstLeft<=0){
  if(w.mag<=0){if(reloadable){f.reloadT=A.reload*f.reloadMul;snd.play('reload',f.pos,f===G.me?1:.5);}else{if(f===G.me)snd.play('empty');f.fireCD=.3;}}
  else if(A.burst){f.burstLeft=A.burst;f.burstT=0;f.fireCD=A.rate;}else{shoot(f,w,A);f.fireCD=A.rate;}}
 if(w.mag<=0&&reloadable&&!f.reloadT&&!inp.fire&&f.fireCD<0&&f.burstLeft<=0){f.reloadT=A.reload*f.reloadMul;snd.play('reload',f.pos,f===G.me?1:.5);}
 if(f===G.me&&w.mag<=0&&w.res<1&&f.fireCD<-.6&&f.wi===2)f.inp.sel=0;}

/* ================= combat: rays, shooting, damage ================= */
// ray vs foes: head / core crit spheres + body capsule; pylons are spheres
function rayFoes(o,d,maxT,all){const out=[];for(const e of G.foes){if(!e.alive||e.spawnT>0)continue;const s=e.s;let best=null;
  const sph=(cx,cy,cz,r,crit,core)=>{const hx=cx-o.x,hy=cy-o.y,hz=cz-o.z,tc=hx*d.x+hy*d.y+hz*d.z;if(tc<-r||tc>maxT+r)return;const d2=hx*hx+hy*hy+hz*hz-tc*tc;if(d2>r*r)return;const t=tc-Math.sqrt(r*r-d2);if(t>0&&t<maxT&&(!best||t<best.t-.02))best={e,t,crit,core};};
  if(e.pylon){sph(e.pos.x,e.pos.y+2.2,e.pos.z,1.05,false);if(best)out.push(best);continue;}
  const hunch=e.kind==='rusher'?.22:0;const fx=-Math.sin(e.yaw),fz=-Math.cos(e.yaw);sph(e.pos.x+fx*hunch*s,e.pos.y+(1.76-hunch)*s-(e.kneel?.4*s:0),e.pos.z+fz*hunch*s,.19*s,true);
  if(e.boss&&e.exposed)sph(e.pos.x+fx*.7,e.pos.y+4.55-(e.kneel?1.3:0),e.pos.z+fz*.7,.75,true,true);
  const ay=e.pos.y+.2*s,by=e.pos.y+1.52*s-(e.kneel?.4*s:0),r=e.r*.95;const wx=o.x-e.pos.x,wz=o.z-e.pos.z;const A=d.x*d.x+d.z*d.z;
  if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){const t=(-B-Math.sqrt(D))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>ay-r*.5&&y<by+r*.3&&(!best||t<best.t-.05))best={e,t,crit:false};}}
  if(best)out.push(best);}
 out.sort((a,b)=>a.t-b.t);return all?out:out.slice(0,1);}
function muzzleOf(f,o=new V()){if(f===G.me&&G.app!=='menu'&&VM.root.visible&&VM.gun){const md=VM.gun.userData.muzzle;VM.root.updateWorldMatrix(true,true);
  o.copy(md).applyMatrix4(VM.gun.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(1.1).add(cam.position);return o;}
 if(f===G.me)return eyeOf(f,o).addScaledVector(dirOf(f.yaw,f.pitch,tv3),.8);f.model.gunMount.updateWorldMatrix(true,false);return o.set(0,.03,-.62).applyMatrix4(f.model.gunMount.matrixWorld);}
const falloff=(A,dist)=>A.fall&&dist>A.fall[0]?1-(1-A.fall[2])*cl((dist-A.fall[0])/(A.fall[1]-A.fall[0]),0,1):1;
function wMul(f,w){return powMul(w.it.p)*(1+.15*f.pk.ramp)*(f.pk.ksT>0?1.35:1);}
function shoot(f,w,A){w.mag--;f.lastFire=G.time;const me=f===G.me,it=w.it;const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());const right=new V(Math.cos(f.yaw),0,-Math.sin(f.yaw)),up=new V().crossVectors(right,fw);
 const moving=Math.hypot(f.vel.x,f.vel.z)>2?1.3:1,air=f.onGround?1:1.5,zm=1-f.zoom*.6;const spr=(A.pel?A.spr:f.spread)*moving*air*zm*(f.ai?1.25:1);const mz=muzzleOf(f,new V());
 const tc=EL[it.el].tr;const last=it.x==='halcyon'&&w.mag===0;
 if(A.proj){spawnProj('rocket',f,eye.clone().addScaledVector(fw,.7),fw.clone().multiplyScalar(A.speed),{dmg:A.dmg*wMul(f,w),r:A.splash,el:it.el,w});}
 else{const n=A.pel||1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*spr;const dir=fw.clone().addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();
   const ho={n:new V()};const wt=G.W.ray(eye,dir,A.range*1.3,ho);const hits=rayFoes(eye,dir,wt,A.pierce);let end=wt;
   for(const h of hits){let dmg=A.dmg*falloff(A,h.t)*wMul(f,w);if(h.crit)dmg*=A.crit*(h.core?1.5:1);if(last)dmg*=3;hitFoe(f,h.e,dmg,{crit:h.crit,el:it.el,point:eye.clone().addScaledVector(dir,h.t),dir,w});if(!A.pierce){end=h.t;break;}}
   const ep=eye.clone().addScaledVector(dir,end);
   if(A.scope){beams.beam(mz,ep,[tc[0]*1.1,tc[1]*1.1,tc[2]*1.1],.06,.7);beams.beam(mz,ep,[1.4,1.4,1.5],.015,.3);lights.flash(mz,EL[it.el].hex,22,10,.12);}
   else if(i<3||Math.random()<.35)beams.tracer(mz,ep,tc,A.pel?.016:.024,A.pel?260:330,A.pel?4:7);
   if(end>=wt&&wt<A.range*1.3){impact(ep,ho.n,tc,A.pel?3:7);}}}
 if(A.spr!==undefined&&!A.pel)f.spread=Math.min(A.sprMax||A.spr,f.spread+(A.sprAdd||0));
 snd.play(A.snd,me?null:f.pos,me?.9:.7);f.model.st.kick=1;if(me){VM.fire();f.recoil+=A.kick*.012;G.shake=Math.max(G.shake,A.kick*.07);}else if(Math.random()<.4)lights.flash(mz,EL[it.el].hex,5,5,.05);}
function impact(p,n,tc,k=7){const col=C(tc[0],tc[1],tc[2]);parts.burst(p,k,6,[col,C(2.2,1.8,1.2)],.07,.35,{dir:n,spread:.9,grav:14,drag:2,floor:p.y-2});decals.add(p,n,.16);if(Math.random()<.35)smoke.emit(p.x,p.y,p.z,n.x*.6,n.y*.6+.3,n.z*.6,.35,.35,.38,.4,.9,-.3,1);}
function num(e,v,crit,sh,p){if(G.nums.length>48)G.nums.shift();G.nums.push({p:(p||e.pos.clone().setY(e.pos.y+e.h*.8)).clone().add(new V(rnd(.4)-.2,rnd(.3),rnd(.4)-.2)),v:Math.max(1,Math.round(v)),crit,sh,t:0,ox:rnd(20)-10});}

// the damage pipeline: elemental shields, immunity, perks, kill credit
function hitFoe(g,e,amt,o={}){if(!e.alive||e.spawnT>0||amt<=0)return 0;const me=g===G.me;
 if(e.immune){if(me){num(e,0,false,true,o.point);hud.hit('');}if(Math.random()<.3)snd.play('tink',o.point||e.pos,.5);return 0;}
 if(e.weakT>0)amt*=1.25;if(e.boss&&e.exposed)amt*=1.5;
 let dealt=0;const w=o.w,has=k=>w&&w.it.k.includes(k);
 if(e.shield>0){const match=o.el===e.shEl;let m=match?2.5:o.el==='kin'?.6:.75;if(has('breaker'))m*=1.6;const sd=amt*m;
  if(sd>=e.shield){const over=(sd-e.shield)/m;dealt+=e.shield;e.shield=0;shieldBreak(e,match,g,o.el);amt=over;}else{e.shield-=sd;dealt+=sd;amt=0;if(me)num(e,sd,false,true,o.point);}
  e.model.hit(tv.set(0,0,-.5),.8);}
 if(amt>0){e.hp-=amt;dealt+=amt;if(me)num(e,amt,o.crit,false,o.point);e.model.hit&&e.model.hit(tv.set(0,0,-.5),.3);if(e.boss)bossThreshold(e);}
 e.hitT=G.time;e.hurtT=0;e.lastHitBy=g;if(!e.aware){e.aware=true;e.target=g;alertGroup(e);}
 if(g){g.stats.dmg+=dealt;if(g.superT<=0)g.superK=Math.min(1,g.superK+dealt*.00004);}
 if(e.kind!=='boss'&&e.kind!=='pylon'&&e.kind!=='heavy'&&o.crit&&amt>40&&!e.boss)e.stagger=Math.max(e.stagger,.25);
 if(o.point&&amt>0){const col=ELCOL[e.fac?FAC[e.fac].el:'void'];parts.burst(o.point,o.crit?7:4,4,[col,C(2.4,2,1.6)],.06,.3,{grav:6});}
 // on-hit weapon perks
 if(w&&g){const pk=g.pk;if(has('explo')){boom(o.point||e.pos,g,amt*.3,1.8,w.it.el,{small:true,skip:e});}
  if(has('spark')&&++pk.spark>=6){pk.spark=0;chain(o.point||e.pos,g,amt*1.2+30,2,8,[e]);}
  if(w.it.x==='galeheart'&&Math.random()<.4)chain(o.point||e.pos,g,22*powMul(w.it.p),2,7,[e],true);
  if(w.it.x==='sunspire'){if(++pk.flare>=3){pk.flare=0;boom(o.point||e.pos,g,110*powMul(w.it.p),3,'solar',{});}}
  if(w.it.x==='whisper'&&o.crit){w.mag=Math.min(w.st.mag,w.mag+1);}}
 if(me)hud.hit(e.hp<=0?'k':o.crit?'h':'');if(me&&o.crit)snd.play('headshot',null,.5);else if(me)snd.play('hitmark',null,.6,e.hp<=0?1:0);
 if(e.hp<=0)killFoe(e,g,o);return dealt;}
function shieldBreak(e,match,g,el){e.model.setShield(0,false);snd.play('shieldPop',e.pos);const c=ELCOL[e.shEl];parts.burst(tv.copy(e.pos).setY(e.pos.y+e.h*.55),46,7,[c,C(2.5,2.5,2.5)],.12,.6,{grav:4});shocks.fire(tv,c.clone().multiplyScalar(.5),2.5*e.s,.4);
 if(match){e.stagger=1.2;boom(tv.clone(),g,70*G.dif.hp,4,e.shEl,{skip:e,small:true});if(g===G.me)hud.feed(`<span style="color:${EL[e.shEl].c}">${EL[e.shEl].n} SHIELD SHATTERED</span>`);}}
function alertGroup(e){if(e.group<0)return;for(const o of G.foes)if(o.group===e.group&&o.alive&&!o.aware){o.aware=true;o.target=e.target;o.lastPos.copy(e.target?e.target.pos:e.pos);o.fireT=.6+rnd(.8);}}
function killFoe(e,g,o={}){if(!e.alive)return;e.alive=false;e.hp=0;e.deadT=0;G.kills++;const F=e.F;const dir=o.dir?tv.copy(o.dir).setY(0).normalize():tv.set(0,0,1);
 if(!e.pylon)e.model.kill(dir,o.splash?7:3);else e.model.kill();snd.play('foeDie',e.pos);const col=ELCOL[FAC[e.fac].el];parts.burst(tv2.copy(e.pos).setY(e.pos.y+e.h*.5),24+e.s*12,4*e.s,[col,C(1.6,1.5,1.4)],.1*e.s,.8,{grav:-1.5,drag:2});
 if(e.boss){bossDeath(e,g);return;}
 if(g){g.stats.kills++;g.stats.pts+=F.pts;if(g===G.me)G.ptsKill+=F.pts;if(g.superT<=0)g.superK=Math.min(1,g.superK+F.sup);if(o.abil)g.stats.abil++;if(o.crit)g.stats.prec++;
  const pk=g.pk;if(G.time-pk.multiT<2)pk.multiN++;else pk.multiN=1;pk.multiT=G.time;if(pk.multiN===2||o.super&&Math.random()<.5||o.abil&&Math.random()<.35)dropOrb(e.pos);
  const w=o.w,has=k=>w&&w.it.k.includes(k);
  if(w){if(has('rampage')){pk.ramp=Math.min(3,pk.ramp+1);pk.rampT=4.5;}if(has('kswitch'))pk.ksWin=3;if(has('quick')&&o.crit)pk.quickT=6;
   if(has('overflow')){const add=Math.min(Math.ceil(w.st.mag*.3),Math.floor(w.res));w.mag=Math.min(Math.ceil(w.st.mag*1.5),w.mag+add);w.res-=add;}
   if(has('starburst')&&o.crit)boom(e.pos.clone().setY(e.pos.y+1),g,140*powMul(w.it.p),3.5,w.it.el,{skip:e});if(has('drain')){g.health=Math.min(100,g.health+35);g.shield=Math.min(g.maxSh,g.shield+35);}
   if(w.it.x==='halcyon'){w.mag=w.st.mag;}if(w.it.x==='riftmaw'){dropOrb(e.pos);g.shield=Math.min(g.maxSh,g.shield+50);}if(w.it.x==='cataclysm')w.mag=Math.min(w.st.mag,w.mag+(w.res>=1?1:0)),w.res=Math.max(0,w.res-(w.mag>0?0:0));}
  if(g===G.me&&e.kind!=='grunt'&&e.kind!=='rusher')hud.feed(`<span style="color:#ffd78a">${e.name}</span> defeated`);}
 for(let i=0;i<(F.orb||0);i++)dropOrb(e.pos);
 const er=F.eng+G.dif.drop*.025;if(Math.random()<er)dropEngram(e.pos,{luck:e.kind==='heavy'?.25:e.kind==='major'?.1:0});
 if(Math.random()<(F.ammo||0)||G.kills%22===0)dropAmmo(e.pos);
 log('kill '+e.kind+' by '+(g?g.name:'-'));}

/* ================= guardian projectiles, explosions, abilities ================= */
const pGeo={nade:new THREE.IcosahedronGeometry(.13,1),rocket:new THREE.CylinderGeometry(.07,.09,.5,8).rotateX(Math.PI/2),hammer:(()=>{const g=new THREE.BoxGeometry(.5,.32,.32);return g;})(),nova:new THREE.IcosahedronGeometry(.9,3),palm:new THREE.IcosahedronGeometry(.25,1),bomb:new THREE.IcosahedronGeometry(.1,0)};
const pMat={};const pm=el=>pMat[el]||(pMat[el]=new THREE.MeshBasicMaterial({color:ELCOL[el]}));
function spawnProj(kind,f,p,v,o={}){const m=new THREE.Mesh(pGeo[kind]||pGeo.nade,kind==='rocket'?new THREE.MeshStandardMaterial({color:0x3a3f48,metalness:.8,roughness:.4,emissive:ELCOL[o.el||'solar'],emissiveIntensity:.25}):pm(o.el||f.el));m.position.copy(p);scene.add(m);
 const pr={kind,pos:p.clone(),vel:v.clone(),owner:f,life:o.life||5,mesh:m,light:kind==='rocket'||kind==='nova'||kind==='hammer'?lights.grab(null,EL[o.el||f.el].hex,kind==='nova'?30:8,kind==='nova'?14:7):null,...o};G.proj.push(pr);if(kind==='rocket')m.lookAt(p.clone().add(v));return pr;}
function killProj(p){scene.remove(p.mesh);if(p.light)lights.release(p.light);p.dead=true;}
function boom(pos,owner,dmg,radius,el,o={}){const c=ELCOL[el]||ELCOL.solar;const small=o.small;
 parts.burst(pos,small?18:90,small?6:14,[c,c.clone().multiplyScalar(.6),C(3,2.6,2)],small?.2:.45,small?.4:.7,{grav:3,drag:2.4});
 if(!small){parts.burst(pos,30,20,[c,C(2.6,2.2,1.6)],.1,.8,{grav:14,drag:1.2});for(let k=0;k<12;k++)smoke.emit(pos.x+rnd(1.6)-.8,pos.y+rnd(1.2)-.3,pos.z+rnd(1.6)-.8,rnd(2)-1,rnd(2),rnd(2)-1,.2,.18,.22,1.4+rnd(1),2+rnd(1),-.4,1.2);
  shocks.fire(pos,c.clone().multiplyScalar(.5),radius*1.1,.45);lights.flash(pos,EL[el]?.hex||0xff8a30,70,radius*4,.4);snd.play(el==='arc'?'arc':el==='void'?'void':el==='solar'?'solar':'shot',pos);
  const ho={n:new V()};const gd=G.W.ray(pos,tv.set(0,-1,0),3,ho);if(gd<3)decals.add(pos.clone().setY(pos.y-gd),ho.n,radius*.6);const md=G.me?G.me.pos.distanceTo(pos):99;if(md<radius*4)G.shake=Math.max(G.shake,cl(1-md/(radius*4),0,1)*.7);}
 let hits=0;for(const e of G.foes){if(!e.alive||e===o.skip||e.spawnT>0)continue;const cpos=tv2.copy(e.pos);cpos.y+=e.pylon?2.2:e.h*.5;const d=Math.max(0,cpos.distanceTo(pos)-e.r);if(d>radius)continue;if(!G.W.los(pos,cpos)&&!G.W.los(pos,tv3.copy(e.pos).setY(e.pos.y+e.h*.9)))continue;
  const k=Math.max(.35,1-d/radius);hitFoe(owner,e,dmg*k,{el,point:cpos.clone(),dir:tv3.subVectors(cpos,pos).normalize().clone(),splash:true,abil:o.abil,super:o.super});hits++;
  if(o.push&&!e.boss&&e.kind!=='heavy'&&!e.pylon){e.vel.addScaledVector(tv3,o.push);e.vel.y+=o.push*.4;e.onGround=false;}}
 return hits;}
// jagged lightning between foes
function bolt(a,b,col){let p=a.clone();const n=6;for(let i=1;i<=n;i++){const q=a.clone().lerp(b,i/n);if(i<n)q.add(new V(rnd(.8)-.4,rnd(.8)-.4,rnd(.8)-.4));beams.beam(p,q,col,.05,.35);p=q;}}
function chain(pos,g,dmg,n,range,skip=[],thin){const c=ELCOL.arc;const hit=[...skip];let from=pos.clone();for(let k=0;k<n;k++){let best=null,bd=range;for(const e of G.foes){if(!e.alive||e.spawnT>0||hit.includes(e))continue;const d=e.pos.distanceTo(from);if(d<bd&&G.W.los(from,tv.copy(e.pos).setY(e.pos.y+e.h*.6))){bd=d;best=e;}}
  if(!best)break;hit.push(best);const to=best.pos.clone().setY(best.pos.y+best.h*.6);bolt(from,to,thin?[c.r*.6,c.g*.6,c.b*.6]:[c.r,c.g,c.b]);hitFoe(g,best,dmg,{el:'arc',point:to,abil:!thin});from=to;}
 if(hit.length>skip.length&&!thin)snd.play('arc',pos,.6);}
function throwNade(f){f.nadeT=f.nadeMax;f.castT=.3;const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.12,new V());const p=eye.addScaledVector(fw,.5);const v=fw.multiplyScalar(f.cls==='seer'?17:20).add(tv.copy(f.vel).multiplyScalar(.5));v.y+=2.5;
 spawnProj('nade',f,p,v,{el:f.el,cls:f.cls,fuse:f.cls==='bulwark'?99:4,life:5});snd.play('cast',f===G.me?null:f.pos,.6);if(f===G.me)VM.kick=.5;}
function nadeBurst(p,pos){const f=p.owner,m=powMul(G.power);if(p.cls==='strider'){boom(pos,f,150*m,4.5,'arc',{abil:true});chain(pos,f,85*m,4,9,[]);}
 else if(p.cls==='bulwark'){boom(pos,f,240*m,5.5,'solar',{abil:true,push:6});G.proj.push({kind:'field',el:'solar',pos:pos.clone(),owner:f,life:2.5,r:3.2,dps:40*m,tick:0,mesh:null});}
 else{boom(pos,f,60*m,4,'void',{abil:true});G.proj.push({kind:'field',el:'void',pos:pos.clone(),owner:f,life:4.5,r:5.5,dps:75*m,tick:0,pull:true,mesh:null});shocks.fire(pos,C(.8,.3,1.4),5.5,.8);}}
function melee(f){f.meleeT=.35;snd.play('melee',f.pos,f===G.me?1:.6);const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());
 const range=f.meleeCD2<=0?(f.cls==='strider'?9:f.cls==='seer'?0:4):2.8;
 if(f.meleeCD2<=0&&f.cls==='seer'){f.meleeCD2=f.meleeMax;f.castT=.25;spawnProj('palm',f,eye.clone().addScaledVector(fw,.6),fw.clone().multiplyScalar(48),{el:'void',life:.3});snd.play('void',f===G.me?null:f.pos,.5);return;}
 let best=null,bd=range;for(const o of G.foes){if(!o.alive||o.spawnT>0)continue;tv.copy(o.pos).setY(o.pos.y+o.h*.5).sub(eye);const d=tv.length()-o.r;if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.6)continue;if(!G.W.los(eye,tv2.copy(o.pos).setY(o.pos.y+o.h*.5)))continue;best=o;bd=d;}
 if(f.meleeCD2<=0&&best){f.meleeCD2=f.meleeMax;f.charged=true;if(bd>1.6)f.lunge={target:best,t:.3,v:f.cls==='strider'?26:16};else meleeHit(f,best);}
 else if(best&&bd<2.8&&f.punchCD<=0){f.punchCD=.9;f.charged=false;meleeHit(f,best);}}
function meleeHit(f,o){if(!o.alive)return;const m=powMul(G.power);tv.subVectors(o.pos,f.pos).setY(0).normalize();const pt=tv2.copy(o.pos).setY(o.pos.y+o.h*.6).clone();
 if(f.charged){f.charged=false;if(f.cls==='strider'){hitFoe(f,o,170*m,{el:'arc',point:pt,dir:tv.clone(),abil:true});chain(pt,f,70*m,2,7,[o]);parts.burst(pt,40,8,[ELCOL.arc,C(2.5,2.5,3)],.12,.4,{grav:4});}
  else{hitFoe(f,o,260*m,{el:'solar',point:pt,dir:tv.clone(),abil:true});boom(pt,f,70*m,2.6,'solar',{skip:o,small:true,push:7});if(!o.boss&&o.kind!=='heavy'&&!o.pylon){o.vel.addScaledVector(tv,11);o.vel.y=5;o.onGround=false;o.stagger=1;}}}
 else{hitFoe(f,o,50*m,{el:'kin',point:pt,dir:tv.clone()});if(!o.boss&&!o.pylon)o.vel.addScaledVector(tv,4);}
 if(f===G.me)G.shake=Math.max(G.shake,.3);snd.play('melee',o.pos);}
function activateSuper(f){f.superK=0;f.chargeT=0;f.reloadT=0;f.burstLeft=0;f.zoom=0;f.supFire=0;f.shield=f.maxSh;f.superT=f.cls==='strider'?12:f.cls==='bulwark'?13:1.1;f.novaCast=f.cls==='seer';
 snd.play('super',f===G.me?null:f.pos);shocks.fire(tv.copy(f.pos).setY(f.pos.y+1),ELCOL[f.el].clone().multiplyScalar(.5),6,.6);parts.burst(tv,70,9,[ELCOL[f.el],C(3,3,3)],.2,.7,{grav:-1});
 if(f===G.me){hud.banner(CLS[f.cls].sup,'SUPER ACTIVE',EL[f.el].c,1.6);hud.flash(.3);}else hud.feed(`<span style="color:${EL[f.el].c}">${f.name}</span> · ${CLS[f.cls].sup}`);log('super '+f.name);}
function superStep(f,dt){f.superT-=dt;f.supFire-=dt;const m=powMul(G.power)*1.1;const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());
 if(f.cls==='strider'&&f.inp.fire&&f.supFire<=0){f.supFire=.32;const ho={n:new V()};const wt=G.W.ray(eye,fw,90,ho);const h=rayFoes(eye,fw,wt)[0];const end=eye.clone().addScaledVector(fw,h?h.t:wt);const from=muzzleOf(f,new V());
  bolt(from,end,[.6,2,4]);beams.beam(from,end,[.3,1,2],.12,.25);lights.flash(end,0x5fd8ff,30,10,.15);snd.play('arc',f===G.me?null:f.pos,.7);if(h){hitFoe(f,h.e,230*m,{el:'arc',point:end,dir:fw,super:true,crit:h.crit});chain(end,f,140*m,3,9,[h.e]);}else impact(end,ho.n,[.6,1.8,3.4],10);
  if(f===G.me){VM.kick=.6;G.shake=Math.max(G.shake,.15);}f.lastFire=G.time;}
 if(f.cls==='bulwark'&&f.inp.fire&&f.supFire<=0){f.supFire=.5;const v=fw.clone().multiplyScalar(40);v.y+=3;spawnProj('hammer',f,eye.clone().addScaledVector(fw,.8),v,{el:'solar',life:4,dmg:320*m,r:4.5});snd.play('solar',f===G.me?null:f.pos,.4);f.lastFire=G.time;if(f===G.me)VM.kick=.8;}
 if(f.cls==='seer'&&f.novaCast&&f.superT<.45){f.novaCast=false;spawnProj('nova',f,eye.clone().addScaledVector(fw,1.2),fw.clone().multiplyScalar(26),{el:'void',life:4,dmg:1300*m,r:9});snd.play('void',f===G.me?null:f.pos);}
 if(f.cls==='seer'&&f.superT>.45){f.vel.y=Math.max(f.vel.y,2.2);}
 if(f.superT<=0){f.superT=0;setWeapon(f,f.wi);}}
function updateProj(dt){const ho={n:new V()};for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.life-=dt;let die=false;
  if(p.kind==='field'){p.tick-=dt;if(p.tick<=0){p.tick=.25;for(const e of G.foes){if(!e.alive||e.spawnT>0)continue;const d=e.pos.distanceTo(p.pos);if(d>p.r+e.r)continue;hitFoe(p.owner,e,p.dps*.25,{el:p.el,abil:true,point:e.pos.clone().setY(e.pos.y+1)});
     if(p.pull&&!e.boss&&e.kind!=='heavy'&&!e.pylon&&d>.8){e.vel.x+=(p.pos.x-e.pos.x)/d*2.4;e.vel.z+=(p.pos.z-e.pos.z)/d*2.4;}}}
   const c=ELCOL[p.el];for(let k=0;k<4;k++){const a=Math.random()*6.28,r=Math.random()*p.r;parts.emit(p.pos.x+Math.cos(a)*r,p.pos.y+.1,p.pos.z+Math.sin(a)*r,-Math.sin(a)*3,1+rnd(2),Math.cos(a)*3,c.r*.6,c.g*.6,c.b*.6,.18,.5,-1);}
   if(p.life<=0){G.proj.splice(i,1);}continue;}
  if(p.kind==='hammer'||p.kind==='nade'||p.kind==='bomb')p.vel.y-=PHY.g*(p.kind==='hammer'?.25:1)*dt;
  if(p.stuck){if(p.stuck.e){p.pos.copy(p.stuck.e.pos).add(p.stuck.off);if(!p.stuck.e.alive)p.stuck.e=null;}p.fuse-=dt;if(p.fuse<=0){nadeBurst(p,p.pos.clone());die=true;}}
  else{const step=p.vel.length()*dt;if(step>1e-5){const dir=tv.copy(p.vel).normalize();const wt=G.W.ray(p.pos,dir,step+.12,ho);const fh=rayFoes(p.pos,dir,Math.min(wt,step+.25))[0];
    if(fh){const hp=p.pos.clone().addScaledVector(dir,fh.t);
     if(p.kind==='rocket'){hitFoe(p.owner,fh.e,p.dmg*.25,{el:p.el,point:hp,dir:dir.clone(),w:p.w});rocketBoom(p,hp);die=true;}
     else if(p.kind==='hammer'||p.kind==='nova'){boom(hp,p.owner,p.dmg,p.r,p.el,{super:true,push:p.kind==='nova'?10:5});if(p.kind==='nova')novaFx(hp);die=true;}
     else if(p.kind==='palm'){hitFoe(p.owner,fh.e,160*powMul(G.power),{el:'void',point:hp,dir:dir.clone(),abil:true});fh.e.weakT=6;parts.burst(hp,40,7,[ELCOL.void,C(2,2,3)],.14,.5,{grav:2});die=true;}
     else if(p.kind==='bomb'){boom(hp,p.owner,p.dmg,2.6,'solar',{small:true});die=true;}
     else if(p.kind==='nade'){if(p.cls==='bulwark'){p.stuck={e:fh.e,off:hp.clone().sub(fh.e.pos)};p.fuse=.8;snd.play('stick',hp);}else{nadeBurst(p,hp);die=true;}}}
    else if(wt<step+.12){const hp=p.pos.clone().addScaledVector(dir,Math.max(0,wt-.12));
     if(p.kind==='rocket'){rocketBoom(p,hp);die=true;}else if(p.kind==='hammer'||p.kind==='nova'){boom(hp,p.owner,p.dmg,p.r,p.el,{super:true,push:5});if(p.kind==='nova')novaFx(hp);die=true;}
     else if(p.kind==='palm'){die=true;parts.burst(hp,12,3,ELCOL.void,.1,.3,{});}else if(p.kind==='bomb'){boom(hp,p.owner,p.dmg,2.6,'solar',{small:true});die=true;}
     else if(p.kind==='nade'){if(p.cls==='strider'){nadeBurst(p,hp);die=true;}else if(p.cls==='bulwark'){p.pos.copy(hp);p.stuck={e:null,off:new V()};p.fuse=.8;p.vel.set(0,0,0);}
      else{const vn=p.vel.dot(ho.n);p.vel.addScaledVector(ho.n,-1.5*vn).multiplyScalar(.5);p.pos.copy(hp);if(ho.n.y>.6){nadeBurst(p,hp.clone().setY(hp.y+.1));die=true;}}}}
    else p.pos.addScaledVector(dir,step);}}
  if(!die&&p.life<=0){if(p.kind==='nade')nadeBurst(p,p.pos.clone());else if(p.kind==='rocket')rocketBoom(p,p.pos.clone());else if(p.kind==='nova'){boom(p.pos,p.owner,p.dmg,p.r,'void',{super:true});novaFx(p.pos);}die=true;}
  if(die){killProj(p);G.proj.splice(i,1);continue;}
  if(p.mesh){p.mesh.position.copy(p.pos);if(p.kind==='hammer'){p.mesh.rotation.x+=dt*14;}if(p.kind==='nova')p.mesh.rotation.y+=dt*5;}if(p.light)p.light.L.position.copy(p.pos);
  const c=ELCOL[p.el||'solar'];if(p.kind==='rocket'){smoke.emit(p.pos.x,p.pos.y,p.pos.z,rnd(.6)-.3,rnd(.6),rnd(.6)-.3,.4,.4,.42,.4,1.2,-.3,1);parts.emit(p.pos.x,p.pos.y,p.pos.z,0,0,0,2.4,1.2,.4,.2,.12);}
  else for(let k=0;k<(p.kind==='nova'?6:2);k++)parts.emit(p.pos.x+rnd(.3)-.15,p.pos.y+rnd(.3)-.15,p.pos.z+rnd(.3)-.15,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,c.r*.7,c.g*.7,c.b*.7,p.kind==='nova'?.5:.16,.35);}}
function rocketBoom(p,pos){boom(pos,p.owner,p.dmg,p.r,p.el,{w:p.w});if(p.w&&p.w.it.x==='cataclysm')for(let k=0;k<4;k++)spawnProj('bomb',p.owner,pos.clone().setY(pos.y+.6),new V(rnd(8)-4,5+rnd(3),rnd(8)-4),{el:'solar',dmg:110*powMul(p.w.it.p),life:3});}
function novaFx(pos){shocks.fire(pos,C(1.2,.4,2.2),10,.9);parts.burst(pos,200,18,[ELCOL.void,C(3,2,4),C(1,.4,2)],.4,1,{grav:1,drag:2});lights.flash(pos,0xb46bff,120,40,.8);G.shake=Math.max(G.shake,.9);}

/* ================= foes ================= */
class Pylon3D{constructor(el){const g=this.root=new THREE.Group();const c=new THREE.Color(EL[el].hex);
  const base=new THREE.Mesh(new THREE.CylinderGeometry(1.1,1.5,.8,8),new THREE.MeshStandardMaterial({color:0x2a2a34,roughness:.4,metalness:.8}));base.position.y=.4;g.add(base);
  this.cm=new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.4),emissive:c,emissiveIntensity:1.6,roughness:.1,metalness:.3,transparent:true,opacity:.92});this.cr=new THREE.Mesh(new THREE.OctahedronGeometry(.85,0),this.cm);this.cr.scale.set(.8,1.9,.8);this.cr.position.y=2.2;g.add(this.cr);
  this.ring=new THREE.Mesh(new THREE.TorusGeometry(1.3,.05,6,40),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(2.5)}));this.ring.rotation.x=Math.PI/2;this.ring.position.y=2.2;g.add(this.ring);
  this.shell=new THREE.Mesh(new THREE.SphereGeometry(1.45,24,16),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(.5),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false}));this.shell.position.y=2.2;g.add(this.shell);
  this.beam=new THREE.Mesh(new THREE.CylinderGeometry(.08,.08,1,6),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(2),transparent:true,opacity:.7,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(this.beam);this.dead=null;this.flash=0;}
 setShield(c,on){this.shell.visible=on;}hit(){this.flash=.15;}
 pose(e,dt,t){this.root.position.copy(e.pos);this.cr.rotation.y=t*1.5;this.ring.rotation.z=t;this.ring.position.y=2.2+Math.sin(t*2)*.3;this.flash=Math.max(0,this.flash-dt);this.cm.emissiveIntensity=1.6+this.flash*10;
  const b=G.boss;if(b&&b.alive&&!this.dead){const a=tv.set(e.pos.x,e.pos.y+2.2,e.pos.z),c=tv2.set(b.pos.x,b.pos.y+4.5,b.pos.z);this.beam.visible=true;this.beam.position.lerpVectors(a,c,.5);this.beam.scale.set(1,a.distanceTo(c),1);this.beam.quaternion.setFromUnitVectors(UP,tv3.subVectors(c,a).normalize());}else this.beam.visible=false;
  if(this.dead){this.dead.t+=dt;this.cr.scale.multiplyScalar(Math.exp(-dt*3));this.root.visible=this.dead.t<1.5;}}
 kill(){this.dead={t:0};this.beam.visible=false;this.shell.visible=false;}}
function spawnFoe(kind,pos,o={}){const F=FOE[kind],fac=G.dest.fac,T=FTYPE[kind]||{s:1,r:1,h:4.4};const hm=G.dif.hp*G.hpMul;
 const e={kind,fac,F,name:kind==='pylon'?'ANCHOR':FAC[fac].names[kind],pos:pos.clone(),vel:new V(),yaw:o.yaw??Math.random()*6.28,pitch:0,onGround:false,r:T.r,h:T.h,aimY:kind==='pylon'?2.2:T.h*.7,s:T.s,
  hp:F.hp*hm,hpMax:F.hp*hm,shield:0,shMax:0,shEl:null,alive:true,spawnT:o.instant?0:.8,home:pos.clone(),aware:!!o.aware,group:o.group??-1,target:null,lastPos:pos.clone(),lastSeen:-9,seen:false,lastHitBy:null,
  thinkT:Math.random()*.3,fireT:1+Math.random()*1.5,burst:0,burstN:F.burst||1,gap:F.gap||.2,cool:F.cool||2,range:F.range||40,pref:F.pref||[0,2],speed:F.spd||0,atkT:0,stagger:0,blinkCD:3,hurtT:9,hitT:-9,wanderT:rnd(3),path:null,pi:0,pathT:rnd(1),strafe:1,strafeT:0,weakT:0,
  pylon:kind==='pylon',boss:kind==='boss',deadT:0,kneel:0};
 if(F.sh){e.shMax=e.shield=F.sh*hm;e.shEl=o.el||(kind==='heavy'?FAC[fac].el:Math.random()<.5?FAC[fac].el:pick(ELS));}
 if(o.aware){e.target=o.target||nearestG(e.pos);if(e.target)e.lastPos.copy(e.target.pos);}
 e.model=e.pylon?new Pylon3D(e.shEl||'arc'):new Foe3D(fac,kind);e.model.root.position.copy(pos);e.model.root.rotation.y=e.yaw;scene.add(e.model.root);if(e.shEl&&!e.pylon)e.model.setShield(EL[e.shEl].hex,true);
 if(!o.instant)rift(pos,T.s);G.foes.push(e);return e;}
function rift(pos,s=1){const c=ELCOL[FAC[G.dest.fac].el];shocks.fire(tv.copy(pos).setY(pos.y+1.2*s),c.clone().multiplyScalar(.4),1.8*s,.5);parts.burst(tv,40,4*s,[c,C(2.2,2.2,2.2)],.18*s,.8,{grav:-2,jit:1});snd.play('cast',pos,.35);}
function nearestG(p){let b=null,bd=1e9;for(const g of G.team){if(!g.alive||g.downed)continue;const d=g.pos.distanceTo(p);if(d<bd){bd=d;b=g;}}return b;}
const stepFoeCtx={};
function stepFoes(dt){for(let i=G.foes.length-1;i>=0;i--){const e=G.foes[i];
  if(!e.alive){e.deadT+=dt;e.model.pose(e,dt,G.time);if(e.deadT>(e.boss?4:1.8)){scene.remove(e.model.root);if(e.model.beam)scene.remove(e.model.beam);G.foes.splice(i,1);}continue;}
  if(e.spawnT>0){e.spawnT-=dt;e.model.pose(e,dt,G.time);continue;}
  e.hurtT+=dt;e.weakT-=dt;
  if(e.boss)stepBoss(e,dt);else if(!e.pylon&&G.phase==='play')thinkFoe(e,G,dt);
  if(!e.pylon){e.vel.y-=PHY.g*dt;if(e.vel.y<-40)e.vel.y=-40;G.W.move(e,dt);if(!e.onGround){}else if(e.vel.y<0)e.vel.y=0;if(e.pos.y<G.W.killY){e.alive=false;e.deadT=9;}
   if(e.boss){const dx=e.pos.x-ARENA.x,dz=e.pos.z-ARENA.z,d=Math.hypot(dx,dz);if(d>24){e.pos.x=ARENA.x+dx/d*24;e.pos.z=ARENA.z+dz/d*24;}}}
  e.model.pose(e,dt,G.time);}}
// enemy weapons
function foeShoot(e,t){const F=e.F,mz=tv.set(e.pos.x-Math.sin(e.yaw)*.4*e.s,e.pos.y+e.h*.68,e.pos.z-Math.cos(e.yaw)*.4*e.s).clone();
 const tp=tv2.set(t.pos.x,t.pos.y+1.1,t.pos.z);const dist=mz.distanceTo(tp),tof=dist/F.bolt;const acc=G.dif.acc;tp.x+=t.vel.x*tof*acc*.8;tp.z+=t.vel.z*tof*acc*.8;
 const err=(1.15-acc)*.09*(1+dist/40);const dir=tp.sub(mz).normalize();dir.x+=rnd(err*2)-err;dir.y+=rnd(err*1.5)-err*.75;dir.z+=rnd(err*2)-err;dir.normalize();
 G.eproj.push({pos:mz,vel:dir.multiplyScalar(F.bolt),dmg:F.dmg*G.inMul*G.dif.dmg,el:FAC[e.fac].el,life:3,r:e.kind==='heavy'?.42:e.kind==='major'?.2:.16,splash:F.splash||0,owner:e});
 e.model.kick=1;snd.play(e.kind==='heavy'?'foeBig':'foe',e.pos,.5);}
function foeMelee(e,t){if(t.pos.distanceTo(e.pos)>2.6)return;damageG(t,FOE.rusher.dmg*G.inMul*G.dif.dmg,e,{melee:true});tv.subVectors(t.pos,e.pos).setY(0).normalize();t.vel.addScaledVector(tv,4);}
function foeSlam(e){const c=ELCOL[FAC[e.fac].el];shocks.fire(tv.copy(e.pos).setY(e.pos.y+.3),c.clone().multiplyScalar(.5),6,.5);parts.burst(tv,60,8,[c,C(1.6,1.4,1.2)],.25,.6,{up:true,grav:10});snd.play('slam',e.pos,.6);
 for(const g of G.team){if(!g.alive||g.downed)continue;const d=g.pos.distanceTo(e.pos);if(d<5.5){damageG(g,34*G.inMul*G.dif.dmg*(1-d/7),e,{});tv.subVectors(g.pos,e.pos).setY(0).normalize();g.vel.addScaledVector(tv,8);g.vel.y=5;g.onGround=false;}}}
function foeBlink(e){const side=Math.random()<.5?-1:1;const d=new V(Math.cos(e.yaw)*side,0,-Math.sin(e.yaw)*side);for(const k of[6,4,2.5]){const p=e.pos.clone().addScaledVector(d,k);if(G.W.free(p.x,p.y+.1,p.z,e.r,e.h)&&G.W.groundBelow(p.x,p.y+.5,p.z,.2)>p.y-1){rift(e.pos,e.s*.6);e.pos.copy(p);rift(p,e.s*.6);break;}}}
G.foeShoot=foeShoot;G.foeMelee=foeMelee;G.foeSlam=foeSlam;G.foeBlink=foeBlink;G.alertGroup=alertGroup;
function updateEproj(dt){let n=0;const m4=new THREE.Matrix4(),q=new THREE.Quaternion(),s=new V();const ho={n:new V()};
 for(let i=G.eproj.length-1;i>=0;i--){const b=G.eproj[i];b.life-=dt;
  if(b.homing&&b.target&&b.target.alive){const want=tv.set(b.target.pos.x,b.target.pos.y+1.1,b.target.pos.z).sub(b.pos).normalize().multiplyScalar(b.vel.length());b.vel.lerp(want,Math.min(1,dt*b.homing));}
  const step=b.vel.length()*dt,dir=tv2.copy(b.vel).normalize();const wt=G.W.ray(b.pos,dir,step,ho);let hit=null;
  for(const g of G.team){if(!g.alive||g.downed)continue;const cx=g.pos.x-b.pos.x,cy=g.pos.y+.95-b.pos.y,cz=g.pos.z-b.pos.z;const tc=cl(cx*dir.x+cy*dir.y+cz*dir.z,0,step);const dx=cx-dir.x*tc,dy=(cy-dir.y*tc)*.55,dz=cz-dir.z*tc;if(dx*dx+dy*dy+dz*dz<(b.r+.42)**2&&tc<=wt){hit=g;break;}}
  if(hit||wt<step||b.life<=0){const p=hit?hit.pos.clone().setY(hit.pos.y+1):b.pos.clone().addScaledVector(dir,Math.min(wt,step));
   if(hit)damageG(hit,b.dmg,b.owner,{dir});if(b.splash){for(const g of G.team){if(!g.alive||g.downed||g===hit)continue;const d=g.pos.distanceTo(p);if(d<b.splash)damageG(g,b.dmg*.6*(1-d/b.splash),b.owner,{});}}
   const c=ELCOL[b.el];parts.burst(p,b.splash?40:8,b.splash?7:3,[c,C(2,2,2)],b.splash?.25:.08,.35,{grav:4});if(b.splash){shocks.fire(p,c.clone().multiplyScalar(.4),b.splash,.35);snd.play('solar',p,.5);}
   G.eproj.splice(i,1);continue;}
  b.pos.addScaledVector(dir,step);if(n<BOLTN){m4.compose(b.pos,q,s.setScalar(b.r));boltMesh.setMatrixAt(n,m4);const c=ELCOL[b.el];boltMesh.instanceColor.setXYZ(n,c.r*1.4,c.g*1.4,c.b*1.4);n++;}
  if(Math.random()<.6){const c=ELCOL[b.el];parts.emit(b.pos.x,b.pos.y,b.pos.z,rnd(.4)-.2,rnd(.4)-.2,rnd(.4)-.2,c.r*.5,c.g*.5,c.b*.5,b.r*1.4,.25);}}
 boltMesh.count=n;boltMesh.instanceMatrix.needsUpdate=true;boltMesh.instanceColor.needsUpdate=true;}
function damageG(g,amt,src,o={}){if(!g.alive||g.downed||g.spawnT>0||amt<=0||G.phase!=='play')return;amt*=g.superT>0?.5:1;if(!g.human)amt*=.8;
 const had=g.shield>0;let a=amt;g.stats.taken=(g.stats.taken||0)+amt;if(g.shield>0){const s=Math.min(g.shield,a);g.shield-=s;a-=s;}if(a>0)g.health-=a;g.shDelay=4;
 if(had)g.model.hit(tv.set(0,0,-.4),Math.min(1,amt/30));if(had&&g.shield<=0&&g===G.me){snd.play('shieldPop');hud.flash(.12);}
 if(g.ai){g.ai.flinch=.3;if(src&&src.alive&&(!g.ai.target||g.ai.lostT>.5))g.ai.target=src;}
 if(g===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amt/90);G.shake=Math.max(G.shake,Math.min(.35,amt/80));g.zoom=0;if(src){const dx=src.pos.x-g.pos.x,dz=src.pos.z-g.pos.z;hud.damageFrom(wrapA(Math.atan2(-dx,-dz)-g.yaw)*-1);}snd.play('hitBody',null,.5);}
 if(g.health<=0){g.health=0;downG(g,src);}}

/* ================= boss ================= */
function spawnBoss(){const p=new V(ARENA.x,1.2,ARENA.z);const e=spawnFoe('boss',p,{aware:true,yaw:0});e.phase=1;e.immune=false;e.exposed=false;e.exposedT=0;e.atkCD=4;e.atk=null;e.atkT=0;e.thr=[.66,.33];e.imm=0;e.beamT=0;e.r=1.5;e.h=6.4;e.aimY=4.4;
 G.boss=e;snd.play('roar');hud.banner(e.name,'ULTRA · '+FAC[G.dest.fac].n,'#ffd78a',3.2);snd.boss=true;log('boss spawned');return e;}
function bossThreshold(e){const t=e.thr[e.imm];if(t!==undefined&&e.hp<=e.hpMax*t){e.hp=e.hpMax*t;if(e.exposed)e.phase++;e.exposed=false;e.exposedT=0;startImmune(e);}}
function startImmune(e){e.immune=true;e.atk=null;e.atkT=0;e.beamT=0;rift(e.pos,3);e.pos.set(ARENA.x,1.2,ARENA.z);e.vel.set(0,0,0);rift(e.pos,3);snd.play('roar');
 const n=e.imm===0?3:4,els=['solar','arc','void'];for(let i=0;i<n;i++){spawnFoe('pylon',G.D.pylons[i],{el:els[(i+e.imm)%3],instant:false});}
 e.imm++;G.addT=3;hud.banner('ANCHORS RISE','DESTROY THEM TO BREAK THE BARRIER','#ffd78a',2.6);log('boss immune '+e.imm);}
function bossAdds(n,withMajor){const pts=G.D.addSpawns;for(let i=0;i<n;i++){const p=pts[(Math.random()*pts.length)|0].clone().add(new V(rnd(3)-1.5,0,rnd(3)-1.5));spawnFoe(i===0&&withMajor?'major':Math.random()<.4?'rusher':'grunt',p,{aware:true});}}
function stepBoss(e,dt){const t=nearestG(e.pos);e.atkT=Math.max(0,e.atkT-dt);
 if(e.immune){e.kneel=damp(e.kneel,0,3,dt);G.addT-=dt;if(G.addT<=0){G.addT=13;if(G.foes.filter(f=>f.alive&&!f.boss&&!f.pylon).length<7)bossAdds(3,Math.random()<.5);}
  if(!G.foes.some(f=>f.alive&&f.pylon)){e.immune=false;e.exposed=true;e.exposedT=12;e.atk=null;hud.banner('BARRIER BROKEN',e.name+' IS VULNERABLE','#ff8a50',2.4);snd.play('shieldPop',e.pos);shocks.fire(tv.copy(e.pos).setY(4),C(2,1.4,.6),12,.8);log('boss exposed');}}
 if(e.exposed){e.kneel=damp(e.kneel,1,4,dt);e.vel.x*=.8;e.vel.z*=.8;e.exposedT-=dt;if(e.exposedT<=0){e.exposed=false;e.phase++;e.atkCD=2;snd.play('roar');hud.banner(e.phase>=3?'IT GROWS DESPERATE':'IT RISES AGAIN','','#ff8a50',1.8);}return;}
 e.kneel=damp(e.kneel,0,3,dt);if(!t)return;
 const dx=t.pos.x-e.pos.x,dz=t.pos.z-e.pos.z,dist=Math.hypot(dx,dz);const wy=Math.atan2(-dx,-dz);
 if(e.beamT>0){e.beamT-=dt;e.yaw+=e.beamDir*dt*.75;bossBeam(e,dt);if(e.beamT<=0)e.beamMesh.visible=false;return;}
 e.yaw+=wrapA(wy-e.yaw)*Math.min(1,dt*2.2);
 if(!e.immune&&e.atkT<=0){const want=dist>14?1:dist<8?-.6:0;e.vel.x=damp(e.vel.x,dx/(dist||1)*want*2.4,3,dt);e.vel.z=damp(e.vel.z,dz/(dist||1)*want*2.4,3,dt);}else{e.vel.x*=.9;e.vel.z*=.9;}
 e.atkCD-=dt*(e.phase>=3?1.4:1)*(e.immune?.7:1)*G.dif.rate;
 if(e.atk==='slam'&&e.atkT<.4&&!e.slamDone){e.slamDone=true;bossSlam(e);}
 if(e.atkCD<=0&&e.atkT<=0){e.atkCD=3.4+rnd(1.6);const near=G.team.some(g=>g.alive&&!g.downed&&g.pos.distanceTo(e.pos)<9);
  if(near&&!e.immune){e.atk='slam';e.atkT=1.1;e.slamDone=false;snd.play('roar',e.pos,.5);}
  else if(e.phase>=2&&!e.immune&&Math.random()<.45){e.atk='beam';e.beamT=3.2;e.beamDir=Math.random()<.5?-1:1;e.yaw-=e.beamDir*1.1;snd.play('beam',e.pos);}
  else{e.atk='volley';e.atkT=.6;const n=e.phase>=3?8:5;for(let i=0;i<n;i++){const a=e.yaw+(i-(n-1)/2)*.3;const p=e.pos.clone().add(new V(-Math.sin(e.yaw)*1.2,4.8,-Math.cos(e.yaw)*1.2));
    const tg=G.team.filter(g=>g.alive&&!g.downed)[i%3]||t;G.eproj.push({pos:p,vel:new V(-Math.sin(a)*13,3+rnd(2),-Math.cos(a)*13),dmg:26*G.inMul*G.dif.dmg,el:FAC[e.fac].el,life:6,r:.45,splash:2,owner:e,homing:1.6,target:tg});}e.model.kick=1;snd.play('foeBig',e.pos);}}}
function bossSlam(e){const c=ELCOL[FAC[e.fac].el];shocks.fire(tv.copy(e.pos).setY(.5),c.clone().multiplyScalar(.6),14,.7);parts.burst(tv,120,14,[c,C(2,1.6,1.2)],.35,.8,{up:true,grav:10});snd.play('slam',e.pos);G.shake=Math.max(G.shake,.8);
 for(const g of G.team){if(!g.alive||g.downed)continue;const d=g.pos.distanceTo(e.pos);if(d<12&&g.pos.y<e.pos.y+1.2){damageG(g,58*G.inMul*G.dif.dmg*(1-d/14),e,{});tv.subVectors(g.pos,e.pos).setY(0).normalize();g.vel.addScaledVector(tv,12);g.vel.y=6;g.onGround=false;}}}
function bossBeam(e,dt){if(!e.beamMesh){const m=new THREE.Mesh(new THREE.CylinderGeometry(.35,.35,1,12,1,true),new THREE.MeshBasicMaterial({color:ELCOL[FAC[e.fac].el].clone().multiplyScalar(1.6),transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false}));scene.add(m);e.beamMesh=m;}
 const o=new V(e.pos.x-Math.sin(e.yaw)*.8,e.pos.y+5.6,e.pos.z-Math.cos(e.yaw)*.8),d=dirOf(e.yaw,-.12,new V());const tele=e.beamT>2.6;const L=G.W.ray(o,d,70);const end=o.clone().addScaledVector(d,L);
 const m=e.beamMesh;m.visible=true;m.position.lerpVectors(o,end,.5);m.scale.set(tele?.25:1+Math.sin(G.time*40)*.15,L,tele?.25:1+Math.sin(G.time*40)*.15);m.quaternion.setFromUnitVectors(UP,d);
 if(!tele){parts.burst(end,4,5,[ELCOL[FAC[e.fac].el],C(2,2,2)],.15,.3,{grav:6});for(const g of G.team){if(!g.alive||g.downed)continue;const c=tv.set(g.pos.x,g.pos.y+.9,g.pos.z).sub(o);const tc=c.dot(d);if(tc<0||tc>L)continue;const dd=c.addScaledVector(d,-tc).length();if(dd<1.1)damageG(g,70*G.inMul*G.dif.dmg*dt,e,{});}}}
function bossDeath(e,g){G.boss=e;e.exposed=false;e.immune=false;if(e.beamMesh)e.beamMesh.visible=false;snd.boss=false;
 for(const f of G.foes)if(f!==e&&f.alive){f.alive=false;f.deadT=0;f.model.kill&&f.model.kill(new V(0,0,1),2);}G.eproj.length=0;
 G.timeScale=.3;G.slowT=1.6;const c=ELCOL[FAC[e.fac].el];for(let k=0;k<4;k++)setTimeout(()=>{if(G.app!=='play')return;const p=e.pos.clone().add(new V(rnd(3)-1.5,2+rnd(4),rnd(3)-1.5));boom(p,null,0,6,FAC[e.fac].el,{});},k*260);
 shocks.fire(tv.copy(e.pos).setY(3),c,22,1.2);snd.play('exotic');hud.banner(e.name,'DEFEATED','#ffd78a',3.2);if(g){g.stats.pts+=FOE.boss.pts;}G.bossDown=true;log('boss down');setStage('chest');}

/* ================= drops: engrams, orbs of power, heavy ammo, the chest ================= */
const engGeo=new THREE.OctahedronGeometry(.32,0),engWire=new THREE.OctahedronGeometry(.42,0),orbGeo=new THREE.IcosahedronGeometry(.16,1),ammoGeo=new THREE.BoxGeometry(.5,.32,.32);
function dropMesh(kind,col){const g=new THREE.Group();const c=new THREE.Color(col);
 if(kind==='engram'){g.add(new THREE.Mesh(engGeo,new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.5),emissive:c,emissiveIntensity:1.8,metalness:.6,roughness:.2})));g.add(new THREE.Mesh(engWire,new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(2),wireframe:true})));
  const beam=new THREE.Mesh(new THREE.CylinderGeometry(.04,.12,6,8,1,true),new THREE.MeshBasicMaterial({color:c.clone().multiplyScalar(1.4),transparent:true,opacity:.5,blending:THREE.AdditiveBlending,depthWrite:false}));beam.position.y=3;g.add(beam);}
 else if(kind==='orb')g.add(new THREE.Mesh(orbGeo,new THREE.MeshBasicMaterial({color:C(3,2.6,1.6)})));
 else{g.add(new THREE.Mesh(ammoGeo,new THREE.MeshStandardMaterial({color:0x2a1a3a,emissive:0x9a40ff,emissiveIntensity:.8,metalness:.6,roughness:.3})));}
 const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:glowSpr,color:kind==='orb'?C(3,2.6,1.6):c.clone().multiplyScalar(kind==='ammo'?1:2),blending:THREE.AdditiveBlending,depthWrite:false,transparent:true}));sp.scale.setScalar(kind==='engram'?1.8:kind==='orb'?.9:1.1);g.add(sp);scene.add(g);return g;}
function addDrop(kind,pos,o={}){const p=pos.clone().setY(pos.y+1);const d={kind,pos:p,vel:new V(rnd(4)-2,4+rnd(2),rnd(4)-2),life:kind==='engram'?999:35,t:0,...o};d.mesh=dropMesh(kind,kind==='engram'?RAR[o.r].c:kind==='orb'?0xffe0a0:0x9a40ff);G.drops.push(d);return d;}
function dropEngram(pos,o={}){const r=Math.random();const lk=o.luck||0;const rr=r<.015+lk*.06+G.dif.drop*.012?3:r<.25+lk+G.dif.drop*.07?2:r<.68?1:0;addDrop('engram',pos,{r:Math.max(rr,o.min||0)});snd.play('engram',pos,.4);}
function dropOrb(pos){addDrop('orb',pos);}function dropAmmo(pos){addDrop('ammo',pos);}
function pickEngram(d){const it=rollDrop(G.save,{r:d.r,diff:G.dif.drop*2});addToVault(G.save,it);G.loot.push(it);storeSave(G.save);hud.toast(it);snd.play(it.r===3?'exotic':'engram');if(it.r===3)hud.banner(it.n,'EXOTIC ACQUIRED','#ffcf3f',2.6);log('loot '+RAR[it.r].n+' '+it.n+' '+it.p);}
function updateDrops(dt){for(let i=G.drops.length-1;i>=0;i--){const d=G.drops[i];d.t+=dt;d.life-=dt;
  if(d.vel){d.vel.y-=14*dt;d.pos.addScaledVector(d.vel,dt);const gy=G.W.groundBelow(d.pos.x,d.pos.y+.6,d.pos.z)+.6;if(d.pos.y<gy){d.pos.y=gy;d.vel=null;}}
  d.mesh.position.copy(d.pos);d.mesh.position.y+=Math.sin(d.t*2.4)*.12;d.mesh.rotation.y+=dt*1.6;let take=null;
  for(const g of G.team){if(!g.alive||g.downed)continue;const dd=g.pos.distanceTo(tv.copy(d.pos).setY(d.pos.y-.9));
   if(d.kind==='engram'&&g===G.me&&dd<2.6){take=g;break;}if(d.kind==='orb'&&dd<2.4){take=g;break;}if(d.kind==='ammo'&&dd<2.2){const w=g.weapons[2];if(w.res<w.st.res){take=g;break;}}}
  if(take){if(d.kind==='engram')pickEngram(d);else if(d.kind==='orb'){take.superK=Math.min(1,take.superK+.1);take.stats.orbs++;if(take===G.me)snd.play('orb');}else{const w=take.weapons[2];w.res=Math.min(w.st.res,w.res+Math.max(1,Math.ceil(w.st.res*.4)));if(take===G.me){snd.play('pickup');hud.feed('<span style="color:#c08aff">HEAVY AMMO</span>');}}}
  if(take||d.life<=0){scene.remove(d.mesh);G.drops.splice(i,1);}}}
function makeChest(){const g=new THREE.Group();const gold=new THREE.MeshStandardMaterial({color:0xc89a40,metalness:1,roughness:.25}),dark=new THREE.MeshStandardMaterial({color:0x1c1a24,metalness:.7,roughness:.4});const gc=G.S.glow;
 const base=new THREE.Mesh(new THREE.BoxGeometry(1.6,.8,1),dark);base.position.y=.4;g.add(base);const trim=new THREE.Mesh(new THREE.BoxGeometry(1.66,.1,1.06),gold);trim.position.y=.78;g.add(trim);
 const lid=new THREE.Group();lid.position.set(0,.82,.5);const lm=new THREE.Mesh(new THREE.BoxGeometry(1.6,.36,1),dark);lm.position.set(0,.18,-.5);lid.add(lm);const lt=new THREE.Mesh(new THREE.BoxGeometry(1.66,.08,1.06),gold);lt.position.set(0,.36,-.5);lid.add(lt);g.add(lid);
 const seam=new THREE.Mesh(new THREE.BoxGeometry(1.5,.05,.9),new THREE.MeshBasicMaterial({color:gc.clone().multiplyScalar(3)}));seam.position.y=.82;g.add(seam);g.traverse(o=>{if(o.isMesh)o.castShadow=true;});
 g.position.set(ARENA.x,1.2,ARENA.z+3);scene.add(g);rift(g.position,1.4);return{g,lid,open:0,opened:false,pos:g.position.clone(),hold:0};}

/* ================= strike flow ================= */
function setStage(s){G.stage=s;snd.play('objective');log('stage '+s);
 if(s==='patrol'){G.objT='DEFEAT THE PATROL';G.objTag='PATROL';}
 else if(s==='beacon'){G.objT='DECRYPT THE VAULT SEAL';G.objTag='VAULT SEAL';G.beaconK=0;G.beaconW=0;G.objPos=G.D.beacon.clone();hud.banner('VAULT SEAL','HOLD THE BEACON TO DECRYPT',G.S.glow2.getStyle(),2.2);G.ck=Math.max(G.ck,0);}
 else if(s==='hall'){G.objT='PUSH THROUGH THE HALL OF ECHOES';G.objTag='HALL';G.wave=-1;G.waveT=0;G.objPos=new V(0,0,-30);G.ck=1;openDoor('gate');dropAmmo(new V(0,0,-6));}
 else if(s==='ring'){G.objT='ENTER THE MEGALITH RING';G.objTag='RING';G.objPos=new V(0,0,-112);G.ck=2;openDoor('hall');}
 else if(s==='boss'){G.objT='DEFEAT '+FAC[G.dest.fac].names.boss;G.objTag='';G.objPos=null;G.ck=3;closeDoor('hall');spawnBoss();dropAmmo(new V(-8,0,-118));dropAmmo(new V(8,0,-118));
  for(const g of G.team){if(g.pos.z>-106){const p=G.D.check[3][G.team.indexOf(g)];if(g.alive&&!g.downed){placeG(g,p,0);}else if(g.downed){g.pos.copy(p);}}}}
 else if(s==='chest'){G.objT='CLAIM YOUR REWARD';G.objTag='REWARD';G.chest=makeChest();G.objPos=G.chest.pos.clone();}
 G.objP=null;G.objS='';}
const doorAnim={};function openDoor(k){const b=G.D.doors[k];b.off=true;doorAnim[k]={t:0,dir:1};snd.play('door',tv.set((b.a[0]+b.b[0])/2,2,(b.a[2]+b.b[2])/2));}
function closeDoor(k){const b=G.D.doors[k];b.off=false;doorAnim[k]={t:1,dir:-1};snd.play('door',tv.set((b.a[0]+b.b[0])/2,2,(b.a[2]+b.b[2])/2));}
function stepDoors(dt){for(const k in doorAnim){const a=doorAnim[k];a.t=cl(a.t+a.dir*dt/2,0,1);G.S.setDoor(k,a.t);}}
function teamIn(fn){return G.team.some(g=>g.alive&&!g.downed&&fn(g));}
function stepFlow(dt){const alive=G.foes.filter(f=>f.alive);
 if(G.stage==='patrol'){const left=alive.filter(f=>f.group>=0&&f.group<100);const dead=G.patrolN-left.length;G.objS=`${dead} / ${G.patrolN} DEFEATED`;G.objP=dead/G.patrolN;
  let near=null,nd=1e9;for(const f of left){const d=f.pos.distanceTo(G.me.pos);if(d<nd){nd=d;near=f;}}G.objPos=near?near.pos.clone():G.D.beacon.clone();
  if(left.length<=3)for(const f of left)if(!f.aware){f.aware=true;f.target=nearestG(f.pos);if(f.target)f.lastPos.copy(f.target.pos);}
  if(!left.length)setStage('beacon');}
 else if(G.stage==='beacon'){const on=teamIn(g=>g.pos.distanceTo(G.D.beacon)<8);if(on)G.beaconK=Math.min(1,G.beaconK+dt/32);G.objP=G.beaconK;G.objS=on?'DECRYPTING… '+Math.round(G.beaconK*100)+'%':'STAND NEAR THE BEACON';
  if(G.S.D?.beaconFx){}const fx=G.D.beaconFx;if(fx){fx.U.uK.value=damp(fx.U.uK.value,.2+G.beaconK*1.4,3,dt);}
  if(G.beaconW===0&&G.beaconK>.06){G.beaconW=1;const sp=G.D.beaconSpawns;['grunt','grunt','rusher','grunt','rusher','grunt'].forEach((k,i)=>spawnFoe(k,sp[i%sp.length].clone().add(new V(rnd(2)-1,0,rnd(2)-1)),{aware:true,group:100}));hud.banner('THEY COME','DEFEND THE BEACON','#ff8a50',1.6);}
  if(G.beaconW===1&&G.beaconK>.5){G.beaconW=2;const sp=G.D.beaconSpawns;['major','grunt','grunt','grunt','rusher'].forEach((k,i)=>spawnFoe(k,sp[(i+2)%sp.length].clone().add(new V(rnd(2)-1,0,rnd(2)-1)),{aware:true,group:101}));}
  if(G.beaconK>=1&&!alive.some(f=>f.group>=100&&f.group<200)){setStage('hall');hud.banner('SEAL BROKEN','THE VAULT OPENS','#ffd78a',2);}
  else if(G.beaconK>=1){G.objS='CLEAR THE REMAINING ENEMIES';}}
 else if(G.stage==='hall'){const wv=G.D.waves;
  if(G.wave<0){G.objS='ADVANCE';if(teamIn(g=>g.pos.z<wv[0].trig))spawnWave(0);}
  else{const left=alive.filter(f=>f.group===200+G.wave).length;G.objS=`WAVE ${G.wave+1} / ${wv.length} · ${left} REMAIN`;G.objP=(G.wave+(1-left/Math.max(1,G.waveN)))/wv.length;
   const near=alive.filter(f=>f.group===200+G.wave).sort((a,b)=>a.pos.distanceTo(G.me.pos)-b.pos.distanceTo(G.me.pos))[0];G.objPos=near?near.pos.clone():new V(0,0,-96);
   if(!left){G.waveT+=dt;if(G.waveT>2.2){G.waveT=0;if(G.wave+1<wv.length)spawnWave(G.wave+1);else setStage('ring');}}}}
 else if(G.stage==='ring'){if(teamIn(g=>g===G.me&&g.pos.z<-108)||G.auto&&teamIn(g=>g.pos.z<-108))setStage('boss');}
 else if(G.stage==='chest'){const c=G.chest;if(!c.opened){const d=G.me.pos.distanceTo(c.pos);if(d<2.8&&G.me.alive&&!G.me.downed){G.prm='HOLD <kbd>E</kbd> TO OPEN';if(G.me.inp.interact)c.hold+=dt;else c.hold=Math.max(0,c.hold-dt);}
   G.chestT=(G.chestT||0)+dt;if(c.hold>.6||G.chestT>25)openChest();}
  else{c.open=Math.min(1,c.open+dt*2);c.lid.rotation.x=-c.open*1.9;G.endT+=dt;if(G.endT>3.2)endStrike(true);}}}
function spawnWave(i){G.wave=i;G.waveN=G.D.waves[i].spawns.length;for(const[x,z,k]of G.D.waves[i].spawns)spawnFoe(k,new V(x+rnd(1.6)-.8,0,z+rnd(1.6)-.8),{aware:true,group:200+i});hud.banner('WAVE '+(i+1),'HALL OF ECHOES','#ff8a50',1.4);log('wave '+i);
 if(i===2)dropAmmo(new V(0,0,G.me.pos.z));}
function openChest(){const c=G.chest;c.opened=true;G.endT=0;G.prm='';snd.play('exotic');parts.burst(tv.copy(c.pos).setY(c.pos.y+1),120,9,[C(3,2.4,1),C(2,2,3)],.2,1,{up:true,grav:4});
 const s=G.save,first=!s.clears;const n=2+(G.opt.diff>=1?1:0)+(G.opt.diff>=2?1:0);const items=[rollDrop(s,{r:2,diff:G.dif.drop*2,bonus:1})];
 for(let i=1;i<n;i++)items.push(rollDrop(s,{diff:G.dif.drop*2,luck:.15,min:1}));if(first||Math.random()<.12+G.dif.drop*.08)items.push(rollDrop(s,{r:3,diff:G.dif.drop*2,bonus:1}));
 items.forEach((it,i)=>{addToVault(s,it);G.loot.push(it);setTimeout(()=>hud.toast(it,'STRIKE REWARD'),i*350);});storeSave(s);log('chest '+items.length);}
function wipeCheck(dt){if(G.phase!=='play'||G.stage==='chest')return;const up=G.team.some(g=>g.alive&&!g.downed);if(up){G.wipeT=0;return;}G.wipeT+=dt;
 if(G.wipeT>3.5){G.wipeT=0;hud.banner('FIRETEAM WIPED','RETURNING TO CHECKPOINT · −30s','#ff5a3a',2.2);G.clock=Math.max(0,G.clock-30);G.eproj.length=0;for(const g of G.team){g.downed=false;g.alive=true;respawnG(g);}log('wipe');}}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 G.auto=!!o.auto;G.app='play';setupStrike();$('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.reset();$('lock').hidden=G.auto;if(!G.auto)lock();snd.music(G.opt.mus>0,0);}
function clearWorld(){for(const g of G.team)scene.remove(g.model.root);for(const e of G.foes){scene.remove(e.model.root);if(e.model.beam)scene.remove(e.model.beam);if(e.beamMesh)scene.remove(e.beamMesh);}
 for(const p of G.proj)if(p.mesh)killProj(p);for(const d of G.drops)scene.remove(d.mesh);if(G.chest)scene.remove(G.chest.g);G.team=[];G.foes=[];G.proj=[];G.eproj=[];G.drops=[];G.nums=[];G.chest=null;G.boss=null;
 parts.clear();smoke.clear();beams.clear();decals.clear();shocks.clear();lights.clear();boltMesh.count=0;}
function setupStrike(){clearWorld();G.dif=DIFF[G.opt.diff];loadDest(G.opt.dest);for(const k in doorAnim)delete doorAnim[k];
 const s=G.save;const eq=equipped(s);G.power=powerOf(eq);G.lvl=G.power+G.dif.lvl;G.inMul=cl(1-(G.power-G.lvl)*.015,.7,1.6);G.hpMul=1;G.powerStart=G.power;G.maxStart=maxPower();
 menuL.intensity=0;G.time=0;G.clock=G.opt.time*60;G.phase='countdown';G.cdT=3;G.loot=[];G.kills=0;G.ptsKill=0;G.bossDown=false;G.results=null;G.endT=0;G.wipeT=0;G.timeScale=1;G.slowT=0;G.ck=0;G.chestT=0;G.events=[];G.prm='';snd.boss=false;
 // fireteam: you + the other two subclasses
 const others=Object.keys(CLS).filter(k=>k!==s.cls);const names=ALLY_NAMES.slice().sort(()=>Math.random()-.5);
 const me=makeGuardian('YOU',s.cls,true,eq);G.me=me;G.team.push(me);if(G.auto)me.ai=newBrain({auto:true});
 for(let i=0;i<2;i++){const items=SLOTS.map((sl,k)=>makeItem({s:sl,r:1+(Math.random()<.5?1:0),p:G.power,el:k===1?CLS[others[i]].el:undefined}));G.team.push(makeGuardian(names[i],others[i],false,items));}
 G.team.forEach((g,i)=>placeG(g,G.D.start[i],0));
 // patrol groups
 G.D.patrol.forEach(([x,y,z,kinds],gi)=>kinds.forEach((k,j)=>{const a=j/kinds.length*6.28;spawnFoe(k,new V(x+Math.cos(a)*2.2,y,z+Math.sin(a)*2.2),{group:gi,instant:true,yaw:Math.random()*6.28});}));G.patrolN=G.foes.length;
 setStage('patrol');G.snapCam=true;VM.set(me.weapons[0].it,me.glow);hud.banner(G.dest.strike,G.dest.name+' · '+G.dif.n,'#ffd78a',3);log('start '+G.dest.id+' '+G.dif.n+' power '+G.power);}
function maxPower(){const s=G.save;return Math.floor(SLOTS.reduce((a,k)=>a+Math.max(...s.inv.filter(i=>i.s===k).map(i=>i.p)),0)/3);}
function endStrike(won){if(G.results)return;G.phase='end';G.app='over';unlock();snd.music(false);snd.boss=false;
 // the postmaster: engrams left on the ground are decoded too
 for(const d of G.drops)if(d.kind==='engram')pickEngram(d);
 const s=G.save,me=G.me;s.runs=(s.runs||0)+1;if(won)s.clears=(s.clears||0)+1;
 const pts=Math.max(0,Math.round((G.ptsKill+(won?1000:0)+(G.bossDown?1500:0)+(won?Math.max(0,Math.floor(G.clock)):0)+me.stats.revives*50-me.stats.deaths*50)*G.dif.pts));
 s.best=Math.max(s.best||0,pts);storeSave(s);const tok=5+Math.min(60,pts/80|0);addRound(tok,won);saveBest('starwarden',pts);
 const mx=maxPower();G.results={won,pts,tok,kills:me.stats.kills,deaths:me.stats.deaths,loot:G.loot.slice(),power:G.powerStart,max:mx,maxStart:G.maxStart,time:Math.round(G.opt.time*60-G.clock),diff:G.dif.n,dest:G.dest.name};lastAward=G.results;
 showOver();log('end '+(won?'win':'fail')+' pts '+pts);}
let lastAward=null;
function showOver(){const r=G.results,me=G.me;$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');$('over').hidden=false;
 $('oeye').textContent=`${G.dest.strike} · ${G.dest.name} · ${G.dif.n}`;$('ores').textContent=r.won?'STRIKE COMPLETE':'STRIKE FAILED';$('ores').className='res'+(r.won?' win':'');
 $('ofs').textContent=r.won?`CLEARED IN ${fmt(r.time)} · ${fmt(Math.max(0,G.clock))} TO SPARE`:G.clock<=0?'THE CLOCK RAN OUT':'STRIKE ABANDONED';
 $('opow').innerHTML=`<span>MAX POWER</span><b>✦ ${r.max}</b>${r.max>r.maxStart?`<em>▲ +${r.max-r.maxStart}</em>`:''}<span>EQUIPPED ✦ ${r.power}</span>`;
 $('stats').innerHTML='<tr><th>GUARDIAN</th><th>CLASS</th><th>KILLS</th><th>PRECISION</th><th>ABILITY KILLS</th><th>DAMAGE</th><th>ORBS</th><th>REVIVES</th><th>DOWNS</th></tr>'+G.team.map(g=>`<tr class="${g===me?'me':''}"><td>${g.name}</td><td style="color:${EL[g.el].c}">${CLS[g.cls].n}</td><td>${g.stats.kills}</td><td>${g.stats.prec}</td><td>${g.stats.abil}</td><td>${Math.round(g.stats.dmg).toLocaleString()}</td><td>${g.stats.orbs}</td><td>${g.stats.revives}</td><td>${g.stats.deaths}</td></tr>`).join('');
 const L=[...r.loot].sort((a,b)=>b.r-a.r||b.p-a.p);$('oloot').innerHTML=L.length?L.slice(0,10).map(it=>itemCard(it)).join('')+(L.length>10?`<p class="tok" style="margin:0;align-self:center">+${L.length-10} MORE IN YOUR VAULT</p>`:''):'<p class="tok" style="margin:0">No engrams this time.</p>';
 $('otok').textContent=`+${r.tok} TOKENS · ${r.pts} PTS · BEST ${bestScore('starwarden')} PTS`;}
function toOrbit(){unlock();G.app='menu';G.auto=false;clearWorld();loadDest(G.opt.dest);setupMenuScene();$('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.music(false);orbit.render();showBest();}
function setupMenuScene(){const s=G.save;const others=Object.keys(CLS).filter(k=>k!==s.cls);const eq=equipped(s);G.power=powerOf(eq);
 const poses=[[new V(0,2.4,31.5),Math.PI],[new V(-2.2,2.4,30.4),Math.PI-.3],[new V(2.2,2.4,30.4),Math.PI+.3]];
 [s.cls,...others].forEach((c,i)=>{const items=i===0?eq:SLOTS.map(sl=>makeItem({s:sl,r:1,p:G.power}));const g=makeGuardian(i?ALLY_NAMES[i]:'YOU',c,i===0,items);g.ai=null;placeG(g,poses[i][0],poses[i][1]);g.model.root.visible=true;g.onGround=true;G.team.push(g);});G.me=null;}

/* ================= game loop ================= */
function stepMatch(dt){if(G.phase==='countdown'){G.cdT-=dt;if(G.cdT<=0){G.phase='play';}}
 else if(G.phase==='play'){G.clock-=dt;if(G.clock<=0){G.clock=0;endStrike(false);return;}stepFlow(dt);wipeCheck(dt);}}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}
 if(G.app!=='play'){G.time+=dt;if(G.app==='menu')for(const g of G.team)g.model.pose(g,dt,G.time);visuals(dt);return;}
 if(G.slowT>0){G.slowT-=dt;if(G.slowT<=0)G.timeScale=1;}const sdt=dt*G.timeScale;G.time+=sdt;readInput(dt);stepMatch(sdt);if(G.app!=='play'){visuals(dt);return;}
 for(const f of G.team){if(f.ai)thinkGuardian(f,G,sdt);}
 for(const f of G.team){f.reviving=null;stepG(f,sdt);}stepFoes(sdt);updateProj(sdt);updateEproj(sdt);updateDrops(sdt);stepDoors(sdt);
 for(let i=G.nums.length-1;i>=0;i--){G.nums[i].t+=dt;if(G.nums[i].t>1)G.nums.splice(i,1);}visuals(sdt);}
G.goalFor=f=>{const me=G.me;// revive anyone down nearby first
 for(const o of G.team){if(o===f||!o.downed)continue;if(o.pos.distanceTo(f.pos)<60&&!G.team.some(x=>x!==f&&x.ai&&x.ai.rev===o&&x.alive&&!x.downed&&x.pos.distanceTo(o.pos)<f.pos.distanceTo(o.pos))){f.ai.rev=o;return{p:o.pos,r:1.2,revive:true};}}
 f.ai.rev=null;const lead=f.ai.auto||!me.alive||me.downed||G.auto;
 if(G.stage==='chest'&&G.chest&&!G.chest.opened&&f===me)return{p:G.chest.pos,r:1.6,revive:true};
 if(G.stage==='boss'&&G.boss&&G.boss.alive){const b=G.boss;if(b.immune){const py=G.foes.filter(e=>e.alive&&e.pylon).sort((a,c)=>a.pos.distanceTo(f.pos)-c.pos.distanceTo(f.pos))[0];if(py)return{p:py.pos,r:9};}
  const a=Math.atan2(f.pos.z-b.pos.z,f.pos.x-b.pos.x)+.35;return{p:new V(b.pos.x+Math.cos(a)*16,0,b.pos.z+Math.sin(a)*16),r:3};}
 if(!lead){const d=f.pos.distanceTo(me.pos);if(G.stage==='beacon'&&G.beaconK<1)return{p:G.D.beacon,r:6};if(d>9)return{p:me.pos,r:5};return null;}
 if(G.stage==='beacon'){const t=G.foes.find(e=>e.alive&&e.aware&&e.pos.distanceTo(G.D.beacon)<18);return{p:G.D.beacon,r:G.beaconK<1?4:t?10:4};}
 if(G.stage==='ring')return{p:new V(0,0,-114),r:2};
 if(G.objPos)return{p:G.objPos,r:G.stage==='patrol'||G.stage==='hall'?11:3};return null;};

/* ================= visuals ================= */
let orbitA=0;const camPos=new V();let aimInfo=null;
function visuals(dt){parts.update(dt);smoke.update(dt);beams.update(dt);shocks.update(dt);decals.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);
 for(const f of G.team){if(f===G.me&&f.alive&&!f.downed&&G.app!=='over')continue;f.model.vis=true;if(f.alive||f.model.dead)f.model.pose(f,dt,G.time);}
 G.shake=Math.max(0,G.shake-dt*2.4);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);
 const me=G.me,aspect=innerWidth/innerHeight;
 if((G.app==='play'||G.app==='paused')&&me){
  if(me.alive&&!me.downed){me.model.root.visible=false;me.landDip=Math.max(0,me.landDip-dt*1.4);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=me.onGround&&me.slideT<=0?Math.sin(G.time*sp*1.1)*Math.min(1,sp/9)*.03:0;
   const eyeT=(me.slideT>0||me.h<1.5?PHY.eyeSlide:PHY.eye);me.eyeH=G.snapCam?eyeT:damp(me.eyeH||eyeT,eyeT,14,dt);G.snapCam=false;
   cam.position.set(me.pos.x,me.pos.y+me.eyeH-me.landDip+bob,me.pos.z);const s=G.shake*G.shake*.05;const strafe=(me.vel.x*Math.cos(me.yaw)-me.vel.z*Math.sin(me.yaw));me.roll=damp(me.roll||0,cl(-strafe*.004,-.03,.03)+(me.slideT>0?.05:0),8,dt);
   cam.rotation.set(me.pitch+me.recoil+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,me.roll);const w=me.weapons[me.wi],A=w.st;
   const hf=G.opt.fov+(me.sprinting?6:0)+(me.slideT>0?8:0)+(me.superT>0?6:0);const vf=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;const zf=1+(A.zoom-1)*me.zoom;cam.fov=damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,18,dt);
   VM.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,ground:me.onGround,sprint:me.sprinting,slide:me.slideT>0,air:!me.onGround,reload:me.reloadT>0?1-me.reloadT/(A.reload*me.reloadMul):-1,swap:me.swapT>0?(me.swapT>.2?(.4-me.swapT)/.2:me.swapT/.2):0,
    melee:me.meleeT>0?1-me.meleeT/.35:0,zoom:me.zoom,charge:A.charge?me.chargeT/A.charge:0,scope:A.scope,cast:me.castT>0?1:0,castCol:ELCOL[me.el],super:me.superT>0});
   VM.root.visible=VM.root.visible&&G.phase!=='end';if(VM.gun)VM.gun.visible=!(me.superT>0);mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else{// downed / dead: third-person over the body
   me.model.root.visible=true;tv.copy(me.pos).add(tv2.set(Math.sin(me.yaw)*4.5,3.6,Math.cos(me.yaw)*4.5));camPos.lerp(tv,1-Math.exp(-dt*3));if(camPos.distanceTo(tv)>12)camPos.copy(tv);cam.position.copy(camPos);
   const m=new THREE.Matrix4().lookAt(cam.position,tv2.copy(me.pos).setY(me.pos.y+.6),UP);cam.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(m),1-Math.exp(-dt*4));VM.root.visible=false;cam.fov=damp(cam.fov,70,4,dt);}
  snd.listener(cam.position.x,cam.position.y,cam.position.z,me.yaw);
  const fw=dirOf(me.yaw,me.pitch,new V());const wt=G.W.ray(cam.position,fw,150);const h=me.alive&&!me.downed?rayFoes(cam.position,fw,wt)[0]:null;G.aimFoe=!!h;
  G.S.follow(me.pos.x+fw.x*20,me.pos.z+fw.z*20);}
 else if(G.app==='menu'||G.app==='over'){VM.root.visible=false;orbitA+=dt*.25;if(G.app==='over'&&G.me){const c=G.me.pos;cam.position.set(c.x+Math.sin(orbitA*.3)*8,c.y+4.2,c.z+Math.cos(orbitA*.3)*8);cam.lookAt(c.x,c.y+1.6,c.z);G.me.model.root.visible=true;}else cam.position.set(-2.2+Math.sin(orbitA)*.7,3.75+Math.sin(orbitA*.7)*.15,37.8);if(!(G.app==='over'&&G.me))cam.lookAt(-4.4,3.3,30.5);menuL.intensity=G.app==='menu'?(gfx?18:14):0;menuL.position.set(-1,5.2,35.5);
  cam.fov=G.app==='over'?52:56;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);if(G.S){const c=G.app==='over'&&G.me?G.me.pos:{x:0,z:26};G.S.follow(c.x,c.z);}}
 cam.aspect=aspect;cam.updateProjectionMatrix();
 if(G.app==='play'&&me){let pr=G.prm||'';if(!pr){const dn=G.team.find(o=>o!==me&&o.downed&&o.pos.distanceTo(me.pos)<2.6);if(dn)pr=`HOLD <kbd>E</kbd> TO REVIVE ${dn.name}`;else if(me.superK>=1&&me.superT<=0)pr='';}hud.prompt(pr);G.prm='';cam.updateMatrixWorld();hud.update(dt,cam);}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play'&&!G.auto,overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','ControlLeft','KeyQ'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);}});
const {keys,edge,mouse,lock,unlock}=I,mouseVis={dx:0,dy:0};
const padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'&&!me.ai){const i=me.inp;const zA=me.weapons[me.wi].st.zoom||1;const sens=G.opt.sens*.0022/(1+me.zoom*(zA-1));
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.sprint=!!(keys.ShiftLeft||keys.ShiftRight);i.slide=!!(ed('KeyC')||ed('ControlLeft'));i.fire=mouse.l;i.zoom=mouse.r;
  i.reload=!!ed('KeyR');i.melee=!!(ed('KeyF')||ed('KeyV'));i.nade=!!ed('KeyQ');i.sup=!!ed('KeyX');i.interact=!!keys.KeyE;i.sel=ed('Digit1')?0:ed('Digit2')?1:ed('Digit3')?2:mouse.wheel?(me.wi+(mouse.wheel>0?1:2))%3:-1;mouse.wheel=0;
  if(I.locked&&me.alive&&!me.downed){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.5,1.5);}mouseVis.dx+=mouse.dx;mouseVis.dy+=mouse.dy;mouse.dx=mouse.dy=0;
  const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,pr=padPrev;const P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0),zf=1+me.zoom*2;me.yaw-=lx*Math.abs(lx)*3.4*G.opt.sens*dt/zf;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.6*G.opt.sens*dt/zf,-1.5,1.5);
   if(P(0))i.jump=true;if(P(0)&&!pr[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;if((b[6]?.value||0)>.3)i.zoom=true;if(P(1)&&!pr[1])i.slide=true;if(P(10))i.sprint=true;
   if(P(2)&&!pr[2])i.reload=true;if(P(2))i.interact=true;if(P(3)&&!pr[3])i.sel=(me.wi+1)%3;if(P(4)&&!pr[4])i.nade=true;if(P(5)&&!pr[5])i.melee=true;if(P(11)&&!pr[11])i.sup=true;if(P(9)&&!pr[9])pause(true);for(let k=0;k<17;k++)pr[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}}
 I.flush();}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');unlock();}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');$('lock').hidden=I.locked||G.auto;lock();}}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible||G.app!=='play'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';for(const k in cache){cache[k].S.sun.castShadow=q>0;}R.shadowMap.enabled=q>0;R.shadowMap.needsUpdate=true;
 scene.traverse(o=>{if(o.material&&o.material.needsUpdate!==undefined&&o.isMesh)o.material.needsUpdate=true;});}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 vmCam.aspect=w/h;vmCam.updateProjectionMatrix();const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.5,saturation:T.sat,tint:T.tint,vignette:.4,grain:.025,aoStrength:.7,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade&&G.me&&G.app==='play'){const m=G.me;const hp=m.alive&&!m.downed?Math.min(1,(m.health+m.shield)/120):.2;fxStack.grade.uniforms.sat.value=T.sat*(.45+.55*hp);}else if(fxStack.grade)fxStack.grade.uniforms.sat.value=T.sat;
 cam.updateMatrixWorld();
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);if(VM.root.visible&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(vmScene,vmCam);R.autoClear=true;}}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-diff','diff',true,()=>orbit.render());seg('o-time','time');seg('o-sens','sens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app==='play',0);});
const orbit=new Orbit(G.save,{opt:()=>G.opt,setDest:i=>{G.opt.dest=i;saveOpt();if(G.app==='menu')toOrbit();},sound:k=>{snd.init();snd.play(k);},onRender:()=>{if(G.app==='menu'&&G.team[0]&&G.team[0].cls!==G.save.cls){clearWorld();setupMenuScene();}}});
function showBest(){const b=bestScore('starwarden');$('best').textContent=(b?`YOUR BEST · ${b} PTS · `:'')+`${G.save.clears||0} CLEARS · ${G.save.runs||0} RUNS`;}
$('go').onclick=()=>start();$('again').onclick=()=>start();$('orbit').onclick=toOrbit;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{G.app='play';endStrike(false);};
postButton($('post'),'starwarden',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Starwarden\nPoints: ${a.pts||0}\nResult: ${a.won?'strike complete':'strike failed'}\nStrike: ${a.dest||''} · ${a.diff||''}\nKills: ${a.kills||0} · Downs: ${a.deaths||0} · Max power: ${a.max||0}`];});

/* ================= boot ================= */
loadDest(G.opt.dest);setupMenuScene();orbit.render();showBest();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.STARWARDEN={G,step,render,start,toOrbit,pause,endStrike,visuals:dt=>visuals(dt),
 get state(){return G.app==='play'?G.phase+':'+G.stage:G.app;},get app(){return G.app;},get stage(){return G.stage;},get phase(){return G.phase;},
 get score(){return G.results?G.results.pts:G.ptsKill;},get player(){return G.me;},get allies(){return G.team.filter(f=>f!==G.me);},get bots(){return[...G.team.filter(f=>f!==G.me),...G.foes];},get foes(){return G.foes;},get boss(){return G.boss;},
 get clock(){return G.clock;},setClock(s){G.clock=s;},get results(){return G.results;},get save(){return G.save;},get loot(){return G.loot;},get events(){return G.events;},scene,cam,R,VM,snd,setQuality:applyQuality,get gfx(){return gfx;},
 autoplay(on=true){G.auto=on;if(G.me){G.me.ai=on?newBrain({auto:true}):null;}},skipCountdown(){G.cdT=0;},
 skipTo(stage){for(const e of G.foes){if(e.alive){e.alive=false;e.deadT=9;}}if(stage==='beacon'){G.team.forEach((g,i)=>placeG(g,G.D.check[1][i],0));setStage('beacon');}
  if(stage==='hall'){G.team.forEach((g,i)=>placeG(g,G.D.check[1][i],0));openDoor('gate');setStage('hall');}if(stage==='boss'){openDoor('gate');G.team.forEach((g,i)=>placeG(g,G.D.check[3][i],0));setStage('boss');}},
 teleport(x,y,z,f){f=f||G.me;f.pos.set(x,y,z);f.vel.set(0,0,0);G.snapCam=true;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;},
 aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+(t.aimY||1.2));const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));},
 input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},spawnFoe:(k,x,y,z,o)=>spawnFoe(k,new V(x,y,z),o||{aware:true}),dropEngram:(r)=>dropEngram(G.me.pos.clone().add(new V(0,0,-1)),{min:r}),
 nav:()=>({nodes:G.W.nodes.length,roam:G.W.roam.length})};
