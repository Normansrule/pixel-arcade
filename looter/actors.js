// STARWARDEN — procedural characters: fireteam guardians (three subclass silhouettes: cloak, mark, coat), the three
// enemy factions (Hollow, Lattice, Cinderkin) in minor / major / heavy / boss builds, elemental shield shells and deaths.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,merge,M4} from './util.js';
import {panelSet,hexTex} from './tex.js';

let shared=null;
function S(){if(shared)return shared;const pn=panelSet('#808080',41);pn.map.repeat.set(.5,.5);pn.normalMap.repeat.set(.5,.5);
 shared={hex:hexTex(),pn,suit:new THREE.MeshStandardMaterial({color:0x3a3e48,roughness:.75,metalness:.2,normalMap:pn.normalMap,normalScale:new THREE.Vector2(.4,.4)}),
  dark:new THREE.MeshStandardMaterial({color:0x262930,roughness:.45,metalness:.5}),
  geo:{cap:(r,l)=>new THREE.CapsuleGeometry(r,l,4,10),sph:new THREE.SphereGeometry(1,20,14),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12),cone:new THREE.ConeGeometry(1,1,8),ico:new THREE.IcosahedronGeometry(1,0),oct:new THREE.OctahedronGeometry(1,0)},
  flameGeo:(()=>{const g=new THREE.ConeGeometry(.07,.5,10,1,true);g.translate(0,-.25,0);return g;})()};return shared;}

const SHIELD_FS=`uniform sampler2D uHex;uniform float uHit,uT,uOver,uCamo;uniform vec3 uCol,uHP;varying vec3 vN,vV,vP;varying vec2 vU;
void main(){float f=pow(1.-abs(dot(vN,vV)),2.);float hx=texture2D(uHex,vU*vec2(6.,4.)).r;float d=length(vP-uHP);float ring=smoothstep(.22,0.,abs(d-(1.-uHit)*.9))*uHit;
 float a=(f*.9+hx*.55)*uHit*(.5+.5*smoothstep(1.2,0.,d))+ring*.8*hx+ring*.3;
 a+=uOver*(f*.8+hx*.22*(.6+.4*sin(uT*4.+vP.y*9.)));
 gl_FragColor=vec4(uCol*a,1.);}`;
function shell(s){const U={uHex:{value:s.hex},uHit:{value:0},uT:{value:0},uOver:{value:0},uCamo:{value:0},uCol:{value:new THREE.Color(.45,.8,1.6)},uHP:{value:new V()}};
 const m=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),new THREE.ShaderMaterial({uniforms:U,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
  vertexShader:'varying vec3 vN,vV,vP;varying vec2 vU;void main(){vU=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:SHIELD_FS}));
 m.visible=false;m.userData.U=U;return m;}
// rig helper: parts are merged per bone + material
function Rig(){const pend=new Map();this.mk=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,p,rx=0,ry=0,rz=0)=>{let l=pend.get(p);if(!l)pend.set(p,l=[]);l.push([g,M4(x,y,z,rx,ry,rz,sx,sy,sz),m]);};
 this.grp=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
 this.done=(noShadow)=>{for(const[p,l]of pend){const by=new Map();for(const[g,m4,m]of l){let a=by.get(m);if(!a)by.set(m,a=[]);a.push([g,m4]);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=!noShadow.includes(m);p.add(o);}}};}

/* ================= guardians ================= */
export const CLS={
 strider:{n:'STRIDER',el:'arc',armor:0x7a8aa2,glow:0x5fd8ff,cloth:0x3a5a74,sub:'ARC · AGILE HUNTER',gren:'ARC SNARE',mel:'BLINK STRIKE',sup:'TEMPEST LANCE',
  desc:'Fast and slippery. Arc grenades chain lightning between foes, Blink Strike lunges across gaps, and Tempest Lance fires chaining bolts of lightning.'},
 bulwark:{n:'BULWARK',el:'solar',armor:0xa88462,glow:0xff8a2a,cloth:0x9a3a20,sub:'SOLAR · FRONTLINE VANGUARD',gren:'SUNFLARE',mel:'SOLAR FIST',sup:'FORGEFALL',
  desc:'Built to hold the line: tougher shields, a sticky Sunflare grenade, a fist that sends foes flying and Forgefall, a barrage of explosive solar hammers.'},
 seer:{n:'SEER',el:'void',armor:0x8a7aa8,glow:0xb46bff,cloth:0x4a3466,sub:'VOID · RIFT MYSTIC',gren:'ENTROPY WELL',mel:'VOID PALM',sup:'NOVA ASCENT',
  desc:'Bends the void. Entropy Well grinds foes in a lingering vortex, Void Palm strikes at range, and Nova Ascent hurls one enormous void detonation.'}};
export class Guardian3D{
 constructor(cls){const s=S(),C=CLS[cls];const R=new Rig(),mk=R.mk,grp=R.grp;
  const armor=new THREE.MeshStandardMaterial({color:C.armor,roughness:.4,metalness:.35,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.6,.6),envMapIntensity:1.1});
  const cloth=new THREE.MeshStandardMaterial({color:C.cloth,roughness:.9,metalness:0,side:THREE.DoubleSide});const lite=new THREE.MeshBasicMaterial({color:new THREE.Color(C.glow).multiplyScalar(2.6)});
  const visor=new THREE.MeshStandardMaterial({color:new THREE.Color(C.glow).lerp(new THREE.Color(1,1,1),.3),roughness:.08,metalness:1,emissive:new THREE.Color(C.glow).multiplyScalar(.3),envMapIntensity:2});
  const suit=s.suit,dark=s.dark,G=s.geo;this.lite=lite;
  const root=this.root=new THREE.Group();const body=this.body=grp(root);const hips=this.hips=grp(body,0,.98,0);
  mk(G.box,suit,0,0,0,.34,.2,.24,hips);mk(G.box,armor,0,.04,-.02,.38,.1,.27,hips);mk(G.box,lite,0,.04,-.16,.12,.03,.01,hips);
  if(cls==='bulwark'){mk(G.box,cloth,0,-.2,-.15,.22,.42,.02,hips);mk(G.box,lite,0,-.06,-.162,.14,.02,.01,hips);}
  const leg=sx=>{const th=grp(hips,sx*.11,-.04,0);mk(G.cap(.085,.28),suit,0,-.21,0,1,1,1,th);mk(G.box,armor,0,-.17,-.06,.15,.24,.06,th);
   if(cls==='seer')mk(G.box,cloth,sx*.02,-.24,.0,.2,.5,.22,th);
   const kn=grp(th,0,-.44,0);mk(G.sph,armor,0,0,-.05,.075,.075,.06,kn);mk(G.cap(.075,.28),suit,0,-.21,0,1,1,1,kn);mk(G.box,armor,0,-.2,-.06,.13,.26,.07,kn);mk(G.box,lite,0,-.13,-.1,.03,.12,.01,kn);
   const ft=grp(kn,0,-.45,0);mk(G.box,dark,0,-.03,-.05,.13,.08,.27,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.15,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);mk(G.box,armor,0,.06,0,.5,.34,.3,chest);mk(G.box,armor,0,.18,-.02,.44,.14,.32,chest);mk(G.box,dark,0,-.07,-.13,.3,.08,.08,chest);
  mk(G.box,lite,-.13,.1,-.155,.1,.025,.01,chest);mk(G.box,lite,.13,.1,-.155,.1,.025,.01,chest);
  const pack=this.pack=grp(chest,0,.02,.2);mk(G.box,dark,0,0,0,.32,.36,.12,pack);mk(G.box,armor,0,.08,.04,.26,.16,.08,pack);this.flames=[];
  for(const sx of[-1,1]){const fl=new THREE.Mesh(s.flameGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(C.glow).multiplyScalar(1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fl.position.set(sx*.11,-.24,.02);fl.visible=false;pack.add(fl);this.flames.push(fl);}
  if(cls==='strider'){const cl=grp(chest,0,.16,.27);this.cloak=cl;mk(G.box,cloth,0,-.42,0,.46,.86,.02,cl);mk(G.box,lite,0,-.84,.0,.46,.02,.025,cl);mk(G.box,cloth,0,.06,-.12,.5,.1,.26,chest);}
  const shS=cls==='bulwark'?1.35:1;for(const sx of[-1,1])mk(G.sph,armor,sx*.31,.17,0,.13*shS,.1*shS,.15*shS,chest);
  if(cls==='bulwark')for(const sx of[-1,1])mk(G.box,lite,sx*.34,.2,-.08,.08,.02,.02,chest);
  const head=this.head=grp(chest,0,.33,0);mk(G.cap(.06,.06),suit,0,-.06,0,1,1,1,head);
  if(cls==='strider'){mk(G.sph,armor,0,.1,.01,.15,.165,.17,head);mk(G.box,visor,0,.1,-.14,.2,.05,.04,head);mk(G.cone,cloth,0,.2,.04,.19,.22,.2,head,-.25);}
  else if(cls==='bulwark'){mk(G.box,armor,0,.1,.0,.27,.28,.29,head);mk(G.box,visor,0,.11,-.145,.2,.06,.02,head);mk(G.box,armor,0,.25,.01,.05,.06,.27,head);}
  else{mk(G.sph,armor,0,.1,.01,.155,.175,.175,head);mk(G.sph,visor,0,.1,-.06,.13,.085,.13,head);for(const sx of[-1,1])mk(G.cone,armor,sx*.1,.27,.03,.03,.14,.03,head,0,0,-sx*.4);}
  const arm=sx=>{const sh=grp(chest,sx*.31,.12,0);mk(G.cap(.07,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,armor,0,-.1,0,.15,.18,.15,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.065,.2),suit,0,-.14,0,1,1,1,el);mk(G.box,armor,0,-.15,0,.12,.2,.13,el);mk(G.sph,dark,0,-.3,0,.06,.06,.07,el);
   if(cls==='seer'&&sx<0)mk(G.oct,lite,0,-.2,-.09,.05,.06,.02,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);this.gunMount=grp(chest,.1,-.02,-.3);
  this.shell=shell(s);this.SU=this.shell.userData.U;this.shell.scale.set(.5,1.02,.42);this.shell.position.y=.95;root.add(this.shell);
  this.ph=0;this.st={air:0,jet:0,slide:0,kick:0,cast:0};this.dead=null;this.vis=true;R.done([lite]);}
 setGun(mesh){if(this.gun)this.gunMount.remove(this.gun);this.gun=mesh;if(mesh){this.gunMount.add(mesh);mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});}}
 hit(lp,str=1){this.SU.uHP.value.copy(lp);this.SU.uHit.value=Math.min(1,Math.max(this.SU.uHit.value,.55+str*.45));}
 pose(f,dt,t){const st=this.st,r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  r.rotation.set(0,f.yaw,0);const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const fwd=-(f.vel.x*sy+f.vel.z*cy),side=f.vel.x*cy-f.vel.z*sy,spd=Math.hypot(f.vel.x,f.vel.z);
  const ground=f.onGround&&!f.slideT;st.air=damp(st.air,f.onGround?0:1,10,dt);st.jet=damp(st.jet,f.jetting?1:0,12,dt);st.slide=damp(st.slide,f.slideT>0?1:0,14,dt);st.kick=Math.max(0,st.kick-dt*8);st.cast=damp(st.cast,f.castT>0||f.superT>0?1:0,10,dt);
  const run=ground?cl(spd/7,0,1.5):0;this.ph+=dt*spd*1.35*(ground?1:0);const p=this.ph,sw=Math.sin(p),A=.75*run;const dirF=spd>.3?fwd/spd:1,dirS=spd>.3?side/spd:0;
  const L=this.legL,Rr=this.legR;const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF*.9;g.th.rotation.z=-ss*A*dirS*.45;g.kn.rotation.x=-Math.max(0,Math.sin(p+(s>0?0:Math.PI)+.9))*A*1.25-.05;};
  leg(L,1);leg(Rr,-1);
  const a=st.air*(1-st.jet);L.th.rotation.x+=-.6*a;L.kn.rotation.x+=-1.1*a;Rr.th.rotation.x+=.15*a;Rr.kn.rotation.x+=-.6*a;
  L.th.rotation.x+=.25*st.jet;Rr.th.rotation.x+=.35*st.jet;
  L.th.rotation.x=L.th.rotation.x*(1-st.slide)-1.25*st.slide;Rr.th.rotation.x=Rr.th.rotation.x*(1-st.slide)+.1*st.slide;Rr.kn.rotation.x=Rr.kn.rotation.x*(1-st.slide)-1.9*st.slide;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run-.42*st.slide-(f.downed?.62:0);this.hips.rotation.x=.45*st.slide+(f.downed?.9:0);
  this.spine.rotation.set(-.45*st.slide+.08*run+f.pitch*.35,sw*.1*run,-dirS*.06*run);this.chest.rotation.set(f.pitch*.4-st.kick*.08,0,0);this.head.rotation.set(f.pitch*.25,0,0);
  this.armR.sh.rotation.set(-1.05-st.kick*.15,0,.25);this.armR.el.rotation.set(-.9,0,0);this.armL.sh.rotation.set(-1.25+st.cast*-.5,0,-.55+st.cast*.3);this.armL.el.rotation.set(-.55+st.cast*.4,0,.15);
  if(f.meleeT>0){const k=Math.sin(Math.min(1,f.meleeT/.35)*Math.PI);this.armR.sh.rotation.x-=k*.8;this.armL.sh.rotation.x-=k*.6;this.chest.rotation.y=-k*.4;}
  if(this.cloak)this.cloak.rotation.x=damp(this.cloak.rotation.x,.12+Math.min(.7,spd*.06)+st.air*.3,6,dt);
  if(this.gun){this.gun.position.z=st.kick*.06;this.gun.visible=!(f.superT>0);}
  for(const fl of this.flames){fl.visible=st.jet>.05&&this.vis;fl.scale.set(1,.6+st.jet*(.8+Math.random()*.5),1);}
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*2.2);U.uOver.value=f.superT>0?.6:0;U.uCol.value.set(f.superT>0?f.glow:0x6fc8ff).multiplyScalar(1.6);
  this.shell.visible=this.vis&&(U.uHit.value>.01||U.uOver.value>0);this.shell.scale.y=1.02-.4*st.slide;this.shell.position.y=.95-.38*st.slide;
  this.lite.color.set(f.glow).multiplyScalar(f.downed?.6+Math.sin(t*8)*.5:2.6);}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,3+force*.25,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2.5+force*.25};this.shell.visible=false;for(const fl of this.flames)fl.visible=false;}
 revive(){this.dead=null;this.root.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.rotation.set(0,0,0);this.root.visible=true;}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*6;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*18;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);}}

/* ================= enemy factions ================= */
export const FAC={
 hollow:{n:'THE HOLLOW',el:'void',bone:0xd8d0bc,suit:0x221a28,glow:0xb46bff,cloth:0x3a2448,
  names:{grunt:'HOLLOW ACOLYTE',rusher:'HUSK',major:'HOLLOW WARDEN',heavy:'BONE COLOSSUS',boss:'ARCHON VESH, THE UNLIT'}},
 lattice:{n:'THE LATTICE',el:'arc',bone:0xb08a44,suit:0x2a2a2e,glow:0x5fe8ff,cloth:0xe4ded0,
  names:{grunt:'LATTICE FRAME',rusher:'SKITTERLING',major:'PRISM WARDEN',heavy:'AXIS COLOSSUS',boss:'THE CONVERGENT MIND'}},
 cinder:{n:'THE CINDERKIN',el:'solar',bone:0x46383a,suit:0x1c1618,glow:0xff7a22,cloth:0x9a3418,
  names:{grunt:'CINDER RAIDER',rusher:'EMBERHOUND',major:'FLAME BARON',heavy:'SLAGBRUTE',boss:'WARLORD KHAROSS'}}};
export const FTYPE={grunt:{s:1,r:.4,h:1.85},rusher:{s:.92,r:.38,h:1.6},major:{s:1.2,r:.48,h:2.2},heavy:{s:1.75,r:.75,h:3.2},boss:{s:3.4,r:1.5,h:6.4}};
export class Foe3D{
 constructor(fac,type){const s=S(),F=FAC[fac],G=s.geo;const R=new Rig(),mk=R.mk,grp=R.grp;this.type=type;this.fac=fac;
  const bone=new THREE.MeshStandardMaterial({color:F.bone,roughness:fac==='lattice'?.3:.55,metalness:fac==='hollow'?.05:.85,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.5,.5),emissive:0x000000});
  const suit=new THREE.MeshStandardMaterial({color:F.suit,roughness:.7,metalness:.3});const cloth=new THREE.MeshStandardMaterial({color:F.cloth,roughness:.85,metalness:fac==='lattice'?.3:0,side:THREE.DoubleSide});
  const glow=new THREE.MeshBasicMaterial({color:new THREE.Color(F.glow).multiplyScalar(type==='boss'?3.4:2.8)});this.mats=[bone,suit,cloth];this.glowM=glow;this.bone=bone;
  const big=type==='heavy'||type==='boss',maj=type==='major'||big,ru=type==='rusher';const w=big?1.35:1;
  const root=this.root=new THREE.Group();const body=this.body=grp(root);body.scale.setScalar(FTYPE[type].s);const hips=this.hips=grp(body,0,.98,0);
  mk(G.box,suit,0,0,0,.34*w,.2,.24*w,hips);mk(G.box,bone,0,.04,0,.36*w,.1,.27*w,hips);
  if(fac==='cinder'||fac==='hollow')mk(G.box,cloth,0,-.24,-.13,.26*w,.46,.02,hips);if(fac==='cinder'&&maj)mk(G.box,cloth,0,-.24,.13,.3*w,.5,.02,hips);
  const leg=sx=>{const th=grp(hips,sx*.12*w,-.04,0);mk(G.cap(.08*w,.28),suit,0,-.21,0,1,1,1,th);mk(G.box,bone,0,-.17,-.05,.14*w,.24,.07*w,th);
   const kn=grp(th,0,-.44,0);mk(G.cap(.07*w,.28),suit,0,-.21,0,1,1,1,kn);mk(G.box,bone,0,-.2,-.06,.12*w,.27,.08*w,kn);if(fac==='lattice')mk(G.box,glow,0,-.12,-.105,.03,.1,.01,kn);
   const ft=grp(kn,0,-.45,0);mk(G.box,bone,0,-.03,-.06,.13*w,.08,.26*w,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.14*w,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);
  if(fac==='hollow'){mk(G.box,suit,0,.06,0,.42*w,.34,.26*w,chest);for(let i=0;i<4;i++)mk(G.box,bone,0,-.04+i*.075,-.12*w,.4*w-i*.02,.03,.06,chest);mk(G.box,bone,0,.1,.13*w,.08,.4,.06,chest);mk(G.sph,glow,0,.08,-.15*w,.035,.035,.02,chest);}
  else if(fac==='lattice'){mk(G.box,bone,0,.08,0,.44*w,.3,.28*w,chest);mk(G.box,cloth,0,.12,-.08,.36*w,.18,.16*w,chest);mk(G.sph,glow,0,.06,-.15*w,.07*w,.07*w,.04,chest);mk(G.cone,bone,0,.32,.1,.12,.3,.05,chest);}
  else{mk(G.box,bone,0,.06,0,.52*w,.36,.32*w,chest);mk(G.box,bone,0,.2,-.02,.46*w,.14,.34*w,chest);mk(G.box,glow,0,.0,-.165*w,.2,.025,.01,chest);mk(G.box,cloth,0,-.1,.17*w,.5*w,.5,.02,chest);}
  const shW=fac==='cinder'?1.4:fac==='lattice'?.9:.8;for(const sx of[-1,1]){mk(G.sph,bone,sx*.3*w,.17,0,.13*shW*w,.1*shW,.15*shW*w,chest);if(fac==='cinder'&&maj)mk(G.cone,bone,sx*.33*w,.32,0,.04,.18,.04,chest,0,0,-sx*.4);}
  const head=this.head=grp(chest,0,.34,0);mk(G.cap(.05,.06),suit,0,-.06,0,1,1,1,head);
  if(fac==='hollow'){mk(G.sph,bone,0,.1,-.01,.12,.19,.15,head);for(const x of[-.045,0,.045])mk(G.box,glow,x,.12,-.13,.02,.035,.01,head);mk(G.box,bone,0,.0,-.1,.08,.05,.05,head);
   if(maj)for(let i=0;i<5;i++){const a=(i-2)*.35;mk(G.cone,bone,Math.sin(a)*.1,.3,Math.cos(a)*.02,.025,.16+(i===2?.1:0),.025,head,0,0,-a*.6);}}
  else if(fac==='lattice'){const g2=new THREE.CylinderGeometry(1,1,1,16);g2.rotateX(Math.PI/2);mk(g2,bone,0,.1,0,.14,.14,.08,head);mk(G.sph,glow,0,.1,-.05,.075,.075,.03,head);mk(G.box,cloth,0,.1,.04,.32,.04,.04,head);if(maj)mk(G.cone,cloth,0,.32,.0,.03,.24,.03,head);}
  else{mk(G.box,bone,0,.1,0,.22,.24,.24,head);mk(G.box,glow,0,.1,-.125,.15,.03,.01,head);for(const sx of[-1,1])mk(G.cone,bone,sx*.13,.24,0,.035,.2,.035,head,0,0,-sx*.6);if(maj)mk(G.cone,cloth,0,.28,.05,.06,.18,.06,head,-.4);}
  const arm=sx=>{const sh=grp(chest,sx*.31*w,.12,0);mk(G.cap(.065*w,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,bone,0,-.1,0,.13*w,.18,.13*w,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.06*w,.2),suit,0,-.14,0,1,1,1,el);mk(G.box,bone,0,-.15,0,.11*w,.2,.12*w,el);
   if(ru||big&&sx<0){for(const dx of[-.03,0,.03])mk(G.cone,fac==='cinder'?bone:glow,dx,-.38,-.02,.018,.18,.018,el,Math.PI);}else mk(G.sph,suit,0,-.3,0,.06,.06,.07,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);this.gunMount=grp(chest,.1*w,-.02,-.3);
  if(!ru){const gm=new Rig();const gg=new THREE.Group();const L=big?1:.7;gm.mk(G.box,suit,0,0,-.1,.09,.12,.46*L,gg);gm.mk(G.box,bone,0,.06,-.05,.07,.06,.3*L,gg);gm.mk(G.box,glow,0,0,-.36*L,.06,.06,.06,gg);if(fac==='hollow')gm.mk(G.oct,glow,0,0,-.42*L,.06,.06,.06,gg);gm.done([glow]);this.gunMount.add(gg);this.gun=gg;}
  if(type==='boss'){this.core=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,1),new THREE.MeshBasicMaterial({color:new THREE.Color(F.glow).multiplyScalar(4)}));this.core.position.set(0,.06,-.2);chest.add(this.core);
   const halo=new THREE.Mesh(new THREE.TorusGeometry(.32,.02,6,40),glow);halo.position.set(0,.42,.12);halo.rotation.x=.3;head.add(halo);this.halo=halo;
   this.plates=[];for(const sx of[-1,1]){const p=new THREE.Mesh(new THREE.BoxGeometry(.16,.3,.05),bone);p.position.set(sx*.085,.06,-.21);chest.add(p);this.plates.push(p);}}
  this.shell=shell(s);this.SU=this.shell.userData.U;this.shell.scale.set(.55*w,1.05,.5*w);this.shell.position.y=.98;body.add(this.shell);
  this.ph=Math.random()*6;this.dead=null;this.kick=0;this.flash=0;this.spawnK=0;R.done([glow]);}
 setShield(col,on){if(!on){this.shellOn=false;return;}this.shellOn=true;this.SU.uCol.value.set(col).multiplyScalar(1.5);}
 hit(lp,str=1){this.flash=.12;this.SU.uHP.value.copy(lp);this.SU.uHit.value=Math.min(1,Math.max(this.SU.uHit.value,.5+str*.5));}
 // f: foe state {pos,yaw,pitch,vel,onGround,atkT,stagger}
 pose(f,dt,t){const r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  r.rotation.set(0,f.yaw,0);const spd=Math.hypot(f.vel.x,f.vel.z),ru=this.type==='rusher',big=this.type==='heavy'||this.type==='boss';
  const run=f.onGround?cl(spd/(ru?6:4),0,1.4):0;this.ph+=dt*spd*(big?.5:1.25)*(f.onGround?1:0)/Math.max(.7,FTYPE[this.type].s*.7);const p=this.ph,sw=Math.sin(p),A=.7*run;
  const L=this.legL,R=this.legR;L.th.rotation.x=sw*A;R.th.rotation.x=-sw*A;L.kn.rotation.x=-Math.max(0,Math.sin(p+.9))*A*1.2-.08;R.kn.rotation.x=-Math.max(0,Math.sin(p+Math.PI+.9))*A*1.2-.08;
  if(!f.onGround){L.th.rotation.x=-.6;L.kn.rotation.x=-1;R.th.rotation.x=.2;R.kn.rotation.x=-.5;}
  this.kick=Math.max(0,this.kick-dt*7);this.flash=Math.max(0,this.flash-dt);this.bone.emissive.setScalar(this.flash*4);
  const hunch=ru?.6:this.fac==='hollow'?.18:0,stag=f.stagger>0?Math.sin(Math.min(1,f.stagger)*Math.PI)*.5:0;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run-(f.kneel||0)*.4;this.spine.rotation.set(hunch+.06*run-stag*.6+(f.kneel||0)*.5,sw*.08*run,0);this.chest.rotation.set(f.pitch*.4-this.kick*.1,0,0);this.head.rotation.set(-hunch*.7+f.pitch*.2,0,0);
  if(ru){const k=f.atkT>0?Math.sin(Math.min(1,f.atkT/.5)*Math.PI):0;this.armR.sh.rotation.set(-.6-k*1.6+sw*.5*run,0,.2);this.armL.sh.rotation.set(-.6-k*1.2-sw*.5*run,0,-.2);this.armR.el.rotation.x=-.8;this.armL.el.rotation.x=-.8;}
  else{const k=f.atkT>0?Math.sin(Math.min(1,f.atkT/.6)*Math.PI):0;this.armR.sh.rotation.set(-1.1-this.kick*.2,0,.2);this.armR.el.rotation.set(-.9,0,0);this.armL.sh.rotation.set(-1.2-k*1.4,0,-.5+k*.3);this.armL.el.rotation.set(-.6,0,.15);}
  if(this.gun)this.gun.position.z=this.kick*.05;if(this.halo)this.halo.rotation.z=t*.8;if(this.core){this.core.rotation.y=t*2;this.core.scale.setScalar(f.exposed?1.6+Math.sin(t*10)*.2:.8);for(const pl of this.plates)pl.position.z=f.exposed?-.12:-.21;}
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*2.2);U.uOver.value=this.shellOn?.22+.08*Math.sin(t*3):0;this.shell.visible=this.shellOn||U.uHit.value>.02;
  // spawn-in: rise from the rift
  if(this.spawnK<1){this.spawnK=Math.min(1,this.spawnK+dt*1.8);this.body.position.y=-(1-this.spawnK)*.6;}}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,2.5+force*.2,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2+force*.2};this.shell.visible=false;}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*5;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*16;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);const k=cl(1-(d.t-.9)/.7,0,1);this.body.scale.setScalar(FTYPE[this.type].s*(k*.9+.1));this.root.visible=d.t<1.6;}}
