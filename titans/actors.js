// HARDFALL — procedural characters: pilots and grunts (articulated rig, run / wall-run / slide / air poses, jump-kit thrusters,
// ragdoll-lite death) and the BULWARK-class frame (heavy mech): reverse-free humanoid legs, torso twist, chaingun arm with spinning
// barrels, shoulder rocket pod, opening cockpit hatch, kneel/standby pose, frontal aegis shield, dash lean and a smoking wreck.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,merge,M4} from './util.js';
import {panelSet,hexTex} from './tex.js';

let shared=null;
function S(){if(shared)return shared;const pn=panelSet('#808080',41);pn.map.repeat.set(.5,.5);pn.normalMap.repeat.set(.5,.5);const pm=panelSet('#8a8a8a',57,{stripes:'#d8a020'});
 shared={hex:hexTex(),pn,pm,suit:new THREE.MeshStandardMaterial({color:0x24272c,roughness:.8,metalness:.2,normalMap:pn.normalMap,normalScale:new THREE.Vector2(.4,.4)}),
  dark:new THREE.MeshStandardMaterial({color:0x15171b,roughness:.45,metalness:.8}),
  geo:{cap:(r,l)=>new THREE.CapsuleGeometry(r,l,4,10),sph:new THREE.SphereGeometry(1,18,12),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,14)},
  flameGeo:(()=>{const g=new THREE.ConeGeometry(.06,.42,10,1,true);g.translate(0,-.21,0);return g;})()};return shared;}
// part list per bone -> one vertex-coloured mesh (shared material) + one mesh per special material (glow, glass)
function Builder(vcMat){const pend=new Map();return{mk(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,p,rx=0,ry=0,rz=0){let l=pend.get(p);if(!l)pend.set(p,l=[]);l.push([g,M4(x,y,z,rx,ry,rz,sx,sy,sz),m]);},
 grp(p,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;},
 done(noShadow=[]){for(const[p,l]of pend){const vc=[],by=new Map();for(const[g,m4,m]of l){if(m.isColor){vc.push([g,m4,m]);continue;}let a=by.get(m);if(!a)by.set(m,a=[]);a.push([g,m4]);}
   if(vc.length){const o=new THREE.Mesh(merge(vc),vcMat);o.castShadow=true;p.add(o);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=!noShadow.includes(m);p.add(o);}}}};}
let VCP=null,VCM=null;
function vcMats(){if(VCP)return;const s=S();VCP=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.5,metalness:.45,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.6,.6)});
 VCM=new THREE.MeshStandardMaterial({vertexColors:true,roughness:.45,metalness:.6,map:s.pm.map,normalMap:s.pm.normalMap,roughnessMap:s.pm.roughnessMap,normalScale:new THREE.Vector2(.9,.9)});}
const liteCache={};const liteOf=(c,k)=>liteCache[c+'_'+k]||(liteCache[c+'_'+k]=new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k)}));

/* ================= pilots + grunts ================= */
export class Soldier3D{
 constructor(color,accent,kind='pilot'){const s=S();this.kind=kind;const grunt=kind==='grunt';
  vcMats();const armor=new THREE.Color(color),glowC=new THREE.Color(accent??color);const lite=liteOf(accent??color,grunt?1.6:2.8);
  const visor=lite;const suit=new THREE.Color(grunt?0x3d4034:0x26292e),dark=new THREE.Color(0x141619);
  const B=Builder(VCP),G=s.geo,mk=B.mk,grp=B.grp;
  const root=this.root=new THREE.Group();const body=this.body=grp(root);const hips=this.hips=grp(body,0,.98,0);
  mk(G.box,suit,0,0,0,.34,.2,.24,hips);mk(G.box,grunt?suit:armor,0,.04,-.02,.37,.09,.27,hips);mk(G.box,dark,0,-.02,0,.4,.05,.29,hips);
  const leg=sx=>{const th=grp(hips,sx*.11,-.04,0);mk(G.cap(.085,.28),suit,0,-.21,0,1,1,1,th);mk(G.box,grunt?suit:armor,sx*.03,-.16,-.04,.13,.22,.1,th);if(!grunt)mk(G.box,dark,sx*.09,-.2,0,.03,.18,.1,th);
   const kn=grp(th,0,-.44,0);mk(G.sph,armor,0,0,-.05,.075,.075,.065,kn);mk(G.cap(.072,.28),suit,0,-.21,0,1,1,1,kn);mk(G.box,armor,0,-.19,-.06,.12,.26,.07,kn);if(!grunt)mk(G.box,lite,0,-.12,-.1,.025,.1,.01,kn);
   const ft=grp(kn,0,-.45,0);mk(G.box,dark,0,-.03,-.05,.13,.08,.27,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.15,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);
  if(grunt){mk(G.box,suit,0,.06,0,.46,.34,.28,chest);mk(G.box,armor,0,.08,-.03,.42,.3,.28,chest);for(let i=0;i<3;i++)mk(G.box,dark,-.12+i*.12,-.04,-.17,.09,.12,.05,chest);mk(G.box,dark,0,.06,.18,.3,.32,.12,chest);}
  else{mk(G.box,armor,0,.08,0,.44,.3,.27,chest);mk(G.box,dark,0,.17,-.02,.4,.1,.3,chest);mk(G.box,lite,-.12,.1,-.14,.09,.02,.01,chest);mk(G.box,lite,.12,.1,-.14,.09,.02,.01,chest);
   // jump kit: slim pack with twin thrusters
   const pack=this.pack=grp(chest,0,.02,.18);mk(G.box,dark,0,0,0,.3,.34,.1,pack);mk(G.box,armor,0,.06,.05,.24,.14,.05,pack);mk(G.box,lite,0,-.04,.08,.18,.02,.01,pack);this.flames=[];
   for(const sx of[-1,1]){mk(G.cyl,dark,sx*.1,-.2,.02,.045,.1,.045,pack);const fl=new THREE.Mesh(s.flameGeo,new THREE.MeshBasicMaterial({color:glowC.clone().lerp(new THREE.Color(1,1,1),.4).multiplyScalar(2.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fl.position.set(sx*.1,-.25,.02);fl.visible=false;pack.add(fl);this.flames.push(fl);}}
  for(const sx of[-1,1])mk(G.sph,grunt?suit:armor,sx*.29,.16,0,.12,.09,.13,chest);
  const head=this.head=grp(chest,0,.32,0);mk(G.cap(.055,.06),suit,0,-.06,0,1,1,1,head);
  if(grunt){mk(G.sph,armor,0,.11,.01,.15,.13,.16,head);mk(G.box,armor,0,.07,0,.32,.03,.33,head);mk(G.box,visor,0,.06,-.13,.17,.05,.04,head);mk(G.sph,dark,0,.02,-.06,.1,.09,.1,head);}
  else{mk(G.sph,armor,0,.1,.01,.14,.165,.165,head);mk(G.box,dark,0,.04,-.11,.17,.13,.08,head);mk(G.box,lite,0,.11,-.155,.16,.022,.01,head);mk(G.box,dark,0,.2,.02,.05,.06,.22,head);mk(G.box,armor,.13,.12,.0,.03,.08,.1,head);}
  const arm=(sx)=>{const sh=grp(chest,sx*.29,.12,0);mk(G.cap(.065,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,grunt?suit:armor,0,-.1,0,.14,.17,.14,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.06,.2),suit,0,-.14,0,1,1,1,el);mk(G.box,armor,0,-.15,0,.11,.19,.12,el);mk(G.sph,dark,0,-.3,0,.055,.055,.065,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);this.gunMount=grp(chest,.1,-.02,-.3);
  B.done([lite]);if(grunt)this.root.scale.setScalar(1.04);
  this.ph=0;this.st={air:0,slide:0,wall:0,kick:0,thr:0};this.mats=[];this.dead=null;this.vis=true;}
 setGun(mesh){if(this.gun)this.gunMount.remove(this.gun);this.gun=mesh;if(mesh){this.gunMount.add(mesh);mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});}}
 pose(f,dt,t){const st=this.st,r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  r.rotation.set(0,f.yaw,0);const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const fwd=-(f.vel.x*sy+f.vel.z*cy),side=f.vel.x*cy-f.vel.z*sy,spd=Math.hypot(f.vel.x,f.vel.z);
  const wall=f.wallT>0?1:0;const ground=(f.onGround||wall)&&!f.slideT;st.air=damp(st.air,f.onGround||wall?0:1,10,dt);st.slide=damp(st.slide,f.slideT>0?1:0,14,dt);st.kick=Math.max(0,st.kick-dt*8);
  st.wall=damp(st.wall,wall*(f.wallSide||0),10,dt);st.thr=Math.max(0,st.thr-dt*4);
  const run=ground?cl(spd/7,0,1.6):0;this.ph+=dt*spd*1.3*(ground?1:0);const p=this.ph,sw=Math.sin(p),A=.8*run;const dirF=spd>.3?fwd/spd:1,dirS=wall?0:spd>.3?side/spd:0;
  const L=this.legL,R=this.legR;const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF*.9;g.th.rotation.z=-ss*A*dirS*.45;g.kn.rotation.x=-Math.max(0,Math.sin(p+(s>0?0:Math.PI)+.9))*A*1.3-.05;};
  leg(L,1);leg(R,-1);
  const a=st.air;L.th.rotation.x+=-.7*a;L.kn.rotation.x+=-1.2*a;R.th.rotation.x+=.25*a;R.kn.rotation.x+=-.5*a;
  L.th.rotation.x=L.th.rotation.x*(1-st.slide)+(-1.25)*st.slide;L.kn.rotation.x=L.kn.rotation.x*(1-st.slide)+(-.15)*st.slide;R.th.rotation.x=R.th.rotation.x*(1-st.slide)+(.1)*st.slide;R.kn.rotation.x=R.kn.rotation.x*(1-st.slide)+(-1.9)*st.slide;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run-.42*st.slide;this.hips.rotation.x=.45*st.slide;
  this.body.rotation.z=-st.wall*.42;this.body.position.x=st.wall*.18;
  this.spine.rotation.set(-.45*st.slide+.12*run+f.pitch*.35,sw*.1*run,-dirS*.06*run);this.chest.rotation.set(f.pitch*.4-st.kick*.08,0,0);this.head.rotation.set(f.pitch*.25,0,0);
  this.armR.sh.rotation.set(-1.05-st.kick*.15,0,.25);this.armR.el.rotation.set(-.9,0,0);this.armL.sh.rotation.set(-1.25,0,-.55);this.armL.el.rotation.set(-.55,0,.15);
  if(f.meleeT>0){const k=Math.sin(Math.min(1,f.meleeT/.35)*Math.PI);this.armR.sh.rotation.x-=k*.8;L.th.rotation.x-=k*1.4;L.kn.rotation.x=0;this.chest.rotation.y=-k*.4;}
  if(this.gun)this.gun.position.z=st.kick*.06;
  if(this.flames)for(const fl of this.flames){const k=Math.max(st.thr,f.wallT>0?.35:0);fl.visible=k>.05&&this.vis;fl.scale.set(1,.5+k*(.9+Math.random()*.5),1);}}
 thrust(){this.st.thr=1;}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,3.5+force*.25,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2.5+force*.25};if(this.flames)for(const fl of this.flames)fl.visible=false;}
 revive(){this.dead=null;this.root.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.rotation.set(0,0,0);}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*6;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*18;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);
  this.legL.kn.rotation.x=damp(this.legL.kn.rotation.x,-.6,4,dt);this.legR.kn.rotation.x=damp(this.legR.kn.rotation.x,-.2,4,dt);this.armR.sh.rotation.x=damp(this.armR.sh.rotation.x,-2.6,3,dt);this.armL.sh.rotation.x=damp(this.armL.sh.rotation.x,.4,3,dt);this.hips.position.y=damp(this.hips.position.y,.75,3,dt);
  this.root.visible=d.t<3.2;}}

/* ================= BULWARK-class frame ================= */
const SHIELD_FS=`uniform sampler2D uHex;uniform float uA,uT,uHit;uniform vec3 uCol;varying vec3 vN,vV,vP;varying vec2 vU;
void main(){float f=pow(1.-abs(dot(vN,vV)),1.6);float hx=texture2D(uHex,vU*vec2(10.,5.)).r;float sw=smoothstep(.06,0.,abs(fract(vU.y*2.-uT*.6)-.5));
 float a=(f*.8+hx*(.25+uHit*.8)+sw*.15+.05)*uA;gl_FragColor=vec4(uCol*a*(1.+uHit*1.5),1.);}`;
export class Mech3D{
 constructor(team,armorCol,glowCol){const s=S();vcMats();this.vc=VCM.clone();const armor=new THREE.Color(armorCol),dark=new THREE.Color(0x1c1e22),steel=new THREE.Color(0x7a7e84),haz=new THREE.Color(0xd8a020);
  const gc=new THREE.Color(glowCol);const lite=new THREE.MeshBasicMaterial({color:gc.clone().multiplyScalar(2.8)});const glass=new THREE.MeshStandardMaterial({color:0x080a0e,roughness:.05,metalness:1,emissive:gc,emissiveIntensity:.35});
  this.mats=[this.vc,glass];this.lite=lite;const B=Builder(this.vc),mk=B.mk,grp=B.grp,G=s.geo;
  const root=this.root=new THREE.Group();const body=this.body=grp(root);const hips=this.hips=grp(body,0,3.3,0);
  mk(G.box,dark,0,0,0,1.5,.7,1.1,hips);mk(G.box,armor,0,-.05,-.55,1.2,.6,.15,hips,-.2);mk(G.box,armor,0,.05,.55,1.3,.5,.12,hips,.2);mk(G.cyl,steel,0,0,0,.35,1.9,.35,hips,0,0,Math.PI/2);
  const leg=sx=>{const th=grp(hips,sx*.92,-.05,0);mk(G.box,armor,sx*.05,-.7,0,.62,1.45,.78,th);mk(G.box,dark,sx*.36,-.7,0,.1,1.1,.6,th);mk(G.box,lite,sx*.42,-.7,-.2,.02,.6,.04,th);
   const kn=grp(th,0,-1.5,0);mk(G.sph,dark,0,0,0,.38,.38,.38,kn);mk(G.box,armor,0,.05,-.32,.62,.62,.3,kn,.3);
   mk(G.box,armor,0,-.78,-.05,.6,1.45,.68,kn);mk(G.box,haz,0,-.4,-.4,.44,.18,.02,kn);mk(G.cyl,steel,0,-.75,.42,.1,1.2,.1,kn);mk(G.box,dark,0,-1.3,0,.7,.3,.8,kn);
   const ft=grp(kn,0,-1.55,0);mk(G.box,dark,0,-.12,-.12,1,.3,1.7,ft);mk(G.box,armor,0,.02,-.55,.8,.22,.6,ft);mk(G.box,dark,0,-.12,.75,.6,.3,.4,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const torso=this.torso=grp(hips,0,.35,0);
  mk(G.box,armor,0,.95,0,2.4,1.6,1.8,torso);mk(G.box,armor,0,1.85,-.1,2.7,.55,1.7,torso);mk(G.box,dark,0,.15,0,1.8,.4,1.4,torso);
  mk(G.box,dark,0,.95,-.93,1.5,1.25,.08,torso);mk(G.box,lite,-1.21,1.2,-.6,.02,.5,.08,torso);mk(G.box,lite,1.21,1.2,-.6,.02,.5,.08,torso);
  mk(G.box,dark,0,1.3,.95,1.7,1.4,.5,torso);for(let i=0;i<4;i++)mk(G.box,lite,-.5+i*.33,1.3,1.21,.16,.9,.02,torso);// reactor vents
  mk(G.box,dark,0,2.32,-.25,.8,.42,.7,torso);mk(G.box,lite,0,2.34,-.61,.6,.07,.02,torso);mk(G.box,haz,.95,1.85,-.96,.5,.14,.02,torso);mk(G.box,haz,-.95,1.85,-.96,.5,.14,.02,torso);
  mk(G.cyl,steel,.55,2.5,.2,.03,.7,.03,torso);mk(G.cyl,steel,-.6,2.45,.3,.02,.5,.02,torso);
  // cockpit hatch (hinged at its top edge)
  const hatch=this.hatch=grp(torso,0,1.62,-1.0);mk(G.box,armor,0,-.62,-.04,1.3,1.25,.16,hatch);mk(G.box,glass,0,-.32,-.13,1.0,.2,.04,hatch);mk(G.box,dark,0,-.95,-.13,.9,.12,.04,hatch);
  // shoulders + arms
  const arm=sx=>{const sh=grp(torso,sx*1.55,1.6,0);mk(G.box,armor,sx*.12,.15,0,1.0,.75,1.15,sh);mk(G.box,dark,sx*.12,-.25,0,.8,.3,.9,sh);mk(G.box,lite,sx*.63,.15,-.3,.02,.3,.3,sh);
   const up=grp(sh,sx*.12,-.35,0);mk(G.box,dark,0,-.55,0,.5,1.1,.55,up);mk(G.box,armor,0,-.5,-.05,.56,.7,.5,up);
   const el=grp(up,0,-1.15,0);mk(G.sph,dark,0,0,0,.3,.3,.3,el);return{sh,up,el};};
  this.armR=arm(1);this.armL=arm(-1);
  // right forearm = chaingun
  const gun=this.gun=grp(this.armR.el,0,-.15,-.3);mk(G.box,armor,0,0,.15,.7,.7,1.2,gun);mk(G.box,dark,0,-.45,.2,.5,.3,.7,gun);mk(G.cyl,dark,0,0,-.75,.3,.6,.3,gun,Math.PI/2);mk(G.box,lite,.36,.1,0,.02,.12,.8,gun);
  const barrels=this.barrels=grp(gun,0,0,-1.05);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;mk(G.cyl,steel,Math.cos(a)*.15,Math.sin(a)*.15,-.55,.055,1.3,.055,barrels,Math.PI/2);}mk(G.cyl,dark,0,0,-1.05,.24,.12,.24,barrels,Math.PI/2);mk(G.cyl,dark,0,0,-.2,.24,.12,.24,barrels,Math.PI/2);
  this.muzzle=new THREE.Object3D();this.muzzle.position.set(0,0,-1.25);barrels.add(this.muzzle);
  // left forearm: armoured fist
  mk(G.box,armor,0,-.55,0,.6,1.0,.62,this.armL.el);mk(G.box,dark,0,-1.15,-.05,.55,.42,.6,this.armL.el);
  // rocket pod on the left shoulder
  const pod=this.pod=grp(this.armL.sh,-.1,.75,0);mk(G.box,armor,0,0,0,.9,.55,1.15,pod);mk(G.box,dark,0,0,-.58,.8,.45,.05,pod);for(let i=0;i<4;i++)mk(G.cyl,lite,-.2+(i%2)*.4,-.1+(i>>1)*.2,-.6,.07,.03,.07,pod,Math.PI/2);
  B.done([lite]);
  this.podMuzzle=new THREE.Object3D();this.podMuzzle.position.set(0,0,-.7);pod.add(this.podMuzzle);
  // aegis shield dome
  this.SU={uHex:{value:s.hex},uA:{value:0},uT:{value:0},uHit:{value:0},uCol:{value:gc.clone().lerp(new THREE.Color(1,1,1),.3).multiplyScalar(.9)}};
  const sg=new THREE.SphereGeometry(3.4,32,16,Math.PI*.18+Math.PI/2,Math.PI*.64,Math.PI*.22,Math.PI*.56);
  this.shield=new THREE.Mesh(sg,new THREE.ShaderMaterial({uniforms:this.SU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,
   vertexShader:'varying vec3 vN,vV,vP;varying vec2 vU;void main(){vU=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:SHIELD_FS}));
  this.shield.position.set(0,1.1,1.3);this.shield.visible=false;torso.add(this.shield);
  this.ph=0;this.st={walk:0,kneel:1,hatch:1,dash:0,lean:0,spin:0,fire:0,step:0};this.wreck=null;this.footEv=0;this.vis=true;}
 // m: frame state {pos,vel,yaw(legs),aim yaw,pitch,state,...}
 pose(m,dt,t){const st=this.st,r=this.root;r.position.copy(m.pos);if(this.wreck){this._wreck(dt);return;}
  r.rotation.set(0,m.legYaw,0);const cy=Math.cos(m.legYaw),sy=Math.sin(m.legYaw);const fwd=-(m.vel.x*sy+m.vel.z*cy),side=m.vel.x*cy-m.vel.z*sy,spd=Math.hypot(m.vel.x,m.vel.z);
  const kneelT=m.state==='idle'||m.state==='embark'&&m.embT<.7?1:0;st.kneel=damp(st.kneel,kneelT,m.state==='embark'?3.5:5,dt);st.hatch=damp(st.hatch,m.state==='idle'||m.state==='embark'&&m.embT<.9||m.state==='eject'?1:0,6,dt);
  st.dash=damp(st.dash,m.dashT>0?1:0,10,dt);st.fire=damp(st.fire,m.firing?1:0,10,dt);st.spin+=dt*(m.spin||0)*40;
  const walking=m.onGround&&m.state!=='drop';const run=walking?cl(spd/6.5,0,1.35):0;const prev=this.ph;this.ph+=dt*spd*.62*(walking?1:0);const p=this.ph,sw=Math.sin(p),A=.42*run;
  if(Math.floor((prev)/Math.PI)!==Math.floor(p/Math.PI)&&run>.15)this.footEv++;
  const dirF=spd>.3?fwd/spd:1,dirS=spd>.3?side/spd:0;const L=this.legL,R=this.legR;
  const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF;g.th.rotation.z=-ss*A*dirS*.5;g.kn.rotation.x=Math.max(0,Math.sin(p+(s>0?0:Math.PI)+.8))*A*1.4+.08;g.ft.rotation.x=-g.th.rotation.x*.5;};
  leg(L,1);leg(R,-1);
  // kneel / standby pose
  const k=st.kneel;L.th.rotation.x=L.th.rotation.x*(1-k)-1.35*k;L.kn.rotation.x=L.kn.rotation.x*(1-k)+2.25*k;L.ft.rotation.x=L.ft.rotation.x*(1-k)-.85*k;
  R.th.rotation.x=R.th.rotation.x*(1-k)-.35*k;R.kn.rotation.x=R.kn.rotation.x*(1-k)+2.0*k;R.ft.rotation.x=R.ft.rotation.x*(1-k)-1.6*k;
  if(m.state==='drop'){L.th.rotation.x=-.2;R.th.rotation.x=.15;L.kn.rotation.x=.3;R.kn.rotation.x=.25;}
  this.hips.position.y=3.3-Math.abs(Math.cos(p))*.12*run-1.55*k;this.body.rotation.z=-st.dash*(m.dashSide||0)*.12;this.body.rotation.x=st.dash*.1*(m.dashFwd||0);
  // torso twist toward the aim; pitch splits between torso and arms
  const tw=cl(((m.yaw-m.legYaw+Math.PI*3)%(Math.PI*2))-Math.PI,-1.4,1.4);this.torso.rotation.set(.35*k+m.pitch*.3*(1-k)+sw*.02*run,tw*(1-k),sw*.03*run);
  this.hatch.rotation.x=-st.hatch*1.9;
  const ap=m.pitch*.7*(1-k);this.armR.sh.rotation.set(-1.45*(1-k)-ap+st.fire*.02*Math.sin(t*60),0,.05);this.armR.up.rotation.set(0,0,0);this.armR.el.rotation.set(-.12*(1-k)-.2*k,0,0);
  this.armL.sh.rotation.set(-.3*(1-k)-ap*.3+(m.punchT>0?-1.6*Math.sin(m.punchT/.5*Math.PI):0)+.15*k,0,-.1);this.armL.el.rotation.set(-.6*(1-k)-.3*k+(m.punchT>0?.6*Math.sin(m.punchT/.5*Math.PI):0),0,0);
  if(k>.5){this.armR.sh.rotation.x=.25*k;this.armR.el.rotation.x=-.5*k;}
  this.barrels.rotation.z=st.spin;
  // shield
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*3);U.uA.value=damp(U.uA.value,m.shieldT>0?1:0,10,dt);this.shield.visible=U.uA.value>.02&&this.vis;}
 shieldHit(){this.SU.uHit.value=1;}
 kill(){this.wreck={t:0,v:0};this.shield.visible=false;this.vc.color.setRGB(.22,.2,.19);this.mats[1].emissiveIntensity=0;this.lite.color.setRGB(.05,.02,0);}
 revive(){this.wreck=null;}
 _wreck(dt){const w=this.wreck;w.t+=dt;this.hips.position.y=damp(this.hips.position.y,1.4,3,dt);this.body.rotation.x=damp(this.body.rotation.x,.35,2,dt);this.body.rotation.z=damp(this.body.rotation.z,.15,2,dt);
  this.legL.kn.rotation.x=damp(this.legL.kn.rotation.x,1.6,3,dt);this.legR.kn.rotation.x=damp(this.legR.kn.rotation.x,1.2,3,dt);this.legL.th.rotation.x=damp(this.legL.th.rotation.x,-1,3,dt);this.legR.th.rotation.x=damp(this.legR.th.rotation.x,-.6,3,dt);
  this.armR.sh.rotation.x=damp(this.armR.sh.rotation.x,.4,2,dt);this.armL.sh.rotation.x=damp(this.armL.sh.rotation.x,.2,2,dt);this.torso.rotation.x=damp(this.torso.rotation.x,.6,2,dt);
  if(w.t>9){this.body.position.y-=dt*.8;}}}
