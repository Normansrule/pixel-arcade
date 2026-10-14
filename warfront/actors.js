// IRON VANGUARD (adapted from FRONTLINE OPS) — soldiers: one skinned mesh per operator (rounded gear, plate carrier, helmet kit, rifle) driven by a
// procedural rig: walk/run/strafe cycles, crouch, aim pitch, two-bone arm IK onto the weapon, reload, recoil, flinch, topple deaths.
import * as THREE from '../vendor/three.module.min.js';
const V=THREE.Vector3,PI=Math.PI,cl=(v,a,b)=>v<a?a:v>b?b:v;
const UA=.28,LA=.26,TH=.45,SH=.45;
const M4=(x=0,y=0,z=0,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1)=>new THREE.Matrix4().compose(new V(x,y,z),new THREE.Quaternion().setFromEuler(new THREE.Euler(rx,ry,rz)),new V(sx,sy,sz));
// rounded box with analytic normals
function rbox(w,h,d,r=.02,seg=3){r=Math.min(r,w/2-.001,h/2-.001,d/2-.001);const g=new THREE.BoxGeometry(w,h,d,seg,seg,seg),p=g.attributes.position,n=g.attributes.normal,v=new V(),c=new V(),hw=w/2-r,hh=h/2-r,hd=d/2-r;
 for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i);c.set(cl(v.x,-hw,hw),cl(v.y,-hh,hh),cl(v.z,-hd,hd));v.sub(c);if(v.lengthSq()<1e-10)v.fromBufferAttribute(n,i);v.normalize();n.setXYZ(i,v.x,v.y,v.z);p.setXYZ(i,c.x+v.x*r,c.y+v.y*r,c.z+v.z*r);}return g;}
const cap=(r,len,rs=10)=>{const g=new THREE.CapsuleGeometry(r,Math.max(.001,len),4,rs);g.translate(0,-len/2,0);return g;};
const CY=(a,b,h,s=10)=>new THREE.CylinderGeometry(a,b,h,s),SP=(r,a=12,b=10,ps=0,pl=PI*2,ts=0,tl=PI)=>new THREE.SphereGeometry(r,a,b,ps,pl,ts,tl);

const SKIN=[0xc89070,0x8a5a3c,0xe0b090,0x6a4430,0xb07850];
const BONES=[['root',-1,0,0,0],['hips',0,0,.95,0],['spine',1,0,.08,0],['chest',2,0,.24,0],['neck',3,0,.28,0],['head',4,0,.07,0],
 ['armL',3,.21,.2,0],['foreL',6,0,-UA,0],['handL',7,0,-LA,0],['armR',3,-.21,.2,0],['foreR',9,0,-UA,0],['handR',10,0,-LA,0],
 ['thighL',1,.11,0,0],['shinL',12,0,-TH,0],['footL',13,0,-SH,0],['thighR',1,-.11,0,0],['shinR',15,0,-TH,0],['footR',16,0,-SH,0],['gun',3,-.08,.12,.32]];
const BI={};BONES.forEach((b,i)=>BI[b[0]]=i);
// bind-pose world positions (rest rotations are identity)
const BW=BONES.map(()=>new V());BONES.forEach((b,i)=>{BW[i].set(b[2],b[3],b[4]);if(b[1]>=0)BW[i].add(BW[b[1]]);});

let KIT=null;
export function makeKit(TX){KIT={TX,mats:{}};
 const mk=(map)=>new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:.86,metalness:.02});KIT.mats.A=mk(TX.kitA);KIT.mats.B=mk(TX.kitB);KIT.mats.V=mk(TX.kitA);
 KIT.flash=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide});return KIT;}

// ---------- geometry assembly ----------
function buildBody(type,rnd,cls){const parts=[];const ally=type==='ally',vip=type==='vip';
 // add(bone, geo, matrix(bone-local), colour, camo?)
 const add=(bone,geo,m,col,camo=false)=>parts.push({b:BI[bone],geo,m:m||new THREE.Matrix4(),col:new THREE.Color(col),camo});
 const skin=SKIN[rnd()*SKIN.length|0];
 const gear=ally?[0x5a6244,0x6a6448,0x4e5a3e][rnd()*3|0]:[0x3a3d40,0x44463e,0x35383a][rnd()*3|0];
 const gear2=ally?0x7a6c4e:0x4a4c4e,glove=ally?0x5a4c38:0x262728,boot=ally?0x8a7050:0x2a2a2c,helm=ally?[0x8a7a58,0x6e6a4c][rnd()*2|0]:[0x3a3c40,0x4a4c44][rnd()*2|0],camoW=0xffffff,pants=0xe4e4e4;
 if(vip){const shirt=0xe8e6e0,trou=0x2a3040;// civilian: shirt, trousers, shoes
  add('chest',rbox(.38,.44,.22,.07),M4(0,.13,0),shirt);add('spine',rbox(.33,.2,.2,.06),M4(0,.06,0),shirt);add('hips',rbox(.34,.2,.21,.06),M4(0,.0,0),trou);
  for(const s of['L','R']){add('arm'+s,cap(.052,UA-.06),M4(0,-.03,0),shirt);add('fore'+s,cap(.045,LA-.06),M4(0,-.03,0),shirt);add('hand'+s,rbox(.07,.1,.04,.018),M4(0,-.05,0),skin);
   add('thigh'+s,cap(.075,TH-.08),M4(0,-.04,0),trou);add('shin'+s,cap(.06,SH-.06),M4(0,-.03,0),trou);add('foot'+s,rbox(.1,.07,.24,.03),M4(0,-.035,.05),0x3a2a20);}
  add('neck',CY(.05,.055,.1),M4(0,.02,0),skin);add('head',SP(.105,14,12),M4(0,.11,.01,0,0,0,1,1.08,1.02),skin);add('head',SP(.11,14,8,0,PI*2,0,PI*.5),M4(0,.13,-.005),0x2a2018);
  return parts;}
 // torso: camo shirt + plate carrier with pouches
 add('chest',rbox(.37,.42,.22,.07),M4(0,.13,0),camoW,true);add('spine',rbox(.33,.2,.2,.06),M4(0,.06,0),camoW,true);
 add('chest',rbox(.36,.3,.07,.025),M4(0,.12,.12),gear);add('chest',rbox(.34,.32,.06,.025),M4(0,.13,-.12),gear);add('chest',rbox(.39,.08,.24,.02),M4(0,-.01,0),gear);
 for(let i=-1;i<=1;i++)add('chest',rbox(.09,.12,.055,.015),M4(i*.1,.04,.165),gear2);add('chest',rbox(.07,.09,.05,.015),M4(.12,.2,.155),gear2);
 for(const s of[-1,1])add('chest',rbox(.06,.03,.24,.012),M4(s*.12,.29,0),gear);// shoulder straps
 add('chest',rbox(.06,.16,.06,.015),M4(.2,.12,-.02),gear2);add('chest',CY(.006,.006,.22,4),M4(.2,.3,-.04),0x111111);// radio + antenna
 if(rnd()<.6)add('chest',rbox(.3,.36,.16,.05),M4(0,.12,-.22),ally?0x6a6448:0x2e3032);// backpack
 // hips: belt + pouches, pants
 add('hips',rbox(.35,.22,.22,.07),M4(0,-.02,0),pants,true);add('hips',rbox(.37,.06,.24,.02),M4(0,.07,0),gear2);
 for(const s of[-1,1])add('hips',rbox(.06,.1,.06,.015),M4(s*.16,.02,.08),gear2);add('hips',rbox(.06,.12,.06,.015),M4(-.17,.0,-.02),gear);
 // arms
 for(const s of['L','R'])add('arm'+s,CY(.064,.064,.05,12),M4(0,-.11,0),ally?0x2a6ad8:0xc82418);
 for(const s of['L','R']){const sx=s==='L'?1:-1;add('arm'+s,cap(.058,UA-.07),M4(0,-.035,0),camoW,true);add('arm'+s,rbox(.12,.08,.12,.03),M4(0,-.005,0),gear);
  add('fore'+s,cap(.05,LA-.07),M4(0,-.035,0),camoW,true);add('fore'+s,CY(.052,.052,.05,10),M4(0,-.2,0),glove);
  add('hand'+s,rbox(.075,.1,.05,.02),M4(0,-.05,.0),glove);add('hand'+s,rbox(.025,.06,.025,.01),M4(sx*.035,-.03,.025,.3),glove);void sx;
  // legs
  add('thigh'+s,cap(.085,TH-.1),M4(0,-.05,0),pants,true);add('thigh'+s,rbox(.06,.12,.12,.02),M4(sx*.085,-.18,.0),gear2);
  add('shin'+s,cap(.066,SH-.08),M4(0,-.04,0),pants,true);add('shin'+s,rbox(.11,.12,.06,.025),M4(0,-.04,.06),gear);
  add('foot'+s,rbox(.11,.11,.27,.035),M4(0,-.045,.05),boot);add('foot'+s,rbox(.115,.025,.28,.01),M4(0,-.095,.05),0x161616);}
 // head
 add('neck',CY(.05,.056,.11),M4(0,.02,0),skin);add('head',SP(.102,14,12),M4(0,.1,.012,0,0,0,1,1.1,1.04),skin);add('head',rbox(.03,.04,.03,.01),M4(0,.09,.11),skin);
 const balac=!ally&&rnd()<.6;if(balac){add('head',SP(.106,14,12,0,PI*2,PI*.42,PI*.58),M4(0,.1,.012,0,0,0,1,1.1,1.04),0x1c1d1e);}
 const capT=ally?(rnd()<.85?'helm':'cap'):(rnd()<.65?'helm':'beanie');
 if(capT==='helm'){add('head',SP(.138,16,10,0,PI*2,0,PI*.5),M4(0,.13,0,0,0,0,1,.92,1.05),helm);add('head',CY(.142,.142,.035,18),M4(0,.13,0,0,0,0,1,1,1.05),helm);
  add('head',rbox(.05,.035,.03,.008),M4(0,.205,.125,-.4),0x1a1a1a);for(const s of[-1,1])add('head',rbox(.02,.04,.12,.006),M4(s*.135,.15,0),0x2a2a2a);
  if(rnd()<.7)for(const s of[-1,1])add('head',CY(.045,.045,.04,12),M4(s*.115,.1,.0,0,0,PI/2),0x2a2c2a);// ear pro
  if(!ally||rnd()<.4)add('head',rbox(.19,.05,.05,.02),M4(0,.16,.11,.25),0x111214);}// goggles up on helmet
 else if(capT==='cap'){add('head',SP(.115,14,8,0,PI*2,0,PI*.5),M4(0,.12,0),helm);add('head',rbox(.13,.012,.09,.005),M4(0,.13,.11,.15),helm);}
 else{add('head',SP(.118,14,8,0,PI*2,0,PI*.55),M4(0,.115,0),0x26282a);}
 if(!balac&&rnd()<.4&&ally)add('head',SP(.1,12,8,0,PI*2,PI*.62,PI*.3),M4(0,.1,.02,0,0,0,1,1.1,1.05),0x3a2a1c);// beard
 // rifle on the gun bone (+z forward)
 const gc=ally?0x2c2d2f:0x232425,fur=ally?(rnd()<.5?0x8a7a5a:0x2c2d2f):0x3a2a20;
 add('gun',rbox(.05,.08,.34,.012),M4(0,0,.06),gc);add('gun',rbox(.055,.06,.26,.015),M4(0,.0,.33),fur);add('gun',CY(.012,.012,.3,8),M4(0,.01,.58,PI/2),0x18191a);
 add('gun',rbox(.04,.13,.07,.012),M4(0,-.1,.12,.25),0x1e1f20);add('gun',rbox(.035,.1,.04,.01),M4(0,-.09,-.04,-.3),fur);add('gun',rbox(.045,.09,.22,.02),M4(0,-.02,-.2),fur);
 add('gun',rbox(.04,.05,.09,.01),M4(0,.07,.04),0x18191a);
 if(cls==='medic'){add('armL',CY(.066,.066,.07,12),M4(0,-.04,0),0xf2f2f2);add('armL',rbox(.03,.045,.01,.004),M4(0,-.04,.066),0xd82020);add('chest',rbox(.2,.16,.06,.02),M4(0,.06,-.27),0xe8e8e8);add('chest',rbox(.06,.12,.02,.006),M4(0,.06,-.305),0xd82020);}
 if(cls==='engineer'){add('chest',CY(.075,.075,1.05,10),M4(.13,.16,-.24,.35,0,0),0x4a5038);add('chest',CY(.1,.06,.22,10),M4(.13,.55,-.06,.35,0,0),0x3a3e30);}
 if(cls==='recon'){add('gun',CY(.011,.011,.42,6),M4(0,.01,.86,PI/2),0x18191a);add('gun',CY(.026,.026,.24,10),M4(0,.1,.1,PI/2),0x18191a);add('head',CY(.17,.17,.02,14),M4(0,.15,0),ally?0x6a6448:0x44463e);}
 if(cls==='assault')add('chest',rbox(.24,.14,.1,.02),M4(0,-.06,.19),ally?0x6a6448:0x2e3032);
 return parts;}
function assemble(parts){const P=[],N=[],U=[],C=[],SI=[],SW=[];const nm=new THREE.Matrix3(),v=new V(),bind=new THREE.Matrix4();
 for(const pt of parts){const g=pt.geo.index?pt.geo.toNonIndexed():pt.geo,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;bind.makeTranslation(BW[pt.b].x,BW[pt.b].y,BW[pt.b].z).multiply(pt.m);nm.getNormalMatrix(bind);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(bind);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);
   if(pt.camo&&u)U.push(u.getX(i)*.5,u.getY(i));else U.push(.75,.5);C.push(pt.col.r,pt.col.g,pt.col.b);SI.push(pt.b,0,0,0);SW.push(1,0,0,0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));return g;}

// ---------- 2-bone IK (shoulder-space): rest limbs point down -Y ----------
const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole,l1=UA,l2=LA){_d.subVectors(T,S);let d=_d.length();d=cl(d,.08,l1+l2-.004);_d.normalize();const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}

const tq=new THREE.Quaternion(),tq2=new THREE.Quaternion(),tE=new THREE.Euler(),tv=new V(),tv2=new V(),tPole=new V(),HANDQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(PI/2,0,0));
export class Rig{
 constructor(type,seed=Math.random(),cls='assault'){const{mats}=KIT;let s=seed*2147483646+1|0;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  this.type=type;this.root=new THREE.Group();const bones=BONES.map(b=>{const o=new THREE.Bone();o.name=b[0];o.position.set(b[2],b[3],b[4]);return o;});BONES.forEach((b,i)=>{if(b[1]>=0)bones[b[1]].add(bones[i]);});
  const geo=assemble(buildBody(type,rnd,cls));const mesh=new THREE.SkinnedMesh(geo,type==='ally'?mats.A:type==='vip'?mats.V:mats.B);mesh.add(bones[0]);mesh.castShadow=true;mesh.receiveShadow=true;
  this.root.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));mesh.boundingSphere=new THREE.Sphere(new V(0,.9,0),2.3);this.mesh=mesh;
  this.b={};for(const o of bones)this.b[o.name]=o;
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.45,.45),KIT.flash);this.flash.position.set(0,.01,.82);this.flash.visible=false;const f2=new THREE.Mesh(new THREE.PlaneGeometry(.55,.3),KIT.flash);f2.rotation.y=PI/2;f2.position.z=.12;this.flash.add(f2);if(type!=='vip')this.b.gun.add(this.flash);else this.b.gun.visible=false;
  this.phase=rnd()*6;this.die=0;this.dieDir=1;this.flinch=0;this.kick=0;this.aimK=0;this.sprK=0;this.relK=0;this.ang=0;this.angV=0;this.throwT=0;this.hy=.95;this.idleT=rnd()*10;}
 // st: {speed, vf, vs (local fwd/side speed), crouch, pitch, aim (0/1), sprint, reload (0..1 progress or -1), dead, seat (seated crew pose: thighs level, rifle stowed)}
 update(dt,st){const B=this.b,r=this.root;this.idleT+=dt;
  if(st.dead){this.topple(dt);return;}
  if(this.die){this.die=0;this.ang=0;this.angV=0;this.mesh.rotation.set(0,0,0);this.mesh.position.set(0,0,0);}
  const sp=st.speed||0,cr=st.crouch||0;const moving=sp>.25;
  const strideRate=PI*sp/(sp>5.5?1.9:1.45);this.phase+=dt*(moving?strideRate:0);const ph=this.phase,amp=Math.min(1,sp/3.6)*(sp>5.5?1:.7);
  const k=Math.min(1,dt*12);
  this.sprK+=((st.sprint?1:0)-this.sprK)*Math.min(1,dt*6);this.aimK+=((st.aim?1:0)-this.aimK)*Math.min(1,dt*7);const rel=st.reload>=0?1:0;this.relK+=(rel-this.relK)*Math.min(1,dt*8);
  // hips / spine
  const vf=st.vf??sp,vs=st.vs??0,fk=sp>.2?vf/sp:1,sk=sp>.2?vs/sp:0;
  const hy=.95-cr*.37-(moving?Math.abs(Math.sin(ph))*.04*amp:Math.sin(this.idleT*1.6)*.004)-this.sprK*.03;this.hy+=(hy-this.hy)*k;B.hips.position.y=this.hy;
  B.hips.rotation.y=Math.sin(ph)*.12*amp*fk;B.hips.rotation.z=Math.sin(ph)*.04*amp;
  this.flinch=Math.max(0,this.flinch-dt*5);this.kick=Math.max(0,this.kick-dt*14);
  const lean=this.sprK*.28+(moving?.06:0)+cr*.18;const pitch=st.pitch||0;
  B.spine.rotation.x+=((lean-pitch*.35+this.flinch*.25)-B.spine.rotation.x)*k;B.spine.rotation.y=-B.hips.rotation.y*.8;B.spine.rotation.z=Math.sin(this.idleT*.9)*.01;
  B.chest.rotation.x=-pitch*.45-lean*.3;B.neck.rotation.x=-pitch*.2-lean*.5+this.flinch*.3;B.head.rotation.y=Math.sin(this.idleT*.37)*.15*(1-this.aimK);
  // legs (FK) — cycle follows local move direction; crouch blends to a kneeling stance
  const legs=[['L',0],['R',PI]];for(const[s,o]of legs){const p=ph+o;let th=-Math.sin(p)*amp*.75*fk,kn=Math.max(0,Math.sin(p+1.3))*amp*1.25+.06,tz=Math.sin(p)*amp*.35*sk*(s==='L'?1:-1),ft=0;
   if(!moving){th=s==='L'?-.05:.08;kn=.08;tz=s==='L'?.06:-.06;}
   const ct=s==='L'?-1.25:-.35,ck=s==='L'?1.95:2.2;th=th*(1-cr)+(ct+th*.3)*cr;kn=kn*(1-cr)+ck*cr;ft=-(th+kn)*(cr*.9)+(moving?Math.min(0,Math.sin(p+.4))*.3*amp:0);
   if(st.seat){th=-1.5;kn=1.45;tz=s==='L'?.08:-.08;ft=.05;}
   B['thigh'+s].rotation.x+=(th-B['thigh'+s].rotation.x)*k;B['thigh'+s].rotation.z+=(tz+(s==='L'?.02:-.02)-B['thigh'+s].rotation.z)*k;B['shin'+s].rotation.x+=(kn-B['shin'+s].rotation.x)*k;B['foot'+s].rotation.x+=(ft-B['foot'+s].rotation.x)*k;}
  // weapon pose: low-ready ↔ shouldered ↔ sprint carry ↔ reload tilt
  const g=B.gun;g.scale.setScalar(st.seat?1e-3:1);if(this.type==='vip'){this.vipArms(dt);return;}
  const a=this.aimK*(1-this.sprK),lr=(1-this.aimK)*(1-this.sprK);
  g.position.set(-.085+this.sprK*.1,.14*a+.03*lr+.05*this.sprK-.04*this.relK,.3*a+.3*lr+.2*this.sprK-this.kick*.05);
  tE.set(.5*lr+.25*this.sprK-pitch*.55*a+.15*this.relK-this.kick*.12+Math.sin(this.idleT*1.1)*.01*lr,.95*this.sprK-.05*a,-.6*this.relK*Math.min(1,st.reload>=0?Math.sin(Math.max(0,st.reload)*PI)*1.5:1));g.quaternion.setFromEuler(tE);
  // IK: right hand on pistol grip, left on handguard (or magazine during reload)
  const gripR=tv.set(0,-.07,.1).applyQuaternion(g.quaternion).add(g.position);ik(B.armR,B.foreR,B.armR.position,gripR,tPole.set(-.8,-.6,-.3));
  let left;if(this.relK>.05&&st.reload>=0){const t=st.reload,down=t>.15&&t<.65?Math.sin((t-.15)/.5*PI):0;left=tv2.set(0,-.12-down*.18,.08).applyQuaternion(g.quaternion).add(g.position);left.x+=down*.08;left.z-=down*.1;}
  else left=tv2.set(0,-.04,.36).applyQuaternion(g.quaternion).add(g.position);
  if(this.throwT>0){this.throwT-=dt;const t=1-this.throwT/.6,arc=Math.sin(t*PI);left=tv2.set(.12,.2+arc*.25,.05+t*.4);}
  ik(B.armL,B.foreL,B.armL.position,left,tPole.set(.8,-.6,-.3));
  // hands follow the weapon orientation
  for(const s of['L','R']){tq.copy(B['arm'+s].quaternion).multiply(B['fore'+s].quaternion).invert();tq2.copy(g.quaternion).multiply(HANDQ);B['hand'+s].quaternion.copy(tq.multiply(tq2));}}
 vipArms(dt){const B=this.b;const t=this.idleT;for(const s of['L','R']){const sx=s==='L'?1:-1;B['arm'+s].rotation.set(.15+Math.sin(this.phase+(s==='L'?0:PI))*.3*Math.min(1,this.hy<.9?0:1),0,sx*.08);B['fore'+s].rotation.set(-.35,0,0);B['hand'+s].rotation.set(0,0,0);}void t;}
 // death: knees buckle, then the body topples about the feet with gravity and a small bounce
 topple(dt){const B=this.b,m=this.mesh;if(!this.die){this.die=1e-4;this.ang=0;this.angV=this.dieDir*1.8;}this.die=Math.min(3,this.die+dt);
  const crumple=Math.min(1,this.die*3.5);B.hips.position.y=.95-crumple*.32;
  for(const s of['L','R']){B['thigh'+s].rotation.x=-.9*crumple*(s==='L'?1:.6);B['shin'+s].rotation.x=1.5*crumple;}
  if(this.die>.06){const tq_=Math.sin(Math.abs(this.ang))*18+5;this.angV+=Math.sign(this.dieDir)*tq_*dt;this.ang+=this.angV*dt;if(Math.abs(this.ang)>1.42){this.ang=Math.sign(this.ang)*1.42;this.angV*=-.22;if(Math.abs(this.angV)<.3)this.angV=0;}}
  const e=Math.abs(this.ang)/1.42;m.rotation.x=-this.ang;m.position.y=e*.16;B.spine.rotation.x=.25*e*Math.sign(this.dieDir);B.neck.rotation.x=.4*e;
  for(const s of['L','R']){const sx=s==='L'?1:-1;B['arm'+s].quaternion.setFromEuler(tE.set(-.9*e*Math.sign(this.dieDir)+(s==='L'?.2:-.3),0,sx*(.15+e*.45)));B['fore'+s].quaternion.setFromEuler(tE.set(-.5-e*.3,0,0));}
  B.gun.scale.setScalar(1);B.gun.position.set(-.25-e*.2,-.1,.1);B.gun.rotation.set(1.2*e,.6,.8*e);this.flash.visible=false;}
 throwAnim(){this.throwT=.6;}
}

// ray vs soldier hit volumes. a: actor with pos, crouchV (0..1); returns {t, part} or null
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,top=1.48-cr*.42,hy=1.68-cr*.4;
 let best=null;{const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.15*.15,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-.29*.29,D=B*B-A*C;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<.85-cr*.3?'legs':'body'};}}
 return best;}
