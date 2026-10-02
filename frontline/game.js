// FRONTLINE OPS — full 3D modern military shooter. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {makeTextures} from './tex.js';
import {MAPS} from './maps.js';
import {buildScene,makeSky,STEP,BR,makeHeli} from './world.js';
import {makeKit,Rig,hitActor} from './actors.js';
import {WEAPONS,PRIMARIES,ATT,pattern,dmgAt,buildViewmodel,applyAttachments,rankOf,rankXP,RANKS} from './guns.js';
import {FX} from './fx.js';
import {DIFF,newBrain,drive,eyeOf,chestOf,setPath} from './ai.js';
import {Sound} from './sound.js';
import {makeMode,MISSIONS} from './modes.js';
import * as HUD from './hud.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rr=(a,b)=>a+Math.random()*(b-a),ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const D2R=Math.PI/180,GRAV=16,PR=.35,EYE=1.62,CEYE=1.05,FOV=65;
const ALLY_N=['REYES','HOLT','MBEKI','STROUD','VANCE','IKEDA','NOVAK','CRUZ','LUND','FARRAH','OKORO','DANE'],FOE_N=['KESTREL','RAZOR','SABLE','VIPER','JACKAL','GRIM','HUSK','ONYX','TALON','WRAITH','BRANDO','SPECTRE','ROOK','MAKO','DUST','CINDER'];

/* ================= renderer, scenes, cameras ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(FOV,1,.05,1200);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(56,1,.01,10);
const hemi=new THREE.HemisphereLight(0xffffff,0x202020,.6),sun=new THREE.DirectionalLight(0xffffff,2);sun.castShadow=true;scene.add(hemi,sun,sun.target);
const vmHemi=new THREE.HemisphereLight(0xffffff,0x222222,.7),vmKey=new THREE.DirectionalLight(0xffffff,1.2),vmFlash=new THREE.PointLight(0xffaa55,0,3,1.5);vmKey.position.set(-1,2,1);vmFlash.position.set(.1,-.05,-.7);const vmRim=new THREE.DirectionalLight(0xffffff,1.1);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmFlash,vmRim);
const TX=makeTextures();makeKit(TX);
// neutral studio environment for viewmodel reflections
const studioEnv=(()=>{const s=new THREE.Scene();s.background=new THREE.Color(.05,.05,.06);const m=c=>new THREE.MeshBasicMaterial({color:c,side:THREE.DoubleSide});const a=new THREE.Mesh(new THREE.PlaneGeometry(8,3),m(new THREE.Color(3,3,3.2)));a.position.set(0,5,0);a.rotation.x=Math.PI/2;s.add(a);const b=new THREE.Mesh(new THREE.PlaneGeometry(3,6),m(new THREE.Color(1.2,1.1,1)));b.position.set(-5,1,2);b.rotation.y=Math.PI/2;s.add(b);const c=new THREE.Mesh(new THREE.PlaneGeometry(3,6),m(new THREE.Color(.6,.7,.9)));c.position.set(5,1,-2);c.rotation.y=-Math.PI/2;s.add(c);const pm=new THREE.PMREMGenerator(R);const t=pm.fromScene(s,.02).texture;pm.dispose();return t;})();const fx=new FX(scene,TX);const snd=new Sound();const VM=buildViewmodel(TX);vmCam.add(VM.root);vmScene.add(vmCam);
// shared grenade + streak meshes
const nadeGeo=new THREE.SphereGeometry(.05,10,8),nadeMat=new THREE.MeshStandardMaterial({color:0x4a5034,roughness:.6}),smokeMat=new THREE.MeshStandardMaterial({color:0x8a9098,roughness:.5});
const markRing=new THREE.Mesh(new THREE.RingGeometry(2.6,3,40),new THREE.MeshBasicMaterial({color:new THREE.Color(4,.3,.2),transparent:true,opacity:.8,depthWrite:false,side:THREE.DoubleSide}));markRing.rotation.x=-Math.PI/2;markRing.visible=false;scene.add(markRing);
function mkJet(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x5a6068,roughness:.4,metalness:.6});const add=(geo,x,y,z,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);g.add(o);};
 add(new THREE.CylinderGeometry(.5,.7,9,10),0,0,0,Math.PI/2);add(new THREE.ConeGeometry(.5,2.4,10),0,0,5.6,Math.PI/2);add(new THREE.BoxGeometry(9,.12,2.6),0,0,-.6);add(new THREE.BoxGeometry(3.4,.1,1.2),0,0,-4);add(new THREE.BoxGeometry(.1,1.8,1.4),0,.9,-4);
 const fl=new THREE.Mesh(new THREE.SphereGeometry(.45,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(6,3,1)}));fl.position.z=-4.7;g.add(fl);g.visible=false;scene.add(g);return g;}
const jets=[mkJet(),mkJet()];
function mkDrone(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x2a2d30,roughness:.4,metalness:.6});const body=new THREE.Mesh(new THREE.BoxGeometry(.6,.16,.6),m);g.add(body);const rot=[];
 for(const[x,z]of[[.45,.45],[-.45,.45],[.45,-.45],[-.45,-.45]]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.05,.04,.5),m);arm.position.set(x/2,0,z/2);arm.rotation.y=Math.atan2(x,z);g.add(arm);const r=new THREE.Mesh(new THREE.BoxGeometry(.5,.01,.05),m);r.position.set(x,.08,z);g.add(r);rot.push(r);}
 const gun=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.3,8),m);gun.rotation.x=Math.PI/2;gun.position.set(0,-.12,.15);g.add(gun);const led=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(5,.3,.2)}));led.position.set(0,-.05,.31);g.add(led);
 g.userData={rot,led};g.visible=false;scene.add(g);return g;}
const droneMesh=mkDrone();const uavMesh=(()=>{const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x6a6e74,roughness:.5,metalness:.4});const a=new THREE.Mesh(new THREE.CylinderGeometry(.25,.3,4,8),m);a.rotation.x=Math.PI/2;g.add(a);const w=new THREE.Mesh(new THREE.BoxGeometry(9,.08,.8),m);g.add(w);const l=new THREE.Mesh(new THREE.SphereGeometry(.15,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.3,.2)}));l.position.y=-.3;g.add(l);g.userData.l=l;g.visible=false;scene.add(g);return g;})();

/* ================= shared game context ================= */
const G={THREE,scene,cam,fx,snd,TX,level:null,actors:[],player:null,time:0,diff:DIFF[1],diffI:1,noises:[],pathBudget:4,night:false,mode:null,marks:[],app:'menu',phase:'live',over:null,nades:[],opt:null,streak:{uav:0,air:null,drone:null,euav:0},prog:null,clockScale:1};
window.__G=G;
let opt={mode:'tdm',map:'blacksite',mission:0,diff:1,sens:1,vol:.8};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_frontline_opt'))||{});}catch(e){}G.opt=opt;
let load={primary:'ar',att:{ar:{reddot:1},smg:{},sniper:{},shotgun:{}}};try{const l=JSON.parse(localStorage.getItem('pxd_frontline_load'));if(l&&WEAPONS[l.primary])load=Object.assign(load,l);}catch(e){}G.load=load;
let prog={xp:0};try{Object.assign(prog,JSON.parse(localStorage.getItem('pxd_frontline_prog'))||{});}catch(e){}G.prog=prog;
G.matchXP=0;G.xpGain=(n)=>{const r0=rankOf(prog.xp+G.matchXP);G.matchXP+=n;const r1=rankOf(prog.xp+G.matchXP);if(r1>r0){HUD.banner(G,'PROMOTED',`RANK ${r1+1} · ${RANKS[r1]}`,'#ffd23f',2.6);snd.play('rank');}};
G.saveLoad=()=>{try{localStorage.setItem('pxd_frontline_load',JSON.stringify(load));}catch(e){}};
G.saveOpt=()=>{try{localStorage.setItem('pxd_frontline_opt',JSON.stringify(opt));}catch(e){}};

/* ================= maps + lighting presets ================= */
const PRESET={night:{fog:0x101a2e,fd:.014,hs:0x6a80b8,hg:0x1c2230,hi:1.5,sc:0xb0c8f8,si:2.4,sp:[-40,60,-55],exp:1.7,sky:{top:0x03060e,mid:0x0b1426,hor:0x1a2638},tint:0xd8e0ff,sat:.92,smoke:[.045,.05,.065],vm:.55,dust:.22},
 dusk:{fog:0x8a6a62,fd:.0105,hs:0xffcfa8,hg:0x3a2c2a,hi:.8,sc:0xffa868,si:2.6,sp:[70,18,-70],exp:1.0,sky:{top:0x1c2244,mid:0x7a4c64,hor:0xf09058},tint:0xfff0e0,sat:1.05,smoke:[.2,.16,.15],vm:1,dust:.55},
 dusk2:{fog:0x46485e,fd:.012,hs:0x9aa4d8,hg:0x2a2228,hi:.7,sc:0xff9a60,si:1.7,sp:[-60,14,-70],exp:1.12,sky:{top:0x0e1636,mid:0x3e4676,hor:0xd88058},tint:0xf0f0ff,sat:1,smoke:[.11,.11,.13],vm:.85,dust:.35}};
const levels={},built={};let sky=null,curPreset=PRESET.night;
function loadMap(id){let L=levels[id];if(!L)L=levels[id]=MAPS[id]();if(G.level===L&&built[id]&&built[id].q===gfx)return L;
 if(G.level&&built[G.level.id])scene.remove(built[G.level.id].group);
 if(!built[id]||built[id].q!==gfx){if(built[id])disposeGroup(built[id].group);built[id]=buildScene(L,TX,gfx);built[id].q=gfx;}
 scene.add(built[id].group);G.level=L;const p=curPreset=PRESET[L.sky];G.night=L.sky==='night';
 scene.fog=new THREE.FogExp2(p.fog,p.fd);scene.background=new THREE.Color(p.fog);hemi.color.set(p.hs);hemi.groundColor.set(p.hg);hemi.intensity=p.hi;sun.color.set(p.sc);sun.intensity=p.si;sun.position.set(...p.sp).normalize().multiplyScalar(120);sun.target.position.set(0,0,0);
 const sc=sun.shadow.camera;Object.assign(sc,{left:-78,right:78,top:78,bottom:-78,near:10,far:300});sc.updateProjectionMatrix();sun.shadow.bias=-.0004;sun.shadow.normalBias=.035;
 if(sky)scene.remove(sky);sky=makeSky(L.sky);const U=sky.userData.U;U.uTop.value.set(p.sky.top);U.uMid.value.set(p.sky.mid);U.uHor.value.set(p.sky.hor);U.uSun.value.set(...p.sp).normalize();U.uSunC.value.set(p.sc);scene.add(sky);
 if(!envCache[L.sky]){const s=new THREE.Scene();s.add(makeSky(L.sky));const sk=s.children[0].userData.U;sk.uTop.value.set(p.sky.top);sk.uMid.value.set(p.sky.mid);sk.uHor.value.set(p.sky.hor);sk.uSun.value.set(...p.sp).normalize();sk.uSunC.value.set(p.sc);
  s.add(new THREE.HemisphereLight(p.hs,p.hg,1));const pm=new THREE.PMREMGenerator(R);envCache[L.sky]=pm.fromScene(s,.04).texture;pm.dispose();}
 scene.environment=envCache[L.sky];vmScene.environment=studioEnv;VM.root.traverse(o=>{if(o.material&&o.material.isMeshStandardMaterial)o.material.envMapIntensity=.25+.45*p.vm;});scene.environmentIntensity=L.sky==='night'?.35:.6;
 vmHemi.color.set(p.hs);vmHemi.groundColor.set(p.hg);vmHemi.intensity=1.1*p.vm+.6;vmKey.color.set(p.sc);vmKey.intensity=2.2*p.vm+.6;vmRim.color.set(p.hs);
 fx.dustK=p.dust;fx.smoke.U.uFog.value.set(p.fog);fx.smoke.U.uFogD.value=p.fd;R.toneMappingExposure=p.exp;fxStack=null;
 HUD.mapChanged(G);return L;}
const envCache={};
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}

/* ================= actors ================= */
let nid=1;
function makeActor(o){const L=G.level;let x=o.x,z=o.z;if(!o.y&&!L.free(x,z)){const c=L.nearestFree(x,z);if(c>=0){x=c%L.N-L.half+.5;z=(c/L.N|0)-L.half+.5;}}
 const w=o.weapon?WEAPONS[o.weapon]:null;const a={id:nid++,name:o.name||'?',team:o.team,isPlayer:!!o.player,vip:!!o.vip,pos:new V(x,o.y||0,z),vel:new V(),move:new V(),yaw:o.yaw??(o.team?0:Math.PI),pitch:0,hp:o.hp||100,maxHp:o.hp||100,alive:true,
  crouch:false,crouchV:0,speed:0,weapon:w,mag:w?w.mag:0,reloadT:0,fireT:0,nades:o.nades??1,firingT:0,flashT:0,hurtT:-99,stats:{kills:0,deaths:0,score:0,heads:0,assists:0,shots:0,hits:0},streak:0,respawnT:-1,deadT:0,dmgBy:new Map(),tag:o.tag||null,att:o.att||{},spawnY:o.y||0};
 if(!a.isPlayer){a.rig=new Rig(o.vip?'vip':a.team===0?'ally':'enemy');a.rig.root.position.copy(a.pos);a.rig.root.rotation.y=a.yaw;scene.add(a.rig.root);a.ai=newBrain(o.role||'tdm',o);a.ai.baseYaw=a.yaw;if(o.fol)a.ai.fol=o.fol;}
 G.actors.push(a);return a;}
G.spawnBot=o=>makeActor({nades:o.team===1?1:1,...o});
function removeActor(a){if(a.rig)scene.remove(a.rig.root);const i=G.actors.indexOf(a);if(i>=0)G.actors.splice(i,1);}
G.removeActor=removeActor;
function clearActors(){for(const a of G.actors.slice())removeActor(a);G.actors=[];G.player=null;}
G.pickWeapon=(team,role)=>{const r=Math.random();if(role==='hunt')return r<.4?'shotgun':r<.75?'smg':'ar';if(team===1)return r<.5?'ar':r<.8?'smg':r<.9?'shotgun':'sniper';return r<.55?'ar':r<.85?'smg':'shotgun';};
G.names=(team,n)=>{const src=(team?FOE_N:ALLY_N).slice().sort(()=>Math.random()-.5);return src.slice(0,n);};
// best spawn for a team: far from enemies, free cell
G.spawnPoint=(team,list)=>{const L=G.level,pts=list||(team===0?L.spawns.a:L.spawns.b);let best=null,bs=-1;for(const p of pts){let md=1e9;for(const b of G.actors)if(b.alive&&b.team!==team)md=Math.min(md,Math.hypot(b.pos.x-p[0],b.pos.z-p[1]));const s=Math.min(md,60)+Math.random()*12;if(s>bs){bs=s;best=p;}}
 return{x:best[0]+rr(-1.5,1.5),z:best[1]+rr(-1.5,1.5)};};
G.respawnActor=(a,x,z,yaw)=>{const L=G.level;if(!L.free(x,z)){const c=L.nearestFree(x,z);if(c>=0){x=c%L.N-L.half+.5;z=(c/L.N|0)-L.half+.5;}}
 a.pos.set(x,a.spawnY||0,z);a.vel.set(0,0,0);a.hp=a.maxHp;a.alive=true;a.dmgBy.clear();a.streak=0;a.respawnT=-1;a.deadT=0;a.crouchV=0;a.reloadT=0;if(a.weapon)a.mag=a.weapon.mag;a.yaw=yaw??a.yaw;
 if(a.rig){a.rig.root.visible=true;a.rig.die=0;a.rig.root.rotation.x=0;a.ai=newBrain(a.ai.role,{post:a.ai.post,route:a.ai.route,hold:a.ai.hold,fol:a.ai.fol,hunt:a.ai.hunt,slot:a.ai.slot,static:a.ai.static});a.ai.baseYaw=a.yaw;a.rig.root.position.copy(a.pos);}
 if(a.isPlayer)resetPlayerState();};

/* ================= combat ================= */
const tv=new V(),tv2=new V(),tv3=new V(),eye=new V(),hitOut={t:0,i:-1,n:new V()};
function surfaceOf(i){if(i===-2)return'ground';const b=G.level.solid[i];return b?b.mat:'concrete';}
// hitscan: returns {p, a, part, t}
function shootRay(sh,o,d,w,range=220,pellet=1,kind){const L=G.level;L.ray(o.x,o.y,o.z,d.x,d.y,d.z,range,hitOut);let best=hitOut.t,ha=null,part=null;const n=hitOut.n.clone(),si=hitOut.i;
 for(const b of G.actors){if(!b.alive||b===sh||b.team===sh.team||b.ghost)continue;const h=hitActor(b,o.x,o.y,o.z,d.x,d.y,d.z,best);if(h&&h.t<best){best=h.t;ha=b;part=h.part;}}
 const p=new V().copy(o).addScaledVector(d,Math.min(best,range));
 if(ha){let dm=dmgAt(w,best,sh.att)*(part==='head'?w.head:part==='legs'?.85:1)*(w.pellets?1:1);if(!sh.isPlayer)dm*=ha.isPlayer?G.diff.dmg:ha.vip?.6:.9;if(sh.isPlayer&&!kind){sh.stats.hits+=1/pellet;}
  fx.blood(p,d);damage(ha,dm,sh,part,d,kind==='streak'?'DRONE':w.name,kind);}
 else if(best<range)fx.impact(p,n,surfaceOf(si));
 return{p,a:ha,part,t:best};}
function damage(v,dm,att,part,dir,wname,kind){if(!v.alive||!(G.app==='play'||G.app==='menu'))return;if(v.god)return;v.hp-=dm;v.hurtT=G.time;if(att&&att!==v)v.dmgBy.set(att.id,(v.dmgBy.get(att.id)||0)+dm);
 if(v.ai&&att&&att.team!==v.team){const ai=v.ai;ai.lastAttacker=att;ai.hurtT=G.time;ai.alerted=true;ai.last=att.pos.clone();ai.lastT=G.time;if(!ai.seen){ai.target=att;}}
 if(v.rig)v.rig.flinch=1;
 if(v.isPlayer){HUD.hurt(G,att,dm,dir);snd.play('hurt');P.shake=Math.max(P.shake,.25);}
 if(att&&att.isPlayer&&v!==att){HUD.hitmark(part==='head',v.hp<=0);snd.play(part==='head'?'head':'hit');}
 if(v.hp<=0)kill(v,att,{part,wname,kind,dir});}
G.damage=damage;
function kill(v,att,info){v.alive=false;v.hp=0;v.stats.deaths++;v.streak=0;v.deadT=0;v.dieT=G.time;
 if(v.rig){const f=tv.set(Math.sin(v.yaw),0,Math.cos(v.yaw));v.rig.dieDir=info.dir&&f.dot(info.dir)>0?-1:1;if(v.rig.flash)v.rig.flash.visible=false;}
 const head=info.part==='head';
 if(att&&att!==v&&att.team!==v.team){att.stats.kills++;att.stats.score+=100+(head?50:0);if(head)att.stats.heads++;att.streak++;
  if(att.isPlayer){HUD.xp(G,head?150:100,head?'HEADSHOT':info.kind==='knife'?'MELEE':info.kind==='frag'?'GRENADE KILL':info.kind==='streak'?'STREAK KILL':'KILL');streakCheck();if(info.kind!=='streak')snd.play('kill');}
  if(att.ai&&att.team===0&&Math.random()<.35)G.callout(att,'down');
  if(att.team===1&&!att.isPlayer&&att.streak===4&&G.mode&&G.mode.kind==='tdm'&&G.streak.euav<=0){G.streak.euav=20;HUD.ann(G,'ENEMY UAV OVERHEAD',3);snd.play('radio');}}
 for(const[id,d]of v.dmgBy){if(att&&id===att.id||d<20)continue;const b=G.actors.find(x=>x.id===id);if(b&&b.team!==v.team){b.stats.assists++;b.stats.score+=25;if(b.isPlayer)HUD.xp(G,25,'ASSIST');}}
 HUD.feed(G,att,v,info.wname||'',head);
 if(v.team===0&&!v.isPlayer&&!v.vip){const buddy=G.actors.find(b=>b.alive&&b.team===0&&b.ai&&b!==v);if(buddy)G.callout(buddy,'mandown',v);}
 if(G.mode&&G.mode.onKill)G.mode.onKill(v,att,info);
 if(v.isPlayer)playerDied(att);}
G.kill=kill;
function explode(p,owner,r=7.5,max=200,kind='frag'){fx.explode(p,1);const d=cam.position.distanceTo(p);snd.play('boom',Math.max(.15,1-d/80),panOf(p));if(P&&P.alive){const k=Math.max(0,1-d/28);P.shake=Math.max(P.shake,k*1.2);}
 for(const a of G.actors.slice()){if(!a.alive)continue;chestOf(a,tv);const dd=tv.distanceTo(p);if(dd>r)continue;if(owner&&a.team===owner.team&&a!==owner)continue;tv2.copy(p);tv2.y+=.35;const los=G.level.los(tv2,tv);
  let dm=max*(1-dd/r)*(los?1:.22);if(a===owner)dm*=.6;if(!owner||!owner.isPlayer)dm*=a.isPlayer?Math.max(.55,G.diff.dmg):1;if(dm>2)damage(a,dm,owner,'body',tv3.subVectors(tv,p).normalize(),kind==='air'?'AIRSTRIKE':'FRAG',kind==='air'?'streak':'frag');}
 G.noises.push({p:p.clone(),r:60,team:-1,t:G.time,src:owner});}
G.explode=explode;
function panOf(p){if(!P)return 0;tv.subVectors(p,cam.position);const rx=-Math.cos(P.yaw),rz=Math.sin(P.yaw);return cl((tv.x*rx+tv.z*rz)/(tv.length()+1)*1.1,-1,1);}

/* ---------- bots shooting ---------- */
const bEye=new V(),bAim=new V(),bDir=new V(),bPerp=new V(),bUp=new V(0,1,0);
G.botFire=(a,t,err)=>{const w=a.weapon;eyeOf(a,bEye);chestOf(t,bAim);if(a.ai.headAim)bAim.y+=.42;bDir.subVectors(bAim,bEye).normalize();
 const muzzle=tv3.copy(bEye).addScaledVector(bDir,.7);muzzle.x+=-Math.cos(a.yaw)*.1;muzzle.z+=Math.sin(a.yaw)*.1;muzzle.y-=.18;
 const n=w.pellets?6:1;let res=null;for(let i=0;i<n;i++){const e=(err+(w.pellets?3.5*D2R:0))*Math.sqrt(-2*Math.log(Math.random()+1e-6))*.6,th=Math.random()*6.283;bPerp.crossVectors(bDir,bUp).normalize();const p2=new V().crossVectors(bPerp,bDir);
  const d=new V().copy(bDir).addScaledVector(bPerp,Math.cos(th)*Math.tan(e)).addScaledVector(p2,Math.sin(th)*Math.tan(e)).normalize();res=shootRay(a,bEye,d,w,200,n);
  if(P&&P.alive&&!res.a&&t!==P){// whiz near player
   eyeOf(P,eye);tv.subVectors(eye,bEye);const proj=tv.dot(d);if(proj>0&&proj<res.t){const cdist=tv.addScaledVector(d,-proj).length();if(cdist<1.4)snd.play('whiz',1,panOf(res.p));}}}
 a.mag--;a.fireT=w.auto?60/w.rpm*1.15:w.bolt?1.8:w.pump?1.0:.32;a.flashT=.05;a.firingT=.6;
 const supp=a.att&&a.att.supp;if(!supp)G.noises.push({p:a.pos.clone(),r:55,team:a.team,t:G.time,src:a});
 if(Math.random()<.7)fx.tracers.fire(muzzle,res.p,380,2.6,.9);const dist=cam.position.distanceTo(a.pos);if(dist<45&&Math.random()<.5)fx.lights.flash(muzzle,0xffa050,6,9,.06);
 if(dist<140)snd.shot(w.snd,supp,dist,panOf(a.pos),false);};
G.reload=a=>{a.reloadT=a.weapon.reload*1.25*(a.weapon.shell?a.weapon.mag*.5:1);};
G.throwNade=(a,target)=>{eyeOf(a,tv);const dx=target.x-tv.x,dz=target.z-tv.z,dd=Math.hypot(dx,dz),t=cl(dd/14,.6,1.6);const v=new V(dx/t,(target.y-tv.y)/t+.5*GRAV*t,dz/t);spawnNade(tv,v,a,'frag',Math.max(t+.4,2.2));if(a.team===0)G.callout(a,'frag');};
let callT=0;const CALL={contact:['Contact! {d}','Tango spotted, {d}','Enemy {d}!','Eyes on hostile, {d}'],reload:['Reloading!','Changing mags, cover me!'],flankL:['Flanking left!','Moving left flank.'],flankR:['Flanking right!','Going around right.'],frag:['Frag out!','Grenade out!'],down:['Tango down.','Got him.','Enemy down!'],mandown:['Man down! {n} is down!','We lost {n}!']};
G.callout=(a,k,o)=>{if(G.app!=='play'||!P||a.team!==0||a.isPlayer)return;if(G.time-callT<1.4||G.time-(a.callT||-9)<4)return;if(k==='contact'&&o&&!dirWord(o))return;const L=CALL[k];if(!L)return;callT=G.time;a.callT=G.time;
 let s=L[Math.random()*L.length|0];s=s.replace('{d}',o?dirWord(o):'').replace('{n}',o&&o.name?o.name:'');HUD.radio(G,a.name,s);snd.play('radio');};
function dirWord(o){if(!P)return'';const dx=o.pos.x-P.pos.x,dz=o.pos.z-P.pos.z;const a=ang(Math.atan2(dx,dz)-P.yaw);const c=Math.round(-a/(Math.PI/6));const h=((c%12)+12)%12||12;return h+" o'clock";}

/* ================= grenades ================= */
function spawnNade(p,v,owner,kind,fuse){const m=new THREE.Mesh(nadeGeo,kind==='smoke'?smokeMat:nadeMat);m.castShadow=true;m.position.copy(p);scene.add(m);G.nades.push({p:p.clone(),v,owner,kind,fuse,m,b:0,rest:false});if(kind==='frag')snd.play('throw');}
function stepNades(dt){const L=G.level;for(let i=G.nades.length-1;i>=0;i--){const n=G.nades[i];n.fuse-=dt;if(!n.rest){n.v.y-=GRAV*dt;const op=tv.copy(n.p);n.p.addScaledVector(n.v,dt);
  const bi=L.inside(n.p.x,n.p.y,n.p.z);if(bi>=0){const B=L.B,k=bi*6;// find the face we crossed
   if(op.x<=B[k]||op.x>=B[k+3]){n.p.x=op.x;n.v.x*=-.4;}else if(op.z<=B[k+2]||op.z>=B[k+5]){n.p.z=op.z;n.v.z*=-.4;}else{n.p.y=op.y;n.v.y*=-.3;n.v.x*=.6;n.v.z*=.6;}if(n.b++<6)snd.play('clink',1.2,panOf(n.p));}
  if(n.p.y<.06){n.p.y=.06;if(Math.abs(n.v.y)>1.2&&n.b++<6)snd.play('clink',1,panOf(n.p));n.v.y*=-.32;n.v.x*=.62;n.v.z*=.62;if(Math.abs(n.v.y)<.5&&n.v.x*n.v.x+n.v.z*n.v.z<.2)n.rest=true;}}
  n.m.position.copy(n.p);n.m.rotation.x+=dt*8;
  if(n.fuse<=0){scene.remove(n.m);G.nades.splice(i,1);if(n.kind==='frag')explode(n.p.clone().setY(Math.max(.3,n.p.y)),n.owner);else{fx.smokeCloud(n.p.clone(),14);snd.play('smoke',1,panOf(n.p));}}}}

/* ================= player ================= */
let P=null;
function makePlayer(x,z,yaw){const p=makeActor({player:true,team:0,x,z,yaw,name:'YOU',hp:100});p.vel=new V();P=G.player=p;
 p.slots=[{id:load.primary,att:{...(load.att[load.primary]||{})}},{id:'pistol',att:{}}];for(const s of p.slots){const w=WEAPONS[s.id];s.mag=Math.round(w.mag*(s.att.ext?1.5:1));s.res=w.res;}
 resetPlayerState();return p;}
function resetPlayerState(){const p=P;Object.assign(p,{onGround:true,crouch:false,crouchV:0,sprint:false,slideT:0,mantle:null,eyeH:EYE,cur:0,fireT:0,reloadT:0,reloadDur:0,swapT:0,swapTo:-1,boltT:0,adsV:0,shotI:0,bloom:0,recP:0,recY:0,lastShot:-9,
  frags:2,smokes:1,cook:-1,throwT:0,knifeT:0,knifeHit:false,breath:4,shake:0,stepD:0,fall:0,swayX:0,swayY:0,kick:0,interact:0,ks:p.ks||{uav:0,air:0,drone:0},hurtT:-99,deathT:0,landT:0,trigger:false,attackerPos:null,firingT:0,att:p.slots?p.slots[0].att:{}});
 for(const s of p.slots){const w=WEAPONS[s.id];s.mag=Math.round(w.mag*(s.att.ext?1.5:1));s.res=w.res;}p.weapon=WEAPONS[p.slots[0].id];p.att=p.slots[0].att;showGun();}
G.makePlayer=makePlayer;
function curW(){return WEAPONS[P.slots[P.cur].id];}
function magSize(s){return Math.round(WEAPONS[s.id].mag*(s.att.ext?1.5:1));}
G.refill=()=>{if(!P)return;for(const s of P.slots){s.mag=magSize(s);s.res=WEAPONS[s.id].res;}P.frags=2;P.smokes=1;};
G.placePlayer=(x,z,yaw)=>{G.respawnActor(P,x,z,yaw);P.pitch=0;};

/* ---------- input ---------- */
const keys={},edge={},mouse={dx:0,dy:0,l:false,r:false,le:false};let locked=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','ArrowUp','ArrowDown','KeyQ','ControlLeft'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Tab')e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play'&&!G.over)pause(true);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
canvas.addEventListener('mousedown',e=>{if(G.app!=='play')return;if(!locked&&!G.noLock){lockPointer();}if(e.button===0){mouse.l=true;mouse.le=true;}if(e.button===2)mouse.r=true;});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>{if(G.app==='play')e.preventDefault();});
addEventListener('mousemove',e=>{if(locked||(G.app==='play'&&e.buttons&&!G.noLock)){mouse.dx+=e.movementX;mouse.dy+=e.movementY;}});
addEventListener('wheel',e=>{if(G.app==='play'&&P&&P.alive)queueSwap(1-P.cur);},{passive:true});
function lockPointer(){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play')pause(true);});
function pause(on){if(on&&G.app==='play'){G.app='paused';HUD.showPause(true);document.body.classList.remove('playing');if(document.exitPointerLock&&locked)document.exitPointerLock();}
 else if(!on&&G.app==='paused'){G.app='play';HUD.showPause(false);document.body.classList.add('playing');if(!G.noLock)lockPointer();}}
G.pause=pause;
const pad={prev:{}};
function readPad(){const gps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const g=gps[0];if(!g)return null;const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.15?(v-Math.sign(v)*.15)/.85:0;
 const st={mx:dz(ax[0]||0),my:dz(ax[1]||0),lx:dz(ax[2]||0),ly:dz(ax[3]||0),fire:(bt[7]?.value||0)>.3,ads:(bt[6]?.value||0)>.3};const pr=pad.prev,b=i=>!!bt[i]?.pressed,e=i=>b(i)&&!pr[i];
 st.jump=e(0);st.crouchE=e(1);st.reload=b(2);st.reloadE=e(2);st.swap=e(3);st.frag=b(5);st.smoke=e(4);st.knife=e(11);st.sprint=b(10);st.start=e(9);st.back=b(8);st.k3=e(12);st.k4=e(14);st.k5=e(15);for(let i=0;i<17;i++)pr[i]=b(i);return st;}

/* ---------- player update ---------- */
function updatePlayer(dt){const p=P,L=G.level;if(!p)return;const gp=readPad();
 if(gp&&gp.start&&G.app==='play'){pause(true);return;}
 if(!p.alive){p.deathT+=dt;mouse.dx=mouse.dy=0;return;}
 const w=curW(),s=p.slots[p.cur];p.weapon=w;p.att=s.att;
 // look
 const sens=.0022*opt.sens*(1-p.adsV*(1-1/(w.adsZoom*(w.scope?1:1))));
 p.yaw-=mouse.dx*sens;p.pitch-=mouse.dy*sens;mouse.dx=mouse.dy=0;if(keys.ArrowLeft)p.yaw+=2.2*dt;if(keys.ArrowRight)p.yaw-=2.2*dt;if(keys.ArrowUp)p.pitch+=1.6*dt;if(keys.ArrowDown)p.pitch-=1.6*dt;
 if(gp){const k=(3.2-p.adsV*2)*opt.sens*dt,acc=x=>Math.sign(x)*Math.pow(Math.abs(x),1.7);p.yaw-=acc(gp.lx)*k;p.pitch-=acc(gp.ly)*k*.75;}
 p.pitch=cl(p.pitch,-1.45,1.45);
 // designate airstrike mode intercepts fire
 const fireHeld=mouse.l||(gp&&gp.fire),fireEdge=mouse.le||!!(gp&&gp.fire&&!pad.fireWas);if(gp)pad.fireWas=gp.fire;mouse.le=false;
 const adsHeld=mouse.r||(gp&&gp.ads);
 // movement intent
 let fx_=(keys.KeyW?1:0)-(keys.KeyS?1:0),sx=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(gp){fx_=fx_||-gp.my;sx=sx||gp.mx;}
 const ml=Math.hypot(fx_,sx);if(ml>1){fx_/=ml;sx/=ml;}
 const sprintKey=keys.ShiftLeft||keys.ShiftRight||(gp&&gp.sprint);
 if(edge.KeyC||(gp&&gp.crouchE)){if(p.sprint&&p.onGround&&p.slideT<=0){startSlide();}else p.crouch=!p.crouch;}
 if(edge.ControlLeft&&p.sprint&&p.onGround&&p.slideT<=0)startSlide();
 const crouchHeld=keys.ControlLeft&&p.slideT<=0;const wantCrouch=p.crouch||crouchHeld||p.slideT>0;
 if(!wantCrouch&&p.crouchV>.5&&L.ground(p.pos.x,p.pos.z,p.pos.y+1.1,.2)>p.pos.y+1.1){}// (no ceilings low enough to matter)
 const wasSpr=p.sprint;p.sprint=!!sprintKey&&fx_>.5&&p.onGround&&!wantCrouch&&!adsHeld&&p.knifeT<=0&&p.cook<0&&!fireHeld&&!p.mantle&&!G.streak.designate;if(wasSpr&&!p.sprint)p.sprOut=.14;p.sprOut=(p.sprOut||0)-dt;
 if(p.sprint&&p.crouch)p.crouch=false;
 // mantle
 if(p.mantle){const m=p.mantle;m.t+=dt/m.dur;const k=Math.min(1,m.t),e=k<.6?k/.6:1;p.pos.x=m.from.x+(m.to.x-m.from.x)*Math.max(0,(k-.35)/.65);p.pos.z=m.from.z+(m.to.z-m.from.z)*Math.max(0,(k-.35)/.65);p.pos.y=m.from.y+(m.to.y-m.from.y)*Math.min(1,e);
  if(k>=1){p.mantle=null;p.onGround=true;p.vel.set(Math.sin(p.yaw)*2,0,Math.cos(p.yaw)*2);}}
 else{const fwx=Math.sin(p.yaw),fwz=Math.cos(p.yaw),rx=-Math.cos(p.yaw),rz=Math.sin(p.yaw);
  let spd=4.6*w.speed;if(p.sprint)spd=7.1*w.speed;if(wantCrouch&&p.slideT<=0)spd=2.3*w.speed;spd*=1-p.adsV*.45;if(p.cook>=0)spd*=.85;
  let wx=(fwx*fx_+rx*sx)*spd,wz=(fwz*fx_+rz*sx)*spd;
  if(p.slideT>0){p.slideT-=dt;const k=Math.max(0,p.slideT/.8);wx=p.slideDir.x*(2.4+7.6*k)+rx*sx*1.5;wz=p.slideDir.z*(2.4+7.6*k)+rz*sx*1.5;if(p.slideT<=0){p.crouch=true;}}
  const acc=p.onGround?(p.slideT>0?20:13):2.5,k=1-Math.exp(-acc*dt);p.vel.x+=(wx-p.vel.x)*k;p.vel.z+=(wz-p.vel.z)*k;
  // jump / mantle
  const jumpE=edge.Space||(gp&&gp.jump);
  if(jumpE||(keys.Space&&!p.onGround&&fx_>0)){const top=L.ledge(p.pos,fwx,fwz,PR);if(top>0&&(jumpE||p.vel.y<1.5)){p.mantle={t:0,dur:.42+(top-p.pos.y)*.12,from:p.pos.clone(),to:new V(p.pos.x+fwx*(PR+.75),top,p.pos.z+fwz*(PR+.75))};p.vel.set(0,0,0);p.slideT=0;p.crouch=false;snd.play('land');}
   else if(jumpE&&p.onGround){if(wantCrouch&&p.slideT<=0){p.crouch=false;}else{p.vel.y=5.4;p.onGround=false;p.slideT=0;p.crouch=false;}}}
  p.vel.y-=GRAV*dt;p.pos.x+=p.vel.x*dt;p.pos.z+=p.vel.z*dt;p.pos.y+=p.vel.y*dt;
  for(const a of G.actors){if(a===p||!a.alive)continue;const dx=p.pos.x-a.pos.x,dz=p.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2<.49&&d2>1e-6&&Math.abs(a.pos.y-p.pos.y)<1.5){const d=Math.sqrt(d2);p.pos.x+=dx/d*(.7-d);p.pos.z+=dz/d*(.7-d);}}
  const hgt=p.crouchV>.5?1.15:1.8;if(L.collide(p.pos,PR,hgt)&&p.slideT>0)p.slideT=Math.min(p.slideT,.15);
  const g=L.ground(p.pos.x,p.pos.z,p.pos.y+(p.onGround?0:0),PR*.7);if(p.pos.y<=g+.001&&p.vel.y<=0){if(!p.onGround){const fv=-p.vel.y;if(fv>4){snd.play('land');p.landT=Math.min(1,fv/10);}if(fv>13)damage(p,(fv-13)*9,null,'legs',null,'FALL');}p.pos.y=g;p.vel.y=0;p.onGround=true;}
  else if(p.pos.y>g+.001){if(p.onGround&&p.pos.y-g<STEP&&p.vel.y<=0){p.pos.y=g;}else p.onGround=false;}
  // footsteps
  const hs=Math.hypot(p.vel.x,p.vel.z);p.speed=hs;if(p.onGround&&hs>1&&p.slideT<=0){p.stepD+=hs*dt;const stride=p.sprint?2.6:wantCrouch?1.6:2.1;if(p.stepD>stride){p.stepD=0;snd.play('step',p.sprint?1.4:wantCrouch?.4:.9);if(p.sprint)G.noises.push({p:p.pos.clone(),r:9,team:0,t:G.time,src:p});}}}
 p.crouchV+=((wantCrouch?1:0)-p.crouchV)*Math.min(1,dt*10);
 const eyeT=p.slideT>0?.9:EYE-(EYE-CEYE)*p.crouchV;p.eyeH+=(eyeT-p.eyeH)*Math.min(1,dt*14);
 // weapon timers
 p.fireT-=dt;p.boltT-=dt;p.throwT-=dt;p.shake=Math.max(0,p.shake-dt*1.8);p.landT=Math.max(0,p.landT-dt*3);p.firingT-=dt;
 if(p.knifeT>0){p.knifeT-=dt;if(!p.knifeHit&&p.knifeT<.36){p.knifeHit=true;knifeHit();}}
 // swap
 if(edge.Digit1)queueSwap(0);if(edge.Digit2)queueSwap(1);if(gp&&gp.swap)queueSwap(1-p.cur);
 if(p.swapT>0){p.swapT-=dt;if(p.swapTo>=0&&p.swapT<.28){p.cur=p.swapTo;p.swapTo=-1;showGun();p.shotI=0;}}
 // reload
 const rE=edge.KeyR||(gp&&gp.reloadE);
 if(rE&&p.reloadT<=0&&s.mag<magSize(s)&&s.res>0&&p.swapT<=0&&p.knifeT<=0)startReload();
 if(p.reloadT>0){const before=p.reloadT;p.reloadT-=dt;const k=1-p.reloadT/p.reloadDur,k0=1-before/p.reloadDur;
  if(w.shell){if(k0<.5&&k>=.5)snd.play('shell');if(p.reloadT<=0){s.mag++;s.res--;if(s.mag<magSize(s)&&s.res>0&&!fireHeld)startReload(true);else{snd.play('pump');p.reloadT=0;}}}
  else{if(k0<.15&&k>=.15)snd.play('magout');if(k0<.62&&k>=.62)snd.play('magin');if(p.reloadEmpty&&k0<.84&&k>=.84)snd.play('bolt');if(p.reloadT<=0){const n=Math.min(magSize(s)-s.mag,s.res);s.mag+=n;s.res-=n;}}}
 // ADS
 const canAds=adsHeld&&p.swapT<=0&&p.knifeT<=0&&!p.sprint&&!p.mantle&&p.cook<0&&!G.streak.designate&&!(w.shell?false:p.reloadT>0&&!w.shell);
 const adsT=canAds?1:0;p.adsV+=(adsT-p.adsV)*Math.min(1,dt/(w.ads*.45));if(Math.abs(p.adsV-adsT)<.01)p.adsV=adsT;
 // hold breath
 const steady=w.scope&&p.adsV>.8&&sprintKey&&p.breath>0;if(steady)p.breath=Math.max(0,p.breath-dt);else p.breath=Math.min(4,p.breath+dt*(sprintKey?0:.8));p.steady=steady;
 // airstrike designation
 if(G.streak.designate){designate(fireEdge,adsHeld);}
 else{
 // fire
 const auto=w.auto;const want=auto?fireHeld:fireEdge;
 if(want&&p.sprint){p.sprint=false;}
 if(want&&p.reloadT>0&&w.shell&&s.mag>0){p.reloadT=0;}
 if(want&&p.sprOut<=0&&p.fireT<=0&&p.boltT<=0&&p.reloadT<=0&&p.swapT<=0&&p.knifeT<=0&&p.cook<0&&!p.mantle&&p.throwT<=0){if(s.mag>0)playerShoot(w,s);else if(fireEdge){snd.play('dry');if(s.res>0)startReload();else if(p.slots[1-p.cur].mag+p.slots[1-p.cur].res>0)queueSwap(1-p.cur);}}
 if(!fireHeld&&G.time-p.lastShot>.08)p.shotI=Math.max(0,p.shotI-dt*14);}
 // recoil recovery (returns most of the climb)
 if(G.time-p.lastShot>.1){const k=Math.min(1,dt*7);const rp=p.recP*k*.85,ry=p.recY*k*.85;p.pitch-=rp;p.yaw-=ry;p.recP-=p.recP*k;p.recY-=p.recY*k;}
 p.bloom=Math.max(0,p.bloom-dt*(p.adsV>.5?6:3.5));
 // knife
 if((edge.KeyV||(gp&&gp.knife))&&p.knifeT<=0&&p.swapT<=0&&!p.mantle){p.knifeT=.55;p.knifeHit=false;p.reloadT=0;snd.play('knife');p.sprint=false;}
 // grenades
 const fragHeld=keys.KeyQ||(gp&&gp.frag);
 if(fragHeld&&p.cook<0&&p.frags>0&&p.knifeT<=0&&p.swapT<=0&&p.throwT<=0&&!p.mantle){p.cook=0;p.reloadT=0;snd.play('pin');}
 if(p.cook>=0){HUD.prompt(G,'COOKING '+Math.max(0,3.6-p.cook).toFixed(1)+'s · RELEASE TO THROW',p.cook/3.6);p.cook+=dt;if(p.cook>=3.6){p.cook=-1;p.frags--;explode(tv.copy(p.pos).setY(p.pos.y+1),p);}else if(!fragHeld){throwFrom(p,'frag',3.6-p.cook);p.cook=-1;p.frags--;}}
 if((edge.KeyX||(gp&&gp.smoke))&&p.smokes>0&&p.cook<0&&p.throwT<=0&&p.knifeT<=0){p.smokes--;throwFrom(p,'smoke',1.3);}
 // killstreaks
 if(edge.Digit3||(gp&&gp.k3))useStreak('uav');if(edge.Digit4||(gp&&gp.k4))useStreak('air');if(edge.Digit5||(gp&&gp.k5))useStreak('drone');
 // interact (mode objectives)
 p.interact=keys.KeyE||(gp&&gp.reload)?p.interact+dt:0;
 // health regen
 if(G.time-p.hurtT>4.5&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+42*dt);
 G.scoreboard=keys.Tab||(gp&&gp.back);}
function startSlide(){const p=P;p.slideT=.8;p.slideDir=new V(p.vel.x,0,p.vel.z).normalize();if(p.slideDir.lengthSq()<.5)p.slideDir.set(Math.sin(p.yaw),0,Math.cos(p.yaw));p.sprint=false;p.crouch=false;snd.play('slide');}
function startReload(cont){const p=P,s=p.slots[p.cur],w=WEAPONS[s.id];if(s.res<=0)return;p.reloadEmpty=s.mag===0;p.reloadDur=p.reloadT=w.shell?w.reload*(cont?1:1.35):(p.reloadEmpty?w.reloadE:w.reload)*(s.att.ext?1.12:1);p.adsV=Math.min(p.adsV,.99);}
function queueSwap(i){const p=P;if(!p||!p.alive||i===p.cur&&p.swapTo<0||p.swapT>0||p.knifeT>0||p.cook>=0)return;p.swapTo=i;p.swapT=.55;p.reloadT=0;snd.play('swap');}
function throwFrom(p,kind,fuse){eyeOf(p,tv);const d=new V();cam.getWorldDirection(d);const v=d.clone().multiplyScalar(kind==='smoke'?15:17.5);v.y+=3.2;v.add(tv2.set(p.vel.x,0,p.vel.z));tv.addScaledVector(d,.4);spawnNade(tv,v,p,kind,fuse);p.throwT=.45;if(kind==='smoke')snd.play('throw');}
function knifeHit(){const p=P;let best=null,bd=2.4;for(const a of G.actors){if(!a.alive||a.team===p.team)continue;const dx=a.pos.x-p.pos.x,dz=a.pos.z-p.pos.z,d=Math.hypot(dx,dz);if(d>bd||Math.abs(a.pos.y-p.pos.y)>1.2)continue;const an=Math.abs(ang(Math.atan2(dx,dz)-p.yaw));if(an>.75)continue;bd=d;best=a;}
 if(best){snd.play('stab');fx.blood(tv.copy(best.pos).setY(best.pos.y+1.2),tv2.set(Math.sin(p.yaw),0,Math.cos(p.yaw)));damage(best,160,p,'body',tv2,'KNIFE','knife');}
 else{eyeOf(p,tv);const d=new V();cam.getWorldDirection(d);const t=G.level.ray(tv.x,tv.y,tv.z,d.x,d.y,d.z,1.6,hitOut);if(t<1.6){fx.impact(tv.addScaledVector(d,t),hitOut.n.clone(),'metal');}}}
const sDir=new V(),sP1=new V(),sP2=new V();
function playerShoot(w,s){const p=P;s.mag--;p.fireT=60/w.rpm;p.lastShot=G.time;p.stats.shots++;const supp=!!s.att.supp;
 cam.updateMatrixWorld();cam.getWorldDirection(sDir);eyeOf(p,eye);eye.copy(cam.position);
 const moving=Math.min(1,Math.hypot(p.vel.x,p.vel.z)/5),air=p.onGround?0:1;
 let spread=(w.hip*(1+moving*w.move*.35+air*.8)*(p.crouchV>.5?.75:1)+p.bloom)*(1-p.adsV)+(w.adsSpr+moving*.4*(w.scope?2:0))*p.adsV;if(w.scope&&p.adsV<.95)spread=Math.max(spread,w.hip*(1-p.adsV));
 const n=w.pellets||1;sP1.crossVectors(sDir,bUp).normalize();sP2.crossVectors(sP1,sDir);let hitAny=null,last=null;
 for(let i=0;i<n;i++){const e=spread*D2R*Math.sqrt(Math.random()),th=Math.random()*6.283,d=new V().copy(sDir).addScaledVector(sP1,Math.cos(th)*Math.tan(e)).addScaledVector(sP2,Math.sin(th)*Math.tan(e)).normalize();const r=shootRay(p,eye,d,w,240,n);last=r;if(r.a)hitAny=r;}
 // recoil
 const [pv,ph]=pattern(w.id,p.shotI|0);const rm=(s.att.grip?.75:1)*(p.crouchV>.5?.85:1)*(1-p.adsV*.18);const dp=w.recoil[0]*pv*rm*D2R*(.9+Math.random()*.2),dy=w.recoil[1]*ph*rm*D2R+(Math.random()-.5)*w.recoil[1]*.3*D2R;
 p.pitch+=dp;p.yaw-=dy;p.recP+=dp;p.recY-=dy;p.shotI++;p.bloom=Math.min(w.hip*1.6,p.bloom+(w.auto?.35:1.2));p.kick=1;
 if(w.bolt)p.boltT=60/w.rpm;if(w.pump)p.boltT=60/w.rpm;if(w.bolt)setTimeout(()=>snd.play('bolt'),260);if(w.pump)setTimeout(()=>snd.play('pump'),200);
 // muzzle fx (viewmodel flash + world light + tracer from the gun)
 const g=VM.guns[s.id].userData;if(!supp){g.flash.visible=true;g.flash.rotation.z=Math.random()*6.28;g.flash.scale.setScalar(.45+Math.random()*.3);g.flash2.visible=true;vmFlash.intensity=2;}
 const mw=tv.copy(eye).addScaledVector(sDir,.6).addScaledVector(sP1,.12*(1-p.adsV)).addScaledVector(sP2,-.1);if(!supp)fx.lights.flash(mw,0xffa050,9,10,.06);
 if(last&&(p.shotI%2===0||!w.auto))fx.tracers.fire(tv2.copy(mw).addScaledVector(sDir,1.2),last.p,450,3,1);if(!supp)fx.sparks.burst(tv2.copy(mw).addScaledVector(sDir,.9),2,4,new THREE.Color(2,1.3,.5),.025,.08,{dir:sDir,spread:.4,drag:5});
 snd.shot(w.snd,supp,0,0,true);p.firingT=supp?0:.8;if(!supp)G.noises.push({p:p.pos.clone(),r:60,team:0,t:G.time,src:p});else G.noises.push({p:p.pos.clone(),r:9,team:0,t:G.time,src:p});
 if(s.mag===0&&s.res>0)setTimeout(()=>{if(P&&P.alive&&P.slots[P.cur]===s&&s.mag===0&&P.reloadT<=0)startReload();},w.bolt?600:200);}

/* ---------- killstreaks ---------- */
function streakCheck(){const p=P,ks=p.ks,s=p.streak;const give=(k,n,name)=>{if(s===n&&!ks[k]){ks[k]=1;HUD.banner(G,name+' READY',`${n} KILL STREAK · PRESS ${k==='uav'?3:k==='air'?4:5}`,'#ffd23f',2.2);snd.play('streak');}};give('uav',3,'UAV');give('air',5,'AIRSTRIKE');give('drone',7,'ATTACK DRONE');}
function useStreak(k){const p=P;if(!p||!p.alive||p.ks[k]!==1)return;if(k==='uav'){p.ks.uav=2;G.streak.uav=28;HUD.ann(G,'UAV ONLINE',2.5);snd.play('uav');}
 else if(k==='air'){p.ks.air=2;G.streak.designate=true;HUD.ann(G,'MARK AIRSTRIKE TARGET — FIRE TO CONFIRM',3);snd.play('radio');}
 else if(k==='drone'){p.ks.drone=2;G.streak.drone={t:30,pos:p.pos.clone().add(new V(0,8,0)),a:0,fireT:0,target:null};droneMesh.visible=true;HUD.ann(G,'ATTACK DRONE INBOUND',2.5);snd.play('drone');}}
function designate(fire,cancel){const p=P;cam.getWorldDirection(tv2);const t=G.level.ray(cam.position.x,cam.position.y,cam.position.z,tv2.x,tv2.y,tv2.z,180,hitOut);markRing.visible=t<180;if(t<180){markRing.position.copy(cam.position).addScaledVector(tv2,t);markRing.position.y=Math.max(.05,markRing.position.y+.05);}
 if(fire&&t<180){G.streak.designate=false;markRing.visible=false;const tgt=markRing.position.clone();tgt.y=0;const d=new V(Math.cos(p.yaw),0,-Math.sin(p.yaw));G.streak.air={t:0,tgt,d,i:0};fx.smokeCloud(tgt.clone(),6);HUD.radio(G,'HQ','Airstrike confirmed. Danger close!',true);snd.play('radio');p.ks.air=3;}
 if(cancel){G.streak.designate=false;markRing.visible=false;p.ks.air=1;HUD.ann(G,'AIRSTRIKE CANCELLED',1.5);}}
function updateStreaks(dt){const S=G.streak;if(S.uav>0){S.uav-=dt;uavMesh.visible=true;const a=G.time*.15;uavMesh.position.set(Math.cos(a)*55,70,Math.sin(a)*55);uavMesh.rotation.y=-a;uavMesh.userData.l.visible=(G.time*2|0)%2===0;}else uavMesh.visible=false;
 if(S.euav>0){S.euav-=dt;if(P&&P.alive&&((G.time*2|0)%4===0))for(const a of G.actors)if(a.ai&&a.team===1&&a.alive&&!a.ai.seen){a.ai.last=P.pos.clone();a.ai.lastT=G.time;a.ai.alerted=true;}}
 if(S.air){const A=S.air;A.t+=dt;if(A.t>2.4&&!A.jet){A.jet=1;snd.play('jet');jets.forEach((j,i)=>{j.visible=true;j.userData.o=A.tgt.clone().addScaledVector(A.d,-140).add(new V(-A.d.z*(i?6:-6),45+i*3,A.d.x*(i?6:-6)));});}
  if(A.jet){const k=(A.t-2.4)*110;jets.forEach(j=>{j.position.copy(j.userData.o).addScaledVector(A.d,k);j.lookAt(tv.copy(j.position).add(A.d));});
   while(A.i<7&&A.t>3.5+A.i*.13){const p=A.tgt.clone().addScaledVector(A.d,(A.i-3)*4.5).add(new V(rr(-1.5,1.5),.2,rr(-1.5,1.5)));explode(p,P,8,220,'air');A.i++;}
   if(A.t>6.5){jets.forEach(j=>j.visible=false);S.air=null;}}}
 if(S.drone){const D=S.drone;D.t-=dt;D.a+=dt*.5;const c=P&&P.alive?P.pos:D.pos;const want=tv.set(c.x+Math.cos(D.a)*7,c.y+7.5,c.z+Math.sin(D.a)*7);D.pos.lerp(want,Math.min(1,dt*1.5));droneMesh.position.copy(D.pos);D.userData=D.userData||{};
  for(const r of droneMesh.userData.rot)r.rotation.y+=dt*40;droneMesh.userData.led.visible=(G.time*4|0)%2===0;
  D.fireT-=dt;if(D.retarget===undefined||(D.retarget-=dt)<=0){D.retarget=.3;D.target=null;let bd=40;for(const a of G.actors){if(!a.alive||a.team===0)continue;const d=a.pos.distanceTo(D.pos);if(d<bd){chestOf(a,tv2);if(G.level.los(D.pos,tv2)&&!fx.smokeBlocks(D.pos,tv2)){bd=d;D.target=a;}}}}
  if(D.target&&D.target.alive){chestOf(D.target,tv2);droneMesh.lookAt(tv2);if(D.fireT<=0){D.fireT=.11;D.shots=(D.shots||0)+1;if(D.shots%9===0)D.fireT=.7;const dd=new V().subVectors(tv2,D.pos).normalize();dd.x+=rr(-.03,.03);dd.y+=rr(-.03,.03);dd.z+=rr(-.03,.03);dd.normalize();
   const r=shootRay(P,D.pos,dd,{dmg:[24,18],range:[20,60],head:1.5,name:'DRONE'},120,1,'streak');fx.tracers.fire(D.pos,r.p,400,2.4,.8);snd.shot({f:2600,b:140,len:.07},false,cam.position.distanceTo(D.pos),panOf(D.pos),false);}}
  else droneMesh.rotation.y=D.a+Math.PI/2;
  if(D.t<=0){S.drone=null;droneMesh.visible=false;HUD.ann(G,'DRONE RETURNING TO BASE',2);}}}

/* ================= death / respawn ================= */
function playerDied(att){const p=P;p.deathT=0;p.cook=-1;p.reloadT=0;p.adsV=0;p.slideT=0;p.mantle=null;p.attackerPos=att&&att.pos?att.pos.clone():null;HUD.dead(G,true,att);G.streak.designate=false;markRing.visible=false;
 if(p.ks)for(const k in p.ks)if(p.ks[k]===1){}p.ks={uav:p.ks.uav===1?1:0,air:p.ks.air===1?1:0,drone:p.ks.drone===1?1:0};
 if(G.mode&&G.mode.onPlayerDeath)G.mode.onPlayerDeath(att);}
G.respawnPlayer=(x,z,yaw)=>{G.placePlayer(x,z,yaw);HUD.dead(G,false);};

/* ================= bots update ================= */
function updateBots(dt){G.pathBudget=3;const L=G.level;
 for(const a of G.actors){if(a.isPlayer)continue;if(!a.alive){a.deadT+=dt;if(a.rig){a.rig.update(dt,{dead:true});a.rig.root.position.copy(a.pos);if(a.deadT>(G.mode&&G.mode.corpse||12))a.rig.root.visible=false;}continue;}
  if((G.app==='play'&&!G.over)||G.app==='menu')drive(a,G,dt);else{a.move.set(0,0,0);a.crouch=false;}
  const k=1-Math.exp(-10*dt);a.vel.x+=(a.move.x-a.vel.x)*k;a.vel.z+=(a.move.z-a.vel.z)*k;a.pos.x+=a.vel.x*dt;a.pos.z+=a.vel.z*dt;
  if(!a.ai.static){L.collide(a.pos,.34,a.crouchV>.5?1.15:1.8);const g=L.ground(a.pos.x,a.pos.z,a.pos.y,.2);a.vel.y=(a.vel.y||0)-GRAV*dt;a.pos.y+=a.vel.y*dt;if(a.pos.y<=g){a.pos.y=g;a.vel.y=0;}}
  a.speed=Math.hypot(a.vel.x,a.vel.z);a.crouchV+=((a.crouch?1:0)-a.crouchV)*Math.min(1,dt*8);
  a.fireT-=dt;a.firingT-=dt;a.flashT-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0&&a.weapon)a.mag=a.weapon.mag;}
  if(G.time-a.hurtT>6&&a.hp<a.maxHp)a.hp=Math.min(a.maxHp,a.hp+(a.vip?12:20)*dt);
  if(a.rig){a.rig.root.position.copy(a.pos);a.rig.root.rotation.y=a.yaw;a.rig.update(dt,{speed:a.speed,crouch:a.crouchV,pitch:a.pitch,reload:a.reloadT>0?a.reloadT:0});if(a.rig.flash){a.rig.flash.visible=a.flashT>0;if(a.flashT>0)a.rig.flash.rotation.z=Math.random()*6;}}}
 G.noises=G.noises.filter(n=>G.time-n.t<.7);}

/* ================= viewmodel ================= */
let shownGun=null;
function showGun(){if(!P)return;const s=P.slots[P.cur];for(const k in VM.guns)VM.guns[k].visible=false;const g=VM.guns[s.id];g.visible=true;applyAttachments(g,s.id,s.att);shownGun=g;}
const vmS={bobT:0,swayX:0,swayY:0,kick:0,kz:0,sprint:0,lastYaw:0,lastPitch:0,land:0},HIP={ar:[.13,-.15,-.34],smg:[.12,-.135,-.31],sniper:[.13,-.16,-.4],shotgun:[.13,-.145,-.33],pistol:[.11,-.125,-.33]},ADSZ={ar:-.36,smg:-.32,sniper:-.26,shotgun:-.34,pistol:-.36};
const q1=new THREE.Quaternion(),e1=new THREE.Euler(),hR=new V(),hL=new V(),elR=new V(),elL=new V(),shR=new V(.3,-.42,.25),shL=new V(-.3,-.46,.2),gM=new THREE.Matrix4();
function updateViewmodel(dt){const p=P;if(!p||!shownGun||!(G.app==='play'||G.app==='paused')){VM.root.visible=false;return;}const s=p.slots[p.cur],w=WEAPONS[s.id],g=shownGun,u=g.userData;
 VM.root.visible=p.alive&&(G.app==='play'||G.app==='paused')&&!(w.scope&&p.adsV>.92);
 const hs=Math.hypot(p.vel.x,p.vel.z);vmS.bobT+=dt*hs*(p.sprint?1.25:1.6)*(p.onGround?1:0);const ads=p.adsV;
 const dyaw=ang(p.yaw-vmS.lastYaw),dpitch=p.pitch-vmS.lastPitch;vmS.lastYaw=p.yaw;vmS.lastPitch=p.pitch;
 vmS.swayX+=(cl(dyaw*2.2,-.08,.08)-vmS.swayX)*Math.min(1,dt*10);vmS.swayY+=(cl(dpitch*2.2,-.08,.08)-vmS.swayY)*Math.min(1,dt*10);
 vmS.sprint+=((p.sprint?1:0)-vmS.sprint)*Math.min(1,dt*9);vmS.kick+=(-vmS.kick)*Math.min(1,dt*16);if(p.kick){vmS.kick=Math.min(1.4,vmS.kick+1);p.kick=0;}
 const H=HIP[s.id],sy=u.sightY||.08;const bob=hs>.5&&p.onGround?1:0,bx=Math.sin(vmS.bobT)*.011*bob*(1-ads*.85),by=-Math.abs(Math.cos(vmS.bobT))*.009*bob*(1-ads*.85);
 const pos=tv.set(H[0]*(1-ads),H[1]*(1-ads)-sy*ads,H[2]+(ADSZ[s.id]-H[2])*ads);pos.x+=bx+vmS.swayX*(1-ads*.7)*.5;pos.y+=by-vmS.swayY*.3*(1-ads*.7)-p.landT*.03;
 let rx=-vmS.swayY*1.2*(1-ads*.8),ry=vmS.swayX*1.5*(1-ads*.8),rz=0;
 // recoil kick
 const kk=vmS.kick*w.kick*(1-ads*.4);pos.z+=kk*1.4;rx+=kk*2.4;
 // sprint pose
 const sp=vmS.sprint;pos.x+=sp*-.02;pos.y+=sp*-.03;pos.z+=sp*.02;rx+=sp*-.25;ry+=sp*.65;rz+=sp*.2;pos.x+=Math.sin(vmS.bobT)*.02*sp;pos.y+=Math.abs(Math.cos(vmS.bobT))*.015*sp;
 // slide tilt
 if(p.slideT>0){rz+=.25;pos.x-=.02;}
 // reload animation
 let leftHandTarget=null,magOff=0;if(p.reloadT>0){const k=1-p.reloadT/p.reloadDur;if(w.shell){const e=Math.sin(k*Math.PI);rz+=.22*Math.min(1,k*6)*(k<.9?1:(1-k)*10);rx+=.06;leftHandTarget=tv2.set(.03,-.05+e*-.02,-.02-e*.06);}
  else{const tilt=Math.sin(Math.min(1,k*1.25)*Math.PI);rz+=tilt*.32;rx+=tilt*.12;pos.y-=tilt*.025;pos.x-=tilt*.02;if(k>.12&&k<.62)magOff=Math.min(1,(k-.12)/.18)*(k<.45?1:Math.max(0,1-(k-.45)/.17));leftHandTarget=k>.25&&k<.75?tv2.set(0,-.12-magOff*.18,-.08):null;
   if(p.reloadEmpty&&k>.8)rx+=Math.sin((k-.8)*5*Math.PI)*.08;}}
 // swap
 if(p.swapT>0){const k=p.swapT>.28?(.55-p.swapT)/.27:p.swapT/.28;pos.y-=k*.28;rx-=k*.9;}
 // knife / throw / cook
 let knifeK=0;if(p.knifeT>0){knifeK=1-p.knifeT/.55;pos.x+=Math.sin(knifeK*Math.PI)*.12;pos.y-=Math.sin(knifeK*Math.PI)*.15;rz-=Math.sin(knifeK*Math.PI)*.5;}
 const cookK=p.cook>=0?1:p.throwT>0?p.throwT/.45:0;if(cookK){pos.y-=.06*cookK;rx-=.15*cookK;pos.x+=.03*cookK;}
 if(p.boltT>0&&(w.bolt||w.pump)){const k=1-p.boltT/(60/w.rpm);const e=k>.25&&k<.8?Math.sin((k-.25)/.55*Math.PI):0;if(w.bolt){rz+=e*.25;if(u.bolt)u.bolt.position.z=.0+e*.08;}if(w.pump&&u.pump)u.pump.position.z=-.3+e*.09;rx+=e*.05;}else{if(u.pump)u.pump.position.z=-.3;if(u.bolt&&w.bolt)u.bolt.position.z=0;}
 if(u.slide){u.slide.position.z=vmS.kick>.3&&w.id==='pistol'?.035*vmS.kick:0;}
 // ADS sway (aim sway applied to camera separately)
 g.position.copy(pos);g.rotation.set(rx,ry,rz);
 if(u.mag){u.mag.position.y=(u.magY??-.02)-magOff*.22;u.mag.visible=magOff<.98;}
 if(u.flash.visible&&G.time-p.lastShot>.035){u.flash.visible=false;u.flash2.visible=false;}vmFlash.intensity*=Math.exp(-dt*40);
 // arms
 g.updateMatrix();gM.copy(g.matrix);hR.copy(u.hand[0]).applyMatrix4(gM);hL.copy(u.hand[1]).applyMatrix4(gM);
 if(leftHandTarget)hL.lerp(tv3.copy(leftHandTarget).applyMatrix4(gM),.85);
 VM.knife.visible=knifeK>0;if(knifeK>0){const a=Math.sin(knifeK*Math.PI);VM.knife.position.set(.16-knifeK*.3,-.16+a*.06,-.32-a*.12);VM.knife.rotation.set(-.2,.9-knifeK*1.8,-.6);hR.copy(VM.knife.position).add(tv3.set(0,-.01,.05));}
 VM.nade.visible=cookK>0;if(cookK>0){VM.nade.position.set(-.16+(p.cook<0?(1-cookK)*.05:0),-.17+(p.cook>=0?Math.sin(G.time*20)*.002:0),-.35-(p.cook<0?(1-cookK)*.25:0));hL.copy(VM.nade.position).add(tv3.set(.0,-.035,.02));}
 elR.copy(hR).lerp(shR,.5).add(tv3.set(.07,-.1,.02));elL.copy(hL).lerp(shL,.5).add(tv3.set(-.08,-.11,.02));
 VM.pose(VM.arms[0],hR,elR,shR,knifeK>0?VM.knife.quaternion:g.quaternion);VM.pose(VM.arms[1],hL,elL,shL,g.quaternion);
 VM.arms[1].a.visible=true;
 vmCam.fov=62-ads*12;vmCam.updateProjectionMatrix();}

/* ================= camera ================= */
function updateCamera(dt){if(G.app==='attract'||G.app==='menu'||(G.app==='over'&&!P)||G.app==='loadout'){attractCam(dt);return;}
 if(G.app==='over'){attractCam(dt);return;}
 const p=P;if(!p)return;const w=WEAPONS[p.slots[p.cur].id];
 if(!p.alive){const k=Math.min(1,p.deathT*1.5);cam.position.set(p.pos.x,p.pos.y+p.eyeH*(1-k*.8)+.15*k,p.pos.z);cam.rotation.set(p.pitch*(1-k)-k*.3,p.yaw+Math.PI,k*.5,'YXZ');
  if(p.attackerPos){const want=Math.atan2(p.attackerPos.x-p.pos.x,p.attackerPos.z-p.pos.z)+Math.PI;cam.rotation.y=p.yaw+Math.PI+ang(want-(p.yaw+Math.PI))*Math.min(1,p.deathT);}cam.fov=FOV;cam.updateProjectionMatrix();return;}
 // aim sway when ADS
 let swy=0,swp=0;if(p.adsV>.3){const amt=w.sway*(p.slots[p.cur].att.grip?.75:1)*(p.crouchV>.5?.65:1)*(p.steady?.12:1)*p.adsV*D2R*(w.scope?1:.5);swy=(Math.sin(G.time*.9)*1+Math.sin(G.time*2.3)*.4)*amt;swp=(Math.sin(G.time*1.3+1)*.8+Math.cos(G.time*2.9)*.3)*amt;}
 const shk=p.shake*p.shake*.06;cam.position.set(p.pos.x+(Math.random()-.5)*shk,p.pos.y+p.eyeH-p.landT*.06+Math.sin(vmS.bobT*2)*.025*(p.sprint?1:.4)*(p.onGround&&p.speed>1?1:0)+(Math.random()-.5)*shk,p.pos.z+(Math.random()-.5)*shk);
 const roll=(p.slideT>0?.06:0)+Math.sin(vmS.bobT)*.004*(p.sprint?1:0);cam.rotation.set(p.pitch+swp,p.yaw+Math.PI+swy,roll,'YXZ');
 const zoom=1+(w.adsZoom*(p.slots[p.cur].att.reddot&&!w.scope?1.08:1)-1)*Math.pow(p.adsV,w.scope?3:1);const fovT=(FOV+(p.sprint?6:0)+(p.slideT>0?6:0))/zoom;cam.fov+=(fovT-cam.fov)*Math.min(1,dt*18);cam.updateProjectionMatrix();}
let camA=0;
function attractCam(dt){camA+=dt*.035;const L=G.level;const r=L.id==='blacksite'?46:42;cam.position.set(Math.cos(camA)*r,15+Math.sin(camA*.7)*4,Math.sin(camA)*r);cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(Math.cos(camA+.9)*8,2,Math.sin(camA+.9)*8);}

/* ================= match flow ================= */
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);G.saveOpt();snd.init();snd.setVol(opt.vol);
 G.diffI=opt.diff;G.diff=DIFF[opt.diff];if(G.mode&&G.mode.dispose)G.mode.dispose();clearActors();fx.clear();for(const n of G.nades)scene.remove(n.m);G.nades=[];G.noises=[];G.streak={uav:0,air:null,drone:null,euav:0,designate:false};droneMesh.visible=false;markRing.visible=false;jets.forEach(j=>j.visible=false);
 G.time=0;G.over=null;G.marks=[];G.matchXP=0;G.mode=makeMode(G,opt);loadMap(G.mode.map);G.app='play';G.mode.init();if(P){P.ks={uav:0,air:0,drone:0};P.streak=0;}
 HUD.startMatch(G);snd.ambience(G.level.sky==='night'?'night':'dusk',true);document.body.classList.add('playing');if(!G.noLock)lockPointer();lastMenu=false;}
G.start=start;
let lastMenu=true;
function toMenu(){if(G.mode&&G.mode.dispose)G.mode.dispose();G.app='menu';G.over=null;clearActors();fx.clear();for(const n of G.nades)scene.remove(n.m);G.nades=[];G.mode=null;G.marks=[];droneMesh.visible=false;uavMesh.visible=false;markRing.visible=false;
 loadMap('blacksite');G.diff=DIFF[1];G.diffI=1;// attract: squads skirmish in the background
 const L=G.level;for(let t=0;t<2;t++){const pts=t?L.spawns.b:L.spawns.a;G.names(t,4).forEach((n,i)=>{const p=pts[i];makeActor({team:t,x:p[0],z:p[1],role:'tdm',weapon:G.pickWeapon(t),name:n});});}
 G.attract=true;snd.ambience('night',false);HUD.showMenu(G);document.body.classList.remove('playing');if(document.exitPointerLock&&locked)document.exitPointerLock();}
G.toMenu=toMenu;
G.endMatch=(res,title,sub)=>{if(G.over)return;G.over={res,title,sub,t:0};G.phase='end';if(P)P.trigger=false;snd.play(res==='win'?'win':'lose');HUD.banner(G,title,sub||'',res==='win'?'#5fe08a':res==='draw'?'#ffd23f':'#ff3b30',3);};
function finish(){const m=G.mode,me=P;const pts=Math.max(0,Math.round(m.points?m.points():me?me.stats.score:0));const won=G.over.res==='win';
 const before=prog.xp;prog.xp+=pts;try{localStorage.setItem('pxd_frontline_prog',JSON.stringify(prog));}catch(e){}
 const tok=award(pts,won);G.lastAward={pts,won,mode:m.kind,label:m.label,kills:me?me.stats.kills:0,deaths:me?me.stats.deaths:0,heads:me?me.stats.heads:0,diff:G.diff.n,res:G.over.res,xpBefore:before,xpAfter:prog.xp,tok};
 G.app='over';document.body.classList.remove('playing');if(document.exitPointerLock&&locked)document.exitPointerLock();HUD.showOver(G);}
function award(pts,won){const tok=5+Math.min(60,pts/40|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
 const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'frontline';if(+(localStorage.getItem(k)||0)<pts)localStorage.setItem(k,pts);}catch(e){}return tok;}
G.best=()=>{try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'frontline')||0);}catch(e){return 0;}};
G.postScore=()=>{const a=G.lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Frontline Ops\nPoints: ${a.pts||0}\nResult: ${a.res||''}\nMode: ${a.label||a.mode||''} · ${a.diff||''}\nKills: ${a.kills||0} · Deaths: ${a.deaths||0} · Headshots: ${a.heads||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] frontline '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);
 if(G.app==='paused'||G.app==='loadout'){for(const k in edge)delete edge[k];render.vis(dt);return;}
 if(G.app==='menu'||G.app==='over'){G.time+=dt;updateBots(dt);if(G.app==='menu')for(const a of G.actors){if(a.alive)continue;a.respT=(a.respT??4)-dt;if(a.respT<=0){a.respT=undefined;const sp=G.spawnPoint(a.team);G.respawnActor(a,sp.x,sp.z,Math.atan2(-sp.x,-sp.z));}}fx.update(dt,smokeCol());stepNades(dt);G.level.timeU.value=G.time;HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);return;}
 // play
 G.time+=dt;const sdt=G.over?dt*.35:dt;
 if(G.over){G.over.t+=dt;if(G.over.t>3){finish();for(const k in edge)delete edge[k];return;}}
 if(!G.over)updatePlayer(sdt);else{mouse.dx=mouse.dy=0;}
 updateBots(sdt);stepNades(sdt);updateStreaks(sdt);
 if(!G.over&&G.mode)G.mode.update(sdt);
 fx.update(sdt,smokeCol());G.level.timeU.value=G.time;
 if(G.level.helis)for(const h of G.level.helis){h.userData.rotor.rotation.y+=sdt*(h.userData.spin??0);h.userData.tr.rotation.x+=sdt*(h.userData.spin??0)*1.6;h.userData.beacon.visible=(G.time*1.5|0)%2===0;}
 snd.tick(dt);HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);}
function smokeCol(){const s=curPreset.smoke;return{r:s[0],g:s[1],b:s[2]};}
const render={vis(dt){updateViewmodel(dt);updateCamera(dt);}};

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='';
const POST={exposure:1,bloom:.5,bloomThreshold:.9,bloomRadius:.45,vignette:.32,saturation:1.05,grain:.035,aoStrength:.8};
function applyQuality(q){gfx=q;sun.castShadow=q>0;const ms=q>=2?2048:1024;if(sun.shadow.map&&sun.shadow.mapSize.x!==ms){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(ms,ms);R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxStack=null;
 if(G.level){const id=G.level.id;if(built[id])scene.remove(built[id].group);G.level=null;loadMap(id);}}
G.applyQuality=applyQuality;
bindQualityKey(()=>gfx,q=>applyQuality(q));
function renderFrame(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*Math.PI/360));
 const key=w+'x'+h;if(!fxStack){const p=curPreset;fxStack=cinematic(R,scene,cam,{...POST,exposure:p.exp,tint:p.tint,saturation:p.sat,quality:gfx});if(fxStack.composer){fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);}fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 // low-health desaturation
 if(fxStack.grade){const hp=P&&G.app==='play'?P.hp/P.maxHp:1;fxStack.grade.uniforms.sat.value=curPreset.sat*(.35+.65*Math.min(1,hp*1.6));}
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);R.autoClear=false;R.clearDepth();if(VM.root.visible)R.render(vmScene,vmCam);R.autoClear=true;}}
G.render=renderFrame;

/* ================= boot ================= */
HUD.init(G,{WEAPONS,PRIMARIES,ATT,RANKS,rankOf,rankXP,MISSIONS,DIFF});
toMenu();
let last=performance.now();function loop(now){const dt=Math.min(.05,(now-last)/1000);last=now;try{step(dt);renderFrame();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.FRONTLINE={get state(){return G.app==='play'?(G.over?'end':G.player&&!G.player.alive?'dead':'live'):G.app;},get app(){return G.app;},step,render:renderFrame,start,toMenu,G,
 get player(){return P;},get actors(){return G.actors;},get mode(){return G.mode;},get level(){return G.level;},keys,edge,mouse,
 setClock(s){if(G.mode)G.mode.clock=s;},get clock(){return G.mode?G.mode.clock:0;},
 aim(yaw,pitch=0){if(P){P.yaw=yaw;P.pitch=pitch;}},teleport(x,z,yaw){if(P){P.pos.set(x,G.level.ground(x,z,10),z);P.vel.set(0,0,0);if(yaw!==undefined)P.yaw=yaw;}},
 lookAt(a){if(!P||!a)return;eyeOf(P,eye);chestOf(a,tv);P.yaw=Math.atan2(tv.x-eye.x,tv.z-eye.z);P.pitch=Math.atan2(tv.y-eye.y,Math.hypot(tv.x-eye.x,tv.z-eye.z));P.recP=P.recY=0;},
 enemies(){return G.actors.filter(a=>a.alive&&a.team===1);},allies(){return G.actors.filter(a=>a.alive&&a.team===0&&!a.isPlayer);},
 killEnemies(n=99){let k=0;for(const a of G.actors.slice())if(a.alive&&a.team===1&&k<n){k++;damage(a,999,P,'body',new V(0,0,1),'TEST');}return k;},
 hurtPlayer(n=40){if(P)damage(P,n,G.actors.find(a=>a.team===1&&a.alive)||null,'body',new V(0,0,1),'TEST');},god(on=true){if(P)P.god=on;},
 objective(){return G.mode&&G.mode.objText?G.mode.objText():null;},completeObjective(){if(G.mode&&G.mode.skip)G.mode.skip();},
 setQuality:applyQuality,pause,noLock(on=true){G.noLock=on;},streak:G.streak,useStreak,giveStreaks(){if(P){P.ks={uav:1,air:1,drone:1};}},
 get stats(){return P?P.stats:null;},get prog(){return prog;},get lastAward(){return G.lastAward;},cam,VM,fx,R,scene,vmScene,vmCam,hemi,sun,PRESET};
