// LONGBOW KEEP — procedural low-poly soldiers (articulated rigs + animation), first-person viewmodels, arrows, flags, bomb pots and build pieces.
import * as THREE from '../vendor/three.module.min.js';
import {V,C,TEAMS,merge,mat4,boxGeo,clothMat} from './gfx.js';

const SKIN=[0xf0c8a0,0xd9a77e,0xb07a52,0x8a5a3a,0xf5d2b5];
const charMat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.62,metalness:.12});
const cap=(r,l,c=4,s=8)=>new THREE.CapsuleGeometry(r,l,c,s);
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const STEEL=0xb8bec8,DSTEEL=0x6c727c,LEATHER=0x6a4428,DLEATHER=0x3e2816,WOOD=0x8a5a32,GOLD=0xe8b84a;

/* ---------- held items (shared geometry, coloured per team where needed) ---------- */
function bowGeo(len=1.25,col=0x7a4a26){const pts=[];const N=10;for(let i=0;i<=N;i++){const t=i/N*2-1;pts.push(new V(0,-.13*(1-t*t)+.04*t*t*t*t,t*len/2));}
 const curve=new THREE.CatmullRomCurve3(pts);return merge([[new THREE.TubeGeometry(curve,14,.022,5),col,[0,0,0]],[cap(.03,.14,2,6),DLEATHER,[0,-.13,0],[Math.PI/2,0,0]],[box(.004,.004,len*.97),0xeeeeee,[0,.04,0]]]);}
const ITEM={};
function items(){if(ITEM.bow)return ITEM;
 ITEM.bow=bowGeo(1.25);ITEM.sbow=bowGeo(.9,0x5a3a22);
 ITEM.xbow=merge([[box(.07,.08,.75),WOOD,[0,0,-.1]],[box(.9,.04,.05),0x5a3a22,[0,.02,-.42]],[box(.6,.012,.012),0xeeeeee,[0,.03,-.3]],[box(.05,.12,.1),DLEATHER,[0,-.08,.12]]]);
 ITEM.sword=merge([[box(.055,.78,.016),0xdfe5ee,[0,.5,0]],[box(.22,.04,.05),GOLD,[0,.1,0]],[cap(.022,.12,2,6),DLEATHER,[0,.01,0]],[new THREE.IcosahedronGeometry(.035,0),GOLD,[0,-.08,0]]]);
 ITEM.pot=merge([[new THREE.IcosahedronGeometry(.14,1),0xb0602e,[0,0,0]],[new THREE.CylinderGeometry(.05,.07,.06,8),0x8a4420,[0,.14,0]],[new THREE.CylinderGeometry(.008,.008,.1,4),0x3a3a3a,[0,.21,0]]]);
 ITEM.hammer=merge([[box(.03,.4,.03),WOOD,[0,.1,0]],[box(.14,.07,.07),DSTEEL,[0,.3,0]]]);
 return ITEM;}
function shieldGeo(team){const t=TEAMS[team];return merge([[new THREE.CylinderGeometry(.36,.36,.05,14),t.col,[0,0,0],[Math.PI/2,0,0]],[new THREE.TorusGeometry(.36,.025,4,16),DSTEEL,[0,0,0]],[new THREE.IcosahedronGeometry(.07,0),GOLD,[0,0,-.04]],
 [box(.06,.6,.012),0xf3e6c4,[0,0,-.028]],[box(.6,.06,.012),0xf3e6c4,[0,0,-.028]]]);}

/* ---------- soldier rig ---------- */
export class Rig{
 constructor(team,seed=0){const T=TEAMS[team],sk=SKIN[seed%SKIN.length],hat=seed%3;items();this.team=team;
  const root=this.root=new THREE.Group();const body=this.body=new THREE.Group();root.add(body);
  const mk=(list)=>{const m=new THREE.Mesh(merge(list),charMat);m.castShadow=true;return m;};
  const hips=this.hips=new THREE.Group();hips.position.y=.95;body.add(hips);
  hips.add(mk([[box(.36,.22,.24),T.dark,[0,0,0]],[box(.4,.07,.27),DLEATHER,[0,.1,0]],[box(.08,.07,.03),GOLD,[0,.1,-.14]],[box(.34,.3,.03),T.col,[0,-.16,-.12]],[box(.34,.3,.03),T.col,[0,-.16,.12]]]));
  const spine=this.spine=new THREE.Group();spine.position.y=.08;hips.add(spine);
  spine.add(mk([[new THREE.CylinderGeometry(.25,.2,.56,8),0x8c929c,[0,.3,0],[0,0,0],[1,1,.72]],[box(.4,.52,.04),T.col,[0,.28,-.15]],[box(.4,.52,.04),T.col,[0,.28,.15]],[box(.1,.5,.045),0xf3e6c4,[0,.29,-.155]],
   [new THREE.SphereGeometry(.13,8,6,0,Math.PI*2,0,Math.PI/2),STEEL,[.26,.5,0]],[new THREE.SphereGeometry(.13,8,6,0,Math.PI*2,0,Math.PI/2),STEEL,[-.26,.5,0]],
   [new THREE.CylinderGeometry(.075,.06,.62,7),LEATHER,[.1,.38,.2],[.25,0,-.35]],[box(.03,.06,.1),0xf0f0f0,[.24,.72,.28],[.25,0,-.35]],[box(.03,.06,.1),0xd84030,[.2,.74,.25],[.25,0,-.35]],[box(.03,.06,.1),0xf0f0f0,[.17,.73,.3],[.25,0,-.35]],
   [box(.04,.62,.03),DLEATHER,[0,.3,-.17],[0,0,.75]]]));
  const neck=this.neck=new THREE.Group();neck.position.y=.6;spine.add(neck);
  const helm=hat===0?[[new THREE.SphereGeometry(.175,9,6,0,Math.PI*2,0,Math.PI/2),STEEL,[0,.16,0]],[new THREE.CylinderGeometry(.19,.19,.04,10),DSTEEL,[0,.16,0]],[box(.03,.12,.03),STEEL,[0,.11,-.17]],[new THREE.ConeGeometry(.05,.22,5),T.col,[0,.36,.03],[-.3,0,0]]]
   :hat===1?[[new THREE.CylinderGeometry(.16,.18,.2,9),STEEL,[0,.2,0]],[new THREE.ConeGeometry(.19,.16,9),DSTEEL,[0,.37,0]],[box(.24,.03,.02),0x222222,[0,.17,-.17]],[box(.06,.18,.06),T.col,[0,.47,0]]]
   :[[new THREE.SphereGeometry(.18,9,6,0,Math.PI*2,0,Math.PI*.55),T.dark,[0,.13,0]],[new THREE.ConeGeometry(.12,.28,6),T.col,[0,.35,.08],[-.6,0,0]],[box(.32,.03,.06),T.dark,[0,.13,-.12]]];
  const head=this.head=mk([[new THREE.IcosahedronGeometry(.155,1),sk,[0,.13,0]],[box(.035,.035,.02),0x1a1410,[.055,.15,-.142]],[box(.035,.035,.02),0x1a1410,[-.055,.15,-.142]],[box(.04,.05,.04),sk,[0,.11,-.16]],...helm]);neck.add(head);
  const arm=(s)=>{const sh=new THREE.Group();sh.position.set(s*.29,.47,0);spine.add(sh);sh.add(mk([[cap(.07,.2),0x8c929c,[0,-.14,0]],[box(.15,.08,.15),T.col,[0,-.02,0]]]));
   const el=new THREE.Group();el.position.y=-.29;sh.add(el);el.add(mk([[cap(.062,.18),LEATHER,[0,-.12,0]],[new THREE.CylinderGeometry(.075,.07,.1,7),DLEATHER,[0,-.2,0]]]));
   const hand=new THREE.Group();hand.position.y=-.29;el.add(hand);hand.add(mk([[new THREE.IcosahedronGeometry(.065,0),DLEATHER,[0,0,0]]]));return{sh,el,hand};};
  this.R=arm(1);this.L=arm(-1);
  const leg=(s)=>{const th=new THREE.Group();th.position.set(s*.11,-.07,0);hips.add(th);th.add(mk([[cap(.085,.28),T.dark,[0,-.2,0]]]));const kn=new THREE.Group();kn.position.y=-.42;th.add(kn);
   kn.add(mk([[cap(.075,.26),DLEATHER,[0,-.18,0]],[box(.13,.1,.27),0x2e1e12,[0,-.4,-.04]],[new THREE.CylinderGeometry(.09,.085,.12,7),LEATHER,[0,-.08,0]]]));return{th,kn};};
  this.LL=leg(-1);this.RL=leg(1);
  // held items
  const I=ITEM;const bowM=(g)=>{const m=new THREE.Mesh(g,charMat);m.castShadow=true;m.rotation.set(0,0,0);return m;};
  this.bow=bowM(I.bow);this.sbow=bowM(I.sbow);this.xbow=bowM(I.xbow);for(const b of[this.bow,this.sbow]){b.position.set(0,-.02,0);b.rotation.set(0,Math.PI,0);this.L.hand.add(b);}
  this.xbow.position.set(0,-.04,0);this.xbow.rotation.set(-Math.PI/2,0,0);this.R.hand.add(this.xbow);
  this.sword=bowM(I.sword);this.sword.rotation.set(-Math.PI/2,0,0);this.sword.position.set(0,-.03,0);this.R.hand.add(this.sword);
  this.shield=new THREE.Mesh(shieldGeo(team),charMat);this.shield.castShadow=true;spine.add(this.shield);
  this.pot=bowM(I.pot);this.pot.position.set(0,-.08,0);this.R.hand.add(this.pot);
  this.nock=new THREE.Mesh(arrowGeo(),charMat);this.nock.visible=false;this.L.hand.add(this.nock);this.nock.rotation.set(Math.PI/2,0,0);
  this.flagSlot=new THREE.Group();this.flagSlot.position.set(-.05,.2,.24);this.flagSlot.rotation.set(.35,0,.15);spine.add(this.flagSlot);
  this.ph=Math.random()*6;this.deadT=0;this.blend=0;this.swingVis=0;}
 setWeapon(w,load){this.bow.visible=w==='bow'&&load==='long';this.sbow.visible=w==='bow'&&load==='short';this.xbow.visible=w==='bow'&&load==='cross';this.sword.visible=w==='sword';this.pot.visible=w==='bomb';this.w=w;}
 animate(s,dt){const k=Math.min(1,s.spd/6),air=!s.ground&&!s.climb;this.ph+=dt*(4+s.spd*1.25)*(s.ground?1:.3);const ph=this.ph,sw=Math.sin(ph);
  const L=this.L,R=this.R,LL=this.LL,RL=this.RL;
  if(s.dead){this.deadT+=dt;const t=Math.min(1,this.deadT/.55);const e=t<1?t*t*(3-2*t):1;this.body.rotation.x=-e*1.45;this.body.position.y=-e*.15+Math.sin(Math.min(1,this.deadT/.7)*Math.PI)*.05;
   L.sh.rotation.set(-.4*e,0,-.9*e);R.sh.rotation.set(-.4*e,0,.9*e);L.el.rotation.x=0;R.el.rotation.x=0;LL.th.rotation.x=.3*e;RL.th.rotation.x=-.1*e;LL.kn.rotation.x=.2;RL.kn.rotation.x=.4;this.neck.rotation.x=-.3*e;
   if(this.deadT>2.6)this.body.position.y=-.15-(this.deadT-2.6)*.5;return;}
  this.deadT=0;this.body.rotation.x=0;this.body.position.y=0;
  // legs
  if(s.climb){const c=Math.sin(s.t*7);LL.th.rotation.x=.9+c*.5;RL.th.rotation.x=.9-c*.5;LL.kn.rotation.x=-1.2;RL.kn.rotation.x=-1.2;}
  else if(air){LL.th.rotation.x=.55;RL.th.rotation.x=-.2;LL.kn.rotation.x=-.9;RL.kn.rotation.x=-.5;}
  else{LL.th.rotation.x=sw*.75*k;RL.th.rotation.x=-sw*.75*k;LL.kn.rotation.x=-Math.max(0,-Math.cos(ph))*1.1*k-.05;RL.kn.rotation.x=-Math.max(0,Math.cos(ph))*1.1*k-.05;}
  this.hips.position.y=.95+Math.abs(Math.cos(ph))*.045*k-(s.block?.06:0);this.hips.rotation.y=sw*.12*k;
  const p=s.pitch||0;this.spine.rotation.x=p*.45+(k*.08);this.spine.rotation.y=-sw*.1*k;this.neck.rotation.x=p*.45;
  // arms by stance
  const w=s.weapon;
  if(s.climb){const c=Math.sin(s.t*7);L.sh.rotation.set(2.6+c*.3,0,.15);R.sh.rotation.set(2.6-c*.3,0,-.15);L.el.rotation.x=.5;R.el.rotation.x=.5;}
  else if(w==='bow'&&s.load!=='cross'){const d=s.draw;const aim=s.aiming?1:0;
   L.sh.rotation.set(lerpA(sw*.5*k+.15,Math.PI/2+.05,aim),0,lerpA(-.1,-.15,aim));L.el.rotation.x=lerpA(.3,.05,aim);
   R.sh.rotation.set(lerpA(-sw*.5*k+.15,Math.PI/2-.1+d*.15,aim),lerpA(0,-.2-d*.4,aim),lerpA(.1,.35+d*.5,aim));R.el.rotation.x=lerpA(.35,1.6+d*1.15,aim);
   this.nock.visible=aim>0&&s.ammo>0;this.nock.position.set(.03,.02+(1-d)*-.4,.02);}
  else if(w==='bow'){L.sh.rotation.set(1.25+p*.4,0,-.35);L.el.rotation.x=.5;R.sh.rotation.set(1.05+p*.4,0,.12);R.el.rotation.x=.75;this.nock.visible=false;}
  else if(w==='sword'){this.nock.visible=false;const sv=s.swing;const a=sv>0?(sv<.25?sv/.25:1-(sv-.25)/.75):0;
   R.sh.rotation.set(lerpA(.4-sw*.3*k,2.5,a)-(sv>.25?(1-a)*1.8:0)*(sv>0?1:0),0,lerpA(.15,.5,a));R.el.rotation.x=lerpA(1.1,.4,a);
   if(s.block){L.sh.rotation.set(1.35,0,.55);L.el.rotation.x=.9;}else{L.sh.rotation.set(.55+sw*.2*k,0,.25);L.el.rotation.x=1.2;}}
  else if(w==='bomb'){this.nock.visible=false;const a=s.aiming?1:0;R.sh.rotation.set(lerpA(.3,-2.4,a),0,lerpA(.15,.4,a));R.el.rotation.x=lerpA(.6,1.2,a);L.sh.rotation.set(lerpA(.2,1.2,a)+sw*.4*k,0,-.2);L.el.rotation.x=.4;}
  else{this.nock.visible=false;L.sh.rotation.set(sw*.6*k,0,-.12);R.sh.rotation.set(-sw*.6*k,0,.12);L.el.rotation.x=.35;R.el.rotation.x=.35;}
  if(s.throwT>0){R.sh.rotation.x=lerpA(1.3,-2.4,s.throwT);}
  // shield: on the back with ranged weapons, forearm-front with the sword, raised square when blocking
  const sh=this.shield;if(w==='sword'){const b=s.block?1:0;this.sb=(this.sb||0)+(b-(this.sb||0))*Math.min(1,dt*14);const k=this.sb;sh.position.set(lerpA(-.34,-.06,k),lerpA(.28,.42,k),lerpA(-.2,-.44,k));sh.rotation.set(0,lerpA(-1.1,-.05,k),0);}
  else{sh.position.set(.02,.32,.27);sh.rotation.set(-.12,Math.PI,0);}}}
const lerpA=(a,b,t)=>a+(b-a)*t;

/* ---------- arrows + bolts ---------- */
let AG=null;
export function arrowGeo(){if(AG)return AG;AG=merge([[new THREE.CylinderGeometry(.011,.011,.78,5),0xc8a070,[0,0,-.33],[Math.PI/2,0,0]],[new THREE.ConeGeometry(.026,.1,4),0x7a8088,[0,0,.08],[Math.PI/2,0,0]],
 [box(.004,.05,.14),0xf2f2f2,[0,.026,-.66]],[box(.004,.05,.14),0xd84030,[.022,-.013,-.66],[0,0,2.09]],[box(.004,.05,.14),0xf2f2f2,[-.022,-.013,-.66],[0,0,-2.09]]]);return AG;}
export function makeArrowMeshes(scene,nFly=96,nStuck=320){const g=arrowGeo();const m1=new THREE.InstancedMesh(g,charMat,nFly),m2=new THREE.InstancedMesh(g,charMat,nStuck);for(const m of[m1,m2]){m.castShadow=true;m.frustumCulled=false;m.count=0;scene.add(m);}m2.count=nStuck;const Z=new THREE.Matrix4().makeScale(0,0,0);for(let i=0;i<nStuck;i++)m2.setMatrixAt(i,Z);return{fly:m1,stuck:m2};}

/* ---------- capture flag ---------- */
export function makeFlag(team,U,tex){const g=new THREE.Group();const pole=new THREE.Mesh(merge([[new THREE.CylinderGeometry(.045,.05,2.9,7),0x6a4426,[0,1.45,0]],[new THREE.IcosahedronGeometry(.09,0),GOLD,[0,2.95,0]],[new THREE.ConeGeometry(.06,.25,5),DSTEEL,[0,-.05,0],[Math.PI,0,0]]]),charMat);pole.castShadow=true;g.add(pole);
 const cg=new THREE.PlaneGeometry(1.5,.95,10,4);cg.translate(.75,-.475,0);const cloth=new THREE.Mesh(cg,clothMat({map:tex,emissive:new C(TEAMS[team].col),emissiveIntensity:.18},U,false));cloth.position.y=2.85;cloth.castShadow=true;g.add(cloth);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.2,.05,6,40).rotateX(Math.PI/2),new THREE.MeshBasicMaterial({color:TEAMS[team].glow.clone().multiplyScalar(.9),transparent:true,opacity:.7,depthWrite:false,blending:THREE.AdditiveBlending}));ring.position.y=.06;g.add(ring);
 const beam=new THREE.Mesh(new THREE.CylinderGeometry(.5,.9,26,16,1,true),new THREE.MeshBasicMaterial({color:TEAMS[team].glow.clone().multiplyScalar(.16),transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide}));beam.position.y=13;g.add(beam);
 g.userData={ring,beam,cloth};return g;}

/* ---------- bomb pot, build pieces ---------- */
export function potMesh(){items();const m=new THREE.Mesh(ITEM.pot,charMat);m.castShadow=true;return m;}
export function buildGeos(){const b=[];for(let i=0;i<6;i++)b.push([boxGeo(.48,2.2+(i%2)*.18,.12,2,i*.3),0xd0a070,[-1.25+i*.5,1.1+(i%2)*.09,0]]);b.push([boxGeo(3.1,.2,.14,2),0xa07848,[0,.6,-.1]],[boxGeo(3.1,.2,.14,2),0xa07848,[0,1.7,-.1]],[boxGeo(.14,1.6,.14,2),0x8a6038,[-1.3,.7,.55],[-.6,0,0]],[boxGeo(.14,1.6,.14,2),0x8a6038,[1.3,.7,.55],[-.6,0,0]]);
 const wall=merge(b);const r=[];const L=4.6,Hh=2.5,ang=Math.atan2(Hh,L),len=Math.hypot(L,Hh);for(let i=0;i<9;i++){const t=(i+.5)/9;r.push([boxGeo(3,.1,len/9-.04,2,i*.21),0xd0a070,[0,t*Hh+.02,-L/2+t*L],[ang,0,0]]);}
 r.push([boxGeo(.14,.14,len,2),0x8a6038,[-1.35,Hh/2-.08,0],[ang,0,0]],[boxGeo(.14,.14,len,2),0x8a6038,[1.35,Hh/2-.08,0],[ang,0,0]],[boxGeo(.14,Hh,.14,2),0x8a6038,[-1.35,Hh/2,L/2-.1]],[boxGeo(.14,Hh,.14,2),0x8a6038,[1.35,Hh/2,L/2-.1]]);
 return{wall,ramp:merge(r),L,Hh};}

/* ================= first-person viewmodels ================= */
// orient a forearm (local +z axis) along a fixed camera-space direction regardless of the bow's cant
const LA_DIR=new V(-.5,-.6,.62).normalize(),RA_DIR=new V(.55,-.5,.67).normalize(),_qa=new THREE.Quaternion(),_qb=new THREE.Quaternion(),_z=new V(0,0,1);
function aimArm(arm,g,glove,dir){g.updateMatrix();_qa.copy(g.quaternion).multiply(glove.quaternion).invert();_qb.setFromUnitVectors(_z,dir);arm.quaternion.copy(_qa.multiply(_qb));}
export class Viewmodel{
 constructor(team){items();this.team=team;const T=TEAMS[team];const root=this.root=new THREE.Group();const mat=this.mat=new THREE.MeshStandardMaterial({vertexColors:true,flatShading:true,roughness:.6,metalness:.1});
  const mk=(list)=>new THREE.Mesh(merge(list),mat);
  const forearm=()=>mk([[cap(.05,.36,3,8),T.col,[0,0,.22],[Math.PI/2,0,0]],[new THREE.CylinderGeometry(.062,.058,.16,8),DLEATHER,[0,0,0],[Math.PI/2,0,0]],[box(.08,.035,.09),0xf3e6c4,[0,.045,.2]]]);
  const glove=()=>mk([[new THREE.IcosahedronGeometry(.052,1),DLEATHER,[0,0,-.04]],[box(.075,.05,.07),DLEATHER,[0,-.02,-.08]]]);
  // --- bows (longbow + shortbow): limbs bend with the draw; string follows the nock ---
  const mkBow=(len,col,recurve)=>{const g=new THREE.Group();const limb=(s)=>{const pts=[];for(let i=0;i<=8;i++){const t=i/8;pts.push(new V(0,s*(.06+t*len),t*t*.11-(recurve?Math.pow(t,5)*.07:0)));}const gg=new THREE.Group();const m=mk([[new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),12,.026,6),col,[0,0,0]]]);gg.add(m);gg.userData.tip=new V(0,s*(.06+len),.11-(recurve?.07:0));return gg;};
   const up=limb(1),lo=limb(-1);g.add(up,lo);g.add(mk([[cap(.024,.12,2,6),DLEATHER,[0,0,0]],[box(.03,.03,.03),GOLD,[0,.08,.0]]]));
   const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));const str=new THREE.Line(sg,new THREE.LineBasicMaterial({color:0xf4efe4}));str.frustumCulled=false;g.add(str);
   const arrow=new THREE.Mesh(arrowGeo(),mat);g.add(arrow);const lg=glove();lg.position.set(-.005,0,.03);g.add(lg);const la=forearm();la.position.set(-.02,-.03,.06);lg.add(la);
   const rg=glove();g.add(rg);const ra=forearm();rg.add(ra);
   g.userData={up,lo,str,arrow,rg,lg,la,ra,len};return g;};
  this.long=mkBow(.64,0x9a6236,false);this.short=mkBow(.42,0x7a4a2a,true);
  // --- crossbow ---
  {const g=new THREE.Group();g.add(mk([[box(.07,.075,.66),WOOD,[0,0,.05]],[box(.05,.12,.12),DLEATHER,[0,-.07,.33]],[box(.04,.02,.5),DSTEEL,[0,.045,-.05]],[box(.02,.06,.03),DSTEEL,[0,-.06,.06]],[new THREE.CylinderGeometry(.03,.03,.1,8),DSTEEL,[.06,0,.2],[0,0,Math.PI/2]],[box(.12,.015,.015),DSTEEL,[.12,0,.2]]]));
   const prod=new THREE.Group();prod.position.z=-.26;prod.add(mk([[box(.62,.035,.04),0x5a3a22,[0,.03,0]],[box(.08,.06,.07),DSTEEL,[0,.03,0]]]));g.add(prod);
   const sg=new THREE.BufferGeometry();sg.setAttribute('position',new THREE.Float32BufferAttribute(new Float32Array(9),3));const str=new THREE.Line(sg,new THREE.LineBasicMaterial({color:0xf4efe4}));str.frustumCulled=false;g.add(str);
   const bolt=new THREE.Mesh(arrowGeo(),mat);bolt.scale.set(1.5,1.5,.5);g.add(bolt);const lg=glove();lg.position.set(0,-.06,-.12);g.add(lg);const la=forearm();la.rotation.set(.4,-.5,0);lg.add(la);
   const rg=glove();rg.position.set(0,-.09,.33);g.add(rg);const ra=forearm();ra.rotation.set(.35,.45,0);rg.add(ra);g.userData={str,bolt,prod};this.cross=g;}
  // --- sword + shield ---
  {const g=new THREE.Group();const s=new THREE.Group();const sm=mk([[box(.06,.85,.018),0xe4eaf2,[0,.55,0]],[box(.012,.8,.022),0xaab2be,[0,.55,0]],[box(.26,.045,.06),GOLD,[0,.1,0]],[cap(.024,.13,2,6),DLEATHER,[0,0,0]],[new THREE.IcosahedronGeometry(.04,0),GOLD,[0,-.1,0]]]);s.add(sm);
   const rg=glove();s.add(rg);const ra=forearm();ra.rotation.set(1.5,0,0);ra.position.z=.02;rg.add(ra);g.add(s);
   const sh=new THREE.Group();const shm=new THREE.Mesh(shieldGeo(team),mat);sh.add(shm);sh.add(mk([[box(.5,.06,.03),DLEATHER,[0,.08,.04]],[box(.5,.06,.03),DLEATHER,[0,-.1,.04]]]));const lg=forearm();lg.position.set(0,-.05,.12);lg.rotation.set(0,.2,0);sh.add(lg);g.add(sh);g.userData={s,sh};this.sword=g;}
  // --- bomb pot ---
  {const g=new THREE.Group();const p=new THREE.Mesh(ITEM.pot,mat);g.add(p);const rg=glove();rg.position.set(.03,-.1,.04);g.add(rg);const ra=forearm();ra.rotation.set(.3,-.4,0);rg.add(ra);
   const spark=new THREE.Mesh(new THREE.SphereGeometry(.025,6,4),new THREE.MeshBasicMaterial({color:new C(4,2.2,.6)}));spark.position.y=.27;g.add(spark);g.userData={spark};this.bomb=g;}
  // --- hammer (build mode) ---
  {const g=new THREE.Group();const h=new THREE.Mesh(ITEM.hammer,mat);h.scale.setScalar(1.3);g.add(h);const rg=glove();g.add(rg);const ra=forearm();ra.rotation.set(1.4,0,0);rg.add(ra);this.build=g;}
  for(const k of['long','short','cross','sword','bomb','build']){this[k].visible=false;root.add(this[k]);}
  this.cur=null;this.sw=0;this.kick=0;this.swayX=0;this.swayY=0;this.lastSwing=0;this.bobT=0;}
 show(kind){if(this.cur===kind)return;for(const k of['long','short','cross','sword','bomb','build'])this[k].visible=k===kind;this.cur=kind;this.sw=1;}
 update(s,dt){// s: kind, draw, loaded, reload, swing, block, aim(bomb), speed, ground, t, mdx, mdy, kick, fov
  this.show(s.kind);const g=this[s.kind];if(!g)return;this.sw=Math.max(0,this.sw-dt*4);this.kick*=Math.exp(-dt*12);
  this.swayX+=((s.mdx||0)*-.0006-this.swayX)*Math.min(1,dt*10);this.swayY+=((s.mdy||0)*.0006-this.swayY)*Math.min(1,dt*10);
  this.bobT+=dt*(s.ground?s.speed*1.3:0);const bob=Math.min(1,s.speed/7)*(s.ground?1:0);const bx=Math.sin(this.bobT)*.012*bob,by=-Math.abs(Math.cos(this.bobT))*.014*bob;
  const lower=this.sw*.35;
  if(s.kind==='long'||s.kind==='short'){const u=g.userData,d=s.draw,L=u.len;
   g.scale.setScalar(.5);g.position.set(-.15+d*.065+bx,-.085+by-lower+d*.04,-.74-d*.02);g.rotation.set(.03+this.swayY,.1-d*.08+this.swayX,.4-d*.14);
   const bend=d*(s.kind==='long'?.2:.14);u.up.rotation.x=bend;u.lo.rotation.x=-bend;
   const tipU=u.up.userData.tip.clone().applyEuler(u.up.rotation),tipL=u.lo.userData.tip.clone().applyEuler(u.lo.rotation);const tz=u.up.userData.tip.z,nz=tz+d*(s.kind==='long'?.36:.3);
   const P=u.str.geometry.attributes.position;P.setXYZ(0,tipU.x,tipU.y,tipU.z);P.setXYZ(1,0,0,nz);P.setXYZ(2,tipL.x,tipL.y,tipL.z);P.needsUpdate=true;
   u.arrow.visible=s.loaded;u.arrow.position.set(.014,.012,nz-.72);u.arrow.rotation.set(0,Math.PI,0);u.rg.position.set(.03,-.02,nz+.03);u.rg.rotation.set(0,0,.2);u.rg.visible=false;
   const w=s.wobble||0;g.position.x+=Math.sin(s.t*2.1)*w*.012;g.position.y+=Math.sin(s.t*3.3)*w*.01;
   aimArm(u.la,g,u.lg,LA_DIR);aimArm(u.ra,g,u.rg,RA_DIR);}
  else if(s.kind==='cross'){const u=g.userData;const r=s.reload;const low=r>0?Math.sin(Math.min(1,r)*Math.PI):0;
   g.scale.setScalar(.68);g.position.set(.17+bx-low*.05,-.17+by-lower-low*.1+(s.aim?.04:0),-.5+(s.aim?.04:0)+this.kick*.05);g.rotation.set(-.02-low*.6+this.swayY+this.kick*.2,.03+this.swayX,low*.4);if(s.aim){g.position.x=.04;g.position.y+=.07;}
   const pull=s.loaded?1:r>0?Math.min(1,r):0;const sz=-.26+pull*.24;const P=u.str.geometry.attributes.position;P.setXYZ(0,-.3,.03,-.26);P.setXYZ(1,0,.04,sz);P.setXYZ(2,.3,.03,-.26);P.needsUpdate=true;
   u.prod.scale.z=1;u.bolt.visible=s.loaded;u.bolt.rotation.set(0,Math.PI,0);u.bolt.position.set(0,.06,sz-.36);}
  else if(s.kind==='sword'){const u=g.userData,sv=s.swing;// 0..1 swing progress
   const a=sv>0?Math.sin(Math.min(1,sv)*Math.PI):0,ph=sv>0?sv:0;
   u.s.scale.setScalar(.62);u.s.position.set(.27+bx-ph*.3*a,-.27+by-lower+a*.1,-.56-a*.06);u.s.rotation.set(-.35+a*-.9+ph*1.4*a,-.25+ph*.9*a,-.25-ph*1.6*a);
   const b=s.block?1:0;this.blk=(this.blk||0)+(b-(this.blk||0))*Math.min(1,dt*14);const k=this.blk;
   u.sh.position.set(-.38+k*.22+bx*.5,-.31+k*.1+by-lower,-.66-k*.08);u.sh.rotation.set(-.1+k*.1,.55-k*.45,-.1);u.sh.scale.setScalar(.6-k*.08);}
  else if(s.kind==='bomb'){const a=s.aim?1:0;this.ba=(this.ba||0)+(a-(this.ba||0))*Math.min(1,dt*10);const k=this.ba;const th=s.throwT||0;
   g.scale.setScalar(.75);g.position.set(.22+bx+k*.05,-.2+by-lower+k*.1-th*.3,-.52+k*.12-th*.4);g.rotation.set(k*.4-th,0,0);g.userData.spark.visible=s.loaded;g.userData.spark.scale.setScalar(.7+Math.random()*.7);g.visible=s.loaded||th>0;}
  else if(s.kind==='build'){const sv=s.swing;g.scale.setScalar(.6);g.position.set(.22+bx,-.22+by-lower,-.5);g.rotation.set(-.4-Math.sin(Math.min(1,sv)*Math.PI)*.9,-.3,.1);}
  this.root.position.set(0,0,0);}}
