// NEON BAY — vehicles: specs, extruded-profile models, arcade physics, crash deformation, smoke, AI drive helper.
import {THREE,M,merge,cl,wrapA,lerp} from './util.js';
import {WL} from './world.js';
import {DEFS,buildCar,buildBuggy,wheelGeo} from './carmodel.js';
const V=THREE.Vector3;

export const SPECS={
 pip:{name:'PIP',cls:'COMPACT',price:0,max:42,acc:13,brake:28,grip:8.6,drift:1.3,steer:2.55,mass:.85,hp:90,paint:0x4fc3e8,blurb:'Tiny, nimble, forgiving. Your first set of wheels.'},
 cabby:{name:'CABBY',cls:'TAXI',price:null,max:46,acc:15,brake:30,grip:8.2,drift:1.4,steer:2.35,mass:1,hp:115,paint:0xffc61a,blurb:'Company car. Do not scratch the paint.'},
 hauler:{name:'HAULER',cls:'PICKUP',price:1800,max:43,acc:14,brake:28,grip:7.4,drift:1.6,steer:2.15,mass:1.45,hp:170,paint:0x2f7d5a,blurb:'Built like a fridge. Shrugs off crashes, bullies traffic.'},
 bruiser:{name:'BRUISER',cls:'MUSCLE',price:3500,max:57,acc:20,brake:30,grip:6.9,drift:1.95,steer:2.25,mass:1.2,hp:135,paint:0xc4201a,blurb:'Big V8, loose tail. Born to slide.'},
 skipjack:{name:'SKIPJACK',cls:'MOTORBIKE',price:2400,max:60,acc:25,brake:34,grip:9.2,drift:1.1,steer:3.0,mass:.45,hp:70,paint:0xff7a1a,bike:1,blurb:'Threads gaps in traffic. Crash hard and you fly.'},
 zephyr:{name:'ZEPHYR R',cls:'SPORTS',price:8000,max:69,acc:26,brake:38,grip:9.6,drift:1.45,steer:2.5,mass:.95,hp:110,paint:0xeeeef2,blurb:'Supercar. Scary fast, glued to the road.'},
 marlin:{name:'MARLIN',cls:'LUXURY',price:5200,max:58,acc:18,brake:33,grip:8.4,drift:1.3,steer:2.2,mass:1.35,hp:160,paint:0x1d2a3a,blurb:'Long, heavy, whisper quiet. Floats over bumps, shrugs off taps.'},
 dune:{name:'DUNE RAT',cls:'BUGGY',price:3000,max:50,acc:22,brake:30,grip:8.8,drift:1.35,steer:2.7,mass:.8,hp:95,paint:0xf2b01e,offroad:1,blurb:'Long-travel buggy. Loves sand, dirt and big air. Twitchy on tarmac.'},
 vault:{name:'BRINKLINE',cls:'ARMORED',price:null,max:36,acc:9,brake:24,grip:7.0,drift:1.6,steer:1.9,mass:2.6,hp:520,paint:0x3c4a40},
 police:{name:'INTERCEPTOR',cls:'POLICE',price:null,max:63,acc:23,brake:36,grip:9.2,drift:1.4,steer:2.45,mass:1.35,hp:220,paint:0x15171c},
 parcel:{name:'PARCEL VAN',cls:'VAN',price:null,max:38,acc:11,brake:26,grip:7.1,drift:1.5,steer:2.05,mass:1.6,hp:180,paint:0xf2f2f2}};
export const SHOP=['pip','hauler','skipjack','dune','bruiser','marlin','zephyr'];
export const PAINTS=[0xe8e8ec,0x15171c,0xc4201a,0xff7a1a,0xffc61a,0x7ed957,0x2f7d5a,0x4fc3e8,0x2a5bd7,0x8a3ffc,0xff4fa3,0x9aa3ad];
const TRAFFIC_PAINT=[0xe8e8ec,0x15171c,0x9aa3ad,0x2a5bd7,0xc4201a,0x2f7d5a,0x6a4a3a,0xd8c8a8,0x4fc3e8,0xff7a1a,0x3a3f4a,0x7a1428,0xf2d36b];
export const trafficPaint=r=>TRAFFIC_PAINT[r*TRAFFIC_PAINT.length|0];

/* ================= models ================= */
const DARK=new THREE.Color(0x17181b),GLASS=new THREE.Color(0x101823),CHROME=new THREE.Color(0xc8ccd4),BLACK=new THREE.Color(0x0a0a0a),WHITE=new THREE.Color(0xf4f4f4),GREY=new THREE.Color(0x3a3c40);
// physical shape of each body (dimensions shared with the lofted models in carmodel.js)
const SH={skipjack:{L:2.1,W:.72,wf:.74,wr:-.72,r:.33,bike:1},dune:{L:3.7,W:1.95,wf:1.38,wr:-1.3,r:.45,cab:[[-.9,.9],[-.6,1.6],[.2,1.6],[.6,.9]],open:1}};
for(const id in DEFS){const d=DEFS[id],[zA,zB,zC,zD,ry]=d.cab;const bl=z=>{const K=d.belt;if(z<=K[0][0])return K[0][1];for(let i=1;i<K.length;i++)if(z<=K[i][0]){const a=K[i-1],c=K[i];return a[1]+(c[1]-a[1])*(z-a[0])/(c[0]-a[0]);}return K[K.length-1][1];};
 SH[id]={L:d.L,W:d.W,wf:d.wf,wr:d.wr,r:d.r,cab:[[zD,bl(zD)],[zC,ry],[zB,ry],[zA,bl(zA)]]};}
let DETAIL=2;export function setCarDetail(q){DETAIL=q>0?2:0;}
function extrude(prof,w){const s=new THREE.Shape();prof.forEach(([z,y],i)=>i?s.lineTo(z,y):s.moveTo(z,y));const g=new THREE.ExtrudeGeometry(s,{depth:w,bevelEnabled:true,bevelThickness:.05,bevelSize:.05,bevelSegments:2,curveSegments:4});
 g.rotateY(-Math.PI/2);g.translate(w/2,0,0);return g;}
function taper(g,y0,k){const p=g.attributes.position;for(let i=0;i<p.count;i++){const y=p.getY(i);if(y>y0)p.setX(i,p.getX(i)*(1-(y-y0)*k));}g.computeVertexNormals();return g;}
const B=(w,h,d,x,y,z,rx=0,ry=0,rz=0)=>{const g=new THREE.BoxGeometry(w,h,d);g.applyMatrix4(M(x,y,z,rx,ry,rz));return g;};
const modelCache={};
export function buildModel(id){const key=id+'_'+DETAIL;if(modelCache[key])return modelCache[key];const s=SH[id];const body=[],glow=[];let glass=null;const P=1;// [geo,color,paint]
 const b=(g,c,paint=0)=>body.push([g,c,paint]),gl=(g,c,k)=>glow.push([g,c,k]);
 if(s.bike){// motorbike
  b(B(.18,.3,1.1,0,.55,0,.25),DARK);b(B(.34,.32,.62,0,.72,.12),GREY);b(B(.42,.26,.6,0,1.0,.2,-.12),null,P);b(B(.34,.12,.7,0,.98,-.38,.08),BLACK);b(B(.5,.42,.32,0,1.12,.72,-.5),null,P);
  b(B(.06,.7,.06,-.14,.72,.78,-.35),CHROME);b(B(.06,.7,.06,.14,.72,.78,-.35),CHROME);b(B(.7,.05,.05,0,1.18,.66),DARK);b(B(.1,.1,.75,.2,.48,-.45,.1),CHROME);b(B(.26,.12,.5,0,.84,-.72,-.2),null,P);
  gl(B(.22,.14,.06,0,1.08,.9,-.5),WHITE,0);gl(B(.2,.08,.05,0,.9,-.98),new THREE.Color(1,.08,.08),1);}
 else{const m=id==='dune'?buildBuggy(DETAIL):buildCar(id,DETAIL);for(const e of m.body)body.push(e);for(const e of m.glow)glow.push(e);glass=m.glass;}
 // LOW: no drivers to see, so the greenhouse goes opaque into the body (one draw call fewer per car)
 if(DETAIL===0&&glass){body.push([glass,new THREE.Color(.025,.03,.04),0]);glass=null;}
 // build merged body: vertex colour + paint mask
 const bg=merge(body.map(([g,c,p])=>[g,null,c||new THREE.Color(1,1,1),p?1:0]),{k:true});bg.setAttribute('aP',bg.getAttribute('aK'));bg.deleteAttribute('aK');
 const gg=merge(glow.map(([g,c,k])=>[g,null,c,k]),{k:true});
 return modelCache[key]={body:bg,glow:gg,glass,s};}
// shared tinted glass and a seated driver (torso + head), drawn when someone is at the wheel
let glassMat=null;const DRV={torso:new THREE.BoxGeometry(.42,.5,.3),head:new THREE.SphereGeometry(.13,12,8),skin:[0xf1c9a5,0xd9a27a,0xa86f4c,0x6e4630].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.7})),shirt:[0x2a3b5c,0x8a1c2b,0x2f6b3a,0xd8d8d8,0x222226,0xc77b1a].map(c=>new THREE.MeshStandardMaterial({color:c,roughness:.85})),cop:new THREE.MeshStandardMaterial({color:0x1b2a4a,roughness:.8})};
function getGlassMat(){return glassMat||(glassMat=new THREE.MeshPhysicalMaterial({color:0x070b10,roughness:.03,metalness:.15,transparent:true,opacity:.8,envMapIntensity:1.8,depthWrite:false,clearcoat:1,clearcoatRoughness:.02,side:THREE.DoubleSide}));}
function makeDriver(v){const s=v.shape,g=new THREE.Group(),r=(v.uid*2654435761>>>0);const tz=(s.cab[1][0]+s.cab[2][0])/2+.1,y0=s.cab[0][1];
 g.add(new THREE.Mesh(DRV.torso,v.id==='police'?DRV.cop:DRV.shirt[r%DRV.shirt.length]));g.children[0].position.set(0,y0-.08,tz-.05);
 g.add(new THREE.Mesh(DRV.head,DRV.skin[(r>>>4)%DRV.skin.length]));g.children[1].position.set(0,y0+.3,tz);g.position.x=s.W*.22;g.visible=false;return g;}

/* ---------- materials ---------- */
export function paintMat(color){const m=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.36,metalness:.45,clearcoat:1,clearcoatRoughness:.035,envMapIntensity:1.15});m.userData.paint={value:new THREE.Color(color)};m.userData.dirt={value:0};
 m.onBeforeCompile=sh=>{sh.uniforms.uPaint=m.userData.paint;sh.uniforms.uDirt=m.userData.dirt;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aP;varying float vP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvP=aP;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uPaint;uniform float uDirt;varying float vP;').replace('#include <color_fragment>','#include <color_fragment>\ndiffuseColor.rgb=mix(diffuseColor.rgb,uPaint*(1.-uDirt*.45),vP);')
  .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.5,roughnessFactor+uDirt*.5,vP);')
  .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(.25,metalnessFactor*(1.-uDirt*.6),vP);');};m.customProgramCacheKey=()=>'paint2';return m;}
export function glowMatV(U){const m=new THREE.MeshBasicMaterial({vertexColors:true});m.userData.g={value:new THREE.Vector4(.6,.4,0,1)};
 m.onBeforeCompile=sh=>{sh.uniforms.uG=m.userData.g;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aK;varying float vK;').replace('#include <begin_vertex>','#include <begin_vertex>\nvK=aK;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec4 uG;varying float vK;').replace('#include <color_fragment>',`#include <color_fragment>
  float I=1.;if(vK<.5)I=uG.x;else if(vK<1.5)I=uG.y;else if(vK<2.5)I=uG.z>0.?.3+3.5*step(.5,fract(uG.z*2.2)):.25;else if(vK<3.5)I=uG.z>0.?.3+3.5*step(.5,fract(uG.z*2.2+.5)):.25;else I=uG.w;diffuseColor.rgb*=I;`);};m.customProgramCacheKey=()=>'vglow';return m;}

/* ---------- instanced wheels for every vehicle ---------- */
export class Wheels{constructor(scene,n=420){const g=wheelGeo(DETAIL);const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0});
  mat.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aM;varying float vM;').replace('#include <begin_vertex>','#include <begin_vertex>\nvM=aM;');
   sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vM;').replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=mix(.88,.28,vM);').replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=mix(0.,.9,vM);');};mat.customProgramCacheKey=()=>'wheel';
  this.mesh=new THREE.InstancedMesh(g,mat,n);this.mesh.frustumCulled=false;this.mesh.castShadow=true;this.mesh.count=0;scene.add(this.mesh);this.n=0;this.m=new THREE.Matrix4();this.q=new THREE.Quaternion();this.e=new THREE.Euler();}
 begin(){this.n=0;}
 add(pos,q,steer,spin,r,w){if(this.n>=this.mesh.instanceMatrix.count)return;this.e.set(spin,steer,0,'YXZ');this.q.setFromEuler(this.e);this.q.premultiply(q);this.m.compose(pos,this.q,_s.set(w,r,r));this.mesh.setMatrixAt(this.n++,this.m);}
 end(){this.mesh.count=this.n;this.mesh.instanceMatrix.needsUpdate=true;}}
const _s=new V();

/* ================= vehicle ================= */
let VID=0;
export class Vehicle{
 constructor(id,o={}){this.uid=++VID;this.id=id;this.spec=SPECS[id];this.shape=SH[id];this.bike=!!this.spec.bike;this.paint=o.paint??this.spec.paint;
  this.x=0;this.y=0;this.z=0;this.a=0;this.vx=0;this.vz=0;this.vy=0;this.w=0;this.onG=true;this.air=0;this.climb=0;this.pitch=0;this.roll=0;this.vpitch=0;this.vroll=0;this.susp=0;this.suspV=0;this.steerVis=0;this.spin=0;this.lean=0;
  this.dmg=0;this.wrecked=false;this.water=0;this.ctrl={thr:0,steer:0,hb:false};this.mode=o.mode||'parked';this.driver=o.driver||null;this.siren=false;this.sirenT=0;this.brakeT=0;this.slip=0;this.lastHit=0;this.deck=null;this.surf='road';this.events=[];this.age=0;this.owned=!!o.owned;
  this.len=this.shape.L;this.wid=this.shape.W;this.r=this.bike?.42:this.wid/2;this.mass=this.spec.mass;this.hp=this.spec.hp;this.airStart=null;this.maxAirY=0;this.stunt=null;}
 attach(scene,U){const md=buildModel(this.id);this.group=new THREE.Group();this.mat=paintMat(this.paint);this.body=new THREE.Mesh(md.body,this.mat);this.body.castShadow=true;this.body.receiveShadow=true;this.gmat=glowMatV(U);this.glow=new THREE.Mesh(md.glow,this.gmat);
  this.bodyPivot=new THREE.Group();this.bodyPivot.add(this.body,this.glow);if(md.glass){this.glassMesh=new THREE.Mesh(md.glass,getGlassMat());this.glassMesh.renderOrder=2;this.bodyPivot.add(this.glassMesh);if(DETAIL>0){this.drv=makeDriver(this);this.bodyPivot.add(this.drv);}}this.group.add(this.bodyPivot);scene.add(this.group);this.scene=scene;this.shared=true;return this;}
 detach(){if(!this.group)return;this.scene.remove(this.group);if(!this.shared)this.body.geometry.dispose();this.mat.dispose();this.gmat.dispose();this.group=null;}
 setPaint(c){this.paint=c;if(this.mat)this.mat.userData.paint.value.set(c);}
 get speed(){return Math.hypot(this.vx,this.vz);}
 get vf(){return this.vx*Math.sin(this.a)+this.vz*Math.cos(this.a);}
 place(x,z,a,W,y){this.x=x;this.z=z;this.a=a;this.vx=this.vz=this.vy=this.w=0;this.y=W?W.groundAt(x,z,y??(W.terrainH(x,z)+1.5)):0;this.onG=true;this.air=0;this.climb=0;}
 fwd(o=new V()){return o.set(Math.sin(this.a),0,Math.cos(this.a));}
 // fixed-step arcade physics
 step(dt,W,o={}){const S=this.spec,c=this.ctrl;this.age+=dt;let sa=Math.sin(this.a),ca=Math.cos(this.a);let vf=this.vx*sa+this.vz*ca,vr=-this.vx*ca+this.vz*sa;
  const dead=this.wrecked||this.water>0;const dmgK=1-Math.min(.42,this.dmg/(this.hp*2.4));let surfG={road:1,walk:.95,grass:.78,dirt:.84,sand:.64,water:.3}[this.surf]??1;if(S.offroad)surfG=this.surf==='water'?.3:this.surf==='road'||this.surf==='walk'?.9:1.04;const wet=o.wet||0;
  let thr=dead?0:c.thr;const hb=!dead&&c.hb;this.braking=false;
  if(this.onG){const top=S.max*dmgK*(o.topK||1)*(this.flat?.74:1);
   if(thr>0){if(vf<-.6){vf+=S.brake*thr*dt;this.braking=true;}else vf+=S.acc*thr*dmgK*(1-cl(vf/top,0,1)**2.2)*dt;}
   else if(thr<0){if(vf>.6){vf=Math.max(0,vf+S.brake*thr*dt);this.braking=true;}else{vf+=thr*S.acc*.55*dt;vf=Math.max(vf,-top*.32);}}
   const roll=(1.1+.0028*vf*vf+(surfG<.9?2.2:0))*dt;vf-=Math.sign(vf)*Math.min(Math.abs(vf),thr===0?roll*1.6:roll*.4);
   if(hb){vf-=Math.sign(vf)*Math.min(Math.abs(vf),5.5*dt);this.braking=true;}
   if(vf>top)vf-=(vf-top)*Math.min(1,dt*2);
   const sliding=Math.abs(vr)>3.2;const grip=S.grip*surfG*(1-wet*.18)*(hb?.24:1)*(sliding?1/S.drift:1)*(this.flat?.55:1);vr*=Math.exp(-grip*dt);if(this.flat&&Math.abs(vf)>6)this.w+=Math.sin(this.age*9.3)*.9*dt;
   this.slip=Math.min(1,Math.abs(vr)/9+(hb&&Math.abs(vf)>8?.4:0)+(thr>0&&vf<6&&thr>.9&&S.acc>17?.25:0));
   const sp=Math.abs(vf);const k=Math.min(1,sp/5.5)/(1+sp/(this.bike?52:42));const wt=c.steer*S.steer*k*Math.sign(vf||1)*(hb?1.45:1)*(dead?.3:1);this.w+=(wt-this.w)*Math.min(1,dt*(this.bike?8:10));
   // gravity along the slope
   if(this.gslope)vf-=this.gslope*14*dt;}
  else{this.vy-=(o.grav||20)*dt;this.w*=Math.exp(-dt*.6);this.w+=c.steer*.9*dt;this.slip=0;}
  this.a=wrapA(this.a+this.w*dt);sa=Math.sin(this.a);ca=Math.cos(this.a);this.vx=sa*vf-ca*vr;this.vz=ca*vf+sa*vr;
  const ox=this.x,oz=this.z;this.x+=this.vx*dt;this.z+=this.vz*dt;
  // ground
  const g=W.groundAt(this.x,this.z,this.y);this.deck=W.gDeck;
  if(this.onG){if(g<this.y-.55){this.onG=false;this.vy=this.climb;this.airStart={x:this.x,z:this.z,y:this.y,t:this.age,deck:this.prevDeck};this.maxAirY=this.y;}
   else{const ny=g;this.climb=lerp(this.climb,(ny-this.y)/dt,.5);this.y=ny;this.vy=this.climb;}}
  else{this.y+=this.vy*dt;this.air+=dt;this.maxAirY=Math.max(this.maxAirY,this.y);if(this.y<=g){const imp=-this.vy;this.y=g;this.onG=true;this.climb=0;const air=this.air;this.air=0;this.events.push({t:'land',imp,air,from:this.airStart});const lim=S.offroad?19:13;if(imp>lim)this.hurt((imp-lim)*2.2,null);this.susp=-Math.min(.25,imp*.012);}}
  if(this.onG)this.prevDeck=this.deck;
  this.surf=W.surface(this.x,this.z,this.y);
  // water
  if(this.y<WL-.7&&!this.water){this.water=.001;this.events.push({t:'splash'});}if(this.water){this.water+=dt;this.vx*=Math.exp(-dt*2.5);this.vz*=Math.exp(-dt*2.5);this.y=Math.max(this.y-dt*.8,WL-2.2);}
  // slope sampling (pitch/roll targets)
  if(this.onG&&!this.water){const L2=this.len*.42,W2=this.wid*.42;const fx=sa*L2,fz=ca*L2,rx=-ca*W2,rz=sa*W2;const hF=W.groundAt(this.x+fx,this.z+fz,this.y+.6),hB=W.groundAt(this.x-fx,this.z-fz,this.y+.6),hL=W.groundAt(this.x+rx,this.z+rz,this.y+.6),hR=W.groundAt(this.x-rx,this.z-rz,this.y+.6);
   const pt=Math.atan2(hB-hF,L2*2),rt=Math.atan2(hR-hL,W2*2);this.gslope=Math.sin(-pt);this.pitch+=(cl(pt,-.5,.5)-this.pitch)*Math.min(1,dt*12);this.roll+=(cl(rt,-.4,.4)-this.roll)*Math.min(1,dt*12);}
  else if(!this.onG){this.pitch+=(cl(-this.vy*.02,-.35,.45)-this.pitch)*Math.min(1,dt*1.5);this.roll*=Math.exp(-dt*2);}
  // collisions with world solids (circles along the body)
  this.collideWorld(W,dt);
  this.spin+=vf*dt/(this.shape.r||.35);this.steerVis+=(c.steer*(.5)-this.steerVis)*Math.min(1,dt*10);
  if(this.bike){const tl=cl(-this.w*Math.abs(vf)*.045,-.75,.75);this.lean+=(tl-this.lean)*Math.min(1,dt*6);}
  if(this.siren)this.sirenT+=dt;}
 circles(out){const n=this.bike?2:3,L=this.len/2-this.r*.9,sa=Math.sin(this.a),ca=Math.cos(this.a);for(let i=0;i<n;i++){const t=n===1?0:-1+2*i/(n-1);out[i]={x:this.x+sa*L*t,z:this.z+ca*L*t,t};}out.length=n;return out;}
 collideWorld(W,dt){const C=this.circles(_circ);for(const c of C){W.collide(c.x,c.z,this.r,this.y+.25,this.y+1.4,_col);if(_col.hit&&_col.s.kind==='parked'){if(!this.evParked){this.evParked=1;this.events.push({t:'parked',c:_col.s.ref});}}else if(_col.hit){this.x+=_col.px;this.z+=_col.pz;const l=Math.hypot(_col.px,_col.pz)||1,nx=_col.px/l,nz=_col.pz/l;this.impact(nx,nz,c,_col.s,W);}
   const rl=W.rail(c.x,c.z,this.y,this.r,this.deck);if(rl){this.x+=rl.nx*rl.pen;this.z+=rl.nz*rl.pen;this.impact(rl.nx,rl.nz,c,{kind:'rail'},W);}}}
 impact(nx,nz,c,s,W){const vn=this.vx*nx+this.vz*nz;if(vn>=0)return;const e=.22;this.vx-=(1+e)*vn*nx;this.vz-=(1+e)*vn*nz;const tx=-nz,tz=nx,vt=this.vx*tx+this.vz*tz;this.vx-=vt*tx*.12;this.vz-=vt*tz*.12;
  // spin from off-centre hits
  this.w+=c.t*(-vn)*.06*(nx*Math.cos(this.a)-nz*Math.sin(this.a));const str=-vn;if(str>4){this.hurt((str-4)*1.6,{nx,nz,x:c.x,z:c.z});this.events.push({t:'crash',str,kind:s?s.kind:'',x:c.x-nx*this.r,z:c.z-nz*this.r});}}
 hurt(d,at){if(this.wrecked)return;this.dmg+=d;if(at&&this.group)this.dent(at,d);if(this.dmg>=this.hp){this.wrecked=true;this.events.push({t:'wreck'});}}
 repair(){this.dmg=0;this.wrecked=false;this.flat=0;if(!this.shared&&this.group){this.body.geometry.dispose();this.body.geometry=buildModel(this.id).body;this.shared=true;}}
 // crumple the body around a world-space impact point
 dent(at,d){if(this.bike)return;if(this.shared){this.body.geometry=this.body.geometry.clone();this.shared=false;this.base=this.body.geometry.attributes.position.array.slice();}
  const sa=Math.sin(this.a),ca=Math.cos(this.a),dx=at.x-this.x,dz=at.z-this.z;const lx=dx*ca-dz*sa,lz=dx*sa+dz*ca;const nlx=at.nx*ca-at.nz*sa,nlz=at.nx*sa+at.nz*ca;
  const p=this.body.geometry.attributes.position,B0=this.base,amt=Math.min(.22,d*.012);const R=1.25;
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);const dd=Math.hypot(x-lx,(y-.8)*.7,z-lz);if(dd>R)continue;const f=(1-dd/R)**2*amt;let nx2=x+nlx*f,nz2=z+nlz*f,ny2=y-f*.35;
   const bx=B0[i*3],by=B0[i*3+1],bz=B0[i*3+2];const ex=nx2-bx,ey=ny2-by,ez=nz2-bz,el=Math.hypot(ex,ey,ez);if(el>.42){const k=.42/el;nx2=bx+ex*k;ny2=by+ey*k;nz2=bz+ez*k;}p.setXYZ(i,nx2,ny2,nz2);}
  p.needsUpdate=true;this.body.geometry.computeVertexNormals();}
 // visuals
 sync(dt,U,wheels,night){const g=this.group;if(!g)return;g.position.set(this.x,this.y,this.z);
  const k=Math.min(1,dt*8);this.vpitch+=(this.pitch-this.vpitch)*k;this.vroll+=(this.roll+(this.bike?this.lean:0)-this.vroll)*k;
  // body roll / squat from accelerations
  const vf=this.vf;const lat=-this.w*vf;const acc=(vf-(this.pvf??vf))/Math.max(dt,1e-3);this.pvf=vf;
  this.suspV+=(-this.susp*180-this.suspV*12)*dt;this.susp=cl(this.susp+this.suspV*dt,-.2,.12);
  g.rotation.set(this.vpitch,this.a,this.vroll,'YXZ');if(!this.bike)this.bodyPivot.rotation.set(cl(-acc*.004,-.05,.05),0,cl(lat*.0018,-.06,.06));this.bodyPivot.position.y=this.susp;
  this.mat.userData.dirt.value=Math.min(1,this.dmg/this.hp);if(this.drv)this.drv.visible=!!this.driver&&!this.wrecked;
  const gu=this.gmat.userData.g.value;gu.x=this.wrecked?0:.35+night*2.6;gu.y=this.wrecked?0:(this.braking?2.6:.25+night*.9);gu.z=this.siren?this.sirenT:0;gu.w=.6+night*2;
  if(wheels){const s=this.shape;const q=g.quaternion;const list=this.bike?[[0,s.wf],[0,s.wr]]:[[-s.W/2+.12,s.wf],[s.W/2-.12,s.wf],[-s.W/2+.12,s.wr],[s.W/2-.12,s.wr]];
   for(const[x,z]of list){_w.set(x,s.r,z).applyQuaternion(q).add(g.position);wheels.add(_w,q,z>0?this.steerVis*.6:0,this.spin,s.r,this.bike?.16:s.open?.36:.26);}}}}
const _circ=[],_col={},_w=new V();

/* ---------- AI helper: steer/throttle toward a target ---------- */
export function aiDrive(v,tx,tz,want,o={}){const c=v.ctrl;const ad=Math.atan2(tx-v.x,tz-v.z);const diff=wrapA(ad-v.a);const vf=v.vf;
 if(v.stuck>1.2){c.thr=-1;c.steer=-Math.sign(diff)*1;c.hb=false;v.stuck-=o.dt*0;return diff;}
 c.steer=cl(diff*2.4,-1,1);const turn=Math.abs(diff);let tgt=want*(turn>1.2?.35:turn>.6?.6:1);if(o.brakeFor)tgt=Math.min(tgt,o.brakeFor);
 c.thr=vf<tgt-1?1:vf>tgt+2?-.6:.15;c.hb=turn>1.1&&vf>14&&!o.nohb;if(Math.abs(diff)>2.4&&vf<6){c.thr=-1;c.steer=-c.steer;}return diff;}

/* ---------- parked cars along the curbs: one merged low-detail body per type, paint from instanceColor ---------- */
export function parkedGeo(id){const m=buildCar(id,-1),d=m.def,parts=m.body.map(([g,c,p])=>[g,null,c||new THREE.Color(1,1,1),p?1:0]);
 if(m.glass)parts.push([m.glass,null,new THREE.Color(.03,.04,.05),2]);
 for(const[x,z]of[[-d.W/2+.12,d.wf],[d.W/2-.12,d.wf],[-d.W/2+.12,d.wr],[d.W/2-.12,d.wr]]){const t=new THREE.CylinderGeometry(d.r,d.r,.26,9,1,true);t.rotateZ(Math.PI/2);t.translate(x,d.r,z);parts.push([t,null,new THREE.Color(.05,.05,.055),0]);
  const h=new THREE.CylinderGeometry(d.r*.62,d.r*.62,.27,7);h.rotateZ(Math.PI/2);h.translate(x,d.r,z);parts.push([h,null,new THREE.Color(.55,.57,.6),3]);}
 for(const e of m.glow)parts.push([e[0],null,e[2]===1?new THREE.Color(.5,.04,.04):new THREE.Color(.8,.82,.85),0]);
 const g=merge(parts,{k:true});g.setAttribute('aP',g.getAttribute('aK'));g.deleteAttribute('aK');return{geo:g,L:d.L,W:d.W};}
export function parkedMat(){const m=new THREE.MeshPhysicalMaterial({vertexColors:true,roughness:.36,metalness:.4,clearcoat:1,clearcoatRoughness:.05,envMapIntensity:1.1});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aP;varying float vP;').replace('#include <begin_vertex>','#include <begin_vertex>\nvP=aP;')
   // instanceColor tints only the painted panels
   .replace('#include <color_vertex>','#include <color_vertex>\n#ifdef USE_INSTANCING_COLOR\nvColor.xyz=mix(color.xyz,instanceColor.xyz,step(.5,aP)*step(aP,1.5));\n#endif');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vP;')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vP<.5?.7:vP<1.5?.36:vP<2.5?.04:.3;')
   .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\nmetalnessFactor=vP<.5?0.:vP<1.5?.4:vP<2.5?.1:.9;');};
 m.customProgramCacheKey=()=>'parked';return m;}
