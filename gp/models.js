// KART GRAND PRIX — procedural models: karts (4 bodies, 4 wheel sets, 3 gliders), 8 rigged drivers, items, rescue drone.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,merge,M,lumpy} from './util.js';

const matCache=new Map();
function paintMat(c){const k='p'+c;if(!matCache.has(k))matCache.set(k,new THREE.MeshPhysicalMaterial({color:c,roughness:.32,metalness:.35,clearcoat:1,clearcoatRoughness:.12}));return matCache.get(k);}
const trimMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.55,metalness:.6});
const furMatCache=new Map();
function furMat(rough=.75,metal=0){const k=rough+'_'+metal;if(!furMatCache.has(k))furMatCache.set(k,new THREE.MeshStandardMaterial({vertexColors:true,roughness:rough,metalness:metal}));return furMatCache.get(k);}
const glowMat=new THREE.MeshBasicMaterial({vertexColors:true,color:new THREE.Color(2.4,2.4,2.4)});
const tireMat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.85,metalness:.15});

/* ---------- kart bodies ---------- */
const DARK=0x1a1c22,METAL=0xb8bcc6,SEAT=0x2a2a30;
function bodyGeo(id){const P=[],T=[];const p=(g,m)=>P.push([g,m,0xffffff]),t=(g,m,c=DARK)=>T.push([g,m,c]);
 switch(id){
  case'racer':
   t(new THREE.BoxGeometry(1.5,.14,2.6),M(0,.36,0));
   p(new THREE.CapsuleGeometry(.32,1.5,4,10),M(.62,.55,-.05,Math.PI/2,0,0,1,.85,1));p(new THREE.CapsuleGeometry(.32,1.5,4,10),M(-.62,.55,-.05,Math.PI/2,0,0,1,.85,1));
   p(new THREE.BoxGeometry(.9,.36,1.1),M(0,.56,.95));p(new THREE.CylinderGeometry(.18,.45,.7,4,1).rotateY(Math.PI/4),M(0,.6,1.55,Math.PI/2,0,0,1,1,.5));
   t(new THREE.CylinderGeometry(.11,.11,1.9,8),M(0,.4,1.82,0,0,Math.PI/2),METAL);t(new THREE.CylinderGeometry(.1,.1,1.7,8),M(0,.42,-1.36,0,0,Math.PI/2),METAL);
   t(new THREE.BoxGeometry(.8,.42,.55),M(0,.72,-1.02),0x3a3c44);t(new THREE.CylinderGeometry(.09,.11,.5,8),M(.24,.82,-1.38,Math.PI/2.4,0,0),METAL);t(new THREE.CylinderGeometry(.09,.11,.5,8),M(-.24,.82,-1.38,Math.PI/2.4,0,0),METAL);
   t(new THREE.BoxGeometry(.72,.14,.7),M(0,.52,-.42),SEAT);t(new THREE.BoxGeometry(.72,.75,.16),M(0,.82,-.78,-.25,0,0),SEAT);break;
  case'dart':
   t(new THREE.BoxGeometry(1.4,.12,2.9),M(0,.34,.1));
   p(new THREE.ConeGeometry(.55,2.1,4,1).rotateY(Math.PI/4),M(0,.52,1.25,Math.PI/2,0,0,1.3,1,.45));p(new THREE.CapsuleGeometry(.26,1.2,4,10),M(.6,.5,-.2,Math.PI/2,0,0,1,.8,1));p(new THREE.CapsuleGeometry(.26,1.2,4,10),M(-.6,.5,-.2,Math.PI/2,0,0,1,.8,1));
   t(new THREE.BoxGeometry(.06,.6,.4),M(.45,.85,-1.25),METAL);t(new THREE.BoxGeometry(.06,.6,.4),M(-.45,.85,-1.25),METAL);p(new THREE.BoxGeometry(1.7,.08,.55),M(0,1.18,-1.32,.12,0,0));
   t(new THREE.BoxGeometry(.7,.4,.5),M(0,.66,-1.0),0x3a3c44);t(new THREE.CylinderGeometry(.12,.12,.4,10),M(0,.7,-1.35,Math.PI/2,0,0),METAL);
   t(new THREE.BoxGeometry(.7,.12,.7),M(0,.48,-.4),SEAT);t(new THREE.BoxGeometry(.7,.7,.14),M(0,.78,-.76,-.3,0,0),SEAT);break;
  case'rover':
   t(new THREE.BoxGeometry(1.6,.22,2.5),M(0,.5,0));p(new THREE.BoxGeometry(1.5,.5,1.0),M(0,.82,.88));p(new THREE.BoxGeometry(.32,.45,2.2),M(.72,.75,-.1));p(new THREE.BoxGeometry(.32,.45,2.2),M(-.72,.75,-.1));
   t(new THREE.BoxGeometry(1.3,.35,.12),M(0,.78,1.4),0x2a2c32);for(let i=0;i<4;i++)t(new THREE.BoxGeometry(.08,.3,.06),M(-.45+i*.3,.78,1.47),METAL);
   for(const s of[-1,1]){t(new THREE.CylinderGeometry(.06,.06,1.5,6),M(s*.62,1.45,-.75,0,0,s*.12),METAL);}t(new THREE.CylinderGeometry(.06,.06,1.3,6),M(0,2.15,-.75,0,0,Math.PI/2),METAL);
   t(new THREE.BoxGeometry(1.0,.14,.24),M(0,2.22,-.62),0x222222);t(new THREE.BoxGeometry(.8,.12,.7),M(0,.66,-.4),SEAT);t(new THREE.BoxGeometry(.8,.8,.16),M(0,1.0,-.78,-.2,0,0),SEAT);
   t(new THREE.CylinderGeometry(.42,.42,.3,14),M(0,.95,-1.32,Math.PI/2,0,0),0x2a2a2a);break;
  case'brick':
   t(new THREE.BoxGeometry(1.8,.2,2.7),M(0,.42,0));p(new THREE.BoxGeometry(1.8,.62,1.3),M(0,.8,.7));p(new THREE.BoxGeometry(1.8,.5,.9),M(0,.74,-1.0));
   t(new THREE.BoxGeometry(2.0,.5,.18),M(0,.5,1.45,-.3,0,0),METAL);t(new THREE.BoxGeometry(.3,.3,.4),M(.6,1.25,-1.1),METAL);t(new THREE.BoxGeometry(.3,.3,.4),M(-.6,1.25,-1.1),METAL);
   t(new THREE.CylinderGeometry(.13,.13,.6,8),M(.6,1.5,-1.1),METAL);t(new THREE.CylinderGeometry(.13,.13,.6,8),M(-.6,1.5,-1.1),METAL);
   t(new THREE.BoxGeometry(.8,.14,.6),M(0,.62,-.35),SEAT);t(new THREE.BoxGeometry(.8,.7,.16),M(0,.95,-.62,-.2,0,0),SEAT);break;}
 return{paint:merge(P),trim:merge(T)};}
const BODY_META={racer:{seat:[0,.58,-.42],wheel:[0,.98,.36],ax:[.78,1.0,-.95],h:.36},dart:{seat:[0,.54,-.4],wheel:[0,.92,.3],ax:[.75,1.05,-.95],h:.34},rover:{seat:[0,.72,-.4],wheel:[0,1.1,.36],ax:[.82,1.0,-.95],h:.5},brick:{seat:[0,.68,-.35],wheel:[0,1.08,.38],ax:[.86,1.0,-1.0],h:.42}};
const WHEEL_META={std:{r:.38,w:.32},slick:{r:.34,w:.46},monster:{r:.56,w:.42},cyber:{r:.4,w:.3}};
function wheelGeo(id){const m=WHEEL_META[id],L=[],G=[];
 L.push([new THREE.CylinderGeometry(m.r,m.r,m.w,22),M(0,0,0,0,0,Math.PI/2),0x18181c]);
 if(id==='monster'){for(let i=0;i<12;i++){const a=i/12*Math.PI*2;L.push([new THREE.BoxGeometry(m.w*1.02,.1,.14),M(0,Math.cos(a)*m.r,Math.sin(a)*m.r,a),0x101014]);}}
 L.push([new THREE.CylinderGeometry(m.r*.55,m.r*.55,m.w+.02,id==='cyber'?6:16),M(0,0,0,0,0,Math.PI/2),id==='slick'?0xffd040:METAL]);
 for(let i=0;i<5;i++){const a=i/5*Math.PI*2;L.push([new THREE.BoxGeometry(m.w+.04,.06,m.r*.9),M(0,0,0,a),0x3a3c44]);}
 if(id==='cyber')G.push([new THREE.TorusGeometry(m.r*.72,.035,6,24),M(0,0,0,0,Math.PI/2),0x2ae0ff]);
 return{tire:merge(L),glow:G.length?merge(G):null,m};}

/* ---------- gliders ---------- */
function gliderGroup(id,col){const g=new THREE.Group(),cloth=new THREE.MeshStandardMaterial({color:col,roughness:.6,side:THREE.DoubleSide}),frame=new THREE.MeshStandardMaterial({color:0x2a2c34,metalness:.7,roughness:.35}),white=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.6,side:THREE.DoubleSide});
 if(id==='wing'){const s=new THREE.Shape();s.moveTo(0,1.2);s.lineTo(2.6,-.8);s.lineTo(0,-.4);s.lineTo(-2.6,-.8);s.closePath();const m=new THREE.Mesh(new THREE.ShapeGeometry(s),cloth);m.rotation.x=-Math.PI/2+.12;g.add(m);
  const st=new THREE.Shape();st.moveTo(0,.6);st.lineTo(1.2,-.4);st.lineTo(0,-.2);st.closePath();const m2=new THREE.Mesh(new THREE.ShapeGeometry(st),white);m2.rotation.x=-Math.PI/2+.12;m2.position.y=.02;g.add(m2);
  const f=new THREE.Mesh(new THREE.CylinderGeometry(.04,.04,5.4,6),frame);f.rotation.z=Math.PI/2;f.position.set(0,0,-.5);g.add(f);}
 else if(id==='para'){const c=new THREE.Mesh(new THREE.CylinderGeometry(2.6,2.6,1.8,20,1,true,-Math.PI*.4,Math.PI*.8),cloth);c.rotation.set(Math.PI/2,0,Math.PI/2);c.scale.set(1,1,.45);c.position.y=.3;g.add(c);
  for(let i=0;i<5;i++){const st=new THREE.Mesh(new THREE.BoxGeometry(.04,.12,1.8),white);const a=-Math.PI*.4+i*Math.PI*.2;st.position.set(Math.sin(a)*2.6,Math.cos(a)*1.17+.3,0);st.rotation.z=-a;g.add(st);}}
 else{for(const s of[-1,1]){const box=new THREE.Mesh(new THREE.BoxGeometry(1.2,.7,1.2),cloth);box.position.set(s*1.3,0,0);g.add(box);const fr=new THREE.Mesh(new THREE.BoxGeometry(1.26,.74,.04),white);fr.position.set(s*1.3,0,.62);g.add(fr);}const f=new THREE.Mesh(new THREE.CylinderGeometry(.05,.05,3.8,6),frame);f.rotation.z=Math.PI/2;g.add(f);}
 for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,1.7,4),frame);r.position.set(s*.6,-.8,-.2);r.rotation.z=s*.35;g.add(r);}
 g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

/* ---------- drivers ---------- */
// returns {torso, head, eyes, armL, armR, earL, earR, tail, extra} meshes, all positioned in driver space (origin = seat)
function driverParts(ch){const c=ch.col,c2=ch.col2,sp=ch.sp;const T=[],H=[],E=[],EAR=[],TL=[],ARM=[],GL=[];
 const S=(r,ws=16,hs=12)=>new THREE.SphereGeometry(r,ws,hs);
 const heavy=ch.cls==='heavy',light=ch.cls==='light';const tr=heavy?.46:light?.3:.36,hr=heavy?.42:light?.44:.4;
 const headY=tr*1.6+hr*.8,headZ=.02;
 // torso
 if(sp==='bot'||sp==='mech'){T.push([new THREE.BoxGeometry(tr*2,tr*2.1,tr*1.6),M(0,tr*1.05,0),c]);T.push([new THREE.BoxGeometry(tr*1.4,tr*1.1,.1),M(0,tr*1.1,tr*.82),c2]);
  if(sp==='mech'){T.push([new THREE.BoxGeometry(tr*.9,tr*.6,tr*1.3),M(tr*1.2,tr*1.9,0),c2]);T.push([new THREE.BoxGeometry(tr*.9,tr*.6,tr*1.3),M(-tr*1.2,tr*1.9,0),c2]);GL.push([new THREE.CircleGeometry(tr*.28,12),M(0,tr*1.2,tr*.88),0xff9a2a]);}}
 else if(sp==='chick'){T.push([S(tr*1.25),M(0,tr*1.1,0,0,0,0,1,1.05,1),c]);}
 else{T.push([S(tr),M(0,tr*1.1,0,0,0,0,1,1.25,.9),c]);T.push([S(tr*.72),M(0,tr*.95,tr*.38,0,0,0,1,1.2,.6),c2]);
  if(sp!=='frog'){T.push([new THREE.TorusGeometry(tr*.62,tr*.2,8,16),M(0,tr*2.0,0,Math.PI/2),ch.kart]);}}
 // head
 const face=hr*.92;
 if(sp==='bot'){H.push([new THREE.BoxGeometry(hr*2.1,hr*1.7,hr*1.8),M(0,headY,headZ),c]);H.push([new THREE.BoxGeometry(hr*1.7,hr*1.2,.08),M(0,headY,headZ+hr*.9),0x0a0e18]);
  E.push([new THREE.BoxGeometry(hr*.36,hr*.5,.05),M(-hr*.38,headY+hr*.05,headZ+hr*.95),0x40fff0]);E.push([new THREE.BoxGeometry(hr*.36,hr*.5,.05),M(hr*.38,headY+hr*.05,headZ+hr*.95),0x40fff0]);
  EAR.push([new THREE.CylinderGeometry(.03,.03,hr*.9,5),M(0,hr*.45,0),METAL]);EAR.push([S(.09,8,6),M(0,hr*.95,0),0xff4d00]);}
 else if(sp==='mech'){H.push([new THREE.BoxGeometry(hr*1.9,hr*1.5,hr*1.7),M(0,headY,headZ),c]);H.push([new THREE.BoxGeometry(hr*1.6,hr*.4,.1),M(0,headY+hr*.1,headZ+hr*.85),0x101014]);
  E.push([new THREE.BoxGeometry(hr*1.4,hr*.18,.05),M(0,headY+hr*.1,headZ+hr*.92),0xff8c1a]);H.push([new THREE.BoxGeometry(hr*.3,hr*.6,hr*.6),M(hr*1.05,headY,headZ),c2]);H.push([new THREE.BoxGeometry(hr*.3,hr*.6,hr*.6),M(-hr*1.05,headY,headZ),c2]);
  EAR.push([new THREE.CylinderGeometry(.04,.02,hr*1.1,5),M(0,hr*.55,0),METAL]);EAR.push([S(.07,8,6),M(0,hr*1.1,0),0xff3a3a]);}
 else{H.push([S(hr,20,16),M(0,headY,headZ,0,0,0,1.05,.95,1),c]);
  const ey=headY+hr*.12,ez=headZ+hr*.82,ex=hr*.36;
  if(sp==='frog'){for(const s of[-1,1]){H.push([S(hr*.32),M(s*hr*.5,headY+hr*.75,headZ+hr*.35),c]);E.push([S(hr*.24),M(s*hr*.5,headY+hr*.8,headZ+hr*.52),0xffffff]);E.push([S(hr*.12),M(s*hr*.5,headY+hr*.82,headZ+hr*.74),0x111111]);}H.push([new THREE.TorusGeometry(hr*.5,.025,4,16,Math.PI),M(0,headY-hr*.15,headZ+hr*.82,0,0,Math.PI),0x2a4a2a]);H.push([S(hr*.7),M(0,headY-hr*.35,headZ+hr*.35,0,0,0,1,.5,.8),c2]);}
  else{for(const s of[-1,1]){E.push([S(hr*.2,12,10),M(s*ex,ey,ez,0,0,0,1,1.25,.6),0xffffff]);E.push([S(hr*.12,10,8),M(s*ex,ey-.01,ez+hr*.1,0,0,0,1,1.3,.6),0x15151a]);E.push([S(hr*.045,6,5),M(s*ex+.03,ey+.05,ez+hr*.16),0xffffff]);}}
  if(sp==='chick'){H.push([new THREE.ConeGeometry(hr*.22,hr*.5,4),M(0,headY-hr*.15,headZ+hr*1.0,Math.PI/2,0,0,1.3,1,.7),0xff8a1e]);for(let i=-1;i<=1;i++)H.push([new THREE.ConeGeometry(.06,.3,5),M(i*.08,headY+hr*1.02,headZ,0,0,i*.4),c2]);
   ARM.push([S(tr*.5,10,8),M(0,-tr*.35,0,0,0,0,.45,1.3,.9),c]);}
  if(sp==='bunny'){H.push([S(hr*.11),M(0,headY-hr*.12,headZ+hr*.98),0xff8ab0]);H.push([new THREE.BoxGeometry(hr*.22,hr*.2,.05),M(0,headY-hr*.38,headZ+hr*.86),0xffffff]);
   EAR.push([new THREE.CapsuleGeometry(hr*.17,hr*1.1,4,10),M(0,hr*.65,0,0,0,0,1,1,.55),c]);EAR.push([new THREE.CapsuleGeometry(hr*.1,hr*.9,4,8),M(0,hr*.65,hr*.06,0,0,0,1,1,.4),c2]);
   TL.push([S(tr*.35,10,8),M(0,0,0),0xffffff]);}
  if(sp==='fox'||sp==='cat'){H.push([new THREE.ConeGeometry(hr*.38,hr*.6,8),M(0,headY-hr*.18,headZ+hr*.95,Math.PI/2,0,0,1.15,1,.75),sp==='fox'?c2:c]);H.push([S(hr*.09),M(0,headY-hr*.08,headZ+hr*1.27),0x15151a]);
   H.push([S(hr*.45),M(0,headY-hr*.45,headZ+hr*.55,0,0,0,1,.6,.8),c2]);
   EAR.push([new THREE.ConeGeometry(hr*.3,hr*(sp==='fox'?.7:.55),4),M(0,hr*.3,0,0,Math.PI/4,0,1,1,.5),c]);EAR.push([new THREE.ConeGeometry(hr*.17,hr*.42,4),M(0,hr*.24,hr*.06,0,Math.PI/4,0,1,1,.3),sp==='fox'?0x2a1a14:0xff9ac0]);
   if(sp==='cat'){for(const s of[-1,1])for(let i=0;i<2;i++)H.push([new THREE.BoxGeometry(hr*.7,.012,.012),M(s*hr*.6,headY-hr*.2-i*.05,headZ+hr*.95,0,0,s*(i?.15:-.1)),0xffffff]);
    TL.push([new THREE.TorusGeometry(tr*1.2,tr*.13,6,14,Math.PI*.9),M(0,tr*1.2,0,0,Math.PI/2,0),c]);}
   else{TL.push([new THREE.CapsuleGeometry(tr*.38,tr*1.6,4,10),M(0,tr*.6,-tr*.6,-1.1,0,0),c]);TL.push([S(tr*.42,10,8),M(0,tr*1.25,-tr*1.25,0,0,0,1,1.1,1),c2]);}}
  if(sp==='bear'){H.push([S(hr*.42),M(0,headY-hr*.28,headZ+hr*.72,0,0,0,1.1,.8,.9),c2]);H.push([S(hr*.13),M(0,headY-hr*.12,headZ+hr*1.08,0,0,0,1.3,.9,1),0x15151a]);
   EAR.push([S(hr*.3,12,10),M(0,hr*.1,0,0,0,0,1,1,.6),c]);EAR.push([S(hr*.17,10,8),M(0,hr*.1,hr*.1,0,0,0,1,1,.4),c2]);TL.push([S(tr*.25,8,6),M(0,0,0),c]);}}
 // arms (shoulder at origin, pointing -y)
 if(!ARM.length){const ar=sp==='mech'?tr*.32:tr*.24,al=heavy?.62:.5;ARM.push([new THREE.CapsuleGeometry(ar,al,4,8),M(0,-al/2,0),sp==='bot'?METAL:c]);ARM.push([S(ar*1.35,10,8),M(0,-al-ar*.6,0),sp==='bot'||sp==='mech'?0x2a2c34:c2]);}
 return{T,H,E,EAR,TL,ARM,GL,tr,hr,headY};}

export function makeDriver(ch){const d=driverParts(ch),g=new THREE.Group(),rough=ch.sp==='bot'||ch.sp==='mech'?.4:.8,metal=ch.sp==='bot'||ch.sp==='mech'?.5:0;const fm=furMat(rough,metal);
 const mk=(L,mat=fm)=>{if(!L.length)return null;const m=new THREE.Mesh(merge(L),mat);m.castShadow=true;return m;};
 const torso=mk(d.T);g.add(torso);if(d.GL.length){const gl=mk(d.GL,glowMat);torso.add(gl);}
 const headPiv=new THREE.Group();headPiv.position.y=d.tr*1.6;g.add(headPiv);const head=mk(d.H);head.position.y=-d.tr*1.6;headPiv.add(head);
 const eyesMat=ch.sp==='bot'||ch.sp==='mech'?glowMat:new THREE.MeshStandardMaterial({vertexColors:true,roughness:.15});const eyes=mk(d.E,eyesMat);eyes.position.y=-d.tr*1.6;
 const eyePiv=new THREE.Group();eyePiv.position.y=d.headY;eyes.position.y=-d.headY;eyePiv.add(eyes);eyePiv.position.y=d.headY-d.tr*1.6;headPiv.add(eyePiv);
 const ears=[];if(d.EAR.length){const geo=merge(d.EAR);const n=ch.sp==='bot'||ch.sp==='mech'?1:2;for(let i=0;i<n;i++){const piv=new THREE.Group();const m=new THREE.Mesh(i?geo:geo,fm);m.castShadow=true;piv.add(m);
   const s=n===1?0:(i?1:-1);piv.position.set(s*d.hr*(ch.sp==='bear'?.7:.45),d.headY-d.tr*1.6+d.hr*(ch.sp==='bear'?.62:.72),0);piv.rotation.z=-s*(ch.sp==='bunny'?.18:.3);piv.userData.base=piv.rotation.z;headPiv.add(piv);ears.push({piv,v:0,a:0});}}
 let tail=null;if(d.TL.length){tail=new THREE.Group();const m=mk(d.TL);tail.add(m);tail.position.set(0,d.tr*.6,-d.tr*.9);g.add(tail);}
 const arms=[];for(const s of[-1,1]){const piv=new THREE.Group();const m=mk(d.ARM);piv.add(m);piv.position.set(s*d.tr*(ch.sp==='chick'?1.15:1.05),d.tr*1.55,d.tr*.1);g.add(piv);arms.push(piv);}
 // scarf in kart colour for the critters
 let scarf=null;if(!['bot','mech','frog'].includes(ch.sp)){scarf=new THREE.Group();scarf.position.set(d.tr*.3,d.tr*2.0,-d.tr*.6);const sm=new THREE.MeshStandardMaterial({color:ch.kart,roughness:.7});for(let i=0;i<4;i++){const seg=new THREE.Mesh(new THREE.BoxGeometry(.16,.05,.22),sm);seg.position.z=-i*.2-.1;seg.castShadow=true;scarf.add(seg);}g.add(scarf);}
 return{g,torso,headPiv,eyePiv,ears,tail,arms,scarf,tr:d.tr,hr:d.hr,headY:d.headY};}

/* ---------- full racer ---------- */
export function makeRacer(ch,parts={body:0,wheels:0,glider:0},paint=null,ids={bodies:['racer','dart','rover','brick'],wheels:['std','slick','monster','cyber'],gliders:['wing','para','kite']}){
 const bid=ids.bodies[parts.body],wid=ids.wheels[parts.wheels],gid=ids.gliders[parts.glider];const BM=BODY_META[bid],WM=WHEEL_META[wid];
 const root=new THREE.Group(),chassis=new THREE.Group();root.add(chassis);const col=paint??ch.kart;
 const bg=bodyGeo(bid);const paintM=new THREE.Mesh(bg.paint,paintMat(col)),trimM=new THREE.Mesh(bg.trim,trimMat);paintM.castShadow=trimM.castShadow=true;chassis.add(paintM,trimM);
 const lift=WM.r-.38;chassis.position.y=lift;
 // steering wheel
 const sw=new THREE.Group();sw.position.set(...BM.wheel);sw.rotation.x=-.9;const swm=new THREE.Mesh(merge([[new THREE.TorusGeometry(.2,.035,6,18),null,0x1a1a1a],[new THREE.BoxGeometry(.36,.04,.04),null,0x333333],[new THREE.CylinderGeometry(.03,.03,.5,6),M(0,0,-.25,Math.PI/2,0,0),0x555555]]),trimMat);sw.add(swm);chassis.add(sw);
 // driver
 const drv=makeDriver(ch);drv.g.position.set(...BM.seat);chassis.add(drv.g);
 // wheels
 const wg=wheelGeo(wid),wheels=[];const ax=BM.ax;
 for(const[x,z,front]of[[ax[0],ax[1],1],[-ax[0],ax[1],1],[ax[0],ax[2],0],[-ax[0],ax[2],0]]){const piv=new THREE.Group();piv.position.set(x+Math.sign(x)*(WM.w-.32)/2,WM.r,z);const spin=new THREE.Group();const t=new THREE.Mesh(wg.tire,tireMat);t.castShadow=true;spin.add(t);if(wg.glow)spin.add(new THREE.Mesh(wg.glow,glowMat));piv.add(spin);root.add(piv);wheels.push({piv,spin,front,base:WM.r});}
 // exhaust flames (boost)
 const flameMat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uC:{value:new THREE.Color(2.6,1.2,.3)},uS:{value:1}},
  vertexShader:'varying vec2 vU;void main(){vU=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.);}',
  fragmentShader:'uniform float uT,uS;uniform vec3 uC;varying vec2 vU;void main(){float f=1.-vU.y;float n=sin(vU.x*20.+uT*40.)*.15+.85;float a=pow(f,1.5)*n*uS;vec3 c=mix(uC,vec3(3.,3.,2.6),pow(f,4.));gl_FragColor=vec4(c*a,1.);}'});
 const flames=[];for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.18,1.3,10,1,true),flameMat);f.rotation.x=-Math.PI/2;f.position.set(s*.24,.82+lift,-1.95);f.visible=false;root.add(f);flames.push(f);}
 // glider
 const gl=gliderGroup(gid,col);gl.position.set(0,2.4+lift,-.3);gl.scale.setScalar(.001);gl.visible=false;root.add(gl);
 // aura shell
 const aura=new THREE.Mesh(new THREE.SphereGeometry(1.9,24,16),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uT:{value:0},uA:{value:0}},
  vertexShader:'varying vec3 vN,vV;varying float vY;void main(){vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);vY=position.y;gl_Position=projectionMatrix*mv;}',
  fragmentShader:'uniform float uT,uA;varying vec3 vN,vV;varying float vY;vec3 hue(float h){return clamp(abs(mod(h*6.+vec3(0,4,2),6.)-3.)-1.,0.,1.);}void main(){float f=pow(1.-abs(dot(vN,vV)),2.);gl_FragColor=vec4(hue(fract(uT*.8+vY*.3))*f*uA*2.2,1.);}'}));
 aura.position.y=.9;aura.scale.set(1,.75,1.25);aura.visible=false;root.add(aura);
 // balloons (battle)
 const bal=new THREE.Group();bal.visible=false;root.add(bal);const balloons=[];
 for(let i=0;i<5;i++){const b=new THREE.Group();const m=new THREE.Mesh(new THREE.SphereGeometry(.42,14,12).scale(1,1.15,1),new THREE.MeshPhysicalMaterial({color:col,roughness:.15,clearcoat:1}));m.position.y=.3;m.castShadow=true;b.add(m);
  const str=new THREE.Mesh(new THREE.CylinderGeometry(.01,.01,1.4,3),new THREE.MeshBasicMaterial({color:0xdddddd}));str.position.y=-.5;b.add(str);b.position.set((i-1)*.45,2.4+lift,-1.3);bal.add(b);balloons.push(b);}
 // shrink / shadow blob
 const blob=new THREE.Mesh(new THREE.CircleGeometry(1.5,20).rotateX(-Math.PI/2),new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4}));blob.scale.set(1,1,1.5);
 root.userData={chassis,sw,drv,wheels,flames,flameMat,glider:gl,aura,bal,balloons,blob,lift,W:WM,B:BM,col,susp:0,suspV:0,blinkT:2+Math.random()*3,squash:0,squashV:0,celebrate:0,headLook:0,gl:0};
 return root;}

// per-frame pose for a racer model
export function poseRacer(m,s,dt,t){const u=m.userData;const d=u.drv;
 // suspension + squash springs
 u.suspV+=(-u.susp*180-u.suspV*12)*dt;u.susp=cl(u.susp+u.suspV*dt,-.15,.12);if(s.land){u.suspV-=s.land*1.6;u.squashV+=s.land*1.4;s.land=0;}
 u.squashV+=(-u.squash*160-u.squashV*10)*dt;u.squash=cl(u.squash+u.squashV*dt,-.3,.35);
 u.chassis.position.y=u.lift+u.susp+(s.idle?Math.sin(t*28)*.012:0);u.chassis.rotation.z=-s.steer*.05*s.spdF;u.chassis.rotation.x=-s.accel*.025;
 d.g.scale.set(1+u.squash*.5,1-u.squash,1+u.squash*.5);
 d.g.rotation.z=-s.steer*.28*Math.min(1,s.spdF+.2)+(s.driftDir?-s.driftDir*.12:0);d.g.rotation.x=s.boost?-.18:0;
 u.sw.rotation.z=s.steer*1.4;
 // arms follow the wheel; celebrate pose overrides
 const cel=u.celebrate;d.arms.forEach((a,i)=>{const sd=i?1:-1;const wave=Math.sin(t*10+i*2)*.3;
  a.rotation.x=cl(-1.15+cel*(-1.6+wave),-3,0);a.rotation.z=sd*(.25+cel*.5)+s.steer*.55*(1-cel);a.rotation.y=0;});
 // head: look toward rivals / back / wobble when hurt
 let look=s.lookBack?Math.PI*.85:s.look||0;if(s.hurt>0)look=Math.sin(t*14)*.6;u.headLook+=(look-u.headLook)*Math.min(1,dt*8);d.headPiv.rotation.y=u.headLook;d.headPiv.rotation.x=s.hurt>0?Math.sin(t*9)*.25:cel*-.25;d.headPiv.rotation.z=s.trick?Math.sin(t*20)*.2:0;
 // blink
 u.blinkT-=dt;let bl=1;if(u.blinkT<0){bl=.12;if(u.blinkT<-.12)u.blinkT=2+Math.random()*4;}if(s.hurt>0)bl=.25;d.eyePiv.scale.y=bl;
 // ears + tail + scarf physics-lite
 for(const e of d.ears){const tgt=-s.spd*.012-s.accel*.04+(s.air?.4:0);e.v+=((tgt-e.a)*60-e.v*6)*dt;e.a+=e.v*dt;e.piv.rotation.x=cl(e.a,-1.2,.8);}
 if(d.tail){d.tail.rotation.y=Math.sin(t*4.5)*.35+s.steer*.4;d.tail.rotation.x=Math.sin(t*3)*.1;}
 if(d.scarf){d.scarf.children.forEach((c,i)=>{c.position.y=Math.sin(t*14-i*1.2)*.04*(1+s.spdF);c.rotation.y=Math.sin(t*9-i)*.3;c.position.x=Math.sin(t*7-i)*.04*i;});d.scarf.rotation.x=.15+s.spdF*.3;}
 // wheels
 for(const w of u.wheels){if(w.front)w.piv.rotation.y=s.steer*.45;w.spin.rotation.x+=s.spd*dt/w.base;}
 // flames
 u.flames.forEach(f=>{f.visible=!!s.boost;if(s.boost){f.scale.set(1,.8+Math.random()*.5*(s.boostLvl||1),1);}});u.flameMat.uniforms.uT.value=t;u.flameMat.uniforms.uC.value.set(...(s.boostCol||[2.6,1.2,.3]));
 // glider
 const gt=s.glide?1:0;u.gl+=(gt-u.gl)*Math.min(1,dt*(gt?5:8));u.glider.visible=u.gl>.02;u.glider.scale.setScalar(Math.max(.001,u.gl));u.glider.rotation.z=-s.steer*.3;
 // aura
 u.aura.visible=s.aura>0;if(s.aura>0){u.aura.material.uniforms.uT.value=t;u.aura.material.uniforms.uA.value=Math.min(1,s.aura);}
 // balloons
 if(s.balloons!==undefined){u.bal.visible=true;u.balloons.forEach((b,i)=>{b.visible=i<s.balloons;b.position.x=(i-(s.balloons-1)/2)*.5;b.rotation.x=-.25-s.spdF*.4+Math.sin(t*3+i)*.08;b.rotation.z=Math.sin(t*2.2+i*1.7)*.12;});}else u.bal.visible=false;}

/* ---------- items ---------- */
export function orbMesh(kind){const g=new THREE.Group();const col=kind==='seeker'?0xff2a3a:0x2ae08a,glow=kind==='seeker'?new THREE.Color(3,.4,.4):new THREE.Color(.4,3,1.4);
 const shell=new THREE.Mesh(new THREE.SphereGeometry(.55,20,14),new THREE.MeshPhysicalMaterial({color:col,roughness:.15,clearcoat:1,metalness:.2,emissive:col,emissiveIntensity:.35}));shell.castShadow=true;g.add(shell);
 const band=new THREE.Mesh(new THREE.TorusGeometry(.56,.07,6,24),new THREE.MeshBasicMaterial({color:glow}));band.rotation.x=Math.PI/2;g.add(band);
 if(kind==='seeker'){for(const s of[-1,1]){const f=new THREE.Mesh(new THREE.ConeGeometry(.18,.5,4),new THREE.MeshStandardMaterial({color:0xffe04a,metalness:.4,roughness:.3}));f.position.set(s*.55,.15,-.1);f.rotation.z=-s*1.2;g.add(f);}
  for(const s of[-1,1]){const e=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:0xffffff}));e.position.set(s*.2,.18,.48);g.add(e);}}
 g.userData.band=band;return g;}
export function peelMesh(){const g=new THREE.Group(),m=new THREE.MeshStandardMaterial({color:0xffd83a,roughness:.5,side:THREE.DoubleSide}),m2=new THREE.MeshStandardMaterial({color:0xfff2b0,roughness:.7});
 for(let i=0;i<3;i++){const f=new THREE.Mesh(new THREE.SphereGeometry(.55,10,8,0,Math.PI*.5,0,Math.PI*.55),m);f.rotation.y=i*Math.PI*2/3;f.scale.set(1,1.1,1);f.position.y=.1;f.castShadow=true;g.add(f);}
 const c=new THREE.Mesh(new THREE.SphereGeometry(.24,10,8),m2);c.position.y=.32;g.add(c);const st=new THREE.Mesh(new THREE.CylinderGeometry(.06,.08,.3,6),new THREE.MeshStandardMaterial({color:0x5a3a10}));st.position.y=.55;g.add(st);return g;}
export function bombMesh(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.SphereGeometry(.75,20,16),new THREE.MeshPhysicalMaterial({color:0x22242c,roughness:.3,metalness:.3,clearcoat:.8}));b.castShadow=true;g.add(b);
 const cap=new THREE.Mesh(new THREE.CylinderGeometry(.22,.26,.2,10),new THREE.MeshStandardMaterial({color:0x8a8c94,metalness:.8,roughness:.3}));cap.position.y=.78;g.add(cap);
 const fuse=new THREE.Mesh(new THREE.TorusGeometry(.25,.04,5,10,Math.PI),new THREE.MeshStandardMaterial({color:0xc8a060}));fuse.position.set(.25,.9,0);g.add(fuse);
 const spark=new THREE.Mesh(new THREE.SphereGeometry(.12,8,6),new THREE.MeshBasicMaterial({color:new THREE.Color(4,3,1)}));spark.position.set(.5,.92,0);g.add(spark);g.userData.spark=spark;
 const eyes=new THREE.Mesh(merge([[new THREE.SphereGeometry(.12,8,6),M(-.22,.15,.66,0,0,0,1,1.4,.5),0xffffff],[new THREE.SphereGeometry(.12,8,6),M(.22,.15,.66,0,0,0,1,1.4,.5),0xffffff]]),new THREE.MeshBasicMaterial({vertexColors:true}));g.add(eyes);return g;}
export function pepperMesh(){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.CapsuleGeometry(.25,.7,4,10),new THREE.MeshPhysicalMaterial({color:0xff2a1a,roughness:.2,clearcoat:1}));b.rotation.z=.4;g.add(b);
 const s=new THREE.Mesh(new THREE.CylinderGeometry(.05,.08,.3,6),new THREE.MeshStandardMaterial({color:0x2ab03a}));s.position.set(-.25,.5,0);s.rotation.z=.6;g.add(s);return g;}
export function droneMesh(){const g=new THREE.Group();const body=new THREE.Mesh(new THREE.SphereGeometry(.7,16,12).scale(1.3,.6,1.3),new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.3,clearcoat:1}));g.add(body);
 const eye=new THREE.Mesh(new THREE.BoxGeometry(.8,.18,.05),new THREE.MeshBasicMaterial({color:new THREE.Color(.3,2.6,2.2)}));eye.position.set(0,.05,.86);g.add(eye);
 const props=[];for(let i=0;i<4;i++){const a=i*Math.PI/2+Math.PI/4;const arm=new THREE.Mesh(new THREE.BoxGeometry(1.2,.08,.12),new THREE.MeshStandardMaterial({color:0x2a2c34}));arm.position.set(Math.cos(a)*.8,.2,Math.sin(a)*.8);arm.rotation.y=-a;g.add(arm);
  const p=new THREE.Mesh(new THREE.BoxGeometry(.9,.02,.12),new THREE.MeshStandardMaterial({color:0xff4d00}));p.position.set(Math.cos(a)*1.3,.3,Math.sin(a)*1.3);g.add(p);props.push(p);}
 const line=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,2,4),new THREE.MeshBasicMaterial({color:0x888888}));line.position.y=-1;g.add(line);const hook=new THREE.Mesh(new THREE.TorusGeometry(.18,.04,6,12,Math.PI*1.4),new THREE.MeshStandardMaterial({color:0x888888,metalness:.9}));hook.position.y=-2.1;g.add(hook);
 g.userData.props=props;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}
// a glass "ghost" copy for time-trial ghosts
export function ghostify(root){root.traverse(o=>{if(o.isMesh){o.castShadow=false;const m=new THREE.MeshBasicMaterial({color:new THREE.Color(.5,.9,1.6),transparent:true,opacity:.28,depthWrite:false});o.material=m;}});return root;}
