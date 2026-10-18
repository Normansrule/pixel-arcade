// FRONTLINE OPS — full 3D modern military shooter. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Pass,FullScreenQuad} from '../vendor/jsm/postprocessing/Pass.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {makeTextures} from './tex.js';
import {MAPS,MAP_LIST,LOOK} from './maps.js';
import {buildScene,makeSky,STEP,makeJet} from './world.js';
import {makeKit,Rig,hitActor,setKitDetail} from './actors.js';
import {WEAPONS,PRIMARIES,ATT,SLOTS,handling,pattern,dmgAt,buildViewmodel,applyAttachments,rankOf,rankXP,RANKS} from './guns.js';
import {FX} from './fx.js';
import {DIFF,newBrain,drive,eyeOf,chestOf} from './ai.js';
import {Sound} from './sound.js';
import {makeMode,MISSIONS} from './modes.js';
import * as HUD from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {postButton} from '../js/kit3d/ui.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,rr=(a,b)=>a+Math.random()*(b-a),ang=a=>Math.atan2(Math.sin(a),Math.cos(a));
const D2R=Math.PI/180,GRAV=16,PR=.35,EYE=1.62,CEYE=1.05,FOV=68,PI=Math.PI;
const ALLY_N=['REYES','HOLT','MBEKI','STROUD','VANCE','IKEDA','NOVAK','CRUZ','LUND','FARRAH','OKORO','DANE'],FOE_N=['KESTREL','RAZOR','SABLE','VIPER','JACKAL','GRIM','HUSK','ONYX','TALON','WRAITH','BRANDO','SPECTRE','ROOK','MAKO','DUST','CINDER'];

/* ================= renderer, scenes, cameras ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(FOV,1,.05,1500);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(56,1,.01,10);
const hemi=new THREE.HemisphereLight(0xffffff,0x202020,.6),sun=new THREE.DirectionalLight(0xffffff,2);sun.castShadow=true;scene.add(hemi,sun,sun.target);
const bounce=new THREE.DirectionalLight(0xffffff,0);scene.add(bounce,bounce.target);// sunlit ground bouncing back up into walls and faces (MEDIUM+)
const vmHemi=new THREE.HemisphereLight(0xffffff,0x222222,.8),vmKey=new THREE.DirectionalLight(0xffffff,1.4),vmFlash=new THREE.PointLight(0xffaa55,0,3,1.5),vmRim=new THREE.DirectionalLight(0xffffff,1);vmKey.position.set(-1,2,1);vmFlash.position.set(.1,-.05,-.7);vmRim.position.set(2,.5,-1.5);const vmFill=new THREE.DirectionalLight(0xffffff,.7);vmFill.position.set(.9,-.25,1);const WHITE=new THREE.Color(1,1,1);vmScene.add(vmHemi,vmKey,vmFlash,vmRim,vmFill);
const TX=makeTextures();makeKit(TX);
const fx=new FX(scene,TX);const snd=new Sound();fx.brass.onBounce=(q,small)=>snd.play('clink',small?1.5:.7,panOf(q));fx.brass.floor=(x,z,y)=>G.level?G.level.ground(x,z,y,.03):0;const VM=buildViewmodel(TX);vmCam.add(VM.root);vmScene.add(vmCam);
const nadeGeo=new THREE.SphereGeometry(.05,10,8),nadeMat=new THREE.MeshStandardMaterial({color:0x4a5034,roughness:.6}),smokeMat=new THREE.MeshStandardMaterial({color:0x8a9098,roughness:.5});
const markRing=new THREE.Mesh(new THREE.RingGeometry(3.2,3.7,48),new THREE.MeshBasicMaterial({color:new THREE.Color(5,.6,.2),transparent:true,opacity:.85,depthWrite:false,side:THREE.DoubleSide,fog:false}));markRing.rotation.x=-PI/2;markRing.visible=false;scene.add(markRing);
const laser=new THREE.Mesh(new THREE.CylinderGeometry(.012,.012,1,6),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.4,.2),transparent:true,opacity:.7,depthWrite:false}));laser.visible=false;scene.add(laser);
const tacBeam=new THREE.Mesh(new THREE.CylinderGeometry(.004,.004,1,5),new THREE.MeshBasicMaterial({color:new THREE.Color(.25,2.2,.35),transparent:true,opacity:.35,depthWrite:false,blending:THREE.AdditiveBlending}));tacBeam.visible=false;scene.add(tacBeam);
const tacDot=new THREE.Mesh(new THREE.SphereGeometry(.028,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(.6,9,1),fog:false}));tacDot.visible=false;scene.add(tacDot);
const jets=[makeJet(),makeJet()];jets.forEach(j=>scene.add(j));
const bombGeo=new THREE.CylinderGeometry(.12,.12,1.2,10);bombGeo.rotateX(PI/2);const bombMat=new THREE.MeshStandardMaterial({color:0x3a3e38,roughness:.5,metalness:.4});const bombs=[];
function mkDrone(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0x2a2d30,roughness:.4,metalness:.6});const body=new THREE.Mesh(new THREE.BoxGeometry(.6,.18,.7),m);g.add(body);const rot=[];
 for(const[x,z]of[[.5,.5],[-.5,.5],[.5,-.5],[-.5,-.5]]){const arm=new THREE.Mesh(new THREE.BoxGeometry(.06,.05,.7),m);arm.position.set(x/2,0,z/2);arm.rotation.y=Math.atan2(x,z);g.add(arm);const r=new THREE.Mesh(new THREE.CylinderGeometry(.28,.28,.01,16),new THREE.MeshBasicMaterial({color:0x111111,transparent:true,opacity:.45}));r.position.set(x,.09,z);g.add(r);rot.push(r);}
 const gun=new THREE.Mesh(new THREE.CylinderGeometry(.03,.03,.35,8),m);gun.rotation.x=PI/2;gun.position.set(0,-.14,.2);g.add(gun);const led=new THREE.Mesh(new THREE.SphereGeometry(.05,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(6,.3,.2)}));led.position.set(0,-.05,.36);g.add(led);
 const led2=new THREE.Mesh(new THREE.SphereGeometry(.04,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(.2,4,1)}));led2.position.set(.5,.06,-.5);g.add(led2);g.userData={rot,led};g.visible=false;scene.add(g);return g;}
const droneMesh=mkDrone();
const uavMesh=(()=>{const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0x8a8e94,roughness:.5,metalness:.4});const a=new THREE.Mesh(new THREE.CylinderGeometry(.3,.35,4.6,10),m);a.rotation.x=PI/2;g.add(a);const w=new THREE.Mesh(new THREE.BoxGeometry(11,.08,.9),m);g.add(w);const t=new THREE.Mesh(new THREE.BoxGeometry(2.6,.06,.6),m);t.position.z=-2.1;g.add(t);
 const l=new THREE.Mesh(new THREE.SphereGeometry(.18,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(8,.4,.3)}));l.position.y=-.35;g.add(l);g.userData.l=l;g.visible=false;scene.add(g);return g;})();

/* ================= shared game context ================= */
const G={THREE,scene,cam,fx,snd,TX,level:null,actors:[],player:null,time:0,diff:DIFF[1],diffI:1,noises:[],pathBudget:4,night:false,mode:null,marks:[],app:'menu',phase:'live',over:null,nades:[],opt:null,streak:{uav:0,air:null,drone:null,euav:0},prog:null,clockScale:1,cine:null};
window.__G=G;
let opt={mode:'tdm',map:'sandgate',mission:0,diff:1,sens:1,vol:.8};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_frontline_opt'))||{});}catch(e){}if(!MAPS[opt.map])opt.map='sandgate';if(!['campaign','tdm','dom','hp','survival'].includes(opt.mode))opt.mode='tdm';G.opt=opt;
let load={primary:'ar',att:{ar:{reddot:1},smg:{},lmg:{},sniper:{},shotgun:{}}};try{const l=JSON.parse(localStorage.getItem('pxd_frontline_load'));if(l&&WEAPONS[l.primary])load=Object.assign(load,l);}catch(e){}G.load=load;
let prog={xp:0};try{Object.assign(prog,JSON.parse(localStorage.getItem('pxd_frontline_prog'))||{});}catch(e){}G.prog=prog;
G.matchXP=0;G.xpGain=(n)=>{const r0=rankOf(prog.xp+G.matchXP);G.matchXP+=n;const r1=rankOf(prog.xp+G.matchXP);if(r1>r0){HUD.banner(G,'PROMOTED',`RANK ${r1+1} · ${RANKS[r1]}`,'#ffd23f',2.6);snd.play('rank');}};
G.saveLoad=()=>{try{localStorage.setItem('pxd_frontline_load',JSON.stringify(load));}catch(e){}};
G.saveOpt=()=>{try{localStorage.setItem('pxd_frontline_opt',JSON.stringify(opt));}catch(e){}};

/* ================= maps + lighting ================= */
const levels={},built={},envCache={};let sky=null,look=null,gfx=quality(),fxStack=null,fxSize='';
function loadMap(id){let L=levels[id];if(!L)L=levels[id]=MAPS[id]();if(G.level===L&&built[id]&&built[id].q===gfx)return L;
 if(G.level&&built[G.level.id])scene.remove(built[G.level.id].group);
 if(!built[id]||built[id].q!==gfx){if(built[id])disposeGroup(built[id].group);built[id]=buildScene(L,TX,gfx);built[id].q=gfx;}
 scene.add(built[id].group);G.level=L;look=L.look;
 scene.fog=new THREE.FogExp2(look.fog.c,look.fog.d);scene.background=new THREE.Color(look.fog.c);hemi.color.set(look.hemi.s);hemi.groundColor.set(look.hemi.g);hemi.intensity=look.hemi.i*(gfx>0?look.hk??1:1);sun.color.set(look.sun.c);sun.intensity=look.sun.i*(gfx>0?look.kk??1:1);
 G.sunDir=new V(...look.sun.dir).normalize();sun.shadow.bias=-.0005;sun.shadow.normalBias=.04;
 bounce.color.set(look.sky.ground??look.fog.c).lerp(new THREE.Color(look.sun.c),.3);bounce.intensity=gfx>0?look.sun.i*.22*(look.bounce??1):0;bounce.position.set(-G.sunDir.x,-.35,-G.sunDir.z).multiplyScalar(50);bounce.target.position.set(0,0,0);
 if(sky)scene.remove(sky);sky=makeSky(look);scene.add(sky);
 if(!envCache[id]){const s=new THREE.Scene();s.add(makeSky(look));s.add(new THREE.HemisphereLight(look.hemi.s,look.hemi.g,1));{const sd=new V(...look.sun.dir).normalize();const sm=new THREE.Mesh(new THREE.SphereGeometry(4,12,8),new THREE.MeshBasicMaterial({color:new THREE.Color(look.sun.c).multiplyScalar(look.lampsOn?3:9)}));sm.position.copy(sd).multiplyScalar(60);s.add(sm);const gd=new THREE.Mesh(new THREE.CircleGeometry(90,24),new THREE.MeshBasicMaterial({color:new THREE.Color(look.sky.ground??look.fog.c).multiplyScalar(.55)}));gd.rotation.x=-PI/2;gd.position.y=-6;s.add(gd);}const pm=new THREE.PMREMGenerator(R);envCache[id]=pm.fromScene(s,.04).texture;pm.dispose();}
 scene.environment=envCache[id];scene.environmentIntensity=look.env;vmScene.environment=envCache[id];vmScene.environmentIntensity=1.45;
 vmHemi.color.set(look.hemi.s).lerp(WHITE,.35);vmHemi.groundColor.set(look.hemi.g).lerp(WHITE,.2);vmHemi.intensity=Math.max(1.15,look.hemi.i*.8+.3);vmKey.color.set(look.sun.c).lerp(WHITE,.55);vmKey.intensity=Math.min(3,Math.max(2.2,look.sun.i*.75));vmKey.position.set(-.55,1.2,.9);vmRim.intensity=Math.max(1.2,look.sun.i*.5);vmRim.position.set(1.6,.7,-1.4);vmRim.color.set(look.hemi.s).lerp(WHITE,.3);vmFill.color.set(look.sky.ground??look.fog.c).lerp(WHITE,.5);vmFill.intensity=.7;
 fx.dustK=look.lampsOn?.75:1.05;fx.ground=id==='sandgate'?'sand':id==='northwatch'?'snow':'concrete';fx.smoke.U.uFog.value.set(look.fog.c);fx.smoke.U.uFogD.value=look.fog.d;fx.smoke.U.uLight.value.set(look.hemi.s).lerp(new THREE.Color(look.sun.c),.5).multiplyScalar(look.lampsOn?.7:1);
 R.toneMappingExposure=look.exp;fxStack=null;HUD.mapChanged(G);return L;}
function disposeGroup(g){g.traverse(o=>{if(o.geometry)o.geometry.dispose();});}
function updateShadow(){if(!G.sunDir)return;const c=cam.position,fwd=tv.set(0,0,-1).applyQuaternion(cam.quaternion);fwd.y=0;if(fwd.lengthSq()>1e-4)fwd.normalize();const ext=gfx>=2?36:44;
 const tx=Math.round((c.x+fwd.x*ext*.45)*2)/2,tz=Math.round((c.z+fwd.z*ext*.45)*2)/2;sun.target.position.set(tx,0,tz);sun.position.set(tx,0,tz).addScaledVector(G.sunDir,120);
 const sc=sun.shadow.camera;if(sc.right!==ext){Object.assign(sc,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:300});sc.updateProjectionMatrix();}
 if(sky)sky.position.copy(c);}

/* ================= actors ================= */
let nid=1;
function makeActor(o){const L=G.level;let x=o.x,z=o.z;if(!o.y&&!L.free(x,z)){const c=L.nearestFree(x,z);if(c>=0){x=c%L.N-L.half+.5;z=(c/L.N|0)-L.half+.5;}}
 const w=o.weapon?WEAPONS[o.weapon]:null;const a={id:nid++,name:o.name||'?',team:o.team,isPlayer:!!o.player,vip:!!o.vip,pos:new V(x,o.y||0,z),vel:new V(),move:new V(),yaw:o.yaw??(o.team?0:PI),pitch:0,hp:o.hp||100,maxHp:o.hp||100,alive:true,
  crouch:false,crouchV:0,speed:0,weapon:w,mag:w?w.mag:0,reloadT:0,reloadDur:1,fireT:0,nades:o.nades??1,firingT:0,flashT:0,hurtT:-99,stats:{kills:0,deaths:0,score:0,heads:0,assists:0,shots:0,hits:0},streak:0,respawnT:-1,deadT:0,dmgBy:new Map(),tag:o.tag||null,att:o.att||{},spawnY:o.y||0,smokes:o.player?0:1};
 if(!a.isPlayer){a.rig=new Rig(o.vip?'vip':a.team===0?'ally':'enemy',Math.random());a.rig.root.position.copy(a.pos);a.rig.root.rotation.y=a.yaw;scene.add(a.rig.root);a.ai=newBrain(o.role||'tdm',o);a.ai.baseYaw=a.yaw;if(o.fol)a.ai.fol=o.fol;}
 G.actors.push(a);return a;}
G.spawnBot=o=>makeActor({nades:1,...o});
function removeActor(a){if(a.rig)scene.remove(a.rig.root);const i=G.actors.indexOf(a);if(i>=0)G.actors.splice(i,1);}
G.removeActor=removeActor;
function clearActors(){for(const a of G.actors.slice())removeActor(a);G.actors=[];G.player=null;}
G.pickWeapon=(team,role)=>{const r=Math.random();if(role==='hunt')return r<.4?'shotgun':r<.75?'smg':'ar';if(team===1)return r<.42?'ar':r<.68?'smg':r<.8?'lmg':r<.9?'shotgun':'sniper';return r<.5?'ar':r<.75?'smg':r<.88?'lmg':'shotgun';};
G.names=(team,n)=>{const src=(team?FOE_N:ALLY_N).slice().sort(()=>Math.random()-.5);return src.slice(0,n);};
G.spawnPoint=(team,list)=>{const L=G.level,pts=list||(team===0?L.spawns.a:L.spawns.b);let best=null,bs=-1;for(const p of pts){let md=1e9;for(const b of G.actors)if(b.alive&&b.team!==team)md=Math.min(md,Math.hypot(b.pos.x-p[0],b.pos.z-p[1]));const s=Math.min(md,60)+Math.random()*12;if(s>bs){bs=s;best=p;}}
 return{x:best[0]+rr(-1.5,1.5),z:best[1]+rr(-1.5,1.5)};};
G.respawnActor=(a,x,z,yaw)=>{const L=G.level;if(!L.free(x,z)){const c=L.nearestFree(x,z);if(c>=0){x=c%L.N-L.half+.5;z=(c/L.N|0)-L.half+.5;}}
 a.pos.set(x,a.spawnY||0,z);a.vel.set(0,0,0);a.hp=a.maxHp;a.alive=true;a.dmgBy.clear();a.streak=0;a.respawnT=-1;a.deadT=0;a.crouchV=0;a.reloadT=0;if(a.weapon)a.mag=a.weapon.mag;a.yaw=yaw??a.yaw;
 if(a.rig){a.smokes=1;a.rig.root.visible=true;const o=a.ai;a.ai=newBrain(o.role,{post:o.post,route:o.route,hold:o.hold,fol:o.fol,hunt:o.hunt,slot:o.slot,static:o.static,squad:o.squad});a.ai.baseYaw=a.yaw;a.rig.root.position.copy(a.pos);}
 if(a.isPlayer)resetPlayerState();};

/* ================= combat ================= */
const tv=new V(),tv2=new V(),tv3=new V(),eye=new V(),hitOut={t:0,i:-1,n:new V()};
function surfaceOf(i){if(i===-2)return'ground';const b=G.level.solid[i];if(!b)return'concrete';const m=b.mat;return m==='container'||m==='truck'||m==='car'||m==='jeep'||m==='pickup'||m==='tanker'||m==='forklift'||m==='fueltank'||m==='dumpster'||m==='barrel'||m==='gen'||m==='lamp'||m==='trim'?'metal':m==='crate'||m==='crateS'||m==='crateL'||m==='pallet'||m==='cable'?'wood':m;}
function shootRay(sh,o,d,w,range=220,pellet=1,kind){const L=G.level;L.ray(o.x,o.y,o.z,d.x,d.y,d.z,range,hitOut);let best=hitOut.t,ha=null,part=null;const n=hitOut.n.clone(),si=hitOut.i;
 for(const b of G.actors){if(!b.alive||b===sh||b.team===sh.team||b.ghost)continue;const h=hitActor(b,o.x,o.y,o.z,d.x,d.y,d.z,best);if(h&&h.t<best){best=h.t;ha=b;part=h.part;}}
 const p=new V().copy(o).addScaledVector(d,Math.min(best,range));
 if(ha){let dm=dmgAt(w,best,sh.att)*(part==='head'?w.head:part==='legs'?.85:1);if(!sh.isPlayer)dm*=ha.isPlayer?G.diff.dmg:ha.vip?.42:.9;if(sh.isPlayer&&!kind)sh.stats.hits+=1/pellet;
  fx.blood(p,d);damage(ha,dm,sh,part,d,kind==='streak'?'DRONE':w.name,kind);}
 else if(best<range)fx.impact(p,n,surfaceOf(si));
 return{p,a:ha,part,t:best};}
function damage(v,dm,att,part,dir,wname,kind){if(!v.alive||!(G.app==='play'||G.app==='menu'))return;if(v.god)return;v.hp-=dm;v.hurtT=G.time;if(att&&att!==v)v.dmgBy.set(att.id,(v.dmgBy.get(att.id)||0)+dm);
 if(v.ai&&att&&att.team!==v.team){const ai=v.ai;ai.lastAttacker=att;ai.hurtT=G.time;ai.alerted=true;ai.last=att.pos.clone();ai.lastT=G.time;if(!ai.seen)ai.target=att;}
 if(v.rig)v.rig.flinch=1;
 if(v.isPlayer){HUD.hurt(G,att,dm);snd.play('hurt');P.shake=Math.max(P.shake,.25);P.punch+=.04*(Math.random()<.5?-1:1);P.punchP+=.03;}
 if(att&&att.isPlayer&&v!==att){HUD.hitmark(part==='head',v.hp<=0);snd.play(part==='head'?'head':'hit');}
 if(v.hp<=0)kill(v,att,{part,wname,kind,dir});}
G.damage=damage;
function kill(v,att,info){v.alive=false;v.hp=0;v.stats.deaths++;v.streak=0;v.deadT=0;v.dieT=G.time;
 if(v.rig){const f=tv.set(Math.sin(v.yaw),0,Math.cos(v.yaw));v.rig.dieDir=info.dir&&f.dot(info.dir)>0?-1:1;v.rig.flash.visible=false;}
 const head=info.part==='head';
 if(att&&att!==v&&att.team!==v.team){att.stats.kills++;att.stats.score+=100+(head?50:0);if(head)att.stats.heads++;att.streak++;
  if(att.isPlayer){HUD.xp(G,head?150:100,head?'HEADSHOT':info.kind==='knife'?'MELEE':info.kind==='frag'?'GRENADE':info.kind==='streak'?'STREAK':'KILL');HUD.killConfirm(G,v,head,info.kind);streakCheck();if(info.kind!=='streak')snd.play('killc');
   // medals: multi-kills, long shots, revenge, first blood
   const md=[];const P_=att;P_.chain=G.time-(P_.lastKillT??-99)<4?(P_.chain||1)+1:1;P_.lastKillT=G.time;if(P_.chain===2)md.push(['DOUBLE KILL',50]);else if(P_.chain===3)md.push(['TRIPLE KILL',100]);else if(P_.chain>=4)md.push(['MULTI KILL',150]);
   const dist=Math.hypot(v.pos.x-att.pos.x,v.pos.z-att.pos.z);if(dist>45&&!info.kind)md.push(['LONGSHOT',50]);if(P_.nemesis&&P_.nemesis===v.id){md.push(['REVENGE',50]);P_.nemesis=null;}
   if(!G.firstBlood&&G.mode&&G.mode.kind!=='campaign'&&G.mode.kind!=='survival')md.push(['FIRST BLOOD',100]);if(att.streak===5)md.push(['ON A ROLL',75]);
   for(const[n,x]of md){HUD.xp(G,x,n);att.stats.score+=x;}if(md.length)HUD.medal(G,md.map(m=>m[0]));HUD.killMark(G,v.pos);}
  G.firstBlood=true;
  if(att.ai&&att.team===0&&Math.random()<.35)G.callout(att,'down');
  if(att.team===1&&!att.isPlayer&&att.streak===4&&G.mode&&(G.mode.kind==='tdm'||G.mode.kind==='dom'||G.mode.kind==='hp')&&G.streak.euav<=0){G.streak.euav=20;HUD.ann(G,'ENEMY UAV OVERHEAD',3);snd.play('radio');}}
 for(const[id,d]of v.dmgBy){if(att&&id===att.id||d<20)continue;const b=G.actors.find(x=>x.id===id);if(b&&b.team!==v.team){b.stats.assists++;b.stats.score+=25;if(b.isPlayer)HUD.xp(G,25,'ASSIST');}}
 HUD.feed(G,att,v,info.wname||'',head);
 if(v.team===0&&!v.isPlayer&&!v.vip){const buddy=G.actors.find(b=>b.alive&&b.team===0&&b.ai&&b!==v);if(buddy)G.callout(buddy,'mandown',v);}
 if(G.mode&&G.mode.onKill)G.mode.onKill(v,att,info);
 if(v.isPlayer)playerDied(att,info.wname);}
G.kill=kill;
function explode(p,owner,r=7.5,max=200,kind='frag'){fx.explode(p,r>9?1.4:1,p.y<2.5);const d=cam.position.distanceTo(p);snd.play('boom',Math.max(.15,1-d/90),panOf(p));if(P&&P.alive){const k=Math.max(0,1-d/30);P.shake=Math.max(P.shake,k*1.3);if(d<10)HUD.flash(.35*(1-d/10));}
 for(const a of G.actors.slice()){if(!a.alive)continue;chestOf(a,tv);const dd=tv.distanceTo(p);if(dd>r)continue;if(owner&&a.team===owner.team&&a!==owner)continue;tv2.copy(p);tv2.y+=.35;const los=G.level.los(tv2,tv);
  let dm=max*(1-dd/r)*(los?1:.22);if(a===owner)dm*=.6;if(!owner||!owner.isPlayer)dm*=a.isPlayer?Math.max(.55,G.diff.dmg):1;if(dm>2)damage(a,dm,owner,'body',tv3.subVectors(tv,p).normalize(),kind==='air'?'AIRSTRIKE':'FRAG',kind==='air'?'streak':'frag');}
 G.noises.push({p:p.clone(),r:60,team:-1,t:G.time,src:owner});}
G.explode=explode;G.shake=k=>{if(P)P.shake=Math.max(P.shake,k);};
function panOf(p){if(!P)return 0;tv.subVectors(p,cam.position);const rx=-Math.cos(P.yaw),rz=Math.sin(P.yaw);return cl((tv.x*rx+tv.z*rz)/(tv.length()+1)*1.1,-1,1);}

/* ---------- bots shooting ---------- */
const bEye=new V(),bAim=new V(),bDir=new V(),bPerp=new V(),bUp=new V(0,1,0);
G.botFire=(a,t,err)=>{const w=a.weapon;eyeOf(a,bEye);chestOf(t,bAim);if(a.ai.headAim)bAim.y+=.42;bDir.subVectors(bAim,bEye).normalize();
 const muzzle=tv3.copy(bEye).addScaledVector(bDir,.75);muzzle.x+=-Math.cos(a.yaw)*.1;muzzle.z+=Math.sin(a.yaw)*.1;muzzle.y-=.16;
 const n=w.pellets?6:1;let res=null;for(let i=0;i<n;i++){const e=(err+(w.pellets?3.5*D2R:0))*Math.sqrt(-2*Math.log(Math.random()+1e-6))*.6,th=Math.random()*6.283;bPerp.crossVectors(bDir,bUp).normalize();const p2=new V().crossVectors(bPerp,bDir);
  const d=new V().copy(bDir).addScaledVector(bPerp,Math.cos(th)*Math.tan(e)).addScaledVector(p2,Math.sin(th)*Math.tan(e)).normalize();res=shootRay(a,bEye,d,w,200,n);
  if(P&&P.alive&&!res.a&&t!==P){eyeOf(P,eye);tv.subVectors(eye,bEye);const proj=tv.dot(d);if(proj>0&&proj<res.t){const cdist=tv.addScaledVector(d,-proj).length();if(cdist<1.4)snd.play('whiz',1,panOf(res.p));}}}
 a.mag--;a.fireT=w.auto?60/w.rpm*1.15:w.bolt?1.8:w.pump?1.0:.32;a.flashT=.05;a.firingT=.6;if(a.rig)a.rig.kick=1;
 const supp=a.att&&a.att.supp;if(!supp)G.noises.push({p:a.pos.clone(),r:55,team:a.team,t:G.time,src:a});
 if(Math.random()<.75)fx.tracers.fire(muzzle,res.p,400,2.8,.9,a.team?[6,2.6,1.2]:[5,4.4,2.4]);const dist=cam.position.distanceTo(a.pos);if(dist<45&&Math.random()<.5)fx.lights.flash(muzzle,0xffa050,6,9,.06);
 if(dist<22&&!w.pellets&&!w.bolt){const cy=Math.cos(a.yaw),sy=Math.sin(a.yaw);tv.copy(muzzle).addScaledVector(bDir,-.55);bPerp.set(-cy*(1.6+Math.random()),1.4+Math.random()*.8,sy*(1.6+Math.random()));fx.brass.eject(tv,bPerp);}
 if(dist<140)snd.shot(w.snd,supp,dist,panOf(a.pos),false);};
G.popSmoke=a=>{const th=a.ai&&a.ai.last?a.ai.last:null;const d=th?tv.subVectors(th,a.pos).setY(0).normalize():tv.set(Math.sin(a.yaw),0,Math.cos(a.yaw));eyeOf(a,tv2);spawnNade(tv2,new V(d.x*7,3.5,d.z*7),a,'smoke',1.1);if(a.team===0)G.callout(a,'smoke');};
G.reload=a=>{a.reloadDur=a.reloadT=a.weapon.reload*1.25*(a.weapon.shell?a.weapon.mag*.5:1);};
G.throwNade=(a,target)=>{eyeOf(a,tv);const dx=target.x-tv.x,dz=target.z-tv.z,dd=Math.hypot(dx,dz),t=cl(dd/14,.6,1.6);const v=new V(dx/t,(target.y-tv.y)/t+.5*GRAV*t,dz/t);spawnNade(tv,v,a,'frag',Math.max(t+.4,2.2));if(a.rig)a.rig.throwAnim();if(a.team===0)G.callout(a,'frag');};
let callT=0;const CALL={contact:['Contact! {d}','Tango spotted, {d}','Enemy {d}!','Eyes on hostile, {d}'],reload:['Reloading!','Changing mags, cover me!'],flankL:['Flanking left!','Moving left flank.'],flankR:['Flanking right!','Going around right.'],frag:['Frag out!','Grenade out!'],smoke:['Popping smoke!','Smoke out, moving!'],down:['Tango down.','Got him.','Enemy down!'],mandown:['Man down! {n} is down!','We lost {n}!']};
G.callout=(a,k,o)=>{if(G.app!=='play'||!P||a.team!==0||a.isPlayer)return;if(G.time-callT<1.4||G.time-(a.callT||-9)<4)return;if(k==='contact'&&o&&!dirWord(o))return;const Ls=CALL[k];if(!Ls)return;callT=G.time;a.callT=G.time;
 let s=Ls[Math.random()*Ls.length|0];s=s.replace('{d}',o?dirWord(o):'').replace('{n}',o&&o.name?o.name:'');HUD.radio(G,a.name,s);snd.play('radio');};
function dirWord(o){if(!P)return'';const dx=o.pos.x-P.pos.x,dz=o.pos.z-P.pos.z;const a=ang(Math.atan2(dx,dz)-P.yaw);const c=Math.round(-a/(PI/6));const h=((c%12)+12)%12||12;return h+" o'clock";}

/* ================= grenades ================= */
function spawnNade(p,v,owner,kind,fuse){const m=new THREE.Mesh(nadeGeo,kind==='smoke'?smokeMat:nadeMat);m.castShadow=true;m.position.copy(p);scene.add(m);G.nades.push({p:p.clone(),v,owner,kind,fuse,m,b:0,rest:false});if(kind==='frag')snd.play('throw');}
function stepNades(dt){const L=G.level;for(let i=G.nades.length-1;i>=0;i--){const n=G.nades[i];n.fuse-=dt;if(!n.rest){n.v.y-=GRAV*dt;const op=tv.copy(n.p);n.p.addScaledVector(n.v,dt);
  const bi=L.inside(n.p.x,n.p.y,n.p.z);if(bi>=0){const B=L.B,k=bi*6;if(op.x<=B[k]||op.x>=B[k+3]){n.p.x=op.x;n.v.x*=-.4;}else if(op.z<=B[k+2]||op.z>=B[k+5]){n.p.z=op.z;n.v.z*=-.4;}else{n.p.y=op.y;n.v.y*=-.3;n.v.x*=.6;n.v.z*=.6;}if(n.b++<6)snd.play('clink',1.2,panOf(n.p));}
  if(n.p.y<.06){n.p.y=.06;if(Math.abs(n.v.y)>1.2&&n.b++<6)snd.play('clink',1,panOf(n.p));n.v.y*=-.32;n.v.x*=.62;n.v.z*=.62;if(Math.abs(n.v.y)<.5&&n.v.x*n.v.x+n.v.z*n.v.z<.2)n.rest=true;}}
  n.m.position.copy(n.p);n.m.rotation.x+=dt*8;if(n.kind==='smoke'&&n.fuse<.9&&Math.random()<.5)fx.trail(n.p,.8,.25,.8);
  if(n.fuse<=0){scene.remove(n.m);G.nades.splice(i,1);if(n.kind==='frag')explode(n.p.clone().setY(Math.max(.3,n.p.y)),n.owner);else{fx.smokeCloud(n.p.clone(),14);snd.play('smoke',1,panOf(n.p));}}}}

/* ================= player ================= */
let P=null;
function makePlayer(x,z,yaw){const p=makeActor({player:true,team:0,x,z,yaw,name:'YOU',hp:100});P=G.player=p;
 p.slots=[{id:load.primary,att:{...(load.att[load.primary]||{})}},{id:'pistol',att:{...(load.att.pistol||{})}}];for(const s of p.slots){const w=WEAPONS[s.id];s.h=handling(w,s.att);s.mag=magSize(s);s.res=w.res;}
 resetPlayerState();return p;}
function resetPlayerState(){const p=P;Object.assign(p,{onGround:true,crouch:false,crouchV:0,sprint:false,slideT:0,mantle:null,eyeH:EYE,cur:0,fireT:0,reloadT:0,reloadDur:0,swapT:0,swapTo:-1,boltT:0,adsV:0,shotI:0,bloom:0,recP:0,recY:0,lastShot:-9,
  frags:2,smokes:1,cook:-1,throwT:0,knifeT:0,knifeHit:false,breath:4,shake:0,stepD:0,fall:0,kick:0,interact:0,ks:p.ks||{uav:0,air:0,drone:0},hurtT:-99,deathT:0,landT:0,trigger:false,attackerPos:null,firingT:0,punch:0,punchP:0,camKick:0,att:p.slots?p.slots[0].att:{}});
 for(const s of p.slots){s.mag=magSize(s);s.res=WEAPONS[s.id].res;}p.weapon=WEAPONS[p.slots[0].id];p.att=p.slots[0].att;showGun();}
G.makePlayer=makePlayer;
function curW(){return WEAPONS[P.slots[P.cur].id];}
function magSize(s){return Math.round(WEAPONS[s.id].mag*(s.att.ext?1.5:1));}
G.refill=()=>{if(!P)return;for(const s of P.slots){s.mag=magSize(s);s.res=WEAPONS[s.id].res;}P.frags=2;P.smokes=1;};
G.placePlayer=(x,z,yaw)=>{G.respawnActor(P,x,z,yaw);P.pitch=0;};

/* ---------- input ---------- */
const I=controls(canvas,{canLock:()=>G.app==='play'&&!G.noLock,clickThrough:true,menu:()=>G.app==='play',look:e=>I.locked||(G.app==='play'&&e.buttons&&!G.noLock),
 onLock:(on,was)=>{if(was&&!on&&G.app==='play'&&!G.over)pause(true);},onDown:()=>{if(G.app!=='play')return true;if(G.cine){endCine();return true;}},
 onWheel:()=>{if(G.app==='play'&&P&&P.alive&&!G.cine)queueSwap(1-P.cur);},
 onKey:e=>{if(['Space','Tab','ArrowUp','ArrowDown','KeyQ','ControlLeft'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Tab')e.preventDefault();
 if(G.cine&&G.app==='play'&&(e.code==='Space'||e.code==='Enter')){delete edge[e.code];endCine();return;}
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play'&&!G.over)pause(true);}}});
const {keys,edge,mouse}=I;
function pause(on){if(on&&G.app==='play'){G.app='paused';HUD.showPause(true);document.body.classList.remove('playing');I.unlock();}
 else if(!on&&G.app==='paused'){G.app='play';HUD.showPause(false);document.body.classList.add('playing');if(!G.noLock)I.lock();}}
G.pause=pause;
const pad={prev:{}};
function readPad(){const g=gamepad();if(!g)return null;const ax=g.axes,bt=g.buttons,dz=v=>deadzone(v,.15,true);
 const st={mx:dz(ax[0]||0),my:dz(ax[1]||0),lx:dz(ax[2]||0),ly:dz(ax[3]||0),fire:(bt[7]?.value||0)>.3,ads:(bt[6]?.value||0)>.3};const pr=pad.prev,b=i=>!!bt[i]?.pressed,e=i=>b(i)&&!pr[i];
 st.jump=e(0);st.crouchE=e(1);st.reload=b(2);st.reloadE=e(2);st.swap=e(3);st.frag=b(5);st.smoke=e(4);st.knife=e(11);st.sprint=b(10);st.start=e(9);st.back=b(8);st.k3=e(12);st.k4=e(14);st.k5=e(15);for(let i=0;i<17;i++)pr[i]=b(i);return st;}

/* ---------- player update ---------- */
function updatePlayer(dt){const p=P,L=G.level;if(!p)return;const gp=readPad();
 if(gp&&gp.start&&G.app==='play'){pause(true);return;}
 if(!p.alive){p.deathT+=dt;mouse.dx=mouse.dy=0;return;}
 const w=curW(),s=p.slots[p.cur];p.weapon=w;p.att=s.att;
 const sens=.0022*opt.sens*(1-p.adsV*(1-1/w.adsZoom));
 p.yaw-=mouse.dx*sens;p.pitch-=mouse.dy*sens;vmS.mdx+=mouse.dx;vmS.mdy+=mouse.dy;mouse.dx=mouse.dy=0;if(keys.ArrowLeft)p.yaw+=2.2*dt;if(keys.ArrowRight)p.yaw-=2.2*dt;if(keys.ArrowUp)p.pitch+=1.6*dt;if(keys.ArrowDown)p.pitch-=1.6*dt;
 if(gp){const k=(3.2-p.adsV*2)*opt.sens*dt,acc=x=>Math.sign(x)*Math.pow(Math.abs(x),1.7);p.yaw-=acc(gp.lx)*k;p.pitch-=acc(gp.ly)*k*.75;vmS.mdx+=acc(gp.lx)*k*400;vmS.mdy+=acc(gp.ly)*k*300;}
 p.pitch=cl(p.pitch,-1.45,1.45);
 const fireHeld=mouse.l||(gp&&gp.fire),fireEdge=mouse.le||!!(gp&&gp.fire&&!pad.fireWas);if(gp)pad.fireWas=gp.fire;mouse.le=false;
 const adsHeld=mouse.r||(gp&&gp.ads);
 let fx_=(keys.KeyW?1:0)-(keys.KeyS?1:0),sx=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(gp){fx_=fx_||-gp.my;sx=sx||gp.mx;}
 const ml=Math.hypot(fx_,sx);if(ml>1){fx_/=ml;sx/=ml;}
 const sprintKey=keys.ShiftLeft||keys.ShiftRight||(gp&&gp.sprint);
 if(edge.KeyC||(gp&&gp.crouchE)){if(p.sprint&&p.onGround&&p.slideT<=0)startSlide();else p.crouch=!p.crouch;}
 if(edge.ControlLeft&&p.sprint&&p.onGround&&p.slideT<=0)startSlide();
 const crouchHeld=keys.ControlLeft&&p.slideT<=0;const wantCrouch=p.crouch||crouchHeld||p.slideT>0;
 const wasSpr=p.sprint;p.sprint=!!sprintKey&&fx_>.5&&p.onGround&&!wantCrouch&&!adsHeld&&p.knifeT<=0&&p.cook<0&&!fireHeld&&!p.mantle&&!G.streak.designate;if(wasSpr&&!p.sprint)p.sprOut=.14;p.sprOut=(p.sprOut||0)-dt;
 if(p.sprint&&p.crouch)p.crouch=false;
 if(p.mantle){const m=p.mantle;m.t+=dt/m.dur;const k=Math.min(1,m.t),e=k<.6?k/.6:1;p.pos.x=m.from.x+(m.to.x-m.from.x)*Math.max(0,(k-.35)/.65);p.pos.z=m.from.z+(m.to.z-m.from.z)*Math.max(0,(k-.35)/.65);p.pos.y=m.from.y+(m.to.y-m.from.y)*Math.min(1,e);
  if(k>=1){p.mantle=null;p.onGround=true;p.vel.set(Math.sin(p.yaw)*2,0,Math.cos(p.yaw)*2);}}
 else{const fwx=Math.sin(p.yaw),fwz=Math.cos(p.yaw),rx=-Math.cos(p.yaw),rz=Math.sin(p.yaw);
  let spd=4.6*w.speed;if(p.sprint)spd=7.1*w.speed;if(wantCrouch&&p.slideT<=0)spd=2.3*w.speed;spd*=1-p.adsV*.45;if(p.cook>=0)spd*=.85;
  let wx=(fwx*fx_+rx*sx)*spd,wz=(fwz*fx_+rz*sx)*spd;
  if(p.slideT>0){p.slideT-=dt;const k=Math.max(0,p.slideT/.8);wx=p.slideDir.x*(2.4+7.6*k)+rx*sx*1.5;wz=p.slideDir.z*(2.4+7.6*k)+rz*sx*1.5;if(p.slideT<=0)p.crouch=true;}
  const acc=p.onGround?(p.slideT>0?20:13):2.5,k=1-Math.exp(-acc*dt);p.vel.x+=(wx-p.vel.x)*k;p.vel.z+=(wz-p.vel.z)*k;
  const jumpE=edge.Space||(gp&&gp.jump);
  if(jumpE||(keys.Space&&!p.onGround&&fx_>0)){const top=L.ledge(p.pos,fwx,fwz,PR);if(top>0&&(jumpE||p.vel.y<1.5)){p.mantle={t:0,dur:.42+(top-p.pos.y)*.12,from:p.pos.clone(),to:new V(p.pos.x+fwx*(PR+.75),top,p.pos.z+fwz*(PR+.75))};p.vel.set(0,0,0);p.slideT=0;p.crouch=false;snd.play('land');vmS.land=.6;}
   else if(jumpE&&p.onGround){if(wantCrouch&&p.slideT<=0)p.crouch=false;else{p.vel.y=5.4;p.onGround=false;p.slideT=0;p.crouch=false;}}}
  p.vel.y-=GRAV*dt;p.pos.x+=p.vel.x*dt;p.pos.z+=p.vel.z*dt;p.pos.y+=p.vel.y*dt;
  for(const a of G.actors){if(a===p||!a.alive)continue;const dx=p.pos.x-a.pos.x,dz=p.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2<.49&&d2>1e-6&&Math.abs(a.pos.y-p.pos.y)<1.5){const d=Math.sqrt(d2);p.pos.x+=dx/d*(.7-d);p.pos.z+=dz/d*(.7-d);}}
  const hgt=p.crouchV>.5?1.15:1.8;if(L.collide(p.pos,PR,hgt)&&p.slideT>0)p.slideT=Math.min(p.slideT,.15);
  const g=L.ground(p.pos.x,p.pos.z,p.pos.y,PR*.7);if(p.pos.y<=g+.001&&p.vel.y<=0){if(!p.onGround){const fv=-p.vel.y;if(fv>4){snd.play('land');p.landT=Math.min(1,fv/10);vmS.land=Math.min(1,fv/8);}if(fv>13)damage(p,(fv-13)*9,null,'legs',null,'FALL');}p.pos.y=g;p.vel.y=0;p.onGround=true;}
  else if(p.pos.y>g+.001){if(p.onGround&&p.pos.y-g<STEP&&p.vel.y<=0)p.pos.y=g;else p.onGround=false;}
  const hs=Math.hypot(p.vel.x,p.vel.z);p.speed=hs;if(p.onGround&&hs>1&&p.slideT<=0){p.stepD+=hs*dt;const stride=p.sprint?2.6:wantCrouch?1.6:2.1;if(p.stepD>stride){p.stepD=0;snd.play('step',p.sprint?1.4:wantCrouch?.4:.9);if(p.sprint)G.noises.push({p:p.pos.clone(),r:9,team:0,t:G.time,src:p});}}}
 p.crouchV+=((wantCrouch?1:0)-p.crouchV)*Math.min(1,dt*10);
 const eyeT=p.slideT>0?.9:EYE-(EYE-CEYE)*p.crouchV;p.eyeH+=(eyeT-p.eyeH)*Math.min(1,dt*14);
 p.fireT-=dt;p.boltT-=dt;p.throwT-=dt;p.shake=Math.max(0,p.shake-dt*1.8);p.landT=Math.max(0,p.landT-dt*3);p.firingT-=dt;
 if(p.knifeT>0){p.knifeT-=dt;if(!p.knifeHit&&p.knifeT<.36){p.knifeHit=true;knifeHit();}}
 if(edge.Digit1)queueSwap(0);if(edge.Digit2)queueSwap(1);if(gp&&gp.swap)queueSwap(1-p.cur);
 if(p.swapT>0){p.swapT-=dt;if(p.swapTo>=0&&p.swapT<.28){p.cur=p.swapTo;p.swapTo=-1;showGun();p.shotI=0;}}
 const rE=edge.KeyR||(gp&&gp.reloadE);
 if(rE&&p.reloadT<=0&&s.mag<magSize(s)&&s.res>0&&p.swapT<=0&&p.knifeT<=0)startReload();
 if(p.reloadT>0){const before=p.reloadT;p.reloadT-=dt;const k=1-p.reloadT/p.reloadDur,k0=1-before/p.reloadDur;
  if(w.shell){if(k0<.5&&k>=.5)snd.play('shell');if(p.reloadT<=0){s.mag++;s.res--;if(s.mag<magSize(s)&&s.res>0&&!fireHeld)startReload(true);else{snd.play('pump');p.reloadT=0;p.boltT=.45;p.pumpAnim=1;}}}
  else{if(k0<.18&&k>=.18){snd.play('magout');const cy=Math.cos(p.yaw),sy=Math.sin(p.yaw);tv.set(p.pos.x+sy*.35-cy*.08,p.pos.y+p.eyeH-.45,p.pos.z+cy*.35+sy*.08);bPerp.set(p.vel.x*.6,-.6,p.vel.z*.6);tv2.set(0,p.yaw,.3);fx.brass.drop(tv,bPerp,tv2);}if(k0<.6&&k>=.6)snd.play('magin');if(p.reloadEmpty&&k0<.8&&k>=.8)snd.play('bolt');if(p.reloadT<=0){const n=Math.min(magSize(s)-s.mag,s.res);s.mag+=n;s.res-=n;}}}
 const canAds=adsHeld&&p.swapT<=0&&p.knifeT<=0&&!p.sprint&&!p.mantle&&p.cook<0&&!G.streak.designate&&!(p.reloadT>0&&!w.shell);
 const adsT=canAds?1:0;p.adsV+=(adsT-p.adsV)*Math.min(1,dt/(w.ads*s.h.ads*.45));if(Math.abs(p.adsV-adsT)<.01)p.adsV=adsT;
 const steady=w.scope&&p.adsV>.8&&sprintKey&&p.breath>0;if(steady)p.breath=Math.max(0,p.breath-dt);else p.breath=Math.min(4,p.breath+dt*(sprintKey?0:.8));p.steady=steady;
 if(G.streak.designate)designate(fireEdge,adsHeld);
 else{const want=w.auto?(fireHeld||fireEdge):fireEdge;
  if(want&&p.sprint)p.sprint=false;
  if(want&&p.reloadT>0&&w.shell&&s.mag>0)p.reloadT=0;
  if(want&&p.sprOut<=0&&p.fireT<=0&&p.boltT<=0&&p.reloadT<=0&&p.swapT<=0&&p.knifeT<=0&&p.cook<0&&!p.mantle&&p.throwT<=0){if(s.mag>0)playerShoot(w,s);else if(fireEdge){snd.play('dry');if(s.res>0)startReload();else if(p.slots[1-p.cur].mag+p.slots[1-p.cur].res>0)queueSwap(1-p.cur);}}
  if(!fireHeld&&G.time-p.lastShot>.08)p.shotI=Math.max(0,p.shotI-dt*14);}
 if(G.time-p.lastShot>.1){const k=Math.min(1,dt*7);const rp=p.recP*k*.85,ry=p.recY*k*.85;p.pitch-=rp;p.yaw-=ry;p.recP-=p.recP*k;p.recY-=p.recY*k;}
 p.bloom=Math.max(0,p.bloom-dt*(p.adsV>.5?6:3.5));
 if((edge.KeyV||(gp&&gp.knife))&&p.knifeT<=0&&p.swapT<=0&&!p.mantle){p.knifeT=.55;p.knifeHit=false;p.reloadT=0;snd.play('knife');p.sprint=false;}
 const fragHeld=keys.KeyQ||(gp&&gp.frag);
 if(fragHeld&&p.cook<0&&p.frags>0&&p.knifeT<=0&&p.swapT<=0&&p.throwT<=0&&!p.mantle){p.cook=0;p.reloadT=0;snd.play('pin');}
 if(p.cook>=0){HUD.prompt(G,'COOKING '+Math.max(0,3.6-p.cook).toFixed(1)+'s · RELEASE TO THROW',p.cook/3.6);p.cook+=dt;if(p.cook>=3.6){p.cook=-1;p.frags--;explode(tv.copy(p.pos).setY(p.pos.y+1),p);}else if(!fragHeld){throwFrom(p,'frag',3.6-p.cook);p.cook=-1;p.frags--;}}
 if((edge.KeyX||(gp&&gp.smoke))&&p.smokes>0&&p.cook<0&&p.throwT<=0&&p.knifeT<=0){p.smokes--;throwFrom(p,'smoke',1.3);}
 if(edge.Digit3||(gp&&gp.k3))useStreak('uav');if(edge.Digit4||(gp&&gp.k4))useStreak('air');if(edge.Digit5||(gp&&gp.k5))useStreak('drone');
 p.interact=keys.KeyE||(gp&&gp.reload)?p.interact+dt:0;
 if(G.time-p.hurtT>4.5&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+42*dt);
 G.scoreboard=keys.Tab||(gp&&gp.back);}
function startSlide(){const p=P;p.slideT=.8;p.slideDir=new V(p.vel.x,0,p.vel.z).normalize();if(p.slideDir.lengthSq()<.5)p.slideDir.set(Math.sin(p.yaw),0,Math.cos(p.yaw));p.sprint=false;p.crouch=false;snd.play('slide');}
function startReload(cont){const p=P,s=p.slots[p.cur],w=WEAPONS[s.id];if(s.res<=0)return;p.reloadEmpty=s.mag===0;p.reloadDur=p.reloadT=w.shell?w.reload*(cont?1:1.35):(p.reloadEmpty?w.reloadE:w.reload)*s.h.reload;p.adsV=Math.min(p.adsV,.99);p.reloadCont=!!cont;}
function queueSwap(i){const p=P;if(!p||!p.alive||i===p.cur&&p.swapTo<0||p.swapT>0||p.knifeT>0||p.cook>=0)return;p.swapTo=i;p.swapT=.55;p.reloadT=0;snd.play('swap');}
function throwFrom(p,kind,fuse){eyeOf(p,tv);const d=new V();cam.getWorldDirection(d);const v=d.clone().multiplyScalar(kind==='smoke'?15:17.5);v.y+=3.2;v.add(tv2.set(p.vel.x,0,p.vel.z));tv.addScaledVector(d,.4);spawnNade(tv,v,p,kind,fuse);p.throwT=.45;if(kind==='smoke')snd.play('throw');}
function knifeHit(){const p=P;let best=null,bd=2.4;for(const a of G.actors){if(!a.alive||a.team===p.team)continue;const dx=a.pos.x-p.pos.x,dz=a.pos.z-p.pos.z,d=Math.hypot(dx,dz);if(d>bd||Math.abs(a.pos.y-p.pos.y)>1.2)continue;const an=Math.abs(ang(Math.atan2(dx,dz)-p.yaw));if(an>.75)continue;bd=d;best=a;}
 if(best){snd.play('stab');fx.blood(tv.copy(best.pos).setY(best.pos.y+1.2),tv2.set(Math.sin(p.yaw),0,Math.cos(p.yaw)));damage(best,160,p,'body',tv2,'KNIFE','knife');}
 else{eyeOf(p,tv);const d=new V();cam.getWorldDirection(d);const t=G.level.ray(tv.x,tv.y,tv.z,d.x,d.y,d.z,1.6,hitOut);if(t<1.6)fx.impact(tv.addScaledVector(d,t),hitOut.n.clone(),'metal');}}
const sDir=new V(),sP1=new V(),sP2=new V(),ejW=new V(),ejV=new V();
function playerShoot(w,s){const p=P;s.mag--;p.fireT=60/w.rpm;p.lastShot=G.time;p.stats.shots++;const supp=!!s.att.supp;
 const cp=Math.cos(p.pitch+p.camKick);sDir.set(Math.sin(p.yaw)*cp,Math.sin(p.pitch+p.camKick),Math.cos(p.yaw)*cp);eye.set(p.pos.x,p.pos.y+p.eyeH,p.pos.z);
 const moving=Math.min(1,Math.hypot(p.vel.x,p.vel.z)/5),air=p.onGround?0:1;
 let spread=(w.hip*s.h.hip*(1+moving*w.move*.35+air*.8)*(p.crouchV>.5?.75:1)+p.bloom)*(1-p.adsV)+(w.adsSpr+moving*.4*(w.scope?2:0))*p.adsV;if(w.scope&&p.adsV<.95)spread=Math.max(spread,w.hip*(1-p.adsV));
 const n=w.pellets||1;sP1.crossVectors(sDir,bUp).normalize();sP2.crossVectors(sP1,sDir);let last=null;
 for(let i=0;i<n;i++){const e=spread*D2R*Math.sqrt(Math.random()),th=Math.random()*6.283,d=new V().copy(sDir).addScaledVector(sP1,Math.cos(th)*Math.tan(e)).addScaledVector(sP2,Math.sin(th)*Math.tan(e)).normalize();last=shootRay(p,eye,d,w,240,n);}
 const[pv,ph]=pattern(w.id,p.shotI|0);const rm=s.h.rec*(p.crouchV>.5?.85:1)*(1-p.adsV*.18);const dp=w.recoil[0]*pv*rm*s.h.recV*D2R*(.9+Math.random()*.2),dy=(w.recoil[1]*ph*rm*D2R+(Math.random()-.5)*w.recoil[1]*.3*D2R)*s.h.recH;
 p.pitch+=dp;p.yaw-=dy;p.recP+=dp;p.recY-=dy;p.shotI++;p.bloom=Math.min(w.hip*1.6,p.bloom+(w.auto?.35:1.2));p.kick=1;p.camKick+=w.kick*.012*(1-p.adsV*.4);
 // viewmodel recoil impulse (springs)
 const K=w.kick*(1-p.adsV*.45)*(.55+.45*s.h.rec);vmS.pv.z+=.9*K;vmS.rv.x+=7*K;vmS.rv.y+=(Math.random()-.5)*3*K;vmS.rv.z+=(Math.random()-.5)*5*K;vmS.pv.y+=.12*K;
 if(w.bolt){p.boltT=60/w.rpm;setTimeout(()=>snd.play('bolt'),260);}if(w.pump){p.boltT=60/w.rpm;p.pumpAnim=1;setTimeout(()=>snd.play('pump'),200);}
 const g=VM.guns[s.id].userData;if(!supp){g.flash.visible=true;g.flash.rotation.z=Math.random()*6.28;g.flash.scale.setScalar(.7+Math.random()*.5);vmFlash.intensity=3;}
 if(!w.bolt&&!w.pump)ejectCasing(g);
 const mw=tv.copy(eye).addScaledVector(sDir,.6).addScaledVector(sP1,.1*(1-p.adsV)).addScaledVector(sP2,-.08);if(!supp)fx.lights.flash(mw,0xffa050,10,11,.06);
 if(last&&(p.shotI%2===0||!w.auto))fx.tracers.fire(tv2.copy(mw).addScaledVector(sDir,1.2),last.p,480,3.2,1,[6,4.6,2.4]);if(!supp){fx.sparks.burst(tv2.copy(mw).addScaledVector(sDir,.9),2,4,new THREE.Color(2,1.3,.5),.025,.08,{dir:sDir,spread:.4,drag:5});if(Math.random()<.5)fx.smoke.burst(tv2,1,.5,new THREE.Color(.6,.6,.6),.1,.6,{dir:sDir,spread:.3,drag:3,grow:.5});}
 snd.shot(w.snd,supp,0,0,true);p.firingT=supp?0:.8;G.noises.push({p:p.pos.clone(),r:supp?9:60,team:0,t:G.time,src:p});
 if(s.mag===0&&s.res>0)setTimeout(()=>{if(P&&P.alive&&P.slots[P.cur]===s&&s.mag===0&&P.reloadT<=0)startReload();},w.bolt?600:220);}
function ejectCasing(g){if(!g.eject||!shownGun)return;shownGun.updateMatrix();ejW.copy(g.eject).applyMatrix4(shownGun.matrix);ejV.set(1.6+Math.random()*.6,1.2+Math.random()*.6,.4+Math.random()*.3);VM.casings.add(ejW,ejV);}

/* ---------- killstreaks ---------- */
function streakCheck(){const p=P,ks=p.ks,s=p.streak;const give=(k,n,name)=>{if(s===n&&!ks[k]){ks[k]=1;HUD.banner(G,name+' READY',`${n} KILL STREAK · PRESS ${k==='uav'?3:k==='air'?4:5}`,'#ffd23f',2.2);snd.play('streak');}};give('uav',3,'UAV');give('air',5,'AIRSTRIKE');give('drone',7,'ATTACK DRONE');}
function useStreak(k){const p=P;if(!p||!p.alive||p.ks[k]!==1)return;if(k==='uav'){p.ks.uav=2;G.streak.uav=30;HUD.ann(G,'UAV ONLINE',2.5);snd.play('uav');HUD.radio(G,'HQ','UAV is up. Enemy positions on your map.',true);}
 else if(k==='air'){p.ks.air=2;G.streak.designate=true;HUD.ann(G,'PAINT THE TARGET · FIRE TO CONFIRM · RMB CANCELS',3);snd.play('radio');}
 else if(k==='drone'){p.ks.drone=2;G.streak.drone={t:32,pos:p.pos.clone().add(new V(0,12,0)),a:0,fireT:0,target:null};droneMesh.visible=true;HUD.ann(G,'ATTACK DRONE INBOUND',2.5);snd.play('drone');}}
function designate(fire,cancel){const p=P;cam.getWorldDirection(tv2);const t=G.level.ray(cam.position.x,cam.position.y,cam.position.z,tv2.x,tv2.y,tv2.z,200,hitOut);markRing.visible=t<200;
 if(t<200){markRing.position.copy(cam.position).addScaledVector(tv2,t);markRing.position.y=Math.max(.06,markRing.position.y+.06);markRing.scale.setScalar(1+Math.sin(G.time*8)*.06);
  laser.visible=true;eyeOf(p,tv);tv.y-=.25;tv.addScaledVector(tv2,.5);const L=tv.distanceTo(markRing.position);laser.position.copy(tv).lerp(markRing.position,.5);laser.scale.set(1,L,1);laser.quaternion.setFromUnitVectors(bUp,tv3.subVectors(markRing.position,tv).normalize());if(Math.random()<.1)snd.play('laser');}
 else laser.visible=false;
 if(fire&&t<200){G.streak.designate=false;markRing.visible=false;laser.visible=false;const tgt=markRing.position.clone();tgt.y=0;const d=new V(Math.cos(p.yaw),0,-Math.sin(p.yaw));G.streak.air={t:0,tgt,d,i:0,dropped:false};HUD.radio(G,'HQ','Target marked. Two fast movers inbound. Danger close!',true);snd.play('radio');p.ks.air=3;}
 if(cancel&&!fire){G.streak.designate=false;markRing.visible=false;laser.visible=false;p.ks.air=1;HUD.ann(G,'AIRSTRIKE CANCELLED',1.5);}}
function updateStreaks(dt){const S=G.streak;
 if(S.uav>0){S.uav-=dt;uavMesh.visible=true;const a=G.time*.16;uavMesh.position.set(Math.cos(a)*60,65,Math.sin(a)*60);uavMesh.rotation.set(0,-a,.25);uavMesh.userData.l.visible=(G.time*2|0)%2===0;if(Math.random()<dt*20)fx.trail(tv.copy(uavMesh.position).add(tv2.set(Math.sin(a)*2.5,0,-Math.cos(a)*2.5)),.95,1.2,3);}else uavMesh.visible=false;
 if(S.euav>0){S.euav-=dt;if(P&&P.alive&&((G.time*2|0)%4===0))for(const a of G.actors)if(a.ai&&a.team===1&&a.alive&&!a.ai.seen){a.ai.last=P.pos.clone();a.ai.lastT=G.time;a.ai.alerted=true;}}
 if(S.air){const A=S.air;A.t+=dt;if(A.t<4&&Math.random()<dt*9)fx.smoke.emit(A.tgt.x+rr(-.3,.3),.3,A.tgt.z+rr(-.3,.3),rr(-.3,.3),rr(1.4,2.2),rr(-.3,.3),.62,.2,.16,.6,2.6,0,.5,.7);
  if(A.t>1.6&&!A.jet){A.jet=1;snd.play('jet');jets.forEach((j,i)=>{j.visible=true;j.userData.o=A.tgt.clone().addScaledVector(A.d,-150).add(new V(-A.d.z*(i?7:-7),34+i*4,A.d.x*(i?7:-7)));});}
  if(A.jet){const k=(A.t-1.6)*120;jets.forEach(j=>{j.position.copy(j.userData.o).addScaledVector(A.d,k);j.lookAt(tv.copy(j.position).add(A.d));j.userData.fl.scale.set(1,.8+Math.random()*.5,1);if(Math.random()<.9)fx.trail(tv.copy(j.position).addScaledVector(A.d,-5.5),.92,1.6,2.6);});
   if(!A.dropped&&k>112){A.dropped=true;for(let i=0;i<8;i++){const m=new THREE.Mesh(bombGeo,bombMat);const j=jets[i%2];m.position.copy(j.position).addScaledVector(A.d,-i*2.2);scene.add(m);bombs.push({m,v:A.d.clone().multiplyScalar(34),tg:A.tgt.clone().addScaledVector(A.d,(i-3.5)*4).add(new V(rr(-1.6,1.6),0,rr(-1.6,1.6))),t:0});}snd.play('bombs',1,panOf(A.tgt));}
   if(A.t>6.5){jets.forEach(j=>j.visible=false);S.air=null;}}}
 for(let i=bombs.length-1;i>=0;i--){const b=bombs[i];b.t+=dt;b.v.y-=22*dt;const to=tv.subVectors(b.tg,b.m.position);to.y=0;b.v.x+=(to.x*1.2-b.v.x)*Math.min(1,dt*1.5);b.v.z+=(to.z*1.2-b.v.z)*Math.min(1,dt*1.5);b.m.position.addScaledVector(b.v,dt);b.m.lookAt(tv.copy(b.m.position).add(b.v));if(Math.random()<.5)fx.trail(b.m.position,.6,.5,1.2);
  if(b.m.position.y<=.3||b.t>5){scene.remove(b.m);bombs.splice(i,1);explode(new V(b.m.position.x,.6,b.m.position.z),P,9,240,'air');}}
 if(S.drone){const D=S.drone;D.t-=dt;D.a+=dt*.5;const c=P&&P.alive?P.pos:D.pos;const want=tv.set(c.x+Math.cos(D.a)*8,c.y+8,c.z+Math.sin(D.a)*8);D.pos.lerp(want,Math.min(1,dt*1.5));droneMesh.position.copy(D.pos).add(tv2.set(0,Math.sin(G.time*3)*.15,0));
  for(const r of droneMesh.userData.rot)r.rotation.y+=dt*40;droneMesh.userData.led.visible=(G.time*4|0)%2===0;
  D.fireT-=dt;if(D.retarget===undefined||(D.retarget-=dt)<=0){D.retarget=.3;D.target=null;let bd=45;for(const a of G.actors){if(!a.alive||a.team===0)continue;const d=a.pos.distanceTo(D.pos);if(d<bd){chestOf(a,tv2);if(G.level.los(D.pos,tv2)&&!fx.smokeBlocks(D.pos,tv2)){bd=d;D.target=a;}}}}
  if(D.target&&D.target.alive){chestOf(D.target,tv2);droneMesh.lookAt(tv2);if(D.fireT<=0){D.fireT=.1;D.shots=(D.shots||0)+1;if(D.shots%9===0)D.fireT=.7;const dd=new V().subVectors(tv2,D.pos).normalize();dd.x+=rr(-.03,.03);dd.y+=rr(-.03,.03);dd.z+=rr(-.03,.03);dd.normalize();
   const r=shootRay(P,D.pos,dd,{dmg:[24,18],range:[20,60],head:1.5,name:'DRONE'},120,1,'streak');fx.tracers.fire(D.pos,r.p,420,2.6,.9,[6,5,2.6]);fx.lights.flash(D.pos,0xffa050,4,6,.05);snd.shot({f:2600,b:140,len:.07},false,cam.position.distanceTo(D.pos),panOf(D.pos),false);}}
  else droneMesh.rotation.set(0,D.a+PI/2,0);
  if(D.t<=0){S.drone=null;droneMesh.visible=false;HUD.ann(G,'DRONE RETURNING TO BASE',2);}}}

/* ================= death / respawn ================= */
function playerDied(att,wname){const p=P;if(att&&att!==p&&att.id)p.nemesis=att.id;p.deathT=0;p.cook=-1;p.reloadT=0;p.adsV=0;p.slideT=0;p.mantle=null;p.attackerPos=att&&att.pos?att.pos.clone():null;HUD.dead(G,true,att,wname);G.streak.designate=false;markRing.visible=false;laser.visible=false;
 p.ks={uav:p.ks.uav===1?1:0,air:p.ks.air===1?1:0,drone:p.ks.drone===1?1:0};
 if(G.mode&&G.mode.onPlayerDeath)G.mode.onPlayerDeath(att);}
G.respawnPlayer=(x,z,yaw)=>{G.placePlayer(x,z,yaw);HUD.dead(G,false);};

/* ================= bots update ================= */
function updateBots(dt){G.pathBudget=3;const L=G.level;const frozen=!!G.cine;
 for(const a of G.actors){if(a.isPlayer)continue;if(!a.alive){a.deadT+=dt;if(a.rig){a.rig.update(dt,{dead:true});a.rig.root.position.copy(a.pos);if(a.deadT>(G.mode&&G.mode.corpse||12))a.rig.root.visible=false;}continue;}
  if(((G.app==='play'&&!G.over)||G.app==='menu')&&!frozen)drive(a,G,dt);else{a.move.set(0,0,0);a.crouch=false;}
  const k=1-Math.exp(-10*dt);a.vel.x+=(a.move.x-a.vel.x)*k;a.vel.z+=(a.move.z-a.vel.z)*k;a.pos.x+=a.vel.x*dt;a.pos.z+=a.vel.z*dt;
  if(!a.ai.static){L.collide(a.pos,.34,a.crouchV>.5?1.15:1.8);const g=L.ground(a.pos.x,a.pos.z,a.pos.y,.2);a.vel.y=(a.vel.y||0)-GRAV*dt;a.pos.y+=a.vel.y*dt;if(a.pos.y<=g){a.pos.y=g;a.vel.y=0;}}
  a.speed=Math.hypot(a.vel.x,a.vel.z);a.crouchV+=((a.crouch?1:0)-a.crouchV)*Math.min(1,dt*8);
  a.fireT-=dt;a.firingT-=dt;a.flashT-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0&&a.weapon)a.mag=a.weapon.mag;}
  if(G.time-a.hurtT>6&&a.hp<a.maxHp)a.hp=Math.min(a.maxHp,a.hp+(a.vip?12:20)*dt);
  if(a.rig){const r=a.rig;r.root.position.copy(a.pos);r.root.rotation.y=a.yaw;const sy=Math.sin(a.yaw),cy=Math.cos(a.yaw);
   r.update(dt,{speed:a.speed,vf:a.vel.x*sy+a.vel.z*cy,vs:a.vel.x*cy-a.vel.z*sy,crouch:a.crouchV,pitch:a.pitch,aim:!!(a.ai&&a.ai.seen&&a.ai.target)||a.firingT>0,sprint:a.speed>5.3,reload:a.reloadT>0?1-a.reloadT/(a.reloadDur||1):-1});
   r.flash.visible=a.flashT>0;if(a.flashT>0){r.flash.rotation.z=Math.random()*6;r.flash.scale.setScalar(.8+Math.random()*.5);}}}
 G.noises=G.noises.filter(n=>G.time-n.t<.7);}

/* ================= viewmodel ================= */
let shownGun=null;
function showGun(){if(!P)return;const s=P.slots[P.cur];for(const k in VM.guns)VM.guns[k].visible=false;const g=VM.guns[s.id];g.visible=true;applyAttachments(g,s.id,s.att);shownGun=g;}
const vmS={bobT:0,sx:0,sy:0,sxv:0,syv:0,mdx:0,mdy:0,sprint:0,land:0,p:new V(),pv:new V(),r:new V(),rv:new V(),idle:0},
 HIP={ar:[.15,-.165,-.37],smg:[.14,-.155,-.34],lmg:[.155,-.18,-.39],sniper:[.15,-.165,-.39],shotgun:[.15,-.165,-.37],pistol:[.11,-.13,-.36]},ADSZ={ar:-.21,smg:-.18,lmg:-.22,sniper:-.12,shotgun:-.3,pistol:-.33};
const hR=new V(),hL=new V(),elR=new V(),elL=new V(),shR=new V(.24,-.3,.08),shL=new V(-.12,-.34,-.06),gM=new THREE.Matrix4(),qR=new THREE.Quaternion(),qL=new THREE.Quaternion(),qOff=new THREE.Quaternion(),eO=new THREE.Euler(),magHome=new V();
function spring(x,v,k,c,dt){v.addScaledVector(x,-k*dt).multiplyScalar(Math.max(0,1-c*dt));x.addScaledVector(v,dt);}
function updateViewmodel(dt){const p=P;VM.casings.update(dt);if(!p||!shownGun||!(G.app==='play'||G.app==='paused')||G.cine){VM.root.visible=false;tacBeam.visible=tacDot.visible=false;return;}const s=p.slots[p.cur],w=WEAPONS[s.id],g=shownGun,u=g.userData;
 VM.root.visible=p.alive&&!(w.scope&&p.adsV>.92);
 const hs=Math.hypot(p.vel.x,p.vel.z),ads=p.adsV;vmS.bobT+=dt*hs*(p.sprint?1.15:1.55)*(p.onGround?1:0);vmS.idle+=dt;
 // mouse sway (lagging spring)
 const tx=cl(-vmS.mdx*.0009,-.05,.05),ty=cl(vmS.mdy*.0009,-.05,.05);vmS.mdx=vmS.mdy=0;vmS.sxv+=((tx-vmS.sx)*90-vmS.sxv*12)*dt;vmS.syv+=((ty-vmS.sy)*90-vmS.syv*12)*dt;vmS.sx+=vmS.sxv*dt;vmS.sy+=vmS.syv*dt;
 vmS.sprint+=((p.sprint?1:0)-vmS.sprint)*Math.min(1,dt*9);vmS.land=Math.max(0,vmS.land-dt*3);
 spring(vmS.p,vmS.pv,180,16,dt);spring(vmS.r,vmS.rv,160,14,dt);
 const H=HIP[s.id],sy=u.sightY||.08;const bob=hs>.5&&p.onGround?Math.min(1,hs/4.5):0,nb=1-ads*.9;
 const pos=tv.set(H[0]*(1-ads),H[1]*(1-ads)-sy*ads,H[2]+(ADSZ[s.id]-H[2])*ads);
 pos.x+=Math.sin(vmS.bobT)*.012*bob*nb+vmS.sx*(1-ads*.75)*.6;pos.y+=-Math.abs(Math.cos(vmS.bobT))*.011*bob*nb-vmS.sy*(1-ads*.75)*.5-vmS.land*.035+Math.sin(vmS.idle*1.3)*.0015*nb;
 let rx=-vmS.sy*1.3*(1-ads*.8)+vmS.r.x*.012,ry=vmS.sx*1.6*(1-ads*.8)+vmS.r.y*.012,rz=vmS.sx*1.2*(1-ads*.7)+vmS.r.z*.012+Math.sin(vmS.bobT)*.02*bob*nb;
 pos.z+=vmS.p.z*.035;pos.y+=vmS.p.y*.02;
 const sp=vmS.sprint;pos.x+=sp*-.03;pos.y+=sp*-.035;pos.z+=sp*.03;rx+=sp*-.3;ry+=sp*.75;rz+=sp*.25;pos.x+=Math.sin(vmS.bobT)*.025*sp;pos.y+=Math.abs(Math.cos(vmS.bobT))*.02*sp;
 if(p.slideT>0){rz+=.3;pos.x-=.03;}
 // reload choreography: tilt in, mag out (left hand follows), new mag in, charge if empty
 let leftT=null,magOff=0,magVis=true;if(p.reloadT>0){const k=1-p.reloadT/p.reloadDur;
  if(w.shell){const e=Math.sin(k*PI);rz+=.24*Math.min(1,(p.reloadCont?1:k*6))*(k<.9?1:(1-k)*10);rx+=.08;pos.y-=.015;leftT=tv2.set(.035,-.03-e*.03,-.04-e*.04);}
  else{const tilt=Math.sin(Math.min(1,k*1.15)*PI);rz-=tilt*(w.id==='pistol'?.2:.55);ry+=tilt*.22;rx+=tilt*.2;pos.y-=tilt*.01;pos.x-=tilt*.05;pos.z+=tilt*.03;
   if(k>.12&&k<.42)magOff=Math.min(1,(k-.12)/.12);else if(k>=.42&&k<.62)magOff=1-Math.min(1,(k-.42)/.18);if(k>.62&&k<.66)vmS.pv.y+=.4*dt*60;
   magVis=!(k>.3&&k<.42);if(u.mag)magHome.set(0,u.magY??-.02,u.magZ??-.1);leftT=k>.1&&k<.7?tv2.set(magHome.x,magHome.y-.06-magOff*.2,magHome.z+.02+magOff*.05):null;
   if(p.reloadEmpty&&k>.74&&k<.92){const e=Math.sin((k-.74)/.18*PI);leftT=tv2.set(.03,.07,.0+e*.06);rx+=e*.05;}}}
 if(p.swapT>0){const k=p.swapT>.28?(.55-p.swapT)/.27:p.swapT/.28;pos.y-=k*.3;rx-=k*1;}
 let knifeK=0;if(p.knifeT>0){knifeK=1-p.knifeT/.55;pos.x+=Math.sin(knifeK*PI)*.12;pos.y-=Math.sin(knifeK*PI)*.16;rz-=Math.sin(knifeK*PI)*.5;}
 const cookK=p.cook>=0?1:p.throwT>0?p.throwT/.45:0;if(cookK){pos.y-=.07*cookK;rx-=.18*cookK;pos.x+=.035*cookK;}
 // bolt / pump / slide
 if(u.bolt&&w.bolt){const k=p.boltT>0?1-p.boltT/(60/w.rpm):1;const e=k>.2&&k<.8?Math.sin((k-.2)/.6*PI):0;u.bolt.position.z=e*.07;u.bolt.rotation.z=-e*.9;rz+=e*.18;if(e>.5&&!p._ej){p._ej=1;ejectCasing(u);}if(e<.1)p._ej=0;}
 if(u.pump){const k=p.boltT>0?1-p.boltT/(w.pump?60/w.rpm:.45):1;const e=k<.9?Math.sin(k/.9*PI):0;u.pump.position.z=-.3+e*.09;rx+=e*.04;if(e>.7&&!p._ej){p._ej=1;ejectCasing(u);}if(e<.1)p._ej=0;}
 if(u.slide)u.slide.position.z=(vmS.p.z>.3?.03*Math.min(1,vmS.p.z):0)+(s.mag===0?.035:0);
 g.position.copy(pos);g.rotation.set(rx,ry,rz);
 if(u.mag){u.mag.position.set(0,(u.magY??-.02)-magOff*.25,(u.magZ??-.1)+magOff*.06);u.mag.visible=magVis;}
 if(u.flash.visible&&G.time-p.lastShot>.04)u.flash.visible=false;vmFlash.intensity*=Math.exp(-dt*40);
 // hands + arms
 g.updateMatrix();gM.copy(g.matrix);hR.copy(u.hand[0]).applyMatrix4(gM);hL.copy(u.hand[1]).applyMatrix4(gM);
 if(leftT)hL.lerp(tv3.copy(leftT).applyMatrix4(gM),.9);
 qR.copy(g.quaternion).multiply(qOff.setFromEuler(eO.set(-.25,0,-1.45)));qL.copy(g.quaternion).multiply(qOff.setFromEuler(eO.set(.15,0,s.id==='pistol'?-1.2:2.6)));
 VM.knife.visible=knifeK>0;if(knifeK>0){const a=Math.sin(knifeK*PI);VM.knife.position.set(.15-knifeK*.3,-.15+a*.06,-.3-a*.14);VM.knife.rotation.set(-.2,.9-knifeK*1.8,-.6);hR.copy(VM.knife.position).add(tv3.set(0,-.01,.05));qR.copy(VM.knife.quaternion);}
 VM.nade.visible=cookK>0;if(cookK>0){VM.nade.position.set(-.15+(p.cook<0?(1-cookK)*.05:0),-.16+(p.cook>=0?Math.sin(G.time*20)*.002:0),-.34-(p.cook<0?(1-cookK)*.25:0));hL.copy(VM.nade.position).add(tv3.set(0,-.035,.03));qL.identity();}
 elR.copy(hR).lerp(shR,.5).add(tv3.set(.08,-.1,.03));elL.copy(hL).lerp(shL,.5).add(tv3.set(-.1,-.07,.03));
 VM.pose(VM.arms[0],hR,elR,shR,qR);VM.pose(VM.arms[1],hL,elL,shL,qL);
 vmCam.fov=54-ads*(w.scope?0:u.optic==='acog'?22:12);vmCam.updateProjectionMatrix();
 // tac laser: green beam from the rail into the world, dot on whatever it touches
 const lz=s.att.laser&&p.alive&&!(w.scope&&ads>.9);tacBeam.visible=tacDot.visible=!!lz;if(lz){if(u.slots.laser&&u.slots.laser.userData.tip)u.slots.laser.userData.tip.visible=true;cam.getWorldDirection(tv2);const o=tv3.copy(cam.position);const t=G.level.ray(o.x,o.y,o.z,tv2.x,tv2.y,tv2.z,120,hitOut);const end=t<120?t:120;
  tacDot.position.copy(o).addScaledVector(tv2,end-.03);tacDot.scale.setScalar(Math.max(.5,end*.04));tacDot.visible=t<120;const st=eye.copy(o).addScaledVector(tv2,.5);tv.set(0,1,0).applyQuaternion(cam.quaternion);st.addScaledVector(tv,-.09*(1-ads));tv.set(1,0,0).applyQuaternion(cam.quaternion);st.addScaledVector(tv,.07*(1-ads)+.025);
  const L2=st.distanceTo(tacDot.position);tacBeam.position.copy(st).lerp(tacDot.position,.5);tacBeam.scale.set(1,L2,1);tacBeam.quaternion.setFromUnitVectors(bUp,tv.subVectors(tacDot.position,st).normalize());}}

/* ================= camera ================= */
function updateCamera(dt){if(G.cine){cineCam(dt);return;}if(G.app==='menu'||G.app==='loadout'||(G.app==='over'&&!P)){attractCam(dt);return;}
 if(G.app==='over'){attractCam(dt);return;}
 const p=P;if(!p)return;const w=WEAPONS[p.slots[p.cur].id];
 if(!p.alive){const k=Math.min(1,p.deathT*1.5);cam.position.set(p.pos.x,p.pos.y+p.eyeH*(1-k*.8)+.15*k,p.pos.z);cam.rotation.set(p.pitch*(1-k)-k*.3,p.yaw+PI,k*.5,'YXZ');
  if(p.attackerPos){const want=Math.atan2(p.attackerPos.x-p.pos.x,p.attackerPos.z-p.pos.z)+PI;cam.rotation.y=p.yaw+PI+ang(want-(p.yaw+PI))*Math.min(1,p.deathT);}cam.fov=FOV;cam.updateProjectionMatrix();return;}
 let swy=0,swp=0;if(p.adsV>.3){const amt=w.sway*p.slots[p.cur].h.sway*(p.crouchV>.5?.65:1)*(p.steady?.12:1)*p.adsV*D2R*(w.scope?1:.5);swy=(Math.sin(G.time*.9)+Math.sin(G.time*2.3)*.4)*amt;swp=(Math.sin(G.time*1.3+1)*.8+Math.cos(G.time*2.9)*.3)*amt;}
 p.camKick*=Math.exp(-dt*14);p.punch*=Math.exp(-dt*8);p.punchP*=Math.exp(-dt*8);
 const shk=p.shake*p.shake*.06;cam.position.set(p.pos.x+(Math.random()-.5)*shk,p.pos.y+p.eyeH-p.landT*.06+Math.sin(vmS.bobT*2)*.022*(p.sprint?1:.4)*(p.onGround&&p.speed>1?1:0)+(Math.random()-.5)*shk,p.pos.z+(Math.random()-.5)*shk);
 const roll=(p.slideT>0?.06:0)+Math.sin(vmS.bobT)*.004*(p.sprint?1:0)+p.punch;cam.rotation.set(p.pitch+swp+p.camKick+p.punchP,p.yaw+PI+swy,roll,'YXZ');
 const zoom=1+(p.slots[p.cur].h.zoom-1)*Math.pow(p.adsV,w.scope?3:1);const fovT=(FOV+(p.sprint?6:0)+(p.slideT>0?6:0))/zoom;cam.fov+=(fovT-cam.fov)*Math.min(1,dt*18);cam.updateProjectionMatrix();}
let camA=0;
function attractCam(dt){camA+=dt*.03;const r=44;cam.position.set(Math.cos(camA)*r,12+Math.sin(camA*.7)*3,Math.sin(camA)*r);cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(Math.cos(camA+1.1)*6,2,Math.sin(camA+1.1)*6);}
function cineCam(dt){const C=G.cine;C.t+=dt;let t=C.t,sh=null;for(const s of C.shots){if(t<=s.d){sh=s;break;}t-=s.d;}
 if(!sh){endCine();return;}const k=t/sh.d,e=k*k*(3-2*k);cam.position.lerpVectors(sh.a,sh.b,e);tv.lerpVectors(sh.la,sh.lb,e);cam.fov=50;cam.updateProjectionMatrix();cam.lookAt(tv);HUD.cine(G,true,C.lines,C.t);}
function endCine(){if(!G.cine)return;G.cine=null;HUD.cine(G,false);HUD.banner(G,G.mode.label,G.mode.def?G.mode.def.tag+' · '+G.level.name:'','#ff4d00',2.4);if(!G.noLock)I.lock();}

/* ================= match flow ================= */
const MAP_ALIAS={blacksite:'northwatch',outpost:'sandgate'};
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();Object.assign(opt,o);if(!MAPS[opt.map])opt.map=MAP_ALIAS[opt.map]||'sandgate';if(!['campaign','tdm','dom','hp','survival'].includes(opt.mode))opt.mode='tdm';opt.mission=Math.max(0,Math.min(MISSIONS.length-1,opt.mission|0));G.saveOpt();snd.init();snd.setVol(opt.vol);
 G.diffI=opt.diff;G.diff=DIFF[opt.diff];if(G.mode&&G.mode.dispose)G.mode.dispose();clearActors();fx.clear();for(const n of G.nades)scene.remove(n.m);G.nades=[];G.noises=[];resetStreakFx();
 G.time=0;G.over=null;G.marks=[];G.matchXP=0;G.firstBlood=false;G.cine=null;G.pickFlag=null;G.mode=makeMode(G,opt);loadMap(G.mode.map);G.app='play';G.mode.init();if(P){P.ks={uav:0,air:0,drone:0};P.streak=0;}
 HUD.startMatch(G);snd.ambience(look.amb,true);document.body.classList.add('playing');
 if(G.mode.intro&&!o.noIntro&&!G.skipIntro){G.cine={...G.mode.intro,t:0};HUD.cine(G,true,G.cine.lines,0);}else if(!G.noLock)I.lock();
 if(!G.cine)HUD.banner(G,G.mode.label,G.mode.def?G.mode.def.tag+' · '+G.level.name:G.level.name,'#ff4d00',2.4);}
G.start=start;
function resetStreakFx(){G.streak={uav:0,air:null,drone:null,euav:0,designate:false};droneMesh.visible=false;uavMesh.visible=false;markRing.visible=false;laser.visible=false;jets.forEach(j=>j.visible=false);for(const b of bombs)scene.remove(b.m);bombs.length=0;}
function menuMapId(){return opt.mode==='campaign'?MISSIONS[opt.mission||0].map:opt.map;}
function toMenu(){if(G.mode&&G.mode.dispose)G.mode.dispose();G.app='menu';G.over=null;G.cine=null;clearActors();fx.clear();for(const n of G.nades)scene.remove(n.m);G.nades=[];G.mode=null;G.marks=[];resetStreakFx();
 G.diff=DIFF[1];G.diffI=1;attractSquads();snd.ambience(look.amb,false);HUD.showMenu(G);document.body.classList.remove('playing');I.unlock();}
function attractSquads(){clearActors();loadMap(menuMapId());const L=G.level;for(let t=0;t<2;t++){const pts=t?L.spawns.b:L.spawns.a;G.names(t,5).forEach((n,i)=>{const p=pts[i];makeActor({team:t,x:p[0],z:p[1],role:'tdm',squad:t*2+(i>2?1:0),weapon:G.pickWeapon(t),name:n});});}}
G.menuMap=()=>{if(G.app==='menu'&&G.level&&G.level.id!==menuMapId())attractSquads();};
G.toMenu=toMenu;
G.endMatch=(res,title,sub)=>{if(G.over)return;G.over={res,title,sub,t:0};G.phase='end';if(P)P.trigger=false;snd.play(res==='win'?'win':'lose');HUD.banner(G,title,sub||'',res==='win'?'#5fe08a':res==='draw'?'#ffd23f':'#ff3b30',3);};
function finish(){const m=G.mode,me=P;const pts=Math.max(0,Math.round(m.points?m.points():me?me.stats.score:0));const won=G.over.res==='win';
 const before=prog.xp;prog.xp+=pts;try{localStorage.setItem('pxd_frontline_prog',JSON.stringify(prog));}catch(e){}
 const tok=award(pts,won);G.lastAward={pts,won,mode:m.kind,label:m.label,kills:me?me.stats.kills:0,deaths:me?me.stats.deaths:0,heads:me?me.stats.heads:0,diff:G.diff.n,res:G.over.res,xpBefore:before,xpAfter:prog.xp,tok,map:G.level.name};
 G.app='over';document.body.classList.remove('playing');I.unlock();HUD.showOver(G);}
function award(pts,won){const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest('frontline',pts);return tok;}
G.best=()=>bestScore('frontline');
postButton($('post'),'frontline',()=>{const a=G.lastAward||{};
 return[a.pts||0,`Game: Frontline Ops\nPoints: ${a.pts||0}\nResult: ${a.res||''}\nMode: ${a.label||a.mode||''} · ${a.map||''} · ${a.diff||''}\nKills: ${a.kills||0} · Deaths: ${a.deaths||0} · Headshots: ${a.heads||0}`];});

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);
 if(G.app==='paused'||G.app==='loadout'){for(const k in edge)delete edge[k];render.vis(dt);return;}
 if(G.app==='menu'||G.app==='over'){G.time+=dt;updateBots(dt);if(G.app==='menu')for(const a of G.actors){if(a.alive)continue;a.respT=(a.respT??4)-dt;if(a.respT<=0){a.respT=undefined;const sp=G.spawnPoint(a.team);G.respawnActor(a,sp.x,sp.z,Math.atan2(-sp.x,-sp.z));}}
  fx.update(dt,smokeCol());stepNades(dt);G.level.timeU.value=G.time;tickWorld(dt);HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);return;}
 G.time+=dt;
 if(G.cine){if(edge.Space||edge.Enter||mouse.le){mouse.le=false;endCine();}updateBots(dt);if(G.mode)G.mode.update(dt);fx.update(dt,smokeCol());G.level.timeU.value=G.time;tickWorld(dt);HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);return;}
 const sdt=G.over?dt*.35:dt;
 if(G.over){G.over.t+=dt;if(G.over.t>3){finish();for(const k in edge)delete edge[k];return;}}
 if(!G.over)updatePlayer(sdt);else mouse.dx=mouse.dy=0;
 updateBots(sdt);stepNades(sdt);updateStreaks(sdt);
 if(!G.over&&G.mode)G.mode.update(sdt);
 fx.update(sdt,smokeCol());G.level.timeU.value=G.time;tickWorld(sdt);
 snd.tick(dt);HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);}
function tickWorld(dt){const L=G.level;if(L.helis)for(const h of L.helis){h.userData.rotor.rotation.y+=dt*(h.userData.spin??0);}if(L.water&&L.water.normalMap){L.water.normalMap.offset.x+=dt*.004;L.water.normalMap.offset.y+=dt*.002;}if(sky)sky.userData.U.uT.value=G.time;}
function smokeCol(){const c=look?new THREE.Color(look.fog.c):new THREE.Color(.5,.5,.5);return{r:Math.min(.85,c.r*.9+.15),g:Math.min(.85,c.g*.9+.15),b:Math.min(.88,c.b*.9+.17)};}
const render={vis(dt){updateViewmodel(dt);updateCamera(dt);updateShadow();}};

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
// filmic finish (MEDIUM+): light unsharp mask so surface detail reads, gentle S-curve, split toning (cool shadows / warm highlights)
class FinishPass extends Pass{constructor(){super();this.U={tDiffuse:{value:null},res:{value:new THREE.Vector2(1,1)},sharp:{value:.35},con:{value:.18},sh:{value:new THREE.Color(.94,.98,1.06)},hi:{value:new THREE.Color(1.05,1.01,.95)},lift:{value:new THREE.Color(0,0,0)},gam:{value:1}};
  this.q=new FullScreenQuad(new THREE.ShaderMaterial({uniforms:this.U,vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.,1.);}',
  fragmentShader:`uniform sampler2D tDiffuse;uniform vec2 res;uniform float sharp,con,gam;uniform vec3 sh,hi,lift;varying vec2 vUv;
  void main(){vec2 px=1./res;vec3 c=texture2D(tDiffuse,vUv).rgb;vec3 n=(texture2D(tDiffuse,vUv+vec2(px.x,0.)).rgb+texture2D(tDiffuse,vUv-vec2(px.x,0.)).rgb+texture2D(tDiffuse,vUv+vec2(0.,px.y)).rgb+texture2D(tDiffuse,vUv-vec2(0.,px.y)).rgb)*.25;
   c=max(c+(c-n)*sharp,0.);c=clamp(c,0.,1.);c=mix(c,c*c*(3.-2.*c),con);float l=dot(c,vec3(.299,.587,.114));c*=mix(sh,hi,smoothstep(.05,.85,l));c=pow(max(c,0.),vec3(gam));c+=lift*(1.-c);gl_FragColor=vec4(c,1.);}`}));}
 setSize(w,h){this.U.res.value.set(w,h);}
 render(r,wb,rb){this.U.tDiffuse.value=rb.texture;r.setRenderTarget(this.renderToScreen?null:wb);this.q.render(r);}}
const POST={bloom:.38,bloomThreshold:.94,bloomRadius:.42,vignette:.26,grain:.025,aoStrength:.85};
function applyQuality(q){gfx=q;G.gfx=q;sun.castShadow=q>0;setKitDetail(q>0?1:0);const ms=q>=2?2048:1536;if(sun.shadow.map&&sun.shadow.mapSize.x!==ms){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(ms,ms);R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxStack=null;
 if(G.level){const id=G.level.id;if(built[id])scene.remove(built[id].group);G.level=null;loadMap(id);}}
G.applyQuality=applyQuality;
bindQualityKey(()=>gfx,q=>applyQuality(q));
function renderFrame(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*PI/360));
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(R,scene,cam,{...POST,exposure:look.exp,tint:look.tint,saturation:look.sat,quality:gfx});if(fxStack.composer){fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);const fin=new FinishPass();const f=look.fin||{};fin.U.sharp.value=gfx>=2?(f.sharp??.38):(f.sharp??.38)*.7;fin.U.con.value=f.con??.18;if(f.sh)fin.U.sh.value.set(...f.sh);if(f.hi)fin.U.hi.value.set(...f.hi);if(f.lift)fin.U.lift.value.set(...f.lift);fin.U.gam.value=f.gam??1;fxStack.composer.addPass(fin);fxStack.fin=fin;}fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);if(fxStack.fin)fxStack.fin.setSize(w*R.getPixelRatio(),h*R.getPixelRatio());}
 if(fxStack.grade){const hp=P&&G.app==='play'?P.hp/P.maxHp:1;fxStack.grade.uniforms.sat.value=look.sat*(.4+.6*Math.min(1,hp*1.6));}
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);R.autoClear=false;R.clearDepth();if(VM.root.visible)R.render(vmScene,vmCam);R.autoClear=true;}}
G.render=renderFrame;

/* ================= boot ================= */
HUD.init(G,{WEAPONS,PRIMARIES,ATT,SLOTS,handling,RANKS,rankOf,rankXP,MISSIONS,DIFF});
applyQuality(gfx);toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);renderFrame();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.FRONTLINE={get state(){return G.app==='play'?(G.over?'end':G.cine?'cine':G.player&&!G.player.alive?'dead':'live'):G.app;},get app(){return G.app;},step,render:renderFrame,start,toMenu,G,
 get player(){return P;},get actors(){return G.actors;},get mode(){return G.mode;},get level(){return G.level;},keys,edge,mouse,maps:MAP_LIST.map(m=>m.id),
 setClock(s){if(G.mode)G.mode.clock=s;},get clock(){return G.mode?G.mode.clock:0;},skipCine(){endCine();},
 aim(yaw,pitch=0){if(P){P.yaw=yaw;P.pitch=pitch;}},teleport(x,z,yaw){if(P){P.pos.set(x,G.level.ground(x,z,.1),z);P.vel.set(0,0,0);if(yaw!==undefined)P.yaw=yaw;}},
 lookAt(a){if(!P||!a)return;eyeOf(P,eye);chestOf(a,tv);P.yaw=Math.atan2(tv.x-eye.x,tv.z-eye.z);P.pitch=Math.atan2(tv.y-eye.y,Math.hypot(tv.x-eye.x,tv.z-eye.z));P.recP=P.recY=0;},
 enemies(){return G.actors.filter(a=>a.alive&&a.team===1);},allies(){return G.actors.filter(a=>a.alive&&a.team===0&&!a.isPlayer);},
 killEnemies(n=99){let k=0;for(const a of G.actors.slice())if(a.alive&&a.team===1&&k<n){k++;damage(a,999,P,'body',new V(0,0,1),'TEST');}return k;},
 hurtPlayer(n=40){if(P)damage(P,n,G.actors.find(a=>a.team===1&&a.alive)||null,'body',new V(0,0,1),'TEST');},god(on=true){if(P)P.god=on;},
 objective(){return G.mode&&G.mode.objText?G.mode.objText():null;},completeObjective(){if(G.mode&&G.mode.skip)G.mode.skip();},flags(){return G.mode&&G.mode.flags?G.mode.flags.map(f=>({id:f.id,own:f.own,prog:f.prog})):null;},
 setQuality:applyQuality,pause,noLock(on=true){G.noLock=on;},skipIntro(on=true){G.skipIntro=on;},get streak(){return G.streak;},useStreak,giveStreaks(){if(P)P.ks={uav:1,air:1,drone:1};},designate,
 get stats(){return P?P.stats:null;},get prog(){return prog;},get lastAward(){return G.lastAward;},cam,VM,fx,R,scene,vmScene,vmCam,hemi,sun,loadMap,PRESET:LOOK};
