// ZENITH PROTOCOL — a 5v5 hero shooter in full 3D vs CPU heroes. Original game for Pixel Arcade.
// Seven heroes (tank / damage / support), each with a primary weapon, two cooldown abilities and a charging ultimate.
// Modes: PAYLOAD (attack or defend, two checkpoints, overtime) and CONTROL (one point, percentage race, overtime). Two maps.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {V,cl,rnd,wrapA,damp,fmt} from './util.js';
import {MAPS,buildMap} from './maps.js';
import {PHY} from './world.js';
import {buildScene,makePayload} from './scene.js';
import {Hero3D} from './actors.js';
import {WPN,gunModel,Viewmodel} from './weapons.js';
import {HEROES,ROLES,ORDER,CALLSIGNS} from './heroes.js';
import {Particles,Beams,Shocks,Decals,LightPool} from './fx.js';
import {Sound} from './sound.js';
import {BOTDIFF,newBrain,think} from './ai.js';
import {HUD,TEAMS,svgIcon} from './hud.js';
import {hexTex,ringTex} from './tex.js';
import {addRound,bestScore,saveBest,userName} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const $=id=>document.getElementById(id),C=(r,g,b)=>new THREE.Color(r,g,b);
const MODES={attack:{n:'PAYLOAD · ATTACK',mode:'payload',side:'attack'},defend:{n:'PAYLOAD · DEFEND',mode:'payload',side:'defend'},control:{n:'CONTROL',mode:'control'}};
const RESP=6,PL_R=3.6,CP_LOCK=12,tv=new V(),tv2=new V(),tv3=new V(),UP=new V(0,1,0);
const teamGlow=t=>C(...TEAMS[t].glow);

/* ================= renderer ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;R.shadowMap.autoUpdate=false;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(80,1,.06,9000);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
const vmHemi=new THREE.HemisphereLight(0xdfe8ff,0x202430,.6),vmKey=new THREE.DirectionalLight(0xffffff,1.2),vmRim=new THREE.DirectionalLight(0x9fc8ff,.7);vmKey.position.set(-1,2,1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmRim);
const showScene=new THREE.Scene(),showCam=new THREE.PerspectiveCamera(26,1,.1,50);showCam.position.set(0,1.2,5.4);showCam.lookAt(0,1.02,0);
{const k=new THREE.DirectionalLight(0xfff2e0,2.4);k.position.set(-2,3,3);const rim=new THREE.DirectionalLight(0x8fc0ff,2.2);rim.position.set(3,2,-2);const fill=new THREE.HemisphereLight(0xc8d8ff,0x302820,.9);showScene.add(k,rim,fill);
 const pad=new THREE.Mesh(new THREE.CylinderGeometry(1,1.08,.08,48),new THREE.MeshStandardMaterial({color:0x22252c,roughness:.3,metalness:.8}));pad.position.y=-.04;showScene.add(pad);
 const ring=new THREE.Mesh(new THREE.RingGeometry(1.02,1.1,64),new THREE.MeshBasicMaterial({color:C(1.6,1.2,.5),side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.005;showScene.add(ring);showScene.userData.ring=ring;}
const VM=new Viewmodel(vmCam);const snd=new Sound();
const parts=new Particles(scene,5000),smoke=new Particles(scene,1400,true),beams=new Beams(scene,160),shocks=new Shocks(scene,12),decals=new Decals(scene,160),lights=new LightPool(scene,6);

/* ================= state ================= */
const G={app:'menu',phase:'countdown',opt:{mode:'attack',map:0,diff:1,hero:'volt',sens:1,fov:100,vol:.8,mus:.5,ann:1},fighters:[],me:null,time:0,clock:180,cdT:5,goT:0,endT:0,
 D:null,W:null,S:null,mapDef:MAPS[0],proj:[],barriers:[],domes:[],zones:[],strikes:[],noise:null,hurtFx:0,shake:0,attract:true,timeScale:1,annQ:[],portraits:{},
 mode:'payload',attTeam:0,stage:0,pl:null,cpt:null,ot:false,otFuse:0,otT:0,winner:-1,results:null,aimTarget:null,aimFoe:false,aimAlly:false,modeName:''};
const saveOpt=stored('pxd_zenith_opt',G.opt);
G.enemy=(a,b)=>a!==b&&a.team!==b.team;
G.revealedTo=(o,team)=>o.revealT>0&&o.revealTeam===team;
G.deadAllies=(team,sec)=>G.fighters.filter(f=>f.team===team&&!f.alive&&G.time-f.deathT<sec).length;
G.objective=f=>{if(G.mode==='payload'&&G.pl){const P=G.pl;if(f.team===G.attTeam)return{p:P.pos,r:2.6};const a=routeAt(Math.min(P.total,P.s+4));return{p:a.pos,r:4,hold:true};}if(G.cpt)return{p:G.cpt.p,r:G.cpt.r*.75,hold:true};return null;};
G.onObjective=t=>{if(G.mode==='payload'&&G.pl)return Math.hypot(t.pos.x-G.pl.pos.x,t.pos.z-G.pl.pos.z)<PL_R&&Math.abs(t.pos.y-G.pl.pos.y)<2.5;if(G.cpt)return Math.hypot(t.pos.x-G.cpt.p.x,t.pos.z-G.cpt.p.z)<G.cpt.r&&t.pos.y>G.cpt.p.y-1&&t.pos.y<G.cpt.p.y+3;return false;};
const hud=new HUD(G);

/* ================= maps + objectives ================= */
const mapCache={};let plMesh=null,cpMesh=null;
function loadMap(i){const def=MAPS[i];if(G.S)scene.remove(G.S.root);let m=mapCache[i];if(!m){const D=buildMap(def);const S=buildScene(D,R,gfx);m=mapCache[i]={D,S};S.floorMesh=S.solidMeshes.filter(o=>o.material.customProgramCacheKey&&o.material.customProgramCacheKey()==='refl');
  let tot=0;D.segs=[];for(let k=0;k<D.route.length-1;k++){const a=D.route[k],b=D.route[k+1],L=a.distanceTo(b);D.segs.push({a,b,L,s0:tot});tot+=L;}D.total=tot;}
 m.S.sun.castShadow=gfx>0;m.S.mirror.on=gfx>0&&m.S.themeId==='neon';m.S.mirror.scale=gfx>=2?.5:.33;G.D=m.D;G.W=m.D.W;G.S=m.S;G.mapDef=def;scene.add(m.S.root);scene.environment=m.S.env;vmScene.environment=m.S.env;showScene.environment=m.S.env;scene.fog=m.S.fog;scene.background=m.S.bg;fxStack=null;R.shadowMap.needsUpdate=true;
 for(const p of G.proj)killProj(p);G.proj=[];clearAbilityObjs();parts.clear();smoke.clear();beams.clear();decals.clear();shocks.clear();lights.clear();
 if(!plMesh){plMesh=makePayload();scene.add(plMesh);cpMesh=makeCP();scene.add(cpMesh);}snd.ambience(def.theme);}
function routeAt(s){const D=G.D;s=cl(s,0,D.total);for(const g of D.segs){if(s<=g.s0+g.L+1e-6){const k=(s-g.s0)/g.L;return{pos:tv3.copy(g.a).lerp(g.b,k).clone(),dir:new V().subVectors(g.b,g.a).normalize()};}}const g=D.segs[D.segs.length-1];return{pos:g.b.clone(),dir:new V().subVectors(g.b,g.a).normalize()};}
function makeCP(){const g=new THREE.Group();const U={uT:{value:0},uC:{value:new THREE.Color(1,1,1)}};const m=new THREE.Mesh(new THREE.CylinderGeometry(1,1,1,64,1,true),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',fragmentShader:'uniform float uT;uniform vec3 uC;varying vec2 vU;void main(){float s=fract(vU.y*3.-uT*.6);float a=pow(1.-vU.y,2.4)*.7+smoothstep(.0,.05,s)*smoothstep(.16,.05,s)*.3*(1.-vU.y);gl_FragColor=vec4(uC*a,1.);}'}));
 m.position.y=1.5;m.scale.set(1,3,1);g.add(m);const ring=new THREE.Mesh(new THREE.PlaneGeometry(2.2,2.2),new THREE.MeshBasicMaterial({map:ringTex(),color:C(1,1,1),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));ring.rotation.x=-Math.PI/2;ring.position.y=.03;g.add(ring);
 g.userData={U,ring,cyl:m};g.visible=false;return g;}

/* ================= fighters ================= */
const blankInput=()=>({fwd:0,side:0,jump:false,jumpEdge:false,fire:false,zoom:false,reload:false,melee:false,a1:false,a2:false,ult:false});
function makeFighter(name,team,hero,human,diff){const f={name,team,hero,human,pos:new V(),vel:new V(),yaw:0,pitch:0,r:PHY.r,h:PHY.h,onGround:false,inp:blankInput(),alive:false,respawnT:0,hp:200,maxHp:200,
  mag:0,reloadT:0,fireCD:0,chargeT:0,zoom:0,spread:.01,meleeT:0,meleeCD:0,cd:{a1:0,a2:0},ult:0,ultOn:0,ampT:0,speedT:0,markT:0,stunT:0,invulnT:0,revealT:0,revealTeam:-1,burnT:0,flyT:0,fly:null,dash:null,slam:0,volley:null,barrier:null,
  lastFire:-9,lastHitBy:null,lastHitT:-9,dmgBy:new Map(),deathT:-99,deathPos:new V(),killedBy:null,killedWith:'',beamOn:false,beamHeal:false,beamT:null,stepT:0,landDip:0,recoil:0,ultReadyT:0,
  stats:{elims:0,final:0,assists:0,deaths:0,dmg:0,heal:0,mit:0,obj:0,ults:0,shots:0,hits:0},ai:human?null:newBrain(BOTDIFF[diff]),model:null};
 setHero(f,hero);G.fighters.push(f);return f;}
function setHero(f,hero){if(f.model)scene.remove(f.model.root);f.hero=hero;const H=HEROES[hero];f.H=H;f.maxHp=H.hp;f.hp=H.hp;f.model=new Hero3D(H.look,TEAMS[f.team]);const g=gunModel(H.wpn);g.scale.setScalar(.85*(H.role==='tank'?1.15:1));f.model.setGun(g);f.model.root.visible=false;scene.add(f.model.root);
 f.mag=WPN[H.wpn].mag;f.ult=0;f.cd={a1:0,a2:0};if(f===G.me)VM.set(H.wpn,H.look,teamGlow(f.team));}
function clearFighters(){for(const f of G.fighters)scene.remove(f.model.root);G.fighters=[];G.me=null;}
function spawnKey(f){if(G.mode==='control')return'C'+f.team;return(f.team===G.attTeam?'A':'D')+Math.min(2,G.stage);}
function spawn(f){const list=G.D.spawns[spawnKey(f)]||G.D.spawns.A0;let best=list[0],bs=-1;for(const s of list){let md=1e9;for(const o of G.fighters)if(o!==f&&o.alive)md=Math.min(md,o.pos.distanceTo(s));const sc=Math.min(md,6)+rnd(2);if(sc>bs){bs=sc;best=s;}}
 if(f.nextHero&&f.nextHero!==f.hero){setHero(f,f.nextHero);}f.nextHero=null;
 const obj=G.mode==='payload'?routeAt(G.pl?G.pl.s:0).pos:G.cpt?G.cpt.p:new V();f.pos.copy(best);f.vel.set(0,0,0);f.yaw=Math.atan2(-(obj.x-best.x),-(obj.z-best.z));f.pitch=0;f.alive=true;f.hp=f.maxHp;f.mag=WPN[f.H.wpn].mag;f.reloadT=0;f.chargeT=0;f.zoom=0;
 f.ampT=f.speedT=f.markT=f.stunT=f.burnT=f.flyT=0;f.fly=null;f.dash=null;f.slam=0;f.volley=null;f.invulnT=1;f.dmgBy.clear();f.beamOn=false;f.beamT=null;f.model.revive();f.model.root.visible=f!==G.me;
 if(f.ai){f.ai.path=null;f.ai.target=null;f.ai.goalT=0;f.ai.ally=null;}parts.burst(tv.copy(f.pos).setY(f.pos.y+1),30,5,teamGlow(f.team),.22,.6,{up:true,grav:-2});
 if(f===G.me){snd.play('spawn');hud.flash(.3);VM.set(f.H.wpn,f.H.look,teamGlow(f.team));G.snapCam=true;}}
const eyeOf=(f,o=new V())=>o.set(f.pos.x,f.pos.y+PHY.eye*(f.H.look.height||1),f.pos.z);
const dirOf=(yaw,pitch,o=new V())=>o.set(-Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));
const flatDir=(f,o=new V())=>o.set(-Math.sin(f.yaw),0,-Math.cos(f.yaw));

function stepFighter(f,dt){const inp=f.inp,H=f.H;
 if(!f.alive){if(G.phase==='play'||G.attract){f.respawnT-=dt;if(f.respawnT<=0)spawn(f);}return;}
 const frozen=G.phase==='countdown'&&!G.attract;
 for(const k of['ampT','speedT','markT','stunT','invulnT','revealT','burnT'])if(f[k]>0)f[k]=Math.max(0,f[k]-dt);f.cd.a1=Math.max(0,f.cd.a1-dt);f.cd.a2=Math.max(0,f.cd.a2-dt);
 if(f.ultOn>0)f.ultOn-=dt;else if(!frozen&&G.phase==='play')addUlt(f,2.2*dt);
 if(H.regen&&G.time-f.lastHitT>2.5&&f.hp<f.maxHp)f.hp=Math.min(f.maxHp,f.hp+14*dt);
 const stunned=f.stunT>0;
 // ---- movement ----
 const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);let wx=-sy*inp.fwd+cy*inp.side,wz=-cy*inp.fwd-sy*inp.side;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}if(frozen||stunned){wx=wz=0;}
 let spd=H.speed*(f.speedT>0?1.3:1)*(f.zoom>.5?.55:1)*(f.beamOn?.95:1);
 if(f.fly){const t=f.fly.target;f.flyT-=dt;if(!t.alive||f.flyT<=0){f.fly=null;f.flyT=0;}else{tv.subVectors(t.pos,f.pos);tv.y+=.4;const d=tv.length();if(d<2.2){f.fly=null;f.flyT=0;f.vel.multiplyScalar(.3);}else{tv.normalize();f.vel.copy(tv).multiplyScalar(19);}}}
 else if(f.dash){const D=f.dash;D.t-=dt;f.vel.x=D.dir.x*D.v;f.vel.z=D.dir.z*D.v;
  for(const o of G.fighters){if(!o.alive||!G.enemy(f,o)||D.hit.has(o))continue;if(o.pos.distanceTo(f.pos)<1.9){D.hit.add(o);damage(o,60,f,{weapon:'charge',point:tv2.copy(o.pos).setY(o.pos.y+1),dir:D.dir.clone()});o.vel.addScaledVector(D.dir,10);o.vel.y=Math.max(o.vel.y,5);o.onGround=false;G.shake=Math.max(G.shake,f===G.me?.4:0);}}
  if(Math.random()<dt*40)parts.emit(f.pos.x+rnd(.6)-.3,f.pos.y+.2,f.pos.z+rnd(.6)-.3,-D.dir.x*3,1,-D.dir.z*3,2.6,1.6,.5,.12,.35,4);if(D.t<=0||f.hitWall){f.dash=null;if(f.hitWall)G.shake=Math.max(G.shake,f===G.me?.3:0);}}
 else if(f.onGround){const k=Math.min(1,PHY.accel*dt);f.vel.x+=(wx*spd-f.vel.x)*k;f.vel.z+=(wz*spd-f.vel.z)*k;}
 else{const before=Math.hypot(f.vel.x,f.vel.z);f.vel.x+=wx*PHY.airAccel*spd*dt;f.vel.z+=wz*PHY.airAccel*spd*dt;const after=Math.hypot(f.vel.x,f.vel.z),lim=Math.max(before,spd*PHY.airMax);if(after>lim){f.vel.x*=lim/after;f.vel.z*=lim/after;}}
 if(inp.jumpEdge&&f.onGround&&!frozen&&!stunned){f.vel.y=PHY.jump;f.onGround=false;snd.play('jump',f.pos,f===G.me?1:.5);}
 if(!f.fly)f.vel.y-=PHY.g*dt;if(f.vel.y<-40)f.vel.y=-40;
 const wasG=f.onGround,vy0=f.vel.y;G.W.move(f,dt);
 if(f.onGround&&!wasG){const lv=-vy0;if(lv>6){f.landDip=Math.min(.3,lv*.016);snd.play('land',f.pos,f===G.me?1:.5,lv);}if(f.slam>0)slamLand(f);}
 if(f.slam>0)f.slam+=dt;if(f.slam>3)f.slam=0;
 const hs=Math.hypot(f.vel.x,f.vel.z);if(f.onGround&&hs>2){f.stepT-=dt*hs*.36;if(f.stepT<=0){f.stepT=1;snd.play('step',f.pos,f===G.me?.7:.45);}}
 // payload is solid
 if(plMesh&&plMesh.visible){const dx=f.pos.x-G.pl.pos.x,dz=f.pos.z-G.pl.pos.z,d=Math.hypot(dx,dz),m=1.55+f.r;if(d<m&&f.pos.y<G.pl.pos.y+1.3){const k=(m-d)/(d||1);f.pos.x+=dx*k;f.pos.z+=dz*k;}}
 if(f.pos.y<G.W.killY){die(f,f.lastHitT>G.time-6?f.lastHitBy:null,{weapon:'fall'});return;}
 if(frozen)return;
 if(G.mode&&G.onObjective(f)&&G.phase==='play')f.stats.obj+=dt;
 if(f.volley){const v=f.volley;v.t-=dt;if(v.t<=0&&v.n>0){v.n--;v.t=.075;fireRocket(f);}if(v.n<=0)f.volley=null;}
 if(stunned){f.beamOn=false;return;}
 // ---- abilities ----
 if(inp.a1)useAbility(f,'a1');if(inp.a2)useAbility(f,'a2');if(inp.ult)useAbility(f,'ult');
 // ---- weapon ----
 const d=WPN[H.wpn];f.fireCD-=dt;f.meleeCD-=dt;if(f.meleeT>0)f.meleeT-=dt;f.recoil*=Math.exp(-dt*10);f.spread=Math.max(d.spr||0,f.spread-dt*(d.sprMax||.02)*2.2);
 f.zoom=damp(f.zoom,inp.zoom&&d.scope&&f.reloadT<=0?1:0,14,dt);if(d.scope){if(f.zoom>.7)f.chargeT=Math.min(d.charge,f.chargeT+dt);else f.chargeT=Math.max(0,f.chargeT-dt*3);}
 if(f.reloadT>0){f.reloadT-=dt;if(f.reloadT<=0){f.mag=d.mag;f.reloadT=0;}}
 if(inp.reload&&!f.reloadT&&d.mag&&f.mag<d.mag&&f.meleeT<=0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}
 if(inp.melee&&f.meleeCD<=0){melee(f);}
 const can=f.reloadT<=0&&f.meleeT<=0&&!f.dash&&!f.fly;
 if(d.beam){f.beamOn=false;if(inp.fire&&can)beamTick(f,d,dt);if(f===G.me)snd.beam(f.beamOn,f.beamHeal);}
 else if(inp.fire&&can&&f.fireCD<=0){if(f.mag<=0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}else{shoot(f,d);f.fireCD=d.rate;}}
 if(d.mag&&f.mag<=0&&!f.reloadT&&!inp.fire&&f.fireCD<0){f.reloadT=d.reload;snd.play('reload',f.pos,f===G.me?1:.5);}}
function addUlt(f,a){const H=f.H;if(f.ultOn>0||!f.alive)return;const was=f.ult>=H.ult.cost;f.ult=Math.min(H.ult.cost,f.ult+a);if(!was&&f.ult>=H.ult.cost&&f===G.me){snd.play('ultReady');hud.banner('ULTIMATE READY',H.ult.name+' · PRESS Q','#ffd23f',1.6);}}

/* ================= combat ================= */
function rayFighters(o,d,maxT,skip,filter){const out=[];for(const f of G.fighters){if(f===skip||!f.alive||filter&&!filter(f))continue;const sc=f.H.look.height||1,bk=Math.max(1,(f.H.look.bulk||1)*.85);
  const hx=f.pos.x-o.x,hy=f.pos.y+1.62*sc-o.y,hz=f.pos.z-o.z;const tc=hx*d.x+hy*d.y+hz*d.z;if(tc<-1||tc>maxT+1)continue;const d2=hx*hx+hy*hy+hz*hz-tc*tc;let best=null;const hr=.24*sc;
  if(d2<hr*hr){const t=tc-Math.sqrt(hr*hr-d2);if(t>0&&t<maxT)best={f,t,head:true};}
  const ay=f.pos.y+.25,by=f.pos.y+1.42*sc,r=.42*bk;const wx=o.x-f.pos.x,wz=o.z-f.pos.z;const A=d.x*d.x+d.z*d.z;if(A>1e-6){const B=wx*d.x+wz*d.z,Cc=wx*wx+wz*wz-r*r,Dd=B*B-A*Cc;if(Dd>=0){const t=(-B-Math.sqrt(Dd))/A;const y=o.y+d.y*t;if(t>0&&t<maxT&&y>ay-r*.5&&y<by+r*.4&&(!best||t<best.t-.04))best={f,t,head:false};}}
  if(best)out.push(best);}out.sort((a,b)=>a.t-b.t);return out;}
// enemy hard-light: barriers (rect) and domes (sphere, only from outside)
function shieldHit(o,d,maxT,team){let best=null;
 for(const b of G.barriers){if(b.team===team)continue;const den=d.dot(b.n);if(Math.abs(den)<1e-4)continue;const t=tv.subVectors(b.c,o).dot(b.n)/den;if(t<=0||t>=maxT||best&&t>=best.t)continue;const p=tv2.copy(o).addScaledVector(d,t);const dx=tv.subVectors(p,b.c).dot(b.right),dy=p.y-b.c.y;if(Math.abs(dx)<=b.w/2&&dy>=-.1&&dy<=b.h)best={t,s:b};}
 for(const m of G.domes){if(m.team===team)continue;const oc=tv.subVectors(o,m.c);const c2=oc.lengthSq()-m.r*m.r;if(c2<0)continue;const bb=oc.dot(d),disc=bb*bb-c2;if(disc<0)continue;const t=-bb-Math.sqrt(disc);if(t>0&&t<maxT&&(!best||t<best.t))best={t,s:m};}
 return best;}
function absorb(s,a,att){s.hp-=a;s.flash=1;s.owner.stats.mit+=a;addUlt(s.owner,a*.4);if(att===G.me)hud.hit('b');snd.play('barrierHit',s.c,.6);if(s.hp<=0)breakShield(s);}
function breakShield(s){if(s.dead)return;s.dead=true;snd.play('barrierBreak',s.c);parts.burst(tv.copy(s.c).setY(s.c.y+1.4),60,7,[teamGlow(s.team),C(2,2,2.4)],.12,.6,{grav:6});scene.remove(s.mesh);if(s.owner.barrier===s)s.owner.barrier=null;}
function muzzleOf(f,o=new V()){if(f===G.me&&G.app!=='menu'&&VM.root.visible){const g=VM.guns[f.H.wpn];const md=g?.userData.muzzle||new V(0,0,-.7);
  VM.root.updateWorldMatrix(true,true);o.copy(md).applyMatrix4(g.matrixWorld).applyMatrix4(vmCam.matrixWorldInverse).applyMatrix4(vmCam.projectionMatrix);o.z=.5;cam.updateMatrixWorld();o.unproject(cam).sub(cam.position).normalize().multiplyScalar(1.1).add(cam.position);return o;}
 if(f===G.me)return eyeOf(f,o).addScaledVector(dirOf(f.yaw,f.pitch,tv3),.8);f.model.gunMount.updateWorldMatrix(true,false);return o.set(0,.03,-.62).applyMatrix4(f.model.gunMount.matrixWorld);}
const dmgMult=f=>(f.ampT>0?1.25:1)*(f.markT>0?1.4:1);
function shoot(f,d){f.mag--;f.lastFire=G.time;G.noise={p:f.pos.clone(),t:G.time,who:f};f.stats.shots++;const me=f===G.me;const id=f.H.wpn;
 const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());const right=new V(Math.cos(f.yaw),0,-Math.sin(f.yaw)),up=new V().crossVectors(right,fw);
 const moving=Math.hypot(f.vel.x,f.vel.z)>2?1.2:1,air=f.onGround?1:1.4,zm=1-f.zoom*.9;const spr=(d.pel?d.spr:f.spread)*(d.pel?1:moving*air)*zm;const mz=muzzleOf(f,new V());let hitAny=false;
 const mult=dmgMult(f);let base=d.dmg;if(d.scope){base=f.zoom>.7?d.dmg+(d.charged-d.dmg)*(f.chargeT/d.charge):d.dmg;f.chargeT=0;}
 if(d.proj){const p=eye.clone().addScaledVector(fw,.7);spawnBolt(f,p,fw.clone(),'ember');}
 else{const n=d.pel||1;for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,r=Math.sqrt(Math.random())*spr;const dir=fw.clone().addScaledVector(right,Math.cos(a)*r).addScaledVector(up,Math.sin(a)*r).normalize();
   const ho={n:new V()};let wt=G.W.ray(eye,dir,d.range,ho);const sh=shieldHit(eye,dir,wt,f.team);if(sh)wt=sh.t;
   const hits=rayFighters(eye,dir,wt,f,d.ally?null:o=>G.enemy(f,o));let end=wt;
   if(hits.length){const h=hits[0];end=h.t;let dmg=base;if(d.fall&&h.t>d.fall[0])dmg*=1-(1-d.fall[2])*cl((h.t-d.fall[0])/(d.fall[1]-d.fall[0]),0,1);
    if(!G.enemy(f,h.f)){if(d.heal){heal(h.f,d.heal*(f.ampT>0?1.25:1),f);parts.burst(tv.copy(eye).addScaledVector(dir,h.t),10,3,[C(.6,3,.8),C(1.6,3,1)],.1,.5,{up:true,grav:-2});snd.play('healHit',h.f.pos,h.f===G.me||me?.9:.5);}}
    else{damage(h.f,dmg*(h.head?d.hs:1)*mult,f,{head:h.head,weapon:id,point:eye.clone().addScaledVector(dir,h.t),dir,dist:h.t});hitAny=true;}}
   else if(sh)absorb(sh.s,base*mult,f);
   const ep=eye.clone().addScaledVector(dir,end);const tc=d.tr;
   if(d.scope){beams.beam(mz,ep,[tc[0]*1.2,tc[1]*1.2,tc[2]*1.2],.06,.7);beams.beam(mz,ep,[1.6,1.4,1.8],.016,.3);lights.flash(mz,d.col,16,10,.12);}
   else if(i<3||Math.random()<.4)beams.tracer(mz,ep,tc,d.pel?.018:.024,d.pel?260:320,d.pel?4:6);
   if(!hits.length&&!sh&&wt<d.range)impact(ep,ho.n,d,id);}}
 if(hitAny)f.stats.hits++;if(d.sprAdd)f.spread=Math.min(d.sprMax||d.spr,f.spread+d.sprAdd);
 snd.play(id,me?null:f.pos,me?.85:1);f.model.st.kick=1;if(me){VM.fire();f.recoil+=d.kick*.012;G.shake=Math.max(G.shake,d.kick*.07);}else if(Math.random()<.5)lights.flash(mz,d.col,5,5,.06);}
function beamTick(f,d,dt){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let t=f.beamT;const ok=(o,cone)=>{if(!o||!o.alive||o===f)return false;const c=tv.copy(o.pos);c.y+=1.1*(o.H.look.height||1);const dd=c.distanceTo(eye);if(dd>d.range+(o===f.beamT?2:0))return false;tv2.subVectors(c,eye).normalize();if(tv2.dot(fw)<cone)return false;return G.W.los(eye,c);};
 if(!ok(t,t&&!G.enemy(f,t)?.82:.9)){t=null;let bd=-1;for(const o of G.fighters){if(o===f||!o.alive)continue;const ally=!G.enemy(f,o);if(!ok(o,ally?.965:.985))continue;const s=tv2.dot(fw)+(ally?1:0);if(s>bd){bd=s;t=o;}}}
 f.beamT=t;if(!t)return;f.beamOn=true;f.lastFire=G.time;const heal_=!G.enemy(f,t);f.beamHeal=heal_;const c=tv.copy(t.pos);c.y+=1.1*(t.H.look.height||1);const mz=muzzleOf(f,new V());
 if(heal_)heal(t,d.heal*dt*(f.ampT>0?1.25:1),f);else damage(t,d.dmg*dt*dmgMult(f),f,{weapon:'beam',point:c.clone(),dir:fw,quiet:true});
 beams.beam(mz,c,heal_?[2.6,2.1,.9]:[3,.9,.5],.05,.07);beams.beam(mz,c,[1.6,1.6,1.4],.016,.07);if(Math.random()<dt*20)parts.emit(c.x+rnd(.6)-.3,c.y+rnd(.8)-.4,c.z+rnd(.6)-.3,0,1.2,0,heal_?2.4:3,heal_?2:.8,heal_?.8:.4,.12,.5,-1);
 f.model.st.kick=.3;if(f===G.me)VM.kick=Math.max(VM.kick,.15);}
function impact(p,n,d,id){const col=C(...d.tr);parts.burst(p,id==='scrap'?3:7,6,[col,C(2.2,1.8,1.2)],.07,.35,{dir:n,spread:.9,grav:14,drag:2,floor:p.y-2});decals.add(p,n,id==='longbow'?.4:.16);
 if(Math.random()<.35)smoke.emit(p.x,p.y,p.z,n.x*.6,n.y*.6+.3,n.z*.6,.4,.4,.42,.4,.9,-.3,1);if(Math.random()<.3)snd.play('tink',p,.5);if(id==='longbow')shocks.fire(p,C(1.6,.5,2),1.2,.3);}

/* ---------- projectiles ---------- */
const boltGeo=new THREE.SphereGeometry(.16,14,10),PM={ember:new THREE.MeshBasicMaterial({color:C(3.2,1.4,.3)}),rocket:new THREE.MeshBasicMaterial({color:C(1,2.4,3.4)}),shock:new THREE.MeshBasicMaterial({color:C(.8,2.4,3.4)}),bio:new THREE.MeshBasicMaterial({color:C(1,3.4,.8)}),well:new THREE.MeshBasicMaterial({color:C(1.6,.5,3.2)})};
function spawnBolt(f,p,dir,kind){const spd=kind==='ember'?WPN.ember.speed:kind==='rocket'?40:kind==='well'?18:19;const m=new THREE.Mesh(boltGeo,PM[kind]);m.scale.setScalar(kind==='well'?2.2:kind==='rocket'?.8:1);m.position.copy(p);scene.add(m);
 const v=dir.clone().multiplyScalar(spd);if(kind==='shock'||kind==='bio'){v.y+=3.5;v.addScaledVector(f.vel,.4);}
 const pr={kind,pos:p.clone(),vel:v,owner:f,team:f.team,life:kind==='shock'?1.1:5,mesh:m,light:kind==='rocket'?null:lights.grab(null,kind==='ember'?0xff8a30:kind==='bio'?0x80ff60:kind==='well'?0xa060ff:0x60c0ff,8,7),grav:kind==='ember'?WPN.ember.grav:kind==='rocket'?0:kind==='well'?2:PHY.g*.8,age:0};G.proj.push(pr);return pr;}
function fireRocket(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw+rnd(.06)-.03,f.pitch+rnd(.05)-.02,new V());const p=eye.addScaledVector(fw,.8);p.x+=rnd(.4)-.2;p.y+=rnd(.3)-.1;spawnBolt(f,p,fw,'rocket');snd.play('volley',f.pos,f===G.me?.9:1);if(f===G.me){VM.fire();G.shake=Math.max(G.shake,.12);}}
function killProj(p){scene.remove(p.mesh);if(p.light)lights.release(p.light);p.dead=true;}
function updateProj(dt){const ho={n:new V()},pd=new V();for(let i=G.proj.length-1;i>=0;i--){const p=G.proj[i];p.life-=dt;p.age+=dt;
  p.vel.y-=p.grav*dt;const step=p.vel.length()*dt,dir=pd.copy(p.vel).normalize();const sh=shieldHit(p.pos,dir,step+.1,p.team);
  const wt=G.W.ray(p.pos,dir,step+.12,ho);const ally=p.kind==='bio';const fh=rayFighters(p.pos,dir,Math.min(wt,sh?sh.t:1e9)+.15,p.age<.12?p.owner:null,o=>o!==p.owner&&(ally||G.enemy(p.owner,o)));
  let boom=null,direct=null;
  if(fh.length){boom=p.pos.clone().addScaledVector(dir,fh[0].t);direct=fh[0].f;}else if(sh&&sh.t<=step+.1){boom=p.pos.clone().addScaledVector(dir,sh.t);absorb(sh.s,p.kind==='ember'?100:p.kind==='rocket'?50:60,p.owner);}
  else if(wt<step+.12){if(p.kind==='shock'){p.pos.addScaledVector(dir,Math.max(0,wt-.15));const vn=p.vel.dot(ho.n);p.vel.addScaledVector(ho.n,-1.5*vn).multiplyScalar(.55);if(ho.n.y>.6&&p.vel.length()<1.5)p.vel.set(0,0,0);if(Math.abs(vn)>2)snd.play('tink',p.pos,.6);}
   else boom=p.pos.clone().addScaledVector(dir,Math.max(0,wt-.1));}
  else p.pos.addScaledVector(dir,step);
  if(!boom&&p.life<=0)boom=p.pos.clone();
  if(boom){detonate(p,boom,direct);killProj(p);G.proj.splice(i,1);continue;}
  p.mesh.position.copy(p.pos);if(p.light)p.light.L.position.copy(p.pos);const c=p.kind==='ember'?[3,1.3,.3]:p.kind==='rocket'?[1,2.2,3.2]:p.kind==='bio'?[.8,3,.6]:p.kind==='well'?[1.6,.5,3]:[.6,2,3.2];
  for(let k=0;k<(p.kind==='well'?4:2);k++)parts.emit(p.pos.x+rnd(.2)-.1,p.pos.y+rnd(.2)-.1,p.pos.z+rnd(.2)-.1,rnd(1)-.5,rnd(1)-.5,rnd(1)-.5,c[0],c[1],c[2],.2,.3);if(p.kind==='ember'&&Math.random()<dt*20)smoke.emit(p.pos.x,p.pos.y,p.pos.z,0,.4,0,.3,.28,.3,.3,.8,-.3,1);}}
function detonate(p,pos,direct){const o=p.owner;
 if(p.kind==='ember'){if(direct)damage(direct,WPN.ember.dmg*dmgMult(o),o,{weapon:'ember',point:pos.clone(),dir:p.vel.clone().normalize()});explode(pos,o,WPN.ember.sdmg*dmgMult(o),WPN.ember.splash,WPN.ember.push,'ember',direct);}
 else if(p.kind==='rocket'){if(direct)damage(direct,18*dmgMult(o),o,{weapon:'volley',point:pos.clone()});explode(pos,o,30*dmgMult(o),2.6,4,'volley',direct);}
 else if(p.kind==='shock')explode(pos,o,90*dmgMult(o),4,6,'shock');
 else if(p.kind==='bio'){parts.burst(pos,70,8,[C(.8,3,.6),C(2,3.2,1.6)],.18,.6,{grav:2});shocks.fire(pos,C(.4,1.6,.4),4,.4);snd.play('bass',pos);
  for(const f of G.fighters){if(!f.alive||f.pos.distanceTo(pos)>4.5)continue;if(G.enemy(o,f))damage(f,60*dmgMult(o),o,{weapon:'bionade',point:pos.clone(),splash:true});else heal(f,90,o);}}
 else if(p.kind==='well'){G.zones.push({kind:'well',team:o.team,owner:o,p:pos.clone(),t:2.5,mesh:wellMesh(pos)});snd.play('well',pos);}}
function explode(pos,owner,dmg,radius,push,kind,skip){const c1=kind==='shock'||kind==='volley'?C(.6,1.8,3.4):kind==='slam'?C(3,2,.8):C(3.2,1.5,.4),c2=kind==='shock'||kind==='volley'?C(.4,1,2.6):C(2.4,.6,.1);
 parts.burst(pos,kind==='volley'?40:90,13,[c1,c2,C(3,2.6,2)],.4,.6,{grav:3,drag:2.4});for(let k=0;k<(kind==='volley'?4:12);k++)smoke.emit(pos.x+rnd(1.4)-.7,pos.y+rnd(1)-.3,pos.z+rnd(1.4)-.7,rnd(2)-1,rnd(2),rnd(2)-1,.25,.22,.24,1.3+rnd(1),1.8+rnd(1),-.4,1.2);
 shocks.fire(pos,c1.clone().multiplyScalar(.5),radius*1.1,.4);lights.flash(pos,kind==='shock'||kind==='volley'?0x60a0ff:0xff8a30,60,radius*4,.4);snd.play('boom',pos,kind==='volley'?.6:1);
 const ho={n:new V()};const gd=G.W.ray(pos,tv.set(0,-1,0),3,ho);if(gd<3)decals.add(pos.clone().setY(pos.y-gd),ho.n,radius*.6);
 const mePos=G.me&&G.me.alive?G.me.pos:cam.position;const dd=mePos.distanceTo(pos);if(dd<radius*4)G.shake=Math.max(G.shake,cl(1-dd/(radius*4),0,1)*.7);
 for(const f of G.fighters){if(!f.alive||f===skip)continue;const self=f===owner;if(!self&&!G.enemy(owner,f))continue;const c=tv2.copy(f.pos);c.y+=.9;const d=c.distanceTo(pos);if(d>radius)continue;if(!G.W.los(pos,c)&&!G.W.los(pos,tv3.copy(f.pos).setY(f.pos.y+1.6)))continue;
  const k=1-d/radius;tv3.subVectors(c,pos).normalize();tv3.y=Math.max(tv3.y,.35);f.vel.addScaledVector(tv3.normalize(),push*(.45+k*.55)*(self?1.3:1));if(f.vel.y>4)f.onGround=false;
  const am=dmg*(.3+.7*k)*(self?.4:1);damage(f,am,owner,{weapon:kind,point:pos.clone(),dir:tv3.clone(),splash:true});}}
function melee(f){f.meleeT=.35;f.meleeCD=.9;snd.play('melee',f.pos,f===G.me?1:.6);const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bd=2.6;
 for(const o of G.fighters){if(o===f||!o.alive||!G.enemy(f,o))continue;tv.copy(o.pos).setY(o.pos.y+1).sub(eye);const d=tv.length();if(d>bd)continue;tv.normalize();if(tv.dot(fw)<.55)continue;best=o;bd=d;}
 if(best){tv.subVectors(best.pos,f.pos).setY(0).normalize();damage(best,30*dmgMult(f),f,{weapon:'melee',point:tv2.copy(best.pos).setY(best.pos.y+1.2),dir:tv.clone()});best.vel.addScaledVector(tv,4);}}

function damage(t,amount,att,o={}){if(!t.alive||amount<=0)return;if(att&&att!==t&&!G.enemy(att,t))return;if(t.invulnT>0&&att!==t)return;
 if(t.ampT>0)amount*=.6;const a=Math.min(amount,t.hp);
 if(att&&att!==t){t.dmgBy.set(att,G.time);t.lastHitBy=att;t.lastHitT=G.time;att.stats.dmg+=a;addUlt(att,a);if(att===G.me)hud.dmgSeen.set(t,G.time);}
 t.hp-=amount;if(!o.quiet||Math.random()<.08){const local=tv3.copy(o.point||t.pos).sub(t.pos);local.y-=.95;local.x/=.5;local.y/=1.02;local.z/=.42;local.applyAxisAngle(UP,-t.yaw);t.model.hit(local.normalize(),Math.min(1,amount/50));
  if(o.point&&!o.splash)parts.burst(o.point,6,4,[C(2.4,.8,.3),C(1.4,.4,.2)],.07,.35,{grav:10});snd.play('hitBody',t.pos,.6);}
 if(t.ai){t.ai.flinch=.3;if(att&&att!==t&&(!t.ai.target||t.ai.lostT>.5)){t.ai.target=att;t.ai.lastPos.copy(att.pos);t.ai.lostT=0;}}
 if(t===G.me){G.hurtFx=Math.min(.7,G.hurtFx+amount/150);G.shake=Math.max(G.shake,Math.min(.35,amount/120));if(att&&att!==t&&!o.quiet){const dx=att.pos.x-t.pos.x,dz=att.pos.z-t.pos.z;hud.damageFrom(wrapA(Math.atan2(-dx,-dz)-t.yaw)*-1);}}
 const killed=t.hp<=0;if(att===G.me&&t!==G.me&&(!o.quiet||killed)){hud.hit(killed?'k':o.head?'h':'');snd.play(o.head?'headshot':'hitmark',null,1,killed?1:0);}
 if(killed){t.hp=0;die(t,att,o);}}
function heal(t,amount,healer){if(!t.alive||t.hp>=t.maxHp||amount<=0)return 0;const a=Math.min(amount,t.maxHp-t.hp);t.hp+=a;if(healer){healer.stats.heal+=a;addUlt(healer,a*.9);}return a;}
const WNAME={fall:'ENVIRONMENT',melee:'MELEE',charge:'RAM CHARGE',slam:'FAULT LINE',well:'UNDERTOW',shock:'SHOCK CHARGE',volley:'STORMCALL',fire:'FIRE LINE',meteor:'STARFALL',bionade:'BASS DROP',beam:'MENDING BEAM'};
function die(f,k,o={}){if(!f.alive)return;f.alive=false;f.respawnT=RESP;f.stats.deaths++;f.deathT=G.time;f.deathPos.copy(f.pos);f.beamOn=false;f.fly=null;f.dash=null;f.volley=null;if(f===G.me)snd.beam(false);
 if(f.barrier)breakShield(f.barrier);const wname=WNAME[o.weapon]||WPN[o.weapon]?.name||String(o.weapon||'').toUpperCase();
 const dir=o.dir?tv.copy(o.dir).setY(0).normalize():tv.set(0,0,1);f.model.kill(dir,o.splash?7:3);parts.burst(tv2.copy(f.pos).setY(f.pos.y+1),30,5,[teamGlow(f.team),C(2,2,2)],.1,.6,{grav:8});snd.play('death',f.pos);
 f.killedBy=k&&k!==f?k:null;f.killedWith=wname;
 if(k&&k!==f){k.stats.elims++;k.stats.final++;for(const[a,t]of f.dmgBy)if(a!==k&&G.time-t<5&&G.enemy(a,f)){a.stats.assists++;a.stats.elims++;}
  if(k===G.me){snd.play('kill');hud.prompt(`<span style="color:#ff6a5a">ELIMINATED</span> ${f.name} · ${f.H.name}`);msgT=1.6;}hud.feed(k,f,wname,o.head,k===G.me||f===G.me);}
 else hud.feed(null,f,wname,false,f===G.me);
 if(f===G.me){G.hurtFx=.8;f.zoom=0;f.model.root.visible=true;camPos.copy(cam.position);}
 // team wipe callout
 if(G.phase==='play'&&!G.attract&&G.me&&G.fighters.filter(x=>x.team===f.team&&x.alive).length===0)ann(f.team===G.me.team?'team wiped':'enemy team eliminated');}

/* ================= abilities ================= */
function aimPoint(f,max=40){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());const ho={n:new V()};const t=G.W.ray(eye,fw,max,ho);const p=eye.addScaledVector(fw,t);const g=G.W.groundBelow(p.x,p.y+.3,p.z,.1);if(g>-1e8&&p.y-g<12)p.y=g;else p.y=Math.max(0,g);return p;}
function hexMat(team,op=.5){const U={uHex:{value:HEX},uC:{value:teamGlow(team).multiplyScalar(.55)},uF:{value:0},uT:{value:0},uA:{value:op}};
 return new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,vertexShader:'varying vec2 vU;varying vec3 vN,vV;void main(){vU=uv;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform sampler2D uHex;uniform vec3 uC;uniform float uF,uT,uA;varying vec2 vU;varying vec3 vN,vV;void main(){float hx=texture2D(uHex,vU*vec2(5.,3.)).r;float f=pow(1.-abs(dot(vN,vV)),2.);float e=max(smoothstep(.06,0.,vU.x),max(smoothstep(.94,1.,vU.x),max(smoothstep(.04,0.,vU.y),smoothstep(.96,1.,vU.y))));float sw=smoothstep(.05,0.,abs(fract(vU.y-uT*.4)-.5))*.25;gl_FragColor=vec4(uC*(uA*.35+hx*(.5+uF*1.5)+f*.6+e*1.5+sw)*(1.+uF),1.);}'});}
const HEX=hexTex();
function wellMesh(p){const m=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.MeshBasicMaterial({color:C(.9,.3,2.4),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false}));m.position.copy(p);m.position.y+=1;scene.add(m);return m;}
function ringMesh(p,r,c){const m=new THREE.Mesh(new THREE.PlaneGeometry(r*2,r*2),new THREE.MeshBasicMaterial({map:RING,color:c,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.copy(p);m.position.y+=.06;scene.add(m);return m;}
const RING=ringTex();
const ABIL={
 barrier(f){if(f.barrier)breakShield(f.barrier);const n=flatDir(f),right=new V(-n.z,0,n.x);const c=f.pos.clone().addScaledVector(n,2.2);c.y=f.pos.y-.05;
  const mesh=new THREE.Mesh(new THREE.PlaneGeometry(5,3.1,1,1),hexMat(f.team));mesh.position.copy(c).setY(c.y+1.55);mesh.rotation.y=f.yaw;scene.add(mesh);
  const b={team:f.team,owner:f,c,n,right,w:5,h:3.1,hp:900,max:900,t:9,mesh,flash:0};f.barrier=b;G.barriers.push(b);snd.play('barrier',c);return true;},
 charge(f){f.dash={dir:flatDir(f),v:16,t:.75,hit:new Set()};snd.play('charge',f.pos);return true;},
 slam(f){const fw=flatDir(f);f.vel.set(fw.x*5,9.5,fw.z*5);f.onGround=false;f.slam=.001;f.ultOn=1.5;snd.play('leap',f.pos);return true;},
 dome(f){const c=f.pos.clone();c.y+=.3;const mesh=new THREE.Mesh(new THREE.SphereGeometry(5,40,24),hexMat(f.team,.25));mesh.position.copy(c);scene.add(mesh);G.domes.push({team:f.team,owner:f,c,r:5,hp:800,max:800,t:4,mesh,flash:0});snd.play('dome',c);return true;},
 leap(f){const fw=flatDir(f);f.vel.set(fw.x*11,10.5,fw.z*11);f.onGround=false;snd.play('leap',f.pos);parts.burst(tv.copy(f.pos),24,5,C(1.6,1.6,1.8),.2,.4,{up:true,grav:4});return true;},
 well(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.08,new V());spawnBolt(f,eye.addScaledVector(fw,.9),fw,'well');f.ultOn=3;return true;},
 blink(f){const i=f.inp;let dx=-Math.sin(f.yaw)*i.fwd+Math.cos(f.yaw)*i.side,dz=-Math.cos(f.yaw)*i.fwd-Math.sin(f.yaw)*i.side;if(Math.hypot(dx,dz)<.2){const fw=flatDir(f);dx=fw.x;dz=fw.z;}if(f.ai&&f.ai.escape>0&&f.ai.target){dx=f.pos.x-f.ai.target.pos.x;dz=f.pos.z-f.ai.target.pos.z;}
  const l=Math.hypot(dx,dz);dx/=l;dz/=l;let bx=f.pos.x,bz=f.pos.z,by=f.pos.y;for(let s=.5;s<=8;s+=.5){const x=f.pos.x+dx*s,z=f.pos.z+dz*s;const g=G.W.groundBelow(x,by+.6,z,.2);const y=g>by-3?Math.max(g,by-.0):by;if(!G.W.free(x,y+.05,z,f.r,f.h))break;bx=x;bz=z;by=g>-1e8?Math.max(g,y):y;}
  parts.burst(tv.copy(f.pos).setY(f.pos.y+1),30,4,[C(.6,2,3.4),C(2,2.6,3)],.14,.4,{});beams.beam(tv.copy(f.pos).setY(f.pos.y+1),tv2.set(bx,by+1,bz),[.6,1.8,3],.12,.3);f.pos.set(bx,by,bz);f.vel.multiplyScalar(.5);snd.play('blink',f.pos);if(f===G.me){hud.flash(.25);G.snapCam=true;}return true;},
 shock(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.12,new V());spawnBolt(f,eye.addScaledVector(fw,.6),fw,'shock');snd.play('throw',f.pos);return true;},
 volley(f){f.volley={n:10,t:0};f.ultOn=1;return true;},
 hook(f){const fw=flatDir(f);f.vel.set(fw.x*4,14.5,fw.z*4);f.onGround=false;snd.play('hook',f.pos);beams.beam(tv.copy(f.pos).setY(f.pos.y+1.4),tv2.copy(f.pos).setY(f.pos.y+9).addScaledVector(fw,2),[2,.6,2.6],.03,.5);return true;},
 scan(f){const p=aimPoint(f,45);G.zones.push({kind:'scan',team:f.team,owner:f,p,t:.9,mesh:ringMesh(p,1,C(2.4,.5,2.4))});for(const o of G.fighters)if(o.alive&&G.enemy(f,o)&&o.pos.distanceTo(p)<14){o.revealT=6;o.revealTeam=f.team;}snd.play('scan',p);return true;},
 mark(f){f.markT=8;f.ultOn=8;for(const o of G.fighters)if(G.enemy(f,o)){o.revealT=8;o.revealTeam=f.team;}snd.play('mark',f===G.me?null:f.pos);return true;},
 jet(f){const fw=flatDir(f);f.vel.set(fw.x*7.5,11.5,fw.z*7.5);f.onGround=false;explodeFx(f.pos,C(3,1.4,.3));snd.play('boom',f.pos,.5);return true;},
 firewall(f){const n=flatDir(f);const c=f.pos.clone().addScaledVector(n,6);const g=G.W.groundBelow(c.x,f.pos.y+1.5,c.z,.2);c.y=g>-1e8?g:f.pos.y;const r=new V(-n.z,0,n.x);G.zones.push({kind:'fire',team:f.team,owner:f,p:c,a:c.clone().addScaledVector(r,-4.5),b:c.clone().addScaledVector(r,4.5),t:5,tick:0});snd.play('fire',c);return true;},
 meteor(f){const p=aimPoint(f,42);G.strikes.push({p,t:1.25,owner:f,team:f.team,mesh:ringMesh(p,6.5,C(3,1,.3)),rock:null});snd.play('meteorWarn',p);f.ultOn=1.3;return true;},
 gdash(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch,new V());let best=null,bs=-1;for(const o of G.fighters){if(o===f||!o.alive||G.enemy(f,o))continue;const c=tv.copy(o.pos).setY(o.pos.y+1);const d=c.distanceTo(eye);if(d>25||d<2)continue;const dot=tv2.subVectors(c,eye).normalize().dot(fw);if(dot<.86||!G.W.los(eye,c))continue;if(dot>bs){bs=dot;best=o;}}
  if(!best)return false;f.fly={target:best};f.flyT=1.3;f.onGround=false;snd.play('gdash',f.pos);return true;},
 sanct(f){const p=f.pos.clone();G.zones.push({kind:'sanct',team:f.team,owner:f,p,t:5,mesh:ringMesh(p,5,C(2.4,2,.8))});snd.play('sanct',p);return true;},
 revive(f){let n=0;for(const o of G.fighters){if(o.team!==f.team)continue;if(!o.alive&&G.time-o.deathT<10){const keep=o.deathPos.clone();spawn(o);o.pos.copy(keep);o.invulnT=1.5;o.respawnT=0;n++;parts.burst(tv.copy(o.pos).setY(o.pos.y+1),60,6,[C(3,2.6,1.4),C(3,3,3)],.2,.8,{up:true,grav:-3});}
   else if(o.alive&&o.pos.distanceTo(f.pos)<15){heal(o,o.maxHp,f);o.invulnT=Math.max(o.invulnT,1);}}
  f.ultOn=.6;shocks.fire(f.pos.clone().setY(f.pos.y+1),C(1.6,1.4,.6),15,.8);snd.play('revive',f.pos);if(n&&f.team===G.me?.team)hud.banner('SECOND DAWN',n+' ALLY'+(n>1?'S':'')+' REVIVED','#fff1c2',1.8);return true;},
 tempo(f){for(const o of G.fighters)if(o.alive&&!G.enemy(f,o)&&o.pos.distanceTo(f.pos)<10){o.speedT=4;}shocks.fire(f.pos.clone().setY(f.pos.y+1),C(.4,2,1.4),10,.5);snd.play('tempo',f.pos);return true;},
 bionade(f){const eye=eyeOf(f,new V()),fw=dirOf(f.yaw,f.pitch+.1,new V());spawnBolt(f,eye.addScaledVector(fw,.6),fw,'bio');snd.play('throw',f.pos);return true;},
 amp(f){for(const o of G.fighters)if(o.alive&&!G.enemy(f,o)&&o.pos.distanceTo(f.pos)<15)o.ampT=6;f.ultOn=6;shocks.fire(f.pos.clone().setY(f.pos.y+1),C(2.4,1.8,.4),15,.6);snd.play('amp',f.pos);return true;}};
function explodeFx(p,c){parts.burst(tv.copy(p).setY(p.y+.3),40,7,[c,C(3,2.6,2)],.25,.5,{grav:4});for(let k=0;k<6;k++)smoke.emit(p.x+rnd(1)-.5,p.y+.3,p.z+rnd(1)-.5,rnd(2)-1,rnd(1),rnd(2)-1,.3,.28,.3,1,1.4,-.3,1.2);}
function useAbility(f,slot){const H=f.H,def=H[slot];if(f.dash||f.fly)return;
 if(slot==='ult'){if(f.ult<H.ult.cost||f.ultOn>0)return;}else if(f.cd[slot]>0){if(f===G.me&&f.cdBeepT!==Math.ceil(G.time*3)){f.cdBeepT=Math.ceil(G.time*3);snd.play('abilityCd');}return;}
 if(!ABIL[def.id](f))return;f.model.st.cast=1;if(f===G.me)VM.cast();
 if(slot==='ult'){f.ult=0;f.stats.ults++;if(f===G.me){hud.banner(H.ult.name,'','#ffd23f',1.4);}else{const ally=f.team===(G.me?G.me.team:0);if(!G.attract)hud.sys(`${ally?'▲':'▼'} ${f.name} · ${H.ult.name}`,ally?TEAMS[f.team].css:'#ff6a5a');}}
 else f.cd[slot]=def.cd;}
function slamLand(f){f.slam=0;const p=f.pos.clone();shocks.fire(p.clone().setY(p.y+.4),C(2.4,1.6,.6),8,.5);explodeFx(p,C(3,2,.8));snd.play('slam',p);decals.add(p.clone().setY(p.y+.02),UP,6);
 for(let i=0;i<14;i++){const a=i/14*Math.PI*2;parts.burst(tv.set(p.x+Math.cos(a)*3,p.y+.2,p.z+Math.sin(a)*3),6,6,[C(2.6,1.8,.8),C(1,.8,.6)],.25,.6,{up:true,grav:12});}
 const mePos=G.me&&G.me.alive?G.me.pos:cam.position;if(mePos.distanceTo(p)<20)G.shake=Math.max(G.shake,.8);
 for(const o of G.fighters){if(!o.alive||!G.enemy(f,o))continue;const d=Math.hypot(o.pos.x-p.x,o.pos.z-p.z);if(d>8||Math.abs(o.pos.y-p.y)>3)continue;damage(o,140*dmgMult(f),f,{weapon:'slam',point:o.pos.clone().setY(o.pos.y+1),splash:true});if(o.alive){o.stunT=1.6;snd.play('stun',o.pos);}}}
function clearAbilityObjs(){for(const b of G.barriers)scene.remove(b.mesh);for(const m of G.domes)scene.remove(m.mesh);for(const z of G.zones)if(z.mesh)scene.remove(z.mesh);for(const s of G.strikes){scene.remove(s.mesh);if(s.rock)scene.remove(s.rock);}G.barriers=[];G.domes=[];G.zones=[];G.strikes=[];}
const rockGeo=new THREE.IcosahedronGeometry(1.2,1),rockMat=new THREE.MeshBasicMaterial({color:C(3.4,1.4,.3)});
function updateAbilityObjs(dt){
 for(let i=G.barriers.length-1;i>=0;i--){const b=G.barriers[i];b.t-=dt;b.flash=Math.max(0,b.flash-dt*4);const U=b.mesh.material.uniforms;U.uF.value=b.flash;U.uT.value=G.time;U.uA.value=.4+.6*b.hp/b.max;if(b.t<=0||!b.owner.alive)breakShield(b);if(b.dead){G.barriers.splice(i,1);}}
 for(let i=G.domes.length-1;i>=0;i--){const m=G.domes[i];m.t-=dt;m.flash=Math.max(0,m.flash-dt*4);const U=m.mesh.material.uniforms;U.uF.value=m.flash;U.uT.value=G.time;if(m.t<=0)breakShield(m);if(m.dead)G.domes.splice(i,1);}
 for(let i=G.zones.length-1;i>=0;i--){const z=G.zones[i];z.t-=dt;
  if(z.kind==='fire'){for(let k=0;k<3;k++){const q=Math.random();parts.emit(z.a.x+(z.b.x-z.a.x)*q+rnd(.3)-.15,z.p.y+.1,z.a.z+(z.b.z-z.a.z)*q+rnd(.3)-.15,rnd(.6)-.3,2+rnd(2.5),rnd(.6)-.3,3,1.2+rnd(.6),.2,.3,.5,-1.5,1);}if(Math.random()<dt*12){const q=Math.random();smoke.emit(z.a.x+(z.b.x-z.a.x)*q,z.p.y+1.2,z.a.z+(z.b.z-z.a.z)*q,0,1.5,0,.2,.18,.18,.8,1.6,-.4,1);}
   for(const o of G.fighters){if(!o.alive||!G.enemy(z.owner,o))continue;const ab=tv.subVectors(z.b,z.a),ap=tv2.subVectors(o.pos,z.a);const k=cl(ap.dot(ab)/ab.lengthSq(),0,1);const dx=o.pos.x-(z.a.x+ab.x*k),dz=o.pos.z-(z.a.z+ab.z*k);if(dx*dx+dz*dz<1.1&&Math.abs(o.pos.y-z.p.y)<2){damage(o,45*dt*dmgMult(z.owner),z.owner,{weapon:'fire',quiet:true});o.burnT=.5;}}}
  else if(z.kind==='sanct'){z.mesh.material.opacity=Math.min(1,z.t);z.mesh.rotation.z+=dt*.5;if(Math.random()<dt*14)parts.emit(z.p.x+rnd(9)-4.5,z.p.y+.2,z.p.z+rnd(9)-4.5,0,1.5,0,2.4,2,.8,.12,.9,-1);for(const o of G.fighters)if(o.alive&&!G.enemy(z.owner,o)&&o.pos.distanceTo(z.p)<5)heal(o,45*dt,z.owner);}
  else if(z.kind==='scan'){const k=1-z.t/.9;z.mesh.scale.setScalar(1+k*13);z.mesh.material.opacity=1-k;}
  else if(z.kind==='well'){z.mesh.scale.setScalar(1+Math.sin(G.time*20)*.08+(2.5-z.t)*.2);for(let k=0;k<6;k++){const a=Math.random()*6.28,r=4+rnd(4);parts.emit(z.p.x+Math.cos(a)*r,z.p.y+1+rnd(2)-1,z.p.z+Math.sin(a)*r,-Math.cos(a)*r*1.5,0,-Math.sin(a)*r*1.5,1.4,.5,3,.18,.5);}
   for(const o of G.fighters){if(!o.alive||!G.enemy(z.owner,o))continue;tv.subVectors(z.p,o.pos);tv.y+=.5;const d=tv.length();if(d>9||d<.6)continue;tv.normalize();o.vel.addScaledVector(tv,dt*38);o.vel.multiplyScalar(Math.exp(-dt*3));if(o.vel.y>0)o.onGround=false;}
   if(z.t<=0){explode(z.p.clone().setY(z.p.y+1),z.owner,110*dmgMult(z.owner),6,2,'well');}}
  if(z.t<=0){if(z.mesh)scene.remove(z.mesh);G.zones.splice(i,1);}}
 for(let i=G.strikes.length-1;i>=0;i--){const s=G.strikes[i];s.t-=dt;s.mesh.rotation.z+=dt*2;s.mesh.material.opacity=.5+Math.sin(G.time*16)*.3;
  if(s.t<.7&&!s.rock){s.rock=new THREE.Mesh(rockGeo,rockMat);scene.add(s.rock);}if(s.rock){const k=1-s.t/.7;s.rock.position.set(s.p.x+(1-k)*18,s.p.y+(1-k)*55,s.p.z+(1-k)*8);for(let q=0;q<4;q++)parts.emit(s.rock.position.x+rnd(1)-.5,s.rock.position.y+rnd(1)-.5,s.rock.position.z+rnd(1)-.5,rnd(2)-1,rnd(2),rnd(2)-1,3,1.2,.3,.6,.5);}
  if(s.t<=0){scene.remove(s.mesh);if(s.rock)scene.remove(s.rock);explode(s.p.clone().setY(s.p.y+.6),s.owner,260*dmgMult(s.owner),6.5,9,'meteor');G.strikes.splice(i,1);}}}

/* ================= objectives ================= */
function stepObjective(dt){if(G.mode==='payload')stepPayload(dt);else stepControl(dt);}
function stepPayload(dt){const P=G.pl;let att=0,def=0;for(const f of G.fighters){if(!f.alive)continue;if(Math.hypot(f.pos.x-P.pos.x,f.pos.z-P.pos.z)<PL_R&&Math.abs(f.pos.y-P.pos.y)<2.5){if(f.team===G.attTeam)att++;else def++;}}
 P.att=att;P.def=def;P.contested=att>0&&def>0;P.back=false;const live=G.phase==='play';
 if(live&&att>0&&def===0){P.s+=1.65*[1,1.15,1.3][Math.min(att,3)-1]*dt;P.idleT=0;}else if(att>0)P.idleT=0;else if(live){P.idleT+=dt;if(P.idleT>7){const floor=P.cpIdx>0?G.D.cps[P.cpIdx-1]:0;if(P.s>floor){P.s=Math.max(floor,P.s-.55*dt);P.back=true;}}}
 if(live&&P.cpIdx<G.D.cps.length&&P.s>=G.D.cps[P.cpIdx]){P.cpIdx++;G.stage=P.cpIdx;G.clock+=G.clock<60?100:90;snd.play('cp');const mine=G.me&&G.me.team===G.attTeam;hud.banner('CHECKPOINT REACHED',mine?'+TIME · SPAWN MOVED FORWARD':'DEFENDERS FALL BACK','#ffd23f',2.4);ann('checkpoint reached');G.ot=false;}
 if(live&&P.s>=P.total){P.s=P.total;endMatch(G.attTeam);}
 const a=routeAt(P.s);P.pos.copy(a.pos);const yaw=Math.atan2(a.dir.x,a.dir.z);P.yaw=P.yaw===undefined?yaw:P.yaw+wrapA(yaw-P.yaw)*Math.min(1,dt*3);
 plMesh.position.copy(P.pos);plMesh.rotation.y=P.yaw;const U=plMesh.userData;const col=P.contested?C(2.6,2,.3):att>0?teamGlow(G.attTeam):C(1.6,1.6,1.8);U.U.uC.value.lerp(col,Math.min(1,dt*6));U.U.uT.value=G.time;U.ring.rotation.x=G.time*1.3;U.ring.rotation.y=G.time*.7;U.ring.material.color.copy(U.U.uC.value);U.zone.material.color.copy(U.U.uC.value).multiplyScalar(.6);U.light.color.copy(U.U.uC.value).multiplyScalar(.4);
 if(G.S)G.S.track.userData.U.uS.value=P.s;if(G.S)G.S.track.userData.U.uA.value.copy(teamGlow(G.attTeam));snd.cart(live&&att>0&&def===0?Math.min(att,3):0);
 // overtime
 if(live&&G.clock<=0){if(!G.ot&&att>0){G.ot=true;G.otT=0;G.otFuse=3;snd.play('overtime');hud.banner('OVERTIME','','#ff5a3a',1.6);ann('overtime');}
  if(G.ot){G.otT+=dt;if(att>0)G.otFuse=Math.max(G.otFuse,Math.max(.8,3-G.otT*.04));else G.otFuse-=dt;if(G.otFuse<=0||G.otT>75)endMatch(1-G.attTeam);}else endMatch(1-G.attTeam);}}
function stepControl(dt){const Cp=G.cpt,live=G.phase==='play';const n=[0,0];for(const f of G.fighters)if(f.alive&&G.onObjective(f))n[f.team]++;Cp.n=n;Cp.contested=n[0]>0&&n[1]>0;
 if(live&&Cp.locked>0){Cp.locked-=dt;if(Cp.locked<=0){snd.play('cp');hud.banner('POINT UNLOCKED','','#ffd23f',1.6);ann('the objective is now unlocked');}}
 else if(live){const solo=n[0]>0&&!n[1]?0:n[1]>0&&!n[0]?1:-1;
  if(solo>=0&&solo!==Cp.owner){if(Cp.capT!==solo){Cp.capT=solo;Cp.prog=0;}Cp.prog+=dt/7*(1+.25*(Math.min(n[solo],3)-1));if(Cp.prog>=1){Cp.owner=solo;Cp.prog=0;Cp.capT=-1;snd.play('cp');const mine=G.me&&solo===G.me.team;hud.banner(mine?'POINT CAPTURED':'POINT LOST','',mine?TEAMS[solo].css:'#ff5a3a',1.6);ann(mine?'we have taken the objective':'we have lost the objective');}}
  else if(solo<0&&!Cp.contested&&Cp.capT>=0){Cp.prog=Math.max(0,Cp.prog-dt/7);if(Cp.prog<=0)Cp.capT=-1;}
  if(Cp.owner>=0){const o=Cp.owner;Cp.pct[o]=Math.min(Cp.contested||n[1-o]>0?99:100,Cp.pct[o]+dt*1.15);if(Cp.pct[o]>=100)endMatch(o);}
  if(G.clock<=0&&G.phase==='play'){const lead=Cp.pct[0]===Cp.pct[1]?-1:Cp.pct[0]>Cp.pct[1]?0:1;const chasing=lead<0?n[0]+n[1]>0:n[1-lead]>0;
   if(chasing&&!G.ot){G.ot=true;G.otT=0;G.otFuse=3;snd.play('overtime');hud.banner('OVERTIME','','#ff5a3a',1.6);ann('overtime');}
   if(G.ot){G.otT+=dt;if(chasing)G.otFuse=3;else G.otFuse-=dt;if(G.otFuse<=0||G.otT>60)endMatch(lead<0?(Cp.owner>=0?Cp.owner:-1):lead);}else endMatch(lead);}}
 const U=cpMesh.userData;const col=Cp.contested?C(2.6,2,.3):Cp.owner>=0?teamGlow(Cp.owner):Cp.locked>0?C(.8,.8,.9):C(1.4,1.4,1.5);U.U.uC.value.lerp(col,Math.min(1,dt*6));U.U.uT.value=G.time;U.ring.material.color.copy(U.U.uC.value);U.ring.rotation.z+=dt*.3;}

/* ================= match flow ================= */
function makeComp(team,pHero){const need={tank:1,damage:2,support:2};const out=[];if(pHero){need[HEROES[pHero].role]--;out.push(pHero);}
 for(const role of['tank','damage','support']){const pool=ORDER.filter(id=>HEROES[id].role===role&&!out.includes(id)).sort(()=>Math.random()-.5);for(let i=0;i<need[role];i++)out.push(pool[i%pool.length]);}return out;}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(G.opt,o);saveOpt();snd.init();snd.setVol(G.opt.vol);snd.setMusic(G.opt.mus);snd.annOn=!!G.opt.ann;
 G.attract=false;G.app='play';setupMatch(G.opt.mode,G.opt.map,G.opt.diff,true,G.opt.hero);
 for(const id of['menu','select','keys','over','pause'])$(id).hidden=true;$('hud').hidden=false;document.body.classList.add('playing');hud.reset();$('lock').hidden=false;lock();snd.music(G.opt.mus>0,0);
 ann(G.mode==='payload'?(G.attTeam===G.me.team?'attack. escort the payload':'defend. stop the payload'):'control. capture the objective');}
function setupMatch(modeKey,mapI,diff,human,pHero){const M=MODES[modeKey]||MODES.attack;G.modeKey=modeKey;G.mode=M.mode;G.modeName=M.n;clearFighters();loadMap(mapI);clearAbilityObjs();
 G.attTeam=M.mode==='payload'?(M.side==='defend'?1:0):0;G.stage=0;G.time=0;G.ot=false;G.otT=0;G.otFuse=0;G.winner=-1;G.results=null;G.noise=null;G.timeScale=1;G.endT=0;G.annQ=[];G.ann60=G.ann30=false;
 if(G.mode==='payload'){G.pl={s:0,total:G.D.total,cpIdx:0,pos:G.D.route[0].clone(),att:0,def:0,contested:false,idleT:0,back:false};G.cpt=null;G.clock=human?210:180;plMesh.visible=true;cpMesh.visible=false;}
 else{G.pl=null;G.cpt={p:G.D.point.p.clone(),r:G.D.point.r,owner:-1,capT:-1,prog:0,pct:[0,0],locked:human?CP_LOCK:0,contested:false,n:[0,0]};G.clock=300;plMesh.visible=false;cpMesh.visible=true;cpMesh.position.copy(G.cpt.p);cpMesh.userData.cyl.scale.set(G.cpt.r,3,G.cpt.r);cpMesh.userData.ring.scale.setScalar(G.cpt.r);}
 if(G.S)G.S.track.visible=G.mode==='payload';
 const names=CALLSIGNS.slice().sort(()=>Math.random()-.5);
 for(const team of[0,1]){const comp=makeComp(team,human&&team===0?pHero:null);comp.forEach((h,i)=>{const isMe=human&&team===0&&i===0;const f=makeFighter(isMe?(userName()||'YOU').toUpperCase().slice(0,12):names.pop(),team,h,isMe,human&&team===0?Math.max(1,diff):diff);if(isMe)G.me=f;});}
 if(!human)G.me=null;for(const f of G.fighters)spawn(f);
 G.phase=human?'countdown':'play';G.cdT=5;G.goT=0;G.lastBeep=6;if(G.me){VM.set(G.me.H.wpn,G.me.H.look,teamGlow(0));G.snapCam=true;}}
function attractMode(){G.app='menu';G.attract=true;setupMatch(G.opt.mode==='control'?'control':'attack',G.opt.map,2,false);$('menu').hidden=$('keys').hidden=false;for(const id of['over','pause','hud','select','lock'])$(id).hidden=true;document.body.classList.remove('playing');snd.music(false);snd.beam(false);snd.cart(0);showBest();}
function toMenu(){unlock();attractMode();}
function endMatch(winTeam){if(G.phase==='end'||G.attract)return;G.phase='end';G.endT=0;G.winner=winTeam;snd.play('horn');snd.beam(false);snd.cart(0);const won=G.me&&winTeam===G.me.team;
 hud.banner(winTeam<0?'DRAW':won?'VICTORY':'DEFEAT',G.mode==='payload'?(winTeam===G.attTeam?'THE CARGO CORE WAS DELIVERED':'THE CARGO CORE WAS STOPPED'):'',won?'#ffd23f':'#ff5a3a',3);ann(winTeam<0?'draw':won?'victory':'defeat');snd.music(false);}
function showOver(){G.app='over';unlock();snd.beam(false);if(G.me&&G.me.alive)G.me.model.root.visible=true;$('hud').hidden=true;$('lock').hidden=true;document.body.classList.remove('playing');const me=G.me,won=G.winner===me.team,draw=G.winner<0;
 $('oeye').textContent=`${G.modeName} · ${G.mapDef.name} · ${BOTDIFF[G.opt.diff].n} BOTS · AS ${me.H.name}`;$('ores').textContent=draw?'DRAW':won?'VICTORY':'DEFEAT';$('ores').style.color=draw?'#fff':won?'#ffd23f':'#ff5a3a';
 let sub='';if(G.mode==='payload'){const pct=Math.round(G.pl.s/G.pl.total*100);sub=G.winner===G.attTeam?`CARGO CORE DELIVERED · ${fmt(G.time)} PLAYED`:`CORE STOPPED AT ${pct}% · CHECKPOINTS ${G.pl.cpIdx}/${G.D.cps.length}`;}else sub=`${TEAMS[me.team].n} ${Math.floor(G.cpt.pct[me.team])}% — ${Math.floor(G.cpt.pct[1-me.team])}% ${TEAMS[1-me.team].n}`;$('ofs').textContent=sub;
 const top=(k,lab,c)=>{const f=G.fighters.slice().sort((a,b)=>b.stats[k]-a.stats[k])[0];return f.stats[k]>0?`<div class="acc" style="--c:${TEAMS[f.team].css}"><img src="${G.portraits[f.hero]}"><div><i>${lab}</i><b>${f.name}</b><span>${Math.round(f.stats[k])} ${c}</span></div></div>`:'';};
 $('accol').innerHTML=top('elims','MOST ELIMINATIONS','ELIMS')+top('dmg','MOST DAMAGE','DMG')+top('heal','MOST HEALING','HEAL')+top('mit','MOST MITIGATED','BLOCKED');
 const rows=t=>G.fighters.filter(f=>f.team===t).map(f=>`<tr class="${f===me?'me ':''}t${t}"><td><img src="${G.portraits[f.hero]}">${f.H.name}</td><td>${f.name}</td><td>${f.stats.elims}</td><td>${f.stats.assists}</td><td>${f.stats.deaths}</td><td>${Math.round(f.stats.dmg)}</td><td>${Math.round(f.stats.heal)}</td><td>${Math.round(f.stats.mit)}</td><td>${Math.floor(f.stats.obj)}s</td><td>${f.stats.ults}</td></tr>`).join('');
 const head='<tr><th>HERO</th><th>PLAYER</th><th>ELIMS</th><th>ASSISTS</th><th>DEATHS</th><th>DAMAGE</th><th>HEALING</th><th>MITIGATED</th><th>OBJ TIME</th><th>ULTS</th></tr>';
 $('stats').innerHTML=`<tbody><tr class="cap"><td colspan="10" style="color:${TEAMS[me.team].css}">${TEAMS[me.team].n}${G.mode==='payload'?(me.team===G.attTeam?' · ATTACK':' · DEFENCE'):''}</td></tr>${head}${rows(me.team)}<tr class="cap"><td colspan="10" style="color:${TEAMS[1-me.team].css}">${TEAMS[1-me.team].n}</td></tr>${head}${rows(1-me.team)}</tbody>`;
 const tok=award(me,won);$('otok').textContent=`+${tok} TOKENS · ${lastAward.pts} PTS · BEST ${bestScore('zenith')} PTS`;$('over').hidden=false;G.results={won,draw,winner:G.winner,stats:{...me.stats},pts:lastAward.pts,hero:me.hero};}
let lastAward=null;
function award(me,won){const s=me.stats;const pts=Math.max(0,Math.round(s.elims*100+s.assists*40+s.dmg/10+s.heal/10+s.mit/20+s.obj*5-s.deaths*20+(won?500:0)));
 lastAward={pts,won,elims:s.elims,deaths:s.deaths,dmg:Math.round(s.dmg),heal:Math.round(s.heal),hero:me.H.name,mode:G.modeName,map:G.mapDef.name,diff:BOTDIFF[G.opt.diff].n.toLowerCase()};
 const tok=5+Math.min(60,pts/50|0);addRound(tok,won);saveBest('zenith',pts);return tok;}
function showBest(){seg.sync();const b=bestScore('zenith');$('best').textContent=b?`YOUR BEST · ${b} PTS`:'';$('mapdesc').textContent=MAPS[G.opt.map].sub+' — '+MAPS[G.opt.map].desc;}

/* ================= game loop ================= */
function stepMatch(dt){
 if(G.phase==='countdown'){G.cdT-=dt;const n=Math.ceil(G.cdT);if(n!==G.lastBeep&&n>0&&n<=3){G.lastBeep=n;snd.play('beep',null,1,0);}if(G.cdT<=0){G.phase='play';G.goT=1.2;snd.play('beep',null,1,1);}}
 else if(G.phase==='play'){G.goT-=dt;if(!G.attract){G.clock=Math.max(0,G.clock-dt);if(G.clock<=60&&!G.ann60){G.ann60=true;ann('one minute remaining');snd.music(G.opt.mus>0,.8);}if(G.clock<=30&&!G.ann30){G.ann30=true;ann('thirty seconds');}}}
 else if(G.phase==='end'){G.endT+=dt;G.timeScale=G.endT<1.4?.35:1;if(G.endT>3.4){G.timeScale=1;showOver();}}
 if(G.attract&&G.mode==='payload'&&G.pl.s>=G.pl.total-1){G.pl.s=0;G.pl.cpIdx=0;G.stage=0;}
 stepObjective(dt);}
let annT=0;function ann(t){if(G.attract)return;G.annQ.push(t);}function stepAnn(dt){annT-=dt;if(annT<=0&&G.annQ.length){snd.announce(G.annQ.shift());annT=1.2;}}
function step(dt){dt=Math.min(dt,.05);if(G.app==='paused'){visuals(0);return;}
 if(G.app==='over'){G.time+=dt;visuals(dt);return;}
 const sdt=dt*G.timeScale;G.time+=sdt;readInput(dt);
 if(G.app==='play'||G.app==='menu'||G.app==='select'){stepMatch(sdt);
  for(const f of G.fighters){if(f.ai&&f.alive&&(G.phase==='play'||G.attract)&&!G.botsFrozen)think(f,G,sdt);else if(f.ai)Object.assign(f.inp,blankInput());}
  for(const f of G.fighters)stepFighter(f,sdt);updateProj(sdt);updateAbilityObjs(sdt);}
 stepAnn(dt);visuals(sdt);}

/* ================= visuals: camera, viewmodel, fx ================= */
let orbitT=0;const camPos=new V();let showHero=null,showModel=null;
function visuals(dt){parts.update(dt);smoke.update(dt);beams.update(dt);shocks.update(dt);decals.update(dt);lights.update(dt);if(G.S)G.S.update(G.time);if(cpMesh&&cpMesh.visible)cpMesh.userData.U.uT.value=G.time;
 const me=G.me;for(const f of G.fighters){if(f===G.me&&f.alive&&G.app!=='over')continue;f.model.vis=true;if(f.alive||f.model.dead)f.model.pose(f,dt,G.time);f.model.reveal(f.alive&&!!me&&G.app==='play'&&G.revealedTo(f,me.team),G.time);}
 G.shake=Math.max(0,G.shake-dt*2.4);G.hurtFx=Math.max(0,G.hurtFx-dt*.9);const aspect=innerWidth/innerHeight;
 if((G.app==='play'||G.app==='paused')&&me){
  if(me.alive){me.landDip=Math.max(0,me.landDip-dt*1.4);const sp=Math.hypot(me.vel.x,me.vel.z);const bob=me.onGround?Math.sin(G.time*sp*1.6)*Math.min(1,sp/6)*.025:0;const eyeT=PHY.eye*(me.H.look.height||1);
   cam.position.set(me.pos.x,me.pos.y+eyeT-me.landDip+bob,me.pos.z);const s=G.shake*G.shake*.05;const strafe=(me.vel.x*Math.cos(me.yaw)-me.vel.z*Math.sin(me.yaw));me.roll=damp(me.roll||0,cl(-strafe*.004,-.03,.03),8,dt);
   cam.rotation.set(me.pitch+me.recoil+(Math.random()-.5)*s,me.yaw+(Math.random()-.5)*s,me.roll);const d=WPN[me.H.wpn];
   const hf=G.opt.fov+(me.speedT>0?5:0)+(me.dash||me.fly?8:0);const vf=2*Math.atan(Math.tan(hf*Math.PI/360)/aspect)*180/Math.PI;const zf=d.zoom?1+(d.zoom-1)*me.zoom:1;cam.fov=G.snapCam?vf:damp(cam.fov,2*Math.atan(Math.tan(vf*Math.PI/360)/zf)*180/Math.PI,18,dt);G.snapCam=false;
   VM.update({dt,mdx:mouseVis.dx,mdy:mouseVis.dy,speed:sp,ground:me.onGround,air:!me.onGround,reload:me.reloadT>0?1-me.reloadT/d.reload:-1,melee:me.meleeT>0?1-me.meleeT/.35:0,zoom:me.zoom,charge:d.charge?me.chargeT/d.charge:0,scope:d.scope,beam:me.beamOn});
   VM.root.visible=VM.root.visible&&G.phase!=='end';mouseVis.dx*=.5;mouseVis.dy*=.5;}
  else{const k=me.killedBy;tv.copy(me.pos).add(tv2.set(Math.sin(me.yaw)*4,3.4,Math.cos(me.yaw)*4));camPos.lerp(tv,1-Math.exp(-dt*3));if(camPos.distanceTo(tv)>12)camPos.copy(tv);cam.position.copy(camPos);
   const tgt=k&&k.alive?tv2.copy(k.pos).setY(k.pos.y+1.2):tv2.copy(me.pos).setY(me.pos.y+.5);const m=new THREE.Matrix4().lookAt(cam.position,tgt,UP);const q=new THREE.Quaternion().setFromRotationMatrix(m);cam.quaternion.slerp(q,1-Math.exp(-dt*4));VM.root.visible=false;cam.fov=damp(cam.fov,70,4,dt);}
  snd.listener(cam.position.x,cam.position.y,cam.position.z,me.alive?me.yaw:0);
  const eye=cam.position,fw=dirOf(me.yaw,me.pitch,new V());const wt=G.W.ray(eye,fw,150);const h=me.alive?rayFighters(eye,fw,wt,me)[0]:null;G.aimTarget=h?h.f:null;G.aimFoe=!!(h&&G.enemy(me,h.f));G.aimAlly=!!(h&&!G.enemy(me,h.f));}
 else{VM.root.visible=false;orbitT+=dt;// fly along the payload route
  const D=G.D;if(D){const tot=D.total,s=(orbitT*3.2)%tot;const a=routeAt(s);const side=new V(-a.dir.z,0,a.dir.x);const p=a.pos.clone().addScaledVector(side,2.2+Math.sin(orbitT*.2)*1.2).addScaledVector(a.dir,-8);p.y=9.5+Math.sin(orbitT*.3)*1;
   if(!G.camFly||G.camFly.distanceTo(p)>30)G.camFly=p.clone();G.camFly.lerp(p,1-Math.exp(-dt*1.5));cam.position.copy(G.camFly);const look=routeAt(s+12).pos;look.y=1.2;if(!G.camLook)G.camLook=look.clone();G.camLook.lerp(look,1-Math.exp(-dt*2));cam.lookAt(G.camLook);}
  cam.fov=G.app==='over'?55:60;snd.listener(cam.position.x,cam.position.y,cam.position.z,0);}
 cam.aspect=aspect;cam.updateProjectionMatrix();
 if(G.app==='select'&&showModel){const sf={pos:new V(),vel:new V(),yaw:Math.PI+Math.sin(G.time*.5)*.5+(G.showSpin||0),pitch:0,onGround:true,meleeT:0};showModel.pose(sf,dt,G.time);G.showSpin=(G.showSpin||0)+dt*.0;showScene.userData.ring.material.color.set(HEROES[showHero].css).multiplyScalar(1.6);}
 if(msgT>0){msgT-=dt;if(msgT<=0)hud.prompt('');}
 if(G.app==='play'&&me){cam.updateMatrixWorld();hud.update(dt,cam);hud.board(keys.Tab||padBoard);}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lock'),menu:()=>G.app==='play',onLock:(on,was)=>{if(was&&!on&&G.app==='play')pause(true);},
 onKey:e=>{if(['Space','Tab','ShiftLeft','KeyQ','KeyE'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Escape'&&G.app==='paused')pause(false);
  if(G.app==='select'){const i=+e.key-1;if(i>=0&&i<ORDER.length)pickHero(ORDER[i]);if(e.code==='Enter')start();}}});
const {keys,edge,mouse,lock,unlock}=I,mouseVis={dx:0,dy:0};let padBoard=false,msgT=0;
let padPrev={};
function readInput(dt){const me=G.me;const ed=k=>edge[k];
 if(me&&G.app==='play'){const i=me.inp;const d=WPN[me.H.wpn];const sens=G.opt.sens*.0022/(1+me.zoom*((d.zoom||1)-1));
  i.fwd=(keys.KeyW||keys.ArrowUp?1:0)-(keys.KeyS||keys.ArrowDown?1:0);i.side=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);
  i.jump=!!keys.Space;i.jumpEdge=!!ed('Space');i.fire=mouse.l;i.zoom=mouse.r;i.reload=!!ed('KeyR');i.melee=!!(ed('KeyV')||ed('KeyF'));i.a1=!!(ed('ShiftLeft')||ed('ShiftRight'));i.a2=!!ed('KeyE');i.ult=!!ed('KeyQ');
  if(!me.alive){for(let k=0;k<ORDER.length;k++)if(ed('Digit'+(k+1))){me.nextHero=ORDER[k];snd.play('swap');}}
  if(I.locked&&me.alive&&me.stunT<=0){me.yaw-=mouse.dx*sens;me.pitch=cl(me.pitch-mouse.dy*sens,-1.5,1.5);}mouseVis.dx+=mouse.dx;mouseVis.dy+=mouse.dy;mouse.dx=mouse.dy=0;
  const gp=gamepad();if(gp){const a=gp.axes,b=gp.buttons,dz=deadzone,pr=padPrev;const P=n=>b[n]&&b[n].pressed;
   if(dz(a[1])||dz(a[0])){i.fwd=-dz(a[1]);i.side=dz(a[0]);}const lx=dz(a[2]||0),ly=dz(a[3]||0),zf=1+me.zoom*2;if(me.stunT<=0){me.yaw-=lx*Math.abs(lx)*3.4*G.opt.sens*dt/zf;me.pitch=cl(me.pitch-ly*Math.abs(ly)*2.6*G.opt.sens*dt/zf,-1.5,1.5);}
   if(P(0))i.jump=true;if(P(0)&&!pr[0])i.jumpEdge=true;if((b[7]?.value||0)>.3)i.fire=true;if((b[6]?.value||0)>.3)i.zoom=true;if(P(4)&&!pr[4])i.a1=true;if(P(5)&&!pr[5])i.a2=true;if(P(3)&&!pr[3])i.ult=true;if(P(2)&&!pr[2])i.reload=true;if(P(11)&&!pr[11])i.melee=true;
   if(P(9)&&!pr[9])pause(true);padBoard=!!P(8);for(let k=0;k<17;k++)pr[k]=P(k);}
  if(G.inOv)Object.assign(i,G.inOv);if(G.inOnce){Object.assign(i,G.inOnce);G.inOnce=null;}}
 else if(G.app==='paused'){const gp=gamepad();if(gp&&gp.buttons[9]?.pressed&&!padPrev[9])pause(false);if(gp)padPrev[9]=gp.buttons[9]?.pressed;}
 I.flush();}
function pause(on){if(on&&G.app==='play'){G.app='paused';$('pause').hidden=false;$('lock').hidden=true;document.body.classList.remove('playing');unlock();snd.beam(false);}
 else if(!on&&G.app==='paused'){G.app='play';$('pause').hidden=true;document.body.classList.add('playing');lock();}}

/* ================= rendering ================= */
class OverlayPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){const sel=G.app==='select'&&showModel;if(!sel&&(!VM.root.visible||G.app!=='play'&&G.app!=='paused'))return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(sel?showScene:vmScene,sel?showCam:vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.8));fxStack=null;fxSize='';for(const k in mapCache){const S=mapCache[k].S;S.sun.castShadow=q>0;S.mirror.on=q>0&&S.themeId==='neon';S.mirror.scale=q>=2?.5:.33;}R.shadowMap.needsUpdate=true;}
function render(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);if(!G.S)return;
 vmCam.aspect=w/h;vmCam.updateProjectionMatrix();showCam.aspect=w/h;showCam.setViewOffset(w,h,-w*(w>900?.2:0),h*.02,w,h);showCam.updateProjectionMatrix();
 const pr=R.getPixelRatio();const sc=h*pr/(2*Math.tan(cam.fov*Math.PI/360));parts.U.uScale.value=smoke.U.uScale.value=sc;
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<3)R.shadowMap.needsUpdate=true;
 const T=G.S.theme;if(!fxStack){fxStack=cinematic(R,scene,cam,{exposure:T.exp,bloom:T.bloom,bloomThreshold:T.thr,bloomRadius:.5,saturation:T.sat,tint:T.tint,vignette:.32,grain:.02,aoStrength:.6,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new OverlayPass(),fxStack.ao?2:1);fxSize='';}
 const key=w+'x'+h;if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade&&G.me){const m=G.me;const hp=G.app==='play'&&m.alive?Math.min(1,m.hp/m.maxHp*1.6):1;fxStack.grade.uniforms.sat.value=T.sat*(.55+.45*hp);}
 cam.updateMatrixWorld();if(G.S.mirror.on)G.S.mirror.render(R,scene,cam,w*pr,h*pr,G.S.floorMesh);
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);const sel=G.app==='select'&&showModel;if(sel||VM.root.visible&&G.app==='play'){R.autoClear=false;R.clearDepth();R.render(sel?showScene:vmScene,sel?showCam:vmCam);R.autoClear=true;}}}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= portraits (rendered once from the hero models) ================= */
function makePortraits(){const ps=new THREE.Scene();ps.environment=G.S?G.S.env:null;const k=new THREE.DirectionalLight(0xfff2e0,2.6);k.position.set(-1.5,2.5,3);const rim=new THREE.DirectionalLight(0x9fc8ff,2.4);rim.position.set(2.5,1.5,-2);ps.add(k,rim,new THREE.HemisphereLight(0xd0dcff,0x302820,1.1));
 const pc=new THREE.PerspectiveCamera(24,.8,.1,20);const W=192,H=240;const prevPR=R.getPixelRatio(),prevS=R.getSize(new THREE.Vector2());R.setPixelRatio(1);R.setSize(W,H,false);const tm=R.toneMappingExposure;R.toneMappingExposure=1.1;
 for(const id of ORDER){const h=HEROES[id],m=new Hero3D(h.look,TEAMS[0]);const g=gunModel(h.wpn);g.scale.setScalar(.85);m.setGun(g);m.pose({pos:new V(),vel:new V(),yaw:Math.PI+.45,pitch:-.05,onGround:true,meleeT:0},.016,1);ps.add(m.root);
  const hh=h.look.height||1;pc.position.set(-.35,1.55*hh,2.4);pc.lookAt(0,1.42*hh,0);ps.background=new THREE.Color(h.css).multiplyScalar(.28);R.setRenderTarget(null);R.clear();R.render(ps,pc);
  const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.drawImage(R.domElement,0,0,W,H,0,0,W,H);const gr=x.createLinearGradient(0,H*.55,0,H);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.55)');x.fillStyle=gr;x.fillRect(0,0,W,H);
  x.strokeStyle=h.css;x.globalAlpha=.9;x.lineWidth=6;x.beginPath();x.moveTo(0,H-3);x.lineTo(W,H-3);x.stroke();G.portraits[id]=c.toDataURL('image/jpeg',.88);ps.remove(m.root);}
 R.toneMappingExposure=tm;R.setPixelRatio(prevPR);R.setSize(prevS.x,prevS.y,false);fxStack=null;}

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);
seg('o-mode','mode',false,()=>{if(G.app==='menu')attractMode();});seg('o-map','map',true,()=>{if(G.app==='menu')attractMode();});seg('o-diff','diff');
seg('o-sens','sens');seg('o-fov','fov');seg('o-vol','vol',true,v=>snd.setVol(v));seg('o-mus','mus',true,v=>{snd.setMusic(v);snd.music(v>0&&G.app==='play',0);});seg('o-ann','ann',true,v=>snd.annOn=!!v);
function buildSelect(){const roles=['tank','damage','support'];$('hgrid').innerHTML=roles.map(r=>`<div class="rg"><p style="color:${ROLES[r].css}">${ROLES[r].ic} ${ROLES[r].n}</p><div>${ORDER.filter(id=>HEROES[id].role===r).map(id=>`<button class="hc" data-h="${id}" style="--c:${HEROES[id].css}"><img src="${G.portraits[id]||''}"><b>${HEROES[id].name}</b><kbd>${ORDER.indexOf(id)+1}</kbd></button>`).join('')}</div></div>`).join('');
 $('hgrid').querySelectorAll('.hc').forEach(b=>b.onclick=()=>pickHero(b.dataset.h));pickHero(G.opt.hero in HEROES?G.opt.hero:'volt');}
function pickHero(id){G.opt.hero=id;saveOpt();const h=HEROES[id],w=WPN[h.wpn];document.querySelectorAll('.hc').forEach(b=>b.classList.toggle('on',b.dataset.h===id));
 $('hinfo').style.setProperty('--c',h.css);$('hinfo').innerHTML=`<p class="role" style="color:${ROLES[h.role].css}">${ROLES[h.role].ic} ${ROLES[h.role].n} · ${h.tag.toUpperCase()}</p><h2>${h.name}</h2><p class="bio">${h.bio}</p>
  <div class="stat"><span>HEALTH <b>${h.hp}</b></span><span>SPEED <b>${h.speed.toFixed(1)}</b></span></div>
  <div class="ab"><kbd>LMB</kbd><div><b>${w.name}</b><span>${wdesc(h.wpn)}</span></div></div>
  <div class="ab"><kbd>SHIFT</kbd>${svgIcon(h.a1.id,'ic')}<div><b>${h.a1.name} <i>${h.a1.cd}s</i></b><span>${h.a1.desc}</span></div></div>
  <div class="ab"><kbd>E</kbd>${svgIcon(h.a2.id,'ic')}<div><b>${h.a2.name} <i>${h.a2.cd}s</i></b><span>${h.a2.desc}</span></div></div>
  <div class="ab ult"><kbd>Q</kbd>${svgIcon(h.ult.id,'ic')}<div><b>${h.ult.name} <i>ULTIMATE</i></b><span>${h.ult.desc}</span></div></div>`;
 if(showModel)showScene.remove(showModel.root);showHero=id;showModel=new Hero3D(h.look,TEAMS[0]);const g=gunModel(h.wpn);g.scale.setScalar(.85);showModel.setGun(g);showModel.root.visible=true;showScene.add(showModel.root);snd.play('swap');}
function wdesc(id){return{rivet:'Full-auto rivet stream. Short to mid range, 60 rounds.',scrap:'Ten-pellet scatter blast. Devastating up close.',arc:'Fast, accurate auto carbine. Headshots deal double.',longbow:'Scope (RMB) to charge up to 125 damage. Headshots ×2.5.',ember:'Arcing explosive bolts with splash. Blast-jump friendly.',beam:'Locks on: heals allies 60/s, or burns enemies 24/s.',dart:'Hitscan darts: heal allies 60, damage enemies 45.'}[id];}
function toSelect(){G.app='select';$('menu').hidden=$('keys').hidden=true;$('select').hidden=false;buildSelect();snd.init();}
$('go').onclick=toSelect;$('lockin').onclick=()=>start();$('sback').onclick=()=>{$('select').hidden=true;if(showModel){showScene.remove(showModel.root);showModel=null;}attractMode();};
$('again').onclick=()=>start();$('ohero').onclick=()=>{$('over').hidden=true;attractMode();toSelect();};$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
postButton($('post'),'zenith',()=>{const a=lastAward||{};
 return[a.pts||0,`Game: Zenith Protocol\nPoints: ${a.pts||0}\nResult: ${a.won?'win':'loss'}\nHero: ${a.hero||''} · Elims ${a.elims||0} · Deaths ${a.deaths||0} · Damage ${a.dmg||0} · Healing ${a.heal||0}\nMode: ${a.mode||''} · ${a.map||''} · ${a.diff||''} bots`];});


/* ================= boot ================= */
attractMode();try{makePortraits();}catch(e){console.warn(e);}
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.ZENITH={G,step,render,visuals:dt=>visuals(dt),start,toMenu,toSelect,pickHero,pause,endMatch,showOver,
 get state(){return G.app==='play'?G.phase:G.app;},get app(){return G.app;},get phase(){return G.phase;},get me(){return G.me;},get player(){return G.me;},get fighters(){return G.fighters;},get bots(){return G.fighters.filter(f=>f.ai);},
 get clock(){return G.clock;},setClock(s){G.clock=s;},get score(){return G.mode==='payload'?{s:G.pl.s,total:G.pl.total,cp:G.pl.cpIdx}:{pct:G.cpt.pct.slice(),owner:G.cpt.owner};},get round(){return{mode:G.mode,phase:G.phase,clock:G.clock,ot:G.ot,winner:G.winner,stage:G.stage};},
 get results(){return G.results;},get W(){return G.W;},get D(){return G.D;},get pl(){return G.pl;},get cpt(){return G.cpt;},scene,cam,R,VM,snd,setQuality:applyQuality,get gfx(){return gfx;},
 skipCountdown(){if(G.phase==='countdown')G.cdT=0;},kill(v,k=null){const vv=typeof v==='number'?G.fighters[v]:v,kk=typeof k==='number'?G.fighters[k]:k;if(vv&&vv.alive)damage(vv,9999,kk,{weapon:'arc',point:vv.pos.clone().setY(vv.pos.y+1)});},
 teleport(x,y,z,f){f=f||G.me;f.pos.set(x,y,z);f.vel.set(0,0,0);G.snapCam=true;},look(yaw,pitch=0){G.me.yaw=yaw;G.me.pitch=pitch;},
 aimAt(t){const me=G.me,e=eyeOf(me,new V()),p=t.pos.clone().setY(t.pos.y+1.2);const dx=p.x-e.x,dz=p.z-e.z;me.yaw=Math.atan2(-dx,-dz);me.pitch=Math.atan2(p.y-e.y,Math.hypot(dx,dz));},
 ability(slot,f){f=f||G.me;if(slot==='ult')f.ult=f.H.ult.cost;else f.cd[slot]=0;useAbility(f,slot);},input:o=>{G.inOv=o&&Object.keys(o).length?o:null;},press:o=>{G.inOnce=o;},freezeBots(on=true){G.botsFrozen=on;},
 nav:()=>({nodes:G.W.nodes.length,roam:G.W.roam.length,routeBlock:G.D.routeBlock}),get portraits(){return G.portraits;}};
