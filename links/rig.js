// FAIRWAY LEGENDS — the golfer: a proportioned figure (≈1.8 m) built from lathed and capsule parts merged per rigid
// segment (pelvis, torso, head, arms, club) with vertex colours, plus two-bone IK legs. Local frame: facing +z (the
// ball), target +x. Arms and club live in a "swing" group whose plane passes through the target line and the
// shoulders, so rotating it by alpha sweeps a real swing arc; hips, shoulders, knees, weight shift, trail-heel
// release and the head all follow alpha, so a backswing coils and the finish ends tall, facing the target.
import * as THREE from '../vendor/three.module.min.js';
import {merge} from './world.js';
const V=THREE.Vector3,C=c=>new THREE.Color(c);
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=sx,sz=sx)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
/** capsule-ish tapered limb from the origin along +y, length L, radius r0 at the root and r1 at the tip */
function taper(L,r0,r1,seg=12){const pts=[];const n=6;for(let i=0;i<=n;i++){const a=-Math.PI/2+i/n*Math.PI/2;pts.push(new THREE.Vector2(Math.cos(a)*r0,Math.sin(a)*r0));}
 for(let i=1;i<=6;i++){const t=i/7;pts.push(new THREE.Vector2(r0+(r1-r0)*t+Math.sin(t*Math.PI)*(r0*.08),t*L));}
 for(let i=0;i<=n;i++){const a=i/n*Math.PI/2;pts.push(new THREE.Vector2(Math.cos(a)*r1,L+Math.sin(a)*r1));}
 return new THREE.LatheGeometry(pts,seg);}
/** orient a limb geometry (built along +y) from a to b */
function between(a,b){const d=new V().subVectors(b,a);return new THREE.Matrix4().compose(a,new THREE.Quaternion().setFromUnitVectors(new V(0,1,0),d.normalize()),new V(1,1,1));}
const UP=new V(0,1,0);
export class Golfer{
 constructor(scene,look){this.root=new THREE.Group();scene.add(this.root);this.look=look;this.alpha=0;this.D=.85;this.stance=.23;
  const cloth=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.78}),skin=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55});
  this.m={cloth,skin,shaft:new THREE.MeshStandardMaterial({vertexColors:true,metalness:.85,roughness:.28}),wood:new THREE.MeshStandardMaterial({color:0x15181e,metalness:.35,roughness:.18}),iron:new THREE.MeshStandardMaterial({color:0xd6dae0,metalness:1,roughness:.2}),putt:new THREE.MeshStandardMaterial({color:0x3a3d44,metalness:.9,roughness:.32})};
  const sh=C(look.shirt),pa=C(look.pants),sk=C(look.skin),cp=C(look.cap),hair=C(look.hair||0x2a1d14),belt=C(0x1a1a1e),wh=C(0xf2f2ee),sole=C(0x2a2c30);
  const r=this.root;
  // pelvis + belt (in the hips group)
  this.hips=new THREE.Group();r.add(this.hips);
  this.hips.add(this.mesh(merge([[new THREE.SphereGeometry(.16,18,12),M4(0,0,0,0,0,0,1.06,.72,.82),pa],[new THREE.CylinderGeometry(.158,.152,.05,18),M4(0,.085,0,0,0,0,1,1,.84),belt],[new THREE.BoxGeometry(.05,.035,.02),M4(0,.085,.13),C(0xc9c3b4)]]),cloth));
  // legs: thigh / shin / shoe per side, posed by IK each frame
  this.legs=[-1,1].map(s=>{const th=this.mesh(merge([[taper(.45,.096,.066),null,pa]]),cloth),sn=this.mesh(merge([[taper(.44,.062,.044),null,pa]]),cloth);
   const shoe=this.mesh(merge([[new THREE.CapsuleGeometry(.05,.18,4,12).rotateX(Math.PI/2),M4(0,.005,.04,0,0,0,1.05,.9,1),wh],[new THREE.BoxGeometry(.084,.02,.25),M4(0,-.03,.04),sole],[new THREE.CylinderGeometry(.04,.042,.05,10),M4(0,.03,-.04),wh]]),cloth);
   r.add(th,sn,shoe);return{s,th,sn,shoe};});
  // spine + torso (turn group rotates the shoulders about the spine)
  this.spine=new THREE.Group();r.add(this.spine);this.turn=new THREE.Group();this.spine.add(this.turn);
  const prof=[[.0,-.06],[.135,-.05],[.148,.04],[.142,.14],[.158,.26],[.178,.37],[.176,.44],[.13,.52],[.065,.565],[.0,.57]].map(p=>new THREE.Vector2(p[0],p[1]));
  this.turn.add(this.mesh(merge([[new THREE.LatheGeometry(prof,20),M4(0,0,0,0,0,0,1.18,1,.7),sh],[new THREE.CapsuleGeometry(.062,.2,4,10).rotateZ(Math.PI/2),M4(0,.45,-.01,0,0,0,1,1,.85),sh],
   [new THREE.TorusGeometry(.062,.018,6,16),M4(0,.56,.01,Math.PI/2-.25,0),sh],[new THREE.CylinderGeometry(.044,.05,.12,10),M4(0,.6,.01),sk],[new THREE.BoxGeometry(.03,.12,.012),M4(0,.5,.12,-.1),sh.clone().multiplyScalar(.85)]]),cloth));
  // head: skull, jaw, ears, nose, hair, cap with curved brim
  this.headG=new THREE.Group();this.headG.rotation.order='YXZ';r.add(this.headG);
  const brim=new THREE.CylinderGeometry(.1,.1,.01,18,1,false,-Math.PI/2,Math.PI);{const p=brim.attributes.position;for(let i=0;i<p.count;i++){const x=p.getX(i);p.setY(i,p.getY(i)-x*x*1.6);}brim.computeVertexNormals();}
  this.headG.add(this.mesh(merge([[new THREE.SphereGeometry(.1,20,14),M4(0,0,0,0,0,0,.9,1.06,1),sk],[new THREE.SphereGeometry(.072,14,10),M4(0,-.065,.028,0,0,0,1,.8,1),sk],
   [new THREE.SphereGeometry(.022,8,6),M4(.088,-.005,-.005,0,0,0,.5,1,.8),sk],[new THREE.SphereGeometry(.022,8,6),M4(-.088,-.005,-.005,0,0,0,.5,1,.8),sk],[new THREE.SphereGeometry(.018,8,6),M4(0,-.02,.1,0,0,0,.8,1,1.1),sk],
   [new THREE.SphereGeometry(.098,16,10),M4(0,-.01,-.02,0,0,0,.93,.95,.98),hair],[new THREE.SphereGeometry(.106,20,10,0,Math.PI*2,0,Math.PI/2),M4(0,.018,0,0,0,0,.95,.9,1.02),cp],[brim,M4(0,.03,.075,-.12,0,0,1,1,1.25),cp],[new THREE.SphereGeometry(.012,6,4),M4(0,.112,0),cp]]),skin));
  this.swing=new THREE.Group();r.add(this.swing);this.arms=new THREE.Group();this.swing.add(this.arms);this.club=new THREE.Group();this.arms.add(this.club);this.ci=-1;this.setClub(6);}
 mesh(g,m){const me=new THREE.Mesh(g,m);me.castShadow=true;me.receiveShadow=true;return me;}
 /** rebuild the club for club index ci (0 driver ... 12 lob wedge, 13 putter) and the stance for it */
 setClub(ci){if(ci===this.ci)return;this.ci=ci;const putt=ci===13;this.D=putt?.56:ci===0?1.0:ci<=3?.92:ci<=8?.82:.76;this.stance=putt?.16:ci<=3?.22:ci<=8?.2:.17;
  this.tilt=putt?.68:.55;this.H0=new V(0,putt?.88:.9,-.1);this.spine.position.set(0,this.H0.y+.08,this.H0.z);this.spine.rotation.x=this.tilt;
  const Cs=new V(0,this.spine.position.y+.46*Math.cos(this.tilt),this.spine.position.z+.46*Math.sin(this.tilt));this.C=Cs;
  this.headG.position.set(0,this.spine.position.y+.72*Math.cos(this.tilt),this.spine.position.z+.72*Math.sin(this.tilt));
  const ball=new V(0,.02,this.D),v=new V().subVectors(Cs,ball).normalize(),x=new V(1,0,0),n=new V().crossVectors(x,v).normalize();
  this.swing.position.copy(Cs);this.swing.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,v,n));
  const L=Cs.distanceTo(ball),armL=putt?.55:.6,clubL=L-armL;
  this.arms.children.forEach(c=>{if(c!==this.club){c.geometry.dispose();}});this.club.children.forEach(c=>c.geometry.dispose());this.arms.clear();this.club.clear();this.arms.add(this.club);
  const look=this.look,sh=C(look.shirt),sk=C(look.skin),wh=C(0xf6f6f2);const hand=new V(0,-armL,0),parts=[];
  for(const s of[-1,1]){const sp=new V(s*.17,.02,-.02),el=new V(s*.075,-armL*.5,.07),wr=hand.clone().add(new V(s*.012,.06,0));
   parts.push([taper(sp.distanceTo(el),.058,.047),between(sp,el),sh],[taper(.17,.056,.05),between(sp,sp.clone().lerp(el,.55)),sh],[taper(el.distanceTo(wr),.043,.031),between(el,wr),sk]);}
  parts.push([new THREE.SphereGeometry(.042,12,8),M4(hand.x+.004,hand.y+.035,hand.z,0,0,0,1,1.35,.85),wh],[new THREE.SphereGeometry(.04,12,8),M4(hand.x-.004,hand.y-.015,hand.z+.01,0,0,0,1,1.3,.85),sk]);
  this.arms.add(this.mesh(merge(parts),this.m.skin));
  this.club.position.copy(hand);
  this.club.add(this.mesh(merge([[new THREE.CylinderGeometry(.0065,.0105,clubL,8),M4(0,-clubL/2,0),C(0xc8ccd4)],[new THREE.CylinderGeometry(.0145,.012,.27,10),M4(0,-.09,0),C(0x15161a)],[new THREE.CylinderGeometry(.011,.0075,.06,8),M4(.006,-clubL+.055,0,0,0,-.2),C(0x30333a)]]),this.m.shaft));
  let head;if(putt){head=this.mesh(merge([[new THREE.BoxGeometry(.105,.024,.028),M4(.02,-clubL+.014,.006)],[new THREE.CylinderGeometry(.006,.006,.05,6),M4(.0,-clubL+.035,.0)]]),this.m.putt);}
  else if(ci<=3){const s=ci===0?1:ci===1?.8:.7;head=this.mesh(merge([[new THREE.SphereGeometry(.062*s,18,12),M4(.035*s,-clubL+.026*s,.03*s,0,0,0,1.25,.55,1.05)],[new THREE.CylinderGeometry(.06*s,.06*s,.002,18,1,false,0,Math.PI),M4(.035*s,-clubL+.03*s,.03*s,0,0,0,1.25,1,1.05)]]),this.m.wood);}
  else{const sh2=new THREE.Shape();sh2.moveTo(0,0);sh2.lineTo(.078,0);sh2.quadraticCurveTo(.088,.004,.084,.05);sh2.lineTo(.012,.034);sh2.quadraticCurveTo(0,.03,0,.012);sh2.lineTo(0,0);
   const g=new THREE.ExtrudeGeometry(sh2,{depth:.016,bevelEnabled:true,bevelThickness:.004,bevelSize:.003,bevelSegments:2});g.translate(-.005,-clubL+.002,-.008);g.rotateX(0);head=this.mesh(g,this.m.iron);head.rotation.x=-(.25+(ci-4)*.07);head.position.set(0,0,0);}
  this.club.add(head);this.pose(0,0);}
 /** place at the ball, facing so that the target line runs along yaw (0 = +z) */
 place(bx,by,bz,yaw){const th=yaw-Math.PI/2;this.root.rotation.y=th;const lx=Math.sin(th)*this.D,lz=Math.cos(th)*this.D;this.root.position.set(bx-lx,by,bz-lz);}
 /** alpha: swing angle (− backswing, 0 impact, + follow-through); hinge: wrist cock */
 pose(alpha,hinge){this.alpha=alpha;this.arms.rotation.z=alpha;this.club.rotation.z=hinge;const putt=this.ci===13;
  const bk=Math.min(1,Math.max(0,-alpha/2.2)),fw=Math.min(1,Math.max(0,alpha/2.35)),k=putt?.15:1;
  // shoulders coil ~90°, hips ~45° and fire open through the finish
  this.turn.rotation.y=alpha*(alpha<0?.66:.62)*k;const hy=(alpha<0?alpha*.3:alpha*.58)*k;this.hips.rotation.y=hy;this.spine.rotation.y=hy*.35;
  const shift=(-.035*bk+.085*fw)*k,dip=.02*bk-.02*fw;this.hips.position.set(this.H0.x+shift,this.H0.y-dip+.01*fw,this.H0.z+.03*fw);this.spine.position.x=shift*.7;
  // head: still over the ball until the arms are past horizontal, then turns to watch the flight
  this.headG.rotation.y=alpha>.9?(alpha-.9)*.75*k:alpha*.04;this.headG.rotation.x=.72-Math.max(0,fw-.35)*.55*k;this.headG.position.x=shift*.5;
  // legs: two-bone IK from the hip joints to planted feet; the trail heel peels up into the finish
  const hc=this.hips.position,c=Math.cos(hy),sn=Math.sin(hy);
  for(const L of this.legs){const s=L.s,hj=new V(hc.x+c*s*.1,hc.y-.04,hc.z-sn*s*.1);const trail=s<0;
   const heel=trail?fw*fw:0,ank=new V(s*this.stance+(trail?.07*heel:0),.085+.075*heel,.02+(trail?.03*heel:0));
   const bend=trail?new V(-.2+1.4*heel,0,1):new V(.2-.5*bk+.1*fw,0,1);
   const kn=ik(hj,ank,.45,.44,bend);L.th.matrix.copy(between(hj,kn));L.sn.matrix.copy(between(kn,ank));
   L.shoe.position.set(ank.x,ank.y-.05+.02*heel,ank.z+.04*heel*0);L.shoe.rotation.set(heel*.75,s*.28+(trail?heel*.9:fw*.25),0,'YXZ');}
  this.legs.forEach(L=>{L.th.matrixAutoUpdate=L.sn.matrixAutoUpdate=false;L.th.matrixWorldNeedsUpdate=L.sn.matrixWorldNeedsUpdate=true;});}
 visible(v){this.root.visible=v;}
 dispose(){this.root.parent&&this.root.parent.remove(this.root);this.root.traverse(c=>{if(c.geometry)c.geometry.dispose();});Object.values(this.m).forEach(m=>m.dispose());}}
function ik(H,A,L1,L2,bend){const d0=A.clone().sub(H);let d=d0.length();const u=d0.clone().divideScalar(d);d=Math.min(d,L1+L2-1e-3);const a=(L1*L1-L2*L2+d*d)/(2*d),h=Math.sqrt(Math.max(0,L1*L1-a*a));
 const b=bend.clone().addScaledVector(u,-bend.dot(u)).normalize();return H.clone().addScaledVector(u,a).addScaledVector(b,h);}
/** swing program: phase p 0..1 over backswing (to top), then downswing + follow (impact at 0). Returns [alpha, hinge]. */
export function swingAt(stage,t,top,putt){if(putt){if(stage==='back')return[-top*t,0];if(stage==='down'){const a=-top+(top*2.1)*t;return[a,0];}return[top*1.1,0];}
 if(stage==='back'){const a=-top*(1-Math.pow(1-t,1.8));return[a,a*.85];}
 if(stage==='down'){// lag: wrists stay cocked until late, then release through impact into the finish
  const a=-top+(top+2.35)*t,h=a<0?-top*.85*Math.pow(-a/top,.55):a*.55;return[a,h];}
 return[2.35,2.35*.55];}
