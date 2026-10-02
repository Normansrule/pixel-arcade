// STARSHIP SUSPECTS — the crew rig: a helmeted spacer with articulated arms and legs, backpack and antenna.
// Procedural animation: walk cycle, idle breathing, working at a console, ghost float, lying body.
import * as THREE from '../vendor/three.module.min.js';
import {fogify} from './world.js';
const G={torso:new THREE.CapsuleGeometry(.24,.14,6,18),belt:new THREE.TorusGeometry(.238,.034,8,28),head:new THREE.SphereGeometry(.23,28,18),
 visor:new THREE.SphereGeometry(.2,28,16),rim:new THREE.TorusGeometry(.17,.018,8,32),pack:new THREE.BoxGeometry(.36,.4,.17),packCap:new THREE.CylinderGeometry(.06,.06,.37,10),
 ant:new THREE.CylinderGeometry(.012,.016,.3,6),tip:new THREE.SphereGeometry(.04,10,8),arm:new THREE.CapsuleGeometry(.068,.2,4,10),glove:new THREE.SphereGeometry(.076,12,8),
 leg:new THREE.CapsuleGeometry(.088,.18,4,10),boot:new THREE.BoxGeometry(.17,.1,.25),badge:new THREE.CircleGeometry(.05,16),shadow:new THREE.CircleGeometry(.38,24),
 puddle:new THREE.CircleGeometry(1,40),bone:new THREE.CylinderGeometry(.03,.03,.12,6)};
G.packCap.rotateZ(Math.PI/2);G.belt.rotateX(Math.PI/2);
const DARK=fogify(new THREE.MeshStandardMaterial({color:0x22262e,roughness:.55,metalness:.4}),{push:.12});
const VISOR=fogify(new THREE.MeshStandardMaterial({color:0x0a1322,roughness:.06,metalness:.95,emissive:0x061428,envMapIntensity:1.6}),{push:.12});
const BLOB=new THREE.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.35,depthWrite:false});

export function makeCrew(css){const c=new THREE.Color(css);const root=new THREE.Group();
 const suit=fogify(new THREE.MeshStandardMaterial({color:c.clone().multiplyScalar(.85),roughness:.5,metalness:.1,envMapIntensity:.45}),{push:.12});
 const glowC=c.clone().lerp(new THREE.Color(1,1,1),.35).multiplyScalar(2.4);const glow=new THREE.MeshBasicMaterial({color:glowC});
 const rimM=new THREE.MeshBasicMaterial({color:new THREE.Color(.55,1.6,2.2)});
 const mesh=(g,m,p,parent)=>{const o=new THREE.Mesh(g,m);if(p)o.position.set(...p);o.castShadow=true;parent.add(o);return o;};
 const hips=new THREE.Group();hips.position.y=.48;root.add(hips);
 const body=new THREE.Group();hips.add(body);
 mesh(G.torso,suit,[0,.26,0],body).scale.set(1,1,.86);mesh(G.belt,DARK,[0,.05,0],body);
 mesh(G.badge,glow,[.1,.42,.212],body).rotation.x=-.12;
 const pack=mesh(G.pack,suit,[0,.33,-.24],body);mesh(G.packCap,DARK,[0,.54,-.24],body);
 mesh(G.ant,DARK,[.12,.7,-.27],body);const tip=mesh(G.tip,glow,[.12,.86,-.27],body);
 const head=new THREE.Group();head.position.y=.74;body.add(head);
 mesh(G.head,suit,[0,0,0],head);const vis=mesh(G.visor,VISOR,[0,.01,.075],head);vis.scale.set(1.02,.72,.72);
 const rim=mesh(G.rim,rimM,[0,.01,.18],head);rim.scale.set(1.08,.74,1);
 const limb=(x,y,len)=>{const p=new THREE.Group();p.position.set(x,y,0);return p;};
 const armL=limb(.29,.5),armR=limb(-.29,.5);body.add(armL,armR);for(const a of[armL,armR]){mesh(G.arm,suit,[0,-.15,0],a);mesh(G.glove,DARK,[0,-.31,0],a);}
 const legL=limb(.115,.02),legR=limb(-.115,.02);hips.add(legL,legR);for(const l of[legL,legR]){mesh(G.leg,suit,[0,-.17,0],l);mesh(G.boot,DARK,[0,-.395,.03],l);}
 const sh=new THREE.Mesh(G.shadow,BLOB);sh.rotation.x=-Math.PI/2;sh.position.y=.015;root.add(sh);
 root.userData={hips,body,head,armL,armR,legL,legR,tip,suit,glow,rimM,shadow:sh,phase:Math.random()*6,spd:0,ghost:false,color:c,css,t:Math.random()*9};
 return root;}

// st: {speed: 0..1, busy, ghost, t}
export function animate(r,dt,st){const u=r.userData;u.t+=dt;const t=u.t;u.spd+=((st.speed||0)-u.spd)*Math.min(1,dt*10);const s=u.spd;
 u.phase+=dt*(4+s*7)*(s>.05?1:0);const ph=u.phase,sw=Math.sin(ph);
 if(st.ghost){u.hips.position.y=.75+Math.sin(t*2.2)*.08;u.legL.rotation.x=.5+Math.sin(t*1.7)*.15;u.legR.rotation.x=.35+Math.sin(t*1.9)*.15;u.armL.rotation.x=-.4+Math.sin(t*2)*.2;u.armR.rotation.x=-.4+Math.cos(t*2)*.2;u.hips.rotation.x=.25*s;return;}
 u.legL.rotation.x=sw*.8*s;u.legR.rotation.x=-sw*.8*s;
 if(st.busy){u.armL.rotation.x=-1.25+Math.sin(t*13)*.1;u.armR.rotation.x=-1.25+Math.cos(t*11)*.1;u.armL.rotation.z=-.15;u.armR.rotation.z=.15;}
 else{u.armL.rotation.x=-sw*.7*s;u.armR.rotation.x=sw*.7*s;u.armL.rotation.z=.08+.05*s;u.armR.rotation.z=-.08-.05*s;}
 u.hips.position.y=.48+Math.abs(Math.cos(ph))*.05*s+Math.sin(t*2.1)*.006;u.hips.rotation.x=.14*s;u.body.rotation.y=Math.sin(ph)*.08*s;
 u.body.scale.set(1+(1-s)*Math.sin(t*2.1)*.006,1-.03*s*Math.abs(Math.sin(ph))+Math.sin(t*2.1)*.008,1);
 u.head.rotation.x=-.08*s+(st.busy?.25:0);u.head.rotation.y=st.busy?0:Math.sin(t*.7)*.15*(1-s);
 const b=(Math.sin(t*3)>.7)?1:.25;u.glow.color.copy(u.color).lerp(new THREE.Color(1,1,1),.35).multiplyScalar(.6+1.8*b);}

// ghost look: translucent glowing suit, no shadows
export function setGhost(r,on){const u=r.userData;if(u.ghost===on)return;u.ghost=on;r.traverse(o=>{if(!o.isMesh)return;if(on){o.userData.mat=o.material;o.material=ghostMat(u.color);o.castShadow=false;}else if(o.userData.mat){o.material=o.userData.mat;o.castShadow=true;}});u.shadow.visible=!on;}
const gm=new Map();function ghostMat(c){const k=c.getHexString();if(!gm.has(k))gm.set(k,new THREE.MeshBasicMaterial({color:c.clone().lerp(new THREE.Color(1,1,1),.5).multiplyScalar(.9),transparent:true,opacity:.32,depthWrite:false,blending:THREE.AdditiveBlending}));return gm.get(k);}

// a fallen crewmate: lying on its back, limbs sprawled, cracked flickering visor, coolant pooling underneath
export function makeBody(css,fx,fz){const r=makeCrew(css);const u=r.userData;u.hips.position.set(0,.2,0);u.hips.rotation.x=-Math.PI/2+.08;
 u.legL.rotation.set(.15,0,.35);u.legR.rotation.set(-.1,0,-.25);u.armL.rotation.set(-.4,0,1.3);u.armR.rotation.set(.2,0,-1.1);u.head.rotation.set(.2,.4,0);
 u.rimM.color.setRGB(2.6,.25,.15);u.shadow.visible=false;
 const pud=new THREE.Mesh(G.puddle,fogify(new THREE.MeshStandardMaterial({color:0x3a0606,roughness:.06,metalness:.2,transparent:true,opacity:.92}),{push:0}));pud.rotation.x=-Math.PI/2;pud.position.set(0,.02,.15);pud.scale.setScalar(.01);r.add(pud);
 r.rotation.y=Math.atan2(fx,fz)+Math.PI;r.userData.puddle=pud;r.userData.bodyT=0;return r;}
export function animateBody(r,dt){const u=r.userData;u.bodyT+=dt;const k=Math.min(1,u.bodyT/2.5);u.puddle.scale.setScalar(.2+.75*(1-(1-k)**3));u.rimM.color.setRGB(Math.random()<.08?.2:2.6,.25,.15);}
