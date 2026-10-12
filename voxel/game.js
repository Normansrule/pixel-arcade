// VOXEL FRONTIER — main: renderer + quality tiers, player physics, mining / placing / combat, crafting and inventory,
// survival objectives (light the BEACON), day/night, creature spawning, drops, TNT, HUD, menus, results, saving.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {B,ITEMS,RECIPES,GROUP,CREATIVE,LOGS,AT,SOL,OPQ,LIQ,PLANT,nameOf,isTool,icon,extruded,blockCube,CRACK,glyph,hash} from './blocks.js';
import * as Wd from './world.js';
import {CS,CH,SEA,LC,BIO} from './world.js';
import {makeMaterials,sky,clouds,placeClouds,applyLighting,U,skyU} from './gfx.js';
import {Mobs,KINDS} from './mobs.js';
import {Sound} from './sound.js';

const $=id=>document.getElementById(id);
const mmss=t=>{t=Math.max(0,Math.ceil(t));return (t/60|0)+':'+String(t%60).padStart(2,'0');};
const clamp=(v,a,b)=>v<a?a:v>b?b:v;

/* ================= renderer / scene ================= */
const canvas=$('c');const R=new THREE.WebGLRenderer({canvas,antialias:false,powerPreference:'high-performance'});R.setPixelRatio(Math.min(devicePixelRatio,1.25));
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();const cam=new THREE.PerspectiveCamera(78,1,.05,700);scene.add(cam);
scene.fog=new THREE.Fog(0x8ab0e0,50,90);
const mats=makeMaterials();scene.add(sky,clouds);
const sun=new THREE.DirectionalLight(0xffffff,3);sun.castShadow=true;sun.shadow.bias=-.0004;sun.shadow.normalBias=.05;scene.add(sun,sun.target);
const hemi=new THREE.HemisphereLight(0xbcd8ff,0x5a4a3a,1);scene.add(hemi);
const heldLight=new THREE.PointLight(0xffa048,0,14,1.6);scene.add(heldLight);const flash=new THREE.PointLight(0xffc080,0,28,1.4);scene.add(flash);
const sunDir=new THREE.Vector3();
let gfxQ=quality(),RD=6,SH=48,fx=null,lightInfo={day:1,night:0};
function applyQuality(q){gfxQ=q;RD=[4,6,7][q];SH=[30,40,52][q];Wd.setShadowR(Math.ceil(SH/CS));const sm=[0,1024,2048][q];const shadows=q>0;
 if(R.shadowMap.enabled!==shadows){R.shadowMap.enabled=shadows;mats.solid.needsUpdate=true;mats.cut.needsUpdate=true;mats.water.needsUpdate=true;}sun.castShadow=shadows;
 if(shadows&&sun.shadow.mapSize.x!==sm){sun.shadow.mapSize.set(sm,sm);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 Object.assign(sun.shadow.camera,{left:-SH,right:SH,top:SH,bottom:-SH,near:20,far:180});sun.shadow.camera.updateProjectionMatrix();
 R.setPixelRatio(Math.min(devicePixelRatio,q===0?1:1.25));
 fx=cinematic(R,scene,cam,{quality:q,exposure:1.0,bloom:.36,bloomThreshold:1.0,bloomRadius:.4,vignette:.3,saturation:1.16,grain:.018,ao:false});resize();}
function resize(){R.setSize(innerWidth,innerHeight,false);cam.aspect=innerWidth/innerHeight;cam.updateProjectionMatrix();fx&&fx.setSize(innerWidth,innerHeight);}
addEventListener('resize',resize);

/* ================= audio ================= */
const snd=new Sound();
const sfx=(k,p)=>{if(!snd.ac)return;if(k==='hiss'||k in KINDS||k==='bow'||k==='thunk'||k==='crawl')snd.mob(k==='crawl'?'crawler':k,p);};

/* ================= game state ================= */
const P={x:.5,y:60,z:.5,vx:0,vy:0,vz:0,yaw:0,pitch:0,on:false,fly:false,hp:20,food:20,air:10,inWater:false,lastHurt:-9,stepD:0};
const W2=.3,PH=1.8;
let state='menu',mode='survival',diff=1,timeMode=1200,timeLeft=1200,inv={},hot=Array(9).fill(0),slot=0,score=0,dayT=.05,nights=0,wasNight=false,dead=false,deadT=0,goal=0,crafted={},got={},lives=3,spawnPt={x:0,y:60,z:0},clock=0,result=null,won=false;
let stats={mined:0,ores:0,kills:0,placed:0,crafted:0,deaths:0};
const DIFF=[{n:'EASY',lives:5,cap:3,dmg:.6,hp:.8,spd:.85,hunger:.6,d:'5 lives · gentle creatures · slow hunger'},{n:'NORMAL',lives:3,cap:5,dmg:1,hp:1,spd:1,hunger:1,d:'3 lives · the frontier as intended'},{n:'HARD',lives:2,cap:8,dmg:1.45,hp:1.25,spd:1.15,hunger:1.3,d:'2 lives · packs of fast, hard-hitting creatures'}];
const D=()=>DIFF[diff];
const tier=()=>mode==='creative'?4:Math.max(0,...Object.keys(inv).filter(k=>inv[k]>0&&ITEMS[k]?.pick).map(k=>ITEMS[k].pick));
const swordDmg=()=>Math.max(1,...Object.keys(inv).filter(k=>inv[k]>0&&ITEMS[k]?.sword).map(k=>ITEMS[k].sword));
const armor=()=>Math.max(0,...Object.keys(inv).filter(k=>inv[k]>0&&ITEMS[k]?.armor).map(k=>ITEMS[k].armor));
const pickName=t=>['BARE HANDS','WOOD PICKAXE','STONE PICKAXE','IRON PICKAXE','DIAMOND PICKAXE'][t];
const hotable=id=>id<100||ITEMS[id]?.food||ITEMS[id]?.pick||ITEMS[id]?.sword;
let barDirty=true;
function give(id,n=1,quiet){inv[id]=(inv[id]||0)+n;got[id]=(got[id]||0)+n;if(hotable(id)&&!hot.includes(id)){const e=hot.indexOf(0);if(e>=0)hot[e]=id;}barDirty=true;if(!quiet)feed(id,n);const si=hot.indexOf(id);if(si>=0)bumpSlot(si);}
function take(id,n=1){if(mode==='creative')return;inv[id]=(inv[id]||0)-n;if(inv[id]<=0){delete inv[id];const i=hot.indexOf(id);if(i>=0)hot[i]=0;}barDirty=true;}
const sel=()=>mode==='creative'?CREATIVE_HOT[slot]:hot[slot];
let CREATIVE_HOT=CREATIVE.slice(0,9);

/* ================= world helpers ================= */
const get=Wd.get;
function collides(x,y,z){for(let bx=Math.floor(x-W2);bx<=Math.floor(x+W2-1e-6);bx++)for(let by=Math.floor(y);by<=Math.floor(y+PH-1e-6);by++)for(let bz=Math.floor(z-W2);bz<=Math.floor(z+W2-1e-6);bz++)if(SOL[get(bx,by,bz)])return true;return false;}
function raycast(o,d,maxD){let x=Math.floor(o.x),y=Math.floor(o.y),z=Math.floor(o.z);const sx=Math.sign(d.x),sy=Math.sign(d.y),sz=Math.sign(d.z);
 const tdx=Math.abs(1/d.x),tdy=Math.abs(1/d.y),tdz=Math.abs(1/d.z);let tx=(sx>0?x+1-o.x:o.x-x)*tdx,ty=(sy>0?y+1-o.y:o.y-y)*tdy,tz=(sz>0?z+1-o.z:o.z-z)*tdz;let px=x,py=y,pz=z,t=0;
 while(t<maxD){const id=get(x,y,z);if(id&&!LIQ[id])return{x,y,z,px,py,pz,id,t};px=x;py=y;pz=z;if(tx<ty&&tx<tz){x+=sx;t=tx;tx+=tdx;}else if(ty<tz){y+=sy;t=ty;ty+=tdy;}else{z+=sz;t=tz;tz+=tdz;}}return null;}
const eye=()=>new THREE.Vector3(P.x,P.y+1.62,P.z);const look=()=>new THREE.Vector3(0,0,-1).applyEuler(new THREE.Euler(P.pitch,P.yaw,0,'YXZ'));
// set + local physics (falling sand, water refill, support for plants)
function setBlock(x,y,z,id){if(!Wd.set(x,y,z,id))return;if(id===0){
  const up=get(x,y+1,z);if(PLANT[up]){Wd.set(x,y+1,z,0);if(mode==='survival'&&up!==36)spawnDrop(x+.5,y+1.4,z+.5,B[up].drop??up,1);}
  else if(B[up]?.fall){let yy=y+1;while(B[get(x,yy,z)]?.fall){const f=get(x,yy,z);Wd.set(x,yy,z,0);Wd.set(x,yy-1,z,f);yy++;}}
  if(y<=SEA&&(get(x+1,y,z)===5||get(x-1,y,z)===5||get(x,y,z+1)===5||get(x,y,z-1)===5||get(x,y+1,z)===5))Wd.set(x,y,z,5);
  if(get(x,y+1,z)===20||get(x+1,y,z)===20||get(x-1,y,z)===20||get(x,y,z+1)===20||get(x,y,z-1)===20)if(y<=10)Wd.set(x,y,z,20);}
 saveSoon();}
function lightAt(x,y,z){return Wd.lightAt(x,y,z);}
function spawnPoint(){const ok=(x,z)=>{const T=Wd.column(x,z);if(T.bio===6||T.bio===3||T.bio===8||T.bio===7||T.h<SEA+2||T.h>SEA+18)return false;for(const[a,b]of[[1,0],[-1,0],[0,1],[0,-1],[2,2],[-2,-2]])if(Math.abs(Wd.column(x+a,z+b).h-T.h)>1)return false;return true;};
 let x=0,z=0;for(let tr=0;tr<900;tr++){const a=tr*.7,r=tr*2.5;x=Math.round(Math.cos(a)*r);z=Math.round(Math.sin(a)*r);if(ok(x,z)){const y=Wd.topY(x,z),b=get(x,y,z);if(b===1||b===10||b===29||b===2)break;}}
 const y=Wd.topY(x,z);return{x:x+.5,y:y+1.02,z:z+.5};}
function placePlayer(p){P.x=p.x;P.z=p.z;P.y=p.y;Wd.chunk(Math.floor(p.x/CS),Math.floor(p.z/CS));const ty=Wd.topY(Math.floor(p.x),Math.floor(p.z));if(P.y<ty+1)P.y=ty+1.02;P.vx=P.vy=P.vz=0;}

/* ================= particles, drops, overlays ================= */
const tileCol=(()=>{const d=AT.small.getContext('2d').getImageData(0,0,256,64).data,out=[];for(let t=0;t<64;t++){let r=0,g=0,b=0,n=0;const ox=(t%16)*16,oy=(t>>4)*16;for(let y=0;y<16;y+=2)for(let x=0;x<16;x+=2){const i=((oy+y)*256+ox+x)*4;if(d[i+3]<128)continue;r+=d[i];g+=d[i+1];b+=d[i+2];n++;}out.push(new THREE.Color(n?r/n/255:.5,n?g/n/255:.5,n?b/n/255:.5).convertSRGBToLinear());}return out;})();
const DN=420,dMesh=new THREE.InstancedMesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshLambertMaterial({}),DN);dMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);dMesh.frustumCulled=false;scene.add(dMesh);
const parts=[];let pHead=0;const _m=new THREE.Matrix4(),_q=new THREE.Quaternion(),_e=new THREE.Euler(),_s=new THREE.Vector3(),_p=new THREE.Vector3(),_c=new THREE.Color();
for(let i=0;i<DN;i++){parts.push({t:0});dMesh.setColorAt(i,_c.setRGB(1,1,1));}
function emit(x,y,z,col,n,o={}){const pw=o.power??1;for(let i=0;i<n;i++){const k=pHead;pHead=(pHead+1)%DN;const p=parts[k];Object.assign(p,{x:x+(Math.random()-.5)*(o.spread??.6),y:y+(Math.random()-.5)*(o.spread??.6),z:z+(Math.random()-.5)*(o.spread??.6),vx:(Math.random()-.5)*3*pw,vy:(o.up??(1+Math.random()*3))*pw,vz:(Math.random()-.5)*3*pw,t:(o.life??.7)+Math.random()*.5,t0:1,s:(o.size??.09)+Math.random()*.08,r:Math.random()*6,g:o.g??18,lit:o.lit??1});p.t0=p.t;
  _c.copy(col);if(o.jit)_c.offsetHSL(0,0,(Math.random()-.5)*o.jit);_c.multiplyScalar(p.lit);dMesh.setColorAt(k,_c);}dMesh.instanceColor.needsUpdate=true;}
function debris(x,y,z,id,n,power=1){const bd=B[id];if(!bd)return;const lt=lightAt(x,y,z);const l=Math.max(LC[lt>>4]*(.3+.7*lightInfo.day),LC[lt&15],.18);emit(x,y,z,tileCol[bd.s],n,{power,jit:.12,lit:l});}
const smoke=(x,y,z,n=6)=>emit(x,y,z,new THREE.Color(.5,.5,.52),n,{up:1.5,g:-2,life:.9,size:.14,power:.6});
function stepParts(dt){for(let i=0;i<DN;i++){const p=parts[i];if(p.t<=0){if(p.t>-1){p.t=-2;_m.makeScale(0,0,0);dMesh.setMatrixAt(i,_m);}continue;}p.t-=dt;p.vy-=p.g*dt;p.x+=p.vx*dt;p.z+=p.vz*dt;const ny=p.y+p.vy*dt;
  if(p.g>0&&SOL[get(Math.floor(p.x),Math.floor(ny-p.s/2),Math.floor(p.z))]){p.vy*=-.3;p.vx*=.6;p.vz*=.6;}else p.y=ny;p.r+=dt*6;const sc=p.s*Math.min(1,p.t*3);_m.compose(_p.set(p.x,p.y,p.z),_q.setFromEuler(_e.set(p.r,p.r*.7,0)),_s.set(sc,sc,sc));dMesh.setMatrixAt(i,_m);}dMesh.instanceMatrix.needsUpdate=true;}
// dropped items
const dropMatB=new THREE.MeshLambertMaterial({map:AT.map,alphaTest:.5}),dropMatI=new THREE.MeshLambertMaterial({vertexColors:true});const drops=[];
function spawnDrop(x,y,z,id,n=1,vel){if(!id||mode==='creative')return;if(drops.length>70){const o=drops.shift();scene.remove(o.mesh);}
 const blockLike=id<100&&!PLANT[id];const mesh=new THREE.Mesh(blockLike?blockCube(id,.26):extruded(id<100?id:id),blockLike?dropMatB:dropMatI);if(!blockLike)mesh.scale.setScalar(.42);mesh.castShadow=true;mesh.position.set(x,y,z);scene.add(mesh);
 drops.push({mesh,id,n,vx:vel?vel.x:(Math.random()-.5)*2.4,vy:vel?vel.y:3.2,vz:vel?vel.z:(Math.random()-.5)*2.4,age:0,t:Math.random()*6});}
function stepDrops(dt){for(const d of drops.slice()){d.age+=dt;d.t+=dt;const p=d.mesh.position;const dx=P.x-p.x,dy=P.y+.8-p.y,dz=P.z-p.z,dist=Math.hypot(dx,dy,dz);
  if(d.age>.45&&dist<3&&!dead){const k=Math.min(1,dt*10);d.vx+=(dx/dist*9-d.vx)*k;d.vy+=(dy/dist*9-d.vy)*k;d.vz+=(dz/dist*9-d.vz)*k;p.x+=d.vx*dt;p.y+=d.vy*dt;p.z+=d.vz*dt;
   if(dist<.9){scene.remove(d.mesh);drops.splice(drops.indexOf(d),1);give(d.id,d.n);snd.pop(Math.min(6,(popChain++)%7));popT=.4;continue;}}
  else{d.vy-=20*dt;p.x+=d.vx*dt;p.z+=d.vz*dt;const ny=p.y+d.vy*dt;if(SOL[get(Math.floor(p.x),Math.floor(ny-.15),Math.floor(p.z))]){d.vy=0;d.vx*=.8;d.vz*=.8;p.y=Math.floor(ny-.15)+1.15;}else p.y=ny;
   if(SOL[get(Math.floor(p.x),Math.floor(p.y),Math.floor(p.z))])p.y+=dt*4;}
  d.mesh.rotation.y=d.t*1.8;d.mesh.position.y+=Math.sin(d.t*3)*.002;if(d.age>180){scene.remove(d.mesh);drops.splice(drops.indexOf(d),1);}}}
let popChain=0,popT=0;
// crack overlay + highlight + place pop
const crackMat=new THREE.MeshBasicMaterial({map:CRACK,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2,opacity:.85});
const crack=new THREE.Mesh(new THREE.BoxGeometry(1.004,1.004,1.004),crackMat);crack.visible=false;scene.add(crack);
const hl=new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(1.006,1.006,1.006)),new THREE.LineBasicMaterial({color:0x000000,transparent:true,opacity:.55}));hl.visible=false;scene.add(hl);
const popMesh=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.35,depthWrite:false}));popMesh.visible=false;scene.add(popMesh);let popA=0;
// beacon beam
const beam=new THREE.Mesh(new THREE.CylinderGeometry(.32,.32,160,12,1,true),new THREE.MeshBasicMaterial({color:0x7af8ff,transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,fog:false}));beam.visible=false;scene.add(beam);

/* ================= TNT + explosions ================= */
const primed=[];let shakeT=0,flashT=0;
function ignite(x,y,z,fuse){const m=new THREE.Mesh(blockCube(22,.98),new THREE.MeshLambertMaterial({map:AT.map,emissive:0xffffff,emissiveIntensity:0}));m.castShadow=true;m.position.set(x+.5,y+.5,z+.5);scene.add(m);primed.push({m,t:fuse,vy:3});snd.fuse(m.position);}
function explode(x,y,z,r,fromMob){snd.boom({x,y,z},r/3.4);shakeT=Math.max(shakeT,.7*Math.min(1,14/Math.max(3,Math.hypot(P.x-x,P.y-y,P.z-z))));flash.position.set(x,y+1,z);flash.intensity=200;
 const cx=Math.floor(x),cy=Math.floor(y),cz=Math.floor(z),R2=Math.ceil(r);let blasted=0;const rr=fromMob&&diff===0?r*.6:r;
 for(let dx=-R2;dx<=R2;dx++)for(let dy=-R2;dy<=R2;dy++)for(let dz=-R2;dz<=R2;dz++){const d=Math.hypot(dx,dy,dz);if(d>rr*(.78+.35*hash(cx+dx,cy+dy,cz+dz,7)))continue;const bx=cx+dx,by=cy+dy,bz=cz+dz,id=get(bx,by,bz);if(!id||id===16||LIQ[id]||id===44)continue;
  if(B[id].tnt){Wd.set(bx,by,bz,0);ignite(bx,by,bz,.35+Math.random()*.5);continue;}if(Math.random()<.4)debris(bx+.5,by+.5,bz+.5,id,2,2);Wd.set(bx,by,bz,0);blasted++;if(mode==='survival'&&Math.random()<.25&&!PLANT[id])spawnDrop(bx+.5,by+.5,bz+.5,B[id].drop??id,1,{x:(bx-cx)*1.5,y:4,z:(bz-cz)*1.5});}
 emit(x,y,z,new THREE.Color(1,.7,.3),30,{power:3,life:.4,size:.12,g:4});smoke(x,y+.5,z,24);
 if(!fromMob)score+=blasted;const pd=Math.hypot(P.x-x,P.y+.9-y,P.z-z);if(pd<r*2.2)hurtPlayer(Math.round(Math.max(1,(r*2.2-pd)*2.8)),{x,z},'blast');
 for(const m of mobs.list){const q=m.pos,md=Math.hypot(q.x-x,q.y-y,q.z-z);if(md<r*2&&!m.exploded){if(mobs.damage(m,(r*2-md)*5,{x,z},2)&&!fromMob)m.byPlayer=true;}}saveSoon();}
function stepPrimed(dt){for(const p of primed.slice()){p.t-=dt;p.vy-=20*dt;const ny=p.m.position.y+p.vy*dt;if(SOL[get(Math.floor(p.m.position.x),Math.floor(ny-.5),Math.floor(p.m.position.z))]){p.vy=0;p.m.position.y=Math.floor(ny-.5)+1.5;}else p.m.position.y=ny;
  const on=Math.sin(p.t*(p.t<1?30:12))>0;p.m.material.emissiveIntensity=on?1.2:0;p.m.scale.setScalar(1+(p.t<.4?(.4-p.t)*.5:0));if(Math.random()<dt*20)smoke(p.m.position.x,p.m.position.y+.6,p.m.position.z,1);
  if(p.t<=0){scene.remove(p.m);p.m.material.dispose();primed.splice(primed.indexOf(p),1);explode(p.m.position.x,p.m.position.y,p.m.position.z,3.4);}}
 if(flash.intensity>0)flash.intensity=Math.max(0,flash.intensity-dt*600);}

/* ================= creatures ================= */
const mobs=new Mobs(scene,{get,light:lightAt,lc:l=>LC[l],dayF:()=>.3+.7*lightInfo.day,inWater:p=>!!LIQ[get(Math.floor(p.x),Math.floor(p.y+.3),Math.floor(p.z))],alive:()=>!dead&&mode==='survival',
 hurtPlayer:(n,from,kind)=>hurtPlayer(n,from,kind),explode:(x,y,z,r,fm)=>explode(x,y,z,r,fm),sfx,smoke:(x,y,z)=>smoke(x,y,z,5),diff:()=>diff,dmgMul:()=>D().dmg,hpMul:()=>D().hp,spdMul:()=>D().spd,
 onDeath:m=>{const p=m.pos;smoke(p.x,p.y+.6,p.z,10);if(m.exploded)return;if(m.byPlayer!==false){stats.kills++;const pts={shambler:50,bonewalker:60,bloater:80,crawler:45}[m.kind]||5;score+=pts;snd.kill();
   const dr={sheep:[[103,1+(Math.random()<.5)],[43,Math.random()<.3?1:0]],pig:[[104,1+(Math.random()*2|0)]],hen:[[108,1]],shambler:[[112,Math.random()<.5?1:0],[109,Math.random()<.08?1:0]],bonewalker:[[112,1+(Math.random()*2|0)]],crawler:[[113,1+(Math.random()*2|0)]]}[m.kind]||[];
   for(const[id,n]of dr)if(n>0&&mode==='survival')spawnDrop(p.x,p.y+.5,p.z,id,n);if(KINDS[m.kind].hostile)pop('+'+pts,'c');}}});
function makeMob(kind,x,z,y){kind=kind==='husk'?'shambler':kind;let yy=y??Wd.topY(Math.floor(x),Math.floor(z))+1;const fx=Math.floor(x),fz=Math.floor(z);for(let k=0;k<12&&(SOL[get(fx,Math.floor(yy),fz)]||SOL[get(fx,Math.floor(yy)+1,fz)]);k++)yy++;return mobs.spawn(kind,x,yy,z);}
let spawnT=0;
function spawning(dt){if((spawnT-=dt)>0)return;spawnT=.8;const night=lightInfo.night>.5;
 // animals
 if(mobs.count(m=>!m.K.hostile)<7&&Math.random()<.35){const a=Math.random()*6.283,r=18+Math.random()*24,x=Math.floor(P.x+Math.cos(a)*r),z=Math.floor(P.z+Math.sin(a)*r);const T=Wd.column(x,z);const top=Wd.topY(x,z),tb=get(x,top,z);
  if((tb===1||tb===29||tb===10)&&T.bio!==3){const k=T.bio===5?'sheep':T.bio===4?(Math.random()<.5?'sheep':'pig'):['sheep','pig','hen'][Math.random()*3|0];const n=1+(Math.random()*3|0);for(let i=0;i<n;i++)makeMob(k,x+.5+Math.random()*2-1,z+.5+Math.random()*2-1,top+1);}}
 if(mode!=='survival'||clock<45)return;const cap=D().cap*(night?1:.5);if(mobs.count(m=>m.K.hostile)>=cap)return;
 const under=(lightAt(P.x,P.y+1.6,P.z)>>4)<9;
 for(let tr=0;tr<6;tr++){const a=Math.random()*6.283;
  if(under){const r=8+Math.random()*16,x=Math.floor(P.x+Math.cos(a)*r),z=Math.floor(P.z+Math.sin(a)*r);for(let y=Math.floor(P.y)-8;y<P.y+8;y++){if(!SOL[get(x,y-1,z)]||get(x,y,z)||get(x,y+1,z))continue;const lt=lightAt(x,y,z);if((lt>>4)>=6||(lt&15)>5)continue;
    const k=Math.random();makeMob(k<.38?'crawler':k<.68?'shambler':k<.88?'bonewalker':'bloater',x+.5,z+.5,y);return;}}
  else if(night){const r=20+Math.random()*16,x=Math.floor(P.x+Math.cos(a)*r),z=Math.floor(P.z+Math.sin(a)*r);const top=Wd.topY(x,z);const tb=get(x,top,z);if(LIQ[tb]||B[tb]?.leaf)continue;const lt=lightAt(x,top+1,z);if((lt&15)>5)continue;
   const k=Math.random();makeMob(k<.46?'shambler':k<.76?'bonewalker':k<.9?'bloater':'crawler',x+.5,z+.5,top+1);return;}}}

/* ================= player damage / death ================= */
let hurtT=0,tilt=0;
let invulnT=0;function hurtPlayer(n,from,kind){if(mode==='creative'||dead||state!=='play'||n<=0||(invulnT>0&&kind!=='void'))return;const dmg=Math.max(1,Math.round(n*(1-armor())));P.hp-=dmg;P.lastHurt=clock;hurtT=.5;snd.hurt();
 if(from){const dx=P.x-from.x,dz=P.z-from.z,d=Math.hypot(dx,dz)||1;P.vx+=dx/d*7;P.vz+=dz/d*7;P.vy=Math.max(P.vy,5);const ang=Math.atan2(dx,dz)-P.yaw;tilt=Math.sin(ang)*.08;}
 if(P.hp<=0)die(kind);}
const KILLER={shambler:'A SHAMBLER',bonewalker:'A BONEWALKER ARROW',arrow:'A BONEWALKER ARROW',bloater:'A BLOATER',blast:'AN EXPLOSION',crawler:'A CAVE CRAWLER',fall:'A LONG FALL',lava:'LAVA',drown:'DROWNING',void:'THE VOID',hunger:'STARVATION'};
function die(kind){dead=true;deadT=3;P.hp=0;lives--;stats.deaths++;$('dead').hidden=false;$('deadby').textContent=KILLER[kind]||'THE FRONTIER';$('deadl').textContent=lives>0?`${lives} ${lives===1?'LIFE':'LIVES'} LEFT · RESPAWNING · TOOLS KEPT`:'NO LIVES LEFT';
 for(const k of Object.keys(inv).map(Number)){if(isTool(k))continue;const n=inv[k];delete inv[k];const i=hot.indexOf(k);if(i>=0)hot[i]=0;spawnDrop(P.x,P.y+1,P.z,k,n,{x:(Math.random()-.5)*5,y:4,z:(Math.random()-.5)*5});}barDirty=true;mouseL=false;}
function respawn(){dead=false;$('dead').hidden=true;if(lives<=0){endSession('lose');return;}placePlayer(spawnPt);invulnT=4;for(const m of mobs.list.slice())if(m.K.hostile&&Math.hypot(m.pos.x-P.x,m.pos.z-P.z)<18)mobs.remove(m);P.hp=20;P.food=Math.max(P.food,14);P.air=10;banner('RESPAWNED',`${lives} ${lives===1?'LIFE':'LIVES'} LEFT`);}

/* ================= input ================= */
const keys={};let mouseL=false,mouseR=false,sens=1,fovBase=78,craftOpen=false;
addEventListener('keydown',e=>{keys[e.code]=true;if(e.code==='Escape'&&!craftOpen){if(state==='play'){pause(true);return;}if(state==='paused'&&!e.repeat&&performance.now()-pausedAt>400){pause(false);return;}}if(craftOpen){if(e.code==='KeyE'||e.code==='Escape'){e.preventDefault();closeCraft();}return;}if(state!=='play')return;
 if(/^Digit[1-9]$/.test(e.code)){slot=+e.code.slice(5)-1;barDirty=true;}if(e.code==='KeyF'&&mode==='creative'){P.fly=!P.fly;banner(P.fly?'FLYING':'WALKING','',.9);}
 if(e.code==='KeyE'&&!dead){openCraft();}if(e.code==='Space'||e.code.startsWith('Arrow'))e.preventDefault();});
addEventListener('keyup',e=>keys[e.code]=false);
addEventListener('wheel',e=>{if(state!=='play'||craftOpen)return;slot=(slot+(e.deltaY>0?1:8))%9;barDirty=true;},{passive:true});
canvas.addEventListener('mousedown',e=>{snd.init();if(state==='play'&&document.pointerLockElement!==canvas&&!usingPad){try{canvas.requestPointerLock();}catch(err){}return;}if(state!=='play'||dead)return;if(e.button===0){mouseL=true;attack();}if(e.button===2){mouseR=true;place();}});
addEventListener('mouseup',e=>{if(e.button===0){mouseL=false;mine.key=null;}if(e.button===2)mouseR=false;});canvas.addEventListener('contextmenu',e=>e.preventDefault());
addEventListener('mousemove',e=>{if(document.pointerLockElement!==canvas||state!=='play')return;P.yaw-=e.movementX*.0022*sens;P.pitch=clamp(P.pitch-e.movementY*.0022*sens,-1.55,1.55);});
document.addEventListener('pointerlockchange',()=>{if(document.pointerLockElement!==canvas&&state==='play'&&!craftOpen&&!usingPad)pause(true);});
// gamepad
let usingPad=false;const padPrev={};
function pad(dt){const l=navigator.getGamepads?[...navigator.getGamepads()].filter(Boolean):[];const g=l[0];if(!g)return;const b=i=>g.buttons[i]&&g.buttons[i].pressed,edge=i=>{const v=b(i),w=padPrev[i];padPrev[i]=v;return v&&!w;};
 const dz=v=>Math.abs(v)<.15?0:v;const lx=dz(g.axes[0]),ly=dz(g.axes[1]),rx=dz(g.axes[2]),ry=dz(g.axes[3]);if(lx||ly||rx||ry||g.buttons.some(x=>x.pressed))usingPad=true;if(!usingPad)return;
 if(edge(9)){if(state==='play')pause(true);else if(state==='paused')pause(false);}if(state!=='play')return;
 if(edge(3)){craftOpen?closeCraft():openCraft();}if(craftOpen)return;
 P.yaw-=rx*2.8*dt*sens;P.pitch=clamp(P.pitch-ry*2.2*dt*sens,-1.55,1.55);padMove.f=-ly;padMove.s=lx;padMove.jump=b(0);padMove.sprint=b(10)||b(1);
 if(edge(4)){slot=(slot+8)%9;barDirty=true;}if(edge(5)){slot=(slot+1)%9;barDirty=true;}
 const rt=b(7);if(rt&&!padPrev.rt){mouseL=true;attack();}if(!rt&&padPrev.rt){mouseL=false;mine.key=null;}padPrev.rt=rt;if(edge(6))place();}
const padMove={f:0,s:0,jump:false,sprint:false};

/* ================= mining / combat / placing ================= */
const mine={key:null,t:0,need:1,ok:true,x:0,y:0,z:0,id:0,digT:0};let swing=0,atkCD=0,placeAnim=0,eatT=0;
function mineTime(id){const bd=B[id];if(mode==='creative')return .14;if(bd.plant||bd.torch)return .05;const t=tier();if(bd.rock){if(bd.need&&t<bd.need)return bd.hard*5;return bd.hard/[1,2,3,4.5,6.5][t];}return bd.hard/(1+t*.25);}
function aimMob(){const h=mobs.hit(eye(),look(),4);if(!h)return null;const b=raycast(eye(),look(),4);if(b&&b.t<h.t)return null;return h.m;}
function attack(){if(dead||state!=='play')return;swing=.3;snd.swing();const m=aimMob();
 if(m){if(atkCD>0)return;atkCD=.38;const crit=P.vy<-1&&!P.on;let dmg=(mode==='creative'?20:swordDmg())*(crit?1.5:1);const killed=mobs.damage(m,dmg,{x:P.x,z:P.z},1.1);m.byPlayer=true;snd.hit(crit);
  emit(m.pos.x,m.pos.y+m.K.h*.6,m.pos.z,crit?new THREE.Color(1,.85,.3):new THREE.Color(1,.25,.2),crit?10:5,{power:1.4,life:.35,size:.06});pop((crit?'CRIT ':'')+Math.round(dmg),crit?'c':'');if(!killed)snd.mob(m.kind,m.pos);mine.key=null;return;}
 const h=raycast(eye(),look(),5.5);if(h&&B[h.id].tnt){setBlock(h.x,h.y,h.z,0);ignite(h.x,h.y,h.z,2.6);}}
function place(){if(dead||state!=='play')return;const id=sel();
 if(id&&ITEMS[id]?.food){if(mode==='creative')return;if(P.food>=20){banner('NOT HUNGRY','',.7);return;}P.food=Math.min(20,P.food+ITEMS[id].food);P.hp=Math.min(20,P.hp+(ITEMS[id].food>=6?2:0));take(id);snd.eat();eatT=.8;emit(P.x+look().x*.5,P.y+1.4,P.z+look().z*.5,new THREE.Color(.8,.5,.3),8,{power:.5,size:.05});return;}
 const h=raycast(eye(),look(),5.5);if(!h)return;
 // interacting with a station opens crafting
 if(B[h.id]?.station&&(!id||id>=100)){openCraft();return;}
 if(!id||id>=100)return;if(mode==='survival'&&!(inv[id]>0))return;let{px,py,pz}=h;if(PLANT[h.id]&&!B[h.id].torch){px=h.x;py=h.y;pz=h.z;}
 if(py<1||py>=CH)return;
 if(Math.floor(P.x-W2)<=px&&px<=Math.floor(P.x+W2-1e-6)&&Math.floor(P.y)<=py&&py<=Math.floor(P.y+PH-1e-6)&&Math.floor(P.z-W2)<=pz&&pz<=Math.floor(P.z+W2-1e-6)&&SOL[id])return;
 for(const m of mobs.list){const q=m.pos;if(SOL[id]&&Math.abs(q.x-(px+.5))<.5+m.K.w&&Math.abs(q.z-(pz+.5))<.5+m.K.w&&py+1>q.y&&py<q.y+m.K.h)return;}
 const cur=get(px,py,pz);if(cur&&!LIQ[cur]&&!PLANT[cur])return;if(PLANT[id]&&!B[id].torch&&!SOL[get(px,py-1,pz)])return;
 setBlock(px,py,pz,id);take(id);stats.placed++;if(mode==='creative')score+=1;snd.place(B[id].mat);swing=.22;placeAnim=.18;popMesh.position.set(px+.5,py+.5,pz+.5);popA=.16;
 if(B[id].beacon&&mode==='survival'){let open=true;for(let y=py+1;y<CH;y++){const b=get(px,y,pz);if(b&&!PLANT[b]){open=false;break;}}if(open){beam.position.set(px+.5,py+80,pz+.5);beam.visible=true;win();}else banner('NEEDS OPEN SKY','Nothing may sit above the beacon',2);}
 if(id===34)crafted.placedBench=1;if(id===35)crafted.placedFurnace=1;}
function stepMining(dt){if(atkCD>0)atkCD-=dt;if(!mouseL||dead||craftOpen){mine.key=null;crack.visible=false;return;}
 if(aimMob()){if(atkCD<=0)attack();mine.key=null;crack.visible=false;return;}
 const h=raycast(eye(),look(),5.5);if(!h||h.id===16){mine.key=null;crack.visible=false;return;}
 const k=h.x+','+h.y+','+h.z;if(mine.key!==k){mine.key=k;mine.t=0;mine.need=mineTime(h.id);const bd=B[h.id];mine.ok=!bd.need||tier()>=bd.need;mine.digT=0;}
 swing=Math.max(swing,.2);mine.t+=dt;mine.digT-=dt;if(mine.digT<=0){mine.digT=.22;snd.dig(B[h.id].mat);debris(h.x+.5+look().x*-.5,h.y+.5,h.z+.5+look().z*-.5,h.id,2,.5);}
 crack.visible=mine.need>.06;crack.position.set(h.x+.5,h.y+.5,h.z+.5);CRACK.offset.x=Math.min(7,Math.floor(mine.t/mine.need*8))/8;
 if(mine.t>=mine.need){const id=h.id,bd=B[id];debris(h.x+.5,h.y+.5,h.z+.5,id,14,1.1);setBlock(h.x,h.y,h.z,0);snd.brk(bd.mat);mine.key=null;crack.visible=false;stats.mined++;
  if(mode==='survival'){if(mine.ok){let drop=bd.drop??id;if(bd.leaf){drop=Math.random()<.07?107:Math.random()<.1?100:0;}if(drop)spawnDrop(h.x+.5,h.y+.5,h.z+.5,drop,1);if(bd.ore){stats.ores++;score+=bd.ore;pop('+'+bd.ore,'c');}else score+=1;}
   else banner('NEEDS A '+pickName(bd.need),'This block drops nothing by hand',1.6);}else score+=1;}}

/* ================= crafting ================= */
function nearStation(st){if(mode==='creative')return true;const x0=Math.floor(P.x),y0=Math.floor(P.y),z0=Math.floor(P.z);for(let dx=-4;dx<=4;dx++)for(let dy=-2;dy<=3;dy++)for(let dz=-4;dz<=4;dz++)if(B[get(x0+dx,y0+dy,z0+dz)]?.station===st)return true;return false;}
const have=k=>GROUP[k]?GROUP[k].reduce((s,i)=>s+(inv[i]||0),0):(inv[k]||0);
const canCraft=(r,st)=>r.in.every(([k,n])=>have(k)>=n)&&(!r.st||st[r.st]);
function craft(r,st){st=st||{1:nearStation(1),2:nearStation(2)};if(!canCraft(r,st))return false;for(const[k,n]of r.in){if(GROUP[k]){let left=n;for(const i of GROUP[k]){const t=Math.min(left,inv[i]||0);if(t){take(i,t);left-=t;}if(!left)break;}}else take(k,n);}
 const first=!crafted[r.out];give(r.out,r.n,true);if(hotable(r.out)&&!hot.includes(r.out)){hot[slot]=r.out;barDirty=true;}crafted[r.out]=1;stats.crafted++;if(first){score+=20;}snd.craft();feed(r.out,r.n,'CRAFTED');saveSoon();if(craftOpen)drawCraft();return true;}
function itemEl(id,n,cls='it'){const d=document.createElement('div');d.className=cls;const cv=document.createElement('canvas');cv.width=cv.height=32;cv.getContext('2d').drawImage(icon(id),0,0);d.appendChild(cv);if(n!=null&&n!==''){const b=document.createElement('b');b.textContent=n;d.appendChild(b);}d.title=nameOf(id);return d;}
function drawCraft(){const st={1:nearStation(1),2:nearStation(2)};const ci=$('cinv');ci.innerHTML='';
 const list=mode==='creative'?CREATIVE:Object.keys(inv).map(Number).filter(k=>inv[k]>0).sort((a,b)=>a-b);
 for(const k of list){const e=itemEl(k,mode==='creative'?'':inv[k]);e.style.pointerEvents='auto';e.onclick=()=>{if(!hotable(k))return;const arr=mode==='creative'?CREATIVE_HOT:hot;const j=arr.indexOf(k);if(j>=0)arr[j]=arr[slot];arr[slot]=k;barDirty=true;drawCraft();};ci.appendChild(e);}
 if(!list.length)ci.innerHTML='<span style="color:#9a948c;font-size:.64rem">Empty. Hold left click on a tree trunk.</span>';
 const hb=$('chb');hb.innerHTML='';const arr=mode==='creative'?CREATIVE_HOT:hot;arr.forEach((k,i)=>{const e=k?itemEl(k,mode==='creative'?'':inv[k]):document.createElement('div');if(!k)e.className='it';if(i===slot)e.classList.add('on');e.onclick=()=>{slot=i;barDirty=true;drawCraft();};hb.appendChild(e);});
 $('stations').innerHTML=`STATIONS · WORKBENCH ${st[1]?'<b>NEARBY</b>':'<i>NOT NEAR</i>'} · FURNACE ${st[2]?'<b>NEARBY</b>':'<i>NOT NEAR</i>'}`;
 const cr=$('crec');cr.innerHTML='';if(mode==='creative'){cr.innerHTML='<span style="color:#9a948c;font-size:.64rem">Creative mode: every block is unlimited. Pick blocks from the backpack.</span>';return;}
 const recs=RECIPES.slice().sort((a,b)=>(canCraft(b,st)?1:0)-(canCraft(a,st)?1:0));
 for(const r of recs){const ok=canCraft(r,st),b=document.createElement('button');b.className='r'+(ok?' ok':' no');b.appendChild(itemEl(r.out,r.n>1?r.n:null));const sp=document.createElement('span');
  sp.innerHTML=nameOf(r.out)+(r.st?`<small class="st">${r.st===1?'AT WORKBENCH':'AT FURNACE'}${st[r.st]?' ✓':''}</small>`:'')+(r.tip?`<small>${r.tip}</small>`:'');b.appendChild(sp);
  const ing=document.createElement('div');ing.className='ing';for(const[k,n]of r.in){const id=GROUP[k]?GROUP[k].find(i=>inv[i]>0)||GROUP[k][0]:k;const e=itemEl(id,n);e.title=(k==='LOG'?'ANY LOG':k==='FUEL'?'FUEL (COAL OR PLANKS)':nameOf(id));if(have(k)<n)e.style.opacity=.45;ing.appendChild(e);}b.appendChild(ing);b.onclick=()=>craft(r);cr.appendChild(b);}}
function openCraft(){if(state!=='play')return;craftOpen=true;mouseL=false;mine.key=null;drawCraft();$('craft').hidden=false;try{document.exitPointerLock();}catch(e){}}
function closeCraft(){craftOpen=false;$('craft').hidden=true;for(const k in keys)keys[k]=false;if(state==='play'&&!usingPad)try{canvas.requestPointerLock();}catch(e){}}
$('craft').addEventListener('mousedown',e=>{if(e.target.id==='craft')closeCraft();});

/* ================= objectives ================= */
const GOALS=[
 ['Punch a tree','Hold left click on a log until it breaks',()=>LOGS.some(i=>got[i]>0),()=>0],
 ['Build a workbench','Press E: logs → planks → WORKBENCH. Then place it with right click',()=>crafted.placedBench,()=>crafted[34]?.6:crafted[8]?.3:0],
 ['Craft a wooden pickaxe','Stand next to your workbench and press E',()=>tier()>=1,()=>0],
 ['Mine some stone','Dig down: grey rock needs a pickaxe (3 cobblestone)',()=>(got[13]||0)>=3||tier()>=2,()=>(got[13]||0)/3],
 ['Craft a stone pickaxe','3 cobblestone + 2 sticks at the workbench',()=>tier()>=2,()=>0],
 ['Light the dark','Mine black-speckled coal ore, craft TORCHES',()=>crafted[21],()=>got[101]?.5:0],
 ['Smelt iron','8 cobble → FURNACE. Place it, then smelt tan-speckled iron ore',()=>crafted[109],()=>crafted.placedFurnace?.5:got[12]?.25:0],
 ['Survive a night','Creatures hunt after dark. Wall yourself in or fight',()=>nights>=1,()=>lightInfo.night>.5?.5:0],
 ['Forge an iron pickaxe','3 iron ingots + 2 sticks',()=>tier()>=3,()=>Math.min(1,(got[109]||0)/3)],
 ['Find 2 diamonds','Cyan ore deep underground, below layer 18',()=>(got[102]||0)>=2,()=>(got[102]||0)/2],
 ['Gather 2 crystal shards','Glowing violet crystal grows on deep cave walls',()=>(got[111]||0)>=2,()=>(got[111]||0)/2],
 ['Craft the beacon','2 diamonds · 3 gold ingots · 4 glass · 2 crystal shards',()=>crafted[44]||won,()=>Math.min(1,((got[110]||0)>=3?.4:0)+(got[9]>=4?.3:0))],
 ['Light the beacon','Place it on the surface under open sky',()=>won,()=>0]];
function goals(){if(mode!=='survival')return;let adv=false;while(goal<GOALS.length&&GOALS[goal][2]()){score+=150+goal*25;goal++;adv=true;}
 if(adv){snd.goal();banner('OBJECTIVE COMPLETE',goal<GOALS.length?'NEXT · '+GOALS[goal][0].toUpperCase():'',2.2);const q=$('quest');q.classList.remove('flash');void q.offsetWidth;q.classList.add('flash');saveSoon();}}

/* ================= HUD ================= */
const GL={heart:{full:glyph('heart','full'),half:glyph('heart','half'),empty:glyph('heart','empty')},food:{full:glyph('food','full'),half:glyph('food','half'),empty:glyph('food','empty')},armor:{full:glyph('armor','full'),empty:glyph('armor','empty')}};
const hc={};const setT=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).textContent=v;}};const setH=(id,v)=>{if(hc[id]!==v){hc[id]=v;$(id).innerHTML=v;}};
function row(kind,val,max=20){let s='';for(let i=0;i<10;i++){const v=val-i*2;const st=v>=2?'full':v>=1?'half':'empty';s+=`<img src="${GL[kind][st]||GL[kind].empty}">`;}return s;}
let bannerT=0;function banner(t,s='',dur=2){$('bt').textContent=t;$('bs').textContent=s;$('bs').style.display=s?'':'none';$('banner').classList.add('on');bannerT=dur;}
const feedMap=new Map();function feed(id,n,pre=''){if(state!=='play')return;const f=$('feed');let e=feedMap.get(id);if(e&&e.isConnected&&!pre){e.n+=n;e.querySelector('span').innerHTML=`<b>+${e.n}</b> ${nameOf(id)}`;clearTimeout(e.tm);e.tm=setTimeout(()=>e.remove(),2600);return;}
 e=document.createElement('div');const cv=document.createElement('canvas');cv.width=cv.height=32;cv.getContext('2d').drawImage(icon(id),0,0);const sp=document.createElement('span');e.n=n;sp.innerHTML=(pre?pre+' · ':'')+`<b>+${n}</b> ${nameOf(id)}`;e.append(cv,sp);f.prepend(e);if(!pre)feedMap.set(id,e);e.tm=setTimeout(()=>e.remove(),2600);while(f.children.length>6)f.lastChild.remove();}
function pop(txt,cls){const d=document.createElement('div');d.textContent=txt;d.className=cls||'';d.style.left=(50+(Math.random()-.5)*8)+'%';d.style.top=(46+(Math.random()-.5)*6)+'%';$('pops').appendChild(d);setTimeout(()=>d.remove(),800);}
let bumped=-1;function bumpSlot(i){bumped=i;}
let lastName='',nameT=0;
function drawBar(){const el=$('bar');el.innerHTML='';const arr=mode==='creative'?CREATIVE_HOT:hot;for(let i=0;i<9;i++){const s=document.createElement('div');s.className='s'+(i===slot?' on':'')+(i===bumped?' bump':'');const id=arr[i];s.innerHTML=`<i>${i+1}</i>`;
 if(id){const cv=document.createElement('canvas');cv.width=cv.height=32;cv.getContext('2d').drawImage(icon(id),0,0);s.appendChild(cv);if(mode==='survival'&&inv[id]>1){const b=document.createElement('b');b.textContent=inv[id];s.appendChild(b);}}el.appendChild(s);}bumped=-1;
 const nm=sel()?nameOf(sel()):'';if(nm!==lastName){lastName=nm;nameT=nm?1.8:0;$('iname').textContent=nm;}updateHeld();}
function hud(dt){if($('hud').hidden)return;if(barDirty){barDirty=false;drawBar();}
 if(nameT>0){nameT-=dt;$('iname').classList.toggle('on',nameT>0);}
 setT('clock',timeMode?mmss(timeLeft):'∞');$('clock').className=timeMode&&timeLeft<30?'low':'';const hr=(dayT*24+6)%24,hh=Math.floor(hr),mm=Math.floor((hr-hh)*60/10)*10;
 setT('daylbl',`DAY ${nights+1} · ${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}${lightInfo.night>.5?' · NIGHT':''}`);const ds=$('dsun');ds.style.left=(dayT*100)+'%';ds.className=lightInfo.night>.5?'moon':'';
 setT('sc',score.toLocaleString());setT('bio',BIO[Wd.column(Math.floor(P.x),Math.floor(P.z)).bio]+(P.y<SEA-6&&(lightAt(P.x,P.y+1.6,P.z)>>4)<8?' · CAVES':''));
 if(mode==='survival'){setH('hearts',row('heart',Math.max(0,P.hp)));setH('food',row('food',Math.max(0,P.food)));const ar=Math.round(armor()*20);setH('armor',ar?row('armor',ar):'');$('hearts').classList.toggle('low',P.hp<=6&&!dead);}
 else{setH('hearts','');setH('food','');setH('armor','');}
 // objective
 if(mode==='survival'){const g=GOALS[goal];setT('qn',Math.min(goal+1,GOALS.length)+'/'+GOALS.length);setT('qt',g?g[0]:'Frontier tamed');setT('qh',g?g[1]:'Keep exploring, building and scoring');$('qb').style.width=(g?Math.min(1,g[3]())*100:100)+'%';
  setH('lives',`LIVES <b>${'♥'.repeat(Math.max(0,lives))}</b> · ${D().n}`);}
 else{setT('qn','');setT('qt','Creative');setT('qh','Every block is unlimited. F to fly. Build something great.');$('qb').style.width='100%';setH('lives','');}
 // tip under crosshair
 const m=dead?null:aimMob();let tip='';$('cross').className=m?'mob':'';
 if(m)tip=`${m.kind.toUpperCase()} · ${Math.max(0,Math.ceil(m.hp))} HP`;else{const h=dead?null:raycast(eye(),look(),5.5);if(h){const bd=B[h.id];tip=bd.n+(mode==='survival'&&bd.need>tier()?` · <i>NEEDS ${pickName(bd.need)}</i>`:'')+(bd.station?' · <i style="color:#7ad04a">RMB CRAFT</i>':'');}}
 setH('tip',tip);hl.visible=!!(!m&&!dead&&tip);if(hl.visible){const h=raycast(eye(),look(),5.5);hl.position.set(h.x+.5,h.y+.5,h.z+.5);}
 const ring=$('ring');if(mine.key&&mine.need>.15){const f=Math.min(1,mine.t/mine.need);ring.style.opacity=1;ring.style.background=`conic-gradient(${mine.ok?'#7ad04a':'#ff5a3a'} ${f*360}deg, rgba(255,255,255,.18) 0)`;}else ring.style.opacity=0;
 if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
 $('hurtov').style.opacity=Math.min(1,hurtT*1.6);$('lowov').style.opacity=mode==='survival'&&P.hp<=6&&!dead?.5+.3*Math.sin(clock*6):0;$('waterov').style.opacity=headInWater()?1:0;}
const headInWater=()=>LIQ[get(Math.floor(P.x),Math.floor(P.y+1.62),Math.floor(P.z))]===1;

/* ================= viewmodel ================= */
const held=new THREE.Group();cam.add(held);const vmCache={};const vmMats=[];
const vm=(m)=>{m.depthTest=false;m.depthWrite=false;m.fog=false;m.transparent=true;m.userData.base=m.color.clone();vmMats.push(m);return m;};
const armMesh=new THREE.Group();{const skin=vm(new THREE.MeshLambertMaterial({color:0xd8a07a})),sleeve=vm(new THREE.MeshLambertMaterial({color:0x8a5a32}));const a=new THREE.Mesh(new THREE.BoxGeometry(.1,.1,.34),skin);a.position.z=-.02;const s=new THREE.Mesh(new THREE.BoxGeometry(.118,.118,.16),sleeve);s.position.z=.17;a.renderOrder=s.renderOrder=998;armMesh.add(a,s);armMesh.position.set(.34,-.3,-.42);armMesh.rotation.set(.35,-.28,.12);}
held.add(armMesh);
function viewModel(id){if(vmCache[id])return vmCache[id];const g=new THREE.Group();
 if(id<100&&!PLANT[id]){const o=new THREE.Mesh(blockCube(id,.2),vm(new THREE.MeshLambertMaterial({map:AT.map,alphaTest:.5,emissiveMap:B[id].glow?AT.em:null,emissive:B[id].glow?0xffffff:0,emissiveIntensity:B[id].glow?1.5:0})));o.renderOrder=999;o.rotation.set(.2,.75,0);g.add(o);g.position.set(.3,-.24,-.5);}
 else{const o=new THREE.Mesh(extruded(id),vm(new THREE.MeshLambertMaterial({vertexColors:true})));o.renderOrder=999;o.scale.setScalar(.38);o.rotation.set(0,-1.5,.15);g.add(o);g.position.set(.36,-.18,-.52);
  if(id===21){o.scale.setScalar(.36);g.position.set(.34,-.2,-.5);}}
 vmCache[id]=g;return g;}
let heldId=-1;
function updateHeld(){let id=sel()||0;if(!id&&mode==='survival'){const s=Object.keys(inv).map(Number).filter(k=>inv[k]>0&&ITEMS[k]?.sword).sort((a,b)=>ITEMS[b].sword-ITEMS[a].sword)[0];const p=Object.keys(inv).map(Number).filter(k=>inv[k]>0&&ITEMS[k]?.pick).sort((a,b)=>ITEMS[b].pick-ITEMS[a].pick)[0];id=(aimMob()&&s)?s:(p||s||0);}
 if(id===heldId)return;heldId=id;for(const c of held.children.slice())if(c!==armMesh)held.remove(c);if(id)held.add(viewModel(id));armMesh.visible=!id||id<100;equipT=.25;}
let ph=0,bobT=0,equipT=0;
function animHeld(dt){const active=mouseL||swing>0;if(swing>0)swing-=dt;if(active)ph+=dt*13;else ph=0;const sp=Math.hypot(P.vx,P.vz);bobT+=dt*sp*1.7;if(equipT>0)equipT-=dt;if(placeAnim>0)placeAnim-=dt;if(eatT>0)eatT-=dt;
 held.visible=(state==='play'||state==='paused')&&!dead;const s=Math.abs(Math.sin(ph));const k=Math.min(1,sp/4)*(P.on?1:.3);
 held.rotation.set(-s*.85+(eatT>0?.6+Math.sin(eatT*30)*.1:0),s*.35,-s*.2);held.position.set(Math.sin(bobT)*.018*k-s*.05+(eatT>0?-.18:0),Math.abs(Math.cos(bobT))*.022*k-(equipT>0?equipT*.8:0)-(placeAnim>0?placeAnim*.4:0)+(eatT>0?.08:0),-(placeAnim>0?placeAnim*.3:0));
 const lt=lightAt(P.x,P.y+1.6,P.z);const l=Math.max(LC[lt>>4]*(.35+.65*lightInfo.day),LC[lt&15]*1.1,heldId===21?1:.14);for(const m of vmMats)m.color.copy(m.userData.base).multiplyScalar(l);}

/* ================= session flow ================= */
function setSeg(id,val,cb){const el=$(id);const set=v=>{el.querySelectorAll('button').forEach(b=>b.classList.toggle('on',b.dataset.v===String(v)));cb(v);};el.querySelectorAll('button').forEach(b=>b.onclick=()=>{snd.init();set(b.dataset.v);});set(val);}
let prefs={};try{prefs=JSON.parse(localStorage.getItem('voxel_prefs'))||{};}catch(e){}
const savePrefs=()=>{try{localStorage.setItem('voxel_prefs',JSON.stringify(prefs));}catch(e){}};
setSeg('o-mode',prefs.mode||'survival',v=>{mode=v;prefs.mode=v;savePrefs();$('dsc').textContent=mode==='creative'?'Creative: unlimited blocks, flight, no creatures at night. Score by building.':DIFF[diff].d;});
setSeg('o-diff',prefs.diff??1,v=>{diff=+v;prefs.diff=diff;savePrefs();$('dsc').textContent=mode==='creative'?'Creative: unlimited blocks, flight, no creatures at night. Score by building.':DIFF[diff].d;});
setSeg('o-len',prefs.len??1200,v=>{timeMode=+v;prefs.len=timeMode;savePrefs();});
setSeg('o-sens',prefs.sens??1,v=>{sens=+v;prefs.sens=sens;savePrefs();});setSeg('o-fov',prefs.fov??78,v=>{fovBase=+v;prefs.fov=fovBase;savePrefs();});
setSeg('o-vol',prefs.vol??.8,v=>{snd.setVol(+v);prefs.vol=+v;savePrefs();});setSeg('o-mus',prefs.mus??.5,v=>{snd.setMusic(+v);prefs.mus=+v;savePrefs();});
const SKEY='voxel_world2';let saveT=0;const saveSoon=()=>{if(saveT<=0)saveT=4;};
function save(){if(state==='menu'||result==='lose')return;try{localStorage.setItem(SKEY,JSON.stringify({v:2,seed:Wd.getSeed(),edits:[...Wd.edits.entries()],mode,diff,inv,hot,slot,score,dayT,nights,goal,crafted,got,lives,stats,spawn:spawnPt,P:{x:P.x,y:P.y,z:P.z,hp:P.hp,food:P.food,yaw:P.yaw},timeLeft,timeMode,clock}));}catch(e){}}
function load(){try{const s=JSON.parse(localStorage.getItem(SKEY));return s&&s.v===2?s:null;}catch(e){return null;}}
function resetWorld(seed){Wd.clearAll(scene);mobs.clear();for(const d of drops)scene.remove(d.mesh);drops.length=0;primed.splice(0).forEach(p=>scene.remove(p.m));Wd.init(seed);Wd.setEdits(new Map());beam.visible=false;}
function newWorld(seed){resetWorld(typeof seed==='number'?seed:(Math.random()*1e9)|0);inv={};hot=Array(9).fill(0);slot=0;goal=0;crafted={};got={};score=0;dayT=.04;nights=0;wasNight=false;lives=D().lives;stats={mined:0,ores:0,kills:0,placed:0,crafted:0,deaths:0};clock=0;won=false;result=null;
 spawnPt=spawnPoint();placePlayer(spawnPt);P.hp=20;P.food=20;P.air=10;P.fly=false;P.yaw=Math.random()*6.28;P.pitch=-.12;timeLeft=timeMode;start(true);}
function contWorld(){const s=load();if(!s){newWorld();return;}resetWorld(s.seed);Wd.setEdits(new Map(s.edits||[]));mode=s.mode;diff=s.diff??1;inv=s.inv||{};hot=s.hot||Array(9).fill(0);slot=s.slot||0;score=s.score||0;dayT=s.dayT??.05;nights=s.nights||0;goal=s.goal||0;crafted=s.crafted||{};got=s.got||{};lives=s.lives??3;stats=s.stats||stats;spawnPt=s.spawn||spawnPoint();
 timeMode=s.timeMode??timeMode;timeLeft=s.timeLeft>5?s.timeLeft:timeMode;clock=s.clock||0;won=false;result=null;placePlayer(s.P);P.y=s.P.y+.1;P.hp=s.P.hp||20;P.food=s.P.food??20;P.yaw=s.P.yaw||0;P.pitch=0;wasNight=Math.sin(dayT*Math.PI*2)<-.05;start(true);}
function start(fresh){snd.init();snd.playing=true;state='play';document.body.classList.remove('over','paused');dead=false;$('dead').hidden=true;['menu','over','pause'].forEach(i=>$(i).hidden=true);$('keys').style.display='';$('hud').hidden=false;document.body.classList.add('playing');barDirty=true;heldId=-1;
 for(const k in hc)delete hc[k];if(fresh){Wd.stream(P.x,P.z,2,mats,scene,1e9);banner(mode==='creative'?'CREATIVE':'DAY 1',mode==='creative'?'BUILD ANYTHING':BIO[Wd.column(Math.floor(P.x),Math.floor(P.z)).bio]+' · '+D().n,2.4);}
 if(!usingPad)try{canvas.requestPointerLock();}catch(e){}}
let pausedAt=0;function pause(on){if(on){if(state!=='play')return;state='paused';pausedAt=performance.now();try{document.exitPointerLock();}catch(e){}$('pause').hidden=false;document.body.classList.remove('playing');document.body.classList.add('paused');save();}else{state='play';$('pause').hidden=true;document.body.classList.add('playing');document.body.classList.remove('paused');if(!usingPad)try{canvas.requestPointerLock();}catch(e){}}}
function toMenu(){save();state='menu';document.body.classList.remove('over','paused');$('hud').hidden=true;['over','pause'].forEach(i=>$(i).hidden=true);$('menu').hidden=false;$('keys').style.display='';document.body.classList.remove('playing');craftOpen=false;$('craft').hidden=true;snd.playing=false;$('cont').style.display=load()?'':'none';showBest();try{document.exitPointerLock();}catch(e){}}
function win(){if(won)return;won=true;goals();score+=2000+(timeMode?Math.round(timeLeft*2):500);snd.win();banner('BEACON LIT','THE FRONTIER IS YOURS',3);setTimeout(()=>{if(state==='play')endSession('win');},2600);}
let lastAward=null;
function endSession(kind){if(state==='over')return;result=kind;state='over';mouseL=false;try{document.exitPointerLock();}catch(e){}$('hud').hidden=true;$('craft').hidden=true;craftOpen=false;document.body.classList.remove('playing');document.body.classList.add('over');snd.playing=false;orbitA=P.yaw;
 const tok=award(kind==='win');$('over').hidden=false;$('oeye').textContent=kind==='win'?'SURVIVAL COMPLETE':kind==='lose'?'OUT OF LIVES':'SESSION OVER · CLOCK ENDED';
 const r=$('ores');r.textContent=kind==='win'?'BEACON LIT':kind==='lose'?'FALLEN':'TIME UP';r.className='res '+(kind==='win'?'win':kind==='lose'?'lose':'');
 $('ofs').textContent=score.toLocaleString()+' PTS · '+(mode==='creative'?'CREATIVE':D().n)+(mode==='survival'?' · OBJECTIVE '+Math.min(goal,GOALS.length)+'/'+GOALS.length:'');
 const st=[[stats.mined,'BLOCKS MINED'],[stats.ores,'ORES'],[stats.kills,'CREATURES'],[nights,'NIGHTS SURVIVED'],[stats.crafted,'ITEMS CRAFTED'],[mmss(clock),'TIME PLAYED']];$('ostats').innerHTML=st.map(([v,l])=>`<div><b>${v}</b><span>${l}</span></div>`).join('');
 $('otok').textContent='+'+tok+' ARCADE TOKENS · BEST '+best().toLocaleString();$('keep').style.display=kind==='lose'?'none':'';lastAward={pts:score,kind,goal,mode,diff:D().n};if(kind==='lose'){try{localStorage.removeItem(SKEY);}catch(e){}}else save();}
function award(won){const tok=5+Math.min(60,score/20|0);try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{user:'',tokens:0,played:0,wins:0};pr.played++;pr.tokens+=tok;if(won)pr.wins++;localStorage.setItem('pxd_profile',JSON.stringify(pr));
 const k='pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'voxel3d';if(+(localStorage.getItem(k)||0)<score)localStorage.setItem(k,score);}catch(e){}return tok;}
function best(){try{const pr=JSON.parse(localStorage.getItem('pxd_profile'))||{};return +(localStorage.getItem('pxd_hs_'+(pr.user?pr.user.toLowerCase()+'_':'')+'voxel3d')||0);}catch(e){return 0;}}
function showBest(){const b=best();$('best').textContent=b?'BEST · '+b.toLocaleString():'';}
$('go').onclick=()=>newWorld(window.__seed);$('cont').onclick=()=>contWorld();$('again').onclick=()=>newWorld(window.__seed);$('omenu').onclick=toMenu;$('resume').onclick=()=>pause(false);$('quit').onclick=toMenu;
$('keep').onclick=()=>{timeMode=0;timeLeft=0;$('over').hidden=true;start(false);};
$('post').onclick=()=>{const a=lastAward||{};let u='';try{u=(JSON.parse(localStorage.getItem('pxd_profile'))||{}).user||'';}catch(e){}
 const body=`Game: Voxel Frontier\nPoints: ${a.pts||0}\nResult: ${a.kind||''}\nObjectives: ${a.goal||0}/${GOALS.length}\nMode: ${a.mode||''} · ${a.diff||''}\n\nPosted from Pixel Arcade${u?' as @'+u:''}. Do not edit the title.`;
 open('https://github.com/Normansrule/pixel-arcade/issues/new?title='+encodeURIComponent('[score] voxel3d '+(a.pts||0))+'&body='+encodeURIComponent(body),'_blank');};

/* ================= simulation step ================= */
function step(dt){if(state!=='play')return;clock+=dt;
 if(timeMode&&!won){timeLeft-=dt;if(timeLeft<=0){timeLeft=0;endSession('time');return;}if(timeLeft<=30&&Math.floor(timeLeft)!==Math.floor(timeLeft+dt)&&Math.floor(timeLeft)%10===0)banner(Math.floor(timeLeft)+' SECONDS','',1.2);}
 pad(dt);
 // day/night: 5-minute day, 2.5-minute night
 const nightNow=Math.sin(dayT*Math.PI*2)<-.05;dayT=(dayT+dt/(nightNow?300:600))%1;const night=Math.sin(dayT*Math.PI*2)<-.05;
 {const el=Math.sin(dayT*Math.PI*2);lightInfo.day=THREE.MathUtils.smoothstep(el,-.1,.22);lightInfo.night=1-THREE.MathUtils.smoothstep(el,-.22,.02);}
 if(night&&!wasNight){banner('NIGHT FALLS','CREATURES ARE HUNTING',2.4);snd.night();}if(!night&&wasNight){nights++;score+=100;banner('DAY '+(nights+1),'YOU SURVIVED THE NIGHT · +100',2.4);}wasNight=night;
 if(dead){deadT-=dt;if(deadT<=0)respawn();mobs.step(dt,P);return;}
 if(hurtT>0)hurtT-=dt;if(invulnT>0)invulnT-=dt;tilt*=Math.exp(-dt*6);
 // movement
 const k=keys,sprint=k.ShiftLeft||k.ShiftRight||padMove.sprint;const f=(k.KeyW||k.ArrowUp?1:0)-(k.KeyS||k.ArrowDown?1:0)+padMove.f,s=(k.KeyD||k.ArrowRight?1:0)-(k.KeyA||k.ArrowLeft?1:0)+padMove.s;const jump=k.Space||padMove.jump;
 const feetId=get(Math.floor(P.x),Math.floor(P.y+.2),Math.floor(P.z)),headId=get(Math.floor(P.x),Math.floor(P.y+1.5),Math.floor(P.z));const wasW=P.inWater;P.inWater=!!(LIQ[feetId]||LIQ[headId]);const lava=feetId===20||headId===20;if(P.inWater&&!wasW&&P.vy<-6)snd.splash();
 const sp=P.fly?11:P.inWater?2.6:sprint&&f>0&&(P.food>4||mode==='creative')?5.9:4.3;const sy=Math.sin(P.yaw),cy=Math.cos(P.yaw);let wx=-sy*f+cy*s,wz=-cy*f-sy*s;const wl=Math.hypot(wx,wz);if(wl>1){wx/=wl;wz/=wl;}wx*=sp;wz*=sp;
 const acc=P.on||P.fly||P.inWater?14:3.5;P.vx+=(wx-P.vx)*Math.min(1,acc*dt);P.vz+=(wz-P.vz)*Math.min(1,acc*dt);
 if(P.fly){P.vy=(jump?8:0)-(k.ShiftLeft?8:0);}else if(P.inWater){P.vy=Math.max(-3,P.vy-9*dt);if(jump)P.vy=Math.min(3.4,P.vy+22*dt);}else{P.vy-=27*dt;if(jump&&P.on){P.vy=8.4;}}P.vy=Math.max(P.vy,-42);
 const pvy=P.vy;for(const ax of['x','z','y']){const v=P['v'+ax]*dt;if(!v)continue;const o=P[ax];P[ax]+=v;if(collides(P.x,P.y,P.z)){P[ax]=o;if(ax==='y'){if(P.vy<0){if(!P.on&&pvy<-8)snd.step(B[get(Math.floor(P.x),Math.floor(P.y-.5),Math.floor(P.z))]?.mat);P.on=true;if(!P.inWater&&pvy<-15.5&&mode==='survival')hurtPlayer(Math.floor((-pvy-13.5)/2.1),null,'fall');}P.vy=0;}else{P['v'+ax]=0;
    if(P.on&&!P.fly){const up=P.y+1.05;if(!collides(ax==='x'?o+v:P.x,up,ax==='z'?o+v:P.z)&&!collides(P.x,up,P.z)){P.y=up;P[ax]=o+v;}}}}else if(ax==='y')P.on=false;}
 if(P.on&&!P.fly){P.stepD+=Math.hypot(P.vx,P.vz)*dt;if(P.stepD>2.3){P.stepD=0;const b=get(Math.floor(P.x),Math.floor(P.y-.5),Math.floor(P.z));if(b)snd.step(B[b].mat);}}
 if(P.y<-12)hurtPlayer(99,null,'void');
 if(mode==='survival'){
  if(lava&&Math.random()<dt*3)hurtPlayer(3,null,'lava');
  if(P.inWater&&LIQ[headId]===1&&headId===5){P.air-=dt*.8;if(P.air<=0){P.air=0;if(Math.random()<dt*1.2)hurtPlayer(2,null,'drown');}}else P.air=Math.min(10,P.air+dt*4);
  P.food=Math.max(0,P.food-dt*(.016+(sprint&&Math.hypot(P.vx,P.vz)>5?.05:0)+(mouseL?.004:0))*D().hunger);
  if(P.food>=14&&P.hp<20&&clock-P.lastHurt>3){P.hp=Math.min(20,P.hp+dt*.55);P.food=Math.max(0,P.food-dt*.08);}if(P.food<=0&&P.hp>(diff===2?0:1)){P.hp-=dt*.22;if(P.hp<=0)die('hunger');}}
 stepMining(dt);
 mobs.step(dt,P);spawning(dt);stepDrops(dt);stepPrimed(dt);
 if(popT>0){popT-=dt;if(popT<=0)popChain=0;}if(popA>0){popA-=dt;}
 if((goalT-=dt)<=0){goalT=.3;goals();}
 if(saveT>0&&(saveT-=dt)<=0)save();}
let goalT=0,orbitA=0;

/* ================= camera + lighting + render ================= */
const tmpV=new THREE.Vector3();let menuA=0,envT=0;
function lighting(){const center=state==='menu'?tmpV.set(P.x,P.y,P.z):tmpV.set(P.x,P.y+1,P.z);lightInfo=applyLighting({dayT,sun,hemi,fog:scene.fog,R,center,shadowSize:SH,sunDir});
 const under=headInWater();if(under){scene.fog.near=1;scene.fog.far=22;scene.fog.color.setRGB(.03,.13*lightInfo.day+.02,.28*lightInfo.day+.05);}else{scene.fog.near=RD*CS*.45;scene.fog.far=RD*CS-8;}
 R.setClearColor(scene.fog.color);
 heldLight.position.copy(cam.position).add(look().multiplyScalar(.6));heldLight.intensity=heldId===21&&state==='play'&&!dead?2.2*(1+.1*Math.sin(clock*17)):0;
 U.uTorch.value=2.4*(1+.05*Math.sin(clock*13)+.03*Math.sin(clock*29));
 snd.amb=state==='play'&&(lightAt(P.x,P.y+1.6,P.z)>>4)>10?1:0;snd.nightAmt=lightInfo.night;}
function render(dt){const now=performance.now()/1000;U.uTime.value=now%1000;
 if(state==='menu'){menuA+=dt*.015;const r=18,cx=spawnPt.x+Math.cos(menuA)*r,cz=spawnPt.z+Math.sin(menuA)*r;const cy=Math.max(spawnPt.y+16,Wd.topY(Math.floor(cx),Math.floor(cz))+8);cam.position.set(cx,cy,cz);cam.lookAt(cx-Math.sin(menuA)*60,cy-16,cz+Math.cos(menuA)*60);cam.fov=64;}
 else if(state==='over'){orbitA+=dt*.05;const r=20,cx=P.x+Math.sin(orbitA)*r,cz=P.z+Math.cos(orbitA)*r;cam.position.set(cx,Math.max(P.y+12,Wd.topY(Math.floor(cx),Math.floor(cz))+9),cz);cam.lookAt(P.x,P.y+1,P.z);cam.fov=62;}
 else{cam.position.set(P.x,P.y+1.62,P.z);const bob=P.on&&!P.fly?Math.sin(bobT*2)*.035*Math.min(1,Math.hypot(P.vx,P.vz)/4):0;cam.position.y+=Math.abs(bob);cam.rotation.set(P.pitch,P.yaw,tilt,'YXZ');
  if(shakeT>0){shakeT=Math.max(0,shakeT-dt);const a=shakeT*shakeT*.9;cam.position.x+=(Math.random()-.5)*a;cam.position.y+=(Math.random()-.5)*a;cam.position.z+=(Math.random()-.5)*a;}
  const tf=fovBase+(Math.hypot(P.vx,P.vz)>5.2?7:0);cam.fov+=(tf-cam.fov)*Math.min(1,dt*8);}
 cam.updateProjectionMatrix();sky.position.copy(cam.position);placeClouds(cam.position.x,cam.position.z,now);lighting();
 if(popA>0){popMesh.visible=true;popMesh.scale.setScalar(1+popA*.6);popMesh.material.opacity=popA*2;}else popMesh.visible=false;
 if(beam.visible){beam.material.opacity=.45+.15*Math.sin(now*4);beam.rotation.y+=dt;}
 snd.listener(P.x,P.y+1.6,P.z,P.yaw);fx.render();}
function loop(now){const dt=clamp((now-last)/1000,0,.05);last=now;step(dt);stepParts(dt);
 const rem=Wd.stream(state==='menu'?spawnPt.x:P.x,state==='menu'?spawnPt.z:P.z,state==='menu'?RD:RD,mats,scene,state==='play'?5:12);
 animHeld(dt);render(dt);hud(dt);requestAnimationFrame(loop);}
let last=performance.now();

/* ================= boot ================= */
applyQuality(gfxQ);bindQualityKey(()=>gfxQ,q=>applyQuality(q));
Wd.init(20241);spawnPt=spawnPoint();P.x=spawnPt.x;P.y=spawnPt.y;P.z=spawnPt.z;dayT=.43;
$('cont').style.display=load()?'':'none';showBest();toMenu();requestAnimationFrame(loop);

// test hooks (kept from the original cabinet, extended)
window.VOXEL={step,stream:(n=4)=>Wd.stream(state==='menu'?spawnPt.x:P.x,state==='menu'?spawnPt.z:P.z,state==='menu'?Math.min(RD,5):RD,mats,scene,1e9,n),P,get,set:(x,y,z,id)=>setBlock(x,y,z,id),raycast,eye,look,terrain:(x,z)=>Wd.column(x,z),get state(){return state;},newWorld,contWorld,
 get inv(){return inv;},get hot(){return hot;},get score(){return score;},set score(v){score=v;},get mobs(){return mobs.list;},mobsSys:mobs,makeMob,keys,attack,place,get chunks(){return Wd.chunks;},set dayT(v){dayT=v;},get dayT(){return dayT;},lighting,
 setMode:m=>{mode=m;barDirty=true;},set mode(m){mode=m;},get mode(){return mode;},set diff(v){diff=v;},set timeLeft(v){timeLeft=v;},get timeLeft(){return timeLeft;},set timeMode(v){timeMode=v;},get timeMode(){return timeMode;},
 mineAt:()=>{mouseL=true;},stopMine:()=>{mouseL=false;mine.key=null;},render:()=>render(1/60),R,sun,fxq:()=>gfxQ,applyQuality,
 renderFrom:()=>{render(1/60);hud(1/60);animHeld(0);},ignite,explode,debris,primed,stepPrimed,stepDebris:stepParts,WU:U,clouds,craft:r=>craft(r,{1:true,2:true}),RECIPES,openCraft,closeCraft,tier,get goal(){return goal;},set goal(v){goal=v;},goals,GOALS,give,
 TL:[heldLight],held,updateHeld,set slot(v){slot=v;barDirty=true;},get slot(){return slot;},get lives(){return lives;},set lives(v){lives=v;},hurtPlayer,endSession,win,get result(){return result;},get nights(){return nights;},drops,stepDrops,hud,toMenu,pause,
 get stats(){return stats;},get got(){return got;},get crafted(){return crafted;},spawning,setBlock,column:Wd.column,topY:Wd.topY,lightAt,cam,scene,get spawn(){return spawnPt;},snd,
 noBanner:()=>{bannerT=0;$('banner').classList.remove('on');},banner,
 tick:(n=1,dt=1/30)=>{for(let i=0;i<n;i++){step(dt);stepParts(dt);}}};
