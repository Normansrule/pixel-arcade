// NIGHTFALL — procedural skinned humanoids: rigid parts merged into ONE SkinnedMesh per character (one draw call),
// vertex-coloured outfits, ember eyes, hit flash, moonlight rim and an ash-dissolve shader for deaths.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,C=THREE.Color;

const BONES=[['root',null,0,0,0],['hips','root',0,.95,0],['spine','hips',0,.12,0],['chest','spine',0,.2,0],['neck','chest',0,.28,0],['head','neck',0,.08,0],['jaw','head',0,.05,.02],
 ['shL','chest',.21,.22,0],['elL','shL',0,-.29,0],['haL','elL',0,-.26,0],['shR','chest',-.21,.22,0],['elR','shR',0,-.29,0],['haR','elR',0,-.26,0],
 ['thL','hips',.1,-.04,0],['knL','thL',0,-.43,0],['ftL','knL',0,-.43,0],['thR','hips',-.1,-.04,0],['knR','thR',0,-.43,0],['ftR','knR',0,-.43,0]];
export const BONE_NAMES=BONES.map(b=>b[0]);

const cap=(r,l,rs=8)=>new THREE.CapsuleGeometry(r,l,3,rs);
const box=(w,h,d)=>new THREE.BoxGeometry(w,h,d);
const sph=(r,ws=12,hs=9,ts=0,tl=Math.PI)=>new THREE.SphereGeometry(r,ws,hs,0,Math.PI*2,ts,tl);
let grimeTex=null;export function setGrime(t){grimeTex=t;}

export function humanMaterial(U){const m=new THREE.MeshStandardMaterial({vertexColors:true,map:grimeTex,roughness:.85,metalness:.02});m.envMapIntensity=.25;
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,U);
  sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float aEm;varying float vEm;varying vec3 vLp;').replace('#include <skinning_vertex>','#include <skinning_vertex>\nvEm=aEm;vLp=transformed;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform float uDis,uFlash,uH;uniform vec3 uEye,uRim,uEmber;varying float vEm;varying vec3 vLp;\nfloat h3n(vec3 p){return fract(sin(dot(p,vec3(12.9898,78.233,37.719)))*43758.5453);}')
   .replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nfloat dn=h3n(floor(vLp*14.))*.55+clamp(vLp.y/uH,0.,1.)*.45;float dcut=1.-uDis*1.1;if(uDis>0.&&dn>dcut)discard;')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=uEye*vEm+vec3(1.,.62,.36)*uFlash;{float fr=1.-abs(dot(normal,normalize(vViewPosition)));totalEmissiveRadiance+=uRim*pow(fr,3.);}if(uDis>0.&&dn>dcut-.06)totalEmissiveRadiance+=uEmber*4.;');};
 m.customProgramCacheKey=()=>'nf-human';return m;}

// outfit presets: colours are linear-ish sRGB hex
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[(Math.random()*a.length)|0];
const SKINZ=[0x7a8a76,0x8a8f80,0x6e7c74,0x96907e,0x7c8670,0x8c8a8e];
const SHIRT=[0x5a3a2a,0x3a4a5a,0x6a5a3a,0x4a5040,0x7a2a22,0x30383e,0x584838];
const PANTS=[0x2a3448,0x3a3428,0x2c2c2c,0x4a3e2e,0x22303a];
export function outfit(kind){
 if(kind==='ally')return{kind,skin:0xc89a7a,shirt:0x4a5634,sleeve:0x4a5634,pants:0x2e3036,shoes:0x1e1a16,hair:0x2a2018,cap:0x3a4228,pack:0x5a4a30,eyes:0x101010,long:true};
 if(kind==='boss')return{kind,skin:0x6a7a6a,shirt:0x1e1c1a,sleeve:0x1e1c1a,pants:0x1a1816,shoes:0x14110e,hair:0x0,coat:0x2a241e,hat:0x16130f,eyes:0xffffff,long:true,scale:2.15};
 const lab=Math.random()<.22;const o={kind,skin:pick(SKINZ),shirt:lab?0xb8b8ac:pick(SHIRT),pants:pick(PANTS),shoes:0x1a1612,hair:Math.random()<.6?pick([0x1a1410,0x3a2a1a,0x5a5248,0x2a2420]):-1,eyes:0xffffff,long:Math.random()<.5,lab,overall:!lab&&Math.random()<.25,scale:rnd(.93,1.07)};
 o.sleeve=o.long?o.shirt:o.skin;if(o.overall)o.pants=0x2a3a5a;if(kind==='brute'){o.scale=1.28;o.shirt=0x3a3632;o.long=true;o.sleeve=o.shirt;o.lab=false;}if(kind==='runner'){o.scale=rnd(.92,1.0);}
 return o;}

export function buildHumanoid(o){const bones={},list=[];for(const[n,p,x,y,z]of BONES){const b=new THREE.Bone();b.name=n;b.position.set(x,y,z);if(p)bones[p].add(b);bones[n]=b;list.push(b);}
 bones.root.updateMatrixWorld(true);const parts=[];const P=(bone,geo,col,em=0,x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>{geo.applyMatrix4(new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz)));parts.push({bone,geo,col:new C(col),em});};
 const dk=(c,k=.7)=>new C(c).multiplyScalar(k).getHex();const Z=o.kind!=='ally';const bulk=o.kind==='brute'?1.25:o.kind==='boss'?1.1:1;
 // torso
 P('hips',box(.34*bulk,.2,.21*bulk),o.pants,0,0,-.02,0);
 P('spine',cap(.14,.1),o.overall?o.pants:o.shirt,0,0,.08,0,0,0,0,1.15*bulk,1,.82*bulk);
 P('chest',sph(.25,14,10),o.shirt,0,0,.12,0,0,0,0,1.0*bulk,.75,.58*bulk);
 for(const s of[-1,1])P('chest',sph(.085,10,8),o.shirt,0,s*.2*bulk,.2,0);
 if(o.overall){P('chest',box(.3,.2,.02),o.pants,0,0,.05,.14);for(const s of[-1,1])P('chest',box(.04,.3,.02),o.pants,0,s*.1,.2,.12,.15);}
 P('neck',new THREE.CylinderGeometry(.052,.06,.14,8),o.skin,0,0,.04,0);
 // head
 const hs=o.kind==='boss'?.9:1;P('head',sph(.115,14,11),o.skin,0,0,.1,.01,0,0,0,.95*hs,1.1*hs,1.02*hs);
 P('head',box(.2,.035,.06),dk(o.skin,.8),0,0,.15,.085);P('head',box(.035,.06,.04),dk(o.skin,.9),0,0,.095,.115);
 for(const s of[-1,1]){P('head',box(.03,.055,.03),o.skin,0,s*.112,.1,0);
  if(Z){P('head',sph(.032,8,6),0x0a0806,0,s*.043,.122,.088);P('head',sph(.022,8,6),o.eyes,1,s*.043,.122,.1);}else{P('head',sph(.016,8,6),0xf0f0f0,0,s*.04,.12,.1);P('head',sph(.009,6,5),0x201810,0,s*.04,.12,.112);}}
 if(o.hair>=0&&o.hair!==undefined&&!o.cap&&!o.hat){P('head',sph(.122,12,8,0,Math.PI*.42),o.hair,0,0,.12,-.005,-.15);}
 if(o.cap){P('head',sph(.125,12,8,0,Math.PI*.5),o.cap,0,0,.12,0);P('head',box(.2,.015,.11),o.cap,0,0,.16,.12,-.15);}
 if(o.hat){P('head',new THREE.CylinderGeometry(.27,.27,.02,16),o.hat,0,0,.19,0);P('head',new THREE.CylinderGeometry(.1,.125,.16,12),o.hat,0,0,.27,0);}
 P('jaw',box(.14,.045,.1),dk(o.skin,.92),0,0,-.02,.05);if(Z)for(const s of[-1,0,1])P('jaw',box(.012,.02,.01),0xc8c0a0,0,s*.03,.005,.1);
 // arms
 for(const[sd,s]of[['L',1],['R',-1]]){P('sh'+sd,cap(.052*bulk,.2),o.shirt,0,0,-.14,0);P('el'+sd,cap(.045*bulk,.19),o.sleeve,0,0,-.13,0);
  P('ha'+sd,box(.075,.09,.035),o.kind==='ally'?0x2a2420:o.skin,0,0,-.06,0);for(let f=-1;f<=1;f++)P('ha'+sd,box(.018,.075,.02),o.kind==='ally'?0x2a2420:o.skin,0,f*.024,-.13,0,Z?.25:0);
  P('th'+sd,cap(.075*bulk,.26),o.pants,0,0,-.21,0);P('kn'+sd,cap(.06*bulk,.28),o.pants,0,0,-.21,0);P('ft'+sd,box(.1,.08,.24),o.shoes,0,0,-.01,.05);
  if(o.kind==='ally')P('kn'+sd,new THREE.CylinderGeometry(.068,.072,.16,8),o.shoes,0,0,-.33,0);}
 // tattered cloth for the undead
 if(Z&&o.kind!=='boss'){for(let k=0;k<5;k++){const x=rnd(-.18,.18);P('spine',box(.05,rnd(.08,.2),.012),dk(o.shirt,.8),0,x,-.06,(Math.random()<.5?.12:-.12),rnd(-.2,.2),0,rnd(-.3,.3));}}
 if(o.lab||o.coat){const c=o.coat||o.shirt;const L=o.coat?.75:.55;for(const s of[-1,1])P('hips',box(.17*bulk,L,.02),c,0,s*.09*bulk,-L/2+.05,.13*bulk,-.08,0,s*.06);P('hips',box(.36*bulk,L+.05,.02),c,0,0,-L/2+.03,-.13*bulk,.08);
  P('chest',box(.08,.3,.02),dk(c,.85),0,.08,.05,.15,0,0,.2);P('chest',box(.08,.3,.02),dk(c,.85),0,-.08,.05,.15,0,0,-.2);}
 if(o.pack)P('chest',box(.3,.36,.16),o.pack,0,0,.05,-.22);
 // merge
 let n=0;for(const p of parts){if(p.geo.index)p.geo=p.geo.toNonIndexed();n+=p.geo.attributes.position.count;}
 const Pp=new Float32Array(n*3),Nn=new Float32Array(n*3),Uu=new Float32Array(n*2),Cc=new Float32Array(n*3),Si=new Uint16Array(n*4),Sw=new Float32Array(n*4),Em=new Float32Array(n);let off=0;const nm=new THREE.Matrix3(),tv=new V();
 for(const p of parts){const b=bones[p.bone],bi=list.indexOf(b);const g=p.geo;const M=b.matrixWorld;nm.getNormalMatrix(M);const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;const vary=.9+Math.random()*.2;
  for(let i=0;i<pa.count;i++){tv.set(pa.getX(i),pa.getY(i),pa.getZ(i)).applyMatrix4(M);Pp.set([tv.x,tv.y,tv.z],(off+i)*3);tv.set(na.getX(i),na.getY(i),na.getZ(i)).applyMatrix3(nm).normalize();Nn.set([tv.x,tv.y,tv.z],(off+i)*3);
   Uu.set([ua?ua.getX(i)*.5+bi*.13:0,ua?ua.getY(i)*.5:0],(off+i)*2);Cc.set([p.col.r*vary,p.col.g*vary,p.col.b*vary],(off+i)*3);Si[(off+i)*4]=bi;Sw[(off+i)*4]=1;Em[off+i]=p.em;}off+=pa.count;g.dispose();}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(Pp,3));geo.setAttribute('normal',new THREE.BufferAttribute(Nn,3));geo.setAttribute('uv',new THREE.BufferAttribute(Uu,2));geo.setAttribute('color',new THREE.BufferAttribute(Cc,3));
 geo.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(Si,4));geo.setAttribute('skinWeight',new THREE.BufferAttribute(Sw,4));geo.setAttribute('aEm',new THREE.BufferAttribute(Em,1));geo.computeBoundingSphere();geo.boundingSphere.radius*=1.6;
 const U={uDis:{value:0},uFlash:{value:0},uH:{value:1.85},uEye:{value:o.kind==='ally'?new C(0,0,0):o.kind==='boss'?new C(3.5,2.2,.6):new C(3.2,1.1,.25)},uRim:{value:new C(.15,.19,.3)},uEmber:{value:new C(1,.35,.08)}};
 const mat=humanMaterial(U);const mesh=new THREE.SkinnedMesh(geo,mat);mesh.add(bones.root);const sk=new THREE.Skeleton(list);mesh.bind(sk);mesh.castShadow=true;mesh.receiveShadow=true;
 const root=new THREE.Group();root.add(mesh);const s=o.scale||1;mesh.scale.setScalar(s);
 // rest pose (what the animation adds to)
 const rest={};for(const b of list)rest[b.name]=b.position.clone();
 return{root,mesh,bones,U,mat,scale:s,rest,o};}

// world-space hit spheres from bone transforms
const HIT=[['head',0,.1,.02,.15,'head'],['chest',0,.12,0,.26,'body'],['spine',0,0,0,.2,'body'],['hips',0,-.05,0,.2,'body'],['knL',0,-.1,0,.12,'leg'],['knR',0,-.1,0,.12,'leg'],['thL',0,-.2,0,.12,'leg'],['thR',0,-.2,0,.12,'leg']];
export function hitSpheres(h,out){if(!out){out=HIT.map(e=>({p:new V(),r:e[4],part:e[5]}));}h.root.updateMatrixWorld(true);const sc=h.scale*(h.root.scale.x||1);
 HIT.forEach((e,k)=>{out[k].p.set(e[1],e[2],e[3]).applyMatrix4(h.bones[e[0]].matrixWorld);out[k].r=e[4]*sc;});return out;}
