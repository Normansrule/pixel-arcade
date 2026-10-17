// HALCYON HEIST — procedural character rigs: crew in suits + hand-made masks, guards, civilians, bank staff, police (patrol, SWAT,
// heavy, shield). Articulated limbs with IK arms; walk/run/crouch/cower/tied/downed/seated/death poses; duffel bags; hit volumes.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(r1,r2,h,s=8)=>new THREE.CylinderGeometry(r1,r2,h,s),SP=(r,a=12,b=10)=>new THREE.SphereGeometry(r,a,b);
const UA=.29,LA=.27,TH=.45,SH=.45;
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
function cmerge(parts){const pos=[],nor=[],col=[],idx=[];let off=0;const v=new V(),n=new V(),nm=new THREE.Matrix3();for(const[g0,c,m]of parts){const g=g0;const p=g.attributes.position.array,q=g.attributes.normal.array;if(m)nm.getNormalMatrix(m);
  for(let i=0;i<p.length;i+=3){v.set(p[i],p[i+1],p[i+2]);n.set(q[i],q[i+1],q[i+2]);if(m){v.applyMatrix4(m);n.applyMatrix3(nm).normalize();}pos.push(v.x,v.y,v.z);nor.push(n.x,n.y,n.z);col.push(c.r,c.g,c.b);}
  const ix=g.index?g.index.array:[...Array(p.length/3).keys()];for(const i of ix)idx.push(i+off);off+=p.length/3;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));out.setIndex(idx);return out;}
const C=h=>new THREE.Color(h);
// characters get a soft fill on top of the scene lights so dark clothing still reads against baked interiors
export const CHAR_AMB={value:new THREE.Color(.3,.28,.26)};
export function charMat(m){m.onBeforeCompile=s=>{s.uniforms.uCharAmb=CHAR_AMB;s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uCharAmb;')
 .replace('#include <lights_fragment_maps>','#include <lights_fragment_maps>\n irradiance+=uCharAmb*(.75+.25*normal.y);');};m.customProgramCacheKey=()=>'hchar';return m;}
const RIGMAT=charMat(new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78,metalness:.04,envMapIntensity:.6}));
const g=(f,m)=>{const x=f();if(m)x.applyMatrix4(m);return x;};
// body part geometry
const GEO={torso:g(()=>BX(.38,.5,.22),M4(0,.27,0)),hips:g(()=>BX(.32,.14,.2),M4(0,.02,0)),jacket:g(()=>BX(.41,.48,.25),M4(0,.29,0)),lapel:g(()=>BX(.16,.36,.02),M4(0,.33,.125)),tie:g(()=>BX(.05,.32,.02),M4(0,.32,.135)),
 vest:g(()=>BX(.45,.4,.3),M4(0,.3,.01)),pouch:g(()=>BX(.1,.12,.07),M4(0,.17,.17)),belt:g(()=>BX(.36,.06,.24),M4(0,.04,0)),badge:g(()=>BX(.06,.07,.02),M4(-.1,.38,.12)),
 head:g(()=>SP(.105,14,12),M4(0,.11,.01)),neckC:g(()=>CY(.05,.055,.1),M4()),hair:g(()=>new THREE.SphereGeometry(.112,12,8,0,Math.PI*2,0,Math.PI*.5),M4(0,.13,-.005)),
 bun:g(()=>SP(.05,8,6),M4(0,.17,-.09)),cap:g(()=>new THREE.SphereGeometry(.118,12,8,0,Math.PI*2,0,Math.PI*.55),M4(0,.13,0)),brim:g(()=>BX(.18,.02,.1),M4(0,.15,.11,-.12)),
 helmet:g(()=>new THREE.SphereGeometry(.135,14,8,0,Math.PI*2,0,Math.PI*.55),M4(0,.13,0)),visor:g(()=>BX(.22,.09,.03),M4(0,.11,.12)),faceplate:g(()=>BX(.2,.16,.04),M4(0,.08,.12)),
 upper:g(()=>CY(.058,.05,UA),M4(0,-UA/2,0)),lower:g(()=>CY(.05,.042,LA),M4(0,-LA/2,0)),hand:g(()=>BX(.07,.09,.09),M4(0,-.03-LA,0)),thigh:g(()=>CY(.085,.07,TH),M4(0,-TH/2,0)),shin:g(()=>CY(.068,.055,SH),M4(0,-SH/2,0)),
 shoe:g(()=>BX(.11,.09,.26),M4(0,-SH-.045,.05)),skirt:g(()=>CY(.17,.24,.4,10),M4(0,-.12,0)),shoulderPad:g(()=>BX(.14,.08,.16),M4(0,.02,0))};
const SETS={};
// look: {top, jacket?, tie?, vest?, pants, shoes, skin, hat:'hair'|'cap'|'helmet'|null, hatCol, badge, band}
function rigSet(look){const k=JSON.stringify(look);if(SETS[k])return SETS[k];const c=o=>C(o);
 const spine=[[GEO.torso,c(look.top)],[GEO.hips,c(look.pants)]];if(look.jacket){spine.push([GEO.jacket,c(look.jacket)],[GEO.lapel,c(look.top)]);if(look.tie)spine.push([GEO.tie,c(look.tie)]);}
 if(look.vest){spine.push([GEO.vest,c(look.vest)]);for(const x of[-.12,0,.12])spine.push([GEO.pouch,c(look.vest),M4(x,0,0)]);}if(look.belt)spine.push([GEO.belt,c(look.belt)]);if(look.badge)spine.push([GEO.badge,c(0xd8b040)]);
 const neck=[[GEO.head,c(look.skin)],[GEO.neckC,c(look.skin)]];if(look.hat==='hair'){neck.push([GEO.hair,c(look.hatCol)]);if(look.bun)neck.push([GEO.bun,c(look.hatCol)]);}if(look.hat==='cap')neck.push([GEO.cap,c(look.hatCol)],[GEO.brim,c(look.hatCol)]);
 if(look.hat==='helmet'){neck.push([GEO.helmet,c(look.hatCol)]);neck.push([look.face?GEO.faceplate:GEO.visor,c(look.face?0x22262a:0x0c0e12)]);}
 const sleeve=c(look.jacket||look.sleeve||look.top);const legC=c(look.pants);
 const S={spine:cmerge(spine),neck:cmerge(neck),upper:cmerge(look.pads?[[GEO.upper,sleeve],[GEO.shoulderPad,c(look.vest||look.top)]]:[[GEO.upper,sleeve]]),lower:cmerge([[GEO.lower,sleeve],[GEO.hand,c(look.glove||look.skin)]]),
  thigh:cmerge(look.skirt?[[GEO.thigh,c(look.skin)]]:[[GEO.thigh,legC]]),shin:cmerge([[GEO.shin,look.skirt?c(look.skin):legC],[GEO.shoe,c(look.shoes)]]),skirt:look.skirt?cmerge([[GEO.skirt,legC]]):null};
 SETS[k]=S;return S;}

/* ---------- looks ---------- */
const SKINS=[0xe0b090,0xb48468,0x7a5440,0xd8aa88,0x5c3c2c,0xf0c8a8];const HAIRS=[0x1a1410,0x3a2616,0x6a4a2a,0xb08850,0x8a8a8a,0x2a1a10,0xc06030];
const TOPS=[0xc8c4b8,0x8a2a2a,0x2a4a6a,0x3a5a3a,0xd8c8a0,0x6a4a7a,0xe8e6e0,0x1a1a22,0xb06a2a,0x4a6a8a];const PANTS=[0x2a2a30,0x3a3a44,0x5a4a3a,0x1a2030,0x6a6a6a,0x8a7a5a];
export const CREW=[{name:'VEGA',mask:0,suit:0x1a1c24,shirt:0xe8e6e0,tie:0xc0302a,skin:0xd8aa88},{name:'MAGPIE',mask:1,suit:0x2a2a2e,shirt:0x101014,tie:0xd0a040,skin:0x7a5440},
 {name:'SAINT',mask:2,suit:0xd8d4cc,shirt:0x222228,tie:0x6a0c18,skin:0xe0b090},{name:'DUCHESS',mask:3,suit:0x3a1a3a,shirt:0xf0e8e0,tie:0x101010,skin:0xb48468,skirt:false}];
export function look(type,i=0){const r=n=>Math.abs(Math.sin(i*12.9898+n*78.233)*43758.5453)%1;const pick=(a,n)=>a[(r(n)*a.length)|0];
 if(type==='crew'){const c=CREW[i%4];return{top:c.shirt,jacket:c.suit,tie:c.tie,pants:c.suit,shoes:0x0e0e10,skin:c.skin,hat:'hair',hatCol:0x1a1410,glove:0x141416};}
 if(type==='guard')return{top:0x8a9ab4,pants:0x1e2432,shoes:0x101010,skin:pick(SKINS,1),hat:'cap',hatCol:0x1e2432,badge:1,belt:0x101010,sleeve:0x8a9ab4};
 if(type==='staff'){const f=r(3)<.5;return{top:0xf0eee8,vest:null,jacket:f?0x2a2a3a:0x24324a,tie:f?null:0x6a1a20,pants:0x22242c,shoes:0x101010,skin:pick(SKINS,2),hat:'hair',hatCol:pick(HAIRS,4),bun:f,skirt:f};}
 if(type==='manager')return{top:0xf4f0e8,jacket:0x3a3a40,tie:0x2a4a8a,pants:0x3a3a40,shoes:0x2a1a10,skin:pick(SKINS,5),hat:'hair',hatCol:0x8a8a8a};
 if(type==='civ'){const f=r(6)<.5;return{top:pick(TOPS,7),jacket:r(8)<.35?pick([0x3a3a3a,0x5a4030,0x1a2a3a,0x8a7a6a],9):null,pants:pick(PANTS,10),shoes:pick([0x101010,0x3a2a1a,0xe0e0e0],11),skin:pick(SKINS,12),hat:'hair',hatCol:pick(HAIRS,13),bun:f,skirt:f&&r(14)<.5};}
 if(type==='cop')return{top:0x1c2a48,pants:0x141c30,shoes:0x080808,skin:pick(SKINS,15),hat:'cap',hatCol:0x101826,badge:1,belt:0x080808,vest:0x1a1e26};
 if(type==='swat')return{top:0x22262c,vest:0x14171c,pants:0x1e2228,shoes:0x080808,skin:pick(SKINS,16),hat:'helmet',hatCol:0x16181c,glove:0x0c0c0c,belt:0x0c0c0c,pads:1};
 if(type==='heavy')return{top:0x2a3026,vest:0x1e241c,pants:0x22281e,shoes:0x080808,skin:pick(SKINS,17),hat:'helmet',hatCol:0x1a2018,glove:0x0c0c0c,face:1,pads:1};
 if(type==='shield')return{top:0x22262c,vest:0x14171c,pants:0x1e2228,shoes:0x080808,skin:pick(SKINS,18),hat:'helmet',hatCol:0x16181c,glove:0x0c0c0c,pads:1};
 return look('civ',i);}

/* ---------- masks ---------- */
const MM={};function mm(k,o){return MM[k]||(MM[k]=charMat(new THREE.MeshStandardMaterial(o)));}
export function makeMask(id){const grp=new THREE.Group();const add=(geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{const m=new THREE.Mesh(geo,mat);m.position.set(x,y,z);m.rotation.set(rx,ry,rz);m.scale.set(sx,sy,sz);m.castShadow=true;grp.add(m);return m;};
 const eyeGlow=c=>mm('eye'+c,{color:0x000000,emissive:c,emissiveIntensity:3});
 if(id===0){// neon fox
  const fur=mm('fox',{color:0xe2581c,roughness:.45,metalness:.1}),wht=mm('foxw',{color:0xf2ece2,roughness:.5}),blk=mm('foxk',{color:0x111111,roughness:.4});
  add(SP(.118,16,12),fur,0,.11,.03,0,0,0,1,1,.95);add(new THREE.ConeGeometry(.07,.16,12),fur,0,.07,.16,Math.PI/2);add(SP(.022,8,6),blk,0,.07,.245);
  for(const s of[-1,1]){add(new THREE.ConeGeometry(.045,.12,4),fur,s*.075,.25,.0,0,0,-s*.25);add(SP(.05,10,8),wht,s*.055,.05,.1,0,0,0,1,.8,.8);add(BX(.045,.012,.01),eyeGlow(0x30e0ff),s*.045,.13,.118,0,0,s*.25);}}
 else if(id===1){// magpie: black lacquer, brass beak, white bands
  const blk=mm('mag',{color:0x0e0e12,roughness:.18,metalness:.3}),brs=mm('magb',{color:0xd8a640,roughness:.22,metalness:1}),wht=mm('magw',{color:0xe8e8ec,roughness:.3});
  add(SP(.118,16,12),blk,0,.11,.03);add(new THREE.ConeGeometry(.05,.24,10),brs,0,.07,.21,Math.PI/2+.25);for(const s of[-1,1]){add(new THREE.TorusGeometry(.03,.009,6,14),brs,s*.046,.13,.115);add(SP(.02,8,6),eyeGlow(0xffb040),s*.046,.13,.112);}add(BX(.24,.025,.2),wht,0,.2,.02);}
 else if(id===2){// saint: porcelain face, gold halo
  const por=mm('por',{color:0xf4f0ea,roughness:.12,metalness:.05}),gold=mm('halo',{color:0xffcc55,emissive:0xffaa20,emissiveIntensity:1.6,roughness:.2,metalness:1}),red=mm('tear',{color:0xa01020,roughness:.2});
  add(SP(.118,18,14),por,0,.11,.035,0,0,0,.95,1.08,.98);for(const s of[-1,1])add(new THREE.CircleGeometry(.022,12),mm('hole',{color:0x050505,roughness:1}),s*.044,.125,.141,0,s*.18,0);add(BX(.006,.04,.006),red,.044,.085,.14);
  const halo=add(new THREE.TorusGeometry(.13,.01,8,32),gold,0,.32,-.06,Math.PI/2-.35);halo.castShadow=false;}
 else{// duchess: gold filigree half mask + violet plume
  const gold=mm('duch',{color:0xe0b050,roughness:.2,metalness:1}),vio=mm('plume',{color:0x6a2a9a,roughness:.7,emissive:0x200030}),lip=mm('lip',{color:0x8a1020,roughness:.4});
  add(SP(.116,16,12),mm('dskin',{color:0xb48468,roughness:.6}),0,.11,.01);add(new THREE.SphereGeometry(.122,16,8,0,Math.PI*2,Math.PI*.18,Math.PI*.3),gold,0,.11,.025);for(const s of[-1,1])add(SP(.018,8,6),eyeGlow(0xc060ff),s*.044,.13,.118);
  for(let i=0;i<3;i++)add(new THREE.ConeGeometry(.025,.22,6),vio,.1,.26+i*.02,-.02-i*.03,-.3-i*.2,0,-.5);add(BX(.05,.012,.01),lip,0,.05,.115);}
 return grp;}

/* ---------- IK + rig ---------- */
const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole){_d.subVectors(T,S);let d=_d.length();d=Math.min(d,UA+LA-.005);_d.normalize();const x=(UA*UA-LA*LA+d*d)/(2*d),h=Math.sqrt(Math.max(0,UA*UA-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}
const GUNM=new THREE.MeshStandardMaterial({color:0x1a1b1e,roughness:.45,metalness:.7});
const GUNS={rifle:cmerge([[BX(.06,.1,.5),C(0x1a1b1e),M4(0,0,.1)],[CY(.016,.016,.34),C(0x111111),M4(0,.02,.5,Math.PI/2)],[BX(.045,.16,.07),C(0x1a1b1e),M4(0,-.11,.13,.25)],[BX(.05,.09,.22),C(0x2a2622),M4(0,-.01,-.22)]]),
 smg:cmerge([[BX(.06,.1,.36),C(0x1a1b1e),M4(0,0,.06)],[CY(.016,.016,.16),C(0x111111),M4(0,.02,.3,Math.PI/2)],[BX(.04,.18,.05),C(0x1a1b1e),M4(0,-.12,.1)]]),
 shotgun:cmerge([[BX(.06,.09,.5),C(0x1a1b1e),M4(0,0,.1)],[CY(.022,.022,.4),C(0x111111),M4(0,.02,.5,Math.PI/2)],[BX(.05,.1,.24),C(0x4a3020),M4(0,-.02,-.24)]]),
 pistol:cmerge([[BX(.04,.06,.2),C(0x1a1b1e),M4(0,0,.06)],[BX(.035,.11,.05),C(0x1a1b1e),M4(0,-.07,0,.2)],[CY(.018,.018,.14,8),C(0x0a0a0a),M4(0,.005,.22,Math.PI/2)]]),
 none:null,phone:cmerge([[BX(.04,.08,.012),C(0x101014),M4()]]),drill:null};
const BAGGEO=cmerge([[CY(.17,.17,.62,12),C(0x2a2c30),M4(0,0,0,0,0,Math.PI/2)],[BX(.5,.04,.3),C(0x1a1a1c),M4(0,.15,0)],[BX(.04,.3,.04),C(0x111111),M4(.12,.25,0)],[BX(.04,.3,.04),C(0x111111),M4(-.12,.25,0)]]);
const blobGeo=(()=>{const q=new THREE.CircleGeometry(.42,16);q.rotateX(-Math.PI/2);return q;})();const SHADOW=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.36,depthWrite:false});
const SHIELDM=new THREE.MeshStandardMaterial({color:0x1a1c20,roughness:.4,metalness:.6}),SHIELDW=new THREE.MeshStandardMaterial({color:0x182838,roughness:.05,metalness:.3,transparent:true,opacity:.6});
export class Rig{
 constructor(type,i=0,o={}){this.type=type;this.root=new THREE.Group();const S=rigSet(o.look||look(type,i));const mk=(geo,m,p,x=0,y=0,z=0)=>{const q=new THREE.Mesh(geo,m);q.position.set(x,y,z);q.castShadow=true;p.add(q);return q;};
  const sc=type==='heavy'?1.12:1;this.root.scale.setScalar(sc);
  this.hips=new THREE.Group();this.hips.position.y=.95;this.root.add(this.hips);
  this.spine=new THREE.Group();this.spine.position.y=.05;this.hips.add(this.spine);mk(S.spine,RIGMAT,this.spine);if(S.skirt)mk(S.skirt,RIGMAT,this.hips);
  this.neck=new THREE.Group();this.neck.position.set(0,.55,0);this.spine.add(this.neck);this.headM=mk(S.neck,RIGMAT,this.neck);
  this.mask=null;if(type==='crew'){this.mask=makeMask(CREW[i%4].mask);this.neck.add(this.mask);}
  this.arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.23,.47,0);this.spine.add(sh);const up=new THREE.Group();sh.add(up);mk(S.upper,RIGMAT,up);const lo=new THREE.Group();lo.position.y=-UA;up.add(lo);mk(S.lower,RIGMAT,lo);this.arms.push({sh,up,lo,s});}
  this.legs=[];for(const s of[-1,1]){const th=new THREE.Group();th.position.set(s*.11,0,0);this.hips.add(th);mk(S.thigh,RIGMAT,th);const kn=new THREE.Group();kn.position.y=-TH;th.add(kn);mk(S.shin,RIGMAT,kn);this.legs.push({th,kn});}
  this.gun=new THREE.Group();this.gun.position.set(-.1,.36,.2);this.spine.add(this.gun);this.gunMeshes={};for(const k in GUNS){if(!GUNS[k])continue;const m=new THREE.Mesh(GUNS[k],RIGMAT);m.castShadow=true;m.visible=false;this.gun.add(m);this.gunMeshes[k]=m;}
  this.muzzle=new THREE.Object3D();this.gun.add(this.muzzle);
  this.bag=new THREE.Mesh(BAGGEO,RIGMAT);this.bag.position.set(0,.3,-.25);this.bag.rotation.z=.15;this.bag.visible=false;this.spine.add(this.bag);
  this.shield=null;if(type==='shield'){const sg=new THREE.Group();const p=new THREE.Mesh(BX(.62,1.15,.06),SHIELDM);sg.add(p);const w=new THREE.Mesh(BX(.36,.12,.07),SHIELDW);w.position.set(0,.36,0);sg.add(w);
   const t=new THREE.Mesh(BX(.5,.07,.065),new THREE.MeshStandardMaterial({color:0xe8e8e8,roughness:.6}));t.position.set(0,.15,.002);sg.add(t);sg.position.set(-.05,.12,.42);this.spine.add(sg);this.shield=sg;}
  this.blob=new THREE.Mesh(blobGeo,SHADOW);this.blob.renderOrder=1;this.blob.position.y=.02;this.root.add(this.blob);
  this.phase=Math.random()*6;this.die=0;this.dieDir=1;this.flinch=0;this._s=new V();this._t=new V();this._pole=new V();this.cls='none';this.pose='stand';this.pv=0;this.setGun(o.gun||'none');}
 setMask(on){if(this.mask)this.mask.visible=on;}
 setGun(cls){if(this.cls===cls&&this._set)return;this._set=true;this.cls=cls;for(const k in this.gunMeshes)this.gunMeshes[k].visible=k===cls;const L={rifle:.62,smg:.42,shotgun:.66,pistol:.32,phone:0}[cls]||.4;this.muzzle.position.set(0,.02,L);
  const one=cls==='pistol'||cls==='phone'||cls==='none';this.gun.position.set(one?-.02:-.1,one?.34:.36,one?.36:.2);if(this.shield)this.gun.position.set(.12,.34,.4);this.poseArms(0);}
 poseArms(reload,pose){const gp=this.gun.position,one=this.cls==='pistol'||this.cls==='phone';pose=pose||this.pose;
  for(const a of this.arms){const S=this._s.copy(a.sh.position);const T=this._t;
   if(pose==='hands'||pose==='cower'){T.set(a.s*.12,.72,.05);}
   else if(pose==='tied'){T.set(a.s*.06,.1,-.2);}
   else if(pose==='panic'){T.set(a.s*.32,.62+Math.sin(this.phase*2+a.s)*.08,.2);}
   else if(this.cls==='none'){T.set(a.s*.2,.05,.05+Math.sin(this.phase+(a.s>0?0:Math.PI))*.12*Math.min(1,this.spd||0));}
   else if(this.cls==='phone'){if(a.s<0)T.set(-.1,.58,.08);else T.set(.2,.05,.05);}
   else if(this.shield&&a.s<0)T.set(-.05,.25,.36);
   else if(one){if(a.s<0)T.set(gp.x-.02,gp.y-.06,gp.z-.02);else T.set(gp.x+.05,gp.y-.08,gp.z-.04);}
   else if(a.s<0)T.set(gp.x,gp.y-.07,gp.z+.02);else if(reload>0)T.set(gp.x+.02,gp.y-.2,gp.z+.1+Math.sin(reload*9)*.04);else T.set(gp.x+.01,gp.y-.03,gp.z+.27);
   ik(a.up,a.lo,S,T,this._pole.set(a.s*.9,-.6,-.2));}}
 // st: {speed, crouch, pitch, dead, reload, pose:'stand'|'cower'|'tied'|'down'|'sit'|'hands'|'panic', bag}
 update(dt,st){const r=this.root;this.bag.visible=!!st.bag;this.spd=st.speed;
  if(st.dead){this.die=Math.min(1,this.die+dt*2.4);const e=1-Math.pow(1-this.die,3);r.rotation.x=-e*1.5*this.dieDir;this.hips.position.y=.95-e*.68;this.spine.rotation.x=e*.25;for(const l of this.legs){l.th.rotation.x=-e*.4;l.kn.rotation.x=e*.8;}this.arms[0].up.rotation.z=-e*.6;this.blob.visible=false;if(this.shield)this.shield.visible=e<.5;return;}
  this.die=0;r.rotation.x=0;r.rotation.z=0;this.blob.visible=true;if(this.shield)this.shield.visible=true;const pose=st.pose||'stand';const sp=st.speed;
  if(pose!==this.pose){this.pose=pose;this.poseArms(0);}
  if(pose==='down'){// sitting on the floor, leaning back, sidearm up
   this.hips.position.y+=(.22-this.hips.position.y)*Math.min(1,dt*8);this.spine.rotation.x+=(-.35-this.spine.rotation.x)*Math.min(1,dt*8);for(const[i,l]of this.legs.entries()){l.th.rotation.x+=(-1.45-l.th.rotation.x)*Math.min(1,dt*8);l.kn.rotation.x+=((i?.3:.9)-l.kn.rotation.x)*Math.min(1,dt*8);}this.neck.rotation.x=st.pitch*.3+.2;this.poseArms(0);return;}
  if(pose==='tied'||pose==='cower'||pose==='sit'){const sit=pose==='sit';const hy=sit?.52:.45;this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*8);
   for(const[i,l]of this.legs.entries()){const th=sit?-1.5:(i?-.15:-.2),kn=sit?1.5:2.3;l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*8);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*8);}
   this.spine.rotation.x+=((pose==='cower'?.45:sit?.05:.12)-this.spine.rotation.x)*Math.min(1,dt*8);this.neck.rotation.x=pose==='cower'?.4:0;this.poseArms(0);return;}
  const cr=st.crouch;this.phase+=dt*(sp>.2?(2.6+sp*1.25):0);const amp=Math.min(1,sp/3.5)*(sp>4?.7:.5),ph=this.phase;
  const hy=.95-cr*.38+(sp>.3?Math.abs(Math.sin(ph))*.035:0);this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*12);
  this.legs.forEach((l,i)=>{const p=ph+i*Math.PI;let th=Math.sin(p)*amp,kn=Math.max(0,Math.sin(p+1.2))*amp*1.4+.05;th=th*(1-cr)+(-1.15+Math.sin(p)*amp*.4)*cr;kn=kn*(1-cr)+(1.55+Math.max(0,Math.sin(p+1.2))*.3)*cr;if(cr>.5&&i===0){th=-1.25;kn=1.6;}if(cr>.5&&i===1&&sp<.3){th=-.4;kn=2.3;}
   l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*14);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*14);});
  this.flinch=Math.max(0,this.flinch-dt*4);const lean=(sp>4.5?.12:sp>.3?.05:0)+cr*.1+(st.bag?.12:0);
  this.spine.rotation.x+=((-st.pitch*.75+lean+this.flinch*.35)-this.spine.rotation.x)*Math.min(1,dt*10);this.spine.rotation.y=Math.sin(ph)*amp*.07;this.neck.rotation.x=-st.pitch*.25-lean*.6;
  if(st.reload>0||this._rl||this.cls==='none'||pose==='panic'||pose==='hands'){this.poseArms(st.reload,pose);this._rl=st.reload>0;}}}

// ray vs character volumes; returns {t, part} or null. Parts: head chest stomach legs
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,sc=a.scale||1,top=(1.5-cr*.6)*sc,hy=(1.67-cr*.68)*sc;
 let best=null;{const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.15*.15*sc,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 const rr=.27*sc;const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,Cc=fx*fx+fz*fz-rr*rr,D=B*B-A*Cc;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<(.86-cr*.45)*sc?'legs':y<(1.1-cr*.55)*sc?'stomach':'chest'};}}
 return best;}
