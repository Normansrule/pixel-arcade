// FAIRWAY LEGENDS — the golfer: a jointed figure (legs, hips, spine, head and cap, arms, club) driven by one swing angle.
// Local frame: facing +z (the ball), target +x. Arms and club live in a "swing" group whose plane passes through the
// target line and the shoulders, so rotating it by alpha sweeps a real swing arc; wrist hinge and body turn follow alpha.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3;
function limb(a,b,r,m){const d=new V().subVectors(b,a),L=d.length();const g=new THREE.CapsuleGeometry(r,Math.max(.01,L-r*2),4,10);const me=new THREE.Mesh(g,m);me.position.copy(a).add(b).multiplyScalar(.5);me.quaternion.setFromUnitVectors(new V(0,1,0),d.normalize());me.castShadow=true;return me;}
export class Golfer{
 constructor(scene,look){this.root=new THREE.Group();scene.add(this.root);this.look=look;this.alpha=0;this.D=.85;
  const M=(c,r=.75)=>new THREE.MeshStandardMaterial({color:c,roughness:r});
  this.m={shirt:M(look.shirt,.8),pants:M(look.pants,.85),skin:M(look.skin,.6),cap:M(look.cap,.7),shoe:M(0xf4f4f2,.5),glove:M(0xfafafa,.7),shaft:new THREE.MeshStandardMaterial({color:0xcfd3da,metalness:.9,roughness:.25}),head:new THREE.MeshStandardMaterial({color:0x2a2d33,metalness:.7,roughness:.3})};
  const r=this.root,m=this.m;
  // legs (static stance, knees flexed)
  this.hips=new THREE.Group();this.hips.position.set(0,.95,-.04);r.add(this.hips);
  for(const s of[-1,1]){const hip=new V(s*.11,.95,-.04),knee=new V(s*.2,.52,.07),ank=new V(s*.25,.09,0);r.add(limb(hip,knee,.085,m.pants),limb(knee,ank,.065,m.pants));
   const shoe=new THREE.Mesh(new THREE.BoxGeometry(.11,.08,.27),m.shoe);shoe.position.set(s*.26,.04,.05);shoe.rotation.y=s*.25;shoe.castShadow=true;r.add(shoe);}
  const pel=new THREE.Mesh(new THREE.CapsuleGeometry(.14,.12,4,10),m.pants);pel.rotation.z=Math.PI/2;this.hips.add(pel);
  const belt=new THREE.Mesh(new THREE.CylinderGeometry(.155,.155,.05,14),M(0x1c1c20,.5));belt.position.y=.08;this.hips.add(belt);
  // spine tilted towards the ball, turning about its own axis
  this.spine=new THREE.Group();this.spine.position.set(0,1.0,-.04);this.spine.rotation.x=.5;r.add(this.spine);this.turn=new THREE.Group();this.spine.add(this.turn);
  const torso=new THREE.Mesh(new THREE.CapsuleGeometry(.17,.3,4,12),m.shirt);torso.position.y=.25;torso.scale.set(1.12,1,.78);torso.castShadow=true;this.turn.add(torso);
  const col=new THREE.Mesh(new THREE.TorusGeometry(.075,.02,6,14),m.shirt);col.position.y=.5;col.rotation.x=Math.PI/2;this.turn.add(col);
  const sh=new THREE.Mesh(new THREE.CapsuleGeometry(.08,.3,4,8),m.shirt);sh.rotation.z=Math.PI/2;sh.position.y=.43;this.turn.add(sh);
  // head looks down at the ball and stays still through the swing
  this.headG=new THREE.Group();this.headG.position.set(0,1.0+.62*Math.cos(.5),-.04+.62*Math.sin(.5));r.add(this.headG);
  const hd=new THREE.Mesh(new THREE.SphereGeometry(.105,18,14),m.skin);hd.scale.set(.92,1.08,1);hd.castShadow=true;this.headG.add(hd);
  const cap=new THREE.Mesh(new THREE.SphereGeometry(.112,18,10,0,Math.PI*2,0,Math.PI/2),m.cap);cap.position.y=.02;this.headG.add(cap);
  const brim=new THREE.Mesh(new THREE.CylinderGeometry(.09,.09,.012,16,1,false,-Math.PI/2,Math.PI),m.cap);brim.position.set(0,.03,.07);brim.scale.set(1,1,1.3);this.headG.add(brim);
  const nose=new THREE.Mesh(new THREE.SphereGeometry(.02,8,6),m.skin);nose.position.set(0,-.01,.1);this.headG.add(nose);
  this.headG.rotation.x=.75;
  this.swing=new THREE.Group();r.add(this.swing);this.arms=new THREE.Group();this.swing.add(this.arms);this.club=new THREE.Group();this.arms.add(this.club);this.ci=-1;this.setClub(6);}
 /** rebuild the club for club index ci (0 driver ... 12 lob wedge, 13 putter) and the stance for it */
 setClub(ci){if(ci===this.ci)return;this.ci=ci;const putt=ci===13;this.D=putt?.56:ci===0?1.0:ci<=3?.92:ci<=8?.82:.76;
  this.spine.rotation.x=putt?.62:.5;const C=new V(0,1.0+.5*Math.cos(this.spine.rotation.x),-.04+.5*Math.sin(this.spine.rotation.x));this.C=C;
  this.headG.position.set(0,1.0+.66*Math.cos(this.spine.rotation.x),-.04+.66*Math.sin(this.spine.rotation.x));
  const ball=new V(0,.02,this.D),v=new V().subVectors(C,ball).normalize(),x=new V(1,0,0),n=new V().crossVectors(x,v).normalize();
  this.swing.position.copy(C);this.swing.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x,v,n));
  const L=C.distanceTo(ball),armL=putt?.56:.62,clubL=L-armL;this.arms.clear();this.club.clear();this.arms.add(this.club);
  const hand=new V(0,-armL,0);for(const s of[-1,1]){const sp=new V(s*.17,.02,-.02),el=new V(s*.09,-armL*.5,.06);this.arms.add(limb(sp,el,.05,this.m.shirt),limb(el,hand.clone().add(new V(s*.015,.04,0)),.042,this.m.skin));}
  const gl=new THREE.Mesh(new THREE.SphereGeometry(.05,10,8),this.m.glove);gl.position.copy(hand);gl.scale.set(1,1.4,1);this.arms.add(gl);
  this.club.position.copy(hand);const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.007,.01,clubL,6),this.m.shaft);shaft.position.y=-clubL/2;shaft.castShadow=true;this.club.add(shaft);
  const grip=new THREE.Mesh(new THREE.CylinderGeometry(.014,.012,.26,8),new THREE.MeshStandardMaterial({color:0x111214,roughness:.8}));grip.position.y=-.1;this.club.add(grip);
  let head;if(putt){head=new THREE.Mesh(new THREE.BoxGeometry(.1,.025,.03),this.m.head);head.position.set(.02,-clubL+.015,.01);}
  else if(ci<=3){head=new THREE.Mesh(new THREE.SphereGeometry(.065,14,10),this.m.head);head.scale.set(1.15,.55,1.05);head.position.set(.02,-clubL+.03,.04);}
  else{head=new THREE.Mesh(new THREE.BoxGeometry(.075,.05,.012),new THREE.MeshStandardMaterial({color:0xd8dce3,metalness:.95,roughness:.2}));head.position.set(.03,-clubL+.025,.0);head.rotation.x=-(.25+(ci-4)*.07);}
  head.castShadow=true;this.club.add(head);this.pose(0,0);}
 /** place at the ball, facing so that the target line runs along yaw (0 = +z) */
 place(bx,by,bz,yaw){const th=yaw-Math.PI/2;this.root.rotation.y=th;const lx=Math.sin(th)*this.D,lz=Math.cos(th)*this.D;this.root.position.set(bx-lx,by,bz-lz);}
 /** alpha: swing angle (− backswing, 0 impact, + follow-through); hinge: wrist cock; down: in the downswing (lag) */
 pose(alpha,hinge){this.alpha=alpha;this.arms.rotation.z=alpha;this.club.rotation.z=hinge;this.turn.rotation.y=-alpha*.42;this.hips.rotation.y=-alpha*.2;
  this.headG.rotation.y=alpha>1.2?-(alpha-1.2)*.6:0;}
 visible(v){this.root.visible=v;}
 dispose(){this.root.parent&&this.root.parent.remove(this.root);this.root.traverse(c=>{if(c.geometry)c.geometry.dispose();});}}
/** swing program: phase p 0..1 over backswing (to top), then downswing + follow (impact at 0). Returns [alpha, hinge]. */
export function swingAt(stage,t,top,putt){if(putt){if(stage==='back')return[-top*t,0];if(stage==='down'){const a=-top+(top*2.1)*t;return[a,0];}return[top*1.1,0];}
 if(stage==='back'){const a=-top*(1-Math.pow(1-t,1.8));return[a,a*.85];}
 if(stage==='down'){// lag: wrists stay cocked until late, then release through impact into the finish
  const a=-top+(top+2.35)*t,h=a<0?-top*.85*Math.pow(-a/top,.55):a*.55;return[a,h];}
 return[2.35,2.35*.55];}
