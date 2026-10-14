// TEMPEST FIST — procedural fighter rigs (adapted from PLATFORM BRAWL's baked-bone rig): athletic proportions with lathe-turned
// torsos, per-fighter silhouettes (hair, coats, capes, pads, staffs, gauntlets), ink outlines, a fighting-pose library and the
// per-frame animator that reads the simulation state.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,lerp=(a,b,k)=>a+(b-a)*k,cl=(v,a,b)=>v<a?a:v>b?b:v;

/* ---------- pose library (radians). sh fwd swing, ab arm out, el elbow, hp hip fwd, ha hip out, kn knee, lean, twist (torso), yaw (body), head, y (hip drop) ---------- */
const P0={y:0,lean:0,twist:0,head:0,yaw:0,shL:0,shR:0,abL:.12,abR:.12,elL:.25,elR:.25,hpL:0,hpR:0,haL:.05,haR:.05,knL:.08,knR:.08};
const mk=o=>({...P0,...o});
const G={shL:1.05,abL:.18,elL:2.05,shR:.75,abR:.22,elR:2.35};           // guard arms
const LG={hpL:.38,knL:.42,hpR:-.32,knR:.36,haL:.1,haR:.12};               // stance legs
const CR={y:-.42,lean:.32,hpL:1.25,knL:2.05,hpR:.55,knR:1.85,haL:.18,haR:.2};
export const POSES={
 stance:mk({y:-.07,lean:.1,twist:-.32,yaw:-.18,head:.06,...G,...LG}),
 stance2:mk({y:-.1,lean:.16,twist:-.4,yaw:-.25,head:.1,...G,shR:.55,elR:2.0,...LG,hpL:.46,knL:.55}),
 crouch:mk({...CR,...G,head:.05}),
 blockH:mk({y:-.12,lean:.2,twist:-.15,yaw:-.1,head:.3,shL:1.95,abL:.08,elL:2.45,shR:1.85,abR:.08,elR:2.5,...LG}),
 blockL:mk({...CR,shL:.85,abL:.1,elL:1.5,shR:.95,abR:.1,elR:1.7,head:.2}),
 hitH:mk({y:-.05,lean:-.42,twist:.25,head:-.55,shL:-.25,shR:-.15,abL:.65,abR:.55,elL:.6,elR:.7,hpL:.15,knL:.3,hpR:-.4,knR:.25}),
 hitM:mk({y:-.18,lean:.75,head:.35,shL:.55,shR:.6,abL:.3,abR:.25,elL:1.9,elR:1.8,hpL:.35,knL:.55,hpR:-.25,knR:.45}),
 hitL:mk({y:-.22,lean:.25,head:.1,...G,hpL:.05,knL:1.0,hpR:-.4,knR:.35}),
 juggle:mk({lean:-.45,head:-.45,shL:.7,shR:-.4,abL:1.25,abR:1.05,elL:.4,elR:.5,hpL:.65,knL:.95,hpR:-.15,knR:.55}),
 down:mk({lean:-.1,head:.1,shL:.3,shR:.4,abL:1.05,abR:.9,elL:.5,elR:.4,hpL:.25,knL:.6,hpR:.05,knR:.2,haL:.2,haR:.15}),
 rise:mk({y:-.38,lean:.45,shL:.5,shR:.4,elL:1.2,elR:1.4,hpL:1.3,knL:2.1,hpR:.2,knR:1.6}),
 jumpUp:mk({lean:.1,hpL:1.35,knL:1.9,hpR:.7,knR:1.7,...G}),
 jumpFall:mk({lean:.05,hpL:.7,knL:.9,hpR:.2,knR:.6,...G,shL:.8,shR:.6}),
 land:mk({...CR,y:-.3,...G}),
 dash:mk({y:-.15,lean:.5,twist:-.2,head:-.1,...G,hpL:.9,knL:.8,hpR:-.6,knR:.6}),
 bdash:mk({y:-.08,lean:-.15,twist:-.3,...G,hpL:-.2,knL:.3,hpR:.6,knR:.8}),
 ss:mk({y:-.14,lean:.15,twist:-.25,...G,hpL:.2,knL:.6,hpR:-.1,knR:.5,haL:.35,haR:.25}),
 jabW:mk({y:-.08,lean:.14,twist:-.42,yaw:-.18,...G,shL:1.15,elL:2.2,...LG}),
 jab:mk({y:-.1,lean:.2,twist:-.62,yaw:-.22,...G,shL:1.58,abL:.05,elL:.04,...LG,hpL:.45,knL:.5}),
 crossW:mk({y:-.08,lean:.12,twist:-.5,yaw:-.18,...G,shR:.55,elR:2.4,...LG}),
 cross:mk({y:-.14,lean:.28,twist:.62,yaw:-.1,...G,shL:.75,elL:2.25,shR:1.58,abR:.04,elR:.02,...LG,hpL:.55,knL:.6,hpR:-.45,knR:.2}),
 hookW:mk({y:-.12,lean:.18,twist:-.75,yaw:-.2,...G,shL:.9,abL:.7,elL:1.7,...LG}),
 hook:mk({y:-.2,lean:.32,twist:.45,yaw:-.1,...G,shL:1.25,abL:1.0,elL:1.55,...LG,hpL:.55,knL:.7}),
 upperW:mk({y:-.36,lean:.38,twist:-.4,...G,shR:-.35,elR:2.0,hpL:.8,knL:1.2,hpR:-.2,knR:.9}),
 upper:mk({y:.06,lean:-.22,twist:.45,head:-.3,...G,shR:2.75,abR:.1,elR:.55,hpL:.25,knL:.25,hpR:-.4,knR:.1}),
 bodyW:mk({y:-.2,lean:.3,twist:-.6,...G,shR:.3,elR:2.1,...LG}),
 body:mk({y:-.32,lean:.55,twist:.55,...G,shR:1.05,elR:.4,abR:.15,...LG,hpL:.75,knL:1.0}),
 elbowW:mk({y:-.1,lean:.15,twist:-.6,...G,shR:1.0,abR:.6,elR:2.6,...LG}),
 elbow:mk({y:-.16,lean:.38,twist:.75,...G,shR:1.35,abR:.85,elR:2.65,...LG,hpL:.6,knL:.6}),
 headbutt:mk({y:-.1,lean:.75,head:.5,twist:0,shL:1.3,shR:1.3,abL:.25,abR:.25,elL:1.0,elR:1.0,...LG,hpL:.6,knL:.55}),
 palmW:mk({y:-.15,lean:.12,twist:-.6,...G,shR:.5,elR:2.0,...LG}),
 palm:mk({y:-.2,lean:.3,twist:.5,...G,shR:1.5,elR:.1,abR:.0,...LG,hpL:.75,knL:.75,hpR:-.5,knR:.15}),
 dblPalm:mk({y:-.26,lean:.32,twist:.05,shL:1.45,shR:1.45,abL:-.1,abR:-.1,elL:.12,elR:.12,hpL:.85,knL:.9,hpR:-.55,knR:.15}),
 hammerW:mk({y:0,lean:-.15,twist:.1,...G,shR:3.0,abR:.25,elR:1.4,...LG}),
 hammer:mk({y:-.22,lean:.55,twist:.35,...G,shR:1.05,abR:.15,elR:.1,...LG,hpL:.7,knL:.85}),
 dblAxe:mk({y:-.28,lean:.7,shL:1.0,shR:1.0,abL:-.15,abR:-.15,elL:.15,elR:.15,hpL:.8,knL:.95,hpR:-.4,knR:.3}),
 lowJab:mk({...CR,shL:1.2,abL:.05,elL:.1,shR:.75,elR:2.2,lean:.48}),
 lowKickW:mk({...CR,y:-.3,...G,hpR:.4,knR:1.6}),
 lowKick:mk({y:-.3,lean:.12,twist:-.2,...G,hpL:.95,knL:1.6,hpR:1.05,knR:.05,haR:.25}),
 sweepW:mk({...CR,y:-.5,...G,yaw:-.6}),
 sweep:mk({y:-.58,lean:.42,yaw:.8,shL:.6,abL:.6,elL:1,shR:.4,abR:.6,elR:1,hpL:1.4,knL:2.2,hpR:.35,haR:1.45,knR:.02}),
 frontW:mk({y:-.04,lean:-.05,twist:-.2,...G,hpL:.15,knL:.3,hpR:1.5,knR:2.1}),
 front:mk({y:.02,lean:-.32,twist:-.1,...G,hpL:-.05,knL:.22,hpR:1.6,knR:.08}),
 sideW:mk({y:-.03,lean:.05,yaw:.9,...G,hpL:.0,knL:.3,hpR:.9,haR:.6,knR:2.2}),
 side:mk({y:.02,lean:-.1,yaw:1.45,head:.0,...G,shL:.3,abL:.9,elL:.8,hpL:-.05,knL:.2,hpR:.1,haR:1.45,knR:.04}),
 roundW:mk({y:-.03,lean:-.05,yaw:.5,...G,hpR:1.1,haR:.6,knR:2.0}),
 round:mk({y:.03,lean:-.38,yaw:1.15,...G,abL:.7,hpL:-.05,knL:.2,hpR:.9,haR:1.35,knR:.12}),
 spinW:mk({y:-.08,lean:.05,yaw:-1.0,...G,hpR:.3,knR:.6}),
 spinK:mk({y:.02,lean:-.25,yaw:1.4,...G,abL:.8,abR:.8,shL:.4,shR:.4,elL:.8,elR:.8,hpL:.0,knL:.2,hpR:.25,haR:1.5,knR:.05}),
 axeW:mk({y:.02,lean:-.38,...G,hpL:-.1,knL:.2,hpR:2.75,knR:.05}),
 axe:mk({y:-.12,lean:.35,...G,hpL:.1,knL:.45,hpR:.75,knR:.05}),
 kneeW:mk({y:-.05,lean:.1,...G,hpR:.9,knR:1.6}),
 knee:mk({y:.06,lean:.12,shL:1.25,shR:1.25,abL:.3,abR:.3,elL:1.2,elR:1.2,hpL:-.1,knL:.2,hpR:1.85,knR:2.3}),
 launchW:mk({y:-.38,lean:.4,twist:-.4,...G,shR:-.4,elR:2.1,hpL:.9,knL:1.3,hpR:-.2,knR:.9}),
 launch:mk({y:.08,lean:-.25,twist:.5,head:-.35,...G,shR:2.9,abR:.15,elR:.35,hpL:.2,knL:.2,hpR:-.45,knR:.1}),
 flipW:mk({y:-.3,lean:.3,...G,hpL:.9,knL:1.4,hpR:.8,knR:1.4}),
 flip:mk({y:0,lean:-.2,abL:1.1,abR:1.1,shL:.2,shR:.2,elL:.4,elR:.4,hpL:.5,knL:1.4,hpR:2.2,knR:.05}),
 lariatW:mk({y:-.08,lean:.1,twist:-.8,...G,shR:.0,abR:1.2,elR:.6,...LG}),
 lariat:mk({y:-.12,lean:.32,twist:.85,shL:.6,abL:.8,elL:1.2,shR:.45,abR:1.5,elR:.05,...LG,hpL:.7,knL:.7}),
 grabW:mk({y:-.1,lean:.2,shL:1.0,shR:1.0,abL:.25,abR:.25,elL:1.3,elR:1.3,...LG}),
 grab:mk({y:-.12,lean:.32,shL:1.45,shR:1.45,abL:-.12,abR:-.12,elL:.55,elR:.55,...LG,hpL:.55,knL:.55}),
 carry:mk({y:-.12,lean:-.12,head:-.25,shL:2.85,shR:2.85,abL:.25,abR:.25,elL:.5,elR:.5,hpL:.4,knL:.5,hpR:-.3,knR:.3,haL:.25,haR:.25}),
 throwF:mk({y:-.25,lean:.65,twist:.6,shL:1.2,shR:1.6,abL:.3,abR:.2,elL:.3,elR:.2,hpL:.8,knL:.8,hpR:-.5,knR:.3}),
 slamB:mk({y:-.2,lean:-.7,head:-.5,shL:2.9,shR:2.9,abL:.3,abR:.3,elL:.2,elR:.2,hpL:.3,knL:.6,hpR:.2,knR:.7}),
 spinT:mk({y:-.15,lean:-.15,shL:1.5,shR:1.5,abL:.2,abR:.2,elL:.1,elR:.1,hpL:.4,knL:.5,hpR:-.2,knR:.4,haL:.3,haR:.3}),
 castW:mk({y:-.1,lean:.05,twist:-.75,...G,shR:-.3,abR:.3,elR:1.6,...LG}),
 cast:mk({y:-.18,lean:.28,twist:.5,...G,shR:1.55,elR:.05,shL:1.0,elL:1.4,...LG,hpL:.65,knL:.7,hpR:-.45,knR:.15}),
 lowCast:mk({y:-.4,lean:.5,twist:.4,...G,shR:1.0,elR:.05,hpL:1.1,knL:1.6,hpR:.3,knR:1.4}),
 throwStar:mk({y:-.12,lean:.2,twist:.7,...G,shR:1.4,abR:.5,elR:.1,...LG}),
 beamW:mk({y:-.2,lean:.05,twist:-.9,yaw:-.3,shL:.4,shR:.3,abL:.3,abR:.2,elL:2.2,elR:2.2,hpL:.6,knL:.7,hpR:-.5,knR:.3,haL:.3,haR:.3}),
 beam:mk({y:-.25,lean:.2,twist:0,shL:1.5,shR:1.5,abL:-.05,abR:-.05,elL:.05,elR:.05,hpL:.75,knL:.8,hpR:-.6,knR:.15,haL:.25,haR:.2}),
 staffW:mk({y:-.12,lean:.1,twist:-.8,...G,shR:.6,abR:.4,elR:2.2,...LG}),
 staff:mk({y:-.25,lean:.3,twist:.45,...G,shL:1.2,elL:1.0,shR:1.55,abR:.0,elR:.0,hpL:.95,knL:.95,hpR:-.6,knR:.12}),
 skyLance:mk({y:.0,lean:-.25,head:-.4,shL:1.6,elL:1,shR:3.05,abR:.1,elR:.05,hpL:.3,knL:.3,hpR:-.3,knR:.1}),
 jPunch:mk({lean:.35,twist:.4,shL:.8,elL:1.8,shR:1.25,elR:.05,hpL:1.0,knL:1.7,hpR:.4,knR:1.3}),
 jKick:mk({lean:-.18,...G,hpL:1.05,knL:2.0,hpR:1.35,knR:.06}),
 jDive:mk({lean:.45,...G,hpL:1.6,knL:2.2,hpR:.75,knR:.02}),
 slide:mk({y:-.68,lean:-.85,head:.3,shL:-.4,shR:-.5,abL:.5,abR:.5,elL:.4,elR:.4,hpL:1.35,knL:1.9,hpR:1.5,knR:.03}),
 handW:mk({y:-.3,lean:.6,shL:1.4,shR:1.4,elL:.3,elR:.3,hpL:.8,knL:1.4,hpR:.6,knR:1.4}),
 hand:mk({y:.78,lean:0,head:-.3,shL:3.05,shR:3.05,abL:.25,abR:.25,elL:.08,elR:.08,hpL:.15,knL:.05,hpR:-.15,knR:.05,haL:.9,haR:.9}),
 parry:mk({y:-.22,lean:.1,twist:-.15,shL:1.35,abL:.0,elL:.55,shR:.55,abR:.3,elR:1.6,hpL:.6,knL:.7,hpR:-.45,knR:.4,haL:.2,haR:.25}),
 chargeW:mk({y:-.22,lean:.2,twist:-.95,...G,shR:-.7,abR:.3,elR:1.7,...LG,hpL:.6,knL:.8}),
 charge:mk({y:-.2,lean:.58,twist:.85,...G,shR:1.6,elR:0,hpL:1.0,knL:.75,hpR:-.75,knR:.15}),
 stompW:mk({y:0,lean:-.1,shL:.4,abL:1.0,elL:1.6,shR:.4,abR:1.0,elR:1.6,hpL:1.7,knL:1.9,hpR:-.05,knR:.15}),
 stomp:mk({y:-.3,lean:.35,shL:.4,abL:1.1,elL:1.7,shR:.4,abR:1.1,elR:1.7,hpL:.35,knL:.15,hpR:-.2,knR:.75,haL:.35,haR:.3}),
 tackle:mk({y:-.22,lean:.68,twist:-.95,head:.1,shL:.3,abL:.4,elL:2.1,shR:.4,elR:2.0,hpL:1.0,knL:.75,hpR:-.7,knR:.2}),
 splash:mk({lean:1.25,head:-.6,shL:1.3,shR:1.3,abL:1.35,abR:1.35,elL:.2,elR:.2,hpL:-.2,knL:.4,hpR:-.3,knR:.4,haL:.4,haR:.4}),
 win1:mk({y:-.05,lean:-.12,head:-.25,shL:3.0,abL:.2,elL:.25,shR:.5,abR:.4,elR:1.8,hpL:.25,knL:.2,hpR:-.2,knR:.15}),
 win2:mk({y:-.06,lean:.05,head:.05,shL:1.0,shR:1.0,abL:-.5,abR:-.5,elL:2.3,elR:2.3,hpL:.1,knL:.1,hpR:-.1,knR:.1,haL:.2,haR:.2}),
 bow:mk({y:-.02,lean:.55,head:.3,shL:.1,shR:.1,abL:.05,abR:.05,elL:.1,elR:.1,hpL:0,knL:.05,hpR:0,knR:.05}),
 lose:mk({y:-.48,lean:.45,head:.6,shL:.2,shR:.15,abL:.15,abR:.15,elL:.4,elR:.3,hpL:1.45,knL:2.4,hpR:-.15,knR:2.35}),
};

/* ---------- materials: vertex-coloured standard material with rim/flash/glow uniforms + an ink hull ---------- */
const ZERO=new THREE.Color(0,0,0);
function rigMat(U,rough,metal){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:metal,envMapIntensity:.9});
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute vec3 emi;attribute float rgh;varying vec3 vEmi;varying float vRgh;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEmi=emi;vRgh=rgh;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vEmi;varying float vRgh;uniform vec3 uRimC,uFlC;uniform float uRimS,uFl,uGlow,uAmb;')
   .replace('#include <roughnessmap_fragment>','#include <roughnessmap_fragment>\nroughnessFactor=vRgh;')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n{float fr=pow(1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.),2.6);totalEmissiveRadiance+=vEmi*uGlow+diffuseColor.rgb*uAmb+uRimC*fr*uRimS+uFlC*uFl*(.45+fr);}');};
 m.customProgramCacheKey=()=>'tfrig1';return m;}
function inkMat(U){const m=new THREE.MeshBasicMaterial({color:0x0c0a12,side:THREE.BackSide});
 m.onBeforeCompile=sh=>{sh.uniforms.uInk=U.uInk;sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nuniform float uInk;').replace('#include <begin_vertex>','vec3 transformed=position+normal*uInk;');};
 m.customProgramCacheKey=()=>'tfink1';return m;}
function bake(group,mat,ink){const parts=group.children.filter(o=>o.isMesh&&o.userData.c);if(!parts.length)return null;
 const P=[],N=[],Cc=[],E=[],Rg=[];
 for(const m of parts){m.updateMatrix();const g=m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone();g.applyMatrix4(m.matrix);const p=g.attributes.position,n=g.attributes.normal,c=m.userData.c,e=m.userData.e,r=m.userData.r;
  for(let i=0;i<p.count;i++){P.push(p.getX(i),p.getY(i),p.getZ(i));N.push(n.getX(i),n.getY(i),n.getZ(i));Cc.push(c.r,c.g,c.b);E.push(e.r,e.g,e.b);Rg.push(r);}g.dispose();m.geometry.dispose();group.remove(m);}
 const Gm=new THREE.BufferGeometry();Gm.setAttribute('position',new THREE.Float32BufferAttribute(P,3));Gm.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));Gm.setAttribute('color',new THREE.Float32BufferAttribute(Cc,3));Gm.setAttribute('emi',new THREE.Float32BufferAttribute(E,3));Gm.setAttribute('rgh',new THREE.Float32BufferAttribute(Rg,1));Gm.computeBoundingSphere();
 const mesh=new THREE.Mesh(Gm,mat);mesh.castShadow=true;group.add(mesh);if(ink){const o=new THREE.Mesh(Gm,ink);o.userData.ink=1;group.add(o);}return mesh;}

/* ---------- rig builder ---------- */
export function makeRig(def,alt=0){const L=def.look,H=def.H,b=L.build,X=new Set(L.extras||[]);
 const heavy=b==='heavy'||b==='giant',slim=b==='slim',tall=b==='tall',giant=b==='giant';
 const C=c=>new THREE.Color(c);
 const pal=alt?{top:C(L.top).offsetHSL(.45,0,0),pants:C(L.pants).offsetHSL(.45,-.05,0),trim:C(L.trim),glow:C(L.glow).offsetHSL(.4,0,0)}:{top:C(L.top),pants:C(L.pants),trim:C(L.trim),glow:C(L.glow)};
 const col={skin:C(L.skin),top:pal.top,pants:pal.pants,trim:pal.trim,glove:C(L.glove),boot:C(L.boot),hair:C(L.hairC),glow:pal.glow,dark:C(0x15121a),white:C(0xf4f4f8),gold:C(0xe0b440),steel:C(0x9aa0aa)};
 if(alt&&L.top===L.glove)col.glove=pal.top;if(alt&&L.pants===L.boot)col.boot=pal.pants;
 const GL=col.glow.clone().multiplyScalar(1.6),GD=col.glow.clone().multiplyScalar(.3);
 const U={uRimC:{value:col.glow.clone().lerp(C(0xffffff),.5)},uRimS:{value:.38},uFl:{value:0},uFlC:{value:C(0xffffff)},uGlow:{value:1},uAmb:{value:.12},uInk:{value:H*.0085}};
 const mat=rigMat(U,.62,.05),ink=inkMat(U);
 const p=(par,g,c,x=0,y=0,z=0,o={})=>{const m=new THREE.Mesh(g);m.position.set(x,y,z);if(o.rx||o.ry||o.rz)m.rotation.set(o.rx||0,o.ry||0,o.rz||0);m.userData.c=c;m.userData.e=o.e||ZERO;m.userData.r=o.r??(c===col.skin?.55:.7);par.add(m);return m;};
 const gp=(par,g,x,y,z,o={})=>p(par,g,GD,x,y,z,{...o,e:GL});
 const metal=(par,g,c,x,y,z,o={})=>p(par,g,c,x,y,z,{...o,r:.28});
 const cap=(r,l,s=12)=>new THREE.CapsuleGeometry(r,Math.max(.001,l),4,s),sph=(r,a=16,b2=12)=>new THREE.SphereGeometry(r,a,b2),box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
 const lathe=(pts,seg=20)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(Math.max(.001,r),y)),seg);
 // tapered limb segment hanging from its joint: rounded top (r0), muscle belly (rm at mp), rounded bottom (r1)
 const limb=(len,r0,rm,r1,mp=.35,seg=14)=>lathe([[0,-len-r1*.95],[r1*.62,-len-r1*.72],[r1,-len],[rm,-len*mp],[r0,0],[r0*.62,r0*.72],[0,r0*.95]],seg);

 const root=new THREE.Group(),yawG=new THREE.Group(),body=new THREE.Group(),pitchG=new THREE.Group(),inner=new THREE.Group();root.add(yawG);yawG.add(body);body.add(pitchG);pitchG.add(inner);
 const cy=H*.5;pitchG.position.y=cy;inner.position.y=-cy;
 const leg=H*(tall?.52:heavy?.46:.5),thigh=leg*.5,shin=leg*.5,torsoL=H*(heavy?.3:.285),hr=H*(giant?.058:heavy?.06:.064),upA=H*(tall?.2:.185),foA=H*(tall?.18:.165);
 const lr=H*(heavy?.066:slim?.046:.052),ar=H*(heavy?.05:slim?.032:.038),tw=H*(giant?.17:heavy?.16:slim?.11:tall?.12:.13),hipW=H*(heavy?.07:.058),dep=heavy?.78:.62;
 const hips=new THREE.Group();hips.position.y=leg;inner.add(hips);
 // pelvis
 p(hips,sph(tw*.82,18,12).scale(1,.55,dep*1.05),col.pants);
 const torso=new THREE.Group();hips.add(torso);
 // torso: lathe profile (waist → chest → shoulders), flattened front-to-back
 const bodyC=X.has('tank')||X.has('singlet')||X.has('gi')||X.has('robe')||X.has('coat')||X.has('armor')||X.has('straps')?col.top:col.top;
 const prof=heavy?[[tw*.78,0],[tw*.86,torsoL*.25],[tw*.92,torsoL*.5],[tw*1.0,torsoL*.75],[tw*.9,torsoL*.95],[tw*.4,torsoL*1.05],[0,torsoL*1.06]]
  :[[tw*.66,0],[tw*.6,torsoL*.22],[tw*.74,torsoL*.5],[tw*.92,torsoL*.78],[tw*.86,torsoL*.95],[tw*.36,torsoL*1.04],[0,torsoL*1.05]];
 p(torso,lathe(prof,22).scale(1,1,dep),bodyC);
 if(X.has('tank')){p(torso,lathe([[tw*.34,torsoL*.9],[tw*.44,torsoL*1.0],[tw*.2,torsoL*1.07],[0,torsoL*1.08]],18).scale(1,1,dep*1.02),col.skin);for(const s of[-1,1])p(torso,sph(tw*.36,12,10).scale(1,1,dep*.9),col.skin,s*tw*.72,torsoL*.9,0);}
 if(X.has('singlet')){for(const s of[-1,1])p(torso,sph(tw*.4,12,10).scale(1,1,dep),col.skin,s*tw*.6,torsoL*.92,0);p(torso,lathe([[tw*.5,torsoL*.86],[tw*.4,torsoL*1.0],[0,torsoL*1.07]],18).scale(1,1,dep*1.03),col.skin);}
 if(X.has('gi')){for(const s of[-1,1]){const l=p(torso,box(tw*.18,torsoL*.75,.02),col.top.clone().multiplyScalar(.85),s*tw*.18,torsoL*.62,tw*dep*.83,{rz:s*.5});}p(torso,lathe([[tw*.28,torsoL*.75],[tw*.2,torsoL*1.0]],12).scale(1,1,dep*1.05),col.skin);}
 if(X.has('armor')){metal(torso,lathe([[tw*.8,torsoL*.35],[tw*.98,torsoL*.62],[tw*1.02,torsoL*.82],[tw*.7,torsoL*.98],[0,torsoL*1.02]],20).scale(1,1,dep*1.06),col.trim);
  gp(torso,new THREE.OctahedronGeometry(tw*.2,0).scale(1,1.3,.4),0,torsoL*.72,tw*dep*1.02);for(let i=0;i<3;i++)metal(torso,box(tw*1.3-i*tw*.18,torsoL*.06,tw*dep*1.95),col.trim.clone().multiplyScalar(.75),0,torsoL*(.12+i*.09),0);}
 if(X.has('straps')){for(const s of[-1,1])p(torso,new THREE.TorusGeometry(tw*.98,H*.011,6,30).rotateY(Math.PI/2).rotateZ(s*.62).scale(1,1,dep*1.12),col.trim,0,torsoL*.58,0);}
 if(X.has('champ')){metal(torso,new THREE.TorusGeometry(tw*.84,H*.03,8,28).rotateX(Math.PI/2).scale(1,1,dep*1.1),col.gold,0,torsoL*.05,0);metal(torso,new THREE.CylinderGeometry(tw*.42,tw*.42,H*.02,22).rotateX(Math.PI/2),col.gold.clone().multiplyScalar(1.15),0,torsoL*.05,tw*dep*.9);gp(torso,sph(tw*.12,10,8).scale(1,1,.5),0,torsoL*.05,tw*dep*.9+H*.012);}
 if(X.has('blackbelt')||X.has('cord')||X.has('sash')){const bc=X.has('blackbelt')?col.dark:col.trim;p(torso,new THREE.TorusGeometry(tw*.7,H*.016,6,26).rotateX(Math.PI/2).scale(1,1,dep*1.15),bc,0,torsoL*.06,0);
  for(const s of[-1,1])p(torso,box(H*.026,H*.15,H*.012),bc,s*H*.025,-H*.06,tw*dep*.82,{rz:s*.18});}
 if(X.has('robe')){p(hips,lathe([[tw*.82,.02],[tw*1.05,-leg*.25],[tw*1.25,-leg*.52]],22).scale(1,1,dep*1.2),col.top,0,0,0);gp(hips,new THREE.TorusGeometry(tw*1.25,H*.008,6,30).rotateX(Math.PI/2).scale(1,1,dep*1.2),0,-leg*.52,0);
  for(const s of[-1,1])p(torso,box(H*.012,torsoL*.9,.02),col.trim,s*tw*.05,torsoL*.55,tw*dep*.84,{rz:s*.35});}
 // neck + head
 const neck=new THREE.Group();neck.position.y=torsoL*1.02;torso.add(neck);p(neck,cap(hr*.42,H*.035,10),col.skin,0,hr*.25,0);
 if(heavy)p(neck,sph(tw*.55,12,10).scale(1,.45,dep*.9),col.skin,0,0,0);
 const head=new THREE.Group();head.position.y=hr*1.15+H*.02;neck.add(head);
 p(head,sph(hr,20,16).scale(.9,1.06,.98),col.skin);p(head,sph(hr*.72,14,10).scale(1,.75,1),col.skin,0,-hr*.42,hr*.15);   // skull + jaw
 const face={eyes:null,brows:[],blink:2+Math.random()*2,ey:1};
 const eg=new THREE.Group();eg.position.set(0,hr*.1,hr*.82);head.add(eg);const eyeC=L.hair==='hood'||L.hair==='crown'?col.glow:col.dark;
 for(const s of[-1,1]){const e=p(eg,sph(hr*.13,10,8).scale(1.25,.6,.45),eyeC,s*hr*.36,0,0,{e:eyeC===col.glow?GL:null});const br=p(head,box(hr*.42,hr*.09,hr*.12),col.hair.clone().multiplyScalar(.7),s*hr*.36,hr*.3,hr*.84,{rz:s*-.12});face.brows.push(br);}
 face.eyes=eg;p(head,sph(hr*.14,8,6).scale(.8,1,1.1),col.skin.clone().multiplyScalar(.92),0,-hr*.12,hr*.94);  // nose
 const hairCap=(cov=.62)=>p(head,new THREE.SphereGeometry(hr*1.06,20,12,0,Math.PI*2,0,Math.PI*cov).scale(.92,1.04,1.02),col.hair,0,hr*.05,-hr*.04);
 const fx={scarfAnchor:null,staffTip:null,capeAnchor:null,tails:[],cape:null,orb:null};
 switch(L.hair){
  case 'spiky':hairCap(.5);for(let i=0;i<11;i++){const a=(i/10-.5)*2.6,c=p(head,new THREE.ConeGeometry(hr*.3,hr*1.2,6),i%3?col.hair:col.glow.clone().multiplyScalar(.7),Math.sin(a)*hr*.6,hr*.75+Math.cos(a)*hr*.15,-hr*.25,{rx:-1.1+Math.abs(a)*.1,rz:-a*.55,e:i%3?null:GD});}break;
  case 'mohawk':for(let i=0;i<7;i++){p(head,new THREE.ConeGeometry(hr*.22,hr*(1.1-Math.abs(i-2.5)*.08),4).scale(.35,1,1),col.hair,0,hr*.85-i*hr*.07,hr*.45-i*hr*.28,{rx:-.35-i*.18});}
   for(const s of[-1,1])p(head,sph(hr*.9,12,8,).scale(.25,.5,.8),col.hair.clone().multiplyScalar(.35),s*hr*.72,hr*.35,-hr*.1);break;
  case 'ponytail':hairCap(.58);p(head,sph(hr*.55,12,10).scale(1.2,.5,1),col.hair,0,hr*.55,hr*.5);for(let i=0;i<6;i++)p(head,sph(hr*(.42-i*.04),10,8).scale(1,1.3,1),col.hair,0,hr*(.45-i*.38),-hr*(1.0+i*.12));
   for(const s of[-1,1])p(head,cap(hr*.18,hr*.9,8),col.hair,s*hr*.82,-hr*.25,hr*.2);gp(head,new THREE.TorusGeometry(hr*.3,hr*.06,6,14),0,hr*.62,-hr*.95,{rx:.4});break;
  case 'crop':hairCap(.48);break;
  case 'hood':p(head,sph(hr*1.22,18,14).scale(.95,1.05,1.05),col.hair,0,hr*.1,-hr*.1);p(head,box(hr*1.6,hr*.8,hr*.4),col.top.clone().multiplyScalar(.7),0,-hr*.42,hr*.62);
   p(head,box(hr*1.5,hr*.12,hr*.3),col.dark,0,hr*.1,hr*.85);for(const s of[-1,1])p(eg,sph(hr*.11,8,6).scale(1.6,.5,.4),col.glow,s*hr*.34,0,hr*.1,{e:GL.clone().multiplyScalar(1.4)});break;
  case 'bald':p(head,sph(hr*1.01,16,10,0,Math.PI*2,0,Math.PI*.35),col.skin.clone().multiplyScalar(1.08),0,hr*.02,0);break;
  case 'buns':hairCap(.6);for(const s of[-1,1]){p(head,sph(hr*.42,12,10),col.hair,s*hr*.72,hr*.82,-hr*.15);gp(head,new THREE.TorusGeometry(hr*.4,hr*.05,6,14).rotateX(Math.PI/2),s*hr*.72,hr*.7,-hr*.15);const st=p(head,cap(hr*.04,hr*1.0,6),col.gold,s*hr*.72,hr*1.0,-hr*.15,{rz:s*.9});}break;
  case 'dreads':hairCap(.6);for(let i=0;i<14;i++){const a=(i/13-.5)*3.6,ln=hr*(1.4+Math.random()*.6);p(head,cap(hr*.11,ln,6),col.hair,Math.sin(a)*hr*.85,hr*.2-ln*.45,-Math.cos(a)*hr*.75,{rx:-.25*Math.cos(a),rz:Math.sin(a)*.2});}
   p(head,new THREE.TorusGeometry(hr*.98,hr*.12,6,22).rotateX(Math.PI/2),col.glow.clone().multiplyScalar(.6),0,hr*.45,0);break;
  case 'crown':for(let i=0;i<9;i++){const a=i/9*Math.PI*2;metal(head,new THREE.ConeGeometry(hr*.17,hr*(i%2?.8:1.25),4),col.gold,Math.sin(a)*hr*.82,hr*1.0,Math.cos(a)*hr*.82);}
   metal(head,new THREE.CylinderGeometry(hr*.95,hr*.92,hr*.3,24,1,true),col.gold,0,hr*.72,0);gp(head,sph(hr*.16,10,8),0,hr*.75,hr*.92);
   p(head,box(hr*1.7,hr*.55,hr*.3),col.dark,0,-hr*.05,hr*.72);break;}
 if(X.has('headband')){p(head,new THREE.TorusGeometry(hr*.98,hr*.1,6,24).rotateX(Math.PI/2),C(0xd82a2a),0,hr*.42,0);for(const s of[-1,1])p(head,box(hr*.12,hr*1.1,hr*.06),C(0xd82a2a),s*hr*.2,-hr*.05,-hr*1.05,{rx:.4,rz:s*.25});}
 if(X.has('beard'))p(head,sph(hr*.7,12,10).scale(1,.75,.8),col.hair,0,-hr*.6,hr*.35);
 // arms
 const arm=s=>{const sh=new THREE.Group();sh.position.set(s*(tw+ar*.3),torsoL*.9,0);torso.add(sh);const sleeve=X.has('coat')||X.has('gi')||X.has('robe')||X.has('armor')||(L.hair==='hood');
  const armC=sleeve?col.top:col.skin;p(sh,sph(ar*1.45,12,10).scale(1.05,1,1),X.has('tank')||X.has('singlet')?col.skin:armC,s*ar*.1,0,0);p(sh,limb(upA,ar*1.3,ar*(heavy?1.32:1.2),ar*.86,.38),armC);
  const el=new THREE.Group();el.position.y=-upA;sh.add(el);
  const big=X.has('gauntlet')&&s<0;
  p(el,limb(foA-ar*.6,ar*(big?1.3:.95),ar*(big?1.4:1.05),ar*.68,.28),sleeve&&!X.has('gi')?col.top:col.skin);
  if(X.has('wraps'))p(el,cap(ar*1.02,foA*.35),col.glove,0,-foA*.78,0);
  if(big){metal(el,new THREE.CylinderGeometry(ar*1.7,ar*1.45,foA*.75,12),col.steel,0,-foA*.55,0);for(let k=0;k<3;k++)gp(el,new THREE.TorusGeometry(ar*1.65,ar*.12,6,14).rotateX(Math.PI/2),0,-foA*(.3+k*.2),0);metal(el,new THREE.BoxGeometry(ar*2.3,ar*2.4,ar*2.4),col.steel.clone().multiplyScalar(.8),0,-foA-ar*.3,ar*.1);gp(el,new THREE.BoxGeometry(ar*2.0,ar*.3,ar*2.45),0,-foA-ar*.6,ar*.1);}
  else{const fs=H*(heavy?.04:.034);p(el,new THREE.BoxGeometry(fs*1.7,fs*1.9,fs*1.85),col.glove,0,-foA-fs*.1,fs*.1);p(el,sph(fs*.95,10,8).scale(1,1.05,1.1),col.glove,0,-foA-fs*.55,fs*.15);p(el,cap(fs*.42,fs*.7,6).rotateZ(Math.PI/2),col.glove.clone().multiplyScalar(.9),-s*fs*.8,-foA-fs*.05,fs*.55);}
  if(X.has('armor')||X.has('pads'))metal(el,new THREE.CylinderGeometry(ar*1.45,ar*1.25,foA*.5,10),X.has('armor')?col.trim:col.steel,0,-foA*.6,0);
  if(X.has('pads')||X.has('armor')){metal(sh,sph(ar*(giant?2.1:1.85),14,10,0,Math.PI*2,0,Math.PI*.5).scale(1.1,.75,1),X.has('armor')?col.trim:col.steel,s*ar*.35,ar*.35,0,{rz:-s*.35});metal(sh,new THREE.TorusGeometry(ar*1.75,ar*.16,6,16).rotateX(Math.PI/2).scale(1.1,1,1),X.has('armor')?col.trim.clone().multiplyScalar(.7):col.steel.clone().multiplyScalar(.6),s*ar*.35,ar*.3,0,{rz:-s*.35});}
  if(X.has('armor')&&!big)for(let k=0;k<3;k++)metal(sh,new THREE.ConeGeometry(ar*.3,ar*1.3,4),col.trim,s*ar*(.6+k*.45),ar*1.5-k*ar*.15,-ar*(k-1)*.6,{rz:-s*.9});
  if(X.has('coat')||X.has('robe'))gp(el,new THREE.TorusGeometry(ar*1.15,ar*.16,6,14).rotateX(Math.PI/2),0,-foA*.8,0);
  const tip=new THREE.Object3D();tip.position.y=-foA-ar;el.add(tip);return{sh,el,tip};};
 const aL=arm(1),aR=arm(-1);
 if(X.has('staff')){const st=new THREE.Group();metal(st,new THREE.CylinderGeometry(H*.014,H*.014,H*1.05,8),C(0xd8dce6),0,0,0);gp(st,new THREE.CylinderGeometry(H*.02,H*.02,H*.07,8),0,H*.5,0);gp(st,new THREE.CylinderGeometry(H*.02,H*.02,H*.07,8),0,-H*.5,0);
  gp(st,new THREE.TorusGeometry(H*.045,H*.008,6,16),0,H*.56,0);st.position.set(-ar*1.2,-foA-ar*.2,0);st.rotation.x=0;aR.el.add(st);
  fx.staffTip=new THREE.Object3D();fx.staffTip.position.set(-ar*1.2,-foA-H*.55,0);aR.el.add(fx.staffTip);flatten(aR.el,st);}
 // legs
 const legF=s=>{const hp=new THREE.Group();hp.position.set(s*hipW,0,0);hips.add(hp);const ps=col.pants,bare=b==='tall'&&X.has('gi')?false:false;
  p(hp,limb(thigh,lr*1.18,lr*(heavy?1.2:1.12),lr*.82,.3),ps);
  const kn=new THREE.Group();kn.position.y=-thigh;hp.add(kn);
  p(kn,limb(shin-lr*.4,lr*.84,lr*.92,lr*.56,.3),ps);
  if(X.has('kneepads'))p(kn,sph(lr*1.25,12,10).scale(1,1,.9),col.white,0,-lr*.2,lr*.3);
  if(X.has('gi')||X.has('cord'))p(kn,lathe([[lr*1.05,-shin*.55],[lr*1.25,-shin*.88]],12),ps,0,0,0);
  const footC=X.has('gi')||(L.boot===L.skin)?col.skin:col.boot;
  if(!X.has('gi')&&L.boot!==L.skin)p(kn,limb(shin*.36,lr*.8,lr*.78,lr*.68,.5),col.boot,0,-shin*.62,0);
  p(kn,cap(lr*.78,lr*2.3).rotateX(Math.PI/2).scale(1,.6,1),footC,0,-shin-lr*.25,lr*.7);
  if(X.has('armor'))metal(kn,new THREE.CylinderGeometry(lr*1.15,lr*1.05,shin*.55,10),col.trim,0,-shin*.62,0);
  const tip=new THREE.Object3D();tip.position.set(0,-shin,lr*1.6);kn.add(tip);return{hp,kn,tip};};
 const lL=legF(1),lR=legF(-1);
 // coat tails / cape / scarf anchors (animated, not baked)
 if(X.has('coat')){for(const s of[-1,1]){const g=new THREE.Group();g.position.set(s*tw*.42,torsoL*.02,-tw*dep*.75);torso.add(g);
   const bg=new THREE.BoxGeometry(tw*.62,leg*.86,H*.01,1,6,1).translate(0,-leg*.43,0),ps2=bg.attributes.position;for(let i=0;i<ps2.count;i++){const t=-ps2.getY(i)/(leg*.86);ps2.setX(i,ps2.getX(i)*(1-t*.45)+s*t*tw*.12);}bg.computeVertexNormals();
   const m=new THREE.Mesh(paint(bg,col.top,ZERO,.7),mat);m.castShadow=true;g.add(m);const m2=new THREE.Mesh(bg,ink);g.add(m2);
   const tr=new THREE.Mesh(paint(new THREE.BoxGeometry(tw*.36,H*.012,H*.014).translate(s*tw*.12,-leg*.855,0),GD,GL,.5),mat);g.add(tr);g.rotation.z=s*.08;fx.tails.push(g);}}
 if(X.has('cape')){const w=tw*2.6,h=H*.78,geo=new THREE.PlaneGeometry(w,h,6,10).translate(0,-h/2,0);paint(geo,C(0x8a1020),ZERO,.8);
  const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({vertexColors:true,roughness:.75,side:THREE.DoubleSide}));m.castShadow=true;const g=new THREE.Group();g.position.set(0,torsoL*.95,-tw*dep*1.05);torso.add(g);g.add(m);fx.cape=m;fx.capeG=g;m.userData.base=Float32Array.from(geo.attributes.position.array);}
 if(X.has('scarf')){fx.scarfAnchor=new THREE.Object3D();fx.scarfAnchor.position.set(0,-hr*.7,-hr*.6);head.add(fx.scarfAnchor);p(head,new THREE.TorusGeometry(hr*.78,hr*.28,8,18).rotateX(Math.PI/2),col.trim,0,-hr*.95,0);}
 if(X.has('headband'))fx.scarfAnchor=fx.scarfAnchor||null;
 for(const g of[hips,torso,neck,head,aL.sh,aL.el,aR.sh,aR.el,lL.hp,lL.kn,lR.hp,lR.kn])bake(g,mat,ink);
 const st={pose:{...POSES.stance},yaw:0,yspin:0,pitch:0,squash:0,squashV:0,lastSt:'',mv:'',smear:0,lie:0,roll:0,bob:Math.random()*6};
 const rig={root,mat,ink,fx,face,H,def,U,joints:{aL,aR,lL,lR,torso,head,neck,hips},state:st,inner,pitchG,body,yawG,cy,
  limbs:{hR:aR,hL:aL,fR:lR,fL:lL},
  limb(n){return n==='hR'?aR.tip:n==='hL'?aL.tip:n==='fL'?lL.tip:lR.tip;},
  setPose(pz,k){const P=st.pose;for(const key in pz)P[key]=lerp(P[key],pz[key],k);},
  apply(){const z=st.pose;inner.position.y=-cy+z.y*H*.45;torso.rotation.set(z.lean,z.twist,0);head.rotation.x=z.head;hips.rotation.y=z.yaw;
   aL.sh.rotation.set(-z.shL,0,z.abL);aR.sh.rotation.set(-z.shR,0,-z.abR);aL.el.rotation.x=-z.elL;aR.el.rotation.x=-z.elR;
   lL.hp.rotation.set(-z.hpL,0,z.haL);lR.hp.rotation.set(-z.hpR,0,-z.haR);lL.kn.rotation.x=z.knL;lR.kn.rotation.x=z.knR;},
  squash(a){st.squashV-=a;},
  setGlow(v){U.uGlow.value=v;},
 };
 return rig;}
function paint(g,c,e,r){g=g.index?g.toNonIndexed():g;const n=g.attributes.position.count,ca=new Float32Array(n*3),ea=new Float32Array(n*3),ra=new Float32Array(n).fill(r);for(let i=0;i<n;i++){ca.set([c.r,c.g,c.b],i*3);ea.set([e.r,e.g,e.b],i*3);}
 g.setAttribute('color',new THREE.BufferAttribute(ca,3));g.setAttribute('emi',new THREE.BufferAttribute(ea,3));g.setAttribute('rgh',new THREE.BufferAttribute(ra,1));return g;}
function flatten(parent,sub){sub.updateMatrix();for(const c of[...sub.children]){c.applyMatrix4(sub.matrix);parent.add(c);}parent.remove(sub);}

/* ---------- per-frame animation from simulation state ---------- */
const tmp=new V();
function moveTarget(f,m,P){const mt=f.mt;
 if(m.seq){let pz=m.seq[0][1];for(const[fr,nm]of m.seq)if(mt>=fr)pz=nm;return P[pz]||P.stance;}
 const p=m.p||['jabW','jab'];if(mt<m.first)return P[p[0]]||P.stance;if(mt<=m.last+Math.max(4,(m.f-m.last)*.45))return P[p[1]]||P.stance;return null;}
export function animate(rig,f,dt,time,ctx={}){const st=rig.state,H=rig.H,P=POSES;let tgt=P.stance,k=Math.min(1,dt*14),pitchT=0,yspinT=0,lie=0,flipT=null;
 if(f.st!==st.lastSt){if(f.st==='land')rig.squash(.18);if(f.st==='hit')rig.squash(.12);st.lastSt=f.st;}
 const bounce=f.def.bounce||0;
 switch(f.st){
  case 'idle':case 'intro':{tgt=P.stance;const b=Math.sin(time*(bounce?7:2.4)+st.bob);tgt={...tgt,y:tgt.y+(bounce?Math.abs(b)*.045-.03:b*.012),shL:tgt.shL+b*.04,shR:tgt.shR-b*.03,head:tgt.head-b*.02};if(bounce===2){tgt={...tgt,yaw:tgt.yaw+Math.sin(time*3.2)*.35,hpL:tgt.hpL+Math.sin(time*3.2)*.3,hpR:tgt.hpR-Math.sin(time*3.2)*.3}}break;}
  case 'walk':{const dir=f.inp.x>0?1:-1;st.ph=(st.ph||0)+dt*9*dir;const s=Math.sin(st.ph),c=Math.cos(st.ph);tgt={...P.stance,y:P.stance.y-Math.abs(c)*.03,hpL:P.stance.hpL+s*.28,hpR:P.stance.hpR-s*.28,knL:P.stance.knL+Math.max(0,c)*.5,knR:P.stance.knR+Math.max(0,-c)*.5};k=Math.min(1,dt*20);break;}
  case 'crouch':case 'jsq':tgt=P.crouch;k=Math.min(1,dt*28);break;
  case 'land':tgt=f.lag>6?P.land:P.crouch;k=Math.min(1,dt*30);break;
  case 'jump':tgt=f.vy>0?P.jumpUp:P.jumpFall;break;
  case 'dash':tgt=P.dash;k=Math.min(1,dt*22);break;
  case 'bdash':tgt=P.bdash;k=Math.min(1,dt*22);break;
  case 'ss':{st.ph=(st.ph||0)+dt*14;const s=Math.sin(st.ph);tgt={...P.ss,haL:P.ss.haL+s*.25,haR:P.ss.haR-s*.25};k=Math.min(1,dt*20);break;}
  case 'block':tgt=f.crouchB?P.blockL:P.blockH;k=Math.min(1,dt*40);break;
  case 'hit':case 'stagger':tgt=f.st==='stagger'?P.hitM:f.hitLv==='h'?P.hitH:f.hitLv==='l'?P.hitL:P.hitM;if(f.crouchB&&f.st==='hit')tgt={...P.crouch,lean:.5,head:.3};k=Math.min(1,dt*45);break;
  case 'sup':tgt=f.hitLv==='h'?P.hitH:P.hitM;k=Math.min(1,dt*45);break;
  case 'wall':tgt={...P.hitH,lean:-.2,head:-.3,shL:.2,shR:.2,abL:1.2,abR:1.2};k=Math.min(1,dt*30);break;
  case 'air':case 'kd':tgt=P.juggle;pitchT=-.45-Math.min(1,f.t/22)*(f.vy<0?1.05:.65);k=Math.min(1,dt*20);break;
  case 'down':tgt=P.down;lie=1;k=Math.min(1,dt*12);break;
  case 'getup':tgt=P.rise;k=Math.min(1,dt*10);break;
  case 'win':tgt=ctx.winPose==='bow'?P.bow:ctx.winPose==='w2'?P.win2:P.win1;k=Math.min(1,dt*6);if(tgt===P.win1)tgt={...tgt,y:tgt.y+Math.abs(Math.sin(time*4))*.03};break;
  case 'lose':tgt=P.lose;k=Math.min(1,dt*4);break;
  case 'throw':{const T=f.thr,kind=T?T.g.kind:'toss',p=f.thrP||0,br=T?T.g.br||0:0;
   if(!T||T.t<=br)tgt=P.grab;else if(kind==='toss')tgt=p<.4?P.grab:P.throwF;else if(kind==='slam')tgt=p<.35?P.carry:P.slamB;else if(kind==='knee')tgt=((T.t-br)%10)<5?P.knee:P.grab;
   else if(kind==='spin'){tgt=P.spinT;yspinT=p*Math.PI*4;}else if(kind==='pile')tgt=p<.75?P.carry:P.dblAxe;k=Math.min(1,dt*24);break;}
  case 'thrown':{const kind=f.thrK,p=f.thrP||0;tgt=P.juggle;
   if(kind==='toss')pitchT=-p*Math.PI*1.05;else if(kind==='slam')pitchT=p*Math.PI*1.05;else if(kind==='knee'){tgt=P.hitM;}else if(kind==='spin')pitchT=-1.35;else if(kind==='pile')pitchT=p<.85?Math.PI:Math.PI*(1-(p-.85)*4);k=Math.min(1,dt*24);break;}
  case 'atk':{const m=f.move;if(!m)break;const t=moveTarget(f,m,P);tgt=t||(f.y>0?P.jumpFall:P.stance);
   if(st.mv!==f.mname||f.mt<st.mt){st.mv=f.mname;rig.squash(.1);}st.mt=f.mt;
   k=Math.min(1,dt*(f.mt<m.first?22:46));
   if(m.spin&&f.mt>=m.spin[0]&&f.mt<=m.spin[1]+2)yspinT=Math.min(1,(f.mt-m.spin[0])/(m.spin[1]-m.spin[0]))*Math.PI*2*m.spin[2];
   if(m.flip&&f.mt>=m.flip[0]&&f.mt<=m.flip[1])flipT=-(f.mt-m.flip[0])/(m.flip[1]-m.flip[0])*Math.PI*2*m.flip[2];
   if(m.hand&&f.mt>=m.hand[0]&&f.mt<=m.hand[1]){flipT=Math.PI;tgt=m.sup?{...P.hand,haL:.9+Math.sin(time*20)*.3,haR:.9-Math.sin(time*20)*.3}:P.hand;}
   if(m.parry&&f.inWin(m.parry))tgt={...P.parry,y:P.parry.y+Math.sin(time*30)*.01};
   break;}
 }
 rig.setPose(tgt,k);rig.apply();
 // facing + spins
 const want=Math.atan2(f.fx,f.fz);let d=want-st.yaw;while(d>Math.PI)d-=Math.PI*2;while(d<-Math.PI)d+=Math.PI*2;st.yaw+=d*Math.min(1,dt*(f.st==='atk'?30:16));
 st.yspin=yspinT?yspinT:st.yspin*(1-Math.min(1,dt*18));rig.yawG.rotation.y=st.yaw+st.yspin;
 // pitch: knocked/lying bodies tip over, flips and handstands rotate the whole body round its middle
 if(flipT!==null){st.pitch=flipT;}else{const tg=lie?-1.48:pitchT;st.pitch+=(tg-st.pitch)*Math.min(1,dt*(lie?9:14));}
 rig.pitchG.rotation.x=st.pitch;st.lie+=((lie?1:0)-st.lie)*Math.min(1,dt*10);rig.body.position.y=-H*.4*st.lie*Math.min(1,Math.abs(st.pitch)/1.4);
 // squash & stretch spring
 st.squashV+=(-st.squash*240-st.squashV*14)*dt;st.squash+=st.squashV*dt;st.squash=cl(st.squash,-.25,.25);const sq=st.squash;rig.body.scale.set(1-sq*.35,1+sq*.7,1-sq*.35);
 // limb smear while a strike is active
 st.smear=Math.max(0,st.smear-dt*7);if(f.st==='atk'&&f.move&&f.move.h.some(h=>f.mt>=h.s-1&&f.mt<=h.e+1))st.smear=1;
 for(const n in rig.limbs){const Lb=rig.limbs[n],g=Lb.sh||Lb.hp;const on=f.st==='atk'&&f.move&&(f.move.lb||'hR')===n;const s=on?st.smear:0;g.scale.set(1-s*.06,1+s*.16,1-s*.06);}
 // face: blink, wince when hurt
 const F=rig.face;let ey=1;if(['hit','air','kd','wall','sup','thrown','down'].includes(f.st))ey=.25;if(f.st==='atk')ey=.75;F.blink-=dt;if(F.blink<0){if(F.blink<-.12)F.blink=2+Math.random()*3;else ey*=.1;}F.ey+=(ey-F.ey)*Math.min(1,dt*20);F.eyes.scale.y=Math.max(.08,F.ey);
 // cloth: coat tails trail the motion, cape ripples
 const fx=rig.fx,sw=Math.sin(time*3)*.06;
 for(const g of fx.tails){const lag=f.st==='atk'||f.st==='dash'?.55:f.st==='air'||f.st==='jump'?.9:.18;g.rotation.x+=((lag+sw)-g.rotation.x)*Math.min(1,dt*6);}
 if(fx.cape){const a=fx.cape.geometry.attributes.position,B=fx.cape.userData.base,act=f.st==='atk'||f.st==='dash'?1:.35;for(let i=0;i<a.count;i++){const y=B[i*3+1],x=B[i*3],dd=-y/(H*.78);a.setZ(i,-dd*dd*(.35+act*.4)-Math.sin(time*4+x*4+y*3)*.05*dd);}a.needsUpdate=true;fx.capeG.rotation.x=-.12*act;}}
