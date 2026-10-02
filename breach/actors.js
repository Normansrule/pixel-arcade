// BREACH POINT — procedural operator rigs (articulated limbs, IK arms, run/walk/crouch/plant/death) + hit volumes.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(r1,r2,h,s=8)=>new THREE.CylinderGeometry(r1,r2,h,s),SP=(r,a=12,b=10)=>new THREE.SphereGeometry(r,a,b);
const UA=.29,LA=.27,TH=.45,SH=.45;
function merge(parts){const pos=[],nor=[],idx=[];let off=0;for(const{g,m}of parts){const G=g.index?g:g;if(m)G.applyMatrix4(m);const p=G.attributes.position.array,n=G.attributes.normal.array;pos.push(...p);nor.push(...n);const ix=G.index?G.index.array:[...Array(p.length/3).keys()];for(const i of ix)idx.push(i+off);off+=p.length/3;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setIndex(idx);return out;}
// merge with per-part vertex colours (one draw call per bone); parts: [geometry, THREE.Color, optional Matrix4]
function cmerge(parts){const pos=[],nor=[],col=[],idx=[];let off=0;const v=new V(),n=new V(),nm=new THREE.Matrix3();for(const[g,c,m]of parts){const p=g.attributes.position.array,q=g.attributes.normal.array;if(m)nm.getNormalMatrix(m);
  for(let i=0;i<p.length;i+=3){v.set(p[i],p[i+1],p[i+2]);n.set(q[i],q[i+1],q[i+2]);if(m){v.applyMatrix4(m);n.applyMatrix3(nm).normalize();}pos.push(v.x,v.y,v.z);nor.push(n.x,n.y,n.z);col.push(c.r,c.g,c.b);}
  const ix=g.index?g.index.array:[...Array(p.length/3).keys()];for(const i of ix)idx.push(i+off);off+=p.length/3;}
 const out=new THREE.BufferGeometry();out.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));out.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));out.setAttribute('color',new THREE.Float32BufferAttribute(col,3));out.setIndex(idx);return out;}
const SETS={};
function rigSet(side,variant){const k=side+variant;if(SETS[k])return SETS[k];const{G}=kit();const C=h=>new THREE.Color(h).convertSRGBToLinear();const atk=side==='atk';
 const uni=C(atk?0x8a7356:0x56698a),vest=C(atk?0x4a3b2a:0x34404e),skin=C([0xb48468,0x7a5440,0xd8aa88][variant%3]),helm=C(atk?0x2c2a26:0x45505e),mask=C(atk?0x1a1a1a:0x0a0c10),band=C(atk?0xff6a1a:0x3fa9ff),glove=C(0x1e1c18),boot=C(0x2a2018);
 const T=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
 SETS[k]={spine:cmerge([[G.torso,uni],[G.vest,vest]]),neck:cmerge([[G.head,skin],[atk?G.cap:G.helmet,helm],[atk?G.mask:G.visor,mask]]),upperR:cmerge([[G.upper,uni],[G.band,band]]),upperL:cmerge([[G.upper,uni]]),
  lower:cmerge([[G.lower,uni],[G.hand,glove,T(0,-LA,0)]]),thigh:cmerge([[G.thigh,uni]]),shin:cmerge([[G.shin,uni],[G.boot,boot,T(0,-SH,0)]])};return SETS[k];}
const RIGMAT=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.04});
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(1,1,1));

let KIT=null;
function kit(){if(KIT)return KIT;const std=o=>new THREE.MeshStandardMaterial(o);
 const G={torso:merge([{g:BX(.38,.5,.22),m:M4(0,.27,0)},{g:BX(.3,.12,.2),m:M4(0,.02,0)}]),
  vest:merge([{g:BX(.44,.38,.3),m:M4(0,.3,.01)},{g:BX(.1,.12,.07),m:M4(-.12,.17,.17)},{g:BX(.1,.12,.07),m:M4(0,.17,.17)},{g:BX(.1,.12,.07),m:M4(.12,.17,.17)},{g:BX(.28,.32,.14),m:M4(0,.32,-.21)}]),
  head:merge([{g:SP(.105),m:M4(0,.11,.01)},{g:CY(.05,.055,.1),m:M4(0,0,0)}]),
  helmet:merge([{g:new THREE.SphereGeometry(.13,14,8,0,Math.PI*2,0,Math.PI*.52),m:M4(0,.14,0)},{g:BX(.2,.05,.03),m:M4(0,.13,.12)}]),
  visor:merge([{g:BX(.2,.07,.03),m:M4(0,.13,.115)}]),
  cap:merge([{g:new THREE.SphereGeometry(.118,12,8,0,Math.PI*2,0,Math.PI*.55),m:M4(0,.12,0)},{g:BX(.18,.02,.11),m:M4(0,.13,.12,-.15)}]),
  mask:merge([{g:BX(.2,.1,.05),m:M4(0,.06,.09)}]),
  upper:(()=>{const g=CY(.058,.05,UA);g.translate(0,-UA/2,0);return g;})(),lower:(()=>{const g=CY(.05,.042,LA);g.translate(0,-LA/2,0);return g;})(),
  hand:(()=>{const g=BX(.07,.09,.09);g.translate(0,-.03,0);return g;})(),thigh:(()=>{const g=CY(.085,.07,TH);g.translate(0,-TH/2,0);return g;})(),shin:(()=>{const g=CY(.068,.055,SH);g.translate(0,-SH/2,0);return g;})(),
  boot:(()=>{const g=BX(.11,.1,.26);g.translate(0,-.05,.05);return g;})(),band:(()=>{const g=CY(.062,.062,.06,8);g.translate(0,-.08,0);return g;})(),
  pack:merge([{g:BX(.26,.3,.12),m:M4(0,.3,-.23)},{g:CY(.02,.02,.2),m:M4(.08,.45,-.24)}]),
  guns:{rifle:merge([{g:BX(.06,.1,.5),m:M4(0,0,.1)},{g:CY(.016,.016,.34),m:M4(0,.02,.5,Math.PI/2)},{g:BX(.045,.16,.07),m:M4(0,-.11,.13,.25)},{g:BX(.05,.09,.22),m:M4(0,-.01,-.22)}]),
   smg:merge([{g:BX(.06,.1,.36),m:M4(0,0,.06)},{g:CY(.016,.016,.16),m:M4(0,.02,.3,Math.PI/2)},{g:BX(.04,.18,.05),m:M4(0,-.12,.1)},{g:BX(.04,.06,.16),m:M4(0,-.01,-.17)}]),
   sniper:merge([{g:BX(.06,.1,.6),m:M4(0,0,.1)},{g:CY(.015,.015,.46),m:M4(0,.02,.6,Math.PI/2)},{g:CY(.03,.03,.28),m:M4(0,.1,.1,Math.PI/2)},{g:BX(.05,.11,.26),m:M4(0,-.02,-.28)}]),
   shotgun:merge([{g:BX(.06,.09,.5),m:M4(0,0,.1)},{g:CY(.022,.022,.4),m:M4(0,.02,.5,Math.PI/2)},{g:CY(.02,.02,.3),m:M4(0,-.04,.42,Math.PI/2)},{g:BX(.05,.1,.24),m:M4(0,-.02,-.24)}]),
   pistol:merge([{g:BX(.04,.06,.2),m:M4(0,0,.06)},{g:BX(.035,.11,.05),m:M4(0,-.07,0,.2)}]),
   knife:merge([{g:BX(.02,.04,.2),m:M4(0,0,.12)},{g:BX(.03,.03,.1),m:M4(0,0,-.02)}]),
   nade:merge([{g:SP(.045,8,6),m:M4(0,0,.03)}]),bomb:merge([{g:BX(.22,.12,.16),m:M4(0,0,.06)}])}};
 const M={skin:[std({color:0xb48468,roughness:.7}),std({color:0x7a5440,roughness:.7}),std({color:0xd8aa88,roughness:.7})],gun:std({color:0x1a1b1e,roughness:.45,metalness:.7}),glove:std({color:0x1e1c18,roughness:.85}),boot:std({color:0x2a2018,roughness:.85}),
  atkUni:std({color:0x8a7356,roughness:.9}),atkVest:std({color:0x4a3b2a,roughness:.85}),atkCap:std({color:0x2c2a26,roughness:.9}),atkBand:std({color:0xff6a1a,emissive:0x501800,roughness:.6}),
  defUni:std({color:0x3a4658,roughness:.85}),defVest:std({color:0x252b33,roughness:.8}),defHelm:std({color:0x2e3540,roughness:.55,metalness:.25}),defBand:std({color:0x3fa9ff,emissive:0x0a2a50,roughness:.6}),
  visor:std({color:0x0a0c10,roughness:.1,metalness:.9}),mask:std({color:0x1a1a1a,roughness:.9}),bomb:std({color:0x5a3a22,roughness:.7}),
  shadow:new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.38,depthWrite:false})};
 KIT={G,M};return KIT;}

const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole){_d.subVectors(T,S);let d=_d.length();d=Math.min(d,UA+LA-.005);_d.normalize();const x=(UA*UA-LA*LA+d*d)/(2*d),h=Math.sqrt(Math.max(0,UA*UA-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}

const blobGeo=(()=>{const g=new THREE.CircleGeometry(.42,16);g.rotateX(-Math.PI/2);return g;})();
export class Rig{
 constructor(side,variant=0){const{G,M}=kit();this.root=new THREE.Group();this.side=side;const S=rigSet(side,variant);const mk=(g,m,p,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
  this.hips=new THREE.Group();this.hips.position.y=.95;this.root.add(this.hips);
  this.spine=new THREE.Group();this.spine.position.y=.05;this.hips.add(this.spine);mk(S.spine,RIGMAT,this.spine);
  this.pack=mk(G.pack,M.bomb,this.spine);this.pack.visible=false;
  this.neck=new THREE.Group();this.neck.position.set(0,.55,0);this.spine.add(this.neck);mk(S.neck,RIGMAT,this.neck);
  this.arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.23,.47,0);this.spine.add(sh);const up=new THREE.Group();sh.add(up);mk(s>0?S.upperR:S.upperL,RIGMAT,up);
   const lo=new THREE.Group();lo.position.y=-UA;up.add(lo);mk(S.lower,RIGMAT,lo);this.arms.push({sh,up,lo,s});}
  this.legs=[];for(const s of[-1,1]){const th=new THREE.Group();th.position.set(s*.11,0,0);this.hips.add(th);mk(S.thigh,RIGMAT,th);const kn=new THREE.Group();kn.position.y=-TH;th.add(kn);mk(S.shin,RIGMAT,kn);this.legs.push({th,kn});}
  this.gun=new THREE.Group();this.gun.position.set(-.1,.36,.2);this.spine.add(this.gun);this.gunMeshes={};for(const k in G.guns){const m=mk(G.guns[k],k==='bomb'?M.bomb:M.gun,this.gun);m.visible=false;this.gunMeshes[k]=m;}
  this.muzzle=new THREE.Object3D();this.gun.add(this.muzzle);
  this.blob=new THREE.Mesh(blobGeo,M.shadow);this.blob.renderOrder=1;this.blob.position.y=.02;this.root.add(this.blob);
  this.phase=Math.random()*6;this.die=0;this.dieDir=1;this.flinch=0;this._s=new V();this._t=new V();this._pole=new V();this.kneel=0;this.throwT=0;this.cls='rifle';this.setGun('rifle');}
 setGun(cls){if(this.cls===cls&&this._set)return;this._set=true;this.cls=cls;for(const k in this.gunMeshes)this.gunMeshes[k].visible=k===cls;const L={rifle:.62,smg:.4,sniper:.78,shotgun:.66,pistol:.28,knife:.22,nade:.05,bomb:.12}[cls]||.5;this.muzzle.position.set(0,.02,L);
  const one=cls==='pistol'||cls==='knife'||cls==='nade'||cls==='bomb';this.gun.position.set(one?-.02:-.1,one?.34:.36,one?.36:.2);this.poseArms(0);}
 poseArms(reload){const g=this.gun.position,one=this.cls==='pistol'||this.cls==='knife'||this.cls==='nade'||this.cls==='bomb';
  for(const a of this.arms){const S=this._s.copy(a.sh.position);const T=this._t;
   if(this.throwT>0&&a.s>0){T.set(a.sh.position.x,a.sh.position.y+.35,a.sh.position.z-.1+this.throwT*.5);}
   else if(one){if(a.s<0)T.set(g.x-.02,g.y-.06,g.z-.02);else T.set(g.x+.05,g.y-.08,g.z-.04);}
   else if(a.s<0)T.set(g.x,g.y-.07,g.z+.02);else if(reload>0)T.set(g.x+.02,g.y-.2,g.z+.1+Math.sin(reload*9)*.04);else T.set(g.x+.01,g.y-.03,g.z+.27);
   ik(a.up,a.lo,S,T,this._pole.set(a.s*.9,-.6,-.2));}}
 // st: {speed, crouch, pitch, dead, reload, kneel, hidden}
 update(dt,st){const r=this.root;if(st.dead){this.die=Math.min(1,this.die+dt*2.4);const e=1-Math.pow(1-this.die,3);r.rotation.x=-e*1.5*this.dieDir;this.hips.position.y=.95-e*.68;this.spine.rotation.x=e*.25;for(const l of this.legs){l.th.rotation.x=-e*.4;l.kn.rotation.x=e*.8;}this.arms[0].up.rotation.z=-e*.6;this.blob.visible=false;return;}
  this.die=0;r.rotation.x=0;this.blob.visible=true;const sp=st.speed,cr=Math.max(st.crouch,st.kneel||0);this.phase+=dt*(sp>.2?(2.6+sp*1.25):0);const amp=Math.min(1,sp/3.5)*(sp>4?.7:.5),ph=this.phase;
  const hy=.95-cr*.38+(sp>.3?Math.abs(Math.sin(ph))*.035:0);this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*12);
  this.legs.forEach((l,i)=>{const p=ph+i*Math.PI;let th=Math.sin(p)*amp,kn=Math.max(0,Math.sin(p+1.2))*amp*1.4+.05;th=th*(1-cr)+(-1.15+Math.sin(p)*amp*.4)*cr;kn=kn*(1-cr)+(1.55+Math.max(0,Math.sin(p+1.2))*.3)*cr;if(cr>.5&&i===0){th=-1.25;kn=1.6;}if(cr>.5&&i===1&&sp<.3){th=-.4;kn=2.3;}
   l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*14);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*14);});
  this.flinch=Math.max(0,this.flinch-dt*4);const lean=(sp>4.5?.12:sp>.3?.05:0)+cr*.1+(st.kneel||0)*.35;
  this.spine.rotation.x+=((-st.pitch*.75+lean+this.flinch*.35)-this.spine.rotation.x)*Math.min(1,dt*10);this.spine.rotation.y=Math.sin(ph)*amp*.07;this.neck.rotation.x=-st.pitch*.25-lean*.6;
  if(this.throwT>0){this.throwT=Math.max(0,this.throwT-dt*2.5);this.poseArms(0);this._rl=true;}
  else if(st.reload>0||this._rl){this.poseArms(st.reload);this._rl=st.reload>0;}}
 dispose(){this.root.traverse(o=>{if(o.isMesh&&o.geometry!==blobGeo&&!Object.values(KIT.G.guns).includes(o.geometry)){}});}
}

// ray vs operator hit volumes. a: {pos, crouchV}; returns {t, part} or null. Parts: head chest stomach legs
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,top=1.5-cr*.42,hy=1.67-cr*.44;
 let best=null;{const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.15*.15,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-.27*.27,D=B*B-A*C;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<.86-cr*.32?'legs':y<1.1-cr*.38?'stomach':'chest'};}}
 return best;}
