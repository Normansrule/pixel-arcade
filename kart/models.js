// CRITTER KART — procedural models: 8 critter drivers + 4 bosses, kart / hovercraft / plane, pickups and props.
import * as THREE from '../vendor/three.module.min.js';
import {merge,M4,ctex} from './util.js';
const G={sph:new THREE.SphereGeometry(1,22,16),sphL:new THREE.SphereGeometry(1,12,9),cyl:new THREE.CylinderGeometry(1,1,1,18),cone:new THREE.ConeGeometry(1,1,16),box:new THREE.BoxGeometry(1,1,1),tor:new THREE.TorusGeometry(1,.35,12,28),cap:new THREE.CapsuleGeometry(.5,1,6,14)};
const MC=new Map();
export function mat(c,o={}){const k=c+JSON.stringify(o);if(MC.has(k))return MC.get(k);const m=new THREE.MeshStandardMaterial({color:c,roughness:o.r??.55,metalness:o.m??0,emissive:o.e??0,emissiveIntensity:o.ei??1,transparent:!!o.t,opacity:o.t??1,flatShading:!!o.flat,side:o.ds?THREE.DoubleSide:THREE.FrontSide});MC.set(k,m);return m;}
function mesh(g,m,x=0,y=0,z=0,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0){const o=new THREE.Mesh(g,m);o.position.set(x,y,z);o.scale.set(sx,sy,sz);o.rotation.set(rx,ry,rz);o.castShadow=true;return o;}
const S=(m,x,y,z,sx,sy,sz)=>mesh(G.sph,m,x,y,z,sx,sy,sz);

/* ---------- eyes ---------- */
function eyes(g,y,z,sep,r=.085,o={}){const W=mat(0xffffff,{r:.2}),K=mat(o.glow?0x88ccff:0x111111,{r:.15,e:o.glow?0x4488ff:0,ei:2});
 for(const s of[-1,1]){const e=S(W,s*sep,y,z,r,r*1.1,r*.7);g.add(e);const p=S(K,s*sep,y+.005,z+r*.55,r*.6,r*.7,r*.35);g.add(p);if(!o.glow){const h=S(W,s*sep+.02,y+.03,z+r*.82,r*.18);g.add(h);}}}

/* ---------- critters ---------- */
export function makeCritter(d){const g=new THREE.Group(),sp=d.sp,c=mat(d.c),c2=mat(d.c2),dark=mat(0x1a1a1a),pink=mat(0xff8aa8);
 const body=new THREE.Group();g.add(body);const head=new THREE.Group();head.position.set(0,.78,.02);body.add(head);
 const big=sp==='tortoise'||sp==='walrus'||sp==='moth'||sp==='stormowl';
 // torso
 body.add(S(sp==='penguin'||sp==='panda'?c:c,0,.34,0,.33,.36,.3));body.add(S(sp==='panda'?mat(0xf4f4f4):c2,0,.32,.12,.24,.27,.2));
 // head shapes
 if(sp==='frog'){head.add(S(c,0,0,0,.42,.3,.36));head.add(S(c2,0,-.1,.12,.34,.16,.26));eyes(head,.24,.08,.18,.12);const m=mesh(G.tor,dark,0,-.06,.3,.16,.05,.05,0,0,0);m.rotation.x=.3;head.add(m);}
 else{head.add(S(c,0,0,0,.36,.33,.34));}
 if(sp==='fox'){head.add(mesh(G.cone,c2,0,-.06,.36,.13,.26,.13,Math.PI/2));head.add(S(dark,0,-.05,.5,.05));for(const s of[-1,1]){head.add(mesh(G.cone,c,s*.2,.32,-.02,.12,.28,.08,0,0,-s*.25));head.add(mesh(G.cone,dark,s*.2,.4,0,.06,.12,.04,0,0,-s*.25));}eyes(head,.08,.27,.13);
  const tail=new THREE.Group();tail.position.set(0,.2,-.3);tail.add(S(c,0,.1,-.25,.16,.16,.36));tail.add(S(c2,0,.16,-.56,.1,.1,.12));body.add(tail);g.userData.tail=tail;}
 if(sp==='penguin'){head.material=c;head.add(S(c2,0,-.04,.17,.25,.22,.2));head.add(mesh(G.cone,mat(0xffa030),0,-.04,.36,.07,.18,.07,Math.PI/2));eyes(head,.07,.25,.11,.075);}
 if(sp==='panda'){for(const s of[-1,1]){head.add(S(dark,s*.25,.25,0,.11,.11,.08));head.add(S(dark,s*.13,.05,.26,.09,.11,.06));}head.add(S(mat(0xf4f4f4),0,-.1,.27,.14,.1,.1));head.add(S(dark,0,-.07,.36,.05,.035,.04));eyes(head,.06,.29,.13,.05);}
 if(sp==='bunny'){for(const s of[-1,1]){const e=new THREE.Group();e.position.set(s*.13,.28,-.03);e.rotation.z=-s*.12;e.add(S(c,0,.28,0,.08,.3,.05));e.add(S(pink,0,.28,.03,.05,.24,.02));head.add(e);(g.userData.ears||(g.userData.ears=[])).push(e);}
  head.add(S(pink,0,-.05,.33,.05,.04,.04));head.add(S(c2,0,-.12,.27,.14,.09,.1));eyes(head,.07,.26,.13);body.add(S(mat(0xffffff),0,.22,-.3,.12));}
 if(sp==='croc'){head.add(mesh(G.box,c,0,-.1,.38,.36,.16,.52));head.add(mesh(G.box,c2,0,-.17,.36,.32,.06,.5));for(let i=0;i<5;i++)for(const s of[-1,1])head.add(mesh(G.cone,mat(0xffffff),s*.16,-.2,.2+i*.09,.025,.06,.025,Math.PI));for(const s of[-1,1])head.add(S(c,s*.08,-.02,.62,.03));eyes(head,.2,.12,.14,.09);
  const tail=new THREE.Group();tail.position.set(0,.15,-.3);tail.add(mesh(G.cone,c,0,0,-.35,.16,.7,.12,-Math.PI/2));body.add(tail);g.userData.tail=tail;}
 if(sp==='owl'||sp==='stormowl'){head.add(S(c2,0,0,.2,.28,.26,.16));head.add(mesh(G.cone,mat(0xffb030),0,-.05,.36,.06,.14,.06,Math.PI/2+.3));for(const s of[-1,1])head.add(mesh(G.cone,c,s*.2,.32,0,.08,.2,.06,0,0,-s*.3));eyes(head,.06,.31,.12,.1,{glow:sp==='stormowl'});}
 if(sp==='pig'){head.add(mesh(G.cyl,c2,0,-.04,.34,.13,.08,.11,Math.PI/2));for(const s of[-1,1]){head.add(S(dark,s*.045,-.04,.39,.025));head.add(mesh(G.cone,c,s*.22,.25,.02,.1,.2,.06,-.5,0,-s*.5));}eyes(head,.1,.28,.13);
  const tail=mesh(G.tor,c,0,.25,-.32,.06,.06,.06,0,Math.PI/2,0);body.add(tail);}
 if(sp==='tortoise'){const sh=S(mat(0x6a4a2a,{flat:true}),0,.42,-.08,.62,.5,.62);body.add(sh);for(let i=0;i<7;i++){const a=i/7*Math.PI*2;body.add(S(mat(0x8a6a3a,{flat:true}),Math.cos(a)*.38,.62,-.08+Math.sin(a)*.38,.18,.1,.18));}body.add(S(mat(0x8a6a3a,{flat:true}),0,.86,-.08,.22,.1,.22));
  head.position.set(0,.6,.48);head.add(mesh(G.box,dark,0,.12,.3,.3,.04,.02));eyes(head,.1,.27,.14,.08);head.add(S(c2,0,-.12,.22,.22,.1,.14));}
 if(sp==='walrus'){head.add(S(c2,0,-.1,.24,.26,.16,.16));for(const s of[-1,1]){head.add(mesh(G.cone,mat(0xfffff0),s*.1,-.34,.3,.045,.34,.045,Math.PI));for(let k=0;k<3;k++)head.add(mesh(G.cyl,mat(0xddd0c0),s*.2,-.08+k*.04,.34,.008,.18,.008,0,0,Math.PI/2+s*.1));}head.add(S(dark,0,-.02,.37,.06,.04,.04));eyes(head,.12,.28,.12,.06);}
 if(sp==='moth'){for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*.22,.5,-.12);w.add(mesh(G.sph,mat(0xff6a1a,{e:0xff3a00,ei:.6}),s*.55,.15,0,.6,.42,.05,0,0,s*.3));w.add(mesh(G.sph,mat(0xffd04a,{e:0xffa000,ei:.8}),s*.62,.18,.03,.18,.14,.03));w.add(mesh(G.sph,mat(0xd83a1a),s*.4,-.25,0,.36,.26,.04,0,0,-s*.4));body.add(w);(g.userData.wings||(g.userData.wings=[])).push(w);}
  for(const s of[-1,1])head.add(mesh(G.cone,mat(0x3a1a0a),s*.1,.38,.08,.03,.4,.03,.3,0,-s*.4));head.add(S(mat(0xffe0a0),0,-.02,.22,.3,.25,.18));eyes(head,.06,.3,.15,.1);}
 if(sp==='stormowl'){for(const s of[-1,1]){const w=new THREE.Group();w.position.set(s*.32,.4,-.05);w.add(mesh(G.sph,c,s*.18,0,-.05,.25,.5,.1,0,0,s*.4));body.add(w);(g.userData.wings||(g.userData.wings=[])).push(w);}head.add(mesh(G.cone,mat(0xffe04a,{e:0xffc000,ei:1}),0,.48,0,.07,.18,.07));}
 // arms reaching for the wheel
 const arms=[];for(const s of[-1,1]){const a=new THREE.Group();a.position.set(s*.27,.48,.06);const col=sp==='panda'?dark:sp==='owl'||sp==='stormowl'?c:c;a.add(mesh(G.cap,col,0,0,.17,.1,.34,.1,Math.PI/2.3));a.add(S(sp==='frog'||sp==='croc'?c:c2,0,-.1,.36,.08));body.add(a);a.rotation.y=-s*.25;arms.push(a);}
 // feet/legs peeking
 for(const s of[-1,1])body.add(S(sp==='penguin'?mat(0xffa030):c,s*.15,.06,.3,.1,.07,.14));
 if(big){g.scale.setScalar(sp==='tortoise'?1.45:1.4);}
 g.userData.head=head;g.userData.body=body;g.userData.arms=arms;g.traverse(o=>{if(o.isMesh)o.castShadow=true;});return g;}

/* ---------- vehicles ---------- */
function wheel(r,w){const g=new THREE.Group();const t=mesh(G.cyl,mat(0x1c1c22,{r:.9}),0,0,0,r,w,r,0,0,Math.PI/2);g.add(t);g.add(mesh(G.cyl,mat(0xe8e8f0,{r:.25,m:.6}),0,0,0,r*.55,w*1.04,r*.55,0,0,Math.PI/2));g.add(mesh(G.cyl,mat(0xff4d00,{r:.3}),0,0,0,r*.2,w*1.08,r*.2,0,0,Math.PI/2));return g;}
function flames(g,pts){const fl=[];const m=new THREE.MeshBasicMaterial({color:0xffa040,transparent:true,opacity:.9,blending:THREE.AdditiveBlending,depthWrite:false});for(const[x,y,z]of pts){const f=new THREE.Mesh(G.cone,m.clone());f.scale.set(.12,.6,.12);f.rotation.x=-Math.PI/2;f.position.set(x,y,z-.3);f.visible=false;g.add(f);fl.push(f);}return fl;}
export function makeVehicle(type,d,o={}){const g=new THREE.Group(),root=new THREE.Group();g.add(root);const kc=mat(o.color??d.kc,{r:.35,m:.25}),trim=mat(0x24242c,{r:.5}),chrome=mat(0xe0e0e8,{r:.2,m:.8});
 const U={root,wheels:[],type};
 if(type==='kart'){root.add(mesh(G.cap,kc,0,.42,.15,.95,1.25,1.0,Math.PI/2));root.add(mesh(G.box,kc,0,.38,1.05,.9,.22,.5));root.add(mesh(G.box,trim,0,.32,1.32,1.3,.16,.2));root.add(mesh(G.box,trim,0,.4,-.95,1.25,.2,.2));
  root.add(mesh(G.box,mat(0x1a1a22),0,.62,-.25,.7,.12,.55));root.add(mesh(G.box,mat(0x1a1a22),0,.85,-.55,.62,.5,.1));// seat
  const sp=new THREE.Group();sp.position.set(0,1.0,-1.0);sp.add(mesh(G.box,kc,0,0,0,1.3,.06,.36));for(const s of[-1,1])sp.add(mesh(G.box,trim,s*.4,-.2,0,.06,.4,.12));root.add(sp);
  const sw=new THREE.Group();sw.position.set(0,.86,.38);sw.rotation.x=-.9;sw.add(mesh(G.tor,trim,0,0,0,.16,.16,.16));sw.add(mesh(G.cyl,trim,0,0,-.12,.03,.25,.03,Math.PI/2));root.add(sw);U.sw=sw;
  for(const[x,z,r]of[[-.66,.8,.28],[.66,.8,.28],[-.7,-.72,.36],[.7,-.72,.36]]){const w=wheel(r,r*.8);w.position.set(x,r,z);root.add(w);U.wheels.push(w);}
  for(const s of[-1,1])root.add(mesh(G.cyl,chrome,s*.32,.52,-1.12,.07,.35,.07,Math.PI/2));U.fl=flames(root,[[-.32,.52,-1.2],[.32,.52,-1.2]]);U.seat=[0,.55,-.32];}
 if(type==='hover'){const skirt=new THREE.Mesh(new THREE.TorusGeometry(1,.2,10,30),mat(0x3a4250,{r:.7}));skirt.rotation.x=Math.PI/2;skirt.scale.set(.98,1.42,1);skirt.position.y=.26;skirt.castShadow=true;root.add(skirt);
  const hull=mesh(G.sph,kc,0,.5,0,1.0,.32,1.45);root.add(hull);root.add(mesh(G.sph,mat(0xffffff,{r:.3}),0,.62,.9,.55,.16,.45));root.add(mesh(G.box,trim,0,.42,0,2.02,.1,.3));
  const cage=new THREE.Group();cage.position.set(0,1.2,-1.05);cage.add(mesh(G.tor,kc,0,0,0,.6,.6,.45));const fan=new THREE.Group();for(let k=0;k<4;k++)fan.add(mesh(G.box,mat(0xd8d8e0,{m:.5,r:.3}),0,0,0,.1,1.05,.03,0,0,k*Math.PI/4));cage.add(fan);cage.add(S(chrome,0,0,.02,.1));root.add(cage);U.fan=fan;
  for(const s of[-1,1])root.add(mesh(G.box,kc,s*.5,1.2,-1.2,.06,.7,.4));root.add(mesh(G.box,mat(0x1a1a22),0,.8,-.25,.7,.14,.6));
  const sw=new THREE.Group();sw.position.set(0,.98,.35);sw.rotation.x=-.9;sw.add(mesh(G.tor,trim,0,0,0,.16,.16,.16));root.add(sw);U.sw=sw;U.fl=flames(root,[[-.3,.8,-1.3],[.3,.8,-1.3]]);U.seat=[0,.7,-.3];}
 if(type==='plane'){root.add(mesh(G.cap,kc,0,.75,0,.9,1.9,.9,Math.PI/2));root.add(mesh(G.cone,kc,0,.75,1.6,.42,.6,.42,Math.PI/2));
  const wingM=mat(o.color2??0xffffff,{r:.4});root.add(mesh(G.box,wingM,0,.62,.25,4.2,.1,.9));for(const s of[-1,1])root.add(mesh(G.box,kc,s*2.05,.7,.25,.12,.24,.92));
  root.add(mesh(G.box,wingM,0,.95,-1.45,1.7,.08,.5));root.add(mesh(G.box,kc,0,1.3,-1.5,.08,.75,.55));
  const prop=new THREE.Group();prop.position.set(0,.75,1.95);for(let k=0;k<3;k++)prop.add(mesh(G.box,mat(0x3a3a40,{r:.5}),0,0,0,.12,1.3,.04,0,0,k*Math.PI*2/3));prop.add(mesh(G.cone,mat(0xff4d00),0,0,.08,.13,.25,.13,Math.PI/2));root.add(prop);U.prop=prop;
  const disc=new THREE.Mesh(new THREE.CircleGeometry(.7,24),new THREE.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide}));disc.position.set(0,.75,1.98);root.add(disc);
  for(const s of[-1,1]){const w=wheel(.18,.14);w.position.set(s*.6,.18,.6);root.add(w);U.wheels.push(w);root.add(mesh(G.box,trim,s*.6,.4,.6,.04,.4,.04));}
  root.add(mesh(G.box,mat(0x1a1a22),0,1.05,-.2,.6,.12,.6));const sw=new THREE.Group();sw.position.set(0,1.15,.35);sw.rotation.x=-.9;sw.add(mesh(G.tor,trim,0,0,0,.14,.14,.14));root.add(sw);U.sw=sw;U.fl=flames(root,[[0,.75,-1.9]]);U.seat=[0,1.0,-.25];}
 // driver
 const crit=makeCritter(d);crit.position.set(...U.seat);root.add(crit);U.crit=crit;
 // bubble shield + shadow blob
 const bub=new THREE.Mesh(G.sphL,new THREE.MeshStandardMaterial({color:0x9af0ff,emissive:0x3ab8ff,emissiveIntensity:.6,transparent:true,opacity:.28,roughness:.1,depthWrite:false}));bub.scale.setScalar(type==='plane'?2.6:1.9);bub.position.y=.8;bub.visible=false;root.add(bub);U.bubble=bub;
 g.traverse(m=>{if(m.isMesh&&m!==bub)m.castShadow=true;});g.userData=U;return g;}

export function makeBossRig(b){const d={sp:b.sp,c:b.c,c2:b.c2,kc:0x3a2a1a};let g;
 if(b.veh==='plane'){g=new THREE.Group();const root=new THREE.Group();g.add(root);const cr=makeCritter(d);cr.scale.setScalar(2.6);cr.position.y=-.4;root.add(cr);g.userData={root,wheels:[],crit:cr,type:'boss',fl:[],bubble:new THREE.Object3D()};return g;}
 g=makeVehicle(b.veh,{...d,kc:b.veh==='hover'?0x5a6a8a:0x3a3a4a});g.scale.setScalar(1.55);return g;}

/* ---------- pickups ---------- */
export function podMesh(){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:0xffffff,emissive:0xff4dc8,emissiveIntensity:.55,roughness:.15,metalness:.1,transparent:true,opacity:.82});
 const o=new THREE.Mesh(new THREE.OctahedronGeometry(1.05,0),m);o.castShadow=true;g.add(o);const q=new THREE.Mesh(new THREE.OctahedronGeometry(.45,0),new THREE.MeshBasicMaterial({color:0xfff2a0}));g.add(q);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.35,.06,6,32),new THREE.MeshBasicMaterial({color:0xffe9ff,transparent:true,opacity:.7}));ring.rotation.x=Math.PI/2;g.add(ring);g.userData={o,m,ring};return g;}
export function berryGeo(){return merge([[new THREE.SphereGeometry(.42,12,10),M4(0,0,0),0xff3a6a],[new THREE.SphereGeometry(.3,10,8),M4(.32,.12,.1),0xff5a8a],[new THREE.ConeGeometry(.12,.35,6),M4(.1,.45,0,0,0,.4),0x3ac84a],[new THREE.SphereGeometry(.12,6,5),M4(-.14,.16,.33),0xffd0e0]]);}
export function coinGeo(){return merge([[new THREE.CylinderGeometry(.85,.85,.16,24),M4(0,0,0,Math.PI/2),0xdfe6f0],[new THREE.CylinderGeometry(.6,.6,.2,6),M4(0,0,0,Math.PI/2),0xffffff]]);}
export function ringMesh(gold,r){const m=new THREE.MeshStandardMaterial({color:gold?0xffc83a:0xff4d8a,emissive:gold?0xb06a00:0xc01a4a,emissiveIntensity:.45,roughness:.3,metalness:.4});const t=new THREE.Mesh(new THREE.TorusGeometry(r,.38,10,40),m);
 const g=new THREE.Group();g.add(t);for(let k=0;k<8;k++){const b=new THREE.Mesh(G.sphL,new THREE.MeshBasicMaterial({color:0xffffff}));b.scale.setScalar(.32);b.position.set(Math.cos(k/8*Math.PI*2)*r,Math.sin(k/8*Math.PI*2)*r,0);g.add(b);}g.userData={m};return g;}
export function balloonMesh(col=0xff3a6a){const g=new THREE.Group();const m=new THREE.MeshStandardMaterial({color:col,roughness:.25,metalness:.05,emissive:col,emissiveIntensity:.15});const b=new THREE.Mesh(G.sph,m);b.scale.set(1,1.18,1);b.castShadow=true;g.add(b);
 g.add(mesh(G.cone,m,0,-1.2,0,.18,.25,.18,Math.PI));const s=new THREE.Mesh(new THREE.CylinderGeometry(.02,.02,2.2,4),mat(0xffffff));s.position.y=-2.4;g.add(s);return g;}
export function missileMesh(){const g=new THREE.Group();g.add(mesh(G.cap,mat(0xff3a2a,{r:.3,m:.3}),0,0,0,.35,.7,.35,Math.PI/2));g.add(mesh(G.cone,mat(0xffe04a),0,0,.65,.2,.35,.2,Math.PI/2));for(let k=0;k<4;k++)g.add(mesh(G.box,mat(0x2a2a2a),Math.cos(k*Math.PI/2)*.25,Math.sin(k*Math.PI/2)*.25,-.4,.04,.3,.3,0,0,k*Math.PI/2));
 eyes(g,.12,.22,.12,.07);return g;}
export function gooMesh(){const g=new THREE.Group();g.add(S(mat(0x6aff3a,{r:.15,e:0x2a8a10,ei:.5}),0,.25,0,.9,.35,.9));for(let k=0;k<6;k++){const a=k/6*Math.PI*2;g.add(S(mat(0x6aff3a,{r:.15}),Math.cos(a)*.75,.1,Math.sin(a)*.75,.3,.15,.3));}eyes(g,.48,.4,.2,.1);return g;}
