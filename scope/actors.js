// LONG SHOT — procedural people: one skinned mesh per person (rigid-skinned parts, vertex-coloured outfit),
// bone-attached props, a pose library (walk/run/talk/phone/drink/smoke/sit/guard/ski/cower…) and a verlet ragdoll.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,Q=THREE.Quaternion,M4=THREE.Matrix4;
const C=h=>new THREE.Color(h);
const CY=(r1,r2,h,s=10,open=false)=>new THREE.CylinderGeometry(r1,r2,h,s,1,open),BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),SP=(r,a=12,b=10,t0=0,t1=Math.PI)=>new THREE.SphereGeometry(r,a,b,0,Math.PI*2,t0,t1);
const mtx=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new M4().compose(new V(x,y,z),new Q().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
// bone ids
export const B={root:0,hips:1,spine:2,chest:3,head:4,uaL:5,faL:6,uaR:7,faR:8,thL:9,shL:10,thR:11,shR:12};
const PARENT=[-1,0,1,2,3,3,5,3,7,1,9,1,11];
const BIND=[[0,0,0],[0,.96,0],[0,.1,0],[0,.2,0],[0,.27,0],[.19,.22,0],[0,-.29,0],[-.19,.22,0],[0,-.29,0],[.095,-.02,0],[0,-.45,0],[-.095,-.02,0],[0,-.45,0]];
const SKIN=[0xf1c9a5,0xd9a47c,0xb07850,0x8a5a3a,0x5e3a24,0xe8b896];
const HAIR=[0x1a1410,0x3a2616,0x6a4422,0xb08a50,0x8a8a88,0xd8c49a,0x2a1a10];
export const pick=(a,r=Math.random)=>a[Math.floor(r()*a.length)];
export function randomLook(r=Math.random){return{skin:pick(SKIN,r),hair:pick(HAIR,r),hs:pick(['short','short','long','bun','bald','pony'],r)};}

const MAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:0});
function addPart(acc,g,col,bone,m){g=g.index?g.toNonIndexed():g.clone();if(m)g.applyMatrix4(m);acc.push({g,col:C(col),bone});}
// outfit → geometry (bind pose, bone-local parts are moved by the bone's bind matrix)
function buildGeo(o,bindW){const P=[];const f=o.female,puff=o.topT==='ski'||o.topT==='parka'?1.13:1,top=o.top,pants=o.pants,shoes=o.shoes??0x1c1a18,skin=o.skin;
 const sleeve=o.topT==='tee'?skin:top,hand=o.gloves??skin,legC=o.topT==='dress'?skin:o.topT==='ski'?top:pants;
 // pelvis + abdomen + chest
 addPart(P,CY(f?.165:.155,.15*puff,.2),pants,B.hips,mtx(0,-.02,0,0,0,0,puff,1,.72*puff));
 addPart(P,CY(.15*puff,(f?.145:.155)*puff,.22),o.topT==='vest'||o.topT==='suit'?o.shirt??0xf0f0f0:top,B.spine,mtx(0,.08,0,0,0,0,1,1,.7));
 addPart(P,CY((f?.17:.19)*puff,.155*puff,.3),top,B.chest,mtx(0,.13,0,0,0,0,1,1,.64));
 for(const s of[-1,1])addPart(P,SP(.072*puff,8,6),top,B.chest,mtx(s*.165,.235,0));
 if(f&&o.topT!=='ski'&&o.topT!=='parka')addPart(P,SP(.06,8,6),top,B.chest,mtx(0,.12,.07,0,0,0,1.5,.8,.8));
 // jackets / coats / dresses
 if(o.topT==='suit'||o.topT==='uniform'){addPart(P,CY(.165,.168,.2,10,true),top,B.hips,mtx(0,-.02,0,0,0,0,1,1,.74));
  addPart(P,BX(.1,.17,.012),o.shirt??0xf2f2f2,B.chest,mtx(0,.16,.105));for(const s of[-1,1])addPart(P,BX(.045,.2,.012),top,B.chest,mtx(s*.045,.14,.112,0,0,s*.35));}
 if(o.topT==='vest')addPart(P,CY(.162,.158,.42,10,true),top,B.spine,mtx(0,.2,0,0,0,0,1,1,.7));
 if(o.tie)addPart(P,BX(.035,.26,.012),o.tie,B.chest,mtx(0,.07,.118));
 if(o.topT==='coat'){addPart(P,CY(.175,.235,.62,12,true),top,B.hips,mtx(0,-.26,0,0,0,0,1,1,.78));addPart(P,CY(.162,.162,.04),o.belt??0x2a2420,B.spine,mtx(0,.03,0,0,0,0,1,1,.72));for(const s of[-1,1])addPart(P,BX(.05,.24,.014),top,B.chest,mtx(s*.05,.14,.108,0,0,s*.3));}
 if(o.topT==='dress')addPart(P,CY(.16,.28,.52,12,true),top,B.hips,mtx(0,-.22,0,0,0,0,1,1,.8));
 if(o.topT==='hivis'||o.vest){const vc=o.vestC??0xff7a10;addPart(P,CY(.2,.168,.36,10,true),vc,B.chest,mtx(0,.08,0,0,0,0,1,1,.68));addPart(P,CY(.202,.2,.035,10,true),0xd8dde0,B.chest,mtx(0,.04,0,0,0,0,1,1,.69));addPart(P,CY(.18,.172,.035,10,true),0xd8dde0,B.chest,mtx(0,-.05,0,0,0,0,1,1,.69));}
 if(o.topT==='uniform'){for(const s of[-1,1])addPart(P,BX(.1,.02,.08),0xd8b040,B.chest,mtx(s*.17,.29,0));if(o.medals)for(let i=0;i<4;i++)addPart(P,BX(.025,.04,.01),[0xd04030,0x3060d0,0xd8b040,0x30a050][i],B.chest,mtx(.06+i*.028,.2,.112));addPart(P,CY(.16,.16,.04),0x2a2420,B.spine,mtx(0,.02,0,0,0,0,1,1,.72));}
 if(o.topT==='ski')addPart(P,CY(.214,.214,.04,10,true),o.stripe??0xf0f0f0,B.chest,mtx(0,.12,0,0,0,0,1,1,.7));
 if(o.scarf)addPart(P,new THREE.TorusGeometry(.075,.032,6,12),o.scarf,B.head,mtx(0,.02,0,Math.PI/2,0,0,1,1,.9)),addPart(P,BX(.07,.2,.03),o.scarf,B.chest,mtx(.06,.16,.12,0,0,.1));
 // neck + head
 addPart(P,CY(.048,.055,.1,8),skin,B.head,mtx(0,.04,0));
 addPart(P,SP(.1,14,12),skin,B.head,mtx(0,.155,.005,0,0,0,.95,1.12,1.05));
 addPart(P,BX(.024,.045,.035),skin,B.head,mtx(0,.145,.105,.2));for(const s of[-1,1])addPart(P,SP(.022,6,5),skin,B.head,mtx(s*.097,.155,0,0,0,0,.6,1,1));
 for(const s of[-1,1])addPart(P,BX(.022,.012,.01),0x1a1410,B.head,mtx(s*.036,.18,.101));
 addPart(P,BX(.04,.008,.01),0x8a4a3a,B.head,mtx(0,.11,.1));
 const hs=o.hs,hc=o.hair;
 if(hs!=='bald'||o.hat==='none'){if(hs!=='bald')addPart(P,SP(.108,14,8,0,Math.PI*.5),hc,B.head,mtx(0,.162,-.012,-.5,0,0,.98,1.1,1.08));}
 if(hs==='long')addPart(P,BX(.2,.26,.07),hc,B.head,mtx(0,.08,-.075));
 if(hs==='bun')addPart(P,SP(.052,8,6),hc,B.head,mtx(0,.25,-.08));
 if(hs==='pony')addPart(P,CY(.03,.015,.22,6),hc,B.head,mtx(0,.08,-.12,.3));
 const hat=o.hat||'none',hC=o.hatC??0x2a2a2a;
 if(hat==='fedora'){addPart(P,CY(.17,.17,.014,16),hC,B.head,mtx(0,.235,0));addPart(P,CY(.095,.11,.11,12),hC,B.head,mtx(0,.29,0));addPart(P,CY(.112,.112,.024,12),o.band??0x161210,B.head,mtx(0,.255,0));}
 else if(hat==='wide'){addPart(P,CY(.25,.25,.012,18),hC,B.head,mtx(0,.235,0));addPart(P,CY(.1,.115,.1,12),hC,B.head,mtx(0,.285,0));addPart(P,CY(.117,.117,.022,12),o.band??0x3a2a1a,B.head,mtx(0,.25,0));}
 else if(hat==='cap'){addPart(P,SP(.115,12,8,0,Math.PI*.5),hC,B.head,mtx(0,.19,0));addPart(P,BX(.16,.015,.11),hC,B.head,mtx(0,.195,.12,-.1));}
 else if(hat==='beanie'){addPart(P,SP(.116,12,8,0,Math.PI*.55),hC,B.head,mtx(0,.18,0,0,0,0,1,1.12,1));addPart(P,SP(.035,6,5),o.pom??0xf0f0f0,B.head,mtx(0,.31,0));}
 else if(hat==='hardhat'){addPart(P,SP(.125,14,8,0,Math.PI*.5),hC,B.head,mtx(0,.2,0));addPart(P,CY(.15,.15,.014,16),hC,B.head,mtx(0,.205,.02));addPart(P,BX(.03,.03,.24),hC,B.head,mtx(0,.32,0));}
 else if(hat==='helmet'){addPart(P,SP(.13,14,8,0,Math.PI*.55),hC,B.head,mtx(0,.17,-.005));}
 else if(hat==='skihelm'){addPart(P,SP(.128,14,10,0,Math.PI*.62),hC,B.head,mtx(0,.16,-.01,-.2));}
 else if(hat==='peaked'){addPart(P,CY(.13,.105,.07,14),hC,B.head,mtx(0,.28,.01,-.08));addPart(P,CY(.107,.107,.035,12),o.band??0x1a1a1a,B.head,mtx(0,.25,0));addPart(P,BX(.15,.012,.07),0x101010,B.head,mtx(0,.235,.11,-.25));addPart(P,BX(.05,.03,.01),0xd8b040,B.head,mtx(0,.285,.12,-.08));}
 else if(hat==='beret'){addPart(P,SP(.12,12,6,0,Math.PI*.4),hC,B.head,mtx(.02,.2,0,0,0,-.2,1,.7,1));}
 const gl=o.glasses;if(gl==='sun')addPart(P,BX(.16,.035,.018),0x050505,B.head,mtx(0,.18,.104));
 else if(gl==='goggles'){addPart(P,BX(.19,.06,.035),o.goggleC??0xd8a020,B.head,mtx(0,.18,.1));addPart(P,CY(.118,.118,.03,14,true),0x1a1a1a,B.head,mtx(0,.18,0,0,0,0,1,1,1.05));}
 // arms
 for(const[ua,fa,s]of[[B.uaL,B.faL,1],[B.uaR,B.faR,-1]]){const u=CY(.054*puff,.046*puff,.29,8);u.translate(0,-.145,0);addPart(P,u,sleeve,ua);
  const l=CY(.046*puff,.04*puff,.25,8);l.translate(0,-.125,0);addPart(P,l,sleeve,fa);if(o.topT==='suit'||o.topT==='uniform')addPart(P,CY(.043,.043,.025,8),o.shirt??0xf2f2f2,fa,mtx(0,-.245,0));
  addPart(P,BX(.055,.09,.042),hand,fa,mtx(0,-.3,0));addPart(P,BX(.02,.05,.02),hand,fa,mtx(s*.03,-.27,.02,0,0,s*.4));}
 // legs
 for(const[th,sh]of[[B.thL,B.shL],[B.thR,B.shR]]){const t=CY(.078*puff,.06*puff,.44,8);t.translate(0,-.22,0);addPart(P,t,legC,th);
  const s=CY(.057*puff,.045*puff,.44,8);s.translate(0,-.22,0);addPart(P,s,legC,sh);addPart(P,BX(.085,.075,.24),o.boots??shoes,sh,mtx(0,-.47,.04));}
 // merge into one skinned geometry
 let n=0;for(const p of P)n+=p.g.attributes.position.count;const pos=new Float32Array(n*3),nor=new Float32Array(n*3),col=new Float32Array(n*3),si=new Uint16Array(n*4),sw=new Float32Array(n*4);
 let k=0;const v=new V(),nn=new V(),nm=new THREE.Matrix3();for(const p of P){const pa=p.g.attributes.position.array,na=p.g.attributes.normal.array,W=bindW[p.bone];nm.getNormalMatrix(W);
  for(let i=0;i<pa.length;i+=3){v.set(pa[i],pa[i+1],pa[i+2]).applyMatrix4(W);nn.set(na[i],na[i+1],na[i+2]).applyMatrix3(nm).normalize();pos[k*3]=v.x;pos[k*3+1]=v.y;pos[k*3+2]=v.z;nor[k*3]=nn.x;nor[k*3+1]=nn.y;nor[k*3+2]=nn.z;
   col[k*3]=p.col.r;col[k*3+1]=p.col.g;col[k*3+2]=p.col.b;si[k*4]=p.bone;sw[k*4]=1;k++;}p.g.dispose();}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(nor,3));g.setAttribute('color',new THREE.BufferAttribute(col,3));
 g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));return g;}

// shared prop meshes
let PROPS=null;
function props(){if(PROPS)return PROPS;const std=o=>new THREE.MeshStandardMaterial(o);
 const m={metal:std({color:0xb8bcc2,metalness:.85,roughness:.3}),black:std({color:0x141414,roughness:.5}),brown:std({color:0x5a3a20,roughness:.7}),paper:std({color:0xf0f0ea,roughness:.9}),
  glass:std({color:0xd8f0ff,roughness:.05,metalness:.1,transparent:true,opacity:.45}),wine:std({color:0x8a1020,roughness:.2,emissive:0x200008}),cig:std({color:0xf0f0f0,roughness:.8}),ember:new THREE.MeshBasicMaterial({color:0xff6a20}),
  gun:std({color:0x1c1d20,metalness:.6,roughness:.45}),canopy:std({color:0x18181c,roughness:.6,side:THREE.DoubleSide}),canopyR:std({color:0x8a1a20,roughness:.6,side:THREE.DoubleSide}),ski:std({color:0xe8e8ea,roughness:.4}),skiR:std({color:0xd02a20,roughness:.4}),pole:std({color:0x30343a,metalness:.6,roughness:.4})};
 const G={briefcase:new THREE.Group(),clipboard:new THREE.Group(),drink:new THREE.Group(),phone:new THREE.Group(),cig:new THREE.Group(),umbrella:new THREE.Group(),rifle:new THREE.Group(),ski:new THREE.Group(),pole:new THREE.Group(),case:new THREE.Group()};
 const add=(grp,geo,mat,x=0,y=0,z=0,rx=0,ry=0,rz=0)=>{const o=new THREE.Mesh(geo,mat);o.position.set(x,y,z);o.rotation.set(rx,ry,rz);o.castShadow=true;grp.add(o);return o;};
 add(G.briefcase,BX(.1,.3,.42),m.metal,0,-.18,0);add(G.briefcase,BX(.03,.05,.12),m.black,0,-.01,0);
 add(G.case,BX(.1,.3,.42),m.black,0,-.18,0);add(G.case,BX(.03,.05,.12),m.black,0,-.01,0);
 add(G.clipboard,BX(.23,.31,.012),m.brown,0,0,0);add(G.clipboard,BX(.2,.26,.004),m.paper,0,-.01,.008);
 add(G.drink,CY(.028,.022,.09,8),m.glass,0,0,0);add(G.drink,CY(.024,.02,.05,8),m.wine,0,-.015,0);
 add(G.phone,BX(.035,.075,.01),m.black,0,0,0);
 add(G.cig,CY(.004,.004,.07,5),m.cig,0,0,0,0,0,Math.PI/2);add(G.cig,SP(.006,5,4),m.ember,.036,0,0);
 add(G.umbrella,CY(.008,.008,.95,5),m.black,0,.47,0);const can=new THREE.ConeGeometry(.55,.22,8,1,true);add(G.umbrella,can,m.canopy,0,.98,0);
 add(G.rifle,BX(.05,.09,.62),m.gun,0,0,.08);add(G.rifle,CY(.014,.014,.34,6),m.gun,0,.02,.55,Math.PI/2);add(G.rifle,BX(.035,.15,.06),m.gun,0,-.1,.16,.25);add(G.rifle,BX(.045,.1,.24),m.gun,0,-.02,-.3);
 add(G.ski,BX(.08,.02,1.7),m.ski,0,0,0);add(G.ski,BX(.082,.025,.12),m.black,0,.015,0);
 add(G.pole,CY(.008,.008,1.15,5),m.pole,0,-.5,0);
 PROPS={G,m};return PROPS;}
const propGeo=k=>props().G[k];

const _v=new V(),_v2=new V(),_q=new Q(),_q2=new Q(),_m=new M4();
export class Rig{
 constructor(o,height=1){this.o=o;const bones=[];for(let i=0;i<13;i++){const b=new THREE.Bone();b.position.fromArray(BIND[i]);bones.push(b);if(PARENT[i]>=0)bones[PARENT[i]].add(b);}
  this.bones=bones;bones[0].updateMatrixWorld(true);const bindW=bones.map(b=>b.matrixWorld.clone());
  const g=buildGeo(o,bindW);this.mesh=new THREE.SkinnedMesh(g,MAT);this.mesh.add(bones[0]);this.mesh.updateMatrixWorld(true);this.mesh.bind(new THREE.Skeleton(bones));
  this.mesh.castShadow=true;this.mesh.receiveShadow=false;this.mesh.boundingSphere=new THREE.Sphere(new V(0,.9,0),2.4);this.root=new THREE.Group();this.root.add(this.mesh);this.root.scale.setScalar(height);this.h=height;
  this.P=new Float32Array(24);this.T=new Float32Array(24);this.props={};
  if(o.umbrella){const u=propGeo('umbrella').clone();u.position.set(-.16,.12,.26);this.bones[B.chest].add(u);this.props.umbrella=u;if(o.umbrellaC)u.children[1].material=props().m.canopyR;}
  if(o.rifle){const r=propGeo('rifle').clone();r.position.set(-.1,.05,.2);r.rotation.set(.45,0,0);this.bones[B.chest].add(r);this.props.rifle=r;}
  if(o.briefcase){const b=propGeo(o.briefcase==='black'?'case':'briefcase').clone();b.position.set(0,-.31,0);this.bones[B.faR].add(b);this.props.briefcase=b;}
  if(o.clipboard){const c=propGeo('clipboard').clone();c.position.set(-.02,-.3,.06);c.rotation.set(-1.3,0,1.45);this.bones[B.faL].add(c);this.props.clipboard=c;}
  if(o.drink){const d=propGeo('drink').clone();d.position.set(0,-.33,.04);this.bones[B.faR].add(d);this.props.drink=d;}
  if(o.skis){for(const b of[B.shL,B.shR]){const s=propGeo('ski').clone();s.position.set(0,-.5,.25);this.bones[b].add(s);(this.props.skis=this.props.skis||[]).push(s);}
   for(const b of[B.faL,B.faR]){const p=propGeo('pole').clone();p.position.set(0,-.3,0);p.rotation.x=.5;this.bones[b].add(p);(this.props.poles=this.props.poles||[]).push(p);}}
  const ph=propGeo('phone').clone();ph.position.set(.02,-.31,.03);ph.visible=false;this.bones[B.faR].add(ph);this.props.phone=ph;
  const cg=propGeo('cig').clone();cg.position.set(0,-.33,.03);cg.visible=false;this.bones[B.faR].add(cg);this.props.cig=cg;
  this.rag=null;}
 setProp(k,on){const p=this.props[k];if(p&&p.visible!==on)p.visible=on;}
 // apply pose array (smoothed) to bones
 apply(dt,rate=10){const P=this.P,T=this.T,k=dt<0?1:Math.min(1,dt*rate);for(let i=0;i<24;i++)P[i]+=(T[i]-P[i])*k;const b=this.bones;
  b[1].position.y=.96+P[0];b[1].rotation.set(P[1],0,P[22]);b[2].rotation.set(P[2],P[3],P[23]);b[3].rotation.set(P[4],P[3]*.6,0);b[4].rotation.set(P[5],P[6],0);
  b[5].rotation.set(P[7],P[8],P[9]);b[6].rotation.set(P[10],0,0);b[7].rotation.set(P[11],P[12],P[13]);b[8].rotation.set(P[14],0,0);
  b[9].rotation.set(P[15],0,P[16]);b[10].rotation.set(P[17],0,0);b[11].rotation.set(P[18],0,P[19]);b[12].rotation.set(P[20],0,0);this.mesh.rotation.z=P[21];}
 // ---- ragdoll ----
 startRagdoll(world,imp,hitPart,extra){const b=this.bones;this.root.updateMatrixWorld(true);const wp=i=>b[i].getWorldPosition(new V());const loc=(i,x,y,z)=>new V(x,y,z).applyMatrix4(b[i].matrixWorld);
  const pts=[wp(B.hips),loc(B.thL,0,0,0),loc(B.thR,0,0,0),wp(B.head),loc(B.uaL,0,0,0),loc(B.uaR,0,0,0),loc(B.head,0,.16,0),loc(B.faL,0,0,0),loc(B.faR,0,0,0),loc(B.faL,0,-.3,0),loc(B.faR,0,-.3,0),loc(B.shL,0,0,0),loc(B.shR,0,0,0),loc(B.shL,0,-.47,0),loc(B.shR,0,-.47,0)];
  // 0 pelvis 1 hipL 2 hipR 3 neck 4 shL 5 shR 6 head 7 elbL 8 elbR 9 handL 10 handR 11 kneeL 12 kneeR 13 footL 14 footR
  const vel=pts.map(()=>new V());const weight=[.7,.5,.5,.9,.8,.8,1,.9,.9,1,1,.4,.4,.2,.2];const hitIdx={head:6,torso:3,arm:8,leg:12}[hitPart]??3;
  pts.forEach((p,i)=>{const d=p.distanceTo(pts[hitIdx]);const f=Math.max(.15,1-d*.7)*weight[i];vel[i].copy(imp).multiplyScalar(f);if(extra)vel[i].add(extra);});
  const prev=pts.map((p,i)=>p.clone().addScaledVector(vel[i],-1/60));
  const L=[[0,1],[0,2],[1,2],[0,3],[3,4],[3,5],[4,5],[0,4],[0,5],[1,4],[2,5],[1,3],[2,3],[3,6],[4,6],[5,6],[4,7],[7,9],[5,8],[8,10],[1,11],[11,13],[2,12],[12,14],[4,9,1],[5,10,1],[1,13,1],[2,14,1],[11,12,2],[13,14,2],[9,10,2],[0,6,1]];
  const cons=L.map(([a,c,t])=>({a,c,d:pts[a].distanceTo(pts[c]),t:t||0}));
  this.rag={pts,prev,cons,t:0,sleep:0,world,inv:new M4(),wet:false,ground:false};this.mesh.rotation.z=0;}
 stepRagdoll(dt){const r=this.rag;if(!r||r.sleep>1.5)return false;r.t+=dt;const g=9.81;let maxv=0;const h=Math.min(dt,1/40);const W=r.world;
  for(let i=0;i<r.pts.length;i++){const p=r.pts[i],q=r.prev[i];let vx=(p.x-q.x)*.995,vy=(p.y-q.y)*.995,vz=(p.z-q.z)*.995;q.copy(p);
   const wy2=W.waterAt(p.x,p.z);const inW=wy2!==null&&p.y<wy2-.1;if(inW){vx*=.9;vy*=.9;vz*=.9;vy+=(1.2*g)*h*h;r.wet=true;}p.x+=vx;p.y+=vy-g*h*h;p.z+=vz;maxv=Math.max(maxv,Math.abs(vx)+Math.abs(vy)+Math.abs(vz));}
  for(let it=0;it<6;it++){for(const c of r.cons){const A=r.pts[c.a],Bp=r.pts[c.c];_v.subVectors(Bp,A);const d=_v.length()||1e-6;
    if(c.t===1&&d>=c.d*.55)continue;if(c.t===2&&d>=.16)continue;const tgt=c.t===1?c.d*.55:c.t===2?.16:c.d;const k=(d-tgt)/d*.5;A.addScaledVector(_v,k);Bp.addScaledVector(_v,-k);}
   for(let i=0;i<r.pts.length;i++){const p=r.pts[i];const gy=r.world.groundAt(p.x,p.z,p.y+.3)+(i===6?.11:.06);if(p.y<gy){p.y=gy;const q=r.prev[i];q.x+=(p.x-q.x)*.35;q.z+=(p.z-q.z)*.35;r.ground=true;}r.world.pushOut&&r.world.pushOut(p,.08);}}
  if(maxv<.004&&r.t>.6)r.sleep+=dt;else r.sleep=0;this.poseFromRag();return true;}
 poseFromRag(){const r=this.rag,b=this.bones,P=r.pts;this.mesh.updateMatrixWorld(true);r.inv.copy(this.mesh.matrixWorld).invert();const L=P.map(p=>p.clone().applyMatrix4(r.inv));
  const up=_v.subVectors(L[3],L[0]).normalize(),side=_v2.subVectors(L[1],L[2]);side.addScaledVector(up,-side.dot(up)).normalize();const fw=new V().crossVectors(side,up);
  _m.makeBasis(side,up,fw);const hq=new Q().setFromRotationMatrix(_m);b[1].position.copy(L[0]);b[1].quaternion.copy(hq);b[2].quaternion.identity();b[3].quaternion.identity();b[0].quaternion.identity();b[0].position.set(0,0,0);
  const chestQ=hq,inv=chestQ.clone().invert();const dirQ=(from,to,down)=>{_v.subVectors(L[to],L[from]).normalize();return new Q().setFromUnitVectors(down?new V(0,-1,0):new V(0,1,0),_v);};
  b[4].quaternion.copy(inv).multiply(dirQ(3,6,false));
  for(const[ua,fa,s,e,h]of[[5,6,4,7,9],[7,8,5,8,10]]){const uw=dirQ(s,e,true);b[ua].quaternion.copy(inv).multiply(uw);const ui=uw.clone().invert();b[fa].quaternion.copy(ui).multiply(dirQ(e,h,true));}
  for(const[th,sh,hp,kn,ft]of[[9,10,1,11,13],[11,12,2,12,14]]){const tw=hq.clone().multiply(new Q());const thw=dirQ(hp,kn,true);b[th].quaternion.copy(inv).multiply(thw);const ti=thw.clone().invert();b[sh].quaternion.copy(ti).multiply(dirQ(kn,ft,true));}}
 get ragPelvis(){return this.rag?this.rag.pts[0]:null;}
}

// ---------- pose library: writes target angles into rig.T ----------
// indices: 0 hipsY 1 hipsX 2 spineX 3 spineY 4 chestX 5 headX 6 headY 7-9 uaL xyz 10 faL 11-13 uaR xyz 14 faR 15 thLx 16 thLz 17 shL 18 thRx 19 thRz 20 shR 21 roll 22 hipsZ 23 spineZ
export function pose(rig,act,ph,sp,t,o={}){const T=rig.T;T.fill(0);const s=Math.sin(ph),c=Math.cos(ph);
 // base: relaxed arms
 T[7]=.05;T[9]=.12;T[10]=-.18;T[11]=.05;T[13]=-.12;T[14]=-.18;T[5]=.02;
 const breathe=Math.sin(t*1.7+ph*.1)*.02;T[4]=breathe;
 if(sp>.15&&act!=='ski'&&act!=='ride'){const run=sp>2.6,A=run?.75:.42+sp*.03;T[15]=-s*A;T[18]=s*A;T[17]=Math.max(0,Math.sin(ph-1.3))*(run?1.5:.85)+.08;T[20]=Math.max(0,Math.sin(ph+Math.PI-1.3))*(run?1.5:.85)+.08;
  T[0]=-Math.abs(c)*(run?.05:.025)-(run?.06:0);T[3]=s*.08;T[2]=run?.22:.04;T[7]=s*(run?.8:.38);T[11]=-s*(run?.8:.38);T[10]=run?-1.45:-.3;T[14]=run?-1.45:-.3;
  if(o.panic){T[9]=2.2;T[13]=-2.2;T[10]=-1.6;T[14]=-1.6;T[7]=-.4;T[11]=-.4;}
  if(o.rifle){T[11]=-.45;T[13]=-.1;T[14]=-1.15;T[7]=-.85;T[9]=.32;T[10]=-.75;}
  if(o.briefcase){T[11]=-s*.15;T[14]=-.1;}
  if(o.umbrella){T[11]=-.5;T[13]=-.15;T[14]=-1.5;}
  if(o.clipboard){T[7]=-.25;T[9]=.12;T[10]=-1.75;}
  return;}
 switch(act){
  case'talk':{const g=Math.max(0,Math.sin(t*1.3+ph))*.5;T[11]=-.25-g*.4;T[13]=-.2;T[14]=-1.1-g*.5+Math.sin(t*4.1)*.12;T[5]=Math.sin(t*.9+ph)*.08;T[6]=Math.sin(t*.4+ph)*.25;T[7]=-.1;T[10]=-.5;break;}
  case'phone':T[11]=-.35;T[13]=-.55;T[12]=.3;T[14]=-2.35;T[6]=-.25+Math.sin(t*.5)*.15;T[5]=.1;T[7]=-.15;T[10]=-1.2;T[9]=.3;break;
  case'drink':{const sip=(t*.25+ph)%1<.12;T[11]=sip?-.6:-.25;T[13]=-.15;T[14]=sip?-2.2:-1.45;T[5]=sip?-.25:.04;T[6]=Math.sin(t*.4+ph)*.2;break;}
  case'smoke':{const puff=(t*.2+ph)%1<.15;T[11]=puff?-.55:-.15;T[13]=-.2;T[14]=puff?-2.25:-1.25;T[7]=-.3;T[9]=.2;T[10]=-1.6;T[6]=Math.sin(t*.3+ph)*.3;break;}
  case'guard':T[11]=-.45;T[13]=-.1;T[14]=-1.15;T[7]=-.85;T[9]=.32;T[10]=-.75;T[6]=Math.sin(t*.35+ph)*.7;break;
  case'arms':T[7]=-.35;T[9]=.25;T[10]=-1.95;T[11]=-.35;T[13]=-.25;T[14]=-1.95;T[6]=Math.sin(t*.3+ph)*.5;break;
  case'sit':T[0]=-.47;T[15]=-1.55;T[18]=-1.55;T[17]=1.5;T[20]=1.5;T[2]=-.1;T[7]=-.5;T[11]=-.5;T[10]=-.6;T[14]=-.6;T[6]=Math.sin(t*.3+ph)*.3;break;
  case'lounge':T[0]=-.6;T[1]=-1.1;T[15]=-.4;T[18]=-.3;T[17]=.2;T[20]=.4;T[7]=-.2;T[9]=1.2;T[10]=-1.8;T[11]=-.2;T[13]=-1.2;T[14]=-1.8;T[5]=.4;break;
  case'lean':T[2]=.55;T[4]=.15;T[7]=-1.2;T[10]=-.9;T[11]=-1.2;T[14]=-.9;T[9]=.15;T[13]=-.15;T[5]=-.4;T[15]=.1;T[18]=-.12;break;
  case'inspect':T[0]=-.38;T[15]=-1.45;T[17]=2;T[18]=-.3;T[20]=2.1;T[2]=.45;T[5]=.45;T[11]=-1;T[14]=-.3;T[7]=-.3;T[10]=-1.6;break;
  case'clip':T[7]=-.25;T[9]=.12;T[10]=-1.75;T[11]=-.3;T[13]=-.1;T[14]=-1.5+Math.sin(t*6)*.08;T[5]=.35;break;
  case'dance':{const b=Math.sin(t*6.3+ph);T[0]=-.05-Math.abs(b)*.06;T[22]=b*.12;T[23]=-b*.1;T[7]=-1.6+b*.3;T[9]=.5;T[10]=-.9;T[11]=-1.6-b*.3;T[13]=-.5;T[14]=-.9;T[15]=-.2+b*.15;T[18]=-.2-b*.15;T[17]=.3;T[20]=.3;T[5]=b*.12;break;}
  case'wave':T[11]=-.2;T[13]=-2.4;T[14]=-.5+Math.sin(t*9)*.35;break;
  case'cower':T[0]=-.52;T[15]=-1.9;T[18]=-1.9;T[17]=2.25;T[20]=2.25;T[2]=.85;T[5]=.5;T[7]=-2.4;T[9]=.4;T[10]=-1.8;T[11]=-2.4;T[13]=-.4;T[14]=-1.8;break;
  case'kneel':T[0]=-.42;T[15]=-1.5;T[17]=1.9;T[18]=.25;T[20]=1.95;T[2]=.2;T[7]=-.6;T[10]=-1.4;T[11]=-.45;T[14]=-1.1;break;
  case'ski':{const k=o.carve||0;T[0]=-.2;T[1]=.15;T[15]=-.65;T[18]=-.65;T[17]=1;T[20]=1;T[2]=.35;T[7]=-.45;T[9]=.35;T[10]=-.6;T[11]=-.45;T[13]=-.35;T[14]=-.6;T[21]=k*.35;T[16]=k*.1;T[19]=k*.1;break;}
  case'ride':T[0]=-.47;T[15]=-1.45;T[18]=-1.45;T[17]=1.2;T[20]=1.2;T[2]=-.05;T[7]=-.3;T[11]=-.3;T[10]=-.9;T[14]=-.9;T[6]=Math.sin(t*.2+ph)*.4;break;
  case'drive':T[0]=-.47;T[15]=-1.45;T[18]=-1.45;T[17]=1.3;T[20]=1.3;T[7]=-1.1;T[11]=-1.1;T[10]=-.5;T[14]=-.5;T[9]=.1;T[13]=-.1;break;
  case'slump':T[0]=-.47;T[15]=-1.45;T[18]=-1.45;T[17]=1.3;T[20]=1.3;T[2]=.7;T[5]=.8;T[3]=.3;T[7]=.3;T[11]=.3;T[9]=.2;T[13]=-.3;break;
  case'aim':T[11]=-1.45;T[13]=-.15;T[14]=-.5;T[7]=-1.5;T[9]=.45;T[10]=-.25;T[5]=-.05;T[3]=-.25;break;
  case'look':T[6]=Math.sin(t*.8+ph)*.9;T[5]=-.1;break;
  default:T[6]=Math.sin(t*.25+ph)*.35;T[22]=Math.sin(t*.4+ph)*.03;T[15]=.04;T[18]=-.04;}
 if(o.rifle&&act!=='guard'&&act!=='aim'&&act!=='sit'&&act!=='cower'){T[11]=-.45;T[13]=-.1;T[14]=-1.15;T[7]=-.85;T[9]=.32;T[10]=-.75;}
 if(o.umbrella&&act!=='phone'&&act!=='drink'&&act!=='smoke'){T[11]=-.5;T[13]=-.15;T[14]=-1.5;}
 if(o.clipboard&&act!=='inspect'&&act!=='clip'&&act!=='phone'){T[7]=-.25;T[9]=.12;T[10]=-1.75;}
 if(o.headY!==undefined)T[6]=o.headY;}
