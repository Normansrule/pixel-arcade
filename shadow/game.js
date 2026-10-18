// SILENT CONTRACT — third-person stealth assassination sandbox. Infiltrate Villa Serafina's sunset gala, take disguises from
// subdued NPCs, read the targets' routines and remove both — ideally by a staged accident — then leave by car or boat before the
// contract clock runs out. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality,setQuality} from '../js/fx3d.js';
import {Level,ZONES,ALLOW,HOSTILE} from './level.js';
import {makeTextures} from './tex.js';
import {buildWorld,U,dynMat} from './world.js';
import {Rig,look,DISGUISE,DNAME,makeProp} from './actors.js';
import {NPC,think,DIFF,hear,fuseFixer,alertGuards,enterCombat,yawTo,angDiff,canSee} from './ai.js';
import {makeCast} from './cast.js';
import {Sound} from './sound.js';
import {HUD,fmt} from './hud.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';

const V=THREE.Vector3,$=id=>document.getElementById(id),cl=(v,a,b)=>v<a?a:v>b?b:v,PI=Math.PI,GID='silentcontract';
const ACCIDENT={chandelier:'CHANDELIER',fall:'FALL',poison:'POISONED DRINK'},HOW={pistol:'PISTOL',wire:'FIBER WIRE',chandelier:'CHANDELIER ACCIDENT',fall:'FATAL FALL',poison:'POISONED WHISKEY'};

/* ================= renderer + scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});let Q=quality();
R.setPixelRatio(Math.min(devicePixelRatio,Q>=2?1.5:1));R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.Fog(0xc98a70,80,900);const cam=new THREE.PerspectiveCamera(58,1,.08,2000);
const hemi=new THREE.HemisphereLight(0xa8b4e0,0x8a5a44,1.25);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xffa766,3.4);scene.add(sun,sun.target);sun.shadow.camera.left=-38;sun.shadow.camera.right=38;sun.shadow.camera.top=38;sun.shadow.camera.bottom=-38;sun.shadow.camera.near=1;sun.shadow.camera.far=220;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;
let post=null;const snd=new Sound();
let TX,L,W,hud,cloth;
const I=controls(canvas,{canLock:()=>G.app==='play',overlay:$('lockov'),onLock:(on,was)=>{if(!on&&was&&G.app==='play'&&!G.noPause)pause(true);},onKey:(e)=>{if(e.code==='Tab'){e.preventDefault();}}});

/* ================= state ================= */
const G={app:'load',opt:{diff:1,start:0,sens:1,vol:.8},npcs:[],npcById:{},bodies:[],targets:[],opps:[],prompts:[],holdK:0,timeLeft:720,limit:720,diff:DIFF[1],combatNow:false,searching:false,maxSus:0,
 compromised:null,combatEver:false,quartetOn:true,crowdNear:0,dark:{0:false,1:false},instinct:false,camYaw:PI,camPitch:-.12,over:false,stats:{},paths:new Map(),pathQ:0,noPause:false,attract:0,fx:[]};
const saveOpt=stored('pxd_silentcontract_opt',G.opt);
const P={pos:new V(),y:0,yaw:PI,disguise:'suit',lk:null,rig:null,crouch:false,hp:100,mag:12,res:24,coins:3,items:{},hidden:null,drag:null,illegal:null,sus:0,running:false,moving:false,act:null,aimK:0,fireT:0,reloadT:0,hurtT:0,stepT:0,camD:3.2,regenT:0};
G.player=P;G.cam=cam;

/* ================= world setup ================= */
function setupWorld(){TX=makeTextures(Q);L=new Level();G.L=L;W=buildWorld(L,TX,Q);scene.add(W.group);cloth=TX.cloth.map;
 // dynamic set pieces
 G.dyn={};const mk=(geo,mat,x,y,z,parent=scene)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;parent.add(m);return m;};
 const gold=dynMat({color:0xd8b060,roughness:.3,metalness:.9},'scdyn'),crystal=new THREE.MeshBasicMaterial({color:new THREE.Color(4.2,3.4,2.4)}),dark=dynMat({color:0x2a2a2c,roughness:.5,metalness:.4},'scdyn');
 // chandelier (falls)
 const ch=new THREE.Group();ch.position.set(L.chand.x,L.chand.y,L.chand.z);scene.add(ch);G.dyn.chand=ch;
 for(const[r,y,n]of[[1.5,0,18],[1.05,.55,12],[.6,1.05,8]]){mk(new THREE.TorusGeometry(r,.035,6,36).rotateX(PI/2),gold,0,y,0,ch);for(let i=0;i<n;i++){const a=i/n*PI*2;mk(new THREE.SphereGeometry(.07,6,5),crystal,Math.cos(a)*r,y+.08,Math.sin(a)*r,ch);mk(new THREE.OctahedronGeometry(.06),crystal,Math.cos(a)*r,y-.18,Math.sin(a)*r,ch).scale.y=2;}}
 mk(new THREE.CylinderGeometry(.08,.2,1.5,10),gold,0,.6,0,ch);mk(new THREE.SphereGeometry(.22,10,8),crystal,0,-.2,0,ch);
 G.dyn.chain=mk(new THREE.CylinderGeometry(.025,.025,1,5),gold,L.chand.x,0,L.chand.z);
 // pier railing (breaks)
 const rail=new THREE.Group();rail.position.set(55,-12,66.85);scene.add(rail);const wood=dynMat({color:0x6a5038,roughness:.7,map:TX.planks.map},'scdyn');
 mk(new THREE.BoxGeometry(4,.12,.12),wood,0,1.02,0,rail);mk(new THREE.BoxGeometry(4,.08,.08),wood,0,.55,0,rail);for(let i=0;i<5;i++)mk(new THREE.BoxGeometry(.1,1.1,.1),wood,-1.9+i*.95,.5,0,rail);G.dyn.rail=rail;
 // speedboat (exit) + interactable props
 const boat=new THREE.Group();boat.position.set(59,-13.7,58.5);scene.add(boat);const hull=dynMat({color:0xf4f2ee,roughness:.25},'scdyn');
 const hg=new THREE.SphereGeometry(1,20,10,0,PI*2,PI*.5,PI*.5);hg.scale(1.1,.7,3.6);mk(hg,hull,0,.7,0,boat);mk(new THREE.BoxGeometry(2.1,.25,6.6),dynMat({color:0x8a5a3a,roughness:.5},'scdyn'),0,.7,0,boat);
 mk(new THREE.BoxGeometry(1.6,.5,.1),new THREE.MeshStandardMaterial({color:0x223040,roughness:.05,metalness:.5,transparent:true,opacity:.6}),0,1.1,.6,boat).rotation.x=-.5;mk(new THREE.BoxGeometry(.1,.1,6.8),dynMat({color:0x0e5a46},'scdyn'),1.05,.62,0,boat);mk(new THREE.BoxGeometry(.1,.1,6.8),dynMat({color:0x0e5a46},'scdyn'),-1.05,.62,0,boat);G.dyn.boat=boat;
 for(const u of L.uses){let m=null;
  if(u.id==='radio'){m=mk(new THREE.BoxGeometry(.32,.2,.12),dark,u.x,u.y+.1,u.z);u.led=mk(new THREE.BoxGeometry(.04,.04,.02),new THREE.MeshBasicMaterial({color:0x222222}),u.x+.1,u.y+.15,u.z+.07);}
  else if(u.id==='fuse'){m=mk(new THREE.BoxGeometry(u.x<0?.12:.12,.6,.45),dynMat({color:0x6a7078,roughness:.4,metalness:.5},'scdyn'),u.x,u.y,u.z);}
  else if(u.id==='winch'){m=mk(new THREE.CylinderGeometry(.22,.22,.3,14).rotateZ(PI/2),dark,u.x,u.y,u.z);mk(new THREE.BoxGeometry(.1,.7,.6),dark,u.x+.05,u.y,u.z);}
  else if(u.id==='decanter'){m=mk(new THREE.SphereGeometry(.09,10,8),new THREE.MeshStandardMaterial({color:0xc87a20,roughness:.05,transparent:true,opacity:.8}),u.x,u.y+.12,u.z);mk(new THREE.CylinderGeometry(.025,.03,.12,8),m.material,u.x,u.y+.25,u.z);}
  u.mesh=m;}
 for(const it of L.items){const m=it.id==='poison'?mk(new THREE.BoxGeometry(.16,.22,.1),dynMat({color:0xd8c020,roughness:.6},'scdyn'),it.x,it.y+.11,it.z):it.id==='wrench'?mk(new THREE.BoxGeometry(.32,.03,.07),dynMat({color:0x9aa0a8,metalness:.8,roughness:.3},'scdyn'),it.x,it.y+.02,it.z):mk(new THREE.CylinderGeometry(.03,.03,.008,10),dynMat({color:0xd8b048,metalness:.9,roughness:.25},'scdyn'),it.x,it.y,it.z);it.mesh=m;}
 // ghost materials for instinct
 G.ghost={target:new THREE.MeshBasicMaterial({color:new THREE.Color(3,.08,.06),transparent:true,opacity:.6,depthTest:false,depthWrite:false}),guard:new THREE.MeshBasicMaterial({color:new THREE.Color(1.2,.62,.18),transparent:true,opacity:.38,depthTest:false,depthWrite:false}),
  civ:new THREE.MeshBasicMaterial({color:new THREE.Color(.45,.7,1.1),transparent:true,opacity:.28,depthTest:false,depthWrite:false}),enf:new THREE.MeshBasicMaterial({color:new THREE.Color(2,2,2),transparent:true,opacity:.45,depthTest:false,depthWrite:false})};
 // particles
 G.parts=new THREE.InstancedMesh(new THREE.OctahedronGeometry(.04),new THREE.MeshBasicMaterial({color:new THREE.Color(3,2.6,2)}),300);G.parts.count=0;G.parts.frustumCulled=false;scene.add(G.parts);G.pl=[];
 const fl=new THREE.Mesh(new THREE.SphereGeometry(.06,6,4),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,2)}));fl.visible=false;scene.add(fl);G.flash=fl;
 // player rig
 P.lk=look('player');P.rig=new Rig(P.lk,cloth);scene.add(P.rig.root);
 hud=new HUD(G);applyQuality(Q);}
function applyQuality(q){Q=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:1));R.shadowMap.enabled=q>0;sun.castShadow=q>0;const sz=q>=2?4096:2048;if(sun.shadow.map&&sun.shadow.mapSize.x!==sz){sun.shadow.map.dispose();sun.shadow.map=null;}sun.shadow.mapSize.set(sz,sz);
 scene.traverse(o=>{if(o.material){const ms=Array.isArray(o.material)?o.material:[o.material];ms.forEach(m=>m.needsUpdate=true);}});
 post=cinematic(R,scene,cam,{quality:q,exposure:1.0,bloom:.36,bloomRadius:.55,bloomThreshold:1.0,vignette:.38,saturation:1.08,tint:0xfff2e6,grain:.025});resize();}
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h);cam.aspect=w/h;cam.updateProjectionMatrix();post&&post.setSize(w,h);}
addEventListener('resize',resize);
bindQualityKey(()=>Q,q=>applyQuality(q));

/* ================= contract setup ================= */
function start(o={}){Object.assign(G.opt,o);const d=G.opt.diff|0;G.diff=DIFF[d];G.limit=G.timeLeft=o.time??G.diff.time;G.over=false;G.combatEver=false;G.compromised=null;G.dark={0:false,1:false};U.grp.value=[1,1,1,1];
 for(const n of G.npcs){scene.remove(n.rig.root);}G.npcs=[];G.npcById={};G.bodies=[];G.paths.clear();G.fx=[];G.pl=[];
 G.stats={kills:0,ko:0,bodiesFound:0,accidents:0,disguises:0,shots:0,spotted:0,reports:0,start:performance.now()};
 for(const c of makeCast(d,Q===0)){const n=new NPC(c);n.lookType=c.look;n.lk=look(c.look,c.seed??c.id);if(c.prop)n.lk={...n.lk,prop:c.prop};n.rig=new Rig(n.lk,cloth);scene.add(n.rig.root);n.y=L.h(n.pos.x,n.pos.z)||0;
  n.enforcerOf=n.enforcer?DISGUISE[c.look]:null;n.speed=c.speed||n.speed;if(n.kind==='guard')n.hp=100;G.npcs.push(n);G.npcById[n.id]=n;}
 G.targets=G.npcs.filter(n=>n.role==='target').map(n=>({npc:n,name:n.name,how:null}));G.lateGuest=G.npcs.find(n=>n.name==='LATE GUEST');G.objDone=false;
 G.opps=[{id:'chand',name:'CRYSTAL FALL',steps:['Unbolt the chandelier winch (service corridor)','Release it during Vane\'s toast'],at:0},{id:'poison',name:'LAST DRAM',steps:['Rat poison: kitchen pantry','Poison the study decanter','Vane takes a nightcap'],at:0},
  {id:'rail',name:'SEA AIR',steps:['Wrench: gardener\'s shed','Loosen the pier railing','Corvo leans on it'],at:0}];
 G.decanter=false;G.winch=0;G.railLoose=false;G.railBroken=false;G.chandFall=null;G.dyn.chand.position.set(L.chand.x,L.chand.y,L.chand.z);G.dyn.chand.rotation.set(0,0,0);G.dyn.rail.position.set(55,-12,66.85);G.dyn.rail.rotation.set(0,0,0);L.railing.move=true;
 for(const u of L.uses){u.on=false;u.done=false;u.sab=false;if(u.led)u.led.material.color.set(0x222222);}for(const it of L.items){it.taken=false;it.mesh.visible=true;}for(const c of L.containers)c.body=null;
 // player
 const sp=L.spots[G.opt.start?'start_service':'start_drive'];P.pos.set(sp.x,0,sp.z);P.y=L.h(sp.x,sp.z)||0;P.yaw=sp.yaw;G.camYaw=sp.yaw;G.camPitch=-.1;Object.assign(P,{disguise:'suit',crouch:false,hp:G.diff.hp,maxHp:G.diff.hp,mag:12,res:24,coins:3,items:{},hidden:null,drag:null,illegal:null,act:null,aimK:0,fireT:0,reloadT:0,hurtT:0});
 P.lk=look('player');P.rig.setLook(P.lk);P.rig.root.visible=true;
 hud.init();G.app='play';G.attract=0;document.body.classList.add('playing');$('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;
 snd.init();snd.setVol(G.opt.vol);hud.banner('VILLA SERAFINA','THE AMBER GALA · '+G.diff.name,3000);hud.feed('Targets: <b>DARIO VANE</b> and <b>INES CORVO</b>. Hold <b>X</b> for instinct, <b>M</b> for the map.','info',7000);hud.feed('First, get in: your suit is not on the guest list. Find the <b>LATE GUEST</b> by his car, subdue him out of sight (<b>F</b>) and take his clothes (<b>T</b>).','info',12000);I.lock();}

/* ================= helpers for AI ================= */
G.pathFor=(ax,az,bx,bz)=>{const k=Math.round(ax)+','+Math.round(az)+'>'+Math.round(bx*2)+','+Math.round(bz*2);let p=G.paths.get(k);if(p===undefined){if(G.pathQ>3&&G.app==='play')return null;G.pathQ++;p=L.path(ax,az,bx,bz);G.paths.set(k,p);}return p?p.slice():null;};
G.darkAt=(x,z)=>{const r=L.rooms[L.roomAt(x,z)];return!!(r&&r.grp>=0&&G.dark[r.grp]);};
G.combatNear=n=>{for(const g of G.npcs)if(g.state==='combat'&&g.pos.distanceTo(n.pos)<30)return true;return false;};
G.sfx=(k,p,o)=>snd.play(k,p,o);
G.canExit=()=>G.targets.every(t=>!t.npc.alive);
G.onSpotted=(n,th)=>{G.stats.spotted++;if(!n.isGuard&&th.illegal)hud.feed('<b>WITNESS</b> — someone saw you','bad');snd.play(th.illegal?'combat':'spotted');};
G.reported=n=>{G.stats.reports++;};
G.onBodyFound=(b,n)=>{if(b.foundFlag)return;b.foundFlag=true;if(b.role==='target'){hud.feed(b.name+'\'s body has been found','info');return;}if(b.accident){hud.feed('An <b>accident</b> has been discovered','info');return;}G.stats.bodiesFound++;hud.feed('<b>BODY FOUND</b>','bad');snd.play('body');};
G.radioOff=u=>{u.on=false;if(u.led)u.led.material.color.set(0x222222);};
G.fuseFixed=u=>{G.dark[u.grp]=false;U.grp.value[u.grp]=1;u.sab=false;snd.play('zap',u);};
G.event=(name,n,s)=>{if(name==='speechStart'){G.quartetOn=false;G.speech=true;for(const g of G.npcs)if(g.role==='guest'&&!g.down&&L.roomAt(g.pos.x,g.pos.z)===L.roomAt(0,-12)&&!g.routine.length)g.act='idle';if(P.pos.distanceTo(n.pos)<40)hud.feed('<b>VANE</b> raises a glass for his toast','info');}
 else if(name==='speechEnd'){G.quartetOn=true;G.speech=false;for(const g of G.npcs)if(g.role==='guest'&&!g.down&&g.pos.distanceTo(n.pos)<16&&g.state==='routine'){g.clap=4;}}};
G.during=(name,n,s,dt)=>{if(name==='vaneDrink'){if(n.stepT>5&&!n.poured){n.poured=true;snd.play('pour',n.pos);n.rig.setProp('whisky');}if(n.stepT>8)n.act='drink';
  if(G.decanter&&n.stepT>10&&!n.dieAct){n.dieAct='clutch';n.dieT=0;n.dieDur=2.8;n.deathCause='poison';snd.play('gulp',n.pos);}}
 else if(name==='corvoRail'){if(G.railLoose&&n.stepT>3.5&&!n.dieAct){G.railLoose=false;G.railBroken=true;L.railing.move=false;G.dyn.railFall={v:0,t:0};snd.play('creak',n.pos);n.dieAct='flail';n.dieT=0;n.dieDur=2.2;n.deathCause='fall';n.vy=0;n.fallY=n.y;}}};
G.npcShoot=n=>{const d=n.pos.distanceTo(P.pos);snd.play('pistol',n.pos,{ref:14});hear(G,n.pos.x,n.pos.z,25,'shot');flashAt(n);
 if(P.hidden)return;if(!L.los(n.pos.x,n.y+1.5,n.pos.z,P.pos.x,P.y+1.2,P.pos.z))return;let acc=G.diff.acc*cl(1.15-d/26,.15,1)*(P.moving?.72:1)*(P.crouch?.85:1)*(P.running?.8:1);
 if(Math.random()<acc){P.hp-=G.diff.dmg*(.8+Math.random()*.4);P.hurtT=1;P.regenT=0;snd.play('hurt');if(P.hp<=0)endContract(false,'YOU WERE KILLED');}else snd.play('ricochet',P.pos);};
function flashAt(n){const h=n.rig.b.handR;h.getWorldPosition(G.flash.position);G.flash.visible=true;G.flashT=.05;}
G.kill=(n,cause,o={})=>{if(!n.alive)return;n.alive=false;n.ko=false;n.deathCause=cause;n.dieAct=null;n.sus=0;n.state='dead';n.task=null;n.path=null;const acc=!!ACCIDENT[cause];n.accident=acc;
 if(cause==='fall'){n.hidden=true;n.rig.root.visible=false;snd.play('splash',n.pos);}else{G.bodies.push(n);snd.play('thud',n.pos);}
 if(n.role==='target'){const t=G.targets.find(t=>t.npc===n);t.how=HOW[cause]||'ELIMINATED';snd.play('target');hud.banner('TARGET ELIMINATED',n.name+' · '+t.how);hud.feed('<b>'+n.name+'</b> eliminated'+(acc?' — <b>accident</b>':''),'good');if(acc)G.stats.accidents++;
  const op=G.opps.find(o=>o.id===(cause==='chandelier'?'chand':cause==='poison'?'poison':cause==='fall'&&n.target==='corvo'&&G.railBroken?'rail':''));if(op){op.done=true;hud.opps();}
  if(G.canExit()){hud.feed('Both targets down. <b>Exit</b>: your car on the drive or the speedboat at the pier.','info',9000);}}
 else{G.stats.kills++;hud.feed('Non-target killed','bad');}
 if(cause==='pistol')blood(n);if(n.isGuard)n.rig.setProp(null);};
function ko(n){n.ko=true;n.state='ko';n.sus=0;n.task=null;n.path=null;G.bodies.push(n);G.stats.ko++;snd.play('thud',n.pos);hear(G,n.pos.x,n.pos.z,3.5,'thud');}
function blood(n){const m=new THREE.Mesh(new THREE.CircleGeometry(.55+Math.random()*.3,16).rotateX(-PI/2),new THREE.MeshStandardMaterial({color:0x3a0408,roughness:.15,transparent:true,opacity:.85,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2}));
 m.position.set(n.pos.x,n.y+.012,n.pos.z);scene.add(m);G.fx.push({m,blood:true});}

/* ================= interactions ================= */
function nearestBody(r=1.7){let best=null,bd=r;for(const b of G.bodies){if(b.hidden||b===P.drag)continue;const d=Math.hypot(b.pos.x-P.pos.x,b.pos.z-P.pos.z);if(d<bd&&Math.abs(b.y-P.y)<1.2){bd=d;best=b;}}return best;}
function nearestUse(r=1.7){let best=null,bd=r;for(const u of L.uses){const d=Math.hypot(u.x-P.pos.x,u.z-P.pos.z)*(u.id==='exit'?.7:1);if(d<bd&&Math.abs(u.y-P.y-1)<2.2){bd=d;best=u;}}return best;}
function nearestItem(r=1.6){let best=null,bd=r;for(const it of L.items){if(it.taken)continue;const d=Math.hypot(it.x-P.pos.x,it.z-P.pos.z);if(d<bd&&Math.abs(it.y-P.y-.8)<1.6){bd=d;best=it;}}return best;}
function nearestCont(r=1.8){let best=null,bd=r;for(const c of L.containers){const d=Math.hypot(c.x-P.pos.x,c.z-P.pos.z);if(d<bd&&Math.abs(c.y-P.y)<1.5){bd=d;best=c;}}return best;}
function victim(){let best=null,bd=1.6;for(const n of G.npcs){if(n.down||n.hidden||n.dieAct)continue;const dx=n.pos.x-P.pos.x,dz=n.pos.z-P.pos.z,d=Math.hypot(dx,dz);if(d>bd||Math.abs(n.y-P.y)>.8)continue;
  if(Math.abs(angDiff(yawTo(dx,dz),P.yaw))>1.2)continue;bd=d;best=n;}return best;}
const behind=n=>Math.abs(angDiff(yawTo(P.pos.x-n.pos.x,P.pos.z-n.pos.z),n.yaw))>1.9;
const ledge=n=>n.act==='lean'||n.pos.z>29.2&&n.pos.x<50&&n.pos.x>-60;
// holdable actions: {k:'E',t:label,dur,fn,bad}
function gatherPrompts(){const pr=[];if(G.app!=='play'||P.act&&P.act.kind!=='hold')return pr;
 if(P.hidden){pr.push({k:'E',t:'Leave '+P.hidden.name,fn:()=>{P.hidden=null;P.rig.root.visible=true;snd.play('cloth');}});return pr;}
 if(P.drag){const c=nearestCont();if(c&&!c.body)pr.push({k:'E',t:'Hide body in '+c.name,fn:()=>hideBody(c)});else if(c&&c.body)pr.push({k:'E',t:c.name+' is full',no:1});
  const edge=(P.pos.z>29&&P.pos.x<50)||(P.pos.z>63&&P.pos.x>52&&P.pos.x<58)||(P.pos.x<53.6&&P.pos.z>53.5&&P.pos.z<67&&P.pos.x>52)||(P.pos.x>56.4&&P.pos.z>53.5&&P.pos.z<67);
  if(edge)pr.push({k:'E',t:'Dump body into the sea',fn:dumpBody});pr.push({k:'G',t:'',hide:1});pr.push({k:'Q',t:'Drop body',fn:dropBody});return pr.filter(p=>!p.hide);}
 const b=nearestBody();if(b){pr.push({k:'E',t:'Drag body',fn:()=>{P.drag=b;b.dragged=true;snd.play('cloth');}});const dg=DISGUISE[b.lookType];if(dg&&b.lookType!=='under')pr.push({k:'T',t:'Take disguise: '+DNAME[dg],dur:1.4,illegal:'body',fn:()=>takeDisguise(b)});}
 const it=nearestItem();if(it)pr.push({k:'E',t:'Pick up '+it.name,fn:()=>pickItem(it)});
 const u=nearestUse();if(u){const U2=u;
  if(u.id==='radio')pr.push({k:'E',t:u.on?'Radio is playing':'Turn on radio',no:u.on,fn:u.on?null:()=>{u.on=true;u.led.material.color.set(0x30ff60);snd.play('radioOn',u);setTimeout(()=>hear(G,u.x,u.z,12,'radio',{use:U2}),1500);}});
  else if(u.id==='fuse')pr.push(G.dark[u.grp]?{k:'E',t:'Fuse box sabotaged',no:1}:{k:'E',t:'Sabotage fuse box ('+u.room+')',dur:1.5,illegal:'sabotage',fn:()=>{G.dark[u.grp]=true;U.grp.value[u.grp]=.04;snd.play('zap',u);burst(u.x,u.y,u.z,20);hud.feed('Lights out in the <b>'+u.room+'</b>','info');setTimeout(()=>fuseFixer(G,u),2500);}});
  else if(u.id==='winch'){if(G.chandFall)pr.push({k:'E',t:'The chandelier has fallen',no:1});else if(G.winch===0)pr.push({k:'E',t:'Unbolt chandelier winch',dur:2.6,illegal:'sabotage',fn:()=>{G.winch=1;G.opps[0].at=1;hud.opps();snd.play('creak',u);hud.feed('Winch unbolted. Release it when someone stands below.','info');}});
   else pr.push({k:'E',t:'Release the chandelier',fn:dropChandelier,bad:1});}
  else if(u.id==='decanter'){if(G.decanter)pr.push({k:'E',t:'Decanter is poisoned',no:1});else if(P.items.poison)pr.push({k:'E',t:'Poison the decanter',dur:2,illegal:'sabotage',fn:()=>{G.decanter=true;P.items.poison=0;G.opps[1].at=2;hud.opps();snd.play('pour',u);}});else pr.push({k:'E',t:'Whiskey decanter (needs poison)',no:1});}
  else if(u.id==='railing'){if(G.railBroken)pr.push({k:'E',t:'Railing is gone',no:1});else if(G.railLoose)pr.push({k:'E',t:'Railing loosened',no:1});else if(P.items.wrench)pr.push({k:'E',t:'Loosen pier railing',dur:3,illegal:'sabotage',fn:()=>{G.railLoose=true;G.opps[2].at=2;hud.opps();snd.play('creak',u);}});else pr.push({k:'E',t:'Pier railing (needs a wrench)',no:1});}
  else if(u.id==='exit')pr.push(G.canExit()?{k:'E',t:'Exit: '+u.name,fn:()=>endContract(true,u.exit)}:{k:'E',t:u.name+' — eliminate both targets first',no:1});}
 const c=nearestCont(1.5);if(c&&c.closet&&!c.body&&!pr.length)pr.push({k:'E',t:'Hide in '+c.name,fn:()=>{P.hidden=c;P.rig.root.visible=false;snd.play('cloth');for(const g of G.npcs)if(g.state==='combat'&&!g.seesPlayer){g.state='search';g.searchAt=g.lastSeen;g.stT=0;}}});
 const v=victim();if(v){const bh=behind(v);if(bh&&ledge(v))pr.push({k:'F',t:'Push',fn:()=>startAct('push',v,.8),bad:1});else pr.push({k:'F',t:'Subdue',fn:()=>startAct('subdue',v,1),bad:1});if(bh)pr.push({k:'V',t:'Fiber wire',fn:()=>startAct('wire',v,2.2),bad:1});}
 return pr;}
function startAct(kind,n,dur){P.act={kind,n,t:0,dur};n.held=true;n.path=null;n.spd=0;if(kind==='wire')snd.play('wire',n.pos);else snd.play('struggle',n.pos);if(kind==='push'){n.dieAct='flail';n.dieT=0;n.dieDur=2;n.deathCause='fall';n.vy=0;n.fallY=n.y;}}
function hideBody(c){const b=P.drag;c.body=b;b.hidden=true;b.dragged=false;b.rig.root.visible=false;P.drag=null;snd.play('cloth');snd.play('thud',c,{v:.5});}
function dumpBody(){const b=P.drag;b.hidden=true;b.dragged=false;b.rig.root.visible=false;P.drag=null;snd.play('splash',P.pos);}
function dropBody(){const b=P.drag;b.dragged=false;P.drag=null;snd.play('thud',b.pos,{v:.6});}
function pickItem(it){it.taken=true;it.mesh.visible=false;snd.play('pick');if(it.id==='coins'){P.coins+=it.n;hud.feed('+'+it.n+' coins','info',2000);}else{P.items[it.id]=1;hud.feed('Picked up <b>'+it.name+'</b>','info');const op=it.id==='poison'?G.opps[1]:G.opps[2];op.at=Math.max(op.at,1);hud.opps();}}
// the player keeps his own head: a gown or a ladies' suit becomes a dinner jacket of the same colour
function wear(lk){let o=lk;if(o.female){let sd=1;while(look('guest',sd).female)sd++;const m=look('guest',sd);o={...m,jacket:o.gown||o.suitF||m.jacket,pants:0x111114,bow:0x101010};}
 const pl=look('player');return{...o,skin:pl.skin,hair:pl.hair,hairS:o.hat?'crop':pl.hairS,face:pl.face,stubble:1,beard:0,glasses:0,female:false,prop:null,neck:0};}
function takeDisguise(b){const dg=DISGUISE[b.lookType];const seen=G.npcs.some(n=>n.seesPlayer&&!n.down);P.disguise=dg;P.lk=wear(b.lk);P.rig.setLook(P.lk);b.lk=look('under',b.id);b.lookType='under';b.rig.setLook(b.lk);G.stats.disguises++;snd.play('cloth');
 hud.feed('Disguised as <b>'+DNAME[dg]+'</b>','info');if(!seen){G.compromised=null;for(const g of G.npcs)if(g.state==='combat'||g.state==='investigate'){g.state='search';g.searchAt=g.lastSeen||g.pos;g.stT=0;g.sus=0;}}}
function dropChandelier(){G.chandFall={vy:0};snd.play('creak',L.uses.find(u=>u.id==='winch'));G.opps[0].at=2;hud.opps();}
function burst(x,y,z,n,spd=3){for(let i=0;i<n;i++)G.pl.push({x,y,z,vx:(Math.random()-.5)*spd,vy:Math.random()*spd,vz:(Math.random()-.5)*spd,t:.6+Math.random()*.6});}

/* ================= player ================= */
const fwd=new V(),rgt=new V(),tmp=new V();
function playerStep(dt){const k=I.keys,gp=gamepad();let mx=(k.KeyD?1:0)-(k.KeyA?1:0),mz=(k.KeyW?1:0)-(k.KeyS?1:0);
 if(gp){const lx=deadzone(gp.axes[0]),ly=deadzone(gp.axes[1]);if(lx||ly){mx=lx;mz=-ly;}G.camYaw-=deadzone(gp.axes[2])*dt*2.6;G.camPitch=cl(G.camPitch-deadzone(gp.axes[3])*dt*1.8,-1.1,.7);}
 const sens=.0024*G.opt.sens;G.camYaw-=I.mouse.dx*sens;G.camPitch=cl(G.camPitch-I.mouse.dy*sens,-1.1,.75);I.mouse.dx=I.mouse.dy=0;
 if(I.edge.KeyC||I.edge.ControlLeft||(gp&&gp.buttons[1]?.pressed&&!G.gpB))P.crouch=!P.crouch;G.gpB=gp&&gp.buttons[1]?.pressed;
 G.instinct=!!(k.KeyX||(gp&&gp.buttons[4]?.pressed));
 const aiming=(I.mouse.r||(gp&&gp.buttons[6]?.value>.3))&&!P.drag&&!P.hidden&&!P.act;P.aimK+=((aiming?1:0)-P.aimK)*Math.min(1,dt*10);
 P.illegal=null;P.sus=0;
 // timed acts (subdue / wire / push / hold-to-use)
 if(P.act){const a=P.act;a.t+=dt;P.moving=false;P.running=false;
  if(a.kind==='hold'){P.illegal=a.p.illegal&&a.p.illegal!=='body'?a.p.illegal:null;if(a.p.illegal==='body')P.illegal='body';P.sus=.6;G.holdK=a.t/a.p.dur;const held=I.keys['Key'+a.p.k]||(gp&&gp.buttons[0]?.pressed);if(!held){P.act=null;G.holdK=0;}else if(a.t>=a.p.dur){P.act=null;G.holdK=0;a.p.fn();}}
  else{const n=a.n;P.illegal='attack';const tx=n.pos.x-Math.sin(n.yaw)*.0,tz=n.pos.z;P.yaw+=angDiff(yawTo(tx-P.pos.x,tz-P.pos.z),P.yaw)*Math.min(1,dt*10);
   if(a.kind!=='push'){n.act='victim';const bx=P.pos.x+Math.sin(P.yaw)*.55,bz=P.pos.z+Math.cos(P.yaw)*.55;n.pos.x+=(bx-n.pos.x)*Math.min(1,dt*8);n.pos.z+=(bz-n.pos.z)*Math.min(1,dt*8);n.yaw+=angDiff(P.yaw,n.yaw)*Math.min(1,dt*8);}
   if(a.t>=a.dur){P.act=null;n.held=false;if(a.kind==='subdue')ko(n);else if(a.kind==='wire')G.kill(n,'wire');}}}
 // movement
 const sp=P.drag?1.3:P.crouch?1.55:(k.ShiftLeft||k.ShiftRight||(gp&&gp.buttons[10]?.pressed))?5:2.5;P.running=!P.crouch&&!P.drag&&sp>3&&(mx||mz);
 fwd.set(Math.sin(G.camYaw),0,Math.cos(G.camYaw));rgt.set(-fwd.z,0,fwd.x);
 let vx=0,vz=0;if(!P.act&&!P.hidden&&(mx||mz)){const l=Math.hypot(mx,mz);vx=(fwd.x*mz-rgt.x*mx)/Math.max(1,l)*sp;vz=(fwd.z*mz-rgt.z*mx)/Math.max(1,l)*sp;}
 P.moving=!!(vx||vz);
 if(P.moving){const nx=P.pos.x+vx*dt,nz=P.pos.z+vz*dt;tryMove(nx,P.pos.z);tryMove(P.pos.x,nz);P.stepT+=dt*sp;if(P.stepT>1.4){P.stepT=0;const z=L.roomAt(P.pos.x,P.pos.z),nm=L.rooms[z]?.name||'';snd.play('step',P.pos,{v:P.crouch?.35:P.running?1.2:.7,surf:/GARDEN|LAWN/.test(nm)?'grass':/DRIVE|YARD/.test(nm)?'gravel':/BOATHOUSE|SHED/.test(nm)?'wood':'stone'});if(P.running)hear(G,P.pos.x,P.pos.z,3,'none');}}
 const h=L.h(P.pos.x,P.pos.z);if(h===h)P.y+=(h-P.y)*Math.min(1,dt*14);
 if(P.aimK>.5)P.yaw=G.camYaw;else if(P.moving&&!P.act){const ty=Math.atan2(vx,vz);P.yaw+=angDiff(ty,P.yaw)*Math.min(1,dt*10);}
 if(P.drag){const b=P.drag;b.pos.x=P.pos.x-Math.sin(P.yaw)*1.05;b.pos.z=P.pos.z-Math.cos(P.yaw)*1.05;b.yaw=P.yaw+PI;const bh=L.h(b.pos.x,b.pos.z);if(bh===bh)b.y=bh;P.illegal='body';}
 if(P.aimK>.4)P.illegal=P.illegal||'gun';
 // weapon
 P.fireT-=dt;if(P.reloadT>0){P.reloadT-=dt;if(P.reloadT<=0){const n=Math.min(12-P.mag,P.res);P.mag+=n;P.res-=n;}}
 if((I.edge.KeyR)&&P.mag<12&&P.res>0&&P.reloadT<=0){P.reloadT=1.5;snd.play('reload');}
 const trig=I.fire()||(gp&&gp.buttons[7]?.value>.3);if(trig&&!P.drag&&!P.hidden&&!P.act&&P.fireT<=0&&P.reloadT<=0){if(P.mag>0)shoot();else{snd.play('dry');P.fireT=.3;if(P.res>0){P.reloadT=1.5;snd.play('reload');}}}
 // coin
 if((I.edge.KeyQ||(gp&&gp.buttons[5]?.pressed&&!G.gpRB))&&!P.drag&&!P.hidden&&!P.act&&P.coins>0)throwCoin();G.gpRB=gp&&gp.buttons[5]?.pressed;
 // interactions
 G.prompts=gatherPrompts();
 const press=c=>I.edge['Key'+c]||(c==='E'&&gp&&gp.buttons[0]?.pressed&&!G.gpA)||(c==='F'&&gp&&gp.buttons[2]?.pressed&&!G.gpX)||(c==='T'&&gp&&gp.buttons[3]?.pressed&&!G.gpY);
 if(!P.act)for(const p of G.prompts){if(p.no||!p.fn)continue;if(press(p.k)){if(p.dur){P.act={kind:'hold',p,t:0};}else p.fn();break;}}
 G.gpA=gp&&gp.buttons[0]?.pressed;G.gpX=gp&&gp.buttons[2]?.pressed;G.gpY=gp&&gp.buttons[3]?.pressed;
 if(!P.act||P.act.kind!=='hold')G.holdK=0;
 if(P.hidden){P.illegal=null;P.sus=0;}
 // health regen
 P.hurtT=Math.max(0,P.hurtT-dt*1.5);P.regenT+=dt;if(P.regenT>7&&P.hp<P.maxHp)P.hp=Math.min(P.maxHp,P.hp+dt*6);}
function tryMove(nx,nz){const h=L.h(nx,nz);if(h!==h||Math.abs(h-P.y)>.6)return;const p={x:nx,z:nz};L.collide(p,.3,P.y);const h2=L.h(p.x,p.z);if(h2!==h2||Math.abs(h2-P.y)>.6)return;P.pos.x=p.x;P.pos.z=p.z;}
// camera ray → first npc or wall
const ray=new THREE.Ray(),hitV=new V();
G.aimRay=(m)=>aimRay(m);
function aimRay(maxD=80){cam.getWorldDirection(tmp);ray.set(cam.position,tmp);const ex=cam.position.x+tmp.x*maxD,ey=cam.position.y+tmp.y*maxD,ez=cam.position.z+tmp.z*maxD;
 let wt=L.ray(cam.position.x,cam.position.y,cam.position.z,ex,ey,ez,false)*maxD;let best=null,bt=wt,head=false;
 for(const n of G.npcs){if(n.hidden||n.dieAct==='flail'&&n.dieT>.6)continue;const d=n.pos.distanceTo(P.pos);if(d>maxD)continue;const ly=n.down?0:1;
  const sph=n.down?[[0,.2,0,.3]]:[[0,1.62*(n.rig.scale),0,.14,1],[0,1.25,0,.24],[0,.9,0,.22],[0,.5,0,.18]];
  for(const[ox,oy,oz,r,hd]of sph){let cx=n.pos.x+ox,cz=n.pos.z+oz;if(n.down){cx=n.pos.x+Math.sin(n.yaw)*-.5*0;cz=n.pos.z;}hitV.set(cx,n.y+oy,cz);const tt=ray.distanceSqToPoint(hitV);if(tt>r*r)continue;const t=tmp.dot(hitV.clone().sub(cam.position));if(t>0&&t<bt){bt=t;best=n;head=!!hd;}}void ly;}
 return{n:best,t:bt,head,p:cam.position.clone().addScaledVector(tmp,bt)};}
function shoot(){P.mag--;P.fireT=.26;G.stats.shots++;snd.play('silenced',P.pos);P.rig.setProp('pistol');P.pistolT=2.5;hear(G,P.pos.x,P.pos.z,5.5,'shot');
 const h=aimRay();const hand=P.rig.b.handR;hand.getWorldPosition(G.flash.position);G.flash.visible=true;G.flashT=.04;
 if(h.n){const n=h.n;snd.play('hit',h.p);burst(h.p.x,h.p.y,h.p.z,4,1.5);if(n.down&&n.alive){G.kill(n,'pistol');return;}if(!n.alive)return;n.hp-=h.head?999:60;if(n.hp<=0)G.kill(n,'pistol');else{if(n.isGuard)enterCombat(G,n);else{n.state='flee';n.reportTo=null;n.witness=true;}}}
 else{burst(h.p.x,h.p.y,h.p.z,6,2);snd.play('ricochet',h.p);hear(G,h.p.x,h.p.z,4,'coin');}}
function throwCoin(){P.coins--;const h=aimRay(22);const t=h.p;const from=new V();P.rig.b.handR.getWorldPosition(from);const d=from.distanceTo(t),T=Math.max(.35,d/14);
 const m=makeProp('coin');m.position.copy(from);scene.add(m);G.fx.push({m,coin:true,p:from.clone(),v:new V((t.x-from.x)/T,(t.y-from.y)/T+4.9*T,(t.z-from.z)/T),t:0});snd.play('throw');P.coinT=.4;P.sus=Math.max(P.sus,.3);}

/* ================= camera ================= */
const piv=new V(),des=new V(),look2=new V();
function cameraStep(dt){const y0=P.y+(P.crouch?1.15:1.55);piv.set(P.pos.x,y0,P.pos.z);const aim=P.aimK;const dist=3.3*(1-aim)+1.5*aim+(P.drag?.6:0),sh=.42*(1-aim)+.55*aim;
 const cp=Math.cos(G.camPitch),sp=Math.sin(G.camPitch);fwd.set(Math.sin(G.camYaw)*cp,sp,Math.cos(G.camYaw)*cp);rgt.set(-Math.cos(G.camYaw),0,Math.sin(G.camYaw));
 const side=piv.clone().addScaledVector(rgt,sh);let ts=L.ray(piv.x,piv.y,piv.z,side.x,side.y,side.z,2);side.lerpVectors(piv,side,Math.max(0,ts-.1));
 des.copy(side).addScaledVector(fwd,-dist);const t=L.ray(side.x,side.y,side.z,des.x,des.y,des.z,2);const want=Math.max(.35,dist*t-.22);P.camD+=(want-P.camD)*Math.min(1,dt*(want<P.camD?20:4));
 cam.position.copy(side).addScaledVector(fwd,-P.camD);const c=L.ceilAt(cam.position.x,cam.position.z);if(cam.position.y>c-.15)cam.position.y=c-.15;const f=L.h(cam.position.x,cam.position.z);if(f===f&&cam.position.y<f+.25)cam.position.y=f+.25;
 look2.copy(side).addScaledVector(fwd,10);cam.lookAt(look2);
 // hide the player when the camera is inside him
 P.rig.root.visible=!P.hidden&&P.camD>.55;}

/* ================= main step ================= */
function step(dt){dt=Math.min(dt,.05);U.time.value+=dt;if(G.app==='load')return;
 const play=G.app==='play';G.pathQ=0;
 if(play){G.timeLeft-=dt;if(G.timeLeft<=0&&!G.over){endContract(false,'TIME RAN OUT');}playerStep(dt);}
 else if(G.app==='menu'){attract(dt);}
 // npcs
 let comb=false,srch=false,ms=0,crowd=0;
 for(const n of G.npcs){if(G.app!=='pause'&&!n.held)think(G,n,dt);if(n.held&&!n.down)n.act='victim';if(n.clap>0){n.clap-=dt;if(n.state==='routine')n.act='applaud';}
  if(n.state==='combat')comb=true;if(n.state==='search'||n.state==='investigate')srch=true;if(!n.down&&n.sus>ms)ms=n.sus;if(n.role==='guest'&&!n.down&&n.pos.distanceTo(P.pos)<12)crowd++;
  if(G.speech&&n.role==='guest'&&n.state==='routine'&&!n.routine.length&&L.roomAt(n.pos.x,n.pos.z)===L.roomAt(0,-12)){const ty=yawTo(-n.pos.x,-11-n.pos.z);n.yaw+=angDiff(ty,n.yaw)*Math.min(1,dt*3);}
  if(n.isGuard&&n.state==='combat'&&n.rig.propKind!=='pistol')n.rig.setProp('pistol');else if(n.isGuard&&n.state!=='combat'&&n.rig.propKind==='pistol'&&n.alive)n.rig.setProp(null);
  const h=L.h(n.pos.x,n.pos.z);if(h===h&&!n.dragged)n.y+=(h-n.y)*Math.min(1,dt*10);}
 G.combatNow=comb;G.searching=srch;G.maxSus=ms;G.crowdNear=crowd;
 // chandelier fall
 if(G.chandFall){const c=G.dyn.chand,f=G.chandFall;if(!f.done){f.vy-=14*dt;c.position.y+=f.vy*dt;if(c.position.y<=.55){c.position.y=.55;f.done=true;c.rotation.z=.12;c.rotation.x=-.08;U.grp.value[2]=.35;snd.play('crash',c.position,{ref:20});burst(c.position.x,1,c.position.z,60,6);hear(G,c.position.x,c.position.z,32,'crash');
   for(const n of G.npcs){if(n.down||n.hidden)continue;if(Math.hypot(n.pos.x-c.position.x,n.pos.z-c.position.z)<L.chand.r&&n.y<1)G.kill(n,'chandelier');}
   if(Math.hypot(P.pos.x-c.position.x,P.pos.z-c.position.z)<L.chand.r&&P.y<1){P.hp=0;endContract(false,'CRUSHED BY THE CHANDELIER');}
   for(const n of G.npcs)if(!n.down&&n.role!=='target'&&!n.isGuard&&n.pos.distanceTo(c.position)<14&&n.state==='routine'){n.state='flee';n.reportWhat='crash';n.reportAt={x:c.position.x,z:c.position.z};n.reportTo=null;}}}}
 const ch=G.dyn.chain,top=8,bot=G.dyn.chand.position.y+1.35;ch.scale.y=Math.max(.01,top-bot);ch.position.y=(top+bot)/2;ch.visible=!G.chandFall||!G.chandFall.done;
 if(G.dyn.railFall){const r=G.dyn.railFall;r.t+=dt;r.v+=9.8*dt;G.dyn.rail.position.y-=r.v*dt;G.dyn.rail.position.z+=dt*1.2;G.dyn.rail.rotation.x+=dt*1.6;if(G.dyn.rail.position.y<-16)G.dyn.railFall=null;}
 G.dyn.boat.position.y=-13.7+Math.sin(U.time.value*1.1)*.06;G.dyn.boat.rotation.z=Math.sin(U.time.value*.8)*.025;
 // fx: coins, blood, particles
 for(let i=G.fx.length-1;i>=0;i--){const f=G.fx[i];if(f.coin){f.t+=dt;f.v.y-=9.8*dt;f.p.addScaledVector(f.v,dt);f.m.position.copy(f.p);f.m.rotation.x+=dt*12;const fh=L.h(f.p.x,f.p.z);const blocked=L.ray(f.p.x-f.v.x*dt,f.p.y-f.v.y*dt,f.p.z-f.v.z*dt,f.p.x,f.p.y,f.p.z,false)<1;
   if((fh===fh&&f.p.y<=fh+.03)||blocked||f.t>4){if(fh===fh)f.p.y=Math.max(f.p.y,fh+.01);snd.play('coin',f.p,{ref:6});hear(G,f.p.x,f.p.z,9,'coin');scene.remove(f.m);G.fx.splice(i,1);}}}
 let pc=0;const m4=new THREE.Matrix4();for(let i=G.pl.length-1;i>=0;i--){const p=G.pl[i];p.t-=dt;if(p.t<=0){G.pl.splice(i,1);continue;}p.vy-=9.8*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;if(pc<300){m4.makeTranslation(p.x,p.y,p.z);G.parts.setMatrixAt(pc++,m4);}}G.parts.count=pc;G.parts.instanceMatrix.needsUpdate=true;
 if(G.flashT>0){G.flashT-=dt;if(G.flashT<=0)G.flash.visible=false;}
 if(P.pistolT>0){P.pistolT-=dt;}if(P.aimK<.2&&!(P.pistolT>0)&&P.rig.propKind==='pistol')P.rig.setProp(null);if(P.aimK>.4&&P.rig.propKind!=='pistol')P.rig.setProp('pistol');
 // rigs
 const camP=cam.position;for(const n of G.npcs){const r=n.rig;if(n.hidden){r.root.visible=false;continue;}const d=camP.distanceTo(n.pos);r.root.visible=d<140;if(!r.root.visible)continue;
  const fy=n.fallY!=null&&n.dieAct==='flail'?n.fallY:n.y;r.root.position.set(n.pos.x,fy+(n.down?0:n.yOff),n.pos.z);r.root.rotation.y=n.yaw;
  if(d<70||(U.time.value*10|0)%3===n.id%3)r.pose(d<70?dt:dt*3,{spd:n.spd,act:n.dieAct&&n.dieAct!=='flail'?n.dieAct:n.dieAct==='flail'?'flail':n.act,aim:n.aimK,lie:n.down||n.dieAct==='clutch'&&n.dieT>2.2,lieFace:1});
  lightRig(r,n.pos.x,n.pos.z,n.y);
  if(G.instinct&&d<60){const mat=n.role==='target'?G.ghost.target:n.enforcer&&n.enforcerOf===P.disguise?G.ghost.enf:n.isGuard?G.ghost.guard:G.ghost.civ;r.makeGhost(mat).visible=!n.down||n.role==='target';}else if(r.ghost)r.ghost.visible=false;}
 // player rig
 const pr=P.rig;pr.root.position.set(P.pos.x,P.y,P.pos.z);pr.root.rotation.y=P.yaw;let act='idle';if(P.act){act=P.act.kind==='hold'?(P.act.p.k==='T'?'kneel':'use'):P.act.kind==='push'?'use':'choke';}else if(P.drag)act='drag';else if(P.coinT>0){act='throw';P.coinT-=dt;}
 pr.pose(dt,{spd:P.moving?(P.drag?1.3:P.crouch?1.55:P.running?5:2.5):0,crouch:P.crouch&&!P.drag,act,aim:P.aimK,pitch:-G.camPitch,t:P.coinT>0?.4-P.coinT:0});lightRig(pr,P.pos.x,P.pos.z,P.y);
 if(P.hidden)pr.root.visible=false;
 // lights follow the player
 sun.position.set(P.pos.x+W.sun.x*90,P.y+W.sun.y*90+20,P.pos.z+W.sun.z*90);sun.target.position.set(P.pos.x,P.y,P.pos.z);
 if(play||G.app==='over')cameraStep(dt);if(G.freeCam){const f=G.freeCam;cam.position.set(f[0],f[1],f[2]);cam.lookAt(f[3],f[4],f[5]);}
 snd.listener(cam.position.x,cam.position.z,G.camYaw);snd.tick(dt,G);
 if(play){hud.tick(dt,cam,innerWidth,innerHeight);if(!$('map').hidden)hud.drawMap();}
 // instinct grade
 if(post&&post.grade){const s=post.grade.uniforms.sat;s.value+=((G.instinct?.42:1.08)-s.value)*Math.min(1,dt*8);}$('instov').style.opacity=G.instinct?1:0;
 // map / opportunity toggles
 if(I.edge.KeyM||I.edge.Tab){$('map').hidden=!$('map').hidden;if(!$('map').hidden)hud.drawMap();}if(I.edge.KeyO)$('opps').classList.toggle('min');
 I.flush();}
function lightRig(r,x,z,y){const l=W.light(x,z);const dark=G.darkAt(x,z);const k=dark?.08:1;r.light(l[3]>.5?1:0,[l[0]*k,l[1]*k,l[2]*k],l[3]>.5?1:.16);}
// menu camera: a slow drift high above the drive, looking over the villa roofs and gardens out to the sunset sea
function attract(dt){G.attract+=dt;const a=G.attract*.05;const cx=-6+Math.sin(a)*26,cz=-67+Math.cos(a*.7)*5;cam.position.set(cx,27+Math.sin(a*1.3)*3,cz);cam.lookAt(2+cx*.25,0,24);P.pos.set(cx,0,cz);P.hidden={name:''};P.rig.root.visible=false;}

/* ================= end + results ================= */
function endContract(win,why){if(G.over)return;G.over=true;G.app='over';I.unlock();const S=G.stats,d=G.opt.diff|0;
 const tDead=G.targets.filter(t=>!t.npc.alive).length;const witnesses=G.npcs.filter(n=>n.witness&&n.alive&&!n.ko).length;
 const SA=win&&S.kills===0&&S.bodiesFound===0&&witnesses===0&&!G.combatEver;
 let score=0;const rows=[];const add=(lbl,v,cls='')=>{score+=v;rows.push([lbl,(v>0?'+':'')+v.toLocaleString(),cls]);};
 for(const t of G.targets)if(!t.npc.alive)add(t.name+' · '+(t.how||''),5000,'pos');
 if(S.accidents)add('Accident kills ×'+S.accidents,S.accidents*2500,'pos');
 if(win){add('Contract time bonus',Math.round(Math.max(0,G.timeLeft)*4),'pos');if(SA)add('SILENT ASSASSIN',6000,'pos');else{if(!S.bodiesFound)add('No bodies found',1500,'pos');if(!G.combatEver&&!witnesses)add('Never spotted',2000,'pos');}}
 if(S.kills)add('Non-target kills ×'+S.kills,-2000*S.kills,'neg');if(S.bodiesFound)add('Bodies found ×'+S.bodiesFound,-1000*S.bodiesFound,'neg');if(witnesses)add('Witnesses ×'+witnesses,-800*witnesses,'neg');if(G.combatEver)add('Combat',-1500,'neg');
 score=Math.max(0,Math.round(score*[.8,1,1.3][d]));
 let rating='CONTRACT FAILED',stars=0;if(win){if(SA){rating='SILENT ASSASSIN';stars=5;}else{const pen=S.kills*2+S.bodiesFound+witnesses+(G.combatEver?2:0);stars=pen<=1?4:pen<=3?3:pen<=6?2:1;rating=['','BUTCHER','MERCENARY','CONTRACTOR','PROFESSIONAL'][stars];}}
 G.result={win,why,score,rating,stars,SA,tDead,witnesses};G.scoreV=score;
 const tokens=win?Math.max(1,Math.round(score/1200)):Math.round(tDead);addRound(tokens,win);const best=bestScore(GID);saveBest(GID,score);
 snd.play(win?'win':'fail');
 setTimeout(()=>{$('hud').hidden=true;$('map').hidden=true;document.body.classList.remove('playing');$('over').hidden=false;$('oeye').textContent=win?'CONTRACT COMPLETE · '+(why==='boat'?'ESCAPED BY SEA':'DROVE OFF'):'CONTRACT FAILED · '+why;
  $('orate').textContent=rating;$('orate').className='rating'+(win?'':' fail');$('ostars').textContent=win?'★'.repeat(stars)+'☆'.repeat(5-stars):'';$('oscore').textContent=score.toLocaleString();
  const info=[['Difficulty',G.diff.name,''],['Time used',fmt(G.limit-Math.max(0,G.timeLeft)),''],['Targets eliminated',tDead+' / 2',''],['Non-target kills',S.kills,S.kills?'neg':''],['Subdued',S.ko,''],['Bodies found',S.bodiesFound,S.bodiesFound?'neg':''],['Witnesses',witnesses,witnesses?'neg':''],['Disguises',S.disguises,''],['Shots fired',S.shots,'']];
  $('stats').innerHTML=info.map(r=>`<tr class="${r[2]}"><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('')+rows.map(r=>`<tr class="${r[2]}"><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
  $('otok').textContent=`+${tokens} TOKENS · BEST ${Math.max(best,score).toLocaleString()}${score>best?' · NEW BEST':''}`;},win?900:1400);}
postButton($('post'),GID,()=>[G.scoreV||0,`Silent Contract — ${G.result?.rating||''} (${G.diff.name}) — ${G.scoreV||0} points, ${G.result?.tDead||0}/2 targets.`]);

/* ================= menus ================= */
const seg=pickers(G.opt,saveOpt);const DN=['Slower suspicion, fewer guards, more health, 15 minutes.','The intended contract. 12 minutes.','Sharp-eyed guards, extra patrols, a second bodyguard, 10 minutes.'];
seg('o-diff','diff',true,v=>$('dnote').textContent=DN[v]);seg('o-start','start');seg('o-sens','sens');seg('o-vol','vol',true,v=>snd.setVol(v));$('dnote').textContent=DN[G.opt.diff];
function showMenu(){G.app='menu';G.over=false;$('menu').hidden=false;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=true;$('map').hidden=true;document.body.classList.remove('playing');const b=bestScore(GID);$('best').textContent=b?'BEST '+b.toLocaleString():'';
 if(!G.npcs.length)start0();}
function start0(){// populate the villa for the attract camera
 const o={...G.opt};start(o);G.app='menu';$('hud').hidden=true;$('menu').hidden=false;document.body.classList.remove('playing');I.unlock();}
function pause(on){if(on&&G.app==='play'){G.app='pause';$('pause').hidden=false;I.unlock();}else if(!on&&G.app==='pause'){G.app='play';$('pause').hidden=true;I.lock();}}
$('go').onclick=()=>{snd.init();start({});};$('again').onclick=()=>start({});$('omenu').onclick=showMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{endContract(false,'ABANDONED');};
addEventListener('keydown',e=>{if(e.code==='Escape'&&G.app==='pause'){pause(false);}});

/* ================= loop ================= */
let last=performance.now();
function frame(now){const dt=Math.min(.05,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(frame);}
function render(){if(G.app==='load')return;post?post.render():R.render(scene,cam);}

setTimeout(()=>{setupWorld();showMenu();$('load').hidden=true;requestAnimationFrame(frame);},30);

/* ================= test hook ================= */
window.CONTRACT={start:o=>start(o||{}),step:(dt=1/30)=>step(dt),render,get state(){return G.app},get score(){return G.scoreV||0},get player(){return P},get npcs(){return G.npcs},get targets(){return G.targets},G,get L(){return L},
 setQuality:q=>{setQuality(q);applyQuality(q);},noPause:()=>{G.noPause=true;},teleport:(x,z,yaw)=>{P.pos.set(x,0,z);P.y=L.h(x,z)||0;if(yaw!=null){P.yaw=yaw;G.camYaw=yaw;}},look:(yaw,pitch=-.1)=>{G.camYaw=yaw;G.camPitch=pitch;},
 key:(code,on=true)=>{I.keys[code]=on;if(on)I.edge[code]=true;},press:code=>{I.edge[code]=true;},mouse:(btn,on)=>{if(btn===0){I.mouse.l=on;if(on)I.mouse.le=true;}else I.mouse.r=on;},
 npc:name=>G.npcs.find(n=>n.name===name),setTime:s=>{G.timeLeft=s;},cam:(a)=>{G.freeCam=a||null;},get camera(){return cam},get scene(){return scene},kill:(n,c)=>G.kill(n,c),ko,end:endContract,get result(){return G.result},prompts:()=>G.prompts.map(p=>p.k+':'+p.t)};
