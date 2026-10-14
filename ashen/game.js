// ASHEN VIGIL — a third-person souls-like through a ruined cathedral-keep. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton,toast,$} from '../js/kit3d/ui.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {buildLevel,updateLevel,MOON} from './level.js';
import {Phys} from './phys.js';
import {Particles,Cloth,Decals} from './fx.js';
import {Foe,FOES,Projectiles,Hazards} from './foes.js';
import {makePlayer,equip,resetPlayer,updatePlayer,updateCamera,makeCam,hurtPlayer,toggleLock,pickTarget,STYLES} from './player.js';
import {Sound} from './sound.js';
import {animate as animRig} from './rig.js';

const V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,rnd=(a=1)=>Math.random()*a,C=(r,g,b)=>new THREE.Color(r,g,b);
const ID='ashen';
const fmt=t=>{t=Math.max(0,Math.ceil(t));return(t/60|0)+':'+String(t%60).padStart(2,'0');};
const EMBER=[C(2.6,.9,.2),C(2.2,.5,.1),C(1.8,1.2,.4)],ASH=C(.16,.14,.13);

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(0x0d1016,.03);scene.background=new THREE.Color(0x07080b);
const camera=new THREE.PerspectiveCamera(60,innerWidth/innerHeight,.1,900);
const hemi=new THREE.HemisphereLight(0x5a6a8a,0x1a140e,1.05);scene.add(hemi);
const moon=new THREE.DirectionalLight(0xaabbe0,1.7);moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);Object.assign(moon.shadow.camera,{left:-32,right:32,top:32,bottom:-32,near:1,far:220});moon.shadow.bias=-.0005;moon.shadow.normalBias=.05;scene.add(moon,moon.target);
const fill=new THREE.PointLight(0xffc89a,6,9,1.6);scene.add(fill);// the Unkindled's faint ember glow keeps them readable in the dark
const NL=8;const lamps=[];for(let i=0;i<NL;i++){const l=new THREE.PointLight(0xff8a3a,0,16,1.7);scene.add(l);lamps.push(l);}
const phys=new Phys();
const L=buildLevel(scene,phys);
const parts=new Particles(scene,5000,true),sparks=new Particles(scene,1600,true),smoke=new Particles(scene,1600,false);
const decals=new Decals(scene);const snd=new Sound();
const DIFF=[{n:'EASY',hp:.75,dmg:.6,aggr:.75,tele:1.35,heal:.6,flasks:5,mult:.75,feint:false},{n:'NORMAL',hp:1.1,dmg:1.2,aggr:1.1,tele:1,heal:.5,flasks:4,mult:1,feint:false},{n:'HARD',hp:1.35,dmg:1.65,aggr:1.35,tele:.8,heal:.42,flasks:3,mult:1.4,feint:true}];

/* ================= shared context ================= */
const timers=[];
const G={scene,camera,phys,level:L,snd,parts,sparks,smoke,decals,foes:[],time:0,run:null,dm:DIFF[1],cam:makeCam(),indoor:false,boss:null,
 after:(t,f)=>timers.push({t,f})};
G.proj=new Projectiles(G);G.haz=new Hazards(G);
G.proj.fall=(x,y,z)=>{const g=new THREE.Mesh(G.proj.bladeGeo,G.proj.bladeMat);g.position.set(x,y+9,z);g.rotation.x=Math.PI/2;scene.add(g);falling.push({g,y0:y,t:0});};
const falling=[];
const P=makePlayer(G);
G.makeCape=rig=>{const c=rig.capeAt;const mat=new THREE.MeshStandardMaterial({color:c.col,roughness:.9,side:THREE.DoubleSide,map:capeTex(),alphaTest:.5});const cl=new Cloth(scene,6,9,c.w*rig.scale,c.h*rig.scale,mat);cl.spheres=[{c:new V(),r:.2*rig.scale},{c:new V(),r:.2*rig.scale},{c:new V(),r:.17*rig.scale},{c:new V(),r:.17*rig.scale}];return cl;};
let CAPE_TX=null;function capeTex(){if(CAPE_TX)return CAPE_TX;const c=document.createElement('canvas');c.width=64;c.height=128;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,64,128);for(let i=0;i<500;i++){x.fillStyle=`rgba(0,0,0,${Math.random()*.2})`;x.fillRect(Math.random()*64,Math.random()*128,1,2+Math.random()*4);}
 x.globalCompositeOperation='destination-out';x.beginPath();x.moveTo(0,128);for(let i=0;i<=8;i++)x.lineTo(i*8,128-(i%2?14:4)-Math.random()*10);x.lineTo(64,128);x.closePath();x.fill();for(let k=0;k<4;k++){x.beginPath();x.arc(Math.random()*64,60+Math.random()*50,2+Math.random()*3,0,6.3);x.fill();}
 CAPE_TX=new THREE.CanvasTexture(c);CAPE_TX.colorSpace=THREE.SRGBColorSpace;return CAPE_TX;}
const cpA=new V(),cpB=new V(),cpM=new THREE.Matrix4();
G.updateCape=(cape,rig,dt)=>{if(!cape)return;const c=rig.capeAt;c.j.updateWorldMatrix(true,false);const m=c.j.matrixWorld;const n=cape.cols;
 for(let i=0;i<n;i++){const u=i/(n-1)*(c.pts.length-1),k=Math.min(c.pts.length-2,Math.floor(u)),f=u-k;const a=c.pts[k],b=c.pts[k+1];cpA.set(a[0]+(b[0]-a[0])*f,a[1]+(b[1]-a[1])*f,a[2]+(b[2]-a[2])*f).applyMatrix4(m);cape.setPin(i,cpA.x,cpA.y,cpA.z);}
 const j=rig.j;const sc=rig.scale;cape.spheres[0].c.set(0,.12,.04).applyMatrix4(m);cape.spheres[1].c.set(0,-.12,.02).applyMatrix4(m);j.legL.updateWorldMatrix(true,false);j.legR.updateWorldMatrix(true,false);cape.spheres[2].c.set(0,-.25,0).applyMatrix4(j.legL.matrixWorld);cape.spheres[3].c.set(0,-.25,0).applyMatrix4(j.legR.matrixWorld);
 cape.floor=rig.root.position.y;cape.wind.set(.8+Math.sin(G.time*.7)*.6,0,.4);cape.update(dt,cpB.set(0,-1,0));};
P.cape=G.makeCape(P.rig);equip(G,'ss');

/* ================= foes ================= */
function spawnAll(){for(const e of G.foes){scene.remove(e.rig.root);if(e.cape)e.cape.dispose(scene);}G.foes=[];
 for(const s of L.spawns)G.foes.push(new Foe(G,s.kind,s));
 G.bosses=L.bosses.map(b=>{const e=new Foe(G,b.kind,{x:b.x,y:b.y,z:b.z,yaw:b.yaw},b);G.foes.push(e);return e;});}
G.summon=(kind,x,z,y,owner)=>{const e=new Foe(G,kind,{x,y,z,yaw:owner.yaw});e.summoned=true;e.aware=true;e.state='engage';e.cd=.8;e.home.set(x,y,z);G.foes.push(e);G.sparks.burst(new V(x,y+.6,z),40,5,EMBER,.3,.7,{up:true,grav:-1});G.smoke.burst(new V(x,y+.4,z),14,2,ASH,1.2,1.2,{up:true,drag:2});};

/* ================= run state ================= */
const opt={style:'ss',diff:1,len:20};const saveOpt=stored('pxd_ashen_opt',opt);
let app='menu',run=null,lastAward=null,menuT=0;
function newRun(){return{clock:opt.len*60,len:opt.len*60,shrine:L.shrines[0],deaths:0,kills:0,killScore:0,bosses:0,felled:[],victory:false,end:false,score:0,areas:new Set(),cur:'',items:0,startT:0,hintI:0,hintT:3};}
function start(o={}){camera.clearViewOffset();Object.assign(opt,o);saveOpt();snd.init();timers.length=0;
 G.dm=DIFF[opt.diff];run=G.run=newRun();G.time=0;
 // world reset
 L.gates.forEach(g=>{g.open=false;g.k=0;g.g.position.y=g.y;g.col.on=true;});L.levers.forEach(l=>{l.pulled=false;});L.fogs.forEach(f=>f.state='open');L.items.forEach(i=>i.taken=false);
 L.shrines.forEach((s,i)=>{s.lit=i===0;s.usable=i===0;});G.proj.clear();G.haz.clear();decals.clear();parts.clear();sparks.clear();smoke.clear();falling.forEach(f=>scene.remove(f.g));falling.length=0;
 spawnAll();G.boss=null;$('boss').hidden=true;
 equip(G,opt.style);const S=STYLES[opt.style];P.maxHp=S.hp;P.maxFlasks=G.dm.flasks;P.flasks=P.maxFlasks;for(const k in P.stats)P.stats[k]=0;
 resetPlayer(G,L.start.x,L.start.y,L.start.z,L.start.yaw);P.cape.init=false;
 app='play';hideAll();$('hud').hidden=false;document.body.classList.add('playing');I.lock();
 area('Ashen Yard');banner('THE VIGIL BEGINS','Fell the four great foes before the embers fade','ash',3.4);}
function hideAll(){for(const id of['menu','keys','over','pause'])$(id).hidden=true;$('lockmsg').hidden=true;}
function toMenu(){app='menu';hideAll();$('menu').hidden=false;$('keys').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');I.unlock();if(run)run.end=true;
 $('best').textContent=bestScore(ID)?`BEST ${bestScore(ID).toLocaleString()} PTS`:'';menuPose();}
function pause(on){if(on&&app==='play'){app='paused';$('pause').hidden=false;document.body.classList.remove('playing');I.unlock();}else if(!on&&app==='paused'){app='play';$('pause').hidden=true;document.body.classList.add('playing');I.lock();}}

/* ================= feedback ================= */
let banT=0,areaT=0;
function banner(t,s,cls='ash',dur=3){const b=$('banner');$('bt').textContent=t;$('bs').textContent=s||'';b.className='on '+cls;banT=dur;}
function area(name){$('areaN').textContent=name.toUpperCase();$('area').classList.add('on');areaT=3.4;}
const noteSeen={};G.note=(t,cls='')=>{if(noteSeen[t]>G.time-5)return;noteSeen[t]=G.time;const d=toast($('notes'),t,3200,3,false);if(cls)d.className=cls;};
G.shake=(a,p)=>{const d=p?P.p.distanceTo(p):0;G.cam.shake=Math.max(G.cam.shake,a*(1-Math.min(1,d/45)));};
G.dust=(x,y,z,n,small)=>smoke.burst(new V(x,y+.15,z),n,small?1.4:3.2,C(.3,.27,.24),small?.55:1.2,small?.7:1.2,{up:true,flat:true,grav:-.3,drag:2.5,r:.3});
G.decal=o=>decals.add(o);G.hazard=o=>G.haz.add(o);
let stopT=0,slowT=0,flashA=0,vignA=0;G.hitstop=t=>{stopT=Math.max(stopT,t);};
const tv=new V(),tv2=new V();
function weaponTip(e){const w=e.rig.weapons&&e.rig.weapons.main;if(w&&w.userData.tip){w.updateWorldMatrix(true,false);return tv2.copy(w.userData.tip).applyMatrix4(w.matrixWorld);}return tv2.set(e.p.x,e.p.y+e.D.headY,e.p.z);}
G.perilous=e=>{const p=weaponTip(e).clone();G.after(.05,()=>{sparks.burst(p,24,3,[C(3,.3,.15),C(2.6,.6,.2)],.55,.35,{});parts.emit(p.x,p.y,p.z,0,0,0,3.2,.4,.2,1.6,.35,0,0);});snd.play('blade',p,.5);};
G.bossPhase=e=>{snd.play('roar',e.p);snd.play('phase',e.p);G.shake(1,e.p);const msg={bell:['THE BELL TOLLS','Vargul rings the iron dirge'],mother:['THE PACK ANSWERS','Griska calls her young and breathes fire'],cantor:['THE CHOIR IGNITES','Seraphel sings with a burning voice'],king:e.phase===2?['THE BLADE KINDLES','Ordhal sets his greatsword ablaze']:['ASH AND RUIN','The Ashen King burns with his last fire']}[e.kind];
 if(msg)banner(msg[0],msg[1],'red',2.6);sparks.burst(tv.set(e.p.x,e.p.y+e.D.bodyY,e.p.z),160,12,EMBER,.4,1.1,{up:true,grav:3});parts.burst(tv,60,6,EMBER,1.2,1.3,{up:true,drag:1.5,r:1});flashA=.5;};
G.dissolve=e=>{const n=e.D.boss?400:80;for(let i=0;i<n;i++){const y=rnd(e.D.h),r=e.D.r*1.2;parts.emit(e.p.x+rnd(r*2)-r,e.p.y+y,e.p.z+rnd(r*2)-r,rnd(1)-.5,.6+rnd(1.6),rnd(1)-.5,2.4,.8+rnd(.6),.2,.12+rnd(.2),1.6+rnd(1.6),-.4,.6);}smoke.burst(tv.set(e.p.x,e.p.y+e.D.h*.4,e.p.z),e.D.boss?50:14,2,ASH,e.D.boss?3:1.6,2,{up:true,grav:-.5,drag:1.6,r:e.D.r});snd.play('dissolve',e.p,e.D.boss?1.4:.7);};
G.vanish=e=>{sparks.burst(tv.set(e.p.x,e.p.y+e.D.bodyY,e.p.z),70,6,[C(2.4,1.9,1),C(2.6,1.2,.4)],.3,.6,{grav:-1,r:.8});smoke.burst(tv,10,1.5,C(.3,.26,.22),1.4,.9,{up:true,drag:2});snd.play('blade',e.p,.8);};
let breathT=0;G.breath=(e,dt,mv)=>{const hd=e.rig.j.head;hd.updateWorldMatrix(true,false);const h=tv.set(0,0,.3).applyMatrix4(hd.matrixWorld);const f=Math.sin(e.yaw),c=Math.cos(e.yaw);
 for(let i=0;i<10;i++){const a=(rnd(1)-.5)*mv.arc,sp=9+rnd(5);const dx=Math.sin(e.yaw+a),dz=Math.cos(e.yaw+a);parts.emit(h.x,h.y,h.z,dx*sp,-1.2+rnd(1.2),dz*sp,2.8,.9+rnd(.5),.2,.5+rnd(.5),.65,-.6,1.2);}
 if(Math.random()<dt*8)smoke.emit(h.x+f*4,h.y,h.z+c*4,f*3,1.4,c*3,.2,.16,.14,1.4,1.4,-.4,1);if((breathT-=dt)<=0){breathT=.22;snd.play('breath',h,.6);
  const R=e.rel();const ang=Math.acos(cl(R.dot,-1,1));if(R.d<mv.reach&&ang<mv.arc/2+.1&&Math.abs(P.p.y-e.p.y)<3)G.hurtPlayer(e.dmg(mv),e,{...mv,knock:1,poise:6,from:e.p});}};
const beamGeo=new THREE.CylinderGeometry(.35,.35,1,10,1,true).translate(0,.5,0).rotateX(Math.PI/2);const beamMesh=new THREE.Mesh(beamGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(3,1.9,.9),transparent:true,opacity:.85,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));beamMesh.visible=false;scene.add(beamMesh);let beamT=0,beamOn=0;
G.beam=(e,dt,mv)=>{const o=tv.set(e.p.x,e.p.y+2.2,e.p.z);const f=Math.sin(e.yaw),c=Math.cos(e.yaw);const len=Math.min(mv.reach,phys.ray(o.x,o.y,o.z,f,0,c,mv.reach,x=>x.tag==='wall')||mv.reach);beamMesh.visible=true;beamOn=.1;beamMesh.position.copy(o);beamMesh.rotation.set(0,e.yaw,0);beamMesh.scale.set(1+Math.sin(G.time*40)*.15,1+Math.sin(G.time*40)*.15,len);
 for(let i=0;i<4;i++){const k=rnd(len);parts.emit(o.x+f*k,o.y+rnd(.4)-.2,o.z+c*k,rnd(2)-1,rnd(2),rnd(2)-1,2.6,1.8,.8,.3,.4,0,1);}
 if((beamT-=dt)<=0){beamT=.25;if(Math.random()<.5)snd.play('beam',o,.5);const px=P.p.x-o.x,pz=P.p.z-o.z;const along=px*f+pz*c,perp=Math.abs(px*c-pz*f);if(along>0&&along<len&&perp<.9&&Math.abs(P.p.y+1-o.y)<2.2)G.hurtPlayer(Math.round(e.dmg(mv)*.45),e,{...mv,knock:3,poise:25,from:o});}};
G.hurtPlayer=(d,src,mv)=>hurtPlayer(G,d,src,mv);
G.blocked=(e,o)=>{const p=tv.set(e.p.x,e.p.y+1.3,e.p.z).lerp(P.p,.35);sparks.burst(p,22,6,[C(2.6,2.2,1.4),C(2,1.4,.6)],.2,.3,{grav:8});snd.play('clang',p);G.hitstop(.05);P.st-=6;G.shake(.12);};
G.blockFx=(src,mv)=>{const p=tv.set(P.p.x+Math.sin(P.yaw)*.6,P.p.y+1.3,P.p.z+Math.cos(P.yaw)*.6);sparks.burst(p,26,7,[C(2.6,2.2,1.4),C(2,1.4,.6)],.22,.35,{grav:8});snd.play('clang',p);G.hitstop(.06);G.shake(.25);};
G.parryFx=e=>{const p=tv.set(P.p.x+Math.sin(P.yaw)*.7,P.p.y+1.35,P.p.z+Math.cos(P.yaw)*.7);sparks.burst(p,90,11,[C(3,2.8,2.2),C(2.8,1.8,.7),C(1.8,2.2,2.8)],.3,.55,{grav:5});parts.burst(p,24,3,C(3,2.4,1.4),.8,.25,{});
 snd.play('parry',p);G.hitstop(.12);slowT=.45;flashA=.35;G.shake(.35);G.note('PARRIED','g');};
G.guardBroken=()=>{snd.play('guardbreak',P.p);G.shake(.5);G.note('Your guard is broken','r');};
G.dodged=src=>{};
G.hurtFx=(d,chip)=>{const p=tv.set(P.p.x,P.p.y+1.2,P.p.z);sparks.burst(p,chip?6:20,5,[C(1.6,.15,.08),C(.9,.05,.03)],.2,.45,{grav:12});if(!chip){snd.play('hurt',P.p);snd.play('hit',P.p,.7);vignA=Math.min(1,.4+d/120);G.shake(Math.min(.9,.25+d/80));G.hitstop(.06);}};
G.healFx=h=>{snd.play('heal',P.p);parts.burst(tv.set(P.p.x,P.p.y+1,P.p.z),50,2.2,[C(2.4,1.5,.5),C(2.6,2,1)],.25,1.1,{up:true,grav:-1.5,drag:1.2,r:.5});};
G.critStart=(e,kind)=>{slowT=.35;};
G.postureBreak=e=>{snd.play('guardbreak',e.p);snd.play('roar',e.p,.5);G.shake(.6,e.p);G.note(`${e.D.name.split(',')[0]} staggers · strike now`,'g');sparks.burst(tv.set(e.p.x,e.p.y+e.D.bodyY,e.p.z),80,9,[C(2.8,2.4,1.6)],.35,.6,{grav:4});};
G.damageFoe=(e,dmg,o)=>{if(e.dead)return;const res=e.struck(dmg,o);if(res==='none'||res==='blocked'||res==='guardbreak')return;
 const at=tv.set(e.p.x,e.p.y+e.D.bodyY+.2,e.p.z).lerp(tv2.set(P.p.x,P.p.y+1.2,P.p.z),.25);const armor=!e.D.quad&&e.kind!=='cantor';
 sparks.burst(at,o.crit?70:24,o.crit?9:6,armor?[C(2.6,2,1.2),C(2.2,.9,.3)]:[C(1.4,.12,.06),C(2.4,.6,.15)],.22,.45,{grav:10,dir:o.dir,spread:1.1});if(o.crit)parts.burst(at,30,4,EMBER,.6,.6,{});
 snd.play(o.crit?'crit':armor?'hitArmor':'hit',e.p,o.heavy?1.2:.9);G.hitstop(o.crit?.16:o.heavy?.085:.05);G.shake(o.crit?.7:o.heavy?.3:.14);
 e.lastDmgT=G.time;e.dmgAcc=(e.dmgT>G.time?e.dmgAcc:0)+dmg;e.dmgT=G.time+2.4;P.stats.dealt=(P.stats.dealt||0)+dmg;
 if(res==='crit')G.note(o.kind==='backstab'?'BACKSTAB':'RIPOSTE','g');};
G.foeDied=e=>{if(P.lock===e)P.lock=null;run.kills++;run.killScore+=e.D.score;
 if(e.boss){run.bosses++;run.felled.push(e.D.name);$('boss').hidden=true;G.boss=null;const b=e.boss;b.fog.state='gone';if(b.exit){b.exit.open=true;G.after(1.4,()=>snd.play('gate',b.exit.g.position));}if(b.shrine)b.shrine.usable=true;
  for(const f of G.foes)if(f.summoned&&!f.dead)f.die();
  slowT=1.2;flashA=.6;G.shake(1.2,e.p);snd.play('felled');
  if(e.kind==='king'){run.victory=true;banner('THE ASH IS STILLED','Ordhal, the Ashen King, is no more','gold',6);G.after(7,()=>{if(run&&!run.end)endRun('victory');});}
  else{banner('FOE VANQUISHED',e.D.name,'gold',4.2);G.after(4.6,()=>{if(run&&!run.end)G.note('A new vigil can be kindled nearby','g');});}}};
G.playerDied=()=>{P.dead=true;P.deadT=0;P.act=null;P.lock=null;run.deaths++;snd.play('death',P.p);G.shake(.5);
 G.after(1.1,()=>{if(run&&!run.end)banner('FALLEN','The ash claims you · return to the vigil','red',3);});
 G.after(4.4,()=>{if(!run||run.end)return;fade();G.after(.5,()=>respawn());});};
G.fellToDeath=()=>{if(P.dead)return;P.hp=0;G.playerDied();};
function fade(){const f=$('fade');f.classList.add('on');setTimeout(()=>f.classList.remove('on'),700);}
function respawn(){if(!run||run.end)return;const s=run.shrine;// reset bosses (not felled), calm the living
 for(const e of G.foes){if(e.summoned){if(!e.dead){e.dead=true;e.gone=true;}e.rig.root.visible=false;continue;}if(!e.dead)e.reset();}
 G.foes=G.foes.filter(e=>!e.summoned);for(const b of G.bosses)if(!b.dead&&b.boss.fog.state==='sealed')b.boss.fog.state='open';G.boss=null;$('boss').hidden=true;
 G.proj.clear();G.haz.clear();decals.clear();
 const a=Math.atan2(0-0,1);resetPlayer(G,s.x,s.y,s.z-2.2,0);P.flasks=P.maxFlasks;P.cape.init=false;P.act={k:'rest',t:0,dur:1};G.after(1.2,()=>{if(P.act&&P.act.k==='rest')P.act=null;});}

/* ================= interactables ================= */
let near=null;
function findInteract(){if(P.dead||P.act&&P.act.k!=='rest'&&P.act.k!=='drink'&&P.act)return null;let best=null,bd=2.6;const c=(o,d,label,act)=>{if(d<bd){bd=d;best={o,label,act};}};const dy=y=>Math.abs(P.p.y-y)<1.6;
 for(const s of L.shrines){if(!s.usable||!dy(s.y))continue;c(s,Math.hypot(P.p.x-s.x,P.p.z-s.z)-1.2,s.lit?'Rest at the vigil':'Kindle the vigil',()=>rest(s));}
 for(const l of L.levers){if(l.pulled||!dy(l.y))continue;c(l,Math.hypot(P.p.x-l.x,P.p.z-l.z)-.4,'Pull the lever',()=>pull(l));}
 for(const f of L.fogs){if(f.state!=='open'||!dy(f.y))continue;const d=Math.hypot(P.p.x-f.x,P.p.z-f.z);if(P.p.z<f.z)c(f,d-1.6,'Traverse the white fog',()=>enterFog(f));}
 for(const i of L.items){if(i.taken||!dy(i.y))continue;c(i,Math.hypot(P.p.x-i.x,P.p.z-i.z)-.3,'Take the '+i.label,()=>take(i));}
 return best;}
function rest(s){const first=!s.lit;s.lit=true;run.shrine=s;P.hp=P.maxHp;P.st=P.stMax;P.flasks=P.maxFlasks;P.act={k:'rest',t:0,dur:2};P.lock=null;G.after(1.8,()=>{if(P.act&&P.act.k==='rest')P.act=null;});snd.play('shrine',tv.set(s.x,s.y,s.z));
 sparks.burst(tv.set(s.x,s.y+.6,s.z),first?160:60,first?7:4,EMBER,.3,1.2,{up:true,grav:-2,r:.5});
 for(const e of G.foes)if(!e.dead&&!e.D.boss&&!e.summoned&&e.aware){e.reset();}
 if(first)banner('VIGIL KINDLED',s.name,'gold',2.6);else G.note('You rest. Flasks restored · foes forget you','g');}
function pull(l){l.pulled=true;snd.play('lever',tv.set(l.x,l.y,l.z));G.after(.6,()=>{l.gate.open=true;snd.play('gate',l.gate.g.position);G.note('A shortcut opens','g');G.shake(.2);});}
function enterFog(f){P.act={k:'fog',t:0,dur:1.3};P.lock=null;snd.play('fog',tv.set(f.x,f.y,f.z));const b=G.bosses.find(e=>e.boss.fog===f);P.v.set(0,0,0);P.yaw=0;
 const sx=P.p.x,sz=P.p.z;fogWalk={f,b,t:0,sx,sz};}
let fogWalk=null;
function take(i){i.taken=true;snd.play('item',tv.set(i.x,i.y,i.z));run.items++;if(i.kind==='shard'){P.maxFlasks++;P.flasks++;G.note('Ember Shard · one more Ember Flask','g');}}

/* ================= input ================= */
const I=controls(canvas,{canLock:()=>app==='play',overlay:$('lockmsg'),onLock:(on,was)=>{if(was&&!on&&app==='play'&&!G.noPause)pause(true);},
 onDown:e=>{if(e.button===1){if(app==='play')lockEdge=true;return true;}return false;},
 onWheel:e=>{if(app==='play'&&P.lock){const n=pickTarget(G,P.lock,Math.sign(e.deltaY));if(n)P.lock=n;}},
 onKey:(e,first)=>{if(['Space','Tab','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();if(e.code==='Escape'){if(app==='play')pause(true);else if(app==='paused')pause(false);}
  if(e.code==='Tab'&&app==='play'&&P.lock){const n=pickTarget(G,P.lock,1)||pickTarget(G,P.lock,-1);if(n)P.lock=n;}}});
const {keys,edge,mouse}=I;let lockEdge=false,spaceT=0,spaceUsed=false,flick=0;const padPrev={};
function readInput(dt){const k=c=>!!keys[c],e=c=>!!edge[c];const shift=k('ShiftLeft')||k('ShiftRight');
 const inp={mx:(k('KeyD')?1:0)-(k('KeyA')?1:0),my:(k('KeyW')?1:0)-(k('KeyS')?1:0),light:false,heavy:false,block:false,parry:false,roll:false,sprint:false,flask:e('KeyR'),interact:e('KeyE'),walk:k('AltLeft')};
 // mouse: hold or spam LMB both work (held = keep chaining, the latched press catches clicks shorter than a frame)
 const lmb=mouse.l||mouse.le;mouse.le=false;const rmbE=mouse.re;mouse.re=false;
 if(lmb){if(shift)inp.heavy=true;else inp.light=true;}if(k('KeyC'))inp.heavy=true;
 if(mouse.r&&!shift)inp.block=true;if(rmbE&&shift||e('KeyF'))inp.parry=true;
 // space: tap = roll, hold = sprint
 if(k('Space')){spaceT+=dt;if(spaceT>.28)inp.sprint=true;}else{if(spaceT>0&&spaceT<=.28)inp.roll=true;spaceT=0;}
 if(e('KeyQ')||lockEdge){lockEdge=false;inp.lock=true;}
 // gamepad
 const gp=gamepad();if(gp){const ax=gp.axes,b=i=>!!(gp.buttons[i]&&gp.buttons[i].pressed),be=i=>b(i)&&!padPrev[i];const lx=deadzone(ax[0]||0,.18),ly=deadzone(ax[1]||0,.18);if(lx||ly){inp.mx=lx;inp.my=-ly;}
  const rx=deadzone(ax[2]||0,.15),ry=deadzone(ax[3]||0,.15);if(P.lock){flick+=rx*dt;if(Math.abs(flick)>.25){const n=pickTarget(G,P.lock,Math.sign(flick));if(n)P.lock=n;flick=0;}if(!rx)flick=0;}else{G.cam.yaw-=rx*dt*2.8;G.cam.pitch=cl(G.cam.pitch+ry*dt*1.8,-.6,1.1);}
  if(b(5))inp.light=true;if((gp.buttons[7]?.value||0)>.4)inp.heavy=true;if(b(4))inp.block=true;const lt=(gp.buttons[6]?.value||0)>.4;if(lt&&!padPrev.lt)inp.parry=true;padPrev.lt=lt;
  if(b(1)){padPrev.bT=(padPrev.bT||0)+dt;if(padPrev.bT>.28)inp.sprint=true;}else{if(padPrev.bT>0&&padPrev.bT<=.28)inp.roll=true;padPrev.bT=0;}
  if(be(11))inp.lock=true;if(be(2))inp.flask=true;if(be(0))inp.interact=true;if(be(9))pause(app==='play');for(let i=0;i<16;i++)padPrev[i]=b(i);}
 // camera (mouse)
 if(!P.lock){G.cam.yaw-=mouse.dx*.0024;G.cam.pitch=cl(G.cam.pitch+mouse.dy*.0022,-.6,1.1);}else{flick+=mouse.dx*.002;if(Math.abs(flick)>.6){const n=pickTarget(G,P.lock,Math.sign(flick));if(n)P.lock=n;flick=0;}flick*=.9;}
 mouse.dx=mouse.dy=0;const ak=(k('ArrowLeft')?1:0)-(k('ArrowRight')?1:0);G.cam.yaw+=ak*dt*2.4;
 if(G.scripted)Object.assign(inp,G.scripted);if(G.auto)autopilot(inp,dt);
 I.flush();return inp;}

/* autopilot: drives the hero for tests and the attract demo — fights the nearest foe, rolls through telegraphed blows, drinks when low */
let apT=0,apRoll=0;
function autopilot(inp,dt){let tgt=null,bd=1e9;for(const e of G.foes){if(e.dead||!e.rig.root.visible||e.state==='dormant')continue;const d=e.p.distanceTo(P.p);if(d<bd&&(e.aware||e===G.boss||d<14)){bd=d;tgt=e;}}
 if(G.boss&&!G.boss.dead&&G.boss.state!=='dormant'){tgt=G.boss;bd=G.boss.p.distanceTo(P.p);}
 const goal=G.autoGoal;if(!tgt&&goal){const dx=goal.x-P.p.x,dz=goal.z-P.p.z,d=Math.hypot(dx,dz);if(d>1){const a=Math.atan2(dx,dz);G.cam.yaw=a;inp.my=1;inp.mx=0;}return;}
 if(!tgt)return;if(!P.lock||P.lock!==tgt)P.lock=tgt;const d=bd-tgt.D.r;G.cam.yaw=Math.atan2(tgt.p.x-P.p.x,tgt.p.z-P.p.z);
 apT-=dt;apRoll-=dt;const winding=tgt.state==='atk'&&tgt.mv&&tgt.t<tgt.mv.w*tgt.wk;const tl=winding?tgt.mv.w*tgt.wk-tgt.t:9;
 if(P.hp<P.maxHp*.4&&P.flasks>0&&d>3.5&&!P.act){inp.flask=true;return;}
 if(winding&&tl<.22&&apRoll<=0&&d<(tgt.mv.reach||3)+2){inp.roll=true;apRoll=.7;inp.mx=Math.random()<.5?1:-1;inp.my=-.3;return;}
 if(d>2.2){inp.my=1;inp.mx=0;}else{inp.my=0;inp.mx=Math.sin(G.time*.8)*.6;if(!winding||tl>.6){inp.light=true;if(Math.random()<.04)inp.heavy=true;}}}

/* ================= simulation ================= */
function step(dt){dt=Math.min(dt,.1);if(banT>0){banT-=dt;if(banT<=0)$('banner').classList.remove('on');}if(areaT>0){areaT-=dt;if(areaT<=0)$('area').classList.remove('on');}
 updateLevel(L,dt,G.time+menuT);
 if(app==='menu'){menuT+=dt;menuCam(dt);ambient(dt,true);parts.update(dt);smoke.update(dt);sparks.update(dt);return;}
 if(app==='over'){menuT+=dt;overCam(dt);ambient(dt,true);parts.update(dt);smoke.update(dt);sparks.update(dt);decals.update(dt);return;}
 if(app!=='play')return;
 if(camera.view&&camera.view.enabled)camera.clearViewOffset();
 for(let i=timers.length-1;i>=0;i--){const t=timers[i];t.t-=dt;if(t.t<=0){timers.splice(i,1);t.f();}}if(app!=='play')return;
 const inp=readInput(dt);
 // time scale: hitstop, parry/kill slow-motion
 stopT=Math.max(0,stopT-dt);slowT=Math.max(0,slowT-dt);const ts=stopT>0?.05:slowT>0?.35:1;
 if(inp.lock&&!P.dead)toggleLock(G);
 near=findInteract();if(inp.interact&&near){near.act();}
 // fog traverse
 if(fogWalk){fogWalk.t+=dt;const f=fogWalk.f;P.p.z=fogWalk.sz+Math.min(1,fogWalk.t/1.2)*(f.z+2.2-fogWalk.sz);P.p.x+=(f.x-P.p.x)*Math.min(1,dt*3);P.v.set(0,0,0);P.yaw=0;
  if(fogWalk.t>1.3){const b=fogWalk.b;fogWalk=null;P.act=null;if(b&&!b.dead){f.state='sealed';b.state='intro';b.t=0;b.aware=true;G.boss=b;$('boss').hidden=false;$('bname').textContent=b.D.name;snd.play('roar',b.p);G.shake(.6,b.p);banner(b.D.name,b.boss.title,'ash',2.6);}else f.state='gone';}}
 const n=Math.max(1,Math.ceil(dt/(1/60)));const r=dt/n;
 for(let i=0;i<n;i++){const wdt=r*ts;G.time+=wdt;if(!fogWalk)updatePlayer(G,wdt,inp);inp.roll=inp.flask=inp.parry=false;
  for(const e of G.foes){if(e.gone)continue;const d=Math.abs(e.p.x-P.p.x)+Math.abs(e.p.z-P.p.z);if(d>70&&!e.aware&&e!==G.boss)continue;e.update(wdt);}
  G.proj.update(wdt);G.haz.update(wdt);}
 if(fogWalk){animRig(P.rig,{mode:'move',speed:2.4,t:G.time,guard:P.style,gw:.6},dt);P.rig.root.position.copy(P.p);P.rig.root.rotation.y=0;G.updateCape(P.cape,P.rig,dt);}
 G.foes=G.foes.filter(e=>!(e.summoned&&e.gone));
 for(let i=falling.length-1;i>=0;i--){const f=falling[i];f.t+=dt;f.g.position.y-=dt*30;if(f.g.position.y<f.y0){sparks.burst(f.g.position,10,5,[C(2.4,1.9,1)],.15,.3,{up:true,grav:8});scene.remove(f.g);falling.splice(i,1);}}
 beamOn-=dt;if(beamOn<=0)beamMesh.visible=false;
 decals.update(dt*ts);
 // clock
 if(!run.end&&!run.victory){run.clock-=dt;if(run.clock<=60&&!run.warned){run.warned=true;banner('THE EMBERS GUTTER','One minute remains','red',2.4);}if(run.clock<=0){run.clock=0;endRun('faded');return;}}
 // areas
 let cur=null;for(const z of L.zones)if(P.p.x>z.x0&&P.p.x<z.x1&&P.p.z>z.z0&&P.p.z<z.z1){cur=z;break;}if(cur){G.indoor=!cur.out;if(cur.name!==run.cur){run.cur=cur.name;if(!run.areas.has(cur.name)){run.areas.add(cur.name);if(banT<=0&&!cur.arena)area(cur.name);}}}
 if(run.hintI<HINTS.length&&!G.auto){run.hintT-=dt;if(run.hintT<=0){G.note(HINTS[run.hintI]);run.hintI++;run.hintT=8;}}
 ambient(dt*Math.max(ts,.3),false);parts.update(dt*Math.max(ts,.3));sparks.update(dt*Math.max(ts,.3));smoke.update(dt*Math.max(ts,.3));
 updateCamera(G,dt);hud(dt);
 snd.listener(camera.position.x,camera.position.y,camera.position.z,G.cam.yaw+Math.PI);snd.music(dt,G.boss&&G.boss.state!=='intro'||G.boss&&G.boss.t>1?'boss':'calm',G.boss?G.boss.phase:1);
 let nf=99;for(const t of L.torches){const d=Math.abs(t.x-P.p.x)+Math.abs(t.z-P.p.z);if(d<nf)nf=d;}snd.beds({wind:cur&&cur.out?1:.3,fire:Math.max(0,1-nf/9)});}
const HINTS=['WASD to move · Space taps to roll and holds to sprint','LMB light attack (hold to chain) · Shift+LMB heavy · RMB guard','Q locks on to a foe · R drinks an Ember Flask','Shift+RMB or F to parry a blow that glows, then strike to riposte','Rest at a vigil (E) to restore flasks and set where you return'];

/* ambient: torch fire, embers in the air, dust in the moonbeams, item wisps, shrine flames */
function ambient(dt,menu){const cp=camera.position;
 const list=[];for(const t of L.torches){const d=Math.abs(cp.x-t.x)+Math.abs(cp.z-t.z);if(d<60)list.push([d,t]);}list.sort((a,b)=>a[0]-b[0]);
 const lit=L.shrines.filter(s=>s.lit&&Math.abs(cp.x-s.x)+Math.abs(cp.z-s.z)<50);
 for(let i=0;i<NL;i++){const l=lamps[i];if(i>=gfxLights){l.intensity=0;continue;}const s=lit[i];if(s&&i<2){l.position.set(s.x,s.y+1.4,s.z);l.color.setHex(0xff8030);l.distance=18;l.intensity=(26+Math.sin(G.time*9+i)*3+rnd(3));continue;}
  const e=list[i-(lit.length>2?2:lit.length)];if(e){const t=e[1];l.position.set(t.x,t.y+.2,t.z);l.color.setHex(t.brazier?0xff7a28:0xff9440);l.distance=t.brazier?18:13;l.intensity=(t.brazier?22:12)*(.85+Math.sin(G.time*13+i*1.7)*.08+rnd(.08));}else l.intensity=0;}
 for(const[d,t]of list){if(d>35)break;const k=t.brazier?2.2:1;if(Math.random()<dt*28*k){parts.emit(t.x+rnd(.2*t.s)-.1*t.s,t.y-.05,t.z+rnd(.2*t.s)-.1*t.s,rnd(.3)-.15,.9+rnd(.9),rnd(.3)-.15,2.6,.9,.22,.26*t.s,.45,-1.4,.6);}
  if(Math.random()<dt*3*k)parts.emit(t.x,t.y+.2,t.z,rnd(1)-.5,1.6+rnd(1.6),rnd(1)-.5,3,1.4,.4,.06,1.8,-.3,.4);if(Math.random()<dt*2*k)smoke.emit(t.x,t.y+.5,t.z,rnd(.2)-.1,.8+rnd(.4),rnd(.2)-.1,.15,.13,.12,.5*t.s,2,-.2,.4);}
 for(const s of L.shrines){if(!s.lit||Math.abs(cp.x-s.x)+Math.abs(cp.z-s.z)>60)continue;if(Math.random()<dt*40)parts.emit(s.x+rnd(.6)-.3,s.y+.4,s.z+rnd(.6)-.3,rnd(.4)-.2,1.2+rnd(1.2),rnd(.4)-.2,2.8,1,.25,.42,.6,-1.2,.5);if(Math.random()<dt*6)parts.emit(s.x,s.y+.8,s.z,rnd(1.2)-.6,1.5+rnd(2),rnd(1.2)-.6,3,1.5,.5,.08,2.2,-.25,.3);}
 for(const s of L.shrines){if(s.lit||!s.usable)continue;if(Math.random()<dt*8)parts.emit(s.x+rnd(1)-.5,s.y+.3,s.z+rnd(1)-.5,0,.4,0,1.2,.5,.15,.2,1.2,-.2,.4);}
 for(const i of L.items){if(i.taken||Math.abs(cp.x-i.x)+Math.abs(cp.z-i.z)>50)continue;if(Math.random()<dt*20)parts.emit(i.x+rnd(.3)-.15,i.y+.5+Math.sin(G.time*3)*.1,i.z+rnd(.3)-.15,rnd(.4)-.2,.5+rnd(.6),rnd(.4)-.2,2.2,1.9,1.2,.16,.8,-.2,.5);}
 // floating embers and ash around the camera
 if(Math.random()<dt*(gfx?26:10)){const a=rnd(6.28),d=2+rnd(16);parts.emit(cp.x+Math.cos(a)*d,cp.y-2+rnd(6),cp.z+Math.sin(a)*d,rnd(.4)-.2,.2+rnd(.4),rnd(.4)-.2,2.4,.8,.2,.05+rnd(.05),4+rnd(3),-.04,.15);}
 if(Math.random()<dt*(gfx?18:6)){const a=rnd(6.28),d=2+rnd(12);smoke.emit(cp.x+Math.cos(a)*d,cp.y-1+rnd(5),cp.z+Math.sin(a)*d,rnd(.3)-.15,-.15,rnd(.3)-.15,.5,.5,.52,.04,5,0,.1);}
 // dust motes in the moonbeams
 if(gfx&&Math.random()<dt*14){const s=L.shafts[Math.random()*L.shafts.length|0];if(s&&Math.abs(s.position.x-cp.x)+Math.abs(s.position.z-cp.z)<40){const k=rnd(1),dir=tv.set(0,-1,0).applyQuaternion(s.quaternion);const len=s.geometry.boundingSphere?s.geometry.boundingSphere.radius*2:10;parts.emit(s.position.x+dir.x*k*len+rnd(1)-.5,s.position.y+dir.y*k*len,s.position.z+dir.z*k*len+rnd(1)-.5,rnd(.1)-.05,-.05,rnd(.1)-.05,.9,1,1.3,.05,3,0,.1);}}}

/* ================= menu & results cameras ================= */
function menuPose(){const s=L.shrines[0];P.p.set(s.x+.4,s.y,s.z-2);P.yaw=.15;P.dead=false;P.act=null;P.rig.root.visible=true;equip(G,opt.style);}
function menuCam(dt){const s=L.shrines[0];const a=menuT*.05;camera.position.set(s.x+3.4+Math.sin(a)*1,s.y+2.9+Math.sin(a*.7)*.2,s.z-5.6);camera.lookAt(s.x-.2,s.y+.9,s.z+.4);camera.fov=50;camera.setViewOffset(1,1,-.3,.02,1,1);
 animRig(P.rig,{mode:'rest',speed:0,t:menuT,guard:null},dt);P.rig.root.position.copy(P.p);P.rig.root.rotation.y=P.yaw;G.updateCape(P.cape,P.rig,dt);
 const torchList=L.torches;L.shrines[0].lit=true;for(let i=0;i<NL;i++)lamps[i].intensity=lamps[i].intensity;}
function overCam(dt){camera.clearViewOffset();const a=menuT*.05;const c=run&&run.victory?{x:0,y:5.2,z:318}:{x:P.p.x,y:P.p.y,z:P.p.z};const rr=run&&run.victory?26:9;camera.position.set(c.x+Math.cos(a)*rr,c.y+(run&&run.victory?9:4),c.z+Math.sin(a)*rr);camera.lookAt(c.x,c.y+1.5,c.z);camera.fov=55;camera.updateProjectionMatrix();}

/* ================= HUD ================= */
const hc={};const setT=(el,v,k)=>{if(hc[k]!==v){hc[k]=v;el.textContent=v;}};const setW=(el,v,k)=>{if(hc[k]!==v){hc[k]=v;el.style.width=v;}};
const markPool=[];function mark(i){if(!markPool[i]){const d=document.createElement('div');d.className='mk';$('marks').appendChild(d);markPool[i]=d;}return markPool[i];}
function hud(dt){const W=innerWidth,H=innerHeight;
 if(hc.mw!==P.maxHp){hc.mw=P.maxHp;document.querySelector('.bar.hp').style.setProperty('--w',Math.round(P.maxHp*.62)+'px');}
 setW($('hpF'),(P.hp/P.maxHp*100).toFixed(1)+'%','hp');setW($('hpL'),(P.hp/P.maxHp*100).toFixed(1)+'%','hpl');setW($('stF'),(Math.max(0,P.st)/P.stMax*100).toFixed(1)+'%','st');document.querySelector('.bar.st').classList.toggle('low',P.st<25);
 setT($('flN'),String(P.flasks),'fl');$('flask').classList.toggle('empty',P.flasks<=0);
 setT($('clk'),fmt(run.clock),'ck');$('clock').classList.toggle('low',run.clock<60);
 setT($('cin'),liveScore().toLocaleString(),'cn');
 // prompt
 const pt=near?`<kbd>E</kbd>${near.label}`:'';if(hc.pt!==pt){hc.pt=pt;$('prompt').innerHTML=pt;$('prompt').classList.toggle('on',!!pt);}
 // lock reticle
 const lr=$('lockr');if(P.lock){tv.set(P.lock.p.x,P.lock.p.y+P.lock.D.bodyY,P.lock.p.z).project(camera);lr.style.left=(tv.x*.5+.5)*W+'px';lr.style.top=(-tv.y*.5+.5)*H+'px';lr.classList.add('on');}else lr.classList.remove('on');
 // foe health bars (regular foes, once hurt)
 let mi=0;for(const e of G.foes){if(e.dead||e.D.boss||!e.rig.root.visible||mi>=10)continue;if(e.hp>=e.maxHp&&e!==P.lock)continue;const d=e.p.distanceTo(P.p);if(d>22)continue;
  tv.set(e.p.x,e.p.y+e.D.headY+.35,e.p.z).project(camera);if(tv.z>1||Math.abs(tv.x)>1.1||Math.abs(tv.y)>1.1)continue;const m=mark(mi++);m.style.display='';m.style.left=(tv.x*.5+.5)*W+'px';m.style.top=(-tv.y*.5+.5)*H+'px';
  const dm=e.dmgT>G.time?e.dmgAcc:0;const key=Math.round(e.hp/e.maxHp*70)+'|'+dm;if(m._k!==key){m._k=key;m.innerHTML=`<div class="hp"><i style="width:${Math.max(0,e.hp/e.maxHp*100)}%"></i></div>${dm?`<span class="dm">${dm}</span>`:''}`;}}
 for(let i=mi;i<markPool.length;i++)markPool[i].style.display='none';
 // boss
 if(G.boss){const e=G.boss;const f=Math.max(0,e.hp/e.maxHp*100).toFixed(1)+'%';setW($('bhp'),f,'bh');setW($('bhpL'),f,'bhl');setW($('bpo'),Math.min(100,e.post/e.D.poise*100).toFixed(0)+'%','bpo');setT($('bdmg'),e.dmgT>G.time?String(e.dmgAcc):'','bd');}
 vignA=Math.max(0,vignA-dt*1.4);$('vign').style.opacity=(vignA+(P.hp<P.maxHp*.25&&!P.dead?.3+Math.sin(G.time*5)*.1:0)).toFixed(2);flashA=Math.max(0,flashA-dt*2.5);$('flash').style.opacity=flashA.toFixed(2);}
function liveScore(){return Math.max(0,Math.round((run.killScore+P.stats.parries*60+P.stats.ripostes*80+P.stats.backstabs*60+run.items*150-run.deaths*250)*G.dm.mult));}

/* ================= end of run ================= */
function breakdown(){const t=[['Great foes felled',run.bosses+'/4',run.felled.length?0:0],['Foes slain',String(run.kills-run.bosses),0],['Cinders (foes & great foes)','',run.killScore],['Parries · ripostes · backstabs',`${P.stats.parries} · ${P.stats.ripostes} · ${P.stats.backstabs}`,P.stats.parries*60+P.stats.ripostes*80+P.stats.backstabs*60],['Ember Shards',run.items+'/3',run.items*150],['Deaths',String(run.deaths),-run.deaths*250]];
 if(run.victory)t.push(['Victory','The Ashen King falls',3000],['Embers to spare',fmt(run.clock),Math.round(run.clock)*5]);return t;}
function grade(){if(run.victory)return run.deaths===0?'S':run.deaths<=3?'A':'B';return run.bosses>=3?'B':run.bosses>=2?'C':run.bosses>=1?'D':'E';}
function endRun(reason){if(run.end)return;run.end=true;const rows=breakdown();let total=Math.max(0,rows.reduce((s,r)=>s+r[2],0));total=Math.round(total*G.dm.mult);run.score=total;run.grade=grade();
 app='over';hideAll();$('hud').hidden=true;document.body.classList.remove('playing');I.unlock();$('banner').classList.remove('on');
 const won=reason==='victory';run.timeUsed=run.len-run.clock;
 $('oeye').textContent=(won?'THE ASH IS STILLED':reason==='faded'?'THE LAST EMBERS FADED':'THE VIGIL WAS ABANDONED')+' · '+fmt(run.timeUsed)+' · '+STYLES[opt.style].name+' · '+G.dm.n;
 $('ores').textContent=won?'VICTORY':'EMBERS FADED';$('ores').style.color=won?'#e8c47a':'#c03a28';$('ogr').textContent=run.grade;$('ofs').textContent=total.toLocaleString()+' PTS';
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]?(r[2]>0?'+':'')+r[2].toLocaleString():''}</td></tr>`).join('')+`<tr><td>Time</td><td>${fmt(run.timeUsed)} of ${fmt(run.len)}</td><td>×${G.dm.mult} ${G.dm.n}</td></tr>`;
 const tok=5+Math.min(60,total/400|0);lastAward={pts:total,won,grade:run.grade,bosses:run.bosses,deaths:run.deaths,parries:P.stats.parries,time:fmt(run.timeUsed),diff:G.dm.n.toLowerCase(),style:STYLES[opt.style].name.toLowerCase()};addRound(tok,won);saveBest(ID,total);
 $('otok').textContent=`+${tok} TOKENS · BEST ${bestScore(ID).toLocaleString()} PTS`;$('over').hidden=false;menuT=0;snd.music(0,'none');}

/* ================= rendering ================= */
const POST={exposure:1.15,bloom:.62,bloomThreshold:.78,bloomRadius:.55,vignette:.42,saturation:1.05,grain:.035,aoStrength:.8,tint:0xfff0e0};
let fx=null,gfx=quality(),gfxLights=NL;
function applyQuality(q){gfx=q;moon.castShadow=q>0;moon.shadow.mapSize.set(q>=2?2048:1024,q>=2?2048:1024);if(moon.shadow.map){moon.shadow.map.dispose();moon.shadow.map=null;}R.setPixelRatio(Math.min(devicePixelRatio,[1,1,1.25][q]));
 gfxLights=q===0?4:NL;L.fogPlanes.forEach((m,i)=>m.visible=q>0||i%2===0);parts.n=parts.n;fx=null;}
function getFx(){if(!fx){fx=cinematic(R,scene,camera,{...POST,quality:gfx});fx.w=0;if(fx.ao){const ov=fx.ao.overrideVisibility.bind(fx.ao);fx.ao.overrideVisibility=function(){ov();for(const m of[...L.shafts,...L.fogPlanes,L.sky,beamMesh])m.visible=false;};}}
 const w=innerWidth,h=innerHeight;if(fx.w!==w*9999+h){fx.w=w*9999+h;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();fx.setSize(w,h);}return fx;}
function render(){const f=getFx();const cp=camera.position;
 for(const e of G.foes){if(e.gone)continue;const d=Math.abs(e.p.x-cp.x)+Math.abs(e.p.z-cp.z);e.rig.root.visible=d<(e.D.boss?140:80);if(e.cape)e.cape.mesh.visible=e.rig.root.visible;}
 parts.U.uScale.value=sparks.U.uScale.value=smoke.U.uScale.value=innerHeight*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));
 // moon shadow box follows the action (texel-snapped)
 const fp=app==='play'?P.p:cp;const snap=64/moon.shadow.mapSize.x;const tx=Math.round(fp.x/snap)*snap,tz=Math.round(fp.z/snap)*snap;moon.target.position.set(tx,fp.y,tz);moon.position.copy(moon.target.position).addScaledVector(MOON,120);
 fill.position.set(P.p.x,P.p.y+2.4,P.p.z);fill.intensity=app==='play'?(G.indoor?5:3.5):4;
 L.sky.material.uniforms.uRed.value+=(((G.boss&&G.boss.kind==='king')||(app==='play'&&P.p.z>292)?1:0)-L.sky.material.uniforms.uRed.value)*.02;
 f.render();}
addEventListener('resize',()=>{if(fx)fx.w=0;});
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));

/* ================= menu wiring ================= */
const seg=pickers(opt,saveOpt);seg('o-diff','diff');seg('o-len','len');seg('o-style','style',false,()=>{if(app==='menu')menuPose();snd.init();snd.play('ui');});
$('go').onclick=()=>start();$('again').onclick=()=>start();$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{if(run&&!run.end){endRun('abandon');}else toMenu();};
postButton($('post'),ID,()=>{const a=lastAward||{};return[a.pts||0,`Game: Ashen Vigil\nPoints: ${a.pts||0}\nResult: ${a.won?'victory':'embers faded'} · grade ${a.grade||'-'} · ${a.time||''}\nGreat foes felled: ${a.bosses||0}/4 · Deaths: ${a.deaths||0} · Parries: ${a.parries||0}\nStyle: ${a.style||''} · Foes: ${a.diff||''}`];});

/* ================= loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.ASHEN={R,G,P,L,scene,camera,step,render,start,toMenu,pause,endRun,
 get state(){return app;},get app(){return app;},get run(){return run;},get score(){return run?(run.end?run.score:liveScore()):0;},get player(){return P;},get foes(){return G.foes;},get bosses(){return G.bosses;},get boss(){return G.boss;},
 setClock(s){if(run)run.clock=s;},noPause(v=true){G.noPause=v;},input(o){G.scripted=o;},auto(on=true,goal){G.auto=on;G.autoGoal=goal||null;},
 teleport(x,z,y){P.p.set(x,y??phys.ground(x,30,z,.3,60).h,z);P.v.set(0,0,0);G.cam.snap=true;},
 face(yaw,pitch){G.cam.yaw=yaw;P.yaw=yaw;if(pitch!==undefined)G.cam.pitch=pitch;},
 enterBoss(i){const b=G.bosses[i];const f=b.boss.fog;P.p.set(f.x,f.y,f.z-1.2);P.v.set(0,0,0);enterFog(f);},
 kill(e){if(e&&!e.dead){e.hp=1;G.damageFoe(e,999999,{poise:0,dir:new V(0,0,1),crit:false});}},
 killBoss(i){const b=G.bosses[i];if(!b.dead){if(b.state==='dormant'){b.state='engage';b.aware=true;}G.damageFoe(b,999999,{poise:0,dir:new V(0,0,1)});}},
 hurt(d){return hurtPlayer(G,d,null,{kind:'aoe',from:P.p.clone().add(new V(0,0,1))});},
 rest(i){rest(L.shrines[i]);},pull(i){pull(L.levers[i]);},
 setQuality:applyQuality,get quality(){return gfx;},breakdown,STYLES,FOES};
