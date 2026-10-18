// FRONTLINE OPS — soldiers: one skinned mesh per operator (rounded gear, plate carrier, helmet kit, rifle) driven by a
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
export function setKitDetail(d){if(KIT)KIT.det=d;}
export function makeKit(TX){KIT={TX,mats:{},det:1};
 const mk=(map)=>new THREE.MeshStandardMaterial({map,vertexColors:true,roughness:.84,metalness:.02,normalMap:TX.fabricN||null,normalScale:new THREE.Vector2(.6,.6)});KIT.mats.A=mk(TX.kitA);KIT.mats.B=mk(TX.kitB);KIT.mats.V=mk(TX.kitA);
 KIT.flash=new THREE.MeshBasicMaterial({map:TX.flash,transparent:true,blending:THREE.AdditiveBlending,depthWrite:false,color:new THREE.Color(3,2.4,1.6),side:THREE.DoubleSide});return KIT;}

// ---------- geometry assembly ----------
// det: 0 = LOW (lean segment counts), 1 = MEDIUM/HIGH (full kit detail)
const lathe=(pts,seg)=>new THREE.LatheGeometry(pts.map(([r,y])=>new THREE.Vector2(r,y)),seg);
function buildBody(type,rnd,det=1){const parts=[];const ally=type==='ally',vip=type==='vip',hi=det>0;
 // add(bone, geo, matrix(bone-local), colour, camo?)
 const add=(bone,geo,m,col,camo=false)=>parts.push({b:BI[bone],geo,m:m||new THREE.Matrix4(),col:new THREE.Color(col),camo});
 const RB=(w,h,d,r)=>rbox(w,h,d,r,hi?(Math.min(w,h,d)<.05?1:Math.min(w,h,d)<.1?2:3):1),CP=(r,l)=>cap(r,l,hi?10:7),C=(a,b,h,s)=>CY(a,b,h,hi?s:Math.max(5,s*.6|0)),S=(r,a,b,...x)=>SP(r,hi?a:Math.max(6,a*.6|0),hi?b:Math.max(4,b*.6|0),...x);
 const skin=SKIN[rnd()*SKIN.length|0];
 const gear=ally?[0x6a6448,0x5a6244,0x7a6c50][rnd()*3|0]:[0x3c4232,0x2b2d30,0x4a4434][rnd()*3|0];
 const gear2=ally?[0x7a6c4e,0x6e6648][rnd()*2|0]:[0x46483c,0x2e3030][rnd()*2|0],web=ally?0x4a4634:0x222426,glove=ally?0x4e4232:0x1e1f21,boot=ally?0x7a6448:0x26262a,sole=0x18181a,
  helm=ally?[0x7e7052,0x6a6648][rnd()*2|0]:[0x34373a,0x40423e][rnd()*2|0],camoW=0xffffff,metal=0x1c1d1f;
 if(vip){const shirt=0xe8e6e0,trou=0x2a3040;// civilian: shirt, trousers, shoes, jacket
  add('chest',RB(.38,.44,.22,.07),M4(0,.13,0),shirt);add('chest',RB(.4,.38,.24,.07),M4(0,.15,0,0,0,0,1,1,.98),0x3a4048);add('spine',RB(.33,.2,.2,.06),M4(0,.06,0),shirt);add('hips',RB(.34,.2,.21,.06),M4(0,.0,0),trou);
  for(const s of['L','R']){add('arm'+s,CP(.056,UA-.06),M4(0,-.03,0),0x3a4048);add('fore'+s,CP(.047,LA-.06),M4(0,-.03,0),0x3a4048);add('hand'+s,RB(.07,.1,.04,.018),M4(0,-.05,0),skin);
   add('thigh'+s,CP(.075,TH-.08),M4(0,-.04,0),trou);add('shin'+s,CP(.06,SH-.06),M4(0,-.03,0),trou);add('foot'+s,RB(.1,.07,.24,.03),M4(0,-.035,.05),0x3a2a20);}
  add('neck',C(.05,.055,.1,10),M4(0,.02,0),skin);add('head',S(.105,14,12),M4(0,.11,.01,0,0,0,1,1.08,1.02),skin);add('head',S(.11,14,8,0,PI*2,0,PI*.5),M4(0,.13,-.005),0x2a2018);
  add('head',RB(.15,.03,.02,.008),M4(0,.12,.1),0x111111);// sunglasses
  return parts;}
 /* torso: tapered combat shirt, plate carrier with cummerbund, MOLLE rows, mag pouches with mags, admin flap, radio */
 add('chest',RB(.36,.4,.22,.08),M4(0,.12,0,0,0,0,1,1,1),camoW,true);add('spine',RB(.31,.22,.2,.07),M4(0,.06,0),camoW,true);
 add('chest',RB(.32,.34,.07,.03),M4(0,.12,.115),gear);add('chest',RB(.32,.36,.065,.03),M4(0,.13,-.115),gear);// plates
 add('chest',RB(.39,.13,.25,.04),M4(0,.0,0),gear);// cummerbund
 for(const s of[-1,1]){add('chest',RB(.07,.04,.25,.015),M4(s*.115,.3,0),gear);if(hi)add('chest',RB(.075,.06,.07,.02),M4(s*.115,.31,.09),gear2);}// shoulder straps + pads
 if(hi)for(let r=0;r<3;r++)add('chest',RB(.3,.008,.012,.003),M4(0,.04+r*.055,.152),web);// MOLLE webbing
 const magC=ally?0x3a3628:0x1a1b1c;for(let i=-1;i<=1;i++){add('chest',RB(.085,.12,.06,.015),M4(i*.095,.02,.17),gear2);add('chest',RB(.06,.05,.03,.008),M4(i*.095,.1,.17,-.1),magC);}
 add('chest',RB(.18,.08,.035,.012),M4(0,.19,.163),gear2);// admin pouch
 if(hi){add('chest',RB(.06,.13,.06,.015),M4(.17,.05,.1),gear2);add('chest',RB(.05,.1,.05,.012),M4(-.17,.05,.1),gear2);}// side pouches
 add('chest',RB(.07,.17,.06,.015),M4(.19,.14,-.06),0x2a2c2c);add('chest',C(.005,.004,.34,4),M4(.19,.38,-.08,-.12),0x111111);// radio + whip antenna
 if(hi){add('chest',RB(.06,.06,.03,.01),M4(-.12,.25,.15),0x1a1a1a);add('chest',C(.012,.012,.05,6),M4(.1,.25,.155,PI/2,0,0),0x1a1a1a);}// PTT + light
 const pack=rnd()<.65;if(pack){add('chest',RB(.3,.38,.16,.06),M4(0,.12,-.23),ally?0x6a6448:0x2a2c2e);if(hi){add('chest',RB(.26,.1,.08,.03),M4(0,-.06,-.3),ally?0x5e5a40:0x26282a);add('chest',RB(.22,.04,.05,.01),M4(0,.3,-.25),web);}}
 else if(hi)add('chest',RB(.2,.3,.06,.04),M4(0,.12,-.17),gear2);// hydration carrier
 /* hips: belt with pouches, IFAK, holster */
 add('hips',RB(.34,.22,.22,.08),M4(0,-.02,0),camoW,true);add('hips',RB(.37,.06,.25,.02),M4(0,.07,0),web);
 for(const s of[-1,1])add('hips',RB(.065,.1,.06,.015),M4(s*.15,.02,.1),gear2);add('hips',RB(.1,.08,.06,.02),M4(0,.03,-.13),gear2);
 /* arms */
 if(!ally)for(const s of['L','R'])add('arm'+s,C(.064,.064,.05,12),M4(0,-.11,0),0xb82a1c);// enemy armband
 else for(const s of['L','R'])add('arm'+s,RB(.03,.05,.05,.01),M4(s==='L'?.055:-.055,-.06,0),0x2a3a5a);// patch
 for(const s of['L','R']){const sx=s==='L'?1:-1;add('arm'+s,CP(.066,UA-.07),M4(0,-.035,0),camoW,true);add('arm'+s,RB(.13,.08,.13,.035),M4(0,-.0,0),camoW,true);
  add('fore'+s,CP(.057,LA-.07),M4(0,-.035,0),camoW,true);if(hi&&rnd()<.5)add('fore'+s,C(.056,.054,.05,10),M4(0,-.03,0),gear2);// elbow pad
  add('fore'+s,C(.052,.046,.07,10),M4(0,-.21,0),glove);// glove cuff
  add('hand'+s,RB(.08,.1,.05,.02),M4(0,-.05,.0),glove);add('hand'+s,RB(.026,.065,.026,.01),M4(sx*.036,-.03,.025,.3),glove);if(hi)add('hand'+s,RB(.07,.025,.04,.008),M4(0,-.002,.012),0x2a2a2a);// knuckle guard
  /* legs: combat pants, knee pads, drop pouch, boots with soles and laces */
  add('thigh'+s,CP(.097,TH-.1),M4(0,-.05,0),camoW,true);if(hi)add('thigh'+s,RB(.06,.11,.13,.02),M4(sx*.088,-.2,0),camoW,true);// cargo pocket
  add('shin'+s,CP(.074,SH-.08),M4(0,-.04,0),camoW,true);add('shin'+s,RB(.11,.13,.07,.035),M4(0,-.02,.065),gear);if(hi)add('shin'+s,RB(.115,.03,.05,.01),M4(0,-.06,.07),web);
  add('foot'+s,RB(.115,.13,.28,.04),M4(0,-.04,.05),boot);add('foot'+s,RB(.12,.03,.29,.012),M4(0,-.1,.05),sole);add('shin'+s,C(.064,.07,.12,10),M4(0,-.39,0),boot);
  if(hi)for(let l=0;l<3;l++)add('foot'+s,RB(.07,.006,.012,.002),M4(0,.0-l*.025,.15-l*.02,.5),0x111111);}
 if(rnd()<.55)add('thighR',RB(.06,.16,.1,.02),M4(-.1,-.1,0),gear2),hi&&add('thighR',RB(.03,.06,.04,.01),M4(-.11,.0,.0),metal);// drop-leg holster + pistol grip
 /* head: neck, shaped skull, nose, jaw; ballistic glasses or balaclava; high-cut helmet with NVG shroud, rails, counterweight, headset */
 add('neck',C(.05,.056,.11,10),M4(0,.02,0),skin);add('head',S(.1,14,12),M4(0,.1,.012,0,0,0,1,1.12,1.06),skin);add('head',RB(.03,.045,.035,.012),M4(0,.085,.112),skin);add('head',RB(.12,.07,.1,.04),M4(0,.035,.03),skin);
 const balac=!ally&&rnd()<.6,shem=!ally&&!balac&&rnd()<.5;
 if(balac){add('head',S(.106,14,12,0,PI*2,PI*.4,PI*.6),M4(0,.1,.012,0,0,0,1,1.12,1.06),0x1c1d1e);add('head',RB(.13,.08,.11,.04),M4(0,.035,.03),0x1c1d1e);}
 if(shem)add('neck',C(.085,.075,.1,12),M4(0,.0,0),0x8a7a62);
 if(hi||ally)add('head',RB(.17,.032,.03,.01),M4(0,.118,.11,-.05),0x121314);// ballistic glasses / goggles band
 const capT=ally?(rnd()<.85?'helm':'cap'):(rnd()<.65?'helm':'beanie');
 if(capT==='helm'){const hp=[[.0,.178],[.06,.172],[.1,.155],[.13,.12],[.144,.075],[.146,.035],[.143,-.01],[.138,-.03]];add('head',lathe(hp,hi?18:10),M4(0,.088,-.008,0,0,0,1.02,1,1.1),helm,true);
  add('head',RB(.06,.045,.03,.01),M4(0,.235,.15,-.5),0x18191a);// NVG shroud
  if(hi){for(const s of[-1,1])add('head',RB(.016,.03,.13,.005),M4(s*.146,.135,0),0x2a2b2c);add('head',RB(.08,.05,.04,.012),M4(0,.17,-.16,.4),0x2a2b2c);add('head',RB(.06,.03,.05,.01),M4(0,.262,-.04),0x5a5a50);}// rails, counterweight, velcro
  if(rnd()<.75)for(const s of[-1,1])add('head',C(.048,.048,.045,12),M4(s*.12,.09,.0,0,0,PI/2),0x2a2c2a);// headset cups
  if(!ally||rnd()<.35)add('head',RB(.19,.05,.05,.02),M4(0,.215,.13,.35),0x111214);}// goggles up on helmet
 else if(capT==='cap'){add('head',S(.115,14,8,0,PI*2,0,PI*.5),M4(0,.12,0),helm,true);add('head',RB(.13,.012,.09,.005),M4(0,.13,.11,.15),helm);if(hi)for(const s of[-1,1])add('head',C(.045,.045,.04,12),M4(s*.115,.09,.0,0,0,PI/2),0x2a2c2a);}
 else{add('head',S(.118,14,8,0,PI*2,0,PI*.55),M4(0,.115,0),0x26282a);}
 if(!balac)add('head',S(.104,10,6,PI,PI,PI*.28,PI*.42),M4(0,.1,.012,0,0,0,1,1.12,1.06),[0x2a1e14,0x1a1410,0x3a2c1e,0x121212][rnd()*4|0]);// short hair, back of head
 if(!balac&&ally&&rnd()<.45)add('head',S(.1,12,8,0,PI*2,PI*.6,PI*.32),M4(0,.1,.02,0,0,0,1,1.12,1.06),[0x3a2a1c,0x241a12,0x5a4a3a][rnd()*3|0]);// beard
 /* rifle on the gun bone (+z forward): lower/upper receiver, rail, handguard, curved mag, stock, optic, muzzle */
 const gc=ally?0x2a2b2d:0x202122,fur=ally?(rnd()<.5?0x8a7a5a:0x2a2b2d):0x2a2420;
 add('gun',RB(.045,.06,.24,.008),M4(0,.0,.04),gc);add('gun',RB(.05,.035,.26,.008),M4(0,.045,.06),gc);add('gun',RB(.055,.065,.27,.012),M4(0,.02,.3),fur);
 add('gun',C(.011,.011,.24,8),M4(0,.035,.55,PI/2),0x121314);add('gun',C(.016,.016,.06,8),M4(0,.035,.68,PI/2),0x18191a);
 add('gun',RB(.034,.13,.065,.01),M4(0,-.09,.11,.28),0x1c1d1e);add('gun',RB(.034,.1,.04,.01),M4(0,-.075,-.04,-.3),fur);
 add('gun',RB(.04,.07,.2,.016),M4(0,.005,-.2),fur);add('gun',RB(.044,.09,.04,.012),M4(0,-.0,-.3),0x161718);
 add('gun',RB(.035,.045,.08,.01),M4(0,.09,.05),0x161718);if(hi)add('gun',C(.018,.018,.05,10),M4(0,.1,.06,PI/2),0x161718);
 if(hi)add('gun',RB(.025,.08,.03,.008),M4(0,-.055,.32,.15),0x1c1d1e);// foregrip
 return parts;}
function assemble(parts){const P=[],N=[],U=[],C=[],SI=[],SW=[];const nm=new THREE.Matrix3(),v=new V(),bind=new THREE.Matrix4();
 for(const pt of parts){const g=pt.geo.index?pt.geo.toNonIndexed():pt.geo,p=g.attributes.position,n=g.attributes.normal,u=g.attributes.uv;bind.makeTranslation(BW[pt.b].x,BW[pt.b].y,BW[pt.b].z).multiply(pt.m);nm.getNormalMatrix(bind);
  for(let i=0;i<p.count;i++){v.fromBufferAttribute(p,i).applyMatrix4(bind);P.push(v.x,v.y,v.z);v.fromBufferAttribute(n,i).applyMatrix3(nm).normalize();N.push(v.x,v.y,v.z);
   if(pt.camo&&u)U.push(.02+u.getX(i)*.46,.01+u.getY(i)*.98);else U.push(.75,.5);C.push(pt.col.r,pt.col.g,pt.col.b);SI.push(pt.b,0,0,0);SW.push(1,0,0,0);}}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
 g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.setAttribute('skinIndex',new THREE.Uint16BufferAttribute(SI,4));g.setAttribute('skinWeight',new THREE.Float32BufferAttribute(SW,4));return g;}

// ---------- 2-bone IK (shoulder-space): rest limbs point down -Y ----------
const _a=new V(),_e=new V(),_d=new V(),_p=new V(),_q=new THREE.Quaternion(),_q2=new THREE.Quaternion(),DOWN=new V(0,-1,0);
function ik(up,lo,S,T,pole,l1=UA,l2=LA){_d.subVectors(T,S);let d=_d.length();d=cl(d,.08,l1+l2-.004);_d.normalize();const x=(l1*l1-l2*l2+d*d)/(2*d),h=Math.sqrt(Math.max(0,l1*l1-x*x));
 _p.copy(pole).addScaledVector(_d,-pole.dot(_d)).normalize();_e.copy(S).addScaledVector(_d,x).addScaledVector(_p,h);
 _a.subVectors(_e,S).normalize();up.quaternion.setFromUnitVectors(DOWN,_a);_a.subVectors(T,_e).normalize();_q.setFromUnitVectors(DOWN,_a);_q2.copy(up.quaternion).invert();lo.quaternion.copy(_q2.multiply(_q));}

const tq=new THREE.Quaternion(),tq2=new THREE.Quaternion(),tE=new THREE.Euler(),tv=new V(),tv2=new V(),tPole=new V(),HANDQ=new THREE.Quaternion().setFromEuler(new THREE.Euler(PI/2,0,0));
export class Rig{
 constructor(type,seed=Math.random()){const{mats}=KIT;const det=KIT.det??1;let s=seed*2147483646+1|0;const rnd=()=>(s=(s*16807)%2147483647)/2147483647;
  this.type=type;this.root=new THREE.Group();const bones=BONES.map(b=>{const o=new THREE.Bone();o.name=b[0];o.position.set(b[2],b[3],b[4]);return o;});BONES.forEach((b,i)=>{if(b[1]>=0)bones[b[1]].add(bones[i]);});
  const geo=assemble(buildBody(type,rnd,det));const mesh=new THREE.SkinnedMesh(geo,type==='ally'?mats.A:type==='vip'?mats.V:mats.B);mesh.add(bones[0]);mesh.castShadow=true;mesh.receiveShadow=true;
  this.root.add(mesh);mesh.updateMatrixWorld(true);mesh.bind(new THREE.Skeleton(bones));mesh.boundingSphere=new THREE.Sphere(new V(0,.9,0),2.3);this.mesh=mesh;
  this.b={};for(const o of bones)this.b[o.name]=o;
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.45,.45),KIT.flash);this.flash.position.set(0,.01,.82);this.flash.visible=false;const f2=new THREE.Mesh(new THREE.PlaneGeometry(.55,.3),KIT.flash);f2.rotation.y=PI/2;f2.position.z=.12;this.flash.add(f2);if(type!=='vip')this.b.gun.add(this.flash);else this.b.gun.visible=false;
  this.phase=rnd()*6;this.die=0;this.dieDir=1;this.flinch=0;this.kick=0;this.aimK=0;this.sprK=0;this.relK=0;this.ang=0;this.angV=0;this.throwT=0;this.hy=.95;this.idleT=rnd()*10;}
 // st: {speed, vf, vs (local fwd/side speed), crouch, pitch, aim (0/1), sprint, reload (0..1 progress or -1), dead}
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
   B['thigh'+s].rotation.x+=(th-B['thigh'+s].rotation.x)*k;B['thigh'+s].rotation.z+=(tz+(s==='L'?.02:-.02)-B['thigh'+s].rotation.z)*k;B['shin'+s].rotation.x+=(kn-B['shin'+s].rotation.x)*k;B['foot'+s].rotation.x+=(ft-B['foot'+s].rotation.x)*k;}
  // weapon pose: low-ready ↔ shouldered ↔ sprint carry ↔ reload tilt
  const g=B.gun;if(this.type==='vip'){this.vipArms(dt);return;}
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
  B.gun.position.set(-.25-e*.2,-.1,.1);B.gun.rotation.set(1.2*e,.6,.8*e);this.flash.visible=false;}
 throwAnim(){this.throwT=.6;}
}

// ray vs soldier hit volumes. a: actor with pos, crouchV (0..1); returns {t, part} or null
export function hitActor(a,ox,oy,oz,dx,dy,dz,maxT){const p=a.pos,cr=a.crouchV||0,top=1.48-cr*.42,hy=1.68-cr*.4;
 let best=null;{const cx=p.x-ox,cy=p.y+hy-oy,cz=p.z-oz,b=cx*dx+cy*dy+cz*dz,c=cx*cx+cy*cy+cz*cz-.15*.15,disc=b*b-c;if(disc>0){const t=b-Math.sqrt(disc);if(t>0&&t<maxT)best={t,part:'head'};}}
 const fx=ox-p.x,fz=oz-p.z,A=dx*dx+dz*dz,B=fx*dx+fz*dz,C=fx*fx+fz*fz-.29*.29,D=B*B-A*C;if(D>0&&A>1e-9){const t=(-B-Math.sqrt(D))/A;if(t>0&&t<maxT&&(!best||t<best.t)){const y=oy+dy*t-p.y;if(y>0&&y<top)best={t,part:y<.85-cr*.3?'legs':'body'};}}
 return best;}
