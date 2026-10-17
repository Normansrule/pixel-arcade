// STARWARDEN — procedural weapon models for every archetype (element glow + rarity finish) and the animated first-person viewmodel.
import * as THREE from '../vendor/three.module.min.js';
import {V,cl,damp,ctex,merge,M4} from './util.js';
import {ARCH,EL} from './loot.js';

let MS=null;
function mats(){if(MS)return MS;const std=o=>new THREE.MeshStandardMaterial(o);
 MS={body:std({color:0x4a505c,roughness:.38,metalness:.5}),dark:std({color:0x24272e,roughness:.5,metalness:.4}),light:std({color:0x8a92a2,roughness:.34,metalness:.5}),
  grip:std({color:0x1d2026,roughness:.85,metalness:.1}),ivory:std({color:0xd8d2c2,roughness:.38,metalness:.2}),gold:std({color:0xd8a640,roughness:.22,metalness:1}),plum:std({color:0x5a4270,roughness:.32,metalness:.5}),
  steel:std({color:0x9aa3b2,roughness:.25,metalness:1}),glove:std({color:0x2a2d33,roughness:.75,metalness:.2}),armor:std({color:0x56627a,roughness:.32,metalness:.6})};for(const k in MS)MS[k].envMapIntensity=.9;return MS;}
const glowM=(c,k=1.6)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k)});
function build(parts){const g=new THREE.Group(),by=new Map();for(const[geo,mat,x,y,z,rx=0,ry=0,rz=0,sx=1,sy=1,sz=1]of parts){let a=by.get(mat);if(!a)by.set(mat,a=[]);a.push([geo,M4(x,y,z,rx,ry,rz,sx,sy,sz)]);}
 for(const[m,a]of by){const o=new THREE.Mesh(merge(a),m);g.add(o);}return g;}
const B=(w,h,d)=>new THREE.BoxGeometry(w,h,d),Cy=(r,l,s=12,r2)=>{const g=new THREE.CylinderGeometry(r,r2??r,l,s);g.rotateX(Math.PI/2);return g;};
const cache={};
// it: {a,el,r,x}; returns a group with userData.muzzle and userData.glow (a material)
export function gunModel(it){const M=mats(),a=it.a,col=it.el==='kin'?0xffd9a0:EL[it.el].hex,gl=glowM(col,it.el==='kin'?1.1:1.9);
 const fin=it.r===3?M.gold:it.r===2?M.plum:it.r===1?M.light:M.body,ac=it.r===3?M.gold:it.r>=2?M.steel:M.dark,alt=it.x==='halcyon'||it.x==='whisper'?M.ivory:fin;
 const P=[];let mz=new V(0,0,-.6);
 if(a==='auto'){P.push([B(.11,.15,.6),alt,0,0,-.12],[B(.12,.06,.48),M.dark,0,.1,-.1],[Cy(.034,.38),M.dark,0,.01,-.58],[B(.1,.1,.22),fin,0,-.01,-.46],[B(.08,.21,.1),M.grip,0,-.15,.04,.25],
   [B(.08,.26,.12),M.dark,0,-.17,-.2,-.12],[B(.113,.01,.3),gl,0,.035,-.33],[B(.1,.12,.22),fin,0,.02,.27],[B(.05,.05,.16),ac,0,.15,-.05]);mz.set(0,.01,-.78);}
 else if(a==='pulse'){P.push([B(.1,.13,.74),alt,0,0,-.18],[B(.07,.08,.46),M.dark,0,-.08,-.2],[Cy(.028,.3),M.dark,0,.02,-.66],[Cy(.042,.22),ac,0,.13,-.1],[B(.07,.18,.09),M.grip,0,-.14,.1,.3],
   [B(.07,.14,.1),M.dark,0,-.13,-.12,-.2],[B(.103,.01,.42),gl,0,.0,-.3],[B(.08,.1,.24),fin,0,.01,.3],[Cy(.046,.02),gl,0,.13,-.215]);mz.set(0,.02,-.84);}
 else if(a==='scout'){P.push([B(.09,.12,.86),alt,0,0,-.22],[Cy(.026,.4),M.dark,0,.02,-.82],[Cy(.05,.36),M.dark,0,.14,-.12],[Cy(.055,.03),gl,0,.14,-.31],[B(.07,.19,.09),M.grip,0,-.14,.1,.3],[B(.06,.12,.16),M.dark,0,-.11,-.22],
   [B(.093,.01,.5),gl,0,-.02,-.34],[B(.07,.11,.3),fin,0,.0,.32],[B(.04,.06,.2),ac,0,.07,-.6]);mz.set(0,.02,-1.02);}
 else if(a==='hand'){P.push([B(.08,.12,.38),alt,0,.02,-.12],[Cy(.06,.13,8),M.dark,0,.0,-.04],[Cy(.03,.24),fin,0,.04,-.36],[B(.07,.2,.1),M.grip,0,-.13,.08,.25],[B(.03,.05,.05),ac,0,.1,.04],[B(.083,.01,.26),gl,0,.06,-.18],[Cy(.062,.01,8),gl,0,0,-.11]);mz.set(0,.04,-.5);}
 else if(a==='smg'){P.push([B(.09,.12,.44),alt,0,0,-.06],[Cy(.026,.18),M.dark,0,.01,-.36],[B(.06,.22,.08),M.dark,0,-.17,-.14],[B(.07,.18,.08),M.grip,0,-.13,.08,.25],[B(.06,.06,.2),fin,0,-.02,.22],[B(.093,.01,.24),gl,0,.03,-.1],[B(.04,.04,.12),ac,0,.09,-.05]);mz.set(0,.01,-.46);}
 else if(a==='shot'){P.push([B(.15,.15,.62),fin,0,0,-.1],[Cy(.042,.46),M.dark,-.035,.03,-.52],[Cy(.042,.46),M.dark,.035,.03,-.52],[B(.16,.05,.36),ac,0,.1,-.12],[B(.14,.11,.24),M.grip,0,-.08,-.44],
   [B(.09,.2,.11),M.grip,0,-.15,.08,.3],[B(.153,.012,.3),gl,0,-.03,-.2],[B(.13,.12,.2),alt,0,0,.27]);mz.set(0,.03,-.76);}
 else if(a==='snipe'){P.push([B(.09,.13,.94),alt,0,0,-.26],[Cy(.03,.66),M.steel,0,.02,-.84],[B(.07,.18,.1),M.grip,0,-.14,.08,.3],[B(.08,.1,.22),M.dark,0,-.1,-.24],[Cy(.05,.4),M.dark,0,.15,-.14],[Cy(.06,.03),gl,0,.15,-.35],[B(.08,.1,.26),fin,0,0,.32],[B(.093,.01,.56),gl,0,-.02,-.3]);
  for(let i=0;i<3;i++)P.push([new THREE.TorusGeometry(.055,.01,6,16),ac,0,.02,-.62-i*.1]);mz.set(0,.02,-1.18);}
 else if(a==='fusion'){P.push([B(.12,.15,.66),fin,0,0,-.16],[B(.08,.18,.1),M.grip,0,-.15,.08,.3],[B(.1,.08,.3),M.dark,0,-.1,-.24],[B(.08,.08,.24),alt,0,.0,.28]);
  for(let i=0;i<4;i++)P.push([Cy(.07-i*.008,.035,14),gl,0,.01,-.36-i*.09]);P.push([Cy(.04,.38),M.dark,0,.01,-.48],[B(.123,.01,.34),gl,0,.06,-.1]);mz.set(0,.01,-.72);}
 else if(a==='rocket'){P.push([Cy(.12,.92,16),fin,0,0,-.2],[Cy(.135,.1,16),M.dark,0,0,-.66],[Cy(.135,.12,16),M.dark,0,0,.26],[B(.08,.2,.1),M.grip,0,-.18,.0,.25],[B(.07,.16,.08),M.grip,0,-.17,-.34],[B(.06,.08,.24),ac,-.12,.1,-.24],
   [Cy(.14,.02,16),gl,0,0,-.5],[Cy(.14,.02,16),gl,0,0,.1],[B(.03,.03,.5),gl,0,.125,-.2]);mz.set(0,0,-.74);}
 if(it.r===3){P.push([B(.02,.02,.3),gl,.06,.05,-.2],[B(.02,.02,.3),gl,-.06,.05,-.2]);}
 const g=build(P);g.userData={muzzle:mz,glow:gl,col};return g;}
export function gunFor(it){const k=it.a+it.el+it.r+(it.x||'');if(!cache[k])cache[k]=gunModel(it);const c=cache[k].clone();c.userData=cache[k].userData;return c;}

/* ---------- first-person viewmodel ---------- */
export class Viewmodel{
 constructor(cam){this.root=new THREE.Group();cam.add(this.root);this.hold=new THREE.Group();this.hold.scale.setScalar(.56);this.root.add(this.hold);const M=mats();
  const hand=()=>{const g=new THREE.Group();const a=new THREE.Mesh(new THREE.CapsuleGeometry(.045,.32,4,10),M.armor);a.rotation.x=Math.PI/2;a.position.set(0,0,.24);const h=new THREE.Mesh(new THREE.BoxGeometry(.085,.07,.11),M.glove);g.add(a,h);
   const st=new THREE.Mesh(new THREE.BoxGeometry(.09,.012,.12),glowM(0x5fd8ff));st.position.set(0,.04,.25);g.add(st);g.userData.st=st;return g;};
  this.handR=hand();this.handL=hand();this.hold.add(this.handR,this.handL);
  // ability orb held in the off hand while charging a grenade / super
  this.orb=new THREE.Mesh(new THREE.IcosahedronGeometry(.07,2),new THREE.MeshBasicMaterial({color:new THREE.Color(2,2,2)}));this.orb.visible=false;this.root.add(this.orb);
  const fm=new THREE.MeshBasicMaterial({map:flashTex(),color:new THREE.Color(3,2.4,1.6),transparent:true,blending:THREE.AdditiveBlending,depthWrite:false});
  this.flash=new THREE.Mesh(new THREE.PlaneGeometry(.32,.32),fm);this.flash.visible=false;this.hold.add(this.flash);const fs=this.flash.clone();fs.rotation.y=Math.PI/2;this.flash.add(fs);
  this.light=new THREE.PointLight(0xffc080,0,4,1.6);this.root.add(this.light);
  this.gun=null;this.it=null;this.sw={x:0,y:0};this.t=0;this.kick=0;this.flashT=0;this.bobP=0;this.base=new V(.2,-.2,-.47);this.pos=new V();this.cast=0;this.castCol=new THREE.Color();}
 set(it,clsCol){if(this.gun){this.hold.remove(this.gun);this.gun=null;}this.it=it;if(clsCol){for(const h of[this.handR,this.handL])h.userData.st.material.color.set(clsCol).multiplyScalar(1.8);}if(!it)return;
  this.vc=this.vc||{};const g=this.vc[it.u]||(this.vc[it.u]=gunModel(it));this.gun=g;this.hold.add(g);const A=ARCH[it.a];this.light.color.set(g.userData.col);this.flash.material.color.set(g.userData.col).lerp(new THREE.Color(1,1,1),.45).multiplyScalar(3);
  const hp={auto:[[0,-.12,.06],[0,-.05,-.42]],pulse:[[0,-.12,.1],[0,-.07,-.38]],scout:[[0,-.12,.1],[0,-.06,-.4]],hand:[[0,-.12,.08],[-.03,-.14,.06]],smg:[[0,-.12,.08],[0,-.15,-.14]],shot:[[0,-.13,.1],[0,-.06,-.44]],
   snipe:[[0,-.12,.1],[0,-.08,-.3]],fusion:[[0,-.13,.1],[0,-.08,-.3]],rocket:[[0,-.15,.02],[0,-.14,-.34]]}[it.a];
  const OF={rocket:[.05,.025,.02,.8],shot:[.02,-.01,0,.92],snipe:[.02,0,-.02,.92],fusion:[.02,-.01,0,.92],hand:[-.01,.02,-.05,1.1],smg:[0,.01,-.03,1]}[it.a]||[0,0,0,1];this.off=new V(OF[0],OF[1],OF[2]);this.hold.scale.setScalar(.56*OF[3]);
  this.handR.position.set(...hp[0]);this.handR.rotation.set(-.15,.05,0);this.handL.position.set(...hp[1]);this.handL.rotation.set(-.1,.25,.4);this.handL.position.x-=.04;this.A=A;}
 fire(){this.kick=1;this.flashT=.05;this.flash.rotation.z=Math.random()*3;}
 // o: {dt,mdx,mdy,speed,ground,sprint,slide,air,reload,swap,melee,zoom,charge,scope,cast(0..1),castCol,super}
 update(o){const dt=o.dt;this.t+=dt;const g=this.gun;
  this.sw.x=damp(this.sw.x,cl(-o.mdx*.0016,-.06,.06),9,dt);this.sw.y=damp(this.sw.y,cl(o.mdy*.0016,-.05,.05),9,dt);
  if(o.ground&&o.speed>.5)this.bobP+=dt*o.speed*(o.sprint?1.15:1.35);const bA=o.ground?Math.min(1,o.speed/8)*(o.sprint?1.6:1):0;
  const A=this.A||ARCH.auto;this.kick=Math.max(0,this.kick-dt*(A.kick>1.5?4:11));const k=this.kick*(A.kick||1);
  const z=o.zoom*(A.scope?0:1),sp=o.sprint&&!o.slide?1:0;this.spr=damp(this.spr||0,sp,8,dt);this.sld=damp(this.sld||0,o.slide?1:0,10,dt);this.air=damp(this.air||0,o.air?1:0,6,dt);this.sup=damp(this.sup||0,o.super?1:0,6,dt);
  const p=this.pos.copy(this.base);if(this.off)p.add(this.off);p.x+=this.sw.x-z*.16+Math.cos(this.bobP)*.012*bA-this.spr*.04;p.y+=this.sw.y+Math.abs(Math.sin(this.bobP))*.012*bA+z*.07-this.spr*.05-this.air*.02-this.sld*.03-this.sup*.45;p.z+=k*.06+z*.08;
  let rx=k*.12+this.spr*.4-this.air*.05-this.sup*.6,ry=this.sw.x*2+this.spr*.75,rz=Math.cos(this.bobP)*.02*bA+this.sld*.35+this.spr*.2;
  if(o.reload>=0){const r=o.reload,dip=Math.sin(Math.min(1,r)*Math.PI);p.y-=dip*.12;rx-=dip*.5;rz+=dip*.6;}
  if(o.swap>0){p.y-=o.swap*.35;rx-=o.swap*.9;}
  if(o.melee>0){const m=Math.sin(o.melee*Math.PI);p.z-=.22*m;rx+=.25*m;rz-=.6*m;p.x-=.08*m;}
  this.hold.position.copy(p);this.hold.rotation.set(rx,ry,rz);this.root.visible=!(o.scope&&o.zoom>.6);
  // charge glow (fusion), element pulse
  if(g){const c=g.userData.col;const pulse=A.charge?.8+o.charge*3:1.6+Math.sin(this.t*3)*.25;g.userData.glow.color.set(c).multiplyScalar(pulse);}
  this.flashT-=dt;const fv=this.flashT>0&&g;this.flash.visible=!!fv;if(fv){this.flash.position.copy(g.userData.muzzle);this.flash.scale.setScalar(A.pel||A.proj?1.6:1);}
  this.light.intensity=fv?1.6:0;this.light.position.set(p.x,p.y,p.z-.6);
  // ability orb in the left hand
  const cv=Math.max(o.cast||0,this.sup);this.orb.visible=cv>.02;if(this.orb.visible){this.orb.material.color.copy(o.castCol||this.castCol).multiplyScalar(.75+cv*.3+Math.sin(this.t*20)*.1);this.orb.position.set(-.2+this.sup*.03,-.17+cv*.03,-.42);this.orb.scale.setScalar(.45+cv*.35+Math.sin(this.t*14)*.04);this.orb.rotation.set(this.t*3,this.t*4,0);}}}
function flashTex(){return ctex(128,128,(x,w,h)=>{x.translate(w/2,h/2);for(let i=0;i<6;i++){x.rotate(Math.PI/3);const g=x.createLinearGradient(0,0,0,-h/2);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(1,'rgba(255,200,120,0)');x.fillStyle=g;x.beginPath();x.moveTo(-7,0);x.lineTo(0,-h/2+4);x.lineTo(7,0);x.fill();}
 const r=x.createRadialGradient(0,0,0,0,0,w/3);r.addColorStop(0,'rgba(255,255,255,1)');r.addColorStop(1,'rgba(255,180,90,0)');x.fillStyle=r;x.beginPath();x.arc(0,0,w/3,0,7);x.fill();},{clamp:true});}
