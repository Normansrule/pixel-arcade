// STARFALL VANGUARD — procedural characters on one articulated rig (hips, spine, chest, head, arms, legs):
// Vanguard marines (olive armour, helmets, packs) and the Kyrr: Skitters (small, spore tanks), Wardens (tall, shielded,
// crested) and Ravagers (hulking, tusked). Energy-shield shell with hit ripple, idle/run/aim poses and a ragdoll-lite death.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,merge,M4} from './util.js';
import {panelSet,hexTex} from './tex.js';

let shared=null;
function S(){if(shared)return shared;const pn=panelSet('#808080',41);pn.map.repeat.set(.5,.5);pn.normalMap.repeat.set(.5,.5);
 shared={hex:hexTex(),pn,geo:{cap:(r,l)=>new THREE.CapsuleGeometry(r,l,4,10),sph:new THREE.SphereGeometry(1,18,12),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,8)}};return shared;}

const SHIELD_FS=`uniform sampler2D uHex;uniform float uHit,uT,uOver;uniform vec3 uCol,uHP;varying vec3 vN,vV,vP;varying vec2 vU;
void main(){float f=pow(1.-abs(dot(vN,vV)),2.);float hx=texture2D(uHex,vU*vec2(6.,4.)).r;float d=length(vP-uHP);float ring=smoothstep(.22,0.,abs(d-(1.-uHit)*.9))*uHit;
 float a=(f*.9+hx*.55)*uHit*(.5+.5*smoothstep(1.2,0.,d))+ring*.8*hx+ring*.3;a+=uOver*(f*.8+hx*.25*(.6+.4*sin(uT*4.+vP.y*9.)));gl_FragColor=vec4(uCol*a,1.);}`;

// kind: marine | vanguard | skitter | warden | ravager | overseer
export const LOOK={
 vanguard:{armor:0x3f5a34,suit:0x22251f,glow:0xffb040,visor:0xffb040,scale:1.02,shield:[.9,.75,.25]},
 marine:{armor:0x5a6644,suit:0x6e6650,glow:0x9fd8ff,visor:0x202830,scale:.98},
 skitter:{armor:0xc8742a,suit:0x3a2a22,glow:0x40ffd0,visor:0x40ffd0,scale:.7},
 warden:{armor:0x5a2a9a,suit:0x231a30,glow:0xffc040,visor:0xffd060,scale:1.16,shield:[.6,.45,1.7]},
 wardenR:{armor:0xa82a3a,suit:0x2a1418,glow:0xffd060,visor:0xffd060,scale:1.18,shield:[1.6,.5,.4]},
 ravager:{armor:0x6a4a32,suit:0x2a1c18,glow:0xff40c0,visor:0xff40c0,scale:1.42},
 overseer:{armor:0x1e1a24,suit:0x120e16,glow:0xffc030,visor:0xffc030,scale:1.75,shield:[1.6,1.1,.3]}};

export class Actor3D{
 constructor(kind){const s=S(),L=LOOK[kind];this.kind=kind;const alien=!['marine','vanguard'].includes(kind);
  const armor=new THREE.MeshStandardMaterial({color:L.armor,roughness:alien?.22:.45,metalness:alien?.75:.4,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.6,.6),envMapIntensity:1.1});
  const lite=new THREE.MeshBasicMaterial({color:new THREE.Color(L.glow).multiplyScalar(2.6)});
  const visor=new THREE.MeshStandardMaterial({color:L.visor,roughness:.08,metalness:1,emissive:new THREE.Color(L.visor).multiplyScalar(alien?.6:.25),envMapIntensity:2});
  const suit=new THREE.MeshStandardMaterial({color:L.suit,roughness:.8,metalness:.15,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.4,.4)}),dark=new THREE.MeshStandardMaterial({color:0x15171a,roughness:.45,metalness:.7});
  const skin=new THREE.MeshStandardMaterial({color:kind==='skitter'?0x7a5a8a:kind==='ravager'||kind==='overseer'?0x4a3a40:0x6a5a70,roughness:.55,metalness:.1});
  this.mats=[armor,suit,dark,visor,lite,skin];this.armor=armor;this.lite=lite;
  const pend=new Map();const G=s.geo,mk=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,p,rx=0,ry=0,rz=0)=>{let l=pend.get(p);if(!l)pend.set(p,l=[]);l.push([g,M4(x,y,z,rx,ry,rz,sx,sy,sz),m]);},grp=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const root=this.root=new THREE.Group();const body=this.body=grp(root);body.scale.setScalar(L.scale);this.scale=L.scale;const hips=this.hips=grp(body,0,.98,0);
  const bulk=kind==='ravager'||kind==='overseer'?1.35:kind==='skitter'?1.15:1;this.lean=kind==='skitter'?.45:kind==='ravager'||kind==='overseer'?.22:0;
  mk(G.box,suit,0,0,0,.34*bulk,.2,.24*bulk,hips);mk(G.box,armor,0,.04,-.02,.38*bulk,.1,.27*bulk,hips);
  const leg=sx=>{const th=grp(hips,sx*.11*bulk,-.04,0);mk(G.cap(.085*bulk,.28),suit,0,-.21,0,1,1,1,th);mk(G.box,armor,0,-.17,-.06,.15*bulk,.24,.07,th);
   const kn=grp(th,0,-.44,0);mk(G.sph,armor,0,0,-.05,.08*bulk,.08,.07,kn);mk(G.cap(.075*bulk,.28),suit,0,-.21,0,1,1,1,kn);mk(G.box,armor,0,-.2,-.06,.13*bulk,.26,.07,kn);
   if(!alien)mk(G.box,lite,0,-.13,-.1,.03,.1,.01,kn);
   const ft=grp(kn,0,-.45,0);if(alien&&kind!=='skitter'){mk(G.box,dark,0,-.03,-.09,.11*bulk,.07,.3,ft);mk(G.cone,armor,0,-.02,.1,.05,.12,.05,ft,-1.6);}else mk(G.box,dark,0,-.03,-.05,.13*bulk,.08,.27,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.15*bulk,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);this.pack=grp(chest,0,.02,.2);
  if(kind==='skitter'){mk(G.sph,armor,0,.05,0,.3,.26,.24,chest);mk(G.box,armor,0,-.02,-.16,.34,.18,.06,chest);
   // spore tank on the back: glowing twin sacs in a frame
   mk(G.box,dark,0,.12,.22,.36,.38,.12,chest);mk(G.sph,lite,-.09,.2,.3,.1,.16,.09,chest);mk(G.sph,lite,.09,.2,.3,.1,.16,.09,chest);mk(G.cyl,dark,0,.42,.24,.03,.22,.03,chest);mk(G.sph,lite,0,.55,.24,.045,.045,.045,chest);}
  else if(kind==='warden'||kind==='wardenR'){mk(G.box,armor,0,.06,0,.46,.36,.3,chest);mk(G.box,armor,0,.2,-.04,.5,.12,.34,chest,0,0,0);mk(G.box,lite,0,.02,-.16,.04,.22,.01,chest);
   for(const sx of[-1,1]){mk(G.box,armor,sx*.34,.2,0,.2,.08,.3,chest,0,0,-sx*.4);mk(G.cone,armor,sx*.42,.26,.04,.06,.2,.06,chest,0,0,-sx*1.1);}mk(G.box,dark,0,.05,.2,.3,.36,.12,chest);}
  else if(alien){mk(G.box,armor,0,.08,0,.62,.42,.42,chest);mk(G.sph,armor,0,.26,.05,.42,.2,.3,chest);mk(G.box,lite,-.16,.12,-.22,.12,.03,.01,chest);mk(G.box,lite,.16,.12,-.22,.12,.03,.01,chest);
   for(const sx of[-1,1]){mk(G.sph,armor,sx*.44,.28,0,.2,.16,.22,chest);mk(G.cone,armor,sx*.5,.42,0,.05,.22,.05,chest,0,0,-sx*.5);}
   if(kind==='overseer'){mk(G.cone,lite,0,.5,.24,.05,.5,.05,chest,.4);mk(G.box,armor,0,.1,.3,.5,.6,.1,chest);}}
  else{mk(G.box,armor,0,.06,0,.48,.32,.3,chest);mk(G.box,armor,0,.18,-.02,.42,.13,.32,chest);mk(G.box,dark,0,-.07,-.13,.3,.08,.08,chest);
   mk(G.box,kind==='vanguard'?lite:dark,-.13,.1,-.155,.1,.025,.01,chest);mk(G.box,dark,0,0,.2,.34,.38,.14,chest);mk(G.box,armor,0,.08,.26,.28,.18,.08,chest);
   if(kind==='marine'){mk(G.box,suit,-.12,-.06,-.17,.1,.1,.06,chest);mk(G.box,suit,.12,-.06,-.17,.1,.1,.06,chest);mk(G.cyl,dark,.18,.3,.22,.012,.36,.012,chest);}}
  for(const sx of[-1,1])if(!alien)mk(G.sph,armor,sx*.31,.17,0,.13,.1,.15,chest);
  // heads
  const head=this.head=grp(chest,0,kind==='ravager'||kind==='overseer'?.42:.33,kind==='skitter'?-.08:0);
  if(kind==='skitter'){mk(G.sph,skin,0,.04,-.04,.15,.13,.17,head);mk(G.sph,visor,-.07,.08,-.15,.04,.04,.04,head);mk(G.sph,visor,.07,.08,-.15,.04,.04,.04,head);
   mk(G.box,dark,0,-.02,-.17,.14,.07,.08,head);mk(G.cone,lite,0,-.02,-.22,.025,.06,.025,head,-1.57);mk(G.cyl,dark,0,-.02,.1,.02,.2,.02,chest,1.2);}
  else if(kind==='warden'||kind==='wardenR'){mk(G.cap(.06,.06),suit,0,-.06,0,1,1,1,head);mk(G.sph,armor,0,.08,.02,.13,.15,.2,head);mk(G.box,armor,0,.2,.08,.04,.12,.3,head,-.4);
   mk(G.box,visor,0,.06,-.15,.15,.025,.04,head);for(const sx of[-1,1]){mk(G.box,skin,sx*.06,-.04,-.14,.025,.025,.14,head,0,sx*.25);mk(G.box,skin,sx*.06,-.07,-.13,.022,.022,.12,head,.3,sx*.35);}}
  else if(alien){mk(G.sph,skin,0,.04,-.02,.19,.17,.2,head);mk(G.box,armor,0,.14,0,.32,.08,.3,head);mk(G.box,visor,0,.06,-.18,.24,.035,.04,head);
   for(const sx of[-1,1])mk(G.cone,lite,sx*.12,-.06,-.16,.025,.16,.025,head,-.6,0,sx*.3);if(kind==='overseer')for(let i=0;i<5;i++)mk(G.cone,lite,(i-2)*.07,.24,.04,.02,.14+(i===2?.08:0),.02,head);}
  else{mk(G.cap(.06,.06),suit,0,-.06,0,1,1,1,head);mk(G.sph,armor,0,.1,.01,.155,.16,.175,head);
   if(kind==='vanguard')mk(G.sph,visor,0,.1,-.07,.13,.07,.13,head);else{mk(G.sph,skin,0,.04,-.04,.1,.11,.1,head);mk(G.box,visor,0,.1,-.14,.18,.04,.06,head);mk(G.box,armor,0,.17,-.12,.3,.03,.12,head);}}
  // arms toward a chest-mounted weapon
  const arm=sx=>{const sh=grp(chest,sx*(alien?.36*bulk:.31),.12,0);mk(G.cap(.07*bulk,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,armor,0,-.1,0,.15*bulk,.18,.15*bulk,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.065*bulk,.2),suit,0,-.14,0,1,1,1,el);mk(G.box,armor,0,-.15,0,.12*bulk,.2,.13*bulk,el);mk(G.sph,alien?skin:dark,0,-.3,0,.06*bulk,.06,.07,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);this.gunMount=grp(chest,.1,-.02,-.3);
  // shield shell (vanguard + wardens + overseer)
  const sc=L.shield||[.4,.8,1.6];this.SU={uHex:{value:s.hex},uHit:{value:0},uT:{value:0},uOver:{value:0},uCol:{value:new THREE.Color(...sc)},uHP:{value:new V()}};
  this.shell=new THREE.Mesh(new THREE.SphereGeometry(1,24,16),new THREE.ShaderMaterial({uniforms:this.SU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec3 vN,vV,vP;varying vec2 vU;void main(){vU=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:SHIELD_FS}));
  this.shell.scale.set(.5*bulk,1.02,.45*bulk);this.shell.position.y=.95;this.shell.visible=false;body.add(this.shell);
  this.ph=0;this.st={air:0,kick:0,crouch:0};this.dead=null;this.vis=true;
  for(const[p,l]of pend){const by=new Map();for(const[g,m4,m]of l){let a=by.get(m);if(!a)by.set(m,a=[]);a.push([g,m4]);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=m!==lite;p.add(o);}}}
 setGun(mesh){if(this.gun)this.gunMount.remove(this.gun);this.gun=mesh;if(mesh){this.gunMount.add(mesh);mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});}}
 hit(localPoint,strength=1){this.SU.uHP.value.copy(localPoint);this.SU.uHit.value=Math.min(1,Math.max(this.SU.uHit.value,.55+strength*.45));}
 pose(f,dt,t){const st=this.st,r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  if(f.seat){this._seat(f,dt,t);return;}
  r.rotation.set(0,f.yaw,0);const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const fwd=-(f.vel.x*sy+f.vel.z*cy),side=f.vel.x*cy-f.vel.z*sy,spd=Math.hypot(f.vel.x,f.vel.z);
  st.air=damp(st.air,f.onGround?0:1,10,dt);st.kick=Math.max(0,st.kick-dt*8);st.crouch=damp(st.crouch,f.crouch?1:0,10,dt);
  const run=f.onGround?cl(spd/6.5,0,1.5):0;this.ph+=dt*spd*1.35/this.scale*(f.onGround?1:0);const p=this.ph,sw=Math.sin(p),A=.75*run;const dirF=spd>.3?fwd/spd:1,dirS=spd>.3?side/spd:0;
  const L=this.legL,R=this.legR;const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF*.9-st.crouch*.9;g.th.rotation.z=-ss*A*dirS*.45;g.kn.rotation.x=-Math.max(0,Math.sin(p+(s>0?0:Math.PI)+.9))*A*1.25-.05-st.crouch*1.5;g.ft.rotation.x=st.crouch*.6;};
  leg(L,1);leg(R,-1);const a=st.air;L.th.rotation.x+=-.6*a;L.kn.rotation.x+=-1.1*a;R.th.rotation.x+=.15*a;R.kn.rotation.x+=-.6*a;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run-st.crouch*.36;
  const lean=this.lean+(f.flee?.3:0);this.spine.rotation.set(lean+.08*run+f.pitch*.35+st.crouch*.25,sw*.1*run,-dirS*.06*run);this.chest.rotation.set(f.pitch*.4-st.kick*.08,0,0);this.head.rotation.set(f.pitch*.25-lean*.8,0,0);
  if(f.flee){this.armR.sh.rotation.set(-2.6+Math.sin(t*14)*.4,0,.3);this.armL.sh.rotation.set(-2.6+Math.cos(t*14)*.4,0,-.3);this.armR.el.rotation.set(-.4,0,0);this.armL.el.rotation.set(-.4,0,0);}
  else{this.armR.sh.rotation.set(-1.05-st.kick*.15,0,.25);this.armR.el.rotation.set(-.9,0,0);this.armL.sh.rotation.set(-1.25,0,-.55);this.armL.el.rotation.set(-.55,0,.15);}
  if(f.meleeT>0){const k=Math.sin(Math.min(1,f.meleeT/.4)*Math.PI);this.armR.sh.rotation.x-=k*1.2;this.armL.sh.rotation.x-=k*.9;this.chest.rotation.y=-k*.5;}
  if(this.gun){this.gun.position.z=st.kick*.06;this.gun.visible=!f.flee;}
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*2.2);U.uOver.value=f.over>0?.4:0;this.shell.visible=this.vis&&(U.uHit.value>.01||U.uOver.value>0);}
 _seat(f,dt,t){const r=this.root;r.rotation.set(0,f.seatYaw??f.yaw,0);this.hips.position.y=.55;for(const g of[this.legL,this.legR]){g.th.rotation.set(-1.4,0,0);g.kn.rotation.set(1.3,0,0);}
  this.spine.rotation.set(0,0,0);this.chest.rotation.set(f.pitch*.3,0,0);this.armR.sh.rotation.set(-1.2,0,.2);this.armL.sh.rotation.set(-1.2,0,-.2);this.armR.el.rotation.set(-.5,0,0);this.armL.el.rotation.set(-.5,0,0);if(this.gun)this.gun.visible=!f.seatHideGun;this.shell.visible=false;}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,3.5+force*.25,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2.5+force*.25};this.shell.visible=false;}
 revive(){this.dead=null;this.root.visible=true;this.root.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.rotation.set(0,0,0);}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*6;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*18;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);
  this.legL.kn.rotation.x=damp(this.legL.kn.rotation.x,-.6,4,dt);this.legR.kn.rotation.x=damp(this.legR.kn.rotation.x,-.2,4,dt);this.armR.sh.rotation.x=damp(this.armR.sh.rotation.x,-2.6,3,dt);this.armL.sh.rotation.x=damp(this.armL.sh.rotation.x,.4,3,dt);this.hips.position.y=damp(this.hips.position.y,.75,3,dt);
  this.root.visible=d.t<6;}
}
