// SHARDWAR — a real-time strategy game in full 3D. Entry module: renderer, camera, RTS input (box select, smart
// right-click, control groups, hotkeys, edge/WASD pan, minimap), unit/building/resource views, effects, HUD, menus, results.
import * as THREE from '../vendor/three.module.min.js';
import {cinematic,bindQualityKey,quality} from '../js/fx3d.js';
import {addRound,bestScore,saveBest} from '../js/kit3d/score.js';
import {controls} from '../js/kit3d/input.js';
import {$,stored,pickers,postButton,toast} from '../js/kit3d/ui.js';
import {Sim} from './sim.js';
import {Brain} from './ai.js';
import {U,B,UP,FACTIONS,BUILD_LIST,DIFF,PCOL,CS,MAX_SUP} from './data.js';
import {MAP_LIST} from './map.js';
import {unitGeo,partMatrix,bldModel,oreGeo,ventGeo,ventGlowGeo,MAT} from './models.js';
import {buildWorld,fogInit,fogUpdate,fogU,fogify,FOG} from './world.js';
import {Particles,Decals,Shocks,Strips,setHeight} from './fx.js';
import {Sound} from './sound.js';
import {cl,fmtT,pick} from './util.js';

const ID='shardwar';
const opt={fac:'compact',map:0,diff:1,min:15,spd:1};const save=stored('shardwar_opts',opt);
/* ================= renderer / scene ================= */
const canvas=$('c'),ov=$('ov'),ox=ov.getContext('2d');
const R=new THREE.WebGLRenderer({canvas,powerPreference:'high-performance'});let gfx=quality();
R.shadowMap.enabled=true;R.shadowMap.type=THREE.PCFSoftShadowMap;
const scene=new THREE.Scene();scene.background=new THREE.Color('#1a2026');scene.fog=new THREE.Fog('#2a3038',140,300);
const camera=new THREE.PerspectiveCamera(38,1,1,700);
const hemi=new THREE.HemisphereLight(0xd8e6ff,0x4a4030,1.15);scene.add(hemi);
const sun=new THREE.DirectionalLight(0xfff0d8,2.6);sun.castShadow=true;sun.shadow.bias=-.0006;sun.shadow.normalBias=.04;Object.assign(sun.shadow.camera,{left:-48,right:48,top:48,bottom:-48,near:5,far:220});scene.add(sun,sun.target);
const fill=new THREE.DirectionalLight(0x8ab0ff,.5);fill.position.set(40,30,-60);scene.add(fill);
let world=null,fxStack=null,worldMap=-1;
const POST={bloom:.55,bloomRadius:.45,bloomThreshold:.86,vignette:.3,saturation:1.1,grain:.02,exposure:1.05};
function applyQuality(q){gfx=q;R.setPixelRatio(Math.min(devicePixelRatio,q>=2?1.5:q===1?1.25:1));sun.castShadow=q>=1;const ms=q>=2?2048:1024;if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}fxStack=null;resize();}
fogify(MAT.bld);fogify(MAT.glow);
/* ================= effects ================= */
const parts=new Particles(scene,gfx>=1?6000:3000,true),smoke=new Particles(scene,1500,false),decals=new Decals(scene,72),shocks=new Shocks(scene,16),strips=new Strips(scene,96);
const flashL=[0,1,2,3].map(()=>{const l=new THREE.PointLight(0xffc070,0,18,1.6);scene.add(l);return{l,t:0};});let fli=0;
function flash(x,y,z,c,i=40,d=16){if(gfx===0)return;const L=flashL[fli++%4];L.l.position.set(x,y,z);L.l.color.set(c);L.l.intensity=i;L.l.distance=d;L.t=.3;}
const colCache={};const col=s=>colCache[s]||(colCache[s]=new THREE.Color(s));
const snd=new Sound();
/* ================= state ================= */
let app='menu',S=null,brains=[],me=null,pt=0,paused=false,menuT=0,shake=0,lastAward=null,revealAll=false,spd=1,FAST=false,noHud=false;
let sel=[],groups=Array.from({length:10},()=>[]),mode=null,hover=null,lastAlert=null,lastGrp={i:-1,t:0};
const cam={x:0,z:0,zoom:52,tx:0,tz:0};let H=()=>0;
/* ================= unit instancing ================= */
const MAXI=220,UI={};
function mkInst(geo,mat,shadow){const m=new THREE.InstancedMesh(geo,mat,MAXI);m.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(MAXI*3).fill(1),3);m.count=0;m.visible=false;m.frustumCulled=false;m.castShadow=shadow;m.receiveShadow=false;scene.add(m);return m;}
function uinst(type){if(UI[type])return UI[type];const g=unitGeo(type);return UI[type]={g,n:0,parts:g.parts.map(p=>({p,s:p.s&&mkInst(p.s,MAT.body,true),t:p.t&&mkInst(p.t,MAT.team,true),g:p.g&&mkInst(p.g,MAT.glow,false)}))};}
// selection / hover rings
let rings;{const c=document.createElement('canvas');c.width=c.height=128;const x=c.getContext('2d');const g=x.createRadialGradient(64,64,44,64,64,62);g.addColorStop(0,'rgba(255,255,255,0)');g.addColorStop(.55,'rgba(255,255,255,.12)');g.addColorStop(.82,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,128,128);
 const tex=new THREE.CanvasTexture(c);const geo=new THREE.PlaneGeometry(2,2);geo.rotateX(-Math.PI/2);rings=new THREE.InstancedMesh(geo,new THREE.MeshBasicMaterial({map:tex,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false}),600);rings.instanceColor=new THREE.InstancedBufferAttribute(new Float32Array(600*3),3);rings.count=0;rings.renderOrder=2;rings.frustumCulled=false;scene.add(rings);}
// building ghost for placement
let ghost=null,ghostType=null;const ghostMat=new THREE.MeshBasicMaterial({color:'#7dff9a',transparent:true,opacity:.35,depthWrite:false});
const ghostPad=new THREE.Mesh(new THREE.PlaneGeometry(1,1).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:'#7dff9a',transparent:true,opacity:.25,depthWrite:false}));ghostPad.visible=false;ghostPad.renderOrder=3;scene.add(ghostPad);
/* ================= per-world views ================= */
const bviews=new Map(),uviews=new Map(),pviews=new Map(),teamMats={};let oreInst=null,oreList=[],vents=[];
function teamMat(c){return teamMats[c]||(teamMats[c]=fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.42,metalness:.25,color:c})));}
function ensureWorld(idx){if(worldMap===idx&&world)return;if(world)for(const o of world.objs){scene.remove(o);if(o.geometry)o.geometry.dispose();}world=null;worldMap=idx;}
function setupWorld(sim){ensureWorld(sim.M.idx);clearViews();const M=sim.M;H=M.height;setHeight(M.height);
 if(!world){world=buildWorld(scene,M,gfx);}fogInit(M.N,M.size);
 // resources
 oreList=sim.ents.filter(e=>e.cls==='r'&&e.rk==='ore');if(oreInst){scene.remove(oreInst);}oreInst=new THREE.InstancedMesh(oreGeo(),fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.3,metalness:.35,emissive:'#5a3a08',emissiveIntensity:.35,flatShading:true})),oreList.length);oreInst.castShadow=true;scene.add(oreInst);
 for(const v of vents){scene.remove(v.m);}vents=[];const vg=ventGeo(),vgg=ventGlowGeo(),vm=fogify(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,flatShading:true}));
 for(const e of sim.ents)if(e.cls==='r'&&e.rk==='vent'){const g=new THREE.Group();g.add(new THREE.Mesh(vg,vm));const gl=new THREE.Mesh(vgg,MAT.glow);g.add(gl);g.position.set(e.x,H(e.x,e.z)-.1,e.z);g.children[0].receiveShadow=true;scene.add(g);vents.push({e,m:g,gl});}
 const ot=new THREE.Object3D();oreList.forEach((e,i)=>{ot.position.set(e.x,H(e.x,e.z)-.05,e.z);ot.rotation.set(0,(e.id*1.7)%6.28,0);ot.scale.setScalar(1);ot.updateMatrix();oreInst.setMatrixAt(i,ot.matrix);});}
function clearViews(){for(const[,v]of bviews)scene.remove(v.P.root);bviews.clear();uviews.clear();for(const[,v]of pviews)scene.remove(v);pviews.clear();for(const k in UI)for(const p of UI[k].parts)for(const m of[p.s,p.t,p.g])if(m){m.count=0;m.visible=false;}
 decals.clear();shocks.clear();strips.clear();parts.clear();smoke.clear();rings.count=0;}
const tO=new THREE.Object3D(),tM=new THREE.Matrix4(),tP=new THREE.Matrix4(),tC=new THREE.Color(),WHITE=new THREE.Color(1,1,1);
function shown(e){if(!S)return false;if(revealAll||e.team===pt)return true;if(e.cls==='b')return!!e.seen[pt];if(e.cls==='u'&&e.inside)return false;return S.visible(pt,e);}
function updateViews(dt,t){const anim={t,mv:0,ph:0,atk:0,dead:0,id:0,aim:0};for(const k in UI)UI[k].n=0;let ri=0;
 const ring=(x,z,r,c,a=1)=>{if(ri>=600)return;tO.position.set(x,H(x,z)+.08,z);tO.rotation.set(0,0,0);tO.scale.setScalar(r);tO.updateMatrix();rings.setMatrixAt(ri,tO.matrix);tC.copy(c).multiplyScalar(a);rings.setColorAt(ri,tC);ri++;};
 const selSet=new Set(sel);const cSel=col('#5dff8a'),cEn=col('#ff4a3a'),cAl=col('#ffd84a'),cHov=col('#ffffff');
 for(const e of S.ents){
  if(e.cls==='u'){if(e.inside||!shown(e)&&e.alive)continue;let dead=0;if(!e.alive){dead=(S.t-e.deadT)/1.6;if(dead>=1||!shown(e)&&!revealAll&&e.team!==pt&&!S.vis[pt][S.cell(e.x,e.z)])continue;}
   const I=uinst(e.type),g=I.g;if(I.n>=MAXI)continue;let v=uviews.get(e.id);if(!v){v={ph:Math.random()*6,mv:0,yaw:e.yaw,x:e.x,z:e.z,bob:Math.random()*6};uviews.set(e.id,v);}
   v.mv+=((e.moving?1:0)-v.mv)*Math.min(1,dt*10);v.ph+=dt*(e.d.spd*2.2)*v.mv;let dy=e.yaw-v.yaw;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;v.yaw+=dy*Math.min(1,dt*12);
   const lat=e.P.f==='lattice';let y=H(e.x,e.z),rx=0,rz=0,sc=g.scale*1.3;
   if(e.air){y+=4.6+Math.sin(t*1.8+v.bob)*.25;rz=-cl(dy,-.5,.5)*.6;rx=v.mv*.12;}
   if(dead>0){if(e.air){y=Math.max(H(e.x,e.z)+.3,y-dead*dead*12);rz+=dead*3;}else if(lat){sc*=Math.max(.01,1-dead*1.6);y-=dead*.3;}else{rx=-Math.min(1,dead*2.2)*1.45;y-=Math.max(0,dead-.5)*1.2;}}
   anim.mv=v.mv;anim.ph=v.ph;anim.atk=e.atkAnim>0?Math.sin(Math.min(1,e.atkAnim/.35)*Math.PI):0;anim.id=e.id;anim.aim=0;
   tO.position.set(e.x,y,e.z);tO.rotation.set(rx,v.yaw,rz,'YXZ');tO.scale.setScalar(sc);tO.updateMatrix();
   const n=I.n++;const flashK=e.hitT>0&&e.alive?2.2:1;const tc=col(e.P.col);
   for(const p of I.parts){partMatrix(e.type,p.p,anim,tP);tM.multiplyMatrices(tO.matrix,tP);
    if(p.s){p.s.setMatrixAt(n,tM);tC.setRGB(flashK,flashK,flashK);p.s.setColorAt(n,tC);}if(p.t){p.t.setMatrixAt(n,tM);tC.copy(tc).multiplyScalar(flashK);p.t.setColorAt(n,tC);}if(p.g){p.g.setMatrixAt(n,tM);p.g.setColorAt(n,dead>0?tC.setRGB(.3,.3,.3):WHITE);}}
   if(e.alive){const s=selSet.has(e),hv=hover===e;if(s||hv)ring(e.x,e.z,e.r*1.45*(e.air?1:1),s?(e.team===pt?(e.owner===me.i?cSel:cAl):cEn):cHov,s?1:.55);
    if(e.carry&&e.carry.n&&gfx>0&&Math.random()<dt*2){const c=e.carry.k==='o'?col('#ffd060'):col('#50ffc0');parts.emit(e.x,y+1.9,e.z,0,.4,0,c.r,c.g,c.b,.35,.4);}
    if(e.d.worker&&e.mining&&Math.random()<dt*5){const o=e.q[0]&&e.q[0].t;if(o)parts.burst(o.x,y+.8,o.z,2,3,col('#ffe090'),.25,.35,{up:1,grav:6});}
    if(e.building&&Math.random()<dt*6){const b=e.building;parts.burst(b.x+(Math.random()-.5)*b.r*1.6,H(b.x,b.z)+Math.random()*2.5,b.z+(Math.random()-.5)*b.r*1.6,3,4,col('#ffd890'),.25,.3,{grav:8});}}
   continue;}
  if(e.cls==='b'){let v=bviews.get(e.id);if(!e.alive&&!v)continue;if(!v){if(!shown(e))continue;const P=bldModel(e.type,e.P.col);const tm=teamMat(e.P.col);P.root.traverse(o=>{if(o.isMesh&&o.material!==MAT.bld&&o.material!==MAT.glow){o.material=tm;}});
    P.root.position.set(e.x,H(e.x,e.z)-.05,e.z);scene.add(P.root);v={P,born:S.t};bviews.set(e.id,v);}
   const root=v.P.root;root.visible=shown(e)||!e.alive;
   if(!e.alive){const k=(S.t-e.deadT)/2.2;if(k>=1){scene.remove(root);bviews.delete(e.id);continue;}v.P.inner.position.y=-k*k*e.r*1.2;v.P.inner.rotation.z=k*.12;v.P.inner.rotation.x=k*.08;if(Math.random()<dt*20){const c=col('#5a5048');smoke.emit(e.x+(Math.random()-.5)*e.r*2,H(e.x,e.z)+1,e.z+(Math.random()-.5)*e.r*2,0,1.5,0,c.r,c.g,c.b,2.6,1.4,0,1,1.2);}continue;}
   const pr=e.done?1:e.prog;if(e.P.f==='lattice'){const s=.3+.7*pr;v.P.inner.scale.set(s,s,s);}else{v.P.inner.scale.set(1,.15+.85*pr,1);}
   if(v.P.turret){let dy=(e.yaw||0)-v.P.turret.rotation.y;while(dy>Math.PI)dy-=Math.PI*2;while(dy<-Math.PI)dy+=Math.PI*2;v.P.turret.rotation.y+=dy*Math.min(1,dt*10);}
   if(v.P.spin)v.P.spin.rotation.y=t*.6+e.id;
   const s=selSet.has(e),hv=hover===e;if(s||hv)ring(e.x,e.z,e.r*1.35,s?(e.team===pt?cSel:cEn):cHov,s?1:.5);
   if(e.done&&e.queue.length&&e.d.trains&&Math.random()<dt*3&&root.visible){const c=col(e.P.F.glow);parts.emit(e.x+(Math.random()-.5)*e.r,H(e.x,e.z)+e.r*1.2,e.z+(Math.random()-.5)*e.r,0,1.2,0,c.r,c.g,c.b,.45,.9);}
   if(e.hp<e.mhp*.5&&e.done&&root.visible&&Math.random()<dt*(e.hp<e.mhp*.25?10:4)){const fire=e.P.f==='compact';const c=col(fire?'#3a3632':'#6a4a90');smoke.emit(e.x+(Math.random()-.5)*e.r,H(e.x,e.z)+e.r,e.z+(Math.random()-.5)*e.r,0,2,0,c.r,c.g,c.b,2,1.6,0,1,1.4);if(fire){const f=col('#ff8a30');parts.emit(e.x+(Math.random()-.5)*e.r,H(e.x,e.z)+e.r*.9,e.z+(Math.random()-.5)*e.r,0,2,0,f.r,f.g,f.b,.8,.5);}}
   continue;}}
 for(const k in UI)for(const p of UI[k].parts)for(const m of[p.s,p.t,p.g])if(m){m.count=UI[k].n;m.visible=UI[k].n>0;m.instanceMatrix.needsUpdate=true;m.instanceColor.needsUpdate=true;}
 // resources
 const ot=new THREE.Object3D();oreList.forEach((e,i)=>{const k=e.alive?Math.sqrt(e.amt/e.amt0)*.55+.45:0;ot.position.set(e.x,H(e.x,e.z)-.05,e.z);ot.rotation.set(0,(e.id*1.7)%6.28,0);ot.scale.setScalar(k);ot.updateMatrix();oreInst.setMatrixAt(i,ot.matrix);
  if(e.alive&&(selSet.has(e)||hover===e))ring(e.x,e.z,1.4,col('#ffe08a'),.8);});oreInst.instanceMatrix.needsUpdate=true;
 for(const v of vents){const e=v.e;v.gl.visible=e.amt>0;if(e.amt>0&&!e.ext&&gfx>0&&Math.random()<dt*2.5&&(revealAll||S.vis[pt][S.cell(e.x,e.z)])){const c=col('#60ffd0');smoke.emit(e.x+(Math.random()-.5),H(e.x,e.z)+.6,e.z+(Math.random()-.5),0,1.8,0,c.r*.35,c.g*.4,c.b*.4,1,1.4,0,.6,1.4);}
  if(e.ext&&e.ext.alive&&e.ext.done&&Math.random()<dt*2&&(e.ext.team===pt)){const c=col('#60ffd0');parts.emit(e.x,H(e.x,e.z)+3.4,e.z,0,1.5,0,c.r,c.g,c.b,.6,.8);}}
 rings.count=ri;rings.instanceMatrix.needsUpdate=true;rings.instanceColor.needsUpdate=true;}
/* ---------- projectiles ---------- */
const PG={bullet:new THREE.IcosahedronGeometry(.12,0),rail:new THREE.CylinderGeometry(.05,.05,1.6,5).rotateX(Math.PI/2),shell:new THREE.IcosahedronGeometry(.28,1),spine:new THREE.OctahedronGeometry(.22,0).scale(.6,.6,2.4),geode:new THREE.DodecahedronGeometry(.42,0)};
const PM={bullet:new THREE.MeshBasicMaterial({color:new THREE.Color('#ffe0a0').multiplyScalar(2.4),toneMapped:false}),rail:new THREE.MeshBasicMaterial({color:new THREE.Color('#9af8ff').multiplyScalar(2.4),toneMapped:false}),
 shell:new THREE.MeshStandardMaterial({color:'#3a3a34',roughness:.5,emissive:'#ff7020',emissiveIntensity:.4}),spine:new THREE.MeshBasicMaterial({color:new THREE.Color('#ff9af0').multiplyScalar(1.8),toneMapped:false}),geode:new THREE.MeshStandardMaterial({color:'#7a50b0',roughness:.3,emissive:'#c060ff',emissiveIntensity:1.2,flatShading:true})};
const TRAIL={shell:'#6a5a4a',geode:'#c060ff',spine:'#ff8af0',rail:'#5af0ff'};
function updateProjs(dt,t){const live=new Set(S.projs);for(const m of S.projs){let v=pviews.get(m);const vis=revealAll||m.team===pt||S.vis[pt][S.cell(m.x,m.z)];
  if(!v){v=new THREE.Mesh(PG[m.look]||PG.bullet,PM[m.look]||PM.bullet);scene.add(v);pviews.set(m,v);}v.visible=!!vis;if(!vis)continue;
  const y=m.y+H(m.x,m.z)*.7;v.position.set(m.x,y,m.z);v.lookAt(m.tx,m.ty+H(m.tx,m.tz),m.tz);if(m.look==='geode'||m.look==='shell')v.rotation.x+=t*9;
  const tr=TRAIL[m.look];if(tr&&gfx>0){const c=col(tr);if(m.look==='shell'||m.look==='geode'){(m.look==='shell'?smoke:parts).emit(m.x,y,m.z,0,.3,0,c.r,c.g,c.b,m.look==='shell'?.9:.6,m.look==='shell'?.9:.4,0,1,1);}else if(Math.random()<.5)parts.emit(m.x,y,m.z,0,0,0,c.r,c.g,c.b,.3,.18);}}
 for(const[m,v]of pviews)if(!live.has(m)){scene.remove(v);pviews.delete(m);}}
/* ================= events -> effects, sounds, messages ================= */
const near=(x,z,r=70)=>Math.hypot(x-cam.x,z-cam.z)<r;
const sp=(x,z)=>({x,y:H(x,z),z});
function burstAt(x,y,z,n,s,c,size,life,o){if(gfx===0)n=Math.ceil(n*.5);parts.burst(x,y,z,n,s,col(c),size,life,o);}
function boomFx(x,z,r,c,big){const h=H(x,z)+.3;burstAt(x,h+.5,z,big?70:30,r*3.4,c,.75,.75,{up:1,drag:2});burstAt(x,h+.3,z,big?30:12,r*2.2,'#ffffff',.4,.35,{up:1});shocks.fire(x,h,z,c,r*1.2,.5);
 decals.add({x,z,r:r*1.15,col:c,mode:2,life:.5,fade:1,grow:1});const cc=col('#3a3430');for(let i=0;i<(big?16:7);i++)smoke.emit(x+(Math.random()-.5)*r,h+.6,z+(Math.random()-.5)*r,(Math.random()-.5)*2,1+Math.random()*1.6,(Math.random()-.5)*2,cc.r,cc.g,cc.b,big?3:2,1.4,0,1,1.4);
 flash(x,h+2.5,z,c,big?140:60,r*4.5);if(near(x,z,35))shake=Math.max(shake,big?.8:.25);}
function muzzle(u){const y=(u.cls==='b'?(u.d.size>=3?5:4):u.air?4.6:1.2)+H(u.x,u.z);return{x:u.x+Math.sin(u.yaw||0)*(u.r+.3),y,z:u.z+Math.cos(u.yaw||0)*(u.r+.3)};}
function tpos(t){return{x:t.x,y:H(t.x,t.z)+(t.air?4.6:t.cls==='b'?1.8:1),z:t.z};}
function msg(text,cls='',ms=3200){toast($('msgs'),text,ms,4,false).className=cls;}
function banner(t,s,cls,dur=3){const b=$('banner');b.querySelector('b').textContent=t;b.querySelector('span').textContent=s||'';b.className='on '+(cls||'');bannerT=dur;}let bannerT=0;
const SHOT_SND={bullet:'bullet',rail:'rail',shell:'shell',spine:'spine',geode:'geode',arc:'arc'};
function processEvents(){for(const e of S.ev){try{handle(e);}catch(err){console.error(err);}}S.ev.length=0;}
let fightLvl=0;
function handle(e){const mine=e.p===me.i;switch(e.k){
 case'shot':{const u=e.u,t=e.t;if(!shown(u)&&!shown(t))return;const vis=near(u.x,u.z);if(!vis)return;fightLvl=Math.min(1,fightLvl+.02);const m=muzzle(u);const look=e.look;
  if(look==='melee'){snd.play(u.P.f==='lattice'?'claw':'melee',sp(u.x,u.z),.8);if(gfx>0)burstAt(t.x,H(t.x,t.z)+1,t.z,5,3,u.P.f==='lattice'?'#ff9af0':'#ffd0a0',.3,.25,{grav:6});return;}
  snd.play(SHOT_SND[look],sp(u.x,u.z),.7);const c=look==='rail'?'#9af8ff':look==='spine'?'#ff9af0':look==='geode'?'#c060ff':look==='arc'?'#e0a0ff':'#ffd080';
  burstAt(m.x,m.y,m.z,look==='shell'?10:3,look==='shell'?5:3,c,look==='shell'?.6:.35,.15);if(look==='shell'){flash(m.x,m.y,m.z,'#ffa040',40,10);const cc=col('#5a5048');for(let i=0;i<5;i++)smoke.emit(m.x,m.y,m.z,(Math.random()-.5)*2,1,(Math.random()-.5)*2,cc.r,cc.g,cc.b,1.6,1,0,1,1);}
  const tp=tpos(t);if(look==='bullet')strips.add(m,tp,'#ffd890',.05,.06);else if(look==='rail'){strips.add(m,tp,'#5af0ff',.14,.22);strips.add(m,tp,'#ffffff',.05,.12);}else if(look==='arc')strips.add(m,tp,'#e0a0ff',.12,.2,7);return;}
 case'arc':{if(!shown(e.a)&&!shown(e.b))return;strips.add(tpos(e.a),tpos(e.b),'#e0a0ff',.12,.2,6);break;}
 case'impact':{if(!revealAll&&!S.vis[pt][S.cell(e.x,e.z)])return;if(!near(e.x,e.z))return;if(e.spl){const c=e.look==='geode'?'#c060ff':'#ffa040';boomFx(e.x,e.z,e.spl,c,false);snd.play(e.look==='geode'?'crystal':'boom',sp(e.x,e.z),.7);decals.add({x:e.x,z:e.z,r:e.spl*.9,col:'#201810',mode:2,life:6,fade:1});}
  else{const c=e.look==='spine'?'#ff9af0':e.look==='rail'?'#9af8ff':'#ffe0a0';burstAt(e.x,(e.y||1)+H(e.x,e.z),e.z,e.look==='rail'?10:4,4,c,.3,.22,{grav:4});if(Math.random()<.3)snd.play('hit',sp(e.x,e.z),.5);}break;}
 case'die':{const u=e.e;if(!shown(u)&&!revealAll&&!(u.cls==='b'&&u.seen[pt]))return;const h=H(u.x,u.z);
  if(u.cls==='b'){boomFx(u.x,u.z,u.r*1.3,u.P.f==='lattice'?'#c060ff':'#ff8a30',true);snd.play('collapse',sp(u.x,u.z));if(u.P.f==='lattice')burstAt(u.x,h+2,u.z,80,10,['#e0a0ff','#ffffff','#9a70ff'],.6,1.3,{up:1,grav:9});decals.add({x:u.x,z:u.z,r:u.r*1.6,col:'#181410',mode:2,life:30,fade:1});if(u.owner===me.i)msg(B[u.type].n+' destroyed','bad');break;}
  if(u.P.f==='lattice'){burstAt(u.x,h+1+(u.air?4:0),u.z,u.d.sup>=3?40:18,6,['#e0a0ff','#ff8af0','#ffffff',u.P.col],.4,.9,{up:1,grav:10});flash(u.x,h+1,u.z,'#c080ff',20,8);snd.play('shatter',sp(u.x,u.z));}
  else if(u.d.tags.includes('mech')){boomFx(u.x,u.z,2.2,'#ff8a30',false);snd.play('mechdie',sp(u.x,u.z));}
  else{burstAt(u.x,h+1,u.z,10,3,'#8a2020',.35,.5,{grav:8});const c=col('#6a6050');for(let i=0;i<4;i++)smoke.emit(u.x,h+.4,u.z,(Math.random()-.5)*2,.6,(Math.random()-.5)*2,c.r,c.g,c.b,1.2,.8,0,1,1);snd.play('die',sp(u.x,u.z),.7);}
  if(u.owner===me.i&&!u.d.worker&&Math.random()<.15)fightLvl=1;break;}
 case'nova':{decals.add({x:e.x,z:e.z,r:e.r,col:'#8a3aaa',mode:0,life:1});snd.play('nova',sp(e.x,e.z));burstAt(e.u.x,H(e.u.x,e.u.z)+2.5,e.u.z,20,4,'#e0a0ff',.5,.6);break;}
 case'blast':{boomFx(e.x,e.z,e.r,'#d070ff',true);burstAt(e.x,H(e.x,e.z)+1,e.z,60,9,['#ffffff','#f0c0ff','#c060ff'],.5,1,{up:1,grav:6});snd.play('blast',sp(e.x,e.z));break;}
 case'heal':{if(!shown(e.u)||!near(e.u.x,e.u.z))return;strips.add(()=>tpos(e.u),()=>tpos(e.t),'#7aff9a',.08,.35);burstAt(e.t.x,H(e.t.x,e.t.z)+1.2,e.t.z,4,1.5,'#9aff9a',.35,.6,{up:1});snd.play('heal',sp(e.u.x,e.u.z),.5);break;}
 case'place':{if(e.b.owner===me.i)snd.play('place');burstAt(e.b.x,H(e.b.x,e.b.z)+.5,e.b.z,20,4,e.b.P.f==='lattice'?'#d07aff':'#d8c8a0',.5,.6,{up:1});break;}
 case'built':{if(e.b.owner===me.i){snd.play('built');msg(B[e.b.type].n+' complete','good');}if(shown(e.b))burstAt(e.b.x,H(e.b.x,e.b.z)+2,e.b.z,30,6,e.b.P.F.glow,.5,.8,{up:1});break;}
 case'trained':{if(e.u.owner===me.i){snd.play('trained');}if(shown(e.u))burstAt(e.u.x,H(e.u.x,e.u.z)+1,e.u.z,10,3,e.u.P.F.glow,.35,.5,{up:1});break;}
 case'research':if(mine){snd.play('research');msg('Research complete: '+UP[e.key].n,'good',4500);}break;
 case'deposit':if(e.u.owner===me.i&&near(e.u.x,e.u.z,40))snd.play('deposit',sp(e.u.x,e.u.z));break;
 case'depleted':if(e.e.team===-1&&near(e.e.x,e.e.z,40)&&e.e.rk==='vent')msg('Aether vent depleted','info');break;
 case'msg':if(mine){msg(e.text,'bad');snd.play('deny');}break;
 case'alarm':if(mine&&!(Math.hypot(e.x-cam.x,e.z-cam.z)<25)){lastAlert={x:e.x,z:e.z,t:S.t};snd.play('alarm');msg(e.worker?'Your workers are under attack':e.bld?'Your base is under attack':'Your forces are under attack','bad',4000);pings.push({x:e.x,z:e.z,t:0});}else if(mine)lastAlert={x:e.x,z:e.z,t:S.t};break;
 case'elim':{const p=S.players[e.p];banner(p===me?'YOU HAVE BEEN ELIMINATED':p.name+' ELIMINATED',p.team===pt?'An allied base has fallen':'An enemy commander is out',p.team===pt?'red':'blue',4);snd.play('horn');break;}}}
const pings=[];
/* ================= input ================= */
const I=controls(canvas,{canLock:()=>false,menu:()=>true,onKey:(e,first)=>{if(app!=='play')return;if(['Tab','Space','F1','F2','F10','Backspace'].includes(e.code)||e.code.startsWith('Digit')||(e.ctrlKey&&e.code.startsWith('Digit')))e.preventDefault();if(first)keyDown(e);}});
let mx=innerWidth/2,my=innerHeight/2,mIn=true,down=null,dragging=false,mdrag=null,lastClick={t:0,e:null};
addEventListener('mousemove',e=>{mx=e.clientX;my=e.clientY;mIn=true;if(down&&!dragging&&Math.hypot(mx-down.x,my-down.y)>7)dragging=true;
 if(dragging){const b=$('boxsel');b.hidden=false;b.style.left=Math.min(mx,down.x)+'px';b.style.top=Math.min(my,down.y)+'px';b.style.width=Math.abs(mx-down.x)+'px';b.style.height=Math.abs(my-down.y)+'px';}
 if(mdrag){const k=cam.zoom/innerHeight*1.1;cam.tx=mdrag.cx-(mx-mdrag.x)*k;cam.tz=mdrag.cz-(my-mdrag.y)*k*1.2;}});
document.addEventListener('mouseleave',()=>mIn=false);
addEventListener('wheel',e=>{if(app==='play'&&e.target===canvas)cam.zoom=cl(cam.zoom+Math.sign(e.deltaY)*4,26,80);},{passive:true});
canvas.addEventListener('mousedown',e=>{if(app!=='play'||paused)return;snd.init();
 if(e.button===1){e.preventDefault();mdrag={x:e.clientX,y:e.clientY,cx:cam.tx,cz:cam.tz};return;}
 if(e.button===2){if(mode){mode=null;setMode(null);return;}smart(e.shiftKey);return;}
 if(e.button===0){if(mode){execMode(e.shiftKey);return;}down={x:e.clientX,y:e.clientY,shift:e.shiftKey,ctrl:e.ctrlKey};dragging=false;}});
addEventListener('mouseup',e=>{if(e.button===1)mdrag=null;if(e.button!==0||!down)return;const d=down;down=null;$('boxsel').hidden=true;if(app!=='play'){dragging=false;return;}
 if(dragging)boxSelect(d,e.shiftKey);else clickSelect(e.shiftKey,e.ctrlKey);dragging=false;});
const ray=new THREE.Raycaster(),ndc=new THREE.Vector2(),plane=new THREE.Plane(new THREE.Vector3(0,1,0),0),hitP=new THREE.Vector3(),prj=new THREE.Vector3();
function groundAt(px,py){ndc.set(px/innerWidth*2-1,-(py/innerHeight)*2+1);ray.setFromCamera(ndc,camera);plane.constant=0;if(!ray.ray.intersectPlane(plane,hitP))return null;// refine once against the terrain height
 const h=H(hitP.x,hitP.z);if(Math.abs(h)>.3){plane.constant=-h;if(ray.ray.intersectPlane(plane,hitP)){}plane.constant=0;}return[hitP.x,hitP.z];}
function scr(x,y,z){prj.set(x,y,z).project(camera);return[(prj.x*.5+.5)*innerWidth,(-prj.y*.5+.5)*innerHeight,prj.z];}
function entH(e){return e.cls==='b'?e.d.size*.9:e.cls==='r'?.8:e.air?4.6+.6:.9*(e.r/.6);}
function pickAt(px,py){if(!S)return null;let best=null,bd=1e9;for(const e of S.ents){if(!e.alive)continue;if(e.cls!=='r'&&!shown(e))continue;if(e.cls==='u'&&e.inside)continue;if(e.cls==='r'&&e.rk==='vent'&&e.ext)continue;
  if(e.cls==='r'&&!revealAll&&!S.exp[pt][S.cell(e.x,e.z)])continue;
  const y=H(e.x,e.z)+(e.cls==='u'&&e.air?4.6:0);const[sx,sy,sz]=scr(e.x,y+entH(e)*.5,e.z);if(sz>1)continue;const[ex]=scr(e.x+Math.max(.8,e.r),y+entH(e)*.5,e.z);let rr=Math.max(14,Math.abs(ex-sx)*(e.cls==='b'?1:1.3));
  const d=Math.hypot(sx-px,sy-py)*(e.cls==='b'?1.6:e.cls==='r'?1.2:1);if(d<rr*(e.cls==='b'?1.6:1)&&d<bd){bd=d;best=e;}}return best;}
const mineU=()=>sel.filter(e=>e.alive&&e.cls==='u'&&e.owner===me.i);const mineB=()=>sel.filter(e=>e.alive&&e.cls==='b'&&e.owner===me.i);
function setSel(list,sound=true){sel=list.filter(e=>e&&e.alive);if(sound&&sel.length)snd.play('select');me.st.acts++;cardSig='';selSig='';}
function onScreen(e){const[sx,sy,sz]=scr(e.x,H(e.x,e.z)+1,e.z);return sz<1&&sx>=0&&sy>=0&&sx<=innerWidth&&sy<=innerHeight-190;}
function clickSelect(shift,ctrl){const e=pickAt(mx,my);const now=performance.now();const dbl=lastClick.e===e&&now-lastClick.t<350;lastClick={t:now,e};
 if(!e){if(!shift)setSel([],false);return;}
 if((dbl||ctrl)&&e.owner===me.i){setSel(S.ents.filter(o=>o.alive&&o.owner===me.i&&o.type===e.type&&!o.inside&&onScreen(o)).concat(shift?sel:[]));return;}
 if(shift&&e.owner===me.i&&sel.every(s=>s.owner===me.i)){if(sel.includes(e))setSel(sel.filter(s=>s!==e));else setSel([...sel,e]);return;}
 setSel([e]);}
function boxSelect(d,shift){const x0=Math.min(d.x,mx),x1=Math.max(d.x,mx),y0=Math.min(d.y,my),y1=Math.max(d.y,my);const inBox=e=>{const y=H(e.x,e.z)+(e.air?4.6:.6);const[sx,sy,sz]=scr(e.x,y,e.z);return sz<1&&sx>=x0-6&&sx<=x1+6&&sy>=y0-6&&sy<=y1+6;};
 let list=S.ents.filter(e=>e.alive&&e.cls==='u'&&e.owner===me.i&&!e.inside&&inBox(e));if(!list.length)list=S.ents.filter(e=>e.alive&&e.cls==='b'&&e.owner===me.i&&inBox(e));
 if(shift)list=[...new Set([...sel.filter(e=>e.owner===me.i),...list])];if(list.length||!shift)setSel(list);}
function marker(x,z,c){decals.add({x,z,r:1,col:c,mode:2,life:.4,fade:1,grow:1});}
function smart(shift){const g=groundAt(mx,my);if(!g)return;const[gx,gz]=g;const t=pickAt(mx,my);const us=mineU(),bs=mineB();
 if(us.length){const workers=us.filter(u=>u.d.worker),others=us.filter(u=>!u.d.worker);
  if(t&&t.team!==pt&&t.cls!=='r'){S.cmd(me,us,{k:'attack',t},shift);snd.play('attackorder');decals.add({x:t.x,z:t.z,r:t.r+.8,col:'#ff4a3a',mode:2,life:.35,fade:1});return;}
  if(t&&workers.length&&(t.cls==='r'&&t.rk==='ore'||t.cls==='b'&&t.owner===me.i&&t.d.ext&&t.done)){S.cmd(me,workers,{k:'gather',t},shift);if(others.length)S.cmd(me,others,{k:'move',x:gx,z:gz},shift);snd.play('order');marker(t.x,t.z,'#ffe08a');return;}
  if(t&&workers.length&&t.cls==='b'&&t.owner===me.i&&!t.done&&me.f==='compact'){S.cmd(me,workers,{k:'build',type:t.type,x:t.x,z:t.z,b:t},shift);snd.play('order');return;}
  if(t&&workers.length&&t.cls==='b'&&t.owner===me.i&&t.d.drop&&t.done&&workers.some(w=>w.carry&&w.carry.n)){S.cmd(me,workers.filter(w=>w.carry&&w.carry.n),{k:'return'},shift);snd.play('order');return;}
  if(t&&t.cls==='u'&&t.team===pt&&!us.includes(t)){S.cmd(me,us,{k:'follow',t},shift);snd.play('order');marker(t.x,t.z,'#7dff9a');return;}
  S.cmd(me,us,{k:'move',x:gx,z:gz},shift);snd.play('order');marker(gx,gz,'#7dff9a');return;}
 if(bs.length){S.rally(me,bs,gx,gz,t&&(t.cls==='r'||t.team!==pt||t.d&&t.d.ext)?t:null);marker(gx,gz,'#ffd84a');snd.play('order');}}
function setMode(m){mode=m;document.body.classList.toggle('aim',!!m&&m.k!=='build');if(!m||m.k!=='build'){if(ghost){scene.remove(ghost.root);ghost=null;ghostType=null;}ghostPad.visible=false;}}
function execMode(shift){const g=groundAt(mx,my);if(!g)return;const[gx,gz]=g;const m=mode;const us=mineU();
 if(m.k==='build'){const ws=us.filter(u=>u.d.worker);if(S.build(me,ws,m.type,gx,gz,shift)){snd.play('order');if(!shift)setMode(null);}return;}
 const t=pickAt(mx,my);
 if(m.k==='amove'){if(t&&t.team!==pt&&t.cls!=='r')S.cmd(me,us,{k:'attack',t},shift);else S.cmd(me,us,{k:'amove',x:gx,z:gz},shift);marker(gx,gz,'#ff4a3a');snd.play('attackorder');}
 else if(m.k==='move'){S.cmd(me,us,{k:'move',x:gx,z:gz},shift);marker(gx,gz,'#7dff9a');snd.play('order');}
 else if(m.k==='patrol'){S.cmd(me,us,{k:'patrol',x:gx,z:gz},shift);marker(gx,gz,'#ffd84a');snd.play('order');}
 else if(m.k==='nova'){const ws=us.filter(u=>u.d.nova&&u.novaCd<=0).sort((a,b)=>Math.hypot(a.x-gx,a.z-gz)-Math.hypot(b.x-gx,b.z-gz));if(!ws.length){msg('Shatter Nova is recharging','bad');snd.play('deny');}else{S.cmd(me,[ws[0]],{k:'nova',x:gx,z:gz},shift);decals.add({x:gx,z:gz,r:U.weaver.nova.r,col:'#e080ff',mode:2,life:.5,fade:1});snd.play('order');}}
 if(!shift)setMode(null);}
function selectGroup(i,add,set){if(set){groups[i]=sel.filter(e=>e.owner===me.i);msg('Group '+i+' set','info',1200);me.st.acts++;return;}if(add){groups[i]=[...new Set([...groups[i],...sel.filter(e=>e.owner===me.i)])];me.st.acts++;return;}
 const g=groups[i].filter(e=>e.alive);groups[i]=g;if(!g.length)return;const now=performance.now();if(lastGrp.i===i&&now-lastGrp.t<400){let x=0,z=0;for(const e of g){x+=e.x;z+=e.z;}cam.tx=x/g.length;cam.tz=z/g.length+4;}lastGrp={i,t:now};setSel(g);}
function keyDown(e){const c=e.code;
 if(c==='Escape'){if(mode){setMode(null);return;}const bs=mineB();const b=bs.find(b=>!b.done||b.queue.length);if(b&&!paused){S.cancel(me,b);snd.play('click');return;}setPause(!paused);return;}
 if(c==='F10'){setPause(!paused);return;}if(paused)return;
 if(c.startsWith('Digit')){const i=+c.slice(5);selectGroup(i,e.shiftKey&&!e.ctrlKey,e.ctrlKey||e.metaKey);return;}
 if(c==='F1'){const idle=S.ents.filter(u=>u.alive&&u.owner===me.i&&u.cls==='u'&&u.d.worker&&!u.q.length);if(idle.length){const u=idle[(idleIdx++)%idle.length];setSel([u]);cam.tx=u.x;cam.tz=u.z+4;}return;}
 if(c==='F2'){setSel(S.ents.filter(u=>u.alive&&u.owner===me.i&&u.cls==='u'&&!u.d.worker));return;}
 if(c==='Space'){if(lastAlert){cam.tx=lastAlert.x;cam.tz=lastAlert.z+4;}return;}
 if(c==='Backspace'){const h=S.ents.find(b=>b.alive&&b.owner===me.i&&b.cls==='b'&&b.d.hq);if(h){cam.tx=h.x;cam.tz=h.z+4;}return;}
 const k=c.startsWith('Key')?c.slice(3):null;if(!k||e.ctrlKey||e.metaKey)return;if('WASDG'.includes(k))return;
 buildCard();const btn=card.find(b=>b&&b.key===k);if(btn){btn.act(e.shiftKey);cardSig='';}}
let idleIdx=0;
/* ================= camera ================= */
function cameraUpdate(dt){if(app==='menu'||!S||!me){const a=menuT*.05;const hq=S&&S.players[0].hq0||{x:0,z:0};cam.x=hq.x-12+Math.sin(a)*5;cam.z=hq.z-2+Math.cos(a*.7)*5;cam.zoom=54;}
 else{const K=I.keys;if(app==='play'&&!paused){const sp=60*dt*(cam.zoom/52);let dx=(K.KeyD||K.ArrowRight?1:0)-(K.KeyA||K.ArrowLeft?1:0),dz=(K.KeyS||K.ArrowDown?1:0)-(K.KeyW||K.ArrowUp?1:0);
   if(mIn&&document.hasFocus()&&!mdrag&&!down){const ed=10;if(mx<ed)dx-=1;if(mx>innerWidth-ed)dx+=1;if(my<ed)dz-=1;if(my>innerHeight-ed)dz+=1;}cam.tx+=dx*sp;cam.tz+=dz*sp;}
  const hf=S.half;cam.tx=cl(cam.tx,-hf+8,hf-8);cam.tz=cl(cam.tz,-hf+2,hf+14);const k=1-Math.exp(-dt*16);cam.x+=(cam.tx-cam.x)*k;cam.z+=(cam.tz-cam.z)*k;}
 const pitch=57*Math.PI/180,D=cam.zoom;camera.position.set(cam.x,D*Math.sin(pitch),cam.z+D*Math.cos(pitch));camera.lookAt(cam.x,0,cam.z);
 if(shake>0){shake=Math.max(0,shake-dt*2.4);const s=shake*shake*.5;camera.position.x+=(Math.random()-.5)*s;camera.position.z+=(Math.random()-.5)*s;}
 sun.position.set(cam.x-34,74,cam.z+22);sun.target.position.set(cam.x,0,cam.z-6);const sc=Math.max(48,cam.zoom*.95);Object.assign(sun.shadow.camera,{left:-sc,right:sc,top:sc,bottom:-sc});sun.shadow.camera.updateProjectionMatrix();snd.listener(cam.x,0,cam.z,0);}
function ghostUpdate(){if(!mode||mode.k!=='build'||!S){ghostPad.visible=false;return;}const g=groundAt(mx,my);if(!g)return;const pl=S.canPlace(me,mode.type,g[0],g[1]);const d=B[mode.type];
 if(ghostType!==mode.type){if(ghost)scene.remove(ghost.root);ghost=bldModel(mode.type,me.col);ghost.root.traverse(o=>{if(o.isMesh){o.material=ghostMat;o.castShadow=false;}});scene.add(ghost.root);ghostType=mode.type;}
 const ok=pl.ok&&S.afford(me,d.cost);ghostMat.color.set(ok?'#7dff9a':'#ff5a4a');ghostPad.material.color.set(ok?'#7dff9a':'#ff5a4a');ghost.root.position.set(pl.x,H(pl.x,pl.z),pl.z);
 const s=d.size*CS;ghostPad.visible=true;ghostPad.scale.set(s,1,s);ghostPad.position.set(pl.x,H(pl.x,pl.z)+.15,pl.z);}
/* ================= portraits (rendered from the models on demand) ================= */
const portraits={};let prt=null;
function portrait(type,c='#3f8cff'){const key=type+c;if(portraits[key])return portraits[key];
 if(!prt){const ps=new THREE.Scene();ps.add(new THREE.HemisphereLight(0xffffff,0x667788,2.1));const dl=new THREE.DirectionalLight(0xffffff,3.4);dl.position.set(3,5,4);ps.add(dl);const rl=new THREE.DirectionalLight(0x9ab8ff,1.6);rl.position.set(-4,2,-3);ps.add(rl);
  prt={ps,rt:new THREE.WebGLRenderTarget(112,112,{samples:4}),pc:new THREE.PerspectiveCamera(30,1,.1,200),buf:new Uint8Array(112*112*4),cv:document.createElement('canvas')};prt.cv.width=prt.cv.height=112;}
 const{ps,rt,pc,buf,cv}=prt;const grp=new THREE.Group();let hy,dist;
 if(U[type]){const g=unitGeo(type),tm=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.4,metalness:.25,color:c});const a={t:.6,mv:0,ph:0,atk:0,dead:0,id:1,aim:0};
  for(const p of g.parts){const m4=partMatrix(type,p,a,new THREE.Matrix4());for(const[geo,mat]of[[p.s,MAT.body],[p.t,tm],[p.g,MAT.glow]])if(geo){const m=new THREE.Mesh(geo,mat);m.applyMatrix4(m4);grp.add(m);}}
  grp.scale.setScalar(g.scale);const hh=g.air?0:1;hy=(g.air?.2:1.2)*g.scale*hh+(g.air?0:0);dist=(U[type].r*3.4+2.4)*(g.air?1.3:1);if(type==='carapace'||type==='lobber'||type==='bombard')dist*=1.15;}
 else{const P=bldModel(type,c);grp.add(P.root);const s=B[type].size*CS;hy=s*.35;dist=s*2.1+2;}
 grp.rotation.y=.55;ps.add(grp);pc.position.set(dist*.45,hy+dist*.42,dist*.85);pc.lookAt(0,hy,0);
 const f=(U[type]||B[type]).f;ps.background=new THREE.Color(f==='lattice'?'#3a2850':'#1c2c40');const pr=R.getPixelRatio(),fo=fogU.uFogOn.value;fogU.uFogOn.value=0;R.setPixelRatio(1);R.setRenderTarget(rt);R.render(ps,pc);fogU.uFogOn.value=fo;R.readRenderTargetPixels(rt,0,0,112,112,buf);R.setRenderTarget(null);R.setPixelRatio(pr);ps.remove(grp);
 const x=cv.getContext('2d'),img=x.createImageData(112,112);for(let j=0;j<112;j++)for(let i=0;i<112;i++){const s=((111-j)*112+i)*4,t=(j*112+i)*4;for(let k=0;k<4;k++)img.data[t+k]=buf[s+k];}x.putImageData(img,0,0);
 const gr=x.createLinearGradient(0,60,0,112);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.5)');x.fillStyle=gr;x.fillRect(0,0,112,112);return portraits[key]=cv.toDataURL('image/jpeg',.88);}
// command and upgrade glyphs drawn on a canvas
const glyphs={};
function glyph(k,c='#bfe0ff'){if(glyphs[k+c])return glyphs[k+c];const cv=document.createElement('canvas');cv.width=cv.height=96;const x=cv.getContext('2d');const g=x.createLinearGradient(0,0,0,96);g.addColorStop(0,'#1e2a40');g.addColorStop(1,'#0c1220');x.fillStyle=g;x.fillRect(0,0,96,96);
 x.strokeStyle=c;x.fillStyle=c;x.lineWidth=7;x.lineCap=x.lineJoin='round';x.shadowColor=c;x.shadowBlur=10;const P=(pts,close,fill)=>{x.beginPath();pts.forEach(([a,b],i)=>i?x.lineTo(a,b):x.moveTo(a,b));if(close)x.closePath();fill?x.fill():x.stroke();};
 switch(k){case'move':P([[22,74],[70,26]]);P([[44,24],[72,24],[72,52]]);break;case'stop':x.fillRect(28,28,40,40);break;
  case'hold':P([[48,18],[74,28],[70,58],[48,78],[26,58],[22,28]],true);break;
  case'amove':P([[24,72],[66,30]]);P([[58,22],[74,22],[74,38]],true,true);P([[30,52],[44,66]]);break;
  case'patrol':x.beginPath();x.arc(48,48,24,.4,5.5);x.stroke();P([[66,22],[72,38],[56,38]],true,true);break;
  case'nova':for(let i=0;i<8;i++){const a=i/8*Math.PI*2;P([[48+Math.cos(a)*12,48+Math.sin(a)*12],[48+Math.cos(a)*32,48+Math.sin(a)*32]]);}x.beginPath();x.arc(48,48,9,0,7);x.fill();break;
  case'cancel':P([[28,28],[68,68]]);P([[68,28],[28,68]]);break;
  case'wpn':P([[26,70],[66,30]]);P([[58,22],[74,38]]);P([[22,62],[34,74]]);break;
  case'arm':P([[48,16],[76,28],[72,58],[48,80],[24,58],[20,28]],true);x.globalAlpha=.4;P([[48,28],[64,34],[62,54],[48,66],[34,54],[32,34]],true,true);x.globalAlpha=1;break;
  case'drill':for(let i=0;i<3;i++)P([[26,30+i*16],[48,18+i*16],[70,30+i*16]]);break;
  case'shell':P([[18,62],[66,30]]);x.beginPath();x.arc(72,26,8,0,7);x.fill();P([[30,74],[40,60]]);break;
  case'quick':P([[20,48],[44,48]]);P([[34,30],[60,30]]);P([[34,66],[60,66]]);P([[52,48],[78,48]]);P([[66,36],[78,48],[66,60]]);break;
  case'hard':P([[48,16],[74,36],[64,74],[32,74],[22,36]],true);x.globalAlpha=.5;P([[48,30],[62,42],[56,64],[40,64],[34,42]],true,true);x.globalAlpha=1;break;}
 return glyphs[k+c]=cv.toDataURL();}
/* ================= HUD ================= */
let card=[],cardSig='',selSig='',hudT=0;
const costTxt=c=>`<span class="o">◆ ${c[0]}</span>${c[1]?`<span class="a">● ${c[1]}</span>`:''}`;
function primaryOf(list){const order=e=>e.cls==='b'?1:e.d.worker?2:0;return[...list].sort((a,b)=>order(a)-order(b)||(a.type<b.type?-1:1))[0];}
function buildCard(){const us=mineU(),bs=mineB();const c=new Array(15).fill(null);const sig=[];
 const btn=(i,key,img,tip,act,state='')=>{c[i]={key,img,tip,act,state};sig.push(key+state);};
 if(us.length){btn(0,'M',glyph('move'),()=>'<h4>MOVE</h4><p>Move, ignoring enemies. Right-click does this too.</p>',()=>setMode({k:'move'}));btn(1,'X',glyph('stop','#ff9a8a'),()=>'<h4>STOP</h4><p>Cancel all orders.</p>',()=>{S.cmd(me,mineU(),{k:'stop'});snd.play('click');});
  btn(2,'H',glyph('hold','#ffd890'),()=>'<h4>HOLD POSITION</h4><p>Stay put and fire at anything in range.</p>',()=>{S.cmd(me,mineU(),{k:'hold'});snd.play('order');});btn(3,'F',glyph('amove','#ff8a7a'),()=>'<h4>ATTACK-MOVE</h4><p>Move and engage every enemy met on the way.</p>',()=>setMode({k:'amove'}));
  btn(4,'P',glyph('patrol','#9af0b0'),()=>'<h4>PATROL</h4><p>Walk back and forth, engaging enemies.</p>',()=>setMode({k:'patrol'}));
  const pr=primaryOf(us);
  if(pr.d.worker){BUILD_LIST[me.f].forEach((t,k)=>{const d=B[t],miss=S.missing(me,t),can=S.afford(me,d.cost);btn(5+k,d.hot,portrait(t,me.col),()=>`<h4>${d.n}</h4><div class="cost">${costTxt(d.cost)}<span>⏱ ${d.time}s</span>${d.sup?`<span>+${d.sup} supply</span>`:''}</div><p>${d.desc}</p>${d.atk?`<p>Damage ${d.atk.dmg} · range ${d.atk.rng}</p>`:''}${miss?`<p class="req">Requires ${miss}</p>`:''}`,
   ()=>{if(S.missing(me,t)){msg('Requires '+S.missing(me,t),'bad');snd.play('deny');return;}setMode({k:'build',type:t});},miss?'lock':can?'':'no');});}
  else if(us.some(u=>u.d.nova)){const w=us.filter(u=>u.d.nova);const ready=w.some(u=>u.novaCd<=0);btn(5,'N',glyph('nova','#f0a0ff'),()=>`<h4>SHATTER NOVA</h4><p>A Weaver marks an area; after one second it explodes for ${U.weaver.nova.dmg} damage in a ${U.weaver.nova.r} m radius. ${U.weaver.nova.cd}s recharge. CPU-controlled and idle Weavers cast it on clumps by themselves.</p>`,()=>setMode({k:'nova'}),ready?'':'no');}}
 else if(bs.length){const pr=primaryOf(bs),d=pr.d;
  if(!pr.done){btn(14,'Escape',glyph('cancel','#ff8a7a'),()=>'<h4>CANCEL CONSTRUCTION</h4><p>Refunds 75% of the cost.</p>',()=>{S.cancel(me,pr);});}
  else{(d.trains||[]).forEach((t,k)=>{const ud=U[t],miss=S.missing(me,t),can=S.afford(me,ud.cost);btn(k,ud.hot==='Q'&&k?'QERT'[k]:'QERT'[k],portrait(t,me.col),()=>`<h4>${ud.n}</h4><div class="cost">${costTxt(ud.cost)}<span>⏱ ${ud.time}s</span><span>▲ ${ud.sup}</span></div><p>${ud.desc}</p>${ud.strong?`<p class="sw">Strong vs: ${ud.strong}</p><p class="wk">Weak vs: ${ud.weak}</p>`:''}${miss?`<p class="req">Requires ${miss}</p>`:''}`,
    ()=>{const tgt=bs.filter(b=>b.type===pr.type&&b.done).sort((a,b)=>a.queue.length-b.queue.length)[0];if(S.train(me,tgt,t))snd.play('click');},miss?'lock':can?'':'no');});
   const RK=['Z','C','V','B','N'];let ri=0;const shownKinds=new Set();
   for(const key of d.res||[]){const u=UP[key];if(shownKinds.has(u.kind))continue;if(me.up[key]&&!(d.res.some(k2=>UP[k2].prev===key&&!me.up[k2])))continue;if(me.up[key])continue;shownKinds.add(u.kind);
    const miss=S.missing(me,key),busy=S.researching(me,key),can=S.afford(me,u.cost);const gk={wpn:'wpn',arm:'arm',drill:'drill',shell:'shell',quick:'quick',hard:'hard'}[u.kind];
    btn(10+ri,RK[ri],glyph(gk,me.f==='lattice'?'#f0b0ff':'#ffd890'),()=>`<h4>${u.n}</h4><div class="cost">${costTxt(u.cost)}<span>⏱ ${u.time}s</span></div><p>${u.desc}</p>${miss?`<p class="req">Requires ${miss}</p>`:''}${busy?'<p class="sw">Researching…</p>':''}`,
     ()=>{const b=bs.find(b=>b.type===pr.type&&b.done&&!b.queue.length)||pr;if(S.research(me,b,key))snd.play('click');},busy?'on':miss?'lock':can?'':'no');ri++;}
   if(pr.queue.length)btn(14,'Escape',glyph('cancel','#ff8a7a'),()=>'<h4>CANCEL</h4><p>Cancel the last queued item for a full refund.</p>',()=>{S.cancel(me,pr);});}}
 const s=sig.join('|')+'|'+Math.floor(me.ore/25)+','+Math.floor(me.ae/25);if(s===cardSig)return;cardSig=s;card=c;
 const el=$('card');el.innerHTML='';c.forEach((b,i)=>{const d=document.createElement('div');if(!b){d.className='cb empty';el.appendChild(d);return;}d.className='cb '+b.state;d.style.backgroundImage=`url(${b.img})`;d.innerHTML=`<kbd>${b.key==='Escape'?'ESC':b.key}</kbd>`;
  d.onclick=e=>{snd.init();b.act(e.shiftKey);cardSig='';};d.onmouseenter=()=>{tipOn(d,b.tip());};d.onmouseleave=tipOff;el.appendChild(d);});}
function tipOn(el,html){const t=$('tip');t.innerHTML=html;t.hidden=false;const r=el.getBoundingClientRect();t.style.left=Math.min(innerWidth-310,r.left-40)+'px';t.style.top='0px';const h=t.offsetHeight;t.style.top=(r.top-h-8)+'px';}
function tipOff(){$('tip').hidden=true;}
function hpCls(f){return f>.6?'':f>.3?'mid':'low';}
function selPanel(){const list=sel.filter(e=>e.alive);if(list.length!==sel.length){sel=list;cardSig='';}const el=$('sel');
 if(!list.length){if(selSig!=='none'){selSig='none';el.innerHTML=`<div class="info" style="opacity:.5;font-size:.66rem;line-height:1.7">Left-drag to select units · right-click to command<br>Ctrl+1-9 control groups · F1 idle worker · F2 army</div>`;}return;}
 if(list.length===1){const e=list[0];const own=e.owner===me.i;
  if(e.cls==='r'){const s='r'+e.id+'|'+Math.floor(e.amt);if(s===selSig)return;selSig=s;el.innerHTML=`<div class="sone"><div class="info"><h3>${e.rk==='ore'?'ORE NODE':'AETHER VENT'}</h3><p class="role">RESOURCE</p><p class="hpt">${Math.floor(e.amt)} / ${e.amt0} remaining</p><div class="hpb"><i style="width:${e.amt/e.amt0*100}%;background:${e.rk==='ore'?'#f0c050':'#46f0c0'}"></i></div><p class="cnt">${e.rk==='ore'?'Workers mine 5 ore per trip. Two workers per node saturate it.':'Build an extractor on the vent; up to 3 workers harvest 4 aether per trip.'}</p></div></div>`;return;}
  const d=e.d,f=e.hp/e.mhp;const q=e.cls==='b'?e.queue.map(x=>x.type).join(',')+(e.queue[0]?Math.floor(e.queue[0].t/e.queue[0].T*20):'')+(e.done?'':Math.floor(e.prog*40)):'';const s=e.id+'|'+Math.ceil(e.hp)+'|'+q+'|'+(e.carry?e.carry.n:0)+'|'+(e.q?e.q.length&&e.q[0].k:'')+'|'+Math.ceil(e.novaCd||0);if(s===selSig)return;selSig=s;
  let stats='';if(e.cls==='u'){const dm=d.dmg?Math.round(d.dmg*(1+.12*S.wpn(e.P))):0;stats=`${d.dmg?`<span>DMG <b>${dm}${d.bon?' (+'+Object.entries(d.bon).map(([k,v])=>v+' '+k).join(', +')+')':''}</b></span><span>RANGE <b>${S.range(e)<1?'melee':S.range(e)}</b></span>`:''}${d.heal?`<span>HEAL <b>${d.heal}/s</b></span>`:''}<span>ARMOUR <b>${d.ar+S.arm(e.P)}</b></span><span>SPEED <b>${S.speed(e).toFixed(1)}</b></span><span>${d.air?'AIR':'GROUND'} · ${d.tags.join(' · ').toUpperCase()}</span>${d.tg?`<span>HITS <b>${d.tg==='ga'?'GROUND+AIR':d.tg==='g'?'GROUND':'AIR'}</b></span>`:''}`;}
  else stats=`<span>ARMOUR <b>${d.ar}</b></span>${d.sup?`<span>SUPPLY <b>+${d.sup}</b></span>`:''}${d.atk?`<span>DMG <b>${d.atk.dmg}</b></span><span>RANGE <b>${d.atk.rng}</b></span>`:''}${d.ext&&e.vent?`<span>AETHER LEFT <b>${Math.floor(e.vent.amt)}</b></span>`:''}`;
  let extra='';if(e.cls==='u'&&d.strong)extra=`<p class="cnt"><em>Strong vs ${d.strong}</em><br><i>Weak vs ${d.weak}</i></p>`;if(e.cls==='u'&&e.carry&&e.carry.n)extra+=`<p class="cnt">Carrying ${e.carry.n} ${e.carry.k==='o'?'ore':'aether'}</p>`;
  if(e.cls==='u'&&d.nova)extra+=`<p class="cnt">Shatter Nova ${e.novaCd>0?'recharging '+Math.ceil(e.novaCd)+'s':'<em>ready</em> (N)'}</p>`;
  if(e.cls==='b'&&!e.done)extra=`<p class="hpt">${e.P.f==='lattice'?'GROWING':'UNDER CONSTRUCTION'} ${Math.floor(e.prog*100)}%</p><div class="queue"><div class="pb"><i style="width:${e.prog*100}%"></i></div></div>`;
  else if(e.cls==='b'&&e.queue.length&&own)extra=`<div class="queue">${e.queue.map((x,i)=>`<div class="qi" data-i="${i}" style="background-image:url(${U[x.type]?portrait(x.type,me.col):glyph(UP[x.type].kind==='arm'?'arm':UP[x.type].kind==='wpn'?'wpn':UP[x.type].kind,me.f==='lattice'?'#f0b0ff':'#ffd890')})" title="Click to cancel"></div>`).join('')}<div class="pb"><i style="width:${e.queue[0].t/e.queue[0].T*100}%"></i></div></div>`;
  el.innerHTML=`<div class="sone"><div class="por" style="background-image:url(${portrait(e.type,e.P.col)});border-color:${e.P.col}"></div><div class="info"><h3>${d.n}</h3><p class="role">${e.cls==='u'?d.role:'STRUCTURE'} · ${e.P.name}</p><div class="hpb ${hpCls(f)}"><i style="width:${f*100}%"></i></div><p class="hpt">${Math.ceil(e.hp)} / ${e.mhp}</p><div class="stats">${stats}</div>${extra}</div></div>`;
  el.querySelectorAll('.qi').forEach(q=>q.onclick=()=>{S.cancel(me,e,+q.dataset.i);selSig='';});return;}
 const s='m'+list.map(e=>e.id+':'+Math.ceil(e.hp/e.mhp*10)).join(',');if(s===selSig)return;selSig=s;
 el.innerHTML=`<div class="smany">${list.slice(0,48).map((e,i)=>`<div class="u" data-i="${i}" style="background-image:url(${portrait(e.type,e.P.col)})" title="${e.d.n}"><i><b style="width:${e.hp/e.mhp*100}%;background:${e.hp/e.mhp>.6?'#4ad46a':e.hp/e.mhp>.3?'#e8c040':'#e84a3a'}"></b></i></div>`).join('')}${list.length>48?`<div style="align-self:center;font-size:.7rem">+${list.length-48}</div>`:''}</div>`;
 el.querySelectorAll('.u').forEach(d=>d.onclick=ev=>{const e=list[+d.dataset.i];if(ev.shiftKey)setSel(sel.filter(x=>x!==e));else if(ev.ctrlKey)setSel(sel.filter(x=>x.type===e.type));else setSel([e]);});}
function hudUpdate(dt){hudT-=dt;if(hudT>0)return;hudT=.1;
 $('rOre').textContent=Math.floor(me.ore);$('rAe').textContent=Math.floor(me.ae);$('rSup').textContent=me.sup+'/'+me.cap;$('rSup').classList.toggle('bad',me.sup>=me.cap&&me.cap<MAX_SUP);
 $('clock').textContent=fmtT(S.t);$('left').textContent=fmtT(S.len-S.t)+' LEFT';
 $('scorebox').innerHTML=S.teams.map(t=>`<div class="p"><span>TEAM ${t+1}</span><b>${S.teamScore(t)}</b></div>`+S.players.filter(p=>p.team===t).map(p=>`<div class="p ${p.alive?'':'dead'}"><i style="background:${p.col}"></i><b>${p.name}</b><span>${p.F.short}</span></div>`).join('')).join('');
 const idle=S.ents.filter(u=>u.alive&&u.owner===me.i&&u.cls==='u'&&u.d.worker&&!u.q.length).length;$('idle').hidden=!idle;$('idleN').textContent=idle;
 $('groups').innerHTML=groups.map((g,i)=>{const n=g.filter(e=>e.alive).length;return n?`<div data-i="${i}"><b>${i}</b>${n}</div>`:'';}).join('');$('groups').querySelectorAll('div').forEach(d=>d.onclick=()=>selectGroup(+d.dataset.i));
 buildCard();selPanel();snd.music(true,fightLvl);fightLvl=Math.max(0,fightLvl-.05);}
$('idle').onclick=()=>keyDown({code:'F1'});$('menuB').onclick=()=>setPause(true);
/* ---------- overlay: health bars, progress, rally and waypoint lines ---------- */
function overlay(){const W=innerWidth,Hh=innerHeight,dpr=ov.width/W;ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,W,Hh);if(!S||app==='menu'||noHud)return;const k=cl(52/cam.zoom,.7,1.4);const selSet=new Set(sel);
 for(const e of S.ents){if(!e.alive||e.cls==='r'||!shown(e)||(e.cls==='u'&&e.inside))continue;const show=selSet.has(e)||hover===e||e.hp<e.mhp-.5||(e.cls==='b'&&(!e.done||e.queue.length&&e.owner===me.i));if(!show)continue;
  const y=H(e.x,e.z)+(e.cls==='b'?e.d.size*1.5+.6:(e.air?4.6:0)+entH(e)+.5);const[sx,sy,sz]=scr(e.x,y,e.z);if(sz>1||sx<-60||sx>W+60||sy<-20||sy>Hh)continue;
  const w=(e.cls==='b'?e.d.size*16:Math.max(22,e.r*26))*k,h=Math.max(3,(e.cls==='b'?5:4)*k),f=e.hp/e.mhp,x0=sx-w/2;
  ox.fillStyle='rgba(4,6,10,.85)';ox.fillRect(x0-1,sy-1,w+2,h+2);ox.fillStyle=e.team!==pt?(f>.3?'#e8443a':'#ff7a3a'):f>.6?'#4ad46a':f>.3?'#e8c040':'#e84a3a';ox.fillRect(x0,sy,w*f,h);
  if(e.team!==pt){ox.strokeStyle='rgba(255,90,70,.5)';ox.lineWidth=1;ox.strokeRect(x0-1.5,sy-1.5,w+3,h+3);}
  if(w>40){ox.strokeStyle='rgba(0,0,0,.45)';ox.lineWidth=1;const segs=Math.min(12,Math.floor(e.mhp/50));for(let i=1;i<segs;i++){const xx=x0+w*i/segs;ox.beginPath();ox.moveTo(xx,sy);ox.lineTo(xx,sy+h);ox.stroke();}}
  if(e.cls==='b'&&(!e.done||e.queue.length)&&e.team===pt){const p=e.done?e.queue[0].t/e.queue[0].T:e.prog;ox.fillStyle='rgba(4,6,10,.85)';ox.fillRect(x0-1,sy+h+2,w+2,4);ox.fillStyle='#6ab0ff';ox.fillRect(x0,sy+h+3,w*p,2);}
  if(e.cls==='u'&&e.d.nova&&e.team===pt&&e.novaCd>0){ox.fillStyle='#c070ff';ox.fillRect(x0,sy+h+2,w*(1-e.novaCd/e.d.nova.cd),2);}}
 // waypoints and rally lines for the selection
 ox.setLineDash([5,5]);ox.lineWidth=1.5;let nW=0;
 for(const e of sel){if(!e.alive||e.owner!==me.i)continue;if(e.cls==='b'&&e.rally){const a=scr(e.x,H(e.x,e.z)+.5,e.z),b=scr(e.rally.x,H(e.rally.x,e.rally.z)+.2,e.rally.z);ox.strokeStyle='rgba(255,216,74,.8)';ox.beginPath();ox.moveTo(a[0],a[1]);ox.lineTo(b[0],b[1]);ox.stroke();ox.fillStyle='#ffd84a';ox.fillRect(b[0]-1,b[1]-16,2,16);ox.beginPath();ox.moveTo(b[0]+1,b[1]-16);ox.lineTo(b[0]+11,b[1]-12);ox.lineTo(b[0]+1,b[1]-8);ox.fill();}
  if(e.cls==='u'&&e.q.length&&(I.keys.ShiftLeft||I.keys.ShiftRight||e.q.length>1&&sel.length<=12)&&nW++<40){let p=scr(e.x,H(e.x,e.z)+.3,e.z);for(const o of e.q){const t=o.t&&o.t.alive?o.t:null;const x=t?t.x:o.x,z=t?t.z:o.z;if(x==null)continue;const q=scr(x+(o.ox||0),H(x,z)+.3,z+(o.oz||0));ox.strokeStyle=o.k==='attack'||o.k==='amove'?'rgba(255,90,70,.7)':o.k==='gather'?'rgba(255,224,138,.35)':o.k==='build'?'rgba(255,216,74,.7)':'rgba(125,255,154,.6)';
    ox.beginPath();ox.moveTo(p[0],p[1]);ox.lineTo(q[0],q[1]);ox.stroke();ox.fillStyle=ox.strokeStyle;ox.fillRect(q[0]-2,q[1]-2,4,4);p=q;if(o.k==='gather')break;}}}
 ox.setLineDash([]);
 // build ghost reason
 if(mode&&mode.k==='build'){const g=groundAt(mx,my);if(g){const pl=S.canPlace(me,mode.type,g[0],g[1]);const d=B[mode.type];let t=!pl.ok?pl.why:!S.afford(me,d.cost)?(me.ore<d.cost[0]?'Not enough ore':'Not enough aether'):'';ox.font='600 12px JetBrains Mono,monospace';ox.textAlign='center';ox.fillStyle=t?'#ff8a7a':'#9af0b0';ox.fillText(t||d.n+'  ◆'+d.cost[0]+(d.cost[1]?' ●'+d.cost[1]:''),mx,my-22);}}}
/* ---------- minimap ---------- */
const mini=$('mini'),mc=mini.getContext('2d');let miniBg=null,miniT=0;const fogC=document.createElement('canvas');let fogX=null,fogImg=null;
function miniBackground(){const M=S.M,n=220,c=document.createElement('canvas');c.width=c.height=n;const x=c.getContext('2d'),img=x.createImageData(n,n);
 for(let j=0;j<n;j++)for(let i=0;i<n;i++){const wx=(i/n)*M.size-M.half,wz=(j/n)*M.size-M.half;const h=M.height(wx,wz),[f,ft]=M.field(wx,wz),nz=M.noise(wx,wz);let r=96+nz*30,g=102+nz*26,b=64;if(ft<0){r=46;g=74;b=40;}if(h>1){const k=Math.min(1,(h-1)/3);r=r*(1-k)+70*k;g=g*(1-k)+64*k;b=b*(1-k)+58*k;}
  if(M.riverK(wx,wz)>.6&&M.fordK(wz)<.5){r=40;g=96;b=120;}if(Math.max(Math.abs(wx),Math.abs(wz))>M.half-3){r=24;g=30;b=24;}const o=(j*n+i)*4;img.data[o]=r;img.data[o+1]=g;img.data[o+2]=b;img.data[o+3]=255;}
 x.putImageData(img,0,0);return c;}
function minimap(dt){miniT-=dt;if(miniT>0)return;miniT=.12;if(!miniBg)miniBg=miniBackground();const W=mini.width,M=S.M,s=W/M.size,P=(x,z)=>[(x+M.half)*s,(z+M.half)*s];
 mc.drawImage(miniBg,0,0,W,W);const N=S.N;if(!fogImg||fogC.width!==N){fogC.width=fogC.height=N;fogX=fogC.getContext('2d');fogImg=fogX.createImageData(N,N);}
 if(!revealAll){const v=S.vis[pt],ex=S.exp[pt];for(let i=0;i<N*N;i++){fogImg.data[i*4]=4;fogImg.data[i*4+1]=6;fogImg.data[i*4+2]=10;fogImg.data[i*4+3]=v[i]?0:ex[i]?120:235;}fogX.putImageData(fogImg,0,0);mc.imageSmoothingEnabled=true;mc.drawImage(fogC,0,0,W,W);}
 for(const e of S.ents){if(!e.alive)continue;if(e.cls==='r'){if(!revealAll&&!S.exp[pt][S.cell(e.x,e.z)])continue;const[x,z]=P(e.x,e.z);mc.fillStyle=e.rk==='ore'?'#ffd060':'#46f0c0';mc.fillRect(x-2,z-2,e.rk==='ore'?4:6,e.rk==='ore'?4:6);continue;}
  if(!shown(e))continue;if(e.cls==='u'&&e.inside)continue;const[x,z]=P(e.x,e.z);mc.fillStyle=e.P.col;
  if(e.cls==='b'){const r=e.d.size*CS*s/2+1;mc.fillRect(x-r,z-r,r*2,r*2);mc.strokeStyle=sel.includes(e)?'#fff':'rgba(0,0,0,.8)';mc.lineWidth=1.5;mc.strokeRect(x-r,z-r,r*2,r*2);}
  else{const r=e.d.sup>=3?4:3;mc.fillRect(x-r/2-.5,z-r/2-.5,r+1,r+1);if(sel.includes(e)){mc.strokeStyle='#fff';mc.lineWidth=1;mc.strokeRect(x-r/2-1.5,z-r/2-1.5,r+3,r+3);}}}
 for(let i=pings.length-1;i>=0;i--){const p=pings[i];p.t+=.12;if(p.t>3){pings.splice(i,1);continue;}const[x,z]=P(p.x,p.z);mc.strokeStyle=`rgba(255,70,50,${1-p.t/3})`;mc.lineWidth=3;mc.beginPath();mc.arc(x,z,6+(p.t%1)*24,0,7);mc.stroke();}
 const pts=[[0,0],[innerWidth,0],[innerWidth,innerHeight],[0,innerHeight]].map(([a,b])=>groundAt(a,b)).filter(Boolean);if(pts.length===4){mc.strokeStyle='rgba(255,255,255,.85)';mc.lineWidth=2;mc.beginPath();pts.forEach(([x,z],i)=>{const[px,pz]=P(cl(x,-M.half,M.half),cl(z,-M.half,M.half));i?mc.lineTo(px,pz):mc.moveTo(px,pz);});mc.closePath();mc.stroke();}}
{let drag=false;const mm=e=>{const r=mini.getBoundingClientRect();return[(e.clientX-r.left)/r.width*S.M.size-S.half,(e.clientY-r.top)/r.height*S.M.size-S.half];};
 mini.addEventListener('mousedown',e=>{if(app!=='play'||!S)return;e.stopPropagation();e.preventDefault();const[x,z]=mm(e);
  if(e.button===2){const us=mineU();if(us.length){S.cmd(me,us,{k:mode&&mode.k==='amove'?'amove':'move',x,z},e.shiftKey);snd.play('order');}else if(mineB().length)S.rally(me,mineB(),x,z);return;}
  if(mode&&mode.k!=='build'&&e.button===0){const us=mineU();S.cmd(me,us,{k:mode.k==='nova'?'move':mode.k,x,z},e.shiftKey);snd.play(mode.k==='amove'?'attackorder':'order');if(!e.shiftKey)setMode(null);return;}
  drag=true;cam.tx=x;cam.tz=z+6;});
 addEventListener('mousemove',e=>{if(drag&&S){const[x,z]=mm(e);cam.tx=x;cam.tz=z+6;}});addEventListener('mouseup',()=>drag=false);mini.addEventListener('contextmenu',e=>e.preventDefault());}
/* ================= menu ================= */
const seg=pickers(opt,save);
seg('o-map','map',true,()=>mapDesc());seg('o-diff','diff');seg('o-min','min');seg('o-spd','spd');
function mapDesc(){const m=MAP_LIST[opt.map];$('mapd').textContent=m.name+' · '+m.mode+' — '+m.desc+(m.players>2?' You and a CPU ally hold the west.':'');}
function buildMenu(){const el=$('facs');el.innerHTML='';const mk=(id)=>{const F=FACTIONS[id];const d=document.createElement('div');d.className='fac'+(opt.fac===id?' on':'');const units=Object.keys(U).filter(k=>U[k].f===id);
  d.innerHTML=`<img src="${portrait(F.hq,id==='compact'?'#3f8cff':'#b46cff')}" alt=""><div><h3>${F.name}</h3><p>${F.blurb}</p><div class="roster">${units.map(u=>`<img src="${portrait(u,id==='compact'?'#3f8cff':'#b46cff')}" title="${U[u].n}" alt="">`).join('')}</div></div>`;d.onclick=()=>{opt.fac=id;save();snd.init();snd.play('click');buildMenu();};el.appendChild(d);};
 mk('compact');mk('lattice');const r=document.createElement('div');r.className='fac rnd'+(opt.fac==='random'?' on':'');r.innerHTML='<b>?</b><p>RANDOM</p>';r.onclick=()=>{opt.fac='random';save();buildMenu();};el.appendChild(r);
 mapDesc();$('best').textContent=bestScore(ID)?'BEST '+bestScore(ID):'';}
$('howb').onclick=()=>{$('keys').hidden=!$('keys').hidden;};$('keys').onclick=()=>{$('keys').hidden=true;};
$('go').onclick=()=>{snd.init();start();};$('again').onclick=()=>start();$('omenu').onclick=()=>toMenu();$('resume').onclick=()=>setPause(false);$('quit').onclick=()=>{setPause(false);toMenu();};
$('surr').onclick=()=>{setPause(false);if(S&&!S.over){S.over={win:S.teams.find(t=>t!==pt),why:'surrender',t:S.t};finish();}};
postButton($('post'),ID,()=>{const a=lastAward||{pts:0};return[a.pts,`Shardwar: ${a.res} as ${a.fac} on ${a.map} (${a.diff}), grade ${a.grade}, ${a.built} units built, ${a.killed} kills, ${a.res2} resources, ${a.apm} APM, ${a.time}.`];});
function setPause(p){if(app!=='play')return;paused=p;$('pause').hidden=!p;}
const CPU_NAMES=['VANCE','ORSO','KESTREL','MAGRA','TALLIS','IVO','SERENE','DRAX','HOLLOW','QUILL'];
function toMenu(){app='menu';$('over').hidden=true;$('hud').hidden=true;$('menu').hidden=false;$('pause').hidden=true;document.body.classList.remove('playing');snd.music(false);setMode(null);sel=[];demo();buildMenu();}
// a CPU-vs-CPU skirmish plays behind the menu
function demo(){S=new Sim({map:0,minutes:30,players:[{name:'A',team:0,faction:'compact',ai:1,diff:1,color:PCOL[0],start:0},{name:'B',team:1,faction:'lattice',ai:1,diff:1,color:PCOL[4],start:1}]});
 me=S.players[0];pt=0;brains=S.players.map(p=>new Brain(S,p,1));setupWorld(S);revealAll=true;fogUpdate(S.vis[0],S.exp[0],1,true);
 // fast-forward so the menu shows a living base
 for(let i=0;i<30*(FAST?20:150);i++){for(const b of brains)b.update(1/30);S.step(1/30);S.ev.length=0;}}
/* ================= match ================= */
function start(o={}){const fac=opt.fac==='random'?pick(['compact','lattice']):opt.fac;const m=o.map??opt.map,diff=o.diff??opt.diff;spd=o.spd??opt.spd;
 const other=f=>f==='compact'?'lattice':'compact';const names=[...CPU_NAMES].sort(()=>Math.random()-.5);
 const pl=m===0?[{name:'YOU',team:0,faction:o.fac||fac,start:0,color:PCOL[0]},{name:'CPU '+names[0],team:1,faction:o.enemy||other(o.fac||fac),ai:1,diff,start:1,color:PCOL[1]}]
  :[{name:'YOU',team:0,faction:o.fac||fac,start:0,color:PCOL[0]},{name:'ALLY '+names[0],team:0,faction:pick(['compact','lattice']),ai:1,diff:1,start:1,color:PCOL[2]},{name:'CPU '+names[1],team:1,faction:pick(['compact','lattice']),ai:1,diff,start:2,color:PCOL[1]},{name:'CPU '+names[2],team:1,faction:pick(['compact','lattice']),ai:1,diff,start:3,color:PCOL[3]}];
 if(o.autopilot)pl[0].ai=1,pl[0].diff=o.autoDiff??1;
 S=new Sim({map:m,minutes:o.minutes||opt.min,players:pl});me=S.players[0];pt=me.team;brains=S.players.filter(p=>p.ai).map(p=>new Brain(S,p,p.diff));
 app='play';paused=false;revealAll=false;sel=[];groups=groups.map(()=>[]);setMode(null);lastAlert=null;miniBg=null;cardSig=selSig='';pings.length=0;lastAward=null;
 setupWorld(S);fogUpdate(S.vis[pt],S.exp[pt],1,true);const hq=me.hq0;cam.x=cam.tx=hq.x-S.M.mains[me.start].back[0]*6;cam.z=cam.tz=hq.z-S.M.mains[me.start].back[1]*6+8;cam.zoom=52;
 $('menu').hidden=true;$('over').hidden=true;$('keys').hidden=true;$('hud').hidden=false;$('pause').hidden=true;document.body.classList.add('playing');
 snd.music(true,0);snd.play('horn');banner(S.M.name,`${S.M.mode} · ${me.F.name} · ${DIFF[diff].n} · ${fmtT(S.len)} · destroy every enemy building`,'',4.5);
 msg('Workers are mining. Train more from your '+B[me.F.hq].n+' (Q) and build a '+B[me.F.supply].n+' before supply runs out.','info',9000);setSel([hq],false);}
/* ================= results ================= */
function gradeOf(won,my,their,lost,killed,diff){let g=(won===1?58:won===0?34:18)+cl(my/Math.max(1,their),0,2)*14+cl(killed/Math.max(1,lost),0,3)*4+(diff-1)*8;return g>=92?'S':g>=78?'A':g>=64?'B':g>=48?'C':'D';}
function finish(){if(app!=='play')return;app='over';setMode(null);const o=S.over,won=o.win===pt?1:o.win===-1?0:-1;const mins=Math.max(1,S.t/60);
 const myT=S.teamScore(pt),enT=Math.max(...S.teams.filter(t=>t!==pt).map(t=>S.teamScore(t)));const st=me.st;const diff=brains.find(b=>b.p.team!==pt)?.diff??1;
 const grade=gradeOf(won,myT,enT,st.lost,st.killed,diff);const pts=Math.max(0,Math.round(S.score(me)*[.7,1,1.4][diff]+(won===1?2000*(1+diff*.5):0)+({S:1200,A:800,B:400,C:150,D:0})[grade]));
 const tok=5+(won===1?12:0)+Math.min(25,pts/600|0);addRound(tok,won===1);saveBest(ID,pts);
 lastAward={pts,res:won===1?'VICTORY':won===0?'DRAW':'DEFEAT',fac:me.F.name,map:S.M.name,diff:DIFF[diff].n,grade,built:st.built,killed:st.killed,res2:Math.round(st.ore+st.ae),apm:Math.round(st.acts/mins),time:fmtT(S.t),tok,won};
 setTimeout(()=>{if(app!=='over')return;snd.play(won===1?'win':'lose');
  $('ores').textContent=lastAward.res;$('ores').className=won===1?'w':won===0?'d':'l';$('oeye').textContent=`MATCH COMPLETE · ${fmtT(S.t)} · ${S.M.name} · ${DIFF[diff].n}`;
  $('owhy').textContent=o.why==='destroy'?(won===1?'EVERY ENEMY STRUCTURE DESTROYED':'YOUR TEAM HAS NO STRUCTURES LEFT'):o.why==='surrender'?'YOU SURRENDERED':`TIME LIMIT · SCORE ${myT} – ${enT}`;$('ograde').textContent=grade;
  const row=p=>{const s=p.st,apm=Math.round(s.acts/mins);return`<tr class="${p===me?'me':''} ${o.win===p.team?'tw':o.win===-1?'':'tl'}"><td><i style="background:${p.col}"></i>${p.name}</td><td>${p.F.short}</td><td>${s.built}</td><td>${s.lost}</td><td>${s.killed}</td><td>${s.bBuilt}</td><td>${s.bLost}</td><td>${s.bKilled}</td><td>${Math.round(s.ore)}</td><td>${Math.round(s.ae)}</td><td>${s.armyMax}</td><td>${apm}</td><td><b>${S.score(p)}</b></td></tr>`;};
  $('otable').innerHTML=`<table><tr><th>COMMANDER</th><th>FACTION</th><th>UNITS BUILT</th><th>LOST</th><th>KILLED</th><th>STRUCT. BUILT</th><th>LOST</th><th>RAZED</th><th>ORE</th><th>AETHER</th><th>PEAK ARMY</th><th>APM</th><th>SCORE</th></tr>${S.teams.map(t=>S.players.filter(p=>p.team===t).map(row).join('')).join('')}</table>`;
  $('otok').innerHTML=`POINTS <b>${pts}</b> · GRADE <b>${grade}</b> · +${tok} TOKENS · BEST ${bestScore(ID)}`;$('over').hidden=false;$('hud').hidden=true;document.body.classList.remove('playing');},FAST?0:2500);}
/* ================= loop ================= */
function resize(){const w=innerWidth,h=innerHeight;R.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();const dpr=Math.min(devicePixelRatio,2);ov.width=w*dpr;ov.height=h*dpr;
 parts.U.uScale.value=smoke.U.uScale.value=h*R.getPixelRatio()/(2*Math.tan(camera.fov*Math.PI/360));if(fxStack)fxStack.setSize(w,h);}
addEventListener('resize',resize);
function simStep(dt){let left=dt;while(left>1e-4){const h=Math.min(left,1/30);for(const b of brains)b.update(h);S.step(h);if(app==='play')processEvents();else S.ev.length=0;left-=h;if(S.over)break;}}
function step(dt){dt=Math.min(dt,.1);menuT+=dt;
 if(app==='play'&&S){if(!paused){simStep(dt*spd);if(S.over)finish();}const g=groundAt(mx,my);hover=mIn&&!down?pickAt(mx,my):null;document.body.classList.toggle('foe',!!(hover&&hover.team!==pt&&hover.cls!=='r'&&mineU().length));I.flush();}
 else if(app==='menu'&&S){simStep(dt);}else I.flush();
 cameraUpdate(dt);ghostUpdate();
 if(S){fogU.uFogOn.value=revealAll||app==='menu'?0:1;fogUpdate(S.vis[pt],S.exp[pt],dt);}
 if(!paused&&S){parts.update(dt);smoke.update(dt);decals.update(dt,menuT);shocks.update(dt);strips.update(dt,camera);for(const L of flashL)if(L.t>0){L.t-=dt;L.l.intensity*=Math.exp(-dt*10);if(L.t<=0)L.l.intensity=0;}
  if(world&&world.water)world.water.uT.value=menuT;updateViews(dt,menuT);updateProjs(dt,menuT);}
 if(bannerT>0){bannerT-=dt;if(bannerT<=0)$('banner').classList.remove('on');}
 if(app==='play'&&S){hudUpdate(dt);minimap(dt);}}
function noAO(st){if(!st.ao||st.ao._vfx)return;const ao=st.ao,orig=ao.render.bind(ao);ao._vfx=1;ao.render=(...a)=>{const hid=[];scene.traverse(o=>{const m=o.material;if(o.visible&&m&&!Array.isArray(m)&&m.transparent&&m.depthWrite===false){o.visible=false;hid.push(o);}});orig(...a);for(const o of hid)o.visible=true;};}
function render(){if(!fxStack){fxStack=cinematic(R,scene,camera,{...POST,quality:gfx});fxStack.setSize(innerWidth,innerHeight);noAO(fxStack);}fxStack.render();overlay();}
let last=performance.now();
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;step(dt);render();requestAnimationFrame(frame);}
/* ================= boot ================= */
applyQuality(gfx);bindQualityKey(()=>gfx,q=>applyQuality(q));resize();
if(navigator.webdriver)FAST=true;
demo();buildMenu();requestAnimationFrame(frame);
/* ================= test hook ================= */
window.RTS={
 start(o={}){FAST=o.fast!==false;start(o);return this.state;},
 step(dt=1/60,n=1){for(let i=0;i<n;i++)step(dt);},
 // simulation only (no views/effects) for long scripted matches
 simulate(secs,dt=1/15){const n=Math.round(secs/dt);for(let i=0;i<n&&app==='play';i++){simStep(dt);if(S.over){finish();break;}}parts.clear();smoke.clear();decals.clear();$('msgs').innerHTML='';step(1/60);},
 render(){render();},
 get state(){return S?{app,t:S.t,len:S.len,over:S.over,map:S.M.id,score:S.teams.map(t=>S.teamScore(t)),players:S.players.map(p=>({name:p.name,f:p.f,team:p.team,alive:p.alive,bank:[Math.round(p.ore),Math.round(p.ae)],sup:p.sup,cap:p.cap,...p.st,score:S.score(p)}))}:{app};},
 get score(){return lastAward?lastAward.pts:0;},get result(){return lastAward;},
 get player(){return me;},get players(){return S?S.players:[];},get bots(){return brains;},get sim(){return S;},
 units(owner){return S?S.ents.filter(e=>e.alive&&e.cls==='u'&&(owner==null||e.owner===owner)):[];},blds(owner){return S?S.ents.filter(e=>e.alive&&e.cls==='b'&&(owner==null||e.owner===owner)):[];},
 select(list){setSel(list);},get selection(){return sel;},order(o,shift){S.cmd(me,mineU(),o,shift);},build(type,x,z){return S.build(me,mineU(),type,x,z);},train(type){const b=mineB().find(b=>b.d.trains&&b.d.trains.includes(type))||S.ents.find(b=>b.alive&&b.owner===me.i&&b.cls==='b'&&b.d.trains&&b.d.trains.includes(type));return b?S.train(me,b,type):false;},
 key(code,mods={}){keyDown({code,...mods});},mouse(x,y){mx=x;my=y;mIn=true;},smart(shift){smart(shift);},boxSelect(x0,y0,x1,y1){mx=x1;my=y1;boxSelect({x:x0,y:y0},false);},clickSelect(x,y){mx=x;my=y;clickSelect(false,false);},
 set reveal(v){revealAll=!!v;},get reveal(){return revealAll;},cam(x,z,zoom){cam.x=cam.tx=x;cam.z=cam.tz=z;if(zoom)cam.zoom=zoom;},
 setQuality:applyQuality,get quality(){return gfx;},toMenu,hud(v){noHud=!v;$('hud').hidden=!v;if(!v){bannerT=0;$('banner').classList.remove('on');}},get card(){return card;},get mode(){return mode;},scr,groundAt,
 finish(){if(S&&!S.over){S.t=S.len;S.chkT=0;S.step(1/30);finish();}}};
