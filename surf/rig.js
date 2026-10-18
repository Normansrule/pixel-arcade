// SWELL GUARD — characters and boards. A character is ONE skinned mesh (one draw call): lathe torso and capsule limbs are
// merged with smooth two-bone weights through the waist, then posed by 17 bones (legs by two-bone IK so feet stay planted on
// the board or the sand). Beachgoers are the same body baked into static poses and instanced. Boards are lofted from a
// plan outline, rocker and a rounded rail section, with fins.
import * as THREE from '../vendor/three.module.min.js';
import {mergeGeometries} from './merge.js';
const V=THREE.Vector3,Q=THREE.Quaternion,E=THREE.Euler;
export const BONES=['root','spine','chest','neck','head','shL','elL','haL','shR','elR','haR','hipL','knL','ftL','hipR','knR','ftR'];
const B=Object.fromEntries(BONES.map((n,i)=>[n,i]));
// rest positions (mesh space, feet at y=0, facing +z, left = +x)
const REST={root:[0,.93,0],spine:[0,1.03,0],chest:[0,1.22,-.01],neck:[0,1.5,-.01],head:[0,1.57,0],shL:[.19,1.44,-.01],elL:[.21,1.15,-.01],haL:[.22,.89,0],shR:[-.19,1.44,-.01],elR:[-.21,1.15,-.01],haR:[-.22,.89,0],
 hipL:[.095,.92,0],knL:[.1,.49,.01],ftL:[.1,.07,-.02],hipR:[-.095,.92,0],knR:[-.1,.49,.01],ftR:[-.1,.07,-.02]};
const PARENT={root:null,spine:'root',chest:'spine',neck:'chest',head:'neck',shL:'chest',elL:'shL',haL:'elL',shR:'chest',elR:'shR',haR:'elR',hipL:'root',knL:'hipL',ftL:'knL',hipR:'root',knR:'hipR',ftR:'knR'};
const L1=.43,L2=.42; // thigh, shin
export const SKIN=['#f1c7a5','#e0ac83','#c68a5e','#9a633f','#6b4329'],HAIR=['#2a1d15','#5a3a22','#c9a46a','#1a1a1a','#8a4a24','#d8c49a'];

function colorGeo(g,col,rough,bone,bone2,split){const n=g.attributes.position.count,c=new Float32Array(n*3),r=new Float32Array(n),si=new Uint16Array(n*4),sw=new Float32Array(n*4),cc=new THREE.Color(col);
 const P=g.attributes.position;for(let i=0;i<n;i++){let C=cc,R=rough;if(typeof col==='function'){const o=col(P.getX(i),P.getY(i),P.getZ(i));C=o[0];R=o[1];}c[i*3]=C.r;c[i*3+1]=C.g;c[i*3+2]=C.b;r[i]=R;
  if(split){const w=split(P.getY(i));si[i*4]=bone;si[i*4+1]=bone2;sw[i*4]=1-w;sw[i*4+1]=w;}else{si[i*4]=bone;sw[i*4]=1;}}
 g.setAttribute('color',new THREE.BufferAttribute(c,3));g.setAttribute('rgh',new THREE.BufferAttribute(r,1));g.setAttribute('skinIndex',new THREE.BufferAttribute(si,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(sw,4));
 if(g.index)g=g.toNonIndexed();return g;}
// DS scales tessellation: 1 for live characters, lower for the baked background crowd
let DS=1;const sd=n=>Math.max(3,Math.round(n*DS));
const sg=(r,w,h,...a)=>new THREE.SphereGeometry(r,Math.max(4,Math.round(w*DS)),sd(h),...a);
const cap=(r,len,seg=8)=>new THREE.CapsuleGeometry(r,len,DS<1?2:3,Math.max(4,Math.round(seg*DS)));
function limb(a,b,r0,r1,seg=8){// tapered capsule from point a to b
 const A=new V(...a),Bv=new V(...b),d=Bv.clone().sub(A),len=d.length();seg=Math.max(4,Math.round(seg*DS));const g=new THREE.CylinderGeometry(r1,r0,len,seg,DS<1?1:3,false);const P=g.attributes.position;
 const top=sg(r1,seg/DS,4,0,Math.PI*2,0,Math.PI/2);top.translate(0,len/2,0);const bot=sg(r0,seg/DS,4,0,Math.PI*2,Math.PI/2,Math.PI/2);bot.translate(0,-len/2,0);
 let m=mergeGeometries([g.toNonIndexed(),top.toNonIndexed(),bot.toNonIndexed()]);m.applyQuaternion(new Q().setFromUnitVectors(new V(0,1,0),d.normalize()));m.translate((A.x+Bv.x)/2,(A.y+Bv.y)/2,(A.z+Bv.z)/2);return m;}
const C=c=>new THREE.Color(c);

// look: {skin, hair, top:'vest'|'tee'|'none'|'suit', topC, shorts, kid, female, glasses, cap}
export function bodyGeometry(look){const s=look.kid?.62:1,parts=[],sk=C(look.skin),sh=C(look.shorts),tp=C(look.topC||look.shorts),hr=C(look.hair);
 const top=look.top||'none',fem=!!look.female;
 // torso lathe: hips → waist → chest → shoulders → neck base; weights blend pelvis/spine/chest
 const prof=[[.001,.84],[.15,.86],[.17,.93],[.155,1.02],[.14,1.1],[.155,1.2],fem?[.17,1.28]:[.18,1.3],[.19,1.38],[.17,1.45],[.1,1.5],[.055,1.53]].map(([r,y])=>new THREE.Vector2(r,y));
 let t=new THREE.LatheGeometry(prof,16);t.scale(1,1,.66);if(fem){t.translate(0,0,0);}
 const tc=(x,y,z)=>{if(y<.99)return[sh,.85];if(top==='none')return[sk,.5];if(top==='suit')return[tp,.55];if(top==='vest'&&y>1.36&&Math.abs(x)>.12)return[sk,.5];return[tp,.8];};
 parts.push(colorGeo(t,tc,0,B.root,B.chest,y=>y<1.0?0:y>1.3?1:(y-1.0)/.3));
 if(fem&&top!=='suit'){const b=sg(.07,10,6);b.scale(1,.8,.9);const b2=b.clone();b.translate(.07,1.3,.075);b2.translate(-.07,1.3,.075);parts.push(colorGeo(b,tp,.8,B.chest),colorGeo(b2,tp,.8,B.chest));}
 // neck + head + face
 parts.push(colorGeo(limb([0,1.48,-.01],[0,1.6,0],.052,.048),sk,.5,B.neck));
 const hd=sg(.105,16,12);hd.scale(.95,1.18,1.05);hd.translate(0,1.69,.01);parts.push(colorGeo(hd,sk,.5,B.head));
 const jaw=sg(.08,10,6);jaw.scale(1,.8,1);jaw.translate(0,1.625,.035);parts.push(colorGeo(jaw,sk,.5,B.head));
 const nose=new THREE.ConeGeometry(.018,.05,6);nose.rotateX(Math.PI/2);nose.translate(0,1.68,.118);parts.push(colorGeo(nose,sk,.5,B.head));
 for(const sx of[-1,1]){const ear=sg(.024,6,4);ear.scale(.5,1,.8);ear.translate(sx*.1,1.685,.0);parts.push(colorGeo(ear,sk,.5,B.head));
  if(look.glasses){const gl=sg(.03,8,4);gl.scale(1.2,.75,.5);gl.translate(sx*.04,1.705,.1);parts.push(colorGeo(gl,'#101418',.15,B.head));}
  else{const ey=sg(.013,6,4);ey.translate(sx*.037,1.7,.098);parts.push(colorGeo(ey,'#1a1410',.3,B.head));}
  const br=new THREE.BoxGeometry(.045,.008,.01);br.translate(sx*.038,1.728,.103);parts.push(colorGeo(br,hr,.9,B.head));}
 if(look.glasses){const bar=new THREE.BoxGeometry(.2,.012,.012);bar.translate(0,1.71,.088);parts.push(colorGeo(bar,'#101418',.2,B.head));}
 // hair: cap over the top/back (+ ponytail or bun for long hair)
 const hc=sg(.113,14,8,0,Math.PI*2,0,Math.PI*.58);hc.scale(.98,1.12,1.08);hc.rotateX(-.35);hc.translate(0,1.705,-.008);parts.push(colorGeo(hc,hr,.95,B.head));
 if(look.long){const pt=limb([0,1.72,-.1],[0,1.5,-.16],.045,.03);parts.push(colorGeo(pt,hr,.95,B.head));}
 if(look.cap){const c=new THREE.CylinderGeometry(.118,.118,.07,14);c.translate(0,1.79,0);const v=new THREE.CylinderGeometry(.11,.11,.012,12,1,false,-Math.PI/2,Math.PI);v.scale(1,1,1.4);v.translate(0,1.76,.06);parts.push(colorGeo(c,look.cap,.8,B.head),colorGeo(v,look.cap,.8,B.head));}
 // arms
 const armTop=(top==='tee'||top==='suit')?tp:sk;
 for(const[sx,sh_,el,ha]of[[1,B.shL,B.elL,B.haL],[-1,B.shR,B.elR,B.haR]]){
  parts.push(colorGeo(limb([sx*.19,1.43,-.01],[sx*.21,1.16,-.01],.05,.042),(x,y)=>[y>1.33||top==='suit'?armTop:sk,.6],0,sh_));
  parts.push(colorGeo(limb([sx*.21,1.15,-.01],[sx*.22,.91,0],.04,.032),(x,y)=>[top==='suit'&&y>.96?tp:sk,.5],0,el));
  const hand=sg(.042,8,6);hand.scale(.62,1.25,.95);hand.translate(sx*.222,.85,.005);parts.push(colorGeo(hand,sk,.5,ha));}
 // legs (boardshorts to the knee)
 for(const[sx,hp,kn,ft]of[[1,B.hipL,B.knL,B.ftL],[-1,B.hipR,B.knR,B.ftR]]){
  const lowS=top==='suit'?.12:look.short?.78:.58;
  parts.push(colorGeo(limb([sx*.095,.93,0],[sx*.1,.49,.01],.082,.055),(x,y)=>[y>lowS?sh:sk,y>lowS?.85:.5],0,hp));
  parts.push(colorGeo(limb([sx*.1,.48,.01],[sx*.1,.09,-.02],.052,.036),(x,y)=>[top==='suit'?tp:sk,.5],0,kn));
  const ft_=new THREE.BoxGeometry(.085,.06,.24,2,1,3);const P=ft_.attributes.position;for(let i=0;i<P.count;i++){const z=P.getZ(i);P.setX(i,P.getX(i)*(z>.05?.85:1));P.setY(i,P.getY(i)*(z>.06?.7:1));}ft_.translate(sx*.1,.035,.05);
  parts.push(colorGeo(ft_,top==='suit'?tp:sk,.6,ft));}
 let g=mergeGeometries(parts);if(s!==1)g.scale(s,s,s);return g;}

export function bodyMaterial(){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,envMapIntensity:.8});
 m.onBeforeCompile=sh=>{sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float rgh;varying float vRgh;').replace('#include <begin_vertex>','#include <begin_vertex>\nvRgh=rgh;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nvarying float vRgh;').replace('#include <roughnessmap_fragment>','float roughnessFactor=vRgh;');};
 m.customProgramCacheKey=()=>'swellbody';return m;}

// ---------- skinned rig ----------
const _v=new V(),_v2=new V(),_q=new Q(),_q2=new Q(),DOWN=new V(0,-1,0);
export class Rig{
 constructor(look,mat){this.look=look;this.s=look.kid?.62:1;const s=this.s;this.bones=[];
  for(const n of BONES){const b=new THREE.Bone();b.name=n;const p=REST[n],pp=PARENT[n]?REST[PARENT[n]]:[0,0,0];b.position.set((p[0]-pp[0])*s,(p[1]-pp[1])*s,(p[2]-pp[2])*s);this.bones.push(b);if(PARENT[n])this.bones[B[PARENT[n]]].add(b);}
  this.geo=bodyGeometry(look);this.mesh=new THREE.SkinnedMesh(this.geo,mat);this.mesh.add(this.bones[0]);this.mesh.updateMatrixWorld(true);this.skel=new THREE.Skeleton(this.bones);this.mesh.bind(this.skel);
  this.mesh.castShadow=true;this.mesh.frustumCulled=false;this.root=new THREE.Group();this.root.add(this.mesh);this.b=Object.fromEntries(BONES.map((n,i)=>[n,this.bones[i]]));this.restRootY=REST.root[1]*s;}
 // pose: {rootY, rootQ (pelvis rotation), e:{bone:[x,y,z]}, feet:{L:[x,y,z],R:[x,y,z]} (mesh space) , footQ, knee:[x,y,z] hint}
 apply(P){const b=this.b,s=this.s;this.root.updateWorldMatrix(true,false);for(const n of BONES)if(n!=='root')b[n].quaternion.identity();
  b.root.position.set(0,P.rootY??this.restRootY,P.rootZ??0);if(P.rootX)b.root.position.x=P.rootX;b.root.rotation.set(...(P.root||[0,0,0]),'YXZ');
  if(P.e)for(const n in P.e){const r=P.e[n];b[n].rotation.set(r[0],r[1],r[2],'YXZ');}
  if(P.feet){this.mesh.updateMatrixWorld(true);for(const side of['L','R'])if(P.feet[side])this.ik(side,P.feet[side],P.knee||[0,0,1],P.footYaw?.[side]??0);}}
 ik(side,foot,hint,fyaw){const hip=this.b['hip'+side],kn=this.b['kn'+side],ft=this.b['ft'+side],s=this.s;
  // work in mesh space
  const inv=new THREE.Matrix4().copy(this.mesh.matrixWorld).invert();const hp=hip.getWorldPosition(new V()).applyMatrix4(inv);const F=new V(...foot);
  const d=F.clone().sub(hp);let len=d.length();const l1=L1*s,l2=L2*s;len=Math.min(len,(l1+l2)*.999);d.normalize();
  const a1=Math.acos(THREE.MathUtils.clamp((l1*l1+len*len-l2*l2)/(2*l1*len),-1,1));const K=new V(...hint);const perp=K.sub(d.clone().multiplyScalar(K.dot(d)));if(perp.lengthSq()<1e-6)perp.set(0,0,1);perp.normalize();
  const tdir=d.clone().multiplyScalar(Math.cos(a1)).add(perp.clone().multiplyScalar(Math.sin(a1)));const knee=hp.clone().add(tdir.clone().multiplyScalar(l1));const sdir=hp.clone().add(d.clone().multiplyScalar(len)).sub(knee).normalize();
  const parentQ=hip.parent.getWorldQuaternion(new Q()).premultiply(_q.setFromRotationMatrix(inv).normalize());// pelvis rotation in mesh space
  const qT=new Q().setFromUnitVectors(DOWN,tdir);// twist: keep the knee cap facing the hint
  hip.quaternion.copy(parentQ.clone().invert().multiply(qT));
  const qS=new Q().setFromUnitVectors(tdir,sdir).multiply(qT);kn.quaternion.copy(qT.clone().invert().multiply(qS));
  const qF=new Q().setFromEuler(new E(0,fyaw,0));ft.quaternion.copy(qS.clone().invert().multiply(qF));}
}

// ---------- poses (mesh space; character faces +z, left = +x) ----------
const lerp=(a,b,t)=>a+(b-a)*t;
export const POSE={
 stand:(t=0)=>({rootY:.93,e:{shL:[0,0,.08],shR:[0,0,-.08],elL:[-.15,0,0],elR:[-.15,0,0],head:[Math.sin(t*.5)*.05,Math.sin(t*.3)*.3,0]},feet:{L:[.11,.06,0],R:[-.11,.06,0]}}),
 // regular stance on a board running along +x (nose = +x): feet spread along x, knees flexed. c = crouch 0..1, lean = toe/heel lean, tw = upper body twist
 surf:(c=.3,lean=0,tw=0,arms=0,t=0)=>{const y=.86-c*.3;return{rootY:y,root:[lean*.35,tw*.25,lean*.15],
  e:{spine:[.25+c*.45,tw*.3,0],chest:[.08+c*.2,tw*.35,0],head:[-.35-c*.4,-.25-tw*.3,0],
   shL:[-.25-arms*.4,0,1.0+arms*.25+Math.sin(t*2)*.04],elL:[-.5,0,.1],shR:[.25+arms*.3,0,-.95-arms*.3],elR:[-.6,0,-.1]},
  feet:{L:[.3,.07,.02],R:[-.3,.07,-.02]},footYaw:{L:-1.25,R:-1.4},knee:[0,0,1]};},
 paddle:(t,str=1)=>{const a=t*5.2,l=Math.sin(a),r=Math.sin(a+Math.PI);const arm=(v)=>[-Math.PI*.5-Math.max(v,-.2)*1.2*str,0,0];
  return{rootY:.12,rootZ:-.55,root:[Math.PI/2-.1,0,Math.sin(a)*.05*str],e:{spine:[-.12,0,0],chest:[-.15,0,0],neck:[-.5,0,0],head:[-.45,Math.sin(a)*.1,0],
   shL:arm(l),shR:arm(r),elL:[-.25+Math.max(0,l)*.4,0,0],elR:[-.25+Math.max(0,r)*.4,0,0],hipL:[.08,0,.05+Math.sin(a*.5)*.03],hipR:[.08,0,-.05],knL:[.3+Math.sin(t*2)*.15,0,0],knR:[.3+Math.sin(t*2+1)*.15,0,0],ftL:[.9,0,0],ftR:[.9,0,0]}};},
 sit:(t)=>({rootY:.16,root:[-.08,0,0],e:{spine:[.1,0,0],head:[-.1,Math.sin(t*.4)*.4,0],shL:[-.25,0,.2],shR:[-.25,0,-.2],elL:[-.6,0,0],elR:[-.6,0,0],hipL:[-1.2,0,.45],hipR:[-1.2,0,-.45],knL:[1.4+Math.sin(t)*.1,0,0],knR:[1.4+Math.sin(t+2)*.1,0,0]}}),
 run:(t,sp=1)=>{const a=t*9*Math.min(1.2,.6+sp*.1),s=Math.sin(a),c=Math.cos(a),k=Math.min(1,sp/5);
  return{rootY:.9+Math.abs(c)*.05*k,e:{spine:[.12*k,s*.12*k,0],chest:[0,-s*.15*k,0],head:[-.1*k,s*.1*k,0],shL:[s*.9*k,0,.12],shR:[-s*.9*k,0,-.12],elL:[-.9*k-.2,0,0],elR:[-.9*k-.2,0,0],
   hipL:[-s*.75*k,0,.03],hipR:[s*.75*k,0,-.03],knL:[(.3+Math.max(0,-s)*1.1+Math.max(0,c)*.2)*k,0,0],knR:[(.3+Math.max(0,s)*1.1+Math.max(0,-c)*.2)*k,0,0],ftL:[-.15*k,0,0],ftR:[-.15*k,0,0]}};},
 tread:(t,help=0)=>{const a=t*2.4;const up=help>.5;return{rootY:-.55,e:{spine:[.05,0,0],head:[-.15+(up?.2:0),Math.sin(t*.7)*.3,0],
  shL:up?[-.2,0,2.4+Math.sin(t*9)*.35]:[-.3,0,1.2+Math.sin(a)*.35],shR:up?[-.2,0,-2.4-Math.sin(t*9+1)*.35]:[-.3,0,-1.2-Math.sin(a+1)*.35],elL:[up?-.3:-.6,0,0],elR:[up?-.3:-.6,0,0],
  hipL:[-.3+Math.sin(a)*.4,0,.15],hipR:[-.3-Math.sin(a)*.4,0,-.15],knL:[.8+Math.sin(a)*.3,0,0],knR:[.8-Math.sin(a)*.3,0,0]}};},
 swim:(t)=>{const a=t*3.5;return{rootY:-.12,rootZ:0,root:[1.25,0,Math.sin(a)*.2],e:{neck:[-.6,0,0],head:[-.5,Math.sin(a)*.4,0],shL:[-Math.PI*.5-Math.sin(a)*1.4,0,.2],shR:[-Math.PI*.5+Math.sin(a)*1.4,0,-.2],elL:[-.3,0,0],elR:[-.3,0,0],hipL:[Math.sin(a*2)*.3,0,.05],hipR:[-Math.sin(a*2)*.3,0,-.05]}};},
 tumble:(t)=>({rootY:.4,root:[t*7,t*3.3,t*5],e:{spine:[.6,0,0],shL:[-2,0,1.5],shR:[-1.5,0,-2],elL:[-1,0,0],elR:[-.6,0,0],hipL:[-1.2,0,.6],hipR:[-.5,0,-.5],knL:[1.6,0,0],knR:[1.1,0,0]}}),
 lie:(t)=>({rootY:.12,root:[-Math.PI/2+.02,0,0],e:{head:[-.2,0,0],shL:[0,0,.35],shR:[0,0,-.35],hipL:[0,0,.08],hipR:[0,0,-.08]}}),
 lieFront:()=>({rootY:.12,root:[Math.PI/2-.03,0,0],e:{head:[-.6,.5,0],shL:[-2.6,0,.5],shR:[-2.6,0,-.5],elL:[-1.4,0,0],elR:[-1.4,0,0]}}),
 beachSit:()=>({rootY:.13,e:{spine:[-.25,0,0],head:[.15,.3,0],shL:[.5,0,.35],shR:[.5,0,-.35],elL:[-.1,0,0],elR:[-.1,0,0],hipL:[-1.35,0,.12],hipR:[-1.35,0,-.12],knL:[1.1,0,0],knR:[1.4,0,0]}}),
 cry:(t)=>({rootY:.93,e:{spine:[.15,0,0],head:[.35,Math.sin(t*1.5)*.25,0],shL:[-1.6,0,-.2+Math.sin(t*6)*.05],shR:[-1.6,0,.2],elL:[-1.9,0,0],elR:[-1.9,0,0]},feet:{L:[.09,.06,0],R:[-.09,.06,0]}}),
 search:(t)=>({rootY:.93,e:{head:[-.05,Math.sin(t*1.3)*.9,0],shL:[-2.6+Math.sin(t*5)*.25,0,.5],shR:[-.2,0,-.15],elL:[-.3,0,0],elR:[-.2,0,0]},feet:{L:[.11,.06,0],R:[-.11,.06,0]}}),
};
export function blendPose(a,b,t){const o={rootY:lerp(a.rootY??.93,b.rootY??.93,t),rootZ:lerp(a.rootZ||0,b.rootZ||0,t),root:[0,1,2].map(i=>lerp((a.root||[0,0,0])[i],(b.root||[0,0,0])[i],t)),e:{}};
 const ks=new Set([...Object.keys(a.e||{}),...Object.keys(b.e||{})]);for(const k of ks){const x=(a.e||{})[k]||[0,0,0],y=(b.e||{})[k]||[0,0,0];o.e[k]=[lerp(x[0],y[0],t),lerp(x[1],y[1],t),lerp(x[2],y[2],t)];}
 const f=t<.5?a:b;if(f.feet){o.feet=f.feet;o.footYaw=f.footYaw;o.knee=f.knee;}return o;}

// bake a posed body into static geometry (for instanced beachgoers)
export function bakePose(look,pose,detail=1){const mat=bodyMaterial();DS=detail;let r;try{r=new Rig(look,mat);}finally{DS=1;}r.apply(pose);r.root.updateMatrixWorld(true);r.skel.update();
 const g=r.geo.clone(),P=g.attributes.position,N=g.attributes.normal,si=g.attributes.skinIndex,sw=g.attributes.skinWeight;const bm=r.skel.boneMatrices,M=new THREE.Matrix4(),M2=new THREE.Matrix4(),v=new V(),n=new V(),acc=new V(),accN=new V();
 const nm=new THREE.Matrix3();for(let i=0;i<P.count;i++){acc.set(0,0,0);accN.set(0,0,0);for(let k=0;k<2;k++){const w=sw.getComponent(i,k);if(!w)continue;M.fromArray(bm,si.getComponent(i,k)*16);v.fromBufferAttribute(P,i).applyMatrix4(M);acc.addScaledVector(v,w);nm.getNormalMatrix(M);n.fromBufferAttribute(N,i).applyMatrix3(nm);accN.addScaledVector(n,w);}
  P.setXYZ(i,acc.x,acc.y,acc.z);accN.normalize();N.setXYZ(i,accN.x,accN.y,accN.z);}
 g.deleteAttribute('skinIndex');g.deleteAttribute('skinWeight');mat.dispose();return g;}

// ---------- surfboard ----------
export function boardGeometry(L=2.15,W=.54,T=.07){const nu=34,nv=18,P=[],UV=[],I=[];
 const hw=u=>W/2*(u<.42?.3+.7*Math.sin(Math.min(1,u/.42)*Math.PI/2)**.8:Math.pow(Math.max(0,Math.cos((u-.42)/.58*Math.PI/2)),.62));
 const rock=u=>.13*Math.pow(Math.max(u-.62,0)/.38,2)+.035*Math.pow(Math.max(.18-u,0)/.18,2);
 const th=u=>T*(.32+.68*Math.pow(Math.sin(Math.PI*Math.min(.98,Math.max(.03,u))),.55));
 for(let i=0;i<=nu;i++){const u=i/nu,w=Math.max(hw(u),.004),r=rock(u),t=th(u);for(let j=0;j<=nv;j++){const ph=j/nv*Math.PI*2,c=Math.cos(ph),s=Math.sin(ph);
   const x=w*Math.sign(c)*Math.pow(Math.abs(c),.55),y=r+t*.5*Math.sign(s)*Math.pow(Math.abs(s),s>0?.9:.45)*(s>0?1:.7);P.push(x,y,(u-.5)*L);UV.push(u,x/(2*w)+.5);}}
 for(let i=0;i<nu;i++)for(let j=0;j<nv;j++){const a=i*(nv+1)+j,b=a+nv+1;I.push(a,a+1,b,a+1,b+1,b);}
 // tail cap
 const c0=P.length/3;P.push(0,rock(0),-L/2-.005);UV.push(0,.5);for(let j=0;j<nv;j++)I.push(c0,j+1,j);
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();return g;}
export function makeBoard(tex,finC='#22262c'){const g=new THREE.Group();const m=new THREE.MeshPhysicalMaterial({map:tex,roughness:.28,clearcoat:.8,clearcoatRoughness:.15,metalness:0});
 const b=new THREE.Mesh(boardGeometry(),m);b.castShadow=true;g.add(b);
 const fs=new THREE.Shape();fs.moveTo(0,0);fs.lineTo(.11,0);fs.quadraticCurveTo(.03,-.04,-.01,-.12);fs.lineTo(0,0);const fg=new THREE.ExtrudeGeometry(fs,{depth:.008,bevelEnabled:false});fg.translate(0,0,-.004);fg.rotateY(Math.PI/2);
 const parts=[];for(const[x,z,ry]of[[0,-.95,0],[.17,-.82,.08],[-.17,-.82,-.08]]){const f=fg.clone();f.rotateY(ry);f.translate(x,.0,z);parts.push(f);}
 const fm=new THREE.Mesh(mergeGeometries(parts),new THREE.MeshStandardMaterial({color:finC,roughness:.4}));fm.castShadow=true;g.add(fm);return g;}
