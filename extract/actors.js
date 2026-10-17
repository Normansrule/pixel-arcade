// EXFIL — procedural humanoid rigs (articulated limbs, 2-bone IK arms on the gun, walk/run/crouch/lean/death), gear dressing and hit volumes.
import * as THREE from '../vendor/three.module.min.js';
import {gunModel} from './weapons.js';
const V=THREE.Vector3;const UA=.29,LA=.27,TH=.45,SH=.45;
const MC={};const mat=(c,r=.85,m=0)=>MC[c+'_'+r+'_'+m]||(MC[c+'_'+r+'_'+m]=new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m}));
let G=null;
function geos(){if(G)return G;const BX=(w,h,d)=>new THREE.BoxGeometry(w,h,d),CY=(a,b,h,s=8)=>new THREE.CylinderGeometry(a,b,h,s),SP=(r,a=10,b=8)=>new THREE.SphereGeometry(r,a,b);
 const tr=(g,x,y,z)=>{g.translate(x,y,z);return g;};
 G={torso:tr(BX(.36,.52,.21),0,.27,0),belly:tr(BX(.31,.16,.2),0,.02,0),jacket:tr(BX(.4,.42,.25),0,.3,0),hood:tr(BX(.3,.1,.14),0,.53,-.09),
  vest:tr(BX(.42,.36,.29),0,.3,.01),pouch:tr(BX(.1,.12,.07),0,0,0),plate:tr(BX(.3,.3,.06),0,.32,.15),
  head:tr(SP(.105,12,10),0,.12,.01),neck:tr(CY(.05,.055,.1),0,.02,0),helmet:tr(new THREE.SphereGeometry(.135,14,8,0,Math.PI*2,0,Math.PI*.52),0,.15,0),visor:tr(BX(.2,.1,.03),0,.12,.13),
  beanie:tr(new THREE.SphereGeometry(.118,12,8,0,Math.PI*2,0,Math.PI*.55),0,.14,0),cap:tr(new THREE.SphereGeometry(.113,12,8,0,Math.PI*2,0,Math.PI*.5),0,.135,0),brim:tr(BX(.18,.015,.1),0,.14,.12),
  mask:tr(BX(.17,.07,.05),0,.07,.09),goggles:tr(BX(.17,.045,.04),0,.15,.1),
  upper:tr(CY(.058,.05,UA),0,-UA/2,0),lower:tr(CY(.05,.042,LA),0,-LA/2,0),hand:tr(BX(.07,.09,.09),0,-.03,0),
  thigh:tr(CY(.085,.07,TH),0,-TH/2,0),shin:tr(CY(.068,.055,SH),0,-SH/2,0),boot:tr(BX(.11,.1,.27),0,-.05,.05),
  pack1:tr(BX(.3,.32,.15),0,.3,-.19),pack2:tr(BX(.34,.44,.2),0,.28,-.22),pack3:tr(BX(.38,.56,.24),0,.24,-.24),roll:tr(CY(.07,.07,.34,8).rotateZ(Math.PI/2),0,.55,-.24)};return G;}

const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole){_d.subVectors(T,S);let d=_d.length();d=Math.min(d,UA+LA-.005);_d.normalize();const x=(UA*UA-LA*LA+d*d)/(2*d),h=Math.sqrt(Math.max(0,UA*UA-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}

const SKIN=[0xc89a78,0xa87858,0x7a5238,0xe0b896,0x5a3a28];
// look: {fac:'drifter'|'patrol', top, pants, skin, head:'beanie'|'cap'|'hood'|'helmet'|'bare', hcol, vest(cls|0), pack(0..3), seed}
export class Rig{
 constructor(look,wid,mods,flashTex){const g=geos();this.root=new THREE.Group();this.look=look;const mk=(geo,m,p,x=0,y=0,z=0)=>{const o=new THREE.Mesh(geo,m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
  const top=mat(look.top,.92),pants=mat(look.pants,.9),skin=mat(look.skin,.7),boot=mat(0x1c1814,.85),glove=mat(look.fac==='patrol'?0x1a1a1c:look.skin,.8);
  this.hips=new THREE.Group();this.hips.position.y=.95;this.root.add(this.hips);
  this.spine=new THREE.Group();this.spine.position.y=.05;this.hips.add(this.spine);mk(g.torso,top,this.spine);mk(g.belly,pants,this.spine);
  if(look.fac==='drifter'){mk(g.jacket,top,this.spine);if(look.head==='hood')mk(g.hood,top,this.spine);}
  if(look.vest){const vc=[0,0,0x6a6e5a,0x4e5640,0x3a3d36,0x2a2c2e,0x1c1d20][look.vest]||0x3a3d36;mk(g.vest,mat(vc,.85),this.spine);for(let k=-1;k<=1;k++){const p=mk(g.pouch,mat(vc,.85),this.spine);p.position.set(k*.12,.2,.17);}if(look.vest>=4)mk(g.plate,mat(0x2a2c2e,.6,.2),this.spine);}
  if(look.pack){const pk=mk(g['pack'+Math.min(3,look.pack)],mat(look.packCol||0x4a5040,.95),this.spine);if(look.pack>=2)mk(g.roll,mat(0x3a4a3a,.95),this.spine);}
  this.neck=new THREE.Group();this.neck.position.set(0,.55,0);this.spine.add(this.neck);mk(g.neck,skin,this.neck);mk(g.head,skin,this.neck);
  const hc=mat(look.hcol||0x2a2a2a,.8);if(look.head==='helmet'){mk(g.helmet,mat(look.hcol||0x4a5038,.7,.1),this.neck);if(look.visor)mk(g.visor,mat(0x203038,.15,.8),this.neck);else mk(g.goggles,mat(0x0e1012,.2,.7),this.neck);}
  else if(look.head==='beanie')mk(g.beanie,hc,this.neck);else if(look.head==='cap'){mk(g.cap,hc,this.neck);mk(g.brim,hc,this.neck);}else if(look.head==='hood')mk(g.beanie,top,this.neck);
  if(look.mask)mk(g.mask,mat(look.fac==='patrol'?0x1a1c1e:0x3a3a34,.9),this.neck);
  if(look.fac==='patrol'){const band=mk(new THREE.CylinderGeometry(.062,.062,.06,8).translate(0,-.08,0),mat(0x2aa8a0,.6),this.spine);band.visible=false;this.band=band;}
  this.arms=[];for(const s of[-1,1]){const sh=new THREE.Group();sh.position.set(s*.22,.47,0);this.spine.add(sh);const up=new THREE.Group();sh.add(up);mk(g.upper,top,up);if(look.fac==='patrol'&&s<0){const b=mk(new THREE.CylinderGeometry(.062,.062,.06,8).translate(0,-.06,0),mat(0x2aa8a0,.6),up);}
   const lo=new THREE.Group();lo.position.y=-UA;up.add(lo);mk(g.lower,top,lo);mk(g.hand,glove,lo,0,-LA,0);this.arms.push({sh,up,lo,s});}
  this.legs=[];for(const s of[-1,1]){const th=new THREE.Group();th.position.set(s*.11,0,0);this.hips.add(th);mk(g.thigh,pants,th);const kn=new THREE.Group();kn.position.y=-TH;th.add(kn);mk(g.shin,pants,kn);mk(g.boot,boot,kn,0,-SH,0);this.legs.push({th,kn});}
  for(const g of[this.spine,this.neck,...this.arms.flatMap(a=>[a.up,a.lo]),...this.legs.flatMap(l=>[l.th,l.kn])])mergeKids(g);
  this.phase=Math.random()*6;this.die=0;this.dieDir=1;this.dieSide=0;this.flinch=0;this._s=new V();this._t=new V();this._pole=new V();this.lastPose='';
  this.gunG=new THREE.Group();this.gunG.position.set(.0,.36,.22);this.spine.add(this.gunG);this.setGun(wid,mods,flashTex);}
 setGun(wid,mods,flashTex){if(this.gun)this.gunG.remove(this.gun.g);this.gun=null;if(!wid)return;this.gun=gunModel(wid,mods||{},flashTex);mergeGun(this.gun);this.gun.g.rotation.y=Math.PI;this.gunG.add(this.gun.g);this.wid=wid;this.pose(0);}
 // gun-space hand targets -> spine space
 pose(reload){const gp=this.gunG.position;if(!this.gun){for(const a of this.arms){ik(a.up,a.lo,this._s.copy(a.sh.position),this._t.set(a.s*.25,.0,.05),this._pole.set(a.s,-.3,-.5));}return;}
  const P=this.gun.P;for(const a of this.arms){const S=this._s.copy(a.sh.position);const h=a.s<0?P.hands[0]:P.hands[1];
   // gun is rotated PI around Y: local (x,y,z) -> (-x,y,-z)
   const T=this._t.set(gp.x-h.x,gp.y+h.y,gp.z-h.z);if(reload>0&&a.s>0){T.set(gp.x+.04,gp.y-.18,gp.z+.12+Math.sin(reload*9)*.04);}
   ik(a.up,a.lo,S,T,this._pole.set(a.s*.9,-.6,-.2));}}
 flash(){if(this.gun&&this.gun.P.flash){this.gun.P.flash.visible=true;this.gun.P.flash.rotation.z=Math.random()*6;this.flT=.05;}}
 // st: {speed, crouch, pitch, lean, reload, dead, sprint, aim}
 update(dt,st){if(this.flT>0){this.flT-=dt;if(this.flT<=0&&this.gun&&this.gun.P.flash)this.gun.P.flash.visible=false;}
  const r=this.root;if(st.dead){if(this.die===0){this.dieDir=Math.random()<.5?1:-1;}this.die=Math.min(1,this.die+dt*2.4);const e=1-Math.pow(1-this.die,3);
   r.rotation.x=-e*1.48*this.dieDir;r.rotation.z=e*.2*this.dieDir;this.hips.position.y=.95-e*.72;this.spine.rotation.x=e*.25;this.neck.rotation.x=e*.4*this.dieDir;
   for(let i=0;i<2;i++){const l=this.legs[i];l.th.rotation.x=-e*(.3+i*.4);l.kn.rotation.x=e*(.6+i*.5);}
   for(const a of this.arms){a.up.rotation.set(-e*1.2,0,a.s*e*.6);a.lo.rotation.set(-e*.4,0,0);}if(this.gun&&e>.4){this.gunG.position.set(.25*this.dieDir,.1,.5);this.gunG.rotation.set(1.2,.5,1.4);}return;}
  this.die=0;r.rotation.x=0;r.rotation.z=0;const sp=st.speed,cr=st.crouch;this.phase+=dt*(sp>.2?(2.6+sp*1.15):0);const run=sp>4.6,amp=Math.min(1,sp/3.4)*(run?.85:.55),ph=this.phase;
  const hy=.95-cr*.38+(sp>.3?Math.abs(Math.sin(ph))*.04:0)-(run?.04:0);this.hips.position.y+=(hy-this.hips.position.y)*Math.min(1,dt*12);
  this.legs.forEach((l,i)=>{const p=ph+i*Math.PI;let th=Math.sin(p)*amp,kn=Math.max(0,Math.sin(p+1.2))*amp*1.4+.05;th=th*(1-cr)+(-1.15+Math.sin(p)*amp*.4)*cr;kn=kn*(1-cr)+(1.55+Math.max(0,Math.sin(p+1.2))*.3)*cr;
   if(cr>.5&&sp<.3){th=i===0?-1.3:-.35;kn=i===0?1.65:2.3;}l.th.rotation.x+=(th-l.th.rotation.x)*Math.min(1,dt*14);l.kn.rotation.x+=(kn-l.kn.rotation.x)*Math.min(1,dt*14);});
  this.flinch=Math.max(0,this.flinch-dt*4);const lean=(run?.25:sp>.3?.08:0)+cr*.12;const ln=st.lean||0;
  this.spine.rotation.x+=((-(st.pitch||0)*.75+lean+this.flinch*.35)-this.spine.rotation.x)*Math.min(1,dt*10);this.spine.rotation.y=Math.sin(ph)*amp*.08;this.spine.rotation.z+=(-ln*.35-this.spine.rotation.z)*Math.min(1,dt*10);this.neck.rotation.x=-(st.pitch||0)*.25-lean*.6;
  if(this.gun){const low=run||st.lower;this.gunG.rotation.set(low?.55:0,low?.5:0,0);this.gunG.position.set(low?-.05:0,low?.3:.36,low?.18:.22);const key=(low?1:0)+'|'+(st.reload>0?1:0);if(st.reload>0||key!==this.lastPose){this.pose(st.reload||0);this.lastPose=key;}}}
 muzzleWorld(out){if(!this.gun)return out.copy(this.root.position).setY(this.root.position.y+1.4);return out.copy(this.gun.P.muzzle).applyMatrix4(this.gun.g.matrixWorld);}
}

// merge meshes into one vertex-coloured mesh (one draw call per bone / per gun)
const VCM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:.1});
function bake(list,parentInv){let n=0;const parts=[];for(const[o,m]of list){let geo=o.geometry.index?o.geometry.toNonIndexed():o.geometry.clone();geo.applyMatrix4(m);parts.push([geo,o.material.color||new THREE.Color(1,1,1)]);n+=geo.attributes.position.count;}
 const P=new Float32Array(n*3),N=new Float32Array(n*3),C=new Float32Array(n*3);let k=0;for(const[q,c]of parts){const c2=q.attributes.position.count;P.set(q.attributes.position.array,k*3);N.set(q.attributes.normal.array,k*3);for(let i=0;i<c2;i++){C[(k+i)*3]=c.r;C[(k+i)*3+1]=c.g;C[(k+i)*3+2]=c.b;}k+=c2;q.dispose();}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(P,3));geo.setAttribute('normal',new THREE.BufferAttribute(N,3));geo.setAttribute('color',new THREE.BufferAttribute(C,3));const m=new THREE.Mesh(geo,VCM);m.castShadow=true;return m;}
function mergeKids(grp){const list=[];for(const o of grp.children.slice()){if(!o.isMesh||o.children.length)continue;o.updateMatrix();list.push([o,o.matrix.clone()]);grp.remove(o);}if(list.length)grp.add(bake(list));}
function mergeGun(gm){const g=gm.g;g.updateMatrixWorld(true);const inv=new THREE.Matrix4().copy(g.matrixWorld).invert();const list=[];
 g.traverse(o=>{if(!o.isMesh||(gm.P.flash&&o.parent===gm.P.flash))return;list.push([o,new THREE.Matrix4().multiplyMatrices(inv,o.matrixWorld)]);});
 for(const[o]of list)o.parent.remove(o);if(gm.P.mag&&gm.P.mag.parent)gm.P.mag.parent.remove(gm.P.mag);g.add(bake(list));}
/* ---------- hit volumes ---------- */
// a: {pos, yaw, crouch(0..1), lean}; ray o+d*t; returns {t, part} or null. part: head | thorax | stomach | arm | leg
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,s=1-cr*.36,lx=Math.cos(a.yaw)*(a.leanV||0)*.3,lz=-Math.sin(a.yaw)*(a.leanV||0)*.3;let best=null;
 // head
 {const hx=p.x+lx,hy=p.y+1.63*s,hz=p.z+lz;const cx=hx-ox,cy=hy-oy,cz=hz-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.15*.15,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 // body cylinder
 const R=.3,fx=ox-p.x-lx*.5,fz=oz-p.z-lz*.5,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-R*R,D=B*B-A*C;
 if(D>0&&A>1e-9){for(const t of[(-B-Math.sqrt(D))/A,(-B+Math.sqrt(D))/A]){if(t<=0||t>=maxT||(best&&t>=best.t))continue;const y=(oy+dy*t-p.y)/s;if(y<0||y>1.5)continue;
   const hx=ox+dx*t-p.x,hz=oz+dz*t-p.z,side=hx*Math.cos(a.yaw)-hz*Math.sin(a.yaw);let part=y<.84?'leg':y<1.1?'stomach':'thorax';if(y>.9&&y<1.46&&Math.abs(side)>.19)part='arm';best={t,part};break;}}
 return best;}
