// NOVA ARENA — procedural armoured fighters: articulated rig (hips, spine, head, arms, legs), animation poses,
// jetpack flames, energy-shield shell (hex shimmer + hit ripple), active-camo and a ragdoll-lite death.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,merge,M4} from './util.js';
import {panelSet,hexTex} from './tex.js';

let shared=null;
function S(){if(shared)return shared;const pn=panelSet('#808080',41);pn.map.repeat.set(.5,.5);pn.normalMap.repeat.set(.5,.5);
 shared={hex:hexTex(),pn,suit:new THREE.MeshStandardMaterial({color:0x22252c,roughness:.78,metalness:.25,normalMap:pn.normalMap,normalScale:new THREE.Vector2(.4,.4)}),
  dark:new THREE.MeshStandardMaterial({color:0x15171c,roughness:.4,metalness:.8}),
  geo:{cap:(r,l)=>new THREE.CapsuleGeometry(r,l,4,10),sph:new THREE.SphereGeometry(1,20,14),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,12)},
  flameGeo:(()=>{const g=new THREE.ConeGeometry(.07,.5,10,1,true);g.translate(0,-.25,0);return g;})()};return shared;}

const SHIELD_FS=`uniform sampler2D uHex;uniform float uHit,uT,uOver,uCamo;uniform vec3 uCol,uHP;varying vec3 vN,vV,vP;varying vec2 vU;
void main(){float f=pow(1.-abs(dot(vN,vV)),2.);float hx=texture2D(uHex,vU*vec2(6.,4.)).r;float d=length(vP-uHP);float ring=smoothstep(.22,0.,abs(d-(1.-uHit)*.9))*uHit;
 float a=(f*.9+hx*.55)*uHit*(.5+.5*smoothstep(1.2,0.,d))+ring*.8*hx+ring*.3;
 a+=uOver*(f*.8+hx*.25*(.6+.4*sin(uT*4.+vP.y*9.)));a+=uCamo*(f*.35+hx*.05);
 gl_FragColor=vec4(uCol*a,1.);}`;

export class Fighter3D{
 constructor(color,accent){const s=S();this.color=new THREE.Color(color);const armor=new THREE.MeshStandardMaterial({color,roughness:.32,metalness:.55,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.6,.6),envMapIntensity:1.1});
  const glowC=new THREE.Color(accent??color);const lite=new THREE.MeshBasicMaterial({color:glowC.clone().multiplyScalar(2.6)});
  const visor=new THREE.MeshStandardMaterial({color:0xffc070,roughness:.08,metalness:1,emissive:0x5a2a00,emissiveIntensity:.6,envMapIntensity:2});
  const suit=s.suit.clone(),dark=s.dark.clone();this.mats=[armor,suit,dark,visor,lite];this.armor=armor;this.lite=lite;
  const pend=new Map();const G=s.geo,mk=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,p)=>{let l=pend.get(p);if(!l)pend.set(p,l=[]);l.push([g,M4(x,y,z,0,0,0,sx,sy,sz),m]);},grp=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const root=this.root=new THREE.Group();const body=this.body=grp(root);const hips=this.hips=grp(body,0,.98,0);
  mk(G.box,suit,0,0,0,.34,.2,.24,hips);mk(G.box,armor,0,.04,-.02,.38,.1,.27,hips);mk(G.box,lite,0,.04,-.16,.12,.03,.01,hips);
  const leg=sx=>{const th=grp(hips,sx*.11,-.04,0);mk(G.cap(.085,.28),suit,0,-.21,0,1,1,1,th);mk(G.box,armor,0,-.17,-.06,.15,.24,.06,th);
   const kn=grp(th,0,-.44,0);mk(G.sph,armor,0,0,-.05,.075,.075,.06,kn);mk(G.cap(.075,.28),suit,0,-.21,0,1,1,1,kn);mk(G.box,armor,0,-.2,-.06,.13,.26,.07,kn);mk(G.box,lite,sx*.0,-.13,-.1,.03,.12,.01,kn);
   const ft=grp(kn,0,-.45,0);mk(G.box,dark,0,-.03,-.05,.13,.08,.27,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.15,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);mk(G.box,armor,0,.06,0,.5,.34,.3,chest);mk(G.box,armor,0,.18,-.02,.44,.14,.32,chest);mk(G.box,dark,0,-.07,-.13,.3,.08,.08,chest);
  mk(G.box,lite,-.13,.1,-.155,.1,.025,.01,chest);mk(G.box,lite,.13,.1,-.155,.1,.025,.01,chest);
  // jetpack
  const pack=this.pack=grp(chest,0,.02,.2);mk(G.box,dark,0,0,0,.36,.4,.14,pack);mk(G.box,armor,0,.08,.04,.3,.18,.08,pack);this.flames=[];
  for(const sx of[-1,1]){mk(G.cyl,dark,sx*.11,-.24,.02,.06,.12,.06,pack);const fl=new THREE.Mesh(s.flameGeo,new THREE.MeshBasicMaterial({color:new THREE.Color(2.4,1.3,.5),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false}));fl.position.set(sx*.11,-.3,.02);fl.visible=false;pack.add(fl);this.flames.push(fl);}
  // shoulders + head
  for(const sx of[-1,1])mk(G.sph,armor,sx*.31,.17,0,.13,.1,.15,chest);
  const head=this.head=grp(chest,0,.33,0);mk(G.cap(.06,.06),suit,0,-.06,0,1,1,1,head);mk(G.sph,armor,0,.1,.01,.155,.17,.175,head);
  mk(G.sph,visor,0,.1,-.06,.13,.085,.13,head);mk(G.box,armor,0,.21,.0,.04,.06,.24,head);mk(G.box,lite,0,.03,-.165,.06,.012,.01,head);
  // arms posed toward a chest-mounted weapon
  const arm=(sx)=>{const sh=grp(chest,sx*.31,.12,0);mk(G.cap(.07,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,armor,0,-.1,0,.15,.18,.15,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.065,.2),suit,0,-.14,0,1,1,1,el);mk(G.box,armor,0,-.15,0,.12,.2,.13,el);mk(G.sph,dark,0,-.3,0,.06,.06,.07,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);
  this.gunMount=grp(chest,.1,-.02,-.3);
  // shield shell
  this.SU={uHex:{value:s.hex},uHit:{value:0},uT:{value:0},uOver:{value:0},uCamo:{value:0},uCol:{value:new THREE.Color(.45,.8,1.6)},uHP:{value:new V()}};
  this.shell=new THREE.Mesh(new THREE.SphereGeometry(1,28,18),new THREE.ShaderMaterial({uniforms:this.SU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,
   vertexShader:'varying vec3 vN,vV,vP;varying vec2 vU;void main(){vU=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}',fragmentShader:SHIELD_FS}));
  this.shell.scale.set(.5,1.02,.42);this.shell.position.y=.95;this.shell.visible=false;root.add(this.shell);
  this.ph=0;this.st={air:0,jet:0,slide:0,lean:0,kick:0};this.dead=null;this.camo=0;this.vis=true;
  // merge each bone's parts per material (keeps draw calls low)
  for(const[p,l]of pend){const by=new Map();for(const[g,m4,m]of l){let a=by.get(m);if(!a)by.set(m,a=[]);a.push([g,m4]);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=m!==lite;p.add(o);}}}
 setGun(mesh){if(this.gun)this.gunMount.remove(this.gun);this.gun=mesh;if(mesh){this.gunMount.add(mesh);mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});}}
 hit(localPoint,strength=1){this.SU.uHP.value.copy(localPoint);this.SU.uHit.value=Math.min(1,Math.max(this.SU.uHit.value,.55+strength*.45));}
 setCamo(k){if(Math.abs(k-this.camo)<.01)return;this.camo=k;const op=1-k*.93;for(const m of this.mats){m.transparent=k>0.01;m.opacity=op;m.depthWrite=k<.5;}if(this.gun)this.gun.traverse(o=>{if(o.isMesh){o.material.transparent=k>.01;o.material.opacity=op;}});}
 // f: fighter state
 pose(f,dt,t){const st=this.st,r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  r.rotation.set(0,f.yaw,0);const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const fwd=-(f.vel.x*sy+f.vel.z*cy),side=f.vel.x*cy-f.vel.z*sy,spd=Math.hypot(f.vel.x,f.vel.z);
  const ground=f.onGround&&!f.slideT;st.air=damp(st.air,f.onGround?0:1,10,dt);st.jet=damp(st.jet,f.jetting?1:0,12,dt);st.slide=damp(st.slide,f.slideT>0?1:0,14,dt);st.kick=Math.max(0,st.kick-dt*8);
  const run=ground?cl(spd/7,0,1.5):0;this.ph+=dt*spd*1.35*(ground?1:0);const p=this.ph,sw=Math.sin(p),A=.75*run;const dirF=spd>.3?fwd/spd:1,dirS=spd>.3?side/spd:0;
  const L=this.legL,R=this.legR;const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF*.9;g.th.rotation.z=-ss*A*dirS*.45;g.kn.rotation.x=-Math.max(0,Math.sin(p*1+(s>0?0:Math.PI)+.9))*A*1.25-.05;g.ft.rotation.x=0;};
  leg(L,1);leg(R,-1);
  // air: knees up; jet: legs trail; slide: lead leg out
  const a=st.air*(1-st.jet);L.th.rotation.x+=-.6*a;L.kn.rotation.x+=-1.1*a;R.th.rotation.x+=.15*a;R.kn.rotation.x+=-.6*a;
  L.th.rotation.x+=.25*st.jet;R.th.rotation.x+=.35*st.jet;L.kn.rotation.x+=-.25*st.jet;R.kn.rotation.x+=-.35*st.jet;
  L.th.rotation.x=L.th.rotation.x*(1-st.slide)+(-1.25)*st.slide;L.kn.rotation.x=L.kn.rotation.x*(1-st.slide)+(-.15)*st.slide;R.th.rotation.x=R.th.rotation.x*(1-st.slide)+(.1)*st.slide;R.kn.rotation.x=R.kn.rotation.x*(1-st.slide)+(-1.9)*st.slide;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run-.42*st.slide;this.hips.rotation.x=.45*st.slide;
  this.spine.rotation.set(-.45*st.slide+.08*run+f.pitch*.35,sw*.1*run,-dirS*.06*run);this.chest.rotation.set(f.pitch*.4-st.kick*.08,0,0);this.head.rotation.set(f.pitch*.25,0,0);
  // arms hold the weapon
  this.armR.sh.rotation.set(-1.05-st.kick*.15,0,.25);this.armR.el.rotation.set(-.9,0,0);this.armL.sh.rotation.set(-1.25,0,-.55);this.armL.el.rotation.set(-.55,0,.15);
  if(f.meleeT>0){const k=Math.sin(Math.min(1,f.meleeT/.35)*Math.PI);this.armR.sh.rotation.x-=k*.8;this.armL.sh.rotation.x-=k*.6;this.chest.rotation.y=-k*.4;}
  if(this.gun)this.gun.position.z=st.kick*.06;
  for(const fl of this.flames){fl.visible=st.jet>.05&&this.vis;fl.scale.set(1,.6+st.jet*(.8+Math.random()*.5),1);}
  // shield shell
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*2.2);U.uOver.value=f.over>0?.35+Math.min(.4,f.over/250):0;U.uCamo.value=this.camo>0?.9:0;
  this.shell.visible=this.vis&&(U.uHit.value>.01||U.uOver.value>0||U.uCamo.value>0);this.shell.scale.y=1.02-.4*st.slide;this.shell.position.y=.95-.38*st.slide;}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,3.5+force*.25,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2.5+force*.25,y:0,vy:0};this.shell.visible=false;for(const fl of this.flames)fl.visible=false;}
 revive(){this.dead=null;this.root.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.rotation.set(0,0,0);}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*6;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*18;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);
  this.legL.kn.rotation.x=damp(this.legL.kn.rotation.x,-.6,4,dt);this.legR.kn.rotation.x=damp(this.legR.kn.rotation.x,-.2,4,dt);this.armR.sh.rotation.x=damp(this.armR.sh.rotation.x,-2.6,3,dt);this.armL.sh.rotation.x=damp(this.armL.sh.rotation.x,.4,3,dt);this.hips.position.y=damp(this.hips.position.y,.75,3,dt);
  this.root.visible=d.t<3.2;}
}
