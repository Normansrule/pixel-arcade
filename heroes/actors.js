// ZENITH PROTOCOL — procedural hero models: an articulated rig (hips, spine, head, arms, legs) dressed per hero with a distinct
// silhouette (helmets, pauldrons, packs, wings, capes) in the hero's signature armour over a team-coloured undersuit with team glow strips.
// Includes a hit/buff shell, an x-ray outline for revealed enemies, animation poses and a ragdoll-lite death.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,merge,M4,rbox} from './util.js';
import {panelSet,hexTex} from './tex.js';

let shared=null;
function S(){if(shared)return shared;const pn=panelSet('#808080',41);pn.map.repeat.set(.5,.5);pn.normalMap.repeat.set(.5,.5);
 shared={hex:hexTex(),pn,dark:new THREE.MeshStandardMaterial({color:0x15171c,roughness:.45,metalness:.7}),
  geo:{cap:(r,l)=>new THREE.CapsuleGeometry(r,l,4,12),sph:new THREE.SphereGeometry(1,24,16),box:new THREE.BoxGeometry(1,1,1),cyl:new THREE.CylinderGeometry(1,1,1,16),cone:new THREE.ConeGeometry(1,1,12),tor:new THREE.TorusGeometry(1,.08,8,40)}};return shared;}

const SHELL_FS=`uniform sampler2D uHex;uniform float uHit,uT,uBuff;uniform vec3 uCol,uBuffC,uHP;varying vec3 vN,vV,vP;varying vec2 vU;
void main(){float f=pow(1.-abs(dot(vN,vV)),2.);float hx=texture2D(uHex,vU*vec2(6.,4.)).r;float d=length(vP-uHP);float ring=smoothstep(.22,0.,abs(d-(1.-uHit)*.9))*uHit;
 float a=(f*.9+hx*.4)*uHit*(.5+.5*smoothstep(1.2,0.,d))+ring*.6*hx;vec3 c=uCol*a;
 c+=uBuffC*uBuff*(f*.9+hx*.18*(.6+.4*sin(uT*5.+vP.y*9.)));gl_FragColor=vec4(c,1.);}`;
const XRAY_FS=`uniform vec3 uC;uniform float uA;varying vec3 vN,vV;void main(){float f=pow(1.-abs(dot(vN,vV)),1.6);gl_FragColor=vec4(uC*(f*1.3+.12)*uA,1.);}`;
const SHELL_VS='varying vec3 vN,vV,vP;varying vec2 vU;void main(){vU=uv;vP=position;vec4 mv=modelViewMatrix*vec4(position,1.);vN=normalize(normalMatrix*normal);vV=normalize(-mv.xyz);gl_Position=projectionMatrix*mv;}';

export class Hero3D{
 constructor(look,team){const s=S(),L=look,Bk=L.bulk||1;this.look=L;const tc=team.suit,glowC=new THREE.Color(...team.glow);
  const armor=new THREE.MeshStandardMaterial({color:L.armor,roughness:.38,metalness:.35,map:s.pn.map,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.45,.45),envMapIntensity:1});
  const trim=new THREE.MeshStandardMaterial({color:L.trim,roughness:.42,metalness:.55,envMapIntensity:.9});
  const suit=new THREE.MeshStandardMaterial({color:tc,roughness:.7,metalness:.15,normalMap:s.pn.normalMap,normalScale:new THREE.Vector2(.25,.25)});
  const lite=new THREE.MeshBasicMaterial({color:glowC.clone()});const acc=new THREE.MeshBasicMaterial({color:new THREE.Color(...L.accent)});const dark=s.dark;
  this.mats=[armor,trim,suit,lite,acc];this.armor=armor;this.lite=lite;this.acc=acc;
  const pend=new Map();const G=s.geo,mk=(g,m,x=0,y=0,z=0,sx=1,sy=1,sz=1,p,rx=0,ry=0,rz=0)=>{if(g===G.box&&Math.min(sx,sy,sz)>.025){g=rbox(sx,sy,sz);sx=sy=sz=1;}let l=pend.get(p);if(!l)pend.set(p,l=[]);l.push([g,M4(x,y,z,rx,ry,rz,sx,sy,sz),m]);},grp=(p,x=0,y=0,z=0)=>{const g=new THREE.Group();g.position.set(x,y,z);p.add(g);return g;};
  const root=this.root=new THREE.Group();const body=this.body=grp(root);body.scale.setScalar(L.height||1);const hips=this.hips=grp(body,0,.98,0);const lg=L.legs||1;
  mk(G.box,suit,0,0,0,.34*Bk,.2,.24,hips);mk(G.box,armor,0,.04,-.02,.4*Bk,.1,.28,hips);mk(G.box,lite,0,.04,-.165,.14,.03,.01,hips);mk(G.box,trim,0,-.06,-.13,.16*Bk,.14,.04,hips);
  const leg=sx=>{const th=grp(hips,sx*.11*Math.sqrt(Bk),-.04,0);mk(G.cap(.09*lg,.26),suit,0,-.21,0,1,1,1,th);mk(G.box,armor,0,-.17,-.06,.16*lg,.26,.07,th);mk(G.box,trim,sx*.07*lg,-.2,0,.03,.24,.14,th);
   const kn=grp(th,0,-.44,0);mk(G.sph,armor,0,0,-.05,.085*lg,.08,.07,kn);mk(G.cap(.08*lg,.26),suit,0,-.21,0,1,1,1,kn);mk(G.box,armor,0,-.2,-.06,.14*lg,.28,.08,kn);mk(G.box,lite,0,-.13,-.105,.03,.13,.01,kn);
   if(L.back==='fins')mk(G.box,acc,sx*.06,-.22,.07,.015,.22,.09,kn,-.3);
   const ft=grp(kn,0,-.45,0);mk(G.box,dark,0,-.03,-.05,.14*lg,.09,.28,ft);mk(G.box,trim,0,.0,-.16,.12*lg,.06,.07,ft);return{th,kn,ft};};
  this.legL=leg(-1);this.legR=leg(1);
  const spine=this.spine=grp(hips,0,.08,0);mk(G.cap(.16*Bk,.12),suit,0,.1,0,1,1,.8,spine);
  const chest=this.chest=grp(spine,0,.26,0);mk(G.box,armor,0,.06,0,.5*Bk,.34,.3,chest);mk(G.box,armor,0,.18,-.02,.46*Bk,.14,.33,chest);mk(G.box,trim,0,-.07,-.13,.3*Bk,.08,.08,chest);
  mk(G.box,lite,-.13*Bk,.1,-.16,.1,.025,.01,chest);mk(G.box,lite,.13*Bk,.1,-.16,.1,.025,.01,chest);mk(G.box,trim,0,.2,-.17,.18,.05,.02,chest);
  if(L.helm==='dome'){mk(G.box,trim,0,.02,-.16,.34*Bk,.16,.04,chest);mk(G.cyl,acc,0,.04,-.19,.05,.02,.05,chest,Math.PI/2);}
  if(L.helm==='mask'){for(const sx of[-1,1])mk(G.box,acc,sx*.09,-.02,-.16,.05,.1,.015,chest);}
  // shoulders
  const SW=.31*Bk;this.SW=SW;
  for(const sx of[-1,1]){if(L.pads==='block'){mk(G.box,armor,sx*(SW+.02),.2,0,.26,.18,.3,chest,0,0,sx*-.2);mk(G.box,trim,sx*(SW+.05),.12,0,.27,.04,.31,chest,0,0,sx*-.2);mk(G.box,lite,sx*(SW+.15),.17,-.16,.02,.06,.01,chest);}
   else if(L.pads==='round'){mk(G.sph,armor,sx*SW,.18,0,.19,.15,.2,chest);mk(G.tor,trim,sx*SW,.12,0,.19,.19,.19,chest,Math.PI/2);}
   else if(L.pads==='one'&&sx<0){mk(G.sph,armor,sx*SW,.18,0,.16,.12,.17,chest);mk(G.box,trim,sx*(SW+.04),.24,0,.12,.03,.18,chest);}
   else mk(G.sph,armor,sx*SW,.17,0,.11,.09,.12,chest);}
  // back items
  const pack=this.pack=grp(chest,0,.04,.2);this.wings=[];this.cape=null;
  if(L.back==='reactor'){mk(G.box,trim,0,0,.02,.46,.46,.2,pack);mk(G.cyl,acc,0,.02,.13,.09,.3,.09,pack);mk(G.box,armor,0,.25,.04,.5,.08,.22,pack);for(const sx of[-1,1])mk(G.cyl,dark,sx*.17,.3,.06,.04,.18,.04,pack);}
  else if(L.back==='tanks'){for(const sx of[-1,1]){mk(G.cyl,trim,sx*.1,0,.04,.08,.46,.08,pack);mk(G.sph,trim,sx*.1,.23,.04,.08,.06,.08,pack);mk(G.box,acc,sx*.1,0,.125,.02,.3,.01,pack);}mk(G.box,dark,0,0,-.02,.36,.3,.06,pack);}
  else if(L.back==='tanks2'){for(const sx of[-1,1]){mk(G.cyl,armor,sx*.09,-.02,.04,.065,.4,.065,pack);mk(G.cyl,dark,sx*.09,.2,.04,.04,.05,.04,pack);}mk(G.box,acc,0,-.05,.11,.05,.24,.02,pack);mk(G.box,dark,0,0,-.02,.3,.26,.06,pack);}
  else if(L.back==='fins'){mk(G.box,trim,0,0,0,.3,.3,.1,pack);for(const sx of[-1,1]){mk(G.box,acc,sx*.12,.22,.06,.025,.34,.05,pack,-.5,0,sx*-.35);mk(G.box,armor,sx*.12,.1,.06,.04,.2,.07,pack,-.4,0,sx*-.35);}}
  else if(L.back==='speaker'){mk(G.box,trim,0,0,.02,.34,.36,.16,pack);for(const y of[.08,-.08]){mk(G.cyl,dark,0,y,.11,.09,.03,.09,pack,Math.PI/2);mk(G.cyl,acc,0,y,.125,.04,.01,.04,pack,Math.PI/2);}mk(G.cyl,dark,.14,.32,.03,.012,.36,.012,pack);mk(G.sph,acc,.14,.5,.03,.025,.025,.025,pack);}
  else if(L.back==='wings'){mk(G.box,trim,0,0,0,.3,.3,.1,pack);for(const sx of[-1,1]){const w=grp(pack,sx*.12,.12,.06);w.rotation.z=sx*-.35;this.wings.push(w);for(let i=0;i<4;i++){const len=.55-i*.08,ang=sx*(.35+i*.32);mk(G.box,armor,sx*Math.sin(Math.abs(ang))*len*.5,Math.cos(ang)*len*.5,0,.05,len,.02,w,0,0,-ang);mk(G.box,acc,sx*Math.sin(Math.abs(ang))*len*.5+sx*.03,Math.cos(ang)*len*.5,.012,.012,len*.94,.01,w,0,0,-ang);}}}
  else if(L.back==='cape'){mk(G.box,trim,0,.02,-.02,.3,.26,.08,pack);this.cape=grp(chest,0,.22,.17);mk(G.box,trim,0,-.42,0,.46,.84,.03,this.cape);mk(G.box,acc,0,-.84,-.012,.46,.02,.01,this.cape);mk(G.box,armor,0,-.1,.005,.3,.12,.03,this.cape);}
  // head + helmet variants
  const head=this.head=grp(chest,0,.33,0);mk(G.cap(.065,.06),suit,0,-.06,0,1,1,1,head);
  const H=L.helm;
  if(H==='dome'){mk(G.sph,armor,0,.1,.01,.19,.19,.2,head);mk(G.box,acc,0,.09,-.17,.24,.05,.04,head);mk(G.box,trim,0,0,-.13,.2,.06,.1,head);mk(G.box,trim,0,.29,.01,.05,.04,.32,head);}
  else if(H==='horns'){mk(G.sph,armor,0,.1,.01,.17,.17,.18,head);mk(G.box,trim,0,.08,-.15,.26,.07,.06,head);for(const sx of[-1,1]){mk(G.box,acc,sx*.05,.1,-.185,.05,.018,.01,head);mk(G.cone,trim,sx*.2,.22,0,.045,.2,.045,head,0,0,sx*-.9);mk(G.cone,trim,sx*.29,.3,0,.03,.12,.03,head,0,0,sx*-.2);}}
  else if(H==='crest'){mk(G.sph,armor,0,.1,.01,.15,.16,.17,head);mk(G.box,acc,0,.1,-.14,.22,.045,.06,head);mk(G.box,acc,0,.27,.05,.025,.12,.26,head,.2);mk(G.box,trim,0,.02,-.12,.16,.06,.08,head);}
  else if(H==='hood'){mk(G.sph,trim,0,.12,.03,.18,.2,.2,head);mk(G.cone,trim,0,.13,.18,.12,.24,.12,head,1.9);mk(G.sph,dark,0,.08,-.08,.13,.13,.1,head);mk(G.box,acc,0,.1,-.165,.15,.02,.01,head);mk(G.box,armor,0,.0,-.14,.14,.07,.06,head);}
  else if(H==='mask'){mk(G.sph,trim,0,.1,.01,.15,.16,.16,head);mk(G.box,armor,0,.03,-.12,.17,.09,.08,head);for(const sx of[-1,1]){mk(G.cyl,dark,sx*.06,.12,-.13,.045,.05,.045,head,Math.PI/2);mk(G.cyl,acc,sx*.06,.12,-.16,.035,.01,.035,head,Math.PI/2);}mk(G.box,dark,0,.13,-.1,.3,.025,.2,head);mk(G.sph,armor,0,.2,.15,.07,.07,.09,head);mk(G.cap(.04,.18),armor,0,.08,.2,1,1,1,head,.5);}
  else if(H==='halo'){mk(G.sph,armor,0,.1,.01,.15,.16,.17,head);mk(G.box,acc,0,.11,-.14,.2,.04,.05,head);mk(G.box,trim,0,.2,-.04,.08,.04,.2,head);this.halo=new THREE.Mesh(new THREE.TorusGeometry(.17,.016,8,40),acc);this.halo.rotation.x=Math.PI/2+.25;this.halo.position.set(0,.36,.04);head.add(this.halo);}
  else if(H==='phones'){mk(G.sph,armor,0,.1,.01,.15,.16,.16,head);mk(G.box,acc,0,.11,-.14,.22,.05,.05,head);for(const sx of[-1,1]){mk(G.cyl,trim,sx*.16,.1,0,.08,.06,.08,head,0,0,Math.PI/2);mk(G.cyl,acc,sx*.195,.1,0,.05,.01,.05,head,0,0,Math.PI/2);}mk(G.tor,trim,0,.12,0,.17,.17,.17,head,0,Math.PI/2);for(let i=0;i<3;i++)mk(G.cone,acc,0,.27-i*.01,-.05+i*.08,.025,.1,.025,head,-.4);}
  // arms posed toward a chest-mounted weapon
  const arm=(sx)=>{const sh=grp(chest,sx*SW,.12,0);mk(G.cap(.075,.2),suit,0,-.15,0,1,1,1,sh);mk(G.box,armor,0,-.1,0,.16,.18,.16,sh);const el=grp(sh,0,-.3,0);mk(G.cap(.07,.2),suit,0,-.14,0,1,1,1,el);
   if(L.gauntlets){mk(G.box,armor,0,-.17,0,.2,.28,.2,el);mk(G.box,acc,0,-.17,-.105,.1,.03,.01,el);}else mk(G.box,armor,0,-.15,0,.13,.2,.14,el);mk(G.sph,dark,0,-.3,0,.065,.065,.075,el);return{sh,el};};
  this.armR=arm(1);this.armL=arm(-1);
  this.gunMount=grp(chest,.1,-.02,-.3);
  // hit / buff shell + x-ray reveal outline
  this.SU={uHex:{value:s.hex},uHit:{value:0},uT:{value:0},uBuff:{value:0},uCol:{value:new THREE.Color(1.6,1.6,1.8)},uBuffC:{value:new THREE.Color(2,1.5,.4)},uHP:{value:new V()}};
  const shellGeo=new THREE.SphereGeometry(1,28,18);this.shell=new THREE.Mesh(shellGeo,new THREE.ShaderMaterial({uniforms:this.SU,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:SHELL_VS,fragmentShader:SHELL_FS}));
  this.shell.scale.set(.5*Math.max(1,Bk*.9),1.02,.42);this.shell.position.y=.95;this.shell.visible=false;body.add(this.shell);
  this.XU={uC:{value:new THREE.Color(2.4,.35,.3)},uA:{value:1}};this.xray=new THREE.Mesh(shellGeo,new THREE.ShaderMaterial({uniforms:this.XU,transparent:true,depthWrite:false,depthTest:false,blending:THREE.AdditiveBlending,vertexShader:SHELL_VS,fragmentShader:XRAY_FS}));
  this.xray.scale.set(.42*Math.max(1,Bk*.85),.98,.36);this.xray.position.y=.95;this.xray.renderOrder=20;this.xray.visible=false;body.add(this.xray);
  this.ph=0;this.st={air:0,kick:0,cast:0};this.dead=null;this.vis=true;
  for(const[p,l]of pend){const by=new Map();for(const[g,m4,m]of l){let a=by.get(m);if(!a)by.set(m,a=[]);a.push([g,m4]);}for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);o.castShadow=m!==lite&&m!==acc;p.add(o);}}}
 setGun(mesh){if(this.gun)this.gunMount.remove(this.gun);this.gun=mesh;if(mesh){this.gunMount.add(mesh);mesh.traverse(o=>{if(o.isMesh)o.castShadow=true;});}}
 hit(localPoint,strength=1){this.SU.uHP.value.copy(localPoint);this.SU.uHit.value=Math.min(1,Math.max(this.SU.uHit.value,.45+strength*.45));}
 // f: fighter state
 pose(f,dt,t){const st=this.st,r=this.root;r.position.copy(f.pos);if(this.dead){this._dead(dt);return;}
  r.rotation.set(0,f.yaw,0);const cy=Math.cos(f.yaw),sy=Math.sin(f.yaw);const fwd=-(f.vel.x*sy+f.vel.z*cy),side=f.vel.x*cy-f.vel.z*sy,spd=Math.hypot(f.vel.x,f.vel.z);
  const ground=f.onGround;st.air=damp(st.air,ground?0:1,10,dt);st.kick=Math.max(0,st.kick-dt*8);st.cast=Math.max(0,st.cast-dt*2.5);
  const run=ground?cl(spd/5.5,0,1.4):0;this.ph+=dt*spd*1.7*(ground?1:0);const p=this.ph,sw=Math.sin(p),A=.72*run;const dirF=spd>.3?fwd/spd:1,dirS=spd>.3?side/spd:0;
  const L=this.legL,R=this.legR;const leg=(g,s)=>{const ss=s*sw;g.th.rotation.x=ss*A*dirF*.9;g.th.rotation.z=-ss*A*dirS*.45;g.kn.rotation.x=-Math.max(0,Math.sin(p+(s>0?0:Math.PI)+.9))*A*1.25-.05;};
  leg(L,1);leg(R,-1);const a=st.air;L.th.rotation.x+=-.6*a;L.kn.rotation.x+=-1.1*a;R.th.rotation.x+=.15*a;R.kn.rotation.x+=-.6*a;
  this.hips.position.y=.98-Math.abs(Math.cos(p))*.05*run;this.hips.rotation.x=0;
  this.spine.rotation.set(.08*run+f.pitch*.35,sw*.1*run,-dirS*.06*run);this.chest.rotation.set(f.pitch*.4-st.kick*.08,0,0);this.head.rotation.set(f.pitch*.25,0,0);
  this.armR.sh.rotation.set(-.85-st.kick*.15,0,-.12);this.armR.el.rotation.set(-.85,0,-.2);this.armL.sh.rotation.set(-1.15,0,.5);this.armL.el.rotation.set(-.6,0,.35);
  if(st.cast>0){const k=Math.sin(st.cast*Math.PI);this.armL.sh.rotation.x-=k*1.2;this.armL.sh.rotation.z-=k*.4;}
  if(f.meleeT>0){const k=Math.sin(Math.min(1,f.meleeT/.35)*Math.PI);this.armR.sh.rotation.x-=k*.8;this.armL.sh.rotation.x-=k*.6;this.chest.rotation.y=-k*.4;}
  if(this.gun)this.gun.position.z=st.kick*.06;
  if(this.halo){this.halo.position.y=.36+Math.sin(t*2.2)*.015;this.halo.rotation.z=t*.6;}
  for(const w of this.wings){const sx=Math.sign(w.position.x);w.rotation.z=sx*(-.35-(f.flyT>0?.5:0)-a*.25)+Math.sin(t*1.8)*.03;w.rotation.y=sx*(.15+Math.sin(t*1.3)*.04);}
  if(this.cape){this.cape.rotation.x=cl(.12+spd*.06+a*.3,0,.9)+Math.sin(t*3+p)*.03;}
  // shell: hits + buffs
  const U=this.SU;U.uT.value=t;U.uHit.value=Math.max(0,U.uHit.value-dt*2.4);let bf=0;
  if(f.ampT>0){bf=.7;U.uBuffC.value.setRGB(2.4,1.7,.4);}else if(f.stunT>0){bf=.9;U.uBuffC.value.setRGB(2.4,2.4,1);}else if(f.speedT>0){bf=.45;U.uBuffC.value.setRGB(.4,2.6,1.6);}else if(f.markT>0){bf=.5;U.uBuffC.value.setRGB(2.4,.4,2.4);}else if(f.invulnT>0){bf=.8;U.uBuffC.value.setRGB(2.6,2.4,1.6);}
  U.uBuff.value=damp(U.uBuff.value,bf,8,dt);this.shell.visible=this.vis&&(U.uHit.value>.01||U.uBuff.value>.02);}
 reveal(on,t){this.xray.visible=on&&!this.dead;if(on)this.XU.uA.value=.75+Math.sin(t*6)*.25;}
 kill(dir,force){this.dead={t:0,v:new V(dir.x*force,3.5+force*.25,dir.z*force),ax:new V(dir.z,0,-dir.x).normalize(),ang:0,av:2.5+force*.25};this.shell.visible=false;this.xray.visible=false;}
 revive(){this.dead=null;this.root.visible=true;this.root.rotation.set(0,0,0);this.body.position.set(0,0,0);this.body.rotation.set(0,0,0);}
 _dead(dt){const d=this.dead;d.t+=dt;d.ang=Math.min(Math.PI/2,d.ang+d.av*dt);d.av+=dt*6;this.body.position.addScaledVector(d.v,dt);d.v.multiplyScalar(Math.exp(-dt*3));d.v.y-=dt*18;
  if(this.body.position.y<0){this.body.position.y=0;d.v.y=0;}this.body.quaternion.setFromAxisAngle(d.ax,d.ang);
  this.legL.kn.rotation.x=damp(this.legL.kn.rotation.x,-.6,4,dt);this.legR.kn.rotation.x=damp(this.legR.kn.rotation.x,-.2,4,dt);this.armR.sh.rotation.x=damp(this.armR.sh.rotation.x,-2.6,3,dt);this.armL.sh.rotation.x=damp(this.armL.sh.rotation.x,.4,3,dt);this.hips.position.y=damp(this.hips.position.y,.75,3,dt);
  this.root.visible=d.t<3.2;}
}
