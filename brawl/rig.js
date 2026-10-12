// PLATFORM BRAWL — procedural fighter rigs: chunky toon proportions, ink outlines, expressive faces, pose library, squash & stretch, limb smears.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const lerp=(a,b,k)=>a+(b-a)*k;

/* ---------- pose library (radians). sh = shoulder swing fwd, ab = arm out, el = elbow, hp = hip swing fwd, kn = knee, lean, twist, head, y = hip drop ---------- */
const P0={y:0,lean:0,twist:0,head:0,shL:0,shR:0,abL:.12,abR:.12,elL:.25,elR:.25,hpL:0,hpR:0,knL:.08,knR:.08,yaw:0};
const mk=o=>({...P0,...o});
export const POSES={
 idle:mk({y:-.06,lean:.12,shL:.35,shR:-.05,abL:.18,abR:.22,elL:1.3,elR:1.0,hpL:.28,hpR:-.22,knL:.42,knR:.3,twist:-.18}),
 crouch:mk({y:-.5,lean:.45,shL:.7,shR:.5,elL:1.4,elR:1.3,hpL:1.35,knL:2.2,hpR:.9,knR:2.0,abL:.25,abR:.25}),
 jumpUp:mk({lean:.05,hpL:1.0,knL:1.5,hpR:-.15,knR:.5,shL:-.35,shR:-.35,abL:.7,abR:.7,elL:.5,elR:.5,head:-.15}),
 fall:mk({lean:-.05,hpL:.45,knL:.75,hpR:.15,knR:.6,abL:1.0,abR:1.0,shL:.5,shR:.3,elL:.4,elR:.4}),
 shield:mk({y:-.2,lean:.2,shL:1.0,shR:.9,elL:1.8,elR:1.8,abL:.05,abR:.05,hpL:.45,knL:.7,hpR:-.25,knR:.45}),
 hurt:mk({lean:-.45,head:-.45,shL:-.7,shR:-.9,abL:1.25,abR:1.15,elL:.25,elR:.3,hpL:.55,knL:.7,hpR:-.35,knR:.25}),
 tumble:mk({lean:.3,abL:1.5,abR:1.4,shL:1.4,shR:-.6,elL:.3,elR:.2,hpL:1.1,knL:.6,hpR:-.6,knR:.9,head:.3}),
 down:mk({lean:-.2,abL:1.2,abR:1.0,shL:.2,shR:.4,elL:.4,elR:.3,hpL:.2,knL:.5,hpR:.05,knR:.2}),
 ledge:mk({lean:.15,shL:2.95,shR:2.95,abL:-.05,abR:-.05,elL:.15,elR:.15,hpL:.35,knL:.55,hpR:-.05,knR:.45,head:-.3}),
 climb:mk({y:-.3,lean:.7,hpL:1.5,knL:2.0,hpR:.4,knR:1.0,shL:1.2,shR:1.2,elL:.4,elR:.4}),
 dizzy:mk({lean:-.1,head:.35,shL:2.4,shR:2.4,abL:.6,abR:.6,elL:2.3,elR:2.3,hpL:.1,knL:.3,hpR:-.1,knR:.25}),
 hold:mk({lean:.25,shL:1.35,shR:1.35,elL:.7,elR:.7,abL:-.12,abR:-.12,hpL:.4,knL:.4,hpR:-.2,knR:.2}),
 helpless:mk({lean:.1,head:.2,abL:1.3,abR:1.3,shL:.9,shR:.9,elL:.6,elR:.6,hpL:.6,knL:1.1,hpR:.3,knR:1.0}),
 win:mk({lean:-.15,head:-.25,shL:3.0,shR:.4,abL:.35,abR:.4,elL:.1,elR:1.6,hpL:.1,knL:.1,hpR:-.15,knR:.15}),
 win2:mk({y:-.12,lean:.2,shL:1.6,shR:1.6,abL:.7,abR:.7,elL:1.9,elR:1.9,hpL:.6,knL:.7,hpR:-.4,knR:.5}),
 lose:mk({lean:.35,head:.5,shL:.1,shR:.1,abL:.1,abR:.1,elL:.1,elR:.1,hpL:.05,knL:.1,hpR:-.05,knR:.1}),
 jabW:mk({twist:-.4,shR:.3,elR:1.9,shL:.6,elL:1.4,hpL:.3,knL:.4,hpR:-.25,knR:.3}),
 jab:mk({twist:.35,lean:.2,shR:1.55,elR:.05,shL:.2,elL:1.6,hpL:.45,knL:.4,hpR:-.35,knR:.25}),
 punchW:mk({twist:-.65,lean:.05,shR:-.4,elR:2.1,shL:.8,elL:1.2,hpL:.35,knL:.35,hpR:-.35,knR:.25}),
 punch:mk({twist:.55,lean:.3,shL:1.55,elL:0,shR:-.4,elR:1.4,hpL:.7,knL:.45,hpR:-.5,knR:.1}),
 dashHit:mk({twist:.4,lean:.65,shR:1.6,elR:0,shL:-.8,elL:.6,hpL:1.0,knL:.7,hpR:-.8,knR:.3,y:-.15}),
 shoulder:mk({twist:-.8,lean:.6,shL:.2,shR:-.3,elL:2.0,elR:2.0,abL:.3,hpL:.9,knL:.7,hpR:-.7,knR:.2,y:-.2}),
 slash:mk({twist:.9,lean:.5,shR:2.0,abR:.7,elR:.1,shL:-.6,hpL:.9,knL:.8,hpR:-.6,knR:.3,y:-.25}),
 kickW:mk({lean:-.1,hpR:1.0,knR:2.1,shL:.6,shR:-.4,abL:.6,abR:.6,elL:.8,elR:.8,knL:.3}),
 kick:mk({lean:-.4,hpR:1.65,knR:0,shL:-.5,shR:.7,abL:.8,abR:.8,elL:.6,elR:.6,hpL:-.1,knL:.25}),
 dropkick:mk({lean:-.9,hpR:1.6,knR:0,hpL:1.5,knL:.1,shL:-.6,shR:-.6,abL:.9,abR:.9}),
 uppW:mk({y:-.3,lean:.4,shR:-.6,elR:1.9,knL:1.0,knR:1.0,hpL:.7,hpR:.5,shL:.5,elL:1.3}),
 upp:mk({y:.08,lean:-.25,shR:2.95,elR:.25,abR:.15,shL:-.5,elL:1,hpL:.15,knL:.2,hpR:-.35,knR:.15,head:-.35}),
 sweepLow:mk({y:-.55,lean:.5,hpR:1.55,knR:0,hpL:1.4,knL:2.2,shL:.9,shR:.3,abL:.4,abR:.9,elL:1,elR:.5}),
 dtiltPose:mk({y:-.5,lean:.55,shR:1.2,elR:.2,shL:.7,elL:1.2,hpL:1.4,knL:2.2,hpR:.9,knR:1.9}),
 smashW:mk({twist:-1.0,lean:-.2,shR:-1.0,elR:1.3,shL:.5,abR:.5,elL:1,hpL:.6,knL:.7,hpR:-.45,knR:.35,y:-.12}),
 smash:mk({twist:.75,lean:.5,shR:1.65,elR:.05,shL:1.45,elL:.15,hpL:1.0,knL:.55,hpR:-.75,knR:.12,y:-.18}),
 slam:mk({twist:.2,lean:.75,shR:1.0,elR:0,shL:1.0,elL:0,hpL:.9,knL:.8,hpR:-.5,knR:.3,y:-.3}),
 usmW:mk({y:-.45,lean:.5,shL:.3,shR:.3,elL:1.9,elR:1.9,knL:1.7,knR:1.7,hpL:1.05,hpR:1.05}),
 usm:mk({y:.15,lean:-.3,shL:3.05,shR:3.05,abL:.22,abR:.22,elL:.1,elR:.1,head:-.45,hpL:.1,hpR:-.15}),
 dsmW:mk({y:-.3,shL:.4,shR:.4,abL:1.4,abR:1.4,elL:.7,elR:.7,knL:1.2,knR:1.2,hpL:.8,hpR:.8}),
 dsm:mk({y:-.6,lean:.3,abL:1.6,abR:1.6,shL:.15,shR:.15,elL:0,elR:0,hpL:1.5,knL:2.2,hpR:-.7,knR:.1}),
 nairW:mk({hpL:.9,knL:1.6,hpR:.9,knR:1.6,shL:.5,shR:.5,elL:1.5,elR:1.5}),
 nair:mk({abL:1.35,abR:1.35,elL:.15,elR:.15,shL:.2,shR:.2,hpL:1.1,knL:.15,hpR:-.85,knR:.2}),
 fairW:mk({lean:-.25,shL:2.9,shR:2.9,elL:.5,elR:.5,hpL:.4,knL:1.2,hpR:.2,knR:1}),
 fair:mk({lean:.45,shL:1.0,shR:1.0,elL:.1,elR:.1,hpL:.8,knL:1.1,hpR:-.2,knR:.6}),
 bairW:mk({lean:.2,hpL:.6,knL:1.8,hpR:.5,knR:1.4,shL:.6,shR:.6,twist:-.3}),
 bair:mk({lean:.55,hpL:-1.45,knL:.05,hpR:.6,knR:1.4,shL:.6,shR:.5,twist:.45,head:-.2}),
 uairW:mk({hpL:.5,knL:1.4,hpR:.6,knR:1.6,shL:-.2,shR:-.2,abL:.6,abR:.6}),
 uair:mk({lean:-.6,hpR:2.7,knR:.1,hpL:.3,knL:1.3,shL:-.7,shR:-.7,abL:.9,abR:.9,elL:.3,elR:.3}),
 dairW:mk({hpL:1.2,knL:2.2,hpR:1.2,knR:2.2,shL:2.4,shR:2.4,elL:.3,elR:.3}),
 dair:mk({lean:.1,hpL:-.1,knL:0,hpR:.15,knR:0,shL:2.7,shR:2.7,abL:.4,abR:.4,elL:.1,elR:.1}),
 grabW:mk({lean:.1,shL:.5,shR:.5,elL:1.6,elR:1.6,hpL:.3,knL:.4}),
 grab:mk({lean:.35,shL:1.55,shR:1.55,elL:.15,elR:.15,abL:-.15,abR:-.15,hpL:.6,knL:.5,hpR:-.3,knR:.2}),
 throwF:mk({twist:.9,lean:.45,shL:1.9,shR:1.9,elL:.1,elR:.1,hpL:.7,knL:.4,hpR:-.4}),
 throwB:mk({twist:-1.2,lean:-.4,shL:2.5,shR:2.5,elL:.2,elR:.2,hpL:.2,hpR:-.5,knR:.4}),
 throwU:mk({lean:-.25,shL:3.05,shR:3.05,abL:.2,abR:.2,elL:.1,elR:.1,head:-.4,hpL:.2,knL:.3}),
 throwD:mk({y:-.35,lean:.7,shL:.5,shR:.5,elL:.2,elR:.2,hpL:1.1,knL:1.4,hpR:-.3,knR:.6}),
 castW:mk({twist:-.5,shR:-.2,elR:1.9,shL:-.2,elL:1.9,lean:-.1,hpL:.3,knL:.4,hpR:-.2}),
 cast:mk({twist:.15,shR:1.55,elR:.1,shL:1.4,elL:.25,abL:-.1,abR:-.1,lean:.2,hpL:.45,knL:.4,hpR:-.35,knR:.2}),
 throwStar:mk({twist:.7,lean:.3,shR:1.4,abR:.9,elR:.1,shL:-.3,elL:1.2,hpL:.5,knL:.4,hpR:-.4}),
 breath:mk({lean:.35,head:-.2,shL:1.2,shR:1.2,abL:.5,abR:.5,elL:1.4,elR:1.4,hpL:.6,knL:.6,hpR:-.4,knR:.3}),
 riseW:mk({y:-.4,knL:1.4,knR:1.4,hpL:.85,hpR:.85,shR:.3,shL:.3,elL:1.2,elR:1.2,lean:.3}),
 rise:mk({shR:3.0,elR:.1,shL:-.4,elL:.6,hpL:.7,knL:1.3,hpR:-.25,knR:.3,lean:-.15,head:-.3}),
 float:mk({shR:2.4,shL:2.4,abL:.6,abR:.6,elL:.2,elR:.2,hpL:.3,knL:.6,hpR:.1,knR:.5,lean:-.1}),
 jet:mk({lean:.1,shL:.5,shR:.5,abL:.9,abR:.9,elL:.4,elR:.4,hpL:.2,knL:.5,hpR:0,knR:.4}),
 spinW:mk({twist:-.6,abL:1.2,abR:1.2,shL:.3,shR:.3,elL:.4,elR:.4,hpL:.4,knL:.5}),
 spin:mk({abL:1.55,abR:1.55,shL:.25,shR:.25,elL:0,elR:0,hpL:.25,knL:.3,hpR:-.15,knR:.2,lean:.1}),
 lariat:mk({abL:1.5,abR:1.5,shL:.0,shR:.0,elL:0,elR:0,hpL:.45,knL:.6,hpR:-.3,knR:.3,lean:.2,y:-.1}),
 pound:mk({y:0,lean:.3,hpL:1.4,knL:2.3,hpR:1.4,knR:2.3,shL:2.6,shR:2.6,abL:.3,abR:.3,elL:.4,elR:.4}),
 counterW:mk({twist:-.3,shL:.9,shR:.5,elL:1.7,elR:2.0,lean:-.15,hpL:.4,knL:.5}),
 counter:mk({twist:-.5,shL:1.6,shR:.2,abL:.3,elL:.2,elR:1.8,lean:-.2,hpL:.5,knL:.5,hpR:-.3,knR:.3}),
 reflect:mk({abL:1.5,abR:1.5,shL:1.0,shR:1.0,elL:.2,elR:.2,lean:.05,hpL:.3,knL:.4}),
};

/* ---------- materials: one vertex-coloured toon-ish material per fighter + an ink hull ---------- */
// Every body part is baked into one mesh per bone (vertex colour + per-vertex emissive), so a fighter is ~24 draw calls
// with a dark inverted-hull outline that keeps the silhouette readable on any backdrop.
const ZERO=new THREE.Color(0,0,0);
function rigMat(U,rough,metal){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:metal,envMapIntensity:.85});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 emi;varying vec3 vEmi;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEmi=emi;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEmi;uniform vec3 uRimC,uFlC;uniform float uRimS,uFl,uGlow,uAmb;')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.4);totalEmissiveRadiance+=vEmi*uGlow+diffuseColor.rgb*uAmb+uRimC*fr*uRimS+uFlC*uFl*(.5+fr);}');};
 m.customProgramCacheKey=()=>'brawlrig2';return m;}
function inkMat(U){const m=new THREE.MeshBasicMaterial({color:0x100e1a,side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.uniforms.uInk=U.uInk;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uInk;').replace('#include <begin_vertex>','vec3 transformed=position+normal*uInk;');};
 m.customProgramCacheKey=()=>'brawlink';return m;}
function paint(g,c,e){g=g.index?g.toNonIndexed():g;const n=g.attributes.position.count,ca=new Float32Array(n*3),ea=new Float32Array(n*3);e=e||ZERO;
 for(let i=0;i<n;i++){ca[i*3]=c.r;ca[i*3+1]=c.g;ca[i*3+2]=c.b;ea[i*3]=e.r;ea[i*3+1]=e.g;ea[i*3+2]=e.b;}g.setAttribute('color',new THREE.BufferAttribute(ca,3));g.setAttribute('emi',new THREE.BufferAttribute(ea,3));return g;}
function bake(group,mat,ink,shadow=true){const parts=group.children.filter(o=>o.isMesh&&o.userData.c&&!o.userData.keep);if(!parts.length)return null;
 const P=[],N=[],Cc=[],E=[];
 for(const m of parts){m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);const p=g.attributes.position,n=g.attributes.normal,c=m.userData.c,e=m.userData.e;
  for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));Cc.push(c.r,c.g,c.b);E.push(e.r,e.g,e.b);}g.dispose();m.geometry.dispose();group.remove(m);}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));G.setAttribute('emi',new THREE.Float32BufferAttribute(E,3));G.computeBoundingSphere();
 const mesh=new THREE.Mesh(G,mat);mesh.castShadow=shadow;mesh.receiveShadow=false;group.add(mesh);if(ink){const o=new THREE.Mesh(G,ink);o.userData.ink=1;group.add(o);}return mesh;}
// move the meshes of a helper sub-group into its parent (so they bake with the bone)
function flatten(parent,sub){sub.updateMatrix();for(const c of[...sub.children]){c.applyMatrix4(sub.matrix);parent.add(c);}parent.remove(sub);}

/* ---------- rig ---------- */
export function makeRig(def,alt=0){const L=def.look,K=alt?{...L,...L.alt}:L,H=def.Hh,build=L.build;
 const heavy=build==='heavy',slim=build==='slim',robot=build==='robot',robe=build==='robe';
 const C=c=>new THREE.Color(c);
 const col={suit:C(K.suit),trim:C(K.trim),skin:C(K.skin),glow:C(K.glow),hair:C(K.hairC??K.suit),glove:C(K.glove??K.trim),boot:C(K.boot??K.trim),white:C(0xf6f7ff),pupil:C(0x15121e)};
 const GL=col.glow.clone().multiplyScalar(1.5),GD=col.glow.clone().multiplyScalar(.35);
 const U={uRimC:{value:col.glow.clone().lerp(C(0xffffff),.55)},uRimS:{value:.42},uFl:{value:0},uFlC:{value:C(0xffffff)},uGlow:{value:1},uAmb:{value:.22},uInk:{value:H*.017}};
 const mat=rigMat(U,robot?.36:.58,robot?.35:.03),ink=inkMat(U);
 const p=(par,g,c,x=0,y=0,z=0,e=null)=>{const m=new THREE.Mesh(g);m.position.set(x,y,z);m.userData.c=c;m.userData.e=e||ZERO;par.add(m);return m;};
 const gp=(par,g,x,y,z)=>p(par,g,GD,x,y,z,GL);
 const solo=(par,g,c,e,x=0,y=0,z=0)=>{const m=new THREE.Mesh(paint(g,c,e),mat);m.position.set(x,y,z);m.userData.keep=1;par.add(m);return m;};
 const cap=(r,l,s=12)=>new THREE.CapsuleGeometry(r,Math.max(.001,l),4,s),sph=(r,a=14,b=10)=>new THREE.SphereGeometry(r,a,b);

 const root=new THREE.Group(),yawG=new THREE.Group(),body=new THREE.Group(),pitchG=new THREE.Group(),inner=new THREE.Group();root.add(yawG);yawG.add(body);body.add(pitchG);pitchG.add(inner);
 const cy=H*.5;pitchG.position.y=cy;inner.position.y=-cy;
 const leg=H*.4,thigh=leg*.5,shin=leg*.5,torsoL=H*.26,hr=H*(robot?.125:.135),upA=H*.165,foA=H*.155;
 const lr=H*(heavy?.074:slim?.047:.057),ar=H*(heavy?.068:slim?.041:.051),tw=H*(heavy?.2:slim?.125:.152),hipW=tw*.56;
 const hips=new THREE.Group();hips.position.y=leg;inner.add(hips);
 p(hips,sph(tw*.88).scale(1,.62,.8),col.trim);
 const torso=new THREE.Group();hips.add(torso);
 // chest + belly + emblem + collar
 if(robot){p(torso,new THREE.BoxGeometry(tw*2.1,torsoL*1.05,tw*1.45),col.suit,0,torsoL*.55,0);gp(torso,new THREE.BoxGeometry(tw*1.25,torsoL*.36,.05),0,torsoL*.64,tw*.73);
  p(torso,new THREE.BoxGeometry(tw*1.7,torsoL*.18,tw*1.2),col.trim,0,torsoL*.02,0);}
 else{p(torso,cap(tw,torsoL*.55,16).scale(1,1,heavy?.86:.74),col.suit,0,torsoL*.55,0);
  if(heavy)for(const s of[-1,1])p(torso,sph(tw*.52).scale(1,.8,.6),col.suit,s*tw*.42,torsoL*.72,tw*.36);
  gp(torso,new THREE.CylinderGeometry(tw*.3,tw*.3,.04,18).rotateX(Math.PI/2),0,torsoL*.62,tw*(heavy?.86:.74)+.01);
  p(torso,new THREE.TorusGeometry(tw*.62,tw*.13,8,20).rotateX(Math.PI/2),col.trim,0,torsoL*1.0,0);}
 gp(torso,new THREE.TorusGeometry(tw*.95,H*.014,6,26).rotateX(Math.PI/2).scale(1,1,heavy?.86:.76),0,torsoL*.1,0);
 if(L.belt){p(torso,new THREE.TorusGeometry(tw*1.0,H*.034,8,26).rotateX(Math.PI/2).scale(1,1,.86),C(0xe0b030),0,torsoL*.12,0);p(torso,new THREE.BoxGeometry(tw*.6,H*.07,.06),C(0xffd860),0,torsoL*.12,tw*.88);}
 const neck=new THREE.Group();neck.position.y=torsoL*1.02;torso.add(neck);
 const head=new THREE.Group();head.position.y=hr*.92;neck.add(head);
 const fx={flames:null,orb:null,scarfAnchor:null,tipObj:null,nozzles:[],trident:null};
 const face={eyes:null,brows:[],mouth:null,kind:robot?'visor':L.hair==='mask'?'mask':'face',blink:2+Math.random()*2,ey:1,bw:0,mo:.6};
 if(robot){p(head,new THREE.BoxGeometry(hr*2.05,hr*1.8,hr*1.95),col.suit);p(head,new THREE.BoxGeometry(hr*1.75,hr*1.0,.06),C(0x0c1418),0,hr*.05,hr*.98);
  for(const s of[-1,1])p(head,new THREE.CylinderGeometry(hr*.32,hr*.32,hr*.25,12).rotateZ(Math.PI/2),col.trim,s*hr*1.08,0,0);
  const eg=new THREE.Group();eg.position.set(0,hr*.1,hr*1.02);head.add(eg);const g=new THREE.BoxGeometry(hr*.42,hr*.32,.04);solo(eg,g.clone().translate(-hr*.42,0,0),GD,GL.clone().multiplyScalar(1.4));solo(eg,g.translate(hr*.42,0,0),GD,GL.clone().multiplyScalar(1.4));face.eyes=eg;}
 else{const mask=L.hair==='mask';p(head,sph(hr,20,14),mask?col.suit:col.skin);
  if(mask){p(head,new THREE.SphereGeometry(hr*1.04,20,10,0,Math.PI*2,Math.PI*.56,Math.PI*.44),col.trim);gp(head,new THREE.TorusGeometry(hr*.98,hr*.12,8,20).rotateX(Math.PI/2),0,hr*.42,0);}
  // eyes: whites + pupils (or glowing slits for the mask) in one blinkable group
  const eg=new THREE.Group();eg.position.set(0,hr*.1,0);head.add(eg);
  for(const s of[-1,1]){if(mask){const sl=solo(eg,sph(hr*.24,12,8).scale(1.2,.55,.4),C(0xffffff),GL.clone().multiplyScalar(1.6),s*hr*.36,0,hr*.86);sl.rotation.y=s*.42;}
   else{const w=solo(eg,sph(hr*.27,14,10).scale(.82,1.12,.5),col.white,col.white.clone().multiplyScalar(.12),s*hr*.36,0,hr*.84);w.rotation.y=s*.42;
    const pu=solo(eg,sph(hr*.15,12,8).scale(.85,1.15,.45),col.pupil,null,s*hr*.34,-hr*.02,hr*.96);pu.rotation.y=s*.42;const sh=solo(eg,sph(hr*.05,8,6),C(0xffffff),C(0xffffff),s*hr*.3+hr*.04,hr*.07,hr*1.0);
    const b=solo(head,new THREE.BoxGeometry(hr*.42,hr*.1,hr*.12),L.hair==='flame'?col.glow:col.hair.clone().multiplyScalar(.6),L.hair==='flame'?GL:null,s*hr*.38,hr*.48,hr*.84);b.rotation.y=s*.42;b.userData.s=s;face.brows.push(b);}}
  face.eyes=eg;
  if(!mask){const mo=solo(head,cap(hr*.08,hr*.2,8).rotateZ(Math.PI/2).scale(1,1,.5),C(0x3a1420),null,0,-hr*.42,hr*.9);face.mouth=mo;}}
 // signature details
 if(L.visor)gp(head,new THREE.BoxGeometry(hr*2.05,hr*.26,hr*.9).translate(0,0,hr*.2),0,hr*.62,0);
 if(L.hair==='spikes'){for(let i=0;i<9;i++){const a=(i/8-.5)*2.6;const c=p(head,new THREE.ConeGeometry(hr*.34,hr*1.45,6),col.hair,Math.sin(a)*hr*.62,hr*.66+Math.cos(a)*hr*.22,-hr*.18-Math.abs(a)*.03,col.hair.clone().multiplyScalar(.25));c.rotation.set(-.85,0,-a*.62);}
  const fr=p(head,new THREE.ConeGeometry(hr*.3,hr*1.0,6),col.hair,0,hr*.88,hr*.45,col.hair.clone().multiplyScalar(.25));fr.rotation.set(.9,0,0);}
 if(L.hair==='rocks'){for(let i=0;i<6;i++){const r=p(head,new THREE.DodecahedronGeometry(hr*(.42+Math.random()*.3),0),col.hair,(Math.random()-.5)*hr*1.3,hr*.78,(Math.random()-.5)*hr*.9-hr*.15);r.rotation.set(Math.random()*3,Math.random()*3,0);}
  for(const s of[-1,1]){p(torso,new THREE.DodecahedronGeometry(tw*.6,0),col.hair,s*tw*1.08,torsoL*.95,-tw*.1);}
  for(let i=0;i<5;i++){const g=gp(torso,new THREE.BoxGeometry(H*.02,torsoL*(.22+Math.random()*.25),.03),(Math.random()-.5)*tw*1.1,torsoL*(.35+Math.random()*.4),tw*.86);g.rotation.z=(Math.random()-.5)*1.2;}}
 if(L.hair==='mask'){fx.scarfAnchor=new THREE.Object3D();fx.scarfAnchor.position.set(0,-hr*.6,-hr*.65);head.add(fx.scarfAnchor);gp(head,new THREE.TorusGeometry(hr*.92,hr*.26,8,18).rotateX(Math.PI/2),0,-hr*.78,0);
  for(const s of[-1,1]){const t=gp(head,new THREE.ConeGeometry(hr*.16,hr*.9,5),s*hr*.25,hr*.25,-hr*1.05);t.rotation.set(-1.25,0,s*.3);}}
 if(L.hair==='hat'){p(head,new THREE.CylinderGeometry(hr*2.15,hr*2.15,hr*.12,26),col.hair,0,hr*.6,0);const cone=p(head,new THREE.ConeGeometry(hr*1.05,hr*3.1,18),col.hair,0,hr*2.0,-hr*.35);cone.rotation.x=-.4;
  gp(head,new THREE.TorusGeometry(hr*1.02,hr*.12,6,22).rotateX(Math.PI/2),0,hr*.72,0);const st=gp(head,new THREE.OctahedronGeometry(hr*.28,0),0,hr*1.4,hr*.6);st.rotation.x=-.4;
  fx.orb=solo(root,sph(H*.075,16,12),GD,GL.clone().multiplyScalar(1.6));}
 if(L.hair==='fin'){const fin=gp(head,new THREE.ConeGeometry(hr*.62,hr*2.3,4).scale(.25,1,1.6),0,hr*.85,-hr*.2);fin.rotation.x=-.9;for(const s of[-1,1]){const g=p(head,new THREE.ConeGeometry(hr*.32,hr*1.15,4).scale(.3,1,1),col.hair,s*hr*.95,0,-hr*.1);g.rotation.set(-1.2,0,s*.6);}}
 if(L.hair==='flame'){const fg=new THREE.Group();fg.position.set(0,hr*.45,-hr*.1);head.add(fg);const parts=[];
  for(let i=0;i<11;i++){const row=i<6?0:1,j=row?i-6:i,n=row?5:6,a=(j/(n-1)-.5)*(row?1.8:2.4),h=hr*(row?1.5:1.15)*(1-Math.abs(a)*.18),g=new THREE.ConeGeometry(hr*(row?.36:.32),h,6);
   g.translate(0,h*.5,0);g.rotateX(-.35-row*.45);g.rotateZ(-a*.55);g.translate(Math.sin(a)*hr*.62,row?hr*.1:hr*.2,row?-hr*.35:hr*.25);parts.push(g);}
  const fl=solo(fg,mergeSimple(parts),col.glow.clone().lerp(C(0xffd060),.35),GL.clone().multiplyScalar(1.5));fl.castShadow=false;fx.flames=fg;}
 if(L.hair==='ears'){for(const s of[-1,1]){p(head,sph(hr*.4,10,8).scale(1,1,.5),col.hair,s*hr*.78,hr*.78,0);p(head,sph(hr*.22,10,8).scale(1,1,.4),col.skin.clone().lerp(C(0xffc0a0),.5),s*hr*.78,hr*.78,hr*.12);}
  p(head,sph(hr*.5,12,10).scale(1,.78,1),col.trim.clone().lerp(C(0xe8c8a0),.6),0,-hr*.28,hr*.66);p(head,sph(hr*.16,8,6),C(0x1a1214),0,-hr*.12,hr*1.12);}
 if(L.hair==='antenna'){p(head,new THREE.CylinderGeometry(H*.009,H*.009,hr*1.6,6),col.trim,hr*.5,hr*1.5,0);fx.tipObj=gp(head,sph(H*.026,10,8),hr*.5,hr*2.35,0);}
 if(L.jetpack){p(torso,new THREE.BoxGeometry(tw*1.6,torsoL*.82,tw*.8),col.trim,0,torsoL*.55,-tw*1.0);for(const s of[-1,1]){p(torso,new THREE.CylinderGeometry(tw*.22,tw*.3,torsoL*.32,10),col.suit,s*tw*.45,torsoL*.05,-tw*1.05);gp(torso,new THREE.CylinderGeometry(tw*.2,tw*.2,.03,10),s*tw*.45,torsoL*-.1,-tw*1.05);const o=new THREE.Object3D();o.position.set(s*tw*.45,-torsoL*.15,-tw*1.05);torso.add(o);fx.nozzles.push(o);}}
 if(robe){p(hips,new THREE.ConeGeometry(tw*1.55,leg*.9,20,1),col.suit,0,-leg*.3,0);gp(hips,new THREE.TorusGeometry(tw*1.5,H*.016,6,30).rotateX(Math.PI/2),0,-leg*.74,0);
  p(hips,new THREE.TorusGeometry(tw*.92,H*.03,6,26).rotateX(Math.PI/2),col.trim,0,0,0);}
 // arms
 const arm=s=>{const sh=new THREE.Group();sh.position.set(s*(tw+ar*.55),torsoL*.9,0);torso.add(sh);p(sh,sph(ar*(heavy?1.7:1.5),12,10),col.trim);
  p(sh,cap(ar,upA-ar*2),col.suit,0,-upA/2,0);const el=new THREE.Group();el.position.y=-upA;sh.add(el);p(el,cap(ar*.92,foA-ar*2),robot||heavy?col.suit:col.skin,0,-foA/2,0);
  p(el,sph(ar*(heavy?1.85:1.62),12,10).scale(1,1.05,1.1),col.glove,0,-foA,0);gp(el,new THREE.TorusGeometry(ar*1.15,ar*.3,6,14).rotateX(Math.PI/2),0,-foA*.66,0);
  const tip=new THREE.Object3D();tip.position.y=-foA-ar;el.add(tip);return{sh,el,tip};};
 const aL=arm(1),aR=arm(-1);
 if(L.trident){const tr=new THREE.Group();const gold=C(0xffd04a);p(tr,new THREE.CylinderGeometry(H*.017,H*.017,H*1.3,8),gold);
  for(const x of[-1,0,1]){gp(tr,new THREE.ConeGeometry(H*.03,H*.2,6),x*H*.06,H*.72,0);}p(tr,new THREE.BoxGeometry(H*.16,H*.025,H*.025),gold,0,H*.62,0);
  tr.position.set(0,-foA,0);tr.rotation.x=Math.PI/2;aR.el.add(tr);flatten(aR.el,tr);}
 // legs
 const legF=s=>{const hp=new THREE.Group();hp.position.set(s*hipW,0,0);hips.add(hp);p(hp,cap(lr,thigh-lr*1.4),robe?col.trim:col.suit,0,-thigh/2,0);const kn=new THREE.Group();kn.position.y=-thigh;hp.add(kn);
  p(kn,cap(lr*.92,shin-lr*1.4),robe?col.trim:col.suit,0,-shin/2,0);p(kn,cap(lr*1.12,shin*.35),col.boot,0,-shin*.72,0);
  p(kn,cap(lr*1.05,lr*2.4).rotateX(Math.PI/2).scale(1,.72,1),col.boot,0,-shin+lr*.1,lr*.9);gp(kn,new THREE.TorusGeometry(lr*1.15,lr*.24,6,12).rotateX(Math.PI/2),0,-shin*.5,0);
  const tip=new THREE.Object3D();tip.position.set(0,-shin,lr*1.7);kn.add(tip);return{hp,kn,tip};};
 const lL=legF(1),lR=legF(-1);
 // bake bones
 for(const g of[hips,torso,head,aL.sh,aL.el,aR.sh,aR.el,lL.hp,lL.kn,lR.hp,lR.kn])bake(g,mat,ink);
 // shield bubble
 const shieldM=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uC:{value:new THREE.Color(K.glow)},uA:{value:1}},
  vertexShader:'varying vec3 vN,vV;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(uC*(.16+f*1.4)*uA,1.);}'});
 const shield=new THREE.Mesh(new THREE.SphereGeometry(H*.64,28,18),shieldM);shield.position.y=H*.5;shield.visible=false;root.add(shield);
 const st={pose:{...POSES.idle},phase:0,yaw:0,flip:0,yspin:0,squash:0,squashV:0,fade:1,lastSt:'',djT:0,rollT:0,mv:'',mt:-1,smear:0,stretch:0};
 let glowV=1;
 const rig={root,mat,ink,fx,face,shield,H,def,rimU:U,joints:{aL,aR,lL,lR,torso,head,neck,hips},state:st,
  limbs:{hR:aR,hL:aL,fR:lR,fL:lL},
  limb(n){return n==='hR'?aR.tip:n==='hL'?aL.tip:n==='fL'?lL.tip:lR.tip;},
  setPose(pz,k){const P=st.pose;for(const key in pz)P[key]=lerp(P[key],pz[key],k);},
  apply(){const pz=st.pose;inner.position.y=-cy+pz.y*H*.45;torso.rotation.set(pz.lean,pz.twist,0);head.rotation.x=pz.head;
   aL.sh.rotation.set(-pz.shL,0,pz.abL);aR.sh.rotation.set(-pz.shR,0,-pz.abR);aL.el.rotation.x=-pz.elL;aR.el.rotation.x=-pz.elR;
   lL.hp.rotation.set(-pz.hpL,0,.04);lR.hp.rotation.set(-pz.hpR,0,-.04);lL.kn.rotation.x=pz.knL;lR.kn.rotation.x=pz.knR;},
  squash(a){st.squashV-=a;},
  setGlow(v){if(Math.abs(v-glowV)>.01){glowV=v;U.uGlow.value=v;}},
  setFade(a){if(Math.abs(a-st.fade)<.01)return;st.fade=a;mat.transparent=a<.99;mat.opacity=a;mat.depthWrite=a>.99;ink.visible=a>.99;},
 };
 return rig;}
function mergeSimple(list){const P=[],N=[];for(let g of list){g=g.index?g.toNonIndexed():g;const p=g.attributes.position,n=g.attributes.normal;for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));}}
 const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));return G;}

/* ---------- per-frame animation from simulation state ---------- */
const tmp=new V();
const HURT=new Set(['stun','tumble','held','down']);
export function animate(rig,f,dt,time){const st=rig.state,H=rig.H,P=POSES;let tgt=P.idle,k=Math.min(1,dt*16),flipT=null,yspinT=0,lie=0;
 const sp=Math.abs(f.vx);if(f.st!==st.lastSt){if(f.st==='air'&&st.lastSt==='jsq')rig.squash(-.26);if(f.st==='stun'||f.st==='tumble')rig.squash(.22);st.lastSt=f.st;}
 switch(f.st){
  case 'idle':case 'land':case 'sdrop':case 'revive':tgt=P.idle;if(f.st==='land'&&f.lag>6)tgt=P.crouch;break;
  case 'walk':case 'run':{const run=f.st==='run';st.phase+=dt*(run?13:9)*Math.min(1.2,.4+sp/(run?f.def.run:f.def.walk)*.7);const s=Math.sin(st.phase),c=Math.cos(st.phase),A=run?1.0:.6;
   tgt={...P0,y:-.08+Math.abs(c)*.07*(run?1.4:1),lean:run?.45:.15,head:run?-.22:0,hpL:s*A+.15,hpR:-s*A+.15,knL:(c>0?c*1.4:.15)*A+.2,knR:(c<0?-c*1.4:.15)*A+.2,shL:-s*A*.9+.2,shR:s*A*.9+.2,elL:run?1.5:.6,elR:run?1.5:.6,abL:.12,abR:.12,twist:s*.18};k=Math.min(1,dt*22);break;}
  case 'crouch':case 'jsq':tgt=P.crouch;k=Math.min(1,dt*30);break;
  case 'air':tgt=f.vy+f.ky>0?P.jumpUp:P.fall;if(st.djT>0)flipT=(1-st.djT/.45)*Math.PI*2;break;
  case 'helpless':tgt=P.helpless;break;
  case 'shield':case 'sstun':tgt=P.shield;k=Math.min(1,dt*30);break;
  case 'stun':tgt=P.hurt;k=Math.min(1,dt*40);break;
  case 'tumble':tgt=P.tumble;flipT=st.flip+dt*Math.min(16,4+Math.hypot(f.kx,f.ky)*25)*(f.kx*f.face>0?-1:1);break;
  case 'down':tgt=P.down;lie=1;break;
  case 'getup':case 'tech':tgt=f.dodgeDir?P.pound:P.crouch;if(f.dodgeDir)flipT=(f.t/30)*Math.PI*2*(f.dodgeDir*f.face>0?1:-1);break;
  case 'dodge':tgt=P.crouch;break;
  case 'roll':tgt=P.pound;flipT=Math.min(1,f.t/24)*Math.PI*2*(f.dodgeDir*f.face>0?1:-1);break;
  case 'adodge':tgt=P.nairW;break;
  case 'ledge':tgt=P.ledge;break;
  case 'lget':tgt=f.sub==='roll'?P.pound:P.climb;k=Math.min(1,dt*24);break;
  case 'hold':tgt=P.hold;if(f.pumT>8)tgt=P.slam;break;
  case 'held':tgt=P.hurt;break;
  case 'throw':{const T=f.thr;tgt=P[T&&T.p]||P.throwF;if(f.thrK==='b')yspinT=Math.min(1,f.t/(T?T.rel:12))*Math.PI;k=Math.min(1,dt*20);if(f.thrK==='u'&&f.t<(T?T.rel:12))flipT=0;break;}
  case 'dizzy':tgt=P.dizzy;break;
  case 'win':tgt=f.winPose===1?P.win2:P.win;k=Math.min(1,dt*6);if(f.winPose===1)tgt={...tgt,y:tgt.y+Math.abs(Math.sin(time*5))*.12};break;
  case 'lose':tgt=P.lose;k=Math.min(1,dt*4);break;
  case 'atk':{const m=f.move;if(!m)break;const p=m.p||['punchW','punch'];const first=m.h.length?Math.min(...m.h.map(h=>h.s)):(m.sp&&(m.sp.at||m.sp.a))||6;
   const last=m.h.length?Math.max(...m.h.map(h=>Math.min(h.e,m.f))):first+6;
   // anticipation squash on wind-up, stretch on release, limb smear while the hitbox is out
   if(st.mv!==f.mname||f.mt<st.mt){st.mv=f.mname;rig.squash(.16);}
   if(f.mt>=first&&st.mt<first)rig.squash(-.24);st.mt=f.mt;
   const active=m.h.some(h=>f.mt>=h.s-1&&f.mt<=h.e+1&&!h.grab);st.smear=active?1:st.smear;
   if(f.mt<first)tgt=P[p[0]]||P.idle;else if(f.mt<=last+Math.max(4,(m.f-last)*.4))tgt=P[p[1]]||P.punch;else tgt=f.ground?P.idle:P.fall;
   k=Math.min(1,dt*(f.mt<first?24:50));
   if(m.spin&&f.mt>=m.spin.s&&f.mt<=m.spin.e+2){const q=Math.min(1,(f.mt-m.spin.s)/(m.spin.e-m.spin.s));if(m.spin.y)yspinT=q*Math.PI*2*m.spin.n;else flipT=q*Math.PI*2*m.spin.n;}
   if(m.ys&&f.mt>=m.ys.s&&f.mt<=m.ys.e)yspinT=(f.mt-m.ys.s)/(m.ys.e-m.ys.s)*Math.PI*2*m.ys.n;
   if(m.name==='nair'&&f.mt>4&&f.mt<20)flipT=(f.mt-4)/16*Math.PI*2*(f.def.id==='vex'?1:0);
   if(f.charging){tgt={...tgt};tgt.y=(tgt.y||0)-.1+Math.sin(time*40)*.025;}
   if(m.sp&&m.sp.kind==='pound'&&f.mt>=m.sp.stall)tgt=P.pound;
   break;}
  case 'dead':case 'out':break;
 }
 if(f.st!=='atk'){st.mv='';st.mt=-1;}
 if(f.st==='idle'||f.st==='revive'){const b=Math.sin(time*2.6+f.slot)*.025;tgt={...tgt,y:tgt.y+b,shL:tgt.shL+b,shR:tgt.shR-b,head:tgt.head-b};}
 rig.setPose(tgt,k);rig.apply();
 // limb smear: the striking limb stretches along itself for the active frames, then snaps back
 st.smear=Math.max(0,st.smear-dt*7);for(const n in rig.limbs){const L=rig.limbs[n],g=L.sh||L.hp;const on=f.st==='atk'&&f.move&&(f.move.lb||'hR')===n;const s=on?st.smear:0;g.scale.set(1-s*.12,1+s*.42,1-s*.12);}
 // facing / spins
 const faceYaw=f.face>0?Math.PI/2-.55:-Math.PI/2+.55;let dy=faceYaw-st.yaw;st.yaw+=dy*Math.min(1,dt*(f.st==='atk'||f.st==='throw'?30:18));
 st.yspin=yspinT?yspinT:st.yspin*(1-Math.min(1,dt*20));
 rig.root.children[0].rotation.y=st.yaw+st.yspin*(f.face);
 if(flipT!==null)st.flip=flipT;else{st.flip=st.flip%(Math.PI*2);if(st.flip>Math.PI)st.flip-=Math.PI*2;if(st.flip<-Math.PI)st.flip+=Math.PI*2;st.flip*=1-Math.min(1,dt*14);}
 const pitch=rig.root.children[0].children[0].children[0];pitch.rotation.x=st.flip+(lie?-1.45:0);
 const bodyG=rig.root.children[0].children[0];bodyG.position.y=lie?-H*.38:0;
 // squash & stretch spring (+ velocity stretch while launched)
 st.squashV+=(-st.squash*260-st.squashV*15)*dt;st.squash+=st.squashV*dt;st.squash=Math.max(-.38,Math.min(.38,st.squash));
 const launch=(f.st==='tumble'||f.st==='stun')?Math.min(.28,Math.hypot(f.kx,f.ky)*.45):0;st.stretch+=(launch-st.stretch)*Math.min(1,dt*12);
 const sq=st.squash-st.stretch;bodyG.scale.set(1-sq*.5,1+sq,1-sq*.5);
 if(st.djT>0)st.djT-=dt;
 // face: blinks and expressions read the fight state
 const F=rig.face;if(F&&F.eyes){let ey=1,bw=.05,mo=.55;
  if(f.st==='atk'||f.st==='hold'||f.st==='throw'||f.st==='grab'){ey=.78;bw=.5;mo=.9;}
  if(f.charging){ey=.55;bw=.65;mo=1.2;}
  if(HURT.has(f.st)){ey=.18;bw=-.45;mo=1.7;}
  if(f.st==='dizzy'||f.st==='helpless'){ey=1.25;bw=-.5;mo=1.3;}
  if(f.st==='shield'||f.st==='sstun'){ey=.7;bw=.3;mo=.5;}
  if(f.st==='win'){ey=.32;bw=-.25;mo=1.7;}if(f.st==='lose'){ey=.55;bw=-.6;mo=.35;}
  F.blink-=dt;if(F.blink<0){if(F.blink<-.12)F.blink=2+Math.random()*3;else ey*=.08;}
  const kk=Math.min(1,dt*22);F.ey+=(ey-F.ey)*kk;F.bw+=(bw-F.bw)*kk;F.mo+=(mo-F.mo)*kk;
  F.eyes.scale.y=Math.max(.05,F.ey);for(const b of F.brows){b.rotation.z=b.userData.s*F.bw;b.position.y=rig.H*.135*(.48+(F.bw<0?-F.bw*.25:0)-(F.bw>0?F.bw*.12:0));}
  if(F.mouth)F.mouth.scale.set(1/Math.max(.7,F.mo*.8),Math.max(.4,F.mo),1);}
 // signature fx
 const fx=rig.fx;if(fx.flames){fx.flames.scale.set(1+Math.sin(time*13)*.08,1+Math.sin(time*18)*.18+(f.st==='atk'?.25:0),1);}
 if(fx.orb){const hp=rig.limb('hR');hp.getWorldPosition(tmp);rig.root.worldToLocal(tmp);const tx=tmp.x+Math.sin(time*2)*.1,ty=tmp.y+.25+Math.sin(time*3)*.08;fx.orb.position.x+=(tx-fx.orb.position.x)*Math.min(1,dt*10);fx.orb.position.y+=(ty-fx.orb.position.y)*Math.min(1,dt*10);fx.orb.position.z=tmp.z+.1;
  const s=f.charging&&f.mname==='nspec'?1+f.chg*2.2:1;fx.orb.scale.setScalar(s);}
}
