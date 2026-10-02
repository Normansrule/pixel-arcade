// FRONTLINE OPS — procedural soldier rigs (articulated limbs, IK arms, walk/run/crouch/death) + hit tests.
import * as THREE from '../vendor/three.module.min.js';
import {merge} from './world.js';
const V=THREE.Vector3,M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(r1,r2,h,s=8)=>new THREE.CylinderGeometry(r1,r2,h,s),SP=(r,a=10,b=8)=>new THREE.SphereGeometry(r,a,b);
const UA=.29,LA=.27,TH=.45,SH=.45;

let KIT=null;
export function makeKit(TX){const std=o=>new THREE.MeshStandardMaterial(o);
 const G={
  torso:merge([{geo:BX(.38,.5,.22),m:M4(0,.27,0)},{geo:BX(.3,.12,.2),m:M4(0,.02,0)}]),
  vest:merge([{geo:BX(.44,.36,.3),m:M4(0,.3,.01)},{geo:BX(.1,.13,.07),m:M4(-.12,.18,.17)},{geo:BX(.1,.13,.07),m:M4(0,.18,.17)},{geo:BX(.1,.13,.07),m:M4(.12,.18,.17)},{geo:BX(.3,.36,.15),m:M4(0,.32,-.2)},{geo:BX(.12,.08,.1),m:M4(.2,.5,0)},{geo:BX(.12,.08,.1),m:M4(-.2,.5,0)}]),
  head:merge([{geo:SP(.105,12,10),m:M4(0,.11,.01)},{geo:CY(.05,.055,.1),m:M4(0,0,0)}]),
  helmet:merge([{geo:new THREE.SphereGeometry(.135,14,8,0,Math.PI*2,0,Math.PI*.52),m:M4(0,.14,0)},{geo:BX(.06,.05,.05),m:M4(0,.2,.12)}]),
  goggles:merge([{geo:BX(.17,.05,.04),m:M4(0,.13,.1)}]),
  cap:merge([{geo:new THREE.SphereGeometry(.115,12,8,0,Math.PI*2,0,Math.PI*.5),m:M4(0,.13,0)}]),
  upper:(()=>{const g=CY(.058,.05,UA);g.translate(0,-UA/2,0);return g;})(),lower:(()=>{const g=CY(.05,.042,LA);g.translate(0,-LA/2,0);return g;})(),
  hand:(()=>{const g=BX(.07,.09,.09);g.translate(0,-.03,0);return g;})(),
  thigh:(()=>{const g=CY(.085,.07,TH);g.translate(0,-TH/2,0);return g;})(),shin:(()=>{const g=CY(.068,.055,SH);g.translate(0,-SH/2,0);return g;})(),
  boot:(()=>{const g=BX(.11,.1,.26);g.translate(0,-.05,.05);return g;})(),
  gun:merge([{geo:BX(.06,.1,.5),m:M4(0,0,.1)},{geo:CY(.016,.016,.36),m:M4(0,.02,.5,Math.PI/2)},{geo:BX(.045,.16,.07),m:M4(0,-.11,.13,.25)},{geo:BX(.05,.09,.22),m:M4(0,-.01,-.22)},{geo:BX(.035,.05,.12),m:M4(0,.075,.08)}]),
  band:(()=>{const g=CY(.062,.062,.06,8);g.translate(0,-.08,0);return g;})()};
 const M={skin:std({color:0xb08060,roughness:.7}),skin2:std({color:0x6a4a34,roughness:.7}),gun:std({color:0x1a1b1e,roughness:.45,metalness:.7}),glove:std({color:0x1e1c18,roughness:.8}),boot:std({color:0x1a1612,roughness:.85}),
  uniA:std({map:TX.camoA,roughness:.9}),vestA:std({color:0x4b5137,roughness:.85}),helmA:std({color:0x55573f,roughness:.75}),
  uniB:std({map:TX.camoB,roughness:.9}),vestB:std({color:0x26272b,roughness:.8}),helmB:std({color:0x1c1d20,roughness:.6,metalness:.2}),band:std({color:0xb01818,emissive:0x400404,roughness:.6}),
  shirt:std({color:0xd8d6cc,roughness:.85}),pants:std({color:0x1e2638,roughness:.8}),hair:std({color:0x1a1410,roughness:.9}),goggle:std({color:0x0a0c0e,roughness:.15,metalness:.8}),
  flash:new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide})};
 KIT={G,M};return KIT;}

// 2-bone IK: places upper/lower pivots so the hand reaches target (in parent space)
const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole){_d.subVectors(T,S);let d=_d.length();d=Math.min(d,UA+LA-.005);_d.normalize();const x=(UA*UA-LA*LA+d*d)/(2*d),h=Math.sqrt(Math.max(0,UA*UA-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}

export class Rig{
 constructor(type){const{G,M}=KIT;const ally=type==='ally',vip=type==='vip';this.root=new THREE.Group();const mk=(g,m,p,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
  const uni=vip?M.pants:ally?M.uniA:M.uniB,top=vip?M.shirt:uni,vest=ally?M.vestA:M.vestB;
  this.hips=new THREE.Group();this.hips.position.y=.95;this.root.add(this.hips);
  this.spine=new THREE.Group();this.spine.position.y=.05;this.hips.add(this.spine);mk(G.torso,top,this.spine);if(!vip)mk(G.vest,vest,this.spine);
  this.neck=new THREE.Group();this.neck.position.set(0,.55,0);this.spine.add(this.neck);mk(G.head,ally||vip?M.skin:M.skin2,this.neck);
  if(vip)mk(G.cap,M.hair,this.neck);else{mk(G.helmet,ally?M.helmA:M.helmB,this.neck);if(!ally)mk(G.goggles,M.goggle,this.neck);}
  this.arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.23,.47,0);this.spine.add(sh);const up=new THREE.Group();sh.add(up);mk(G.upper,top,up);if(!ally&&!vip&&s>0)mk(G.band,M.band,up);
   const lo=new THREE.Group();lo.position.y=-UA;up.add(lo);mk(G.lower,top,lo);const hd=mk(G.hand,vip?M.skin:M.glove,lo,0,-LA,0);this.arms.push({sh,up,lo,hd,s});}
  this.legs=[];for(const s of[-1,1]){const th=new THREE.Group();th.position.set(s*.11,0,0);this.hips.add(th);mk(G.thigh,uni,th);const kn=new THREE.Group();kn.position.y=-TH;th.add(kn);mk(G.shin,uni,kn);mk(G.boot,M.boot,kn,0,-SH,0);this.legs.push({th,kn});}
  this.gun=null;if(!vip){this.gun=new THREE.Group();this.gun.position.set(-.1,.36,.2);this.spine.add(this.gun);mk(G.gun,M.gun,this.gun);
   this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),M.flash);this.flash.position.set(0,.02,.82);this.flash.visible=false;this.flash.castShadow=false;this.gun.add(this.flash);
   const f2=new THREE.Mesh(new THREE.PlaneGeometry(.5,.5),M.flash);f2.rotation.y=Math.PI/2;f2.castShadow=false;this.flash.add(f2);}
  this.phase=Math.random()*6;this.die=0;this.dieDir=1;this.flinch=0;this.vipHands=vip;this.aimT=new V();this._s=new V();this._t=new V();this._pole=new V();
  this.poseArms(0);}
 poseArms(reload){if(this.vipHands){for(const a of this.arms){a.up.rotation.set(.1,0,a.s*.12);a.lo.rotation.set(-.3,0,0);}return;}
  // right hand on grip, left hand on handguard (gun-space -> spine-space)
  const g=this.gun.position;for(const a of this.arms){const S=this._s.copy(a.sh.position);const T=this._t;if(a.s<0)T.set(g.x,g.y-.07,g.z+.02);else if(reload>0)T.set(g.x+.02,g.y-.2,g.z+.1+Math.sin(reload*9)*.04);else T.set(g.x+.01,g.y-.03,g.z+.27);
   ik(a.up,a.lo,S,T,this._pole.set(a.s*.9,-.6,-.2));}}
 // st: {speed, crouch, pitch, t, dead, reload}
 update(dt,st){const r=this.root;if(st.dead){this.die=Math.min(1,this.die+dt*2.2);const e=1-Math.pow(1-this.die,3);r.rotation.x=-e*1.45*this.dieDir;this.hips.position.y=.95-e*.6;this.spine.rotation.x=e*.3;for(const l of this.legs){l.th.rotation.x=-e*.5;l.kn.rotation.x=e*.9;}return;}
  this.die=0;r.rotation.x=0;const sp=st.speed,cr=st.crouch;this.phase+=dt*(sp>.2?(2.4+sp*1.2):0);const amp=Math.min(1,sp/3.5)*(sp>5.5?.85:.55),ph=this.phase;
  const hy=.95-cr*.36+(sp>.3?Math.abs(Math.sin(ph))*.04:0)-(sp>5.5?.04:0);this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*12);
  this.legs.forEach((l,i)=>{const p=ph+i*Math.PI;let th=Math.sin(p)*amp,kn=Math.max(0,Math.sin(p+1.2))*amp*1.4+.05;th=th*(1-cr)+(-1.15+Math.sin(p)*amp*.4)*cr;kn=kn*(1-cr)+(1.55+Math.max(0,Math.sin(p+1.2))*.3)*cr;if(cr>.5&&i===0){th=-1.25;kn=1.6;}if(cr>.5&&i===1&&sp<.3){th=-.4;kn=2.3;}
   l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*14);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*14);});
  this.flinch=Math.max(0,this.flinch-dt*4);const lean=(sp>5.5?.25:sp>.3?.08:0)+cr*.12;
  this.spine.rotation.x+=((-st.pitch*.75+lean+this.flinch*.3)-this.spine.rotation.x)*Math.min(1,dt*10);this.spine.rotation.y=Math.sin(ph)*amp*.08;this.neck.rotation.x=-st.pitch*.25-lean*.6;
  if(this.gun){this.gun.position.y=sp>5.5?.3:.36;if(st.reload>0||this._rl){this.poseArms(st.reload);this._rl=st.reload>0;}else if(sp>5.5!==this._sp){this._sp=sp>5.5;this.poseArms(0);}}}
}

// ray vs soldier hit volumes. a: actor with pos, crouch(0..1); returns {t, part} or null
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,top=1.48-cr*.42,hy=1.66-cr*.44;
 // head sphere
 let best=null;{const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.16*.16,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 // body cylinder r=.28 from y=0 to top
 const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-.28*.28,D=B*B-A*C;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<.85-cr*.3?'legs':'body'};}}
 return best;}
