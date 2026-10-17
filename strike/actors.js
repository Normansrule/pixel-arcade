// STRIKE ZONE — procedural arena operatives: armoured rigs with glowing visors in team colour, IK arms on the weapon,
// run / strafe / crouch / slide / airborne / death animation, hit flash, spawn shimmer and precise hit volumes.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(r1,r2,h,s=10)=>new THREE.CylinderGeometry(r1,r2,h,s),SP=(r,a=14,b=10)=>new THREE.SphereGeometry(r,a,b);
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(1,1,1));
const UA=.29,LA=.28,TH=.44,SH=.44;
// merge [geometry, colour, matrix?, emissive?] into one geometry with vertex colours (+ an emissive mask in colour alpha via a second attribute)
function cmerge(parts){const pos=[],nor=[],col=[],em=[],idx=[];let off=0;const v=new V(),n=new V(),nm=new THREE.Matrix3();
 for(const[g,c,m,e]of parts){const p=g.attributes.position.array,q=g.attributes.normal.array;if(m)nm.getNormalMatrix(m);for(let i=0;i<p.length;i+=3){v.set(p[i],p[i+1],p[i+2]);n.set(q[i],q[i+1],q[i+2]);if(m){v.applyMatrix4(m);n.applyMatrix3(nm).normalize();}pos.push(v.x,v.y,v.z);nor.push(n.x,n.y,n.z);col.push(c.r,c.g,c.b);em.push(e||0);}
  const ix=g.index?g.index.array:[...Array(p.length/3).keys()];for(const i of ix)idx.push(i+off);off+=p.length/3;}
 const o=new THREE.BufferGeometry();o.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));o.setAttribute('normal',new THREE.Float32BufferAttribute(nor,3));o.setAttribute('color',new THREE.Float32BufferAttribute(col,3));o.setAttribute('emit',new THREE.Float32BufferAttribute(em,1));o.setIndex(idx);o.computeBoundingSphere();return o;}
const L=h=>new THREE.Color(h).convertSRGBToLinear();
// a rig material with an emissive mask (visor / stripes glow in the accent colour) and a hit-flash / shimmer uniform
function rigMat(accent){const m=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.25,envMapIntensity:1});m.userData.u={acc:{value:new THREE.Color(accent).multiplyScalar(2.2)},flash:{value:0},shim:{value:0},light:{value:1}};
 m.onBeforeCompile=sh=>{Object.assign(sh.uniforms,m.userData.u);sh.vertexShader=sh.vertexShader.replace('#include <common>','#include <common>\nattribute float emit;varying float vEmit;').replace('#include <begin_vertex>','#include <begin_vertex>\nvEmit=emit;');
  sh.fragmentShader=sh.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 acc;uniform float flash,shim,light;varying float vEmit;').replace('vec4 diffuseColor = vec4( diffuse, opacity );','vec4 diffuseColor = vec4( diffuse*light, opacity );')
   .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\ntotalEmissiveRadiance+=acc*vEmit+vec3(1.,.9,.85)*flash+acc*shim*.12*(.6+.4*sin(vViewPosition.y*14.));');};m.customProgramCacheKey=()=>'rig';return m;}

let KIT=null;
function kit(){if(KIT)return KIT;
 const G={pelvis:[[BX(.34,.18,.22),M4(0,.02,0)],[BX(.36,.06,.24),M4(0,.1,0)]],
  torso:[[BX(.38,.36,.24),M4(0,.24,0)],[BX(.33,.16,.21),M4(0,.48,0)]],
  plate:[[BX(.36,.3,.08),M4(0,.3,.14)],[BX(.08,.08,.04),M4(-.1,.2,.19)],[BX(.08,.08,.04),M4(.1,.2,.19)],[BX(.3,.36,.12),M4(0,.3,-.17)]],
  stripe:[[BX(.37,.02,.01),M4(0,.4,.185)],[BX(.02,.22,.01),M4(.12,.3,.185)]],
  pack:[[BX(.26,.32,.14),M4(0,.32,-.26)],[CY(.025,.025,.36),M4(.1,.42,-.3)]],
  neck:[[CY(.06,.07,.1),M4(0,.04,0)]],
  head:[[SP(.115),M4(0,.12,.01)]],
  helmet:[[new THREE.SphereGeometry(.142,16,10,0,Math.PI*2,0,Math.PI*.56),M4(0,.13,0)],[BX(.29,.07,.04),M4(0,.07,-.12)],[BX(.04,.1,.12),M4(-.14,.08,0)],[BX(.04,.1,.12),M4(.14,.08,0)]],
  visor:[[BX(.24,.07,.05),M4(0,.12,.115)]],
  shoulder:[[new THREE.SphereGeometry(.09,10,8,0,Math.PI*2,0,Math.PI*.55),M4(0,.02,0)]],
  upper:[[CY(.058,.05,UA),M4(0,-UA/2,0)]],lower:[[CY(.05,.044,LA),M4(0,-LA/2,0)]],hand:[[BX(.075,.09,.09),M4(0,-LA-.03,0)]],
  thigh:[[CY(.085,.07,TH),M4(0,-TH/2,0)],[BX(.16,.14,.1),M4(0,-.12,.06)]],shin:[[CY(.068,.056,SH),M4(0,-SH/2,0)],[BX(.12,.12,.06),M4(0,-.04,.07)]],boot:[[BX(.12,.11,.27),M4(0,-SH-.04,.05)]],
  guns:{rifle:[[BX(.06,.1,.52),M4(0,0,.1)],[CY(.016,.016,.3),M4(0,.02,.5,Math.PI/2)],[BX(.04,.16,.06),M4(0,-.11,.12,.25)],[BX(.05,.09,.22),M4(0,-.01,-.24)],[BX(.04,.05,.07),M4(0,.08,.06)]],
   smg:[[BX(.06,.1,.36),M4(0,0,.06)],[CY(.018,.018,.14),M4(0,.02,.3,Math.PI/2)],[BX(.035,.2,.045),M4(0,-.13,.1)],[BX(.03,.05,.18),M4(0,0,-.18)]],
   shotgun:[[BX(.06,.09,.36),M4(0,0,.02)],[CY(.022,.022,.5),M4(0,.02,.42,Math.PI/2)],[BX(.06,.06,.16),M4(0,-.035,.34)],[BX(.05,.1,.26),M4(0,-.03,-.26)]],
   sniper:[[BX(.06,.1,.6),M4(0,0,.08)],[CY(.016,.016,.5),M4(0,.02,.62,Math.PI/2)],[CY(.032,.032,.3),M4(0,.1,.08,Math.PI/2)],[BX(.05,.11,.28),M4(0,-.02,-.3)]],
   lmg:[[BX(.08,.12,.56),M4(0,0,.08)],[CY(.02,.02,.36),M4(0,.02,.52,Math.PI/2)],[BX(.1,.13,.14),M4(-.07,-.09,.06)],[BX(.05,.1,.24),M4(0,-.02,-.3)]],
   pistol:[[BX(.035,.05,.2),M4(0,0,.06)],[BX(.03,.1,.05),M4(0,-.07,0,.25)]],revolver:[[CY(.015,.015,.22),M4(0,.02,.14,Math.PI/2)],[CY(.032,.032,.07,6),M4(0,0,.02,Math.PI/2)],[BX(.03,.11,.05),M4(0,-.07,-.04,.3)]],
   rl:[[CY(.065,.065,.95),M4(0,.02,.1,Math.PI/2)],[BX(.04,.12,.05),M4(0,-.1,0)]],knife:[[BX(.02,.04,.22),M4(0,0,.14)],[BX(.03,.03,.1),M4(0,0,-.02)]]}};
 KIT={G};return KIT;}
const SETS={};
function rigSet(key,pal){if(SETS[key])return SETS[key];const{G}=kit();const T=(x,y,z)=>new THREE.Matrix4().makeTranslation(x,y,z);
 const suit=L(pal.suit).multiplyScalar(.85),armor=L(pal.armor).multiplyScalar(.9),acc=L(pal.acc),dark=L(0x1a1b1e),skin=L(pal.skin),glove=L(0x202020),boot=L(0x1c1a18);
 const P=(list,c,e,m)=>list.map(([g,mm])=>[g,c,m?m.clone().multiply(mm):mm,e]);
 SETS[key]={pelvis:cmerge([...P(G.pelvis,suit),...P(G.pelvis.slice(1),dark)]),spine:cmerge([...P(G.torso,suit),...P(G.plate,armor),...P(G.stripe,acc,1),...P(G.pack,dark)]),
  head:cmerge([...P(G.neck,suit),...P(G.head,skin),...P(G.helmet,armor),...P(G.visor,acc,1)]),shoulder:cmerge(P(G.shoulder,armor)),
  upperR:cmerge(P(G.upper,suit)),upperL:cmerge(P(G.upper,suit)),lower:cmerge([...P(G.lower,suit),...P(G.hand,glove)]),thigh:cmerge(P(G.thigh,suit).map((p,i)=>i===1?[p[0],armor,p[2],0]:p)),shin:cmerge([...P(G.shin,suit).map((p,i)=>i===1?[p[0],armor,p[2],0]:p),...P(G.boot,boot)])};
 for(const k in G.guns)SETS[key]['gun_'+k]=cmerge(P(G.guns[k],L(0x1c1d21)).map((p,i)=>i===0?p:p));return SETS[key];}

const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole){_d.subVectors(T,S);let d=_d.length();d=Math.min(d,UA+LA-.005);_d.normalize();const x=(UA*UA-LA*LA+d*d)/(2*d),h=Math.sqrt(Math.max(0,UA*UA-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}
const GUNLEN={rifle:.66,smg:.38,shotgun:.68,sniper:.88,lmg:.72,pistol:.18,revolver:.26,rl:.6,knife:.24};
const CLSOF={ar:'rifle',smg:'smg',shotgun:'shotgun',sniper:'sniper',lmg:'lmg',pistol:'pistol',revolver:'revolver',rl:'rl',knife:'knife'};
const blobGeo=(()=>{const g=new THREE.CircleGeometry(.45,16);g.rotateX(-Math.PI/2);return g;})();const blobMat=new THREE.MeshBasicMaterial({color:0,transparent:true,opacity:.35,depthWrite:false});

export const PALETTES=[{suit:0x6a625a,armor:0x8c8a86,acc:0xff6a1a,skin:0xb48468},{suit:0x55606e,armor:0x7e8ea4,acc:0x3d9bff,skin:0x8a5c44},{suit:0x726a58,armor:0x9c9078,acc:0xffd03a,skin:0xd8aa88},{suit:0x56685a,armor:0x7c9480,acc:0x56ff8a,skin:0xa8785c},
 {suit:0x665a72,armor:0x8e7c9e,acc:0xd060ff,skin:0xc89070},{suit:0x585456,armor:0x86868c,acc:0xff3d5a,skin:0x7a5440},{suit:0x587270,armor:0x7ea09c,acc:0x3df0e0,skin:0xb88a6a},{suit:0x786a50,armor:0xa49070,acc:0xff9a3a,skin:0x9c6a50},{suit:0x5a5e66,armor:0xc8ccd4,acc:0xffffff,skin:0xc89a7a}];

export class Rig{
 constructor(pal,key){this.root=new THREE.Group();const S=rigSet(key,pal);this.mat=rigMat(pal.acc);const mk=(g,p,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,this.mat);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
  this.hips=new THREE.Group();this.hips.position.y=.95;this.root.add(this.hips);mk(S.pelvis,this.hips);
  this.spine=new THREE.Group();this.spine.position.y=.1;this.hips.add(this.spine);mk(S.spine,this.spine);
  this.neck=new THREE.Group();this.neck.position.set(0,.56,0);this.spine.add(this.neck);mk(S.head,this.neck);
  this.arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.24,.5,0);this.spine.add(sh);mk(S.shoulder,sh,0,.02,0);const up=new THREE.Group();sh.add(up);mk(s>0?S.upperR:S.upperL,up);const lo=new THREE.Group();lo.position.y=-UA;up.add(lo);mk(S.lower,lo);this.arms.push({sh,up,lo,s});}
  this.legs=[];for(const s of[-1,1]){const th=new THREE.Group();th.position.set(s*.11,0,0);this.hips.add(th);mk(S.thigh,th);const kn=new THREE.Group();kn.position.y=-TH;th.add(kn);mk(S.shin,kn);this.legs.push({th,kn});}
  this.gun=new THREE.Group();this.spine.add(this.gun);this.gunMeshes={};for(const k in GUNLEN){const m=mk(S['gun_'+k],this.gun);m.visible=false;this.gunMeshes[k]=m;}this.muzzle=new THREE.Object3D();this.gun.add(this.muzzle);
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.35,.35),Rig.flashMat());this.flash.visible=false;this.muzzle.add(this.flash);const f2=this.flash.clone();f2.rotation.y=Math.PI/2;this.flash.add(f2);
  this.blob=new THREE.Mesh(blobGeo,blobMat);this.blob.position.y=.03;this.blob.renderOrder=1;this.root.add(this.blob);
  this.phase=Math.random()*6;this.die=0;this.dieDir=new V(0,0,1);this.flinch=0;this.kick=0;this._s=new V();this._t=new V();this._pole=new V();this.cls='rifle';this.reloadT=0;this.throwT=0;this.flashT=0;this.setGun('ar');}
 static flashMat(){if(!Rig._fm){const c=document.createElement('canvas');c.width=c.height=64;const x=c.getContext('2d');const g=x.createRadialGradient(32,32,0,32,32,32);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.3,'rgba(255,190,90,.8)');g.addColorStop(1,'rgba(255,120,20,0)');x.fillStyle=g;x.fillRect(0,0,64,64);
   const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;Rig._fm=new THREE.MeshBasicMaterial({map:t,color:new THREE.Color(3,2.4,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide});}return Rig._fm;}
 setGun(id){const cls=CLSOF[id]||'rifle';if(this.cls===cls&&this._set)return;this._set=true;this.cls=cls;for(const k in this.gunMeshes)this.gunMeshes[k].visible=k===cls;this.muzzle.position.set(0,.02,GUNLEN[cls]);
  const one=cls==='pistol'||cls==='revolver'||cls==='knife';this.one=one;this.gun.position.set(one?-.02:-.1,one?.36:.38,one?.38:.22);if(cls==='rl'){this.gun.position.set(-.16,.5,.12);}this.poseArms(0);}
 poseArms(reload){const g=this.gun.position,one=this.one;
  for(const a of this.arms){const S=this._s.copy(a.sh.position),T=this._t;
   if(this.throwT>0&&a.s<0)T.set(a.sh.position.x,a.sh.position.y+.35,a.sh.position.z-.1+this.throwT*.5);
   else if(one){if(a.s<0)T.set(g.x-.03,g.y-.07,g.z-.02);else T.set(g.x+.05,g.y-.08,g.z-.04);}
   else if(a.s<0)T.set(g.x,g.y-.07,g.z+.02);else if(reload>0)T.set(g.x+.02,g.y-.2,g.z+.12+Math.sin(reload*9)*.04);else T.set(g.x+.01,g.y-.04,g.z+(this.cls==='rl'?.0:.3));
   ik(a.up,a.lo,S,T,this._pole.set(a.s*.9,-.6,-.2));}}
 // st: {fwd, side (local velocity m/s), crouch, slide, air, pitch, dead, reload, light, hurt, shim, firing}
 update(dt,st){const r=this.root;const u=this.mat.userData.u;u.light.value=st.light??1;u.flash.value=Math.max(0,u.flash.value-dt*9);u.shim.value=st.shim||0;this.flashT-=dt;this.flash.visible=this.flashT>0;if(this.flash.visible)this.flash.rotation.z=Math.random()*6;
  if(st.dead){this.die=Math.min(1,this.die+dt*2.2);const e=1-Math.pow(1-this.die,3);const d=this.dieDir;r.rotation.x=-e*1.45*(d.z>=0?1:-1)*Math.abs(d.z)/(Math.abs(d.z)+Math.abs(d.x)+.001)*1;r.rotation.z=e*1.4*d.x/(Math.abs(d.z)+Math.abs(d.x)+.001);
   this.hips.position.y=.95-e*.7;this.spine.rotation.x=e*.35;for(const l of this.legs){l.th.rotation.x=-e*.5;l.kn.rotation.x=e*.9;}this.arms[0].up.rotation.z=-e*.8;this.arms[1].up.rotation.z=e*.6;this.blob.visible=false;return;}
  this.die=0;r.rotation.x=0;r.rotation.z=0;this.blob.visible=true;const fwd=st.fwd||0,side=st.side||0;const sp=Math.hypot(fwd,side);const cr=st.slide?0:st.crouch||0;
  this.phase+=dt*(sp>.3&&!st.air&&!st.slide?(3+sp*1.15):0)*(fwd<-.3?-1:1);const amp=Math.min(1,sp/6)*.75,ph=this.phase;
  const hy=st.slide?.55:.95-cr*.36+(sp>.3&&!st.air?Math.abs(Math.sin(ph))*.04:0);this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*14);
  // strafe: twist the hips toward the motion, legs keep cycling
  const tw=sp>.5?Math.atan2(side,Math.abs(fwd)+.01)*.5:0;this.hips.rotation.y+=(tw-this.hips.rotation.y)*Math.min(1,dt*8);this.spine.rotation.y=-this.hips.rotation.y+Math.sin(ph)*amp*.08;
  this.legs.forEach((l,i)=>{const p=ph+i*Math.PI;let th=Math.sin(p)*amp,kn=Math.max(0,Math.sin(p+1.3))*amp*1.5+.06;
   if(st.air){th=i?.6:-.2;kn=i?.4:1.1;}else if(st.slide){th=i?-1.35:-1.1;kn=i?.2:1.3;}else if(cr>.3){th=th*(1-cr)+(-1.2+Math.sin(p)*amp*.4)*cr;kn=kn*(1-cr)+(1.7+Math.max(0,Math.sin(p+1.2))*.3)*cr;}
   l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*15);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*15);});
  this.flinch=Math.max(0,this.flinch-dt*5);this.kick=Math.max(0,this.kick-dt*8);const lean=(sp>4?.1:sp>.3?.05:0)+cr*.12+(st.slide?-.5:0);
  this.spine.rotation.x+=((-st.pitch*.7+lean+this.flinch*.4-this.kick*.08)-this.spine.rotation.x)*Math.min(1,dt*12);this.neck.rotation.x=-st.pitch*.3-lean*.5;
  this.gun.rotation.x=-this.kick*.15;
  if(this.throwT>0){this.throwT=Math.max(0,this.throwT-dt*2.5);this.poseArms(0);this._rl=true;}else if(st.reload>0||this._rl){this.poseArms(st.reload);this._rl=st.reload>0;}}
 hit(){this.mat.userData.u.flash.value=.55;this.flinch=1;}
 fired(){this.kick=1;this.flashT=.05;}
 muzzleWorld(out=new V()){this.root.updateMatrixWorld(true);return this.muzzle.getWorldPosition(out);}
 dispose(){this.mat.dispose();}}

// ray vs actor hit volumes. a: {pos, crouchV, slideV}; returns {t, part} or null
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=Math.max(a.crouchV||0,a.slideV||0),hy=1.66-cr*.5,top=1.5-cr*.48;let best=null;
 {const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.17*.17,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-.3*.3,D=B*B-A*C;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<.78-cr*.3?'legs':'body'};}
  else if(t<0){const t2=(-B+Math.sqrt(D))/A;}}
 // steep shots from above/below: test the top/bottom caps
 if(!best&&Math.abs(dy)>.3){const ty=(p.y+top-oy)/dy;if(ty>0&&ty<maxT){const x=ox+dx*ty-p.x,z=oz+dz*ty-p.z;if(x*x+z*z<.09)best={t:ty,part:'body'};}}
 return best;}
