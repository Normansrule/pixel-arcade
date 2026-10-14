// DROPZONE — 40-operator first-person battle royale over the port city of Halvard. Original game for Pixel Arcade.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {Pass} from '../vendor/jsm/postprocessing/Pass.js';
import {addRound,bestScore,saveBest,userName} from '../js/kit3d/score.js';
import {controls,gamepad,deadzone} from '../js/kit3d/input.js';
import {stored,pickers,postButton} from '../js/kit3d/ui.js';
import {makeTextures,makeSprites,makeKit as kitTex} from './tex.js';
import {Nav,LAND,NH} from './world.js';
import {makeMats,buildMap,GULAG} from './map.js';
import {buildGround,buildSea,buildSky,buildGas,buildProps,makePlane,makeChute,makeCrate,makeRover} from './env.js';
import {RAR,WPN,AMMO,makeGun,wstats,gunName,lootGunGeo,Viewmodel} from './weapons.js';
import {makeKit,Rig,hitActor,makeImpostors} from './actors.js';
import {DIFF,SKIRM,newBrain,thinkBot,hearShot,botHurt,wantsItem,driveBot} from './ai.js';
import {FX} from './fx.js';
import {Sound} from './sound.js';
import {HUD,mmss} from './hud.js';

const $=id=>document.getElementById(id),V=THREE.Vector3,cl=(v,a,b)=>v<a?a:v>b?b:v,R=Math.random,TAU=Math.PI*2,D2R=Math.PI/180,rr=(a,b)=>a+R()*(b-a),pick=a=>a[R()*a.length|0];
const EYE=1.62,CEYE=1.12,PH=1.8,PR=.32,MATCH=720,NACT=40,PLANE_Y=290,PLANE_V=38,CHUTE_AUTO=62,ID='dropzone';
// gas: wait, shrink (s), next radius, damage per second outside
const PHASES=[{w:95,s:60,r:250,dps:2},{w:50,s:45,r:165,dps:4},{w:40,s:40,r:105,dps:6},{w:35,s:35,r:62,dps:9},{w:28,s:30,r:32,dps:12},{w:20,s:28,r:11,dps:16},{w:14,s:24,r:0,dps:22}];
const NAMES=['VANDAL','KESTREL','MAKO','ROOK','HOLLIS','GRIT','WRAITH','TALLY','BRASK','ODIN-7','SABLE','JUNO','HAWSER','KILN','MARLOW','DUSK','CRANE','VOSS','PIKE','RENEGADE','ASH','FENWICK','LOTUS','QUILL','STRAND','BOLT','HALCYON','ORRIN','TEMPEST','NADIR','SKIFF','CINDER','VALE','BRIGGS','MONK','RAZE','IBIS','HARROW','KODA'];
const KITS=[['#585c48',['#3a3e2c','#7a7458','#2a2a22'],0x5a5e4a],['#9a8a6a',['#7a6a4a','#b8a888','#5a4a32'],0x9a8a6a],['#6a6e72',['#4a4e52','#8a8e92','#2e3236'],0x6a6e72],['#2e3034',['#1e2024','#44484e','#3a3a3e'],0x34363a],['#4a5a6a',['#34404e','#6a7a8a','#2a3440'],0x4a5a6a],['#6a5a4a',['#4a3e32','#8a7a64','#2e2620'],0x6a5a4a]];
const CHUTEC=[0xd8402a,0x2a6ad8,0xe8c020,0x30a050,0xe8e8e8,0x8a3ad0,0xe07020,0x202428];
const OPT={diff:1,sens:1},saveOpt=stored('dropzone_opt',OPT);

/* ================= renderer + scenes ================= */
const canvas=$('c');const Rr=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});Rr.setPixelRatio(Math.min(devicePixelRatio,1.5));
Rr.shadowMap.enabled=true;Rr.shadowMap.type=THREE.PCFSoftShadowMap;Rr.shadowMap.autoUpdate=false;
const FOG=new THREE.Color(0xc6c3b6);const scene=new THREE.Scene();scene.fog=new THREE.FogExp2(FOG,.0021);scene.background=FOG.clone();
const cam=new THREE.PerspectiveCamera(70,1,.05,2600);cam.rotation.order='YXZ';scene.add(cam);
const vmScene=new THREE.Scene(),vmCam=new THREE.PerspectiveCamera(58,1,.01,10);vmScene.add(vmCam);
vmScene.add(new THREE.HemisphereLight(0xd0d4d8,0x50483e,1.6));const vmKey=new THREE.DirectionalLight(0xfff0e0,2.2);vmKey.position.set(-1,2,1);vmScene.add(vmKey);

/* ================= world ================= */
const T=makeTextures(),SPR=makeSprites(),MATS=makeMats(T);const MAP=buildMap(MATS);scene.add(MAP.group);const W=MAP.W;const nav=new Nav(W,MAP.navBlock);
// rover nav: the walker grid with walls grown by one more cell, so paths keep a rover's half-width clear (search buffers shared, stamps own)
const cnav=Object.assign(Object.create(Nav.prototype),nav,{blk:new Uint8Array(nav.blk.length),stamp:new Uint32Array(nav.blk.length),cstamp:new Uint32Array(nav.blk.length),gen:1});{const N=nav.N,b=nav.blk;for(let j=0;j<N;j++)for(let k=0;k<N;k++){if(!b[j*N+k])continue;for(let dj=-1;dj<=1;dj++)for(let dk=-1;dk<=1;dk++){const y=j+dj,x=k+dk;if(x>=0&&y>=0&&x<N&&y<N)cnav.blk[y*N+x]=1;}}
 // thin posts fall between walker cells: rasterise every wall box again at rover radius
 const B=W.B,r=1.9;for(let i=0;i<W.n;i++){if(!(W.F[i]&1))continue;const o=i*6;if(B[o+1]>1.7||B[o+4]<.45)continue;for(let j=Math.max(0,Math.floor(B[o+2]-r+NH));j<=Math.min(N-1,Math.floor(B[o+5]+r+NH));j++)for(let k=Math.max(0,Math.floor(B[o]-r+NH));k<=Math.min(N-1,Math.floor(B[o+3]+r+NH));k++){const x=k-NH+.5,z=j-NH+.5;if(x>B[o]-r&&x<B[o+3]+r&&z>B[o+2]-r&&z<B[o+5]+r)cnav.blk[j*N+k]=1;}}}
scene.add(buildGround(T,MAP));const sea=buildSea(T);scene.add(sea.mesh);const sky=buildSky();scene.add(sky.mesh);scene.add(buildProps(MAP,T));const gasV=buildGas(scene);
const sunDir=new V(.42,.62,.36).normalize();
const hemi=new THREE.HemisphereLight(0xc4ccd4,0x6a5e4c,1.05);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.1);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);sun.shadow.bias=-.0004;sun.shadow.normalBias=.04;Object.assign(sun.shadow.camera,{near:1,far:600});scene.add(sun,sun.target);
{const U=sky.U;U.uTop.value.set(0x4f7db4);U.uHor.value.set(0xd8d2c2);U.uFog.value.copy(FOG);U.uSun.value.copy(sunDir);U.uSunC.value.set(0xfff0d0);U.uCloud.value=.5;sea.U.uSky.value.set(0xb8c4c8);sea.U.uSun.value.copy(sunDir);}
const pmrem=new THREE.PMREMGenerator(Rr);{const es=new THREE.Scene();es.add(new THREE.Mesh(sky.mesh.geometry,sky.mesh.material));try{const rt=pmrem.fromScene(es,0,.1,2000);scene.environment=rt.texture;vmScene.environment=rt.texture;}catch(e){}}
const fx=new FX(scene,SPR),snd=new Sound(),VM=new Viewmodel(SPR.flash);vmCam.add(VM.root);const hud=new HUD(MAP);
makeKit({kits:KITS.map((k,i)=>kitTex(k[0],k[1],i+1)),flash:SPR.flash});
const IMP=makeImpostors(NACT);scene.add(IMP.mesh);
const plane=makePlane();scene.add(plane);plane.visible=false;

/* ================= state ================= */
const G={log:[],app:'menu',time:0,diff:DIFF[OPT.diff],actors:[],W,nav,cnav,stats:{rover:{enter:0,riders:[],dist:0,stuck:0,crash:0,claim:0,exit:{},rk:0}},pathBudget:3,gas:null,loot:[],crates:[],depots:MAP.depots,drops:[],cars:[],plane:null,planeT:0,remaining:NACT,uavT:0,gulagQ:[],duel:null,feed:[],matchLeft:MATCH,phase:0,zone:''};
let P=null;let shake=0,mapOpen=false,buyOpen=false,interactT=null,menuT=0,lastAward=null,deathT=0,resultT=-1;
const tv=new V(),tv2=new V(),tv3=new V(),HIT={t:0,i:-1,nx:0,ny:0,nz:0,mat:0};

/* ================= actors ================= */
function mkActor(i){const seed=(i*0.6180339+.137)%1;const a={id:i,isPlayer:i===0,name:i?NAMES[i-1]:(userName()||'YOU').toUpperCase().slice(0,12),pos:new V(),vel:new V(),yaw:0,pitch:0,state:'plane',alive:true,out:false,hp:100,armor:0,plates:0,plateT:0,cash:0,
  guns:[null,null],cur:0,ammo:{light:0,rifle:0,shell:0},reloadT:0,fireT:0,kills:0,dmg:0,in:{mx:0,mz:0,fire:false,jump:false,sprint:false},ai:null,crouchV:0,crouch:0,onGround:false,speed:0,inGulag:false,gulagUsed:false,deadT:0,place:0,hurtT:-99,range:120,loud:120,aimErr:3,seed};
 a.kitI=(seed*977|0)%KITS.length;if(!a.isPlayer){a.rig=new Rig('op',seed);a.rig.root.rotation.order='YXZ';a.rig.root.visible=false;scene.add(a.rig.root);}
 a.chute=makeChute(CHUTEC[i%CHUTEC.length]);if(a.isPlayer)a.chute.children[1].visible=false;scene.add(a.chute);return a;}
for(let i=0;i<NACT;i++)G.actors.push(mkActor(i));P=G.actors[0];
const remaining=()=>G.actors.reduce((n,a)=>n+(a.out?0:1),0);
const eyeH=a=>a.isPlayer?EYE-(EYE-CEYE)*a.crouchV:1.55;
const fwdOf=(yaw,pitch,out)=>out.set(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),Math.cos(yaw)*Math.cos(pitch));
const gunOf=a=>a.guns[a.cur];

/* ================= loot ================= */
const lootG=new THREE.Group();scene.add(lootG);
const LBOX=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshStandardMaterial({roughness:.6,metalness:.25}),1800);LBOX.count=0;LBOX.frustumCulled=false;LBOX.castShadow=true;lootG.add(LBOX);
const BEAMG=new THREE.CylinderGeometry(.035,.07,1,6,1,true).translate(0,.5,0);{const p=BEAMG.attributes.position,c=[];for(let i=0;i<p.count;i++){const k=p.getY(i)>.5?0:1;c.push(k,k,k);}BEAMG.setAttribute('color',new THREE.Float32BufferAttribute(c,3));}
const BEAM=new THREE.InstancedMesh(BEAMG,new THREE.MeshBasicMaterial({vertexColors:true,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false}),1800);BEAM.count=0;BEAM.frustumCulled=false;lootG.add(BEAM);
LBOX.setColorAt(0,new THREE.Color());BEAM.setColorAt(0,new THREE.Color());
let lootDirty=true;const M4=new THREE.Matrix4(),Q=new THREE.Quaternion(),SC=new V(),CO=new THREE.Color(),YAX=new V(0,1,0);
const LK={ammo:{light:[.32,.18,.22,0xc8a040],rifle:[.36,.2,.24,0x6a7a3a],shell:[.3,.18,.2,0xb03a2a]},plates:[.3,.05,.4,0x58626c],cash:[.24,.08,.13,0x3aa04a]};
function rollRar(b=0){const x=Math.min(.999,R()+b);return x<.42?0:x<.7?1:x<.87?2:x<.965?3:4;}
function rollGun(b=0){return makeGun(pick(['vx9','vx9','ark','ark','ark','hrn','stk','stk','p9']),rollRar(b));}
function rollItem(b=0){const x=R();if(x<.42)return rollGun(b);if(x<.64){const t=pick(['light','light','rifle','rifle','shell']);return{kind:'ammo',t,n:t==='shell'?12:60};}if(x<.82)return{kind:'plates',n:1+(R()<.3?1:0)};return{kind:'cash',n:(2+R()*10|0)*100+(b>.1?300:0)};}
function addLoot(it,x,y,z,lvl=0){const l={it,p:new V(x,y,z),lvl,settled:true,mesh:null,yaw:R()*TAU};if(it.kind==='gun'){const g=lootGunGeo(it);const m=new THREE.Mesh(g.g,g.m);m.position.set(x,y+.07,z);m.rotation.set(0,l.yaw,Math.PI/2);m.castShadow=true;m.visible=false;lootG.add(m);l.mesh=m;}G.loot.push(l);lootDirty=true;return l;}
function removeLoot(l){const i=G.loot.indexOf(l);if(i>=0)G.loot.splice(i,1);if(l.mesh){lootG.remove(l.mesh);}lootDirty=true;}
function scatter(items,x,y,z,r=1.1){items.forEach((it,k)=>{const a=k/items.length*TAU+R(),d=.4+R()*r;const px=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;const gy=W.groundAt(px,pz,y+.6,.05);addLoot(it,px,gy+.02,pz,gy>1.2?1:0);});}
function beams(){let b=0;const cx=cam.position.x,cz=cam.position.z;for(const l of G.loot){const it=l.it;if(it.kind!=='gun'||it.r<1)continue;const dx=l.p.x-cx,dz=l.p.z-cz,d2=dx*dx+dz*dz;if(d2<16||d2>200*200||b>=BEAM.instanceMatrix.count)continue;const w=1+Math.min(2.5,Math.sqrt(d2)/40);M4.compose(tv.set(l.p.x,l.p.y,l.p.z),Q.identity(),SC.set(w,it.r>=3?2.6:1.8,w));BEAM.setMatrixAt(b,M4);BEAM.setColorAt(b,CO.set(RAR[it.r].h));b++;}
 BEAM.count=b;BEAM.instanceMatrix.needsUpdate=true;if(BEAM.instanceColor)BEAM.instanceColor.needsUpdate=true;}
function rebuildLoot(){let n=0;for(const l of G.loot){const it=l.it;if(it.kind==='gun')continue;
  const d=it.kind==='ammo'?LK.ammo[it.t]:LK[it.kind];Q.setFromAxisAngle(YAX,l.yaw);M4.compose(tv.set(l.p.x,l.p.y+d[1]/2,l.p.z),Q,SC.set(d[0],d[1],d[2]));LBOX.setMatrixAt(n,M4);LBOX.setColorAt(n,CO.set(d[3]));n++;}
 LBOX.count=n;LBOX.instanceMatrix.needsUpdate=true;if(LBOX.instanceColor)LBOX.instanceColor.needsUpdate=true;lootDirty=false;beams();}

/* ---- supply boxes: one instanced body + one instanced lid ---- */
function bake(g,only,skip){g.updateMatrixWorld(true);const Pp=[],N=[],C=[];const v=new V(),nm=new THREE.Matrix3();g.traverse(o=>{if(!o.isMesh||(only&&o!==only)||o===skip)return;const geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry;nm.getNormalMatrix(o.matrixWorld);const c=o.material.color.clone();if(o.material.emissive)c.add(o.material.emissive);
  const p=geo.attributes.position,n=geo.attributes.normal;for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(o.matrixWorld);Pp.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);C.push(c.r,c.g,c.b);}});
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(Pp,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));geo.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return geo;}
const crateProto=makeCrate();const CMAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.6,metalness:.25});
const CBODY=new THREE.InstancedMesh(bake(crateProto,null,crateProto.userData.lid),CMAT,MAP.crates.length),CLID=new THREE.InstancedMesh(bake(crateProto,crateProto.userData.lid),CMAT,MAP.crates.length);CBODY.castShadow=CLID.castShadow=true;scene.add(CBODY,CLID);
G.crates=MAP.crates.map((c,i)=>({x:c.x,y:c.y,z:c.z,q:c.q,i,opened:false,lvl:c.y>1?1:0,r:((c.x*7+c.z*13)|0)%4*Math.PI/2}));
function crateMat(c){Q.setFromAxisAngle(YAX,c.r);M4.compose(tv.set(c.x,c.y,c.z),Q,SC.set(.9,.9,.9));CBODY.setMatrixAt(c.i,M4);
 if(c.opened){const lq=new THREE.Quaternion().setFromAxisAngle(new V(1,0,0),-1.1);const lm=new THREE.Matrix4().compose(new V(0,.55,-.55),lq,new V(1,1,1));M4.multiply(lm);}CLID.setMatrixAt(c.i,M4);CBODY.instanceMatrix.needsUpdate=CLID.instanceMatrix.needsUpdate=true;}
function openCrate(a,c){if(c.opened)return;c.opened=true;crateMat(c);const items=[rollGun(.25+(c.q?.1:0)),{kind:'cash',n:(4+R()*12|0)*100},R()<.6?{kind:'plates',n:2}:{kind:'ammo',t:pick(['light','rifle','shell']),n:60}];if(R()<.5)items.push({kind:'ammo',t:pick(['light','rifle']),n:60});
 scatter(items,c.x,c.y,c.z,1);if(a===P){snd.pick();hud.note('SUPPLY BOX OPENED','q');}}

/* ---- vehicles ---- */
G.cars=MAP.vehicles.map(v=>{const g=makeRover();scene.add(g);return{g,home:v,pos:new V(),vel:new V(),yaw:0,v:0,steer:0,hp:500,dead:false,driver:null,onG:true,smokeT:0};});
function resetCars(){for(const c of G.cars){c.pos.set(c.home.x,0,c.home.z);c.yaw=c.home.r||0;c.v=0;c.hp=500;c.dead=false;c.driver=null;c.vel.set(0,0,0);c.g.traverse(o=>{if(o.isMesh&&o.material.color&&o.userData.c0===undefined)o.userData.c0=o.material.color.getHex();if(o.isMesh&&o.userData.c0!==undefined)o.material.color.setHex(o.userData.c0);});placeCar(c);}}
function placeCar(c){c.g.position.copy(c.pos);c.g.rotation.y=c.yaw;}
// ray vs rover box in its local frame
function rayCar(c,o,d,maxT){const s=Math.sin(-c.yaw),co=Math.cos(-c.yaw);const ox=o.x-c.pos.x,oz=o.z-c.pos.z,oy=o.y-c.pos.y;const lx=ox*co+oz*s,lz=-ox*s+oz*co,dx=d.x*co+d.z*s,dz=-d.x*s+d.z*co;
 let tn=-1e9,tf=1e9;for(const[p,q,mn,mx]of[[lx,dx,-1.1,1.1],[oy,d.y,.35,2.3],[lz,dz,-2.4,2.4]]){if(Math.abs(q)<1e-9){if(p<mn||p>mx)return Infinity;continue;}let a=(mn-p)/q,b=(mx-p)/q;if(a>b)[a,b]=[b,a];tn=Math.max(tn,a);tf=Math.min(tf,b);}
 return tn<=tf&&tn>0&&tn<maxT?tn:Infinity;}
function hurtCar(c,dmg,src){if(c.dead)return;c.hp-=dmg;if(c.driver)damage(c.driver,dmg*.3,src,'body',null,'car');if(c.hp<=0){c.dead=true;c.v=0;fx.boom(c.pos);snd.impact(1,c.pos);snd.shot('stk',c.pos,false);c.g.traverse(o=>{if(o.isMesh)o.material.color.setHex(0x1a1a1a);});const d=c.driver;if(d){exitCar(d);damage(d,65,src,'body',null,'boom');}}}
function enterCar(a,c){a.car=c;c.driver=a;a.reloadT=0;a.plateT=0;c.claim=null;if(a.ai){a.ai.dv=null;a.ai.path=null;a.ai.goalKind='';a.ai.goal=null;a.ai.goalRef=null;a.in.fire=false;a.in.mx=a.in.mz=0;if(!a.isPlayer||G.autopilot){const S=G.stats.rover;S.enter++;S.riders.push(a.name);}}if(a===P){snd.click();hud.note('ROVER · W/S DRIVE · A/D STEER · E EXIT','q');}}
function exitCar(a){const c=a.car;if(!c)return;c.driver=null;a.car=null;const sx=-Math.cos(c.yaw),sz=Math.sin(c.yaw);for(const s of[1,-1,0]){const px=c.pos.x+sx*2.2*s+(s?0:Math.sin(c.yaw)*3.4),pz=c.pos.z+sz*2.2*s+(s?0:Math.cos(c.yaw)*3.4);a.pos.set(px,W.groundAt(px,pz,c.pos.y+2,.3),pz);if(nav.free(px,pz)||W.groundAt(px,pz,c.pos.y+2,.3)<c.pos.y+1)break;}a.vel.set(0,0,0);a.onGround=true;if(a.ai){a.ai.dv=null;a.ai.carCD=G.time+30;a.ai.path=null;a.ai.goalKind='';a.ai.goal=null;}if(a===P)snd.click();}
function carTick(c,dt){if(c.dead){if((c.smokeT-=dt)<=0){c.smokeT=.15;fx.smokeCol(tv.set(c.pos.x,c.pos.y+1.8,c.pos.z),[.12,.12,.12],1);}return;}
 const d=c.driver;let thr=0,st=0,bo=null;if(d===P&&!G.autopilot&&G.app==='match'){thr=(keys.KeyW?1:0)-(keys.KeyS?1:0);st=(keys.KeyA?1:0)-(keys.KeyD?1:0);if(G.pad){thr=thr||(G.pad.f>.3?1:G.pad.f<-.3?-1:0);st=st||-G.pad.s;}}
 else if(d&&d.ai&&d.alive){bo=driveBot(d,c,G,dt);thr=bo.thr;st=bo.st;}
 if(thr)c.v+=thr*(thr*c.v<0?26:11)*dt;else c.v*=Math.exp(-dt*.9);c.v*=Math.exp(-dt*.08);c.v=cl(c.v,-9,27);c.steer+=(st-c.steer)*Math.min(1,dt*5);c.yaw+=c.steer*dt*cl(c.v/7,-1,1)*1.5;
 c.vel.x=Math.sin(c.yaw)*c.v;c.vel.z=Math.cos(c.yaw)*c.v;c.vel.y-=22*dt;const sp0=Math.abs(c.v);const r=W.move(c.pos,c.vel,dt,1.25,1.7,c.onG);c.onG=r.ground;
 if(r.wall&&sp0>4){if(sp0>13){if(bo)G.stats.rover.crash++;hurtCar(c,sp0*2.5,null);fx.dustCloud(c.pos,6);snd.impact(1,c.pos);}c.v*=-.25;}
 // run-over
 if(sp0>5)for(const b of G.actors){if(!b.alive||b===d||b.car||b.state!=='ground'||b.inGulag)continue;const dx=b.pos.x-c.pos.x,dz=b.pos.z-c.pos.z;if(dx*dx+dz*dz<5.5&&Math.abs(b.pos.y-c.pos.y)<1.6){const l=Math.hypot(dx,dz)||1;b.vel.x+=dx/l*8;b.vel.z+=dz/l*8;b.vel.y=4;damage(b,sp0*6,d,'body',tv.set(-dx/l,0,-dz/l),'car');c.v*=.8;}}
 const w=c.g.userData.wheels;for(let i=0;i<4;i++){w[i].rotation.x+=c.v*dt/.48;if(i>=2)w[i].rotation.y=c.steer*.4;}placeCar(c);c.g.rotation.z=Math.sin(G.time*13)*.004*Math.min(1,sp0/10);
 if(d===P)snd.engine(.3+Math.min(1,sp0/27)*.9,.11);
 if(bo&&c.driver===d){const S=G.stats.rover;S.dist+=sp0*dt;if(bo.exit){S.exit[bo.exit]=(S.exit[bo.exit]||0)+1;exitCar(d);}}}
// keep walkers out of rover bodies
function pushFromCars(a){for(const c of G.cars){if(c===a.car)continue;const dx=a.pos.x-c.pos.x,dz=a.pos.z-c.pos.z;if(dx*dx+dz*dz>9||Math.abs(a.pos.y-c.pos.y)>1.8)continue;const s=Math.sin(-c.yaw),co=Math.cos(-c.yaw);let lx=dx*co+dz*s,lz=-dx*s+dz*co;const hx=1.1+PR,hz=2.4+PR;if(Math.abs(lx)<hx&&Math.abs(lz)<hz){if(hx-Math.abs(lx)<hz-Math.abs(lz))lx=Math.sign(lx||1)*hx;else lz=Math.sign(lz||1)*hz;a.pos.x=c.pos.x+lx*co-lz*s;a.pos.z=c.pos.z+lx*s+lz*co;}}}

/* ---- loadout drops ---- */
const LOADOUTS={assault:{n:'ASSAULT',g:[['ark',4],['vx9',3]]},marksman:{n:'MARKSMAN',g:[['hrn',4],['vx9',3]]},close:{n:'CLOSE QUARTERS',g:[['stk',4],['vx9',4]]}};
function callDrop(a,kind,x,z){const g=makeCrate();scene.add(g);const y=W.groundAt(x,z,60,.6);const d={g,pos:new V(x,y+70,z),gy:y,kind,owner:a,opened:false,landed:false,smokeT:0,t:0};G.drops.push(d);g.position.copy(d.pos);snd.beep(true);return d;}
function giveLoadout(a,kind){const L=LOADOUTS[kind];const old=a.guns.filter(Boolean);const drop=old.filter(g=>g.r>0);scatter(drop,a.pos.x,a.pos.y,a.pos.z,.8);a.guns=L.g.map(([w,r])=>makeGun(w,r,{scope:w==='ark'&&kind==='marksman'}));a.cur=0;a.reloadT=0;for(const g of a.guns){const t=WPN[g.w].ammo;a.ammo[t]=Math.max(a.ammo[t],AMMO[t].max*.7|0);}a.plates=5;if(a===P){VM.set(gunOf(P));snd.rack();hud.banner('LOADOUT EQUIPPED',L.n,2.4);}}
function dropTick(d,dt){d.t+=dt;if(!d.landed){d.pos.y=Math.max(d.gy,d.pos.y-dt*14);d.g.rotation.y+=dt*.3;if(d.pos.y<=d.gy+.01){d.landed=true;fx.dustCloud(d.pos,14);snd.impact(1,d.pos);if(d.owner&&!d.owner.isPlayer&&d.owner.alive){giveLoadout(d.owner,d.kind);d.opened=true;d.g.userData.lid.position.set(0,1.1,-.6);d.g.userData.lid.rotation.x=-1.1;}}}
 d.g.position.copy(d.pos);if(d.t<40&&(d.smokeT-=dt)<=0){d.smokeT=.12;fx.smokeCol(tv.set(d.pos.x,d.gy,d.pos.z),[1,.25,.15],1);}}
function openDrop(a,d){if(d.opened||!d.landed)return;d.opened=true;d.g.userData.lid.position.set(0,1.1,-.6);d.g.userData.lid.rotation.x=-1.1;giveLoadout(a,d.kind);}

/* ================= match flow ================= */
function chooseNext(cur,r){for(let k=0;k<30;k++){const a=R()*TAU,d=Math.sqrt(R())*Math.max(0,cur.r-r)*.85;const x=cur.x+Math.cos(a)*d,z=cur.z+Math.sin(a)*d;const lim=LAND-40-r*.3;if(Math.abs(x)<lim&&Math.abs(z)<lim&&(r>40||nav.free(x,z)))return{x,z,r};}return{x:cur.x*.9,z:cur.z*.9,r};}
function initGas(){const cur={x:0,z:0,r:470};G.gas={cur,next:chooseNext({x:rr(-30,30),z:rr(-30,30),r:330},PHASES[0].r),state:'wait',left:PHASES[0].w,phase:0,from:null};}
function gasTick(dt){const g=G.gas,ph=PHASES[Math.min(g.phase,PHASES.length-1)];if(g.state==='closed')return;g.left-=dt*(G.gasScale||1);
 if(g.state==='wait'&&g.left<=0){g.state='shrink';g.left=ph.s;g.from={...g.cur};snd.alarm();hud.banner('CIRCLE CLOSING','MOVE TO THE SAFE ZONE',2.6,'warn');}
 else if(g.state==='shrink'){const k=cl(1-g.left/ph.s,0,1),e=k;g.cur={x:g.from.x+(g.next.x-g.from.x)*e,z:g.from.z+(g.next.z-g.from.z)*e,r:g.from.r+(g.next.r-g.from.r)*e};
  if(g.left<=0){g.cur={...g.next};g.phase++;if(g.phase>=PHASES.length){g.state='closed';}else{g.next=chooseNext(g.cur,PHASES[g.phase].r);g.state='wait';g.left=PHASES[g.phase].w;if(g.phase===4)hud.banner('THE CAGE IS CLOSED','NO MORE REDEPLOYS',2.6,'warn');}}}
 G.phase=g.phase;}
const outside=(a)=>{const g=G.gas.cur;return Math.hypot(a.pos.x-g.x,a.pos.z-g.z)>g.r;};
const gulagOpen=()=>G.phase<4;

function resetActor(a){Object.assign(a,{alive:true,out:false,hp:100,armor:0,plates:0,plateT:0,cash:0,cur:0,reloadT:0,fireT:0,kills:0,dmg:0,crouchV:0,crouch:0,inGulag:false,gulagUsed:false,deadT:0,place:0,hurtT:-99,car:null,pingT:-99,bought:false,heads:0,shots:0,hits:0,cageRes:''});
 a.guns=[makeGun('p9',0),null];a.ammo={light:48,rifle:0,shell:0};a.state='plane';a.vel.set(0,0,0);a.in={mx:0,mz:0,fire:false,jump:false,sprint:false};a.chute.visible=false;
 if(a.rig){a.rig.root.visible=false;a.rig.die=0;a.rig.mesh.rotation.set(0,0,0);a.rig.mesh.position.set(0,0,0);}
 a.ai=(!a.isPlayer||G.autopilot)?newBrain():null;Object.assign(a,{recP:0,recY:0,burst:0,burstT:0,adsV:0,zoom:1,speed:0,flash:0,supp:0,won:false,dropBought:false,killer:'',onGround:false,reloadDur:1,reloadTube:false,flashT:0});}
function dropPoint(){const pool=Math.random()<.35?MAP.pois:null;let x,z;if(pool){const p=pick(pool);x=p.x+rr(-p.r*.6,p.r*.6);z=p.z+rr(-p.r*.6,p.r*.6);}else{const s=pick(MAP.spots);x=s.x;z=s.z;}const q=nav.randomNear(x,z,14);return q?new V(q[0],0,q[1]):new V(x,0,z);}
function start(o={}){G.diff=DIFF[cl(o.diff??OPT.diff,0,2)];G.autopilot=!!o.autopilot;G.gasScale=o.gasScale||1;G.time=0;G.uavT=0;G.gulagQ=[];G.log=[];G.duel=null;G.matchLeft=MATCH;G.stats={rover:{enter:0,riders:[],dist:0,stuck:0,crash:0,claim:0,exit:{},rk:0}};for(const c of G.cars)c.claim=null;deathT=0;resultT=-1;lastAward=null;
 for(const l of [...G.loot])removeLoot(l);for(const d of G.drops)scene.remove(d.g);G.drops=[];fx.clear();hud.reset();
 for(const c of G.crates){c.opened=false;crateMat(c);}resetCars();
 // ground loot
 for(const s of MAP.spots){if(R()<.12)continue;addLoot(rollItem(s.lvl>0?.05:0),s.x+rr(-.3,.3),s.y,s.z+rr(-.3,.3),s.lvl);if(R()<.35){const t=R()<.5?{kind:'ammo',t:pick(['light','rifle','shell']),n:30}:{kind:'cash',n:(2+R()*6|0)*50};addLoot(t,s.x+rr(-.8,.8),s.y,s.z+rr(-.8,.8),s.lvl);}}
 initGas();
 // flight path across the island
 const ang=R()*TAU,off=rr(-100,100);const dir=new V(Math.cos(ang),0,Math.sin(ang)),perp=new V(-dir.z,0,dir.x);const a0=perp.clone().multiplyScalar(off).addScaledVector(dir,-470);
 G.plane={a:a0,dir,perp,len:940,pos:a0.clone().setY(PLANE_Y),show:true,exitT:800/PLANE_V};G.planeT=0;plane.visible=true;
 for(const a of G.actors){resetActor(a);a.pos.copy(G.plane.pos);a.yaw=Math.atan2(dir.x,dir.z);a.pitch=-.25;
  if(a.ai){let d=null;for(let k=0;k<12;k++){d=dropPoint();const rel=tv.subVectors(d,a0);if(Math.abs(rel.dot(perp))<260)break;}const along=tv.subVectors(d,a0).dot(dir);a.ai.dropTo=d;a.ai.jumpR=0;a.ai.jumpAt=cl(along/PLANE_V-rr(.5,3.5),150/PLANE_V+R()*2,G.plane.exitT-1-R());}}
 P.yaw=Math.atan2(dir.x,dir.z)+Math.PI/2;P.pitch=-.42;VM.set(null);G.app='match';G.remaining=NACT;
 $('menu').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('hud').hidden=false;$('clickp').hidden=true;closeBuy();setMap(false);
 hud.banner('PORT HALVARD','SPACE TO JUMP · 40 OPERATORS INBOUND',4);snd.loops({plane:.6});}

function jumpOut(a){a.state='fall';a.pos.copy(G.plane.pos).addScaledVector(G.plane.dir,-18);a.pos.y-=4;a.vel.copy(G.plane.dir).multiplyScalar(PLANE_V*.5);a.vel.y=-4;if(a===P){snd.jump();hud.banner('FREEFALL','W DIVE · SPACE DEPLOY CHUTE',2.4);P.yaw=Math.atan2(G.plane.dir.x,G.plane.dir.z);P.pitch=-.6;}}
function planeTick(dt){const pl=G.plane;if(!pl)return;G.planeT+=dt;const s=G.planeT*PLANE_V;pl.pos.copy(pl.a).addScaledVector(pl.dir,s);pl.pos.y=PLANE_Y;plane.position.copy(pl.pos);plane.rotation.set(0,Math.atan2(pl.dir.x,pl.dir.z),Math.sin(G.time*.6)*.03);
 for(const p of plane.userData.props)p.rotation.z+=dt*40;
 if(G.planeT>pl.exitT){for(const a of G.actors)if(a.state==='plane'&&a.alive)jumpOut(a);}
 if(s>pl.len){plane.visible=false;pl.show=false;G.plane=null;}}

/* ================= combat ================= */
function startReload(a){const it=gunOf(a);if(!it||a.reloadT>0||a.plateT>0||a.car)return;const s=wstats(it),t=WPN[it.w].ammo;if(it.mag>=s.mag||a.ammo[t]<=0)return;a.reloadT=s.tube?s.reload:s.reload;a.reloadDur=a.reloadT;a.reloadTube=!!s.tube;if(a===P){snd.magOut();VM.s.reload=0;}}
function swapGun(a,i){i=i??1-a.cur;if(i===a.cur||!a.guns[i])return;a.cur=i;a.reloadT=0;a.fireT=.35;if(a===P){VM.set(gunOf(P));snd.swap();}}
function startPlate(a){if(a.plates<=0||a.armor>=150||a.plateT>0||a.car||a.state!=='ground')return;a.plateT=a.isPlayer?1.05:1.3;a.reloadT=0;if(a===P)snd.plate();}
function falloff(s,t){return t<=s.range[0]?1:t>=s.range[1]?.6:1-.4*(t-s.range[0])/(s.range[1]-s.range[0]);}
function fire(a){const it=gunOf(a);if(!it||a.reloadT>0||a.plateT>0||a.fireT>0||a.car||a.state!=='ground')return false;
 if(it.mag<=0){if(a===P){snd.dry();a.fireT=.25;}startReload(a);return false;}
 const s=wstats(it);a.fireT=60/s.rpm;it.mag--;a.shots++;const isP=a===P&&!G.autopilot;
 const o=tv3.set(a.pos.x,a.pos.y+eyeH(a),a.pos.z);let yaw=a.yaw,pitch=a.pitch,spread;
 if(isP){yaw+=P.recY;pitch+=P.recP;spread=(s.hip*(1-P.adsV)+s.ads*P.adsV)*s.spr*(1+Math.min(1,P.speed/5)*(1-P.adsV*.6))*(P.onGround?1:2.2)*(s.pel?1:1+Math.min(1,P.burst/8)*.3);}
 else{const e=a.aimErr*Math.sqrt(R())*.6;const an=R()*TAU;yaw+=Math.cos(an)*e*D2R;pitch+=Math.sin(an)*e*D2R*.7;spread=s.pel?s.hip:s.hip*.35;}
 const dir=fwdOf(yaw,pitch,new V());const pel=s.pel||1;let hitAny=false;
 for(let k=0;k<pel;k++){const d=dir.clone();if(spread>0){const r=Math.sqrt(R())*spread*.5*D2R,an=R()*TAU;const u=tv2.set(-Math.cos(yaw),0,Math.sin(yaw));const vv=new V().crossVectors(d,u).normalize();d.addScaledVector(u,Math.cos(an)*r).addScaledVector(vv,Math.sin(an)*r).normalize();}
  if(trace(a,o,d,s,k===0))hitAny=true;}
 if(hitAny)a.hits++;
 // feedback
 const mz=tv.copy(o).addScaledVector(dir,.8);if(a===P){if(!G.autopilot){const k=s.kick*s.rec*(1-P.adsV*.3);const pat=WPN[it.w].pat[Math.min(39,P.burst|0)];P.recP+=k*D2R*.55;P.recY+=pat*s.hk*s.rec*D2R*.7;P.burst++;P.burstT=.28;}VM.fire(s.kick*.4+.15);snd.shot(it.w,null,s.sup);shake=Math.max(shake,s.pel?.5:.18);}
 else{if(a.rig&&a.rig.root.visible){a.rig.flash.visible=true;a.flashT=.05;a.rig.kick=1;}const dc=a.pos.distanceTo(cam.position);if(dc<320)snd.shot(it.w,a.pos,s.sup);}
 if(!s.sup||a.pos.distanceTo(P.pos)<35)a.pingT=G.time;
 if(!s.sup)fx.muzzle(mz,dir,false);a.loud=s.loud;for(const b of G.actors)if(b.ai&&b.alive&&b!==a&&b.inGulag===a.inGulag)hearShot(b,a,G);
 return true;}
function trace(a,o,d,s,tracer){const maxR=s.range[1]*2.2+60;let t=W.ray(o.x,o.y,o.z,d.x,d.y,d.z,maxR,2,HIT);const wn=[HIT.nx,HIT.ny,HIT.nz],wm=HIT.mat,wi=HIT.i;let best=null,car=null;
 for(const b of G.actors){if(b===a||!b.alive||b.inGulag!==a.inGulag||b.car||(b.state!=='ground'&&b.state!=='chute'&&b.state!=='fall'))continue;const dx=b.pos.x-o.x,dz=b.pos.z-o.z,dd=dx*d.x+dz*d.z;if(dd<0||dd>t+1)continue;const h=hitActor(b,o.x,o.y,o.z,d.x,d.y,d.z,t);if(h&&h.t<t){t=h.t;best={b,part:h.part};}}
 for(const c of G.cars){const tc=rayCar(c,o,d,t);if(tc<t){t=tc;best=null;car=c;}}
 const end=tv.copy(o).addScaledVector(d,Math.min(t,maxR));const dc=end.distanceTo(cam.position);
 if(tracer&&(a===P||R()<.6)){const from=a===P?tv2.copy(cam.position).addScaledVector(d,.9).add(new V(0,-.12,0)):tv2.copy(o).addScaledVector(d,.9);fx.tracer(from,end,a===P?[1,.85,.55]:[1,.6,.35]);}
 if(best){const b=best.b;let dmg=s.dmg*falloff(s,t)*(best.part==='head'?s.head:best.part==='legs'?.85:1);if(a.ai&&!a.isPlayer)dmg*=b.isPlayer?G.diff.dmg:SKIRM.dmg;
  if(b!==P||P.car){if(b.armor>0)fx.armorSpark(end,d);else fx.hitPuff(end,d);}if(dc<60&&b!==P)snd.bodyHit(end,b.armor>0);damage(b,dmg,a,best.part,d,'gun');return true;}
 if(car){hurtCar(car,s.dmg*.8,a);if(dc<150){fx.impact(end,tv2.copy(d).negate(),1,1);snd.impact(1,end);}if(a===P)hud.hit('veh');return true;}
 if(t<maxR&&dc<170){const n=tv2.set(wn[0],wn[1],wn[2]);if(n.lengthSq()<.5)n.copy(d).negate();fx.impact(end,n,wi<0?3:wm,s.pel?.5:1);if(dc<40)snd.impact(wi<0?3:wm,end);}
 // near-miss crack for the player
 if(a!==P&&P.alive&&a.inGulag===P.inGulag){const px=P.pos.x-o.x,py=P.pos.y+1.5-o.y,pz=P.pos.z-o.z;const along=px*d.x+py*d.y+pz*d.z;if(along>0&&along<t){const cx=px-d.x*along,cy=py-d.y*along,cz=pz-d.z*along;if(cx*cx+cy*cy+cz*cz<4){snd.crack(P.pos);P.supp=Math.min(1,(P.supp||0)+.25);}}}
 return false;}

function damage(v,amt,src,part,dir,kind){if(!v.alive||amt<=0||(v===P&&G.god))return;if(G.duel&&G.duel.t<0&&v.inGulag)return;
 const arm0=v.armor;let a=amt;if(kind!=='gas'&&v.armor>0){const ab=Math.min(v.armor,a);v.armor-=ab;a-=ab;}
 const broke=arm0>0&&v.armor<=0;v.hp-=a;v.hurtT=G.time;if(src&&src!==v)src.dmg+=amt;
 if(v===P){if(kind!=='gas'){snd.hurt(arm0>0,part==='head');shake=Math.max(shake,.35);P.flash=Math.min(1,(P.flash||0)+amt/60);if(src&&src!==P){const a2=Math.atan2(src.pos.x-P.pos.x,src.pos.z-P.pos.z);hud.hurtDir(-(a2-P.yaw));}}if(broke){snd.plateBreak();hud.note('ARMOR BROKEN','bad');}}
 if(src===P&&v!==P){hud.hit(v.hp<=0?'kill':broke?'brk':part==='head'?'head':v.armor>0?'arm':'');snd.hitmark(v.hp<=0?'kill':part==='head'?'head':'');if(broke){snd.plateBreak();fx.plateBreak(tv.set(v.pos.x,v.pos.y+1.3,v.pos.z));}}
 if(v.ai)botHurt(v,src,G);
 if(v.hp<=0)kill(v,src,part,kind);}

function kill(v,src,part,kind){G.log.push({t:+G.time.toFixed(1),v:v.name,k:src&&src!==v?src.name:'',kind,part,d:src?+src.pos.distanceTo(v.pos).toFixed(1):0,w:src&&gunOf(src)?gunOf(src).w+gunOf(src).r:'',cage:!!v.inGulag});v.alive=false;v.hp=0;v.state='dead';v.deadT=0;v.reloadT=0;v.plateT=0;if(v.car)exitCar(v);v.chute.visible=false;
 if(v.rig){v.rig.dieDir=R()<.5?1:-1;}
 if(src&&src!==v){src.kills++;if(kind==='car'&&src.ai&&src.car)G.stats.rover.rk++;if(part==='head')src.heads=(src.heads||0)+1;}
 const wname=kind==='gas'?'GAS':kind==='car'?'ROVER':kind==='boom'?'EXPLOSION':src&&gunOf(src)?WPN[gunOf(src).w].n:'';
 if(v.inGulag&&G.duel){hud.feed(src?src.name:'',wname,v.name,{cage:true,me:v===P||src===P});duelEnd(v===P?G.duel.o:P);return;}
 hud.feed(src&&src!==v?src.name:'',wname,v.name,{head:part==='head',me:v===P||src===P});
 if(src===P&&v!==P){hud.note(`ELIMINATED ${v.name}${part==='head'?' · HEADSHOT':''}`,'kill');}
 // drop everything
 const items=v.guns.filter(Boolean).map(g=>({...g,mods:{...g.mods}}));for(const t in v.ammo)if(v.ammo[t]>0)items.push({kind:'ammo',t,n:Math.min(90,v.ammo[t])});if(v.plates>0)items.push({kind:'plates',n:v.plates});if(v.cash>0)items.push({kind:'cash',n:Math.max(50,Math.round(v.cash*.5/50)*50)});
 scatter(items,v.pos.x,v.pos.y,v.pos.z,1.1);v.cash=Math.round(v.cash*.5);v.plates=0;v.guns=[null,null];
 if(v===P){deathT=0;snd.death();P.downKind=kind;P.killer=src&&src!==P?src.name:kind==='gas'?'THE GAS':'';return;}
 if(gulagOpen()&&!v.gulagUsed){G.gulagQ.push({a:v,t:G.time});}else eliminate(v);}
function eliminate(v){if(v.out)return;v.out=true;v.alive=false;v.place=remaining()+1;G.remaining=remaining();
 if(v===P){P.state='dead';resultT=2.2;return;}
 if(G.remaining===1&&!P.out&&P.alive)win();}

/* ---- the cage (gulag) ---- */
function enterGulag(){P.gulagUsed=true;let q=G.gulagQ.shift();let o=q?q.a:null;
 G.duel={o,t:-3.5,wait:o?0:20};P.inGulag=true;placeDuelist(P,-1);if(o)setupOpp(o);
 hud.banner('THE CAGE','WIN THE 1V1 TO REDEPLOY',3.2);snd.gulag();VM.set(gunOf(P));$('black').style.opacity=1;setTimeout(()=>$('black').style.opacity=0,60);}
function setupOpp(o){const wid=G.duel.wid||(G.duel.wid=pick(['p9','vx9','stk','ark','p9']));for(const a of[P,o]){a.guns=[makeGun(wid,1),null];a.cur=0;const t=WPN[wid].ammo;a.ammo={light:0,rifle:0,shell:0};a.ammo[t]=wid==='stk'?18:90;}
 o.alive=true;o.hp=100;o.armor=0;o.plates=0;o.inGulag=true;o.gulagUsed=true;o.ai=newBrain();placeDuelist(o,1);P.hp=100;P.armor=0;P.plates=0;VM.set(gunOf(P));G.duel.t=-3.5;}
function placeDuelist(a,s){a.alive=true;a.state='ground';a.hp=100;a.armor=0;a.reloadT=0;a.plateT=0;a.pos.set(GULAG.x+s*15,0,GULAG.z+rr(-3,3));a.vel.set(0,0,0);a.yaw=s<0?Math.PI/2:-Math.PI/2;a.pitch=0;a.chute.visible=false;a.inGulag=true;if(a.rig){a.rig.die=0;a.rig.mesh.rotation.set(0,0,0);a.rig.mesh.position.set(0,0,0);}
 if(a===P&&!a.guns[0]){a.guns=[makeGun('p9',1),null];a.ammo.light=60;}}
function duelTick(dt){const D=G.duel;if(!D)return;
 if(!D.o){D.wait-=dt;const q=G.gulagQ.shift();if(q){D.o=q.a;setupOpp(D.o);hud.banner('OPPONENT FOUND',D.o.name,2);}else if(D.wait<=0){hud.banner('NO CHALLENGER','REDEPLOYING',2.4);D.win=P;finishDuel(P,null);}return;}
 const was=D.t;D.t+=dt;if(was<0&&D.t>=0){hud.banner('FIGHT','',1.2);snd.beep(true);}else if(Math.ceil(was)!==Math.ceil(D.t)&&D.t<0)snd.beep(false);
 if(D.t>40){const pt=P.hp+P.armor,ot=D.o.hp+D.o.armor;hud.banner('OVERTIME',pt>ot?'YOU HAD MORE HEALTH':'OPPONENT HAD MORE HEALTH',2);duelEnd(pt>ot?P:D.o);}}
function duelEnd(w){const D=G.duel;if(!D||D.done)return;D.done=true;finishDuel(w,w===P?D.o:P);}
function finishDuel(w,l){const D=G.duel;G.duel=null;
 if(l&&l!==P){l.inGulag=false;l.alive=false;l.state='dead';l.deadT=99;eliminate(l);}
 if(w===P){P.cageRes='WON';hud.banner('YOU WON THE CAGE','REDEPLOYING',3,'good');snd.win();redeploy(P);}
 else{P.cageRes='LOST';P.inGulag=false;P.alive=false;P.state='dead';snd.death();if(w){redeploy(w);}eliminate(P);}}
function redeploy(a){a.inGulag=false;a.alive=true;a.out=false;a.hp=100;a.armor=0;a.plates=0;a.reloadT=0;a.plateT=0;a.guns=[makeGun('p9',0),null];a.cur=0;a.ammo={light:48,rifle:0,shell:0};
 const g=G.gas;let x=g.next.x,z=g.next.z;const q=nav.randomNear(g.next.x,g.next.z,Math.max(10,g.next.r*.8));if(q){x=q[0];z=q[1];}
 a.pos.set(x+rr(-60,60),170,z+rr(-60,60));a.vel.set(0,-6,0);a.state='chute';a.chute.visible=true;if(a.rig){a.rig.die=0;a.rig.mesh.rotation.set(0,0,0);a.rig.mesh.position.set(0,0,0);}
 if(a.ai||(!a.isPlayer)){a.ai=newBrain();a.ai.dropTo=new V(x,0,z);}if(a===P){VM.set(gunOf(P));snd.chute();P.yaw=Math.atan2(x-P.pos.x,z-P.pos.z);}G.remaining=remaining();}
function botGulag(dt){if(!gulagOpen()){while(G.gulagQ.length){const q=G.gulagQ.shift();q.a.gulagUsed=true;eliminate(q.a);}return;}
 if(G.duel&&!G.duel.o)return;// the player is waiting for an opponent
 const Q2=G.gulagQ;if(Q2.length>=2&&G.time-Q2[1].t>9){const A=Q2.shift().a,B=Q2.shift().a;A.gulagUsed=B.gulagUsed=true;const w=R()<.5?A:B,l=w===A?B:A;hud.feed(w.name,'CAGE',l.name,{cage:true});eliminate(l);redeploy(w);}
 else if(Q2.length===1&&G.time-Q2[0].t>30&&!(P.state==='dead'&&!P.out&&!P.gulagUsed)){const A=Q2.shift().a;A.gulagUsed=true;if(R()<.5)redeploy(A);else eliminate(A);}}

/* ---- results ---- */
function win(){if(G.app!=='match')return;P.place=1;snd.win();hud.banner('VICTORY','LAST OPERATOR STANDING',4,'good');resultT=3.5;P.won=true;}
function finish(reason){if(G.app!=='match'&&G.app!=='paused')return;G.app='results';unlock();closeBuy();setMap(false);snd.loops({});snd.engine(0,0);
 const won=!!P.won;const sc=a=>a.hp+a.armor+a.kills*40;let place=P.out?P.place:won?1:1+G.actors.filter(a=>a!==P&&!a.out&&sc(a)>sc(P)).length;if(!P.place)P.place=place;place=P.place||place;
 const pts=Math.max(0,(41-place)*25+P.kills*100+(won?1000:0)+Math.round(P.dmg*.2));const tok=5+Math.min(60,pts/40|0);addRound(tok,won);saveBest(ID,pts);
 lastAward={pts,tok,won,place,kills:P.kills,dmg:Math.round(P.dmg),diff:G.diff.n,t:G.time,reason,cage:P.cageRes||'NOT USED'};
 $('otitle').textContent=won?'VICTORY':reason==='time'?'TIME UP':'ELIMINATED';$('otitle').className=won?'good':'';$('oplace').innerHTML=`#${place}<small>/ ${NACT}</small>`;
 const top=[...G.actors].sort((a,b)=>b.kills-a.kills).slice(0,3).map(a=>`${a.name} ${a.kills}`).join(' · ');
 const rows=[['PLACEMENT',`#${place} of ${NACT}`],['ELIMINATIONS',`${P.kills}${P.heads?` (${P.heads} headshot${P.heads>1?'s':''})`:''}`],['DAMAGE DEALT',Math.round(P.dmg)],['ACCURACY',P.shots?Math.round(P.hits/P.shots*100)+'%':'-'],['TIME SURVIVED',mmss(G.time)],['THE CAGE',P.cageRes||'NOT USED'],
  ['CAUSE',won?'Last operator standing':reason==='time'?'Match time limit':P.killer?'Eliminated by '+P.killer:'Eliminated'],['CPU DIFFICULTY',G.diff.n],['TOP FRAGGERS',top]];
 $('stats').innerHTML=rows.map(r=>`<tr><td>${r[0]}</td><td>${r[1]}</td></tr>`).join('');
 $('otok').textContent=`SCORE ${pts.toLocaleString()} · +${tok} TOKENS · BEST ${bestScore(ID).toLocaleString()}`;
 $('hud').hidden=true;$('over').hidden=false;$('clickp').hidden=true;}

/* ================= interaction ================= */
function findInteract(){if(!P.alive||P.state!=='ground')return null;if(P.car)return{k:'exit',t:'EXIT ROVER'};
 const px=P.pos.x,pz=P.pos.z,py=P.pos.y;
 for(const d of G.depots)if(Math.hypot(d.x-px,d.z-pz)<2.8&&py<1)return{k:'depot',d,t:'OPEN BUY STATION'};
 for(const d of G.drops)if(!d.opened&&d.landed&&Math.hypot(d.pos.x-px,d.pos.z-pz)<2.6)return{k:'drop',d,t:'OPEN LOADOUT DROP'};
 // guns: the one closest to the view ray
 const f=fwdOf(P.yaw,P.pitch,tv2);let best=null,bs=1e9;for(const l of G.loot){if(l.it.kind!=='gun')continue;const dx=l.p.x-px,dy=l.p.y-(py+EYE),dz=l.p.z-pz;const d=Math.hypot(dx,dy,dz);if(d>3||Math.abs(l.p.y-py)>1.3)continue;const dot=(dx*f.x+dy*f.y+dz*f.z)/d;const s=d*(1.6-dot);if(s<bs&&(dot>.55||Math.hypot(dx,dz)<1.1)){bs=s;best=l;}}
 if(best)return{k:'gun',l:best,t:(P.guns[1]?'SWAP FOR ':'PICK UP ')+gunName(best.it),c:RAR[best.it.r].c};
 for(const c of G.crates)if(!c.opened&&Math.abs(c.y-py)<1.4&&Math.hypot(c.x-px,c.z-pz)<2.2)return{k:'crate',c,t:'OPEN SUPPLY BOX'};
 for(const c of G.cars)if(!c.dead&&!c.driver&&Math.hypot(c.pos.x-px,c.pos.z-pz)<3.4)return{k:'car',c,t:'ENTER ROVER'};
 return null;}
function interact(){const it=interactT;if(!it)return;
 if(it.k==='exit')exitCar(P);else if(it.k==='depot')openBuy(it.d);else if(it.k==='drop')openDrop(P,it.d);else if(it.k==='crate')openCrate(P,it.c);else if(it.k==='car')enterCar(P,it.c);
 else if(it.k==='gun')pickup(P,it.l);}
const gScore=g=>g?(1+g.r*.35)*({p9:.5,vx9:1,ark:1.2,hrn:1.05,stk:.95}[g.w]):0;
function giveGun(a,it){const slot=!a.guns[0]?0:!a.guns[1]?1:a.isPlayer&&!G.autopilot?a.cur:(gScore(a.guns[0])<=gScore(a.guns[1])?0:1);const old=a.guns[slot];a.guns[slot]=it;if(old)scatter([old],a.pos.x,a.pos.y,a.pos.z,.5);a.cur=slot;a.reloadT=0;const t=WPN[it.w].ammo;if(a.ammo[t]<it.mag)a.ammo[t]+=it.mag;if(a===P){VM.set(gunOf(P));snd.rack();}}
function pickup(a,l){if(!G.loot.includes(l))return false;const it=l.it;if(a.pos.distanceTo(l.p)>3.2)return false;
 if(it.kind==='gun')giveGun(a,it);
 else if(it.kind==='ammo'){const room=AMMO[it.t].max-a.ammo[it.t];if(room<=0)return false;const n=Math.min(room,it.n);a.ammo[it.t]+=n;it.n-=n;if(it.n>0){lootDirty=true;if(a===P)snd.pick();return true;}}
 else if(it.kind==='plates'){const room=5-a.plates;if(room<=0)return false;const n=Math.min(room,it.n);a.plates+=n;it.n-=n;if(it.n>0){lootDirty=true;if(a===P)snd.plate();return true;}}
 else if(it.kind==='cash'){a.cash+=it.n;}
 removeLoot(l);if(a===P){if(it.kind==='cash'){snd.cash();hud.note('+$'+it.n,'cash');}else if(it.kind==='plates'){snd.pick();hud.note('+ ARMOR PLATE','q');}else if(it.kind==='ammo'){snd.pick();hud.note('+ '+AMMO[it.t].n+' AMMO','q');}}return true;}
function autoPickup(){if(P.state!=='ground'||!P.alive||P.car)return;for(const l of G.loot){if(l.it.kind==='gun')continue;const dx=l.p.x-P.pos.x,dz=l.p.z-P.pos.z;if(dx*dx+dz*dz<2.6&&Math.abs(l.p.y-P.pos.y)<1.2){if(pickup(P,l))return;}}}

/* ---- buy station ---- */
const SHOP=[{k:'plates',n:'ARMOR PLATES ×3',p:500},{k:'ammo',n:'AMMO REFILL',p:300},{k:'uav',n:'UAV SCAN · 30s',p:1500},{k:'assault',n:'LOADOUT DROP · ASSAULT',p:4000,d:'Legendary ARK-5 + Epic VEX-9'},{k:'marksman',n:'LOADOUT DROP · MARKSMAN',p:4000,d:'Legendary HERON DMR + Epic VEX-9'},{k:'close',n:'LOADOUT DROP · CLOSE QUARTERS',p:4000,d:'Legendary STOKER 12 + Legendary VEX-9'}];
let buyAt=null;
function openBuy(d){buyAt=d;buyOpen=true;$('buy').hidden=false;renderBuy();snd.click();}
function closeBuy(){buyOpen=false;buyAt=null;const b=$('buy');if(b)b.hidden=true;}
function renderBuy(){$('bcash').textContent='$'+P.cash.toLocaleString();$('blist').innerHTML=SHOP.map((s,i)=>{const lo=['assault','marksman','close'].includes(s.k);const dis=P.cash<s.p||(lo&&P.dropBought);return`<button data-i="${i}" class="${dis?'off':''}"><kbd>${i+1}</kbd><b>${s.n}</b><span>${s.d||''}</span><em>$${s.p.toLocaleString()}</em></button>`;}).join('');
 $('blist').querySelectorAll('button').forEach(b=>b.onclick=()=>buy(+b.dataset.i));}
function buy(i){const s=SHOP[i];if(!s||!buyOpen)return;const lo=['assault','marksman','close'].includes(s.k);if(P.cash<s.p||(lo&&P.dropBought)){snd.err();return;}
 if(s.k==='plates'){if(P.plates>=5){snd.err();hud.note('PLATE CARRIER FULL','bad');return;}P.plates=Math.min(5,P.plates+3);}
 else if(s.k==='ammo'){for(const g of P.guns)if(g){const t=WPN[g.w].ammo;P.ammo[t]=AMMO[t].max;}}
 else if(s.k==='uav'){G.uavT=30;hud.banner('UAV ONLINE','ENEMIES REVEALED ON THE MAP',2);snd.beep(true);}
 else{P.dropBought=true;const d=buyAt;const a=R()*TAU;let x=d.x+Math.cos(a)*5,z=d.z+Math.sin(a)*5;const q=nav.randomNear(x,z,4);if(q){x=q[0];z=q[1];}callDrop(P,s.k,x,z);hud.banner('LOADOUT DROP INBOUND','FOLLOW THE RED SMOKE',2.4);closeBuy();}
 P.cash-=s.p;snd.buy();if(buyOpen)renderBuy();}
function botBuy(a){if(a.bought||a.cash<4000)return;a.bought=true;a.cash-=4000;const k=pick(['assault','marksman','close']);const x=a.pos.x+rr(-3,3),z=a.pos.z+rr(-3,3);callDrop(a,k,x,z);}

/* ================= AI context ================= */
function botPickup(a,l){const ok=pickup(a,l);if(ok){for(const m of [...G.loot]){if(m.lvl!==l.lvl||m.p.distanceTo(a.pos)>2.6)continue;if(wantsItem(a,m.it))pickup(a,m);}}return ok;}
Object.assign(G,{enterCar,swap:a=>swapGun(a),reload:a=>startReload(a),plate:a=>startPlate(a),botBuy,pickup:botPickup,openCrate});

/* ================= per-actor simulation ================= */
function weaponTick(a,dt){a.fireT-=dt;if(a.flashT>0){a.flashT-=dt;if(a.flashT<=0&&a.rig)a.rig.flash.visible=false;}
 const it=gunOf(a);if(a.reloadT>0&&it){a.reloadT-=dt;if(a.reloadT<=0){const s=wstats(it),t=WPN[it.w].ammo;if(a.reloadTube){if(a.ammo[t]>0&&it.mag<s.mag){it.mag++;a.ammo[t]--;if(a===P)snd.shellIn();if(it.mag<s.mag&&a.ammo[t]>0){a.reloadT=s.reload;a.reloadDur=s.reload;}else{a.reloadT=0;if(a===P)snd.pump();}}}
   else{const n=Math.min(s.mag-it.mag,a.ammo[t]);it.mag+=n;a.ammo[t]-=n;a.reloadT=0;if(a===P)snd.magIn();}}}
 if(a.plateT>0){a.plateT-=dt;if(a.plateT<=0){a.plateT=0;if(a.plates>0&&a.armor<150){a.plates--;a.armor=Math.min(150,a.armor+50);if(a===P)snd.plate();}}}
 if(a.hp<100&&G.time-a.hurtT>5)a.hp=Math.min(100,a.hp+30*dt);}
function airTick(a,dt){const fx_=Math.sin(a.yaw),fz=Math.cos(a.yaw),rx=-Math.cos(a.yaw),rz=Math.sin(a.yaw);const I=a.in;
 const gy=W.groundAt(a.pos.x,a.pos.z,a.pos.y,.3);const agl=a.pos.y-gy;
 if(a.state==='fall'){const dive=a===P&&!G.autopilot&&I.mz>0&&a.pitch<-.45;const hs=I.mz>0?(dive?16:24)*I.mz:I.mz<0?2:8;const tx=fx_*hs+rx*I.mx*8,tz=fz*hs+rz*I.mx*8;
  const k=Math.min(1,dt*1.3);a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;a.vel.y+=((dive?-52:-32)-a.vel.y)*Math.min(1,dt*1.5);
  if(agl<CHUTE_AUTO||(I.jump&&(agl<200||!a.isPlayer||G.autopilot))){a.state='chute';a.chute.visible=true;a.vel.y=Math.max(a.vel.y,-14);if(a===P)snd.chute();}}
 else{const hs=I.mz>0?4+9*I.mz:I.mz<0?1.5:a.isPlayer?4:0;const tx=fx_*hs+rx*I.mx*3,tz=fz*hs+rz*I.mx*3;const k=Math.min(1,dt*1.6);a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;a.vel.y+=(-(5.5+Math.max(0,I.mz)*2.5)-a.vel.y)*Math.min(1,dt*2.5);}
 const r=W.move(a.pos,a.vel,dt,PR,PH,false);if(r.ground){a.state='ground';a.onGround=true;a.chute.visible=false;a.vel.set(0,0,0);if(a===P){snd.land(1);VM.set(gunOf(P));}}}
function botGround(a,dt){const I=a.in;const fx_=Math.sin(a.yaw),fz=Math.cos(a.yaw),rx=-Math.cos(a.yaw),rz=Math.sin(a.yaw);
 const sp=(G.duel&&a.inGulag&&G.duel.t<0)?0:I.sprint?6.4:a.reloadT>0||a.plateT>0?3.4:4.4;const tx=(fx_*I.mz+rx*I.mx)*sp,tz=(fz*I.mz+rz*I.mx)*sp;const k=Math.min(1,dt*(a.onGround?10:2));a.vel.x+=(tx-a.vel.x)*k;a.vel.z+=(tz-a.vel.z)*k;
 if(I.jump&&a.onGround){a.vel.y=5.2;a.onGround=false;}a.vel.y-=18*dt;const vy0=a.vel.y;const r=W.move(a.pos,a.vel,dt,PR,1.75,a.onGround);if(r.ground&&!a.onGround&&vy0<-15)damage(a,(-vy0-15)*7,null,'legs',null,'fall');a.onGround=r.ground;
 pushFromCars(a);a.speed=Math.hypot(a.vel.x,a.vel.z);
 if(a.pos.y>2.4&&!a.inGulag){a.roofT=(a.roofT||0)+dt;if(a.roofT>14&&a.pos.distanceTo(cam.position)>70){const c=nav.nearestFree(a.pos.x,a.pos.z,30);if(c>=0){const q=nav.pt(c);a.pos.set(q[0],0,q[1]);a.vel.set(0,0,0);a.ai.path=null;a.ai.pathT=-99;}a.roofT=0;}}else a.roofT=0;
 // footsteps near the camera
 if(a.speed>1&&a.onGround){a.stepT=(a.stepT||0)-dt*a.speed;if(a.stepT<=0){a.stepT=I.sprint?2.6:2.2;const d=a.pos.distanceTo(cam.position);if(d<32)snd.step(W.surfAt(a.pos.x,a.pos.z,a.pos.y),a.pos,I.sprint?1.1:.8);}}}
function actorTick(a,dt){if(!a.alive){a.deadT+=dt;return;}
 if(a.state==='plane'){a.pos.copy(G.plane?G.plane.pos:a.pos);if(a.in.jump&&G.plane&&Math.abs(G.plane.pos.x)<LAND+30&&Math.abs(G.plane.pos.z)<LAND+30)jumpOut(a);else if(!G.plane)jumpOut(a);return;}
 if(a.state==='fall'||a.state==='chute'){airTick(a,dt);return;}
 weaponTick(a,dt);
 if(a.isPlayer&&!G.autopilot){return;}
 if(a.car){a.pos.copy(a.car.pos);return;}
 botGround(a,dt);if(a.in.fire&&!(G.duel&&a.inGulag&&G.duel.t<0))fire(a);
 // gas damage ticks once a second
 }
function gasDamage(dt){G.gasAcc=(G.gasAcc||0)+dt;if(G.gasAcc<1)return;G.gasAcc-=1;const dps=PHASES[Math.min(G.gas.phase,PHASES.length-1)].dps;
 for(const a of G.actors){if(!a.alive||a.inGulag||a.state==='plane')continue;if(outside(a)){damage(a,dps,null,'body',null,'gas');if(a===P)snd.hurt(false,false);}}}

/* ================= player control ================= */
function playerTick(dt){const I=P.in;const sens=.0022*[.6,1,1.5][OPT.sens??1];
 if(G.app==='match'){const md=mouse.dx,mdy=mouse.dy;mouse.dx=mouse.dy=0;VM.mdx=md;VM.mdy=mdy;const zs=P.adsV>.5?1/(1+(P.zoom-1)*.85):1;P.yaw-=md*sens*zs;P.pitch=cl(P.pitch-mdy*sens*zs,-1.52,1.52);}
 if(G.autopilot){if(P.alive&&!P.car)thinkBot(P,G,dt);P.adsV=0;P.zoom=1;return;}
 const pad=G.pad||{};const ks=k=>!!keys[k];
 const mz=(ks('KeyW')||ks('ArrowUp')?1:0)-(ks('KeyS')||ks('ArrowDown')?1:0)+(pad.f||0),mx=(ks('KeyD')||ks('ArrowRight')?1:0)-(ks('KeyA')||ks('ArrowLeft')?1:0)+(pad.s||0);
 I.mz=cl(mz,-1,1);I.mx=cl(mx,-1,1);I.jump=P.jumpQ;P.jumpQ=false;
 if(!P.alive||P.state!=='ground')return;
 if(P.car){P.pos.copy(P.car.pos);P.adsV=0;return;}
 const it=gunOf(P),s=it?wstats(it):null;P.zoom=s?s.zoom:1;
 const ads=(mouse.r||pad.ads)&&!!it&&P.plateT<=0;const sprint=(ks('ShiftLeft')||ks('ShiftRight')||pad.sprint)&&I.mz>.3&&!ads&&P.crouch<.5;
 P.adsV+=((ads?1:0)-P.adsV)*Math.min(1,dt/Math.max(.08,s?s.ergo:.2)*2.6);P.crouchV+=(P.crouch-P.crouchV)*Math.min(1,dt*10);
 const sp=P.crouch>.5?2.4:ads?3.1:sprint?7.1:4.9;const fx_=Math.sin(P.yaw),fz=Math.cos(P.yaw),rx=-Math.cos(P.yaw),rz=Math.sin(P.yaw);let wx=fx_*I.mz+rx*I.mx,wz=fz*I.mz+rz*I.mx;const l=Math.hypot(wx,wz);if(l>1){wx/=l;wz/=l;}
 const k=Math.min(1,dt*(P.onGround?11:2.2));P.vel.x+=(wx*sp-P.vel.x)*k;P.vel.z+=(wz*sp-P.vel.z)*k;if(I.jump&&P.onGround){P.vel.y=5.3;P.onGround=false;snd.jump();}
 P.vel.y-=18*dt;const vy0=P.vel.y;const r=W.move(P.pos,P.vel,dt,PR,P.crouch>.5?1.25:PH,P.onGround);if(r.ground&&!P.onGround){if(vy0<-6)snd.land(Math.min(1,-vy0/12));if(vy0<-15)damage(P,(-vy0-15)*7,null,'legs',null,'fall');}P.onGround=r.ground;pushFromCars(P);
 P.speed=Math.hypot(P.vel.x,P.vel.z);P.sprinting=sprint&&P.speed>4;
 if(P.speed>1&&P.onGround){P.stepT=(P.stepT||0)-dt*P.speed;if(P.stepT<=0){P.stepT=sprint?2.7:2.3;snd.step(W.surfAt(P.pos.x,P.pos.z,P.pos.y),null,P.crouch>.5?.35:sprint?1:.7);}}
 // firing: hold for automatic fire, every click queues a shot for semi-automatics
 const frozen=G.duel&&G.duel.t<0;const want=(mouse.l||pad.fire||mouse.q>0)&&!sprint&&!frozen&&!buyOpen;
 if(want&&it){if(it.mag<=0&&P.fireT<=0){if(P.ammo[WPN[it.w].ammo]>0)startReload(P);else{snd.dry();P.fireT=.3;}mouse.q=0;}else if(fire(P)){if(mouse.q>0)mouse.q--;if(!WPN[it.w].auto&&!mouse.l)mouse.q=Math.max(0,mouse.q);}}
 if(P.reloadT>0||P.plateT>0)mouse.q=0;
 P.burstT-=dt;if(P.burstT<=0)P.burst=0;const rk=Math.min(1,dt*(mouse.l?2.2:7));P.recP-=P.recP*rk;P.recY-=P.recY*rk;
 if(it&&it.mag===0&&P.reloadT<=0&&P.ammo[WPN[it.w].ammo]>0&&!mouse.l)startReload(P);
 P.supp=Math.max(0,(P.supp||0)-dt*.8);P.flash=Math.max(0,(P.flash||0)-dt*1.2);}

/* ================= input ================= */
function lock(){if(G.app!=='match'&&G.app!=='paused')return;try{const r=canvas.requestPointerLock();if(r&&r.catch)r.catch(()=>{$('clickp').hidden=false;});}catch(e){$('clickp').hidden=false;}}
// the click lock stays local: a refused lock request shows the click-to-play prompt
const IN=controls(canvas,{clickLock:()=>false,menu:()=>G.app==='match',onLock:(on,was)=>{if(on){$('clickp').hidden=true;if(G.app==='paused'){G.app='match';$('pause').hidden=true;}}if(was&&!on&&G.app==='match'&&!mapOpen)pause(true);},
 onDown:e=>{if(G.app==='match'&&!IN.locked){lock();return true;}if(G.app!=='match')return true;if(e.button===0)mouse.q=Math.min(3,mouse.q+1);},
 onWheel:()=>{if(G.app==='match'&&IN.locked&&P.alive)swapGun(P);},onKey:keyDown});
const {keys,mouse,unlock}=IN;mouse.q=0;
$('clickp').onclick=()=>{snd.init();if(G.app==='paused')pause(false);lock();};
function keyDown(e,first){if(G.app==='match'&&['Space','Tab','KeyQ','KeyE','ControlLeft','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
 if(e.code==='Escape'){if(buyOpen){closeBuy();return;}if(mapOpen){setMap(false);return;}if(G.app==='paused')pause(false);return;}
 if(G.app!=='match'||!first)return;
 if(e.code==='KeyM'||e.code==='Tab'){setMap(!mapOpen);return;}
 if(buyOpen){const n=+e.code.replace('Digit','');if(n>=1&&n<=SHOP.length){buy(n-1);return;}if(e.code==='KeyE'){closeBuy();return;}}
 if(!P.alive)return;
 if(e.code==='Space')P.jumpQ=true;
 if(e.code==='KeyE'||e.code==='KeyF')interact();if(e.code==='KeyR')startReload(P);if(e.code==='KeyV'||e.code==='KeyX')startPlate(P);
 if(e.code==='Digit1'||e.code==='KeyQ'||e.code==='Digit2')swapGun(P,e.code==='Digit1'?0:e.code==='Digit2'?1:undefined);
 if(e.code==='KeyC'||e.code==='ControlLeft')P.crouch=P.crouch?0:1;}
function setMap(on){mapOpen=on;$('bigmap').hidden=!on;if(on)hud.bigmap(G,P);}
function pause(on){if(on){if(G.app!=='match')return;G.app='paused';$('pause').hidden=false;mouse.l=mouse.r=false;mouse.q=0;}else{if(G.app!=='paused')return;if(IN.locked||G.testing){G.app='match';$('pause').hidden=true;}else lock();}}
function readPad(){const gp=gamepad();if(!gp){G.pad=null;return;}const ax=gp.axes,bt=gp.buttons,dz=v=>deadzone(v,.17);const pr=G.padPrev||[];const btn=i=>!!bt[i]&&(bt[i].pressed||bt[i].value>.4);const ed=i=>btn(i)&&!pr[i];
 G.pad={f:-dz(ax[1]||0),s:dz(ax[0]||0),ads:btn(6),fire:btn(7),sprint:btn(10)};P.yaw-=dz(ax[2]||0)*.05;P.pitch=cl(P.pitch-dz(ax[3]||0)*.04,-1.5,1.5);
 if(ed(0))P.jumpQ=true;if(ed(1))P.crouch=P.crouch?0:1;if(ed(2)){if(interactT)interact();else startReload(P);}if(ed(3))swapGun(P);if(ed(4))startPlate(P);if(ed(5))interact();if(ed(8))setMap(!mapOpen);if(ed(9))pause(G.app==='match');
 G.padPrev=bt.map(b=>b.pressed);}

/* ================= camera, visuals, LOD ================= */
const MENU_SHOTS=[{a:[-80,62,95],b:[-30,56,110],l:[10,14,0]},{a:[1,2.6,-150],b:[1,3.2,-108],l:[0,6,0]},{a:[225,22,-70],b:[228,26,40],l:[295,6,0]},{a:[95,34,-185],b:[130,30,-175],l:[170,10,-250]},{a:[-95,42,-205],b:[-118,40,-215],l:[-160,12,-275]}];
let menuShot=0;
function menuCam(dt){menuT+=dt;const S=MENU_SHOTS[menuShot%MENU_SHOTS.length],L=13;const k=Math.min(1,menuT/L),e=k*k*(3-2*k);cam.position.set(S.a[0]+(S.b[0]-S.a[0])*e,S.a[1]+(S.b[1]-S.a[1])*e,S.a[2]+(S.b[2]-S.a[2])*e);cam.lookAt(S.l[0],S.l[1],S.l[2]);cam.fov=55;
 const fade=Math.max(0,1-menuT/1.2,(menuT-L+1.2)/1.2);$('black').style.opacity=(fade*.9).toFixed(2);if(menuT>L){menuT=0;menuShot++;}VM.root.visible=false;}
function camera(dt){shake=Math.max(0,shake-dt*2.4);const aspect=innerWidth/innerHeight;let hf=90;
 if(P.state==='plane'){const pp=G.plane?G.plane.pos:P.pos;const d=fwdOf(P.yaw,P.pitch,tv);cam.position.set(pp.x-d.x*46,pp.y-d.y*46+8,pp.z-d.z*46);cam.lookAt(pp.x,pp.y+2,pp.z);hf=80;VM.root.visible=false;}
 else if(P.car){const c=P.car;const d=fwdOf(P.yaw,cl(P.pitch,-.6,.3)-.18,tv);const want=tv2.set(c.pos.x-d.x*8.5,c.pos.y+3.2-d.y*8.5,c.pos.z-d.z*8.5);const t=W.ray(c.pos.x,c.pos.y+2.4,c.pos.z,want.x-c.pos.x,want.y-c.pos.y-2.4,want.z-c.pos.z,1,2);if(t<1)want.lerpVectors(tv3.set(c.pos.x,c.pos.y+2.4,c.pos.z),want,Math.max(.15,t-.05));cam.position.copy(want);cam.lookAt(c.pos.x,c.pos.y+1.6,c.pos.z);hf=88;VM.root.visible=false;}
 else{const dead=!P.alive;deathT+=dead?dt:0;const eye=P.pos.y+(dead?Math.max(.35,EYE-deathT*2.4):EYE-(EYE-CEYE)*P.crouchV);const bob=P.state==='ground'&&P.onGround?Math.sin((P.bobP=(P.bobP||0)+dt*P.speed*1.7))*.03*Math.min(1,P.speed/4)*(1-P.adsV*.8):0;
  cam.position.set(P.pos.x,eye+bob,P.pos.z);const sk=shake*shake*.03+(P.supp||0)*.004;let cp=P.pitch+(P.recP||0);if(Math.abs(cp)<.002)cp=-.002;cam.rotation.set(cp+(R()-.5)*sk,P.yaw+(P.recY||0)+Math.PI+(R()-.5)*sk,(dead?Math.min(1,deathT)*.6:0)+(P.state==='chute'?Math.sin(G.time*.8)*.03:0));
  const s=gunOf(P)?wstats(gunOf(P)):null;const zoom=s&&P.state==='ground'?1+(s.zoom-1)*P.adsV:1;hf=(P.state==='fall'?100:90)/zoom+(P.sprinting?5:0);
  const scoped=s&&s.scope&&P.adsV>.92&&P.alive;$('scope').hidden=!scoped;
  VM.root.visible=P.alive&&P.state==='ground'&&!scoped&&!G.autopilot;if(VM.root.visible&&s)VM.update({dt,ads:(mouse.r||(G.pad&&G.pad.ads))&&P.plateT<=0?1:0,adsSpeed:1/Math.max(.08,s.ergo)*2.2,sprint:P.sprinting,speed:P.speed,mdx:VM.mdx||0,mdy:VM.mdy||0,reload:P.reloadT>0?(P.reloadTube?1-P.reloadT/P.reloadDur:1-P.reloadT/P.reloadDur):-1,low:P.plateT>0?1:0,eyeZ:s.eyeZ,onGround:P.onGround,plate:P.plateT>0?1-P.plateT/1.05:0});}
 if(P.state!=='plane'&&!P.car)void 0;cam.fov=2*Math.atan(Math.tan(hf*D2R/2)/aspect)/D2R;cam.updateProjectionMatrix();
 sky.mesh.position.copy(cam.position);snd.listener(cam.position.x,cam.position.y,cam.position.z,(P.state==='ground'?P.yaw:P.yaw)+Math.PI);
 if(P.state!=='ground'||!P.alive||P.car)$('scope').hidden=true;}
function lod(){IMP.begin();const cx=cam.position.x,cz=cam.position.z,cy=cam.position.y;const near=gfx===0?60:gfx===1?95:120,far=520;
 for(const a of G.actors){if(a.isPlayer){a.chute.visible=a.state==='chute';if(a.chute.visible){a.chute.position.copy(a.pos);a.chute.rotation.set(0,a.yaw,0);}continue;}
  const vis=a.state!=='plane'&&!a.car&&(a.alive||a.deadT<30)&&!(a.out&&a.deadT>30);const d=Math.hypot(a.pos.x-cx,a.pos.z-cz,(a.pos.y-cy)*.5);const r=a.rig;
  // rover drivers sit behind the wheel (left seat), visible through the glass
  if(a.car&&a.alive){const c=a.car,sn=Math.sin(c.yaw),cs=Math.cos(c.yaw);if(d<near){r.root.visible=true;r.root.position.set(c.pos.x+.45*cs-.1*sn,c.pos.y+.6,c.pos.z-.45*sn-.1*cs);r.root.rotation.set(0,c.yaw,0);r.update(a._dt||.016,{speed:0,seat:1,pitch:0,reload:-1});r.b.gun.visible=false;}else r.root.visible=false;a.chute.visible=false;continue;}
  if(a.state==='chute'){a.chute.visible=d<900;a.chute.position.copy(a.pos);a.chute.rotation.set(0,a.yaw,Math.sin(G.time+a.id)*.06);}else a.chute.visible=false;
  if(vis&&d<near){r.root.visible=true;r.root.position.copy(a.pos);r.root.rotation.set(a.state==='fall'?1.25:0,a.yaw,0);
   const it=gunOf(a);const vf=a.vel.x*Math.sin(a.yaw)+a.vel.z*Math.cos(a.yaw),vs=a.vel.x*-Math.cos(a.yaw)+a.vel.z*Math.sin(a.yaw);
   r.update(a._dt||.016,{speed:a.state==='ground'?a.speed:0,vf,vs:-vs,crouch:0,pitch:a.pitch,aim:a.ai&&a.ai.target&&G.time-a.ai.seenT<1.5,sprint:a.in.sprint&&a.speed>5,reload:a.reloadT>0&&a.reloadDur?1-a.reloadT/a.reloadDur:-1,dead:!a.alive});
   r.b.gun.visible=!!it||!a.alive;}
  else{r.root.visible=false;if(vis&&d<far)IMP.add(a.pos,a.yaw,KITS[a.kitI][2],!a.alive);}}
 IMP.end();}
let beamT=0;function lootVis(dt){if((beamT-=dt||.016)<=0){beamT=.3;beams();}const cx=cam.position.x,cz=cam.position.z;for(const l of G.loot){if(!l.mesh)continue;const dx=l.p.x-cx,dz=l.p.z-cz;l.mesh.visible=dx*dx+dz*dz<75*75;}}

/* ================= main step ================= */
let lastPanel=0;
function step(dt){dt=cl(dt||0,0,.05);
 if(G.app==='menu'){G.time+=dt;menuCam(dt);ambient(dt);fx.update(dt);return;}
 if(G.app!=='match'){return;}
 G.time+=dt;G.matchLeft=Math.max(0,MATCH-G.time);G.pathBudget=3;readPad();
 planeTick(dt);gasTick(dt);gasDamage(dt);G.uavT=Math.max(0,G.uavT-dt);
 playerTick(dt);
 for(const a of G.actors){a._dt=dt;if(a.alive&&!a.isPlayer&&!a.car){if(!(G.duel&&a.inGulag&&G.duel.t<0))thinkBot(a,G,dt);else{a.in.fire=false;a.in.mx=a.in.mz=0;}}actorTick(a,dt);}
 for(const c of G.cars)carTick(c,dt);for(const d of G.drops)dropTick(d,dt);
 duelTick(dt);botGulag(dt);autoPickup();if(lootDirty)rebuildLoot();
 // player down -> cage or out
 if(!P.alive&&!P.out&&!P.inGulag){if(deathT>2.6){if(gulagOpen()&&!P.gulagUsed)enterGulag();else eliminate(P);}}
 if(resultT>0){resultT-=dt;if(resultT<=0)finish(P.won?'win':'dead');}
 if(G.time>=MATCH&&G.app==='match')finish('time');
 G.remaining=remaining();
 interactT=findInteract();
 camera(dt);lod();lootVis(dt);fx.update(dt);hud.tick(dt);ambient(dt);
 gasV.update(G.gas.cur.x,G.gas.cur.z,G.gas.cur.r,G.time,G.gas.cur.r<430);
 // HUD
 lastPanel-=dt;if(lastPanel<=0){lastPanel=.05;hudFrame();}}
function hudFrame(){hud.panels(G,P);const pr=$('prompt');const t=interactT?`<kbd>E</kbd> ${interactT.t}`:P.state==='plane'?'<kbd>SPACE</kbd> JUMP':P.state==='fall'?'<kbd>SPACE</kbd> DEPLOY PARACHUTE':'';if(hud.cache.pr!==t){hud.cache.pr=t;pr.innerHTML=t;if(interactT&&interactT.c)pr.style.setProperty('--rc',interactT.c);else pr.style.removeProperty('--rc');}
 const g=G.gas.cur;const bear=a=>((Math.PI-Math.atan2(a.x-P.pos.x,a.z-P.pos.z))*180/Math.PI+360)%360;const marks=[];if(outside(P)&&!P.inGulag)marks.push({b:bear(G.gas.next),c:'#fff',t:Math.round(Math.hypot(G.gas.next.x-P.pos.x,G.gas.next.z-P.pos.z))+'m'});for(const d of G.drops)if(!d.opened&&d.owner===P)marks.push({b:bear(d.pos),c:'#ff4a2a',t:'DROP'});
 hud.compass(P.state==='plane'?P.yaw:P.car?P.car.yaw:P.yaw,marks);hud.minimap(G,P,P.car?P.car.yaw:P.yaw);if(mapOpen)hud.bigmap(G,P);
 const out=outside(P)&&P.alive&&!P.inGulag&&P.state!=='plane';$('gasfx').style.opacity=out?.75:0;$('hurt').style.opacity=Math.min(.85,(P.flash||0)+(P.alive&&P.hp<40?(.4-P.hp/100)*1.2:0)).toFixed(2);
 $('xh').style.opacity=P.state==='ground'&&!P.car&&P.alive&&P.adsV<.5?1:0;const s=gunOf(P)?wstats(gunOf(P)):null;if(s){const sp=(s.hip*(1-P.adsV)+s.ads*P.adsV)*s.spr*(1+Math.min(1,P.speed/5))*(P.onGround?1:2.2);$('xh').style.setProperty('--g',(6+sp*7).toFixed(0)+'px');}
 const ring=$('prog');if(P.plateT>0||(P.reloadT>0&&!P.reloadTube)){ring.hidden=false;const f=P.plateT>0?1-P.plateT/1.05:1-P.reloadT/P.reloadDur;$('progc').setAttribute('stroke-dasharray',(f*163).toFixed(1)+' 200');$('progt').textContent=P.plateT>0?'PLATING':'RELOADING';}else ring.hidden=true;
 if(buyOpen){if(!buyAt||Math.hypot(buyAt.x-P.pos.x,buyAt.z-P.pos.z)>4||!P.alive)closeBuy();else $('bcash').textContent='$'+P.cash.toLocaleString();}
 let zn='';if(P.inGulag)zn='THE CAGE';else{for(const p of MAP.pois)if(Math.hypot(p.x-P.pos.x,p.z-P.pos.z)<p.r*.8){zn=p.n;break;}}G.zone=zn;
 $('vit').style.visibility=$('wpn').style.visibility=P.state==='plane'?'hidden':'visible';$('keyhint').textContent=P.state==='plane'?'MOUSE LOOK · SPACE JUMP · M MAP':P.state!=='ground'?'W DIVE · A/D STEER · SPACE CHUTE':P.car?'W/S DRIVE · A/D STEER · E EXIT':'E INTERACT · V PLATE · R RELOAD · 1/2 SWAP · M MAP';
 if(G.duel){const D=G.duel;$('duel').hidden=false;$('duel').textContent=!D.o?'WAITING FOR OPPONENT '+Math.ceil(D.wait):D.t<0?'FIGHT IN '+Math.ceil(-D.t):'OVERTIME IN '+Math.ceil(40-D.t);}else $('duel').hidden=true;}
function ambient(dt){const p=G.app==='menu'?cam.position:P.pos;const seaD=LAND-Math.max(Math.abs(p.x),Math.abs(p.z));snd.ambient(dt,{on:G.app==='menu'||G.app==='match',seaD:Math.max(0,seaD),rain:false,indoor:G.app==='match'&&P.state==='ground'&&W.roofed(p.x,p.z,p.y),high:Math.max(0,(p.y-10)/120)});
 if(G.app==='match')snd.loops({plane:P.state==='plane'?.55:G.plane?Math.max(0,.3-G.plane.pos.distanceTo(P.pos)/800):0,fall:P.state==='fall'?.5+Math.min(.4,-P.vel.y/120):P.state==='chute'?.12:0,gas:outside(P)&&!P.inGulag&&P.alive?.35:0});
 if(G.app==='match'&&!(P.car&&P.car.driver===P))snd.engine(0,0);}

/* ================= rendering ================= */
class VMPass extends Pass{constructor(){super();this.needsSwap=false;}render(r,wb,rb){if(!VM.root.visible||G.app!=='match'&&G.app!=='paused')return;const ac=r.autoClear;r.autoClear=false;r.setRenderTarget(this.renderToScreen?null:rb);r.clearDepth();r.render(vmScene,vmCam);r.autoClear=ac;}}
let gfx=quality(),fxStack=null,fxSize='',frameN=0;
function applyQuality(q){gfx=q;Rr.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.1:.75));fxStack=null;fxSize='';sun.castShadow=q>0;const ms=q>=2?2048:1024;sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}Rr.shadowMap.needsUpdate=true;
}
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));
function render(){const w=innerWidth,h=innerHeight;if(Rr.domElement.width!==Math.floor(w*Rr.getPixelRatio())||Rr.domElement.height!==Math.floor(h*Rr.getPixelRatio()))Rr.setSize(w,h,false);
 cam.aspect=w/h;cam.updateProjectionMatrix();vmCam.aspect=w/h;vmCam.updateProjectionMatrix();
 const sc=h*Rr.getPixelRatio()/(2*Math.tan(cam.fov*D2R/2));fx.dust.U.uScale.value=fx.spark.U.uScale.value=sc;sea.U.uT.value=G.time;sky.U.uT.value=G.time;
 const cy=cam.position.y;scene.fog.density=.0017*(1-Math.min(.55,Math.max(0,cy-20)/400));
 // shadow frustum follows the view (wide when airborne), texel-snapped
 const S=cy>60?240:70,ms=sun.shadow.mapSize.x,tex=2*S/ms;const sc2=sun.shadow.camera;if(sc2.right!==S){Object.assign(sc2,{left:-S,right:S,top:S,bottom:-S});sc2.updateProjectionMatrix();}
 const f=fwdOf(G.app==='match'?P.yaw:0,0,tv);const c=tv2.copy(cam.position).addScaledVector(f,G.app==='match'?S*.4:0);sun.target.position.set(Math.round(c.x/tex)*tex,0,Math.round(c.z/tex)*tex);sun.position.copy(sun.target.position).addScaledVector(sunDir,300);sun.target.updateMatrixWorld();
 frameN++;if(gfx>=2||(gfx===1&&frameN%2===0)||frameN<4)Rr.shadowMap.needsUpdate=true;
 const key=w+'x'+h;if(!fxStack){fxStack=cinematic(Rr,scene,cam,{exposure:1.05,bloom:.3,bloomThreshold:.9,bloomRadius:.4,saturation:1.1,tint:0xfff4e6,vignette:.38,grain:.03,aoStrength:.8,quality:gfx});if(fxStack.composer)fxStack.composer.insertPass(new VMPass(),fxStack.ao?2:1);fxSize='';}
 if(fxSize!==key){fxSize=key;fxStack.setSize(w,h);}
 if(fxStack.grade){const hf=G.app==='match'&&P.alive?Math.min(1,P.hp/45):1;fxStack.grade.uniforms.sat.value=1.1*(.35+.65*hf);}
 if(fxStack.composer)fxStack.render();else{Rr.autoClear=true;Rr.render(scene,cam);if(VM.root.visible&&G.app==='match'){Rr.autoClear=false;Rr.clearDepth();Rr.render(vmScene,vmCam);Rr.autoClear=true;}}}

/* ================= menu wiring ================= */
const seg=pickers(OPT,saveOpt);seg('o-diff','diff',true,()=>snd.click());seg('o-sens','sens',true,()=>snd.click());
function toMenu(){G.app='menu';$('menu').hidden=false;$('hud').hidden=true;$('over').hidden=true;$('pause').hidden=true;$('clickp').hidden=true;closeBuy();setMap(false);unlock();plane.visible=false;for(const a of G.actors){if(a.rig)a.rig.root.visible=false;a.chute.visible=false;}
 IMP.begin();IMP.end();gasV.update(0,0,470,0,false);$('mbest').textContent=bestScore(ID)?'BEST '+bestScore(ID).toLocaleString()+' PTS':'';snd.loops({});snd.engine(0,0);}
$('go').onclick=()=>{snd.init();start();lock();};
$('again').onclick=()=>{snd.click();toMenu();};$('resume').onclick=()=>pause(false);$('quit').onclick=()=>{$('pause').hidden=true;G.app='match';if(!P.out){P.killer='';eliminate(P);}finish('quit');};
postButton($('post'),ID,()=>{const a=lastAward||{};
 return[a.pts||0,`Game: DROPZONE\nScore: ${a.pts||0}\nPlacement: #${a.place||'-'} of ${NACT}${a.won?' (VICTORY)':''}\nEliminations: ${a.kills||0} · Damage: ${a.dmg||0}\nThe Cage: ${a.cage||'-'}\nCPU difficulty: ${a.diff||''}\nTime survived: ${mmss(a.t||0)}`];});

addEventListener('pointerdown',()=>snd.init(),{once:true});

/* ================= boot + loop ================= */
toMenu();
let last=performance.now();function loop(now){const dt=Math.max(0,Math.min(.05,(now-last)/1000));last=now;try{step(dt);render();}catch(e){console.error(e);}requestAnimationFrame(loop);}requestAnimationFrame(loop);

/* ================= test hooks ================= */
window.DROPZONE={get state(){return G.app;},G,MAP,W,nav,scene,cam,R:Rr,keys,mouse,VM,fx,
 get player(){return P;},get bots(){return G.actors.filter(a=>!a.isPlayer);},get round(){const g=G.gas;return{time:G.time,left:G.matchLeft,phase:g&&g.phase,gas:g&&{state:g.state,left:g.left,cur:{...g.cur},next:{...g.next}},remaining:remaining(),alive:G.actors.filter(a=>!a.out&&a.alive&&!a.inGulag).length,duel:!!G.duel,plane:!!G.plane};},
 get score(){return lastAward?lastAward.pts:Math.max(0,P.kills*100+Math.round(P.dmg*.2));},get award(){return lastAward;},
 step,render,start:o=>start(o||{}),toMenu,finish,pause,setQuality:applyQuality,get gfx(){return gfx;},
 jump:()=>{if(P.state==='plane'&&G.plane)jumpOut(P);},interact,buy:i=>{buy(i);},openBuy,enterGulag,kill:(v,src)=>damage(v||P,999,src||null,'body',null,'gun'),fire:()=>fire(P),giveLoadout:k=>giveLoadout(P,k),eliminate,redeploy,
 set god(v){G.god=v;},get crates(){return G.crates;},get cars(){return G.cars;},enterCar:c=>enterCar(P,c),
 teleport:(x,y,z,yaw)=>{P.pos.set(x,y,z);P.vel.set(0,0,0);if(yaw!==undefined)P.yaw=yaw;P.state='ground';P.chute.visible=false;VM.set(gunOf(P));},setMap};
