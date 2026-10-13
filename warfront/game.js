// IRON VANGUARD — full 3D combined-arms Conquest. 16 v 16 across the Ashvale valley: four soldier classes, tanks, jeeps,
// attack helicopters and jets for both armies, five capture points, ticket bleed, squad spawns and a deploy map.
// Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,postScore,saveBest,userName} from '../js/kit3d/score.js';
import {V,PI,cl,rr,ang} from './util.js';
import {makeTextures} from './tex.js';
import {World,POINTS,HQ,PLAY,WL,DECK,STEPUP} from './terrain.js';
import {buildWorld,makeSky,LOOK,makeFlag,waveFlag} from './scene.js';
import {makeKit,Rig,hitActor} from './actors.js';
import {WEAPONS,pattern,dmgAt,buildViewmodel,applyAttachments,rankOf,rankXP,RANKS} from './weapons.js';
import {FX} from './fx.js';
import {DIFF,SKIRM,newBrain,drive,crew,eyeOf,chestOf,centerOf} from './ai.js';
import {Vehicle,VSPEC,hitVehicle} from './vehicles.js';
import {Sound} from './sound.js';
import * as HUD from './hud.js';

const $=id=>document.getElementById(id),D2R=PI/180,GRAV=16,PR=.35,EYE=1.62,CEYE=1.05,FOV=70;
const NAMES=[['REYES','HOLT','MBEKI','STROUD','VANCE','IKEDA','NOVAK','CRUZ','LUND','FARRAH','OKORO','DANE','PRICE','SOTO','KAINE','ABEL'],['KESTREL','RAZOR','SABLE','VIPER','JACKAL','GRIM','HUSK','ONYX','TALON','WRAITH','BRANDT','SPECTRE','ROOK','MAKO','DUST','CINDER']];
const CLASSES={assault:{name:'ASSAULT',short:'AST',desc:'FRONTLINE RIFLEMAN · 3 FRAGS · F DROPS AN AMMO CRATE',prim:['ar','lmg'],ability:'AMMO CRATE',cd:20,frags:3},
 medic:{name:'MEDIC',short:'MED',desc:'HOLD E TO REVIVE DOWNED ALLIES · F DROPS A MED KIT',prim:['smg','ar'],ability:'MED KIT',cd:18,frags:1},
 engineer:{name:'ENGINEER',short:'ENG',desc:'HAMMER RPG (3) KILLS ARMOUR · TORCH (4) REPAIRS · F REPAIR PULSE',prim:['smg','shotgun'],ability:'REPAIR PULSE',cd:24,frags:1},
 recon:{name:'RECON',short:'REC',desc:'LONG-RANGE MARKSMAN · F SPOTS EVERY ENEMY IN VIEW FOR THE TEAM',prim:['sniper','ar'],ability:'SPOT',cd:9,frags:1}};
const CLS=['assault','medic','engineer','recon'];
const LENS=[{n:'SKIRMISH',t:480,k:200},{n:'STANDARD',t:720,k:300},{n:'GRAND',t:1200,k:500}];
const BLAST={frag:{r:7,inf:125,veh:30,dd:150,name:'FRAG',fx:.9},rpg:{r:4.5,inf:115,veh:70,ap:270,dd:320,name:'HAMMER RPG',fx:.9},shell:{r:6.5,inf:155,veh:90,ap:330,dd:600,name:'BASTION CANNON',fx:1.35,trees:1},
 rocket:{r:5,inf:105,veh:55,ap:125,dd:260,name:'HORNET ROCKETS',fx:.9},missile:{r:6,inf:110,veh:80,ap:380,dd:300,name:'SABRE MISSILE',fx:1.15},wreck:{r:8,inf:120,veh:70,dd:400,name:'VEHICLE BLAST',fx:1.6,trees:1},chin:{r:2.6,inf:48,veh:12,dd:40,name:'HORNET 30MM',fx:.3}};

/* ================= renderer, scenes ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.5));R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(FOV,1,.1,2600);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(56,1,.01,10);
const look=LOOK;const hemi=new THREE.HemisphereLight(look.hemi.s,look.hemi.g,look.hemi.i),sun=new THREE.DirectionalLight(look.sun.c,look.sun.i);sun.castShadow=true;scene.add(hemi,sun,sun.target);
const sunDir=new V(...look.sun.dir).normalize();sun.shadow.bias=-.0006;sun.shadow.normalBias=.06;
scene.fog=new THREE.FogExp2(look.fog.c,look.fog.d);scene.background=new THREE.Color(look.fog.c);const sky=makeSky(look);scene.add(sky);R.toneMappingExposure=look.exp;
const vmHemi=new THREE.HemisphereLight(look.hemi.s,look.hemi.g,look.hemi.i*.9+.2),vmKey=new THREE.DirectionalLight(look.sun.c,look.sun.i*.55),vmFlash=new THREE.PointLight(0xffaa55,0,3,1.5),vmRim=new THREE.DirectionalLight(look.hemi.s,1);
vmKey.position.copy(sunDir).setY(Math.max(.4,sunDir.y));vmFlash.position.set(.1,-.05,-.7);vmRim.position.set(2,.5,-1.5);vmScene.add(vmHemi,vmKey,vmFlash,vmRim);
{const s=new THREE.Scene();s.add(makeSky(look));s.add(new THREE.HemisphereLight(look.hemi.s,look.hemi.g,1));const pm=new THREE.PMREMGenerator(R);const env=pm.fromScene(s,.04).texture;pm.dispose();scene.environment=env;scene.environmentIntensity=look.env;vmScene.environment=env;vmScene.environmentIntensity=.8;}
const TX=makeTextures();makeKit(TX);
const fx=new FX(scene,TX);const snd=new Sound();const VM=buildViewmodel(TX);vmCam.add(VM.root);vmScene.add(vmCam);
const W=new World(7);
fx.sparks.gfn=fx.smoke.gfn=fx.debris.gfn=(x,z)=>W.height(x,z);fx.nfn=(x,z)=>W.normal(x,z,new V());
fx.smoke.U.uFog&&fx.smoke.U.uFog.value.set(look.fog.c);if(fx.smoke.U.uFogD)fx.smoke.U.uFogD.value=look.fog.d;if(fx.smoke.U.uLight)fx.smoke.U.uLight.value.set(look.hemi.s).lerp(new THREE.Color(look.sun.c),.5);
const treeBox=[];W.boxes.forEach(b=>{if(b.tree>=0)treeBox[b.tree]=b;});
const nadeGeo=new THREE.SphereGeometry(.06,10,8),nadeMat=new THREE.MeshStandardMaterial({color:0x4a5034,roughness:.6});
const projGeo=new THREE.CylinderGeometry(.07,.07,.9,6);projGeo.rotateX(PI/2);const projMat=new THREE.MeshBasicMaterial({color:new THREE.Color(5,3.2,1.6)});
const kitGeo=new THREE.BoxGeometry(.55,.3,.38),kitMats={med:new THREE.MeshStandardMaterial({color:0xe8e4dc,roughness:.6}),ammo:new THREE.MeshStandardMaterial({color:0x4e5636,roughness:.7})};
const kitCross=new THREE.Mesh(new THREE.BoxGeometry(.3,.02,.1),new THREE.MeshBasicMaterial({color:0xd8281e}));
// distant soldiers: one instanced low-poly figure (rigs are hidden beyond LOD range)
const impGeo=(()=>{const a=new THREE.BoxGeometry(.5,.75,.3);a.translate(0,1.12,0);const b=new THREE.BoxGeometry(.42,.78,.26);b.translate(0,.39,0);const h=new THREE.SphereGeometry(.15,6,4);h.translate(0,1.66,0);const g=new THREE.BufferGeometry();
 const parts=[a,b,h].map(x=>x.index?x.toNonIndexed():x);const pos=[],nor=[];for(const p of parts){pos.push(...p.attributes.position.array);nor.push(...p.attributes.normal.array);}g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));return g;})();
const imp=new THREE.InstancedMesh(impGeo,new THREE.MeshStandardMaterial({color:0xffffff,roughness:.9}),40);imp.count=0;imp.frustumCulled=false;scene.add(imp);const impC=[new THREE.Color(0x4a5a46),new THREE.Color(0x5a5246)];

/* ================= shared context ================= */
const G={THREE,scene,cam,fx,snd,TX,W,actors:[],vehicles:[],points:[],player:null,time:0,diff:DIFF[1],diffI:1,noises:[],pathBudget:4,app:'menu',over:null,nades:[],proj:[],kits:[],tmpC:[],objLoad:[[0,0,0,0,0],[0,0,0,0,0]],
 tickets:[300,300],maxTickets:300,clock:720,bleed:[0,0],deploy:false,spawnSel:'hq',viewPos:new V(),viewYaw:0,aimPt:new V(),reticle:{pt:new V(),sq:false},capPoint:null,oobT:0,stats:{kills:[0,0],dmg:[0,0],caps:0,vkills:0}};
window.__G=G;
let opt={diff:1,len:1,sens:1,vol:.8,cls:'assault',wsel:{}};try{Object.assign(opt,JSON.parse(localStorage.getItem('pxd_warfront_opt'))||{});}catch(e){}if(!CLASSES[opt.cls])opt.cls='assault';
for(const k of CLS)if(!CLASSES[k].prim.includes(opt.wsel[k]))opt.wsel[k]=CLASSES[k].prim[0];G.opt=opt;G.cls=opt.cls;G.wsel=opt.wsel;
let prog={xp:0};try{Object.assign(prog,JSON.parse(localStorage.getItem('pxd_warfront_prog'))||{});}catch(e){}G.prog=prog;
G.saveOpt=()=>{try{localStorage.setItem('pxd_warfront_opt',JSON.stringify(opt));}catch(e){}};
G.setClass=c=>{if(CLASSES[c]){G.cls=opt.cls=c;G.saveOpt();}};G.setWeapon=w=>{if(CLASSES[G.cls].prim.includes(w)){opt.wsel[G.cls]=w;G.saveOpt();}};

/* ================= world scene ================= */
let gfx=quality(),S=null,fxStack=null,fxSize='';
function buildScene(){if(S){scene.remove(S.group);S.group.traverse(o=>{if(o.geometry&&!o.geometry._keep)o.geometry.dispose();});}S=buildWorld(W,TX,gfx);scene.add(S.group);
 for(const D of W.dest)if(!D.alive&&D.mesh)S.killDest(D);for(const t of W.trees)if(!t.alive)S.killTree(t);}
function resetWorld(){let dirty=false;for(const t of W.trees)if(!t.alive){t.alive=true;dirty=true;if(treeBox[t.i])treeBox[t.i].dead=false;}for(const D of W.dest){D.hp=D.max;if(!D.alive){D.alive=true;dirty=true;for(const b of D.boxes)b.dead=false;}}if(dirty)buildScene();}
// capture flags
G.points=POINTS.map((p,i)=>{const f=makeFlag(TX);const bx=p.kind==='bridge'?3.4:0,y=p.kind==='bridge'?DECK:W.height(p.x,p.z);f.position.set(p.x+bx,y,p.z);f.userData.ring.scale.set(p.r,p.r,1);f.userData.ring.position.set(-bx,.25,0);scene.add(f);
 return{...p,i,y,own:-1,prog:0,contest:false,n0:0,n1:0,flag:f};});
// vehicles: per army 2 tanks, 2 jeeps, 1 attack helicopter, 1 jet
const VLAY=[['tank',-14,12],['tank',-5,13],['jeep',7,10],['jeep',12,9],['heli',18,-6],['jet',-26,2]];
for(let t=0;t<2;t++){const h=HQ[t],s=t?1:-1;for(const[k,dx,dz]of VLAY){const x=h.x+dx*(t?-1:1),z=h.z+s*dz;const v=new Vehicle(k,t,TX,{x,z,y:W.height(x,z),yaw:h.yaw});v.isVeh=true;v.spotT=0;v.idleT=0;scene.add(v.model.root);G.vehicles.push(v);}}

/* ================= actors ================= */
let nid=1,P=null;
function makeActor(o){const cls=o.cls||'assault',w=WEAPONS[o.weapon||CLASSES[cls].prim[0]];
 const a={id:nid++,name:o.name,team:o.team,cls,isPlayer:!!o.player,pos:new V(),vel:new V(),move:new V(),yaw:0,pitch:0,hp:100,maxHp:100,alive:false,downed:false,downT:0,reviver:null,crouch:false,crouchV:0,speed:0,weapon:w,mag:w.mag,reloadT:0,reloadDur:1,fireT:0,firingT:0,flashT:0,hurtT:-99,
  nades:1,rpg:0,rpgT:0,veh:null,seat:-1,spotT:0,far:false,spawnT:0,atHQ:false,inWater:false,repairing:0,lowAmmo:false,stats:{kills:0,deaths:0,score:0,assists:0,revives:0,caps:0,shots:0,hits:0,heads:0,vkills:0},dmgBy:new Map(),respawnT:0,deadT:0,squad:o.squad,lod:0,lodAcc:0};
 if(!a.isPlayer){a.rig=new Rig(a.team===0?'ally':'enemy',Math.random(),cls);a.rig.root.visible=false;scene.add(a.rig.root);a.ai=newBrain({squad:o.squad});a.ai.leader=!!o.leader;a.leader=!!o.leader;}
 G.actors.push(a);return a;}
function clearActors(){for(const a of G.actors)if(a.rig){scene.remove(a.rig.root);a.rig.mesh.geometry.dispose();}G.actors=[];G.player=P=null;}
function fillArmy(withPlayer){clearActors();for(let t=0;t<2;t++){const names=NAMES[t].slice().sort(()=>Math.random()-.5);let ni=0;
 for(let sq=0;sq<4;sq++)for(let m=0;m<4;m++){const squad=t*4+sq;if(withPlayer&&t===0&&sq===0&&m===0){P=G.player=makeActor({player:true,team:0,cls:G.cls,weapon:opt.wsel[G.cls],name:'YOU',squad});continue;}
  const cls=CLS[(m+sq)%4];makeActor({team:t,cls,weapon:CLASSES[cls].prim[Math.random()<.75?0:1],name:names[ni++],squad,leader:m===0&&!(withPlayer&&t===0&&sq===0)});}}}
function resetActor(a){a.hp=a.maxHp;a.alive=true;a.downed=false;a.downT=0;a.reviver=null;a.vel.set(0,0,0);a.move.set(0,0,0);a.crouch=false;a.crouchV=0;a.reloadT=0;a.fireT=0;a.mag=a.weapon.mag;a.dmgBy.clear();a.spawnT=G.time;a.prot=G.time+1.5;a.inWater=false;a.lowAmmo=false;
 a.nades=a.cls==='assault'?2:1;a.rpg=a.cls==='engineer'?5:0;a.rpgT=0;a.deadT=0;a.spotT=0;if(a.ai){a.ai=Object.assign(newBrain({squad:a.ai.squad}),{leader:a.leader});a.rig.root.visible=true;}}
function placeActor(a,x,z,spread){let px=x,pz=z;for(let i=0;i<14;i++){const an=Math.random()*PI*2,r=spread*(i<10?Math.sqrt(Math.random()):1);const tx=x+Math.cos(an)*r,tz=z+Math.sin(an)*r;if(W.free(tx,tz)&&!W.inWater(tx,tz)){px=tx;pz=tz;break;}}
 a.pos.set(px,0,pz);a.pos.y=W.ground(px,pz,W.height(px,pz)+1.2,.3);a.yaw=Math.atan2(-px*.3,(a.team?1:-1)*300-pz);a.pitch=0;}
function spawnOptions(team,forBot){const o=[{id:'hq',kind:'hq',x:HQ[team].x,z:HQ[team].z,label:'HQ',name:HQ[team].name}];
 for(const p of G.points)if(p.own===team&&!p.contest)o.push({id:'pt'+p.i,kind:'pt',x:p.x,z:p.z,label:p.id,name:p.id+' · '+p.name,p});
 const sq=forBot?forBot.ai.squad:P?P.squad:-1;for(const a of G.actors)if(a.team===team&&!a.isPlayer&&a!==forBot&&a.alive&&!a.downed&&a.ai&&a.ai.squad===sq&&(!a.veh?!a.ai.seen:(a.veh.kind==='tank'||a.veh.kind==='jeep')&&a.veh.freeSeat()>=0)&&Math.max(Math.abs(a.pos.x),Math.abs(a.pos.z))<PLAY-10)
  o.push({id:'sq'+a.id,kind:'sq',x:a.pos.x,z:a.pos.z,label:a.name.slice(0,3),name:'SQUAD · '+a.name,a});return o;}
function spawnAtOption(a,o){resetActor(a);a.atHQ=o.kind==='hq';if(o.kind==='hq'){const h=HQ[a.team];placeActor(a,h.x+rr(-16,16),h.z+(a.team?1:-1)*rr(-8,10),5);}
 else if(o.kind==='pt')placeActor(a,o.x,o.z,o.p.r*.8);
 else{const m=o.a;if(m.veh&&m.veh.freeSeat()>=0){placeActor(a,m.veh.p.x,m.veh.p.z,2);enterVehicle(a,m.veh);}else{const b=-2.5;placeActor(a,m.pos.x+Math.sin(m.yaw)*b,m.pos.z+Math.cos(m.yaw)*b,1.2);a.yaw=m.yaw;}}
 if(a.rig){a.rig.root.position.copy(a.pos);}}
function respawnBot(a){const opts=spawnOptions(a.team,a);let pick=opts[0];const free=G.vehicles.some(v=>v.team===a.team&&v.alive&&v.freeSeat()>=0&&!v.claim&&Math.hypot(v.p.x-v.home.x,v.p.z-v.home.z)<20);
 const sq=opts.filter(o=>o.kind==='sq'),pts=opts.filter(o=>o.kind==='pt');
 if(free&&Math.random()<.4)pick=opts[0];else if(sq.length&&Math.random()<.45)pick=sq[Math.random()*sq.length|0];
 else if(pts.length){let best=null,bs=1e9;for(const o of pts){let d=1e9;for(const q of G.points)if(q.own!==a.team)d=Math.min(d,Math.hypot(q.x-o.x,q.z-o.z));const s=d+rr(0,90);if(s<bs){bs=s;best=o;}}pick=best;}
 spawnAtOption(a,pick);}

/* ================= vehicles: entry / exit ================= */
function enterVehicle(a,v){const s=v.freeSeat();if(s<0||!v.alive)return false;v.seats[s]=a;a.veh=v;a.seat=s;a.crouch=false;a.reloadT=0;if(a.rig)a.rig.root.visible=false;if(v.claim===a)v.claim=null;
 if(a.isPlayer){snd.play('enter');P.cyaw=v.yaw;P.cpitch=v.kind==='jet'?v.pitch:-.12;P.zoom=false;P.vslot=0;P.adsV=0;HUD.ann(G,`${VSPEC[v.kind].name} · ${VSPEC[v.kind].seats[s]}`,2);}return true;}
function exitVehicle(a,force){const v=a.veh;if(!v)return;v.seats[a.seat]=null;a.veh=null;a.seat=-1;const e=v.exitPos(new V());
 if(v.kind==='heli'||v.kind==='jet'){e.copy(v.p);e.y-=2.5;}const g=W.ground(e.x,e.z,e.y+1,.3);a.pos.set(e.x,Math.max(g,e.y),e.z);a.vel.set(v.vel.x*.3,0,v.vel.z*.3);a.chute=a.pos.y-g>6;
 if(!force&&a.pos.y-g<1.2){W.collide(a.pos,PR,1.8);}a.yaw=v.yaw;if(a.rig){a.rig.root.visible=true;a.ai.path=null;a.ai.state='idle';a.ai.obj=null;}
 if(a.isPlayer){snd.play('enter');P.pitch=0;P.yaw=P.cyaw;P.onGround=false;showGun();snd.engine(null);}}
G.enterVehicle=enterVehicle;G.exitVehicle=a=>exitVehicle(a);

/* ================= combat ================= */
const tv=new V(),tv2=new V(),tv3=new V(),eye=new V(),hn=new V(),hitOut={t:0,i:-1,n:new V()},bEye=new V(),bAim=new V(),bDir=new V(),bPerp=new V(),bUp=new V(0,1,0);
function panOf(p){tv.subVectors(p,cam.position);const y=G.viewYaw,rx=-Math.cos(y),rz=Math.sin(y);return cl((tv.x*rx+tv.z*rz)/(tv.length()+1)*1.1,-1,1);}
function award(a,n,label){a.stats.score+=n;if(a.isPlayer)HUD.xp(G,n,label);}
function shootRay(sh,o,d,w,range,pellet=1,vdm){W.ray(o.x,o.y,o.z,d.x,d.y,d.z,range,hitOut);let best=hitOut.t,ha=null,part=null,hv=null;const si=hitOut.i;hn.copy(hitOut.n);
 for(const b of G.actors){if(!b.alive||b===sh||b.team===sh.team||b.veh)continue;const rx=b.pos.x-o.x,rz=b.pos.z-o.z,pr=rx*d.x+rz*d.z;if(pr<-1||pr>best+1)continue;const h=hitActor(b,o.x,o.y,o.z,d.x,d.y,d.z,best);if(h&&h.t<best){best=h.t;ha=b;part=h.part;}}
 for(const v of G.vehicles){if(v===sh.veh||!v.model.root.visible)continue;const t=hitVehicle(v,o,d,best);if(t<best){best=t;hv=v;ha=null;}}
 const p=new V().copy(o).addScaledVector(d,Math.min(best,range));
 if(ha){fx.blood(p,d);if(ha.downed){if(sh.isPlayer||Math.random()<.25)die(ha,sh,{wname:w.name},false);}else{let dm=dmgAt(w,best)*(part==='head'?w.head:part==='legs'?.85:1);if(!sh.isPlayer)dm*=ha.isPlayer?G.diff.dmg:sh.team===1?G.diff.foe:.8;if(sh.isPlayer)sh.stats.hits+=1/pellet;damage(ha,dm,sh,part,d,w.name);}}
 else if(hv){fx.impact(p,hn.set(-d.x,-d.y,-d.z),'metal');if(hv.alive&&hv.team!==sh.team)vehDamage(hv,vdm??dmgAt(w,best)*.6,sh,'bullet',d);}
 else if(best<range)fx.impact(p,hn,W.matOf(si));
 return{p,a:ha,v:hv,t:best};}
function damage(v,dm,att,part,dir,wname,kind){if(!v.alive||v.downed||v.veh||!(G.app==='play'||G.app==='menu'))return;if(v.god||G.time<(v.prot||0))return;v.hp-=dm;v.hurtT=G.time;if(att&&att!==v)v.dmgBy.set(att.id,(v.dmgBy.get(att.id)||0)+dm);
 if(att&&att.team!==v.team)G.stats.dmg[att.team]+=dm;
 if(v.ai&&att&&att.team!==v.team){const ai=v.ai;ai.lastAttacker=att;ai.hurtT=G.time;ai.alerted=true;ai.last=(att.veh?att.veh.p:att.pos).clone();ai.lastT=G.time;}
 if(v.rig)v.rig.flinch=1;
 if(v.isPlayer){HUD.hurt(G,att?(att.veh?att.veh.p:att.pos):null,dm);snd.play('hurt');P.shake=Math.max(P.shake,.25);P.punch+=.04*(Math.random()<.5?-1:1);P.punchP+=.03;}
 if(att&&att.isPlayer&&v!==att){HUD.hitmark(part==='head',v.hp<=0);snd.play(part==='head'?'head':'hit');}
 if(v.hp<=0){const outright=v.hp<-55||kind==='blast'&&v.hp<-25||part==='head'&&dm>90;if(outright)die(v,att,{part,wname,dir},true);else down(v,att,{part,wname,dir});}}
G.damage=damage;
// a soldier goes down: kill credit + ticket now, revivable for a while
function account(v,att,info){v.stats.deaths++;G.tickets[v.team]=Math.max(0,G.tickets[v.team]-1);const head=info.part==='head';
 if(att&&att!==v&&att.team!==v.team){att.stats.kills++;G.stats.kills[att.team]++;if(head)att.stats.heads++;award(att,100+(head?50:0),head?'HEADSHOT':'KILL');if(att.isPlayer){HUD.killConfirm(G,v,head?'HEADSHOT':'ELIMINATED');snd.play('killc');}
  if(v.spotT>G.time)for(const b of G.actors)if(b.isPlayer&&b.team===att.team&&b.lastSpot===v.id&&b!==att)award(b,25,'SPOT ASSIST');}
 for(const[id,d]of v.dmgBy){if(att&&id===att.id||d<25)continue;const b=G.actors.find(x=>x.id===id);if(b&&b.team!==v.team){b.stats.assists++;award(b,40,'ASSIST');}}
 HUD.feed(G,att,v,info.wname||'',head);}
function down(v,att,info){v.downed=true;v.hp=0;v.downT=v.isPlayer?14:11;v.reviver=null;v.reloadT=0;account(v,att,info);if(v.rig){const f=tv.set(Math.sin(v.yaw),0,Math.cos(v.yaw));v.rig.dieDir=info.dir&&f.dot(info.dir)>0?-1:1;v.rig.flash.visible=false;}
 if(v.isPlayer){P.cook=-1;P.adsV=0;P.attackerPos=att&&att.pos?att.pos.clone():null;HUD.dead(G,'down',att,info.wname);}}
function die(v,att,info,fresh){if(!v.alive)return;if(!v.downed)account(v,att,info);v.downed=false;v.alive=false;v.hp=0;v.deadT=0;v.respawnT=rr(7.5,10.5);v.reviver=null;if(v.veh)exitVehicle(v,true);
 if(v.rig&&fresh!==undefined){const f=tv.set(Math.sin(v.yaw),0,Math.cos(v.yaw));if(!v.rig.die)v.rig.dieDir=info.dir&&f.dot(info.dir)>0?-1:1;v.rig.flash.visible=false;}
 if(v.isPlayer){P.deathT=0;P.respawnAt=G.time+9;HUD.dead(G,'dead',att,info.wname);P.attackerPos=att&&att.pos?att.pos.clone():P.attackerPos;}}
G.revive=(m,b)=>{if(!b.downed)return;b.downed=false;b.hp=b.maxHp*.65;b.prot=G.time+1;b.reviver=null;G.tickets[b.team]++;b.stats.deaths=Math.max(0,b.stats.deaths-1);m.stats.revives++;award(m,80,'REVIVE');snd.play('revive',1);
 if(b.ai){b.ai.target=null;b.ai.seen=0;b.ai.path=null;}if(b.isPlayer){HUD.dead(G,false);HUD.banner(G,'REVIVED',`BY ${m.name}`,'#7dffa8',1.6);P.pitch=0;}
 if(m.isPlayer)HUD.killConfirm(G,b,'REVIVED');};
// vehicles take damage by kind: bullet (armour-scaled), blast, ap (direct rocket / shell hit, rear armour weaker)
function vehDamage(v,dm,att,kind,dir){if(!v.alive||!(G.app==='play'||G.app==='menu'))return;let m=kind==='bullet'?v.S.armor.bullet:kind==='blast'?v.S.armor.blast:1;
 if(kind==='ap'&&v.kind==='tank'&&dir){const f=v.fwd(tv3);if(f.x*dir.x+f.z*dir.z>.45)m*=1.45;}dm*=m;if(dm<=0)return;if(v.god)return;
 v.hp-=dm;v.lastHitBy=att;v.lastHitT=G.time;v.burn=1;if(att)G.stats.dmg[att.team]+=dm;
 for(const s of v.seats)if(s){if(s.ai&&att&&att.team!==v.team){s.ai.lastAttacker=att;s.ai.hurtT=G.time;}if(s.isPlayer){HUD.hurt(G,att?(att.veh?att.veh.p:att.pos):null,dm*.5);P.shake=Math.max(P.shake,Math.min(1,dm/120));if(kind!=='bullet')snd.play('hurt');}}
 if(att&&att.isPlayer){HUD.hitmark(false,v.hp<=0);snd.play('hit');}
 if(v.hp<=0)destroyVehicle(v,att);}
function destroyVehicle(v,att){const crew=v.seats.filter(Boolean);v.wreck();const p=tv.copy(v.p);p.y+=1.4;fx.explode(p.clone(),1.6,true);fx.smokeCloud(v.p.clone(),10);
 if(att&&att.team!==v.team){att.stats.vkills++;G.stats.vkills++;award(att,200,'VEHICLE DESTROYED');if(att.isPlayer)HUD.killConfirm(G,VSPEC[v.kind].name,'DESTROYED');}
 HUD.feed(G,att,{name:VSPEC[v.kind].name,team:v.team},att&&att.veh?VSPEC[att.veh.kind].name:'',false);
 for(const a of crew)die(a,att,{wname:VSPEC[v.kind].name},true);explode(p.clone(),att,'wreck',null,v);v.vel.multiplyScalar(.3);}
G.crash=v=>{if(!v.alive)return;vehDamage(v,9999,G.time-v.lastHitT<8?v.lastHitBy:null,'ap',null);};
G.bump=(v,imp)=>{if(imp>9)vehDamage(v,(imp-9)*30,G.time-v.lastHitT<8?v.lastHitBy:null,'ap',null);};

function explode(p,owner,K,direct,skipVeh){const pr=BLAST[K];const gy=W.height(p.x,p.z);
 if(pr.fx>=.6)fx.explode(p,pr.fx,p.y<gy+3);else{fx.sparks.burst(p,10,5,[new THREE.Color(3,1.6,.5)],.4,.25,{drag:3,jit:.5,up:true});fx.smoke.burst(p,3,2,new THREE.Color(.3,.28,.26),.8,1.4,{drag:2,grow:1.2,up:true});fx.lights.flash(p,0xff8a3a,30,10,.15);}
 const d=cam.position.distanceTo(p);if(pr.fx>=.6||d<60)snd.play(K==='shell'?'cannon':'boom',Math.max(.1,(1-d/(220*pr.fx))*(pr.fx<.6?.4:1)),panOf(p));if(P&&P.alive){const k=Math.max(0,1-d/(35*pr.fx));P.shake=Math.max(P.shake,k*1.2);if(d<8&&!P.veh)HUD.flash(.3*(1-d/8));}
 for(const a of G.actors){if(!a.alive||a.veh)continue;chestOf(a,tv);const dd=tv.distanceTo(p);if(dd>pr.r)continue;if(owner&&a.team===owner.team&&a!==owner)continue;const los=W.los(tv2.copy(p).setY(p.y+.4),tv);
  let dm=pr.inf*(1-dd/pr.r)*(los?1:.25);if(a===owner)dm*=.5;if(owner&&!owner.isPlayer&&a.isPlayer)dm*=Math.max(.55,G.diff.dmg);if(a.downed){if(dm>25)die(a,owner,{wname:pr.name},false);continue;}if(dm>2)damage(a,dm,owner,'body',tv3.subVectors(tv,p).normalize(),pr.name,'blast');}
 for(const v of G.vehicles){if(!v.alive||v===skipVeh||owner&&v===owner.veh)continue;if(owner&&v.team===owner.team)continue;if(v===direct){vehDamage(v,pr.ap||pr.veh,owner,'ap',tv3.subVectors(v.p,p).normalize());continue;}
  const dd=Math.max(0,v.p.distanceTo(p)-(v.kind==='tank'?2.6:2));if(dd<pr.r)vehDamage(v,pr.veh*(1-dd/pr.r),owner,'blast',null);}
 const L=W.near(p.x,p.z,pr.r).slice();for(const i of L){const b=W.boxes[i];if(b.dead)continue;const cx=cl(p.x,b.x0,b.x1),cy=cl(p.y,b.y0,b.y1),cz=cl(p.z,b.z0,b.z1),dd=Math.hypot(p.x-cx,p.y-cy,p.z-cz);if(dd>pr.r)continue;
  if(b.dest>=0){const D=W.dest[b.dest];if(D.alive){D.hp-=pr.dd*(1-dd/pr.r*.7);if(D.hp<=0)destroyDest(D);}}else if(b.tree>=0&&pr.trees&&dd<pr.r*.55)killTree(W.trees[b.tree]);}
 G.noises.push({p:p.clone(),r:70,team:-1,t:G.time,src:owner});}
G.explode=explode;
function destroyDest(D){if(!D.alive)return;D.alive=false;for(const b of D.boxes)b.dead=true;if(D.mesh)S.killDest(D);const p=new V(D.x,D.y+.6,D.z);const col=D.kind==='hay'?0xc8a858:D.kind==='sand'?0x8a7a58:D.kind==='wall'?0x8a8478:D.kind==='tent'?0x5a6040:0x6a4a2c;
 fx.debris.burst(p,10,6,col);fx.smoke.burst(p,8,3,new THREE.Color(.5,.46,.4),1.4,2,{drag:2,grow:1.4,jit:1,up:true});const d=cam.position.distanceTo(p);if(d<70)snd.play('stab',1,panOf(p));}
function killTree(t){if(!t||!t.alive)return;t.alive=false;if(treeBox[t.i])treeBox[t.i].dead=true;S.killTree(t);const p=new V(t.x,t.y+2,t.z);fx.debris.burst(p,8,5,0x4a3a24);fx.smoke.burst(p.setY(t.y+4),8,3,new THREE.Color(.24,.3,.16),1.6,1.6,{drag:2,grow:1.2,jit:1.5});}

/* ---------- bots shooting ---------- */
G.botFire=(a,t,err)=>{const w=a.weapon;eyeOf(a,bEye);centerOf(t,bAim);if(a.ai.headAim&&!t.isVeh)bAim.y+=.42;bDir.subVectors(bAim,bEye).normalize();
 const muzzle=tv3.copy(bEye).addScaledVector(bDir,.75);muzzle.x+=-Math.cos(a.yaw)*.1;muzzle.z+=Math.sin(a.yaw)*.1;muzzle.y-=.16;
 const n=w.pellets?6:1;let res=null;bPerp.crossVectors(bDir,bUp).normalize();const p2=tv2.crossVectors(bPerp,bDir);
 for(let i=0;i<n;i++){const e=(err+(w.pellets?3.5*D2R:0))*Math.sqrt(-2*Math.log(Math.random()+1e-6))*.6,th=Math.random()*6.283;const d=new V().copy(bDir).addScaledVector(bPerp,Math.cos(th)*Math.tan(e)).addScaledVector(p2,Math.sin(th)*Math.tan(e)).normalize();res=shootRay(a,bEye,d,w,300,n);
  if(P&&P.alive&&!P.veh&&!res.a&&t!==P){eyeOf(P,eye);tv.subVectors(eye,bEye);const proj=tv.dot(d);if(proj>0&&proj<res.t){if(tv.addScaledVector(d,-proj).length()<1.4)snd.play('whiz',1,panOf(res.p));}}}
 a.mag--;a.fireT=w.auto?60/w.rpm*1.15:w.bolt?1.9:w.pump?1.0:.32;a.flashT=.05;a.firingT=.6;if(a.rig)a.rig.kick=1;G.noises.push({p:a.pos.clone(),r:60,team:a.team,t:G.time,src:a});
 const dist=cam.position.distanceTo(a.pos);if(Math.random()<.7&&dist<260)fx.tracers.fire(muzzle,res.p,400,2.8,.9,a.team?[6,2.6,1.2]:[5,4.4,2.4]);if(dist<45&&Math.random()<.5)fx.lights.flash(muzzle,0xffa050,6,9,.06);if(dist<160)snd.shot(w.snd,false,dist,panOf(a.pos),false);};
G.reload=a=>{a.reloadDur=a.reloadT=a.weapon.reload*1.25*(a.weapon.shell?a.weapon.mag*.5:1);};
G.fireRPG=(a,tgt,err)=>{eyeOf(a,tv);const d=new V().subVectors(tgt,tv).normalize();d.x+=rr(-1,1)*err;d.y+=rr(-1,1)*err;d.z+=rr(-1,1)*err;d.normalize();tv.addScaledVector(d,.8);tv.y-=.1;spawnProj('rpg',tv,d,a);if(a.rig)a.rig.kick=1;a.firingT=.8;};
G.throwNade=(a,target)=>{eyeOf(a,tv);const dx=target.x-tv.x,dz=target.z-tv.z,dd=Math.hypot(dx,dz),t=cl(dd/14,.6,1.6);const v=new V(dx/t,(target.y-tv.y)/t+.5*GRAV*t,dz/t);spawnNade(tv,v,a,Math.max(t+.4,2.2));if(a.rig)a.rig.throwAnim();};
G.spot=(a,b)=>{b.spotT=G.time+8;};
G.near=()=>G.actors;
G.dropKit=(a,kind)=>{const old=G.kits.findIndex(k=>k.owner===a);if(old>=0){scene.remove(G.kits[old].m);G.kits.splice(old,1);}const m=new THREE.Mesh(kitGeo,kitMats[kind]);if(kind==='med'){const c=kitCross.clone();c.position.y=.16;m.add(c);const c2=c.clone();c2.rotation.y=PI/2;m.add(c2);}
 const x=a.pos.x+Math.sin(a.yaw)*.9,z=a.pos.z+Math.cos(a.yaw)*.9;m.position.set(x,W.ground(x,z,a.pos.y+.5,.2)+.15,z);m.rotation.y=a.yaw;m.castShadow=true;scene.add(m);G.kits.push({kind,owner:a,team:a.team,p:m.position,m,t:16,tick:0,given:new Map()});if(a.rig)a.rig.throwAnim();};
G.repair=(a,v,dt)=>{if(!v.alive||v.hp>=v.S.hp)return;v.hp=Math.min(v.S.hp,v.hp+60*dt);a.repAcc=(a.repAcc||0)+60*dt;if(a.repAcc>120){a.repAcc=0;award(a,20,'REPAIR');}
 if(Math.random()<dt*14){const p=tv.copy(v.p);p.y+=1.2;p.x+=rr(-1,1);p.z+=rr(-1,1);fx.sparks.burst(p,4,3,[new THREE.Color(4,3,1.6)],.04,.3,{grav:9.8,drag:2});}if(a.isPlayer&&Math.random()<dt*10)snd.play('repair');};

/* ================= projectiles ================= */
const PSPD={shell:170,rpg:85,rocket:150,missile:120},PG={shell:9.8,rpg:6.5,rocket:0,missile:0},projPool=[];
function spawnProj(kind,p,d,owner,target){const m=projPool.pop()||new THREE.Mesh(projGeo,projMat);m.position.copy(p);m.scale.setScalar(kind==='shell'?.8:kind==='rpg'?.9:1);scene.add(m);
 const v=d.clone().multiplyScalar(PSPD[kind]);if(owner.veh&&kind!=='shell')v.add(owner.veh.vel);G.proj.push({kind,p:p.clone(),v,owner,target:target||null,t:0,m,veh:owner.veh});
 const dist=cam.position.distanceTo(p);if(kind==='shell'){fx.explode&&fx.sparks.burst(p,20,8,[new THREE.Color(4,2.4,.8)],.5,.15,{dir:d,spread:.3,drag:4});fx.smoke.burst(p,10,4,new THREE.Color(.5,.48,.45),1.2,2.4,{dir:d,spread:.4,drag:2,grow:1.4});fx.lights.flash(p,0xffa050,60,24,.12);snd.play('cannon',Math.max(.15,1-dist/250),panOf(p));}
 else{snd.play(kind==='missile'?'missile':'rocket',Math.max(.1,1-dist/150),panOf(p));fx.smoke.burst(p,4,2,new THREE.Color(.6,.6,.6),.6,1.2,{dir:d,spread:.5,drag:3,grow:1});}
 G.noises.push({p:p.clone(),r:80,team:owner.team,t:G.time,src:owner});}
const segD=new V(),segO=new V();
function stepProj(dt){for(let i=G.proj.length-1;i>=0;i--){const q=G.proj[i];q.t+=dt;
  if(q.kind==='missile'){const sp=Math.min(230,q.v.length()+dt*90);if(q.target&&q.target.alive&&q.t>.25){const want=tv.subVectors(q.target.p,q.p);want.y+=1;want.normalize();const cur=tv2.copy(q.v).normalize();cur.lerp(want,Math.min(1,dt*2.6)).normalize();q.v.copy(cur).multiplyScalar(sp);
    if(q.target.p.distanceTo(q.p)<5){remProj(i);explode(q.p.clone(),q.owner,'missile',q.target);continue;}}else q.v.setLength(sp);}
  else q.v.y-=PG[q.kind]*dt;
  segO.copy(q.p);q.p.addScaledVector(q.v,dt);segD.subVectors(q.p,segO);const L=segD.length();segD.multiplyScalar(1/L);
  W.ray(segO.x,segO.y,segO.z,segD.x,segD.y,segD.z,L,hitOut);let best=hitOut.t,hv=null,ha=null;const wi=hitOut.i;
  for(const v of G.vehicles){if(v===q.veh&&q.t<1||!v.model.root.visible)continue;const t=hitVehicle(v,segO,segD,best);if(t<best){best=t;hv=v;}}
  for(const a of G.actors){if(!a.alive||a.veh||a===q.owner||a.team===q.owner.team)continue;const h=hitActor(a,segO.x,segO.y,segO.z,segD.x,segD.y,segD.z,best);if(h&&h.t<best){best=h.t;ha=a;hv=null;}}
  q.m.position.copy(q.p);q.m.lookAt(tv.copy(q.p).add(q.v));if(Math.random()<(q.kind==='shell'?.5:.9))fx.trail(q.p,q.kind==='shell'?.9:.8,q.kind==='shell'?.5:.9,q.kind==='missile'?2.6:1.6);
  if(best<L){const hp=segO.clone().addScaledVector(segD,best);remProj(i);if(wi===-3&&!hv&&!ha&&best>=hitOut.t-1e-3){fx.impact(hp,new V(0,1,0),'water');fx.smoke.burst(hp,10,4,new THREE.Color(.85,.9,.95),.8,1.4,{dir:bUp,spread:.3,drag:2,grow:1});snd.play('boom',.3,panOf(hp));continue;}
   hp.addScaledVector(segD,-.3);explode(hp,q.owner,q.kind,hv);continue;}
  if(q.t>(q.kind==='rpg'?4:6)||q.p.y<-30){remProj(i);if(q.kind==='rpg'||q.kind==='missile')explode(q.p.clone(),q.owner,q.kind,null);}}}
function remProj(i){const q=G.proj[i];scene.remove(q.m);projPool.push(q.m);G.proj.splice(i,1);}

/* ================= grenades ================= */
function spawnNade(p,v,owner,fuse){const m=new THREE.Mesh(nadeGeo,nadeMat);m.castShadow=true;m.position.copy(p);scene.add(m);G.nades.push({p:p.clone(),v,owner,fuse,m,b:0,rest:false});snd.play('throw');}
function boxAt(x,y,z){const L=W.near(x,z,.3);for(const i of L){const b=W.boxes[i];if(!b.dead&&!b.pass&&x>b.x0&&x<b.x1&&y>b.y0&&y<b.y1&&z>b.z0&&z<b.z1)return b;}return null;}
function stepNades(dt){for(let i=G.nades.length-1;i>=0;i--){const n=G.nades[i];n.fuse-=dt;if(!n.rest){n.v.y-=GRAV*dt;const op=tv.copy(n.p);n.p.addScaledVector(n.v,dt);
  const b=boxAt(n.p.x,n.p.y,n.p.z);if(b){if(op.x<=b.x0||op.x>=b.x1){n.p.x=op.x;n.v.x*=-.4;}else if(op.z<=b.z0||op.z>=b.z1){n.p.z=op.z;n.v.z*=-.4;}else{n.p.y=op.y;n.v.y*=-.3;n.v.x*=.6;n.v.z*=.6;}if(n.b++<6)snd.play('clink',1.2,panOf(n.p));}
  const g=Math.max(W.height(n.p.x,n.p.z),W.inWater(n.p.x,n.p.z)?WL-1.5:-99)+.06;if(n.p.y<g){n.p.y=g;if(Math.abs(n.v.y)>1.2&&n.b++<6)snd.play('clink',1,panOf(n.p));n.v.y*=-.32;n.v.x*=.62;n.v.z*=.62;if(Math.abs(n.v.y)<.5&&n.v.x*n.v.x+n.v.z*n.v.z<.2)n.rest=true;}}
  n.m.position.copy(n.p);n.m.rotation.x+=dt*8;
  if(n.fuse<=0){scene.remove(n.m);G.nades.splice(i,1);explode(n.p.clone().setY(n.p.y+.3),n.owner,'frag');}}}

/* ================= kits ================= */
function stepKits(dt){for(let i=G.kits.length-1;i>=0;i--){const k=G.kits[i];k.t-=dt;k.tick-=dt;if(k.t<=0){scene.remove(k.m);G.kits.splice(i,1);continue;}if(k.tick>0)continue;k.tick=.25;
 for(const a of G.actors){if(a.team!==k.team||!a.alive||a.downed||a.veh)continue;const d=a.pos.distanceTo(k.p);if(d>(k.kind==='med'?5:4))continue;
  if(k.kind==='med'){if(a.hp<a.maxHp){a.hp=Math.min(a.maxHp,a.hp+7);if(a!==k.owner&&(k.given.get(a.id)||0)<G.time){k.given.set(a.id,G.time+6);award(k.owner,15,'HEAL');}if(a.isPlayer&&Math.random()<.2)snd.play('heal');}}
  else{let gave=false;if(a.isPlayer){for(const s of P.slots){const w=WEAPONS[s.id];if(w.tool)continue;if(s.res<w.res){s.res=Math.min(w.res,s.res+Math.ceil(w.mag*.5));gave=true;}}if(P.frags<CLASSES[P.cls].frags){P.frags++;gave=true;}if(gave)snd.play('magin');}
   else if(a.mag<a.weapon.mag*.6||a.nades<1||a.cls==='engineer'&&a.rpg<3){a.mag=a.weapon.mag;a.nades=Math.max(1,a.nades);if(a.cls==='engineer')a.rpg=Math.max(3,a.rpg);gave=true;}
   if(gave&&a!==k.owner&&(k.given.get(a.id)||0)<G.time){k.given.set(a.id,G.time+8);award(k.owner,15,'RESUPPLY');}}}}}

/* ================= vehicle physics hooks ================= */
const CRUSH={fence:1,hay:1,crates:1,tent:1};
G.vehCollide=(v,dt)=>{const f=tv.set(Math.sin(v.yaw),0,Math.cos(v.yaw)),k=v.kind,air=k==='heli'||k==='jet',top=k==='tank'?2.6:k==='jeep'?1.9:2.6;
 for(const[off,r]of v.S.circ){const cx=v.p.x+f.x*off,cz=v.p.z+f.z*off;const L=W.near(cx,cz,r+1).slice();
  for(const i of L){const b=W.boxes[i];if(b.dead||b.pass||b.y1<=v.p.y+(air?.1:.7)||b.y0>=v.p.y+top)continue;const qx=cl(cx,b.x0,b.x1),qz=cl(cz,b.z0,b.z1);let dx=cx-qx,dz=cz-qz;const d2=dx*dx+dz*dz;if(d2>=r*r)continue;
   if(!air&&b.dest>=0){const D=W.dest[b.dest];if(k==='tank'||CRUSH[D.kind]||Math.abs(v.v)>9&&D.kind!=='wall'&&D.kind!=='sand'){destroyDest(D);v.v*=k==='tank'?.9:.75;continue;}}
   if(!air&&b.tree>=0&&k==='tank'&&Math.abs(v.v)>2){killTree(W.trees[b.tree]);v.v*=.8;continue;}
   const d=Math.sqrt(d2)||.001;if(d2<1e-6){dx=cx-(b.x0+b.x1)/2;dz=cz-(b.z0+b.z1)/2;}const l=Math.hypot(dx,dz)||1;v.p.x+=dx/l*(r-d);v.p.z+=dz/l*(r-d);
   const imp=air?Math.hypot(v.vel.x,v.vel.z):Math.abs(v.v);if(k==='jet'){G.crash(v);return;}if(air){v.vel.multiplyScalar(.3);if(imp>10)G.bump(v,imp);}else{if(imp>12&&k==='jeep')G.bump(v,imp*.8);v.v*=.5;}}}
 // vehicle vs vehicle
 for(const u of G.vehicles){if(u===v||!u.model.root.visible)continue;const dx=v.p.x-u.p.x,dz=v.p.z-u.p.z;if(dx*dx+dz*dz>144||Math.abs(v.p.y-u.p.y)>3)continue;
  for(const[o1,r1]of v.S.circ)for(const[o2,r2]of u.S.circ){const ax=v.p.x+Math.sin(v.yaw)*o1,az=v.p.z+Math.cos(v.yaw)*o1,bx=u.p.x+Math.sin(u.yaw)*o2,bz=u.p.z+Math.cos(u.yaw)*o2,ex=ax-bx,ez=az-bz,dd=Math.hypot(ex,ez),rr2=r1+r2;
   if(dd<rr2&&dd>1e-3){const push=(rr2-dd)*(u.alive&&u.kind!=='tank'&&k==='tank'?.3:.6);v.p.x+=ex/dd*push;v.p.z+=ez/dd*push;if(u.alive&&u.kind!=='tank'&&k!=='jet'&&u.kind!=='jet'){u.p.x-=ex/dd*push*.6;u.p.z-=ez/dd*push*.6;}v.v*=.85;
    if(air&&Math.hypot(v.vel.x,v.vel.z)>12)G.bump(v,14);}}}
 // soldiers: roadkill enemies, shove friends
 if(air)return;const spd=Math.abs(v.v);for(const a of G.actors){if(!a.alive||a.veh||Math.abs(a.pos.y-v.p.y)>2.4)continue;for(const[off,r]of v.S.circ){const cx=v.p.x+f.x*off,cz=v.p.z+f.z*off,dx=a.pos.x-cx,dz=a.pos.z-cz,d=Math.hypot(dx,dz);if(d>r+.4)continue;
   if(spd>4&&v.driver&&a.team!==v.team){if(a.downed)die(a,v.driver,{wname:VSPEC[k].name},false);else damage(a,spd*14,v.driver,'body',f,VSPEC[k].name,'blast');}
   if(d>1e-3){a.pos.x+=dx/d*(r+.42-d);a.pos.z+=dz/d*(r+.42-d);}break;}}};
// infantry pushed out of vehicle hulls
function pushFromVehicles(a){for(const v of G.vehicles){if(!v.model.root.visible)continue;const dx0=a.pos.x-v.p.x,dz0=a.pos.z-v.p.z;if(dx0*dx0+dz0*dz0>100)continue;const top=v.kind==='tank'?2.8:v.kind==='jeep'?1.9:2.4;if(a.pos.y>v.p.y+top||a.pos.y+1.8<v.p.y)continue;
 const f=tv2.set(Math.sin(v.yaw),0,Math.cos(v.yaw));for(const[off,r]of v.S.circ){const cx=v.p.x+f.x*off,cz=v.p.z+f.z*off,dx=a.pos.x-cx,dz=a.pos.z-cz,d=Math.hypot(dx,dz),R2=r*(v.kind==='jet'?.6:.92)+PR;if(d<R2&&d>1e-3){a.pos.x+=dx/d*(R2-d);a.pos.z+=dz/d*(R2-d);}}}}

/* ================= vehicle weapons ================= */
const gunDir=(v,o)=>{const y=v.yaw+v.tYaw,e=v.gEl+(v.kind==='heli'?v.pitch:v.pitch*Math.cos(v.tYaw));return o.set(Math.sin(y)*Math.cos(e),Math.sin(e),Math.cos(y)*Math.cos(e));};
const MG={dmg:[24,16],range:[60,160],head:1.4,name:'RANGER MG'},COAX={dmg:[26,18],range:[60,150],head:1.4,name:'COAX MG'},CHIN={dmg:[40,34],range:[60,200],head:1,name:'HORNET 30MM'},JETGUN={dmg:[46,40],range:[100,300],head:1,name:'SABRE CANNON'};
const gd=new V(),gm=new V();
function vehHitscan(v,shooter,w,vdm,spread,range){v.model.root.updateMatrixWorld(true);v.muzzle(gm);const d=v.kind==='jet'?v.fwd(gd):gunDir(v,gd);d.x+=rr(-1,1)*spread;d.y+=rr(-1,1)*spread;d.z+=rr(-1,1)*spread;d.normalize();
 const r=shootRay(shooter,gm,d,w,range,1,vdm);const dist=cam.position.distanceTo(gm);if(Math.random()<.8)fx.tracers.fire(gm,r.p,600,3.4,1,v.team?[6,2.6,1.2]:[5,4.4,2.4]);if(dist<60)fx.lights.flash(gm,0xffa050,8,10,.05);
 if(dist<220)snd.shot({f:v.kind==='heli'||v.kind==='jet'?900:1500,b:v.kind==='jet'?60:90,len:v.kind==='heli'?.22:.12},false,shooter.isPlayer?0:dist,panOf(gm),!!shooter.isPlayer);
 if(shooter.isPlayer)P.shake=Math.max(P.shake,v.kind==='jeep'?.08:.12);G.noises.push({p:v.p.clone(),r:80,team:v.team,t:G.time,src:shooter});return r;}
function vehWeapons(v,dt){const c=v.ctrl,k=v.kind;const sh=k==='jeep'?v.seats[1]:v.seats[0];if(!sh){c.fire=c.fire2=false;return;}
 if(k==='tank'){if(c.fire&&v.reload<=0){v.reload=sh.isPlayer?3.0:4.4;v.model.root.updateMatrixWorld(true);v.muzzle(gm);gunDir(v,gd);spawnProj('shell',gm,gd,sh);v.vis.rec=1;if(sh.isPlayer){P.shake=Math.max(P.shake,.5);}}
  if(c.fire2&&v.fireT<=0){v.fireT=.1;vehHitscan(v,sh,COAX,8,.006,240);}}
 else if(k==='jeep'){if(c.fire&&v.fireT<=0&&v.heat<1&&!v.over){v.fireT=.085;v.heat+=.028;if(v.heat>=1)v.over=true;vehHitscan(v,sh,MG,14,.008,260);}if(v.over&&v.heat<.4)v.over=false;}
 else if(k==='heli'){if(c.fire&&v.fireT<=0){v.fireT=.13;const r=vehHitscan(v,sh,CHIN,16,.009,300);if(r.t<300&&(v.burstN=(v.burstN||0)+1)%2===0)explode(r.p.clone(),sh,'chin',r.v);}
  if(v.ammo2<=0&&v.reload2<=0)v.ammo2=14;if(c.fire2&&v.ammo2>0&&v.reload2<=0){v.ammo2--;v.reload2=v.ammo2?.26:7;const pod=v.model.pods[v.ammo2%2];v.model.root.updateMatrixWorld(true);pod.getWorldPosition(gm);gm.addScaledVector(v.fwd(gd),1.2);
   const d=tv3.subVectors(c.aim,gm).normalize();const f=v.fwd(gd);if(d.dot(f)<.9)d.lerp(f,.6).normalize();d.x+=rr(-.012,.012);d.y+=rr(-.012,.012);spawnProj('rocket',gm,d.clone(),sh);}}
 else if(k==='jet'&&v.state==='air'){if(c.fire&&v.fireT<=0){v.fireT=.065;vehHitscan(v,sh,JETGUN,60,.007,500);}
  if(v.ammo2<=0&&v.reload2<=0)v.ammo2=2;if(c.fire2&&v.ammo2>0&&v.reload2<=0&&v.lock&&v.lockT>=1.2){v.ammo2--;v.reload2=v.ammo2?1.2:10;const f=v.fwd(gd);gm.copy(v.p).addScaledVector(f,3);gm.y-=.6;spawnProj('missile',gm,f.clone(),sh,v.lock);
   if(v.lock.seats.some(s=>s&&s.isPlayer)){HUD.ann(G,'MISSILE INBOUND',2);snd.play('alarm');}}}}
function jetLock(v,dt){if(v.kind!=='jet'||v.state!=='air'){v.lock=null;v.lockT=0;return;}v.lockScan=(v.lockScan||0)-dt;if(v.lockScan<=0){v.lockScan=.15;const f=v.fwd(gd);let best=null,bs=-1;
  for(const u of G.vehicles){if(u.team===v.team||!u.alive||!u.occupied())continue;const d=tv.subVectors(u.p,v.p),l=d.length();if(l>520||l<30)continue;const c=d.dot(f)/l;if(c<.965)continue;const s=c-l/3000;if(s>bs){tv2.copy(u.p);tv2.y+=1.5;if(W.los(v.p,tv2)){bs=s;best=u;}}}
  if(best!==v.lock){v.lock=best;v.lockT=0;}}if(v.lock){if(!v.lock.alive){v.lock=null;v.lockT=0;return;}const was=v.lockT;v.lockT+=dt;if(v.seats[0]&&v.seats[0].isPlayer){if(was<1.2&&v.lockT>=1.2)snd.play('locked');else if(v.lockT<1.2&&((was*6|0)!==(v.lockT*6|0)))snd.play('lock');}}}
function updateVehicles(dt){for(const v of G.vehicles){
 if(v.alive){if(!v.occupied()){const c=v.ctrl;c.thr=c.steer=c.lift=c.side=0;c.fire=c.fire2=false;v.idleT+=dt;}else v.idleT=0;
  v.step(dt,G);jetLock(v,dt);vehWeapons(v,dt);
  if(v.alive&&v.hp<v.S.hp*.35&&Math.random()<dt*14){const p=tv.copy(v.p);p.y+=v.kind==='tank'?2.6:1.6;fx.smoke.emit(p.x,p.y,p.z,rr(-.3,.3),rr(1.5,2.5),rr(-.3,.3),.18,.17,.16,1.4,2.6,0,.4,.8);if(v.hp<v.S.hp*.18&&Math.random()<.4)fx.sparks.burst(p,2,2,[new THREE.Color(4,1.8,.4)],.4,.4,{up:true,grav:-2});}
  if(v.kind!=='jet'&&v.idleT>90&&Math.hypot(v.p.x-v.home.x,v.p.z-v.home.z)>25){v.restore();}
  if(!isFinite(v.p.x+v.p.y+v.p.z))v.restore();}
 else{v.step(dt,G);if(v.wreckT<12&&Math.random()<dt*10){fx.smoke.emit(v.p.x+rr(-1,1),v.p.y+1.8,v.p.z+rr(-1,1),rr(-.3,.3),rr(2,3),rr(-.3,.3),.1,.1,.1,2,3.4,0,.4,.8);}
  if(v.respawnT<=0&&v.wreckT>14&&!G.vehicles.some(u=>u!==v&&u.alive&&Math.hypot(u.p.x-v.home.x,u.p.z-v.home.z)<6)){v.restore();}}
 v.sync(dt,G.time);}}

/* ================= conquest ================= */
function updateConquest(dt){let c0=0,c1=0;G.capPoint=null;const live=G.app==='play'&&!G.over;
 for(const p of G.points){let n0=0,n1=0;for(const a of G.actors){if(!a.alive||a.downed)continue;const q=a.veh?a.veh.p:a.pos;if(a.veh&&(a.veh.kind==='jet'||a.veh.p.y-p.y>14))continue;if(Math.hypot(q.x-p.x,q.z-p.z)<p.r&&Math.abs(q.y-p.y)<16){if(a.team)n1++;else n0++;
   if(a.isPlayer)G.capPoint=p;}}
  p.n0=n0;p.n1=n1;p.contest=n0>0&&n1>0||p.own===0&&n1>0||p.own===1&&n0>0;const df=n0-n1;
  if(df){const rate=.1*(1+.5*(Math.min(3,Math.abs(df))-1))*(G.app==='menu'?1.4:1),prev=p.prog;p.prog=cl(p.prog+Math.sign(df)*rate*dt,-1,1);
   if(p.own!==-1&&(prev>0&&p.prog<=0||prev<0&&p.prog>=0)){const lost=p.own;p.own=-1;event(p,'neutral',lost,df>0?0:1);}
   if(p.prog>=1&&p.own!==0){p.own=0;event(p,'cap',0);}else if(p.prog<=-1&&p.own!==1){p.own=1;event(p,'cap',1);}}
  else if(!n0&&!n1&&p.own>=0){const t=p.own?-1:1;p.prog+=(t-p.prog)*Math.min(1,dt*.15);}
  if(p.own===0)c0++;else if(p.own===1)c1++;
  const f=p.flag.userData;const col=p.own===0?0x3a86e8:p.own===1?0xd8382c:0xe8e4dc;if(f._c!==col){f._c=col;f.mat.color.set(col);f.ring.material.color.set(p.own===0?0x4aa8ff:p.own===1?0xff3b30:0xffffff);}
  if(f.cloth.visible&&p.flag.position.distanceTo(cam.position)<300)waveFlag(p.flag,G.time+p.i,Math.max(.12,Math.abs(p.prog)));}
 const df=c0-c1,b=Math.abs(df)>0?.07+.065*Math.abs(df)+(df>0&&!c1||df<0&&!c0?.12:0):0;G.bleed=[df<0?b:0,df>0?b:0];
 for(let t=0;t<2;t++)G.tickets[t]=Math.max(0,G.tickets[t]-G.bleed[t]*dt*G.bleedK);
 if(G.app==='menu'){for(let t=0;t<2;t++)if(G.tickets[t]<40)G.tickets[t]=G.maxTickets;return;}
 if(!live)return;G.clock-=dt;
 if(G.tickets[0]<=0||G.tickets[1]<=0){const w=G.tickets[0]>0;endMatch(w?'win':'lose',w?'VICTORY':'DEFEAT',w?'KORVAN BLOC RAN OUT OF TICKETS':'OUR ARMY RAN OUT OF TICKETS');}
 else if(G.clock<=0){const a=Math.ceil(G.tickets[0]),b2=Math.ceil(G.tickets[1]);endMatch(a>b2?'win':a<b2?'lose':'draw',a>b2?'VICTORY':a<b2?'DEFEAT':'STALEMATE','TIME LIMIT REACHED');}
 if(!G.warned&&Math.min(...G.tickets)<G.maxTickets*.2){G.warned=1;const low=G.tickets[0]<G.tickets[1]?0:1;HUD.radio(G,'HQ',low?'Korvan tickets are almost gone. Push them out!':'We are almost out of reinforcements. Take those flags!',true);snd.play('radio');}}
function event(p,kind,team,by){const mine=team===0;
 if(kind==='cap'){for(const a of G.actors)if(a.team===team&&a.alive&&!a.downed&&Math.hypot((a.veh?a.veh.p:a.pos).x-p.x,(a.veh?a.veh.p:a.pos).z-p.z)<p.r){a.stats.caps++;award(a,150,'FLAG CAPTURED');}
  if(G.app==='play'){HUD.banner(G,mine?`${p.id} CAPTURED`:`${p.id} LOST`,p.name,mine?'#7cc0ff':'#ff6a5e',2.2);snd.play(mine?'capture':'lost');HUD.radio(G,'HQ',mine?`${p.name} is ours. Hold it.`:`Korvan have taken ${p.name}.`,true);}}
 else if(kind==='neutral'){for(const a of G.actors)if(a.team===by&&a.alive&&!a.downed&&Math.hypot((a.veh?a.veh.p:a.pos).x-p.x,(a.veh?a.veh.p:a.pos).z-p.z)<p.r)award(a,75,'FLAG NEUTRALIZED');
  if(G.app==='play'&&team===0)HUD.ann(G,`WE ARE LOSING ${p.id} · ${p.name}`,2.4);}}

/* ================= input ================= */
const keys={},edge={},mouse={dx:0,dy:0,l:false,r:false,le:false,re:false};let locked=false;
addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(!keys[e.code])edge[e.code]=true;keys[e.code]=true;
 if(['Space','Tab','ArrowUp','ArrowDown','KeyQ','ControlLeft','KeyF'].includes(e.code)&&G.app==='play')e.preventDefault();if(e.code==='Tab')e.preventDefault();
 if(e.code==='Escape'){if(G.app==='paused')pause(false);else if(G.app==='play'&&!G.over&&!G.deploy)pause(true);}});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;mouse.l=mouse.r=false;});
canvas.addEventListener('mousedown',e=>{if(G.app!=='play'||G.deploy)return;if(!locked&&!G.noLock)lockPointer();if(e.button===0){mouse.l=true;mouse.le=true;}if(e.button===2){mouse.r=true;mouse.re=true;}});
addEventListener('mouseup',e=>{if(e.button===0)mouse.l=false;if(e.button===2)mouse.r=false;});
addEventListener('contextmenu',e=>{if(G.app==='play')e.preventDefault();});
addEventListener('mousemove',e=>{if(locked||(G.app==='play'&&e.buttons&&!G.noLock&&!G.deploy)){mouse.dx+=e.movementX;mouse.dy+=e.movementY;}});
addEventListener('wheel',e=>{if(G.app==='play'&&P&&P.alive&&!P.veh&&!P.downed){const n=P.slots.length;queueSwap((P.cur+(e.deltaY>0?1:n-1))%n);}},{passive:true});
function lockPointer(){try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}}
document.addEventListener('pointerlockchange',()=>{const was=locked;locked=document.pointerLockElement===canvas;if(was&&!locked&&G.app==='play'&&!G.over&&!G.deploy)pause(true);});
function pause(on){if(on&&G.app==='play'){G.app='paused';HUD.showPause(true);document.body.classList.remove('playing');snd.engine(null);if(document.exitPointerLock&&locked)document.exitPointerLock();}
 else if(!on&&G.app==='paused'){G.app='play';HUD.showPause(false);document.body.classList.add('playing');if(!G.noLock&&!G.deploy)lockPointer();}}
G.pause=pause;
const pad={prev:{}};
function readPad(){const gps=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const g=gps[0];if(!g)return null;const ax=g.axes,bt=g.buttons,dz=v=>Math.abs(v)>.15?(v-Math.sign(v)*.15)/.85:0;
 const st={mx:dz(ax[0]||0),my:dz(ax[1]||0),lx:dz(ax[2]||0),ly:dz(ax[3]||0),fire:(bt[7]?.value||0)>.3,ads:(bt[6]?.value||0)>.3};const pr=pad.prev,b=i=>!!bt[i]?.pressed,e=i=>b(i)&&!pr[i];
 st.jump=e(0);st.jumpH=b(0);st.crouchE=e(1);st.crouchH=b(1);st.use=b(2);st.useE=e(2);st.swap=e(3);st.frag=e(5);st.ability=e(4);st.sprint=b(10);st.start=e(9);st.back=b(8);for(let i=0;i<17;i++)pr[i]=b(i);return st;}

/* ================= player ================= */
function setupPlayer(){const p=P,C=CLASSES[G.cls];p.cls=G.cls;p.weapon=WEAPONS[opt.wsel[G.cls]];const prim=opt.wsel[G.cls];
 p.slots=[{id:prim},{id:'pistol'}];if(p.cls==='engineer')p.slots.push({id:'rpg'},{id:'tool'});for(const s of p.slots){s.att=['ar','smg','lmg'].includes(s.id)?{reddot:1}:{};s.mag=WEAPONS[s.id].mag;s.res=WEAPONS[s.id].res;}
 Object.assign(p,{onGround:true,crouch:false,crouchV:0,sprint:false,eyeH:EYE,cur:0,fireT:0,reloadT:0,reloadDur:0,swapT:0,swapTo:-1,boltT:0,adsV:0,shotI:0,bloom:0,recP:0,recY:0,lastShot:-9,frags:C.frags,throwT:0,shake:0,stepD:0,landT:0,kick:0,
  interact:0,deathT:0,punch:0,punchP:0,camKick:0,abilityT:0,heat:0,giveT:0,chute:false,swim:false,cyaw:0,cpitch:0,zoom:false,vslot:0,oob:0});showGun();}
function curW(){return WEAPONS[P.slots[P.cur].id];}
function startReload(){const p=P,s=p.slots[p.cur],w=WEAPONS[s.id];if(s.res<=0||w.tool)return;p.reloadEmpty=s.mag===0;p.reloadDur=p.reloadT=w.shell?w.reload*1.35:(p.reloadEmpty?w.reloadE:w.reload);p.adsV=Math.min(p.adsV,.99);}
function queueSwap(i){const p=P;if(!p||!p.alive||p.downed||i>=p.slots.length||i===p.cur&&p.swapTo<0||p.swapT>0)return;p.swapTo=i;p.swapT=.55;p.reloadT=0;snd.play('swap');}
const camDir=o=>{const cp=Math.cos(P.pitch+P.camKick);return o.set(Math.sin(P.yaw)*cp,Math.sin(P.pitch+P.camKick),Math.cos(P.yaw)*cp);};
function updatePlayer(dt){const p=P;if(!p)return;const gp=readPad();if(gp&&gp.start&&G.app==='play'&&!G.deploy){pause(true);return;}
 G.scoreboard=keys.Tab||(gp&&gp.back);
 if(p.veh){updatePlayerVehicle(dt,gp);return;}
 if(!p.alive){mouse.dx=mouse.dy=0;p.deathT+=dt;if(p.deathT>2.4&&!G.deploy&&!G.over)openDeploy();return;}
 if(p.downed){mouse.dx=mouse.dy=0;p.downT-=dt;const give=keys.Space||(gp&&gp.jumpH);p.giveT=give?p.giveT+dt:0;G.medicNear=G.actors.some(a=>a.team===0&&a.cls==='medic'&&a.ai&&a.ai.job&&a.ai.job.t===p);
  if(give)HUD.prompt(G,'GIVING UP…',p.giveT);if(p.giveT>1||p.downT<=0)die(p,null,{wname:'BLED OUT'});return;}
 const s=p.slots[p.cur],w=curW();p.weapon=w;
 const sens=.0022*opt.sens*(1-p.adsV*(1-1/w.adsZoom));p.yaw-=mouse.dx*sens;p.pitch-=mouse.dy*sens;vmS.mdx+=mouse.dx;vmS.mdy+=mouse.dy;mouse.dx=mouse.dy=0;if(keys.ArrowLeft)p.yaw+=2.2*dt;if(keys.ArrowRight)p.yaw-=2.2*dt;if(keys.ArrowUp)p.pitch+=1.6*dt;if(keys.ArrowDown)p.pitch-=1.6*dt;
 if(gp){const k=(3.2-p.adsV*2)*opt.sens*dt,acc=x=>Math.sign(x)*Math.pow(Math.abs(x),1.7);p.yaw-=acc(gp.lx)*k;p.pitch-=acc(gp.ly)*k*.75;}
 p.pitch=cl(p.pitch,-1.45,1.45);
 const fireHeld=mouse.l||(gp&&gp.fire),fireEdge=mouse.le||!!(gp&&gp.fire&&!pad.fireWas);if(gp)pad.fireWas=gp.fire;mouse.le=false;const adsHeld=mouse.r||(gp&&gp.ads);
 let fwd=(keys.KeyW?1:0)-(keys.KeyS?1:0),sx=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(gp){fwd=fwd||-gp.my;sx=sx||gp.mx;}const ml=Math.hypot(fwd,sx);if(ml>1){fwd/=ml;sx/=ml;}
 if(edge.KeyC||(gp&&gp.crouchE))p.crouch=!p.crouch;const wantCrouch=(p.crouch||keys.ControlLeft)&&!p.swim;
 p.swim=W.depth(p.pos.x,p.pos.z)>1.15&&!W.onBridge(p.pos.x,p.pos.z)&&p.pos.y<WL-.6;
 p.sprint=!!(keys.ShiftLeft||keys.ShiftRight||(gp&&gp.sprint))&&fwd>.5&&p.onGround&&!wantCrouch&&!adsHeld&&!fireHeld&&!p.swim;if(p.sprint)p.crouch=false;
 const fwx=Math.sin(p.yaw),fwz=Math.cos(p.yaw),rx=-Math.cos(p.yaw),rz=Math.sin(p.yaw);
 let spd=4.6*w.speed;if(p.sprint)spd=7.1*w.speed;if(wantCrouch)spd=2.3*w.speed;spd*=1-p.adsV*.45;if(p.swim)spd=2.4;
 const wx=(fwx*fwd+rx*sx)*spd,wz=(fwz*fwd+rz*sx)*spd;const acc=p.onGround||p.swim?13:2.5,k=1-Math.exp(-acc*dt);p.vel.x+=(wx-p.vel.x)*k;p.vel.z+=(wz-p.vel.z)*k;
 if((edge.Space||(gp&&gp.jump))&&p.onGround&&!p.swim){if(wantCrouch)p.crouch=false;else{p.vel.y=5.4;p.onGround=false;}}
 p.vel.y-=GRAV*dt;if(p.chute){p.vel.y=Math.max(p.vel.y,-5);if(Math.random()<dt*3)fx.trail(tv.copy(p.pos).setY(p.pos.y+3),.95,.8,1);}
 p.pos.x+=p.vel.x*dt;p.pos.z+=p.vel.z*dt;p.pos.y+=p.vel.y*dt;
 for(const a of G.actors){if(a===p||!a.alive||a.veh)continue;const dx=p.pos.x-a.pos.x,dz=p.pos.z-a.pos.z,d2=dx*dx+dz*dz;if(d2<.49&&d2>1e-6&&Math.abs(a.pos.y-p.pos.y)<1.5){const d=Math.sqrt(d2);p.pos.x+=dx/d*(.7-d);p.pos.z+=dz/d*(.7-d);}}
 W.collide(p.pos,PR,p.crouchV>.5?1.15:1.8);pushFromVehicles(p);
 let g=W.ground(p.pos.x,p.pos.z,p.pos.y,PR*.7);if(p.swim)g=Math.max(g,WL-1.4);
 if(p.pos.y<=g+.001&&p.vel.y<=0){if(!p.onGround){const fv=-p.vel.y;if(fv>4){snd.play('land');p.landT=Math.min(1,fv/10);vmS.land=Math.min(1,fv/8);}if(fv>13&&!p.chute)damage(p,(fv-13)*9,null,'legs',null,'FALL');}p.pos.y=g;p.vel.y=0;p.onGround=true;p.chute=false;}
 else if(p.pos.y>g+.001){if(p.onGround&&p.pos.y-g<STEPUP+.2&&p.vel.y<=0)p.pos.y=g;else p.onGround=false;}
 const hs=Math.hypot(p.vel.x,p.vel.z);p.speed=hs;if(p.onGround&&hs>1){p.stepD+=hs*dt;const stride=p.sprint?2.6:wantCrouch?1.6:2.1;if(p.stepD>stride){p.stepD=0;snd.play(p.swim?'smoke':'step',p.sprint?1.4:wantCrouch?.4:.9);}}
 p.crouchV+=((wantCrouch?1:0)-p.crouchV)*Math.min(1,dt*10);const eyeT=p.swim?.25:EYE-(EYE-CEYE)*p.crouchV;p.eyeH+=(eyeT-p.eyeH)*Math.min(1,dt*14);
 p.fireT-=dt;p.boltT-=dt;p.throwT-=dt;p.shake=Math.max(0,p.shake-dt*1.8);p.landT=Math.max(0,p.landT-dt*3);p.firingT-=dt;p.abilityT-=dt;
 for(let i=0;i<p.slots.length;i++)if(edge['Digit'+(i+1)])queueSwap(i);if(gp&&gp.swap)queueSwap((p.cur+1)%p.slots.length);
 if(p.swapT>0){p.swapT-=dt;if(p.swapTo>=0&&p.swapT<.28){p.cur=p.swapTo;p.swapTo=-1;showGun();p.shotI=0;}}
 if((edge.KeyR||(gp&&gp.useE&&!nearUse()))&&p.reloadT<=0&&s.mag<WEAPONS[s.id].mag&&s.res>0&&p.swapT<=0)startReload();
 if(p.reloadT>0){const before=p.reloadT;p.reloadT-=dt;const kk=1-p.reloadT/p.reloadDur,k0=1-before/p.reloadDur;if(k0<.18&&kk>=.18)snd.play('magout');if(k0<.6&&kk>=.6)snd.play('magin');if(p.reloadT<=0){const n=Math.min(w.mag-s.mag,s.res);s.mag+=n;s.res-=n;}}
 const canAds=adsHeld&&p.swapT<=0&&!p.sprint&&!p.swim&&!(p.reloadT>0)&&!w.tool;const adsT=canAds?1:0;p.adsV+=(adsT-p.adsV)*Math.min(1,dt/(w.ads*.45));if(Math.abs(p.adsV-adsT)<.01)p.adsV=adsT;
 // fire
 const want=w.auto?(fireHeld||fireEdge):fireEdge;if(want&&p.sprint)p.sprint=false;
 if(w.tool){p.torch=fireHeld&&p.swapT<=0&&!p.overheat;if(p.torch){p.heat=Math.min(1,p.heat+dt*.2);if(p.heat>=1)p.overheat=true;torch(dt);}else p.heat=Math.max(0,p.heat-dt*.3);if(p.overheat&&p.heat<.35)p.overheat=false;}
 else{if(!p.torch)p.heat=Math.max(0,p.heat-dt*.3);if(want&&p.fireT<=0&&p.boltT<=0&&p.reloadT<=0&&p.swapT<=0&&!p.swim&&p.throwT<=0){if(s.mag>0){if(w.proj)playerRPG(s);else playerShoot(w,s);}else if(fireEdge){snd.play('dry');if(s.res>0)startReload();}}}
 if(!fireHeld&&G.time-p.lastShot>.08)p.shotI=Math.max(0,p.shotI-dt*14);
 if(G.time-p.lastShot>.1){const kk=Math.min(1,dt*7);p.pitch-=p.recP*kk*.85;p.yaw-=p.recY*kk*.85;p.recP-=p.recP*kk;p.recY-=p.recY*kk;}p.bloom=Math.max(0,p.bloom-dt*(p.adsV>.5?6:3.5));
 if((edge.KeyQ||(gp&&gp.frag))&&p.frags>0&&p.throwT<=0&&!p.swim){p.frags--;eyeOf(p,tv);const d=camDir(new V());const v=d.clone().multiplyScalar(17.5);v.y+=3.2;v.add(tv2.set(p.vel.x,0,p.vel.z));tv.addScaledVector(d,.4);spawnNade(tv,v,p,2.6);p.throwT=.45;}
 if((edge.KeyF||(gp&&gp.ability))&&p.abilityT<=0)ability();
 if(edge.KeyZ)spotSingle();
 // interact (E): enter vehicle / revive
 const useHeld=keys.KeyE||(gp&&gp.use),useEdge=edge.KeyE||(gp&&gp.useE);const veh=nearVehicle();let revT=null;if(p.cls==='medic')for(const a of G.actors)if(a.team===0&&a.downed&&a.pos.distanceTo(p.pos)<2.4){revT=a;break;}
 if(revT){p.interact=useHeld?p.interact+dt:0;HUD.prompt(G,useHeld?'REVIVING '+revT.name:'HOLD E · REVIVE '+revT.name,p.interact/1.2);if(p.interact>1.2){G.revive(p,revT);p.interact=0;}}
 else if(veh){p.interact=0;HUD.prompt(G,`E · ENTER ${VSPEC[veh.kind].name}`+(p.cls==='engineer'&&veh.hp<veh.S.hp?' · TORCH (4) TO REPAIR':''));if(useEdge){enterVehicle(p,veh);return;}}
 else p.interact=0;
 if(p.cls==='engineer'&&!veh){const dv=G.vehicles.find(v=>v.alive&&v.team===0&&v.hp<v.S.hp&&v.p.distanceTo(p.pos)<7);if(dv&&!w.tool)HUD.prompt(G,'DAMAGED VEHICLE · TORCH (4) TO REPAIR');}
 if(G.time-p.hurtT>5&&p.hp<p.maxHp)p.hp=Math.min(p.maxHp,p.hp+18*dt);
 p.lowAmmo=p.slots[0].res<WEAPONS[p.slots[0].id].mag;if(p.cls==='engineer')p.rpg=p.slots[2].res;
 oob(dt,p.pos,PLAY);}
function nearVehicle(){let best=null,bd=4.6;for(const v of G.vehicles){if(!v.alive||v.team!==0||v.freeSeat()<0)continue;const d=Math.hypot(v.p.x-P.pos.x,v.p.z-P.pos.z)-(v.kind==='tank'?2.2:v.kind==='jet'?3:1.4);if(d<bd&&Math.abs(v.p.y-P.pos.y)<3.5){bd=d;best=v;}}return best;}
function nearUse(){return !!nearVehicle();}
function oob(dt,p,lim){const out=Math.max(Math.abs(p.x),Math.abs(p.z))>lim;if(out){G.oobT=(G.oobT>0?G.oobT:10)-dt;if(G.oobT<=0){G.oobT=0;if(P.veh)vehDamage(P.veh,9999,null,'ap');else die(P,null,{wname:'DESERTION'});}}else G.oobT=0;}
function torch(dt){eyeOf(P,eye);const d=camDir(tv3);let best=null,bt=4.5;for(const v of G.vehicles){if(!v.alive||v.team!==0)continue;const t=hitVehicle(v,eye,d,bt);if(t<bt){bt=t;best=v;}}
 const tip=tv.copy(eye).addScaledVector(d,Math.min(bt,1.2));if(Math.random()<dt*30)fx.sparks.burst(tip,2,2.5,[new THREE.Color(3,3.2,4)],.03,.2,{grav:9.8,drag:2});if(best)G.repair(P,best,dt*1.3);else if(Math.random()<dt*8)snd.play('repair');}
function ability(){const p=P,C=CLASSES[p.cls];p.abilityT=C.cd;
 if(p.cls==='assault'){G.dropKit(p,'ammo');HUD.ann(G,'AMMO CRATE DEPLOYED',1.4);}
 else if(p.cls==='medic'){G.dropKit(p,'med');HUD.ann(G,'MED KIT DEPLOYED',1.4);}
 else if(p.cls==='engineer'){const v=G.vehicles.find(v=>v.alive&&v.team===0&&v.p.distanceTo(p.pos)<10&&v.hp<v.S.hp);if(v){v.hp=Math.min(v.S.hp,v.hp+160);award(p,30,'REPAIR');snd.play('repair');fx.sparks.burst(tv.copy(v.p).setY(v.p.y+2),30,4,[new THREE.Color(3,3.2,4)],.05,.4,{grav:9.8,up:true});}else{p.abilityT=1;HUD.ann(G,'NO DAMAGED VEHICLE NEARBY',1.2);}}
 else{eyeOf(p,eye);const d=camDir(tv3);let n=0;const spotIt=t=>{t.spotT=G.time+10;n++;};
  for(const a of G.actors){if(a.team!==1||!a.alive||a.downed)continue;const q=a.veh?a.veh.p:a.pos;tv.subVectors(q,eye);const l=tv.length();if(l>320||tv.dot(d)/l<.87)continue;tv2.copy(q);tv2.y+=1.2;if(a.veh||W.los(eye,tv2)){spotIt(a);p.lastSpot=a.id;}}
  for(const v of G.vehicles){if(v.team!==1||!v.alive||!v.occupied())continue;tv.subVectors(v.p,eye);const l=tv.length();if(l<500&&tv.dot(d)/l>.87)spotIt(v);}
  snd.play('spot');HUD.ann(G,n?`${n} ENEMIES SPOTTED`:'NO ENEMIES SPOTTED',1.4);if(n)award(p,5*Math.min(n,6),'SPOT');}}
function spotSingle(){if(P.spotCd>G.time)return;P.spotCd=G.time+1.5;eyeOf(P,eye);const d=camDir(tv3);let best=null,bs=.985;for(const a of G.actors){if(a.team!==1||!a.alive||a.downed)continue;const q=a.veh?a.veh.p:a.pos;tv.subVectors(q,eye);tv.y+=1.2;const l=tv.length();if(l>350)continue;const c=tv.dot(d)/l;if(c>bs){tv2.copy(q);tv2.y+=1.2;if(a.veh||W.los(eye,tv2)){bs=c;best=a;}}}
 if(best){best.spotT=G.time+8;P.lastSpot=best.id;if(best.veh)best.veh.spotT=G.time+8;snd.play('spot');}}
const sDir=new V(),sP1=new V(),sP2=new V(),ejW=new V(),ejV=new V();
function playerShoot(w,s){const p=P;s.mag--;p.fireT=60/w.rpm;p.lastShot=G.time;p.stats.shots++;camDir(sDir);eye.set(p.pos.x,p.pos.y+p.eyeH,p.pos.z);
 const moving=Math.min(1,Math.hypot(p.vel.x,p.vel.z)/5),air=p.onGround?0:1;let spread=(w.hip*(1+moving*w.move*.35+air*.8)*(p.crouchV>.5?.75:1)+p.bloom)*(1-p.adsV)+(w.adsSpr+moving*.4*(w.scope?2:0))*p.adsV;if(w.scope&&p.adsV<.95)spread=Math.max(spread,w.hip*(1-p.adsV));
 const n=w.pellets||1;sP1.crossVectors(sDir,bUp).normalize();sP2.crossVectors(sP1,sDir);let last=null;
 for(let i=0;i<n;i++){const e=spread*D2R*Math.sqrt(Math.random()),th=Math.random()*6.283,d=new V().copy(sDir).addScaledVector(sP1,Math.cos(th)*Math.tan(e)).addScaledVector(sP2,Math.sin(th)*Math.tan(e)).normalize();last=shootRay(p,eye,d,w,320,n);}
 const[pv,ph]=pattern(w.id,p.shotI|0);const rm=(p.crouchV>.5?.85:1)*(1-p.adsV*.18);const dp=w.recoil[0]*pv*rm*D2R*(.9+Math.random()*.2),dy=w.recoil[1]*ph*rm*D2R+(Math.random()-.5)*w.recoil[1]*.3*D2R;
 p.pitch+=dp;p.yaw-=dy;p.recP+=dp;p.recY-=dy;p.shotI++;p.bloom=Math.min(w.hip*1.6,p.bloom+(w.auto?.35:1.2));p.kick=1;p.camKick+=w.kick*.012*(1-p.adsV*.4);
 const K=w.kick*(1-p.adsV*.45);vmS.pv.z+=.9*K;vmS.rv.x+=7*K;vmS.rv.y+=(Math.random()-.5)*3*K;vmS.rv.z+=(Math.random()-.5)*5*K;vmS.pv.y+=.12*K;
 if(w.bolt){p.boltT=60/w.rpm;setTimeout(()=>snd.play('bolt'),260);}if(w.pump){p.boltT=60/w.rpm;setTimeout(()=>snd.play('pump'),200);}
 const g=VM.guns[s.id].userData;g.flash.visible=true;g.flash.rotation.z=Math.random()*6.28;g.flash.scale.setScalar(.7+Math.random()*.5);vmFlash.intensity=3;if(!w.bolt&&!w.pump)ejectCasing(g);
 const mw=tv.copy(eye).addScaledVector(sDir,.6).addScaledVector(sP1,.1*(1-p.adsV)).addScaledVector(sP2,-.08);fx.lights.flash(mw,0xffa050,10,11,.06);
 if(last&&(p.shotI%2===0||!w.auto))fx.tracers.fire(tv2.copy(mw).addScaledVector(sDir,1.2),last.p,480,3.2,1,[6,4.6,2.4]);
 snd.shot(w.snd,false,0,0,true);p.firingT=.8;G.noises.push({p:p.pos.clone(),r:60,team:0,t:G.time,src:p});
 if(s.mag===0&&s.res>0)setTimeout(()=>{if(P&&P.alive&&P.slots[P.cur]===s&&s.mag===0&&P.reloadT<=0)startReload();},w.bolt?600:220);}
function playerRPG(s){const p=P;s.mag--;p.fireT=.6;p.lastShot=G.time;eye.set(p.pos.x,p.pos.y+p.eyeH,p.pos.z);camDir(sDir);sP1.crossVectors(sDir,bUp).normalize();const o=tv.copy(eye).addScaledVector(sDir,.9).addScaledVector(sP1,.12*(1-p.adsV));o.y-=.08;
 const d=sDir.clone();if(p.adsV<.5){d.x+=rr(-.02,.02);d.y+=rr(-.02,.02);d.normalize();}spawnProj('rpg',o,d,p);vmS.pv.z+=2.4;vmS.rv.x+=11;p.shake=Math.max(p.shake,.35);p.camKick+=.03;p.firingT=1;
 if(s.res>0)setTimeout(()=>{if(P&&P.alive&&P.slots[P.cur]===s&&s.mag===0&&P.reloadT<=0)startReload();},450);}
function ejectCasing(g){if(!g.eject||!shownGun)return;shownGun.updateMatrix();ejW.copy(g.eject).applyMatrix4(shownGun.matrix);ejV.set(1.6+Math.random()*.6,1.2+Math.random()*.6,.4+Math.random()*.3);VM.casings.add(ejW,ejV);}

/* ---------- player in a vehicle ---------- */
function updatePlayerVehicle(dt,gp){const p=P,v=p.veh,c=v.ctrl,k=v.kind;if(!v.alive){exitVehicle(p,true);return;}
 const sens=.0022*opt.sens*(p.zoom?.32:1);p.cyaw-=mouse.dx*sens;p.cpitch-=mouse.dy*sens;mouse.dx=mouse.dy=0;if(gp){const kk=2.4*opt.sens*dt;p.cyaw-=gp.lx*kk;p.cpitch-=gp.ly*kk*.7;}
 p.cpitch=cl(p.cpitch,k==='jet'?-1.15:-1.0,k==='jet'?1.15:.65);
 let fw=(keys.KeyW?1:0)-(keys.KeyS?1:0),st=(keys.KeyD?1:0)-(keys.KeyA?1:0);if(gp){fw=fw||-gp.my;st=st||gp.mx;}
 const fireHeld=mouse.l||(gp&&gp.fire),alt=mouse.r||(gp&&gp.ads);mouse.le=mouse.re=false;
 if(k==='tank'){c.thr=fw;c.steer=-st;c.aim.copy(G.aimPt);if(edge.Digit1)p.vslot=0;if(edge.Digit2)p.vslot=1;c.fire=p.vslot===0&&fireHeld;c.fire2=p.vslot===1&&fireHeld;p.zoom=!!alt;}
 else if(k==='jeep'){if(p.seat===0){c.thr=fw;c.steer=-st;}else{c.aim.copy(G.aimPt);c.fire=fireHeld;}
  if(edge.Digit1&&p.seat!==0&&!v.seats[0]){v.seats[p.seat]=null;v.seats[0]=p;p.seat=0;snd.play('swap');}if(edge.Digit2&&p.seat!==1&&!v.seats[1]){v.seats[p.seat]=null;v.seats[1]=p;p.seat=1;c.thr=c.steer=0;snd.play('swap');}}
 else if(k==='heli'){c.thr=fw;c.side=-st;c.lift=(keys.Space||(gp&&gp.jumpH)?1:0)-(keys.ControlLeft||keys.KeyC||(gp&&gp.crouchH)?1:0);c.yawT=p.cyaw;c.aim.copy(G.aimPt);c.fire=fireHeld;c.fire2=!!alt;}
 else{c.thr=fw;const cp=Math.cos(p.cpitch);c.aim.set(v.p.x+Math.sin(p.cyaw)*cp*300,v.p.y+Math.sin(p.cpitch)*300,v.p.z+Math.cos(p.cyaw)*cp*300);c.fire=fireHeld;c.fire2=!!alt;}
 if(edge.KeyE||(gp&&gp.useE)){exitVehicle(p);return;}
 p.pos.set(v.p.x,v.p.y+1,v.p.z);p.yaw=p.cyaw;p.shake=Math.max(0,p.shake-dt*1.8);
 const spd=k==='jet'?(v.speed-48)/100:k==='heli'?.4+Math.hypot(v.vel.x,v.vel.z)/60+Math.abs(c.lift)*.2:Math.abs(v.v)/v.S.speed;snd.engine(k,spd);
 oob(dt,v.p,k==='jet'||k==='heli'?PLAY+110:PLAY);}
G.vehWeaponText=()=>{const v=P.veh,k=v.kind;const r=t=>t>0?'RELOADING '+t.toFixed(1):'READY';
 if(k==='tank')return(P.vslot===0?'▶ ':'')+'1 CANNON · '+r(v.reload)+'   '+(P.vslot===1?'▶ ':'')+'2 COAX MG · RMB ZOOM';
 if(k==='jeep')return P.seat===0?'DRIVING · 2 TO GUNNER SEAT':`MG ${v.over?'OVERHEAT':Math.round((1-v.heat)*100)+'%'} · 1 TO DRIVE`;
 if(k==='heli')return`LMB 30MM · RMB ROCKETS ${v.ammo2>0?'×'+v.ammo2:r(v.reload2)} · SPACE / CTRL ALTITUDE`;
 return`LMB CANNON · RMB MISSILE ${v.ammo2>0?'×'+v.ammo2:r(v.reload2)}${v.lock?(v.lockT>=1.2?' · LOCKED':' · LOCKING'):''}`;};

/* ================= deploy / spawn ================= */
G.spawnOptions=()=>spawnOptions(0,null);
G.respawnLeft=()=>P?Math.max(0,(P.respawnAt||0)-G.time):0;
function openDeploy(){G.deploy=true;HUD.showDeploy(G,true);document.body.classList.remove('playing');snd.engine(null);if(document.exitPointerLock&&locked)document.exitPointerLock();}
G.deployNow=(o={})=>{if(!G.deploy||G.app!=='play'||G.over)return false;if(G.respawnLeft()>0&&!o.force)return false;if(o.cls)G.setClass(o.cls);const opts=G.spawnOptions();const sel=opts.find(q=>q.id===(o.spawn||G.spawnSel))||opts[0];
 setupPlayer();spawnAtOption(P,sel);P.pitch=0;P.vel.set(0,0,0);G.deploy=false;HUD.showDeploy(G,false);HUD.dead(G,false);document.body.classList.add('playing');if(!G.noLock)lockPointer();HUD.banner(G,'DEPLOYED',sel.name,'#ffc95a',1.6);return true;};

/* ================= bots ================= */
let frame=0;
function updateBots(dt){G.pathBudget=3;frame++;const live=G.app==='menu'||(G.app==='play'&&!G.over);const cx=cam.position.x,cz=cam.position.z,fwx=-Math.sin(cam.rotation.y),fwz=-Math.cos(cam.rotation.y);let ni=0;const m4=new THREE.Matrix4();
 if(frame%30===0){for(const t of[0,1])G.objLoad[t].fill(0);for(const a of G.actors)if(a.ai&&a.alive&&a.ai.obj)G.objLoad[a.team][a.ai.obj.i]++;}
 for(const a of G.actors){if(a.isPlayer)continue;const r=a.rig;
  if(!a.alive){a.deadT+=dt;if(r.root.visible){r.update(dt,{dead:true});r.root.position.copy(a.pos);if(a.deadT>8)r.root.visible=false;}a.respawnT-=dt;if(a.respawnT<=0&&live)respawnBot(a);continue;}
  if(a.downed){a.downT-=dt;r.update(dt,{dead:true});r.root.position.copy(a.pos);if(a.downT<=0)die(a,null,{wname:'BLED OUT'});continue;}
  if(a.veh){if(live)crew(a,G,dt);if(a.veh){const v=a.veh;a.pos.set(v.p.x,v.p.y+1,v.p.z);a.fireT-=dt;if(v.kind==='jeep')rideJeep(a,v,dt);continue;}}
  const dx=a.pos.x-cx,dz=a.pos.z-cz,dist=Math.hypot(dx,dz);a.far=dist>120;
  if(live)drive(a,G,dt);else{a.move.set(0,0,0);a.crouch=false;}
  const k=1-Math.exp(-10*dt);a.vel.x+=(a.move.x-a.vel.x)*k;a.vel.z+=(a.move.z-a.vel.z)*k;a.pos.x+=a.vel.x*dt;a.pos.z+=a.vel.z*dt;
  W.collide(a.pos,.34,a.crouchV>.5?1.15:1.8);pushFromVehicles(a);let g=W.ground(a.pos.x,a.pos.z,a.pos.y,.2);a.inWater=W.depth(a.pos.x,a.pos.z)>1.1&&!W.onBridge(a.pos.x,a.pos.z);if(a.inWater)g=Math.max(g,WL-1.35);
  a.vel.y=(a.vel.y||0)-GRAV*dt;a.pos.y+=a.vel.y*dt;if(a.pos.y<=g||a.pos.y-g<STEPUP&&a.vel.y<=0){a.pos.y=g;a.vel.y=0;}
  a.speed=Math.hypot(a.vel.x,a.vel.z);a.crouchV+=((a.crouch?1:0)-a.crouchV)*Math.min(1,dt*8);
  a.fireT-=dt;a.firingT-=dt;a.flashT-=dt;a.rpgT-=dt;a.repairing-=dt;if(a.reloadT>0){a.reloadT-=dt;if(a.reloadT<=0)a.mag=a.weapon.mag;}
  if(G.time-a.hurtT>7&&a.hp<a.maxHp)a.hp=Math.min(a.maxHp,a.hp+12*dt);
  // LOD: full rig near, throttled further out, instanced figure far away, skipped behind the camera
  const behind=(dx*fwx+dz*fwz)<-.2*dist&&dist>14,lod=dist>240?3:dist>130?2:dist>60?1:0;
  if(lod===3){r.root.visible=false;if(ni<40){m4.makeRotationY(a.yaw);m4.setPosition(a.pos.x,a.pos.y-(a.crouchV*.35),a.pos.z);imp.setMatrixAt(ni,m4);imp.setColorAt(ni,impC[a.team]);ni++;}continue;}
  r.root.visible=true;r.root.position.copy(a.pos);r.root.rotation.y=a.yaw;r.mesh.castShadow=dist<70;
  a.lodAcc+=dt;if(behind||(lod===1&&frame%2)||(lod===2&&frame%4))continue;const udt=a.lodAcc;a.lodAcc=0;
  const sy=Math.sin(a.yaw),cy=Math.cos(a.yaw);r.update(udt,{speed:a.speed,vf:a.vel.x*sy+a.vel.z*cy,vs:a.vel.x*cy-a.vel.z*sy,crouch:a.crouchV,pitch:a.pitch,aim:!!(a.ai.seen&&a.ai.target)||a.firingT>0,sprint:a.speed>5,reload:a.reloadT>0?1-a.reloadT/(a.reloadDur||1):-1});
  r.flash.visible=a.flashT>0;if(a.flashT>0){r.flash.rotation.z=Math.random()*6;r.flash.scale.setScalar(.8+Math.random()*.5);}}
 imp.count=ni;imp.instanceMatrix.needsUpdate=true;if(imp.instanceColor)imp.instanceColor.needsUpdate=true;
 G.noises=G.noises.filter(n=>G.time-n.t<.7);}

// jeep crews stay visible: driver seated, gunner standing at the pintle mount
function rideJeep(a,v,dt){const r=a.rig,g=a.seat===1,lx=g?0:.5,lz=g?-1.75:-.15,ly=g?1.35:.92,cy=Math.cos(v.yaw),sy=Math.sin(v.yaw);if(cam.position.distanceTo(v.p)>130){r.root.visible=false;return;}
 r.root.visible=true;r.root.position.set(v.p.x+lx*cy+lz*sy,v.p.y+ly,v.p.z-lx*sy+lz*cy);r.root.rotation.y=g?v.yaw+v.tYaw:v.yaw;r.mesh.castShadow=true;r.update(dt,{speed:0,crouch:g?0:1,pitch:g?v.gEl:0,aim:g,reload:-1});r.flash.visible=g&&v.fireT>.04;}
/* ================= viewmodel ================= */
let shownGun=null;
function showGun(){if(!P||!P.slots)return;const s=P.slots[P.cur];for(const k in VM.guns)VM.guns[k].visible=false;const g=VM.guns[s.id];g.visible=true;applyAttachments(g,s.id,s.att);shownGun=g;}
const vmS={bobT:0,sx:0,sy:0,sxv:0,syv:0,mdx:0,mdy:0,sprint:0,land:0,p:new V(),pv:new V(),r:new V(),rv:new V(),idle:0},
 HIP={ar:[.15,-.165,-.37],smg:[.14,-.155,-.34],lmg:[.155,-.18,-.39],sniper:[.15,-.165,-.39],shotgun:[.15,-.165,-.37],pistol:[.11,-.13,-.36],rpg:[.16,-.15,-.36],tool:[.14,-.16,-.34]},ADSZ={ar:-.21,smg:-.18,lmg:-.22,sniper:-.12,shotgun:-.3,pistol:-.33,rpg:-.3,tool:-.3};
const hR=new V(),hL=new V(),elR=new V(),elL=new V(),shR=new V(.24,-.3,.08),shL=new V(-.12,-.34,-.06),gM=new THREE.Matrix4(),qR=new THREE.Quaternion(),qL=new THREE.Quaternion(),qOff=new THREE.Quaternion(),eO=new THREE.Euler(),magHome=new V();
function spring(x,v,k,c,dt){v.addScaledVector(x,-k*dt).multiplyScalar(Math.max(0,1-c*dt));x.addScaledVector(v,dt);}
function updateViewmodel(dt){const p=P;VM.casings.update(dt);if(!p||!shownGun||G.app!=='play'&&G.app!=='paused'||G.deploy||p.veh||!p.alive||p.downed){VM.root.visible=false;return;}const s=p.slots[p.cur],w=WEAPONS[s.id],g=shownGun,u=g.userData;
 VM.root.visible=!(w.scope&&p.adsV>.92)&&!p.swim;
 const hs=Math.hypot(p.vel.x,p.vel.z),ads=p.adsV;vmS.bobT+=dt*hs*(p.sprint?1.15:1.55)*(p.onGround?1:0);vmS.idle+=dt;
 const tx=cl(-vmS.mdx*.0009,-.05,.05),ty=cl(vmS.mdy*.0009,-.05,.05);vmS.mdx=vmS.mdy=0;vmS.sxv+=((tx-vmS.sx)*90-vmS.sxv*12)*dt;vmS.syv+=((ty-vmS.sy)*90-vmS.syv*12)*dt;vmS.sx+=vmS.sxv*dt;vmS.sy+=vmS.syv*dt;
 vmS.sprint+=((p.sprint?1:0)-vmS.sprint)*Math.min(1,dt*9);vmS.land=Math.max(0,vmS.land-dt*3);spring(vmS.p,vmS.pv,180,16,dt);spring(vmS.r,vmS.rv,160,14,dt);
 const H=HIP[s.id],sy=u.sightY||.08;const bob=hs>.5&&p.onGround?Math.min(1,hs/4.5):0,nb=1-ads*.9;const pos=tv.set(H[0]*(1-ads),H[1]*(1-ads)-sy*ads,H[2]+(ADSZ[s.id]-H[2])*ads);
 pos.x+=Math.sin(vmS.bobT)*.012*bob*nb+vmS.sx*(1-ads*.75)*.6;pos.y+=-Math.abs(Math.cos(vmS.bobT))*.011*bob*nb-vmS.sy*(1-ads*.75)*.5-vmS.land*.035+Math.sin(vmS.idle*1.3)*.0015*nb;
 let rx=-vmS.sy*1.3*(1-ads*.8)+vmS.r.x*.012,ry=vmS.sx*1.6*(1-ads*.8)+vmS.r.y*.012,rz=vmS.sx*1.2*(1-ads*.7)+vmS.r.z*.012+Math.sin(vmS.bobT)*.02*bob*nb;pos.z+=vmS.p.z*.035;pos.y+=vmS.p.y*.02;
 const sp=vmS.sprint;pos.x+=sp*-.03;pos.y+=sp*-.035;pos.z+=sp*.03;rx+=sp*-.3;ry+=sp*.75;rz+=sp*.25;pos.x+=Math.sin(vmS.bobT)*.025*sp;pos.y+=Math.abs(Math.cos(vmS.bobT))*.02*sp;
 let leftT=null,magOff=0,magVis=true;if(p.reloadT>0){const k=1-p.reloadT/p.reloadDur;
  if(w.shell){const e=Math.sin(k*PI);rz+=.24*Math.min(1,k*6)*(k<.9?1:(1-k)*10);rx+=.08;pos.y-=.015;leftT=tv2.set(.035,-.03-e*.03,-.04-e*.04);}
  else{const tilt=Math.sin(Math.min(1,k*1.15)*PI);rz-=tilt*(w.id==='pistol'?.2:w.id==='rpg'?.15:.55);ry+=tilt*.22;rx+=tilt*(w.id==='rpg'?-.3:.2);pos.y-=tilt*(w.id==='rpg'?.08:.01);pos.x-=tilt*.05;pos.z+=tilt*.03;
   if(k>.12&&k<.42)magOff=Math.min(1,(k-.12)/.12);else if(k>=.42&&k<.62)magOff=1-Math.min(1,(k-.42)/.18);if(k>.62&&k<.66)vmS.pv.y+=.4*dt*60;
   magVis=!(k>.3&&k<.42);if(u.mag)magHome.set(0,u.magY??-.02,u.magZ??-.1);leftT=k>.1&&k<.7&&u.mag?tv2.set(magHome.x,magHome.y-.06-magOff*.2,magHome.z+.02+magOff*.05):null;}}
 if(p.swapT>0){const k=p.swapT>.28?(.55-p.swapT)/.27:p.swapT/.28;pos.y-=k*.3;rx-=k*1;}
 const cookK=p.throwT>0?p.throwT/.45:0;if(cookK){pos.y-=.07*cookK;rx-=.18*cookK;pos.x+=.035*cookK;}
 if(w.tool&&p.torch){pos.x+=(Math.random()-.5)*.003;pos.y+=(Math.random()-.5)*.003;}
 if(u.bolt&&w.bolt){const k=p.boltT>0?1-p.boltT/(60/w.rpm):1;const e=k>.2&&k<.8?Math.sin((k-.2)/.6*PI):0;u.bolt.position.z=e*.07;u.bolt.rotation.z=-e*.9;rz+=e*.18;if(e>.5&&!p._ej){p._ej=1;ejectCasing(u);}if(e<.1)p._ej=0;}
 if(u.pump){const k=p.boltT>0?1-p.boltT/(w.pump?60/w.rpm:.45):1;const e=k<.9?Math.sin(k/.9*PI):0;u.pump.position.z=-.3+e*.09;rx+=e*.04;if(e>.7&&!p._ej){p._ej=1;ejectCasing(u);}if(e<.1)p._ej=0;}
 if(u.slide)u.slide.position.z=(vmS.p.z>.3?.03*Math.min(1,vmS.p.z):0)+(s.mag===0?.035:0);
 g.position.copy(pos);g.rotation.set(rx,ry,rz);if(u.mag){u.mag.position.set(0,(u.magY??-.02)-magOff*.25,(u.magZ??-.1)+magOff*.06);u.mag.visible=magVis;}
 if(u.flash.visible&&G.time-p.lastShot>.04)u.flash.visible=false;vmFlash.intensity*=Math.exp(-dt*40);
 g.updateMatrix();gM.copy(g.matrix);hR.copy(u.hand[0]).applyMatrix4(gM);hL.copy(u.hand[1]).applyMatrix4(gM);if(leftT)hL.lerp(tv3.copy(leftT).applyMatrix4(gM),.9);
 qR.copy(g.quaternion).multiply(qOff.setFromEuler(eO.set(-.25,0,-1.45)));qL.copy(g.quaternion).multiply(qOff.setFromEuler(eO.set(.15,0,s.id==='pistol'?-1.2:2.6)));
 VM.knife.visible=false;VM.nade.visible=cookK>0;if(cookK>0){VM.nade.position.set(-.15+(1-cookK)*.05,-.16,-.34-(1-cookK)*.25);hL.copy(VM.nade.position).add(tv3.set(0,-.035,.03));qL.identity();}
 elR.copy(hR).lerp(shR,.5).add(tv3.set(.08,-.1,.03));elL.copy(hL).lerp(shL,.5).add(tv3.set(-.1,-.07,.03));VM.pose(VM.arms[0],hR,elR,shR,qR);VM.pose(VM.arms[1],hL,elL,shL,qL);
 vmCam.fov=54-ads*(w.scope?0:12);vmCam.updateProjectionMatrix();}

/* ================= cameras ================= */
const cdir=new V();
function updateCamera(dt){const p=P;
 if(G.app==='menu'||G.app==='over'||!p){attractCam(dt);return;}
 if(G.deploy){deployCam(dt);return;}
 if(p.veh){vehCam(dt);return;}
 G.viewYaw=p.yaw;G.viewPos.copy(p.pos);const w=curW();
 if(!p.alive||p.downed){const k=p.downed?Math.min(1,(14-p.downT)*2):Math.min(1,p.deathT*1.5);cam.position.set(p.pos.x,p.pos.y+.35+(p.downed?0:.1)+(1-k)*1.2,p.pos.z);cam.rotation.set(-.15*k+p.pitch*(1-k),p.yaw+PI,k*.4,'YXZ');
  if(p.attackerPos){const want=Math.atan2(p.attackerPos.x-p.pos.x,p.attackerPos.z-p.pos.z)+PI;cam.rotation.y=p.yaw+PI+ang(want-(p.yaw+PI))*Math.min(1,k);}cam.fov=FOV;cam.updateProjectionMatrix();return;}
 let swy=0,swp=0;if(p.adsV>.3){const amt=w.sway*(p.crouchV>.5?.65:1)*p.adsV*D2R*(w.scope?1:.5);swy=(Math.sin(G.time*.9)+Math.sin(G.time*2.3)*.4)*amt;swp=(Math.sin(G.time*1.3+1)*.8+Math.cos(G.time*2.9)*.3)*amt;}
 p.camKick*=Math.exp(-dt*14);p.punch*=Math.exp(-dt*8);p.punchP*=Math.exp(-dt*8);const shk=p.shake*p.shake*.06;
 cam.position.set(p.pos.x+(Math.random()-.5)*shk,p.pos.y+p.eyeH-p.landT*.06+Math.sin(vmS.bobT*2)*.022*(p.sprint?1:.4)*(p.onGround&&p.speed>1?1:0)+(Math.random()-.5)*shk,p.pos.z+(Math.random()-.5)*shk);
 cam.rotation.set(p.pitch+swp+p.camKick+p.punchP,p.yaw+PI+swy,Math.sin(vmS.bobT)*.004*(p.sprint?1:0)+p.punch,'YXZ');
 const zoom=1+(w.adsZoom*(p.slots[p.cur].att.reddot&&!w.scope?1.08:1)-1)*Math.pow(p.adsV,w.scope?3:1);const fovT=(FOV+(p.sprint?6:0))/zoom;cam.fov+=(fovT-cam.fov)*Math.min(1,dt*18);cam.updateProjectionMatrix();}
function vehCam(dt){const p=P,v=p.veh,k=v.kind;const cy=p.cyaw,cp=p.cpitch;cdir.set(Math.sin(cy)*Math.cos(cp),Math.sin(cp),Math.cos(cy)*Math.cos(cp));let fov=FOV;const shk=p.shake*p.shake*.15;
 if(k==='tank'&&p.zoom){gunDir(v,tv);cam.position.set(v.p.x,v.p.y+3.25,v.p.z).addScaledVector(tv,1.2);fov=24;}
 else{const dist=k==='tank'?11.5:k==='jeep'?7.5:k==='heli'?16:24,h=k==='tank'?3.4:k==='jeep'?2.5:k==='heli'?3.2:3.5;cam.position.set(v.p.x,v.p.y+h,v.p.z).addScaledVector(cdir,-dist);cam.position.y+=dist*.1;
  const gy=W.height(cam.position.x,cam.position.z)+1.2;if(cam.position.y<gy)cam.position.y=gy;if(k==='jet')fov=FOV+cl((v.speed-90)/6,0,12);}
 cam.position.x+=(Math.random()-.5)*shk;cam.position.y+=(Math.random()-.5)*shk;cam.rotation.set(cp,cy+PI,k==='jet'?-v.roll*.25:0,'YXZ');cam.fov+=(fov-cam.fov)*Math.min(1,dt*10);cam.updateProjectionMatrix();
 G.viewYaw=cy;G.viewPos.copy(v.p);
 // aim point under the crosshair (terrain, buildings, vehicles)
 const o=cam.position;const t=W.ray(o.x,o.y,o.z,cdir.x,cdir.y,cdir.z,1200,hitOut,true);let best=Math.min(t,1200);for(const u of G.vehicles){if(u===v||!u.model.root.visible)continue;const tt=hitVehicle(u,o,cdir,best);if(tt<best)best=tt;}
 if(best<4)best=600;G.aimPt.copy(o).addScaledVector(cdir,best);
 // actual weapon impact point for the reticle
 const R2=G.reticle;R2.sq=k==='jet';if(k==='jeep'&&p.seat===0){R2.pt=null;return;}R2.pt=R2.pt||new V();
 if(k==='jet'){v.fwd(tv);R2.pt.copy(v.p).addScaledVector(tv,280);}else{v.model.root.updateMatrixWorld(true);v.muzzle(tv2);gunDir(v,tv);const tt=W.ray(tv2.x,tv2.y,tv2.z,tv.x,tv.y,tv.z,900,null,true);R2.pt.copy(tv2).addScaledVector(tv,Math.min(tt,k==='tank'?Math.max(40,tv2.distanceTo(G.aimPt)):900));}}
const AT={t:0,tgt:null,a:0,r:20,h:6};
function pickAttract(){const c=[];for(const v of G.vehicles)if(v.alive&&v.occupied())c.push({v,w:v.kind==='heli'||v.kind==='tank'?3:2});for(const a of G.actors)if(a.alive&&!a.veh&&!a.downed&&a.ai&&a.ai.seen)c.push({a,w:1});for(const p of G.points)if(p.contest)c.push({p,w:2});
 if(!c.length){AT.tgt={p:G.points[2]};}else{let s=c.reduce((q,x)=>q+x.w,0)*Math.random();for(const x of c){s-=x.w;if(s<=0){AT.tgt=x;break;}}AT.tgt=AT.tgt||c[0];}
 AT.t=AT.tgt.p?11:8;AT.a=Math.random()*PI*2;AT.r=AT.tgt.p?rr(34,48):AT.tgt.v?(AT.tgt.v.kind==='jet'?30:rr(16,22)):rr(7,10);AT.h=AT.tgt.p?rr(12,20):AT.tgt.v?rr(4,8):rr(1.6,3);}
function attractCam(dt){AT.t-=dt;const T=AT.tgt;if(AT.t<=0||!T||T.v&&!T.v.alive||T.a&&(!T.a.alive||T.a.veh))pickAttract();const t=AT.tgt;AT.a+=dt*(t.p?.05:.12);
 const q=t.v?t.v.p:t.a?t.a.pos:new V(t.p.x,t.p.y,t.p.z);let x,z,y;if(t.v&&t.v.kind==='jet'){t.v.fwd(tv);x=q.x-tv.x*AT.r+Math.cos(AT.a)*6;z=q.z-tv.z*AT.r+Math.sin(AT.a)*6;y=q.y-tv.y*AT.r+5;}else{x=q.x+Math.cos(AT.a)*AT.r;z=q.z+Math.sin(AT.a)*AT.r;y=q.y+AT.h;}
 y=Math.max(y,W.height(x,z)+1.6);cam.position.lerp(tv2.set(x,y,z),G.camSnap?1:Math.min(1,dt*2.5));G.camSnap=false;cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(q.x,q.y+(t.p?3:1.4),q.z);G.viewPos.copy(cam.position);G.viewYaw=cam.rotation.y+PI;}
function deployCam(dt){const o=G.spawnOptions().find(q=>q.id===G.spawnSel)||{x:HQ[0].x,z:HQ[0].z};AT.a+=dt*.06;const x=o.x+Math.cos(AT.a)*60,z=o.z+Math.sin(AT.a)*60,y=W.height(o.x,o.z)+38;cam.position.lerp(tv.set(x,Math.max(y,W.height(x,z)+10),z),Math.min(1,dt*1.5));cam.fov=55;cam.updateProjectionMatrix();cam.lookAt(o.x,W.height(o.x,o.z),o.z);}
function updateShadow(){const c=cam.position,fwd=tv.set(0,0,-1).applyQuaternion(cam.quaternion);fwd.y=0;if(fwd.lengthSq()>1e-4)fwd.normalize();const ext=P&&P.veh?90:gfx>=2?48:60;
 const tx=Math.round((c.x+fwd.x*ext*.5)*2)/2,tz=Math.round((c.z+fwd.z*ext*.5)*2)/2,ty=W.height(tx,tz);sun.target.position.set(tx,ty,tz);sun.position.set(tx,ty,tz).addScaledVector(sunDir,200);
 const sc=sun.shadow.camera;if(sc.right!==ext){Object.assign(sc,{left:-ext,right:ext,top:ext,bottom:-ext,near:1,far:420});sc.updateProjectionMatrix();}sky.position.copy(c);}

/* ================= match flow ================= */
function resetMatchState(len){G.time=0;G.over=null;G.deploy=false;G.warned=0;G.oobT=0;fx.clear();for(const n of G.nades)scene.remove(n.m);G.nades=[];for(let i=G.proj.length-1;i>=0;i--)remProj(i);for(const k of G.kits)scene.remove(k.m);G.kits=[];G.noises=[];
 for(const p of G.points){p.own=-1;p.prog=0;p.contest=false;p.flag.userData._c=null;}for(const v of G.vehicles){v.restore();v.claim=null;v.idleT=0;v.spotT=0;}
 G.maxTickets=len.k;G.tickets=[len.k,len.k];G.clock=len.t;G.bleedK=len.k/300*(720/len.t);G.stats={kills:[0,0],dmg:[0,0],caps:0,vkills:0};resetWorld();}
function start(o={}){if(document.activeElement&&document.activeElement.blur)document.activeElement.blur();for(const k of['diff','len','sens','vol'])if(o[k]!==undefined)opt[k]=o[k];if(o.cls)G.setClass(o.cls);G.saveOpt();snd.init();snd.setVol(opt.vol);
 G.diffI=opt.diff|0;G.diff=DIFF[G.diffI];const len=LENS[opt.len|0];G.lenName=len.n;resetMatchState(len);if(o.tickets)G.tickets=[o.tickets,o.tickets],G.maxTickets=o.tickets;if(o.time)G.clock=o.time;
 fillArmy(true);setupPlayer();for(const a of G.actors)if(!a.isPlayer)spawnAtOption(a,{kind:'hq'});P.alive=false;P.respawnAt=0;G.spawnSel='hq';G.app='play';G.matchT0=performance.now();
 HUD.startMatch(G);snd.ambience('field',true);G.deploy=true;HUD.showDeploy(G,true);if(o.autoDeploy!==false&&(o.autoDeploy||G.noLock))G.deployNow({cls:o.cls,spawn:o.spawn});
 HUD.radio(G,'HQ','All units, take the valley. Capture and hold the flags to drain Korvan reinforcements.',true);}
G.start=start;
function toMenu(){G.app='menu';G.over=null;G.deploy=false;snd.engine(null);const len=LENS[1];resetMatchState(len);G.diff=DIFF[1];G.diffI=1;fillArmy(false);for(const a of G.actors)spawnAtOption(a,{kind:'hq'});G.camSnap=true;AT.t=0;
 snd.ambience('field',false);HUD.showMenu(G);document.body.classList.remove('playing');if(document.exitPointerLock&&locked)document.exitPointerLock();}
G.toMenu=toMenu;
function endMatch(res,title,sub){if(G.over)return;G.over={res,title,sub,t:0};if(P&&P.veh)snd.engine(null);snd.play(res==='win'?'win':'lose');HUD.banner(G,title,sub||'',res==='win'?'#5fe08a':res==='draw'?'#ffd23f':'#ff3b30',3.2);}
G.endMatch=endMatch;
function finish(){const me=P,won=G.over.res==='win';const pts=Math.max(0,Math.round(me.stats.score+(won?500:G.over.res==='draw'?200:0)));const before=prog.xp;prog.xp+=pts;try{localStorage.setItem('pxd_warfront_prog',JSON.stringify(prog));}catch(e){}
 const tok=5+Math.min(60,pts/60|0);addRound(tok,won);saveBest('warfront',pts);
 G.lastAward={pts,won,res:G.over.res,kills:me.stats.kills,deaths:me.stats.deaths,caps:me.stats.caps,revives:me.stats.revives,vkills:me.stats.vkills,diff:G.diff.n,len:G.lenName,xpBefore:before,xpAfter:prog.xp,tok,tickets:G.tickets.map(Math.ceil)};
 G.app='over';G.deploy=false;snd.engine(null);document.body.classList.remove('playing');if(document.exitPointerLock&&locked)document.exitPointerLock();HUD.showOver(G);render.vis(0);}
G.best=()=>bestScore('warfront');
G.postScore=()=>{const a=G.lastAward||{};const u=userName();
 postScore('warfront',a.pts||0,`Game: Iron Vanguard\nPoints: ${a.pts||0}\nResult: ${a.res||''} · tickets ${a.tickets?a.tickets.join(' - '):''}\nConquest · Ashvale Valley · ${a.len||''} · ${a.diff||''}\nKills: ${a.kills||0} · Deaths: ${a.deaths||0} · Flags: ${a.caps||0} · Revives: ${a.revives||0} · Vehicles: ${a.vkills||0}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`);};

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.1);
 if(G.app==='paused'){for(const k in edge)delete edge[k];render.vis(dt);return;}
 G.time+=dt;
 if(G.app==='menu'||G.app==='over'){updateBots(dt);updateVehicles(dt);stepProj(dt);stepNades(dt);if(G.app==='menu'){updateConquest(dt);stepKits(dt);}fx.update(dt,smokeCol);S.update(cam.position,dt);sky.userData.U.uT.value=G.time;HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);return;}
 const sdt=G.over?dt*.35:dt;if(G.over){G.over.t+=dt;if(G.over.t>3.2){finish();for(const k in edge)delete edge[k];return;}}
 if(!G.over&&!G.deploy)updatePlayer(sdt);else{mouse.dx=mouse.dy=0;mouse.le=mouse.re=false;if(P&&P.veh&&G.over){P.veh.ctrl.fire=P.veh.ctrl.fire2=false;}}
 updateBots(sdt);updateVehicles(sdt);stepProj(sdt);stepNades(sdt);stepKits(sdt);updateConquest(sdt);
 fx.update(sdt,smokeCol);S.update(cam.position,sdt);sky.userData.U.uT.value=G.time;snd.tick(dt);HUD.update(G,dt);for(const k in edge)delete edge[k];render.vis(dt);}
const smokeCol=(()=>{const c=new THREE.Color(look.fog.c);return{r:Math.min(.85,c.r*.9+.15),g:Math.min(.85,c.g*.9+.15),b:Math.min(.88,c.b*.9+.17)};})();
const render={vis(dt){updateViewmodel(dt);updateCamera(dt);updateShadow();}};

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible)return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
const POST={bloom:.34,bloomThreshold:.95,bloomRadius:.42,vignette:.24,grain:.02,aoStrength:.7};
function applyQuality(q){gfx=q;sun.castShadow=q>0;const ms=q>=2?2048:1536;if(sun.shadow.map&&sun.shadow.mapSize.x!==ms){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(ms,ms);R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));fxStack=null;
 cam.far=q>=1?2600:1900;buildScene();}
G.applyQuality=applyQuality;bindQualityKey(()=>gfx,q=>applyQuality(q));
function renderFrame(){const w=innerWidth,h=innerHeight;if(R.domElement.width!==Math.floor(w*R.getPixelRatio())||R.domElement.height!==Math.floor(h*R.getPixelRatio()))R.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();fx.sparks.U.uScale.value=fx.smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(cam.fov*PI/360));
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(R,scene,cam,{...POST,exposure:look.exp,tint:look.tint,saturation:look.sat,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const hp=P&&G.app==='play'&&P.alive?(P.downed?0:P.hp/P.maxHp):1;fxStack.grade.uniforms.sat.value=look.sat*(.4+.6*Math.min(1,hp*1.6));}
 if(fxStack.composer)fxStack.render();else{R.autoClear=true;R.render(scene,cam);R.autoClear=false;R.clearDepth();if(VM.root.visible)R.render(vmScene,vmCam);R.autoClear=true;}}
G.render=renderFrame;

/* ================= boot ================= */
HUD.init(G,{CLASSES,WEAPONS,VSPEC,RANKS,rankOf,rankXP,cam});
applyQuality(gfx);toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);renderFrame();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hook ================= */
window.WARFRONT={get state(){return G.app==='play'?(G.over?'end':G.deploy?'deploy':!P.alive?'dead':P.downed?'down':P.veh?'vehicle':'live'):G.app;},get app(){return G.app;},step,render:renderFrame,start,toMenu,G,
 get player(){return P;},get actors(){return G.actors;},get bots(){return G.actors.filter(a=>!a.isPlayer);},get vehicles(){return G.vehicles;},get tickets(){return G.tickets.map(Math.ceil);},get clock(){return G.clock;},
 get points(){return G.points.map(p=>({id:p.id,name:p.name,own:p.own,prog:+p.prog.toFixed(2),n0:p.n0,n1:p.n1}));},get score(){return P?P.stats.score:0;},get stats(){return P?P.stats:null;},get lastAward(){return G.lastAward;},get matchStats(){return G.stats;},
 setClock(s){G.clock=s;},setTickets(a,b){G.tickets=[a,b];},deploy(cls,spawn){return G.deployNow({cls,spawn,force:true});},
 enter(kind){if(!P||!P.alive)return false;const v=G.vehicles.find(v=>v.team===0&&v.kind===kind&&v.alive&&v.freeSeat()>=0);if(!v)return false;P.pos.copy(v.p);return enterVehicle(P,v);},exit(){if(P&&P.veh)exitVehicle(P);},
 aim(yaw,pitch=0){if(!P)return;if(P.veh){P.cyaw=yaw;P.cpitch=pitch;}else{P.yaw=yaw;P.pitch=pitch;}},teleport(x,z,yaw){if(P){P.pos.set(x,W.ground(x,z,W.height(x,z)+1,.3),z);P.vel.set(0,0,0);if(yaw!==undefined)P.yaw=yaw;}},
 lookAt(a){if(!P||!a)return;eyeOf(P,eye);centerOf(a,tv);P.yaw=Math.atan2(tv.x-eye.x,tv.z-eye.z);P.pitch=Math.atan2(tv.y-eye.y,Math.hypot(tv.x-eye.x,tv.z-eye.z));P.recP=P.recY=0;},
 god(on=true){if(P)P.god=on;},killEnemies(n=99){let k=0;for(const a of G.actors)if(a.alive&&!a.downed&&a.team===1&&!a.veh&&k<n){k++;damage(a,999,P,'body',new V(0,0,1),'TEST');}return k;},
 setQuality:applyQuality,pause,noLock(on=true){G.noLock=on;},keys,edge,mouse,cam,fx,R,scene,W,CLASSES,attract:AT,pickAttract};
