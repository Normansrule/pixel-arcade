// GLOSS RIOT — third-person ink team shooter, 4v4 vs CPU crews. Original game for Pixel Arcade.
// Paint floors and walls (a per-map ink atlas the splats write into), swim through your own colour to refill and hide,
// get slowed and stung by enemy ink, climb painted walls, three weapons (blaster, charger, roller), ink bombs and the
// INKQUAKE special. Turf Control (most floor painted after 3:00 wins) and Zone Clash; two arenas; animated results tally.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {V,cl,rnd,wrapA,damp,fmt} from './util.js';
import {MAPS,buildMap} from './maps.js';
import {PHY} from './world.js';
import {Paint,TD} from './paint.js';
import {buildScene} from './scene.js';
import {Glooper,weaponModel,inkMat} from './actor.js';
import {WPN,BOMB,SPECIAL} from './weapons.js';
import {Particles,Drops,Beams,Shocks,Shots,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {BOTDIFF,NAMES,newBrain,think} from './ai.js';
import {HUD} from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id);const GID='glossriot';
export const PALS=[{n:['TANGERINE','COBALT'],c:['#ff7a14','#2f5cff']},{n:['BUBBLEGUM','LIME'],c:['#ff2f92','#7ee01c']},{n:['LEMON','GRAPE'],c:['#ffcf14','#8a3cff']},{n:['TEAL','CORAL'],c:['#10cbbb','#ff5236']}];
const MODES={turf:{n:'TURF CONTROL'},zone:{n:'ZONE CLASH'}};
const MATCH_T=180,RESPAWN=4.5;
const tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0),HO={n:new V()};
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(70,1,.08,2000);cam.rotation.order='YXZ';scene.add(cam);
const snd=new Sound();
const parts=new Particles(scene,1500),drops=new Drops(scene,3500),beams=new Beams(scene,48),shocks=new Shocks(scene,8),shots=new Shots(scene,280),lights=new LightPool(scene,3);

/* ================= state ================= */
const G={app:'menu',phase:'countdown',opt:{mode:'turf',map:0,wpn:'splatter',diff:1,pal:0,sens:1,vol:.8,mus:.6},fighters:[],me:null,time:0,clock:MATCH_T,cdT:3,endT:0,M:MODES.turf,mode:'turf',
 D:null,W:null,P:null,S:null,proj:[],bombs:[],hurtFx:0,shake:0,attract:true,timeScale:1,aimP:new V(),aimTarget:null,aimFoe:false,zone:{owner:-1,count:[100,100]},results:null,pal:PALS[0],cols:[new THREE.Color(),new THREE.Color()]};
const saveOpt=stored('pxd_glossriot_opt',G.opt);
const hud=new HUD(G);

/* ================= maps ================= */
const mapCache={};
function loadMap(i){const def=MAPS[i];if(G.S)scene.remove(G.S.root);let m=mapCache[i];if(!m){const D=buildMap(def);const P=new Paint(D,G.pal.c);const S=buildScene(D,P,R,gfx);m=mapCache[i]={D,P,S};}
 G.D=m.D;G.W=m.D.W;G.P=m.P;G.S=m.S;scene.add(m.S.root);scene.environment=m.S.env;scene.fog=m.S.fog;scene.background=null;applyShadow();R.shadowMap.needsUpdate=true;fxStack=null;}

/* ================= fighters ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,fire:false,swim:false,sub:false,special:false});
function makeFighter(name,team,human,diff,wpn,seed){const col=G.cols[team];const m=new Glooper(team,col.clone(),seed,gfx>0);
 const f={name,team,human,wpn,pos:new V(),vel:new V(),yaw:0,pitch:0,r:PHY.r,h:PHY.h,onGround:false,coyote:0,inp:blankInput(),alive:false,respawnT:0,hp:100,ink:100,special:0,slot:0,
  swim:false,sub:false,climb:false,under:0,fireCD:0,chargeT:0,prevFire:false,prevSub:false,rollWait:0,rolling:false,rollAcc:0,flickT:0,subCD:0,hurtT:9,invuln:0,lastFire:-9,lastHitBy:null,lastHitT:-9,dmgBy:new Map(),slam:null,emptyT:0,stepT:0,crushT:0,
  stats:{turf:0,splats:0,assists:0,deaths:0,specials:0,shots:0},model:m,ai:human?null:newBrain(BOTDIFF[diff])};
 f.gun=weaponModel(wpn,col.clone());m.hold(f.gun);m.root.visible=false;scene.add(m.root);G.fighters.push(f);return f;}
function clearFighters(){for(const f of G.fighters)scene.remove(f.model.root);G.fighters=[];G.me=null;for(const b of G.bombs)scene.remove(b.mesh);G.bombs=[];G.proj=[];}
function spawn(f){const sp=G.D.spawns[f.team],p=sp[f.slot%sp.length];f.pos.set(p.x+rnd(.4)-.2,p.y+2.5,p.z+rnd(.4)-.2);f.vel.set(0,0,0);f.yaw=f.team?0:Math.PI;f.pitch=-.05;f.alive=true;f.hp=100;f.ink=100;f.invuln=1.6;
 f.swim=false;f.sub=false;f.h=PHY.h;f.slam=null;f.rolling=false;f.chargeT=0;f.dmgBy.clear();f.model.root.visible=true;f.model.die=0;if(f.ai){f.ai.path=null;f.ai.target=null;f.ai.goalT=0;f.ai.refill=false;}
 drops.burst(tv.copy(f.pos).setY(p.y+.3),26,6,G.cols[f.team],.22,.7,{up:true});if(f===G.me){snd.play('spawn');G.snapCam=true;}else snd.play('spawn',f.pos,.5);}
const eyeOf=(f,o=new V())=>o.set(f.pos.x,f.pos.y+(f.swim?.5:PHY.eye),f.pos.z);
function muzzleOf(f,o=new V()){const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);return o.set(f.pos.x-sy*.55+cy*.24,f.pos.y+1.08,f.pos.z-cy*.55-sy*.24);}
function aimDir(f,from,o=new V()){if(f===G.me&&!G.attract){o.subVectors(G.aimP,from);const L=o.length();if(L>1.2){o.divideScalar(L);if(o.dot(dirOf(f.yaw,f.pitch,tv3))>.5)return o;}}return dirOf(f.yaw,f.pitch,o);}
function jitter(d,s){if(s<=0)return d;const u=tv3.set(0,1,0).cross(d);if(u.lengthSq()<1e-6)u.set(1,0,0);u.normalize();const w=tv2.crossVectors(d,u);const r=Math.sqrt(Math.random())*s,a=Math.random()*6.283;return d.addScaledVector(u,Math.cos(a)*r).addScaledVector(w,Math.sin(a)*r).normalize();}

function stepFighter(f,dt){const inp=f.inp;
 if(!f.alive){if(G.phase==='play'||G.attract){f.respawnT-=dt;if(f.respawnT<=0)spawn(f);}return;}
 const frozen=!G.attract&&G.phase!=='play';f.invuln-=dt;f.hurtT+=dt;f.fireCD-=dt;f.subCD-=dt;f.emptyT-=dt;
 const W=G.W,P=G.P,wd=WPN[f.wpn],me=f===G.me;
 const under=f.onGround||f.climb?P.ownerAt(f.pos,.4):0,own=under===f.team+1,enemy=under>0&&!own;f.under=under;
 // ---- form: humanoid <-> ink blob ----
 let wantSwim=inp.swim&&!f.slam&&!frozen;if(inp.fire&&!frozen&&!f.climb)wantSwim=false;
 if(wantSwim!==f.swim){if(!wantSwim){if(W.free(f.pos.x,f.pos.y+.02,f.pos.z,f.r,PHY.h)){f.swim=false;f.h=PHY.h;f.fireCD=Math.max(f.fireCD,.1);if(own)splash(f,10);snd.play('surface',me?null:f.pos,me?1:.6);}}
  else{f.swim=true;f.h=PHY.hSwim;f.chargeT=0;f.rolling=false;if(own)splash(f,14);snd.play('swim',me?null:f.pos,me?1:.6);}}
 // ---- movement ----
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen||f.slam){wx=wz=0;}
 let spd;if(f.swim)spd=own||f.climb?PHY.swim:enemy?1.3:3;else{spd=enemy?PHY.enemy:PHY.walk;if(f.wpn==='splatter'&&f.lastFire>G.time-.2)spd*=wd.move;if(f.wpn==='charger'&&f.chargeT>0)spd*=wd.move;if(f.rolling)spd=Math.min(spd,wd.roll);}
 if(f.onGround){const k=Math.min(1,(f.swim&&own?PHY.swimAccel:PHY.accel)*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
 else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
 if(f.onGround)f.coyote=.1;else f.coyote-=dt;
 if(inp.jumpEdge&&f.coyote>0&&!frozen&&!f.slam){f.vel.y=f.swim&&own?PHY.swimJump:PHY.jump;f.coyote=0;f.onGround=false;snd.play('jump',me?null:f.pos,me?1:.5);if(f.swim&&own)splash(f,10);}
 // climb own-inked walls in swim form
 const wasClimb=f.climb;f.climb=false;
 if(f.swim&&wl>.2&&!frozen){const o=tv.set(f.pos.x,f.pos.y+.25,f.pos.z),d=tv2.set(wx,0,wz).normalize();const t=W.ray(o,d,f.r+.4,HO);
  if(t<f.r+.4&&HO.b&&Math.abs(HO.n.y)<.3){const hp=tv3.copy(o).addScaledVector(d,t+.02);if(P.wallOwner(HO,hp)===f.team+1){f.climb=true;f.vel.y=Math.max(f.vel.y,7);}}
  else if(wasClimb&&f.vel.y>0){f.vel.y=Math.max(f.vel.y,5);f.vel.x+=d.x*3;f.vel.z+=d.z*3;}}
 f.sub=f.swim&&(own&&f.onGround||f.climb);
 if(f.slam){f.slam.t+=dt;if(f.slam.ph==='rise'&&(f.vel.y<2||f.slam.t>.6)){f.slam.ph='fall';f.vel.y=-34;}if(f.slam.t>3)quakeHit(f);}
 if(!f.climb){f.vel.y-=PHY.g*dt;if(f.vel.y<-40)f.vel.y=-40;}
 const wasG=f.onGround,vy0=f.vel.y;W.move(f,dt);
 if(f.onGround&&!wasG){if(f.slam&&f.slam.ph==='fall'){quakeHit(f);}else if(-vy0>7){f.model.sq=1;snd.play('land',me?null:f.pos,me?1:.5);}}
 if(f.onGround&&!f.swim){const hs=Math.hypot(f.vel.x,f.vel.z);if(hs>2){f.stepT-=dt*hs*.4;if(f.stepT<=0){f.stepT=1;snd.play('step',me?null:f.pos,me?.6:.4);}}}
 // water / out of bounds
 const wy=G.D.water!=null?G.D.water-.4:G.W.killY;if(f.pos.y<wy){drops.burst(tv.copy(f.pos).setY(G.D.water??f.pos.y),40,7,G.cols[f.team],.3,.8,{up:true});die(f,f.lastHitT>G.time-6?f.lastHitBy:null,{how:'SPLASHDOWN',fall:true});return;}
 if(enemy&&!frozen&&f.invuln<=0){if(f.hp>30)f.hp=Math.max(30,f.hp-22*dt);f.hurtT=Math.min(f.hurtT,.5);}
 if(f.hurtT>1.2&&f.hp<100)f.hp=Math.min(100,f.hp+(f.sub?55:14)*dt);
 if(f.sub){if(f.ink<100&&me&&f.ink<99&&f.ink+42*dt>=99.5)snd.play('refill');f.ink=Math.min(100,f.ink+42*dt);}else if(G.time-f.lastFire>.6&&!f.rolling&&f.chargeT<=0)f.ink=Math.min(100,f.ink+9*dt);
 if(frozen||f.slam)return;
 // ---- weapons ----
 if(inp.special&&f.special>=100){startSlam(f);return;}
 const subEdge=inp.sub&&!f.prevSub;f.prevSub=inp.sub;
 if(subEdge&&f.subCD<=0&&!f.swim){if(f.ink>=BOMB.cost){f.ink-=BOMB.cost;throwBomb(f);f.subCD=.6;f.lastFire=G.time;}else noInk(f);}
 if(f.swim){f.prevFire=false;f.chargeT=0;f.rolling=false;return;}
 const fire=inp.fire,edge=fire&&!f.prevFire,rel=!fire&&f.prevFire;f.prevFire=fire;
 if(f.wpn==='splatter'){if(fire&&f.fireCD<=0){if(f.ink>=wd.cost){f.ink-=wd.cost;shootBlob(f);f.fireCD=wd.rate;}else noInk(f);}}
 else if(f.wpn==='charger'){if(fire&&f.fireCD<=0){if(f.ink>=wd.cost[0]+1){if(f.chargeT===0)snd.play('charge',me?null:f.pos,me?1:.6);f.chargeT=Math.min(wd.charge,f.chargeT+dt);}else if(edge)noInk(f);}
  else if(rel&&f.chargeT>0){const k=f.chargeT/wd.charge;const cost=wd.cost[0]+(wd.cost[1]-wd.cost[0])*k;f.ink=Math.max(0,f.ink-cost);fireCharger(f,Math.max(.1,k));f.chargeT=0;f.fireCD=.22;}
  else if(!fire)f.chargeT=0;}
 else{if(edge&&f.fireCD<=0){if(f.ink>=wd.flickCost){f.ink-=wd.flickCost;flick(f);f.fireCD=.4;f.rollWait=.36;f.flickT=.001;}else noInk(f);}
  f.rollWait-=dt;if(f.flickT>0){f.flickT+=dt*2.8;if(f.flickT>=1)f.flickT=0;}
  const was=f.rolling;f.rolling=fire&&f.rollWait<=0&&f.onGround&&f.ink>wd.rollCost;if(!f.rolling&&was&&fire&&f.ink<=wd.rollCost)noInk(f);if(f.rolling)rollStep(f,dt);}}
function noInk(f){if(f===G.me&&f.emptyT<=0){snd.play('empty');f.emptyT=.6;hudMsg('INK TANK EMPTY · HOLD <kbd>SHIFT</kbd> IN YOUR INK TO REFILL',1.4);}}
function splash(f,n){drops.burst(tv.copy(f.pos).setY(f.pos.y+.1),n,4.5,G.cols[f.team],.18,.5,{up:true,floor:f.pos.y});}

/* ================= ink: projectiles, charger, roller, bombs, special ================= */
function credit(f,g){if(!g||!f)return;const m2=g/(TD*TD);f.stats.turf+=m2;if(!f.slam&&f.alive){const was=f.special;f.special=Math.min(100,f.special+m2*SPECIAL.rate);if(f===G.me&&was<100&&f.special>=100){snd.play('special');hud.banner('SPECIAL READY','PRESS E · INKQUAKE',1.6,G.pal.c[f.team]);}}}
function paintAt(f,p,r,str=1){credit(f,G.P.splat(p,r,f.team,str));}
function shootBlob(f){const wd=WPN.splatter,me=f===G.me;f.lastFire=G.time;f.stats.shots++;const mz=muzzleOf(f,new V());const dir=jitter(aimDir(f,mz,new V()),f.onGround?wd.spread:wd.airSpread);
 G.proj.push({pos:mz.clone(),vel:dir.multiplyScalar(wd.speed).addScaledVector(f.vel,.15),owner:f,team:f.team,age:0,straight:wd.straight,grav:wd.grav,dmg:wd.dmg,splat:wd.splat,drip:wd.drip,dripD:.9,dripEvery:wd.dripEvery,r:.15,life:1.4});
 f.model.kick=1;snd.play('shot',me?null:f.pos,me?.75:1);if(Math.random()<.5)drops.emit(mz.x,mz.y,mz.z,rnd(2)-1,rnd(2),rnd(2)-1,G.cols[f.team],.08,.25);}
function flick(f){const wd=WPN.roller,me=f===G.me;f.lastFire=G.time;const o=muzzleOf(f,new V());o.y=f.pos.y+.9;const d=aimDir(f,o,new V());const y0=Math.atan2(-d.x,-d.z),p0=Math.asin(cl(d.y,-1,1))+.12;
 for(let i=0;i<wd.flickN;i++){const a=(i/(wd.flickN-1)-.5)*.85;const dir=dirOf(y0+a,p0+rnd(.08),new V());G.proj.push({pos:o.clone().addScaledVector(dir,.3),vel:dir.multiplyScalar(wd.flickSpeed*(.85+rnd(.3))),owner:f,team:f.team,age:0,straight:wd.straight,grav:wd.grav,dmg:wd.flickDmg,splat:.8,drip:.45,dripD:.6,dripEvery:1.1,r:.2,life:1.2});}
 snd.play('flick',me?null:f.pos,me?1:.8);drops.burst(o,16,6,G.cols[f.team],.14,.4,{dir:d,spread:.6});}
function rollStep(f,dt){const wd=WPN.roller,hs=Math.hypot(f.vel.x,f.vel.z);f.rollAcc+=hs*dt;const fx=-Math.sin(f.yaw),fz=-Math.cos(f.yaw);const p=tv.set(f.pos.x+fx*.95,f.pos.y+.05,f.pos.z+fz*.95);
 while(f.rollAcc>.32){f.rollAcc-=.32;f.ink-=wd.rollCost;paintAt(f,p,.95,1);if(Math.random()<.5)drops.emit(p.x+(Math.random()-.5)*1.4,p.y+.1,p.z+(Math.random()-.5)*1.4,(Math.random()-.5)*2,1+rnd(1.5),(Math.random()-.5)*2,G.cols[f.team],.055,.3,p.y);}
 if(hs>1.5){f.crushT-=dt;for(const o of G.fighters){if(!o.alive||o.team===f.team)continue;if(Math.hypot(o.pos.x-p.x,o.pos.z-p.z)<1.2&&Math.abs(o.pos.y-f.pos.y)<1.3)damage(o,wd.crush,f,{how:'ROLLED',point:o.pos.clone().setY(o.pos.y+.6),dir:tv2.set(fx,0,fz).clone()});}}}
// hitscan vs fighters: head sphere + body capsule (humanoid) or a blob sphere (swim form)
function rayFighters(o,d,maxT,skip){let best=null;for(const f of G.fighters){if(f===skip||!f.alive||skip&&f.team===skip.team)continue;
  if(f.swim){const hx=f.pos.x-o.x,hy=f.pos.y+(f.sub?.12:.28)-o.y,hz=f.pos.z-o.z,tc=hx*d.x+hy*d.y+hz*d.z,r=f.sub?.38:.45;if(tc<0||tc>maxT+r)continue;const d2=hx*hx+hy*hy+hz*hz-tc*tc;if(d2<r*r){const t=tc-Math.sqrt(r*r-d2);if(t>0&&t<maxT&&(!best||t<best.t))best={f,t};}continue;}
  const hx=f.pos.x-o.x,hy=f.pos.y+1.3-o.y,hz=f.pos.z-o.z;const tc=hx*d.x+hy*d.y+hz*d.z;if(tc<-1||tc>maxT+1)continue;const d2=hx*hx+hy*hy+hz*hz-tc*tc;let hit=null;
  if(d2<.27*.27){const t=tc-Math.sqrt(.27*.27-d2);if(t>0&&t<maxT)hit=t;}
  const r=.38,wx=o.x-f.pos.x,wz=o.z-f.pos.z,A=d.x*d.x+d.z*d.z;if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,D=B*B-A*Cc;if(D>=0){const t=(-B-Math.sqrt(D))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>f.pos.y&&y<f.pos.y+1.15&&(hit===null||t<hit))hit=t;}}
  if(hit!==null&&(!best||hit<best.t))best={f,t:hit};}
 return best;}
function updateProj(dt){const W=G.W;for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.age+=dt;p.life-=dt;if(p.age>p.straight)p.vel.y-=p.grav*dt;
  const sp=p.vel.length(),step=sp*dt,dir=tv.copy(p.vel).divideScalar(sp||1);const wt=W.ray(p.pos,dir,step+.1,HO);const fh=rayFighters(p.pos,dir,Math.min(step+.1,wt),p.owner);
  if(fh){const hp=tv2.copy(p.pos).addScaledVector(dir,fh.t);damage(fh.f,p.dmg,p.owner,{how:WPN[p.owner.wpn].name,point:hp.clone(),dir:dir.clone()});drops.burst(hp,8,4,G.cols[p.team],.12,.4,{dir:tv3.copy(dir).negate(),spread:.9});G.proj.splice(i,1);continue;}
  if(wt<step+.1){const hp=tv2.copy(p.pos).addScaledVector(dir,wt);paintAt(p.owner,hp,p.splat);drops.burst(hp,6,3.5,G.cols[p.team],.12,.35,{dir:HO.n,spread:1});if(Math.random()<.35)snd.play('splat',hp,.8);G.proj.splice(i,1);continue;}
  p.pos.addScaledVector(dir,step);p.dripD-=step;if(p.dripD<=0){p.dripD=p.dripEvery*(.7+rnd(.6));const g=W.groundBelow(p.pos.x,p.pos.y,p.pos.z,.05);if(p.pos.y-g<9&&g>-50)paintAt(p.owner,tv3.set(p.pos.x,g,p.pos.z),p.drip,.85);}
  if(p.life<=0||p.pos.y<-20)G.proj.splice(i,1);}}
function fireCharger(f,k){const wd=WPN.charger,me=f===G.me;f.lastFire=G.time;f.stats.shots++;const range=wd.range[0]+(wd.range[1]-wd.range[0])*k,dmg=k>=.97?wd.dmg[1]:wd.dmg[0]+(wd.dmg[1]-wd.dmg[0])*.7*k;
 let o,d;if(me&&!G.attract){o=cam.position.clone();d=dirOf(f.yaw,f.pitch,new V());const along=tv.subVectors(f.pos,o).dot(d);if(along>0)o.addScaledVector(d,along);}else{o=eyeOf(f,new V());d=dirOf(f.yaw,f.pitch,new V());}
 const wt=G.W.ray(o,d,range,HO);const hn=HO.n.clone(),hit=rayFighters(o,d,wt,f);const end=hit?hit.t:wt;const ep=o.clone().addScaledVector(d,end);
 if(hit)damage(hit.f,dmg,f,{how:'LONGSHOT',point:ep.clone(),dir:d.clone()});
 for(let s=1.6;s<end;s+=.85){tv.copy(o).addScaledVector(d,s);const g=G.W.groundBelow(tv.x,tv.y,tv.z,.05);if(tv.y-g<3.2&&g>-50)paintAt(f,tv2.set(tv.x,g,tv.z),.5+.18*k,.9);}
 if(!hit&&wt<range){paintAt(f,ep,wd.splat*(.55+.45*k));drops.burst(ep,14,5,G.cols[f.team],.16,.45,{dir:hn,spread:1});}
 const mz=muzzleOf(f,new V());const c=G.cols[f.team];beams.beam(mz,ep,[c.r*2.2,c.g*2.2,c.b*2.2],.06+.05*k,.45);beams.beam(mz,ep,[1.6,1.6,1.6],.015,.25);f.model.kick=1.5;
 snd.play('zap',me?null:f.pos,me?.8:1);if(me)G.shake=Math.max(G.shake,.15*k);}
const bombGeo=new THREE.SphereGeometry(.2,16,12),capGeo=new THREE.CylinderGeometry(.08,.1,.12,10);
function throwBomb(f){const me=f===G.me;const o=muzzleOf(f,new V());o.y=f.pos.y+1.25;let d=dirOf(f.yaw,f.pitch+.25,new V());if(me&&!G.attract){const a=aimDir(f,o,new V());d=dirOf(Math.atan2(-a.x,-a.z),Math.asin(cl(a.y,-1,1))+.25,d);}
 const g=new THREE.Group();const m=new THREE.Mesh(bombGeo,inkMat(G.cols[f.team].clone()));m.castShadow=true;g.add(m);const c=new THREE.Mesh(capGeo,new THREE.MeshStandardMaterial({color:0xf2f2f2,roughness:.3}));c.position.y=.2;g.add(c);g.position.copy(o);scene.add(g);
 G.bombs.push({pos:o.clone(),vel:d.multiplyScalar(BOMB.speed).addScaledVector(f.vel,.5),owner:f,team:f.team,fuse:null,life:5,mesh:g,blink:0});snd.play('throw',me?null:f.pos,me?1:.7);}
function updateBombs(dt){for(let i=G.bombs.length-1;i>=0;i--){const b=G.bombs[i];b.life-=dt;b.vel.y-=BOMB.grav*dt;const sp=b.vel.length();if(sp>1e-3){const dir=tv.copy(b.vel).divideScalar(sp),step=sp*dt;const wt=G.W.ray(b.pos,dir,step+.2,HO);
   if(wt<step+.2){b.pos.addScaledVector(dir,Math.max(0,wt-.2));const vn=b.vel.dot(HO.n);b.vel.addScaledVector(HO.n,-1.4*vn).multiplyScalar(.45);if(HO.n.y>.6){b.vel.x*=.6;b.vel.z*=.6;if(Math.abs(b.vel.y)<1.5)b.vel.y=0;}if(b.fuse===null){b.fuse=BOMB.fuse;snd.play('fizz',b.pos,.8);}}else b.pos.addScaledVector(dir,step);}
  if(b.fuse!==null){b.fuse-=dt;const k=1-b.fuse/BOMB.fuse;b.mesh.scale.setScalar(1+k*.45+Math.sin(G.time*40)*.06*k);}
  b.mesh.position.copy(b.pos);b.mesh.rotation.x+=dt*6;
  if(b.fuse!==null&&b.fuse<=0||b.life<=0||b.pos.y<-20){explodeBomb(b);scene.remove(b.mesh);G.bombs.splice(i,1);}}}
function explodeBomb(b){const p=b.pos,c=G.cols[b.team];paintAt(b.owner,p,BOMB.r);drops.burst(p,90,11,c,.28,.8,{up:true});drops.burst(p,40,6,c,.4,.6,{});shocks.fire(p,c.clone().multiplyScalar(.9),BOMB.r*1.1,.4);snd.play('boom',p);
 const dd=(G.me&&G.me.alive?G.me.pos:cam.position).distanceTo(p);if(dd<12)G.shake=Math.max(G.shake,(1-dd/12)*.7);
 for(const f of G.fighters){if(!f.alive||f.team===b.team)continue;const c2=tv2.copy(f.pos);c2.y+=.6;const d=c2.distanceTo(p);if(d>3.4||!G.W.los(p,c2))continue;damage(f,d<1.1?BOMB.dmg:30+60*(1-(d-1.1)/2.3),b.owner,{how:'INK BOMB',point:c2.clone(),dir:tv3.subVectors(c2,p).normalize().clone(),splash:true});}}
function startSlam(f){f.slam={ph:'rise',t:0};f.special=0;f.stats.specials++;f.vel.y=12.5;f.onGround=false;f.invuln=9;f.swim=false;f.h=PHY.h;f.chargeT=0;f.rolling=false;const me=f===G.me;snd.play('rise',me?null:f.pos,1);
 if(me)hud.banner('INKQUAKE!','',1.2,G.pal.c[f.team]);drops.burst(tv.copy(f.pos),30,6,G.cols[f.team],.25,.6,{up:true});}
function quakeHit(f){const p=f.pos.clone();f.slam=null;f.invuln=.4;f.ink=100;const c=G.cols[f.team];paintAt(f,p.clone().setY(p.y+.2),SPECIAL.r);
 drops.burst(p,220,16,c,.35,1.1,{up:true});drops.burst(p,80,9,c,.5,.8,{});shocks.fire(p,c.clone(),SPECIAL.r*1.2,.6);shocks.fire(p,new THREE.Color(1.4,1.4,1.4),SPECIAL.r*.7,.35);lights.flash(tv.copy(p).setY(p.y+1.5),c,60,18,.5);snd.play('quake',p);
 const dd=(G.me&&G.me.alive?G.me.pos:cam.position).distanceTo(p);if(dd<22)G.shake=Math.max(G.shake,(1-dd/22)*1.2);
 for(const o of G.fighters){if(!o.alive||o.team===f.team)continue;const d=o.pos.distanceTo(p);if(d<SPECIAL.kill)damage(o,220,f,{how:'INKQUAKE',point:o.pos.clone(),dir:tv2.subVectors(o.pos,p).normalize().clone(),splash:true});else if(d<SPECIAL.outer)damage(o,SPECIAL.outerDmg,f,{how:'INKQUAKE',point:o.pos.clone(),splash:true});}}

function damage(t,amount,att,o={}){if(!t.alive||amount<=0||t.invuln>0)return;if(att&&att!==t&&att.team===t.team)return;
 if(att&&att!==t){t.dmgBy.set(att,G.time);t.lastHitBy=att;t.lastHitT=G.time;}
 t.hp-=amount;t.hurtT=0;const killed=t.hp<=0;
 if(t.ai&&att&&att!==t&&(!t.ai.target||t.ai.lostT>.5)){t.ai.target=att;t.ai.lastPos.copy(att.pos);t.ai.lostT=0;t.ai.seenT=Math.min(t.ai.seenT,.15);}
 if(t===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amount/110);G.shake=Math.max(G.shake,Math.min(.35,amount/120));if(att&&att!==t){const dx=att.pos.x-t.pos.x,dz=att.pos.z-t.pos.z;hud.damageFrom(-wrapA(Math.atan2(-dx,-dz)-t.yaw));}}
 if(att===G.me&&t!==G.me){hud.hit(killed?'k':'');snd.play('hitmark',null,1,killed?1:0);}
 snd.play('hit',t.pos,t===G.me?.5:.7);
 if(killed){t.hp=0;die(t,att,o);}}
function die(f,k,o={}){if(!f.alive)return;f.alive=false;f.respawnT=RESPAWN;f.stats.deaths++;f.swim=false;f.slam=null;f.rolling=false;f.chargeT=0;f.h=PHY.h;
 const killer=k&&k!==f?k:null;const me=f===G.me;
 if(!o.fall){const p=f.pos.clone();p.y+=.4;const t=killer?killer.team:1-f.team;if(killer)paintAt(killer,p,1.8);else G.P.splat(p,1.8,t);const c=G.cols[t];drops.burst(p,90,9,c,.3,.9,{up:true});shocks.fire(p,c.clone(),2.2,.35);}
 f.model.root.visible=false;snd.play('splatted',f.pos);f.special=Math.floor(f.special*.5);f.killedBy=killer;f.killedHow=o.how||'';
 if(killer){killer.stats.splats++;for(const[a,t]of f.dmgBy)if(a!==killer&&a.team!==f.team&&G.time-t<5)a.stats.assists++;hud.feed(killer,f,'SPLATTED',killer===G.me||me);if(killer===G.me){snd.play('kill');hudMsg(`<span style="color:${G.pal.c[f.team]}">SPLATTED ${f.name}</span>`,1.2);}}
 else hud.feed(null,f,o.how||'SPLASHDOWN',me);
 if(me){G.hurtFx=.8;camPos.copy(cam.position);}}
let msgT=0;function hudMsg(t,dur=1.2){hud.prompt(t);msgT=dur;}

/* ================= match flow ================= */
function setCols(){G.pal=PALS[G.opt.pal]||PALS[0];G.cols[0].set(G.pal.c[0]);G.cols[1].set(G.pal.c[1]);const s=document.documentElement.style;s.setProperty('--a',G.pal.c[0]);s.setProperty('--b',G.pal.c[1]);}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);
 G.attract=false;G.app='play';setupMatch(G.opt.mode,G.opt.map,G.opt.diff,true);
 $('menu').hidden=$('keys').hidden=$('over').hidden=$('pause').hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.reset();$('lock').hidden=false;lock();snd.music(G.opt.mus>0,0);}
function setupMatch(mode,mapI,diff,human){G.mode=mode;G.M=MODES[mode];setCols();clearFighters();loadMap(mapI);G.P.reset();G.P.setColors(G.pal.c);G.S.recolor(G.pal.c);
 G.time=0;G.clock=MATCH_T;G.zone={owner:-1,count:[100,100]};G.results=null;G.timeScale=1;G.endT=0;G.lastMin=false;G.lastBeep=99;G.tally=null;parts.clear();drops.clear();beams.clear();shocks.clear();lights.clear();
 const names=NAMES.slice().sort(()=>Math.random()-.5);const kit=()=>['splatter','roller','charger','splatter'].sort(()=>Math.random()-.5);
 for(const t of[0,1]){const ws=kit();if(t===0&&human){const i=ws.indexOf(G.opt.wpn);ws.splice(i,1);ws.unshift(G.opt.wpn);}
  for(let i=0;i<4;i++){const isMe=human&&t===0&&i===0;const f=makeFighter(isMe?'YOU':names.pop(),t,isMe,diff,ws[i],t*4+i+(Math.random()*6|0));f.slot=i;if(isMe)G.me=f;}}
 for(const f of G.fighters)spawn(f);
 G.phase=human?'countdown':'play';G.cdT=3.2;if(G.me){G.camYaw=G.me.yaw;G.snapCam=true;}}
function attractMode(){G.app='menu';G.attract=true;setupMatch('turf',G.opt.map,1,false);
 // pre-simulate so the menu shows an inked-up arena
 for(let i=0;i<220;i++)simStep(.05);
 $('menu').hidden=$('keys').hidden=false;$('over').hidden=$('pause').hidden=$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.music(false);showBest();}
function toMenu(){unlock();attractMode();}
function endMatch(){if(G.phase==='end'||G.phase==='results')return;G.phase='end';G.endT=0;snd.play('whistle');hud.banner('GAME!','',2.2,'#ffffff');snd.music(false);for(const f of G.fighters){Object.assign(f.inp,blankInput());f.chargeT=0;f.rolling=false;}}
function stepZone(dt){const[a,b]=G.P.zoneShare(0);const z=G.zone;const prev=z.owner;let o=a>=.7?0:b>=.7?1:(z.owner>=0&&[a,b][z.owner]>=.45?z.owner:-1);z.owner=o;z.share=[a,b];
 if(o!==prev&&G.me&&!G.attract){if(o>=0){snd.play('zone');hud.banner(o===G.me.team?'ZONE CAPTURED':'ZONE LOST','',1.4,G.pal.c[o]);}}
 if(o>=0&&G.phase==='play'){z.count[o]=Math.max(0,z.count[o]-dt);if(z.count[o]<=0&&!G.attract){hud.banner('KNOCKOUT!','',2,G.pal.c[o]);endMatch();}}}
function stepMatch(dt){
 if(G.phase==='countdown'){const was=G.cdT;G.cdT-=dt;if(was>3&&G.cdT<=3){hud.banner('READY?','',1.3);snd.play('beep');}if(was>1.4&&G.cdT<=1.4)snd.play('beep');if(G.cdT<=0){G.phase='play';hud.banner('GO!','',.9,G.pal.c[0]);snd.play('ready');}}
 else if(G.phase==='play'){if(!G.attract){G.clock-=dt;if(G.clock<=60&&!G.lastMin){G.lastMin=true;hud.banner('1 MINUTE LEFT!','',1.6,'#ffd21a');snd.music(G.opt.mus>0,.8);}const s=Math.ceil(G.clock);if(G.clock<=10&&s!==G.lastBeep&&s>0){G.lastBeep=s;snd.play('beep');hud.banner(String(s),'',.8);}if(G.clock<=0){G.clock=0;endMatch();}}
  if(G.mode==='zone')stepZone(dt);if(G.attract&&G.time>110)setupMatch('turf',G.opt.map,1,false);}
 else if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.2?.3:1;if(G.endT>3){G.timeScale=1;showResults();}}}
function simStep(dt){G.time+=dt;stepMatch(dt);for(const f of G.fighters){if(f.ai&&f.alive&&(G.phase==='play'||G.attract)&&!G.botsFrozen)think(f,G,dt);else if(f.ai)Object.assign(f.inp,blankInput());}
 for(const f of G.fighters)stepFighter(f,dt);updateProj(dt);updateBombs(dt);}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}
 if(G.app==='over'){G.time+=dt;for(const f of G.fighters)if(f.ai)Object.assign(f.inp,blankInput());visuals(dt);stepTally(dt);return;}
 const sdt=dt*G.timeScale;readInput(dt);
 if(G.app==='play'||G.app==='menu'){G.time+=sdt;stepMatch(dt);for(const f of G.fighters){if(f.ai&&f.alive&&(G.phase==='play'||G.attract)&&!G.botsFrozen)think(f,G,sdt);else if(f.ai)Object.assign(f.inp,blankInput());}
  for(const f of G.fighters)stepFighter(f,sdt);updateProj(sdt);updateBombs(sdt);}
 visuals(sdt);}

/* ================= results: the judges' tally ================= */
function ord(n){return n+(['TH','ST','ND','RD'][n%10>3||Math.floor(n%100/10)===1?0:n%10]);}
function showResults(){G.app='over';G.phase='results';unlock();$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');snd.loops(0,0);
 const[a,b]=G.P.share();let win,va,vb;
 if(G.mode==='zone'){const z=G.zone.count;va=(100-z[0]);vb=(100-z[1]);win=z[0]<z[1]?0:z[1]<z[0]?1:(a>b?0:b>a?1:-1);}else{va=a*100;vb=b*100;win=a>b?0:b>a?1:-1;}
 G.tally={t:0,va,vb,win,revealed:false};$('over').hidden=false;$('oafter').classList.remove('on');$('confetti').innerHTML='';
 $('oeye').textContent=`${G.M.n} · ${G.D.def.name} · ${BOTDIFF[G.opt.diff].n} CREWS`;$('ojudge').textContent=G.mode==='zone'?'COUNTING THE ZONE…':'THE JUDGES ARE COUNTING…';
 $('tAt').textContent=G.pal.n[0]+(G.me.team===0?' · YOU':'');$('tBt').textContent=G.pal.n[1];$('tA').style.width=$('tB').style.width='0%';$('tAn').textContent=$('tBn').textContent=G.mode==='zone'?'0':'0.0%';
 document.querySelectorAll('#tally .nums div').forEach(d=>d.classList.remove('win'));snd.play('drum',null,1,3.3);
 const me=G.me,won=win===me.team;const s=me.stats;const pts=Math.max(0,Math.round(s.turf)+s.splats*100+s.assists*40+s.specials*30+(won?500:0));
 const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest(GID,pts);lastAward={pts,won,win,mode:G.mode,map:G.D.def.name,diff:BOTDIFF[G.opt.diff].n.toLowerCase(),turf:[a,b],zone:G.zone.count.slice(),splats:s.splats,deaths:s.deaths,turfP:Math.round(s.turf),wpn:WPN[me.wpn].name};
 G.results={won,win,draw:win<0,pts,tokens:tok,share:[a,b],zone:G.zone.count.slice(),stats:{...s}};
 const ranked=G.fighters.slice().sort((x,y)=>x.team-y.team||y.stats.turf-x.stats.turf);
 $('stats').innerHTML=`<tr><th>INKER</th><th>WEAPON</th><th>TURF INKED</th><th>SPLATS</th><th>ASSISTS</th><th>DEATHS</th><th>SPECIALS</th></tr>`+ranked.map(f=>`<tr class="t${f.team}${f===me?' me':''}"><td>${f.name}</td><td>${WPN[f.wpn].short}</td><td>${Math.round(f.stats.turf)}p</td><td>${f.stats.splats}</td><td>${f.stats.assists}</td><td>${f.stats.deaths}</td><td>${f.stats.specials}</td></tr>`).join('');
 $('otok').textContent=`+${tok} TOKENS · ${pts} PTS · BEST ${bestScore(GID)} PTS`;$('ores').textContent=win<0?'DRAW!':won?'VICTORY!':'DEFEAT';$('ores').style.color=win<0?'#fff':G.pal.c[win];}
function stepTally(dt){const T=G.tally;if(!T)return;T.t+=dt;const k=cl(T.t/3.1,0,1),e=1-Math.pow(1-k,2.2);const z=G.mode==='zone';
 // bars creep up to ~92% of the final values, hold, then snap to the truth on the reveal
 const f=T.revealed?1:e*.92;const A=T.va*f,B=T.vb*f;
 const wa=z?A/2:A,wb=z?B/2:B;$('tA').style.width=Math.min(100,wa).toFixed(2)+'%';$('tB').style.width=Math.min(100,wb).toFixed(2)+'%';
 $('tAn').textContent=z?String(Math.round(A)):A.toFixed(1)+'%';$('tBn').textContent=z?String(Math.round(B)):B.toFixed(1)+'%';
 if(!T.revealed&&T.t>3.6){T.revealed=true;const me=G.me;snd.play('cymbal');setTimeout(()=>snd.play(T.win===me.team?'fanfare':T.win<0?'ready':'lose'),250);
  if(T.win>=0)document.querySelectorAll('#tally .nums div')[T.win].classList.add('win');$('ojudge').textContent=T.win<0?"IT'S A DRAW!":`${G.pal.n[T.win]} WINS!`;$('ojudge').style.color=T.win<0?'':G.pal.c[T.win];
  if(T.win>=0)confetti(G.pal.c[T.win]);}
 if(T.revealed&&T.t>4.2&&!T.after){T.after=true;$('oafter').classList.add('on');}}
function confetti(col){const box=$('confetti');for(let i=0;i<70;i++){const c=document.createElement('i');c.style.left=Math.random()*100+'%';c.style.background=Math.random()<.7?col:'#fff';c.style.animationDuration=(2+Math.random()*2.5)+'s';c.style.animationDelay=Math.random()*.8+'s';c.style.transform=`scale(${.6+Math.random()*.9})`;box.appendChild(c);}}
let lastAward=null;
function showBest(){seg.sync();const b=bestScore(GID);$('best').textContent=b?`YOUR BEST · ${b} PTS`:'';$('mapdesc').textContent=MAPS[G.opt.map].sub+' — '+MAPS[G.opt.map].desc+'  ·  '+WPN[G.opt.wpn].name+': '+WPN[G.opt.wpn].desc;}

/* ================= visuals: models, camera, fx ================= */
const camPos=new V();let orbitA=0,camY=null,camDist=4;
function visuals(dt){parts.update(dt);drops.update(dt);beams.update(dt);shocks.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);shots.draw(G.proj,G.cols);
 const me=G.me;
 for(const f of G.fighters){const m=f.model;if(!f.alive){m.root.visible=false;continue;}const hs=Math.hypot(f.vel.x,f.vel.z);
  let vis=true;if(f.sub&&me&&f.team!==me.team&&hs<5&&!G.attract&&G.app!=='over')vis=false;m.root.visible=vis;m.root.position.copy(f.pos);m.root.rotation.y=f.yaw;
  const lvx=f.vel.x*Math.cos(f.yaw)-f.vel.z*Math.sin(f.yaw);
  m.pose({speed:hs,ground:f.onGround,pitch:f.pitch,swim:f.swim,sub:f.sub,vy:f.vel.y,fire:f.lastFire>G.time-.12?1:0,roll:f.rolling,flick:f.flickT,wpn:f.wpn,ink:f.ink,dead:false,slam:!!f.slam,lvx},dt,G.time);
  if(f.wpn==='roller'&&f.gun.userData.drum&&f.rolling)for(const d of f.gun.userData.drum)d.rotation.x-=hs*dt/.13;
  if(f.invuln>0&&!f.slam)m.root.visible=vis&&Math.floor(G.time*14)%2===0;}
 G.shake=Math.max(0,G.shake-dt*2.2);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);
 const aspect=innerWidth/innerHeight;
 if((G.app==='play'||G.app==='paused')&&me){
  if(me.alive||G.phase!=='play'){const fw=dirOf(me.yaw,me.pitch,tv),right=tv2.set(Math.cos(me.yaw),0,-Math.sin(me.yaw));const ph=me.swim?.9:1.6;
   const piv=new V(me.pos.x,me.pos.y+ph,me.pos.z).addScaledVector(right,.35);const want=camDist+(me.swim?.6:0);const back=tv3.copy(fw).negate();
   const t=G.W.ray(piv,back,want+.3,null);const dist=Math.max(.6,Math.min(want,t-.3));me.model.root.visible=me.model.root.visible&&dist>1.1;const cp=piv.clone().addScaledVector(back,dist).addScaledVector(right,.25);cp.y+=.15;
   if(camY===null||G.snapCam)camY=cp.y;else camY=damp(camY,cp.y,me.climb?6:18,dt);G.snapCam=false;cp.y=camY;
   const s=G.shake*G.shake*.08;cam.position.copy(cp);cam.rotation.set(me.pitch+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,0);
   cam.fov=damp(cam.fov,(me.sub&&Math.hypot(me.vel.x,me.vel.z)>6?78:72)+(me.slam?8:0),8,dt);
   // what the reticle points at
   const o=tv3.copy(cam.position).addScaledVector(fw,dist);const wt=G.W.ray(o,fw,80,null);const h=me.alive?rayFighters(o,fw,wt,me):null;G.aimP.copy(o).addScaledVector(fw,h?h.t:wt);G.aimTarget=h?h.f:null;G.aimFoe=!!h;}
  else{const k=me.killedBy;{const pv=tv3.set(me.pos.x,me.pos.y+1.2,me.pos.z),dd=tv2.set(Math.sin(me.yaw)*5,3.3,Math.cos(me.yaw)*5),L=dd.length();dd.divideScalar(L);const t=G.W.ray(pv,dd,L+.5,null);tv.copy(pv).addScaledVector(dd,Math.max(.5,Math.min(L,t-.5)));}camPos.lerp(tv,1-Math.exp(-dt*3));cam.position.copy(camPos);
   const tg=k&&k.alive?tv2.copy(k.pos).setY(k.pos.y+1):tv2.copy(me.pos);const mm=new THREE.Matrix4().lookAt(cam.position,tg,UP);cam.quaternion.slerp(new THREE.Quaternion().setFromRotationMatrix(mm),1-Math.exp(-dt*4));cam.fov=damp(cam.fov,60,4,dt);}
  snd.listener(cam.position.x,cam.position.y,cam.position.z,me.yaw);snd.loops(me.rolling?cl(Math.hypot(me.vel.x,me.vel.z)/5,0,1):0,me.sub?cl(Math.hypot(me.vel.x,me.vel.z)/10,0,1):0);
  cam.aspect=aspect;cam.updateProjectionMatrix();cam.updateMatrixWorld();
  if(msgT>0){msgT-=dt;if(msgT<=0)hud.prompt('');}
  if(G.app==='play'){if(msgT<=0)hud.prompt(me.alive&&me.special>=100?'<kbd>E</kbd> INKQUAKE READY':'');hud.update(dt,cam);hud.board(!!(keys.Tab||padBoard));}}
 else{// menu / results: orbit high over the arena to show off the paint
  orbitA+=dt*.06;const b=G.D.def.bounds,over=G.app==='over';const rx=(b[1]-b[0])*(over?.5:.62),rz=(b[3]-b[2])*(over?.42:.5);cam.position.set(Math.cos(orbitA)*rx,over?34:20+Math.sin(orbitA*.7)*3,Math.sin(orbitA)*rz);
  cam.lookAt(0,over?-2:0,0);cam.fov=over?58:60;cam.aspect=aspect;cam.updateProjectionMatrix();cam.updateMatrixWorld();snd.listener(cam.position.x,cam.position.y,cam.position.z,0);snd.loops(0,0);}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','ShiftLeft','KeyQ'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);}});
const {keys,edge,mouse,lock,unlock}=I;let padBoard=false;
const padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'){const i=me.inp;const sens=G.opt.sens*.0022;
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.swim=!!(keys.ShiftLeft||keys.ShiftRight||keys.ControlLeft);i.fire=mouse.l;i.sub=mouse.r||!!keys.KeyQ;i.special=!!(ed('KeyE')||ed('KeyF'));
  if(I.locked&&me.alive){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.3,1.15);}mouse.dx=mouse.dy=0;
  const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0);me.yaw-=lx*Math.abs(lx)*3.2*G.opt.sens*dt;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.4*G.opt.sens*dt,-1.3,1.15);
   if(P(0))i.jump=true;if(P(0)&&!padPrev[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;if((b[6]?.value||0)>.3)i.swim=true;if(P(5))i.sub=true;if(P(3)&&!padPrev[3]||P(4)&&!padPrev[4])i.special=true;
   if(P(9)&&!padPrev[9])pause(true);padBoard=!!P(8);for(let k=0;k<17;k++)padPrev[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}}
 else if(G.app==='paused'){const gp=gamepad();if(gp&&gp.buttons[9]?.pressed&&!padPrev[9])pause(false);if(gp)padPrev[9]=gp.buttons[9]?.pressed;}
 I.flush();}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');unlock();snd.loops(0,0);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= rendering ================= */
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyShadow(){if(!G.S)return;const s=G.S.sun;s.castShadow=gfx>0;const sz=gfx>=2?2048:1024;if(s.shadow.mapSize.x!==sz){s.shadow.mapSize.set(sz,sz);if(s.shadow.map){s.shadow.map.dispose();s.shadow.map=null;}}}
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.85));fxStack=null;fxSize='';applyShadow();R.shadowMap.needsUpdate=true;
 for(const f of G.fighters)f.model.root.traverse(o=>{if(o.isMesh&&o.material&&o.material.side===THREE.BackSide&&o.material.type==='MeshBasicMaterial')o.visible=q>0;});}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=drops.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 G.P.flush(R);
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.45,saturation:T.sat,tint:T.tint,vignette:.28,grain:.015,aoStrength:.55,quality:gfx});fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 fxStack.render();}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-mode','mode',false);seg('o-map','map',true,()=>{if(G.app==='menu')attractMode();});seg('o-wpn','wpn',false,()=>showBest());seg('o-diff','diff');seg('o-pal','pal',true,()=>{if(G.app==='menu'){setCols();G.P.setColors(G.pal.c);G.S.recolor(G.pal.c);for(const f of G.fighters){f.model.setColor(G.cols[f.team]);f.gun.traverse(o=>{if(o.material&&o.material.emissive&&o.material.roughness<.2){o.material.color.copy(G.cols[f.team]);o.material.emissive.copy(G.cols[f.team]);}});}}});
seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app!=='menu',0);});
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
postButton($('post'),GID,()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Gloss Riot\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'} · ${(MODES[a.mode]||{}).n||''}\nTurf: ${a.turf?a.turf.map(x=>(x*100).toFixed(1)+'%').join(' vs '):''}\nInked: ${a.turfP||0}p · Splats: ${a.splats||0} · Deaths: ${a.deaths||0}\nWeapon: ${a.wpn||''} · ${a.map||''} · ${a.diff||''} crews`];});

/* ================= boot ================= */
setCols();attractMode();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.GLOSSRIOT={G,step,render,start,toMenu,pause,endMatch,visuals:dt=>visuals(dt),get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},
 get me(){return G.me;},get player(){return G.me;},get fighters(){return G.fighters;},get bots(){return G.fighters.filter(f=>f.ai);},get clock(){return G.clock;},setClock(s){G.clock=s;},
 get share(){return G.P?G.P.share():[0,0];},get zone(){return G.zone;},get results(){return G.results;},get score(){return G.results?G.results.pts:Math.round(G.me?G.me.stats.turf:0);},
 get W(){return G.W;},get D(){return G.D;},get P(){return G.P;},get proj(){return G.proj;},get bombs(){return G.bombs;},scene,cam,R,snd,setQuality:applyQuality,get gfx(){return gfx;},get fx(){return fxStack;},
 skipCountdown(){if(G.phase==='countdown')G.cdT=0;},kill(v,k=null){const vv=typeof v==='number'?G.fighters[v]:v,kk=typeof k==='number'?G.fighters[k]:k;if(vv&&vv.alive){vv.invuln=0;damage(vv,999,kk,{how:'TEST',point:vv.pos.clone()});}},
 damage(v,n,k){const vv=typeof v==='number'?G.fighters[v]:v;damage(vv,n,k?(typeof k==='number'?G.fighters[k]:k):null,{});},
 teleport(x,y,z,f){f=f||G.me;f.pos.set(x,y,z);f.vel.set(0,0,0);G.snapCam=true;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;},
 aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+.9);const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));},
 input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},keys,mouse,freezeBots(on=true){G.botsFrozen=on;},splat(x,y,z,r,t=0){return G.P.splat(new V(x,y,z),r,t);},
 nav:()=>({nodes:G.W.nodes.length,roam:G.W.roam.length})};
